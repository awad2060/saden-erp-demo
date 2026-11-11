'use strict';
/* محرر بيان رواتب الفرع (bpEditor): نموذج الصفحة P وأجزاؤه — الأعمدة، المجموعات، الرسم، الأحداث */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['pay-funding-4'] = function (S, ctx) {
  const { $, $$, BP_ST, MP_MONTH, SF, api, dt, esc, head, toast } = S;
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
  } = ctx;
  /* بيان الفرع: مقسّم على الكفالات، كل صف مختصر (الإجمالي، الخصومات، الصافي المستلم، مصروف الرواتب) والتفاصيل في لوحة جانبية */
  async function bpEditor(main, query, m) {
    /* حالة الصفحة: ما يتغير بعد العرض (open، showAll، SC، tab، zoom، zNow) */
    const vs = {};
    const x = await api('GET', `/api/branch-pay/${query.id}`);
    const lines = x.lines.map((l) => ({ ...l, kafala: SF.bpKaf(l.kafala) }));
    vs.open = query.k || '';
    /* نموذج الصفحة P: البيان وأعمدته ودوال الرسم والأحداث — كل جزء يضيف ما يعرّفه بالترتيب، وما يُعرَّف بعده (draw) يُقرأ من P وقت الاستدعاء */
    const P = { main, query, m, vs, x, ed: x.canEdit, lines };
    Object.assign(P, bpEdCols());
    Object.assign(P, bpEdGroups(P));
    Object.assign(P, bpEdSettleCols(P));
    bpEditorPart(vs);
    vs.SC = P.BXC;
    Object.assign(P, bpEdColState(P));
    vs.tab = query.k === SF.BP_OUT ? 'out' : 'in';
    Object.assign(P, bpEdMoves(P));
    Object.assign(P, bpEdUpload(P));
    Object.assign(P, bpEdCells(P));
    Object.assign(P, bpEdParts(P));
    /* حجم الجدول: «ملاءمة الشاشة» يصغّره على قد العرض، و− / + للتكبير والتصغير (يُحفظ في المتصفح) */
    bpEditorPart2(vs);
    vs.zNow = 1;
    Object.assign(P, bpEdZoom(P));
    bpEditorPart3(P.applyZoom, main, vs);
    Object.assign(P, bpEdWire(P));
    P.draw();
  }
  /* أعمدة البيان بنفس نموذج Excel الفروع (داخل الكفالة / خارج الكفالة): g = مجموعة الرأس (a بدلات ثابتة، d الخصومات) */
  function bpEdCols() {
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
    return { n0, BXC, BXG, LEAD };
  }
  /* تبويبات البيان ومجموعاته: داخل الكفالة (لكل كفالة)، خارج الكفالة (خارجية + بدلات الأجازة)، التصفيات */
  function bpEdGroups({ lines }) {
    const kafOrder = ['', ...SF.BP_KAFALA];
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
    const orgKaf = (l) => l.fromKafala || (l.empKafala && l.empKafala !== SF.BP_OUT ? l.empKafala : '');
    return { kafTitle, expLbl, isSettle, isLeave, isOut, tabOf, TAB_N, groupsOf, settleOf, orgKaf };
  }
  /* أعمدة تبويب التصفيات */
  function bpEdSettleCols({ n0 }) {
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
    return { STC, SLEAD, stNum, stSum };
  }
  /* الأعمدة الظاهرة (الفارغة تُخفى إلا مع «كل الأعمدة») ومجاميع الأعمدة الرقمية */
  function bpEdColState({ vs, lines, BXC, LEAD }) {
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
    return { calcSC, colSums };
  }
  /* نقل موظف: داخل الكفالة (مع اختيار الكفالة) / خارج الكفالة / إرجاع لكفالته */
  function bpEdMoves(P) {
    const { lines, vs, isLeave, kafTitle, tabOf, orgKaf } = P;
    const moveIn = (...args) => bpEditorMoveIn(P.draw, isLeave, kafTitle, lines, tabOf, vs, ...args);
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
      P.draw();
    };
    const moveOut = (i) => {
      const l = lines[i];
      l.autoOut = false;
      if (l.kafala && l.kafala !== SF.BP_OUT) l.fromKafala = l.kafala;
      l.kafala = SF.BP_OUT;
      vs.open = SF.BP_OUT;
      toast(`نُقل «${l.name}» إلى خارج الكفالة`);
      P.draw();
    };
    return { moveIn, moveBack, moveOut };
  }
  /* الرفع الجماعي: نموذج Excel بموظفي البيان، يعبّئه المحاسب ويرفعه فيُطابق برقم الإقامة (ثم الاسم) */
  function bpEdUpload({ lines, n0, x }) {
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
    return { upTemplate, upImport };
  }
  /* خلايا الجدول وصفوفه ورأسه */
  function bpEdCells({ ed, vs, m, BXG, orgKaf, isOut }) {
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
    return { cellHtml, rowHtml, theadHtml };
  }
  /* أجزاء الصفحة: الأقسام، التصفيات، التبويبات، شريط الحجم، ولوحة المؤشرات والتدقيق */
  function bpEdParts(P) {
    const { lines, x, vs, m, ed, BXC, LEAD, SLEAD, STC, cellHtml, rowHtml, theadHtml, settleOf, stNum, stSum, expLbl, groupsOf, isOut } = P;
    const settleHtml = (...args) => bpEditorSettleHtml(SLEAD, STC, cellHtml, m, settleOf, stNum, stSum, ...args);
    const sections = (...args) => bpEditorSections(LEAD, ed, expLbl, groupsOf, m, rowHtml, theadHtml, vs, ...args);
    const tabsHtml = () => {
      const ns = settleOf().length,
        no = lines.filter(isOut).length;
      return `<div class="bx-tabs"><button type="button" class="${vs.tab === 'in' ? 'on' : ''}" data-tab="in">داخل الكفالة <small>${lines.length - no - ns}</small></button><button type="button" class="${vs.tab === 'out' ? 'on' : ''}" data-tab="out">خارج الكفالة <small>${no}</small></button><button type="button" class="${vs.tab === 'settle' ? 'on' : ''}" data-tab="settle">التصفيات <small>${ns}</small></button></div>`;
    };
    const zoomBar = () =>
      `<div class="bx-zoom"><button type="button" class="btn sm ghost" data-zoom="out" title="تصغير">−</button><span id="bxZ">100%</span><button type="button" class="btn sm ghost" data-zoom="in" title="تكبير">+</button><button type="button" class="btn sm${vs.zoom === 'fit' ? ' primary' : ''}" data-zoom="fit" title="على قد عرض الشاشة">↔ ملاءمة الشاشة</button><button type="button" class="btn sm${vs.showAll ? ' primary' : ' ghost'}" id="bxCols" title="${vs.showAll ? 'إخفاء الأعمدة الفارغة' : `إظهار الأعمدة الفارغة (${BXC.length - vs.SC.length})`}">▦ كل الأعمدة</button></div>`;
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
    return { settleHtml, sections, tabsHtml, zoomBar, top };
  }
  /* حجم الجدول: تطبيق المقاس الحالي، وتغييره مع حفظه في المتصفح */
  function bpEdZoom(P) {
    const { main, vs } = P;
    const applyZoom = (...args) => bpEditorApplyZoom(main, vs, ...args);
    const setZoom = (z) => {
      vs.zoom = z;
      try {
        localStorage.setItem('bpZoom', z);
      } catch {
        /* متصفح بلا تخزين */
      }
      P.draw();
    };
    return { applyZoom, setZoom };
  }
  /* الرسم والحفظ وExcel ولوحة الموظف وملف مدد، وربط الأحداث */
  function bpEdWire(P) {
    const {
      main,
      query,
      m,
      vs,
      x,
      ed,
      lines,
      BXC,
      BXG,
      LEAD,
      SLEAD,
      STC,
      TAB_N,
      colSums,
      expLbl,
      groupsOf,
      settleOf,
      stNum,
      stSum,
      isSettle,
      tabOf,
    } = P;
    const { calcSC, sections, settleHtml, tabsHtml, top, zoomBar, applyZoom, setZoom, moveBack, moveIn, moveOut, upImport, upTemplate } = P;
    /* ملف Excel بنفس شكل النموذج: ورقة داخل الكفالة، ورقة خارج الكفالة، وملخص الكفالات */
    const bpExcel = (...args) =>
      bpEditorBpExcel(BXC, BXG, LEAD, SLEAD, STC, colSums, expLbl, groupsOf, lines, settleOf, stNum, stSum, x, ...args);
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
    return { draw };
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
  return { bpEditor };
};
