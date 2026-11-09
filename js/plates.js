/* حروف اللوحات السعودية وأرقامها: تفكيك اللوحة وتوحيدها، والمقابل الإنجليزي للوحة العربية.
 * مشترك بين الخادم (server/lib/fuel.js ومطابقة المحروقات، وserver/lib/fleet.js وفحص اللوحتين) والواجهة (اقتراح اللوحة الإنجليزية):
 * في الخادم بـ require، وفي الواجهة SADEN_PLATES. */
(function (root) {
  'use strict';
  /* حروف اللوحات السعودية: المقابل الإنجليزي ← العربي */
  const LATIN = {
    A: 'ا',
    B: 'ب',
    J: 'ح',
    D: 'د',
    R: 'ر',
    S: 'س',
    X: 'ص',
    T: 'ط',
    E: 'ع',
    G: 'ق',
    K: 'ك',
    L: 'ل',
    Z: 'م',
    N: 'ن',
    H: 'ه',
    U: 'و',
    V: 'ي',
    Y: 'ي',
  };
  const AR_DIG = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
  };
  /* توحيد الحرف العربي: الهمزات والتاء المربوطة والألف المقصورة */
  const normAr = (c) => ({ أ: 'ا', إ: 'ا', آ: 'ا', ٱ: 'ا', ة: 'ه', ى: 'ي', ئ: 'ي', ؤ: 'و' })[c] || c;

  /* تفكيك اللوحة إلى حروف وأرقام موحّدة */
  function plateParts(s) {
    const str = String(s == null ? '' : s).toUpperCase();
    let letters = '',
      digits = '',
      latin = false;
    for (const ch of str) {
      if (AR_DIG[ch]) digits += AR_DIG[ch];
      else if (/[0-9]/.test(ch)) digits += ch;
      else if (LATIN[ch]) {
        letters += LATIN[ch];
        latin = true;
      } else if (/[ء-ي]/.test(ch)) letters += normAr(ch);
    }
    return { letters, digits, latin };
  }
  /* المقابل الإنجليزي للوحة عربية (حرفاً بحرف بنفس الترتيب): أ ب ح 1234 ← A B J 1234 */
  const AR_LATIN = Object.fromEntries(
    Object.entries(LATIN)
      .filter(([k]) => k !== 'Y')
      .map(([k, v]) => [v, k]),
  );
  function plateLatin(s) {
    const { letters, digits } = plateParts(s);
    return [...[...letters].map((c) => AR_LATIN[c] || c), digits].join(' ');
  }

  const api = { LATIN, AR_DIG, normAr, plateParts, plateLatin };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SADEN_PLATES = api;
})(typeof self !== 'undefined' ? self : this);
