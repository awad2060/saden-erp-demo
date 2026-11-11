/* قاموس الترجمة إلى الإنجليزية (17): تشفير النسخ الاحتياطية — يملأ window.SES_I18N.en (يُحمَّل قبل i18n-core.js) */
(function (I) {
  'use strict';
  Object.assign(I.D, {
    '🔒 تُشفَّر النسخ إذا عُرّف مفتاح BACKUP_KEY على الخادم. احتفظ بالمفتاح خارج الخادم: بدونه لا تُسترجع النسخ المشفرة.':
      '🔒 Backups are encrypted when the BACKUP_KEY key is set on the server. Keep the key off the server: without it encrypted backups cannot be restored.',
    '🔒 مشفرة': '🔒 Encrypted',
    'غير مشفرة': 'Not encrypted',
    'مفتاح تشفير النسخ BACKUP_KEY أقصر من 16 حرفاً — صحّحه في إعدادات الخادم':
      'The backup encryption key BACKUP_KEY is shorter than 16 characters — fix it in the server settings',
    'النسخة مشفرة ولا يوجد مفتاح BACKUP_KEY على الخادم': 'The backup is encrypted and there is no BACKUP_KEY on the server',
    'تعذر فك تشفير النسخة: المفتاح مختلف أو الملف معدَّل': 'Could not decrypt the backup: the key is different or the file was modified',
    'اختر من يعتمد النموذج: المدير المباشر أو مدير الفرع': 'Choose who approves the form: the direct manager or the branch manager',
    'المدير المباشر للموظف (من ملفه) أو مدير فرعه، ثم شئون الموظفين':
      "The employee's direct manager (from their file) or their branch manager, then Employee affairs",
    'الإدارة العليا': 'Senior management',
    'موظف (خدمة ذاتية)': 'Employee (self-service)',
    '{0} الإجراءات ونطاق الطلبات والخطابات': '{0} Actions, request scope and letters',
    '{0} التطبيقات وما بداخلها': '{0} Apps and what is inside them',
    '{0} الصفحات والإعدادات': '{0} Pages and settings',
    '{0} الصلاحيات': '{0} Permissions',
    '{0}{1} مستخدم': '{0}{1} users',
    'العلامة = يظهر لهذه الفئة. العلامات الأولى حسب نوع الحساب، ويُحفظ ما تغيّره فقط. وما تخصصه لمستخدم بعينه (من صفحته) يتقدم على الفئة. شِل علامة أيقونة لإخفائها بكل ما تحتها.':
      'A tick = shown to this category. The initial ticks follow the account type, and only what you change is saved. What you set for a specific user (from their page) takes precedence over the category. Untick an icon to hide it with everything under it.',
    'الفئة غير موجودة —': 'Category not found —',
    'تم حفظ صلاحيات الفئة': 'Category permissions saved',
    'صلاحيات الفئة': 'Category permissions',
    'كل فئة في كارت وداخله مستخدموها — اضغط عنوان الكارت لصلاحيات الفئة، واسم المستخدم لصفحته (وفيها تخصيص ما يظهر له وحده). عند إنشاء حساب أو إعادة تعيين كلمة المرور يطلب النظام من المستخدم تغييرها عند أول دخول.':
      "Each category is a card with its users inside — click the card title for the category's permissions, and a user's name for their page (where you can customize what that user alone sees). When an account is created or its password reset, the system asks the user to change it at first login.",
    'لا يوجد مستخدمون في هذه الفئة': 'No users in this category',
    'نفس الخطابات المتاحة له': 'The same letters available to it',
    '💾 حفظ صلاحيات الفئة': '💾 Save category permissions',
    الإداريين: 'Administrative staff',
    المحاسبين: 'Accountants',
    'مدير النظام ومشرفي النظام': 'System admin and supervisors',
    'مديرين الإدارات': 'Department managers',
    'مديرين الفروع': 'Branch managers',
    '{0} المستخدمون': '{0} Users',
    '{0} مستخدم{1}': '{0} users{1}',
    '· {0} موقوف': '· {0} suspended',
    'اضغط كارت الفئة لمستخدميها وصلاحياتها، واسم المستخدم لصفحته (وفيها فئته وتخصيص ما يظهر له وحده). عند إنشاء حساب أو إعادة تعيين كلمة المرور يطلب النظام من المستخدم تغييرها عند أول دخول.':
      "Click a category card for its users and permissions, and a user's name for their page (with their category and what that user alone sees). When an account is created or its password reset, the system asks the user to change it at first login.",
    'بدون فئة': 'No category',
    'صلاحيات كل فئة من كارتها في «المستخدمون»': 'Each category\'s permissions are on its card in "Users"',
    'لنقل مستخدم لفئة أخرى افتح صفحته واختر فئته.': 'To move a user to another category, open their page and choose their category.',
    '→ الفئات': '← Categories',
    '{0} عرض الأيقونات وتخصيصها (شاشة كاملة)': '{0} Show and customize icons (full screen)',
    'تخصيص ما يظهر لـ {0}': 'Customize what {0} sees',
    'هذا المستخدم': 'this user',
    'طلبات إدارتك': 'Your department requests',
    'طلبات إدارتي': 'My department requests',
  });
})(((I) => (I.en = I.en || { D: {}, P: [] }))((window.SES_I18N = window.SES_I18N || {})));
