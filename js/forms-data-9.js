/* بيانات forms.js (forms-data-9): FORMS
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-data-9'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  return [
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
        H.F.date,
        { ...H.F.branch, label: 'الجهة المطالِبة' },
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
        `${d.project || ''} — فرع ${d.toBranch || ''} — ${H.fmtNum((Number(d.meters) || 0) * (Number(d.meterPrice) || 0))} ريال`,
      amount: (d) => Math.round((Number(d.meters) || 0) * (Number(d.meterPrice) || 0) * 100) / 100 || '',
      body: (d) => {
        const total = Math.round((Number(d.meters) || 0) * (Number(d.meterPrice) || 0) * 100) / 100;
        return `<p class="l-para">نتقدم بالمطالبة المالية عن الأعمال التي نفذها قسم الحفر في مشروع <b>${H.esc(d.project || '..........')}</b> التابع لفرع <b>${H.esc(d.toBranch || '..........')}</b> :</p>
        <table class="lt grid sm"><thead><tr><th>البيان</th><th style="width:110px">عدد الأمتار</th><th style="width:110px">سعر المتر</th><th style="width:130px">الإجمالي</th></tr></thead>
        <tbody><tr><td style="text-align:right">${d.desc ? H.esc(d.desc).replace(/\n/g, '<br>') : `أعمال الحفر — ${H.esc(d.project || '')}`}</td><td>${H.esc(d.meters)}</td><td>${H.esc(H.fmtNum(d.meterPrice))}</td><td><b>${H.esc(H.fmtNum(total))}</b></td></tr></tbody></table>
        ${total ? `<p class="l-para">${H.esc(H.tafqeet(total))}</p>` : ''}
        ${H.infoTable([
          ['رقم عرض السعر / أمر الشراء', d.poNo],
          ['فترة التنفيذ', d.period],
        ])}
        ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${H.esc(d.notes)}</div>` : ''}<p class="l-para">مرفق عرض السعر أو أمر الشراء (PO) المعتمد.</p>`;
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
        H.F.date,
        { ...H.F.branch, label: 'الجهة الطالبة' },
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
        return `<p class="l-para">نرجو الموافقة على إعارة <b>${H.esc(d.count || '...')}</b> حفارة من <b>${H.esc(d.lender || '..........')}</b> إلى <b>${H.esc(d.branch || '..........')}</b> لمشروع <b>${H.esc(d.project || '..........')}</b> :</p>
        ${H.infoTable([
          ['الجهة الطالبة', d.branch],
          ['الجهة المعيرة', d.lender],
          ['عدد الحفارات', d.count],
          ['المشروع', d.project],
          ['بداية الاستعارة', H.fmtDate(d.fromDate)],
          ['نهاية الاستعارة', H.fmtDate(d.toDate)],
          ['مدة الاستعارة', d.fromDate && d.toDate ? `${(H.daysBetween(d.fromDate, d.toDate) || 0) + 1} يوم` : ''],
          ['سعر المتر', d.meterPrice ? `${H.fmtNum(d.meterPrice)} ريال` : ''],
        ])}
        <div class="l-notes"><b>بند ثابت :</b> تكلفة الاستعارة <b>60% من سعر المتر</b> = <b>${H.esc(H.fmtNum(cost))}</b> ريال للمتر.</div>
        ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${H.esc(d.notes)}</div>` : ''}<p class="l-para">مرفق عرض السعر أو أمر الشراء (PO) المعتمد.</p>`;
      },
    },
    {
      /* طلب موظف / موارد بشرية (مثل حفار أو عامل من فرع على كفالة الشركة): محاسب الحفر ← مدير قسم الحفر ← مدير إدارة الفروع ← قرار نقل تلقائي لشئون الموظفين */
      id: 'staffRequest',
      group: 'قسم الحفر',
      title: 'طلب موظف / موارد بشرية',
      letterTitle: 'طلب موظف / موارد بشرية',
      noDest: true,
      noDecisionBox: true,
      drillFlow: 'staff',
      drillOnly: true,
      fields: [
        H.F.date,
        { ...H.F.branch, label: 'الجهة الطالبة' },
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
        ${H.infoTable([
          ['الوظيفة المطلوبة', d.job],
          ['العدد', d.count],
          ['الفرع المطلوب منه', d.fromBranch],
          ['المشروع', d.project],
          ['الكفالة', d.sponsor],
          ['المدة', d.duration],
        ])}
        <table class="lt"><tr><td class="lbl">سبب الطلب</td><td>${H.esc(d.reason).replace(/\n/g, '<br>')}</td></tr></table>
        ${(d.transferReq || {}).serial ? `<p class="l-para">أُنشئ قرار النقل رقم <b>${H.esc(d.transferReq.serial)}</b> لدى شئون الموظفين لإكمال إجراءات النقل.</p>` : '<p class="l-para">بعد اعتماد مدير إدارة الفروع يُنشأ قرار نقل لدى شئون الموظفين تلقائياً.</p>'}`,
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
        H.F.date,
        { ...H.F.branch, label: 'الفرع المورِّد' },
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
        return `<p class="l-para">نفيدكم بتوريد الخردة الآتية من فرع <b>${H.esc(d.branch || '..........')}</b> إلى ساحة خردة <b>${H.esc(d.workshop || '..........')}</b> لتتصرف فيها الورشة :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>نوع الخردة</th><th style="width:90px">الكمية</th><th style="width:80px">الوحدة</th><th>الحالة / ملاحظات</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${H.esc(x.material)}</td><td>${H.esc(x.qty)}</td><td>${H.esc(x.unit)}</td><td>${H.esc(x.note)}</td></tr>`).join('') || '<tr><td colspan="5">—</td></tr>'}</tbody></table>
          ${H.infoTable([
            ['الفرع المورِّد', d.branch],
            ['الورشة', d.workshop],
            ['تاريخ التسليم للورشة', H.fmtDate(d.deliveryDate)],
            ['حركات التوريد لرصيد الخردة', (d.posted || []).length ? 'تمت الإضافة لرصيد الخردة' : ''],
          ])}
          ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${H.esc(d.notes)}</div>` : ''}
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
        H.F.date,
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
          .join('، ')} — ${d.party || ''} — ${H.fmtNum(H.sumRows(d.items, 'qty', 'price'))} ريال`,
      amount: (d) => H.sumRows(d.items, 'qty', 'price') || '',
      body: (d) => {
        const rows = (d.items || []).filter((x) => x.material),
          total = H.sumRows(d.items, 'qty', 'price');
        return `<p class="l-para">نرجو التكرم بالموافقة على صرف وبيع الخردة الآتية من ساحة خردة <b>${H.esc(d.workshop || '..........')}</b> إلى السادة / <b>${H.esc(d.party || '..........')}</b>${d.contact ? ` — ${H.esc(d.contact)}` : ''} :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>نوع الخردة</th><th style="width:80px">الكمية</th><th style="width:80px">الوحدة</th><th style="width:110px">السعر للوحدة</th><th style="width:120px">الإجمالي</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${H.esc(x.material)}</td><td>${H.esc(x.qty)}</td><td>${H.esc(x.unit)}</td><td>${H.esc(H.fmtNum(x.price))}</td><td>${H.esc(H.fmtNum((Number(x.qty) || 0) * (Number(x.price) || 0)))}</td></tr>`).join('') || '<tr><td colspan="6">—</td></tr>'}
          <tr><td colspan="5"><b>الإجمالي</b></td><td><b>${H.esc(H.fmtNum(total))}</b></td></tr></tbody></table>
          ${total ? `<p class="l-para">${H.esc(H.tafqeet(total))}</p>` : ''}
          ${H.infoTable([
            ['الورشة', d.workshop],
            ['المشتري', d.party],
            ['حركات البيع من رصيد الخردة', (d.posted || []).map((x) => x.docNo).join('، ')],
            ['', ''],
          ])}
          ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${H.esc(d.notes)}</div>` : ''}
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
        H.F.date,
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
      amount: (d) => H.sumRows(d.items, 'qty', 'price') || '',
      body: (d) => {
        const rows = (d.items || []).filter((x) => x.product),
          total = H.sumRows(d.items, 'qty', 'price');
        return `<p class="l-para">نرجو التكرم بالموافقة على صرف الأصناف الآتية من مخزن <b>${H.esc(d.workshop || '..........')}</b> إلى <b>${H.esc(d.party || '..........')}</b> :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>المنتج</th><th style="width:90px">الكمية</th><th style="width:110px">سعر الوحدة</th><th style="width:120px">الإجمالي</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${H.esc(x.product)}</td><td>${H.esc(x.qty)}</td><td>${H.esc(H.fmtNum(x.price))}</td><td>${H.esc(H.fmtNum((Number(x.qty) || 0) * (Number(x.price) || 0)))}</td></tr>`).join('') || '<tr><td colspan="5">—</td></tr>'}
          <tr><td colspan="4"><b>الإجمالي (بدون ضريبة)</b></td><td><b>${H.esc(H.fmtNum(total))}</b></td></tr></tbody></table>
          ${H.infoTable([
            ['المخزن', d.workshop],
            ['الجهة المستلمة', d.party],
            ['طلب التصنيع المرتبط', d.mfgRef],
            ['حركات الصرف من المخزن', (d.posted || []).map((x) => x.docNo).join('، ')],
          ])}
          ${d.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${H.esc(d.notes)}</div>` : ''}
          ${(d.qtyLog || []).length ? `<div class="l-notes"><b>تعديل الكميات :</b><br>${d.qtyLog.map((x) => `${H.esc(x.step)} — ${H.esc(x.by)}: ${H.esc(x.changes)}${x.note ? ` (${H.esc(x.note)})` : ''}`).join('<br>')}</div>` : ''}
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
        H.F.date,
        { ...H.F.branch, label: 'الجهة المصدرة (الفرع / الورشة)' },
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
        `${d.customer || ''} — ${H.fmtNum(H.quoteTotals(d).total + (Number(d.laborCost) || 0))} ريال${d.mfgRef ? ` (للطلب ${d.mfgRef})` : ''}`,
      amount: (d) => H.quoteTotals(d).total + (Number(d.laborCost) || 0) || '',
      body: (d) => {
        const rows = (d.items || []).filter((x) => x.item),
          q = H.quoteTotals(d);
        return `<p class="l-para">السادة / <b>${H.esc(d.customer || '..........')}</b> المحترمين${d.contact ? ` — ${H.esc(d.contact)}` : ''}</p>
          <p class="l-para">يسرنا أن نقدم لكم عرض السعر الآتي :</p>
          <table class="lt grid sm"><thead><tr><th style="width:40px">م</th><th>البند / المنتج</th><th style="width:80px">الكمية</th><th style="width:80px">الوحدة</th><th style="width:110px">سعر الوحدة</th><th style="width:120px">الإجمالي</th></tr></thead><tbody>
          ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${H.esc(x.item)}</td><td>${H.esc(x.qty)}</td><td>${H.esc(x.unit)}</td><td>${H.esc(H.fmtNum(x.price))}</td><td>${H.esc(H.fmtNum((Number(x.qty) || 0) * (Number(x.price) || 0)))}</td></tr>`).join('') || '<tr><td colspan="6">—</td></tr>'}
          <tr><td colspan="5">الإجمالي قبل الضريبة</td><td>${H.esc(H.fmtNum(q.net))}</td></tr>
          <tr><td colspan="5">ضريبة القيمة المضافة ${d.vat === 'بدون ضريبة' ? '(بدون)' : '15%'}${d.vat === 'الأسعار شاملة الضريبة' ? ' (مشمولة)' : ''}</td><td>${H.esc(H.fmtNum(q.vat))}</td></tr>
          <tr><td colspan="5"><b>الإجمالي شامل الضريبة</b></td><td><b>${H.esc(H.fmtNum(q.total))}</b></td></tr>
          ${Number(d.laborCost) > 0 ? `<tr><td colspan="5">المصنوعية (بدون ضريبة)</td><td>${H.esc(H.fmtNum(d.laborCost))}</td></tr><tr><td colspan="5"><b>الإجمالي النهائي (شامل الضريبة + المصنوعية)</b></td><td><b>${H.esc(H.fmtNum(q.total + Number(d.laborCost)))}</b></td></tr>` : ''}</tbody></table>
          ${q.total ? `<p class="l-para">${H.esc(H.tafqeet(q.total + (Number(d.laborCost) || 0)))}</p>` : ''}
          ${d.mfgRef ? `<p class="l-para">مرتبط بطلب التصنيع / الشراء رقم <b>${H.esc(d.mfgRef)}</b>.</p>` : ''}
          ${H.infoTable([
            ['صلاحية العرض', d.validity ? `${d.validity} يوماً من تاريخه` : ''],
            ['الجهة المصدرة', d.branch],
          ])}
          ${d.terms ? `<div class="l-notes"><b>شروط الدفع والتسليم :</b><br>${H.esc(d.terms).replace(/\n/g, '<br>')}</div>` : ''}
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
        { ...H.F.date, label: 'تاريخ إنشاء المباشرة' },
        {
          key: 'kind',
          label: 'صفة المباشرة',
          type: 'select',
          options: ['عودة من إجازة', 'مباشرة جديدة (موظف جديد)', 'نقل من فرع آخر', 'أخرى'],
          required: true,
        },
        { ...H.F.branch, label: 'مكان المباشرة / الفرع' },
        { ...H.F.name, label: 'الإسم رباعي' },
        { ...H.F.iqama, label: 'رقم الهوية / الإقامة' },
        { key: 'empNo', label: 'الرقم الوظيفي' },
        { key: 'gender', label: 'الجنس', type: 'select', options: ['ذكر', 'أنثى'] },
        { key: 'nationality', label: 'الجنسية' },
        { ...H.F.job, label: 'المسمى الوظيفي' },
        { key: 'department', label: 'الإدارة / القسم' },
        {
          key: 'startDate',
          label: 'تاريخ المباشرة',
          type: 'date',
          required: true,
          hint: 'اليوم الذي باشر فيه الموظف العمل فعلياً — لا يكون قبل نهاية إجازته المسجلة',
        },
      ],
      summary: (d) => `${d.name || ''} — ${d.kind || ''}${d.startDate ? ` (${H.fmtDate(d.startDate)})` : ''}`,
      body: (d) => `${H.infoTable([
        ['مكان المباشرة / الفرع', d.branch],
        ['صفة المباشرة', d.kind],
        ['يوم المباشرة', H.dayName(d.startDate)],
        [
          'تاريخ المباشرة',
          d.startDate ? `${H.fmtDate(d.startDate)}${H.hijri(d.startDate) ? ` — الموافق ${H.hijri(d.startDate)}هـ` : ''}` : '',
        ],
      ])}
        <h4 class="l-sec">بيانات العامل / الموظف :</h4>
        ${H.infoTable([
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
        <p class="l-para" style="text-align:center">في يوم : <b class="red">${H.esc(H.dayName(d.startDate) || '..........')}</b> &nbsp;&nbsp; بتاريخ : <b class="red">${H.esc(H.fmtDate(d.startDate) || '....../....../..........')}</b>${H.hijri(d.startDate) ? ` &nbsp; الموافق : <b class="red">${H.esc(H.hijri(d.startDate))}هـ</b>` : ''}</p>
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
        H.F.date,
        { key: 'subject', label: 'عنوان الخطاب', required: true },
        H.F.branch,
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
      body: (d) => `<div class="l-para pre">${H.esc(d.content) || '<span class="dots">نص الخطاب...</span>'}</div>`,
    },
    {
      id: 'general',
      group: 'عام',
      title: 'خطاب عام',
      fields: [
        H.F.date,
        { key: 'subject', label: 'عنوان الخطاب', required: true },
        H.F.branch,
        { key: 'content', label: 'نص الخطاب', type: 'textarea', required: true, rows: 8 },
      ],
      letterTitle: (d) => d.subject || 'عنوان الخطاب',
      summary: (d) => d.subject,
      body: (d) => `<div class="l-para pre">${H.esc(d.content) || '<span class="dots">نص الخطاب...</span>'}</div>`,
    },
  ];
});
