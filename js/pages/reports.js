'use strict';
/* صفحة «reports» (viewReports) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['reports'] = function (S) {
  const { $, $$, REPORTS, SF, esc, head, icon, loginStatsModal, navItems, normAr, shell, state } = S;
  function viewReports(query) {
    const flat = (list) => list.flatMap((it) => (Array.isArray(it) ? [it[0]] : flat(it.items)));
    const mine = new Set([...flat(navItems()), ...(state.empAffairs || []).map((x) => x[0])].map((h) => String(h).split('?')[0]));
    const has = (h) =>
      h === '@logins'
        ? SF.cap(state.user, 'loginStats')
        : h === '#/report'
          ? mine.has('#/dashboard')
          : h === '#/mudad-pay'
            ? state.user.role === 'admin' ||
              SF.cap(state.user, 'payroll') ||
              SF.cap(state.user, 'approvePayroll') ||
              SF.cap(state.user, 'docs')
            : mine.has(h.split('?')[0]);
    const secs = REPORTS.map(([t, ic, list]) => [t, ic, list.filter(([h]) => has(h))]).filter(([, , l]) => l.length);
    const total = secs.reduce((k, [, , l]) => k + l.length, 0);
    const main = shell(
      `${head('التقارير', `${total} تقرير متاح لك — «تنزيل» يفتح صفحة التقرير ويصدره مباشرة، و«فتح» لاختيار الفلاتر أولاً`)}
      <div class="card rp-tools"><input class="in" id="rpQ" type="search" placeholder="ابحث عن تقرير..." value="${esc(query.q || '')}" autocomplete="off"></div>
      ${
        secs.length
          ? secs
              .map(
                ([t, ic, list]) =>
                  `<section class="rp-sec"><h2 class="nf-sh">${icon(ic)}${esc(t)}<small>${list.length} تقرير</small></h2><div class="rp-grid">${list
                    .map(
                      ([h, btn, title, desc, fmt]) => `<div class="card rp-card" data-s="${esc(normAr(`${t} ${title} ${desc}`))}">
        <div class="rp-top"><b>${esc(title)}</b>${fmt ? `<span class="chip">${esc(fmt)}</span>` : ''}</div><div class="muted rp-desc">${esc(desc)}</div>
        <div class="row rp-acts">${h === '@logins' ? '<button class="btn sm primary" data-logins>📊 عرض</button>' : `${btn ? `<button class="btn sm primary" data-go="${h}" data-btn="${esc(btn)}">⬇ تنزيل</button>` : ''}<a class="btn sm" href="${h}">فتح</a>`}</div></div>`,
                    )
                    .join('')}</div></section>`,
              )
              .join('')
          : '<div class="empty">لا توجد تقارير متاحة لك</div>'
      }
      <div class="empty" id="rpNone" hidden>لا يوجد تقرير يطابق البحث</div>`,
      '#/reports',
    );
    $$('[data-go]', main).forEach((b) => {
      b.onclick = () => {
        try {
          sessionStorage.setItem('report:click', b.dataset.btn);
        } catch {
          /* تجاهل */
        }
        location.hash = b.dataset.go;
      };
    });
    $$('[data-logins]', main).forEach((b) => {
      b.onclick = () => loginStatsModal();
    });
    const q = $('#rpQ', main);
    q.oninput = () => {
      const w = normAr(q.value).split(' ').filter(Boolean);
      $$('.rp-card', main).forEach((c) => {
        c.hidden = !w.every((x) => c.dataset.s.includes(x));
      });
      $$('.rp-sec', main).forEach((s) => {
        s.hidden = !$$('.rp-card', s).some((c) => !c.hidden);
      });
      $('#rpNone', main).hidden = !w.length || $$('.rp-card', main).some((c) => !c.hidden);
    };
    if (q.value) q.oninput();
  }

  return { viewReports };
};
