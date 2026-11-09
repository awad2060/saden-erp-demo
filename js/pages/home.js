'use strict';
/* صفحة «home» (viewHome) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['home'] = function (S) {
  const { api, bindRows, esc, hbars, head, isAdmin, isApprover, refreshStats, requestsTable, shell, state } = S;
  /* ---------- الرئيسية ---------- */
  async function viewHome() {
    await refreshStats();
    const s = state.stats,
      u = state.user;
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/');
    const list = await api('GET', `/api/requests?scope=${u.role === 'accountant' ? 'mine' : 'all'}`);
    let tiles;
    if (u.role === 'accountant') {
      tiles = [
        [s.pending, 'طلبات قيد الاعتماد', '#/mine?status=pending'],
        [s.myReturned, 'معادة لي للتعديل', '#/mine?status=returned', s.myReturned > 0],
        ...(s.myClearance
          ? [[s.myClearance, 'ملفات بانتظار رفع المستند الموقّع (المخالصة / العرض الوظيفي / نموذج السلفة)', '#/mine?status=approved', true]]
          : []),
        [s.approved, 'طلبات معتمدة', '#/mine?status=approved'],
        [s.rejected, 'طلبات مرفوضة', '#/mine?status=rejected'],
      ];
    } else {
      tiles = [];
      if (isApprover()) tiles.push([s.inbox, 'بانتظار اعتمادك', '#/inbox', s.inbox > 0]);
      if (isApprover() || isAdmin())
        if (s.overdue) tiles.push([s.overdue, `متأخرة أكثر من ${state.config.overdueDays || 2} يوم`, '#/inbox', true]);
      tiles.push(
        [s.pending, 'قيد الاعتماد', '#/all?status=pending'],
        [s.approved, 'معتمدة نهائياً', '#/all?status=approved'],
        [s.returned, 'معادة للتعديل', '#/all?status=returned'],
        [s.rejected, 'مرفوضة', '#/all?status=rejected'],
      );
    }
    main.innerHTML = `
      ${head(`أهلاً ${esc(u.name)}`, `${esc(u.title || u.roleLabel)}${u.branch ? ` - فرع ${esc(u.branch)}` : ''}`, u.role === 'accountant' || isAdmin() ? '<a class="btn primary" href="#/new">➕ رفع طلب جديد</a>' : '')}
      <div class="stats">${tiles.map(([n, l, h, hi]) => `<a class="stat${hi ? ' hi' : ''}" href="${h}"><div class="n">${n || 0}</div><div class="l">${l}</div></a>`).join('')}</div>
      <div class="card"><h3>الطلبات الجارية عند كل معتمد</h3>
        ${
          s.waiting.length
            ? hbars(
                s.waiting.map((w) => ({ label: `${w.label} — ${w.name}`, value: w.count })),
                (v) => `${v} طلب`,
              )
            : '<div class="muted">لا توجد طلبات جارية حالياً</div>'
        }
      </div>
      <div class="card"><div class="row" style="justify-content:space-between"><h3>آخر الطلبات</h3><a href="${u.role === 'accountant' ? '#/mine' : '#/all'}">عرض الكل ←</a></div>
        ${requestsTable(list.slice(0, 8))}
      </div>`;
    bindRows(main);
  }

  return { viewHome };
};
