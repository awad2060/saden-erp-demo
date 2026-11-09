/* وسطاء الصفحات: أول استدعاء يحمّل public/js/pages/*.js بـ S (window.SES_APP)، ثم تحل الدالة الأصلية من ملف صفحتها محل الوسيط */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc, fmtNum } = SF;
  /* أدوات forms.js المشتركة التي تأخذها الصفحات من S */
  Object.assign(S, { SF, esc, fmtDate: SF.fmtDate, fmtNum });
  /* محتوى الدليل (guide-data.js): يُقرأ وقت الطلب بأدوات الصلاحيات الحالية */
  const guide = () => (window.SES_GUIDE.use({ can: S.can, today: S.today, AN_TOOLS: S.AN_TOOLS, AN_CHAIN: S.AN_CHAIN }), window.SES_GUIDE);
  for (const k of ['GUIDE', 'GUIDE_CATS', 'GUIDE_EN', 'GUIDE_META'])
    Object.defineProperty(S, k, { get: () => guide()[k], enumerable: true, configurable: true });
  Object.assign(S, {
    viewSettings,
    viewUserPage,
    viewEditor,
    viewPolicyGate,
    viewMobileApp,
    viewPolicy,
    viewGuide,
    viewMail,
    viewTasks,
    viewTask,
    viewNotifications,
    viewNotices,
    viewLogin,
    viewAccessRequests,
    viewHome,
    viewList,
    viewNew,
    viewSettle,
    viewRequest,
    viewNotes,
    viewFleet,
    viewVehicle,
    viewPayFunding,
    viewBranchPay,
    viewDrillProject,
    viewDrillProjects,
    viewDrilling,
    viewWorkshop,
    viewChat,
    viewEmployeePrint,
    viewEmployee,
    viewIqamas,
    viewEmployees,
    viewAttendance,
    viewGosi,
    viewAbout,
    viewOrgPrint,
    viewOrg,
    viewApps,
    viewEmpAffairs,
    viewContracts,
    viewDecisionCenter,
    viewExecutive,
    viewMe,
    viewEnded,
    viewPayroll,
    viewPayrun,
    viewPayslips,
    viewAdvances,
    viewAdvLedger,
    viewMyOvertime,
    viewOtApprovals,
    viewTodo,
    viewCalendar,
    viewContacts,
    viewMudadPay,
    viewDocs,
    viewCrm,
    viewLegalCases,
    viewInvestigations,
    viewKpi,
    viewCompanies,
    viewReports,
    viewPunch,
    viewDevices,
    viewInvDeleted,
    viewInventory,
    viewViolations,
    viewFuel,
    viewFacilities,
    viewAnalysis,
    viewTraining,
    viewKnowledge,
    viewGovernance,
    viewSupervision,
    viewHse,
    viewStock,
    viewBranchMap,
    viewPrint,
    viewDashboard,
    viewReport,
    viewTools,
    viewTrash,
    viewBuilder,
    viewAccount,
  });
  let PAGES_READY = null;
  function pages() {
    if (PAGES_READY) return PAGES_READY;
    PAGES_READY = {};
    const reg = window.SES_PAGES || {};
    for (const k of Object.keys(reg)) PAGES_READY[k] = reg[k](S);
    if (PAGES_READY['settings']) S.viewSettings = PAGES_READY['settings'].viewSettings;
    if (PAGES_READY['settings']) S.viewUserPage = PAGES_READY['settings'].viewUserPage;
    if (PAGES_READY['request-editor']) S.viewEditor = PAGES_READY['request-editor'].viewEditor;
    if (PAGES_READY['policy']) S.viewPolicyGate = PAGES_READY['policy'].viewPolicyGate;
    if (PAGES_READY['policy']) S.viewMobileApp = PAGES_READY['policy'].viewMobileApp;
    if (PAGES_READY['policy']) S.viewPolicy = PAGES_READY['policy'].viewPolicy;
    if (PAGES_READY['policy']) S.viewGuide = PAGES_READY['policy'].viewGuide;
    if (PAGES_READY['mail']) S.viewMail = PAGES_READY['mail'].viewMail;
    if (PAGES_READY['tasks']) S.viewTasks = PAGES_READY['tasks'].viewTasks;
    if (PAGES_READY['tasks']) S.viewTask = PAGES_READY['tasks'].viewTask;
    if (PAGES_READY['notifications']) S.viewNotifications = PAGES_READY['notifications'].viewNotifications;
    if (PAGES_READY['notifications']) S.viewNotices = PAGES_READY['notifications'].viewNotices;
    if (PAGES_READY['login']) S.viewLogin = PAGES_READY['login'].viewLogin;
    if (PAGES_READY['access-requests']) S.viewAccessRequests = PAGES_READY['access-requests'].viewAccessRequests;
    if (PAGES_READY['home']) S.viewHome = PAGES_READY['home'].viewHome;
    if (PAGES_READY['requests-list']) S.viewList = PAGES_READY['requests-list'].viewList;
    if (PAGES_READY['new-request']) S.viewNew = PAGES_READY['new-request'].viewNew;
    if (PAGES_READY['settlement']) S.viewSettle = PAGES_READY['settlement'].viewSettle;
    if (PAGES_READY['request-details']) S.viewRequest = PAGES_READY['request-details'].viewRequest;
    if (PAGES_READY['notes']) S.viewNotes = PAGES_READY['notes'].viewNotes;
    if (PAGES_READY['fleet']) S.viewFleet = PAGES_READY['fleet'].viewFleet;
    if (PAGES_READY['fleet']) S.viewVehicle = PAGES_READY['fleet'].viewVehicle;
    if (PAGES_READY['pay-funding']) S.viewPayFunding = PAGES_READY['pay-funding'].viewPayFunding;
    if (PAGES_READY['pay-funding']) S.viewBranchPay = PAGES_READY['pay-funding'].viewBranchPay;
    if (PAGES_READY['drilling']) S.viewDrillProject = PAGES_READY['drilling'].viewDrillProject;
    if (PAGES_READY['drilling']) S.viewDrillProjects = PAGES_READY['drilling'].viewDrillProjects;
    if (PAGES_READY['drilling']) S.viewDrilling = PAGES_READY['drilling'].viewDrilling;
    if (PAGES_READY['workshop']) S.viewWorkshop = PAGES_READY['workshop'].viewWorkshop;
    if (PAGES_READY['chat']) S.viewChat = PAGES_READY['chat'].viewChat;
    if (PAGES_READY['employee-file']) S.viewEmployeePrint = PAGES_READY['employee-file'].viewEmployeePrint;
    if (PAGES_READY['employee-file']) S.viewEmployee = PAGES_READY['employee-file'].viewEmployee;
    if (PAGES_READY['employees']) S.viewIqamas = PAGES_READY['employees'].viewIqamas;
    if (PAGES_READY['employees']) S.viewEmployees = PAGES_READY['employees'].viewEmployees;
    if (PAGES_READY['attendance']) S.viewAttendance = PAGES_READY['attendance'].viewAttendance;
    if (PAGES_READY['gosi']) S.viewGosi = PAGES_READY['gosi'].viewGosi;
    if (PAGES_READY['about']) S.viewAbout = PAGES_READY['about'].viewAbout;
    if (PAGES_READY['org-chart']) S.viewOrgPrint = PAGES_READY['org-chart'].viewOrgPrint;
    if (PAGES_READY['org-chart']) S.viewOrg = PAGES_READY['org-chart'].viewOrg;
    if (PAGES_READY['apps']) S.viewApps = PAGES_READY['apps'].viewApps;
    if (PAGES_READY['emp-affairs']) S.viewEmpAffairs = PAGES_READY['emp-affairs'].viewEmpAffairs;
    if (PAGES_READY['contracts']) S.viewContracts = PAGES_READY['contracts'].viewContracts;
    if (PAGES_READY['decisions']) S.viewDecisionCenter = PAGES_READY['decisions'].viewDecisionCenter;
    if (PAGES_READY['executive']) S.viewExecutive = PAGES_READY['executive'].viewExecutive;
    if (PAGES_READY['my-profile']) S.viewMe = PAGES_READY['my-profile'].viewMe;
    if (PAGES_READY['ended-employees']) S.viewEnded = PAGES_READY['ended-employees'].viewEnded;
    if (PAGES_READY['payroll']) S.viewPayroll = PAGES_READY['payroll'].viewPayroll;
    if (PAGES_READY['payroll']) S.viewPayrun = PAGES_READY['payroll'].viewPayrun;
    if (PAGES_READY['payroll']) S.viewPayslips = PAGES_READY['payroll'].viewPayslips;
    if (PAGES_READY['advances']) S.viewAdvances = PAGES_READY['advances'].viewAdvances;
    if (PAGES_READY['adv-ledger']) S.viewAdvLedger = PAGES_READY['adv-ledger'].viewAdvLedger;
    if (PAGES_READY['overtime']) S.viewMyOvertime = PAGES_READY['overtime'].viewMyOvertime;
    if (PAGES_READY['overtime']) S.viewOtApprovals = PAGES_READY['overtime'].viewOtApprovals;
    if (PAGES_READY['todo']) S.viewTodo = PAGES_READY['todo'].viewTodo;
    if (PAGES_READY['calendar']) S.viewCalendar = PAGES_READY['calendar'].viewCalendar;
    if (PAGES_READY['contacts']) S.viewContacts = PAGES_READY['contacts'].viewContacts;
    if (PAGES_READY['mudad']) S.viewMudadPay = PAGES_READY['mudad'].viewMudadPay;
    if (PAGES_READY['documents']) S.viewDocs = PAGES_READY['documents'].viewDocs;
    if (PAGES_READY['crm']) S.viewCrm = PAGES_READY['crm'].viewCrm;
    if (PAGES_READY['legal-cases']) S.viewLegalCases = PAGES_READY['legal-cases'].viewLegalCases;
    if (PAGES_READY['investigations']) S.viewInvestigations = PAGES_READY['investigations'].viewInvestigations;
    if (PAGES_READY['kpi']) S.viewKpi = PAGES_READY['kpi'].viewKpi;
    if (PAGES_READY['companies']) S.viewCompanies = PAGES_READY['companies'].viewCompanies;
    if (PAGES_READY['reports']) S.viewReports = PAGES_READY['reports'].viewReports;
    if (PAGES_READY['punch']) S.viewPunch = PAGES_READY['punch'].viewPunch;
    if (PAGES_READY['inventory']) S.viewDevices = PAGES_READY['inventory'].viewDevices;
    if (PAGES_READY['inventory']) S.viewInvDeleted = PAGES_READY['inventory'].viewInvDeleted;
    if (PAGES_READY['inventory']) S.viewInventory = PAGES_READY['inventory'].viewInventory;
    if (PAGES_READY['violations']) S.viewViolations = PAGES_READY['violations'].viewViolations;
    if (PAGES_READY['fuel']) S.viewFuel = PAGES_READY['fuel'].viewFuel;
    if (PAGES_READY['facilities']) S.viewFacilities = PAGES_READY['facilities'].viewFacilities;
    if (PAGES_READY['analysis']) S.viewAnalysis = PAGES_READY['analysis'].viewAnalysis;
    if (PAGES_READY['training']) S.viewTraining = PAGES_READY['training'].viewTraining;
    if (PAGES_READY['knowledge']) S.viewKnowledge = PAGES_READY['knowledge'].viewKnowledge;
    if (PAGES_READY['governance']) S.viewGovernance = PAGES_READY['governance'].viewGovernance;
    if (PAGES_READY['supervision']) S.viewSupervision = PAGES_READY['supervision'].viewSupervision;
    if (PAGES_READY['hse']) S.viewHse = PAGES_READY['hse'].viewHse;
    if (PAGES_READY['stock']) S.viewStock = PAGES_READY['stock'].viewStock;
    if (PAGES_READY['branch-map']) S.viewBranchMap = PAGES_READY['branch-map'].viewBranchMap;
    if (PAGES_READY['print']) S.viewPrint = PAGES_READY['print'].viewPrint;
    if (PAGES_READY['dashboard']) S.viewDashboard = PAGES_READY['dashboard'].viewDashboard;
    if (PAGES_READY['dept-report']) S.viewReport = PAGES_READY['dept-report'].viewReport;
    if (PAGES_READY['tools']) S.viewTools = PAGES_READY['tools'].viewTools;
    if (PAGES_READY['trash']) S.viewTrash = PAGES_READY['trash'].viewTrash;
    if (PAGES_READY['form-builder']) S.viewBuilder = PAGES_READY['form-builder'].viewBuilder;
    if (PAGES_READY['account']) S.viewAccount = PAGES_READY['account'].viewAccount;
    return PAGES_READY;
  }
  function pageFn(g, n, self, args) {
    const p = pages()[g];
    if (!p) throw new Error('ملف الصفحة غير محمّل: js/pages/' + g + '.js');
    return p[n].apply(self, args);
  }
  function viewSettings() {
    return pageFn('settings', 'viewSettings', this, arguments);
  }
  function viewUserPage() {
    return pageFn('settings', 'viewUserPage', this, arguments);
  }
  function viewEditor() {
    return pageFn('request-editor', 'viewEditor', this, arguments);
  }
  function viewPolicyGate() {
    return pageFn('policy', 'viewPolicyGate', this, arguments);
  }
  function viewMobileApp() {
    return pageFn('policy', 'viewMobileApp', this, arguments);
  }
  function viewPolicy() {
    return pageFn('policy', 'viewPolicy', this, arguments);
  }
  function viewGuide() {
    return pageFn('policy', 'viewGuide', this, arguments);
  }
  function viewMail() {
    return pageFn('mail', 'viewMail', this, arguments);
  }
  function viewTasks() {
    return pageFn('tasks', 'viewTasks', this, arguments);
  }
  function viewTask() {
    return pageFn('tasks', 'viewTask', this, arguments);
  }
  function viewNotifications() {
    return pageFn('notifications', 'viewNotifications', this, arguments);
  }
  function viewNotices() {
    return pageFn('notifications', 'viewNotices', this, arguments);
  }
  function viewLogin() {
    return pageFn('login', 'viewLogin', this, arguments);
  }
  function viewAccessRequests() {
    return pageFn('access-requests', 'viewAccessRequests', this, arguments);
  }
  function viewHome() {
    return pageFn('home', 'viewHome', this, arguments);
  }
  function viewList() {
    return pageFn('requests-list', 'viewList', this, arguments);
  }
  function viewNew() {
    return pageFn('new-request', 'viewNew', this, arguments);
  }
  function viewSettle() {
    return pageFn('settlement', 'viewSettle', this, arguments);
  }
  function viewRequest() {
    return pageFn('request-details', 'viewRequest', this, arguments);
  }
  function viewNotes() {
    return pageFn('notes', 'viewNotes', this, arguments);
  }
  function viewFleet() {
    return pageFn('fleet', 'viewFleet', this, arguments);
  }
  function viewVehicle() {
    return pageFn('fleet', 'viewVehicle', this, arguments);
  }
  function viewPayFunding() {
    return pageFn('pay-funding', 'viewPayFunding', this, arguments);
  }
  function viewBranchPay() {
    return pageFn('pay-funding', 'viewBranchPay', this, arguments);
  }
  function viewDrillProject() {
    return pageFn('drilling', 'viewDrillProject', this, arguments);
  }
  function viewDrillProjects() {
    return pageFn('drilling', 'viewDrillProjects', this, arguments);
  }
  function viewDrilling() {
    return pageFn('drilling', 'viewDrilling', this, arguments);
  }
  function viewWorkshop() {
    return pageFn('workshop', 'viewWorkshop', this, arguments);
  }
  function viewChat() {
    return pageFn('chat', 'viewChat', this, arguments);
  }
  function viewEmployeePrint() {
    return pageFn('employee-file', 'viewEmployeePrint', this, arguments);
  }
  function viewEmployee() {
    return pageFn('employee-file', 'viewEmployee', this, arguments);
  }
  function viewIqamas() {
    return pageFn('employees', 'viewIqamas', this, arguments);
  }
  function viewEmployees() {
    return pageFn('employees', 'viewEmployees', this, arguments);
  }
  function viewAttendance() {
    return pageFn('attendance', 'viewAttendance', this, arguments);
  }
  function viewGosi() {
    return pageFn('gosi', 'viewGosi', this, arguments);
  }
  function viewAbout() {
    return pageFn('about', 'viewAbout', this, arguments);
  }
  function viewOrgPrint() {
    return pageFn('org-chart', 'viewOrgPrint', this, arguments);
  }
  function viewOrg() {
    return pageFn('org-chart', 'viewOrg', this, arguments);
  }
  function viewApps() {
    return pageFn('apps', 'viewApps', this, arguments);
  }
  function viewEmpAffairs() {
    return pageFn('emp-affairs', 'viewEmpAffairs', this, arguments);
  }
  function viewContracts() {
    return pageFn('contracts', 'viewContracts', this, arguments);
  }
  function viewDecisionCenter() {
    return pageFn('decisions', 'viewDecisionCenter', this, arguments);
  }
  function viewExecutive() {
    return pageFn('executive', 'viewExecutive', this, arguments);
  }
  function viewMe() {
    return pageFn('my-profile', 'viewMe', this, arguments);
  }
  function viewEnded() {
    return pageFn('ended-employees', 'viewEnded', this, arguments);
  }
  function viewPayroll() {
    return pageFn('payroll', 'viewPayroll', this, arguments);
  }
  function viewPayrun() {
    return pageFn('payroll', 'viewPayrun', this, arguments);
  }
  function viewPayslips() {
    return pageFn('payroll', 'viewPayslips', this, arguments);
  }
  function viewAdvances() {
    return pageFn('advances', 'viewAdvances', this, arguments);
  }
  function viewAdvLedger() {
    return pageFn('adv-ledger', 'viewAdvLedger', this, arguments);
  }
  function viewMyOvertime() {
    return pageFn('overtime', 'viewMyOvertime', this, arguments);
  }
  function viewOtApprovals() {
    return pageFn('overtime', 'viewOtApprovals', this, arguments);
  }
  function viewTodo() {
    return pageFn('todo', 'viewTodo', this, arguments);
  }
  function viewCalendar() {
    return pageFn('calendar', 'viewCalendar', this, arguments);
  }
  function viewContacts() {
    return pageFn('contacts', 'viewContacts', this, arguments);
  }
  function viewMudadPay() {
    return pageFn('mudad', 'viewMudadPay', this, arguments);
  }
  function viewDocs() {
    return pageFn('documents', 'viewDocs', this, arguments);
  }
  function viewCrm() {
    return pageFn('crm', 'viewCrm', this, arguments);
  }
  function viewLegalCases() {
    return pageFn('legal-cases', 'viewLegalCases', this, arguments);
  }
  function viewInvestigations() {
    return pageFn('investigations', 'viewInvestigations', this, arguments);
  }
  function viewKpi() {
    return pageFn('kpi', 'viewKpi', this, arguments);
  }
  function viewCompanies() {
    return pageFn('companies', 'viewCompanies', this, arguments);
  }
  function viewReports() {
    return pageFn('reports', 'viewReports', this, arguments);
  }
  function viewPunch() {
    return pageFn('punch', 'viewPunch', this, arguments);
  }
  function viewDevices() {
    return pageFn('inventory', 'viewDevices', this, arguments);
  }
  function viewInvDeleted() {
    return pageFn('inventory', 'viewInvDeleted', this, arguments);
  }
  function viewInventory() {
    return pageFn('inventory', 'viewInventory', this, arguments);
  }
  function viewViolations() {
    return pageFn('violations', 'viewViolations', this, arguments);
  }
  function viewFuel() {
    return pageFn('fuel', 'viewFuel', this, arguments);
  }
  function viewFacilities() {
    return pageFn('facilities', 'viewFacilities', this, arguments);
  }
  function viewAnalysis() {
    return pageFn('analysis', 'viewAnalysis', this, arguments);
  }
  function viewTraining() {
    return pageFn('training', 'viewTraining', this, arguments);
  }
  function viewKnowledge() {
    return pageFn('knowledge', 'viewKnowledge', this, arguments);
  }
  function viewGovernance() {
    return pageFn('governance', 'viewGovernance', this, arguments);
  }
  function viewSupervision() {
    return pageFn('supervision', 'viewSupervision', this, arguments);
  }
  function viewHse() {
    return pageFn('hse', 'viewHse', this, arguments);
  }
  function viewStock() {
    return pageFn('stock', 'viewStock', this, arguments);
  }
  function viewBranchMap() {
    return pageFn('branch-map', 'viewBranchMap', this, arguments);
  }
  function viewPrint() {
    return pageFn('print', 'viewPrint', this, arguments);
  }
  function viewDashboard() {
    return pageFn('dashboard', 'viewDashboard', this, arguments);
  }
  function viewReport() {
    return pageFn('dept-report', 'viewReport', this, arguments);
  }
  function viewTools() {
    return pageFn('tools', 'viewTools', this, arguments);
  }
  function viewTrash() {
    return pageFn('trash', 'viewTrash', this, arguments);
  }
  function viewBuilder() {
    return pageFn('form-builder', 'viewBuilder', this, arguments);
  }
  function viewAccount() {
    return pageFn('account', 'viewAccount', this, arguments);
  }
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const app = $('#app');

  const state = {
    user: null,
    config: {
      appName: 'SADEN ERP SYSTEM',
      orgName: 'Integrated Business Management',
      branches: [],
      disabledForms: [],
      letterTopMargin: 35,
    },
    stats: null,
  };
  const isApprover = () => state.user && state.user.role === 'approver';
  const isAdmin = () => state.user && state.user.role === 'admin';
  const seesAll = () => isAdmin() || state.user.viewScope === 'all';
  const allLabel = (u) =>
    isAdmin() || u.viewScope === 'all' ? 'جميع الطلبات' : u.viewScope === 'branch' ? 'طلبات فرعي' : 'الطلبات المارة علي';
  const ACTIONS = {
    submit: 'رفع الطلب',
    resubmit: 'إعادة الإرسال بعد التعديل',
    approve: 'اعتماد',
    reject: 'رفض',
    forward: 'إعادة توجيه',
    cancelDed: 'إلغاء قرار الخصم',
    payMonth: 'تحديد شهر الصرف',
    return: 'إعادة للتعديل',
    cancel: 'إلغاء الطلب',
    attach: 'إرفاق ملف',
    detach: 'حذف مرفق',
    close: 'إغلاق ملف التصفية',
    payer: 'تعديل الجهة في المخالصة',
  };
  const STATUS = { approved: 'معتمد نهائياً', rejected: 'مرفوض', returned: 'معاد للتعديل', cancelled: 'ملغي' };
  const ROLE_OPTS = { accountant: 'محاسب فرع (مقدم طلبات)', approver: 'معتمد', admin: 'مدير النظام' };
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const statusText = (r) =>
    r.status === 'pending'
      ? `بانتظار ${r.stepLabel}`
      : r.awaitingClearance
        ? (SF.closeDoc(r.type) || {}).waiting || 'معتمد — بانتظار المستند الموقّع'
        : r.closedAt
          ? (SF.closeDoc(r.type) || {}).closed || 'مغلق'
          : (r.status === 'approved' && (SF.byId[r.type] || {}).doneText) || STATUS[r.status];
  const lateDays = (r) => (r.status === 'pending' && r.since ? SF.workDaysSince(r.since, state.config) : 0);
  const chip = (r) => {
    const d = lateDays(r);
    const late =
      d >= (Number(state.config.overdueDays) || 2)
        ? ` <span class="chip late" title="منذ وصوله للمرحلة الحالية">متأخر ${d} يوم</span>`
        : '';
    return `<span class="chip ${r.awaitingClearance ? 'waitclr' : r.status}">${esc(statusText(r))}</span>${late}`;
  };
  const dt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const compact = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${+(n / 1e3).toFixed(1)}K` : fmtNum(Math.round(n)));
  const enabledForms = () =>
    SF.FORMS.filter((f) => !f.hideNew && !state.config.disabledForms.includes(f.id) && SF.formAllowed(state.user, f.id));
  /* ما يظهر للمستخدم: افتراضياً حسب صلاحيته، ومدير النظام يغيّره لكل مستخدم */
  const can = (k) => SF.canSee(state.user, k);
  const navHidden = (k) => !can(k);
  Object.assign(S, {
    $,
    $$,
    app,
    state,
    isApprover,
    isAdmin,
    seesAll,
    allLabel,
    ACTIONS,
    STATUS,
    MONTHS,
    statusText,
    chip,
    dt,
    today,
    compact,
    enabledForms,
    can,
    navHidden,
  });
})((window.SES_APP = window.SES_APP || {}));
