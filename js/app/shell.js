/* إطار الصفحة: النوافذ (تصغير/تكبير/إغلاق) والهيكل العام shell */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, $$, app, state, today, can, api, icon, navCrumb } = S;
  Object.assign(S, { shell });
  /* ---------- التحكم في الصفحة مثل النوافذ: تصغير / تكبير / إغلاق ----------
   * التصغير: تُحفظ الصفحة في شريط أسفل الشاشة ويُفتح شاشة التطبيقات، والضغط عليها يعيدها
   * التكبير: الصفحة تملأ الشاشة (بدون القائمة الجانبية والشريط العلوي)، ويُحفظ الاختيار على الجهاز
   * الإغلاق: الرجوع لشاشة التطبيقات */
  const WIN_IC = {
    min: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    max: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    restore:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    /* أسهم التنقل (الواجهة من اليمين لليسار: الرجوع يشير لليمين) */
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reload:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const winKey = (k) => `win-${k}:${(state.user || {}).id || ''}`;
  const winMax = () => {
    try {
      return localStorage.getItem(winKey('max')) === '1';
    } catch {
      return false;
    }
  };
  const winMins = () => {
    try {
      const v = JSON.parse(localStorage.getItem(winKey('min')) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  const winSaveMins = (l) => {
    try {
      localStorage.setItem(winKey('min'), JSON.stringify(l.slice(-8)));
    } catch {
      /* تجاهل */
    }
  };
  const winBar = () => {
    const l = winMins().filter((m) => m.hash !== location.hash);
    return l.length
      ? `<div class="win-bar" aria-label="الصفحات المصغّرة">${l.map((m) => `<span class="wb-i"><a href="${esc(m.hash)}" data-wbopen title="استعادة: ${esc(m.title)}">${esc(m.title)}</a><button type="button" data-wbx="${esc(m.hash)}" title="إغلاق" aria-label="إغلاق">×</button></span>`).join('')}</div>`
      : '';
  };
  const winApply = (active) => {
    /* الصفحة المفتوحة تخرج من شريط المصغّرات */
    const l = winMins();
    if (l.some((m) => m.hash === location.hash)) winSaveMins(l.filter((m) => m.hash !== location.hash));
    document.documentElement.classList.toggle('win-max', winMax() && active !== '#/apps');
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-win]');
    if (b) {
      const w = b.dataset.win;
      if (w === 'close') {
        location.hash = '#/apps';
        return;
      }
      if (w === 'max') {
        try {
          localStorage.setItem(winKey('max'), winMax() ? '' : '1');
        } catch {
          /* تجاهل */
        }
        document.documentElement.classList.toggle('win-max', winMax());
        b.innerHTML = winMax() ? WIN_IC.restore : WIN_IC.max;
        b.title = winMax() ? 'استعادة الحجم' : 'تكبير (ملء الشاشة)';
        return;
      }
      if (w === 'min') {
        const crumb = $('.gcrumb b:last-of-type'),
          h1 = $('#main .page-head h1');
        const title = String((h1 && h1.textContent) || (crumb && crumb.textContent) || document.title)
          .trim()
          .slice(0, 40);
        winSaveMins([...winMins().filter((m) => m.hash !== location.hash), { hash: location.hash, title }]);
        location.hash = '#/apps';
      }
      return;
    }
    const n = e.target.closest('[data-gcn]');
    if (n) {
      const k = n.dataset.gcn;
      if (k === 'back') history.back();
      else if (k === 'fwd') history.forward();
      else if (k === 'up' && n.dataset.up) location.hash = n.dataset.up;
      else if (k === 'reload') S.route();
      return;
    }
    const x = e.target.closest('[data-wbx]');
    if (x) {
      winSaveMins(winMins().filter((m) => m.hash !== x.dataset.wbx));
      const it = x.closest('.wb-i'),
        bar = x.closest('.win-bar');
      it.remove();
      if (bar && !bar.children.length) bar.remove();
    }
  });
  document.addEventListener('submit', (e) => {
    const fm = e.target.closest('.gc-find');
    if (!fm) return;
    e.preventDefault();
    if (location.hash.startsWith('#/apps')) return;
    const q = $('input', fm).value.trim();
    location.hash = q ? `#/apps?q=${encodeURIComponent(q)}` : '#/apps';
  });
  /* Esc يستعيد الحجم من وضع التكبير */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.documentElement.classList.contains('win-max') && !document.querySelector('.modal-bg')) {
      const b = $('[data-win="max"]');
      if (b) b.click();
    }
  });
  /* الوضع الداكن / العادي: اختيار كل مستخدم، يُحفظ في حسابه وعلى الجهاز (ليُطبَّق قبل تحميل الصفحة بدون وميض) */
  const uiTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  function setUiTheme(th) {
    th = th === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = th;
    try {
      localStorage.setItem('ui-theme', th);
    } catch {
      /* تجاهل */
    }
    const m = document.querySelector('meta[name=theme-color]');
    if (m) m.content = th === 'dark' ? '#0b1220' : '#8b1a1a';
  }
  function shell(content, active) {
    state.crumbActive = active;
    S.apStyleApply();
    winApply(active);
    if (state.user && state.user.uiTheme && state.user.uiTheme !== uiTheme()) setUiTheme(state.user.uiTheme);
    const u = state.user;
    const pg = location.hash.split('?')[0];
    if (state.navPage !== pg) {
      state.navPage = pg;
      state.navOpen = new Set();
    }
    /* لا قائمة جانبية (قرار الإدارة 2026-11): التنقل من صفحة التطبيقات وزرها في الشريط العلوي، ومسار الصفحة تحته */
    app.innerHTML = `
      <div class="mobile-bar"><b>${esc(state.config.appName)}</b><a id="menuBtn" href="#/apps" aria-label="التطبيقات" title="التطبيقات">${icon('grid')}</a></div>
      <div class="shell">
        <div class="main-col">
          <!-- الشريط العلوي الثابت: (من اليسار) اسم المستخدم، الإشعارات، دليل الاستخدام -->
          ${shellTopbar(active, u)}
          ${navCrumb(active)}
          <main class="main" id="main">${content}</main>
          <div class="logins-dock">${loginsBox(u)}</div>
        </div>
      </div>`;
    $('#logoutBtn').onclick = shellLogout;
    S.snBind();
    shellTopWire();
    S.bindPersonal();
    S.loadPersonal();
    S.setBell((state.stats || {}).notif || 0);
    S.setTopBadges();
    if ($('#notifPanel')) $('#notifPanel').remove();
    return $('#main');
  }
  /* الشريط العلوي: المناسبة، والشركات، والاختصارات (التطبيقات والرئيسية والدردشة والبريد)، والإشعارات، والمنصب، وقائمة الحساب
   * (اللغة والدليل والوضع الداكن والإعدادات وتسجيل الخروج داخل قائمة الحساب — قرار الإدارة 2026-11) */
  const shellTopbar = (active, u) => `<header class="topbar">
            ${S.occChip()}
            ${S.multiCo() ? shellCoMenu(active) : ''}
            ${shellTopLinks(active)}
            <button class="tb-btn bell" data-bell aria-label="الإشعارات" title="الإشعارات">${icon('bell')}<span class="bell-n" hidden></span></button>
            <span class="tb-sep"></span>
            ${u.acting || (u.positions || []).length ? `<button type="button" class="tb-pos${u.acting ? ' on' : ''}" data-posw title="التبديل بين المنصب وحسابك الشخصي">${icon('rotate')}<span><small>${u.acting ? 'تعمل بصفة' : 'حسابك الشخصي'}</small><b>${esc(u.acting ? u.acting.name : (u.positions[0] || {}).name || '')}</b></span></button>` : ''}
            ${shellUserMenu(active, u)}
          </header>`;
  /* قائمة الحساب: الضغط على الاسم (وسهمه) يفتح: حسابي، والوضع الداكن، واللغة، ودليل الاستخدام، والإعدادات (لمن له تبويب)، وتسجيل الخروج */
  const shellUserMenu = (active, u) => {
    const dark = uiTheme() === 'dark';
    const I = window.I18N || { lang: 'ar', LANGS: { ar: { name: 'العربية', dir: 'rtl' } } };
    const settings = SF.settingsTabs(u).some((t) => t !== 'trash');
    return `<span class="tb-um"><button type="button" class="tb-user" id="umDd" aria-haspopup="menu" aria-expanded="false" aria-controls="umMenu" title="قائمة الحساب"><span class="tb-av" aria-hidden="true">${esc((u.name || '?').trim().charAt(0))}</span><span class="tb-name"><b>${esc(u.name)}</b><small>${esc(u.title || u.roleLabel || '')}</small></span><span class="tb-chev" aria-hidden="true">${icon('chevron')}</span></button>
              <div class="co-menu um-menu" id="umMenu" role="menu" aria-label="قائمة الحساب" hidden>
                <a class="co-mi${active === '#/account' ? ' on' : ''}" role="menuitem" href="#/account">${icon('user')}<b>حسابي</b></a>
                <button type="button" class="co-mi" role="menuitemcheckbox" aria-checked="${dark}" data-uitheme><span class="um-ic">${icon(dark ? 'sun' : 'moon')}</span><b>الوضع الداكن</b><span class="um-sw" aria-hidden="true"></span></button>
                <div class="um-lang" role="group" aria-labelledby="umLangH"><div class="um-sec" id="umLangH">${icon('globe')}<span>اللغة</span></div>${Object.entries(
                  I.LANGS,
                )
                  .map(
                    ([k, L]) =>
                      `<button type="button" class="co-mi" role="menuitemradio" aria-checked="${I.lang === k}" data-lang="${k}" data-noi18n><b lang="${k}" dir="${L.dir}">${esc(L.name)}</b><span class="um-ck" aria-hidden="true">${icon('check')}</span></button>`,
                  )
                  .join('')}</div>
                ${can('guide') ? `<a class="co-mi${active === '#/guide' ? ' on' : ''}" role="menuitem" href="#/guide">${icon('help')}<b>دليل الاستخدام</b></a>` : ''}
                ${settings ? `<a class="co-mi${active === '#/settings' ? ' on' : ''}" role="menuitem" href="#/settings">${icon('settings')}<b>الإعدادات</b></a>` : ''}
                <button type="button" class="co-mi um-out" role="menuitem" id="logoutBtn">${icon('power')}<b>تسجيل الخروج</b></button>
              </div></span>`;
  };
  /* قائمة شركات المجموعة المنسدلة */
  const shellCoMenu = (
    active,
  ) => `<span class="tb-codd"><button type="button" class="tb-btn tb-co${active === '#/companies' ? ' on' : ''}" id="coDd" title="شركات المجموعة" aria-haspopup="true" aria-expanded="false">${icon('buildings')}<span>${active === '#/companies' ? 'كل الشركات' : esc(S.curCo().name || '')}</span>${icon('chevron')}</button>
              <div class="co-menu" id="coMenu" hidden><a class="co-mi all" href="#/group">${icon('grid')}<b>إدارة المجموعة</b></a><a class="co-mi all" href="#/companies">${icon('buildings')}<b>عرض شركات المجموعة</b></a>
                ${(state.group.companies || []).map((c) => `<button type="button" class="co-mi${c.id === state.group.current && active !== '#/companies' ? ' on' : ''}" data-coid="${c.id}"><img src="/api/group/logo/${c.id}?v=2" alt=""><b>${esc(c.name)}</b>${c.id === state.group.current ? '<span class="co-ck">✓</span>' : ''}</button>`).join('')}</div></span>`;
  /* اختصارات الشريط: التطبيقات، الدردشة، البريد (الرئيسية والتعاميم من التطبيقات) */
  const shellTopLinks = (
    active,
  ) => `<a class="tb-btn icon tb-apps${active === '#/apps' ? ' on' : ''}" href="#/apps" title="التطبيقات" aria-label="التطبيقات">${icon('grid')}</a>
            ${can('chat') ? `<a class="tb-btn icon${active === '#/chat' ? ' on' : ''}" href="#/chat" title="الدردشة الداخلية" aria-label="الدردشة الداخلية" data-chatbtn>${icon('message')}<span class="bell-n" hidden></span></a>` : ''}
            ${can('mail') ? `<a class="tb-btn icon${active === '#/mail' ? ' on' : ''}" href="#/mail" title="البريد الداخلي" aria-label="البريد الداخلي" data-mailbtn>${icon('mail')}<span class="bell-n" hidden></span></a>` : ''}`;
  /* تسجيل الخروج: تأكيد، ثم إنهاء الجلسة وإغلاق الدردشة والملاحظات */
  async function shellLogout() {
    if (!(await S.askYesNo('هل تريد تسجيل الخروج من النظام؟'))) return;
    try {
      await api('POST', '/api/logout', { pushEndpoint: await S.pushEndpoint() });
    } catch {
      /* تجاهل */
    }
    if (state.chatES) {
      state.chatES.close();
      state.chatES = null;
    }
    S.sn.list = null;
    S.snLayer().innerHTML = '';
    state.user = null;
    state.pushSynced = false;
    location.hash = '#/login';
  }
  /* أزرار الشريط العلوي: الإشعارات، عداد الدخول، الشركات، الوضع الداكن، اللغة */
  function shellTopWire() {
    $$('[data-bell]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        S.openNotif();
      };
    });
    $$('[data-logins]').forEach((b) => {
      b.onclick = () => S.loginStatsModal();
    });
    if ($('#coDd')) shellCoWire();
    if ($('#umDd')) shellUserWire();
    $$('[data-uitheme]').forEach((b) => {
      b.onclick = () => {
        const th = uiTheme() === 'dark' ? 'light' : 'dark';
        setUiTheme(th);
        b.querySelector('.um-ic').innerHTML = icon(th === 'dark' ? 'sun' : 'moon');
        b.setAttribute('aria-checked', String(th === 'dark'));
        api('PUT', '/api/me/ui-theme', { theme: th })
          .then(() => {
            state.user.uiTheme = th;
          })
          .catch(() => {
            /* يبقى محفوظاً على هذا الجهاز */
          });
      };
    });
    $$('[data-lang]').forEach((b) => {
      b.onclick = () => I18N.set(b.dataset.lang);
    });
  }
  /* قائمة الحساب: فتح وإغلاق بالزر، والإغلاق بالضغط خارجها أو Esc (ويعود التركيز للزر)، والأسهم للتنقل بين عناصرها */
  function shellUserWire() {
    const dd = $('#umDd'),
      menu = $('#umMenu');
    const items = () => $$('[role^="menuitem"]', menu);
    const open = (on) => {
      menu.hidden = !on;
      dd.setAttribute('aria-expanded', String(on));
      if (on) items()[0].focus();
    };
    dd.onclick = (e) => {
      e.stopPropagation();
      open(menu.hidden);
    };
    menu.onkeydown = (e) => {
      const list = items(),
        i = list.indexOf(document.activeElement);
      if (e.key === 'Escape') {
        open(false);
        dd.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus();
      }
    };
    /* الإغلاق بالضغط خارج القائمة: مستمع واحد للصفحة كلها (الشريط يُرسم من جديد مع كل صفحة) */
    if (!state.umCloser) {
      state.umCloser = true;
      document.addEventListener('click', (e) => {
        const m = document.getElementById('umMenu');
        if (m && !m.hidden && !e.target.closest('.tb-um')) {
          m.hidden = true;
          document.getElementById('umDd').setAttribute('aria-expanded', 'false');
        }
      });
    }
  }
  /* قائمة شركات المجموعة: فتح وإغلاق (خارجها أو Esc)، والتبديل لشركة */
  function shellCoWire() {
    const dd = $('#coDd'),
      menu = $('#coMenu');
    const close = () => {
      menu.hidden = true;
      dd.setAttribute('aria-expanded', 'false');
    };
    dd.onclick = (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      dd.setAttribute('aria-expanded', String(!menu.hidden));
    };
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.tb-codd')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    menu.onclick = (e) => {
      const b = e.target.closest('[data-coid]');
      if (!b) {
        close();
        return;
      }
      close();
      if (b.dataset.coid === state.group.current) location.hash = '#/apps';
      else S.switchCo(b.dataset.coid);
    };
  }
  /* محتوى «دليل الاستخدام»: public/js/guide-data.js وguide-en.js — تُمرَّر لهما أدوات app.js عند أول استخدام */
  const guide = () => (window.SES_GUIDE.use({ can, today, AN_TOOLS: S.AN_TOOLS, AN_CHAIN: S.AN_CHAIN }), window.SES_GUIDE);
  /* عداد الدخول على النظام (لصاحب صلاحية loginStats) — ثابت أسفل كل الصفحات ناحية اليمين، والضغط يفتح التفاصيل (shellTopWire)؛
   * notify.js يحدّث الأرقام [data-sl] أينما كانت */
  const loginsBox = (u) => {
    if (!SF.cap(u, 'loginStats')) return '';
    const l = (state.stats || {}).logins;
    const n = (k) => (l ? S.fmtNumAr(l[k]) : '…');
    return `<button type="button" class="ap-logins" data-logins title="عدد مرات الدخول على النظام — اضغط للتفاصيل"><span><b data-sl="total">${n('total')}</b><small>الدخول منذ إنشاء النظام</small></span><span><b data-sl="today">${n('today')}</b><small>الدخول اليوم</small></span></button>`;
  };
  Object.assign(S, { WIN_IC, winMax, winBar });
})((window.SES_APP = window.SES_APP || {}));
