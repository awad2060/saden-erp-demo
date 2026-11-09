/* «سند» مساعد النظام: الشخصية والدردشة على الشاشة */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const {
    $,
    state,
    today,
    api,
    icon,
    refreshStats,
    asGet,
    asSet,
    AS_DRAG,
    AS_MOTIVE,
    AS_MOTTO,
    asPick,
    AS_IMG,
    asLoad3d,
    asFace,
    asBlink,
    asLink,
    asCanHref,
    asAnswer,
    AS_CHIPS,
  } = S;
  Object.assign(S, { assistantInit });
  function assistantInit() {
    if (!state.user || state.user.mustChange) return;
    let el = document.getElementById('assist');
    if (el && el.dataset.uid === state.user.id) {
      el.hidden = asGet('hidden', false) || /^#\/(org)?print/.test(location.hash);
      return;
    }
    if (el) el.remove();
    el = document.createElement('div');
    el.id = 'assist';
    el.dataset.uid = state.user.id;
    el.className = 'as-wrap';
    el.innerHTML = `<div class="as-bubble" hidden></div><button type="button" class="as-char" title="سند — مساعد النظام (اسحبني لأي مكان)" aria-label="مساعد النظام"><span class="as-floor"></span><span class="as-fig">${AS_IMG}</span></button>
      <div class="as-panel" hidden><div class="as-head"><span class="as-mini">${AS_IMG}</span><div><b>سند</b><small>مساعد النظام</small></div><button type="button" class="as-hbtn" data-as="min" title="إغلاق الدردشة">✕</button></div>
        ${state.user.role === 'admin' ? '<a class="as-pin" href="#/chat" data-as="supin" title="طلبات المساعدة التقنية تصلك في الدردشة الداخلية">🛠 طلبات المساعدة التقنية <small>تصلك في الدردشة ←</small></a>' : '<button type="button" class="as-pin" data-as="sup" title="راسل مدير النظام بخصوص أي مشكلة في النظام">🛠 طلب مساعدة تقنية <small>تواصل مع مدير النظام</small></button>'}
        <div class="as-msgs"></div><form class="as-comp"><input class="in" placeholder="اسألني أي شيء... (مثال: عاوز أجدد إقامة)"><button class="btn primary" title="إرسال">${icon('send')}</button></form></div>`;
    document.body.appendChild(el);
    const ch = $('.as-char', el),
      panel = $('.as-panel', el),
      msgs = $('.as-msgs', el),
      bub = $('.as-bubble', el);
    if (asGet('style', '3d') === '3d') {
      asLoad3d()
        .then(() => {
          if (!document.body.contains(el) || el._eng || !window.SadenRobot) return;
          const box = document.createElement('span');
          box.className = 'as-3d';
          $('.as-fig', el).appendChild(box);
          const eng = SadenRobot.create(box, {
            auto: true,
            lowPower: true,
            ground: false,
            frameH: 3.7,
            frameW: 3.15,
            frameY: 1.59,
            paused: () => el.hidden || !document.body.contains(el),
          });
          if (!eng) {
            box.remove();
            return;
          }
          el._eng = eng;
          el.classList.add('three');
          ch.style.transform = '';
        })
        .catch(() => {
          /* تبقى الصورة */
        });
    }
    /* إحساس ثلاثي الأبعاد: الشخصية تميل وتلتفت نحو المؤشر */
    const look = (e) => {
      if (el.hidden) return;
      if (el._eng) {
        el._eng.lookAt(e.clientX, e.clientY);
        return;
      }
      if (el.classList.contains('dragging')) return;
      const r = ch.getBoundingClientRect(),
        cx = r.left + r.width / 2,
        cy = r.top + r.height / 2;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 500)),
        dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 400));
      ch.style.transform = `perspective(420px) rotateY(${dx * 22}deg) rotateX(${-dy * 12}deg)`;
    };
    document.addEventListener('pointermove', look, { passive: true });
    /* تعبيرات وتصرفات مضحكة: رمش وغمز ولسان، ونوم بعد دقيقتين بلا حركة، وصحيان مفزوع */
    let lastAct = Date.now();
    const wake = () => {
      lastAct = Date.now();
      if (el.classList.contains('sleeping')) {
        el.classList.remove('sleeping');
        el.dataset.face = '';
        el.dataset.fx = '';
        if (el._eng) el._eng.play('wake');
        else {
          asFace('o', 'bang', 900);
          setTimeout(() => asFace('grin', 'spark', 1300), 950);
        }
      }
    };
    ['pointermove', 'keydown', 'pointerdown'].forEach((ev) => document.addEventListener(ev, wake, { passive: true }));
    el._idle = setInterval(() => {
      if (!document.body.contains(el) || el.hidden || el.dataset.face || el.classList.contains('dragging')) return;
      if (Date.now() - lastAct > 120000 && panel.hidden && !el.classList.contains('sleeping')) {
        el.classList.add('sleeping');
        if (el._eng) el._eng.play('sleep');
        else {
          el.dataset.face = 'sleep';
          el.dataset.fx = 'zzz';
        }
        return;
      }
      if (el.classList.contains('sleeping') || el._eng) return;
      const r = Math.random();
      if (r < 0.55) asBlink();
      else if (r < 0.68) asBlink(true);
      else if (r < 0.76) asFace('tongue', '', 1400);
      else if (r < 0.82) asFace('grin', '', 1200);
      else if (r < 0.86) {
        asFace('o', '', 700);
        setTimeout(() => asBlink(), 750);
      }
    }, 3200);
    ch.addEventListener('pointerenter', () => {
      if (!drag) {
        asBlink(true);
        asFace('grin', '', 1200);
      }
    });
    /* المكان المحفوظ (افتراضياً أسفل الشاشة على اليسار) */
    const pos = asGet('pos', null);
    const place = (x, y) => {
      const w = el.offsetWidth || 92,
        h = el.offsetHeight || 176;
      x = Math.max(6, Math.min(window.innerWidth - w - 6, x));
      y = Math.max(60, Math.min(window.innerHeight - h - 6, y));
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.bottom = 'auto';
      el.classList.toggle('right', x > window.innerWidth / 2);
      el.classList.toggle('low', y > window.innerHeight / 2);
    };
    el.classList.add('low');
    if (pos) place(pos.x, pos.y);
    window.addEventListener('resize', () => {
      const r = el.getBoundingClientRect();
      if (el.style.top) place(r.left, r.top);
    });
    /* السحب بالماوس أو اللمس؛ الضغط بدون سحب يفتح الدردشة */
    let drag = null;
    ch.addEventListener('pointerdown', (e) => {
      const r = el.getBoundingClientRect();
      drag = { sx: e.clientX, sy: e.clientY, x: r.left, y: r.top, moved: false };
      ch.setPointerCapture(e.pointerId);
    });
    ch.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.sx,
        dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      el.classList.add('dragging');
      asFace('o', 'bang', 0);
      place(drag.x + dx, drag.y + dy);
    });
    ch.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      el.classList.remove('dragging');
      if (moved) {
        const r = el.getBoundingClientRect();
        asSet('pos', { x: r.left, y: r.top });
        asFace('wavy', 'stars', 1700);
        const nowT = Date.now();
        el._moves = (el._moves || []).filter((x) => nowT - x < 60000).concat(nowT);
        if (panel.hidden) {
          bub.textContent = asPick(AS_DRAG, 'drag');
          bub.hidden = false;
          clearTimeout(bub._t);
          bub._t = setTimeout(() => {
            bub.hidden = true;
          }, 3000);
        }
      } else toggle();
    });
    const add = (who, html, links, chips) => {
      const m = document.createElement('div');
      m.className = `as-m ${who}`;
      m.innerHTML = `<div class="as-t">${html}</div>${(links || []).length ? `<div class="as-links">${links.map((l) => `<a class="btn sm" href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div>` : ''}${
        chips
          ? `<div class="as-chips">${AS_CHIPS()
              .map((c) => `<button type="button" data-chip="${esc(c)}">${esc(c)}</button>`)
              .join('')}</div>`
          : ''
      }`;
      msgs.appendChild(m);
      msgs.scrollTop = msgs.scrollHeight;
    };
    const ask = async (q) => {
      add('me', esc(q));
      el.classList.add('think');
      asFace('o', 'q', 0);
      const typing = document.createElement('div');
      typing.className = 'as-m bot typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      msgs.appendChild(typing);
      msgs.scrollTop = msgs.scrollHeight;
      await new Promise((r) => setTimeout(r, 450));
      try {
        await refreshStats();
      } catch {
        /* تجاهل */
      }
      const a = await asAnswer(q).catch(() => ({ html: 'حدث خطأ بسيط، حاول مرة أخرى.' }));
      typing.remove();
      el.classList.remove('think');
      add('bot', a.html, a.links, a.chips);
      if (a.support) supportForm();
      el.classList.add('talk');
      setTimeout(() => el.classList.remove('talk'), 1200);
      const [fc, fx] = a.face || ['grin', (a.links || []).length ? 'spark' : ''];
      if (el._eng) {
        const e3 = el._eng;
        e3.play(
          fc === 'laugh' ? 'laugh' : fx === 'hearts' ? 'love' : fx === 'sweat' ? 'confused' : (a.links || []).length ? 'point' : 'talk',
        );
        if (fx === 'hearts')
          setTimeout(() => {
            if (e3.action === 'love') e3.play('idle');
          }, 2600);
      } else asFace(fc, fx, fc === 'laugh' ? 2600 : 2000);
    };
    /* نموذج المساعدة التقنية داخل دردشة سند */
    const supportForm = () => {
      const m = document.createElement('div');
      m.className = 'as-m bot';
      const pageName = ($('#main .page-head h1, #main h1') || {}).textContent || document.title;
      m.innerHTML = `<form class="as-sup"><textarea class="in" rows="3" maxlength="3000" placeholder="اشرح المشكلة: ماذا كنت تفعل؟ وماذا ظهر لك؟"></textarea>
        <label class="check"><input type="checkbox" checked> إرفاق الصفحة الحالية: <b>${esc(String(pageName).trim().slice(0, 60))}</b></label>
        <div class="as-sup-err"></div><button class="btn primary sm" type="submit">📨 إرسال لمدير النظام</button></form>`;
      msgs.appendChild(m);
      msgs.scrollTop = msgs.scrollHeight;
      const f = $('form', m),
        ta = $('textarea', f);
      setTimeout(() => ta.focus(), 60);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const text = ta.value.trim();
        if (text.length < 5) {
          $('.as-sup-err', f).innerHTML = '<div class="err">اكتب وصف المشكلة باختصار</div>';
          return;
        }
        $('button', f).disabled = true;
        try {
          const r = await api('POST', '/api/support', {
            text,
            withPage: $('input', f).checked,
            page: location.hash,
            title: String(pageName).trim(),
          });
          m.remove();
          add(
            'bot',
            `✅ وصلت رسالتك لـ<b>${esc(r.admin)}</b>${r.admin === 'مدير النظام' ? '' : ' (مدير النظام)'}.<br>${r.chat ? 'سيصلك الرد في الدردشة الداخلية، وتقدر تكمل معه هناك.' : 'سيتواصل معك قريباً.'}`,
            r.chat && r.conv ? [asLink(`#/chat/${encodeURIComponent(r.conv)}`, '💬 فتح المحادثة مع مدير النظام')] : [],
          );
          if (el._eng) el._eng.play('thumb');
          else asFace('grin', 'spark', 1800);
        } catch (err) {
          $('.as-sup-err', f).innerHTML = `<div class="err">${esc(err.message)}</div>`;
          $('button', f).disabled = false;
        }
      };
    };
    const greet = () => {
      const s = state.stats || {};
      const extra = s.inbox
        ? `<br>📌 عندك <b>${s.inbox}</b> طلب بانتظار ${state.user.role === 'accountant' ? 'إجرائك' : 'اعتمادك'}.`
        : s.myReturned
          ? `<br>📌 عندك <b>${s.myReturned}</b> طلب معاد للتعديل.`
          : '';
      add(
        'bot',
        `أهلاً ${esc(state.user.name.split(' ')[0])} 👋 أنا <b>سند</b>، مساعدك في النظام.<br>اسألني عن أي نموذج أو صفحة أو عن طلباتك.${extra}`,
        s.inbox ? [asLink('#/inbox', 'افتح الطلبات')] : [],
        true,
      );
    };
    function toggle(open) {
      const show = open ?? panel.hidden;
      panel.hidden = !show;
      bub.hidden = true;
      el.classList.toggle('open', show);
      if (show) {
        if (!msgs.children.length) greet();
        setTimeout(() => $('input', panel).focus(), 50);
        asFace('grin', 'spark', 1500);
        el.classList.add('wave');
        setTimeout(() => el.classList.remove('wave'), 1400);
      }
    }
    $('.as-comp', el).onsubmit = (e) => {
      e.preventDefault();
      const i = $('input', e.target);
      const q = i.value.trim();
      if (!q) return;
      i.value = '';
      ask(q);
    };
    msgs.addEventListener('click', (e) => {
      const c = e.target.closest('[data-chip]');
      if (c) ask(c.dataset.chip);
      if (e.target.closest('.as-links a') && window.innerWidth < 700) toggle(false);
    });
    $('[data-as="min"]', el).onclick = () => toggle(false);
    /* زر المساعدة التقنية مثبّت أعلى دردشة سند */
    const supBtn = $('[data-as="sup"]', el);
    const supIn = $('[data-as="supin"]', el);
    if (supIn)
      supIn.onclick = () => {
        if (window.innerWidth < 700) toggle(false);
      };
    if (supBtn)
      supBtn.onclick = () => {
        const f = $('.as-sup:not(.done) textarea', msgs);
        if (f) {
          f.focus();
          f.scrollIntoView({ block: 'center' });
        } else ask('مساعدة تقنية');
      };
    bub.onclick = () => toggle(true);
    /* ترحيب أول ما يفتح صاحب الحساب النظام (مرة لكل فتح، لا مع كل تحديث للصفحة): صباح الخير أو مساء الخير حسب ساعة الجهاز، وتنبيه بالطلبات المنتظرة */
    const gKey = `as-greet:${state.user.id}`;
    let greeted = false;
    try {
      greeted = !!sessionStorage.getItem(gKey);
      sessionStorage.setItem(gKey, '1');
    } catch {
      /* تجاهل */
    }
    if (!greeted) {
      const hr = new Date().getHours(),
        morning = hr >= 4 && hr < 12;
      setTimeout(() => {
        if (!panel.hidden || el.hidden) return;
        const s = state.stats || {};
        bub.innerHTML = `${morning ? 'صباح الخير يا صديقي ☀️' : 'مساء الخير يا صديقي 🌙'}<br><b>${esc(state.user.name.split(' ')[0])}</b>${s.inbox ? `<br>عندك <b>${s.inbox}</b> طلب بانتظارك` : '<br>محتاج مساعدة؟ اضغط عليّ'}`;
        bub.hidden = false;
        el.classList.add('wave');
        setTimeout(() => {
          el.classList.remove('wave');
        }, 1400);
        setTimeout(() => {
          bub.hidden = true;
        }, 9000);
      }, 1500);
    }
    /* تذكير كل نصف ساعة بما هو واقف عند المستخدم (طلبات بانتظاره ومتأخرة، معادة، مستندات، بريد، تعاميم) */
    const remind = async () => {
      if (el.hidden || !document.body.contains(el) || document.hidden || el.classList.contains('dragging')) return;
      if (Date.now() - asGet('remindAt', 0) < 30 * 60000) return;
      asSet('remindAt', Date.now());
      await refreshStats();
      const s = state.stats || {};
      const items = [
        s.inbox && [
          `<b>${s.inbox}</b> طلب بانتظار ${state.user.role === 'accountant' ? 'إجرائك' : 'اعتمادك'}${s.overdue ? ` (منهم <b>${s.overdue}</b> متأخر ⏰)` : ''}`,
          asLink('#/inbox', 'افتح الطلبات'),
        ],
        s.myReturned && [`<b>${s.myReturned}</b> طلب معاد لك للتعديل`, asLink('#/mine?status=returned', 'الطلبات المعادة')],
        s.myClearance && [`<b>${s.myClearance}</b> ملف بانتظار رفع المستند الموقّع`, asLink('#/mine?status=approved', 'ارفع المستندات')],
        s.mailUnread && [`<b>${s.mailUnread}</b> رسالة بريد لم تقرأها`, asLink('#/mail', 'البريد')],
        s.noticesUnread && [`<b>${s.noticesUnread}</b> تعميم لم تقرأه`, asLink('#/notices', 'التعاميم')],
      ].filter(Boolean);
      if (!items.length) return;
      const html = `يا ريس 👋 عندك:<br>${items.map(([t]) => `• ${t}`).join('<br>')}`;
      add(
        'bot',
        html,
        items.map(([, l]) => l).filter((l) => asCanHref(l.href)),
      );
      if (el.classList.contains('sleeping')) {
        el.classList.remove('sleeping');
        el.dataset.face = '';
        el.dataset.fx = '';
      }
      if (el._eng) el._eng.play('wave');
      else asFace('grin', 'spark', 1500);
      if (panel.hidden) {
        bub.innerHTML = `${html}<br><small class="muted">اضغط للتفاصيل</small>`;
        bub.hidden = false;
        clearTimeout(bub._t);
        bub._t = setTimeout(() => {
          bub.hidden = true;
        }, 15000);
      }
    };
    setTimeout(remind, 60000);
    setInterval(remind, 60000);
    /* عبارة تحفيزية كل نصف ساعة تكسر روتين اليوم (لا تتزامن مع تذكير الطلبات، ولا تظهر والدردشة مفتوحة) */
    if (!asGet('motiveAt', 0)) asSet('motiveAt', Date.now());
    const motivate = () => {
      if (el.hidden || !document.body.contains(el) || document.hidden || el.classList.contains('dragging') || !panel.hidden || !bub.hidden)
        return;
      if (Date.now() - asGet('motiveAt', 0) < 30 * 60000 || Date.now() - asGet('remindAt', 0) < 5 * 60000) return;
      asSet('motiveAt', Date.now());
      if (el.classList.contains('sleeping')) {
        el.classList.remove('sleeping');
        el.dataset.face = '';
        el.dataset.fx = '';
      }
      if (el._eng) el._eng.play('wave');
      else asFace('grin', 'spark', 1500);
      const motto = asGet('mottoDay', '') !== today();
      if (motto) asSet('mottoDay', today());
      bub.textContent = `✨ ${motto ? AS_MOTTO : asPick(AS_MOTIVE, 'motive')}`;
      bub.hidden = false;
      clearTimeout(bub._t);
      bub._t = setTimeout(() => {
        bub.hidden = true;
      }, 12000);
    };
    setInterval(motivate, 60000);
    el.hidden = asGet('hidden', false) || /^#\/(org)?print/.test(location.hash);
    el.classList.toggle('lift', location.hash.startsWith('#/chat'));
  }
  /* في صفحة الدردشة يرتفع المساعد قليلاً حتى لا يغطي أزرار الإرفاق والإيموجي (إذا لم يحرّكه المستخدم) */
  const asSync = () => {
    const el = document.getElementById('assist');
    if (!el) return;
    el.hidden = asGet('hidden', false) || /^#\/(org)?print/.test(location.hash) || location.hash === '#/login';
    el.classList.toggle('lift', location.hash.startsWith('#/chat'));
  };
  window.addEventListener('hashchange', asSync);
})((window.SES_APP = window.SES_APP || {}));
