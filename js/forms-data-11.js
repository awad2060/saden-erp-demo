/* بيانات forms.js (forms-data-11): PAGE_DEFAULTS، FIELD_TYPES، BLOCK_TYPES، TEMPLATES، CAPS، DASH_SECTIONS، BP_KAF_OLD، BP_ALLOW، BP_DED، PAY_ALLOW، BP_EMP_KEY
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-data-11'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  /* الصفحات الظاهرة افتراضياً لكل مستخدم حسب نوع حسابه وأدواره في الدورات — (acc, admin, approver, u) ← هل تظهر افتراضياً */
  const PAGE_DEFAULTS = {
    /* لوحة المؤشرات: مدير النظام، ومن فُعّلت له، ومدير الفرع ومحاسب الفرع (لفرعه فقط) */
    dashboard: (acc, admin, approver, u) => H.pageDefaultValue(admin, approver, u) || H.pageDefaultValue2(acc, u),
    new: (acc, admin, approver, u) =>
      acc || admin || ['legal', 'recruiter', 'transHr', 'empMgr', 'maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k)),
    mine: (acc, admin, approver, u) =>
      acc || admin || ['legal', 'recruiter', 'transHr', 'empMgr', 'maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k)),
    /* المحاسب يرى "بانتظار إجرائي" لأن ملف التصفية يرجع إليه بين المراحل */
    inbox: (acc, admin, approver, u) => true,
    all: (acc, admin, approver, u) => approver || admin,
    register: (acc, admin, approver, u) => admin || !!u.branch,
    /* مدير الحركة ومسؤولو الورش، ومحاسب الفرع يرى مركبات فرعه فقط (عرض بدون تعديل) */
    fleet: (acc, admin, approver, u) =>
      H.pageDefaultValue3(acc, admin, u) || ['traffic', 'maintWs'].some((k) => (u.flowRoles || []).includes(k)),
    /* المخالفات المرورية: مدير الحركة يرفعها، ومحاسب الفرع يرى مخالفات فرعه ويسوّيها */
    violations: (acc, admin, approver, u) => H.pageDefaultValue4(acc, admin, u) || (u.flowRoles || []).includes('traffic'),
    /* المحروقات: مدير الحركة يرفع الملف ويعتمد التوزيع، ومحاسب الفرع ومدير الفرع يرون مركبات فرعهم */
    fuel: (acc, admin, approver, u) => H.pageDefaultValue5(admin, u) || H.pageDefaultValue6(acc, u),
    /* المنشآت: مدير النظام لكل الفروع، ومدير الفرع ومحاسبه لفرعهم */
    facilities: (acc, admin, approver, u) => admin || H.pageDefaultValue7(acc, u),
    /* خريطة الفروع: كل الحسابات عدا الخدمة الذاتية للموظف */
    branchMap: (acc, admin, approver, u) => u.role !== 'employee',
    /* المخزون (قيد التطوير): مدير النظام وفريق المخازن */
    stock: (acc, admin, approver, u) => admin || (u.flowRoles || []).includes('storeMgr'),
    /* أدوات تحليل: لكل الحسابات عدا الخدمة الذاتية للموظف */
    analysis: (acc, admin, approver, u) => u.role !== 'employee',
    /* السلامة والصحة المهنية: كل الحسابات عدا الخدمة الذاتية (يبلّغون ويرون فرعهم)، ومسؤولو السلامة يديرون الكل */
    hse: (acc, admin, approver, u) => u.role !== 'employee',
    /* الحوكمة والامتثال: لكل الحسابات (السياسات والإقرارات والبلاغات)، والإدارة لفريق الحوكمة */
    governance: (acc, admin, approver, u) => true,
    /* مكتبة المهن: للجميع */
    knowledge: (acc, admin, approver, u) => true,
    /* مركز التدريب: للجميع (الموظف يرى دوراته فقط) */
    training: (acc, admin, approver, u) => true,
    /* إدارة الفروع: مدير النظام ومدير المتابعة ومديرو المناطق ومديرو الفروع والمدير التنفيذي والموارد البشرية (طلبات النقل والانتداب) */
    supervision: (acc, admin, approver, u) =>
      admin || !!u.branchManager || ['supMgr', 'regionMgr', 'execMgr', 'empMgr'].some((k) => (u.flowRoles || []).includes(k)),
    /* الورشة: فريق المخازن ومسؤولو الورش ومدير الحركة */
    workshop: (acc, admin, approver, u) => admin || ['storeMgr', 'maintWs', 'traffic'].some((k) => (u.flowRoles || []).includes(k)),
    /* قسم الحفر: فريقه ومدير الحركة وموظفو فرع قسم الحفر */
    drilling: (acc, admin, approver, u) =>
      admin || ['drillMgr', 'traffic'].some((k) => (u.flowRoles || []).includes(k)) || u.branch === 'قسم الحفر',
    /* إدارة الجرد: فريق الجرد، ومحاسب الفرع يرى جرد فرعه */
    inventory: (acc, admin, approver, u) => H.pageDefaultValue8(admin, u) || (acc && !!u.branch),
    /* الأجهزة النوعية: فريق الجرد يديرها، ومحاسب الفرع يراها ويطلب استعارتها */
    devices: (acc, admin, approver, u) => H.pageDefaultValue9(admin, u) || (acc && !!u.branch),
    /* سجل الموظفين (بيانات شخصية): مسؤولوه وشئون الموظفين وفرق التوظيف، ومحاسب الفرع يرى موظفي فرعه؛ وغيرهم يتيحه له مدير النظام من صفحاته */
    employees: (acc, admin, approver, u) =>
      admin ||
      ['empMgr', 'transHr', 'recruiter', 'hirePay', 'hireHead'].some((k) => (u.flowRoles || []).includes(k)) ||
      (acc && !!u.branch),
  };

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
  /* أنواع حقول منشئ النماذج: الأساسية + قائمة الفروع + جدول بأعمدة + عنوان قسم (للتنظيم فقط، بلا قيمة) */
  const BLOCK_TYPES = [
    ['para', 'فقرة نص'],
    ['heading', 'عنوان قسم'],
    ['fields', 'جدول بيانات الحقول'],
    ['box', 'صندوق بعنوان'],
    ['table', 'جدول (حقل جدول)'],
    ['long', 'نص طويل في صندوق'],
  ];
  const TEMPLATES = {
    housingFixed: {
      intro: 'برجاء تحديد قيمة (بدل سكن ثابت) للموظف الآتي بياناته :',
      showTable: true,
      outro: `حيث أن الموظف يسكن في سكن خارجي بداية من ${H.B('تاريخ بداية السكن الخارجي')} م`,
    },
    housingVisit: {
      intro: 'برجاء تحديد قيمة (بدل سكن زيارة) للموظف الآتي بياناته :',
      showTable: true,
      outro: `حيث أن الموظف قام بعمل زيارة عائلية ويسكن بسكن خارجي بداية من ${H.B('تاريخ بداية السكن الخارجي')}`,
    },
    transport: { intro: 'برجاء تحديد قيمة (بدل إنتقال) للموظف الآتي بياناته :', showTable: true, outro: '' },
    contact: {
      intro: `برجاء الموافقة على صرف بدل إتصال بقيمة ( ${H.B('قيمة البدل (ريال)')} ) ﷼ للموظف الآتي بياناته :`,
      showTable: true,
      outro: 'توقيع مدير الفرع : ..............................',
    },
    residence: {
      intro: 'برجاء تحديد قيمة (بدل إقامة) للموظف الآتي بياناته :',
      showTable: true,
      outro: 'ملاحظات : يتم إرفاق صورة الإقامة، وصورة من إيصال التحويل في حالة تحويل المبلغ للكفيل.',
    },
    site: {
      intro: `برجاء الموافقة على صرف مبلغ ( ${H.B('المبلغ المستحق (ريال)')} ) ريال قيمة (بدل موقع) للموظف الآتي بياناته :`,
      showTable: true,
      outro: '',
    },
    commission: {
      intro: `فضلاً الموافقة على صرف مبلغ ( ${H.B('المبلغ (ريال - يقبل الهللات)')} ) ريال سعودي ( ${H.B('التفقيط')} ) من فرع ( ${H.B('الفرع')} ) قيمة عمولة لـ ( ${H.B('عمولة لـ')} ) وذلك بمعلومية مدير الفرع المهندس ( ${H.B('مدير الفرع (المهندس)')} ).`,
      showTable: false,
      outro: '',
    },
    license: {
      intro: `برجاء تحديد قيمة ( مصروفات رخصة قيادة ) ( ${H.B('نوع الرخصة')} ) للموظف / ${H.B('اسم الموظف')} إقامة رقم ${H.B('رقم الإقامة / الهوية')} والذي يعمل ${H.B('الوظيفة')} بفرع ${H.B('الفرع')}`,
      showTable: false,
      outro: '',
    },
    advanceShort: {
      intro: `برجاء الموافقة على صرف سلفة قصيرة الأجل بمبلغ ( ${H.B('مبلغ السلفة (ريال)')} ) ريال سعودي ( ${H.B('التفقيط')} ) للموظف الآتي بياناته، على أن تُخصم دفعة واحدة من راتب شهر ( ${H.B('تُخصم من راتب شهر')} ) :`,
      showTable: true,
      outro: `إقرار الموظف : أتعهد أنا الموظف / ${H.B('اسم الموظف')} بسداد مبلغ السلفة الموضح أعلاه، وأوافق على خصمه كاملاً من راتب الشهر المحدد.\nتوقيع الموظف : ..............................`,
    },
  };
  const CAPS = [
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
    ['d.sup', 'إدارة الفروع', 'أعمال الإدارات'],
    ['d.train', 'مركز التدريب', 'أعمال الإدارات'],
    ['d.fuel', 'المحروقات', 'أعمال الإدارات'],
    ['d.docs', 'الوثائق والمستندات', 'أعمال الإدارات'],
    ['d.crm', 'العملاء والقضايا', 'أعمال الإدارات'],
  ];
  /* الأسماء القديمة ← الجديدة */
  const BP_KAF_OLD = {
    'سادن المتخصصة': H.BP_KAFALA[0],
    'بحر الشهد': 'شركة كانتل',
    كانتل: 'شركة كانتل',
    أرابور: H.BP_KAFALA[2],
    'ورشة سادن': H.BP_KAFALA[3],
    'سادن سبيشيالايزد': H.BP_KAFALA[4],
    'سادن المتوسطة': H.BP_KAFALA[5],
    'أركان البناء': H.BP_KAFALA[6],
    'المدى الدولي': H.BP_KAFALA[7],
    'قصبة للهندسة المدنية': H.BP_KAFALA[8],
    'خارج الكفالة': H.BP_OUT,
  };
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
  return { PAGE_DEFAULTS, FIELD_TYPES, BLOCK_TYPES, TEMPLATES, CAPS, DASH_SECTIONS, BP_KAF_OLD, BP_ALLOW, BP_DED, PAY_ALLOW, BP_EMP_KEY };
});
