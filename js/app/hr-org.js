/* الموارد البشرية: كروت الموظفين والهيكل التنظيمي */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc, fmtNum } = SF;
  const { $, state, today, can, api, toast, icon, navItems, askYesNo, normAr, fieldHtml, collect, cwOpen } = S;
  Object.assign(S, { employeeModal, orgChartHtml });

  /* ---------- الموارد البشرية: سجل الموظفين (كروت) وملف الموظف ---------- */
  /* صورة رمزية حسب الجنس إلى أن تُرفع صورة الموظف */
  const AV_MALE =
    '<svg class="emp-ph" viewBox="0 0 80 100" aria-hidden="true"><rect width="80" height="100" fill="#e6ebe8"/><circle cx="40" cy="38" r="17" fill="#8fa69a"/><path d="M8 100c0-21 14-34 32-34s32 13 32 34z" fill="#8fa69a"/></svg>';
  const AV_FEMALE =
    '<svg class="emp-ph" viewBox="0 0 80 100" aria-hidden="true"><rect width="80" height="100" fill="#efe7ea"/><path d="M18 62c-2-30 6-46 22-46s24 16 22 46c-6 4-38 4-44 0z" fill="#a98b97"/><circle cx="40" cy="39" r="15" fill="#c9a9b5"/><path d="M8 100c0-20 14-32 32-32s32 12 32 32z" fill="#a98b97"/></svg>';
  const empAvatar = (e) => (/أنث|انث|female/i.test(e.gender || '') ? AV_FEMALE : /ذكر|male/i.test(e.gender || '') ? AV_MALE : icon('user'));
  const empPhoto = (e, lg) =>
    `<div class="emp-av${lg ? ' lg' : ''}">${e.photo ? `<img src="/api/employees/${e.id}/photo?v=${encodeURIComponent(e.photo)}" alt="" loading="lazy">` : empAvatar(e)}<span class="emp-dot${e.status === 'غير نشط' ? ' off' : ''}" title="${esc(e.status || 'نشط')}"></span></div>`;
  /* أقرب مستند منتهٍ أو ينتهي خلال 30 يوماً */
  const empDocs = (e) =>
    SF.EMP_DOCS.map(([k, l]) => ({ k, l, date: e[k], days: e[k] ? SF.daysBetween(today(), e[k]) : null })).filter((d) => d.days !== null);
  const empAlert = (e) =>
    empDocs(e)
      .filter((d) => d.days <= 30)
      .sort((a, b) => a.days - b.days)[0] || null;
  const docLeft = (d) => (d.days < 0 ? `منتهية منذ ${-d.days} يوم` : d.days === 0 ? 'تنتهي اليوم' : `باقٍ ${d.days} يوم`);
  /* أقسام ملف الموظف المتاحة للمستخدم (الراتب لمن يحق له فقط) */
  const empSecs = (salary) => SF.EMP_SECTIONS.filter(([k]) => k !== 'notes' && (salary || k !== 'salary'));
  /* أعمدة قالب الرفع والتصدير: الرقم الوظيفي أولاً (به يُطابَق الموظف المسجل) ثم باقي الخانات بترتيب الملف */
  const empCols = (salary) => {
    const fs = empSecs(salary).flatMap(([, , x]) => x);
    return [...fs.filter((f) => f.key === 'empNo'), ...fs.filter((f) => f.key !== 'empNo')].map((f) =>
      f.type === 'branch' || f.type === 'tags' ? { ...f, type: '' } : f,
    );
  };
  const empInput = (f, branches) =>
    f.type === 'branch' ? { ...f, type: 'select', options: branches } : f.type === 'tags' ? { ...f, type: '' } : f;
  const empChips = (v, cls = '') =>
    String(v || '')
      .split(/[،,]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => `<span class="emp-tag ${cls}">${esc(x)}</span>`)
      .join('') || '<span class="muted">—</span>';
  const empMoney = (n) => `${fmtNum(Math.round((Number(n) || 0) * 100) / 100)} <small>ريال</small>`;
  /* علم الدولة بجانب الجنسية (يُستنتج تلقائياً من نص الجنسية لأي موظف) */
  const natFlag = (nat) => {
    const c = SF.flagOf(nat);
    return c ? `<img class="flag" src="flags/${c}.svg" alt="" title="${esc(nat)}" loading="lazy">` : '';
  };
  const empCard = (e, editor) => {
    const al = e.status !== 'غير نشط' && e.iqamaEnd !== undefined && empAlert(e);
    /* الكارت على شكل بطاقة هوية: أخضر «مواطن» للسعودي، وأزرق «مقيم» للمقيم */
    const sa = SF.empCitizen(e);
    /* تاريخ انتهاء الهوية / الإقامة: أحمر إذا انتهى، وأصفر إذا بقي 60 يوماً أو أقل */
    const xd = /^\d{4}-\d{2}-\d{2}$/.test(e.iqamaEnd || '') ? SF.daysBetween(today(), e.iqamaEnd) : null;
    const row = (l, v, cls = '') => `<div class="idc-r${cls}"><small>${l}</small><b>${v}</b></div>`;
    return `<div class="emp-card idc ${sa ? 'sa' : 'res'}">
      <div class="idc-h"><span class="idc-type">${icon('idCard')}${sa ? 'مواطن' : 'مقيم'}</span><span class="idc-co">شركة سادن</span></div>
      <div class="idc-b">${empPhoto(e)}
        <div class="idc-f"><a class="emp-name" href="#/employee/${e.id}" title="${esc(`${e.empNo ? `${e.empNo} | ` : ''}${e.nameAr}`)}">${e.empNo ? `<span class="idc-eno" title="الرقم الوظيفي">${esc(e.empNo)}</span> | ` : ''}${esc(e.nameAr)}</a><div class="emp-title">${esc(e.title || '—')}</div>
          <div class="idc-no" title="رقم الهوية / الإقامة"><small>${sa ? 'رقم الهوية' : 'رقم الإقامة'}</small><bdi dir="ltr">${esc(e.iqama || '—')}</bdi></div>
          ${sa ? '' : `<div class="idc-no idc-pp" title="رقم جواز السفر"><small>رقم الجواز</small><bdi dir="ltr">${esc(e.passport || '—')}</bdi></div>`}</div></div>
      <div class="idc-g">${row('الجنسية', `${natFlag(e.nationality || (sa ? 'سعودي' : ''))}${esc(e.nationality || (sa ? 'سعودي' : '—'))}`)}${row(sa ? 'انتهاء الهوية' : 'انتهاء الإقامة', e.iqamaEnd ? `<span title="${xd < 0 ? `منتهية منذ ${-xd} يوم` : `باقٍ ${xd} يوم`}">${esc(SF.fmtDate(e.iqamaEnd))}</span>` : '—', xd === null ? '' : xd < 0 ? ' exp' : xd <= 60 ? ' soon' : '')}
        ${row('الفرع', esc(e.branch || '—'))}${row('الإدارة', esc(e.department || '—'))}
        ${row('رقم الجوال', `<bdi dir="ltr">${esc(e.phone || '—')}</bdi>`)}${row('الكفالة', `<span title="${esc(e.kafala || '')}">${esc(e.kafala || '—')}</span>`, ' full')}${row('الإيميل', `<span title="${esc(e.email || '')}">${esc(e.email || '—')}</span>`, ' full')}</div>
      <div class="emp-foot"><span class="row" style="gap:6px;flex-wrap:wrap">${e.leaveBal != null ? `<span class="emp-leave${e.leaveBal < 0 ? ' neg' : ''}" title="رصيد الإجازة السنوية المتاح (بنفس طريقة التصفية)">${icon('bookOpen')} رصيد الإجازات: <b>${esc(Number(e.leaveBal).toFixed(2))}</b> يوم</span>` : ''}${al ? `<span class="chip ${al.days < 0 ? 'rejected' : 'pending'}" title="${esc(SF.fmtDate(al.date))}">${esc(al.l)}: ${esc(docLeft(al))}</span>` : ''}</span>
        <span class="row" style="gap:4px">${e.uid && e.uid !== state.user.id ? `${can('chat') ? `<button class="btn sm ghost" data-echat="${e.uid}" title="دردشة سريعة">💬</button>` : ''}${can('mail') ? `<a class="btn sm ghost" href="#/mail/new?to=${e.uid}" title="رسالة بريد">✉️</a>` : ''}${editor ? `<button class="btn sm ghost${e.mobBound ? '' : ' dim'}" data-eunbind="${e.id}" title="${e.mobBound ? 'إعادة تعيين الهاتف (إلغاء ربط الجوال الحالي)' : 'لا يوجد جوال مربوط بحسابه'}">📱</button>` : ''}` : ''}${editor ? `<button class="btn sm ghost" data-eed="${e.id}" title="تعديل">✏️</button>` : ''}<a class="btn sm ghost" href="#/employee/${e.id}" title="عرض ملف الموظف">👁</a></span></div></div>`;
  };
  /* إعادة تعيين الهاتف من كارت الموظف: يُلغى ربط الجوال (والبصمة)، وأول جوال يدخل منه بعدها يُربط بحسابه */
  document.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-eunbind]');
    if (!b) return;
    if (b.classList.contains('dim')) {
      toast('لا يوجد جوال مربوط بحساب هذا الموظف');
      return;
    }
    if (!(await askYesNo('إعادة تعيين الهاتف؟ يلغي النظام ربط الجوال الحالي (والبصمة)، وتربط بحسابه أول جوال يدخل منه بعدها.'))) return;
    try {
      await api('POST', `/api/employees/${b.dataset.eunbind}/account`, { action: 'unbindMobile' });
      b.classList.add('dim');
      b.title = 'لا يوجد جوال مربوط بحسابه';
      toast('تمت إعادة تعيين الهاتف');
    } catch (err) {
      toast(err.message, true);
    }
  });
  /* دردشة سريعة من كارت الموظف: تفتح نافذة الدردشة على محادثته الخاصة */
  document.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-echat]');
    if (!b) return;
    try {
      const c = await api('POST', '/api/chat/direct', { userId: b.dataset.echat });
      cwOpen(c.id);
    } catch (err) {
      toast(err.message, true);
    }
  });
  const empEmpty = (msg) => `<div class="emp-empty">${icon('folderOpen')}<div>${msg}</div></div>`;
  /* نافذة إضافة / تعديل موظف (كل الأقسام، أو قسم واحد من ملفه) */
  function employeeModal(e, branches, done, only, salary) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const secs = empSecs(salary !== false && (salary || only === 'salary')).filter(([k]) => (only ? k === only : true));
    bg.innerHTML = `<div class="modal" style="max-width:960px;width:96%"><h3 style="margin-top:0">${e ? `✏️ تعديل بيانات ${esc(e.nameAr)}` : '➕ إضافة موظف'}</h3><form id="emf" novalidate>
      ${secs.map(([, title, fs]) => `<h4 class="b-sec">${title}</h4><div class="grid2" style="grid-template-columns:repeat(3,1fr)">${fs.map((f) => `<div style="${f.full ? 'grid-column:1/-1' : ''}">${fieldHtml(empInput(f, e && e.branch && !branches.includes(e.branch) ? [...branches, e.branch] : branches), (e || {})[f.key] || (f.key === 'status' ? 'نشط' : ''))}</div>`).join('')}</div>`).join('')}
      <div id="emErr"></div><div class="row" style="margin-top:14px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    {
      const natIn = $('[data-key="nationality"]', bg),
        iqIn = $('[data-key="iqama"]', bg);
      const saBoxes = SF.EMP_FIELDS.filter((f) => f.saudiOnly)
        .map((f) => {
          const i = $(`[data-key="${f.key}"]`, bg);
          return i && i.closest('.field') ? i.closest('.field').parentElement : null;
        })
        .filter(Boolean);
      const syncSa = () => {
        const sa = SF.empCitizen({ nationality: natIn ? natIn.value : (e || {}).nationality, iqama: iqIn ? iqIn.value : (e || {}).iqama });
        saBoxes.forEach((b) => {
          b.hidden = !sa;
        });
      };
      [natIn, iqIn].forEach((x) => {
        if (x) {
          x.addEventListener('input', syncSa);
          x.addEventListener('change', syncSa);
        }
      });
      syncSa();
      SF.EMP_FIELDS.filter((f) => f.showIf).forEach((f) => {
        const sel = $(`[data-key="${f.showIf[0]}"]`, bg),
          inp = $(`[data-key="${f.key}"]`, bg);
        const cell = inp && inp.closest('.field') ? inp.closest('.field').parentElement : null;
        if (!sel || !cell) return;
        const sync = () => {
          cell.hidden = ![].concat(f.showIf[1]).includes(sel.value);
        };
        sel.addEventListener('change', sync);
        sync();
      });
    }
    /* المدير المباشر: قائمة منسدلة بالموظفين (الاسم — الرقم الوظيفي)، والاختيار يحفظ الرقم الوظيفي */
    const mgrIn = $('[data-key="manager"]', bg);
    if (mgrIn)
      api('GET', '/api/emp-lookup')
        .then((x) => {
          const L = (x.list || []).filter((m) => m.empNo && (!e || m.id !== e.id));
          mgrIn.setAttribute('list', 'dl-emp-mgr');
          mgrIn.placeholder = 'ابحث بالاسم أو الرقم الوظيفي...';
          mgrIn.insertAdjacentHTML(
            'afterend',
            `<datalist id="dl-emp-mgr">${L.map((m) => `<option value="${esc(`${m.nameAr} — ${m.empNo}`)}">${esc(m.title || '')}</option>`).join('')}</datalist>`,
          );
          const cur = L.find((m) => m.empNo === mgrIn.value.trim());
          if (cur) mgrIn.value = `${cur.nameAr} — ${cur.empNo}`;
          const pick = () => {
            const m = /—\s*(\S+)\s*$/.exec(mgrIn.value);
            if (m && L.some((y) => y.empNo === m[1])) mgrIn.dataset.no = m[1];
            else delete mgrIn.dataset.no;
          };
          mgrIn.addEventListener('change', pick);
          mgrIn.addEventListener('input', pick);
          pick();
        })
        .catch(() => {});
    $('#emf', bg).onsubmit = async (ev) => {
      ev.preventDefault();
      const body = collect(
        {
          fields: secs.flatMap(([, , fs]) =>
            fs.map((f) => empInput(f, e && e.branch && !branches.includes(e.branch) ? [...branches, e.branch] : branches)),
          ),
        },
        $('#emf', bg),
      );
      if (mgrIn && mgrIn.dataset.no) body.manager = mgrIn.dataset.no;
      const miss = secs.flatMap(([, , fs]) => fs).find((f) => f.required && !String(body[f.key] || '').trim());
      if (miss) {
        $('#emErr', bg).innerHTML = `<div class="err">الحقل "${esc(miss.label)}" مطلوب</div>`;
        return;
      }
      try {
        const saved = await api(e ? 'PUT' : 'POST', e ? `/api/employees/${e.id}` : '/api/employees', body);
        bg.remove();
        toast('تم حفظ بيانات الموظف');
        done(saved);
      } catch (err) {
        $('#emErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* ملف الموظف للتحميل: كل بياناته في صفحة A4 (طباعة / حفظ PDF) أو ملف Excel */
  /* ---------- مسيرات الرواتب ---------- */
  const PR_CLS = { draft: 'pending', submitted: 'pending', approved: 'approved', paid: 'approved' };
  const prMonth = (m) => {
    const [y, mo] = String(m).split('-').map(Number);
    return `${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][mo - 1] || ''} ${y}`;
  };
  /* ---------- الدوام والحضور ---------- */
  /* ملف البصمة: صف لكل بصمة (الرقم + التاريخ والوقت) أو صف لكل يوم (الرقم + التاريخ + الدخول + الخروج) */
  const toIsoDate = (v) => {
    v = String(v || '').trim();
    if (/^\d{4,5}(\.\d+)?$/.test(v) && Number(v) > 20000) {
      const d = new Date(Math.round((Number(v) - 25569) * 86400000));
      return d.toISOString().slice(0, 10);
    }
    let m = v.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = v.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return '';
  };
  const toTime = (v) => {
    v = String(v || '').trim();
    if (/^0?\.\d+$/.test(v) || (/^\d+\.\d+$/.test(v) && Number(v) > 20000)) {
      const fr = Number(v) % 1,
        mins = Math.round(fr * 1440);
      return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    }
    const m = v.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|ص|م)?/i);
    if (!m) return '';
    let h = Number(m[1]);
    const ap = (m[3] || '').toUpperCase();
    if ((ap === 'PM' || ap === 'م') && h < 12) h += 12;
    if ((ap === 'AM' || ap === 'ص') && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m[2]}`;
  };
  /* مصطلحات البصمة: حضور متأخر / حضور مبكر / انصراف مبكر / انصراف متأخر / ساعات عمل إضافي */
  const attHM = (m) => (m >= 60 ? `${Math.floor(m / 60)} س ${m % 60 ? `${m % 60} د` : ''}`.trim() : `${m} د`);
  const attMin = (m, days) => (m ? `${days} يوم (${attHM(m)})` : '—');
  const attCell = (m, days, cls) => (m ? `<span class="att-v ${cls}">${days} يوم</span><small class="muted"> ${attHM(m)}</small>` : '—');
  const attTags = (x) =>
    [
      x.late ? `<span class="att-tag late">حضور متأخر ${attHM(x.late)}</span>` : '',
      x.earlyIn ? `<span class="att-tag early">حضور مبكر ${attHM(x.earlyIn)}</span>` : '',
      x.earlyOut ? `<span class="att-tag eout">انصراف مبكر ${attHM(x.earlyOut)}</span>` : '',
      x.earlyOutPerm ? '<span class="att-tag perm">انصراف مبكر (بإذن)</span>' : '',
      x.lateOut ? `<span class="att-tag lout">انصراف متأخر ${attHM(x.lateOut)}</span>` : '',
    ]
      .filter(Boolean)
      .join(' ');
  /* ---------- التأمينات الاجتماعية ---------- */
  /* ---------- الوظائف والدرجات ومراكز التكلفة (الإدارات والأقسام في الإعدادات ← التقسيم الإداري) ---------- */
  /* ---------- الرسم الهرمي للهيكل: الشركة ← الإدارات ← الفروع والأقسام، مع عدد الموظفين وأكثر المسميات الوظيفية ---------- */
  const ocClosed = new Set();
  S.ocZoom = 1;
  S.ocFitted = false;
  S.ocInit = false;
  /* عرضان منفصلان: هيكل الشركة (بدون الفروع) وهيكل فرع واحد يُختار */
  S.ocMode = 'co';
  S.ocBranch = '';
  /* العرض الافتراضي: مستويات تتفتح بالضغط بشكل شجري — مسار الأعلى، ثم الوحدة الحالية، ثم الوحدات التابعة لها متصلة بخطوط */
  S.ocView = 'cards';
  let ocFocus = '';
  function orgCardsHtml(d) {
    const brs = d.units.filter((u) => u.kind === 'فرع');
    const kids = (pid) =>
      pid === '__br' ? brs : d.units.filter((u) => (u.parent || '') === pid && (S.ocMode !== 'co' || u.kind !== 'فرع'));
    const byId = (id) => d.units.find((u) => u.id === id);
    const KC = { إدارة: '#9b1c1c', فرع: '#1d4f91', قسم: '#0f766e', منصب: '#6d28d9' };
    const KI = { إدارة: 'layers', فرع: 'branch', قسم: 'folderOpen', منصب: 'user' };
    const C = (u) => (d.chart || {})[u.id] || {};
    const av = (u, cls = '') => {
      const pr = C(u).person;
      return `<span class="od-av ${cls}">${pr && pr.photo ? `<img src="/api/employees/${pr.id}/photo?v=${encodeURIComponent(pr.photo)}" alt="" loading="lazy" data-rmerr>` : pr ? empAvatar({ gender: pr.gender }) : u.manager ? AV_MALE : icon(KI[u.kind] || 'layers')}</span>`;
    };
    const total = (u) => C(u).total || u.count || 0;
    if (!d.units.length)
      return `<div class="card empty">لم تنشئ التقسيم الإداري بعد — ${SF.settingsTabs(state.user).includes('orgdiv') ? '<a href="#/settings/orgdiv">أنشئه من الإعدادات ← التقسيم الإداري</a>' : 'أنشئه من الإعدادات ← التقسيم الإداري'}</div>`;
    /* نقطة البداية: هيكل الشركة يبدأ من رأس الهيكل، وهيكل الفروع من قائمة الفروع */
    /* البداية: نقطة تفرع القيادة (المدير العام ← التنفيذي ما دام لكل منهما تابع واحد) فتظهر الإدارات مباشرة */
    let rootId = S.ocMode === 'br' ? '__br' : (kids('')[0] || {}).id || '';
    for (let i = 0; S.ocMode === 'co' && i < 6; i++) {
      const k = kids(rootId);
      if (k.length === 1 && k[0].kind === 'منصب' && kids(k[0].id).length) rootId = k[0].id;
      else break;
    }
    if (S.ocMode === 'br' && ocFocus && ocFocus !== '__br' && !byId(ocFocus)) ocFocus = '';
    if (!ocFocus || (ocFocus !== '__br' && !byId(ocFocus))) ocFocus = rootId;
    if (S.ocMode === 'co' && ocFocus === '__br') ocFocus = rootId;
    const focus = ocFocus === '__br' ? { id: '__br', name: 'فروع الشركة', kind: 'فرع', manager: '' } : byId(ocFocus);
    /* مسار الأعلى */
    const path = [];
    for (let x = focus; x && x.id !== '__br' && path.length < 30; x = byId(x.parent)) path.unshift(x);
    if (S.ocMode === 'br' && focus.id !== '__br') {
      while (path.length && path[0].kind !== 'فرع') path.shift();
      path.unshift({ id: '__br', name: 'فروع الشركة', kind: 'فرع' });
    }
    const title = (u) => (u.kind === 'منصب' ? u.manager || 'شاغر' : u.name);
    const sub = (u) => (u.kind === 'منصب' ? u.name : u.manager || '');
    const node = (u, big) => {
      const k = kids(u.id),
        n = total(u),
        c = KC[u.kind] || '#64748b';
      return `<div class="od-n${big ? ' big' : ''}${k.length ? ' has' : ''}" style="--c:${c}" ${!big && k.length ? `data-ofocus="${u.id}" role="button" tabindex="0" title="فتح ${esc(u.name)}"` : ''}>
        ${av(u, big ? 'lg' : '')}<span class="od-k">${icon(KI[u.kind] || 'layers')} ${esc(u.id === '__br' ? 'الفروع' : u.kind || 'إدارة')}</span>
        <b class="od-t">${esc(title(u))}</b>${sub(u) ? `<small class="od-s">${esc(sub(u))}</small>` : ''}
        <span class="od-f">${n ? `<i title="عدد الموظفين">${icon('users')} ${n}</i>` : ''}${k.length ? `<i class="od-open" title="الوحدات التابعة">${icon('layers')} ${k.length}${big ? '' : ' ‹'}</i>` : ''}</span></div>`;
    };
    const K = kids(focus.id);
    const up = path.slice(0, -1);
    const pill = (u, lv) => {
      const k = kids(u.id),
        n = total(u),
        c = KC[u.kind] || '#64748b',
        click = lv !== 'top' && k.length;
      return `<div class="ot-p ${lv}${click ? ' go' : ''}" style="--c:${c}"${click ? ` data-ofocus="${u.id}" role="button" tabindex="0" title="فتح ${esc(u.name)} (${k.length})"` : ''}>
        ${av(u, lv === 'top' ? 'lg' : lv === 'dep' ? 'md' : 'sm')}<div class="ot-l"><b>${esc(u.id === '__br' ? 'فروع الشركة' : u.kind === 'منصب' ? u.name : u.name)}</b><small>${esc(u.manager || (u.kind === 'منصب' ? 'شاغر' : u.kind))}</small></div>${click ? `<i class="ot-more">${k.length}</i>` : ''}</div>`;
    };
    return `<div class="card od"><div class="og-top"><div class="og-seg">${[
      ['co', 'هيكل الشركة', 'layers'],
      ['br', 'هيكل الفروع', 'branch'],
    ]
      .map(([k, l, ic]) => `<button type="button" data-om="${k}" class="${S.ocMode === k ? 'on' : ''}">${icon(ic)} ${l}</button>`)
      .join('')}</div>
        <div class="og-search">${icon('search')}<input id="ogQ" type="search" placeholder="ابحث عن إدارة أو قسم أو شخص..." autocomplete="off"></div>
        <div class="og-seg sm"><button type="button" class="on" data-ov="cards">${icon('layers')} مستويات</button><button type="button" data-ov="tree">${icon('gantt')} الشجرة كاملة</button></div></div>
      <div class="od-res" id="ogRes" hidden></div>
      <nav class="od-crumb">${path.map((u, i) => (i === path.length - 1 ? `<b>${esc(u.id === '__br' ? 'فروع الشركة' : u.name)}</b>` : `<a href="javascript:void 0" data-ofocus="${u.id}">${esc(u.id === '__br' ? 'فروع الشركة' : u.name)}</a>`)).join('<span>‹</span>')}</nav>
      <div class="ot-wrap"><div class="ot">
        ${
          up.length
            ? `<div class="od-up">${up
                .slice(-2)
                .map(
                  (u) =>
                    `<a href="javascript:void 0" class="od-anc" data-ofocus="${u.id}" style="--c:${KC[u.kind] || '#64748b'}">${av(u, 'xs')}<span><b>${esc(title(u))}</b><small>${esc(sub(u) || u.kind)}</small></span></a>`,
                )
                .join('<i class="ot-vl"></i>')}<i class="ot-vl"></i></div>`
            : ''
        }
        ${pill(focus, 'top')}
        ${
          K.length
            ? `<i class="ot-vl"></i><div class="ot-row${K.length === 1 ? ' one' : ''}">${K.map((u) => {
                const g = kids(u.id);
                return `<div class="ot-col">${pill(u, 'dep')}${g.length ? `<div class="ot-subs">${g.map((x) => `<div class="ot-si">${pill(x, 'sub')}</div>`).join('')}</div>` : ''}</div>`;
              }).join('')}</div>`
            : '<div class="od-leaf">لا توجد وحدات تابعة</div>'
        }
      </div></div></div>`;
  }
  /* الهيكل كاملاً بالتصميم الكبسولي: القيادة ← صف الإدارات على خط أفقي ← كل ما تحت الإدارة على خطوط رأسية متداخلة */
  S.otInit = false;
  S.otQuery = '';
  S.otScroll = null;
  /* وضع التعديل: نسخة من الوحدات تُعدَّل ثم تُحفظ مرة واحدة، وقائمة الموظفين لاختيار الشخص */
  S.otEdit = null;
  function orgFullHtml(d0) {
    const d = S.otEdit ? { ...d0, units: S.otEdit.units } : d0;
    const brs = d.units.filter((u) => u.kind === 'فرع');
    const kids = (pid) =>
      pid === '__br' ? brs : d.units.filter((u) => (u.parent || '') === pid && (S.ocMode !== 'co' || u.kind !== 'فرع'));
    const KC = { إدارة: '#9b1c1c', فرع: '#1d4f91', قسم: '#0f766e', منصب: '#6d28d9' };
    const KI = { إدارة: 'layers', فرع: 'branch', قسم: 'folderOpen', منصب: 'user' };
    const C = (u) => (d.chart || {})[u.id] || {};
    const av = (u, cls = '') => {
      const pr = C(u).person;
      return `<span class="od-av ${cls}">${pr && pr.photo ? `<img src="/api/employees/${pr.id}/photo?v=${encodeURIComponent(pr.photo)}" alt="" loading="lazy" data-rmerr>` : pr ? empAvatar({ gender: pr.gender }) : u.manager ? AV_MALE : icon(KI[u.kind] || 'layers')}</span>`;
    };
    if (!d.units.length)
      return `<div class="card empty">لم تنشئ التقسيم الإداري بعد — ${SF.settingsTabs(state.user).includes('orgdiv') ? '<a href="#/settings/orgdiv">أنشئه من الإعدادات ← التقسيم الإداري</a>' : 'أنشئه من الإعدادات ← التقسيم الإداري'}</div>`;
    const pill = (u, lv) => {
      const k = lv === 'top' ? [] : kids(u.id),
        cl = ocClosed.has(u.id);
      return `<div class="ot-p ${lv}" style="--c:${KC[u.kind] || '#64748b'}" data-oq="${esc(normAr(`${u.name} ${u.manager || ''}`))}">${av(u, lv === 'top' ? 'lg' : lv === 'dep' ? 'md' : 'sm')}<div class="ot-l"><b>${esc(u.id === '__br' ? 'فروع الشركة' : u.name)}</b><small>${esc(u.manager || (u.kind === 'منصب' ? 'شاغر' : u.kind))}</small></div>${k.length ? `<button type="button" class="ot-tg${cl ? ' cl' : ''}" data-tg="${u.id}" title="${cl ? `فتح (${k.length})` : 'طي'}">${cl ? `+${k.length}` : '−'}</button>` : ''}${S.otEdit && u.id !== '__br' ? `<span class="ot-ed"><button type="button" data-ued="${u.id}" title="تعديل">${icon('pencil')}</button><button type="button" data-uadd="${u.id}" title="إضافة تابع">${icon('plus')}</button><button type="button" data-udel="${u.id}" title="حذف">${icon('trash')}</button></span>` : ''}</div>`;
    };
    /* كل ما تحت الوحدة: قائمة رأسية، ومن له تابعون تتفرع منه قائمة داخلية */
    const subs = (u, depth) => {
      const k = kids(u.id);
      if (!k.length || depth > 12 || ocClosed.has(u.id)) return '';
      /* كلها أقسام أخيرة: تحت بعضها على خط جانبي */
      if (k.every((x) => !kids(x.id).length))
        return `<div class="ot-subs">${k.map((x) => `<div class="ot-si">${pill(x, 'sub')}</div>`).join('')}</div>`;
      /* فيها تفرعات: صف أفقي تحت الوحدة */
      return `<i class="ot-vl"></i><div class="ot-row${k.length === 1 ? ' one' : ''}">${k.map((x) => `<div class="ot-col">${pill(x, kids(x.id).length ? 'mid' : 'sub')}${subs(x, depth + 1)}</div>`).join('')}</div>`;
    };
    /* القيادة: من رأس الهيكل نزولاً ما دام للمنصب تابع واحد */
    let lead = [],
      fan;
    if (S.ocMode === 'br') {
      if (S.ocBranch && !brs.some((b) => b.id === S.ocBranch)) S.ocBranch = '';
      fan = S.ocBranch ? brs.filter((b) => b.id === S.ocBranch) : brs;
    } else {
      let lvl = kids('');
      while (lvl.length === 1 && lead.length < 6) {
        lead.push(lvl[0]);
        lvl = kids(lvl[0].id);
      }
      fan = lvl;
    }
    if (!S.otInit) {
      S.otInit = true;
      const fanIds = new Set(fan.map((u) => u.id));
      d.units.forEach((u) => {
        if (fanIds.has(u.id) || (d.units.some((x) => x.parent === u.id) && !lead.includes(u))) ocClosed.add(u.id);
      });
    }
    const leaders = lead.map((u, i) => `${i ? '<i class="ot-vl"></i>' : ''}${pill(u, 'top')}`).join('');
    return `<div class="card od"><div class="og-top"><div class="og-seg">${[
      ['co', 'هيكل الشركة', 'layers'],
      ['br', 'هيكل الفروع', 'branch'],
    ]
      .map(([k, l, ic]) => `<button type="button" data-om="${k}" class="${S.ocMode === k ? 'on' : ''}">${icon(ic)} ${l}</button>`)
      .join('')}</div>
        ${S.ocMode === 'br' ? `<select class="in og-br" id="otBr"><option value="">كل الفروع</option>${brs.map((b) => `<option value="${b.id}"${b.id === S.ocBranch ? ' selected' : ''}>فرع ${esc(b.name)}</option>`).join('')}</select>` : ''}
        <div class="og-search">${icon('search')}<input id="ogQ" type="search" placeholder="ابحث عن إدارة أو قسم أو شخص..." autocomplete="off"><span id="ogN" class="muted"></span></div>
        <div class="og-seg sm ot-zoom"><button type="button" data-oz="-" title="تصغير">−</button><b id="otZ">${Math.round(S.ocZoom * 100)}%</b><button type="button" data-oz="+" title="تكبير">+</button><button type="button" data-oz="fit">${icon('grid')} ملاءمة الشاشة</button></div>
        <div class="og-seg sm"><button type="button" data-oall="open">فتح الكل</button><button type="button" data-oall="close">طي الكل</button></div></div>
      ${
        S.otEdit
          ? `<div class="ot-ebar"><span>${icon('pencil')} <b>وضع تعديل الهيكل</b> — استخدم ✎ للتعديل و＋ لإضافة تابع و🗑 للحذف${S.otEdit.dirty ? ' · <i class="ot-dirty">تغييرات غير محفوظة</i>' : ''}</span>
        <span class="row" style="gap:6px"><button type="button" class="btn sm" data-uadd="">${icon('plus')} إضافة في أعلى الهيكل</button><button type="button" class="btn sm ghost" id="otCancel">إلغاء</button><button type="button" class="btn sm primary" id="otSave">💾 حفظ الهيكل</button></span></div>`
          : ''
      }
      <div class="ot-wrap${S.otEdit ? ' editing' : ''}" id="otWrap"><div class="ot" id="otTree" style="zoom:${S.ocZoom}">
        ${S.ocMode === 'br' ? (S.ocBranch ? '' : pill({ id: '__br', name: 'فروع الشركة', kind: 'فرع', manager: `${brs.length} فرع` }, 'top')) : leaders}
        ${fan.length ? `${S.ocMode === 'br' && S.ocBranch ? '' : '<i class="ot-vl"></i>'}<div class="ot-row${fan.length === 1 ? ' one' : ''}">${fan.map((u) => `<div class="ot-col">${pill(u, 'dep')}${subs(u, 0)}</div>`).join('')}</div>` : ''}
      </div></div></div>`;
  }
  /* bare: الرسم وحده (لصفحة تنزيل PDF) بدون أدوات العرض */
  function orgChartHtml(d, bare) {
    if (!bare) return orgFullHtml(d);
    const kids = (pid) => d.units.filter((u) => (u.parent || '') === pid);
    const KIND = { إدارة: 'dep', فرع: 'br', قسم: 'sec', منصب: 'pos' };
    /* أول فتح: يظهر رأس الهيكل حتى مستوى الإدارات (ومن المستوى الرابع وما بعده مطويّ)، والفروع مطويّة — وكل وحدة تُفتح بضغطة */
    const depth = (u) => {
      let n = 0,
        x = u;
      while (x && x.parent && n < 50) {
        x = d.units.find((y) => y.id === x.parent);
        n++;
      }
      return n;
    };
    if (!S.ocInit) {
      S.ocInit = true;
      d.units.filter((u) => kids(u.id).length && (u.kind === 'فرع' || depth(u) >= 3)).forEach((u) => ocClosed.add(u.id));
    }
    /* في هيكل الشركة لا تظهر الفروع (لها عرض مستقل) */
    const ch = (u) => kids(u.id).filter((x) => S.ocMode !== 'co' || x.kind !== 'فرع');
    /* الترتيب معكوس لأن الرسم يُبنى من اليسار، فتظهر أول وحدة على اليمين */
    const node = (u) => {
      const k = ch(u),
        closed = ocClosed.has(u.id);
      /* الوحدات الكثيرة بلا تفرعات ظاهرة (أو مطويّة) عمود واحد تحت أصلها */
      const leafs = k.length > 4 && k.every((x) => !ch(x).length || (x.kind === 'فرع' && ocClosed.has(x.id)));
      /* المربع: صورة دائرية (صورة الموظف إن عُرف وله صورة، وإلا صورة رمزية) ثم الاسم ثم المنصب / الوحدة */
      const pr = ((d.chart || {})[u.id] || {}).person;
      const av =
        pr && pr.photo
          ? `<img src="/api/employees/${pr.id}/photo?v=${encodeURIComponent(pr.photo)}" alt="" loading="lazy" data-rmerr>`
          : pr
            ? empAvatar({ gender: pr.gender })
            : u.manager
              ? AV_MALE
              : icon(u.kind === 'منصب' ? 'user' : u.kind === 'فرع' ? 'branch' : u.kind === 'قسم' ? 'folderOpen' : 'layers');
      const face = `<span class="oc-av${!pr && !u.manager ? ' unit' : ''}">${av}</span>`;
      /* المنصب: الصورة ثم اسم الشخص ثم المسمى */
      if (u.kind === 'منصب')
        return `<li><div class="oc-n k-pos">${face}${u.manager ? `<b class="oc-name">${esc(u.manager)}</b>` : ''}<span class="oc-p">${esc(u.name)}</span>
        ${k.length ? `<button type="button" class="oc-tg" data-tg="${u.id}" title="${closed ? 'فتح' : 'طي'}">${closed ? `+ ${k.length}` : '−'}</button>` : ''}</div>
        ${k.length && !closed ? `<ul${leafs ? ' class="oc-v"' : ''}>${(leafs ? k : k.slice().reverse()).map(node).join('')}</ul>` : ''}</li>`;
      return `<li><div class="oc-n k-${KIND[u.kind] || 'dep'}">${face}<span class="oc-k">${esc(u.kind || 'إدارة')}</span><b class="oc-name">${esc(u.name)}</b>
        ${u.manager ? `<small class="oc-m">${esc(u.manager)}</small>` : ''}
        ${k.length ? `<button type="button" class="oc-tg" data-tg="${u.id}" title="${closed ? 'فتح' : 'طي'}">${closed ? `+ ${k.length}` : '−'}</button>` : ''}</div>
        ${k.length && !closed ? `<ul${leafs ? ' class="oc-v"' : ''}>${(leafs ? k : k.slice().reverse()).map(node).join('')}</ul>` : ''}</li>`;
    };
    const brs = d.units.filter((u) => u.kind === 'فرع');
    /* هيكل الفروع: كل الفروع تحت بعضها (كل فرع في قسم بعنوانه)، أو فرع واحد يُختار */
    if (S.ocMode === 'br' && S.ocBranch && !brs.some((b) => b.id === S.ocBranch)) S.ocBranch = '';
    const roots = S.ocMode === 'br' ? brs.filter((b) => !S.ocBranch || b.id === S.ocBranch) : kids('');
    const tree =
      S.ocMode === 'br'
        ? roots
            .map((b) => `<div class="oc-blk"><h3 class="oc-bt">${icon('branch')} هيكل فرع ${esc(b.name)}</h3><ul>${node(b)}</ul></div>`)
            .join('')
        : `<ul>${roots.slice().reverse().map(node).join('')}</ul>`;
    if (!d.units.length)
      return `<div class="card empty">لم تنشئ التقسيم الإداري بعد — ${SF.settingsTabs(state.user).includes('orgdiv') ? '<a href="#/settings/orgdiv">أنشئه من الإعدادات ← التقسيم الإداري</a>' : 'أنشئه من الإعدادات ← التقسيم الإداري'}</div>`;
    if (bare) return tree;
    return `<div class="card oc-card"><div class="oc-mode"><button type="button" data-om="co" class="${S.ocMode === 'co' ? 'on' : ''}">${icon('layers')} هيكل الشركة</button><button type="button" data-om="br" class="${S.ocMode === 'br' ? 'on' : ''}">${icon('branch')} هيكل الفروع</button>${S.ocMode === 'br' ? (brs.length ? `<select class="in" id="ocBr"><option value="">كل الفروع (تحت بعض)</option>${brs.map((b) => `<option value="${b.id}"${b.id === S.ocBranch ? ' selected' : ''}>فرع ${esc(b.name)}</option>`).join('')}</select>` : '<span class="muted">لا توجد فروع في التقسيم الإداري</span>') : ''}</div>
      <div class="oc-bar">
        <span class="row" style="gap:6px"><button class="btn sm" data-ov="cards">${icon('grid')} عرض البطاقات</button><button class="btn sm" data-oz="-">−</button><b class="oc-zv">${Math.round(S.ocZoom * 100)}%</b><button class="btn sm" data-oz="+">+</button><button class="btn sm" data-oz="fit">ملاءمة الشاشة</button>
          <button class="btn sm ghost" data-oall="close">طي الكل</button><button class="btn sm ghost" data-oall="open">فتح الكل</button><button class="btn sm ghost" id="ocPrint">🖨️ طباعة</button><button class="btn sm primary" id="ocPdf">⬇ تنزيل PDF</button></span>
        <span class="oc-leg"><i class="k-dep"></i>إدارة<i class="k-br"></i>فرع<i class="k-sec"></i>قسم<i class="k-pos"></i>منصب</span></div>
      <div class="oc-wrap" id="ocWrap"><div class="oc" id="oc" style="zoom:${S.ocZoom}">${tree}</div></div></div>`;
  }
  /* التطبيقات: كل صفحات القائمة الجانبية أيقونات عصرية بألوان شعار سادن، مقسمة بأقسام القائمة (أول صفحة بعد الدخول) */
  const APP_TONES = [
    ['#ef4444', '#991b1b', '#1f2937'],
    ['#475569', '#111827', '#ef4444'],
    ['#fb7185', '#be123c', '#334155'],
    ['#cbd5e1', '#64748b', '#b91c1c'],
    ['#be123c', '#4c0519', '#cbd5e1'],
    ['#dc2626', '#7f1d1d', '#fca5a5'],
    ['#334155', '#0f172a', '#fb7185'],
    ['#f87171', '#b91c1c', '#94a3b8'],
  ];
  /* الشكل الحديث للأيقونات: لكل تطبيق لون ثابت حسب هويته (لا حسب مكانه في الشبكة)، فلا يتكرر لون عمود كامل،
   * ويبقى لون الصفحة واحداً في صفحة التطبيقات ورأس الصفحة مهما تغيّر الترتيب أو عرض الشاشة */
  const APP_HUES = {
    '#/dashboard': '#7c3aed',
    '#/': '#2563eb',
    comm: '#0ea5e9',
    hr: '#db2777',
    payroll: '#059669',
    '#/finance': '#d97706',
    '#/supervision': '#0891b2',
    ops: '#4f46e5',
    '#/marketing': '#e11d48',
    '#/tenders': '#0369a1',
    '#/projects': '#c026d3',
    '#/procurement': '#65a30d',
    '#/crm': '#ea580c',
    quality: '#0d9488',
    legal: '#475569',
    '#/tasks': '#16a34a',
    '#/calendar': '#dc2626',
    '#/contacts': '#0284c7',
    requests: '#f59e0b',
    me: '#14b8a6',
    '#/docs': '#ca8a04',
    '#/reports': '#9333ea',
    '#/todo': '#10b981',
    '#/notes': '#eab308',
    '#/trash': '#f43f5e',
    '#/settings': '#64748b',
    '#/access-requests': '#b45309',
    '#/about': '#1d4ed8',
    '#/decision-center': '#be123c',
    '#/account': '#be185d',
    '#/fuel': '#ea580c',
    '#/facilities': '#0f766e',
    '#/branch-map': '#16a34a',
    '#/stock': '#d97706',
    '#/analysis': '#0e7490',
    '#/hse': '#16a34a',
    '#/governance': '#1e3a8a',
    '#/knowledge': '#0d9488',
    '#/training': '#7c3aed',
    '#/guide': '#9b1c1c',
    '#/mobile-app': '#0ea5e9',
  };
  const HUE_POOL = [
    '#2563eb',
    '#7c3aed',
    '#059669',
    '#d97706',
    '#0891b2',
    '#db2777',
    '#4f46e5',
    '#0d9488',
    '#e11d48',
    '#9333ea',
    '#ea580c',
    '#16a34a',
    '#0284c7',
    '#ca8a04',
  ];
  const appHue = (k) =>
    APP_HUES[k] || HUE_POOL[[...String(k || '')].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % HUE_POOL.length];
  /* شكل الأيقونات: حديث (افتراضي) أو الأصلي — لكل مستخدم على جهازه */
  const apStyleKey = () => `apps-style:${(state.user || {}).id || ''}`;
  const apStyle = () => {
    try {
      return localStorage.getItem(apStyleKey()) === 'classic' ? 'classic' : 'modern';
    } catch {
      return 'modern';
    }
  };
  const apStyleApply = () => document.documentElement.classList.toggle('ap-modern', apStyle() === 'modern');
  /* الهوية الموحدة: لون وأيقونة كل صفحة كما في صفحة التطبيقات (نفس ترتيب الألوان: المستوى الأعلى بترتيبه، وداخل القسم بترتيبها فيه) */
  function appToneOf(hash) {
    const out = [];
    const walk = (list, parentTone) =>
      list.forEach((it, n) => {
        const tone = APP_TONES[n % APP_TONES.length];
        if (Array.isArray(it)) out.push([it[0], it[1], tone]);
        else walk(it.items || [], tone);
      });
    try {
      walk(navItems());
    } catch {
      return null;
    }
    const [path] = hash.split('?');
    return (
      out.find(([h]) => h === hash) ||
      out.find(([h]) => h.split('?')[0] === path && !h.includes('?')) ||
      out.find(([h]) => h.split('?')[0] === path) ||
      null
    );
  }
  function decoratePageHead(root) {
    const ph = (root || document).querySelector('#main .page-head:not(.ph-dec)');
    if (!ph) return;
    ph.classList.add('ph-dec');
    const t = appToneOf(location.hash || '#/');
    if (!t) return;
    const [x, y, z] = t[2];
    document.documentElement.style.setProperty('--pg', appHue(t[0]));
    ph.insertAdjacentHTML(
      'afterbegin',
      `<span class="ap-g ph-ic" style="--a:${x};--b:${y};--c:${z};--m:${appHue(t[0])}" aria-hidden="true"><i class="ap-x"></i><i class="ap-y"></i>${t[1]}</span>`,
    );
  }
  new MutationObserver(() => decoratePageHead()).observe(document.getElementById('app') || document.body, {
    childList: true,
    subtree: true,
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK') && state.user) {
      e.preventDefault();
      const q = $('#gcQ');
      if (q) {
        q.focus();
        q.select();
      } else location.hash = '#/apps';
    }
  });
  Object.assign(S, {
    empPhoto,
    empDocs,
    empAlert,
    docLeft,
    empCols,
    empChips,
    empMoney,
    natFlag,
    empCard,
    empEmpty,
    PR_CLS,
    prMonth,
    toIsoDate,
    toTime,
    attMin,
    attCell,
    attTags,
    ocClosed,
    APP_TONES,
    appHue,
    apStyleKey,
    apStyle,
    apStyleApply,
  });
})((window.SES_APP = window.SES_APP || {}));
