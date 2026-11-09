/* نماذج إدارة الحركة: كارت السيارة، وبيان تغيير الزيت، وطلب الموافقة على سداد مخالفة مرورية.
 * جزء من قائمة النماذج في forms.js (يُضاف إليها في مكانه بالترتيب). الملف مشترك بين الخادم والواجهة:
 * في الخادم يستورده forms.js بـ require، وفي الواجهة يُحمَّل قبل forms.js فيسجّل نفسه في SADEN_FORM_PARTS.
 * H: أدوات forms.js المشتركة (F حقول جاهزة، infoTable، esc، fmtDate، fmtNum) */
(function (root) {
  'use strict';
  /* صفوف الجدول التي كُتب فيها شيء */
  const filledRows = (d) => (d.rows || []).filter((r) => Object.values(r || {}).some((x) => String(x || '').trim()));

  /* كارت السيارة الشهري (نفس الكارت الورقي): يرفعه السائق المسجل على المركبة في الأسطول ← إدارة الحركة */
  function carCardBody(H, d) {
    const { infoTable, esc, fmtDate, fmtNum } = H;
    const rows = filledRows(d);
    const kms = rows.map((r) => Number(r.km) || 0).filter(Boolean),
      fuel = rows.reduce((a, r) => a + (Number(r.fuel) || 0), 0);
    return `${infoTable([
      ['اسم السائق', d.name],
      ['رقم الإقامة', d.iqama],
      ['الفرع', d.branch],
      ['رقم السيارة', d.plate],
      ['نوع السيارة', d.vType],
      ['الشهر', d.month],
      ['المسافة المقطوعة', kms.length > 1 ? `${fmtNum(Math.max(...kms) - Math.min(...kms))} كم` : '—'],
      ['إجمالي الوقود', fuel ? `${fmtNum(fuel)} لتر` : '—'],
    ])}
        <table class="grid"><thead><tr><th>م</th><th>التاريخ</th><th>قراءة العداد</th><th>جهة الخروج</th><th>العودة</th><th>الوقود</th><th>العداد بعد الوقود</th><th>اسم السائق</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(fmtDate(r.date))}</td><td>${esc(fmtNum(r.km))}</td><td>${esc(r.dest)}</td><td>${esc(r.back)}</td><td>${esc(fmtNum(r.fuel))}</td><td>${esc(fmtNum(r.kmFuel))}</td><td>${esc(d.name)}</td></tr>`).join('')}</tbody></table>`;
  }
  const carCard = (H) => ({
    multi: true,
    id: 'carCard',
    group: 'إدارة الحركة',
    title: 'كارت السيارة',
    letterTitle: 'كارت السيارة',
    noDest: true,
    noDecisionBox: true,
    driverForm: true,
    trafficFlow: true,
    fields: [
      H.F.date,
      H.F.name,
      H.F.iqama,
      H.F.branch,
      { key: 'plate', label: 'رقم السيارة (اللوحة)', required: true },
      { key: 'vType', label: 'نوع السيارة' },
      { key: 'month', label: 'الشهر', required: true, hint: 'مثال: 10-2026' },
      {
        key: 'rows',
        label: 'حركة السيارة',
        type: 'table',
        required: true,
        columns: [
          { key: 'date', label: 'التاريخ', type: 'date' },
          { key: 'km', label: 'قراءة العداد', type: 'number' },
          { key: 'dest', label: 'جهة الخروج' },
          { key: 'back', label: 'العودة' },
          { key: 'fuel', label: 'الوقود (لتر)', type: 'number' },
          { key: 'kmFuel', label: 'العداد بعد الوقود', type: 'number' },
        ],
      },
    ],
    summary: (d) => `كارت السيارة ${d.plate || ''} — شهر ${d.month || ''}`,
    body: (d) => carCardBody(H, d),
  });

  /* بيان تغيير الزيت والديزل (البنزين) للسيارات: يرفعه السائق ← إدارة الحركة */
  function oilChangeBody(H, d) {
    const { infoTable, esc, fmtDate, fmtNum } = H;
    const rows = filledRows(d);
    return `${infoTable([
      ['نوع السيارة', d.vType],
      ['لوحة رقم', d.plate],
      ['السائق', d.name],
      ['الفرع', d.branch],
    ])}
        <table class="grid"><thead><tr><th>م</th><th>تاريخ آخر تغيير الزيت</th><th>قراءة عداد الزيت</th><th>قراءة عداد الكيلو مترات</th><th>السائق</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(fmtDate(r.date))}</td><td>${esc(fmtNum(r.oilKm))}</td><td>${esc(fmtNum(r.km))}</td><td>${esc(d.name)}</td></tr>`).join('')}</tbody></table>`;
  }
  const oilChange = (H) => ({
    multi: true,
    id: 'oilChange',
    group: 'إدارة الحركة',
    title: 'بيان تغيير الزيت',
    letterTitle: 'بيان تغيير الزيت والديزل (البنزين) للسيارات',
    noDest: true,
    noDecisionBox: true,
    driverForm: true,
    trafficFlow: true,
    fields: [
      H.F.date,
      H.F.name,
      H.F.iqama,
      H.F.branch,
      { key: 'plate', label: 'لوحة رقم', required: true },
      { key: 'vType', label: 'نوع السيارة' },
      {
        key: 'rows',
        label: 'تغييرات الزيت',
        type: 'table',
        required: true,
        columns: [
          { key: 'date', label: 'تاريخ آخر تغيير الزيت', type: 'date' },
          { key: 'oilKm', label: 'قراءة عداد الزيت', type: 'number' },
          { key: 'km', label: 'قراءة عداد الكيلومترات', type: 'number' },
        ],
      },
    ],
    summary: (d) => `تغيير زيت ${d.plate || ''}`,
    body: (d) => oilChangeBody(H, d),
  });

  /* طلب الموافقة على سداد مخالفة مرورية: يرفعه محاسب الفرع لمخالفة محالة لفرعه ← مدير إدارة الحركة ← مدير العمليات ← المدير المالي
   * (مساره وتجهيز بياناته من سجل المخالفات وما بعد اعتماده في الخادم: server/modules/operations/application/violation-pay.js) */
  function violationPayBody(H, d) {
    const { infoTable, esc, fmtDate, fmtNum } = H;
    const reason = d.reason ? `<p class="l-para"><b>المبررات :</b> ${esc(d.reason).replace(/\n/g, '<br>')}</p>` : '';
    return `${infoTable([
      ['رقم اللوحة', d.plate],
      ['رقم المخالفة', d.number || '—'],
      ['تاريخ المخالفة', [fmtDate(d.vDate), d.vTime].filter(Boolean).join(' — ')],
      ['نوع المخالفة', d.vType || '—'],
      ['الموقع', d.location || '—'],
      ['السائق وقت المخالفة', d.driver || 'غير معروف'],
      ['الفرع', d.branch],
      ['المبلغ', `${fmtNum(d.amount)} ريال`],
    ])}
      <p class="l-para">نرجو التكرم بالموافقة على سداد المخالفة المرورية الموضحة بياناتها أعلاه.</p>${reason}`;
  }
  const violationPay = (H) => ({
    id: 'violationPay',
    group: 'إدارة الحركة',
    title: 'طلب الموافقة على سداد مخالفة مرورية',
    letterTitle: 'طلب الموافقة على سداد مخالفة مرورية',
    noDest: true,
    violPayFlow: true,
    fields: [
      H.F.date,
      {
        key: 'violationId',
        label: 'المخالفة',
        required: true,
        choicesFrom: 'violPay',
        hint: 'من مخالفات فرعك المحالة إليه — بياناتها تُملأ من سجل المخالفات',
      },
      { key: 'reason', label: 'المبررات / ملاحظات', type: 'textarea' },
    ],
    amount: (d) => d.amount,
    summary: (d) => `مخالفة ${d.plate || ''}${d.vDate ? ` — ${d.vDate}` : ''}`,
    body: (d) => violationPayBody(H, d),
  });

  /* ---------- طلب صيانة مركبة ----------
   * محاسب الفرع يرفعه ← محاسب الورش (التشخيص وعرض السعر) ← مدير الفرع (الموافقة) ← محاسب الفرع (السداد)
   * ← الورشة المختارة (التنفيذ والتكلفة الفعلية) ← مدير العمليات (الاعتماد) — الدورة في operations/application/workshop-cycle.js */
  const money = (H, v) => (Number(v) ? `${H.fmtNum(v)} ريال` : '');
  const textRows = (H, pairs) =>
    `<table class="lt">${pairs.map(([l, v]) => `<tr><td class="lbl">${H.esc(l)}</td><td style="white-space:pre-wrap">${H.esc(v)}</td></tr>`).join('')}</table>`;
  function maintRequestPart(H, d) {
    const c = d.car || {};
    const where = d.workshop === H.EXT_WORKSHOP && d.externalName ? `${d.workshop} — ${d.externalName}` : d.workshop;
    return `<h4 class="l-sec">أولاً : بيانات المركبة :</h4>
      ${H.infoTable([
        ['رقم اللوحة', d.plate],
        ['الفئة', c.vType],
        ['الماركة / الطراز', [c.brand, c.model].filter(Boolean).join(' ')],
        ['سنة الصنع / اللون', [c.year, c.color].filter(Boolean).join(' — ')],
        ['الفرع', d.branch],
        ['السائق الحالي', c.driver],
      ])}
      <h4 class="l-sec">ثانياً : بيانات الطلب :</h4>
      ${H.infoTable([
        ['نوع الصيانة', d.mType],
        ['مستوى الاستعجال', d.priority],
        ['قراءة العداد', d.km ? `${H.fmtNum(d.km)} كم` : ''],
        ['جهة الصيانة', where],
      ])}
      ${textRows(H, [['وصف العطل / سبب الطلب', d.reason]])}`;
  }
  function maintQuotePart(H, g) {
    return `<h4 class="l-sec">ثالثاً : التشخيص وعرض السعر (محاسب الورش) :</h4>
      ${textRows(H, [['التشخيص والأعطال الفعلية', g.faults]])}
      ${H.infoTable([
        ['قطع الغيار', money(H, g.parts)],
        ['أجرة اليد', money(H, g.labor)],
        ['الإجمالي التقديري', money(H, g.estTotal)],
        ['مدة التنفيذ المتوقعة', g.days],
      ])}
      ${g.diagNote ? textRows(H, [['ملاحظات الورشة', g.diagNote]]) : ''}`;
  }
  /* سداد محاسب الفرع بعد موافقة مدير الفرع (يظهر بعد تسجيله) */
  function payPart(H, title, p) {
    if (!p || !p.payDate) return '';
    return `<h4 class="l-sec">${title}</h4>
      ${H.infoTable([
        ['تاريخ السداد', H.fmtDate(p.payDate)],
        ['المبلغ المسدد', money(H, p.paidAmount)],
        ['طريقة السداد', p.payMethod],
        ['رقم السند / الحوالة', p.payRef],
      ])}
      ${p.payNote ? textRows(H, [['ملاحظات السداد', p.payNote]]) : ''}`;
  }
  function maintDonePart(H, x) {
    const words = x.aTotal
      ? `<p class="l-para" style="margin:4px 0">الإجمالي الفعلي : <b>${H.esc(H.fmtNum(x.aTotal))}</b> ريال (${H.esc(H.tafqeet(x.aTotal))})</p>`
      : '';
    return `<h4 class="l-sec">خامساً : التنفيذ والتكلفة الفعلية :</h4>
      ${H.infoTable([
        ['تاريخ التنفيذ', H.fmtDate(x.doneDate)],
        ['رقم الفاتورة / أمر العمل', x.invoiceNo],
        ['قطع الغيار', money(H, x.aParts)],
        ['أجرة اليد', money(H, x.aLabor)],
        ['الإجمالي الفعلي', money(H, x.aTotal)],
        ['قراءة العداد عند التسليم', x.kmOut ? `${H.fmtNum(x.kmOut)} كم` : ''],
      ])}
      ${words}${x.doneNote ? textRows(H, [['ملاحظات التنفيذ', x.doneNote]]) : ''}`;
  }
  function maintBody(H, d) {
    const t = d.tasks || {};
    return `${maintRequestPart(H, d)}${maintQuotePart(H, t.mDiag || {})}${payPart(H, 'رابعاً : السداد (محاسب الفرع) :', t.mPay)}${maintDonePart(H, t.mDone || {})}`;
  }
  const carMaintenance = (H) => ({
    /* بيانات المركبة من سجل الأسطول (maintEnrich بالخادم) */
    id: 'carMaintenance',
    group: 'إدارة الحركة',
    title: 'طلب صيانة مركبة',
    letterTitle: 'أمر صيانة مركبة',
    maintFlow: true,
    noDest: true,
    decisionTitle: 'اعتمادات الطلب',
    sigTasks: { mDiag: 'محاسب الورش (التشخيص وعرض السعر)', mPay: 'محاسب الفرع (السداد)', mDone: 'الورشة (التنفيذ)' },
    fields: [
      H.F.date,
      H.F.branch,
      { key: 'plate', label: 'المركبة (رقم اللوحة)', required: true, choicesFrom: 'fleet', hint: 'من سجل أسطول السيارات' },
      { key: 'km', label: 'قراءة العداد الحالية (كم)', type: 'number', required: true },
      { key: 'mType', label: 'نوع الصيانة المطلوبة', type: 'select', options: H.MAINT_TYPES, required: true },
      { key: 'reason', label: 'وصف العطل / سبب الطلب', type: 'textarea', required: true },
      { key: 'workshop', label: 'جهة الصيانة', required: true, choicesFrom: 'workshops' },
      { key: 'externalName', label: 'اسم الورشة الخارجية', required: true, showIf: ['workshop', H.EXT_WORKSHOP] },
      { key: 'priority', label: 'مستوى الاستعجال', type: 'select', options: ['عادي', 'متوسط', 'عاجل'], default: 'عادي', required: true },
    ],
    summary: (d) => `${d.plate || ''}${d.mType ? ` — ${d.mType}` : ''}`,
    body: (d) => maintBody(H, d),
  });

  /* محضر تسليم وتسلم مركبة / معدة (منقول من forms.js؛ أدوات المحضر ورسمته من H) */
  const vehicleHandover = (H) => ({
    /* محضر تسليم وتسلم مركبة / معدة (إدارة الحركة): من نماذج الورد "محضر إستلام سيارة" (ملاكي / غمارة / غمارتين / دينة) */
    id: 'vehicleHandover',
    group: 'إدارة الحركة',
    title: 'محضر تسليم وتسلم مركبة / معدة',
    /* بعد رفع المحضر الموقّع من المسلِّم والمستلم يصبح العنوان "تعميد محضر..." لاعتماده من إدارة الحركة */
    letterTitle: (d, x) =>
      `${x && x.paperSigned ? 'تعميد ' : ''}محضر تسليم وإستلام ${d.vType === 'معدة' ? 'معدة' : `سيارة ( ${d.vType || '.....'} )`} فرع ${d.toBranch || d.branch || '..........'}`,
    noDest: true,
    noDecisionBox: true,
    noNote: true,
    hidePrep: true,
    /* يرفعه محاسب الفرع ← يرجع إليه ليطبعه ويوقعه المسلِّم والمستلم ويرفع صورته ← تعتمده إدارة الحركة */
    signFirst: true,
    extraSigs: ['المسلِّم', 'المستلم'],
    /* المسلِّم والمستلم يوقعان على الورق: بعد رفع المحضر الموقّع تظهر خانتاهما "موقّع في المحضر المرفوع" */
    paperSigs: ['المسلِّم', 'المستلم'],
    paperLabel: H.VEH_PAPER,
    /* توقيع محاسب الفرع الإلكتروني عند رفع المحضر الموقّع وإرساله لإدارة الحركة */
    sigTasks: { vehSign: 'محاسب الفرع' },
    /* المركبة من سجل الأسطول: بياناتها تُملأ تلقائياً، وبعد الاعتماد يتحدث سائقها وفرعها وحالتها في الأسطول */
    fleetFill: true,
    fields: [
      H.F.date,
      {
        key: 'plate',
        label: 'المركبة / المعدة (رقم اللوحة)',
        required: true,
        choicesFrom: 'fleetAll',
        hint: 'من سجل أسطول السيارات — بياناتها تُملأ تلقائياً',
      },
      { key: 'vType', label: 'فئة المركبة', type: 'select', options: H.VEH_TYPES, required: true },
      H.F.branch,
      /* بعد الاعتماد تنتقل المركبة في الأسطول لهذا الفرع (ويراها محاسبه) */
      {
        key: 'toBranch',
        label: 'الفرع المستلم (تنتقل إليه المركبة بعد الاعتماد)',
        required: true,
        choicesFrom: 'branches',
        fromUser: 'branch',
      },
      { key: 'model', label: 'نوع السيارة / المعدة', required: true, readonly: true, hint: 'من سجل الأسطول' },
      { key: 'year', label: 'سنة الصنع', readonly: true },
      { key: 'receiveDate', label: 'تاريخ الإستلام', type: 'date', required: true },
      { key: 'fromName', label: 'اسم المسلِّم (من كانت معه المركبة)', required: true },
      { key: 'fromIqama', label: 'رقم هوية / إقامة المسلِّم' },
      { ...H.F.name, label: 'اسم المستلم' },
      { ...H.F.iqama, label: 'رقم الهوية / الإقامة' },
      { key: 'licenseType', label: 'نوع الرخصة', type: 'select', options: ['خاصة', 'نقل خفيف', 'نقل ثقيل', 'عمومي', 'معدات ثقيلة'] },
      { key: 'licenseExpiry', label: 'تاريخ إنتهاء الرخصة', type: 'date' },
      /* علامات مرقمة على الرسمة: اضغط مكان التلف فيأخذ رقماً تلقائياً وتُكتب ملاحظته */
      { key: 'marks', label: 'حالة المركبة والتلفيات (اضغط على مكان التلف في الرسمة)', type: 'marks', imgFrom: 'vType', images: H.VEH_IMG },
      { key: 'condition', label: 'ملاحظات عامة أخرى', type: 'textarea', hint: 'تُكتب بعد ملاحظات الرسمة بجوارها في المحضر' },
      /* ملف التصفية المرتبط (عند إعداد المحضر من طلب تصفية موظف) */
      { key: 'caseId', label: 'ملف التصفية', hidden: true },
    ],
    summary: (d) => `${d.vType || ''} ${d.plate || ''} — ${d.name || ''}`.trim(),
    body: (d) => {
      const eq = d.vType === 'معدة';
      const ack =
        'اقر أنا الواردة بياناتي أعلاه بأنني إستلمت المركبة الواردة بياناتها أعلاه من الشركة لإستخدامها في أغراض العمل و أتعهد بالمحافظة عليها وعلى ملحقاتها بحالة جيدة و إستخدامها أثناء الدوام اليومي و لأغراض العمل مع الإهتمام بصيانتها الدورية و في حالة حدوث أي مشاكل أقوم بإبلاغ الإدارة فوراً كما أقر بمسئوليتي عن أي تلفيات تحدث في السيارة نتيجة سوء الإستخدام أو عدم العناية كما أقر بعدم تسليم السيارة لأي شخص آخر أو السماح له بإستخدام السيارة و أن أسلم السيارة على الحالة التي استلمتها عليها فور طلب الإدارة لذلك و أن أراعي في إستخدامها القوانين و أنظمة العمل لدى الشركة .';
      const table = `<table class="lt veh-t">
          <tr><th colspan="4">بيانات ${eq ? 'المعدة' : 'المركبة'} و تاريخ الإستلام</th></tr>
          <tr><td class="lbl">${eq ? 'نوع المعدة' : 'نوع السيارة'}</td><td>${H.esc(d.model)}</td><td class="lbl">${eq ? 'رقم المعدة' : 'رقم اللوحة'}</td><td>${H.esc(d.plate)}</td></tr>
          ${d.fromBranch && d.toBranch && d.fromBranch !== d.toBranch ? `<tr><td class="lbl">نقل ${eq ? 'المعدة' : 'المركبة'}</td><td colspan="3">من فرع ${H.esc(d.fromBranch)} إلى فرع <b>${H.esc(d.toBranch)}</b></td></tr>` : ''}
          <tr><td class="lbl">سنة الصنع</td><td>${H.esc(d.year)}</td><td class="lbl">تاريخ الإستلام</td><td>${H.esc(H.fmtDate(d.receiveDate))}</td></tr>
          <tr><th colspan="4">بيانات مسلِّم ${eq ? 'المعدة' : 'السيارة'}</th></tr>
          <tr><td class="lbl">الإسم</td><td>${H.esc(d.fromName)}</td><td class="lbl">رقم الهوية / الإقامة</td><td>${H.esc(d.fromIqama)}</td></tr>
          <tr><th colspan="4">بيانات مستلم ${eq ? 'المعدة' : 'السيارة'}</th></tr>
          <tr><td class="lbl">الإسم</td><td>${H.esc(d.name)}</td><td class="lbl">رقم الهوية / الإقامة</td><td>${H.esc(d.iqama)}</td></tr>
          <tr><td class="lbl">نوع الرخصة</td><td>${H.esc(d.licenseType)}</td><td class="lbl">تاريخ إنتهاء الرخصة</td><td>${H.esc(H.fmtDate(d.licenseExpiry))}</td></tr></table>
        ${H.vehDiagram(d.vType, d.marks, d.condition)}`;
      const fromAck = 'أقر أنا المسلِّم الوارد اسمي أعلاه بأنني سلّمت المركبة الواردة بياناتها أعلاه بالحالة الموضحة في هذا المحضر.';
      const fix = (t) => (eq ? t.replace(/المركبة/g, 'المعدة').replace(/السيارة/g, 'المعدة') : t);
      return `${table}
        <p class="l-para veh-ack">${fix(fromAck)}</p>
        <p class="l-para veh-ack">${fix(ack)}</p>`;
    },
  });

  /* نماذج هذا الجزء بترتيبها في قائمة النماذج */
  const trafficForms = (H) => [vehicleHandover(H), carCard(H), oilChange(H), violationPay(H), carMaintenance(H)];
  /* سداد محاسب الفرع في خطاب طلب التصنيع (forms.js) */
  trafficForms.payPart = payPart;
  if (typeof module === 'object' && module.exports) module.exports = trafficForms;
  else (root.SADEN_FORM_PARTS = root.SADEN_FORM_PARTS || []).push(trafficForms);
})(typeof self !== 'undefined' ? self : this);
