'use strict';
/* صفحة «notes» (viewNotes) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['notes'] = function (S) {
  const {
    $,
    SN_PRI,
    dt,
    esc,
    head,
    icon,
    shell,
    sn,
    snBar,
    snCaretEnd,
    snLoad,
    snNavBadge,
    snNew,
    snPri,
    snRender,
    snSave,
    snTitle,
    snWire,
    snWrap,
    state,
    toast,
  } = S;
  /* صفحة الملاحظات: كل الملاحظات، أو ملاحظة واحدة (فتح في صفحة مستقلة) */
  async function viewNotes(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/notes');
    await snLoad(true);
    snRender();
    const one = query.id && sn.list.find((n) => n.id === query.id);
    const draw = () => {
      if (!document.body.contains(main)) {
        state.snPage = null;
        return;
      }
      const rank = (n) => SN_PRI.length - SN_PRI.findIndex(([k]) => k === snPri(n));
      const L = one
        ? [one].filter((n) => sn.list.includes(n))
        : sn.list.slice().sort((a, b) => rank(b) - rank(a) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
      main.innerHTML = `${head(one ? snTitle(one) : 'الملاحظات اللاصقة', one ? 'ملاحظة في صفحة مستقلة — يحفظها النظام تلقائياً' : 'ملاحظاتك الخاصة — لا يراها غيرك، وتُحفظ تلقائياً مع الكتابة', one ? '<a class="btn" href="#/notes">كل الملاحظات</a>' : `<button class="btn primary" id="snpNew">${icon('plus')} ملاحظة جديدة</button>`)}
        <div class="snp-grid${one ? ' one' : ''}" translate="no" data-noicon>${L.map((n) => `<div class="snp sn sn-${n.color || 'yellow'} pr-${snPri(n)}" data-snp="${n.id}">${snWrap(n, `${snBar(n, true)}<small class="snp-at">آخر تعديل: ${esc(dt(n.updatedAt || n.createdAt))}</small>`)}</div>`).join('') || `<div class="card empty">${one ? 'الملاحظة محذوفة' : 'لا توجد ملاحظات — اضغط «ملاحظة جديدة»'}</div>`}</div>`;
      for (const n of L) {
        const box = $(`[data-snp="${n.id}"]`, main);
        snWire(box, n, () => {
          if (one) location.hash = '#/notes';
          else draw();
          snNavBadge();
        });
        $('[data-sn-float]', box).onclick = () => {
          snSave(n, { open: !n.open }, 50);
          draw();
          snNavBadge();
          toast(n.open ? 'ستظهر عائمة فوق صفحات النظام' : 'أخفيتها من الصفحات — تبقى هنا وفي القائمة');
        };
      }
      const nb = $('#snpNew');
      if (nb)
        nb.onclick = async () => {
          const n = await snNew({ open: false });
          draw();
          snNavBadge();
          const t = $(`[data-sn-t="${n.id}"]`);
          if (t) t.focus();
        };
      if (one) {
        const t = $(`[data-sn-t="${one.id}"]`);
        if (t) snCaretEnd(t);
        document.title = `${snTitle(one)} — ملاحظة`;
      }
    };
    state.snPage = draw;
    draw();
  }

  return { viewNotes };
};
