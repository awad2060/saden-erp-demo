'use strict';
/* أجزاء صفحة الدردشة: الرسالة الصوتية، وتصغير الصور، ونافذة الكاميرا، والمحادثة الجديدة، وأعضاء مجموعة الفرع */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['chat-media'] = function (S) {
  const { $, $$, api, chatAv, chatDur, chatErr, chatGo, chatModal, esc, icon, toast } = S;
  /* الصوت: تسجيل رسالة صوتية من الميكروفون (يحتاج https أو localhost أو تطبيق الموبايل)، أو إرسال ملف صوتي */
  function chatVoiceModal(sendVoice, pickAudio) {
    const can = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && window.isSecureContext);
    const bg = chatModal(
      `${icon('mic')} رسالة صوتية`,
      `${
        can
          ? `<div class="ch-rec"><button type="button" class="ch-rec-btn" id="vrBtn" title="بدء التسجيل">${icon('mic')}</button><b id="vrTime">0:00</b><span class="muted" id="vrState">اضغط للتسجيل</span><audio id="vrPrev" controls hidden></audio></div>`
          : '<div class="hint" style="margin-bottom:10px">التسجيل من الميكروفون يحتاج اتصالاً آمناً (https) أو تطبيق الموبايل. يمكنك إرسال ملف صوتي.</div>'
      }
      <div class="row" style="margin-top:12px;gap:8px;justify-content:center">${can ? `<button type="button" class="btn ok" id="vrSend" hidden>${icon('send')} إرسال</button><button type="button" class="btn" id="vrRe" hidden>${icon('undo')} إعادة</button>` : ''}
        <button type="button" class="btn" id="vrFile">${icon('music')} اختيار ملف صوتي</button><button type="button" class="btn ghost" data-x>إلغاء</button></div>`,
      460,
    );
    $('#vrFile', bg).onclick = () => {
      bg.remove();
      pickAudio();
    };
    if (!can) return;
    /* حالة التسجيل: المسجّل، والأجزاء، والميكروفون، وبداية التسجيل، والمؤقت، والناتج ومدته */
    const v = { bg, rec: null, chunks: [], stream: null, t0: 0, timer: null, blob: null, dur: 0 };
    $$('[data-x]', bg).forEach((b) => {
      b.addEventListener('click', () => vrStopAll(v));
    });
    $('#vrBtn', bg).onclick = () => vrToggle(v);
    $('#vrRe', bg).onclick = () => {
      v.blob = null;
      $('#vrPrev', bg).hidden = true;
      $('#vrSend', bg).hidden = true;
      $('#vrRe', bg).hidden = true;
      $('#vrTime', bg).textContent = '0:00';
      $('#vrState', bg).textContent = 'اضغط للتسجيل';
    };
    $('#vrSend', bg).onclick = async () => {
      if (!v.blob) return;
      const blob = v.blob;
      const ext = /ogg/.test(blob.type) ? 'ogg' : /mp4|aac/.test(blob.type) ? 'm4a' : 'webm';
      try {
        await sendVoice(new File([blob], `رسالة-صوتية.${ext}`, { type: blob.type }), v.dur);
        bg.remove();
      } catch (err) {
        chatErr(bg, err.message);
      }
    };
  }

  /* إيقاف المؤقت وإغلاق الميكروفون */
  function vrStopAll(v) {
    clearInterval(v.timer);
    if (v.stream) v.stream.getTracks().forEach((x) => x.stop());
    v.stream = null;
  }

  /* زر التسجيل: يبدأ التسجيل، أو يوقفه إن كان جارياً */
  async function vrToggle(v) {
    const bg = v.bg;
    if (v.rec && v.rec.state === 'recording') {
      v.rec.stop();
      return;
    }
    try {
      v.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      chatErr(bg, `تعذر فتح الميكروفون: ${err.message}`);
      return;
    }
    v.chunks = [];
    v.blob = null;
    const rec = new MediaRecorder(v.stream);
    v.rec = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size) v.chunks.push(e.data);
    };
    rec.onstop = () => vrStopped(v, rec);
    rec.start();
    v.t0 = Date.now();
    $('#vrBtn', bg).classList.add('on');
    $('#vrState', bg).textContent = 'جاري التسجيل... اضغط للإيقاف';
    $('#vrPrev', bg).hidden = true;
    $('#vrSend', bg).hidden = true;
    $('#vrRe', bg).hidden = true;
    v.timer = setInterval(() => {
      $('#vrTime', bg).textContent = chatDur((Date.now() - v.t0) / 1000);
    }, 300);
  }

  /* انتهاء التسجيل: معاينة الصوت وإظهار زري الإرسال والإعادة */
  function vrStopped(v, rec) {
    const bg = v.bg;
    vrStopAll(v);
    v.dur = (Date.now() - v.t0) / 1000;
    v.blob = new Blob(v.chunks, { type: rec.mimeType || 'audio/webm' });
    const a = $('#vrPrev', bg);
    a.src = URL.createObjectURL(v.blob);
    a.hidden = false;
    $('#vrBtn', bg).classList.remove('on');
    $('#vrState', bg).textContent = 'استمع ثم أرسل';
    $('#vrSend', bg).hidden = false;
    $('#vrRe', bg).hidden = false;
  }

  /* الصورة الأكبر من 1.2 ميجا تُصغَّر إلى 1600 بكسل JPEG (صور الجوال كبيرة) */
  async function shrinkImage(f) {
    if (!/^image\/(jpeg|png|webp|heic)/i.test(f.type || '') || f.size < 1.2 * 1024 * 1024) return f;
    try {
      const img = await new Promise((ok, no) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = no;
        i.src = URL.createObjectURL(f);
      });
      const s = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
      return blob ? new File([blob], f.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : f;
    } catch {
      return f;
    }
  }

  /* نافذة الكاميرا (كمبيوتر): معاينة مباشرة، تبديل الكاميرا، التقاط ثم إرسال أو إعادة */
  function cameraModal(done) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal cam-modal"><h3 style="margin-top:0">${icon('camera')} التقاط صورة</h3>
      <div class="cam-box"><video autoplay playsinline muted></video><canvas hidden></canvas></div><div id="camErr"></div>
      <div class="row" style="margin-top:12px;gap:8px;justify-content:center"><button type="button" class="btn primary" id="camShot">${icon('camera')} التقاط</button>
        <button type="button" class="btn" id="camFlip" title="تبديل الكاميرا">${icon('rotate')}</button><button type="button" class="btn ok" id="camSend" hidden>${icon('send')} إرسال</button>
        <button type="button" class="btn" id="camRe" hidden>${icon('undo')} إعادة</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></div>`;
    document.body.appendChild(bg);
    const video = $('video', bg),
      canvas = $('canvas', bg);
    let stream = null,
      facing = 'environment';
    const stop = () => {
      if (stream) stream.getTracks().forEach((x) => x.stop());
      stream = null;
    };
    const start = async () => {
      stop();
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1600 } }, audio: false });
        video.srcObject = stream;
        video.hidden = false;
        canvas.hidden = true;
      } catch (err) {
        $('#camErr', bg).innerHTML =
          `<div class="err">تعذر فتح الكاميرا: ${esc(err.message)}. تأكد من السماح للمتصفح باستخدام الكاميرا.</div>`;
      }
    };
    const close = () => {
      stop();
      bg.remove();
    };
    $('[data-x]', bg).onclick = close;
    $('#camFlip', bg).onclick = () => {
      facing = facing === 'environment' ? 'user' : 'environment';
      start();
    };
    $('#camShot', bg).onclick = () => {
      if (!video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      video.hidden = true;
      canvas.hidden = false;
      $('#camShot', bg).hidden = true;
      $('#camFlip', bg).hidden = true;
      $('#camSend', bg).hidden = false;
      $('#camRe', bg).hidden = false;
    };
    $('#camRe', bg).onclick = () => {
      video.hidden = false;
      canvas.hidden = true;
      $('#camShot', bg).hidden = false;
      $('#camFlip', bg).hidden = false;
      $('#camSend', bg).hidden = true;
      $('#camRe', bg).hidden = true;
    };
    $('#camSend', bg).onclick = () =>
      canvas.toBlob(
        (b) => {
          if (!b) return;
          const d = new Date();
          close();
          done(new File([b], `صورة-${d.toISOString().slice(0, 19).replace(/[T:]/g, '-')}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.88,
      );
    start();
  }

  /* محادثة خاصة جديدة: اختيار أي مستخدم فعّال */
  async function chatNewModal() {
    const users = await api('GET', '/api/chat/users');
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:520px;width:96%"><h3 style="margin-top:0">محادثة جديدة</h3>
      <input class="in" id="cnQ" placeholder="ابحث بالاسم أو الفرع أو المسمى..." style="margin-bottom:10px"><div class="ch-users" id="cnList"></div>
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-x>إغلاق</button></div></div>`;
    document.body.appendChild(bg);
    const draw = (q) => {
      $('#cnList', bg).innerHTML =
        users
          .filter((u) => !q || `${u.name} ${u.title} ${u.branch}`.toLowerCase().includes(q))
          .map(
            (u) =>
              `<button type="button" class="ch-user" data-uid="${u.id}">${chatAv({ title: u.name })}<span><b>${esc(u.name)}</b><small>${esc([u.title, u.branch ? `فرع ${u.branch}` : ''].filter(Boolean).join(' — '))}</small></span>${u.online ? '<i class="ch-on" title="متصل الآن"></i>' : ''}</button>`,
          )
          .join('') || '<div class="muted">لا يوجد</div>';
    };
    draw('');
    $('#cnQ', bg).addEventListener('input', (e) => draw(e.target.value.trim().toLowerCase()));
    $('#cnQ', bg).focus();
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#cnList', bg).onclick = async (e) => {
      const b = e.target.closest('[data-uid]');
      if (!b) return;
      try {
        const r = await api('POST', '/api/chat/direct', { userId: b.dataset.uid });
        bg.remove();
        chatGo(r.id);
      } catch (err) {
        toast(err.message, true);
      }
    };
  }

  /* أعضاء مجموعة الفرع، ومدير النظام يضيف أعضاء من خارج الفرع (الإدارة / المتابعة) */
  async function chatMembersModal(conv, admin, done) {
    const users = admin ? await api('GET', '/api/chat/users') : [];
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const extra = new Set(conv.extra || []);
    bg.innerHTML = `<div class="modal" style="max-width:560px;width:96%"><h3 style="margin-top:0">أعضاء ${esc(conv.title)} (${conv.members.length})</h3>
      <div class="ch-users" style="max-height:34vh">${conv.members.map((m) => `<div class="ch-user">${chatAv({ title: m.name })}<span><b>${esc(m.name)}</b></span>${m.online ? '<i class="ch-on" title="متصل الآن"></i>' : ''}</div>`).join('')}</div>
      ${
        admin
          ? `<h4 class="b-sec">أعضاء إضافيون من خارج الفرع</h4><div class="hint" style="margin-bottom:6px">مستخدمو الفرع ومدير النظام أعضاء تلقائياً. أضف من يتابع الفرع من الإدارة.</div>
        <input class="in" id="cmQ" placeholder="ابحث..." style="margin-bottom:8px"><div class="ch-users" id="cmList" style="max-height:30vh"></div>
        <div id="cmErr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary" id="cmSave">💾 حفظ</button><button class="btn ghost" data-x>إلغاء</button></div>`
          : '<div class="row" style="margin-top:12px"><button class="btn ghost" data-x>إغلاق</button></div>'
      }</div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    if (!admin) return;
    const br = conv.id.slice(2);
    const cand = users.filter((u) => u.branch !== br);
    const draw = (q) => {
      $('#cmList', bg).innerHTML = cand
        .filter((u) => !q || `${u.name} ${u.title} ${u.branch}`.toLowerCase().includes(q))
        .map(
          (u) =>
            `<label class="ch-user"><input type="checkbox" data-xid="${u.id}"${extra.has(u.id) ? ' checked' : ''}><span><b>${esc(u.name)}</b><small>${esc([u.title, u.branch ? `فرع ${u.branch}` : ''].filter(Boolean).join(' — '))}</small></span></label>`,
        )
        .join('');
    };
    draw('');
    $('#cmQ', bg).addEventListener('input', (e) => draw(e.target.value.trim().toLowerCase()));
    $('#cmList', bg).addEventListener('change', (e) => {
      const x = e.target.dataset.xid;
      if (x) {
        if (e.target.checked) extra.add(x);
        else extra.delete(x);
      }
    });
    $('#cmSave', bg).onclick = async () => {
      try {
        await api('PUT', `/api/chat/${encodeURIComponent(conv.id)}/members`, { extra: [...extra] });
        bg.remove();
        toast('تم حفظ أعضاء المجموعة');
        done();
      } catch (err) {
        $('#cmErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  return { chatVoiceModal, shrinkImage, cameraModal, chatNewModal, chatMembersModal };
};
