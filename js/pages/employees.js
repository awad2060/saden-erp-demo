'use strict';
/* صفحة «employees» (viewIqamas، viewEmployees) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['employees'] = function (S) {
  /* خصائص أنواع الطلبات (public/js/form-traits.js): isForm(r, 'خاصية') بدل مقارنة النوع */
  const isForm = (r, trait) => window.SADEN_FORM_TRAITS.is(r, trait);
  const {
    $,
    $$,
    SF,
    api,
    askYesNo,
    can,
    downloadXlsx,
    empAlert,
    empCard,
    empCols,
    empDocs,
    employeeModal,
    esc,
    gridImportModal,
    head,
    icon,
    route,
    shell,
    state,
    toast,
    today,
  } = S;
  /* تقرير رفع الموظفين: الصفوف التي لم تُحفظ وسببها، والصفوف المحفوظة بملاحظات (قيم غير مطابقة) مع تنزيلها Excel */
  function importReport(r) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const rowsHtml = (xs) =>
      `<div class="tbl-wrap" style="max-height:34vh;overflow:auto"><table class="tbl"><thead><tr><th>الصف</th><th>الموظف</th><th>السبب</th></tr></thead><tbody>${xs
        .slice(0, 300)
        .map((x) => `<tr><td>${x.row}</td><td>${esc(x.who || '—')}</td><td>${esc(x.msg)}</td></tr>`)
        .join('')}</tbody></table></div>${xs.length > 300 ? `<div class="hint">يُعرض أول 300 — الكل في ملف Excel</div>` : ''}`;
    bg.innerHTML = `<div class="modal" style="max-width:980px;width:96%"><h3 style="margin-top:0">نتيجة رفع الموظفين</h3>
      <p>✔ أُضيف <b>${r.added}</b> وحُدِّث <b>${r.updated}</b> موظف${r.errors.length ? ` — ✕ <b style="color:var(--bad)">${r.errors.length}</b> صف لم يُحفظ` : ''}${r.notes.length ? ` — ⚠ <b>${r.notes.length}</b> صف حُفظ بملاحظات` : ''}</p>
      ${r.errors.length ? `<h4 class="b-sec">صفوف لم تُحفظ</h4>${rowsHtml(r.errors)}` : ''}
      ${r.notes.length ? `<h4 class="b-sec">صفوف حُفظت بملاحظات (راجع القيمة في ملف الموظف)</h4>${rowsHtml(r.notes)}` : ''}
      <div class="row" style="margin-top:12px;gap:8px"><button class="btn" id="irXls">📊 تنزيل التقرير Excel</button><button class="btn primary" data-x>إغلاق</button></div></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#irXls', bg).onclick = () =>
      downloadXlsx(
        'تقرير-رفع-الموظفين.xlsx',
        [
          ['الحالة', 'الصف', 'الموظف', 'السبب'],
          ...r.errors.map((x) => ['لم يُحفظ', x.row, x.who, x.msg]),
          ...r.notes.map((x) => ['حُفظ بملاحظة', x.row, x.who, x.msg]),
        ],
        'التقرير',
      );
  }

  /* متابعة الإقامات (شئون الموظفين): المنتهية والتي تنتهي خلال المدة المختارة، مع طلب تجديد بضغطة */
  async function viewIqamas(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/iqamas');
    const [res, reqs] = await Promise.all([
      api('GET', '/api/employees'),
      api('GET', `/api/requests?scope=${can('all') ? 'all' : 'mine'}`).catch(() => []),
    ]);
    const openRenew = (e) =>
      reqs.find(
        (r) => isForm(r, 'iqamaRenewal') && (r.status === 'pending' || r.status === 'returned') && (r.summary || '').startsWith(e.nameAr),
      );
    const st = { range: Number(query.range) || 30, branch: query.branch || '', q: '' };
    const all = res.list
      .filter((e) => e.status !== 'غير نشط' && /^\d{4}-\d{2}-\d{2}$/.test(e.iqamaEnd || ''))
      .map((e) => ({ e, days: SF.daysBetween(today(), e.iqamaEnd) }));
    const cnt = (fn) => all.filter(fn).length;
    const brs = [...new Set(all.map((x) => x.e.branch).filter(Boolean))].sort();
    const accView = state.user.role === 'accountant' && state.user.branch;
    renderViewIqamas(accView, brs, cnt, main, st);
    let shown = [];
    const draw = () => {
      const q = st.q.toLowerCase();
      shown = all
        .filter(
          (x) =>
            (st.range < 0 ? x.days < 0 : x.days <= st.range) &&
            (!st.branch || x.e.branch === st.branch) &&
            (!q || [x.e.nameAr, x.e.empNo, x.e.iqama].join(' ').toLowerCase().includes(q)),
        )
        .sort((a, b) => a.days - b.days);
      $$('[data-rg]', main).forEach((b) => b.classList.toggle('on', Number(b.dataset.rg) === st.range));
      $('#iqCount').textContent = `${shown.length} إقامة ${st.range < 0 ? 'منتهية' : `منتهية أو تنتهي خلال ${st.range} يوماً`}`;
      $('#iqTbl').innerHTML =
        `<table class="tbl"><thead><tr><th>#</th><th>الموظف</th><th>الرقم الوظيفي</th><th>الفرع</th><th>رقم الإقامة</th><th>تنتهي في</th><th>المتبقي</th><th></th></tr></thead><tbody>
        ${
          shown
            .map((x, i) => {
              const r = openRenew(x.e);
              const pre = {
                name: x.e.nameAr,
                iqama: x.e.iqama,
                empNo: x.e.empNo,
                nationality: x.e.nationality,
                job: x.e.title,
                passport: x.e.passport,
                iqamaEnd: x.e.iqamaEnd,
                branch: x.e.branch,
              };
              return `<tr><td>${i + 1}</td><td><a href="#/employee/${x.e.id}"><b>${esc(x.e.nameAr)}</b></a><div class="muted" style="font-size:12px">${esc(x.e.title || '')}</div></td><td>${esc(x.e.empNo || '')}</td><td>${esc(x.e.branch || '')}</td><td>${esc(x.e.iqama || '')}</td>
          <td>${esc(SF.fmtDate(x.e.iqamaEnd))}<div class="muted" style="font-size:12px">${esc(x.e.iqamaEndHijri ? `${x.e.iqamaEndHijri} هـ` : '')}</div></td>
          <td><span class="chip ${x.days < 0 ? 'rejected' : x.days <= 7 ? 'rejected' : 'pending'}">${x.days < 0 ? `منتهية منذ ${-x.days} يوم` : x.days === 0 ? 'تنتهي اليوم' : `باقٍ ${x.days} يوم`}</span></td>
          <td style="white-space:nowrap">${r ? `<a class="btn sm" href="#/req/${r.id}" title="طلب تجديد جارٍ">${icon('clipboard')} <bdi dir="ltr">${esc(r.serial)}</bdi></a>` : SF.formAllowed(state.user, 'iqamaRenew') ? `<a class="btn sm primary" href="#/new/iqamaRenew?prefill=${encodeURIComponent(JSON.stringify(pre))}">${icon('rotate')} طلب تجديد</a>` : ''}</td></tr>`;
            })
            .join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">لا توجد إقامات في هذه المدة</td></tr>'
        }</tbody></table>`;
    };
    $$('[data-rg]', main).forEach((b) => {
      b.onclick = () => {
        st.range = Number(b.dataset.rg);
        draw();
      };
    });
    wireIqamas(draw, st);
    $('#iqXls').onclick = () =>
      downloadXlsx(
        'متابعة-الإقامات.xlsx',
        [
          ['الموظف', 'الرقم الوظيفي', 'الفرع', 'رقم الإقامة', 'تنتهي في', 'الهجري', 'المتبقي (يوم)'],
          ...shown.map((x) => [x.e.nameAr, x.e.empNo, x.e.branch, x.e.iqama, x.e.iqamaEnd, x.e.iqamaEndHijri || '', x.days]),
        ],
        'الإقامات',
      );
    draw();
  }
  /* محتوى viewIqamas (HTML) */
  function renderViewIqamas(accView, brs, cnt, main, st) {
    main.innerHTML = `${head(accView ? `متابعة الإقامات — فرع ${esc(state.user.branch)}` : 'متابعة الإقامات', accView ? 'إقامات موظفي فرعك المنتهية والتي تقترب من الانتهاء — ارفع طلب التجديد من زر "طلب تجديد" بجوار الموظف' : 'الإقامات المنتهية والتي تقترب من الانتهاء — يصل لشئون الموظفين إشعار عند 30 و14 و7 و3 ويوم قبل انتهاء كل إقامة', '<button class="btn" id="iqXls">📊 Excel</button>')}
      <div class="emp-tiles" style="grid-template-columns:repeat(4,1fr)">
        <button type="button" class="emp-tile" data-rg="-1"><div class="t-top"><span class="t-n">${cnt((x) => x.days < 0)}</span><span class="t-ic" style="--m:#dc2626">${icon('xCircle')}</span></div><span class="t-l">منتهية</span></button>
        <button type="button" class="emp-tile" data-rg="7"><div class="t-top"><span class="t-n">${cnt((x) => x.days >= 0 && x.days <= 7)}</span><span class="t-ic" style="--m:#ea580c">${icon('alert')}</span></div><span class="t-l">خلال 7 أيام</span></button>
        <button type="button" class="emp-tile" data-rg="30"><div class="t-top"><span class="t-n">${cnt((x) => x.days >= 0 && x.days <= 30)}</span><span class="t-ic" style="--m:#f59e0b">${icon('idCard')}</span></div><span class="t-l">خلال شهر</span></button>
        <button type="button" class="emp-tile" data-rg="90"><div class="t-top"><span class="t-n">${cnt((x) => x.days >= 0 && x.days <= 90)}</span><span class="t-ic" style="--m:#0891b2">${icon('calendar')}</span></div><span class="t-l">خلال 3 أشهر</span></button>
      </div>
      <div class="card"><div class="emp-bar"><input class="in" id="iqQ" placeholder="بحث بالاسم أو الرقم الوظيفي أو الإقامة..." style="flex:1;min-width:220px">
        <select class="in" id="iqBr"><option value="">كل الفروع</option>${brs.map((b) => `<option${b === st.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></div>
        <div class="muted" id="iqCount" style="margin-bottom:8px;font-weight:700"></div><div class="tbl-wrap" id="iqTbl"></div></div>`;
  }
  /* أحداث viewIqamas: #iqBr */
  function wireIqamas(draw, st) {
    $('#iqQ').addEventListener('input', (e) => {
      st.q = e.target.value.trim();
      draw();
    });
    $('#iqBr').onchange = (e) => {
      st.branch = e.target.value;
      draw();
    };
  }

  /* (1) توحيد أسماء الفروع والإدارات: كل قيمة مسجلة ← فرع النظام المطابق (مقترح تلقائياً) أو تبقى أو تُضاف فرعاً جديداً؛ والإدارات تُدمج بإعادة التسمية */
  function empUnifyModal(all, branches, done) {
    const brN = (b) => {
      const s = String(b || '')
        .trim()
        .replace(/^فرع\s+/, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/\s*-\s*/g, ' - ')
        .replace(/\s+/g, ' ');
      return { جازان: 'جيزان' }[s] || s;
    };
    const count = (k) => {
      const o = {};
      all.forEach((x) => {
        const v = String(x[k] || '').trim();
        if (v) o[v] = (o[v] || 0) + 1;
      });
      return Object.entries(o).sort((a, b) => b[1] - a[1]);
    };
    const brs = count('branch').filter(([v]) => !branches.includes(v));
    const deps = count('department');
    /* اقتراح اسم الإدارة: تصحيح المسافات حول الشرطة فقط (بدون تغيير الحروف) */
    const depN = (v) =>
      String(v || '')
        .replace(/\s*-\s*/g, ' - ')
        .replace(/\s+/g, ' ')
        .trim();
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    renderEmpUnifyModal(bg, brN, branches, brs, depN, deps);
    document.body.appendChild(bg);
    let cur = 'b';
    $$('[data-ut]', bg).forEach((a) => {
      a.onclick = (ev) => {
        ev.preventDefault();
        cur = a.dataset.ut;
        $$('[data-ut]', bg).forEach((x) => x.classList.toggle('on', x === a));
        $$('[data-up]', bg).forEach((p) => {
          p.hidden = p.dataset.up !== cur;
        });
      };
    });
    $('[data-x]', bg).onclick = () => bg.remove();
    $('[data-uok]', bg).onclick = async () => {
      try {
        let body;
        if (cur === 'b') {
          const map = {},
            addBranches = [];
          $$('[data-ub]', bg).forEach((s) => {
            if (s.value === '__add') {
              addBranches.push(s.dataset.ub);
            } else if (s.value) map[s.dataset.ub] = s.value;
          });
          body = { field: 'branch', map, addBranches };
          if (!Object.keys(map).length && !addBranches.length) throw new Error('لم تختر أي تغيير');
        } else {
          const map = {};
          $$('[data-ud]', bg).forEach((i) => {
            const v = i.value.trim();
            if (v && v !== i.dataset.ud) map[i.dataset.ud] = v;
          });
          body = { field: 'department', map };
          if (!Object.keys(map).length) throw new Error('لم تغيّر أي اسم');
        }
        if (!(await askYesNo('تطبيق التوحيد على سجل الموظفين؟ (يسجّل النظام التغيير في نشاط كل موظف)'))) return;
        const x = await api('POST', '/api/employees/unify', body);
        toast(`تم توحيد بيانات ${x.updated} موظف`);
        bg.remove();
        done();
      } catch (err) {
        $('#uErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* محتوى empUnifyModal (HTML) */
  function renderEmpUnifyModal(bg, brN, branches, brs, depN, deps) {
    bg.innerHTML = `<div class="modal" style="max-width:820px;width:96%"><h3 style="margin-top:0">🔧 توحيد أسماء الفروع والإدارات في سجل الموظفين</h3>
      <div class="tabs"><a href="#" class="on" data-ut="b">الفروع (${brs.length} غير موحد)</a><a href="#" data-ut="d">الإدارات (${deps.length})</a></div>
      <div data-up="b"><div class="hint" style="margin-bottom:8px">كل فرع مسجل للموظفين وليس من فروع النظام: اختر فرع النظام المقابل (مقترح تلقائياً عند التطابق)، أو "يبقى كما هو"، أو أضفه فرعاً جديداً في النظام.</div>
        ${
          brs.length
            ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>المسجل في السجل</th><th>الموظفون</th><th>يصبح</th></tr></thead><tbody>${brs
                .map(([v, n]) => {
                  const sug = branches.find((b) => brN(b) === brN(v));
                  return `<tr><td><b>${esc(v)}</b></td><td>${n}</td><td><select class="in" data-ub="${esc(v)}"><option value="">— يبقى كما هو —</option><option value="__add">➕ إضافته فرعاً جديداً في النظام</option>${branches.map((b) => `<option${b === sug ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></td></tr>`;
                })
                .join('')}</tbody></table></div>`
            : '<div class="emp-al ok">✔ كل فروع الموظفين موحدة مع فروع النظام</div>'
        }</div>
      <div data-up="d" hidden><div class="hint" style="margin-bottom:8px">لدمج إدارتين أو تصحيح كتابة: اكتب الاسم الموحد في "يصبح" (والقيم المتشابهة مقترحة بنفس الاسم). اتركه كما هو لعدم التغيير.</div>
        <div class="tbl-wrap" style="max-height:50vh;overflow:auto"><table class="tbl"><thead><tr><th>المسجل في السجل</th><th>الموظفون</th><th>يصبح</th></tr></thead><tbody>${deps.map(([v, n]) => `<tr><td><b>${esc(v)}</b></td><td>${n}</td><td><input class="in" data-ud="${esc(v)}" list="dl-udeps" value="${esc(depN(v))}"></td></tr>`).join('')}</tbody></table></div>
        <datalist id="dl-udeps">${[...new Set(deps.map(([v]) => depN(v)))].map((v) => `<option value="${esc(v)}">`).join('')}</datalist></div>
      <div id="uErr"></div>
      <div class="row" style="margin-top:14px;gap:8px"><button class="btn primary" data-uok>تطبيق التوحيد</button><button class="btn ghost" data-x>إغلاق</button></div></div>`;
  }

  async function viewEmployees(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/employees');
    const res = await api('GET', '/api/employees');
    const all = res.list;
    const active = all.filter((e) => e.status !== 'غير نشط');
    /* القوة العاملة: إجمالي موظفي الشركة (النشطين) */
    /* نسبة التوطين = السعوديون النشطون المحتسبون في نطاق التوطين ÷ القوة العاملة */
    const nitPct = () => {
      const n = active.length;
      return n ? `${Math.round((active.filter((e) => SF.saudiCounted(e)).length / n) * 1000) / 10}%` : '—';
    };
    const TILES = [
      ['force', 'القوة العاملة', 'users', '#9b1c1c', (e) => e.status !== 'غير نشط'],
      ['citizen', 'مواطن', 'flag:sa', '#0f766e', (e) => SF.empCitizen(e)],
      ['resident', 'مقيم', 'compass', '#0891b2', (e) => !SF.empCitizen(e)],
      ['nitaqat', 'نسبة التوطين', 'chart', '#15803d', (e) => SF.saudiCounted(e), nitPct],
      ['nitaqatN', 'محتسبون في نطاق التوطين', 'checkCircle', '#16a34a', (e) => SF.saudiCounted(e)],
      [
        'nitaqatNo',
        'سعوديون غير محتسبين في التوطين',
        'xCircle',
        '#b45309',
        (e) => e.status !== 'غير نشط' && SF.empCitizen(e) && e.saNitaqat === 'لا',
      ],
      ['saCat1', 'سعودي — تصنيف 1', 'sym:1', '#0f766e', (e) => SF.empCitizen(e) && e.saCategory === '1'],
      ['saCat2', 'سعودي — تصنيف 2', 'sym:2', '#0e7490', (e) => SF.empCitizen(e) && e.saCategory === '2'],
      ['male', 'ذكر', 'sym:♂', '#4f6bd8', (e) => e.gender === 'ذكر'],
      ['female', 'أنثى', 'sym:♀', '#d9539a', (e) => e.gender === 'أنثى'],
      ['docs', 'مستندات تنتهي خلال 30 يوماً', 'alert', '#dc2626', (e) => e.status !== 'غير نشط' && !!empAlert(e)],
      [
        'docs60',
        'مستندات تنتهي خلال 60 يوماً',
        'calendar',
        '#f59e0b',
        (e) => e.status !== 'غير نشط' && empDocs(e).some((d) => d.days <= 60),
      ],
    ];
    /* الجنسيات: مربع لكل جنسية بعلمها (الكتابات المختلفة لنفس الدولة تُجمع)، مرتبة بالعدد */
    const natKey = (e) => SF.flagOf(e.nationality) || String(e.nationality || '').trim() || 'غير محددة';
    const NATS = Object.values(
      all.reduce((m, e) => {
        const k = natKey(e),
          n = String(e.nationality || '').trim() || 'غير محددة';
        const x = m[k] || (m[k] = { k, names: {}, count: 0 });
        x.count++;
        x.names[n] = (x.names[n] || 0) + 1;
        return m;
      }, {}),
    )
      .map((x) => ({ ...x, label: Object.entries(x.names).sort((a, b) => b[1] - a[1])[0][0], flag: SF.flagOf(Object.keys(x.names)[0]) }))
      .sort((a, b) => b.count - a.count);
    NATS.forEach((x) => TILES.push([`nat:${x.k}`, x.label, '', '', (e) => natKey(e) === x.k]));
    const st = {
      tile: TILES.some((t) => t[0] === query.f) ? query.f : '',
      q: '',
      by: 'all',
      branch: query.branch || '',
      dept: query.dept || '',
      page: 0,
    };
    /* 48 = مضاعف لعدد الكروت في الصف (4 / 3 / 2) فلا يبقى مكان فارغ في آخر صف */
    const PER = 48;
    const depts = [...new Set(all.map((e) => e.department).filter(Boolean))].sort();
    const brs = [...new Set(all.map((e) => e.branch).filter(Boolean))].sort();
    const SEARCH_BY = [
      ['all', 'الكل'],
      ['nameAr', 'اسم الموظف'],
      ['empNo', 'الرقم الوظيفي'],
      ['iqama', 'رقم الهوية / الإقامة'],
      ['phone', 'رقم الجوال'],
    ];
    return viewEmployeesPart2(NATS, PER, SEARCH_BY, TILES, active, all, brs, depts, main, query, res, st);
  }
  /* جزء من viewEmployees: renderViewEmployees(NATS, SEARCH_BY, TILES, active… */
  function viewEmployeesPart2(NATS, PER, SEARCH_BY, TILES, active, all, brs, depts, main, query, res, st) {
    renderViewEmployees(NATS, SEARCH_BY, TILES, active, all, brs, depts, main, res, st);
    let shown = [];
    const draw = () => {
      const tile = TILES.find((t) => t[0] === st.tile);
      const q = st.q.toLowerCase();
      const keys = st.by === 'all' ? ['nameAr', 'nameEn', 'empNo', 'iqama', 'phone', 'email', 'title'] : [st.by];
      shown = all.filter(
        (e) =>
          (!tile || tile[4](e)) &&
          (!st.branch || e.branch === st.branch) &&
          (!st.dept || e.department === st.dept) &&
          (!q ||
            keys.some((k) =>
              String(e[k] || '')
                .toLowerCase()
                .includes(q),
            )),
      );
      const pages = Math.max(1, Math.ceil(shown.length / PER));
      st.page = Math.min(st.page, pages - 1);
      const from = st.page * PER;
      $('#emGrid').innerHTML =
        shown
          .slice(from, from + PER)
          .map((e) => empCard(e, res.editor))
          .join('') || '<div class="muted" style="grid-column:1/-1;text-align:center;padding:30px">لا يوجد موظفون</div>';
      $('#emCount').textContent = shown.length
        ? `عرض النتائج: ${from + 1} - ${Math.min(from + PER, shown.length)} من ${shown.length} موظف`
        : 'عرض النتائج: 0 موظف';
      /* أرقام الصفحات: الأولى، السابقة، الصفحات القريبة، التالية، الأخيرة */
      const p = st.page,
        nums = [];
      for (let i = Math.max(0, p - 3); i <= Math.min(pages - 1, p + 3); i++) nums.push(i);
      const b = (i, label, off, on) =>
        `<button type="button" class="btn sm${on ? ' primary' : ''}" data-pg="${i}"${off ? ' disabled' : ''}>${label}</button>`;
      $$('[data-pager]', main).forEach((x) => {
        x.innerHTML =
          pages < 2
            ? ''
            : b(0, 'الأولى', p === 0) +
              b(p - 1, 'السابقة', p === 0) +
              nums.map((i) => b(i, i + 1, false, i === p)).join('') +
              b(p + 1, 'التالية', p >= pages - 1) +
              b(pages - 1, 'الأخيرة', p >= pages - 1) +
              `<span class="muted" style="align-self:center">صفحة ${p + 1} من ${pages}</span>`;
      });
      $$('[data-tile]', main).forEach((b) => b.classList.toggle('on', b.dataset.tile === st.tile));
    };
    $$('[data-tile]', main).forEach((b) => {
      b.onclick = () => {
        st.tile = st.tile === b.dataset.tile ? '' : b.dataset.tile;
        st.page = 0;
        draw();
      };
    });
    wireEmployees(draw, st);
    main.addEventListener('click', (ev) => {
      const g = ev.target.closest('[data-pg]');
      if (!g || g.disabled) return;
      st.page = Number(g.dataset.pg);
      draw();
      window.scrollTo(0, 0);
    });
    wireEmGrid(all, res);
    $('#emXls').onclick = () => {
      const cols = empCols(res.salary);
      downloadXlsx(
        'سجل-الموظفين.xlsx',
        [
          cols.map((f) => f.label),
          ...shown.map((e) =>
            cols.map((f) => (f.type === 'number' && e[f.key] !== '' && e[f.key] != null ? Number(e[f.key]) : e[f.key] || '')),
          ),
        ],
        'الموظفون',
      );
    };
    return viewEmployeesPart(all, draw, query, res);
  }
  /* جزء من viewEmployees: if (res.editor) {… */
  function viewEmployeesPart(all, draw, query, res) {
    if (res.editor) {
      $('#emAdd').onclick = () =>
        employeeModal(
          null,
          res.branches,
          (x) => {
            location.hash = `#/employee/${x.id}`;
          },
          null,
          res.salary,
        );
      if ($('#emUni')) $('#emUni').onclick = () => empUnifyModal(all, res.branches, () => viewEmployees(query));
      if ($('#emAcc')) $('#emAcc').onclick = () => empAccountsBulk(() => viewEmployees(query));
      const sample = {
        nameAr: 'محمد أحمد علي',
        nameEn: 'MOHAMED AHMED ALI',
        gender: 'ذكر',
        nationality: 'مصري',
        phone: '966500000000',
        iqama: '2500000000',
        iqamaEnd: '2027-01-31',
        empNo: '101',
        title: 'فني مختبر',
        department: 'المختبرات',
        branch: res.branches[0] || '',
        joinDate: '2024-03-01',
        status: 'نشط',
        basic: '5000',
      };
      $('#emImp').onclick = () =>
        gridImportModal({
          title: 'رفع الموظفين من Excel',
          template: 'قالب-سجل-الموظفين.xlsx',
          cols: empCols(res.salary),
          hint: 'الصف الأول عناوين الأعمدة بنفس أسماء القالب. الموظف المسجل مسبقاً (بنفس الرقم الوظيفي أو رقم الهوية) يحدّث النظام بياناته بالخانات المكتوبة فقط، ويضيف الجديد. التواريخ بصيغة سنة-شهر-يوم أو يوم/شهر/سنة. الفرع بنفس أسماء فروع النظام، والقوائم (الجنس، الحالة...) بنفس خياراتها.',
          sample: empCols(res.salary).map((f) => sample[f.key] || ''),
          save: (rows) => api('POST', '/api/employees/bulk', { rows }),
          done: (r) => {
            toast(`تم: إضافة ${r.added} وتحديث ${r.updated}`);
            route();
            if (r.errors.length || r.notes.length) importReport(r);
          },
        });
    }
    draw();
  }
  /* محتوى viewEmployees (HTML) */
  function renderViewEmployees(NATS, SEARCH_BY, TILES, active, all, brs, depts, main, res, st) {
    main.innerHTML = `${head('سجل الموظفين', `${all.length} موظف — ${active.length} نشط`, `${res.editor ? '<button class="btn" id="emAcc">➕ إنشاء حسابات الموظفين</button><button class="btn" id="emUni">🔧 توحيد الفروع والإدارات</button><button class="btn primary" id="emAdd">➕ إضافة موظف</button><button class="btn" id="emImp">📥 رفع من Excel</button>' : ''}<button class="btn" id="emXls">📊 Excel</button>`)}
      <h3 style="margin:0 0 10px">ملخص</h3>
      <div class="emp-tiles">${TILES.filter(([k]) => !k.startsWith('nat:'))
        .map(
          ([k, l, ic, c, fn, val]) =>
            `<button type="button" class="emp-tile" data-tile="${k}"><div class="t-top"><span class="t-n">${val ? val() : all.filter(fn).length}</span>${ic.startsWith('flag:') ? `<span class="t-flag"><img src="flags/${ic.slice(5)}.svg" alt=""></span>` : `<span class="t-ic" style="--m:${c}">${ic.startsWith('sym:') ? `<b class="t-sym">${ic.slice(4)}</b>` : icon(ic)}</span>`}</div><span class="t-l">${l}</span></button>`,
        )
        .join('')}</div>
      <h3 style="margin:16px 0 10px">الجنسيات</h3>
      <div class="emp-tiles nat-tiles">${NATS.map((x) => `<button type="button" class="emp-tile" data-tile="nat:${esc(x.k)}"><div class="t-top"><span class="t-n">${x.count}</span><span class="t-flag">${x.flag ? `<img src="flags/${x.flag}.svg" alt="">` : icon('compass')}</span></div><span class="t-l">${esc(x.label)}</span></button>`).join('')}</div>
      <div class="card"><div class="emp-sec-h"><h3>قائمة الموظفين</h3><div class="emp-pager" data-pager></div></div>
        <div class="emp-bar">
          <select class="in" id="emBy">${SEARCH_BY.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
          <input class="in" id="emQ" placeholder="ابحث..." style="flex:1;min-width:200px">
          <select class="in" id="emBr"><option value="">كل الفروع</option>${brs.map((b) => `<option${b === st.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select>
          <select class="in" id="emDp"><option value="">كل الإدارات</option>${depts.map((d) => `<option>${esc(d)}</option>`).join('')}</select>
          <button class="btn ghost" id="emClr">مسح</button>
        </div>
        <div class="muted" id="emCount" style="margin-bottom:10px;font-weight:700"></div>
        <div class="emp-grid" id="emGrid"></div>
        <div class="emp-pager" data-pager style="margin-top:14px;justify-content:center"></div></div>`;
  }
  /* أحداث viewEmployees: #emGrid */
  function wireEmGrid(all, res) {
    $('#emGrid').onclick = (ev) => {
      const b = ev.target.closest('[data-eed]');
      if (b)
        employeeModal(
          all.find((x) => x.id === b.dataset.eed),
          res.branches,
          () => route(),
          null,
          res.salary,
        );
    };
  }
  /* أحداث viewEmployees: #emBy، #emBr، #emDp، #emClr */
  function wireEmployees(draw, st) {
    $('#emQ').addEventListener('input', (e) => {
      st.q = e.target.value.trim();
      st.page = 0;
      draw();
    });
    $('#emBy').onchange = (e) => {
      st.by = e.target.value;
      st.page = 0;
      draw();
    };
    $('#emBr').onchange = (e) => {
      st.branch = e.target.value;
      st.page = 0;
      draw();
    };
    $('#emDp').onchange = (e) => {
      st.dept = e.target.value;
      st.page = 0;
      draw();
    };
    $('#emClr').onclick = () => {
      Object.assign(st, { tile: '', q: '', by: 'all', branch: '', dept: '', page: 0 });
      $('#emQ').value = '';
      $('#emBy').value = 'all';
      $('#emBr').value = '';
      $('#emDp').value = '';
      draw();
    };
  }

  /* إنشاء حسابات كل الموظفين النشطين دفعة واحدة */
  async function empAccountsBulk(done) {
    const must = await askYesNo(
      'إنشاء حساب دخول لكل موظف نشط ليس له حساب:\nاسم المستخدم وكلمة المرور = رقم الهوية.\n\nهل يطلب النظام من الموظف تغيير كلمة المرور عند أول دخول؟ (موصى به — رقم الهوية معروف لغيره)\n\nنعم = يطلب النظام التغيير، لا = تبقى كلمة المرور رقم الهوية',
    );
    try {
      const r = await api('POST', '/api/employees/accounts/bulk', { mustChange: must });
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal" style="max-width:640px"><h3 style="margin-top:0">حسابات الموظفين</h3><div class="emp-al ok">✔ أنشأنا ${r.created} حساب${r.linked ? ` — ورُبط ${r.linked} حساب موجود` : ''}</div>
        ${r.skippedCount ? `<p><b>لم ننشئ حساباً لـ ${r.skippedCount} موظف:</b></p><div class="tbl-wrap" style="max-height:45vh;overflow:auto"><table class="tbl"><tbody>${r.skipped.map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.empNo)}</td><td>${esc(x.why)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        <div class="row" style="margin-top:12px"><button class="btn primary" data-x>تم</button></div></div>`;
      document.body.appendChild(bg);
      $('[data-x]', bg).onclick = () => {
        bg.remove();
        if (done) done();
      };
    } catch (err) {
      toast(err.message, true);
    }
  }

  return { viewIqamas, viewEmployees };
};
