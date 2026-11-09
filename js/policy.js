// سياسة الاستخدام المقبول (عربي / إنجليزي): كل قسم [العنوان، النص HTML]. عند تعديلها يُغيَّر رقم الإصدار وتاريخ النفاذ
// تُحمَّل في المنصة قبل app.js، ويقرؤها الخادم لعرضها في تطبيق الموبايل (/api/policy)
(function (root) {
  const POLICY = {
    ver: '1.1',
    date: '2026-11-04',
    ar: [
      [
        '١. التعريف والغرض',
        '<p>«النظام» هو SADEN ERP SYSTEM لإدارة موارد مجموعة شركات سادن، والمملوك لشركة سادن المتخصصة للاستشارات الجيولوجية وشركات مجموعتها («الشركة»)، بما في ذلك تطبيق الموبايل. تحدد هذه السياسة قواعد استخدامه، وهي جزء مكمّل للائحة تنظيم العمل الداخلية وعقود العمل.</p><p>تهدف السياسة إلى حماية سرية المعلومات وسلامتها وتوافرها، وتقليل مخاطر الاستخدام الخاطئ أو غير المصرح به، والالتزام بالأنظمة واللوائح ذات العلاقة.</p>',
      ],
      [
        '٢. النطاق والقبول',
        '<ul><li>تسري على كل من يُمنح حساباً في النظام: الموظفين، والمتعاقدين، والمتدربين، وأي طرف خارجي يُصرَّح له بالدخول.</li><li>تشمل كل ما في النظام من بيانات ومستندات وخطابات ومرفقات ومراسلات، وأي نسخة منها مطبوعة أو محفوظة خارجه.</li><li>يُشترط الإقرار بالموافقة على هذه السياسة قبل استخدام النظام، ويُعاد الإقرار عند كل تحديث لها. ويُعد الدخول إلى النظام أو استخدامه بعد الإقرار التزاماً بها.</li></ul>',
      ],
      [
        '٣. الحساب وكلمة المرور',
        '<ul><li>الحساب شخصي، ويُمنع استخدام حساب أو كلمة مرور أي مستخدم آخر، بما في ذلك حساب المدير أو المرؤوسين، وكل ما يتم من الحساب يُنسب لصاحبه.</li><li>يُمنع الإفصاح عن كلمة المرور لأي شخص بأي وسيلة (مراسلة، أو اتصال، أو كتابتها على ورق)، بما في ذلك الزملاء وموظفو تقنية المعلومات ومدير النظام.</li><li>يجب تغيير كلمة المرور المؤقتة عند أول دخول وعند تسلّم كلمة مرور جديدة من مدير النظام، واختيار كلمة قوية تختلف عن كلمات مرور الحسابات الشخصية.</li><li>يجب قفل الشاشة أو تسجيل الخروج عند ترك الجهاز ولو لفترة قصيرة، وتسجيل الخروج دائماً من الأجهزة المشتركة.</li><li>يلتزم المستخدم برمز التحقق (OTP) متى كان مفعّلاً، ولا يشارك الرمز مع أحد.</li></ul>',
      ],
      [
        '٤. الصلاحيات والحاجة إلى المعرفة',
        '<ul><li>تُمنح الصلاحيات حسب الدور الوظيفي وبالحد الأدنى اللازم للعمل، ويحددها مدير النظام بناءً على طلب الإدارة المختصة.</li><li>يُمنع محاولة الوصول لصفحات أو بيانات خارج الصلاحية، أو الحصول على صلاحيات أعلى بأي طريقة.</li><li>من لاحظ أن لديه صلاحية أو بيانات لا يحتاجها لعمله يبلّغ مدير النظام فوراً ولا يستخدمها.</li><li>تُراجع الصلاحيات عند النقل أو تغيير الوظيفة، وتُلغى عند انتهاء العلاقة التعاقدية. وحسابات الوظائف (مثل محاسب الفرع) تُسلَّم لمن يخلف صاحبها عن طريق مدير النظام فقط.</li></ul>',
      ],
      [
        '٥. سرية المعلومات وتصنيفها',
        '<ul><li>كل ما في النظام معلومات داخلية، وبعضه سري: الرواتب والمستحقات، والهويات والإقامات، والحسابات البنكية، والتحقيقات والجزاءات، والعقود، وبيانات المرشحين، والتقارير المالية.</li><li>يُطّلع على المعلومات بقدر ما يتطلبه العمل فقط، ولا تُناقش أو تُعرض أمام من لا يحق له الاطلاع.</li><li>يُمنع الإفصاح عن أي معلومات تخص الشركة أو أنظمتها لأي طرف غير مصرح له داخل الشركة أو خارجها، أو نشرها في وسائل الإعلام أو شبكات التواصل الاجتماعي دون تصريح مسبق.</li><li>يجب ألا تُترك المطبوعات على الطابعات المشتركة أو على المكاتب، وأن تبقى الشاشة وسطح المكتب خاليين من المعلومات المصنفة عند المغادرة (المكتب النظيف).</li><li>يستمر الالتزام بالسرية بعد انتهاء العلاقة التعاقدية.</li></ul>',
      ],
      [
        '٦. حماية البيانات الشخصية',
        '<ul><li>تُعالَج البيانات الشخصية للموظفين والمرشحين وغيرهم وفق نظام حماية البيانات الشخصية في المملكة العربية السعودية ولوائحه التنفيذية، ولأغراض العمل والالتزامات النظامية فقط.</li><li>يلتزم المستخدم بجمع البيانات اللازمة فقط، والتحقق من صحتها قبل إدخالها، وعدم استخدامها لغير الغرض الذي جُمعت له، وعدم نقلها خارج النظام أو خارج المملكة إلا وفق الضوابط النظامية.</li><li>للموظف الاطلاع على بياناته وطلب تصحيحها من خلال النظام (طلب تعديل بياناتي) أو عن طريق إدارة الموارد البشرية.</li><li>أي تسرب أو اطلاع غير مصرح به على بيانات شخصية يُبلَّغ عنه فوراً، لتتمكن الشركة من اتخاذ إجراءاتها والإبلاغ للجهات المختصة في المدد النظامية.</li></ul>',
      ],
      [
        '٧. الاستخدام المسموح',
        '<p>يُستخدم النظام لأغراض العمل فقط وفق الصلاحيات الممنوحة: رفع الطلبات واعتمادها، وإدارة الرواتب والموظفين والعمليات، والتواصل الداخلي المتعلق بالعمل، والاطلاع على التقارير.</p>',
      ],
      [
        '٨. الاستخدام الممنوع',
        '<ul><li>إدخال بيانات غير صحيحة أو مضللة، أو رفع مستندات مزورة أو معدّلة، أو انتحال صفة شخص آخر.</li><li>استخدام النظام أو بياناته لمنفعة شخصية أو لأي غرض لا يتعلق بعمل الشركة.</li><li>اعتماد طلب دون مراجعته، أو الاعتماد نيابة عن غيرك دون تفويض صحيح في النظام.</li><li>تجاوز أدوات الحماية، أو إجراء فحص أمني أو اختبار اختراق أو مراقبة للنظام دون تصريح مسبق، أو استغلال أي ثغرة بدلاً من الإبلاغ عنها.</li><li>استخدام برامج أو أدوات آلية لسحب البيانات أو تصديرها بكميات، أو أي نشاط يؤثر على أداء النظام أو توافره.</li><li>تصدير البيانات أو نسخها إلى وسائط تخزين خارجية أو حسابات شخصية أو مواقع مشاركة الملفات دون تصريح.</li><li>حذف بيانات أو سجلات أو تعديلها لإخفاء خطأ أو مخالفة.</li></ul>',
      ],
      [
        '٩. المرفقات والملفات',
        '<ul><li>تُرفع المستندات المتعلقة بالطلب فقط، وبصيغها المسموحة، ومن مصادرها الصحيحة.</li><li>يُمنع رفع ملفات ضارة أو برامج أو ملفات منتهكة لحقوق الملكية الفكرية.</li><li>تُرفع صور الهويات والمستندات الشخصية في مواضعها المخصصة فقط، ولا تُرسل عبر البريد أو الدردشة إلا عند الحاجة.</li></ul>',
      ],
      [
        '١٠. البريد الداخلي والدردشة والتعاميم',
        '<ul><li>تُستخدم لأغراض العمل فقط، ويُمنع تداول أي محتوى مسيء أو غير لائق أو غير متعلق بالعمل.</li><li>يجب الحذر من الرسائل والمرفقات المشبوهة أو غير المتوقعة ولو بدت من مصدر موثوق، والإبلاغ عنها.</li><li>للشركة الاطلاع على المراسلات الداخلية في النظام بعد الحصول على الموافقات اللازمة وفق الإجراءات المعتمدة.</li></ul>',
      ],
      [
        '١١. الاعتماد والتوقيع الإلكتروني',
        '<ul><li>الاعتماد من خلال النظام والتوقيع الإلكتروني المرفوع في «حسابي» لهما حجية التوقيع والاعتماد الورقي داخل الشركة، وفق نظام التعاملات الإلكترونية في المملكة.</li><li>المعتمد مسؤول عن مراجعة الطلب ومرفقاته قبل الاعتماد، والتفويض لا يُعفي صاحبه من المسؤولية عن اختيار المفوَّض ومدته.</li><li>كل خطاب معتمد يحمل رمز تحقق (QR)، ولا يُعتد بخطاب لا يمكن التحقق منه.</li></ul>',
      ],
      [
        '١٢. الأجهزة وتطبيق الموبايل',
        '<ul><li>يُستخدم النظام من أجهزة آمنة ومحدّثة وبمتصفح موثوق، ويُتجنب استخدامه من أجهزة عامة.</li><li>تطبيق الموبايل يُربط بجوال واحد، ويُبلَّغ مدير النظام فوراً عند فقد الجوال أو تغييره ليُلغى الربط.</li><li>يُستخدم الموقع الجغرافي عند البصمة فقط للتحقق من التواجد داخل نطاق الفرع، ويُمنع التلاعب بالموقع أو البصمة أو استخدام أدوات لتزييفها.</li></ul>',
      ],
      [
        '١٣. السجلات والمراقبة والاحتفاظ',
        '<ul><li>يسجل النظام الدخول والأنشطة والاعتمادات والتعديلات والحذف مع الوقت والجهاز.</li><li>تحتفظ الشركة بنسخ احتياطية وأرشيف للطلبات المنتهية ومستنداتها، وتُحفظ البيانات المدد التي تتطلبها الأنظمة وأغراض العمل.</li><li>للشركة مراقبة النظام والحسابات ومراجعة السجلات دورياً للتأكد من الالتزام بهذه السياسة، ولأغراض التدقيق والتحقيق. ولا يُعد ما يتم على النظام خاصاً.</li></ul>',
      ],
      [
        '١٤. الإبلاغ عن الحوادث',
        '<ul><li>يُبلَّغ مدير النظام فوراً عن: الاشتباه في اختراق حساب، أو فقد أو سرقة أو تسرب معلومات، أو فقد جهاز مربوط، أو رسالة مشبوهة، أو خطأ في البيانات أو الصلاحيات، أو أي خلل تقني.</li><li>طريقة الإبلاغ: زر «🛠 طلب مساعدة تقنية» في دردشة سند، أو التواصل المباشر مع مدير النظام.</li><li>لا يحاول المستخدم التحقق من الحادثة أو إصلاحها بنفسه، ولا يحذف أي دليل عليها.</li></ul>',
      ],
      [
        '١٥. انتهاء العلاقة أو النقل',
        '<p>عند انتهاء العلاقة التعاقدية أو النقل أو تغيير الوظيفة يُوقف الحساب أو تُعدَّل صلاحياته، ولا يجوز الاحتفاظ بأي بيانات أو نسخ منها، ويستمر الالتزام بالسرية.</p>',
      ],
      ['١٦. الملكية الفكرية', '<p>النظام ومحتواه ونماذجه وبياناته ملك للشركة، ولا يجوز نسخها أو إعادة استخدامها خارج العمل.</p>'],
      [
        '١٧. الأدوار والمسؤوليات',
        '<ul><li><b>مالك السياسة:</b> الإدارة العليا للشركة.</li><li><b>مراجعتها وتحديثها:</b> مدير النظام بالتنسيق مع الشئون القانونية.</li><li><b>تطبيقها:</b> إدارة الموارد البشرية ومدير النظام والمديرون المباشرون، كلٌ في نطاقه.</li><li><b>الالتزام بها:</b> جميع المستخدمين.</li></ul>',
      ],
      [
        '١٨. المخالفات',
        '<p>مخالفة هذه السياسة تُعرّض صاحبها لإيقاف الحساب، وللإجراء التأديبي وفق لائحة تنظيم العمل ونظام العمل، وللمساءلة النظامية وفق نظام مكافحة الجرائم المعلوماتية والأنظمة ذات العلاقة.</p>',
      ],
      [
        '١٩. المراجعة والتعديل',
        '<p>تُراجع السياسة سنوياً على الأقل، أو عند تغيّر الأنظمة أو النظام. ويُعمل بأي تعديل من تاريخ نشره، ويُطلب من المستخدمين الإقرار بالموافقة على النسخة المعدّلة.</p>',
      ],
      [
        '٢٠. المرجعية',
        '<p>نظام حماية البيانات الشخصية ولوائحه التنفيذية، ونظام التعاملات الإلكترونية، ونظام مكافحة الجرائم المعلوماتية، ونظام العمل، واللائحة الداخلية لتنظيم العمل بالشركة. وأُعدّت بما يتوافق مع نموذج سياسة الاستخدام المقبول للأصول الصادر عن الهيئة الوطنية للأمن السيبراني.</p>',
      ],
    ],
    en: [
      [
        '1. Definition and purpose',
        '<p>The "System" is SADEN ERP SYSTEM for managing the resources of the Saden group of companies, owned by Saden Specialized Co. for Geological Consulting and its group companies (the "Company"), including the mobile app. This policy sets the rules for its use and supplements the internal work regulations and employment contracts.</p><p>It aims to protect the confidentiality, integrity and availability of information, reduce the risk of misuse or unauthorized use, and comply with the applicable laws and regulations.</p>',
      ],
      [
        '2. Scope and acceptance',
        '<ul><li>It applies to everyone given an account: employees, contractors, trainees and any authorized third party.</li><li>It covers all data, documents, letters, attachments and messages in the System, and any printed or stored copy of them outside it.</li><li>Acknowledging this policy is required before using the System and again after every update. Logging in to or using the System after acknowledgment constitutes a commitment to it.</li></ul>',
      ],
      [
        '3. Account and password',
        "<ul><li>Accounts are personal. Using another user's account or password — including a manager's or subordinate's — is prohibited, and everything done from an account is attributed to its holder.</li><li>Never disclose your password to anyone by any means (message, call or writing it on paper), including colleagues, IT staff and the administrator.</li><li>Change the temporary password at first login and whenever the administrator issues a new one, and choose a strong password different from your personal accounts.</li><li>Lock the screen or log out whenever you leave the device, even briefly, and always log out of shared devices.</li><li>Use the verification code (OTP) whenever it is enabled and never share it.</li></ul>",
      ],
      [
        '4. Permissions and need-to-know',
        '<ul><li>Permissions are granted by job role with the minimum needed for work, set by the administrator at the request of the competent department.</li><li>Attempting to access pages or data beyond your permissions, or to obtain higher privileges by any means, is prohibited.</li><li>If you notice you have a permission or data you do not need, report it to the administrator immediately and do not use it.</li><li>Permissions are reviewed on transfer or change of job and revoked when employment ends. Job accounts (e.g. branch accountant) are handed over to the successor only through the administrator.</li></ul>',
      ],
      [
        '5. Confidentiality and classification',
        '<ul><li>Everything in the System is internal information, and some of it is confidential: salaries and entitlements, IDs and Iqamas, bank accounts, investigations and penalties, contracts, candidate data and financial reports.</li><li>Access information only as work requires, and do not discuss or display it to anyone not entitled to it.</li><li>Disclosing any information about the Company or its systems to any unauthorized party inside or outside the Company, or publishing it in the media or social networks without prior authorization, is prohibited.</li><li>Do not leave printouts on shared printers or desks, and keep your screen and desk clear of classified information when you leave (clean desk).</li><li>The confidentiality obligation continues after the employment relationship ends.</li></ul>',
      ],
      [
        '6. Personal data protection',
        '<ul><li>Personal data of employees, candidates and others is processed in accordance with the Personal Data Protection Law of the Kingdom of Saudi Arabia and its implementing regulations, for work and legal obligations only.</li><li>Users collect only the necessary data, verify its accuracy before entry, do not use it for any purpose other than the one it was collected for, and do not transfer it outside the System or the Kingdom except as the law permits.</li><li>Employees may view their data and request corrections through the System (data update request) or via HR.</li><li>Any leak of, or unauthorized access to, personal data must be reported immediately so the Company can act and notify the competent authorities within the legal time limits.</li></ul>',
      ],
      [
        '7. Permitted use',
        '<p>The System is for work purposes only, within the granted permissions: submitting and approving requests, managing payroll, employees and operations, work-related internal communication and viewing reports.</p>',
      ],
      [
        '8. Prohibited use',
        "<ul><li>Entering false or misleading data, uploading forged or altered documents, or impersonating another person.</li><li>Using the System or its data for personal benefit or any purpose unrelated to the Company's work.</li><li>Approving a request without reviewing it, or approving on someone's behalf without a valid delegation in the System.</li><li>Bypassing security controls, running security scans, penetration tests or monitoring of the System without prior authorization, or exploiting any vulnerability instead of reporting it.</li><li>Using software or automated tools to scrape or bulk-export data, or any activity that affects the System's performance or availability.</li><li>Exporting or copying data to external storage, personal accounts or file-sharing sites without authorization.</li><li>Deleting or altering data or records to hide an error or violation.</li></ul>",
      ],
      [
        '9. Attachments and files',
        '<ul><li>Upload only documents related to the request, in permitted formats and from their proper sources.</li><li>Uploading malicious files, software or files that infringe intellectual property is prohibited.</li><li>Upload ID copies and personal documents only in their designated places, and send them by mail or chat only when necessary.</li></ul>',
      ],
      [
        '10. Internal mail, chat and announcements',
        '<ul><li>They are for work purposes only; offensive, inappropriate or non-work content is prohibited.</li><li>Be careful with suspicious or unexpected messages and attachments, even if they seem to come from a trusted source, and report them.</li><li>The Company may review internal communications in the System after obtaining the necessary approvals under the approved procedures.</li></ul>',
      ],
      [
        '11. Approvals and e-signatures',
        '<ul><li>Approvals through the System and the e-signature uploaded in "My account" have the same effect within the Company as paper approvals and signatures, in accordance with the Electronic Transactions Law of the Kingdom.</li><li>Approvers are responsible for reviewing the request and its attachments before approving; delegation does not relieve the delegator of responsibility for choosing the delegate and the period.</li><li>Every approved letter carries a verification QR code; a letter that cannot be verified is not valid.</li></ul>',
      ],
      [
        '12. Devices and mobile app',
        '<ul><li>Use the System from secure, up-to-date devices with a trusted browser, and avoid public computers.</li><li>The mobile app is linked to one phone; report a lost or replaced phone to the administrator immediately so the link is removed.</li><li>Location is used at check-in only to verify presence within the branch area; manipulating location or attendance, or using tools to fake them, is prohibited.</li></ul>',
      ],
      [
        '13. Logs, monitoring and retention',
        '<ul><li>The System logs logins, activities, approvals, edits and deletions with time and device.</li><li>The Company keeps backups and an archive of finished requests and their documents, and retains data for the periods required by law and business needs.</li><li>The Company may monitor the System and accounts and review logs periodically to ensure compliance with this policy and for audit and investigation purposes. Activity on the System is not private.</li></ul>',
      ],
      [
        '14. Incident reporting',
        '<ul><li>Report to the administrator immediately: suspected account compromise, loss, theft or leak of information, loss of a linked device, a suspicious message, an error in data or permissions, or any technical fault.</li><li>How to report: the "🛠 Technical support request" button in Sanad\'s chat, or contact the administrator directly.</li><li>Do not try to investigate or fix the incident yourself, and do not delete any evidence of it.</li></ul>',
      ],
      [
        '15. End of employment or transfer',
        '<p>When employment ends or on transfer or change of job, the account is suspended or its permissions changed; no data or copies of it may be retained, and the confidentiality obligation continues.</p>',
      ],
      [
        '16. Intellectual property',
        '<p>The System, its content, forms and data are the property of the Company and may not be copied or reused outside work.</p>',
      ],
      [
        '17. Roles and responsibilities',
        "<ul><li><b>Policy owner:</b> the Company's senior management.</li><li><b>Review and update:</b> the administrator in coordination with legal affairs.</li><li><b>Enforcement:</b> HR, the administrator and direct managers, each within their scope.</li><li><b>Compliance:</b> all users.</li></ul>",
      ],
      [
        '18. Violations',
        '<p>Violating this policy may lead to account suspension, disciplinary action under the work regulations and the Labor Law, and legal liability under the Anti-Cyber Crime Law and related regulations.</p>',
      ],
      [
        '19. Review and amendment',
        '<p>The policy is reviewed at least annually, or when laws or the System change. Amendments take effect from their publication date, and users are asked to acknowledge the amended version.</p>',
      ],
      [
        '20. References',
        "<p>The Personal Data Protection Law and its implementing regulations, the Electronic Transactions Law, the Anti-Cyber Crime Law, the Labor Law, and the Company's internal work regulations. Prepared in line with the National Cybersecurity Authority's acceptable use of assets policy template.</p>",
      ],
    ],
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = POLICY;
  else root.POLICY = POLICY;
})(typeof window !== 'undefined' ? window : this);
