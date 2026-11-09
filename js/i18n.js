/* ترجمة واجهة المنصة إلى الإنجليزية (الخطابات والمخالصات المطبوعة تبقى بالعربية)
 * - قاموس للعبارات الثابتة + قواعد للعبارات المتغيرة، ويُترجم نص الصفحة عند العرض
 * - لا يُترجم: الخطابات (.letter)، برنامج التصفية، وما يكتبه المستخدمون (الرسائل، الملاحظات، الأسماء) */
(function () {
  'use strict';
  /* القاموس D والأنماط P: من ملفات i18n-dict*.js وi18n-more*.js (تُحمَّل قبله) */
  const { D, P } = window.SES_I18N;
  /* ---------- نهاية الإضافات ---------- */
  const AR = /[؀-ۿ]/;
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const KEYS = Object.keys(D)
    .map(norm)
    .sort((a, b) => b.length - a.length);
  const DN = {};
  for (const k of Object.keys(D)) DN[norm(k)] = D[k];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const SUB = KEYS.filter((k) => k.length > 2).map((k) => [new RegExp(`(^|[^\\u0600-\\u06FF])${esc(k)}(?![\\u0600-\\u06FF])`, 'g'), DN[k]]);
  const cache = new Map();
  function tr(text) {
    if (!text || !AR.test(text)) return text;
    if (cache.has(text)) return cache.get(text);
    const lead = text.match(/^\s*/)[0],
      tail = text.match(/\s*$/)[0];
    let t = norm(text),
      out = null;
    const pre = /^([^؀-ۿ\w"(«]+)(?=[؀-ۿ])/.exec(t);
    if (pre && pre[1].trim()) {
      out = pre[1] + tr(t.slice(pre[1].length));
      cache.set(text, lead + out + tail);
      return lead + out + tail;
    }
    if (DN[t] !== undefined) out = DN[t];
    if (out === null)
      for (const [re, en] of P) {
        const m = re.exec(t);
        if (m) {
          out = en.replace(/\$(\d)/g, (x, i) => tr(m[i] || ''));
          break;
        }
      }
    if (out === null) {
      const seps = [' — ', ' ← ', ' → ', '، ', ' | ', ' - ', ': ', ' · '];
      const sep = seps.find((s) => t.includes(s));
      if (sep)
        out = t
          .split(sep)
          .map((x) => tr(x))
          .join(sep === '، ' ? ', ' : sep === ' ← ' ? ' → ' : sep);
    }
    if (out === null) {
      out = t;
      for (const [re, en] of SUB) out = out.replace(re, (m, p) => p + en);
    }
    out = lead + out + tail;
    cache.set(text, out);
    return out;
  }
  /* ما لا يُترجم: الخطابات المطبوعة، وما يكتبه المستخدمون */
  const SKIP =
    '.letter, iframe, script, style, textarea, .mail-body, .mail-prev, .nr-body, .nc-text, .np-txt span, [data-noi18n], .snap-val';
  const done = new WeakMap(),
    attrDone = new WeakMap();
  function trNode(n) {
    if (n.nodeType === 3) {
      const p = n.parentElement;
      if (!p || p.closest(SKIP)) return;
      const v = n.nodeValue;
      if (done.get(n) === v || !AR.test(v)) return;
      const out = tr(v);
      done.set(n, out);
      if (out !== v) n.nodeValue = out;
      return;
    }
    if (n.nodeType !== 1 || n.closest(SKIP)) return;
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
    if (n.tagName === 'OPTION' && !n.hasAttribute('value')) n.setAttribute('value', n.textContent);
    if (n.tagName === 'INPUT' && (n.type === 'button' || n.type === 'submit') && AR.test(n.value)) n.value = tr(n.value);
    for (const c of n.childNodes) trNode(c);
  }
  let obs = null;
  const I18N = {
    lang: (() => {
      try {
        return localStorage.getItem('lang') === 'en' ? 'en' : 'ar';
      } catch {
        return 'ar';
      }
    })(),
    tr: (s) => (I18N.lang === 'en' ? tr(s) : s),
    set(lang) {
      try {
        localStorage.setItem('lang', lang);
      } catch {
        /* تجاهل */
      }
      location.reload();
    },
    start() {
      if (I18N.lang !== 'en') return;
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
      document.documentElement.classList.add('lang-en');
      const run = () => {
        trNode(document.body);
        obs = new MutationObserver((ms) => {
          for (const m of ms) {
            if (m.type === 'characterData') trNode(m.target);
            else m.addedNodes.forEach(trNode);
            if (m.type === 'attributes') trNode(m.target);
          }
        });
        obs.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['placeholder', 'title'],
        });
      };
      if (document.body) run();
      else document.addEventListener('DOMContentLoaded', run);
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
