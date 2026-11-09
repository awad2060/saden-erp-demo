'use strict';
/* صفحة «payroll» (viewPayroll، viewPayrun، viewPayslips) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['payroll'] = function (S) {
  const { $, $$, PR_CLS, SF, api, app, askYesNo, downloadCsv, dt, esc, head, isAdmin, money, prMonth, shell, state, toast, today } = S;
  /* ---------- البدلات المعتمدة وشهر صرفها في المسير ---------- */
  async function allowancesModal() {
    const d = await api('GET', '/api/payroll-allowances');
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    let f = 'pending';
    const draw = () => {
      const L = d.list.filter((x) => (f === 'pending' ? !x.payMonth : f === 'set' ? x.payMonth && !x.paid : true));
      bg.innerHTML = `<div class="modal" style="max-width:980px;width:96%"><h3 style="margin-top:0">البدلات المعتمدة وشهر صرفها في المسير</h3>
        <div class="hint">يحدد مدير إدارة الرواتب شهر صرف كل بدل معتمد، فيدخل تلقائياً في مسير ذلك الشهر (ضمن الإضافات). البدل الداخل في مسير معتمد لا يتغير شهره.</div>
        <div class="tabs">${[
          ['pending', 'بدون شهر صرف', d.list.filter((x) => !x.payMonth).length],
          ['set', 'محدد الشهر', d.list.filter((x) => x.payMonth && !x.paid).length],
          ['all', 'الكل', d.list.length],
        ]
          .map(([k, l, n]) => `<a href="javascript:void 0" data-f="${k}" class="${f === k ? 'on' : ''}">${l} (${n})</a>`)
          .join('')}</div>
        ${d.canSet ? `<div class="row" style="gap:8px;margin:8px 0"><label class="check"><input type="checkbox" id="alAll"> تحديد الكل</label><input class="in" type="month" id="alM" value="${today().slice(0, 7)}" style="width:auto"><button class="btn primary sm" id="alSet">تعيين شهر الصرف للمحدد</button><button class="btn sm" id="alClr">إلغاء الشهر للمحدد</button></div>` : ''}
        <div class="tbl-wrap" style="max-height:55vh;overflow:auto"><table class="tbl"><thead><tr>${d.canSet ? '<th></th>' : ''}<th>الطلب</th><th>النوع</th><th>الموظف</th><th>الفرع</th><th>المبلغ</th><th>اعتُمد</th><th>شهر الصرف</th></tr></thead><tbody>
        ${L.map((x) => `<tr>${d.canSet ? `<td>${x.paid ? '' : `<input type="checkbox" data-al="${x.id}">`}</td>` : ''}<td><a href="#/req/${x.id}" target="_blank">${esc(x.serial)}</a></td><td>${esc(x.title)}</td><td>${esc(x.name)}<div class="muted" style="font-size:12px">${esc(x.iqama)}</div></td><td>${esc(x.branch)}</td><td class="num">${esc(money(x.amount))}</td><td>${esc(x.approvedAt ? SF.fmtDate(x.approvedAt.slice(0, 10)) : '')}</td><td>${x.payMonth ? `<b>${esc(prMonth(x.payMonth))}</b>${x.paid ? ' <span class="chip approved">صُرف</span>' : ''}` : '<span class="chip pending">غير محدد</span>'}</td></tr>`).join('') || `<tr><td colspan="8" class="empty">لا يوجد</td></tr>`}</tbody></table></div>
        <div class="row" style="margin-top:12px"><button class="btn" data-x>إغلاق</button></div></div>`;
      $('[data-x]', bg).onclick = () => bg.remove();
      $$('[data-f]', bg).forEach((a) => {
        a.onclick = () => {
          f = a.dataset.f;
          draw();
        };
      });
      if ($('#alAll', bg))
        $('#alAll', bg).onchange = (e) =>
          $$('[data-al]', bg).forEach((c) => {
            c.checked = e.target.checked;
          });
      const setM = async (month) => {
        const ids = $$('[data-al]', bg)
          .filter((c) => c.checked)
          .map((c) => c.dataset.al);
        if (!ids.length) {
          toast('حدد بدلاً واحداً على الأقل', true);
          return;
        }
        try {
          const r = await api('POST', '/api/payroll-allowances', { ids, month });
          toast(`تم تحديث ${r.updated} بدل`);
          Object.assign(d, await api('GET', '/api/payroll-allowances'));
          draw();
        } catch (err) {
          toast(err.message, true);
        }
      };
      if ($('#alSet', bg)) $('#alSet', bg).onclick = () => setM($('#alM', bg).value);
      if ($('#alClr', bg)) $('#alClr', bg).onclick = () => setM('');
    };
    document.body.appendChild(bg);
    draw();
  }

  async function viewPayroll() {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/payroll');
    const d = await api('GET', '/api/payroll');
    const m0 = today().slice(0, 7);
    setTimeout(() => {
      if ($('#prAllow')) $('#prAllow').onclick = () => allowancesModal();
    }, 0);
    main.innerHTML = `${head('مسيرات الرواتب', 'المسير الشهري من سجل الموظفين والطلبات المعتمدة، واعتماده، والقسائم وملف حماية الأجور والقيد المحاسبي', `<button class="btn" id="prAllow">💼 البدلات المعتمدة</button>${d.canPrep ? '<button class="btn primary" id="prNew">➕ مسير جديد</button>' : ''}`)}
      <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الشهر</th><th>الفرع</th><th>الموظفون</th><th>إجمالي الرواتب</th><th>الإضافات</th><th>الاستقطاعات</th><th>الصافي</th><th>الحالة</th><th>أعده</th></tr></thead><tbody>
        ${d.list.map((p) => `<tr class="click" data-go="#/payroll/${p.id}"><td><b>${esc(prMonth(p.month))}</b></td><td>${esc(p.branch || 'كل الفروع')}</td><td class="num">${p.totals.count}</td><td class="num">${esc(money(p.totals.gross))}</td><td class="num">${esc(money(p.totals.totalAdd))}</td><td class="num">${esc(money(p.totals.totalDed))}</td><td class="num"><b>${esc(money(p.totals.net))}</b></td><td><span class="chip ${PR_CLS[p.status]}">${esc(p.statusLabel)}</span></td><td>${esc(p.createdByName)}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">لا توجد مسيرات بعد</td></tr>'}</tbody></table></div></div>`;
    $$('[data-go]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = tr.dataset.go;
      };
    });
    if ($('#prNew'))
      $('#prNew').onclick = () => {
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = `<form class="modal" style="max-width:460px" novalidate><h3 style="margin-top:0">➕ مسير رواتب جديد</h3>
        <div class="field"><label>الشهر *</label><input class="in" type="month" name="month" value="${m0}"></div>
        <div class="field"><label>الفرع</label><select class="in" name="branch"><option value="">كل الفروع (مسير واحد)</option>${d.branches.map((b) => `<option>${esc(b)}</option>`).join('')}</select></div>
        <div class="hint">يبني النظام المسير من رواتب سجل الموظفين النشطين، ومعها قسط السلف المستحق والخصومات المعتمدة والإجازات بدون راتب، ثم تكمل الإضافي والغياب والتعديلات.</div>
        <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">إنشاء المسير</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
        document.body.appendChild(bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        $('form', bg).onsubmit = async (e) => {
          e.preventDefault();
          const f = e.target;
          try {
            const p = await api('POST', '/api/payroll', { month: f.month.value, branch: f.branch.value });
            bg.remove();
            location.hash = `#/payroll/${p.id}`;
          } catch (err) {
            $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      };
  }

  async function viewPayrun(id) {
    /* حالة الصفحة: ما يتغير بعد العرض (p) */
    const st = {};
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/payroll');
    st.p = await api('GET', `/api/payroll/${id}`);
    const draw = () => {
      const T = st.p.totals,
        edit = st.p.canPrep && st.p.status === 'draft';
      const inp = (L, k, w) =>
        edit
          ? `<input class="in pr-in" type="number" min="0" step="0.01" data-e="${L.empId}" data-k="${k}" value="${L[k] || ''}" style="width:${w || 80}px">`
          : Number(L[k])
            ? esc(money(L[k]))
            : '<span class="muted">—</span>';
      renderDraw(T, edit, inp, main, st);
      wirePrQ(main);
      const act = async (a, ask) => {
        let note = '';
        if (ask) {
          note = prompt(ask) || '';
          if (!note) return;
        }
        try {
          st.p = await api('POST', `/api/payroll/${st.p.id}/status`, { action: a, note });
          toast('تم');
          draw();
        } catch (err) {
          toast(err.message, true);
        }
      };
      const collectEd = () => {
        const m = {};
        $$('[data-e]', main).forEach((i) => {
          (m[i.dataset.e] = m[i.dataset.e] || { empId: i.dataset.e })[i.dataset.k] = i.value;
        });
        return Object.values(m);
      };
      wireDraw3(act, collectEd, draw, st);
      wireDraw(act);
      drawPart(st);
      const fname = (s) => `${s}_${st.p.month}${st.p.branch ? `_${st.p.branch}` : ''}.csv`;
      /* ملف حماية الأجور: الأعمدة المعتادة لملف الرفع (طابقها مع قالب مُدد الحالي قبل الرفع) */
      wireDraw2(fname, st);
      return wirePrXls(fname, st);
    };
    draw();
  }
  /* محتوى draw (HTML) */
  /* ملاحظة خلية الإضافي: الساعات من كشف الإضافي المعتمد، أو من الحضور، أو «يدوي» */
  function payrollOtNote(L) {
    if (L.otSheetHours != null && !L.otManual) return `<div class="muted" style="font-size:11px">${L.otSheetHours} ساعة (كشف معتمد)</div>`;
    if (L.att && !L.otManual && L.att.otHours) return `<div class="muted" style="font-size:11px">${L.att.otHours} ساعة (الحضور)</div>`;
    return L.otManual ? '<div class="muted" style="font-size:11px">يدوي</div>' : '';
  }
  /* ملاحظات خلية الغياب: قيمة الخصم، ومصدرها الحضور (والتأخير)، ونقص ساعات الدوام المرن */
  function payrollAbsenceNotes(L) {
    const ded = L.absentDed ? `<div class="muted" style="font-size:11px">${esc(money(L.absentDed))}</div>` : '';
    const att =
      L.att && !L.absManual
        ? `<div class="muted" style="font-size:11px">من الحضور${L.att.lateMin ? ` · تأخير ${L.att.lateMin} د` : ''}</div>`
        : '';
    const short = L.shortDed
      ? `<div style="font-size:11px;color:var(--bad)" title="الدوام المرن: نقص عن الساعات المطلوبة">نقص ساعات ${Math.floor(L.shortMin / 60)}:${String(L.shortMin % 60).padStart(2, '0')} = ${esc(money(L.shortDed))}</div>`
      : '';
    return ded + att + short;
  }
  function renderDraw(T, edit, inp, main, st) {
    main.innerHTML = `${head(`مسير رواتب ${esc(prMonth(st.p.month))}`, `${esc(st.p.branch || 'كل الفروع')} — <span class="chip ${PR_CLS[st.p.status]}">${esc(st.p.statusLabel)}</span>${st.p.approvedByName ? ` — اعتمده ${esc(st.p.approvedByName)} ${esc(dt(st.p.approvedAt))}` : ''}`, '<a class="btn ghost" href="#/payroll">رجوع للمسيرات</a>')}
        <div class="pr-kpis">${[
          ['الموظفون', T.count, ''],
          ['إجمالي الرواتب', money(T.gross), ''],
          ['الإضافات', money(T.totalAdd), ''],
          ['الاستقطاعات', money(T.totalDed), ''],
          ['صافي الرواتب', money(T.net), 'ok'],
        ]
          .map(([l, v, c]) => `<div class="card pr-k ${c}"><small>${l}</small><b>${esc(v)}</b></div>`)
          .join('')}</div>
        ${T.negative || T.noIban ? `<div class="emp-alerts" style="margin-bottom:12px">${T.negative ? `<div class="emp-al bad">⛔ ${T.negative} موظف صافي راتبه بالسالب — راجع الاستقطاعات</div>` : ''}${T.noIban ? `<div class="emp-al warn">⚠ ${T.noIban} موظف بدون آيبان صحيح في سجل الموظفين (مطلوب لملف حماية الأجور)</div>` : ''}</div>` : ''}
        <div class="card pr-actions">
          ${edit ? '<button class="btn primary" id="prSave">💾 حفظ التعديلات</button><button class="btn" id="prRebuild">🔄 تحديث من السجل والطلبات</button><button class="btn ok" id="prSubmit">📤 إرسال للاعتماد</button><button class="btn bad" id="prDel">🗑 حذف المسودة</button>' : ''}
          ${st.p.canAppr && st.p.status === 'submitted' ? '<button class="btn ok" id="prApprove">✔ اعتماد المسير</button><button class="btn warn" id="prReject">↩ إعادة للتعديل</button>' : ''}
          ${st.p.status === 'approved' ? '<button class="btn ok" id="prPaid">💳 تم الصرف</button>' : ''}
          ${isAdmin() && ['submitted', 'approved', 'paid'].includes(st.p.status) ? '<button class="btn ghost" id="prReopen">↺ إعادة فتح</button>' : ''}
          <span class="pr-sep"></span>
          <a class="btn" href="#/payslips/${st.p.id}" target="_blank">🧾 قسائم الرواتب</a><button class="btn" id="prWps">⬇ ملف حماية الأجور (مُدد)</button><button class="btn" id="prGl">⬇ القيد المحاسبي</button><button class="btn" id="prXls">⬇ Excel المسير</button>
          <input class="in" id="prQ" placeholder="بحث بالاسم أو الرقم الوظيفي أو الهوية..." style="flex:1;min-width:200px">
        </div>
        <div class="card" style="padding:0"><div class="tbl-wrap pr-wrap"><table class="tbl pr-tbl"><thead><tr><th>#</th><th>الموظف</th><th>الأيام</th><th>الأساسي</th><th>السكن</th><th>النقل</th><th>بدلات أخرى</th><th>الإجمالي</th><th>إضافي</th><th>إضافات أخرى</th><th>التأمينات</th><th>حسميات ثابتة</th><th>بدون راتب</th><th>أيام غياب</th><th>السلف</th><th>خصومات معتمدة</th><th>خصومات أخرى</th><th>الصافي</th><th>ملاحظة</th></tr></thead><tbody>
          ${st.p.lines
            .map(
              (
                L,
                i,
              ) => `<tr data-s="${esc(`${L.name} ${L.empNo} ${L.iqama}`)}" class="${L.net < 0 ? 'pr-neg' : ''}"><td>${i + 1}</td><td><b>${esc(L.name)}</b><div class="muted" style="font-size:11.5px">${esc([L.empNo, L.title, st.p.branch ? '' : L.branch].filter(Boolean).join(' — '))}</div></td>
            <td class="num">${L.days}</td><td class="num">${esc(money(L.basic))}</td><td class="num">${esc(money(L.housing))}</td><td class="num">${esc(money(L.transport))}</td><td class="num">${esc(money(L.other))}</td><td class="num"><b>${esc(money(L.gross))}</b></td>
            <td>${inp(L, 'overtime')}${payrollOtNote(L)}</td><td>${inp(L, 'addOther')}${L.allowReq ? `<div class="muted" style="font-size:11px" title="${esc((L.allowRefs || []).join('، '))}">+ بدلات معتمدة ${esc(money(L.allowReq))}</div>` : ''}</td><td class="num" title="${L.gosiAuto ? 'محسوبة من سياسة التأمينات' : 'من سجل الموظف'}">${esc(money(L.gosi))}${L.gosiEr ? `<div class="muted" style="font-size:11px">المنشأة ${esc(money(L.gosiEr))}</div>` : ''}</td><td class="num">${esc(money(L.fixedDed))}</td>
            <td class="num" title="${L.unpaidDays} يوم">${L.unpaidDed ? esc(money(L.unpaidDed)) : '—'}</td><td>${inp(L, 'absentDays', 60)}${payrollAbsenceNotes(L)}</td>
            <td title="${esc((L.advRefs || []).join('، '))}">${inp(L, 'advance')}${L.advRefs && L.advRefs.length ? `<div class="muted" style="font-size:11px">${esc(L.advRefs.join('، '))}</div>` : ''}</td>
            <td class="num" title="${esc((L.dedRefs || []).join('، '))}">${L.dedReq ? esc(money(L.dedReq)) : '—'}</td><td>${inp(L, 'dedOther')}</td>
            <td class="num"><b class="${L.net < 0 ? 'bad-t' : ''}">${esc(money(L.net))}</b></td><td>${edit ? `<input class="in pr-in" data-e="${L.empId}" data-k="note" value="${esc(L.note || '')}" style="width:130px">` : esc(L.note || '')}</td></tr>`,
            )
            .join('')}
          <tr class="total-row"><td></td><td>الإجمالي</td><td></td>${['basic', 'housing', 'transport', 'other', 'gross', 'overtime', 'addOther', 'gosi', 'fixedDed', 'unpaidDed', 'absentDed', 'advance', 'dedReq', 'dedOther', 'net'].map((k) => `<td class="num">${esc(money(st.p.lines.reduce((a, L) => a + (Number(L[k]) || 0), 0)))}</td>`).join('')}<td></td></tr>
        </tbody></table></div></div>
        <div class="card"><h3>سجل المسير</h3><ul class="timeline">${st.p.history
          .slice()
          .reverse()
          .map(
            (h) =>
              `<li><b>${esc(h.action)}</b><div class="when">${esc(h.byName)} — ${esc(dt(h.at))}</div>${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}</li>`,
          )
          .join('')}</ul></div>`;
  }
  /* جزء من draw: if ($('#prDel'))… */
  function drawPart(st) {
    if ($('#prDel'))
      $('#prDel').onclick = async () => {
        if (!(await askYesNo('حذف مسودة المسير؟'))) return;
        try {
          await api('DELETE', `/api/payroll/${st.p.id}`);
          location.hash = '#/payroll';
        } catch (err) {
          toast(err.message, true);
        }
      };
  }
  /* أحداث draw: #prSave، #prRebuild، #prSubmit، #prApprove */
  function wireDraw3(act, collectEd, draw, st) {
    if ($('#prSave'))
      $('#prSave').onclick = async () => {
        try {
          st.p = await api('PUT', `/api/payroll/${st.p.id}`, { lines: collectEd() });
          toast('تم حفظ المسير');
          draw();
        } catch (err) {
          toast(err.message, true);
        }
      };
    if ($('#prRebuild'))
      $('#prRebuild').onclick = async () => {
        if (
          !(await askYesNo(
            'تحديث الرواتب والاستقطاعات التلقائية من سجل الموظفين والطلبات المعتمدة؟ (تبقى الأعمدة اليدوية كما هي — احفظ تعديلاتك أولاً)',
          ))
        )
          return;
        try {
          st.p = await api('POST', `/api/payroll/${st.p.id}/rebuild`);
          toast('تم التحديث');
          draw();
        } catch (err) {
          toast(err.message, true);
        }
      };
    if ($('#prSubmit'))
      $('#prSubmit').onclick = async () => {
        try {
          await api('PUT', `/api/payroll/${st.p.id}`, { lines: collectEd() });
        } catch (err) {
          toast(err.message, true);
          return;
        }
        if (await askYesNo('إرسال المسير للاعتماد؟')) act('submit');
      };
    if ($('#prApprove'))
      $('#prApprove').onclick = async () => {
        if (await askYesNo(`اعتماد مسير ${prMonth(st.p.month)} بصافي ${money(st.p.totals.net)} ريال؟`)) act('approve');
      };
  }
  /* أحداث draw: #prWps، #prGl */
  function wireDraw2(fname, st) {
    $('#prWps').onclick = () =>
      downloadCsv(fname('حماية_الأجور'), [
        [
          'رقم الهوية / الإقامة',
          'اسم الموظف',
          'الرقم الوظيفي',
          'البنك',
          'رقم الآيبان',
          'الراتب الأساسي',
          'بدل السكن',
          'البدلات الأخرى',
          'الخصومات',
          'صافي الراتب',
          'الشهر',
        ],
        ...st.p.lines.map((L) => [
          L.iqama,
          L.name,
          L.empNo,
          L.bank,
          String(L.iban || '').replace(/\s/g, ''),
          L.basic,
          L.housing,
          Math.round((L.transport + L.other + L.totalAdd) * 100) / 100,
          L.totalDed,
          L.net,
          st.p.month,
        ]),
      ]);
    /* القيد المحاسبي: لكل فرع (مركز تكلفة) مدين مصروفات الرواتب، ودائن الاستقطاعات وصافي الرواتب المستحقة */
    $('#prGl').onclick = () => {
      const rows = [['التاريخ', 'مركز التكلفة', 'الحساب', 'مدين', 'دائن', 'البيان']];
      /* مركز التكلفة من الهيكل التنظيمي (الموظف ← الإدارة ← الفرع)، وإلا الفرع */
      const by = {};
      st.p.lines.forEach((L) => {
        const k = L.cc ? `${L.cc}${L.ccName ? ` — ${L.ccName}` : ''}` : L.branch || '—';
        (by[k] = by[k] || []).push(L);
      });
      const s = (Ls, f) => Math.round(Ls.reduce((a, L) => a + (Number(f(L)) || 0), 0) * 100) / 100;
      const date = `${st.p.month}-${new Date(Number(st.p.month.slice(0, 4)), Number(st.p.month.slice(5)), 0).getDate()}`,
        desc = `رواتب ${prMonth(st.p.month)}`;
      for (const [b, Ls] of Object.entries(by)) {
        [
          ['مصروف الرواتب الأساسية', s(Ls, (L) => L.basic), 0],
          ['مصروف بدل السكن', s(Ls, (L) => L.housing), 0],
          ['مصروف بدلات أخرى (نقل وغيرها)', s(Ls, (L) => L.transport + L.other), 0],
          ['مصروف العمل الإضافي والإضافات', s(Ls, (L) => L.totalAdd), 0],
          ['مصروف التأمينات الاجتماعية (حصة المنشأة)', s(Ls, (L) => L.gosiEr), 0],
          ['التأمينات الاجتماعية المستحقة', 0, s(Ls, (L) => (Number(L.gosi) || 0) + (Number(L.gosiEr) || 0))],
          ['سلف الموظفين', 0, s(Ls, (L) => L.advance)],
          ['خصومات وجزاءات الموظفين', 0, s(Ls, (L) => L.fixedDed + L.unpaidDed + L.absentDed + L.dedReq + (Number(L.dedOther) || 0))],
          ['رواتب مستحقة الدفع', 0, s(Ls, (L) => L.net)],
        ]
          .filter(([, d2, c]) => d2 || c)
          .forEach(([acc, d2, c]) => rows.push([date, b, acc, d2 || '', c || '', desc]));
      }
      downloadCsv(fname('قيد_الرواتب'), rows);
    };
  }
  /* أحداث draw: #prXls */
  function wirePrXls(fname, st) {
    $('#prXls').onclick = () =>
      downloadCsv(fname('مسير_الرواتب'), [
        [
          '#',
          'الرقم الوظيفي',
          'الاسم',
          'الهوية',
          'الفرع',
          'المسمى',
          'الأيام',
          'الأساسي',
          'السكن',
          'النقل',
          'بدلات أخرى',
          'الإجمالي',
          'إضافي',
          'إضافات أخرى',
          'التأمينات',
          'حسميات ثابتة',
          'بدون راتب',
          'أيام غياب',
          'خصم الغياب',
          'السلف',
          'خصومات معتمدة',
          'خصومات أخرى',
          'إجمالي الاستقطاعات',
          'الصافي',
          'البنك',
          'الآيبان',
          'ملاحظة',
        ],
        ...st.p.lines.map((L, i) => [
          i + 1,
          L.empNo,
          L.name,
          L.iqama,
          L.branch,
          L.title,
          L.days,
          L.basic,
          L.housing,
          L.transport,
          L.other,
          L.gross,
          L.overtime,
          L.addOther,
          L.gosi,
          L.fixedDed,
          L.unpaidDed,
          L.absentDays,
          L.absentDed,
          L.advance,
          L.dedReq,
          L.dedOther,
          L.totalDed,
          L.net,
          L.bank,
          L.iban,
          L.note,
        ]),
      ]);
  }
  /* أحداث draw: #prReject، #prPaid، #prReopen */
  function wireDraw(act) {
    if ($('#prReject')) $('#prReject').onclick = () => act('reject', 'سبب الإعادة للتعديل:');
    if ($('#prPaid'))
      $('#prPaid').onclick = async () => {
        if (await askYesNo('تأكيد صرف رواتب هذا المسير؟')) act('paid');
      };
    if ($('#prReopen')) $('#prReopen').onclick = () => act('reopen', 'سبب إعادة فتح المسير:');
  }
  /* أحداث draw: #prQ */
  function wirePrQ(main) {
    $('#prQ').oninput = () => {
      const q = $('#prQ').value.trim();
      $$('.pr-tbl tbody tr[data-s]', main).forEach((r) => {
        r.hidden = !!q && !r.dataset.s.includes(q);
      });
    };
  }

  /* قسائم الرواتب: قسيمة لكل موظف (أو موظف واحد) للطباعة / الحفظ PDF */
  async function viewPayslips(id, query) {
    const p = await api('GET', query.mine ? `/api/me/hr/payslip/${id}` : `/api/payroll/${id}`);
    const list = query.emp ? p.lines.filter((L) => L.empId === query.emp) : p.lines;
    const m = (v) => esc(money(v));
    document.title = `قسائم رواتب ${prMonth(p.month)}`;
    app.innerHTML = `<div class="print-page"><div class="print-bar"><button class="btn primary" id="pBtn">🖨️ طباعة / حفظ PDF</button>${p.mine ? '<a class="btn" href="#/me">رجوع لملفي</a>' : `<a class="btn" href="#/payroll/${p.id}">رجوع للمسير</a>`}</div>
      <div class="slips">${list
        .map(
          (
            L,
          ) => `<div class="slip"><div class="slip-h"><div><b>${esc(state.config.companyName || state.config.orgName || '')}</b><div class="muted">قسيمة راتب — ${esc(prMonth(p.month))}</div></div><div class="slip-st">${esc(p.statusLabel)}</div></div>
        <table class="ep-t"><tr><th>الاسم</th><td>${esc(L.name)}</td><th>الرقم الوظيفي</th><td>${esc(L.empNo || '—')}</td></tr><tr><th>الهوية / الإقامة</th><td>${esc(L.iqama)}</td><th>الفرع</th><td>${esc(L.branch)}</td></tr><tr><th>المسمى</th><td>${esc(L.title || '—')}</td><th>أيام العمل</th><td>${L.days} / 30</td></tr></table>
        <div class="slip-cols"><table class="ep-t"><tr><th colspan="2" class="slip-hd">المستحقات</th></tr><tr><td>الراتب الأساسي</td><td>${m(L.basic)}</td></tr><tr><td>بدل السكن</td><td>${m(L.housing)}</td></tr><tr><td>بدل النقل</td><td>${m(L.transport)}</td></tr><tr><td>بدلات أخرى</td><td>${m(L.other)}</td></tr>${L.overtime ? `<tr><td>عمل إضافي</td><td>${m(L.overtime)}</td></tr>` : ''}${L.addOther ? `<tr><td>إضافات أخرى</td><td>${m(L.addOther)}</td></tr>` : ''}${L.allowReq ? `<tr><td>بدلات معتمدة</td><td>${m(L.allowReq)}</td></tr>` : ''}<tr class="slip-tot"><td>إجمالي المستحقات</td><td>${m(L.gross + L.totalAdd)}</td></tr></table>
          <table class="ep-t"><tr><th colspan="2" class="slip-hd">الاستقطاعات</th></tr><tr><td>التأمينات الاجتماعية</td><td>${m(L.gosi)}</td></tr>${L.fixedDed ? `<tr><td>حسميات ثابتة</td><td>${m(L.fixedDed)}</td></tr>` : ''}${L.unpaidDed ? `<tr><td>إجازة بدون راتب (${L.unpaidDays} يوم)</td><td>${m(L.unpaidDed)}</td></tr>` : ''}${L.absentDed ? `<tr><td>غياب (${L.absentDays} يوم)</td><td>${m(L.absentDed)}</td></tr>` : ''}${L.shortDed ? `<tr><td>نقص ساعات الدوام المرن (${Math.floor(L.shortMin / 60)}:${String(L.shortMin % 60).padStart(2, '0')})</td><td>${m(L.shortDed)}</td></tr>` : ''}${L.advance ? `<tr><td>قسط سلفة</td><td>${m(L.advance)}</td></tr>` : ''}${L.dedReq ? `<tr><td>خصومات معتمدة</td><td>${m(L.dedReq)}</td></tr>` : ''}${L.dedOther ? `<tr><td>خصومات أخرى</td><td>${m(L.dedOther)}</td></tr>` : ''}<tr class="slip-tot"><td>إجمالي الاستقطاعات</td><td>${m(L.totalDed)}</td></tr></table></div>
        <div class="slip-net">صافي الراتب: <b>${m(L.net)} ريال</b><div class="muted">${esc(SF.tafqeet(Math.max(0, L.net)))}</div></div>
        <div class="muted slip-f">${L.bank ? `البنك: ${esc(L.bank)} — ` : ''}${L.iban ? `الآيبان: <bdi dir="ltr">${esc(L.iban)}</bdi>` : ''}${L.note ? ` — ${esc(L.note)}` : ''}</div></div>`,
        )
        .join('')}</div></div>`;
    $('#pBtn').onclick = () => window.print();
  }

  return { viewPayroll, viewPayrun, viewPayslips };
};
