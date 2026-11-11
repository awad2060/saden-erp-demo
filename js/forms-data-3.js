/* بيانات forms.js (forms-data-3): TASKS
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-data-3'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
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
            { key: 'type', label: 'نوع الخصم', type: 'select', options: H.CASE_DED },
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
            { key: 'type', label: 'العهدة', type: 'select', options: H.CASE_ASSETS },
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
      fields: [...H.CAR_FIELDS, { key: 'receiver', label: 'المستلم من إدارة الحركة', required: true }],
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
    mPay: { ...H.PAY_TASK, label: 'سداد تكلفة الصيانة', button: '✔ تم السداد — إرسال للورشة للتنفيذ' },
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
    mfgPay: { ...H.PAY_TASK, label: 'اعتماد ودفع تكلفة التصنيع', button: '✔ تم الاعتماد والدفع — إرسال للتنفيذ' },
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
        ...H.HIRE_CRITERIA.map(([key, label]) => ({ key, label, type: 'select', options: H.HIRE_RATING, required: true })),
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
        ...H.HIRE_PAY.map(([key, label]) => ({ key, label, type: 'number', required: key === 'basic' })),
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
        { key: 'ticket', label: 'تذكرة الطيران', type: 'select', options: H.HIRE_TICKETS, default: H.HIRE_TICKETS[1] },
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
          options: ['الموافقة على التعيين بالعرض المالي المقترح', H.HIRE_MODIFY],
          required: true,
        },
        /* عند تعديل الراتب: البنود المعتمدة (تظهر في العرض الوظيفي) */
        ...H.HIRE_PAY.map(([k, l]) => ({
          key: 'f_' + k,
          label: `${l} المعتمد`,
          type: 'number',
          required: k === 'basic',
          showIf: ['decision', H.HIRE_MODIFY],
        })),
        { key: 'decisionNote', label: 'ملاحظات رئيس لجنة التوظيف', type: 'textarea' },
      ],
    },
  };
  return { TASKS };
});
