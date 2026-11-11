'use strict';
/* مركز النماذج: صفحة لكل إدارة بنماذج Excel الموحدة التي يحمّلها المستخدم ويعبّئها ثم يرفعها في صفحتها.
 * النموذج واحد لكل نوع (لا باسم فرع)، وبنفس أعمدة نافذة الرفع ومثالها — من المصدر نفسه، فلا يختلف النموذجان أبداً.
 * كل إدارة تسجّل نماذجها: SES_TEMPLATES.depts[المفتاح] = (S) => ({ title, sub, items: [...] })
 *   البند: { title, desc, file, defs: [أعمدة النافذة { label, required, type, options, hint, auto }]، sample: [صف مثال]،
 *            page: [الرابط، اسم الصفحة]، how: طريقة الرفع، guide: { about, help: { مفتاح العمود: شرحه }, steps, notes } }
 *   أو بند بلا ملف (نموذج يتعبأ من صفحته): { title, desc, page, how }
 * ملف النموذج ورقتان: ورقة البيانات (العناوين وصف المثال)، وورقة «شرح النموذج» (الغرض، وشرح كل عمود، وخطوات الرفع، والتنبيهات).
 * نافذة الرفع تقرأ الورقة الأولى فقط، فورقة الشرح لا تؤثر على الرفع.
 * الإدارات: الجرد (inventory-kit.js)، وإدارة الحركة (fleet-kit.js). */
(function () {
  let S = null;
  const GUIDE_SHEET = 'شرح النموذج';

  /* طريقة كتابة العمود: من تعريفه (قائمة اختيارات، تاريخ، رقم، ترقيم تلقائي) */
  function howToFill(c) {
    if (c.auto) return 'ترقيم فقط للترتيب — لا يُحفظ في النظام';
    if (c.type === 'select' && (c.options || []).length) return `واحدة من: ${c.options.join(' / ')}`;
    if (c.type === 'date') return 'تاريخ ميلادي: 2026-10-20 (سنة-شهر-يوم)، أو خانة تاريخ في Excel';
    if (c.type === 'number') return 'رقم';
    return 'نص';
  }
  /* صفوف ورقة الشرح، وأرقام صفوف العناوين فيها */
  function guideRows(t) {
    const g = t.guide || {},
      help = g.help || {};
    const rows = [[`شرح ${t.title}`]],
      heads = [];
    const section = (name, ...rest) => {
      rows.push([]);
      heads.push(rows.length);
      rows.push([name, ...rest]);
    };
    if (g.about) rows.push([g.about]);
    section('العمود', 'إلزامي؟', 'طريقة الكتابة', 'الشرح');
    for (const c of t.defs) rows.push([c.label, c.required ? 'إلزامي' : 'اختياري', howToFill(c), help[c.key] || c.hint || '']);
    section('خطوات الرفع');
    const steps = [
      'عبّئ ورقة البيانات (الورقة الأولى): صف لكل سجل، ولا تغيّر عناوين الأعمدة ولا ترتيبها.',
      'احذف صف المثال قبل الرفع.',
      ...(g.steps || (t.how ? [t.how] : [])),
      'يعرض النظام الصفوف في جدول للمراجعة قبل الحفظ: صحّح أي خانة ثم اضغط «حفظ».',
    ];
    steps.forEach((x, i) => rows.push([`${i + 1}. ${x}`]));
    if ((g.notes || []).length) {
      section('تنبيهات');
      g.notes.forEach((x) => rows.push([`• ${x}`]));
    }
    return { rows, heads };
  }
  /* أوراق ملف النموذج: البيانات أولاً (تقرؤها نافذة الرفع)، ثم الشرح */
  function sheets(t) {
    const data = { name: (t.sheet || t.title).slice(0, 31), rows: [t.defs.map((c) => c.label), ...(t.sample ? [t.sample] : [])] };
    return [data, { name: GUIDE_SHEET, widths: [34, 12, 44, 90], ...guideRows(t) }];
  }
  const download = (SS, t) => SS.downloadXlsx(t.file, sheets(t));

  function itemHtml(it, i) {
    const { esc } = S;
    const cols = (it.defs || [])
      .map((c) => `<span class="chip">${esc(c.label)}${c.required ? '<span class="req">*</span>' : ''}</span>`)
      .join(' ');
    const down = it.file ? `<button class="btn primary" data-tpl="${i}">⬇ تحميل النموذج</button>` : '';
    const go = it.page ? `<a class="btn" href="${esc(it.page[0])}">⬆ الرفع من ${esc(it.page[1])}</a>` : '';
    const about = it.desc || (it.guide || {}).about;
    return `<div class="card tpl-item">
      <h3 style="margin:0 0 6px">${esc(it.title)}</h3>
      ${about ? `<p class="muted" style="margin:0 0 10px">${esc(about)}</p>` : ''}
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
    main.innerHTML = `${S.head(`📁 ${S.esc(d.title)}`, S.esc(d.sub || `${items.length} نموذج — حمّل النموذج وعبّئه في Excel ثم ارفعه من صفحته. في كل ملف ورقة «${GUIDE_SHEET}» بشرح الأعمدة وطريقة الرفع`))}
      <div class="tpl-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">${items.map(itemHtml).join('') || '<div class="card muted">لا توجد نماذج متاحة لك</div>'}</div>`;
    main.querySelectorAll('[data-tpl]').forEach((b) => {
      b.onclick = () => download(S, items[Number(b.dataset.tpl)]);
    });
  }

  window.SES_TEMPLATES = window.SES_TEMPLATES || {};
  window.SES_TEMPLATES.depts = window.SES_TEMPLATES.depts || {};
  Object.assign(window.SES_TEMPLATES, { view, sheets, download, GUIDE_SHEET });
  /* اسم ملف النموذج الموحد للنوع (بلا فرع): نموذج-<النوع>.xlsx */
  window.SES_TEMPLATES.fileOf = (kind) => `نموذج-${String(kind).trim().replace(/\s+/g, '-')}.xlsx`;
})();
