/* بيانات forms.js (forms-data-2): HSE، F، SALARY_ITEMS، SETTLE_EMBED، CAR_FIELDS، DED_FIELDS، HIRE_PAY، MAINT_TYPES، PAY_TASK
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-data-2'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  const HSE = {
    KINDS: { incidents: 'بلاغات الحوادث', observations: 'ملاحظات السلامة', permits: 'تصاريح العمل', inspections: 'فحوصات السلامة' },
    ONE: { incidents: 'بلاغ حادث', observations: 'ملاحظة سلامة', permits: 'تصريح عمل', inspections: 'فحص سلامة' },
    PREFIX: { incidents: 'INC', observations: 'OBS', permits: 'PTW', inspections: 'INS' },
    STATUS: {
      incidents: ['مفتوح', 'قيد التحقيق', 'مغلق'],
      observations: ['مفتوحة', 'مغلقة'],
      permits: ['ساري', 'مغلق', 'ملغي'],
      inspections: ['مكتمل', 'يحتاج إجراء', 'تمت المعالجة'],
    },
    CLOSED: ['مغلق', 'مغلقة', 'ملغي', 'تمت المعالجة'],
    /* قوائم تحقق الفحص: لكل بند «مطابق / غير مطابق / لا ينطبق» */
    CHECKS: {
      حفارة: [
        'شهادة الفحص (TUV) سارية',
        'أغطية الأجزاء الدوارة والسيور سليمة',
        'زر إيقاف الطوارئ يعمل',
        'الكابلات والحبال والخطافات سليمة',
        'لا يوجد تسرب زيت أو وقود',
        'طفاية حريق صالحة بجوار الحفارة',
        'منطقة العمل محددة ومعزولة',
        'العاملون يرتدون معدات الوقاية الشخصية',
        'صندوق إسعافات أولية متوفر',
        'سجل الصيانة اليومي محدث',
      ],
      مركبة: [
        'رخصة السير والتأمين ساريان',
        'الإطارات والإطار الاحتياطي سليمة',
        'الفرامل والأنوار والإشارات تعمل',
        'أحزمة الأمان سليمة',
        'طفاية حريق صالحة',
        'صندوق إسعافات أولية',
        'مثلث التحذير متوفر',
        'المرايا والزجاج سليمة',
        'لا يوجد تسرب سوائل',
        'نظافة المركبة وتثبيت الحمولة',
      ],
      'موقع عمل': [
        'لوحات التحذير والإرشاد موجودة',
        'منطقة العمل مسيّجة ومحددة',
        'الممرات ومخارج الطوارئ خالية',
        'الإنارة كافية',
        'التمديدات الكهربائية آمنة ومؤرضة',
        'المواد مخزنة ومرتبة بشكل آمن',
        'طفايات الحريق متوفرة وصالحة',
        'صندوق الإسعافات الأولية متوفر',
        'العاملون يرتدون معدات الوقاية',
        'دورات المياه ومياه الشرب متوفرة',
        'نقطة تجمع للطوارئ محددة',
      ],
      'طفايات ومعدات الحريق': [
        'الطفاية في مكانها ويسهل الوصول إليها',
        'مؤشر الضغط في المنطقة الخضراء',
        'مسمار الأمان والختم سليمان',
        'الخرطوم والفوهة سليمان',
        'بطاقة الفحص الدوري محدثة',
        'كاشفات الدخان تعمل',
        'لوحات الإخلاء واضحة',
      ],
      'معدات الرفع': [
        'شهادة فحص معدة الرفع سارية',
        'الحمولة ضمن الحد المسموح',
        'الأسلاك والسلاسل والخطافات سليمة',
        'قفل أمان الخطاف يعمل',
        'المشغل مؤهل ومعتمد',
        'منطقة الرفع معزولة',
        'وجود مُرشد إشارات',
      ],
      'معدات الوقاية الشخصية': [
        'خوذة السلامة',
        'حذاء السلامة',
        'النظارات الواقية',
        'القفازات المناسبة',
        'السترة العاكسة',
        'واقي السمع عند الحاجة',
        'الكمامة / جهاز التنفس عند الحاجة',
        'حزام الأمان للعمل على ارتفاع',
      ],
    },
    fields: {
      incidents: [
        { key: 'date', label: 'تاريخ الحادث', type: 'date', required: true },
        { key: 'time', label: 'الوقت', type: 'time' },
        H.HSE_BRANCH,
        H.HSE_SITE,
        {
          key: 'type',
          label: 'نوع البلاغ',
          type: 'select',
          required: true,
          options: ['إصابة عمل', 'حادث بدون إصابة', 'شبه حادث', 'ضرر في الممتلكات / المعدات', 'حادث مركبة', 'حريق', 'تسرب / حادث بيئي'],
        },
        { key: 'severity', label: 'درجة الخطورة', type: 'select', required: true, options: ['بسيط', 'متوسط', 'جسيم', 'وفاة'] },
        { key: 'injured', label: 'المصابون (إن وجد)', hint: 'الاسم والرقم الوظيفي، ويُفصل بين الأسماء بفاصلة' },
        { key: 'lostDays', label: 'أيام العمل المفقودة', type: 'number', inv: true },
        { key: 'description', label: 'وصف ما حدث', type: 'textarea', required: true },
        { key: 'immediate', label: 'الإجراء الفوري المتخذ', type: 'textarea' },
        { key: 'rootCause', label: 'السبب الجذري (نتيجة التحقيق)', type: 'textarea', inv: true },
        ...H.HSE_ACTION,
        { key: 'status', label: 'الحالة', type: 'select', options: ['مفتوح', 'قيد التحقيق', 'مغلق'], inv: true },
      ],
      observations: [
        { key: 'date', label: 'التاريخ', type: 'date', required: true },
        H.HSE_BRANCH,
        H.HSE_SITE,
        { key: 'kind', label: 'نوع الملاحظة', type: 'select', required: true, options: ['تصرف غير آمن', 'وضع غير آمن', 'ملاحظة إيجابية'] },
        {
          key: 'category',
          label: 'التصنيف',
          type: 'select',
          required: true,
          options: [
            'معدات الوقاية الشخصية',
            'المعدات والآلات',
            'الكهرباء',
            'الحريق',
            'المركبات والقيادة',
            'النظافة والترتيب',
            'العمل على ارتفاع',
            'الحفر',
            'المواد الخطرة',
            'بيئة العمل',
            'أخرى',
          ],
        },
        { key: 'risk', label: 'مستوى الخطورة', type: 'select', required: true, options: ['منخفض', 'متوسط', 'مرتفع'] },
        { key: 'description', label: 'وصف الملاحظة', type: 'textarea', required: true },
        ...H.HSE_ACTION,
        { key: 'status', label: 'الحالة', type: 'select', options: ['مفتوحة', 'مغلقة'], inv: true },
      ],
      permits: [
        {
          key: 'type',
          label: 'نوع التصريح',
          type: 'select',
          required: true,
          options: ['عمل ساخن (لحام / قطع)', 'دخول أماكن مغلقة', 'العمل على ارتفاع', 'أعمال الحفر', 'أعمال كهربائية', 'رفع ثقيل', 'أخرى'],
        },
        H.HSE_BRANCH,
        { ...H.HSE_SITE, required: true },
        { key: 'from', label: 'يسري من', type: 'date', required: true },
        { key: 'to', label: 'ينتهي في', type: 'date', required: true },
        { key: 'supervisor', label: 'المشرف المسؤول عن العمل', required: true },
        { key: 'workers', label: 'العاملون', hint: 'الأسماء مفصولة بفاصلة' },
        { key: 'work', label: 'وصف العمل', type: 'textarea', required: true },
        { key: 'hazards', label: 'المخاطر المتوقعة', type: 'textarea' },
        { key: 'precautions', label: 'الاحتياطات ومعدات الوقاية المطلوبة', type: 'textarea', required: true },
        { key: 'status', label: 'الحالة', type: 'select', options: ['ساري', 'مغلق', 'ملغي'], inv: true },
      ],
      inspections: [
        {
          key: 'template',
          label: 'نوع الفحص',
          type: 'select',
          required: true,
          get options() {
            return Object.keys(HSE.CHECKS);
          },
        },
        { key: 'date', label: 'تاريخ الفحص', type: 'date', required: true },
        H.HSE_BRANCH,
        H.HSE_SITE,
        { key: 'asset', label: 'المعدة / المركبة / المكان', hint: 'مثال: رقم اللوحة أو رقم الحفارة' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
        ...H.HSE_ACTION,
        { key: 'status', label: 'الحالة', type: 'select', options: ['مكتمل', 'يحتاج إجراء', 'تمت المعالجة'], inv: true },
      ],
    },
  };

  /* ---------- الحقول المشتركة ---------- */
  const F = {
    date: { key: 'date', label: 'تاريخ الخطاب', type: 'date', required: true, today: true },
    name: { key: 'name', label: 'اسم الموظف', required: true },
    iqama: { key: 'iqama', label: 'رقم الإقامة / الهوية', required: true },
    job: { key: 'job', label: 'الوظيفة' },
    prof: { key: 'prof', label: 'المهنة بالإقامة' },
    branch: { key: 'branch', label: 'الفرع', required: true, fromUser: 'branch' },
    joinDate: { key: 'joinDate', label: 'تاريخ التعيين', type: 'date' },
  };

  /* بنود الراتب في خطاب زيادة الراتب */
  const SALARY_ITEMS = [
    ['basic', 'الراتب الأساسي'],
    ['housing', 'بدل سكن'],
    ['car', 'بدل سيارة'],
    ['phone', 'بدل جوال'],
    ['food', 'بدل إعاشة'],
    ['res', 'بدل إقامة'],
  ];
  /* ---------- النماذج ---------- */
  const SETTLE_EMBED = {
    src: '/legacy/settlement-program.html',
    root: '#printArea',
    skip: '#filename',
    rows: { table: '#discountTable', base: 7, add: 'addDeductionRow' },
    recalc: ['applyManualCalc', 'calculateFinalLeave', 'calculateTotalSalary', 'calculateTotalDeductions', 'calculateNetSalary'],
    eosRow: 'مكافأة نهاية الخدمة',
    pick: {
      name: '#اسم_الموظف',
      iqama: '#رقم_الإقامة',
      basic: '#الراتب_الأساسي',
      net: '#netSalary',
      gross: '#totalDue',
      nationality: '#الجنسية',
      company: '#الشركة_المؤسسة',
      startDate: '#startDate',
      endDate: '#leaveDate',
    },
    hide: ['.btn-container'],
    lockHide: ['.btn-container', 'button[onclick="addDeductionRow()"]'],
  };
  const CAR_FIELDS = [
    { key: 'vType', label: 'فئة المركبة', type: 'select', options: H.VEH_TYPES, required: true },
    { key: 'plate', label: 'رقم لوحة السيارة', required: true },
    { key: 'model', label: 'نوع وموديل السيارة' },
    { key: 'year', label: 'سنة الصنع' },
    { key: 'date', label: 'تاريخ التسليم', type: 'date', required: true },
    { key: 'odometer', label: 'قراءة العداد (كم)', type: 'number' },
    { key: 'condition', label: 'حالة السيارة عند التسليم', type: 'select', options: ['سليمة', 'بها ملاحظات'], required: true },
    { key: 'damages', label: 'مبلغ على الموظف (تلفيات / مخالفات)', type: 'number' },
    { key: 'marks', label: 'التلفيات على الرسمة (اضغط على مكان التلف)', type: 'marks', imgFrom: 'vType', images: H.VEH_IMG },
    { key: 'carNotes', label: 'ملاحظات أخرى', type: 'textarea' },
  ];
  /* نموذجا الخصم (من المدير المباشر / من الشئون القانونية): نفس بيانات الموظف والخصم */
  const DED_FIELDS = [
    F.date,
    F.name,
    { ...F.branch, label: 'الإدارة / الفرع' },
    F.iqama,
    F.job,
    { key: 'reason', label: 'سبب الخصم', type: 'textarea', required: true },
    { key: 'value', label: 'قيمة الخصم (ريال)', type: 'number', required: true },
    { key: 'salaryBefore', label: 'الراتب قبل الخصم', type: 'number' },
    { key: 'salaryAfter', label: 'الراتب بعد الخصم', type: 'number', hint: 'يُحسب تلقائياً إذا تُرك فارغاً' },
  ];
  const HIRE_PAY = [
    ['basic', 'الراتب الأساسي'],
    ['housing', 'بدل السكن'],
    ['transport', 'بدل النقل'],
    ['phone', 'بدل الاتصال'],
    ['food', 'بدل الإعاشة'],
    ['otherAllow', 'بدلات أخرى'],
  ];
  /* ---------- طلب صيانة مركبة (إدارة الحركة / الورشة) ----------
   * أنواع الصيانة وجهة الصيانة الخارجية (النموذج وخطابه في forms-traffic.js، ودورته في operations/application/workshop-cycle.js) */
  const MAINT_TYPES = [
    'تغيير زيت وفلتر',
    'تغيير زيت القير (الناقل)',
    'تغيير بواجي (شمعات الاحتراق)',
    'تغيير فلاتر (هواء / مكيف / وقود)',
    'فحص دوري شامل',
    'إصلاح عطل في الماكينة',
    'إصلاح عطل في القير',
    'نظام التبريد (رديتر / طرمبة ماء)',
    'إصلاح العادم (الشكمان)',
    'تهريب زيوت أو سوائل',
    'تغيير فحمات وهوبات',
    'إصلاح نظام ABS',
    'تغيير مساعدات',
    'وزن أذرعة ومقصات',
    'تغيير البطارية',
    'إصلاح الدينامو / السلف',
    'فحص وإصلاح التكييف (فريون)',
    'تغيير لمبات وإنارة',
    'برمجة وحذف أعطال',
    'طقم إطارات (كفرات)',
    'ترصيص وميزان',
    'سمكرة ودهان',
    'زجاج أمامي / خلفي',
    'أخرى',
  ];
  /* سداد محاسب الفرع في دورة الورشة (الصيانة والتصنيع) بعد موافقة مدير الفرع */
  const PAY_TASK = {
    step: 'محاسب الفرع',
    fields: [
      { key: 'payDate', label: 'تاريخ السداد', type: 'date', required: true },
      { key: 'paidAmount', label: 'المبلغ المسدد (ريال)', type: 'number', required: true },
      { key: 'payMethod', label: 'طريقة السداد', type: 'select', options: ['تحويل بنكي', 'نقداً', 'شيك', 'عهدة الفرع'], required: true },
      { key: 'payRef', label: 'رقم السند / الحوالة' },
      { key: 'payNote', label: 'ملاحظات', type: 'textarea' },
    ],
  };
  return { HSE, F, SALARY_ITEMS, SETTLE_EMBED, CAR_FIELDS, DED_FIELDS, HIRE_PAY, MAINT_TYPES, PAY_TASK };
});
