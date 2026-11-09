/* واجهة SADEN ERP SYSTEM: التوجيه وبدء التشغيل (أجزاء الواجهة في public/js/app/*.js تسبقه وتتشارك السجل S) */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const {
    $,
    $$,
    app,
    state,
    navHidden,
    api,
    toast,
    applyConfig,
    viewSoon,
    navFlat,
    crumbRelabel,
    shell,
    POLICY,
    setBell,
    setTopBadges,
    syncPush,
    refreshStats,
    assistantInit,
    chatConnect,
    SOLO,
    cwRestore,
    canExec,
    reportAutoClick,
  } = S;
  Object.assign(S, { route });

  /* ---------- التفويض ---------- */

  /* ---------- حسابي ---------- */

  /* ---------- التوجيه ---------- */
  async function route() {
    try {
      return await routeMain();
    } finally {
      crumbRelabel();
      setTimeout(crumbRelabel, 700);
      setTimeout(crumbRelabel, 2000);
    }
  }
  async function routeMain() {
    setTimeout(reportAutoClick, 0);
    const [pathPart, qs] = (location.hash.slice(1) || '/').split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    const parts = pathPart.split('/').filter(Boolean);
    if (!state.user) {
      try {
        state.user = (await api('GET', '/api/me')).user;
      } catch {
        /* غير مسجل */
      }
      if (!state.user) return S.viewLogin();
      try {
        state.group = await api('GET', '/api/group/me');
      } catch {
        state.group = null;
      }
      if (!state.user.mustChange) await refreshStats();
    }
    if (parts[0] === 'login') {
      location.hash = '#/';
      return;
    }
    /* تحديث إعدادات النظام (النماذج المعدّلة والفئات...) إذا مر عليها أكثر من 30 ثانية */
    if (!state.configAt || Date.now() - state.configAt > 30000) {
      try {
        applyConfig(await api('GET', '/api/config'));
      } catch {
        /* تجاهل */
      }
    }
    return routeMainPart(parts, query);
  }
  /* جزء من routeMain: if (state.user.mustChange) return S.viewAccount();… */
  async function routeMainPart(parts, query) {
    if (state.user.mustChange) return S.viewAccount();
    /* سياسة الاستخدام: تظهر بعد الدخول حتى يوافق عليها المستخدم (ومن جديد عند تغيّر إصدارها) */
    if (state.user.policyVer !== POLICY.ver) return S.viewPolicyGate();
    syncPush();
    chatConnect();
    if (SOLO) {
      if (parts[0] !== 'chat') {
        location.hash = '#/chat';
        return;
      }
    } else {
      assistantInit();
      cwRestore();
    }
    /* صفحة مخفية عن المستخدم: يُحوَّل لأول صفحة متاحة في قائمته */
    const pageKey = {
      undefined: 'home',
      new: 'new',
      mine: 'mine',
      inbox: 'inbox',
      all: 'all',
      register: 'register',
      dashboard: 'dashboard',
      tools: 'tools',
      guide: 'guide',
      mail: 'mail',
      notices: 'notices',
      fleet: 'fleet',
      violations: 'violations',
      fuel: 'fuel',
      facilities: 'facilities',
      'branch-map': 'branchMap',
      workshop: 'workshop',
      drilling: 'drilling',
      inventory: 'inventory',
      'inventory-deleted': 'inventory',
      'drilling-projects': 'drilling',
      'drilling-project': 'drilling',
      devices: 'devices',
      employees: 'employees',
      employee: 'employees',
      iqamas: 'employees',
      chat: 'chat',
    }[parts[0]];
    if (pageKey && navHidden(pageKey) && !(/^drilling-project/.test(parts[0] || '') && state.user.drillPartner)) {
      const first = navFlat()[0];
      location.hash = first ? first[0] : '#/account';
      return;
    }
    try {
      const key = parts[0] === undefined ? '' : parts[0];
      const name = Object.hasOwn(ROUTE_ALIAS, key) ? ROUTE_ALIAS[key] : key;
      if (Object.hasOwn(ROUTE_VIEWS, name)) return await ROUTE_VIEWS[name](parts, query);
      return await window.SES_ROUTE(S, parts, query);
    } catch (err) {
      if (state.user) shell(`<div class="card empty">${esc(err.message)}<br><br><a class="btn" href="#/">العودة للرئيسية</a></div>`, '');
    }
  }
  /* جدول التوجيه: الجزء الأول من الرابط ('' للرئيسية) ← عرض صفحته (parts أجزاء الرابط، وquery الاستعلام).
   * الصفحات الجديدة تسجّل مسارها في window.SES_ROUTES (routes.js) ولا تُضاف هنا */
  const ROUTE_VIEWS = {
    '': async (parts, query) => {
      return await S.viewHome();
    },
    new: async (parts, query) => {
      return parts[1] ? await S.viewEditor(parts[1], null, query) : S.viewNew();
    },
    edit: async (parts, query) => {
      return await S.viewEditor(null, parts[1]);
    },
    register: async (parts, query) => {
      return await S.viewList(parts[0], query);
    },
    mine: async (parts, query) => {
      return await S.viewList(parts[0], query);
    },
    req: async (parts, query) => {
      return await S.viewRequest(parts[1]);
    },
    print: async (parts, query) => {
      return await S.viewPrint(parts[1]);
    },
    orgprint: async (parts, query) => {
      return await S.viewOrgPrint(query);
    },
    report: async (parts, query) => {
      return await S.viewReport(query);
    },
    dashboard: async (parts, query) => {
      if (!state.user.dashboard && !canExec()) {
        location.hash = '#/';
        return;
      }
      return await S.viewDashboard(query);
    },
    tools: async (parts, query) => {
      return await S.viewTools();
    },
    guide: async (parts, query) => {
      return S.viewGuide();
    },
    policy: async (parts, query) => {
      return S.viewPolicy();
    },
    'mobile-app': async (parts, query) => {
      return S.viewMobileApp();
    },
    mail: async (parts, query) => {
      return await S.viewMail(parts[1], query);
    },
    notices: async (parts, query) => {
      return await S.viewNotices();
    },
    notifications: async (parts, query) => {
      return await S.viewNotifications();
    },
    tasks: async (parts, query) => {
      return parts[1] ? await S.viewTask(parts[1]) : await S.viewTasks(query);
    },
    fleet: async (parts, query) => {
      return parts[1] ? await S.viewVehicle(parts[1]) : await S.viewFleet(query);
    },
    violations: async (parts, query) => {
      return await S.viewViolations(query);
    },
    fuel: async (parts, query) => {
      return await S.viewFuel(query);
    },
    facilities: async (parts, query) => {
      return await S.viewFacilities(query);
    },
    'branch-map': async (parts, query) => {
      return await S.viewBranchMap(query);
    },
    stock: async (parts, query) => {
      return S.viewStock();
    },
    analysis: async (parts, query) => {
      return S.viewAnalysis(parts[1], query);
    },
    hse: async (parts, query) => {
      return S.viewHse(query);
    },
    governance: async (parts, query) => {
      return S.viewGovernance(query);
    },
    knowledge: async (parts, query) => {
      return S.viewKnowledge(query);
    },
    training: async (parts, query) => {
      return S.viewTraining(query);
    },
    workshop: async (parts, query) => {
      return await S.viewWorkshop(query);
    },
    drilling: async (parts, query) => {
      return await S.viewDrilling(query);
    },
    'drilling-projects': async (parts, query) => {
      return await S.viewDrillProjects(query);
    },
    'drilling-project': async (parts, query) => {
      return await S.viewDrillProject(parts[1]);
    },
    inventory: async (parts, query) => {
      return await S.viewInventory(query);
    },
    'inventory-deleted': async (parts, query) => {
      return await S.viewInvDeleted(query);
    },
    devices: async (parts, query) => {
      return await S.viewDevices(query);
    },
    employees: async (parts, query) => {
      return await S.viewEmployees(query);
    },
    'employees-ended': async (parts, query) => {
      return await S.viewEnded(query);
    },
    'emp-affairs': async (parts, query) => {
      return S.viewEmpAffairs();
    },
    apps: async (parts, query) => {
      return S.viewApps(query);
    },
    about: async (parts, query) => {
      return await S.viewAbout(query);
    },
    'decision-center': async (parts, query) => {
      return await S.viewDecisionCenter(parts[1]);
    },
    advances: async (parts, query) => {
      return await S.viewAdvances(query);
    },
    'legal-cases': async (parts, query) => {
      return await S.viewLegalCases(query);
    },
    kpi: async (parts, query) => {
      return await S.viewKpi(query);
    },
    reports: async (parts, query) => {
      return S.viewReports(query);
    },
    docs: async (parts, query) => {
      return await S.viewDocs(query);
    },
    wps: async (parts, query) => {
      return await S.viewDocs(query, 'wps');
    },
    'mudad-pay': async (parts, query) => {
      return await S.viewMudadPay(query);
    },
    'branch-pay': async (parts, query) => {
      return await S.viewBranchPay(query);
    },
    'pay-funding': async (parts, query) => {
      return await S.viewPayFunding(query);
    },
    supervision: async (parts, query) => {
      return S.viewSupervision(query);
    },
    finance: async (parts, query) => {
      return viewSoon(parts[0]);
    },
    companies: async (parts, query) => {
      return await S.viewCompanies(query);
    },
    crm: async (parts, query) => {
      return await S.viewCrm(query);
    },
    todo: async (parts, query) => {
      return await S.viewTodo(query);
    },
    calendar: async (parts, query) => {
      return await S.viewCalendar(query);
    },
    contacts: async (parts, query) => {
      return await S.viewContacts(query);
    },
    'access-requests': async (parts, query) => {
      return await S.viewAccessRequests(query);
    },
    investigations: async (parts, query) => {
      return await S.viewInvestigations(query);
    },
    'my-overtime': async (parts, query) => {
      return await S.viewMyOvertime(query);
    },
    punch: async (parts, query) => {
      return await S.viewPunch();
    },
    'ot-approvals': async (parts, query) => {
      return await S.viewOtApprovals(query);
    },
    iqamas: async (parts, query) => {
      return await S.viewIqamas(query);
    },
    chat: async (parts, query) => {
      let c = parts.slice(1).join('/');
      try {
        c = decodeURIComponent(c);
      } catch {
        /* كما هو */
      }
      return await S.viewChat(c);
    },
    employee: async (parts, query) => {
      return await S.viewEmployee(parts[1], query);
    },
    'employee-print': async (parts, query) => {
      return await S.viewEmployeePrint(parts[1]);
    },
    payroll: async (parts, query) => {
      return parts[1] ? await S.viewPayrun(parts[1]) : await S.viewPayroll();
    },
    attendance: async (parts, query) => {
      return await S.viewAttendance(query);
    },
    gosi: async (parts, query) => {
      return await S.viewGosi(query);
    },
    org: async (parts, query) => {
      return await S.viewOrg(query);
    },
    contracts: async (parts, query) => {
      return await S.viewContracts(query);
    },
    me: async (parts, query) => {
      return await S.viewMe();
    },
    'my-payslip': async (parts, query) => {
      return await S.viewPayslips(parts[1], { mine: 1 });
    },
    payslips: async (parts, query) => {
      return await S.viewPayslips(parts[1], query);
    },
    settings: async (parts, query) => {
      return parts[1] === 'users' && parts[2] ? await S.viewUserPage(parts[2]) : await S.viewSettings(parts[1], parts[2]);
    },
    builder: async (parts, query) => {
      return await S.viewBuilder(parts[1]);
    },
    settle: async (parts, query) => {
      return await S.viewSettle(parts[1]);
    },
    users: async (parts, query) => {
      location.hash = '#/settings/users';
      return;
    },
    notes: async (parts, query) => {
      return await S.viewNotes(query);
    },
    trash: async (parts, query) => {
      return await S.viewTrash();
    },
    account: async (parts, query) => {
      return S.viewAccount();
    },
  };
  /* مسارات تعرض صفحة مسار آخر */
  const ROUTE_ALIAS = {
    inbox: 'mine',
    all: 'mine',
    marketing: 'finance',
    tenders: 'finance',
    projects: 'finance',
    procurement: 'finance',
    decisions: 'me',
  };
  window.addEventListener('hashchange', () => {
    if (location.hash === '#/login' && !state.user) return S.viewLogin();
    route();
  });
  /* تحديث عدد الطلبات المنتظرة كل دقيقة */
  setInterval(async () => {
    if (!state.user || state.user.mustChange || /^#\/(org)?print/.test(location.hash)) return;
    const before = state.stats && state.stats.inbox,
      notifBefore = state.stats && state.stats.notif;
    await refreshStats();
    $$('.nav a').forEach((a) => {
      const map = { '#/inbox': state.stats.inbox, '#/mine': (state.stats.myReturned || 0) + (state.stats.myClearance || 0) };
      if (!(a.getAttribute('href') in map)) return;
      const n = map[a.getAttribute('href')];
      let b = $('.badge', a);
      if (n && !b) {
        b = document.createElement('span');
        b.className = 'badge';
        a.appendChild(b);
      }
      if (b) {
        if (n) b.textContent = n;
        else b.remove();
      }
    });
    if (before != null && state.stats.inbox > before) toast('وصل طلب جديد بانتظار اعتمادك');
    else if (notifBefore != null && state.stats.notif > notifBefore) toast('🔔 لديك إشعار جديد');
    setBell(state.stats.notif || 0);
    setTopBadges();
  }, 60000);

  if (location.protocol === 'file:') {
    app.innerHTML = `<div class="login"><div class="card"><h1>يجب تشغيل النظام من الخادم</h1>
      <p style="margin-top:14px;line-height:1.9">لا تفتح ملف index.html مباشرة.<br>شغّل الملف <b dir="ltr">run-platform.bat</b> ثم افتح الرابط الذي يظهر فيه، مثل:<br><b dir="ltr">http://localhost:3000</b></p></div></div>`;
    return;
  }
  /* معاينة ثيم مناسبة: افتح النظام بـ ?occ=ramadan (أو national, founding, flag, fitr, adha, hijri) */
  (async () => {
    try {
      const pv = new URLSearchParams(location.search).get('occ');
      if (pv) {
        const r = await api('GET', `/api/occasion?preview=${encodeURIComponent(pv)}`);
        state.occPreview = r.occasion || null;
      }
    } catch {
      /* تجاهل */
    }
    api('GET', '/api/config')
      .then(applyConfig)
      .catch(() => {})
      .finally(route);
  })();
})((window.SES_APP = window.SES_APP || {}));
