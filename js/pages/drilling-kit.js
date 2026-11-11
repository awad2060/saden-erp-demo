'use strict';
/* أجزاء صفحات قسم الحفر (1) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['drilling'] = function (S, ctx) {
  const {
    $,
    $$,
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
  const { drillCrewModal, drillProjectModal } = ctx;
  /* جزء من viewDrillProject: (p.rigs || []).length ? p.rigs : p.rigsAll || []… */
  function drillProjectValue2(p) {
    return (p.rigs || []).length ? p.rigs : p.rigsAll || [];
  }
  /* جزء من viewDrillProject: const ex = p.expenses || {};… */
  function viewDrillProjectPart5(EXP, crew, ed, holes, id, main, p, pageState, reload, rigs, sumM) {
    const ex = p.expenses || {};
    /* الإجماليات من js/drill-calc.js (مختبرة): كلها من مبالغ السطور المقرّبة نفسها فلا يختلف إجمالي المشروع عن مجموع بنوده */
    const D = window.SADEN_DRILL;
    const expTotal = D.expTotal(ex);
    /* Excel المصروفات: شهر محدد، أو ورقة لكل شهر مع ورقة ملخص */
    const expRows = () =>
      EXP.flatMap(([k, l, cols, f]) =>
        (ex[k] || []).map((r) => ({
          month: String(r.date || '').slice(0, 7),
          date: r.date || '',
          kind: k,
          sec: l,
          desc: cols
            .filter((c) => c.type !== 'date' && c.type !== 'number')
            .map((c) => r[c.key])
            .filter(Boolean)
            .join(' — '),
          detail:
            k === 'housing' || k === 'guards'
              ? `${r.monthly || 0} × ${r.months || 1} شهر`
              : k === 'water'
                ? `${r.truckCost || 0} × ${r.count || 0} وايت${r.from ? ` (${r.from} → ${r.to || ''})` : ''}`
                : '',
          amount: Math.round(f(r) * 100) / 100,
        })),
      ).sort((a, b) => a.date.localeCompare(b.date));
    const monthName = (m) => {
      const [y, mm] = m.split('-');
      return m
        ? `${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][Number(mm) - 1] || mm} ${y}`
        : 'بدون تاريخ';
    };
    const sheetOf = (xs, title) => [
      [`مصروفات مشروع: ${p.name}`],
      [title],
      [],
      ['التاريخ', 'البند', 'البيان', 'التفاصيل', 'المبلغ (ريال)'],
      ...xs.map((x) => [x.date, x.sec, x.desc, x.detail, x.amount]),
      [],
      ['', '', '', 'الإجمالي', Math.round(xs.reduce((a, x) => a + x.amount, 0) * 100) / 100],
    ];
    /* المصروفات: تاب لكل شهر بأسلوب جوجل + تاب الإجمالي، وتسجيل الشهر من تابه */
    const allX = expRows();
    const inMonth = (r, m) => String(r.date || '').startsWith(m);
    const curM = today().slice(0, 7);
    const nextOf = (m) => {
      const [y, mm] = m.split('-').map(Number);
      return mm === 12 ? `${y + 1}-01` : `${y}-${String(mm + 1).padStart(2, '0')}`;
    };
    viewDrillProjectPart4(allX, curM, ed, id, pageState);
    const r2 = (n) => Math.round(n * 100) / 100;
    const mSum = (m) => D.sum(allX, { month: m });
    const secSum = (m, l) => D.sum(allX, { month: m, kind: EXP.find((e) => e[1] === l)[0] });
    const drawTabs = () => {
      $('#expTabs').innerHTML =
        `<a href="#" class="gtab${pageState.sel === 'total' ? ' on' : ''}" data-em="total">${icon('chart')}<span>الإجمالي</span><small>${esc(fmtNum(r2(expTotal)))}</small></a>` +
        pageState.months
          .map(
            (m) =>
              `<a href="#" class="gtab${pageState.sel === m ? ' on' : ''}" data-em="${m}"><span>${esc(monthName(m))}</span><small>${esc(fmtNum(mSum(m)))}</small></a>`,
          )
          .join('') +
        (ed ? '<a href="#" class="gtab add" data-em="new" title="إضافة الشهر التالي">＋ شهر جديد</a>' : '');
    };
    const drawPane = (...args) =>
      drillProjectDrawPane(EXP, allX, ed, ex, expTotal, id, inMonth, mSum, monthName, pageState, r2, reload, secSum, ...args);
    wireDrillProject3(drawPane, drawTabs, expTotal, r2);
    viewDrillProjectPart3(curM, drawPane, drawTabs, id, nextOf, pageState);
    return viewDrillProjectPart2(EXP, crew, expRows, holes, id, main, monthName, p, reload, rigs, sheetOf, sumM);
  }
  /* drawPane من viewDrillProject (يأخذ EXP، allX، ed، ex، expTotal، id، inMonth، mSum، monthName، pageState، r2، reload، secSum من الصفحة) */
  function drillProjectDrawPane(EXP, allX, ed, ex, expTotal, id, inMonth, mSum, monthName, pageState, r2, reload, secSum) {
    const pane = $('#expPane');
    if (pageState.sel === 'total') {
      pane.innerHTML = `<div class="exp-sum">${EXP.map(([, l]) => `<div><small>${esc(l)}</small><b>${esc(fmtNum(secSum('', l)))}</b></div>`).join('')}<div class="tot"><small>إجمالي مصروفات المشروع</small><b>${esc(fmtNum(r2(expTotal)))}</b></div></div>
          ${
            pageState.months.length
              ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الشهر</th>${EXP.map(([, l]) => `<th>${esc(l)}</th>`).join('')}<th>إجمالي الشهر</th></tr></thead><tbody>
          ${pageState.months.map((m) => `<tr><td><a href="#" data-em="${m}"><b>${esc(monthName(m))}</b></a></td>${EXP.map(([, l]) => `<td>${esc(fmtNum(secSum(m, l)))}</td>`).join('')}<td><b>${esc(fmtNum(mSum(m)))}</b></td></tr>`).join('')}
          <tr class="dh-total"><td>الإجمالي</td>${EXP.map(([, l]) => `<td>${esc(fmtNum(secSum('', l)))}</td>`).join('')}<td>${esc(fmtNum(r2(expTotal)))}</td></tr></tbody></table></div>`
              : '<div class="muted">لم تسجّل مصروفات</div>'
          }`;
      return;
    }
    const m = pageState.sel,
      xs = allX.filter((x) => x.month === m);
    const cards = `<div class="exp-sum">${EXP.map(([, l]) => `<div><small>${esc(l)}</small><b>${esc(fmtNum(secSum(m, l)))}</b></div>`).join('')}<div class="tot"><small>إجمالي ${esc(monthName(m))}</small><b>${esc(fmtNum(mSum(m)))}</b></div></div>`;
    if (!ed) {
      pane.innerHTML =
        cards +
        (xs.length
          ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>التاريخ</th><th>البند</th><th>البيان</th><th>التفاصيل</th><th>المبلغ</th></tr></thead><tbody>${xs.map((x) => `<tr><td>${esc(SF.fmtDate(x.date))}</td><td>${esc(x.sec)}</td><td>${esc(x.desc)}</td><td class="muted">${esc(x.detail)}</td><td><b>${esc(fmtNum(x.amount))}</b></td></tr>`).join('')}<tr class="dh-total"><td colspan="4">إجمالي ${esc(monthName(m))}</td><td>${esc(fmtNum(mSum(m)))}</td></tr></tbody></table></div>`
          : '<div class="muted">لا توجد مصروفات لهذا الشهر</div>');
      return;
    }
    pane.innerHTML = `${cards}<div class="hint" style="margin-bottom:8px">${xs.length ? `مسجل ${xs.length} مصروف — عدّل أو أضف ثم احفظ` : 'شهر جديد — سجّل مصروفاته ثم احفظ'}</div>
        <form id="expF" novalidate>${EXP.map(
          ([k, l, cols]) =>
            `<div class="exp-sec"><h4>${esc(l)}</h4>${fieldHtml(
              { key: k, label: '', type: 'table', columns: cols },
              (ex[k] || []).filter((r) => inMonth(r, m)),
            )}</div>`,
        ).join('')}
        <div class="row" style="margin-top:10px"><button class="btn primary">💾 حفظ مصروفات ${esc(monthName(m))}</button></div></form>`;
    const ef = $('#expF');
    ef.addEventListener('click', (e) => {
      const box = e.target.closest('[data-table]');
      if (!box) return;
      const cols = (EXP.find((x) => x[0] === box.dataset.table) || [])[2];
      if (e.target.classList.contains('add')) $('.trows', box).insertAdjacentHTML('beforeend', tableRowHtml({ columns: cols }, {}));
      if (e.target.classList.contains('rm')) {
        const rows = e.target.closest('.trows');
        if (rows.children.length > 1) e.target.closest('.trow').remove();
        else
          $$('.in', e.target.closest('.trow')).forEach((i) => {
            i.value = '';
          });
      }
    });
    ef.onsubmit = async (e) => {
      e.preventDefault();
      const v = collect({ fields: EXP.map(([k, , cols]) => ({ key: k, type: 'table', columns: cols })) }, ef);
      /* الشهر المختار يحل محل مصروفاته السابقة، والشهور الأخرى كما هي */
      const merged = Object.fromEntries(
        EXP.map(([k]) => [
          k,
          [
            ...(ex[k] || []).filter((r) => !inMonth(r, m)),
            ...(v[k] || []).map((r) => ({
              ...r,
              date: r.date && inMonth(r, m) ? r.date : `${m}-01`,
              ...(k === 'housing' || k === 'guards' ? { months: '1' } : {}),
            })),
          ],
        ]),
      );
      try {
        await api('PUT', `/api/drilling/projects/${id}/expenses`, { expenses: merged });
        try {
          sessionStorage.setItem(`exp:${id}`, m);
        } catch {
          /* تجاهل */
        }
        toast(`تم حفظ مصروفات ${monthName(m)}`);
        reload();
      } catch (err) {
        toast(err.message, true);
      }
    };
  }
  /* جزء من viewDrillProject: pageState.months = [...new Set([...allX.map((x) =>… */
  function viewDrillProjectPart4(allX, curM, ed, id, pageState) {
    pageState.months = [...new Set([...allX.map((x) => x.month).filter(Boolean), ...(ed ? [curM] : [])])].sort();
    pageState.sel = '';
    try {
      pageState.sel = sessionStorage.getItem(`exp:${id}`) || '';
    } catch {
      /* تجاهل */
    }
    if (pageState.sel !== 'total' && !pageState.months.includes(pageState.sel))
      pageState.sel =
        ed && pageState.months.includes(curM) ? curM : pageState.months.length ? pageState.months[pageState.months.length - 1] : 'total';
  }
  /* جزء من viewDrillProject: $('#dpExp').addEventListener('click', (e) => {… */
  function viewDrillProjectPart3(curM, drawPane, drawTabs, id, nextOf, pageState) {
    $('#dpExp').addEventListener('click', (e) => {
      const a = e.target.closest('[data-em]');
      if (!a) return;
      e.preventDefault();
      if (a.dataset.em === 'new') {
        const nm = nextOf(pageState.months.length ? pageState.months[pageState.months.length - 1] : curM);
        if (!pageState.months.includes(nm)) pageState.months = [...pageState.months, nm];
        pageState.sel = nm;
      } else pageState.sel = a.dataset.em;
      try {
        sessionStorage.setItem(`exp:${id}`, pageState.sel);
      } catch {
        /* تجاهل */
      }
      drawTabs();
      drawPane();
    });
  }
  /* أحداث viewDrillProject */
  function wireDrillProject3(drawPane, drawTabs, expTotal, r2) {
    $('#dpExp').innerHTML =
      `<div class="emp-sec-h"><h3>${icon('receipt')} مصروفات المشروع</h3><span class="row" style="gap:8px;align-items:center"><b class="exp-total">إجمالي المشروع: ${esc(fmtNum(r2(expTotal)))} ريال</b><button type="button" class="btn sm" id="expXls">📊 Excel المصروفات الشهري</button></span></div>
      <div class="gtabs exp-tabs" id="expTabs"></div><div id="expPane"></div>`;
    drawTabs();
    drawPane();
  }
  /* جزء من viewDrillProject: wireExpXls(EXP, expRows, monthName, p, sheetOf);… */
  function viewDrillProjectPart2(EXP, crew, expRows, holes, id, main, monthName, p, reload, rigs, sheetOf, sumM) {
    wireExpXls(EXP, expRows, monthName, p, sheetOf);
    const call = async (m, url, b, msg) => {
      try {
        await api(m, url, b);
        if (msg) toast(msg);
        reload();
      } catch (err) {
        toast(err.message, true);
      }
    };
    viewDrillProjectPart(id, reload);
    /* اختيار الحفارة في الجسة يملأ المشغّل والعامل من طاقمها */
    if ($('#dhF'))
      $('[data-k="rig"]', $('#dhF')).onchange = (e) => {
        const c = crew.find((x) => x.rig === e.target.value);
        if (c) {
          $('[data-k="operator"]', $('#dhF')).value = c.operator || '';
          $('[data-k="helper"]', $('#dhF')).value = c.helper || '';
        }
      };
    wireDrillProject2(call, crew, id, p, reload);
    main.addEventListener('click', async (e) => {
      const hed = e.target.closest('[data-hed]'),
        hdel = e.target.closest('[data-hdel]');
      if (hdel) {
        const h = holes.find((x) => x.id === hdel.dataset.hdel);
        if (await askYesNo(`حذف الجسة ${h.no}؟`)) call('DELETE', `/api/drilling/projects/${id}/holes/${h.id}`, undefined, 'تم الحذف');
      }
      if (hed) {
        const h = holes.find((x) => x.id === hed.dataset.hed);
        formModal({
          title: `تعديل الجسة ${h.no}`,
          fields: [
            { key: 'no', label: 'رقم الجسة', required: true },
            { key: 'depth', label: 'العمق (متر)', type: 'number', required: true },
            { key: 'date', label: 'تاريخ التنفيذ', type: 'date', required: true },
            { key: 'rig', label: 'الحفارة', type: 'select', options: rigs },
            { key: 'operator', label: 'مشغّل الحفارة' },
            { key: 'helper', label: 'العامل' },
            { key: 'water', label: 'منسوب المياه (م)' },
            { key: 'note', label: 'ملاحظات' },
          ],
          values: h,
          onSave: async (v) => {
            await api('PUT', `/api/drilling/projects/${id}/holes/${h.id}`, v);
            toast('تم التعديل');
            reload();
          },
        });
      }
    });
    return wireDrillProject(call, holes, id, p, reload, sumM);
  }
  /* جزء من viewDrillProject: if ($('#dhF'))… */
  function viewDrillProjectPart(id, reload) {
    if ($('#dhF'))
      $('#dhF').onsubmit = async (e) => {
        e.preventDefault();
        const v = Object.fromEntries($$('[data-k]', e.target).map((i) => [i.dataset.k, i.value.trim()]));
        try {
          await api('POST', `/api/drilling/projects/${id}/holes`, v);
          toast(`تمت إضافة الجسة ${v.no}`);
          reload();
        } catch (err) {
          $('#dhErr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
  }
  /* أحداث viewDrillProject: #dcEd، #duAdd */
  function wireDrillProject2(call, crew, id, p, reload) {
    if ($('#dcEd'))
      $('#dcEd').onclick = async () => {
        const f = await api('GET', '/api/drilling').catch(() => ({ list: [] }));
        drillCrewModal(id, crew, p.rigsAll || [], reload, f.list);
      };
    if ($('#duAdd'))
      $('#duAdd').onclick = () => {
        const text = $('#duT').value.trim();
        if (!text) {
          toast('اكتب التحديث', true);
          return;
        }
        call('POST', `/api/drilling/projects/${id}/updates`, { text }, 'تم إضافة التحديث');
      };
  }
  /* أحداث viewDrillProject: #dpEd، #dpClose، #dpReopen، #dhXls */
  function wireDrillProject(call, holes, id, p, reload, sumM) {
    if ($('#dpEd'))
      $('#dpEd').onclick = async () => {
        const res = await api('GET', '/api/drilling/projects');
        drillProjectModal(
          res.list.find((x) => x.id === id),
          res,
          reload,
        );
      };
    if ($('#dpClose'))
      $('#dpClose').onclick = () =>
        formModal({
          title: '🔒 إقفال المشروع',
          fields: [
            { key: 'date', label: 'تاريخ الإقفال', type: 'date', required: true },
            { key: 'note', label: 'ملاحظة ختامية', type: 'textarea' },
          ],
          values: { date: today() },
          onSave: async (v) => {
            await api('POST', `/api/drilling/projects/${id}/close`, v);
            toast('تم إقفال المشروع');
            reload();
          },
        });
    if ($('#dpReopen'))
      $('#dpReopen').onclick = async () => {
        if (await askYesNo('إعادة فتح المشروع للتعديل؟')) call('POST', `/api/drilling/projects/${id}/reopen`, {}, 'أعدت فتح المشروع');
      };
    $('#dhXls').onclick = () =>
      downloadXlsx(
        `جسات-${p.name}.xlsx`,
        [
          ['#', 'رقم الجسة', 'تاريخ التنفيذ', 'العمق (م)', 'الحفارة', 'المشغّل', 'العامل', 'منسوب المياه', 'ملاحظات', 'سجّلها'],
          ...holes.map((h, i) => [
            i + 1,
            h.no,
            h.date,
            Number(h.depth),
            h.rig || '',
            h.operator || '',
            h.helper || '',
            h.water || '',
            h.note || '',
            h.by || '',
          ]),
          [],
          ['', 'الإجمالي', '', sumM, `${holes.length} جسة`],
        ],
        'الجسات',
      );
  }
  /* أحداث viewDrillProject: #expXls */
  function wireExpXls(EXP, expRows, monthName, p, sheetOf) {
    $('#expXls').onclick = () => {
      const all = expRows();
      if (!all.length) {
        toast('لا توجد مصروفات مسجلة', true);
        return;
      }
      const months = [...new Set(all.map((x) => x.month))].sort();
      formModal({
        title: '📊 Excel مصروفات المشروع',
        fields: [
          { key: 'm', label: 'الشهر', type: 'select', required: true, options: ['كل الشهور (ورقة لكل شهر)', ...months.map(monthName)] },
        ],
        values: { m: monthName(months[months.length - 1]) },
        onSave: (v) => {
          const safe = p.name.replace(/[\\/:*?"<>|]/g, '');
          if (v.m.startsWith('كل الشهور')) {
            const sum = [
              ['ملخص مصروفات المشروع شهرياً'],
              [p.name],
              [],
              ['الشهر', ...EXP.map((x) => x[1]), 'الإجمالي'],
              ...months.map((m) => {
                const xs = all.filter((x) => x.month === m);
                const by = EXP.map(([, l]) => Math.round(xs.filter((x) => x.sec === l).reduce((a, x) => a + x.amount, 0) * 100) / 100);
                return [monthName(m), ...by, Math.round(by.reduce((a, b) => a + b, 0) * 100) / 100];
              }),
            ];
            downloadXlsx(`مصروفات-${safe}-شهرياً.xlsx`, [
              { name: 'الملخص', rows: sum },
              ...months.map((m) => ({
                name: monthName(m),
                rows: sheetOf(
                  all.filter((x) => x.month === m),
                  `شهر ${monthName(m)}`,
                ),
              })),
            ]);
          } else {
            const m = months.find((x) => monthName(x) === v.m);
            downloadXlsx(
              `مصروفات-${safe}-${m}.xlsx`,
              sheetOf(
                all.filter((x) => x.month === m),
                `شهر ${v.m}`,
              ),
              v.m,
            );
          }
        },
      });
    };
  }

  async function viewDrillProjects(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (shown) */
    const vs = {};
    /* نوع المشاريع من القائمة: المشتركة أو مشاريع قسم الحفر الخاصة */
    const kind = query.type === 'shared' ? 'مشترك' : query.type === 'own' ? 'خاص بقسم الحفر' : '';
    const partnerOnly = !can('drilling');
    const main = shell('<div class="empty">جاري التحميل...</div>', partnerOnly ? '#/drilling-projects?type=shared' : '#/drilling-projects');
    const res = await api('GET', '/api/drilling/projects');
    const typeOf = (p) => p.projType || 'خاص بقسم الحفر';
    const counts = {
      all: res.list.length,
      own: res.list.filter((p) => typeOf(p) !== 'مشترك').length,
      shared: res.list.filter((p) => typeOf(p) === 'مشترك').length,
    };
    if (kind) res.list = res.list.filter((p) => typeOf(p) === kind);
    /* تابات بأسلوب جوجل: النوع من الرابط */
    const cur = query.type === 'shared' ? 'shared' : query.type === 'own' ? 'own' : 'all';
    const gtabs = partnerOnly
      ? ''
      : `<div class="gtabs">${[
          ['all', 'كل المشاريع', 'layers'],
          ['own', 'مشاريع قسم الحفر', 'pickaxe'],
          ['shared', 'مشاريع مشتركة', 'handshake'],
        ]
          .map(
            ([k, l, ic]) =>
              `<a class="gtab${k === cur ? ' on' : ''}" href="#/drilling-projects${k === 'all' ? '' : `?type=${k}`}">${icon(ic)}<span>${l}</span><small>${counts[k]}</small></a>`,
          )
          .join('')}</div>`;
    res.kind = kind;
    const st = { status: res.statuses.includes(query.status) ? query.status : 'تحت التنفيذ', q: '' };
    const pct = (p) => {
      const a = Number(p.planned) || 0,
        b = Number(p.done) || 0;
      return a ? Math.min(100, Math.round((b / a) * 100)) : null;
    };
    const busy = new Set(res.list.filter((p) => p.status === 'تحت التنفيذ').flatMap((p) => p.rigs || []));
    renderViewDrillProjects(busy, gtabs, kind, main, res);
    vs.shown = [];
    const draw = () => {
      const q = st.q.toLowerCase();
      const ty = '';
      vs.shown = res.list.filter(
        (p) =>
          (!ty || (p.projType || 'خاص بقسم الحفر') === ty) &&
          (!st.status || p.status === st.status) &&
          (!q || [p.name, p.client, p.location, p.branch, p.contractNo, ...(p.rigs || [])].join(' ').toLowerCase().includes(q)),
      );
      $$('[data-st]', main).forEach((b) => b.classList.toggle('on', b.dataset.st === st.status));
      $('#dpGrid').innerHTML =
        vs.shown
          .map((p) => {
            const v = pct(p),
              left = p.endDate ? SF.daysBetween(today(), p.endDate) : null;
            return `<div class="dp-card"><div class="dp-h"><div><a href="#/drilling-project/${p.id}" class="dp-name"><b>${esc(p.name)}</b></a><small>${esc([p.client, p.contractNo ? `عقد ${p.contractNo}` : ''].filter(Boolean).join(' — '))}</small></div><span class="chip ${p.status === 'تحت التنفيذ' ? 'approved' : p.status === 'منتهي' ? 'cancelled' : 'pending'}">${esc(p.status)}</span></div>
          <div class="dp-type"><span class="chip ${p.projType === 'مشترك' ? 'pending' : 'approved'}">${esc(p.projType || 'خاص بقسم الحفر')}</span>${p.projType === 'مشترك' && (p.partners || []).length ? `<small class="muted">مع: ${esc(p.partners.join('، '))}</small>` : ''}</div>
          <div class="dp-meta"><span>${icon('branch')} ${esc(p.branch || '—')}</span><span>${icon('mapPin')} ${esc(p.location || '—')}</span><span>${icon('user')} ${esc(p.supervisor || '—')}</span></div>
          <div class="dp-rigtags">${(p.rigs || []).map((c) => `<span class="emp-tag">${icon('truck')} ${esc(c)}</span>`).join('') || '<span class="muted">لم تحدد حفارات</span>'}</div>
          <div class="dp-prog"><div class="dp-bar"><i style="width:${v || 0}%"></i></div><small>${v === null ? 'سجّل عدد الجسات المخططة لحساب نسبة الإنجاز' : `الإنجاز ${v}% — ${esc(p.done || 0)} من ${esc(p.planned)} جسة${p.plannedM ? ` — ${esc(p.doneM || 0)} من ${esc(p.plannedM)} م` : ''}`}</small></div>
          <div class="dp-dates"><span>البدء: <b>${esc(SF.fmtDate(p.startDate) || '—')}</b></span><span>الانتهاء المتوقع: <b>${esc(SF.fmtDate(p.endDate) || '—')}</b></span>${partValue(left, p)}</div>
          ${(() => {
            const u = (p.updates || []).filter((x) => !x.auto).slice(-1)[0];
            return u
              ? `<div class="dp-notes"><b>آخر تحديث (${esc(SF.fmtDate(u.at.slice(0, 10)))}):</b> ${esc(u.text.slice(0, 160))}</div>`
              : p.notes
                ? `<div class="dp-notes">${esc(p.notes)}</div>`
                : '';
          })()}
          <div class="dp-foot"><a class="btn sm primary" href="#/drilling-project/${p.id}">${icon('eye')} متابعة المشروع</a>${res.editor && p.status !== 'منتهي' ? `<button class="btn sm" data-ped="${p.id}">✏️ تعديل</button>` : ''}${res.editor ? `<button class="btn sm ghost" data-pdel="${p.id}" title="حذف">🗑️</button>` : ''}</div></div>`;
          })
          .join('') || '<div class="muted" style="grid-column:1/-1;text-align:center;padding:30px">لا توجد مشاريع</div>';
    };
    wireDrillProjects2(draw, kind, main, res, st);
    wireDpXls(pct, vs);
    draw();
  }
  /* أحداث viewDrillProjects: #dpXls */
  function wireDpXls(pct, vs) {
    $('#dpXls').onclick = () =>
      downloadXlsx(
        'مشاريع-الحفر.xlsx',
        [
          [
            'المشروع',
            'العميل',
            'رقم العقد',
            'الفرع',
            'الموقع',
            'المشرف',
            'الحالة',
            'الحفارات',
            'البدء',
            'الانتهاء المتوقع',
            'الجسات المخططة',
            'المنفذة',
            'نسبة الإنجاز %',
            'الأعماق المخططة م',
            'المنفذة م',
            'ملاحظات',
          ],
          ...vs.shown.map((p) => [
            p.name,
            p.client,
            p.contractNo,
            p.branch,
            p.location,
            p.supervisor,
            p.status,
            (p.rigs || []).join('، '),
            p.startDate,
            p.endDate,
            Number(p.planned) || '',
            Number(p.done) || '',
            pct(p) ?? '',
            Number(p.plannedM) || '',
            Number(p.doneM) || '',
            p.notes,
          ]),
        ],
        'المشاريع',
      );
  }
  /* أحداث viewDrillProjects */
  function wireDrillProjects2(draw, kind, main, res, st) {
    $$('[data-st]', main).forEach((b) => {
      b.onclick = () => {
        st.status = b.dataset.st;
        draw();
      };
    });
    wireDrillProjects(draw, kind, res, st);
  }
  /* محتوى viewDrillProjects (HTML) */
  function renderViewDrillProjects(busy, gtabs, kind, main, res) {
    main.innerHTML = `${head(res.partnerView ? 'قسم الحفر — المشاريع المشتركة' : 'قسم الحفر — المشروعات', res.partnerView ? `${res.list.length} مشروع مشترك مع ${esc(state.user.branch)} (عرض فقط)` : `${res.list.length} مشروع${kind === 'مشترك' ? ' مع الفروع والمكتب الفني وغيرها' : kind ? ' خاص بقسم الحفر' : ''} — ${busy.size} حفارة عاملة الآن`, `${res.editor ? '<button class="btn primary" id="dpAdd">➕ مشروع جديد</button>' : ''}<button class="btn" id="dpXls">📊 Excel</button>`)}
      ${gtabs}
      <div class="emp-tiles" style="grid-template-columns:repeat(4,1fr)">${[
        ['تحت التنفيذ', 'pickaxe', '#0e9f9a'],
        ['متوقف مؤقتاً', 'alert', '#f59e0b'],
        ['منتهي', 'checkCircle', '#64748b'],
      ]
        .map(
          ([s, ic, c]) =>
            `<button type="button" class="emp-tile" data-st="${s}"><div class="t-top"><span class="t-n">${res.list.filter((p) => p.status === s).length}</span><span class="t-ic" style="--m:${c}">${icon(ic)}</span></div><span class="t-l">${s}</span></button>`,
        )
        .join('')}
        <button type="button" class="emp-tile" data-st=""><div class="t-top"><span class="t-n">${res.list.length}</span><span class="t-ic" style="--m:#1f3a5f">${icon('layers')}</span></div><span class="t-l">كل المشاريع</span></button></div>
      <div class="card"><div class="emp-bar"><input class="in" id="dpQ" placeholder="بحث بالمشروع أو العميل أو الموقع أو الحفارة..." style="flex:1;min-width:220px"></div><div class="dp-grid" id="dpGrid"></div></div>`;
  }
  /* أحداث viewDrillProjects: #dpGrid، #dpAdd */
  function wireDrillProjects(draw, kind, res, st) {
    $('#dpQ').addEventListener('input', (e) => {
      st.q = e.target.value.trim();
      draw();
    });
    $('#dpGrid').onclick = async (e) => {
      const ed = e.target.closest('[data-ped]'),
        del = e.target.closest('[data-pdel]');
      if (ed)
        drillProjectModal(
          res.list.find((x) => x.id === ed.dataset.ped),
          res,
          () => route(),
        );
      if (del) {
        if (!(await askYesNo('حذف هذا المشروع؟ (يذهب لسلة المحذوفات)'))) return;
        try {
          await api('DELETE', `/api/drilling/projects/${del.dataset.pdel}`);
          toast('تم الحذف');
          route();
        } catch (err) {
          toast(err.message, true);
        }
      }
    };
    if ($('#dpAdd')) $('#dpAdd').onclick = () => drillProjectModal(kind ? { projType: kind } : null, res, () => route());
  }
  /* جزء من part: left !== null && p.status === 'تحت التنفيذ' ? `<span class="… */
  function partValue(left, p) {
    return left !== null && p.status === 'تحت التنفيذ'
      ? `<span class="chip ${left < 0 ? 'rejected' : left <= 7 ? 'pending' : ''}">${left < 0 ? `متأخر ${-left} يوم` : `باقٍ ${left} يوم`}</span>`
      : '';
  }

  async function viewDrilling(query) {
    const res = await api('GET', '/api/drilling');
    const main = shell('', '#/drilling');
    const list = res.list;
    const exp = list.filter((r) => r.tuvDays !== null && r.tuvDays < 0).length,
      soon = list.filter((r) => r.tuvDays !== null && r.tuvDays >= 0 && r.tuvDays <= 30).length;
    const branches = [...new Set(list.map((r) => r.branch))].sort();
    const opExp = list.filter((r) => r.opTuvDays !== null && r.opTuvDays <= 30).length;
    renderViewDrilling(branches, exp, list, main, opExp, res, soon);
    const rows = () => {
      const q = $('#rgQ').value.trim(),
        b = $('#rgB').value,
        a = $('#rgA').checked;
      const shown = list.filter(
        (r) =>
          (!b || r.branch === b) &&
          (!a || (r.tuvDays !== null && r.tuvDays <= 30)) &&
          (!q || [r.code, r.plate, r.model, r.notes, r.operator, r.helper, (r.project || {}).name].join(' ').includes(q)),
      );
      $('#rgRows').innerHTML =
        shown
          .map(
            (
              r,
            ) => `<tr><td><b>${esc(r.code)}</b></td><td><bdi>${esc(r.plate || '—')}</bdi></td><td>${esc(r.branch)}</td><td>${esc(r.mfg || '—')}</td><td>${esc(r.model || '—')} ${r.year ? `<small class="muted">${esc(r.year)}</small>` : ''}</td>
        <td>${esc(SF.fmtDate(r.tuvEnd) || '—')} ${daysBadge(r.tuvDays)}</td><td>${r.opTuvEnd ? `${esc(SF.fmtDate(r.opTuvEnd))} ${daysBadge(r.opTuvDays)}` : '<span class="muted">—</span>'}</td><td>${r.site ? `${icon('mapPin')} ${esc(r.site)}<br><small class="muted">${esc(dt(r.siteAt))}</small>` : '<span class="muted">—</span>'}${res.editor ? ` <button class="btn sm ghost" data-site="${r.id}" title="تحديث الموقع">📍</button>` : ''}</td><td>${esc(r.status)}</td>
        <td class="rg-crew">${r.operator || r.helper ? `<div>${icon('user')} ${esc(r.operator || '—')}</div><small>${icon('users')} ${esc(r.helper || '—')}</small>` : '<span class="muted">—</span>'}</td>
        <td>${r.project ? `<a href="#/drilling-project/${r.project.id}">${esc(r.project.name)}</a>` : '<span class="muted">—</span>'}</td>
        <td style="white-space:nowrap"><button class="btn sm" data-card="${r.id}">📇 الكارت</button> <a class="btn sm" href="#/fleet/${r.id}" title="التعديل من أسطول السيارات">✏️ في الأسطول</a></td></tr>`,
          )
          .join('') || '<tr><td colspan="12" class="muted" style="text-align:center;padding:24px">لا توجد حفارات</td></tr>';
    };
    ['input', 'change'].forEach((ev) => ['#rgQ', '#rgB', '#rgA'].forEach((s) => $(s).addEventListener(ev, rows)));
    rows();
    /* تحديث الموقع الحالي (متابعة أماكن التواجد) وسجل المواقع */
    const siteModal = (v, label) =>
      formModal({
        title: `📍 تحديث موقع ${label}`,
        fields: [
          { key: 'site', label: 'الموقع الحالي', required: true, hint: 'المدينة / الموقع / اسم المشروع' },
          { key: 'project', label: 'المشروع', type: 'select', options: ['', ...(res.projects || [])] },
          { key: 'note', label: 'ملاحظة' },
        ],
        values: { site: v.site || '', project: v.siteProject || '' },
        extra: (v.siteLog || []).length
          ? `<h4 class="b-sec" style="margin-top:12px">سجل المواقع</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>التاريخ</th><th>الموقع</th><th>المشروع</th><th>بواسطة</th><th>ملاحظة</th></tr></thead><tbody>${v.siteLog
              .slice()
              .reverse()
              .map(
                (x) =>
                  `<tr><td>${esc(dt(x.at))}</td><td>${esc(x.site)}</td><td>${esc(x.project || '—')}</td><td>${esc(x.by)}</td><td>${esc(x.note || '')}</td></tr>`,
              )
              .join('')}</tbody></table></div>`
          : '',
        onSave: async (val) => {
          await api('POST', '/api/drilling/site', { id: v.id, ...val });
          toast('تم تحديث الموقع');
          route();
        },
      });
    main.addEventListener('click', (e) => {
      const sb = e.target.closest('[data-site]');
      if (!sb) return;
      const v = list.find((x) => x.id === sb.dataset.site) || res.cars.find((x) => x.id === sb.dataset.site);
      if (v) siteModal(v, v.code ? `الحفارة ${v.code}` : `السيارة ${v.plate}`);
    });
    $('#carsBox').innerHTML =
      `<div class="card"><div class="hint" style="margin-bottom:10px">سيارات الشركة والسيارات الخاصة المسجلة على فرع "قسم الحفر" في <a href="#/fleet">أسطول السيارات</a> (إدارة الحركة). تضيفها وتعدّلها من الأسطول، وتحدّث موقعها من هنا.</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>رقم اللوحة</th><th>النوع</th><th>الماركة والطراز</th><th>السائق</th><th>الحالة</th><th>الموقع الحالي</th><th>المشروع</th><th>آخر تحديث</th><th></th></tr></thead><tbody>
      ${res.cars.map((v) => `<tr><td><b><bdi>${esc(v.plate)}</bdi></b>${v.owner === 'خاصة' ? ' <span class="chip">خاصة</span>' : ''}</td><td>${esc(v.vType || '—')}</td><td>${esc([v.brand, v.model, v.year].filter(Boolean).join(' '))}</td><td>${esc(v.driver || '—')}</td><td>${esc(v.status || '')}</td><td>${v.site ? `${icon('mapPin')} ${esc(v.site)}` : '<span class="muted">—</span>'}</td><td>${esc(v.siteProject || '—')}</td><td>${esc(v.siteAt ? dt(v.siteAt) : '—')}</td><td>${res.editor ? `<button class="btn sm" data-site="${v.id}">📍 تحديث الموقع</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="9" class="muted" style="text-align:center;padding:24px">لا توجد سيارات مسجلة على قسم الحفر في الأسطول</td></tr>'}</tbody></table></div></div>`;
    $$('[data-rt]', main).forEach((b) => {
      b.onclick = () => {
        $$('[data-rt]', main).forEach((x) => x.classList.toggle('on', x === b));
        $('#rigsBox').hidden = b.dataset.rt !== 'rigs';
        $('#carsBox').hidden = b.dataset.rt !== 'cars';
      };
    });
    /* الكارت للطباعة (والتسجيل والتعديل من أسطول السيارات) */
    return wireDrilling(list);
  }
  /* محتوى viewDrilling (HTML) */
  function renderViewDrilling(branches, exp, list, main, opExp, res, soon) {
    main.innerHTML = `${head('قسم الحفر — أسطول الحفارات والسيارات', `${list.length} حفارة — ${res.cars.length} سيارة — من أسطول السيارات (إدارة الحركة)`, `<a class="btn" href="#/fleet" title="الحفارات (فئة «حفارة») والسيارات تُسجَّل وتُعدَّل من أسطول السيارات">🚚 التسجيل من الأسطول</a><button class="btn" id="rgXls">📊 Excel</button>`)}
      <div class="stats" style="margin-bottom:14px"><div class="stat"><div class="n">${list.length}</div><div class="l">إجمالي الحفارات</div></div>
        <div class="stat${exp ? ' hi' : ''}"><div class="n">${exp}</div><div class="l">شهادة TUV منتهية</div></div>
        <div class="stat${soon ? ' hi' : ''}"><div class="n">${soon}</div><div class="l">TUV تنتهي خلال 30 يوماً</div></div>
        <div class="stat${opExp ? ' hi' : ''}"><div class="n">${opExp}</div><div class="l">TUV الحفار منتهية / قريبة</div></div>
        <div class="stat"><div class="n">${list.filter((r) => r.status === 'في الخدمة').length}</div><div class="l">في الخدمة</div></div></div>
      <div class="tabs" style="margin-bottom:12px"><button class="tab on" data-rt="rigs">🚜 الحفارات (${list.length})</button><button class="tab" data-rt="cars">🚗 السيارات (${res.cars.length})</button></div>
      <div id="carsBox" hidden></div><div id="rigsBox">
      <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><input class="in" id="rgQ" placeholder="بحث: الكود، رقم السيارة، الطراز، المشغّل، المشروع..." style="flex:1;min-width:200px">
        <select class="in" id="rgB" style="width:auto"><option value="">كل الفروع</option>${branches.map((b) => `<option>${esc(b)}</option>`).join('')}</select>
        <label class="check"><input type="checkbox" id="rgA"> TUV منتهية أو قريبة فقط</label></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>كود الحفارة</th><th>رقم السيارة</th><th>الفرع</th><th>نوع التصنيع</th><th>الطراز</th><th>انتهاء TUV</th><th>TUV الحفار</th><th>الموقع الحالي</th><th>الحالة</th><th>الطاقم</th><th>المشروع الحالي</th><th></th></tr></thead><tbody id="rgRows"></tbody></table></div></div></div>`;
  }
  /* أحداث viewDrilling: #rgRows، #rgXls */
  function wireDrilling(list) {
    $('#rgRows').onclick = (e) => {
      const c = e.target.closest('[data-card]');
      if (!c) return;
      const r = list.find((x) => x.id === c.dataset.card);
      printDocs(`كارت الحفارة ${r.code}`, rigCard(r));
    };
    $('#rgXls').onclick = () =>
      downloadXlsx(
        'سجل-الحفارات.xlsx',
        [
          [
            'كود الحفارة',
            'رقم السيارة',
            'الفرع',
            'نوع التصنيع',
            'الطراز',
            'سنة الصنع',
            'مشغّل الحفارة',
            'العامل',
            'المشروع الحالي',
            'إصدار TUV',
            'انتهاء TUV',
            'الحالة',
            'ملاحظات',
          ],
          ...list.map((r) => [
            r.code,
            r.plate,
            r.branch,
            r.mfg,
            r.model,
            r.year,
            r.operator || '',
            r.helper || '',
            (r.project || {}).name || '',
            r.tuvStart,
            r.tuvEnd,
            r.status,
            r.notes,
          ]),
        ],
        'الحفارات',
      );
  }
  return { viewDrillProjects, viewDrilling, drillProjectValue2, viewDrillProjectPart5 };
};
