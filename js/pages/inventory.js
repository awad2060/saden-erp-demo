'use strict';
/* صفحة «inventory» (viewDevices، viewInvDeleted، viewInventory) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['inventory'] = function (S) {
  const {
    $,
    $$,
    DEV_COLS,
    INV_NO,
    INV_TABS,
    SF,
    api,
    applyConfig,
    askYesNo,
    barcodeSvg,
    can,
    devState,
    downloadXlsx,
    dt,
    esc,
    formModal,
    gridImportModal,
    head,
    icon,
    invCell,
    invCols,
    invName,
    invTable,
    opsDoc,
    printDocs,
    route,
    shell,
    state,
    toast,
    today,
  } = S;
  async function viewDevices(query) {
    const res = await api('GET', '/api/devices');
    const main = shell('', '#/devices');
    const list = res.list;
    const canReq = can('new') && SF.formAllowed(state.user, 'deviceLoan');
    const loaned = list.filter((x) => x.loan),
      avail = list.filter((x) => !x.loan && !x.pending && (x.state || 'متاح') === 'متاح');
    main.innerHTML = `${head('الأجهزة النوعية', 'أجهزة تملكها الإدارة وتُعار للفروع لمدة محددة بطلب استعارة', `${res.editor ? '<button class="btn primary" id="dvAdd">➕ إضافة جهاز</button><button class="btn" id="dvImp">📥 رفع أجهزة من Excel</button>' : ''}<button class="btn" id="dvXls">📊 Excel</button>`)}
      <div class="stats" style="margin-bottom:14px"><div class="stat"><div class="n">${list.length}</div><div class="l">إجمالي الأجهزة</div></div>
        <div class="stat"><div class="n">${avail.length}</div><div class="l">متاحة للاستعارة</div></div>
        <div class="stat"><div class="n">${loaned.length}</div><div class="l">معارة للفروع</div></div>
        <div class="stat${list.some((x) => x.overdue) ? ' hi' : ''}"><div class="n">${list.filter((x) => x.overdue).length}</div><div class="l">متأخر إرجاعها</div></div></div>
      <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><input class="in" id="dvQ" placeholder="بحث: الجهاز، الماركة، السيريال، التكويد، الفرع..." style="flex:1;min-width:220px">
        <select class="in" id="dvS" style="width:auto"><option value="">كل الحالات</option><option value="avail">متاحة</option><option value="loan">معارة</option><option value="late">متأخر إرجاعها</option></select></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>م</th>${DEV_COLS.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th>الحالة</th><th></th></tr></thead><tbody id="dvRows"></tbody></table></div></div>`;
    const rows = () => {
      const q = $('#dvQ').value.trim(),
        s = $('#dvS').value;
      const shown = list.filter(
        (x) =>
          (!s || (s === 'avail' ? avail.includes(x) : s === 'loan' ? !!x.loan : x.overdue)) &&
          (!q || [x.name, x.brand, x.model, x.serial, x.code, (x.loan || {}).branch].join(' ').includes(q)),
      );
      $('#dvRows').innerHTML =
        shown
          .map(
            (x, i) => `<tr><td>${i + 1}</td>${DEV_COLS.map((c) => invCell(c, x, false)).join('')}<td>${devState(x)}</td>
        <td style="white-space:nowrap">${canReq && avail.includes(x) ? `<a class="btn sm primary" href="#/new/deviceLoan?prefill=${encodeURIComponent(JSON.stringify({ device: x.id }))}">طلب استعارة</a> ` : ''}${x.loan ? `<a class="btn sm" href="#/req/${x.loan.requestId}">الطلب</a> ` : x.pending ? `<a class="btn sm" href="#/req/${x.pending.id}">الطلب</a> ` : ''}
        ${res.editor && x.loan ? `<button class="btn sm ok" data-ret="${x.id}">↩ تسجيل الإرجاع</button> ` : ''}<button class="btn sm" data-his="${x.id}">السجل (${(x.history || []).length})</button>${res.editor ? ` <button class="btn sm" data-ed="${x.id}">✏️</button> <button class="btn sm ghost" data-del="${x.id}">🗑️</button>` : ''}</td></tr>`,
          )
          .join('') || '<tr><td colspan="9" class="muted" style="text-align:center;padding:24px">لا توجد أجهزة</td></tr>';
    };
    ['input', 'change'].forEach((ev) => ['#dvQ', '#dvS'].forEach((s) => $(s).addEventListener(ev, rows)));
    rows();
    const fields = [
      ...DEV_COLS.map((c) => (c.key === 'notes' ? { ...c, type: 'textarea' } : c)),
      { key: 'state', label: 'الحالة (عند عدم الإعارة)', type: 'select', options: res.states, default: 'متاح' },
    ];
    wireDevices(fields, list);
    if ($('#dvImp'))
      $('#dvImp').onclick = () =>
        gridImportModal({
          title: 'رفع أجهزة نوعية من Excel',
          cols: [INV_NO, ...DEV_COLS.map((c) => ({ ...c, required: false }))],
          template: window.SES_INV.DEV_FILE,
          sample: window.SES_INV.DEV_SAMPLE,
          hint: 'صف لكل جهاز بنفس أعمدة الجدول. يحفظ النظام البيانات كما هي، والأجهزة الجديدة تكون متاحة للاستعارة.',
          save: (rows) => api('POST', '/api/devices/bulk', { rows }),
          done: (r) => {
            toast(`تمت إضافة ${r.added} جهاز`);
            route();
          },
        });
    $('#dvXls').onclick = () =>
      downloadXlsx(
        'الأجهزة-النوعية.xlsx',
        [
          ['م', ...DEV_COLS.map((c) => c.label), 'الحالة', 'الفرع المستعير', 'من', 'إلى'],
          ...list.map((x, i) => [
            i + 1,
            ...DEV_COLS.map((c) => x[c.key]),
            x.loan ? 'معار' : x.pending ? 'طلب جارٍ' : x.state || 'متاح',
            (x.loan || {}).branch || '',
            (x.loan || {}).from || '',
            (x.loan || {}).to || '',
          ]),
        ],
        'الأجهزة النوعية',
      );
  }
  /* أحداث viewDevices: #dvRows، #dvAdd */
  function wireDevices(fields, list) {
    $('#dvRows').onclick = async (e) => {
      const g = (k) => {
        const b = e.target.closest(`[data-${k}]`);
        return b ? list.find((x) => x.id === b.dataset[k]) : null;
      };
      const ret = g('ret'),
        his = g('his'),
        ed = g('ed'),
        del = g('del');
      if (ret)
        formModal({
          title: `تسجيل إرجاع "${ret.name}" من فرع ${ret.loan.branch}`,
          fields: [
            { key: 'date', label: 'تاريخ الإرجاع', type: 'date', required: true, default: today() },
            { key: 'condition', label: 'حالة الجهاز عند الإرجاع' },
            { key: 'note', label: 'ملاحظات', type: 'textarea' },
          ],
          onSave: (v) =>
            api('POST', `/api/devices/${ret.id}/return`, v).then(() => {
              toast('تم تسجيل الإرجاع — الجهاز متاح الآن');
              route();
            }),
        });
      if (his) {
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = `<div class="modal" style="max-width:860px;width:96%"><h3 style="margin-top:0">سجل استعارات "${esc(his.name)}"</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الفرع</th><th>الطلب</th><th>من</th><th>إلى</th><th>أرجعه في</th><th>الحالة عند الإرجاع</th><th>استلمه</th></tr></thead><tbody>
          ${
            (his.history || [])
              .slice()
              .reverse()
              .map(
                (h) =>
                  `<tr><td>${esc(h.branch)}</td><td><a href="#/req/${h.requestId}"><bdi>${esc(h.serial)}</bdi></a></td><td>${esc(SF.fmtDate(h.from))}</td><td>${esc(SF.fmtDate(h.to))}</td><td>${esc(SF.fmtDate(h.returnedAt))}</td><td>${esc(h.condition || '—')}${h.note ? `<br><small class="muted">${esc(h.note)}</small>` : ''}</td><td>${esc(h.receivedBy)}</td></tr>`,
              )
              .join('') || '<tr><td colspan="7" class="muted">لا توجد استعارات سابقة</td></tr>'
          }</tbody></table></div>
          <div class="row" style="margin-top:12px"><button class="btn ghost" data-x>إغلاق</button></div></div>`;
        document.body.appendChild(bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        bg.onclick = (ev) => {
          if (ev.target === bg) bg.remove();
        };
      }
      if (ed)
        formModal({
          title: `تعديل "${ed.name}"`,
          fields,
          values: ed,
          onSave: (v) =>
            api('PUT', `/api/devices/${ed.id}`, v).then(() => {
              toast('تم الحفظ');
              route();
            }),
        });
      if (del && (await askYesNo(`حذف الجهاز "${del.name}"؟ ينتقل إلى سلة المحذوفات.`))) {
        try {
          await api('DELETE', `/api/devices/${del.id}`);
          toast('تم الحذف');
          route();
        } catch (err) {
          toast(err.message, true);
        }
      }
    };
    if ($('#dvAdd'))
      $('#dvAdd').onclick = () =>
        formModal({
          title: 'إضافة جهاز نوعي',
          fields,
          onSave: (v) =>
            api('POST', '/api/devices', v).then(() => {
              toast('تمت الإضافة');
              route();
            }),
        });
  }

  /* محذوفات الجرد: البنود المحذوفة بأسبابها؛ الاسترجاع لفريق الجرد، والحذف النهائي لمدير النظام فقط */
  async function viewInvDeleted(query) {
    const res = await api('GET', '/api/inventory/deleted');
    const main = shell('', '#/inventory-deleted');
    const list = res.list;
    const branches = [...new Set(list.map((x) => x.branch))].sort();
    const place = (x) => (INV_TABS.find(([s, u]) => s === x.section && u === x.sub) || [])[2] || '';
    main.innerHTML = `${head('محذوفات الجرد', `${list.length} بند محذوف — لا يمسحها النظام إلا بحذف نهائي من مدير النظام`, '<a class="btn ghost" href="#/inventory">رجوع للجرد</a>')}
      <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><input class="in" id="dlQ" placeholder="بحث: البيان، التكويد، السبب، من حذف..." style="flex:1;min-width:220px">
        <select class="in" id="dlB" style="width:auto"><option value="">كل الفروع</option>${branches.map((b) => `<option>${esc(b)}</option>`).join('')}</select></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>تاريخ الحذف</th><th>حذفه</th><th>سبب الحذف</th><th>الفرع</th><th>القسم</th><th>البيان / نوع الجهاز</th><th>المستخدم</th><th>العدد</th><th>التكويد</th><th>الحالة</th><th></th></tr></thead><tbody id="dlRows"></tbody></table></div></div>`;
    const rows = () => {
      const q = $('#dlQ').value.trim(),
        b = $('#dlB').value;
      const shown = list.filter(
        (x) =>
          (!b || x.branch === b) &&
          (!q || [x.ar, x.en, x.type, x.user, x.code, x.serial, x.deleted.reason, x.deleted.byName].join(' ').includes(q)),
      );
      $('#dlRows').innerHTML =
        shown
          .map(
            (
              x,
            ) => `<tr><td>${esc(dt(x.deleted.at))}</td><td>${esc(x.deleted.byName)}</td><td style="white-space:pre-wrap;max-width:260px">${esc(x.deleted.reason)}</td><td>${esc(x.branch)}</td><td>${esc(place(x))}</td>
        <td>${esc(invName(x))}${x.en && x.ar ? `<br><small class="muted">${esc(x.en)}</small>` : ''}</td><td>${esc(x.user || '')}</td><td>${esc(x.qty)}</td><td class="bc-cell">${barcodeSvg(x.code)}${esc(x.code)}</td><td>${esc(x.status)}</td>
        <td style="white-space:nowrap"><button class="btn sm" data-rs="${x.id}">↺ استرجاع</button>${res.admin ? ` <button class="btn sm bad" data-pd="${x.id}">🗑️ حذف نهائي</button>` : ''}</td></tr>`,
          )
          .join('') || '<tr><td colspan="11" class="muted" style="text-align:center;padding:24px">لا توجد بنود محذوفة</td></tr>';
    };
    ['input', 'change'].forEach((ev) => ['#dlQ', '#dlB'].forEach((s) => $(s).addEventListener(ev, rows)));
    rows();
    $('#dlRows').onclick = async (e) => {
      const rs = e.target.closest('[data-rs]'),
        pd = e.target.closest('[data-pd]');
      const id = rs ? rs.dataset.rs : pd ? pd.dataset.pd : '';
      if (!id) return;
      const x = list.find((i) => i.id === id);
      if (rs && (await askYesNo(`استرجاع "${invName(x)}" إلى جرد ${x.branch}؟`))) {
        try {
          await api('POST', `/api/inventory/${x.id}/restore`);
          toast('تم استرجاع البند');
          route();
        } catch (err) {
          toast(err.message, true);
        }
      }
      if (pd && (await askYesNo(`حذف "${invName(x)}" نهائياً من النظام؟ لا يمكن التراجع عن هذا.`))) {
        try {
          await api('DELETE', `/api/inventory/${x.id}/permanent`);
          toast('تم الحذف النهائي');
          route();
        } catch (err) {
          toast(err.message, true);
        }
      }
    };
  }

  async function viewInventory(query) {
    if (query.tab === 'templates') return window.SES_TEMPLATES.view(S, 'inventory', '#/inventory?tab=templates');
    const res = await api('GET', '/api/inventory');
    const main = shell('', '#/inventory');
    const branch = res.branches.includes(query.branch) ? query.branch : res.branches.length === 1 ? res.branches[0] : '';
    if (!branch) {
      main.innerHTML = `${head('إدارة الجرد', `${res.branches.length} فرع — اختر الفرع لعرض جرده`, res.editor ? `<button class="btn primary" id="ivBr">➕ إضافة فرع</button><a class="btn" href="#/inventory-deleted">🗑️ محذوفات الجرد (${res.deletedCount})</a>` : '')}<div class="inv-branches">${res.branches.map((b) => `<a class="card inv-br" href="#/inventory?branch=${encodeURIComponent(b)}"><span class="inv-br-ic">${icon('branch')}</span><b>${esc(b)}</b><span class="muted">${res.counts[b] || 0} بند</span></a>`).join('') || `<div class="card muted">لا توجد فروع متاحة لك. إدارة الجرد لمسؤولي الجرد (يحددهم مدير النظام من الإعدادات ← مسارات الاعتماد ← فرق إدارة العمليات)، ومحاسب الفرع يرى جرد فرعه.${state.user.role === 'admin' ? '' : ' تواصل مع مدير النظام لإضافتك لفريق الجرد.'}</div>`}</div>`;
      viewInventoryPart();
      return;
    }
    return viewInventoryPart2(branch, main, query, res);
  }
  /* جزء من viewInventory: const [sec, sub] = INV_TABS.some(([s, u]) => s ===… */
  function viewInventoryPart2(branch, main, query, res) {
    const [sec, sub] = INV_TABS.some(([s, u]) => s === query.sec && u === (query.sub || ''))
      ? [query.sec, query.sub || '']
      : ['labs', 'soil'];
    const tabLabel = INV_TABS.find(([s, u]) => s === sec && u === sub)[2];
    /* بنود الفرع: ملكه + المستعارة من فروع أخرى (مع علامة توضح أنها ليست من ممتلكاته) */
    const inBranch = (x) => x.branch === branch || (x.loan && x.loan.to === branch);
    const items = res.list
      .filter((x) => inBranch(x) && x.section === sec && x.sub === sub)
      .map((x) => ({
        ...x,
        _tag: !x.loan
          ? ''
          : x.branch === branch
            ? `معار لفرع ${x.loan.to}${x.loan.until ? ` حتى ${SF.fmtDate(x.loan.until)}` : ''}`
            : `مستعار من فرع ${x.branch} — ليس من ممتلكات الفرع`,
        _tagKind: !x.loan ? '' : x.branch === branch ? 'out' : 'in',
      }));
    const go = (o) => {
      location.hash = `#/inventory?${new URLSearchParams({ branch, sec, sub, ...o })}`;
    };
    /* أعمدة التبويب المفتوح: الجدول ونموذج الإضافة والتعديل والرفع والطباعة والتصدير */
    const cols = invCols(sec, sub);
    const fields = cols.map((c) =>
      c.key === 'status' ? { ...c, hint: 'مثال: يعمل / صيانة / تالف — أو أي حالة' } : c.key === 'parts' ? { ...c, type: 'textarea' } : c,
    );
    main.innerHTML = `${head(`إدارة الجرد — فرع ${esc(branch)}`, `${esc(tabLabel)} — ${items.length} بند`, `${res.branches.length > 1 ? '<a class="btn ghost" href="#/inventory">كل الفروع</a>' : ''}<select class="in" id="ivSw" style="width:auto"${res.branches.length > 1 ? '' : ' hidden'}>${res.branches.map((b) => `<option${b === branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select>${res.editor ? '<button class="btn primary" id="ivAdd">➕ إضافة بند</button><button class="btn" id="ivImp">📥 رفع جرد من Excel</button>' : ''}${res.editor ? `<a class="btn" href="#/inventory-deleted">🗑️ المحذوفات (${res.deletedCount})</a>` : ''}<button class="btn" id="ivPrint">🖨️ طباعة A4</button><button class="btn" id="ivXls">📊 Excel</button><button class="btn" id="ivAll" title="كل تبويبات الفرع في ملف واحد: ورقة لكل تبويب">📦 جرد الفرع كاملاً</button>`)}
      <div class="tabs" style="margin-bottom:14px">${INV_TABS.map(([s, u, l]) => `<button class="tab${s === sec && u === sub ? ' on' : ''}" data-s="${s}" data-u="${u}">${l} <small class="muted">(${res.list.filter((x) => inBranch(x) && x.section === s && x.sub === u).length})</small></button>`).join('')}</div>
      <div class="card"><input class="in" id="ivQ" placeholder="بحث: الاسم، السيريال، الباركود..." style="margin-bottom:10px"><div class="tbl-wrap" id="ivTbl"></div></div>`;
    /* طلب صيانة لجهاز من جرد هذا الفرع (الموجود فيه الآن)، أو فتح طلبه الجاري */
    const canMaint = can('new') && SF.formAllowed(state.user, 'deviceMaint');
    const repeatTag = (x) =>
      x.maintRecent > 1
        ? `<span class="chip rejected" title="عدد طلبات الصيانة خلال آخر ${res.maintDays} يوماً">⚠ تكرر العطل ${x.maintRecent}×</span> `
        : '';
    const maintBtn = (x) =>
      repeatTag(x) +
      (!canMaint || (x.loan ? x.loan.to : x.branch) !== branch
        ? ''
        : x.maint
          ? `<a class="btn sm warn" href="#/req/${x.maint.id}" title="طلب صيانة جارٍ">🔧 <bdi dir="ltr">${esc(x.maint.serial)}</bdi></a> `
          : `<a class="btn sm" href="#/new/deviceMaint?prefill=${encodeURIComponent(JSON.stringify({ item: x.id }))}" title="طلب صيانة لهذا الجهاز">🔧 صيانة</a> `);
    const draw = () => {
      const q = $('#ivQ').value.trim();
      $('#ivTbl').innerHTML = invTable(
        items.filter(
          (x) =>
            !q ||
            cols
              .map((c) => x[c.key])
              .join(' ')
              .toLowerCase()
              .includes(q.toLowerCase()),
        ),
        res.editor || canMaint || items.some((x) => x.maintRecent > 1)
          ? (x) =>
              maintBtn(x) +
              (!res.editor
                ? ''
                : x.loan
                  ? `${x.branch === branch ? `<button class="btn sm" data-ied="${x.id}">✏️</button> ` : ''}<button class="btn sm ok" data-iun="${x.id}" title="إرجاع البند لفرعه المالك">↩ إنهاء الإعارة</button>`
                  : `<button class="btn sm" data-ied="${x.id}">✏️</button> <button class="btn sm" data-imv="${x.id}" title="نقل لفرع آخر">🔄 نقل</button> <button class="btn sm" data-iln="${x.id}" title="إعارة لفرع آخر (يبقى ملك الفرع)">🤝 إعارة</button> <button class="btn sm ghost" data-idel="${x.id}">🗑️</button>`)
          : null,
        cols,
      );
    };
    $('#ivQ').addEventListener('input', draw);
    draw();
    /* التنقل بين الفروع من نفس الصفحة */
    $('#ivSw').onchange = (e) => {
      location.hash = `#/inventory?${new URLSearchParams({ branch: e.target.value, sec, sub })}`;
    };
    $$('[data-s]', main).forEach((b) => {
      b.onclick = () => go({ sec: b.dataset.s, sub: b.dataset.u });
    });
    const place = { branch, section: sec, sub };
    wireInventory(branch, cols, fields, items, place, sec, sub, tabLabel);
    /* جرد الفرع كاملاً: ورقة ملخص بعدد البنود في كل تبويب، ثم ورقة لكل تبويب فيه بنود بأعمدته */
    return wireIvAll(branch, inBranch, res);
  }
  /* جزء من viewInventory: if ($('#ivBr'))… */
  function viewInventoryPart() {
    if ($('#ivBr'))
      $('#ivBr').onclick = () =>
        formModal({
          title: 'إضافة فرع جديد',
          fields: [{ key: 'name', label: 'اسم الفرع / المدينة', required: true, hint: 'مثال: ينبع — يضيفه النظام لفروعه كلها' }],
          onSave: async (v) => {
            const r = await api('POST', '/api/inventory/branch', v);
            applyConfig(await api('GET', '/api/config'));
            toast(`تمت إضافة فرع ${r.branch}`);
            location.hash = `#/inventory?branch=${encodeURIComponent(r.branch)}`;
          },
        });
  }
  /* أحداث viewInventory: #ivAll */
  function wireIvAll(branch, inBranch, res) {
    $('#ivAll').onclick = () => {
      const tagOf = (x) =>
        !x.loan
          ? ''
          : x.branch === branch
            ? `معار لفرع ${x.loan.to}${x.loan.until ? ` حتى ${SF.fmtDate(x.loan.until)}` : ''}`
            : `مستعار من فرع ${x.branch}`;
      const num = (c, x) => (c.key === 'qty' && x.qty !== '' && !isNaN(Number(x.qty)) ? Number(x.qty) : x[c.key]);
      const tabs = INV_TABS.map(([s, u, l]) => ({
        l,
        cols: invCols(s, u),
        xs: res.list.filter((x) => inBranch(x) && x.section === s && x.sub === u),
      }));
      const total = tabs.reduce((a, t) => a + t.xs.length, 0);
      if (!total) {
        toast('لا توجد بنود في جرد هذا الفرع', true);
        return;
      }
      downloadXlsx(`جرد-فرع-${branch}-كامل.xlsx`, [
        {
          name: 'ملخص',
          rows: [
            ['التبويب', 'عدد البنود'],
            ...tabs.map((t) => [t.l, t.xs.length]),
            ['الإجمالي', total],
            [],
            ['الفرع', branch],
            ['تاريخ التنزيل', SF.fmtDate(today())],
          ],
        },
        ...tabs
          .filter((t) => t.xs.length)
          .map((t) => ({
            name: t.l,
            rows: [
              [INV_NO.label, ...t.cols.map((c) => c.label), 'الإعارة'],
              ...t.xs.map((x, i) => [i + 1, ...t.cols.map((c) => num(c, x)), tagOf(x)]),
            ],
          })),
      ]);
    };
  }
  /* أحداث viewInventory: #ivTbl، #ivAdd، #ivImp، #ivPrint، #ivXls */
  function wireInventory(branch, cols, fields, items, place, sec, sub, tabLabel) {
    $('#ivTbl').onclick = async (e) => {
      const ed = e.target.closest('[data-ied]'),
        mv = e.target.closest('[data-imv]'),
        d = e.target.closest('[data-idel]'),
        ln = e.target.closest('[data-iln]'),
        un = e.target.closest('[data-iun]');
      await partPart(branch, ed, fields, items, ln, mv, un);
      if (d) {
        const x = items.find((i) => i.id === d.dataset.idel);
        formModal({
          title: `حذف "${invName(x)}"`,
          fields: [
            {
              key: 'reason',
              label: 'سبب الحذف',
              type: 'textarea',
              required: true,
              hint: 'النظام لا تمسح البند: ينتقل لمحذوفات الجرد ويمكن استرجاعه',
            },
          ],
          onSave: (v) =>
            api('DELETE', `/api/inventory/${x.id}`, v).then(() => {
              toast('تم نقل البند لمحذوفات الجرد');
              route();
            }),
        });
      }
    };
    if ($('#ivAdd'))
      $('#ivAdd').onclick = () =>
        formModal({
          title: `إضافة بند — ${tabLabel}`,
          fields,
          onSave: (v) =>
            api('POST', '/api/inventory', { ...v, ...place }).then(() => {
              toast('تمت الإضافة');
              route();
            }),
        });
    /* الرفع في الفرع والقسم المفتوحين: نموذج بأعمدة البيان فقط */
    if ($('#ivImp'))
      $('#ivImp').onclick = () =>
        gridImportModal({
          title: `رفع جرد من Excel — ${tabLabel} — فرع ${branch}`,
          cols: [INV_NO, ...cols.map((c) => ({ ...c, required: false }))],
          template: window.SES_INV.invFile(tabLabel),
          sample: window.SES_INV.invSample(S, sec, sub),
          hint: `ترفع البنود في <b>فرع ${esc(branch)} — ${esc(tabLabel)}</b> (لرفع قسم آخر افتح تبويبه أولاً). صف لكل بند بنفس أعمدة البيان: حمّل النموذج وعبّئه في Excel ثم ارفعه، أو الصق الصفوف مباشرة. يحفظ النظام البيانات كما هي في الملف بدون أي تعديل.`,
          save: (rows) => api('POST', '/api/inventory/bulk', { ...place, rows }),
          done: (r) => {
            toast(`تم رفع ${r.added} بند في ${tabLabel} — فرع ${branch}`);
            route();
          },
        });
    $('#ivPrint').onclick = () =>
      printDocs(
        `جرد ${branch} — ${tabLabel}`,
        { landscape: true },
        opsDoc({
          title: `تقرير جرد الأصول والمعدات — ${tabLabel}`,
          body: `<p class="l-para">فرع : <b>${esc(branch)}</b> — عدد البنود : <b>${items.length}</b></p>${invTable(items, null, cols, true)}`,
          sigs: ['القائم بالجرد', 'مدير الفرع'],
        }).replace('class="letter has-head"', 'class="letter has-head compact"'),
      );
    $('#ivXls').onclick = () =>
      downloadXlsx(
        `جرد-${branch}-${tabLabel}.xlsx`,
        [
          [INV_NO.label, ...cols.map((c) => c.label), 'الإعارة'],
          ...items.map((x, i) => [
            i + 1,
            ...cols.map((c) => (c.key === 'qty' && x.qty !== '' && !isNaN(Number(x.qty)) ? Number(x.qty) : x[c.key])),
            x._tag || '',
          ]),
        ],
        'الجرد',
      );
  }
  /* جزء من part: if (ln) {… */
  async function partPart(branch, ed, fields, items, ln, mv, un) {
    if (ln) {
      const x = items.find((i) => i.id === ln.dataset.iln);
      formModal({
        title: `إعارة "${invName(x)}" لفرع آخر`,
        fields: [
          {
            key: 'branch',
            label: 'الفرع المستعير',
            required: true,
            type: 'select',
            options: (state.config.branches || []).filter((b) => b !== branch),
          },
          { key: 'until', label: 'حتى تاريخ (اختياري)', type: 'date' },
          { key: 'note', label: 'ملاحظات الإعارة', type: 'textarea' },
        ],
        extra: `<div class="hint">البند يبقى من ممتلكات فرع ${esc(branch)}، ويظهر في جرد الفرع المستعير بعلامة "مستعار من فرع ${esc(branch)}".</div>`,
        onSave: (v) =>
          api('POST', `/api/inventory/${x.id}/loan`, v).then(() => {
            toast(`تمت إعارة البند لفرع ${v.branch}`);
            route();
          }),
      });
    }
    if (un) {
      const x = items.find((i) => i.id === un.dataset.iun);
      if (await askYesNo(`إنهاء إعارة "${invName(x)}" وإرجاعه لفرع ${x.branch}؟`)) {
        try {
          await api('POST', `/api/inventory/${x.id}/unloan`);
          toast(`رجع البند لفرع ${x.branch}`);
          route();
        } catch (err) {
          toast(err.message, true);
        }
      }
    }
    if (ed) {
      const x = items.find((i) => i.id === ed.dataset.ied);
      formModal({
        title: 'تعديل البند',
        fields,
        values: x,
        onSave: (v) =>
          api('PUT', `/api/inventory/${x.id}`, v).then(() => {
            toast('تم الحفظ');
            route();
          }),
      });
    }
    if (mv) {
      const x = items.find((i) => i.id === mv.dataset.imv);
      formModal({
        title: `نقل "${invName(x)}" إلى فرع آخر`,
        fields: [
          {
            key: 'branch',
            label: 'الفرع المستهدف',
            required: true,
            type: 'select',
            options: (state.config.branches || []).filter((b) => b !== branch),
          },
        ],
        onSave: (v) =>
          api('POST', `/api/inventory/${x.id}/move`, v).then(() => {
            toast(`تم النقل إلى ${v.branch}`);
            route();
          }),
      });
    }
  }

  return { viewDevices, viewInvDeleted, viewInventory };
};
