'use strict';
/* صفحة «investigations» (viewInvestigations) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['investigations'] = function (S) {
  const { $, $$, SF, api, downloadCsv, dt, esc, formModal, head, kv, money, shell, toast, today } = S;
  /* ---------- التحقيقات الإدارية والأحكام ---------- */
  async function viewInvestigations(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/investigations');
    const d = await api('GET', '/api/legal/investigations');
    const emps = (await api('GET', '/api/emp-lookup').catch(() => ({ list: [] }))).list || [];
    const IC = { مفتوح: 'pending', 'قيد التحقيق': 'pending', 'صدر قرار': 'approved', تظلم: 'late', مغلق: '' };
    const pickEmpField = { key: 'emp', label: 'الموظف (ابحث بالاسم أو الرقم الوظيفي أو الهوية)', required: true, full: true };
    const F = [
      { key: 'subject', label: 'موضوع المخالفة / التحقيق', required: true, full: true },
      { key: 'incidentDate', label: 'تاريخ الواقعة', type: 'date' },
      { key: 'referredBy', label: 'المحيل (من أحال للتحقيق)' },
      { key: 'investigator', label: 'المحقق' },
      { key: 'status', label: 'الحالة', type: 'select', options: d.statuses },
      { key: 'details', label: 'تفاصيل الواقعة', type: 'textarea' },
    ];
    const openNew = () => {
      const bg = formModal('فتح تحقيق إداري', [pickEmpField, ...F], { status: 'مفتوح' }, async (v) => {
        const q = String(v.emp || '').trim();
        const e = emps.find(
          (y) => `${y.empNo ? `${y.empNo} — ` : ''}${y.nameAr}` === q || y.empNo === q || y.iqama === q || y.nameAr === q,
        );
        if (!e) throw new Error('اختر الموظف من القائمة');
        const x = await api('POST', '/api/legal/investigations', { ...v, empId: e.id });
        toast('تم فتح التحقيق');
        location.hash = `#/investigations?id=${x.id}`;
      });
      const inp = $('[data-key="emp"]', bg);
      inp.setAttribute('list', 'dl-inv-emps');
      inp.insertAdjacentHTML(
        'afterend',
        `<datalist id="dl-inv-emps">${emps.map((y) => `<option value="${esc(`${y.empNo ? `${y.empNo} — ` : ''}${y.nameAr}`)}">${esc(y.iqama || '')}</option>`).join('')}</datalist>`,
      );
    };
    if (query.id) {
      const x = d.list.find((y) => y.id === query.id);
      if (!x) {
        main.innerHTML = '<div class="card empty">التحقيق غير موجود</div>';
        return;
      }
      const kv = (rows) =>
        `<table class="ep-t">${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
          .join('')}</table>`;
      const D = x.decision;
      main.innerHTML = `${head(`${esc(x.no)} — ${esc(x.subject)}`, `${esc(x.name)}${x.empNo ? ` (${esc(x.empNo)})` : ''} — ${esc(x.branch || '')}`, `<button class="btn" id="ivEdit">✏️ تعديل</button><button class="btn" id="ivMin">📝 محضر</button><button class="btn primary" id="ivDec">⚖️ ${D ? 'تعديل القرار' : 'إصدار القرار'}</button><a class="btn" href="#/investigations">رجوع</a>`)}
        <div class="me-grid"><div class="card"><h3>بيانات التحقيق <span class="chip ${IC[x.status] || ''}">${esc(x.status)}</span></h3>${kv(
          [
            ['الموظف', x.name],
            ['الهوية', x.iqama],
            ['الوظيفة', x.job],
            ['الفرع', x.branch],
            ['تاريخ الواقعة', x.incidentDate && SF.fmtDate(x.incidentDate)],
            ['المحيل', x.referredBy],
            ['المحقق', x.investigator],
          ],
        )}${x.details ? `<h4 class="b-sec">تفاصيل الواقعة</h4><p>${esc(x.details).replace(/\n/g, '<br>')}</p>` : ''}</div>
          <div class="card"><h3>⚖️ القرار</h3>${
            D
              ? `${kv([
                  ['الجزاء', D.penalty],
                  ['عدد الأيام', D.days],
                  ['مبلغ الحسم', D.amount && money(D.amount)],
                  ['تاريخ القرار', SF.fmtDate(D.date)],
                  ['أصدره', D.by],
                ])}<p>${esc(D.text).replace(/\n/g, '<br>')}</p>
            ${/غرامة|إيقاف/.test(D.penalty) ? `<div class="row" style="gap:8px;flex-wrap:wrap">${x.dedRequests.length ? x.dedRequests.map((r) => `<a class="chip ${r.cancelled ? 'rejected' : r.status === 'approved' ? 'approved' : 'pending'}" href="#/req/${r.id}">طلب الخصم ${esc(r.serial)}${r.cancelled ? ' (ملغى)' : ''}</a>`).join('') : ''}<a class="btn sm primary" href="#/new/legalDeduction?inv=${x.id}">➕ رفع طلب خصم من الشئون القانونية</a></div>` : ''}`
              : '<div class="muted">لم يصدر قرار بعد</div>'
          }</div>
          <div class="card"><h3>محاضر التحقيق (${x.minutes.length})</h3>${x.minutes.length ? `<ul class="timeline">${x.minutes.map((m) => `<li><b>${esc(SF.fmtDate(m.date))}</b>${m.party ? ` <small class="muted">(${esc(m.party)})</small>` : ''}<div>${esc(m.text).replace(/\n/g, '<br>')}</div><small class="muted">${esc(m.by)}</small></li>`).join('')}</ul>` : '<div class="muted">لا توجد محاضر</div>'}</div>
          <div class="card"><h3>السجل</h3>${x.log
            .slice()
            .reverse()
            .map((l) => `<div class="muted" style="font-size:13px">${esc(dt(l.at))} — ${esc(l.by)}: ${esc(l.action)}</div>`)
            .join('')}</div></div>`;
      wireInvestigations2(D, F, d, query, x);
      return;
    }
    viewInvestigationsPart(IC, d, main, openNew, query);
  }
  /* أحداث viewInvestigations: #ivEdit، #ivMin، #ivDec */
  function wireInvestigations2(D, F, d, query, x) {
    $('#ivEdit').onclick = () =>
      formModal(`تعديل ${x.no}`, F, x, async (v) => {
        await api('PUT', `/api/legal/investigations/${x.id}`, { ...v, empId: x.empId });
        toast('تم الحفظ');
        viewInvestigations(query);
      });
    $('#ivMin').onclick = () =>
      formModal(
        'محضر تحقيق',
        [
          { key: 'date', label: 'التاريخ', type: 'date' },
          { key: 'party', label: 'المستجوَب', type: 'select', options: ['الموظف المحال', 'شاهد', 'المدير المباشر', 'أخرى'] },
          { key: 'text', label: 'نص المحضر (الأسئلة والإجابات / الدفاع)', type: 'textarea', required: true, rows: 6 },
        ],
        { date: today(), party: 'الموظف المحال' },
        async (v) => {
          await api('POST', `/api/legal/investigations/${x.id}/minutes`, v);
          toast('تم حفظ المحضر');
          viewInvestigations(query);
        },
      );
    $('#ivDec').onclick = () =>
      formModal(
        'قرار التحقيق',
        [
          { key: 'penalty', label: 'الجزاء', type: 'select', options: d.penalties, required: true },
          { key: 'date', label: 'تاريخ القرار', type: 'date' },
          { key: 'days', label: 'عدد الأيام (للحسم أو الإيقاف)', type: 'number' },
          { key: 'amount', label: 'مبلغ الحسم (ريال)', type: 'number' },
          { key: 'text', label: 'نص القرار وأسبابه', type: 'textarea', required: true, rows: 5 },
        ],
        D || { date: today() },
        async (v) => {
          await api('POST', `/api/legal/investigations/${x.id}/decision`, v);
          toast('صدر القرار وسُجل في ملف الموظف');
          viewInvestigations(query);
        },
      );
  }
  /* جزء من viewInvestigations: const f = query.f || 'open';… */
  function viewInvestigationsPart(IC, d, main, openNew, query) {
    const f = query.f || 'open';
    const L = d.list.filter((x) =>
      f === 'open'
        ? !['صدر قرار', 'مغلق'].includes(x.status)
        : f === 'decided'
          ? x.status === 'صدر قرار'
          : f === 'closed'
            ? x.status === 'مغلق'
            : true,
    );
    renderViewInvestigations(IC, L, d, f, main);
    $$('[data-go]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = tr.dataset.go;
      };
    });
    wireInvestigations(L, main, openNew);
  }
  /* محتوى viewInvestigations (HTML) */
  function renderViewInvestigations(IC, L, d, f, main) {
    main.innerHTML = `${head('التحقيقات الإدارية والأحكام', 'التحقيق مع الموظفين: المحاضر والقرار (الجزاء) — ويُسجَّل الجزاء في ملف الموظف، ويُرفع طلب الخصم الناتج عن التحقيق بضغطة', '<button class="btn primary" id="ivNew">➕ تحقيق جديد</button><button class="btn" id="ivXls">⬇ Excel</button>')}
      <div class="tabs">${[
        ['open', 'الجارية'],
        ['decided', 'صدر قرار'],
        ['closed', 'مغلقة'],
        ['all', 'الكل'],
      ]
        .map(
          ([k, l]) =>
            `<a href="#/investigations?f=${k}" class="${f === k ? 'on' : ''}">${l} (${d.list.filter((x) => (k === 'open' ? !['صدر قرار', 'مغلق'].includes(x.status) : k === 'decided' ? x.status === 'صدر قرار' : k === 'closed' ? x.status === 'مغلق' : true)).length})</a>`,
        )
        .join('')}</div>
      <div class="card tk-tools"><input class="in" id="ivQ" placeholder="بحث..." style="flex:1"></div>
      <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الرقم</th><th>الموظف</th><th>الموضوع</th><th>تاريخ الواقعة</th><th>المحاضر</th><th>القرار</th><th>الحالة</th></tr></thead><tbody>
      ${L.map((x) => `<tr class="click" data-go="#/investigations?id=${x.id}" data-s="${esc(`${x.no} ${x.name} ${x.iqama} ${x.subject}`)}"><td>${esc(x.no)}</td><td><b>${esc(x.name)}</b><div class="muted" style="font-size:12px">${esc([x.empNo, x.branch].filter(Boolean).join(' — '))}</div></td><td>${esc(x.subject)}</td><td>${esc(x.incidentDate ? SF.fmtDate(x.incidentDate) : '—')}</td><td class="num">${x.minutes.length}</td><td>${x.decision ? esc(x.decision.penalty) : '—'}</td><td><span class="chip ${IC[x.status] || ''}">${esc(x.status)}</span></td></tr>`).join('') || '<tr><td colspan="7" class="empty">لا يوجد</td></tr>'}</tbody></table></div></div>`;
  }
  /* أحداث viewInvestigations: #ivQ، #ivNew، #ivXls */
  function wireInvestigations(L, main, openNew) {
    $('#ivQ').oninput = () => {
      const q = $('#ivQ').value.trim();
      $$('tbody tr[data-s]', main).forEach((r) => {
        r.hidden = !!q && !r.dataset.s.includes(q);
      });
    };
    $('#ivNew').onclick = openNew;
    $('#ivXls').onclick = () =>
      downloadCsv('التحقيقات.csv', [
        ['الرقم', 'الموظف', 'الهوية', 'الفرع', 'الموضوع', 'تاريخ الواقعة', 'المحقق', 'الحالة', 'الجزاء', 'تاريخ القرار'],
        ...L.map((x) => [
          x.no,
          x.name,
          x.iqama,
          x.branch,
          x.subject,
          x.incidentDate,
          x.investigator,
          x.status,
          x.decision ? x.decision.penalty : '',
          x.decision ? x.decision.date : '',
        ]),
      ]);
  }

  return { viewInvestigations };
};
