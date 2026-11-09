'use strict';
/* صفحة أسطول السيارات (القائمة) بتبويباتها:
 *   كل المركبات (سيارات الشركة بأنواعها، والسيارات الخاصة، والحفارات من سجل قسم الحفر لمن يراه)
 *   سيارات الشركة، والسيارات الخاصة. والصفحة تتذكر آخر تبويب.
 * ومحاضر التسليم والتسلم صفحة مستقلة من قائمة إدارة الحركة (#/fleet?tab=hand ← fleet-handovers.js).
 * تُستدعى من fleet.js بأدواته: kit (fleet-kit.js)، ونافذتا تسجيل المركبة. */
(function () {
  /* أدوات app.js المشتركة وأدوات الأسطول ونافذتا التسجيل: تُضبط عند استدعاء fleet.js لـ list */
  let $, $$, SF, api, can, downloadXlsx, esc, head, icon, route, shell, state;
  let kit, docBadge, worstDoc, ownerOf, vehicleModal, vehicleBulkModal, handovers, S0;
  const TAB_KEY = 'fleet:tab';
  /* تبويبات المركبات: [المفتاح، الأيقونة، العنوان، أي صف يظهر فيه] */
  const TABS = [
    ['all', 'truck', 'كل المركبات', () => true],
    ['company', 'truck', 'سيارات الشركة', (x) => x.car && ownerOf(x.car) === 'شركة'],
    ['private', 'car', 'سيارات خاصة', (x) => x.car && ownerOf(x.car) === 'خاصة'],
  ];
  /* عنوان عمود صاحب العهدة في كل تبويب */
  const WHO_COL = { all: 'السائق / المالك', company: 'السائق', private: 'المالك' };
  const soonOrLate = (d) => d.days !== null && d.days <= 30;
  const expiredDoc = (d) => d.days !== null && d.days < 0;
  const savedTab = () => {
    try {
      const t = sessionStorage.getItem(TAB_KEY) || '';
      return t === 'cars' ? 'all' : t;
    } catch {
      return '';
    }
  };
  const saveTab = (k) => {
    try {
      sessionStorage.setItem(TAB_KEY, k);
    } catch {
      /* تجاهل */
    }
  };

  /* صف موحّد لكل مركبة أو حفارة: للبحث والتصفية والعرض */
  const carRow = (v) => ({
    car: v,
    branch: v.branch,
    text: [v.plate, v.plateEn, v.brand, v.model, v.driver, v.record].join(' '),
    alert: v.docs.some(soonOrLate),
  });
  /* الأيام الباقية على تاريخ (سالبة إذا انتهى) */
  const daysTo = (d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d || '')
      ? Math.round((new Date(`${d}T00:00:00`) - new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)) / 864e5)
      : null;
  /* الحفارة مركبة في الأسطول بفئة «حفارة» (ويديرها قسم الحفر): مستندها شهادة TUV */
  const isRig = (v) => v.vType === 'حفارة';
  const rigRow = (r) => {
    const tuvDays = daysTo(r.tuvEnd);
    return {
      rig: { ...r, tuvDays },
      branch: r.branch,
      text: [r.code, r.plate, r.model, r.operator, r.driver].join(' '),
      alert: tuvDays !== null && tuvDays <= 30,
    };
  };

  function carTr(v, canReq, showOwner) {
    const w = worstDoc(v);
    const status = v.status && v.status !== 'في الخدمة' ? ` <small class="muted">(${esc(v.status)})</small>` : '';
    const own = showOwner && ownerOf(v) === 'خاصة' ? ' <span class="chip">خاصة</span>' : '';
    return `<tr>
        <td><a href="#/fleet/${v.id}"><b><bdi>${esc(v.plate)}</bdi></b></a>${v.plateEn ? ` <small class="muted"><bdi dir="ltr">${esc(v.plateEn)}</bdi></small>` : ''}${status}${own}</td>
        <td>${esc([v.vType, v.brand, v.model, v.year].filter(Boolean).join(' — '))}</td><td>${esc(v.branch)}</td><td>${esc(v.driver || '—')}</td>
        <td>${w ? `${docBadge(w)} <small class="muted">${esc(w.label)}</small>` : '<span class="muted">غير مسجلة</span>'}</td>
        <td>${v.maintCount ? `${v.maintCount} طلب${v.openMaint ? ` <span class="chip pending">${v.openMaint} جارٍ</span>` : ''}` : '<span class="muted">—</span>'}</td>
        <td style="white-space:nowrap"><a class="btn sm" href="#/fleet/${v.id}">📇 الكارت</a>${canReq ? ` <a class="btn sm" href="#/new/carMaintenance?plate=${encodeURIComponent(v.plate)}">🛠️ صيانة</a>` : ''}</td></tr>`;
  }
  function rigTr(r) {
    const tuv = r.tuvEnd
      ? `${docBadge({ days: r.tuvDays })} <small class="muted">شهادة TUV</small>`
      : '<span class="muted">غير مسجلة</span>';
    const status = r.status && r.status !== 'في الخدمة' ? ` <small class="muted">(${esc(r.status)})</small>` : '';
    return `<tr>
        <td><a href="#/fleet/${r.id}"><b><bdi>${esc(r.code || r.plate)}</bdi></b></a>${r.code && r.plate && r.plate !== r.code ? ` <small class="muted"><bdi>${esc(r.plate)}</bdi></small>` : ''}${status}</td>
        <td>${esc(['حفارة', r.mfg, r.model, r.year].filter(Boolean).join(' — '))}</td><td>${esc(r.branch)}</td><td>${esc(r.operator || r.driver || '—')}</td>
        <td>${tuv}</td><td><span class="muted">—</span></td>
        <td style="white-space:nowrap"><a class="btn sm" href="#/fleet/${r.id}">📇 الكارت</a> <a class="btn sm" href="#/drilling">⛏️ سجل الحفارات</a></td></tr>`;
  }

  function statsHtml(list) {
    const expired = list.filter((v) => v.docs.some(expiredDoc)).length;
    const soon = list.filter((v) => !v.docs.some(expiredDoc) && v.docs.some(soonOrLate)).length;
    const stat = (n, l, hi) => `<div class="stat${hi && n ? ' hi' : ''}"><div class="n">${n}</div><div class="l">${l}</div></div>`;
    return `<div class="stats" style="margin-bottom:14px">${stat(list.length, 'إجمالي المركبات')}${stat(expired, 'بها مستند منتهٍ', true)}${stat(soon, 'مستند ينتهي خلال 30 يوماً', true)}${stat(list.filter((v) => v.openMaint).length, 'في الصيانة الآن')}</div>`;
  }
  function tabsHtml(rows) {
    const tab = ([k, ic, title, keep]) =>
      `<a href="#" class="gtab" data-ft="${k}">${icon(ic)}<span>${title}</span><small>${rows.filter(keep).length}</small></a>`;
    return `<div class="gtabs" id="fTabs" style="margin-bottom:12px">${TABS.map(tab).join('')}</div>`;
  }
  function pageHtml(res, rows, query) {
    const list = res.list;
    const branches = [...new Set(rows.map((x) => x.branch).filter(Boolean))].sort();
    const scope = state.user.role === 'accountant' && state.user.branch ? ` — فرع ${esc(state.user.branch)}` : '';
    const tools = res.editor
      ? '<button class="btn primary" id="vAdd">➕ تسجيل مركبة</button><button class="btn" id="vBulk">📋 تسجيل عدة مركبات</button>'
      : '';
    return `${head('🚚 أسطول السيارات', `${list.length} مركبة${scope}`, `${tools}<button class="btn" id="vCsv">📊 Excel</button>`)}
      ${statsHtml(list)}${tabsHtml(rows)}
      <div class="card" id="fCars"><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <input class="in" id="vQ" placeholder="بحث: اللوحة، الماركة، السائق أو المالك، كود الحفارة..." style="flex:1;min-width:200px">
        <select class="in" id="vB" style="width:auto"><option value="">كل الفروع</option>${branches.map((b) => `<option>${esc(b)}</option>`).join('')}</select>
        <label class="check"><input type="checkbox" id="vA"${query.alerts ? ' checked' : ''}> المستندات المنتهية أو القريبة فقط</label></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>رقم اللوحة</th><th>المركبة</th><th>الفرع</th><th id="vWho">السائق</th><th>أقرب مستند</th><th>الصيانة</th><th></th></tr></thead><tbody id="vRows"></tbody></table></div></div>`;
  }

  /* صفوف التبويب الحالي بعد البحث والتصفية */
  function shownRows(rows, tab) {
    const keep = (TABS.find(([k]) => k === tab) || TABS[0])[3];
    const q = $('#vQ').value.trim(),
      b = $('#vB').value,
      a = $('#vA').checked;
    return rows.filter((x) => keep(x) && (!b || x.branch === b) && (!q || x.text.includes(q)) && (!a || x.alert));
  }
  function drawRows(rows, tab, canReq) {
    $('#vRows').innerHTML =
      shownRows(rows, tab)
        .map((x) => (x.rig ? rigTr(x.rig) : carTr(x.car, canReq, tab === 'all')))
        .join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">لا توجد مركبات</td></tr>';
  }

  const sheet = (cols, xs) => [cols.map(([l]) => l), ...xs.map((x) => cols.map(([, f]) => f(x)))];

  /* ---------- تصدير المركبات (التبويب الحالي دون الحفارات: لها ملفها في سجل الحفارات) ---------- */
  const CAR_XLS = (tab) => [
    ['رقم اللوحة', (v) => v.plate],
    ['اللوحة بالإنجليزي', (v) => v.plateEn],
    ['الملكية', ownerOf],
    ['الفئة', (v) => v.vType],
    ['الماركة', (v) => v.brand],
    ['الطراز', (v) => v.model],
    ['سنة الصنع', (v) => v.year],
    ['اللون', (v) => v.color],
    ['الوقود', (v) => v.fuel],
    ['رقم الاستمارة', (v) => v.record],
    ['رقم الهيكل', (v) => v.chassis],
    ['الفرع', (v) => v.branch],
    ['الحالة', (v) => v.status],
    [WHO_COL[tab], (v) => v.driver],
    [`هوية ${WHO_COL[tab]}`, (v) => v.driverIqama],
    ['كارت المتابعة', (v) => v.followCard],
    ...kit.FLEET_FIELDS()[1][1].map((f) => [f.label, (v) => v[f.key]]),
    ['عدد طلبات الصيانة', (v) => v.maintCount],
  ];
  function exportCars(rows, tab) {
    const cars = shownRows(rows, tab)
      .filter((x) => x.car)
      .map((x) => x.car);
    downloadXlsx('أسطول-السيارات.xlsx', sheet(CAR_XLS(tab), cars), 'أسطول السيارات');
  }

  function bindPage(ctx, query) {
    const showTab = (k) => {
      ctx.tab = k;
      $$('#fTabs .gtab').forEach((x) => x.classList.toggle('on', x.dataset.ft === k));
      saveTab(k);
      $('#vWho').textContent = WHO_COL[k];
      drawRows(ctx.rows, k, ctx.canReq);
    };
    $('#fTabs').addEventListener('click', (e) => {
      const a = e.target.closest('[data-ft]');
      if (!a) return;
      e.preventDefault();
      showTab(a.dataset.ft);
    });
    ['input', 'change'].forEach((ev) =>
      ['#vQ', '#vB', '#vA'].forEach((s) => $(s).addEventListener(ev, () => drawRows(ctx.rows, ctx.tab, ctx.canReq))),
    );
    if ($('#vAdd')) $('#vAdd').onclick = () => vehicleModal(null, () => route());
    if ($('#vBulk')) $('#vBulk').onclick = () => vehicleBulkModal(() => route());
    $('#vCsv').onclick = () => exportCars(ctx.rows, ctx.tab);
    const saved = savedTab();
    showTab(TABS.some(([k]) => k === saved) ? saved : 'all');
  }

  async function viewFleet(query) {
    /* محاضر التسليم والتسلم: صفحة مستقلة برابطها من القائمة */
    if (query.tab === 'hand') return handovers.viewHandovers();
    /* مركز نماذج إدارة الحركة (templates-center.js) */
    if (query.tab === 'templates') return window.SES_TEMPLATES.view(S0, 'traffic', '#/fleet?tab=templates');
    const res = await api('GET', '/api/fleet');
    const main = shell('', '#/fleet');
    const rows = res.list.map((v) => (isRig(v) ? rigRow(v) : carRow(v)));
    main.innerHTML = pageHtml(res, rows, query);
    const ctx = { rows, list: res.list, tab: 'all', canReq: can('new') && SF.formAllowed(state.user, 'carMaintenance') };
    bindPage(ctx, query);
  }

  window.SES_FLEET = window.SES_FLEET || {};
  window.SES_FLEET.list = function (S, deps) {
    ({ $, $$, SF, api, can, downloadXlsx, esc, head, icon, route, shell, state } = S);
    ({ kit, vehicleModal, vehicleBulkModal } = deps);
    ({ docBadge, worstDoc, ownerOf } = kit);
    handovers = window.SES_FLEET.handovers(S);
    S0 = S;
    return { viewFleet };
  };
})();
