'use strict';
/* صفحة «supervision» (viewSupervision) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['supervision'] = function (S) {
  const { $, $$, APP_TONES, SF, TABS, api, appHue, chip, dt, empEmpty, esc, head, icon, kv, setCrumb, shell, state, toast, today } = S;
  /* ---------- إدارة الفروع: الفروع بالمناطق وملف كل فرع، تقارير الفروع، الشكاوى والتصعيد، النقل والانتداب، التقارير الدورية ---------- */
  async function viewSupervision(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (d، body) */
    const pageState = {};
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/supervision');
    pageState.d = undefined;
    try {
      pageState.d = await api('GET', '/api/supervision');
    } catch (err) {
      main.innerHTML = `<div class="card err">${esc(err.message)}</div>`;
      return;
    }
    const me = pageState.d.me,
      canSup = me.sup || me.admin;
    const TABS = [
      ['branches', 'الفروع والمناطق', 'buildings'],
      ['reports', 'تقارير الفروع', 'fileText', pageState.d.reports.filter((r) => r.status !== 'تمت المراجعة').length],
      ['issues', 'الشكاوى والمشكلات', 'alert', pageState.d.issues.filter((x) => !['تم الحل', 'مغلقة'].includes(x.status)).length],
      ...supervisionValue2(canSup, me, pageState),
      ...supervisionValue(canSup, me, pageState),
      ...(me.admin ? [['settings', 'الإعدادات', 'settings']] : []),
    ];
    const tab = query.branch ? 'branch' : TABS.some(([k]) => k === query.tab) ? query.tab : 'branches';
    const CL = {
      'لدى مدير المنطقة': 'pending',
      'لدى مدير المتابعة': 'pending',
      'لدى الموارد البشرية': 'pending',
      'لدى المدير التنفيذي': 'pending',
      'تمت المراجعة': 'approved',
      'تم الحل': 'approved',
      'تم التنفيذ': 'approved',
      'تم الاطلاع': 'approved',
      مغلقة: 'cancelled',
      مرفوض: 'rejected',
    };
    const PR = { منخفضة: '#16a34a', متوسطة: '#d97706', عالية: '#dc2626', عاجلة: '#7f1d1d' };
    const chip = (t) => `<span class="chip ${CL[t] || ''}">${esc(t || '')}</span>`;
    const pts = (t) => {
      const l = String(t || '')
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
      return l.length ? `<ul class="sp-ul">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<div class="muted">—</div>';
    };
    return viewSupervisionPart5(PR, TABS, canSup, chip, main, me, pageState, pts, query, tab);
  }
  /* جزء من viewSupervision: const myBranches = pageState.d.branches.map((b) =>… */
  async function viewSupervisionPart5(PR, TABS, canSup, chip, main, me, pageState, pts, query, tab) {
    const myBranches = pageState.d.branches.map((b) => b.branch);
    const canReport = !!me.branch || me.regions.length || canSup;
    const acts = `<span class="row" style="gap:6px;flex-wrap:wrap">${canReport ? `<button class="btn" data-sp="report">${icon('fileText')} رفع تقرير</button><button class="btn" data-sp="issue">${icon('alert')} شكوى / مشكلة</button>` : ''}${canSup ? `<button class="btn" data-sp="move">${icon('forward')} طلب نقل / انتداب</button><button class="btn primary" data-sp="periodic">${icon('chart')} تقرير دوري</button>` : ''}</span>`;
    const tabsBar = `<div class="tabs" style="margin-bottom:14px">${TABS.map(([k, l, ic, n]) => `<a href="#/supervision${k === 'branches' ? '' : `?tab=${k}`}" class="${k === tab || (tab === 'branch' && k === 'branches') ? 'on' : ''}">${icon(ic)} ${esc(l)}${n ? ` <span class="badge">${n}</span>` : ''}</a>`).join('')}</div>`;
    const stat = (l, v, ic, c, cls = '') =>
      `<div class="emp-stat ${cls}"><div><div class="s-v">${v}</div><div class="s-l">${l}</div></div><span class="b-ic" style="--m:${c}">${icon(ic)}</span></div>`;
    viewSupervisionPart3(canSup, me, pageState, stat, tab);
    /* ===== ملف الفرع ===== */
    if (tab === 'branch') {
      let b;
      try {
        b = await api('GET', `/api/supervision/branch/${encodeURIComponent(query.branch)}`);
      } catch (err) {
        main.innerHTML = `<div class="card err">${esc(err.message)}</div>`;
        return;
      }
      const P = b.profile || {};
      const sec = (k, t, ic, auto, key) =>
        `<div class="card sp-sec"><div class="emp-sec-h"><h3>${icon(ic)} ${t}</h3>${b.canEdit && key ? `<button class="btn sm" data-spedit="${key}">✏️ تعديل</button>` : ''}</div>${auto || ''}${key ? `<div class="sp-notes">${key === 'structureNotes' || key === 'equipmentNotes' || key === 'workNotes' ? '<h4 class="b-sec">ملاحظات</h4>' : ''}${pts(P[key])}</div>` : ''}</div>`;
      viewSupervisionPart4(P, b, chip, pageState, sec, stat);
      main.addEventListener('click', (ev) => {
        const e1 = ev.target.closest('[data-spedit]');
        if (e1) editProfile(b, e1.dataset.spedit);
      });
    }
    /* ===== القوائم ===== */
    viewSupervisionPart2(PR, acts, chip, main, pageState, query, settings, tab, tabsBar);
    const reload = () => viewSupervision(query);
    viewSupervisionPart(main, newIssue, newMove, newPeriodic, newReport, openItem, query, tab);

    /* ----- نوافذ ----- */
    function modal(...args) {
      return supervisionModal(...args);
    }
    const err = (bg, m) => {
      $('.sperr', bg).innerHTML = `<div class="err">${esc(m)}</div>`;
    };
    const F = (l, inner, full) => `<div class="field${full ? ' full' : ''}"><label>${l}</label>${inner}</div>`;
    const ta = (k, ph, rows = 3) =>
      `<textarea class="in" name="${k}" rows="${rows}" placeholder="${esc(ph || 'كل نقطة في سطر')}"></textarea>`;
    const btns = (t) =>
      `<div class="row" style="gap:8px;margin-top:12px"><button class="btn primary">${t}</button><button type="button" class="btn ghost" data-x>إلغاء</button></div>`;
    const val = (bg) => Object.fromEntries($$('[name]', bg).map((i) => [i.name, i.value]));
    function editProfile(...args) {
      return supervisionEditProfile(F, btns, err, modal, reload, ...args);
    }
    const brOpts = (sel) => myBranches.map((b) => `<option${b === sel ? ' selected' : ''}>${esc(b)}</option>`).join('');
    function newReport(...args) {
      return supervisionNewReport(F, brOpts, btns, canSup, err, me, modal, pageState, query, ta, val, ...args);
    }
    function newIssue(...args) {
      return supervisionNewIssue(F, brOpts, btns, err, me, modal, query, ta, val, ...args);
    }
    function newMove(...args) {
      return supervisionNewMove(F, btns, err, modal, pageState, ta, val, ...args);
    }
    /* حدود الفترة حسب النوع */
    const periodRange = (...args) => supervisionPeriodRange(...args);
    const statsHtml = (
      st,
    ) => `<div class="emp-stats" style="margin:8px 0">${stat('تقارير الفروع والمناطق', st.reports, 'fileText', '#d97706')}${stat('الشكاوى', `${st.issues} <small>تم حل ${st.issuesResolved}</small>`, 'alert', '#dc2626')}${stat('شكاوى مفتوحة', st.issuesOpen, 'alert', '#b45309')}${stat('نقل / انتداب', `${st.moves} <small>(${st.transfers} نقل، ${st.mandates} انتداب)</small>`, 'forward', '#7c3aed')}</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>المنطقة</th><th>التقارير</th><th>الشكاوى</th><th>المفتوحة</th></tr></thead><tbody>${st.byRegion.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.reports}</td><td>${r.issues}</td><td>${r.open}</td></tr>`).join('')}</tbody></table></div>
      ${st.noReport.length ? `<div class="hint">فروع لم ترفع تقريراً خلال الفترة: ${esc(st.noReport.join('، '))}</div>` : ''}`;
    function newPeriodic(...args) {
      return supervisionNewPeriodic(F, btns, err, modal, periodRange, statsHtml, ta, val, ...args);
    }
    function openItem(k, id) {
      /* حالة الصفحة: ما يتغير بعد العرض (html) */
      const vs = {};
      const x = (pageState.d[k] || []).find((y) => y.id === id);
      return openItemPart3(canSup, chip, err, k, me, modal, pts, reload, statsHtml, vs, x);
    }
    /* ----- الإعدادات: مديرو المتابعة، المدير التنفيذي، المناطق ومديروها وفروعها ----- */
    function settings(...args) {
      return supervisionSettings(F, reload, ...args);
    }
  }
  /* جزء من viewSupervision: const tbl = (head, rows) =>… */
  function viewSupervisionPart4(P, b, chip, pageState, sec, stat) {
    const tbl = (head, rows) =>
      rows.length
        ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c == null ? '' : c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        : '<div class="muted">لا توجد بيانات</div>';
    pageState.body = `<div class="emp-stats" style="margin-top:0">${stat('الموظفون', `${b.emps} <small>منهم ${b.saudi} سعودي</small>`, 'users', '#0891b2')}${stat('المركبات', b.vehicles, 'car', '#4f46e5')}${stat('الحفارات', b.rigs, 'truck', '#b45309')}${stat('بنود الجرد', b.invItems, 'boxes', '#64748b')}${stat('مشاريع قائمة', b.projects, 'layers', '#16a34a')}${stat('شكاوى مفتوحة', b.openIssues, 'alert', '#dc2626', b.openIssues ? 'bad' : '')}</div>
        <div class="card"><div class="muted">${esc(b.region)}${b.regionMgr ? ` · مدير المنطقة: <b>${esc(b.regionMgr)}</b>` : ''}${b.manager ? ` · مدير الفرع: <b>${esc(b.manager)}</b>` : ''}${b.lastReport ? ` · آخر تقرير: ${esc(dt(b.lastReport))}` : ' · لم يرفع الفرع تقريراً بعد'}${supervisionValue3(P)}</div></div>
        ${sec(
          'structure',
          'الهيكل',
          'layers',
          `${b.structure.managers.length ? `<div class="sp-mgrs">${b.structure.managers.map((m) => `<span class="chip">${esc(m.name)}${m.title ? ` — ${esc(m.title)}` : ''}</span>`).join('')}</div>` : ''}
          <div class="grid2" style="grid-template-columns:1fr 1fr;gap:12px">${tbl(['المسمى الوظيفي', 'العدد'], b.structure.byTitle)}${tbl(['الإدارة / القسم', 'العدد'], b.structure.byDept)}</div>`,
          'structureNotes',
        )}
        ${sec(
          'equipment',
          'المعدات والتجهيزات',
          'truck',
          `${tbl(
            ['اللوحة', 'النوع', 'الطراز', 'الحالة', 'السائق'],
            b.equipment.vehicles.map((v) => [v.plate, v.type, v.model, v.status, v.driver]),
          )}<h4 class="b-sec">الجرد (حسب القسم)</h4>${tbl(['القسم', 'العدد'], b.equipment.inv)}`,
          'equipmentNotes',
        )}
        ${sec('cap', 'الإمكانيات', 'award', '', 'capabilities')}
        ${sec('chal', 'السلبيات والتحديات', 'alert', '', 'challenges')}
        ${sec('needs', 'الاحتياجات والمتطلبات', 'listChecks', '', 'needs')}
        ${sec(
          'work',
          'المشاريع القائمة وحجم العمل',
          'gantt',
          tbl(
            ['المشروع', 'العميل', 'الحالة', 'البداية', 'النهاية', 'المنجز / المخطط'],
            b.projectList.map((p) => [
              p.name,
              p.client,
              p.status,
              p.startDate && SF.fmtDate(p.startDate),
              p.endDate && SF.fmtDate(p.endDate),
              p.planned ? `${p.done || 0} / ${p.planned}` : p.holes || '',
            ]),
          ),
          'workNotes',
        )}
        <div class="grid2" style="grid-template-columns:1fr 1fr;gap:12px"><div class="card"><h3 style="margin-top:0">${icon('fileText')} آخر التقارير</h3>${b.reports.length ? b.reports.map((r) => `<div class="sp-li" data-spopen="reports:${r.id}"><b dir="ltr">${esc(r.serial)}</b> ${esc(r.kind)} — ${esc(dt(r.at))} ${chip(r.status)}</div>`).join('') : '<div class="muted">لا توجد</div>'}</div>
          <div class="card"><h3 style="margin-top:0">${icon('alert')} آخر الشكاوى</h3>${b.issues.length ? b.issues.map((x) => `<div class="sp-li" data-spopen="issues:${x.id}"><b dir="ltr">${esc(x.serial)}</b> ${esc(x.title)} ${chip(x.status)}</div>`).join('') : '<div class="muted">لا توجد</div>'}</div></div>`;
    setCrumb([[`فرع ${b.branch}`, location.hash]]);
  }
  /* جزء من viewSupervision: P.updatedAt ? ` · آخر تحديث للملف: ${esc(dt(P.updatedAt))} (… */
  function supervisionValue3(P) {
    return P.updatedAt ? ` · آخر تحديث للملف: ${esc(dt(P.updatedAt))} (${esc(P.updatedBy || '')})` : '';
  }
  /* جزء من viewSupervision: canSup || me.hr… */
  function supervisionValue2(canSup, me, pageState) {
    return canSup || me.hr
      ? [['moves', 'النقل والانتداب', 'forward', pageState.d.moves.filter((x) => x.status === 'لدى الموارد البشرية').length]]
      : [];
  }
  /* جزء من viewSupervision: canSup || me.exec… */
  function supervisionValue(canSup, me, pageState) {
    return canSup || me.exec
      ? [
          [
            'periodic',
            'التقارير الدورية',
            'chart',
            me.exec ? pageState.d.periodic.filter((x) => x.status === 'لدى المدير التنفيذي').length : 0,
          ],
        ]
      : [];
  }
  /* modal من viewSupervision */
  function supervisionModal(title, html, w = 760) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:${w}px;width:96%"><h3 style="margin-top:0">${title}</h3>${html}<div class="sperr"></div></div>`;
    document.body.appendChild(bg);
    $$('[data-x]', bg).forEach((b) => {
      b.onclick = () => bg.remove();
    });
    return bg;
  }
  /* periodRange من viewSupervision */
  function supervisionPeriodRange(p) {
    const n = new Date(),
      y = n.getFullYear(),
      m = n.getMonth();
    const f = (dd) => dd.toISOString().slice(0, 10);
    if (p === 'شهري')
      return [f(new Date(Date.UTC(y, m - 1, 1))), f(new Date(Date.UTC(y, m, 0))), `${y}-${String(m || 12).padStart(2, '0')}`];
    if (p === 'ربع سنوي') {
      const q = Math.floor(m / 3) - 1,
        yy = q < 0 ? y - 1 : y,
        qq = (q + 4) % 4;
      return [f(new Date(Date.UTC(yy, qq * 3, 1))), f(new Date(Date.UTC(yy, qq * 3 + 3, 0))), `الربع ${qq + 1} — ${yy}`];
    }
    if (p === 'نصف سنوي') {
      const h = m < 6 ? 1 : 0,
        yy = h ? y - 1 : y;
      return h ? [`${yy}-07-01`, `${yy}-12-31`, `النصف الثاني — ${yy}`] : [`${yy}-01-01`, `${yy}-06-30`, `النصف الأول — ${yy}`];
    }
    return [`${y - 1}-01-01`, `${y - 1}-12-31`, `عام ${y - 1}`];
  }
  /* newIssue من viewSupervision (يأخذ F، brOpts، btns، err، me، modal، query، ta، val من الصفحة) */
  function supervisionNewIssue(F, brOpts, btns, err, me, modal, query, ta, val) {
    const bg = modal(
      `${icon('alert')} رفع شكوى / مشكلة متعلقة بالعمل`,
      `<form><div class="grid2" style="grid-template-columns:repeat(3,1fr)">${F('الفرع', `<select class="in" name="branch">${brOpts(me.branch || query.branch)}</select>`)}
        ${F('التصنيف', `<select class="in" name="category">${['تشغيلية', 'موارد بشرية', 'معدات وصيانة', 'مالية', 'عملاء', 'سلامة', 'أخرى'].map((c) => `<option>${c}</option>`).join('')}</select>`)}${F('الأولوية', '<select class="in" name="priority"><option>متوسطة</option><option>منخفضة</option><option>عالية</option><option>عاجلة</option></select>')}</div>
        ${F('العنوان *', '<input class="in" name="title">', true)}${F('الوصف والتفاصيل *', ta('description', 'اشرح المشكلة وأثرها على العمل وما تم من محاولات لحلها', 5), true)}
        <div class="hint">تصل الشكوى لمدير المنطقة، ويحلها أو يصعّدها لمدير إدارة الفروع.</div>${btns('📤 رفع')}</form>`,
      760,
    );
    $('form', bg).onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api('POST', '/api/supervision/issues', val(bg));
        bg.remove();
        toast('تم رفع الشكوى');
        location.hash = '#/supervision?tab=issues';
      } catch (x) {
        err(bg, x.message);
      }
    };
  }
  /* editProfile من viewSupervision (يأخذ F، btns، err، modal، reload من الصفحة) */
  function supervisionEditProfile(F, btns, err, modal, reload, b, key) {
    const L = {
      structureNotes: 'ملاحظات على الهيكل',
      equipmentNotes: 'ملاحظات على المعدات والتجهيزات',
      capabilities: 'الإمكانيات',
      challenges: 'السلبيات والتحديات',
      needs: 'الاحتياجات والمتطلبات',
      workNotes: 'ملاحظات على المشاريع وحجم العمل',
    };
    const bg = modal(
      `✏️ ${L[key]} — فرع ${esc(b.branch)}`,
      `<form>${F(L[key], `<textarea class="in" name="v" rows="10" placeholder="كل نقطة في سطر">${esc((b.profile || {})[key] || '')}</textarea>`, true)}${btns('💾 حفظ')}</form>`,
      640,
    );
    $('form', bg).onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api('PUT', `/api/supervision/branch/${encodeURIComponent(b.branch)}`, { [key]: $('[name=v]', bg).value });
        bg.remove();
        reload();
      } catch (x) {
        err(bg, x.message);
      }
    };
  }
  /* newReport من viewSupervision (يأخذ F، brOpts، btns، canSup، err، me، modal، pageState، query، ta، val من الصفحة) */
  function supervisionNewReport(F, brOpts, btns, canSup, err, me, modal, pageState, query, ta, val) {
    const regs = pageState.d.regions.filter((r) => me.regions.includes(r.k) || canSup);
    const bg = modal(
      `${icon('fileText')} رفع تقرير`,
      `<form><div class="grid2" style="grid-template-columns:repeat(3,1fr)">
        ${F('مستوى التقرير', `<select class="in" name="level"><option value="branch">تقرير فرع</option>${regs.length ? '<option value="region">تقرير منطقة</option>' : ''}</select>`)}
        ${F('الفرع', `<select class="in" name="branch">${brOpts(me.branch || query.branch)}</select>`)}${regs.length ? F('المنطقة', `<select class="in" name="region">${regs.map((r) => `<option value="${r.k}">${esc(r.name)}</option>`).join('')}</select>`) : ''}
        ${F('نوع التقرير', '<select class="in" name="kind"><option>شهري</option><option>أسبوعي</option><option>ربع سنوي</option><option>خاص</option></select>')}${F('من', '<input class="in" type="date" name="from">')}${F('إلى', `<input class="in" type="date" name="to" value="${today()}">`)}</div>
        ${F('الملخص *', ta('summary', 'ملخص أداء الفرع خلال الفترة'), true)}${F('الإنجازات', ta('achievements'), true)}${F('حجم العمل والمشاريع', ta('workload', 'المشاريع الجارية، عدد الجسات / الاختبارات، العملاء...'), true)}
        ${F('المشكلات والتحديات', ta('problems'), true)}${F('الاحتياجات والمتطلبات', ta('needs'), true)}${F('ملاحظات', ta('notes', '', 2), true)}${btns('📤 رفع التقرير')}</form>`,
      860,
    );
    const sync = () => {
      const lv = $('[name=level]', bg).value;
      $('[name=branch]', bg).closest('.field').hidden = lv !== 'branch';
      const rg = $('[name=region]', bg);
      if (rg) rg.closest('.field').hidden = lv !== 'region';
    };
    $('[name=level]', bg).onchange = sync;
    sync();
    $('form', bg).onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api('POST', '/api/supervision/reports', val(bg));
        bg.remove();
        toast('تم رفع التقرير');
        location.hash = '#/supervision?tab=reports';
      } catch (x) {
        err(bg, x.message);
      }
    };
  }
  /* newMove من viewSupervision (يأخذ F، btns، err، modal، pageState، ta، val من الصفحة) */
  async function supervisionNewMove(F, btns, err, modal, pageState, ta, val) {
    const emps = (await api('GET', '/api/emp-lookup').catch(() => ({ list: [] }))).list || [];
    const bg = modal(
      `${icon('forward')} طلب نقل / انتداب موظف — للموارد البشرية`,
      `<form><div class="grid2" style="grid-template-columns:repeat(3,1fr)">
        ${F('النوع', '<select class="in" name="type"><option>نقل</option><option>انتداب</option></select>')}
        ${F('الموظف', `<input class="in" name="emp" list="spEmps" placeholder="ابحث بالاسم أو الرقم الوظيفي"><datalist id="spEmps">${emps.map((e) => `<option value="${esc(`${e.nameAr} — ${e.empNo || e.iqama || ''}`)}">${esc(e.branch || '')}</option>`).join('')}</datalist>`)}
        ${F('إلى فرع', `<select class="in" name="toBranch">${pageState.d.branches.map((b) => `<option>${esc(b.branch)}</option>`).join('')}</select>`)}
        ${F('من تاريخ', `<input class="in" type="date" name="from" value="${today()}">`)}${F('إلى تاريخ (للانتداب)', '<input class="in" type="date" name="to">')}</div>
        ${F('سبب الطلب (حاجة العمل) *', ta('reason', 'لماذا يحتاج العمل نقل / انتداب هذا الموظف؟', 3), true)}<div class="hint">بعد أن تنفذ الموارد البشرية الانتداب يحتسبه النظام في البصمة (لا يحسبه غياباً خلال مدته).</div>${btns('📤 توجيه للموارد البشرية')}</form>`,
      820,
    );
    const sync = () => {
      $('[name=to]', bg).closest('.field').hidden = $('[name=type]', bg).value !== 'انتداب';
    };
    $('[name=type]', bg).onchange = sync;
    sync();
    $('form', bg).onsubmit = async (e) => {
      e.preventDefault();
      const v = val(bg);
      const m = /—\s*(\S+)\s*$/.exec(v.emp || '');
      const emp = m && emps.find((x) => x.empNo === m[1] || x.iqama === m[1]);
      if (!emp) return err(bg, 'اختر الموظف من القائمة');
      try {
        await api('POST', '/api/supervision/moves', { ...v, empId: emp.id });
        bg.remove();
        toast('تم توجيه الطلب للموارد البشرية');
        location.hash = '#/supervision?tab=moves';
      } catch (x) {
        err(bg, x.message);
      }
    };
  }
  /* newPeriodic من viewSupervision (يأخذ F، btns، err، modal، periodRange، statsHtml، ta، val من الصفحة) */
  function supervisionNewPeriodic(F, btns, err, modal, periodRange, statsHtml, ta, val) {
    const bg = modal(
      `${icon('chart')} تقرير دوري للمدير التنفيذي`,
      `<form><div class="grid2" style="grid-template-columns:repeat(4,1fr)">${F('نوع التقرير', '<select class="in" name="period"><option>شهري</option><option>ربع سنوي</option><option>نصف سنوي</option><option>سنوي</option></select>')}
        ${F('العنوان', '<input class="in" name="label">')}${F('من', '<input class="in" type="date" name="from">')}${F('إلى', '<input class="in" type="date" name="to">')}</div>
        <h4 class="b-sec">إحصائيات الفترة (تلقائياً)</h4><div id="spSt" class="muted">—</div>
        ${F('الملخص التنفيذي *', ta('summary', 'أهم ما حدث في الفترة', 4), true)}${F('أبرز الإنجازات', ta('highlights'), true)}${F('التحديات والمخاطر', ta('challenges'), true)}${F('التوصيات والقرارات المطلوبة', ta('recommendations'), true)}${btns('📤 رفع للمدير التنفيذي')}</form>`,
      920,
    );
    const load = async () => {
      const f = $('[name=from]', bg).value,
        t = $('[name=to]', bg).value;
      if (!f || !t) return;
      try {
        $('#spSt', bg).innerHTML = statsHtml(await api('GET', `/api/supervision/periodic/stats?from=${f}&to=${t}`));
      } catch (x) {
        $('#spSt', bg).textContent = x.message;
      }
    };
    const setP = () => {
      const [f, t, l] = periodRange($('[name=period]', bg).value);
      $('[name=from]', bg).value = f;
      $('[name=to]', bg).value = t;
      $('[name=label]', bg).value = l;
      load();
    };
    $('[name=period]', bg).onchange = setP;
    $('[name=from]', bg).onchange = load;
    $('[name=to]', bg).onchange = load;
    setP();
    $('form', bg).onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api('POST', '/api/supervision/periodic', val(bg));
        bg.remove();
        toast('تم رفع التقرير للمدير التنفيذي');
        location.hash = '#/supervision?tab=periodic';
      } catch (x) {
        err(bg, x.message);
      }
    };
  }
  /* settings من viewSupervision (يأخذ F، reload من الصفحة) */
  async function supervisionSettings(F, reload) {
    const box = $('#spSet');
    const st = await api('GET', '/api/supervision/settings');
    let regs = st.cfg.regions.map((r) => ({ ...r, branches: [...r.branches] }));
    const uOpt = (sel) =>
      `<option value="">— اختر —</option>${st.users.map((u) => `<option value="${u.id}"${u.id === sel ? ' selected' : ''}>${esc(u.name)}${u.title ? ` — ${esc(u.title)}` : ''}</option>`).join('')}`;
    const draw = () => {
      const used = new Set(regs.flatMap((r) => r.branches));
      box.innerHTML = `<h3 style="margin-top:0">${icon('settings')} إعدادات إدارة الفروع</h3>
          <div class="grid2" style="grid-template-columns:1fr 1fr 1fr">${F('مدير إدارة الفروع', `<select class="in" id="spM1">${uOpt((st.cfg.mgrs || [])[0])}</select>`)}${F('مدير متابعة إضافي (اختياري)', `<select class="in" id="spM2">${uOpt((st.cfg.mgrs || [])[1])}</select>`)}${F('المدير التنفيذي (يستلم التقارير الدورية)', `<select class="in" id="spEx">${uOpt(st.cfg.exec)}</select>`)}</div>
          ${regs
            .map(
              (
                r,
                i,
              ) => `<div class="sp-rg"><div class="grid2" style="grid-template-columns:1fr 1fr auto;align-items:end">${F('اسم المنطقة', `<input class="in" data-rn="${i}" value="${esc(r.name)}">`)}${F('مدير المنطقة', `<select class="in" data-rm="${i}">${uOpt(r.mgr)}</select>`)}<button type="button" class="btn sm bad ghost" data-rdel="${i}">حذف المنطقة</button></div>
            <div class="sp-brs">${st.branches
              .filter((b) => r.branches.includes(b) || !used.has(b))
              .map(
                (b) =>
                  `<label><input type="checkbox" data-rb="${i}" value="${esc(b)}"${r.branches.includes(b) ? ' checked' : ''}> ${esc(b)}</label>`,
              )
              .join('')}</div></div>`,
            )
            .join('')}
          <div class="row" style="gap:8px;margin-top:12px"><button type="button" class="btn" id="spAddR">➕ إضافة منطقة</button><button type="button" class="btn primary" id="spSave">💾 حفظ الإعدادات</button></div>
          <div class="hint">مديرو الفروع هم من عليهم علامة «مدير فرع» في المستخدمين. الفرع غير المضاف لأي منطقة تصل تقاريره وشكاواه مباشرة لمدير المتابعة.</div><div class="sperr"></div>`;
      const sync = () => {
        regs.forEach((r, i) => {
          r.name = $(`[data-rn="${i}"]`, box).value;
          r.mgr = $(`[data-rm="${i}"]`, box).value;
          r.branches = $$(`[data-rb="${i}"]:checked`, box).map((c) => c.value);
        });
      };
      $$('[data-rb]', box).forEach((c) => {
        c.onchange = () => {
          sync();
          draw();
        };
      });
      $$('[data-rdel]', box).forEach((b) => {
        b.onclick = () => {
          sync();
          regs.splice(Number(b.dataset.rdel), 1);
          draw();
        };
      });
      $('#spAddR', box).onclick = () => {
        sync();
        regs.push({ k: `r${Date.now().toString(36)}`, name: 'منطقة جديدة', mgr: '', branches: [] });
        draw();
      };
      $('#spSave', box).onclick = async () => {
        sync();
        try {
          await api('PUT', '/api/supervision/settings', {
            mgrs: [$('#spM1', box).value, $('#spM2', box).value].filter(Boolean),
            exec: $('#spEx', box).value,
            regions: regs,
          });
          toast('تم حفظ الإعدادات');
          reload();
        } catch (e) {
          $('.sperr', box).innerHTML = `<div class="err">${esc(e.message)}</div>`;
        }
      };
    };
    draw();
  }
  /* جزء من viewSupervision: pageState.body = '';… */
  function viewSupervisionPart3(canSup, me, pageState, stat, tab) {
    pageState.body = '';
    /* ===== الفروع والمناطق ===== */
    if (tab === 'branches') {
      const mon = today().slice(0, 7);
      const tile = (b, i) => {
        const [a, c, dd] = APP_TONES[i % APP_TONES.length];
        return `<a class="ap-t" href="#/supervision?branch=${encodeURIComponent(b.branch)}" title="${esc(`${b.emps} موظف — ${b.projects} مشروع قائم`)}"><span class="ap-g" style="--a:${a};--b:${c};--c:${dd};--m:${appHue(`br-${b.branch}`)}"><i class="ap-x"></i><i class="ap-y"></i>${icon('branch')}${b.openIssues ? `<b class="ap-b" title="شكاوى مفتوحة">${b.openIssues}</b>` : ''}</span><span class="ap-l">${esc(b.branch)}<small class="ap-d">${b.emps} موظف · ${b.projects} مشروع</small></span></a>`;
      };
      const groups = [
        ...pageState.d.regions.map((r) => ({ ...r, list: pageState.d.branches.filter((b) => r.branches.includes(b.branch)) })),
        {
          k: '_none',
          name: 'بدون منطقة',
          mgrName: '',
          list: pageState.d.branches.filter((b) => !pageState.d.regions.some((r) => r.branches.includes(b.branch))),
        },
      ].filter((g) => g.list.length);
      pageState.body = `<div class="emp-stats" style="margin-top:0">${stat('الفروع', pageState.d.branches.length, 'buildings', '#4f46e5')}${stat(
        'الموظفون',
        pageState.d.branches.reduce((a, b) => a + b.emps, 0),
        'users',
        '#0891b2',
      )}${stat(
        'المشاريع القائمة',
        pageState.d.branches.reduce((a, b) => a + b.projects, 0),
        'layers',
        '#16a34a',
      )}
          ${stat('تقارير هذا الشهر', pageState.d.reports.filter((r) => String(r.at).startsWith(mon)).length, 'fileText', '#d97706')}${stat('شكاوى مفتوحة', pageState.d.issues.filter((x) => !['تم الحل', 'مغلقة'].includes(x.status)).length, 'alert', '#dc2626')}${canSup || me.hr ? stat('نقل / انتداب لدى الموارد البشرية', pageState.d.moves.filter((x) => x.status === 'لدى الموارد البشرية').length, 'forward', '#7c3aed') : ''}</div>
        <div class="card"><div class="muted" style="margin-bottom:6px">مدير إدارة الفروع: <b>${esc(pageState.d.supMgrs.join('، ') || 'غير محدد')}</b> · المدير التنفيذي: <b>${esc(pageState.d.execName || 'غير محدد')}</b>${me.admin ? ' — <a href="#/supervision?tab=settings">الإعدادات</a>' : ''}</div>
        ${groups.map((g) => `<h3 class="sp-reg">${icon('mapPin')} ${esc(g.name)} <small class="muted">${g.list.length} فرع${g.mgrName ? ` · مدير المنطقة: ${esc(g.mgrName)}` : ''}</small></h3><div class="ap-grid">${g.list.map(tile).join('')}</div>`).join('') || empEmpty('لا توجد فروع متاحة لك')}</div>`;
    }
  }
  /* جزء من viewSupervision: const listTbl = (k, rows, cols) =>… */
  function viewSupervisionPart2(PR, acts, chip, main, pageState, query, settings, tab, tabsBar) {
    const listTbl = (k, rows, cols) =>
      rows.length
        ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(([h]) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((x) => `<tr class="clickable" style="cursor:pointer" data-spopen="${k}:${x.id}">${cols.map(([, f]) => `<td>${f(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        : empEmpty('لا توجد سجلات');
    if (tab === 'reports')
      pageState.body = `<div class="card">${listTbl('reports', pageState.d.reports, [
        ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
        ['التاريخ', (x) => esc(dt(x.at))],
        ['الفرع / المنطقة', (x) => esc(x.level === 'branch' ? `فرع ${x.branch}` : x.regionName)],
        ['النوع', (x) => esc(x.kind)],
        ['الملخص', (x) => esc(x.summary.slice(0, 90))],
        ['بواسطة', (x) => esc(x.byName)],
        ['الحالة', (x) => chip(x.status)],
      ])}</div>`;
    if (tab === 'issues')
      pageState.body = `<div class="card">${listTbl('issues', pageState.d.issues, [
        ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
        ['التاريخ', (x) => esc(dt(x.at))],
        ['الفرع', (x) => esc(x.branch)],
        ['العنوان', (x) => `<b>${esc(x.title)}</b><div class="muted" style="font-size:12px">${esc(x.category || '')}</div>`],
        ['الأولوية', (x) => `<span class="hse-sev" style="--c:${PR[x.priority] || '#64748b'}">${esc(x.priority)}</span>`],
        ['الحالة', (x) => chip(x.status)],
      ])}</div>`;
    if (tab === 'moves')
      pageState.body = `<div class="card">${listTbl('moves', pageState.d.moves, [
        ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
        ['النوع', (x) => `<b>${esc(x.type)}</b>`],
        ['الموظف', (x) => `${esc(x.empName)}<div class="muted" style="font-size:12px">${esc(x.empNo)}</div>`],
        ['من ← إلى', (x) => `${esc(x.fromBranch)} ← <b>${esc(x.toBranch)}</b>`],
        ['المدة', (x) => esc(`${SF.fmtDate(x.from)}${x.to ? ` — ${SF.fmtDate(x.to)}` : ''}`)],
        ['الحالة', (x) => chip(x.status)],
      ])}</div>`;
    if (tab === 'periodic')
      pageState.body = `<div class="card">${listTbl('periodic', pageState.d.periodic, [
        ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
        ['التقرير', (x) => `<b>${esc(x.period)}</b> ${esc(x.label || '')}`],
        ['الفترة', (x) => esc(`${SF.fmtDate(x.from)} — ${SF.fmtDate(x.to)}`)],
        ['الملخص', (x) => esc(x.summary.slice(0, 90))],
        ['الحالة', (x) => chip(x.status)],
      ])}</div>`;
    if (tab === 'settings') pageState.body = '<div class="card" id="spSet"><div class="empty">جاري التحميل...</div></div>';
    main.innerHTML = `${head(tab === 'branch' ? `إدارة الفروع — فرع ${esc(query.branch)}` : 'إدارة الفروع', 'مدير الفرع ← مدير المنطقة ← مدير إدارة الفروع ← المدير التنفيذي', acts)}${tabsBar}${pageState.body}`;
    if (tab === 'settings') settings();
  }
  /* جزء من viewSupervision: main.addEventListener('click', (ev) => {… */
  function viewSupervisionPart(main, newIssue, newMove, newPeriodic, newReport, openItem, query, tab) {
    main.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-sp]');
      if (a) return { report: newReport, issue: newIssue, move: newMove, periodic: newPeriodic }[a.dataset.sp]();
      const o = ev.target.closest('[data-spopen]');
      if (o) {
        const [k, id] = o.dataset.spopen.split(':');
        openItem(k, id);
      }
    });
    if (query.id && ['reports', 'issues', 'moves', 'periodic'].includes(tab)) openItem(tab, query.id);
  }
  /* جزء من openItem: if (!x) return;… */
  function openItemPart3(canSup, chip, err, k, me, modal, pts, reload, statsHtml, vs, x) {
    if (!x) return;
    const logH = `<h4 class="b-sec">السجل</h4><ul class="timeline">${(x.log || [])
      .slice()
      .reverse()
      .map(
        (h) =>
          `<li><b>${esc(h.action)}</b><div class="when">${esc(h.by)} — ${esc(dt(h.at))}</div>${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}</li>`,
      )
      .join('')}</ul>`;
    const kv = (pairs) =>
      `<div class="emp-fields">${pairs
        .filter(([, v]) => v)
        .map(([l, v]) => `<div class="emp-f"><small>${l}</small><b>${esc(v)}</b></div>`)
        .join('')}</div>`;
    const block = (l, v) => (String(v || '').trim() ? `<h4 class="b-sec">${l}</h4>${pts(v)}` : '');
    const isRegMgr = x.region && me.regions.includes(x.region);
    const A = [];
    vs.html = '';
    if (k === 'reports') {
      vs.html =
        kv([
          ['المستوى', x.level === 'branch' ? `فرع ${x.branch}` : x.regionName],
          ['النوع', x.kind],
          ['الفترة', x.from || x.to ? `${SF.fmtDate(x.from)} — ${SF.fmtDate(x.to)}` : ''],
          ['رفعه', x.byName],
          ['التاريخ', dt(x.at)],
        ]) +
        block('الملخص', x.summary) +
        block('الإنجازات', x.achievements) +
        block('حجم العمل والمشاريع', x.workload) +
        block('المشكلات والتحديات', x.problems) +
        block('الاحتياجات والمتطلبات', x.needs) +
        block('ملاحظات', x.notes);
      if (x.status === 'لدى مدير المنطقة' && (isRegMgr || me.admin))
        A.push(['forward', 'رفع لمدير المتابعة'], ['review', 'تمت المراجعة (إغلاق)']);
      if (canSup && x.status !== 'تمت المراجعة') A.push(['review', 'تمت المراجعة']);
    }
    if (k === 'issues') {
      vs.html =
        kv([
          ['الفرع', x.branch],
          ['التصنيف', x.category],
          ['الأولوية', x.priority],
          ['رفعها', x.byName],
          ['التاريخ', dt(x.at)],
        ]) +
        block('الوصف', x.description) +
        (x.resolution ? block(`الحل (${x.resolvedBy || ''})`, x.resolution) : '');
      const handler = (isRegMgr && x.status === 'لدى مدير المنطقة') || (canSup && !['تم الحل', 'مغلقة'].includes(x.status));
      if (x.status === 'لدى مدير المنطقة' && (isRegMgr || me.admin)) A.push(['escalate', 'تصعيد لمدير المتابعة']);
      if (handler) A.push(['resolve', 'تم الحل']);
      if (x.status === 'تم الحل' && (x.by === state.user.id || me.admin)) A.push(['close', 'إغلاق'], ['reopen', 'إعادة فتح']);
    }
    return openItemPart2(A, block, chip, err, k, kv, logH, me, modal, reload, statsHtml, vs, x);
  }
  /* جزء من openItem: if (k === 'moves') {… */
  function openItemPart2(A, block, chip, err, k, kv, logH, me, modal, reload, statsHtml, vs, x) {
    if (k === 'moves') {
      vs.html =
        kv([
          ['النوع', x.type],
          ['الموظف', `${x.empName}${x.empNo ? ` — ${x.empNo}` : ''}`],
          ['من فرع', x.fromBranch],
          ['إلى فرع', x.toBranch],
          ['من تاريخ', SF.fmtDate(x.from)],
          ['إلى تاريخ', x.to ? SF.fmtDate(x.to) : ''],
          ['طلبه', x.byName],
        ]) +
        block('السبب', x.reason) +
        (x.type === 'نقل' && x.status === 'لدى الموارد البشرية'
          ? '<div class="hint">تنفيذ النقل: من «رفع طلب جديد» ← قرار نقل موظف (يحدّث فرع الموظف بعد اعتماده)، ثم «تم التنفيذ» هنا.</div>'
          : '');
      if (x.status === 'لدى الموارد البشرية' && (me.hr || me.admin)) A.push(['done', 'تم التنفيذ'], ['reject', 'رفض']);
    }
    if (k === 'periodic') {
      vs.html =
        kv([
          ['النوع', x.period],
          ['العنوان', x.label],
          ['الفترة', `${SF.fmtDate(x.from)} — ${SF.fmtDate(x.to)}`],
          ['رفعه', x.byName],
          ['التاريخ', dt(x.at)],
        ]) +
        `<h4 class="b-sec">إحصائيات الفترة</h4>${statsHtml(x.stats)}` +
        block('الملخص التنفيذي', x.summary) +
        block('أبرز الإنجازات', x.highlights) +
        block('التحديات والمخاطر', x.challenges) +
        block('التوصيات والقرارات المطلوبة', x.recommendations);
      if (x.status === 'لدى المدير التنفيذي' && (me.exec || me.admin)) A.push(['ack', 'تم الاطلاع']);
    }
    const bg = modal(
      `<bdi dir="ltr">${esc(x.serial)}</bdi> ${esc(x.title || x.kind || x.type || x.period || '')} ${chip(x.status)}`,
      `${vs.html}
        <div class="field" style="margin-top:10px"><label>ملاحظة / تعليق</label><textarea class="in" id="spNote" rows="2"></textarea></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">${A.map(([a, l]) => `<button type="button" class="btn ${a === 'reject' ? 'bad' : 'primary'}" data-spa="${a}">${l}</button>`).join('')}<button type="button" class="btn" data-spa="comment">💬 تعليق</button>${k === 'periodic' || k === 'reports' ? `<button type="button" class="btn" id="spPrint">${icon('printer')} طباعة / PDF</button>` : ''}<button type="button" class="btn ghost" data-x>إغلاق</button></div>${logH}`,
      860,
    );
    openItemPart(bg, err, k, reload, x);
    if ($('#spPrint', bg))
      $('#spPrint', bg).onclick = () => {
        const w = window.open('', '_blank');
        if (!w) return toast('اسمح بالنوافذ المنبثقة للطباعة', true);
        w.document
          .write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(x.serial)}</title><link rel="stylesheet" href="${location.origin}/css/style.css"><style>@page{size:A4;margin:14mm} body{background:#fff;font-family:Tajawal,'Segoe UI',Tahoma,sans-serif;padding:0;margin:0} .hd{display:flex;gap:12px;align-items:center;border-bottom:3px solid #9b1c1c;padding-bottom:10px;margin-bottom:12px} .hd img{width:56px} .hd h1{margin:0;font-size:21px}</style></head><body>
          <div class="hd"><img src="${location.origin}/logo.png" alt=""><div><h1>${k === 'periodic' ? `تقرير إدارة الفروع ${esc(x.period)} — ${esc(x.label || '')}` : `تقرير ${esc(x.kind)} — ${esc(x.level === 'branch' ? `فرع ${x.branch}` : x.regionName)}`}</h1><div style="color:#64748b">${esc(x.serial)} — ${esc(dt(x.at))}</div></div></div>${vs.html}
          <script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script></body></html>`);
        w.document.close();
      };
  }
  /* جزء من openItem: $$('[data-spa]', bg).forEach((b) => {… */
  function openItemPart(bg, err, k, reload, x) {
    $$('[data-spa]', bg).forEach((b) => {
      b.onclick = async () => {
        try {
          await api('PUT', `/api/supervision/${k}/${x.id}`, { action: b.dataset.spa, note: $('#spNote', bg).value });
          bg.remove();
          toast('تم');
          reload();
        } catch (e) {
          err(bg, e.message);
        }
      };
    });
  }

  return { viewSupervision };
};
