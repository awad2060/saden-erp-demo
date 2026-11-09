/* الهيكل العام: عناصر القائمة الجانبية ومسار التنقل */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, $$, state, allLabel, can, icon, ionize, calDayIcon } = S;
  Object.assign(S, { navItems, viewSoon, setCrumb, crumbRelabel, navCrumb });

  /* ---------- الهيكل العام ---------- */
  /* ظهور الأيقونات وما تحتها: مفتاح كل عنصر nav:<الرابط أو اسم القسم>، ومدير النظام يخفيه للمسمى أو للمستخدم */
  /* قوائم الطلبات المفلترة بنوعها مفتاحها واحد سواء فُتحت من «جميع الطلبات» أو «طلباتي» */
  const navKey = (it) => `nav:${(Array.isArray(it) ? it[0] : it.group).replace(/^#\/(all|mine)\?/, '#/req?')}`;
  const NAV_FIXED = ['#/apps', '#/account'];
  const navPrune = (list) =>
    list
      .map((it) => {
        if (Array.isArray(it)) return NAV_FIXED.includes(it[0]) || can(navKey(it)) ? it : null;
        if (!can(navKey(it))) return null;
        const items = navPrune(it.items);
        return items.length ? { ...it, items } : null;
      })
      .filter(Boolean);
  function navItems() {
    let list = navItemsAll();
    state.empAffairs = (state.empAffairs || []).filter((it) => can(navKey(it)));
    /* «شئون الموظفين» تختفي إذا أُخفي كل ما بداخلها */
    if (!state.empAffairs.length) {
      const drop = (l) =>
        l
          .filter((it) => !Array.isArray(it) || it[0] !== '#/emp-affairs')
          .map((it) => (Array.isArray(it) ? it : { ...it, items: drop(it.items) }));
      list = drop(list);
    }
    return navPrune(list);
  }
  /* شجرة كل الأيقونات وما تحتها (من حساب مدير النظام) لصفحات الصلاحيات */
  function navCatalog() {
    const list = navItemsAll().filter((it) => !NAV_FIXED.includes(Array.isArray(it) ? it[0] : ''));
    const aff = (state.empAffairs || []).slice();
    const withAff = (l) =>
      l.map((it) =>
        Array.isArray(it)
          ? it[0] === '#/emp-affairs' && aff.length
            ? { group: '#/emp-affairs', ic: it[1], title: it[2], items: aff, link: true }
            : it
          : { ...it, items: withAff(it.items) },
      );
    const out = withAff(list);
    if (!out.some((it) => !Array.isArray(it) && it.group === 'me'))
      out.push({
        group: 'me',
        ic: icon('idCard'),
        title: 'خدماتي',
        items: [
          ['#/me', icon('idCard'), 'ملفي الوظيفي'],
          ['#/punch', icon('mapPin'), 'بصمتي'],
          ['#/my-overtime', icon('zap'), 'عملي الإضافي'],
        ],
      });
    navItems();
    return out;
  }
  /* عرض الشجرة: row(key, label, iconHtml, depth, isGroup) */
  const navTree = (row, list = navCatalog(), depth = 0) =>
    list
      .map((it) =>
        Array.isArray(it)
          ? row(navKey(it), it[2], it[1], depth, false)
          : `<div class="nt-g">${row(it.link ? `nav:${it.group}` : navKey(it), it.title, it.ic, depth, true)}<div class="nt-kids">${navTree(row, it.items, depth + 1)}</div></div>`,
      )
      .join('');
  /* عند إخفاء قسم تُعتم ما تحته (لا يظهر شيء منه مهما كانت علاماته) */
  const navTreeWire = (box, isOn) => {
    const sync = () => $$('.nt-g', box).forEach((g) => g.classList.toggle('nt-off', !isOn($('.nt-r', g))));
    box.addEventListener('change', sync);
    sync();
  };
  function navItemsAll() {
    const u = state.user,
      s = state.stats || {};
    const items = [['#/apps', icon('grid'), 'التطبيقات']];
    if (can('dashboard')) items.push(['#/dashboard', icon('gauge'), 'لوحة المؤشرات']);
    if (can('home')) items.push(['#/', icon('home'), 'الرئيسية']);
    /* التواصل (قائمة منسدلة): البريد الداخلي، التواصل السريع، التعاميم، الإشعارات */
    const comm = [];
    if (can('mail')) comm.push(['#/mail', icon('mail'), 'البريد الداخلي', s.mailUnread || 0]);
    if (can('chat')) comm.push(['#/chat', icon('message'), 'التواصل السريع (الدردشة)', s.chatUnread || 0]);
    if (can('notices')) comm.push(['#/notices', icon('megaphone'), 'التعاميم', s.noticesUnread || 0]);
    comm.push(['#/notifications', icon('bell'), 'الإشعارات', s.notif || 0]);
    items.push({ group: 'comm', ic: icon('message'), title: 'التواصل', items: comm });
    if (can('tasks')) items.push(['#/tasks', icon('checkCircle'), 'إدارة المهام', (s.tasksOpen || 0) + (s.tasksReview || 0)]);
    /* مركز الطلبات: كل ما يخص الطلبات في أيقونة واحدة */
    const reqs = [];
    if (can('new')) reqs.push(['#/new', icon('plus'), 'رفع طلب جديد']);
    if (can('mine')) reqs.push(['#/mine', icon('file'), 'طلباتي', (s.myReturned || 0) + (s.myClearance || 0)]);
    if (can('inbox'))
      reqs.push([
        '#/inbox',
        icon('inbox'),
        SF.cap(u, 'actAny') ? 'الطلبات الجارية' : u.role === 'accountant' ? 'بانتظار إجرائي' : 'بانتظار اعتمادي',
        s.inbox,
      ]);
    if (can('register')) reqs.push(['#/register', icon('clipboard'), 'سجل الخطابات']);
    if (can('all')) reqs.push(['#/all', icon('list'), allLabel(u)]);
    if (can('tools')) reqs.push(['#/tools', icon('calc'), 'النماذج والأدوات']);
    if (reqs.length) items.push({ group: 'requests', ic: icon('inbox'), title: 'مركز الطلبات', items: reqs });
    /* إدارة العمليات: أقسام فرعية (إدارة الحركة: عناصرها في pages/fleet-kit.js) */
    const traffic = window.SES_FLEET.navItems(S);
    const ops = [];
    if (traffic.length) ops.push({ group: 'traffic', ic: icon('car'), title: 'إدارة الحركة', items: traffic });
    /* الورشة (قائمة منسدلة): المخزون والتصنيع والخردة، وطلبات الصيانة والتصنيع والشراء وعروض الأسعار (قوائم الطلبات مفلترة بنوعها) */
    const wsItems = [];
    if (can('workshop')) wsItems.push(['#/workshop', icon('boxes'), 'المخزون والتصنيع والخردة']);
    const reqBase = can('all') ? '#/all' : can('mine') ? '#/mine' : '';
    if (reqBase)
      [
        ['carMaintenance', 'wrench', 'طلبات الصيانة'],
        ['mfgRequest', 'building', 'طلبات التصنيع / الشراء'],
        ['priceQuote', 'calc', 'عروض الأسعار'],
      ]
        .filter(([id]) => SF.byId[id] && (can('workshop') || can('all') || SF.formAllowed(u, id)))
        .forEach(([id, ic, l]) => wsItems.push([`${reqBase}?type=${id}`, icon(ic), l]));
    if (wsItems.length) ops.push({ group: 'workshop', ic: icon('wrench'), title: 'الورشة', items: wsItems });
    /* قسم الحفر (قائمة منسدلة): أسطول الحفارات، ومشاريع تحت التنفيذ */
    if (!can('drilling') && u.drillPartner)
      ops.push({
        group: 'drilling',
        ic: icon('pickaxe'),
        title: 'قسم الحفر',
        items: [['#/drilling-projects?type=shared', icon('handshake'), 'مشاريع مشتركة']],
      });
    if (can('drilling'))
      ops.push({
        group: 'drilling',
        ic: icon('pickaxe'),
        title: 'قسم الحفر',
        items: [
          ['#/drilling', icon('truck'), 'أسطول الحفارات'],
          ['#/drilling-projects', icon('layers'), 'المشروعات'],
        ],
      });
    /* إدارة الجرد (قائمة منسدلة): جرد الفروع، والأجهزة النوعية (ملك الإدارة وتُعار للفروع)، ومحذوفات الجرد لفريق الجرد ومدير النظام */
    /* إدارة الجرد: عناصرها في pages/inventory-kit.js (ومنها مركز نماذج الجرد) */
    const invItems = window.SES_INV.navItems(S);
    if (invItems.length) ops.push({ group: 'inventory', ic: icon('clipboard'), title: 'إدارة الجرد', items: invItems });
    /* الموارد البشرية (فوق إدارة العمليات): طلبات التوظيف وقرارات النقل وملفات التصفية، كل منها قائمة طلبات مفلترة بنوعها */
    const listBase = can('all') ? '#/all' : can('mine') ? '#/mine' : '';
    const hr = !listBase
      ? []
      : [
          ['hiring', 'briefcase', 'التوظيف'],
          ['empTransfer', 'forward', 'قرارات النقل'],
          ['workStart', 'checkCircle', 'مباشرات العمل'],
          ['settlementCase', 'idCard', 'تصفية الموظفين'],
        ]
          .filter(
            ([id]) =>
              SF.byId[id] && (can('all') || SF.formAllowed(u, id) || (id === 'workStart' && (u.flowRoles || []).includes('wsView'))),
          )
          .map(([id, ic, t]) => [`${listBase}?type=${id}`, icon(ic), t]);
    if (can('employees'))
      hr.unshift(['#/employees', icon('users'), 'سجل الموظفين'], ['#/employees-ended', icon('xCircle'), 'المنتهية خدماتهم']);
    const pay = []; /* الرواتب: كل ما يخص الرواتب في أيقونة واحدة (ومبالغ رواتب الشهر للإدارة العليا) */
    if (SF.cap(u, 'payroll') || SF.cap(u, 'approvePayroll')) pay.push(['#/payroll', icon('receiptRiyal'), 'مسيرات الرواتب']);
    if (u.role === 'admin' || SF.cap(u, 'payroll') || SF.cap(u, 'execDash'))
      pay.push(['#/pay-totals', icon('wallet'), 'مبالغ رواتب الشهر']);
    if (
      SF.cap(u, 'payroll') ||
      SF.cap(u, 'approvePayroll') ||
      (u.flowRoles || []).includes('empMgr') ||
      u.role === 'admin' ||
      (u.role === 'accountant' && u.branch)
    )
      pay.push(['#/advances', icon('calc'), 'السلف']);
    if (u.branchManager || u.role === 'admin' || (u.flowRoles || []).includes('empMgr'))
      pay.push(['#/ot-approvals', icon('checkCircle'), 'اعتماد العمل الإضافي']);
    if (
      u.role === 'admin' ||
      SF.cap(u, 'payroll') ||
      SF.cap(u, 'approvePayroll') ||
      (u.role === 'accountant' && u.branch) ||
      (state.config.bpFlow || []).includes(u.id)
    )
      pay.push(['#/branch-pay', icon('clipboard'), 'بيانات رواتب الفروع']);
    if (
      u.role === 'admin' ||
      SF.cap(u, 'payroll') ||
      SF.cap(u, 'approvePayroll') ||
      (state.config.bpFlow || []).includes(u.id) ||
      (state.config.bpFinance || []).includes(u.id)
    )
      pay.push(['#/pay-funding', icon('wallet'), 'تحويلات الرواتب']);
    if (u.role === 'admin' || SF.cap(u, 'payroll') || SF.cap(u, 'approvePayroll') || SF.cap(u, 'docs'))
      pay.push(['#/mudad-pay', icon('fileText'), 'تقارير رواتب مدد']);
    /* مدد وحماية الأجور: اشتراك مدد ونسبة الالتزام وشهادة الالتزام بحماية الأجور لكل شركة */
    if (u.role === 'admin' || SF.cap(u, 'payroll') || SF.cap(u, 'approvePayroll') || SF.cap(u, 'docs'))
      pay.push(['#/wps', icon('checkCircle'), 'مدد وحماية الأجور']);
    if (SF.cap(u, 'payroll') || SF.cap(u, 'approvePayroll') || can('employees'))
      pay.push(['#/gosi', icon('checkCircle'), 'التأمينات الاجتماعية']);
    if (SF.cap(u, 'payroll') || SF.cap(u, 'approvePayroll') || can('employees')) {
      hr.push(['#/attendance', icon('calendar'), 'الدوام والحضور']);
      hr.push(['#/gosi', icon('checkCircle'), 'التأمينات الاجتماعية']);
    }
    if (can('employees')) {
      hr.push(['#/contracts', icon('filePen'), 'العقود']);
      hr.push(['#/org', icon('layers'), 'الوظائف والدرجات ومراكز التكلفة']);
    }
    /* متابعة الإقامات: شئون الموظفين ومدير النظام لكل الفروع، ومحاسب الفرع لموظفي فرعه */
    if (
      can('employees') &&
      (u.role === 'admin' || (u.role === 'accountant' && !!u.branch) || ['empMgr', 'transHr'].some((k) => (u.flowRoles || []).includes(k)))
    )
      hr.splice(1, 0, ['#/iqamas', icon('idCard'), 'متابعة الإقامات']);
    /* شئون الموظفين: صفحة كروت تجمع متابعة الإقامات والمنتهية خدماتهم والتوظيف وقرارات النقل ومباشرات العمل والعقود (بدل ظهورها في القائمة) */
    const AFF = [
      '#/iqamas',
      '#/employees-ended',
      '?type=hiring',
      '?type=empTransfer',
      '?type=workStart',
      '#/contracts',
      '#/attendance',
      '#/gosi',
      '#/org',
    ];
    const affOf = (h) => AFF.findIndex((x) => (x.startsWith('?') ? h.endsWith(x) : h === x));
    state.empAffairs = hr.filter(([h]) => affOf(h) >= 0).sort((a, b) => affOf(a[0]) - affOf(b[0]));
    if (state.empAffairs.length) {
      for (let i = hr.length - 1; i >= 0; i--) if (affOf(hr[i][0]) >= 0) hr.splice(i, 1);
      const at = hr.findIndex(([h]) => h === '#/employees');
      hr.splice(at + 1, 0, ['#/emp-affairs', icon('folderOpen'), 'شئون الموظفين']);
    }
    /* الشئون القانونية: القضايا الخارجية والتحقيقات */
    if (u.role === 'admin' || SF.cap(u, 'legal') || (u.flowRoles || []).some((k) => ['legal', 'legalMgr'].includes(k))) {
      const lg = [
        ['#/legal-cases', icon('book'), 'القضايا الخارجية'],
        ['#/investigations', icon('clipboard'), 'التحقيقات والأحكام'],
      ];
      if (listBase) lg.push([`${listBase}?type=legalDeduction`, icon('fileText'), 'قرارات الخصم']);
      /* صندوق الشكاوى: الشكاوى المرفوعة من الموظفين (سرية)، وتظلماتهم من قرارات الخصم */
      if (listBase)
        lg.push(
          [`${listBase}?type=legalComplaint`, icon('inbox'), 'صندوق الشكاوى'],
          [`${listBase}?type=deductionAppeal`, icon('scale'), 'التظلمات'],
        );
      items.push({ group: 'legal', ic: icon('book'), title: 'الشئون القانونية', items: lg });
    }
    if (u.role === 'admin' || SF.cap(u, 'docs') || (u.branch && (u.role === 'accountant' || u.branchManager)))
      items.push(['#/docs', icon('folderOpen'), 'وثائق ومستندات']);
    items.push(['#/reports', icon('fileChart'), 'التقارير']);
    items.push(
      ['#/todo', icon('listChecks'), 'TO-DO', s.todoDue || 0],
      ['#/notes', icon('filePen'), 'STICKY NOTES'],
      ['#/calendar', calDayIcon(), 'Calendar'],
      ['#/contacts', icon('contactCard'), 'CONTACTS'],
    );
    if (SF.cap(u, 'crm') || (SF.cap(u, 'crmBranch') && u.branch)) items.push(['#/crm', icon('handshake'), 'CRM']);
    if (hr.length) items.push({ group: 'hr', ic: icon('users'), title: 'الموارد البشرية', items: hr });
    if (pay.length) items.push({ group: 'payroll', ic: icon('receiptRiyal'), title: 'الرواتب', items: pay });
    /* الجودة: لمدير النظام وصاحب صلاحية «إدارة الجودة» */
    if (u.role === 'admin' || SF.cap(u, 'kpiManage'))
      items.push({ group: 'quality', ic: icon('award'), title: 'الجودة', items: [['#/kpi', icon('chart'), 'مؤشرات الأداء (KPIs)']] });
    if (ops.length) items.push({ group: 'ops', ic: icon('layers'), title: 'إدارة العمليات', items: ops });
    if (can('fuel')) items.push(['#/fuel', icon('fuelPump'), 'المحروقات']);
    if (can('facilities')) items.push(['#/facilities', icon('building'), 'المنشآت']);
    if (can('branchMap')) items.push(['#/branch-map', icon('mapPin'), 'خريطة الفروع']);
    if (can('stock')) items.push(['#/stock', icon('warehouse'), 'المخزون']);
    if (can('analysis')) items.push(['#/analysis', icon('chart'), 'أدوات تحليل']);
    if (can('hse')) items.push(['#/hse', icon('shield'), 'السلامة والصحة المهنية']);
    if (can('governance')) items.push(['#/governance', icon('scale'), 'الحوكمة والامتثال']);
    if (can('knowledge')) items.push(['#/knowledge', icon('bookOpen'), 'مكتبة المهن']);
    if (can('training')) items.push(['#/training', icon('fileAward'), 'مركز التدريب']);
    if (SF.settingsTabs(u).some((t) => t !== 'trash')) items.push(['#/settings', icon('settings'), 'الإعدادات']);
    if (can('settings.trash')) items.push(['#/trash', icon('binRestore'), 'سلة المحذوفات']);
    if (u.role === 'admin') items.push(['#/access-requests', icon('key'), 'طلبات الحسابات', s.accessReq || 0]);
    if (u.opsOnly) {
      const inboxIt = flatItems(items).find((it) => it[0] === '#/inbox');
      const keep = [...(inboxIt ? [inboxIt] : []), ...items.filter((it) => !Array.isArray(it) && it.group === 'ops')];
      /* قوائم طلبات إدارة العمليات (الحركة والجرد) ضمن أقسامها */
      const base = can('all') ? '#/all' : can('mine') ? '#/mine' : '';
      const opsG = keep.find((it) => !Array.isArray(it) && it.group === 'ops');
      if (opsG && base) {
        const add = (g, list) => {
          const sec = opsG.items.find((x) => x.group === g);
          if (sec)
            list
              .filter(([id]) => SF.byId[id])
              .forEach(([id, ic, l]) => {
                if (!sec.items.some((x) => x[0] === `${base}?type=${id}`)) sec.items.push([`${base}?type=${id}`, icon(ic), l]);
              });
        };
        add('traffic', [['vehicleHandover', 'car', 'محاضر تسليم المركبات']]);
        add('inventory', [
          ['deviceLoan', 'monitor', 'طلبات استعارة الأجهزة'],
          ['deviceMaint', 'wrench', 'طلبات صيانة الأجهزة'],
        ]);
        add('workshop', [
          ['stockIssue', 'boxes', 'أذونات الصرف'],
          ['scrapSale', 'receipt', 'أذونات بيع الخردة'],
          ['scrapSupply', 'boxes', 'توريد الخردة'],
        ]);
      }
      return keep;
    }
    if (u.empLinked)
      items.push({
        group: 'me',
        ic: icon('idCard'),
        title: 'خدماتي',
        items: [
          ['#/me', icon('idCard'), 'ملفي الوظيفي'],
          ['#/punch', icon('mapPin'), 'بصمتي'],
          ['#/my-overtime', icon('zap'), 'عملي الإضافي'],
        ],
      });
    items.push(['#/decision-center', icon('clipboardCheck'), 'مركز القرارات']);
    items.push(['#/about', icon('companyHq'), 'حول الشركة']);
    items.push(['#/mobile-app', icon('smartphone'), 'تطبيق الموبايل']);
    if (can('guide')) items.push(['#/guide', icon('guide'), 'دليل الاستخدام']);
    items.push(['#/account', icon('user'), 'حسابي']);
    /* تطبيقات قيد الإنشاء (تُبنى تباعاً) */
    if (u.role === 'admin') items.push(['#/finance', icon('wallet'), 'الإدارة المالية']);
    if (can('supervision')) items.push(['#/supervision', icon('clipboardCheck'), 'المتابعة والإشراف']);
    if (u.role === 'admin')
      items.push(
        ['#/marketing', icon('target'), 'التسويق'],
        ['#/tenders', icon('fileAward'), 'المناقصات'],
        ['#/projects', icon('gantt'), 'إدارة المشاريع'],
        ['#/procurement', icon('cart'), 'المشتريات'],
      );
    /* ترتيب صفحة التطبيقات والقائمة: الصف الأول ثم الثاني ثم الثالث (وما لم يُذكر يأتي بعدها بترتيبه) */
    /* 4 صفوف (8 أيقونات لكل صف): الإدارات الرئيسية، ثم الأعمال والإدارات، ثم أدوات العمل اليومي، ثم الحساب والنظام */
    const ORDER = [
      '#/apps',
      '#/dashboard',
      '#/',
      'comm',
      'hr',
      'payroll',
      '#/finance',
      '#/supervision',
      'ops',
      '#/marketing',
      '#/crm',
      '#/tenders',
      '#/projects',
      '#/procurement',
      'quality',
      'legal',
      '#/docs',
      'requests',
      '#/tasks',
      '#/calendar',
      '#/contacts',
      '#/todo',
      '#/notes',
      '#/reports',
      '#/trash',
      '#/settings',
      '#/access-requests',
      '#/decision-center',
      '#/about',
      '#/mobile-app',
      '#/account',
      'me',
    ];
    const keyOf = (it) => (Array.isArray(it) ? it[0] : it.group);
    const pos = (it) => {
      const i = ORDER.indexOf(keyOf(it));
      return i < 0 ? ORDER.length : i;
    };
    return ionize(
      items
        .map((it, i) => [it, i])
        .sort((x, y) => pos(x[0]) - pos(y[0]) || x[1] - y[1])
        .map(([it]) => it),
    );
  }
  /* صفحة تطبيق قيد الإنشاء */
  const SOON = {
    finance: ['الإدارة المالية', 'wallet', 'الميزانيات والمصروفات والمدفوعات والتقارير المالية لكل فرع'],
    supervision: ['المتابعة والإشراف', 'clipboardCheck', 'متابعة الفروع والزيارات الميدانية وتقارير الإشراف'],
    marketing: ['التسويق', 'target', 'الحملات والعروض والفرص البيعية وربطها بـ CRM'],
    tenders: ['المناقصات', 'fileAward', 'متابعة المناقصات والمنافسات وكراسات الشروط والعروض الفنية والمالية ونتائج الترسية'],
    projects: ['إدارة المشاريع', 'gantt', 'المشاريع ومراحلها وجداولها الزمنية وفرق العمل والتكاليف ونسب الإنجاز'],
    procurement: ['المشتريات', 'cart', 'طلبات الشراء وعروض الموردين وأوامر الشراء والاستلام'],
  };
  function viewSoon(k) {
    const [t, ic, desc] = SOON[k];
    S.shell(
      `${S.head(esc(t), esc(desc))}<div class="card soon-card"><span class="soon-ic">${icon(ic)}</span><h2>قيد الإنشاء</h2><p class="muted">هذا التطبيق جديد وسيُبنى خطوة بخطوة. شاركنا ما تحتاجه فيه ليُضاف أولاً.</p><a class="btn" href="#/apps">→ رجوع للتطبيقات</a></div>`,
      `#/${k}`,
    );
  }
  /* عناصر القائمة بدون الأقسام (للبحث عن صفحة أو أول صفحة متاحة) */
  const flatItems = (list) => list.flatMap((it) => (Array.isArray(it) ? [it] : flatItems(it.items)));
  const navFlat = () => flatItems(navItems());
  /* صفحات شئون الموظفين التابعة تُبرز «شئون الموظفين» في القائمة */
  const affActive = (active) =>
    (state.empAffairs || []).some(
      ([h]) => h === active || location.hash === h || (h.includes('?type=') && location.hash.endsWith(h.slice(h.indexOf('?')))),
    )
      ? '#/emp-affairs'
      : active;
  const navLink = ([h, ic, t, b], active, sub) =>
    `<a href="${h}"${h === '#/notes' ? ' data-snnav title="الملاحظات اللاصقة"' : ''} class="${h === affActive(active) ? 'on' : ''}${sub ? ' sub' : ''}"><span class="ico">${ic}</span>${t}${b ? `<span class="badge">${b}</span>` : ''}</a>`;
  /* القسم مفتوح إذا كانت إحدى صفحاته مفتوحة، أو فتحه المستخدم في الصفحة الحالية (تحديث الصفحة أو الانتقال لصفحة أخرى يقبض الباقي) */
  const grpOpen = (g) => !!(state.navOpen && state.navOpen.has(g));
  /* الموارد البشرية وإدارة العمليات: كل تفريع تحت العنوان الرئيسي بلون مختلف */
  const NAV_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#22d3ee', '#fb923c', '#f472b6', '#a3e635'];
  const NAV_TINT = ['hr', 'ops'];
  const navGroup = (g, active, color) => {
    const on = flatItems(g.items).some(([h]) => h === active),
      open = on || grpOpen(g.group);
    const tint = NAV_TINT.includes(g.group);
    const child = (it, i) => {
      const c = tint ? NAV_COLORS[i % NAV_COLORS.length] : color;
      const html = Array.isArray(it) ? navLink(it, active, true) : navGroup(it, active, c);
      return c ? html.replace(/^<(a|div) /, (m, tag) => `<${tag} style="--nc:${c}" data-nc="1" `) : html;
    };
    return `<div class="nav-grp${open ? ' open' : ''}${on ? ' has-on' : ''}${tint ? ' tinted' : ''}" data-grp="${g.group}"><button type="button" class="nav-grp-h"><span class="ico">${g.ic}</span>${g.title}<span class="chev">${icon('chevron')}</span></button>
      <div class="nav-grp-items">${g.items.map(child).join('')}</div></div>`;
  };
  /* مستويات الصفحة الحالية في شريط المسار: [[الاسم، الرابط]...] — آخرها الصفحة نفسها، و«لأعلى» يرجع لما قبله */
  function setCrumb(levels) {
    state.crumbX = { hash: location.hash, levels: levels.filter((l) => l && l[0]) };
    const el = document.querySelector('nav.gcrumb');
    if (!el) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = navCrumb(state.crumbActive || '');
    const nv = tmp.querySelector('nav.gcrumb');
    if (nv) el.replaceWith(nv);
  }
  /* المستوى التلقائي بلا اسم واضح: يُسمّى بعنوان الصفحة بعد تحميلها */
  function crumbRelabel() {
    if (!state.crumbGeneric) return;
    const b = document.querySelector('nav.gcrumb .gc-addr b:last-of-type');
    if (!b) return;
    const h1 = document.querySelector('#main .page-head h1');
    const t = h1 ? h1.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    const prev = [...document.querySelectorAll('nav.gcrumb .gc-addr a')].pop();
    if (t && (!prev || prev.textContent.trim() !== t)) b.textContent = t;
  }
  /* شريط المسار ثابت أعلى كل صفحة: التطبيقات › القسم › … › الصفحة (من القائمة نفسها)، وكل جزء رابط له */
  function navCrumb(active) {
    const items = navItems();
    const hash = location.hash || '#/';
    const find = (list, target, trail) => {
      for (const it of list) {
        if (Array.isArray(it)) {
          if (it[0] === target) return [...trail, it];
        } else {
          const f = find(it.items, target, [...trail, it]);
          if (f) return f;
        }
      }
      return null;
    };
    /* صفحات شئون الموظفين التابعة تظهر تحت «شئون الموظفين» */
    const aff = (state.empAffairs || []).find(
      ([h]) => h === hash || h === active || (h.includes('?type=') && hash.endsWith(h.slice(h.indexOf('?')))),
    );
    let path = find(items, hash, []) || (aff ? [...(find(items, '#/emp-affairs', []) || []), aff] : null) || find(items, active, []);
    /* صفحة التطبيقات: المجموعات المفتوحة من ?g= */
    if (active === '#/apps') {
      const g = (new URLSearchParams(hash.split('?')[1] || '').get('g') || '').split('/').filter(Boolean);
      let lvl = items;
      path = [];
      for (const k of g) {
        const x = lvl.find((it) => !Array.isArray(it) && it.group === k);
        if (!x) break;
        path.push(x);
        lvl = x.items;
      }
    }
    const extra = [];
    /* مستويات داخل الصفحة: الشركة في «وثائق ومستندات» (ثم وثائق فروعها) */
    if (active === '#/docs') {
      const hq = new URLSearchParams(hash.split('?')[1] || ''),
        co = hq.get('co');
      if (co) {
        extra.push([co, `#/docs?co=${encodeURIComponent(co)}`]);
        if (hq.get('tab') === 'company') extra.push(['وثائق الشركة', hash]);
        if (hq.get('tab') === 'branches') {
          extra.push(['وثائق الفروع', `#/docs?co=${encodeURIComponent(co)}&tab=branches`]);
          if (hq.get('b')) extra.push([hq.get('b'), hash]);
        }
      }
    }
    /* مستويات تحددها الصفحة نفسها بعد فتحها (مثل: المنشآت › الفرع › المبنى) */
    state.crumbGeneric = false;
    if (!extra.length && state.crumbX && state.crumbX.hash === hash) extra.push(...state.crumbX.levels);
    /* أي صفحة أعمق من صفحتها في القائمة (تفاصيل طلب، فرع، مركبة، موظف...) تصبح مستوى جديداً: فيعمل «لأعلى» و«رجوع» و«تقدم» */
    if (!extra.length && active !== '#/apps') {
      const last = (path || []).filter(Array.isArray).pop();
      const base = last ? last[0] : active;
      const norm = (h) => decodeURIComponent(String(h || '')).replace(/[?&]+$/, '');
      /* مفاتيح عرض فقط (تبويب، سنة، شهر، بحث، فلتر) لا تُعد مستوى جديداً */
      const VIEW_KEYS = [
        'tab',
        'view',
        'y',
        'm',
        'q',
        'month',
        'year',
        'page',
        'f',
        'filter',
        's',
        'sort',
        'status',
        'period',
        'v',
        'mode',
      ];
      const [hp, hs] = hash.split('?'),
        [bp, bs] = String(base || '').split('?');
      const hq0 = new URLSearchParams(hs || ''),
        bq0 = new URLSearchParams(bs || '');
      const deeper = hp !== bp || [...hq0.keys()].some((k) => !VIEW_KEYS.includes(k) && hq0.get(k) !== bq0.get(k));
      if (base && deeper) {
        const hq = new URLSearchParams(hash.split('?')[1] || '');
        const guess = ['co', 'b', 'branch', 'name', 'g', 't', 'type', 'tab']
          .map((k) => hq.get(k))
          .find((v) => v && !/^[a-f0-9]{8,}$/i.test(v) && !/^[a-z]+$/.test(v));
        extra.push([guess || 'التفاصيل', hash]);
        state.crumbGeneric = !guess;
      }
    }
    const parts = [`<a href="#/apps">${icon('grid')} التطبيقات</a>`];
    const gpath = [];
    (path || []).forEach((it, i, L) => {
      const last = i === L.length - 1;
      if (Array.isArray(it)) {
        if (it[0] !== '#/apps') parts.push(last && !extra.length ? `<b>${it[2]}</b>` : `<a href="${it[0]}">${it[2]}</a>`);
        return;
      }
      gpath.push(it.group);
      parts.push(last && active === '#/apps' ? `<b>${esc(it.title)}</b>` : `<a href="#/apps?g=${gpath.join('/')}">${esc(it.title)}</a>`);
    });
    extra.forEach(([l, h], i) => parts.push(i === extra.length - 1 ? `<b>${esc(l)}</b>` : `<a href="${h}">${esc(l)}</a>`));
    if (parts.length === 1) parts[0] = `<b>${icon('grid')} التطبيقات</b>`;
    const ctl =
      active === '#/apps'
        ? ''
        : `<div class="win-ctl" role="group" aria-label="التحكم في الصفحة">
      <button type="button" data-win="min" title="تصغير (تبقى في الشريط أسفل الشاشة)" aria-label="تصغير">${S.WIN_IC.min}</button>
      <button type="button" data-win="max" title="${S.winMax() ? 'استعادة الحجم' : 'تكبير (ملء الشاشة)'}" aria-label="تكبير أو استعادة">${S.winMax() ? S.WIN_IC.restore : S.WIN_IC.max}</button>
      <button type="button" data-win="close" class="wc-x" title="إغلاق والرجوع للتطبيقات" aria-label="إغلاق">${S.WIN_IC.close}</button></div>`;
    /* «لأعلى»: المستوى السابق في المسار (أو التطبيقات) */
    const ups = parts
      .slice(0, -1)
      .map((p) => (p.match(/href="([^"]+)"/) || [])[1])
      .filter(Boolean);
    const up = ups.length ? ups[ups.length - 1] : '';
    const nav = `<div class="gc-nav" role="group" aria-label="التنقل">
      <button type="button" data-gcn="back" title="رجوع" aria-label="رجوع">${S.WIN_IC.back}</button>
      <button type="button" data-gcn="fwd" title="تقدم" aria-label="تقدم">${S.WIN_IC.fwd}</button>
      <button type="button" data-gcn="up" title="لأعلى${up ? '' : ' (أنت في التطبيقات)'}" aria-label="لأعلى"${up ? ` data-up="${esc(up)}"` : ' disabled'}>${S.WIN_IC.up}</button>
      <button type="button" data-gcn="reload" title="تحديث الصفحة" aria-label="تحديث">${S.WIN_IC.reload}</button></div>`;
    const addr = `<div class="gc-addr"><span class="gc-pc">${icon('monitor')}</span><span class="gc-sep">›</span>${parts.join(' <span class="gc-sep">›</span> ')}<span class="gc-sep">›</span></div>`;
    /* البحث الشامل في النظام (Ctrl K): في شاشة التطبيقات يعرض النتائج مباشرة، ومن أي صفحة أخرى ينقل إليها */
    const gq = active === '#/apps' ? new URLSearchParams(hash.split('?')[1] || '').get('q') || '' : '';
    const srch = `<form class="gc-find" role="search">${icon('search')}<input type="search" id="gcQ" placeholder="بحث في النظام" aria-label="بحث في النظام" autocomplete="off" value="${esc(gq)}"></form>`;
    return `<nav class="gcrumb gc-ex" aria-label="المسار">${nav}${addr}${srch}${ctl}</nav>${S.winBar()}`;
  }
  Object.assign(S, { navTree, navTreeWire, flatItems, navFlat, navLink, navGroup });
})((window.SES_APP = window.SES_APP || {}));
