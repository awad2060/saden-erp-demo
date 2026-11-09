'use strict';
/* صفحة «stock» (viewStock) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['stock'] = function (S) {
  const { can, icon, shell } = S;
  /* المخزون: تطبيق قيد التطوير — صفحة تمهيدية حتى تُبنى الوحدة */
  function viewStock() {
    if (!can('stock')) {
      location.hash = '#/apps';
      return;
    }
    shell(
      `<div class="card stk-soon">
      <div class="stk-ic">${icon('warehouse')}</div>
      <h2>المخزون</h2>
      <p class="muted">تطبيق إدارة المخزون قيد التطوير وسيتاح قريباً.</p>
      <div class="stk-tags"><span>الأصناف</span><span>المستودعات</span><span>الوارد والصرف</span><span>الجرد</span><span>حد إعادة الطلب</span></div>
      <a class="btn ghost" href="#/apps">→ العودة للتطبيقات</a></div>`,
      '#/stock',
    );
  }

  return { viewStock };
};
