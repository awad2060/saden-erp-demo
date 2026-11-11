/* نواة ترجمة الواجهة (العربية ← لغة أخرى): قاموس للعبارات D، وأنماط للعبارات المتغيرة P.
 * مشتركة بين المتصفح (window.SES_I18N_CORE) والاختبارات (require). يستخدمها public/js/i18n.js.
 * مفتاح القاموس قد يحوي أماكن للمتغيرات: 'باقي {0} أيام' ← '{0} days left' (والترجمة ترتّبها كما تشاء: {1} … {0}).
 * ترتيب الترجمة لكل نص: العبارة كاملة ← نمط P ← عبارة بأماكن متغيرات ← فصل الرمز في أولها (➕ 📥 …)
 * ← أجزاء مفصولة بفاصل (— ← ، | : ·)
 * ← استبدال الكلمات المعروفة داخله. نص بلا حروف عربية يعود كما هو، ونص بلا ترجمة يبقى بالعربية. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SES_I18N_CORE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /* اللغات المتاحة: اتجاهها، واسمها مكتوباً بلغتها (لقائمة الاختيار) — العربية الأصل (لا ترجمة) */
  const LANGS = {
    ar: { dir: 'rtl', name: 'العربية' },
    en: { dir: 'ltr', name: 'English' },
    ur: { dir: 'rtl', name: 'اردو' },
  };
  const langOf = (v) => (Object.prototype.hasOwnProperty.call(LANGS, v) ? v : 'ar');

  const AR = /[؀-ۿ]/;
  const AR_G = /[ء-ي]/g;
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const SEPS = [' — ', ' ← ', ' → ', '، ', ' | ', ' - ', ': ', ' · '];
  const SLOT = /\{(\d+)\}/g;
  const HAS_SLOT = /\{\d+\}/;
  const SLOT_MAX = 300;

  /* عبارة بأماكن للمتغيرات ← [تعبير، أرقام الأماكن بترتيب ظهورها، الترجمة].
   * المكان قد يكون فارغاً: المتغير في الصفحة غالباً عنصر HTML منفصل عن النص (عدّاد، أيقونة) */
  function slotPattern(key, val) {
    const order = [];
    const parts = key.split(SLOT);
    /* المسافة الملاصقة للمكان قد تسقط عند بداية النص أو نهايته فقط (النص بعد أيقونة أو عدّاد يبدأ بلا مسافة)،
     * فلا يطابق الثابت حرفاً داخل كلمة */
    const lit = (part, i) => {
      let s = escRe(part);
      if (i > 0) s = s.replace(/^ /, '(?: |(?<=^))');
      if (i < parts.length - 1) s = s.replace(/ $/, '(?: |(?=$))');
      return s;
    };
    const src = parts.map((part, i) => (i % 2 ? (order.push(part), '(.*?)') : lit(part, i))).join('');
    return [new RegExp('^' + src + '$'), order, val];
  }

  /* createTranslator({ D, P, dir }) ← دالة تترجم نصاً واحداً (مع ذاكرة مؤقتة) */
  function createTranslator({ D, P = [], dir = 'ltr' }) {
    const DN = {};
    const SLOTS = [];
    /* عبارة الأماكن التي نصها الثابت أقل من 3 حروف عربية (ج{0}، {0} د) تطابق كلمات عادية، فلا تُستخدم */
    const longEnough = (k) => (k.replace(SLOT, '').match(AR_G) || []).length >= 3;
    for (const k of Object.keys(D)) {
      if (!HAS_SLOT.test(k)) DN[norm(k)] = D[k];
      else if (longEnough(k)) SLOTS.push(slotPattern(norm(k), D[k]));
    }
    /* الأطول نصاً ثابتاً أولاً (الأدق) */
    SLOTS.sort((a, b) => b[0].source.length - a[0].source.length);
    const SUB = Object.keys(DN)
      .filter((k) => k.length > 2)
      .sort((a, b) => b.length - a.length)
      .map((k) => [new RegExp(`(^|[^\\u0600-\\u06FF])${escRe(k)}(?![\\u0600-\\u06FF])`, 'g'), DN[k]]);
    /* في اللغات من اليسار لليمين: الفاصلة العربية والسهم ← بصيغتهما اللاتينية */
    const joinOf = (sep) => (dir === 'ltr' ? (sep === '، ' ? ', ' : sep === ' ← ' ? ' → ' : sep) : sep);
    const cache = new Map();
    const byPattern = (t) => {
      for (const [re, out] of P) {
        const m = re.exec(t);
        if (m) return out.replace(/\$(\d)/g, (x, i) => tr(m[i] || ''));
      }
      return null;
    };
    /* النص الطويل (غالباً بيانات المستخدم) لا يدخل المطابقة: (.+?) المتكرر بطيء على النصوص الطويلة */
    const bySlots = (t) => {
      if (t.length > SLOT_MAX) return null;
      for (const [re, order, out] of SLOTS) {
        const m = re.exec(t);
        if (!m) continue;
        const val = {};
        order.forEach((n, i) => (val[n] = tr(m[i + 1])));
        /* المكان الفارغ (متغير هو عنصر HTML منفصل) لا يترك مسافة زائدة */
        return norm(out.replace(SLOT, (x, n) => (val[n] !== undefined ? val[n] : x)));
      }
      return null;
    };
    const bySeparator = (t) => {
      const sep = SEPS.find((s) => t.includes(s));
      return sep
        ? t
            .split(sep)
            .map((x) => tr(x))
            .join(joinOf(sep))
        : null;
    };
    const byWords = (t) => SUB.reduce((out, [re, w]) => out.replace(re, (m, p) => p + w), t);
    function translate(t) {
      if (DN[t] !== undefined) return DN[t];
      for (const step of [byPattern, bySlots]) {
        const out = step(t);
        if (out !== null) return out;
      }
      const pre = /^([^؀-ۿ\w"(«]+)(?=[؀-ۿ])/.exec(t);
      if (pre && pre[1].trim()) return pre[1] + tr(t.slice(pre[1].length));
      const sep = bySeparator(t);
      return sep !== null ? sep : byWords(t);
    }
    function tr(text) {
      if (!text || !AR.test(text)) return text;
      if (cache.has(text)) return cache.get(text);
      const lead = text.match(/^\s*/)[0],
        tail = text.match(/\s*$/)[0];
      const out = lead + translate(norm(text)) + tail;
      cache.set(text, out);
      return out;
    }
    return tr;
  }

  return { LANGS, langOf, createTranslator, norm, HAS_SLOT };
});
