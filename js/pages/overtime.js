'use strict';
/* صفحة «overtime» (viewMyOvertime، viewOtApprovals) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['overtime'] = function (S) {
  const { $, $$, OT_ST, SF, api, askText, askYesNo, can, dt, esc, head, prMonth, shell, toast, today } = S;
  async function viewMyOvertime(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/my-overtime');
    let d;
    try {
      d = await api('GET', `/api/overtime?month=${encodeURIComponent(query.month || '')}`);
    } catch (err) {
      main.innerHTML = `${head('عملي الإضافي', '')}<div class="card empty">${esc(err.message)}</div>`;
      return;
    }
    const draw = () => {
      const s = d.sheet,
        open = ['open', 'returned'].includes(s.status),
        st = OT_ST[s.status] || ['', s.status];
      const last = s.log && s.log.length ? s.log[s.log.length - 1] : null;
      main.innerHTML = `${head('عملي الإضافي', 'سجّل ساعات العمل الإضافي يوماً بيوم — وفي نهاية الشهر يرفع النظام الكشف تلقائياً لمدير الفرع للاعتماد أو التعديل، ثم يدخل في مسير الرواتب', open && s.days.length ? '<button class="btn primary" id="otSub">📤 رفع للاعتماد الآن</button>' : '')}
        <div class="card tk-tools"><label>الشهر <input class="in" type="month" id="otM" value="${d.month}" style="width:auto"></label><span class="chip ${st[0]}">${esc(st[1])}</span>${d.months.length ? `<small class="muted">أشهر سابقة: ${d.months.map((x) => `<a href="#/my-overtime?month=${x.month}">${esc(x.month)}</a>`).join(' · ')}</small>` : ''}</div>
        ${s.status === 'returned' && last ? `<div class="emp-al warn">أعاده المعتمد للتعديل: ${esc(last.note || '')}</div>` : ''}
        <div class="pr-kpis">${[
          ['الأيام', s.days.length],
          ['الساعات المسجلة', s.total],
          ['الساعات المعتمدة', s.approvedTotal == null ? '—' : s.approvedTotal],
        ]
          .map(([l, v]) => `<div class="card pr-k"><small>${l}</small><b>${esc(String(v))}</b></div>`)
          .join('')}</div>
        ${open ? `<div class="card"><h3>تسجيل يوم</h3><div class="grid2" style="grid-template-columns:160px 120px 1fr auto;align-items:end"><div class="field"><label>اليوم</label><input class="in" type="date" id="otD" value="${today().slice(0, 7) === d.month ? today() : `${d.month}-01`}" min="${d.month}-01" max="${d.month}-31"></div><div class="field"><label>الساعات</label><input class="in" type="number" id="otH" min="0.25" max="16" step="0.25"></div><div class="field"><label>وصف العمل</label><input class="in" id="otT" placeholder="ماذا أنجزت في الوقت الإضافي"></div><button class="btn primary" id="otAdd">➕ حفظ</button></div></div>` : ''}
        <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>اليوم</th><th>الساعات</th><th>الوصف</th>${s.status === 'approved' ? '<th>المعتمد</th><th>سبب التعديل</th>' : ''}${open ? '<th></th>' : ''}</tr></thead><tbody>
        ${s.days.map((x) => `<tr><td>${esc(SF.fmtDate(x.date))}</td><td class="num">${x.hours}</td><td>${esc(x.desc)}</td>${s.status === 'approved' ? `<td class="num"><b class="${Number(x.appHours) !== Number(x.hours) ? 'bad-t' : ''}">${x.appHours}</b></td><td>${esc(x.note || '')}</td>` : ''}${open ? `<td><button class="btn sm bad" data-del="${x.date}">✕</button></td>` : ''}</tr>`).join('') || '<tr><td colspan="5" class="empty">لا توجد أيام مسجلة</td></tr>'}</tbody></table></div></div>`;
      $('#otM').onchange = () => {
        location.hash = `#/my-overtime?month=${$('#otM').value}`;
      };
      const run = async (fn) => {
        try {
          d.sheet = (await fn()).sheet;
          draw();
        } catch (err) {
          toast(err.message, true);
        }
      };
      if ($('#otAdd'))
        $('#otAdd').onclick = () =>
          run(() => api('POST', '/api/overtime', { month: d.month, date: $('#otD').value, hours: $('#otH').value, desc: $('#otT').value }));
      $$('[data-del]', main).forEach((b) => {
        b.onclick = () => run(() => api('DELETE', `/api/overtime?month=${d.month}&date=${b.dataset.del}`));
      });
      if ($('#otSub'))
        $('#otSub').onclick = async () => {
          if (await askYesNo('رفع كشف هذا الشهر لمدير الفرع للاعتماد؟ لن تستطيع تعديله بعد الرفع إلا إذا أعاده إليك المعتمد.'))
            run(() => api('POST', '/api/overtime/submit', { month: d.month }));
        };
    };
    draw();
  }

  /* ---------- اعتماد العمل الإضافي (مدير الفرع) ---------- */
  async function viewOtApprovals(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/ot-approvals');
    if (query.id) {
      const x = await api('GET', `/api/ot-approvals/${query.id}`);
      const s = x.sheet,
        can = s.status === 'submitted';
      main.innerHTML = `${head(`كشف العمل الإضافي — ${esc(x.name)}`, `${esc(x.empNo)} · ${esc(x.branch)} · ${esc(prMonth(x.month))} · ${x.total} ساعة في ${x.days} يوم`, '<a class="btn" href="#/ot-approvals">رجوع</a>')}
        <div class="card"><span class="chip ${(OT_ST[s.status] || [''])[0]}">${esc((OT_ST[s.status] || ['', s.status])[1])}</span>${s.decidedByName ? ` <small class="muted">بواسطة ${esc(s.decidedByName)}</small>` : ''}
          ${can ? '<p class="hint">عدّل الساعات المعتمدة لأي يوم عند الحاجة مع كتابة سبب التعديل أمامه، ثم اعتمد الكشف.</p>' : ''}</div>
        <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>اليوم</th><th>المسجل</th><th>وصف العمل</th><th>المعتمد</th><th>سبب التعديل</th></tr></thead><tbody>
        ${s.days.map((d) => `<tr data-day="${d.date}"><td>${esc(SF.fmtDate(d.date))}</td><td class="num">${d.hours}</td><td>${esc(d.desc)}</td><td>${can ? `<input class="in" type="number" min="0" max="16" step="0.25" data-h value="${d.hours}" style="max-width:90px">` : `<b>${d.appHours != null ? d.appHours : '—'}</b>`}</td><td>${can ? '<input class="in" data-n placeholder="مطلوب عند التعديل">' : esc(d.note || '')}</td></tr>`).join('')}</tbody></table></div></div>
        ${can ? '<div class="ferr"></div><div class="row save-bar"><button class="btn primary" id="oaOk">✔ اعتماد الكشف</button><button class="btn" id="oaRet">↩ إعادة للموظف</button></div>' : ''}
        <div class="card"><h3>السجل</h3>${(s.log || []).map((l) => `<div class="muted" style="font-size:13px">${esc(dt(l.at))} — ${esc(l.by)}: ${esc(l.action)}${l.note ? ` (${esc(l.note)})` : ''}</div>`).join('')}</div>`;
      if ($('#oaOk'))
        $('#oaOk').onclick = async () => {
          const days = $$('tr[data-day]', main).map((tr) => ({
            date: tr.dataset.day,
            appHours: $('[data-h]', tr).value,
            note: $('[data-n]', tr).value,
          }));
          try {
            await api('POST', `/api/ot-approvals/${query.id}`, { action: 'approve', days });
            toast('تم اعتماد الكشف');
            location.hash = '#/ot-approvals';
          } catch (err) {
            $('.ferr', main).innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      if ($('#oaRet'))
        $('#oaRet').onclick = async () => {
          const note = await askText('إعادة الكشف للموظف', 'سبب الإعادة');
          if (note === null) return;
          try {
            await api('POST', `/api/ot-approvals/${query.id}`, { action: 'return', note });
            toast('أعدت الكشف للموظف');
            location.hash = '#/ot-approvals';
          } catch (err) {
            toast(err.message, true);
          }
        };
      return;
    }
    const st = ['submitted', 'approved', 'returned', 'all'].includes(query.status) ? query.status : 'submitted';
    const d = await api('GET', `/api/ot-approvals?status=${st}`);
    main.innerHTML = `${head('اعتماد العمل الإضافي', 'كشوف العمل الإضافي الشهرية لموظفي فرعك — اعتمد أو عدّل الساعات مع ذكر السبب')}
      <div class="tabs">${[
        ['submitted', 'بانتظار الاعتماد'],
        ['approved', 'معتمدة'],
        ['returned', 'معادة'],
        ['all', 'الكل'],
      ]
        .map(([k, l]) => `<a href="#/ot-approvals?status=${k}" class="${st === k ? 'on' : ''}">${l}</a>`)
        .join('')}</div>
      <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>الفرع</th><th>الشهر</th><th>الأيام</th><th>الساعات</th><th>الحالة</th><th>رُفع</th></tr></thead><tbody>
      ${d.list.map((x) => `<tr class="click" data-go="#/ot-approvals?id=${x.id}"><td><b>${esc(x.name)}</b> <small class="muted">${esc(x.empNo)}</small></td><td>${esc(x.branch)}</td><td>${esc(prMonth(x.month))}</td><td class="num">${x.days}</td><td class="num">${x.total}</td><td><span class="chip ${(OT_ST[x.status] || [''])[0]}">${esc((OT_ST[x.status] || ['', x.status])[1])}</span></td><td>${esc(x.submittedAt ? dt(x.submittedAt) : '')}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">لا يوجد</td></tr>'}</tbody></table></div></div>`;
    $$('[data-go]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = tr.dataset.go;
      };
    });
  }

  return { viewMyOvertime, viewOtApprovals };
};
