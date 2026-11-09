'use strict';
/* مركز النماذج: صفحة لكل إدارة بنماذج Excel الموحدة التي يحمّلها المستخدم ويعبّئها ثم يرفعها في صفحتها.
 * النموذج واحد لكل نوع (لا باسم فرع)، وبنفس أعمدة نافذة الرفع ومثالها — من المصدر نفسه، فلا يختلف النموذجان أبداً.
 * كل إدارة تسجّل نماذجها: SES_TEMPLATES.depts[المفتاح] = (S) => ({ title, sub, items: [...] })
 *   البند: { title, desc, file, cols: [عناوين]، sample: [صف مثال]، page: [الرابط، اسم الصفحة]، how: طريقة الرفع }
 *   أو بند بلا ملف (نموذج يتعبأ من صفحته): { title, desc, page, how }
 * الإدارات: الجرد (inventory-kit.js)، وإدارة الحركة (fleet-kit.js). */
(function () {
  let S = null;

  function itemHtml(it, i) {
    const { esc } = S;
    const cols = (it.cols || []).map((c) => `<span class="chip">${esc(c)}</span>`).join(' ');
    const down = it.file ? `<button class="btn primary" data-tpl="${i}">⬇ تحميل النموذج</button>` : '';
    const go = it.page ? `<a class="btn" href="${esc(it.page[0])}">⬆ الرفع من ${esc(it.page[1])}</a>` : '';
    return `<div class="card tpl-item">
      <h3 style="margin:0 0 6px">${esc(it.title)}</h3>
      ${it.desc ? `<p class="muted" style="margin:0 0 10px">${esc(it.desc)}</p>` : ''}
      ${cols ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${cols}</div>` : ''}
      ${it.how ? `<div class="hint" style="margin-bottom:10px">${esc(it.how)}</div>` : ''}
      <div class="row" style="gap:8px;flex-wrap:wrap">${down}${go}${it.file ? `<small class="muted" style="align-self:center"><bdi>${esc(it.file)}</bdi></small>` : ''}</div>
    </div>`;
  }

  /* صفحة مركز نماذج إدارة: active رابطها في القائمة */
  function view(SS, dept, active) {
    S = SS;
    const build = (window.SES_TEMPLATES.depts || {})[dept];
    const main = S.shell('', active);
    if (!build) {
      main.innerHTML = '<div class="card empty-state">مركز النماذج غير موجود</div>';
      return;
    }
    const d = build(S);
    const items = d.items.filter((x) => x && x.show !== false);
    main.innerHTML = `${S.head(`📁 ${S.esc(d.title)}`, S.esc(d.sub || `${items.length} نموذج — حمّل النموذج وعبّئه في Excel ثم ارفعه من صفحته`))}
      <div class="tpl-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">${items.map(itemHtml).join('') || '<div class="card muted">لا توجد نماذج متاحة لك</div>'}</div>`;
    main.querySelectorAll('[data-tpl]').forEach((b) => {
      const it = items[Number(b.dataset.tpl)];
      b.onclick = () => S.downloadXlsx(it.file, [it.cols, ...(it.sample ? [it.sample] : [])], (it.sheet || it.title).slice(0, 31));
    });
  }

  window.SES_TEMPLATES = window.SES_TEMPLATES || {};
  window.SES_TEMPLATES.depts = window.SES_TEMPLATES.depts || {};
  window.SES_TEMPLATES.view = view;
  /* اسم ملف النموذج الموحد للنوع (بلا فرع): نموذج-<النوع>.xlsx */
  window.SES_TEMPLATES.fileOf = (kind) => `نموذج-${String(kind).trim().replace(/\s+/g, '-')}.xlsx`;
})();
