'use strict';
/* صفحة «new-request» (viewNew) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['new-request'] = function (S) {
  const { $, $$, APP_TONES, NF_GROUP, NF_SECTIONS, SF, appHue, enabledForms, esc, icon, normAr, shell, state } = S;
  function viewNew() {
    /* رفع طلب جديد بنفس أيقونات التطبيقات: كل الخطابات في صفحة واحدة، عنوان لكل قسم وتحته عنوان لكل مجموعة بلونها
     * وأيقونتها ثم أيقونات خطاباتها؛ والبحث في كل النماذج، والعرض شبكة أو قائمة (نفس اختيار التطبيقات) */
    const groups = {};
    enabledForms().forEach((f) => {
      (groups[f.group] = groups[f.group] || []).push(f);
    });
    const secOf = (g) => (NF_SECTIONS.find(([, , , gs]) => gs.includes(g)) || NF_SECTIONS[NF_SECTIONS.length - 1])[0];
    const secs = NF_SECTIONS.map(([k, l, ic]) => ({ k, l, ic, gs: Object.keys(groups).filter((g) => secOf(g) === k) })).filter(
      (s) => s.gs.length,
    );
    const main = shell('', '#/new');
    const builder = SF.settingsTabs(state.user).includes('forms');
    const en = window.I18N && I18N.lang === 'en';
    viewNewPart3(builder, en, groups, main, secs);
  }
  /* جزء من viewNew: const qOf = (f) =>… */
  function viewNewPart3(builder, en, groups, main, secs) {
    const qOf = (f) =>
      normAr([f.title, typeof f.letterTitle === 'string' ? f.letterTitle : '', f.group, en ? I18N.tr(f.title) : ''].join(' '));
    const VK = `apps-view:${state.user.id}`;
    let view = 'grid';
    try {
      view = localStorage.getItem(VK) === 'list' ? 'list' : 'grid';
    } catch {
      /* تجاهل */
    }
    viewNewPart(builder, groups, main, qOf, secs);
    const q = $('#nfQ', main);
    /* تابات جوجل بمستويين: القسم ثم مجموعته (يُتذكران في الجلسة)، فتظهر خطابات مجموعة واحدة بلا تمرير طويل؛
     * والبحث يشمل كل الأقسام ويعرض النتائج بعناوين أقسامها ومجموعاتها */
    const mem = (k, v) => {
      try {
        if (v === undefined) return sessionStorage.getItem(k) || '';
        sessionStorage.setItem(k, v);
      } catch {
        /* تجاهل */
      }
      return '';
    };
    let tab = mem('nf:tab');
    if (!secs.some((s) => s.k === tab)) tab = secs.length ? secs[0].k : '';
    const subOf = (k) => {
      const s = secs.find((x) => x.k === k);
      const v = mem(`nf:sub:${k}`);
      return s && s.gs.includes(v) ? v : s ? s.gs[0] : '';
    };
    const wrap = $('.nf-wrap', main);
    const showTab = () => {
      const searching = !!q.value.trim();
      wrap.classList.toggle('searching', searching);
      $$('#nfTabs .gtab', main).forEach((t) => t.classList.toggle('on', !searching && t.dataset.tab === tab));
      if (searching) return;
      const sub = subOf(tab);
      $$('.nf-sec', main).forEach((s) => {
        s.hidden = s.dataset.sec !== tab;
      });
      $$('.nf-sec[data-sec="' + tab + '"] .nf-subtabs button', main).forEach((b) => b.classList.toggle('on', b.dataset.sub === sub));
      $$('.nf-sec[data-sec="' + tab + '"] .nf-gp', main).forEach((g) => {
        g.hidden = g.dataset.g !== sub;
      });
    };
    if ($('#nfTabs', main))
      $('#nfTabs', main).addEventListener('click', (e) => {
        const t = e.target.closest('[data-tab]');
        if (!t) return;
        e.preventDefault();
        tab = t.dataset.tab;
        mem('nf:tab', tab);
        q.value = '';
        q.dispatchEvent(new Event('input'));
      });
    main.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sub]');
      if (!b) return;
      mem(`nf:sub:${tab}`, b.dataset.sub);
      showTab();
    });
    const setView = (v) => {
      $$('.nf-grid', main).forEach((g) => g.classList.toggle('list', v === 'list'));
      $$('[data-vw]', main).forEach((b) => b.classList.toggle('on', b.dataset.vw === v));
      try {
        localStorage.setItem(VK, v);
      } catch {
        /* تجاهل */
      }
    };
    $$('[data-vw]', main).forEach((b) => {
      b.onclick = () => setView(b.dataset.vw);
    });
    setView(view);
    /* البحث في كل النماذج: كل كلمة لازم تظهر في اسم النموذج أو مجموعته، وتختفي المجموعات والأقسام الفارغة */
    viewNewPart2(main, q, showTab);
  }
  /* جزء من viewNew: q.addEventListener('input', () => {… */
  function viewNewPart2(main, q, showTab) {
    q.addEventListener('input', () => {
      const words = normAr(q.value).split(' ').filter(Boolean);
      let shown = 0;
      $$('.ap-t', main).forEach((a) => {
        const ok = words.every((w) => a.dataset.s.includes(w));
        a.hidden = !ok;
        if (ok) shown++;
      });
      $$('.nf-gp', main).forEach((g) => {
        g.hidden = !$$('.ap-t', g).some((a) => !a.hidden);
      });
      $$('.nf-sec', main).forEach((s) => {
        s.hidden = !$$('.nf-gp', s).some((g) => !g.hidden);
      });
      $('#nfNone', main).hidden = !words.length || shown > 0;
      showTab();
    });
    showTab();
    /* Enter: يفتح أول نتيجة */
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && q.value.trim()) {
        const first = $$('#nfAll .ap-t', main).find((a) => !a.hidden);
        if (first) location.hash = first.getAttribute('href');
      }
    });
    q.focus();
  }
  /* جزء من viewNew: let n = 0;… */
  function viewNewPart(builder, groups, main, qOf, secs) {
    let n = 0;
    const formTile = (f) => {
      const [a, c, d] = APP_TONES[n++ % APP_TONES.length],
        [ic] = NF_GROUP[f.group] || ['file'];
      return `<a class="ap-t" href="#/new/${f.id}" data-s="${esc(qOf(f))}" title="${esc(f.title)}"><span class="ap-g" style="--a:${a};--b:${c};--c:${d};--m:${appHue(f.id)}"><i class="ap-x"></i><i class="ap-y"></i>${icon(ic)}</span><span class="ap-l">${esc(f.title)}${f.needsValue ? '<small class="ap-d">تحديد القيمة من الإدارة المالية</small>' : ''}</span></a>`;
    };
    const sections = secs
      .map(
        (
          s,
        ) => `<section class="nf-sec" data-sec="${s.k}"><h2 class="nf-sh">${icon(s.ic)}${esc(s.l)}<small>${s.gs.reduce((k, g) => k + groups[g].length, 0)} نموذج</small></h2>
      ${
        s.gs.length > 1
          ? `<div class="nf-subtabs">${s.gs
              .map((g) => {
                const [gic, gc] = NF_GROUP[g] || ['file', '#64748b'];
                return `<button type="button" data-sub="${esc(g)}" style="--gc:${gc}">${icon(gic)}<span>${esc(g)}</span><small>${groups[g].length}</small></button>`;
              })
              .join('')}</div>`
          : ''
      }
      ${s.gs
        .map((g) => {
          const [gic, gc] = NF_GROUP[g] || ['file', '#64748b'];
          return `<div class="nf-gp" data-g="${esc(g)}" style="--gc:${gc}"><h3 class="nf-gh"><span>${icon(gic)}</span>${esc(g)}<small>${groups[g].length}</small></h3><div class="ap-grid nf-grid">${groups[g].map(formTile).join('')}</div></div>`;
        })
        .join('')}</section>`,
      )
      .join('');
    renderViewNew(builder, groups, main, secs, sections);
  }
  /* محتوى viewNew (HTML) */
  function renderViewNew(builder, groups, main, secs, sections) {
    main.innerHTML = `<div class="ap-wrap nf-wrap"><div class="ap-head"><div><h1>رفع طلب جديد</h1><div class="muted">اختر نوع الخطاب ثم املأ النموذج، وسيُرسل تلقائياً إلى أول معتمد في مسار الاعتماد</div></div>
        <div class="ap-tools"><input class="in ap-q" id="nfQ" type="search" placeholder="ابحث عن نوع الطلب... مثال: سكن، سلفة" autocomplete="off">
          <span class="ap-vw"><button type="button" data-vw="grid" title="عرض شبكة">${icon('grid')}</button><button type="button" data-vw="list" title="عرض قائمة تحت بعض">${icon('list')}</button></span>
          ${builder ? '<a class="btn" href="#/builder">🛠️ إنشاء نموذج</a>' : ''}</div></div>
      ${secs.length > 1 ? `<div class="gtabs nf-tabs" id="nfTabs">${secs.map((s) => `<a href="#" class="gtab" data-tab="${s.k}">${icon(s.ic)}<span>${esc(s.l)}</span><small>${s.gs.reduce((k, g) => k + groups[g].length, 0)}</small></a>`).join('')}</div>` : ''}
      ${secs.length ? `<div id="nfAll">${sections}</div>` : '<div class="empty">لا توجد نماذج متاحة</div>'}
      <div class="empty" id="nfNone" hidden>لا يوجد نموذج يطابق البحث</div><span class="muted" id="nfCount"></span></div>`;
  }

  return { viewNew };
};
