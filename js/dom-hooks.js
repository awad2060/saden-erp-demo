'use strict';
/* سلوك عام بالسمات بدل الكود داخل HTML (onerror / onclick) — لتعمل الصفحات مع سياسة المحتوى script-src 'self':
 * data-rmerr: صورة تُزال إن تعذر تحميلها، data-cobg: لون خلفية شعار الشركة من الصورة بعد تحميلها، data-print: زر طباعة */
(function () {
  document.addEventListener(
    'error',
    (e) => {
      const t = e.target;
      if (t && t.tagName === 'IMG' && t.hasAttribute('data-rmerr')) t.remove();
    },
    true,
  );
  document.addEventListener(
    'load',
    (e) => {
      const t = e.target;
      if (t && t.tagName === 'IMG' && t.hasAttribute('data-cobg') && window.coBg) window.coBg(t);
    },
    true,
  );
  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('[data-print]')) window.print();
  });
})();
