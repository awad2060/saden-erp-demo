/* بيانات forms.js (forms-data-1): GROUPS، ONES، END_TYPES، END_ALIAS، GOV
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-data-1'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  const GROUPS = [
    'البدلات',
    'المستحقات',
    'المصروفات',
    'السلف',
    'الخصومات والتصفية',
    'إدارة الحركة',
    'إدارة الجرد',
    'الورشة',
    'قسم الحفر',
    'التوظيف',
    'شئون الموظفين',
    'عام',
  ];

  /* تفقيط المبالغ بالعربية */
  const ONES = [
    '',
    'واحد',
    'اثنان',
    'ثلاثة',
    'أربعة',
    'خمسة',
    'ستة',
    'سبعة',
    'ثمانية',
    'تسعة',
    'عشرة',
    'أحد عشر',
    'اثنا عشر',
    'ثلاثة عشر',
    'أربعة عشر',
    'خمسة عشر',
    'ستة عشر',
    'سبعة عشر',
    'ثمانية عشر',
    'تسعة عشر',
  ];

  /* ---------- أنواع إنهاء الخدمة حسب نظام العمل السعودي ----------
   * notice: من يلزمه الإشعار في العقد غير محدد المدة (م 75): worker = 30 يوماً، employer = 60 يوماً
   * eos: أثر الإنهاء على مكافأة نهاية الخدمة (م 84 / 85 / 87) — resign = حسب مدة الخدمة (م 85) */
  const END_TYPES = [
    { name: 'استقالة', notice: 'worker', eos: 'resign' },
    { name: 'استقالة العاملة خلال 6 أشهر من الزواج أو 3 أشهر من الوضع (م 87)', notice: 'worker', eos: 'يستحق المكافأة كاملة (م 87)' },
    {
      name: 'إنهاء من صاحب العمل لسبب مشروع (م 75)',
      notice: 'employer',
      eos: 'يستحق المكافأة كاملة: نصف أجر شهر عن كل سنة من الخمس الأولى وأجر شهر عن كل سنة بعدها (م 84)',
    },
    {
      name: 'إنهاء من صاحب العمل لسبب غير مشروع (م 77)',
      notice: 'employer',
      eos: 'يستحق المكافأة كاملة (م 84) + تعويضاً (م 77): أجر 15 يوماً عن كل سنة خدمة في العقد غير محدد المدة، وأجر المدة الباقية في العقد محدد المدة، وبحد أدنى أجر شهرين',
    },
    { name: 'انتهاء مدة العقد (م 74)', notice: '', eos: 'يستحق المكافأة كاملة (م 84)' },
    { name: 'اتفاق الطرفين (م 74)', notice: '', eos: 'حسب الاتفاق المكتوب بموافقة العامل، والأصل استحقاق المكافأة كاملة (م 84)' },
    { name: 'ترك العامل العمل لإخلال صاحب العمل بالتزاماته (م 81)', notice: '', eos: 'يستحق المكافأة كاملة وجميع حقوقه النظامية (م 81)' },
    {
      name: 'فصل بدون مكافأة لارتكاب مخالفة (م 80)',
      notice: '',
      eos: 'لا يستحق مكافأة نهاية الخدمة (م 80) — يلزم تحقيق مكتوب وإتاحة الفرصة للعامل لإبداء دفاعه',
    },
    {
      name: 'الانقطاع عن العمل دون سبب مشروع (م 80)',
      notice: '',
      eos: 'لا يستحق مكافأة نهاية الخدمة (م 80) — الغياب أكثر من 30 يوماً متقطعة في السنة أو 15 يوماً متصلة، بعد إنذار كتابي',
    },
    { name: 'إنهاء خلال فترة التجربة (م 53)', notice: '', eos: 'لا يستحق مكافأة نهاية الخدمة ولا تعويضاً (م 53)' },
    { name: 'بلوغ سن التقاعد (م 74)', notice: '', eos: 'يستحق المكافأة كاملة (م 84)' },
    { name: 'وفاة العامل', notice: '', eos: 'تُصرف المكافأة كاملة لورثة العامل (م 84)' },
    { name: 'عجز العامل كلياً عن العمل / عدم اللياقة الصحية', notice: '', eos: 'يستحق المكافأة كاملة (م 84)' },
    {
      name: 'إنهاء بعد استنفاد الإجازة المرضية (م 117)',
      notice: '',
      eos: 'يستحق المكافأة كاملة (م 84) — لا يجوز الإنهاء قبل استنفاد الإجازة المرضية (م 82)',
    },
    { name: 'قوة قاهرة خارجة عن إرادة الطرفين (م 74 / 87)', notice: '', eos: 'يستحق المكافأة كاملة (م 87)' },
    { name: 'إغلاق المنشأة نهائياً (م 74)', notice: '', eos: 'يستحق المكافأة كاملة (م 84)' },
    { name: 'إنهاء النشاط الذي يعمل فيه العامل (م 74)', notice: '', eos: 'يستحق المكافأة كاملة (م 84)' },
    { name: 'نقل خدمات العامل لمنشأة أخرى', notice: '', eos: 'حسب سبب الانتقال واتفاق الأطراف — تُحدَّد عند التصفية' },
  ];
  /* المسميات القديمة المحفوظة في الطلبات والملفات السابقة */
  const END_ALIAS = {
    'إنهاء من صاحب العمل': 'إنهاء من صاحب العمل لسبب مشروع (م 75)',
    'انتهاء العقد': 'انتهاء مدة العقد (م 74)',
    'اتفاق الطرفين': 'اتفاق الطرفين (م 74)',
    'إنهاء لسبب مشروع (م 80)': 'فصل بدون مكافأة لارتكاب مخالفة (م 80)',
    'ترك العامل العمل لإخلال صاحب العمل (م 81)': 'ترك العامل العمل لإخلال صاحب العمل بالتزاماته (م 81)',
    'إنهاء خلال فترة التجربة': 'إنهاء خلال فترة التجربة (م 53)',
    تقاعد: 'بلوغ سن التقاعد (م 74)',
    وفاة: 'وفاة العامل',
    'انقطاع عن العمل': 'الانقطاع عن العمل دون سبب مشروع (م 80)',
  };
  /* ---------- الحوكمة والامتثال: سجل المخاطر، تفويض الصلاحيات، التدقيق الداخلي، السياسات، تعارض المصالح، البلاغات ---------- */
  const GOV = {
    KINDS: {
      risks: 'سجل المخاطر',
      doa: 'تفويض الصلاحيات',
      audits: 'التدقيق الداخلي',
      findings: 'ملاحظات التدقيق',
      policies: 'السياسات والإجراءات',
      coi: 'تعارض المصالح',
      reports: 'البلاغات',
    },
    ONE: { risks: 'خطر', doa: 'صلاحية', audits: 'مهمة تدقيق', findings: 'ملاحظة تدقيق', policies: 'سياسة', coi: 'إقرار', reports: 'بلاغ' },
    PREFIX: { risks: 'RSK', doa: 'DOA', audits: 'AUD', findings: 'FND', policies: 'POL', coi: 'COI', reports: 'WB' },
    /* مستوى الخطر من الاحتمال × الأثر (1–25) */
    level: (sc) => (sc >= 20 ? 'حرج' : sc >= 10 ? 'مرتفع' : sc >= 5 ? 'متوسط' : 'منخفض'),
    LEVEL_C: { حرج: '#7f1d1d', مرتفع: '#dc2626', متوسط: '#d97706', منخفض: '#16a34a' },
    CLOSED: ['مغلق', 'مغلقة', 'مكتمل', 'ملغاة', 'ملغي'],
    fields: {
      risks: [
        { key: 'title', label: 'الخطر', required: true },
        {
          key: 'category',
          label: 'التصنيف',
          type: 'select',
          required: true,
          options: ['استراتيجي', 'تشغيلي', 'مالي', 'امتثال ونظامي', 'سلامة وصحة مهنية', 'تقني وأمن معلومات', 'سمعة', 'موارد بشرية'],
        },
        { key: 'branch', label: 'الفرع / الإدارة', type: 'branch' },
        { key: 'cause', label: 'السبب ومصدر الخطر', type: 'textarea' },
        { key: 'consequence', label: 'الأثر المتوقع إن حدث', type: 'textarea' },
        {
          key: 'likelihood',
          label: 'الاحتمال (1–5)',
          type: 'select',
          required: true,
          options: ['1', '2', '3', '4', '5'],
          hint: '1 نادر — 5 شبه مؤكد',
        },
        {
          key: 'impact',
          label: 'الأثر (1–5)',
          type: 'select',
          required: true,
          options: ['1', '2', '3', '4', '5'],
          hint: '1 ضئيل — 5 كارثي',
        },
        { key: 'owner', label: 'مالك الخطر', type: 'user', required: true },
        { key: 'treatment', label: 'أسلوب المعالجة', type: 'select', options: ['تخفيف', 'تجنب', 'نقل (تأمين / تعاقد)', 'قبول'] },
        { key: 'plan', label: 'خطة المعالجة والضوابط', type: 'textarea' },
        { key: 'due', label: 'موعد المعالجة', type: 'date' },
        { key: 'review', label: 'موعد المراجعة القادمة', type: 'date' },
        { key: 'status', label: 'الحالة', type: 'select', options: ['مفتوح', 'قيد المعالجة', 'مغلق'] },
      ],
      doa: [
        {
          key: 'scope',
          label: 'نطاق الصلاحية',
          type: 'select',
          required: true,
          get options() {
            return [
              'كل الطلبات المالية',
              ...[...new Set(H.FORMS.filter((f) => f.amount || /سلف|بدل|مصروف|مشتر|صرف|تعميد/.test(f.title)).map((f) => f.group))],
            ];
          },
        },
        { key: 'userId', label: 'المعتمد', type: 'user', required: true },
        { key: 'position', label: 'المنصب', hint: 'مثال: مدير الفرع، المدير المالي، المدير التنفيذي' },
        { key: 'limit', label: 'الحد الأعلى للاعتماد (ريال)', type: 'number', required: true },
        { key: 'notes', label: 'ملاحظات وشروط', type: 'textarea' },
      ],
      audits: [
        { key: 'title', label: 'مهمة التدقيق', required: true },
        {
          key: 'area',
          label: 'المجال',
          type: 'select',
          required: true,
          options: ['مالي', 'مشتريات ومخزون', 'موارد بشرية ورواتب', 'تشغيلي', 'سلامة', 'امتثال', 'تقنية المعلومات', 'فرع'],
        },
        { key: 'branch', label: 'الفرع / الإدارة', type: 'branch' },
        { key: 'auditor', label: 'المدقق', type: 'user', required: true },
        { key: 'from', label: 'من', type: 'date', required: true },
        { key: 'to', label: 'إلى', type: 'date' },
        { key: 'scope', label: 'نطاق التدقيق وأهدافه', type: 'textarea' },
        { key: 'conclusion', label: 'الخلاصة والرأي', type: 'textarea' },
        { key: 'status', label: 'الحالة', type: 'select', options: ['مخطط', 'جاري', 'مكتمل', 'ملغي'] },
      ],
      findings: [
        { key: 'auditId', label: 'مهمة التدقيق', type: 'audit', required: true },
        { key: 'title', label: 'الملاحظة', required: true },
        { key: 'severity', label: 'الأهمية', type: 'select', required: true, options: ['منخفضة', 'متوسطة', 'عالية', 'حرجة'] },
        { key: 'description', label: 'الوصف والأدلة', type: 'textarea', required: true },
        { key: 'recommendation', label: 'التوصية', type: 'textarea', required: true },
        { key: 'owner', label: 'المسؤول عن المعالجة', type: 'user', required: true },
        { key: 'due', label: 'موعد المعالجة', type: 'date', required: true },
        { key: 'status', label: 'الحالة', type: 'select', options: ['مفتوحة', 'قيد المعالجة', 'مغلقة'] },
      ],
      policies: [
        { key: 'title', label: 'عنوان السياسة / الإجراء', required: true },
        {
          key: 'category',
          label: 'التصنيف',
          type: 'select',
          required: true,
          options: ['سياسة', 'إجراء عمل', 'لائحة', 'مدونة سلوك', 'دليل', 'تعميم'],
        },
        { key: 'version', label: 'الإصدار', required: true, hint: 'مثال: 1.0 — تغيير الإصدار يطلب إقراراً جديداً' },
        { key: 'effective', label: 'تاريخ السريان', type: 'date', required: true },
        { key: 'owner', label: 'الجهة المالكة', hint: 'مثال: الموارد البشرية' },
        { key: 'audience', label: 'تنطبق على', type: 'select', options: ['كل المستخدمين والموظفين', 'المديرون والمحاسبون فقط'] },
        { key: 'mustAck', label: 'يلزم إقرار بالاطلاع', type: 'select', options: ['نعم', 'لا'] },
        { key: 'body', label: 'النص / الملخص', type: 'textarea', required: true },
        { key: 'status', label: 'الحالة', type: 'select', options: ['سارية', 'ملغاة'] },
      ],
    },
  };
  return { GROUPS, ONES, END_TYPES, END_ALIAS, GOV };
});
