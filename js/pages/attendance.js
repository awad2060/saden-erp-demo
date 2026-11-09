'use strict';
/* صفحة «attendance» (viewAttendance) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['attendance'] = function (S) {
  const {
    $,
    $$,
    SF,
    api,
    askYesNo,
    attCell,
    attMin,
    attTags,
    can,
    downloadCsv,
    dt,
    esc,
    geofencesModal,
    head,
    prMonth,
    readXlsx,
    shell,
    toIsoDate,
    toTime,
    toast,
    today,
  } = S;
  function parseAttendance(rows) {
    const hdr = rows[0].map((x) => String(x).trim());
    const find = (re) => hdr.findIndex((h) => re.test(h));
    const iKey = find(/رقم|كود|وظيفي|هوية|إقامة|id|no|code|emp/i),
      iDate = find(/تاريخ|date/i),
      iIn = find(/دخول|حضور|in\b|check.?in/i),
      iOut = find(/خروج|انصراف|out\b|check.?out/i),
      iTime = find(/وقت|time|بصمة|punch/i);
    if (iKey < 0) throw new Error('لم نجد عمود رقم الموظف (الرقم الوظيفي أو الهوية) في الصف الأول');
    const days = {};
    for (const r of rows.slice(1)) {
      const key = String(r[iKey] || '').trim();
      if (!key) continue;
      if (iIn >= 0 || iOut >= 0) {
        const date = toIsoDate(r[iDate >= 0 ? iDate : iIn]);
        if (!date) continue;
        days[`${key}|${date}`] = { key, date, in: toTime(r[iIn]), out: toTime(r[iOut]) };
      } else {
        const raw = String(r[iTime >= 0 ? iTime : iDate] || ''),
          date = toIsoDate(iDate >= 0 && iTime >= 0 ? r[iDate] : raw),
          tm = toTime(iTime >= 0 ? raw : raw.replace(/^\S+\s*/, ''));
        if (!date || !tm) continue;
        const k = `${key}|${date}`,
          d = days[k] || (days[k] = { key, date, in: tm, out: tm });
        if (tm < d.in) d.in = tm;
        if (tm > d.out) d.out = tm;
      }
    }
    return Object.values(days).map((d) => (d.in === d.out && iIn < 0 ? { ...d, out: '' } : d));
  }

  async function viewAttendance(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/attendance');
    const month = /^\d{4}-\d{2}$/.test(query.month || '') ? query.month : today().slice(0, 7);
    const d = await api('GET', `/api/attendance?month=${month}&branch=${encodeURIComponent(query.branch || '')}`);
    const L = d.list,
      has = L.filter((x) => x.has);
    const sum = (k) => has.reduce((a, x) => a + (Number(x[k]) || 0), 0);
    renderViewAttendance(L, d, has, main, month, sum);
    const go = () => {
      location.hash = `#/attendance?month=${$('#atM').value}${$('#atB') ? `&branch=${encodeURIComponent($('#atB').value)}` : ''}`;
    };
    wireAttendance(L, go, main, month, query);
    const pinLink = (l) =>
      l && l.lat
        ? ` <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${l.lat},${l.lng}" title="مكان البصمة${l.flex ? ' (مرنة)' : ''}">📍</a>`
        : '';
    /* صورة الوجه وقت البصمة (من التطبيق) */
    const faceLink = (empId, x, k) =>
      x[`${k}Photo`]
        ? ` <a target="_blank" rel="noopener" href="/api/punch-photo/${encodeURIComponent(empId)}/${x.date}/${k}" title="صورة الوجه وقت البصمة">📷</a>`
        : '';
    $$('[data-emp]', main).forEach((tr) => {
      tr.onclick = async () => {
        const s = await api('GET', `/api/attendance/${tr.dataset.emp}?month=${month}`);
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = `<div class="modal" style="max-width:760px;width:96%"><h3 style="margin-top:0">حضور ${esc(s.name)} — ${esc(prMonth(month))}</h3>
        <div class="hint" style="margin-bottom:8px">${s.from ? `فترة ملف البصمة: ${esc(SF.fmtDate(s.from))} — ${esc(SF.fmtDate(s.to))} · ` : ''}أيام العمل ${s.work} · الحضور ${s.present} · الإجازة ${s.leave} · الغياب ${s.absent} · ${s.flex ? `نقص الساعات (دوام مرن) ${Math.floor(s.shortMin / 60)}:${String(s.shortMin % 60).padStart(2, '0')} ·` : `حضور متأخر ${attMin(s.lateMin, s.lateDays)} · حضور مبكر ${attMin(s.earlyInMin, s.earlyInDays)} · انصراف مبكر ${attMin(s.earlyOutMin, s.earlyOutDays)} · انصراف متأخر ${attMin(s.lateOutMin, s.lateOutDays)} ·`} ساعات عمل إضافي ${s.otHours}</div>
        <div class="tbl-wrap" style="max-height:60vh;overflow:auto"><table class="tbl"><thead><tr><th>اليوم</th><th>الحالة</th><th>الدخول</th><th>الخروج</th><th>${s.flex ? 'نقص الساعات' : 'الحضور / الانصراف'}</th><th>ساعات عمل إضافي</th></tr></thead><tbody>${s.days.map((x) => `<tr class="${x.status === 'غائب' ? 'pr-neg' : ''}"${x.shiftStart ? ` title="الدوام ${x.shiftStart} — ${x.shiftEnd}"` : ''}><td>${esc(SF.fmtDate(x.date))}</td><td>${esc(x.status)}</td><td>${esc(x.in || '—')}${pinLink(x.inLoc)}${faceLink(tr.dataset.emp, x, 'in')}</td><td>${esc(x.out || '—')}${pinLink(x.outLoc)}${faceLink(tr.dataset.emp, x, 'out')}</td><td>${s.flex ? (x.short ? `<b style="color:var(--bad)">${Math.floor(x.short / 60)}:${String(x.short % 60).padStart(2, '0')}</b>` : '') : attTags(x)}</td><td>${x.ot ? `<span class="att-tag ot">${x.ot} س</span>` : ''}</td></tr>`).join('')}</tbody></table></div>
        <div class="row" style="margin-top:12px"><button class="btn primary" data-x>إغلاق</button></div></div>`;
        document.body.appendChild(bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        try {
          const pa = await api('GET', `/api/punch-admin/${tr.dataset.emp}?month=${month}`);
          $('.tbl-wrap', bg).insertAdjacentHTML(
            'afterend',
            `<div class="card" style="margin:10px 0 0"><b>📱 البصمة من الجوال:</b> ${pa.device ? `مربوط بجهاز منذ ${esc(dt(pa.device.at))} <small class="muted">(${esc(pa.device.ua.slice(0, 60))})</small> ${pa.canEdit ? '<button class="btn sm bad" id="pnUnbind">إلغاء ربط الجهاز</button>' : ''}` : '<span class="muted">لا يوجد جهاز مربوط</span>'}
          ${
            pa.logs.length
              ? `<div class="muted" style="font-size:12.5px;margin-top:6px">${pa.logs
                  .slice(-15)
                  .reverse()
                  .map(
                    (l) =>
                      `${l.type === 'in' ? 'حضور' : 'انصراف'} ${esc(dt(l.at))}${l.remote ? ' (عن بُعد)' : l.dist != null ? ` — ${l.dist} م` : ''}${l.lat ? ` <a target="_blank" href="https://www.google.com/maps?q=${l.lat},${l.lng}">🗺</a>` : ''}`,
                  )
                  .join('<br>')}</div>`
              : ''
          }</div>`,
          );
          if ($('#pnUnbind', bg))
            $('#pnUnbind', bg).onclick = async () => {
              if (!(await askYesNo('إلغاء ربط جهاز البصمة؟ أول بصمة بعدها تربط الحساب بالجهاز الجديد.'))) return;
              try {
                await api('DELETE', `/api/punch-admin/${tr.dataset.emp}/device`);
                toast('تم إلغاء ربط الجهاز');
                bg.remove();
              } catch (err) {
                toast(err.message, true);
              }
            };
        } catch {
          /* غير متاح */
        }
      };
    });
  }
  /* محتوى viewAttendance (HTML) */
  function renderViewAttendance(L, d, has, main, month, sum) {
    main.innerHTML = `${head('الدوام والحضور', 'استيراد سجلات البصمة، والغياب والتأخير والإضافي لكل موظف — وتدخل الغياب والإضافي في مسير الرواتب تلقائياً', '<label class="btn primary" style="cursor:pointer">📥 استيراد ملف البصمة<input type="file" id="atFile" accept=".xlsx,.csv" hidden></label><button class="btn" id="atGeo">📍 مواقع الفروع للبصمة</button>')}
      <div class="card tk-tools"><label>الشهر <input class="in" type="month" id="atM" value="${month}" style="width:auto"></label>
        ${d.brOnly ? `<b class="dash-own">${esc(d.brOnly)}</b>` : `<select class="in" id="atB"><option value="">كل الفروع</option>${d.branches.map((b) => `<option${b === d.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select>`}
        <input class="in" id="atQ" placeholder="بحث..." style="flex:1;min-width:180px"><button class="btn" id="atXls">⬇ Excel</button></div>
      <div class="pr-kpis">${[
        ['موظفون لهم حضور', `${has.length} / ${L.length}`],
        ['أيام الغياب', sum('absent')],
        ['حضور متأخر', attMin(sum('lateMin'), sum('lateDays'))],
        ['حضور مبكر', attMin(sum('earlyInMin'), sum('earlyInDays'))],
        ['انصراف مبكر', attMin(sum('earlyOutMin'), sum('earlyOutDays'))],
        ['انصراف متأخر', attMin(sum('lateOutMin'), sum('lateOutDays'))],
        ['ساعات عمل إضافي', Math.round(sum('otHours') * 100) / 100],
        ['أيام الإجازة', sum('leave')],
      ]
        .map(([l, v]) => `<div class="card pr-k"><small>${l}</small><b>${esc(String(v))}</b></div>`)
        .join('')}</div>
      <div class="hint" style="margin-bottom:10px">ملف البصمة (Excel أو CSV): الصف الأول عناوين، وفيه عمود <b>الرقم الوظيفي أو الهوية</b>، ثم إما <b>التاريخ والوقت</b> لكل بصمة (أول بصمة دخول وآخر بصمة خروج)، أو <b>التاريخ والدخول والخروج</b> لكل يوم. أيام العمل بدون نهاية الأسبوع والعطل الرسمية (الإعدادات ← العطلات)، والتأخير والإضافي حسب سياسات الموارد البشرية.</div>
      <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>الفرع</th><th>أيام العمل</th><th>الحضور</th><th>الإجازة</th><th>الغياب</th><th class="att-h late">حضور متأخر</th><th class="att-h early">حضور مبكر</th><th class="att-h eout">انصراف مبكر</th><th class="att-h lout">انصراف متأخر</th><th class="att-h ot">ساعات عمل إضافي</th></tr></thead><tbody>
        ${L.map((x) => `<tr class="click" data-emp="${x.empId}" data-s="${esc(`${x.name} ${x.empNo}`)}"><td><b>${esc(x.name)}</b><div class="muted" style="font-size:12px">${esc(x.empNo)}</div></td><td>${esc(x.branch)}</td><td class="num">${x.work}</td><td class="num">${x.has ? x.present : '<span class="muted">لا سجلات</span>'}</td><td class="num">${x.leave || '—'}</td><td class="num">${x.absent ? `<b class="bad-t">${x.absent}</b>` : x.has ? '0' : '—'}</td><td class="num">${attCell(x.lateMin, x.lateDays, 'late')}</td><td class="num">${attCell(x.earlyInMin, x.earlyInDays, 'early')}</td><td class="num">${attCell(x.earlyOutMin, x.earlyOutDays, 'eout')}</td><td class="num">${attCell(x.lateOutMin, x.lateOutDays, 'lout')}</td><td class="num">${x.otHours ? `<span class="att-v ot">${x.otHours} س</span><small class="muted"> (${x.otDays} يوم)</small>` : '—'}</td></tr>`).join('') || '<tr><td colspan="11" class="empty">لا يوجد موظفون</td></tr>'}</tbody></table></div></div>`;
  }
  /* أحداث viewAttendance: #atM، #atB، #atGeo، #atQ، #atXls، #atFile */
  function wireAttendance(L, go, main, month, query) {
    $('#atM').onchange = go;
    if ($('#atB')) $('#atB').onchange = go;
    /* مواقع البصمة مكانها الإعدادات ← الموارد البشرية؛ ومن لا يرى الإعدادات (شئون الموظفين) تبقى له النافذة هنا */
    $('#atGeo').onclick = () => {
      if (can('settings.hr')) location.hash = '#/settings/hr';
      else geofencesModal();
    };
    $('#atQ').oninput = () => {
      const q = $('#atQ').value.trim();
      $$('tbody tr[data-s]', main).forEach((r) => {
        r.hidden = !!q && !r.dataset.s.includes(q);
      });
    };
    $('#atXls').onclick = () =>
      downloadCsv(`الحضور_${month}.csv`, [
        [
          'الرقم الوظيفي',
          'الموظف',
          'الفرع',
          'أيام العمل',
          'الحضور',
          'الإجازة',
          'الغياب',
          'حضور متأخر (أيام)',
          'حضور متأخر (دقيقة)',
          'حضور مبكر (أيام)',
          'حضور مبكر (دقيقة)',
          'انصراف مبكر (أيام)',
          'انصراف مبكر (دقيقة)',
          'انصراف متأخر (أيام)',
          'انصراف متأخر (دقيقة)',
          'ساعات عمل إضافي',
        ],
        ...L.map((x) => [
          x.empNo,
          x.name,
          x.branch,
          x.work,
          x.has ? x.present : '',
          x.leave,
          x.absent == null ? '' : x.absent,
          x.lateDays,
          x.lateMin,
          x.earlyInDays,
          x.earlyInMin,
          x.earlyOutDays,
          x.earlyOutMin,
          x.lateOutDays,
          x.lateOutMin,
          x.otHours,
        ]),
      ]);
    $('#atFile').onchange = async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      try {
        const rows = /\.csv$/i.test(f.name)
          ? (await f.text())
              .split(/\r?\n/)
              .filter(Boolean)
              .map((l) => l.split(/[,;\t]/))
          : await readXlsx(f);
        const recs = parseAttendance(rows);
        if (!recs.length) throw new Error('لم يقرأ النظام أي سجلات حضور من الملف — راجع أسماء الأعمدة');
        const x = await api('POST', '/api/attendance/import', { rows: recs });
        toast(
          `تم استيراد ${x.saved} يوم حضور${x.unmatchedCount ? ` — ${x.unmatchedCount} رقم غير موجود في سجل الموظفين` : ''}${x.outScope ? ` — ${x.outScope} خارج فرعك` : ''}`,
          !!x.unmatchedCount,
        );
        viewAttendance(query);
      } catch (err) {
        toast(err.message, true);
      }
      ev.target.value = '';
    };
  }

  return { viewAttendance };
};
