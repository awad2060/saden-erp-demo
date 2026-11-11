/* بيانات forms.js (forms-data-7): FORMS
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-data-7'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  return [
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date' },
        { key: 'bank', label: 'البنك', hint: 'فارغ = من سجل الموظفين' },
        { key: 'iban', label: 'رقم الآيبان', hint: 'فارغ = من سجل الموظفين' },
        { key: 'reason', label: 'الغرض', type: 'select', options: ['تمويل شخصي', 'تمويل عقاري', 'بطاقة ائتمانية', 'أخرى'] },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'إدارة الرواتب' },
        { key: 'total', label: 'إجمالي الراتب', hidden: true },
      ],
      summary: (d) => `تثبيت راتب: ${d.name || ''} — ${d.bank || ''}`,
      body: (d) => `<p>السادة / <b>${H.esc(d.bank || '....')}</b> المحترمين</p>
        <p>تفيد الشركة بأن السيد / ${H.val(d.name)}، رقم الإقامة / الهوية ( ${H.val(d.iqama)} )، يعمل لدينا بوظيفة <b>${H.esc(d.job || '....')}</b> منذ ${H.val(H.fmtDate(d.joinDate))}، براتب شهري إجمالي قدره ( ${H.val(H.fmtNum(d.total))} ) ريال.</p>
        <p>وتتعهد الشركة بتحويل راتبه الشهري ومستحقاته إلى حسابه لديكم رقم الآيبان ( <bdi dir="ltr">${H.esc(d.iban || '....')}</bdi> )، وعدم تحويله إلى بنك آخر إلا بعد الحصول على خطاب إخلاء طرف منكم، طالما ظل على رأس العمل لدينا.</p>`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
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
      summary: (d) => `زيارة عائلية: ${d.name || ''} — ${d.relation || ''}${d.amount ? ` — بدل ${H.fmtNum(d.amount)}` : ''}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على زيارة عائلية للموظف الآتي بياناته${d.amount ? '، وصرف بدل الزيارة العائلية' : ''}.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['الزوار', d.relation], ['عدد الزوار', d.visitors], ['من تاريخ', H.fmtDate(d.from)], ['إلى تاريخ', H.fmtDate(d.to)], ['المدة', d.days ? `${d.days} يوم` : ''], ['رقم طلب الزيارة', d.visaNo], ['بدل الزيارة', d.amount ? `${H.fmtNum(d.amount)} ريال` : 'بدون']])}
        ${d.notes ? H.decisionBox('ملاحظات', H.esc(d.notes), true) : ''}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
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
      summary: (d) => `رحلة عمل: ${d.name || ''} إلى ${d.destination || ''}${d.amount ? ` — ${H.fmtNum(d.amount)} ريال` : ''}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على انتداب الموظف الآتي بياناته في رحلة عمل إلى <b>${H.esc(d.destination || '....')}</b>.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['من تاريخ', H.fmtDate(d.from)], ['إلى تاريخ', H.fmtDate(d.to)], ['عدد الأيام', d.days], ['وسيلة السفر', d.transport], ['بدل الانتداب اليومي', H.fmtNum(d.perDiem)], ['مصروفات أخرى', H.fmtNum(d.expenses)], ['الإجمالي', d.amount ? `${H.fmtNum(d.amount)} ريال` : '']])}
        ${H.decisionBox('الغرض من الرحلة', H.esc(d.purpose || ''), true)}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'day', label: 'تاريخ اليوم المطلوب تصحيحه', type: 'date', required: true },
        { key: 'kind', label: 'نوع التصحيح', type: 'select', options: ['دخول', 'خروج', 'دخول وخروج'], required: true },
        { key: 'timeIn', label: 'وقت الدخول الصحيح', type: 'time', showIf: ['kind', ['دخول', 'دخول وخروج']] },
        { key: 'timeOut', label: 'وقت الخروج الصحيح', type: 'time', showIf: ['kind', ['خروج', 'دخول وخروج']] },
        { key: 'reason', label: 'السبب', type: 'textarea', required: true, hint: 'مثال: عطل جهاز البصمة / مهمة خارجية' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'المدير المباشر أو مدير الفرع' },
      ],
      summary: (d) => `تصحيح بصمة: ${d.name || ''} — ${H.fmtDate(d.day)} (${d.kind || ''})`,
      body: (d) => `<p>نرجو التكرم بالموافقة على تصحيح بصمة الموظف الآتي بياناته، ويُحدَّث سجل الحضور تلقائياً بعد الاعتماد.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['اليوم', H.fmtDate(d.day)], ['نوع التصحيح', d.kind], ['وقت الدخول', d.timeIn], ['وقت الخروج', d.timeOut]])}
        ${H.decisionBox('السبب', H.esc(d.reason || ''), true)}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date', hint: 'فارغ = من سجل الموظفين' },
        { key: 'contractType', label: 'نوع العقد', type: 'select', options: ['محدد', 'غير محدد'], required: true },
        {
          key: 'endType',
          label: 'نوع إنهاء الخدمة',
          type: 'select',
          required: true,
          options: H.END_TYPES.map((x) => x.name),
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
      summary: (d) => `إنهاء خدمة (${d.endType || ''}): ${d.name || ''} — آخر يوم ${H.fmtDate(d.lastDay)}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على إنهاء خدمة الموظف الآتي بياناته وفق نظام العمل السعودي.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['تاريخ التعيين', H.fmtDate(d.joinDate)], ['مدة الخدمة', d.years], ['نوع العقد', d.contractType], ['نوع الإنهاء', d.endType], ['تاريخ الإشعار', H.fmtDate(d.noticeDate)], ['آخر يوم عمل', H.fmtDate(d.lastDay)], ['مدة الإشعار النظامية', d.noticeDays]])}
        ${d.noticeNote ? H.decisionBox('الإشعار (م 75)', H.esc(d.noticeNote), true) : ''}
        ${d.eosRule ? H.decisionBox('أثر الإنهاء على مكافأة نهاية الخدمة (م 84 / 85)', `${H.esc(d.eosRule)}<br><small>المبلغ يُحسب عند التصفية من حاسبة قوى الرسمية: ${H.esc(H.EOS_QIWA)}</small>`, true) : ''}
        ${H.decisionBox('الأسباب / التفاصيل', H.esc(d.reason || ''), true)}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'day', label: 'اليوم', type: 'date', required: true },
        { key: 'kind', label: 'النوع', type: 'select', options: ['انصراف مبكر', 'استئذان خلال الدوام', 'تأخير صباحي'], required: true },
        { key: 'fromTime', label: 'من الساعة', type: 'time', required: true },
        { key: 'toTime', label: 'إلى الساعة', type: 'time', showIf: ['kind', ['استئذان خلال الدوام', 'تأخير صباحي']] },
        { key: 'reason', label: 'السبب', type: 'textarea', required: true },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'المدير المباشر أو مدير الفرع' },
        { key: 'hours', label: 'المدة', hidden: true },
      ],
      summary: (d) =>
        `${d.kind || 'إذن انصراف'}: ${d.name || ''} — ${H.fmtDate(d.day)} ${d.fromTime || ''}${d.toTime ? ` إلى ${d.toTime}` : ''}`,
      body: (d) => `<p>نرجو التكرم بالموافقة على ${H.esc(d.kind || 'إذن الانصراف')} للموظف الآتي بياناته.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['اليوم', H.fmtDate(d.day)], ['النوع', d.kind], ['من الساعة', d.fromTime], ['إلى الساعة', d.toTime], ['المدة', d.hours]])}
        ${H.decisionBox('السبب', H.esc(d.reason || ''), true)}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
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
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['البيان', d.field], ['القيمة الحالية', d.oldValue || '—'], ['القيمة الجديدة', d.newValue]])}
        ${d.reason ? H.decisionBox('السبب / ملاحظات', H.esc(d.reason), true) : ''}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
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
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['نوع الشكوى', d.kind], ['الموضوع', d.subject], ['ضد', d.against || '—'], ['تاريخ الواقعة', H.fmtDate(d.incidentDate) || '—']])}
        ${H.decisionBox('تفاصيل الشكوى', H.esc(d.details), true)}
        ${d.witnesses ? H.decisionBox('الشهود', H.esc(d.witnesses), true) : ''}
        ${d.request ? H.decisionBox('المطلوب', H.esc(d.request), true) : ''}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'month', label: 'شهر التقييم', required: true },
        { key: 'score', label: 'الدرجة', readonly: true },
        { key: 'reason', label: 'سبب الاعتراض', type: 'textarea', required: true },
        { key: 'expected', label: 'الدرجة / التعديل المطلوب' },
      ],
      summary: (d) => `اعتراض على تقييم ${d.month || ''} — ${d.name || ''}`,
      body: (d) => `<p>أعترض على تقييم أدائي الشهري المبيّن أدناه للأسباب التالية، راجياً مراجعته.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['شهر التقييم', d.month], ['الدرجة', d.score ? `${d.score} / 100` : '—'], ['المطلوب', d.expected || '—']])}
        ${H.decisionBox('سبب الاعتراض', H.esc(d.reason), true)}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
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
      body: (
        d,
      ) => `<p>أرفع إليكم ${H.esc(d.kind || 'التقرير')}${d.managerName ? ` (إلى: ${H.esc(d.managerName)})` : ''} للاطلاع والتوجيه.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['نوع التقرير', d.kind], ['العنوان', d.subject], ['الفترة', d.period || '—']])}
        ${H.decisionBox('ما تم إنجازه', H.esc(d.done), true)}
        ${d.issues ? H.decisionBox('المعوقات والملاحظات', H.esc(d.issues), true) : ''}
        ${d.next ? H.decisionBox('الخطة القادمة', H.esc(d.next), true) : ''}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        H.F.joinDate,
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
        return `<p class="l-para">برجاء الموافقة على صرف سلفة طويلة الأجل بمبلغ ( ${H.val(H.fmtNum(d.amount))} ) ريال سعودي ( ${H.val(H.tafqeet(d.amount), '........................')} ) للموظف الآتي بياناته :</p>
        ${H.infoTable([
          ['الإسم', d.name],
          ['رقم الإقامة', d.iqama],
          ['الوظيفة', d.job],
          ['الفرع', d.branch],
          ['تاريخ التعيين', H.fmtDate(d.joinDate)],
          ['إجمالي الراتب', H.fmtNum(d.salary)],
        ])}
        <h4 class="l-sec">طريقة السداد :</h4>
        <table class="lt grid"><thead><tr><th>مبلغ السلفة</th><th>عدد الأقساط</th><th>القسط الشهري</th><th>نسبة القسط من الراتب</th><th>بداية الخصم</th><th>رصيد سلف سابقة</th></tr></thead>
        <tbody><tr><td>${H.esc(H.fmtNum(d.amount))}</td><td>${H.esc(d.installments)}</td><td><b>${H.esc(H.fmtNum(monthly))}</b></td><td>${H.esc(ratio)}</td><td>${H.esc(d.startMonth)}</td><td>${d.prevBalance ? H.esc(H.fmtNum(d.prevBalance)) : 'لا يوجد'}</td></tr></tbody></table>
        <p><b>سبب السلفة :</b> ${H.val(d.reason)}</p>
        <div class="l-notes"><b>إقرار الموظف :</b><br>أتعهد أنا الموظف / ${H.val(d.name, '....................')} بسداد مبلغ السلفة الموضح أعلاه، وأوافق على خصم الأقساط من راتبي الشهري كما هو مبين، وفي حالة انتهاء خدمتي لأي سبب قبل سداد كامل المبلغ يحق للشركة خصم المتبقي من مستحقاتي.
        ${H.empSigLine(d)}</div>`;
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'salary', label: 'إجمالي الراتب الشهري (ريال)', type: 'number', required: true },
        { key: 'amount', label: 'مبلغ السلفة (ريال)', type: 'number', required: true },
        { key: 'deductMonth', label: 'تُخصم من راتب شهر', required: true, hint: 'مثال: نوفمبر 2026' },
        { key: 'reason', label: 'سبب السلفة', type: 'textarea', required: true },
      ],
      amountKey: 'amount',
      summary: (d) => `سلفة قصيرة: ${d.name || ''}`,
      body: (
        d,
      ) => `<p class="l-para">برجاء الموافقة على صرف سلفة قصيرة الأجل بمبلغ ( ${H.val(H.fmtNum(d.amount))} ) ريال سعودي ( ${H.val(H.tafqeet(d.amount), '........................')} ) للموظف الآتي بياناته، على أن تُخصم دفعة واحدة من راتب شهر ( ${H.val(d.deductMonth)} ) :</p>
        ${H.infoTable([
          ['الإسم', d.name],
          ['رقم الإقامة', d.iqama],
          ['الوظيفة', d.job],
          ['الفرع', d.branch],
          ['إجمالي الراتب', H.fmtNum(d.salary)],
          ['مبلغ السلفة', H.fmtNum(d.amount)],
        ])}
        <p><b>سبب السلفة :</b> ${H.val(d.reason)}</p>
        <div class="l-notes"><b>إقرار الموظف :</b><br>أتعهد أنا الموظف / ${H.val(d.name, '....................')} بسداد مبلغ السلفة الموضح أعلاه، وأوافق على خصمه كاملاً من راتب الشهر المحدد.
        ${H.empSigLine(d)}</div>`,
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
      fields: H.DED_FIELDS,
      amountKey: 'value',
      body: (d) => H.dedBody(d),
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
        H.F.date,
        H.F.name,
        { ...H.F.branch, label: 'الإدارة / الفرع' },
        H.F.iqama,
        H.F.job,
        { key: 'invNo', label: 'رقم التحقيق', required: true },
        { key: 'invDate', label: 'تاريخ التحقيق', type: 'date', required: true },
        { key: 'invResult', label: 'نتيجة التحقيق / توصية الشئون القانونية', type: 'textarea', required: true },
        H.DED_FIELDS[5],
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
        H.dedBody(
          d,
          `<h4 class="l-sec">ثانياً : بيانات التحقيق :</h4>
        <table class="lt"><tr><td class="lbl">رقم التحقيق</td><td>${H.esc(d.invNo)}</td><td class="lbl">تاريخ التحقيق</td><td>${H.esc(H.fmtDate(d.invDate))}</td></tr>
        <tr><td class="lbl">نتيجة التحقيق</td><td colspan="3" style="height:50px;vertical-align:top;white-space:pre-wrap">${H.esc(d.invResult)}</td></tr></table>`,
          'بناءً على التحقيق المشار إليه أعلاه، تقرر الخصم من راتب الموظف وفق البيانات التالية.',
          true,
        ) + H.legalApply(d),
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'decisionSerial', label: 'رقم قرار الخصم', hint: 'يُملأ تلقائياً من القرار' },
        { key: 'penalty', label: 'الجزاء المقرر' },
        { key: 'decisionReason', label: 'سبب الخصم', type: 'textarea' },
        { key: 'appeal', label: 'أسباب التظلم', type: 'textarea', required: true },
        { key: 'request', label: 'المطلوب', type: 'textarea' },
        { key: 'decisionId', label: 'القرار', hidden: true },
      ],
      summary: (d) => `تظلم من قرار الخصم ${d.decisionSerial || ''} — ${d.name || ''}`,
      body: (d) => `<p>أتقدم بهذا التظلم على قرار الخصم المبيّن أدناه، راجياً إعادة النظر فيه.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['رقم قرار الخصم', d.decisionSerial], ['الجزاء المقرر', d.penalty || '—']])}
        ${d.decisionReason ? H.decisionBox('سبب الخصم', H.esc(d.decisionReason), true) : ''}
        ${H.decisionBox('أسباب التظلم', H.esc(d.appeal), true)}
        ${d.request ? H.decisionBox('المطلوب', H.esc(d.request), true) : ''}`,
    },
    /* نماذج إدارة الحركة في ملف مستقل (forms-traffic.js): محضر تسليم المركبة، وكارت السيارة، وتغيير الزيت، وسداد المخالفة، وصيانة المركبة */
    ...H.FORM_PARTS.flatMap((part) =>
      part({
        F: H.F,
        infoTable: H.infoTable,
        esc: H.esc,
        fmtDate: H.fmtDate,
        fmtNum: H.fmtNum,
        tafqeet: H.tafqeet,
        MAINT_TYPES: H.MAINT_TYPES,
        EXT_WORKSHOP: H.EXT_WORKSHOP,
        VEH_TYPES: H.VEH_TYPES,
        VEH_PAPER: H.VEH_PAPER,
        VEH_IMG: H.VEH_IMG,
        vehDiagram: H.vehDiagram,
      }),
    ),
    {
      id: 'clearance',
      group: 'الخصومات والتصفية',
      title: 'بيان الخصومات والعهد لإدراجها بتصفية موظف',
      fields: [
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.branch,
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
        return `<p class="l-para">فيما يلي بيان بكل ما يخص الموظف / ${H.val(d.name)} رقم إقامة : ${H.val(d.iqama)} فرع ${H.val(d.branch)} من قيمة خصومات وعهد نقدية وعينية وطريقة تسليمها قبل إعداد التصفية.</p>
        <h4 class="l-sec">خصومات الموظف :</h4>
        <table class="lt grid"><thead><tr><th>نوع الخصم</th><th>القيمة المادية</th></tr></thead><tbody>
        ${ded.map((r) => `<tr><td>${H.esc(r.type)}</td><td class="red">${H.esc(H.fmtNum(r.amount))}</td></tr>`).join('') || '<tr><td colspan="2">لا يوجد</td></tr>'}
        <tr class="total"><td>إجمالي الخصومات</td><td class="red">${H.esc(H.fmtNum(total))}</td></tr></tbody></table>
        <h4 class="l-sec">العهد العينية :</h4>
        <table class="lt grid"><thead><tr><th>العهدة</th><th>المواصفات</th><th>المستلم</th><th>التاريخ</th></tr></thead><tbody>
        ${as.map((r) => `<tr><td>${H.esc(r.type)}</td><td>${H.esc(r.spec || '-')}</td><td>${H.esc(r.receiver || '-')}</td><td>${H.esc(H.fmtDate(r.date) || '-')}</td></tr>`).join('') || '<tr><td colspan="4">لا يوجد</td></tr>'}
        </tbody></table>`;
      },
    },
  ];
});
