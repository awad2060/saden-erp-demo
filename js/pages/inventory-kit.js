'use strict';
/* أدوات إدارة الجرد المشتركة: عناصر قائمتها في الشريط الجانبي، ونماذج الرفع الموحدة لكل نوع (لا باسم فرع)
 * التي تستعملها نافذة «رفع من Excel» في صفحات الجرد ومركز نماذج الجرد (#/inventory?tab=templates) معاً. */
(function () {
  /* المثال الافتراضي لصف الجرد (لكل قسم مثاله في INV_SAMPLE) */
  const INV_DEFAULT = [1, 'جهاز قص مباشر', 'Direct Shear', 1, 'ELE', 'SN-1001', 'SADEN-RD-LAA-0001', 'مع الملحقات', 'يعمل', ''];
  const DEV_SAMPLE = [1, 'جهاز نووي لقياس الكثافة', 'Troxler', '3440', 'SN-1001', 'SADEN-HQ-DEV-0001', ''];
  const DEV_FILE = 'نموذج-الأجهزة-النوعية.xlsx';
  const invSample = (S, sec, sub) => S.INV_SAMPLE[sub] || S.INV_SAMPLE[sec] || INV_DEFAULT;
  /* نموذج قسم الجرد: «جرد ...» لا يتكرر في الاسم */
  const invFile = (label) => window.SES_TEMPLATES.fileOf(/^جرد/.test(label) ? label : `جرد ${label}`);

  /* عناصر قائمة «إدارة الجرد»: [شرط الظهور، الرابط، الأيقونة، العنوان] */
  const invMgr = (u) => u.role === 'admin' || (u.flowRoles || []).includes('invMgr');
  const NAV = [
    [(S) => S.can('inventory'), '#/inventory', 'boxes', 'جرد الفروع'],
    [(S) => S.can('devices'), '#/devices', 'monitor', 'الأجهزة النوعية'],
    /* مركز النماذج على رابط الجرد (#/inventory)، فيظهر لمن يرى جرد الفروع */
    [(S) => S.can('inventory'), '#/inventory?tab=templates', 'download', 'مركز نماذج الجرد'],
    [(S) => S.can('inventory') && invMgr(S.state.user), '#/inventory-deleted', 'trash', 'محذوفات الجرد'],
  ];
  const navItems = (S) => NAV.filter(([ok]) => ok(S)).map(([, href, ic, title]) => [href, S.icon(ic), title]);

  /* شرح أعمدة الجرد في ورقة «شرح النموذج» (بمفتاح العمود) */
  const INV_HELP = {
    ar: 'اسم البند بالعربي كما يُعرف في الفرع.',
    en: 'اسم البند بالإنجليزي إن وُجد.',
    type: 'نوع البند، مثل: مكتب، كرسي، مكيف سبليت، لاب توب، كرفان.',
    user: 'اسم الموظف المستلم للبند، أو مكانه (مثل: غرفة المحاسب).',
    qty: 'عدد القطع من هذا البند.',
    brand: 'الماركة أو الشركة المصنّعة.',
    serial: 'الرقم التسلسلي المكتوب على الجهاز.',
    code: 'كود الأصل (مثل SADEN-RD-LAA-0001). يطبع النظام منه باركود إذا كان بحروف إنجليزية وأرقام وشرطة.',
    parts: 'وصف البند وملحقاته.',
    status: 'حالة البند. «يعمل» و«صيانة» و«تالف» تظهر ملوّنة في البيان، وأي نص آخر يُحفظ كما هو.',
    notes: 'أي ملاحظة على البند.',
  };
  const invGuide = (label) => ({
    about: `بنود ${/^جرد/.test(label) ? label : `جرد ${label}`} في فرع واحد: صف لكل بند. الملف نفسه لكل الفروع، والفرع يتحدد من الصفحة التي ترفع منها.`,
    help: INV_HELP,
    steps: [`افتح «جرد الفروع» واختر الفرع، ثم تبويب «${label}».`, 'اضغط «رفع من Excel» ثم «رفع ملف Excel» واختر هذا الملف.'],
    notes: [
      'ملف لكل فرع ولكل تبويب: لا تجمع فرعين أو قسمين في ملف واحد.',
      'لا ترفع الملف نفسه مرتين: النظام يضيف الصفوف كما هي ولا يحذف المكرر.',
      'يحفظ النظام البيانات كما كُتبت، فراجعها في الجدول قبل الحفظ.',
    ],
  });
  /* نماذج مركز الجرد: قسم لكل تبويب جرد، والأجهزة النوعية */
  function invTemplate(S, [sec, sub, label]) {
    return {
      title: label,
      file: invFile(label),
      defs: [S.INV_NO, ...S.invCols(sec, sub)],
      sample: invSample(S, sec, sub),
      page: ['#/inventory', 'جرد الفروع'],
      how: `افتح جرد الفرع ← تبويب «${label}» ← «رفع من Excel» واختر الملف. النموذج واحد لكل الفروع.`,
      guide: invGuide(label),
      show: S.can('inventory'),
    };
  }
  const DEV_GUIDE = {
    about: 'الأجهزة النوعية التي تملكها الإدارة وتُعار للفروع لمدة محددة: صف لكل جهاز.',
    help: {
      name: 'اسم الجهاز كما سيظهر في طلب الاستعارة.',
      brand: 'الماركة أو الشركة المصنّعة.',
      model: 'موديل الجهاز.',
      serial: 'الرقم التسلسلي المكتوب على الجهاز.',
      code: 'كود الأصل (مثل SADEN-HQ-DEV-0001).',
      notes: 'أي ملاحظة على الجهاز.',
    },
    steps: ['افتح صفحة «الأجهزة النوعية».', 'اضغط «رفع من Excel» ثم «رفع ملف Excel» واختر هذا الملف.'],
    notes: [
      'كل جهاز جديد يُسجَّل بحالة «متاح» ويظهر للفروع في طلب الاستعارة.',
      'لا ترفع الملف نفسه مرتين: النظام يضيف الصفوف كما هي ولا يحذف المكرر.',
    ],
  };
  const devTemplate = (S) => ({
    title: 'الأجهزة النوعية',
    file: DEV_FILE,
    defs: [S.INV_NO, ...S.DEV_COLS],
    sample: DEV_SAMPLE,
    page: ['#/devices', 'الأجهزة النوعية'],
    how: 'صفحة الأجهزة النوعية ← «رفع من Excel». الأجهزة الجديدة تكون متاحة للاستعارة.',
    guide: DEV_GUIDE,
    show: S.can('devices'),
  });

  window.SES_TEMPLATES = window.SES_TEMPLATES || {};
  window.SES_TEMPLATES.depts = window.SES_TEMPLATES.depts || {};
  window.SES_TEMPLATES.depts.inventory = (S) => ({
    title: 'مركز نماذج الجرد',
    items: [...S.INV_TABS.map((t) => invTemplate(S, t)), devTemplate(S)],
  });
  window.SES_INV = { navItems, invSample, invFile, invGuide, DEV_SAMPLE, DEV_FILE, DEV_GUIDE };
})();
