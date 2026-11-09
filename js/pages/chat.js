'use strict';
/* صفحة «chat» (viewChat) — منقولة من public/js/app.js.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...).
 * المتغيرات المشتركة القابلة للتغيير تُقرأ وتُكتب عبر S.<الاسم> مباشرة.
 * حالة الصفحة المفتوحة كلها في كائن واحد st تمرره الدوال لبعضها:
 *   st.convId / st.host / st.main / st.app: المحادثة المطلوبة ومكان العرض
 *   st.data: قائمة المحادثات، st.conv: المحادثة المفتوحة، st.msgs / st.more: رسائلها
 *   st.replyTo: الرسالة المردود عليها، st.q: بحث القائمة، st.pend: ملفات بانتظار الإرسال، st.ta: خانة الكتابة
 * النوافذ وعرض الرسائل الخاصة في chat-kit.js، والصوت والكاميرا والأعضاء في chat-media-kit.js */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['chat'] = function (S) {
  const {
    $,
    $$,
    EMOJIS,
    SOLO,
    api,
    askYesNo,
    chatAv,
    chatConnect,
    chatDay,
    chatGo,
    chatIsMuted,
    chatMuteText,
    chatPrevC,
    chatSetMute,
    chatSolo,
    chatText,
    chatThemeOf,
    chatTime,
    chatWhen,
    cwClose,
    cwOpen,
    esc,
    icon,
    setTopBadges,
    shell,
    soloTell,
    state,
    toast,
    uploadFile,
  } = S;
  const {
    chatEmojiPanel,
    chatThemeModal,
    chatFileHtml,
    chatSpecialHtml,
    chatFilesModal,
    chatPollModal,
    chatEventModal,
    chatContactModal,
    chatLocationModal,
    chatStickerModal,
    chatQuickModal,
    chatRequestModal,
  } = window.SES_PAGE_KITS['chat'](S, {});
  const { chatVoiceModal, shrinkImage, cameraModal, chatNewModal, chatMembersModal } = window.SES_PAGE_KITS['chat-media'](S, {});
  const convUrl = (st) => `/api/chat/${encodeURIComponent(st.conv.id)}`;

  async function viewChat(convId, host) {
    /* الصفحة الكاملة تغلق النافذة العائمة (محادثة واحدة معروضة في كل مرة) */
    if (!host) cwClose();
    const main = host || shell('<div class="empty">جاري التحميل...</div>', '#/chat');
    if (host) host.innerHTML = '<div class="empty" style="padding:30px">جاري التحميل...</div>';
    chatConnect();
    const data = await api('GET', '/api/chat');
    const st = {
      convId,
      host,
      main,
      data,
      app: null,
      conv: null,
      msgs: [],
      more: false,
      replyTo: null,
      q: '',
      pend: [],
      ta: null,
      readTimer: null,
    };
    mountShell(st);
    bindSide(st);
    if (convId && !(await openConv(st))) return;
    bindLiveEvents(st);
  }

  /* ===== الهيكل والقائمة الجانبية ===== */
  function shellHtml(st) {
    return `<div class="chat-app chat-th-${chatThemeOf()}${st.convId ? ' open' : ''}">
      <aside class="ch-side"><div class="ch-side-h"><b>الدردشة الداخلية</b><span class="row" style="gap:6px">${st.host ? '' : '<button class="btn sm ghost" id="chPop" title="فتح الدردشة في نافذة عائمة تبقى مفتوحة أثناء التنقل بين الصفحات">⧉ نافذة عائمة</button><button class="btn sm ghost" id="chSolo" title="نافذة مستقلة خارج المتصفح تضعها في أي مكان على الشاشة">🗗 نافذة مستقلة</button>'}<button class="btn sm ghost" id="chTheme" title="ثيم الدردشة">${icon('palette')}</button><button class="btn sm primary" id="chNew" title="محادثة خاصة مع أي مستخدم">➕ محادثة جديدة</button></span></div>
        <div class="ch-search"><input class="in" id="chQ" placeholder="ابحث في المحادثات..."></div><div class="ch-list" id="chList"></div></aside>
      <section class="ch-main" id="chMain"><div class="ch-empty">${icon('message')}<b>اختر محادثة</b><span>مجموعة فرعك، أو محادثة خاصة مع أي زميل من "محادثة جديدة"</span></div></section></div>`;
  }

  function mountShell(st) {
    st.main.innerHTML = shellHtml(st);
    const app = $('.chat-app', st.main);
    st.app = app;
    app.addEventListener('dragover', (e) => {
      if ([...((e.dataTransfer || {}).types || [])].includes('Files')) e.preventDefault();
    });
    app.addEventListener('drop', (e) => e.preventDefault());
    /* ارتفاع الدردشة = المساحة المتبقية من الشاشة تحت الشريط العلوي (يختلف بين الكمبيوتر والجوال) */
    const fit = () => {
      if (!document.body.contains(app)) {
        window.removeEventListener('resize', fit);
        return;
      }
      app.style.height = `${Math.max(420, window.innerHeight - app.getBoundingClientRect().top - window.scrollY - (SOLO ? 0 : 14))}px`;
    };
    if (!st.host) {
      fit();
      window.addEventListener('resize', fit);
    }
  }

  function listItemHtml(st, c) {
    const muted = chatIsMuted(c.id);
    const last = c.last
      ? `${c.kind === 'branch' || c.last.fromName === 'أنت' ? `${esc(c.last.fromName)}: ` : ''}${esc(c.last.text)}`
      : `<i class="muted">${esc(c.sub)}</i>`;
    return `<a class="ch-item${c.id === st.convId ? ' on' : ''}" href="#/chat/${encodeURIComponent(c.id)}">${chatAv(c)}
        <span class="ch-it"><span class="ch-row"><b>${esc(c.title)}</b><small>${esc(chatWhen((c.last || {}).at))}</small></span>
        <span class="ch-row"><span class="ch-last">${last}</span>${muted ? `<span class="ch-muted" title="${esc(chatMuteText(c.id))}">${icon('bell')}</span>` : ''}${c.unread ? `<span class="ch-un${muted ? ' mute' : ''}">${c.unread}</span>` : ''}</span></span></a>`;
  }

  function drawList(st) {
    const xs = st.data.list.filter((c) => !st.q || `${c.title} ${c.sub}`.toLowerCase().includes(st.q));
    $('#chList').innerHTML =
      xs.map((c) => listItemHtml(st, c)).join('') || '<div class="muted" style="padding:20px;text-align:center">لا توجد محادثات</div>';
  }

  async function refreshList(st) {
    st.data = await api('GET', '/api/chat');
    drawList(st);
    state.stats = state.stats || {};
    state.stats.chatUnread = st.data.list.filter((c) => !chatIsMuted(c.id)).reduce((a, c) => a + c.unread, 0);
    setTopBadges();
  }

  function bindSide(st) {
    drawList(st);
    $('#chQ').addEventListener('input', (e) => {
      st.q = e.target.value.trim().toLowerCase();
      drawList(st);
    });
    $('#chNew').onclick = () => chatNewModal();
    $('#chTheme').onclick = () => chatThemeModal(st.app);
    if ($('#chPop'))
      $('#chPop').onclick = () => {
        const c = st.convId;
        location.hash = S.cwLastPage;
        setTimeout(() => cwOpen(c), 60);
      };
    if ($('#chSolo'))
      $('#chSolo').onclick = () => {
        if (chatSolo(st.convId)) location.hash = S.cwLastPage;
      };
    if (SOLO) {
      document.title = `الدردشة — ${state.config.appName || 'سادن'}`;
      soloTell();
    }
    state.chatOpen = st.convId || null;
  }

  async function markRead(st) {
    const conv = st.conv;
    if (!conv || document.hidden || st.app.closest('.cw.min')) return;
    try {
      await api('POST', `/api/chat/${encodeURIComponent(conv.id)}/read`);
    } catch {
      /* تجاهل */
    }
    const c = st.data.list.find((x) => x.id === conv.id);
    if (c && c.unread) {
      c.unread = 0;
      drawList(st);
    }
    state.stats = state.stats || {};
    state.stats.chatUnread = st.data.list.reduce((a, x) => a + x.unread, 0);
    setTopBadges();
  }

  /* ===== الرسائل ===== */
  function ticks(st, m) {
    if (m.from !== st.data.me || m.deleted) return '';
    const title = m.members ? (m.readBy >= m.members ? 'قرأها الجميع' : m.readBy ? `قرأها ${m.readBy} من ${m.members}` : 'أرسلناها') : '';
    return `<span class="ch-tick${m.members && m.readBy >= m.members ? ' read' : ''}" title="${title}">${icon('check')}${m.readBy ? icon('check') : ''}</span>`;
  }

  function senderHtml(m) {
    const hue = [...String(m.from)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);
    const initial = String(m.fromName || '?')
      .trim()
      .charAt(0);
    return `<div class="cm-from" style="--h:${hue}"><span class="cm-fav">${esc(initial)}</span>${esc(m.fromName)}</div>`;
  }

  function bubble(st, m) {
    const mine = m.from === st.data.me;
    return `<div class="cm${mine ? ' me' : ''}${m.kind === 'sticker' ? ' stk' : ''}" data-mid="${m.id}">
        ${!mine && st.conv.kind === 'branch' ? senderHtml(m) : ''}
        ${m.replyTo ? `<div class="cm-reply"><b>${esc(m.replyTo.fromName)}</b><span>${esc(String(m.replyTo.text || '').slice(0, 120))}</span></div>` : ''}
        ${m.deleted ? `<div class="cm-t del">${icon('ban')} تم حذف هذه الرسالة</div>` : ''}
        ${m.file ? chatFileHtml(m) : ''}${m.data ? chatSpecialHtml(m) : ''}
        ${m.text ? `<div class="cm-t">${chatText(m.text)}</div>` : ''}
        <div class="cm-meta">${chatTime(m.at)}${ticks(st, m)}</div>
        ${m.reactions ? `<div class="cm-reacts">${m.reactions.map((r) => `<button type="button" class="cm-rc${r.mine ? ' on' : ''}" data-react="${esc(r.e)}" title="${esc(r.names.join('، '))}">${esc(r.e)}${r.n > 1 ? `<small>${r.n}</small>` : ''}</button>`).join('')}</div>` : ''}
        ${m.deleted ? '' : `<div class="cm-acts"><button type="button" data-rbar="${m.id}" title="تفاعل">${icon('smile')}</button><button type="button" data-rep="${m.id}" title="رد">${icon('undo')}</button>${mine || st.data.admin ? `<button type="button" data-cdel="${m.id}" title="حذف">${icon('trash')}</button>` : ''}</div>`}</div>`;
  }

  /* keep: 'top' بعد تحميل الأقدم، 'stay' يبقي موضع القراءة، وبدونه ينزل لآخر المحادثة */
  function drawMsgs(st, keep) {
    const box = $('#chMsgs');
    if (!box) return;
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    const prevH = box.scrollHeight;
    let day = '',
      html = st.more ? '<div class="ch-more"><button type="button" class="btn sm" id="chMore">تحميل الرسائل الأقدم</button></div>' : '';
    for (const m of st.msgs) {
      const d = chatDay(m.at);
      if (d !== day) {
        day = d;
        html += `<div class="ch-day"><span>${esc(d)}</span></div>`;
      }
      html += bubble(st, m);
    }
    box.innerHTML = html || '<div class="ch-day"><span>لا توجد رسائل بعد — ابدأ المحادثة</span></div>';
    if (keep === 'top') box.scrollTop = box.scrollHeight - prevH;
    else if (keep !== 'stay' || atBottom) box.scrollTop = box.scrollHeight;
    /* الصور تكتمل بعد العرض: يبقى العرض في آخر المحادثة */
    const stick = keep !== 'top' && (keep !== 'stay' || atBottom);
    if (stick)
      $$('img', box).forEach((im) => {
        if (!im.complete)
          im.addEventListener(
            'load',
            () => {
              box.scrollTop = box.scrollHeight;
            },
            { once: true },
          );
      });
  }

  function drawReply(st) {
    const r = $('#chReply');
    const replyTo = st.replyTo;
    r.hidden = !replyTo;
    r.innerHTML = replyTo
      ? `<div><b>رد على ${esc(replyTo.fromName)}</b><span>${esc(String(chatPrevC(replyTo)).slice(0, 120))}</span></div><button type="button" class="btn sm ghost" id="chReplyX">✕</button>`
      : '';
    if (replyTo)
      $('#chReplyX').onclick = () => {
        st.replyTo = null;
        drawReply(st);
      };
  }

  /* رسالة جديدة وصلت من السيرفر: تُضاف إن لم تكن معروضة */
  function addMsg(st, m) {
    if (m && m.id && !st.msgs.some((x) => x.id === m.id)) {
      st.msgs.push(m);
      drawMsgs(st);
    }
  }

  /* ===== فتح محادثة ===== */
  async function openConv(st) {
    try {
      st.conv = await api('GET', `/api/chat/${encodeURIComponent(st.convId)}/messages`);
    } catch (err) {
      $('#chMain').innerHTML = `<div class="ch-empty">${icon('alert')}<b>${esc(err.message)}</b></div>`;
      return false;
    }
    st.msgs = st.conv.msgs;
    st.more = st.conv.more;
    $('#chMain').innerHTML = convHeadHtml(st) + composerHtml();
    drawMsgs(st);
    markRead(st);
    bindComposer(st);
    bindPending(st);
    bindAttachMenu(st);
    bindMsgClicks(st);
    bindConvHead(st);
    return true;
  }

  function convHeadHtml(st) {
    const conv = st.conv,
      me = st.data.me;
    const online = conv.members.filter((x) => x.online && x.id !== me).length;
    const sub =
      conv.kind === 'branch'
        ? `${conv.members.length} عضو${online ? ` — ${online} متصل الآن` : ''}`
        : `${esc(conv.sub || '')}${conv.members.some((x) => x.id !== me && x.online) ? ' — متصل الآن' : ''}`;
    return `<div class="ch-head"><a class="btn sm ghost ch-back" href="#/chat" title="رجوع">${icon('forward')}</a>${chatAv(conv)}
          <div class="ch-ht"><b>${esc(conv.title)}</b><small>${sub}</small></div>
          <span class="ch-mutew"><button type="button" class="btn sm ghost" id="chMute" title="إشعارات المحادثة">${icon('bell')}${chatIsMuted(conv.id) ? '<i class="ch-mute-x"></i>' : ''}</button><span class="ch-mutem" id="chMuteM" hidden></span></span>
          <button type="button" class="btn sm ghost" id="chFilesBtn" title="الملفات والوسائط">${icon('folderOpen')}</button>${conv.kind === 'branch' ? `<button type="button" class="btn sm ghost" id="chMembers" title="أعضاء المجموعة">${icon('users')}</button>` : ''}</div>
        <div class="ch-msgs" id="chMsgs"></div>
        <div class="ch-reply" id="chReply" hidden></div>
        <div class="ch-pend" id="chPend" hidden></div>`;
  }

  function composerHtml() {
    return `<form class="ch-comp" id="chForm"><button type="button" class="btn ghost ch-att ch-emo-btn" id="chEmo" title="إيموجي">${icon('smile')}</button><span class="ch-attw"><button type="button" class="btn ghost ch-att" id="chAtt" title="إرفاق">${icon('paperclip')}</button>
            <span class="ch-attm" id="chAttM" hidden>
              <label class="ch-atti" style="--c:#4f6bd8">${icon('file')}<span>مستند</span><input type="file" id="chFile" multiple hidden></label>
              <label class="ch-atti" style="--c:#3b9fd6">${icon('image')}<span>الصور والفيديو</span><input type="file" id="chImg" accept="image/*,video/*" multiple hidden></label>
              <button type="button" class="ch-atti" style="--c:#e0435a" id="chCamBtn">${icon('camera')}<span>الكاميرا</span></button><input type="file" id="chCam" accept="image/*" capture="environment" hidden>
              <button type="button" class="ch-atti" style="--c:#f2734d" data-sp="voice">${icon('mic')}<span>صوت</span></button><input type="file" id="chAud" accept="audio/*" hidden>
              <button type="button" class="ch-atti" style="--c:#0e9f9a" data-sp="contact">${icon('user')}<span>جهة اتصال</span></button>
              <button type="button" class="ch-atti" style="--c:#f5a03a" data-sp="poll">${icon('chart')}<span>استطلاع</span></button>
              <button type="button" class="ch-atti" style="--c:#7c5cd6" data-sp="event">${icon('calendar')}<span>حدث / اجتماع</span></button>
              <button type="button" class="ch-atti" style="--c:#0891b2" data-sp="sticker">${icon('smile')}<span>ملصق</span></button>
              <span class="ch-attsep"></span>
              <button type="button" class="ch-atti" style="--c:#d4a106" data-sp="quick">${icon('zap')}<span>ردود سريعة</span></button>
              <button type="button" class="ch-atti" style="--c:#1f3a5f" data-sp="request">${icon('file')}<span>طلب من النظام</span></button>
              <button type="button" class="ch-atti" style="--c:#16a34a" data-sp="location">${icon('mapPin')}<span>الموقع</span></button></span></span>
          <textarea class="in" id="chText" rows="1" placeholder="اكتب رسالة..." title="Enter للإرسال، Shift+Enter لسطر جديد"></textarea>
          <button class="btn primary ch-send" title="إرسال">${icon('send')}</button></form>`;
  }

  /* ===== خانة الكتابة والإرسال ===== */
  function grow(ta) {
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }

  function bindComposer(st) {
    const ta = $('#chText');
    st.ta = ta;
    ta.addEventListener('input', () => grow(ta));
    $('#chEmo').onclick = () => chatEmojiPanel(ta, $('#chEmo'));
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        $('#chForm').requestSubmit();
      }
    });
    ta.focus();
    $('#chForm').onsubmit = (e) => submitMsg(st, e);
    ta.addEventListener('paste', (e) => {
      const fl = [...((e.clipboardData || {}).files || [])];
      if (fl.length) {
        e.preventDefault();
        addPend(st, fl);
      }
    });
  }

  function closeEmoji() {
    const ep = document.querySelector('.ch-emo');
    if (ep) ep.remove();
  }

  async function submitMsg(st, e) {
    e.preventDefault();
    const ta = st.ta;
    const text = ta.value.trim();
    /* ملفات مسحوبة / ملصوقة بانتظار الإرسال: تُرسل ومعها النص المكتوب */
    if (st.pend.length) {
      closeEmoji();
      const fl = st.pend.map((x) => x.f);
      clearPend(st);
      await sendFiles(st, fl);
      return;
    }
    if (!text) return;
    closeEmoji();
    ta.value = '';
    grow(ta);
    const rid = st.replyTo && st.replyTo.id;
    st.replyTo = null;
    drawReply(st);
    try {
      const m = await api('POST', `${convUrl(st)}/messages`, { text, replyTo: rid });
      if (!st.msgs.some((x) => x.id === m.id)) {
        st.msgs.push(m);
        drawMsgs(st);
      }
    } catch (err) {
      toast(err.message, true);
      ta.value = text;
    }
  }

  /* إرسال الملفات المختارة: الصورة الكبيرة تُصغَّر أولاً، والنص المكتوب يُرسل مع أول ملف */
  async function sendFiles(st, files) {
    const ta = st.ta;
    $('#chAttM').hidden = true;
    let text = ta.value.trim();
    for (const f0 of files) {
      try {
        const f = await shrinkImage(f0);
        const m = await uploadFile(null, f, '', `${convUrl(st)}/files?text=${encodeURIComponent(text)}`);
        if (text) {
          text = '';
          ta.value = '';
          grow(ta);
        }
        addMsg(st, m);
      } catch (err) {
        toast(err.message, true);
      }
    }
  }

  /* ===== السحب والإفلات واللصق: الملفات تنتظر في شريط معاينة حتى الضغط على إرسال ===== */
  const fmtSize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} م.ب` : `${Math.max(1, Math.round(n / 1024))} ك.ب`);

  function drawPend(st) {
    const el = $('#chPend');
    if (!el) return;
    const pend = st.pend;
    el.hidden = !pend.length;
    el.innerHTML = pend.length
      ? `<div class="ch-pend-h"><b>${pend.length} ${pend.length === 1 ? 'ملف جاهز' : 'ملفات جاهزة'} للإرسال</b><span>اكتب تعليقاً إن أردت ثم اضغط إرسال</span><button type="button" class="btn sm ghost" data-pclr>إلغاء الكل</button></div>
          <div class="ch-pend-l">${pend.map((x, i) => `<div class="ch-pi" title="${esc(x.f.name)} — ${fmtSize(x.f.size)}">${x.url ? `<img src="${x.url}" alt="">` : `${icon('file')}<span>${esc(x.f.name)}</span><small>${fmtSize(x.f.size)}</small>`}<button type="button" data-prm="${i}" title="إزالة">✕</button></div>`).join('')}</div>`
      : '';
  }

  function clearPend(st) {
    st.pend.forEach((x) => x.url && URL.revokeObjectURL(x.url));
    st.pend = [];
    drawPend(st);
  }

  function addPend(st, files) {
    /* كل أنواع الملفات مقبولة؛ الحجم الأقصى يتحقق منه السيرفر */
    const fl = [...files].filter(Boolean);
    if (!fl.length) return;
    if (st.pend.length + fl.length > 10) toast('الحد 10 ملفات في المرة الواحدة', true);
    fl.slice(0, Math.max(0, 10 - st.pend.length)).forEach((f) =>
      st.pend.push({ f, url: /^image\//.test(f.type) ? URL.createObjectURL(f) : '' }),
    );
    drawPend(st);
    st.ta.focus();
  }

  function bindPending(st) {
    $('#chPend').addEventListener('click', (e) => {
      if (e.target.closest('[data-pclr]')) {
        clearPend(st);
        return;
      }
      const b = e.target.closest('[data-prm]');
      if (b) {
        const [x] = st.pend.splice(Number(b.dataset.prm), 1);
        if (x && x.url) URL.revokeObjectURL(x.url);
        drawPend(st);
      }
    });
    const zone = $('#chMain');
    const hasFiles = (e) => [...((e.dataTransfer || {}).types || [])].includes('Files');
    let dragN = 0;
    zone.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragN++;
      zone.classList.add('drop');
    });
    zone.addEventListener('dragover', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    zone.addEventListener('dragleave', () => {
      dragN = Math.max(0, dragN - 1);
      if (!dragN) zone.classList.remove('drop');
    });
    zone.addEventListener('drop', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragN = 0;
      zone.classList.remove('drop');
      addPend(st, e.dataTransfer.files);
    });
  }

  /* ===== قائمة الإرفاق: الملفات والكاميرا والرسائل الخاصة (استطلاع، حدث، جهة اتصال، موقع، ملصق، طلب) والصوت ===== */
  async function sendSpecial(st, kind, d) {
    const m = await api('POST', `${convUrl(st)}/special`, { kind, data: d, replyTo: st.replyTo && st.replyTo.id });
    st.replyTo = null;
    drawReply(st);
    if (!st.msgs.some((x) => x.id === m.id)) {
      st.msgs.push(m);
      drawMsgs(st);
    }
  }

  async function sendVoice(st, file, dur) {
    const m = await uploadFile(null, file, '', `${convUrl(st)}/files?voice=1&dur=${Math.round(dur)}`);
    addMsg(st, m);
  }

  function openSpecial(st, k) {
    const send = (kind, d) => sendSpecial(st, kind, d);
    const open = {
      poll: () => chatPollModal(send),
      event: () => chatEventModal(send),
      contact: () => chatContactModal(send),
      location: () => chatLocationModal(send),
      sticker: () => chatStickerModal(send),
      quick: () => chatQuickModal(st.ta),
      request: () => chatRequestModal(send),
      voice: () =>
        chatVoiceModal(
          (file, dur) => sendVoice(st, file, dur),
          () => $('#chAud').click(),
        ),
    }[k];
    if (open) open();
  }

  function bindAttachMenu(st) {
    ['#chFile', '#chImg', '#chCam', '#chAud'].forEach((s) => {
      $(s).onchange = (e) => {
        const fl = [...e.target.files];
        e.target.value = '';
        if (fl.length) sendFiles(st, fl);
      };
    });
    $('#chAtt').onclick = () => {
      $('#chAttM').hidden = !$('#chAttM').hidden;
    };
    $('#chAttM').addEventListener('click', (e) => {
      const b = e.target.closest('[data-sp]');
      if (!b) return;
      $('#chAttM').hidden = true;
      openSpecial(st, b.dataset.sp);
    });
    document.addEventListener('mousedown', function closeAtt(e) {
      const m = $('#chAttM');
      if (!m) {
        document.removeEventListener('mousedown', closeAtt);
        return;
      }
      if (!e.target.closest('.ch-attw')) m.hidden = true;
    });
    /* الكاميرا: في الجوال تفتح كاميرا الجهاز مباشرة، وفي الكمبيوتر كاميرا الويب (تحتاج https أو localhost) */
    $('#chCamBtn').onclick = () => {
      const mobile =
        /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && !matchMedia('(pointer:fine)').matches);
      if (mobile || !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext)) {
        $('#chCam').click();
        return;
      }
      cameraModal((file) => sendFiles(st, [file]));
    };
  }

  /* ===== الضغط داخل الرسائل: التفاعل، التصويت، الحضور، المراسلة، الأقدم، الرد، الحذف ===== */
  function bindMsgClicks(st) {
    document.addEventListener('mousedown', function closeRbar(e) {
      const b = $('#chMsgs');
      if (!b) {
        document.removeEventListener('mousedown', closeRbar);
        return;
      }
      if (!e.target.closest('.cm-rbar, [data-rbar]')) $$('.cm-rbar', b).forEach((x) => x.remove());
    });
    $('#chMsgs').addEventListener('click', (e) => onMsgClick(st, e));
  }

  async function onMsgClick(st, e) {
    /* التفاعل: شريط سريع (👍 ❤️ 😂 😮 😢 🙏) و"+" لكل الإيموجي، وضغط تفاعل موجود يضيفه أو يلغيه */
    if (e.target.closest('[data-rbar], [data-remo], [data-react], [data-rmore]')) {
      await onReact(st, e);
      return;
    }
    const vote = e.target.closest('[data-vote]'),
      rsvp = e.target.closest('[data-rsvp]'),
      dm = e.target.closest('[data-dm]');
    const mm = (vote || rsvp) && st.msgs.find((x) => x.id === e.target.closest('[data-mid]').dataset.mid);
    if (vote && mm) {
      await onVote(st, mm, Number(vote.dataset.vote));
      return;
    }
    if (rsvp && mm) {
      await onRsvp(st, mm, rsvp.dataset.rsvp);
      return;
    }
    if (dm) {
      await onDirect(st, dm.dataset.dm);
      return;
    }
    await onMsgActs(st, e);
  }

  async function onReact(st, e) {
    const rbar = e.target.closest('[data-rbar]'),
      remo = e.target.closest('[data-remo]'),
      rc = e.target.closest('[data-react]'),
      rmore = e.target.closest('[data-rmore]');
    const bub = e.target.closest('[data-mid]'),
      mid = bub.dataset.mid;
    if (rbar) {
      $$('.cm-rbar', $('#chMsgs')).forEach((x) => x.remove());
      bub.insertAdjacentHTML(
        'beforeend',
        `<div class="cm-rbar">${['👍', '❤️', '😂', '😮', '😢', '🙏'].map((x) => `<button type="button" data-remo="${x}">${x}</button>`).join('')}<button type="button" data-rmore="1" title="المزيد">＋</button></div>`,
      );
      return;
    }
    if (rmore) {
      const bar = rmore.closest('.cm-rbar');
      bar.classList.add('full');
      bar.innerHTML = EMOJIS.slice(0, 3)
        .map(([, , s]) => s)
        .join(' ')
        .split(' ')
        .filter(Boolean)
        .map((x) => `<button type="button" data-remo="${x}">${x}</button>`)
        .join('');
      return;
    }
    const em = remo ? remo.dataset.remo : rc.dataset.react;
    $$('.cm-rbar', $('#chMsgs')).forEach((x) => x.remove());
    try {
      const u = await api('POST', `${convUrl(st)}/messages/${mid}/react`, { e: em });
      const i = st.msgs.findIndex((x) => x.id === mid);
      if (i >= 0) {
        st.msgs[i] = u;
        drawMsgs(st, 'stay');
      }
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function onVote(st, mm, i) {
    const cur = mm.data.mine;
    const sel = mm.data.multi ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]) : cur.includes(i) ? [] : [i];
    try {
      Object.assign(mm, await api('POST', `${convUrl(st)}/messages/${mm.id}/vote`, { options: sel }));
      drawMsgs(st, 'stay');
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function onRsvp(st, mm, v) {
    try {
      Object.assign(mm, await api('POST', `${convUrl(st)}/messages/${mm.id}/rsvp`, { v: v === mm.data.mine ? '' : v }));
      drawMsgs(st, 'stay');
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function onDirect(st, userId) {
    if (userId === st.data.me) return;
    try {
      const r = await api('POST', '/api/chat/direct', { userId });
      chatGo(r.id);
    } catch (err) {
      toast(err.message, true);
    }
  }

  /* تحميل الأقدم، والرد، والحذف */
  async function onMsgActs(st, e) {
    const rep = e.target.closest('[data-rep]'),
      del = e.target.closest('[data-cdel]');
    if (e.target.id === 'chMore') {
      const r = await api('GET', `${convUrl(st)}/messages?before=${encodeURIComponent(st.msgs[0].at)}`);
      st.msgs = [...r.msgs, ...st.msgs];
      st.more = r.more;
      drawMsgs(st, 'top');
    }
    if (rep) {
      st.replyTo = st.msgs.find((m) => m.id === rep.dataset.rep);
      drawReply(st);
      st.ta.focus();
    }
    if (del) {
      if (!(await askYesNo('حذف هذه الرسالة عند الجميع؟'))) return;
      try {
        await api('DELETE', `${convUrl(st)}/messages/${del.dataset.cdel}`);
      } catch (err) {
        toast(err.message, true);
      }
    }
  }

  /* ===== رأس المحادثة: الأعضاء، الملفات، كتم الإشعارات ===== */
  function bindConvHead(st) {
    const conv = st.conv;
    const reopen = () => viewChat(st.convId, st.host);
    if ($('#chMembers')) $('#chMembers').onclick = () => chatMembersModal(conv, st.data.admin, reopen);
    $('#chFilesBtn').onclick = () => chatFilesModal(conv);
    $('#chMute').onclick = () => {
      const m = $('#chMuteM');
      const muted = chatIsMuted(conv.id);
      m.innerHTML = `<b>إشعارات المحادثة</b>${muted ? `<small>${esc(chatMuteText(conv.id))}</small><button type="button" data-mf="">${icon('bell')} إلغاء الكتم</button>` : ''}<button type="button" data-mf="8h">كتم 8 ساعات</button><button type="button" data-mf="1w">كتم أسبوعاً</button><button type="button" data-mf="always">كتم دائماً</button>`;
      m.hidden = !m.hidden;
    };
    $('#chMuteM').onclick = async (e) => {
      const b = e.target.closest('[data-mf]');
      if (!b) return;
      $('#chMuteM').hidden = true;
      await chatSetMute(conv.id, b.dataset.mf);
      reopen();
    };
  }

  /* ===== أحداث الدردشة الفورية لهذه الصفحة (تتوقف عند مغادرتها) ===== */
  function bindLiveEvents(st) {
    const onEv = (e) => {
      if (!document.body.contains(st.app)) {
        window.removeEventListener('chat-ev', onEv);
        document.removeEventListener('visibilitychange', onVis);
        return;
      }
      const ev = e.detail;
      if (st.conv && ev.conv === st.conv.id) onConvEvent(st, ev);
      if (ev.type === 'msg' || ev.type === 'del') refreshList(st);
    };
    const onVis = () => {
      if (!document.hidden) markRead(st);
    };
    window.addEventListener('chat-ev', onEv);
    document.addEventListener('visibilitychange', onVis);
  }

  function onConvEvent(st, ev) {
    if (ev.type === 'msg' && !st.msgs.some((x) => x.id === ev.msg.id)) {
      st.msgs.push(ev.msg);
      drawMsgs(st, 'stay');
      if (ev.msg.from !== st.data.me) markRead(st);
    }
    if (ev.type === 'upd') {
      const i = st.msgs.findIndex((x) => x.id === ev.msg.id);
      if (i >= 0) {
        st.msgs[i] = ev.msg;
        drawMsgs(st, 'stay');
      }
    }
    if (ev.type === 'del') {
      const m = st.msgs.find((x) => x.id === ev.id);
      if (m) {
        Object.assign(m, { deleted: true, text: '', file: null });
        drawMsgs(st, 'stay');
      }
    }
    /* قراءة الطرف الآخر: تُحدَّث علامات القراءة لرسائلي */
    if (ev.type === 'read' && ev.userId !== st.data.me) {
      clearTimeout(st.readTimer);
      st.readTimer = setTimeout(async () => {
        try {
          const r = await api('GET', `${convUrl(st)}/messages`);
          const map = new Map(r.msgs.map((m) => [m.id, m]));
          st.msgs = st.msgs.map((m) => map.get(m.id) || m);
          drawMsgs(st, 'stay');
        } catch {
          /* تجاهل */
        }
      }, 400);
    }
  }

  return { viewChat };
};
