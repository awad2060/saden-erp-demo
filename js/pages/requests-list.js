'use strict';
/* صفحة «requests-list» (viewList) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['requests-list'] = function (S) {
  const {
    $,
    SF,
    STATUS,
    allLabel,
    api,
    bindRows,
    can,
    downloadCsv,
    dt,
    esc,
    fmtNum,
    head,
    isAdmin,
    navFlat,
    refreshStats,
    requestsTable,
    shell,
    state,
    statusText,
    today,
  } = S;
  /* ---------- قوائم الطلبات ---------- */
  async function viewList(scope, query) {
    const titles = {
      mine: ['طلباتي', 'جميع الطلبات التي قمت برفعها'],
      inbox: isAdmin()
        ? ['الطلبات الجارية', 'كل الطلبات قيد الاعتماد — يمكنك اتخاذ القرار في أي مرحلة']
        : ['بانتظار اعتمادي', 'الطلبات التي وصلت إليك في مسار الاعتماد'],
      all: [allLabel(state.user), 'سجل الطلبات'],
      register: [
        'سجل الخطابات',
        isAdmin()
          ? 'كل الخطابات المعتمدة نهائياً في جميع الفروع — اختر الفرع من القائمة'
          : `الخطابات المعتمدة نهائياً لفرع ${state.user.branch || ''} — للاطلاع والطباعة فقط`,
      ],
    };
    await viewListPart(query, scope, titles);
  }
  /* جزء من viewList: await refreshStats();… */
  async function viewListPart(query, scope, titles) {
    await refreshStats();
    /* القائمة المفلترة من قسم الموارد البشرية تُعلَّم في القائمة الجانبية */
    const hrHash = query.type ? `#/${scope}?type=${query.type}` : '';
    const main = shell('<div class="empty">جاري التحميل...</div>', hrHash && navFlat().some(([h]) => h === hrHash) ? hrHash : `#/${scope}`);
    const list = await api('GET', `/api/requests?scope=${scope}`);
    const branches = [...new Set(list.map((r) => r.branch).filter(Boolean))].sort();
    const todayStr = today();
    const appDay = (r) => (r.approvedAt || r.updatedAt || '').slice(0, 10);
    const tiles =
      scope === 'register'
        ? `<div class="stats">${[
            [list.filter((r) => appDay(r) === todayStr).length, 'اعتُمدت اليوم'],
            [list.filter((r) => appDay(r).slice(0, 7) === todayStr.slice(0, 7)).length, 'اعتُمدت هذا الشهر'],
            [list.length, 'إجمالي الخطابات المعتمدة'],
            [fmtNum(Math.round(list.reduce((s, r) => s + (Number(r.amount) || 0), 0) * 100) / 100), 'إجمالي المبالغ (ريال)'],
          ]
            .map(([n, l]) => `<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`)
            .join('')}</div>`
        : '';
    const newOfType =
      query.type && SF.byId[query.type] && can('new') && SF.formAllowed(state.user, query.type)
        ? `<a class="btn primary" href="#/new/${esc(query.type)}">➕ ${esc(SF.byId[query.type].title)}</a>`
        : '';
    renderViewList(branches, main, newOfType, query, scope, tiles, titles);
    if (query.status) $('#fs').value = query.status;
    if (query.type) $('#ft').value = query.type;
    let filtered = list;
    const apply = () => {
      const q = $('#fq').value.trim().toLowerCase(),
        t = $('#ft').value,
        s = $('#fs').value,
        b = $('#fb').value,
        d = $('#fd').value;
      filtered = list.filter(
        (r) =>
          (!t || r.type === t) &&
          (!s || r.status === s) &&
          (!b || r.branch === b) &&
          (!d || r.createdAt.slice(0, 10) >= d) &&
          (!q || [r.serial, r.typeTitle, r.summary, r.createdByName, r.branch].join(' ').toLowerCase().includes(q)),
      );
      $('#lt').innerHTML = requestsTable(filtered);
      $('#lcount').textContent = `عدد النتائج: ${filtered.length}`;
      bindRows($('#lt'));
    };
    ['fq', 'ft', 'fs', 'fb', 'fd'].forEach((id) => {
      $('#' + id).oninput = apply;
    });
    wireFclr(apply);
    $('#csvBtn').onclick = () =>
      downloadCsv(
        `طلبات_${today()}.csv`,
        [['رقم الطلب', 'نوع الطلب', 'البيان', 'الفرع', 'المبلغ', 'مقدم الطلب', 'تاريخ الرفع', 'آخر تحديث', 'الحالة']].concat(
          filtered.map((r) => [
            r.serial,
            r.typeTitle,
            r.summary,
            r.branch,
            r.amount,
            r.createdByName,
            dt(r.createdAt),
            dt(r.updatedAt),
            statusText(r),
          ]),
        ),
      );
    apply();
  }
  /* محتوى viewList (HTML) */
  function renderViewList(branches, main, newOfType, query, scope, tiles, titles) {
    main.innerHTML = `${head(query.type && SF.byId[query.type] ? `${titles[scope][0]} — ${esc(SF.byId[query.type].title)}` : titles[scope][0], titles[scope][1], newOfType + '<button class="btn" id="csvBtn">⬇ تصدير Excel (CSV)</button>')}
      ${tiles}<div class="card">
        <div class="filters">
          <input class="in" id="fq" placeholder="بحث بالرقم أو الاسم أو البيان...">
          <select class="in" id="ft"><option value="">كل الأنواع</option>${SF.FORMS.map((f) => `<option value="${f.id}">${esc(f.title)}</option>`).join('')}</select>
          <select class="in" id="fs"${scope === 'register' ? ' hidden' : ''}><option value="">كل الحالات</option><option value="pending">قيد الاعتماد</option>${Object.entries(
            STATUS,
          )
            .map(([k, v]) => `<option value="${k}">${v}</option>`)
            .join('')}</select>
          <select class="in" id="fb"${scope === 'register' && !isAdmin() ? ' hidden' : ''}><option value="">كل الفروع</option>${branches.map((b) => `<option>${esc(b)}</option>`).join('')}</select>
          <input class="in" type="date" id="fd" title="من تاريخ">
          <button class="btn ghost" id="fclr">مسح</button>
        </div>
        <div id="lt"></div><div class="muted" id="lcount" style="margin-top:10px;font-size:13px"></div>
      </div>`;
  }
  /* أحداث viewList: #fclr */
  function wireFclr(apply) {
    $('#fclr').onclick = () => {
      ['fq', 'ft', 'fs', 'fb', 'fd'].forEach((id) => {
        $('#' + id).value = '';
      });
      apply();
    };
  }

  return { viewList };
};
