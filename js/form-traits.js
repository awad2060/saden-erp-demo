/* خصائص أنواع الطلبات — المكان الوحيد الذي يُذكر فيه نوع طلب بعينه (في الخادم والواجهة).
 * الكود يسأل عن الخاصية باسمها (is(r, 'settlementFile')) لا عن النوع (r.type === 'settlementCase')،
 * فيظهر هنا كل ما يميّز كل نموذج، ويُضاف نموذج جديد بسطر بدل البحث عن مقارنات متفرقة.
 * (ما يصفه public/js/forms.js نفسه — flow و returnPrev و hrFlow... — يُقرأ من هناك)
 * الملف مشترك: في الخادم يستورده server/modules/requests/domain/form-traits.js، وفي الواجهة يُحمَّل قبل الصفحات (SADEN_FORM_TRAITS) */
(function (root) {
  'use strict';
  const TRAITS = {
    /* ملف التصفية: مراحل الدورة، والخصومات والعهد، ومحضر السيارة المرتبط، والإعادة لمرحلة الخصومات */
    settlementCase: { settlementFile: true },
    /* إذن الصرف: يُتحقق من المخزون عند الاعتماد النهائي، وتُذكر تعديلات الكمية في سجل الاعتماد */
    stockIssue: { finalStockCheck: true, logsQtyEdits: true, stockIssueForm: true },
    /* بيع الخردة: يُتحقق من رصيد الخردة عند الاعتماد النهائي */
    scrapSale: { finalScrapCheck: true, scrapSaleForm: true },
    /* طلب التصنيع / الشراء: الإعادة افتراضياً للمرحلة السابقة، وله عرض سعر مرتبط */
    mfgRequest: { returnToPrevious: true, quoteTarget: true, workshopOrder: true },
    /* عرض السعر: يرتبط بطلب تصنيع في مرحلة عرض السعر ويُعتمد بإنشائه */
    priceQuote: { linkedQuote: true },
    /* بيان الجُمع / الإعاشات: بعد اعتماده يُنشأ خطاب إعتماد الصرف */
    allowanceSheet: { spawnsPayLetter: true, allowanceSheetForm: true },
    /* قرارات الخصم: تُلغى بعد اعتمادها (الشئون القانونية)، و«الخصم» في رسالة شهر الرواتب */
    deduction: { cancellableDeduction: true, payMonthNoun: 'الخصم', managerDeduction: true },
    legalDeduction: { cancellableDeduction: true, legalDeductionDecision: true },
    /* مباشرة العمل: يراها في القوائم من أُعطي الاطلاع على المباشرات للعلم */
    workStart: { workStartNotice: true },
    /* محضر تسليم السيارة: قد يرتبط بملف تصفية */
    vehicleHandover: { vehicleRecord: true },
    /* صيانة جهاز من الجرد */
    deviceMaint: { deviceRepair: true },
    /* استعارة جهاز نوعي */
    deviceLoan: { deviceBorrow: true },
    /* سلفة قصيرة (تُخصم في شهر واحد) */
    advanceShort: { shortAdvance: true },
    /* سلفة طويلة (أقساط شهرية) */
    advanceLong: { longAdvance: true },
    /* تظلم من قرار خصم */
    deductionAppeal: { deductionAppeal: true },
    /* تظلم من تقييم مؤشرات الأداء (يُحصى في الجودة ومؤشرات الأداء) */
    kpiAppeal: { kpiAppeal: true },
    /* شكوى للشئون القانونية */
    legalComplaint: { legalComplaint: true },
    /* نموذج آخر يوم دوام */
    lastWorkDay: { lastWorkDayForm: true },
    /* خطاب صرف الجُمع / الإعاشات */
    allowanceLetter: { allowancePayLetter: true },
    /* بيان الجُمع / الإعاشات لموظفي الفرع (إجمالي) */
    allowanceSheetBulk: { bulkAllowanceSheet: true },
    /* طلب احتياج وظيفي */
    staffRequest: { staffingRequest: true },
    /* توريد خردة للورشة */
    scrapSupply: { scrapSupply: true },
    /* انتداب / رحلة عمل */
    bizTrip: { businessTrip: true },
    /* صيانة مركبة */
    carMaintenance: { vehicleMaintenance: true },
    /* تعديل راتب */
    salaryRaise: { salaryRaiseForm: true },
    /* بدل اتصال لموظفين (إجمالي) */
    contactBulk: { bulkContactAllowance: true },
    /* قرار نقل موظف */
    empTransfer: { transferDecision: true },
    /* تجديد إقامة */
    iqamaRenew: { iqamaRenewal: true },
    /* نقل كفالة */
    sponsorTransfer: { sponsorshipTransfer: true },
    /* خروج وعودة */
    exitReentry: { exitReentryVisa: true },
  };

  const traitsOf = (type) => (Object.hasOwn(TRAITS, type) ? TRAITS[type] : {});
  /* هل لنوع هذا الطلب الخاصية؟ */
  const is = (r, trait) => !!traitsOf(r.type)[trait];
  /* أول نوع له الخاصية (لإنشاء طلب من نوع بعينه أو البحث عنه) */
  const typeWith = (trait) => Object.keys(TRAITS).find((t) => TRAITS[t][trait]);

  const api = { is, traitsOf, typeWith };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SADEN_FORM_TRAITS = api;
})(typeof self !== 'undefined' ? self : this);
