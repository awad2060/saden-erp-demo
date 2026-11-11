/* دوال forms.js (forms-fn-1): dayName، sheetTotal، esc، fmtDate، fmtNum، hijri، trFromPays، trPayBranch، transferEmps، val، below1000، scaleWord، words، tafqeet، infoTable، decisionBox، endTypeOf، basicPairs، empSigLine، valueAllowance، salaryFields، salaryTotal، salaryTable، mfgTotals، sumRows، quoteTotals، daysBetween، durationText، legalApply، dedBody، hireBenefits، hireTotal، hireFinalPay، iqamaLeft، hireBody، hireBodyValue، buildDc، renderJobOffer، jobOfferPart، sumOf، payPart، taskRows، carSpec، requiredAttachmentsOf، caseTables، caseSummary، closeDoc، renderCarRecord، vehDiagram، caseCarRecord، renderCaseAppendix، partValue، buildA، rank، withNote، summaryOf، amountOf، renderLetter، letterValue، buildForm
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-fn-1'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  const dayName = (s) =>
    /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))
      ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date(`${s}T00:00:00`).getDay()]
      : '';
  const sheetTotal = (d) => Math.round((d.rows || []).reduce((a, r) => a + (Number(r.amount) || 0), 0) * 100) / 100;

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
  const trFromPays = (d) => (d.payBranch ? d.payBranch === H.TR_PAY[0] : Number(String(d.effectiveDate || '').slice(8, 10)) > 15);
  const trPayBranch = (d) => (trFromPays(d) ? d.branch : d.toBranch) || '';
  const transferEmps = (d) => ((d.employees || []).length ? d.employees : d.name ? [{ name: d.name, iqama: d.iqama, job: d.job }] : []);
  const val = (s, dots = '..........') => (s ? `<b class="fill">${esc(s)}</b>` : `<span class="dots">${dots}</span>`);
  function below1000(n) {
    const parts = [];
    const h = Math.floor(n / 100),
      r = n % 100;
    if (h) parts.push(H.HUNDREDS[h]);
    if (r) {
      if (r < 20) parts.push(H.ONES[r]);
      else parts.push(r % 10 ? `${H.ONES[r % 10]} و${H.TENS[Math.floor(r / 10)]}` : H.TENS[Math.floor(r / 10)]);
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
  const endTypeOf = (n) => H.END_TYPES.find((x) => x.name === (H.END_ALIAS[n] || n)) || null;
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
      fields: [H.F.date, H.F.name, H.F.iqama, H.F.job, H.F.prof, ...fields],
      body: (d) => `<p>برجاء تحديد قيمة (${label}) للموظف الآتي بياناته :</p>
        ${infoTable([...basicPairs(d), ...pairs(d)])}
        ${extra ? extra(d) : ''}`,
      needsValue: true,
    };
  }
  const salaryFields = (prefix, when) => H.SALARY_ITEMS.map(([k, l]) => ({ key: prefix + k, label: `${l} ${when}`, type: 'number' }));
  const salaryTotal = (d, prefix) => H.SALARY_ITEMS.reduce((s, [k]) => s + (Number(d[prefix + k]) || 0), 0);
  function salaryTable(d, prefix) {
    const total = salaryTotal(d, prefix);
    return `<table class="lt grid sm"><thead>
      <tr><th rowspan="2" style="width:22%">الإسم</th><th rowspan="2">رقم الإقامة</th><th rowspan="2">الوظيفة</th><th rowspan="2">الراتب الأساسي</th><th colspan="5">البدلات</th><th rowspan="2">الإجمالي</th></tr>
      <tr>${H.SALARY_ITEMS.slice(1)
        .map(([, l]) => `<th>${l}</th>`)
        .join('')}</tr></thead>
      <tbody><tr><td>${esc(d.name)}</td><td>${esc(d.iqama)}</td><td>${esc(d.job)}</td>
      ${H.SALARY_ITEMS.map(([k]) => `<td>${esc(fmtNum(d[prefix + k]))}</td>`).join('')}<td><b>${total ? esc(fmtNum(total)) : ''}</b></td></tr></tbody></table>`;
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
  const hireTotal = (s) => H.HIRE_PAY.reduce((a, [k]) => a + (Number((s || {})[k]) || 0), 0);
  /* الراتب النهائي: كما اقترحه مدير قسم الرواتب، أو كما عدّله رئيس لجنة التوظيف (بنود f_) */
  function hireFinalPay(d) {
    const t = (d && d.tasks) || {},
      s = t.hireSalary || {},
      dc = t.hireDecision || {};
    if (dc.decision !== H.HIRE_MODIFY || !dc.f_basic) return s;
    return Object.fromEntries(H.HIRE_PAY.map(([k]) => [k, dc['f_' + k] || '']));
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
    const { dc, h, rows, s, tc, total } = buildDc(d);
    return `<h4 class="l-sec">أولاً : البيانات الشخصية :</h4>
      ${hireBodyValue(d)}
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
      <table class="lt grid sm"><thead><tr><th>المعيار</th>${H.HIRE_RATING.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>
      ${H.HIRE_CRITERIA.map(([k, l]) => `<tr><td>${esc(l)}</td>${H.HIRE_RATING.map((x) => `<td>${tc[k] === x ? '✔' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table>
      ${rows([
        ['تاريخ المقابلة', fmtDate(tc.interviewDate)],
        ['توصية اللجنة الفنية', tc.recommendation],
        ['رأي اللجنة الفنية', tc.techNote],
      ])}
      <h4 class="l-sec">خامساً : العرض المالي (مدير قسم الرواتب) :</h4>
      <table class="lt grid"><thead><tr>${H.HIRE_PAY.map(([, l]) => `<th>${l}</th>`).join('')}<th>الإجمالي</th></tr></thead>
      <tbody><tr>${H.HIRE_PAY.map(([k]) => `<td>${esc(fmtNum(s[k]))}</td>`).join('')}<td><b>${total ? esc(fmtNum(total)) : ''}</b></td></tr></tbody></table>
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
        dc.decision === H.HIRE_MODIFY && dc.f_basic
          ? `<table class="lt grid"><thead><tr>${H.HIRE_PAY.map(([, l]) => `<th>${l} المعتمد</th>`).join('')}<th>الإجمالي المعتمد</th></tr></thead>
      <tbody><tr>${H.HIRE_PAY.map(([k]) => `<td>${esc(fmtNum(dc['f_' + k]))}</td>`).join('')}<td><b>${esc(fmtNum(hireTotal(hireFinalPay(d))))}</b></td></tr></tbody></table>`
          : ''
      }`;
  }
  /* جزء من hireBody: infoTable([… */
  function hireBodyValue(d) {
    return infoTable([
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
    ]);
  }
  /* جزء من hireBody: const t = d.tasks || {},… */
  function buildDc(d) {
    const t = d.tasks || {},
      h = t.hireHr || d,
      tc = t.hireTech || {},
      s = t.hireSalary || {},
      dc = t.hireDecision || {};
    const rows = (pairs) =>
      `<table class="lt">${pairs.map(([l, v]) => `<tr><td class="lbl">${esc(l)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>`;
    const total = hireTotal(s);
    return { dc, h, rows, s, tc, total };
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
    return jobOfferPart(ctx, d, h, pay, qual, s);
  }
  /* جزء من renderJobOffer: const n = (v) => (Number(v) ? esc(fmtNum(v)) : '--… */
  function jobOfferPart(ctx, d, h, pay, qual, s) {
    const n = (v) => (Number(v) ? esc(fmtNum(v)) : '---');
    const allow = H.HIRE_PAY.slice(1).filter(([k]) => k !== 'otherAllow' || Number(pay[k]));
    const total = hireTotal(pay);
    const benefits = hireBenefits(s);
    const issued = !!ctx.approvedAt;
    const head = H.LETTERHEAD ? '<img class="l-head" src="header.png" alt="">' : '';
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
  const sumOf = (o, keys) => keys.reduce((a, k) => a + (Number((o || {})[k]) || 0), 0);
  /* قسم السداد في الخطاب (من forms-traffic.js، مشترك مع طلب صيانة المركبة) */
  const payPart = (title, p) => H.FORM_PARTS.find((x) => x.payPart).payPart({ infoTable, esc, fmtDate, fmtNum }, title, p);
  const taskRows = (t, data) =>
    H.TASKS[t].fields
      .filter((f) => f.type !== 'marks' && (!f.finalOnly || data[f.key]))
      .map((f) => [esc(f.label), f.type === 'date' ? fmtDate(data[f.key]) : f.type === 'number' ? fmtNum(data[f.key]) : data[f.key] || '']);
  /* السيارة في التصفية: فئتها ونوعها ولوحتها كما في محضر التسليم */
  const carSpec = (c) => [[c.vType, c.model].filter(Boolean).join(' '), c.plate ? `لوحة ${c.plate}` : ''].filter(Boolean).join(' — ');
  const requiredAttachmentsOf = (form, d) => [
    ...((form || {}).requiredAttachments || []),
    ...((form || {}).requiredIf || []).filter(([, k, v]) => String((d || {})[k] || '') === v).map(([l]) => l),
    ...((form || {}).empSign && (d || {}).empSigMode === 'manual' ? [H.ADV_SIGNED] : []),
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
  const closeDoc = (type) => H.CLOSE_DOCS[(H.byId[type] || {}).companion] || null;
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
    const head = H.LETTERHEAD ? '<img class="l-head" src="header.png" alt="">' : '';
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
    const img = H.VEH_IMG[vType];
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
  /* جزء من part: (q.qItems || []).some((x) => x.item)… */
  function partValue(d, q) {
    return (q.qItems || []).some((x) => x.item)
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
      : '';
  }
  /* جزء من body: const rows = (d.items || []).filter((x) => x.produ… */
  function buildA(d) {
    const rows = (d.items || []).filter((x) => x.product),
      tk = d.tasks || {},
      a = tk.mfgAccept || {},
      q = tk.mfgQuote || {},
      dn = tk.mfgDone || {};
    return { a, dn, q, rows, tk };
  }
  const rank = (f) => {
    const i = H.ORDER.indexOf(f.id);
    return i < 0 ? H.ORDER.length : i;
  };
  const withNote = (f) =>
    f.embed || f.noNote || f.fields.some((x) => x.key === H.NOTE_FIELD.key) ? f : { ...f, fields: [...f.fields, H.NOTE_FIELD] };

  function summaryOf(form, d) {
    if (form.summary) return form.summary(d || {});
    return (d && (d.name || d.subject || d.branch)) || '';
  }
  function amountOf(form, d) {
    if (form.amount) return form.amount(d || {});
    return form.amountKey && d ? d[form.amountKey] : '';
  }
  function renderLetter(formId, data, ctx) {
    /* حالة الصفحة: ما يتغير بعد العرض (ctx، sigCols، sigsHtml) */
    const { form, vs } = buildForm(ctx, formId);
    if (!form) return '';
    const { d, decisions, dest, head, qr, side, sideDecisions, title } = H.buildD(data, form, vs);
    return `<div class="letter${form.compact ? ' compact' : ''}${head ? ' has-head' : ''}">${head}
      <div class="l-top"><div>التاريخ : <span class="red">${esc(fmtDate(d.date)) || '0000/00/00'}</span>${form.hijri && hijri(d.date) ? `<br>الموافق : <span class="red">${esc(hijri(d.date))}هـ</span>` : ''}</div>${vs.ctx.serial ? `<div>رقم الطلب : <bdi dir="ltr" class="red">${esc(vs.ctx.serial)}</bdi></div>` : ''}</div>
      ${form.compact ? '' : qr}
      <div class="l-title">${esc(title)}</div>
      ${letterValue(dest, form)}
      ${form.body(d)}${form.bodyNote ? form.bodyNote(d) : ''}
      ${d.letterNote && !form.embed ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(d.letterNote).replace(/\n/g, '<br>')}</div>` : ''}
      ${form.noDest || form.hideClosing ? '' : `<p class="l-greet">${esc(form.closeText || 'ولسيادتكم جزيل الشكر ,,,')}</p>`}
      ${side ? decisionBox(side.head, sideDecisions, true) : ''}
      ${form.noDecisionBox ? '' : decisionBox(esc(form.decisionTitle || 'قرار الإدارة المالية'), decisions)}
      <div class="l-sigs" style="grid-template-columns:repeat(${Math.min(vs.sigCols, form.compact || form.issuer ? 5 : 4)},1fr)${form.legalFlow && vs.sigCols === 1 ? ';max-width:60mm;margin-inline-start:auto' : ''}">${vs.sigsHtml}${form.compact ? qr : ''}</div>
      ${vs.ctx.createdByName && !form.hidePrep ? `<div class="l-prep">مُعد الطلب (محاسب الفرع) : ${esc(vs.ctx.createdByName)}</div>` : ''}
    </div>`;
  }
  /* جزء من renderLetter: form.noDest… */
  function letterValue(dest, form) {
    return form.noDest
      ? ''
      : `<div class="l-dest">${dest}</div>
      ${form.hideGreet ? '' : `<p class="l-greet">${esc(form.greetText || 'تحية طيبة وبعد ,,,')}</p>`}`;
  }
  /* جزء من renderLetter: const vs = {};… */
  function buildForm(ctx, formId) {
    const vs = {};
    vs.ctx = ctx;
    /* يقبل رقم النموذج، أو تعريف نموذج مخصص للمعاينة قبل حفظه */
    const form =
      formId && typeof formId === 'object' ? (typeof formId.body === 'function' ? formId : H.buildCustom(formId)) : H.byId[formId];
    return { form, vs };
  }
  return {
    dayName,
    sheetTotal,
    esc,
    fmtDate,
    fmtNum,
    hijri,
    trFromPays,
    trPayBranch,
    transferEmps,
    val,
    below1000,
    scaleWord,
    words,
    tafqeet,
    infoTable,
    decisionBox,
    endTypeOf,
    basicPairs,
    empSigLine,
    valueAllowance,
    salaryFields,
    salaryTotal,
    salaryTable,
    mfgTotals,
    sumRows,
    quoteTotals,
    daysBetween,
    durationText,
    legalApply,
    dedBody,
    hireBenefits,
    hireTotal,
    hireFinalPay,
    iqamaLeft,
    hireBody,
    hireBodyValue,
    buildDc,
    renderJobOffer,
    jobOfferPart,
    sumOf,
    payPart,
    taskRows,
    carSpec,
    requiredAttachmentsOf,
    caseTables,
    caseSummary,
    closeDoc,
    renderCarRecord,
    vehDiagram,
    caseCarRecord,
    renderCaseAppendix,
    partValue,
    buildA,
    rank,
    withNote,
    summaryOf,
    amountOf,
    renderLetter,
    letterValue,
    buildForm,
  };
});
