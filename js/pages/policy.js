'use strict';
/* صفحة «policy» (viewPolicyGate، viewMobileApp، viewPolicy، viewGuide) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['policy'] = function (S) {
  const {
    $,
    $$,
    GUIDE,
    GUIDE_CATS,
    GUIDE_EN,
    GUIDE_META,
    POLICY,
    SF,
    api,
    app,
    can,
    chip,
    esc,
    head,
    icon,
    isAdmin,
    multiCo,
    navFlat,
    normAr,
    route,
    shell,
    state,
    toast,
  } = S;
  /* شاشة الموافقة على سياسة الاستخدام (بدون القائمة، لا يكمل المستخدم إلا بالموافقة أو تسجيل الخروج) */
  function viewPolicyGate() {
    const en = window.I18N && I18N.lang === 'en';
    const list = en ? POLICY.en : POLICY.ar;
    const upd = !!state.user.policyVer;
    app.innerHTML = `<div class="pol-gate"><div class="pol-box card">
      <div class="pol-head"><img src="logo.png?co=${esc((state.group || {}).current || '')}&v=2" alt="" data-rmerr><div><h2>${en ? 'Acceptable use policy' : 'سياسة الاستخدام'}</h2>
        <small>${en ? `Version ${POLICY.ver} — effective ${SF.fmtDate(POLICY.date)}` : `الإصدار ${POLICY.ver} — نافذة من ${SF.fmtDate(POLICY.date)}`}</small></div></div>
      <p class="pol-intro">${upd ? (en ? 'The acceptable use policy has been updated. Please read it and accept to continue.' : 'تم تحديث سياسة الاستخدام. يرجى قراءتها والموافقة عليها للمتابعة.') : en ? `Welcome ${esc(state.user.name)}. Please read the acceptable use policy and accept it before using the system.` : `مرحباً ${esc(state.user.name)}، يرجى قراءة سياسة الاستخدام والموافقة عليها قبل استخدام النظام.`}</p>
      <div class="policy pol-scroll" data-noi18n>${list.map(([t, b]) => `<section class="pol-sec"><h3>${t}</h3>${b}</section>`).join('')}</div>
      <label class="check pol-ok"><input type="checkbox" id="polChk"> ${en ? 'I have read the acceptable use policy and agree to comply with it' : 'قرأت سياسة الاستخدام وأوافق على الالتزام بها'}</label>
      <div class="pol-err"></div>
      <div class="row pol-acts"><button class="btn primary" id="polAgree" disabled>${en ? 'I agree' : 'أوافق'}</button><button class="btn ghost" id="polOut">${en ? 'Log out' : 'تسجيل الخروج'}</button></div>
    </div></div>`;
    $('#polChk').onchange = () => {
      $('#polAgree').disabled = !$('#polChk').checked;
    };
    $('#polAgree').onclick = async () => {
      $('#polAgree').disabled = true;
      try {
        await api('POST', '/api/me/policy', { ver: POLICY.ver });
        state.user.policyVer = POLICY.ver;
        route();
      } catch (err) {
        $('.pol-err').innerHTML = `<div class="err">${esc(err.message)}</div>`;
        $('#polAgree').disabled = false;
      }
    };
    $('#polOut').onclick = async () => {
      try {
        await api('POST', '/api/logout', {});
      } catch {
        /* تجاهل */
      }
      state.user = null;
      location.hash = '#/login';
      route();
    };
  }

  /* تطبيق الموبايل داخل النظام: نسخة الويب من التطبيق نفسه (public/mobile) في إطار جوال، مع رابط تحميل نسخة أندرويد.
   * الدخول من هنا لا يربط الحساب بجهاز (معاينة) */
  function viewMobileApp() {
    const main = shell('', '#/mobile-app');
    const srv = location.host;
    main.innerHTML = `${head('تطبيق الموبايل', 'عرض تطبيق SES كما يظهر على الجوال، وتحميله على أندرويد', '<button class="btn primary" data-mobpop>🗗 فتح في نافذة مستقلة</button>')}
      <div class="mob-wrap">
        <div class="mob-phone"><div class="mob-notch"></div><iframe src="/mobile/" title="تطبيق SES" class="mob-screen"></iframe></div>
        <div class="mob-side">
          <div class="card"><h3>جرّب التطبيق هنا</h3>
            <p class="muted" style="margin-top:0">هذه نسخة التطبيق نفسها تعمل داخل النظام. ادخل بحسابك، وتنقّل بين البصمة والرئيسية وحسابي كما على الجوال. الدخول من هنا لا يربط حسابك بجهاز.</p>
            <ul class="mob-list"><li>يملأ التطبيق عنوان الخادم تلقائياً: <b dir="ltr">${esc(srv)}</b></li><li>البصمة من هنا تستخدم موقع المتصفح، والأفضل تجربتها من الجوال.</li></ul>
            <div class="row" style="gap:8px"><button class="btn" id="mobReload">↻ إعادة تحميل التطبيق</button><button class="btn" data-mobpop>🗗 فتح في نافذة مستقلة</button></div></div>
          <div class="card"><h3>تحميل التطبيق على أندرويد</h3>
            <ol class="mob-list"><li>من جوال أندرويد على شبكة الشركة افتح الرابط في Chrome:<div class="mob-link" dir="ltr">http://${esc(srv)}/download/saden-erp.apk</div></li>
              <li>بعد التحميل اضغط الملف ← تثبيت (اسمح بالتثبيت من هذا المصدر إن طُلب).</li>
              <li>في التطبيق اكتب عنوان الخادم: <b dir="ltr">${esc(srv)}</b></li></ol>
            <a class="btn primary" href="/download/saden-erp.apk" download>⬇ تحميل ملف التطبيق (APK)</a></div>
          ${isAdmin() ? '<div class="card" id="mobRate"><h3>تقييمات التطبيق</h3><div class="muted">جاري التحميل...</div></div>' : ''}
        </div>
      </div>`;
    if (isAdmin())
      api('GET', '/api/app-rating/all')
        .then((r) => {
          const box = $('#mobRate');
          if (!box) return;
          const st = (n) => `<span class="rt-stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
          box.innerHTML = `<h3>تقييمات التطبيق</h3>${
            r.count
              ? `<div class="rt-sum"><div class="rt-avg"><b>${r.avg.toFixed(1)}</b>${st(Math.round(r.avg))}<small>${r.count} تقييم</small></div>
        <div class="rt-bars">${[5, 4, 3, 2, 1].map((n) => `<div><span>${n} ★</span><i style="--w:${r.count ? Math.round((r.dist[n - 1] / r.count) * 100) : 0}%"></i><small>${r.dist[n - 1]}</small></div>`).join('')}</div></div>
        <div class="rt-list">${r.list.map((x) => `<div class="rt-item"><div><b>${esc(x.name)}</b> ${st(x.stars)}<small class="muted"> · ${esc(SF.fmtDate(x.at))}${x.branch ? ` · ${esc(x.branch)}` : ''}${x.ver ? ` · v${esc(x.ver)}` : ''}</small></div>${x.comment ? `<p>${esc(x.comment)}</p>` : ''}</div>`).join('')}</div>`
              : '<div class="muted">لا توجد تقييمات بعد — يقيّم الموظف من التطبيق: حسابي ← قيّم التطبيق</div>'
          }`;
        })
        .catch(() => {});
    $('#mobReload').onclick = () => {
      const f = $('.mob-screen', main);
      f.src = '/mobile/';
    };
    /* نافذة مستقلة بمقاس الجوال (تبقى مفتوحة بجانب النظام) */
    $$('[data-mobpop]', main).forEach((b) => {
      b.onclick = () => {
        const w = 400,
          h = Math.min(860, screen.availHeight - 40),
          left = Math.max(0, screen.availWidth - w - 30);
        const win = window.open('/mobile/', 'sadenMobileApp', `popup=yes,width=${w},height=${h},left=${left},top=20`);
        if (!win) toast('المتصفح منع فتح النافذة — اسمح بالنوافذ المنبثقة لهذا الموقع', true);
        else win.focus();
      };
    });
  }

  function viewPolicy() {
    const en = window.I18N && I18N.lang === 'en';
    const list = en ? POLICY.en : POLICY.ar;
    const main = shell('', '#/guide');
    main.innerHTML = `${head(en ? 'Acceptable use policy' : 'سياسة الاستخدام', en ? `Version ${POLICY.ver} — effective ${SF.fmtDate(POLICY.date)}` : `الإصدار ${POLICY.ver} — نافذة من ${SF.fmtDate(POLICY.date)}`, `<button class="btn" data-print>🖨️ ${en ? 'Print' : 'طباعة'}</button>`)}
      <div class="card policy" data-noi18n>${list.map(([t, b]) => `<section class="pol-sec"><h3>${t}</h3>${b}</section>`).join('')}</div>`;
  }

  /* ---------- دليل الاستخدام (مصوّر وحسب الصلاحيات) ----------
   * القسم يظهر إذا سمح له who(u) وكانت إحدى صفحاته (pages) في قائمة المستخدم، وتحته صور صفحاته التي يراها فقط.
   * الصور من public/img/guide (manifest.json) ويجددها: npm run guide:shots */
  const GUIDE_FALLBACK = ['ref', 'fileText', '#64748b'];
  const guideMeta = (g) => GUIDE_META[g.id] || GUIDE_FALLBACK;
  let guideShots = null;
  async function loadGuideShots() {
    if (guideShots) return guideShots;
    try {
      guideShots = await (await fetch('img/guide/manifest.json', { cache: 'no-cache' })).json();
    } catch {
      guideShots = { shots: {}, mobile: [] };
    }
    return guideShots;
  }
  /* صفحات المستخدم: قائمته الجانبية، والصفحات العامة، وإدارة المجموعة لأعضائها */
  function guidePages() {
    const titles = new Map(navFlat().map((it) => [String(it[0]).split('?')[0], String(it[2] || '')]));
    for (const h of ['#/', '#/account', '#/apps', '#/notifications', '#/guide']) if (!titles.has(h)) titles.set(h, '');
    if (multiCo()) ['#/group', '#/companies'].forEach((h) => titles.set(h, h === '#/group' ? 'إدارة المجموعة' : 'شركات المجموعة'));
    return titles;
  }
  /* أقسام المستخدم بترتيبها: الجديد والبداية أولاً ثم حسب التصنيف (والنص الإنجليزي عند اختياره) */
  function guideSections(u, pages, en) {
    const visible = (g) => g.who(u) && (g.id !== 'admin' || u.role === 'admin') && (!g.pages || g.pages.some((h) => pages.has(h)));
    const order = GUIDE_CATS.map(([k]) => k);
    const top = (g) => (g.id === 'news' ? 0 : g.id === 'start' ? 1 : 2);
    return GUIDE.filter(visible)
      .map((g) => (en && GUIDE_EN[g.id] ? { ...g, ic: GUIDE_EN[g.id][0], title: GUIDE_EN[g.id][1], body: GUIDE_EN[g.id][2] } : g))
      .sort((x, y) => top(x) - top(y) || order.indexOf(guideMeta(x)[0]) - order.indexOf(guideMeta(y)[0]));
  }
  const usedCats = (list) => GUIDE_CATS.filter(([k]) => list.some((g) => guideMeta(g)[0] === k));
  /* صور القسم: صفحاته التي يراها المستخدم ولها صورة، وصور الجوال في قسم تطبيق الجوال */
  function guideShotsHtml(g, man, pages) {
    const pics = (g.pages || [])
      .filter((h) => pages.has(h) && man.shots[h])
      .map(
        (h) =>
          `<figure class="gx-shot"><img loading="lazy" src="img/guide/${esc(man.shots[h])}" alt="${esc(pages.get(h))}"><figcaption>${icon('fileText')} ${esc(pages.get(h) || h)}</figcaption></figure>`,
      );
    const phones =
      g.id === 'mobile'
        ? (man.mobile || []).map(
            (m) =>
              `<figure class="gx-shot gx-phone"><img loading="lazy" src="img/guide/${esc(m.file)}" alt="${esc(m.cap)}"><figcaption>${esc(m.cap)}</figcaption></figure>`,
          )
        : [];
    const grid = (list, cls) => (list.length ? `<div class="gx-shots${cls}">${list.join('')}</div>` : '');
    return grid(pics, '') + grid(phones, ' phones');
  }
  function guideSectionHtml(g, man, pages) {
    const [cat, ic, c] = guideMeta(g);
    const plain = normAr(`${g.title} ${String(g.body).replace(/<[^>]+>/g, ' ')}`);
    return `<section class="gx-sec" id="g-${g.id}" data-cat="${cat}" data-s="${esc(plain)}" style="--c:${c}">
      <div class="gx-sec-h"><span class="gx-ic">${icon(ic)}</span><div><small>${esc((GUIDE_CATS.find(([k]) => k === cat) || [])[1] || '')}</small><h2>${esc(g.title)}</h2></div></div>
      <div class="gx-sec-b">${g.body}</div>${guideShotsHtml(g, man, pages)}</section>`;
  }
  function guideHeadHtml(list, man) {
    const at = man.at ? `<span>${icon('calendar')} صور الشاشات محدّثة في ${esc(SF.fmtDate(man.at.slice(0, 10)))}</span>` : '';
    return `<header class="gx-hero"><div class="gx-hero-t"><span class="gx-hero-ic gx-logo">${icon('guide')}</span><div><h1>دليل الاستخدام</h1><p>شرح مصوّر للنظام وتطبيق SES على الجوال، حسب صلاحياتك</p><div class="gx-meta"><span>${icon('bookOpen')} ${list.length} قسماً حسب صلاحياتك</span>${at}</div></div></div>
        <div class="gx-search">${icon('search')}<input id="gxQ" type="search" placeholder="ابحث في الدليل… مثال: سلفة، انتداب، رصيد الإجازة، بلاغ" autocomplete="off"><span id="gxN" class="muted"></span></div>
        <div class="gx-cats"><button type="button" class="on" data-gc="">الكل</button>${usedCats(list)
          .map(([k, l, ic]) => `<button type="button" data-gc="${k}">${icon(ic)} ${l}</button>`)
          .join('')}</div></header>`;
  }
  function guideNavHtml(list) {
    const tiles = list
      .map(
        (g) =>
          `<a href="javascript:void 0" class="gx-tile" data-gjump="${g.id}" data-cat="${guideMeta(g)[0]}" style="--c:${guideMeta(g)[2]}"><span class="gx-ic">${icon(guideMeta(g)[1])}</span><b>${esc(g.title)}</b></a>`,
      )
      .join('');
    const toc = usedCats(list)
      .map(
        ([k, l]) =>
          `<div class="gx-toc-g" data-cat="${k}"><small>${l}</small>${list
            .filter((g) => guideMeta(g)[0] === k)
            .map(
              (g) =>
                `<a href="javascript:void 0" data-gjump="${g.id}" data-toc="${g.id}" style="--c:${guideMeta(g)[2]}">${esc(g.title)}</a>`,
            )
            .join('')}</div>`,
      )
      .join('');
    return { tiles, toc };
  }
  /* تنسيق صور الدليل وتكبيرها (يُضاف مع الصفحة) */
  const GUIDE_CSS = `.gx-shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:14px}
.gx-shots.phones{grid-template-columns:repeat(auto-fill,minmax(170px,220px))}
.gx-shot{margin:0;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface-2);cursor:zoom-in}
.gx-shot img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;object-position:top}
.gx-phone img{aspect-ratio:390/844}.gx-phone{border-radius:24px;border:6px solid #1e293b}
.gx-shot figcaption{display:flex;align-items:center;gap:6px;padding:7px 10px;font-size:12.5px;color:var(--muted);border-top:1px solid var(--border)}
.gx-zoom{position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.82);display:grid;place-items:center;padding:24px;cursor:zoom-out}
.gx-zoom img{max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.4)}`;

  async function viewGuide() {
    const u = state.user;
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/guide');
    const man = await loadGuideShots();
    const pages = guidePages();
    const list = guideSections(u, pages, window.I18N && I18N.lang === 'en');
    const { tiles, toc } = guideNavHtml(list);
    main.innerHTML = `<div class="gx">${guideHeadHtml(list, man)}
      <div class="gx-grid">${tiles}</div>
      <div class="gx-layout"><nav class="gx-toc" aria-label="محتويات الدليل">${toc}</nav>
        <div class="gx-body">${list.map((g) => guideSectionHtml(g, man, pages)).join('')}<div id="gxEmpty" class="gx-empty" hidden>${icon('search')}<b>لا توجد نتائج</b><span>جرّب كلمة أخرى</span></div></div></div>
      <button type="button" class="gx-top" id="gxTop" title="لأعلى">${icon('chevron')}</button></div>
      <style>${GUIDE_CSS}</style>
      <style media="print">body * { visibility: hidden !important; } body::before { content: 'طباعة دليل الاستخدام وتحميله غير متاحين'; visibility: visible; display: block; padding: 40px; font: 700 20px Tajawal, sans-serif; text-align: center; }</style>`;
    hideForeignNews(main);
    bindGuide(main);
    guideRoutes();
  }
  /* روابط «الجديد» لصفحات أو أقسام لا يراها المستخدم تُحذف */
  function hideForeignNews(main) {
    const KEY = {
      '#/supervision': 'supervision',
      '#/governance': 'governance',
      '#/hse': 'hse',
      '#/analysis': 'analysis',
      '#/docs': 'docs',
      '#/employees': 'employees',
    };
    $$('.gx-news a', main).forEach((a) => {
      const h = a.getAttribute('href'),
        j = a.dataset.gjump;
      if ((KEY[h] && !can(KEY[h])) || (j && !$(`#g-${j}`, main))) a.remove();
    });
  }
  /* البحث والتصنيفات: يُخفي الأقسام غير المطابقة ومعها بطاقاتها وروابط الفهرس */
  function guideFilter(main, st) {
    const q = normAr($('#gxQ').value.trim());
    let n = 0;
    $$('.gx-sec', main).forEach((x) => {
      x.hidden = !((!st.cat || x.dataset.cat === st.cat) && (!q || x.dataset.s.includes(q)));
      if (!x.hidden) n++;
    });
    $$('.gx-tile', main).forEach((t) => (t.hidden = $(`#g-${t.dataset.gjump}`).hidden));
    $$('.gx-toc a', main).forEach((a) => (a.hidden = $(`#g-${a.dataset.toc}`).hidden));
    $$('.gx-toc-g', main).forEach((g) => (g.hidden = !$$('a', g).some((a) => !a.hidden)));
    $('#gxN').textContent = q || st.cat ? `${n} قسم` : '';
    $('#gxEmpty').hidden = !!n;
  }
  function bindGuide(main) {
    const st = { cat: '' };
    $('#gxQ').oninput = () => guideFilter(main, st);
    $$('[data-gc]', main).forEach((b2) => {
      b2.onclick = () => {
        st.cat = b2.dataset.gc;
        $$('[data-gc]', main).forEach((x) => x.classList.toggle('on', x === b2));
        guideFilter(main, st);
      };
    });
    main.addEventListener('click', (ev) => guideClick(ev, main, st));
    $('#gxTop').onclick = () => main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    observeToc(main);
  }
  /* الانتقال لقسم (ويُلغى البحث إن كان مخفياً)، وتكبير الصورة */
  function guideClick(ev, main, st) {
    const img = ev.target.closest('.gx-shot img');
    if (img) {
      const z = document.createElement('div');
      z.className = 'gx-zoom';
      z.innerHTML = `<img src="${esc(img.getAttribute('src'))}" alt="">`;
      z.onclick = () => z.remove();
      document.body.appendChild(z);
      return;
    }
    const j = ev.target.closest('[data-gjump]');
    const x = j && $(`#g-${j.dataset.gjump}`);
    if (!x) return;
    if (x.hidden) {
      st.cat = '';
      $('#gxQ').value = '';
      guideFilter(main, st);
    }
    x.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  /* الفهرس يتابع القسم الظاهر أثناء القراءة */
  function observeToc(main) {
    if (!('IntersectionObserver' in window)) return;
    const io2 = new IntersectionObserver(
      (ents) =>
        ents.forEach((e) => {
          if (e.isIntersecting) $$('.gx-toc a', main).forEach((a) => a.classList.toggle('on', a.dataset.toc === e.target.id.slice(2)));
        }),
      { rootMargin: '-20% 0px -70% 0px' },
    );
    $$('.gx-sec', main).forEach((x) => io2.observe(x));
  }

  async function guideRoutes() {
    const box = $('#gRoutes');
    if (!box) return;
    let list;
    try {
      list = await api('GET', '/api/guide/routes');
    } catch (err) {
      box.textContent = err.message;
      return;
    }
    const chip = (s, cls) =>
      `<span class="g-step${cls ? ` ${cls}` : ''}"><b>${esc(s.label)}</b>${s.name ? `<small>${esc(s.name)}</small>` : ''}${s.note ? `<small>${esc(s.note)}</small>` : ''}</span>`;
    const groups = [...new Set(list.map((f) => f.group))];
    box.className = '';
    box.innerHTML =
      groups
        .map(
          (g) => `<h4 class="g-grp">${esc(g)}</h4>
      ${list
        .filter((f) => f.group === g)
        .map(
          (f) => `<div class="g-route">
        <div class="g-route-t">${esc(f.title)}${f.attachments.length ? ` <small class="muted">— مرفقات مطلوبة: ${f.attachments.map(esc).join('، ')}</small>` : ''}</div>
        <div class="g-steps">${chip(f.starter || { label: 'محاسب الفرع', note: 'يرفع الطلب' }, 'start')}${f.flow.map((s) => chip(s, s.optional ? 'opt' : 'task')).join('')}${f.steps.map((s) => chip(s)).join('')}${chip({ label: 'اعتماد نهائي', note: 'طباعة وتحقق بالـ QR' }, 'end')}</div>
        ${f.custom ? '<div class="hint">لبعض المحاسبين مسار خاص لهذا الطلب يحدده مدير النظام.</div>' : ''}
      </div>`,
        )
        .join('')}`,
        )
        .join('') +
      '<div class="g-tip">💡 في أي مرحلة يمكن للمعتمد <b>إعادة</b> الطلب للمحاسب لتعديله (فيبدأ المسار من أوله بعد إعادة الإرسال) أو <b>رفضه</b> نهائياً. والمرحلة المتأخرة يصل صاحبها تذكير يومي.</div>';
  }

  return { viewPolicyGate, viewMobileApp, viewPolicy, viewGuide };
};
