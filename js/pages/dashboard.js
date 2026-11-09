'use strict';
/* صفحة «dashboard» (viewDashboard) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['dashboard'] = function (S) {
  const {
    $,
    $$,
    SF,
    api,
    canExec,
    dashCsv,
    dashHidden,
    dashQs,
    dashboardHtml,
    drawDashCharts,
    esc,
    head,
    isAdmin,
    seesAll,
    shell,
    state,
    viewExecutive,
  } = S;
  async function viewDashboard(query) {
    /* لوحة المؤشرات تفتح مؤشرات التشغيل، ومركز القيادة التنفيذية من زرّه */
    if (canExec() && query.view === 'exec') return viewExecutive(query);
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/dashboard');
    const d = await api(
      'GET',
      `/api/dashboard?from=${encodeURIComponent(query.from || '')}&to=${encodeURIComponent(query.to || '')}&branch=${encodeURIComponent(query.branch || '')}&type=${encodeURIComponent(query.type || '')}`,
    );
    const scopeNote =
      isAdmin() || seesAll()
        ? 'جميع الطلبات'
        : state.user.viewScope === 'branch'
          ? 'طلبات فرعك'
          : state.user.role === 'accountant'
            ? 'طلباتك فقط'
            : 'الطلبات المارة عليك';
    main.innerHTML = `${canExec() ? '<div class="ex-back no-print"><a class="btn" href="#/dashboard?view=exec">مركز القيادة التنفيذية ←</a></div>' : ''}${head('لوحة المؤشرات', d.scoped ? `مؤشرات فرع ${esc(d.scoped)}: الطلبات والمبالغ المعتمدة وأعمال الفرع` : `متابعة أعمال كل إدارات الشركة، والمبالغ المعتمدة، وأين تتوقف الطلبات — ${scopeNote}`, `<button class="btn" id="dCustom">⚙ تخصيص العرض</button><a class="btn primary" href="#/report?${dashQs(d)}" target="_blank">📄 تقرير للطباعة / PDF</a><button class="btn" id="dCsv">⬇ Excel (CSV)</button>`)}
      <div id="exPay"></div>
      <div class="dash-filters">
        <label>الفترة <select class="in" id="dQuick"><option value="">— اختيار سريع —</option><option value="month">هذا الشهر</option><option value="lastMonth">الشهر الماضي</option><option value="q">آخر 3 شهور</option><option value="year">هذا العام</option><option value="lastYear">العام الماضي</option></select></label>
        <label>من <input class="in" type="date" id="dFrom" value="${d.from}"></label>
        <label>إلى <input class="in" type="date" id="dTo" value="${d.to}"></label>
        ${d.scoped ? `<label>الفرع <b class="dash-own">${esc(d.scoped)}</b><select class="in" id="dBranch" hidden><option value="${esc(d.scoped)}" selected>${esc(d.scoped)}</option></select></label>` : `<label>الفرع <select class="in" id="dBranch"><option value="">كل الفروع</option>${d.branches.map((b) => `<option${b === d.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label>`}
        <label>نوع الخطاب <select class="in" id="dType"><option value="">كل الخطابات</option>${d.types.map((t) => `<option value="${t.type}"${t.type === d.type ? ' selected' : ''}>${esc(t.title)}</option>`).join('')}</select></label>
      </div>
      ${dashboardHtml(d, false)}`;
    const drawCharts = () => {
      if (!document.body.contains(main) || !$('.kpis, .dash-grid, .dx-grid, .empty', main))
        return window.removeEventListener('resize', onResize);
      drawDashCharts(d, main);
    };
    let rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(drawCharts, 150);
    };
    window.addEventListener('resize', onResize);
    drawCharts();
    const go = () => {
      if ($('#dFrom').value && $('#dTo').value)
        location.hash = `#/dashboard?from=${$('#dFrom').value}&to=${$('#dTo').value}&branch=${encodeURIComponent($('#dBranch').value)}&type=${encodeURIComponent($('#dType').value)}`;
    };
    $('#dFrom').onchange = go;
    $('#dTo').onchange = go;
    $('#dQuick').onchange = () => {
      const t = new Date(),
        y = t.getFullYear(),
        m = t.getMonth();
      const iso = (dd) => `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
      const r = {
        month: [new Date(y, m, 1), t],
        lastMonth: [new Date(y, m - 1, 1), new Date(y, m, 0)],
        q: [new Date(y, m - 2, 1), t],
        year: [new Date(y, 0, 1), t],
        lastYear: [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)],
      }[$('#dQuick').value];
      if (!r) return;
      $('#dFrom').value = iso(r[0]);
      $('#dTo').value = iso(r[1]);
      go();
    };
    $('#dBranch').onchange = go;
    $('#dType').onchange = go;
    $$('tr[data-type]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = `#/all?type=${tr.dataset.type}`;
      };
    });
    wireDashboard(d, query);
    if (window.SES_PAY_TOTALS) window.SES_PAY_TOTALS.fill(S, $('#exPay', main));
  }
  /* أحداث viewDashboard: #dCsv، #dCustom */
  function wireDashboard(d, query) {
    $('#dCsv').onclick = () => dashCsv(d);
    $('#dCustom').onclick = () => {
      const allowed = SF.DASH_SECTIONS.filter(([k2]) => (d.sections || SF.DASH_KEYS).includes(k2));
      const hid = dashHidden();
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal" style="max-width:560px"><h3 style="margin-top:0">⚙ تخصيص لوحة المؤشرات</h3>
        <div class="hint" style="margin-bottom:10px">اختر الأقسام التي تظهر لك (من الأقسام التي أتاحها لك مدير النظام). يحفظ النظام اختيارك على هذا الجهاز.</div>
        ${
          [...new Set(allowed.map((s) => s[2]))]
            .map(
              (g) =>
                `<div class="perm-g">${esc(g)}</div>${allowed
                  .filter((s) => s[2] === g)
                  .map(
                    ([k2, l]) =>
                      `<label class="check"><input type="checkbox" data-ds="${k2}"${hid.includes(k2) ? '' : ' checked'}> ${esc(l)}</label>`,
                  )
                  .join('')}`,
            )
            .join('') || '<div class="muted">لم يتح لك مدير النظام أي قسم</div>'
        }
        <div class="row" style="margin-top:14px;gap:8px"><button class="btn primary" data-ok>تطبيق</button><button class="btn ghost" data-all>إظهار الكل</button><button class="btn ghost" data-x>إلغاء</button></div></div>`;
      document.body.appendChild(bg);
      const done = (list) => {
        try {
          localStorage.setItem(`dash:hide:${state.user.id}`, JSON.stringify(list));
        } catch {
          /* تجاهل */
        }
        bg.remove();
        viewDashboard(query);
      };
      $('[data-x]', bg).onclick = () => bg.remove();
      $('[data-all]', bg).onclick = () => done([]);
      $('[data-ok]', bg).onclick = () =>
        done(
          $$('[data-ds]', bg)
            .filter((c) => !c.checked)
            .map((c) => c.dataset.ds),
        );
    };
  }

  return { viewDashboard };
};
