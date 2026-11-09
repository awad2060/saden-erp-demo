'use strict';
/* صفحة «contacts» (viewContacts) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['contacts'] = function (S) {
  const { $, $$, WA_ICON, api, can, esc, head, icon, normAr, shell, state } = S;
  /* ---------- CONTACTS: دليل كل من على النظام ---------- */
  async function viewContacts(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/contacts');
    const list = await api('GET', '/api/contacts');
    const brs = [...new Set(list.map((c) => c.branch).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar'));
    const VK = `contacts-view:${state.user.id}`;
    let view = 'grid';
    try {
      view = localStorage.getItem(VK) === 'list' ? 'list' : 'grid';
    } catch {
      /* تجاهل */
    }
    main.innerHTML = `${head('CONTACTS', `${list.length} جهة اتصال — كل من على النظام`)}
      <div class="card"><div class="filters ct-filters"><input class="in" id="ctQ" type="search" placeholder="ابحث بالاسم أو المسمى أو الجوال أو البريد..." value="${esc(query.q || '')}" autocomplete="off">
        <select class="in" id="ctB"><option value="">كل الفروع والإدارات</option>${brs.map((b) => `<option>${esc(b)}</option>`).join('')}</select>
        <span class="ap-vw"><button type="button" data-vw="grid" title="بطاقات">${icon('grid')}</button><button type="button" data-vw="list" title="قائمة">${icon('list')}</button></span></div>
        <div id="ctList"></div></div>`;
    const card = (c) => {
      const av = c.photo && c.empId ? `<img src="/api/employees/${c.empId}/photo" alt="" loading="lazy" data-rmerr>` : '';
      /* الرقم الدولي للواتساب: 05xxxxxxxx ← 9665xxxxxxxx */
      const digits = String(c.phone || '')
        .replace(/\D/g, '')
        .replace(/^00/, '');
      const wa = /^05\d{8}$/.test(digits)
        ? `966${digits.slice(1)}`
        : /^5\d{8}$/.test(digits)
          ? `966${digits}`
          : digits.length >= 10
            ? digits
            : '';
      const tel = c.phone
        ? `<a class="ct-ph" href="tel:+${esc(wa || digits)}" dir="ltr" title="اتصال">${icon('phone')}<span>${esc(c.phone)}</span></a>`
        : '<span class="ct-ph muted">لا يوجد جوال</span>';
      const mail = c.email
        ? `<a class="ct-em" href="mailto:${esc(c.email)}" dir="ltr" title="${esc(c.email)}">${icon('mail')}<span>${esc(c.email)}</span></a>`
        : '<span class="ct-em muted">لا يوجد بريد</span>';
      const acts = `${wa ? `<a class="ct-act wa" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener" title="واتساب">${WA_ICON}</a>` : ''}${c.id !== state.user.id && can('chat') ? `<button type="button" class="ct-act" data-echat="${c.id}" title="دردشة سريعة">${icon('message')}</button>` : ''}`;
      return `<div class="ct-card"><span class="ct-av">${icon('user')}${av}</span><div class="ct-b"><div class="ct-nm"><b>${esc(c.name)}</b><small class="muted">${esc(c.title || '')}${c.branch ? ` · ${esc(c.branch)}` : ''}</small></div>
        <div class="ct-links">${tel}${mail}</div></div><div class="ct-acts">${acts}</div></div>`;
    };
    const draw = () => {
      const q = normAr($('#ctQ').value),
        b = $('#ctB').value;
      const rows = list.filter(
        (c) => (!b || c.branch === b) && (!q || normAr([c.name, c.title, c.branch, c.phone, c.email, c.empNo].join(' ')).includes(q)),
      );
      $('#ctList').innerHTML = rows.length
        ? `<div class="ct-grid${view === 'list' ? ' list' : ''}">${rows.map(card).join('')}</div>`
        : '<div class="empty">لا توجد نتائج</div>';
      $$('[data-vw]', main).forEach((x) => x.classList.toggle('on', x.dataset.vw === view));
    };
    $$('[data-vw]', main).forEach((x) => {
      x.onclick = () => {
        view = x.dataset.vw;
        try {
          localStorage.setItem(VK, view);
        } catch {
          /* تجاهل */
        }
        draw();
      };
    });
    $('#ctQ').oninput = draw;
    $('#ctB').onchange = draw;
    draw();
    $('#ctQ').focus();
  }

  return { viewContacts };
};
