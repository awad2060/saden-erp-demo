/* ترجمة واجهة المنصة: العربية (الأصل)، والإنجليزية، والأوردو (الخطابات والمخالصات المطبوعة تبقى بالعربية)
 * - النواة في i18n-core.js، والقواميس لكل لغة في window.SES_I18N[<اللغة>] = { D, P } (ملفات i18n-*.js تُحمَّل قبله)
 * - يُترجم نص الصفحة عند العرض، ولا يُترجم: الخطابات (.letter)، وبرنامج التصفية، وما يكتبه المستخدمون */
(function () {
  'use strict';
  const { LANGS, langOf, createTranslator } = window.SES_I18N_CORE;
  const AR = /[؀-ۿ]/;
  const lang = (() => {
    try {
      return langOf(localStorage.getItem('lang'));
    } catch {
      return 'ar';
    }
  })();
  const dict = (window.SES_I18N || {})[lang];
  const tr = lang === 'ar' || !dict ? (s) => s : createTranslator({ ...dict, dir: LANGS[lang].dir });

  /* ما لا يُترجم: الخطابات المطبوعة، وما يكتبه المستخدمون */
  const SKIP =
    '.letter, iframe, script, style, textarea, .mail-body, .mail-prev, .nr-body, .nc-text, .np-txt span, [data-noi18n], .snap-val';
  /* مربع النص: محتواه للمستخدم فلا يُترجم، أما تلميحه (placeholder / title) فواجهة تُترجم */
  const SKIP_ATTRS = SKIP.replace('textarea, ', '');
  const done = new WeakMap(),
    attrDone = new WeakMap();
  function trText(n) {
    const p = n.parentElement;
    if (!p || p.closest(SKIP)) return;
    const v = n.nodeValue;
    if (done.get(n) === v || !AR.test(v)) return;
    const out = tr(v);
    done.set(n, out);
    if (out !== v) n.nodeValue = out;
  }
  function trAttrs(n) {
    for (const a of ['placeholder', 'title', 'aria-label']) {
      const v = n.getAttribute(a);
      if (!v || !AR.test(v)) continue;
      const seen = attrDone.get(n) || {};
      if (seen[a] === v) continue;
      const out = tr(v);
      seen[a] = out;
      attrDone.set(n, seen);
      if (out !== v) n.setAttribute(a, out);
    }
  }
  function trNode(n) {
    if (n.nodeType === 3) return trText(n);
    if (n.nodeType !== 1) return;
    if (n.closest(SKIP)) {
      if (!n.closest(SKIP_ATTRS)) trAttrs(n);
      return;
    }
    trAttrs(n);
    if (n.tagName === 'OPTION' && !n.hasAttribute('value')) n.setAttribute('value', n.textContent);
    if (n.tagName === 'INPUT' && (n.type === 'button' || n.type === 'submit') && AR.test(n.value)) n.value = tr(n.value);
    for (const c of n.childNodes) trNode(c);
  }
  /* ترجمة الصفحة الآن وكل ما يُضاف إليها بعد ذلك */
  function watch() {
    trNode(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'characterData') trNode(m.target);
        else m.addedNodes.forEach(trNode);
        if (m.type === 'attributes') trNode(m.target);
      }
    }).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });
  }
  const I18N = {
    lang,
    LANGS,
    tr,
    set(l) {
      try {
        localStorage.setItem('lang', langOf(l));
      } catch {
        /* تجاهل */
      }
      location.reload();
    },
    start() {
      if (lang === 'ar') return;
      const html = document.documentElement;
      html.lang = lang;
      html.dir = LANGS[lang].dir;
      html.classList.add(`lang-${lang}`);
      if (document.body) watch();
      else document.addEventListener('DOMContentLoaded', watch);
      const wrap =
        (fn) =>
        (msg, ...rest) =>
          fn.call(window, tr(String(msg ?? '')), ...rest);
      window.confirm = wrap(window.confirm);
      window.alert = wrap(window.alert);
      window.prompt = wrap(window.prompt);
    },
  };
  window.I18N = I18N;
  I18N.start();
})();
