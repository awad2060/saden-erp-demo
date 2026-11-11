/* تعريف نماذج الخطابات المستخدمة في SADEN ERP SYSTEM
 * الملف مشترك بين الخادم (للتحقق من البيانات) والواجهة (لعرض الخطاب). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SADEN_FORMS = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /* أسماء forms.js التي تحتاجها أجزاؤه (forms-*.js): كل اسم يُقرأ وقت الاستخدام (فلا يتغير ترتيب التنفيذ) */
  const H = new Proxy(
    {
      ADV_SIGNED: () => ADV_SIGNED,
      AR_MONTHS: () => AR_MONTHS,
      B: () => B,
      BASE_COUNTRY: () => BASE_COUNTRY,
      BP_ALLOW: () => BP_ALLOW,
      BP_DED: () => BP_DED,
      BP_DED_COST: () => BP_DED_COST,
      BP_GOSI: () => BP_GOSI,
      BP_KAFALA: () => BP_KAFALA,
      BP_KAF_OLD: () => BP_KAF_OLD,
      BP_OUT: () => BP_OUT,
      BP_PRORATE: () => BP_PRORATE,
      BP_STATUS: () => BP_STATUS,
      BRANCH_GEO: () => BRANCH_GEO,
      CAR_FIELDS: () => CAR_FIELDS,
      CASE_ASSETS: () => CASE_ASSETS,
      CASE_DED: () => CASE_DED,
      CLEAR_PAPER: () => CLEAR_PAPER,
      CLOSE_DOCS: () => CLOSE_DOCS,
      COUNTRY_INFO: () => COUNTRY_INFO,
      DASH_KEYS: () => DASH_KEYS,
      DED_FIELDS: () => DED_FIELDS,
      DEFAULT_ROUTE: () => DEFAULT_ROUTE,
      EMP_CERTS: () => EMP_CERTS,
      EMP_PAGES: () => EMP_PAGES,
      END_ALIAS: () => END_ALIAS,
      END_TYPES: () => END_TYPES,
      EOS_QIWA: () => EOS_QIWA,
      EXT_WORKSHOP: () => EXT_WORKSHOP,
      F: () => F,
      FORMS: () => FORMS,
      FORM_PARTS: () => FORM_PARTS,
      GROUPS: () => GROUPS,
      HIRE_BODIES: () => HIRE_BODIES,
      HIRE_CRITERIA: () => HIRE_CRITERIA,
      HIRE_MODIFY: () => HIRE_MODIFY,
      HIRE_PAY: () => HIRE_PAY,
      HIRE_RATING: () => HIRE_RATING,
      HIRE_TICKETS: () => HIRE_TICKETS,
      HR_COUNTRY_DEFAULTS: () => HR_COUNTRY_DEFAULTS,
      HR_POLICIES: () => HR_POLICIES,
      HR_POLICY_DEFAULT: () => HR_POLICY_DEFAULT,
      HSE_ACTION: () => HSE_ACTION,
      HSE_BRANCH: () => HSE_BRANCH,
      HSE_SITE: () => HSE_SITE,
      HUNDREDS: () => HUNDREDS,
      LETTERHEAD: () => LETTERHEAD,
      MAINT_TYPES: () => MAINT_TYPES,
      NAT_FLAGS: () => NAT_FLAGS,
      NOTE_FIELD: () => NOTE_FIELD,
      ONES: () => ONES,
      OPS_GROUPS: () => OPS_GROUPS,
      OPS_HIDDEN: () => OPS_HIDDEN,
      ORDER: () => ORDER,
      ORIGINAL: () => ORIGINAL,
      PAGES: () => PAGES,
      PAGE_DEFAULTS: () => PAGE_DEFAULTS,
      PAY_TASK: () => PAY_TASK,
      SALARY_ITEMS: () => SALARY_ITEMS,
      SELF_FORMS: () => SELF_FORMS,
      SETTLE_EMBED: () => SETTLE_EMBED,
      TASKS: () => TASKS,
      TEMPLATES: () => TEMPLATES,
      TENS: () => TENS,
      TR_PAY: () => TR_PAY,
      VEH_IMG: () => VEH_IMG,
      VEH_PAPER: () => VEH_PAPER,
      VEH_TYPES: () => VEH_TYPES,
      WORK_SCHEDULES: () => WORK_SCHEDULES,
      addDays: () => addDays,
      basicPairs: () => basicPairs,
      branchSig: () => branchSig,
      buildA: () => buildA,
      buildBlocks: () => buildBlocks,
      buildCustom: () => buildCustom,
      buildD: () => buildD,
      byId: () => byId,
      caseSummary: () => caseSummary,
      dayName: () => dayName,
      daysBetween: () => daysBetween,
      decisionBox: () => decisionBox,
      dedBody: () => dedBody,
      durationText: () => durationText,
      empSigLine: () => empSigLine,
      esc: () => esc,
      fieldText: () => fieldText,
      fmtDate: () => fmtDate,
      fmtNum: () => fmtNum,
      hijri: () => hijri,
      hireBody: () => hireBody,
      infoTable: () => infoTable,
      legalApply: () => legalApply,
      letterOpts: () => letterOpts,
      pageDefault: () => pageDefault,
      pageDefaultValue: () => pageDefaultValue,
      pageDefaultValue2: () => pageDefaultValue2,
      pageDefaultValue3: () => pageDefaultValue3,
      pageDefaultValue4: () => pageDefaultValue4,
      pageDefaultValue5: () => pageDefaultValue5,
      pageDefaultValue6: () => pageDefaultValue6,
      pageDefaultValue7: () => pageDefaultValue7,
      pageDefaultValue8: () => pageDefaultValue8,
      pageDefaultValue9: () => pageDefaultValue9,
      partValue: () => partValue,
      payPart: () => payPart,
      quoteTotals: () => quoteTotals,
      roleOf: () => roleOf,
      salaryFields: () => salaryFields,
      salaryTable: () => salaryTable,
      salaryTotal: () => salaryTotal,
      sheetTotal: () => sheetTotal,
      shownBy: () => shownBy,
      sumRows: () => sumRows,
      tafqeet: () => tafqeet,
      trPayBranch: () => trPayBranch,
      transferEmps: () => transferEmps,
      val: () => val,
      valueAllowance: () => valueAllowance,
      vehDiagram: () => vehDiagram,
      withNote: () => withNote,
    },
    { get: (names, k) => names[k]() },
  );
  const {
    dayName,
    sheetTotal,
    esc,
    fmtDate,
    fmtNum,
    hijri,
    trFromPays,
    trPayBranch,
    transferEmps,
    val,
    below1000,
    scaleWord,
    words,
    tafqeet,
    infoTable,
    decisionBox,
    endTypeOf,
    basicPairs,
    empSigLine,
    valueAllowance,
    salaryFields,
    salaryTotal,
    salaryTable,
    mfgTotals,
    sumRows,
    quoteTotals,
    daysBetween,
    durationText,
    legalApply,
    dedBody,
    hireBenefits,
    hireTotal,
    hireFinalPay,
    iqamaLeft,
    hireBody,
    hireBodyValue,
    buildDc,
    renderJobOffer,
    jobOfferPart,
    sumOf,
    payPart,
    taskRows,
    carSpec,
    requiredAttachmentsOf,
    caseTables,
    caseSummary,
    closeDoc,
    renderCarRecord,
    vehDiagram,
    caseCarRecord,
    renderCaseAppendix,
    partValue,
    buildA,
    rank,
    withNote,
    summaryOf,
    amountOf,
    renderLetter,
    letterValue,
    buildForm,
  } = (typeof module === 'object' && module.exports ? require('./forms-fn-1.js') : self.SADEN_FORMS_PARTS['forms-fn-1'])(H);
  const {
    buildD,
    buildDecisions,
    buildAp,
    renderLicenseAck,
    clearanceAmount,
    renderClearance,
    clearancePart,
    empShown,
    certFiles,
    certRequired,
    empMissingCerts,
    empCitizen,
    saudiCounted,
    flagOf,
    empSpan,
    addDays,
    branchGeo,
    countryOf,
    empNational,
    scheduleOf,
    punchModeOf,
    scheduleHours,
    hrPolicyOf,
    eosOf,
    gosiOf,
    empLeave,
    empLeavePart2,
    empLeavePart,
    pageDefault,
    pageDefaultValue9,
    pageDefaultValue8,
    pageDefaultValue7,
    pageDefaultValue6,
    pageDefaultValue5,
    pageDefaultValue4,
    pageDefaultValue3,
    pageDefaultValue2,
    pageDefaultValue,
    fieldText,
    letterOpts,
    shownBy,
    buildCustom,
  } = (typeof module === 'object' && module.exports ? require('./forms-fn-2.js') : self.SADEN_FORMS_PARTS['forms-fn-2'])(H);
  const {
    buildBlocks,
    buildFieldDef,
    B,
    editableFully,
    builtinDef,
    applyOverride,
    setCustomForms,
    dashSectionsOf,
    dashBranchOf,
    cap,
    baseSee,
    isOpsForm,
    canSee,
    formAllowed,
    formAllowedPart2,
    formAllowedPart,
    settingsTabs,
    ymd,
    workDaysSince,
    bpKaf,
    bpN,
    bpR,
    bpNat,
    bpNatOf,
    bpSaudi,
    bpStartDays,
    bpCalc,
    buildAllow,
    bpOver50,
    bpSummary,
    sheetLetterData,
  } = (typeof module === 'object' && module.exports ? require('./forms-fn-3.js') : self.SADEN_FORMS_PARTS['forms-fn-3'])(H);

  /* المسار الافتراضي يستخدم فقط إذا لم يصل مسار من الخادم */
  const DEFAULT_ROUTE = [
    { prefix: 'الأستاذ', name: 'مصطفى عبده', title: 'مدير قسم الرواتب وحماية الأجور', label: 'مدير إدارة الرواتب' },
    { prefix: 'الأستاذ', name: 'محمود جمال', title: 'المدير المالي', label: 'المدير المالي' },
    { prefix: 'المهندس', name: 'إسلام عزت', title: 'نائب المدير التنفيذي لمجموعة سادن', label: 'المدير التنفيذي' },
  ];

  const { GROUPS, ONES, END_TYPES, END_ALIAS, GOV } = (
    typeof module === 'object' && module.exports ? require('./forms-data-1.js') : self.SADEN_FORMS_PARTS['forms-data-1']
  )(H);
  /* بيانات الجُمع والإعاشات: الشهور، واسم اليوم من التاريخ، وإجمالي البيان */
  const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  /* محضر تسليم وتسلم المركبات: رسمة لكل فئة (من نماذج الورد) لتحديد التلفيات عليها */
  const VEH_TYPES = ['ملاكي', 'غمارة', 'غمارتين', 'دينة', 'معدة', 'حفارة'];
  const VEH_IMG = {
    ملاكي: 'vehicles/sedan.png',
    غمارة: 'vehicles/single.jpg',
    غمارتين: 'vehicles/double.jpg',
    دينة: 'vehicles/dyna.jpg',
  };

  /* من يتحمل راتب شهر النقل: الاختيار في القرار، وإلا فيوم المباشرة (≤ 15 المنقول إليه، > 15 المنقول منه) */
  const TR_PAY = ['الفرع المنقول منه', 'الفرع المنقول إليه'];

  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  GOV.score = (x) => (Number(x.likelihood) || 0) * (Number(x.impact) || 0);

  /* ---------- السلامة والصحة المهنية (HSE): بلاغات الحوادث، ملاحظات السلامة، تصاريح العمل، فحوصات السلامة ----------
   * inv = حقول التحقيق والإجراء التصحيحي يملؤها مسؤول السلامة، وstatus لمسؤول السلامة فقط */
  const HSE_SITE = { key: 'site', label: 'الموقع / المشروع', hint: 'مثال: موقع الحفر بجدة، المستودع، الطريق...' };
  const HSE_BRANCH = { key: 'branch', label: 'الفرع', type: 'branch', required: true };
  const HSE_ACTION = [
    { key: 'action', label: 'الإجراء التصحيحي / الوقائي', type: 'textarea', inv: true },
    { key: 'responsible', label: 'المسؤول عن الإجراء', inv: true },
    { key: 'due', label: 'موعد إنجاز الإجراء', type: 'date', inv: true },
  ];

  const { HSE, F, SALARY_ITEMS, SETTLE_EMBED, CAR_FIELDS, DED_FIELDS, HIRE_PAY, MAINT_TYPES, PAY_TASK } = (
    typeof module === 'object' && module.exports ? require('./forms-data-2.js') : self.SADEN_FORMS_PARTS['forms-data-2']
  )(H);
  /* حالة الفحص من الإجابات: أي «غير مطابق» = يحتاج إجراء */
  HSE.inspResult = (answers) => (Object.values(answers || {}).includes('غير مطابق') ? 'يحتاج إجراء' : 'مكتمل');

  const branchSig = '<div class="l-mgr-sig">توقيع مدير الفرع : ..............................</div>';

  const CASE_DED = ['سلف', 'عهدة نقدية', 'مصروفات إدارية', 'مخالفات مرورية', 'خصومات أخرى'];
  const CASE_ASSETS = ['سيارة', 'جوال', 'شريحة إتصال', 'لاب توب', 'أخرى'];

  /* نموذج التوظيف (استمارة بيانات مرشح للتوظيف): معايير تقييم اللجنة الفنية وبنود العرض المالي */
  const HIRE_RATING = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف'];
  const HIRE_CRITERIA = [
    ['knowledge', 'المعرفة الفنية بالتخصص'],
    ['practical', 'الخبرة العملية'],
    ['communication', 'مهارات التواصل'],
    ['appearance', 'المظهر والانضباط'],
  ];

  const HIRE_MODIFY = 'الموافقة على التعيين مع تعديل الراتب';
  const HIRE_TICKETS = [
    'لا يوجد',
    'تذكرة طيران في درجة اقتصادية ذهاب وإياب (في حالة السفر فقط)',
    'تذكرة طيران سنوية في درجة اقتصادية ذهاب وإياب',
  ];

  /* الهيئات المهنية التي تشترطها بعض الوظائف (مهندسين، محاسبين، قانونيين...) */
  const HIRE_BODIES = [
    'الهيئة السعودية للمهندسين',
    'الهيئة السعودية للمراجعين والمحاسبين',
    'هيئة المحامين السعودية',
    'الهيئة السعودية للتخصصات الصحية',
    'أخرى',
  ];

  const EXT_WORKSHOP = 'ورشة خارجية';

  const { TASKS } = (typeof module === 'object' && module.exports ? require('./forms-data-3.js') : self.SADEN_FORMS_PARTS['forms-data-3'])(
    H,
  );

  /* المرفقات الإلزامية للطلب: الثابتة + المشروطة باختيار في بياناته */
  /* السلف: اختيار «توقيع» (ورقي) يُلزم برفع طلب السلفة موقّعاً من الموظف */
  const ADV_SIGNED = 'طلب السلفة موقّعاً من الموظف';

  /* ملاحق ملف التصفية للطباعة: بيان الخصومات والعهد، وبيانات شئون الموظفين، ونموذج تسليم السيارة */
  /* المحضر الورقي: يطبعه المحاسب ويوقعه المسلِّم والمستلم ثم يرفعه مرفقاً لإدارة الحركة */
  const CAR_PAPER = 'محضر تسليم وتسلم السيارة الموقّع';
  /* محضر تسليم وتسلم المركبة: صورته بعد توقيع المسلِّم والمستلم (شرط لإرساله لإدارة الحركة) */
  const VEH_PAPER = 'المحضر الموقّع من المسلِّم والمستلم';
  const CLEAR_PAPER = 'المخالصة الموقّعة والمبصومة من الموظف';

  const { CLOSE_DOCS } = (
    typeof module === 'object' && module.exports ? require('./forms-data-4.js') : self.SADEN_FORMS_PARTS['forms-data-4']
  )(H);
  /* السلفة طويلة الأجل: لا تُقفل إلا برفع نموذج السلفة الموقّع من الموظف */
  CLOSE_DOCS.advForm = {
    paper: 'نموذج السلفة الموقّع من الموظف',
    doc: 'نموذج السلفة',
    waiting: 'معتمد — بانتظار نموذج السلفة الموقّع من الموظف',
    closed: 'مغلق — نموذج السلفة الموقّع مستلم',
    notify: 'اعتُمدت السلفة طويلة الأجل: اطبع نموذج السلفة ووقّعه من الموظف وارفعه',
    closeNote: 'رُفع نموذج السلفة الموقّع من الموظف وأُغلق الطلب',
    box: 'اعتُمدت السلفة نهائياً. ١) اطبع نموذج السلفة (زر الطباعة) &nbsp; ٢) يوقّع الموظف عليه &nbsp; ٣) ارفع صورته أو PDF هنا، فيُغلق الطلب.',
    title: 'نموذج السلفة الموقّع من الموظف',
    pick: 'اختر صورة نموذج السلفة الموقّع من الموظف',
  };
  /* خطاب مصروفات رخصة القيادة: لا يُقفل إلا برفع الإقرار الموقّع من الموظف */
  CLOSE_DOCS.licenseAck = {
    paper: 'إقرار مصروفات رخصة القيادة الموقّع من الموظف',
    doc: 'إقرار مصروفات رخصة القيادة',
    waiting: 'معتمد — بانتظار الإقرار الموقّع من الموظف',
    closed: 'مغلق — الإقرار الموقّع مستلم',
    notify: 'اعتُمد خطاب مصروفات رخصة القيادة: اطبع الإقرار ووقّعه من الموظف وارفعه',
    closeNote: 'رُفع إقرار مصروفات رخصة القيادة الموقّع من الموظف وأُغلق الطلب',
    box: 'اعتُمد الطلب نهائياً. ١) اطبع الإقرار &nbsp; ٢) يوقّع الموظف ويبصم عليه &nbsp; ٣) ارفع صورته أو PDF هنا، فيُغلق الطلب.',
    title: 'إقرار مصروفات رخصة القيادة الموقّع من الموظف',
    pick: 'اختر صورة الإقرار الموقّع من الموظف',
  };

  /* مكافأة نهاية الخدمة تُحسب على حاسبة قوى، ونتيجتها تُرفق بالتصفية بهذا الاسم */
  const EOS_QIWA = 'https://knowledge-center.qiwa.sa/ar/tools-and-calculators/end-of-service-reward-calculator';
  const EOS_ATT = 'حساب مكافأة نهاية الخدمة (قوى)';

  /* الكفالات (المنشآت المسجل عليها الموظفون في مدد) — تُستخدم في سجل الموظف وبيان رواتب الفرع */
  const BP_OUT = 'كفالة خارجية';

  const { BP_KAFALA } = (
    typeof module === 'object' && module.exports ? require('./forms-data-5.js') : self.SADEN_FORMS_PARTS['forms-data-5']
  )(H);
  /* نماذج في ملفات مستقلة (forms-*.js): الخادم يستوردها، والواجهة تحمّلها قبل هذا الملف */
  const FORM_PARTS = typeof module === 'object' && module.exports ? [require('./forms-traffic.js')] : self.SADEN_FORM_PARTS || [];
  const FORMS = [
    ...(typeof module === 'object' && module.exports ? require('./forms-data-6.js') : self.SADEN_FORMS_PARTS['forms-data-6'])(H),
    ...(typeof module === 'object' && module.exports ? require('./forms-data-7.js') : self.SADEN_FORMS_PARTS['forms-data-7'])(H),
    ...(typeof module === 'object' && module.exports ? require('./forms-data-8.js') : self.SADEN_FORMS_PARTS['forms-data-8'])(H),
    ...(typeof module === 'object' && module.exports ? require('./forms-data-9.js') : self.SADEN_FORMS_PARTS['forms-data-9'])(H),
  ];

  /* ترتيب البدلات: سكن - انتقال - اتصال - إقامة - موقع (باقي النماذج بترتيبها) */
  const ORDER = ['housingFixed', 'housingVisit', 'transport', 'contact', 'contactBulk', 'residence', 'site'];

  FORMS.sort((a, b) => rank(a) - rank(b));

  /* اسم النموذج في النظام بدون "خطاب تعميد / خطاب إعتماد / نموذج"، ويبقى العنوان الكامل في الخطاب المطبوع */
  FORMS.forEach((f) => {
    const short = f.title.replace(/^(خطاب\s+(تعميد|إعتماد)|نموذج)\s+/, '');
    if (short !== f.title) {
      if (!f.letterTitle) f.letterTitle = f.title;
      f.title = short;
    }
  });
  /* خانة "ملاحظات" اختيارية في آخر كل خطاب (عدا شاشات برنامج التصفية)، وتظهر في الخطاب المطبوع إذا كُتبت */
  const NOTE_FIELD = { key: 'letterNote', label: 'ملاحظات', type: 'textarea', hint: 'اختياري — تظهر في الخطاب المطبوع' };

  FORMS.forEach((f, i) => {
    FORMS[i] = withNote(f);
  });
  const byId = {};
  FORMS.forEach((f) => {
    byId[f.id] = f;
  });

  /* ---------- عرض الخطاب كاملاً ---------- */
  /* ترويسة الشركة أعلى الخطابات (تُعطَّل من الإعدادات عند الطباعة على ورق مطبوع الترويسة) */
  let LETTERHEAD = true;
  const setLetterhead = (on) => {
    LETTERHEAD = on !== false;
  };

  const { EMP_SECTIONS, EMP_CERTS, EMP_LISTS, NAT_FLAGS, HR_POLICY_DEFAULT, HR_COUNTRY_DEFAULTS, COUNTRY_INFO, PAGES, SELF_FORMS } = (
    typeof module === 'object' && module.exports ? require('./forms-data-10.js') : self.SADEN_FORMS_PARTS['forms-data-10']
  )(H);
  const EMP_FIELDS = EMP_SECTIONS.flatMap(([, , fs]) => fs);

  const EMP_SALARY = EMP_SECTIONS.find(([k]) => k === 'salary')[2].map((f) => f.key);
  const EMP_DED = ['gosiDed', 'otherDed'];

  /* المستندات التي يُنبَّه على قرب انتهائها */
  const EMP_DOCS = [
    ['iqamaEnd', 'الهوية / الإقامة'],
    ['passportEnd', 'جواز السفر'],
    ['contractEnd', 'العقد'],
    ['insuranceEnd', 'التأمين الطبي'],
    ['licenseEnd', 'رخصة القيادة'],
  ];

  /* ---------- تعدد الدول: لكل دولة سياستها الافتراضية حسب نظام العمل فيها (قابلة للتعديل بإصدارات مؤرخة لكل دولة) ----------
   * eosModel: sa = نظام العمل السعودي (نصف شهر عن كل سنة من الخمس الأولى ثم شهر، على الأجر الشامل)
   *           om = عُمان (أجر أساسي شهر عن كل سنة لغير العُمانيين — العُماني يغطيه صندوق الحماية الاجتماعية)
   *           none = لا مكافأة نظامية من المنشأة (مصر: يغطيها التأمين الاجتماعي) */
  HR_POLICY_DEFAULT.country = 'SA';
  HR_POLICY_DEFAULT.eosModel = 'sa';
  HR_POLICY_DEFAULT.note = 'نظام العمل السعودي ونظام التأمينات الاجتماعية';

  /* دولة الشركة (الافتراضية) ودولة كل فرع — تُملأ من قاعدة البيانات (الدول والفروع) */
  let BASE_COUNTRY = 'SA',
    BRANCH_GEO = {};
  const setGeo = (g) => {
    g = g || {};
    BASE_COUNTRY = COUNTRY_INFO[g.base] ? g.base : 'SA';
    BRANCH_GEO = {};
    for (const [n, c, tz, we] of g.branches || [])
      BRANCH_GEO[String(n || '').trim()] = { country: c, tz: tz || '', weekend: Array.isArray(we) ? we : null };
  };

  let HR_POLICIES = [];
  /* أنواع الدوام: لكل نوع أيام العمل (0 الأحد … 6 السبت) ووقت الشيفت ولمن يُطبَّق.
   * الأولوية: موظف محدد ← فرع ← الجنسية (سعودي / غير سعودي) ← الكل. وبدون نوع مطابق يبقى الدوام العام (السياسة وإجازة نهاية الأسبوع) */
  let WORK_SCHEDULES = [];
  const setWorkSchedules = (list) => {
    WORK_SCHEDULES = (Array.isArray(list) ? list : []).filter((x) => x && Array.isArray(x.days));
  };

  const setHrPolicies = (list) => {
    HR_POLICIES = (Array.isArray(list) ? list : [])
      .filter((p) => p && /^\d{4}-\d{2}-\d{2}$/.test(p.from || ''))
      .sort((a, b) => a.from.localeCompare(b.from));
  };

  /* صلاحية «موظف»: الخدمة الذاتية (طلباته ونماذج الخدمات والبريد والدردشة) */
  const EMP_PAGES = ['home', 'new', 'mine', 'mail', 'chat', 'notices', 'notifications', 'tasks', 'governance', 'knowledge', 'training'];

  const { PAGE_DEFAULTS, FIELD_TYPES, BLOCK_TYPES, TEMPLATES, CAPS, DASH_SECTIONS, BP_KAF_OLD, BP_ALLOW, BP_DED, PAY_ALLOW, BP_EMP_KEY } = (
    typeof module === 'object' && module.exports ? require('./forms-data-11.js') : self.SADEN_FORMS_PARTS['forms-data-11']
  )(H);

  const ORIGINAL = {};

  /* ---------- المسميات (الأدوار) ----------
   * كل مستخدم له مسمى يحدده مدير النظام: نوع حساب أساسي + الصفحات + الإجراءات المسموحة */
  const BASES = [
    ['accountant', 'يرفع طلبات (محاسب)'],
    ['approver', 'يعتمد طلبات'],
    ['admin', 'مدير نظام (كل الصلاحيات)'],
  ];
  /* أنواع الحساب في صفحة المسميات: ومعها «موظف» (الخدمة الذاتية) حتى لا يتحول مسماه عند الحفظ */
  const ROLE_BASES = [['employee', 'موظف (خدمة ذاتية)'], ...BASES];
  const DEFAULT_ROLES = [
    { id: 'r_employee', name: 'موظف', base: 'employee' },
    { id: 'r_accountant', name: 'محاسب فرع', base: 'accountant' },
    { id: 'r_approver', name: 'معتمد', base: 'approver' },
    { id: 'r_admin', name: 'مدير النظام', base: 'admin' },
  ];
  /* فئات المستخدمين الست الثابتة (الإعدادات ← المستخدمون): كل حساب في واحدة منها، وحسابات الموظفين الشخصية (r_employee) خارجها.
   * المحاسبين والإداريين ومدير النظام هي المسميات الأساسية القديمة بأسماء جديدة (تجميعها: server/modules/identity/application/categories.js) */
  const CATEGORIES = [
    ['r_accountant', 'المحاسبين', 'accountant'],
    ['r_approver', 'الإداريين', 'approver'],
    ['r_branch_mgrs', 'مديرين الفروع', 'approver'],
    ['r_dept_mgrs', 'مديرين الإدارات', 'approver'],
    ['r_top_mgmt', 'الإدارة العليا', 'approver'],
    ['r_admin', 'مدير النظام ومشرفي النظام', 'admin'],
  ].map(([id, name, base]) => ({ id, name, base }));
  /* نطاق الاطلاع على الطلبات (ثابت حسب الفئة): الإدارة العليا ومدير النظام كل الطلبات، والمحاسبون ومديرو الفروع طلبات فرعهم،
   * ومديرو الإدارات طلبات إدارتهم، والإداريون ما رفعوه أو مر عليهم فقط. «يرى جميع الطلبات» في صفحة المستخدم استثناء لشخص بعينه */
  const SCOPE_BY_CAT = { r_top_mgmt: 'all', r_admin: 'all', r_accountant: 'branch', r_branch_mgrs: 'branch', r_dept_mgrs: 'dept' };
  const scopeOf = (u) => {
    if (!u) return 'route';
    if (u.role === 'admin' || (u.role === 'approver' && u.viewAll)) return 'all';
    if (u.role === 'accountant' || u.branchManager) return 'branch';
    return SCOPE_BY_CAT[u.roleId] || 'route';
  };
  /* إدارة المستخدم: «الإدارة / القسم» في صفحته، وإلا فرعه */
  const unitOf = (u) => (u && (u.dept || u.branch)) || '';
  /* الطلب r في نطاق u (creator: حساب مقدّم الطلب): الإدارة بإدارة مقدّمه لا باسم فرع الطلب */
  const inScope = (u, r, creator) => {
    const s = scopeOf(u),
      d = unitOf(u);
    if (s === 'all') return true;
    if (s === 'branch') return !!u.branch && r.branch === u.branch;
    return s === 'dept' && !!d && unitOf(creator) === d;
  };
  /* علامة البند في صلاحيات الفئة: الصريح فيها، وإلا الافتراضي لنوع حسابها */
  const rolePermOn = (role, key) =>
    role.pages && typeof role.pages[key] === 'boolean' ? role.pages[key] : pageDefault({ role: role.base }, key);
  /* صفحة الأيقونة: nav:#/branch-map ← branchMap، وnav:#/ ← home؛ والأقسام وروابط الطلبات بلا صفحة ← '' */
  const navPageOf = (navKey) => {
    const m = /^nav:#\/([^/?]*)/.exec(navKey || '');
    if (!m) return '';
    const seg = m[1] ? m[1].replace(/-([a-z])/g, (x, c) => c.toUpperCase()) : 'home';
    return PAGES.some(([k]) => k === seg) ? seg : '';
  };
  /* علامات تتحكم كل منها في مفتاح أو أكثر (الأيقونة وصفحتها): ما تغيّر يُكتب لكل مفاتيحه */
  const boxRows = (boxes) => boxes.filter((b) => b.now !== b.was).flatMap((b) => b.keys.map((k) => [k, !b.now, b.now]));
  /* حفظ العلامات: rows = [[البند، علامته عند الفتح، علامته الآن]] — يُحفظ ما تغيّر فقط، وما لم يُلمس يبقى كما كان */
  const mergePerms = (old, rows) => {
    const out = { ...(old || {}) };
    for (const [k, was, now] of rows) if (now !== was) out[k] = now;
    return out;
  };

  const DASH_KEYS = DASH_SECTIONS.map(([k]) => k);

  let roleOf = () => null;
  const setRoleResolver = (fn) => {
    roleOf = fn;
  };

  const OPS_GROUPS = ['إدارة الحركة', 'الورشة', 'إدارة الجرد', 'قسم الحفر'];

  const OPS_HIDDEN = ['dashboard', 'home', 'register', 'tools', 'employees'];

  /* ---------- بيان رواتب الفرع ----------
   * الحالة: 1 على رأس العمل، 2 تصفية، 3 توزيع تصفية، 4 أجازة، 5 بدلات أثناء الأجازة، 6 بداية دوام، 7 مستحقات إضافية
   * لكل موظف ثلاثة أرقام: ① الصافي المستلم (ما يقبضه فعلاً) ② مصروف الرواتب (ما يُحمَّل على الشركة) ③ تأمينات الشركة
   * - المرفوع على مدد: صافي «على رأس العمل / بداية دوام» لموظفي كفالات المجموعة (لكل كفالة سجلها)
   * - خارج مدد: الكفالات الخارجية + التصفيات + بدلات الأجازة + المستحقات الإضافية
   * - مصروف الرواتب = الإجمالي + المستحقات + التصفية + بدلات الأجازة − (بصمة + غياب + جزاءات) — بدون تأمينات الشركة (تظهر منفصلة)
   *   (خصم السلفة والعهد والخصم القانوني وتأمينات الموظف لا تُنقص المصروف: تُحمَّل على الرواتب وتُخصم من الموظف) */
  const BP_STATUS = ['على رأس العمل', 'تصفية', 'توزيع تصفية', 'أجازة', 'بدلات أثناء الأجازة', 'بداية دوام', 'مستحقات إضافية'];

  const BP_GOSI = { sa: 0.215, other: 0.02 };

  const BP_DED_COST = ['fp', 'absence', 'penalty']; // خصومات تُنقص مصروف الرواتب
  const BP_PRORATE = ['basic', 'phone', 'site', 'otherAllow']; // بنود تُحسب في بداية الدوام حسب أيام الدوام

  /* مبالغ لمرة واحدة في بيان رواتب الشهر: النموذج ← عمود البيان (بدل سكن الزيارة والزيارة العائلية مؤقتان) */
  const PAY_ONCE = { housingVisit: 'due', familyVisit: 'due', deduction: 'penalty', legalDeduction: 'legal' };
  /* النماذج التي يحدد فيها مدير قسم الرواتب أثناء الاعتماد شهر النزول في الرواتب (خصم الشئون القانونية شهره من «طريقة تطبيق الخصم») */
  const PAY_ASK = [...Object.keys(PAY_ALLOW), 'housingVisit', 'familyVisit', 'deduction'];

  return {
    GOV,
    HSE,
    empShown,
    EMP_CERTS,
    certFiles,
    certRequired,
    empMissingCerts,
    saudiCounted,
    ADV_SIGNED,
    END_TYPES,
    END_ALIAS,
    endTypeOf,
    setWorkSchedules,
    scheduleOf,
    scheduleHours,
    punchModeOf,
    PAY_ALLOW,
    PAY_ONCE,
    PAY_ASK,
    BP_EMP_KEY,
    BP_PRORATE,
    bpNatOf,
    bpSaudi,
    bpKaf,
    bpStartDays,
    bpOver50,
    TR_PAY,
    trFromPays,
    trPayBranch,
    transferEmps,
    BP_STATUS,
    BP_KAFALA,
    BP_OUT,
    BP_GOSI,
    BP_ALLOW,
    BP_DED,
    BP_DED_COST,
    bpCalc,
    bpSummary,
    bpNat,
    renderLicenseAck,
    flagOf,
    SELF_FORMS,
    sheetLetterData,
    hireFinalPay,
    gosiOf,
    HR_POLICY_DEFAULT,
    HR_COUNTRY_DEFAULTS,
    COUNTRY_INFO,
    setGeo,
    branchGeo,
    countryOf,
    empNational,
    eosOf,
    setHrPolicies,
    hrPolicyOf,
    dashBranchOf,
    DASH_SECTIONS,
    DASH_KEYS,
    dashSectionsOf,
    EOS_QIWA,
    EOS_ATT,
    requiredAttachmentsOf,
    carSpec,
    isOpsForm,
    OPS_GROUPS,
    mfgTotals,
    quoteTotals,
    EMP_SECTIONS,
    EMP_FIELDS,
    EMP_SALARY,
    EMP_DED,
    EMP_LISTS,
    EMP_DOCS,
    empCitizen,
    empLeave,
    empSpan,
    BLOCK_TYPES,
    buildCustom,
    VEH_TYPES,
    sumOf,
    EXT_WORKSHOP,
    MAINT_TYPES,
    closeDoc,
    transferEmps,
    renderJobOffer,
    iqamaLeft,
    hireTotal,
    sheetTotal,
    caseCarRecord,
    VEH_PAPER,
    CLEAR_PAPER,
    setLetterhead,
    CAR_PAPER,
    renderCarRecord,
    daysBetween,
    durationText,
    TASKS,
    renderCaseAppendix,
    workDaysSince,
    BASES,
    ROLE_BASES,
    DEFAULT_ROLES,
    CATEGORIES,
    scopeOf,
    navPageOf,
    boxRows,
    inScope,
    rolePermOn,
    mergePerms,
    CAPS,
    cap,
    setRoleResolver,
    baseSee,
    formAllowed,
    FORMS,
    byId,
    GROUPS,
    DEFAULT_ROUTE,
    FIELD_TYPES,
    setCustomForms,
    builtinDef,
    applyOverride,
    editableFully,
    isBuiltin: (id) => !!ORIGINAL[id],
    PAGES,
    pageDefault,
    canSee,
    settingsTabs,
    renderLetter,
    renderClearance,
    summaryOf,
    amountOf,
    tafqeet,
    esc,
    fmtDate,
    fmtNum,
  };
});
