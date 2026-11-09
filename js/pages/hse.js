'use strict';
/* صفحة «hse» (viewHse) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['hse'] = function (S) {
  const {
    $,
    ACCEPT,
    SF,
    TABS,
    api,
    askYesNo,
    chip,
    collect,
    dt,
    empEmpty,
    esc,
    fieldHtml,
    head,
    icon,
    setCrumb,
    shell,
    state,
    toast,
    today,
    uploadFile,
  } = S;
  /* ---------- السلامة والصحة المهنية (HSE): لوحة + بلاغات الحوادث + ملاحظات السلامة + تصاريح العمل + فحوصات السلامة ---------- */
  /* تبويبات الصفحة */
  const hseTabs = (HS) => [
    ['dash', 'لوحة السلامة', 'gauge'],
    ['incidents', HS.KINDS.incidents, 'alert'],
    ['observations', HS.KINDS.observations, 'eye'],
    ['permits', HS.KINDS.permits, 'filePen'],
    ['inspections', HS.KINDS.inspections, 'clipboardCheck'],
  ];
  /* لون شارة الحالة */
  const HSE_CL = {
    مفتوح: 'pending',
    مفتوحة: 'pending',
    'قيد التحقيق': 'pending',
    ساري: 'approved',
    مكتمل: 'approved',
    'تمت المعالجة': 'approved',
    مغلق: 'cancelled',
    مغلقة: 'cancelled',
    ملغي: 'cancelled',
    منتهي: 'rejected',
    'يحتاج إجراء': 'rejected',
  };
  /* لون درجة الخطورة */
  const HSE_SEV = { بسيط: '#16a34a', متوسط: '#d97706', جسيم: '#dc2626', وفاة: '#7f1d1d', منخفض: '#16a34a', مرتفع: '#dc2626' };
  const hChip = (t) => `<span class="chip ${HSE_CL[t] || ''}">${esc(t || '—')}</span>`;
  const hSev = (t) => (t ? `<span class="hse-sev" style="--c:${HSE_SEV[t] || '#64748b'}">${esc(t)}</span>` : '');
  const hStat = (l, v, ic, c, sub = '', cls = '') =>
    `<div class="emp-stat ${cls}"><div><div class="s-v">${v}</div><div class="s-l">${l}</div>${sub ? `<small class="muted">${sub}</small>` : ''}</div><span class="b-ic" style="--m:${c}">${icon(ic)}</span></div>`;
  /* حالة السجل: التصريح بحالته المحسوبة (ساري/منتهي) وغيره بحالته */
  const stateOf = (k, x) => (k === 'permits' ? x.state : x.status);
  const lateChip = (x) => (x.overdue ? ' <span class="chip rejected">متأخر</span>' : '');
  const summaryOf = (k, x) =>
    k === 'incidents'
      ? `${x.type || ''}`
      : k === 'observations'
        ? `${x.kind || ''} — ${x.category || ''}`
        : k === 'permits'
          ? `${x.type || ''}`
          : `${x.template || ''}${x.asset ? ` — ${x.asset}` : ''}`;
  const dateOf = (k, x) =>
    k === 'permits' ? `${SF.fmtDate(x.from)} ← ${SF.fmtDate(x.to)}` : `${SF.fmtDate(x.date)}${x.time ? ` ${x.time}` : ''}`;
  /* عنوان العمود الخامس وقيمته حسب النوع */
  const col5Head = (k) => (k === 'incidents' ? 'الخطورة' : k === 'observations' ? 'الخطورة' : k === 'permits' ? 'المشرف' : 'النتيجة');
  const col5 = (k, x) =>
    k === 'permits'
      ? esc(x.supervisor || '')
      : k === 'inspections'
        ? `${Object.values(x.answers || {}).filter((a) => a === 'غير مطابق').length} غير مطابق`
        : hSev(x.severity || x.risk);
  const rowHtml = (
    k,
    x,
  ) => `<tr class="clickable" style="cursor:pointer" data-hopen="${k}:${x.id}"><td><b dir="ltr">${esc(x.serial)}</b></td><td class="num">${esc(dateOf(k, x))}</td><td>${esc(x.branch || '')}${x.site ? `<div class="muted" style="font-size:12px">${esc(x.site)}</div>` : ''}</td>
        <td>${esc(summaryOf(k, x))}<div class="muted" style="font-size:12px">${esc(String(x.description || x.work || x.notes || '').slice(0, 90))}</div></td>
        <td>${col5(k, x)}</td>
        <td>${hChip(stateOf(k, x))}${lateChip(x)}</td></tr>`;
  const rowsHtml = (k, list) =>
    list.length
      ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الرقم</th><th>التاريخ</th><th>الفرع / الموقع</th><th>البيان</th><th>${col5Head(k)}</th><th>الحالة</th></tr></thead><tbody>
      ${list.map((x) => rowHtml(k, x)).join('')}</tbody></table></div>`
      : empEmpty(`لا توجد ${SF.HSE.KINDS[k]}`);
  const addBtnsHtml = (d) =>
    `<span class="row" style="gap:6px;flex-wrap:wrap"><button class="btn bad" data-hnew="incidents">${icon('alert')} إبلاغ عن حادث</button><button class="btn" data-hnew="observations">${icon('eye')} ملاحظة سلامة</button>${d.manage || state.user.branchManager ? `<button class="btn" data-hnew="permits">${icon('filePen')} تصريح عمل</button>` : ''}<button class="btn" data-hnew="inspections">${icon('clipboardCheck')} فحص سلامة</button></span>`;
  const tabsBarHtml = (tabs, tab, d) =>
    `<div class="tabs" style="margin-bottom:14px">${tabs.map(([k, l, ic]) => `<a href="#/hse${k === 'dash' ? '' : `?tab=${k}`}" class="${k === tab ? 'on' : ''}">${icon(ic)} ${esc(l)}${k !== 'dash' && d[k].length ? ` <small>(${d[k].length})</small>` : ''}</a>`).join('')}</div>`;

  /* لوحة السلامة: الأرقام الرئيسية */
  const heroHtml = (st) =>
    `<div class="hse-hero"><div class="hse-big"><b>${st.daysNoInjury === null ? '—' : st.daysNoInjury}</b><span>يوم بدون إصابات عمل</span><small>${st.lastInjury ? `آخر إصابة مسجلة ${esc(SF.fmtDate(st.lastInjury))}` : 'لا توجد إصابات عمل مسجلة'}</small></div>
        <div class="emp-stats" style="margin:0;flex:1">${hStat('حوادث هذا الشهر', st.incMonth, 'alert', '#dc2626', `وشبه حوادث: ${st.nearMonth}`, st.incMonth ? 'bad' : '')}${hStat('ملاحظات سلامة هذا الشهر', st.obsMonth, 'eye', '#0891b2')}
          ${hStat('إجراءات مفتوحة', st.open, 'listChecks', '#d97706', st.overdue ? `منها ${st.overdue} متأخرة` : '', st.overdue ? 'warn' : '')}${hStat('تصاريح عمل سارية', st.permits, 'filePen', '#16a34a')}
          ${hStat('فحوصات هذا الشهر', st.inspMonth, 'clipboardCheck', '#4f46e5', st.inspFail ? `${st.inspFail} تحتاج إجراء` : '', st.inspFail ? 'warn' : '')}${hStat('أيام العمل المفقودة هذا العام', st.lostDays, 'calendar', '#7c3aed')}</div></div>`;
  /* الإجراءات المفتوحة: الحوادث والملاحظات والفحوصات التي تحتاج إجراء، والمتأخر أولاً */
  const openActions = (d) =>
    [
      ...d.incidents.map((x) => ['incidents', x]),
      ...d.observations.map((x) => ['observations', x]),
      ...d.inspections.filter((x) => x.status === 'يحتاج إجراء').map((x) => ['inspections', x]),
    ]
      .filter(([, x]) => !SF.HSE.CLOSED.includes(x.status) && x.status !== 'مكتمل')
      .sort((a, b) => Number(b[1].overdue) - Number(a[1].overdue) || String(b[1].date).localeCompare(String(a[1].date)));
  const openRowHtml = ([k, x]) =>
    `<tr class="clickable" style="cursor:pointer" data-hopen="${k}:${x.id}"><td><b dir="ltr">${esc(x.serial)}</b></td><td>${esc(SF.HSE.ONE[k])}</td><td>${esc(x.branch || '')}</td><td>${esc(summaryOf(k, x))}</td><td>${esc(x.responsible || '—')}${x.due ? `<div class="muted" style="font-size:12px">${esc(SF.fmtDate(x.due))}</div>` : ''}</td><td>${hChip(x.status)}${lateChip(x)}</td></tr>`;
  const openCardHtml = (open) =>
    `<div class="card"><h3 style="margin-top:0">${icon('listChecks')} الإجراءات المفتوحة</h3>${
      open.length
        ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الرقم</th><th>النوع</th><th>الفرع</th><th>البيان</th><th>المسؤول / الموعد</th><th>الحالة</th></tr></thead><tbody>
          ${open.slice(0, 30).map(openRowHtml).join('')}</tbody></table></div>`
        : '<div class="emp-al ok">✔ لا توجد إجراءات مفتوحة</div>'
    }</div>`;
  const helpCardHtml = (d) => `<div class="card"><h3 style="margin-top:0">${icon('bookOpen')} كيف يعمل التطبيق؟</h3><ul class="hse-help">
          <li><b>بلاغ حادث:</b> بلّغ فوراً عن أي إصابة أو حادث أو شبه حادث، فيصل إشعار لمسؤولي السلامة ومدير الفرع، ثم يحقق مسؤول السلامة ويحدد السبب الجذري والإجراء التصحيحي ويغلقه.</li>
          <li><b>ملاحظة سلامة:</b> تصرف أو وضع غير آمن (أو ممارسة إيجابية) تسجّله لمعالجته قبل أن يتحول لحادث. وتبلّغ النظام فوراً عن الملاحظة عالية الخطورة.</li>
          <li><b>تصريح عمل:</b> للأعمال الخطرة (عمل ساخن، أماكن مغلقة، ارتفاعات، حفر، كهرباء، رفع ثقيل) بمدة سريان واحتياطات، ويصدره مسؤول السلامة أو مدير الفرع.</li>
          <li><b>فحص سلامة:</b> قائمة تحقق للحفارات والمركبات ومواقع العمل ومعدات الحريق والرفع والوقاية؛ أي بند «غير مطابق» يجعل الفحص «يحتاج إجراء» ويُبلَّغ مسؤول السلامة.</li></ul>
          ${d.manage ? '' : '<div class="hint">ترى سجلات فرعك وما رفعته. يحدد مدير النظام مسؤولي السلامة من الإعدادات ← مسارات الاعتماد ← فرق إدارة العمليات.</div>'}</div>`;
  const dashHtml = (d) => {
    const open = openActions(d);
    return `${heroHtml(d.stats)}
        ${openCardHtml(open)}
        ${helpCardHtml(d)}`;
  };
  /* تبويب سجلات نوع: بحث وتصفية بالفرع والحالة */
  const listHtml = (d, tab) =>
    `<div class="card"><div class="filters"><input class="in" id="hQ" placeholder="بحث بالرقم أو الموقع أو الوصف..."><select class="in" id="hB"><option value="">كل الفروع</option>${[
      ...new Set(d[tab].map((x) => x.branch).filter(Boolean)),
    ]
      .sort()
      .map((b) => `<option>${esc(b)}</option>`)
      .join('')}</select>
        <select class="in" id="hS"><option value="">كل الحالات</option>${[...SF.HSE.STATUS[tab], ...(tab === 'permits' ? ['منتهي'] : [])].map((t) => `<option>${t}</option>`).join('')}</select></div><div id="hList">${rowsHtml(tab, d[tab])}</div></div>`;
  const matches = (tab, x, q, b, s2) =>
    (!b || x.branch === b) &&
    (!s2 || stateOf(tab, x) === s2) &&
    (!q || `${x.serial} ${x.site || ''} ${x.description || x.work || x.notes || ''} ${x.asset || ''} ${summaryOf(tab, x)}`.includes(q));
  const bindFilters = (d, tab) => {
    const apply = () => {
      const q = $('#hQ').value.trim(),
        b = $('#hB').value,
        s2 = $('#hS').value;
      $('#hList').innerHTML = rowsHtml(
        tab,
        d[tab].filter((x) => matches(tab, x, q, b, s2)),
      );
    };
    ['hQ', 'hB', 'hS'].forEach((k) => {
      $(`#${k}`).oninput = apply;
    });
  };
  /* النقر على زر إضافة أو على سجل يفتح نافذته */
  const bindOpen = (ctx, main) => {
    const { d } = ctx;
    main.addEventListener('click', (ev) => {
      const n = ev.target.closest('[data-hnew]');
      if (n) return hseModal(ctx, n.dataset.hnew, null);
      const o = ev.target.closest('[data-hopen]');
      if (o) {
        const [k, id] = o.dataset.hopen.split(':');
        const x = d[k].find((y) => y.id === id);
        if (x) hseModal(ctx, k, x);
      }
    });
  };
  async function viewHse(query) {
    const HS = SF.HSE;
    const TABS = hseTabs(HS);
    const tab = TABS.some(([k]) => k === query.tab) ? query.tab : 'dash';
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/hse');
    let d;
    try {
      d = await api('GET', '/api/hse');
    } catch (err) {
      main.innerHTML = `<div class="card err">${esc(err.message)}</div>`;
      return;
    }
    if (tab !== 'dash') setCrumb([[HS.KINDS[tab], `#/hse?tab=${tab}`]]);
    const body = tab === 'dash' ? dashHtml(d) : listHtml(d, tab);
    main.innerHTML = `${head('السلامة والصحة المهنية', 'بلاغات الحوادث وملاحظات السلامة وتصاريح العمل وفحوصات السلامة — HSE', addBtnsHtml(d))}${tabsBarHtml(TABS, tab, d)}${body}`;
    if (tab !== 'dash') bindFilters(d, tab);
    const ctx = { d, query, reload: () => viewHse(query) };
    bindOpen(ctx, main);
    /* فتح سجل مباشرة من رابط الإشعار */
    if (query.id) {
      const x = (d[tab] || []).find((y) => y.id === query.id);
      if (x) hseModal(ctx, tab, x);
    }
  }

  /* ---------- نافذة السجل: إضافة / عرض وتعديل، والملفات، والسجل، وقائمة التحقق للفحص ---------- */
  const fieldOfIn = (d) => (f) => (f.type === 'branch' ? { ...f, type: 'select', options: d.branches } : f);
  const firstVal = (d, f) =>
    f.key === 'branch'
      ? d.myBranch
      : f.key === 'date' || f.key === 'from'
        ? today()
        : f.key === 'template'
          ? Object.keys(SF.HSE.CHECKS)[0]
          : '';
  const val0Of = (d, x) => (f) => (x ? x[f.key] || '' : firstVal(d, f));
  const ckOpt = (i, ans, edit) => (o) =>
    `<label class="${o === 'غير مطابق' ? 'no' : o === 'مطابق' ? 'yes' : ''}"><input type="radio" name="ck${i}" value="${o}"${(ans || {})[i] === o ? ' checked' : ''}${edit ? '' : ' disabled'}> ${o}</label>`;
  const checklist = (tpl, ans, edit) =>
    `<div class="hse-checks"><h4 class="b-sec">قائمة الفحص — ${esc(tpl)}</h4>${(SF.HSE.CHECKS[tpl] || []).map((t, i) => `<div class="hse-ck"><span>${i + 1}. ${esc(t)}</span><span class="hse-opts">${['مطابق', 'غير مطابق', 'لا ينطبق'].map(ckOpt(i, ans, edit)).join('')}</span></div>`).join('')}</div>`;
  const viewField = (x) => (f) => {
    const v = x[f.key];
    return `<div class="emp-f${f.type === 'textarea' ? ' full' : ''}"><small>${esc(f.label)}</small><b style="white-space:pre-wrap">${esc(f.type === 'date' ? SF.fmtDate(v) : v || '—')}</b></div>`;
  };
  const modalTitle = (k, x) =>
    x
      ? `${esc(SF.HSE.ONE[k])} <bdi dir="ltr">${esc(x.serial)}</bdi> ${hChip(stateOf(k, x))}`
      : `${icon('plus')} ${esc(SF.HSE.ONE[k])} جديد`;
  const modalBy = (x) =>
    x
      ? `<div class="muted" style="margin:-6px 0 10px;font-size:13px">رفعه ${esc(x.byName)} — ${esc(dt(x.at))}${x.closedAt ? ` · أغلقه ${esc(dt(x.closedAt))} بواسطة ${esc(x.closedBy || '')}` : ''}</div>`
      : '';
  /* الحقول: نموذج قابل للتعديل أو عرض للقراءة */
  const modalFields = (m) => {
    const { d, FS, edit, visibleFs, fieldOf, val0, x } = m;
    return edit
      ? `<div class="grid2" style="grid-template-columns:repeat(3,1fr)">${visibleFs.map((f) => (f.inv && !d.manage ? '' : `<div style="${f.type === 'textarea' ? 'grid-column:1/-1' : ''}">${fieldHtml(fieldOf(f), val0(f))}</div>`)).join('')}</div>
            ${!d.manage && FS.some((f) => f.inv) ? '<div class="hint">التحقيق والإجراء التصحيحي وإغلاق السجل لمسؤول السلامة.</div>' : ''}`
      : `<div class="emp-fields">${visibleFs.map(viewField(x)).join('')}</div>`;
  };
  /* المرفقات والسجل للسجل المحفوظ، أو حقل الملفات للسجل الجديد */
  const modalFiles = (k, x, edit) =>
    x
      ? `<h4 class="b-sec">المرفقات والصور</h4>${(x.files || []).length ? `<ul class="files">${x.files.map((f) => `<li><a href="/api/hse/${k}/${x.id}/files/${f.id}" target="_blank">📎 ${esc(f.name)}</a><small class="muted">${esc(f.by || '')} — ${esc(dt(f.at))}</small></li>`).join('')}</ul>` : '<div class="muted">لا توجد مرفقات</div>'}
            ${edit ? `<label class="btn sm" style="cursor:pointer;margin-top:6px">⬆ إرفاق صور / ملفات<input type="file" id="hFile" multiple accept="${ACCEPT}" hidden></label>` : ''}
            <h4 class="b-sec">السجل</h4><ul class="timeline">${(x.log || [])
              .slice()
              .reverse()
              .map((h) => `<li><b>${esc(h.action)}</b><div class="when">${esc(h.by)} — ${esc(dt(h.at))}</div></li>`)
              .join('')}</ul>`
      : `<div class="field"><label>صور / ملفات (اختياري)</label><input type="file" class="in" id="hFile" multiple accept="${ACCEPT}"></div>`;
  const modalHtml = (m) => {
    const { d, k, x, edit, FS, val0 } = m;
    return `<div class="modal" style="max-width:920px;width:96%"><h3 style="margin-top:0">${modalTitle(k, x)}</h3>
        ${modalBy(x)}
        <form id="hF" novalidate>${modalFields(m)}
          ${k === 'inspections' ? `<div id="hCk">${checklist(val0(FS[0]), x && x.answers, edit)}</div>` : ''}
          ${x && edit && d.manage ? '<div class="field"><label>ملاحظة على تغيير الحالة (تظهر لصاحب البلاغ)</label><input class="in" id="hNote"></div>' : ''}
          ${modalFiles(k, x, edit)}
          <div class="herr"></div><div class="row" style="margin-top:12px;gap:8px">${edit ? `<button class="btn primary">💾 ${x ? 'حفظ' : 'إرسال'}</button>` : ''}<button type="button" class="btn ghost" data-x>إغلاق</button>${x && state.user.role === 'admin' ? '<button type="button" class="btn bad" id="hDel" style="margin-inline-start:auto">🗑️ حذف</button>' : ''}</div></form></div>`;
  };
  /* رفع الملفات فوراً للسجل المحفوظ، والحذف النهائي */
  const bindModalFiles = (m) => {
    const { bg, k, x, edit, upload, err, ctx } = m;
    if (x && edit && $('#hFile', bg))
      $('#hFile', bg).onchange = async () => {
        try {
          await upload(x.id);
          toast('تم رفع الملف');
          bg.remove();
          ctx.reload();
        } catch (e) {
          err(e.message);
        }
      };
    if ($('#hDel', bg))
      $('#hDel', bg).onclick = async () => {
        if (!(await askYesNo(`حذف ${SF.HSE.ONE[k]} ${x.serial} نهائياً؟`))) return;
        try {
          await api('DELETE', `/api/hse/${k}/${x.id}`);
          bg.remove();
          ctx.reload();
        } catch (e) {
          err(e.message);
        }
      };
  };
  /* بيانات النموذج، وإجابات قائمة الفحص، وملاحظة تغيير الحالة */
  const formBody = (m) => {
    const { bg, k, d, visibleFs, fieldOf } = m;
    const b = collect({ fields: visibleFs.filter((f) => !f.inv || d.manage).map(fieldOf) }, $('#hF', bg));
    if (k === 'inspections') {
      b.answers = {};
      (SF.HSE.CHECKS[b.template] || []).forEach((t, i) => {
        const c = $(`[name="ck${i}"]:checked`, bg);
        if (c) b.answers[i] = c.value;
      });
    }
    if ($('#hNote', bg)) b.note = $('#hNote', bg).value;
    return b;
  };
  const bindModalSubmit = (m) => {
    const { bg, k, x, edit, upload, err, ctx } = m;
    $('#hF', bg).onsubmit = async (ev) => {
      ev.preventDefault();
      if (!edit) return;
      const b = formBody(m);
      try {
        const r = await api(x ? 'PUT' : 'POST', x ? `/api/hse/${k}/${x.id}` : `/api/hse/${k}`, b);
        if (!x) await upload(r.id);
        toast(x ? 'تم الحفظ' : `تم إرسال ${SF.HSE.ONE[k]} ${r.serial}`);
        bg.remove();
        if (!x && ctx.query.tab !== k) location.hash = `#/hse?tab=${k}`;
        else ctx.reload();
      } catch (e) {
        err(e.message);
      }
    };
  };
  function hseModal(ctx, k, x) {
    const { d } = ctx;
    const FS = SF.HSE.fields[k],
      edit = !x || x.canEdit;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const m = { ctx, d, k, x, FS, edit, bg, fieldOf: fieldOfIn(d), val0: val0Of(d, x) };
    m.visibleFs = FS.filter((f) => !f.inv || d.manage || (x && x[f.key]));
    bg.innerHTML = modalHtml(m);
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    m.err = (msg) => {
      $('.herr', bg).innerHTML = `<div class="err">${esc(msg)}</div>`;
    };
    const tplSel = $('[data-key="template"]', bg);
    if (tplSel)
      tplSel.onchange = () => {
        $('#hCk', bg).innerHTML = checklist(tplSel.value, {}, edit);
      };
    m.upload = async (id) => {
      const fl = $('#hFile', bg);
      for (const f of (fl && fl.files) || []) await uploadFile(null, f, '', `/api/hse/${k}/${id}/files`);
    };
    bindModalFiles(m);
    bindModalSubmit(m);
  }

  return { viewHse };
};
