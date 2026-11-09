'use strict';
/* صفحة «governance» (viewGovernance) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['governance'] = function (S) {
  const {
    $,
    $$,
    ACCEPT,
    SF,
    TABS,
    api,
    askYesNo,
    chip,
    dt,
    empEmpty,
    esc,
    fieldHtml,
    fmtNum,
    head,
    icon,
    setCrumb,
    shell,
    toast,
    uploadFile,
  } = S;
  /* ---------- الحوكمة والامتثال: لوحة + سجل المخاطر + تفويض الصلاحيات + التدقيق الداخلي + السياسات + تعارض المصالح + البلاغات ---------- */
  async function viewGovernance(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (d، body) */
    const vs = {};
    const GV = SF.GOV;
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/governance');
    vs.d = undefined;
    try {
      vs.d = await api('GET', '/api/governance');
    } catch (err) {
      main.innerHTML = `<div class="card err">${esc(err.message)}</div>`;
      return;
    }
    const M = vs.d.me.manage,
      st = vs.d.stats;
    const TABS = [
      ['dash', 'لوحة الحوكمة', 'gauge'],
      ...(M || vs.d.risks.length ? [['risks', 'سجل المخاطر', 'alert', st.risksHigh]] : []),
      ...(vs.d.me.employee ? [] : [['doa', 'تفويض الصلاحيات', 'key']]),
      ...(M ? [['audits', 'التدقيق الداخلي', 'scanEye']] : []),
      ...(M || vs.d.findings.length ? [['findings', 'ملاحظات التدقيق', 'listChecks', st.findingsOverdue]] : []),
      ['policies', 'السياسات والإجراءات', 'bookOpen', st.myPendingAcks],
      ['coi', 'تعارض المصالح', 'scale', vs.d.myCoi ? 0 : 1],
      ['reports', 'قناة البلاغات', 'lock', st.reportsOpen],
    ];
    const tab = TABS.some(([k]) => k === query.tab) ? query.tab : 'dash';
    if (tab !== 'dash') setCrumb([[TABS.find(([k]) => k === tab)[1], `#/governance?tab=${tab}`]]);
    const CL = {
      مفتوح: 'pending',
      مفتوحة: 'pending',
      'قيد المعالجة': 'pending',
      جديد: 'pending',
      'قيد التحقيق': 'pending',
      مخطط: '',
      جاري: 'pending',
      مكتمل: 'approved',
      سارية: 'approved',
      مغلق: 'cancelled',
      مغلقة: 'cancelled',
      ملغاة: 'cancelled',
      ملغي: 'cancelled',
    };
    const SEVC = { منخفضة: '#16a34a', متوسطة: '#d97706', عالية: '#dc2626', حرجة: '#7f1d1d', ...GV.LEVEL_C };
    const chip = (t) => `<span class="chip ${CL[t] || ''}">${esc(t || '')}</span>`;
    const sev = (t) => (t ? `<span class="hse-sev" style="--c:${SEVC[t] || '#64748b'}">${esc(t)}</span>` : '');
    viewGovernancePart5(GV, M, TABS, chip, main, sev, st, tab, vs);
    const reload = () => viewGovernance(query);
    viewGovernancePart4(chip, gvModal, main, query, reload, tab, vs);
    /* نافذة السجل: إضافة / تعديل (فريق الحوكمة)، أو عرض ورد المالك */
    function gvModal(...args) {
      return governanceGvModal(GV, M, chip, gvModal, query, reload, sev, vs, ...args);
    }
  }
  /* gvModal من viewGovernance (يأخذ GV، M، chip، gvModal، query، reload، sev، vs من الصفحة) */
  function governanceGvModal(GV, M, chip, gvModal, query, reload, sev, vs, k, x) {
    const FS = GV.fields[k];
    const isOwner = x && (k === 'risks' || k === 'findings') && x.owner === vs.d.me.id;
    const fieldOf = (...args) => governanceGvModalFieldOf(vs, ...args);
    const sel = (f, v) =>
      `<div class="field${f.type === 'textarea' ? ' full' : ''}"><label>${esc(f.label)}${f.required ? '<span class="req">*</span>' : ''}</label><select class="in" data-key="${f.key}"><option value="">— اختر —</option>${f.options.map((o, i) => `<option value="${esc(o)}"${o === v ? ' selected' : ''}>${esc(f.labels ? f.labels[i] : o)}</option>`).join('')}</select>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
    const fld = (f) => {
      const ff = fieldOf(f),
        v = x ? x[f.key] || '' : f.key === 'status' ? '' : f.key === 'auditId' ? query.audit || '' : f.key === 'mustAck' ? 'نعم' : '';
      return `<div style="${f.type === 'textarea' ? 'grid-column:1/-1' : ''}">${ff.labels ? sel(ff, v) : fieldHtml(ff, v)}</div>`;
    };
    const view = (...args) => gvModalView(x, ...args);
    const pol = k === 'policies' && x;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:920px;width:96%"><h3 style="margin-top:0">${x ? `${esc(GV.ONE[k])} <bdi dir="ltr">${esc(x.serial)}</bdi> ${chip(x.status)}${x.level ? ` ${sev(x.level)}` : ''}` : `${icon('plus')} ${esc(GV.ONE[k])} جديد`}</h3>
        ${
          pol
            ? `<div class="gv-pol"><div class="muted">${esc(x.category)} — الإصدار ${esc(x.version)} — يسري من ${esc(SF.fmtDate(x.effective))}${x.owner ? ` — ${esc(x.owner)}` : ''}</div><div class="gv-body">${esc(x.body)}</div>
          ${(x.files || []).length ? `<ul class="files">${x.files.map((f) => `<li><a href="/api/governance/policies/${x.id}/files/${f.id}" target="_blank">📎 ${esc(f.name)}</a></li>`).join('')}</ul>` : ''}
          ${x.mustAck === 'نعم' && x.status !== 'ملغاة' ? (x.myAck ? `<div class="emp-al ok">✔ أقررت بالاطلاع في ${esc(dt(x.myAck))}</div>` : '<label class="check gv-ack"><input type="checkbox" id="gvAck"> أقرّ بأنني اطلعت على هذه السياسة وفهمتها وألتزم بها</label><button type="button" class="btn primary" id="gvAckB" disabled>✔ إقرار بالاطلاع</button>') : ''}
          ${M && x.mustAck === 'نعم' ? `<div style="margin-top:8px"><b>${x.ackCount} / ${x.audCount}</b> أقرّوا — <a href="javascript:void 0" id="gvPend">من لم يقر؟</a><div id="gvPendL" class="muted"></div></div>` : ''}</div>`
            : ''
        }
        ${governanceGvModalHtml(FS, GV, M, fld, isOwner, k, pol, view, x)}
        ${
          x
            ? `<h4 class="b-sec">السجل</h4><ul class="timeline">${(x.log || [])
                .slice()
                .reverse()
                .map(
                  (h) =>
                    `<li><b>${esc(h.action)}</b><div class="when">${esc(h.by)} — ${esc(dt(h.at))}</div>${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}</li>`,
                )
                .join('')}</ul>`
            : ''
        }</div>`;
    return gvModalPart(FS, GV, bg, gvModal, k, query, reload, x);
  }
  /* جزء من governanceGvModal: M… */
  function governanceGvModalHtml(FS, GV, M, fld, isOwner, k, pol, view, x) {
    return M
      ? `<form id="gvF" novalidate>${pol ? '<h4 class="b-sec">تعديل السياسة</h4>' : ''}<div class="grid2" style="grid-template-columns:repeat(3,1fr)">${FS.map(fld).join('')}</div>
            ${x ? '<div class="field"><label>ملاحظة على التعديل</label><input class="in" id="gvNote"></div>' : ''}
            ${k === 'policies' ? `<div class="field"><label>ملف السياسة (PDF)</label><input type="file" class="in" id="gvFile" accept="${ACCEPT}"></div>` : ''}
            ${k === 'audits' && x ? `<div class="row" style="margin:6px 0"><a class="btn sm" href="#/governance?tab=findings&audit=${x.id}">ملاحظات هذه المهمة</a><button type="button" class="btn sm" data-addf>${icon('plus')} ملاحظة على هذه المهمة</button></div>` : ''}
            <div class="gverr"></div><div class="row" style="gap:8px;margin-top:10px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إغلاق</button>${x ? '<button type="button" class="btn bad ghost" id="gvDel" style="margin-inline-start:auto">🗑️ حذف</button>' : ''}</div></form>`
      : `${pol ? '' : `<div class="emp-fields">${FS.map(view).join('')}</div>`}
            ${x && x.response ? `<h4 class="b-sec">رد المسؤول</h4><p style="white-space:pre-wrap">${esc(x.response)}</p>` : ''}
            ${
              isOwner && !GV.CLOSED.includes(x.status)
                ? `<form id="gvOw"><h4 class="b-sec">ردك</h4>${k === 'risks' ? `<div class="field"><label>خطة المعالجة</label><textarea class="in" name="plan" rows="3">${esc(x.plan || '')}</textarea></div>` : ''}<div class="field"><label>الرد / الإجراء المتخذ</label><textarea class="in" name="response" rows="3"></textarea></div>
              <label class="check"><input type="checkbox" name="inprog" checked> الحالة: قيد المعالجة</label><div class="gverr"></div><div class="row" style="gap:8px;margin-top:10px"><button class="btn primary">📤 إرسال الرد</button><button type="button" class="btn ghost" data-x>إغلاق</button></div></form>`
                : '<div class="row" style="margin-top:10px"><button type="button" class="btn ghost" data-x>إغلاق</button></div>'
            }`;
  }
  /* fieldOf من governanceGvModal (يأخذ vs من الصفحة) */
  function governanceGvModalFieldOf(vs, f) {
    return f.type === 'branch'
      ? { ...f, type: 'select', options: ['', ...vs.d.branches] }
      : f.type === 'user'
        ? {
            ...f,
            type: 'select',
            options: vs.d.users.map((u) => u.id),
            labels: vs.d.users.map((u) => `${u.name}${u.title ? ` — ${u.title}` : ''}`),
          }
        : f.type === 'audit'
          ? { ...f, type: 'select', options: vs.d.audits.map((a) => a.id), labels: vs.d.audits.map((a) => `${a.serial} — ${a.title}`) }
          : f;
  }
  /* جزء من viewGovernance: const stat = (l, v, ic, c, cls = '') =>… */
  function viewGovernancePart5(GV, M, TABS, chip, main, sev, st, tab, vs) {
    const stat = (l, v, ic, c, cls = '') =>
      `<div class="emp-stat ${cls}"><div><div class="s-v">${v}</div><div class="s-l">${l}</div></div><span class="b-ic" style="--m:${c}">${icon(ic)}</span></div>`;
    const tabsBar = `<div class="tabs" style="margin-bottom:14px">${TABS.map(([k, l, ic, n]) => `<a href="#/governance${k === 'dash' ? '' : `?tab=${k}`}" class="${k === tab ? 'on' : ''}">${icon(ic)} ${esc(l)}${n ? ` <span class="badge">${n}</span>` : ''}</a>`).join('')}</div>`;
    const tbl = (k, rows, cols) =>
      rows.length
        ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(([h]) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((x) => `<tr class="clickable" style="cursor:pointer" data-gopen="${k}:${x.id}">${cols.map(([, f]) => `<td>${f(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        : empEmpty('لا توجد سجلات');
    viewGovernancePart3(GV, M, chip, sev, st, stat, tab, tbl, vs);
    if (tab === 'coi') {
      const c = vs.d.myCoi || {};
      vs.body = `<div class="card"><h3 style="margin-top:0">${icon('scale')} إقرار تعارض المصالح ومدونة السلوك — ${vs.d.me.year}</h3>${c.at ? `<div class="emp-al ok">✔ قدّمت إقرار هذا العام في ${esc(dt(c.at))} — يمكنك تحديثه</div>` : ''}
        <form id="gvCoi"><p>أقرّ بأنني اطلعت على مدونة السلوك وسياسة تعارض المصالح، وألتزم بهما، وأفصح عن أي مصلحة شخصية أو عائلية أو مالية قد تتعارض مع مصلحة الشركة (مثل: ملكية أو شراكة في جهة موردة أو عميلة، أو قرابة مع موظف أعتمد طلباته، أو عمل خارجي).</p>
          <div class="field"><label>هل لديك تعارض مصالح فعلي أو محتمل؟</label><select class="in" name="hasConflict"><option${c.hasConflict === 'لا' ? ' selected' : ''}>لا</option><option${c.hasConflict === 'نعم' ? ' selected' : ''}>نعم</option></select></div>
          <div class="field" id="gvDet"><label>التفاصيل</label><textarea class="in" name="details" rows="4" placeholder="الجهة، طبيعة المصلحة، وما يرتبط بعملك">${esc(c.details || '')}</textarea></div>
          <label class="check"><input type="checkbox" name="codeAck"${c.codeAck ? ' checked' : ''}> أقرّ بالالتزام بمدونة السلوك وصحة ما ورد أعلاه</label>
          <div class="gverr"></div><button class="btn primary" style="margin-top:10px">💾 ${c.at ? 'تحديث الإقرار' : 'تقديم الإقرار'}</button></form></div>
        ${M ? `<div class="card"><h3 style="margin-top:0">${icon('users')} الإقرارات المقدمة — ${vs.d.me.year} (${vs.d.coiStats.submitted} من ${vs.d.coiStats.total})</h3>${vs.d.coi.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>المستخدم</th><th>التاريخ</th><th>تعارض؟</th><th>التفاصيل</th></tr></thead><tbody>${vs.d.coi.map((x) => `<tr><td><b>${esc(x.name)}</b></td><td class="num">${esc(dt(x.at))}</td><td>${x.hasConflict === 'نعم' ? '<span class="chip rejected">نعم</span>' : '<span class="chip approved">لا</span>'}</td><td>${esc(x.details || '')}</td></tr>`).join('')}</tbody></table></div>` : empEmpty('لا توجد إقرارات بعد')}</div>` : ''}`;
    }
    if (tab === 'reports')
      vs.body = `<div class="grid2" style="grid-template-columns:1fr 1fr;gap:12px;align-items:start"><div class="card"><h3 style="margin-top:0">${icon('lock')} تقديم بلاغ سري</h3>
        <div class="hint">للإبلاغ عن مخالفة مالية أو فساد أو تعارض مصالح أو مخالفة سلامة أو إساءة. البلاغ لا يطلع عليه إلا فريق الحوكمة، ويمكن تقديمه مجهولاً دون اسمك، وتحصل على رمز متابعة.</div>
        <form id="gvRep"><div class="field"><label>نوع البلاغ</label><select class="in" name="category">${['مخالفة مالية / احتيال', 'فساد أو رشوة', 'تعارض مصالح', 'مخالفة سلامة', 'تحرش أو إساءة', 'مخالفة الأنظمة والسياسات', 'أخرى'].map((x) => `<option>${x}</option>`).join('')}</select></div>
          <div class="field"><label>الفرع (اختياري)</label><select class="in" name="branch"><option value="">—</option>${vs.d.branches.map((b) => `<option>${esc(b)}</option>`).join('')}</select></div>
          <div class="field"><label>التفاصيل</label><textarea class="in" name="description" rows="5" placeholder="ماذا حدث، ومتى، وأين، ومن المعنيون، وأي أدلة"></textarea></div>
          <label class="check"><input type="checkbox" name="anonymous" checked> تقديم البلاغ مجهولاً (بدون اسمي)</label><div class="gverr"></div><button class="btn primary" style="margin-top:10px">🔒 إرسال البلاغ</button></form></div>
      <div class="card"><h3 style="margin-top:0">${icon('search')} متابعة بلاغ برمز المتابعة</h3><div class="row" style="gap:8px"><input class="in" id="gvTok" dir="ltr" placeholder="رمز المتابعة" style="flex:1"><button class="btn" id="gvTrack">متابعة</button></div><div id="gvTr" style="margin-top:10px"></div>
        ${!M && vs.d.reports.length ? `<h4 class="b-sec">بلاغاتي (غير المجهولة)</h4>${vs.d.reports.map((r) => `<div class="sp-li"><b dir="ltr">${esc(r.serial)}</b> ${esc(r.category)} ${chip(r.status)}</div>`).join('')}` : ''}</div></div>
      ${
        M
          ? `<div class="card"><h3 style="margin-top:0">${icon('lock')} البلاغات الواردة (${vs.d.reports.length})</h3>${tbl(
              'reports',
              vs.d.reports,
              [
                ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
                ['التاريخ', (x) => esc(dt(x.at))],
                ['النوع', (x) => esc(x.category)],
                ['الفرع', (x) => esc(x.branch || '—')],
                ['المُبلِّغ', (x) => esc(x.byName)],
                ['الحالة', (x) => chip(x.status)],
              ],
            )}</div>`
          : ''
      }`;
    main.innerHTML = `${head('الحوكمة والامتثال', 'المخاطر، تفويض الصلاحيات، التدقيق الداخلي، السياسات، تعارض المصالح، والبلاغات')}${tabsBar}${vs.body}`;
  }
  /* جزء من viewGovernance: main.addEventListener('click', (ev) => {… */
  function viewGovernancePart4(chip, gvModal, main, query, reload, tab, vs) {
    main.addEventListener('click', (ev) => {
      const n = ev.target.closest('[data-gnew]');
      if (n) return gvModal(n.dataset.gnew, null);
      const o = ev.target.closest('[data-gopen]');
      if (o) {
        const [k, id] = o.dataset.gopen.split(':');
        const x = (vs.d[k] || []).find((y) => y.id === id);
        if (x) k === 'reports' ? repModal(x) : gvModal(k, x);
      }
    });
    viewGovernancePart(chip, vs.d, gvModal, query, reload, repModal, tab);
    function repModal(x) {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal" style="max-width:760px;width:96%"><h3 style="margin-top:0">🔒 بلاغ <bdi dir="ltr">${esc(x.serial)}</bdi> ${chip(x.status)}</h3>
        <div class="emp-fields"><div class="emp-f"><small>النوع</small><b>${esc(x.category)}</b></div><div class="emp-f"><small>الفرع</small><b>${esc(x.branch || '—')}</b></div><div class="emp-f"><small>المُبلِّغ</small><b>${esc(x.byName)}</b></div><div class="emp-f"><small>التاريخ</small><b>${esc(dt(x.at))}</b></div></div>
        <h4 class="b-sec">التفاصيل</h4><p style="white-space:pre-wrap">${esc(x.description)}</p>
        <div class="field"><label>ملاحظة / رد</label><textarea class="in" id="gvN" rows="3"></textarea></div><label class="check"><input type="checkbox" id="gvPub"> الرد يظهر للمُبلِّغ (برمز المتابعة)</label>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn" data-gs="قيد التحقيق">قيد التحقيق</button><button class="btn primary" data-gs="مغلق">إغلاق البلاغ</button><button class="btn" data-gs="">💬 ملاحظة فقط</button><button class="btn ghost" data-x>إغلاق</button></div>
        <h4 class="b-sec">السجل</h4><ul class="timeline">${(x.log || [])
          .slice()
          .reverse()
          .map(
            (h) =>
              `<li><b>${esc(h.action)}</b>${h.public ? ' <span class="chip">ظاهر للمبلغ</span>' : ''}<div class="when">${esc(h.by)} — ${esc(dt(h.at))}</div>${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}</li>`,
          )
          .join('')}</ul><div class="gverr"></div></div>`;
      document.body.appendChild(bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      $$('[data-gs]', bg).forEach((b) => {
        b.onclick = async () => {
          try {
            await api('PUT', `/api/governance/reports/${x.id}`, {
              status: b.dataset.gs,
              note: $('#gvN', bg).value,
              public: $('#gvPub', bg).checked,
            });
            bg.remove();
            reload();
          } catch (e) {
            $('.gverr', bg).innerHTML = `<div class="err">${esc(e.message)}</div>`;
          }
        };
      });
    }
  }
  /* جزء من viewGovernance: const addBtn = (k, l) => (M ? `<button class="btn … */
  function viewGovernancePart3(GV, M, chip, sev, st, stat, tab, tbl, vs) {
    const addBtn = (k, l) => (M ? `<button class="btn primary" data-gnew="${k}">${icon('plus')} ${l}</button>` : '');
    viewGovernancePart2(GV, M, addBtn, chip, sev, st, stat, tab, tbl, vs);
    if (tab === 'doa') {
      const groups = [...new Set(vs.d.doa.map((x) => x.scope))];
      vs.body = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">${icon('key')} مصفوفة تفويض الصلاحيات</h3>${addBtn('doa', 'صلاحية جديدة')}</div>
        <div class="hint" style="margin-bottom:10px">الحد الأعلى للمبلغ الذي يعتمده كل معتمد في كل نطاق. إذا وصل طلب لمعتمد ومبلغه أعلى من حده يظهر تنبيه «تجاوز حد تفويض الصلاحيات» في صفحة الطلب.</div>
        ${
          groups.length
            ? groups
                .map(
                  (g) =>
                    `<h4 class="b-sec">${esc(g)}</h4>${tbl(
                      'doa',
                      vs.d.doa.filter((x) => x.scope === g),
                      [
                        ['المعتمد', (x) => `<b>${esc(x.userIdName || '')}</b>`],
                        ['المنصب', (x) => esc(x.position || '')],
                        ['الحد الأعلى', (x) => `<b>${fmtNum(x.limit)}</b> ريال`],
                        ['ملاحظات', (x) => esc(x.notes || '')],
                      ],
                    )}`,
                )
                .join('')
            : empEmpty('لم تحدد صلاحيات بعد')
        }</div>`;
    }
    if (tab === 'audits')
      vs.body = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">${icon('scanEye')} مهام التدقيق الداخلي</h3><span class="row" style="gap:6px">${addBtn('audits', 'مهمة تدقيق')}${addBtn('findings', 'ملاحظة تدقيق')}</span></div>
      ${tbl('audits', vs.d.audits, [
        ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
        [
          'المهمة',
          (x) =>
            `<b>${esc(x.title)}</b><div class="muted" style="font-size:12px">${esc(x.area)}${x.branch ? ` — ${esc(x.branch)}` : ''}</div>`,
        ],
        ['المدقق', (x) => esc(x.auditorName || '')],
        ['الفترة', (x) => esc(`${SF.fmtDate(x.from)}${x.to ? ` — ${SF.fmtDate(x.to)}` : ''}`)],
        ['الملاحظات', (x) => `${x.findings}${x.open ? ` <small class="muted">(${x.open} مفتوحة)</small>` : ''}`],
        ['الحالة', (x) => chip(x.status)],
      ])}</div>`;
    if (tab === 'findings')
      vs.body = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">${icon('listChecks')} ملاحظات التدقيق</h3>${addBtn('findings', 'ملاحظة تدقيق')}</div>
      ${tbl('findings', vs.d.findings.slice().reverse(), [
        ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
        ['الملاحظة', (x) => `<b>${esc(x.title)}</b><div class="muted" style="font-size:12px">${esc(x.auditTitle)}</div>`],
        ['الأهمية', (x) => sev(x.severity)],
        ['المسؤول', (x) => esc(x.ownerName || '')],
        ['الموعد', (x) => esc(SF.fmtDate(x.due))],
        ['الحالة', (x) => `${chip(x.status)}${x.overdue ? ' <span class="chip rejected">متأخرة</span>' : ''}`],
      ])}</div>`;
    if (tab === 'policies')
      vs.body = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">${icon('bookOpen')} السياسات والإجراءات</h3>${addBtn('policies', 'سياسة / إجراء')}</div>
      ${tbl('policies', vs.d.policies, [
        ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
        [
          'العنوان',
          (x) =>
            `<b>${esc(x.title)}</b><div class="muted" style="font-size:12px">${esc(x.category)}${x.owner ? ` — ${esc(x.owner)}` : ''}</div>`,
        ],
        ['الإصدار', (x) => esc(x.version)],
        ['السريان', (x) => esc(SF.fmtDate(x.effective))],
        [
          'إقراري',
          (x) =>
            x.mustAck !== 'نعم'
              ? '<span class="muted">لا يلزم</span>'
              : x.myAck
                ? `<span class="chip approved">✔ ${esc(dt(x.myAck))}</span>`
                : '<span class="chip rejected">مطلوب</span>',
        ],
        ...(M ? [['الإقرارات', (x) => (x.mustAck === 'نعم' ? `${x.ackCount} / ${x.audCount}` : '—')]] : []),
        ['الحالة', (x) => chip(x.status)],
      ])}</div>`;
  }
  /* جزء من viewGovernance: vs.body = '';… */
  function viewGovernancePart2(GV, M, addBtn, chip, sev, st, stat, tab, tbl, vs) {
    vs.body = '';
    if (tab === 'dash') {
      /* خريطة المخاطر 5×5: الاحتمال (رأسي) × الأثر (أفقي) */
      const open = vs.d.risks.filter((x) => !GV.CLOSED.includes(x.status));
      const cell = (l, i) => {
        const n = open.filter((x) => Number(x.likelihood) === l && Number(x.impact) === i).length;
        const sc = l * i;
        return `<td style="--c:${GV.LEVEL_C[GV.level(sc)]}" title="الاحتمال ${l} × الأثر ${i} = ${sc}">${n || ''}</td>`;
      };
      const myRisks = vs.d.risks.filter((x) => x.owner === vs.d.me.id && !GV.CLOSED.includes(x.status)),
        myF = vs.d.findings.filter((x) => x.owner === vs.d.me.id && !GV.CLOSED.includes(x.status));
      const pend = vs.d.policies.filter((p) => p.mustAck === 'نعم' && p.status !== 'ملغاة' && !p.myAck);
      vs.body = `<div class="emp-stats" style="margin-top:0">${M || vs.d.risks.length ? `${stat('مخاطر مرتفعة / حرجة', st.risksHigh, 'alert', '#dc2626', st.risksHigh ? 'bad' : '')}${stat('مخاطر مفتوحة', st.risksOpen, 'listChecks', '#d97706')}` : ''}
          ${M || vs.d.findings.length ? stat('ملاحظات تدقيق مفتوحة', `${st.findingsOpen}${st.findingsOverdue ? ` <small>منها ${st.findingsOverdue} متأخرة</small>` : ''}`, 'scanEye', '#7c3aed', st.findingsOverdue ? 'warn' : '') : ''}
          ${stat('سياسات تنتظر إقرارك', st.myPendingAcks, 'bookOpen', '#0891b2', st.myPendingAcks ? 'warn' : '')}${stat(`إقرار تعارض المصالح ${vs.d.me.year}`, vs.d.myCoi ? '✔ مقدَّم' : 'غير مقدَّم', 'scale', vs.d.myCoi ? '#16a34a' : '#dc2626', vs.d.myCoi ? '' : 'bad')}
          ${M ? `${stat('بلاغات مفتوحة', st.reportsOpen, 'lock', '#475569')}${vs.d.coiStats ? stat(`إقرارات ${vs.d.me.year}`, `${vs.d.coiStats.submitted} / ${vs.d.coiStats.total}${vs.d.coiStats.conflicts ? ` <small>${vs.d.coiStats.conflicts} إفصاح</small>` : ''}`, 'users', '#4f46e5') : ''}` : ''}</div>
        ${
          pend.length || !vs.d.myCoi || myRisks.length || myF.length
            ? `<div class="card"><h3 style="margin-top:0">${icon('listChecks')} مطلوب منك</h3><div class="gv-todo">
          ${pend.map((p) => `<a href="#/governance?tab=policies&id=${p.id}">📜 الإقرار بالاطلاع على: <b>${esc(p.title)}</b> (الإصدار ${esc(p.version)})</a>`).join('')}
          ${vs.d.myCoi ? '' : `<a href="#/governance?tab=coi">⚖️ تقديم إقرار تعارض المصالح ومدونة السلوك لعام ${vs.d.me.year}</a>`}
          ${myRisks.map((x) => `<a href="#/governance?tab=risks&id=${x.id}">⚠️ خطر مسند إليك: <b>${esc(x.title)}</b> ${sev(x.level)}</a>`).join('')}
          ${myF.map((x) => `<a href="#/governance?tab=findings&id=${x.id}">🔎 ملاحظة تدقيق مطلوب معالجتها: <b>${esc(x.title)}</b>${x.due ? ` — قبل ${esc(SF.fmtDate(x.due))}` : ''}${x.overdue ? ' <span class="chip rejected">متأخرة</span>' : ''}</a>`).join('')}</div></div>`
            : ''
        }
        ${
          M || vs.d.risks.length
            ? `<div class="grid2" style="grid-template-columns:auto 1fr;gap:12px;align-items:start"><div class="card"><h3 style="margin-top:0">${icon('chart')} خريطة المخاطر</h3>
          <table class="gv-heat"><tbody>${[5, 4, 3, 2, 1].map((l) => `<tr><th>${l}</th>${[1, 2, 3, 4, 5].map((i) => cell(l, i)).join('')}</tr>`).join('')}<tr><th></th>${[1, 2, 3, 4, 5].map((i) => `<th>${i}</th>`).join('')}</tr></tbody></table>
          <div class="muted" style="font-size:12px;text-align:center">الاحتمال ↑ × الأثر ←</div></div>
          <div class="card"><h3 style="margin-top:0">${icon('alert')} أعلى المخاطر</h3>${tbl(
            'risks',
            open
              .slice()
              .sort((a, b) => b.score - a.score)
              .slice(0, 8),
            [
              ['الخطر', (x) => `<b>${esc(x.title)}</b><div class="muted" style="font-size:12px">${esc(x.category)}</div>`],
              ['الدرجة', (x) => `${x.score} ${sev(x.level)}`],
              ['المالك', (x) => esc(x.ownerName || '')],
              ['الحالة', (x) => chip(x.status)],
            ],
          )}</div></div>`
            : ''
        }
        <div class="card"><h3 style="margin-top:0">${icon('bookOpen')} عن التطبيق</h3><ul class="hse-help">
          <li><b>سجل المخاطر:</b> كل خطر باحتماله وأثره (1–5) فتُحسب درجته ومستواه، ومالكه وخطة معالجته؛ ويظهر في خريطة المخاطر. المالك يكتب رده وخطته.</li>
          <li><b>تفويض الصلاحيات:</b> حد الاعتماد بالريال لكل معتمد ونطاق؛ إذا تجاوز مبلغ الطلب حد المعتمد الحالي يظهر تنبيه في صفحة الطلب.</li>
          <li><b>التدقيق الداخلي:</b> مهام تدقيق بنطاقها ومدققها، وملاحظات بأهميتها وتوصيتها ومسؤول ومعالجة؛ يصل المسؤول إشعار ويرد، وفريق الحوكمة يغلق.</li>
          <li><b>السياسات والإجراءات:</b> نص السياسة وملفها وإصدارها؛ كل مستخدم يقرّ بالاطلاع، وتغيير الإصدار يطلب إقراراً جديداً.</li>
          <li><b>تعارض المصالح:</b> إقرار سنوي لكل مستخدم بالالتزام بمدونة السلوك والإفصاح عن أي تعارض.</li>
          <li><b>قناة البلاغات:</b> بلاغ سري (ويمكن أن يكون مجهولاً) عن مخالفة، برمز متابعة لمعرفة حالته؛ يطلع عليه فريق الحوكمة فقط.</li></ul>
          ${M ? '' : '<div class="hint">يحدد مدير النظام فريق الحوكمة من الإعدادات ← مسارات الاعتماد ← فرق إدارة العمليات.</div>'}</div>`;
    }
    if (tab === 'risks')
      vs.body = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">${icon('alert')} سجل المخاطر (${vs.d.risks.length})</h3>${addBtn('risks', 'خطر جديد')}</div>
      ${tbl(
        'risks',
        vs.d.risks.slice().sort((a, b) => b.score - a.score),
        [
          ['الرقم', (x) => `<b dir="ltr">${esc(x.serial)}</b>`],
          [
            'الخطر',
            (x) =>
              `<b>${esc(x.title)}</b><div class="muted" style="font-size:12px">${esc(x.category)}${x.branch ? ` — ${esc(x.branch)}` : ''}</div>`,
          ],
          ['الاحتمال × الأثر', (x) => `${x.likelihood} × ${x.impact} = <b>${x.score}</b>`],
          ['المستوى', (x) => sev(x.level)],
          ['المالك', (x) => esc(x.ownerName || '')],
          [
            'المعالجة',
            (x) => `${esc(x.treatment || '')}${x.due ? `<div class="muted" style="font-size:12px">${esc(SF.fmtDate(x.due))}</div>` : ''}`,
          ],
          ['الحالة', (x) => `${chip(x.status)}${x.overdue ? ' <span class="chip rejected">متأخر</span>' : ''}`],
        ],
      )}</div>`;
  }
  /* جزء من viewGovernance: if (query.id) {… */
  function viewGovernancePart(chip, d, gvModal, query, reload, repModal, tab) {
    if (query.id) {
      const x = (d[tab] || []).find((y) => y.id === query.id);
      if (x) tab === 'reports' ? repModal(x) : gvModal(tab, x);
    }
    /* إقرار تعارض المصالح */
    if ($('#gvCoi')) {
      const f = $('#gvCoi'),
        sync = () => {
          $('#gvDet').hidden = f.hasConflict.value !== 'نعم';
        };
      f.hasConflict.onchange = sync;
      sync();
      f.onsubmit = async (e) => {
        e.preventDefault();
        try {
          await api('POST', '/api/governance/coi', {
            hasConflict: f.hasConflict.value,
            details: f.details.value,
            codeAck: f.codeAck.checked,
          });
          toast('تم حفظ الإقرار');
          reload();
        } catch (x) {
          $('.gverr', f).innerHTML = `<div class="err">${esc(x.message)}</div>`;
        }
      };
    }
    /* البلاغ ومتابعته */
    if ($('#gvRep')) {
      const f = $('#gvRep');
      f.onsubmit = async (e) => {
        e.preventDefault();
        try {
          const r = await api('POST', '/api/governance/reports', {
            category: f.category.value,
            branch: f.branch.value,
            description: f.description.value,
            anonymous: f.anonymous.checked,
          });
          f.innerHTML = `<div class="emp-al ok">✔ تم إرسال البلاغ ${esc(r.serial)}</div><p>احتفظ برمز المتابعة لمعرفة حالة البلاغ والرد عليه (لا يمكن استرجاعه لاحقاً):</p><div class="gv-tok" dir="ltr">${esc(r.token)}</div>`;
        } catch (x) {
          $('.gverr', f).innerHTML = `<div class="err">${esc(x.message)}</div>`;
        }
      };
      $('#gvTrack').onclick = async () => {
        try {
          const r = await api('GET', `/api/governance/track?token=${encodeURIComponent($('#gvTok').value.trim())}`);
          $('#gvTr').innerHTML =
            `<div><b dir="ltr">${esc(r.serial)}</b> ${esc(r.category)} ${chip(r.status)} <small class="muted">${esc(dt(r.at))}</small></div>${r.replies.length ? `<ul class="timeline">${r.replies.map((x) => `<li><div class="note">${esc(x.note)}</div><div class="when">${esc(dt(x.at))}</div></li>`).join('')}</ul>` : '<div class="muted">لا توجد ردود بعد</div>'}`;
        } catch (x) {
          $('#gvTr').innerHTML = `<div class="err">${esc(x.message)}</div>`;
        }
      };
    }
  }
  /* view من gvModal (يأخذ x من الصفحة) */
  function gvModalView(x, f) {
    const v =
      f.type === 'user'
        ? x[`${f.key}Name`]
        : f.type === 'audit'
          ? x.auditTitle
          : f.type === 'date'
            ? SF.fmtDate(x[f.key])
            : f.type === 'number'
              ? fmtNum(x[f.key])
              : x[f.key];
    return v
      ? `<div class="emp-f${f.type === 'textarea' ? ' full' : ''}"><small>${esc(f.label)}</small><b style="white-space:pre-wrap">${esc(v)}</b></div>`
      : '';
  }
  /* جزء من gvModal: document.body.appendChild(bg);… */
  function gvModalPart(FS, GV, bg, gvModal, k, query, reload, x) {
    document.body.appendChild(bg);
    $$('[data-x]', bg).forEach((b) => {
      b.onclick = () => bg.remove();
    });
    const err = (m) => {
      const e = $('.gverr', bg);
      if (e) e.innerHTML = `<div class="err">${esc(m)}</div>`;
      else toast(m, true);
    };
    return wireGvModal(FS, GV, bg, err, gvModal, k, query, reload, x);
  }
  /* أحداث gvModal */
  function wireGvModal(FS, GV, bg, err, gvModal, k, query, reload, x) {
    if ($('#gvAck', bg)) {
      $('#gvAck', bg).onchange = (e) => {
        $('#gvAckB', bg).disabled = !e.target.checked;
      };
      $('#gvAckB', bg).onclick = async () => {
        try {
          await api('POST', `/api/governance/policies/${x.id}/ack`, {});
          toast('تم الإقرار بالاطلاع');
          bg.remove();
          reload();
        } catch (e) {
          err(e.message);
        }
      };
    }
    if ($('#gvPend', bg))
      $('#gvPend', bg).onclick = async () => {
        const r = await api('GET', `/api/governance?pol=${x.id}`);
        const p = r.policies.find((y) => y.id === x.id);
        $('#gvPendL', bg).textContent = p && p.pending && p.pending.length ? p.pending.join('، ') : 'الجميع أقرّوا';
      };
    if ($('[data-addf]', bg))
      $('[data-addf]', bg).onclick = () => {
        bg.remove();
        query.audit = x.id;
        gvModal('findings', null);
      };
    if ($('#gvDel', bg))
      $('#gvDel', bg).onclick = async () => {
        if (!(await askYesNo(`حذف ${GV.ONE[k]} ${x.serial} نهائياً؟`))) return;
        try {
          await api('DELETE', `/api/governance/${k}/${x.id}`);
          bg.remove();
          reload();
        } catch (e) {
          err(e.message);
        }
      };
    if ($('#gvF', bg))
      $('#gvF', bg).onsubmit = async (ev) => {
        ev.preventDefault();
        const b = {};
        FS.forEach((f) => {
          const el = $(`[data-key="${f.key}"]`, bg);
          if (el) b[f.key] = el.value;
        });
        if ($('#gvNote', bg)) b.note = $('#gvNote', bg).value;
        try {
          const r = await api(x ? 'PUT' : 'POST', x ? `/api/governance/${k}/${x.id}` : `/api/governance/${k}`, b);
          const fl = $('#gvFile', bg);
          if (fl && fl.files[0]) await uploadFile(null, fl.files[0], '', `/api/governance/policies/${r.id}/files`);
          toast('تم الحفظ');
          bg.remove();
          reload();
        } catch (e) {
          err(e.message);
        }
      };
    if ($('#gvOw', bg))
      $('#gvOw', bg).onsubmit = async (ev) => {
        ev.preventDefault();
        const f = ev.target;
        try {
          await api('PUT', `/api/governance/${k}/${x.id}`, {
            response: f.response.value,
            ...(f.plan ? { plan: f.plan.value } : {}),
            ...(f.inprog.checked ? { status: 'قيد المعالجة' } : {}),
          });
          toast('تم إرسال الرد');
          bg.remove();
          reload();
        } catch (e) {
          err(e.message);
        }
      };
  }

  return { viewGovernance };
};
