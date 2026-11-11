'use strict';
/* صفحة «violations» (viewViolations) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['violations'] = function (S) {
  const { $, SF, VIOL_COLS, api, askYesNo, can, downloadXlsx, dt, esc, gridImportModal, head, route, shell, state, toast, violChip } = S;
  /* تحديث حالة مخالفة: محاسب الفرع يسوّيها، ومدير الحركة يصحح السائق أو يلغيها */
  function violationModal(x, res, done) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const opts = res.statuses.filter((s) => res.editor || s !== 'ملغاة');
    bg.innerHTML = `<div class="modal" style="max-width:620px;width:96%"><h3 style="margin-top:0">مخالفة <bdi>${esc(x.plate)}</bdi> — ${esc(SF.fmtDate(x.date))}</h3>
      <dl class="kv"><dt>رقم المخالفة</dt><dd>${esc(x.number || '—')}</dd><dt>النوع</dt><dd>${esc(x.type || '—')}</dd><dt>المبلغ</dt><dd><b>${esc(SF.fmtNum(x.amount))}</b> ريال</dd>
        <dt>السائق المتسبب</dt><dd>${esc(x.driver || 'غير معروف')}${x.driverIqama ? ` — ${esc(x.driverIqama)}` : ''}<br><small class="muted">${esc(x.source || '')}</small></dd><dt>الفرع</dt><dd>${esc(x.branch)}</dd></dl>
      ${res.editor ? `<div class="grid2"><div class="field"><label>تصحيح اسم السائق</label><input class="in" id="vmDrv" value="${esc(x.driver || '')}"></div><div class="field"><label>هويته / إقامته</label><input class="in" id="vmIq" value="${esc(x.driverIqama || '')}"></div></div>` : ''}
      <div class="field"><label>الحالة</label><select class="in" id="vmSt">${opts.map((s) => `<option${s === x.status ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
      <div class="field"><label>ملاحظة</label><textarea class="in" id="vmNote" rows="2" placeholder="مطلوبة عند الاعتراض أو الإلغاء"></textarea></div>
      <div id="vmErr"></div>
      <div class="row" style="margin-top:12px;gap:8px"><button class="btn primary" id="vmSave">💾 حفظ</button><button class="btn ghost" data-x>إغلاق</button></div>
      ${
        (x.history || []).length
          ? `<h4 class="b-sec">سجل المخالفة</h4><ul class="timeline">${x.history
              .slice()
              .reverse()
              .map(
                (h) =>
                  `<li><b>${esc(h.status)}</b><div class="when">${esc(h.by)} — ${esc(dt(h.at))}</div>${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}</li>`,
              )
              .join('')}</ul>`
          : ''
      }</div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#vmSave', bg).onclick = async () => {
      const body = { status: $('#vmSt', bg).value, note: $('#vmNote', bg).value };
      if (res.editor) {
        body.driver = $('#vmDrv', bg).value;
        body.driverIqama = $('#vmIq', bg).value;
      }
      try {
        await api('PUT', `/api/violations/${x.id}`, body);
        bg.remove();
        toast('تم حفظ المخالفة');
        done();
      } catch (err) {
        $('#vmErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  /* المخالفات التي لم تُسوَّ بعد (ومنها المعتمدة للسداد ولم تُسدَّد) */
  const OPEN = ['محالة للفرع', 'معتمدة للسداد', 'معترض عليها'];
  /* طلب الموافقة على السداد: رابط الطلب القائم، أو زر رفعه للمخالفة المحالة للفرع */
  function payBtn(x, res) {
    const r = (res.payReqs || {})[x.id];
    if (r) return ` <a class="btn sm" href="#/req/${r.id}" title="طلب الموافقة على السداد">🧾 <bdi dir="ltr">${esc(r.serial)}</bdi></a>`;
    if (!res.canPay || x.status !== 'محالة للفرع') return '';
    return ` <a class="btn sm" href="#/new/violationPay?prefill=${encodeURIComponent(JSON.stringify({ violationId: x.id }))}" title="طلب الموافقة على سداد المخالفة">💳 طلب سداد</a>`;
  }
  function dedBtn(x) {
    const reason = `مخالفة مرورية${x.number ? ` رقم ${x.number}` : ''} بتاريخ ${SF.fmtDate(x.date)} على المركبة ${x.plate}${x.type ? ` (${x.type})` : ''}`;
    const pf = { name: x.driver, iqama: x.driverIqama, value: x.amount, reason };
    return ` <a class="btn sm" href="#/new/deduction?prefill=${encodeURIComponent(JSON.stringify(pf))}" title="نموذج خصم من المدير المباشر بقيمة المخالفة">📝 خصم</a>`;
  }
  function violTr(x, res, canDed) {
    return `<tr>
        <td>${esc(SF.fmtDate(x.date))}${x.time ? ` <small class="muted">${esc(x.time)}</small>` : ''}</td><td><b><bdi>${esc(x.plate)}</bdi></b></td><td>${esc(x.number || '—')}</td><td>${esc(x.type || '—')}</td>
        <td><b>${esc(SF.fmtNum(x.amount))}</b></td><td>${x.driver ? esc(x.driver) : '<span class="chip returned">غير معروف</span>'}<br><small class="muted">${esc(x.source || '')}</small></td><td>${esc(x.branch)}</td><td>${violChip(x.status)}</td>
        <td style="white-space:nowrap"><button class="btn sm" data-vm="${x.id}">✏️ الحالة</button>${payBtn(x, res)}${canDed && x.driver ? dedBtn(x) : ''}${res.editor ? ` <button class="btn sm ghost" data-vdel="${x.id}" title="حذف">🗑️</button>` : ''}</td></tr>`;
  }
  const VIOL_XLS = [
    ['التاريخ', (x) => x.date],
    ['الوقت', (x) => x.time],
    ['رقم اللوحة', (x) => x.plate],
    ['رقم المخالفة', (x) => x.number],
    ['النوع', (x) => x.type],
    ['المبلغ', (x) => Number(x.amount)],
    ['الموقع', (x) => x.location],
    ['السائق المتسبب', (x) => x.driver],
    ['هوية السائق', (x) => x.driverIqama],
    ['مصدر تحديد السائق', (x) => x.source],
    ['الفرع', (x) => x.branch],
    ['الحالة', (x) => x.status],
    ['طلب السداد', (x, res) => ((res.payReqs || {})[x.id] || {}).serial || ''],
  ];

  async function viewViolations(query) {
    const res = await api('GET', '/api/violations');
    const main = shell('', '#/violations');
    const list = res.list;
    const open = list.filter((x) => OPEN.includes(x.status));
    const sum = (xs) => SF.fmtNum(xs.reduce((a, x) => a + Number(x.amount || 0), 0)) || 0;
    const canDed = can('new') && SF.formAllowed(state.user, 'deduction');
    const branches = [...new Set(list.map((x) => x.branch).filter(Boolean))].sort();
    main.innerHTML = `${head(
      '⚠ المخالفات المرورية',
      `${list.length} مخالفة${state.user.role === 'accountant' && state.user.branch ? ` — فرع ${esc(state.user.branch)}` : ''}`,
      `${res.editor ? '<button class="btn primary" id="vlAdd">📥 رفع مخالفات (Excel)</button>' : ''}<button class="btn" id="vlXls">📊 Excel</button>`,
    )}
      <div class="stats" style="margin-bottom:14px">
        <div class="stat${open.length ? ' hi' : ''}"><div class="n">${open.length}</div><div class="l">لم يسوّها أحد بعد (${sum(open)} ريال)</div></div>
        <div class="stat"><div class="n">${list.filter((x) => x.status === 'مخصومة من الموظف').length}</div><div class="l">مخصومة من الموظف</div></div>
        <div class="stat"><div class="n">${list.filter((x) => x.status === 'مسددة').length}</div><div class="l">مسددة</div></div>
        <div class="stat${list.some((x) => !x.driver) ? ' hi' : ''}"><div class="n">${list.filter((x) => !x.driver).length}</div><div class="l">السائق غير معروف</div></div>
      </div>
      <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <input class="in" id="vlQ" placeholder="بحث: اللوحة، السائق، رقم المخالفة..." style="flex:1;min-width:200px" value="${esc(query.plate || '')}">
        <select class="in" id="vlB" style="width:auto"><option value="">كل الفروع</option>${branches.map((b) => `<option>${esc(b)}</option>`).join('')}</select>
        <select class="in" id="vlS" style="width:auto"><option value="">كل الحالات</option><option value="open">لم يسوّها أحد بعد</option>${res.statuses.map((s) => `<option>${esc(s)}</option>`).join('')}</select>
        <label class="check">من <input class="in" type="date" id="vlF" style="width:auto"></label><label class="check">إلى <input class="in" type="date" id="vlT" style="width:auto"></label></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>التاريخ</th><th>رقم اللوحة</th><th>رقم المخالفة</th><th>النوع</th><th>المبلغ</th><th>السائق المتسبب</th><th>الفرع</th><th>الحالة</th><th></th></tr></thead><tbody id="vlRows"></tbody></table></div></div>`;
    let shown = [];
    const rows = () => {
      const q = $('#vlQ').value.trim(),
        b = $('#vlB').value,
        s = $('#vlS').value,
        f = $('#vlF').value,
        t = $('#vlT').value;
      shown = list.filter(
        (x) =>
          (!b || x.branch === b) &&
          (!s || (s === 'open' ? OPEN.includes(x.status) : x.status === s)) &&
          (!f || x.date >= f) &&
          (!t || x.date <= t) &&
          (!q || [x.plate, x.driver, x.number, x.type, x.driverIqama].join(' ').includes(q)),
      );
      $('#vlRows').innerHTML =
        shown.map((x) => violTr(x, res, canDed)).join('') ||
        '<tr><td colspan="9" class="muted" style="text-align:center;padding:24px">لا توجد مخالفات</td></tr>';
    };
    ['input', 'change'].forEach((ev) => ['#vlQ', '#vlB', '#vlS', '#vlF', '#vlT'].forEach((s) => $(s).addEventListener(ev, rows)));
    rows();
    wireViolations(list, res);
    const sheet = () => [VIOL_XLS.map(([l]) => l), ...shown.map((x) => VIOL_XLS.map(([, f]) => f(x, res)))];
    $('#vlXls').onclick = () => downloadXlsx('المخالفات-المرورية.xlsx', sheet(), 'المخالفات');
  }
  /* من viewViolations: $('#vlRows').onclick = async (e) => { ... */
  function wireViolations(list, res) {
    $('#vlRows').onclick = async (e) => {
      const b = e.target.closest('[data-vm]'),
        d = e.target.closest('[data-vdel]');
      if (b)
        violationModal(
          list.find((x) => x.id === b.dataset.vm),
          res,
          () => route(),
        );
      if (d) {
        if (!(await askYesNo('حذف المخالفة؟ تنتقل إلى سلة المحذوفات.'))) return;
        try {
          await api('DELETE', `/api/violations/${d.dataset.vdel}`);
          toast('تم الحذف');
          route();
        } catch (err) {
          toast(err.message, true);
        }
      }
    };
    if ($('#vlAdd'))
      $('#vlAdd').onclick = () =>
        gridImportModal({
          title: 'رفع المخالفات المرورية',
          cols: VIOL_COLS,
          template: window.SES_FLEET.violationsFile(),
          sample: window.SES_FLEET.VIOL_SAMPLE,
          guide: window.SES_FLEET.VIOL_GUIDE,
          hint: 'صف لكل مخالفة: الصق من Excel (Ctrl+V في أول خانة) أو ارفع ملف Excel بنفس عناوين القالب. رقم اللوحة يجب أن يكون مسجلاً في أسطول السيارات. يحدد النظام السائق المتسبب تلقائياً من محضر التسليم الساري يوم المخالفة، ويحيل كل مخالفة لمحاسب فرعها بإشعار.',
          save: (rows) => api('POST', '/api/violations/bulk', { rows }),
          done: (r) => {
            toast(`تم تسجيل ${r.added} مخالفة وإحالتها للفروع${r.unknownDriver ? ` (${r.unknownDriver} بدون سائق معروف)` : ''}`);
            route();
          },
        });
  }

  return { viewViolations };
};
