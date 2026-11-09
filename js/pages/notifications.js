'use strict';
/* صفحة «notifications» (viewNotifications، viewNotices) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['notifications'] = function (S) {
  const {
    $,
    $$,
    NOTIF_IC,
    SF,
    announceModal,
    api,
    askYesNo,
    dt,
    esc,
    head,
    isAdmin,
    readNotice,
    refreshBell,
    setBell,
    shell,
    state,
    toast,
  } = S;
  async function viewNotifications(only) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/notifications');
    const d = await api('GET', '/api/notifications');
    setBell(d.unread);
    const items = only ? d.items.filter((n) => !n.read) : d.items;
    main.innerHTML = `${head('الإشعارات', d.unread ? `لديك ${d.unread} إشعار غير مقروء` : 'كل الإشعارات مقروءة', `${d.unread ? '<button class="btn" id="nfAll">✔ تعليم الكل كمقروء</button>' : ''}${SF.cap(state.user, 'announce') ? '<button class="btn primary" id="nfAnn">📢 إرسال تعميم</button>' : ''}`)}
      <div class="tabs"><a href="#" data-nf="0" class="${only ? '' : 'on'}">الكل (${d.items.length})</a><a href="#" data-nf="1" class="${only ? 'on' : ''}">غير المقروء (${d.unread})</a></div>
      <div class="card" style="padding:0"><div class="np-list nf-list">${
        items
          .map(
            (n) => `<a class="np-item${n.read ? '' : ' new'} k-${esc(n.kind)}" data-n="${n.id}" data-link="${esc(n.link || '')}">
          <span class="np-ic">${NOTIF_IC[n.kind] || '🔔'}</span>
          <span class="np-txt"><b${n.kind === 'announce' ? ' data-noi18n' : ''}>${esc(n.title)}</b>${n.text ? `<span>${esc(n.text).replace(/\n/g, '<br>')}</span>` : ''}<small>${esc(dt(n.at))}${n.by ? ` — ${esc(n.by)}` : ''}</small></span></a>`,
          )
          .join('') || '<div class="empty">لا توجد إشعارات</div>'
      }</div></div>`;
    $$('[data-nf]', main).forEach((a) => {
      a.onclick = (e) => {
        e.preventDefault();
        viewNotifications(a.dataset.nf === '1');
      };
    });
    if ($('#nfAll'))
      $('#nfAll').onclick = async () => {
        await api('POST', '/api/notifications/read', {});
        refreshBell();
        viewNotifications(only);
      };
    if ($('#nfAnn')) $('#nfAnn').onclick = () => announceModal();
    $$('[data-n]', main).forEach((a) => {
      a.onclick = async () => {
        try {
          await api('POST', '/api/notifications/read', { ids: [a.dataset.n] });
        } catch {
          /* تجاهل */
        }
        const n = d.items.find((x) => x.id === a.dataset.n);
        refreshBell();
        if (n && (n.kind === 'announce' || !n.link)) {
          readNotice(n);
          a.classList.remove('new');
          return;
        }
        if (a.dataset.link) location.hash = a.dataset.link;
      };
    });
  }

  async function viewNotices() {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/notices');
    const list = await api('GET', '/api/notices');
    const adm = isAdmin(),
      canAnn = SF.cap(state.user, 'announce');
    main.innerHTML = `${head('مركز التعاميم', adm ? 'كل التعاميم المرسلة ومن قرأها' : canAnn ? 'التعاميم الموجهة إليك وما أرسلته ومن قرأه' : 'التعاميم الموجهة إليك (للقراءة)', canAnn ? '<button class="btn primary" id="nNew">📢 تعميم جديد</button>' : '')}
      <div class="notice-list">${
        list
          .map(
            (n) => `<div class="card notice-card${n.read ? '' : ' new'}" data-n="${n.id}">
          <div class="nc-head"><b data-noi18n>${n.read ? '' : '<i class="dot"></i>'}${esc(n.title)}</b><small class="muted">${esc(n.byName || '')} — ${esc(dt(n.at))}${n.mine ? ` — إلى: ${esc(n.toLabel || '')}` : ''}</small></div>
          <div class="nc-text">${esc(n.text || '').slice(0, 220)}${(n.text || '').length > 220 ? '…' : ''}</div>
          <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" data-open="${n.id}">📖 قراءة</button>
            ${n.mine ? `<button class="btn sm ghost" data-readers="${n.id}">👁 قرأه ${n.readCount} من ${n.total}</button><button class="btn sm bad" data-del="${n.id}">حذف</button>` : ''}</div></div>`,
          )
          .join('') || '<div class="card empty">لا توجد تعاميم</div>'
      }</div>`;
    if ($('#nNew')) $('#nNew').onclick = () => announceModal();
    $$('[data-open]', main).forEach((b) => {
      b.onclick = () => {
        const n = list.find((x) => x.id === b.dataset.open);
        readNotice({ ...n, kind: 'announce', by: n.byName, noticeId: n.id });
      };
    });
    $$('[data-readers]', main).forEach((b) => {
      b.onclick = async () => {
        const d = await api('GET', `/api/notices/${b.dataset.readers}`);
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        const done = d.readers.filter((r) => r.at),
          not = d.readers.filter((r) => !r.at);
        bg.innerHTML = `<div class="modal"><h3>من قرأ: ${esc(d.title)}</h3>
          <p><b>قرأه (${done.length}):</b><br>${done.map((r) => `<span class="chip approved" title="${esc(dt(r.at))}">${esc(r.name)}</span>`).join(' ') || '<span class="muted">لا أحد بعد</span>'}</p>
          <p><b>لم يقرأه (${not.length}):</b><br>${not.map((r) => `<span class="chip pending">${esc(r.name)}</span>`).join(' ') || '<span class="muted">قرأه الجميع</span>'}</p>
          <button class="btn" data-x>إغلاق</button></div>`;
        document.body.appendChild(bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        bg.onclick = (e) => {
          if (e.target === bg) bg.remove();
        };
      };
    });
    $$('[data-del]', main).forEach((b) => {
      b.onclick = async () => {
        if (!(await askYesNo('حذف هذا التعميم من مركز التعاميم وإشعارات الجميع؟'))) return;
        try {
          await api('DELETE', `/api/notices/${b.dataset.del}`);
          toast('تم حذف التعميم');
          viewNotices();
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
  }

  return { viewNotifications, viewNotices };
};
