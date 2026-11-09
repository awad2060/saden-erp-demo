/* العقود والقرارات والخدمة الذاتية والسلف والرواتب والتقارير */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc, fmtNum } = SF;
  const { $, $$, state, api, toast, icon, fieldHtml, prMonth } = S;
  Object.assign(S, { askText, switchCo, reportAutoClick });
  /* ---------- العقود: الحالة والتجديد وتنبيه المادة 55 ---------- */
  /* ---------- مركز القرارات: إصدار قرار (تعيين داخلي، تعديل الهيكل، ترقية، نقل، تكليف، قرار إداري، تعميم) لمن يحدده المُصدر ---------- */
  /* ---------- الإعدادات: الدول والفروع (قاعدة البيانات) ---------- */
  /* ---------- مركز القيادة والرقابة التنفيذية (لوحة الإدارة العليا) ----------
   * محاور: المشهد العام، الأداء المالي، السيولة، العملاء والموردون، الشركات والفروع، الموارد البشرية، الحوكمة والمخاطر، الموازنة، التنبيهات.
   * المؤشرات الحية من بيانات النظام، والمالية تُربط مع «الإدارة المالية» عند بنائها (أو أرقام توضيحية واضحة في وضع العرض التوضيحي). */
  const canExec = () => state.user && (state.user.role === 'admin' || SF.cap(state.user, 'execDash'));
  const EX_TABS = [
    ['overview', 'المشهد العام', 'Executive Overview', 'chart'],
    ['financial', 'الأداء المالي', 'Financial Performance', 'calc'],
    ['cash', 'السيولة والتدفقات', 'Cash & Liquidity', 'wallet'],
    ['arap', 'العملاء والموردون', 'Receivables & Payables', 'users'],
    ['companies', 'الشركات والفروع', 'Companies & Branches', 'branch'],
    ['hr', 'الموارد البشرية', 'HR & Payroll', 'idCard'],
    ['governance', 'الحوكمة والمخاطر', 'Governance & Risk', 'scale'],
    ['budget', 'الموازنة والاستراتيجية', 'Budget & Strategy', 'target'],
    ['alerts', 'التنبيهات والقرارات', 'Management Alerts', 'bell'],
  ];
  /* مستويات العرض: مجلس الإدارة (الاستراتيجية والمالية والمخاطر)، الرئيس التنفيذي (العام والتشغيلي والانحرافات)، المدير المالي (التفاصيل المالية والسيولة والموازنات) */
  const EX_LEVELS = {
    board: ['مجلس الإدارة والمالك', ['overview', 'financial', 'governance', 'budget', 'alerts']],
    ceo: ['الرئيس التنفيذي CEO', ['overview', 'financial', 'cash', 'arap', 'companies', 'hr', 'governance', 'budget', 'alerts']],
    cfo: ['المدير المالي CFO', ['overview', 'financial', 'cash', 'arap', 'companies', 'budget', 'governance', 'alerts']],
  };
  const exLevelDefault = () => {
    const t = `${state.user.title || ''} ${state.user.name || ''}`;
    return /مالي|CFO/i.test(t) ? 'cfo' : /مجلس|رئيس مجلس|مالك/.test(t) ? 'board' : 'ceo';
  };
  const exNum = (v, unit) => {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    if (unit === 'SAR') {
      const a = Math.abs(n);
      return `${n < 0 ? '-' : ''}${a >= 1e6 ? `${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K` : fmtNum(Math.round(a))}`;
    }
    if (unit === '%') return `${n}%`;
    if (unit === 'x') return `${n}x`;
    if (unit === 'يوم') return `${n} يوم`;
    return fmtNum(n);
  };
  const exSar = (v) => (v === null || v === undefined ? '—' : `${fmtNum(Math.round(Number(v)))} ر.س`);
  const exStmt = (
    title,
    rows,
    demo,
  ) => `<div class="card ex-box"><h3>${esc(title)}</h3>${rows.every((r) => r.value == null) ? '<div class="ex-pend">نربطه مع الإدارة المالية — تظهر هنا القائمة عند بناء الحسابات</div>' : ''}
    <table class="ex-t">${rows.map((r) => `<tr class="${r.cls}"><td>${esc(r.label)}</td><td>${r.value == null ? '—' : `<b class="${r.value < 0 ? 'neg' : ''}">${exSar(r.value)}</b>`}</td></tr>`).join('')}</table>${demo ? '<div class="ex-note">أرقام توضيحية</div>' : ''}</div>`;
  const exBars = (rows, fmt) => {
    const mx = Math.max(1, ...rows.map((r) => Math.abs(Number(r[1]) || 0)));
    return `<div class="ex-bars">${rows.map(([l, v, extra]) => `<div class="ex-bar"><span>${esc(l)}</span><i><b style="width:${Math.round((Math.abs(Number(v) || 0) / mx) * 100)}%"></b></i><em>${fmt ? fmt(v) : esc(String(v))}${extra ? ` <small>${esc(extra)}</small>` : ''}</em></div>`).join('')}</div>`;
  };

  /* ---------- الخدمة الذاتية: ملفي الوظيفي ---------- */
  /* نافذة نص إلزامي (سبب) — تُرجع النص أو null عند الإلغاء */
  function askText(title, label, required = true) {
    return new Promise((done) => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal" style="max-width:520px"><h3 style="margin-top:0">${esc(title)}</h3><div class="field"><label>${esc(label)}${required ? '<span class="req">*</span>' : ''}</label><textarea class="in" rows="3" id="atx"></textarea></div><div class="merr"></div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="atOk">تأكيد</button><button class="btn" data-x>إلغاء</button></div></div>`;
      document.body.appendChild(bg);
      $('#atx', bg).focus();
      $('[data-x]', bg).onclick = () => {
        bg.remove();
        done(null);
      };
      $('#atOk', bg).onclick = () => {
        const v = $('#atx', bg).value.trim();
        if (required && !v) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(label)} مطلوب</div>`;
          return;
        }
        bg.remove();
        done(v);
      };
    });
  }
  /* ---------- الموظفون المنتهية خدماتهم (حسب نوع انتهاء الخدمة) + محذوفات الموظفين لمدير النظام ---------- */
  /* ---------- حول الشركة: لكل العاملين ---------- */
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || !['KeyP', 'KeyS'].includes(e.code) || !document.querySelector('.ab-pdf')) return;
    e.preventDefault();
    toast('طباعة اللائحة الداخلية وتنزيلها غير متاحين', true);
  });
  /* ---------- البدلات المعتمدة وشهر صرفها في المسير ---------- */
  /* ---------- نظام السلف ---------- */
  /* تابات السلف */
  const ADV_TABS = (t) =>
    `<div class="gtabs" style="overflow-y:hidden">${[
      ['ledger', 'سجل الفروع', 'users'],
      ['summary', 'الإجمالي والتحليل', 'chart'],
      ['settled', 'المسددون', 'checkCircle'],
      ['requests', 'طلبات السلف', 'file'],
    ]
      .map(([k, l, ic]) => `<a class="gtab${k === t ? ' on' : ''}" href="#/advances?tab=${k}">${icon(ic)}${l}</a>`)
      .join('')}</div>`;
  /* حساب موظف في سجل السلف: الممنوح والمخصوم والمتبقي والحالة */
  const advCalc = (p) => {
    const adv = p.entries.filter((e) => e.k === 'adv'),
      ded = p.entries.filter((e) => e.k === 'ded');
    const A = adv.reduce((s, e) => s + e.amount, 0),
      G = ded.reduce((s, e) => s + e.amount, 0),
      rem = Math.round((A - G) * 100) / 100;
    const last =
      ded
        .map((e) => e.date)
        .filter(Boolean)
        .sort()
        .pop() || '';
    return {
      A: Math.round(A * 100) / 100,
      G: Math.round(G * 100) / 100,
      rem,
      last,
      n: adv.length,
      state: rem <= 0.5 ? 'مسددة' : G > 0 ? 'جاري السداد' : 'لم يبدأ السداد',
      housing: adv.filter((e) => e.type === 'دفعة بدل سكن').reduce((s, e) => s + e.amount, 0),
      personal: adv.filter((e) => e.type !== 'دفعة بدل سكن').reduce((s, e) => s + e.amount, 0),
    };
  };
  const ADV_ST = { مسددة: 'doc-ok', 'جاري السداد': 'doc-warn', 'لم يبدأ السداد': 'doc-bad' };
  /* ---------- خانة الشهر: كل input[type=month] في النظام يُعرض كقائمتين (الشهر بالاسم + السنة) ----------
   * الخانة الأصلية تبقى مخفية بقيمتها (YYYY-MM) واسمها، وتُطلق input/change عند التغيير فتعمل معالجات الصفحات كما هي */
  const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function enhanceMonth(inp) {
    if (inp.dataset.mpick) return;
    inp.dataset.mpick = '1';
    const [y0, m0] = String(inp.value || '').split('-');
    const cy = new Date().getFullYear(),
      yrs = [...new Set([...Array.from({ length: 8 }, (_, i) => String(cy - 5 + i)), ...(y0 ? [y0] : [])])].sort();
    const w = document.createElement('span');
    w.className = 'mpick';
    w.innerHTML = `<select class="in" data-mp="m" aria-label="الشهر">${inp.value ? '' : '<option value="">الشهر</option>'}${MONTHS_AR.map((n, i) => `<option value="${String(i + 1).padStart(2, '0')}"${m0 === String(i + 1).padStart(2, '0') ? ' selected' : ''}>${n}</option>`).join('')}</select>
      <select class="in" data-mp="y" aria-label="السنة">${inp.value ? '' : '<option value="">السنة</option>'}${yrs.map((y) => `<option${y === y0 ? ' selected' : ''}>${y}</option>`).join('')}</select>`;
    inp.type = 'hidden';
    inp.after(w);
    const sync = () => {
      const m = $('[data-mp=m]', w).value,
        y = $('[data-mp=y]', w).value;
      if (!m || !y) return;
      inp.value = `${y}-${m}`;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    };
    w.addEventListener('change', sync);
  }
  new MutationObserver(() => {
    document.querySelectorAll('input[type="month"]:not([data-mpick])').forEach(enhanceMonth);
  }).observe(document.body, { childList: true, subtree: true });
  /* ---------- بيانات رواتب الفروع: محاسب الفرع يعدّ البيان الشهري ← إدارة الرواتب وحماية الأجور تعتمد ---------- */
  const BP_ST = {
    draft: ['مسودة', 'doc-na'],
    submitted: ['بانتظار المراجعة', 'doc-warn'],
    reviewed: ['تمت المراجعة — بانتظار الاعتماد', 'doc-warn'],
    returned: ['معاد للتعديل', 'doc-bad'],
    approved: ['معتمد', 'doc-ok'],
  };
  /* ---------- نموذج «مطابقة رواتب الفرع مع مصروف رواتب شهر» ونموذج «مجمع رواتب شهر» (تلقائياً من بيانات رواتب الفروع) ---------- */
  const BP_SHORT = {
    'شركة سادن المتخصصة للاستشارات الجيولوجية': 'سادن الرئيسي',
    'شركة كانتل': 'كانتل',
    'شركة أرابور شخص واحد': 'أرابور',
    'ورشة سادن المتخصصة': 'ورشة سادن',
    'شركة سادن سبيشالايزد فور لابوراتوريز': 'سادن للمختبرات',
    'مؤسسة سادن المتوسطة للمقاولات العامة': 'سادن المتوسطة',
    'مؤسسة اركان البنا المطوره للمقاولات العامة': 'أركان البناء',
    'شركة المدى الدولي للتجارة': 'المدى الدولي',
    'شركة قصبة للهندسة المدنية': 'قصبة الهندسية',
  };
  const bpR2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
  const bpMonthData = (ym) => api('GET', `/api/branch-pay/month?m=${ym}`);
  /* ---------- اعتماد وتحويل مبالغ رواتب الشهر ---------- */
  const d0rev = () =>
    state.user.role === 'admin' ||
    SF.cap(state.user, 'payroll') ||
    SF.cap(state.user, 'approvePayroll') ||
    (state.config.bpFlow || []).includes(state.user.id);
  /* ---------- سجل سلف الفروع ---------- */
  const sameBrC = (a2, b2) =>
    String(a2 || '')
      .replace(/[ةه]$/, '')
      .replace(/^ال/, '')
      .trim() ===
    String(b2 || '')
      .replace(/[ةه]$/, '')
      .replace(/^ال/, '')
      .trim();
  /* ---------- العمل الإضافي اليومي (الموظف) ---------- */
  const OT_ST = {
    open: ['', 'مفتوح للتسجيل'],
    submitted: ['pending', 'بانتظار اعتماد مدير الفرع'],
    approved: ['approved', 'معتمد'],
    returned: ['late', 'معاد للتعديل'],
  };
  /* ---------- اعتماد العمل الإضافي (مدير الفرع) ---------- */
  /* ---------- الشئون القانونية: نافذة نموذج عام (حقول) ---------- */
  function formModal(title, fields, init, onSave) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:760px;width:96%"><h3 style="margin-top:0">${esc(title)}</h3><div class="grid2">${fields.map((f) => fieldHtml(f, init[f.key])).join('')}</div><div class="merr"></div>
      <div class="row" style="margin-top:12px"><button class="btn primary" id="fmOk">حفظ</button><button class="btn" data-x>إلغاء</button></div></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#fmOk', bg).onclick = async () => {
      const v = Object.fromEntries($$('[data-key]', bg).map((i) => [i.dataset.key, i.value]));
      try {
        await onSave(v);
        bg.remove();
      } catch (err) {
        $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    return bg;
  }
  const LC_CLS = {
    جديدة: 'pending',
    منظورة: 'pending',
    مؤجلة: 'late',
    'محجوزة للحكم': 'late',
    'صدر حكم ابتدائي': 'approved',
    استئناف: 'late',
    'صدر حكم نهائي': 'approved',
    تنفيذ: 'pending',
    'صلح / تسوية': 'approved',
    منتهية: '',
    مغلقة: '',
  };
  /* ---------- القضايا الخارجية ---------- */
  /* ---------- TO-DO: مهام شخصية لكل مستخدم ---------- */
  const TD_PRI = { عادي: '', مهم: 'warn', عاجل: 'bad' };
  const TD_REM = [
    ['', 'بدون تذكير'],
    ['0', 'في الموعد'],
    ['5', 'قبل 5 دقائق'],
    ['15', 'قبل 15 دقيقة'],
    ['30', 'قبل 30 دقيقة'],
    ['60', 'قبل ساعة'],
    ['120', 'قبل ساعتين'],
    ['1440', 'قبل يوم'],
  ];
  const tdRemSel = (v, attrs = '') =>
    `<select class="in" name="remind" ${attrs}>${TD_REM.map(([k, l]) => `<option value="${k}"${String(v || '') === k ? ' selected' : ''}>${k ? '🔔 ' : ''}${l}</option>`).join('')}</select>`;
  /* ---------- Calendar: شهر كامل بالأحداث والعطل وإجازات الموظفين ومهامي ---------- */
  const CAL_CLS = { 'إجازة / عطلة': 'off', اجتماع: 'meet', تدريب: 'train', مناسبة: 'occ', 'موعد نهائي': 'dead', أخرى: 'oth' };
  /* ---------- CONTACTS: دليل كل من على النظام ---------- */
  /* ---------- تقارير رواتب مدد الشهرية لكل كفالة: رفع ملف مدد ← مطابقة الموظفين ← حفظ ---------- */
  const MP_MONTH = (m) => {
    const [y, mo] = String(m || '').split('-');
    return mo
      ? `${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][Number(mo) - 1]} ${y}`
      : m;
  };
  const MP_HOW = {
    iqama: ['مربوط بالهوية', 'ok'],
    linked: ['مربوط', 'ok'],
    auto: ['مطابق تلقائياً', 'ok'],
    pick: ['اختر الموظف', 'warn'],
    none: ['غير موجود في السجل', 'bad'],
    manual: ['مختار يدوياً', 'ok'],
    skip: ['غير مسجل', 'na'],
  };
  /* ---------- وثائق ومستندات: اشتراكات مدد، السجلات التجارية، نسبة الالتزام في مدد ---------- */
  const DOC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  /* أسماء المستندات الافتراضية — تُعدَّل من الإعدادات العامة (docTypes) */
  const DOC_DEF = {
    company: [
      'شهادة الاستثمار',
      'شهادة المنشآت الصغيرة والمتوسطة',
      'هيئة المهندسين',
      'المحتوى المحلي',
      'تصنيف الشركة',
      'ضريبة القيمة المضافة',
      'الزكاة والدخل',
      'استيفاء المعايير الفنية',
      'شهادات ISO',
    ],
    branch: ['السجل التجاري', 'رخصة بلدي', 'ترخيص الدفاع المدني', 'اشتراك الغرفة التجارية', 'شهادة ساك'],
  };
  const docTypesCfg = () => {
    const t = state.config.docTypes || {};
    return {
      company: t.company && t.company.length ? t.company : DOC_DEF.company,
      branch: t.branch && t.branch.length ? t.branch : DOC_DEF.branch,
    };
  };
  /* ---------- العملاء (CRM): عميل لفرع، أو مشترك بين عدة فروع، أو لكل فروع الشركة ---------- */
  const CRM_ST = { 'عميل محتمل': 'pending', نشط: 'approved', متوقف: 'cancelled' };
  const crmBranches = (c) =>
    c.allBranches
      ? '<span class="chip crm-all">🌐 كل فروع الشركة</span>'
      : c.branches.map((b) => `<span class="chip crm-br">${esc(b)}</span>`).join('');
  /* ---------- التحقيقات الإدارية والأحكام ---------- */
  /* ---------- مؤشرات الأداء (إدارة الجودة) ---------- */
  const kpiGrade = (v) =>
    v >= 90
      ? ['ممتاز', 'approved']
      : v >= 80
        ? ['جيد جداً', 'approved']
        : v >= 70
          ? ['جيد', 'pending']
          : v >= 60
            ? ['مقبول', 'late']
            : ['ضعيف', 'rejected'];
  /* بطاقة مؤشرات الأداء في ملف الموظف */
  const kpiCard = (k) =>
    k && k.length
      ? `<div class="card"><div class="emp-sec-h"><h3>📊 مؤشرات الأداء الشهرية (KPIs)</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الشهر</th><th>المؤشرات</th><th>الإجمالي</th><th>ملاحظة</th></tr></thead><tbody>${k
          .map(
            (x) =>
              `<tr><td>${esc(prMonth(x.month))}</td><td style="font-size:12.5px">${Object.entries(x.vals)
                .map(([id, v]) => `${esc((x.names || {})[id] || id)}: <b>${v}</b>`)
                .join(
                  ' · ',
                )}</td><td class="num"><b>${x.total}</b> <span class="chip ${kpiGrade(x.total)[1]}">${kpiGrade(x.total)[0]}</span></td><td>${esc(x.note || '')}</td></tr>`,
          )
          .join('')}</tbody></table></div></div>`
      : '';
  /* ---------- مجموعة الشركات ---------- */
  const multiCo = () => !!(state.group && state.group.member && (state.group.companies || []).length > 1);
  const curCo = () => ((state.group && state.group.companies) || []).find((c) => c.id === state.group.current) || {};
  async function switchCo(id) {
    try {
      await api('POST', '/api/group/switch', { co: id });
    } catch (e) {
      toast(e.message, true);
      return;
    }
    try {
      sessionStorage.clear();
    } catch {
      /* تجاهل */
    }
    location.hash = '#/apps';
    location.reload();
  }
  /* خلفية دائرة الشركة بلون ركن الشعار (أسود لأرابور، رمادي للمدى، أبيض للباقي) */
  window.coBg = (img) => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      const g = c.getContext('2d');
      g.drawImage(img, 1, 1, 1, 1, 0, 0, 1, 1);
      const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
      img.parentNode.style.background = `rgb(${r},${gg},${b})`;
    } catch {
      /* تجاهل */
    }
  };
  /* ---------- التقارير: كل تقارير النظام في مكان واحد ----------
   * كل تقرير: صفحته + زر التصدير فيها. «تنزيل» يفتح الصفحة ويضغط زر التصدير تلقائياً؛ ويظهر التقرير فقط لمن يرى صفحته */
  const REPORTS = [
    [
      'الطلبات والاعتمادات',
      'file',
      [
        ['#/all', '#csvBtn', 'جميع الطلبات', 'كل الطلبات بحالاتها ومراحلها ومبالغها (حسب الفلاتر)', 'CSV'],
        ['#/mine', '#csvBtn', 'طلباتي', 'الطلبات التي رفعتها وحالة كل منها', 'CSV'],
        ['#/inbox', '#csvBtn', 'الطلبات الجارية', 'الطلبات بانتظار الاعتماد والإجراء', 'CSV'],
        ['#/dashboard', '#dCsv', 'لوحة المؤشرات', 'المبالغ المعتمدة شهرياً وحسب الفرع والنوع ومتوسط زمن الاعتماد', 'CSV'],
        ['#/report', '#rCsv', 'تقرير المؤشرات', 'تقرير أعمال الشركة ومؤشرات الإدارات للطباعة أو PDF', 'CSV / PDF'],
      ],
    ],
    [
      'الموارد البشرية',
      'users',
      [
        ['#/employees', '#emXls', 'سجل الموظفين', 'كل بيانات الموظفين (حسب الفلاتر والصلاحية)', 'Excel'],
        [
          '#/attendance',
          '#atXls',
          'الحضور والغياب والبصمة',
          'أيام العمل والحضور والإجازات والغياب والتأخير والإضافي لكل موظف من ملفات البصمة',
          'Excel',
        ],
        ['#/iqamas', '#iqXls', 'متابعة الإقامات', 'الإقامات المنتهية والقريبة من الانتهاء', 'Excel'],
        ['#/employees-ended', '#enXls', 'المنتهية خدماتهم', 'الموظفون المنتهية خدماتهم وتاريخ وسبب الانتهاء', 'Excel'],
        ['#/contracts', '#ctXls', 'العقود', 'عقود الموظفين وتواريخ بدايتها وانتهائها وتجديدها', 'Excel'],
        ['#/gosi', '#gsXls', 'التأمينات الاجتماعية', 'اشتراكات التأمينات للموظفين', 'Excel'],
        ['#/advances', '#avXls', 'السلف', 'السلف والأقساط والمتبقي', 'Excel'],
        ['#/payroll', '', 'مسيرات الرواتب', 'افتح المسير ثم «Excel المسير»', 'Excel'],
        [
          '#/mudad-pay',
          '',
          'تقارير رواتب مدد (لكل كفالة)',
          'رفع تقرير الرواتب الشهري من مدد وربطه بسجل الموظفين (الرقم الوظيفي والهوية والفرع)',
          'Excel',
        ],
        ['#/ot-approvals', '', 'العمل الإضافي', 'ساعات العمل الإضافي واعتمادها', ''],
      ],
    ],
    ['الجودة', 'award', [['#/kpi', '#kXls', 'مؤشرات الأداء (KPIs)', 'التقييم الشهري للموظفين', 'Excel']]],
    [
      'الشئون القانونية',
      'book',
      [
        ['#/legal-cases', '#lcXls', 'القضايا الخارجية', 'القضايا وحالاتها وجلساتها والمبالغ', 'Excel'],
        ['#/investigations', '#ivXls', 'التحقيقات والأحكام', 'التحقيقات الإدارية والجزاءات', 'Excel'],
      ],
    ],
    [
      'إدارة العمليات',
      'layers',
      [
        ['#/fleet', '#vCsv', 'أسطول السيارات', 'المركبات ووثائقها وتواريخ انتهائها', 'Excel'],
        ['#/violations', '#vlXls', 'المخالفات المرورية', 'المخالفات والمبالغ والسائقين', 'Excel'],
        ['#/drilling', '#rgXls', 'أسطول الحفارات', 'سجل الحفارات وحالتها', 'Excel'],
        ['#/drilling-projects', '#dpXls', 'مشروعات الحفر', 'المشاريع والعملاء والعقود', 'Excel'],
        ['#/inventory', '', 'جرد الفروع', 'اختر الفرع ثم «Excel» أو «طباعة A4» لجرد الأصول والمعدات', 'Excel / A4'],
        ['#/devices', '#dvXls', 'الأجهزة النوعية', 'الأجهزة وإعاراتها للفروع', 'Excel'],
        ['#/workshop', '', 'المخزون والتصنيع والخردة', 'أرصدة المخزن والحركات', ''],
      ],
    ],
    [
      'وثائق ومستندات',
      'folderOpen',
      [
        ['#/docs?tab=mudad', '#dcXls', 'اشتراكات مدد', 'المنشآت وتواريخ بداية ونهاية الاشتراك والمبالغ وبنك الرواتب', 'Excel'],
        ['#/docs?tab=crs', '#dcXls', 'السجلات التجارية', 'تواريخ انتهاء السجلات التجارية لكل الفروع والشركات وحالتها', 'Excel'],
        ['#/docs?tab=compliance', '#dcXls', 'نسبة الالتزام في مدد', 'نسبة الالتزام الشهرية لكل منشأة ومتوسط السنة', 'Excel'],
      ],
    ],
    ['النظام', 'settings', [['@logins', '', 'عداد الدخول على النظام', 'عدد مرات الدخول لكل يوم ولكل مستخدم', '']]],
  ];
  /* بعد فتح صفحة التقرير: ينتظر زر التصدير ثم يضغطه */
  function reportAutoClick() {
    let sel = '';
    try {
      sel = sessionStorage.getItem('report:click') || '';
      sessionStorage.removeItem('report:click');
    } catch {
      /* تجاهل */
    }
    if (!sel) return;
    let n = 0;
    const t = setInterval(() => {
      const b = document.querySelector(sel);
      if (b || ++n > 40) {
        clearInterval(t);
        if (b) {
          b.scrollIntoView({ block: 'center' });
          b.click();
          toast('تم تجهيز التقرير');
        } else toast('افتح التقرير من صفحته', true);
      }
    }, 250);
  }
  Object.assign(S, {
    canExec,
    EX_TABS,
    EX_LEVELS,
    exLevelDefault,
    exNum,
    exSar,
    exStmt,
    exBars,
    ADV_TABS,
    advCalc,
    ADV_ST,
    BP_ST,
    BP_SHORT,
    bpR2,
    bpMonthData,
    d0rev,
    sameBrC,
    OT_ST,
    LC_CLS,
    TD_PRI,
    TD_REM,
    tdRemSel,
    CAL_CLS,
    MP_MONTH,
    MP_HOW,
    DOC_MONTHS,
    DOC_DEF,
    docTypesCfg,
    CRM_ST,
    crmBranches,
    kpiGrade,
    kpiCard,
    multiCo,
    curCo,
    REPORTS,
  });
})((window.SES_APP = window.SES_APP || {}));
