'use strict';
/* صفحة «gosi» (viewGosi) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['gosi'] = function (S) {
  const { $, $$, SF, api, askYesNo, downloadCsv, esc, head, money, readXlsx, shell, toast } = S;
  /* ---------- التأمينات الاجتماعية ---------- */
  /* تصفية الصفوف بالتبويب: مطلوب إضافة / استبعاد / اختلاف الأجر / السعوديون */
  const byTab = (f) => (x) => !f || (f === 'add' ? x.toAdd : f === 'ex' ? x.toEx : f === 'diff' ? x.diff : f === 'saudi' ? x.citizen : true);
  const gosiHead = (P) =>
    head(
      'التأمينات الاجتماعية',
      `الاشتراك الشهري بالنسب من السياسات: السعودي ${P.gosiSaudiEmp}% موظف + ${P.gosiSaudiEr}% منشأة، وغير السعودي ${P.gosiNonSaudiEmp}% + ${P.gosiNonSaudiEr}% — من الأجر الخاضع (الأساسي + السكن) بين ${P.gosiMin} و${P.gosiMax}`,
      '<label class="btn primary" style="cursor:pointer">📥 مطابقة مع كشف التأمينات<input type="file" id="gsFile" accept=".xlsx,.csv" hidden></label><button class="btn" id="gsXls">⬇ Excel</button>',
    );
  const tabsHtml = (L, f, query) => `<div class="tabs">${[
    ['', 'الكل', L.length],
    ['add', 'مطلوب إضافة', L.filter((x) => x.toAdd).length],
    ['ex', 'مطلوب استبعاد', L.filter((x) => x.toEx).length],
    ['diff', 'اختلاف الأجر', L.filter((x) => x.diff).length],
    ['saudi', 'السعوديون', L.filter((x) => x.citizen).length],
  ]
    .map(
      ([k, l, n]) =>
        `<a href="#/gosi?f=${k}${query.branch ? `&branch=${encodeURIComponent(query.branch)}` : ''}" class="${f === k ? 'on' : ''}">${l} (${n})</a>`,
    )
    .join('')}</div>`;
  const kpisHtml = (L) => {
    const sum = (k, l = L.filter((x) => !x.toEx)) => l.reduce((a, x) => a + (Number(x[k]) || 0), 0);
    return `<div class="pr-kpis">${[
      ['الأجر الخاضع (الإجمالي)', money(sum('base'))],
      ['حصة الموظفين', money(sum('emp'))],
      ['حصة المنشأة', money(sum('er'))],
      ['إجمالي الاشتراك الشهري', money(sum('emp') + sum('er'))],
      ['غير مسجلين / بدون حالة', L.filter((x) => x.toAdd).length],
    ]
      .map(([l, v]) => `<div class="card pr-k"><small>${l}</small><b>${esc(String(v))}</b></div>`)
      .join('')}</div>`;
  };
  const toolsHtml = (d) =>
    d.brOnly
      ? ''
      : `<div class="card tk-tools"><select class="in" id="gsB"><option value="">كل الفروع</option>${d.branches.map((b) => `<option${b === d.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select><input class="in" id="gsQ" placeholder="بحث..." style="flex:1"></div>`;
  const noteHtml = (x) =>
    `${x.toAdd ? '<span class="chip pending">مطلوب إضافة</span>' : ''}${x.toEx ? `<span class="chip rejected">مطلوب استبعاد (ترك ${esc(SF.fmtDate(x.leaveDate))})</span>` : ''}${x.diff ? '<span class="chip late">اختلاف الأجر</span>' : ''}`;
  const rowHtml = (
    x,
  ) => `<tr class="click" data-go="#/employee/${x.empId}" data-s="${esc(`${x.name} ${x.empNo} ${x.iqama}`)}"><td><b>${esc(x.name)}</b><div class="muted" style="font-size:12px">${esc([x.empNo, x.branch].filter(Boolean).join(' — '))}</div></td><td>${esc(x.iqama)}</td><td>${esc(x.nationality || '—')}${x.citizen ? ' <span class="chip approved">سعودي</span>' : ''}</td>
          <td>${esc(x.status || 'بدون حالة')}</td><td>${esc(x.date ? SF.fmtDate(x.date) : '—')}</td><td class="num">${esc(money(x.base))}</td><td class="num">${x.gosiWage ? `<span class="${x.diff ? 'bad-t' : ''}">${esc(money(x.gosiWage))}</span>` : '—'}</td><td class="num">${esc(money(x.emp))}</td><td class="num">${esc(money(x.er))}</td>
          <td>${noteHtml(x)}</td></tr>`;
  const tableHtml = (
    shown,
  ) => `<div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>الهوية</th><th>الجنسية</th><th>الحالة</th><th>تاريخ الاشتراك</th><th>الأجر الخاضع</th><th>المسجل في التأمينات</th><th>حصة الموظف</th><th>حصة المنشأة</th><th>ملاحظة</th></tr></thead><tbody>
        ${shown.map(rowHtml).join('') || '<tr><td colspan="10" class="empty">لا يوجد</td></tr>'}</tbody></table></div></div>`;
  /* التصدير إلى Excel (CSV) */
  const GOSI_CSV_HEAD = [
    'الرقم الوظيفي',
    'الاسم',
    'الهوية',
    'الفرع',
    'الجنسية',
    'سعودي',
    'رقم الاشتراك',
    'الحالة',
    'تاريخ الاشتراك',
    'تاريخ الاستبعاد',
    'الأجر الخاضع',
    'المسجل في التأمينات',
    'حصة الموظف',
    'حصة المنشأة',
    'مطلوب إضافة',
    'مطلوب استبعاد',
  ];
  const csvRow = (x) => [
    x.empNo,
    x.name,
    x.iqama,
    x.branch,
    x.nationality,
    x.citizen ? 'نعم' : 'لا',
    x.gosiNo,
    x.status,
    x.date,
    x.exDate,
    x.base,
    x.gosiWage || '',
    x.emp,
    x.er,
    x.toAdd ? 'نعم' : '',
    x.toEx ? 'نعم' : '',
  ];
  const bindPage = (main, f, shown) => {
    $$('[data-go]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = tr.dataset.go;
      };
    });
    if ($('#gsB'))
      $('#gsB').onchange = () => {
        location.hash = `#/gosi?f=${f}&branch=${encodeURIComponent($('#gsB').value)}`;
      };
    if ($('#gsQ'))
      $('#gsQ').oninput = () => {
        const q = $('#gsQ').value.trim();
        $$('tbody tr[data-s]', main).forEach((r) => {
          r.hidden = !!q && !r.dataset.s.includes(q);
        });
      };
    $('#gsXls').onclick = () => downloadCsv('التأمينات_الاجتماعية.csv', [GOSI_CSV_HEAD, ...shown.map(csvRow)]);
  };
  async function viewGosi(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/gosi');
    const d = await api('GET', `/api/gosi?branch=${encodeURIComponent(query.branch || '')}`);
    const L = d.list,
      P = d.policy;
    const f = query.f || '';
    const shown = L.filter(byTab(f));
    main.innerHTML = `${gosiHead(P)}
      ${tabsHtml(L, f, query)}
      ${kpisHtml(L)}
      ${toolsHtml(d)}
      <div id="gsRep"></div>
      ${tableHtml(shown)}`;
    bindPage(main, f, shown);
    $('#gsFile').onchange = reconcile;
  }

  /* مطابقة: كشف التأمينات (Excel / CSV) بعمودي رقم الهوية والأجر الخاضع */
  const readRows = async (file) =>
    /\.csv$/i.test(file.name)
      ? (await file.text())
          .split(/\r?\n/)
          .filter(Boolean)
          .map((l) => l.split(/[,;\t]/))
      : await readXlsx(file);
  const sheetData = (rows) => {
    const hdr = rows[0].map((x) => String(x).trim());
    const iI = hdr.findIndex((h) => /هوية|إقامة|اقامة|id/i.test(h)),
      iW = hdr.findIndex((h) => /أجر|اجر|راتب|wage|salary/i.test(h)),
      iN = hdr.findIndex((h) => /اسم|name/i.test(h));
    if (iI < 0 || iW < 0) throw new Error('الصف الأول يجب أن يحتوي عمود رقم الهوية وعمود الأجر الخاضع');
    return rows
      .slice(1)
      .map((r) => ({ iqama: String(r[iI] || '').trim(), wage: String(r[iW] || '').replace(/[^\d.]/g, ''), name: iN >= 0 ? r[iN] : '' }))
      .filter((r) => r.iqama);
  };
  const issueRow = (i) =>
    `<tr><td>${esc(i.iqama)}</td><td>${esc(i.name || '')}</td><td>${esc(i.issue)}</td><td class="num">${i.gosiWage ? esc(money(i.gosiWage)) : '—'}</td><td class="num">${i.calcWage ? esc(money(i.calcWage)) : '—'}</td></tr>`;
  const reportHtml = (x) =>
    `<div class="card"><div class="emp-sec-h"><h3>نتيجة المطابقة (${x.checked} سجل في الكشف — ${x.issues.length} ملاحظة)</h3><button class="btn sm" id="gsRepX">⬇ تصدير الملاحظات</button></div>${x.issues.length ? `<div class="tbl-wrap" style="max-height:40vh;overflow:auto"><table class="tbl"><thead><tr><th>الهوية</th><th>الاسم</th><th>الملاحظة</th><th>في الكشف</th><th>في السجل</th></tr></thead><tbody>${x.issues.map(issueRow).join('')}</tbody></table></div>` : '<div class="emp-al ok">✔ الكشف مطابق للسجل</div>'}</div>`;
  async function reconcile(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const data = sheetData(await readRows(file));
      const save = await askYesNo(
        `كشف التأمينات: ${data.length} سجل. هل تريد أيضاً حفظ "الأجر المسجل في التأمينات" في ملفات الموظفين المطابقين؟ (لا = عرض التقرير فقط)`,
      );
      const x = await api('POST', '/api/gosi/reconcile', { rows: data, save });
      $('#gsRep').innerHTML = reportHtml(x);
      if ($('#gsRepX'))
        $('#gsRepX').onclick = () =>
          downloadCsv('مطابقة_التأمينات.csv', [
            ['الهوية', 'الاسم', 'الملاحظة', 'في الكشف', 'في السجل'],
            ...x.issues.map((i) => [i.iqama, i.name || '', i.issue, i.gosiWage || '', i.calcWage || '']),
          ]);
      toast(save ? 'تمت المطابقة وحفظ الأجور المسجلة' : 'تمت المطابقة');
    } catch (err) {
      toast(err.message, true);
    }
    ev.target.value = '';
  }

  return { viewGosi };
};
