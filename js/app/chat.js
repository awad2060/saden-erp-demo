/* الدردشة الداخلية: النافذة المستقلة والعائمة وأنواع الرسائل */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, $$, state, dt, can, api, toast, icon, setTopBadges } = S;
  Object.assign(S, { chatSetMute, chatConnect, chatSolo, cwOpen, cwClose, chatGo, cwRestore, chatModal });
  /* ---------- الدردشة الداخلية: مجموعة لكل فرع ومحادثات خاصة، والرسائل تصل فوراً ---------- */
  /* اتصال واحد مفتوح لكل تبويب: يوزّع أحداث الدردشة على الصفحة المفتوحة، ويحدّث عدد غير المقروء ويُظهر تنبيهاً */
  /* كتم المحادثة (محفوظ في حساب المستخدم) */
  const chatIsMuted = (conv) => {
    const v = ((state.user || {}).chatMutes || {})[conv];
    return !!v && (v === 'always' || v > new Date().toISOString());
  };
  const chatMuteText = (conv) => {
    const v = ((state.user || {}).chatMutes || {})[conv];
    return !chatIsMuted(conv) ? '' : v === 'always' ? 'مكتومة دائماً' : `مكتومة حتى ${dt(v)}`;
  };
  /* إشعار "رسالة من فلان": بطاقة في زاوية الشاشة بزر فتح وإغلاق (تختفي بعد 7 ثوانٍ)، وإشعار ويندوز إذا كان النظام في الخلفية */
  function chatNotify(ev) {
    const m = ev.msg,
      grp = ev.conv.startsWith('b:') ? `فرع ${ev.conv.slice(2)}` : '';
    const text = String(chatPrevC(m) || '').slice(0, 140);
    const link = `#/chat/${encodeURIComponent(ev.conv)}`;
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(`رسالة من ${m.fromName}${grp ? ` — ${grp}` : ''}`, {
          body: text,
          icon: 'logo.png',
          tag: ev.conv,
          dir: 'rtl',
          lang: 'ar',
        });
        n.onclick = () => {
          window.focus();
          chatGo(ev.conv);
          n.close();
        };
      } catch {
        /* تجاهل */
      }
    }
    let box = document.querySelector('.cn-stack');
    if (!box) {
      box = document.createElement('div');
      box.className = 'cn-stack';
      document.body.appendChild(box);
    }
    /* إشعار واحد لكل محادثة: الجديد يحل محل القديم */
    const old = box.querySelector(`[data-conv="${CSS.escape(ev.conv)}"]`);
    if (old) old.remove();
    const card = document.createElement('div');
    card.className = 'cn-card';
    card.dataset.conv = ev.conv;
    card.innerHTML = `<span class="cn-av">${esc(
      String(m.fromName || '?')
        .trim()
        .charAt(0),
    )}</span><div class="cn-b"><b>رسالة من ${esc(m.fromName)}</b>${grp ? `<small>${icon('branch')} ${esc(grp)}</small>` : ''}<span class="cn-t">${esc(text)}</span>
      <div class="cn-acts"><a class="btn sm primary" href="${link}">${icon('message')} فتح</a><button type="button" class="btn sm ghost" data-cn-mute title="كتم إشعارات هذه المحادثة 8 ساعات">${icon('bell')} كتم</button></div></div><button type="button" class="cn-x" title="إغلاق">✕</button>`;
    box.prepend(card);
    while (box.children.length > 4) box.lastElementChild.remove();
    const close = () => {
      card.classList.add('out');
      setTimeout(() => card.remove(), 250);
    };
    const timer = setTimeout(close, 7000);
    card.addEventListener('mouseenter', () => clearTimeout(timer));
    card.addEventListener('mouseleave', () => setTimeout(close, 2500));
    $('.cn-x', card).onclick = close;
    $('.cn-acts a', card).onclick = close;
    $('[data-cn-mute]', card).onclick = async () => {
      await chatSetMute(ev.conv, '8h');
      close();
    };
  }
  async function chatSetMute(conv, f) {
    try {
      const r = await api('PUT', '/api/me/chat-mute', { conv, for: f });
      state.user.chatMutes = r.chatMutes;
      toast(
        f
          ? f === 'always'
            ? 'تم كتم إشعارات المحادثة دائماً'
            : `تم كتم إشعارات المحادثة ${f === '8h' ? '8 ساعات' : 'أسبوعاً'}`
          : 'تم إلغاء كتم المحادثة',
      );
      window.dispatchEvent(new CustomEvent('chat-ev', { detail: { type: 'mute', conv } }));
    } catch (err) {
      toast(err.message, true);
    }
  }
  function chatConnect() {
    if (state.chatES || !state.user || !can('chat') || typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/chat/stream');
    state.chatES = es;
    es.onmessage = (e) => {
      let ev;
      try {
        ev = JSON.parse(e.data);
      } catch {
        return;
      }
      window.dispatchEvent(new CustomEvent('chat-ev', { detail: ev }));
      if (ev.type !== 'msg' || ev.msg.from === state.user.id) return;
      const viewing = (state.chatOpen === ev.conv && !document.hidden) || (!SOLO && chatSoloConv === ev.conv);
      if (!viewing && !chatIsMuted(ev.conv)) {
        state.stats = state.stats || {};
        state.stats.chatUnread = (state.stats.chatUnread || 0) + 1;
        setTopBadges();
        chatNotify(ev);
      }
    };
    /* انقطاع السيرفر: يعيد المتصفح الاتصال تلقائياً */
    es.onerror = () => {
      if (!state.user) {
        es.close();
        state.chatES = null;
      }
    };
  }
  /* ثيمات الدردشة: الخلفية وفقاعة رسائلي وفقاعة الآخرين */
  const CHAT_THEMES = [
    ['classic', 'سادن (افتراضي)'],
    ['dark', 'داكن'],
    ['blue', 'أزرق'],
    ['pink', 'وردي'],
    ['purple', 'بنفسجي'],
    ['sand', 'رملي'],
    ['green', 'أخضر'],
    ['plain', 'بسيط بدون نقش'],
  ];
  /* الإيموجي حسب الفئة (الأكثر استخداماً في التواصل اليومي) */
  const EMOJIS = [
    [
      '😀',
      'الوجوه',
      '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕',
    ],
    ['👍', 'الأيدي', '👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤝 🙏 👏 🙌 👐 🤲 💪 ✍️ 🫡 🫶'],
    [
      '❤️',
      'القلوب والرموز',
      '❤️ 🧡 💛 💚 💙 💜 🤍 🤎 🖤 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 ✅ ☑️ ✔️ ❌ ❎ ⭕ ⛔ 🚫 ⚠️ ❗ ❓ ‼️ ⁉️ 💯 🔥 ⭐ 🌟 ✨ 💫 🎉 🎊 🏆 🥇 🎯 💡 📌 📍 🔔 ⏰ ⏳ ⌛',
    ],
    [
      '📄',
      'العمل',
      '📄 📃 📑 📊 📈 📉 🗂️ 📁 📂 📋 📎 🖇️ ✏️ 🖊️ 📝 📅 📆 🗓️ 💼 🏢 🏦 🏗️ 🧾 💵 💰 💳 🖨️ 💻 🖥️ 📱 ☎️ 📞 📧 ✉️ 📨 📤 📥 🔍 🔒 🔑 🛠️ 🔧 🔨 ⚙️ 🧪 🔬 🚗 🚚 🚜 ⛽',
    ],
    ['☕', 'متنوعة', '☕ 🍵 🥤 🍽️ 🍕 🍔 🌙 ☀️ ⛅ 🌧️ ❄️ 🌴 🌹 🌸 🕌 🕋 📿 🤲 🇸🇦 🇪🇬 🎂 🎁 🛫 🏠 🏥 🧳 ⚽ 🏃 🚶'],
  ];
  const chatThemeOf = () => (CHAT_THEMES.some(([k]) => k === (state.user || {}).chatTheme) ? state.user.chatTheme : 'classic');
  const chatTime = (iso) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const chatDay = (iso) => {
    const d = new Date(iso),
      t = new Date(),
      y = new Date(Date.now() - 86400000);
    const same = (a, b) => a.toDateString() === b.toDateString();
    return same(d, t)
      ? 'اليوم'
      : same(d, y)
        ? 'أمس'
        : `${SF.fmtDate(iso.slice(0, 10))} — ${['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d.getDay()]}`;
  };
  const chatWhen = (iso) =>
    !iso ? '' : new Date(iso).toDateString() === new Date().toDateString() ? chatTime(iso) : SF.fmtDate(iso.slice(0, 10));
  const chatAv = (c) =>
    `<span class="ch-av ${c.kind === 'branch' ? 'br' : ''}">${c.kind === 'branch' ? icon('branch') : esc((c.title || '?').trim().charAt(0))}</span>`;
  /* الروابط في نص الرسالة تصبح قابلة للضغط */
  const chatText = (s) =>
    esc(s)
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
  /* ---------- الدردشة في نافذة مستقلة: نافذة منفصلة بالدردشة فقط (/?solo=chat) تُوضع في أي مكان على سطح المكتب ---------- */
  const SOLO = new URLSearchParams(location.search).get('solo') === 'chat';
  if (SOLO) document.documentElement.classList.add('solo');
  /* تنسيق بين النوافذ: النافذة المستقلة تخبر النظام بالمحادثة المعروضة فيها، فلا يظهر إشعار لرسائلها */
  const chatBC = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('saden-chat') : null;
  let chatSoloConv = null;
  if (chatBC)
    chatBC.onmessage = (e) => {
      if (e.data && e.data.t === 'solo') chatSoloConv = e.data.conv;
    };
  const soloTell = () => {
    if (SOLO && chatBC) chatBC.postMessage({ t: 'solo', conv: document.hidden ? null : state.chatOpen || null });
  };
  if (SOLO) {
    document.addEventListener('visibilitychange', soloTell);
    window.addEventListener('beforeunload', () => {
      if (chatBC) chatBC.postMessage({ t: 'solo', conv: null });
    });
    /* روابط النظام الأخرى (طلب، صفحة) تفتح في نافذة النظام الأصلي */
    document.addEventListener(
      'click',
      (e) => {
        const a = e.target.closest && e.target.closest('a[href^="#/"]');
        if (!a || a.getAttribute('href').startsWith('#/chat')) return;
        e.preventDefault();
        const h = a.getAttribute('href');
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.location.hash = h;
            window.opener.focus();
            return;
          } catch {
            /* نافذة أخرى */
          }
        }
        window.open(`/${h}`, '_blank');
      },
      true,
    );
  }
  function chatSolo(conv) {
    const w = Math.min(960, screen.availWidth - 40),
      h = Math.min(720, screen.availHeight - 80);
    const win = window.open(
      `/?solo=chat#/chat${conv ? `/${encodeURIComponent(conv)}` : ''}`,
      'saden-chat',
      `popup=yes,width=${w},height=${h},left=${Math.max(0, screen.availWidth - w - 30)},top=40`,
    );
    if (!win) {
      toast('المتصفح منع فتح النافذة — اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة', true);
      return false;
    }
    win.focus();
    return true;
  }
  /* ---------- نافذة الدردشة العائمة: تفتح فوق أي صفحة وتبقى أثناء التنقل بين الصفحات ---------- */
  const CW_KEY = () => `chatwin:${(state.user || {}).id || ''}`;
  const cwGet = () => {
    try {
      return JSON.parse(localStorage.getItem(CW_KEY())) || {};
    } catch {
      return {};
    }
  };
  const cwSet = (o) => {
    try {
      localStorage.setItem(CW_KEY(), JSON.stringify({ ...cwGet(), ...o }));
    } catch {
      /* تجاهل */
    }
  };
  function chatWin() {
    let w = document.getElementById('chatWin');
    if (w) return w;
    w = document.createElement('div');
    w.id = 'chatWin';
    w.className = 'cw';
    w.hidden = true;
    w.innerHTML = `<div class="cw-bar"><span class="cw-t">${icon('message')}<b>الدردشة الداخلية</b><span class="cw-un" hidden></span></span><button type="button" data-cw="min" title="تصغير">—</button><button type="button" data-cw="solo" class="cw-full" title="نافذة مستقلة خارج المتصفح تضعها في أي مكان على الشاشة">🗗 نافذة مستقلة</button><button type="button" data-cw="max" class="cw-full" title="فتح في صفحة الدردشة الكاملة">⤢ فتح في الدردشة</button><button type="button" data-cw="x" title="إغلاق">✕</button></div><div class="cw-body"></div>${['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((d) => `<span class="cw-rz ${d}" data-rz="${d}"></span>`).join('')}`;
    document.body.appendChild(w);
    const bar = $('.cw-bar', w);
    const place = cwPlace(w);
    cwDragWire(w, bar, place);
    cwResizeWire(w);
    cwButtons(w);
    return w;
  }
  /* المقاس والمكان المحفوظان (افتراضياً بجوار المساعد أسفل الشاشة)، ويبقى داخل الشاشة عند تغيير مقاسها */
  function cwPlace(w) {
    const g = cwGet();
    const W0 = Math.max(420, Math.min(780, innerWidth - 420)),
      H0 = Math.max(340, Math.min(560, innerHeight - 90));
    w.style.width = `${g.w || W0}px`;
    w.style.height = `${g.h || H0}px`;
    const place = (x, y) => {
      x = Math.max(4, Math.min(innerWidth - 160, x));
      y = Math.max(4, Math.min(innerHeight - 44, y));
      w.style.left = `${x}px`;
      w.style.top = `${y}px`;
    };
    place(g.x ?? 126, g.y ?? innerHeight - (g.h || H0) - 14);
    window.addEventListener('resize', () => place(parseFloat(w.style.left), parseFloat(w.style.top)));
    return place;
  }
  function cwDragWire(w, bar, place) {
    /* السحب من الشريط العلوي */
    let drag = null;
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      drag = { sx: e.clientX, sy: e.clientY, x: w.offsetLeft, y: w.offsetTop, moved: false };
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.sx,
        dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      place(drag.x + dx, drag.y + dy);
    });
    bar.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (moved && !w.classList.contains('min')) cwSet({ x: w.offsetLeft, y: w.offsetTop });
      else if (moved) w._top = undefined;
      else if (w.classList.contains('min')) cwMin(false);
    });
  }
  function cwResizeWire(w) {
    /* تغيير المقاس بالسحب من أي حافة أو زاوية */
    let rz = null;
    w.addEventListener('pointerdown', (e) => {
      const h = e.target.closest('[data-rz]');
      if (!h || w.classList.contains('min')) return;
      e.preventDefault();
      rz = { d: h.dataset.rz, sx: e.clientX, sy: e.clientY, x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight };
      h.setPointerCapture(e.pointerId);
      w.classList.add('resizing');
    });
    w.addEventListener('pointermove', (e) => {
      if (!rz) return;
      const dx = e.clientX - rz.sx,
        dy = e.clientY - rz.sy,
        MW = 380,
        MH = 300;
      let { x, y, w: ww, h: hh } = rz;
      if (rz.d.includes('e')) ww = Math.min(innerWidth - x - 4, Math.max(MW, rz.w + dx));
      if (rz.d.includes('s')) hh = Math.min(innerHeight - y - 4, Math.max(MH, rz.h + dy));
      if (rz.d.includes('w')) {
        const nw = Math.max(MW, Math.min(rz.x + rz.w - 4, rz.w - dx));
        x = rz.x + rz.w - nw;
        ww = nw;
      }
      if (rz.d.includes('n')) {
        const nh = Math.max(MH, Math.min(rz.y + rz.h - 4, rz.h - dy));
        y = rz.y + rz.h - nh;
        hh = nh;
      }
      Object.assign(w.style, { left: `${x}px`, top: `${y}px`, width: `${ww}px`, height: `${hh}px` });
    });
    const rzEnd = () => {
      if (!rz) return;
      rz = null;
      w.classList.remove('resizing');
      cwSet({ x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight });
    };
    w.addEventListener('pointerup', rzEnd);
    w.addEventListener('pointercancel', rzEnd);
    /* تغيير المقاس يُحفظ، والنافذة الضيقة تعرض القائمة أو المحادثة مثل الجوال */
    let rt = null;
    new ResizeObserver(() => {
      w.classList.toggle('narrow', w.clientWidth < 640);
      if (w.hidden || w.classList.contains('min') || innerWidth <= 700) return;
      clearTimeout(rt);
      rt = setTimeout(() => cwSet({ w: w.offsetWidth, h: w.offsetHeight }), 300);
    }).observe(w);
  }
  /* الأزرار: تصغير، إغلاق، نافذة مستقلة، فتح في صفحة الدردشة، وعدد غير المقروء على النافذة المصغرة */
  function cwButtons(w) {
    $('[data-cw="min"]', w).onclick = () => cwMin(!w.classList.contains('min'));
    $('[data-cw="x"]', w).onclick = () => cwClose();
    $('[data-cw="solo"]', w).onclick = () => {
      if (chatSolo(w._conv)) cwClose();
    };
    $('[data-cw="max"]', w).onclick = () => {
      const c = w._conv;
      cwClose();
      location.hash = c ? `#/chat/${encodeURIComponent(c)}` : '#/chat';
    };
    window.addEventListener('chat-ev', () =>
      setTimeout(() => {
        const n = (state.stats || {}).chatUnread || 0,
          u = $('.cw-un', w);
        u.hidden = !(n && w.classList.contains('min'));
        u.textContent = n;
      }, 50),
    );
  }
  function cwOpen(conv) {
    const w = chatWin();
    w.hidden = false;
    if (w.classList.contains('min')) cwMin(false);
    w._conv = conv || '';
    cwSet({ open: true, min: false, conv: w._conv });
    S.viewChat(w._conv, $('.cw-body', w));
  }
  function cwClose() {
    const w = document.getElementById('chatWin');
    if (!w) return;
    w.hidden = true;
    $('.cw-body', w).innerHTML = '';
    state.chatOpen = null;
    cwSet({ open: false });
  }
  function cwMin(on) {
    const w = document.getElementById('chatWin');
    if (!w) return;
    /* المصغّرة تنزل لأسفل الشاشة مثل شريط المهام، وترجع لمكانها عند الفتح */
    if (on && !w.classList.contains('min')) {
      w._top = w.offsetTop;
      w.classList.add('min');
      w.style.top = `${innerHeight - w.offsetHeight - 12}px`;
    } else if (!on && w.classList.contains('min')) {
      w.classList.remove('min');
      const g = cwGet();
      w.style.top = `${Math.max(4, Math.min(innerHeight - 44, w._top ?? g.y ?? 60))}px`;
    }
    cwSet({ min: on });
    $('.cw-un', w).hidden = true;
    if (on) state.chatOpen = null;
    else S.viewChat(w._conv, $('.cw-body', w));
  }
  /* فتح محادثة: داخل النافذة إن كانت مفتوحة، أو في الصفحة الكاملة إن كان المستخدم فيها، وإلا تفتح النافذة */
  function chatGo(id) {
    const w = document.getElementById('chatWin');
    if (w && !w.hidden) {
      if (w.classList.contains('min')) {
        w.classList.remove('min');
        w.style.top = `${Math.max(4, Math.min(innerHeight - 44, w._top ?? cwGet().y ?? 60))}px`;
      }
      w._conv = id || '';
      cwSet({ conv: w._conv, min: false });
      S.viewChat(w._conv, $('.cw-body', w));
      return;
    }
    location.hash = id ? `#/chat/${encodeURIComponent(id)}` : '#/chat';
  }
  /* روابط الدردشة (أيقونة الشريط العلوي، الإشعارات، المساعد، قائمة المحادثات) تفتح داخل النافذة العائمة إذا كانت مفتوحة، وإلا تفتح صفحة الدردشة */
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#/chat"]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
      const w = document.getElementById('chatWin');
      if (!a.closest('#chatWin') && (location.hash.startsWith('#/chat') || !w || w.hidden)) return;
      e.preventDefault();
      let c = a.getAttribute('href').replace(/^#\/chat\/?/, '');
      try {
        c = decodeURIComponent(c);
      } catch {
        /* كما هو */
      }
      chatGo(c);
    },
    true,
  );
  /* الخروج من الحساب يزيل النافذة (وتعود عند الدخول التالي كما كانت) */
  window.addEventListener('hashchange', () => {
    if (location.hash === '#/login') {
      const w = document.getElementById('chatWin');
      if (w) w.remove();
    }
  });
  /* آخر صفحة قبل الدردشة: زر "نافذة عائمة" يرجع لها ويفتح الدردشة فوقها */
  S.cwLastPage = location.hash && !location.hash.startsWith('#/chat') ? location.hash : '#/';
  window.addEventListener('hashchange', () => {
    const h = location.hash;
    if (h && !h.startsWith('#/chat') && h !== '#/login') S.cwLastPage = h;
  });
  /* بعد إعادة تحميل الصفحة تعود النافذة كما كانت */
  function cwRestore() {
    if (document.getElementById('chatWin') || !can('chat') || location.hash.startsWith('#/chat')) return;
    const g = cwGet();
    if (!g.open) return;
    cwOpen(g.conv);
    if (g.min) cwMin(true);
  }
  /* ---------- الدردشة: أنواع الرسائل وعرضها ---------- */
  const CHAT_STATUS = { approved: 'معتمد', rejected: 'مرفوض', returned: 'معاد للتعديل', cancelled: 'ملغي' };
  const chatPrevC = (m) =>
    m.text ||
    { poll: '📊 استطلاع', event: '📅 حدث', contact: '👤 جهة اتصال', location: '📍 موقع', sticker: '🙂 ملصق', request: '📄 طلب من النظام' }[
      m.kind
    ] ||
    (m.file ? (m.file.kind === 'voice' ? '🎤 رسالة صوتية' : m.file.name) : '');
  const chatDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  /* نافذة عامة صغيرة للدردشة */
  function chatModal(title, html, w = 520) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:${w}px;width:96%"><h3 style="margin-top:0">${title}</h3>${html}<div class="cmErr"></div></div>`;
    document.body.appendChild(bg);
    $$('[data-x]', bg).forEach((b) => {
      b.onclick = () => bg.remove();
    });
    return bg;
  }
  const chatErr = (bg, msg) => {
    $('.cmErr', bg).innerHTML = `<div class="err">${esc(msg)}</div>`;
  };
  const CHAT_STICKERS = [
    'saden',
    '👍',
    '❤️',
    '😂',
    '🙏',
    '👏',
    '🎉',
    '🔥',
    '✅',
    '💯',
    '😍',
    '🤝',
    '💪',
    '☕',
    '🌹',
    '😢',
    '😮',
    '🤔',
    '👌',
    '🫡',
    '🌙',
    '🇸🇦',
    '🏆',
    '⭐',
  ];
  Object.assign(S, {
    chatIsMuted,
    chatMuteText,
    CHAT_THEMES,
    EMOJIS,
    chatThemeOf,
    chatTime,
    chatDay,
    chatWhen,
    chatAv,
    chatText,
    SOLO,
    soloTell,
    CHAT_STATUS,
    chatPrevC,
    chatDur,
    chatErr,
    CHAT_STICKERS,
  });
})((window.SES_APP = window.SES_APP || {}));
