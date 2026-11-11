// سهولة الوصول لقارئ الشاشة، في مكان واحد لكل الصفحات (بدل تعديل كل نموذج على حدة):
// 1) ربط عنوان الخانة <label> بخانته (for/id) إذا لم يكن مربوطاً — فيُقرأ اسم الخانة، ويركّز الضغط على العنوان على خانته
// 2) الأزرار والروابط ذات الرمز فقط (بلا نص مقروء) تأخذ اسمها من تلميحها title
// يعمل على كل ما يُضاف للصفحة لاحقاً. لا يغيّر ما هو مربوط أو مسمّى من قبل.
(function (root) {
  'use strict';
  const CTRL = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),select,textarea';
  let seq = 0;

  /* الخانة التي يصفها العنوان: أول خانة بعده في نفس الحاوية بلا عنوان ولا اسم — ويُترك إن كانت الحاوية مجموعة خانات (أكثر من اثنتين) أو فيها أكثر من عنوان */
  function controlFor(label) {
    const box = label.parentElement;
    if (!box || box.querySelectorAll('label').length !== 1) return null;
    const after = [...box.querySelectorAll(CTRL)].filter(
      (c) =>
        label.compareDocumentPosition(c) & 4 /* بعده */ &&
        !(c.labels && c.labels.length) &&
        !c.hasAttribute('aria-label') &&
        !c.hasAttribute('aria-labelledby'),
    );
    return after.length && after.length <= 2 ? after[0] : null;
  }
  function linkLabels(scope) {
    let n = 0;
    for (const label of scope.querySelectorAll('label:not([for])')) {
      if (label.control) continue; /* يحوي خانته داخله */
      const c = controlFor(label);
      if (!c) continue;
      if (!c.id) c.id = `a11y-f${++seq}`;
      label.htmlFor = c.id;
      n++;
    }
    return n;
  }
  /* نص مقروء = حرف أو رقم (الرموز مثل ✕ و＋ والإيموجي لا تُقرأ اسماً مفهوماً) */
  const readable = (s) => /[\p{L}\p{N}]/u.test(s || '');
  function nameIconButtons(scope) {
    let n = 0;
    for (const b of scope.querySelectorAll(
      'button[title]:not([aria-label]),a[title]:not([aria-label]),[role=button][title]:not([aria-label])',
    )) {
      const t = b.getAttribute('title').trim();
      if (!t || readable(b.textContent)) continue;
      b.setAttribute('aria-label', t);
      n++;
    }
    return n;
  }
  const fix = (scope) => ({ labels: linkLabels(scope), buttons: nameIconButtons(scope) });

  /* مرة عند التحميل، ثم بعد كل تغيير في الصفحة (مجمّعة في إطار رسم واحد) */
  function watch() {
    let queued = false;
    const run = () => {
      queued = false;
      fix(document.body);
    };
    run();
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }).observe(document.body, { childList: true, subtree: true });
  }
  const api = { fix, linkLabels, nameIconButtons };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.SADEN_A11Y = api;
    if (document.body) watch();
    else document.addEventListener('DOMContentLoaded', watch);
  }
})(typeof self !== 'undefined' ? self : this);
