'use strict';
/* صفحة «analysis» (viewAnalysis) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['analysis'] = function (S) {
  const {
    $,
    $$,
    AN_CHAIN,
    AN_TOOLS,
    APP_TONES,
    SF,
    api,
    appHue,
    askYesNo,
    dt,
    empEmpty,
    esc,
    head,
    icon,
    normAr,
    setCrumb,
    shell,
    state,
    toast,
    today,
  } = S;
  async function viewAnalysis(tool, query = {}) {
    /* حالة الصفحة: ما يتغير بعد العرض (list، cur، tm، busy) */
    const st = {};
    const T = AN_TOOLS.find((x) => x.k === tool);
    if (!T) {
      return viewAnalysisPart3();
    }
    /* التحليلات المحفوظة على الخادم: القائمة + التحليل المفتوح (?id=) — والورقة القديمة المحفوظة على الجهاز تُنقل للخادم مرة واحدة */
    const KEY = `analysis:${state.user.id}:${T.k}`;
    st.list = await api('GET', `/api/analysis?tool=${T.k}`).catch(() => []);
    try {
      const old = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (old && Object.entries(old).some(([k, v]) => k !== '_date' && String(v || '').trim())) {
        const r = await api('POST', '/api/analysis', { tool: T.k, data: old });
        localStorage.removeItem(KEY);
        st.list = [r, ...st.list];
      }
    } catch {
      /* تجاهل */
    }
    st.cur = query.id ? await api('GET', `/api/analysis/${encodeURIComponent(query.id)}`).catch(() => null) : null;
    const saved = (st.cur && st.cur.data) || {};
    const pLabel = T.problem === true ? 'المشكلة' : T.problem || '';
    /* سلسلة الأدوات السابقة (التحليل الذي انتُقل منه، ثم ما قبله...) */
    const srcs = [];
    await viewAnalysisPart2(saved, srcs);
    const prev = srcs[srcs.length - 1],
      prevT = prev && AN_TOOLS.find((y) => y.k === prev.tool);
    const pts = (t) =>
      String(t || '')
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
    return viewAnalysisPart5(T, pLabel, prev, prevT, pts, saved, srcs, st);
  }
  /* جزء من viewAnalysis: const next = (AN_CHAIN[T.k] || []).map(([k, why]) … */
  function viewAnalysisPart5(T, pLabel, prev, prevT, pts, saved, srcs, st) {
    const next = (AN_CHAIN[T.k] || []).map(([k, why]) => [AN_TOOLS.find((y) => y.k === k), why]).filter(([x]) => x);
    const main = shell(
      `${head(esc(T.n), esc(T.en), `<button type="button" class="btn" id="anPrint">${icon('printer')} طباعة / PDF</button>${srcs.length ? `<button type="button" class="btn" id="anPrintAll">${icon('fileText')} التقرير الكامل PDF</button>` : ''}<a class="btn ghost" href="#/analysis/${T.k}">${icon('plus')} تحليل جديد</a>`)}
      <div class="card an-about">
        <div class="an-ab"><h3>${icon('bookOpen')} ما هي الأداة؟</h3><p>${esc(T.what)}</p></div>
        <div class="an-ab"><h3>${icon('target')} متى نستخدمها؟</h3><p>${esc(T.when)}</p></div>
        <div class="an-ab"><h3>${icon('listChecks')} طريقة الاستخدام</h3><ol>${T.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ol></div></div>
      ${
        prev && prevT
          ? `<div class="card an-ref"><div class="an-ref-h"><h3 style="margin:0">${icon('link')} مدخلات من: ${esc(prevT.n)}${prev.subject ? ` — ${esc(prev.subject)}` : ''}</h3>
          <span class="an-chain">${srcs
            .map((x) => {
              const t = AN_TOOLS.find((y) => y.k === x.tool) || { n: x.tool };
              return `<a href="#/analysis/${x.tool}?id=${x.id}">${esc(t.n)}</a>`;
            })
            .join(' ← ')} ← <b>${esc(T.n)}</b></span></div>
        <div class="hint">نتائج الأداة السابقة للرجوع إليها — انقل منها ما يلزم إلى ورقة العمل.</div>
        <div class="an-ref-g">${prevT.secs
          .map(([k, l, , c]) => {
            const L = pts((prev.data || {})[k]);
            return L.length
              ? `<div class="an-ref-s" style="--c:${c}"><b>${esc(l)}</b><ul>${L.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`
              : '';
          })
          .join('')}
          ${
            pts((prev.data || {})._result).length
              ? `<div class="an-ref-s res" style="--c:#0f766e"><b>النتيجة والخلاصة</b><ul>${pts(prev.data._result)
                  .map((x) => `<li>${esc(x)}</li>`)
                  .join('')}</ul></div>`
              : ''
          }</div></div>`
          : ''
      }
      <div class="card"><h3 style="margin-top:0">${icon('pencil')} ورقة العمل <small class="muted" style="font-weight:500">— ${st.cur ? 'يحفظها النظام تلقائياً' : 'يحفظ النظام التحليل تلقائياً عند أول كتابة'}، اكتب كل نقطة في سطر</small></h3>
        <div class="an-bar">${st.cur ? `<span class="chip">${st.cur.mine ? 'تحليلي' : `بواسطة ${esc(st.cur.byName)}`}</span>` : '<span class="chip">تحليل جديد</span>'}
          <label class="an-share"><input type="checkbox" id="anShare"${st.cur && st.cur.shared ? ' checked' : ''}${st.cur && !st.cur.canOwn ? ' disabled' : ''}> مشاركة مع الفريق <small class="muted">(يراه ويعدّله كل من له أدوات التحليل)</small></label>
          ${st.cur && st.cur.canOwn ? `<button type="button" class="btn sm bad ghost" id="anDel">${icon('trash')} حذف التحليل</button>` : ''}</div>
        <input type="hidden" data-an="_from">
        <div class="an-meta"><div class="field"><label>موضوع التحليل</label><input class="in" data-an="_subject" placeholder="مثال: فرع جدة / مشروع ... / خدمة ..."></div>
          <div class="field"><label>إعداد</label><input class="in" data-an="_by" placeholder="${esc(state.user.name)}"></div><div class="field"><label>التاريخ</label><input class="in" type="date" data-an="_date"></div></div>
        ${pLabel ? `<div class="field"><label>${pLabel}</label><textarea class="in" data-an="_problem" rows="2" placeholder="اكتب ${pLabel} بوضوح"></textarea></div>` : ''}
        <div class="an-grid c${T.cols}">${T.secs.map(([k, l, h, c]) => `<div class="an-sec" style="--c:${c}"><div class="an-h">${esc(l)}</div><textarea class="in" data-an="${k}" rows="6" placeholder="${esc(h || 'اكتب كل نقطة في سطر')}"></textarea></div>`).join('')}</div>
        <div class="an-result"><div class="an-h">${icon('checkCircle')} النتيجة والخلاصة</div><textarea class="in" data-an="_result" rows="4" placeholder="${esc(T.result || 'ما الذي توصلت إليه؟ القرار والتوصيات والخطوات التالية — كل نقطة في سطر')}"></textarea></div>
        <div class="an-saved muted" id="anSaved"></div>
        ${next.length ? `<div class="an-next"><b>${icon('forward')} الخطوة التالية:</b>${next.map(([x, why]) => `<button type="button" class="btn" data-annext="${x.k}" title="${esc(why)}">${icon(x.ic)} انتقال إلى ${esc(x.n)} ←</button><small class="muted">${esc(why)}</small>`).join('')}</div>` : ''}
        <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn primary" id="anPrint2">${icon('download')} تنزيل النتيجة PDF</button>${srcs.length ? `<button type="button" class="btn" id="anPrintAll2">${icon('fileText')} التقرير الكامل للسلسلة PDF</button>` : ''}</div></div>`,
      '#/analysis',
    );
    setCrumb([[T.n, location.hash]]);
    const fields = $$('[data-an]', main);
    fields.forEach((f) => {
      f.value = saved[f.dataset.an] || (f.dataset.an === '_date' ? today() : '');
    });
    st.tm = null;
    st.busy = null;
    const valsNow = () => {
      const v = {};
      fields.forEach((f) => {
        v[f.dataset.an] = f.value;
      });
      return v;
    };
    viewAnalysisPart4(T, fields, main, st, valsNow);
    /* التحليلات المحفوظة لهذه الأداة */
    main.insertAdjacentHTML(
      'beforeend',
      `<div class="card"><h3 style="margin-top:0">${icon('folderOpen')} التحليلات المحفوظة (${st.list.length})</h3>
      ${
        st.list.length
          ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>موضوع التحليل</th><th>بواسطة</th><th>آخر تعديل</th><th>المشاركة</th></tr></thead><tbody>
        ${st.list.map((x) => `<tr class="clickable${st.cur && x.id === st.cur.id ? ' on' : ''}" style="cursor:pointer" data-anopen="${x.id}"><td><b>${esc(x.subject || 'بدون عنوان')}</b>${st.cur && x.id === st.cur.id ? ' <span class="chip approved">مفتوح الآن</span>' : ''}</td><td>${esc(x.byName)}</td><td class="num muted">${esc(dt(x.updatedAt))}${x.updatedBy && x.updatedBy !== x.byName ? `<div style="font-size:12px">${esc(x.updatedBy)}</div>` : ''}</td><td>${x.shared ? '<span class="chip approved">مع الفريق</span>' : '<span class="chip">خاص</span>'}</td></tr>`).join('')}</tbody></table></div>`
          : empEmpty('لا توجد تحليلات محفوظة لهذه الأداة بعد — ابدأ الكتابة في ورقة العمل ويُحفظ تلقائياً')
      }</div>`,
    );
    viewAnalysisPart(T, main, srcs, valsNow);
  }
  /* جزء من viewAnalysis: const stamp = (m) => {… */
  function viewAnalysisPart4(T, fields, main, st, valsNow) {
    const stamp = (m) => {
      $('#anSaved', main).textContent = m;
    };
    /* أول كتابة تنشئ التحليل على الخادم ثم يُحدَّث تلقائياً */
    const store = async () => {
      if (st.busy) {
        await st.busy;
      }
      st.busy = (async () => {
        try {
          if (!st.cur) {
            st.cur = await api('POST', '/api/analysis', { tool: T.k, data: valsNow(), shared: $('#anShare', main).checked });
            history.replaceState(null, '', `#/analysis/${T.k}?id=${st.cur.id}`);
          } else await api('PUT', `/api/analysis/${st.cur.id}`, { data: valsNow() });
          stamp(
            `✔ حُفظ ${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}${st.cur.shared ? ' — مشارك مع الفريق' : ''}`,
          );
        } catch (e) {
          stamp(`⚠ تعذر الحفظ: ${e.message}`);
        }
      })();
      await st.busy;
      st.busy = null;
    };
    fields.forEach((f) => {
      f.oninput = () => {
        clearTimeout(st.tm);
        st.tm = setTimeout(store, 700);
      };
    });
    $('#anShare', main).onchange = async (ev) => {
      if (!st.cur) {
        await store();
      }
      try {
        st.cur = { ...st.cur, ...(await api('PUT', `/api/analysis/${st.cur.id}`, { shared: ev.target.checked })) };
        toast(ev.target.checked ? 'التحليل مشارك مع الفريق' : 'التحليل خاص بك');
      } catch (e) {
        ev.target.checked = !ev.target.checked;
        toast(e.message, true);
      }
    };
    if ($('#anDel', main))
      $('#anDel', main).onclick = async () => {
        if (!(await askYesNo('حذف هذا التحليل نهائياً؟'))) return;
        try {
          await api('DELETE', `/api/analysis/${st.cur.id}`);
          toast('تم حذف التحليل');
          location.hash = `#/analysis/${T.k}`;
        } catch (e) {
          toast(e.message, true);
        }
      };
    /* الانتقال للأداة المرتبطة: يُحفظ الحالي ثم يُنشأ تحليل جديد في الأداة التالية بنفس الموضوع ومرتبط به */
    $$('[data-annext]', main).forEach((b) => {
      b.onclick = async () => {
        clearTimeout(st.tm);
        await store();
        if (!st.cur) return;
        const nk = b.dataset.annext,
          NT = AN_TOOLS.find((y) => y.k === nk),
          v = valsNow();
        const data = { _subject: v._subject, _by: v._by, _date: today(), _from: st.cur.id };
        if (NT.problem && v._problem) data._problem = v._problem;
        if (T.k === 'whys' && NT.k === 'smart' && v.act) data._problem = v.act.split('\n')[0];
        try {
          const r = await api('POST', '/api/analysis', { tool: nk, data, shared: !!st.cur.shared });
          location.hash = `#/analysis/${nk}?id=${r.id}`;
        } catch (e) {
          toast(e.message, true);
        }
      };
    });
  }
  /* جزء من viewAnalysis: const tile = (x, i) => {… */
  async function viewAnalysisPart3() {
    const tile = (x, i) => {
      const [a, c, d] = APP_TONES[i % APP_TONES.length];
      return `<a class="ap-t" href="#/analysis/${x.k}" data-s="${esc(`${x.n} ${x.en} ${x.what}`)}" title="${esc(x.what)}"><span class="ap-g" style="--a:${a};--b:${c};--c:${d};--m:${appHue(`an-${x.k}`)}"><i class="ap-x"></i><i class="ap-y"></i>${icon(x.ic)}</span><span class="ap-l">${esc(x.n)}<small class="ap-d" dir="ltr">${esc(x.en)}</small></span></a>`;
    };
    const main = shell(
      `${head('أدوات تحليل', 'أدوات التحليل الاستراتيجي والإداري التي يستخدمها المتخصصون — اختر أداة لتعرف استخدامها وتملأ ورقة العمل وتطبعها')}
        <div class="card"><div class="ap-tools"><input class="in ap-q" id="anQ" type="search" placeholder="ابحث عن أداة... مثال: SWOT، المخاطر، الأهداف" autocomplete="off"></div>
        <div class="ap-grid" id="anGrid">${AN_TOOLS.map(tile).join('')}</div></div>
        <div class="card"><h3 style="margin-top:0">${icon('bulb')} أي أداة أستخدم؟</h3><div class="an-guide">${[
          ['تقييم الوضع الحالي ووضع الاستراتيجية', 'pestel', 'swot', 'tows'],
          ['المنافسة وجاذبية القطاع', 'porter', 'bcg'],
          ['النمو والتوسع', 'ansoff', 'canvas'],
          ['الأداء والمؤشرات والأهداف', 'bsc', 'smart', 'gap'],
          ['حل المشكلات والجودة', 'fishbone', 'whys'],
          ['المشاريع والمخاطر والأولويات', 'stake', 'risk', 'eisen'],
          ['التنظيم والعمليات', 'mck7s', 'vchain'],
        ]
          .map(
            ([l, ...ks]) =>
              `<div class="an-g"><b>${l}</b><span>${ks
                .map((k) => {
                  const x = AN_TOOLS.find((y) => y.k === k);
                  return `<a href="#/analysis/${k}">${esc(x.n)}</a>`;
                })
                .join(' ← ')}</span></div>`,
          )
          .join('')}</div></div>`,
      '#/analysis',
    );
    const q = $('#anQ', main);
    q.oninput = () => {
      const v = normAr(q.value.trim());
      $$('#anGrid .ap-t', main).forEach((t) => {
        t.hidden = !!v && !normAr(t.dataset.s).includes(v);
      });
    };
    /* آخر التحليلات المحفوظة (تحليلاتي والمشاركة مع الفريق) وعددها على كل أداة */
    const all = await api('GET', '/api/analysis').catch(() => []);
    const cnt = all.reduce((m, x) => {
      m[x.tool] = (m[x.tool] || 0) + 1;
      return m;
    }, {});
    $$('#anGrid .ap-t', main).forEach((t) => {
      const k = t.getAttribute('href').split('/').pop();
      if (cnt[k]) t.querySelector('.ap-g').insertAdjacentHTML('beforeend', `<b class="ap-b" title="تحليلات محفوظة">${cnt[k]}</b>`);
    });
    if (all.length) {
      $('#anGrid', main)
        .closest('.card')
        .insertAdjacentHTML(
          'afterend',
          `<div class="card"><h3 style="margin-top:0">${icon('folderOpen')} آخر التحليلات</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الأداة</th><th>موضوع التحليل</th><th>بواسطة</th><th>آخر تعديل</th><th>المشاركة</th></tr></thead><tbody>
          ${all
            .slice(0, 15)
            .map((x) => {
              const t = AN_TOOLS.find((y) => y.k === x.tool) || { n: x.tool };
              return `<tr class="clickable" style="cursor:pointer" data-go="#/analysis/${x.tool}?id=${x.id}"><td>${esc(t.n)}</td><td><b>${esc(x.subject || 'بدون عنوان')}</b></td><td>${esc(x.byName)}</td><td class="num muted">${esc(dt(x.updatedAt))}</td><td>${x.shared ? '<span class="chip approved">مع الفريق</span>' : '<span class="chip">خاص</span>'}</td></tr>`;
            })
            .join('')}</tbody></table></div></div>`,
        );
      main.addEventListener('click', (ev) => {
        const r = ev.target.closest('[data-go]');
        if (r) location.hash = r.dataset.go;
      });
    }
    return;
  }
  /* جزء من viewAnalysis: for (let fid = saved._from; fid && srcs.length < 6… */
  async function viewAnalysisPart2(saved, srcs) {
    for (let fid = saved._from; fid && srcs.length < 6; ) {
      const x = await api('GET', `/api/analysis/${encodeURIComponent(fid)}`).catch(() => null);
      if (!x) break;
      srcs.unshift(x);
      fid = (x.data || {})._from;
    }
  }
  /* جزء من viewAnalysis: main.addEventListener('click', (ev) => {… */
  function viewAnalysisPart(T, main, srcs, valsNow) {
    main.addEventListener('click', (ev) => {
      const r = ev.target.closest('[data-anopen]');
      if (r) location.hash = `#/analysis/${T.k}?id=${r.dataset.anopen}`;
    });
    /* الطباعة: هذه الأداة وحدها، أو التقرير الكامل (الأدوات السابقة في السلسلة ثم هذه) */
    const printThis = () => anPrint([{ T, v: valsNow() }]);
    const printAll = () =>
      anPrint([...srcs.map((x) => ({ T: AN_TOOLS.find((y) => y.k === x.tool), v: x.data || {} })).filter((x) => x.T), { T, v: valsNow() }]);
    $('#anPrint', main).onclick = printThis;
    $('#anPrint2', main).onclick = printThis;
    if ($('#anPrintAll', main)) {
      $('#anPrintAll', main).onclick = printAll;
      $('#anPrintAll2', main).onclick = printAll;
    }
  }

  /* صفحة PDF: أداة أو أكثر (سلسلة) — لكل أداة صفحة: الموضوع، الأقسام بنقاط، والنتيجة والخلاصة */
  function anPrint(items) {
    const pts = (t) => {
      const l = String(t || '')
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
      return l.length ? `<ul>${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="e">—</p>';
    };
    const one = ({ T, v }, i) => {
      const pl = T.problem === true ? 'المشكلة' : T.problem || '';
      return `<section class="pg${i ? ' br' : ''}"><div class="hd"><img src="${location.origin}/logo.png" alt=""><div><h1>${items.length > 1 ? `${i + 1}. ` : ''}${esc(T.n)}</h1><div class="en">${esc(T.en)}</div></div></div>
        <div class="mt">${v._subject ? `<span><b>الموضوع:</b> ${esc(v._subject)}</span>` : ''}<span><b>إعداد:</b> ${esc(v._by || state.user.name)}</span>${v._date ? `<span><b>التاريخ:</b> ${esc(SF.fmtDate(v._date))}</span>` : ''}</div>
        ${pl && v._problem ? `<div class="pb"><b>${pl}:</b> ${esc(v._problem)}</div>` : ''}
        <div class="g" style="grid-template-columns:repeat(${Math.min(T.cols, 3)},1fr)">${T.secs.map(([k, l, , c]) => `<div class="s" style="--c:${c}"><h3>${esc(l)}</h3>${pts(v[k])}</div>`).join('')}</div>
        ${String(v._result || '').trim() ? `<div class="res"><h3>النتيجة والخلاصة</h3>${pts(v._result)}</div>` : ''}</section>`;
    };
    const sub = (items[items.length - 1].v || {})._subject || '';
    const w = window.open('', '_blank');
    if (!w) {
      toast('اسمح بالنوافذ المنبثقة للطباعة', true);
      return;
    }
    w.document
      .write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${items.length > 1 ? 'تقرير التحليل' : esc(items[0].T.n)}${sub ? ` — ${esc(sub)}` : ''}</title><style>
      @page{size:A4;margin:14mm} body{font-family:Tajawal,'Segoe UI',Tahoma,sans-serif;color:#1e293b;margin:0} .br{break-before:page} .hd{display:flex;align-items:center;gap:12px;border-bottom:3px solid #9b1c1c;padding-bottom:10px;margin-bottom:12px}
      .hd img{width:54px;height:54px;object-fit:contain} h1{margin:0;font-size:22px} .en{color:#64748b;font-size:13px} .mt{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;margin-bottom:10px} .mt b{color:#9b1c1c}
      .pb{border:1.5px solid #cbd5e1;border-radius:10px;padding:8px 12px;margin-bottom:10px} .g{display:grid;gap:10px}
      .s{border:1.5px solid var(--c);border-radius:10px;overflow:hidden;break-inside:avoid} .s h3,.res h3{margin:0;background:var(--c);color:#fff;font-size:14px;padding:7px 10px} ul{margin:8px 0;padding-inline-start:22px;font-size:13px;line-height:1.7} .e{color:#94a3b8;margin:8px 12px}
      .res{--c:#0f766e;margin-top:12px;border:2px solid var(--c);border-radius:10px;overflow:hidden;break-inside:avoid;background:#f0fdfa}
      .toc{border:1.5px solid #cbd5e1;border-radius:10px;padding:10px 14px;margin-bottom:12px} .toc b{color:#9b1c1c}
      .ft{margin-top:14px;color:#64748b;font-size:11px;text-align:center}</style></head><body>
      ${items.length > 1 ? `<div class="toc"><b>تقرير التحليل${sub ? ` — ${esc(sub)}` : ''}</b><div>مراحل التحليل: ${items.map((x, i) => `${i + 1}. ${esc(x.T.n)}`).join(' ← ')}</div></div>` : ''}
      ${items.map(one).join('')}
      <div class="ft">SES - SADEN ERP SYSTEM — أدوات تحليل</div><script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
    w.document.close();
  }

  return { viewAnalysis };
};
