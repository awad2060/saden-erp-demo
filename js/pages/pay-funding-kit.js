'use strict';
/* أجزاء صفحة تمويل الرواتب ورواتب الفروع (1) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['pay-funding'] = function (S, ctx) {
  const { $, $$, MP_MONTH, SF, api, askYesNo, colName, downloadXlsx, dt, esc, head, normAr, normDate, readXlsx, toast } = S;
  const { bpReconXlsx, downloadXlsxStyled, viewBranchPay } = ctx;
  /* جزء من card: p && tr ? '<th>التحويل</th>' : ''… */
  function cardValue(p, tr) {
    return p && tr ? '<th>التحويل</th>' : '';
  }
  /* جزء من card: p ? `<div class="muted" style="font-size:12.5px;margin:6px 0… */
  function cardHtml(p) {
    return p
      ? `<div class="muted" style="font-size:12.5px;margin:6px 0">اعتمده ${esc(p.approvedBy)} — ${esc(dt(p.approvedAt))}${p.note ? ` — ${esc(p.note)}` : ''}${(p.pending || []).length ? ` — <span class="pf-pend" title="${esc(p.pending.join('، '))}">لم يدخل ${p.pending.length} فرع (بيانه غير معتمد وقت الاعتماد)</span>` : ''}</div>`
      : '';
  }
  /* محتوى draw (HTML) */
  function renderDraw(BST, branchSum, card, d, main, pend, ym) {
    main.innerHTML = `${head('اعتماد وتحويل مبالغ الرواتب', `شهر ${esc(MP_MONTH(ym))} — يعتمد ${esc(d.flow.approver || 'مدير قسم الرواتب')} مبالغ داخل الكفالة وخارج الكفالة كلٌّ على حدة، فتُرسل إلى ${esc(d.flow.finance || 'المدير المالي')} للتحويل`, `<a class="btn ghost" href="#/branch-pay?month=${ym}">→ بيانات الفروع</a>`)}
        <div class="card"><div class="row" style="gap:8px"><label>الشهر</label><input class="in" type="month" id="pfM" value="${ym}" style="width:auto"></div>
          ${pend.length ? `<div class="emp-al warn" style="margin-top:10px">المبالغ من البيانات <b>المعتمدة</b> فقط — لم يعتمده أحد بعد (${pend.length}): ${pend.map((p) => `${esc(p.branch)} <small>(${BST[p.status] || p.status})</small>`).join('، ')}</div>` : '<div class="emp-al" style="margin-top:10px">✔ كل بيانات الفروع معتمدة لهذا الشهر</div>'}</div>
        ${branchSum()}<div class="pf-grid">${card('in', 'داخل الكفالة', 'تحوّله الإدارة على حساب كل كفالة لصرف الرواتب عبر مدد', 'الكفالة')}${card('out', 'خارج الكفالة', 'يصرفه محاسب كل فرع من الفرع: الكفالات الخارجية والتصفيات وما تصرفه الإدارة خارج مدد — للعلم', 'الفرع')}</div>`;
  }
  /* أجزاء تمويل الرواتب (3) (pay-funding-kit-3.js) */
  const {
    bpEditorValue,
    bpEditorPart,
    bpEditorPart2,
    bpEditorPart3,
    bpEditorUpImport,
    bpEditorSettleHtml,
    bpEditorBpExcel,
    bpEditorDrawer,
    bpEditorBind,
  } = window.SES_PAGE_KITS['pay-funding-3'](S, { bpReconXlsx, downloadXlsxStyled, viewBranchPay });

  /* sections من bpEditor (يأخذ LEAD، ed، expLbl، groupsOf، m، rowHtml، theadHtml، vs من الصفحة) */
  function bpEditorSections(LEAD, ed, expLbl, groupsOf, m, rowHtml, theadHtml, vs) {
    return (
      groupsOf(vs.tab)
        .map(({ key: k, title, idx, kind }) => {
          if (!idx.length) return '';
          const S = SF.bpSummary(idx.map(([l]) => l)),
            ext = kind === 'ext' || kind === 'leave',
            none = kind === 'none',
            sums = vs.SC.map((cl, ci) =>
              ci >= LEAD && typeof cl.f({}, { code: 0, ded: 0, paid: 0, gosi: 0 }, 0) === 'number'
                ? idx.reduce((t, [l]) => t + cl.f(l, SF.bpCalc(l), 0), 0)
                : null,
            ),
            rest = vs.SC.length - LEAD + (ed ? 1 : 0);
          return `<details class="card bp-sec${none ? ' bp-none' : ext ? ' bp-ext' : ''}"${vs.open === k || none || idx.length <= 40 ? ' open' : ''} data-kaf="${esc(k)}">
        <summary><span class="bp-sh"><b>${none ? '⚠ بدون كفالة' : esc(title)}</b><small>${idx.length} موظف${kind === 'leave' ? ' — تصرف البدل فقط خارج مدد' : ''}</small></span>
          <span class="bp-sk">${none ? '<span class="chip doc-bad">حدد الكفالة لهؤلاء الموظفين</span>' : ext ? `<span>خارج مدد: <b>${m(S.paid)}</b></span>` : `<span>المرفوع على مدد: <b>${m(S.mudad)}</b></span>`}<span>مصروف الرواتب: <b>${m(S.expense)}</b></span>
            ${!none && !ext ? `<button type="button" class="btn sm" data-mudadx="${esc(k)}">📤 ملف مدد</button>` : ''}</span></summary>
        <div class="tbl-wrap"><table class="bpx">${theadHtml()}
        <tbody>${idx.map(([l, i], j) => rowHtml(l, i, j + 1)).join('')}</tbody>
        <tfoot><tr class="bx-tot"><td colspan="${LEAD}">إجمالي</td>${sums
          .slice(LEAD)
          .map((v) => `<td>${v == null ? '' : v ? m(v) : '-'}</td>`)
          .join('')}<td></td>${ed ? '<td></td>' : ''}</tr>
          <tr class="bx-exp"><td colspan="${LEAD}">${esc(expLbl(title))}</td><td class="bx-ev">${m(S.expense)}</td><td colspan="${rest}"></td></tr>
          <tr class="bx-exp"><td colspan="${LEAD}">${ext || none ? 'خارج مدد (الصافي + التصفيات)' : 'المرفوع على مدد'}</td><td class="bx-ev">${m(ext || none ? S.outside : S.mudad)}</td><td colspan="${rest}">${!ext && !none && S.outside ? `<span class="muted">خارج مدد من هذه الكفالة (تصفيات / أجازات / مستحقات): <b>${m(S.outside)}</b></span>` : ''}</td></tr></tfoot></table></div></details>`;
        })
        .join('') || `<div class="card empty">لا يوجد موظفون ${vs.tab === 'out' ? 'على كفالة خارجية' : 'داخل كفالات المجموعة'}</div>`
    );
  }
  /* upTemplate من bpEditor (يأخذ UPC، UP_TXT، lines، n0، x من الصفحة) */
  function bpEditorUpTemplate(UPC, UP_TXT, lines, n0, x) {
    const rows = [
      UPC.map(([, h]) => ({ v: h, s: UP_TXT.includes(UPC.find((c) => c[1] === h)[0]) ? 2 : 3 })),
      ...lines.map((l) =>
        UPC.map(([k]) => ({ v: UP_TXT.includes(k) ? String(l[k] || '') : n0(l[k]) || '', s: UP_TXT.includes(k) ? 4 : 5 })),
      ),
    ];
    const help = [
      [{ v: 'طريقة التعبئة', s: 12 }],
      [],
      [{ v: '• عدّل الأرقام في ورقة «البيان» ثم ارفع الملف من زر «📤 رفع Excel» في البيان.', s: 0 }],
      [{ v: '• المطابقة برقم الإقامة، وإن لم يوجد فبالاسم. ويضيف النظام الصف الجديد موظفاً جديداً.', s: 0 }],
      [{ v: '• الخانة الفارغة = صفر. الموظفون غير الموجودين في الملف لا يتغيرون.', s: 0 }],
      [],
      [{ v: 'الكفالات المسموحة', s: 2 }],
      ...SF.BP_KAFALA.map((k) => [{ v: k, s: 4 }]),
      [],
      [{ v: 'الحالات المسموحة', s: 2 }],
      ...SF.BP_STATUS.map((k) => [{ v: k, s: 4 }]),
    ];
    downloadXlsxStyled(`نموذج رفع بيان رواتب ${x.branch} ${x.month}.xlsx`, [
      {
        name: 'البيان',
        rows,
        cols: UPC.map(([k]) => ({ name: 28, iqama: 15, kafala: 34, status: 16, iban: 28, notes: 22, title: 16, bank: 12 })[k] || 11),
      },
      { name: 'تعليمات', rows: help, merges: ['A1:C1'], cols: [70] },
    ]);
    toast(`تم تحميل النموذج (${lines.length} موظف)`);
  }

  /* moveIn من bpEditor (يأخذ draw، isLeave، kafTitle، lines، tabOf، vs من الصفحة) */
  function bpEditorMoveIn(draw, isLeave, kafTitle, lines, tabOf, vs, i) {
    const l = lines[i],
      fk = (l.empKafala && l.empKafala !== SF.BP_OUT ? l.empKafala : '') || l.fromKafala || '';
    /* تلقائياً على الكفالة المسجلة في ملف الموظف؛ الاختيار فقط إن لم تكن مسجلة */
    if (fk) {
      l.kafala = fk;
      l.fromKafala = '';
      if (isLeave(l)) l.status = 'على رأس العمل';
      vs.open = fk;
      vs.tab = tabOf(l);
      toast(`نُقل «${l.name}» إلى ${kafTitle(fk)} (من ملف الموظف)`);
      return draw();
    }
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const IN = SF.BP_KAFALA.filter((k) => k !== SF.BP_OUT);
    bg.innerHTML = `<form class="modal" style="max-width:460px;width:96%" novalidate><h3 style="margin-top:0">↙ نقل إلى داخل الكفالة</h3><p class="muted" style="margin-top:0">${esc(l.name || '')} — لا توجد كفالة داخلية مسجلة في ملف الموظف، اختر الكفالة${isLeave(l) ? '. ستتغير حالته إلى «على رأس العمل»' : ''}</p>
        <div class="field"><label>الكفالة *</label><select class="in" name="k"><option value="">اختر الكفالة...</option>${IN.map((k) => `<option${k === l.kafala ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></div>
        <div class="row" style="gap:8px;margin-top:12px"><button class="btn primary">✔ نقل</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('form', bg).onsubmit = (e) => {
      e.preventDefault();
      const k = $('[name=k]', bg).value;
      if (!k) return toast('اختر الكفالة', true);
      l.kafala = k;
      l.fromKafala = '';
      if (isLeave(l)) l.status = 'على رأس العمل';
      vs.open = k;
      vs.tab = tabOf(l);
      bg.remove();
      toast(`نُقل «${l.name}» إلى ${kafTitle(k)}`);
      draw();
    };
  }
  /* mudadFile من bpEditor (يأخذ lines، x من الصفحة) */
  function bpEditorMudadFile(lines, x, k) {
    const L = lines
      .filter((l) => l.kafala === k)
      .map((l) => [l, SF.bpCalc(l)])
      .filter(([, c]) => c.mudad || c.code === 1 || c.code === 6);
    const n = (v) => Number(v) || 0;
    downloadXlsx(
      `ملف مدد - ${k} - ${x.branch} - ${x.month}.xlsx`,
      [
        [
          'اسم الموظف',
          'رقم هوية الموظف',
          'الراتب الأساسي',
          'بدل السكن',
          'بدل نقل',
          'إجمالي الراتب',
          'خارج دوام (الكمية)',
          'مستحقات أخرى (الكمية)',
          'خصم التأمينات الاجتماعية (نسبة)',
          'غياب (الكمية)',
          'إستقطاعات أخرى (الكمية)',
          'الصافي',
        ],
        ...L.map(([l, c]) => [
          l.name,
          l.iqama,
          n(l.basic),
          n(l.housing),
          n(l.car),
          n(l.basic) + n(l.housing) + n(l.car),
          0,
          n(l.phone) + n(l.site) + n(l.residence) + n(l.otherAllow) + n(l.due),
          0,
          n(l.absence),
          c.ded - n(l.absence),
          c.paid,
        ]),
      ],
      'ملف مسير الرواتب',
    );
  }

  return {
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
  };
};
