'use strict';
/* أجزاء ملف الموظف (2) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['employee-file-2'] = function (S, ctx) {
  const {
    $,
    $$,
    SF,
    api,
    askText,
    askYesNo,
    docLeft,
    dt,
    empAccCard,
    empEmpty,
    empMoney,
    empPhoto,
    employeeModal,
    esc,
    head,
    icon,
    kpiCard,
    natFlag,
    requestsTable,
    state,
    toast,
    today,
    uploadFile,
  } = S;
  const { bindEmpAcc, empRowModal, printEmpCv, viewEmployee } = ctx;
  /* جزء من viewEmployee: return viewEmployeePart5(… */
  function viewEmployeePart6(
    L,
    SECS,
    TABS,
    box,
    docStat,
    docs,
    e,
    editBtn,
    id,
    lv,
    main,
    openAssets,
    pendingReq,
    query,
    secHead,
    stat,
    tab,
  ) {
    return viewEmployeePart5(
      L,
      SECS,
      TABS,
      box,
      docStat,
      docs,
      e,
      editBtn,
      id,
      lv,
      main,
      openAssets,
      pendingReq,
      query,
      secHead,
      stat,
      tab,
    );
  }
  /* جزء من viewEmployee: return viewEmployeePart4(… */
  function viewEmployeePart5(
    L,
    SECS,
    TABS,
    box,
    docStat,
    docs,
    e,
    editBtn,
    id,
    lv,
    main,
    openAssets,
    pendingReq,
    query,
    secHead,
    stat,
    tab,
  ) {
    return viewEmployeePart4(
      L,
      SECS,
      TABS,
      box,
      docStat,
      docs,
      e,
      editBtn,
      id,
      lv,
      main,
      openAssets,
      pendingReq,
      query,
      secHead,
      stat,
      tab,
    );
  }
  /* جزء من viewEmployee: return viewEmployeePart3(… */
  function viewEmployeePart4(
    L,
    SECS,
    TABS,
    box,
    docStat,
    docs,
    e,
    editBtn,
    id,
    lv,
    main,
    openAssets,
    pendingReq,
    query,
    secHead,
    stat,
    tab,
  ) {
    return viewEmployeePart3(
      L,
      SECS,
      TABS,
      box,
      docStat,
      docs,
      e,
      editBtn,
      id,
      lv,
      main,
      openAssets,
      pendingReq,
      query,
      secHead,
      stat,
      tab,
    );
  }
  /* جزء من viewEmployee: e.account ? [['login', 'الدخول والحساب', 'idCard', e.account… */
  function employeeValue(e) {
    return e.account ? [['login', 'الدخول والحساب', 'idCard', e.account.exists ? 0 : 1]] : [];
  }
  /* docStat من viewEmployee (يأخذ docs، stat من الصفحة) */
  function employeeDocStat(docs, stat, k, label, ic, color) {
    const d = docs.find((x) => x.k === k);
    return stat(
      label,
      ic,
      color,
      d ? `${esc(SF.fmtDate(d.date))}<br><small>${esc(docLeft(d))}</small>` : '<small>غير مسجل</small>',
      d && d.days < 0 ? 'bad' : d && d.days <= 30 ? 'warn' : '',
    );
  }
  /* listCard من viewEmployee (يأخذ L، e، lv، secHead، val من الصفحة) */
  function employeeListCard(L, e, lv, secHead, val, k, opts = {}) {
    const def = SF.EMP_LISTS[k],
      rows = L(k);
    const cell = (c, r) =>
      c.key === 'days' && !r.days && r.from && r.to ? `${lv.days(r)} <small class="muted">(محسوبة)</small>` : esc(val(c, r[c.key]));
    return `<div class="card">${secHead(opts.title || def.title, e.editor ? `<button class="btn sm primary" data-ladd="${k}">➕ إضافة</button>` : '')}${opts.before || ''}
        ${
          rows.length
            ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th>${def.cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}${e.editor ? '<th></th>' : ''}</tr></thead><tbody>
          ${(opts.sort ? rows.slice().sort(opts.sort) : rows).map((r, i) => `<tr><td>${i + 1}</td>${def.cols.map((c) => `<td>${cell(c, r)}</td>`).join('')}${e.editor ? `<td style="white-space:nowrap"><button class="btn sm ghost" data-led="${k}:${r.id}" title="تعديل">✏️</button> <button class="btn sm ghost" data-ldel="${k}:${r.id}" title="حذف">🗑️</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`
            : empEmpty(`لا توجد سجلات في ${esc(def.title)}`)
        }${opts.after || ''}</div>`;
  }
  /* fieldsCard من viewEmployee (يأخذ e، editBtn، secHead، val من الصفحة) */
  function employeeFieldsCard(e, editBtn, secHead, val, k, skip = []) {
    const [, title, fs] = SF.EMP_SECTIONS.find(([x]) => x === k);
    /* نوع الدوام ونوع البصمة الفارغان: يُعرض الساري تلقائياً بدل «—» */
    const sch = SF.scheduleOf(e);
    const autoTxt = (f) =>
      f.key === 'workSchedule' && !e.workSchedule
        ? `<span class="muted" style="font-weight:600">تلقائي: ${esc(sch ? sch.name : 'الدوام العام')}</span>`
        : f.key === 'punchType' && !e.punchType
          ? `<span class="muted" style="font-weight:600">حسب الدوام: ${SF.punchModeOf(e, sch) === 'flex' ? 'بصمة مرنة' : 'بصمة مكتبية'}</span>`
          : '';
    return `<div class="card">${secHead(title, editBtn(k))}<div class="emp-fields">${fs
      .filter((f) => !skip.includes(f.key) && !(f.saudiOnly && !SF.empCitizen(e)) && SF.empShown(f, e))
      .map(
        (f) =>
          `<div class="emp-f${f.full ? ' full' : ''}"><small>${esc(f.label)}</small><b>${autoTxt(f) || `${f.key === 'nationality' ? natFlag(e[f.key]) : ''}${esc(f.key === 'manager' && e.managerLabel ? e.managerLabel : val(f, e[f.key]))}`}</b></div>`,
      )
      .join('')}</div></div>`;
  }
  /* جزء من viewEmployee: const overview = () => {… */
  function viewEmployeePart3(
    L,
    SECS,
    TABS,
    box,
    docStat,
    docs,
    e,
    editBtn,
    id,
    lv,
    main,
    openAssets,
    pendingReq,
    query,
    secHead,
    stat,
    tab,
  ) {
    const overview = () => {
      const al = [];
      docs.filter((d) => d.days < 0).forEach((d) => al.push(['bad', `${d.l}: منتهية منذ ${-d.days} يوم`]));
      docs
        .filter((d) => d.days >= 0 && d.days <= 30)
        .forEach((d) => al.push(['warn', `${d.l}: تنتهي خلال ${d.days} يوم (${SF.fmtDate(d.date)})`]));
      if (lv.balance < 0) al.push(['bad', `رصيد الإجازة بالسالب (${lv.balance.toFixed(2)} يوم)`]);
      if (!e.joinDate) al.push(['warn', 'تاريخ التعيين غير مسجل — لا يحسب النظام مدة الخدمة ولا رصيد الإجازة']);
      if (e.joinDate && !['تم التثبيت', 'إنهاء خلال التجربة'].includes(e.probationStatus)) {
        const pe =
          e.probationEnd ||
          (() => {
            const d = new Date(`${e.joinDate}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() + (Number(SF.hrPolicyOf(e.joinDate, e).probationDays) || 90) - 1);
            return d.toISOString().slice(0, 10);
          })();
        const pd = SF.daysBetween(today(), pe);
        if (pd !== null && pd >= -60 && pd <= 30)
          al.push([
            pd < 0 ? 'bad' : 'warn',
            pd < 0
              ? `فترة التجربة انتهت ${SF.fmtDate(pe)} دون قرار تثبيت`
              : `فترة التجربة تنتهي ${SF.fmtDate(pe)} (خلال ${pd} يوم) — مطلوب قرار التثبيت أو التمديد`,
          ]);
      }
      if (!e.iqama) al.push(['warn', 'رقم الهوية / الإقامة غير مسجل — لا تظهر طلبات الموظف']);
      SF.empMissingCerts(e).forEach((c) =>
        al.push(['bad', `${c.l}: إلزامية ولم ترفعها بعد (مسجّل للموظف «${c.l.replace('شهادة ', '')}»)`]),
      );
      if (openAssets) al.push(['info', `لدى الموظف ${openAssets} عهدة عينية لم يرجعها`]);
      if (pendingReq) al.push(['info', `${pendingReq} طلب جارٍ للموظف في النظام`]);
      const n = (k) => Number(e[k]) || 0;
      const gross = e.salary
        ? SF.EMP_SECTIONS.find(([x]) => x === 'salary')[2]
            .filter((f) => !SF.EMP_DED.includes(f.key) && f.type === 'number')
            .reduce((s, f) => s + n(f.key), 0)
        : 0;
      const facts = [
        ['الرقم الوظيفي', e.empNo],
        ['رقم الهوية / الإقامة', e.iqama],
        ['الجنسية', e.nationality],
        ['المسمى الوظيفي', e.title],
        ['الإدارة', e.department],
        ['الفرع', e.branch],
        ['المدير المباشر', e.managerLabel || e.manager],
        ['الكفالة', e.kafala],
        ['نوع العقد', e.contractType],
        ['بداية العقد', e.contractStart && SF.fmtDate(e.contractStart)],
        ['انتهاء العقد', e.contractEnd && SF.fmtDate(e.contractEnd)],
        ['رصيد الإجازة السنوي', `${lv.rate} يوماً`],
        ['الجوال', e.phone],
        ['البريد', e.email],
        ...(e.salary ? [['إجمالي الراتب', empMoney(gross)]] : []),
      ];
      return `<div class="card">${secHead('تنبيهات')}${al.length ? `<div class="emp-alerts">${al.map(([c, x]) => `<div class="emp-al ${c}">${c === 'bad' ? '⛔' : c === 'warn' ? '⚠' : 'ℹ'} ${esc(x)}</div>`).join('')}</div>` : '<div class="emp-al ok">✔ لا توجد تنبيهات — بيانات الموظف ومستنداته سارية</div>'}</div>
        <div class="card">${secHead('أهم البيانات', editBtn('company'))}<div class="emp-fields">${facts.map(([l, v2]) => `<div class="emp-f"><small>${esc(l)}</small><b>${l === 'إجمالي الراتب' ? v2 : l === 'الجنسية' ? `${natFlag(v2)}${esc(v2 || '—')}` : esc(v2 || '—')}</b></div>`).join('')}</div></div>
        <div class="card">${secHead(`آخر الطلبات في النظام${e.requests.length > 5 ? ` (5 من ${e.requests.length})` : ''}`, e.requests.length > 5 ? '<button class="btn sm" data-etab="requests">عرض الكل</button>' : '')}${e.iqama ? requestsTable(e.requests.slice(0, 5)) : '<div class="muted">سجّل رقم الهوية / الإقامة لتظهر طلباته</div>'}</div>`;
    };
    /* سجل التغييرات المنظم: الراتب والمسمى والفرع والإدارة والعقد والحالة */
    return viewEmployeePart2(L, SECS, TABS, box, docStat, e, id, lv, main, openAssets, overview, query, secHead, stat, tab);
  }
  /* جزء من viewEmployee: const histCard = () => {… */
  function viewEmployeePart2(L, SECS, TABS, box, docStat, e, id, lv, main, openAssets, overview, query, secHead, stat, tab) {
    const histCard = () => {
      const H = (e.history || []).slice().reverse();
      return `<div class="card">${secHead(`سجل التغييرات${H.length ? ` (${H.length})` : ''}`)}${H.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>التاريخ</th><th>البيان</th><th>من</th><th>إلى</th><th>بواسطة / المرجع</th></tr></thead><tbody>${H.map((h) => `<tr><td>${esc(dt(h.at))}</td><td><b>${esc(h.label)}</b></td><td class="muted">${esc(h.from || '—')}</td><td><b>${esc(h.to || '—')}</b></td><td>${esc(h.by)}${h.ref ? `<div class="muted" style="font-size:12px">${esc(h.ref)}</div>` : ''}</td></tr>`).join('')}</tbody></table></div>` : empEmpty('يسجّل النظام هنا تلقائياً تغييرات الراتب والمسمى والفرع والإدارة والعقد والحالة (من التعديل أو من الطلبات المعتمدة)')}</div>`;
    };
    const GSECS = {
      overview,
      personal: () => SECS.personal() + SECS.dependents(),
      work: () => SECS.company() + SECS.contracts() + histCard() + SECS.periods() + SECS.team(),
      money: () => (e.salary ? SECS.salary() : '') + SECS.insurance(),
      leaves: () => SECS.leaves(),
      files: () => SECS.files() + SECS.assets() + SECS.licenses(),
      cv: () => SECS.cv(),
      growth: () => kpiCard(e.kpi) + SECS.evaluations() + SECS.courses() + SECS.penalties(),
      requests: () => SECS.requests() + SECS.notes() + SECS.timeline(),
      login: () => empAccCard(e),
    };
    renderViewEmployee(GSECS, TABS, box, docStat, e, id, lv, main, openAssets, stat, tab);
    const reload = () => viewEmployee(id, query);
    const show = (k) => {
      query.tab = k;
      $$('[data-etab]', main).forEach((x) => x.classList.toggle('on', x.dataset.etab === k));
      $('#eSec').innerHTML = GSECS[k]();
      history.replaceState(null, '', `#/employee/${id}?tab=${k}`);
    };
    $$('[data-etab]', main).forEach((b) => {
      b.onclick = () => show(b.dataset.etab);
    });
    main.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-tlk]');
      if (!b) return;
      const box = b.closest('#eTl');
      $$('[data-tlk]', box).forEach((x) => x.classList.toggle('on', x === b));
      $$('.etl > li', box).forEach((li) => {
        li.hidden = !!b.dataset.tlk && li.dataset.k !== b.dataset.tlk;
      });
    });
    const sec = $('#eSec');
    /* تعديل نوع الدوام ونوع البصمة للموظف مباشرة من ملخصه */
    $$('[data-schedit]', main).forEach((b) => {
      b.onclick = () => {
        const names = (state.config.workSchedules || []).map((x) => x.name).filter(Boolean);
        const auto = SF.scheduleOf({ ...e, workSchedule: '' });
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = `<form class="modal" style="max-width:520px"><h3 style="margin-top:0">الدوام والبصمة — ${esc(e.nameAr)}</h3>
        <div class="field"><label>نوع الدوام</label><select class="in" name="ws"><option value="">تلقائي حسب القواعد${auto ? ` (${esc(auto.name)})` : ' (الدوام العام)'}</option>${names.map((n) => `<option${e.workSchedule === n ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
          ${names.length ? '' : '<div class="hint">لا توجد أنواع دوام — أضفها من الإعدادات ← الموارد البشرية ← أنواع الدوام</div>'}</div>
        <div class="field"><label>نوع البصمة</label><select class="in" name="pt"><option value="">حسب نوع الدوام</option>${['بصمة مكتبية', 'بصمة مرنة'].map((n) => `<option${e.punchType === n ? ' selected' : ''}>${n}</option>`).join('')}</select>
          <div class="hint">مكتبية: داخل نطاق موقع الفرع / الإدارة. مرنة: من أي مكان ويُسجَّل مكان البصمة.</div></div>
        <div class="field"><label>معفي من البصمة</label><select class="in" name="px">${['لا', 'نعم'].map((n) => `<option${(e.punchExempt || 'لا') === n ? ' selected' : ''}>${n}</option>`).join('')}</select>
          <div class="hint">نعم = لا يُحتسب عليه غياب ولا تأخير ولا انصراف مبكر (يبصم اختيارياً).</div></div>
        <div class="merr"></div><div class="row" style="margin-top:12px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
        document.body.appendChild(bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        $('form', bg).onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            await api('PUT', `/api/employees/${e.id}`, {
              workSchedule: $('[name=ws]', bg).value,
              punchType: $('[name=pt]', bg).value,
              punchExempt: $('[name=px]', bg).value,
            });
            bg.remove();
            toast('تم تحديد الدوام والبصمة');
            reload();
          } catch (err) {
            $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      };
    });
    return viewEmployeePart(L, e, id, main, reload, sec, show);
  }
  /* جزء من viewEmployee: sec.onclick = async (ev) => {… */
  function viewEmployeePart(L, e, id, main, reload, sec, show) {
    sec.onclick = async (ev) => {
      const t = (a) => ev.target.closest(`[${a}]`);
      if (t('data-etab')) return show(t('data-etab').dataset.etab);
      if (t('data-id')) {
        location.hash = `#/req/${t('data-id').dataset.id}`;
        return;
      }
      if (t('data-esec')) return employeeModal(e, e.branches, reload, t('data-esec').dataset.esec, e.salary);
      if (t('data-ladd')) return empRowModal(e, t('data-ladd').dataset.ladd, null, reload);
      if (t('data-led')) {
        const [k, rid] = t('data-led').dataset.led.split(':');
        return empRowModal(
          e,
          k,
          L(k).find((x) => x.id === rid),
          reload,
        );
      }
      if (t('data-ldel')) {
        const [k, rid] = t('data-ldel').dataset.ldel.split(':');
        if (!(await askYesNo(`حذف هذا السجل من ${SF.EMP_LISTS[k].title}؟`))) return;
        try {
          await api('PUT', `/api/employees/${id}/lists/${k}`, { rows: L(k).filter((x) => x.id !== rid) });
          toast('تم الحذف');
          reload();
        } catch (err) {
          toast(err.message, true);
        }
        return;
      }
      if (t('data-fdel')) {
        if (!(await askYesNo('حذف هذا المستند؟'))) return;
        try {
          await api('DELETE', `/api/employees/${id}/files/${t('data-fdel').dataset.fdel}`);
          toast('تم حذف المستند');
          reload();
        } catch (err) {
          toast(err.message, true);
        }
      }
    };
    sec.addEventListener('input', (ev) => {
      if (ev.target.id !== 'tmQ') return;
      const q = ev.target.value.trim().toLowerCase();
      $$('#tmBox .emp-card', sec).forEach((c) => {
        c.hidden = !!q && !c.textContent.toLowerCase().includes(q);
      });
    });
    sec.addEventListener('change', async (ev) => {
      const cat = ev.target.dataset && ev.target.dataset.efcat;
      if (cat) {
        try {
          for (const f of ev.target.files) await uploadFile(null, f, cat, `/api/employees/${id}/files`);
          toast(`تم رفع ${cat}`);
          reload();
        } catch (err) {
          toast(err.message, true);
        }
        return;
      }
      if (ev.target.id !== 'efFile') return;
      const label = ($('#efLabel', sec) || {}).value || '';
      try {
        for (const f of ev.target.files) await uploadFile(null, f, label.trim(), `/api/employees/${id}/files`);
        toast('تم رفع المستند');
        reload();
      } catch (err) {
        toast(err.message, true);
      }
    });
    if ($('#eEdit')) $('#eEdit').onclick = () => employeeModal(e, e.branches, reload, null, e.salary);
    main.addEventListener('click', (ev) => {
      if (ev.target.closest('#eCvPrint')) printEmpCv(e);
    });
    bindEmpAcc(e, reload);
    return wireEmployee(e, id, reload);
  }
  /* محتوى viewEmployee (HTML) */
  function renderViewEmployee(GSECS, TABS, box, docStat, e, id, lv, main, openAssets, stat, tab) {
    main.innerHTML = `${head('ملف الموظف', '', `<a class="btn ghost" href="#/employees">رجوع لسجل الموظفين</a><a class="btn" href="#/employee-print/${id}" target="_blank">⬇ تحميل ملف الموظف</a>${e.editor ? '<button class="btn primary" id="eEdit">✏️ تعديل كل البيانات</button>' : ''}${e.admin ? '<button class="btn bad" id="eDel">🗑️ حذف</button>' : ''}`)}
      <div class="card"><div class="emp-head">
        <div>${empPhoto(e, true)}${e.editor ? `<div class="row" style="gap:6px;margin-top:8px;justify-content:center"><label class="btn sm" style="cursor:pointer">📷 ${e.photo ? 'تغيير' : 'إضافة صورة'}<input type="file" id="ePhoto" accept="image/*" hidden></label>${e.photo ? '<button class="btn sm ghost" id="ePhotoDel" title="حذف الصورة">✕</button>' : ''}</div>` : ''}</div>
        <div style="flex:1;min-width:0"><h2>${esc(e.nameAr)}</h2>${e.nameEn ? `<div class="muted" dir="ltr" style="text-align:right;margin-bottom:8px">${esc(e.nameEn)}</div>` : ''}
          <div class="emp-chips">${e.title ? `<span class="chip approved">${esc(e.title)}</span>` : ''}<span class="chip ${e.status === 'غير نشط' ? 'cancelled' : 'approved'}">${esc(e.status || 'نشط')}</span>${e.gender ? `<span class="chip">${esc(e.gender)}</span>` : ''}<span class="chip">${SF.empCitizen(e) ? 'مواطن' : 'مقيم'}</span>${e.nationality ? `<span class="chip">${natFlag(e.nationality)}${esc(e.nationality)}</span>` : ''}</div>
          <div class="emp-info">${box('idCard', '#3b9fd6', 'الرقم الوظيفي', e.empNo)}${box('layers', '#4f6bd8', 'الإدارة', e.department)}${box('branch', '#f2734d', 'الفرع', e.branch)}
            ${box('mail', '#f06b8b', 'الإيميل', e.email, true)}${box('file', '#f5a03a', 'رقم الجوال', e.phone, true)}
            ${(() => {
              /* نوع الدوام ونوع البصمة الساريان (من ملف الموظف أو تلقائياً من قواعد أنواع الدوام) */
              const sch = SF.scheduleOf(e),
                pm = SF.punchModeOf(e, sch);
              const st = sch
                ? `${sch.name} — ${sch.mode === 'flex' ? 'مرن' : 'مكتبي'}${e.workSchedule ? '' : ' (تلقائي)'}`
                : 'الدوام العام';
              const pt =
                `${pm === 'flex' ? 'مرنة — من أي مكان' : 'مكتبية — داخل الموقع'}${e.punchType ? '' : ' (حسب الدوام)'}` +
                (e.punchExempt === 'نعم' ? ' — معفي من البصمة' : '');
              return `${box('calendar', '#ea580c', 'نوع الدوام', st)}${box('mapPin', '#0e9f9a', 'نوع البصمة', pt)}${e.editor ? '<button type="button" class="btn sm" data-schedit title="تحديد نوع الدوام ونوع البصمة لهذا الموظف">✏️ الدوام والبصمة</button>' : ''}`;
            })()}</div></div>
      </div></div>
      <div class="emp-stats emp-kpis">
        ${stat('تاريخ التعيين', 'calendar', '#3b9fd6', e.joinDate ? `${esc(SF.fmtDate(e.joinDate))}<br><small>${lv.span ? `خدمة ${lv.span.y} سنة و${lv.span.m} شهر و${lv.span.d} يوم${e.leaveDate ? ' (حتى آخر يوم عمل)' : ''}` : ''}</small>` : '<small>غير مسجل</small>', e.joinDate ? '' : 'warn')}
        ${stat('مباشرة العمل (آخر عودة من الإجازة)', 'rotate', '#7c5cd6', lv.ret ? `${esc(SF.fmtDate(lv.ret))}<br><small>${lv.retSpan ? `منذ ${lv.retSpan.y ? `${lv.retSpan.y} سنة و` : ''}${lv.retSpan.m} شهر و${lv.retSpan.d} يوم` : ''} · ${e.returnDate ? 'مسجل في الملف' : lv.ret === e.joinDate ? 'لا إجازة بعد التعيين' : 'اليوم التالي لآخر إجازة سنوية'}</small>` : '<small>غير مسجل</small>')}
        ${stat('رصيد الإجازة المتاح', 'bookOpen', '#0e9f9a', `${lv.balance.toFixed(2)} <small>يوم</small><br><small>السنوي ${lv.rate} يوماً</small>`, lv.balance < 0 ? 'bad' : '')}
        ${docStat('iqamaEnd', 'انتهاء الهوية / الإقامة', 'idCard', '#0f766e')}${docStat('contractEnd', 'انتهاء العقد', 'filePen', '#dc2645')}
        ${stat('العهد لدى الموظف', 'boxes', '#f5a03a', `${openAssets} <small>عهدة</small>`, openAssets ? 'warn' : '')}
      </div>
      <div class="emp-layout"><div class="emp-tabs">${TABS.map(([k, l, ic, badge, cnt]) => `<button type="button" data-etab="${k}" class="${k === tab ? 'on' : ''}"><span class="row" style="gap:8px">${icon(ic)}${esc(l)}${cnt ? ` <small class="muted">(${cnt})</small>` : ''}</span>${badge ? `<span class="badge">${badge}</span>` : ''}</button>`).join('')}</div>
        <div id="eSec">${GSECS[tab]()}</div></div>`;
  }
  /* أحداث viewEmployee: #eDel، #ePhoto، #ePhotoDel */
  function wireEmployee(e, id, reload) {
    if ($('#eDel'))
      $('#eDel').onclick = async () => {
        const reason = await askText(
          `حذف الموظف "${e.nameAr}"`,
          'سبب الحذف (يُنقل لمحذوفات الموظفين ويمكن استعادته، ولا يُعاد استخدام رقمه الوظيفي)',
        );
        if (reason === null) return;
        try {
          await api('DELETE', `/api/employees/${id}?reason=${encodeURIComponent(reason)}`);
          toast('تم حذف الموظف');
          location.hash = '#/employees';
        } catch (err) {
          toast(err.message, true);
        }
      };
    /* الصورة تُصغَّر في المتصفح إلى 320 بكسل (JPEG) قبل رفعها */
    if ($('#ePhoto'))
      $('#ePhoto').onchange = async (ev) => {
        const f = ev.target.files[0];
        if (!f) return;
        try {
          const img = await new Promise((ok, no) => {
            const i = new Image();
            i.onload = () => ok(i);
            i.onerror = () => no(new Error('الملف ليس صورة صالحة'));
            i.src = URL.createObjectURL(f);
          });
          const s = Math.min(1, 320 / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          await api('PUT', `/api/employees/${id}/photo`, { data: c.toDataURL('image/jpeg', 0.85) });
          toast('تم حفظ الصورة');
          reload();
        } catch (err) {
          toast(err.message, true);
        }
      };
    if ($('#ePhotoDel'))
      $('#ePhotoDel').onclick = async () => {
        try {
          await api('DELETE', `/api/employees/${id}/photo`);
          reload();
        } catch (err) {
          toast(err.message, true);
        }
      };
  }
  return { employeeValue, viewEmployeePart6, employeeDocStat, employeeFieldsCard, employeeListCard };
};
