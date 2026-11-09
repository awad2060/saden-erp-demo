'use strict';
/* مسارات الصفحات الجديدة: كل صفحة تسجّل مسارها في SES_ROUTES[<أول جزء من الرابط>] = (S, query, parts) => …
 * فلا يكبر موجّه app.js (route) مع كل صفحة؛ والمسار غير المعروف يعود للرئيسية. */
window.SES_ROUTES = window.SES_ROUTES || {};
window.SES_ROUTE = (S, parts, query) => {
  const f = window.SES_ROUTES[parts[0]];
  if (f) return f(S, query || {}, parts);
  location.hash = '#/';
};
