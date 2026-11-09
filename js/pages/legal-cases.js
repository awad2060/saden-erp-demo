'use strict';
/* صفحة «legal-cases» (viewLegalCases) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['legal-cases'] = function (S) {
  const { $, $$, LC_CLS, SF, api, downloadCsv, dt, esc, formModal, head, kv, money, shell, toast, today } = S;
  async function viewLegalCases(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/legal-cases');
    const d = await api('GET', '/api/legal/cases');
    const F = [
      { key: 'title', label: 'موضوع القضية', required: true, full: true },
      { key: 'side', label: 'صفة الشركة', type: 'select', options: ['للشركة', 'على الشركة'], required: true },
      {
        key: 'kind',
        label: 'نوع القضية',
        type: 'select',
        options: ['عمالية', 'تجارية', 'مدنية', 'جزائية', 'إدارية', 'تنفيذ', 'أحوال / أخرى'],
      },
      { key: 'opponent', label: 'الطرف الآخر' },
      { key: 'court', label: 'المحكمة / الجهة' },
      { key: 'caseNo', label: 'رقم القضية' },
      { key: 'filedDate', label: 'تاريخ القيد', type: 'date' },
      { key: 'amount', label: 'مبلغ المطالبة', type: 'number' },
      { key: 'lawyer', label: 'المحامي / الممثل' },
      { key: 'branchName', label: 'الفرع / الإدارة المعنية' },
      { key: 'status', label: 'الحالة', type: 'select', options: d.statuses },
      { key: 'nextSession', label: 'الجلسة القادمة', type: 'date' },
      { key: 'judgmentAmount', label: 'مبلغ الحكم', type: 'number' },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      { key: 'outcome', label: 'منطوق الحكم / النتيجة', type: 'textarea' },
    ];
    if (query.id) {
      const c = d.list.find((x) => x.id === query.id);
      if (!c) {
        main.innerHTML = '<div class="card empty">القضية غير موجودة</div>';
        return;
      }
      const kv = (rows) =>
        `<table class="ep-t">${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
          .join('')}</table>`;
      main.innerHTML = `${head(`${esc(c.no)} — ${esc(c.title)}`, `${c.side === 'للشركة' ? 'مرفوعة من الشركة' : 'مرفوعة على الشركة'}${c.opponent ? ` — الطرف الآخر: ${esc(c.opponent)}` : ''}`, '<button class="btn" id="lcEdit">✏️ تعديل</button><button class="btn primary" id="lcSes">➕ جلسة</button><a class="btn" href="#/legal-cases">رجوع</a>')}
        <div class="me-grid"><div class="card"><h3>بيانات القضية <span class="chip ${LC_CLS[c.status] || ''}">${esc(c.status)}</span></h3>${kv(
          [
            ['نوع القضية', c.kind],
            ['المحكمة / الجهة', c.court],
            ['رقم القضية', c.caseNo],
            ['تاريخ القيد', c.filedDate && SF.fmtDate(c.filedDate)],
            ['مبلغ المطالبة', c.amount && money(c.amount)],
            ['المحامي', c.lawyer],
            ['الفرع / الإدارة', c.branch],
            ['الجلسة القادمة', c.nextSession && SF.fmtDate(c.nextSession)],
            ['مبلغ الحكم', c.judgmentAmount && money(c.judgmentAmount)],
          ],
        )}
          ${c.notes ? `<h4 class="b-sec">ملاحظات</h4><p>${esc(c.notes).replace(/\n/g, '<br>')}</p>` : ''}${c.outcome ? `<h4 class="b-sec">منطوق الحكم / النتيجة</h4><p>${esc(c.outcome).replace(/\n/g, '<br>')}</p>` : ''}</div>
          <div class="card"><h3>الجلسات (${c.sessions.length})</h3>${
            c.sessions.length
              ? `<ul class="timeline">${c.sessions
                  .slice()
                  .reverse()
                  .map(
                    (s) =>
                      `<li><b>${esc(SF.fmtDate(s.date))}</b><div>${esc(s.summary).replace(/\n/g, '<br>')}</div>${s.next ? `<small class="muted">الجلسة التالية: ${esc(SF.fmtDate(s.next))}</small>` : ''}<small class="muted"> — ${esc(s.by)}</small></li>`,
                  )
                  .join('')}</ul>`
              : '<div class="muted">لا توجد جلسات مسجلة</div>'
          }</div>
          <div class="card"><h3>السجل</h3>${c.log
            .slice()
            .reverse()
            .map((l) => `<div class="muted" style="font-size:13px">${esc(dt(l.at))} — ${esc(l.by)}: ${esc(l.action)}</div>`)
            .join('')}</div></div>`;
      wireLegalCases2(F, c, query);
      return;
    }
    viewLegalCasesPart(F, d, main, query);
  }
  /* أحداث viewLegalCases: #lcEdit، #lcSes */
  function wireLegalCases2(F, c, query) {
    $('#lcEdit').onclick = () =>
      formModal(`تعديل ${c.no}`, F, { ...c, branchName: c.branch }, async (v) => {
        await api('PUT', `/api/legal/cases/${c.id}`, v);
        toast('تم الحفظ');
        viewLegalCases(query);
      });
    $('#lcSes').onclick = () =>
      formModal(
        'تسجيل جلسة',
        [
          { key: 'date', label: 'تاريخ الجلسة', type: 'date', required: true },
          { key: 'next', label: 'الجلسة التالية', type: 'date' },
          { key: 'summary', label: 'ما تم في الجلسة', type: 'textarea', required: true },
        ],
        { date: today() },
        async (v) => {
          await api('POST', `/api/legal/cases/${c.id}/sessions`, v);
          toast('تم تسجيل الجلسة');
          viewLegalCases(query);
        },
      );
  }
  /* جزء من viewLegalCases: const f = query.f || 'open';… */
  function viewLegalCasesPart(F, d, main, query) {
    const f = query.f || 'open';
    const closed = (x) => ['منتهية', 'مغلقة'].includes(x.status);
    const L = d.list.filter((x) =>
      f === 'open'
        ? !closed(x)
        : f === 'for'
          ? x.side === 'للشركة' && !closed(x)
          : f === 'against'
            ? x.side === 'على الشركة' && !closed(x)
            : f === 'closed'
              ? closed(x)
              : true,
    );
    const soon = d.list.filter(
      (x) =>
        !closed(x) &&
        x.nextSession &&
        x.nextSession >= today() &&
        x.nextSession <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
    );
    const sum = (l, k) => l.reduce((a, x) => a + (Number(x[k]) || 0), 0);
    renderViewLegalCases(L, closed, d, f, main, soon, sum);
    $$('[data-go]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = tr.dataset.go;
      };
    });
    wireLegalCases(F, L, main);
  }
  /* محتوى viewLegalCases (HTML) */
  function renderViewLegalCases(L, closed, d, f, main, soon, sum) {
    main.innerHTML = `${head('القضايا الخارجية', 'إدارة القضايا المرفوعة من الشركة وعليها: الجلسات والحالة والأحكام — مع تذكير قبل كل جلسة بيومين ويومها', '<button class="btn primary" id="lcNew">➕ قضية جديدة</button><button class="btn" id="lcXls">⬇ Excel</button>')}
      <div class="pr-kpis">${[
        ['قضايا جارية', d.list.filter((x) => !closed(x)).length],
        ['للشركة', d.list.filter((x) => !closed(x) && x.side === 'للشركة').length],
        ['على الشركة', d.list.filter((x) => !closed(x) && x.side === 'على الشركة').length],
        ['جلسات خلال 7 أيام', soon.length],
        [
          'مطالبات على الشركة',
          money(
            sum(
              d.list.filter((x) => !closed(x) && x.side === 'على الشركة'),
              'amount',
            ),
          ),
        ],
      ]
        .map(([l, v]) => `<div class="card pr-k"><small>${l}</small><b>${esc(String(v))}</b></div>`)
        .join('')}</div>
      <div class="tabs">${[
        ['open', 'الجارية'],
        ['for', 'للشركة'],
        ['against', 'على الشركة'],
        ['closed', 'المنتهية'],
        ['all', 'الكل'],
      ]
        .map(([k, l]) => `<a href="#/legal-cases?f=${k}" class="${f === k ? 'on' : ''}">${l}</a>`)
        .join('')}</div>
      <div class="card tk-tools"><input class="in" id="lcQ" placeholder="بحث..." style="flex:1"></div>
      <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الرقم</th><th>الموضوع</th><th>الصفة</th><th>الطرف الآخر</th><th>المحكمة</th><th>المطالبة</th><th>الجلسة القادمة</th><th>الحالة</th></tr></thead><tbody>
      ${L.map((x) => `<tr class="click" data-go="#/legal-cases?id=${x.id}" data-s="${esc(`${x.no} ${x.title} ${x.opponent} ${x.caseNo}`)}"><td>${esc(x.no)}</td><td><b>${esc(x.title)}</b><div class="muted" style="font-size:12px">${esc([x.kind, x.caseNo].filter(Boolean).join(' — '))}</div></td><td><span class="chip ${x.side === 'للشركة' ? 'approved' : 'rejected'}">${esc(x.side)}</span></td><td>${esc(x.opponent || '—')}</td><td>${esc(x.court || '—')}</td><td class="num">${x.amount ? esc(money(x.amount)) : '—'}</td><td>${x.nextSession ? `<span class="${x.nextSession <= today() ? 'bad-t' : ''}">${esc(SF.fmtDate(x.nextSession))}</span>` : '—'}</td><td><span class="chip ${LC_CLS[x.status] || ''}">${esc(x.status)}</span></td></tr>`).join('') || '<tr><td colspan="8" class="empty">لا يوجد</td></tr>'}</tbody></table></div></div>`;
  }
  /* أحداث viewLegalCases: #lcQ، #lcNew، #lcXls */
  function wireLegalCases(F, L, main) {
    $('#lcQ').oninput = () => {
      const q = $('#lcQ').value.trim();
      $$('tbody tr[data-s]', main).forEach((r) => {
        r.hidden = !!q && !r.dataset.s.includes(q);
      });
    };
    $('#lcNew').onclick = () =>
      formModal('قضية جديدة', F, { side: 'على الشركة', status: 'جديدة' }, async (v) => {
        const c = await api('POST', '/api/legal/cases', v);
        toast('تم تسجيل القضية');
        location.hash = `#/legal-cases?id=${c.id}`;
      });
    $('#lcXls').onclick = () =>
      downloadCsv('القضايا.csv', [
        [
          'الرقم',
          'الموضوع',
          'الصفة',
          'النوع',
          'الطرف الآخر',
          'المحكمة',
          'رقم القضية',
          'تاريخ القيد',
          'المطالبة',
          'المحامي',
          'الجلسة القادمة',
          'الحالة',
          'مبلغ الحكم',
        ],
        ...L.map((x) => [
          x.no,
          x.title,
          x.side,
          x.kind,
          x.opponent,
          x.court,
          x.caseNo,
          x.filedDate,
          x.amount,
          x.lawyer,
          x.nextSession,
          x.status,
          x.judgmentAmount,
        ]),
      ]);
  }

  return { viewLegalCases };
};
