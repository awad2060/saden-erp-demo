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

  /* نماذج مركز الجرد: قسم لكل تبويب جرد، والأجهزة النوعية */
  function invTemplate(S, [sec, sub, label]) {
    return {
      title: label,
      file: invFile(label),
      cols: [S.INV_NO, ...S.invCols(sec, sub)].map((c) => c.label),
      sample: invSample(S, sec, sub),
      page: ['#/inventory', 'جرد الفروع'],
      how: `افتح جرد الفرع ← تبويب «${label}» ← «رفع من Excel» واختر الملف. النموذج واحد لكل الفروع.`,
      show: S.can('inventory'),
    };
  }
  const devTemplate = (S) => ({
    title: 'الأجهزة النوعية',
    file: DEV_FILE,
    cols: [S.INV_NO, ...S.DEV_COLS].map((c) => c.label),
    sample: DEV_SAMPLE,
    page: ['#/devices', 'الأجهزة النوعية'],
    how: 'صفحة الأجهزة النوعية ← «رفع من Excel». الأجهزة الجديدة تكون متاحة للاستعارة.',
    show: S.can('devices'),
  });

  window.SES_TEMPLATES = window.SES_TEMPLATES || {};
  window.SES_TEMPLATES.depts = window.SES_TEMPLATES.depts || {};
  window.SES_TEMPLATES.depts.inventory = (S) => ({
    title: 'مركز نماذج الجرد',
    items: [...S.INV_TABS.map((t) => invTemplate(S, t)), devTemplate(S)],
  });
  window.SES_INV = { navItems, invSample, invFile, DEV_SAMPLE, DEV_FILE };
})();
