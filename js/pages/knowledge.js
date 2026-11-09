'use strict';
/* صفحة «knowledge» (viewKnowledge) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['knowledge'] = function (S) {
  const { $, $$, APP_TONES, SF, api, appHue, askYesNo, dt, empEmpty, esc, head, icon, normAr, setCrumb, shell, toast, uploadFile } = S;
  /* ---------- مكتبة المهن: لكل مهنة مكتبة معرفة، ومهنة الموظف تظهر أولاً ---------- */
  async function viewKnowledge(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (d، body، kt) */
    const st = {};
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/knowledge');
    st.d = undefined;
    try {
      st.d = await api('GET', '/api/knowledge');
    } catch (err) {
      main.innerHTML = `<div class="card err">${esc(err.message)}</div>`;
      return;
    }
    const TI = {
      مقال: ['fileText', '#2563eb'],
      'دليل إجراءات': ['listChecks', '#0f766e'],
      'مرجع فني': ['bookOpen', '#7c3aed'],
      فيديو: ['monitor', '#dc2626'],
      ملف: ['paperclip', '#d97706'],
      نصيحة: ['bulb', '#ca8a04'],
      'سؤال وجواب': ['help', '#0891b2'],
    };
    const P = st.d.profs.find((p) => p.id === query.p);
    const ofProf = (p) => st.d.items.filter((x) => (x.profIds || []).includes(p.id));
    const ytId = (u) => {
      const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/.exec(u || '');
      return m ? m[1] : '';
    };
    const row = (x) => {
      const [ic, c] = TI[x.type] || TI['مقال'];
      return `<a href="javascript:void 0" class="kn-row" data-kitem="${x.id}" style="--c:${c}" data-s="${esc(normAr(`${x.title} ${x.body} ${x.tags || ''} ${x.type}`))}"><span class="kn-ic">${icon(ic)}</span><span class="kn-rt"><b>${x.pinned ? '📌 ' : ''}${esc(x.title)}</b><small>${esc(x.type)}${x.tags ? ` · ${esc(x.tags)}` : ''} · ${esc(SF.fmtDate(String(x.at).slice(0, 10)))}${(x.files || []).length ? ` · 📎 ${x.files.length}` : ''}${x.views ? ` · 👁 ${x.views}` : ''}</small>${x.body ? `<span class="kn-sn">${esc(x.body.replace(/\s+/g, ' ').slice(0, 140))}</span>` : ''}</span></a>`;
    };
    viewKnowledgePart3(P, TI, main, ofProf, row, st);
    const reload = () => viewKnowledge(query);
    /* البحث */
    viewKnowledgePart5(main, openItem, query, row, st);
    /* عرض المحتوى */
    function openItem(x) {
      if (!x) return;
      api('POST', `/api/knowledge/items/${x.id}/view`, {}).catch(() => {});
      const [ic, c] = TI[x.type] || TI['مقال'],
        yt = ytId(x.url);
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal kn-view" style="max-width:860px;width:96%;--c:${c}"><div class="kn-vh"><span class="kn-ic">${icon(ic)}</span><div><small>${esc(x.type)} · ${esc(
        st.d.profs
          .filter((p) => (x.profIds || []).includes(p.id))
          .map((p) => p.name)
          .join('، '),
      )}</small><h3>${esc(x.title)}</h3></div></div>
        ${yt ? `<div class="kn-video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" allowfullscreen loading="lazy" title="${esc(x.title)}"></iframe></div>` : ''}
        ${x.body ? `<div class="kn-body">${esc(x.body)}</div>` : ''}
        ${x.url && !yt ? `<a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">${icon('link')} فتح الرابط</a>` : ''}
        ${(x.files || []).length ? `<h4 class="b-sec">الملفات</h4><div class="kn-files">${x.files.map((f) => `<a href="/api/knowledge/items/${x.id}/files/${f.id}" target="_blank">${icon('paperclip')} ${esc(f.name)} <small>${Math.ceil((f.size || 0) / 1024)} KB</small></a>`).join('')}</div>` : ''}
        <div class="muted" style="font-size:12.5px;margin-top:10px">${esc(x.byName)} — ${esc(dt(x.at))}${x.tags ? ` · ${esc(x.tags)}` : ''}</div>
        <div class="row" style="gap:8px;margin-top:12px">${st.d.manage ? `<button class="btn" id="knE">${icon('pencil')} تعديل</button><button class="btn bad ghost" id="knD">${icon('trash')} حذف</button>` : ''}<button class="btn ghost" data-x style="margin-inline-start:auto">إغلاق</button></div></div>`;
      document.body.appendChild(bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      if ($('#knE', bg))
        $('#knE', bg).onclick = () => {
          bg.remove();
          itemForm(x);
        };
      if ($('#knD', bg))
        $('#knD', bg).onclick = async () => {
          if (!(await askYesNo(`حذف «${x.title}» من المكتبة؟`))) return;
          try {
            await api('DELETE', `/api/knowledge/items/${x.id}`);
            bg.remove();
            reload();
          } catch (e) {
            toast(e.message, true);
          }
        };
    }
    /* إضافة / تعديل محتوى */
    function itemForm(...args) {
      return knowledgeItemForm(P, TI, reload, st, ...args);
    }
    /* المهنة: إضافة / تعديل */
    return viewKnowledgePart4(P, itemForm, reload, st);
  }
  /* itemForm من viewKnowledge (يأخذ P، TI، reload، st من الصفحة) */
  function knowledgeItemForm(P, TI, reload, st, x) {
    const it = x || { type: 'مقال', profIds: P ? [P.id] : st.d.my.slice(0, 1) };
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<form class="modal" style="max-width:820px;width:96%" novalidate><h3 style="margin-top:0">${x ? `${icon('pencil')} تعديل محتوى` : `${icon('plus')} إضافة محتوى للمكتبة`}</h3>
        <div class="field"><label>النوع</label><div class="kn-chips">${st.d.types.map((t) => `<label><input type="radio" name="type" value="${esc(t)}"${it.type === t ? ' checked' : ''}> ${icon((TI[t] || TI['مقال'])[0])} ${esc(t)}</label>`).join('')}</div></div>
        <div class="field"><label>العنوان *</label><input class="in" name="title" value="${esc(it.title || '')}" placeholder="مثال: طريقة أخذ عينة تربة غير مقلقلة"></div>
        <div class="field"><label>المهن التي يفيدها *</label><div class="kn-profs">${st.d.profs.map((p) => `<label><input type="checkbox" name="prof" value="${p.id}"${(it.profIds || []).includes(p.id) ? ' checked' : ''}> ${esc(p.name)}</label>`).join('') || '<span class="muted">أنشئ المهن أولاً</span>'}</div></div>
        <div class="field"><label>المحتوى</label><textarea class="in" name="body" rows="10" placeholder="الشرح، الخطوات، الملاحظات... (اكتب كل خطوة في سطر)">${esc(it.body || '')}</textarea></div>
        <div class="grid2" style="grid-template-columns:2fr 1fr"><div class="field"><label>رابط (فيديو يوتيوب أو مرجع)</label><input class="in" name="url" dir="ltr" value="${esc(it.url || '')}" placeholder="https://..."></div><div class="field"><label>كلمات مفتاحية</label><input class="in" name="tags" value="${esc(it.tags || '')}" placeholder="تربة، ASTM، سلامة"></div></div>
        <div class="field"><label>ملفات (PDF، صور، Word، Excel، PowerPoint)</label><input type="file" class="in" id="knF" multiple></div>
        <label class="check"><input type="checkbox" name="pinned"${it.pinned ? ' checked' : ''}> 📌 تثبيت في أعلى مكتبة المهنة</label>
        <div class="merr"></div><div class="row" style="gap:8px;margin-top:12px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('form', bg).onsubmit = async (ev) => {
      ev.preventDefault();
      const f = ev.target,
        files = $('#knF', bg).files;
      const b = {
        type: (f.querySelector('[name=type]:checked') || {}).value,
        title: f.title.value,
        body: f.body.value,
        url: f.url.value.trim(),
        tags: f.tags.value,
        pinned: f.pinned.checked,
        profIds: $$('[name=prof]:checked', bg).map((c) => c.value),
        willUpload: files.length > 0,
      };
      try {
        const r = await api(x ? 'PUT' : 'POST', x ? `/api/knowledge/items/${x.id}` : '/api/knowledge/items', b);
        for (const fl of files) await uploadFile(null, fl, '', `/api/knowledge/items/${r.id}/files`);
        bg.remove();
        toast('تم الحفظ');
        reload();
      } catch (e) {
        $('.merr', bg).innerHTML = `<div class="err">${esc(e.message)}</div>`;
      }
    };
  }
  /* جزء من viewKnowledge: viewKnowledgePart2(main, row, st);… */
  function viewKnowledgePart5(main, openItem, query, row, st) {
    viewKnowledgePart2(main, row, st);
    /* تفاصيل الفئة: مسمياتها بأعدادها، وترشيح مربعات المهن عليها */
    $$('[data-ksum]', main).forEach((b) => {
      b.onclick = () => {
        const on = b.classList.toggle('on');
        $$('[data-ksum]', main).forEach((x) => {
          if (x !== b) x.classList.remove('on');
        });
        const x = st.d.summary.find((y) => y.k === b.dataset.ksum),
          box = $('#knSd');
        box.hidden = !on;
        box.innerHTML = on
          ? `<b>${esc(x.k)}: ${x.n} موظف</b><div class="kn-st">${x.titles.map(([t, n]) => `<span>${esc(t)} <i>${n}</i></span>`).join('')}</div>`
          : '';
        const ts = on ? new Set(x.titles.map(([t]) => normAr(t))) : null;
        $$('#knGrid .ap-t', main).forEach((t) => {
          const p = st.d.profs.find((y) => t.getAttribute('href') === `#/knowledge?p=${y.id}`);
          t.hidden = !!ts && !(p && (p.titles || []).some((y) => ts.has(normAr(y))));
        });
      };
    });
    st.kt = '';
    const filt = () => {
      const v = normAr(($('#knQ2') || {}).value || '');
      $$('#knL .kn-row', main).forEach((r) => {
        const x = st.d.items.find((y) => y.id === r.dataset.kitem);
        r.hidden = (st.kt && x.type !== st.kt) || (v && !r.dataset.s.includes(v));
      });
    };
    if ($('#knQ2')) $('#knQ2').oninput = filt;
    $$('[data-kt]', main).forEach((b) => {
      b.onclick = () => {
        st.kt = b.dataset.kt;
        $$('[data-kt]', main).forEach((x) => x.classList.toggle('on', x === b));
        filt();
      };
    });
    main.addEventListener('click', (ev) => {
      const r = ev.target.closest('[data-kitem]');
      if (r) openItem(st.d.items.find((x) => x.id === r.dataset.kitem));
    });
    viewKnowledgePart(st.d, openItem, query);
  }
  /* جزء من viewKnowledge: function profForm(p) {… */
  function viewKnowledgePart4(P, itemForm, reload, st) {
    function profForm(p) {
      const it = p || { titles: [] };
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      const all = [...new Set([...st.d.titles.map(([t]) => t), ...(it.titles || [])])];
      bg.innerHTML = `<form class="modal" style="max-width:720px;width:96%" novalidate><h3 style="margin-top:0">${p ? `${icon('pencil')} تعديل المهنة` : `${icon('plus')} مهنة جديدة`}</h3>
        <div class="field"><label>اسم المهنة *</label><input class="in" name="name" value="${esc(it.name || '')}" placeholder="مثال: فني مختبر"></div>
        <div class="field"><label>نبذة عن المهنة</label><textarea class="in" name="desc" rows="3">${esc(it.desc || '')}</textarea></div>
        <div class="field"><label>المسميات الوظيفية التابعة لها <small class="muted">(الموظفون بهذه المسميات يرون المكتبة كمكتبة مهنتهم)</small></label><input class="in" id="knTq" placeholder="ابحث في المسميات..." style="margin-bottom:6px"><div class="kn-profs kn-titles">${all
          .map((t) => {
            const n = (st.d.titles.find(([x]) => x === t) || [0])[1];
            return `<label data-t="${esc(normAr(t))}"><input type="checkbox" name="t" value="${esc(t)}"${(it.titles || []).includes(t) ? ' checked' : ''}> ${esc(t)} <small class="muted">${n}</small></label>`;
          })
          .join('')}</div></div>
        <div class="merr"></div><div class="row" style="gap:8px;margin-top:12px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button>${p ? '<button type="button" class="btn bad ghost" id="knPD" style="margin-inline-start:auto">🗑 حذف المهنة</button>' : ''}</div></form>`;
      document.body.appendChild(bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      $('#knTq', bg).oninput = (e) => {
        const v = normAr(e.target.value.trim());
        $$('.kn-titles label', bg).forEach((l) => {
          l.hidden = !!v && !l.dataset.t.includes(v);
        });
      };
      if ($('#knPD', bg))
        $('#knPD', bg).onclick = async () => {
          if (!(await askYesNo(`حذف مهنة «${p.name}»؟ (المحتوى يبقى في مهنه الأخرى)`))) return;
          try {
            await api('DELETE', `/api/knowledge/profs/${p.id}`);
            bg.remove();
            location.hash = '#/knowledge';
          } catch (e) {
            toast(e.message, true);
          }
        };
      $('form', bg).onsubmit = async (ev) => {
        ev.preventDefault();
        const f = ev.target;
        try {
          await api(p ? 'PUT' : 'POST', p ? `/api/knowledge/profs/${p.id}` : '/api/knowledge/profs', {
            name: f.name.value,
            desc: f.desc.value,
            titles: $$('[name=t]:checked', bg).map((c) => c.value),
          });
          bg.remove();
          toast('تم الحفظ');
          reload();
        } catch (e) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(e.message)}</div>`;
        }
      };
    }
    if ($('#knNew')) $('#knNew').onclick = () => (st.d.profs.length ? itemForm(null) : toast('أنشئ المهن أولاً', true));
    wireKnowledge(P, profForm, reload);
  }
  /* جزء من viewKnowledge: const tile = (p, i) => {… */
  function viewKnowledgePart3(P, TI, main, ofProf, row, st) {
    const tile = (p, i) => {
      const [a, c, dd] = APP_TONES[i % APP_TONES.length],
        mine = st.d.my.includes(p.id);
      return `<a class="ap-t${mine ? ' kn-mine' : ''}" href="#/knowledge?p=${p.id}" data-s="${esc(normAr(`${p.name} ${(p.titles || []).join(' ')}`))}" title="${esc(p.desc || p.name)}"><span class="ap-g" style="--a:${a};--b:${c};--c:${dd};--m:${p.color || appHue(`kn-${p.name}`)}"><i class="ap-x"></i><i class="ap-y"></i>${icon('briefcase')}${p.items ? `<b class="ap-b">${p.items}</b>` : ''}</span><span class="ap-l">${esc(p.name)}<small class="ap-d">${mine ? 'مهنتك' : `${p.emps} موظف`}</small></span></a>`;
    };
    const mgrBtns = st.d.manage
      ? `<span class="row" style="gap:6px;flex-wrap:wrap">${P ? `<button class="btn" id="knEditP">${icon('pencil')} تعديل المهنة</button>` : `<button class="btn" id="knNewP">${icon('plus')} مهنة</button>${st.d.titles.length ? '<button class="btn" id="knAuto">⚡ إنشاء المهن من المسميات الوظيفية</button>' : ''}`}<button class="btn primary" id="knNew">${icon('plus')} إضافة محتوى</button></span>`
      : '';
    st.body = undefined;
    if (!P) {
      const mine = st.d.profs.filter((p) => st.d.my.includes(p.id));
      const latest = st.d.items.slice(0, 8);
      /* ملخص المهن: كم مهندس وكم محاسب وكم جيولوجي... والضغط على الفئة يعرض مسمياتها ويرشّح المهن */
      const SC = {
        مديرون: ['briefcase', '#1e293b'],
        مهندسون: ['building', '#2563eb'],
        جيولوجيون: ['compass', '#b45309'],
        كيميائيون: ['zap', '#7c3aed'],
        محاسبون: ['calc', '#059669'],
        مساحون: ['mapPin', '#0891b2'],
        'فنيو مختبر': ['scanEye', '#0d9488'],
        'فنيو حفر وحفارون': ['truck', '#c2410c'],
        فنيون: ['wrench', '#64748b'],
        سائقون: ['car', '#ea580c'],
        إداريون: ['fileText', '#4f46e5'],
        عمال: ['users', '#a16207'],
        أخرى: ['grid', '#94a3b8'],
      };
      st.body = `<div class="card kn-sum"><div class="kn-sum-h"><h3 style="margin:0">${icon('users')} ملخص المهن</h3><span class="kn-tot"><b>${st.d.total}</b> موظف</span></div>
          <div class="kn-sg">${st.d.summary
            .map((x) => {
              const [ic, c] = SC[x.k] || SC['أخرى'];
              return `<button type="button" class="kn-s" data-ksum="${esc(x.k)}" style="--c:${c}"><span class="kn-s-ic">${icon(ic)}</span><b>${x.n}</b><small>${esc(x.k)}</small><i style="width:${Math.max(4, Math.round((x.n / st.d.total) * 100))}%"></i></button>`;
            })
            .join('')}</div>
          <div class="kn-sd" id="knSd" hidden></div></div>
        <div class="card"><div class="ap-tools"><input class="in ap-q" id="knQ" type="search" placeholder="ابحث في المكتبة: مهنة، أو موضوع، مثال: عينة تربة، سلامة الحفر..." autocomplete="off"></div>
          <div id="knRes" class="kn-list" hidden></div>
          ${mine.length ? `<h3 class="kn-h">${icon('award')} مكتبة مهنتك</h3><div class="ap-grid">${mine.map(tile).join('')}</div>` : ''}
          <h3 class="kn-h">${icon('briefcase')} كل المهن (${st.d.profs.length})</h3>${st.d.profs.length ? `<div class="ap-grid" id="knGrid">${st.d.profs.map(tile).join('')}</div>` : empEmpty(st.d.manage ? 'لا توجد مهن بعد — أنشئها من المسميات الوظيفية بضغطة «⚡ إنشاء المهن من المسميات الوظيفية»' : 'لم يضف المسؤولون مهناً بعد')}</div>
        ${latest.length ? `<div class="card"><h3 style="margin-top:0">${icon('zap')} أحدث الإضافات</h3><div class="kn-list">${latest.map(row).join('')}</div></div>` : ''}`;
    } else {
      setCrumb([[P.name, location.hash]]);
      const its = ofProf(P).sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.at).localeCompare(String(a.at)));
      const types = [...new Set(its.map((x) => x.type))];
      st.body = `<div class="card kn-hero"><div><h2>${esc(P.name)}</h2>${P.desc ? `<p>${esc(P.desc)}</p>` : ''}<div class="kn-meta"><span>${icon('users')} ${P.emps} موظف</span><span>${icon('bookOpen')} ${its.length} محتوى</span>${(P.titles || []).length ? `<span>${icon('idCard')} ${esc(P.titles.join('، '))}</span>` : ''}</div></div></div>
        <div class="card"><div class="filters"><input class="in" id="knQ2" placeholder="ابحث في مكتبة ${esc(P.name)}..."><span class="kn-chips"><button type="button" class="on" data-kt="">الكل</button>${types.map((t) => `<button type="button" data-kt="${esc(t)}">${icon((TI[t] || TI['مقال'])[0])} ${esc(t)}</button>`).join('')}</span></div>
          <div class="kn-list" id="knL">${its.length ? its.map(row).join('') : empEmpty('لا يوجد محتوى في مكتبة هذه المهنة بعد')}</div></div>
        ${(() => {
          const cs = (st.d.courses || []).filter((x) => (x.profIds || []).includes(P.id));
          return cs.length
            ? `<div class="card"><h3 style="margin-top:0">${icon('fileAward')} دورات مركز التدريب لهذه المهنة (${cs.length})</h3><div class="kn-list">${cs.map((x) => `<a class="kn-row" href="#/training?id=${x.id}" style="--c:#9b1c1c"><span class="kn-ic">${icon('fileAward')}</span><span class="kn-rt"><b>${esc(x.title)}${x.mandatory ? ' <i class="tr-tag m">إلزامية</i>' : ''}</b><small>${x.closed ? 'منتهية' : x.start ? `تبدأ ${esc(SF.fmtDate(x.start))}` : ''}</small></span></a>`).join('')}</div></div>`
            : '';
        })()}`;
    }
    main.innerHTML = `${head(P ? `مكتبة ${esc(P.name)}` : 'مكتبة المهن', P ? 'كل ما يفيد في هذه المهنة: شروحات، إجراءات، مراجع فنية، فيديوهات، ملفات، نصائح' : `معرفة تفيد كل مهنة — مهنتك: ${esc(st.d.myTitle || 'غير محددة')}`, mgrBtns)}${st.body}`;
  }
  /* جزء من viewKnowledge: if ($('#knQ'))… */
  function viewKnowledgePart2(main, row, st) {
    if ($('#knQ'))
      $('#knQ').oninput = (e) => {
        const v = normAr(e.target.value.trim());
        const res = $('#knRes');
        $$('#knGrid .ap-t', main).forEach((t) => {
          t.hidden = !!v && !t.dataset.s.includes(v);
        });
        const hits = v ? st.d.items.filter((x) => normAr(`${x.title} ${x.body} ${x.tags || ''}`).includes(v)).slice(0, 20) : [];
        res.hidden = !hits.length;
        res.innerHTML = hits.map(row).join('');
      };
  }
  /* جزء من viewKnowledge: if (query.item) {… */
  function viewKnowledgePart(d, openItem, query) {
    if (query.item) {
      const x = d.items.find((y) => y.id === query.item);
      if (x) openItem(x);
    }
  }
  /* أحداث viewKnowledge: #knNewP، #knEditP، #knAuto */
  function wireKnowledge(P, profForm, reload) {
    if ($('#knNewP')) $('#knNewP').onclick = () => profForm(null);
    if ($('#knEditP')) $('#knEditP').onclick = () => profForm(P);
    if ($('#knAuto'))
      $('#knAuto').onclick = async () => {
        if (!(await askYesNo('إنشاء مهنة لكل مسمى وظيفي غير مضاف لمهنة (المسميات المتشابهة مهنة واحدة)؟ يمكنك تعديلها ودمجها بعد ذلك.')))
          return;
        try {
          const r = await api('POST', '/api/knowledge/profs/auto', {});
          toast(`أنشأنا ${r.created} مهنة`);
          reload();
        } catch (e) {
          toast(e.message, true);
        }
      };
  }

  return { viewKnowledge };
};
