'use strict';
/* صفحة «login» (viewLogin) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...).
 * المتغيرات المشتركة القابلة للتغيير تُقرأ وتُكتب عبر S.<الاسم> مباشرة. */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['login'] = function (S) {
  const { $, $$, api, app, esc, icon, multiCo, occasionNow, refreshStats, route, socialLinks, state, toast } = S;
  /* زينة المناسبة في خلفية شاشة الدخول */
  function occDeco(id) {
    let seed = 11;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const r = (a, b) => (a + rnd() * (b - a)).toFixed(1);
    const lantern = (
      x,
      len,
      delay,
      scale = 1,
    ) => `<div class="occ-lan" style="left:${x}%;--len:${len}vh;--s:${scale};animation-delay:-${delay}s"><svg viewBox="0 0 40 92" aria-hidden="true">
      <path d="M12 22h16l5 9H7z" class="lan-g"/><path d="M17 14h6l2 8h-10z" class="lan-g"/><circle cx="20" cy="11" r="3" fill="none" stroke-width="2" class="lan-s"/>
      <rect x="8" y="31" width="24" height="33" rx="5" class="lan-glass"/><path d="M14 31v33M20 31v33M26 31v33" class="lan-s" stroke-width="1.2" opacity=".7"/>
      <path d="M8 64h24l-5 8H13z" class="lan-g"/><path d="M18 72h4v7h-4z" class="lan-g"/><circle cx="20" cy="83" r="3" class="lan-g"/></svg></div>`;
    const stars = (n) =>
      Array.from(
        { length: n },
        () => `<i class="occ-star" style="left:${r(0, 100)}%;top:${r(2, 45)}%;--z:${r(2, 5)}px;animation-delay:-${r(0, 4)}s"></i>`,
      ).join('');
    const moon =
      '<svg class="occ-moon" viewBox="0 0 100 100" aria-hidden="true"><path d="M58 8a42 42 0 1 0 34 66A34 34 0 1 1 58 8z"/></svg>';
    const fireworks = (cols) =>
      [
        [8, 14],
        [58, 10],
        [20, 30],
        [64, 34],
        [36, 6],
      ]
        .map(
          ([x, y], k) =>
            `<div class="occ-fw" style="left:${x}%;top:${y}%;--c:${cols[k % cols.length]};animation-delay:-${(k * 0.9).toFixed(1)}s">${Array.from({ length: 12 }, (_, i) => `<i style="--k:${i};animation-delay:-${(k * 0.9).toFixed(1)}s"></i>`).join('')}</div>`,
        )
        .join('');
    const confetti = (cols) =>
      Array.from(
        { length: 34 },
        (_, i) =>
          `<i class="occ-cf" style="left:${r(0, 100)}%;--c:${cols[i % cols.length]};animation-delay:-${r(0, 12)}s;animation-duration:${r(8, 14)}s;--w:${r(5, 10)}px"></i>`,
      ).join('');
    const sadu =
      '<svg class="occ-sadu" aria-hidden="true"><defs><pattern id="occSadu" width="48" height="28" patternUnits="userSpaceOnUse"><rect width="48" height="28" fill="#7a2e1d"/><path d="M0 28L12 4L24 28zM24 28L36 4L48 28z" fill="#e8d5b0"/><path d="M6 28L12 16L18 28zM30 28L36 16L42 28z" fill="#1f1a17"/><path d="M24 0L30 10L24 20L18 10z" fill="#c9a227"/><rect y="0" width="48" height="3" fill="#c9a227"/></pattern></defs><rect width="100%" height="28" fill="url(#occSadu)"/></svg>';
    const D = {
      national: confetti(['#006c35', '#ffffff', '#2fa35c', '#c9e9d4']) + fireworks(['#00a651', '#ffffff', '#7ddc9f']),
      flag: confetti(['#006c35', '#ffffff', '#2fa35c']),
      founding: sadu + stars(16),
      ramadan: moon + stars(34) + lantern(3, 6, 0) + lantern(9, 12, 1.2, 0.85) + lantern(56, 4, 0.6, 0.8) + lantern(62, 10, 1.8),
      fitr: lantern(4, 5, 0, 0.9) + lantern(60, 8, 1.1, 0.85) + fireworks(['#ffd36b', '#b388ff', '#ff7eb3', '#7ee8fa']) + stars(18),
      adha: lantern(4, 5, 0, 0.9) + lantern(60, 8, 1.1, 0.85) + fireworks(['#ffd36b', '#4dd0c1', '#ffffff', '#ffb74d']) + stars(18),
      hijri: moon + stars(40),
    };
    return `<div class="occ-deco" aria-hidden="true">${D[id] || ''}</div>`;
  }

  /* سياسة الاستخدام الرسمية (public/js/policy.js — نفس ما يوافق عليه المستخدم بعد الدخول) تُعرض من شاشة الدخول */
  function usagePolicy() {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const P = window.POLICY || { ar: [], en: [] },
      en = !!(window.I18N && I18N.lang === 'en');
    const T = en ? 'Acceptable use policy' : 'سياسة الاستخدام';
    bg.innerHTML = `<div class="modal lg-policy" role="dialog" aria-modal="true" aria-label="${T}"><h3>📜 ${T} <small class="muted">${en ? 'Version' : 'الإصدار'} ${esc(P.ver || '')}</small></h3>
      <div class="lg-pol-body">${(en ? P.en : P.ar).map(([t, h]) => `<section><h4>${esc(t)}</h4>${h}</section>`).join('')}</div>
      <p class="muted">${en ? 'See also the' : 'راجع أيضاً'} <a href="/privacy.html" target="_blank" rel="noopener">${en ? 'privacy policy' : 'سياسة الخصوصية'}</a>.</p>
      <div class="row"><button type="button" class="btn primary" data-ok>${en ? 'I agree' : 'أوافق'}</button><button type="button" class="btn ghost" data-x>${en ? 'Close' : 'إغلاق'}</button></div></div>`;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    $('[data-x]', bg).onclick = close;
    $('[data-ok]', bg).onclick = () => {
      const c = $('#lgAgree');
      if (c) c.checked = true;
      close();
    };
    bg.onclick = (e) => {
      if (e.target === bg) close();
    };
    $('[data-ok]', bg).focus();
  }

  /* مشهد خلفية شاشة الدخول (من تصميم Saden ERP): مدينة بمبانٍ كبيرة، موجات، وأيقونات الأنظمة تدور حول الشعار */
  function loginScene() {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const r = (a, b) => a + rnd() * (b - a);
    /* أفق الرياض بأسلوب مسطح (برج المملكة، الفيصلية، أبراج وقباب) بألوان النظام — مساحة الرسم 1600×500 والأرض عند 500 */
    return loginScenePart2(r, rnd);
  }
  /* جزء من loginScene: const skyline = () => {… */
  function loginScenePart2(r, rnd) {
    const skyline = () => {
      const rect = (x, y, w, h, c, ex = '') => `<rect class="${c}" x="${x}" y="${y}" width="${w}" height="${h}"${ex}/>`;
      const bands = (x1, x2, y1, y2, step, h = 6) => {
        let o = '';
        for (let y = y1; y < y2; y += step) o += rect(x1, y, x2 - x1, h, 'rx');
        return o;
      };
      const lit = (x, y) => rect(x, y, 4, 6, 'tw', ` style="animation-delay:${r(0, 6).toFixed(1)}s"`);
      /* مبانٍ خلفية متفرقة */
      let back = '',
        x = 0;
      while (x < 1600) {
        const w = Math.round(r(36, 80)),
          h = Math.round(r(110, 250)),
          t = 500 - h;
        back += rect(x, t, w, h, 'rb');
        if (rnd() < 0.25) back += rect(x + w / 2 - 1.5, t - Math.round(r(16, 36)), 3, 40, 'rb');
        x += w + Math.round(r(0, 10));
      }
      /* المعالم */
      let mid = '';
      // برج بشكل شراع ودائرة وشبكة حديدية
      mid += `<path class="rl" d="M38 500V250C38 185 70 140 110 116V500Z"/><circle class="rx" cx="86" cy="160" r="9"/>`;
      mid += `<path class="rxs" d="M44 300L104 360M104 300L44 360M44 360L104 420M104 360L44 420M44 420L104 480M104 420L44 480M44 300H104M44 360H104M44 420H104"/>`;
      // برج المملكة: جسم واحد وفتحة القوس في الأعلى والجسر بداخلها
      mid += `<path class="rd" fill-rule="evenodd" d="M136 500V102L144 58H236L244 102V500ZM152 70H228V92Q228 176 190 184Q152 176 152 92Z"/>`;
      mid += rect(152, 108, 76, 6, 'rd') + rect(162, 214, 3, 286, 'rx', ' opacity=".45"') + rect(215, 214, 3, 286, 'rx', ' opacity=".45"');
      mid += lit(178, 260) + lit(196, 320) + lit(184, 400);
      // مبنى بشرائط زجاج
      mid += rect(290, 250, 84, 250, 'rm') + bands(298, 366, 268, 490, 18, 7) + rect(298, 258, 68, 4, 'rx');
      // مبنى بقبة
      mid +=
        rect(430, 360, 110, 140, 'rm') +
        `<path class="rl" d="M447 360A38 38 0 0 1 523 360Z"/>` +
        rect(484, 306, 2, 18, 'rl') +
        bands(440, 530, 380, 495, 22, 5);
      // برج بسطح مائل
      mid += `<path class="rl" d="M585 500V300L635 270V500Z"/>` + bands(592, 628, 310, 495, 20, 4);
      // برج مدبب بشبكة
      mid += `<path class="rl" d="M730 500V305L765 165L800 305V500Z"/>` + rect(764, 120, 2, 50, 'rl');
      mid += `<path class="rxs" d="M738 320L792 370M792 320L738 370M738 370L792 420M792 370L738 420M738 420L792 470M792 420L738 470"/>`;
      // مبنى منخفض بشرائط
      mid += rect(830, 340, 100, 160, 'rm') + bands(838, 922, 356, 492, 16, 6);
      // برج الفيصلية: هرم بشرائط وكرة وسارية
      let fb = '';
      for (let y = 250; y < 490; y += 14) {
        const hw = 15 + ((y - 150) * 30) / 350;
        fb += `M${(1000 - hw + 4).toFixed(1)} ${y}H${(1000 + hw - 4).toFixed(1)}`;
      }
      mid +=
        `<path class="rd" d="M955 500L985 160L1000 118L1015 160L1045 500Z"/>` +
        rect(999, 56, 2, 66, 'rd') +
        `<circle class="rx" cx="1000" cy="205" r="15"/>`;
      mid += `<path class="rxs" d="${fb}M972 488L1000 252L1028 488"/>`;
      // مجموعة يمين (يظهر معظمها على الشاشات العريضة)
      mid += rect(1085, 220, 56, 280, 'rl') + bands(1093, 1133, 236, 495, 20, 5);
      mid += rect(1172, 250, 30, 250, 'rm') + `<path class="rl" d="M1170 252A17 17 0 0 1 1204 252Z"/>` + rect(1186, 206, 2, 30, 'rl');
      mid +=
        `<path class="rd" d="M1240 500V190Q1275 160 1310 190V500Z"/>` +
        rect(1252, 210, 3, 290, 'rx', ' opacity=".45"') +
        lit(1280, 300) +
        lit(1266, 380);
      mid +=
        rect(1340, 380, 130, 120, 'rm') + `<path class="rl" d="M1370 380A35 35 0 0 1 1440 380Z"/>` + bands(1350, 1460, 400, 495, 18, 5);
      mid += `<path class="rl" d="M1495 500V240L1525 200L1555 240V500Z"/>` + rect(1524, 160, 2, 44, 'rl');
      /* مبانٍ أمامية منخفضة */
      let front = '';
      x = 0;
      while (x < 1600) {
        const w = Math.round(r(40, 110)),
          h = Math.round(r(26, 96));
        front += rect(x, 500 - h, w, h, 'rf');
        x += w + Math.round(r(0, 6));
      }
      return `<svg class="lg-city" viewBox="0 0 1600 500" preserveAspectRatio="xMinYMax slice"><g>${back}</g><g>${mid}</g><g>${front}</g></svg>`;
    };
    /* سحب تتحرك ببطء خلف الأبراج */
    return loginScenePart(r, skyline);
  }
  /* جزء من loginScene: const clouds = () => {… */
  function loginScenePart(r, skyline) {
    const clouds = () => {
      const c = (x, y, s) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="40" r="40"/><circle cx="55" cy="22" r="52"/><circle cx="120" cy="38" r="42"/><rect x="0" y="40" width="120" height="42" rx="20"/></g>`;
      const one = c(60, 60, 1.1) + c(420, 20, 0.8) + c(700, 90, 1.4) + c(1060, 40, 0.9) + c(1380, 80, 1.2);
      return `<svg class="lg-clouds" viewBox="0 0 3200 220" preserveAspectRatio="xMinYMid slice"><g id="lgCl">${one}</g><use href="#lgCl" x="1600"/></svg>`;
    };
    const wave = (cls, y, a) =>
      `<svg class="lg-wave ${cls}" viewBox="0 0 2000 200" preserveAspectRatio="none"><path d="M0 ${y}Q250 ${y - a} 500 ${y}T1000 ${y}T1500 ${y}T2000 ${y}V200H0z"/></svg>`;
    const I = {
      hr: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      sales: '<path d="M4 20V14M9 20v-8M14 20v-5M19 20V9"/><path d="M3 11l5-5 4 3 7-6M15 3h4v4"/>',
      inv: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-9h10v9M7 15h10M7 18h10"/>',
      ops: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="7"/>',
      appr: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>',
      fin: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>',
      pur: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H5.1"/>',
    };
    const mods = [
      ['hr', 'HR', '#3b6cf0', '#1739b5'],
      ['sales', 'Sales', '#34c06a', '#13793a'],
      ['inv', 'Inventory', '#ffa63a', '#e8650a'],
      ['ops', 'Operations', '#25bfd4', '#0b7894'],
      ['appr', 'Approvals', '#2c51b8', '#122a6e'],
      ['fin', 'Finance', '#1db594', '#0a6a57'],
      ['pur', 'Purchasing', '#9a4cf0', '#5a1fb0'],
    ];
    const tiles = mods
      .map(
        ([k, l, c1, c2], i) =>
          `<div class="lg-tile" style="--a:${Math.round((360 / mods.length) * i - 90)}deg"><div class="lg-tile-in" style="--c1:${c1};--c2:${c2};--d:-${(i * 0.7).toFixed(1)}s"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg><b>${l}</b></div></div>`,
      )
      .join('');
    const dots = Array.from(
      { length: 18 },
      () =>
        `<i style="left:${r(0, 100).toFixed(1)}%;top:${r(5, 70).toFixed(1)}%;animation-delay:-${r(0, 14).toFixed(1)}s;animation-duration:${r(10, 18).toFixed(1)}s;--z:${r(4, 10).toFixed(0)}px"></i>`,
    ).join('');
    const scene = `<div class="lg-scene" aria-hidden="true"><div class="lg-dots">${dots}</div>${clouds()}${skyline()}
      <div class="lg-waves">${wave('w1', 90, 40)}${wave('w2', 120, 32)}${wave('w3', 150, 26)}</div></div>`;
    const hub = `<div class="lg-motto2" dir="ltr"><span>One System.</span> <span>One Organization.</span> <b>Complete Control.</b></div>
      <div class="lg-hub" aria-hidden="true"><div class="lg-glow"></div>
      <svg class="lg-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke-width=".5" stroke-dasharray="3 3"/></svg>
      <div class="lg-orbit">${tiles}</div>
      <div class="lg-core"><div class="lg-mark"></div><div class="lg-ses ses-word" aria-label="SES"><span class="ses-s">S</span><span class="ses-e">E</span><span class="ses-s">S</span></div><div class="lg-sub">SADEN ERP SYSTEM</div></div></div>`;
    return { scene, hub };
  }

  function viewLogin() {
    /* حالة الصفحة: ما يتغير بعد العرض (last، capToken، capTimer) */
    const vs = {};
    vs.last = '';
    try {
      vs.last = localStorage.getItem('login:user') || '';
    } catch {
      /* تجاهل */
    }
    const soc = socialLinks(),
      sc = loginScene();
    /* الموافقة محفوظة على الجهاز لنسخة السياسة الحالية فقط: تعديل السياسة يطلب الموافقة من جديد */
    const polV = state.config.policyVersion || '1';
    viewLoginPart(vs.last, polV, sc, soc);
    /* «لست روبوت»: رمز موقّع من الخادم يُرسل مع الدخول، ويُستهلك بعد محاولة واحدة */
    vs.capToken = '';
    vs.capTimer = 0;
    /* Cloudflare Turnstile إن ضُبط مفتاحه على الخادم، وإلا التحقق المحلي (للشبكة الداخلية بلا إنترنت) */
    if (state.config.turnstileSiteKey) return wireLf($('#lgTs'), turnstileWidget(vs), polV, vs);
    const cap = $('#lgCap'),
      capBtn = $('#lgCapBtn');
    const capSet = (st) => {
      cap.dataset.state = st;
      capBtn.setAttribute('aria-checked', st === 'ok' ? 'true' : 'false');
    };
    const capReset = () => {
      vs.capToken = '';
      clearTimeout(vs.capTimer);
      capSet('off');
    };
    capBtn.onclick = async () => {
      if (cap.dataset.state !== 'off') return;
      capSet('wait');
      try {
        const [r] = await Promise.all([api('GET', '/api/login/challenge'), new Promise((ok) => setTimeout(ok, 1200))]);
        vs.capToken = r.token;
        capSet('ok');
        $('#lerr').innerHTML = '';
        vs.capTimer = setTimeout(capReset, 9 * 60 * 1000); // صلاحية الرمز 10 دقائق
      } catch (err) {
        capSet('off');
        $('#lerr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    return wireLf(cap, capReset, polV, vs);
  }
  /* Cloudflare Turnstile: يظهر دائماً، والرمز يُرسل مع الدخول ويتحقق منه الخادم لدى Cloudflare مرة واحدة */
  function turnstileWidget(vs) {
    const box = $('#lgTs');
    let id = null;
    const draw = () => {
      if (!document.body.contains(box)) return;
      id = window.turnstile.render(box, {
        sitekey: state.config.turnstileSiteKey,
        action: 'login',
        language: window.I18N && I18N.lang === 'en' ? 'en' : 'ar',
        theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
        size: 'flexible',
        callback: (t) => {
          vs.capToken = t;
          if ($('#lerr')) $('#lerr').innerHTML = '';
        },
        'expired-callback': () => {
          vs.capToken = '';
        },
        'error-callback': () => {
          vs.capToken = '';
        },
      });
    };
    loadTurnstile().then(draw, () => {
      if ($('#lerr')) $('#lerr').innerHTML = '<div class="err">تعذّر تحميل التحقق من Cloudflare — تأكد من اتصال الإنترنت</div>';
    });
    return () => {
      vs.capToken = '';
      if (id !== null && window.turnstile) window.turnstile.reset(id);
    };
  }
  /* سكربت Cloudflare يُحمَّل مرة واحدة عند أول عرض لشاشة الدخول */
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (!S.tsLoading)
      S.tsLoading = new Promise((ok, no) => {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.onload = ok;
        s.onerror = () => {
          S.tsLoading = null;
          s.remove();
          no();
        };
        document.head.appendChild(s);
      });
    return S.tsLoading;
  }
  /* «لست روبوت»: مربع Cloudflare دائماً، أو المربع المحلي (يظهر بعد محاولة خاطئة) */
  function captchaHtml(capOn) {
    if (state.config.turnstileSiteKey) return '<div class="lg-ts" id="lgTs"></div>';
    return `<div class="lg-cap" id="lgCap" data-state="off"${capOn ? '' : ' hidden'}><button type="button" class="lg-cap-box" id="lgCapBtn" role="checkbox" aria-checked="false" aria-label="أنا لست روبوتاً"><span class="lg-spin" aria-hidden="true"></span><svg class="lg-tick" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg></button>
        <span class="lg-cap-t">أنا لست روبوتاً</span><span class="lg-cap-s" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5" stroke-linecap="round"/></svg><small>دخول آمن</small></span></div>`;
  }
  /* أحداث viewLogin: #lf */
  function wireLf(cap, capReset, polV, vs) {
    $('#lf').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const lerr = (m) => {
        $('#lerr').innerHTML = `<div class="err">${esc(m)}</div>`;
      };
      if (!String(fd.get('username') || '').trim() || !fd.get('password')) return lerr('أدخل اسم المستخدم وكلمة المرور');
      if (!fd.get('agree')) {
        const a = $('.lg-agree');
        a.classList.remove('shake');
        void a.offsetWidth;
        a.classList.add('shake');
        return lerr('يجب الموافقة على سياسة الاستخدام وسياسة الخصوصية');
      }
      if (!cap.hidden && !vs.capToken) {
        cap.classList.remove('shake');
        void cap.offsetWidth;
        cap.classList.add('shake');
        return lerr('يرجى تأكيد أنك لست روبوتاً');
      }
      S.loginRemember = !!fd.get('remember');
      try {
        localStorage.setItem('login:agree', polV);
      } catch {
        /* تجاهل */
      }
      try {
        if (S.loginRemember) localStorage.setItem('login:user', String(fd.get('username')).trim());
        else localStorage.removeItem('login:user');
      } catch {
        /* تجاهل */
      }
      const go = $('.lg-go');
      go.disabled = true;
      const token = vs.capToken;
      capReset();
      try {
        let r = await api('POST', '/api/login', {
          username: fd.get('username'),
          password: fd.get('password'),
          remember: S.loginRemember,
          captcha: token,
          agree: true,
        });
        if (r.otp) r = await askOtp(r);
        if (!r) return;
        try {
          localStorage.removeItem('login:fail');
        } catch {
          /* تجاهل */
        }
        state.user = r.user;
        state.group = r.group || null;
        /* حركة الترحيب بشعار الشركة بعد نجاح الدخول، وتُحمَّل الصفحة الرئيسية أثناءها */
        const anim = splash(r.user.name);
        if (!r.user.mustChange) await refreshStats();
        await anim;
        location.hash = r.user.mustChange ? '#/account' : multiCo() ? '#/group' : '#/apps';
        if (!r.user.mustChange && state.stats && state.stats.overdue)
          setTimeout(() => toast(`تذكير: لديك ${state.stats.overdue} طلب متأخر بانتظار اعتمادك`, true), 800);
        route();
      } catch (err) {
        if ($('.lg-go')) $('.lg-go').disabled = false;
        if ($('#lerr')) lerr(err.message);
        /* بعد أي محاولة خاطئة يظهر «لست روبوت» (والخادم يطلبه من هذا العنوان لمدة 30 دقيقة) */
        if (err.data && /غير صحيحة|إيقاف الدخول|روبوت|التحقق/.test(err.message)) {
          try {
            localStorage.setItem('login:fail', String(Date.now()));
          } catch {
            /* تجاهل */
          }
          if ($('#lgCap') && $('#lgCap').hidden) {
            $('#lgCap').hidden = false;
            $('#lgCapBtn').focus();
          }
        }
      }
    };
  }
  /* جزء من viewLogin: let agreed = false,… */
  function viewLoginPart(last, polV, sc, soc) {
    let agreed = false,
      capOn = false;
    try {
      agreed = localStorage.getItem('login:agree') === polV;
      capOn = Date.now() - Number(localStorage.getItem('login:fail') || 0) < 30 * 60000;
    } catch {
      /* تجاهل */
    }
    /* ترحيب حسب الوقت والتاريخ الميلادي والهجري */
    const d0 = new Date(),
      hr = d0.getHours();
    const greet = hr >= 5 && hr < 12 ? 'صباح الخير' : 'مساء الخير';
    let gDate = '',
      hDate = '';
    try {
      gDate = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d0);
      hDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d0);
    } catch {
      /* متصفح قديم */
    }
    const nt = state.config.loginNotice;
    const NT_ICON = { info: 'ℹ️', warn: '⚠️', bad: '⛔', ok: '✅' };
    /* تحميل التطبيق: Google Play (أو ملف أندرويد المباشر حتى يُنشر في المتجر)، وApp Store عند توفر رابطه */
    const AL = state.config.appLinks || {},
      apk = state.config.appApk;
    const playHref = AL.play || apk || '',
      iosHref = AL.ios || '';
    const PLAY_ICON =
      '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="#00a0ff" d="M3.6 1.8 13.4 12l-9.8 10.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z"/><path fill="#00e676" d="M3.6 1.8 16.7 8.9 13.4 12z"/><path fill="#ff3d00" d="M3.6 22.2 13.4 12l3.3 3.1z"/><path fill="#ffc400" d="m16.7 8.9 3.9 2.1c.8.5.8 1.5 0 2l-3.9 2.1-3.3-3.1z"/></svg>';
    const APPLE_ICON =
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="#fff" aria-hidden="true"><path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.62 1.09zm3.38-3.07c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7"/></svg>';
    const badge = (href, icon, top, name, opts = '') =>
      href
        ? `<a class="lg-store" href="${esc(href)}"${opts}>${icon}<span><small>${top}</small><b>${name}</b></span></a>`
        : `<span class="lg-store off" title="قريباً على App Store" aria-disabled="true">${icon}<span><small>قريباً على</small><b>${name}</b></span></span>`;
    const stores =
      playHref || iosHref || apk
        ? `<div class="lg-stores"><span>حمّل التطبيق</span><div>${badge(playHref, PLAY_ICON, 'احصل عليه من', 'Google Play', AL.play ? ' target="_blank" rel="noopener"' : ' download')}${badge(iosHref, APPLE_ICON, 'حمّله من', 'App Store', ' target="_blank" rel="noopener"')}</div></div>`
        : '';
    const occ = occasionNow();
    renderViewLogin(NT_ICON, agreed, capOn, gDate, greet, hDate, last, nt, occ, sc, soc, stores);
    wireLogin();
    (last ? $('#lgP') : $('#lgU')).focus();
    /* تنبيه Caps Lock أثناء كتابة كلمة المرور */
    const caps = (e) => {
      if (e.getModifierState) $('#lgCaps').hidden = !e.getModifierState('CapsLock');
    };
    wireLogin2(caps);
  }
  /* محتوى viewLogin (HTML) */
  function renderViewLogin(NT_ICON, agreed, capOn, gDate, greet, hDate, last, nt, occ, sc, soc, stores) {
    app.innerHTML = `<div class="login lg2${occ && occ.theme !== 'brand' ? ` occ-${occ.theme || occ.id}` : ''}">${sc.scene}${occ && occ.deco !== 'none' ? occDeco(occ.deco || occ.id) : ''}
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="lgNoWhite" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 3 0"/></filter></svg>
      <form class="card login-card" id="lf" novalidate>
      <img class="login-logo" src="logo.png" alt="" data-rmerr>
      <h1>${esc(state.config.appName)}</h1><p>${esc(state.config.orgName)}</p>
      <div class="login-desc">نظام سادن المتكامل</div><div class="login-motto">One System. One Organization. Complete Control.</div>
      <div class="lg-greet"><b>${occ ? esc(occ.greet) : `${greet} 👋`}</b><span>${esc(gDate)}${hDate ? ` · ${esc(hDate)}` : ''}</span></div>
      ${nt ? `<div class="lg-notice ${esc(nt.type)}" role="status"><span aria-hidden="true">${NT_ICON[nt.type] || 'ℹ️'}</span><span>${esc(nt.text)}</span></div>` : ''}
      <div class="field"><label for="lgU">اسم المستخدم</label><div class="lg-in"><span class="lg-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><input class="in" id="lgU" name="username" autocomplete="username" required dir="ltr" value="${esc(last)}"></div></div>
      <div class="field"><label for="lgP">كلمة المرور</label><div class="lg-in"><span class="lg-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span><input class="in" id="lgP" type="password" name="password" autocomplete="current-password" required dir="ltr"><button type="button" class="lg-eye" id="lgEye" aria-label="إظهار كلمة المرور" title="إظهار كلمة المرور"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="lg-caps" id="lgCaps" hidden>⇪ زر الحروف الكبيرة (Caps Lock) مفعّل</div></div>
      <div class="lg-row"><label class="lg-chk"><input type="checkbox" name="remember"${last ? ' checked' : ''}> تذكرني</label><a href="#" data-acc="reset">نسيت كلمة المرور؟</a></div>
      <label class="lg-agree"><input type="checkbox" id="lgAgree" name="agree"${agreed ? ' checked' : ''}><span>أوافق على <a href="#" id="lgPol">سياسة الاستخدام</a> و<a href="/privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a></span></label>
      ${captchaHtml(capOn)}
      <div id="lerr" role="alert"></div>
      <button class="btn primary lg-go">دخول</button>
      <div class="login-links"><span>ليس لديك حساب؟</span><a href="#" data-acc="account">طلب إنشاء حساب</a></div>
      ${soc ? `<div class="lg-social"><span>تابعنا</span><div>${soc}</div></div>` : ''}
      ${stores}
      <select class="in lang-login" data-langsel aria-label="اللغة / Language / زبان" data-noi18n>${Object.entries(I18N.LANGS)
        .map(([k, L]) => `<option value="${k}" lang="${k}"${I18N.lang === k ? ' selected' : ''}>${L.name}</option>`)
        .join('')}</select>
      <div class="login-ver">SADEN ERP · الإصدار <bdi dir="ltr">${esc(state.config.version || '1.0.0')}</bdi> · © ${new Date().getFullYear()} مجموعة سادن</div>
    </form>
    <div class="lg-hero">${occ ? `<div class="occ-title"><b>${esc(occ.title)}</b><small>${esc(occ.sub)}</small></div>` : ''}${sc.hub}</div></div>`;
  }
  /* أحداث viewLogin: #lgEye */
  function wireLogin2(caps) {
    $('#lgP').addEventListener('keydown', caps);
    $('#lgP').addEventListener('keyup', caps);
    $('#lgP').addEventListener('blur', () => {
      $('#lgCaps').hidden = true;
    });
    $('#lgEye').onclick = () => {
      const p = $('#lgP'),
        show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      $('#lgEye').classList.toggle('on', show);
      $('#lgEye').setAttribute('aria-label', show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
    };
  }
  /* أحداث viewLogin: #lgPol */
  function wireLogin() {
    $$('[data-langsel]').forEach((s) => {
      s.onchange = () => I18N.set(s.value);
    });
    $$('[data-acc]').forEach((a) => {
      a.onclick = (e) => {
        e.preventDefault();
        accessForm(a.dataset.acc);
      };
    });
    $('#lgPol').onclick = (e) => {
      e.preventDefault();
      usagePolicy();
    };
  }

  /* شاشة رمز التحقق بعد كلمة المرور (مدير النظام) */
  /* «نسيت كلمة المرور» و«طلب إنشاء حساب» من شاشة الدخول: يُرسل الطلب لمدير النظام ويتواصل مع صاحبه */
  function accessForm(kind) {
    const card = $('#lf'),
      reset = kind === 'reset';
    card.noValidate = false;
    const f = (n, l, attrs = '') => `<div class="field"><label>${l}</label><input class="in" name="${n}" ${attrs}></div>`;
    card.innerHTML = `<img class="login-logo" src="logo.png" alt="" data-rmerr>
      <h1>${reset ? '🔑 نسيت كلمة المرور' : '👤 طلب إنشاء حساب'}</h1>
      <p class="login-hint">${reset ? 'سيصل طلبك لمدير النظام ليعيّن لك كلمة مرور مؤقتة ويتواصل معك' : 'سيصل طلبك لمدير النظام لمراجعته وإنشاء حسابك والتواصل معك'}</p>
      ${f('name', 'الاسم *', 'required maxlength="100"')}
      ${reset ? f('username', 'اسم المستخدم', 'dir="ltr" maxlength="30" autocomplete="username"') : ''}
      ${f('empNo', `الرقم الوظيفي أو رقم الهوية${reset ? '' : ' *'}`, `dir="ltr" maxlength="30" inputmode="numeric"${reset ? '' : ' required'}`)}
      ${reset ? '' : `<div class="field"><label>الفرع / الإدارة</label><input class="in" name="branch" list="accBr" maxlength="80"><datalist id="accBr">${(state.config.branches || []).map((b) => `<option value="${esc(b)}">`).join('')}</datalist></div>${f('title', 'المسمى الوظيفي', 'maxlength="100"')}`}
      ${f('phone', 'رقم الجوال', 'dir="ltr" inputmode="tel" maxlength="20"')}
      ${f('email', 'البريد الإلكتروني', 'dir="ltr" type="email" maxlength="120"')}
      <div class="field"><label>ملاحظات</label><textarea class="in" name="note" rows="2" maxlength="500"></textarea></div>
      <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none" aria-hidden="true">
      <div id="lerr"></div>
      <button class="btn primary" type="submit">إرسال الطلب لمدير النظام</button>
      <button type="button" class="btn ghost" id="accBack">رجوع لتسجيل الدخول</button>`;
    $('#accBack').onclick = () => viewLogin();
    card.onsubmit = async (e) => {
      e.preventDefault();
      const body = { kind, ...Object.fromEntries(new FormData(card)) };
      try {
        await api('POST', '/api/access-requests', body);
        card.innerHTML = `<img class="login-logo" src="logo.png" alt="" data-rmerr><h1>✅ تم إرسال طلبك</h1>
          <p class="login-hint">وصل طلبك لمدير النظام، وسيتواصل معك على ${esc(body.phone || body.email)} بعد مراجعته.</p>
          <button type="button" class="btn primary" id="accBack">رجوع لتسجيل الدخول</button>`;
        $('#accBack').onclick = () => viewLogin();
      } catch (err) {
        $('#lerr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    $('input[name=name]', card).focus();
  }

  function askOtp(first) {
    return new Promise((resolve) => {
      const card = $('#lf');
      const keep = card.innerHTML;
      card.innerHTML = `<img class="login-logo" src="logo.png" alt="" data-rmerr>
        <h1>🔐 رمز التحقق</h1><p>أرسلنا رمزاً من 6 أرقام إلى <b dir="ltr">${esc(first.email)}</b></p>
        <div class="field"><label>رمز التحقق</label><input class="in otp-in" id="otpIn" inputmode="numeric" autocomplete="one-time-code" maxlength="6" dir="ltr" autofocus></div>
        <div id="lerr"></div>
        <button class="btn primary" id="otpGo" type="button">تأكيد الدخول</button>
        <div class="row" style="justify-content:space-between;margin-top:10px"><button class="btn sm ghost" type="button" id="otpRe">إعادة إرسال الرمز</button><button class="btn sm ghost" type="button" id="otpBack">رجوع</button></div>`;
      const err = (m) => {
        $('#lerr').innerHTML = `<div class="err">${esc(m)}</div>`;
      };
      const go = async () => {
        try {
          resolve(await api('POST', '/api/login/otp', { token: first.token, code: $('#otpIn').value, remember: S.loginRemember }));
        } catch (e) {
          err(e.message);
          if (/من جديد/.test(e.message)) setTimeout(() => viewLogin(), 1500);
        }
      };
      $('#otpGo').onclick = go;
      $('#otpIn').onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          go();
        }
      };
      $('#otpIn').oninput = () => {
        if (/^\d{6}$/.test($('#otpIn').value)) go();
      };
      $('#otpRe').onclick = async () => {
        try {
          const r = await api('POST', '/api/login/otp/resend', { token: first.token });
          toast(`أعدنا إرسال الرمز إلى ${r.email}`);
        } catch (e) {
          err(e.message);
        }
      };
      $('#otpBack').onclick = () => {
        card.innerHTML = keep;
        viewLogin();
        resolve(null);
      };
      $('#otpIn').focus();
    });
  }

  /* حركة الترحيب بشعار الشركة عند تسجيل الدخول، وتُتخطى بالضغط */
  function splash(name) {
    const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.createElement('div');
    el.id = 'splash';
    if (reduced) el.className = 'reduced';
    el.innerHTML = `<div class="sp-ring"></div><div class="sp-ring r2"></div>
      <div class="sp-center"><div class="sp-logo-wrap"><img class="sp-logo" src="logo.png" alt=""><i class="sp-shine"></i></div>
        <div class="sp-app"></div><div class="sp-org"></div><div class="sp-bar"><i></i></div></div>`;
    $('.sp-app', el).textContent = name ? `أهلاً ${name}` : state.config.appName || '';
    $('.sp-org', el).textContent = state.config.appName || '';
    document.body.appendChild(el);
    return new Promise((resolve) => {
      let done = false;
      const end = () => {
        if (done) return;
        done = true;
        el.classList.add('out');
        resolve();
        setTimeout(() => el.remove(), 700);
      };
      el.onclick = end;
      setTimeout(end, reduced ? 900 : 3000);
    });
  }

  return { viewLogin };
};
