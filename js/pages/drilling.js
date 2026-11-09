'use strict';
/* صفحة «drilling» (viewDrillProject، viewDrillProjects، viewDrilling) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['drilling'] = function (S) {
  const {
    $,
    $$,
    RIG_FIELDS,
    SF,
    api,
    askYesNo,
    can,
    collect,
    daysBadge,
    downloadXlsx,
    dt,
    esc,
    fieldHtml,
    fmtNum,
    formModal,
    gridImportModal,
    head,
    icon,
    printDocs,
    rigCard,
    route,
    shell,
    state,
    tableRowHtml,
    toast,
    today,
  } = S;
  /* ---------- قسم الحفر: مشاريع تحت التنفيذ ---------- */
  function drillProjectModal(p, res, done) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const sel = new Set((p || {}).rigs || []);
    const F = [
      { key: 'name', label: 'اسم المشروع', required: true },
      {
        key: 'projType',
        label: 'نوع المشروع',
        type: 'select',
        options: ['خاص بقسم الحفر', 'مشترك'],
        required: true,
        hint: 'المشترك: مع الفروع أو المكتب الفني أو غيرها',
      },
      { key: 'client', label: 'العميل / الجهة المالكة' },
      { key: 'contractNo', label: 'رقم العقد / أمر العمل' },
      { key: 'branch', label: 'الفرع المنفذ', type: 'select', options: res.branches },
      { key: 'location', label: 'موقع المشروع', hint: 'المدينة / الحي / رابط الموقع' },
      { key: 'supervisor', label: 'مشرف المشروع' },
      { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
      { key: 'endDate', label: 'تاريخ الانتهاء المتوقع', type: 'date' },
      { key: 'status', label: 'الحالة', type: 'select', options: res.statuses.filter((s) => s !== 'منتهي') },
      { key: 'planned', label: 'عدد الجسات المخططة', type: 'number' },
      { key: 'plannedM', label: 'إجمالي الأعماق المخططة (متر)', type: 'number' },
      ...(((p || {}).holes || []).length
        ? []
        : [
            {
              key: 'done',
              label: 'الجسات المنفذة (قبل التسجيل في النظام)',
              type: 'number',
              hint: 'يحسبها النظام تلقائياً بعد تسجيل الجسات',
            },
            { key: 'doneM', label: 'الأعماق المنفذة (متر)', type: 'number' },
          ]),
    ];
    renderDrillProjectModal(F, bg, p, res, sel);
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    /* قائمة الحسابات لاختيار حساب المشرف */
    api('GET', '/api/contacts')
      .then((us) => {
        const sl = $('#dpSup', bg);
        if (!sl) return;
        sl.insertAdjacentHTML(
          'beforeend',
          us
            .map(
              (u) =>
                `<option value="${esc(u.id)}"${u.id === (p || {}).supervisorId ? ' selected' : ''}>${esc(u.name)}${u.title ? ` — ${esc(u.title)}` : ''}${u.branch ? ` (${esc(u.branch)})` : ''}</option>`,
            )
            .join(''),
        );
      })
      .catch(() => {});
    const pt = $('[data-key="projType"]', bg),
      syncPt = () => {
        $('#dpPartners', bg).style.display = pt.value === 'مشترك' ? '' : 'none';
      };
    if (!pt.value) pt.value = 'خاص بقسم الحفر';
    pt.addEventListener('change', syncPt);
    syncPt();
    $('#dpf', bg).onsubmit = async (e) => {
      e.preventDefault();
      const body = {
        ...collect({ fields: [...F, { key: 'notes', type: 'textarea' }] }, $('#dpf', bg)),
        rigs: $$('.dp-rigs input:checked:not([data-partner])', bg).map((i) => i.value),
        partners: $$('[data-partner]:checked', bg).map((i) => i.value),
        supervisorId: $('#dpSup', bg) ? $('#dpSup', bg).value : '',
      };
      try {
        const r = await api(p && p.id ? 'PUT' : 'POST', p && p.id ? `/api/drilling/projects/${p.id}` : '/api/drilling/projects', body);
        bg.remove();
        toast('تم حفظ المشروع');
        done(r);
      } catch (err) {
        $('#dpErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* محتوى drillProjectModal (HTML) */
  function renderDrillProjectModal(F, bg, p, res, sel) {
    bg.innerHTML = `<div class="modal" style="max-width:900px;width:96%"><h3 style="margin-top:0">${p && p.id ? '✏️ تعديل مشروع' : '➕ مشروع حفر جديد'}</h3><form id="dpf" novalidate>
      <div class="grid2" style="grid-template-columns:repeat(3,1fr)">${F.map((f) => fieldHtml(f, (p || {})[f.key] || (f.key === 'status' ? 'تحت التنفيذ' : ''))).join('')}</div>
      <div class="field"><label>الحفارات العاملة على المشروع</label><div class="dp-rigs">${res.rigs.map((r) => `<label class="dp-rig"><input type="checkbox" value="${esc(r.code)}"${sel.has(r.code) ? ' checked' : ''}><b>${esc(r.code)}</b><small>${esc([r.plate, r.branch, r.status].filter(Boolean).join(' — '))}</small></label>`).join('') || '<span class="muted">لا توجد حفارات في الأسطول</span>'}</div></div>
      <div class="field" id="dpPartners"><label>الجهات المشاركة في المشروع المشترك</label><div class="dp-rigs">${(res.branches || [])
        .filter((b) => b !== 'قسم الحفر')
        .map(
          (b) =>
            `<label class="dp-rig"><input type="checkbox" data-partner value="${esc(b)}"${((p || {}).partners || []).includes(b) ? ' checked' : ''}><b>${esc(b)}</b></label>`,
        )
        .join('')}</div></div>
      <div class="field"><label>حساب المشرف على النظام (لرفع التحديثات من تطبيق الموبايل)</label><select class="in" id="dpSup"><option value="">— بالاسم المكتوب في «مشرف المشروع» —</option></select><div class="hint">يظهر المشروع للمشرف في التطبيق (العمليات ← قسم الحفر)، وتحديثاته تصل لمدير قسم الحفر</div></div>
      ${fieldHtml({ key: 'notes', label: 'ملاحظات', type: 'textarea' }, (p || {}).notes || '')}
      <div id="dpErr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form></div>`;
  }

  /* الحفارات العاملة في الموقع وطاقمها: رقم الحفارة (من الأسطول أو يُكتب)، والمشغّل، والعامل */
  function drillCrewModal(id, crew, fleet, done, fleetCrew) {
    const row = (c = {}) =>
      `<div class="dc-row"><input class="in" data-c="rig" list="dl-rigs" placeholder="رقم الحفارة" value="${esc(c.rig || '')}"><input class="in" data-c="operator" placeholder="مشغّل الحفارة" value="${esc(c.operator || '')}"><input class="in" data-c="helper" placeholder="العامل (أو أكثر مفصولين بفاصلة)" value="${esc(c.helper || '')}"><button type="button" class="btn sm ghost" data-rm title="حذف">✕</button></div>`;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:860px;width:96%"><h3 style="margin-top:0">${icon('truck')} الحفارات العاملة في الموقع وطاقمها</h3>
      <datalist id="dl-rigs">${fleet.map((r) => `<option value="${esc(r)}">`).join('')}</datalist>
      <div class="dc-head"><span>رقم الحفارة</span><span>مشغّل الحفارة</span><span>العامل</span><span></span></div><div id="dcRows">${(crew.length ? crew : [{}]).map(row).join('')}</div>
      <button type="button" class="btn sm" id="dcAdd">+ إضافة حفارة</button><div class="hint" style="margin-top:6px">اختر رقم الحفارة من الأسطول أو اكتبه. يسجّل النظام التغيير في سجل تحديثات المشروع.</div>
      <div id="dcErr"></div><div class="row" style="margin-top:12px;gap:8px"><button type="button" class="btn primary" id="dcSave">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#dcAdd', bg).onclick = () => $('#dcRows', bg).insertAdjacentHTML('beforeend', row());
    $('#dcRows', bg).onclick = (e) => {
      if (e.target.closest('[data-rm]')) e.target.closest('.dc-row').remove();
    };
    $('#dcRows', bg).addEventListener('change', (e) => {
      if (e.target.dataset.c !== 'rig') return;
      const rg = (fleetCrew || []).find((x) => x.code === e.target.value.trim());
      if (!rg) return;
      const row = e.target.closest('.dc-row');
      ['operator', 'helper'].forEach((k) => {
        const i = $(`[data-c="${k}"]`, row);
        if (!i.value && rg[k]) i.value = rg[k];
      });
    });
    $('#dcSave', bg).onclick = async () => {
      const rows = $$('.dc-row', bg)
        .map((r) => Object.fromEntries($$('[data-c]', r).map((i) => [i.dataset.c, i.value.trim()])))
        .filter((r) => r.rig);
      try {
        await api('PUT', `/api/drilling/projects/${id}/crew`, { rows });
        bg.remove();
        toast('تم حفظ الحفارات والطاقم');
        done();
      } catch (err) {
        $('#dcErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  /* صفحة متابعة مشروع حفر: سجل الجسات المنفذة وأعماقها، وسجل التحديثات، والإقفال */
  async function viewDrillProject(id) {
    /* حالة الصفحة: ما يتغير بعد العرض (months، sel) */
    const pageState = {};
    const p = await api('GET', `/api/drilling/projects/${id}`);
    const main = shell(
      '<div class="empty">جاري التحميل...</div>',
      can('drilling') ? '#/drilling-projects' : '#/drilling-projects?type=shared',
    );
    const closed = p.status === 'منتهي',
      ed = p.editor && !closed;
    const holes = (p.holes || [])
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.no).localeCompare(String(b.no), 'ar', { numeric: true }));
    const sumM = Math.round(holes.reduce((a, h) => a + (Number(h.depth) || 0), 0) * 100) / 100;
    const doneN = holes.length || Number(p.done) || 0,
      doneM = holes.length ? sumM : Number(p.doneM) || 0;
    const pct = Number(p.planned) ? Math.min(100, Math.round((doneN / Number(p.planned)) * 100)) : null;
    const pctM = Number(p.plannedM) ? Math.min(100, Math.round((doneM / Number(p.plannedM)) * 100)) : null;
    const crew = p.crew || [];
    /* الحفارات للاختيار في الجسة: حفارات الموقع، وإلا حفارات المشروع، وإلا كل الأسطول */
    const rigs = crew.length ? [...new Set(crew.map((c) => c.rig))] : drillProjectValue2(p);
    const siteRigs = crew.length ? rigs : p.rigs || [];
    /* رقم الجسة التالية: آخر رقم + 1 بنفس البادئة (BH-01) */
    const nextNo = (...args) => drillProjectNextNo(holes, ...args);
    const tile = (l, v, ic, c) =>
      `<div class="emp-stat"><div><div class="s-v">${v}</div><div class="s-l">${l}</div></div><span class="b-ic" style="--m:${c}">${icon(ic)}</span></div>`;
    const left = p.endDate ? SF.daysBetween(today(), p.endDate) : null;
    main.innerHTML = `${drillProjectHtml(closed, ed, p)}
      <div class="dp-type" style="margin-bottom:10px"><span class="chip ${p.projType === 'مشترك' ? 'pending' : 'approved'}">${esc(p.projType || 'خاص بقسم الحفر')}</span>${drillProjectHtml2(p)}</div>
      ${drillProjectValue3(closed, p)}
      <div class="emp-stats">
        ${tile('الجسات المنفذة', `${doneN}${p.planned ? ` <small>من ${esc(p.planned)}</small>` : ''}`, 'pickaxe', '#0e9f9a')}
        ${tile('الأعماق المنفذة (متر)', `${fmtNum(doneM)}${p.plannedM ? ` <small>من ${esc(fmtNum(p.plannedM))}</small>` : ''}`, 'chart', '#3b9fd6')}
        ${tile('متوسط عمق الجسة (متر)', holes.length ? fmtNum(Math.round((sumM / holes.length) * 100) / 100) : '—', 'layers', '#7c5cd6')}
        ${tile('نسبة الإنجاز', drillProjectValue4(pct, pctM), 'checkCircle', '#16a34a')}
        ${drillProjectValue(closed, left, p, tile)}
        ${tile('الحفارات العاملة في الموقع', `${siteRigs.length}`, 'truck', '#1f3a5f')}
      </div>
      <div class="card" style="margin-bottom:14px"><div class="dp-bar" style="height:14px"><i style="width:${drillProjectValue5(pct, pctM)}%"></i></div></div>
      <div class="card" style="margin-bottom:14px"><div class="emp-sec-h"><h3>الحفارات العاملة في الموقع وطاقمها</h3>${ed ? '<button class="btn sm" id="dcEd">✏️ تعديل الحفارات والطاقم</button>' : ''}</div>
        ${drillProjectHtml3(crew, ed, holes)}</div>
      <div class="card" id="dpExp" style="margin-bottom:14px"></div>
      <div class="dp-layout">
        <div class="card"><div class="emp-sec-h"><h3>سجل الجسات المنفذة (${holes.length})</h3></div>
          ${
            ed
              ? `<form class="dh-add" id="dhF" novalidate>
            <div class="field"><label>رقم الجسة</label><input class="in" data-k="no" value="${esc(nextNo())}"></div>
            <div class="field"><label>العمق (متر) <span class="req">*</span></label><input class="in" type="number" step="0.01" min="0" data-k="depth"></div>
            <div class="field"><label>تاريخ التنفيذ</label><input class="in" type="date" data-k="date" value="${today()}"></div>
            <div class="field"><label>الحفارة</label><select class="in" data-k="rig"><option value="">—</option>${rigs.map((r) => `<option>${esc(r)}</option>`).join('')}</select></div>
            <div class="field"><label>مشغّل الحفارة</label><input class="in" data-k="operator"></div>
            <div class="field"><label>العامل</label><input class="in" data-k="helper"></div>
            <div class="field"><label>منسوب المياه (م)</label><input class="in" data-k="water" placeholder="اختياري"></div>
            <div class="field" style="grid-column:span 2"><label>ملاحظات</label><input class="in" data-k="note" placeholder="نوع التربة، الصخر، أي ملاحظة"></div>
            <button class="btn primary">➕ إضافة الجسة</button></form><div id="dhErr"></div>`
              : ''
          }
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>رقم الجسة</th><th>التاريخ</th><th>العمق (م)</th><th>الحفارة</th><th>المشغّل</th><th>العامل</th><th>منسوب المياه</th><th>ملاحظات</th>${ed ? '<th></th>' : ''}</tr></thead><tbody>
            ${drillProjectHtml5(ed, holes)}
            ${holes.length ? `<tr class="dh-total"><td colspan="3">الإجمالي</td><td>${esc(fmtNum(sumM))}</td><td colspan="${ed ? 6 : 5}">${holes.length} جسة</td></tr>` : ''}</tbody></table></div></div>
        <div class="card"><div class="emp-sec-h"><h3>سجل التحديثات</h3></div>
          ${ed ? `<textarea class="in" id="duT" rows="3" placeholder="تحديث اليوم: ما تم تنفيذه، المعوقات، الخطوة القادمة..."></textarea><button class="btn primary" id="duAdd" style="margin-top:8px">${icon('send')} إضافة تحديث</button>` : ''}
          <ul class="timeline" style="margin-top:12px">${drillProjectHtml4(p)}</ul></div>
      </div>`;
    return viewDrillProjectPart6(crew, ed, holes, id, main, p, pageState, rigs, sumM);
  }
  /* جزء من viewDrillProject: holes.map((h, i) => `<tr><td>${i + 1}</td><td><b>${esc(h.no)… */
  function drillProjectHtml5(ed, holes) {
    return (
      holes
        .map(
          (h, i) =>
            `<tr><td>${i + 1}</td><td><b>${esc(h.no)}</b></td><td>${esc(SF.fmtDate(h.date))}</td><td><b>${esc(fmtNum(h.depth))}</b></td><td>${esc(h.rig || '—')}</td><td>${esc(h.operator || '—')}</td><td>${esc(h.helper || '—')}</td><td>${esc(h.water || '—')}</td><td>${esc(h.note || '')}</td>${ed ? `<td style="white-space:nowrap"><button class="btn sm ghost" data-hed="${h.id}" title="تعديل">✏️</button><button class="btn sm ghost" data-hdel="${h.id}" title="حذف">🗑️</button></td>` : ''}</tr>`,
        )
        .join('') || `<tr><td colspan="${ed ? 10 : 9}" class="muted" style="text-align:center;padding:20px">لم تسجّل جسات بعد</td></tr>`
    );
  }
  /* جزء من viewDrillProject: pct ?? pctM ?? 0… */
  function drillProjectValue5(pct, pctM) {
    return pct ?? pctM ?? 0;
  }
  /* جزء من viewDrillProject: pct !== null ? `${pct}%` : pctM !== null ? `${pctM}%` : '—'… */
  function drillProjectValue4(pct, pctM) {
    return pct !== null ? `${pct}%` : pctM !== null ? `${pctM}%` : '—';
  }
  /* جزء من viewDrillProject: (p.updates || [])… */
  function drillProjectHtml4(p) {
    return (
      (p.updates || [])
        .slice()
        .reverse()
        .map(
          (u) =>
            `<li class="${u.auto ? 'auto' : 'approve'}"><b>${esc(u.text)}</b>${(u.photos || []).length ? `<div class="du-ph">${u.photos.map((n) => `<a href="/api/drilling/projects/${p.id}/photo/${esc(n)}" target="_blank" rel="noopener"><img src="/api/drilling/projects/${p.id}/photo/${esc(n)}" alt="" loading="lazy"></a>`).join('')}</div>` : ''}<div class="when">${u.src === 'app' ? '📱 ' : ''}${esc(u.by)} — ${esc(dt(u.at))}</div></li>`,
        )
        .join('') || '<li class="muted">لا توجد تحديثات</li>'
    );
  }
  /* جزء من viewDrillProject: crew.length… */
  function drillProjectHtml3(crew, ed, holes) {
    return crew.length
      ? `<div class="dc-grid">${crew
          .map((c) => {
            const hs = holes.filter((h) => h.rig === c.rig);
            return `<div class="dc-card"><span class="dc-ic">${icon('truck')}</span><div><b>حفارة ${esc(c.rig)}</b><small>${icon('user')} المشغّل: <b>${esc(c.operator || '—')}</b></small><small>${icon('users')} العامل: <b>${esc(c.helper || '—')}</b></small><small class="muted">${hs.length} جسة — ${esc(fmtNum(Math.round(hs.reduce((a, h) => a + (Number(h.depth) || 0), 0) * 100) / 100))} م</small></div></div>`;
          })
          .join('')}</div>`
      : `<div class="muted">لم تسجّل حفارات الموقع وطاقمها بعد${ed ? ' — اضغط "تعديل الحفارات والطاقم"' : ''}</div>`;
  }
  /* جزء من viewDrillProject: closed ? `<div class="dp-closed">🔒 <b>المشروع مقفل</b> بتار… */
  function drillProjectValue3(closed, p) {
    return closed
      ? `<div class="dp-closed">🔒 <b>المشروع مقفل</b> بتاريخ ${esc(SF.fmtDate(p.closedAt) || '')}${p.closeNote ? ` — ${esc(p.closeNote)}` : ''}</div>`
      : '';
  }
  /* جزء من viewDrillProject: p.projType === 'مشترك' && (p.partners || []).length ? ` <spa… */
  function drillProjectHtml2(p) {
    return p.projType === 'مشترك' && (p.partners || []).length
      ? ` <span class="muted">مشروع مشترك مع: <b>${esc(p.partners.join('، '))}</b></span>`
      : '';
  }
  /* جزء من viewDrillProject: head(esc(p.name), `${esc([p.client, p.branch, p.location].fi… */
  function drillProjectHtml(closed, ed, p) {
    return head(
      esc(p.name),
      `${esc([p.client, p.branch, p.location].filter(Boolean).join(' — '))}`,
      `<a class="btn ghost" href="#/drilling-projects?type=${p.projType === 'مشترك' ? 'shared' : 'own'}">رجوع للمشاريع</a><button class="btn" id="dhXls">📊 Excel الجسات</button>${ed ? '<button class="btn" id="dpEd">✏️ بيانات المشروع</button><button class="btn bad" id="dpClose">🔒 إقفال المشروع</button>' : ''}${p.editor && closed ? '<button class="btn" id="dpReopen">↺ إعادة فتح المشروع</button>' : ''}`,
    );
  }
  /* أجزاء صفحات قسم الحفر (1) (drilling-kit.js) */
  const { viewDrillProjects, viewDrilling, drillProjectValue2, viewDrillProjectPart5 } = window.SES_PAGE_KITS['drilling'](S, {
    drillCrewModal,
    drillProjectModal,
  });

  /* جزء من viewDrillProject: tile(closed ? 'الحالة' : 'الانتهاء المتوقع', closed ? 'منتهي… */
  function drillProjectValue(closed, left, p, tile) {
    return tile(
      closed ? 'الحالة' : 'الانتهاء المتوقع',
      closed
        ? 'منتهي'
        : `${esc(SF.fmtDate(p.endDate) || '—')}${left !== null ? ` <small>${left < 0 ? `متأخر ${-left} يوم` : `باقٍ ${left} يوم`}</small>` : ''}`,
      'calendar',
      left !== null && left < 0 && !closed ? '#dc2626' : '#f59e0b',
    );
  }
  /* nextNo من viewDrillProject (يأخذ holes من الصفحة) */
  function drillProjectNextNo(holes) {
    const last = holes
      .map((h) => h.no)
      .filter((n) => /\d+$/.test(n))
      .sort((a, b) => Number(a.match(/\d+$/)[0]) - Number(b.match(/\d+$/)[0]))
      .pop();
    if (!last) return 'BH-01';
    const m = last.match(/^(.*?)(\d+)$/);
    return `${m[1]}${String(Number(m[2]) + 1).padStart(m[2].length, '0')}`;
  }
  /* جزء من viewDrillProject: const reload = () => viewDrillProject(id);… */
  function viewDrillProjectPart6(crew, ed, holes, id, main, p, pageState, rigs, sumM) {
    const reload = () => viewDrillProject(id);
    /* مصروفات المشروع: جداول بنودها وإجمالي كل بند وإجمالي المشروع */
    const EXP = [
      [
        'housing',
        'سكن العاملين',
        [
          { key: 'date', label: 'التاريخ', type: 'date' },
          { key: 'place', label: 'مكان السكن' },
          { key: 'people', label: 'مين في السكن' },
          { key: 'monthly', label: 'تكلفة الشهر', type: 'number' },
        ],
        (r) => (Number(r.monthly) || 0) * (Number(r.months) || 1),
      ],
      [
        'water',
        'مياه الشغل (الوايت)',
        [
          { key: 'date', label: 'التاريخ', type: 'date' },
          { key: 'from', label: 'من تاريخ', type: 'date' },
          { key: 'to', label: 'إلى تاريخ', type: 'date' },
          { key: 'truckCost', label: 'تكلفة الوايت', type: 'number' },
          { key: 'count', label: 'عدد الوايتات', type: 'number' },
        ],
        (r) => (Number(r.truckCost) || 0) * (Number(r.count) || 0),
      ],
      [
        'guards',
        'الغفرة والحراسة',
        [
          { key: 'date', label: 'التاريخ', type: 'date' },
          { key: 'name', label: 'الغفير / جهة الحراسة' },
          { key: 'monthly', label: 'تكلفة الشهر', type: 'number' },
        ],
        (r) => (Number(r.monthly) || 0) * (Number(r.months) || 1),
      ],
      [
        'transport',
        'النقل وإيجار السيارات',
        [
          { key: 'desc', label: 'البيان' },
          { key: 'date', label: 'التاريخ', type: 'date' },
          { key: 'amount', label: 'المبلغ', type: 'number' },
        ],
        (r) => Number(r.amount) || 0,
      ],
      [
        'other',
        'بنود مصروفات أخرى',
        [
          { key: 'item', label: 'البند' },
          { key: 'date', label: 'التاريخ', type: 'date' },
          { key: 'amount', label: 'المبلغ', type: 'number' },
        ],
        (r) => Number(r.amount) || 0,
      ],
    ];
    return viewDrillProjectPart5(EXP, crew, ed, holes, id, main, p, pageState, reload, rigs, sumM);
  }

  return { viewDrillProject, viewDrillProjects, viewDrilling };
};
