/* إطار الصفحة: النوافذ (تصغير/تكبير/إغلاق) والهيكل العام shell */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, $$, app, state, today, can, api, icon, navItems, navFlat, navLink, navGroup, navCrumb } = S;
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
  const sideHidden = () => {
    try {
      return !!localStorage.getItem(`side-off:${(state.user || {}).id}`);
    } catch {
      return false;
    }
  };
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
    app.innerHTML = `
      <div class="mobile-bar"><b>${esc(state.config.appName)}</b><button id="menuBtn" aria-label="القائمة">${icon('menu')}</button></div>
      <div class="shell${sideHidden() ? ' side-off' : ''}">
        <button type="button" class="side-open" id="sideOpen" title="إظهار القائمة" aria-label="إظهار القائمة">${icon('chevron')}</button>
        <aside class="side" id="side">
          <button type="button" class="side-fold" id="sideFold" title="طي القائمة" aria-label="طي القائمة">${icon('chevron')}</button>
          <div class="brand"><img class="brand-logo" src="logo.png?co=${esc((state.group || {}).current || '')}&v=2" alt="" data-rmerr><div><b>${esc(state.config.appName)}</b><small>${esc(S.curCo().name || state.config.orgName)}</small></div></div>
          <nav class="nav">${navItems()
            .map((it) => (Array.isArray(it) ? navLink(it, active) : navGroup(it, active)))
            .join('')}</nav>
          ${SF.cap(u, 'loginStats') ? `<button type="button" class="side-logins" data-logins title="عدد مرات الدخول على النظام — اضغط للتفاصيل"><span><b data-sl="total">${state.stats && state.stats.logins ? S.fmtNumAr(state.stats.logins.total) : '…'}</b><small>الدخول منذ إنشاء النظام</small></span><span><b data-sl="today">${state.stats && state.stats.logins ? S.fmtNumAr(state.stats.logins.today) : '…'}</b><small>الدخول اليوم</small></span></button>` : ''}
          <div class="side-foot"><b>${esc(u.name)}</b>${esc(u.title || u.roleLabel)}${u.branch ? `<span class="side-br">${icon('branch')} فرع ${esc(u.branch)}</span>` : ''}</div>
        </aside>
        <div class="main-col">
          <!-- الشريط العلوي الثابت: (من اليسار) اسم المستخدم، الإشعارات، دليل الاستخدام -->
          <header class="topbar">
            ${S.occChip()}
            <button class="tb-btn lang-btn" data-lang title="${window.I18N && I18N.lang === 'en' ? 'العربية' : 'English'}">${window.I18N && I18N.lang === 'en' ? 'ع' : 'EN'}</button>
            <button class="tb-btn icon" data-uitheme title="${uiTheme() === 'dark' ? 'الوضع العادي' : 'الوضع الداكن'}" aria-label="تبديل الوضع الداكن">${icon(uiTheme() === 'dark' ? 'sun' : 'moon')}</button>
            ${can('guide') ? `<a class="tb-btn icon${active === '#/guide' ? ' on' : ''}" href="#/guide" title="دليل الاستخدام" aria-label="دليل الاستخدام">${icon('guide')}</a>` : ''}
            ${
              S.multiCo()
                ? `<span class="tb-codd"><button type="button" class="tb-btn tb-co${active === '#/companies' ? ' on' : ''}" id="coDd" title="شركات المجموعة" aria-haspopup="true" aria-expanded="false">${icon('buildings')}<span>${active === '#/companies' ? 'كل الشركات' : esc(S.curCo().name || '')}</span>${icon('chevron')}</button>
              <div class="co-menu" id="coMenu" hidden><a class="co-mi all" href="#/group">${icon('grid')}<b>إدارة المجموعة</b></a><a class="co-mi all" href="#/companies">${icon('buildings')}<b>عرض شركات المجموعة</b></a>
                ${(state.group.companies || []).map((c) => `<button type="button" class="co-mi${c.id === state.group.current && active !== '#/companies' ? ' on' : ''}" data-coid="${c.id}"><img src="/api/group/logo/${c.id}?v=2" alt=""><b>${esc(c.name)}</b>${c.id === state.group.current ? '<span class="co-ck">✓</span>' : ''}</button>`).join('')}</div></span>`
                : ''
            }
            <a class="tb-btn icon tb-apps${active === '#/apps' ? ' on' : ''}" href="#/apps" title="التطبيقات" aria-label="التطبيقات">${icon('grid')}</a>
            ${navFlat().some(([h]) => h === '#/') ? `<a class="tb-btn icon${active === '#/' ? ' on' : ''}" href="#/" title="الرئيسية" aria-label="الرئيسية">${icon('home')}</a>` : ''}
            ${can('notices') ? `<a class="tb-btn icon${active === '#/notices' ? ' on' : ''}" href="#/notices" title="مركز التعاميم" aria-label="مركز التعاميم" data-noticebtn>${icon('megaphone')}<span class="bell-n" hidden></span></a>` : ''}
            ${can('chat') ? `<a class="tb-btn icon${active === '#/chat' ? ' on' : ''}" href="#/chat" title="الدردشة الداخلية" aria-label="الدردشة الداخلية" data-chatbtn>${icon('message')}<span class="bell-n" hidden></span></a>` : ''}
            ${can('mail') ? `<a class="tb-btn icon${active === '#/mail' ? ' on' : ''}" href="#/mail" title="البريد الداخلي" aria-label="البريد الداخلي" data-mailbtn>${icon('mail')}<span class="bell-n" hidden></span></a>` : ''}
            <button class="tb-btn bell" data-bell aria-label="الإشعارات" title="الإشعارات">${icon('bell')}<span class="bell-n" hidden></span></button>
            <span class="tb-sep"></span>
            <button class="tb-btn icon" id="logoutBtn" title="تسجيل الخروج" aria-label="تسجيل الخروج">${icon('power')}</button>
            ${SF.settingsTabs(u).some((t) => t !== 'trash') ? `<a class="tb-btn icon${active === '#/settings' ? ' on' : ''}" href="#/settings" title="الإعدادات" aria-label="الإعدادات">${icon('settings')}</a>` : ''}
            ${u.acting || (u.positions || []).length ? `<button type="button" class="tb-pos${u.acting ? ' on' : ''}" data-posw title="التبديل بين المنصب وحسابك الشخصي">${icon('rotate')}<span><small>${u.acting ? 'تعمل بصفة' : 'حسابك الشخصي'}</small><b>${esc(u.acting ? u.acting.name : (u.positions[0] || {}).name || '')}</b></span></button>` : ''}
            <a class="tb-user" href="#/account" title="حسابي"><span class="tb-av">${esc((u.name || '?').trim().charAt(0))}</span><span class="tb-name"><b>${esc(u.name)}</b><small>${esc(u.title || u.roleLabel || '')}</small></span></a>
          </header>
          ${navCrumb(active)}
          <main class="main" id="main">${content}</main>
        </div>
      </div>`;
    $('#logoutBtn').onclick = async () => {
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
    };
    $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
    S.snBind();
    /* طي القائمة الجانبية وإظهارها (يُتذكر لكل مستخدم على جهازه) */
    const fold = (off) => {
      $('.shell').classList.toggle('side-off', off);
      try {
        localStorage.setItem(`side-off:${u.id}`, off ? '1' : '');
      } catch {
        /* تجاهل */
      }
    };
    $('#sideFold').onclick = () => fold(true);
    $('#sideOpen').onclick = () => fold(false);
    /* الجوال والتابلت: الضغط خارج القائمة الجانبية يغلقها */
    if (!state.sideCloser) {
      state.sideCloser = true;
      document.addEventListener('click', (e) => {
        const sd = document.getElementById('side');
        if (sd && sd.classList.contains('open') && !sd.contains(e.target) && !e.target.closest('#menuBtn')) sd.classList.remove('open');
      });
    }
    /* تمرير القائمة الجانبية يبقى كما هو عند التنقل بين الصفحات، والصفحة الحالية تظهر دائماً */
    const navEl = $('#side .nav');
    if (navEl) {
      navEl.scrollTop = state.navScroll || 0;
      navEl.addEventListener(
        'scroll',
        () => {
          state.navScroll = navEl.scrollTop;
        },
        { passive: true },
      );
      const on = $('a.on', navEl);
      if (on) {
        const r = on.getBoundingClientRect(),
          nr = navEl.getBoundingClientRect();
        if (r.top < nr.top || r.bottom > nr.bottom) on.scrollIntoView({ block: 'nearest' });
      }
    }
    /* فتح عنوان يقفل العناوين الأخرى في نفس المستوى */
    $$('.nav-grp-h').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const g = b.parentElement,
          open = !g.classList.contains('open');
        if (open)
          [...g.parentElement.children]
            .filter((x) => x !== g && x.classList.contains('nav-grp'))
            .forEach((x) => {
              x.classList.remove('open');
              $$('.nav-grp', x).forEach((y) => y.classList.remove('open'));
            });
        g.classList.toggle('open', open);
        state.navOpen = new Set($$('.nav-grp.open').map((x) => x.dataset.grp));
      };
    });
    $$('[data-bell]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        S.openNotif();
      };
    });
    $$('[data-logins]').forEach((b) => {
      b.onclick = () => S.loginStatsModal();
    });
    /* قائمة شركات المجموعة المنسدلة */
    if ($('#coDd')) {
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
    $$('[data-uitheme]').forEach((b) => {
      b.onclick = () => {
        const th = uiTheme() === 'dark' ? 'light' : 'dark';
        setUiTheme(th);
        b.innerHTML = icon(th === 'dark' ? 'sun' : 'moon');
        b.title = th === 'dark' ? 'الوضع العادي' : 'الوضع الداكن';
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
      b.onclick = () => I18N.set(I18N.lang === 'en' ? 'ar' : 'en');
    });
    S.bindPersonal();
    S.loadPersonal();
    S.setBell((state.stats || {}).notif || 0);
    S.setTopBadges();
    if ($('#notifPanel')) $('#notifPanel').remove();
    return $('#main');
  }
  /* محتوى «دليل الاستخدام»: public/js/guide-data.js وguide-en.js — تُمرَّر لهما أدوات app.js عند أول استخدام */
  const guide = () => (window.SES_GUIDE.use({ can, today, AN_TOOLS: S.AN_TOOLS, AN_CHAIN: S.AN_CHAIN }), window.SES_GUIDE);
  Object.assign(S, { WIN_IC, winMax, winBar });
})((window.SES_APP = window.SES_APP || {}));
