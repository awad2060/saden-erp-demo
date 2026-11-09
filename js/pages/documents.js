'use strict';
/* صفحة «documents» (viewDocs) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['documents'] = function (S) {
  const { $, $$, DOC_MONTHS, SF, api, askYesNo, chip, docTypesCfg, downloadXlsx, esc, head, icon, ion, loadPdfLib, shell, toast } = S;
  async function viewDocs(query, mode = 'docs') {
    /* حالة الصفحة: ما يتغير بعد العرض (body) */
    const vs = {};
    /* نفس الشاشة لصفحتين: وثائق ومستندات، و«مدد وحماية الأجور» في الرواتب */
    const WPS = mode === 'wps',
      BASE = WPS ? '#/wps' : '#/docs',
      WPS_T = 'شهادة الالتزام بحماية الأجور';
    const main = shell('<div class="empty">جاري التحميل...</div>', BASE);
    const d = await api('GET', '/api/docs');
    d.branchDocs = d.branchDocs || [];
    d.companyDocs = d.companyDocs || [];
    /* الفرع (اطلاع فقط): مستندات فرعه */
    const ro = !!d.readOnly;
    if (ro) query = { ...query, tab: 'branchDocs', b: d.myBranch };
    const tab = WPS
      ? !query.co
        ? 'home'
        : 'wpsCo'
      : ro
        ? 'branchDocs'
        : !query.co
          ? 'home'
          : query.tab === 'branches'
            ? 'branchDocs'
            : query.tab === 'company'
              ? 'companyDocs'
              : 'allDocs';
    const days = (iso) => (iso ? Math.round((new Date(`${iso}T00:00:00`) - new Date(`${d.today}T00:00:00`)) / 86400000) : null);
    /* المتبقي: شهور وأيام */
    const left = (...args) => docsLeft(d, days, ...args);
    const st = (iso, soon) => {
      const n = days(iso);
      if (n === null) return ['غير محدد', ''];
      if (n < 0) return ['منتهي', 'bad'];
      if (n <= soon) return ['قريب الانتهاء', 'warn'];
      return ['ساري', 'ok'];
    };
    const chip = ([t, c]) => `<span class="chip doc-${c || 'na'}">${t}</span>`;
    const fd = (iso) => (iso ? esc(SF.fmtDate(iso)) : '—');
    const tile = (n, l, cls = '') => `<div class="card doc-tile ${cls}"><b>${n}</b><small>${l}</small></div>`;
    /* الأنواع المطلوبة: لكل فرع، وللشركة */
    const BR_REQ = docTypesCfg().branch.slice();
    const CO_REQ = docTypesCfg().company.filter((t) => t !== 'شهادة الالتزام بحماية الأجور');
    if (WPS) CO_REQ.splice(0, CO_REQ.length, WPS_T);
    /* أسماء قديمة لنفس النوع */
    const ALIAS = {
      'رخصة البلدية': 'رخصة بلدي',
      'شهادة الدفاع المدني': 'ترخيص الدفاع المدني',
      'عضوية الغرفة التجارية': 'اشتراك الغرفة التجارية',
      'سجل تجاري فرعي': 'السجل التجاري',
      'سجل تجاري': 'السجل التجاري',
      'شهادة SAC': 'شهادة ساك',
      ساك: 'شهادة ساك',
      'شهادة حماية الأجور': 'شهادة الالتزام بحماية الأجور',
      'الالتزام بحماية الأجور': 'شهادة الالتزام بحماية الأجور',
    };
    /* أيقونة كل صنف في كروت لوحة المتابعة */
    const DOC_IC = {
      'شهادة الاستثمار': '💼',
      'شهادة المنشآت الصغيرة والمتوسطة': '🏪',
      'هيئة المهندسين': '📐',
      'المحتوى المحلي': '🇸🇦',
      'تصنيف الشركة': '🏅',
      'ضريبة القيمة المضافة': '🧾',
      'الزكاة والدخل': '🕌',
      'استيفاء المعايير الفنية': '✅',
      'شهادات ISO': '🎖',
      'شهادة الالتزام بحماية الأجور': '🛡',
      'السجل التجاري': '📜',
      'رخصة بلدي': '🏙',
      'ترخيص الدفاع المدني': '🧯',
      'اشتراك الغرفة التجارية': '🤝',
      'شهادة ساك': '🔬',
    };
    const typeOf = (t) => ALIAS[String(t || '').trim()] || String(t || '').trim();
    /* الشهادة تخص شاشة الرواتب، وباقي المستندات تخص وثائق ومستندات */
    d.companyDocs = d.companyDocs.filter((x) => (typeOf(x.type) === WPS_T) === WPS);
    /* الشركات: كل مستند شركة يتبع شركة (القديم بلا شركة يتبع الشركة الرئيسية) */
    const COS = d.companies || [];
    const coOf = (x) => (x.company ? (d.coAlias || []).reduce((n, [k, v]) => (n.includes(k) ? v : n), x.company) : d.mainCompany || '');
    const coAl = (n) => {
      const t = String(n || '').trim();
      const x = (d.coAlias || []).find(([k]) => t.includes(k));
      return x ? x[1] : t;
    };
    const coKey = (n) =>
      coAl(n)
        .replace(/^(شركة|مؤسسة)\s+/, '')
        .replace(/\s*(شخص واحد|ذات مسؤولية محدودة)\s*$/, '')
        .trim();
    const sameCo = (a, b) => {
      const x = coKey(a),
        y = coKey(b);
      return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
    };
    /* سجلات الشركة التجارية: باسمها، وسجلات فروع الشركة الرئيسية (تصنيف «فروع سادن المتخصصة») */
    const crsOf = (c) => d.crs.filter((x) => sameCo(x.entity, c) || (c === d.mainCompany && /فروع/.test(x.category || '')));
    const CO = COS.includes(query.co) ? query.co : docsValue3(COS, d);
    const DOC_STATUS = ['ساري', 'معلق', 'قيد التجديد', 'قيد الإصدار', 'ملغي'];
    /* الحالة: اليدوية (معلق / ملغي / قيد التجديد / قيد الإصدار) تتقدم، وإلا من تاريخ الانتهاء */
    const stx = (...args) => docsStx(days, st, ...args);
    const files = (kind, x) =>
      (x.files || [])
        .map(
          (fl) =>
            `<a href="/api/docs/${kind}/${x.id}/files/${fl.id}" target="_blank" rel="noopener" class="doc-fl" title="${esc(fl.name)}">${/\.pdf$/i.test(fl.name) ? '📄' : '📎'}</a>`,
        )
        .join('') || '<span class="muted">—</span>';
    const facName = (id) => ((d.facilities || []).find((f) => f.id === id) || {}).name || '';
    vs.body = '';
    /* وثائق الفروع تتبع شركة (القديم بلا شركة يتبع الشركة الرئيسية) */
    const brCoOf = (x) => x.company || d.mainCompany || '';
    /* صف مستند: أيقونة واسم ورقم | تاريخ الانتهاء | المتبقي | الحالة | معاينة الملف | تعديل / إضافة */
    const docTile = (...args) => docsDocTile(chip, days, fd, left, ...args);
    /* شريط الفلترة: بحث + حالة، على عناصر data-fst / data-fq داخل الصفحة */
    const FST = ['ساري', 'قريب الانتهاء', 'منتهي', 'معلق', 'قيد التجديد', 'قيد الإصدار', 'ناقص'];
    const filterBar = (ph) =>
      `<div class="dt-filter"><span class="dt-fq">${icon('search')}<input type="search" class="in" id="dtQ" placeholder="${esc(ph)}" autocomplete="off"></span><span class="dt-fs" id="dtS"></span></div>`;
    const wireFilter = (...args) => docsWireFilter(FST, ...args);
    /* مصغّرات أول صفحة من ملفات PDF، وفتح المعاينة كاملة */
    const wirePreviews = (...args) => docsWirePreviews(...args);
    viewDocsPart2();
    const YR = String(new Date().getFullYear());
    /* فروع الشركة: الرئيسية = فروع النظام؛ وغيرها = الفروع المسجلة لها */
    const brsOf = (c) =>
      [
        ...new Set([...d.branchDocs.filter((x) => brCoOf(x) === c).map((x) => x.branch), ...(c === d.mainCompany ? d.branches || [] : [])]),
      ].filter((b) => b && !/^(الإدارة|الورشة|قسم الحفر|المكتب الفني)$/.test(b));
    const brCr = (c, b) => crsOf(c).find((y) => String(y.entity || '').includes(b));
    /* سجل فرع: اسم فرع من فروع الشركة في اسم السجل — يظهر داخل الفرع، والباقي سجلات الشركة */
    const crBranch = (c, x) => brsOf(c).find((b) => String(x.entity || '').includes(b)) || '';
    /* كل حالات الشركة: مستنداتها + سجلاتها + مدد + فروعها (الناقص من المطلوب) */
    const coStats = (...args) => docsCoStats(CO_REQ, WPS, brCoOf, brsOf, coOf, crsOf, d, days, sameCo, st, stx, typeOf, ...args);
    if (tab === 'home') {
      /* الصفحة الأولى: كارت لكل شركة */
      const S0 = COS.map((c) => [c, coStats(c)]);
      const tot = (k) => S0.reduce((a, [, x]) => a + x.n(k), 0);
      vs.body = `<div class="doc-tiles">${tile(COS.length, 'الشركات')}${docsValue7(S0, tile)}${tile(tot('ساري'), 'سارية', 'ok')}${tile(tot('قريب الانتهاء'), 'قريبة الانتهاء', 'warn')}${tile(tot('منتهي'), 'منتهية', 'bad')}${tile(tot('معلق'), 'معلقة', 'hold')}${tile(tot('ناقص'), 'مستندات شركات ناقصة')}</div>
        ${filterBar('ابحث باسم الشركة...')}
        <div class="ap-grid co-apgrid">${docsHtml11(BASE, S0)}</div>
        <div class="hint" style="margin-top:12px">لون المربع: 🟢 كل المستندات سارية · 🟠 يوجد ما يقترب انتهاؤه أو معلق · 🔴 يوجد مستند منتهٍ · ⚪ لا توجد مستندات — والرقم الأحمر = عدد ما يحتاج متابعة</div>`;
    } else if (tab === 'wpsCo') {
      /* مدد وحماية الأجور لشركة: اشتراك مدد، شهادة الالتزام بحماية الأجور (مع المعاينة)، نسبة الالتزام الشهرية */
      const X = coStats(CO),
        coMd = d.mudad.find((x) => sameCo(x.name, CO)),
        coCp = d.compliance.find((x) => sameCo(x.name, CO));
      const cert = d.companyDocs
        .filter((x) => coOf(x) === CO)
        .sort((p, q) => String(q.expiry || '').localeCompare(String(p.expiry || '')))[0];
      vs.body = `<div class="co-top"><h2>${ion('business-outline') || '🏢'} ${esc(CO)}</h2></div>
        <div class="doc-tiles">${tile(X.n('ساري'), 'سارية', 'ok')}${tile(X.n('قريب الانتهاء'), 'قريبة الانتهاء', 'warn')}${tile(X.n('منتهي'), 'منتهية', 'bad')}${tile(X.miss, 'ناقصة')}</div>
        <h3 class="dc-sec">🛡 الاشتراك والشهادة</h3><div class="dt-list">
          ${docsValue2(coMd, docTile, st)}
          ${docsHtml(CO, WPS_T, cert, docTile, stx)}
        </div>
        <h3 class="dc-sec">📊 نسبة الالتزام في مدد</h3><div class="dc-grid">
            ${docsHtml8(YR, coCp)}
          </div>`;
    } else if (docsValue4(tab)) {
      /* صفحة الشركة: رأس + تبويبا وثائق الشركة / وثائق الفروع */
      const X = coStats(CO),
        brs = brsOf(CO);
      const subTabs = `<div class="co-top"><h2>${ion('business-outline') || '🏢'} ${esc(CO)}</h2></div>
        <div class="doc-tiles">${tile(X.total, 'مستندات الشركة')}${tile(X.n('ساري'), 'سارية', 'ok')}${tile(X.n('قريب الانتهاء'), 'قريبة الانتهاء', 'warn')}${tile(X.n('منتهي'), 'منتهية', 'bad')}${tile(X.n('معلق'), 'معلقة', 'hold')}${tile(X.miss, 'مستندات ناقصة')}</div>
        <div class="gtabs" style="overflow-y:hidden"><a class="gtab${tab === 'allDocs' ? ' on' : ''}" href="${BASE}?co=${encodeURIComponent(CO)}">${icon('layers')}ملخص</a><a class="gtab${tab === 'companyDocs' ? ' on' : ''}" href="${BASE}?co=${encodeURIComponent(CO)}&tab=company">${icon('award')}وثائق الشركة</a><a class="gtab${tab === 'branchDocs' ? ' on' : ''}" href="${BASE}?co=${encodeURIComponent(CO)}&tab=branches">${icon('building')}وثائق الفروع <small class="muted">(${brs.length})</small></a></div>`;
      if (tab === 'allDocs') {
        /* كل ما يخص الشركة في قائمة واحدة: الأقرب انتهاءً أولاً (المنتهي في الأعلى، وبدون تاريخ في الآخر) */
        const rows = docsHtml5(CO, DOC_IC, brCoOf, coOf, crBranch, crsOf, d, docTile, st, stx, typeOf).sort((a, b) =>
          String(a.date || '9999').localeCompare(String(b.date || '9999')),
        );
        vs.body = `${subTabs}${filterBar('ابحث في كل مستندات الشركة: الاسم، الرقم، الفرع، جهة الإصدار...')}
          <h3 class="dc-sec">🗂 ملخص المستندات <small class="muted">(${rows.length}) — الأقرب انتهاءً أولاً</small></h3>
          <div class="dt-list">${rows.map((r) => r.html).join('') || '<div class="card empty">لا توجد مستندات لهذه الشركة بعد</div>'}</div>`;
      } else if (tab === 'companyDocs') {
        const coCard = (t) => {
          const L = d.companyDocs
            .filter((x) => coOf(x) === CO && typeOf(x.type) === t)
            .sort((p, q) => String(q.expiry || '').localeCompare(String(p.expiry || '')));
          const x = L[0],
            sx = x ? stx(x, 60) : ['غير مضاف', 'na'];
          return `<div class="dc-card dc-${sx[1] || 'na'}${x ? '' : ' dc-miss'}"><div class="dc-h"><span class="dc-ic">${DOC_IC[t] || '📄'}</span><b>${esc(t)}</b></div>
            <div class="dc-st">${chip(sx)}${x && (x.files || []).length ? files('companyDocs', x) : ''}</div>
            <div class="dc-meta">${x ? `${x.number ? `<span dir="ltr">${esc(x.number)}</span><br>` : ''}${x.expiry ? `ينتهي ${fd(x.expiry)}<br><small>${left(x.expiry)}</small>` : '<small>بدون تاريخ انتهاء</small>'}` : '<small>لم تضفه بعد</small>'}</div>
            <div class="dc-act">${x ? `<button type="button" class="btn sm ghost" data-ced="${x.id}">${icon('pencil')} تعديل</button>` : `<button type="button" class="btn sm" data-cadd="${esc(t)}" data-cco="${esc(CO)}">＋ إضافة</button>`}</div></div>`;
        };
        const coCrs = crsOf(CO).filter((x) => !crBranch(CO, x));
        vs.body = `${subTabs}
          ${filterBar('ابحث باسم المستند أو الرقم أو جهة الإصدار...')}
          <h3 class="dc-sec">📑 مستندات الشركة</h3><div class="dt-list">${docsHtml6(CO, CO_REQ, DOC_IC, coOf, d, docTile, stx, typeOf)}</div>
          <h3 class="dc-sec">📜 السجلات التجارية للشركة <small class="muted">(${coCrs.length}) — سجلات الفروع داخل كل فرع</small> <button type="button" class="btn sm" data-cradd style="margin-inline-start:8px">＋ سجل تجاري</button></h3><div class="dt-list">
            ${docsHtml2(coCrs, docTile, st)}
          </div>`;
      } else {
        /* وثائق الفروع: الفروع أيقونات، وداخل الفرع وثائقه صفوفاً (الأصناف المطلوبة + أي وثيقة أخرى) */
        const fb = query.b || '';
        const B = d.branchDocs.filter((x) => brCoOf(x) === CO);
        /* وثيقة الصنف للفرع (الأحدث)، والسجل التجاري يُقبل من سجلات الشركة */
        const docOf = (b, t) =>
          B.filter((x) => x.branch === b && typeOf(x.type) === t).sort((p, q) =>
            String(q.expiry || '').localeCompare(String(p.expiry || '')),
          )[0];
        const brStats = (b) => {
          const sts = BR_REQ.map((t) => {
            const x = docOf(b, t);
            if (x) return stx(x, 60)[0];
            if (t === 'السجل التجاري') {
              const cr = brCr(CO, b);
              if (cr) return st(cr.expiry, 90)[0];
            }
            return 'ناقص';
          });
          B.filter((x) => x.branch === b && !BR_REQ.includes(typeOf(x.type))).forEach((x) => sts.push(stx(x, 60)[0]));
          const n = (k) => sts.filter((v) => v === k).length;
          return {
            n,
            total: sts.length - n('ناقص'),
            miss: n('ناقص'),
            att: n('منتهي') + n('قريب الانتهاء') + n('معلق'),
            cls: n('منتهي') ? 'bad' : n('قريب الانتهاء') || n('معلق') ? 'warn' : n('ناقص') ? 'na' : 'ok',
          };
        };
        if (!fb) {
          vs.body = `${subTabs}${docsHtml3(BASE, CO, brStats, brs, filterBar)}`;
        } else {
          const others = B.filter((x) => x.branch === fb && !BR_REQ.includes(typeOf(x.type))).sort((a, b) =>
            String(a.expiry || '9').localeCompare(String(b.expiry || '9')),
          );
          const subOf = (x) =>
            [
              x.number && `<span dir="ltr">${esc(x.number)}</span>`,
              x.issuer && esc(x.issuer),
              x.title && esc(x.title),
              facName(x.facilityId) && esc(facName(x.facilityId)),
            ]
              .filter(Boolean)
              .join(' · ');
          vs.body = `${subTabs}<div class="co-top"><h2>${ion('storefront-outline') || '🏢'} فرع ${esc(fb)}</h2><a class="btn sm ghost" href="#/facilities?b=${encodeURIComponent(fb)}">🏢 الفرع في المنشآت</a></div>
            ${filterBar('ابحث باسم الوثيقة أو الرقم أو جهة الإصدار...')}
            <h3 class="dc-sec">📑 وثائق الفرع</h3><div class="dt-list">${docsHtml7(BR_REQ, CO, DOC_IC, brCr, docOf, docTile, fb, st, stx, subOf)}</div>
            ${others.length ? `<h3 class="dc-sec">🗂 وثائق أخرى للفرع <small class="muted">(${others.length})</small></h3><div class="dt-list">${others.map((x) => docTile({ ic: DOC_IC[typeOf(x.type)], name: x.type, sub: subOf(x), expiry: x.expiry, sx: stx(x, 60), kind: 'branchDocs', x, edit: `<button type="button" class="btn sm ghost" data-bed="${x.id}">${icon('pencil')} تعديل</button>` })).join('')}</div>` : ''}`;
        }
      }
    } else {
      /* الفرع (اطلاع فقط): مستندات فرعه */
      const L = d.branchDocs.slice().sort((a, b) => String(a.expiry || '9').localeCompare(String(b.expiry || '9')));
      const cnt = (k) => L.filter((x) => stx(x, 60)[0] === k).length;
      vs.body = `<div class="doc-tiles">${tile(L.length, `وثائق فرع ${esc(d.myBranch)}`)}${tile(cnt('ساري'), 'سارية', 'ok')}${tile(cnt('قريب الانتهاء'), 'تنتهي خلال 60 يوم', 'warn')}${tile(cnt('منتهي'), 'منتهية', 'bad')}${tile(cnt('معلق'), 'معلقة', 'hold')}</div>
        ${L.length ? `<div class="dt-list">${L.map((x) => docTile({ ic: DOC_IC[typeOf(x.type)], name: x.type, sub: [x.number && `<span dir="ltr">${esc(x.number)}</span>`, x.issuer && esc(x.issuer)].filter(Boolean).join(' · '), expiry: x.expiry, sx: stx(x, 60), kind: 'branchDocs', x, edit: '' })).join('')}</div>` : '<div class="card empty">لا توجد مستندات مسجلة لفرعك بعد</div>'}`;
    }
    main.innerHTML = `${docsValue(WPS, d, ro, tab)}${vs.body}`;
    wirePreviews(main);
    wireFilter(main);
    /* نافذة الإضافة والتعديل */
    const F = {
      mudad: docsValue6(),
      crs: docsHtml10(d),
      branchDocs: docsHtml4(BR_REQ, COS, DOC_STATUS, d),
      companyDocs: docsHtml9(COS, CO_REQ, DOC_STATUS, d),
    };
    const edit = (kind, x) => {
      x = x || {};
      if (!x.id && x.preset) x = { ...x.preset };
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      const fld = ([k, l, t, opts]) =>
        `<div class="field${t === 'area' ? ' full' : ''}"><label>${l}</label>${
          t === 'area'
            ? `<textarea class="in" name="${k}" rows="2">${esc(x[k] || '')}</textarea>`
            : t === 'fac'
              ? `<select class="in" name="${k}"><option value="">— بدون —</option>${(d.facilities || []).map((o) => `<option value="${esc(o.id)}" data-br="${esc(o.branch)}"${o.id === x[k] ? ' selected' : ''}>${esc(o.name)}</option>`).join('')}</select>`
              : t === 'sel'
                ? `<select class="in" name="${k}"><option value="">—</option>${opts.map((o) => `<option${o === (x[k] || (k === 'branch' ? query.b : '')) ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`
                : `<input class="in" name="${k}" ${t === 'date' ? 'type="date"' : ''}${t === 'list' ? ` list="dl-${k}"` : ''} value="${esc(x[k] || '')}"${['unified', 'laborNo', 'iban', 'cr', 'hijri'].includes(k) ? ' dir="ltr"' : ''}>${t === 'list' ? `<datalist id="dl-${k}">${opts.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}`
        }</div>`;
      bg.innerHTML = `<form class="modal" style="max-width:820px;width:96%" novalidate><h3 style="margin-top:0">${x.id ? '✏️ تعديل' : '➕ إضافة'} — ${editValue(kind)}</h3>
        <div class="grid2">${F[kind].map(fld).join('')}</div>
        ${
          ['branchDocs', 'companyDocs', 'crs'].includes(kind)
            ? `<div class="field full doc-files"><label>ملف المستند (PDF أو صورة)${(x.files || []).length ? ' <small class="muted">— لإضافة ملف آخر أو استبداله</small>' : '<span class="req">*</span> <small class="muted">— إلزامي</small>'}</label>${
                x.id
                  ? `<div class="fu-fl-list" id="bdFiles">${(x.files || []).map((fl) => `<span class="fu-file"><a href="/api/docs/${kind}/${x.id}/files/${fl.id}" target="_blank" rel="noopener">📎 ${esc(fl.name)}</a><button type="button" class="fu-fdel" data-bdel="${fl.id}" aria-label="حذف ${esc(fl.name)}">✕</button></span>`).join('') || '<span class="muted">لا توجد ملفات</span>'}</div>
`
                  : ''
              }<input type="file" class="in" name="docFile" accept=".pdf,.png,.jpg,.jpeg" style="margin-top:6px"><div class="hint">PDF أو صورة (PNG / JPG) — يظهر في المعاينة</div></div>`
            : ''
        }<div class="merr"></div>
        <div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button>${x.id ? '<button type="button" class="btn ghost" data-del>🗑 حذف</button>' : ''}<button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
      document.body.appendChild(bg);
      const f = $('form', bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      if ($('[data-del]', bg))
        $('[data-del]', bg).onclick = async () => {
          if (!(await askYesNo(`حذف «${x.name || x.entity || x.type}»؟`))) return;
          try {
            await api('DELETE', `/api/docs/${kind}/${x.id}`);
            bg.remove();
            viewDocs(query);
          } catch (e) {
            toast(e.message, true);
          }
        };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const b = Object.fromEntries(F[kind].map(([k]) => [k, f[k].value]));
        const withFile = ['branchDocs', 'companyDocs', 'crs'].includes(kind),
          fl = withFile && f.docFile ? f.docFile.files[0] : null;
        /* رفع ملف المستند إلزامي */
        if (withFile && !fl && !(x.files || []).length) {
          $('.merr', bg).innerHTML = '<div class="err">ارفع ملف المستند (PDF أو صورة) — إلزامي</div>';
          return;
        }
        if (fl && !/\.(pdf|png|jpe?g)$/i.test(fl.name)) {
          $('.merr', bg).innerHTML = '<div class="err">ملف المستند يكون PDF أو صورة (PNG / JPG)</div>';
          return;
        }
        const btn = $('button.primary', f);
        btn.disabled = true;
        let r = null;
        try {
          r = await api(x.id ? 'PUT' : 'POST', x.id ? `/api/docs/${kind}/${x.id}` : `/api/docs/${kind}`, b);
          if (fl) {
            const res = await fetch(`/api/docs/${kind}/${(r && r.id) || x.id}/files?name=${encodeURIComponent(fl.name)}`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: fl,
            });
            let j = null;
            try {
              j = await res.json();
            } catch {
              /* تجاهل */
            }
            if (!res.ok) {
              /* مستند جديد بدون ملف لا يبقى */
              if (!x.id && r && r.id) {
                await onsubmitPart(kind, r);
              }
              throw new Error((j && j.error) || `تعذر رفع ${fl.name}`);
            }
          }
          bg.remove();
          toast('تم الحفظ');
          await viewDocs(query);
        } catch (err) {
          btn.disabled = false;
          $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
      /* المبنى: مباني الفرع المختار فقط */
      if (['branchDocs', 'companyDocs', 'crs'].includes(kind)) {
        if (kind === 'branchDocs') {
          const syncFac = () => {
            const b = f.branch.value;
            $$('option[data-br]', f.facilityId).forEach((o) => {
              o.hidden = o.dataset.br !== b;
              if (o.hidden && o.selected) f.facilityId.value = '';
            });
          };
          f.branch.onchange = syncFac;
          syncFac();
        }
        if ($('#bdUp', bg))
          $('#bdUp', bg).onchange = async (e) => {
            for (const file of e.target.files) {
              try {
                const res = await fetch(`/api/docs/${kind}/${x.id}/files?name=${encodeURIComponent(file.name)}`, {
                  method: 'POST',
                  credentials: 'same-origin',
                  headers: { 'Content-Type': 'application/octet-stream' },
                  body: file,
                });
                let j = null;
                try {
                  j = await res.json();
                } catch {
                  /* تجاهل */
                }
                if (!res.ok) throw new Error((j && j.error) || `تعذر رفع ${file.name}`);
                (x.files = x.files || []).push(j);
              } catch (er) {
                toast(er.message, true);
              }
            }
            bg.remove();
            await viewDocs(query);
            edit(kind, x);
          };
        $$('[data-bdel]', bg).forEach((btn) => {
          btn.onclick = async () => {
            if (!(await askYesNo('حذف الملف؟'))) return;
            try {
              await api('DELETE', `/api/docs/${kind}/${x.id}/files/${btn.dataset.bdel}`);
              x.files = (x.files || []).filter((fl) => fl.id !== btn.dataset.bdel);
              bg.remove();
              await viewDocs(query);
              edit(kind, x);
            } catch (er) {
              toast(er.message, true);
            }
          };
        });
      }
      $('input, textarea', f).focus();
    };
    if ($('#dcNew'))
      $('#dcNew').onclick = () =>
        edit(
          tab === 'branchDocs' ? 'branchDocs' : 'companyDocs',
          tab === 'branchDocs' ? { preset: { company: CO, branch: query.b || '', type: query.t || '' } } : { preset: { company: CO } },
        );
    /* لوحة المتابعة: تعديل / إضافة من المصفوفة وقائمة الشركة */
    wireDocs(CO, d, edit, main);
    const CO_SEL = COS.includes(query.co) ? query.co : docsValue5(COS, d);
    wireDocs2(CO_SEL, d, edit, main);
    /* نسب الالتزام الشهرية للشركة المختارة (تُحفظ ضمن قائمة كل المنشآت) */
    $$('[data-cpd]', main).forEach((b) => {
      b.onclick = () => {
        const yr = String(new Date().getFullYear());
        const cur = d.compliance.find(
          (x) =>
            coKey(x.name) &&
            (coKey(x.name) === coKey(CO_SEL) || coKey(x.name).includes(coKey(CO_SEL)) || coKey(CO_SEL).includes(coKey(x.name))),
        );
        const vals = cur ? ((cur.years || {})[yr] || []).slice(0, 12) : [];
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = `<form class="modal" style="max-width:720px;width:96%"><h3 style="margin-top:0">📊 نسبة الالتزام في مدد — ${esc(CO_SEL)}</h3>
        <div class="row" style="gap:8px;margin-bottom:10px"><label>السنة</label><select class="in" name="yr" style="width:auto">${[
          ...new Set([yr, String(Number(yr) - 1), ...Object.keys((cur && cur.years) || {})]),
        ]
          .sort()
          .reverse()
          .map((y) => `<option${y === yr ? ' selected' : ''}>${y}</option>`)
          .join('')}</select></div>
        <div class="dc-cpg">${DOC_MONTHS.map((m, i) => `<label>${esc(m)}<input class="in" type="number" min="0" max="100" step="0.1" data-m="${i}" value="${vals[i] === null || vals[i] === undefined ? '' : vals[i]}"></label>`).join('')}</div>
        <div class="hint">النسبة من 0 إلى 100. اترك الشهر فارغاً إذا لم تسجّله بعد.</div><div class="merr"></div>
        <div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
        document.body.appendChild(bg);
        const f = $('form', bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        f.yr.onchange = () => {
          const v = cur ? (cur.years || {})[f.yr.value] || [] : [];
          $$('[data-m]', f).forEach((inp, i) => {
            inp.value = v[i] === null || v[i] === undefined ? '' : v[i];
          });
        };
        f.onsubmit = async (e) => {
          e.preventDefault();
          const y = f.yr.value,
            mine = $$('[data-m]', f).map((inp) => inp.value);
          const list = d.compliance.map((x) => ({
            id: x.id,
            name: x.name,
            laborNo: x.laborNo,
            unified: x.unified,
            vals: x === cur ? mine : ((x.years || {})[y] || Array(12).fill('')).map((v) => (v === null ? '' : v)),
          }));
          if (!cur) list.push({ id: '', name: CO_SEL, laborNo: '', unified: '', vals: mine });
          try {
            await api('PUT', '/api/docs/compliance', { year: y, list });
            bg.remove();
            toast('تم حفظ نسب الالتزام');
            viewDocs(query);
          } catch (err) {
            $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      };
    });
    viewDocsPart();
    if ($('#dcBr'))
      $('#dcBr').onchange = (e) => {
        location.hash = `${BASE}?co=${encodeURIComponent(CO)}&tab=branches${e.target.value ? `&b=${encodeURIComponent(e.target.value)}` : ''}${query.t ? `&t=${encodeURIComponent(query.t)}` : ''}`;
      };
    viewDocsPart3(d, edit, main, ro, tab);
    /* نسبة الالتزام: إضافة منشأة وحفظ */
    if (tab === 'compliance') {
      $('#dcY').onchange = () => {
        location.hash = `#/docs?tab=compliance&y=${$('#dcY').value}`;
      };
      $('#dcAddE').onclick = () =>
        $('#dcBody').insertAdjacentHTML(
          'beforeend',
          `<tr data-e=""><td><input class="in" data-f="name" placeholder="اسم المنشأة"></td><td><input class="in" data-f="laborNo" dir="ltr"></td><td><input class="in" data-f="unified" dir="ltr"></td><td class="doc-avg">—</td>${DOC_MONTHS.map((_, i) => `<td><input class="in doc-pc" data-m="${i}" type="number" min="0" max="100" step="0.1"></td>`).join('')}</tr>`,
        );
      $('#dcSaveC').onclick = async () => {
        const list = $$('#dcBody tr').map((tr) => ({
          id: tr.dataset.e,
          name: $('[data-f=name]', tr).value,
          laborNo: $('[data-f=laborNo]', tr).value,
          unified: $('[data-f=unified]', tr).value,
          vals: $$('[data-m]', tr).map((i) => i.value),
        }));
        try {
          await api('PUT', '/api/docs/compliance', { year: $('#dcY').value, list });
          toast('تم حفظ نسب الالتزام');
          viewDocs(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    }
    /* Excel لكل تبويب */
    if ($('#dcXls'))
      $('#dcXls').onclick = () => {
        if (tab === 'allDocs')
          return downloadXlsx(
            `مستندات-${CO}.xlsx`,
            [
              ['المستند', 'يخص', 'الرقم', 'جهة الإصدار', 'الانتهاء', 'المتبقي', 'الحالة'],
              ...d.companyDocs
                .filter((x) => coOf(x) === CO)
                .map((x) => [x.type, 'الشركة', x.number, x.issuer, x.expiry, x.expiry ? left(x.expiry) : '', stx(x, 60)[0]]),
              ...crsOf(CO).map((x) => ['سجل تجاري', x.entity, x.cr, '', x.expiry, x.expiry ? left(x.expiry) : '', st(x.expiry, 90)[0]]),
              ...d.branchDocs
                .filter((x) => brCoOf(x) === CO)
                .map((x) => [x.type, `فرع ${x.branch}`, x.number, x.issuer, x.expiry, x.expiry ? left(x.expiry) : '', stx(x, 60)[0]]),
            ],
            'ملخص',
          );
        if (tab === 'companyDocs') return downloadXlsx('مستندات-الشركات.xlsx', partHtml2(CO, coOf, d, left, stx), 'مستندات الشركة');
        if (tab === 'mudad') downloadXlsx('اشتراكات-مدد.xlsx', partValue(d, left, st), 'اشتراكات مدد');
        else if (tab === 'crs') downloadXlsx('السجلات-التجارية.xlsx', partHtml(d, left, st), 'السجلات التجارية');
        else if (tab === 'branchDocs')
          downloadXlsx(
            'وثائق-الفروع.xlsx',
            [
              partValue2(),
              ...d.branchDocs
                .filter((x) => (x.company || d.mainCompany) === CO && (!query.b || x.branch === query.b))
                .map((x) => [
                  x.branch,
                  x.type,
                  x.title,
                  x.number,
                  x.issuer,
                  facName(x.facilityId),
                  x.issue,
                  x.expiry,
                  x.expiry ? left(x.expiry) : '',
                  stx(x, 60)[0],
                  (x.files || []).length,
                  x.notes,
                ]),
            ],
            'مستندات الفروع',
          );
        else {
          const y = $('#dcY').value;
          downloadXlsx(
            `نسبة-الالتزام-${y}.xlsx`,
            [
              ['المنشأة', 'رقم مكتب العمل', 'الرقم الموحد', ...DOC_MONTHS],
              ...d.compliance.map((e) => [e.name, e.laborNo, e.unified, ...((e.years || {})[y] || []).map((v) => (v === null ? '' : v))]),
            ],
            `الالتزام ${y}`,
          );
        }
      };
  }
  /* جزء من onsubmit: try {… */
  async function onsubmitPart(kind, r) {
    try {
      await api('DELETE', `/api/docs/${kind}/${r.id}`);
    } catch {
      /* تجاهل */
    }
  }
  /* أجزاء صفحة الوثائق (1) (documents-kit.js) */
  const {
    docsValue3,
    viewDocsPart2,
    docsValue4,
    docsValue,
    docsValue6,
    docsHtml10,
    docsHtml4,
    docsHtml9,
    wireDocs,
    docsValue5,
    wireDocs2,
    viewDocsPart,
    viewDocsPart3,
    docsLeft,
    docsStx,
    docsDocTile,
    docsWireFilter,
    docsWirePreviews,
    docsCoStats,
    docsValue7,
    docsHtml11,
    docsValue2,
    docsHtml,
    docsHtml8,
    docsHtml5,
    docsHtml6,
    docsHtml2,
    docsHtml3,
    docsHtml7,
    editValue,
    partHtml2,
    partValue,
    partHtml,
    partValue2,
  } = window.SES_PAGE_KITS['documents'](S, {});

  return { viewDocs };
};
