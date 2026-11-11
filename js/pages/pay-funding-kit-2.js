'use strict';
/* أجزاء صفحة تمويل الرواتب ورواتب الفروع (2) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['pay-funding-2'] = function (S, ctx) {
  const { $, $$, BP_SHORT, BP_ST, MP_MONTH, SF, api, askText, askYesNo, bpMonthData, bpR2, downloadXlsx, esc, fmtNum, shell, toast } = S;
  const { bpMonthXlsx, bpReconXlsx, cardHtml, cardValue, downloadXlsxStyled, renderDraw } = ctx;
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

  /* محرر بيان الفرع (pay-funding-kit-4.js) */
  const { bpEditor } = window.SES_PAGE_KITS['pay-funding-4'](S, ctx);
  return { viewPayFunding, partPart, partValue, bpMonthXlsxPart2, bpEditor, wireBranchPay };
};
