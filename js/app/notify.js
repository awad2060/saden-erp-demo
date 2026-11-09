/* الإشعارات والبريد الداخلي والمهام وإشعارات سطح المكتب */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, $$, state, dt, api, toast } = S;
  Object.assign(S, {
    setBell,
    openNotif,
    readNotice,
    loginStatsModal,
    setTopBadges,
    pushEndpoint,
    syncPush,
    refreshBell,
    announceModal,
    askYesNo,
    fitA4,
    fitLetters,
    refreshStats,
  });
  /* ---------- سياسة الاستخدام (عربي / إنجليزي) ----------
   * كل قسم: [العنوان، النص]. عند تعديلها يُغيَّر رقم الإصدار وتاريخ النفاذ */
  /* نص السياسة في public/js/policy.js (مشترك مع الخادم لعرضه في تطبيق الموبايل) */
  const POLICY = window.POLICY;

  /* ---------- شريط الإشعارات ---------- */
  const NOTIF_IC = { action: '📥', ok: '✅', warn: '↩', bad: '⛔', announce: '📢', info: '🔔', mail: '✉️' };
  function setBell(n) {
    $$('[data-bell]').forEach((b) => {
      const s = $('.bell-n', b);
      s.textContent = n > 99 ? '99+' : n;
      s.hidden = !n;
      b.title = n ? `${n} إشعار جديد` : 'الإشعارات';
    });
  }
  async function openNotif() {
    let box = $('#notifPanel');
    if (box) {
      box.remove();
      return;
    }
    box = document.createElement('div');
    box.id = 'notifPanel';
    box.className = 'notif-panel';
    box.innerHTML = '<div class="muted" style="padding:16px">جاري التحميل...</div>';
    document.body.appendChild(box);
    const close = (e) => {
      if (!box.contains(e.target) && !e.target.closest('[data-bell]')) {
        box.remove();
        document.removeEventListener('click', close, true);
      }
    };
    setTimeout(() => document.addEventListener('click', close, true));
    const draw = async () => {
      let d;
      try {
        d = await api('GET', '/api/notifications');
      } catch (err) {
        box.innerHTML = `<div class="err">${esc(err.message)}</div>`;
        return;
      }
      setBell(d.unread);
      if (state.stats) state.stats.notif = d.unread;
      box.innerHTML = `<div class="np-head"><b>الإشعارات${d.unread ? ` (${d.unread} جديد)` : ''}</b>
          <span class="row">${pushSupported() && Notification.permission !== 'granted' ? '<button class="btn sm" id="npPush" title="تظهر الإشعارات على ويندوز حتى لو كان النظام مغلقاً">🖥️ تفعيل إشعارات ويندوز</button>' : ''}${SF.cap(state.user, 'announce') ? '<button class="btn sm" id="npAnn">📢 إرسال تعميم</button>' : ''}${d.unread ? '<button class="btn sm ghost" id="npAll">تعليم الكل كمقروء</button>' : ''}</span></div>
        <div class="np-list">${
          d.items
            .map(
              (n) => `<a class="np-item${n.read ? '' : ' new'} k-${esc(n.kind)}" data-n="${n.id}" data-link="${esc(n.link)}">
            <span class="np-ic">${NOTIF_IC[n.kind] || '🔔'}</span>
            <span class="np-txt"><b${n.kind === 'announce' ? ' data-noi18n' : ''}>${esc(n.title)}</b>${n.text ? `<span>${esc(n.text).replace(/\n/g, '<br>')}</span>` : ''}<small>${esc(dt(n.at))}${n.by ? ` — ${esc(n.by)}` : ''}</small></span></a>`,
            )
            .join('') || '<div class="muted" style="padding:20px;text-align:center">لا توجد إشعارات</div>'
        }</div>`;
      if ($('#npAll', box))
        $('#npAll', box).onclick = async () => {
          await api('POST', '/api/notifications/read', {});
          draw();
        };
      if ($('#npAnn', box))
        $('#npAnn', box).onclick = () => {
          box.remove();
          announceModal();
        };
      if ($('#npPush', box))
        $('#npPush', box).onclick = async () => {
          await enablePush();
          draw();
        };
      $$('[data-n]', box).forEach((a) => {
        a.onclick = async () => {
          try {
            await api('POST', '/api/notifications/read', { ids: [a.dataset.n] });
          } catch {
            /* تجاهل */
          }
          const n = d.items.find((x) => x.id === a.dataset.n);
          if (n && (n.kind === 'announce' || !n.link)) {
            box.remove();
            refreshBell();
            readNotice(n);
            return;
          }
          if (a.dataset.link) {
            box.remove();
            location.hash = a.dataset.link;
            refreshBell();
          } else draw();
        };
      });
    };
    draw();
  }
  /* قراءة التعميم كاملاً في نافذة */
  function readNotice(n) {
    if (n.noticeId)
      api('POST', `/api/notices/${n.noticeId}/read`, {})
        .then(() => refreshStats())
        .then(setTopBadges)
        .catch(() => {});
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal notice-read" role="dialog" aria-modal="true">
      <div class="nr-head"><span class="nr-ic">${NOTIF_IC[n.kind] || '🔔'}</span><div><h3${n.kind === 'announce' ? ' data-noi18n' : ''}>${esc(n.title)}</h3><small class="muted">${n.by ? `من: ${esc(n.by)} — ` : ''}${esc(dt(n.at))}</small></div></div>
      <div class="nr-body">${n.text ? esc(n.text).replace(/\n/g, '<br>') : '<span class="muted">لا يوجد نص إضافي</span>'}</div>
      <div class="row" style="justify-content:flex-start;margin-top:16px"><button class="btn primary" data-x>تم</button></div></div>`;
    document.body.appendChild(bg);
    const close = () => {
      bg.remove();
      document.removeEventListener('keydown', key);
    };
    const key = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', key);
    $('[data-x]', bg).onclick = close;
    bg.onclick = (e) => {
      if (e.target === bg) close();
    };
    $('[data-x]', bg).focus();
  }
  /* ---------- البريد الداخلي ---------- */
  const mailDate = (iso) => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
      : dt(iso);
  };
  /* ميعاد الرد للعرض: 2026/11/03 14:00 */
  const dueTxt = (d) => `${SF.fmtDate(String(d).slice(0, 10))} ${String(d).slice(11, 16)}`;
  /* محتوى الرسالة للعرض: المنسق (منظَّف في السيرفر) أو النص العادي للرسائل القديمة */
  const mailHtml = (m) => (m && m.html ? m.html : esc((m && m.body) || '').replace(/\n/g, '<br>'));
  /* ---------- نافذة كتابة رسالة (بتصميم Gmail) ---------- */
  const GM = {
    bold: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>',
    italic:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>',
    underline:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>',
    color:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M11 3 5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z"/><rect x="3" y="19" width="18" height="3" class="gm-col-bar"/></svg>',
    size: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/></svg>',
    align:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>',
    ol: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>',
    ul: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>',
    indent:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>',
    outdent:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M11 17h10v-2H11v2zm-8-5 4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>',
    quote:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>',
    dir: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M10 10v5h2V4h2v11h2V4h2V2h-8C7.79 2 6 3.79 6 6s1.79 4 4 4zm-2 7v-3l-4 4 4 4v-3h12v-2H8z"/></svg>',
    more: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>',
    clear:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3.27 5 2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/></svg>',
    strike:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>',
    aa: '<span class="gm-aa">Aa</span>',
    clip: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
    emoji:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
    image:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13zM9 8h2v9H9zm4 0h2v9h-2z"/></svg>',
    min: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6 19h12v2H6z"/></svg>',
    max: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M21 11V3h-8l3.29 3.29-10 10L3 13v8h8l-3.29-3.29 10-10z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  };
  GM.due =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>';
  const GM_FONTS = [
    ['Tajawal', 'Tajawal'],
    ['Arial', 'Sans Serif'],
    ['Times New Roman', 'Serif'],
    ['Courier New', 'Fixed Width'],
    ['Tahoma', 'Tahoma'],
    ['Verdana', 'Wide'],
  ];
  const GM_COLORS = [
    '#000000',
    '#444444',
    '#666666',
    '#999999',
    '#cccccc',
    '#ffffff',
    '#c0392b',
    '#e67e22',
    '#f1c40f',
    '#27ae60',
    '#16a085',
    '#2980b9',
    '#8e44ad',
    '#9b1c1c',
    '#7f1d1d',
    '#1e3a8a',
    '#065f46',
    '#78350f',
  ];
  const GM_EMOJI =
    '😀 😁 😂 🙂 😊 😍 😘 😎 🤔 😐 😢 😭 😡 👍 👎 👏 🙏 💪 👌 ✌️ 🤝 ❤️ 💯 🔥 ⭐ ✅ ❌ ⚠️ 📌 📎 📅 ⏰ 💰 📈 📉 📝 📢 🎉 🌹 ☕'.split(' ');

  /* ---------- مركز التعاميم ---------- */
  /* صفحة الإشعارات: كل إشعاراتك (آخر 100) مع تصفية غير المقروء وتعليم الكل كمقروء */
  /* ---------- إدارة المهام ---------- */
  const TK_ST = { new: 'جديدة', doing: 'قيد التنفيذ', review: 'بانتظار اعتماد المدير', done: 'مكتملة', cancelled: 'ملغاة' };
  const TK_PR = { عادية: 'pr-n', مهمة: 'pr-m', عاجلة: 'pr-u' };
  const tkStatus = (k) =>
    `<span class="tk-st st-${k.status}">${esc(TK_ST[k.status])}</span>${k.late ? ' <span class="tk-late">متأخرة</span>' : ''}`;
  const tkPrio = (k) => `<span class="tk-pr ${TK_PR[k.priority] || ''}">${esc(k.priority)}</span>`;
  const tkDue = (k) =>
    k.due ? `<span class="${k.late ? 'tk-due-late' : ''}">${esc(SF.fmtDate(k.due))}</span>` : '<span class="muted">—</span>';
  const tkBar = (k) =>
    `<span class="tk-bar" title="${k.progress}%"><i style="width:${k.progress}%"></i></span><small>${k.progress}%</small>`;
  const fmtNumAr = (n) => Number(n || 0).toLocaleString('en-US');
  /* عداد الدخول على النظام: اليوم، أمس، آخر 7 أيام، الشهر، الإجمالي، آخر 30 يوماً، والأكثر دخولاً */
  async function loginStatsModal() {
    const s = await api('GET', '/api/login-stats');
    const max = Math.max(1, ...s.last30.map((d) => d.logins));
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:860px;width:96%"><h3 style="margin-top:0">👁 عدد مرات الدخول على النظام</h3>
      <div class="hint" style="margin-bottom:12px">كل تسجيل دخول ناجح${s.since ? ` — منذ ${esc(SF.fmtDate(s.since.slice(0, 10)))}` : ''}</div>
      <div class="lc-cards">${[
        ['اليوم', s.today, `${s.usersToday} مستخدم`],
        ['أمس', s.yesterday, ''],
        ['آخر 7 أيام', s.week, `${s.usersWeek} مستخدم`],
        ['هذا الشهر', s.month, ''],
        ['الإجمالي', s.total, `${s.usersTotal} مستخدم`],
      ]
        .map(([l, n, sub]) => `<div class="lc-card"><b>${fmtNumAr(n)}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div>`)
        .join('')}</div>
      <h4 class="b-sec">آخر 30 يوماً</h4>
      <div class="lc-chart">${s.last30.map((d) => `<div class="lc-col" title="${esc(SF.fmtDate(d.date))}: ${d.logins} دخول — ${d.users} مستخدم"><span class="lc-v">${d.logins || ''}</span><i style="height:${Math.round((d.logins / max) * 100)}%"></i><small>${d.date.slice(8)}</small></div>`).join('')}</div>
      <h4 class="b-sec">الأكثر دخولاً</h4>
      <input class="in" id="lcQ" placeholder="بحث بالاسم أو الفرع..." style="margin-bottom:8px">
      <div class="tbl-wrap" style="max-height:300px;overflow:auto"><table class="tbl"><thead><tr><th>#</th><th>المستخدم</th><th>الفرع</th><th>مرات الدخول</th><th>آخر دخول</th></tr></thead><tbody>
        ${s.top.map((u, i) => `<tr data-s="${esc(`${u.name} ${u.branch} ${u.title}`)}"><td>${i + 1}</td><td><b>${esc(u.name)}</b>${u.title ? `<div class="muted" style="font-size:12px">${esc(u.title)}</div>` : ''}</td><td>${esc(u.branch || '—')}</td><td><b>${fmtNumAr(u.count)}</b></td><td>${esc(dt(u.last))}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">لا توجد بيانات</td></tr>'}</tbody></table></div>
      <div class="row" style="margin-top:14px"><button class="btn primary" data-x>إغلاق</button></div></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    bg.onclick = (e) => {
      if (e.target === bg) bg.remove();
    };
    $('#lcQ', bg).oninput = () => {
      const q = $('#lcQ', bg).value.trim();
      $$('tbody tr[data-s]', bg).forEach((r) => {
        r.hidden = !!q && !r.dataset.s.includes(q);
      });
    };
  }
  function setTopBadges() {
    const s = state.stats || {};
    if (s.logins) {
      $$('[data-sl="total"]').forEach((x) => {
        x.textContent = fmtNumAr(s.logins.total);
      });
      $$('[data-sl="today"]').forEach((x) => {
        x.textContent = fmtNumAr(s.logins.today);
      });
    }
    if (s.logins)
      $$('[data-logins] .lc-n').forEach((x) => {
        x.textContent = fmtNumAr(s.logins.total);
        x.parentElement.title = `عدد مرات الدخول على النظام: ${s.logins.total} (اليوم ${s.logins.today})`;
      });
    const put = (sel, n) =>
      $$(sel).forEach((b) => {
        const x = $('.bell-n', b);
        if (!x) return;
        x.textContent = n > 99 ? '99+' : n;
        x.hidden = !n;
      });
    put('[data-mailbtn]', s.mailUnread || 0);
    put('[data-chatbtn]', s.chatUnread || 0);
    put('[data-noticebtn]', s.noticesUnread || 0);
  }

  /* ---------- رمز التحقق لدخول مدير النظام (في تبويب البريد) ---------- */
  /* ---------- إشعارات ويندوز (تظهر على سطح المكتب حتى لو كان النظام مغلقاً) ----------
   * تحتاج رابطاً آمناً https (أو localhost)، وتعمل ما دام المتصفح يعمل في الخلفية */
  try {
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {});
  } catch {
    /* تجاهل */
  }
  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const pushReg = () => navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);
  async function pushEndpoint() {
    if (!pushSupported() || !window.isSecureContext) return '';
    try {
      const r = await navigator.serviceWorker.getRegistration('/');
      const s = r && (await r.pushManager.getSubscription());
      return s ? s.endpoint : '';
    } catch {
      return '';
    }
  }
  async function pushSubscribe() {
    const reg = await pushReg();
    const { key } = await api('GET', '/api/push/key');
    let sub = await reg.pushManager.getSubscription();
    /* مفتاح الخادم تغيّر (قاعدة بيانات جديدة): يُلغى الاشتراك القديم */
    if (
      sub &&
      sub.options.applicationServerKey &&
      btoa(String.fromCharCode(...new Uint8Array(sub.options.applicationServerKey)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '') !== key
    ) {
      await sub.unsubscribe();
      sub = null;
    }
    if (!sub) {
      const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)) });
    }
    await api('POST', '/api/push/subscribe', sub.toJSON());
  }
  /* بعد الدخول: إذا سبق أن سمح المستخدم بالإشعارات يُجدَّد الاشتراك تلقائياً باسمه */
  async function syncPush() {
    if (state.pushSynced || !pushSupported() || !window.isSecureContext || Notification.permission !== 'granted') return;
    state.pushSynced = true;
    try {
      await pushSubscribe();
    } catch {
      state.pushSynced = false;
    }
  }
  async function enablePush() {
    if (!pushSupported()) return toast('هذا المتصفح لا يدعم إشعارات سطح المكتب، استخدم Chrome أو Edge', true);
    if (!window.isSecureContext) return toast('إشعارات ويندوز تحتاج فتح النظام من رابط آمن يبدأ بـ https — راجع مدير النظام', true);
    if (Notification.permission === 'denied')
      return toast('الإشعارات محظورة لهذا الموقع: اضغط على 🔒 بجوار الرابط واسمح بالإشعارات ثم أعد المحاولة', true);
    if ((await Notification.requestPermission()) !== 'granted') return toast('لم يتم السماح بالإشعارات', true);
    try {
      await pushSubscribe();
      state.pushSynced = true;
      await api('POST', '/api/push/test', {});
      toast('تم تفعيل إشعارات ويندوز ✅ — سيصلك إشعار تجريبي الآن');
    } catch (err) {
      toast(`تعذّر تفعيل الإشعارات: ${err.message}`, true);
    }
  }
  async function refreshBell() {
    try {
      const d = await api('GET', '/api/notifications');
      setBell(d.unread);
      if (state.stats) state.stats.notif = d.unread;
    } catch {
      /* تجاهل */
    }
  }
  async function announceModal() {
    /* المستلمون من قائمة مستخدمي النظام الفعّالين (متاحة لكل من له صلاحية إرسال التعاميم) */
    const active = [...(await api('GET', '/api/mail/users')), { id: state.user.id, name: state.user.name, title: state.user.title || '' }];
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<form class="modal" novalidate><h3>📢 إرسال تعميم</h3>
      <div class="field" style="margin-bottom:10px"><label>العنوان *</label><input class="in" name="title" maxlength="150" required></div>
      <div class="field" style="margin-bottom:10px"><label>نص التعميم</label><textarea class="in" name="text" rows="4" maxlength="1000"></textarea></div>
      <div class="field" style="margin-bottom:10px"><label>إلى</label><select class="in" name="to"><option value="all">جميع المستخدمين (${active.length})</option><option value="branch">فرع محدد</option><option value="ids">مستخدمون محددون</option></select></div>
      <div class="field" id="anBranch" hidden style="margin-bottom:10px"><label>الفرع</label><select class="in" name="branch">${(state.config.branches || []).map((b) => `<option>${esc(b)}</option>`).join('')}</select></div>
      <div id="anUsers" hidden class="an-users">${active.map((x) => `<label class="row"><input type="checkbox" value="${x.id}"> ${esc(x.name)} <small class="muted">${esc(x.title || x.roleLabel || '')}</small></label>`).join('')}</div>
      <div class="merr"></div>
      <div class="row" style="margin-top:12px"><button class="btn primary">إرسال</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
    document.body.appendChild(bg);
    const f = $('form', bg);
    f.to.onchange = () => {
      $('#anBranch', bg).hidden = f.to.value !== 'branch';
      $('#anUsers', bg).hidden = f.to.value !== 'ids';
    };
    $('[data-x]', bg).onclick = () => bg.remove();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const body = {
        title: f.title.value,
        text: f.text.value,
        to: f.to.value,
        branch: f.branch ? f.branch.value : '',
        ids: $$('#anUsers input:checked', bg).map((c) => c.value),
      };
      try {
        const r = await api('POST', '/api/notices', body);
        bg.remove();
        toast(`تم إرسال التعميم إلى ${r.sent} مستخدم`);
        refreshBell();
        if (location.hash.startsWith('#/notices')) S.viewNotices();
      } catch (err) {
        $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* نافذة تأكيد بزرّي نعم / لا */
  function askYesNo(msg) {
    return new Promise((resolve) => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal yesno" role="alertdialog" aria-modal="true"><p>${esc(msg)}</p>
        <div class="row" style="justify-content:center;gap:10px"><button class="btn primary" data-y>نعم</button><button class="btn ghost" data-n>لا</button></div></div>`;
      document.body.appendChild(bg);
      const done = (v) => {
        bg.remove();
        document.removeEventListener('keydown', key);
        resolve(v);
      };
      const key = (e) => {
        if (e.key === 'Escape') done(false);
      };
      document.addEventListener('keydown', key);
      $('[data-y]', bg).onclick = () => done(true);
      $('[data-n]', bg).onclick = () => done(false);
      bg.onclick = (e) => {
        if (e.target === bg) done(false);
      };
      $('[data-n]', bg).focus();
    });
  }
  const head = (title, sub, actions = '') =>
    `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`;

  /* تصغير الخطاب ليتناسب مع عرض الحاوية */
  /* كل خطاب صفحة A4 واحدة: إذا زاد المحتوى عن الصفحة يُصغَّر تدريجياً (الترويسة ورمز QR بحجمهما) */
  const A4_PX = (297 * 96) / 25.4;
  function fitA4(root) {
    $$('.letter:not(.compact):not(.clearance)', root || document).forEach((L) => {
      const kids = [...L.children].filter((k) => !k.classList.contains('l-head') && !k.classList.contains('l-qr'));
      const outer = L.style.zoom;
      L.style.zoom = 1;
      L.style.minHeight = '';
      L.classList.remove('multi');
      kids.forEach((k) => {
        k.style.zoom = '';
      });
      let z = 1;
      for (let i = 0; i < 25 && L.getBoundingClientRect().height > A4_PX + 1 && z > 0.6; i++) {
        z = +(z - 0.02).toFixed(2);
        kids.forEach((k) => {
          k.style.zoom = z;
        });
      }
      /* لم يتسع بعد أقصى تصغير مقروء: صفحات A4 كاملة، والرمز والتوقيعات في آخرها */
      const h = L.getBoundingClientRect().height;
      if (h > A4_PX + 1) {
        L.classList.add('multi');
        L.style.minHeight = `${Math.ceil(h / A4_PX) * 297}mm`;
      }
      L.style.zoom = outer;
      /* التوقيعات والصور تغيّر الطول بعد تحميلها، فيُعاد الضبط */
      $$('img', L).forEach((im) => {
        if (!im.complete) im.addEventListener('load', () => fitA4(L.parentNode), { once: true });
      });
    });
  }
  window.__fitA4 = fitA4;
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(() => {
      fitA4();
    });
  function fitLetters() {
    fitA4();
    $$('.preview-wrap').forEach((wrap) => {
      /* كل الصفحات في المعاينة (مثل البيان وخطاب التعميد تحته) */
      const cs = getComputedStyle(wrap);
      const avail = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      $$('.letter', wrap)
        .filter((l) => !l.parentElement.closest('.letter'))
        .forEach((letter) => {
          letter.style.zoom = 1;
          letter.style.zoom = Math.min(1, avail / letter.offsetWidth).toFixed(3);
        });
    });
  }
  window.addEventListener('resize', fitLetters);

  async function refreshStats() {
    try {
      state.stats = await api('GET', '/api/stats');
    } catch {
      /* تجاهل */
    }
  }
  Object.assign(S, {
    POLICY,
    NOTIF_IC,
    mailDate,
    dueTxt,
    mailHtml,
    GM,
    GM_FONTS,
    GM_COLORS,
    GM_EMOJI,
    TK_ST,
    tkStatus,
    tkPrio,
    tkDue,
    tkBar,
    fmtNumAr,
    head,
  });
})((window.SES_APP = window.SES_APP || {}));
