'use strict';
/* الوضع الليلي قبل رسم الصفحة (حتى لا تومض بيضاء) — ملف مستقل بدل كود داخل index.html (سياسة المحتوى) */
try {
  if (localStorage.getItem('ui-theme') === 'dark') document.documentElement.dataset.theme = 'dark';
} catch (e) {
  /* تجاهل */
}
