'use strict';
/* أجزاء صفحة الإعدادات (2) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['settings-2'] = function (S, ctx) {
  const {
    $,
    $$,
    DOC_DEF,
    OCC,
    SF,
    SUB_COLORS,
    api,
    askYesNo,
    dt,
    esc,
    icon,
    isAdmin,
    navTree,
    navTreeWire,
    route,
    shell,
    signatureBox,
    state,
    toast,
  } = S;
  const { settingsGeneralPart, viewSettings } = ctx;
  /* جزء من settingsGeneral: (s.theme || {}).brand || '#9b1c1c'… */
  function settingsGeneralValue3(s) {
    return (s.theme || {}).brand || '#9b1c1c';
  }
  /* جزء من settingsGeneral: (s.docTypes || {}).branch && s.docTypes.branch.length ? s.do… */
  function settingsGeneralValue2(s) {
    return (s.docTypes || {}).branch && s.docTypes.branch.length ? s.docTypes.branch : DOC_DEF.branch;
  }
  /* جزء من settingsGeneral: (s.docTypes || {}).company && s.docTypes.company.length ? s.… */
  function settingsGeneralValue(s) {
    return (s.docTypes || {}).company && s.docTypes.company.length ? s.docTypes.company : DOC_DEF.company;
  }
  /* جزء من settingsGeneral: const CO_THEMES = [['brand', 'ألوان الهوية'], ...O… */
  function settingsGeneralPart2(body, s, saveSettings) {
    const CO_THEMES = [['brand', 'ألوان الهوية'], ...Object.entries(OCC).map(([k, o]) => [k, `ألوان ${o.name}`])];
    const CO_DECOS = [
      ['none', 'بدون زينة'],
      ['national', 'قصاصات وألعاب نارية'],
      ['fitr', 'فوانيس وألعاب نارية'],
      ['ramadan', 'هلال وفوانيس'],
      ['hijri', 'هلال ونجوم'],
      ['founding', 'نقش السدو'],
      ['flag', 'قصاصات ملونة'],
      ['adha', 'فوانيس وألعاب نارية (فيروزي)'],
    ];
    return settingsGeneralPart(CO_DECOS, CO_THEMES, body, s, saveSettings);
  }
  /* جزء من draw: const list = users.filter(match);… */
  function drawPart(body, group, match, section, users, view) {
    const list = users.filter(match);
    let html = '';
    if (view === 'org') {
      /* حسب "التصنيف" في نافذة المستخدم */
      const br = list.filter((u) => u.unit !== 'إدارة / قسم'),
        dp = list.filter((u) => u.unit === 'إدارة / قسم');
      const names = (xs) =>
        [...new Set([...(state.config.branches || []), ...xs.map((u) => u.branch).filter(Boolean)])].filter((n) =>
          xs.some((u) => u.branch === n),
        );
      /* الإدارات والأقسام أولاً ثم الفروع */
      const dk = (u) => u.dept || u.branch || '';
      const dnames = [...new Set(dp.map(dk).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'ar'));
      /* كل إدارة: أفرادها ثم تفريعاتها (مثل الإدارة ← شئون الموظفين، الشئون القانونية) */
      const block = (n) => {
        const xs = dp.filter((u) => dk(u) === n),
          own = xs.filter((u) => !u.sub),
          subs = [...new Set(xs.map((u) => u.sub).filter(Boolean))];
        return (
          (own.length
            ? group(esc(n), own).replace('<small class="muted">(' + own.length + ')</small>', `<small class="muted">(${xs.length})</small>`)
            : `<tbody><tr class="cat-row"><td colspan="8">${esc(n)} <small class="muted">(${xs.length})</small></td></tr></tbody>`) +
          /* كل تفريع بلون مختلف */
          subs
            .map((s, i) =>
              group(
                `<span class="sub-ind">↳</span> ${esc(s)}`,
                xs.filter((u) => u.sub === s),
                'sub',
              ).replace('<tbody>', `<tbody class="subg" style="--sc:${SUB_COLORS[i % SUB_COLORS.length]}">`),
            )
            .join('')
        );
      };
      if (dp.length)
        html +=
          section(`${icon('layers')} الإدارات والأقسام`, dp.length) +
          group(
            'الإدارة العليا والإدارات المركزية',
            dp.filter((u) => !dk(u) && !u.sub),
            'top',
          ) +
          dnames.map(block).join('');
      if (br.length)
        html +=
          section(`${icon('branch')} الفروع`, br.length) +
          names(br)
            .map((n) =>
              group(
                `فرع ${esc(n)}`,
                br.filter((u) => u.branch === n),
              ),
            )
            .join('') +
          group(
            'بدون فرع',
            br.filter((u) => !u.branch),
          );
    } else {
      html += [...(state.config.roles || []).map((r) => [r.id, r.name]), ['', 'بدون مسمى']]
        .map(([c, cl]) =>
          group(
            esc(cl),
            list.filter((u) => (c ? u.roleId === c : !(state.config.roles || []).some((r) => r.id === u.roleId))),
          ),
        )
        .join('');
    }
    $('#uTbl', body).innerHTML =
      `<thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>المسمى</th><th>المسمى في الخطاب</th><th>الفرع / الإدارة</th><th>في المسارات</th><th>الحالة</th><th></th></tr></thead>${html || '<tbody><tr><td colspan="8" class="muted" style="text-align:center;padding:20px">لا يوجد مستخدمون مطابقون</td></tr></tbody>'}`;
  }

  /* صفحة المستخدم: كل إعداداته في مكان واحد */
  async function viewUserPage(id) {
    if (!SF.settingsTabs(state.user).includes('users')) {
      location.hash = '#/settings';
      return;
    }
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/settings');
    const users = await api('GET', '/api/admin/users');
    const u = id === 'new' ? null : users.find((x) => x.id === id);
    if (id !== 'new' && !u) {
      main.innerHTML = '<div class="empty">المستخدم غير موجود</div>';
      return;
    }
    const info = u ? await api('GET', `/api/admin/users/${u.id}/roles`).catch(() => null) : null;
    main.innerHTML = `<div class="up-head"><a class="btn sm ghost" href="#/settings/users">→ المستخدمون</a>
        <div><h2 style="margin:0">${u ? esc(u.name) : 'مستخدم جديد'}</h2>${u ? `<div class="muted"><bdi dir="ltr">${esc(u.username)}</bdi> — ${esc(u.roleLabel)}${u.branch ? ` — ${esc(u.branch)}` : ''} ${u.active ? '<span class="chip approved">نشط</span>' : '<span class="chip cancelled">موقوف</span>'}</div>` : ''}</div></div>
      <div class="up-grid"><div id="upForm"></div><div id="upSide">${
        info
          ? `
        <div class="card"><h3>${icon('layers')} أدواره في الدورات</h3>${info.roles.length ? `<ul class="up-list">${info.roles.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : '<div class="muted">لا يوجد — لا يعتمد في أي دورة</div>'}
          <div class="hint">تحددها من الإعدادات ← <a href="#/settings/routes">مسارات الاعتماد</a> (كروت الدورات وفرق إدارة العمليات).</div></div>
        <div class="card"><h3>${icon('forward')} في مسارات النماذج</h3>${info.routes.length ? `<ul class="up-list">${info.routes.map((r) => `<li><b>${esc(r.form)}</b> — ${esc(r.step)}</li>`).join('')}</ul>` : '<div class="muted">غير موجود في أي مسار</div>'}</div>
        <div class="card"><h3>${icon('inbox')} طلباته</h3><div class="up-stats"><div><b>${info.pending}</b><small>بانتظار اعتماده الآن</small></div><div><b>${info.created}</b><small>رفعها</small></div></div></div>`
          : ''
      }</div></div>`;
    await userModal(u, $('#upForm', main));
  }

  async function userModal(u, host) {
    const tools = isAdmin() ? await api('GET', '/api/admin/tools') : [];
    /* الفروع الفعلية: فروع المحاسبين + قائمة الفروع في الإعدادات (اسم الفرع يجب أن يطابق فرع المحاسب حرفياً) */
    const allUsers = await api('GET', '/api/admin/users').catch(() => []);
    const branchList = [
      ...new Set(
        [...(state.config.branches || []), ...allUsers.filter((x) => x.role === 'accountant').map((x) => x.branch)].filter(Boolean),
      ),
    ].sort();
    const pageList = [...SF.PAGES, ...tools.map((t) => [`tool:${t.file}`, `النماذج والأدوات ← ${t.title}`])];
    const bg = host || document.createElement('div');
    if (!host) bg.className = 'modal-bg';
    bg.innerHTML = `<form class="${host ? 'up-form' : 'modal'}" novalidate>${userModalValue6(host, u)}
      <datalist id="dl-ub">${branchList.map((b) => `<option value="${esc(b)}">`).join('')}</datalist>
      <div class="grid2">
        <div class="field"><label>الاسم الكامل<span class="req">*</span></label><input class="in" name="name" value="${esc(u ? u.name : '')}"></div>
        <div class="field"><label>اسم المستخدم (إنجليزي)<span class="req">*</span></label><input class="in" name="username" dir="ltr" value="${esc(u ? u.username : '')}" ${u ? 'disabled' : ''}></div>
        <div class="field"><label>الفئة<span class="req">*</span></label><select class="in" name="role">${(state.config.roles || [])
          .filter(
            (x) =>
              (isAdmin() || x.base !== 'admin') &&
              (SF.CATEGORIES.some((c) => c.id === x.id) || x.id === 'r_employee' || (u && u.roleId === x.id)),
          )
          .map((x) => `<option value="${x.id}"${u && u.roleId === x.id ? ' selected' : ''}>${esc(x.name)}</option>`)
          .join('')}</select><div class="hint">صلاحيات كل فئة من كارتها في «المستخدمون»</div></div>
        <div class="field"><label>التصنيف<span class="req">*</span></label><select class="in" name="unit" required><option value="">— اختر —</option>${['فرع', 'إدارة / قسم'].map((x) => `<option${(u ? u.unit : '') === x ? ' selected' : ''}>${x}</option>`).join('')}</select><div class="hint">مكانه في قائمة المستخدمين: تحت الفروع أو تحت الإدارات والأقسام (لا يغيّر الصلاحيات)</div></div>
        <div class="field" id="deptBox"><label>الإدارة / القسم في القائمة</label><input class="in" name="dept" list="dl-ub" value="${esc(userModalValue7(u))}" placeholder="افتراضياً: الفرع"><div class="hint">اسم الإدارة التي يظهر تحتها في "الإدارات والأقسام" — للتنظيم فقط</div></div>
        <div class="field" id="subBox"><label>تفريع تحته (اختياري)</label><input class="in" name="sub" value="${esc(userModalValue8(u))}" placeholder="مثال: شئون الموظفين"><div class="hint">قسم فرعي داخل الإدارة (مثل الإدارة ← شئون الموظفين، الشئون القانونية)</div></div>
        <div class="field"><label>الفرع</label><input class="in" name="branch" list="dl-ub" value="${esc(u ? u.branch : '')}">
          <label class="check" style="margin-top:6px"><input type="checkbox" name="opsOnly"${u && u.opsOnly ? ' checked' : ''}> يرى إدارة العمليات فقط <small class="muted">(قسم إدارة العمليات وطلباته والطلبات الجارية عليه، بدون باقي النظام)</small></label>
          <label class="check" style="margin-top:6px"><input type="checkbox" name="branchManager"${u && u.branchManager ? ' checked' : ''}> مدير هذا الفرع <small class="muted">(يعتمد خطوة "مدير الفرع" لطلبات فرعه)</small></label>
          <div class="hint">لمدير الفرع: اكتب اسم الفرع فقط كما هو في حساب المحاسب${branchList.length ? ` (${branchList.map(esc).join('، ')})` : ''}</div></div>
        ${userModalValue(u)}
        ${userModalValue3(u)}
        <div class="field"><label>الخدمة الذاتية (البصمة والراتب)</label><div class="hint">هذا الحساب منصب، فلا تسلّم كلمة مروره لأحد: اختر «شاغل المنصب» في الأعلى، فيدخل الموظف برقم هويته ويعمل بصفته. للموظف حساب شخصي منفصل برقم هويته تديره من ملفه في سجل الموظفين (العمل والفريق ← حساب الدخول).</div></div>
        <div class="field"><label>البريد الإلكتروني (للإشعارات)</label><input class="in" name="email" type="email" dir="ltr" value="${esc(u ? u.email || '' : '')}"></div>
        <div class="field"><label>المسمى الوظيفي في الخطاب</label><input class="in" name="title" value="${esc(u ? u.title : '')}" placeholder="مثال: المدير المالي"></div>
        <div class="field"><label>اللقب</label><select class="in" name="prefix">${['الأستاذ', 'المهندس', 'الدكتور', 'المحاسب'].map((o) => `<option${u && u.prefix === o ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
        <div class="field"><label>${u ? 'كلمة مرور جديدة (اتركها فارغة لعدم التغيير)' : 'كلمة المرور المؤقتة'}${u ? '' : '<span class="req">*</span>'}</label><input class="in" name="password" type="text" dir="ltr" autocomplete="off"></div>
        ${userModalValue4(u)}
        ${u ? '<div class="field full" id="sigBox"></div>' : ''}
        <div class="field full" id="vaBox"><label class="check"><input type="checkbox" name="viewAll"${!u || u.viewAll ? ' checked' : ''}> يرى جميع الطلبات (وإلا يرى فقط الطلبات المارة عليه)</label>
          </div>
      </div>
      ${host ? '</div>' : ''}
      ${userModalValue2(host, pageList, u)}
      <div class="merr"></div>
      <div class="row" style="margin-top:16px"><button class="btn primary">حفظ</button><button type="button" class="btn ghost" data-close>إلغاء</button>${userModalValue5(u)}</div></form>`;
    return userModalPart2(bg, host, u);
  }
  /* جزء من userModal: u ? u.sub || '' : ''… */
  function userModalValue8(u) {
    return u ? u.sub || '' : '';
  }
  /* جزء من userModal: u ? u.dept || '' : ''… */
  function userModalValue7(u) {
    return u ? u.dept || '' : '';
  }
  /* جزء من userModal: host ? '<div class="card"><h3>البيانات الأساسية والتصنيف</h3… */
  function userModalValue6(host, u) {
    return host ? '<div class="card"><h3>البيانات الأساسية والتصنيف</h3>' : `<h3>${u ? 'تعديل مستخدم' : 'مستخدم جديد'}</h3>`;
  }
  /* جزء من userModal: u && u.id !== state.user.id && isAdmin() ? '<button type="bu… */
  function userModalValue5(u) {
    return u && u.id !== state.user.id && isAdmin()
      ? '<button type="button" class="btn bad" data-deluser style="margin-inline-start:auto">🗑️ حذف المستخدم</button>'
      : '';
  }
  /* جزء من userModal: u ? `<div class="field"><label>الحالة</label><select class="… */
  function userModalValue4(u) {
    return u
      ? `<div class="field"><label>الحالة</label><select class="in" name="active"><option value="1"${u.active ? ' selected' : ''}>نشط</option><option value="0"${!u.active ? ' selected' : ''}>موقوف</option></select></div>`
      : '';
  }
  /* جزء من userModal: u ? `<div class="field"><label>الجوال المربوط (تطبيق SES)</l… */
  function userModalValue3(u) {
    return u
      ? `<div class="field"><label>الجوال المربوط (تطبيق SES)</label>${u.mobileDevice ? `<div class="row" style="gap:8px;align-items:center"><span>📱 ${esc(u.mobileDevice.model || 'جوال')} — منذ ${esc(dt(u.mobileDevice.at))}</span><button type="button" class="btn sm bad" id="uMobUnbind">إلغاء الربط</button></div><div class="hint">عند تغيير الموظف لجواله: ألغِ الربط، فيُربط أول جوال يدخل منه بعدها (ويُلغى ربط البصمة أيضاً).</div>` : '<div class="muted">لا يوجد جوال مربوط</div>'}</div>`
      : '';
  }
  /* «ما يظهر لهذا المستخدم» شاشة كاملة: نفس العلامات (لا نسخة منها)، و«حفظ» يحفظ صفحة المستخدم كلها */
  function wirePermFull(bg, form) {
    const box = $('.perm-box', bg);
    const full = (on) => {
      box.classList.toggle('perm-full', on);
      document.body.classList.toggle('perm-full-on', on);
      if (on) {
        box.open = true;
        box.scrollTop = 0;
      }
    };
    $('[data-permfull]', box).onclick = () => full(true);
    $('[data-permdone]', box).onclick = () => full(false);
    $('[data-permsave]', box).onclick = () => {
      full(false);
      form.requestSubmit();
    };
    document.addEventListener('keydown', function esc(e) {
      if (!document.body.contains(box)) return document.removeEventListener('keydown', esc);
      if (e.key === 'Escape' && box.classList.contains('perm-full')) full(false);
    });
  }
  /* جزء من userModal: isAdmin()… */
  function userModalValue2(host, pageList, u) {
    return isAdmin()
      ? `<details class="perm-box${host ? ' card' : ''}"${host || (u && (Object.keys(u.pages || {}).length || Array.isArray(u.allowedForms))) ? ' open' : ''}>
        <summary>ما يظهر لهذا المستخدم</summary>
        <div class="perm-fullbar"><b class="pf-title">تخصيص ما يظهر لـ ${esc(u ? u.name : 'هذا المستخدم')}</b><span class="pf-acts"><button type="button" class="btn" data-permfull>${icon('grid')} عرض الأيقونات وتخصيصها (شاشة كاملة)</button><button type="button" class="btn ghost" data-permdone>→ رجوع</button><button type="button" class="btn primary" data-permsave>💾 حفظ</button></span></div>
        <div class="hint" style="margin:6px 0 10px">كل ما يظهر في حساب مدير النظام. العلامة تعني أنه يظهر لهذا المستخدم. العلامات الأولى حسب مسماه، وتتغير تلقائياً عند تغيير الفئة أو الصلاحية. "حسابي" يظهر دائماً.</div>
        <div class="perm-cols">
          <div class="pu-main"><div class="pu-icons"><b style="display:block">أيقونات التطبيقات وما تحتها</b>
            <div class="hint" style="margin:2px 0 6px">شِل العلامة لإخفاء الأيقونة أو جزء منها عن هذا المستخدم. الأيقونة تظهر فقط إذا كانت صلاحياته تسمح بها أصلاً.</div>
            <div class="nav-tree" id="uNavTree">${navTree((k, l, ic, d, g) => `<label class="check nt-r${g ? ' nt-h' : ''}" style="--d:${d}"><input type="checkbox" data-page="${esc(k)}"${SF.canSee(u || { role: 'accountant' }, k) ? ' checked' : ''}><span class="nt-ic">${ic}</span> ${esc(l)}<small class="muted" data-defmark="${esc(k)}"></small></label>`)}</div></div>
            <div class="pu-pages"><b style="display:block;margin-top:14px">الصفحات</b> <button type="button" class="btn sm ghost" data-pagesdef>الافتراضي</button>
            <div class="pu-list">${pageList.map(([k, l]) => `<label class="check"><input type="checkbox" data-page="${esc(k)}"${SF.canSee(u || { role: 'accountant' }, k) ? ' checked' : ''}> ${esc(l)}<small class="muted" data-defmark="${esc(k)}"></small></label>`).join('')}</div></div>
          </div>
          <div><b>أقسام لوحة المؤشرات</b> <button type="button" class="btn sm ghost" data-dashdef>حسب المسمى</button>
            <div class="hint" style="margin:2px 0 6px">تظهر إذا كانت "لوحة المؤشرات" ضمن صفحاته</div>
            ${[...new Set(SF.DASH_SECTIONS.map((s) => s[2]))]
              .map(
                (g) =>
                  `<div class="perm-g">${esc(g)}</div>${SF.DASH_SECTIONS.filter((s) => s[2] === g)
                    .map(
                      ([k, l]) =>
                        `<label class="check"><input type="checkbox" data-dash="${k}"${SF.dashSectionsOf(u || { role: 'accountant' }).includes(k) ? ' checked' : ''}> ${esc(l)}</label>`,
                    )
                    .join('')}`,
              )
              .join('')}
          </div>
          <div><b>الخطابات المتاحة</b> <button type="button" class="btn sm ghost" data-allforms>الكل</button> <button type="button" class="btn sm ghost" data-noforms>لا شيء</button>
            ${SF.GROUPS.map((g) => {
              const fs = SF.FORMS.filter((f) => f.group === g);
              return fs.length
                ? `<div class="perm-g">${esc(g)}</div>${fs.map((f) => `<label class="check"><input type="checkbox" data-form-allow="${f.id}"${SF.formAllowed(u || { role: 'accountant' }, f.id) ? ' checked' : ''}> ${esc(f.title)}</label>`).join('')}`
                : '';
            }).join('')}
          </div>
        </div>
      </details>`
      : '';
  }
  /* جزء من userModal: u && u.role !== 'employee' && isAdmin()… */
  function userModalValue(u) {
    return u && u.role !== 'employee' && isAdmin()
      ? `<div class="pos-box"><h4 class="b-sec">${icon('briefcase')} المنصب وشاغله</h4>
          <div class="hint" style="margin-top:0">هذا الحساب «منصب»: طلباته وسجله ملك المنصب. شاغله يدخل برقم هويته ويعمل بصفته، وعند نقله اختر الشاغل الجديد فيكمل متابعة كل الطلبات.</div>
          <div class="grid2"><div class="field"><label>اسم المنصب</label><input class="in" name="posName" value="${esc(u.posName || '')}" placeholder="${esc(u.posLabel || 'مثال: محاسب فرع خميس مشيط')}"></div>
          <div class="field"><label>شاغل المنصب (من سجل الموظفين)</label><input class="in" id="uHolder" list="uHolderL" value="${esc(u.holder ? `${u.holder.name} — ${u.holder.empNo || u.holder.iqama}` : '')}" placeholder="ابحث بالاسم أو الرقم الوظيفي..."><datalist id="uHolderL"></datalist><input type="hidden" name="holderEmpId" value="${esc(u.holder ? u.holder.id : '')}"></div></div>
          ${
            (u.holders || []).length
              ? `<details><summary class="muted">سجل شاغلي المنصب (${u.holders.length})</summary><table class="tbl" style="margin-top:6px"><thead><tr><th>الموظف</th><th>من</th><th>إلى</th><th>بواسطة</th></tr></thead><tbody>${u.holders
                  .slice()
                  .reverse()
                  .map(
                    (h) =>
                      `<tr><td>${esc(h.name)} <small class="muted">${esc(h.empNo || '')}</small></td><td>${esc(dt(h.from))}</td><td>${h.to ? esc(dt(h.to)) : '<b>حالياً</b>'}</td><td>${esc(h.by || '')}</td></tr>`,
                  )
                  .join('')}</tbody></table></details>`
              : ''
          }</div>`
      : '';
  }
  /* جزء من userModal: if (!host) document.body.appendChild(bg);… */
  function userModalPart2(bg, host, u) {
    if (!host) document.body.appendChild(bg);
    const form = $('form', bg);
    const baseOf = (rid) => ((state.config.roles || []).find((x) => x.id === rid) || {}).base;
    const syncRole = () => {
      $('#vaBox', bg).style.display = baseOf(form.role.value) === 'approver' ? '' : 'none';
    };
    form.role.onchange = syncRole;
    const syncUnit = () => {
      const on = form.unit.value === 'إدارة / قسم';
      $('#deptBox', bg).style.display = on ? '' : 'none';
      $('#subBox', bg).style.display = on ? '' : 'none';
    };
    form.unit.addEventListener('change', syncUnit);
    syncUnit();
    if ($('#sigBox', bg))
      signatureBox($('#sigBox', bg), u, `/api/admin/users/${u.id}/signature`, (nu) => {
        Object.assign(u, nu);
      });
    syncRole();
    const close = () => {
      if (host) location.hash = '#/settings/users';
      else bg.remove();
    };
    $('[data-close]', bg).onclick = close;
    /* القيمة الافتراضية لكل صفحة حسب الصلاحية المختارة في النافذة */
    const draft = () => ({
      role: baseOf(form.role.value),
      roleId: form.role.value,
      branch: form.branch.value.trim(),
      dashboardFlag: u ? u.dashboardFlag : false,
    });
    return userModalPart(bg, close, draft, form, host, u);
  }
  /* جزء من userModal: const markDefaults = () =>… */
  function userModalPart(bg, close, draft, form, host, u) {
    const markDefaults = () =>
      $$('[data-defmark]', bg).forEach((m) => {
        const c = $(`[data-page="${m.dataset.defmark}"]`, bg);
        m.textContent = c.checked !== SF.baseSee(draft(), m.dataset.defmark) ? ' (مخصص)' : '';
      });
    const resetPages = () => {
      $$('[data-page]', bg).forEach((c) => {
        c.checked = SF.baseSee(draft(), c.dataset.page);
      });
      $$('[data-form-allow]', bg).forEach((c) => {
        c.checked = SF.formAllowed(draft(), c.dataset.formAllow);
      });
      markDefaults();
    };
    if ($('.perm-box', bg)) {
      $('[data-allforms]', bg).onclick = () =>
        $$('[data-form-allow]', bg).forEach((c) => {
          c.checked = true;
        });
      if ($('[data-dashdef]', bg))
        $('[data-dashdef]', bg).onclick = () => {
          const def = SF.dashSectionsOf({ ...draft(), dashSections: undefined });
          $$('[data-dash]', bg).forEach((c) => {
            c.checked = def.includes(c.dataset.dash);
          });
        };
      $('[data-noforms]', bg).onclick = () =>
        $$('[data-form-allow]', bg).forEach((c) => {
          c.checked = false;
        });
      $('[data-pagesdef]', bg).onclick = resetPages;
      navTreeWire($('#uNavTree', bg), (r) => $('input', r).checked);
      wirePermFull(bg, form);
      $$('[data-page]', bg).forEach((c) => {
        c.onchange = markDefaults;
      });
      form.role.addEventListener('change', resetPages);
      markDefaults();
    }
    if ($('[data-deluser]', bg))
      $('[data-deluser]', bg).onclick = async () => {
        if (
          !confirm(
            `حذف المستخدم "${u.name}"؟\nينتقل إلى سلة المحذوفات وتستطيع استرجاعه خلال 30 يوماً (دون مسارات الاعتماد التي أزلناه منها).\nتبقى طلباته واعتماداته السابقة باسمه، ويزيله النظام من مسارات الاعتماد.\nإذا أردت منعه من الدخول فقط، اختر "موقوف" بدلاً من الحذف.`,
          )
        )
          return;
        try {
          await api('DELETE', `/api/admin/users/${u.id}`);
          toast('تم حذف المستخدم');
          if (host) location.hash = '#/settings/users';
          else {
            close();
            viewSettings('users');
          }
        } catch (err) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
    /* شاغل المنصب: بحث في سجل الموظفين */
    if ($('#uHolder', bg)) {
      let EMPS = [];
      api('GET', '/api/admin/orgdiv')
        .then((r) => {
          EMPS = r.emps || [];
          $('#uHolderL', bg).innerHTML = EMPS.map(
            (e) => `<option value="${esc(`${e[1]} — ${e[2] || '؟'}`)}">${esc(e[3] || '')}</option>`,
          ).join('');
        })
        .catch(() => {});
      $('#uHolder', bg).onchange = (ev) => {
        const v = ev.target.value.trim(),
          e = EMPS.find((x) => `${x[1]} — ${x[2] || '؟'}` === v);
        $('[name=holderEmpId]', bg).value = e ? e[0] : v ? $('[name=holderEmpId]', bg).value : '';
        if (v && !e) toast('اختر الموظف من القائمة', true);
      };
    }
    return wireUserModal(bg, close, draft, form, host, u);
  }
  /* أحداث userModal */
  function wireUserModal(bg, close, draft, form, host, u) {
    if ($('#uMobUnbind', bg))
      $('#uMobUnbind', bg).onclick = async () => {
        if (!(await askYesNo(`إلغاء ربط جوال "${u.name}"؟ وتربط النظام بحسابه أول جوال يدخل منه بعدها.`))) return;
        try {
          await api('DELETE', `/api/admin/users/${u.id}/mobile`);
          u.mobileDevice = null;
          toast('تم إلغاء ربط الجوال');
          $('#uMobUnbind', bg).closest('.field').innerHTML =
            '<label>الجوال المربوط (تطبيق SES)</label><div class="muted">لا يوجد جوال مربوط</div>';
        } catch (err) {
          toast(err.message, true);
        }
      };
    if (!host)
      bg.onclick = (e) => {
        if (e.target === bg) close();
      };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (!fd.get('unit')) {
        $('.uerr', bg)
          ? ($('.uerr', bg).innerHTML = '<div class="err">اختر التصنيف (فرع أو إدارة / قسم)</div>')
          : toast('اختر التصنيف (فرع أو إدارة / قسم)', true);
        return;
      }
      const body = {
        ...($('#uHolder', bg) ? { posName: fd.get('posName') || '', holderEmpId: fd.get('holderEmpId') || '' } : {}),
        unit: fd.get('unit'),
        dept: fd.get('unit') === 'إدارة / قسم' ? fd.get('dept') || '' : '',
        sub: fd.get('unit') === 'إدارة / قسم' ? fd.get('sub') || '' : '',
        opsOnly: !!fd.get('opsOnly'),
        branchManager: !!fd.get('branchManager'),
        name: fd.get('name'),
        roleId: fd.get('role'),
        branch: fd.get('branch'),
        title: fd.get('title'),
        prefix: fd.get('prefix'),
        viewAll: !!fd.get('viewAll'),
        email: fd.get('email'),
      };
      if ($('.perm-box', bg)) {
        /* تُحفظ فقط الصفحات المختلفة عن الافتراضي لصلاحيته */
        body.pages = Object.fromEntries(
          $$('[data-page]', bg)
            .filter((c) => c.checked !== SF.baseSee(draft(), c.dataset.page))
            .map((c) => [c.dataset.page, c.checked]),
        );
        /* إذا طابقت الخطابات المختارة ما يسمح به المسمى، يتبع المستخدم مسماه */
        const boxes = $$('[data-form-allow]', bg);
        body.allowedForms = boxes.every((c) => c.checked === SF.formAllowed(draft(), c.dataset.formAllow))
          ? null
          : boxes.filter((c) => c.checked).map((c) => c.dataset.formAllow);
        /* أقسام اللوحة: إذا طابقت ما يتيحه المسمى يتبع المستخدم مسماه */
        const dsDef = SF.dashSectionsOf({ ...draft(), dashSections: undefined });
        const dsBoxes = $$('[data-dash]', bg);
        body.dashSections = dsBoxes.every((c) => c.checked === dsDef.includes(c.dataset.dash))
          ? null
          : dsBoxes.filter((c) => c.checked).map((c) => c.dataset.dash);
      }
      if (fd.get('password')) body.password = fd.get('password');
      if (u) body.active = fd.get('active') === '1';
      else body.username = fd.get('username');
      try {
        await api(u ? 'PUT' : 'POST', u ? `/api/admin/users/${u.id}` : '/api/admin/users', body);
        toast('تم الحفظ');
        if (host) {
          if (u) route();
          else location.hash = '#/settings/users';
        } else {
          close();
          viewSettings('users');
        }
      } catch (err) {
        $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  function settingsRoutes(body, settings, users, saveSettings) {
    const routes = JSON.parse(JSON.stringify(settings.routes));
    const approvers = users.filter((u) => u.role !== 'accountant');
    const accountants = users.filter((u) => u.role === 'accountant');
    const uById = Object.fromEntries(users.map((u) => [u.id, u]));
    routes.sort((a, b) => (a.id === 'default' ? -1 : b.id === 'default' ? 1 : 0));
    const ruleTitle = (r) => {
      if (r.id === 'default') return 'المسار الافتراضي — لكل الخطابات ولكل المحاسبين';
      const f = r.form === '*' ? 'كل الخطابات' : (SF.byId[r.form] || {}).title;
      const s = r.submitter === '*' ? 'كل المحاسبين' : (uById[r.submitter] || {}).name;
      return `${f} — ${s}`;
    };
    const render = () => {
      body.innerHTML = `<div class="card info-card">
          <b>كيف يختار النظام المسار؟</b> عند رفع أي طلب يبحث النظام عن أدق مسار مطابق بهذا الترتيب:
          <ol><li>مسار لنفس الخطاب ونفس المحاسب</li><li>مسار لنفس المحاسب (لكل الخطابات)</li><li>مسار لنفس الخطاب (لكل المحاسبين)</li><li>المسار الافتراضي</li></ol>
          تغيير المسار لا يؤثر على الطلبات الجارية، ويُطبَّق على الطلبات الجديدة وعلى الطلبات المعادة عند إعادة إرسالها.
        </div>
        ${routes
          .map(
            (r, ri) => `<div class="card route-card" data-ri="${ri}">
          <div class="row" style="justify-content:space-between;margin-bottom:12px"><h3 style="margin:0">${esc(ruleTitle(r))}</h3>${r.id !== 'default' ? '<button type="button" class="btn sm bad" data-delrule>حذف المسار</button>' : ''}</div>
          ${
            r.id !== 'default'
              ? `<div class="grid2" style="margin-bottom:12px">
            <div class="field"><label>نوع الخطاب</label><select class="in" data-k="form"><option value="*">كل الخطابات</option>${SF.FORMS.map((f) => `<option value="${f.id}"${r.form === f.id ? ' selected' : ''}>${esc(f.title)}</option>`).join('')}</select></div>
            <div class="field"><label>مقدم الطلب (المحاسب)</label><select class="in" data-k="submitter"><option value="*">كل المحاسبين</option>${accountants.map((u) => `<option value="${u.id}"${r.submitter === u.id ? ' selected' : ''}>${esc(u.name)}${u.branch ? ` - ${esc(u.branch)}` : ''}</option>`).join('')}</select></div>
          </div>`
              : ''
          }
          <div class="steps">
            <div class="step-row fixed"><span class="step-n">1</span><span>محاسب الفرع (مقدم الطلب)</span></div>
            ${r.steps
              .map(
                (s, si) => `<div class="step-row" data-si="${si}"><span class="step-n">${si + 2}</span>
              <select class="in" data-sk="userId"><option value="">— اختر المعتمد —</option><option value="@branch"${s.userId === '@branch' ? ' selected' : ''}>مدير الفرع (حسب فرع الطلب)</option>${approvers.map((u) => `<option value="${u.id}"${s.userId === u.id ? ' selected' : ''}${!u.active ? ' disabled' : ''}>${esc(u.name)}${u.title ? ` - ${esc(u.title)}` : ''}${!u.active ? ' (موقوف)' : ''}</option>`).join('')}</select>
              <input class="in" data-sk="label" value="${esc(s.label)}" placeholder="اسم المرحلة (مثال: المدير المالي)">
              <span class="row" style="gap:4px;flex-wrap:nowrap"><button type="button" class="btn sm" data-mv="-1" title="تقديم" ${si === 0 ? 'disabled' : ''}>▲</button><button type="button" class="btn sm" data-mv="1" title="تأخير" ${si === r.steps.length - 1 ? 'disabled' : ''}>▼</button><button type="button" class="btn sm bad" data-delstep title="حذف">✕</button></span>
            </div>`,
              )
              .join('')}
          </div>
          <button type="button" class="btn sm" data-addstep style="margin-top:8px">+ إضافة مرحلة اعتماد</button>
        </div>`,
          )
          .join('')}
        <div class="rerr"></div>
        <div class="row save-bar"><button type="button" class="btn" id="addRule">➕ إضافة مسار مخصص</button><button type="button" class="btn primary" id="saveRoutes">💾 حفظ المسارات</button></div>`;
    };
    return settingsRoutesPart(body, render, routes, saveSettings, settings, uById);
  }
  /* جزء من settingsRoutes: render();… */
  function settingsRoutesPart(body, render, routes, saveSettings, settings, uById) {
    render();
    body.addEventListener('change', (e) => {
      const card = e.target.closest('[data-ri]');
      if (!card) return;
      const r = routes[card.dataset.ri];
      if (e.target.dataset.k) {
        r[e.target.dataset.k] = e.target.value;
        render();
        return;
      }
      const row = e.target.closest('[data-si]');
      if (row && e.target.dataset.sk) {
        const s = r.steps[row.dataset.si];
        s[e.target.dataset.sk] = e.target.value;
        if (e.target.dataset.sk === 'userId' && !s.label && uById[s.userId]) {
          s.label = uById[s.userId].title || '';
          render();
        }
        if (e.target.dataset.sk === 'userId' && s.userId === '@branch' && !s.label) {
          s.label = 'مدير الفرع';
          render();
        }
      }
    });
    body.addEventListener('input', (e) => {
      const row = e.target.closest('[data-si]'),
        card = e.target.closest('[data-ri]');
      if (row && card && e.target.dataset.sk === 'label') routes[card.dataset.ri].steps[row.dataset.si].label = e.target.value;
    });
    body.addEventListener('click', async (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      const card = t.closest('[data-ri]');
      const r = card && routes[card.dataset.ri];
      const row = t.closest('[data-si]');
      if (t.hasAttribute('data-addstep')) {
        r.steps.push({ userId: '', label: '' });
        render();
      } else if (t.hasAttribute('data-delstep')) {
        r.steps.splice(Number(row.dataset.si), 1);
        render();
      } else if (t.dataset.mv) {
        const i = Number(row.dataset.si),
          j = i + Number(t.dataset.mv);
        [r.steps[i], r.steps[j]] = [r.steps[j], r.steps[i]];
        render();
      } else if (t.hasAttribute('data-delrule')) {
        if (confirm('حذف هذا المسار؟')) {
          routes.splice(Number(card.dataset.ri), 1);
          render();
        }
      } else if (t.id === 'addRule') {
        const def = routes.find((x) => x.id === 'default');
        routes.push({ id: '', form: SF.FORMS[0].id, submitter: '*', steps: JSON.parse(JSON.stringify(def.steps)) });
        render();
        body.lastElementChild.previousElementSibling.previousElementSibling.scrollIntoView({ behavior: 'smooth' });
      } else if (t.id === 'saveRoutes') {
        try {
          const s = await saveSettings({ routes }, 'تم حفظ مسارات الاعتماد');
          settings.routes = s.routes;
          routes.splice(0, routes.length, ...JSON.parse(JSON.stringify(s.routes)));
          routes.sort((a, b) => (a.id === 'default' ? -1 : b.id === 'default' ? 1 : 0));
          render();
        } catch (err) {
          $('.rerr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      }
    });
  }

  function settingsForms(body, s, saveSettings) {
    body.innerHTML = `<div class="dash-grid">
      <div class="card"><h3>النماذج المتاحة للمحاسبين</h3><p class="muted" style="margin-top:0">ألغِ تحديد أي نموذج لإخفائه من صفحة "رفع طلب جديد". الطلبات السابقة لا تتأثر.</p>
        ${SF.FORMS.map((f) => `<label class="check"><input type="checkbox" data-form="${f.id}"${s.disabledForms.includes(f.id) ? '' : ' checked'}> ${esc(f.title)} <small class="muted">(${esc(f.group)})</small></label>`).join('')}
      </div>
      <div class="card"><h3>النماذج التي أنشأتها</h3><p class="muted" style="margin-top:0">نماذج أنشأتها من النظام بدون كود. يمكنك تعديلها في أي وقت.</p>
        ${(s.customForms || []).map((f) => `<div class="row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line,#eee)"><span><b>${esc(f.title)}</b> <small class="muted">(${esc(f.group)} — ${f.fields.length} حقل)</small></span><a class="btn sm" href="#/builder/${f.id}">تعديل</a></div>`).join('') || '<div class="muted">لا توجد نماذج مخصصة بعد</div>'}
        <a class="btn primary" href="#/builder" style="margin-top:12px">🛠️ إنشاء نموذج جديد</a>
      </div>
      <div class="card"><h3>تعديل نصوص النماذج الأصلية</h3><p class="muted" style="margin-top:0">عدّل صياغة الخطاب وحقوله وتوقيعاته بدون كود. النماذج المركبة (جداول وحسابات) تعدّل فيها العنوان والتوقيعات فقط.</p>
        ${SF.FORMS.filter((f) => SF.isBuiltin(f.id))
          .map(
            (f) =>
              `<div class="row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line,#eee)"><span><b>${esc(f.title)}</b> <small class="muted">(${esc(f.group)}${SF.editableFully(f.id) ? '' : ' — العنوان والتوقيعات'})</small>${(s.formOverrides || {})[f.id] ? ' <span class="chip approved">معدّل</span>' : ''}</span><a class="btn sm" href="#/builder/${f.id}">تعديل</a></div>`,
          )
          .join('')}
      </div>
      <div class="card"><h3>الفروع</h3><p class="muted" style="margin-top:0">فرع في كل سطر. تظهر كاختيارات عند ملء خانة الفرع وعند إنشاء المستخدمين.</p>
        <textarea class="in" id="brs" rows="12">${esc(s.branches.join('\n'))}</textarea>
      </div></div>
      <div class="ferr"></div>
      <div class="row save-bar"><button class="btn primary" id="saveForms">💾 حفظ</button></div>`;
    $('#saveForms').onclick = async () => {
      try {
        await saveSettings({
          disabledForms: $$('[data-form]', body)
            .filter((c) => !c.checked)
            .map((c) => c.dataset.form),
          branches: $('#brs')
            .value.split('\n')
            .map((x) => x.trim())
            .filter(Boolean),
        });
      } catch (err) {
        $('.ferr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  /* جزء من settingsTools: const draw = () => {… */
  function settingsToolsPart(body, pageState, saveSettings, upload) {
    const draw = () => {
      renderDraw(body, pageState.list);
      const sync = () => {
        $$('[data-tt]', body).forEach((e) => {
          pageState.list[e.dataset.tt].title = e.value;
        });
        $$('[data-tk]', body).forEach((e) => {
          pageState.list[e.dataset.tk].kind = e.value;
        });
        $$('[data-th]', body).forEach((e) => {
          pageState.list[e.dataset.th].hidden = !e.checked;
        });
        $$('[data-tr]', body).forEach((e) => {
          pageState.list[e.dataset.tr].trusted = e.checked;
        });
      };
      $('#tAdd').onclick = async () => {
        const f = $('#tFile').files[0];
        if (!f) {
          toast('اختر ملف البرنامج', true);
          return;
        }
        try {
          const r = await upload(f, { title: $('#tTitle').value, kind: $('#tKind').value });
          pageState.list = r.tools;
          toast('تمت إضافة البرنامج');
          draw();
        } catch (err) {
          toast(err.message, true);
        }
      };
      $$('[data-trep]', body).forEach((inp) => {
        inp.onchange = async () => {
          const f = inp.files[0];
          if (!f) return;
          try {
            await upload(f, { replace: pageState.list[inp.dataset.trep].file });
            toast('تم استبدال ملف البرنامج');
          } catch (err) {
            toast(err.message, true);
          }
        };
      });
      $$('[data-tup]', body).forEach((b) => {
        b.onclick = () => {
          sync();
          const i = Number(b.dataset.tup);
          [pageState.list[i - 1], pageState.list[i]] = [pageState.list[i], pageState.list[i - 1]];
          draw();
        };
      });
      $$('[data-tdel]', body).forEach((b) => {
        b.onclick = () => {
          sync();
          const t = pageState.list[b.dataset.tdel];
          if (!confirm(`حذف "${t.title}"؟ ينتقل إلى سلة المحذوفات بعد الحفظ وتستطيع استرجاعه خلال 30 يوماً.`)) return;
          pageState.list.splice(b.dataset.tdel, 1);
          draw();
        };
      });
      $('#tSave').onclick = async () => {
        sync();
        try {
          const s2 = await saveSettings({ tools: pageState.list }, 'تم حفظ الأدوات');
          pageState.list = s2.tools || pageState.list;
          draw();
        } catch (err) {
          $('.ferr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
    };
    draw();
  }
  /* محتوى draw (HTML) */
  function renderDraw(body, list) {
    body.innerHTML = `<div class="card"><h3>إضافة برنامج جديد</h3>
        <p class="muted" style="margin-top:0">ارفع أي برنامج بصيغة HTML (مثل الحاسبات والإقرارات)، وسمِّه واختر قسمه، فيظهر في صفحة "النماذج والأدوات". ويمكن التحكم فيمن يراه من "ما يظهر لهذا المستخدم".</p>
        <div class="grid2"><div class="field"><label>الملف (HTML)</label><input type="file" class="in" id="tFile" accept=".html,.htm"></div>
          <div class="field"><label>الاسم الظاهر</label><input class="in" id="tTitle" placeholder="مثال: حاسبة مكافأة نهاية الخدمة"></div>
          <div class="field"><label>القسم</label><select class="in" id="tKind"><option value="tool">الأدوات</option><option value="form">النماذج</option></select></div>
          <div class="field" style="align-self:end"><button class="btn primary" id="tAdd">⬆ رفع وإضافة</button></div></div></div>
        <div class="card"><h3>الأدوات الحالية</h3>
        <div class="hint" style="margin-bottom:8px">البرامج المرفوعة تعمل <b>معزولة</b> عن النظام لحمايتها، فلا تصل إلى بيانات المستخدم. إذا احتاج برنامج حفظ بيانات في المتصفح ولم يعمل، فعّل له "موثوق" فقط إذا كنت تثق بمصدره.</div>
        ${list
          .map(
            (t, i) => `<div class="tool-row${t.hidden ? ' off' : ''}">
          <input class="in" data-tt="${i}" value="${esc(t.title)}">
          <select class="in" data-tk="${i}"><option value="tool"${t.kind === 'tool' ? ' selected' : ''}>الأدوات</option><option value="form"${t.kind === 'form' ? ' selected' : ''}>النماذج</option></select>
          <label class="check"><input type="checkbox" data-th="${i}"${t.hidden ? '' : ' checked'}> ظاهر</label>
          ${t.builtin ? '<small class="muted">أصلية</small>' : `<label class="check" title="يعمل بدون عزل"><input type="checkbox" data-tr="${i}"${t.trusted ? ' checked' : ''}> موثوق</label>`}
          <a class="btn sm" href="/legacy/${encodeURIComponent(t.file)}" target="_blank">فتح</a>
          ${t.builtin ? '' : `<label class="btn sm" style="cursor:pointer">استبدال<input type="file" data-trep="${i}" accept=".html,.htm" hidden></label>`}
          <button type="button" class="btn sm ghost" data-tup="${i}" ${i ? '' : 'disabled'}>▲</button>
          ${t.builtin ? '' : `<button type="button" class="btn sm bad" data-tdel="${i}">حذف</button>`}
        </div>`,
          )
          .join('')}
        <div class="ferr"></div>
        <div class="row save-bar"><button class="btn primary" id="tSave">💾 حفظ التغييرات</button></div></div>`;
  }
  return {
    settingsToolsPart,
    viewUserPage,
    settingsForms,
    settingsRoutes,
    settingsGeneralValue3,
    settingsGeneralValue,
    settingsGeneralValue2,
    settingsGeneralPart2,
    drawPart,
  };
};
