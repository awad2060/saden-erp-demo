'use strict';
/* صفحة «رفع طلب جديد» (viewNew) — تصميم 2026-11 لسهولة الوصول:
 * كل الأقسام ظاهرة تحت بعض (لا تبويبات مخفية)، وكل طلب صف واضح باسمه تحت عنوان مجموعته،
 * وبحث كبير بعنوان واضح يعرض عدد النتائج، وروابط سريعة لكل قسم، وخطوات الرفع الثلاث أعلى الصفحة.
 * التنسيق: public/css/new-request.css. تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة. */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['new-request'] = function (S) {
  const { $, $$, NF_GROUP, NF_SECTIONS, SF, enabledForms, esc, icon, normAr, shell, state } = S;

  /* الأقسام بمجموعاتها: [{k, l, ic, gs: [[اسم المجموعة، نماذجها]]}] — بترتيب NF_SECTIONS، والمجموعات غير المعروفة في «عام» */
  function sectionsOf() {
    const groups = {};
    enabledForms().forEach((f) => (groups[f.group] = groups[f.group] || []).push(f));
    const secOf = (g) => (NF_SECTIONS.find(([, , , gs]) => gs.includes(g)) || NF_SECTIONS[NF_SECTIONS.length - 1])[0];
    return NF_SECTIONS.map(([k, l, ic]) => ({
      k,
      l,
      ic,
      gs: Object.keys(groups)
        .filter((g) => secOf(g) === k)
        .map((g) => [g, groups[g]]),
    })).filter((s) => s.gs.length);
  }
  const countOf = (s) => s.gs.reduce((n, [, list]) => n + list.length, 0);
  const en = () => window.I18N && I18N.lang === 'en';
  /* نص البحث لكل نموذج: اسمه وعنوان خطابه ومجموعته (وترجمته) */
  const searchText = (f) =>
    normAr([f.title, typeof f.letterTitle === 'string' ? f.letterTitle : '', f.group, en() ? I18N.tr(f.title) : ''].join(' '));

  /* صف طلب: أيقونة مجموعته، واسمه، وملاحظة القيمة إن وُجدت، وسهم */
  const formRow = (f) => {
    const [ic] = NF_GROUP[f.group] || ['file'];
    const note = f.needsValue ? '<small>تحدد الإدارة المالية القيمة</small>' : '';
    return `<li><a class="nr-row" href="#/new/${esc(f.id)}" data-s="${esc(searchText(f))}"><span class="nr-ic" aria-hidden="true">${icon(ic)}</span><span class="nr-t"><b>${esc(f.title)}</b>${note}</span><span class="nr-go" aria-hidden="true">${icon('chevron')}</span></a></li>`;
  };
  const groupBlock = ([g, list], sk) => {
    const id = `nr-${sk}-${normAr(g).replace(/\s+/g, '-')}`;
    return `<div class="nr-gp"><h3 class="nr-gh" id="${esc(id)}">${esc(g)} <small>(${list.length})</small></h3><ul class="nr-list" aria-labelledby="${esc(id)}">${list.map(formRow).join('')}</ul></div>`;
  };
  const sectionBlock = (s) =>
    `<section class="nr-sec card" id="nr-sec-${esc(s.k)}" aria-labelledby="nr-h-${esc(s.k)}"><h2 class="nr-sh" id="nr-h-${esc(s.k)}">${icon(s.ic)}<span>${esc(s.l)}</span><small>${countOf(s)} طلب</small></h2>${s.gs.map((gp) => groupBlock(gp, s.k)).join('')}</section>`;

  /* رأس الصفحة: العنوان، وخطوات الرفع، والبحث، وروابط الأقسام */
  function headHtml(secs, builder) {
    const steps = ['اختر نوع الطلب', 'املأ البيانات وأرفق المستندات', 'أرسل — يصل تلقائياً لأول معتمد'];
    return `<header class="nr-head">
      <div class="nr-title"><h1>رفع طلب جديد</h1>${builder ? '<a class="btn" href="#/builder">إنشاء نموذج</a>' : ''}</div>
      <ol class="nr-steps">${steps.map((t, i) => `<li${i ? '' : ' class="on" aria-current="step"'}><span>${i + 1}</span>${esc(t)}</li>`).join('')}</ol>
      <div class="nr-search"><label for="nfQ">ابحث عن نوع الطلب</label>
        <div class="nr-q">${icon('search')}<input class="in" id="nfQ" type="search" autocomplete="off" spellcheck="false" placeholder="مثال: سكن، سلفة، إجازة…" aria-describedby="nfCount"></div>
        <p class="nr-count" id="nfCount" role="status" aria-live="polite"></p></div>
      ${secs.length > 1 ? `<nav class="nr-jump" aria-label="أقسام الطلبات">${secs.map((s) => `<a href="#nr-sec-${esc(s.k)}" data-jump="${esc(s.k)}">${icon(s.ic)}${esc(s.l)} <small>${countOf(s)}</small></a>`).join('')}</nav>` : ''}
    </header>`;
  }

  function viewNew() {
    const secs = sectionsOf();
    const main = shell('', '#/new');
    const builder = SF.settingsTabs(state.user).includes('forms');
    const total = secs.reduce((n, s) => n + countOf(s), 0);
    main.innerHTML = `<div class="nr">${headHtml(secs, builder)}
      ${secs.length ? `<div id="nfAll">${secs.map(sectionBlock).join('')}</div>` : '<div class="empty">لا توجد نماذج متاحة لك</div>'}
      <div class="empty" id="nfNone" hidden>لا يوجد طلب بهذا الاسم — جرّب كلمة أقصر، أو تصفح الأقسام</div></div>`;
    wire(main, total);
  }

  /* البحث (كل كلمة لازم تظهر في اسم الطلب أو مجموعته) وإخفاء المجموعات والأقسام الفارغة، وEnter يفتح أول نتيجة */
  function wire(main, total) {
    const q = $('#nfQ', main),
      count = $('#nfCount', main);
    const filter = () => {
      const words = normAr(q.value).split(' ').filter(Boolean);
      let shown = 0;
      $$('.nr-row', main).forEach((a) => {
        const ok = words.every((w) => a.dataset.s.includes(w));
        a.parentElement.hidden = !ok;
        if (ok) shown++;
      });
      $$('.nr-gp', main).forEach((g) => (g.hidden = !$$('li', g).some((li) => !li.hidden)));
      $$('.nr-sec', main).forEach((s) => (s.hidden = !$$('.nr-gp', s).some((g) => !g.hidden)));
      $('#nfNone', main).hidden = !words.length || shown > 0;
      count.textContent = words.length ? `${shown} نتيجة من ${total} طلب` : `${total} طلب متاح — اكتب للبحث أو اختر من الأقسام`;
    };
    q.addEventListener('input', filter);
    q.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !q.value.trim()) return;
      const first = $$('.nr-row', main).find((a) => !a.parentElement.hidden);
      if (first) location.hash = first.getAttribute('href');
    });
    /* روابط الأقسام: تمرير للقسم وتركيز عنوانه (لا تغيّر رابط الصفحة) */
    $$('[data-jump]', main).forEach((a) => {
      a.onclick = (e) => {
        e.preventDefault();
        const h = $(`#nr-h-${a.dataset.jump}`, main);
        h.setAttribute('tabindex', '-1');
        h.scrollIntoView({ block: 'start' });
        h.focus({ preventScroll: true });
      };
    });
    filter();
    q.focus();
  }

  return { viewNew };
};
