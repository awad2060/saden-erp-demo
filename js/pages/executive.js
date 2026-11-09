'use strict';
/* صفحة «executive» (viewExecutive) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['executive'] = function (S) {
  const { $, $$, EX_LEVELS, EX_TABS, SF, api, downloadCsv, esc, exBars, exLevelDefault, exNum, exSar, exStmt, fmtNum, icon, shell, toast } =
    S;
  function exCard(k, i) {
    const pend = k.source === 'finance' && !k.demo;
    const up = k.change > 0,
      cls = k.status === 'bad' ? 'bad' : k.status === 'warn' ? 'warn' : k.status === 'ok' ? 'ok' : '';
    const prog = k.target && k.value != null ? Math.min(100, Math.round((k.value / k.target) * 100)) : null;
    return `<div class="ex-kpi ${cls}${pend ? ' pend' : ''}" data-exk="${i}" title="${pend ? 'نربطه مع الإدارة المالية عند بنائها' : 'اضغط لعرض التفاصيل'}">
      <div class="ex-kpi-h"><span>${esc(k.label)}</span>${pend ? '<em class="ex-src">نربطه مع الإدارة المالية</em>' : k.demo ? '<em class="ex-src demo">توضيحي</em>' : '<em class="ex-src live">حي</em>'}</div>
      <div class="ex-kpi-v">${pend ? '<span class="muted">—</span>' : esc(exNum(k.value, k.unit))}${!pend && k.unit === 'SAR' ? '<small> ر.س</small>' : ''}</div>
      ${k.change != null && !pend ? `<div class="ex-chg ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(k.change)}% <small>عن الفترة السابقة</small></div>` : ''}
      ${k.sub && !pend ? `<div class="ex-sub">${esc(k.sub)}</div>` : ''}
      ${prog != null ? `<div class="ex-prog"><i style="width:${prog}%"></i></div><div class="ex-sub">${prog}% من المستهدف</div>` : ''}
    </div>`;
  }

  /* مبالغ رواتب آخر شهر مسجل (داخل الكفالة وخارجها والإجمالي) — للمدير التنفيذي والمدير العام (public/js/pages/pay-totals.js) */
  const payTotalsCard = (main) => window.SES_PAY_TOTALS && window.SES_PAY_TOTALS.fill(S, $('#exPay', main));

  async function viewExecutive(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (d) */
    const st = {};
    const main = shell('<div class="empty">جاري تحميل مركز القيادة...</div>', '#/dashboard');
    const lvl = EX_LEVELS[query.level] ? query.level : exLevelDefault();
    const allowed = EX_LEVELS[lvl][1];
    const tab = allowed.includes(query.tab) ? query.tab : 'overview';
    const qs = (o) => `#/dashboard?${new URLSearchParams({ ...query, ...o }).toString()}`;
    st.d = undefined;
    try {
      st.d = await api(
        'GET',
        `/api/exec?${new URLSearchParams({ period: query.period || 'month', from: query.from || '', to: query.to || '', branch: query.branch || '', demo: query.demo || '' }).toString()}`,
      );
    } catch (err) {
      main.innerHTML = `<div class="card empty">${esc(err.message)}</div>`;
      return;
    }
    const R = st.d.range,
      PER = [
        ['day', 'يومي'],
        ['week', 'أسبوعي'],
        ['month', 'شهري'],
        ['quarter', 'ربع سنوي'],
        ['year', 'سنوي'],
        ['custom', 'فترة مخصصة'],
      ];
    const cards = [];
    const card = (k) => {
      cards.push(k);
      return exCard(k, cards.length - 1);
    };
    viewExecutivePart2(PER, R, allowed, card, lvl, main, qs, query, st, tab);
    const go = (o) => {
      location.hash = qs(o);
    };
    wireExecutive(go, main);
    payTotalsCard(main);
    wireExXls(R, cards, st, tab);
    /* التفاصيل عند الضغط على أي مؤشر: مكوّنات الرقم ومصدره */
    return viewExecutivePart(cards, st.d, go, main);
  }
  /* جزء من viewExecutive: const grid = (list) => `<div class="ex-grid">${lis… */
  function viewExecutivePart2(PER, R, allowed, card, lvl, main, qs, query, st, tab) {
    const grid = (list) => `<div class="ex-grid">${list.map(card).join('')}</div>`;
    const QUESTIONS = [
      ['هل الشركة وضعها المالي مستقر؟', 'financial'],
      ['هل الشركة تحقق أرباحاً فعلية أم مجرد إيرادات؟', 'financial'],
      ['أين تذهب أموال الشركة؟', 'financial'],
      ['هل التحصيلات والسيولة كافية للالتزامات القادمة؟', 'cash'],
      ['هل الإدارات والفروع تحقق المستهدفات؟', 'companies'],
      ['أين توجد المخاطر والانحرافات؟', 'governance'],
      ['ما القرارات التي تحتاج تدخل الإدارة العليا؟', 'alerts'],
    ];
    const openAlerts = st.d.alerts.filter((a) => a.status !== 'مغلق');
    const body = {
      overview:
        () => `${st.d.fxMissing ? `<div class="card fx-warn"><b>⚠ لا يوجد سعر صرف مسجل للعملة: ${esc(st.d.fxMissing.join('، '))}</b><div class="muted">رواتب فروع هذه العملة غير محسوبة في الإجماليات (عملة الشركة ${esc(st.d.currency || 'SAR')}). أضف السعر من الإعدادات ← الدول والفروع.</div></div>` : ''}${grid(st.d.overview.kpis)}
        <div class="ex-two"><div class="card ex-box"><h3>أسئلة الإدارة العليا</h3><ol class="ex-q">${QUESTIONS.map(([q, t]) => `<li><a href="${qs({ tab: t })}">${esc(q)}</a><span>${t === 'alerts' ? `${openAlerts.length} تنبيه مفتوح` : t === 'governance' ? `${st.d.governance.kpis[1].value} متأخر · ${st.d.governance.kpis[7].value} مستند منتهي` : ['financial', 'cash'].includes(t) && !st.d.demo ? 'بانتظار الإدارة المالية' : '← التفاصيل'}</span></li>`).join('')}</ol></div>
          <div class="card ex-box"><h3>أهم التنبيهات</h3>${
            openAlerts
              .slice(0, 5)
              .map(
                (a) =>
                  `<div class="ex-al sev-${a.severity === 'حرج' ? 'c' : a.severity === 'مرتفع' ? 'h' : 'm'}"><b>${esc(a.title)}</b><small>${esc(a.why)}</small><em>${esc(a.severity)}</em></div>`,
              )
              .join('') || '<div class="muted">لا توجد تنبيهات مفتوحة</div>'
          }<a class="btn sm" href="${qs({ tab: 'alerts' })}" style="margin-top:8px">كل التنبيهات</a></div></div>
        <h3 class="ex-h">المؤشرات الأساسية</h3>${grid(st.d.overview.core)}`,
      financial: () => `${grid(st.d.financial.kpis)}<h3 class="ex-h">النسب المالية</h3>${grid(st.d.financial.ratios)}
        <div class="ex-three">${exStmt('قائمة الدخل', st.d.financial.income, st.d.demo)}${exStmt('المركز المالي', st.d.financial.position, st.d.demo)}${exStmt('التدفقات النقدية', st.d.financial.flows, st.d.demo)}</div>
        <div class="card ex-box"><h3>التحليل المقارن</h3><table class="ex-t">${st.d.financial.compare.map(([l, v]) => `<tr><td>${esc(l)}</td><td>${v == null ? '<span class="muted">نربطه مع الإدارة المالية</span>' : `<b class="${v < 0 ? 'neg' : 'pos'}">${v > 0 ? '+' : ''}${v}%</b>`}</td></tr>`).join('')}</table></div>`,
      cash: () => `${grid(st.d.cash.kpis)}
        <div class="ex-two"><div class="card ex-box"><h3>هل تستطيع الشركة الوفاء بالتزاماتها؟</h3><table class="ex-t"><tr><th>الالتزامات المستحقة</th><th>القيمة</th><th>النقدية المتاحة</th><th>الموقف</th></tr>${st.d.cash.due.map((x) => `<tr><td>${esc(x.label)}</td><td>${exSar(x.value)}</td><td>${exSar(x.cash)}</td><td>${x.value == null ? '—' : x.cash >= x.value ? '<b class="pos">فائض</b>' : '<b class="neg">عجز</b>'}</td></tr>`).join('')}</table>${st.d.demo ? '<div class="ex-note">أرقام توضيحية</div>' : '<div class="ex-pend">نربطه مع الإدارة المالية</div>'}</div>
          <div class="card ex-box"><h3>التزامات معروفة من النظام (حي)</h3><table class="ex-t">${st.d.cash.obligations.map((k) => `<tr><td>${esc(k.label)}</td><td><b>${exSar(k.value)}</b></td></tr>`).join('')}</table>
          ${
            st.d.cash.banks.length
              ? `<h3 style="margin-top:12px">أرصدة البنوك</h3>${exBars(
                  st.d.cash.banks.map((b) => [b.name, b.value]),
                  exSar,
                )}`
              : ''
          }
          ${st.d.cash.forecast.length ? `<h3 style="margin-top:12px">توقع العجز / الفائض</h3><table class="ex-t">${st.d.cash.forecast.map((x) => `<tr><td>${esc(x.label)}</td><td><b class="${x.value < 0 ? 'neg' : 'pos'}">${exSar(x.value)}</b></td></tr>`).join('')}</table>` : ''}</div></div>`,
      arap: () => `<h3 class="ex-h">العملاء والتحصيلات</h3>${grid(st.d.receivables.kpis)}<h3 class="ex-h">الموردون والالتزامات</h3>${grid([...st.d.payables.kpis, ...st.d.payables.split])}
        <div class="ex-two"><div class="card ex-box"><h3>أعمار الديون Aging</h3><table class="ex-t"><tr><th>الفترة</th><th>العملاء</th><th>الموردون</th></tr>${st.d.receivables.aging.map((a) => `<tr><td>${esc(a.label)}</td><td>${exSar(a.recv)}</td><td>${exSar(a.pay)}</td></tr>`).join('')}</table>${st.d.demo ? '<div class="ex-note">أرقام توضيحية</div>' : '<div class="ex-pend">نربطه مع الإدارة المالية</div>'}</div>
          <div class="card ex-box"><h3>أعلى 10 عملاء من حيث المديونية</h3>${st.d.receivables.top.length ? `<table class="ex-t"><tr><th>العميل</th><th>المديونية</th><th>المتأخر</th></tr>${st.d.receivables.top.map((c) => `<tr><td>${esc(c.name)}</td><td>${exSar(c.value)}</td><td>${exSar(c.overdue)}</td></tr>`).join('')}</table>` : '<div class="muted">لا يوجد عملاء في CRM بعد</div>'}<div class="ex-note">العملاء من CRM (${st.d.receivables.customersCount})، والأرصدة من الإدارة المالية</div></div></div>`,
      companies: () => `${grid(st.d.operations.kpis)}
        <div class="card ex-box"><h3>الشركات — موحد / مستقل / مقارن</h3><table class="ex-t"><tr><th>الكيان</th><th>الموظفون</th><th>الرواتب الشهرية</th><th>الإيرادات</th><th>صافي الربح</th></tr>
          <tr class="tot"><td>المجموعة (موحد)</td><td>${fmtNum(st.d.hr.kpis[0].value)}</td><td>${exSar(st.d.hr.kpis[3].value)}</td><td>${exSar(st.d.overview.kpis[0].value)}</td><td>${exSar(st.d.overview.kpis[1].value)}</td></tr>
          <tr><td>${esc(st.d.company)}</td><td>${fmtNum(st.d.hr.kpis[0].value)}</td><td>${exSar(st.d.hr.kpis[3].value)}</td><td>${exSar(st.d.overview.kpis[0].value)}</td><td>${exSar(st.d.overview.kpis[1].value)}</td></tr></table>
          <div class="ex-note">نعدّ القوائم الموحدة بعد استبعاد المعاملات والأرصدة المتبادلة بين شركات المجموعة (حتى لا تتضخم الإيرادات أو الأصول أو الالتزامات) — نفعّلها عند ربط شركات المجموعة بالإدارة المالية.</div></div>
        <div class="card ex-box"><h3>مقارنة الفروع</h3><div class="tbl-wrap"><table class="ex-t"><tr><th>الفرع</th><th>الموظفون</th><th>الرواتب الشهرية</th><th>الطلبات</th><th>المبالغ المعتمدة</th><th>معلق</th><th>الإيرادات</th><th>الربحية</th><th>الانحراف عن الموازنة</th></tr>
          ${st.d.operations.branches.map((b) => `<tr><td><b>${esc(b.branch)}</b></td><td>${b.emps}</td><td>${exSar(b.payroll)}</td><td>${b.requests}</td><td>${exSar(b.approvedAmt)}</td><td>${b.pending || ''}</td><td>${exSar(b.revenue)}</td><td>${b.profit == null ? '—' : `<b class="${b.profit < 0 ? 'neg' : 'pos'}">${exSar(b.profit)}</b>`}</td><td>${b.budgetVar == null ? '—' : `<b class="${b.budgetVar < 0 ? 'neg' : 'pos'}">${b.budgetVar}%</b>`}</td></tr>`).join('')}</table></div>
          <h3 style="margin-top:12px">تكلفة الرواتب حسب الفرع</h3>${exBars(
            st.d.operations.branches.slice(0, 15).map((b) => [b.branch, Math.round(b.payroll), `${b.emps} موظف`]),
            exSar,
          )}</div>`,
      hr: () => `${grid(st.d.hr.kpis)}<div class="ex-two"><div class="card ex-box"><h3>الجنسيات</h3>${exBars(st.d.hr.nat)}</div>
        <div class="card ex-box"><h3>الالتزام بمواعيد الرواتب وحماية الأجور</h3>${grid([st.d.hr.wps])}<div class="ex-note">مكافأة نهاية الخدمة تقديرية على الأجر الشامل (نصف شهر عن كل سنة من الخمس الأولى وشهر عن كل سنة بعدها)، وتُضبط من الإدارة المالية.</div></div></div>`,
      governance: () =>
        `${grid(st.d.governance.kpis)}<div class="ex-note">المؤشرات «الحية» من دورات الاعتماد وسجل الموظفين، و«نربطها» من الإدارة المالية والمراجعة الداخلية عند بنائها.</div>`,
      budget: () =>
        `${grid(st.d.budget.kpis)}<div class="card ex-box"><h3>مؤشرات الأداء الاستراتيجية KPIs</h3><table class="ex-t"><tr><td>متوسط تقييم أداء الموظفين (إدارة الجودة)</td><td><b>${st.d.budget.kpiAvg == null ? '—' : `${st.d.budget.kpiAvg} / 100`}</b></td></tr><tr><td>نسبة السعودة</td><td><b>${esc(st.d.hr.kpis[1].sub || '—')}</b></td></tr><tr><td>معدل دوران الموظفين</td><td><b>${st.d.hr.kpis[8].value}%</b></td></tr><tr><td>طلبات متأخرة عن مدة الاعتماد</td><td><b>${st.d.governance.kpis[1].value}</b></td></tr></table></div>`,
      alerts:
        () => `<div class="card ex-box"><h3>مركز التنبيهات والقرارات</h3><p class="muted" style="margin-top:0">كل تنبيه يوضح: ماذا حدث؟ لماذا؟ حجم التأثير، المسؤول، والإجراء المطلوب — وتُحدَّث حالة المعالجة من هنا.</p>
        <div class="tbl-wrap"><table class="ex-t ex-alerts"><tr><th>الخطورة</th><th>ماذا حدث؟</th><th>لماذا؟</th><th>الكيان</th><th>الأثر المالي</th><th>منذ</th><th>المسؤول</th><th>الإجراء المطلوب</th><th>الحالة</th></tr>
          ${
            st.d.alerts
              .map(
                (
                  a,
                ) => `<tr data-al="${a.id}"><td><span class="ex-sev sev-${a.severity === 'حرج' ? 'c' : a.severity === 'مرتفع' ? 'h' : 'm'}">${esc(a.severity)}</span>${a.demo ? '<br><em class="ex-src demo">توضيحي</em>' : ''}</td><td><b>${a.link ? `<a href="${a.link}">${esc(a.title)}</a>` : esc(a.title)}</b></td><td>${esc(a.why)}</td><td>${esc(a.entity || '')}</td><td>${a.impact == null ? '—' : exSar(a.impact)}</td><td>${esc(SF.fmtDate(String(a.since || '').slice(0, 10)))}</td>
            <td><input class="in sm" data-alo value="${esc(a.owner || '')}" style="min-width:140px"></td><td>${esc(a.action)}</td><td><select class="in sm" data-als>${['جديد', 'قيد المعالجة', 'مغلق'].map((s) => `<option${s === a.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td></tr>`,
              )
              .join('') || '<tr><td colspan="9" class="muted">لا توجد تنبيهات</td></tr>'
          }</table></div></div>`,
    };
    renderViewExecutive(PER, R, allowed, body, lvl, main, openAlerts, qs, query, st, tab);
  }
  /* محتوى viewExecutive (HTML) */
  function renderViewExecutive(PER, R, allowed, body, lvl, main, openAlerts, qs, query, st, tab) {
    main.innerHTML = `<div class="ex-head"><div><div class="ex-brand">SADEN ERP — Executive Control Center</div><h2>مركز القيادة والرقابة التنفيذية</h2>
        <div class="muted">${esc(st.d.company)}${st.d.branch ? ` — فرع ${esc(st.d.branch)}` : ''} — من ${esc(SF.fmtDate(R.from))} إلى ${esc(SF.fmtDate(R.to))} (مقارنة بـ ${esc(SF.fmtDate(R.prevFrom))} – ${esc(SF.fmtDate(R.prevTo))})</div></div>
        <div class="ex-actions no-print"><a class="btn" href="${qs({ demo: st.d.demo ? '' : '1' })}">${st.d.demo ? '✖ إيقاف العرض التوضيحي' : '👁 عرض توضيحي'}</a><button class="btn" id="exPdf">🖨 PDF</button><button class="btn" id="exXls">⬇ Excel</button><a class="btn ghost" href="#/dashboard">مؤشرات التشغيل</a></div></div>
      ${st.d.demo ? '<div class="ex-demo">وضع العرض التوضيحي: المؤشرات المالية أرقام مثال لتوضيح الشكل فقط — لا تستخدمها في اتخاذ القرار حتى ربط الإدارة المالية.</div>' : ''}
      <div class="ex-filters no-print">
        <label>الشركة<select class="in" id="exCo">${st.d.companies.map((c) => `<option value="${c.id}"${(query.co || 'group') === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        <label>الفرع<select class="in" id="exBr"><option value="">كل الفروع</option>${st.d.branchesList.map((b) => `<option${b === st.d.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label>
        <label>الفترة<select class="in" id="exPer">${PER.map(([k, l]) => `<option value="${k}"${R.period === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="ex-cust"${R.period === 'custom' ? '' : ' hidden'}>من<input class="in" type="date" id="exFrom" value="${R.from}"></label><label class="ex-cust"${R.period === 'custom' ? '' : ' hidden'}>إلى<input class="in" type="date" id="exTo" value="${R.to}"></label>
        <label>مستوى العرض<select class="in" id="exLvl">${Object.entries(EX_LEVELS)
          .map(([k, [l]]) => `<option value="${k}"${k === lvl ? ' selected' : ''}>${esc(l)}</option>`)
          .join('')}</select></label>
      </div>
      <div id="exPay"></div>
      <div class="ex-tabs no-print">${EX_TABS.filter(([k]) => allowed.includes(k))
        .map(
          ([k, l, en, ic]) =>
            `<a href="${qs({ tab: k })}" class="${k === tab ? 'on' : ''}">${icon(ic)}<span>${esc(l)}<small>${esc(en)}</small></span>${k === 'alerts' && openAlerts.length ? `<em>${openAlerts.length}</em>` : ''}</a>`,
        )
        .join('')}</div>
      <div class="ex-body">${body[tab]()}</div>`;
  }
  /* أحداث viewExecutive: #exXls */
  function wireExXls(R, cards, st, tab) {
    $('#exXls').onclick = () => {
      const rows = [
        ['مركز القيادة التنفيذية', st.d.company, `${R.from} → ${R.to}`, st.d.demo ? 'يتضمن أرقاماً توضيحية' : ''],
        [],
        ['المؤشر', 'القيمة', 'الوحدة', 'المصدر', 'التغير %'],
      ];
      cards.forEach((k) =>
        rows.push([
          k.label,
          k.value == null ? '' : k.value,
          k.unit || '',
          k.source === 'finance' ? (k.demo ? 'توضيحي' : 'نربطه مع الإدارة المالية') : 'حي',
          k.change == null ? '' : k.change,
        ]),
      );
      if (tab === 'companies') {
        rows.push([], ['الفرع', 'الموظفون', 'الرواتب', 'الطلبات', 'المبالغ المعتمدة', 'معلق']);
        st.d.operations.branches.forEach((b) =>
          rows.push([b.branch, b.emps, Math.round(b.payroll), b.requests, Math.round(b.approvedAmt), b.pending]),
        );
      }
      if (tab === 'alerts') {
        rows.push([], ['الخطورة', 'التنبيه', 'السبب', 'الكيان', 'الأثر', 'المسؤول', 'الإجراء', 'الحالة']);
        st.d.alerts.forEach((a) => rows.push([a.severity, a.title, a.why, a.entity, a.impact || '', a.owner, a.action, a.status]));
      }
      downloadCsv(`مركز_القيادة_${tab}_${R.from}_${R.to}.csv`, rows);
    };
  }
  /* جزء من viewExecutive: const DR = {… */
  function viewExecutivePart(cards, d, go, main) {
    const DR = {
      hr: [['الفرع', 'الموظفون', 'سعوديون'], d.drill.hr],
      payroll: [['الفرع', 'الموظفون', 'تكلفة الرواتب الشهرية'], d.drill.payroll],
      approved: [['نوع الخطاب', 'المبلغ المعتمد'], d.drill.approved],
      pending: [['الرقم', 'النوع', 'الفرع', 'المرحلة الحالية', 'منذ (يوم)'], d.drill.pending],
      overdue: [['الرقم', 'النوع', 'الفرع', 'المرحلة الحالية', 'منذ (يوم)'], d.drill.overdue],
      custody: [['الموظف', 'الفرع', 'العهدة', 'تاريخ التعيين'], d.drill.custody],
      docs: [['الموظف', 'الفرع', 'المستند', 'تاريخ الانتهاء', 'متبقي (يوم)'], d.drill.docs],
    };
    wireExecutive2(DR, cards, go, main);
  }
  /* أحداث viewExecutive */
  function wireExecutive2(DR, cards, go, main) {
    $$('[data-exk]', main).forEach((el) => {
      el.onclick = () => {
        const k = cards[Number(el.dataset.exk)];
        if (k.go) {
          go({ tab: k.go });
          return;
        }
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        const dr = k.drill && DR[k.drill];
        bg.innerHTML = `<div class="modal" style="max-width:860px;width:96%"><h3 style="margin-top:0">${esc(k.label)}</h3>
        <div class="ex-kpi-v" style="margin-bottom:8px">${k.source === 'finance' && !k.demo ? '—' : esc(exNum(k.value, k.unit))}${k.unit === 'SAR' && !(k.source === 'finance' && !k.demo) ? ' ر.س' : ''}</div>
        <p class="muted">المصدر: ${k.source === 'finance' ? `الإدارة المالية (القيود والحسابات) — ${k.demo ? 'الرقم الظاهر توضيحي' : 'نربطه تلقائياً عند بناء الإدارة المالية'}` : 'بيانات النظام الحية (سجل الموظفين، دورات الاعتماد، الأسطول، الحفر)'}${k.prev != null ? ` — الفترة السابقة: ${esc(exNum(k.prev, k.unit))}` : ''}</p>
        ${dr ? `<div class="tbl-wrap" style="max-height:55vh;overflow:auto"><table class="tbl"><thead><tr>${dr[0].map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${dr[1].map((r) => `<tr>${r.map((c) => `<td>${typeof c === 'number' && c > 999 ? fmtNum(c) : esc(String(c))}</td>`).join('')}</tr>`).join('') || '<tr><td class="muted">لا يوجد</td></tr>'}</tbody></table></div>` : ''}
        <div class="row" style="margin-top:12px;gap:8px">${dr ? '<button class="btn" id="drX">⬇ Excel</button>' : ''}<button class="btn" data-x>إغلاق</button></div></div>`;
        document.body.appendChild(bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        if ($('#drX', bg)) $('#drX', bg).onclick = () => downloadCsv(`${k.label}.csv`, [dr[0], ...dr[1]]);
      };
    });
    /* حالة التنبيه والمسؤول */
    $$('[data-al]', main).forEach((tr) => {
      const save2 = async () => {
        try {
          await api('PUT', `/api/exec/alerts/${tr.dataset.al}`, { status: $('[data-als]', tr).value, owner: $('[data-alo]', tr).value });
          toast('تم تحديث التنبيه');
        } catch (err) {
          toast(err.message, true);
        }
      };
      $('[data-als]', tr).onchange = save2;
      $('[data-alo]', tr).onchange = save2;
    });
  }
  /* أحداث viewExecutive: #exPer، #exFrom، #exTo، #exBr، #exCo، #exLvl */
  function wireExecutive(go, main) {
    $('#exPer').onchange = () => {
      const v = $('#exPer').value;
      if (v === 'custom') {
        $$('.ex-cust', main).forEach((x) => {
          x.hidden = false;
        });
        return;
      }
      go({ period: v, from: '', to: '' });
    };
    $('#exFrom').onchange = $('#exTo').onchange = () => go({ period: 'custom', from: $('#exFrom').value, to: $('#exTo').value });
    $('#exBr').onchange = () => go({ branch: $('#exBr').value });
    $('#exCo').onchange = () => go({ co: $('#exCo').value });
    $('#exLvl').onchange = () => go({ level: $('#exLvl').value, tab: '' });
    $('#exPdf').onclick = () => print();
  }

  return { viewExecutive };
};
