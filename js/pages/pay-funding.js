'use strict';
/* صفحة «pay-funding» (viewPayFunding، viewBranchPay) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['pay-funding'] = function (S) {
  const {
    $,
    $$,
    BP_SHORT,
    BP_ST,
    MP_MONTH,
    SF,
    XS_STYLES,
    api,
    askText,
    askYesNo,
    bpMonthData,
    bpR2,
    colName,
    d0rev,
    downloadXlsx,
    dt,
    esc,
    fmtNum,
    head,
    normAr,
    normDate,
    readXlsx,
    shell,
    state,
    toast,
    xmlEsc,
    zipStore,
  } = S;
  function downloadXlsxStyled(name, sheets) {
    const used = new Set();
    const names = sheets.map((s, i) => {
      let n =
        String(s.name || `Sheet${i + 1}`)
          .replace(/[\[\]:*?/\\]/g, ' ')
          .trim()
          .slice(0, 31) || `Sheet${i + 1}`;
      for (let k = 2; used.has(n); k++) n = `${n.slice(0, 27)} (${k})`;
      used.add(n);
      return n;
    });
    const cx = (o, ref) => {
      const st = o.s != null ? ` s="${o.s}"` : '';
      if (o.v === '' || o.v == null) return o.s != null ? `<c r="${ref}"${st}/>` : '';
      return typeof o.v === 'number'
        ? `<c r="${ref}"${st}><v>${o.v}</v></c>`
        : `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${xmlEsc(o.v)}</t></is></c>`;
    };
    const sx = (sh) =>
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>` +
      `<cols>${(sh.cols || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>` +
      sh.rows
        .map(
          (r, i) =>
            `<row r="${i + 1}">${r.map((c, k) => cx(c && typeof c === 'object' ? c : { v: c }, `${colName(k)}${i + 1}`)).join('')}</row>`,
        )
        .join('') +
      `</sheetData>${(sh.merges || []).length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map((m2) => `<mergeCell ref="${m2}"/>`).join('')}</mergeCells>` : ''}</worksheet>`;
    const blob = zipStore([
      [
        '[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          sheets
            .map(
              (s, i) =>
                `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
            )
            .join('') +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      ],
      [
        '_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      ],
      [
        'xl/workbook.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${xmlEsc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
      ],
      [
        'xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          sheets
            .map(
              (s, i) =>
                `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
            )
            .join('') +
          `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      ],
      ['xl/styles.xml', XS_STYLES],
      ...sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sx(s)]),
    ]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  /* المطابقة: داخل الكفالة (المرفوع على مدد ↔ مصروف الرواتب)، خارج الكفالة (المدفوع من الفرع ↔ مصروف الرواتب)، وتفاصيل الفرق لكل موظف */
  function bpRecon(lines) {
    const N = (v) => Number(String(v == null ? '' : v).replace(/,/g, '')) || 0;
    const sec = () => ({ paid: 0, exp: 0, items: [] });
    const R = { in: sec(), out: sec() };
    for (const l of lines || []) {
      const c = SF.bpCalc(l),
        k = SF.bpKaf(l.kafala),
        S = k && k !== SF.BP_OUT ? R.in : R.out,
        work = c.code === 1 || c.code === 6;
      const paid = S === R.in ? c.mudad : bpR2(c.paid + N(l.settlement));
      S.paid += paid;
      S.exp += c.expense;
      const diff = bpR2(c.expense - paid);
      if (Math.abs(diff) < 0.01) continue;
      const parts = [];
      if (work)
        [
          ['adv', 'خصم قسط سلفة'],
          ['custody', 'خصم عهدة'],
          ['legal', 'خصم قانوني'],
          ['gosiDed', 'خصم تأمينات'],
        ].forEach(([f, t]) => {
          if (N(l[f])) parts.push(`${t} ${fmtNum(N(l[f]))}`);
        });
      if (S === R.in && !work) {
        if (c.code === 2) parts.push(`تصفية بمبلغ ( ${fmtNum(N(l.settlement))} ) ريال — تصرفها خارج مدد`);
        else if (c.code === 3) parts.push(`توزيع تصفية — الجزء المحمل على الفرع ( ${fmtNum(N(l.settlement))} ) ريال`);
        else if (c.code === 5) parts.push(`بدلات أثناء الأجازة ( ${fmtNum(N(l.leaveAllow))} ) — خارج مدد`);
        else if (c.code === 7) parts.push(`مستحقات إضافية ( ${fmtNum(N(l.due))} ) — خارج مدد`);
      } else if (N(l.settlement) && S === R.in) parts.push(`تصفية ( ${fmtNum(N(l.settlement))} ) — خارج مدد`);
      if (l.notes) parts.push(String(l.notes));
      S.items.push({ name: l.name || l.iqama || '—', amt: diff, note: parts.join(' + ') || 'فرق' });
    }
    for (const S of [R.in, R.out]) {
      S.paid = bpR2(S.paid);
      S.exp = bpR2(S.exp);
    }
    return R;
  }

  function bpReconXlsx(stmts, month, company) {
    const M = (r1, c1, r2, c2) => `${colName(c1)}${r1 + 1}:${colName(c2)}${r2 + 1}`;
    const sheets = stmts.map((x) => {
      const R = bpRecon(x.lines),
        rows = [],
        merges = [],
        add = (r, m2) => {
          rows.push(r);
          (m2 || []).forEach((g) => merges.push(M(rows.length - 1, g[0], rows.length - 1, g[1])));
        };
      partPart2(add, company, month, x);
      for (const [title, S, lab] of [
        ['داخل الكفالة', R.in, 'اجمالي المدفوع من البنك ( مدد حماية الأجور )'],
        ['خارج الكفالة', R.out, 'اجمالي المدفوع من الفرع ( حماية الأجور )'],
      ]) {
        rows.push([]);
        add(partValue(title), [[0, 3]]);
        add(partValue2(lab));
        add(partValue3(S));
        add([
          { v: '', s: 0 },
          { v: 'الفرق', s: 9 },
          { v: bpR2(S.exp - S.paid), s: 11 },
        ]);
        add(
          [
            { v: 'تفاصيل الفرق', s: 1 },
            { v: '', s: 1 },
            { v: '', s: 1 },
            { v: '', s: 1 },
          ],
          [[0, 3]],
        );
        add(
          [
            { v: 'الاسم', s: 2 },
            { v: 'المبلغ', s: 2 },
            { v: 'ملاحظات', s: 2 },
            { v: '', s: 2 },
          ],
          [[2, 3]],
        );
        S.items.forEach((it) =>
          add(
            [
              { v: it.name, s: 4 },
              { v: it.amt, s: 5 },
              { v: it.note, s: 4 },
              { v: '', s: 4 },
            ],
            [[2, 3]],
          ),
        );
        if (!S.items.length)
          add(
            [
              { v: 'لا يوجد فرق', s: 13 },
              { v: '', s: 13 },
              { v: '', s: 13 },
              { v: '', s: 13 },
            ],
            [[0, 3]],
          );
        add(
          [
            { v: 'إجمالي الفرق', s: 9 },
            { v: bpR2(S.items.reduce((t, it) => t + it.amt, 0)), s: 8 },
            { v: '', s: 9 },
            { v: '', s: 9 },
          ],
          [[2, 3]],
        );
      }
      return partPart(add, merges, rows, x);
    });
    return bpReconXlsxPart(month, sheets);
  }
  /* جزء من bpReconXlsx: downloadXlsxStyled(… */
  function bpReconXlsxPart(month, sheets) {
    downloadXlsxStyled(
      `مطابقة رواتب الفروع مع مصروف الرواتب - ${MP_MONTH(month)}.xlsx`,
      sheets.length ? sheets : [{ name: 'لا توجد بيانات', rows: [['لا توجد بيانات رواتب لهذا الشهر']] }],
    );
  }
  /* جزء من part: [… */
  function partValue3(S) {
    return [
      { v: S.paid, s: 8 },
      { v: '', s: 0 },
      { v: '', s: 0 },
      { v: S.exp, s: 8 },
    ];
  }
  /* جزء من part: [… */
  function partValue2(lab) {
    return [
      { v: lab, s: 3 },
      { v: '', s: 0 },
      { v: '', s: 0 },
      { v: 'اجمالي مصروف الرواتب الفعلية المحملة على الفرع', s: 3 },
    ];
  }

  /* جزء من part: add([{ v: company || state.config.companyName || '… */
  function partPart2(add, company, month, x) {
    add([{ v: company || state.config.companyName || 'شركة سادن', s: 12 }], [[0, 3]]);
    add(
      [
        {
          v: `مطابقة رواتب فرع ${x.branch} مع مصروف الرواتب عن شهر ${MP_MONTH(month)}${x.status !== 'approved' ? ` (${BP_ST[x.status][0]})` : ''}`,
          s: 1,
        },
        { v: '', s: 1 },
        { v: '', s: 1 },
        { v: '', s: 1 },
      ],
      [[0, 3]],
    );
  }

  function bpMonthXlsx(stmts, branches, month) {
    const IN = SF.BP_KAFALA.filter((k) => k !== SF.BP_OUT),
      W = IN.length + 7;
    const M = (r1, c1, r2, c2) => `${colName(c1)}${r1 + 1}:${colName(c2)}${r2 + 1}`;
    const brs = [...new Set([...(branches || []), ...stmts.map((x) => x.branch)])];
    const calc = (x) => {
      const L = (x ? x.lines : []).map((l) => ({ l, c: SF.bpCalc(l), k: SF.bpKaf(l.kafala) })),
        S = SF.bpSummary(x ? x.lines : []);
      const sum = (f, X = L) => bpR2(X.reduce((t, z) => t + f(z), 0));
      const pk = IN.map((k) =>
          sum(
            (z) => z.c.mudad,
            L.filter((z) => z.k === k),
          ),
        ),
        ek = IN.map((k) =>
          sum(
            (z) => z.c.expense,
            L.filter((z) => z.k === k),
          ),
        );
      const pIn = bpR2(pk.reduce((a, b) => a + b, 0)),
        eIn = bpR2(ek.reduce((a, b) => a + b, 0));
      return {
        pk,
        ek,
        pIn,
        eIn,
        pOut: S.outside,
        eOut: sum(
          (z) => z.c.expense,
          L.filter((z) => z.k === SF.BP_OUT || !z.k),
        ),
        pAll: bpR2(pIn + S.outside),
        eAll: S.expense,
        gosi: S.gosi,
      };
    };
    return bpMonthXlsxPart2(IN, M, W, brs, calc, month, stmts);
  }

  /* أجزاء صفحة تمويل الرواتب ورواتب الفروع (1) (pay-funding-kit.js) */
  const {
    cardHtml,
    cardValue,
    renderDraw,
    bpEditorValue,
    bpEditorPart,
    bpEditorPart2,
    bpEditorPart3,
    bpEditorMoveIn,
    bpEditorUpTemplate,
    bpEditorUpImport,
    bpEditorSettleHtml,
    bpEditorSections,
    bpEditorBpExcel,
    bpEditorDrawer,
    bpEditorMudadFile,
    bpEditorBind,
  } = window.SES_PAGE_KITS['pay-funding'](S, { bpReconXlsx, downloadXlsxStyled, viewBranchPay });
  /* أجزاء صفحة تمويل الرواتب ورواتب الفروع (2) (pay-funding-kit-2.js) */
  const { viewPayFunding, partPart, partValue, bpMonthXlsxPart2, bpEditor, wireBranchPay } = window.SES_PAGE_KITS['pay-funding-2'](S, {
    bpEditorBind,
    bpEditorBpExcel,
    bpEditorDrawer,
    bpEditorMoveIn,
    bpEditorMudadFile,
    bpEditorPart,
    bpEditorPart2,
    bpEditorPart3,
    bpEditorSections,
    bpEditorSettleHtml,
    bpEditorUpImport,
    bpEditorUpTemplate,
    bpEditorValue,
    bpMonthXlsx,
    bpReconXlsx,
    cardHtml,
    cardValue,
    downloadXlsxStyled,
    renderDraw,
  });

  async function viewBranchPay(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/branch-pay');
    const m = (v) => fmtNum(Math.round((Number(v) || 0) * 100) / 100);
    if (query.id) return bpEditor(main, query, m);
    const ym = /^\d{4}-\d{2}$/.test(query.month || '') ? query.month : new Date().toISOString().slice(0, 7);
    const d = await api('GET', `/api/branch-pay${d0rev(query) ? `?month=${ym}` : ''}`);
    const COLS = [
      ['count', 'الموظفون'],
      ['mudad', 'المرفوع على مدد'],
      ['external', 'الكفالات الخارجية'],
      ['settle', 'التصفيات'],
      ['outside', 'إجمالي خارج مدد'],
      ['paid', 'الصافي المستلم'],
      ['expense', 'مصروف الرواتب'],
      ['gosi', 'تأمينات الشركة'],
      ['adv', 'السلف والعهد'],
      ['legal', 'خصم قانوني'],
    ];
    if (d.rev) {
      const rows = [...new Set([...d.branches, ...d.list.map((x) => x.branch)])].map((b) => ({
        b,
        x: d.list.find((y) => y.branch === b && y.month === ym),
      }));
      const T = (k) => d.list.filter((x) => x.month === ym).reduce((s, x) => s + (Number(x.sum[k]) || 0), 0);
      const sent = rows.filter((r2) => r2.x && r2.x.status !== 'draft').length;
      main.innerHTML = `${head('بيانات رواتب الفروع', `شهر ${esc(MP_MONTH(ym))} — وصل ${sent} من ${rows.length} فرع — كل فرع يعدّ بيانه ويرسله لإدارة الرواتب وحماية الأجور للاعتماد`, '<a class="btn primary" href="#/pay-funding?month=' + ym + '">💰 اعتماد وتحويل المبالغ</a><button class="btn" id="bpMonX" title="نموذج مجمع رواتب شهر: حماية الأجور، مصروف الرواتب، الفرق">📑 مجمع رواتب الشهر</button><button class="btn" id="bpRecX" title="نموذج مطابقة رواتب الفرع مع مصروف رواتب الشهر — ورقة لكل فرع">⚖ مطابقة الفروع</button><button class="btn" id="bpAllX">📊 Excel المجمع</button>')}
        <div class="card"><div class="row" style="gap:8px;margin-bottom:12px"><label>الشهر</label><input class="in" type="month" id="bpM" value="${ym}" style="width:auto"></div>
        <div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>الفرع</th><th>الحالة</th>${COLS.map(([, l]) => `<th>${l}</th>`).join('')}<th>معد الرواتب</th></tr></thead><tbody>
        ${rows
          .map(({ b, x }) =>
            x
              ? `<tr class="click" data-id="${x.id}"><td><b>${esc(b)}</b></td><td><span class="chip ${BP_ST[x.status][1]}">${BP_ST[x.status][0]}</span></td>${COLS.map(([k]) => `<td>${k === 'count' ? x.sum[k] : m(x.sum[k])}</td>`).join('')}<td class="muted">${esc(x.preparer || '')}</td></tr>`
              : `<tr><td><b>${esc(b)}</b></td><td><span class="chip doc-na">لم ترسله</span></td><td colspan="${COLS.length + 1}" class="muted">—</td></tr>`,
          )
          .join('')}</tbody>
        <tfoot><tr><th colspan="2">الإجمالي</th>${COLS.map(([k]) => `<th>${k === 'count' ? T(k) : m(T(k))}</th>`).join('')}<th></th></tr></tfoot></table></div></div>
        ${(() => {
          const L = d.list.filter((x) => x.month === ym);
          const K = (k, f) => L.reduce((s, x) => s + ((x.sum.byKafala || {})[k] || {})[f] || 0, 0);
          return `<div class="doc-tiles">${[
            ['المرفوع على مدد (كل الفروع)', m(T('mudad')), 'ok'],
            ['المدفوع للكفالات الخارجية', m(T('external')), 'warn'],
            ['التصفيات (خارج مدد)', m(T('settle'))],
            ['مصروف رواتب الشركة', m(T('expense')), 'bad'],
          ]
            .map(([l, v, c]) => `<div class="card doc-tile ${c || ''}"><b>${v}</b><small>${l}</small></div>`)
            .join('')}</div>
          <div class="card"><h3>المرفوع على مدد لكل كفالة — ${esc(MP_MONTH(ym))}</h3><div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>الكفالة</th><th>الموظفون</th><th>المرفوع على مدد</th><th>الصافي المستلم</th><th>مصروف الرواتب</th></tr></thead><tbody>
          ${SF.BP_KAFALA.map((k) => `<tr${k === SF.BP_OUT ? ' class="bp-extrow"' : ''}><td><b>${esc(k)}</b></td><td>${K(k, 'n')}</td><td>${k === SF.BP_OUT ? '— خارج مدد' : m(K(k, 'mudad'))}</td><td>${m(K(k, 'paid'))}</td><td>${m(K(k, 'expense'))}</td></tr>`).join('')}</tbody></table></div></div>`;
        })()}`;
      $('#bpM').onchange = () => {
        location.hash = `#/branch-pay?month=${$('#bpM').value}`;
      };
      $$('tr[data-id]', main).forEach((tr) => {
        tr.onclick = () => {
          location.hash = `#/branch-pay?id=${tr.dataset.id}`;
        };
      });
      wireBranchPay(COLS, rows, ym);
      return;
    }
    main.innerHTML = `${head(`بيانات رواتب فرع ${esc(d.branch)}`, 'جهّز بيان رواتب الشهر وأرسله لإدارة الرواتب وحماية الأجور للاعتماد — الموظفون والرواتب والبدلات وأقساط السلف يعبئها النظام تلقائياً')}
      <div class="card"><div class="row" style="gap:8px"><label>الشهر</label><input class="in" type="month" id="bpNewM" value="${ym}" style="width:auto"><button class="btn primary" id="bpNew">📝 فتح بيان الشهر</button></div></div>
      <div class="card"><div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>الشهر</th><th>الحالة</th><th>الموظفون</th><th>الصافي</th><th>التنبيهات</th><th>أرسلته</th></tr></thead><tbody>
      ${d.list.map((x) => `<tr class="click" data-id="${x.id}"><td><b>${esc(MP_MONTH(x.month))}</b></td><td><span class="chip ${BP_ST[x.status][1]}">${BP_ST[x.status][0]}</span></td><td>${x.sum.count}</td><td>${m(x.sum.net)}</td><td>${x.sum.warnings ? `<span class="chip doc-bad">${x.sum.warnings}</span>` : '—'}</td><td class="muted">${x.submittedAt ? esc(dt(x.submittedAt)) : '—'}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">لا توجد بيانات بعد — افتح بيان الشهر</td></tr>'}</tbody></table></div></div>`;
    $$('tr[data-id]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = `#/branch-pay?id=${tr.dataset.id}`;
      };
    });
    $('#bpNew').onclick = async () => {
      try {
        const x = await api('POST', '/api/branch-pay', { month: $('#bpNewM').value });
        location.hash = `#/branch-pay?id=${x.id}`;
      } catch (e) {
        toast(e.message, true);
      }
    };
  }

  return { viewPayFunding, viewBranchPay };
};
