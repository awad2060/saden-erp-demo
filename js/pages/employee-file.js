'use strict';
/* صفحة «employee-file» (viewEmployeePrint، viewEmployee) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['employee-file'] = function (S) {
  /* خصائص أنواع الطلبات (public/js/form-traits.js): isForm(r, 'خاصية') بدل مقارنة النوع */
  const isForm = (r, trait) => window.SADEN_FORM_TRAITS.is(r, trait);
  const {
    $,
    $$,
    ACCEPT,
    SF,
    TABS,
    api,
    app,
    askText,
    askYesNo,
    collect,
    docLeft,
    downloadCsv,
    dt,
    empAccCard,
    empCard,
    empChips,
    empDocs,
    empEmpty,
    empMoney,
    empPhoto,
    employeeModal,
    esc,
    fieldHtml,
    fmtNum,
    head,
    icon,
    kpiCard,
    natFlag,
    requestsTable,
    shell,
    state,
    toast,
    today,
    uploadFile,
  } = S;
  /* أجزاء ملف الموظف: نافذة صف الجدول، وربط حساب الموظف، وطباعة الملف، والسيرة الذاتية (employee-file-kit.js) */
  const { viewEmployeePrint, bindEmpAcc, empCvHtml, empRowModal, printEmpCv } = window.SES_PAGE_KITS['employee-file'](S, {});

  async function viewEmployee(id, query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/employees');
    const e = await api('GET', `/api/employees/${id}`);
    const L = (k) => (e.lists || {})[k] || [];
    const docs = empDocs(e);
    const dueCount = docs.filter((d) => d.days <= 30).length;
    const lv = SF.empLeave(e, today());
    const openAssets = L('assets').filter((x) => !x.returned).length;
    const pendingReq = e.requests.filter((r) => r.status === 'pending').length;
    const TABS = [
      ['overview', 'نظرة عامة', 'chart', dueCount + (lv.balance < 0 ? 1 : 0)],
      ['personal', 'البيانات الشخصية', 'user'],
      ['work', 'العمل والفريق', 'briefcase'],
      ['money', e.salary ? 'الراتب والتأمين' : 'التأمين', 'receipt'],
      ['leaves', 'الإجازات', 'bookOpen'],
      ['files', 'المستندات والعهد', 'folderOpen', openAssets, e.files.length],
      ['cv', 'السيرة الذاتية', 'fileText'],
      ['growth', 'الأداء والتطوير', 'book'],
      ['requests', 'الطلبات والسجل', 'list', pendingReq, e.requests.length],
      ...employeeValue(e),
    ];
    const OLD_TAB = {
      company: 'work',
      team: 'work',
      periods: 'work',
      salary: 'money',
      insurance: 'money',
      licenses: 'files',
      assets: 'files',
      courses: 'growth',
      evaluations: 'growth',
      penalties: 'growth',
      notes: 'requests',
      log: 'requests',
      dependents: 'personal',
    };
    return viewEmployeePart2(L, OLD_TAB, TABS, docs, e, id, lv, main, openAssets, pendingReq, query);
  }
  /* جزء من viewEmployee: const tab0 = OLD_TAB[query.tab] || query.tab;… */
  function viewEmployeePart2(L, OLD_TAB, TABS, docs, e, id, lv, main, openAssets, pendingReq, query) {
    const tab0 = OLD_TAB[query.tab] || query.tab;
    const tab = TABS.some(([k]) => k === tab0) ? tab0 : 'overview';
    const val = (f, v) => (!v ? '—' : f.type === 'date' ? SF.fmtDate(v) : f.type === 'number' ? fmtNum(v) : v);
    const box = (ic, color, label, v, ltr) =>
      `<div class="emp-box"><span class="b-ic" style="--m:${color}">${icon(ic)}</span><div style="min-width:0"><small>${label}</small><b${ltr ? ' dir="ltr" style="text-align:right"' : ''}>${esc(v || '—')}</b></div></div>`;
    const stat = (label, ic, color, v, cls = '') =>
      `<div class="emp-stat ${cls}"><div><div class="s-v">${v}</div><div class="s-l">${label}</div></div><span class="b-ic" style="--m:${color}">${icon(ic)}</span></div>`;
    const docStat = (...args) => employeeDocStat(docs, stat, ...args);
    const secHead = (title, btn) => `<div class="emp-sec-h"><h3>${title}</h3>${btn || ''}</div>`;
    const editBtn = (k) => (e.editor ? `<button class="btn sm" data-esec="${k}" title="تعديل">✏️ تعديل</button>` : '');
    /* بطاقة حقول قسم (عدا الشارات التي تُعرض في بطاقة مستقلة) */
    const fieldsCard = (...args) => employeeFieldsCard(e, editBtn, secHead, val, ...args);
    /* سجل متكرر: جدول بأعمدته وأزرار التعديل والحذف */
    const listCard = (...args) => employeeListCard(L, e, lv, secHead, val, ...args);
    const numTile = (label, ic, color, v, unit) =>
      `<div class="emp-stat"><div><div class="s-v">${v} <small>${unit || ''}</small></div><div class="s-l">${label}</div></div><span class="b-ic" style="--m:${color}">${icon(ic)}</span></div>`;
    const SECS = {
      personal: () => fieldsCard('personal') + fieldsCard('docs') + fieldsCard('address') + fieldsCard('education'),
      company: () =>
        fieldsCard('company', ['remoteSite', 'extraBranches']) +
        `<div class="card">${secHead('موقع الحضور عن بُعد', editBtn('company'))}<div class="emp-tags">${empChips(e.remoteSite, 'orange')}</div></div>` +
        `<div class="card">${secHead('فروع إضافية', editBtn('company'))}<div class="emp-tags">${empChips(e.extraBranches, 'purple')}</div></div>`,
      salary: (...args) => employeeSalary(e, editBtn, secHead, ...args),
      insurance: () => fieldsCard('insurance'),
      licenses: () => listCard('licenses'),
      team: (...args) => employeeTeam(e, secHead, ...args),
      periods: () => listCard('periods', { sort: (a, b) => String(b.from).localeCompare(String(a.from)) }),
      leaves: (...args) => employeeLeaves(e, listCard, lv, numTile, ...args),
      courses: (...args) => employeeCourses(L, listCard, numTile, ...args),
      evaluations: (...args) => employeeEvaluations(L, listCard, numTile, ...args),
      files: (...args) => employeeFiles(e, secHead, ...args),
      /* السيرة الذاتية: تتكون تلقائياً من بيانات الموظف ومؤهلاته ودوراته ورخصه */
      cv: () =>
        `<div class="card">${secHead('السيرة الذاتية', `<button type="button" class="btn sm" id="eCvPrint">${icon('printer')} طباعة / PDF</button>`)}<div class="cv" id="eCv">${empCvHtml(e)}</div></div>`,
      dependents: () => listCard('dependents'),
      contracts: () =>
        ((e.lists || {}).contracts || []).length
          ? listCard('contracts', { sort: (a, b) => String(b.from).localeCompare(String(a.from)) })
          : '',
      assets: (...args) => employeeAssets(L, e, openAssets, secHead, ...args),
      penalties: (...args) => employeePenalties(e, listCard, ...args),
      requests: () =>
        `<div class="card">${secHead('طلبات الموظف في النظام')}${e.iqama ? '' : '<div class="muted">سجّل رقم الهوية / الإقامة للموظف لتظهر طلباته</div>'}${e.requests.length ? requestsTable(e.requests) : e.iqama ? empEmpty('لا توجد طلبات بنفس رقم الهوية / الإقامة') : ''}</div>`,
      notes: () => fieldsCard('notes'),
      /* السجل الشامل: الطلبات والانتقالات والمباشرات والإجازات والنشاط بترتيب زمني، مع تصفية بالنوع */
      timeline: (...args) => employeeTimeline(e, secHead, ...args),
      log: () =>
        `<div class="card">${secHead('النشاط الأخير')}${e.log.length ? `<ul class="timeline">${e.log.map((h) => `<li><b>${esc(h.action)}</b><div class="when">${esc(h.by)} — ${esc(dt(h.at))}</div>${h.detail ? `<div class="note">${esc(h.detail)}</div>` : ''}</li>`).join('')}</ul>` : empEmpty('لا يوجد نشاط مسجل')}</div>`,
    };
    /* نظرة عامة: التنبيهات، أهم البيانات، آخر الطلبات */
    return viewEmployeePart(L, SECS, TABS, box, docStat, docs, e, editBtn, id, lv, main, openAssets, pendingReq, query, secHead, stat, tab);
  }
  /* penalties من viewEmployee (يأخذ e، listCard من الصفحة) */
  function employeePenalties(e, listCard) {
    const ded = e.requests.filter((r) => isForm(r, 'managerDeduction') || isForm(r, 'legalDeductionDecision'));
    return listCard('penalties', {
      sort: (a, b) => String(b.date).localeCompare(String(a.date)),
      after: ded.length
        ? `<h4 class="b-sec" style="margin-top:16px">خصومات مرفوعة في النظام (بنفس رقم الهوية)</h4>${requestsTable(ded)}`
        : '',
    });
  }
  /* evaluations من viewEmployee (يأخذ L، listCard، numTile من الصفحة) */
  function employeeEvaluations(L, listCard, numTile) {
    const s = L('evaluations').map((x) => Number(x.score) || 0);
    const avg = s.length ? Math.round((s.reduce((a, x) => a + x, 0) / s.length) * 10) / 10 : 0;
    return listCard('evaluations', {
      title: 'التقييم',
      sort: (a, b) => String(b.date).localeCompare(String(a.date)),
      before: `<div class="emp-stats" style="margin-top:0">${numTile('الأداء العام (المتوسط)', 'chart', '#f2734d', `${avg}%`)}${numTile('أعلى مستوى تم تحقيقه', 'chart', '#3b9fd6', `${s.length ? Math.max(...s) : 0}%`)}${numTile('أدنى مستوى تم تحقيقه', 'chart', '#e0435a', `${s.length ? Math.min(...s) : 0}%`)}${numTile('التقييمات الإجمالية', 'checkCircle', '#7c5cd6', s.length)}</div>`,
    });
  }
  /* team من viewEmployee (يأخذ e، secHead من الصفحة) */
  function employeeTeam(e, secHead) {
    const t = e.team;
    const grid = (xs) => `<div class="emp-grid">${xs.map((x) => empCard(x)).join('')}</div>`;
    return `<div class="card">${secHead('فريق العمل')}<input class="in" id="tmQ" placeholder="ابحث..." style="margin-bottom:12px">
          <div id="tmBox">${t.manager ? `<h4 class="b-sec">المدير المباشر</h4>${grid([t.manager])}` : e.manager ? `<div class="muted" style="margin-bottom:10px">المدير المباشر: ${esc(e.manager)} (غير مسجل في السجل باسمه أو رقمه الوظيفي)</div>` : ''}
          ${t.peers.length ? `<h4 class="b-sec">الزملاء تحت نفس المدير (${t.peers.length})</h4>${grid(t.peers)}` : ''}
          ${t.reports.length ? `<h4 class="b-sec">المرؤوسون (${t.reports.length})</h4>${grid(t.reports)}` : ''}
          ${!t.manager && !t.peers.length && !t.reports.length ? empEmpty('سجّل "المدير المباشر" في تفاصيل الشركة (اسمه أو رقمه الوظيفي كما في السجل) ليظهر فريق العمل') : ''}</div></div>`;
  }
  /* courses من viewEmployee (يأخذ L، listCard، numTile من الصفحة) */
  function employeeCourses(L, listCard, numTile) {
    const h = L('courses').map((x) => Number(x.hours) || 0);
    return listCard('courses', {
      sort: (a, b) => String(b.date).localeCompare(String(a.date)),
      before: `<div class="emp-stats" style="margin-top:0">${numTile(
        'إجمالي ساعات التدريب',
        'book',
        '#f2734d',
        h.reduce((a, x) => a + x, 0),
        'الساعات',
      )}${numTile('أطول دورة', 'chart', '#3b9fd6', h.length ? Math.max(...h) : 0, 'الساعات')}${numTile('أقصر دورة', 'chart', '#e0435a', h.length ? Math.min(...h) : 0, 'الساعات')}</div>`,
    });
  }
  /* salary من viewEmployee (يأخذ e، editBtn، secHead من الصفحة) */
  function employeeSalary(e, editBtn, secHead) {
    const fs = SF.EMP_SECTIONS.find(([x]) => x === 'salary')[2];
    const n = (k) => Number(e[k]) || 0;
    const gross = fs.filter((f) => !SF.EMP_DED.includes(f.key) && f.type === 'number').reduce((a, f) => a + n(f.key), 0);
    const ded = SF.EMP_DED.reduce((a, k) => a + n(k), 0);
    const net = gross - ded;
    const pct = gross ? Math.min(100, (ded / gross) * 100) : 0;
    return `<div class="card">${secHead('تفاصيل الراتب', editBtn('salary'))}<div class="emp-salary">
          <div class="emp-donut-box"><div class="emp-donut" style="background:conic-gradient(var(--bad) 0 ${pct}%, var(--info) ${pct}% 100%)"><span>${fmtNum(net)}<small>الصافي</small></span></div>
            <div class="emp-legend"><span><i style="background:var(--info)"></i>الصافي</span><span><i style="background:var(--bad)"></i>الحسميات</span></div></div>
          <div><div class="emp-fields" style="grid-template-columns:repeat(2,minmax(0,1fr))">${fs.map((f) => `<div class="emp-f"><small>${esc(f.label)}</small><b class="${SF.EMP_DED.includes(f.key) ? 'bad-t' : ''}"${f.type === 'number' ? '' : ' dir="ltr" style="text-align:right"'}>${f.type === 'number' ? empMoney(e[f.key]) : esc(e[f.key] || '—')}</b></div>`).join('')}</div>
            <div class="emp-sal-tot"><div class="g"><small>إجمالي الراتب</small><b>${empMoney(gross)}</b></div><div class="d"><small>الحسميات</small><b>${empMoney(ded)}</b></div><div class="n"><small>الصافي</small><b>${empMoney(net)}</b></div></div></div>
        </div></div>`;
  }
  /* assets من viewEmployee (يأخذ L، e، openAssets، secHead من الصفحة) */
  function employeeAssets(L, e, openAssets, secHead) {
    const rows = L('assets');
    return `<div class="card">${secHead(`العهد العينية (${openAssets} لدى الموظف)`, e.editor ? '<button class="btn sm primary" data-ladd="assets">➕ إضافة عهدة</button>' : '')}
          ${
            rows.length
              ? `<div class="emp-grid">${rows
                  .slice()
                  .reverse()
                  .map(
                    (
                      r,
                    ) => `<div class="emp-card emp-asset${r.returned ? ' ret' : ''}"><div class="emp-top"><span class="emp-av">${icon('boxes')}</span><div class="emp-id"><b class="emp-name">${esc(r.name)}</b><div class="emp-title">${esc(r.type || '')}</div></div><span class="chip ${r.returned ? 'cancelled' : 'approved'}">${r.returned ? 'مُرجعة' : 'معيّنة'}</span></div>
            <div class="emp-contact"><div><small>الحالة</small><b>${esc(r.status || '—')}</b></div><div><small>تم التعيين بواسطة</small><b>${esc(r.by || '—')}</b></div><div><small>تاريخ التعيين</small><b>${esc(r.date ? SF.fmtDate(r.date) : '—')}</b></div><div><small>${r.returned ? 'تاريخ الإرجاع' : 'الوصف'}</small><b>${esc(r.returned ? SF.fmtDate(r.returned) : r.desc || '—')}</b></div></div>
            ${e.editor ? `<div class="emp-foot"><span></span><span class="row" style="gap:6px"><button class="btn sm ghost" data-led="assets:${r.id}" title="تعديل / إرجاع">✏️</button><button class="btn sm ghost" data-ldel="assets:${r.id}" title="حذف">🗑️</button></span></div>` : ''}</div>`,
                  )
                  .join('')}</div>`
              : empEmpty('لا توجد عهد مسجلة للموظف')
          }</div>`;
  }
  /* timeline من viewEmployee (يأخذ e، secHead من الصفحة) */
  function employeeTimeline(e, secHead) {
    const T = e.timeline || [],
      K = ['طلب', 'انتقال', 'مباشرة', 'إجازة', 'نشاط'];
    const ICON = { طلب: 'file', انتقال: 'forward', مباشرة: 'checkCircle', إجازة: 'calendar', نشاط: 'list' };
    const n = (k) => T.filter((x) => x.kind === k).length;
    return `<div class="card" id="eTl">${secHead(`السجل (${T.length})`)}
          <div class="tl-f"><button type="button" class="on" data-tlk="">الكل <b>${T.length}</b></button>${K.filter(n)
            .map(
              (k) =>
                `<button type="button" data-tlk="${k}">${k === 'طلب' ? 'الطلبات' : k === 'انتقال' ? 'الانتقالات' : k === 'مباشرة' ? 'المباشرات' : k === 'إجازة' ? 'الإجازات' : 'النشاط'} <b>${n(k)}</b></button>`,
            )
            .join('')}</div>
          ${
            T.length
              ? `<ul class="timeline etl">${T.map(
                  (
                    h,
                  ) => `<li data-k="${esc(h.kind)}" class="k-${K.indexOf(h.kind)}"><span class="etl-k">${icon(ICON[h.kind] || 'list')}${esc(h.kind)}</span><b>${h.reqId ? `<a href="#/req/${h.reqId}">${esc(h.title)}</a> <bdi dir="ltr" class="muted">${esc(h.serial || '')}</bdi>` : esc(h.title)}</b>${h.status ? ` <span class="chip">${esc(h.status)}</span>` : ''}
            <div class="when">${h.by ? `${esc(h.by)} — ` : ''}${esc(/T/.test(h.at || '') ? dt(h.at) : SF.fmtDate(h.at))}</div>${h.detail ? `<div class="note">${esc(h.detail)}</div>` : ''}</li>`,
                ).join('')}</ul>`
              : empEmpty('لا يوجد سجل')
          }</div>`;
  }
  /* files من viewEmployee (يأخذ e، secHead من الصفحة) */
  function employeeFiles(e, secHead) {
    const fileLi = (f) =>
      `<li><a href="/api/employees/${e.id}/files/${f.id}" target="_blank">📎 ${esc(f.name)}</a><span class="row"><small class="muted">${Math.ceil(f.size / 1024)} KB — ${esc(f.by || '')} — ${esc(dt(f.at))}</small>${e.editor ? `<button class="btn sm ghost" data-fdel="${f.id}" title="حذف">✕</button>` : ''}</span></li>`;
    const certL = new Set(SF.EMP_CERTS.map((c) => c.l));
    /* المستندات المصنفة: الماجستير والدكتوراه والدراسات العليا تظهر عند تسجيلها للموظف وتكون إلزامية */
    const cats = SF.EMP_CERTS.filter((c) => !c.need || SF.certRequired(e, c) || SF.certFiles(e, c).length);
    return `<div class="card">${secHead('المستندات')}<div class="ed-cats">${cats
      .map((c) => {
        const fl = SF.certFiles(e, c),
          req = SF.certRequired(e, c);
        return `<div class="ed-cat${req && !fl.length ? ' miss' : fl.length ? ' ok' : ''}"><div class="ed-h"><b>${icon(fl.length ? 'checkCircle' : req ? 'alert' : 'file')} ${esc(c.l)}</b>
            <span class="chip ${fl.length ? 'approved' : req ? 'rejected' : ''}">${fl.length ? 'مرفوع' : req ? 'إلزامي — غير مرفوع' : 'غير مرفوع'}</span>
            ${e.editor ? `<label class="btn sm${fl.length ? ' ghost' : ' primary'}" style="cursor:pointer">⬆ ${fl.length ? 'إضافة' : 'رفع'}<input type="file" data-efcat="${esc(c.l)}" accept="${ACCEPT}" hidden></label>` : ''}</div>
            ${fl.length ? `<ul class="files">${fl.slice().reverse().map(fileLi).join('')}</ul>` : ''}</div>`;
      })
      .join('')}</div></div>
        <div class="card">${secHead('مستندات أخرى')}${e.editor ? `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px"><input class="in" id="efLabel" placeholder="اسم المستند (مثال: العقد، شهادة خبرة، رخصة مهنية)" style="flex:1;min-width:220px"><label class="btn primary" style="cursor:pointer">⬆ رفع مستند<input type="file" id="efFile" accept="${ACCEPT}" multiple hidden></label></div>` : ''}
        ${
          e.files.filter((f) => !certL.has(f.label)).length
            ? `<ul class="files">${e.files
                .filter((f) => !certL.has(f.label))
                .slice()
                .reverse()
                .map(
                  (f) =>
                    `<li><a href="/api/employees/${e.id}/files/${f.id}" target="_blank">📎 ${f.label ? `<b>${esc(f.label)}:</b> ` : ''}${esc(f.name)}</a><span class="row"><small class="muted">${Math.ceil(f.size / 1024)} KB — ${esc(f.by || '')} — ${esc(dt(f.at))}</small>${e.editor ? `<button class="btn sm ghost" data-fdel="${f.id}" title="حذف">✕</button>` : ''}</span></li>`,
                )
                .join('')}</ul>`
            : empEmpty('لا توجد مستندات أخرى')
        }</div>`;
  }
  /* leaves من viewEmployee (يأخذ e، listCard، lv، numTile من الصفحة) */
  function employeeLeaves(e, listCard, lv, numTile) {
    return listCard('leaves', {
      sort: (a, b) => String(b.from).localeCompare(String(a.from)),
      before: `<div class="emp-stats" style="margin-top:0">
          ${numTile('إجمالي مدة الخدمة بالشركة', 'users', '#3b9fd6', `${lv.span ? `${lv.span.y} <small>سنة</small> ${lv.span.m} <small>شهر</small> ${lv.span.d} <small>يوم</small>` : '<small>سجّل تاريخ الانضمام</small>'}`)}${numTile(`رصيد الإجازة السنوي (${lv.done5 ? 'في السنة السادسة فأكثر' : `21 يوماً حتى نهاية السنة الخامسة، ثم 30 من ${lv.fiveAt ? SF.fmtDate(lv.fiveAt) : 'بداية السنة السادسة'}`})`, 'bookOpen', '#0e9f9a', lv.rate, 'يوم')}
          ${numTile(`مدة الخدمة بعد آخر عودة${lv.ret ? ` (من ${SF.fmtDate(lv.ret)})` : ''}`, 'rotate', '#7c5cd6', `${lv.retSpan ? `${lv.retSpan.y} <small>سنة</small> ${lv.retSpan.m} <small>شهر</small> ${lv.retSpan.d} <small>يوم</small>` : '<small>سجّل تاريخ الانضمام</small>'}`)}${numTile('الرصيد المستحق بعد آخر عودة', 'checkCircle', '#16a34a', lv.entitled.toFixed(2), 'يوم')}
          ${numTile('الرصيد المرحل', 'rotate', '#3b9fd6', lv.prev, 'يوم')}${numTile('السنوية المستهلكة بعد آخر عودة', 'list', '#f5a03a', lv.usedAfter, 'يوم')}
          ${numTile('رصيد الإجازة المتاح', 'checkCircle', lv.balance < 0 ? '#dc2626' : '#0e9f9a', lv.balance.toFixed(2), 'يوم')}${e.salary && lv.daily ? numTile('قيمة بدل الإجازة (على الأساسي)', 'wallet', '#7c3aed', fmtNum(lv.value.total), 'ريال') : ''}${numTile('أيام الإجازات المرضية المستهلكة (سنة الخدمة الحالية)', 'alert', '#0891b2', lv.sickUsed, 'يوم')}</div>
          ${
            lv.ret
              ? (() => {
                  /* الرصيد الحالي مفصلاً: المرحل + المستحق على 21 حتى إتمام 5 سنوات + المستحق على 30 بعدها - المستهلك، وقيمة كل بند على آخر راتب أساسي */
                  /* نهاية السنة الخامسة = اليوم السابق لبداية السنة السادسة (ذكرى التعيين الخامسة) */
                  const fiveEnd = lv.fiveAt ? new Date(Date.parse(`${lv.fiveAt}T00:00:00Z`) - 86400000).toISOString().slice(0, 10) : '';
                  const showVal = !!(e.salary && lv.daily),
                    m = (n) => (showVal ? `<td class="num">${fmtNum(n)} ريال</td>` : '');
                  const row = (l, d, v, cls = '') =>
                    `<tr class="${cls}"><td>${l}</td><td class="num"><b>${Number(d).toFixed(2)}</b> يوم</td>${m(v)}</tr>`;
                  return `<h4 class="b-sec">رصيد الإجازة الحالي${showVal ? ' وقيمة بدل الإجازة' : ''}</h4>
              ${showVal ? `<div class="hint" style="margin-bottom:6px">الأجر اليومي = آخر راتب أساسي (${fmtNum(e.basic)} ريال) ÷ 30 = <b>${fmtNum(lv.daily)} ريال</b></div>` : ''}
              <table class="tbl lv-tbl" style="margin-bottom:14px"><thead><tr><th>البند</th><th>الأيام</th>${showVal ? '<th>القيمة</th>' : ''}</tr></thead><tbody>
              ${row('الرصيد المرحل', lv.prev, lv.value.prev)}
              ${lv.acc21 || !lv.done5 ? row(`المستحق من ${SF.fmtDate(lv.ret)} حتى ${lv.done5 ? `نهاية السنة الخامسة (${SF.fmtDate(fiveEnd)})` : 'اليوم'} — 21 يوماً سنوياً`, lv.acc21, lv.value.acc21) : ''}
              ${lv.done5 ? row(`المستحق من بداية السنة السادسة (${SF.fmtDate(lv.fiveAt > lv.ret ? lv.fiveAt : lv.ret)}) — 30 يوماً سنوياً`, lv.acc30, lv.value.acc30) : ''}
              ${lv.usedAfter ? row('نخصم: الإجازات السنوية المستهلكة بعد آخر عودة', -lv.usedAfter, -lv.value.used, 'bad-t') : ''}
              ${row('<b>إجمالي رصيد الإجازة المتاح</b>', lv.balance, lv.value.total, 'lv-tot')}</tbody></table>
              ${!lv.done5 && lv.fiveAt ? `<div class="hint" style="margin:-8px 0 12px">تنتهي السنة الخامسة للموظف في ${SF.fmtDate(fiveEnd)}، ومن بداية السنة السادسة (${SF.fmtDate(lv.fiveAt)}) يحسب النظام رصيده على 30 يوماً سنوياً.</div>` : ''}
              ${e.salary && !lv.daily ? '<div class="hint" style="margin:-8px 0 12px">سجّل الراتب الأساسي في تفاصيل الراتب لحساب قيمة بدل الإجازة.</div>' : ''}`;
                })()
              : ''
          }
          ${
            lv.span
              ? `<h4 class="b-sec">رصيد الإجازة في حالة عدم النزول من بداية التعيين</h4><table class="tbl" style="margin-bottom:14px"><tbody>
            <tr><td>رصيد أول 5 سنوات (21 يومًا سنويًا)</td><td><b>${lv.first.toFixed(2)}</b> يومًا</td></tr>
            <tr><td>تفصيل السنوات الإضافية بعد 5 سنوات</td><td>${lv.extraSpan.y} سنة، ${lv.extraSpan.m} شهر، ${lv.extraSpan.d} يوم</td></tr>
            <tr><td>رصيد السنوات الإضافية (30 يومًا سنويًا)</td><td><b>${lv.extra.toFixed(2)}</b> يومًا</td></tr>
            <tr><td><b>إجمالي رصيد الإجازة المستحق في حالة عدم النزول من بداية التعيين</b></td><td><b>${lv.noLeave.toFixed(2)}</b> يومًا</td></tr></tbody></table>`
              : '<div class="hint" style="margin-bottom:12px">سجّل تاريخ الانضمام في تفاصيل العمل لحساب مدة الخدمة ورصيد الإجازة.</div>'
          }
          <div class="hint" style="margin-bottom:12px">نفس طريقة برنامج التصفية: المستحق = أيام الخدمة منذ مباشرة العمل بعد آخر إجازة × 21 ÷ 365 حتى تاريخ إتمام 5 سنوات، وما بعده × 30 ÷ 365. تاريخ المباشرة من تفاصيل العمل، وإلا اليوم التالي لنهاية آخر إجازة سنوية في السجل، وإلا تاريخ الانضمام. والمتاح = الرصيد المرحل + المستحق - الإجازات السنوية بعد المباشرة. وقيمة بدل الإجازة = الأيام × (آخر راتب أساسي ÷ 30).</div>`,
    });
  }
  /* جزء من viewEmployee: return viewEmployeePart6(… */
  function viewEmployeePart(
    L,
    SECS,
    TABS,
    box,
    docStat,
    docs,
    e,
    editBtn,
    id,
    lv,
    main,
    openAssets,
    pendingReq,
    query,
    secHead,
    stat,
    tab,
  ) {
    return viewEmployeePart6(
      L,
      SECS,
      TABS,
      box,
      docStat,
      docs,
      e,
      editBtn,
      id,
      lv,
      main,
      openAssets,
      pendingReq,
      query,
      secHead,
      stat,
      tab,
    );
  }
  /* أجزاء ملف الموظف (2) (employee-file-kit-2.js) */
  const { employeeValue, viewEmployeePart6, employeeDocStat, employeeFieldsCard, employeeListCard } = window.SES_PAGE_KITS[
    'employee-file-2'
  ](S, { bindEmpAcc, empRowModal, printEmpCv, viewEmployee });

  return { viewEmployeePrint, viewEmployee };
};
