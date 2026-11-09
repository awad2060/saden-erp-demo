/* تعريف نماذج الخطابات المستخدمة في SADEN ERP SYSTEM
 * الملف مشترك بين الخادم (للتحقق من البيانات) والواجهة (لعرض الخطاب). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SADEN_FORMS = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* المسار الافتراضي يستخدم فقط إذا لم يصل مسار من الخادم */
  const DEFAULT_ROUTE = [
    { prefix: 'الأستاذ', name: 'مصطفى عبده', title: 'مدير قسم الرواتب وحماية الأجور', label: 'مدير إدارة الرواتب' },
    { prefix: 'الأستاذ', name: 'محمود جمال', title: 'المدير المالي', label: 'المدير المالي' },
    { prefix: 'المهندس', name: 'إسلام عزت', title: 'نائب المدير التنفيذي لمجموعة سادن', label: 'المدير التنفيذي' },
  ];
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
  /* بيانات الجُمع والإعاشات: الشهور، واسم اليوم من التاريخ، وإجمالي البيان */
  const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dayName = (s) =>
    /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))
      ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date(`${s}T00:00:00`).getDay()]
      : '';
  const sheetTotal = (d) => Math.round((d.rows || []).reduce((a, r) => a + (Number(r.amount) || 0), 0) * 100) / 100;
  /* محضر تسليم وتسلم المركبات: رسمة لكل فئة (من نماذج الورد) لتحديد التلفيات عليها */
  const VEH_TYPES = ['ملاكي', 'غمارة', 'غمارتين', 'دينة', 'معدة', 'حفارة'];
  const VEH_IMG = {
    ملاكي: '/vehicles/sedan.png',
    غمارة: '/vehicles/single.jpg',
    غمارتين: '/vehicles/double.jpg',
    دينة: '/vehicles/dyna.jpg',
  };

  /* ---------- أدوات مساعدة ---------- */
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmtDate = (s) => {
    if (!s) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s);
  };
  const fmtNum = (n) => {
    if (n === '' || n == null || isNaN(Number(n))) return String(n || '');
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  const hijri = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    if (!m) return '';
    try {
      const p = Object.fromEntries(
        new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: '2-digit', day: '2-digit' })
          .formatToParts(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)))
          .map((x) => [x.type, x.value]),
      );
      return `${p.day}/${p.month}/${p.year}`;
    } catch {
      return '';
    }
  };
  /* من يتحمل راتب شهر النقل: الاختيار في القرار، وإلا فيوم المباشرة (≤ 15 المنقول إليه، > 15 المنقول منه) */
  const TR_PAY = ['الفرع المنقول منه', 'الفرع المنقول إليه'];
  const trFromPays = (d) => (d.payBranch ? d.payBranch === TR_PAY[0] : Number(String(d.effectiveDate || '').slice(8, 10)) > 15);
  const trPayBranch = (d) => (trFromPays(d) ? d.branch : d.toBranch) || '';
  const transferEmps = (d) => ((d.employees || []).length ? d.employees : d.name ? [{ name: d.name, iqama: d.iqama, job: d.job }] : []);
  const val = (s, dots = '..........') => (s ? `<b class="fill">${esc(s)}</b>` : `<span class="dots">${dots}</span>`);

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
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  function below1000(n) {
    const parts = [];
    const h = Math.floor(n / 100),
      r = n % 100;
    if (h) parts.push(HUNDREDS[h]);
    if (r) {
      if (r < 20) parts.push(ONES[r]);
      else parts.push(r % 10 ? `${ONES[r % 10]} و${TENS[Math.floor(r / 10)]}` : TENS[Math.floor(r / 10)]);
    }
    return parts.join(' و');
  }
  function scaleWord(n, one, two, plural, single) {
    if (n === 1) return one;
    if (n === 2) return two;
    const r = n % 100;
    return `${below1000(n)} ${r >= 3 && r <= 10 ? plural : single}`;
  }
  function words(n) {
    if (n === 0) return 'صفر';
    const parts = [];
    const m = Math.floor(n / 1e6),
      t = Math.floor((n % 1e6) / 1000),
      r = n % 1000;
    if (m) parts.push(scaleWord(m, 'مليون', 'مليونان', 'ملايين', 'مليون'));
    if (t) parts.push(scaleWord(t, 'ألف', 'ألفان', 'آلاف', 'ألف'));
    if (r) parts.push(below1000(r));
    return parts.join(' و');
  }
  function tafqeet(num) {
    const n = Number(num);
    if (num === '' || num == null || !isFinite(n) || n < 0 || n >= 1e9) return '';
    const riyals = Math.floor(n);
    const halalas = Math.round((n - riyals) * 100);
    let out = `${words(riyals)} ريال سعودي`;
    if (halalas) out += ` و${words(halalas)} هللة`;
    return `فقط ${out} لا غير`;
  }

  /* جدول بيانات الموظف (عمودان في كل صف) */
  function infoTable(pairs) {
    let rows = '';
    for (let i = 0; i < pairs.length; i += 2) {
      const a = pairs[i],
        b = pairs[i + 1];
      rows += `<tr><td class="lbl">${a[0]}</td><td>${esc(a[1])}</td>${b ? `<td class="lbl">${b[0]}</td><td>${esc(b[1])}</td>` : '<td class="lbl"></td><td></td>'}</tr>`;
    }
    return `<table class="lt">${rows}</table>`;
  }
  /* صناديق الملاحظات (عنوانها فيه «ملاحظات») يُكتب محتواها بالأحمر لجذب الانتباه */
  const decisionBox = (head, content, small) =>
    `<div class="l-box"><div class="l-box-h">${head}</div><div class="l-box-b${small ? ' small' : ''}${/ملاحظات/.test(String(head)) ? ' l-note-red' : ''}">${content || ''}</div></div>`;

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
  const endTypeOf = (n) => END_TYPES.find((x) => x.name === (END_ALIAS[n] || n)) || null;
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
              ...[...new Set(FORMS.filter((f) => f.amount || /سلف|بدل|مصروف|مشتر|صرف|تعميد/.test(f.title)).map((f) => f.group))],
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
        HSE_BRANCH,
        HSE_SITE,
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
        ...HSE_ACTION,
        { key: 'status', label: 'الحالة', type: 'select', options: ['مفتوح', 'قيد التحقيق', 'مغلق'], inv: true },
      ],
      observations: [
        { key: 'date', label: 'التاريخ', type: 'date', required: true },
        HSE_BRANCH,
        HSE_SITE,
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
        ...HSE_ACTION,
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
        HSE_BRANCH,
        { ...HSE_SITE, required: true },
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
        HSE_BRANCH,
        HSE_SITE,
        { key: 'asset', label: 'المعدة / المركبة / المكان', hint: 'مثال: رقم اللوحة أو رقم الحفارة' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
        ...HSE_ACTION,
        { key: 'status', label: 'الحالة', type: 'select', options: ['مكتمل', 'يحتاج إجراء', 'تمت المعالجة'], inv: true },
      ],
    },
  };
  /* حالة الفحص من الإجابات: أي «غير مطابق» = يحتاج إجراء */
  HSE.inspResult = (answers) => (Object.values(answers || {}).includes('غير مطابق') ? 'يحتاج إجراء' : 'مكتمل');

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
  const basicPairs = (d) => [
    ['الإسم', d.name],
    ['رقم الإقامة', d.iqama],
    ['الوظيفة', d.job],
    ['المهنة بالإقامة', d.prof],
  ];

  /* نموذج "برجاء تحديد قيمة بدل" المتكرر
   * fields: الحقول بعد البيانات الأساسية، pairs: صفوف الجدول بعد الإسم والإقامة والوظيفة والمهنة */
  /* توقيع الموظف على إقرار السلفة: توقيعه الإلكتروني المحفوظ أو توقيع حي رسمه عند الطلب (يحفظه الخادم في empSig) */
  const empSigLine = (d) =>
    d.empSig
      ? `<div class="l-mgr-sig">توقيع الموظف : <img class="l-sig-img l-emp-sig" src="/api/signatures/${encodeURIComponent(d.empSig)}" alt="توقيع الموظف"><small class="muted">${d.empSigMode === 'live' ? 'توقيع حي عند تقديم الطلب' : 'التوقيع الإلكتروني المحفوظ'}</small></div>`
      : d.empSigMode === 'manual'
        ? '<div class="l-mgr-sig">توقيع الموظف : .............................. <small class="muted">(موقّع ورقياً — النسخة الموقّعة مرفقة بالطلب)</small></div>'
        : '<div class="l-mgr-sig">توقيع الموظف : ..............................</div>';
  function valueAllowance({ id, label, title, fields, pairs, extra, requiredAttachments }) {
    return {
      id,
      group: 'البدلات',
      title: title || `خطاب تعميد ${label}`,
      requiredAttachments,
      fields: [F.date, F.name, F.iqama, F.job, F.prof, ...fields],
      body: (d) => `<p>برجاء تحديد قيمة (${label}) للموظف الآتي بياناته :</p>
        ${infoTable([...basicPairs(d), ...pairs(d)])}
        ${extra ? extra(d) : ''}`,
      needsValue: true,
    };
  }
  const branchSig = '<div class="l-mgr-sig">توقيع مدير الفرع : ..............................</div>';

  /* بنود الراتب في خطاب زيادة الراتب */
  const SALARY_ITEMS = [
    ['basic', 'الراتب الأساسي'],
    ['housing', 'بدل سكن'],
    ['car', 'بدل سيارة'],
    ['phone', 'بدل جوال'],
    ['food', 'بدل إعاشة'],
    ['res', 'بدل إقامة'],
  ];
  const salaryFields = (prefix, when) => SALARY_ITEMS.map(([k, l]) => ({ key: prefix + k, label: `${l} ${when}`, type: 'number' }));
  const salaryTotal = (d, prefix) => SALARY_ITEMS.reduce((s, [k]) => s + (Number(d[prefix + k]) || 0), 0);
  function salaryTable(d, prefix) {
    const total = salaryTotal(d, prefix);
    return `<table class="lt grid sm"><thead>
      <tr><th rowspan="2" style="width:22%">الإسم</th><th rowspan="2">رقم الإقامة</th><th rowspan="2">الوظيفة</th><th rowspan="2">الراتب الأساسي</th><th colspan="5">البدلات</th><th rowspan="2">الإجمالي</th></tr>
      <tr>${SALARY_ITEMS.slice(1)
        .map(([, l]) => `<th>${l}</th>`)
        .join('')}</tr></thead>
      <tbody><tr><td>${esc(d.name)}</td><td>${esc(d.iqama)}</td><td>${esc(d.job)}</td>
      ${SALARY_ITEMS.map(([k]) => `<td>${esc(fmtNum(d[prefix + k]))}</td>`).join('')}<td><b>${total ? esc(fmtNum(total)) : ''}</b></td></tr></tbody></table>`;
  }

  /* إجمالي جدول: مجموع (الكمية × السعر) */
  /* إجماليات عرض السعر: بدون الضريبة، والضريبة 15%، وشامل الضريبة */
  /* المصنوعية تدخل في الإجمالي بدون ضريبة؛ الضريبة 15% على البنود فقط */
  const mfgTotals = (rows, labor = 0) => {
    const r2 = (n) => Math.round(n * 100) / 100,
      sub = sumRows(rows, 'qty', 'price'),
      vat = r2(sub * 0.15),
      withVat = r2(sub + vat),
      lab = r2(Number(labor) || 0);
    return { subtotal: sub, vat, withVat, labor: lab, total: r2(withVat + lab) };
  };
  const sumRows = (rows, q, p) => Math.round((rows || []).reduce((a, x) => a + (Number(x[q]) || 0) * (Number(x[p]) || 0), 0) * 100) / 100;
  /* عرض السعر: الصافي والضريبة والإجمالي حسب خيار الضريبة */
  function quoteTotals(d) {
    const sum = sumRows(d.items, 'qty', 'price'),
      r2 = (n) => Math.round(n * 100) / 100;
    if (d.vat === 'بدون ضريبة') return { net: sum, vat: 0, total: sum };
    if (d.vat === 'الأسعار شاملة الضريبة') return { net: r2(sum / 1.15), vat: r2(sum - sum / 1.15), total: sum };
    return { net: sum, vat: r2(sum * 0.15), total: r2(sum * 1.15) };
  }
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

  /* ---------- دورة ملف التصفية ----------
   * محاسب الفرع يطلب البيانات ← شئون الموظفين تعتمدها وترجعها ← المحاسب يملأ الخصومات والعهد ومحضر السيارة
   * ← (عند وجود سيارة) إدارة الحركة تعتمد المحضر وترجعه ← المحاسب يوجّه الملف ← محاسب إدارة الرواتب يعدّ التصفية ← الاعتماد */
  /* الفرق بين تاريخين بنفس طريقة "برنامج التصفية":
   * عدد الأيام = floor((التاريخ الثاني - الأول) / يوم)، والمدة بالسنوات والأشهر والأيام كدالة getDurationBetweenDates */
  function daysBetween(from, to) {
    const a = new Date(from),
      b = new Date(to);
    if (!from || !to || isNaN(a) || isNaN(b)) return null;
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
  }
  function durationText(from, to) {
    const start = new Date(from),
      end = new Date(to);
    if (!from || !to || isNaN(start) || isNaN(end) || end < start) return '';
    let years = end.getFullYear() - start.getFullYear(),
      months = end.getMonth() - start.getMonth(),
      days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} سنة، ${months} شهر، ${days} يوم`;
  }
  const CASE_DED = ['سلف', 'عهدة نقدية', 'مصروفات إدارية', 'مخالفات مرورية', 'خصومات أخرى'];
  const CASE_ASSETS = ['سيارة', 'جوال', 'شريحة إتصال', 'لاب توب', 'أخرى'];
  const CAR_FIELDS = [
    { key: 'vType', label: 'فئة المركبة', type: 'select', options: VEH_TYPES, required: true },
    { key: 'plate', label: 'رقم لوحة السيارة', required: true },
    { key: 'model', label: 'نوع وموديل السيارة' },
    { key: 'year', label: 'سنة الصنع' },
    { key: 'date', label: 'تاريخ التسليم', type: 'date', required: true },
    { key: 'odometer', label: 'قراءة العداد (كم)', type: 'number' },
    { key: 'condition', label: 'حالة السيارة عند التسليم', type: 'select', options: ['سليمة', 'بها ملاحظات'], required: true },
    { key: 'damages', label: 'مبلغ على الموظف (تلفيات / مخالفات)', type: 'number' },
    { key: 'marks', label: 'التلفيات على الرسمة (اضغط على مكان التلف)', type: 'marks', imgFrom: 'vType', images: VEH_IMG },
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
  function legalApply(d) {
    const t = d.tasks || {},
      a = t.applyMethod,
      p = t.payrollApply,
      r = t.legalReview;
    /* قيمة الخصم يحددها محاسب إدارة الرواتب (والطلبات القديمة كانت تُسجَّل مع النموذج) */
    const value = (p && p.value) || d.value;
    if (!a && !p && !(r && r.accNote)) return '';
    const rows = [];
    if (r && r.accNote) rows.push(['ملاحظات محاسب الفرع', r.accNote]);
    if (a) {
      rows.push([
        'طريقة التطبيق',
        `${a.method || ''}${a.method === 'على أقساط شهرية' && a.installments ? ` — ${a.installments} أقساط${value ? ` (${fmtNum(Number(value) / Number(a.installments))} ريال شهرياً)` : ''}` : ''}`,
      ]);
      rows.push(['يبدأ من راتب شهر', a.startMonth]);
      if (a.methodNote) rows.push(['تعليمات التطبيق', a.methodNote]);
    }
    if (p) {
      if (p.value) rows.push(['قيمة الخصم', `${fmtNum(p.value)} ريال (${tafqeet(p.value)})`]);
      rows.push(['أُنزل في رواتب شهر', p.payMonth]);
      if (p.payNote) rows.push(['ملاحظات محاسب إدارة الرواتب', p.payNote]);
    }
    return `<h4 class="l-sec">رابعاً : تطبيق الخصم :</h4>
        <table class="lt">${rows.map(([l, v]) => `<tr><td class="lbl">${esc(l)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>`;
  }
  /* noAmounts: بدون قيمة الخصم والراتب (خصم الشئون القانونية)، وتظهر فقط في الطلبات القديمة التي سُجلت بها */
  function dedBody(d, middle, lead, noAmounts) {
    const amounts = !noAmounts || d.value || d.salaryBefore || d.salaryAfter;
    const after = d.salaryAfter || (d.salaryBefore && d.value ? Number(d.salaryBefore) - Number(d.value) : '');
    return `<h4 class="l-sec">أولاً : بيانات الموظف :</h4>
        <table class="lt"><tr><td class="lbl">الإسم</td><td colspan="3">${esc(d.name)}</td></tr>
        <tr><td class="lbl">الإدارة / الفرع</td><td colspan="3">${esc(d.branch)}</td></tr>
        <tr><td class="lbl">رقم الإقامة / الهوية</td><td>${esc(d.iqama)}</td><td class="lbl">الوظيفة</td><td>${esc(d.job)}</td></tr></table>
        ${middle || ''}
        <h4 class="l-sec">${middle ? 'ثالثاً' : 'ثانياً'} : بيانات الخصم :</h4>
        ${lead ? `<p class="l-para" style="margin:4px 0 6px">${lead}</p>` : ''}
        <table class="lt"><tr><td class="lbl">سبب الخصم</td><td colspan="3" style="height:50px;vertical-align:top">${esc(d.reason)}</td></tr>
        ${d.penalty ? `<tr><td class="lbl">الجزاء المقرر</td><td colspan="3">${esc(d.penalty)}</td></tr>` : ''}
        ${
          amounts
            ? `<tr><td class="lbl">قيمة الخصم</td><td colspan="3">${esc(fmtNum(d.value))} ${d.value ? '<small>(' + esc(tafqeet(d.value)) + ')</small>' : ''}</td></tr>
        <tr><td class="lbl">الراتب قبل الخصم</td><td>${esc(fmtNum(d.salaryBefore))}</td><td class="lbl">الراتب بعد الخصم</td><td>${esc(fmtNum(after))}</td></tr>`
            : ''
        }</table>
        <div class="l-notes"><b>ملاحظة هامة :</b><br>في حالة تكرار المخالفة من الموظف يحق للإدارة أن تقوم باتخاذ الإجراءات القانونية التي تراها مناسبة في حقه.</div>`;
  }
  /* نموذج التوظيف (استمارة بيانات مرشح للتوظيف): معايير تقييم اللجنة الفنية وبنود العرض المالي */
  const HIRE_RATING = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف'];
  const HIRE_CRITERIA = [
    ['knowledge', 'المعرفة الفنية بالتخصص'],
    ['practical', 'الخبرة العملية'],
    ['communication', 'مهارات التواصل'],
    ['appearance', 'المظهر والانضباط'],
  ];
  const HIRE_PAY = [
    ['basic', 'الراتب الأساسي'],
    ['housing', 'بدل السكن'],
    ['transport', 'بدل النقل'],
    ['phone', 'بدل الاتصال'],
    ['food', 'بدل الإعاشة'],
    ['otherAllow', 'بدلات أخرى'],
  ];
  const HIRE_MODIFY = 'الموافقة على التعيين مع تعديل الراتب';
  const HIRE_TICKETS = [
    'لا يوجد',
    'تذكرة طيران في درجة اقتصادية ذهاب وإياب (في حالة السفر فقط)',
    'تذكرة طيران سنوية في درجة اقتصادية ذهاب وإياب',
  ];
  /* المزايا الإضافية في العرض الوظيفي */
  const hireBenefits = (s) =>
    [
      s.ticket && s.ticket !== 'لا يوجد' ? s.ticket : '',
      s.carriage === 'نعم' ? 'توفير مواصلات من وإلى مقر العمل' : '',
      s.lodging === 'نعم' ? 'توفير سكن مع العاملين بالشركة' : '',
      ...String(s.benefitsMore || '')
        .split(/\n/)
        .map((x) => x.trim()),
    ].filter(Boolean);
  /* الهيئات المهنية التي تشترطها بعض الوظائف (مهندسين، محاسبين، قانونيين...) */
  const HIRE_BODIES = [
    'الهيئة السعودية للمهندسين',
    'الهيئة السعودية للمراجعين والمحاسبين',
    'هيئة المحامين السعودية',
    'الهيئة السعودية للتخصصات الصحية',
    'أخرى',
  ];
  const hireTotal = (s) => HIRE_PAY.reduce((a, [k]) => a + (Number((s || {})[k]) || 0), 0);
  /* الراتب النهائي: كما اقترحه مدير قسم الرواتب، أو كما عدّله رئيس لجنة التوظيف (بنود f_) */
  function hireFinalPay(d) {
    const t = (d && d.tasks) || {},
      s = t.hireSalary || {},
      dc = t.hireDecision || {};
    if (dc.decision !== HIRE_MODIFY || !dc.f_basic) return s;
    return Object.fromEntries(HIRE_PAY.map(([k]) => [k, dc['f_' + k] || '']));
  }
  /* المتبقي في إقامة المرشح من تاريخ الطلب حتى تاريخ انتهائها */
  function iqamaLeft(d) {
    if (d.citizenship === 'سعودي' || !d.iqamaExpiry) return '';
    const from = d.date || new Date().toISOString().slice(0, 10);
    const n = daysBetween(from, d.iqamaExpiry);
    if (n === null) return '';
    if (n < 0) return `منتهية منذ ${-n} يوم`;
    return `${durationText(from, d.iqamaExpiry)} (${n} يوم)`;
  }
  function hireBody(d) {
    /* بيانات التعاقد يكتبها مرسل الطلب (والطلبات القديمة كتبتها شئون الموظفين في مرحلتها) */
    const t = d.tasks || {},
      h = t.hireHr || d,
      tc = t.hireTech || {},
      s = t.hireSalary || {},
      dc = t.hireDecision || {};
    const rows = (pairs) =>
      `<table class="lt">${pairs.map(([l, v]) => `<tr><td class="lbl">${esc(l)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>`;
    const total = hireTotal(s);
    return `<h4 class="l-sec">أولاً : البيانات الشخصية :</h4>
      ${infoTable([
        ['الإسم', d.name],
        ['الجنسية', d.citizenship === 'سعودي' ? 'سعودي' : d.nationality],
        ['رقم الهوية / الإقامة / الجواز', d.iqama],
        ...(d.citizenship === 'سعودي'
          ? []
          : [
              ['تاريخ انتهاء الإقامة', fmtDate(d.iqamaExpiry)],
              ['المتبقي في الإقامة', iqamaLeft(d)],
              ['المهنة في الإقامة', d.prof],
            ]),
        ['تاريخ الميلاد', fmtDate(d.birthDate)],
        ['الحالة الاجتماعية', d.marital],
        ['رقم الجوال', d.phone],
        ['البريد الإلكتروني', d.email],
        ['العنوان', d.city],
        ['الوظيفة المرشح لها', d.job],
        ['مكان التوظيف', d.branch],
      ])}
      <h4 class="l-sec">ثانياً : المؤهلات والخبرات :</h4>
      ${infoTable([
        ['المؤهل العلمي', d.qualification],
        ['تخصص المؤهل', d.major],
        ['الدراسات العليا', d.postgrad],
        ['تخصص الدراسات العليا', d.postgradMajor],
        ['العضوية المهنية', d.membership === 'أخرى' ? d.membershipOther : d.membership],
        ...(d.membership && d.membership !== 'لا يوجد'
          ? [
              ['رقم العضوية', d.membershipNo],
              ['تاريخ انتهاء العضوية', fmtDate(d.membershipExpiry)],
            ]
          : []),
        ['سنة التخرج', d.gradYear],
        ['سنوات الخبرة', d.experience],
        ['آخر جهة عمل', d.lastEmployer],
        ['داخل المملكة', d.inKingdom],
      ])}
      ${d.recruiterNote ? rows([['ملاحظات مسئول التوظيف', d.recruiterNote]]) : ''}
      <h4 class="l-sec">ثالثاً : بيانات التعاقد :</h4>
      ${infoTable([
        ['نوع التعاقد', h.contractType],
        ['مدة العقد', h.contractPeriod],
        ['فترة التجربة', h.probation],
        ['الكفالة / المنشأة', h.sponsorship],
      ])}
      ${h.hrNote ? rows([['ملاحظات شئون الموظفين', h.hrNote]]) : ''}
      <h4 class="l-sec">رابعاً : التقييم الفني (اللجنة الفنية) :</h4>
      <table class="lt grid sm"><thead><tr><th>المعيار</th>${HIRE_RATING.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>
      ${HIRE_CRITERIA.map(([k, l]) => `<tr><td>${esc(l)}</td>${HIRE_RATING.map((x) => `<td>${tc[k] === x ? '✔' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table>
      ${rows([
        ['تاريخ المقابلة', fmtDate(tc.interviewDate)],
        ['توصية اللجنة الفنية', tc.recommendation],
        ['رأي اللجنة الفنية', tc.techNote],
      ])}
      <h4 class="l-sec">خامساً : العرض المالي (مدير قسم الرواتب) :</h4>
      <table class="lt grid"><thead><tr>${HIRE_PAY.map(([, l]) => `<th>${l}</th>`).join('')}<th>الإجمالي</th></tr></thead>
      <tbody><tr>${HIRE_PAY.map(([k]) => `<td>${esc(fmtNum(s[k]))}</td>`).join('')}<td><b>${total ? esc(fmtNum(total)) : ''}</b></td></tr></tbody></table>
      ${rows([
        ['تاريخ المباشرة المتوقع', fmtDate(s.startDate)],
        ['مدة الإجازة السنوية', s.leave],
        ['التأمين الطبي', s.medical],
        ['التأمينات الاجتماعية', s.gosi],
        ['المزايا الإضافية', hireBenefits(s).join('\n')],
        ['رأي مدير قسم الرواتب', s.salaryNote],
      ])}
      <h4 class="l-sec">سادساً : قرار رئيس لجنة التوظيف :</h4>
      ${rows([
        ['القرار', dc.decision],
        ['ملاحظات', dc.decisionNote],
      ])}
      ${
        dc.decision === HIRE_MODIFY && dc.f_basic
          ? `<table class="lt grid"><thead><tr>${HIRE_PAY.map(([, l]) => `<th>${l} المعتمد</th>`).join('')}<th>الإجمالي المعتمد</th></tr></thead>
      <tbody><tr>${HIRE_PAY.map(([k]) => `<td>${esc(fmtNum(dc['f_' + k]))}</td>`).join('')}<td><b>${esc(fmtNum(hireTotal(hireFinalPay(d))))}</b></td></tr></tbody></table>`
          : ''
      }`;
  }
  /* العرض الوظيفي: يتولد تلقائياً من طلب التوظيف بعد اعتماده نهائياً (بنفس تصميم نموذج الشركة)
   * ctx: { serial, approvedAt, createdByName, createdBySig, orgName, verify } */
  function renderJobOffer(d, ctx) {
    ctx = ctx || {};
    const s = (d.tasks || {}).hireSalary || {},
      h = (d.tasks || {}).hireHr || d,
      pay = hireFinalPay(d);
    const qual =
      [d.qualification, d.major].filter(Boolean).join(' — ') +
      (d.postgrad && d.postgrad !== 'لا يوجد' ? ` / ${d.postgrad}${d.postgradMajor ? ` — ${d.postgradMajor}` : ''}` : '');
    const n = (v) => (Number(v) ? esc(fmtNum(v)) : '---');
    const allow = HIRE_PAY.slice(1).filter(([k]) => k !== 'otherAllow' || Number(pay[k]));
    const total = hireTotal(pay);
    const benefits = hireBenefits(s);
    const issued = !!ctx.approvedAt;
    const head = LETTERHEAD ? '<img class="l-head" src="header.png" alt="">' : '';
    return `<div class="letter clearance offer${head ? ' has-head' : ''}">${head}
      <div class="l-top"><div>تاريخ إنشاء العرض : <span class="red">${esc(fmtDate(ctx.approvedAt)) || '....../....../..........'}</span></div>${ctx.serial ? `<div>رقم العرض : <bdi dir="ltr" class="red">${esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">عرض وظيفي</div>
      <table class="lt grid"><thead><tr><th style="width:32%">الاسم</th><th>رقم هوية / جواز سفر</th><th>الجنسية</th><th>المؤهل</th>${d.citizenship === 'سعودي' ? '' : '<th>المهنة في الإقامة</th>'}</tr></thead>
        <tbody><tr><td class="red">${esc(d.name)}</td><td class="red">${esc(d.iqama)}</td><td class="red">${esc(d.citizenship === 'سعودي' ? 'سعودي' : d.nationality)}</td><td class="red">${esc(qual)}</td>${d.citizenship === 'سعودي' ? '' : `<td class="red">${esc(d.prof)}</td>`}</tr></tbody></table>
      <p class="l-greet" style="text-align:center">تحية طيبة وبعد ,,,</p>
      <p class="l-para" style="text-align:center">يسعدنا أن نتقدم لك بفرصة عمل في ${esc(ctx.orgName || 'الشركة')} وفقاً للشروط والأحكام التالية :</p>
      <table class="lt grid sm offer-t"><thead>
        <tr><th rowspan="2">المسمى الوظيفي</th><th colspan="${allow.length + 2}">تفاصيل الراتب</th><th colspan="3">تفاصيل العقد</th><th rowspan="2">مدة الإجازة</th><th rowspan="2">التأمين الطبي</th><th rowspan="2">التأمينات الاجتماعية</th><th rowspan="2">فرع العمل</th></tr>
        <tr><th>أساسي</th>${allow.map(([, l]) => `<th>${l}</th>`).join('')}<th>الإجمالي</th><th>فترة التجربة</th><th>مدة العقد</th><th>نوع العقد</th></tr></thead>
        <tbody><tr><td class="red">${esc(d.job)}</td><td class="red">${n(pay.basic)}</td>${allow.map(([k]) => `<td class="red">${n(pay[k])}</td>`).join('')}<td class="red"><b>${n(total)}</b></td>
        <td class="red">${esc(h.probation || '---')}</td><td class="red">${esc(h.contractPeriod || '---')}</td><td class="red">${esc(h.contractType || '---')}</td>
        <td class="red">${esc(s.leave || '---')}</td><td class="red">${esc(s.medical || '---')}</td><td class="red">${esc(s.gosi || '---')}</td><td class="red">${esc(d.branch)}</td></tr></tbody></table>
      ${total ? `<p class="l-para" style="margin:4px 0 0">إجمالي الراتب الشهري : <b>${esc(fmtNum(total))}</b> ريال (${esc(tafqeet(total))})</p>` : ''}
      ${benefits.length ? `<h4 class="l-sec">• المزايا الإضافية :</h4><ol class="offer-l">${benefits.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
      <h4 class="l-sec">• ملاحظات :</h4>
      <ol class="offer-l"><li>العرض الوظيفي المشروط هذا غير ملزم لأي من الطرفين، بناءً على العقد الموقّع سيلتزم الطرفان بأحكامه.</li>
        <li>صلاحية العرض الوظيفي هذا 30 يوم عمل من تاريخ صدوره.</li></ol>
      <div class="offer-sign">
        <div><div>توقيع المرشح</div><div class="l-sig-line">...........................</div>
          <div style="margin-top:10px">تاريخ مباشرة الموظف</div><div class="red"><b>${esc(fmtDate(s.startDate)) || '....../....../..........'}</b></div></div>
        <div><div>إدارة الموارد البشرية</div>${issued && ctx.createdBySig ? `<img class="l-sig-img" src="/api/signatures/${encodeURIComponent(ctx.createdBySig)}" alt="توقيع ${esc(ctx.createdByName)}">` : ''}${issued ? `<div class="stamp ok">صادر إلكترونياً<br>${esc(ctx.createdByName || '')}<br><small>${esc(fmtDate(ctx.approvedAt))}</small></div>` : '<div class="l-sig-line">...........................</div>'}</div>
      </div>
      ${ctx.verify ? `<div class="c-foot"><div class="c-link">مرتبط باستمارة بيانات مرشح للتوظيف رقم <bdi dir="ltr">${esc(ctx.serial || '')}</bdi> المعتمدة نهائياً</div><div class="c-qr"><img src="/qr/${esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق</small></div></div>` : ''}
    </div>`;
  }
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
  const EXT_WORKSHOP = 'ورشة خارجية';
  const sumOf = (o, keys) => keys.reduce((a, k) => a + (Number((o || {})[k]) || 0), 0);
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
  /* قسم السداد في الخطاب (من forms-traffic.js، مشترك مع طلب صيانة المركبة) */
  const payPart = (title, p) => FORM_PARTS.find((x) => x.payPart).payPart({ infoTable, esc, fmtDate, fmtNum }, title, p);
  const TASKS = {
    /* دورة خصم الشئون القانونية: محاسب فرع الموظف ← مدير قسم الرواتب وحماية الأجور ← محاسب إدارة الرواتب */
    legalReview: {
      label: 'مراجعة محاسب الفرع ورفعه لمدير قسم الرواتب',
      step: 'محاسب الفرع',
      button: '↗ رفع لمدير قسم الرواتب وحماية الأجور',
      fields: [{ key: 'accNote', label: 'ملاحظات محاسب الفرع', type: 'textarea' }],
    },
    applyMethod: {
      label: 'طريقة تطبيق الخصم',
      step: 'مدير قسم الرواتب وحماية الأجور',
      button: '✔ اعتماد وتحويل لمحاسب إدارة الرواتب',
      fields: [
        { key: 'method', label: 'طريقة التطبيق', type: 'select', options: ['دفعة واحدة', 'على أقساط شهرية'], required: true },
        { key: 'installments', label: 'عدد الأقساط (عند التقسيط)', type: 'number' },
        { key: 'startMonth', label: 'يبدأ الخصم من راتب شهر', required: true, hint: 'مثال: نوفمبر 2026' },
        { key: 'methodNote', label: 'تعليمات التطبيق', type: 'textarea' },
      ],
    },
    payrollApply: {
      label: 'تحديد قيمة الخصم وإنزاله في الرواتب',
      step: 'محاسب إدارة الرواتب',
      button: '✔ تم إنزال الخصم في الرواتب',
      fields: [
        { key: 'value', label: 'قيمة الخصم (ريال)', type: 'number', required: true },
        { key: 'payMonth', label: 'أُنزل في رواتب شهر', required: true },
        { key: 'payNote', label: 'ملاحظات', type: 'textarea' },
      ],
    },
    deductions: {
      label: 'الخصومات والعهد ومحضر تسليم السيارة',
      step: 'محاسب الفرع',
      fields: [
        /* اختيار صريح: يوجد / لا يوجد (لا يُترك الجدول فارغاً دون تأكيد) */
        { key: 'hasDed', label: 'هل على الموظف سلف أو خصومات؟', type: 'select', options: ['يوجد', 'لا يوجد'], required: true },
        {
          key: 'deductions',
          label: 'خصومات الموظف',
          type: 'table',
          showIf: ['hasDed', 'يوجد'],
          columns: [
            { key: 'type', label: 'نوع الخصم', type: 'select', options: CASE_DED },
            { key: 'details', label: 'البيان' },
            { key: 'amount', label: 'القيمة', type: 'number' },
          ],
        },
        /* "نعم": يُعد محضر تسليم وتسلم مركبة مرتبطاً بالملف، والسيارة لا تُضاف للعهد (تظهر في التصفية من المحضر بعد اعتماده) */
        { key: 'hasCar', label: 'الموظف مستلم سيارة؟', type: 'select', options: ['لا', 'نعم'], required: true },
        /* رقم محضر تسليم وتسلم السيارة المسجل على النظام: منه نوع السيارة واسم المستلم في العهد العينية */
        {
          key: 'carRecNo',
          label: 'رقم محضر التسليم',
          showIf: ['hasCar', 'نعم'],
          hint: 'رقم محضر تسليم وتسلم السيارة على النظام، مثال: SADEN-2026-0091 أو 91',
        },
        { key: 'hasAssets', label: 'هل مع الموظف عهد عينية؟', type: 'select', options: ['يوجد', 'لا يوجد'], required: true },
        {
          key: 'assets',
          label: 'العهد العينية',
          type: 'table',
          showIf: ['hasAssets', 'يوجد'],
          columns: [
            { key: 'type', label: 'العهدة', type: 'select', options: CASE_ASSETS },
            { key: 'spec', label: 'المواصفات' },
            { key: 'receiver', label: 'تم تسليمها إلى' },
          ],
        },
      ],
    },
    forward: { label: 'توجيه الملف لمحاسب إدارة الرواتب', step: 'محاسب الفرع', fields: [] },
    vehSign: { label: 'توقيع المحضر من المسلِّم والمستلم ورفعه', step: 'محاسب الفرع', button: '↗ إرسال لإدارة الحركة', fields: [] },
    hr: {
      label: 'بيانات الموظف من شئون الموظفين',
      step: 'شئون الموظفين',
      button: '↗ توجيه لمحاسب إدارة الرواتب',
      fields: [
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date', required: true, fromEmp: true },
        { key: 'startWork', label: 'تاريخ بداية العمل أو تاريخ العودة من الإجازة', type: 'date', required: true, fromEmp: true },
        { key: 'lastDay', label: 'تاريخ آخر دوام', type: 'date', required: true, fromEmp: true },
        { key: 'workDays', label: 'عدد أيام العمل (يُحسب تلقائياً)', type: 'number', readonly: true },
        { key: 'paidLeave', label: 'عدد أيام الإجازة المدفوعة (رصيد الإجازات)', type: 'number', fromEmp: true },
        /* مدة الإجازة لتصفية الإجازة فقط؛ وفي التصفية النهائية يُكتب قصادها في البرنامج "تصفية نهائية" */
        {
          key: 'leaveDuration',
          label: 'مدة الإجازة (بالأيام)',
          type: 'number',
          leaveOnly: true,
          required: true,
          hint: 'إدخال يدوي، ولا تقل عن عدد أيام الإجازة المدفوعة (رصيد الإجازات)',
        },
        {
          key: 'sponsorship',
          label: 'الكفالة (اسم الشركة / المؤسسة الكافلة)',
          required: true,
          hint: 'يُكتب كما هو في التصفية والمخالصة: "استلمت من شركة / مؤسسة ..."',
        },
        { key: 'nationality', label: 'الجنسية', fromEmp: true },
        /* يظهر ويُطلب في التصفية النهائية فقط */
        { key: 'endReason', label: 'سبب انتهاء العلاقة التعاقدية', type: 'textarea', required: true, finalOnly: true, full: true },
      ],
    },
    /* الحركة تراجع المحضر الذي أعده المحاسب (ويمكنها تصحيحه) وتعتمده */
    traffic: {
      label: 'اعتماد محضر تسليم وتسلم السيارة',
      step: 'إدارة الحركة',
      fields: [...CAR_FIELDS, { key: 'receiver', label: 'المستلم من إدارة الحركة', required: true }],
    },
    settlement: { label: 'مراجعة وإعداد التصفية', step: 'محاسب إدارة الرواتب' },
    /* إدارة الحركة تعتمد محضر تسليم السيارة المرفوع مع طلب التصفية */
    carApprove: {
      label: 'اعتماد محضر تسليم وتسلم السيارة',
      step: 'إدارة الحركة',
      button: '✔ اعتماد المحضر وتحويل لشئون الموظفين',
      fields: [],
    },
    /* دورة نموذج التوظيف: مسئول التوظيف يرسله ← شئون الموظفين ← اللجنة الفنية ← مدير قسم الرواتب ← رئيس لجنة التوظيف */
    hireHr: {
      label: 'مراجعة شئون الموظفين ورفع الطلب',
      step: 'مسئول شئون الموظفين',
      button: '↗ رفع للجنة الفنية',
      fields: [
        {
          key: 'contractType',
          label: 'نوع التعاقد',
          type: 'select',
          options: ['دوام كامل', 'دوام جزئي', 'عقد مؤقت', 'تدريب'],
          required: true,
        },
        { key: 'contractPeriod', label: 'مدة العقد', hint: 'مثال: سنتان' },
        { key: 'probation', label: 'فترة التجربة', type: 'select', options: ['90 يوماً', '180 يوماً', 'بدون'] },
        { key: 'sponsorship', label: 'الكفالة / المنشأة' },
        { key: 'hrNote', label: 'ملاحظات شئون الموظفين', type: 'textarea' },
      ],
    },
    /* طلب صيانة مركبة: محاسب الورش يشخّص ويقدّر (عرض السعر)، ومحاسب الفرع يسدد، والورشة تنفّذ (sum: إجمالي يُحسب تلقائياً من البنود) */
    mDiag: {
      label: 'التشخيص وعرض السعر',
      step: 'محاسب الورش',
      button: '↗ إرسال عرض السعر لمدير الفرع',
      sum: ['estTotal', ['parts', 'labor']],
      fields: [
        { key: 'faults', label: 'التشخيص والأعطال الفعلية', type: 'textarea', required: true },
        { key: 'parts', label: 'تكلفة قطع الغيار (تقديرية)', type: 'number' },
        { key: 'labor', label: 'أجرة اليد (تقديرية)', type: 'number' },
        { key: 'estTotal', label: 'الإجمالي التقديري (يُحسب تلقائياً)', type: 'number', readonly: true },
        { key: 'days', label: 'مدة التنفيذ المتوقعة', required: true, hint: 'مثال: 3 أيام' },
        { key: 'diagNote', label: 'ملاحظات الورشة', type: 'textarea' },
      ],
    },
    mPay: { ...PAY_TASK, label: 'سداد تكلفة الصيانة', button: '✔ تم السداد — إرسال للورشة للتنفيذ' },
    mDone: {
      label: 'تنفيذ الصيانة والتكلفة الفعلية',
      step: 'الورشة',
      button: '✔ تم التنفيذ وإغلاق الطلب',
      sum: ['aTotal', ['aParts', 'aLabor']],
      fields: [
        { key: 'doneDate', label: 'تاريخ التنفيذ', type: 'date', required: true },
        { key: 'aParts', label: 'تكلفة قطع الغيار (فعلية)', type: 'number' },
        { key: 'aLabor', label: 'أجرة اليد (فعلية)', type: 'number' },
        { key: 'aTotal', label: 'الإجمالي الفعلي (يُحسب تلقائياً)', type: 'number', readonly: true },
        { key: 'invoiceNo', label: 'رقم الفاتورة / أمر العمل' },
        { key: 'kmOut', label: 'قراءة العداد عند التسليم', type: 'number' },
        { key: 'doneNote', label: 'ملاحظات التنفيذ', type: 'textarea' },
      ],
    },
    /* طلب استعارة جهاز نوعي: مسئول الجرد يسجّل تسليم الجهاز للفرع ويعتمد */
    /* طلب صيانة جهاز: مسئول الجرد يعتمد ويحوّل، ومسئول الصيانة يحدد العطل والإجراء ويقفل الطلب بعد المراسلات */
    dmForward: {
      label: 'مراجعة الطلب وتحويله لمسئول الصيانة',
      step: 'مسئول الجرد',
      button: '↗ اعتماد وتحويل لمسئول الصيانة',
      fields: [{ key: 'fwdNote', label: 'ملاحظات مسئول الجرد لمسئول الصيانة', type: 'textarea' }],
    },
    dmClose: {
      label: 'العطل والإجراء وإقفال الطلب',
      step: 'مسئول الصيانة',
      button: '✔ إقفال طلب الصيانة',
      fields: [
        { key: 'diagnosis', label: 'العطل (التشخيص)', type: 'textarea', required: true },
        { key: 'remedy', label: 'الإجراء المتخذ', type: 'textarea', required: true },
        {
          key: 'result',
          label: 'نتيجة الصيانة',
          type: 'select',
          options: ['تم الإصلاح', 'تم الإصلاح جزئياً', 'يحتاج استبدال', 'غير قابل للإصلاح'],
          required: true,
          hint: 'تم الإصلاح ← حالة الجهاز في الجرد "يعمل"، وغير قابل للإصلاح ← "تالف"',
        },
        { key: 'cost', label: 'التكلفة (ريال)', type: 'number' },
        { key: 'closeDate', label: 'تاريخ الإقفال', type: 'date', required: true },
      ],
    },
    /* طلبات شئون الموظفين (تجديد إقامة، خروج وعودة، نقل كفالة): شئون الموظفين تسجّل التنفيذ وتعتمد */
    iqRenewDone: {
      label: 'تنفيذ تجديد الإقامة',
      step: 'شئون الموظفين',
      button: '✔ تم التجديد واعتماد الطلب',
      fields: [
        {
          key: 'newIqamaEnd',
          label: 'تاريخ انتهاء الإقامة الجديد',
          type: 'date',
          required: true,
          hint: 'يُسجَّل في ملف الموظف بسجل الموظفين',
        },
        { key: 'renewCost', label: 'تكلفة التجديد (ريال)', type: 'number' },
        { key: 'doneNote', label: 'ملاحظات شئون الموظفين', type: 'textarea' },
      ],
    },
    exitDone: {
      label: 'إصدار التأشيرة',
      step: 'شئون الموظفين',
      button: '✔ تم الإصدار واعتماد الطلب',
      fields: [
        { key: 'visaNo', label: 'رقم التأشيرة' },
        { key: 'visaEnd', label: 'تاريخ انتهاء التأشيرة', type: 'date', required: true },
        { key: 'doneNote', label: 'ملاحظات شئون الموظفين', type: 'textarea' },
      ],
    },
    sponsorDone: {
      label: 'تنفيذ نقل الكفالة',
      step: 'شئون الموظفين',
      button: '✔ تم نقل الكفالة واعتماد الطلب',
      fields: [
        { key: 'doneDate', label: 'تاريخ نقل الكفالة', type: 'date', required: true, hint: 'الكفالة الجديدة تُسجَّل في ملف الموظف' },
        { key: 'doneNote', label: 'ملاحظات شئون الموظفين', type: 'textarea' },
      ],
    },
    /* طلب تصنيع: مسئول الورشة يقبل الطلب ويحدد موعد التسليم والتكلفة التقديرية */
    mfgAccept: {
      label: 'قبول طلب التصنيع',
      step: 'الورشة',
      button: '✔ قبول الطلب واعتماده',
      fields: [
        { key: 'expectedDate', label: 'موعد التسليم المتوقع', type: 'date', required: true },
        { key: 'estCost', label: 'التكلفة التقديرية (ريال)', type: 'number' },
        { key: 'mfgNote', label: 'ملاحظات الورشة', type: 'textarea' },
      ],
    },
    /* دورة التصنيع: عرض سعر الورشة (خامات + مصنوعية)، ثم إنهاء التصنيع وترحيل المنتج للمخزن */
    mfgQuote: {
      label: 'تقدير التكلفة وعرض السعر',
      step: 'محاسب الورش',
      button: '↗ إرسال عرض السعر لمدير الفرع',
      fields: [
        { key: 'expectedDate', label: 'موعد التسليم المتوقع بعد الموافقة', type: 'date', required: true },
        { key: 'quoteNote', label: 'ملاحظات للمعتمدين', type: 'textarea' },
      ],
    },
    mfgPay: { ...PAY_TASK, label: 'اعتماد ودفع تكلفة التصنيع', button: '✔ تم الاعتماد والدفع — إرسال للتنفيذ' },
    mfgDone: {
      label: 'إنهاء التصنيع',
      step: 'محاسب الورش',
      button: '✔ تم التصنيع — ترحيل المنتج للمخزن',
      fields: [
        {
          key: 'doneDate',
          label: 'تاريخ الانتهاء من التصنيع',
          type: 'date',
          required: true,
          hint: 'تُرحَّل الكميات لمخزن الورشة، ويُنشأ إذن صرف للفرع بانتظار مسئول الورشة ومدير العمليات',
        },
        { key: 'doneNote', label: 'ملاحظات التصنيع', type: 'textarea' },
      ],
    },
    /* إذن الصرف: مراجعة الكميات قبل الاعتماد (يمكن تقليلها أو زيادتها في حدود الرصيد) */
    issueEdit: {
      label: 'مراجعة الكميات المصروفة',
      step: 'الورشة',
      button: '✔ اعتماد الكميات',
      fields: [
        {
          key: 'items',
          label: 'الأصناف والكميات المصروفة',
          type: 'table',
          required: true,
          hint: 'عدّل الكمية إذا لزم، وتُخصم من المخزن بعد الاعتماد الأخير',
          columns: [
            { key: 'product', label: 'المنتج' },
            { key: 'qty', label: 'الكمية', type: 'number' },
            { key: 'price', label: 'سعر الوحدة (ريال)', type: 'number' },
          ],
        },
        { key: 'editNote', label: 'سبب تعديل الكمية (إن وُجد)', type: 'textarea' },
      ],
    },
    loanIssue: {
      label: 'تسليم الجهاز للفرع',
      step: 'مسئول الجرد',
      button: '✔ اعتماد الاستعارة وتسليم الجهاز',
      fields: [
        { key: 'deliveryDate', label: 'تاريخ تسليم الجهاز للفرع', type: 'date', required: true },
        { key: 'returnDue', label: 'تاريخ الإرجاع المعتمد', type: 'date', required: true, hint: 'افتراضياً نهاية الفترة المطلوبة' },
        { key: 'condition', label: 'حالة الجهاز عند التسليم' },
        { key: 'issueNote', label: 'ملاحظات مسئول الجرد', type: 'textarea' },
      ],
    },
    hireTech: {
      label: 'التقييم الفني (اللجنة الفنية)',
      step: 'مسئول اللجنة الفنية',
      button: '↗ رفع لمدير قسم الرواتب',
      fields: [
        { key: 'interviewDate', label: 'تاريخ المقابلة', type: 'date', required: true },
        ...HIRE_CRITERIA.map(([key, label]) => ({ key, label, type: 'select', options: HIRE_RATING, required: true })),
        {
          key: 'recommendation',
          label: 'توصية اللجنة الفنية',
          type: 'select',
          options: ['يُوصى بالتعيين', 'يُوصى بالتعيين بشروط', 'لا يُوصى بالتعيين'],
          required: true,
        },
        { key: 'techNote', label: 'رأي اللجنة الفنية', type: 'textarea' },
      ],
    },
    hireSalary: {
      label: 'العرض المالي',
      step: 'مدير قسم الرواتب وحماية الأجور',
      button: '↗ رفع لرئيس لجنة التوظيف',
      fields: [
        ...HIRE_PAY.map(([key, label]) => ({ key, label, type: 'number', required: key === 'basic' })),
        { key: 'total', label: 'إجمالي الراتب (يُحسب تلقائياً)', type: 'number', readonly: true },
        { key: 'startDate', label: 'تاريخ المباشرة المتوقع', type: 'date', required: true },
        /* تظهر في العرض الوظيفي الذي يتولد بعد الاعتماد النهائي */
        { key: 'leave', label: 'مدة الإجازة السنوية', default: '21 يوماً سنوياً', required: true },
        { key: 'medical', label: 'التأمين الطبي', type: 'select', options: ['يوجد', 'لا يوجد'], default: 'يوجد', required: true },
        {
          key: 'gosi',
          label: 'التأمينات الاجتماعية',
          type: 'select',
          options: ['طبقاً للائحة التأمينات', 'لا يوجد'],
          default: 'طبقاً للائحة التأمينات',
          required: true,
        },
        { key: 'ticket', label: 'تذكرة الطيران', type: 'select', options: HIRE_TICKETS, default: HIRE_TICKETS[1] },
        { key: 'carriage', label: 'توفير مواصلات من وإلى مقر العمل', type: 'select', options: ['نعم', 'لا'], default: 'نعم' },
        { key: 'lodging', label: 'توفير سكن مع العاملين بالشركة', type: 'select', options: ['نعم', 'لا'], default: 'نعم' },
        { key: 'benefitsMore', label: 'مزايا إضافية أخرى', type: 'textarea', hint: 'كل ميزة في سطر — تظهر في العرض الوظيفي' },
        { key: 'salaryNote', label: 'رأي مدير قسم الرواتب', type: 'textarea' },
      ],
    },
    hireDecision: {
      label: 'قرار رئيس لجنة التوظيف',
      step: 'رئيس لجنة التوظيف',
      button: '✔ اعتماد التعيين نهائياً',
      fields: [
        {
          key: 'decision',
          label: 'القرار',
          type: 'select',
          options: ['الموافقة على التعيين بالعرض المالي المقترح', HIRE_MODIFY],
          required: true,
        },
        /* عند تعديل الراتب: البنود المعتمدة (تظهر في العرض الوظيفي) */
        ...HIRE_PAY.map(([k, l]) => ({
          key: 'f_' + k,
          label: `${l} المعتمد`,
          type: 'number',
          required: k === 'basic',
          showIf: ['decision', HIRE_MODIFY],
        })),
        { key: 'decisionNote', label: 'ملاحظات رئيس لجنة التوظيف', type: 'textarea' },
      ],
    },
  };
  const taskRows = (t, data) =>
    TASKS[t].fields
      .filter((f) => f.type !== 'marks' && (!f.finalOnly || data[f.key]))
      .map((f) => [esc(f.label), f.type === 'date' ? fmtDate(data[f.key]) : f.type === 'number' ? fmtNum(data[f.key]) : data[f.key] || '']);
  /* السيارة في التصفية: فئتها ونوعها ولوحتها كما في محضر التسليم */
  const carSpec = (c) => [[c.vType, c.model].filter(Boolean).join(' '), c.plate ? `لوحة ${c.plate}` : ''].filter(Boolean).join(' — ');
  /* المرفقات الإلزامية للطلب: الثابتة + المشروطة باختيار في بياناته */
  /* السلف: اختيار «توقيع» (ورقي) يُلزم برفع طلب السلفة موقّعاً من الموظف */
  const ADV_SIGNED = 'طلب السلفة موقّعاً من الموظف';
  const requiredAttachmentsOf = (form, d) => [
    ...((form || {}).requiredAttachments || []),
    ...((form || {}).requiredIf || []).filter(([, k, v]) => String((d || {})[k] || '') === v).map(([l]) => l),
    ...((form || {}).empSign && (d || {}).empSigMode === 'manual' ? [ADV_SIGNED] : []),
  ];
  function caseTables(d) {
    const tr = (d.tasks || {}).traffic || {};
    const carRow =
      d.hasCar !== 'نعم'
        ? []
        : tr.receiver
          ? [{ type: 'سيارة', spec: carSpec(tr), receiver: tr.receiver }]
          : [{ type: 'سيارة', spec: 'حسب محضر التسليم والتسلم المعتمد من إدارة الحركة (مرفق)', receiver: 'إدارة الحركة' }];
    const ded = d.deductions || [],
      as = [...carRow, ...(d.assets || []).filter((x) => !(carRow.length && x.type === 'سيارة'))];
    const total = ded.reduce((s2, r) => s2 + (Number(r.amount) || 0), 0);
    return `<h4 class="l-sec">خصومات الموظف :</h4>
      <table class="lt grid"><thead><tr><th>نوع الخصم</th><th>البيان</th><th>القيمة</th></tr></thead><tbody>
      ${ded.map((r) => `<tr><td>${esc(r.type)}</td><td>${esc(r.details || '-')}</td><td class="red">${esc(fmtNum(r.amount))}</td></tr>`).join('') || '<tr><td colspan="3">لا يوجد</td></tr>'}
      <tr class="total"><td colspan="2">إجمالي الخصومات</td><td class="red">${esc(fmtNum(total))}</td></tr></tbody></table>
      <h4 class="l-sec">العهد العينية :</h4>
      <table class="lt grid"><thead><tr><th>العهدة</th><th>المواصفات</th><th>تم تسليمها إلى</th></tr></thead><tbody>
      ${as.map((r) => `<tr><td>${esc(r.type)}</td><td>${esc(r.spec || '-')}</td><td>${esc(r.receiver || 'لم تُسلَّم')}</td></tr>`).join('') || '<tr><td colspan="3">لا يوجد</td></tr>'}</tbody></table>`;
  }
  /* ملف التصفية قبل أن يعدّها محاسب حماية الأجور */
  function caseSummary(d) {
    const t = d.tasks || {};
    /* الخصومات والعهد تُسجَّل مع الطلب في الدورة الجديدة */
    const isDone = (k) => !!t[k] || (k === 'deductions' && !!d.hasDed);
    const stage = (k, label) => `<span class="case-st ${isDone(k) ? 'done' : ''}">${isDone(k) ? '✔' : '○'} ${label}</span>`;
    const carRow = d.hasCar ? [['مستلم سيارة', d.hasCar]] : [];
    return `<p class="l-para">ملف ( ${val(d.kind)} ) للموظف الآتي بياناته، قيد التجهيز :</p>
      ${infoTable([['الإسم', d.name], ['رقم الإقامة', d.iqama], ['الوظيفة', d.job], ['الفرع', d.branch], ['تاريخ آخر دوام', fmtDate(((d.tasks || {}).hr || {}).lastDay || d.lastDay)], ...carRow])}
      <div class="case-stages">${stage('deductions', 'الخصومات والعهد')}${t.traffic && !t.traffic.fromNo ? stage('traffic', 'اعتماد محضر السيارة') : ''}${stage('hr', 'بيانات شئون الموظفين')}<span class="case-st">○ إعداد التصفية</span></div>
      ${caseTables(d)}
      ${t.hr ? `<h4 class="l-sec">بيانات شئون الموظفين :</h4>${infoTable(taskRows('hr', t.hr))}` : ''}
      ${t.traffic ? `<h4 class="l-sec">تسليم السيارة لإدارة الحركة :</h4>${t.traffic.linked ? infoTable([['محضر تسليم وتسلم السيارة', `${t.traffic.serial || ''} — معتمد من إدارة الحركة`]]) : infoTable(taskRows('traffic', t.traffic))}` : ''}`;
  }
  /* ملاحق ملف التصفية للطباعة: بيان الخصومات والعهد، وبيانات شئون الموظفين، ونموذج تسليم السيارة */
  /* المحضر الورقي: يطبعه المحاسب ويوقعه المسلِّم والمستلم ثم يرفعه مرفقاً لإدارة الحركة */
  const CAR_PAPER = 'محضر تسليم وتسلم السيارة الموقّع';
  /* محضر تسليم وتسلم المركبة: صورته بعد توقيع المسلِّم والمستلم (شرط لإرساله لإدارة الحركة) */
  const VEH_PAPER = 'المحضر الموقّع من المسلِّم والمستلم';
  const CLEAR_PAPER = 'المخالصة الموقّعة والمبصومة من الموظف';
  /* مستند يوقّعه صاحبه ورقياً بعد الاعتماد النهائي ويغلق الملف (paper، ومعه proof إن وُجد وكلاهما إلزامي): المخالصة وإثبات صرف المستحقات (التصفية) والعرض الوظيفي (التوظيف) */
  const CLOSE_DOCS = {
    clearance: {
      paper: CLEAR_PAPER,
      proof: 'إثبات صرف المستحقات (حوالة / سند صرف)',
      doc: 'المخالصة',
      waiting: 'معتمد — بانتظار المخالصة الموقّعة وإثبات صرف المستحقات',
      closed: 'مغلق — المخالصة وإثبات الصرف مستلمان',
      notify: 'اعتُمدت التصفية نهائياً: اطبع المخالصة ووقّعها من الموظف، وارفعها مع إثبات صرف مستحقاته (حوالة أو سند صرف)',
      closeNote: 'رُفعت المخالصة الموقّعة وإثبات صرف المستحقات وأُغلق الملف',
      box: 'اعتُمدت التصفية نهائياً. ١) اطبع المخالصة &nbsp; ٢) يوقّع الموظف ويبصم عليها &nbsp; ٣) ارفعها هنا مع <b>إثبات حصول الموظف على مستحقاته</b> (حوالة بنكية أو سند صرف). لا يُغلق الملف إلا بعد رفع المستندين.',
      title: 'المخالصة الموقّعة وإثبات الصرف',
      pick: 'اختر صورة المخالصة الموقّعة والمبصومة',
    },
    offer: {
      paper: 'العرض الوظيفي الموقّع من المرشح',
      doc: 'العرض الوظيفي',
      waiting: 'معتمد — بانتظار العرض الموقّع من المرشح',
      closed: 'مغلق — العرض الموقّع مستلم',
      notify: 'اعتُمد طلب التوظيف نهائياً: اطبع العرض الوظيفي ووقّعه من المرشح وارفعه',
      closeNote: 'رُفع العرض الوظيفي الموقّع من المرشح وأُغلق الملف',
      box: 'اعتُمد طلب التوظيف نهائياً. ١) اطبع العرض الوظيفي &nbsp; ٢) يوقّع المرشح عليه &nbsp; ٣) ارفع صورته أو PDF هنا، فيُغلق الملف.',
      title: 'العرض الوظيفي الموقّع من المرشح',
      pick: 'اختر صورة العرض الوظيفي الموقّع من المرشح',
    },
  };
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
  const closeDoc = (type) => CLOSE_DOCS[(byId[type] || {}).companion] || null;
  /* محضر تسليم السيارة في ملف التصفية (الموظف يسلّم السيارة للشركة)، بنفس تصميم ودورة "محضر تسليم وتسلم مركبة":
   * يطبعه المحاسب ويوقعه المسلِّم والمستلم ← يرفعه موقّعاً فيصبح "تعميد محضر..." ← تعتمده إدارة الحركة.
   * ctx: { serial, paperSigned, acc: اعتماد المحاسب, traffic: اعتماد الحركة } */
  function renderCarRecord(d, ctx) {
    ctx = ctx || {};
    const c = (d.tasks || {}).traffic || {};
    const eq = c.vType === 'معدة';
    const what = eq ? 'معدة' : `سيارة${c.vType ? ` ( ${c.vType} )` : ''}`;
    const stamp = (a) =>
      `${a.sig ? `<img class="l-sig-img" src="/api/signatures/${encodeURIComponent(a.sig)}" alt="توقيع ${esc(a.name)}">` : ''}<div class="stamp ok">معتمد إلكترونياً<br>${esc(a.name)}<br><small>${esc(fmtDate(a.at))}</small></div>`;
    const line = '<div class="l-sig-line">...........................</div>';
    const signed = '<div class="stamp ok">موقّع<br><small>في المحضر المرفوع</small></div>';
    const sigs = [
      ['المسلِّم (الموظف)', ctx.paperSigned ? signed : line],
      ['المستلم', ctx.paperSigned ? signed : line],
      ...(ctx.paperSigned
        ? [
            ['محاسب الفرع', ctx.acc ? stamp(ctx.acc) : line],
            ['إدارة الحركة', ctx.traffic ? stamp(ctx.traffic) : line],
          ]
        : []),
    ];
    const fix = (t) => (eq ? t.replace(/المركبة/g, 'المعدة') : t);
    const head = LETTERHEAD ? '<img class="l-head" src="header.png" alt="">' : '';
    return `<div class="letter appendix${head ? ' has-head' : ''}">${head}
      <div class="l-top"><div>التاريخ : <span class="red">${esc(fmtDate(c.date || d.date))}</span></div>${ctx.serial ? `<div>ملف التصفية رقم : <bdi dir="ltr" class="red">${esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">${ctx.paperSigned ? 'تعميد ' : ''}محضر تسليم وإستلام ${what} فرع ${esc(d.branch || '..........')}</div>
      <table class="lt veh-t">
        <tr><th colspan="4">بيانات ${eq ? 'المعدة' : 'المركبة'} و تاريخ التسليم</th></tr>
        <tr><td class="lbl">${eq ? 'نوع المعدة' : 'نوع السيارة'}</td><td>${esc(c.model)}</td><td class="lbl">${eq ? 'رقم المعدة' : 'رقم اللوحة'}</td><td>${esc(c.plate)}</td></tr>
        <tr><td class="lbl">سنة الصنع</td><td>${esc(c.year)}</td><td class="lbl">تاريخ التسليم</td><td>${esc(fmtDate(c.date))}</td></tr>
        <tr><td class="lbl">قراءة العداد</td><td>${esc(c.odometer ? fmtNum(c.odometer) : '')}</td><td class="lbl">الحالة عند التسليم</td><td>${esc(c.condition)}</td></tr>
        ${c.damages ? `<tr><td class="lbl">مبلغ على الموظف</td><td colspan="3">${esc(fmtNum(c.damages))} ريال (تلفيات / مخالفات)</td></tr>` : ''}
        <tr><th colspan="4">بيانات المسلِّم (الموظف)</th></tr>
        <tr><td class="lbl">الإسم</td><td>${esc(d.name)}</td><td class="lbl">رقم الهوية / الإقامة</td><td>${esc(d.iqama)}</td></tr>
        <tr><td class="lbl">الوظيفة</td><td>${esc(d.job)}</td><td class="lbl">الفرع</td><td>${esc(d.branch)}</td></tr>
        <tr><th colspan="4">بيانات المستلم</th></tr>
        <tr><td class="lbl">الإسم</td><td colspan="3">${esc(c.receiver)}</td></tr></table>
      ${vehDiagram(c.vType, c.marks, c.carNotes)}
      <p class="l-para veh-ack">${fix('أقر أنا المسلِّم (الموظف) الوارد اسمي أعلاه بأنني سلّمت المركبة الواردة بياناتها أعلاه للشركة بالحالة الموضحة في هذا المحضر.')}</p>
      <p class="l-para veh-ack">${fix('أقر أنا المستلم بأنني إستلمت المركبة الواردة بياناتها أعلاه بالحالة الموضحة في هذا المحضر.')}</p>
      <div class="l-sigs" style="grid-template-columns:repeat(${sigs.length},1fr)">${sigs.map(([t, m]) => `<div class="l-sig"><div>${esc(t)}</div>${m}</div>`).join('')}</div></div>`;
  }
  /* رسمة المركبة بعلاماتها المرقمة، وبجوارها سطور منقطة بملاحظات العلامات ثم الملاحظات العامة */
  function vehDiagram(vType, marksIn, notes) {
    const eq = vType === 'معدة';
    const img = VEH_IMG[vType];
    const marks = img && Array.isArray(marksIn) ? marksIn : [];
    const typed = [
      ...marks.map((m, i) => `${i + 1}- ${m.note || ''}`),
      ...String(notes || '')
        .split(/\n/)
        .filter((x) => x.trim()),
    ];
    const pins = marks
      .map((m, i) => `<span class="veh-pin" style="left:${Number(m.x) || 0}%;top:${Number(m.y) || 0}%">${i + 1}</span>`)
      .join('');
    const lines = [...typed, ...Array(Math.max(0, (img ? 11 : 14) - typed.length)).fill('')]
      .map((x) => `<div class="veh-line">${esc(x)}</div>`)
      .join('');
    return `<div class="veh-wrap${img ? '' : ' no-img'}">${img ? `<div class="veh-img"><div class="veh-pic"><img src="${img}" alt="${esc(vType)}">${pins}</div></div>` : ''}
      <div class="veh-notes"><b>حالة ${eq ? 'المعدة' : 'المركبة'} والملاحظات :</b><div class="veh-lines">${lines}</div></div></div>`;
  }
  /* محضر السيارة في ملف التصفية بتوقيعاته: محاسب الفرع (مهمة الخصومات) وإدارة الحركة */
  function caseCarRecord(d, ctx) {
    ctx = ctx || {};
    /* الملفات الجديدة: المحضر نموذج مستقل مرتبط يُطبع بنفسه */
    if (((d.tasks || {}).traffic || {}).linked) return '';
    const who = (task) => {
      const i = (ctx.route || []).findIndex((s2) => s2.task === task);
      return i >= 0 && ctx.approvals && ctx.approvals[i] ? ctx.approvals[i] : null;
    };
    return renderCarRecord(d, { serial: ctx.serial, paperSigned: !!ctx.carPaper, acc: who('deductions'), traffic: who('traffic') });
  }
  /* مكافأة نهاية الخدمة تُحسب على حاسبة قوى، ونتيجتها تُرفق بالتصفية بهذا الاسم */
  const EOS_QIWA = 'https://knowledge-center.qiwa.sa/ar/tools-and-calculators/end-of-service-reward-calculator';
  const EOS_ATT = 'حساب مكافأة نهاية الخدمة (قوى)';

  function renderCaseAppendix(d, ctx) {
    ctx = ctx || {};
    const t = d.tasks || {};
    const page = (title, body, by) => `<div class="letter appendix">
      <div class="l-top"><div>التاريخ : <span class="red">${esc(fmtDate(d.date))}</span></div>${ctx.serial ? `<div>ملف التصفية رقم : <bdi dir="ltr" class="red">${esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">${esc(title)}</div>
      ${infoTable([
        ['الإسم', d.name],
        ['رقم الإقامة', d.iqama],
        ['الوظيفة', d.job],
        ['الفرع', d.branch],
      ])}
      ${body}
      ${by ? `<div class="l-prep">أُعد بواسطة : ${esc(by.name)} — ${esc(fmtDate(by.at))}</div>` : ''}</div>`;
    const who = (task) => {
      const i = (ctx.route || []).findIndex((s2) => s2.task === task);
      return i >= 0 && ctx.approvals && ctx.approvals[i] ? ctx.approvals[i] : null;
    };
    /* ملاحظات موظف شئون الموظفين عند تعبئة بيانات الموظف تظهر أسفل بياناته */
    const hrBy = who('hr'),
      hrNote = String((hrBy && hrBy.note) || '').trim();
    return [
      page('بيان الخصومات والعهد لإدراجها بتصفية موظف', caseTables(d), { name: ctx.createdByName || '', at: d.date }),
      t.hr
        ? page(
            'بيانات الموظف من شئون الموظفين',
            `${infoTable(taskRows('hr', t.hr))}${hrNote ? `<div class="l-notes"><b>ملاحظات شئون الموظفين :</b><br>${esc(hrNote).replace(/\n/g, '<br>')}</div>` : ''}`,
            hrBy,
          )
        : '',
      t.traffic ? caseCarRecord(d, ctx) : '',
    ].join('');
  }

  /* الكفالات (المنشآت المسجل عليها الموظفون في مدد) — تُستخدم في سجل الموظف وبيان رواتب الفرع */
  const BP_OUT = 'كفالة خارجية';
  const BP_KAFALA = [
    'شركة سادن المتخصصة للاستشارات الجيولوجية',
    'شركة كانتل',
    'شركة أرابور شخص واحد',
    'ورشة سادن المتخصصة',
    'شركة سادن سبيشالايزد فور لابوراتوريز',
    'مؤسسة سادن المتوسطة للمقاولات العامة',
    'مؤسسة اركان البنا المطوره للمقاولات العامة',
    'شركة المدى الدولي للتجارة',
    'شركة قصبة للهندسة المدنية',
    BP_OUT,
  ];
  /* نماذج في ملفات مستقلة (forms-*.js): الخادم يستوردها، والواجهة تحمّلها قبل هذا الملف */
  const FORM_PARTS = typeof module === 'object' && module.exports ? [require('./forms-traffic.js')] : self.SADEN_FORM_PARTS || [];
  const FORMS = [
    {
      id: 'contact',
      group: 'البدلات',
      title: 'خطاب تعميد بدل إتصال',
      fields: [
        F.date,
        { key: 'amount', label: 'قيمة البدل (ريال)', type: 'number', required: true, default: '115' },
        F.name,
        F.iqama,
        F.job,
        F.prof,
        { key: 'startDate', label: 'تاريخ بداية البدل', type: 'date', required: true },
        F.branch,
        { key: 'reason', label: 'قرار مدير الفرع مع ذكر سبب البدل', type: 'textarea', required: true },
      ],
      amountKey: 'amount',
      body: (d) => `<p>برجاء الموافقة على صرف بدل إتصال بقيمة (${val(fmtNum(d.amount), '....')}) ﷼ للموظف الآتي بياناته :</p>
        ${infoTable([...basicPairs(d), ['تاريخ بداية البدل', fmtDate(d.startDate)], ['الفرع', d.branch]])}
        ${decisionBox('قرار مدير الفرع مع ذكر سبب البدل', esc(d.reason), true)}${branchSig}`,
    },
    {
      id: 'contactBulk',
      group: 'البدلات',
      title: 'خطاب تعميد بدل إتصال مجمع',
      fields: [
        F.date,
        { key: 'amount', label: 'قيمة البدل للموظف (ريال)', type: 'number', required: true, default: '115' },
        F.branch,
        {
          key: 'employees',
          label: 'الموظفون',
          type: 'table',
          required: true,
          columns: [
            { key: 'name', label: 'الإسم' },
            { key: 'iqama', label: 'رقم الإقامة' },
            { key: 'job', label: 'الوظيفة' },
            { key: 'startDate', label: 'تاريخ بداية البدل', type: 'date' },
            { key: 'branch', label: 'الفرع', hint: 'يُترك فارغاً لاستخدام فرع الخطاب' },
          ],
        },
        { key: 'reason', label: 'قرار مدير الفرع مع ذكر سبب البدل', type: 'textarea', required: true },
      ],
      summary: (d) => `${(d.employees || []).length} موظف - فرع ${d.branch || ''}`,
      body: (d) => `<p>برجاء الموافقة على صرف بدل إتصال بقيمة (${val(fmtNum(d.amount), '....')}) ريال للموظفين الآتي بياناتهم :</p>
        <table class="lt grid"><thead><tr><th style="width:6%">م</th><th>الإسم</th><th>رقم الإقامة</th><th>الوظيفة</th><th>تاريخ بداية البدل</th><th>الفرع</th></tr></thead><tbody>
        ${(d.employees || []).map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.name)}</td><td>${esc(e.iqama)}</td><td>${esc(e.job)}</td><td>${esc(fmtDate(e.startDate))}</td><td>${esc(e.branch || d.branch)}</td></tr>`).join('') || '<tr><td colspan="6">&nbsp;</td></tr>'}
        </tbody></table>
        ${decisionBox('قرار مدير الفرع مع ذكر سبب البدل', esc(d.reason), true)}${branchSig}`,
    },
    valueAllowance({
      id: 'residence',
      label: 'بدل إقامة',
      requiredAttachments: ['صورة الإقامة'],
      fields: [
        { key: 'iqamaExpiry', label: 'تاريخ انتهاء الإقامة', type: 'date' },
        F.joinDate,
        { key: 'sponsor', label: 'اسم الكفيل' },
        F.branch,
      ],
      pairs: (d) => [
        ['تاريخ إنتهاء الإقامة', fmtDate(d.iqamaExpiry)],
        ['تاريخ التعيين', fmtDate(d.joinDate)],
        ['اسم الكفيل', d.sponsor],
        ['الفرع', d.branch],
      ],
      extra: () =>
        `<div class="l-notes"><b>ملاحظات :</b> يتم إرفاق :<ul><li>صورة الإقامة .</li><li>صورة من إيصال التحويل في حالة تحويل المبلغ للكفيل .</li></ul></div>`,
    }),
    valueAllowance({
      id: 'transport',
      label: 'بدل إنتقال',
      fields: [F.branch, F.joinDate],
      pairs: (d) => [
        ['الفرع', d.branch],
        ['تاريخ التعيين', fmtDate(d.joinDate)],
      ],
    }),
    valueAllowance({
      id: 'housingFixed',
      label: 'بدل سكن ثابت',
      fields: [F.branch, F.joinDate, { key: 'housingDate', label: 'تاريخ بداية السكن الخارجي', type: 'date', required: true }],
      pairs: (d) => [
        ['الفرع', d.branch],
        ['تاريخ التعيين', fmtDate(d.joinDate)],
      ],
      extra: (d) => `<p>حيث أن الموظف يسكن في سكن خارجي بداية من ${val(fmtDate(d.housingDate), '00/00/0000')} م</p>`,
    }),
    valueAllowance({
      id: 'housingVisit',
      label: 'بدل سكن زيارة',
      title: 'خطاب تعميد بدل سكن زيارة',
      requiredAttachments: ['صورة تأشيرة الزيارة'],
      fields: [
        F.branch,
        { key: 'lastReturn', label: 'تاريخ آخر عودة من الإجازة', type: 'date', required: true },
        { key: 'housingDate', label: 'تاريخ بداية السكن الخارجي', type: 'date', required: true },
      ],
      pairs: (d) => [
        ['الفرع', d.branch],
        ['تاريخ آخر عودة من الإجازة', fmtDate(d.lastReturn)],
      ],
      extra: (d) => `<p>حيث أن الموظف قام بعمل زيارة عائلية ويسكن بسكن خارجي بداية من ${val(fmtDate(d.housingDate), '00/00/0000')}</p>`,
    }),
    {
      id: 'site',
      group: 'البدلات',
      title: 'خطاب تعميد بدل موقع',
      fields: [
        F.date,
        { key: 'amount', label: 'المبلغ المستحق (ريال)', type: 'number', required: true },
        F.name,
        F.iqama,
        F.job,
        F.prof,
        { key: 'site', label: 'اسم الموقع', required: true },
        { key: 'reports', label: 'عمل تقارير بالموقع', type: 'select', options: ['يعمل', 'لا يعمل'], required: true },
        F.branch,
        { key: 'housing', label: 'السكن', type: 'select', options: ['سكن شركة', 'سكن موقع'], required: true },
      ],
      amountKey: 'amount',
      body: (d) => `<p>برجاء الموافقة على صرف مبلغ ( ${val(fmtNum(d.amount))} ) ريال قيمة (بدل موقع) للموظف الآتي بياناته :</p>
        ${infoTable([...basicPairs(d), ['اسم الموقع', d.site], ['عمل تقارير بالموقع', d.reports], ['الفرع', d.branch], ['سكن شركة / موقع', d.housing]])}`,
    },
    {
      id: 'salaryRaise',
      group: 'المستحقات',
      title: 'خطاب تعميد زيادة راتب',
      /* سري: لا يظهر في سجل الفرع ولا لمن ليس في مساره */
      confidential: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'startMonth', label: 'تبدأ الزيادة من راتب شهر', required: true, hint: 'مثال: يونيو 2026' },
        ...salaryFields('b_', 'قبل الزيادة'),
        ...salaryFields('a_', 'بعد الزيادة'),
        { key: 'reason', label: 'سبب الزيادة', type: 'textarea', required: true },
      ],
      summary: (d) => `زيادة راتب: ${d.name || ''}`,
      amount: (d) => {
        const v = salaryTotal(d, 'a_') - salaryTotal(d, 'b_');
        return v > 0 ? v : '';
      },
      body: (
        d,
      ) => `<p class="l-para">برجاء الموافقة على زيادة ( راتب ) الموظف / ${val(d.name, '....................')} والذي يعمل ${val(d.job)} بفرع ${val(d.branch)} بحيث تكون الزيادة بداية من راتب ${val(d.startMonth)} .</p>
        <h4 class="l-sec">تفاصيل الراتب قبل الزيادة :</h4>${salaryTable(d, 'b_')}
        <h4 class="l-sec">تفاصيل الراتب بعد الزيادة :</h4>${salaryTable(d, 'a_')}
        <p><b>سبب الزيادة :</b> ${val(d.reason)}</p>`,
    },
    {
      id: 'commission',
      group: 'المستحقات',
      title: 'خطاب إعتماد صرف عمولة',
      fields: [
        F.date,
        { key: 'amount', label: 'المبلغ (ريال - يقبل الهللات)', type: 'number', required: true },
        F.branch,
        { key: 'forWhom', label: 'عمولة لـ', required: true },
        { key: 'manager', label: 'مدير الفرع (المهندس)', required: true },
      ],
      amountKey: 'amount',
      summary: (d) => `عمولة لـ ${d.forWhom || ''}`,
      extraSigs: ['مدير الفرع'],
      body: (d) =>
        `<p class="l-para">فضلاً الموافقة على صرف مبلغ ( ${val(fmtNum(d.amount))} ) ريال سعودي ( ${val(tafqeet(d.amount), '........................')} ) من فرع ( ${val(d.branch)} ) قيمة عمولة لـ ( ${val(d.forWhom)} ) وذلك بمعلومية مدير الفرع المهندس ( ${val(d.manager)} ).</p>`,
    },
    {
      /* بيان جُمع / إعاشات موظف عن شهر (من نموذجي الإكسيل): يملؤه محاسب الفرع، ويتولد معه تلقائياً "خطاب إعتماد الصرف"
       * بالإجمالي في صفحة A4 تحته، ويسيران معاً في مسار واحد: مسار البيان (مدير الفرع) ثم مسار الخطاب (المدير المالي والمدير التنفيذي) */
      id: 'allowanceSheet',
      group: 'المصروفات',
      title: 'بيان جُمع / إعاشات موظف (فردي) عن شهر',
      companion: 'allowanceLetter',
      withRouteOf: 'allowanceLetter',
      xlsxSheet: 'single',
      amount: (d) => (d.combined ? sheetTotal(d) || '' : ''),
      letterTitle: (d) => `بيان ${d.sheetType || 'جُمع / إعاشات'} موظف عن شهر`,
      noDest: true,
      noDecisionBox: true,
      fields: [
        F.date,
        { key: 'sheetType', label: 'نوع البيان', type: 'select', options: ['جُمع', 'إعاشات'], required: true },
        F.branch,
        { ...F.name, label: 'اسم الموظف' },
        { ...F.iqama, required: false },
        { key: 'month', label: 'عن شهر', type: 'select', options: AR_MONTHS, required: true },
        { key: 'year', label: 'سنة', required: true, default: String(new Date().getFullYear()) },
        {
          key: 'rows',
          label: 'الأيام',
          type: 'table',
          required: true,
          columns: [
            { key: 'date', label: 'التاريخ', type: 'date' },
            { key: 'amount', label: 'المبلغ', type: 'number' },
            { key: 'details', label: 'التفاصيل' },
            { key: 'notes', label: 'ملاحظات' },
          ],
        },
      ],
      summary: (d) => `${d.sheetType || ''} ${d.name || ''} — ${d.month || ''} ${d.year || ''}`,
      body: (d) => {
        const rows = (d.rows || []).filter((r) => r.date || r.amount);
        const total = sheetTotal(d);
        const kind = d.sheetType || 'جُمع / إعاشات';
        const word = d.sheetType === 'إعاشات' ? 'الإعاشة' : d.sheetType === 'جُمع' ? 'الجمعة' : 'المبلغ';
        return `<p class="l-para">فرع : ${val(d.branch)}</p>
        <p class="l-para">بيان ${esc(kind)} الموظف / ${val(d.name, '..............................')}${d.iqama ? ` (إقامة ${esc(d.iqama)})` : ''} عن شهر ${val(d.month)} ${val(d.year)}</p>
        <table class="lt sheet-t"><tr><th>م</th><th>التاريخ</th><th>اليوم</th><th>مبلغ ${word}</th><th>تفاصيل ${word}</th><th>ملاحظات</th></tr>
          ${rows.map((r, i) => `<tr><td class="num">${i + 1}</td><td>${esc(fmtDate(r.date))}</td><td>${esc(dayName(r.date))}</td><td class="num">${esc(fmtNum(r.amount))}</td><td>${esc(r.details)}</td><td class="l-note-red">${esc(r.notes)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">لا توجد أيام</td></tr>'}
          <tr class="total-row"><td colspan="3"><b>إجمالي مبلغ ${d.sheetType ? 'ال' : ''}${esc(kind)}</b></td><td class="num"><b>${esc(fmtNum(total))}</b></td><td colspan="2">${total ? esc(tafqeet(total)) : ''}</td></tr></table>`;
      },
    },
    {
      /* بيان جُمع / إعاشات مجمع عن شهر (من قالبي الإكسيل): يحمّل محاسب الفرع القالب بموظفي فرعه ويرفعه بعد تعبئته،
       * ويتولد معه خطاب إعتماد الصرف بالإجمالي، ويسيران معاً: مدير الفرع ثم المدير المالي والمدير التنفيذي */
      id: 'allowanceSheetBulk',
      group: 'المصروفات',
      title: 'بيان جُمع / إعاشات موظفي الفرع (إجمالي) عن شهر',
      companion: 'allowanceLetter',
      withRouteOf: 'allowanceLetter',
      routeAs: 'allowanceSheet',
      xlsxSheet: true,
      amount: (d) => sheetTotal(d) || '',
      letterTitle: (d) => `بيان ${d.sheetType || 'جُمع / إعاشات'} موظفي الفرع (إجمالي) عن شهر`,
      noDest: true,
      noDecisionBox: true,
      fields: [
        F.date,
        { key: 'sheetType', label: 'نوع البيان', type: 'select', options: ['جُمع', 'إعاشات'], required: true },
        F.branch,
        { key: 'month', label: 'عن شهر', type: 'select', options: AR_MONTHS, required: true },
        { key: 'year', label: 'سنة', required: true, default: String(new Date().getFullYear()) },
        {
          key: 'rows',
          label: 'الموظفون',
          type: 'table',
          required: true,
          columns: [
            { key: 'name', label: 'الاسم' },
            { key: 'job', label: 'الوظيفة' },
            { key: 'iqama', label: 'رقم الهوية / الإقامة' },
            { key: 'amount', label: 'المبلغ', type: 'number' },
            { key: 'details', label: 'التفاصيل' },
            { key: 'notes', label: 'ملاحظات' },
          ],
        },
      ],
      summary: (d) =>
        `${d.sheetType || ''} فرع ${d.branch || ''} — ${d.month || ''} ${d.year || ''} (${(d.rows || []).filter((r) => r.name || r.amount).length} موظف)`,
      body: (d) => {
        const rows = (d.rows || []).filter((r) => r.name || r.amount);
        const total = sheetTotal(d);
        const kind = d.sheetType || 'جُمع / إعاشات';
        const word = d.sheetType === 'إعاشات' ? 'الإعاشات' : d.sheetType === 'جُمع' ? 'الجُمع' : 'المبلغ';
        return `<p class="l-para">فرع : ${val(d.branch)}</p>
        <p class="l-para">بيان ${esc(kind)} فرع / ${val(d.branch, '..............................')} عن شهر ${val(d.month)} ${val(d.year)}</p>
        <table class="lt sheet-t"><tr><th>م</th><th>الاسم</th><th>الوظيفة</th><th>مبلغ ${word}</th><th>تفاصيل</th><th>ملاحظات</th></tr>
          ${rows.map((r, i) => `<tr><td class="num">${i + 1}</td><td>${esc(r.name)}</td><td>${esc(r.job)}</td><td class="num">${esc(fmtNum(r.amount))}</td><td>${esc(r.details)}</td><td class="l-note-red">${esc(r.notes)}</td></tr>`).join('') || '<tr><td colspan="6" class="dots">لا توجد بيانات</td></tr>'}
          <tr class="total-row"><td colspan="3"><b>إجمالي مبلغ ${word}</b></td><td class="num"><b>${esc(fmtNum(total))}</b></td><td colspan="2">${total ? esc(tafqeet(total)) : ''}</td></tr></table>`;
      },
    },
    {
      /* يُنشأ تلقائياً بعد اعتماد مدير الفرع للبيان (لا يُرفع يدوياً)، ويُطبع معه البيان المعتمد */
      id: 'allowanceLetter',
      group: 'المصروفات',
      title: 'خطاب إعتماد صرف جُمع / إعاشات',
      letterTitle: (d) => `خطاب إعتماد صرف ${d.sheetType || 'جُمع / إعاشات'}`,
      autoOnly: true,
      autoFrom: 'allowanceSheet',
      fields: [
        F.date,
        { key: 'amount', label: 'المبلغ', type: 'number', required: true },
        F.branch,
        { key: 'sheetType', label: 'نوع البيان' },
        { key: 'name', label: 'اسم الموظف' },
        { key: 'iqama', label: 'رقم الإقامة' },
        { key: 'month', label: 'عن شهر' },
        { key: 'year', label: 'سنة' },
        { key: 'sheetId', label: 'البيان', hidden: true },
      ],
      amountKey: 'amount',
      noNote: true,
      summary: (d) => `${d.sheetType || ''} ${d.name || ''} — ${d.month || ''} ${d.year || ''}`,
      body: (d) =>
        `<p class="l-para">فضلاً الموافقة على صرف مبلغ ( ${val(fmtNum(d.amount))} ) ريال سعودي ( ${val(tafqeet(d.amount), '........................')} ) من فرع ( ${val(d.branch)} ) قيمة ${val(d.sheetType)} ${d.bulk ? `موظفي الفرع وعددهم ( ${val(d.count ? String(d.count) : '')} ) موظفاً` : `الموظف / ( ${val(d.name)} )`} عن شهر ( ${val(d.month)} ${val(d.year)} )، وفقاً للبيان المرفق المعتمد من مدير الفرع.</p>`,
    },
    {
      /* من نموذج الورد "خطاب إعتماد مصروف تشغيلي": مبلغ غير شامل الضريبة من فرع، قيمة ... */
      id: 'opex',
      group: 'المصروفات',
      title: 'خطاب إعتماد مصروف تشغيلي',
      fields: [
        F.date,
        { key: 'amount', label: 'المبلغ غير شامل الضريبة (ريال - يقبل الهللات)', type: 'number', required: true },
        F.branch,
        { key: 'purpose', label: 'نظيراً لـ', type: 'textarea', required: true, hint: 'مثال: صيانة مولد الموقع' },
      ],
      amountKey: 'amount',
      summary: (d) => `مصروف تشغيلي: ${String(d.purpose || '').slice(0, 60)}`,
      body: (d) =>
        `<p class="l-para">فضلاً الموافقة على صرف مبلغ ( ${val(fmtNum(d.amount))} ) ريال سعودي ( ${val(tafqeet(d.amount), '........................')} ) غير شامل الضريبة من فرع ( ${val(d.branch)} ) نظيراً لـ ( ${val(d.purpose, '..........................................')} ).</p>`,
    },
    {
      id: 'license',
      group: 'المستحقات',
      title: 'خطاب تعميد مصروفات رخصة قيادة',
      /* بعد الاعتماد يتكوّن «إقرار مصروفات رخصة قيادة» ويبقى الطلب مفتوحاً حتى يُرفع موقّعاً */
      companion: 'licenseAck',
      fields: [
        F.date,
        { key: 'licenseType', label: 'نوع الرخصة', type: 'select', options: ['خاصة', 'نقل ثقيل', 'نقل خفيف', 'عمومي'], required: true },
        F.name,
        F.iqama,
        F.job,
        F.branch,
      ],
      needsValue: true,
      /* مراحل المسار التي يحتوي اسمها على "الحركة" تظهر في صندوق مستقل */
      sideBox: { head: 'قرار إدارة الحركة', match: 'الحركة' },
      body: (d) =>
        `<p class="l-para">برجاء تحديد قيمة ( مصروفات رخصة قيادة ) ( ${val(d.licenseType)} ) للموظف / ${val(d.name, '..............................')} إقامة رقم ${val(d.iqama, '....................')} والذي يعمل ${val(d.job, '...........')} بفرع ${val(d.branch, '....................')}</p>`,
    },
    {
      id: 'settlement',
      group: 'المستحقات',
      title: 'تصفية حساب موظف',
      letterTitle: 'تصفية حساب موظف (إجازة / نهائي)',
      noDest: true,
      /* صفحة A4 واحدة بأقل هوامش، بدون صندوق "قرار الإدارة المالية" (تكفي أختام الاعتماد) */
      compact: true,
      noDecisionBox: true,
      /* شاشة الإدخال هي "برنامج التصفية" نفسه، وتُحفظ كل خاناته مع الطلب (state) */
      embed: SETTLE_EMBED,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.branch,
        { key: 'net', label: 'الصافي' },
        { key: 'nationality', label: 'الجنسية' },
        { key: 'company', label: 'الشركة أو المؤسسة / الفرع / الوظيفة' },
        { key: 'startDate', label: 'بداية العمل', type: 'date' },
        { key: 'endDate', label: 'نهاية العمل', type: 'date' },
        { key: 'state', label: 'بيانات برنامج التصفية', type: 'json', required: true },
      ],
      /* تتولد مع التصفية تلقائياً "إقرار مخالصة نهائية" من نفس البيانات */
      companion: 'clearance',
      summary: (d) => `تصفية: ${d.name || ''}`,
      amount: (d) => (Number(d.net) > 0 ? Number(d.net) : ''),
      body: () => '<div class="settle-snap"><div class="dots">جاري تحميل بيانات التصفية...</div></div>',
    },
    {
      id: 'settlementCase',
      group: 'المستحقات',
      title: 'طلب تصفية موظف',
      letterTitle: 'تصفية حساب موظف (إجازة / نهائي)',
      noDest: true,
      compact: true,
      noDecisionBox: true,
      companion: 'clearance',
      /* كل مسئول في التسلسل يعيد الملف للمرحلة السابقة (ومن أول مرحلة للمحاسب) */
      returnPrev: true,
      /* دورة: المحاسب يرفعه من شاشة واحدة (البيانات والخصومات والعهد والمرفقات) ← شئون الموظفين ← محاسب حماية الأجور يعدّ التصفية ← الاعتماد */
      flow: true,
      /* مرفقات إلزامية لكل تصفية (إجازة أو نهائية): الهوية، تذكرة الطيران، ونموذج آخر يوم دوام موقّعاً (مع رقمه على النظام) */
      /* (اسم مرفق آخر يوم دوام كما في الطلبات السابقة حتى لا تتعطل الملفات المفتوحة) */
      requiredAttachments: ['صورة الهوية / الإقامة', 'تذكرة الطيران', 'نموذج آخر يوم دوام معتمد من مدير الفرع'],
      /* مرفق إلزامي عند اختيار معيّن: [المرفق، الحقل، القيمة] — الموافقة على الإجازة لتصفية الإجازة فقط، ومحضر السيارة لمن استلم سيارة */
      requiredIf: [
        ['نموذج الموافقة على الإجازة', 'kind', 'تصفية إجازة'],
        ['محضر التسليم والتسلم معتمد من إدارة الحركة', 'hasCar', 'نعم'],
      ],
      embed: SETTLE_EMBED,
      fields: [
        F.date,
        { key: 'kind', label: 'نوع التصفية', type: 'select', options: ['تصفية إجازة', 'تصفية نهائية'], required: true },
        F.name,
        F.iqama,
        F.job,
        F.branch,
        /* نموذج آخر يوم دوام المعتمد على النظام: منه تاريخ آخر دوام، ويظهر ضمن مرفقات التصفية */
        {
          key: 'lastDayNo',
          label: 'رقم نموذج آخر يوم دوام المعتمد',
          required: true,
          hint: 'رقم نموذج "آخر يوم دوام" المعتمد على النظام، مثال: SADEN-2026-0120 أو 120',
        },
        { key: 'lastDay', label: 'تاريخ آخر دوام', type: 'date', hidden: true },
        { key: 'notes', label: 'ملاحظات لشئون الموظفين', type: 'textarea' },
        /* الخصومات والعهد والسيارة من المحاسب عند رفع الطلب */
        ...TASKS.deductions.fields,
        /* تُعبأ لاحقاً من برنامج التصفية */
        { key: 'net', label: 'الصافي', hidden: true },
        { key: 'gross', label: 'إجمالي المستحقات قبل الخصومات (مبلغ المخالصة)', hidden: true },
        { key: 'nationality', label: 'الجنسية', hidden: true },
        { key: 'company', label: 'الشركة', hidden: true },
        /* مكافأة نهاية الخدمة: من سطر "مكافأة نهاية الخدمة" في جدول مستحقات البرنامج (التصفية النهائية) */
        { key: 'eos', label: 'مكافأة نهاية الخدمة', hidden: true },
        { key: 'basic', label: 'الراتب الأساسي', hidden: true },
        /* الجهة التي يستلم منها الموظف في المخالصة: سادن أو إحدى شركات المجموعة */
        { key: 'payer', label: 'يستلم من (في المخالصة)', hidden: true },
        { key: 'startDate', label: 'بداية العمل', type: 'date', hidden: true },
        { key: 'endDate', label: 'نهاية العمل', type: 'date', hidden: true },
        { key: 'state', label: 'بيانات برنامج التصفية', type: 'json', hidden: true },
      ],
      summary: (d) => `${d.kind || 'تصفية'}: ${d.name || ''}`,
      amount: (d) => (Number(d.net) > 0 ? Number(d.net) : ''),
      body: (d) => (d.state ? '<div class="settle-snap"><div class="dots">جاري تحميل بيانات التصفية...</div></div>' : caseSummary(d)),
    },
    {
      /* طلب إجازة: يختار مقدمه الموظف من السجل ونوع الإجازة (من السياسة) والمعتمد؛ ويُتحقق من الرصيد والحد الأقصى، وبعد الاعتماد تُسجل في سجل الإجازات */
      id: 'leaveRequest',
      group: 'شئون الموظفين',
      title: 'طلب إجازة',
      letterTitle: 'طلب إجازة',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'leaveType', label: 'نوع الإجازة', required: true, choicesFrom: 'leaveTypes' },
        { key: 'from', label: 'من تاريخ', type: 'date', required: true },
        { key: 'to', label: 'إلى تاريخ', type: 'date', required: true },
        { key: 'reason', label: 'السبب / ملاحظات', type: 'textarea' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'المدير المباشر أو مدير الفرع' },
        { key: 'days', label: 'عدد الأيام', hidden: true },
        { key: 'balance', label: 'الرصيد قبل الإجازة', hidden: true },
      ],
      summary: (d) => `${d.leaveType || 'إجازة'}: ${d.name || ''} — ${d.days || ''} يوم من ${fmtDate(d.from)}`,
      body: (
        d,
      ) => `<p>نرجو التكرم بالموافقة على منح الموظف الآتي بياناته إجازة <b>${esc(d.leaveType || '')}</b> لمدة ( ${val(d.days, '....')} ) يوماً.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['نوع الإجازة', d.leaveType], ['من تاريخ', fmtDate(d.from)], ['إلى تاريخ', fmtDate(d.to)], ['عدد الأيام', d.days], ['تاريخ العودة المتوقع', d.to ? fmtDate(addDays(d.to, 1)) : '']])}
        ${
          d.balance !== undefined && d.balance !== ''
            ? infoTable([
                ['رصيد الإجازة قبل الطلب', `${d.balance} يوم`],
                ['الرصيد بعد الإجازة', `${Math.round((Number(d.balance) - Number(d.days || 0)) * 100) / 100} يوم`],
              ])
            : ''
        }
        ${d.reason ? decisionBox('السبب / ملاحظات', esc(d.reason), true) : ''}`,
    },
    {
      /* نموذج آخر يوم دوام: يوجّهه مقدمه لأي مستخدم على النظام لاعتماده، ويُربط بملف التصفية برقمه */
      id: 'lastWorkDay',
      group: 'شئون الموظفين',
      title: 'نموذج آخر يوم دوام',
      letterTitle: 'نموذج آخر يوم دوام',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'nationality', label: 'الجنسية' },
        { key: 'department', label: 'الإدارة / القسم' },
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date' },
        { key: 'lastDay', label: 'تاريخ آخر يوم دوام', type: 'date', required: true },
        {
          key: 'reason',
          label: 'السبب',
          type: 'select',
          options: ['إجازة', 'استقالة', 'انتهاء العقد', 'إنهاء الخدمات', 'أخرى'],
          required: true,
        },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
        {
          key: 'approverId',
          label: 'يُوجَّه لاعتماد',
          picker: 'user',
          required: true,
          hint: 'اختر من يعتمد النموذج من مستخدمي النظام (مدير الفرع أو غيره)',
        },
      ],
      summary: (d) => `${d.name || ''} — آخر يوم دوام ${fmtDate(d.lastDay)}`,
      body: (
        d,
      ) => `<p>نفيدكم بأن آخر يوم دوام للموظف الآتي بياناته هو يوم ( ${val(fmtDate(d.lastDay), '..../..../........')} )${d.reason ? `، وذلك بسبب: <b>${esc(d.reason)}</b>` : ''}.</p>
        ${infoTable([
          ['الإسم', d.name],
          ['الرقم الوظيفي', d.empNo],
          ['رقم الإقامة / الهوية', d.iqama],
          ['الجنسية', d.nationality],
          ['الوظيفة', d.job],
          ['الإدارة / القسم', d.department],
          ['الفرع', d.branch],
          ['تاريخ التعيين', fmtDate(d.joinDate)],
          ['تاريخ آخر يوم دوام', fmtDate(d.lastDay)],
          ['السبب', d.reason],
        ])}
        ${d.notes ? decisionBox('ملاحظات', esc(d.notes), true) : ''}`,
    },
    /* ---------- نماذج شئون الموظفين (الخدمات): كلها تختار الموظف من السجل وتنزل بياناته تلقائياً مع إمكانية الإدخال اليدوي ---------- */
    {
      id: 'expCert',
      group: 'شئون الموظفين',
      title: 'طلب شهادة خبرة',
      letterTitle: 'شهادة خبرة',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'nationality', label: 'الجنسية' },
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date', hint: 'فارغ = من سجل الموظفين' },
        { key: 'leaveDate', label: 'تاريخ ترك العمل', type: 'date', hint: 'فارغ = لا يزال على رأس العمل' },
        { key: 'lang', label: 'لغة الشهادة', type: 'select', options: ['العربية', 'الإنجليزية', 'العربية والإنجليزية'], required: true },
        { key: 'addressedTo', label: 'الجهة الموجهة إليها', hint: 'فارغ = إلى من يهمه الأمر' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'شئون الموظفين أو المدير المختص' },
      ],
      summary: (d) => `شهادة خبرة: ${d.name || ''}`,
      body: (d) => `<p><b>${esc(d.addressedTo || 'إلى من يهمه الأمر')}</b></p>
        <p>تشهد الشركة بأن السيد / ${val(d.name)}${d.nationality ? `، ${esc(d.nationality)} الجنسية` : ''}، رقم الإقامة / الهوية ( ${val(d.iqama)} )، ${d.leaveDate ? 'قد عمل' : 'يعمل'} لدينا بوظيفة <b>${esc(d.job || '....')}</b>
        اعتباراً من ${val(fmtDate(d.joinDate))}${d.leaveDate ? ` وحتى ${val(fmtDate(d.leaveDate))}` : ' وحتى تاريخه'}، وكان طوال مدة عمله حسن السيرة والسلوك.</p>
        <p>وقد أُعطي هذه الشهادة بناءً على طلبه دون أدنى مسؤولية على الشركة.</p>${d.lang && d.lang !== 'العربية' ? `<p class="muted">مطلوب نسخة ${esc(d.lang === 'الإنجليزية' ? 'باللغة الإنجليزية' : 'باللغتين')}.</p>` : ''}
        ${d.notes ? decisionBox('ملاحظات', esc(d.notes), true) : ''}`,
    },
    {
      id: 'salaryCert',
      group: 'شئون الموظفين',
      title: 'طلب تعريف بالراتب',
      letterTitle: 'خطاب تعريف بالراتب',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      confidential: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'nationality', label: 'الجنسية' },
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date' },
        { key: 'addressedTo', label: 'الجهة الموجه إليها', required: true, hint: 'مثال: بنك الراجحي / السفارة / إلى من يهمه الأمر' },
        { key: 'purpose', label: 'الغرض', type: 'select', options: ['بنك / تمويل', 'سفارة / تأشيرة', 'جهة حكومية', 'استئجار سكن', 'أخرى'] },
        {
          key: 'detail',
          label: 'تفاصيل الراتب في الخطاب',
          type: 'select',
          options: ['الإجمالي فقط', 'تفصيلي (الأساسي والبدلات)'],
          required: true,
        },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'شئون الموظفين أو إدارة الرواتب' },
        { key: 'basic', label: 'الراتب الأساسي', hidden: true },
        { key: 'housing', label: 'بدل السكن', hidden: true },
        { key: 'otherAllow', label: 'البدلات الأخرى', hidden: true },
        { key: 'total', label: 'إجمالي الراتب', hidden: true },
      ],
      summary: (d) => `تعريف بالراتب: ${d.name || ''} — ${d.addressedTo || ''}`,
      body: (d) => `<p>السادة / <b>${esc(d.addressedTo || 'إلى من يهمه الأمر')}</b> المحترمين</p>
        <p>تفيد الشركة بأن السيد / ${val(d.name)}${d.nationality ? `، ${esc(d.nationality)} الجنسية` : ''}، رقم الإقامة / الهوية ( ${val(d.iqama)} )، يعمل لدينا بوظيفة <b>${esc(d.job || '....')}</b> اعتباراً من ${val(fmtDate(d.joinDate))} وحتى تاريخه،
        ويتقاضى راتباً شهرياً إجمالياً قدره ( ${val(fmtNum(d.total))} ) ريال${d.total ? ` (${esc(tafqeet(Number(String(d.total).replace(/,/g, '')) || 0))})` : ''}.</p>
        ${
          d.detail === 'تفصيلي (الأساسي والبدلات)'
            ? infoTable([
                ['الراتب الأساسي', fmtNum(d.basic)],
                ['بدل السكن', fmtNum(d.housing)],
                ['البدلات الأخرى', fmtNum(d.otherAllow)],
                ['الإجمالي', fmtNum(d.total)],
              ])
            : ''
        }
        <p>وقد أُعطي هذا الخطاب بناءً على طلبه لتقديمه إلى الجهة المذكورة دون أدنى مسؤولية على الشركة.</p>`,
    },
    {
      id: 'salaryFix',
      group: 'شئون الموظفين',
      title: 'طلب تثبيت راتب',
      letterTitle: 'خطاب تثبيت (تحويل) راتب',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      confidential: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date' },
        { key: 'bank', label: 'البنك', hint: 'فارغ = من سجل الموظفين' },
        { key: 'iban', label: 'رقم الآيبان', hint: 'فارغ = من سجل الموظفين' },
        { key: 'reason', label: 'الغرض', type: 'select', options: ['تمويل شخصي', 'تمويل عقاري', 'بطاقة ائتمانية', 'أخرى'] },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'إدارة الرواتب' },
        { key: 'total', label: 'إجمالي الراتب', hidden: true },
      ],
      summary: (d) => `تثبيت راتب: ${d.name || ''} — ${d.bank || ''}`,
      body: (d) => `<p>السادة / <b>${esc(d.bank || '....')}</b> المحترمين</p>
        <p>تفيد الشركة بأن السيد / ${val(d.name)}، رقم الإقامة / الهوية ( ${val(d.iqama)} )، يعمل لدينا بوظيفة <b>${esc(d.job || '....')}</b> منذ ${val(fmtDate(d.joinDate))}، براتب شهري إجمالي قدره ( ${val(fmtNum(d.total))} ) ريال.</p>
        <p>وتتعهد الشركة بتحويل راتبه الشهري ومستحقاته إلى حسابه لديكم رقم الآيبان ( <bdi dir="ltr">${esc(d.iban || '....')}</bdi> )، وعدم تحويله إلى بنك آخر إلا بعد الحصول على خطاب إخلاء طرف منكم، طالما ظل على رأس العمل لدينا.</p>`,
    },
    {
      id: 'familyVisit',
      group: 'شئون الموظفين',
      title: 'طلب زيارة عائلية',
      letterTitle: 'طلب زيارة عائلية',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      allowance: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        {
          key: 'relation',
          label: 'الزوار',
          type: 'select',
          options: ['الزوجة', 'الزوجة والأبناء', 'الأبناء', 'الوالدان', 'أخرى'],
          required: true,
        },
        { key: 'visitors', label: 'عدد الزوار', type: 'number', required: true },
        { key: 'from', label: 'من تاريخ', type: 'date', required: true },
        { key: 'to', label: 'إلى تاريخ', type: 'date', required: true },
        { key: 'visaNo', label: 'رقم طلب / تأشيرة الزيارة' },
        {
          key: 'amount',
          label: 'بدل الزيارة العائلية المطلوب (ريال)',
          type: 'number',
          hint: 'فارغ = بدون بدل — ويُصرف في المسير بالشهر الذي تحدده إدارة الرواتب',
        },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'المدير المباشر أو مدير الفرع' },
        { key: 'days', label: 'مدة الزيارة', hidden: true },
      ],
      summary: (d) => `زيارة عائلية: ${d.name || ''} — ${d.relation || ''}${d.amount ? ` — بدل ${fmtNum(d.amount)}` : ''}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على زيارة عائلية للموظف الآتي بياناته${d.amount ? '، وصرف بدل الزيارة العائلية' : ''}.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['الزوار', d.relation], ['عدد الزوار', d.visitors], ['من تاريخ', fmtDate(d.from)], ['إلى تاريخ', fmtDate(d.to)], ['المدة', d.days ? `${d.days} يوم` : ''], ['رقم طلب الزيارة', d.visaNo], ['بدل الزيارة', d.amount ? `${fmtNum(d.amount)} ريال` : 'بدون']])}
        ${d.notes ? decisionBox('ملاحظات', esc(d.notes), true) : ''}`,
    },
    {
      id: 'bizTrip',
      group: 'شئون الموظفين',
      title: 'طلب رحلة عمل (انتداب)',
      letterTitle: 'طلب رحلة عمل',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      allowance: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'destination', label: 'جهة الانتداب (المدينة / الموقع)', required: true },
        { key: 'purpose', label: 'الغرض من الرحلة', type: 'textarea', required: true },
        { key: 'from', label: 'من تاريخ', type: 'date', required: true },
        { key: 'to', label: 'إلى تاريخ', type: 'date', required: true },
        { key: 'transport', label: 'وسيلة السفر', type: 'select', options: ['سيارة الشركة', 'سيارة خاصة', 'طيران', 'أخرى'] },
        { key: 'perDiem', label: 'بدل الانتداب اليومي (ريال)', type: 'number' },
        { key: 'expenses', label: 'مصروفات أخرى متوقعة (ريال)', type: 'number', hint: 'سكن / تذاكر' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'المدير المباشر أو مدير الفرع' },
        { key: 'days', label: 'عدد الأيام', hidden: true },
        { key: 'amount', label: 'إجمالي بدل الانتداب', hidden: true },
      ],
      summary: (d) => `رحلة عمل: ${d.name || ''} إلى ${d.destination || ''}${d.amount ? ` — ${fmtNum(d.amount)} ريال` : ''}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على انتداب الموظف الآتي بياناته في رحلة عمل إلى <b>${esc(d.destination || '....')}</b>.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['من تاريخ', fmtDate(d.from)], ['إلى تاريخ', fmtDate(d.to)], ['عدد الأيام', d.days], ['وسيلة السفر', d.transport], ['بدل الانتداب اليومي', fmtNum(d.perDiem)], ['مصروفات أخرى', fmtNum(d.expenses)], ['الإجمالي', d.amount ? `${fmtNum(d.amount)} ريال` : '']])}
        ${decisionBox('الغرض من الرحلة', esc(d.purpose || ''), true)}`,
    },
    {
      id: 'punchFix',
      group: 'شئون الموظفين',
      title: 'طلب تصحيح بصمة',
      letterTitle: 'طلب تصحيح بصمة',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'day', label: 'تاريخ اليوم المطلوب تصحيحه', type: 'date', required: true },
        { key: 'kind', label: 'نوع التصحيح', type: 'select', options: ['دخول', 'خروج', 'دخول وخروج'], required: true },
        { key: 'timeIn', label: 'وقت الدخول الصحيح', type: 'time', showIf: ['kind', ['دخول', 'دخول وخروج']] },
        { key: 'timeOut', label: 'وقت الخروج الصحيح', type: 'time', showIf: ['kind', ['خروج', 'دخول وخروج']] },
        { key: 'reason', label: 'السبب', type: 'textarea', required: true, hint: 'مثال: عطل جهاز البصمة / مهمة خارجية' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'المدير المباشر أو مدير الفرع' },
      ],
      summary: (d) => `تصحيح بصمة: ${d.name || ''} — ${fmtDate(d.day)} (${d.kind || ''})`,
      body: (d) => `<p>نرجو التكرم بالموافقة على تصحيح بصمة الموظف الآتي بياناته، ويُحدَّث سجل الحضور تلقائياً بعد الاعتماد.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['اليوم', fmtDate(d.day)], ['نوع التصحيح', d.kind], ['وقت الدخول', d.timeIn], ['وقت الخروج', d.timeOut]])}
        ${decisionBox('السبب', esc(d.reason || ''), true)}`,
    },
    {
      id: 'eosRequest',
      group: 'شئون الموظفين',
      title: 'طلب إنهاء خدمة',
      letterTitle: 'طلب إنهاء خدمة',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date', hint: 'فارغ = من سجل الموظفين' },
        { key: 'contractType', label: 'نوع العقد', type: 'select', options: ['محدد', 'غير محدد'], required: true },
        {
          key: 'endType',
          label: 'نوع إنهاء الخدمة',
          type: 'select',
          required: true,
          options: END_TYPES.map((x) => x.name),
          hint: 'حسب نظام العمل السعودي — يظهر أثره على الإشعار والمكافأة في الخطاب',
        },
        { key: 'noticeDate', label: 'تاريخ الإشعار', type: 'date', required: true },
        { key: 'lastDay', label: 'آخر يوم عمل مقترح', type: 'date', required: true },
        { key: 'reason', label: 'الأسباب / التفاصيل', type: 'textarea', required: true },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'شئون الموظفين أو مدير الإدارة' },
        { key: 'noticeDays', label: 'مدة الإشعار النظامية', hidden: true },
        { key: 'years', label: 'مدة الخدمة', hidden: true },
        { key: 'eosRule', label: 'أثر الإنهاء على المكافأة', hidden: true },
        { key: 'noticeNote', label: 'ملاحظة الإشعار', hidden: true },
      ],
      summary: (d) => `إنهاء خدمة (${d.endType || ''}): ${d.name || ''} — آخر يوم ${fmtDate(d.lastDay)}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على إنهاء خدمة الموظف الآتي بياناته وفق نظام العمل السعودي.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['تاريخ التعيين', fmtDate(d.joinDate)], ['مدة الخدمة', d.years], ['نوع العقد', d.contractType], ['نوع الإنهاء', d.endType], ['تاريخ الإشعار', fmtDate(d.noticeDate)], ['آخر يوم عمل', fmtDate(d.lastDay)], ['مدة الإشعار النظامية', d.noticeDays]])}
        ${d.noticeNote ? decisionBox('الإشعار (م 75)', esc(d.noticeNote), true) : ''}
        ${d.eosRule ? decisionBox('أثر الإنهاء على مكافأة نهاية الخدمة (م 84 / 85)', `${esc(d.eosRule)}<br><small>المبلغ يُحسب عند التصفية من حاسبة قوى الرسمية: ${esc(EOS_QIWA)}</small>`, true) : ''}
        ${decisionBox('الأسباب / التفاصيل', esc(d.reason || ''), true)}`,
    },
    {
      /* إذن انصراف / استئذان خلال الدوام: بعد الاعتماد يُسجَّل في ملف الموظف، ولا يُحتسب الخروج المبكر في ذلك اليوم */
      id: 'earlyLeave',
      group: 'شئون الموظفين',
      title: 'طلب إذن انصراف',
      letterTitle: 'طلب إذن انصراف / استئذان',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'day', label: 'اليوم', type: 'date', required: true },
        { key: 'kind', label: 'النوع', type: 'select', options: ['انصراف مبكر', 'استئذان خلال الدوام', 'تأخير صباحي'], required: true },
        { key: 'fromTime', label: 'من الساعة', type: 'time', required: true },
        { key: 'toTime', label: 'إلى الساعة', type: 'time', showIf: ['kind', ['استئذان خلال الدوام', 'تأخير صباحي']] },
        { key: 'reason', label: 'السبب', type: 'textarea', required: true },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'المدير المباشر أو مدير الفرع' },
        { key: 'hours', label: 'المدة', hidden: true },
      ],
      summary: (d) =>
        `${d.kind || 'إذن انصراف'}: ${d.name || ''} — ${fmtDate(d.day)} ${d.fromTime || ''}${d.toTime ? ` إلى ${d.toTime}` : ''}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على ${esc(d.kind || 'إذن الانصراف')} للموظف الآتي بياناته.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['اليوم', fmtDate(d.day)], ['النوع', d.kind], ['من الساعة', d.fromTime], ['إلى الساعة', d.toTime], ['المدة', d.hours]])}
        ${decisionBox('السبب', esc(d.reason || ''), true)}`,
    },
    {
      /* طلب تعديل بيانات شخصية: الموظف لا يعدّل سجله بنفسه، وبعد اعتماد شئون الموظفين تُحدَّث البيانات في ملفه تلقائياً */
      id: 'dataUpdate',
      group: 'شئون الموظفين',
      title: 'طلب تعديل بيانات شخصية',
      letterTitle: 'طلب تعديل بيانات شخصية',
      noDest: true,
      noDecisionBox: true,
      pickApprover: true,
      empLookup: true,
      hrPrep: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        {
          key: 'field',
          label: 'البيان المطلوب تعديله',
          type: 'select',
          required: true,
          options: [
            'رقم الجوال',
            'البريد الإلكتروني',
            'العنوان',
            'المدينة',
            'الحالة الاجتماعية',
            'رقم جواز السفر',
            'تاريخ انتهاء جواز السفر',
            'البنك',
            'رقم الآيبان',
          ],
        },
        {
          key: 'newValue',
          label: 'القيمة الجديدة',
          required: true,
          hint: 'للتاريخ: 2027-05-30 — وللحالة الاجتماعية: أعزب / متزوج / مطلق / أرمل',
        },
        { key: 'reason', label: 'السبب / ملاحظات', type: 'textarea' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'شئون الموظفين' },
        { key: 'oldValue', label: 'القيمة الحالية', hidden: true },
      ],
      summary: (d) => `تعديل ${d.field || 'بيانات'}: ${d.name || ''}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على تعديل البيان الآتي في ملف الموظف، ويُحدَّث سجل الموظفين تلقائياً بعد الاعتماد.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['البيان', d.field], ['القيمة الحالية', d.oldValue || '—'], ['القيمة الجديدة', d.newValue]])}
        ${d.reason ? decisionBox('السبب / ملاحظات', esc(d.reason), true) : ''}`,
    },
    {
      /* شكوى الموظف للشئون القانونية: سرية (لا يراها إلا مقدمها والشئون القانونية ومدير النظام)، وتصل مباشرة لمسئول الشئون القانونية */
      multi: true,
      id: 'legalComplaint',
      group: 'شئون الموظفين',
      title: 'شكوى للشئون القانونية',
      letterTitle: 'شكوى مقدمة للشئون القانونية',
      noDest: true,
      noDecisionBox: true,
      confidential: true,
      legalComplaint: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        {
          key: 'kind',
          label: 'نوع الشكوى',
          type: 'select',
          required: true,
          options: ['تظلم من قرار', 'مستحقات مالية', 'إساءة أو تحرش', 'مخالفة للأنظمة واللوائح', 'بيئة العمل', 'أخرى'],
        },
        { key: 'subject', label: 'موضوع الشكوى', required: true },
        { key: 'against', label: 'الشكوى ضد (اسم / جهة)', hint: 'اختياري' },
        { key: 'incidentDate', label: 'تاريخ الواقعة', type: 'date' },
        { key: 'details', label: 'تفاصيل الشكوى', type: 'textarea', required: true },
        { key: 'witnesses', label: 'الشهود (إن وُجدوا)', type: 'textarea' },
        { key: 'request', label: 'المطلوب', type: 'textarea' },
      ],
      summary: (d) => `شكوى: ${d.subject || d.kind || ''} — ${d.name || ''}`,
      body: (d) => `<p>أتقدم بهذه الشكوى للشئون القانونية للنظر فيها واتخاذ ما يلزم، مع الحفاظ على سريتها.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['نوع الشكوى', d.kind], ['الموضوع', d.subject], ['ضد', d.against || '—'], ['تاريخ الواقعة', fmtDate(d.incidentDate) || '—']])}
        ${decisionBox('تفاصيل الشكوى', esc(d.details), true)}
        ${d.witnesses ? decisionBox('الشهود', esc(d.witnesses), true) : ''}
        ${d.request ? decisionBox('المطلوب', esc(d.request), true) : ''}`,
    },
    {
      /* اعتراض الموظف على تقييم أدائه الشهري (KPI) مع السبب ← مدير إدارة الموارد البشرية — يُرفع من شاشة KPI في التطبيق */
      multi: true,
      id: 'kpiAppeal',
      group: 'شئون الموظفين',
      title: 'اعتراض على تقييم الأداء',
      letterTitle: 'اعتراض على تقييم الأداء الشهري (KPI)',
      noDest: true,
      noDecisionBox: true,
      confidential: true,
      kpiAppeal: true,
      hideNew: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'month', label: 'شهر التقييم', required: true },
        { key: 'score', label: 'الدرجة', readonly: true },
        { key: 'reason', label: 'سبب الاعتراض', type: 'textarea', required: true },
        { key: 'expected', label: 'الدرجة / التعديل المطلوب' },
      ],
      summary: (d) => `اعتراض على تقييم ${d.month || ''} — ${d.name || ''}`,
      body: (d) => `<p>أعترض على تقييم أدائي الشهري المبيّن أدناه للأسباب التالية، راجياً مراجعته.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['شهر التقييم', d.month], ['الدرجة', d.score ? `${d.score} / 100` : '—'], ['المطلوب', d.expected || '—']])}
        ${decisionBox('سبب الاعتراض', esc(d.reason), true)}`,
    },
    {
      /* تقرير عمل يرفعه الموظف لمديره المباشر (المحدد في ملفه بسجل الموظفين) */
      multi: true,
      id: 'managerReport',
      group: 'شئون الموظفين',
      title: 'تقرير عمل',
      letterTitle: 'تقرير عمل',
      noDest: true,
      noDecisionBox: true,
      managerFlow: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        {
          key: 'kind',
          label: 'نوع التقرير',
          type: 'select',
          required: true,
          options: ['تقرير يومي', 'تقرير أسبوعي', 'تقرير شهري', 'تقرير إنجاز مهمة', 'تقرير مشكلة / عائق', 'تقرير زيارة موقع', 'أخرى'],
        },
        { key: 'subject', label: 'عنوان التقرير', required: true },
        { key: 'period', label: 'الفترة / التاريخ المعني', hint: 'مثال: من 01/11 إلى 07/11' },
        { key: 'done', label: 'ما تم إنجازه', type: 'textarea', required: true },
        { key: 'issues', label: 'المعوقات والملاحظات', type: 'textarea' },
        { key: 'next', label: 'الخطة القادمة', type: 'textarea' },
        { key: 'toUser', label: 'يُوجَّه إلى', picker: 'anyUser', hint: 'اختياري — إذا تُرك فارغاً يصل للمدير المباشر' },
        { key: 'managerName', label: 'المدير المباشر', hidden: true },
      ],
      summary: (d) => `${d.kind || 'تقرير'}: ${d.subject || ''} — ${d.name || ''}`,
      body: (d) => `<p>أرفع إليكم ${esc(d.kind || 'التقرير')}${d.managerName ? ` (إلى: ${esc(d.managerName)})` : ''} للاطلاع والتوجيه.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['نوع التقرير', d.kind], ['العنوان', d.subject], ['الفترة', d.period || '—']])}
        ${decisionBox('ما تم إنجازه', esc(d.done), true)}
        ${d.issues ? decisionBox('المعوقات والملاحظات', esc(d.issues), true) : ''}
        ${d.next ? decisionBox('الخطة القادمة', esc(d.next), true) : ''}`,
    },
    {
      id: 'advanceLong',
      group: 'السلف',
      title: 'سلفة طويلة الأجل',
      letterTitle: 'طلب سلفة طويلة الأجل',
      /* إقرار الموظف يوقّعه بتوقيعه الإلكتروني المحفوظ أو بتوقيع حي عند الطلب */
      empSign: true,
      companion: 'advForm',
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        F.joinDate,
        { key: 'salary', label: 'إجمالي الراتب الشهري (ريال)', type: 'number', required: true },
        { key: 'amount', label: 'مبلغ السلفة (ريال)', type: 'number', required: true },
        { key: 'installments', label: 'عدد الأقساط الشهرية', type: 'number', required: true },
        { key: 'startMonth', label: 'بداية الخصم من راتب شهر', required: true, hint: 'مثال: نوفمبر 2026' },
        { key: 'prevBalance', label: 'رصيد سلف سابقة لم تُسدد (ريال)', type: 'number', hint: 'يُترك فارغاً إذا لا يوجد' },
        { key: 'reason', label: 'سبب السلفة', type: 'textarea', required: true },
      ],
      amountKey: 'amount',
      summary: (d) => `سلفة طويلة: ${d.name || ''}`,
      body: (d) => {
        const n = Number(d.installments) || 0;
        const monthly = n && d.amount ? Math.round((Number(d.amount) / n) * 100) / 100 : '';
        const ratio = monthly && Number(d.salary) ? `${Math.round((monthly / Number(d.salary)) * 100)}%` : '';
        return `<p class="l-para">برجاء الموافقة على صرف سلفة طويلة الأجل بمبلغ ( ${val(fmtNum(d.amount))} ) ريال سعودي ( ${val(tafqeet(d.amount), '........................')} ) للموظف الآتي بياناته :</p>
        ${infoTable([
          ['الإسم', d.name],
          ['رقم الإقامة', d.iqama],
          ['الوظيفة', d.job],
          ['الفرع', d.branch],
          ['تاريخ التعيين', fmtDate(d.joinDate)],
          ['إجمالي الراتب', fmtNum(d.salary)],
        ])}
        <h4 class="l-sec">طريقة السداد :</h4>
        <table class="lt grid"><thead><tr><th>مبلغ السلفة</th><th>عدد الأقساط</th><th>القسط الشهري</th><th>نسبة القسط من الراتب</th><th>بداية الخصم</th><th>رصيد سلف سابقة</th></tr></thead>
        <tbody><tr><td>${esc(fmtNum(d.amount))}</td><td>${esc(d.installments)}</td><td><b>${esc(fmtNum(monthly))}</b></td><td>${esc(ratio)}</td><td>${esc(d.startMonth)}</td><td>${d.prevBalance ? esc(fmtNum(d.prevBalance)) : 'لا يوجد'}</td></tr></tbody></table>
        <p><b>سبب السلفة :</b> ${val(d.reason)}</p>
        <div class="l-notes"><b>إقرار الموظف :</b><br>أتعهد أنا الموظف / ${val(d.name, '....................')} بسداد مبلغ السلفة الموضح أعلاه، وأوافق على خصم الأقساط من راتبي الشهري كما هو مبين، وفي حالة انتهاء خدمتي لأي سبب قبل سداد كامل المبلغ يحق للشركة خصم المتبقي من مستحقاتي.
        ${empSigLine(d)}</div>`;
      },
    },
    {
      id: 'advanceShort',
      group: 'السلف',
      title: 'سلفة قصيرة الأجل',
      letterTitle: 'طلب سلفة قصيرة الأجل',
      /* إقرار الموظف يوقّعه بتوقيعه الإلكتروني المحفوظ أو بتوقيع حي عند الطلب */
      empSign: true,
      /* محاسب الفرع ومدير الفرع يوقّعان على الورق، والمدير المالي يعتمد من النظام */
      extraSigs: ['محاسب الفرع', 'مدير الفرع'],
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'salary', label: 'إجمالي الراتب الشهري (ريال)', type: 'number', required: true },
        { key: 'amount', label: 'مبلغ السلفة (ريال)', type: 'number', required: true },
        { key: 'deductMonth', label: 'تُخصم من راتب شهر', required: true, hint: 'مثال: نوفمبر 2026' },
        { key: 'reason', label: 'سبب السلفة', type: 'textarea', required: true },
      ],
      amountKey: 'amount',
      summary: (d) => `سلفة قصيرة: ${d.name || ''}`,
      body: (
        d,
      ) => `<p class="l-para">برجاء الموافقة على صرف سلفة قصيرة الأجل بمبلغ ( ${val(fmtNum(d.amount))} ) ريال سعودي ( ${val(tafqeet(d.amount), '........................')} ) للموظف الآتي بياناته، على أن تُخصم دفعة واحدة من راتب شهر ( ${val(d.deductMonth)} ) :</p>
        ${infoTable([
          ['الإسم', d.name],
          ['رقم الإقامة', d.iqama],
          ['الوظيفة', d.job],
          ['الفرع', d.branch],
          ['إجمالي الراتب', fmtNum(d.salary)],
          ['مبلغ السلفة', fmtNum(d.amount)],
        ])}
        <p><b>سبب السلفة :</b> ${val(d.reason)}</p>
        <div class="l-notes"><b>إقرار الموظف :</b><br>أتعهد أنا الموظف / ${val(d.name, '....................')} بسداد مبلغ السلفة الموضح أعلاه، وأوافق على خصمه كاملاً من راتب الشهر المحدد.
        ${empSigLine(d)}</div>`,
    },
    {
      id: 'deduction',
      group: 'الخصومات والتصفية',
      title: 'نموذج خصم من المدير المباشر',
      noDest: true,
      /* بدون صندوق "قرار الإدارة المالية"؛ الاعتمادات تظهر في خانات التوقيع */
      noDecisionBox: true,
      extraSigs: ['الشئون القانونية'],
      /* مدير الفرع يعتمد في المسار بدون خانة توقيع على الخطاب */
      hideSigs: ['مدير الفرع'],
      fields: DED_FIELDS,
      amountKey: 'value',
      body: (d) => dedBody(d),
    },
    {
      /* خصم بناءً على تحقيق تجريه الشئون القانونية: نفس بيانات الخصم + بيانات التحقيق وتقريره */
      id: 'legalDeduction',
      group: 'الخصومات والتصفية',
      title: 'نموذج خصم من الشئون القانونية',
      noDest: true,
      noDecisionBox: true,
      /* ترفعه الشئون القانونية لفرع الموظف، ودورته: محاسب الفرع ← مدير قسم الرواتب ← محاسب إدارة الرواتب */
      legalFlow: true,
      hidePrep: true,
      requiredAttachments: ['تقرير التحقيق'],
      fields: [
        F.date,
        F.name,
        { ...F.branch, label: 'الإدارة / الفرع' },
        F.iqama,
        F.job,
        { key: 'invNo', label: 'رقم التحقيق', required: true },
        { key: 'invDate', label: 'تاريخ التحقيق', type: 'date', required: true },
        { key: 'invResult', label: 'نتيجة التحقيق / توصية الشئون القانونية', type: 'textarea', required: true },
        DED_FIELDS[5],
        /* الشئون القانونية تحدد الجزاء (مثل خصم يومين)، ومحاسب إدارة الرواتب يحوّله لقيمة بالريال في آخر مرحلة */
        {
          key: 'penalty',
          label: 'الجزاء المقرر (مقدار الخصم)',
          required: true,
          hint: 'مثال: خصم يومين من الراتب — القيمة بالريال يحددها محاسب إدارة الرواتب',
        },
      ],
      amount: (d) => (d.tasks && d.tasks.payrollApply && d.tasks.payrollApply.value) || d.value || '',
      body: (d) =>
        dedBody(
          d,
          `<h4 class="l-sec">ثانياً : بيانات التحقيق :</h4>
        <table class="lt"><tr><td class="lbl">رقم التحقيق</td><td>${esc(d.invNo)}</td><td class="lbl">تاريخ التحقيق</td><td>${esc(fmtDate(d.invDate))}</td></tr>
        <tr><td class="lbl">نتيجة التحقيق</td><td colspan="3" style="height:50px;vertical-align:top;white-space:pre-wrap">${esc(d.invResult)}</td></tr></table>`,
          'بناءً على التحقيق المشار إليه أعلاه، تقرر الخصم من راتب الموظف وفق البيانات التالية.',
          true,
        ) + legalApply(d),
    },
    {
      /* تظلم الموظف من قرار خصم الشئون القانونية المعتمد: يُرفع من «قراراتي» في التطبيق (أو ملفه) — سري ويصل للشئون القانونية */
      multi: true,
      id: 'deductionAppeal',
      group: 'شئون الموظفين',
      title: 'تظلم من قرار خصم',
      letterTitle: 'تظلم من قرار خصم',
      noDest: true,
      noDecisionBox: true,
      confidential: true,
      legalAppeal: true,
      hideNew: true,
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.job,
        F.branch,
        { key: 'decisionSerial', label: 'رقم قرار الخصم', hint: 'يُملأ تلقائياً من القرار' },
        { key: 'penalty', label: 'الجزاء المقرر' },
        { key: 'decisionReason', label: 'سبب الخصم', type: 'textarea' },
        { key: 'appeal', label: 'أسباب التظلم', type: 'textarea', required: true },
        { key: 'request', label: 'المطلوب', type: 'textarea' },
        { key: 'decisionId', label: 'القرار', hidden: true },
      ],
      summary: (d) => `تظلم من قرار الخصم ${d.decisionSerial || ''} — ${d.name || ''}`,
      body: (d) => `<p>أتقدم بهذا التظلم على قرار الخصم المبيّن أدناه، راجياً إعادة النظر فيه.</p>
        ${infoTable([...basicPairs(d), ['الفرع', d.branch], ['رقم قرار الخصم', d.decisionSerial], ['الجزاء المقرر', d.penalty || '—']])}
        ${d.decisionReason ? decisionBox('سبب الخصم', esc(d.decisionReason), true) : ''}
        ${decisionBox('أسباب التظلم', esc(d.appeal), true)}
        ${d.request ? decisionBox('المطلوب', esc(d.request), true) : ''}`,
    },
    /* نماذج إدارة الحركة في ملف مستقل (forms-traffic.js): محضر تسليم المركبة، وكارت السيارة، وتغيير الزيت، وسداد المخالفة، وصيانة المركبة */
    ...FORM_PARTS.flatMap((part) =>
      part({ F, infoTable, esc, fmtDate, fmtNum, tafqeet, MAINT_TYPES, EXT_WORKSHOP, VEH_TYPES, VEH_PAPER, VEH_IMG, vehDiagram }),
    ),
    {
      id: 'clearance',
      group: 'الخصومات والتصفية',
      title: 'بيان الخصومات والعهد لإدراجها بتصفية موظف',
      fields: [
        F.date,
        F.name,
        F.iqama,
        F.branch,
        {
          key: 'deductions',
          label: 'خصومات الموظف',
          type: 'table',
          columns: [
            {
              key: 'type',
              label: 'نوع الخصم',
              type: 'select',
              options: ['سلف', 'عهدة نقدية', 'مصروفات إدارية', 'مخالفات مرورية', 'خصومات أخرى'],
            },
            { key: 'amount', label: 'القيمة', type: 'number' },
          ],
        },
        {
          key: 'assets',
          label: 'العهد العينية',
          type: 'table',
          columns: [
            { key: 'type', label: 'العهدة', type: 'select', options: ['جوال', 'شريحة إتصال', 'لاب توب', 'سيارة', 'أخرى'] },
            { key: 'spec', label: 'المواصفات' },
            { key: 'receiver', label: 'المستلم' },
            { key: 'date', label: 'التاريخ', type: 'date' },
          ],
        },
      ],
      summary: (d) => `تصفية: ${d.name || ''}`,
      amount: (d) => (d.deductions || []).reduce((s, r) => s + (Number(r.amount) || 0), 0),
      body: (d) => {
        const ded = d.deductions || [],
          as = d.assets || [];
        const total = ded.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        return `<p class="l-para">فيما يلي بيان بكل ما يخص الموظف / ${val(d.name)} رقم إقامة : ${val(d.iqama)} فرع ${val(d.branch)} من قيمة خصومات وعهد نقدية وعينية وطريقة تسليمها قبل إعداد التصفية.</p>
        <h4 class="l-sec">خصومات الموظف :</h4>
        <table class="lt grid"><thead><tr><th>نوع الخصم</th><th>القيمة المادية</th></tr></thead><tbody>
        ${ded.map((r) => `<tr><td>${esc(r.type)}</td><td class="red">${esc(fmtNum(r.amount))}</td></tr>`).join('') || '<tr><td colspan="2">لا يوجد</td></tr>'}
        <tr class="total"><td>إجمالي الخصومات</td><td class="red">${esc(fmtNum(total))}</td></tr></tbody></table>
        <h4 class="l-sec">العهد العينية :</h4>
        <table class="lt grid"><thead><tr><th>العهدة</th><th>المواصفات</th><th>المستلم</th><th>التاريخ</th></tr></thead><tbody>
        ${as.map((r) => `<tr><td>${esc(r.type)}</td><td>${esc(r.spec || '-')}</td><td>${esc(r.receiver || '-')}</td><td>${esc(fmtDate(r.date) || '-')}</td></tr>`).join('') || '<tr><td colspan="4">لا يوجد</td></tr>'}
        </tbody></table>`;
      },
    },
    {
      /* يرسله مسئول التوظيف، وتملأ كل مرحلة جزءها: شئون الموظفين ← اللجنة الفنية ← مدير قسم الرواتب ← رئيس لجنة التوظيف */
      id: 'hiring',
      group: 'التوظيف',
      title: 'طلب توظيف',
      letterTitle: 'استمارة بيانات مرشح للتوظيف',
      hiringFlow: true,
      /* فيه الراتب المعروض: لا يراه إلا مقدمه ومن في مساره ومدير النظام */
      confidential: true,
      noDest: true,
      noDecisionBox: true,
      hidePrep: true,
      issuer: 'مسئول التوظيف',
      /* بعد الاعتماد النهائي يتولد العرض الوظيفي من بيانات الطلب */
      companion: 'offer',
      sigTasks: {
        hireHr: 'مسئول شئون الموظفين',
        hireTech: 'مسئول اللجنة الفنية',
        hireSalary: 'مدير قسم الرواتب',
        hireDecision: 'رئيس لجنة التوظيف',
      },
      requiredAttachments: ['السيرة الذاتية', 'شهادة المؤهل', 'صورة الهوية / الإقامة'],
      fields: [
        { ...F.date, label: 'تاريخ الطلب' },
        { ...F.name, label: 'اسم المرشح' },
        { key: 'citizenship', label: 'سعودي / مقيم', type: 'select', options: ['سعودي', 'مقيم'], required: true },
        /* تظهر وتُطلب عند اختيار "مقيم" فقط */
        { key: 'nationality', label: 'الجنسية', required: true, showIf: ['citizenship', 'مقيم'] },
        { ...F.iqama, label: 'رقم الهوية / الإقامة / الجواز' },
        /* للمقيم: تاريخ انتهاء الإقامة، والمتبقي فيها يُحسب تلقائياً من تاريخ الطلب */
        { key: 'iqamaExpiry', label: 'تاريخ انتهاء الإقامة', type: 'date', required: true, showIf: ['citizenship', 'مقيم'] },
        { ...F.prof, label: 'المهنة في الإقامة', required: true, showIf: ['citizenship', 'مقيم'] },
        { key: 'birthDate', label: 'تاريخ الميلاد', type: 'date' },
        { key: 'marital', label: 'الحالة الاجتماعية', type: 'select', options: ['أعزب', 'متزوج', 'أخرى'] },
        { key: 'phone', label: 'رقم الجوال', required: true },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'city', label: 'العنوان' },
        { ...F.job, label: 'الوظيفة المرشح لها', required: true },
        /* اختيار من فروع النظام (لا يُملأ تلقائياً بفرع مرسل الطلب) */
        { key: 'branch', label: 'مكان التوظيف', required: true, choicesFrom: 'branches' },
        /* عضو اللجنة الفنية المختص بالوظيفة (مالي، هندسي، جيولوجي...): القائمة من الإعدادات، والطلب يذهب إليه وحده */
        {
          key: 'techReviewer',
          label: 'يوجَّه لعضو اللجنة الفنية',
          required: true,
          choicesFrom: 'hireTech',
          hint: 'اختر العضو المختص بتخصص الوظيفة',
        },
        {
          key: 'qualification',
          label: 'المؤهل العلمي',
          type: 'select',
          options: ['ثانوية عامة', 'دبلوم', 'بكالوريوس', 'ليسانس', 'أخرى'],
          required: true,
        },
        { key: 'major', label: 'تخصص المؤهل' },
        { key: 'postgrad', label: 'الدراسات العليا', type: 'select', options: ['لا يوجد', 'ماجستير', 'دكتوراه'] },
        /* يظهر ويُطلب عند اختيار ماجستير أو دكتوراه */
        { key: 'postgradMajor', label: 'تخصص الدراسات العليا', required: true, showIf: ['postgrad', ['ماجستير', 'دكتوراه']] },
        { key: 'gradYear', label: 'سنة التخرج' },
        {
          key: 'membership',
          label: 'العضوية المهنية',
          type: 'select',
          options: ['لا يوجد', ...HIRE_BODIES],
          hint: 'عضوية هيئة تشترطها الوظيفة (مهندسين، محاسبين، قانونيين...)',
        },
        { key: 'membershipOther', label: 'اسم الهيئة', required: true, showIf: ['membership', 'أخرى'] },
        { key: 'membershipNo', label: 'رقم العضوية', required: true, showIf: ['membership', HIRE_BODIES] },
        { key: 'membershipExpiry', label: 'تاريخ انتهاء العضوية', type: 'date', showIf: ['membership', HIRE_BODIES] },
        { key: 'experience', label: 'سنوات الخبرة', type: 'number' },
        { key: 'lastEmployer', label: 'آخر جهة عمل' },
        { key: 'inKingdom', label: 'موجود داخل المملكة؟', type: 'select', options: ['نعم', 'لا'] },
        /* بيانات التعاقد يكتبها مرسل الطلب (مسئول التوظيف) */
        ...TASKS.hireHr.fields.filter((f) => f.key !== 'hrNote'),
        { key: 'recruiterNote', label: 'ملاحظات مسئول التوظيف', type: 'textarea' },
      ],
      noNote: true,
      summary: (d) => `${d.name || ''}${d.job ? ` — ${d.job}` : ''}`,
      body: hireBody,
    },
    {
      /* قرار نقل موظف بين الفروع: يوقّعه مدير الفرع المنقول منه ← مدير الفرع المنقول إليه ← المعتمد المختص (المدير المالي للمحاسبين، أو مدير المكتب الفني، أو مدير المتابعة والإشراف) ← شئون الموظفين (transferSteps بالخادم) */
      id: 'empTransfer',
      group: 'شئون الموظفين',
      title: 'قرار نقل موظف',
      letterTitle: 'قرار نقل',
      transferFlow: true,
      hijri: true,
      noDest: true,
      noDecisionBox: true,
      hidePrep: true,
      /* خانة التوقيع باسم المرحلة: مدير فرع مكة، مدير فرع جدة... */
      sigLabel: 'step',
      fields: [
        F.date,
        /* موظف أو أكثر ينتقلون معاً من نفس الفرع إلى نفس الفرع */
        {
          key: 'employees',
          label: 'الموظفون المنقولون',
          type: 'table',
          required: true,
          columns: [
            { key: 'name', label: 'اسم الموظف' },
            { key: 'iqama', label: 'رقم الإقامة / الهوية' },
            { key: 'job', label: 'الوظيفة' },
          ],
        },
        /* بدون قيمة افتراضية لغير المحاسب (يختار شئون الموظفين الفرع)، ومحاسب الفرع مقفول على فرعه */
        { ...F.branch, label: 'من فرع (المنقول منه)', choicesFrom: 'branches', fromUser: undefined },
        { key: 'toBranch', label: 'إلى فرع (المنقول إليه)', required: true, choicesFrom: 'branches' },
        { key: 'staffRef', label: 'رقم طلب الموظف المرتبط', hint: 'يُملأ تلقائياً إذا أُنشئ القرار من "طلب موظف / موارد بشرية"' },
        {
          key: 'approver',
          label: 'يعتمد قرار النقل',
          required: true,
          choicesFrom: 'transApprovers',
          hint: 'المدير المالي إذا كان الموظف محاسباً، أو مدير المكتب الفني، أو مدير المتابعة والإشراف',
        },
        { key: 'effectiveDate', label: 'تاريخ المباشرة في الفرع الجديد', type: 'date' },
        {
          key: 'payBranch',
          label: 'الفرع الذي يتحمل راتب شهر النقل',
          type: 'select',
          options: TR_PAY,
          hint: 'تلقائياً من تاريخ المباشرة: يوم 15 أو قبله ← الفرع المنقول إليه، بعد 15 ← الفرع المنقول منه (يظهر في بيان رواتبه هذا الشهر فقط)',
        },
        { key: 'reason', label: 'سبب النقل', type: 'textarea' },
      ],
      summary: (d) => {
        const e = transferEmps(d);
        return `${(e[0] || {}).name || ''}${e.length > 1 ? ` و${e.length - 1} آخرين` : ''} — من ${d.branch || '...'} إلى ${d.toBranch || '...'}`;
      },
      body: (d) => {
        const e = transferEmps(d),
          many = e.length > 1;
        const pb = trPayBranch(d);
        const where = `من <b class="red">فرع ${esc(d.branch || '..........')}</b> إلى <b class="red">فرع ${esc(d.toBranch || '..........')}</b>${d.effectiveDate ? ` اعتباراً من ${esc(fmtDate(d.effectiveDate))}م` : ''}${d.effectiveDate && pb ? `، ويتحمل <b>فرع ${esc(pb)}</b> راتب شهر النقل` : ''}`;
        return many
          ? `<p class="l-para" style="font-size:17px;margin:10mm 0 4mm">▪ يتم نقل الموظفين الآتي بياناتهم ${where} .</p>
            <table class="lt grid"><thead><tr><th style="width:8%">م</th><th>اسم الموظف</th><th>رقم الإقامة / الهوية</th><th>الوظيفة</th></tr></thead><tbody>${e.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.name)}</td><td>${esc(x.iqama)}</td><td>${esc(x.job)}</td></tr>`).join('')}</tbody></table>`
          : `<p class="l-para" style="font-size:17px;margin:10mm 0 4mm">▪ يتم نقل الموظف / ${val((e[0] || {}).name, '....................')} ${where} .</p>
            ${infoTable([
              ['رقم الإقامة / الهوية', (e[0] || {}).iqama],
              ['الوظيفة', (e[0] || {}).job],
            ])}`;
      },
      bodyNote: (d) => `${d.reason ? `<div class="l-notes"><b>سبب النقل :</b><br>${esc(d.reason).replace(/\n/g, '<br>')}</div>` : ''}`,
    },
    {
      /* طلب استعارة جهاز نوعي من الإدارة: محاسب الفرع يطلبه ← مدير الفرع يوقّع ← مسئول الجرد يسلّمه ويعتمد (loanSteps بالخادم) */
      id: 'deviceLoan',
      group: 'إدارة الجرد',
      title: 'طلب استعارة جهاز',
      letterTitle: 'طلب استعارة جهاز',
      loanFlow: true,
      noDest: true,
      noDecisionBox: true,
      sigTasks: { loanIssue: 'مسئول الجرد' },
      fields: [
        F.date,
        F.branch,
        { key: 'device', label: 'الجهاز المطلوب', required: true, hint: 'اكتب اسم الجهاز ومواصفاته (نوعي أو عادي)' },
        { key: 'fromDate', label: 'بداية فترة الاستعارة', type: 'date', required: true },
        { key: 'toDate', label: 'نهاية فترة الاستعارة', type: 'date', required: true },
        { key: 'purpose', label: 'الغرض من الاستعارة (المشروع / العمل)', type: 'textarea', required: true },
        { key: 'location', label: 'مكان الاستخدام' },
      ],
      summary: (d) => `${(d.dev || {}).name || ''} — ${d.branch || ''}`,
      body: (d) => {
        const v = d.dev || {},
          t = (d.tasks || {}).loanIssue || {};
        return `<p class="l-para">نرجو الموافقة على إعارة الجهاز الآتي بياناته لفرع <b>${esc(d.branch || '..........')}</b> :</p>
          ${infoTable([
            ['اسم الجهاز', v.name],
            ['الماركة', v.brand],
            ['الموديل', v.model],
            ['السيريال', v.serial],
            ['التكويد', v.code],
            ['الفرع المستعير', d.branch],
          ])}
          ${infoTable([
            ['بداية الاستعارة', fmtDate(d.fromDate)],
            ['نهاية الاستعارة', fmtDate(d.toDate)],
            ['مدة الاستعارة', d.fromDate && d.toDate ? `${(daysBetween(d.fromDate, d.toDate) || 0) + 1} يوم` : ''],
            ['مكان الاستخدام', d.location],
          ])}
          <table class="lt"><tr><td class="lbl">الغرض من الاستعارة</td><td style="white-space:pre-wrap">${esc(d.purpose)}</td></tr></table>
          ${
            t.deliveryDate
              ? `<h4 class="l-sec">تسليم الجهاز :</h4>${infoTable([
                  ['تاريخ التسليم', fmtDate(t.deliveryDate)],
                  ['تاريخ الإرجاع المعتمد', fmtDate(t.returnDue)],
                  ['حالة الجهاز عند التسليم', t.condition],
                  ['ملاحظات مسئول الجرد', t.issueNote],
                ])}`
              : ''
          }
          <div class="l-notes"><b>تعهد الفرع :</b><br>يتعهد الفرع بالمحافظة على الجهاز واستخدامه في الغرض المذكور، وإرجاعه للإدارة بحالته في موعد الإرجاع المعتمد.</div>`;
      },
    },
    {
      /* طلب صيانة جهاز من جرد الفرع: محاسب الفرع يطلب ← مسئول الجرد يعتمد ويحوّل ← مسئول الصيانة يحدد العطل والإجراء ويتراسل مع المحاسب ثم يقفل الطلب (devMaintSteps بالخادم) */
      id: 'deviceMaint',
      group: 'إدارة الجرد',
      title: 'طلب صيانة جهاز',
      letterTitle: 'طلب صيانة جهاز',
      devMaintFlow: true,
      noDest: true,
      noDecisionBox: true,
      doneText: 'مقفول',
      sigTasks: { dmForward: 'مسئول الجرد', dmClose: 'مسئول الصيانة' },
      /* الفرع يُؤخذ من مكان الجهاز في الجرد (ولمحاسب الفرع من حسابه) */
      fields: [
        F.date,
        { ...F.branch, required: false, hint: 'يُحدَّد تلقائياً من مكان الجهاز في الجرد' },
        { key: 'item', label: 'الجهاز', required: true, choicesFrom: 'invItems', hint: 'من جرد الفرع فقط' },
        { key: 'fault', label: 'وصف العطل / المشكلة', type: 'textarea', required: true },
        { key: 'urgency', label: 'الأولوية', type: 'select', options: ['عادي', 'عاجل'], required: true },
        { key: 'location', label: 'مكان الجهاز (المختبر / الموقع)' },
      ],
      summary: (d) => `${(d.inv || {}).name || ''} — ${d.branch || ''}`,
      body: (d) => {
        const v = d.inv || {},
          t = d.tasks || {},
          fw = t.dmForward || {},
          c = t.dmClose || {},
          th = d.thread || [],
          h = d.hist || {};
        const pre = (s) => esc(s).replace(/\n/g, '<br>');
        return `<p class="l-para">نرجو التكرم بصيانة الجهاز الآتي بياناته من جرد فرع <b>${esc(d.branch || '..........')}</b> :</p>
          ${infoTable([
            ['الجهاز', v.name],
            ['البيان (إنجليزي)', v.en],
            ['الماركة', v.brand],
            ['السيريال', v.serial],
            ['التكويد', v.code],
            ['قسم الجرد', v.section],
            ['مكان الجهاز', d.location],
            ['الأولوية', d.urgency],
          ])}
          <table class="lt"><tr><td class="lbl">وصف العطل</td><td>${pre(d.fault)}</td></tr></table>
          ${
            h.total
              ? `<h4 class="l-sec">سجل أعطال الجهاز السابقة :</h4>${h.recent ? `<div class="l-notes" style="border-color:#c0392b;color:#c0392b"><b>⚠ تكرر عطل هذا الجهاز : ${h.recent} ${h.recent > 1 ? 'مرات' : 'مرة'} خلال آخر ${h.days} يوماً</b> (إجمالي الأعطال السابقة : ${h.total})</div>` : ''}
          <table class="lt grid sm"><tr><th style="width:110px">رقم الطلب</th><th style="width:80px">التاريخ</th><th>العطل</th><th style="width:110px">النتيجة</th></tr>${(h.items || []).map((x) => `<tr><td>${esc(x.serial)}</td><td>${fmtDate(x.date)}</td><td>${pre(x.fault)}${x.diagnosis ? `<br><small>التشخيص : ${esc(x.diagnosis)}</small>` : ''}</td><td>${esc(x.result || { pending: 'جارٍ', rejected: 'مرفوض', returned: 'معاد' }[x.status] || '')}</td></tr>`).join('')}</table>`
              : ''
          }
          ${fw.fwdNote ? `<div class="l-notes"><b>ملاحظات مسئول الجرد :</b><br>${pre(fw.fwdNote)}</div>` : ''}
          ${th.length ? `<h4 class="l-sec">المراسلات بين مسئول الصيانة والفرع :</h4><table class="lt grid sm"><tr><th style="width:90px">التاريخ</th><th style="width:150px">من</th><th>الرد</th></tr>${th.map((m) => `<tr><td>${fmtDate(String(m.at).slice(0, 10))}</td><td>${esc(m.name)}<br><small>${m.side === 'maint' ? 'مسئول الصيانة' : 'الفرع'}</small></td><td>${pre(m.text)}</td></tr>`).join('')}</table>` : ''}
          ${
            c.result
              ? `<h4 class="l-sec">نتيجة الصيانة :</h4>${infoTable([
                  ['النتيجة', c.result],
                  ['تاريخ الإقفال', fmtDate(c.closeDate)],
                  ['التكلفة', c.cost ? `${fmtNum(c.cost)} ريال` : ''],
                ])}
          <table class="lt"><tr><td class="lbl">العطل</td><td>${pre(c.diagnosis)}</td></tr><tr><td class="lbl">الإجراء المتخذ</td><td>${pre(c.remedy)}</td></tr></table>`
              : ''
          }`;
      },
    },
    {
      /* طلب تجديد إقامة: محاسب الفرع يرفعه مع صورة الإقامة القديمة ← شئون الموظفين تسجّل تاريخ الانتهاء الجديد (يُحدَّث في سجل الموظفين) */
      id: 'iqamaRenew',
      group: 'شئون الموظفين',
      title: 'طلب تجديد إقامة',
      letterTitle: 'طلب تجديد إقامة',
      noDest: true,
      issuer: 'محاسب الفرع',
      noDecisionBox: true,
      empLookup: true,
      hrFlow: true,
      hrTask: 'iqRenewDone',
      hijri: true,
      sigTasks: { iqRenewDone: 'شئون الموظفين' },
      requiredAttachments: ['صورة الإقامة القديمة'],
      fields: [
        F.date,
        F.branch,
        { ...F.name, label: 'اسم الموظف' },
        { ...F.iqama, label: 'رقم الإقامة' },
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'nationality', label: 'الجنسية' },
        { ...F.job, label: 'المسمى الوظيفي' },
        { key: 'passport', label: 'رقم الجواز' },
        { key: 'iqamaEnd', label: 'تاريخ انتهاء الإقامة الحالية', type: 'date', required: true },
        { key: 'period', label: 'مدة التجديد', type: 'select', options: ['سنة', 'سنتان', '6 أشهر', '3 أشهر', '9 أشهر'], required: true },
      ],
      summary: (d) => `${d.name || ''} — تنتهي ${fmtDate(d.iqamaEnd)}`,
      body: (d) => {
        const t = (d.tasks || {}).iqRenewDone || {};
        return `<p class="l-para">نرجو التكرم بتجديد إقامة الموظف الآتي بياناته لمدة <b>${esc(d.period || '........')}</b> :</p>
          ${infoTable([
            ['اسم الموظف', d.name],
            ['رقم الإقامة', d.iqama],
            ['الرقم الوظيفي', d.empNo],
            ['الجنسية', d.nationality],
            ['المسمى الوظيفي', d.job],
            ['رقم الجواز', d.passport],
            ['الفرع', d.branch],
            [
              'انتهاء الإقامة الحالية',
              d.iqamaEnd ? `${fmtDate(d.iqamaEnd)}${hijri(d.iqamaEnd) ? ` — الموافق ${hijri(d.iqamaEnd)}هـ` : ''}` : '',
            ],
          ])}
          <p class="l-para">مرفق صورة الإقامة القديمة.</p>
          ${
            t.newIqamaEnd
              ? `<h4 class="l-sec">تنفيذ التجديد (شئون الموظفين) :</h4>${infoTable([
                  [
                    'تاريخ الانتهاء الجديد',
                    `${fmtDate(t.newIqamaEnd)}${hijri(t.newIqamaEnd) ? ` — الموافق ${hijri(t.newIqamaEnd)}هـ` : ''}`,
                  ],
                  ['تكلفة التجديد', t.renewCost ? `${fmtNum(t.renewCost)} ريال` : ''],
                ])}${t.doneNote ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(t.doneNote).replace(/\n/g, '<br>')}</div>` : ''}`
              : ''
          }`;
      },
    },
    {
      /* خروج وعودة / تمديد خروج وعودة: في التمديد يُحدَّد من يتحمل تكلفته (الشركة / الموظف) وقيمتها ← شئون الموظفين */
      id: 'exitReentry',
      group: 'شئون الموظفين',
      title: 'طلب خروج وعودة / تمديد',
      letterTitle: (d) => (d.kind === 'تمديد خروج وعودة' ? 'طلب تمديد تأشيرة خروج وعودة' : 'طلب تأشيرة خروج وعودة'),
      noDest: true,
      issuer: 'محاسب الفرع',
      noDecisionBox: true,
      empLookup: true,
      hrFlow: true,
      hrTask: 'exitDone',
      hijri: true,
      sigTasks: { exitDone: 'شئون الموظفين' },
      fields: [
        F.date,
        F.branch,
        { ...F.name, label: 'اسم الموظف' },
        { ...F.iqama, label: 'رقم الإقامة' },
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'nationality', label: 'الجنسية' },
        { ...F.job, label: 'المسمى الوظيفي' },
        { key: 'passport', label: 'رقم الجواز' },
        { key: 'kind', label: 'نوع الطلب', type: 'select', options: ['خروج وعودة', 'تمديد خروج وعودة'], required: true },
        {
          key: 'visaType',
          label: 'نوع التأشيرة',
          type: 'select',
          options: ['مفردة', 'متعددة'],
          showIf: ['kind', 'خروج وعودة'],
          required: true,
        },
        { key: 'days', label: 'المدة المطلوبة (بالأيام)', type: 'number', showIf: ['kind', 'خروج وعودة'], required: true },
        { key: 'travelDate', label: 'تاريخ السفر المتوقع', type: 'date', showIf: ['kind', 'خروج وعودة'] },
        { key: 'destination', label: 'جهة السفر', showIf: ['kind', 'خروج وعودة'] },
        { key: 'visaNo', label: 'رقم التأشيرة الحالية', showIf: ['kind', 'تمديد خروج وعودة'], required: true },
        { key: 'visaEnd', label: 'تاريخ انتهاء التأشيرة الحالية', type: 'date', showIf: ['kind', 'تمديد خروج وعودة'], required: true },
        { key: 'extendDays', label: 'مدة التمديد (بالأيام)', type: 'number', showIf: ['kind', 'تمديد خروج وعودة'], required: true },
        {
          key: 'payer',
          label: 'من يتحمل تكلفة التمديد',
          type: 'select',
          options: ['الشركة', 'الموظف'],
          showIf: ['kind', 'تمديد خروج وعودة'],
          required: true,
        },
        { key: 'cost', label: 'قيمة تكلفة التمديد (ريال)', type: 'number', showIf: ['kind', 'تمديد خروج وعودة'], required: true },
        { key: 'reason', label: 'السبب', type: 'textarea' },
      ],
      summary: (d) => `${d.name || ''} — ${d.kind || ''}${d.kind === 'تمديد خروج وعودة' && d.payer ? ` (على ${d.payer})` : ''}`,
      amountKey: 'cost',
      body: (d) => {
        const ext = d.kind === 'تمديد خروج وعودة',
          t = (d.tasks || {}).exitDone || {};
        return `<p class="l-para">${ext ? 'نرجو التكرم بتمديد تأشيرة الخروج والعودة' : 'نرجو التكرم بإصدار تأشيرة خروج وعودة'} للموظف الآتي بياناته :</p>
          ${infoTable([
            ['اسم الموظف', d.name],
            ['رقم الإقامة', d.iqama],
            ['الرقم الوظيفي', d.empNo],
            ['الجنسية', d.nationality],
            ['المسمى الوظيفي', d.job],
            ['رقم الجواز', d.passport],
            ['الفرع', d.branch],
            ['نوع الطلب', d.kind],
          ])}
          ${
            ext
              ? infoTable([
                  ['رقم التأشيرة الحالية', d.visaNo],
                  ['تنتهي في', fmtDate(d.visaEnd)],
                  ['مدة التمديد', d.extendDays ? `${d.extendDays} يوم` : ''],
                  ['يتحمل التكلفة', d.payer],
                ]) +
                `<table class="lt"><tr><td class="lbl">قيمة تكلفة التمديد</td><td><b>${d.cost ? `${fmtNum(d.cost)} ريال` : ''}</b>${d.cost ? ` (${tafqeet(d.cost)})` : ''}${d.payer === 'الموظف' ? ' — تُخصم من الموظف' : d.payer === 'الشركة' ? ' — على حساب الشركة' : ''}</td></tr></table>`
              : infoTable([
                  ['نوع التأشيرة', d.visaType],
                  ['المدة', d.days ? `${d.days} يوم` : ''],
                  ['تاريخ السفر المتوقع', fmtDate(d.travelDate)],
                  ['جهة السفر', d.destination],
                ])
          }
          ${d.reason ? `<div class="l-notes"><b>السبب :</b><br>${esc(d.reason).replace(/\n/g, '<br>')}</div>` : ''}
          ${
            t.visaEnd
              ? `<h4 class="l-sec">إصدار التأشيرة (شئون الموظفين) :</h4>${infoTable([
                  ['رقم التأشيرة', t.visaNo],
                  ['تنتهي في', `${fmtDate(t.visaEnd)}${hijri(t.visaEnd) ? ` — الموافق ${hijri(t.visaEnd)}هـ` : ''}`],
                ])}${t.doneNote ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(t.doneNote).replace(/\n/g, '<br>')}</div>` : ''}`
              : ''
          }`;
      },
    },
    {
      /* نقل كفالة موظف: من الكفالة الحالية إلى الجديدة ← شئون الموظفين تنفّذ (الكفالة الجديدة تُسجَّل في سجل الموظفين) */
      id: 'sponsorTransfer',
      group: 'شئون الموظفين',
      title: 'طلب نقل كفالة موظف',
      letterTitle: 'طلب نقل كفالة موظف',
      noDest: true,
      issuer: 'محاسب الفرع',
      noDecisionBox: true,
      empLookup: true,
      hrFlow: true,
      hrTask: 'sponsorDone',
      sigTasks: { sponsorDone: 'شئون الموظفين' },
      fields: [
        F.date,
        F.branch,
        { ...F.name, label: 'اسم الموظف' },
        { ...F.iqama, label: 'رقم الإقامة' },
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'nationality', label: 'الجنسية' },
        { ...F.job, label: 'المسمى الوظيفي' },
        { key: 'oldSponsor', label: 'الكفالة الحالية', required: true },
        { key: 'newSponsor', label: 'الكفالة الجديدة (المنقول إليها)', type: 'select', options: BP_KAFALA, required: true },
        { key: 'transferDate', label: 'تاريخ النقل المطلوب', type: 'date' },
        { key: 'payer', label: 'من يتحمل رسوم النقل', type: 'select', options: ['الشركة', 'الموظف', 'الجهة الجديدة'] },
        { key: 'cost', label: 'قيمة رسوم النقل (ريال)', type: 'number' },
        { key: 'reason', label: 'سبب النقل', type: 'textarea', required: true },
      ],
      summary: (d) => `${d.name || ''} — من ${d.oldSponsor || ''} إلى ${d.newSponsor || ''}`,
      body: (d) => {
        const t = (d.tasks || {}).sponsorDone || {};
        return `<p class="l-para">نرجو التكرم بنقل كفالة الموظف الآتي بياناته :</p>
          ${infoTable([
            ['اسم الموظف', d.name],
            ['رقم الإقامة', d.iqama],
            ['الرقم الوظيفي', d.empNo],
            ['الجنسية', d.nationality],
            ['المسمى الوظيفي', d.job],
            ['الفرع', d.branch],
          ])}
          <table class="lt"><tr><td class="lbl">من الكفالة</td><td><b>${esc(d.oldSponsor)}</b></td><td class="lbl">إلى الكفالة</td><td><b>${esc(d.newSponsor)}</b></td></tr>
          <tr><td class="lbl">تاريخ النقل المطلوب</td><td>${esc(fmtDate(d.transferDate))}</td><td class="lbl">رسوم النقل</td><td>${d.cost ? `${esc(fmtNum(d.cost))} ريال${d.payer ? ` — على ${esc(d.payer)}` : ''}` : esc(d.payer || '')}</td></tr></table>
          <div class="l-notes"><b>سبب النقل :</b><br>${esc(d.reason).replace(/\n/g, '<br>')}</div>
          ${
            t.doneDate
              ? `<h4 class="l-sec">التنفيذ (شئون الموظفين) :</h4>${infoTable([
                  ['تاريخ نقل الكفالة', fmtDate(t.doneDate)],
                  ['ملاحظات', t.doneNote],
                ])}`
              : ''
          }`;
      },
    },
    {
      /* طلب تصنيع / شراء من الورشة: محاسب الفرع ← محاسب الورش (عرض السعر) ← مدير الفرع ← محاسب الفرع (الدفع) ← محاسب الورش (التنفيذ) ← مدير العمليات (operations/application/workshop-cycle.js) */
      id: 'mfgRequest',
      group: 'الورشة',
      title: 'طلب تصنيع / شراء من الورشة',
      letterTitle: (d) => (d.reqKind === 'شراء من الورشة' ? 'طلب شراء من الورشة' : 'طلب تصنيع من الورشة'),
      noDest: true,
      noDecisionBox: true,
      mfgFlow: true,
      sigTasks: {
        mfgAccept: 'مسئول الورشة',
        mfgQuote: 'محاسب الورش (عرض السعر)',
        mfgPay: 'محاسب الفرع (الدفع)',
        mfgDone: 'محاسب الورش (التنفيذ)',
      },
      fields: [
        F.date,
        F.branch,
        {
          key: 'reqKind',
          label: 'نوع الطلب',
          type: 'select',
          options: ['تصنيع', 'شراء من الورشة'],
          required: true,
          hint: 'تصنيع منتج جديد، أو شراء منتج جاهز من مخزن الورشة',
        },
        { key: 'workshop', label: 'الورشة', required: true, choicesFrom: 'mfgWorkshops' },
        {
          key: 'materialBy',
          label: 'هل سيوفر الفرع الخامة؟',
          type: 'select',
          options: ['الفرع يوفر الخامة', 'الورشة توفر الخامة'],
          required: true,
          showIf: ['reqKind', 'تصنيع'],
        },
        {
          key: 'items',
          label: 'المنتجات المطلوبة',
          type: 'table',
          required: true,
          columns: [
            { key: 'product', label: 'المنتج' },
            { key: 'qty', label: 'الكمية', type: 'number' },
            { key: 'spec', label: 'المواصفات / المقاس' },
          ],
        },
        { key: 'neededDate', label: 'التاريخ المطلوب للتسليم', type: 'date', required: true },
        { key: 'project', label: 'المشروع / الغرض', type: 'textarea', required: true },
      ],
      summary: (d) =>
        `${d.reqKind === 'شراء من الورشة' ? 'شراء: ' : 'تصنيع: '}${(d.items || [])
          .filter((x) => x.product)
          .map((x) => `${x.product}${x.qty ? ` × ${x.qty}` : ''}`)
          .slice(0, 3)
          .join('، ')} — ${d.workshop || ''}`,
      amount: (d) => ((d.tasks || {}).mfgQuote || {}).total || '',
      body: (d) => {
        const rows = (d.items || []).filter((x) => x.product),
          tk = d.tasks || {},
          a = tk.mfgAccept || {},
          q = tk.mfgQuote || {},
          dn = tk.mfgDone || {};
        return `<p class="l-para">نرجو التكرم ${d.reqKind === 'شراء من الورشة' ? 'بالموافقة على شراء' : 'بتصنيع'} المنتجات الآتية من <b>${esc(d.workshop || '..........')}</b> لصالح فرع <b>${esc(d.branch || '..........')}</b> :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>المنتج</th><th style="width:90px">الكمية</th><th>المواصفات / المقاس</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.product)}</td><td>${esc(x.qty)}</td><td>${esc(x.spec)}</td></tr>`).join('') || '<tr><td colspan="4">—</td></tr>'}</tbody></table>
          ${infoTable([
            ['نوع الطلب', d.reqKind || 'تصنيع'],
            ['الفرع الطالب', d.branch],
            ['التاريخ المطلوب للتسليم', fmtDate(d.neededDate)],
            ['توفير الخامة', d.reqKind === 'شراء من الورشة' ? '—' : d.materialBy],
          ])}
          <table class="lt"><tr><td class="lbl">المشروع / الغرض</td><td>${esc(d.project).replace(/\n/g, '<br>')}</td></tr></table>
          ${
            (q.qItems || []).some((x) => x.item)
              ? `<h4 class="l-sec">عرض سعر الورشة${q.quoteSerial ? ` (رقم ${esc(q.quoteSerial)})` : ''} :</h4>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>الصنف</th><th style="width:120px">السعر بدون الضريبة</th><th style="width:70px">العدد</th><th style="width:120px">الإجمالي</th><th>ملاحظات</th></tr></thead><tbody>
          ${q.qItems
            .filter((x) => x.item)
            .map(
              (x, i) =>
                `<tr><td>${i + 1}</td><td>${esc(x.item)}</td><td>${esc(fmtNum(x.price))}</td><td>${esc(x.qty)}</td><td>${esc(fmtNum((Number(x.price) || 0) * (Number(x.qty) || 0)))}</td><td>${esc(x.note)}</td></tr>`,
            )
            .join('')}
          <tr><td colspan="4"><b>الإجمالي بدون الضريبة</b></td><td colspan="2"><b>${esc(fmtNum(q.subtotal))}</b> ريال</td></tr>
          <tr><td colspan="4"><b>الضريبة (15%) على البنود</b></td><td colspan="2"><b>${esc(fmtNum(q.vat))}</b> ريال</td></tr>
          <tr><td colspan="4"><b>الإجمالي شامل الضريبة</b></td><td colspan="2"><b>${esc(fmtNum(q.withVat || q.total))}</b> ريال</td></tr>
          ${
            Number(q.laborCost) > 0
              ? `<tr><td colspan="4"><b>المصنوعية</b> (بدون ضريبة)</td><td colspan="2"><b>${esc(fmtNum(q.laborCost))}</b> ريال</td></tr>
          <tr><td colspan="4"><b>الإجمالي النهائي</b> (شامل الضريبة + المصنوعية)</td><td colspan="2"><b>${esc(fmtNum(q.total))}</b> ريال</td></tr>`
              : ''
          }</tbody></table>
          ${Number(q.total) ? `<p class="l-para">${esc(tafqeet(q.total))}</p>` : ''}${infoTable([
            ['موعد التسليم المتوقع', fmtDate(q.expectedDate)],
            ['نوع الطلب', d.reqKind || 'تصنيع'],
          ])}${q.quoteNote ? `<div class="l-notes"><b>ملاحظات الورشة :</b><br>${esc(q.quoteNote)}</div>` : ''}`
              : ''
          }
          ${payPart('السداد (محاسب الفرع) :', tk.mfgPay)}${
            d.reqKind === 'شراء من الورشة' && (d.issueReq || {}).serial
              ? `<h4 class="l-sec">الصرف للفرع :</h4>${infoTable([
                  ['إذن الصرف من المخزن', d.issueReq.serial],
                  ['', ''],
                ])}`
              : ''
          }
          ${
            dn.doneDate
              ? `<h4 class="l-sec">إنهاء التصنيع والترحيل للمخزن :</h4>${infoTable([
                  ['تاريخ الانتهاء من التصنيع', fmtDate(dn.doneDate)],
                  ['أوامر الترحيل للمخزن', (d.posted || []).map((x) => x.docNo).join('، ') || `مخزن ${d.workshop || ''}`],
                  ['إذن الصرف للفرع', (d.issueReq || {}).serial || ''],
                  ['', ''],
                ])}${dn.doneNote ? `<div class="l-notes"><b>ملاحظات التصنيع :</b><br>${esc(dn.doneNote)}</div>` : ''}`
              : ''
          }
          ${
            a.expectedDate
              ? `<h4 class="l-sec">قبول الورشة :</h4>${infoTable([
                  ['موعد التسليم المتوقع', fmtDate(a.expectedDate)],
                  ['التكلفة التقديرية', a.estCost ? `${fmtNum(a.estCost)} ريال` : ''],
                ])}${a.mfgNote ? `<div class="l-notes"><b>ملاحظات الورشة :</b><br>${esc(a.mfgNote)}</div>` : ''}`
              : ''
          }`;
      },
    },
    {
      /* مصروف ثانوي (مثل فاتورة بنزين لغسيل المعدات): محاسب قسم الحفر ← مدير قسم الحفر، مع صورة الفاتورة */
      id: 'drillExpense',
      group: 'قسم الحفر',
      title: 'اعتماد مصروف ثانوي',
      letterTitle: 'طلب اعتماد مصروف ثانوي',
      noDest: true,
      noDecisionBox: true,
      drillFlow: 'expense',
      drillAccOnly: true,
      attachStrict: true,
      requiredAttachments: ['صورة الفاتورة'],
      fields: [
        F.date,
        F.branch,
        { key: 'item', label: 'بيان المصروف', required: true, hint: 'مثال: بنزين لغسيل المعدات' },
        { key: 'amount', label: 'المبلغ (ريال)', type: 'number', required: true },
        { key: 'vendor', label: 'الجهة / المحطة' },
        { key: 'invoiceNo', label: 'رقم الفاتورة' },
        { key: 'project', label: 'المشروع (إن وُجد)' },
        { key: 'purpose', label: 'الغرض', type: 'textarea' },
      ],
      summary: (d) => `${d.item || ''} — ${fmtNum(d.amount)} ريال`,
      amount: (d) => d.amount || '',
      body: (d) => `<p class="l-para">نرجو التكرم باعتماد المصروف الآتي لقسم الحفر :</p>
        ${infoTable([
          ['بيان المصروف', d.item],
          ['المبلغ', d.amount ? `${fmtNum(d.amount)} ريال` : ''],
          ['الجهة / المحطة', d.vendor],
          ['رقم الفاتورة', d.invoiceNo],
          ['المشروع', d.project],
          ['', ''],
        ])}
        ${d.amount ? `<p class="l-para">${esc(tafqeet(d.amount))}</p>` : ''}${d.purpose ? `<div class="l-notes"><b>الغرض :</b><br>${esc(d.purpose)}</div>` : ''}
        <p class="l-para">مرفق صورة الفاتورة.</p>`,
    },
    {
      /* مطالبة مالية بأعمال قسم الحفر في مشروع لفرع: محاسب الحفر ← مدير الفرع ← محاسب الفرع ← مدير قسم الحفر (الإعادة للمرحلة السابقة) */
      id: 'drillClaim',
      group: 'قسم الحفر',
      title: 'مطالبة مالية بأعمال قسم الحفر',
      letterTitle: 'مطالبة مالية بأعمال قسم الحفر',
      noDest: true,
      noDecisionBox: true,
      drillFlow: 'claim',
      drillAccOnly: true,
      attachStrict: true,
      returnPrev: true,
      sigLabel: 'step',
      requiredAttachments: ['عرض السعر أو أمر الشراء (PO) المعتمد'],
      fields: [
        F.date,
        { ...F.branch, label: 'الجهة المطالِبة' },
        { key: 'toBranch', label: 'الفرع صاحب المشروع', required: true, choicesFrom: 'branches' },
        { key: 'project', label: 'اسم المشروع', required: true },
        /* البيان يُكتب لكل مطالبة لاختلافه من فرع لفرع */
        { key: 'desc', label: 'البيان', type: 'textarea', required: true, hint: 'مثال: تنفيذ 8 جسات بعمق 25 م بالحفارتين SDR-09 و SDR-10' },
        { key: 'meters', label: 'عدد الأمتار المنفذة', type: 'number', required: true },
        { key: 'meterPrice', label: 'سعر المتر (ريال)', type: 'number', required: true },
        { key: 'poNo', label: 'رقم عرض السعر / أمر الشراء' },
        { key: 'period', label: 'فترة التنفيذ', hint: 'مثال: من 2026/10/01 إلى 2026/10/25' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ],
      summary: (d) =>
        `${d.project || ''} — فرع ${d.toBranch || ''} — ${fmtNum((Number(d.meters) || 0) * (Number(d.meterPrice) || 0))} ريال`,
      amount: (d) => Math.round((Number(d.meters) || 0) * (Number(d.meterPrice) || 0) * 100) / 100 || '',
      body: (d) => {
        const total = Math.round((Number(d.meters) || 0) * (Number(d.meterPrice) || 0) * 100) / 100;
        return `<p class="l-para">نتقدم بالمطالبة المالية عن الأعمال التي نفذها قسم الحفر في مشروع <b>${esc(d.project || '..........')}</b> التابع لفرع <b>${esc(d.toBranch || '..........')}</b> :</p>
        <table class="lt grid sm"><thead><tr><th>البيان</th><th style="width:110px">عدد الأمتار</th><th style="width:110px">سعر المتر</th><th style="width:130px">الإجمالي</th></tr></thead>
        <tbody><tr><td style="text-align:right">${d.desc ? esc(d.desc).replace(/\n/g, '<br>') : `أعمال الحفر — ${esc(d.project || '')}`}</td><td>${esc(d.meters)}</td><td>${esc(fmtNum(d.meterPrice))}</td><td><b>${esc(fmtNum(total))}</b></td></tr></tbody></table>
        ${total ? `<p class="l-para">${esc(tafqeet(total))}</p>` : ''}
        ${infoTable([
          ['رقم عرض السعر / أمر الشراء', d.poNo],
          ['فترة التنفيذ', d.period],
        ])}
        ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(d.notes)}</div>` : ''}<p class="l-para">مرفق عرض السعر أو أمر الشراء (PO) المعتمد.</p>`;
      },
    },
    {
      /* استعارة حفارة بين فرع وقسم الحفر: الجهة الطالبة ← مدير الجهة المعيرة فقط، وتكلفة الاستعارة 60% من سعر المتر */
      id: 'rigLoan',
      group: 'قسم الحفر',
      title: 'طلب استعارة حفارة',
      letterTitle: 'طلب استعارة حفارة',
      noDest: true,
      noDecisionBox: true,
      drillFlow: 'rigLoan',
      attachStrict: true,
      requiredAttachments: ['عرض السعر أو أمر الشراء (PO) المعتمد'],
      fields: [
        F.date,
        { ...F.branch, label: 'الجهة الطالبة' },
        {
          key: 'lender',
          label: 'الجهة المعيرة (المالكة للحفارة)',
          required: true,
          choicesFrom: 'branches',
          hint: 'قسم الحفر أو أحد الفروع',
        },
        { key: 'count', label: 'عدد الحفارات المطلوبة', type: 'number', required: true },
        { key: 'project', label: 'اسم المشروع', required: true },
        { key: 'fromDate', label: 'بداية الاستعارة', type: 'date', required: true },
        { key: 'toDate', label: 'نهاية الاستعارة', type: 'date', required: true },
        {
          key: 'meterPrice',
          label: 'سعر المتر في المشروع (ريال)',
          type: 'number',
          required: true,
          hint: 'تكلفة الاستعارة = 60% من سعر المتر',
        },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ],
      summary: (d) => `${d.count || ''} حفارة من ${d.lender || ''} — ${d.project || ''}`,
      amount: (d) => Math.round((Number(d.meterPrice) || 0) * 0.6 * 100) / 100 || '',
      body: (d) => {
        const cost = Math.round((Number(d.meterPrice) || 0) * 0.6 * 100) / 100;
        return `<p class="l-para">نرجو الموافقة على إعارة <b>${esc(d.count || '...')}</b> حفارة من <b>${esc(d.lender || '..........')}</b> إلى <b>${esc(d.branch || '..........')}</b> لمشروع <b>${esc(d.project || '..........')}</b> :</p>
        ${infoTable([
          ['الجهة الطالبة', d.branch],
          ['الجهة المعيرة', d.lender],
          ['عدد الحفارات', d.count],
          ['المشروع', d.project],
          ['بداية الاستعارة', fmtDate(d.fromDate)],
          ['نهاية الاستعارة', fmtDate(d.toDate)],
          ['مدة الاستعارة', d.fromDate && d.toDate ? `${(daysBetween(d.fromDate, d.toDate) || 0) + 1} يوم` : ''],
          ['سعر المتر', d.meterPrice ? `${fmtNum(d.meterPrice)} ريال` : ''],
        ])}
        <div class="l-notes"><b>بند ثابت :</b> تكلفة الاستعارة <b>60% من سعر المتر</b> = <b>${esc(fmtNum(cost))}</b> ريال للمتر.</div>
        ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(d.notes)}</div>` : ''}<p class="l-para">مرفق عرض السعر أو أمر الشراء (PO) المعتمد.</p>`;
      },
    },
    {
      /* طلب موظف / موارد بشرية (مثل حفار أو عامل من فرع على كفالة الشركة): محاسب الحفر ← مدير قسم الحفر ← مدير المتابعة والإشراف ← قرار نقل تلقائي لشئون الموظفين */
      id: 'staffRequest',
      group: 'قسم الحفر',
      title: 'طلب موظف / موارد بشرية',
      letterTitle: 'طلب موظف / موارد بشرية',
      noDest: true,
      noDecisionBox: true,
      drillFlow: 'staff',
      drillOnly: true,
      fields: [
        F.date,
        { ...F.branch, label: 'الجهة الطالبة' },
        { key: 'job', label: 'الوظيفة المطلوبة', required: true, hint: 'مثال: حفار، عامل حفر' },
        { key: 'count', label: 'العدد', type: 'number', required: true },
        { key: 'fromBranch', label: 'الفرع المطلوب منه', required: true, choicesFrom: 'branches' },
        { key: 'project', label: 'المشروع', required: true },
        {
          key: 'sponsor',
          label: 'على كفالة الشركة فقط؟',
          type: 'select',
          options: ['نعم — المشروع يقبل من على كفالة الشركة فقط', 'لا يشترط'],
          required: true,
        },
        { key: 'duration', label: 'المدة المطلوبة', hint: 'مثال: 3 أشهر أو حتى نهاية المشروع' },
        { key: 'reason', label: 'سبب الطلب', type: 'textarea', required: true },
      ],
      summary: (d) => `${d.count || ''} ${d.job || ''} من فرع ${d.fromBranch || ''} — ${d.project || ''}`,
      body: (d) => `<p class="l-para">نرجو التكرم بتوفير الموارد البشرية الآتية لقسم الحفر :</p>
        ${infoTable([
          ['الوظيفة المطلوبة', d.job],
          ['العدد', d.count],
          ['الفرع المطلوب منه', d.fromBranch],
          ['المشروع', d.project],
          ['الكفالة', d.sponsor],
          ['المدة', d.duration],
        ])}
        <table class="lt"><tr><td class="lbl">سبب الطلب</td><td>${esc(d.reason).replace(/\n/g, '<br>')}</td></tr></table>
        ${(d.transferReq || {}).serial ? `<p class="l-para">أُنشئ قرار النقل رقم <b>${esc(d.transferReq.serial)}</b> لدى شئون الموظفين لإكمال إجراءات النقل.</p>` : '<p class="l-para">بعد اعتماد مدير المتابعة والإشراف يُنشأ قرار نقل لدى شئون الموظفين تلقائياً.</p>'}`,
    },
    {
      /* توريد خردة للورشة: محاسب الفرع ← مدير الفرع ← محاسب الورش ← مدير العمليات، وبعد الاعتماد تُضاف لرصيد خردة الورشة */
      id: 'scrapSupply',
      group: 'الورشة',
      title: 'توريد خردة للورشة',
      letterTitle: 'توريد خردة للورشة',
      noDest: true,
      noDecisionBox: true,
      supplyFlow: true,
      fields: [
        F.date,
        { ...F.branch, label: 'الفرع المورِّد' },
        { key: 'workshop', label: 'الورشة المورَّد إليها', required: true, choicesFrom: 'mfgWorkshops' },
        {
          key: 'items',
          label: 'الخردة المورَّدة',
          type: 'table',
          required: true,
          columns: [
            { key: 'material', label: 'نوع الخردة' },
            { key: 'qty', label: 'الكمية', type: 'number' },
            { key: 'unit', label: 'الوحدة', type: 'select', options: ['كيلو', 'طن', 'قطعة', 'متر', 'لتر'] },
            { key: 'note', label: 'الحالة / ملاحظات' },
          ],
        },
        { key: 'deliveryDate', label: 'تاريخ التسليم للورشة', type: 'date' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ],
      summary: (d) =>
        `${(d.items || [])
          .filter((x) => x.material)
          .map((x) => `${x.material}${x.qty ? ` × ${x.qty} ${x.unit || ''}` : ''}`)
          .slice(0, 3)
          .join('، ')} — فرع ${d.branch || ''} ← ${d.workshop || ''}`,
      body: (d) => {
        const rows = (d.items || []).filter((x) => x.material);
        return `<p class="l-para">نفيدكم بتوريد الخردة الآتية من فرع <b>${esc(d.branch || '..........')}</b> إلى ساحة خردة <b>${esc(d.workshop || '..........')}</b> لتتصرف فيها الورشة :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>نوع الخردة</th><th style="width:90px">الكمية</th><th style="width:80px">الوحدة</th><th>الحالة / ملاحظات</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.material)}</td><td>${esc(x.qty)}</td><td>${esc(x.unit)}</td><td>${esc(x.note)}</td></tr>`).join('') || '<tr><td colspan="5">—</td></tr>'}</tbody></table>
          ${infoTable([
            ['الفرع المورِّد', d.branch],
            ['الورشة', d.workshop],
            ['تاريخ التسليم للورشة', fmtDate(d.deliveryDate)],
            ['حركات التوريد لرصيد الخردة', (d.posted || []).length ? 'تمت الإضافة لرصيد الخردة' : ''],
          ])}
          ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(d.notes)}</div>` : ''}
          <p class="l-para">تُضاف الكميات لرصيد ساحة خردة الورشة بعد موافقة مدير الفرع ومحاسب الورش ومدير العمليات.</p>`;
      },
    },
    {
      /* إذن صرف وبيع خردة: خاص بالورشة (لا يظهر لمحاسبي الفروع) ← محاسب الورش ← مدير العمليات ← المدير المالي (التعميد)، وبعد الاعتماد تُخصم من رصيد الخردة */
      id: 'scrapSale',
      group: 'الورشة',
      title: 'إذن صرف وبيع خردة',
      letterTitle: 'إذن صرف وبيع خردة',
      noDest: true,
      noDecisionBox: true,
      scrapFlow: true,
      workshopOnly: true,
      fields: [
        F.date,
        { key: 'workshop', label: 'الورشة (ساحة الخردة)', required: true, choicesFrom: 'mfgWorkshops' },
        { key: 'party', label: 'اسم المشتري / الجهة', required: true },
        { key: 'contact', label: 'جوال المشتري / السجل التجاري' },
        {
          key: 'items',
          label: 'الخردة المصروفة',
          type: 'table',
          required: true,
          columns: [
            { key: 'material', label: 'نوع الخردة' },
            { key: 'qty', label: 'الكمية', type: 'number' },
            { key: 'unit', label: 'الوحدة' },
            { key: 'price', label: 'السعر للوحدة (ريال)', type: 'number' },
          ],
        },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ],
      summary: (d) =>
        `${(d.items || [])
          .filter((x) => x.material)
          .map((x) => `${x.material}${x.qty ? ` × ${x.qty}` : ''}`)
          .slice(0, 3)
          .join('، ')} — ${d.party || ''} — ${fmtNum(sumRows(d.items, 'qty', 'price'))} ريال`,
      amount: (d) => sumRows(d.items, 'qty', 'price') || '',
      body: (d) => {
        const rows = (d.items || []).filter((x) => x.material),
          total = sumRows(d.items, 'qty', 'price');
        return `<p class="l-para">نرجو التكرم بالموافقة على صرف وبيع الخردة الآتية من ساحة خردة <b>${esc(d.workshop || '..........')}</b> إلى السادة / <b>${esc(d.party || '..........')}</b>${d.contact ? ` — ${esc(d.contact)}` : ''} :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>نوع الخردة</th><th style="width:80px">الكمية</th><th style="width:80px">الوحدة</th><th style="width:110px">السعر للوحدة</th><th style="width:120px">الإجمالي</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.material)}</td><td>${esc(x.qty)}</td><td>${esc(x.unit)}</td><td>${esc(fmtNum(x.price))}</td><td>${esc(fmtNum((Number(x.qty) || 0) * (Number(x.price) || 0)))}</td></tr>`).join('') || '<tr><td colspan="6">—</td></tr>'}
          <tr><td colspan="5"><b>الإجمالي</b></td><td><b>${esc(fmtNum(total))}</b></td></tr></tbody></table>
          ${total ? `<p class="l-para">${esc(tafqeet(total))}</p>` : ''}
          ${infoTable([
            ['الورشة', d.workshop],
            ['المشتري', d.party],
            ['حركات البيع من رصيد الخردة', (d.posted || []).map((x) => x.docNo).join('، ')],
            ['', ''],
          ])}
          ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(d.notes)}</div>` : ''}
          <p class="l-para">تُخصم الكميات من رصيد ساحة الخردة بعد اعتماد مدير العمليات وتعميد المدير المالي.</p>`;
      },
    },
    {
      /* إذن صرف من مخزن الورشة: مسئول الورشة ← مدير العمليات، وبعد الاعتماد تُخصم الكميات من رصيد المخزن */
      id: 'stockIssue',
      group: 'الورشة',
      title: 'إذن صرف من المخزن',
      letterTitle: 'إذن صرف مواد من المخزن',
      noDest: true,
      noDecisionBox: true,
      issueFlow: true,
      fields: [
        F.date,
        { key: 'workshop', label: 'المخزن (الورشة)', required: true, choicesFrom: 'mfgWorkshops' },
        { key: 'party', label: 'الجهة المستلمة (الفرع / العميل)', required: true },
        {
          key: 'items',
          label: 'الأصناف المصروفة',
          type: 'table',
          required: true,
          columns: [
            { key: 'product', label: 'المنتج' },
            { key: 'qty', label: 'الكمية', type: 'number' },
            { key: 'price', label: 'سعر الوحدة (ريال)', type: 'number' },
          ],
        },
        { key: 'mfgRef', label: 'رقم طلب التصنيع المرتبط' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ],
      summary: (d) =>
        `${(d.items || [])
          .filter((x) => x.product)
          .map((x) => `${x.product}${x.qty ? ` × ${x.qty}` : ''}`)
          .slice(0, 3)
          .join('، ')} — ${d.workshop || ''} ← ${d.party || ''}`,
      amount: (d) => sumRows(d.items, 'qty', 'price') || '',
      body: (d) => {
        const rows = (d.items || []).filter((x) => x.product),
          total = sumRows(d.items, 'qty', 'price');
        return `<p class="l-para">نرجو التكرم بالموافقة على صرف الأصناف الآتية من مخزن <b>${esc(d.workshop || '..........')}</b> إلى <b>${esc(d.party || '..........')}</b> :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>المنتج</th><th style="width:90px">الكمية</th><th style="width:110px">سعر الوحدة</th><th style="width:120px">الإجمالي</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.product)}</td><td>${esc(x.qty)}</td><td>${esc(fmtNum(x.price))}</td><td>${esc(fmtNum((Number(x.qty) || 0) * (Number(x.price) || 0)))}</td></tr>`).join('') || '<tr><td colspan="5">—</td></tr>'}
          <tr><td colspan="4"><b>الإجمالي (بدون ضريبة)</b></td><td><b>${esc(fmtNum(total))}</b></td></tr></tbody></table>
          ${infoTable([
            ['المخزن', d.workshop],
            ['الجهة المستلمة', d.party],
            ['طلب التصنيع المرتبط', d.mfgRef],
            ['حركات الصرف من المخزن', (d.posted || []).map((x) => x.docNo).join('، ')],
          ])}
          ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(d.notes)}</div>` : ''}
          ${(d.qtyLog || []).length ? `<div class="l-notes"><b>تعديل الكميات :</b><br>${d.qtyLog.map((x) => `${esc(x.step)} — ${esc(x.by)}: ${esc(x.changes)}${x.note ? ` (${esc(x.note)})` : ''}`).join('<br>')}</div>` : ''}
          <p class="l-para">تُخصم الكميات من رصيد المخزن بعد اعتماد مسئول الورشة ومدير العمليات.</p>`;
      },
    },
    {
      /* عرض سعر لعميل: بنود بسعر الوحدة، والإجمالي وضريبة القيمة المضافة 15% والتفقيط ومدة الصلاحية ← مسار الاعتماد من الإعدادات (افتراضياً المدير المالي) */
      id: 'priceQuote',
      group: 'الورشة',
      title: 'عرض سعر',
      letterTitle: 'عرض سعر',
      noDest: true,
      /* عرض للعميل: بدون مربع قرار الإدارة المالية (الاعتماد الداخلي في خانات التوقيع) */
      noDecisionBox: true,
      fields: [
        F.date,
        { ...F.branch, label: 'الجهة المصدرة (الفرع / الورشة)' },
        { key: 'customer', label: 'اسم العميل', required: true },
        { key: 'contact', label: 'جوال / إيميل العميل' },
        {
          key: 'items',
          label: 'البنود',
          type: 'table',
          required: true,
          columns: [
            { key: 'item', label: 'البند / المنتج' },
            { key: 'qty', label: 'الكمية', type: 'number' },
            { key: 'unit', label: 'الوحدة' },
            { key: 'price', label: 'سعر الوحدة', type: 'number' },
          ],
        },
        {
          key: 'vat',
          label: 'ضريبة القيمة المضافة',
          type: 'select',
          options: ['تضاف 15%', 'الأسعار شاملة الضريبة', 'بدون ضريبة'],
          required: true,
        },
        { key: 'laborCost', label: 'المصنوعية (ريال — بدون ضريبة)', type: 'number', hint: 'اختياري: تُضاف للإجمالي ولا تُحسب عليها ضريبة' },
        { key: 'validity', label: 'مدة صلاحية العرض (بالأيام)', type: 'number' },
        { key: 'mfgRef', label: 'رقم طلب التصنيع / الشراء المرتبط', hint: 'يُملأ تلقائياً عند إعداد العرض من الطلب' },
        { key: 'terms', label: 'شروط الدفع والتسليم', type: 'textarea' },
      ],
      summary: (d) =>
        `${d.customer || ''} — ${fmtNum(quoteTotals(d).total + (Number(d.laborCost) || 0))} ريال${d.mfgRef ? ` (للطلب ${d.mfgRef})` : ''}`,
      amount: (d) => quoteTotals(d).total + (Number(d.laborCost) || 0) || '',
      body: (d) => {
        const rows = (d.items || []).filter((x) => x.item),
          q = quoteTotals(d);
        return `<p class="l-para">السادة / <b>${esc(d.customer || '..........')}</b> المحترمين${d.contact ? ` — ${esc(d.contact)}` : ''}</p>
          <p class="l-para">يسرنا أن نقدم لكم عرض السعر الآتي :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>البند / المنتج</th><th style="width:80px">الكمية</th><th style="width:80px">الوحدة</th><th style="width:110px">سعر الوحدة</th><th style="width:120px">الإجمالي</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.item)}</td><td>${esc(x.qty)}</td><td>${esc(x.unit)}</td><td>${esc(fmtNum(x.price))}</td><td>${esc(fmtNum((Number(x.qty) || 0) * (Number(x.price) || 0)))}</td></tr>`).join('') || '<tr><td colspan="6">—</td></tr>'}
          <tr><td colspan="5">الإجمالي قبل الضريبة</td><td>${esc(fmtNum(q.net))}</td></tr>
          <tr><td colspan="5">ضريبة القيمة المضافة ${d.vat === 'بدون ضريبة' ? '(بدون)' : '15%'}${d.vat === 'الأسعار شاملة الضريبة' ? ' (مشمولة)' : ''}</td><td>${esc(fmtNum(q.vat))}</td></tr>
          <tr><td colspan="5"><b>الإجمالي شامل الضريبة</b></td><td><b>${esc(fmtNum(q.total))}</b></td></tr>
          ${Number(d.laborCost) > 0 ? `<tr><td colspan="5">المصنوعية (بدون ضريبة)</td><td>${esc(fmtNum(d.laborCost))}</td></tr><tr><td colspan="5"><b>الإجمالي النهائي (شامل الضريبة + المصنوعية)</b></td><td><b>${esc(fmtNum(q.total + Number(d.laborCost)))}</b></td></tr>` : ''}</tbody></table>
          ${q.total ? `<p class="l-para">${esc(tafqeet(q.total + (Number(d.laborCost) || 0)))}</p>` : ''}
          ${d.mfgRef ? `<p class="l-para">مرتبط بطلب التصنيع / الشراء رقم <b>${esc(d.mfgRef)}</b>.</p>` : ''}
          ${infoTable([
            ['صلاحية العرض', d.validity ? `${d.validity} يوماً من تاريخه` : ''],
            ['الجهة المصدرة', d.branch],
          ])}
          ${d.terms ? `<div class="l-notes"><b>شروط الدفع والتسليم :</b><br>${esc(d.terms).replace(/\n/g, '<br>')}</div>` : ''}
          <p class="l-para">وتفضلوا بقبول فائق الاحترام ,,,</p>`;
      },
    },
    {
      /* مباشرة عمل موظف: محاسب الفرع يرفعها (عودة من إجازة / مباشرة جديدة / نقل...) ← شئون الموظفين فقط، والمدير الإداري يراها للعلم (workStartSteps بالخادم)
       * بعد الاعتماد النهائي: تاريخ المباشرة يُسجَّل في ملف الموظف بسجل الموظفين (workStartAfterApproval بالخادم) */
      id: 'workStart',
      group: 'شئون الموظفين',
      title: 'مباشرة عمل موظف',
      letterTitle: 'مباشرة عمل موظف',
      noDest: true,
      issuer: 'محاسب الفرع',
      noDecisionBox: true,
      empLookup: true,
      workStartFlow: true,
      /* التاريخ الهجري الموافق تحت تاريخ الخطاب */
      hijri: true,
      fields: [
        { ...F.date, label: 'تاريخ إنشاء المباشرة' },
        {
          key: 'kind',
          label: 'صفة المباشرة',
          type: 'select',
          options: ['عودة من إجازة', 'مباشرة جديدة (موظف جديد)', 'نقل من فرع آخر', 'أخرى'],
          required: true,
        },
        { ...F.branch, label: 'مكان المباشرة / الفرع' },
        { ...F.name, label: 'الإسم رباعي' },
        { ...F.iqama, label: 'رقم الهوية / الإقامة' },
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'gender', label: 'الجنس', type: 'select', options: ['ذكر', 'أنثى'] },
        { key: 'nationality', label: 'الجنسية' },
        { ...F.job, label: 'المسمى الوظيفي' },
        { key: 'department', label: 'الإدارة / القسم' },
        {
          key: 'startDate',
          label: 'تاريخ المباشرة',
          type: 'date',
          required: true,
          hint: 'اليوم الذي باشر فيه الموظف العمل فعلياً — لا يكون قبل نهاية إجازته المسجلة',
        },
      ],
      summary: (d) => `${d.name || ''} — ${d.kind || ''}${d.startDate ? ` (${fmtDate(d.startDate)})` : ''}`,
      body: (d) => `${infoTable([
        ['مكان المباشرة / الفرع', d.branch],
        ['صفة المباشرة', d.kind],
        ['يوم المباشرة', dayName(d.startDate)],
        ['تاريخ المباشرة', d.startDate ? `${fmtDate(d.startDate)}${hijri(d.startDate) ? ` — الموافق ${hijri(d.startDate)}هـ` : ''}` : ''],
      ])}
        <h4 class="l-sec">بيانات العامل / الموظف :</h4>
        ${infoTable([
          ['الإسم رباعي', d.name],
          ['الجنس', d.gender],
          ['الجنسية', d.nationality],
          ['المسمى الوظيفي', d.job],
          ['رقم الهوية', d.iqama],
          ['الإدارة / القسم', d.department],
          ['الرقم الوظيفي', d.empNo],
        ])}
        <p class="l-para" style="text-align:center;margin-top:18px"><b>المكرم / المدير الإداري بشركة سادن المتخصصة للاستشارات الجيولوجية &nbsp;&nbsp; المحترم</b></p>
        <p class="l-para" style="text-align:center">بهذا نفيدكم أنه تم مباشرة العامل / الموظف حسب الصفة والبيانات الموضحة أعلاه</p>
        <p class="l-para" style="text-align:center">في يوم : <b class="red">${esc(dayName(d.startDate) || '..........')}</b> &nbsp;&nbsp; بتاريخ : <b class="red">${esc(fmtDate(d.startDate) || '....../....../..........')}</b>${hijri(d.startDate) ? ` &nbsp; الموافق : <b class="red">${esc(hijri(d.startDate))}هـ</b>` : ''}</p>
        <p class="l-para" style="text-align:center">,, لذا نرجو التكرم باعتماد مباشرته للعمل . ودمتم بخير</p>`,
    },
    {
      /* خطاب عام غير موجّه: يختار مقدمه من يُوجَّه إليهم من مستخدمي النظام بالترتيب، فيمر عليهم للاعتماد ويظهرون كمرسل إليهم */
      id: 'openLetter',
      group: 'عام',
      title: 'خطاب عام غير موجّه',
      pickApprovers: true,
      decisionTitle: 'القرار / التوجيه',
      fields: [
        F.date,
        { key: 'subject', label: 'عنوان الخطاب', required: true },
        F.branch,
        { key: 'content', label: 'نص الخطاب', type: 'textarea', required: true, rows: 8 },
        {
          key: 'approverIds',
          label: 'يُوجَّه إلى (بالترتيب)',
          type: 'users',
          required: true,
          full: true,
          hint: 'اختر شخصاً أو أكثر من مستخدمي النظام — يمر الخطاب عليهم بالترتيب للاعتماد، وتظهر أسماؤهم في الخطاب',
        },
      ],
      letterTitle: (d) => d.subject || 'عنوان الخطاب',
      summary: (d) => d.subject,
      body: (d) => `<div class="l-para pre">${esc(d.content) || '<span class="dots">نص الخطاب...</span>'}</div>`,
    },
    {
      id: 'general',
      group: 'عام',
      title: 'خطاب عام',
      fields: [
        F.date,
        { key: 'subject', label: 'عنوان الخطاب', required: true },
        F.branch,
        { key: 'content', label: 'نص الخطاب', type: 'textarea', required: true, rows: 8 },
      ],
      letterTitle: (d) => d.subject || 'عنوان الخطاب',
      summary: (d) => d.subject,
      body: (d) => `<div class="l-para pre">${esc(d.content) || '<span class="dots">نص الخطاب...</span>'}</div>`,
    },
  ];

  /* ترتيب البدلات: سكن - انتقال - اتصال - إقامة - موقع (باقي النماذج بترتيبها) */
  const ORDER = ['housingFixed', 'housingVisit', 'transport', 'contact', 'contactBulk', 'residence', 'site'];
  const rank = (f) => {
    const i = ORDER.indexOf(f.id);
    return i < 0 ? ORDER.length : i;
  };
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
  const withNote = (f) =>
    f.embed || f.noNote || f.fields.some((x) => x.key === NOTE_FIELD.key) ? f : { ...f, fields: [...f.fields, NOTE_FIELD] };
  FORMS.forEach((f, i) => {
    FORMS[i] = withNote(f);
  });
  const byId = {};
  FORMS.forEach((f) => {
    byId[f.id] = f;
  });

  function summaryOf(form, d) {
    if (form.summary) return form.summary(d || {});
    return (d && (d.name || d.subject || d.branch)) || '';
  }
  function amountOf(form, d) {
    if (form.amount) return form.amount(d || {});
    return form.amountKey && d ? d[form.amountKey] : '';
  }

  /* ---------- عرض الخطاب كاملاً ---------- */
  /* ترويسة الشركة أعلى الخطابات (تُعطَّل من الإعدادات عند الطباعة على ورق مطبوع الترويسة) */
  let LETTERHEAD = true;
  const setLetterhead = (on) => {
    LETTERHEAD = on !== false;
  };
  function renderLetter(formId, data, ctx) {
    /* يقبل رقم النموذج، أو تعريف نموذج مخصص للمعاينة قبل حفظه */
    const form = formId && typeof formId === 'object' ? (typeof formId.body === 'function' ? formId : buildCustom(formId)) : byId[formId];
    if (!form) return '';
    const d = data || {};
    ctx = ctx || {};
    const route = ctx.route && ctx.route.length ? ctx.route : DEFAULT_ROUTE;
    const ap = ctx.approvals || [];
    const rej = ctx.rejection;
    const isRej = (i) => rej && rej.step === i;
    const person = (i) => ap[i] || route[i];
    /* العنوان قد يتغير بعد رفع المحضر الموقّع (paperSigned) */
    const paperUp = !!form.paperLabel && ((ctx.attachLabels || []).includes(form.paperLabel) || !!(d.tasks && d.tasks.vehSign));
    const title = typeof form.letterTitle === 'function' ? form.letterTitle(d, { paperSigned: paperUp }) : form.letterTitle || form.title;

    /* الترويسة: من أعلى سلطة إلى أدناها (عكس ترتيب المسار) */
    /* المرسَل إليهم: قائمة يحددها مدير النظام للنموذج، أو تلقائياً من مسار الاعتماد */
    const destRow = (pre, name, ttl) =>
      `<div class="l-dest-row"><span>السيد ${esc(pre || 'الأستاذ')} / ${esc(name)}</span><span>${esc(ttl)}</span></div>`;
    const dest =
      form.recipientsMode === 'custom' && (form.recipients || []).length
        ? form.recipients.map((x) => destRow(x.prefix, x.name, x.title)).join('')
        : route
            .map((st, i) => (st.task || st.consult ? '' : destRow(person(i).prefix, person(i).name, person(i).title)))
            .reverse()
            .join('');

    const decisionOf = (s, i) => {
      if (isRej(i)) return `<div class="l-dec rej">✖ ${esc(s.label)} (${esc(rej.name)}): مرفوض — ${esc(rej.note)}</div>`;
      const a = ap[i];
      if (!a) return '';
      return `<div class="l-dec">✔ ${esc(s.label)} (${esc(a.name)}): معتمد${a.amount ? ` — القيمة المعتمدة: <b>${esc(fmtNum(a.amount))}</b> ريال` : ''}${a.note ? ` — ${esc(a.note)}` : ''}</div>`;
    };
    const side = form.sideBox;
    const inSide = (s) => side && !s.consult && `${s.label || ''} ${s.title || ''}`.includes(side.match);
    const decisions = route.map((s, i) => (inSide(s) || s.task || s.consult ? '' : decisionOf(s, i))).join('');
    const sideDecisions = side ? route.map((s, i) => (inSide(s) ? decisionOf(s, i) : '')).join('') : '';

    /* خانات التوقيع اليدوي (من نموذج الورد) تُخفى إذا كان صاحبها مرحلة اعتماد في المسار، حتى لا يتكرر التوقيع */
    const norm = (x) =>
      String(x || '')
        .replace(/\s+/g, ' ')
        .trim();
    const inRoute = route
      .filter((s) => !s.task && !s.consult)
      .flatMap((s, i) => [norm(s.label), norm((person(route.indexOf(s)) || {}).title)])
      .filter(Boolean);
    const covered = (t) =>
      inRoute.includes(norm(t)) || (norm(t) === 'مدير الفرع' && inRoute.some((n) => n.startsWith('مدير فرع') || n === 'مدير الفرع'));
    const paperSigned = !!form.paperLabel && (ctx.attachLabels || []).includes(form.paperLabel);
    const extraSigs = (form.extraSigs || [])
      .filter((t) => !covered(t))
      .map(
        (t) =>
          `<div class="l-sig"><div>${esc(t)}</div>${paperSigned && (form.paperSigs || []).includes(t) ? '<div class="stamp ok">موقّع<br><small>في المحضر المرفوع</small></div>' : '<div class="l-sig-line">...........................</div>'}</div>`,
      );
    /* مراحل مهام يظهر توقيع صاحبها الإلكتروني على الخطاب (sigTasks: المهمة ← عنوان الخانة) */
    const sigTask = (s) => s.task && (form.sigTasks || {})[s.task];
    /* مراحل تعتمد بدون خانة توقيع على الخطاب (hideSigs في تعريف النموذج) */
    const isBranchMgr = (n) => n === 'مدير الفرع' || n.startsWith('مدير فرع');
    /* المحضر المطبوع للتوقيع يظهر فيه المسلِّم والمستلم فقط، وتظهر توقيعات المسار بعد رفع المحضر الموقّع */
    const noSig = (s, i) =>
      (form.paperLabel && !paperSigned) ||
      (form.hideSigs || []).some((t) =>
        [norm(s.label), norm((person(i) || {}).title)].some((n) => n === norm(t) || (norm(t) === 'مدير الفرع' && isBranchMgr(n))),
      );
    const sigs =
      extraSigs.join('') +
      route
        .map((s, i) => {
          /* مرحلة إبداء الرأي (إعادة توجيه) لا تظهر في الخطاب */
          if ((s.task && !sigTask(s)) || s.consult || noSig(s, i)) return '';
          const p = person(i);
          let mark = '<div class="l-sig-line">...........................</div>';
          if (ap[i])
            mark = `${ap[i].sig ? `<img class="l-sig-img" src="/api/signatures/${encodeURIComponent(ap[i].sig)}" alt="توقيع ${esc(ap[i].name)}">` : ''}<div class="stamp ok">معتمد إلكترونياً<br>${esc(ap[i].name)}<br><small>${esc(fmtDate(ap[i].at))}</small></div>`;
          else if (isRej(i)) mark = `<div class="stamp no">مرفوض<br>${esc(rej.name)}<br><small>${esc(fmtDate(rej.at))}</small></div>`;
          return `<div class="l-sig"><div>${esc(sigTask(s) || (form.sigLabel === 'step' ? s.label : p.title || s.label))}</div>${mark}</div>`;
        })
        .join('');

    const qr = ctx.verify
      ? `<div class="l-qr"><img src="/qr/${esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق من صحة الخطاب</small></div>`
      : '';
    /* في الصفحة المضغوطة يأخذ رمز QR خانة بجانب التوقيعات بدل أسفل الصفحة */
    let sigCols =
      route.filter((st, i) => (!st.task || sigTask(st)) && !noSig(st, i)).length + extraSigs.length + (form.compact && qr ? 1 : 0);
    let sigsHtml = sigs;
    /* نموذج التوظيف الذي رفعه شئون الموظفين: توقيعه في خانة مرحلته، بدون خانة مسئول التوظيف */
    if (form.legalFlow || (form.issuer && !d.byHr)) {
      const issued = ctx.serial && ctx.createdByName;
      /* توقيع مُصدر الخطاب (الشئون القانونية / مسئول التوظيف) ثم توقيعات مراحل الاعتماد */
      sigsHtml = `<div class="l-sig"><div>${esc(form.issuer || 'الشئون القانونية')}</div>${issued && ctx.createdBySig ? `<img class="l-sig-img" src="/api/signatures/${encodeURIComponent(ctx.createdBySig)}" alt="توقيع ${esc(ctx.createdByName)}">` : ''}${issued ? `<div class="stamp ok">صادر إلكترونياً<br>${esc(ctx.createdByName)}<br><small>${esc(fmtDate(ctx.createdAt || d.date))}</small></div>` : '<div class="l-sig-line">...........................</div>'}</div>${sigs}`;
      sigCols = 1 + route.filter((st, i) => (!st.task || sigTask(st)) && !noSig(st, i)).length;
    }
    /* كل الخطابات بترويسة الشركة ما عدا التصفية (لها تصميمها من برنامج التصفية) */
    const head = LETTERHEAD && !form.embed ? '<img class="l-head" src="header.png" alt="شركة سادن المتخصصة للاستشارات الجيولوجية">' : '';
    return `<div class="letter${form.compact ? ' compact' : ''}${head ? ' has-head' : ''}">${head}
      <div class="l-top"><div>التاريخ : <span class="red">${esc(fmtDate(d.date)) || '0000/00/00'}</span>${form.hijri && hijri(d.date) ? `<br>الموافق : <span class="red">${esc(hijri(d.date))}هـ</span>` : ''}</div>${ctx.serial ? `<div>رقم الطلب : <bdi dir="ltr" class="red">${esc(ctx.serial)}</bdi></div>` : ''}</div>
      ${form.compact ? '' : qr}
      <div class="l-title">${esc(title)}</div>
      ${
        form.noDest
          ? ''
          : `<div class="l-dest">${dest}</div>
      ${form.hideGreet ? '' : `<p class="l-greet">${esc(form.greetText || 'تحية طيبة وبعد ,,,')}</p>`}`
      }
      ${form.body(d)}${form.bodyNote ? form.bodyNote(d) : ''}
      ${d.letterNote && !form.embed ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(d.letterNote).replace(/\n/g, '<br>')}</div>` : ''}
      ${form.noDest || form.hideClosing ? '' : `<p class="l-greet">${esc(form.closeText || 'ولسيادتكم جزيل الشكر ,,,')}</p>`}
      ${side ? decisionBox(side.head, sideDecisions, true) : ''}
      ${form.noDecisionBox ? '' : decisionBox(esc(form.decisionTitle || 'قرار الإدارة المالية'), decisions)}
      <div class="l-sigs" style="grid-template-columns:repeat(${Math.min(sigCols, form.compact || form.issuer ? 5 : 4)},1fr)${form.legalFlow && sigCols === 1 ? ';max-width:60mm;margin-inline-start:auto' : ''}">${sigsHtml}${form.compact ? qr : ''}</div>
      ${ctx.createdByName && !form.hidePrep ? `<div class="l-prep">مُعد الطلب (محاسب الفرع) : ${esc(ctx.createdByName)}</div>` : ''}
    </div>`;
  }

  /* ---------- إقرار المخالصة المرتبط بالتصفية ----------
   * نفس نص "برنامج المخالصة"، وبياناته من التصفية: الصافي، وتاريخ الالتحاق، وتاريخ نزول الإجازة */
  /* إقرار مصروفات رخصة القيادة: يتكوّن تلقائياً بعد اعتماد «خطاب تعميد مصروفات رخصة قيادة»، ويوقّعه الموظف ويبصم،
   * ولا يُقفل الطلب حتى يُرفع موقّعاً. ctx: { serial, approvedAt, amount, verify } */
  function renderLicenseAck(d, ctx) {
    ctx = ctx || {};
    const amount = Number(String(ctx.amount || '').replace(/,/g, '')) || 0;
    const date = ctx.approvedAt ? fmtDate(ctx.approvedAt) : '';
    const dots = '....../....../..........';
    const head = LETTERHEAD ? '<img class="l-head" src="header.png" alt="">' : '';
    return `<div class="letter clearance lic-ack${head ? ' has-head' : ''}">${head}
      <div class="l-top"><div>التاريخ : <span class="red">${esc(date) || dots}</span></div>${ctx.serial ? `<div>رقم المستند : <bdi dir="ltr" class="red">إقرار-${esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">إقرار مصروفات رخصة قيادة</div>
      <p class="c-para">أُقر أنا الموقع أدناه / ${val(d.name, '..............................')}
      هوية / إقامة رقم : ${val(d.iqama, '....................')}
      وأعمل بوظيفة ${val(d.job, '....................')} بفرع ${val(d.branch, '....................')}</p>
      <p class="c-para">بأن الشركة قد تحمّلت عني مصروفات رخصة القيادة ( ${val(d.licenseType, '..........')} )
      بمبلغ ( ${val(amount ? fmtNum(amount) : '', '..........')} ) ريال سعودي ( ${val(amount ? tafqeet(amount) : '', '..............................')} )
      وذلك بموجب خطاب التعميد رقم ( <bdi dir="ltr">${val(ctx.serial, '..........')}</bdi> )${date ? ` المعتمد بتاريخ ${val(date)}` : ''}.</p>
      <p class="c-para">وأوافق على خصم هذا المبلغ من مستحقاتي لدى الشركة في حال انتهاء خدمتي أو تركي العمل وفقاً لسياسات الشركة ولوائحها الداخلية. وعلى ذلك أوقع ،،</p>
      <div class="c-ack">المقر بما فيه ،،،</div>
      <div class="c-sign"><div>الاسم / ..................................</div><div>التوقيع / ..................................</div><div>البصمة /<div class="c-print"></div></div></div>
      ${
        ctx.serial || ctx.verify
          ? `<div class="c-foot">
        ${ctx.serial ? `<div class="c-link">هذا الإقرار مرتبط بخطاب تعميد مصروفات رخصة القيادة رقم <bdi dir="ltr">${esc(ctx.serial)}</bdi>${date ? ` المعتمد نهائياً بتاريخ ${esc(date)}` : ''}</div>` : ''}
        ${ctx.verify ? `<div class="c-qr"><img src="/qr/${esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق من الخطاب المرتبط</small></div>` : ''}
      </div>`
          : ''
      }
    </div>`;
  }
  /* مبلغ المخالصة: إجمالي المستحقات قبل الخصومات (والتصفيات المحفوظة قبل حفظه: الصافي) */
  const clearanceAmount = (d) => Math.max(Number(d.gross) > 0 ? Number(d.gross) : Number(d.net) || 0, 0);
  function renderClearance(d, ctx) {
    ctx = ctx || {};
    const net = clearanceAmount(d);
    const date = ctx.approvedAt ? fmtDate(ctx.approvedAt) : '';
    /* خانة البرنامج "الشركة أو المؤسسة / الفرع / الوظيفة": الجزء الأول الشركة والثاني الفرع */
    const parts = String(d.company || '')
      .split('/')
      .map((x) => x.trim());
    const company = String(d.payer || '').trim() || parts[0] || ctx.orgName || '';
    const branch = parts[1] || d.branch || '';
    /* التصفية النهائية: نص "مخالصة نهائية / نهاية خدمة" كما في نموذج الشركة */
    const final = d.kind === 'تصفية نهائية';
    if (final) {
      const eos = Number(d.eos) > 0 ? Number(d.eos) : 0;
      /* مدة الخدمة بنفس طريقة "إجمالي مدة الخدمة بالشركة" في برنامج التصفية */
      const dur = /^(\d+) سنة، (\d+) شهر، (\d+) يوم$/.exec(durationText(d.startDate, d.endDate)) || [];
      const dots = '....../....../..........';
      return `<div class="letter clearance final">
      <div class="l-top"><div>التاريخ : <span class="red">${esc(date) || dots}</span></div>${ctx.serial ? `<div>رقم المستند : <bdi dir="ltr" class="red">مخالصة-${esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">إقرار مخالصة نهائية / نهاية خدمة</div>
      <p class="c-para">أُقر أنا الموقع أدناه / ${val(d.name, '..............................')}
      الجنسية : ${val(d.nationality, '....................')}
      هوية رقم : ${val(d.iqama, '....................')}</p>
      <p class="c-para">اني قد استلمت من / ${val(company, '..............................')}
      مبلغ ${val(fmtNum(net), '..........')} ريال سعودي (${val(tafqeet(net), '..............................')})
      وهذا ما يخص جميع حقوقي المالية والعمالية والمعنوية وذلك منذ العمل لدى الشركة بتاريخ ${val(fmtDate(d.startDate), dots)}
      وحتى تاريخ ${val(fmtDate(d.endDate), dots)}
      وهذه تصفية نهائية متضمنة مكافأة نهاية الخدمة بمبلغ ( ${val(eos ? `${fmtNum(eos)} ريال سعودي` : '', '..............................')} )
      عن مدة خدمة ${val(dur[1], '.....')} سنة و ${val(dur[2], '....')} شهر و ${val(dur[3], '.....')} يوم .
      هذا الإقرار يعتبر مخالصة نهائية لا يحق لي بعدها مطالبة الشركة بأي شيء لا مادياً ولا معنوياً ولا عمالياً . وعلى ذلك أوقع ،،</p>
      <div class="c-ack">المقر بما فيه ،،،</div>
      <div class="c-sign"><div>الاسم / ..................................</div><div>التوقيع / ..................................</div><div>البصمة /<div class="c-print"></div></div></div>
      ${
        ctx.serial || ctx.verify
          ? `<div class="c-foot">
        ${ctx.serial ? `<div class="c-link">هذه المخالصة مرتبطة بتصفية الحساب رقم <bdi dir="ltr">${esc(ctx.serial)}</bdi>${ctx.approvedAt ? ` المعتمدة نهائياً بتاريخ ${esc(date)}` : ' (لم تُعتمد التصفية بعد — لا تُسلَّم للموظف قبل الاعتماد النهائي)'}</div>` : '<div></div>'}
        ${ctx.verify ? `<div class="c-qr"><img src="/qr/${esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق من التصفية المرتبطة</small></div>` : ''}
      </div>`
          : ''
      }
    </div>`;
    }
    return `<div class="letter clearance">
      <div class="l-top"><div>التاريخ : <span class="red">${esc(date) || '....../....../..........'}</span></div>${ctx.serial ? `<div>رقم المستند : <bdi dir="ltr" class="red">مخالصة-${esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">إقرار مخالصة نهائية</div>
      <p class="c-para">أُقر أنا الموقع أدناه / ${val(d.name, '..............................')}<br>
      الجنسية : ${val(d.nationality, '....................')}<br>
      الفرع : ${val(branch, '....................')}<br>
      هوية / إقامة رقم : ${val(d.iqama, '....................')}</p>
      <p class="c-para">أنني قد استلمت من شركة / مؤسسة / ${val(company, '....................')}<br>
      مبلغ ${val(fmtNum(net), '..........')} ريال سعودي<br>
      ${val(tafqeet(net), '..............................')}<br>
      وذلك مقابل جميع حقوقي المالية والمعنوية منذ بداية عملي بتاريخ ${val(fmtDate(d.startDate), '....../....../..........')}
      وحتى تاريخ ${val(fmtDate(d.endDate), '....../....../..........')} .</p>
      <p class="c-para">ويعد هذا الإقرار مخالصة نهائية لا يحق لي بعدها مطالبة الشركة / المؤسسة بأي مستحقات مالية أو عمالية وعلى ذلك أوقع .</p>
      <div class="c-sign"><div>الاسم : ..................................</div><div>التوقيع : ..................................</div><div>البصمة :<div class="c-print"></div></div></div>
      <!-- الرمز بجوار سطر الربط داخل الصفحة نفسها (لا يطفو فوق النص ولا ينزل لصفحة ثانية) -->
      ${
        ctx.serial || ctx.verify
          ? `<div class="c-foot">
        ${ctx.serial ? `<div class="c-link">هذه المخالصة مرتبطة بتصفية الحساب رقم <bdi dir="ltr">${esc(ctx.serial)}</bdi>${ctx.approvedAt ? ` المعتمدة نهائياً بتاريخ ${esc(date)}` : ' (لم تُعتمد التصفية بعد — لا تُسلَّم للموظف قبل الاعتماد النهائي)'}</div>` : '<div></div>'}
        ${ctx.verify ? `<div class="c-qr"><img src="/qr/${esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق من التصفية المرتبطة</small></div>` : ''}
      </div>`
          : ''
      }
    </div>`;
  }

  /* ---------- سجل الموظفين (الموارد البشرية): أقسام ملف الموظف وحقوله (يستخدمها الخادم للتحقق والواجهة للعرض والتعديل والرفع من Excel) ----------
   * الأنواع: نص، date، number، select، branch (من فروع النظام)، tags (قائمة مفصولة بفواصل تُعرض شارات)، textarea */
  const EMP_SECTIONS = [
    [
      'personal',
      'التفاصيل الشخصية',
      [
        { key: 'nameAr', label: 'الاسم - بالعربية', required: true },
        { key: 'nameEn', label: 'الاسم - بالإنجليزية' },
        { key: 'birthDate', label: 'تاريخ الميلاد', type: 'date', aliases: ['يوم الميلاد'] },
        { key: 'gender', label: 'الجنس', type: 'select', options: ['ذكر', 'أنثى'] },
        { key: 'nationality', label: 'الجنسية' },
        { key: 'religion', label: 'الديانة' },
        { key: 'marital', label: 'الحالة الاجتماعية', type: 'select', options: ['أعزب', 'متزوج', 'مطلق', 'أرمل'] },
        { key: 'destination', label: 'بلد الوجهة' },
        { key: 'phone', label: 'رقم الجوال', aliases: ['الجوال'] },
        { key: 'email', label: 'الإيميل', aliases: ['البريد الإلكتروني'] },
        { key: 'addrAr', label: 'العنوان باللغة العربية' },
        { key: 'addrEn', label: 'العنوان باللغة الإنجليزية' },
      ],
    ],
    [
      'docs',
      'الهوية والمستندات',
      [
        { key: 'iqama', label: 'رقم الهوية / الإقامة', aliases: ['رقم الهوية', 'رقم الإقامة', 'الإقامة', 'رقم الهوية/الإقامة'] },
        {
          key: 'iqamaEnd',
          label: 'تاريخ انتهاء الهوية / الإقامة',
          type: 'date',
          aliases: ['انتهاء الإقامة', 'تاريخ إنتهاء الهوية/الإقامة'],
        },
        { key: 'passport', label: 'جواز السفر', aliases: ['رقم الجواز'] },
        { key: 'passportEnd', label: 'تاريخ انتهاء جواز السفر', type: 'date', aliases: ['انتهاء الجواز'] },
        { key: 'license', label: 'رقم رخصة القيادة' },
        { key: 'licenseEnd', label: 'تاريخ انتهاء الرخصة', type: 'date' },
        { key: 'gosi', label: 'رقم التأمينات' },
      ],
    ],
    [
      'address',
      'العنوان الوطني',
      [
        /* العنوان حقل واحد بدل (رقم عقد الإيجار، رقم الوحدة، رقم المبنى، الرمز البريدي، اسم الشارع بالعربية والإنجليزية) */
        { key: 'nationalAddr', label: 'العنوان', aliases: ['العنوان الوطني'] },
        { key: 'region', label: 'المنطقة' },
        { key: 'city', label: 'المدينة' },
        { key: 'districtEn', label: 'الحي بالإنجليزية' },
        { key: 'district', label: 'الحي بالعربية', aliases: ['الحي'] },
        { key: 'extra', label: 'الرقم الإضافي' },
      ],
    ],
    [
      'education',
      'التعليم',
      [
        {
          key: 'degreeType',
          label: 'نوع الشهادة',
          type: 'select',
          options: ['ابتدائي', 'متوسط', 'ثانوي', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه', 'أخرى'],
        },
        { key: 'degreeTitle', label: 'عنوان الشهادة' },
        { key: 'university', label: 'الجامعة / الجهة' },
        { key: 'gradDate', label: 'تاريخ التخرج', type: 'date' },
        /* الدراسات العليا والماجستير والدكتوراه: اختيارية، ويضيفها الموظف أيضاً من حسابه على الموبايل (self) — و«نعم» يُلزم برفع الشهادة */
        ...[
          ['Pg', 'الدراسات العليا (دبلوم عالٍ)'],
          ['Master', 'الماجستير'],
          ['Phd', 'الدكتوراه'],
        ].flatMap(([k, l]) => [
          {
            key: `has${k}`,
            label: l,
            type: 'select',
            options: ['لا', 'نعم'],
            self: true,
            hint: 'اختياري — «نعم» يُظهر بياناته ويُلزم برفع الشهادة',
          },
          { key: `${k.toLowerCase()}Title`, label: `تخصص ${l}`, showIf: [`has${k}`, 'نعم'], self: true },
          { key: `${k.toLowerCase()}Uni`, label: `الجامعة / الجهة — ${l}`, showIf: [`has${k}`, 'نعم'], self: true },
          { key: `${k.toLowerCase()}Date`, label: `تاريخ الحصول على ${l}`, type: 'date', showIf: [`has${k}`, 'نعم'], self: true },
        ]),
      ],
    ],
    [
      'company',
      'تفاصيل العمل',
      [
        { key: 'empNo', label: 'الرقم الوظيفي', aliases: ['رقم الموظف'], hint: 'فارغ = يتولد تلقائياً، ولا يُعاد استخدام رقم موظف محذوف' },
        { key: 'title', label: 'المسمى الوظيفي', aliases: ['الوظيفة', 'المهنة'] },
        { key: 'department', label: 'الإدارة / القسم', aliases: ['الإدارة', 'القسم'] },
        { key: 'branch', label: 'الفرع', type: 'branch' },
        {
          key: 'joinDate',
          label: 'تاريخ التعيين (الالتحاق بالشركة)',
          type: 'date',
          aliases: ['تاريخ الانضمام', 'تاريخ الالتحاق', 'تاريخ التعيين', 'تاريخ المباشرة'],
        },
        { key: 'contractStart', label: 'بداية العقد', type: 'date' },
        { key: 'contractEnd', label: 'انتهاء العقد', type: 'date' },
        { key: 'contractType', label: 'نوع العقد', type: 'select', options: ['محدد', 'غير محدد'] },
        /* للسعوديين فقط: التصنيف، والاحتساب في نطاق التوطين (تُحسب منه نسبة التوطين في ملخص سجل الموظفين) */
        { key: 'saCategory', label: 'التصنيف', type: 'select', options: ['1', '2'], saudiOnly: true, hint: 'للموظف السعودي فقط' },
        {
          key: 'saNitaqat',
          label: 'الاحتساب في نطاق التوطين',
          type: 'select',
          options: ['نعم', 'لا'],
          saudiOnly: true,
          hint: 'للموظف السعودي فقط — «لا» = لا يُحتسب في نسبة التوطين',
        },
        { key: 'grade', label: 'الدرجة الوظيفية', hint: 'فارغ = حسب دليل الوظائف (الوظائف والدرجات ومراكز التكلفة)' },
        { key: 'costCenter', label: 'مركز التكلفة', hint: 'فارغ = مركز تكلفة الإدارة أو الفرع' },
        {
          key: 'manager',
          label: 'المدير المباشر',
          hint: 'اختر من القائمة (الاسم — الرقم الوظيفي) فيُحفظ الرقم الوظيفي، ويظهر في فريق العمل',
        },
        {
          key: 'kafala',
          label: 'الكفالة (المنشأة في مدد)',
          type: 'select',
          options: BP_KAFALA,
          aliases: ['الكفالة', 'الكفالة في مدد', 'كفالة مدد', 'الكفالة (الشركة)', 'اسم الشركة', 'الشركة'],
          hint: 'تُعبّأ تلقائياً في بيان رواتب الفرع',
        },
        { key: 'permissions', label: 'الصلاحيات' },
        { key: 'redirect', label: 'إعادة توجيه', type: 'select', options: ['نعم', 'لا'] },
        {
          key: 'workSchedule',
          label: 'نوع الدوام',
          type: 'select',
          get options() {
            return WORK_SCHEDULES.map((x) => x.name).filter(Boolean);
          },
          hint: 'فارغ = حسب قواعد أنواع الدوام (الجنسية / الفرع)',
        },
        { key: 'punchType', label: 'نوع البصمة', type: 'select', options: ['بصمة مكتبية', 'بصمة مرنة'], hint: 'فارغ = حسب نوع الدوام' },
        {
          key: 'punchExempt',
          label: 'معفي من البصمة',
          type: 'select',
          options: ['لا', 'نعم'],
          hint: 'نعم = لا يُحتسب عليه غياب ولا تأخير ولا انصراف مبكر (يبصم اختيارياً)',
        },
        {
          key: 'annualDays',
          label: 'رصيد الإجازة السنوي (أيام)',
          type: 'number',
          hint: 'للاطلاع فقط ولا يدخل في الحساب: الرصيد السنوي يُحسب بنظام العمل (21 يوماً حتى إتمام 5 سنوات متصلة و30 يوماً بعدها)',
        },
        {
          key: 'returnDate',
          label: 'تاريخ مباشرة العمل (آخر عودة من الإجازة)',
          type: 'date',
          aliases: ['تاريخ مباشرة العمل', 'تاريخ مباشرة العمل بعد آخر إجازة', 'تاريخ آخر عودة من الإجازة'],
          hint: 'إذا تُرك فارغاً: اليوم التالي لنهاية آخر إجازة سنوية في سجل الإجازات، وإلا تاريخ الانضمام',
        },
        {
          key: 'prevBalance',
          label: 'الرصيد المرحل (أيام)',
          type: 'number',
          aliases: ['رصيد الإجازة السابق (أيام)', 'رصيد الإجازة السابق', 'الرصيد المرحل'],
          hint: 'رصيد الإجازة المرحّل من قبل آخر عودة (أو من نظام سابق)، ويُضاف للرصيد المتاح',
        },
        { key: 'status', label: 'الحالة', type: 'select', options: ['نشط', 'غير نشط'] },
        { key: 'leaveDate', label: 'تاريخ ترك العمل', type: 'date' },
        { key: 'endType', label: 'نوع انتهاء الخدمة', type: 'select', options: [...END_TYPES.map((x) => x.name), 'أخرى'] },
        { key: 'gosiStatus', label: 'حالة التسجيل في التأمينات', type: 'select', options: ['مسجل', 'غير مسجل', 'مستبعد'] },
        { key: 'gosiDate', label: 'تاريخ الاشتراك في التأمينات', type: 'date' },
        { key: 'gosiExDate', label: 'تاريخ الاستبعاد من التأمينات', type: 'date' },
        {
          key: 'probationEnd',
          label: 'نهاية فترة التجربة',
          type: 'date',
          hint: 'إذا تُرك فارغاً: تاريخ التعيين + مدة التجربة في سياسات الموارد البشرية',
        },
        {
          key: 'probationStatus',
          label: 'حالة فترة التجربة',
          type: 'select',
          options: ['تحت التجربة', 'تم التثبيت', 'تم التمديد', 'إنهاء خلال التجربة'],
        },
        { key: 'remoteSite', label: 'موقع الحضور عن بعد', type: 'tags', full: true, hint: 'افصل بين المواقع بفاصلة' },
        { key: 'extraBranches', label: 'فروع إضافية', type: 'tags', full: true, hint: 'افصل بين الفروع بفاصلة' },
      ],
    ],
    [
      'insurance',
      'التأمين',
      [
        { key: 'insCompany', label: 'شركة التأمين' },
        { key: 'insClass', label: 'الفئة' },
        { key: 'insPolicy', label: 'رقم البوليصة' },
        { key: 'insMember', label: 'رقم العضوية' },
        { key: 'insuranceEnd', label: 'انتهاء التأمين الطبي', type: 'date', aliases: ['انتهاء التأمين'] },
      ],
    ],
    /* الراتب: يراه ويعدّله مدير النظام ومسؤولو سجل الموظفين ومدير الرواتب فقط */
    [
      'salary',
      'تفاصيل الراتب',
      [
        { key: 'basic', label: 'الراتب الأساسي', type: 'number' },
        { key: 'housing', label: 'بدل السكن', type: 'number' },
        { key: 'transport', label: 'بدل النقل', type: 'number' },
        { key: 'carAllow', label: 'بدل سيارة', type: 'number' },
        { key: 'phoneAllow', label: 'بدل جوال', type: 'number' },
        { key: 'siteAllow', label: 'بدل موقع', type: 'number' },
        { key: 'residenceAllow', label: 'بدل إقامة', type: 'number' },
        { key: 'otherAllow', label: 'بدلات أخرى', type: 'number' },
        { key: 'gosiDed', label: 'التأمينات الاجتماعية (خصم)', type: 'number' },
        { key: 'otherDed', label: 'حسميات أخرى', type: 'number' },
        /* لملف حماية الأجور (مُدد) */
        { key: 'gosiWage', label: 'الأجر المسجل في التأمينات', type: 'number', hint: 'كما في كشف التأمينات (للمطابقة)' },
        { key: 'bank', label: 'البنك' },
        { key: 'iban', label: 'رقم الآيبان (IBAN)', hint: 'SA متبوعة بـ 22 رقماً' },
      ],
      { secret: true },
    ],
    ['notes', 'ملاحظات', [{ key: 'notes', label: 'ملاحظات', type: 'textarea', full: true }]],
  ];
  const EMP_FIELDS = EMP_SECTIONS.flatMap(([, , fs]) => fs);
  /* الحقل الشرطي في ملف الموظف (يظهر عند قيمة معيّنة لحقل آخر) */
  const empShown = (f, e) => !f.showIf || [].concat(f.showIf[1]).includes(String((e || {})[f.showIf[0]] || ''));
  /* مستندات الموظف المصنّفة (اسم المستند = تصنيفه): الماجستير والدكتوراه والدراسات العليا إلزامية إذا سُجّلت للموظف */
  const EMP_CERTS = [
    { k: 'idDoc', l: 'الهوية / الإقامة' },
    { k: 'passportDoc', l: 'جواز السفر' },
    { k: 'gradCert', l: 'شهادة التخرج' },
    { k: 'pgCert', l: 'شهادة الدراسات العليا', need: 'hasPg' },
    { k: 'masterCert', l: 'شهادة الماجستير', need: 'hasMaster' },
    { k: 'phdCert', l: 'شهادة الدكتوراه', need: 'hasPhd' },
  ];
  const certFiles = (e, c) => ((e && e.files) || []).filter((f) => f.label === c.l);
  const certRequired = (e, c) => !!(c.need && e && e[c.need] === 'نعم');
  const empMissingCerts = (e) => EMP_CERTS.filter((c) => certRequired(e, c) && !certFiles(e, c).length);
  const EMP_SALARY = EMP_SECTIONS.find(([k]) => k === 'salary')[2].map((f) => f.key);
  const EMP_DED = ['gosiDed', 'otherDed'];
  /* سجلات متكررة في ملف الموظف (جداول): الفترات، الإجازات، الدورات، التقييمات، العهد، الجزاءات، التابعون، الرخص الأخرى */
  const EMP_LISTS = {
    licenses: {
      title: 'رخص أخرى',
      cols: [
        { key: 'name', label: 'الرخصة / الشهادة المهنية', required: true },
        { key: 'number', label: 'الرقم' },
        { key: 'issuer', label: 'جهة الإصدار' },
        { key: 'end', label: 'تاريخ الانتهاء', type: 'date' },
      ],
    },
    periods: {
      title: 'تفاصيل الفترة',
      cols: [
        { key: 'name', label: 'الاسم', required: true, hint: 'مثال: الدوام الأساسي للشركة' },
        { key: 'from', label: 'تاريخ البدء', type: 'date', required: true },
        { key: 'to', label: 'تاريخ الانتهاء', type: 'date' },
      ],
    },
    leaves: {
      title: 'سجل الإجازات',
      cols: [
        {
          key: 'type',
          label: 'نوع الإجازة',
          type: 'select',
          options: ['سنوية', 'مرضية', 'اضطرارية', 'تعويضية', 'بدون راتب', 'زواج', 'وفاة', 'مولود', 'امتحانات', 'وضع', 'عدة', 'أخرى'],
          required: true,
        },
        { key: 'from', label: 'من', type: 'date', required: true },
        { key: 'to', label: 'إلى', type: 'date', required: true },
        { key: 'days', label: 'عدد الأيام', type: 'number', hint: 'يُحسب من التاريخين إذا تُرك فارغاً' },
        { key: 'note', label: 'ملاحظات' },
      ],
    },
    courses: {
      title: 'الدورات التدريبية',
      cols: [
        { key: 'name', label: 'اسم الدورة', required: true },
        { key: 'provider', label: 'الجهة المقدمة' },
        { key: 'date', label: 'التاريخ', type: 'date' },
        { key: 'hours', label: 'عدد الساعات', type: 'number' },
        { key: 'note', label: 'ملاحظات' },
      ],
    },
    evaluations: {
      title: 'التقييم',
      cols: [
        { key: 'period', label: 'فترة التقييم', required: true, hint: 'مثال: 2026 - النصف الأول' },
        { key: 'date', label: 'التاريخ', type: 'date' },
        { key: 'score', label: 'النتيجة %', type: 'number', required: true },
        { key: 'by', label: 'المقيِّم' },
        { key: 'note', label: 'ملاحظات' },
      ],
    },
    assets: {
      title: 'العهد العينية',
      cols: [
        { key: 'name', label: 'العهدة', required: true, hint: 'مثال: لاب توب اتش بي' },
        { key: 'type', label: 'النوع', hint: 'مثال: كمبيوتر محمول - لاب توب' },
        { key: 'status', label: 'الحالة', type: 'select', options: ['جديد', 'مستعمل', 'تالف'] },
        { key: 'date', label: 'تاريخ التعيين', type: 'date' },
        { key: 'by', label: 'تم التعيين بواسطة' },
        { key: 'desc', label: 'الوصف' },
        { key: 'returned', label: 'تاريخ الإرجاع', type: 'date', hint: 'عند إرجاع العهدة' },
      ],
    },
    penalties: {
      title: 'الجزاءات التأديبية',
      cols: [
        { key: 'date', label: 'التاريخ', type: 'date', required: true },
        {
          key: 'type',
          label: 'نوع الجزاء',
          type: 'select',
          options: ['تنبيه شفهي', 'إنذار كتابي', 'خصم من الراتب', 'إيقاف عن العمل', 'أخرى'],
          required: true,
        },
        { key: 'reason', label: 'السبب / المخالفة', required: true },
        { key: 'amount', label: 'الخصم (أيام أو ريال)' },
        { key: 'ref', label: 'رقم القرار' },
      ],
    },
    contracts: {
      title: 'سجل العقود',
      cols: [
        { key: 'from', label: 'من', type: 'date' },
        { key: 'to', label: 'إلى', type: 'date' },
        { key: 'type', label: 'النوع', type: 'select', options: ['محدد', 'غير محدد'] },
        { key: 'note', label: 'ملاحظة' },
        { key: 'renewedAt', label: 'تاريخ التجديد', type: 'date' },
        { key: 'by', label: 'بواسطة' },
      ],
    },
    dependents: {
      title: 'التابعون',
      cols: [
        { key: 'name', label: 'الاسم', required: true },
        { key: 'relation', label: 'صلة القرابة', type: 'select', options: ['زوجة', 'زوج', 'ابن', 'ابنة', 'أب', 'أم', 'أخرى'] },
        { key: 'birthDate', label: 'تاريخ الميلاد', type: 'date' },
        { key: 'iqama', label: 'رقم الهوية / الإقامة' },
        { key: 'iqamaEnd', label: 'انتهاء الإقامة', type: 'date' },
      ],
    },
  };
  /* المستندات التي يُنبَّه على قرب انتهائها */
  const EMP_DOCS = [
    ['iqamaEnd', 'الهوية / الإقامة'],
    ['passportEnd', 'جواز السفر'],
    ['contractEnd', 'العقد'],
    ['insuranceEnd', 'التأمين الطبي'],
    ['licenseEnd', 'رخصة القيادة'],
  ];
  /* مواطن: الجنسية سعودية أو رقم الهوية يبدأ بـ 1 */
  const empCitizen = (e) => /سعود|saudi/i.test(e.nationality || '') || /^1\d{9}$/.test(String(e.iqama || '').trim());
  /* محتسب في نطاق التوطين: سعودي نشط لم يُحدَّد له «لا» */
  const saudiCounted = (e) => !!e && e.status !== 'غير نشط' && empCitizen(e) && e.saNitaqat !== 'لا';
  /* علم الدولة من نص الجنسية (مصري / مصرى / مصرية / Egyptian...): رمز الدولة لصورة العلم في /flags/ — الترتيب مهم (جنوب السودان قبل السودان، نيجيري قبل النيجر، صومالي قبل مالي) */
  const NAT_FLAGS = [
    [/جنوب\s*السودان|south\s*sudan/, 'ss'],
    [/سعود|saudi/, 'sa'],
    [/مصر|egypt/, 'eg'],
    [/بن[جغق]لاد|bangla/, 'bd'],
    [/باكستان|pakistan/, 'pk'],
    [/سودان|sudan/, 'sd'],
    [/يمن|yemen/, 'ye'],
    [/فلبين|filipin|philippin/, 'ph'],
    [/نيبال|nepal/, 'np'],
    [/سري\s*لان|sri\s*lank/, 'lk'],
    [/اندونيس|indonesi/, 'id'],
    [/هند|india/, 'in'],
    [/اردن|jordan/, 'jo'],
    [/سوري|syria/, 'sy'],
    [/لبنان|leban/, 'lb'],
    [/فلسطين|palestin/, 'ps'],
    [/عراق|iraq/, 'iq'],
    [/مغرب|morocc/, 'ma'],
    [/تونس|tunis/, 'tn'],
    [/جزائر|alger/, 'dz'],
    [/ليب(ي|يا)|liby/, 'ly'],
    [/اثيوب|حبش|ethiop/, 'et'],
    [/اري?تير|eritre/, 'er'],
    [/كيني|keny/, 'ke'],
    [/اوغند|ugand/, 'ug'],
    [/نيجيري|nigeria/, 'ng'],
    [/نيجر|niger/, 'ne'],
    [/افغان|afghan/, 'af'],
    [/ترك|turk/, 'tr'],
    [/عمان|oman/, 'om'],
    [/امارات|emirat|uae/, 'ae'],
    [/كويت|kuwait/, 'kw'],
    [/بحرين|bahrain/, 'bh'],
    [/قطر|qatar/, 'qa'],
    [/صومال|somal/, 'so'],
    [/تشاد|chad/, 'td'],
    [/ميانمار|بورم|myanmar|burm/, 'mm'],
    [/فيتنام|vietnam/, 'vn'],
    [/تايلا?ند|thai/, 'th'],
    [/صين|chin/, 'cn'],
    [/امريك|america|usa/, 'us'],
    [/بريطان|انجليز|brit|engl/, 'gb'],
    [/موريتان|maurita/, 'mr'],
    [/جيبوت|djibout/, 'dj'],
    [/قمر|comor/, 'km'],
    [/ايران|iran/, 'ir'],
    [/غان(ي|ا)|ghan/, 'gh'],
    [/سنغال|senegal/, 'sn'],
    [/كاميرون|camero/, 'cm'],
    [/تنزان|tanzan/, 'tz'],
    [/^مالي|^mali/, 'ml'],
  ];
  const flagOf = (nat) => {
    const n = String(nat || '')
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, '')
      .replace(/[ًٌٍَُِّْ]/g, '')
      .replace(/^ال/, '');
    if (!n) return '';
    const hit = NAT_FLAGS.find(([re]) => re.test(n));
    return hit ? hit[1] : '';
  };
  /* ---------- مدة الخدمة ورصيد الإجازة (نفس طريقة برنامج التصفية) ----------
   * المدة: سنوات وأشهر وأيام من تاريخ الانضمام حتى آخر يوم عمل (أو اليوم)
   * الرصيد السنوي: 21 يوماً لأول 5 سنوات خدمة، و30 يوماً بعدها
   * المستحق بعد آخر عودة = (أيام الخدمة منذ مباشرة العمل بعد آخر إجازة ÷ 365) × الرصيد السنوي
   * وفي حالة عدم النزول من بداية التعيين: أول 5 سنوات × 21 (+ الأشهر × 1.75 + الأيام × 21/365)، وما بعدها × 30 (+ الأشهر × 2.5 + الأيام × 30/365) */
  function empSpan(from, to) {
    const a = new Date(from),
      b = new Date(to);
    if (!from || !to || isNaN(a) || isNaN(b) || b < a) return null;
    let y = b.getUTCFullYear() - a.getUTCFullYear(),
      m = b.getUTCMonth() - a.getUTCMonth(),
      d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) {
      m--;
      d += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    return { y, m, d };
  }
  const addDays = (s, n) => {
    const d = new Date(s);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  /* ---------- سياسات الموارد البشرية (إعدادات مؤرخة قابلة للتحديث، لا أرقام ثابتة في الكود) ----------
   * الافتراضي حسب نظام العمل السعودي؛ ومدير النظام يضيف إصداراً جديداً بتاريخ سريان عند تغيّر اللوائح */
  const HR_POLICY_DEFAULT = {
    from: '2000-01-01',
    annualBase: 21,
    annualAfter: 30,
    afterYears: 5,
    probationDays: 90,
    probationMax: 180,
    hoursDay: 8,
    hoursWeek: 48,
    ramadanDay: 6,
    ramadanWeek: 36,
    /* الدوام: بداية الدوام وسماح التأخير وفترة رمضان، والإضافي = أجر الساعة + نسبة من أجر الساعة الأساسي (50% حسب نظام العمل) */
    shiftStart: '08:00',
    graceMin: 15,
    ramadanFrom: '',
    ramadanTo: '',
    otExtra: 50,
    /* التأمينات الاجتماعية: النسب (%) من الأجر الخاضع (الأساسي + السكن) بحد أدنى وأعلى */
    gosiSaudiEmp: 9.75,
    gosiSaudiEr: 11.75,
    gosiNonSaudiEmp: 0,
    gosiNonSaudiEr: 2,
    gosiMin: 1500,
    gosiMax: 45000,
    /* أنواع الإجازات حسب نظام العمل السعودي (بتعديلات 1446هـ السارية من فبراير 2025) */
    leaveTypes: [
      { name: 'سنوية', max: '', balance: true, note: '21 يوماً، و30 يوماً بعد 5 سنوات خدمة متصلة — تُخصم من الرصيد (م 109)' },
      {
        name: 'مرضية',
        max: 120,
        balance: false,
        note: 'بتقرير طبي معتمد: 30 يوماً بأجر كامل، 60 بثلاثة أرباع الأجر، 30 بدون أجر في السنة (م 117)',
      },
      { name: 'زواج', max: 5, balance: false, note: '5 أيام بأجر كامل (م 113)' },
      { name: 'مولود', max: 3, balance: false, note: 'إجازة الأبوة: 3 أيام بأجر كامل (م 113)' },
      { name: 'وفاة', max: 5, balance: false, note: 'وفاة الزوج أو أحد الأصول أو الفروع: 5 أيام بأجر كامل (م 113)' },
      {
        name: 'وضع',
        max: 84,
        balance: false,
        note: 'إجازة الأمومة: 12 أسبوعاً بأجر كامل، تبدأ قبل الموعد المرجح للوضع بـ 4 أسابيع كحد أقصى، و6 أسابيع منها إلزامية بعد الوضع (م 151)',
      },
      {
        name: 'رعاية مولود مريض أو من ذوي الإعاقة',
        max: 30,
        balance: false,
        note: 'شهر بأجر كامل بعد انتهاء إجازة الوضع، ويجوز تمديدها شهراً بدون أجر (م 151)',
      },
      {
        name: 'عدة',
        max: 130,
        balance: false,
        note: 'للعاملة المسلمة المتوفى زوجها: 4 أشهر و10 أيام بأجر كامل، ولغير المسلمة 15 يوماً (م 160)',
      },
      {
        name: 'حج',
        max: 15,
        balance: false,
        note: 'من 10 إلى 15 يوماً بأجر كامل شاملة عيد الأضحى، مرة واحدة طوال الخدمة، بعد سنتين متصلتين من الخدمة (م 114)',
      },
      {
        name: 'امتحانات',
        max: '',
        balance: false,
        note: 'بأجر كامل لأيام الامتحان الفعلية لمن انتسب لمؤسسة تعليمية بموافقة صاحب العمل، وإلا فبدون أجر (م 115)',
      },
      {
        name: 'بدون راتب',
        max: '',
        balance: false,
        note: 'باتفاق الطرفين، وما زاد على 20 يوماً يُعد العقد موقوفاً خلالها ما لم يُتفق على غير ذلك (م 116)',
      },
      { name: 'اضطرارية', max: '', balance: true, note: 'ليست في نظام العمل — حسب سياسة المنشأة وتُخصم من الرصيد السنوي' },
      { name: 'تعويضية', max: '', balance: false, note: 'عن العمل في أيام الراحة أو العطلات الرسمية — حسب سياسة المنشأة' },
    ],
  };
  /* ---------- تعدد الدول: لكل دولة سياستها الافتراضية حسب نظام العمل فيها (قابلة للتعديل بإصدارات مؤرخة لكل دولة) ----------
   * eosModel: sa = نظام العمل السعودي (نصف شهر عن كل سنة من الخمس الأولى ثم شهر، على الأجر الشامل)
   *           om = عُمان (أجر أساسي شهر عن كل سنة لغير العُمانيين — العُماني يغطيه صندوق الحماية الاجتماعية)
   *           none = لا مكافأة نظامية من المنشأة (مصر: يغطيها التأمين الاجتماعي) */
  HR_POLICY_DEFAULT.country = 'SA';
  HR_POLICY_DEFAULT.eosModel = 'sa';
  HR_POLICY_DEFAULT.note = 'نظام العمل السعودي ونظام التأمينات الاجتماعية';
  const HR_COUNTRY_DEFAULTS = {
    SA: HR_POLICY_DEFAULT,
    EG: {
      country: 'EG',
      eosModel: 'none',
      from: '2025-09-01',
      note: 'قانون العمل المصري 14 لسنة 2025 — التأمينات (قانون 148 لسنة 2019) حدود 2026: 2,700 – 16,700 جنيه',
      annualBase: 21,
      annualAfter: 30,
      afterYears: 10,
      probationDays: 90,
      probationMax: 90,
      hoursDay: 8,
      hoursWeek: 48,
      ramadanDay: 8,
      ramadanWeek: 48,
      shiftStart: '08:00',
      graceMin: 15,
      ramadanFrom: '',
      ramadanTo: '',
      otExtra: 35,
      gosiSaudiEmp: 11,
      gosiSaudiEr: 18.75,
      gosiNonSaudiEmp: 0,
      gosiNonSaudiEr: 0,
      gosiMin: 2700,
      gosiMax: 16700,
      leaveTypes: [
        { name: 'سنوية', max: '', balance: true, note: '15 يوماً في السنة الأولى، 21 بعدها، 30 بعد 10 سنوات خدمة' },
        { name: 'عارضة', max: 7, balance: true, note: '7 أيام في السنة ولا تزيد عن يومين في المرة — تُخصم من السنوية' },
        { name: 'مرضية', max: '', balance: false, note: 'حسب قانون التأمين الاجتماعي وقرار الجهة الطبية' },
        { name: 'وضع', max: 120, balance: false, note: '4 أشهر' },
        { name: 'حج', max: 30, balance: false, note: 'مرة واحدة طوال الخدمة' },
        { name: 'امتحانات', max: '', balance: false },
        { name: 'وفاة', max: 3, balance: false },
        { name: 'بدون راتب', max: '', balance: false },
        { name: 'تعويضية', max: '', balance: false },
      ],
    },
    OM: {
      country: 'OM',
      eosModel: 'om',
      from: '2023-07-26',
      note: 'قانون العمل العُماني (المرسوم السلطاني 53/2023) وقانون الحماية الاجتماعية (52/2023) — راجع نسب الصندوق الحالية',
      annualBase: 30,
      annualAfter: 30,
      afterYears: 5,
      probationDays: 90,
      probationMax: 90,
      hoursDay: 8,
      hoursWeek: 45,
      ramadanDay: 6,
      ramadanWeek: 30,
      shiftStart: '08:00',
      graceMin: 15,
      ramadanFrom: '',
      ramadanTo: '',
      otExtra: 25,
      gosiSaudiEmp: 8,
      gosiSaudiEr: 14.5,
      gosiNonSaudiEmp: 0,
      gosiNonSaudiEr: 0,
      gosiMin: 0,
      gosiMax: 3000,
      leaveTypes: [
        { name: 'سنوية', max: '', balance: true, note: '30 يوماً بأجر كامل بعد 6 أشهر خدمة' },
        { name: 'مرضية', max: 182, balance: false, note: 'حسب قانون العمل وتأمين الإجازات المرضية' },
        { name: 'زواج', max: 3, balance: false },
        { name: 'وفاة', max: 3, balance: false, note: 'الأقارب من الدرجة الأولى' },
        { name: 'مولود', max: 7, balance: false, note: 'إجازة الأبوة' },
        { name: 'وضع', max: 98, balance: false },
        { name: 'حج', max: 15, balance: false, note: 'مرة واحدة' },
        { name: 'امتحانات', max: 15, balance: false },
        { name: 'بدون راتب', max: '', balance: false },
        { name: 'تعويضية', max: '', balance: false },
      ],
    },
  };
  const COUNTRY_INFO = {
    SA: {
      name: 'السعودية',
      currency: 'SAR',
      ccyAr: 'ريال',
      citizen: 'السعودي',
      nat: /سعود|saudi/i,
      idRe: /^1\d{9}$/,
      tz: 'Asia/Riyadh',
      weekend: [5, 6],
    },
    EG: { name: 'مصر', currency: 'EGP', ccyAr: 'جنيه', citizen: 'المصري', nat: /مصر|egypt/i, tz: 'Africa/Cairo', weekend: [5, 6] },
    OM: {
      name: 'عُمان',
      currency: 'OMR',
      ccyAr: 'ريال عُماني',
      citizen: 'العُماني',
      nat: /عمان|عُمان|oman/i,
      tz: 'Asia/Muscat',
      weekend: [5, 6],
    },
  };
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
  const branchGeo = (br) => BRANCH_GEO[String(br || '').trim()] || null;
  /* دولة عمل الموظف = دولة فرعه، وإلا دولة الشركة */
  const countryOf = (e) => {
    const c = e && typeof e === 'object' ? (branchGeo(e.branch) || {}).country : typeof e === 'string' ? e : '';
    return COUNTRY_INFO[c] ? c : BASE_COUNTRY;
  };
  /* مواطن دولة العمل (للتأمينات ونهاية الخدمة) — والسعودة تبقى على empCitizen */
  const empNational = (e) => {
    const c = countryOf(e),
      k = COUNTRY_INFO[c];
    return c === 'SA' ? empCitizen(e) : !!(k && k.nat.test(e.nationality || ''));
  };
  let HR_POLICIES = [];
  /* أنواع الدوام: لكل نوع أيام العمل (0 الأحد … 6 السبت) ووقت الشيفت ولمن يُطبَّق.
   * الأولوية: موظف محدد ← فرع ← الجنسية (سعودي / غير سعودي) ← الكل. وبدون نوع مطابق يبقى الدوام العام (السياسة وإجازة نهاية الأسبوع) */
  let WORK_SCHEDULES = [];
  const setWorkSchedules = (list) => {
    WORK_SCHEDULES = (Array.isArray(list) ? list : []).filter((x) => x && Array.isArray(x.days));
  };
  function scheduleOf(e, list) {
    const L = list || WORK_SCHEDULES;
    if (!e || !L.length) return null;
    const own = String(e.workSchedule || '').trim();
    if (own) {
      const m = L.find((x) => x.name === own || x.id === own);
      if (m) return m;
    }
    const keys = [e.empNo, e.iqama, e.id].map((x) => String(x || '').trim()).filter(Boolean);
    const br = String(e.branch || '').trim(),
      sa = empCitizen(e);
    return (
      L.find((x) => x.applyTo === 'employees' && (x.employees || []).some((k) => keys.includes(String(k).trim()))) ||
      L.find((x) => x.applyTo === 'branches' && (x.branches || []).some((b) => String(b).trim() === br)) ||
      L.find((x) => (x.applyTo === 'saudi' && sa) || (x.applyTo === 'nonSaudi' && !sa)) ||
      L.find((x) => x.applyTo === 'all') ||
      null
    );
  }
  /* نوع البصمة الفعلي: المحدد في ملف الموظف، وإلا نوع بصمة دوامه، وإلا مكتبية */
  const punchModeOf = (e, sch) =>
    e && e.punchType === 'بصمة مرنة'
      ? 'flex'
      : e && e.punchType === 'بصمة مكتبية'
        ? 'office'
        : sch && (sch.punch || sch.mode) === 'flex'
          ? 'flex'
          : 'office';
  /* ساعات الشيفت من بدايته ونهايته (الشيفت الليلي يعبر منتصف الليل) */
  const scheduleHours = (x) => {
    const m = (s) => {
      const r = /^(\d{1,2}):(\d{2})$/.exec(s || '');
      return r ? Number(r[1]) * 60 + Number(r[2]) : null;
    };
    const a = m(x && x.start),
      b = m(x && x.end);
    return a === null || b === null ? 0 : Math.round(((b - a + 1440) % 1440 || 1440) / 6) / 10;
  };
  const setHrPolicies = (list) => {
    HR_POLICIES = (Array.isArray(list) ? list : [])
      .filter((p) => p && /^\d{4}-\d{2}-\d{2}$/.test(p.from || ''))
      .sort((a, b) => a.from.localeCompare(b.from));
  };
  /* السياسة السارية في تاريخ معين (أحدث إصدار تاريخه لا يتجاوز التاريخ) */
  /* السياسة السارية في تاريخ معين لدولة معينة (who = موظف أو رمز دولة، وبدونه دولة الشركة):
   * أحدث إصدار لتلك الدولة تاريخه لا يتجاوز التاريخ، وإن لم يوجد إصدار للدولة فالافتراضي حسب نظام العمل فيها.
   * الإصدارات القديمة بدون دولة تُعد لدولة الشركة */
  function hrPolicyOf(date, who) {
    const d = date || new Date().toISOString().slice(0, 10);
    const c = who ? countryOf(who) : BASE_COUNTRY;
    const D = HR_COUNTRY_DEFAULTS[c] || HR_POLICY_DEFAULT;
    const mine = HR_POLICIES.filter((x) => (x.country || BASE_COUNTRY) === c);
    const p = mine.filter((x) => x.from <= d).pop() || mine[0] || {};
    const out = { ...HR_POLICY_DEFAULT, ...D, ...p, country: c };
    if (!out.eosModel) out.eosModel = D.eosModel || 'sa';
    if (!Array.isArray(out.leaveTypes) || !out.leaveTypes.length) out.leaveTypes = D.leaveTypes || HR_POLICY_DEFAULT.leaveTypes;
    return out;
  }
  /* مكافأة نهاية الخدمة التقديرية حسب دولة العمل (للمؤشرات والتقديرات — التصفية الفعلية بحاسبة الجهة الرسمية) */
  function eosOf(e, at) {
    const n = (v) => Number(String(v == null ? '' : v).replace(/,/g, '')) || 0;
    if (!/^\d{4}-\d{2}-\d{2}/.test(e.joinDate || '')) return 0;
    const end = at || e.leaveDate || new Date().toISOString().slice(0, 10);
    const yrs = Math.max(
      0,
      (new Date(end + 'T12:00:00Z') - new Date(String(e.joinDate).slice(0, 10) + 'T12:00:00Z')) / (365.25 * 86400000),
    );
    const pol = hrPolicyOf(end, e);
    if (pol.eosModel === 'none') return 0;
    if (pol.eosModel === 'om') return empNational(e) ? 0 : Math.round(yrs * n(e.basic));
    const w = ['basic', 'housing', 'transport', 'carAllow', 'phoneAllow', 'siteAllow', 'residenceAllow', 'otherAllow'].reduce(
      (a, k) => a + n(e[k]),
      0,
    );
    return Math.round(yrs <= 5 ? (yrs * w) / 2 : 2.5 * w + (yrs - 5) * w);
  }
  /* اشتراك التأمينات: الأجر الخاضع = الأساسي + السكن (بين الحد الأدنى والأعلى)، والنسب حسب الجنسية من السياسة السارية */
  function gosiOf(e, date) {
    const pol = hrPolicyOf(date, e),
      n = (v) => Number(String(v == null ? '' : v).replace(/,/g, '')) || 0;
    const citizen = empNational(e);
    const raw = n(e.basic) + n(e.housing);
    const base = raw ? Math.min(Number(pol.gosiMax) || 1e9, Math.max(Number(pol.gosiMin) || 0, raw)) : 0;
    const off = ['غير مسجل', 'مستبعد'].includes(e.gosiStatus);
    const rE = citizen ? Number(pol.gosiSaudiEmp) : Number(pol.gosiNonSaudiEmp),
      rR = citizen ? Number(pol.gosiSaudiEr) : Number(pol.gosiNonSaudiEr);
    const r2 = (v) => Math.round(v * 100) / 100;
    return {
      citizen,
      country: pol.country,
      base: off ? 0 : base,
      rateEmp: rE,
      rateEr: rR,
      emp: off ? 0 : r2((base * rE) / 100),
      er: off ? 0 : r2((base * rR) / 100),
      off,
    };
  }
  function empLeave(e, todayStr) {
    const t = todayStr || new Date().toISOString().slice(0, 10);
    const end = e.leaveDate || t;
    const rows = (e.lists || {}).leaves || [];
    const days = (x) => Number(x.days) || (daysBetween(x.from, x.to) || 0) + 1;
    const span = /^\d{4}-\d{2}-\d{2}$/.test(e.joinDate || '') ? empSpan(e.joinDate, end) : null;
    const years = span ? span.y : 0;
    /* رصيد الإجازة من السياسة السارية في نهاية الفترة (21 يوماً، و30 بعد 5 سنوات افتراضياً) */
    const pol = hrPolicyOf(end, e),
      B = Number(pol.annualBase) || 21,
      A = Number(pol.annualAfter) || 30,
      Y = Number(pol.afterYears) || 5;
    /* الرصيد السنوي بنظام العمل (مثل برنامج التصفية): 21 يوماً حتى إتمام 5 سنوات متصلة و30 بعدها — لا يُؤخذ من خانة مستوردة */
    const auto = years >= Y ? A : B;
    const rate = auto;
    const first = span ? Math.min(years, Y) * B + (years <= Y ? span.m * (B / 12) + span.d * (B / 365) : 0) : 0;
    const extra = span && years > Y ? (years - Y) * A + span.m * (A / 12) + span.d * (A / 365) : 0;
    /* مباشرة العمل بعد آخر إجازة: الخانة، وإلا اليوم التالي لنهاية آخر إجازة سنوية في السجل، وإلا تاريخ الانضمام */
    const lastAnnual = rows.filter((x) => x.type === 'سنوية' && x.to && x.to < end).sort((a, b) => b.to.localeCompare(a.to))[0];
    const ret = e.returnDate || (lastAnnual ? addDays(lastAnnual.to, 1) : span ? e.joinDate : '');
    const since = ret && end >= ret ? Math.floor((new Date(end) - new Date(ret)) / 86400000) : 0;
    /* المستحق منذ آخر عودة: الأيام قبل تاريخ إتمام 5 سنوات × 21 ÷ 365، وبعده × 30 ÷ 365 (كسطري بدل الإجازة في برنامج التصفية) */
    const fiveAt = span ? `${Number(e.joinDate.slice(0, 4)) + Y}${e.joinDate.slice(4)}` : '';
    const dd = (a, b) => Math.max(0, Math.floor((new Date(b) - new Date(a)) / 86400000));
    let acc21 = 0,
      acc30 = 0;
    if (since) {
      const cut = !fiveAt || fiveAt >= end ? end : fiveAt <= ret ? ret : fiveAt;
      acc21 = (dd(ret, cut) / 365) * B;
      acc30 = (dd(cut, end) / 365) * A;
    }
    const entitled = acc21 + acc30;
    const usedAfter = rows.filter((x) => x.type === 'سنوية' && ret && x.from >= ret && x.from <= end).reduce((a, x) => a + days(x), 0);
    const prev = Number(e.prevBalance) || 0;
    /* الإجازات المرضية والتعويضية: في سنة الخدمة الحالية (من ذكرى تاريخ الانضمام) */
    let from = '',
      to = '';
    if (span) {
      const md = e.joinDate.slice(5);
      let y = Number(end.slice(0, 4));
      if (`${y}-${md}` > end) y--;
      from = `${y}-${md}`;
      to = addDays(`${y + 1}-${md}`, -1);
    }
    const inYear = (x) => !from || (x.from >= from && x.from <= to);
    const used = (type) => rows.filter((x) => x.type === type && inYear(x)).reduce((a, x) => a + days(x), 0);
    const r2 = (n) => Math.round(n * 100) / 100;
    /* قيمة بدل الإجازة: على آخر راتب أساسي فقط — الأجر اليومي = الأساسي ÷ 30 */
    const daily = Number(e.basic) > 0 ? Number(e.basic) / 30 : 0;
    const val = (n) => (daily ? r2(n * daily) : 0);
    const balance = r2(entitled + prev - usedAfter);
    return {
      fiveAt,
      done5: years >= Y,
      B,
      A,
      acc21: r2(acc21),
      acc30: r2(acc30),
      daily: r2(daily),
      value: { acc21: val(acc21), acc30: val(acc30), prev: val(prev), used: val(usedAfter), total: val(balance) },
      span,
      years,
      rate,
      auto,
      first: r2(first),
      extra: r2(extra),
      noLeave: r2(first + extra),
      country: pol.country,
      extraSpan: years >= Y ? { y: years - Y, m: span.m, d: span.d } : { y: 0, m: 0, d: 0 },
      ret,
      retSpan: ret ? empSpan(ret, end) : null,
      since,
      entitled: r2(entitled),
      usedAfter,
      prev,
      balance,
      from,
      to,
      sickUsed: used('مرضية'),
      compensatory: used('تعويضية'),
      days,
    };
  }

  /* ---------- ما يظهر لكل مستخدم ----------
   * لكل صفحة قيمة افتراضية حسب صلاحية المستخدم، ومدير النظام يستطيع إظهارها أو إخفاءها لأي مستخدم (u.pages) */
  const PAGES = [
    ['dashboard', 'لوحة المؤشرات'],
    ['home', 'الرئيسية'],
    ['new', 'رفع طلب جديد'],
    ['mine', 'طلباتي'],
    ['inbox', 'بانتظار الاعتماد / الطلبات الجارية'],
    ['register', 'سجل الخطابات'],
    ['all', 'جميع الطلبات'],
    ['tools', 'النماذج والأدوات'],
    ['fleet', 'أسطول السيارات'],
    ['violations', 'المخالفات المرورية'],
    ['fuel', 'المحروقات (سيارة آب)'],
    ['facilities', 'المنشآت (مباني الفروع)'],
    ['branchMap', 'خريطة الفروع'],
    ['stock', 'المخزون'],
    ['analysis', 'أدوات تحليل'],
    ['hse', 'السلامة والصحة المهنية'],
    ['supervision', 'المتابعة والإشراف'],
    ['governance', 'الحوكمة والامتثال'],
    ['knowledge', 'مكتبة المهن'],
    ['training', 'مركز التدريب'],
    ['workshop', 'الورشة (المخازن والتصنيع والخردة)'],
    ['drilling', 'قسم الحفر'],
    ['inventory', 'إدارة الجرد'],
    ['devices', 'الأجهزة النوعية'],
    ['employees', 'سجل الموظفين (الموارد البشرية)'],
    ['guide', 'دليل الاستخدام'],
    ['mail', 'البريد الداخلي'],
    ['chat', 'الدردشة الداخلية'],
    ['notices', 'مركز التعاميم'],
    ['tasks', 'إدارة المهام'],
    ['settings.general', 'الإعدادات ← إعدادات عامة'],
    ['settings.orgdiv', 'الإعدادات ← التقسيم الإداري'],
    ['settings.countries', 'الإعدادات ← الدول والفروع'],
    ['settings.users', 'الإعدادات ← المستخدمون'],
    ['settings.routes', 'الإعدادات ← مسارات الاعتماد'],
    ['settings.forms', 'الإعدادات ← النماذج والفروع'],
    ['settings.roles', 'الإعدادات ← المسميات والصلاحيات'],
    ['settings.hr', 'الإعدادات ← الموارد البشرية'],
    ['settings.tools', 'الإعدادات ← الأدوات والبرامج'],
    ['settings.calendar', 'الإعدادات ← العطلات'],
    ['settings.email', 'الإعدادات ← البريد والإشعارات'],
    ['settings.backup', 'الإعدادات ← النسخ الاحتياطي'],
    ['settings.activity', 'الإعدادات ← سجل النشاط'],
    ['settings.trash', 'سلة المحذوفات (أيقونة في التطبيقات)'],
  ];
  /* صلاحية «موظف»: الخدمة الذاتية (طلباته ونماذج الخدمات والبريد والدردشة) */
  const EMP_PAGES = ['home', 'new', 'mine', 'mail', 'chat', 'notices', 'notifications', 'tasks', 'governance', 'knowledge', 'training'];
  const SELF_FORMS = [
    'leaveRequest',
    'earlyLeave',
    'dataUpdate',
    'eosRequest',
    'advanceShort',
    'advanceLong',
    'expCert',
    'salaryCert',
    'salaryFix',
    'familyVisit',
    'bizTrip',
    'punchFix',
    'legalComplaint',
    'managerReport',
    'deductionAppeal',
    'kpiAppeal',
  ];
  function pageDefault(u, key) {
    /* أيقونات التطبيقات وما تحتها (nav:…): تظهر افتراضياً حسب صلاحيات صاحبها، ومدير النظام يخفي منها ما يريد */
    if (String(key).startsWith('nav:')) return true;
    if (u.role === 'employee') return EMP_PAGES.includes(key);
    const admin = u.role === 'admin',
      approver = u.role === 'approver',
      acc = u.role === 'accountant';
    if (key.startsWith('settings.')) return admin;
    if (key.startsWith('tool:')) return true;
    switch (key) {
      /* لوحة المؤشرات: مدير النظام، ومن فُعّلت له، ومدير الفرع ومحاسب الفرع (لفرعه فقط) */
      case 'dashboard':
        return (
          admin ||
          (approver && !!(u.dashboardFlag !== undefined ? u.dashboardFlag : u.dashboard)) ||
          (!!u.branch && (acc || !!u.branchManager))
        );
      case 'new':
      case 'mine':
        return (
          acc || admin || ['legal', 'recruiter', 'transHr', 'empMgr', 'maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k))
        );
      /* المحاسب يرى "بانتظار إجرائي" لأن ملف التصفية يرجع إليه بين المراحل */
      case 'inbox':
        return true;
      case 'all':
        return approver || admin;
      case 'register':
        return admin || !!u.branch;
      /* مدير الحركة ومسؤولو الورش، ومحاسب الفرع يرى مركبات فرعه فقط (عرض بدون تعديل) */
      case 'fleet':
        return admin || (acc && !!u.branch) || ['traffic', 'maintWs'].some((k) => (u.flowRoles || []).includes(k));
      /* المخالفات المرورية: مدير الحركة يرفعها، ومحاسب الفرع يرى مخالفات فرعه ويسوّيها */
      case 'violations':
        return admin || (acc && !!u.branch) || (u.flowRoles || []).includes('traffic');
      /* المحروقات: مدير الحركة يرفع الملف ويعتمد التوزيع، ومحاسب الفرع ومدير الفرع يرون مركبات فرعهم */
      case 'fuel':
        return admin || (u.flowRoles || []).includes('traffic') || (!!u.branch && (acc || !!u.branchManager));
      /* المنشآت: مدير النظام لكل الفروع، ومدير الفرع ومحاسبه لفرعهم */
      case 'facilities':
        return admin || (!!u.branch && (acc || !!u.branchManager));
      /* خريطة الفروع: كل الحسابات عدا الخدمة الذاتية للموظف */
      case 'branchMap':
        return u.role !== 'employee';
      /* المخزون (قيد التطوير): مدير النظام وفريق المخازن */
      case 'stock':
        return admin || (u.flowRoles || []).includes('storeMgr');
      /* أدوات تحليل: لكل الحسابات عدا الخدمة الذاتية للموظف */
      case 'analysis':
        return u.role !== 'employee';
      /* السلامة والصحة المهنية: كل الحسابات عدا الخدمة الذاتية (يبلّغون ويرون فرعهم)، ومسؤولو السلامة يديرون الكل */
      case 'hse':
        return u.role !== 'employee';
      /* الحوكمة والامتثال: لكل الحسابات (السياسات والإقرارات والبلاغات)، والإدارة لفريق الحوكمة */
      case 'governance':
        return true;
      /* مكتبة المهن: للجميع */
      case 'knowledge':
        return true;
      /* مركز التدريب: للجميع (الموظف يرى دوراته فقط) */
      case 'training':
        return true;
      /* المتابعة والإشراف: مدير النظام ومدير المتابعة ومديرو المناطق ومديرو الفروع والمدير التنفيذي والموارد البشرية (طلبات النقل والانتداب) */
      case 'supervision':
        return admin || !!u.branchManager || ['supMgr', 'regionMgr', 'execMgr', 'empMgr'].some((k) => (u.flowRoles || []).includes(k));
      /* الورشة: فريق المخازن ومسؤولو الورش ومدير الحركة */
      case 'workshop':
        return admin || ['storeMgr', 'maintWs', 'traffic'].some((k) => (u.flowRoles || []).includes(k));
      /* قسم الحفر: فريقه ومدير الحركة وموظفو فرع قسم الحفر */
      case 'drilling':
        return admin || ['drillMgr', 'traffic'].some((k) => (u.flowRoles || []).includes(k)) || u.branch === 'قسم الحفر';
      /* إدارة الجرد: فريق الجرد، ومحاسب الفرع يرى جرد فرعه */
      case 'inventory':
        return admin || (u.flowRoles || []).includes('invMgr') || (acc && !!u.branch);
      /* الأجهزة النوعية: فريق الجرد يديرها، ومحاسب الفرع يراها ويطلب استعارتها */
      case 'devices':
        return admin || (u.flowRoles || []).includes('invMgr') || (acc && !!u.branch);
      /* سجل الموظفين (بيانات شخصية): مسؤولوه وشئون الموظفين وفرق التوظيف، ومحاسب الفرع يرى موظفي فرعه؛ وغيرهم يتيحه له مدير النظام من صفحاته */
      case 'employees':
        return (
          admin ||
          ['empMgr', 'transHr', 'recruiter', 'hirePay', 'hireHead'].some((k) => (u.flowRoles || []).includes(k)) ||
          (acc && !!u.branch)
        );
      default:
        return true;
    }
  }

  /* ---------- النماذج التي ينشئها مدير النظام من النظام ----------
   * def: { id, title, letterTitle, group, fields:[{key,label,type,required,options}], intro, showTable, outro,
   *        amountKey, needsValue, noDest, extraSigs }
   * في نص الخطاب يُكتب اسم الحقل بين قوسين {اسم الحقل} ليُستبدل بقيمته، و{التفقيط} لكتابة المبلغ بالحروف */
  const FIELD_TYPES = [
    ['text', 'نص'],
    ['number', 'رقم'],
    ['date', 'تاريخ'],
    ['select', 'قائمة اختيار'],
    ['textarea', 'نص طويل'],
    ['branch', 'قائمة الفروع'],
    ['table', 'جدول بأعمدة'],
    ['heading', 'عنوان قسم'],
  ];
  function fieldText(f, d) {
    if (f.picker === 'user') return d[`${f.key.replace(/Id$/, '')}Name`] || '';
    const v = d[f.key];
    if (f.type === 'date') return fmtDate(v);
    if (f.type === 'number') return fmtNum(v);
    return v == null ? '' : String(v);
  }
  /* خيارات شكل الخطاب المشتركة: المرسَل إليهم، وعنوان صندوق القرار وإظهاره، وسطر مُعد الطلب */
  function letterOpts(def, orig) {
    const o = orig || {};
    return {
      recipientsMode: def.recipientsMode === 'custom' ? 'custom' : 'route',
      recipients: def.recipients || [],
      decisionTitle: def.decisionTitle || o.decisionTitle || '',
      noDecisionBox: def.showDecision === undefined ? !!o.noDecisionBox : !def.showDecision,
      hidePrep: !!def.hidePrep,
    };
  }
  /* أنواع حقول منشئ النماذج: الأساسية + قائمة الفروع + جدول بأعمدة + عنوان قسم (للتنظيم فقط، بلا قيمة) */
  const BLOCK_TYPES = [
    ['para', 'فقرة نص'],
    ['heading', 'عنوان قسم'],
    ['fields', 'جدول بيانات الحقول'],
    ['box', 'صندوق بعنوان'],
    ['table', 'جدول (حقل جدول)'],
    ['long', 'نص طويل في صندوق'],
  ];
  /* الحقل يظهر إذا تحقق شرطه (قيمة حقل آخر = قيمة أو إحدى قيم مفصولة بفاصلة) */
  const shownBy = (f, d) =>
    !f.showIf ||
    !f.showIf.key ||
    String(f.showIf.value || '')
      .split(/[,،]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .includes(String(d[f.showIf.key] || ''));
  function buildCustom(def) {
    const defs = def.fields || [];
    const inputs = defs.filter((f) => f.type !== 'heading');
    const fv = (f, d) => (f.type === 'branch' ? String(d[f.key] || '') : fieldText(f, d));
    const fill = (t, d) =>
      esc(t || '')
        .replace(/\{([^{}]{1,80})\}/g, (m, label) => {
          const name = label.trim();
          if (name === 'التفقيط') return val(tafqeet(d[def.amountKey]), '....................');
          if (name === 'الفرع') return val(d.branch);
          if (name === 'التاريخ') return val(fmtDate(d.date));
          const f = inputs.find((x) => x.label === name);
          return f ? val(fv(f, d)) : m;
        })
        .replace(/\n/g, '<br>');
    /* تعريف الحقل كما يستخدمه محرر الطلب والخادم */
    const fieldDef = (f) => {
      const base = {
        key: f.key,
        label: f.label,
        required: !!f.required && f.type !== 'heading',
        hint: f.hint || undefined,
        default: f.default || undefined,
        full: !!f.full,
      };
      if (f.showIf && f.showIf.key)
        base.showIf = [
          f.showIf.key,
          String(f.showIf.value || '')
            .split(/[,،]/)
            .map((x) => x.trim())
            .filter(Boolean),
        ];
      if (f.type === 'heading') return { ...base, type: 'heading' };
      if (f.type === 'branch') return { ...base, choicesFrom: 'branches' };
      if (f.type === 'table')
        return {
          ...base,
          type: 'table',
          columns: (f.columns || []).map((c, i) => ({
            key: c.key || `c${i + 1}`,
            label: c.label,
            type: c.type === 'text' ? undefined : c.type,
          })),
        };
      return { ...base, type: f.type === 'text' ? undefined : f.type, options: f.type === 'select' ? f.options || [] : undefined };
    };
    const tableHtml = (f, d) => {
      const cols = f.columns || [],
        rows = Array.isArray(d[f.key]) ? d[f.key] : [];
      return `<table class="lt grid sm"><thead><tr><th>م</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>
        ${
          rows
            .map(
              (r, i) =>
                `<tr><td>${i + 1}</td>${cols
                  .map((c, k) => {
                    const v = r[c.key || `c${k + 1}`];
                    return `<td>${esc(c.type === 'date' ? fmtDate(v) : c.type === 'number' ? fmtNum(v) : v)}</td>`;
                  })
                  .join('')}</tr>`,
            )
            .join('') || `<tr><td colspan="${cols.length + 1}">لا يوجد</td></tr>`
        }</tbody></table>`;
    };
    /* حقول جدول البيانات: المختارة، أو كل الحقول القصيرة الظاهرة في الخطاب */
    const autoFields = (d) => inputs.filter((f) => f.inLetter !== false && !['textarea', 'table'].includes(f.type) && shownBy(f, d));
    const fieldsTable = (keys, d) => {
      const list = keys && keys.length ? keys.map((k) => inputs.find((f) => f.key === k)).filter((f) => f && shownBy(f, d)) : autoFields(d);
      const rows = [
        ...list.map((f) => [esc(f.label), fv(f, d)]),
        ...(!keys || !keys.length ? (def.noBranch ? [] : [[esc(def.branchLabel || 'الفرع'), d.branch]]) : []),
      ];
      return rows.length ? infoTable(rows) : '';
    };
    const legacy = (d) => `${def.intro ? `<p class="l-para">${fill(def.intro, d)}</p>` : ''}
      ${def.showTable ? fieldsTable(null, d) : ''}
      ${
        def.showTable
          ? inputs
              .filter((f) => f.type === 'textarea' && f.inLetter !== false && shownBy(f, d))
              .map((f) => decisionBox(esc(f.label), esc(d[f.key]), true))
              .join('')
          : ''
      }
      ${
        def.showTable
          ? inputs
              .filter((f) => f.type === 'table' && f.inLetter !== false && shownBy(f, d))
              .map((f) => `<h4 class="l-sec">${esc(f.label)} :</h4>${tableHtml(f, d)}`)
              .join('')
          : ''
      }
      ${def.outro ? `<p class="l-para">${fill(def.outro, d)}</p>` : ''}`;
    /* نص الخطاب أقسام مرتبة يحددها مصمم النموذج */
    const blocks = (d) =>
      def.blocks
        .map((b) => {
          const f = b.key && inputs.find((x) => x.key === b.key);
          if (f && !shownBy(f, d)) return '';
          switch (b.type) {
            case 'para':
              return b.text ? `<p class="l-para">${fill(b.text, d)}</p>` : '';
            case 'heading':
              return b.text ? `<h4 class="l-sec">${esc(b.text)}</h4>` : '';
            case 'fields':
              return fieldsTable(b.keys, d);
            case 'box':
              return decisionBox(esc(b.title || ''), fill(b.text, d), true);
            case 'table':
              return f ? `${b.title ? `<h4 class="l-sec">${esc(b.title)}</h4>` : ''}${tableHtml(f, d)}` : '';
            case 'long':
              return f ? decisionBox(esc(b.title || f.label), esc(d[f.key]).replace(/\n/g, '<br>'), true) : '';
            default:
              return '';
          }
        })
        .join('');
    const sumF = inputs.find((f) => f.key === def.summaryKey) || inputs.find((f) => f.type !== 'table');
    return {
      id: def.id,
      custom: true,
      group: def.group || 'عام',
      title: def.title,
      letterTitle: def.letterTitle || undefined,
      fields: [
        { ...F.date, label: def.dateLabel || F.date.label },
        ...defs.map(fieldDef),
        ...(def.noBranch ? [] : [{ ...F.branch, label: def.branchLabel || F.branch.label }]),
      ],
      needsValue: !!def.needsValue,
      amountKey: def.amountKey || undefined,
      noDest: !!def.noDest,
      ...letterOpts(def),
      extraSigs: (def.extraSigs || []).length ? def.extraSigs : undefined,
      sigLabel: def.sigLabel || undefined,
      requiredAttachments: (def.requiredAttachments || []).length ? def.requiredAttachments : undefined,
      greetText: def.greetText || undefined,
      closeText: def.closeText || undefined,
      hideGreet: !!def.hideGreet,
      hideClosing: !!def.hideClosing,
      summary: (d) => (sumF ? fv(sumF, d) : ''),
      body: (d) => (Array.isArray(def.blocks) && def.blocks.length ? blocks(d) : legacy(d)),
    };
  }
  /* ---------- تعديل نصوص النماذج الأصلية ----------
   * النماذج البسيطة تتحول لنفس صيغة منشئ النماذج بنصها الحالي، فيعدّلها مدير النظام بالكامل.
   * النماذج المركبة (جداول وحسابات) يُعدَّل فيها عنوان الخطاب والتوقيعات فقط. */
  const B = (label) => `{${label}}`;
  const TEMPLATES = {
    housingFixed: {
      intro: 'برجاء تحديد قيمة (بدل سكن ثابت) للموظف الآتي بياناته :',
      showTable: true,
      outro: `حيث أن الموظف يسكن في سكن خارجي بداية من ${B('تاريخ بداية السكن الخارجي')} م`,
    },
    housingVisit: {
      intro: 'برجاء تحديد قيمة (بدل سكن زيارة) للموظف الآتي بياناته :',
      showTable: true,
      outro: `حيث أن الموظف قام بعمل زيارة عائلية ويسكن بسكن خارجي بداية من ${B('تاريخ بداية السكن الخارجي')}`,
    },
    transport: { intro: 'برجاء تحديد قيمة (بدل إنتقال) للموظف الآتي بياناته :', showTable: true, outro: '' },
    contact: {
      intro: `برجاء الموافقة على صرف بدل إتصال بقيمة ( ${B('قيمة البدل (ريال)')} ) ﷼ للموظف الآتي بياناته :`,
      showTable: true,
      outro: 'توقيع مدير الفرع : ..............................',
    },
    residence: {
      intro: 'برجاء تحديد قيمة (بدل إقامة) للموظف الآتي بياناته :',
      showTable: true,
      outro: 'ملاحظات : يتم إرفاق صورة الإقامة، وصورة من إيصال التحويل في حالة تحويل المبلغ للكفيل.',
    },
    site: {
      intro: `برجاء الموافقة على صرف مبلغ ( ${B('المبلغ المستحق (ريال)')} ) ريال قيمة (بدل موقع) للموظف الآتي بياناته :`,
      showTable: true,
      outro: '',
    },
    commission: {
      intro: `فضلاً الموافقة على صرف مبلغ ( ${B('المبلغ (ريال - يقبل الهللات)')} ) ريال سعودي ( ${B('التفقيط')} ) من فرع ( ${B('الفرع')} ) قيمة عمولة لـ ( ${B('عمولة لـ')} ) وذلك بمعلومية مدير الفرع المهندس ( ${B('مدير الفرع (المهندس)')} ).`,
      showTable: false,
      outro: '',
    },
    license: {
      intro: `برجاء تحديد قيمة ( مصروفات رخصة قيادة ) ( ${B('نوع الرخصة')} ) للموظف / ${B('اسم الموظف')} إقامة رقم ${B('رقم الإقامة / الهوية')} والذي يعمل ${B('الوظيفة')} بفرع ${B('الفرع')}`,
      showTable: false,
      outro: '',
    },
    advanceShort: {
      intro: `برجاء الموافقة على صرف سلفة قصيرة الأجل بمبلغ ( ${B('مبلغ السلفة (ريال)')} ) ريال سعودي ( ${B('التفقيط')} ) للموظف الآتي بياناته، على أن تُخصم دفعة واحدة من راتب شهر ( ${B('تُخصم من راتب شهر')} ) :`,
      showTable: true,
      outro: `إقرار الموظف : أتعهد أنا الموظف / ${B('اسم الموظف')} بسداد مبلغ السلفة الموضح أعلاه، وأوافق على خصمه كاملاً من راتب الشهر المحدد.\nتوقيع الموظف : ..............................`,
    },
  };
  const ORIGINAL = {};
  const editableFully = (id) => !!TEMPLATES[id];
  function builtinDef(id) {
    const o = ORIGINAL[id];
    if (!o) return null;
    const base = {
      id,
      title: o.title,
      letterTitle: typeof o.letterTitle === 'string' ? o.letterTitle : '',
      extraSigs: o.extraSigs || [],
      sigLabel: o.sigLabel || '',
    };
    if (!editableFully(id)) return { ...base, light: true };
    return {
      ...base,
      group: o.group,
      amountKey: o.amountKey || '',
      needsValue: !!o.needsValue,
      noDest: !!o.noDest,
      ...TEMPLATES[id],
      fields: o.fields
        .filter((f) => f.key !== 'date' && f.key !== 'branch' && f.key !== NOTE_FIELD.key)
        .map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type || 'text',
          required: !!f.required,
          ...(f.options ? { options: f.options } : {}),
        })),
    };
  }
  /* نموذج أصلي بعد تطبيق تعديل مدير النظام عليه (بدون تسجيله) */
  function applyOverride(id, ov) {
    const o = ORIGINAL[id];
    if (!o || !ov) return o;
    const common = {
      letterTitle: ov.letterTitle || o.letterTitle,
      extraSigs: (ov.extraSigs || []).length ? ov.extraSigs : o.extraSigs,
      sigLabel: ov.sigLabel || o.sigLabel,
      overridden: true,
      ...letterOpts(ov, o),
    };
    if (ov.light || !editableFully(id)) return { ...o, ...common };
    const b = buildCustom({ ...ov, id, group: o.group });
    return {
      ...o,
      ...common,
      title: ov.title || o.title,
      fields: b.fields,
      body: b.body,
      amountKey: ov.amountKey || undefined,
      needsValue: !!ov.needsValue,
      noDest: !!ov.noDest,
      extraSigs: b.extraSigs || common.extraSigs,
      summary: ov.summaryKey ? b.summary : o.summary,
      requiredAttachments: b.requiredAttachments || o.requiredAttachments,
      greetText: b.greetText,
      closeText: b.closeText,
      hideGreet: b.hideGreet,
      hideClosing: b.hideClosing,
    };
  }
  function setCustomForms(defs, overrides) {
    if (!Object.keys(ORIGINAL).length)
      FORMS.forEach((f) => {
        if (!f.custom) ORIGINAL[f.id] = f;
      });
    /* إرجاع النماذج الأصلية ثم تطبيق التعديلات الحالية */
    FORMS.forEach((f, i) => {
      if (ORIGINAL[f.id]) {
        const v = applyOverride(f.id, (overrides || {})[f.id]);
        FORMS[i] = v;
        byId[f.id] = v;
      }
    });
    for (let i = FORMS.length - 1; i >= 0; i--)
      if (FORMS[i].custom) {
        delete byId[FORMS[i].id];
        FORMS.splice(i, 1);
      }
    (defs || []).forEach((def) => {
      const f = buildCustom(def);
      FORMS.push(f);
      byId[f.id] = f;
      if (!GROUPS.includes(f.group)) GROUPS.splice(GROUPS.length - 1, 0, f.group);
    });
    FORMS.forEach((f, i) => {
      FORMS[i] = withNote(f);
      byId[f.id] = FORMS[i];
    });
  }
  /* ---------- المسميات (الأدوار) ----------
   * كل مستخدم له مسمى يحدده مدير النظام: نوع حساب أساسي + الصفحات + الإجراءات المسموحة */
  const BASES = [
    ['accountant', 'يرفع طلبات (محاسب)'],
    ['approver', 'يعتمد طلبات'],
    ['admin', 'مدير نظام (كل الصلاحيات)'],
  ];
  const DEFAULT_ROLES = [
    { id: 'r_employee', name: 'موظف', base: 'employee' },
    { id: 'r_accountant', name: 'محاسب فرع', base: 'accountant' },
    { id: 'r_approver', name: 'معتمد', base: 'approver' },
    { id: 'r_admin', name: 'مدير النظام', base: 'admin' },
  ];
  const CAPS = [
    ['viewAll', 'يرى جميع الطلبات (عدا السرية)'],
    ['actAny', 'يتخذ القرار في أي مرحلة نيابة عن صاحبها'],
    ['editAny', 'يعدّل الطلبات المعادة لغيره ويرفع لها مرفقات'],
    ['cancelAny', 'يلغي الطلبات الجارية لغيره'],
    ['deleteRequests', 'يحذف الطلبات نهائياً'],
    ['deleteAttachments', 'يحذف أي مرفق'],
    ['announce', 'يرسل التعاميم (وغيره يقرأ التعاميم الموجهة إليه فقط)'],
    ['payroll', 'يعد مسيرات الرواتب الشهرية'],
    ['approvePayroll', 'يعتمد مسيرات الرواتب الشهرية'],
    ['assignTasks', 'يوجّه مهام للموظفين (إدارة المهام)'],
    ['loginStats', 'يرى عداد الدخول على النظام'],
    ['legal', 'يرى ويدير الشئون القانونية (القضايا الخارجية والتحقيقات الإدارية)'],
    ['kpiManage', 'إدارة الجودة: يحدد مؤشرات الأداء (KPIs) ويسجل التقييم الشهري'],
    ['docs', 'وثائق ومستندات: يتابع اشتراكات مدد والسجلات التجارية ونسبة الالتزام'],
    ['calendar', 'Calendar: يضيف الأحداث والإجازات والعطل (الإجازة / العطلة لا تُحسب غياباً)'],
    ['crm', 'CRM:يرى ويدير كل العملاء ويحدد فروعهم (المشتركة وكل الفروع)'],
    ['crmBranch', 'CRM: يرى عملاء فرعه والمشتركين معه ويسجل التواصل معهم'],
    ['execDash', 'مركز القيادة التنفيذية: لوحة الإدارة العليا (المالية، السيولة، الحوكمة والمخاطر، التنبيهات)'],
  ];
  /* أقسام لوحة المؤشرات (يحدد مدير النظام ما يظهر لكل مسمى أو مستخدم؛ بدون تحديد تظهر كلها) */
  const DASH_SECTIONS = [
    ['kpis', 'المؤشرات الرئيسية (الخطابات والمبالغ والجاري)', 'الاعتمادات'],
    ['trend', 'المبالغ المعتمدة شهرياً', 'الاعتمادات'],
    ['count', 'الخطابات المعتمدة شهرياً حسب المجموعة', 'الاعتمادات'],
    ['branches', 'المبالغ المعتمدة حسب الفرع', 'الاعتمادات'],
    ['types', 'عدد الخطابات حسب النوع', 'الاعتمادات'],
    ['waiting', 'أين تتوقف الطلبات الآن', 'الاعتمادات'],
    ['stages', 'متوسط زمن مراحل الاعتماد', 'الاعتمادات'],
    ['status', 'حالة الطلبات المرفوعة', 'الاعتمادات'],
    ['people', 'أعلى الموظفين في المبالغ', 'الاعتمادات'],
    ['matrix', 'مصروفات الفروع حسب نوع الخطاب', 'الاعتمادات'],
    ['detail', 'تفصيل حسب نوع الخطاب', 'الاعتمادات'],
    ['d.hr', 'الموارد البشرية', 'أعمال الإدارات'],
    ['d.finance', 'المالية والرواتب', 'أعمال الإدارات'],
    ['d.fleet', 'إدارة الحركة', 'أعمال الإدارات'],
    ['d.workshop', 'الورشة', 'أعمال الإدارات'],
    ['d.drilling', 'قسم الحفر', 'أعمال الإدارات'],
    ['d.inventory', 'إدارة الجرد والأجهزة النوعية', 'أعمال الإدارات'],
    ['d.tasks', 'إدارة المهام', 'أعمال الإدارات'],
    ['d.comm', 'التواصل والنشاط على النظام', 'أعمال الإدارات'],
    ['d.hse', 'السلامة والصحة المهنية', 'أعمال الإدارات'],
    ['d.gov', 'الحوكمة والامتثال', 'أعمال الإدارات'],
    ['d.sup', 'المتابعة والإشراف', 'أعمال الإدارات'],
    ['d.train', 'مركز التدريب', 'أعمال الإدارات'],
    ['d.fuel', 'المحروقات', 'أعمال الإدارات'],
    ['d.docs', 'الوثائق والمستندات', 'أعمال الإدارات'],
    ['d.crm', 'العملاء والقضايا', 'أعمال الإدارات'],
  ];
  const DASH_KEYS = DASH_SECTIONS.map(([k]) => k);
  /* الأقسام المسموحة: إعداد المستخدم ← مسماه ← الكل */
  function dashSectionsOf(u) {
    if (!u) return [];
    if (Array.isArray(u.dashSections)) return u.dashSections.filter((k) => DASH_KEYS.includes(k));
    const r = roleOf(u);
    return r && Array.isArray(r.dashSections) ? r.dashSections.filter((k) => DASH_KEYS.includes(k)) : DASH_KEYS.slice();
  }
  /* مدير الفرع ومحاسب الفرع يرون لوحة المؤشرات مقيدة بفرعهم */
  const dashBranchOf = (u) => (u && u.role !== 'admin' && u.branch && (u.role === 'accountant' || u.branchManager) ? u.branch : '');
  let roleOf = () => null;
  const setRoleResolver = (fn) => {
    roleOf = fn;
  };
  /* الإجراءات: مدير النظام له كلها دائماً، وغيره حسب مسماه (يرى الكل الافتراضي من إعداد المستخدم) */
  function cap(u, key) {
    if (!u) return false;
    if (u.role === 'admin') return true;
    const r = roleOf(u);
    if (r && r.caps && typeof r.caps[key] === 'boolean') return r.caps[key];
    return key === 'viewAll' ? u.role === 'approver' && !!u.viewAll : false;
  }
  /* ترتيب القرار في الصفحات: إعداد المستخدم نفسه ← مسماه ← الافتراضي حسب نوع حسابه */
  function baseSee(u, key) {
    const r = roleOf(u || {});
    return r && r.pages && typeof r.pages[key] === 'boolean' ? r.pages[key] : pageDefault(u || {}, key);
  }
  const OPS_GROUPS = ['إدارة الحركة', 'الورشة', 'إدارة الجرد', 'قسم الحفر'];
  const isOpsForm = (id) => !!byId[id] && OPS_GROUPS.includes(byId[id].group);
  const OPS_HIDDEN = ['dashboard', 'home', 'register', 'tools', 'employees'];
  const canSee = (u, key) =>
    u && u.opsOnly && (OPS_HIDDEN.includes(key) || String(key).startsWith('settings.') || String(key).startsWith('tool:'))
      ? false
      : u && u.pages && typeof u.pages[key] === 'boolean'
        ? u.pages[key]
        : baseSee(u, key);
  function formAllowed(u, id) {
    if (byId[id] && byId[id].driverForm)
      return !!u && (u.role === 'admin' || (u.flowRoles || []).some((k) => ['driver', 'traffic'].includes(k)));
    if (u && u.role === 'employee' && !Array.isArray(u.allowedForms)) return SELF_FORMS.includes(id);
    /* يرفعه محاسب قسم الحفر فقط */
    if (byId[id] && byId[id].drillAccOnly) return !!u && (u.role === 'admin' || (u.role === 'accountant' && u.branch === 'قسم الحفر'));
    if (
      byId[id] &&
      byId[id].drillOnly &&
      !(u && (u.role === 'admin' || u.branch === 'قسم الحفر' || (u.flowRoles || []).includes('drillMgr')))
    )
      return false;
    if (u && u.opsOnly && !isOpsForm(id)) return false;
    if (byId[id] && byId[id].autoOnly) return false;
    if (byId[id] && byId[id].legalFlow) return !!u && (u.role === 'admin' || (u.flowRoles || []).includes('legal'));
    /* نموذج التوظيف يرفعه مسؤولو التوظيف المحددون في دورته (ومدير النظام) */
    if (byId[id] && byId[id].hiringFlow) return !!u && (u.role === 'admin' || (u.flowRoles || []).includes('recruiter'));
    /* قرار نقل موظف: شئون الموظفين المحددة في دورته ترفعه (وتختار الفرعين من كل الفروع) */
    if (byId[id] && byId[id].transferFlow && u && (u.flowRoles || []).includes('transHr')) return true;
    if (byId[id] && (byId[id].hrFlow || byId[id].workStartFlow) && u && ['transHr', 'empMgr'].some((k) => (u.flowRoles || []).includes(k)))
      return true;
    if (byId[id] && byId[id].scrapFlow)
      return !!u && (u.role === 'admin' || ['wsAcc', 'maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k)));
    if (byId[id] && byId[id].issueFlow)
      return !!u && (u.role === 'admin' || ['maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k)));
    if (byId[id] && byId[id].group === 'الورشة' && u && ['maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k))) return true;
    /* مسؤول الشئون القانونية أو التوظيف (معتمد) يرفع نموذج دورته فقط، إلا إذا أتاح له مدير النظام صفحة رفع الطلبات صراحة */
    if (
      u &&
      u.role === 'approver' &&
      ['legal', 'recruiter', 'transHr', 'empMgr'].some((k) => (u.flowRoles || []).includes(k)) &&
      !(u.pages && u.pages.new === true)
    )
      return false;
    if (u && Array.isArray(u.allowedForms)) return u.allowedForms.includes(id);
    const r = roleOf(u || {});
    return !(r && Array.isArray(r.allowedForms)) || r.allowedForms.includes(id);
  }
  const settingsTabs = (u) => PAGES.filter(([k]) => k.startsWith('settings.') && canSee(u, k)).map(([k]) => k.slice(9));

  /* عدد أيام العمل منذ تاريخ معين حتى اليوم، بدون أيام نهاية الأسبوع والإجازات الرسمية
   * cal: { weekend: [5, 6], holidays: [{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', name }] } */
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function workDaysSince(since, cal, nowMs) {
    if (!since) return 0;
    const weekend = (cal && cal.weekend) || [5, 6];
    const hol = (cal && cal.holidays) || [];
    const d = new Date(since);
    d.setHours(0, 0, 0, 0);
    const end = new Date(nowMs || Date.now());
    end.setHours(0, 0, 0, 0);
    let n = 0;
    for (d.setDate(d.getDate() + 1); d <= end && n < 3650; d.setDate(d.getDate() + 1)) {
      const k = ymd(d);
      if (!weekend.includes(d.getDay()) && !hol.some((h) => k >= h.from && k <= (h.to || h.from))) n++;
    }
    return n;
  }

  /* ---------- بيان رواتب الفرع ----------
   * الحالة: 1 على رأس العمل، 2 تصفية، 3 توزيع تصفية، 4 أجازة، 5 بدلات أثناء الأجازة، 6 بداية دوام، 7 مستحقات إضافية
   * لكل موظف ثلاثة أرقام: ① الصافي المستلم (ما يقبضه فعلاً) ② مصروف الرواتب (ما يُحمَّل على الشركة) ③ تأمينات الشركة
   * - المرفوع على مدد: صافي «على رأس العمل / بداية دوام» لموظفي كفالات المجموعة (لكل كفالة سجلها)
   * - خارج مدد: الكفالات الخارجية + التصفيات + بدلات الأجازة + المستحقات الإضافية
   * - مصروف الرواتب = الإجمالي + المستحقات + التصفية + بدلات الأجازة − (بصمة + غياب + جزاءات) — بدون تأمينات الشركة (تظهر منفصلة)
   *   (خصم السلفة والعهد والخصم القانوني وتأمينات الموظف لا تُنقص المصروف: تُحمَّل على الرواتب وتُخصم من الموظف) */
  const BP_STATUS = ['على رأس العمل', 'تصفية', 'توزيع تصفية', 'أجازة', 'بدلات أثناء الأجازة', 'بداية دوام', 'مستحقات إضافية'];
  /* الأسماء القديمة ← الجديدة */
  const BP_KAF_OLD = {
    'سادن المتخصصة': BP_KAFALA[0],
    'بحر الشهد': 'شركة كانتل',
    كانتل: 'شركة كانتل',
    أرابور: BP_KAFALA[2],
    'ورشة سادن': BP_KAFALA[3],
    'سادن سبيشيالايزد': BP_KAFALA[4],
    'سادن المتوسطة': BP_KAFALA[5],
    'أركان البناء': BP_KAFALA[6],
    'المدى الدولي': BP_KAFALA[7],
    'قصبة للهندسة المدنية': BP_KAFALA[8],
    'خارج الكفالة': BP_OUT,
  };
  const bpKaf = (k) => (BP_KAFALA.includes(k) ? k : BP_KAF_OLD[k] || '');
  const BP_GOSI = { sa: 0.215, other: 0.02 };
  const BP_ALLOW = [
    ['housing', 'بدل سكن'],
    ['car', 'بدل إنتقال'],
    ['phone', 'بدل جوال'],
    ['site', 'بدل موقع / اعاشه'],
    ['residence', 'بدل اقامه'],
    ['otherAllow', 'بدلات أخرى'],
  ];
  const BP_DED = [
    ['fp', 'بصمة'],
    ['absence', 'غياب'],
    ['penalty', 'جزاءات'],
    ['legal', 'خصم قانوني'],
    ['gosiDed', 'تأمينات (يدوي)'],
    ['adv', 'قسط سلفة'],
    ['custody', 'عهد'],
  ];
  const BP_DED_COST = ['fp', 'absence', 'penalty']; // خصومات تُنقص مصروف الرواتب
  const BP_PRORATE = ['basic', 'phone', 'site', 'otherAllow']; // بنود تُحسب في بداية الدوام حسب أيام الدوام
  /* البدلات الشهرية: النموذج ← خانة ملف الموظف التي يعدّلها اعتماده (زيادة الراتب تعدّل كل بنودها) */
  const PAY_ALLOW = {
    contact: 'phoneAllow',
    contactBulk: 'phoneAllow',
    residence: 'residenceAllow',
    transport: 'transport',
    housingFixed: 'housing',
    site: 'siteAllow',
    salaryRaise: '*',
  };
  /* مبالغ لمرة واحدة في بيان رواتب الشهر: النموذج ← عمود البيان (بدل سكن الزيارة والزيارة العائلية مؤقتان) */
  const PAY_ONCE = { housingVisit: 'due', familyVisit: 'due', deduction: 'penalty', legalDeduction: 'legal' };
  /* النماذج التي يحدد فيها مدير قسم الرواتب أثناء الاعتماد شهر النزول في الرواتب (خصم الشئون القانونية شهره من «طريقة تطبيق الخصم») */
  const PAY_ASK = [...Object.keys(PAY_ALLOW), 'housingVisit', 'familyVisit', 'deduction'];
  /* خانة ملف الموظف ← عمود بيان رواتب الفرع */
  const BP_EMP_KEY = {
    basic: 'basic',
    housing: 'housing',
    carAllow: 'car',
    transport: 'car',
    phoneAllow: 'phone',
    siteAllow: 'site',
    residenceAllow: 'residence',
    otherAllow: 'otherAllow',
  };
  const bpN = (v) => {
    const n = Number(String(v == null ? '' : v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const bpR = (v) => Math.round(v * 100) / 100;
  /* الجنسية من ملف الموظف؛ وإن لم توجد (موظف مضاف يدوياً) فمن أول رقم في الإقامة (1 = سعودي) */
  const bpNat = (iq) => (String(iq || '').trim() ? (String(iq).trim()[0] === '1' ? 'سعودي' : 'غير سعودي') : '');
  const bpNatOf = (l) => String(l.nationality || '').trim() || bpNat(l.iqama);
  const bpSaudi = (nat) => /سعود/.test(nat || '') && !/غير/.test(nat || '');
  /* بداية دوام: الشهر 30 يوماً، المباشرة يوم ي ← (31 − ي) يوماً ÷ 30 (يوم 1 = شهر كامل) */
  const bpStartDays = (d) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ''));
    if (!m) return null;
    return Math.max(1, Math.min(30, 31 - +m[3]));
  };
  function bpCalc(l) {
    const code = BP_STATUS.indexOf(l.status) + 1,
      g = (k) => bpN(l[k]),
      kaf = bpKaf(l.kafala),
      ext = kaf === BP_OUT,
      work = [1, 6].includes(code);
    const days = code === 6 ? bpStartDays(l.startDate) : null,
      f = days == null ? 1 : days / 30;
    /* الأساسي والبدلات تظهر كاملة دائماً، وأيام ما قبل المباشرة تنزل في الخصومات (خصم أيام):
     * السكن والانتقال والإقامة تُستحق كاملة، والأساسي والجوال والموقع / الإعاشة والبدلات الأخرى حسب أيام الدوام */
    const allow = BP_ALLOW.reduce((s, [k]) => s + g(k), 0),
      daysDed = work && f < 1 ? bpR(BP_PRORATE.reduce((s, k) => s + g(k), 0) * (1 - f)) : 0;
    const ded = bpR(BP_DED.reduce((s, [k]) => s + g(k), 0) + daysDed);
    const nat = bpNatOf(l),
      gross = bpR(work ? g('basic') + allow : 0);
    const paid = bpR(g('due') + (work ? gross - ded : code === 5 ? g('leaveAllow') : 0));
    const gosi = !nat || ext || code === 7 || !kaf ? 0 : bpR((g('basic') + g('housing')) * f * (bpSaudi(nat) ? BP_GOSI.sa : BP_GOSI.other));
    const expense = bpR(
      gross +
        g('due') +
        g('settlement') +
        (code === 5 ? g('leaveAllow') : 0) -
        (work ? BP_DED_COST.reduce((s, k) => s + g(k), 0) + daysDed : 0),
    );
    const mudad = !ext && kaf && work ? paid : 0;
    const outside = bpR(paid - mudad + g('settlement'));
    const warn = [];
    if (!code) warn.push('حالة غير معروفة');
    if (code === 2 && !g('settlement')) warn.push('مطلوب مبلغ التصفية');
    if (code === 3 && !g('settlement')) warn.push('مطلوب الجزء المحمل على الفرع');
    if (code === 5 && !g('leaveAllow')) warn.push('مطلوب بدل أثناء الأجازة');
    if (code === 7 && !g('due')) warn.push('مطلوب مبلغ المستحقات');
    if (code === 6 && days == null) warn.push('حدد تاريخ بداية الدوام');
    if (l.payBy) warn.push(`يتحمل راتبه فرع ${l.payBy} هذا الشهر (قرار النقل) — احذفه من البيان`);
    if (code === 4 && g('settlement') + g('leaveAllow') + g('due') > 0) warn.push('أجازة مع مبالغ مستحقة');
    if (work && !g('basic') && !g('due')) warn.push('الراتب الأساسي فارغ');
    if (work && paid < 0) warn.push('الخصومات أكبر من الراتب');
    if (!kaf) warn.push('الكفالة غير محددة');
    if (!nat && !ext) warn.push('الجنسية غير محددة');
    return { code, kaf, ext, nat, allow: bpR(allow), ded, daysDed, gross, paid, net: paid, gosi, expense, mudad, outside, warn, days, f };
  }
  /* خصومات أكثر من 50% من إجمالي الراتب (على رأس العمل / بداية دوام) — لا تُقبل في مدد */
  const bpOver50 = (l, c = bpCalc(l)) =>
    [1, 6].includes(c.code) && c.gross - c.daysDed > 0 && c.ded - c.daysDed > (c.gross - c.daysDed) * 0.5;
  function bpSummary(lines) {
    const L = (lines || []).map((l) => ({ l, c: bpCalc(l) }));
    const S = (f, X = L) => bpR(X.reduce((s, x) => s + f(x), 0)),
      g = (x, k) => bpN(x.l[k]);
    const byKafala = Object.fromEntries(
      BP_KAFALA.map((k) => {
        const X = L.filter((x) => x.c.kaf === k);
        return [
          k,
          {
            n: X.length,
            paid: S((x) => x.c.paid, X),
            mudad: S((x) => x.c.mudad, X),
            expense: S((x) => x.c.expense, X),
            gosi: S((x) => x.c.gosi, X),
          },
        ];
      }),
    );
    const paid = S((x) => x.c.paid),
      mudad = S((x) => x.c.mudad),
      expense = S((x) => x.c.expense),
      settle = S((x) => g(x, 'settlement'));
    const ded = Object.fromEntries(BP_DED.map(([k]) => [k, S((x) => (x.c.code === 1 || x.c.code === 6 ? g(x, k) : 0))]));
    return {
      count: L.length,
      gross: S((x) => x.c.gross),
      paid,
      net: paid,
      mudad,
      external: byKafala[BP_OUT].paid,
      outside: bpR(paid - mudad + settle),
      expense,
      ctc: expense,
      gosi: S((x) => x.c.gosi),
      settle,
      adv: bpR(ded.adv + ded.custody),
      legal: ded.legal,
      ded,
      inside: bpR(paid - byKafala[BP_OUT].paid),
      notMudad: bpR(paid - mudad + settle),
      warnings: L.reduce((s, x) => s + (x.c.warn.length ? 1 : 0), 0),
      unassigned: L.filter((x) => !x.c.kaf).length,
      kafalaDiff: L.filter((x) => !x.c.kaf).length,
      byKafala,
    };
  }
  const sheetLetterData = (d, branch) => ({
    date: d.date,
    amount: String(sheetTotal(d) || ''),
    branch: d.branch || branch || '',
    sheetType: d.sheetType || '',
    name: d.name || '',
    iqama: d.iqama || '',
    month: d.month || '',
    year: d.year || '',
    bulk: d.bulk ? '1' : '',
    count: d.bulk ? (d.rows || []).filter((r) => r.name || r.amount).length : 0,
  });
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
    DEFAULT_ROLES,
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
