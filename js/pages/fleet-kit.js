'use strict';
/* أدوات أسطول السيارات المشتركة بين صفحاته (fleet.js وfleet-list.js): حقول المركبة، وأعمدة التسجيل الجماعي وقالبه،
 * وحالة المستندات والصيانة، وملكية المركبة. تُستدعى داخل الصفحة بـ S (أدوات app.js المشتركة). */
(function () {
  /* أدوات app.js المشتركة: تُضبط عند استدعاء الصفحة لـ kit */
  let state = null;
  /* «حفارة»: الحفارات مركبات في الأسطول يديرها قسم الحفر (وتظهر في سجل الحفارات) */
  const VEH_KINDS = ['ملاكي', 'غمارة', 'غمارتين', 'دينة', 'معدة', 'حفارة', 'أخرى'];
  /* نوع تصنيع الحفارة (يتحقق منه الخادم: RIG_MFG في server/lib/ops.js) */
  const RIG_MFG = ['محلي', 'مستورد', 'تصنيع ورش سادن'];
  /* ملكية المركبة: سيارة الشركة أو سيارة خاصة؛ المركبات المسجلة قبل إضافة الحقل سيارات شركة */
  const OWNERS = ['شركة', 'خاصة'];
  const ownerOf = (v) => (v.owner === 'خاصة' ? 'خاصة' : 'شركة');
  /* صاحب العهدة: «السائق» في سيارة الشركة، و«المالك» في السيارة الخاصة */
  const WHO = {
    شركة: { driver: 'السائق / المستخدم الفعلي', driverIqama: 'رقم هوية / إقامة السائق', short: 'السائق' },
    خاصة: { driver: 'المالك', driverIqama: 'رقم هوية / إقامة المالك', short: 'المالك' },
  };
  const whoOf = (v) => WHO[ownerOf(v || {})];
  /* حقول المركبة (v: المركبة عند التعديل، فتتبع تسمية صاحب العهدة ملكيتها) */
  const FLEET_FIELDS = (v) => [
    [
      'البيانات الفنية والتعريفية',
      [
        { key: 'plate', label: 'رقم اللوحة (عربي)', required: true, hint: 'حروف عربية وأرقام، مثال: أ ب ح 1234' },
        {
          key: 'plateEn',
          label: 'رقم اللوحة (إنجليزي)',
          required: true,
          hint: 'يُقترح من العربي — حروف إنجليزية وأرقام، مثال: A B J 1234 (ملف المحروقات يُطابَق بأيهما)',
        },
        { key: 'owner', label: 'الملكية', type: 'select', options: OWNERS, default: 'شركة' },
        { key: 'vType', label: 'فئة المركبة', type: 'select', options: VEH_KINDS },
        { key: 'brand', label: 'الماركة', required: true, hint: 'مثال: تويوتا' },
        { key: 'model', label: 'الطراز', hint: 'مثال: هايلكس' },
        { key: 'year', label: 'سنة الصنع' },
        { key: 'color', label: 'اللون' },
        { key: 'fuel', label: 'نوع الوقود', type: 'select', options: ['ديزل', 'بنزين'] },
        { key: 'record', label: 'رقم الاستمارة / السجل' },
        { key: 'chassis', label: 'رقم الهيكل' },
        { key: 'branch', label: 'الفرع', type: 'select', options: state.config.branches || [], required: true },
        { key: 'status', label: 'الحالة', type: 'select', options: ['في الخدمة', 'متوقفة', 'مباعة'] },
      ],
    ],
    [
      'المستندات والتواريخ',
      [
        { key: 'regEnd', label: 'انتهاء رخصة السير (الاستمارة)', type: 'date' },
        { key: 'testEnd', label: 'انتهاء الفحص الدوري', type: 'date' },
        { key: 'insEnd', label: 'انتهاء التأمين', type: 'date' },
        { key: 'opEnd', label: 'انتهاء كرت التشغيل', type: 'date' },
      ],
    ],
    [
      'العهدة والمتابعة',
      [
        { key: 'driver', label: whoOf(v).driver },
        { key: 'driverIqama', label: whoOf(v).driverIqama },
        { key: 'followCard', label: 'كارت المتابعة' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ],
    ],
    /* بيانات الحفارة: تظهر في النافذة للفئة «حفارة» فقط (rig)، وتعرضها صفحة قسم الحفر */
    [
      'بيانات الحفارة',
      [
        { key: 'code', label: 'كود الحفارة', hint: 'إن تُرك فارغاً فهو رقم اللوحة' },
        { key: 'mfg', label: 'نوع التصنيع', type: 'select', options: RIG_MFG },
        { key: 'tuvStart', label: 'إصدار شهادة TUV', type: 'date' },
        { key: 'tuvEnd', label: 'انتهاء شهادة TUV', type: 'date' },
        { key: 'operator', label: 'مشغّل الحفارة (الحفار)' },
        { key: 'opTuvNo', label: 'رقم شهادة TUV للحفار', hint: 'شهادة المشغّل نفسه، غير شهادة الحفارة' },
        { key: 'opTuvEnd', label: 'انتهاء شهادة TUV للحفار', type: 'date' },
        { key: 'helper', label: 'العامل', hint: 'أكثر من عامل: افصل بينهم بفاصلة' },
      ],
      'rig',
    ],
  ];
  const docBadge = (d) =>
    d.days === null
      ? '<span class="muted">—</span>'
      : d.days < 0
        ? `<span class="chip rejected">منتهٍ منذ ${-d.days} يوم</span>`
        : d.days <= 30
          ? `<span class="chip pending">باقٍ ${d.days} يوم</span>`
          : '<span class="chip approved">ساري</span>';
  const worstDoc = (v) => v.docs.filter((d) => d.days !== null).sort((a, b) => a.days - b.days)[0] || null;
  const MAINT_STATE = { approved: '✔ منفّذ', rejected: '✖ مرفوض', returned: 'معاد للتعديل' };
  const maintState = (m) => (m.status === 'pending' ? `بانتظار ${m.stepLabel}` : MAINT_STATE[m.status] || m.status);

  /* تسجيل عدة مركبات مرة واحدة: جدول صف لكل مركبة، يُلصق فيه من Excel مباشرة (نسخ ← Ctrl+V) أو يُرفع ملف CSV */
  const BULK_COLS = () => {
    /* التسجيل الجماعي للسيارات: بلا قسم بيانات الحفارة */
    const all = FLEET_FIELDS()
      .filter(([, , only]) => !only)
      .flatMap(([, fs]) => fs)
      .filter((f) => f.type !== 'textarea' && f.key !== 'status');
    return all.map((f) => ({ ...f, label: f.label.replace(/ \(الاستمارة\)/, '') }));
  };
  /* صف المثال في قالب Excel للتسجيل الجماعي (بأعمدة BULK_COLS) */
  const BULK_SAMPLE = () => {
    const ex = {
      plate: 'أ ب ح 1234',
      plateEn: 'A B J 1234',
      owner: 'شركة',
      vType: 'غمارة',
      brand: 'تويوتا',
      model: 'هايلكس',
      year: '2022',
      color: 'أبيض',
      fuel: 'ديزل',
      branch: (state.config.branches || [])[0] || '',
      regEnd: '2027-05-01',
    };
    return BULK_COLS().map((f) => ex[f.key] || '');
  };

  /* نافذة تسجيل المركبة: تسمية خانتي صاحب العهدة تتبع الملكية المختارة */
  function relabelWho(sel) {
    const who = WHO[sel.value === 'خاصة' ? 'خاصة' : 'شركة'];
    for (const k of ['driver', 'driverIqama']) {
      const inp = sel.form && sel.form.querySelector(`[data-key="${k}"]`);
      const lb = inp && inp.closest('.field').querySelector('label');
      if (lb) lb.textContent = who[k];
    }
  }
  document.addEventListener('change', (e) => {
    if (e.target.matches && e.target.matches('#vf [data-key="owner"]')) relabelWho(e.target);
    /* قسم بيانات الحفارة يظهر للفئة «حفارة» فقط */
    const rig = e.target.matches && e.target.matches('#vf [data-key="vType"]') && e.target.form.querySelector('[data-rig]');
    if (rig) rig.hidden = e.target.value !== 'حفارة';
  });
  /* اللوحة الإنجليزية تُقترح من العربية ما لم يكتبها المستخدم بنفسه (public/js/plates.js) */
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.matches || !t.form) return;
    const en = t.form.querySelector('[data-key="plateEn"]');
    if (t.matches('#vf [data-key="plateEn"]')) en.dataset.typed = t.value ? '1' : '';
    else if (t.matches('#vf [data-key="plate"]') && en && !en.dataset.typed && window.SADEN_PLATES)
      en.value = /\d/.test(t.value) ? window.SADEN_PLATES.plateLatin(t.value) : '';
  });

  window.SES_FLEET = window.SES_FLEET || {};
  /* عناصر قائمة «إدارة الحركة» في الشريط الجانبي: [الرابط، الأيقونة، العنوان] لمن يرى صفحتها */
  const NAV = [
    ['fleet', '#/fleet', 'truck', 'أسطول السيارات'],
    ['violations', '#/violations', 'alert', 'المخالفات المرورية'],
    ['fleet', '#/fleet?tab=hand', 'filePen', 'محاضر التسليم والتسلم'],
    ['fleet', '#/fleet?tab=templates', 'printer', 'مركز نماذج الحركة'],
  ];
  /* ---------- مركز نماذج إدارة الحركة (#/fleet?tab=templates): نفس نماذج نوافذ الرفع ---------- */
  const fileOf = (kind) => window.SES_TEMPLATES.fileOf(kind);
  const VIOL_SAMPLE = ['أ ب ح 1234', '1234567890', '2026-10-20', '14:30', 'تجاوز السرعة', 300, 'جدة'];
  /* شرح النموذجين في ورقة «شرح النموذج» — مطابق لما يقبله الخادم (cleanVehicle وcleanViolation) */
  const VEH_GUIDE = {
    about: 'تسجيل مركبات الأسطول دفعة واحدة: صف لكل مركبة. بيانات الحفارة (شهادة TUV والمشغّل) تُكمَّل بعد التسجيل من تعديل المركبة.',
    help: {
      plate: 'حروف عربية وأرقام كما في الاستمارة، مثال: أ ب ح 1234',
      plateEn: 'نفس اللوحة بالحروف الإنجليزية، مثال: A B J 1234 — يجب أن تقابل العربية حرفاً بحرف وبنفس الأرقام.',
      owner: '«شركة» لسيارات الشركة، و«خاصة» لسيارة موظف. الخانة الفارغة = شركة.',
      brand: 'مثال: تويوتا',
      model: 'مثال: هايلكس',
      year: 'سنة الصنع بأربعة أرقام، مثال: 2022',
      record: 'رقم الاستمارة (السجل) كما في رخصة السير.',
      chassis: 'رقم الهيكل كما في الاستمارة.',
      branch: 'اسم الفرع كما هو مكتوب في النظام تماماً (القائمة في آخر هذه الورقة).',
      regEnd: 'تاريخ انتهاء رخصة السير (الاستمارة) — ينبّه النظام قبل انتهائها بـ30 يوماً.',
      testEnd: 'تاريخ انتهاء الفحص الدوري.',
      insEnd: 'تاريخ انتهاء التأمين.',
      opEnd: 'تاريخ انتهاء كرت التشغيل إن وُجد.',
      driver: 'اسم السائق أو المستخدم الفعلي (أو المالك في السيارة الخاصة) — تُنسب إليه المخالفات.',
      driverIqama: 'رقم هوية أو إقامة السائق (أو المالك).',
      followCard: 'رقم كارت المتابعة إن وُجد.',
    },
    steps: ['افتح «أسطول السيارات» ثم «تسجيل عدة مركبات».', 'اضغط «رفع ملف Excel» واختر هذا الملف.'],
    notes: [
      'الحفظ كله أو لا شيء: أي خطأ في صف يوقف الحفظ ويذكر رقم الصف، فصحّحه واحفظ من جديد.',
      'المركبة المسجلة من قبل برقم اللوحة نفسه تُرفض (حتى مع اختلاف المسافات).',
      'الحد الأقصى 500 مركبة في الملف الواحد.',
      'التواريخ بالميلادي. كل مركبة تُسجَّل بحالة «في الخدمة».',
    ],
  };
  const VIOL_GUIDE = {
    about: 'المخالفات المرورية على مركبات الأسطول: صف لكل مخالفة. يحيلها النظام لفرع المركبة ويحدد السائق المتسبب تلقائياً.',
    help: {
      plate: 'رقم لوحة المركبة بالعربي أو بالإنجليزي (مثال: أ ب ح 1234 أو A B J 1234) — يجب أن تكون مسجلة في أسطول السيارات.',
      number: 'رقم المخالفة كما في نظام المرور — المخالفة المسجلة من قبل بالرقم نفسه تُرفض.',
      date: 'تاريخ وقوع المخالفة بالميلادي — يحدد به النظام السائق المستلم للمركبة وقتها.',
      time: 'وقت المخالفة، مثال: 14:30',
      type: 'وصف المخالفة، مثال: تجاوز السرعة',
      amount: 'مبلغ المخالفة بالريال: رقم أكبر من صفر، بلا كلمة «ريال».',
      location: 'مكان المخالفة أو المدينة.',
    },
    steps: [
      'سجّل المركبات في «أسطول السيارات» أولاً.',
      'افتح «المخالفات المرورية» ثم «رفع مخالفات (Excel)».',
      'اضغط «رفع ملف Excel» واختر هذا الملف.',
    ],
    notes: [
      'الحفظ كله أو لا شيء: أي خطأ في صف يوقف الحفظ ويذكر رقم الصف.',
      'السائق المتسبب: المستلم في آخر محضر تسليم قبل تاريخ المخالفة، وإلا السائق المسجل على المركبة.',
      'الحد الأقصى 2000 مخالفة في الملف الواحد.',
    ],
  };
  /* قائمة فروع النظام آخر ورقة الشرح: الفرع يُكتب بنفس الاسم تماماً */
  const withBranches = (g) => ({ ...g, notes: [...g.notes, `فروع النظام: ${(state.config.branches || []).join('، ')}`] });
  const vehiclesTemplate = () => ({
    title: 'تسجيل المركبات',
    file: fileOf('تسجيل المركبات'),
    sheet: 'المركبات',
    defs: BULK_COLS(),
    sample: BULK_SAMPLE(),
    page: ['#/fleet', 'أسطول السيارات'],
    how: 'أسطول السيارات ← «تسجيل عدة مركبات» ← «رفع ملف Excel». اللوحة بالعربي والإنجليزي، والفرع بنفس أسماء فروع النظام.',
    guide: withBranches(VEH_GUIDE),
  });
  const trafficTemplates = (S) => [
    { ...vehiclesTemplate(), show: S.can('fleet') },
    {
      title: 'المخالفات المرورية',
      file: fileOf('المخالفات المرورية'),
      defs: S.VIOL_COLS,
      sample: VIOL_SAMPLE,
      page: ['#/violations', 'المخالفات المرورية'],
      how: 'المخالفات المرورية ← «رفع مخالفات (Excel)». رقم اللوحة يجب أن يكون مسجلاً في الأسطول.',
      guide: VIOL_GUIDE,
      show: S.can('violations'),
    },
    {
      title: 'بيان تحميل الوقود الشهري',
      desc: 'نموذج كل شهر يتعبأ تلقائياً بمركبات الأسطول وفروعها، فيُحمَّل من صفحة المحروقات.',
      page: ['#/fuel', 'المحروقات'],
      how: 'المحروقات ← «⬇ قالب Excel» ثم «⬆ رفع بيان الشهر».',
      show: S.can('fuel'),
    },
  ];
  window.SES_TEMPLATES = window.SES_TEMPLATES || {};
  window.SES_TEMPLATES.depts = window.SES_TEMPLATES.depts || {};
  window.SES_TEMPLATES.depts.traffic = (S) => {
    state = S.state;
    return { title: 'مركز نماذج إدارة الحركة', items: trafficTemplates(S) };
  };
  window.SES_FLEET.VIOL_SAMPLE = VIOL_SAMPLE;
  window.SES_FLEET.VIOL_GUIDE = VIOL_GUIDE;
  window.SES_FLEET.vehiclesTemplate = vehiclesTemplate;
  window.SES_FLEET.vehiclesFile = () => fileOf('تسجيل المركبات');
  window.SES_FLEET.violationsFile = () => fileOf('المخالفات المرورية');
  window.SES_FLEET.navItems = (S) => NAV.filter(([page]) => S.can(page)).map(([, href, ic, title]) => [href, S.icon(ic), title]);
  window.SES_FLEET.kit = function (S) {
    state = S.state;
    return { VEH_KINDS, OWNERS, ownerOf, whoOf, FLEET_FIELDS, docBadge, worstDoc, maintState, BULK_COLS, BULK_SAMPLE };
  };
})();
