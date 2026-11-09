'use strict';
/* أجزاء صفحة تمويل الرواتب ورواتب الفروع (2) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['pay-funding-2'] = function (S, ctx) {
  const {
    $,
    $$,
    BP_SHORT,
    BP_ST,
    MP_MONTH,
    SF,
    api,
    askText,
    askYesNo,
    bpMonthData,
    bpR2,
    downloadXlsx,
    dt,
    esc,
    fmtNum,
    head,
    shell,
    toast,
  } = S;
  const {
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
  } = ctx;
  /* جزء من part: [… */
  function partValue(title) {
    return [
      { v: title, s: 2 },
      { v: '', s: 2 },
      { v: '', s: 2 },
      { v: '', s: 2 },
    ];
  }
  /* جزء من part: rows.push([], []);… */
  function partPart(add, merges, rows, x) {
    rows.push([], []);
    add([
      { v: 'محاسب الفرع', s: 9 },
      { v: '', s: 0 },
      { v: '', s: 0 },
      { v: 'مدير قسم الرواتب وحماية الأجور', s: 9 },
    ]);
    add([
      { v: x.preparer || '', s: 13 },
      { v: '', s: 0 },
      { v: '', s: 0 },
      { v: '', s: 13 },
    ]);
    return { name: x.branch, rows, merges, cols: [40, 16, 46, 40] };
  }
  /* جزء من bpMonthXlsx: const data = brs.map((b) => {… */
  function bpMonthXlsxPart2(IN, M, W, brs, calc, month, stmts) {
    const data = brs.map((b) => {
      const x = stmts.find((y) => y.branch === b);
      return { b, x, v: calc(x) };
    });
    const grid = (title, pick) => {
      const rows = [],
        merges = [];
      rows.push([{ v: title, s: 12 }]);
      merges.push(M(0, 0, 0, W - 1));
      const h1 = [
        { v: 'م', s: 2 },
        { v: 'الفرع', s: 2 },
        ...IN.map((k, i) => ({ v: i ? '' : 'مبلغ رواتب داخل الكفالة', s: 3 })),
        { v: 'إجمالي رواتب داخل الكفالة', s: 2 },
        { v: 'مبلغ رواتب خارج الكفالة', s: 2 },
        { v: 'إجمالي رواتب الفرع', s: 2 },
        { v: 'تأمينات إجتماعية داخل الكفالة', s: 2 },
        { v: 'حالة البيان', s: 2 },
      ];
      const h2 = [
        { v: '', s: 2 },
        { v: '', s: 2 },
        ...IN.map((k) => ({ v: BP_SHORT[k] || k, s: 3 })),
        ...[0, 1, 2, 3, 4].map(() => ({ v: '', s: 2 })),
      ];
      rows.push(h1, h2);
      merges.push(
        M(1, 0, 2, 0),
        M(1, 1, 2, 1),
        M(1, 2, 1, IN.length + 1),
        ...[0, 1, 2, 3, 4].map((i) => M(1, IN.length + 2 + i, 2, IN.length + 2 + i)),
      );
      data.forEach(({ b, x, v }, i) => {
        const p = pick(v);
        rows.push([
          { v: i + 1, s: 13 },
          { v: b, s: 4 },
          ...p.k.map((n) => ({ v: n, s: 5 })),
          { v: p.in, s: 6 },
          { v: p.out, s: 5 },
          { v: p.all, s: 7 },
          { v: v.gosi, s: 5 },
          { v: x ? BP_ST[x.status][0] : 'لم ترسله', s: 13 },
        ]);
      });
      const T = (f) => bpR2(data.reduce((t, z) => t + f(pick(z.v), z.v), 0));
      rows.push([
        { v: 'الإجمالي', s: 9 },
        { v: '', s: 9 },
        ...IN.map((k, i) => ({ v: T((p) => p.k[i]), s: 8 })),
        { v: T((p) => p.in), s: 8 },
        { v: T((p) => p.out), s: 8 },
        { v: T((p) => p.all), s: 8 },
        { v: T((p, v) => v.gosi), s: 8 },
        { v: '', s: 9 },
      ]);
      merges.push(M(rows.length - 1, 0, rows.length - 1, 1));
      return { rows, merges, cols: [5, 18, ...IN.map(() => 13), 15, 15, 15, 15, 16] };
    };
    return bpMonthXlsxPart(data, grid, month);
  }
  /* جزء من bpMonthXlsx: const P = grid(`مجمع حماية الأجور الرواتب - ${MP_M… */
  function bpMonthXlsxPart(data, grid, month) {
    const P = grid(`مجمع حماية الأجور الرواتب - ${MP_MONTH(month)}`, (v) => ({ k: v.pk, in: v.pIn, out: v.pOut, all: v.pAll }));
    const E = grid(`مجمع مصروف الرواتب - ${MP_MONTH(month)}`, (v) => ({ k: v.ek, in: v.eIn, out: v.eOut, all: v.eAll }));
    const Fr = [
      [{ v: `الفرق بين مصروف الرواتب وحماية الأجور - ${MP_MONTH(month)}`, s: 12 }],
      [],
      ['م', 'الفرع', 'إجمالي حماية الأجور', 'إجمالي مصروف الرواتب', 'فرق'].map((v) => ({ v, s: 2 })),
      ...data.map(({ b, v }, i) => [
        { v: i + 1, s: 13 },
        { v: b, s: 4 },
        { v: v.pAll, s: 5 },
        { v: v.eAll, s: 5 },
        { v: bpR2(v.eAll - v.pAll), s: 7 },
      ]),
    ];
    const TT = (f) => bpR2(data.reduce((t, z) => t + f(z.v), 0));
    Fr.push([
      { v: 'الإجمالي', s: 9 },
      { v: '', s: 9 },
      { v: TT((v) => v.pAll), s: 8 },
      { v: TT((v) => v.eAll), s: 8 },
      { v: TT((v) => v.eAll - v.pAll), s: 8 },
    ]);
    downloadXlsxStyled(`مجمع رواتب شهر ${MP_MONTH(month)}.xlsx`, [
      { name: 'حماية الأجور', ...P },
      { name: 'مصروف الرواتب', ...E },
      { name: 'الفرق', rows: Fr, merges: ['A1:E1', `A${Fr.length}:B${Fr.length}`], cols: [5, 18, 18, 18, 16] },
    ]);
  }

  /* ---------- اعتماد وتحويل مبالغ رواتب الشهر ---------- */
  async function viewPayFunding(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (d) */
    const pageState = {};
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/pay-funding');
    const ym = /^\d{4}-\d{2}$/.test(query.month || '') ? query.month : new Date().toISOString().slice(0, 7);
    pageState.d = await api('GET', `/api/pay-funding?m=${ym}`);
    const m = (v) => fmtNum(Math.round((Number(v) || 0) * 100) / 100);
    const ST = {
      none: ['لم يعتمده أحد', 'doc-na'],
      approved: ['معتمد — بانتظار التحويل', 'doc-warn'],
      transferred: ['✔ تم التحويل', 'doc-ok'],
    };
    const BST = { none: 'لم ترسله', draft: 'مسودة', submitted: 'بانتظار المراجعة', reviewed: 'بانتظار الاعتماد', returned: 'معاد للتعديل' };
    const card = (part, title, sub, keyLab) => {
      const p = pageState.d.rec && pageState.d.rec.parts && pageState.d.rec.parts[part],
        rows = p ? p.rows : pageState.d.live[part],
        st = p ? p.status : 'none',
        tr = part === 'in';
      const stL = !tr && st === 'approved' ? ['✔ معتمد — يصرفه الفرع', 'doc-ok'] : ST[st];
      const total = rows.reduce((t, x) => t + x.amount, 0);
      const changed =
        p && JSON.stringify(p.rows.map((x) => [x.key, x.amount])) !== JSON.stringify(pageState.d.live[part].map((x) => [x.key, x.amount]));
      const started = p && Object.values(p.transfers || {}).some((t) => t && t.done);
      return `<div class="card pf-card"><div class="pf-h"><div><h3 style="margin:0">${title}</h3><small class="muted">${sub}</small></div><span class="chip ${stL[1]}">${stL[0]}</span></div>
        ${cardHtml(p)}
        ${changed ? `<div class="emp-al warn">تغيّرت المبالغ في البيانات المعتمدة بعد الاعتماد (الحالي: ${m(pageState.d.live[part].reduce((t, x) => t + x.amount, 0))})${!started && pageState.d.canApprove ? ' — أعد الاعتماد لتحديثها' : ''}</div>` : ''}
        <div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>${keyLab}</th><th>المبلغ</th><th>التفاصيل</th>${cardValue(p, tr)}</tr></thead><tbody>
        ${
          rows
            .map((x) => {
              const t = p && (p.transfers || {})[x.key];
              return `<tr><td><b>${esc(x.key)}</b></td><td><b>${m(x.amount)}</b></td><td class="muted" style="font-size:12px">${Object.entries(
                x.by || {},
              )
                .filter(([, v]) => v)
                .map(([k, v]) => `${esc(k)}: ${m(v)}`)
                .join(' · ')}</td>
          ${p && tr ? `<td>${t && t.done ? `<span class="chip doc-ok">✔ ${esc(SF.fmtDate(t.at.slice(0, 10)))}${t.ref ? ` — ${esc(t.ref)}` : ''}</span>${pageState.d.canTransfer ? ` <button class="btn sm ghost" data-undo="${esc(x.key)}" data-part="${part}" title="إلغاء التأكيد">↩</button>` : ''}` : pageState.d.canTransfer ? `<button class="btn sm primary" data-tr="${esc(x.key)}" data-part="${part}">✔ تم التحويل</button>` : '<span class="muted">بانتظار المدير المالي</span>'}</td>` : ''}</tr>`;
            })
            .join('') || `<tr><td colspan="4" class="empty">لا توجد مبالغ من بيانات معتمدة لهذا الشهر</td></tr>`
        }</tbody>
        <tfoot><tr><th>الإجمالي</th><th>${m(total)}</th><th></th>${p && tr ? '<th></th>' : ''}</tr></tfoot></table></div>
        <div class="row" style="gap:8px;margin-top:10px">${pageState.d.canApprove && !started && rows.length && (!p || changed) ? `<button class="btn primary" data-ok="${part}">✔ ${p ? 'إعادة اعتماد' : 'اعتماد'} مبالغ ${title} ${tr ? 'وإرسالها للمدير المالي للتحويل' : 'وإبلاغ المدير المالي'}</button>` : ''}
          ${pageState.d.canApprove && p && !started ? `<button class="btn ghost" data-cancel="${part}">إلغاء الاعتماد</button>` : ''}<button class="btn ghost" data-x="${part}">📊 Excel</button></div></div>`;
    };
    const rowsOf = (part) => {
      const p = pageState.d.rec && pageState.d.rec.parts && pageState.d.rec.parts[part];
      return p ? p.rows : pageState.d.live[part];
    };
    const brTable = () => {
      const T = {};
      for (const r of rowsOf('in'))
        for (const [b, v] of Object.entries(r.by || {})) {
          T[b] = T[b] || { in: 0, out: 0 };
          T[b].in += v;
        }
      for (const r of rowsOf('out')) {
        T[r.key] = T[r.key] || { in: 0, out: 0 };
        T[r.key].out += r.amount;
      }
      return Object.entries(T)
        .map(([b, v]) => ({
          b,
          in: Math.round(v.in * 100) / 100,
          out: Math.round(v.out * 100) / 100,
          all: Math.round((v.in + v.out) * 100) / 100,
        }))
        .sort((a, b2) => b2.all - a.all);
    };
    const branchSum = () => {
      const L = brTable(),
        S = (k) => L.reduce((t, x) => t + x[k], 0);
      return `<div class="card"><div class="pf-h"><div><h3 style="margin:0">ملخص الفروع</h3><small class="muted">ما يخص كل فرع: داخل الكفالة (تحوّله الإدارة على الكفالات وتصرفه عبر مدد) وخارج الكفالة (يصرفه محاسب الفرع)</small></div><button class="btn ghost" id="pfBrX">📊 Excel</button></div>
        <div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>الفرع</th><th>داخل الكفالة</th><th>خارج الكفالة (يصرفه الفرع)</th><th>الإجمالي</th></tr></thead><tbody>
        ${L.map((x) => `<tr><td><b>${esc(x.b)}</b></td><td>${m(x.in)}</td><td>${m(x.out)}</td><td><b>${m(x.all)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="empty">لا توجد بيانات معتمدة</td></tr>'}</tbody>
        <tfoot><tr><th>الإجمالي</th><th>${m(S('in'))}</th><th>${m(S('out'))}</th><th>${m(S('all'))}</th></tr></tfoot></table></div></div>`;
    };
    return viewPayFundingPart(BST, brTable, branchSum, card, m, main, pageState, rowsOf, ym);
  }
  /* جزء من viewPayFunding: const draw = () => {… */
  function viewPayFundingPart(BST, brTable, branchSum, card, m, main, pageState, rowsOf, ym) {
    const draw = () => {
      const pend = pageState.d.live.pending;
      renderDraw(BST, branchSum, card, pageState.d, main, pend, ym);
      wireDraw(brTable, rowsOf, ym);
      const act = async (path, body, msg) => {
        try {
          pageState.d = await api('POST', `/api/pay-funding/${path}`, { month: ym, ...body });
          toast(msg);
          draw();
        } catch (e) {
          toast(e.message, true);
        }
      };
      $$('[data-ok]', main).forEach((b) => {
        b.onclick = async () => {
          const part = b.dataset.ok,
            P = part === 'in' ? 'داخل الكفالة' : 'خارج الكفالة',
            tot = pageState.d.live[part].reduce((t, x) => t + x.amount, 0);
          if (
            !(await askYesNo(
              `اعتماد مبالغ ${P} لشهر ${MP_MONTH(ym)} بإجمالي ${m(tot)} ريال وإرسالها لـ ${pageState.d.flow.finance || 'المدير المالي'}؟${pend.length ? `\n\nتنبيه: ${pend.length} فرع لم يعتمد أحد بيانه بعد ولن يدخل في المبالغ.` : ''}`,
            ))
          )
            return;
          const note = prompt('ملاحظة للمدير المالي (اختياري):') || '';
          act('approve', { part, note }, 'تم الاعتماد والإرسال للمدير المالي');
        };
      });
      wireDraw2(act, main);
      $$('[data-x]', main).forEach((b) => {
        b.onclick = () => {
          const part = b.dataset.x,
            p = pageState.d.rec && pageState.d.rec.parts && pageState.d.rec.parts[part],
            rows = p ? p.rows : pageState.d.live[part],
            P = part === 'in' ? 'داخل الكفالة' : 'خارج الكفالة';
          downloadXlsxStyled(`مبالغ رواتب ${P} - ${MP_MONTH(ym)}.xlsx`, [
            {
              name: P,
              merges: ['A1:E1'],
              cols: [44, 16, 50, 22, 24],
              rows: [
                [{ v: `مبالغ رواتب ${P} — ${MP_MONTH(ym)}${p ? ` — اعتمدها ${p.approvedBy}` : ' — غير معتمدة'}`, s: 12 }],
                [],
                [part === 'in' ? 'الكفالة' : 'الفرع', 'المبلغ', 'التفاصيل', 'التحويل', 'المرجع'].map((v) => ({ v, s: 2 })),
                ...rows.map((x) => {
                  const t = p && (p.transfers || {})[x.key];
                  return [
                    { v: x.key, s: 4 },
                    { v: x.amount, s: 7 },
                    {
                      v: Object.entries(x.by || {})
                        .filter(([, v]) => v)
                        .map(([k, v]) => `${k}: ${fmtNum(v)}`)
                        .join(' · '),
                      s: 4,
                    },
                    { v: t && t.done ? `تم ${SF.fmtDate(t.at.slice(0, 10))}` : '—', s: 13 },
                    { v: (t && t.ref) || '', s: 13 },
                  ];
                }),
                [
                  { v: 'الإجمالي', s: 9 },
                  { v: Math.round(rows.reduce((t, x) => t + x.amount, 0) * 100) / 100, s: 8 },
                  { v: '', s: 9 },
                  { v: '', s: 9 },
                  { v: '', s: 9 },
                ],
              ],
            },
          ]);
        };
      });
    };
    draw();
  }

  /* أحداث draw */
  function wireDraw2(act, main) {
    $$('[data-cancel]', main).forEach((b) => {
      b.onclick = async () => {
        const reason = await askText('إلغاء اعتماد هذه المبالغ', 'سبب الإلغاء (إلزامي — يظهر في السجل)');
        if (reason !== null) act('cancel', { part: b.dataset.cancel, reason }, 'ألغيت الاعتماد');
      };
    });
    $$('[data-tr]', main).forEach((b) => {
      b.onclick = () => {
        const ref = prompt(`تأكيد تحويل مبلغ «${b.dataset.tr}» — رقم الحوالة / المرجع (اختياري):`);
        if (ref === null) return;
        act('transfer', { part: b.dataset.part, key: b.dataset.tr, ref }, 'تم تأكيد التحويل');
      };
    });
    $$('[data-undo]', main).forEach((b) => {
      b.onclick = async () => {
        if (await askYesNo('إلغاء تأكيد التحويل؟'))
          act('transfer', { part: b.dataset.part, key: b.dataset.undo, undo: true }, 'ألغيت التأكيد');
      };
    });
  }

  /* أحداث draw: #pfM، #pfBrX */
  function wireDraw(brTable, rowsOf, ym) {
    $('#pfM').onchange = () => {
      location.hash = `#/pay-funding?month=${$('#pfM').value}`;
    };
    $('#pfBrX').onclick = () => {
      const L = brTable(),
        S = (k) => Math.round(L.reduce((t, x) => t + x[k], 0) * 100) / 100,
        K = rowsOf('in');
      downloadXlsxStyled(`ملخص مبالغ رواتب الفروع - ${MP_MONTH(ym)}.xlsx`, [
        {
          name: 'ملخص الفروع',
          merges: ['A1:D1'],
          cols: [26, 18, 24, 18],
          rows: [
            [{ v: `ملخص مبالغ رواتب الفروع — ${MP_MONTH(ym)}`, s: 12 }],
            [],
            ['الفرع', 'داخل الكفالة', 'خارج الكفالة (يصرفه الفرع)', 'الإجمالي'].map((v) => ({ v, s: 2 })),
            ...L.map((x) => [
              { v: x.b, s: 4 },
              { v: x.in, s: 5 },
              { v: x.out, s: 5 },
              { v: x.all, s: 7 },
            ]),
            [
              { v: 'الإجمالي', s: 9 },
              { v: S('in'), s: 8 },
              { v: S('out'), s: 8 },
              { v: S('all'), s: 8 },
            ],
          ],
        },
        {
          name: 'داخل الكفالة لكل كفالة',
          merges: ['A1:B1'],
          cols: [46, 18],
          rows: [
            [{ v: `إجمالي داخل الكفالة لكل كفالة — ${MP_MONTH(ym)}`, s: 12 }],
            [],
            ['الكفالة', 'المبلغ'].map((v) => ({ v, s: 2 })),
            ...K.map((x) => [
              { v: x.key, s: 4 },
              { v: x.amount, s: 7 },
            ]),
            [
              { v: 'إجمالي داخل الكفالة', s: 9 },
              { v: S('in'), s: 8 },
            ],
            [
              { v: 'إجمالي خارج الكفالة', s: 9 },
              { v: S('out'), s: 8 },
            ],
            [
              { v: 'الإجمالي العام', s: 9 },
              { v: S('all'), s: 8 },
            ],
          ],
        },
      ]);
    };
  }
  /* أحداث viewBranchPay: #bpMonX، #bpRecX، #bpAllX */
  function wireBranchPay(COLS, rows, ym) {
    $('#bpMonX').onclick = async () => {
      try {
        const D2 = await bpMonthData(ym);
        bpMonthXlsx(D2.list, D2.branches, ym);
      } catch (e) {
        toast(e.message, true);
      }
    };
    $('#bpRecX').onclick = async () => {
      try {
        const D2 = await bpMonthData(ym);
        if (!D2.list.length) return toast('لا توجد بيانات رواتب لهذا الشهر', true);
        bpReconXlsx(
          D2.list.sort((a, b2) => a.branch.localeCompare(b2.branch, 'ar')),
          ym,
          D2.company,
        );
      } catch (e) {
        toast(e.message, true);
      }
    };
    $('#bpAllX').onclick = () =>
      downloadXlsx(
        `مجمع بيانات رواتب الفروع ${ym}.xlsx`,
        [
          ['الفرع', 'الحالة', 'معد الرواتب', ...COLS.map(([, l]) => l)],
          ...rows.filter((r2) => r2.x).map(({ b, x }) => [b, BP_ST[x.status][0], x.preparer, ...COLS.map(([k]) => x.sum[k])]),
        ],
        ym,
      );
  }

  /* بيان الفرع: مقسّم على الكفالات، كل صف مختصر (الإجمالي، الخصومات، الصافي المستلم، مصروف الرواتب) والتفاصيل في لوحة جانبية */
  async function bpEditor(main, query, m) {
    /* حالة الصفحة: ما يتغير بعد العرض (open، showAll، SC، tab، zoom، zNow) */
    const vs = {};
    const x = await api('GET', `/api/branch-pay/${query.id}`);
    const ed = x.canEdit,
      lines = x.lines.map((l) => ({ ...l, kafala: SF.bpKaf(l.kafala) }));
    vs.open = query.k || '';
    const kafOrder = ['', ...SF.BP_KAFALA];
    /* أعمدة البيان بنفس نموذج Excel الفروع (داخل الكفالة / خارج الكفالة): g = مجموعة الرأس (a بدلات ثابتة، d الخصومات) */
    const n0 = (v) => Number(String(v == null ? '' : v).replace(/,/g, '')) || 0;
    const wk = (c) => c.code === 1 || c.code === 6,
      wn = (c, v) => (wk(c) ? n0(v) : 0);
    const wnD = (c, v) => (wk(c) ? n0(v) : 0); // الخصومات بقيمتها كما أُدخلت
    const BXC = [
      { h: 'م', f: (l, c, j) => j, t: 'i' },
      { h: 'الإسم', f: (l) => l.name || '', t: 'name' },
      { h: 'رقم الإقامة', f: (l) => l.iqama || '', t: 'ltr' },
      { h: 'الوظيفة', f: (l) => l.title || '' },
      bpEditorValue(),
      { h: 'الراتب الأساسي', f: (l, c) => wn(c, l.basic), t: 'basic' },
      ...SF.BP_ALLOW.map(([k, h]) => ({ h, g: 'a', f: (l, c) => wn(c, l[k]) })),
      { h: 'مستحقات أخرى', f: (l) => n0(l.due) },
      { h: 'بصمة', g: 'd', f: (l, c) => wnD(c, l.fp) },
      { h: 'جزاءات / غياب', g: 'd', f: (l, c) => wnD(c, l.penalty) + wnD(c, l.absence) },
      { h: 'تأمينات إجتماعية', g: 'd', f: (l, c) => wnD(c, l.gosiDed) },
      { h: 'سلف', g: 'd', f: (l, c) => wnD(c, l.adv) },
      { h: 'عهد', g: 'd', f: (l, c) => wnD(c, l.custody) },
      { h: 'خصم قانوني', g: 'd', f: (l, c) => wnD(c, l.legal) },
      { h: 'خصم أيام (بداية دوام)', g: 'd', f: (l, c) => c.daysDed || 0 },
      { h: 'إجمالي خصومات', g: 'd', f: (l, c) => (wk(c) ? c.ded : 0), t: 'dt' },
      { h: 'الإجمالي', f: (l, c) => c.paid, t: 'net' },
      { h: 'ملاحظات', f: (l) => l.notes || '' },
      { h: 'الإيبان', f: (l) => l.iban || '', t: 'ltr' },
      { h: 'البنك', f: (l) => l.bank || '' },
      { h: 'التأمينات', f: (l, c) => c.gosi, t: 'gosi' },
    ];
    const BXG = { a: 'بـدلات ثابتة', d: 'الخصومات' },
      LEAD = BXC.findIndex((c) => c.t === 'basic'); // أعمدة النص قبل الأرقام
    const kafTitle = (k) => (!k ? 'بدون كفالة' : k === SF.BP_OUT ? 'كفالة خارجية' : `كفالة ${k}`);
    const expLbl = (t) => `مصروف رواتب ${t} (وخصم البصمة والغياب والجزاءات — بدون التأمينات)`;
    const isSettle = (l) => [2, 3].includes(SF.bpCalc(l).code); // تصفية / توزيع تصفية ← تبويب التصفيات
    const isLeave = (l) => SF.bpCalc(l).code === 5; // بدلات أثناء الأجازة ← خارج الكفالة (البدل فقط)
    const isOut = (l) => !isSettle(l) && (l.kafala === SF.BP_OUT || isLeave(l));
    const tabOf = (l) => (isSettle(l) ? 'settle' : isOut(l) ? 'out' : 'in');
    const TAB_N = { in: 'داخل الكفالة', out: 'خارج الكفالة', settle: 'التصفيات' };
    const secOf = (k) => lines.map((l, i) => [l, i]).filter(([l]) => (l.kafala || '') === k && !isSettle(l) && !isLeave(l));
    const leaveOf = () => lines.map((l, i) => [l, i]).filter(([l]) => isLeave(l));
    const groupsOf = (t) =>
      t === 'out'
        ? [
            { key: SF.BP_OUT, title: kafTitle(SF.BP_OUT), idx: secOf(SF.BP_OUT), kind: 'ext' },
            { key: '__leave', title: 'بدلات أثناء الأجازة', idx: leaveOf(), kind: 'leave' },
          ]
        : t === 'in'
          ? kafOrder.filter((k) => k !== SF.BP_OUT).map((k) => ({ key: k, title: kafTitle(k), idx: secOf(k), kind: k ? 'in' : 'none' }))
          : [];
    const settleOf = () => lines.map((l, i) => [l, i]).filter(([l]) => isSettle(l));
    /* أعمدة تبويب التصفيات */
    const STC = [
      { h: 'م', f: (l, c, j) => j, t: 'i' },
      { h: 'الإسم', f: (l) => l.name || '', t: 'name' },
      { h: 'رقم الإقامة', f: (l) => l.iqama || '', t: 'ltr' },
      { h: 'الوظيفة', f: (l) => l.title || '' },
      { h: 'الكفالة', f: (l) => l.kafala || '—' },
      { h: 'الحالة', f: (l) => l.status || '', t: 'st' },
      { h: 'مبلغ التصفية / الجزء المحمل على الفرع', f: (l) => n0(l.settlement), t: 'net' },
      { h: 'مستحقات أخرى', f: (l) => n0(l.due) },
      { h: 'تأمينات الشركة', f: (l, c) => c.gosi },
      { h: 'مصروف الرواتب', f: (l, c) => c.expense, t: 'dt' },
      { h: 'ملاحظات', f: (l) => l.notes || '' },
      { h: 'الإيبان', f: (l) => l.iban || '', t: 'ltr' },
      { h: 'البنك', f: (l) => l.bank || '' },
    ];
    const SLEAD = STC.findIndex((c) => c.t === 'net');
    const stNum = (cl) => typeof cl.f({}, { code: 0, ded: 0, paid: 0, gosi: 0, expense: 0 }, 0) === 'number';
    const stSum = (idx, cl) => idx.reduce((t, [l]) => t + cl.f(l, SF.bpCalc(l), 0), 0);
    bpEditorPart(vs);
    vs.SC = BXC;
    const KEEP = ['i', 'name', 'st', 'basic', 'net', 'dt'];
    const calcSC = () => {
      vs.SC = vs.showAll
        ? BXC
        : BXC.filter(
            (cl, ci) =>
              ci < LEAD ||
              KEEP.includes(cl.t) ||
              lines.some((l) => {
                const v = cl.f(l, SF.bpCalc(l), 1);
                return typeof v === 'number' ? v !== 0 : String(v || '').trim() !== '';
              }),
          );
    };
    const isNum = (cl, ci) => ci >= LEAD && typeof cl.f({}, { code: 0, ded: 0, paid: 0, gosi: 0 }, 0) === 'number';
    const colSums = (idx) => BXC.map((cl, ci) => (isNum(cl, ci) ? idx.reduce((s, [l]) => s + cl.f(l, SF.bpCalc(l), 0), 0) : null));
    vs.tab = query.k === SF.BP_OUT ? 'out' : 'in';
    /* نقل موظف: داخل الكفالة (مع اختيار الكفالة) / خارج الكفالة */
    const moveIn = (...args) => bpEditorMoveIn(draw, isLeave, kafTitle, lines, tabOf, vs, ...args);
    /* الرفع الجماعي: نموذج Excel بموظفي البيان، يعبّئه المحاسب ويرفعه فيُطابق برقم الإقامة (ثم الاسم) */
    const UPC = [
      ['name', 'الإسم'],
      ['iqama', 'رقم الإقامة'],
      ['title', 'الوظيفة'],
      ['kafala', 'الكفالة'],
      ['status', 'الحالة'],
      ['basic', 'الراتب الأساسي'],
      ...SF.BP_ALLOW,
      ['due', 'مستحقات أخرى'],
      ['startDate', 'تاريخ بداية الدوام'],
      ['settlement', 'مبلغ التصفية / الجزء المحمل'],
      ['leaveAllow', 'بدلات أثناء الأجازة'],
      ...SF.BP_DED,
      ['iban', 'الإيبان'],
      ['bank', 'البنك'],
      ['notes', 'ملاحظات'],
    ];
    const UP_TXT = ['name', 'iqama', 'title', 'kafala', 'status', 'startDate', 'iban', 'bank', 'notes'];
    const upTemplate = (...args) => bpEditorUpTemplate(UPC, UP_TXT, lines, n0, x, ...args);
    const upImport = (...args) => bpEditorUpImport(UPC, UP_TXT, lines, ...args);
    const moveBack = (i) => {
      const l = lines[i],
        k = orgKaf(l);
      if (!k) return;
      l.kafala = k;
      l.fromKafala = '';
      l.autoOut = false;
      vs.open = k;
      vs.tab = tabOf(l);
      toast(`أعدنا «${l.name}» إلى ${kafTitle(k)}`);
      draw();
    };
    const moveOut = (i) => {
      const l = lines[i];
      l.autoOut = false;
      if (l.kafala && l.kafala !== SF.BP_OUT) l.fromKafala = l.kafala;
      l.kafala = SF.BP_OUT;
      vs.open = SF.BP_OUT;
      toast(`نُقل «${l.name}» إلى خارج الكفالة`);
      draw();
    };
    const settleHtml = (...args) => bpEditorSettleHtml(SLEAD, STC, cellHtml, m, settleOf, stNum, stSum, ...args);
    const orgKaf = (l) => l.fromKafala || (l.empKafala && l.empKafala !== SF.BP_OUT ? l.empKafala : '');
    const cellHtml = (cl, l, c, j, i) => {
      const v = cl.f(l, c, j);
      if (cl.t === 'i') return `<td class="muted">${j}</td>`;
      if (cl.t === 'name')
        return `<td class="bx-nm"><b>${esc(v || '—')}</b>${l.kafala === SF.BP_OUT && orgKaf(l) ? `<span class="bx-from">⚠ على كفالة ${esc(orgKaf(l))}${l.autoOut ? ' — خصومات أكثر من 50%' : ''}</span>` : ''}${l.trNote ? `<span class="bx-tr">🔀 ${esc(l.trNote)}</span>` : ''}${c.nat || c.code === 5 ? `<small>${esc([c.nat, c.code === 5 ? l.kafala || 'بدون كفالة' : ''].filter(Boolean).join(' · '))}</small>` : ''}</td>`;
      if (cl.t === 'st')
        return `<td>${ed ? `<select class="bp-in" data-st="${i}">${SF.BP_STATUS.map((o) => `<option${o === l.status ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>` : esc(l.status || '')}${c.code === 6 ? `<small class="bx-sd">${l.startDate ? `من ${esc(SF.fmtDate(l.startDate))} — ${c.days} يوم` : '⚠ حدد تاريخ المباشرة'}</small>` : ''}${(l.autoSt || l.setRef) && l.stNote ? `<small class="bx-auto" title="تلقائياً من شئون الموظفين">🗓 ${esc(l.stNote)}</small>` : ''}</td>`;
      if (cl.t === 'ltr') return `<td><bdi dir="ltr">${esc(v)}</bdi></td>`;
      if (typeof v !== 'number') return `<td class="bx-tx">${esc(v)}</td>`;
      return `<td class="${{ basic: 'bx-b', net: 'bx-n', dt: 'bx-dt' }[cl.t] || (cl.g === 'd' ? 'bx-d' : '')}">${v ? m(v) : '-'}</td>`;
    };
    const rowHtml = (l, i, j) => {
      const c = SF.bpCalc(l);
      return `<tr class="bp-r${c.warn.length ? ' bp-bad' : ''}" data-row="${i}" title="${ed ? 'اضغط للتعديل' : 'اضغط للعرض'}">${vs.SC.map((cl) => cellHtml(cl, l, c, j, i)).join('')}
      <td>${c.warn.length ? `<span class="chip doc-bad" title="${esc(c.warn.join('؛ '))}">${esc(c.warn[0])}${c.warn.length > 1 ? ` +${c.warn.length - 1}` : ''}</span>` : '<span class="chip doc-ok">سليم</span>'}</td>${mvCell(l, i)}</tr>`;
    };
    const mvCell = (l, i) =>
      !ed
        ? ''
        : `<td class="bx-mv">${l.kafala === SF.BP_OUT && orgKaf(l) ? `<button type="button" class="btn sm bx-back" data-mvback="${i}" title="${esc(`إرجاع إلى ${orgKaf(l)}`)}">↩ إرجاع لكفالته</button>` : isOut(l) || !l.kafala ? `<button type="button" class="btn sm" data-mvin="${i}" title="${esc(l.empKafala && l.empKafala !== SF.BP_OUT ? `نقل إلى ${l.empKafala} (من ملف الموظف)` : 'نقل إلى داخل الكفالة — اختر الكفالة')}">↙ داخل الكفالة</button>` : ''}${!isOut(l) ? `<button type="button" class="btn sm ghost" data-mvout="${i}" title="نقل إلى كفالة خارجية">↗ خارج الكفالة</button>` : ''}</td>`;
    const theadHtml = () => {
      const r1 = [],
        r2 = [];
      vs.SC.forEach((cl, ci) => {
        if (!cl.g) r1.push(`<th rowspan="2"${cl.t === 'basic' ? ' class="bx-hb"' : ''}>${esc(cl.h)}</th>`);
        else {
          if (vs.SC[ci - 1].g !== cl.g)
            r1.push(`<th colspan="${vs.SC.filter((x) => x.g === cl.g).length}" class="bx-g${cl.g}">${BXG[cl.g]}</th>`);
          r2.push(`<th class="bx-g${cl.g}">${esc(cl.h)}</th>`);
        }
      });
      return `<thead><tr>${r1.join('')}<th rowspan="2">التحقق</th>${ed ? '<th rowspan="2">نقل</th>' : ''}</tr><tr>${r2.join('')}</tr></thead>`;
    };
    const sections = (...args) => bpEditorSections(LEAD, ed, expLbl, groupsOf, m, rowHtml, theadHtml, vs, ...args);
    const tabsHtml = () => {
      const ns = settleOf().length,
        no = lines.filter(isOut).length;
      return `<div class="bx-tabs"><button type="button" class="${vs.tab === 'in' ? 'on' : ''}" data-tab="in">داخل الكفالة <small>${lines.length - no - ns}</small></button><button type="button" class="${vs.tab === 'out' ? 'on' : ''}" data-tab="out">خارج الكفالة <small>${no}</small></button><button type="button" class="${vs.tab === 'settle' ? 'on' : ''}" data-tab="settle">التصفيات <small>${ns}</small></button></div>`;
    };
    /* حجم الجدول: «ملاءمة الشاشة» يصغّره على قد العرض، و− / + للتكبير والتصغير (يُحفظ في المتصفح) */
    bpEditorPart2(vs);
    const zoomBar = () =>
      `<div class="bx-zoom"><button type="button" class="btn sm ghost" data-zoom="out" title="تصغير">−</button><span id="bxZ">100%</span><button type="button" class="btn sm ghost" data-zoom="in" title="تكبير">+</button><button type="button" class="btn sm${vs.zoom === 'fit' ? ' primary' : ''}" data-zoom="fit" title="على قد عرض الشاشة">↔ ملاءمة الشاشة</button><button type="button" class="btn sm${vs.showAll ? ' primary' : ' ghost'}" id="bxCols" title="${vs.showAll ? 'إخفاء الأعمدة الفارغة' : `إظهار الأعمدة الفارغة (${BXC.length - vs.SC.length})`}">▦ كل الأعمدة</button></div>`;
    vs.zNow = 1;
    const applyZoom = (...args) => bpEditorApplyZoom(main, vs, ...args);
    const setZoom = (z) => {
      vs.zoom = z;
      try {
        localStorage.setItem('bpZoom', z);
      } catch {
        /* متصفح بلا تخزين */
      }
      draw();
    };
    bpEditorPart3(applyZoom, main, vs);
    /* ملف Excel بنفس شكل النموذج: ورقة داخل الكفالة، ورقة خارج الكفالة، وملخص الكفالات */
    const bpExcel = (...args) =>
      bpEditorBpExcel(BXC, BXG, LEAD, SLEAD, STC, colSums, expLbl, groupsOf, lines, settleOf, stNum, stSum, x, ...args);
    const top = () => {
      const S = SF.bpSummary(lines);
      const st = !x.preparer
        ? ['ناقص — اكتب اسم معد الرواتب', 'doc-bad']
        : S.unassigned
          ? [`${S.unassigned} موظف بدون كفالة`, 'doc-bad']
          : S.warnings
            ? [`${S.warnings} تنبيه — راجع عمود التحقق`, 'doc-bad']
            : ['سليم — جاهز للإرسال', 'doc-ok'];
      return `<div class="bp-kpis"><div class="bp-k ok"><small>المرفوع على مدد</small><b>${m(S.mudad)}</b><span>${SF.BP_KAFALA.filter((k) => k !== SF.BP_OUT && S.byKafala[k].n).length} كفالة</span></div>
        <div class="bp-k warn"><small>خارج مدد</small><b>${m(S.outside)}</b><span>كفالات خارجية ${m(S.external)} · تصفيات ${m(S.settle)}</span></div>
        <div class="bp-k bad"><small>مصروف رواتب الفرع</small><b>${m(S.expense)}</b><span>منها تصفيات ${m(S.settle)} · تأمينات الشركة (منفصلة) ${m(S.gosi)}</span></div>
        <div class="bp-k"><small>الموظفون</small><b>${S.count}</b><span>الصافي المستلم ${m(S.paid)}</span></div></div>
        <div class="bp-audit"><span class="chip ${st[1]}">لوحة التدقيق: ${st[0]}</span><span class="muted">الخصومات: سلف ${m(S.ded.adv)} · عهد ${m(S.ded.custody)} · قانوني ${m(S.ded.legal)} · جزاءات ${m(S.ded.penalty)} · غياب ${m(S.ded.absence)} · بصمة ${m(S.ded.fp)} · تأمينات ${m(S.ded.gosiDed)}</span></div>`;
    };
    const rule50 = (...args) => bpEditorRule50(ed, isSettle, lines, ...args);
    const draw = (...args) =>
      bpEditorDraw(applyZoom, bind, calcSC, ed, main, rule50, sections, settleHtml, tabsHtml, top, vs, x, zoomBar, ...args);
    const save = async (quiet) => {
      const r2 = await api('PUT', `/api/branch-pay/${x.id}`, { preparer: x.preparer, lines });
      Object.assign(x, r2);
      if (!quiet) toast('تم الحفظ');
    };
    /* لوحة تفاصيل الموظف */
    const drawer = (...args) => bpEditorDrawer(draw, ed, lines, m, rule50, tabOf, vs, x, ...args);
    /* ملف الرفع على مدد لكل كفالة (بأعمدة نموذج رفع الرواتب) */
    const mudadFile = (...args) => bpEditorMudadFile(lines, x, ...args);
    const bind = (...args) =>
      bpEditorBind(
        TAB_N,
        applyZoom,
        bpExcel,
        draw,
        drawer,
        ed,
        lines,
        main,
        moveBack,
        moveIn,
        moveOut,
        mudadFile,
        query,
        save,
        setZoom,
        tabOf,
        top,
        upImport,
        upTemplate,
        vs,
        x,
        ...args,
      );
    draw();
  }
  /* applyZoom من bpEditor (يأخذ main، vs من الصفحة) */
  function bpEditorApplyZoom(main, vs) {
    const T = $$('.bpx', main);
    if (vs.zoom === 'fit') {
      T.forEach((t) => {
        t.style.zoom = '';
      });
      const ws = T.map((t) => {
        const w = t.closest('.tbl-wrap');
        return w && w.clientWidth ? w.clientWidth / t.scrollWidth : 1;
      });
      vs.zNow = Math.max(0.5, Math.min(1, ...ws));
    } else vs.zNow = Number(vs.zoom) || 1;
    T.forEach((t) => {
      t.style.zoom = vs.zNow;
    });
    if ($('#bxZ', main)) $('#bxZ', main).textContent = `${Math.round(vs.zNow * 100)}%`;
  }
  /* draw من bpEditor (يأخذ applyZoom، bind، calcSC، ed، main، rule50، sections، settleHtml، tabsHtml، top، vs، x، zoomBar من الصفحة) */
  function bpEditorDraw(applyZoom, bind, calcSC, ed, main, rule50, sections, settleHtml, tabsHtml, top, vs, x, zoomBar) {
    rule50();
    calcSC();
    main.innerHTML = `${head(
      `بيان رواتب فرع ${esc(x.branch)} — ${esc(MP_MONTH(x.month))}`,
      `<span class="chip ${BP_ST[x.status][1]}">${BP_ST[x.status][0]}</span> ${x.submittedAt ? `أرسلته ${esc(dt(x.submittedAt))}` : ''}${x.reviewedBy ? ` — راجعه ${esc(x.reviewedBy)}` : ''}${x.approvedBy ? ` — اعتمده ${esc(x.approvedBy)}` : ''}<div class="muted" style="font-size:12.5px;margin-top:4px">المسار: محاسب الفرع ← مراجعة ${esc(x.flow.reviewer || '—')} ← اعتماد ${esc(x.flow.approver || '—')}</div>`,
      `<a class="btn ghost" href="#/branch-pay${x.month ? `?month=${x.month}` : ''}">→ البيانات</a><button class="btn" id="bpX">📊 Excel البيان</button><button class="btn" id="bpRec" title="نموذج مطابقة رواتب الفرع مع مصروف رواتب الشهر">⚖ مطابقة الفرع</button>${ed ? '<button class="btn ghost" id="bpDel" title="حذف المسودة (قبل الإرسال للمراجعة)">🗑 حذف المسودة</button><button class="btn" id="bpSave">💾 حفظ</button><button class="btn primary" id="bpSend">📤 إرسال للمراجعة</button>' : ''}${x.canReturn ? '<button class="btn ghost" id="bpRet">↩ إرجاع للتعديل</button>' : ''}${x.canPass ? '<button class="btn primary" id="bpPass">✔ مراجعة ورفع للاعتماد</button>' : ''}${x.canApprove ? '<button class="btn primary" id="bpOk">✔ اعتماد</button>' : ''}`,
    )}
        ${(x.log || [])
          .filter((g) => g.note)
          .slice(-1)
          .map((g) => `<div class="emp-al ${x.status === 'returned' ? 'warn' : ''}">${esc(g.action)} — ${esc(g.by)}: ${esc(g.note)}</div>`)
          .join('')}
        <div id="bpTop">${top()}</div>
        <div class="card bp-tools"><label>معد الرواتب</label>${ed ? `<input class="in" id="bpPrep" value="${esc(x.preparer || '')}" style="max-width:220px">` : `<b>${esc(x.preparer || '—')}</b>`}
          <input class="in" id="bpQ" placeholder="بحث بالاسم أو الإقامة..." style="max-width:240px">
          ${ed ? `<span class="row" style="gap:6px;margin-inline-start:auto"><select class="in" id="bpKafAll" style="width:auto"><option value="">كفالة للموظفين بدون كفالة...</option>${SF.BP_KAFALA.map((k) => `<option>${esc(k)}</option>`).join('')}</select><button class="btn sm" id="bpKafGo">تطبيق</button><button class="btn sm" id="bpAdd">➕ موظف</button><button class="btn sm" id="bpUpT" title="نموذج Excel بموظفي البيان للتعبئة والرفع الجماعي">📥 نموذج الرفع</button><label class="btn sm primary" title="رفع النموذج بعد تعبئته">📤 رفع Excel<input type="file" id="bpUpF" accept=".xlsx" hidden></label></span>` : ''}</div>
        <div class="bx-bar">${tabsHtml()}${zoomBar()}</div><div id="bpSecs">${vs.tab === 'settle' ? settleHtml() : sections()}</div>`;
    bind();
    applyZoom();
  }
  /* rule50 من bpEditor (يأخذ ed، isSettle، lines من الصفحة) */
  function bpEditorRule50(ed, isSettle, lines) {
    if (!ed) return;
    const out = [],
      back = [];
    for (const l of lines) {
      const c = SF.bpCalc(l);
      if (l.kafala && l.kafala !== SF.BP_OUT && !isSettle(l) && SF.bpOver50(l, c)) {
        l.fromKafala = l.kafala;
        l.kafala = SF.BP_OUT;
        l.autoOut = true;
        out.push(l.name);
      } else if (l.autoOut && l.kafala === SF.BP_OUT && l.fromKafala && !SF.bpOver50(l, c)) {
        l.kafala = l.fromKafala;
        l.fromKafala = '';
        l.autoOut = false;
        back.push(l.name);
      }
    }
    if (out.length) toast(`نُقل تلقائياً إلى خارج الكفالة (خصومات أكثر من 50% من الراتب — مدد لا تقبلها): ${out.join('، ')}`, true);
    if (back.length) toast(`أعاده النظام تلقائياً لكفالته بعد نزول الخصومات إلى 50% أو أقل: ${back.join('، ')}`);
  }
  return { viewPayFunding, partPart, partValue, bpMonthXlsxPart2, bpEditor, wireBranchPay };
};
