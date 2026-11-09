'use strict';
/* صفحة «apps» (viewApps) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['apps'] = function (S) {
  const { $, $$, APP_TONES, apStyle, apStyleApply, apStyleKey, api, appHue, esc, flatItems, icon, navItems, shell, state } = S;
  function viewApps(query = {}) {
    /* حالة الصفحة: ما يتغير بعد العرض (level، view، gsTimer، gsSeq) */
    const vs = {};
    const main = shell('', '#/apps');
    /* بترتيب القائمة وفي منتصف الصفحة: الصفحات أيقونات، وكل عنوان رئيسي أيقونة مجموعة تُفتح بأيقوناته الفرعية
     * (المسار في الرابط ?g=hr أو ?g=ops/traffic فيعمل زر الرجوع)؛ والعرض شبكة أو قائمة تحت بعض (يُحفظ اختيار المستخدم) */
    /* الإعدادات وحول الشركة وتطبيق الموبايل وحسابي آخر الأيقونات دائماً، وأي أيقونة جديدة تأتي قبلها */
    const AP_TAIL = ['#/settings', '#/about', '#/mobile-app', '#/account'];
    const root0 = navItems().filter((it) => !(Array.isArray(it) && it[0] === '#/apps'));
    const tailOf = (it) => (Array.isArray(it) ? AP_TAIL.indexOf(it[0]) : -1);
    return viewAppsPart5(main, query, root0, tailOf, vs);
  }
  /* جزء من viewApps: const root = [...root0.filter((it) => tailOf(it) <… */
  function viewAppsPart5(main, query, root0, tailOf, vs) {
    const root = [...root0.filter((it) => tailOf(it) < 0), ...root0.filter((it) => tailOf(it) >= 0).sort((a, b) => tailOf(a) - tailOf(b))];
    return viewAppsPart1(main, query, root, vs);
  }
  /* جزء من viewAppsPart5: const path = String(query.g || '')… */
  function viewAppsPart1(main, query, root, vs) {
    const path = String(query.g || '')
      .split('/')
      .filter(Boolean);
    vs.level = root;
    const trail = [];
    for (const k of path) {
      const g = vs.level.find((it) => !Array.isArray(it) && it.group === k);
      if (!g) break;
      trail.push(g);
      vs.level = g.items;
    }
    const VK = `apps-view:${state.user.id}`;
    vs.view = 'grid';
    try {
      vs.view = localStorage.getItem(VK) === 'list' ? 'list' : 'grid';
    } catch {
      /* تجاهل */
    }
    const sum = (g) => flatItems(g.items).reduce((a, it) => a + (Number(it[3]) || 0), 0);
    const tile = (it, n) => {
      const [a, c, d] = APP_TONES[n % APP_TONES.length];
      const grp = !Array.isArray(it),
        b = grp ? sum(it) : it[3];
      const href = grp ? `#/apps?g=${[...trail.map((x) => x.group), it.group].join('/')}` : it[0];
      const label = grp ? it.title : it[2],
        ic = grp ? it.ic : it[1];
      return `<a class="ap-t${grp ? ' grp' : ''}" href="${href}" data-s="${esc(label)}"><span class="ap-g" style="--a:${a};--b:${c};--c:${d};--m:${appHue(grp ? it.group : it[0])}"><i class="ap-x"></i><i class="ap-y"></i>${ic}</span><span class="ap-l">${esc(label)}${grp ? `<small>${flatItems(it.items).length} صفحة</small>` : ''}</span>${b ? `<span class="ap-b">${b > 99 ? '99+' : b}</span>` : ''}</a>`;
    };
    viewAppsPart2(vs.level, main, tile, trail);
    const grid = $('#apGrid', main);
    const setView = (v) => {
      vs.view = v;
      grid.classList.toggle('list', v === 'list');
      $$('[data-vw]', main).forEach((b) => b.classList.toggle('on', b.dataset.vw === v));
      try {
        localStorage.setItem(VK, v);
      } catch {
        /* تجاهل */
      }
    };
    wireApps(grid, main, setView, trail, vs.view);
    const levelHtml = grid.innerHTML,
      allHtml = flatItems(root).map(tile).join('');
    /* Global Search: الصفحات المطابقة فوراً، ثم نتائج النظام (الطلبات والموظفين وCRM وCONTACTS والمهام والأحداث) من الخادم */
    const GS_IC = { req: 'file', emp: 'users', crm: 'handshake', contact: 'phone', todo: 'checkCircle', cal: 'calendar' };
    const res = $('#gsRes', main);
    vs.gsTimer = null;
    vs.gsSeq = 0;
    const gsRun = async (q) => {
      const seq = ++vs.gsSeq;
      if (q.length < 2) {
        res.hidden = true;
        res.innerHTML = '';
        return;
      }
      res.hidden = false;
      res.innerHTML = '<div class="muted gs-wait">جاري البحث في النظام...</div>';
      let d;
      try {
        d = await api('GET', `/api/search?q=${encodeURIComponent(q)}`);
      } catch (err) {
        if (seq === vs.gsSeq) res.innerHTML = `<div class="err">${esc(err.message)}</div>`;
        return;
      }
      if (seq !== vs.gsSeq) return;
      const pages = $$('.ap-t', grid).filter((x) => !x.hidden).length;
      res.innerHTML = d.groups.length
        ? d.groups
            .map(
              (
                g,
              ) => `<section class="gs-g"><h3>${icon(GS_IC[g.k] || 'search')}${esc(g.title)}<small>${g.total > g.items.length ? `أول ${g.items.length} من ${g.total}` : g.total}</small></h3>
        <div class="gs-list">${g.items.map((x) => `<a class="gs-i" href="${esc(x.h)}"><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</a>`).join('')}</div></section>`,
            )
            .join('')
        : `<div class="empty">${pages ? 'لا توجد نتائج أخرى في النظام' : `لا توجد نتائج لـ «${esc(q)}»`}</div>`;
    };
    return viewAppsPart4(allHtml, grid, gsRun, levelHtml, main, query, res, vs);
  }
  /* جزء من viewApps: const apQ = $('#gcQ');… */
  function viewAppsPart4(allHtml, grid, gsRun, levelHtml, main, query, res, vs) {
    const apQ = $('#gcQ');
    apQ.oninput = () => {
      const q = apQ.value.trim();
      grid.innerHTML = q ? allHtml : levelHtml;
      if (q)
        $$('.ap-t', grid).forEach((x) => {
          x.hidden = !x.dataset.s.includes(q);
        });
      grid.hidden = !!q && !$$('.ap-t', grid).some((x) => !x.hidden);
      clearTimeout(vs.gsTimer);
      vs.gsTimer = setTimeout(() => gsRun(q), 300);
      /* البحث يبقى عند الرجوع للصفحة */
      try {
        history.replaceState(
          null,
          '',
          q
            ? `#/apps?${new URLSearchParams({ ...(query.g ? { g: query.g } : {}), q })}`
            : `#/apps${query.g ? `?g=${encodeURIComponent(query.g)}` : ''}`,
        );
      } catch {
        /* تجاهل */
      }
    };
    /* Enter: يفتح أول نتيجة (صفحة أو عنصر) */
    viewAppsPart3(apQ, grid, res);
    /* أربعة صفوف فقط: ما يزيد يذهب لصفحة جانبية تُسحب أفقياً (مثل شاشة الموبايل)، مع نقاط للتنقل */
    const pager = () => {
      $$('.ap-dots, .ap-arrow', main).forEach((x) => x.remove());
      grid.classList.remove('paged');
      grid.onwheel = grid.onpointerdown = grid.onpointermove = grid.onpointerup = grid.onkeydown = grid.onscroll = null;
      if (vs.view === 'list' || apQ.value.trim()) return;
      const tiles = $$('.ap-t', grid);
      const tw = window.innerWidth <= 560 ? 96 : 116,
        gap = 12;
      const cols = Math.max(3, Math.min(8, Math.floor((grid.clientWidth + gap) / (tw + gap))));
      const per = cols * 4;
      /* الصفوف المرسومة فعلاً (فواصل الصفوف قد تزيدها عن العدد المتوقع) */
      const rowsNow = new Set(tiles.filter((t) => !t.hidden).map((t) => Math.round(t.getBoundingClientRect().top))).size;
      if (tiles.length <= per && rowsNow <= 4) return;
      /* عند وجود أكثر من صفحة تُترك مساحة للسهمين على الجانبين */
      const multi = tiles.length > per;
      const colsP = multi ? Math.max(3, Math.min(8, Math.floor((grid.clientWidth - 92 + gap) / (tw + gap)))) : cols;
      const perP = colsP * 4;
      const pages = [];
      for (let i = 0; i < tiles.length; i += perP) pages.push(tiles.slice(i, i + perP));
      grid.style.setProperty('--cols', colsP);
      grid.classList.toggle('multi', pages.length > 1);
      grid.innerHTML = pages.map((pg) => `<div class="ap-page">${pg.map((t) => t.outerHTML).join('')}</div>`).join('');
      grid.classList.add('paged');
      const pgEls = $$('.ap-page', grid);
      /* صفحة واحدة (الصفوف أُعيد ترتيبها في 4 صفوف): بدون نقاط ولا أسهم */
      if (pages.length < 2) return;
      /* النقاط بعدد الصفحات، وسهمان على الجانبين (الواجهة من اليمين: السهم الأيمن = السابقة، والأيسر = التالية) */
      grid.insertAdjacentHTML(
        'afterend',
        `<div class="ap-dots" role="tablist">${pages.map((_, i) => `<button type="button" role="tab" aria-label="الصفحة ${i + 1} من ${pages.length}" data-pg="${i}"${i ? '' : ' class="on"'}></button>`).join('')}</div>`,
      );
      const host = grid.parentElement;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      const gTop = grid.offsetTop + grid.offsetHeight / 2;
      return pagerPart(gTop, grid, host, main, pgEls);
    };
    return viewAppsPart(apQ, grid, levelHtml, main, pager);
  }
  /* جزء من viewApps: apQ.onkeydown = (e) => {… */
  function viewAppsPart3(apQ, grid, res) {
    apQ.onkeydown = (e) => {
      if (e.key !== 'Enter') return;
      const first = $$('.ap-t', grid).find((x) => !x.hidden) || $('.gs-i', res);
      if (first) location.hash = first.getAttribute('href');
    };
    if (apQ.value) apQ.oninput();
  }
  /* جزء من viewApps: const crumbs = trail.length… */
  function viewAppsPart2(level, main, tile, trail) {
    const crumbs = trail.length
      ? `<div class="ap-backrow"><a class="btn sm ap-back" href="#/apps${
          trail.length > 1
            ? `?g=${trail
                .slice(0, -1)
                .map((x) => x.group)
                .join('/')}`
            : ''
        }">→ رجوع</a></div>`
      : '';
    const cur = trail[trail.length - 1];
    renderViewApps(crumbs, cur, level, main, tile);
  }
  /* جزء من viewApps: const repage = () => {… */
  function viewAppsPart(apQ, grid, levelHtml, main, pager) {
    const repage = () => {
      if (!apQ.value.trim()) {
        grid.innerHTML = levelHtml;
        pager();
      }
    };
    const baseInput = apQ.oninput;
    apQ.oninput = () => {
      baseInput();
      if (!apQ.value.trim()) pager();
      else {
        grid.classList.remove('paged');
        $$('.ap-dots', main).forEach((x) => x.remove());
      }
    };
    $$('[data-vw]', main).forEach((b) => b.addEventListener('click', repage));
    let rzT = 0;
    const onRz = () => {
      if (!document.body.contains(grid)) {
        window.removeEventListener('resize', onRz);
        return;
      }
      clearTimeout(rzT);
      rzT = setTimeout(repage, 150);
    };
    window.addEventListener('resize', onRz);
    pager();
    apQ.focus();
  }
  /* أحداث viewApps */
  function wireApps(grid, main, setView, trail, view) {
    $$('[data-vw]', main).forEach((b) => {
      b.onclick = () => setView(b.dataset.vw);
    });
    setView(view);
    const markSt = () => $$('[data-st]', main).forEach((b) => b.classList.toggle('on', b.dataset.st === apStyle()));
    $$('[data-st]', main).forEach((b) => {
      b.onclick = () => {
        try {
          localStorage.setItem(apStyleKey(), b.dataset.st);
        } catch {
          /* تجاهل */
        }
        apStyleApply();
        markSt();
      };
    });
    markSt();
    /* البحث في كل الصفحات مهما كان مستواها */
    /* صفوف صفحة التطبيقات (المستوى الأعلى): كل صف يبدأ بأول أيقونة ظاهرة من مجموعته */
    const AP_ROWS = [
      ['#/marketing', '#/crm', '#/tenders', '#/projects', '#/procurement', 'quality', 'legal', '#/docs'],
      ['requests', '#/tasks', '#/calendar', '#/contacts', '#/todo', '#/notes', '#/reports', '#/trash'],
      ['#/settings', '#/access-requests', '#/decision-center', '#/about', '#/mobile-app', '#/account', 'me'],
    ];
    if (!trail.length)
      AP_ROWS.forEach((row) => {
        const t = row.map((h) => grid.querySelector(`.ap-t[href="${h.startsWith('#') ? h : `#/apps?g=${h}`}"]`)).find(Boolean);
        if (t && t.previousElementSibling) t.insertAdjacentHTML('beforebegin', '<i class="ap-br"></i>');
      });
  }
  /* محتوى viewApps (HTML) */
  function renderViewApps(crumbs, cur, level, main, tile) {
    main.innerHTML = `<div class="ap-wrap"><div class="ap-head"><div><h1>${cur ? esc(cur.title) : 'التطبيقات'}</h1><div class="muted">${cur ? 'اختر الصفحة' : `أهلاً ${esc(state.user.name.split(' ')[0])} — اختر ما تريد العمل عليه`}</div></div>
        <div class="ap-tools">
          <span class="ap-vw ap-st" title="شكل الأيقونات"><button type="button" data-st="modern" title="الشكل الحديث">${window.I18N && I18N.lang === 'en' ? 'Modern' : 'حديث'}</button><button type="button" data-st="classic" title="الشكل الأصلي">${window.I18N && I18N.lang === 'en' ? 'Original' : 'الأصلي'}</button></span>
          <span class="ap-vw"><button type="button" data-vw="grid" title="عرض شبكة">${icon('grid')}</button><button type="button" data-vw="list" title="عرض قائمة تحت بعض">${icon('list')}</button></span></div></div>
      ${crumbs}<div class="ap-grid" id="apGrid">${level.map(tile).join('')}</div><div id="gsRes" class="gs-res" hidden></div></div>`;
  }
  /* جزء من pager: host.insertAdjacentHTML(… */
  function pagerPart(gTop, grid, host, main, pgEls) {
    host.insertAdjacentHTML(
      'beforeend',
      `<button type="button" class="ap-arrow prev" style="top:${gTop}px" aria-label="الصفحة السابقة" title="الصفحة السابقة"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button><button type="button" class="ap-arrow next" style="top:${gTop}px" aria-label="الصفحة التالية" title="الصفحة التالية"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>`,
    );
    const dots = $$('.ap-dots button', main);
    const prevB = $('.ap-arrow.prev', host),
      nextB = $('.ap-arrow.next', host);
    const cur = () => Math.round(Math.abs(grid.scrollLeft) / grid.clientWidth);
    const goPg = (i) => {
      const k = Math.max(0, Math.min(pgEls.length - 1, i));
      pgEls[k].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    };
    const mark = () => {
      const i = cur();
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      prevB.disabled = i <= 0;
      nextB.disabled = i >= pgEls.length - 1;
    };
    dots.forEach((d) => {
      d.onclick = () => goPg(Number(d.dataset.pg));
    });
    prevB.onclick = () => goPg(cur() - 1);
    nextB.onclick = () => goPg(cur() + 1);
    grid.onscroll = mark;
    mark();
    /* الكمبيوتر: عجلة الماوس تقلّب الصفحات، والسحب بالماوس، وأسهم لوحة المفاتيح */
    let wheelLock = 0;
    grid.onwheel = (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 8) return;
      const i = cur(),
        next = i + (d > 0 ? 1 : -1);
      if (next < 0 || next >= pgEls.length) return;
      e.preventDefault();
      if (Date.now() < wheelLock) return;
      wheelLock = Date.now() + 450;
      goPg(next);
    };
    let drag = null;
    grid.onpointerdown = (e) => {
      if (e.pointerType === 'mouse' && e.button === 0) drag = { x: e.clientX, i: cur(), moved: false };
    };
    grid.onpointermove = (e) => {
      if (drag && Math.abs(e.clientX - drag.x) > 10) drag.moved = true;
    };
    grid.onpointerup = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x,
        st = drag;
      drag = null;
      /* الواجهة من اليمين لليسار: السحب لليسار = الصفحة التالية */
      if (Math.abs(dx) > 50) {
        goPg(st.i + (dx < 0 ? 1 : -1));
        grid.dataset.dragged = '1';
        setTimeout(() => {
          delete grid.dataset.dragged;
        }, 0);
      }
    };
    if (!grid.dataset.clickGuard) {
      grid.dataset.clickGuard = '1';
      grid.addEventListener(
        'click',
        (e) => {
          if (grid.dataset.dragged) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true,
      );
    }
    grid.ondragstart = (e) => e.preventDefault();
    grid.tabIndex = -1;
    grid.onkeydown = (e) => {
      if (e.key === 'ArrowLeft') goPg(cur() + 1);
      else if (e.key === 'ArrowRight') goPg(cur() - 1);
    };
  }

  return { viewApps };
};
