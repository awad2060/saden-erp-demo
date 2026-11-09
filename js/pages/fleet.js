'use strict';
/* صفحة «fleet»: نافذتا تسجيل المركبة، وكارت المركبة (viewVehicle)؛ والقائمة بتبويباتها (viewFleet) في fleet-list.js.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['fleet'] = function (S) {
  const {
    $,
    $$,
    SF,
    api,
    askYesNo,
    can,
    collect,
    downloadXlsx,
    esc,
    fieldHtml,
    fitLetters,
    head,
    icon,
    normDate,
    parseCsv,
    readXlsx,
    route,
    shell,
    state,
    toast,
  } = S;
  /* أدوات الأسطول المشتركة (fleet-kit.js)، وصفحة القائمة بتبويباتها (fleet-list.js) */
  const kit = window.SES_FLEET.kit(S);
  const { FLEET_FIELDS, BULK_COLS, BULK_SAMPLE, docBadge, maintState, ownerOf, whoOf } = kit;
  function vehicleModal(v, done) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:860px;width:96%"><h3 style="margin-top:0">${v ? '✏️ تعديل بيانات المركبة' : '➕ تسجيل مركبة جديدة'}</h3><form id="vf" novalidate>
      ${FLEET_FIELDS(v)
        .map(
          ([title, fs, only]) =>
            `<div${only ? ` data-rig${(v || {}).vType === 'حفارة' ? '' : ' hidden'}` : ''}><h4 class="b-sec">${title}</h4><div class="grid2">${fs.map((f) => fieldHtml(f, (v || {})[f.key] || f.default || (f.key === 'status' ? 'في الخدمة' : ''))).join('')}</div></div>`,
        )
        .join('')}
      <div id="vErr"></div><div class="row" style="margin-top:14px;gap:8px"><button class="btn primary">💾 حفظ المركبة</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#vf', bg).onsubmit = async (e) => {
      e.preventDefault();
      const body = collect({ fields: FLEET_FIELDS().flatMap(([, fs]) => fs) }, $('#vf', bg));
      try {
        const saved = await api(v ? 'PUT' : 'POST', v ? `/api/fleet/${v.id}` : '/api/fleet', body);
        bg.remove();
        toast('تم حفظ المركبة');
        done(saved);
      } catch (err) {
        $('#vErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  /* ---------- تسجيل عدة مركبات مرة واحدة: جدول قابل للتعبئة واللصق من Excel أو رفع ملف ---------- */
  /* خانة الجدول: قائمة للحقل الاختياري (وقيمة غير معروفة تظهر بعلامة ⚠) أو حقل نص/تاريخ */
  const bulkCell = (f, v) => {
    const val = v == null ? '' : String(v).trim();
    if (f.type === 'select') {
      const ok = f.options.includes(val);
      return `<select class="in" data-c="${f.key}"><option value="">—</option>${f.options.map((o) => `<option${o === val ? ' selected' : ''}>${esc(o)}</option>`).join('')}${val && !ok ? `<option selected value="${esc(val)}">⚠ ${esc(val)}</option>` : ''}</select>`;
    }
    return `<input class="in" data-c="${f.key}" ${f.type === 'date' ? 'type="date"' : ''} value="${esc(f.type === 'date' ? normDate(val) : val)}">`;
  };
  const bulkRowHtml = (cols, vals = {}) =>
    `<tr>${cols.map((f) => `<td>${bulkCell(f, vals[f.key])}</td>`).join('')}<td><button type="button" class="btn sm ghost" data-rm title="حذف الصف">✕</button></td></tr>`;
  const bulkRows = (cols, n) =>
    Array(n)
      .fill(0)
      .map(() => bulkRowHtml(cols))
      .join('');
  const bulkModalHtml = (
    cols,
  ) => `<div class="modal" style="max-width:96vw;width:1400px"><h3 style="margin-top:0">📋 تسجيل عدة مركبات مرة واحدة</h3>
      <div class="hint" style="margin-bottom:10px">صف لكل مركبة. يمكنك نسخ الصفوف من Excel بنفس ترتيب الأعمدة ثم الضغط في أول خانة واللصق (Ctrl+V)، أو تحميل قالب Excel وتعبئته ثم رفعه. الإلزامي: رقم اللوحة والماركة والفرع (بنفس أسماء فروع النظام). التاريخ بصيغة 2027-05-01 أو 01/05/2027.</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <button type="button" class="btn sm" id="bkTpl">📊 تحميل قالب Excel</button>
        <label class="btn sm" style="cursor:pointer">📂 رفع ملف Excel<input type="file" id="bkFile" accept=".xlsx,.csv" hidden></label>
        <button type="button" class="btn sm" id="bkAdd">+ صف</button><button type="button" class="btn sm" id="bkAdd10">+ 10 صفوف</button>
        <span class="muted" id="bkCount" style="align-self:center"></span></div>
      <div class="tbl-wrap" style="max-height:55vh;overflow:auto"><table class="tbl bulk-t"><thead><tr>${cols.map((f) => `<th>${esc(f.label)}${f.required ? '<span class="req">*</span>' : ''}</th>`).join('')}<th></th></tr></thead><tbody id="bkRows">${bulkRows(cols, 5)}</tbody></table></div>
      <div id="bkErr"></div>
      <div class="row" style="margin-top:12px;gap:8px"><button type="button" class="btn primary" id="bkSave">💾 حفظ المركبات</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></div>`;
  /* كتابة قيمة في خانة: القائمة تُضاف لها القيمة غير المعروفة بعلامة ⚠ */
  const setCell = (inp, f, v) => {
    const val = String(v || '').trim();
    if (inp.tagName === 'SELECT') {
      if (![...inp.options].some((o) => o.value === val) && val)
        inp.insertAdjacentHTML('beforeend', `<option value="${esc(val)}">⚠ ${esc(val)}</option>`);
      inp.value = val;
    } else inp.value = f.type === 'date' ? normDate(val) : val;
  };
  /* تعبئة الصفوف من الخانة المختارة، وإضافة صفوف عند الحاجة */
  const fillRows = (m, rows, startTr, startCol) => {
    const { body, cols } = m;
    let tr = startTr;
    rows.forEach((vals) => {
      if (!tr) {
        body.insertAdjacentHTML('beforeend', bulkRowHtml(cols));
        tr = body.lastElementChild;
      }
      const inputs = $$('[data-c]', tr);
      vals.forEach((v, k) => {
        const inp = inputs[startCol + k];
        if (inp) setCell(inp, cols[startCol + k], v);
      });
      tr = tr.nextElementSibling;
    });
    m.count();
  };
  /* اللصق من Excel: صفوف بفاصل سطر وأعمدة بفاصل Tab، تبدأ من الخانة المختارة */
  const onPaste = (m) => (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!/[\t\n]/.test(text.trim())) return;
    e.preventDefault();
    const rows = text
      .replace(/\r/g, '')
      .replace(/\n$/, '')
      .split('\n')
      .map((l) => l.split('\t'));
    const td = e.target.closest('td'),
      tr = e.target.closest('tr');
    fillRows(m, rows, tr, [...tr.children].indexOf(td));
  };
  /* أزرار إضافة الصفوف وحذفها، وعدّاد المركبات، واللصق */
  const bindRows = (m) => {
    const { bg, body, cols, count } = m;
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#bkAdd', bg).onclick = () => body.insertAdjacentHTML('beforeend', bulkRowHtml(cols));
    $('#bkAdd10', bg).onclick = () => body.insertAdjacentHTML('beforeend', bulkRows(cols, 10));
    body.addEventListener('click', (e) => {
      if (e.target.dataset.rm !== undefined) {
        e.target.closest('tr').remove();
        count();
      }
    });
    body.addEventListener('input', count);
    body.addEventListener('change', count);
    body.addEventListener('paste', onPaste(m));
  };
  /* ملف Excel/CSV: إن كان صفه الأول عناوين الأعمدة تُرتَّب الأعمدة بها */
  const byHeader = (cols, rows) => {
    if (rows.length && cols.some((c) => rows[0].map((x) => x.trim()).includes(c.label))) {
      const idx = cols.map((c) => rows[0].map((x) => x.trim()).indexOf(c.label));
      return rows.slice(1).map((r) => idx.map((k) => (k >= 0 ? r[k] : '')));
    }
    return rows;
  };
  const bindFile = (m) => {
    const { bg, body, cols } = m;
    $('#bkTpl', bg).onclick = () => downloadXlsx(window.SES_FLEET.vehiclesFile(), [cols.map((f) => f.label), BULK_SAMPLE()], 'المركبات');
    $('#bkFile', bg).onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      let rows;
      try {
        rows = /\.csv$/i.test(f.name) ? parseCsv(await f.text()) : await readXlsx(f);
      } catch (err) {
        $('#bkErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        e.target.value = '';
        return;
      }
      $('#bkErr', bg).innerHTML = '';
      rows = byHeader(cols, rows);
      body.innerHTML = '';
      fillRows(m, rows, null, 0);
      e.target.value = '';
    };
  };
  const bindSave = (m, done) => {
    const { bg, filled } = m;
    $('#bkSave', bg).onclick = async () => {
      const list = filled().map((tr) => Object.fromEntries($$('[data-c]', tr).map((i) => [i.dataset.c, i.value.trim()])));
      $('#bkErr', bg).innerHTML = '';
      if (!list.length) {
        $('#bkErr', bg).innerHTML = '<div class="err">اكتب مركبة واحدة على الأقل</div>';
        return;
      }
      $('#bkSave', bg).disabled = true;
      try {
        const r = await api('POST', '/api/fleet/bulk', { vehicles: list });
        bg.remove();
        toast(`تم تسجيل ${r.added} مركبة`);
        done();
      } catch (err) {
        $('#bkErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        $('#bkSave', bg).disabled = false;
      }
    };
  };
  function vehicleBulkModal(done) {
    const cols = BULK_COLS();
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = bulkModalHtml(cols);
    document.body.appendChild(bg);
    const body = $('#bkRows', bg);
    const filled = () => $$('tr', body).filter((tr) => $$('[data-c]', tr).some((i) => i.value.trim()));
    const count = () => {
      $('#bkCount', bg).textContent = `${filled().length} مركبة مكتوبة`;
    };
    const m = { bg, body, cols, filled, count };
    bindRows(m);
    bindFile(m);
    bindSave(m, done);
    count();
  }

  const { viewFleet } = window.SES_FLEET.list(S, { kit, vehicleModal, vehicleBulkModal });

  /* كارت المركبة: البيانات والمستندات وسجل الصيانة ومحاضر التسليم */
  function vehicleCard(v) {
    const pairs = (arr) => infoRows(arr.filter(([, x]) => x !== undefined));
    const infoRows = (arr) =>
      `<table class="lt">${arr.map(([l, x], i) => (i % 2 ? '' : `<tr><td class="lbl">${esc(l)}</td><td>${esc(x || '—')}</td>${arr[i + 1] ? `<td class="lbl">${esc(arr[i + 1][0])}</td><td>${esc(arr[i + 1][1] || '—')}</td>` : '<td class="lbl"></td><td></td>'}</tr>`)).join('')}</table>`;
    return `<div class="letter has-head"><img class="l-head" src="header.png" alt="">
      <div class="l-top"><div>التاريخ : <span class="red">${esc(SF.fmtDate(new Date().toISOString()))}</span></div><div>رقم اللوحة : <b class="red"><bdi>${esc(v.plate)}</bdi></b></div></div>
      <div class="l-title">كارت بيانات المركبة</div>
      <h4 class="l-sec">البيانات الفنية والتعريفية :</h4>
      ${pairs([
        ['رقم اللوحة', [v.plate, v.plateEn].filter(Boolean).join(' — ')],
        ['الملكية', ownerOf(v) === 'خاصة' ? 'سيارة خاصة' : 'سيارة شركة'],
        ['الفئة', v.vType],
        ['الماركة', v.brand],
        ['الطراز', v.model],
        ['سنة الصنع', v.year],
        ['اللون', v.color],
        ['نوع الوقود', v.fuel],
        ['رقم الاستمارة / السجل', v.record],
        ['رقم الهيكل', v.chassis],
        ['الفرع', v.branch],
        ['الحالة', v.status],
        ['آخر قراءة عداد', v.lastKm ? `${SF.fmtNum(v.lastKm)} كم` : ''],
      ])}
      <h4 class="l-sec">المستندات والتراخيص :</h4>
      <table class="lt grid"><thead><tr><th>المستند</th><th>تاريخ الانتهاء</th><th>الحالة</th></tr></thead><tbody>${v.docs.map((d) => `<tr><td>${esc(d.label)}</td><td>${esc(SF.fmtDate(d.date) || '—')}</td><td>${d.days === null ? '—' : d.days < 0 ? `منتهٍ منذ ${-d.days} يوم` : `باقٍ ${d.days} يوم`}</td></tr>`).join('')}</tbody></table>
      <h4 class="l-sec">العهدة والمتابعة :</h4>
      ${
        (v.moves || []).length
          ? `<h4 class="l-sec">سجل نقل المركبة بين الفروع :</h4><table class="lt grid sm"><thead><tr><th>من فرع</th><th>إلى فرع</th><th>المحضر</th><th>التاريخ</th></tr></thead><tbody>${v.moves
              .slice()
              .reverse()
              .map(
                (m) =>
                  `<tr><td>${esc(m.from || '—')}</td><td>${esc(m.to)}</td><td><bdi>${esc(m.serial)}</bdi></td><td>${esc(SF.fmtDate(m.date))}</td></tr>`,
              )
              .join('')}</tbody></table>`
          : ''
      }
      ${pairs([
        [whoOf(v).driver, v.driver],
        [whoOf(v).driverIqama, v.driverIqama],
        ['كارت المتابعة', v.followCard],
        ['آخر محضر تسليم', v.lastHandover ? `${v.lastHandover.serial} — ${SF.fmtDate(v.lastHandover.date)}` : ''],
      ])}
      ${
        v.condition
          ? `<div class="l-notes"><b>حالة المركبة في آخر محضر تسليم (${esc(v.condition.serial)} — ${esc(SF.fmtDate(v.condition.date))}) :</b><br>${
              [
                ...(v.condition.marks || []).map((m, i) => `${i + 1}- ${m.note || ''}`),
                ...String(v.condition.notes || '')
                  .split(/\n/)
                  .filter((x) => x.trim()),
              ]
                .map(esc)
                .join('<br>') || 'سليمة — لا توجد ملاحظات'
            }</div>`
          : ''
      }
      ${v.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(v.notes).replace(/\n/g, '<br>')}</div>` : ''}
      ${
        (v.violations || []).length
          ? `<h4 class="l-sec">المخالفات المرورية (${v.violations.length}) — الإجمالي : ${SF.fmtNum(v.violations.reduce((a, x) => a + Number(x.amount || 0), 0))} ريال :</h4>
      <table class="lt grid sm"><thead><tr><th>التاريخ</th><th>رقم المخالفة</th><th>النوع</th><th>المبلغ</th><th>السائق</th><th>الحالة</th></tr></thead><tbody>${v.violations.map((x) => `<tr><td>${esc(SF.fmtDate(x.date))}</td><td>${esc(x.number || '—')}</td><td>${esc(x.type || '—')}</td><td>${esc(SF.fmtNum(x.amount))}</td><td>${esc(x.driver || '—')}</td><td>${esc(x.status)}</td></tr>`).join('')}</tbody></table>`
          : ''
      }
      <h4 class="l-sec">سجل الصيانة (${v.maintenance.length}) — إجمالي التكلفة المنفذة : ${SF.fmtNum(v.totalCost) || 0} ريال :</h4>
      <table class="lt grid sm"><thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>نوع الصيانة</th><th>الجهة</th><th>الحالة</th><th>التكلفة الفعلية</th></tr></thead><tbody>
      ${v.maintenance.map((m) => `<tr><td><bdi>${esc(m.serial)}</bdi></td><td>${esc(SF.fmtDate(m.createdAt))}</td><td>${esc(m.data.mType)}</td><td>${esc(m.data.workshop)}</td><td>${esc(maintState(m))}</td><td>${esc(SF.fmtNum(((m.data.tasks || {}).mDone || {}).aTotal) || '—')}</td></tr>`).join('') || '<tr><td colspan="6">لا يوجد</td></tr>'}</tbody></table></div>`;
  }

  async function viewVehicle(id) {
    const v = await api('GET', `/api/fleet/${id}`);
    const main = shell('', '#/fleet');
    const canReq = can('new') && SF.formAllowed(state.user, 'carMaintenance');
    main.innerHTML = `${head(
      `🚚 المركبة <bdi>${esc(v.plate)}</bdi>`,
      esc([v.brand, v.model, v.year, v.branch].filter(Boolean).join(' — ')),
      `
        <button class="btn" id="vPrint">🖨️ طباعة الكارت</button>
        ${canReq ? `<a class="btn primary" href="#/new/carMaintenance?plate=${encodeURIComponent(v.plate)}">🛠️ طلب صيانة</a>` : ''}
        ${v.editor ? '<button class="btn" id="vEdit">✏️ تعديل</button><button class="btn bad" id="vDel">🗑️ حذف</button>' : ''}
        <a class="btn ghost" href="#/fleet">رجوع</a>`,
    )}
      <div class="detail"><div><div class="preview-wrap" style="max-height:none">${vehicleCard(v)}</div></div>
      <div>
        <div class="card"><h3>المستندات</h3><dl class="kv">${v.docs.map((d) => `<dt>${esc(d.label)}</dt><dd>${esc(SF.fmtDate(d.date) || '—')} ${docBadge(d)}</dd>`).join('')}</dl></div>
        <div class="card"><h3>طلبات الصيانة</h3>${v.maintenance.length ? `<ul class="files">${v.maintenance.map((m) => `<li><a href="#/req/${m.id}"><bdi>${esc(m.serial)}</bdi> — ${esc(m.data.mType)}</a><small class="muted">${esc(maintState(m))}</small></li>`).join('')}</ul>` : '<div class="muted">لا توجد</div>'}</div>
        <div class="card"><h3>المخالفات المرورية</h3>${
          (v.violations || []).length
            ? `<ul class="files">${v.violations
                .slice(0, 15)
                .map(
                  (x) =>
                    `<li><span>${esc(SF.fmtDate(x.date))} — ${esc(SF.fmtNum(x.amount))} ريال — ${esc(x.driver || 'السائق غير معروف')}</span><small class="muted">${esc(x.status)}</small></li>`,
                )
                .join('')}</ul><a class="btn sm" href="#/violations?plate=${encodeURIComponent(v.plate)}">كل مخالفات المركبة</a>`
            : '<div class="muted">لا توجد</div>'
        }</div>
        <div class="card"><h3>محاضر التسليم</h3>${v.handovers.length ? `<ul class="files">${v.handovers.map((m) => `<li><a href="#/req/${m.id}"><bdi>${esc(m.serial)}</bdi> — ${esc(m.data.name || '')}</a><small class="muted">${esc(maintState(m))}</small></li>`).join('')}</ul>` : '<div class="muted">لا توجد</div>'}</div>
      </div></div>`;
    fitLetters();
    $('#vPrint').onclick = () => {
      const w = window.open('', '_blank');
      if (!w) {
        toast('اسمح بفتح النوافذ المنبثقة للطباعة', true);
        return;
      }
      w.document
        .write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>كارت المركبة ${esc(v.plate)}</title><link rel="stylesheet" href="css/style.css"></head>
        <body class="print-page" style="background:#fff;--letter-top:${state.config.letterTopMargin || 35}mm">${vehicleCard(v)}<script>window.onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
      w.document.close();
    };
    if ($('#vEdit')) $('#vEdit').onclick = () => vehicleModal(v, () => route());
    if ($('#vDel'))
      $('#vDel').onclick = async () => {
        if (!(await askYesNo(`حذف المركبة ${v.plate}؟ تنتقل إلى سلة المحذوفات وتستطيع استرجاعها خلال 30 يوماً.`))) return;
        try {
          await api('DELETE', `/api/fleet/${v.id}`);
          toast('تم حذف المركبة');
          location.hash = '#/fleet';
        } catch (err) {
          toast(err.message, true);
        }
      };
  }

  return { viewFleet, viewVehicle };
};
