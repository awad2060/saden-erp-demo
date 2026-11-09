'use strict';
/* صفحة «dept-report» (viewReport) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['dept-report'] = function (S) {
  const { $, api, app, dPeriod, dashCsv, dashQs, dashboardHtml, drawDashCharts, dt, esc, state } = S;
  /* تقرير المؤشرات للطباعة أو الحفظ PDF */
  async function viewReport(query) {
    if (!state.user.dashboard) {
      location.hash = '#/';
      return;
    }
    const d = await api(
      'GET',
      `/api/dashboard?from=${encodeURIComponent(query.from || '')}&to=${encodeURIComponent(query.to || '')}&branch=${encodeURIComponent(query.branch || '')}&type=${encodeURIComponent(query.type || '')}`,
    );
    document.title = `تقرير المؤشرات ${d.from} - ${d.to}`;
    app.innerHTML = `<div class="print-page report-page"><div class="print-bar"><button class="btn primary" id="pBtn">🖨️ طباعة / حفظ PDF</button><button class="btn" id="rCsv">⬇ Excel (CSV)</button><a class="btn" href="#/dashboard?${dashQs(d)}">رجوع للوحة</a></div>
      <div class="report">
        <div class="r-head"><div><h1>تقرير أعمال الشركة ومؤشرات الإدارات — ${esc(dPeriod(d))}</h1><div class="muted">${esc(d.org || '')} · ${esc(d.app || '')}${d.branch ? ` · فرع ${esc(d.branch)}` : ' · كل الفروع'}${d.type ? ` · ${esc((d.types.find((t) => t.type === d.type) || {}).title || '')}` : ''}</div></div>
          <div class="r-meta">أعدّه النظام بتاريخ ${esc(dt(d.generatedAt))}<br>بواسطة ${esc(state.user.name)}</div></div>
        ${dashboardHtml(d, true)}
      </div></div>`;
    drawDashCharts(d, app, 340);
    $('#pBtn').onclick = () => window.print();
    $('#rCsv').onclick = () => dashCsv(d);
  }

  return { viewReport };
};
