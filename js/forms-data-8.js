/* بيانات forms.js (forms-data-8): FORMS
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-data-8'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  return [
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
        { ...H.F.date, label: 'تاريخ الطلب' },
        { ...H.F.name, label: 'اسم المرشح' },
        { key: 'citizenship', label: 'سعودي / مقيم', type: 'select', options: ['سعودي', 'مقيم'], required: true },
        /* تظهر وتُطلب عند اختيار "مقيم" فقط */
        { key: 'nationality', label: 'الجنسية', required: true, showIf: ['citizenship', 'مقيم'] },
        { ...H.F.iqama, label: 'رقم الهوية / الإقامة / الجواز' },
        /* للمقيم: تاريخ انتهاء الإقامة، والمتبقي فيها يُحسب تلقائياً من تاريخ الطلب */
        { key: 'iqamaExpiry', label: 'تاريخ انتهاء الإقامة', type: 'date', required: true, showIf: ['citizenship', 'مقيم'] },
        { ...H.F.prof, label: 'المهنة في الإقامة', required: true, showIf: ['citizenship', 'مقيم'] },
        { key: 'birthDate', label: 'تاريخ الميلاد', type: 'date' },
        { key: 'marital', label: 'الحالة الاجتماعية', type: 'select', options: ['أعزب', 'متزوج', 'أخرى'] },
        { key: 'phone', label: 'رقم الجوال', required: true },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'city', label: 'العنوان' },
        { ...H.F.job, label: 'الوظيفة المرشح لها', required: true },
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
          options: ['لا يوجد', ...H.HIRE_BODIES],
          hint: 'عضوية هيئة تشترطها الوظيفة (مهندسين، محاسبين، قانونيين...)',
        },
        { key: 'membershipOther', label: 'اسم الهيئة', required: true, showIf: ['membership', 'أخرى'] },
        { key: 'membershipNo', label: 'رقم العضوية', required: true, showIf: ['membership', H.HIRE_BODIES] },
        { key: 'membershipExpiry', label: 'تاريخ انتهاء العضوية', type: 'date', showIf: ['membership', H.HIRE_BODIES] },
        { key: 'experience', label: 'سنوات الخبرة', type: 'number' },
        { key: 'lastEmployer', label: 'آخر جهة عمل' },
        { key: 'inKingdom', label: 'موجود داخل المملكة؟', type: 'select', options: ['نعم', 'لا'] },
        /* بيانات التعاقد يكتبها مرسل الطلب (مسئول التوظيف) */
        ...H.TASKS.hireHr.fields.filter((f) => f.key !== 'hrNote'),
        { key: 'recruiterNote', label: 'ملاحظات مسئول التوظيف', type: 'textarea' },
      ],
      noNote: true,
      summary: (d) => `${d.name || ''}${d.job ? ` — ${d.job}` : ''}`,
      body: H.hireBody,
    },
    {
      /* قرار نقل موظف بين الفروع: يوقّعه مدير الفرع المنقول منه ← مدير الفرع المنقول إليه ← المعتمد المختص (المدير المالي للمحاسبين، أو مدير المكتب الفني، أو مدير إدارة الفروع) ← شئون الموظفين (transferSteps بالخادم) */
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
        H.F.date,
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
        { ...H.F.branch, label: 'من فرع (المنقول منه)', choicesFrom: 'branches', fromUser: undefined },
        { key: 'toBranch', label: 'إلى فرع (المنقول إليه)', required: true, choicesFrom: 'branches' },
        { key: 'staffRef', label: 'رقم طلب الموظف المرتبط', hint: 'يُملأ تلقائياً إذا أُنشئ القرار من "طلب موظف / موارد بشرية"' },
        {
          key: 'approver',
          label: 'يعتمد قرار النقل',
          required: true,
          choicesFrom: 'transApprovers',
          hint: 'المدير المالي إذا كان الموظف محاسباً، أو مدير المكتب الفني، أو مدير إدارة الفروع',
        },
        { key: 'effectiveDate', label: 'تاريخ المباشرة في الفرع الجديد', type: 'date' },
        {
          key: 'payBranch',
          label: 'الفرع الذي يتحمل راتب شهر النقل',
          type: 'select',
          options: H.TR_PAY,
          hint: 'تلقائياً من تاريخ المباشرة: يوم 15 أو قبله ← الفرع المنقول إليه، بعد 15 ← الفرع المنقول منه (يظهر في بيان رواتبه هذا الشهر فقط)',
        },
        { key: 'reason', label: 'سبب النقل', type: 'textarea' },
      ],
      summary: (d) => {
        const e = H.transferEmps(d);
        return `${(e[0] || {}).name || ''}${e.length > 1 ? ` و${e.length - 1} آخرين` : ''} — من ${d.branch || '...'} إلى ${d.toBranch || '...'}`;
      },
      body: (d) => {
        const e = H.transferEmps(d),
          many = e.length > 1;
        const pb = H.trPayBranch(d);
        const where = `من <b class="red">فرع ${H.esc(d.branch || '..........')}</b> إلى <b class="red">فرع ${H.esc(d.toBranch || '..........')}</b>${d.effectiveDate ? ` اعتباراً من ${H.esc(H.fmtDate(d.effectiveDate))}م` : ''}${d.effectiveDate && pb ? `، ويتحمل <b>فرع ${H.esc(pb)}</b> راتب شهر النقل` : ''}`;
        return many
          ? `<p class="l-para" style="font-size:17px;margin:10mm 0 4mm">▪ يتم نقل الموظفين الآتي بياناتهم ${where} .</p>
            <table class="lt grid"><thead><tr><th style="width:8%">م</th><th>اسم الموظف</th><th>رقم الإقامة / الهوية</th><th>الوظيفة</th></tr></thead><tbody>${e.map((x, i) => `<tr><td>${i + 1}</td><td>${H.esc(x.name)}</td><td>${H.esc(x.iqama)}</td><td>${H.esc(x.job)}</td></tr>`).join('')}</tbody></table>`
          : `<p class="l-para" style="font-size:17px;margin:10mm 0 4mm">▪ يتم نقل الموظف / ${H.val((e[0] || {}).name, '....................')} ${where} .</p>
            ${H.infoTable([
              ['رقم الإقامة / الهوية', (e[0] || {}).iqama],
              ['الوظيفة', (e[0] || {}).job],
            ])}`;
      },
      bodyNote: (d) => `${d.reason ? `<div class="l-notes"><b>سبب النقل :</b><br>${H.esc(d.reason).replace(/\n/g, '<br>')}</div>` : ''}`,
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
        H.F.date,
        H.F.branch,
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
        return `<p class="l-para">نرجو الموافقة على إعارة الجهاز الآتي بياناته لفرع <b>${H.esc(d.branch || '..........')}</b> :</p>
          ${H.infoTable([
            ['اسم الجهاز', v.name],
            ['الماركة', v.brand],
            ['الموديل', v.model],
            ['السيريال', v.serial],
            ['التكويد', v.code],
            ['الفرع المستعير', d.branch],
          ])}
          ${H.infoTable([
            ['بداية الاستعارة', H.fmtDate(d.fromDate)],
            ['نهاية الاستعارة', H.fmtDate(d.toDate)],
            ['مدة الاستعارة', d.fromDate && d.toDate ? `${(H.daysBetween(d.fromDate, d.toDate) || 0) + 1} يوم` : ''],
            ['مكان الاستخدام', d.location],
          ])}
          <table class="lt"><tr><td class="lbl">الغرض من الاستعارة</td><td style="white-space:pre-wrap">${H.esc(d.purpose)}</td></tr></table>
          ${
            t.deliveryDate
              ? `<h4 class="l-sec">تسليم الجهاز :</h4>${H.infoTable([
                  ['تاريخ التسليم', H.fmtDate(t.deliveryDate)],
                  ['تاريخ الإرجاع المعتمد', H.fmtDate(t.returnDue)],
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
        H.F.date,
        { ...H.F.branch, required: false, hint: 'يُحدَّد تلقائياً من مكان الجهاز في الجرد' },
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
        const pre = (s) => H.esc(s).replace(/\n/g, '<br>');
        return `<p class="l-para">نرجو التكرم بصيانة الجهاز الآتي بياناته من جرد فرع <b>${H.esc(d.branch || '..........')}</b> :</p>
          ${H.infoTable([
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
          <table class="lt grid sm"><tr><th style="width:110px">رقم الطلب</th><th style="width:80px">التاريخ</th><th>العطل</th><th style="width:110px">النتيجة</th></tr>${(h.items || []).map((x) => `<tr><td>${H.esc(x.serial)}</td><td>${H.fmtDate(x.date)}</td><td>${pre(x.fault)}${x.diagnosis ? `<br><small>التشخيص : ${H.esc(x.diagnosis)}</small>` : ''}</td><td>${H.esc(x.result || { pending: 'جارٍ', rejected: 'مرفوض', returned: 'معاد' }[x.status] || '')}</td></tr>`).join('')}</table>`
              : ''
          }
          ${fw.fwdNote ? `<div class="l-notes"><b>ملاحظات مسئول الجرد :</b><br>${pre(fw.fwdNote)}</div>` : ''}
          ${th.length ? `<h4 class="l-sec">المراسلات بين مسئول الصيانة والفرع :</h4><table class="lt grid sm"><tr><th style="width:90px">التاريخ</th><th style="width:150px">من</th><th>الرد</th></tr>${th.map((m) => `<tr><td>${H.fmtDate(String(m.at).slice(0, 10))}</td><td>${H.esc(m.name)}<br><small>${m.side === 'maint' ? 'مسئول الصيانة' : 'الفرع'}</small></td><td>${pre(m.text)}</td></tr>`).join('')}</table>` : ''}
          ${
            c.result
              ? `<h4 class="l-sec">نتيجة الصيانة :</h4>${H.infoTable([
                  ['النتيجة', c.result],
                  ['تاريخ الإقفال', H.fmtDate(c.closeDate)],
                  ['التكلفة', c.cost ? `${H.fmtNum(c.cost)} ريال` : ''],
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
        H.F.date,
        H.F.branch,
        { ...H.F.name, label: 'اسم الموظف' },
        { ...H.F.iqama, label: 'رقم الإقامة' },
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'nationality', label: 'الجنسية' },
        { ...H.F.job, label: 'المسمى الوظيفي' },
        { key: 'passport', label: 'رقم الجواز' },
        { key: 'iqamaEnd', label: 'تاريخ انتهاء الإقامة الحالية', type: 'date', required: true },
        { key: 'period', label: 'مدة التجديد', type: 'select', options: ['سنة', 'سنتان', '6 أشهر', '3 أشهر', '9 أشهر'], required: true },
      ],
      summary: (d) => `${d.name || ''} — تنتهي ${H.fmtDate(d.iqamaEnd)}`,
      body: (d) => {
        const t = (d.tasks || {}).iqRenewDone || {};
        return `<p class="l-para">نرجو التكرم بتجديد إقامة الموظف الآتي بياناته لمدة <b>${H.esc(d.period || '........')}</b> :</p>
          ${H.infoTable([
            ['اسم الموظف', d.name],
            ['رقم الإقامة', d.iqama],
            ['الرقم الوظيفي', d.empNo],
            ['الجنسية', d.nationality],
            ['المسمى الوظيفي', d.job],
            ['رقم الجواز', d.passport],
            ['الفرع', d.branch],
            [
              'انتهاء الإقامة الحالية',
              d.iqamaEnd ? `${H.fmtDate(d.iqamaEnd)}${H.hijri(d.iqamaEnd) ? ` — الموافق ${H.hijri(d.iqamaEnd)}هـ` : ''}` : '',
            ],
          ])}
          <p class="l-para">مرفق صورة الإقامة القديمة.</p>
          ${
            t.newIqamaEnd
              ? `<h4 class="l-sec">تنفيذ التجديد (شئون الموظفين) :</h4>${H.infoTable([
                  [
                    'تاريخ الانتهاء الجديد',
                    `${H.fmtDate(t.newIqamaEnd)}${H.hijri(t.newIqamaEnd) ? ` — الموافق ${H.hijri(t.newIqamaEnd)}هـ` : ''}`,
                  ],
                  ['تكلفة التجديد', t.renewCost ? `${H.fmtNum(t.renewCost)} ريال` : ''],
                ])}${t.doneNote ? `<div class="l-notes"><b>ملاحظات :</b><br>${H.esc(t.doneNote).replace(/\n/g, '<br>')}</div>` : ''}`
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
        H.F.date,
        H.F.branch,
        { ...H.F.name, label: 'اسم الموظف' },
        { ...H.F.iqama, label: 'رقم الإقامة' },
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'nationality', label: 'الجنسية' },
        { ...H.F.job, label: 'المسمى الوظيفي' },
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
          ${H.infoTable([
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
              ? H.infoTable([
                  ['رقم التأشيرة الحالية', d.visaNo],
                  ['تنتهي في', H.fmtDate(d.visaEnd)],
                  ['مدة التمديد', d.extendDays ? `${d.extendDays} يوم` : ''],
                  ['يتحمل التكلفة', d.payer],
                ]) +
                `<table class="lt"><tr><td class="lbl">قيمة تكلفة التمديد</td><td><b>${d.cost ? `${H.fmtNum(d.cost)} ريال` : ''}</b>${d.cost ? ` (${H.tafqeet(d.cost)})` : ''}${d.payer === 'الموظف' ? ' — تُخصم من الموظف' : d.payer === 'الشركة' ? ' — على حساب الشركة' : ''}</td></tr></table>`
              : H.infoTable([
                  ['نوع التأشيرة', d.visaType],
                  ['المدة', d.days ? `${d.days} يوم` : ''],
                  ['تاريخ السفر المتوقع', H.fmtDate(d.travelDate)],
                  ['جهة السفر', d.destination],
                ])
          }
          ${d.reason ? `<div class="l-notes"><b>السبب :</b><br>${H.esc(d.reason).replace(/\n/g, '<br>')}</div>` : ''}
          ${
            t.visaEnd
              ? `<h4 class="l-sec">إصدار التأشيرة (شئون الموظفين) :</h4>${H.infoTable([
                  ['رقم التأشيرة', t.visaNo],
                  ['تنتهي في', `${H.fmtDate(t.visaEnd)}${H.hijri(t.visaEnd) ? ` — الموافق ${H.hijri(t.visaEnd)}هـ` : ''}`],
                ])}${t.doneNote ? `<div class="l-notes"><b>ملاحظات :</b><br>${H.esc(t.doneNote).replace(/\n/g, '<br>')}</div>` : ''}`
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
        H.F.date,
        H.F.branch,
        { ...H.F.name, label: 'اسم الموظف' },
        { ...H.F.iqama, label: 'رقم الإقامة' },
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'nationality', label: 'الجنسية' },
        { ...H.F.job, label: 'المسمى الوظيفي' },
        { key: 'oldSponsor', label: 'الكفالة الحالية', required: true },
        { key: 'newSponsor', label: 'الكفالة الجديدة (المنقول إليها)', type: 'select', options: H.BP_KAFALA, required: true },
        { key: 'transferDate', label: 'تاريخ النقل المطلوب', type: 'date' },
        { key: 'payer', label: 'من يتحمل رسوم النقل', type: 'select', options: ['الشركة', 'الموظف', 'الجهة الجديدة'] },
        { key: 'cost', label: 'قيمة رسوم النقل (ريال)', type: 'number' },
        { key: 'reason', label: 'سبب النقل', type: 'textarea', required: true },
      ],
      summary: (d) => `${d.name || ''} — من ${d.oldSponsor || ''} إلى ${d.newSponsor || ''}`,
      body: (d) => {
        const t = (d.tasks || {}).sponsorDone || {};
        return `<p class="l-para">نرجو التكرم بنقل كفالة الموظف الآتي بياناته :</p>
          ${H.infoTable([
            ['اسم الموظف', d.name],
            ['رقم الإقامة', d.iqama],
            ['الرقم الوظيفي', d.empNo],
            ['الجنسية', d.nationality],
            ['المسمى الوظيفي', d.job],
            ['الفرع', d.branch],
          ])}
          <table class="lt"><tr><td class="lbl">من الكفالة</td><td><b>${H.esc(d.oldSponsor)}</b></td><td class="lbl">إلى الكفالة</td><td><b>${H.esc(d.newSponsor)}</b></td></tr>
          <tr><td class="lbl">تاريخ النقل المطلوب</td><td>${H.esc(H.fmtDate(d.transferDate))}</td><td class="lbl">رسوم النقل</td><td>${d.cost ? `${H.esc(H.fmtNum(d.cost))} ريال${d.payer ? ` — على ${H.esc(d.payer)}` : ''}` : H.esc(d.payer || '')}</td></tr></table>
          <div class="l-notes"><b>سبب النقل :</b><br>${H.esc(d.reason).replace(/\n/g, '<br>')}</div>
          ${
            t.doneDate
              ? `<h4 class="l-sec">التنفيذ (شئون الموظفين) :</h4>${H.infoTable([
                  ['تاريخ نقل الكفالة', H.fmtDate(t.doneDate)],
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
        H.F.date,
        H.F.branch,
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
        const { a, dn, q, rows, tk } = H.buildA(d);
        return `<p class="l-para">نرجو التكرم ${d.reqKind === 'شراء من الورشة' ? 'بالموافقة على شراء' : 'بتصنيع'} المنتجات الآتية من <b>${H.esc(d.workshop || '..........')}</b> لصالح فرع <b>${H.esc(d.branch || '..........')}</b> :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>المنتج</th><th style="width:90px">الكمية</th><th>المواصفات / المقاس</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${H.esc(x.product)}</td><td>${H.esc(x.qty)}</td><td>${H.esc(x.spec)}</td></tr>`).join('') || '<tr><td colspan="4">—</td></tr>'}</tbody></table>
          ${H.infoTable([
            ['نوع الطلب', d.reqKind || 'تصنيع'],
            ['الفرع الطالب', d.branch],
            ['التاريخ المطلوب للتسليم', H.fmtDate(d.neededDate)],
            ['توفير الخامة', d.reqKind === 'شراء من الورشة' ? '—' : d.materialBy],
          ])}
          <table class="lt"><tr><td class="lbl">المشروع / الغرض</td><td>${H.esc(d.project).replace(/\n/g, '<br>')}</td></tr></table>
          ${H.partValue(d, q)}
          ${H.payPart('السداد (محاسب الفرع) :', tk.mfgPay)}${
            d.reqKind === 'شراء من الورشة' && (d.issueReq || {}).serial
              ? `<h4 class="l-sec">الصرف للفرع :</h4>${H.infoTable([
                  ['إذن الصرف من المخزن', d.issueReq.serial],
                  ['', ''],
                ])}`
              : ''
          }
          ${
            dn.doneDate
              ? `<h4 class="l-sec">إنهاء التصنيع والترحيل للمخزن :</h4>${H.infoTable([
                  ['تاريخ الانتهاء من التصنيع', H.fmtDate(dn.doneDate)],
                  ['أوامر الترحيل للمخزن', (d.posted || []).map((x) => x.docNo).join('، ') || `مخزن ${d.workshop || ''}`],
                  ['إذن الصرف للفرع', (d.issueReq || {}).serial || ''],
                  ['', ''],
                ])}${dn.doneNote ? `<div class="l-notes"><b>ملاحظات التصنيع :</b><br>${H.esc(dn.doneNote)}</div>` : ''}`
              : ''
          }
          ${
            a.expectedDate
              ? `<h4 class="l-sec">قبول الورشة :</h4>${H.infoTable([
                  ['موعد التسليم المتوقع', H.fmtDate(a.expectedDate)],
                  ['التكلفة التقديرية', a.estCost ? `${H.fmtNum(a.estCost)} ريال` : ''],
                ])}${a.mfgNote ? `<div class="l-notes"><b>ملاحظات الورشة :</b><br>${H.esc(a.mfgNote)}</div>` : ''}`
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
        H.F.date,
        H.F.branch,
        { key: 'item', label: 'بيان المصروف', required: true, hint: 'مثال: بنزين لغسيل المعدات' },
        { key: 'amount', label: 'المبلغ (ريال)', type: 'number', required: true },
        { key: 'vendor', label: 'الجهة / المحطة' },
        { key: 'invoiceNo', label: 'رقم الفاتورة' },
        { key: 'project', label: 'المشروع (إن وُجد)' },
        { key: 'purpose', label: 'الغرض', type: 'textarea' },
      ],
      summary: (d) => `${d.item || ''} — ${H.fmtNum(d.amount)} ريال`,
      amount: (d) => d.amount || '',
      body: (d) => `<p class="l-para">نرجو التكرم باعتماد المصروف الآتي لقسم الحفر :</p>
        ${H.infoTable([
          ['بيان المصروف', d.item],
          ['المبلغ', d.amount ? `${H.fmtNum(d.amount)} ريال` : ''],
          ['الجهة / المحطة', d.vendor],
          ['رقم الفاتورة', d.invoiceNo],
          ['المشروع', d.project],
          ['', ''],
        ])}
        ${d.amount ? `<p class="l-para">${H.esc(H.tafqeet(d.amount))}</p>` : ''}${d.purpose ? `<div class="l-notes"><b>الغرض :</b><br>${H.esc(d.purpose)}</div>` : ''}
        <p class="l-para">مرفق صورة الفاتورة.</p>`,
    },
  ];
});
