'use strict';
/* أجزاء صفحة الوثائق (1) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['documents'] = function (S, ctx) {
  const { $, $$, DOC_MONTHS, esc, head, icon, ion, loadPdfLib } = S;
  /* جزء من viewDocs: tile(… */
  function docsValue7(S0, tile) {
    return tile(
      S0.reduce((a, [, x]) => a + x.total, 0),
      'كل المستندات',
    );
  }
  /* جزء من viewDocs: S0.map(([c, x]) => {… */
  function docsHtml11(BASE, S0) {
    return S0.map(([c, x]) => {
      const att = x.n('منتهي') + x.n('قريب الانتهاء') + x.n('معلق');
      const hue = { ok: '#059669', warn: '#d97706', bad: '#dc2626', na: '#64748b' }[x.cls];
      return `<a class="ap-t" data-fst="${{ ok: 'ساري', warn: 'قريب الانتهاء', bad: 'منتهي', na: 'ناقص' }[x.cls]}" data-fq="${esc(c.toLowerCase())}" href="${BASE}?co=${encodeURIComponent(c)}" title="${esc(`${c} — ${x.total} مستند${att ? ` · ${att} تحتاج متابعة` : ''}${x.miss ? ` · ${x.miss} ناقص` : ''}`)}"><span class="ap-g" style="--a:${hue};--b:${hue};--c:${hue};--m:${hue}"><i class="ap-x"></i><i class="ap-y"></i>${ion('business-outline') || icon('building')}</span><span class="ap-l">${esc(c)}<small>${x.total} مستند${x.miss ? ` · ${x.miss} ناقص` : ''}</small></span>${att ? `<span class="ap-b">${att > 99 ? '99+' : att}</span>` : ''}</a>`;
    }).join('');
  }
  /* جزء من viewDocs: [… */
  function docsHtml10(d) {
    return [
      ['entity', 'الجهة / الفرع *'],
      ['category', 'التصنيف', 'list', [...new Set(d.crs.map((x) => x.category).filter(Boolean))]],
      ['unified', 'الرقم الموحد'],
      ['cr', 'السجل التجاري'],
      ['hijri', 'تاريخ الانتهاء هجري (يوم/شهر/سنة)'],
      ['expiry', 'تاريخ الانتهاء ميلادي', 'date'],
      ['type', 'نوع السجل', 'list', [...new Set(d.crs.map((x) => x.type).filter(Boolean))]],
      ['notes', 'ملاحظات', 'area'],
    ];
  }
  /* جزء من viewDocs: [… */
  function docsHtml9(COS, CO_REQ, DOC_STATUS, d) {
    return [
      ['company', 'الشركة *', 'list', COS],
      ['type', 'نوع المستند *', 'list', [...new Set([...CO_REQ, ...d.companyDocs.map((x) => x.type)].filter(Boolean))]],
      ['title', 'الوصف'],
      ['number', 'رقم الشهادة / الوثيقة'],
      ['issuer', 'جهة الإصدار'],
      ['issue', 'تاريخ الإصدار', 'date'],
      ['expiry', 'تاريخ الانتهاء', 'date'],
      ['status', 'الحالة', 'sel', DOC_STATUS],
      ['notes', 'ملاحظات', 'area'],
    ];
  }
  /* جزء من viewDocs: (() => {… */
  function docsHtml8(YR, coCp) {
    return (() => {
      const vals = coCp ? ((coCp.years || {})[YR] || []).slice(0, 12) : [];
      const v = vals.filter((x) => x !== null && x !== '' && Number.isFinite(Number(x))).map(Number);
      const avg = v.length ? Math.round((v.reduce((k, x) => k + x, 0) / v.length) * 10) / 10 : null;
      const cls = avg === null ? 'na' : avg >= 100 ? 'ok' : avg >= 90 ? 'warn' : 'bad';
      return `<div class="dc-card dc-${cls}"><div class="dc-h"><span class="dc-ic">📊</span><b>نسبة الالتزام في مدد ${YR}</b></div>
                <div class="dc-st"><span class="chip doc-${cls}">${avg === null ? 'لا توجد نسب' : `متوسط ${avg}%`}</span></div>
                <div class="dc-months">${DOC_MONTHS.map((m, k) => {
                  const x = vals[k];
                  const ok = x !== null && x !== undefined && x !== '';
                  return `<span class="dc-m${ok ? (Number(x) >= 100 ? ' ok' : ' low') : ''}" title="${esc(m)}: ${ok ? `${x}%` : '—'}"><i style="height:${ok ? Math.max(8, Number(x)) : 0}%"></i></span>`;
                }).join('')}</div>
                <div class="dc-act"><button type="button" class="btn sm ghost" data-cpd>${icon('pencil')} تعديل النسب</button></div></div>`;
    })();
  }
  /* جزء من viewDocs: [… */
  function docsValue6() {
    return [
      ['name', 'اسم المنشأة *'],
      ['unified', 'الرقم الموحد'],
      ['laborNo', 'رقم المنشأة في مكتب العمل'],
      ['crExpiry', 'تاريخ انتهاء السجل', 'date'],
      ['range', 'نطاق الموظفين'],
      ['count', 'عدد الموظفين'],
      ['start', 'تاريخ بداية الاشتراك', 'date'],
      ['end', 'تاريخ نهاية الاشتراك', 'date'],
      ['amount', 'المبلغ المدفوع'],
      ['bank', 'بنك الرواتب'],
      ['iban', 'الآيبان'],
      ['bankUpdated', 'تاريخ آخر تحديث للبنك', 'date'],
      ['bankStatus', 'حالة التحديث', 'sel', ['لم يتم التحديث', 'تم التحديث']],
      ['crName', 'الاسم المقابل في السجلات التجارية'],
      ['bankNotes', 'ملاحظات البنك', 'area'],
      ['notes', 'ملاحظات', 'area'],
    ];
  }
  /* جزء من viewDocs: BR_REQ.map((t) => {… */
  function docsHtml7(BR_REQ, CO, DOC_IC, brCr, docOf, docTile, fb, st, stx, subOf) {
    return BR_REQ.map((t) => {
      const x = docOf(fb, t);
      if (!x && t === 'السجل التجاري') {
        const cr = brCr(CO, fb);
        if (cr)
          return docTile({
            ic: DOC_IC[t],
            name: t,
            sub: [cr.cr && `السجل <span dir="ltr">${esc(cr.cr)}</span>`, esc(cr.entity)].filter(Boolean).join(' · '),
            expiry: cr.expiry,
            sx: st(cr.expiry, 90),
            kind: 'crs',
            x: cr,
            edit: `<button type="button" class="btn sm ghost" data-crd="${cr.id}">${icon('pencil')} تعديل</button>`,
          });
      }
      return docTile({
        ic: DOC_IC[t],
        name: t,
        sub: x ? subOf(x) : 'لم تضفها بعد',
        expiry: x && x.expiry,
        sx: x ? stx(x, 60) : ['غير مضاف', 'na'],
        kind: 'branchDocs',
        x,
        edit: x && `<button type="button" class="btn sm ghost" data-bed="${x.id}">${icon('pencil')} تعديل</button>`,
        add: `<button type="button" class="btn sm" data-badd="${esc(fb)}" data-btype="${esc(t)}">＋ إضافة</button>`,
      });
    }).join('');
  }
  /* جزء من viewDocs: [… */
  function docsHtml6(CO, CO_REQ, DOC_IC, coOf, d, docTile, stx, typeOf) {
    return [
      ...CO_REQ,
      ...new Set(
        d.companyDocs
          .filter((x) => coOf(x) === CO)
          .map((x) => typeOf(x.type))
          .filter((t) => !CO_REQ.includes(t)),
      ),
    ]
      .map((t) => {
        const x = d.companyDocs
          .filter((y) => coOf(y) === CO && typeOf(y.type) === t)
          .sort((p, q) => String(q.expiry || '').localeCompare(String(p.expiry || '')))[0];
        return docTile({
          ic: DOC_IC[t],
          name: t,
          sub: x
            ? [x.number && `<span dir="ltr">${esc(x.number)}</span>`, x.issuer && esc(x.issuer)].filter(Boolean).join(' · ')
            : 'لم تضفه بعد',
          expiry: x && x.expiry,
          sx: x ? stx(x, 60) : ['غير مضاف', 'na'],
          kind: 'companyDocs',
          x,
          edit: x && `<button type="button" class="btn sm ghost" data-ced="${x.id}">${icon('pencil')} تعديل</button>`,
          add: `<button type="button" class="btn sm" data-cadd="${esc(t)}" data-cco="${esc(CO)}">＋ إضافة</button>`,
        });
      })
      .join('');
  }
  /* جزء من viewDocs: [… */
  function docsHtml5(CO, DOC_IC, brCoOf, coOf, crBranch, crsOf, d, docTile, st, stx, typeOf) {
    return [
      ...d.companyDocs
        .filter((x) => coOf(x) === CO)
        .map((x) => ({
          date: x.expiry,
          html: docTile({
            ic: DOC_IC[typeOf(x.type)],
            name: x.type,
            sub: ['🏛 الشركة', x.number && `<span dir="ltr">${esc(x.number)}</span>`, x.issuer && esc(x.issuer)]
              .filter(Boolean)
              .join(' · '),
            expiry: x.expiry,
            sx: stx(x, 60),
            kind: 'companyDocs',
            x,
            edit: `<button type="button" class="btn sm ghost" data-ced="${x.id}">${icon('pencil')} تعديل</button>`,
          }),
        })),
      ...crsOf(CO).map((x) => ({
        date: x.expiry,
        html: docTile({
          ic: '📜',
          name: 'سجل تجاري',
          sub: [
            crBranch(CO, x) ? `🏢 فرع ${esc(crBranch(CO, x))}` : '🏛 الشركة',
            esc(x.entity),
            x.cr && `<span dir="ltr">${esc(x.cr)}</span>`,
          ]
            .filter(Boolean)
            .join(' · '),
          expiry: x.expiry,
          sx: st(x.expiry, 90),
          kind: 'crs',
          x,
          edit: `<button type="button" class="btn sm ghost" data-crd="${x.id}">${icon('pencil')} تعديل</button>`,
        }),
      })),
      ...d.branchDocs
        .filter((x) => brCoOf(x) === CO)
        .map((x) => ({
          date: x.expiry,
          html: docTile({
            ic: DOC_IC[typeOf(x.type)],
            name: x.type,
            sub: [`🏢 فرع ${esc(x.branch)}`, x.number && `<span dir="ltr">${esc(x.number)}</span>`, x.issuer && esc(x.issuer)]
              .filter(Boolean)
              .join(' · '),
            expiry: x.expiry,
            sx: stx(x, 60),
            kind: 'branchDocs',
            x,
            edit: `<button type="button" class="btn sm ghost" data-bed="${x.id}">${icon('pencil')} تعديل</button>`,
          }),
        })),
    ];
  }
  /* جزء من viewDocs: [… */
  function docsHtml4(BR_REQ, COS, DOC_STATUS, d) {
    return [
      ['company', 'الشركة *', 'list', COS],
      ['branch', 'الفرع *', 'list', [...new Set([...(d.branches || []), ...d.branchDocs.map((x) => x.branch)])]],
      [
        'type',
        'نوع الوثيقة *',
        'list',
        [
          ...new Set(
            [
              ...BR_REQ,
              'عقد إيجار مبنى الفرع',
              'عقد إيجار السكن',
              'عقد الكهرباء',
              'عقد المياه',
              'عقد الإنترنت / الاتصالات',
              'تأمين المبنى',
              'صك الملكية',
              'رخصة تشغيل',
              ...d.branchDocs.map((x) => x.type),
            ].filter(Boolean),
          ),
        ],
      ],
      ['title', 'الوصف (المؤجر، العنوان...)'],
      ['number', 'رقم الوثيقة / العقد'],
      ['issuer', 'جهة الإصدار'],
      ['facilityId', 'المبنى (من المنشآت)', 'fac'],
      ['issue', 'تاريخ الإصدار', 'date'],
      ['expiry', 'تاريخ الانتهاء', 'date'],
      ['status', 'الحالة', 'sel', DOC_STATUS],
      ['notes', 'ملاحظات', 'area'],
    ];
  }
  /* جزء من viewDocs: brs.length… */
  function docsHtml3(BASE, CO, brStats, brs, filterBar) {
    return brs.length
      ? `${filterBar('ابحث باسم الفرع...')}
            <div class="ap-grid co-apgrid">${brs
              .map((b) => {
                const x = brStats(b),
                  hue = { ok: '#059669', warn: '#d97706', bad: '#dc2626', na: '#64748b' }[x.cls];
                return `<a class="ap-t" data-fst="${{ ok: 'ساري', warn: 'قريب الانتهاء', bad: 'منتهي', na: 'ناقص' }[x.cls]}" data-fq="${esc(b.toLowerCase())}" href="${BASE}?co=${encodeURIComponent(CO)}&tab=branches&b=${encodeURIComponent(b)}" title="${esc(`فرع ${b} — ${x.total} وثيقة${x.att ? ` · ${x.att} تحتاج متابعة` : ''}${x.miss ? ` · ${x.miss} ناقص` : ''}`)}"><span class="ap-g" style="--a:${hue};--b:${hue};--c:${hue};--m:${hue}"><i class="ap-x"></i><i class="ap-y"></i>${ion('storefront-outline') || icon('building')}</span><span class="ap-l">${esc(b)}<small>${x.total} وثيقة${x.miss ? ` · ${x.miss} ناقص` : ''}</small></span>${x.att ? `<span class="ap-b">${x.att}</span>` : ''}</a>`;
              })
              .join('')}</div>
            <div class="hint" style="margin-top:12px">لون المربع: 🟢 كل الوثائق سارية · 🟠 يوجد ما يقترب انتهاؤه أو معلق · 🔴 يوجد وثيقة منتهية · ⚪ وثائق ناقصة — والرقم الأحمر = عدد ما يحتاج متابعة</div>`
      : '<div class="card empty">لا توجد فروع مسجلة لهذه الشركة — اضغط «➕ إضافة» واكتب اسم الفرع</div>';
  }
  /* جزء من viewDocs: coCrs… */
  function docsHtml2(coCrs, docTile, st) {
    return (
      coCrs
        .slice()
        .sort((a, b) => String(a.expiry || '9').localeCompare(String(b.expiry || '9')))
        .map((x) =>
          docTile({
            ic: '📜',
            name: x.entity,
            sub: [x.cr && `السجل <span dir="ltr">${esc(x.cr)}</span>`, x.hijri && `هجري ${esc(x.hijri)}`].filter(Boolean).join(' · '),
            expiry: x.expiry,
            sx: st(x.expiry, 90),
            kind: 'crs',
            x,
            edit: `<button type="button" class="btn sm ghost" data-crd="${x.id}">${icon('pencil')} تعديل</button>`,
          }),
        )
        .join('') || '<div class="card empty">لا يوجد سجل تجاري للشركة نفسها — سجلات الفروع تظهر داخل كل فرع</div>'
    );
  }
  /* جزء من viewDocs: d.mainCompany || COS[0] || ''… */
  function docsValue5(COS, d) {
    return d.mainCompany || COS[0] || '';
  }
  /* جزء من viewDocs: tab === 'companyDocs' || tab === 'branchDocs' || tab === 'al… */
  function docsValue4(tab) {
    return tab === 'companyDocs' || tab === 'branchDocs' || tab === 'allDocs';
  }
  /* جزء من viewDocs: d.mainCompany || COS[0] || ''… */
  function docsValue3(COS, d) {
    return d.mainCompany || COS[0] || '';
  }
  /* جزء من viewDocs: docTile({… */
  function docsHtml(CO, WPS_T, cert, docTile, stx) {
    return docTile({
      ic: '🛡',
      name: WPS_T,
      sub: cert
        ? [cert.number && `<span dir="ltr">${esc(cert.number)}</span>`, cert.issuer && esc(cert.issuer)].filter(Boolean).join(' · ')
        : 'لم تضفها بعد',
      expiry: cert && cert.expiry,
      sx: cert ? stx(cert, 60) : ['غير مضاف', 'na'],
      kind: 'companyDocs',
      x: cert,
      edit: cert && `<button type="button" class="btn sm ghost" data-ced="${cert.id}">${icon('pencil')} تعديل</button>`,
      add: `<button type="button" class="btn sm" data-cadd="${esc(WPS_T)}" data-cco="${esc(CO)}">＋ إضافة</button>`,
    });
  }
  /* جزء من viewDocs: coMd… */
  function docsValue2(coMd, docTile, st) {
    return coMd
      ? docTile({
          ic: '🪪',
          name: 'اشتراك مدد',
          sub: [
            esc(coMd.name),
            coMd.count && `${esc(coMd.count)} موظف${coMd.range ? ` (${esc(coMd.range)})` : ''}`,
            coMd.bank && `البنك: ${esc(coMd.bank)}${coMd.bankStatus ? ` — ${esc(coMd.bankStatus)}` : ''}`,
          ]
            .filter(Boolean)
            .join(' · '),
          expiry: coMd.end,
          sx: st(coMd.end, 30),
          kind: 'mudad',
          x: { ...coMd, files: [] },
          edit: `<button type="button" class="btn sm ghost" data-mdd="${coMd.id}">${icon('pencil')} تعديل</button>`,
        })
      : docTile({
          ic: '🪪',
          name: 'اشتراك مدد',
          sub: 'لم تضفه بعد',
          sx: ['غير مضاف', 'na'],
          kind: 'mudad',
          add: '<button type="button" class="btn sm" data-mdadd>＋ إضافة</button>',
        });
  }
  /* جزء من viewDocs: head(WPS ? 'مدد وحماية الأجور' : 'وثائق ومستندات', WPS ? 'اش… */
  function docsValue(WPS, d, ro, tab) {
    return head(
      WPS ? 'مدد وحماية الأجور' : 'وثائق ومستندات',
      WPS
        ? 'اشتراكات مدد وشهادات الالتزام بحماية الأجور ونسب الالتزام الشهرية لكل شركة'
        : ro
          ? `مستندات فرع ${esc(d.myBranch)} وتواريخ انتهائها — للاطلاع وتحميل الملفات`
          : tab === 'home'
            ? 'اختر الشركة لعرض وثائقها ووثائق فروعها — مع تواريخ الانتهاء والملفات (PDF) والتذكير قبل الانتهاء'
            : 'وثائق الشركة ووثائق فروعها — تواريخ الانتهاء والملفات (PDF) والتذكير قبل الانتهاء',
      `${!ro && !WPS && tab !== 'home' ? '<button class="btn primary" id="dcNew">➕ إضافة</button><button class="btn" id="dcXls">📊 Excel</button>' : ''}`,
    );
  }
  /* stx من viewDocs (يأخذ days، st من الصفحة) */
  function docsStx(days, st, x, soon) {
    return x.status === 'معلق'
      ? ['معلق', 'hold']
      : x.status === 'ملغي'
        ? ['ملغي', 'na']
        : x.status === 'قيد الإصدار'
          ? ['قيد الإصدار', 'na']
          : x.status === 'قيد التجديد' && days(x.expiry) !== null && days(x.expiry) < 0
            ? ['قيد التجديد', 'warn']
            : st(x.expiry, soon);
  }
  /* docTile من viewDocs (يأخذ chip، days، fd، left من الصفحة) */
  function docsDocTile(chip, days, fd, left, { ic, name, sub, expiry, sx, kind, x, edit, add }) {
    const fl = x && (x.files || [])[0],
      url = fl ? `/api/docs/${kind}/${x.id}/files/${fl.id}` : '';
    const n = expiry ? days(expiry) : null;
    return `<div class="dt-row dt-${sx[1] || 'na'}${x ? '' : ' dt-miss'}" data-fst="${esc(x ? sx[0] : 'ناقص')}" data-fq="${esc(`${name} ${String(sub || '').replace(/<[^>]+>/g, ' ')} ${(x && x.notes) || ''}`.toLowerCase())}">
        <span class="dt-ic">${ic || '📄'}</span>
        <div class="dt-name"><b>${esc(name)}</b>${sub ? `<small>${sub}</small>` : ''}</div>
        <div class="dt-col"><small>تاريخ الانتهاء</small><b>${expiry ? fd(expiry) : '—'}</b></div>
        <div class="dt-col dt-left"><small>${n !== null && n < 0 ? 'منتهي منذ' : 'المتبقي'}</small><b>${expiry ? esc(n < 0 ? `${-n} يوم` : left(expiry)) : '—'}</b></div>
        <div class="dt-col dt-st">${chip(sx)}</div>
        <div class="dt-prev">${fl ? `<button type="button" class="dt-pv" data-pv="${esc(url)}" data-pvn="${esc(fl.name)}" title="معاينة ${esc(fl.name)}">${/\.pdf$/i.test(fl.name) ? `<canvas data-pdfth="${esc(url)}"></canvas>` : /\.(png|jpe?g)$/i.test(fl.name) ? `<img src="${esc(url)}" alt="" loading="lazy">` : '<span>📎</span>'}<i>معاينة</i></button>` : `<span class="dt-nofile">${x ? 'لا يوجد ملف' : '—'}</span>`}</div>
        <div class="dt-act">${x ? edit : add}</div></div>`;
  }
  /* left من viewDocs (يأخذ d، days من الصفحة) */
  function docsLeft(d, days, iso) {
    const n = days(iso);
    if (n === null) return '—';
    if (n < 0) return `منتهي منذ ${-n} يوم`;
    const a = new Date(`${d.today}T00:00:00`),
      b = new Date(`${iso}T00:00:00`);
    let m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
    if (b.getDate() < a.getDate()) m--;
    const t = new Date(a);
    t.setMonth(t.getMonth() + m);
    const dd = Math.round((b - t) / 86400000);
    return m > 0 ? `${m} شهر${dd ? ` و ${dd} يوم` : ''}` : `${dd} يوم`;
  }
  /* coStats من viewDocs (يأخذ CO_REQ، WPS، brCoOf، brsOf، coOf، crsOf، d، days، sameCo، st، stx، typeOf من الصفحة) */
  function docsCoStats(CO_REQ, WPS, brCoOf, brsOf, coOf, crsOf, d, days, sameCo, st, stx, typeOf, c) {
    const L = d.companyDocs.filter((x) => coOf(x) === c),
      md = WPS ? d.mudad.find((x) => sameCo(x.name, c)) : null,
      B = WPS ? [] : d.branchDocs.filter((x) => brCoOf(x) === c),
      CR = WPS ? [] : crsOf(c);
    const sts = [
      ...L.map((x) => stx(x, 60)[0]),
      ...CR.map((x) => st(x.expiry, 90)[0]),
      ...(md ? [st(md.end, 30)[0]] : []),
      ...B.map((x) => stx(x, 60)[0]),
    ];
    const miss = CO_REQ.filter((t) => !L.some((x) => typeOf(x.type) === t)).length;
    const dates = [...L.map((x) => x.expiry), ...CR.map((x) => x.expiry), ...(md ? [md.end] : []), ...B.map((x) => x.expiry)]
      .filter((x) => x && days(x) >= 0)
      .sort();
    const n = (k) => (k === 'ناقص' ? miss : sts.filter((v) => v === k).length);
    return {
      n,
      total: sts.length,
      miss,
      near: dates[0] || '',
      branches: brsOf(c).length,
      cls: n('منتهي') ? 'bad' : n('قريب الانتهاء') || n('معلق') ? 'warn' : sts.length ? 'ok' : 'na',
    };
  }
  /* wirePreviews من viewDocs */
  function docsWirePreviews(root) {
    $$('canvas[data-pdfth]', root).forEach(async (cv) => {
      try {
        const lib = await loadPdfLib();
        const buf = await (await fetch(cv.dataset.pdfth, { credentials: 'same-origin' })).arrayBuffer();
        const pg = await (await lib.getDocument({ data: buf }).promise).getPage(1);
        const vp1 = pg.getViewport({ scale: 1 }),
          vp = pg.getViewport({ scale: 120 / vp1.width });
        cv.width = Math.round(vp.width);
        cv.height = Math.round(vp.height);
        await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      } catch {
        cv.replaceWith(Object.assign(document.createElement('span'), { textContent: '📄' }));
      }
    });
    $$('[data-pv]', root).forEach((b) => {
      b.onclick = () => {
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        const isPdf = /\.pdf$/i.test(b.dataset.pvn);
        bg.innerHTML = `<div class="modal dt-viewer"><div class="row" style="justify-content:space-between;margin-bottom:8px"><b>${esc(b.dataset.pvn)}</b><span class="row" style="gap:6px"><a class="btn sm" href="${esc(b.dataset.pv)}" target="_blank" rel="noopener">↗ فتح في نافذة</a><button type="button" class="btn sm ghost" data-x>✕ إغلاق</button></span></div>
          ${isPdf ? `<iframe src="${esc(b.dataset.pv)}" title="${esc(b.dataset.pvn)}"></iframe>` : `<img src="${esc(b.dataset.pv)}" alt="${esc(b.dataset.pvn)}">`}</div>`;
        document.body.appendChild(bg);
        bg.onclick = (e) => {
          if (e.target === bg || e.target.closest('[data-x]')) bg.remove();
        };
      };
    });
  }
  /* wireFilter من viewDocs (يأخذ FST من الصفحة) */
  function docsWireFilter(FST, root) {
    const q = $('#dtQ', root),
      box = $('#dtS', root);
    if (!q || !box) return;
    const items = $$('[data-fst]', root);
    const cnt = (k) => items.filter((el) => el.dataset.fst === k).length;
    let cur = '';
    box.innerHTML = `<button type="button" class="dt-fc on" data-fs="">الكل <b>${items.length}</b></button>${FST.filter(cnt)
      .map(
        (k) =>
          `<button type="button" class="dt-fc dt-fc-${{ ساري: 'ok', 'قريب الانتهاء': 'warn', منتهي: 'bad', معلق: 'hold', ناقص: 'na' }[k] || 'na'}" data-fs="${esc(k)}">${esc(k)} <b>${cnt(k)}</b></button>`,
      )
      .join('')}`;
    const apply = () => {
      const t = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      items.forEach((el) => {
        el.hidden = !((!cur || el.dataset.fst === cur) && t.every((w) => (el.dataset.fq || '').includes(w)));
      });
      /* القسم الذي لم يبق فيه شيء يُخفى مع عنوانه */
      $$('.dt-list, .co-apgrid', root).forEach((L) => {
        const any = $$('[data-fst]', L).some((el) => !el.hidden);
        L.hidden = !any && $$('[data-fst]', L).length > 0;
        const h = L.previousElementSibling;
        if (h && h.matches('h3.dc-sec')) h.hidden = L.hidden;
      });
    };
    q.oninput = apply;
    $$('[data-fs]', box).forEach((b) => {
      b.onclick = () => {
        cur = b.dataset.fs;
        $$('[data-fs]', box).forEach((x) => x.classList.toggle('on', x === b));
        apply();
      };
    });
  }
  /* جزء من viewDocs: if (!ro)… */
  function viewDocsPart3(d, edit, main, ro, tab) {
    if (!ro)
      $$('[data-ed]', main).forEach((b) => {
        b.onclick = () =>
          edit(
            tab,
            d[tab].find((x) => x.id === b.dataset.ed),
          );
      });
  }
  /* جزء من viewDocs: const dot = (sx) => `<span class="dc-dot doc-${sx[… */
  function viewDocsPart2() {
    const dot = (sx) => `<span class="dc-dot doc-${sx[1] || 'na'}"></span>`;
    const LEG = [
      ['ساري', 'ok'],
      ['قريب الانتهاء', 'warn'],
      ['منتهي', 'bad'],
      ['معلق', 'hold'],
      ['ناقص', 'na'],
    ];
    const bar = (n) =>
      `<div class="dc-bar">${LEG.map(([k, c]) => (n(k) ? `<span class="dc-seg doc-${c}" style="flex:${n(k)}" title="${k}: ${n(k)}"></span>` : '')).join('')}</div>`;
    const nums = (n) =>
      `<div class="dc-nums">${
        LEG.filter(([k]) => n(k))
          .map(([k, c]) => `<span>${dot([k, c])}${k} <b>${n(k)}</b></span>`)
          .join('') || '<span class="muted">لا توجد مستندات</span>'
      }</div>`;
  }
  /* أحداث viewDocs */
  function wireDocs2(CO_SEL, d, edit, main) {
    $$('[data-crd]', main).forEach((b) => {
      b.onclick = () =>
        edit(
          'crs',
          d.crs.find((x) => x.id === b.dataset.crd),
        );
    });
    $$('[data-cradd]', main).forEach((b) => {
      b.onclick = () => edit('crs', { preset: { entity: CO_SEL } });
    });
    $$('[data-mdd]', main).forEach((b) => {
      b.onclick = () =>
        edit(
          'mudad',
          d.mudad.find((x) => x.id === b.dataset.mdd),
        );
    });
    $$('[data-mdadd]', main).forEach((b) => {
      b.onclick = () => edit('mudad', { preset: { name: CO_SEL } });
    });
  }
  /* أحداث viewDocs */
  function wireDocs(CO, d, edit, main) {
    $$('[data-bed]', main).forEach((b) => {
      b.onclick = () =>
        edit(
          'branchDocs',
          d.branchDocs.find((x) => x.id === b.dataset.bed),
        );
    });
    $$('[data-badd]', main).forEach((b) => {
      b.onclick = () => edit('branchDocs', { preset: { company: CO, branch: b.dataset.badd, type: b.dataset.btype } });
    });
    $$('[data-ced]', main).forEach((b) => {
      b.onclick = () =>
        edit(
          'companyDocs',
          d.companyDocs.find((x) => x.id === b.dataset.ced),
        );
    });
    $$('[data-cadd]', main).forEach((b) => {
      b.onclick = () => edit('companyDocs', { preset: { type: b.dataset.cadd, company: b.dataset.cco || CO } });
    });
  }
  /* جزء من viewDocs: if ($('#dcCo'))… */
  function viewDocsPart() {
    if ($('#dcCo'))
      $('#dcCo').onchange = (e) => {
        location.hash = `#/docs?tab=companyDocs${e.target.value ? `&co=${encodeURIComponent(e.target.value)}` : ''}`;
      };
  }
  /* جزء من edit: kind === 'mudad' ? 'اشتراك مدد' : kind === 'branchDocs' ? 'م… */
  function editValue(kind) {
    return kind === 'mudad' ? 'اشتراك مدد' : kind === 'branchDocs' ? 'مستند فرع' : kind === 'companyDocs' ? 'مستند الشركة' : 'سجل تجاري';
  }
  /* جزء من part: [… */
  function partValue2() {
    return [
      'الفرع',
      'نوع الوثيقة',
      'الوصف',
      'الرقم',
      'جهة الإصدار',
      'المبنى',
      'الإصدار',
      'الانتهاء',
      'المتبقي',
      'الحالة',
      'عدد الملفات',
      'ملاحظات',
    ];
  }
  /* جزء من part: [… */
  function partHtml2(CO, coOf, d, left, stx) {
    return [
      ['الشركة', 'المستند', 'الوصف', 'الرقم', 'جهة الإصدار', 'الإصدار', 'الانتهاء', 'المتبقي', 'الحالة', 'عدد الملفات', 'ملاحظات'],
      ...d.companyDocs
        .filter((x) => coOf(x) === CO)
        .map((x) => [
          coOf(x),
          x.type,
          x.title,
          x.number,
          x.issuer,
          x.issue,
          x.expiry,
          x.expiry ? left(x.expiry) : '',
          stx(x, 60)[0],
          (x.files || []).length,
          x.notes,
        ]),
    ];
  }
  /* جزء من part: [… */
  function partHtml(d, left, st) {
    return [
      [
        'التصنيف',
        'الجهة / الفرع',
        'الرقم الموحد',
        'السجل التجاري',
        'الانتهاء هجري',
        'الانتهاء ميلادي',
        'المتبقي',
        'الحالة',
        'النوع',
        'ملاحظات',
      ],
      ...d.crs.map((x) => [x.category, x.entity, x.unified, x.cr, x.hijri, x.expiry, left(x.expiry), st(x.expiry, 90)[0], x.type, x.notes]),
    ];
  }
  /* جزء من part: [… */
  function partValue(d, left, st) {
    return [
      [
        'المنشأة',
        'الرقم الموحد',
        'رقم مكتب العمل',
        'انتهاء السجل',
        'حالة السجل',
        'نطاق الموظفين',
        'عدد الموظفين',
        'بداية الاشتراك',
        'نهاية الاشتراك',
        'المتبقي',
        'الحالة',
        'المبلغ',
        'بنك الرواتب',
        'الآيبان',
        'حالة تحديث البنك',
        'ملاحظات',
      ],
      ...d.mudad.map((x) => [
        x.name,
        x.unified,
        x.laborNo,
        x.crExpiry,
        st(x.crExpiry, 60)[0],
        x.range,
        x.count,
        x.start,
        x.end,
        left(x.end),
        st(x.end, 30)[0],
        x.amount,
        x.bank,
        x.iban,
        x.bankStatus,
        x.notes,
      ]),
    ];
  }
  return {
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
  };
};
