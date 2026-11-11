// حسابات مشاريع الحفر: مبلغ بند المصروف، إجماليات البنود والشهور والمشروع، أعماق الجسات ونسب الإنجاز، رقم الجسة التالية
// دوال بحتة بلا صفحة ولا خادم — تستخدمها صفحة المشروع (window.SADEN_DRILL) وتُختبر مستقلة (tests/unit/drill-calc.test.js)
(function (root) {
  'use strict';
  const n = (v) => Number(v) || 0;
  const r2 = (v) => Math.round(v * 100) / 100;

  /* مبلغ السطر حسب بنده: الشهري × عدد الشهور (الفارغ = شهر واحد)، الوايت × العدد، أو المبلغ نفسه */
  const AMOUNT = {
    housing: (r) => n(r.monthly) * (n(r.months) || 1),
    water: (r) => n(r.truckCost) * n(r.count),
    guards: (r) => n(r.monthly) * (n(r.months) || 1),
    transport: (r) => n(r.amount),
    other: (r) => n(r.amount),
  };
  const KINDS = Object.keys(AMOUNT);
  const rowAmount = (kind, r) => r2(AMOUNT[kind](r || {}));

  /* كل سطور المصروفات بمبالغها المقرّبة وشهرها (من تاريخ السطر)، مرتبة بالتاريخ */
  function expRows(ex) {
    return KINDS.flatMap((kind) =>
      ((ex || {})[kind] || []).map((r) => ({
        kind,
        row: r,
        month: String(r.date || '').slice(0, 7),
        date: r.date || '',
        amount: rowAmount(kind, r),
      })),
    ).sort((a, b) => a.date.localeCompare(b.date));
  }
  /* مجموع سطور بشرط اختياري: الشهر و/أو البند (الفارغ = الكل) — كل الإجماليات من المبالغ المقرّبة نفسها فلا تختلف */
  function sum(rows, { month = '', kind = '' } = {}) {
    return r2(rows.filter((x) => (!month || x.month === month) && (!kind || x.kind === kind)).reduce((a, x) => a + x.amount, 0));
  }
  const expTotal = (ex) => sum(expRows(ex));

  /* مجموع أعماق الجسات (متر) */
  const holesDepth = (holes) => r2((holes || []).reduce((a, h) => a + n(h.depth), 0));
  /* المنفذ ونسب الإنجاز: من سجل الجسات إن وُجد، وإلا من أرقام المشروع المدخلة؛ النسبة لا تتجاوز 100 وبلا مخطط = null */
  function progress(p, holes) {
    const hs = holes || [];
    const sumM = holesDepth(hs);
    const doneN = hs.length || n(p.done);
    const doneM = hs.length ? sumM : n(p.doneM);
    const pct = (done, planned) => (n(planned) ? Math.min(100, Math.round((done / n(planned)) * 100)) : null);
    return { sumM, doneN, doneM, pct: pct(doneN, p.planned), pctM: pct(doneM, p.plannedM), avgM: hs.length ? r2(sumM / hs.length) : null };
  }
  /* رقم الجسة التالية: أكبر رقم + 1 بنفس البادئة وعدد الخانات (BH-09 ← BH-10)، وأول جسة BH-01 */
  function nextHoleNo(holes) {
    const last = (holes || [])
      .map((h) => h.no)
      .filter((x) => /\d+$/.test(x))
      .sort((a, b) => Number(a.match(/\d+$/)[0]) - Number(b.match(/\d+$/)[0]))
      .pop();
    if (!last) return 'BH-01';
    const m = last.match(/^(.*?)(\d+)$/);
    return `${m[1]}${String(Number(m[2]) + 1).padStart(m[2].length, '0')}`;
  }

  const api = { KINDS, r2, rowAmount, expRows, sum, expTotal, holesDepth, progress, nextHoleNo };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SADEN_DRILL = api;
})(typeof self !== 'undefined' ? self : this);
