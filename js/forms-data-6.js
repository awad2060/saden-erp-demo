/* بيانات forms.js (forms-data-6): FORMS
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-data-6'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  return [
    {
      id: 'contact',
      group: 'البدلات',
      title: 'خطاب تعميد بدل إتصال',
      fields: [
        H.F.date,
        { key: 'amount', label: 'قيمة البدل (ريال)', type: 'number', required: true, default: '115' },
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.prof,
        { key: 'startDate', label: 'تاريخ بداية البدل', type: 'date', required: true },
        H.F.branch,
        { key: 'reason', label: 'قرار مدير الفرع مع ذكر سبب البدل', type: 'textarea', required: true },
      ],
      amountKey: 'amount',
      body: (d) => `<p>برجاء الموافقة على صرف بدل إتصال بقيمة (${H.val(H.fmtNum(d.amount), '....')}) ﷼ للموظف الآتي بياناته :</p>
        ${H.infoTable([...H.basicPairs(d), ['تاريخ بداية البدل', H.fmtDate(d.startDate)], ['الفرع', d.branch]])}
        ${H.decisionBox('قرار مدير الفرع مع ذكر سبب البدل', H.esc(d.reason), true)}${H.branchSig}`,
    },
    {
      id: 'contactBulk',
      group: 'البدلات',
      title: 'خطاب تعميد بدل إتصال مجمع',
      fields: [
        H.F.date,
        { key: 'amount', label: 'قيمة البدل للموظف (ريال)', type: 'number', required: true, default: '115' },
        H.F.branch,
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
      body: (d) => `<p>برجاء الموافقة على صرف بدل إتصال بقيمة (${H.val(H.fmtNum(d.amount), '....')}) ريال للموظفين الآتي بياناتهم :</p>
        <table class="lt grid"><thead><tr><th style="width:6%">م</th><th>الإسم</th><th>رقم الإقامة</th><th>الوظيفة</th><th>تاريخ بداية البدل</th><th>الفرع</th></tr></thead><tbody>
        ${(d.employees || []).map((e, i) => `<tr><td>${i + 1}</td><td>${H.esc(e.name)}</td><td>${H.esc(e.iqama)}</td><td>${H.esc(e.job)}</td><td>${H.esc(H.fmtDate(e.startDate))}</td><td>${H.esc(e.branch || d.branch)}</td></tr>`).join('') || '<tr><td colspan="6">&nbsp;</td></tr>'}
        </tbody></table>
        ${H.decisionBox('قرار مدير الفرع مع ذكر سبب البدل', H.esc(d.reason), true)}${H.branchSig}`,
    },
    H.valueAllowance({
      id: 'residence',
      label: 'بدل إقامة',
      requiredAttachments: ['صورة الإقامة'],
      fields: [
        { key: 'iqamaExpiry', label: 'تاريخ انتهاء الإقامة', type: 'date' },
        H.F.joinDate,
        { key: 'sponsor', label: 'اسم الكفيل' },
        H.F.branch,
      ],
      pairs: (d) => [
        ['تاريخ إنتهاء الإقامة', H.fmtDate(d.iqamaExpiry)],
        ['تاريخ التعيين', H.fmtDate(d.joinDate)],
        ['اسم الكفيل', d.sponsor],
        ['الفرع', d.branch],
      ],
      extra: () =>
        `<div class="l-notes"><b>ملاحظات :</b> يتم إرفاق :<ul><li>صورة الإقامة .</li><li>صورة من إيصال التحويل في حالة تحويل المبلغ للكفيل .</li></ul></div>`,
    }),
    H.valueAllowance({
      id: 'transport',
      label: 'بدل إنتقال',
      fields: [H.F.branch, H.F.joinDate],
      pairs: (d) => [
        ['الفرع', d.branch],
        ['تاريخ التعيين', H.fmtDate(d.joinDate)],
      ],
    }),
    H.valueAllowance({
      id: 'housingFixed',
      label: 'بدل سكن ثابت',
      fields: [H.F.branch, H.F.joinDate, { key: 'housingDate', label: 'تاريخ بداية السكن الخارجي', type: 'date', required: true }],
      pairs: (d) => [
        ['الفرع', d.branch],
        ['تاريخ التعيين', H.fmtDate(d.joinDate)],
      ],
      extra: (d) => `<p>حيث أن الموظف يسكن في سكن خارجي بداية من ${H.val(H.fmtDate(d.housingDate), '00/00/0000')} م</p>`,
    }),
    H.valueAllowance({
      id: 'housingVisit',
      label: 'بدل سكن زيارة',
      title: 'خطاب تعميد بدل سكن زيارة',
      requiredAttachments: ['صورة تأشيرة الزيارة'],
      fields: [
        H.F.branch,
        { key: 'lastReturn', label: 'تاريخ آخر عودة من الإجازة', type: 'date', required: true },
        { key: 'housingDate', label: 'تاريخ بداية السكن الخارجي', type: 'date', required: true },
      ],
      pairs: (d) => [
        ['الفرع', d.branch],
        ['تاريخ آخر عودة من الإجازة', H.fmtDate(d.lastReturn)],
      ],
      extra: (d) => `<p>حيث أن الموظف قام بعمل زيارة عائلية ويسكن بسكن خارجي بداية من ${H.val(H.fmtDate(d.housingDate), '00/00/0000')}</p>`,
    }),
    {
      id: 'site',
      group: 'البدلات',
      title: 'خطاب تعميد بدل موقع',
      fields: [
        H.F.date,
        { key: 'amount', label: 'المبلغ المستحق (ريال)', type: 'number', required: true },
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.prof,
        { key: 'site', label: 'اسم الموقع', required: true },
        { key: 'reports', label: 'عمل تقارير بالموقع', type: 'select', options: ['يعمل', 'لا يعمل'], required: true },
        H.F.branch,
        { key: 'housing', label: 'السكن', type: 'select', options: ['سكن شركة', 'سكن موقع'], required: true },
      ],
      amountKey: 'amount',
      body: (d) => `<p>برجاء الموافقة على صرف مبلغ ( ${H.val(H.fmtNum(d.amount))} ) ريال قيمة (بدل موقع) للموظف الآتي بياناته :</p>
        ${H.infoTable([...H.basicPairs(d), ['اسم الموقع', d.site], ['عمل تقارير بالموقع', d.reports], ['الفرع', d.branch], ['سكن شركة / موقع', d.housing]])}`,
    },
    {
      id: 'salaryRaise',
      group: 'المستحقات',
      title: 'خطاب تعميد زيادة راتب',
      /* سري: لا يظهر في سجل الفرع ولا لمن ليس في مساره */
      confidential: true,
      fields: [
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'startMonth', label: 'تبدأ الزيادة من راتب شهر', required: true, hint: 'مثال: يونيو 2026' },
        ...H.salaryFields('b_', 'قبل الزيادة'),
        ...H.salaryFields('a_', 'بعد الزيادة'),
        { key: 'reason', label: 'سبب الزيادة', type: 'textarea', required: true },
      ],
      summary: (d) => `زيادة راتب: ${d.name || ''}`,
      amount: (d) => {
        const v = H.salaryTotal(d, 'a_') - H.salaryTotal(d, 'b_');
        return v > 0 ? v : '';
      },
      body: (
        d,
      ) => `<p class="l-para">برجاء الموافقة على زيادة ( راتب ) الموظف / ${H.val(d.name, '....................')} والذي يعمل ${H.val(d.job)} بفرع ${H.val(d.branch)} بحيث تكون الزيادة بداية من راتب ${H.val(d.startMonth)} .</p>
        <h4 class="l-sec">تفاصيل الراتب قبل الزيادة :</h4>${H.salaryTable(d, 'b_')}
        <h4 class="l-sec">تفاصيل الراتب بعد الزيادة :</h4>${H.salaryTable(d, 'a_')}
        <p><b>سبب الزيادة :</b> ${H.val(d.reason)}</p>`,
    },
    {
      id: 'commission',
      group: 'المستحقات',
      title: 'خطاب إعتماد صرف عمولة',
      fields: [
        H.F.date,
        { key: 'amount', label: 'المبلغ (ريال - يقبل الهللات)', type: 'number', required: true },
        H.F.branch,
        { key: 'forWhom', label: 'عمولة لـ', required: true },
        { key: 'manager', label: 'مدير الفرع (المهندس)', required: true },
      ],
      amountKey: 'amount',
      summary: (d) => `عمولة لـ ${d.forWhom || ''}`,
      extraSigs: ['مدير الفرع'],
      body: (d) =>
        `<p class="l-para">فضلاً الموافقة على صرف مبلغ ( ${H.val(H.fmtNum(d.amount))} ) ريال سعودي ( ${H.val(H.tafqeet(d.amount), '........................')} ) من فرع ( ${H.val(d.branch)} ) قيمة عمولة لـ ( ${H.val(d.forWhom)} ) وذلك بمعلومية مدير الفرع المهندس ( ${H.val(d.manager)} ).</p>`,
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
      amount: (d) => (d.combined ? H.sheetTotal(d) || '' : ''),
      letterTitle: (d) => `بيان ${d.sheetType || 'جُمع / إعاشات'} موظف عن شهر`,
      noDest: true,
      noDecisionBox: true,
      fields: [
        H.F.date,
        { key: 'sheetType', label: 'نوع البيان', type: 'select', options: ['جُمع', 'إعاشات'], required: true },
        H.F.branch,
        { ...H.F.name, label: 'اسم الموظف' },
        { ...H.F.iqama, required: false },
        { key: 'month', label: 'عن شهر', type: 'select', options: H.AR_MONTHS, required: true },
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
        const total = H.sheetTotal(d);
        const kind = d.sheetType || 'جُمع / إعاشات';
        const word = d.sheetType === 'إعاشات' ? 'الإعاشة' : d.sheetType === 'جُمع' ? 'الجمعة' : 'المبلغ';
        return `<p class="l-para">فرع : ${H.val(d.branch)}</p>
        <p class="l-para">بيان ${H.esc(kind)} الموظف / ${H.val(d.name, '..............................')}${d.iqama ? ` (إقامة ${H.esc(d.iqama)})` : ''} عن شهر ${H.val(d.month)} ${H.val(d.year)}</p>
        <table class="lt sheet-t"><tr><th>م</th><th>التاريخ</th><th>اليوم</th><th>مبلغ ${word}</th><th>تفاصيل ${word}</th><th>ملاحظات</th></tr>
          ${rows.map((r, i) => `<tr><td class="num">${i + 1}</td><td>${H.esc(H.fmtDate(r.date))}</td><td>${H.esc(H.dayName(r.date))}</td><td class="num">${H.esc(H.fmtNum(r.amount))}</td><td>${H.esc(r.details)}</td><td class="l-note-red">${H.esc(r.notes)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">لا توجد أيام</td></tr>'}
          <tr class="total-row"><td colspan="3"><b>إجمالي مبلغ ${d.sheetType ? 'ال' : ''}${H.esc(kind)}</b></td><td class="num"><b>${H.esc(H.fmtNum(total))}</b></td><td colspan="2">${total ? H.esc(H.tafqeet(total)) : ''}</td></tr></table>`;
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
      amount: (d) => H.sheetTotal(d) || '',
      letterTitle: (d) => `بيان ${d.sheetType || 'جُمع / إعاشات'} موظفي الفرع (إجمالي) عن شهر`,
      noDest: true,
      noDecisionBox: true,
      fields: [
        H.F.date,
        { key: 'sheetType', label: 'نوع البيان', type: 'select', options: ['جُمع', 'إعاشات'], required: true },
        H.F.branch,
        { key: 'month', label: 'عن شهر', type: 'select', options: H.AR_MONTHS, required: true },
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
        const total = H.sheetTotal(d);
        const kind = d.sheetType || 'جُمع / إعاشات';
        const word = d.sheetType === 'إعاشات' ? 'الإعاشات' : d.sheetType === 'جُمع' ? 'الجُمع' : 'المبلغ';
        return `<p class="l-para">فرع : ${H.val(d.branch)}</p>
        <p class="l-para">بيان ${H.esc(kind)} فرع / ${H.val(d.branch, '..............................')} عن شهر ${H.val(d.month)} ${H.val(d.year)}</p>
        <table class="lt sheet-t"><tr><th>م</th><th>الاسم</th><th>الوظيفة</th><th>مبلغ ${word}</th><th>تفاصيل</th><th>ملاحظات</th></tr>
          ${rows.map((r, i) => `<tr><td class="num">${i + 1}</td><td>${H.esc(r.name)}</td><td>${H.esc(r.job)}</td><td class="num">${H.esc(H.fmtNum(r.amount))}</td><td>${H.esc(r.details)}</td><td class="l-note-red">${H.esc(r.notes)}</td></tr>`).join('') || '<tr><td colspan="6" class="dots">لا توجد بيانات</td></tr>'}
          <tr class="total-row"><td colspan="3"><b>إجمالي مبلغ ${word}</b></td><td class="num"><b>${H.esc(H.fmtNum(total))}</b></td><td colspan="2">${total ? H.esc(H.tafqeet(total)) : ''}</td></tr></table>`;
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
        H.F.date,
        { key: 'amount', label: 'المبلغ', type: 'number', required: true },
        H.F.branch,
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
        `<p class="l-para">فضلاً الموافقة على صرف مبلغ ( ${H.val(H.fmtNum(d.amount))} ) ريال سعودي ( ${H.val(H.tafqeet(d.amount), '........................')} ) من فرع ( ${H.val(d.branch)} ) قيمة ${H.val(d.sheetType)} ${d.bulk ? `موظفي الفرع وعددهم ( ${H.val(d.count ? String(d.count) : '')} ) موظفاً` : `الموظف / ( ${H.val(d.name)} )`} عن شهر ( ${H.val(d.month)} ${H.val(d.year)} )، وفقاً للبيان المرفق المعتمد من مدير الفرع.</p>`,
    },
    {
      /* من نموذج الورد "خطاب إعتماد مصروف تشغيلي": مبلغ غير شامل الضريبة من فرع، قيمة ... */
      id: 'opex',
      group: 'المصروفات',
      title: 'خطاب إعتماد مصروف تشغيلي',
      fields: [
        H.F.date,
        { key: 'amount', label: 'المبلغ غير شامل الضريبة (ريال - يقبل الهللات)', type: 'number', required: true },
        H.F.branch,
        { key: 'purpose', label: 'نظيراً لـ', type: 'textarea', required: true, hint: 'مثال: صيانة مولد الموقع' },
      ],
      amountKey: 'amount',
      summary: (d) => `مصروف تشغيلي: ${String(d.purpose || '').slice(0, 60)}`,
      body: (d) =>
        `<p class="l-para">فضلاً الموافقة على صرف مبلغ ( ${H.val(H.fmtNum(d.amount))} ) ريال سعودي ( ${H.val(H.tafqeet(d.amount), '........................')} ) غير شامل الضريبة من فرع ( ${H.val(d.branch)} ) نظيراً لـ ( ${H.val(d.purpose, '..........................................')} ).</p>`,
    },
    {
      id: 'license',
      group: 'المستحقات',
      title: 'خطاب تعميد مصروفات رخصة قيادة',
      /* بعد الاعتماد يتكوّن «إقرار مصروفات رخصة قيادة» ويبقى الطلب مفتوحاً حتى يُرفع موقّعاً */
      companion: 'licenseAck',
      fields: [
        H.F.date,
        { key: 'licenseType', label: 'نوع الرخصة', type: 'select', options: ['خاصة', 'نقل ثقيل', 'نقل خفيف', 'عمومي'], required: true },
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
      ],
      needsValue: true,
      /* مراحل المسار التي يحتوي اسمها على "الحركة" تظهر في صندوق مستقل */
      sideBox: { head: 'قرار إدارة الحركة', match: 'الحركة' },
      body: (d) =>
        `<p class="l-para">برجاء تحديد قيمة ( مصروفات رخصة قيادة ) ( ${H.val(d.licenseType)} ) للموظف / ${H.val(d.name, '..............................')} إقامة رقم ${H.val(d.iqama, '....................')} والذي يعمل ${H.val(d.job, '...........')} بفرع ${H.val(d.branch, '....................')}</p>`,
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
      embed: H.SETTLE_EMBED,
      fields: [
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.branch,
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
      embed: H.SETTLE_EMBED,
      fields: [
        H.F.date,
        { key: 'kind', label: 'نوع التصفية', type: 'select', options: ['تصفية إجازة', 'تصفية نهائية'], required: true },
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
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
        ...H.TASKS.deductions.fields,
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
      body: (d) => (d.state ? '<div class="settle-snap"><div class="dots">جاري تحميل بيانات التصفية...</div></div>' : H.caseSummary(d)),
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'leaveType', label: 'نوع الإجازة', required: true, choicesFrom: 'leaveTypes' },
        { key: 'from', label: 'من تاريخ', type: 'date', required: true },
        { key: 'to', label: 'إلى تاريخ', type: 'date', required: true },
        { key: 'reason', label: 'السبب / ملاحظات', type: 'textarea' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'المدير المباشر أو مدير الفرع' },
        { key: 'days', label: 'عدد الأيام', hidden: true },
        { key: 'balance', label: 'الرصيد قبل الإجازة', hidden: true },
      ],
      summary: (d) => `${d.leaveType || 'إجازة'}: ${d.name || ''} — ${d.days || ''} يوم من ${H.fmtDate(d.from)}`,
      body: (
        d,
      ) => `<p>نرجو التكرم بالموافقة على منح الموظف الآتي بياناته إجازة <b>${H.esc(d.leaveType || '')}</b> لمدة ( ${H.val(d.days, '....')} ) يوماً.</p>
        ${H.infoTable([...H.basicPairs(d), ['الفرع', d.branch], ['نوع الإجازة', d.leaveType], ['من تاريخ', H.fmtDate(d.from)], ['إلى تاريخ', H.fmtDate(d.to)], ['عدد الأيام', d.days], ['تاريخ العودة المتوقع', d.to ? H.fmtDate(H.addDays(d.to, 1)) : '']])}
        ${
          d.balance !== undefined && d.balance !== ''
            ? H.infoTable([
                ['رصيد الإجازة قبل الطلب', `${d.balance} يوم`],
                ['الرصيد بعد الإجازة', `${Math.round((Number(d.balance) - Number(d.days || 0)) * 100) / 100} يوم`],
              ])
            : ''
        }
        ${d.reason ? H.decisionBox('السبب / ملاحظات', H.esc(d.reason), true) : ''}`,
    },
    {
      /* نموذج آخر يوم دوام: يعتمده المدير المباشر للموظف أو مدير فرعه (يختار مقدمه)، ثم شئون الموظفين — ويُربط بملف التصفية برقمه */
      id: 'lastWorkDay',
      group: 'شئون الموظفين',
      title: 'نموذج آخر يوم دوام',
      letterTitle: 'نموذج آخر يوم دوام',
      noDest: true,
      noDecisionBox: true,
      lastDayFlow: true,
      empLookup: true,
      fields: [
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
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
          key: 'approverKind',
          label: 'يُوجَّه لاعتماد',
          type: 'select',
          options: ['المدير المباشر', 'مدير الفرع'],
          required: true,
          hint: 'المدير المباشر للموظف (من ملفه) أو مدير فرعه، ثم شئون الموظفين',
        },
      ],
      summary: (d) => `${d.name || ''} — آخر يوم دوام ${H.fmtDate(d.lastDay)}`,
      body: (
        d,
      ) => `<p>نفيدكم بأن آخر يوم دوام للموظف الآتي بياناته هو يوم ( ${H.val(H.fmtDate(d.lastDay), '..../..../........')} )${d.reason ? `، وذلك بسبب: <b>${H.esc(d.reason)}</b>` : ''}.</p>
        ${H.infoTable([
          ['الإسم', d.name],
          ['الرقم الوظيفي', d.empNo],
          ['رقم الإقامة / الهوية', d.iqama],
          ['الجنسية', d.nationality],
          ['الوظيفة', d.job],
          ['الإدارة / القسم', d.department],
          ['الفرع', d.branch],
          ['تاريخ التعيين', H.fmtDate(d.joinDate)],
          ['تاريخ آخر يوم دوام', H.fmtDate(d.lastDay)],
          ['السبب', d.reason],
        ])}
        ${d.notes ? H.decisionBox('ملاحظات', H.esc(d.notes), true) : ''}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
        { key: 'nationality', label: 'الجنسية' },
        { key: 'joinDate', label: 'تاريخ التعيين', type: 'date', hint: 'فارغ = من سجل الموظفين' },
        { key: 'leaveDate', label: 'تاريخ ترك العمل', type: 'date', hint: 'فارغ = لا يزال على رأس العمل' },
        { key: 'lang', label: 'لغة الشهادة', type: 'select', options: ['العربية', 'الإنجليزية', 'العربية والإنجليزية'], required: true },
        { key: 'addressedTo', label: 'الجهة الموجهة إليها', hint: 'فارغ = إلى من يهمه الأمر' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
        { key: 'approverId', label: 'يُوجَّه لاعتماد', picker: 'user', required: true, hint: 'شئون الموظفين أو المدير المختص' },
      ],
      summary: (d) => `شهادة خبرة: ${d.name || ''}`,
      body: (d) => `<p><b>${H.esc(d.addressedTo || 'إلى من يهمه الأمر')}</b></p>
        <p>تشهد الشركة بأن السيد / ${H.val(d.name)}${d.nationality ? `، ${H.esc(d.nationality)} الجنسية` : ''}، رقم الإقامة / الهوية ( ${H.val(d.iqama)} )، ${d.leaveDate ? 'قد عمل' : 'يعمل'} لدينا بوظيفة <b>${H.esc(d.job || '....')}</b>
        اعتباراً من ${H.val(H.fmtDate(d.joinDate))}${d.leaveDate ? ` وحتى ${H.val(H.fmtDate(d.leaveDate))}` : ' وحتى تاريخه'}، وكان طوال مدة عمله حسن السيرة والسلوك.</p>
        <p>وقد أُعطي هذه الشهادة بناءً على طلبه دون أدنى مسؤولية على الشركة.</p>${d.lang && d.lang !== 'العربية' ? `<p class="muted">مطلوب نسخة ${H.esc(d.lang === 'الإنجليزية' ? 'باللغة الإنجليزية' : 'باللغتين')}.</p>` : ''}
        ${d.notes ? H.decisionBox('ملاحظات', H.esc(d.notes), true) : ''}`,
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
        H.F.date,
        H.F.name,
        H.F.iqama,
        H.F.job,
        H.F.branch,
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
      body: (d) => `<p>السادة / <b>${H.esc(d.addressedTo || 'إلى من يهمه الأمر')}</b> المحترمين</p>
        <p>تفيد الشركة بأن السيد / ${H.val(d.name)}${d.nationality ? `، ${H.esc(d.nationality)} الجنسية` : ''}، رقم الإقامة / الهوية ( ${H.val(d.iqama)} )، يعمل لدينا بوظيفة <b>${H.esc(d.job || '....')}</b> اعتباراً من ${H.val(H.fmtDate(d.joinDate))} وحتى تاريخه،
        ويتقاضى راتباً شهرياً إجمالياً قدره ( ${H.val(H.fmtNum(d.total))} ) ريال${d.total ? ` (${H.esc(H.tafqeet(Number(String(d.total).replace(/,/g, '')) || 0))})` : ''}.</p>
        ${
          d.detail === 'تفصيلي (الأساسي والبدلات)'
            ? H.infoTable([
                ['الراتب الأساسي', H.fmtNum(d.basic)],
                ['بدل السكن', H.fmtNum(d.housing)],
                ['البدلات الأخرى', H.fmtNum(d.otherAllow)],
                ['الإجمالي', H.fmtNum(d.total)],
              ])
            : ''
        }
        <p>وقد أُعطي هذا الخطاب بناءً على طلبه لتقديمه إلى الجهة المذكورة دون أدنى مسؤولية على الشركة.</p>`,
    },
  ];
});
