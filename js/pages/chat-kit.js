'use strict';
/* أجزاء صفحة الدردشة: لوحة الإيموجي والثيم، وعرض الملفات والرسائل الخاصة، ونوافذ الاستطلاع والحدث وجهة الاتصال والموقع والملصق والردود السريعة ومشاركة الطلب */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['chat'] = function (S) {
  const {
    $,
    $$,
    CHAT_STATUS,
    CHAT_STICKERS,
    CHAT_THEMES,
    EMOJIS,
    api,
    can,
    chatAv,
    chatDay,
    chatDur,
    chatErr,
    chatModal,
    chatText,
    chatThemeOf,
    chatWhen,
    chip,
    esc,
    icon,
    state,
    today,
    toast,
  } = S;
  /* لوحة الإيموجي: تُدرج عند موضع المؤشر في خانة الكتابة */
  function chatEmojiPanel(ta, anchor) {
    const old = document.querySelector('.ch-emo');
    if (old) {
      old.remove();
      return;
    }
    const p = document.createElement('div');
    p.className = 'ch-emo';
    let cat = 0;
    let recent = [];
    try {
      recent = JSON.parse(localStorage.getItem('chat:emoji') || '[]');
    } catch {
      /* تجاهل */
    }
    const tabs = [...(recent.length ? [['🕘', 'المستخدمة مؤخراً', recent.join(' ')]] : []), ...EMOJIS];
    const draw = () => {
      p.innerHTML = `<div class="ch-emo-tabs">${tabs.map(([ic, l], i) => `<button type="button" data-cat="${i}" class="${i === cat ? 'on' : ''}" title="${l}">${ic}</button>`).join('')}</div>
        <div class="ch-emo-l">${esc(tabs[cat][1])}</div><div class="ch-emo-g">${tabs[cat][2]
          .split(' ')
          .filter(Boolean)
          .map((e) => `<button type="button" data-emo="${e}">${e}</button>`)
          .join('')}</div>`;
    };
    draw();
    p.addEventListener('mousedown', (e) => e.preventDefault());
    p.addEventListener('click', (e) => {
      const c = e.target.closest('[data-cat]'),
        em = e.target.closest('[data-emo]');
      if (c) {
        cat = Number(c.dataset.cat);
        draw();
        return;
      }
      if (!em) return;
      const v = em.dataset.emo,
        s = ta.selectionStart ?? ta.value.length,
        en = ta.selectionEnd ?? ta.value.length;
      ta.value = ta.value.slice(0, s) + v + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + v.length;
      ta.dispatchEvent(new Event('input'));
      ta.focus();
      recent = [v, ...recent.filter((x) => x !== v)].slice(0, 24);
      try {
        localStorage.setItem('chat:emoji', JSON.stringify(recent));
      } catch {
        /* تجاهل */
      }
    });
    anchor.closest('.ch-main').appendChild(p);
    const close = (e) => {
      if (!p.contains(e.target) && !anchor.contains(e.target)) {
        p.remove();
        document.removeEventListener('mousedown', close);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', close), 0);
  }

  /* اختيار ثيم الدردشة: معاينة فورية ويُحفظ في حساب المستخدم */
  function chatThemeModal(app) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const cur = chatThemeOf();
    bg.innerHTML = `<div class="modal" style="max-width:640px;width:96%"><h3 style="margin-top:0">ثيم الدردشة</h3>
      <div class="ch-themes">${CHAT_THEMES.map(([k, l]) => `<button type="button" class="ch-th chat-th-${k}${k === cur ? ' on' : ''}" data-th="${k}"><span class="ch-th-bg"><i class="o"></i><i class="m"></i><i class="o s"></i></span><b>${l}</b></button>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-x>إغلاق</button></div></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('.ch-themes', bg).onclick = async (e) => {
      const b = e.target.closest('[data-th]');
      if (!b) return;
      const th = b.dataset.th;
      app.className = app.className.replace(/\bchat-th-\S+/g, '').trim() + ` chat-th-${th}`;
      $$('.ch-th', bg).forEach((x) => x.classList.toggle('on', x === b));
      try {
        await api('PUT', '/api/me/chat-theme', { theme: th });
        state.user.chatTheme = th;
      } catch (err) {
        toast(err.message, true);
      }
    };
  }

  function chatFileHtml(m) {
    const f = m.file,
      u = `/api/chat/files/${m.id}`;
    return `<div class="cm-media">${chatFileBody(m, f, u)}<a class="cm-dl" href="${u}?dl=1" download="${esc(f.name)}" title="تحميل ${esc(f.name)}">${icon('download')}</a></div>`;
  }

  function chatFileBody(m, f, u) {
    if (f.kind === 'image') return `<a href="${u}" target="_blank"><img class="cm-img" src="${u}" alt="${esc(f.name)}" loading="lazy"></a>`;
    if (f.kind === 'video') return `<video class="cm-vid" src="${u}" controls preload="metadata" playsinline></video>`;
    if (f.kind === 'voice' || f.kind === 'audio')
      return `<div class="cm-aud"><span class="cm-aud-ic">${icon(f.kind === 'voice' ? 'mic' : 'music')}</span><audio controls preload="metadata" src="${u}"></audio>${f.kind === 'audio' ? `<small>${esc(f.name)}</small>` : f.dur ? `<small>${chatDur(f.dur)}</small>` : ''}</div>`;
    return `<a class="cm-file" href="${u}" target="_blank">${icon('paperclip')}<span>${esc(f.name)}<small>${Math.ceil(f.size / 1024)} KB</small></span></a>`;
  }

  function chatSpecialHtml(m) {
    const d = m.data;
    if (m.kind === 'sticker')
      return d.s === 'saden' ? '<img class="cm-stk-img" src="logo.png" alt="سادن">' : `<div class="cm-stk">${esc(d.s)}</div>`;
    if (m.kind === 'contact')
      return `<div class="cm-card"><div class="cm-card-h">${chatAv({ title: d.name })}<div><b>${esc(d.name)}</b><small>${esc([d.title, d.branch ? `فرع ${d.branch}` : ''].filter(Boolean).join(' — '))}</small></div></div>
      ${d.phone ? `<a class="cm-card-l" href="tel:${esc(d.phone)}" dir="ltr">${icon('phone')}${esc(d.phone)}</a>` : ''}${d.email ? `<a class="cm-card-l" href="mailto:${esc(d.email)}">${icon('mail')}${esc(d.email)}</a>` : ''}
      <button type="button" class="btn sm" data-dm="${esc(d.userId)}">${icon('message')} مراسلة</button></div>`;
    if (m.kind === 'poll')
      return `<div class="cm-poll"><b class="cm-pq">${icon('chart')} ${esc(d.q)}</b><small class="muted">${d.multi ? 'يمكن اختيار أكثر من إجابة' : 'اختر إجابة واحدة'}</small>
      ${d.options
        .map((o, i) => {
          const n = d.counts[i],
            pct = d.voters ? Math.round((n / d.voters) * 100) : 0,
            on = d.mine.includes(i);
          return `<button type="button" class="cm-po${on ? ' on' : ''}" data-vote="${i}" title="${esc(d.names[i].join('، ') || 'لا أصوات')}"><span class="cm-pc">${on ? icon('check') : ''}</span><span class="cm-pt">${esc(o)}</span><span class="cm-pn">${n}</span><i style="width:${pct}%"></i></button>`;
        })
        .join('')}
      <small class="muted">${d.voters} ${d.voters === 1 ? 'صوت' : 'أصوات'}</small></div>`;
    if (m.kind === 'event') {
      const dd = new Date(`${d.date}T00:00:00`);
      return `<div class="cm-card cm-event"><div class="cm-ev-h"><span class="cm-ev-d"><b>${dd.getDate()}</b><small>${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][dd.getMonth()]}</small></span>
        <div><b>${esc(d.title)}</b><small>${icon('calendar')} ${esc(chatDay(`${d.date}T12:00:00`))}${d.time ? ` — ${esc(d.time)}` : ''}</small>${d.place ? `<small>${icon('mapPin')} ${esc(d.place)}</small>` : ''}</div></div>
        ${d.desc ? `<div class="cm-t">${chatText(d.desc)}</div>` : ''}
        <div class="cm-rsvp">${[
          ['yes', 'سأحضر'],
          ['maybe', 'ربما'],
          ['no', 'لن أحضر'],
        ]
          .map(
            ([k, l]) =>
              `<button type="button" class="btn sm${d.mine === k ? ' primary' : ''}" data-rsvp="${k}" title="${esc(d[k].join('، ') || 'لا أحد')}">${l} (${d[k].length})</button>`,
          )
          .join('')}</div></div>`;
    }
    if (m.kind === 'location') {
      const href = d.url || `https://www.google.com/maps?q=${d.lat},${d.lng}`;
      return `<a class="cm-card cm-loc" href="${esc(href)}" target="_blank" rel="noopener"><span class="cm-loc-map">${icon('mapPin')}</span><div><b>${esc(d.label || 'الموقع')}</b><small dir="ltr">${d.lat != null ? `${Number(d.lat).toFixed(5)}, ${Number(d.lng).toFixed(5)}` : esc(d.url)}</small><small class="cm-lnk">فتح في الخرائط</small></div></a>`;
    }
    if (m.kind === 'request')
      return `<a class="cm-card cm-req" href="#/req/${esc(d.id)}">${icon('file')}<div><b>طلب <bdi dir="ltr">${esc(d.serial)}</bdi></b><small>${esc(d.typeTitle)}${d.branch ? ` — ${esc(d.branch)}` : ''}</small>${d.summary ? `<small>${esc(d.summary)}</small>` : ''}<span class="chip ${esc(d.status)}">${esc(d.status === 'pending' ? `بانتظار ${d.stepLabel || ''}` : CHAT_STATUS[d.status] || d.status)}</span></div></a>`;
    return '';
  }

  /* الملفات والوسائط في المحادثة: فلترة بالنوع، فتح وتحميل */
  async function chatFilesModal(conv) {
    const list = await api('GET', `/api/chat/${encodeURIComponent(conv.id)}/files`);
    const KINDS = [
      ['', 'الكل'],
      ['image', 'الصور'],
      ['video', 'الفيديو'],
      ['audio', 'الصوت'],
      ['doc', 'المستندات'],
    ];
    const kindOf = (k) => (k === 'voice' ? 'audio' : k);
    const ic = { image: 'image', video: 'camera', audio: 'mic', doc: 'file' };
    let cur = '';
    const bg = chatModal(
      `${icon('folderOpen')} الملفات والوسائط — ${esc(conv.title)}`,
      `<div class="tabs" id="cfT" style="margin-bottom:10px">${KINDS.map(([k, l]) => `<button type="button" class="tab${k === cur ? ' on' : ''}" data-k="${k}">${l} <small class="muted">(${list.filter((x) => !k || kindOf(x.kind) === k).length})</small></button>`).join('')}</div>
      <div class="ch-files" id="cfL"></div><div class="row" style="margin-top:12px"><button type="button" class="btn ghost" data-x>إغلاق</button></div>`,
      720,
    );
    const draw = () => {
      $$('#cfT .tab', bg).forEach((b) => b.classList.toggle('on', b.dataset.k === cur));
      const xs = list.filter((x) => !cur || kindOf(x.kind) === cur);
      $('#cfL', bg).innerHTML =
        xs
          .map(
            (
              x,
            ) => `<div class="ch-file">${x.kind === 'image' ? `<img src="/api/chat/files/${x.id}" alt="" loading="lazy">` : `<span class="ch-file-ic">${icon(ic[kindOf(x.kind)] || 'file')}</span>`}
        <div class="ch-file-t"><b>${esc(x.kind === 'voice' ? 'رسالة صوتية' : x.name)}</b><small>${esc(x.fromName)} — ${esc(chatWhen(x.at))} — ${Math.ceil(x.size / 1024)} KB</small>${x.text ? `<small>${esc(x.text.slice(0, 80))}</small>` : ''}</div>
        <a class="btn sm ghost" href="/api/chat/files/${x.id}" target="_blank" title="فتح">${icon('eye')}</a><a class="btn sm" href="/api/chat/files/${x.id}?dl=1" download="${esc(x.name)}" title="تحميل">${icon('download')} تحميل</a></div>`,
          )
          .join('') || '<div class="muted" style="padding:20px;text-align:center">لا توجد ملفات</div>';
    };
    $('#cfT', bg).onclick = (e) => {
      const b = e.target.closest('[data-k]');
      if (b) {
        cur = b.dataset.k;
        draw();
      }
    };
    draw();
  }

  function chatPollModal(send) {
    const bg = chatModal(
      `${icon('chart')} استطلاع جديد`,
      `<div class="field"><label>السؤال</label><input class="in" id="poQ" placeholder="مثال: موعد الاجتماع الأنسب؟"></div>
      <label class="muted">الخيارات</label><div id="poOpts">${[1, 2].map((i) => `<input class="in po-o" placeholder="خيار ${i}" style="margin-bottom:6px">`).join('')}</div>
      <button type="button" class="btn sm" id="poAdd">+ إضافة خيار</button>
      <label class="row" style="gap:6px;margin-top:10px;align-items:center"><input type="checkbox" id="poMulti"> السماح باختيار أكثر من إجابة</label>
      <div class="row" style="margin-top:14px;gap:8px"><button type="button" class="btn primary" id="poSend">${icon('send')} إرسال</button><button type="button" class="btn ghost" data-x>إلغاء</button></div>`,
    );
    $('#poAdd', bg).onclick = () => {
      const n = $$('.po-o', bg).length;
      if (n < 12)
        $('#poOpts', bg).insertAdjacentHTML('beforeend', `<input class="in po-o" placeholder="خيار ${n + 1}" style="margin-bottom:6px">`);
    };
    $('#poQ', bg).focus();
    $('#poSend', bg).onclick = async () => {
      try {
        await send('poll', {
          q: $('#poQ', bg).value,
          options: $$('.po-o', bg)
            .map((i) => i.value.trim())
            .filter(Boolean),
          multi: $('#poMulti', bg).checked,
        });
        bg.remove();
      } catch (err) {
        chatErr(bg, err.message);
      }
    };
  }

  function chatEventModal(send) {
    const bg = chatModal(
      `${icon('calendar')} حدث / اجتماع`,
      `<div class="field"><label>العنوان</label><input class="in" id="evT" placeholder="مثال: اجتماع مراجعة الجرد"></div>
      <div class="grid2"><div class="field"><label>التاريخ</label><input class="in" type="date" id="evD" value="${today()}"></div><div class="field"><label>الوقت</label><input class="in" type="time" id="evTm"></div></div>
      <div class="field"><label>المكان</label><input class="in" id="evP" placeholder="مثال: مكتب مدير الفرع / اجتماع عن بعد"></div>
      <div class="field"><label>التفاصيل</label><textarea class="in" id="evDs" rows="3"></textarea></div>
      <div class="row" style="margin-top:6px;gap:8px"><button type="button" class="btn primary" id="evSend">${icon('send')} إرسال</button><button type="button" class="btn ghost" data-x>إلغاء</button></div>`,
    );
    $('#evT', bg).focus();
    $('#evSend', bg).onclick = async () => {
      try {
        await send('event', {
          title: $('#evT', bg).value,
          date: $('#evD', bg).value,
          time: $('#evTm', bg).value,
          place: $('#evP', bg).value,
          desc: $('#evDs', bg).value,
        });
        bg.remove();
      } catch (err) {
        chatErr(bg, err.message);
      }
    };
  }

  async function chatContactModal(send) {
    const users = await api('GET', '/api/chat/users');
    const bg = chatModal(
      `${icon('user')} مشاركة جهة اتصال`,
      `<input class="in" id="ctQ" placeholder="ابحث بالاسم أو الفرع أو المسمى..." style="margin-bottom:10px"><div class="ch-users" id="ctL"></div>
      <div class="row" style="margin-top:12px"><button type="button" class="btn ghost" data-x>إلغاء</button></div>`,
    );
    const draw = (q) => {
      $('#ctL', bg).innerHTML = users
        .filter((u) => !q || `${u.name} ${u.title} ${u.branch}`.toLowerCase().includes(q))
        .map(
          (u) =>
            `<button type="button" class="ch-user" data-uid="${u.id}">${chatAv({ title: u.name })}<span><b>${esc(u.name)}</b><small>${esc([u.title, u.branch ? `فرع ${u.branch}` : ''].filter(Boolean).join(' — '))}</small></span></button>`,
        )
        .join('');
    };
    draw('');
    $('#ctQ', bg).addEventListener('input', (e) => draw(e.target.value.trim().toLowerCase()));
    $('#ctL', bg).onclick = async (e) => {
      const b = e.target.closest('[data-uid]');
      if (!b) return;
      try {
        await send('contact', { userId: b.dataset.uid });
        bg.remove();
      } catch (err) {
        chatErr(bg, err.message);
      }
    };
  }

  /* الموقع: الموقع الحالي من المتصفح (يحتاج https أو localhost)، أو رابط خريطة / إحداثيات */
  function chatLocationModal(send) {
    const bg = chatModal(
      `${icon('mapPin')} مشاركة موقع`,
      `<div class="row" style="gap:8px;margin-bottom:10px"><button type="button" class="btn primary" id="lcMe" style="flex:1">${icon('mapPin')} استخدام موقعي الحالي</button><button type="button" class="btn" id="lcMap" style="flex:1">🗺 اختيار على الخريطة</button></div>
      <div id="lcMapBox" hidden style="height:260px;border-radius:10px;overflow:hidden;margin-bottom:10px;border:1px solid var(--line)"></div>
      <div class="hint" id="lcInfo" style="margin-bottom:10px"></div>
      <div class="field"><label>اسم المكان (اختياري)</label><input class="in" id="lcL" placeholder="مثال: موقع مشروع طريق الملك فهد"></div>
      <div class="field"><label>أو الصق رابط الخريطة / الإحداثيات</label><input class="in" id="lcU" dir="ltr" placeholder="https://maps.google.com/...  أو  24.7136, 46.6753"></div>
      <div class="row" style="margin-top:6px;gap:8px"><button type="button" class="btn ok" id="lcSend">${icon('send')} إرسال</button><button type="button" class="btn ghost" data-x>إلغاء</button></div>`,
    );
    /* lc.pos: الموقع المختار (من المتصفح أو من الخريطة) */
    const lc = { pos: null };
    if (!navigator.geolocation || !window.isSecureContext)
      $('#lcInfo', bg).textContent =
        'تحديد الموقع الحالي تلقائياً يحتاج اتصالاً آمناً (https). اختر المكان على الخريطة، أو الصق رابط الموقع من خرائط جوجل.';
    $('#lcMe', bg).onclick = () => lcLocateMe(bg, lc);
    $('#lcMap', bg).onclick = () => lcPickOnMap(bg, lc);
    $('#lcSend', bg).onclick = () => lcSend(bg, lc, send);
  }

  /* الموقع الحالي من المتصفح */
  function lcLocateMe(bg, lc) {
    if (!navigator.geolocation) {
      chatErr(bg, 'المتصفح لا يدعم تحديد الموقع');
      return;
    }
    $('#lcInfo', bg).textContent = 'جاري تحديد الموقع...';
    navigator.geolocation.getCurrentPosition(
      (p) => {
        lc.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        $('#lcInfo', bg).textContent =
          `✔ تم تحديد موقعك (${lc.pos.lat.toFixed(5)}, ${lc.pos.lng.toFixed(5)}) بدقة ${Math.round(p.coords.accuracy)} م`;
        $('#lcU', bg).value = '';
      },
      (err) => {
        $('#lcInfo', bg).textContent = `تعذر تحديد الموقع: ${err.message}. الصق رابط الموقع بدلاً منه.`;
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  /* مكتبة الخريطة (Leaflet) تُحمَّل عند أول استخدام */
  function lcLoadLeaflet() {
    return window.L
      ? Promise.resolve()
      : new Promise((ok, no) => {
          const css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href = 'vendor/leaflet/leaflet.css';
          document.head.appendChild(css);
          const s = document.createElement('script');
          s.src = 'vendor/leaflet/leaflet.js';
          s.onload = ok;
          s.onerror = no;
          document.head.appendChild(s);
        });
  }

  /* الخريطة (OpenStreetMap): اضغط على المكان لتحديده — تحتاج اتصال إنترنت */
  async function lcPickOnMap(bg, lc) {
    const box = $('#lcMapBox', bg);
    box.hidden = false;
    box.textContent = 'جاري تحميل الخريطة...';
    try {
      await lcLoadLeaflet();
    } catch {
      box.textContent = 'تعذر تحميل الخريطة (تحتاج اتصال إنترنت) — الصق رابط الموقع بدلاً منها.';
      return;
    }
    box.textContent = '';
    const pos = lc.pos;
    const map = window.L.map(box).setView(pos ? [pos.lat, pos.lng] : [24.7136, 46.6753], pos ? 15 : 6);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    let mk = pos ? window.L.marker([pos.lat, pos.lng]).addTo(map) : null;
    map.on('click', (e) => {
      lc.pos = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (mk) mk.setLatLng(e.latlng);
      else mk = window.L.marker(e.latlng).addTo(map);
      $('#lcU', bg).value = '';
      $('#lcInfo', bg).textContent = `✔ تم اختيار الموقع (${lc.pos.lat.toFixed(5)}, ${lc.pos.lng.toFixed(5)})`;
    });
    setTimeout(() => map.invalidateSize(), 50);
  }

  /* الإرسال: الرابط / الإحداثيات الملصوقة تتقدم على الموقع المختار */
  async function lcSend(bg, lc, send) {
    const raw = $('#lcU', bg).value.trim();
    let data = lc.pos ? { ...lc.pos } : {};
    if (raw) {
      const m = /(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/.exec(raw.replace(/%2C/gi, ','));
      data = m ? { lat: Number(m[1]), lng: Number(m[2]), url: /^https?:\/\//.test(raw) ? raw : '' } : { url: raw };
    }
    data.label = $('#lcL', bg).value.trim();
    try {
      await send('location', data);
      bg.remove();
    } catch (err) {
      chatErr(bg, err.message);
    }
  }

  function chatStickerModal(send) {
    const bg = chatModal(
      `${icon('smile')} ملصقات`,
      `<div class="ch-stks">${CHAT_STICKERS.map((s) => `<button type="button" data-stk="${s}">${s === 'saden' ? '<img src="logo.png" alt="سادن">' : s}</button>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button type="button" class="btn ghost" data-x>إغلاق</button></div>`,
      460,
    );
    $('.ch-stks', bg).onclick = async (e) => {
      const b = e.target.closest('[data-stk]');
      if (!b) return;
      try {
        await send('sticker', { s: b.dataset.stk });
        bg.remove();
      } catch (err) {
        chatErr(bg, err.message);
      }
    };
  }

  /* الردود السريعة: نصوص محفوظة في حساب المستخدم تُدرج في خانة الكتابة بضغطة */
  function chatQuickModal(ta) {
    let list = [...((state.user || {}).quickReplies || [])];
    const bg = chatModal(
      `${icon('zap')} الردود السريعة`,
      `<div class="ch-qr" id="qrL"></div>
      <div class="row" style="gap:6px;margin-top:10px"><input class="in" id="qrN" placeholder="أضف رداً جديداً (مثال: تم الاستلام وجاري المراجعة)" style="flex:1"><button type="button" class="btn" id="qrAdd">+ إضافة</button></div>
      <div class="hint" style="margin-top:6px">اضغط على الرد لإدراجه في الرسالة. تُحفظ في حسابك.</div>
      <div class="row" style="margin-top:12px"><button type="button" class="btn ghost" data-x>إغلاق</button></div>`,
    );
    const save = async () => {
      try {
        const r = await api('PUT', '/api/me/quick-replies', { list });
        state.user.quickReplies = r.quickReplies;
        list = [...r.quickReplies];
      } catch (err) {
        chatErr(bg, err.message);
      }
    };
    const draw = () => {
      $('#qrL', bg).innerHTML =
        list
          .map(
            (x, i) =>
              `<div class="ch-qr-i"><button type="button" class="ch-qr-t" data-qi="${i}">${esc(x)}</button><button type="button" class="btn sm ghost" data-qd="${i}" title="حذف">${icon('trash')}</button></div>`,
          )
          .join('') || '<div class="muted">لا توجد ردود محفوظة بعد</div>';
    };
    draw();
    $('#qrAdd', bg).onclick = async () => {
      const v = $('#qrN', bg).value.trim();
      if (!v) return;
      list.push(v);
      $('#qrN', bg).value = '';
      await save();
      draw();
    };
    $('#qrN', bg).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('#qrAdd', bg).click();
      }
    });
    $('#qrL', bg).onclick = async (e) => {
      const t = e.target.closest('[data-qi]'),
        d = e.target.closest('[data-qd]');
      if (t) {
        ta.value = (ta.value ? `${ta.value} ` : '') + list[Number(t.dataset.qi)];
        ta.dispatchEvent(new Event('input'));
        bg.remove();
        ta.focus();
      }
      if (d) {
        list.splice(Number(d.dataset.qd), 1);
        await save();
        draw();
      }
    };
  }

  /* مشاركة طلب من النظام (بطاقة برقمه ونوعه وحالته، والضغط يفتحه لمن يحق له) */
  async function chatRequestModal(send) {
    const list = await api('GET', `/api/requests?scope=${can('all') ? 'all' : 'mine'}`).catch(() => []);
    const bg = chatModal(
      `${icon('file')} مشاركة طلب من النظام`,
      `<input class="in" id="rqQ" placeholder="ابحث برقم الطلب أو الاسم أو النوع..." style="margin-bottom:10px"><div class="ch-users" id="rqL"></div>
      <div class="row" style="margin-top:12px"><button type="button" class="btn ghost" data-x>إلغاء</button></div>`,
      620,
    );
    const draw = (q) => {
      $('#rqL', bg).innerHTML =
        list
          .filter((r) => !q || [r.serial, r.typeTitle, r.summary, r.branch].join(' ').toLowerCase().includes(q))
          .slice(0, 80)
          .map(
            (r) =>
              `<button type="button" class="ch-user" data-rid="${r.id}">${icon('file')}<span><b><bdi dir="ltr">${esc(r.serial)}</bdi> — ${esc(r.typeTitle)}</b><small>${esc([r.summary, r.branch].filter(Boolean).join(' — '))}</small></span>${chip(r)}</button>`,
          )
          .join('') || '<div class="muted">لا توجد طلبات</div>';
    };
    draw('');
    $('#rqQ', bg).addEventListener('input', (e) => draw(e.target.value.trim().toLowerCase()));
    $('#rqL', bg).onclick = async (e) => {
      const b = e.target.closest('[data-rid]');
      if (!b) return;
      try {
        await send('request', { id: b.dataset.rid });
        bg.remove();
      } catch (err) {
        chatErr(bg, err.message);
      }
    };
  }

  return {
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
  };
};
