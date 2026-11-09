'use strict';
/* صفحة «contracts» (viewContracts) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['contracts'] = function (S) {
  const { $, $$, SF, api, downloadCsv, esc, head, shell, toast, today } = S;
  /* ---------- العقود: الحالة والتجديد وتنبيه المادة 55 ---------- */
  async function viewContracts(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/contracts');
    const d = await api('GET', `/api/contracts?branch=${encodeURIComponent(query.branch || '')}`);
    const f = query.f || '';
    const L = d.list,
      F = {
        soon: (x) => x.state === 'ينتهي قريباً',
        expired: (x) => x.state.startsWith('منتهي'),
        nodate: (x) => x.state === 'بدون تاريخ انتهاء',
        open: (x) => !x.fixed,
        art55: (x) => x.art55,
      };
    const shown = L.filter((x) => !f || (F[f] && F[f](x))).sort(
      (a, b) => (a.left === null ? 1e9 : a.left) - (b.left === null ? 1e9 : b.left),
    );
    const cls = {
      منتهي: 'rejected',
      'ينتهي قريباً': 'late',
      ساري: 'approved',
      'غير محدد المدة': 'approved',
      'بدون تاريخ انتهاء': 'pending',
    };
    renderViewContracts(F, L, cls, d, f, main, query, shown);
    wireContracts(f, main, shown);
    $$('[data-renew]', main).forEach((b) => {
      b.onclick = () => {
        const x = L.find((y) => y.empId === b.dataset.renew);
        const from = x.end ? new Date(new Date(`${x.end}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10) : today();
        const to = new Date(`${from}T00:00:00Z`);
        to.setUTCFullYear(to.getUTCFullYear() + 1);
        to.setUTCDate(to.getUTCDate() - 1);
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = `<div class="modal" style="max-width:520px"><h3 style="margin-top:0">تجديد عقد ${esc(x.name)}</h3>
        <div class="hint">العقد الحالي: ${esc(x.type || '—')}${x.end ? ` ينتهي ${esc(SF.fmtDate(x.end))}` : ''} — يحفظه النظام في «سجل العقود» بملف الموظف.${x.art55 ? '<br><b>تنبيه المادة 55:</b> يعدّ النظام العقد غير محدد المدة.' : ''}</div>
        <div class="grid2"><div class="field"><label>نوع العقد الجديد</label><select class="in" id="rnT"><option${x.art55 ? '' : ' selected'}>محدد</option><option${x.art55 ? ' selected' : ''}>غير محدد</option></select></div><div class="field"><label>من</label><input class="in" type="date" id="rnF" value="${from}"></div>
          <div class="field" id="rnToBox"><label>إلى</label><input class="in" type="date" id="rnTo" value="${to.toISOString().slice(0, 10)}"></div><div class="field"><label>ملاحظة</label><input class="in" id="rnN" placeholder="مثال: تجديد سنة بنفس الشروط"></div></div>
        <div class="merr"></div><div class="row" style="margin-top:12px"><button class="btn primary" id="rnOk">حفظ التجديد</button><button class="btn" data-x>إلغاء</button></div></div>`;
        document.body.appendChild(bg);
        const tog = () => {
          $('#rnToBox', bg).hidden = $('#rnT', bg).value === 'غير محدد';
        };
        tog();
        $('#rnT', bg).onchange = tog;
        $('[data-x]', bg).onclick = () => bg.remove();
        $('#rnOk', bg).onclick = async () => {
          try {
            await api('POST', `/api/contracts/${x.empId}/renew`, {
              type: $('#rnT', bg).value,
              from: $('#rnF', bg).value,
              to: $('#rnTo', bg).value,
              note: $('#rnN', bg).value,
            });
            bg.remove();
            toast('تم تجديد العقد');
            viewContracts(query);
          } catch (err) {
            $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      };
    });
  }
  /* محتوى viewContracts (HTML) */
  function renderViewContracts(F, L, cls, d, f, main, query, shown) {
    main.innerHTML = `${head('العقود', 'حالة عقد كل موظف وتجديده — والتنبيه قبل الانتهاء بـ 60 و30 يوماً يصل لشئون الموظفين ومحاسب الفرع تلقائياً', '<button class="btn" id="ctXls">⬇ Excel</button>')}
      <div class="tabs">${[
        ['', 'الكل', L.length],
        ['soon', 'ينتهي خلال 60 يوماً', L.filter(F.soon).length],
        ['expired', 'منتهي', L.filter(F.expired).length],
        ['nodate', 'بدون تاريخ انتهاء', L.filter(F.nodate).length],
        ['open', 'غير محدد المدة', L.filter(F.open).length],
        ['art55', 'تنبيه المادة 55', L.filter(F.art55).length],
      ]
        .map(
          ([k, l, n]) =>
            `<a href="#/contracts?f=${k}${query.branch ? `&branch=${encodeURIComponent(query.branch)}` : ''}" class="${f === k ? 'on' : ''}">${l} (${n})</a>`,
        )
        .join('')}</div>
      ${f === 'art55' ? '<div class="hint" style="margin-bottom:10px">المادة 55 من نظام العمل: عقد العامل السعودي محدد المدة يصبح غير محدد المدة إذا تجدد ثلاث مرات متتالية أو بلغت مدة العقد الأصلي مع التجديد أربع سنوات (أيهما أقل).</div>' : ''}
      ${d.brOnly ? '' : `<div class="card tk-tools"><select class="in" id="ctB"><option value="">كل الفروع</option>${d.branches.map((b) => `<option${b === d.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select><input class="in" id="ctQ" placeholder="بحث..." style="flex:1"></div>`}
      <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>الفرع</th><th>نوع العقد</th><th>البداية</th><th>النهاية</th><th>المتبقي</th><th>التجديدات</th><th>الحالة</th>${d.canRenew ? '<th></th>' : ''}</tr></thead><tbody>
      ${
        shown
          .map(
            (
              x,
            ) => `<tr data-s="${esc(`${x.name} ${x.empNo}`)}"><td><a href="#/employee/${x.empId}"><b>${esc(x.name)}</b></a><div class="muted" style="font-size:12px">${esc([x.empNo, x.title].filter(Boolean).join(' — '))}</div></td><td>${esc(x.branch)}</td><td>${esc(x.type || '—')}</td><td>${esc(x.start ? SF.fmtDate(x.start) : x.joinDate ? SF.fmtDate(x.joinDate) : '—')}</td><td>${esc(x.end ? SF.fmtDate(x.end) : '—')}</td>
        <td class="num">${x.left === null ? '—' : x.left < 0 ? `<b class="bad-t">منذ ${-x.left} يوم</b>` : `${x.left} يوم`}</td><td class="num">${x.renewals || '—'}</td><td><span class="chip ${cls[x.state] || (x.state.startsWith('منتهي') ? 'rejected' : '')}">${esc(x.state)}</span>${x.art55 ? ' <span class="chip late" title="المادة 55">م 55</span>' : ''}</td>
        ${d.canRenew ? `<td><button class="btn sm" data-renew="${x.empId}">🔁 تجديد</button></td>` : ''}</tr>`,
          )
          .join('') || `<tr><td colspan="${d.canRenew ? 9 : 8}" class="empty">لا يوجد</td></tr>`
      }</tbody></table></div></div>`;
  }
  /* أحداث viewContracts: #ctB، #ctQ، #ctXls */
  function wireContracts(f, main, shown) {
    if ($('#ctB'))
      $('#ctB').onchange = () => {
        location.hash = `#/contracts?f=${f}&branch=${encodeURIComponent($('#ctB').value)}`;
      };
    if ($('#ctQ'))
      $('#ctQ').oninput = () => {
        const q = $('#ctQ').value.trim();
        $$('tbody tr[data-s]', main).forEach((r) => {
          r.hidden = !!q && !r.dataset.s.includes(q);
        });
      };
    $('#ctXls').onclick = () =>
      downloadCsv('العقود.csv', [
        [
          'الرقم الوظيفي',
          'الاسم',
          'الفرع',
          'المسمى',
          'الجنسية',
          'نوع العقد',
          'البداية',
          'النهاية',
          'المتبقي (يوم)',
          'التجديدات',
          'الحالة',
          'تنبيه المادة 55',
        ],
        ...shown.map((x) => [
          x.empNo,
          x.name,
          x.branch,
          x.title,
          x.nationality,
          x.type,
          x.start,
          x.end,
          x.left == null ? '' : x.left,
          x.renewals,
          x.state,
          x.art55 ? 'نعم' : '',
        ]),
      ]);
  }

  return { viewContracts };
};
