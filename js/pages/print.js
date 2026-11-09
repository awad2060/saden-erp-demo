'use strict';
/* صفحة «print» (viewPrint) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['print'] = function (S) {
  /* خصائص أنواع الطلبات (public/js/form-traits.js): isForm(r, 'خاصية') بدل مقارنة النوع */
  const isForm = (r, trait) => window.SADEN_FORM_TRAITS.is(r, trait);
  const { $, $$, SF, api, app, attachmentPages, carCtx, caseCtx, clearanceCtx, fillEmbeds, fitA4, letterCtx, offerCtx, sheetLetterCtx } = S;
  /* ---------- صفحة الطباعة ---------- */
  /* اسم ملف الـ PDF (عنوان الصفحة عند «حفظ PDF»): نوع الطلب - اسم الموظف - الفرع، مثل «بدل إتصال - مصطفى عبده - فرع نجران» */
  function pdfName(r) {
    const d = r.data || {},
      form = SF.byId[r.type];
    return pdfNamePart(d, form, r);
  }
  /* جزء من pdfName: let kind = String(r.typeTitle || '')… */
  function pdfNamePart(d, form, r) {
    let kind = String(r.typeTitle || '')
      .replace(/^خطاب (تعميد|إعتماد صرف|إعتماد|اعتماد)\s+/, '')
      .replace(/^طلب\s+/, '');
    if (['allowanceSheet', 'allowanceSheetBulk', 'allowanceLetter'].includes(r.type) && d.sheetType)
      kind = `بيان ${d.sheetType}${isForm(r, 'bulkAllowanceSheet') ? ' مجمع' : ''}`;
    if (['general', 'openLetter'].includes(r.type) && d.subject) kind = d.subject;
    const nameF =
      form &&
      form.fields.find((f) => ['name', 'nameAr', 'empName'].includes(f.key) && /اسم|الإسم/.test(f.label) && !/الدورة|الورشة/.test(f.label));
    const emps = Array.isArray(d.employees) ? d.employees.filter((e) => e && e.name) : [];
    /* بدون اسم موظف: الموظفون المنقولون، أو الجهاز، أو لوحة المركبة، أو الغرض */
    const person =
      (nameF && d[nameF.key]) ||
      (emps.length === 1 ? emps[0].name : emps.length ? `${emps.length} موظفين` : '') ||
      (d.dev && d.dev.name) ||
      (d.plate && `لوحة ${d.plate}`) ||
      d.purpose ||
      '';
    const br = String(d.branch || r.branch || '')
      .trim()
      .replace(/^فرع\s+/, '');
    const month = ['allowanceSheet', 'allowanceSheetBulk'].includes(r.type) && d.month ? `${d.month} ${d.year || ''}`.trim() : '';
    return (
      [kind, person, br && `فرع ${br}`, month]
        .filter(Boolean)
        .map((x) =>
          String(x)
            .replace(/[\\/:*?"<>|]+/g, '-')
            .replace(/\s+/g, ' ')
            .trim(),
        )
        .join(' - ') || `${r.typeTitle} - ${r.serial}`
    );
  }

  async function viewPrint(id) {
    const r = await api('GET', `/api/requests/${id}`);
    document.title = pdfName(r);
    const form = SF.byId[r.type];
    const withClear = form && form.companion === 'clearance' && (!form.flow || r.data.state);
    const withApp = form && form.flow;
    const withOffer = form && form.companion === 'offer' && r.status === 'approved';
    const withLic = form && form.companion === 'licenseAck' && r.status === 'approved';
    const withSheetLetter = form && form.companion === 'allowanceLetter' && r.data.combined;
    app.innerHTML = `<div class="print-page"><div class="print-bar">
      ${printValue(withApp, withClear, withLic, withOffer, withSheetLetter)}
      ${r.attachments.length ? '<button class="btn" data-print="noatt">بدون المرفقات</button>' : ''}
      <button class="btn" data-pdf="${r.id}">⬇ تنزيل PDF</button>
      <a class="btn" href="#/req/${r.id}">رجوع للطلب</a></div>
      ${SF.renderLetter(r.type, r.data, letterCtx(r))}
      ${withClear ? SF.renderClearance(r.data, clearanceCtx(r)) : ''}
      ${withOffer ? SF.renderJobOffer(r.data, offerCtx(r)) : ''}
      ${withLic ? SF.renderLicenseAck(r.data, { ...clearanceCtx(r), amount: r.amount }) : ''}
      ${withSheetLetter ? SF.renderLetter('allowanceLetter', SF.sheetLetterData(r.data, r.branch), sheetLetterCtx(r)) : ''}
      ${printValue2(r, withApp)}
      ${r.vehicle || r.sheet ? SF.renderLetter((r.vehicle || r.sheet).type, (r.vehicle || r.sheet).data, letterCtx(r.vehicle || r.sheet)) : ''}
      ${!r.vehicle && isForm(r, 'settlementFile') && r.data.car && r.route.some((s) => s.task === 'carApprove') ? SF.renderLetter('vehicleHandover', r.data.car, carCtx(r)) : ''}
      ${r.issue ? SF.renderLetter(r.issue.type, r.issue.data, letterCtx(r.issue)) : ''}
      <div id="attPages"></div><div id="attPagesVeh"></div></div>`;
    return viewPrintPart2(r);
  }
  /* جزء من viewPrint: withApp && r.data.state ? SF.renderCaseAppendix(r.data, case… */
  function printValue2(r, withApp) {
    return withApp && r.data.state
      ? SF.renderCaseAppendix(r.data, caseCtx(r))
      : withApp && (r.data.tasks || {}).traffic
        ? SF.caseCarRecord(r.data, caseCtx(r))
        : '';
  }
  /* جزء من viewPrint: withClear… */
  function printValue(withApp, withClear, withLic, withOffer, withSheetLetter) {
    return withClear
      ? `<button class="btn primary" data-print="all">🖨️ طباعة ${withApp ? 'الملف كاملاً' : 'التصفية والمخالصة'}</button><button class="btn" data-print="main">التصفية فقط</button><button class="btn" data-print="clear">المخالصة فقط</button>${withApp ? '<button class="btn" data-print="app">الملاحق فقط</button>' : ''}`
      : withSheetLetter
        ? '<button class="btn primary" data-print="all">🖨️ طباعة البيان وخطاب التعميد</button>'
        : withLic
          ? '<button class="btn primary" data-print="all">🖨️ طباعة الخطاب والإقرار</button><button class="btn" data-print="main">الخطاب فقط</button><button class="btn" data-print="clear">الإقرار فقط</button>'
          : withOffer
            ? '<button class="btn primary" data-print="all">🖨️ طباعة الاستمارة والعرض الوظيفي</button><button class="btn" data-print="main">الاستمارة فقط</button><button class="btn" data-print="clear">العرض الوظيفي فقط</button>'
            : '<button class="btn primary" data-print="all">🖨️ طباعة / حفظ PDF</button>';
  }
  /* جزء من viewPrint: fitA4(app);… */
  function viewPrintPart2(r) {
    fitA4(app);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitA4(app));
    viewPrintPart();
    fillEmbeds(app, r);
    window.__printReady = false;
    /* علامة اكتمال الصفحة (بعد صفحات المرفقات) لإنشاء ملف PDF من السيرفر */
    attachmentPages($('#attPages'), r)
      .then(() => (r.vehicle || r.sheet ? attachmentPages($('#attPagesVeh'), r.vehicle || r.sheet) : null))
      .catch(() => {})
      .then(() => {
        fitA4(app);
        window.__printReady = true;
      });
  }
  /* جزء من viewPrint: $$('[data-print]').forEach((b) => {… */
  function viewPrintPart() {
    $$('[data-print]').forEach((b) => {
      b.onclick = () => {
        const page = $('.print-page');
        page.classList.remove('only-main', 'only-clear', 'only-app', 'no-att');
        if (b.dataset.print === 'noatt') page.classList.add('no-att');
        if (b.dataset.print === 'app') page.classList.add('only-app');
        if (b.dataset.print === 'main') page.classList.add('only-main');
        if (b.dataset.print === 'clear') page.classList.add('only-clear');
        window.print();
      };
    });
  }

  return { viewPrint };
};
