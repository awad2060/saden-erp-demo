'use strict';
/* صفحة «form-builder» (viewBuilder) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['form-builder'] = function (S) {
  const { $, $$, SF, api, applyConfig, esc, fieldHtml, fitLetters, head, shell, state, toast, today } = S;
  /* ---------- منشئ النماذج (بدون كود) ----------
   * يعمل على النماذج الجديدة، وعلى النماذج الأصلية: البسيطة تُعدَّل بالكامل، والمركبة يُعدَّل عنوانها وتوقيعاتها.
   * كل شيء قابل للتحرير: الحقول وخصائصها، وأقسام نص الخطاب بالترتيب، والتحية والختام، والمرفقات المطلوبة، ومسار الاعتماد
   * حالة المحرر كلها في كائن واحد B (التعريف، المسار، الأقسام المفتوحة ...) تمر على دوال الرسم والقراءة والربط */
  const QUICK = [
    ['name', 'الإسم'],
    ['iqama', 'رقم الإقامة'],
    ['job', 'الوظيفة'],
    ['prof', 'المهنة بالإقامة'],
  ];
  const TABLE_COLS = () => [
    { label: 'البيان', type: 'text' },
    { label: 'القيمة', type: 'number' },
  ];
  const blankDef = () => ({
    title: '',
    letterTitle: '',
    group: 'عام',
    fields: [
      { key: 'name', label: 'الإسم', type: 'text', required: true },
      { key: 'iqama', label: 'رقم الإقامة', type: 'text', required: true },
    ],
    blocks: [
      { type: 'para', text: 'برجاء الموافقة على ... للموظف الآتي بياناته :' },
      { type: 'fields', keys: [] },
    ],
    amountKey: '',
    needsValue: false,
    noDest: false,
    extraSigs: [],
    sigLabel: '',
  });
  /* رقم النموذج الجديد يُولَّد هنا ليُربط به مساره قبل الحفظ */
  const newFormId = () => `c_${[...crypto.getRandomValues(new Uint8Array(6))].map((x) => x.toString(16).padStart(2, '0')).join('')}`;

  /* النماذج القديمة (فقرة أولى + جدول + فقرة ختامية) تتحول لأقسام قابلة للترتيب */
  function normalizeDef(def, light) {
    def.fields = def.fields || [];
    if (!light && !(def.blocks || []).length) {
      def.blocks = [];
      if (def.intro) def.blocks.push({ type: 'para', text: def.intro });
      if (def.showTable) {
        def.blocks.push({ type: 'fields', keys: [] });
        def.fields
          .filter((f) => f.type === 'textarea' && f.inLetter !== false)
          .forEach((f) => def.blocks.push({ type: 'long', key: f.key, title: '' }));
        def.fields
          .filter((f) => f.type === 'table' && f.inLetter !== false)
          .forEach((f) => def.blocks.push({ type: 'table', key: f.key, title: `${f.label} :` }));
      }
      if (def.outro) def.blocks.push({ type: 'para', text: def.outro });
    }
    if (!light) {
      def.intro = '';
      def.outro = '';
      def.showTable = false;
    }
  }

  /* حالة المحرر: التعريف المنسوخ، ومسار الاعتماد الخاص بهذا النموذج (لكل مقدمي الطلبات) */
  async function loadBuilder(id) {
    const [settings, users] = await Promise.all([api('GET', '/api/admin/settings'), api('GET', '/api/admin/users').catch(() => [])]);
    const overrides = settings.formOverrides || {};
    const builtin = !!id && SF.isBuiltin(id);
    const others = (settings.customForms || []).filter((f) => f.id !== id);
    const orig = builtin ? SF.builtinDef(id) : (settings.customForms || []).find((f) => f.id === id);
    if (id && !orig) {
      location.hash = '#/builder';
      return null;
    }
    const def = JSON.parse(JSON.stringify(builtin ? overrides[id] || orig : orig || blankDef()));
    if (builtin) def.light = !SF.editableFully(id);
    const light = builtin && def.light;
    const formId = id || newFormId();
    if (!builtin) def.id = formId;
    normalizeDef(def, light);
    const routes = JSON.parse(JSON.stringify(settings.routes || []));
    const rule = routes.find((r) => r.form === formId && r.submitter === '*');
    return {
      id,
      def,
      light,
      builtin,
      orig,
      overrides,
      others,
      formId,
      routes,
      rule,
      steps: rule ? rule.steps.map((s) => ({ ...s })) : [],
      routeAllowed: !light,
      approvers: users.filter((u) => u.role !== 'accountant'),
      open: new Set(['basic', 'fields', 'letter']),
      openF: new Set(),
      pvMode: 'letter',
      lastText: null,
    };
  }

  async function viewBuilder(id) {
    if (!SF.settingsTabs(state.user).includes('forms')) {
      location.hash = '#/';
      return;
    }
    const B = await loadBuilder(id);
    if (!B) return;
    B.main = shell('', '#/new');
    draw(B);
  }

  /* ---------- أجزاء الرسم ---------- */
  const typeOpts = (t) => SF.FIELD_TYPES.map(([k, l]) => `<option value="${k}"${t === k ? ' selected' : ''}>${l}</option>`).join('');
  const sec = (B, k, title, html) =>
    `<details class="b-group" data-sec="${k}"${B.open.has(k) ? ' open' : ''}><summary>${title}</summary><div class="b-body">${html}</div></details>`;
  const inputs = (B) => B.def.fields.filter((f) => f.type !== 'heading');
  const fieldOpts = (B, sel, filter, empty) =>
    `${empty !== undefined ? `<option value="">${empty}</option>` : ''}${inputs(B)
      .filter(filter || (() => true))
      .map((f) => `<option value="${f.key}"${sel === f.key ? ' selected' : ''}>${esc(f.label || '(بدون اسم)')}</option>`)
      .join('')}`;
  /* أزرار الترتيب والتكرار والحذف لأي قائمة: kind يميز القائمة */
  const btns = (kind, i, n, dup) =>
    `<span class="b-acts"><button type="button" class="btn sm ghost" data-mv="${kind}" data-i="${i}" data-d="-1" title="لأعلى" ${i ? '' : 'disabled'}>▲</button><button type="button" class="btn sm ghost" data-mv="${kind}" data-i="${i}" data-d="1" title="لأسفل" ${i < n - 1 ? '' : 'disabled'}>▼</button>${dup ? `<button type="button" class="btn sm ghost" data-dup="${kind}" data-i="${i}" title="تكرار">⧉</button>` : ''}<button type="button" class="btn sm bad" data-del="${kind}" data-i="${i}" title="حذف">✕</button></span>`;

  /* أعمدة حقل الجدول */
  function fieldColsHtml(f, i) {
    if (f.type !== 'table') return '';
    return `<div class="b-cols"><div class="hint">أعمدة الجدول (يضيف مقدم الطلب صفوفاً بقدر ما يحتاج):</div>
          ${(f.columns || [])
            .map(
              (
                c,
                k,
              ) => `<div class="b-col"><input class="in" data-c="${i}" data-ck="${k}" data-cp="label" value="${esc(c.label)}" placeholder="اسم العمود">
            <select class="in" data-c="${i}" data-ck="${k}" data-cp="type">${[
              ['text', 'نص'],
              ['number', 'رقم'],
              ['date', 'تاريخ'],
            ]
              .map(([v, l]) => `<option value="${v}"${(c.type || 'text') === v ? ' selected' : ''}>${l}</option>`)
              .join('')}</select>
            ${btns(`c${i}`, k, f.columns.length)}</div>`,
            )
            .join('')}
          <button type="button" class="btn sm" data-cadd="${i}">➕ عمود</button></div>`;
  }
  /* خصائص الحقل (⚙): النص المساعد والقيمة الافتراضية وشرط الظهور */
  function fieldDetHtml(B, f, i) {
    if (f.type === 'heading')
      return `<div class="b-det grid2">
          <div class="field"><label>يظهر فقط عندما يكون الحقل</label><select class="in" data-f="${i}" data-p="showKey">${fieldOpts(B, (f.showIf || {}).key, null, 'دائماً ظاهر')}</select></div>
          <div class="field"><label>قيمته (أو قيم مفصولة بفاصلة)</label><input class="in" data-f="${i}" data-p="showVal" value="${esc((f.showIf || {}).value || '')}" ${(f.showIf || {}).key ? '' : 'disabled'}></div>
        </div>`;
    return `<div class="b-det grid2">
          <div class="field"><label>نص مساعد تحت الحقل</label><input class="in" data-f="${i}" data-p="hint" value="${esc(f.hint || '')}" placeholder="مثال: كما في الإقامة"></div>
          ${['table', 'branch'].includes(f.type) ? '<div></div>' : `<div class="field"><label>قيمة افتراضية</label><input class="in" data-f="${i}" data-p="default" value="${esc(f.default || '')}"></div>`}
          <div class="field"><label>يظهر فقط عندما يكون الحقل</label><select class="in" data-f="${i}" data-p="showKey">${fieldOpts(B, (f.showIf || {}).key, (x) => x.key !== f.key, 'دائماً ظاهر')}</select></div>
          <div class="field"><label>قيمته (أو قيم مفصولة بفاصلة)</label><input class="in" data-f="${i}" data-p="showVal" value="${esc((f.showIf || {}).value || '')}" ${(f.showIf || {}).key ? '' : 'disabled'} placeholder="مثال: مقيم"></div>
          <label class="check"><input type="checkbox" data-f="${i}" data-p="full"${f.full ? ' checked' : ''}> بعرض السطر كاملاً في شاشة الإدخال</label>
          <label class="check"><input type="checkbox" data-f="${i}" data-p="inLetter"${f.inLetter === false ? '' : ' checked'}> يظهر في جدول بيانات الخطاب</label>
        </div>`;
  }
  function fieldRow(B, f, i) {
    const det = B.openF.has(i);
    return `<div class="b-field${f.type === 'heading' ? ' is-head' : ''}">
        <div class="b-line">
          <input class="in" data-f="${i}" data-p="label" value="${esc(f.label)}" placeholder="${f.type === 'heading' ? 'عنوان القسم' : 'اسم الحقل'}">
          <select class="in" data-f="${i}" data-p="type">${typeOpts(f.type)}</select>
          ${f.type === 'heading' ? '<span></span>' : `<label class="check"><input type="checkbox" data-f="${i}" data-p="required"${f.required ? ' checked' : ''}> إلزامي</label>`}
          <button type="button" class="btn sm ${det ? 'primary' : 'ghost'}" data-fdet="${i}" title="خصائص الحقل">⚙</button>
          ${btns('f', i, B.def.fields.length, true)}
        </div>
        ${f.type === 'select' ? `<input class="in" data-f="${i}" data-p="options" value="${esc((f.options || []).join('، '))}" placeholder="الاختيارات مفصولة بفاصلة: خاصة، نقل ثقيل">` : ''}
        ${fieldColsHtml(f, i)}
        ${det ? fieldDetHtml(B, f, i) : ''}
      </div>`;
  }
  /* محتوى قسم من أقسام نص الخطاب حسب نوعه */
  function blockBody(B, b, i) {
    if (b.type === 'para')
      return `<textarea class="in" rows="3" data-b="${i}" data-bp="text" placeholder="اكتب الفقرة، واضغط اسم حقل بالأعلى لإدراج قيمته">${esc(b.text || '')}</textarea>`;
    if (b.type === 'heading')
      return `<input class="in" data-b="${i}" data-bp="text" value="${esc(b.text || '')}" placeholder="مثال: أولاً: بيانات الموظف">`;
    if (b.type === 'box')
      return `<input class="in" data-b="${i}" data-bp="title" value="${esc(b.title || '')}" placeholder="عنوان الصندوق"><textarea class="in" rows="2" data-b="${i}" data-bp="text" placeholder="محتوى الصندوق (يقبل أسماء الحقول بين { })">${esc(b.text || '')}</textarea>`;
    if (b.type === 'fields')
      return `<div class="hint">اختر الحقول التي تظهر في هذا الجدول، أو لا تختر شيئاً ليظهر كل حقل قصير مفعّل له "يظهر في جدول بيانات الخطاب" ومعه الفرع:</div>
        <div class="b-keys">${inputs(B)
          .filter((f) => f.type !== 'table')
          .map(
            (f) =>
              `<label class="check"><input type="checkbox" data-bk="${i}" value="${f.key}"${(b.keys || []).includes(f.key) ? ' checked' : ''}> ${esc(f.label || '(بدون اسم)')}</label>`,
          )
          .join('')}</div>`;
    if (b.type === 'table' || b.type === 'long')
      return `<div class="grid2"><select class="in" data-b="${i}" data-bp="key">${fieldOpts(B, b.key, (f) => (b.type === 'table' ? f.type === 'table' : f.type !== 'table'), '— اختر الحقل —')}</select>
        <input class="in" data-b="${i}" data-bp="title" value="${esc(b.title || '')}" placeholder="${b.type === 'table' ? 'عنوان فوق الجدول (اختياري)' : 'عنوان الصندوق (افتراضياً اسم الحقل)'}"></div>`;
    return '';
  }
  function blockRow(B, b, i) {
    const BT = Object.fromEntries(SF.BLOCK_TYPES);
    return `<div class="b-block"><div class="b-line"><b class="b-bt">${i + 1}. ${esc(BT[b.type] || b.type)}</b>${btns('b', i, B.def.blocks.length, true)}</div>${blockBody(B, b, i)}</div>`;
  }
  const tokens = (B) =>
    `<div class="hint b-toks">اضغط اسم حقل لإدراجه في الفقرة التي تكتبها، ويظهر في الخطاب بقيمته: ${inputs(B)
      .filter((f) => f.label && f.type !== 'table')
      .map((f) => `<button type="button" class="chip-btn" data-tok="${esc(f.label)}">{${esc(f.label)}}</button>`)
      .join(
        ' ',
      )} <button type="button" class="chip-btn" data-tok="الفرع">{الفرع}</button> <button type="button" class="chip-btn" data-tok="التاريخ">{التاريخ}</button> <button type="button" class="chip-btn" data-tok="التفقيط">{التفقيط}</button></div>`;
  const stepsHtml = (B) => {
    const { steps, approvers } = B;
    return `<div class="hint" style="margin-bottom:6px">${steps.length ? 'يبدأ المسار بمقدم الطلب ثم يمر على هذه المراحل بالترتيب:' : 'بدون مراحل خاصة: يمر النموذج على المسار الافتراضي. أضف مراحل ليكون له مسار خاص.'}</div>
      ${steps
        .map(
          (s, i) => `<div class="b-step"><span class="step-n">${i + 1}</span>
        <select class="in" data-s="${i}" data-sp="userId"><option value="">— اختر المعتمد —</option><option value="@branch"${s.userId === '@branch' ? ' selected' : ''}>مدير الفرع (حسب فرع الطلب)</option>${approvers.map((u) => `<option value="${u.id}"${s.userId === u.id ? ' selected' : ''}${!u.active ? ' disabled' : ''}>${esc(u.name)}${u.title ? ` - ${esc(u.title)}` : ''}</option>`).join('')}</select>
        <input class="in" data-s="${i}" data-sp="label" value="${esc(s.label || '')}" placeholder="اسم المرحلة (مثال: اعتماد المدير المالي)">
        ${btns('s', i, steps.length)}</div>`,
        )
        .join('')}
      <button type="button" class="btn sm" data-sadd>➕ مرحلة اعتماد</button>`;
  };

  /* ---------- أقسام المحرر ---------- */
  function basicSec(B) {
    const { def, light, builtin } = B;
    return sec(
      B,
      'basic',
      'البيانات الأساسية',
      `<div class="grid2">
              ${light ? '' : `<div class="field"><label>اسم النموذج<span class="req">*</span></label><input class="in" data-k="title" value="${esc(def.title)}" placeholder="مثال: بدل طبيعة عمل"></div>`}
              ${builtin || light ? '' : `<div class="field"><label>المجموعة في "رفع طلب جديد"</label><input class="in" data-k="group" list="dl-groups" value="${esc(def.group)}"><datalist id="dl-groups">${SF.GROUPS.map((g) => `<option value="${esc(g)}">`).join('')}</datalist></div>`}
              <div class="field full"><label>عنوان الخطاب المطبوع${light ? '' : ' (اختياري)'}</label><input class="in" data-k="letterTitle" value="${esc(def.letterTitle)}" placeholder="مثال: خطاب تعميد بدل طبيعة عمل"></div>
              ${
                light
                  ? ''
                  : `<div class="field"><label>اسم حقل التاريخ</label><input class="in" data-k="dateLabel" value="${esc(def.dateLabel || '')}" placeholder="تاريخ الخطاب"></div>
              <div class="field"><label>اسم حقل الفرع</label><input class="in" data-k="branchLabel" value="${esc(def.branchLabel || '')}" placeholder="الفرع"></div>
              <div class="field"><label>وصف الطلب في القوائم يؤخذ من</label><select class="in" data-k="summaryKey">${fieldOpts(B, def.summaryKey, (f) => f.type !== 'table', 'أول حقل')}</select></div>`
              }
            </div>`,
    );
  }
  function fieldsSec(B) {
    const { def } = B;
    return sec(
      B,
      'fields',
      `الحقول التي يملؤها مقدم الطلب <small class="muted">(${inputs(B).length} حقل — التاريخ والفرع تلقائياً)</small>`,
      `
              ${def.fields.map((f, i) => fieldRow(B, f, i)).join('')}
              <div class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0 4px"><button type="button" class="btn sm" data-fadd="text">➕ حقل جديد</button>
                <button type="button" class="btn sm ghost" data-fadd="heading">➕ عنوان قسم</button><button type="button" class="btn sm ghost" data-fadd="table">➕ جدول</button>
                ${QUICK.filter(([k]) => !def.fields.some((f) => f.key === k))
                  .map(([k, l]) => `<button type="button" class="btn sm ghost" data-quick="${k}">+ ${l}</button>`)
                  .join('')}</div>`,
    );
  }
  function letterSec(B) {
    const blocks = B.def.blocks || [];
    return sec(
      B,
      'letter',
      'نص الخطاب <small class="muted">(أقسام بالترتيب الذي تريده)</small>',
      `${tokens(B)}
              ${blocks.map((b, i) => blockRow(B, b, i)).join('') || '<div class="empty">لا توجد أقسام، أضف قسماً من الأزرار بالأسفل</div>'}
              <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${SF.BLOCK_TYPES.map(([k, l]) => `<button type="button" class="btn sm ghost" data-badd="${k}">➕ ${l}</button>`).join('')}</div>`,
    );
  }
  /* قائمة المرسَل إليهم المخصصة */
  function recipientsHtml(def) {
    if (def.recipientsMode !== 'custom') return '';
    return `${(def.recipients || [])
      .map(
        (x, i) => `<div class="b-rec">
                <select class="in" data-r="${i}" data-rp="prefix">${['الأستاذ', 'المهندس', 'الدكتور', 'المحاسب', 'الشيخ', 'السادة'].map((o) => `<option${(x.prefix || 'الأستاذ') === o ? ' selected' : ''}>${o}</option>`).join('')}</select>
                <input class="in" data-r="${i}" data-rp="name" value="${esc(x.name)}" placeholder="الاسم">
                <input class="in" data-r="${i}" data-rp="title" value="${esc(x.title)}" placeholder="المسمى الوظيفي">
                ${btns('r', i, def.recipients.length)}</div>`,
      )
      .join('')}
                <button type="button" class="btn sm" data-radd style="margin:4px 0 8px">➕ إضافة مرسَل إليه</button>`;
  }
  /* التحية والختام (النماذج القابلة للتعديل بالكامل) */
  function greetHtml(def) {
    return `<label class="check"><input type="checkbox" data-k="noDest"${def.noDest ? ' checked' : ''}> خطاب بدون مرسَل إليهم وبدون تحية وختام (مثل نماذج الخصم)</label>
              <div class="grid2">
                <div class="field"><label>عبارة التحية</label><input class="in" data-k="greetText" value="${esc(def.greetText || '')}" placeholder="تحية طيبة وبعد ,,,"${def.hideGreet ? ' disabled' : ''}></div>
                <div class="field"><label>عبارة الختام</label><input class="in" data-k="closeText" value="${esc(def.closeText || '')}" placeholder="ولسيادتكم جزيل الشكر ,,,"${def.hideClosing ? ' disabled' : ''}></div>
                <label class="check"><input type="checkbox" data-k="hideGreet"${def.hideGreet ? ' checked' : ''}> بدون تحية</label>
                <label class="check"><input type="checkbox" data-k="hideClosing"${def.hideClosing ? ' checked' : ''}> بدون ختام</label>
              </div>`;
  }
  function frameSec(B) {
    const { def, light } = B;
    return sec(
      B,
      'frame',
      'رأس الخطاب وختامه',
      `
              <h4 class="b-sec">المرسَل إليهم</h4>
              <label class="check"><input type="radio" name="rmode" value="route"${def.recipientsMode !== 'custom' ? ' checked' : ''}> تلقائياً من مسار الاعتماد (أسماء المعتمدين ومسمياتهم)</label>
              <label class="check"><input type="radio" name="rmode" value="custom"${def.recipientsMode === 'custom' ? ' checked' : ''}> قائمة أحددها:</label>
              ${recipientsHtml(def)}
              ${light ? '' : greetHtml(def)}
              <label class="check"><input type="checkbox" data-k="hidePrep"${def.hidePrep ? ' checked' : ''}> إخفاء سطر "مُعد الطلب" أسفل الخطاب</label>`,
    );
  }
  function decisionSec(B) {
    const { def, builtin, id } = B;
    return sec(
      B,
      'decision',
      'صندوق القرار والتوقيعات',
      `
              <label class="check"><input type="checkbox" data-k="showDecision"${def.showDecision === false || (def.showDecision === undefined && builtin && SF.byId[id].noDecisionBox) ? '' : ' checked'}> إظهار صندوق قرار المعتمدين</label>
              <div class="field"><label>عنوان الصندوق</label><input class="in" data-k="decisionTitle" value="${esc(def.decisionTitle || '')}" placeholder="قرار الإدارة المالية"></div>
              <div class="grid2">
                <div class="field"><label>عنوان توقيع المعتمد</label><select class="in" data-k="sigLabel"><option value=""${def.sigLabel !== 'step' ? ' selected' : ''}>المسمى الوظيفي للمعتمد</option><option value="step"${def.sigLabel === 'step' ? ' selected' : ''}>اسم المرحلة في المسار</option></select></div>
                <div class="field"><label>توقيعات إضافية على الورق (حتى 6)</label><input class="in" data-k="extraSigs" value="${esc((def.extraSigs || []).join('، '))}" placeholder="مثال: مدير الفرع، الشئون القانونية"></div>
              </div>
              <div class="hint">توقيعات المعتمدين تأتي من مسار الاعتماد وتُختم إلكترونياً عند الاعتماد.</div>`,
    );
  }
  function moreSec(B) {
    const { def } = B;
    return sec(
      B,
      'more',
      'المرفقات والقيمة',
      `
              <div class="field full"><label>مرفقات إلزامية عند رفع الطلب (مفصولة بفاصلة)</label><input class="in" data-k="requiredAttachments" value="${esc((def.requiredAttachments || []).join('، '))}" placeholder="مثال: صورة الإقامة، صورة العقد"></div>
              <div class="field"><label>حقل المبلغ (للوحة المؤشرات والتفقيط)</label><select class="in" data-k="amountKey">${fieldOpts(B, def.amountKey, (f) => f.type === 'number', 'بدون')}</select></div>
              <label class="check"><input type="checkbox" data-k="needsValue"${def.needsValue ? ' checked' : ''}> القيمة تحددها الإدارة المالية عند الاعتماد</label>`,
    );
  }
  const routeSec = (B) =>
    B.routeAllowed
      ? sec(B, 'route', `مسار الاعتماد <small class="muted">(${B.steps.length ? `${B.steps.length} مرحلة` : 'الافتراضي'})</small>`, stepsHtml(B))
      : '';
  /* أزرار الحفظ والاستعادة والحذف وملاحظة التطبيق */
  function footHtml(B) {
    const { builtin, overrides, id, orig } = B;
    return `<div class="ferr"></div>
            <div class="row" style="margin-top:12px;gap:8px"><button type="button" class="btn primary" id="bSave">💾 حفظ</button>
              ${builtin && overrides[id] ? '<button type="button" class="btn" id="bReset">↺ استعادة النص الأصلي</button>' : ''}
              ${!builtin && orig ? '<button type="button" class="btn bad" id="bDel">حذف النموذج</button>' : ''}</div>
            <div class="hint" style="margin-top:8px">${builtin ? 'يطبق النظام التعديل على الطلبات الجديدة والسابقة عند عرضها وطباعتها، وبياناتها لا تتغير.' : 'بعد الحفظ يظهر النموذج في "رفع طلب جديد"، ويمر على المسار الذي حددته أو المسار الافتراضي.'}</div>`;
  }
  function headingOf(B) {
    const { builtin, orig, light } = B;
    const heading = builtin ? `تعديل نموذج أصلي: ${esc(orig.title)}` : orig ? `تعديل نموذج: ${esc(orig.title)}` : 'إنشاء نموذج جديد';
    const note = light
      ? 'هذا النموذج فيه جداول وحسابات خاصة، فيُعدَّل فيه عنوان الخطاب والتوقيعات فقط'
      : 'صمم النموذج ونص الخطاب كما تريد، وشاهد النتيجة مباشرة على اليسار';
    return head(heading, note, '<a class="btn" href="#/settings/forms">رجوع</a>');
  }
  function draw(B) {
    const { light, pvMode } = B;
    B.main.innerHTML = `${headingOf(B)}
        <div class="editor b-editor">
          <div class="card builder">
            ${basicSec(B)}
            ${light ? '' : fieldsSec(B)}
            ${light ? '' : letterSec(B)}
            ${frameSec(B)}
            ${decisionSec(B)}
            ${light ? '' : moreSec(B)}
            ${routeSec(B)}
            ${footHtml(B)}
          </div>
          <div class="preview-wrap"><div class="b-tabs"><button type="button" class="btn sm${pvMode === 'letter' ? ' primary' : ''}" data-pv="letter">معاينة الخطاب</button><button type="button" class="btn sm${pvMode === 'form' ? ' primary' : ''}" data-pv="form">معاينة شاشة الإدخال</button></div><div id="pv"></div></div>
        </div>`;
    bind(B);
    preview(B);
  }

  /* ---------- قراءة المحرر إلى التعريف ---------- */
  const splitList = (v, n) =>
    v
      .split(/[,،]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, n);
  function readKeys(B) {
    const { def, main } = B;
    $$('[data-k]', main).forEach((el) => {
      const k = el.dataset.k;
      if (el.type === 'checkbox') def[k] = el.checked;
      else if (k === 'extraSigs') def[k] = splitList(el.value, 6);
      else if (k === 'requiredAttachments') def[k] = splitList(el.value, 10);
      else if (!el.disabled) def[k] = el.value;
    });
    const rm = $('input[name="rmode"]:checked', main);
    if (rm) def.recipientsMode = rm.value;
    def.recipients = def.recipients || [];
    $$('[data-r]', main).forEach((el) => {
      const rec = def.recipients[el.dataset.r];
      if (rec) rec[el.dataset.rp] = el.value;
    });
  }
  /* خاصية واحدة من خصائص الحقل */
  function readFieldProp(f, p, el) {
    if (['required', 'full'].includes(p)) f[p] = el.checked;
    else if (p === 'inLetter') {
      if (el.checked) delete f.inLetter;
      else f.inLetter = false;
    } else if (p === 'options')
      f.options = el.value
        .split(/[,،]/)
        .map((x) => x.trim())
        .filter(Boolean);
    else if (p === 'showKey') {
      if (el.value) f.showIf = { key: el.value, value: (f.showIf || {}).value || '' };
      else delete f.showIf;
    } else if (p === 'showVal') {
      if (f.showIf) f.showIf.value = el.value;
    } else f[p] = el.value;
  }
  function readLists(B) {
    const { def, main, steps } = B;
    $$('[data-f]', main).forEach((el) => {
      const f = def.fields[el.dataset.f];
      if (f) readFieldProp(f, el.dataset.p, el);
    });
    $$('[data-c]', main).forEach((el) => {
      const c = ((def.fields[el.dataset.c] || {}).columns || [])[el.dataset.ck];
      if (c) c[el.dataset.cp] = el.value;
    });
    $$('[data-b]', main).forEach((el) => {
      const b = def.blocks[el.dataset.b];
      if (b) b[el.dataset.bp] = el.value;
    });
    (def.blocks || []).forEach((b, i) => {
      if (b.type === 'fields') b.keys = $$(`[data-bk="${i}"]:checked`, main).map((x) => x.value);
    });
    $$('[data-s]', main).forEach((el) => {
      const s = steps[el.dataset.s];
      if (s) s[el.dataset.sp] = el.value;
    });
  }
  function read(B) {
    readKeys(B);
    readLists(B);
    $$('details[data-sec]', B.main).forEach((d) => {
      if (d.open) B.open.add(d.dataset.sec);
      else B.open.delete(d.dataset.sec);
    });
  }

  /* ---------- المعاينة ---------- */
  const sampleVal = (f) =>
    f.type === 'number'
      ? '1500'
      : f.type === 'date'
        ? today()
        : f.type === 'select'
          ? (f.options || [])[0] || ''
          : f.choicesFrom === 'branches' || f.type === 'branch'
            ? (state.config.branches || [])[0] || 'الرياض'
            : f.type === 'table'
              ? [
                  Object.fromEntries(
                    (f.columns || []).map((c, k) => [
                      c.key || `c${k + 1}`,
                      c.type === 'number' ? '100' : c.type === 'date' ? today() : `(${c.label})`,
                    ]),
                  ),
                ]
              : /الإسم|اسم الموظف/.test(f.label)
                ? 'محمد أحمد'
                : f.default || `(${f.label})`;
  /* التعريف الحالي كما سيحفظه الخادم (مفاتيح أعمدة الجداول بالترتيب) */
  const liveDef = (def) => ({
    ...def,
    fields: def.fields.map((f) => (f.type === 'table' ? { ...f, columns: (f.columns || []).map((c, k) => ({ ...c, key: `c${k + 1}` })) } : f)),
  });
  /* معاينة شاشة الإدخال، مع إظهار الحقول المشروطة كما في الطلب الحقيقي */
  function formPreview(pv, form) {
    pv.innerHTML = `<div class="card"><h3 style="margin-top:0">${esc(form.title || 'نموذج جديد')}</h3><div class="grid2">${form.fields
      .filter((f) => !f.hidden)
      .map((f) => fieldHtml(f, f.today ? today() : f.default || (f.fromUser ? state.user[f.fromUser] : '') || ''))
      .join('')}</div>
            ${(form.requiredAttachments || []).map((l) => `<div class="field full" style="margin-top:10px"><label>${esc(l)}<span class="req">*</span></label><input type="file" class="in" disabled></div>`).join('')}</div>`;
    form.fields
      .filter((f) => f.showIf)
      .forEach((f) => {
        const sel = $(`[data-key="${f.showIf[0]}"]`, pv);
        const el = $(`[data-key="${f.key}"]`, pv) || $(`[data-table="${f.key}"]`, pv) || $(`[data-hkey="${f.key}"]`, pv);
        const wrap = el && el.closest('.field, .f-head');
        if (!sel || !wrap) return;
        const sync = () => {
          wrap.hidden = ![].concat(f.showIf[1]).includes(sel.value.trim());
        };
        sel.addEventListener('change', sync);
        sel.addEventListener('input', sync);
        sync();
      });
  }
  function letterPreview(pv, form) {
    pv.innerHTML = SF.renderLetter(
      form,
      {
        date: today(),
        branch: state.user.branch || 'الرياض',
        ...Object.fromEntries(
          form.fields.filter((f) => !['date', 'branch'].includes(f.key) && f.type !== 'heading').map((f) => [f.key, sampleVal(f)]),
        ),
      },
      { createdByName: state.user.name },
    );
    fitLetters();
  }
  function preview(B) {
    const pv = $('#pv');
    try {
      const form = B.builtin ? SF.applyOverride(B.id, liveDef(B.def)) : SF.buildCustom({ ...liveDef(B.def), id: 'preview' });
      if (B.pvMode === 'form') formPreview(pv, form);
      else letterPreview(pv, form);
    } catch (err) {
      pv.innerHTML = `<div class="err">${esc(err.message)}</div>`;
    }
  }

  /* ---------- الحفظ والحذف ---------- */
  const fail = (B, msg) => {
    $('.ferr', B.main).innerHTML = `<div class="err">${esc(msg)}</div>`;
  };
  const done = (s, msg) => {
    applyConfig({ ...state.config, customForms: s.customForms, formOverrides: s.formOverrides });
    toast(msg);
    location.hash = '#/settings/forms';
  };
  /* المسار بعد حفظ النموذج حتى يتعرف عليه الخادم */
  async function saveRoute(B, s) {
    const { routeAllowed, rule, steps, routes, formId } = B;
    if (
      routeAllowed &&
      JSON.stringify(((rule || {}).steps || []).map((x) => [x.userId, x.label])) !== JSON.stringify(steps.map((x) => [x.userId, x.label]))
    ) {
      const rest = routes.filter((r) => r !== rule);
      return api('PUT', '/api/admin/settings', {
        routes: steps.length ? [...rest, { id: (rule || {}).id, form: formId, submitter: '*', steps }] : rest,
      });
    }
    return s;
  }
  async function save(B) {
    const { builtin, overrides, id, def, others } = B;
    read(B);
    if (B.routeAllowed && B.steps.some((s) => !s.userId)) {
      fail(B, 'اختر المعتمد في كل مرحلة من مراحل مسار الاعتماد أو احذفها');
      return;
    }
    try {
      const s = await api('PUT', '/api/admin/settings', builtin ? { formOverrides: { ...overrides, [id]: def } } : { customForms: [...others, def] });
      done(await saveRoute(B, s), builtin ? 'تم حفظ تعديل النموذج' : 'تم حفظ النموذج');
    } catch (e) {
      fail(B, e.message);
    }
  }
  async function resetForm(B) {
    if (!confirm('استعادة النص الأصلي لهذا النموذج وإلغاء تعديلاتك عليه؟')) return;
    const rest = { ...B.overrides };
    delete rest[B.id];
    try {
      done(await api('PUT', '/api/admin/settings', { formOverrides: rest }), 'تمت استعادة النص الأصلي');
    } catch (e) {
      fail(B, e.message);
    }
  }
  async function deleteForm(B) {
    if (!confirm(`حذف النموذج "${B.orig.title}"؟`)) return;
    try {
      /* مسار النموذج يُحذف أولاً لأن الخادم يرفض مساراً لنموذج غير موجود */
      if (B.rule) await api('PUT', '/api/admin/settings', { routes: B.routes.filter((r) => r !== B.rule) });
      done(await api('PUT', '/api/admin/settings', { customForms: B.others }), 'تم حذف النموذج');
    } catch (e) {
      fail(B, e.message);
    }
  }

  /* ---------- القوائم: ترتيب وتكرار وحذف وإضافة ---------- */
  const listOf = (B, kind) => {
    const lists = { f: () => B.def.fields, b: () => B.def.blocks, r: () => B.def.recipients, s: () => B.steps };
    return kind[0] === 'c' && kind !== 'c' ? B.def.fields[Number(kind.slice(1))].columns : lists[kind]();
  };
  const nextKey = (def) => {
    let n = 1;
    while (def.fields.some((f) => f.key === `f${n}`)) n++;
    return `f${n}`;
  };
  function moveItem(B, b) {
    const arr = listOf(B, b.dataset.mv),
      i = Number(b.dataset.i),
      j = i + Number(b.dataset.d);
    if (j < 0 || j >= arr.length) return false;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    if (b.dataset.mv === 'f') B.openF.clear();
    return undefined;
  }
  /* حذف حقل يحذف معه أقسام الخطاب والشروط والمبلغ المرتبطة به */
  function deleteItem(B, b) {
    const { def } = B;
    const kind = b.dataset.del,
      [x] = listOf(B, kind).splice(Number(b.dataset.i), 1);
    if (kind !== 'f') return;
    def.blocks = def.blocks
      .filter((bl) => bl.key !== x.key)
      .map((bl) => (bl.keys ? { ...bl, keys: bl.keys.filter((k) => k !== x.key) } : bl));
    def.fields.forEach((f) => {
      if (f.showIf && f.showIf.key === x.key) delete f.showIf;
    });
    if (def.amountKey === x.key) def.amountKey = '';
    B.openF.clear();
  }
  function dupItem(B, b) {
    const kind = b.dataset.dup,
      arr = listOf(B, kind),
      i = Number(b.dataset.i),
      c = JSON.parse(JSON.stringify(arr[i]));
    if (kind === 'f') {
      c.key = nextKey(B.def);
      if (c.type !== 'heading') c.label = `${c.label} (2)`;
      B.openF.clear();
    }
    arr.splice(i + 1, 0, c);
  }
  function addField(B, b) {
    const { def } = B;
    const t = b.dataset.fadd,
      key = nextKey(def);
    def.fields.push({
      key,
      label: t === 'heading' ? 'عنوان قسم' : t === 'table' ? 'جدول' : '',
      type: t,
      required: false,
      ...(t === 'table' ? { columns: TABLE_COLS() } : {}),
    });
    /* الجدول الجديد يُضاف لنص الخطاب تلقائياً */
    if (t === 'table') def.blocks.push({ type: 'table', key, title: '' });
  }
  function addBlock(B, b) {
    const t = b.dataset.badd,
      first = (pred) => (inputs(B).find(pred) || {}).key || '';
    B.def.blocks.push(
      t === 'table'
        ? { type: t, key: first((f) => f.type === 'table'), title: '' }
        : t === 'long'
          ? { type: t, key: first((f) => f.type === 'textarea'), title: '' }
          : t === 'fields'
            ? { type: t, keys: [] }
            : { type: t, text: '', title: '' },
    );
  }

  /* ---------- الربط ---------- */
  /* تغيير النوع أو الشرط أو الأسماء يغيّر خيارات المحرر نفسه */
  function onEditorChange(B, e) {
    if (e.target.closest('#pv')) return;
    read(B);
    const t = e.target,
      p = t.dataset.p,
      k = t.dataset.k;
    if (p === 'type') {
      const f = B.def.fields[t.dataset.f];
      if (f.type === 'table' && !(f.columns || []).length) f.columns = TABLE_COLS();
      if (f.type === 'heading') f.required = false;
    }
    if (['type', 'showKey', 'label'].includes(p) || ['hideGreet', 'hideClosing'].includes(k) || t.dataset.bp === 'key' || t.dataset.sp === 'userId') {
      if (t.dataset.sp === 'userId') {
        const st = B.steps[t.dataset.s];
        if (st && !st.label) st.label = t.value === '@branch' ? 'مدير الفرع' : (B.approvers.find((u) => u.id === t.value) || {}).title || '';
      }
      draw(B);
    } else preview(B);
  }
  function bindInputs(B) {
    const { main } = B;
    main.oninput = (e) => {
      if (e.target.closest('#pv')) return;
      read(B);
      preview(B);
    };
    main.onchange = (e) => onEditorChange(B, e);
    $$('details[data-sec]', main).forEach((d) => {
      d.ontoggle = () => {
        if (d.open) B.open.add(d.dataset.sec);
        else B.open.delete(d.dataset.sec);
      };
    });
    /* المرسَل إليهم: عند التحويل لقائمة مخصصة تبدأ بأسماء المسار الافتراضي */
    $$('input[name="rmode"]', main).forEach((r) => {
      r.onchange = () => {
        read(B);
        if (B.def.recipientsMode === 'custom' && !(B.def.recipients || []).length)
          B.def.recipients = (state.config.defaultRoute || [])
            .slice()
            .reverse()
            .map((x) => ({ prefix: x.prefix || 'الأستاذ', name: x.name, title: x.title }));
        draw(B);
      };
    });
  }
  /* زر يقرأ المحرر ثم ينفذ ثم يعيد الرسم (إلا إذا أرجع false) */
  const onClick = (B, sel, fn) =>
    $$(sel, B.main).forEach((b) => {
      b.onclick = () => {
        read(B);
        if (fn(b) !== false) draw(B);
      };
    });
  function bindButtons(B) {
    onClick(B, '[data-pv]', (b) => {
      B.pvMode = b.dataset.pv;
    });
    onClick(B, '[data-mv]', (b) => moveItem(B, b));
    onClick(B, '[data-del]', (b) => deleteItem(B, b));
    onClick(B, '[data-dup]', (b) => dupItem(B, b));
    onClick(B, '[data-radd]', () => {
      B.def.recipients.push({ prefix: 'الأستاذ', name: '', title: '' });
    });
    onClick(B, '[data-fadd]', (b) => addField(B, b));
    onClick(B, '[data-quick]', (b) => {
      B.def.fields.push({ key: b.dataset.quick, label: QUICK.find(([k]) => k === b.dataset.quick)[1], type: 'text', required: true });
    });
    onClick(B, '[data-fdet]', (b) => {
      const i = Number(b.dataset.fdet);
      if (B.openF.has(i)) B.openF.delete(i);
      else B.openF.add(i);
    });
    onClick(B, '[data-cadd]', (b) => {
      const f = B.def.fields[b.dataset.cadd];
      f.columns = f.columns || [];
      if (f.columns.length < 12) f.columns.push({ label: '', type: 'text' });
    });
    onClick(B, '[data-badd]', (b) => addBlock(B, b));
    onClick(B, '[data-sadd]', () => {
      B.steps.push({ userId: '', label: '' });
      B.open.add('route');
    });
  }
  /* إدراج اسم حقل في آخر فقرة كان المؤشر فيها */
  function bindTokens(B) {
    const { main } = B;
    $$('textarea[data-bp="text"]', main).forEach((t) => {
      t.addEventListener('focus', () => {
        B.lastText = t.dataset.b;
      });
    });
    $$('[data-tok]', main).forEach((b) => {
      b.onmousedown = (e) => e.preventDefault();
      b.onclick = () => {
        const ta = (B.lastText != null && $(`textarea[data-b="${B.lastText}"]`, main)) || $$('textarea[data-bp="text"]', main).pop();
        if (!ta) {
          toast('أضف فقرة نص أولاً');
          return;
        }
        const pos = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
        ta.value = `${ta.value.slice(0, pos)}{${b.dataset.tok}}${ta.value.slice(pos)}`;
        ta.focus();
        ta.selectionStart = ta.selectionEnd = pos + b.dataset.tok.length + 2;
        read(B);
        preview(B);
      };
    });
  }
  function bind(B) {
    bindInputs(B);
    bindButtons(B);
    bindTokens(B);
    $('#bSave').onclick = () => save(B);
    if ($('#bReset')) $('#bReset').onclick = () => resetForm(B);
    if ($('#bDel')) $('#bDel').onclick = () => deleteForm(B);
  }

  return { viewBuilder };
};
