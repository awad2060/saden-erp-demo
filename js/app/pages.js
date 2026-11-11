/* وسطاء الصفحات: أول استدعاء يحمّل public/js/pages/*.js بـ S (window.SES_APP)، ثم تحل الدالة الأصلية من ملف صفحتها محل الوسيط */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc, fmtNum } = SF;
  /* أدوات forms.js المشتركة التي تأخذها الصفحات من S */
  Object.assign(S, { SF, esc, fmtDate: SF.fmtDate, fmtNum });
  /* محتوى الدليل (guide-data.js): يُقرأ وقت الطلب بأدوات الصلاحيات الحالية */
  const guide = () => (window.SES_GUIDE.use({ can: S.can, today: S.today, AN_TOOLS: S.AN_TOOLS, AN_CHAIN: S.AN_CHAIN }), window.SES_GUIDE);
  for (const k of ['GUIDE', 'GUIDE_CATS', 'GUIDE_EN', 'GUIDE_UR', 'GUIDE_DYN', 'GUIDE_META'])
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
  /* دوال الصفحات التي تُسجَّل في S بعد تحميل الصفحات: [الصفحة، الدالة] بالترتيب */
  const PAGE_EXPORTS = [
    ['settings', 'viewSettings'],
    ['settings', 'viewUserPage'],
    ['request-editor', 'viewEditor'],
    ['policy', 'viewPolicyGate'],
    ['policy', 'viewMobileApp'],
    ['policy', 'viewPolicy'],
    ['policy', 'viewGuide'],
    ['mail', 'viewMail'],
    ['tasks', 'viewTasks'],
    ['tasks', 'viewTask'],
    ['notifications', 'viewNotifications'],
    ['notifications', 'viewNotices'],
    ['login', 'viewLogin'],
    ['access-requests', 'viewAccessRequests'],
    ['home', 'viewHome'],
    ['requests-list', 'viewList'],
    ['new-request', 'viewNew'],
    ['settlement', 'viewSettle'],
    ['request-details', 'viewRequest'],
    ['notes', 'viewNotes'],
    ['fleet', 'viewFleet'],
    ['fleet', 'viewVehicle'],
    ['pay-funding', 'viewPayFunding'],
    ['pay-funding', 'viewBranchPay'],
    ['drilling', 'viewDrillProject'],
    ['drilling', 'viewDrillProjects'],
    ['drilling', 'viewDrilling'],
    ['workshop', 'viewWorkshop'],
    ['chat', 'viewChat'],
    ['employee-file', 'viewEmployeePrint'],
    ['employee-file', 'viewEmployee'],
    ['employees', 'viewIqamas'],
    ['employees', 'viewEmployees'],
    ['attendance', 'viewAttendance'],
    ['gosi', 'viewGosi'],
    ['about', 'viewAbout'],
    ['org-chart', 'viewOrgPrint'],
    ['org-chart', 'viewOrg'],
    ['apps', 'viewApps'],
    ['emp-affairs', 'viewEmpAffairs'],
    ['contracts', 'viewContracts'],
    ['decisions', 'viewDecisionCenter'],
    ['executive', 'viewExecutive'],
    ['my-profile', 'viewMe'],
    ['ended-employees', 'viewEnded'],
    ['payroll', 'viewPayroll'],
    ['payroll', 'viewPayrun'],
    ['payroll', 'viewPayslips'],
    ['advances', 'viewAdvances'],
    ['adv-ledger', 'viewAdvLedger'],
    ['overtime', 'viewMyOvertime'],
    ['overtime', 'viewOtApprovals'],
    ['todo', 'viewTodo'],
    ['calendar', 'viewCalendar'],
    ['contacts', 'viewContacts'],
    ['mudad', 'viewMudadPay'],
    ['documents', 'viewDocs'],
    ['crm', 'viewCrm'],
    ['legal-cases', 'viewLegalCases'],
    ['investigations', 'viewInvestigations'],
    ['kpi', 'viewKpi'],
    ['companies', 'viewCompanies'],
    ['reports', 'viewReports'],
    ['punch', 'viewPunch'],
    ['inventory', 'viewDevices'],
    ['inventory', 'viewInvDeleted'],
    ['inventory', 'viewInventory'],
    ['violations', 'viewViolations'],
    ['fuel', 'viewFuel'],
    ['facilities', 'viewFacilities'],
    ['analysis', 'viewAnalysis'],
    ['training', 'viewTraining'],
    ['knowledge', 'viewKnowledge'],
    ['governance', 'viewGovernance'],
    ['supervision', 'viewSupervision'],
    ['hse', 'viewHse'],
    ['stock', 'viewStock'],
    ['branch-map', 'viewBranchMap'],
    ['print', 'viewPrint'],
    ['dashboard', 'viewDashboard'],
    ['dept-report', 'viewReport'],
    ['tools', 'viewTools'],
    ['trash', 'viewTrash'],
    ['form-builder', 'viewBuilder'],
    ['account', 'viewAccount'],
  ];
  let PAGES_READY = null;
  function pages() {
    if (PAGES_READY) return PAGES_READY;
    PAGES_READY = {};
    const reg = window.SES_PAGES || {};
    for (const k of Object.keys(reg)) PAGES_READY[k] = reg[k](S);
    /* أسماء كل صفحة في S (تُستدعى منها مباشرة) */
    for (const [g, n] of PAGE_EXPORTS) if (PAGES_READY[g]) S[n] = PAGES_READY[g][n];
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
    ({ all: 'جميع الطلبات', branch: 'طلبات فرعي', dept: 'طلبات إدارتي' })[isAdmin() ? 'all' : u.viewScope] || 'الطلبات المارة علي';
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
