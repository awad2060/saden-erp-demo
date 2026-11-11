/* لوحة الإعدادات: الدوام، السياسات، المحذوفات، التوقيع، التفويض */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, $$, state, dt, today, api, toast, icon, readFile, geofencesModal } = S;
  Object.assign(S, { settingsTrash, signatureBox });

  /* ---------- النماذج والأدوات القديمة ---------- */

  /* ---------- لوحة الإعدادات ---------- */
  const TABS = [
    ['general', 'إعدادات عامة'],
    ['orgdiv', 'التقسيم الإداري'],
    ['users', 'المستخدمون'],
    ['roles', 'المسميات والصلاحيات'],
    ['hr', 'الموارد البشرية'],
    ['routes', 'مسارات الاعتماد'],
    ['forms', 'النماذج والفروع'],
    ['tools', 'الأدوات والبرامج'],
    ['countries', 'الدول والفروع'],
    ['calendar', 'العطلات'],
    ['email', 'البريد والإشعارات'],
    ['backup', 'النسخ الاحتياطي'],
    ['activity', 'سجل النشاط'],
    ['oversight', 'رقابة المراسلات'],
  ];
  /* أيقونات تبويبات الإعدادات في القائمة الجانبية */
  const TAB_ICONS = {
    general: 'settings',
    orgdiv: 'buildings',
    users: 'users',
    roles: 'key',
    hr: 'idCard',
    routes: 'forward',
    forms: 'fileText',
    tools: 'wrench',
    countries: 'mapPin',
    calendar: 'calendar',
    email: 'mail',
    backup: 'save',
    activity: 'list',
    oversight: 'eye',
    trash: 'trash',
  };
  /* ---------- التقسيم الإداري: إدارات، وداخلها فروع وأقسام (هي وحدات الهيكل التنظيمي، ومنها يُرسم الهيكل الهرمي) ---------- */

  /* ألوان تفريعات الإدارات في قائمة المستخدمين */
  const SUB_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#dc2626', '#4f46e5', '#65a30d'];

  /* ---------- الأدوات والبرامج ---------- */

  /* ---------- العطلات ---------- */
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  /* ---------- سياسات الموارد البشرية: إصدارات بتاريخ سريان (رصيد الإجازة، أنواع الإجازات، التجربة، ساعات العمل) ---------- */
  /* إعدادات الموارد البشرية: كل مجموعة أيقونة مستقلة تفتح صفحتها (#/settings/hr/<k>).
   * لإضافة إعداد جديد مستقبلاً: بند جديد هنا — إما blocks من أجزاء السياسة، أو open لنافذة/صفحة خاصة */
  const HR_SETTINGS = [
    {
      k: 'leave',
      ic: 'bookOpen',
      color: '#0e9f9a',
      t: 'الإجازات',
      d: 'الرصيد السنوي، فترة التجربة، مكافأة نهاية الخدمة، وأنواع الإجازات وحدودها — لكل دولة (السعودية / مصر / عُمان)',
      blocks: ['annual', 'types'],
    },
    {
      k: 'attendance',
      ic: 'clock',
      color: '#2563eb',
      t: 'الحضور والانصراف',
      d: 'ساعات العمل اليومية والأسبوعية ورمضان، بداية الدوام، سماح التأخير، ونسبة الإضافي',
      blocks: ['hours', 'shift'],
    },
    {
      k: 'shifts',
      ic: 'calendar',
      color: '#ea580c',
      t: 'أنواع الدوام',
      d: 'أيام العمل والإجازة الأسبوعية ووقت الشيفت لكل فئة (مثل دوام السعوديين ودوام المقيمين) ومن يطبق عليه',
      page: (body, s, save) => settingsShifts(body, s, save),
    },
    {
      k: 'geo',
      ic: 'mapPin',
      color: '#dc2626',
      t: 'مواقع البصمة',
      d: 'موقع كل فرع على الخريطة ونطاق قبول البصمة من الجوال',
      open: () => geofencesModal(),
    },
    {
      k: 'gosi',
      ic: 'checkCircle',
      color: '#7c3aed',
      t: 'التأمينات الاجتماعية',
      d: 'نسب الاشتراك للمواطن وغير المواطن والحد الأدنى والأعلى للأجر الخاضع — لكل دولة',
      blocks: ['gosi'],
    },
  ];
  /* أنواع الدوام: أيام العمل والشيفت ومن يطبق عليه (الأولوية: موظف محدد ← فرع ← جنسية ← الكل) */
  const WS_DAYS = [
    [6, 'السبت'],
    [0, 'الأحد'],
    [1, 'الإثنين'],
    [2, 'الثلاثاء'],
    [3, 'الأربعاء'],
    [4, 'الخميس'],
    [5, 'الجمعة'],
  ];
  const WS_KINDS = ['دوام كلي', 'دوام جزئي', 'دوام مرن', 'عمل عن بُعد', 'نظام ورديات'];
  const WS_APPLY = [
    ['all', 'كل الموظفين'],
    ['saudi', 'السعوديون'],
    ['nonSaudi', 'غير السعوديين (المقيمون)'],
    ['branches', 'فروع محددة'],
    ['employees', 'موظفون محددون'],
  ];
  /* لون مختلف لكل كارت دوام */
  const WS_COLORS = ['#ea580c', '#2563eb', '#059669', '#7c3aed', '#db2777', '#0891b2', '#ca8a04', '#dc2626'];
  const wsDayNames = (x) => WS_DAYS.filter(([d]) => x.days.includes(d)).map(([, l]) => l);
  const wsOff = (x) =>
    WS_DAYS.filter(([d]) => !x.days.includes(d))
      .map(([, l]) => l)
      .join('، ') || 'لا يوجد';
  const wsApplyText = (x) =>
    x.applyTo === 'branches'
      ? `فروع: ${x.branches.join('، ') || '—'}`
      : x.applyTo === 'employees'
        ? `${x.employees.length} موظف محدد`
        : (WS_APPLY.find(([k]) => k === x.applyTo) || [])[1] || 'كل الموظفين';
  /* نموذج الصفحة W: القائمة (تُستبدل بعد الحفظ)، والأنواع المفتوحة للتعديل، وعدد موظفي كل نوع */
  function settingsShifts(body, s, saveSettings) {
    const pol = SF.hrPolicyOf(today());
    const list = (s.workSchedules || []).map((x) => ({
      ...x,
      days: [...(x.days || [])],
      branches: [...(x.branches || [])],
      employees: [...(x.employees || [])],
    }));
    const branches = [...new Set([...(state.config.branches || []), ...list.flatMap((x) => x.branches)])].filter(Boolean).sort();
    /* الأنواع المحفوظة تُعرض كروتاً، ونموذج التعديل يُفتح للنوع الجديد أو عند «تعديل» */
    const W = { body, s, saveSettings, pol, list, branches, editing: new Set(), counts: null };
    W.loadCounts = async () => {
      try {
        W.counts = await api('GET', '/api/admin/work-schedules/counts');
      } catch {
        W.counts = null;
      }
    };
    W.draw = () => wsDraw(W);
    W.draw();
    W.loadCounts().then(W.draw);
  }
  /* كارت نوع دوام محفوظ */
  function wsCard(W, x, i) {
    const { counts, pol } = W;
    const n = counts && x.id ? counts.counts[x.id] || 0 : null;
    return `<div class="card ws-view" style="--wc:${WS_COLORS[i % WS_COLORS.length]}"><div class="ws-v-head"><span class="b-ic" style="--m:var(--wc)">${icon('calendar')}</span><div style="flex:1;min-width:0"><b class="ws-v-name">${esc(x.name)} <span class="ws-kind">${esc(x.kind || 'دوام كلي')}</span></b><small class="muted">${esc(wsApplyText(x))}</small></div>
          <div class="ws-v-count" title="عدد الموظفين النشطين على هذا الدوام"><b>${n === null ? '…' : n}</b><small>موظف</small></div></div>
        <div class="ws-v-row"><span class="ws-v-l">أيام العمل</span><span class="ws-days">${wsDayNames(x)
          .map((l) => `<span class="ws-day on">${l}</span>`)
          .join('')}</span></div>
        <div class="ws-v-row"><span class="ws-v-l">الإجازة الأسبوعية</span><span>${wsOff(x)}</span></div>
        <div class="ws-v-row"><span class="ws-v-l">نوع الدوام</span><span><b>${x.mode === 'flex' ? '⏳ مرن' : '🕗 مكتبي'}</b></span><span class="ws-v-l" style="min-width:0;margin-inline-start:14px">نوع البصمة</span><span><b>${(x.punch || x.mode) === 'flex' ? '🌍 مرنة — من أي مكان' : '🏢 مكتبية — داخل الموقع'}</b></span></div>
        ${x.mode === 'flex' ? `<div class="ws-v-row"><span class="ws-v-l">الدوام</span><span>${esc(x.reqHours || 8)} ساعات بين <b>${esc(x.flexFrom || '04:00')}</b> و<b>${esc(x.flexTo || '23:59')}</b></span><span class="muted">بلا تأخير · يخصم النظام النقص</span></div>` : `<div class="ws-v-row"><span class="ws-v-l">الشيفت</span><span>من <b>${esc(x.start)}</b> إلى <b>${esc(x.end)}</b></span><span class="muted">${SF.scheduleHours(x)} ساعة · سماح ${x.grace === '' || x.grace == null ? `${esc(pol.graceMin ?? 15)} (العام)` : esc(x.grace)} دقيقة</span></div>`}
        ${x.note ? `<div class="ws-v-row"><span class="ws-v-l">ملاحظة</span><span>${esc(x.note)}</span></div>` : ''}
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" data-wedit="${i}">✏️ تعديل</button><button class="btn sm bad" data-wdel="${i}">حذف</button></div></div>`;
  }
  /* نموذج تعديل نوع دوام */
  function wsEditor(W, x, i) {
    return `<div class="card ws-card"><div class="emp-sec-h"><h3 style="flex:1"><input class="in" data-w="${i}" data-k="name" value="${esc(x.name || '')}" placeholder="اسم نوع الدوام، مثل: دوام المقيمين"></h3><select class="in" data-w="${i}" data-k="kind" style="max-width:170px" title="طبيعة الدوام">${WS_KINDS.map((k) => `<option${(x.kind || 'دوام كلي') === k ? ' selected' : ''}>${k}</option>`).join('')}</select><button class="btn sm bad" data-wdel="${i}">حذف</button></div>
          <div class="grid2 ws-types"><div class="field"><label>نوع الدوام (التوقيت)</label><select class="in" data-w="${i}" data-k="mode"><option value="office"${x.mode !== 'flex' ? ' selected' : ''}>🕗 مكتبي — وقت ثابت وتأخير</option><option value="flex"${x.mode === 'flex' ? ' selected' : ''}>⏳ مرن — فترة وساعات مطلوبة</option></select></div>
            <div class="field"><label>نوع البصمة (المكان)</label><select class="in" data-w="${i}" data-k="punch"><option value="office"${(x.punch || x.mode) !== 'flex' ? ' selected' : ''}>🏢 مكتبية — داخل نطاق الموقع</option><option value="flex"${(x.punch || x.mode) === 'flex' ? ' selected' : ''}>🌍 مرنة — من أي مكان (يسجّل التطبيق المكان)</option></select></div></div>
          <div class="field"><label>أيام العمل</label><div class="ws-days">${WS_DAYS.map(([d, l]) => `<label class="ws-day${x.days.includes(d) ? ' on' : ''}"><input type="checkbox" data-w="${i}" data-day="${d}"${x.days.includes(d) ? ' checked' : ''}>${l}</label>`).join('')}</div>
            <div class="hint">الإجازة الأسبوعية: ${wsOff(x)}</div></div>
          ${wsTimeFields(W, x, i)}
          <div class="field"><label>يطبق على</label><select class="in" data-w="${i}" data-k="applyTo" style="max-width:320px">${WS_APPLY.map(([k, l]) => `<option value="${k}"${x.applyTo === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
          ${x.applyTo === 'branches' ? `<div class="field"><label>الفروع</label><div class="ws-days">${W.branches.map((b) => `<label class="ws-day${x.branches.includes(b) ? ' on' : ''}"><input type="checkbox" data-w="${i}" data-br="${esc(b)}"${x.branches.includes(b) ? ' checked' : ''}>${esc(b)}</label>`).join('') || '<span class="muted">لا توجد فروع في الإعدادات</span>'}</div></div>` : ''}
          ${x.applyTo === 'employees' ? `<div class="field"><label>الموظفون (الرقم الوظيفي أو رقم الهوية / الإقامة)</label><textarea class="in" rows="2" data-w="${i}" data-k="employees" placeholder="افصل بينها بفاصلة أو سطر جديد">${esc(x.employees.join('، '))}</textarea><div class="hint">${x.employees.length} موظف</div></div>` : ''}
          <div class="field"><label>ملاحظة</label><input class="in" data-w="${i}" data-k="note" value="${esc(x.note || '')}"></div></div>`;
  }
  /* الوقت: المرن (فترة البصمة والساعات المطلوبة) أو المكتبي (الشيفت والسماح) */
  function wsTimeFields(W, x, i) {
    return x.mode === 'flex'
      ? `<div class="grid2" style="grid-template-columns:repeat(4,1fr)">
            <div class="field"><label>البصمة متاحة من</label><input class="in" type="time" data-w="${i}" data-k="flexFrom" value="${esc(x.flexFrom || '04:00')}"></div>
            <div class="field"><label>حتى</label><input class="in" type="time" data-w="${i}" data-k="flexTo" value="${esc(x.flexTo || '23:59')}"></div>
            <div class="field"><label>الساعات المطلوبة يومياً</label><input class="in" type="number" min="1" max="16" step="0.5" data-w="${i}" data-k="reqHours" value="${esc(x.reqHours || 8)}"></div></div>
            <div class="hint" style="margin:-6px 0 10px">الدوام المرن: البصمة خلال هذه الفترة فقط. أول بصمة = دخول، ويلزم بين الدخول والخروج الساعات المطلوبة، ويخصم النظام النقص من الراتب بأجر الساعة. لا يحسب تأخيراً.</div>`
      : `<div class="grid2" style="grid-template-columns:repeat(4,1fr)">
            <div class="field"><label>بداية الشيفت</label><input class="in" type="time" data-w="${i}" data-k="start" value="${esc(x.start || '08:00')}"></div>
            <div class="field"><label>نهاية الشيفت</label><input class="in" type="time" data-w="${i}" data-k="end" value="${esc(x.end || '16:00')}"></div>
            <div class="field"><label>ساعات الشيفت</label><div class="ws-hours">${SF.scheduleHours(x)} ساعة</div></div>
            <div class="field"><label>سماح التأخير (دقيقة)</label><input class="in" type="number" min="0" data-w="${i}" data-k="grace" value="${esc(x.grace ?? '')}" placeholder="العام: ${esc(W.pol.graceMin ?? 15)}"></div></div>
`;
  }
  /* رسم الصفحة: الشرح، والكروت، ونماذج التعديل، وزر الحفظ — ثم ربط الأحداث */
  function wsDraw(W) {
    const { body, s, pol, list, editing, counts } = W;
    body.innerHTML = `<div class="card"><div class="emp-sec-h"><h3><a href="#/settings/hr" class="hr-back">الموارد البشرية</a> › أنواع الدوام</h3><button class="btn" id="wsNew">➕ نوع دوام</button></div>
        <p class="muted" style="margin-top:0">لكل نوع: أيام العمل (وما عداها إجازة أسبوعية)، ووقت الشيفت، ومن يطبق عليه. يحسب النظام الحضور والغياب والتأخير والإضافي وبصمة التطبيق لكل موظف حسب نوع دوامه.
          الأولوية عند تطابق أكثر من نوع: <b>الموظف المحدد</b> ثم <b>فرعه</b> ثم <b>جنسيته</b> ثم <b>كل الموظفين</b>. ومن لا ينطبق عليه أي نوع يبقى على الدوام العام (بداية ${esc(pol.shiftStart || '08:00')} وإجازة نهاية الأسبوع في العطلات).</p></div>
        ${list.length ? '' : '<div class="card"><div class="empty">لا توجد أنواع دوام بعد — أضف نوعاً مثل «دوام السعوديين» و«دوام المقيمين».</div></div>'}
        ${counts && list.some((x) => x.id) ? `<div class="hint" style="margin:-4px 0 10px">على الدوام العام (لا ينطبق عليهم أي نوع): <b>${counts.general}</b> موظف من ${counts.total} موظف نشط</div>` : ''}
        <div class="ws-grid">${list.map((x, i) => (editing.has(i) ? '' : wsCard(W, x, i))).join('')}</div>
        ${list.map((x, i) => (!editing.has(i) ? '' : wsEditor(W, x, i))).join('')}
        <div class="ferr"></div>${editing.size || list.length !== (s.workSchedules || []).length ? '<div class="row save-bar"><button class="btn primary" id="wsSave">💾 حفظ أنواع الدوام</button></div>' : ''}`;
    body.onchange = (e) => wsChange(W, e);
    body.oninput = (e) => {
      const t = e.target,
        i = Number(t.dataset.w);
      if (!Number.isNaN(i) && W.list[i] && ['name', 'note'].includes(t.dataset.k)) W.list[i][t.dataset.k] = t.value;
    };
    wsWire(W);
  }
  /* تغيير حقل: الأيام والفروع والموظفون يعيدون الرسم، وباقي الحقول تُحفظ (ويُعاد الرسم لما يغيّر الشكل) */
  function wsChange(W, e) {
    const t = e.target,
      i = Number(t.dataset.w);
    if (Number.isNaN(i) || !W.list[i]) return;
    const x = W.list[i];
    if (t.dataset.day !== undefined) {
      const d = Number(t.dataset.day);
      x.days = t.checked ? [...new Set([...x.days, d])] : x.days.filter((y) => y !== d);
      return W.draw();
    }
    if (t.dataset.br !== undefined) {
      const b = t.dataset.br;
      x.branches = t.checked ? [...new Set([...x.branches, b])] : x.branches.filter((y) => y !== b);
      return W.draw();
    }
    if (t.dataset.k === 'employees') {
      x.employees = t.value
        .split(/[\s,،;]+/)
        .map((v) => v.trim())
        .filter(Boolean);
      return W.draw();
    }
    if (t.dataset.k) {
      x[t.dataset.k] =
        t.dataset.k === 'grace' ? (t.value === '' ? '' : Number(t.value)) : t.dataset.k === 'reqHours' ? Number(t.value) || 8 : t.value;
      if (['applyTo', 'start', 'end', 'mode', 'punch'].includes(t.dataset.k)) W.draw();
    }
  }
  /* الأزرار: نوع جديد، تعديل، حذف (يعيد ترقيم ما بعده في قائمة التعديل)، حفظ */
  function wsWire(W) {
    const { body, editing } = W;
    $('#wsNew').onclick = () => {
      W.list.push({
        name: '',
        kind: 'دوام كلي',
        mode: 'office',
        punch: 'office',
        flexFrom: '04:00',
        flexTo: '23:59',
        reqHours: 8,
        days: [0, 1, 2, 3, 4],
        start: W.pol.shiftStart || '08:00',
        end: '16:00',
        grace: '',
        applyTo: 'all',
        branches: [],
        employees: [],
        note: '',
      });
      editing.add(W.list.length - 1);
      W.draw();
    };
    $$('[data-wedit]', body).forEach((b) => {
      b.onclick = () => {
        editing.add(Number(b.dataset.wedit));
        W.draw();
      };
    });
    $$('[data-wdel]', body).forEach((b) => {
      b.onclick = () => {
        if (!confirm('حذف نوع الدوام؟')) return;
        const k = Number(b.dataset.wdel);
        W.list.splice(k, 1);
        const ed2 = [...editing].filter((j) => j !== k).map((j) => (j > k ? j - 1 : j));
        editing.clear();
        ed2.forEach((j) => editing.add(j));
        W.draw();
      };
    });
    if ($('#wsSave')) $('#wsSave').onclick = () => wsSave(W);
  }
  async function wsSave(W) {
    const { s, editing, body } = W;
    try {
      const sv = await W.saveSettings({ workSchedules: W.list }, 'تم حفظ أنواع الدوام');
      s.workSchedules = sv.workSchedules || [];
      SF.setWorkSchedules(s.workSchedules);
      state.config.workSchedules = s.workSchedules;
      W.list = s.workSchedules.map((x) => ({ ...x, days: [...x.days], branches: [...x.branches], employees: [...x.employees] }));
      editing.clear();
      await W.loadCounts();
      W.draw();
    } catch (err) {
      $('.ferr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
    }
  }

  /* ---------- البريد والإشعارات ---------- */

  /* ---------- النسخ الاحتياطي ---------- */

  /* ---------- سلة المحذوفات: الاسترجاع خلال 30 يوماً، وبعدها حذف نهائي تلقائي ---------- */
  async function settingsTrash(body) {
    const KINDS = {
      request: '📄 طلب',
      attachment: '📎 مرفق',
      user: '👤 مستخدم',
      tool: '🧮 أداة',
      vehicle: '🚚 مركبة',
      violation: '⚠ مخالفة',
      ops: '⚙️ إدارة العمليات',
    };
    const list = await api('GET', '/api/admin/trash');
    const left = (x) => Math.max(0, Math.ceil((new Date(x.purgeAt) - Date.now()) / 86400000));
    body.innerHTML = `<div class="card"><h3>سلة المحذوفات</h3>
      <p class="muted" style="margin-top:0">كل ما تحذفه (الطلبات ومرفقاتها، المرفقات، المستخدمون، الأدوات المرفوعة) يبقى هنا 30 يوماً وتستطيع استرجاعه كما كان، ثم يحذفه النظام نهائياً تلقائياً.</p>
      <div class="filters"><select class="in" id="tk"><option value="">كل الأنواع</option>${Object.entries(KINDS)
        .map(([k, l]) => `<option value="${k}">${l}</option>`)
        .join('')}</select><input class="in" id="tq" placeholder="بحث..."></div>
      <div id="tlist"></div></div>`;
    const draw = () => {
      const k = $('#tk').value,
        q = $('#tq').value.trim();
      const rows = list.filter((x) => (!k || x.kind === k) && (!q || `${x.title} ${x.byName}`.includes(q)));
      $('#tlist').innerHTML =
        `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>النوع</th><th>العنصر</th><th>حذفه</th><th>وقت الحذف</th><th>الحذف النهائي بعد</th><th></th></tr></thead><tbody>
        ${
          rows
            .map(
              (
                x,
              ) => `<tr><td>${KINDS[x.kind] || x.kind}</td><td><b>${esc(x.title)}</b></td><td>${esc(x.byName || '—')}</td><td class="num muted">${esc(dt(x.at))}</td>
          <td class="num" style="${left(x) <= 3 ? 'color:var(--bad);font-weight:700' : ''}">${left(x)} يوم</td>
          <td><button class="btn ok" data-restore="${x.id}">↺ استرجاع</button></td></tr>`,
            )
            .join('') || '<tr><td colspan="6" class="muted">السلة فارغة</td></tr>'
        }</tbody></table></div>`;
      $$('[data-restore]', body).forEach((b) => {
        b.onclick = async () => {
          const x = list.find((y) => y.id === b.dataset.restore);
          if (!confirm(`استرجاع "${x.title}"؟`)) return;
          try {
            await api('POST', `/api/admin/trash/${x.id}/restore`, {});
            toast('تم الاسترجاع');
            list.splice(list.indexOf(x), 1);
            draw();
          } catch (err) {
            toast(err.message, true);
          }
        };
      });
    };
    $('#tk').onchange = draw;
    $('#tq').oninput = draw;
    draw();
  }

  /* ---------- رقابة المراسلات: مدير النظام يطّلع على كل البريد وكل الدردشات (قراءة فقط، وكل فتح يُسجَّل في سجل النشاط) ---------- */

  /* ---------- سجل النشاط ---------- */

  /* ---------- المسميات والصلاحيات ---------- */

  /* ---------- منشئ النماذج (بدون كود) ----------
   * يعمل على النماذج الجديدة، وعلى النماذج الأصلية: البسيطة تُعدَّل بالكامل، والمركبة يُعدَّل عنوانها وتوقيعاتها.
   * كل شيء قابل للتحرير: الحقول وخصائصها، وأقسام نص الخطاب بالترتيب، والتحية والختام، والمرفقات المطلوبة، ومسار الاعتماد */

  /* ---------- التوقيع الإلكتروني ---------- */
  function signatureBox(box, u, url, onSaved) {
    const draw = () => {
      box.innerHTML = `<h3>التوقيع الإلكتروني</h3>
        <div class="sig-preview">${u.signature ? `<img src="/api/signatures/${encodeURIComponent(u.signature)}" alt="التوقيع">` : '<span class="muted">لا يوجد توقيع مرفوع</span>'}</div>
        <div class="field" style="margin-bottom:10px"><input class="in" type="file" accept=".png,.jpg,.jpeg" data-sigfile>
        <div class="hint">صورة PNG (يفضل بخلفية شفافة) أو JPG بخلفية بيضاء — حتى 500 كيلوبايت. يظهر التوقيع على الخطابات التي تعتمدها بعد رفعه.</div></div>
        <div class="row"><button type="button" class="btn primary" data-sigup>رفع التوقيع</button>${u.signature ? '<button type="button" class="btn ghost" data-sigdel>حذف التوقيع</button>' : ''}</div>`;
      $('[data-sigup]', box).onclick = async () => {
        const f = $('[data-sigfile]', box).files[0];
        if (!f) {
          toast('اختر صورة التوقيع أولاً');
          return;
        }
        try {
          const r = await api('POST', url, { data: await readFile(f) });
          u = r.user || r;
          onSaved(u);
          toast('تم حفظ التوقيع');
          draw();
        } catch (err) {
          toast(err.message, true);
        }
      };
      if ($('[data-sigdel]', box))
        $('[data-sigdel]', box).onclick = async () => {
          if (!confirm('حذف التوقيع؟ الخطابات المعتمدة سابقاً تبقى بتوقيعها.')) return;
          try {
            const r = await api('DELETE', url);
            u = r.user || r;
            onSaved(u);
            toast('تم حذف التوقيع');
            draw();
          } catch (err) {
            toast(err.message, true);
          }
        };
    };
    draw();
  }
  Object.assign(S, { TABS, TAB_ICONS, SUB_COLORS, DAYS, HR_SETTINGS });
})((window.SES_APP = window.SES_APP || {}));
