'use strict';
/* صفحة «settings» (viewSettings، viewUserPage) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['settings'] = function (S) {
  const {
    $,
    $$,
    DAYS,
    DOC_DEF,
    HR_SETTINGS,
    OCC,
    SF,
    SOCIAL,
    SOCIAL_CLR,
    SUB_COLORS,
    TABS,
    TAB_ICONS,
    THEMES,
    api,
    applyConfig,
    applyTheme,
    askYesNo,
    chatErr,
    chatModal,
    downloadCsv,
    dt,
    esc,
    head,
    icon,
    isAdmin,
    navTree,
    navTreeWire,
    route,
    settingsTrash,
    shell,
    signatureBox,
    socIcon,
    socList,
    state,
    toast,
    today,
  } = S;
  /* أجزاء صفحة الإعدادات (3) (settings-kit-3.js) */
  const { otpCard, settingsOrgDiv, settingsCountries, contrastWhite } = window.SES_PAGE_KITS['settings-3'](S, {});

  /* «المسميات والصلاحيات» صارت كروت الفئات داخل «المستخدمون»: لا تظهر وحدها في القائمة لمن يرى المستخدمين */
  const navTabs = (tabs) => (tabs.some(([k]) => k === 'users') ? tabs.filter(([k]) => k !== 'roles') : tabs);
  const tabOn = (k, tab) => k === tab || (k === 'users' && tab === 'roles');
  async function viewSettings(tab, sub) {
    if (tab === 'trash') {
      location.hash = '#/trash';
      return;
    }
    /* رقابة المراسلات لمدير النظام فقط (لا تُمنح بالصلاحيات) */
    const myTabs = TABS.filter(([k]) => (k === 'oversight' ? isAdmin() : SF.settingsTabs(state.user).includes(k)));
    if (!myTabs.length) {
      location.hash = '#/';
      return;
    }
    tab = myTabs.some(([k]) => k === tab) ? tab : myTabs[0][0];
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/settings');
    const [settings, users] = await Promise.all([api('GET', '/api/admin/settings'), api('GET', '/api/admin/users')]);
    main.innerHTML = `${head('الإعدادات', 'إدارة المستخدمين ومسارات الاعتماد وإعدادات النظام')}
      <div class="set-wrap"><nav class="set-nav" aria-label="أقسام الإعدادات">${navTabs(myTabs)
        .map(
          ([k, t]) =>
            `<a href="#/settings/${k}" class="${tabOn(k, tab) ? 'on' : ''}"${tabOn(k, tab) ? ' aria-current="page"' : ''}>${icon(TAB_ICONS[k] || 'settings')}<span>${t}</span></a>`,
        )
        .join('')}</nav>
      <div id="tabBody" class="set-body"></div></div>`;
    /* على الشاشات الصغيرة القائمة شريط أفقي: يظهر فيه التبويب المفتوح */
    const navOn = $('.set-nav a.on');
    if (navOn && innerWidth <= 900) navOn.scrollIntoView({ inline: 'center', block: 'nearest' });
    const body = $('#tabBody');
    const saveSettings = (...args) => settingsSaveSettings(...args);
    await viewSettingsPart(body, saveSettings, settings, tab, users, sub);
    if (tab === 'hr') settingsHr(body, settings, saveSettings, sub);
    if (tab === 'tools') await settingsTools(body, saveSettings);
    await viewSettingsPart2(body, saveSettings, settings, tab);
    if (tab === 'activity') await settingsActivity(body);
    if (tab === 'oversight') await settingsOversight(body, sub);
    if (tab === 'trash') await settingsTrash(body);
    if (tab === 'routes') {
      settingsRoutes(body, settings, users, saveSettings);
      const fl = settings.settlementFlow || {};
      const opts = (sel) =>
        `<option value="">— اختر —</option>${users
          .filter((u) => u.active)
          .map(
            (u) =>
              `<option value="${u.id}"${sel === u.id ? ' selected' : ''}>${esc(u.name)}${u.title ? ` — ${esc(u.title)}` : ''}</option>`,
          )
          .join('')}`;
      body.insertAdjacentHTML('afterbegin', settingsValue6(fl, opts));
      const lf = settings.legalFlow || {};
      $('#flowCard').insertAdjacentHTML('afterend', settingsValue5(lf, opts));
      const hf = settings.hiringFlow || {};
      $('#legalCard').insertAdjacentHTML('afterend', settingsValue3(hf, opts));
      const techRow = (
        x,
      ) => `<div class="row hf-tech" style="gap:8px;margin-bottom:6px"><select class="in" data-t="user" style="flex:1">${opts(x.userId)}</select>
        <input class="in" data-t="label" style="flex:1" placeholder="التخصص (مثال: مالي)" value="${esc(x.label || '')}"><button type="button" class="btn sm ghost" data-t="rm" title="حذف">✕</button></div>`;
      viewSettingsPart3(hf, opts, saveSettings, settings, techRow);
      const mf = settings.maintFlow || {};
      $('#hireCard').insertAdjacentHTML('afterend', settingsValue7(mf, opts));
      const wsRow = (
        w,
      ) => `<div class="row mf-ws" style="gap:8px;margin-bottom:6px"><input class="in" data-t="name" style="flex:1" placeholder="اسم الورشة (مثال: ورشة الرياض)" value="${esc(w.name || '')}">
        <select class="in" data-t="user" style="flex:1">${opts(w.userId)}</select><button type="button" class="btn sm ghost" data-t="rm" title="حذف">✕</button></div>`;
      const mfRows = $('#mfRows');
      mfRows.innerHTML = settingsValue2(mf).map(wsRow).join('');
      $('#mfAdd').onclick = () => mfRows.insertAdjacentHTML('beforeend', wsRow({}));
      mfRows.onclick = (e) => {
        if (e.target.dataset.t === 'rm') e.target.closest('.mf-ws').remove();
      };
      wireMfSave2(mfRows, saveSettings);
      notifyCard(settings, users, saveSettings);
      wireSettings(saveSettings);
    }
    if (tab === 'forms') settingsForms(body, settings, saveSettings);
  }
  /* جزء من viewSettings: const techRows = $('#hfTechRows');… */
  function viewSettingsPart3(hf, opts, saveSettings, settings, techRow) {
    const techRows = $('#hfTechRows');
    const techInit = Array.isArray(hf.techList) ? hf.techList : hf.tech ? [{ userId: hf.tech, label: '' }] : [];
    techRows.innerHTML = (techInit.length ? techInit : [{}]).map(techRow).join('');
    $('#hfTechAdd').onclick = () => techRows.insertAdjacentHTML('beforeend', techRow({}));
    const recRow = (id) =>
      `<div class="row hf-rec" style="gap:8px;margin-bottom:6px"><select class="in" style="flex:1">${opts(id)}</select><button type="button" class="btn sm ghost" data-t="rm" title="حذف">✕</button></div>`;
    const recRows = $('#hfRecRows');
    const recInit = Array.isArray(hf.recruiters) ? hf.recruiters : [hf.recruiter, hf.hr].filter(Boolean);
    recRows.innerHTML = (recInit.length ? recInit : ['']).map(recRow).join('');
    $('#hfRecAdd').onclick = () => recRows.insertAdjacentHTML('beforeend', recRow(''));
    recRows.onclick = (e) => {
      if (e.target.dataset.t === 'rm') e.target.closest('.hf-rec').remove();
    };
    techRows.onclick = (e) => {
      if (e.target.dataset.t === 'rm') e.target.closest('.hf-tech').remove();
    };
    wireHfSave(recRows, saveSettings, techRows);
    const ot = settings.opsTeams || {};
    const teamRow = (id) =>
      `<div class="row ops-row" style="gap:8px;margin-bottom:6px"><select class="in" style="flex:1">${opts(id)}</select><button type="button" class="btn sm ghost" data-t="rm" title="حذف">✕</button></div>`;
    const teamBox = (k, title, hint) =>
      `<div class="field"><label>${title}</label><div class="hint" style="margin-bottom:6px">${hint}</div><div data-team="${k}">${((ot[k] || []).length ? ot[k] : ['']).map(teamRow).join('')}</div><button type="button" class="btn sm" data-team-add="${k}">+ إضافة</button></div>`;
    $('#hireCard').insertAdjacentHTML('afterend', settingsValue4(teamBox));
    const oc = $('#opsCard');
    oc.addEventListener('click', (e) => {
      if (e.target.dataset.t === 'rm') e.target.closest('.ops-row').remove();
      const add = e.target.closest('[data-team-add]');
      if (add) $(`[data-team="${add.dataset.teamAdd}"]`, oc).insertAdjacentHTML('beforeend', teamRow(''));
    });
    wireOtSave(oc, saveSettings);
    /* دورة مباشرة عمل موظف: شئون الموظفين تعتمد، والمدير الإداري يرى المباشرات للعلم */
    const wsf = settings.workStartFlow || {};
    const wsvRow = (id) =>
      `<div class="row ws-row" style="gap:8px;margin-bottom:6px"><select class="in" style="flex:1">${opts(id)}</select><button type="button" class="btn sm ghost" data-t="rm" title="حذف">✕</button></div>`;
    $('#hireCard').insertAdjacentHTML('afterend', settingsValue8(opts, wsf, wsvRow));
    const wsc = $('#wsCard');
    $('#wsAdd', wsc).onclick = () => $('#wsViewers', wsc).insertAdjacentHTML('beforeend', wsvRow(''));
    wsc.addEventListener('click', (e) => {
      if (e.target.dataset.t === 'rm') e.target.closest('.ws-row').remove();
    });
    $('#wsSave', wsc).onclick = async () => {
      try {
        await saveSettings(
          {
            workStartFlow: {
              hr: $('#wsHr', wsc).value,
              viewers: $$('#wsViewers select', wsc)
                .map((s) => s.value)
                .filter(Boolean),
            },
          },
          'تم حفظ دورة مباشرة عمل موظف',
        );
      } catch (err) {
        $('.wserr', wsc).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    const mff = settings.mfgFlow || {};
    $('#hireCard').insertAdjacentHTML('afterend', settingsValue10(mff, opts));
    wireMfSave(saveSettings);
    const tfl = settings.transferFlow || {};
    $('#hireCard').insertAdjacentHTML('afterend', settingsValue9(opts, tfl));
    const apRow = (
      x,
    ) => `<div class="row tf-ap" style="gap:8px;margin-bottom:6px"><select class="in" data-t="user" style="flex:1">${opts(x.userId)}</select>
        <input class="in" data-t="label" style="flex:1" placeholder="الوصف (مثال: المدير المالي)" value="${esc(x.label || '')}"><button type="button" class="btn sm ghost" data-t="rm" title="حذف">✕</button></div>`;
    const apRows = $('#tfApRows');
    const apInit = Array.isArray(tfl.approvers) ? tfl.approvers : tfl.monitor ? [{ userId: tfl.monitor, label: 'مدير إدارة الفروع' }] : [];
    apRows.innerHTML = (apInit.length ? apInit : [{}]).map(apRow).join('');
    $('#tfApAdd').onclick = () => apRows.insertAdjacentHTML('beforeend', apRow({}));
    apRows.onclick = (e) => {
      if (e.target.dataset.t === 'rm') e.target.closest('.tf-ap').remove();
    };
    wireTfSave(apRows, saveSettings);
  }
  /* أحداث viewSettings: #mfSave */
  function wireMfSave2(mfRows, saveSettings) {
    $('#mfSave').onclick = async () => {
      const workshops = $$('.mf-ws', mfRows)
        .map((r) => ({ name: $('[data-t="name"]', r).value.trim(), userId: $('[data-t="user"]', r).value }))
        .filter((w) => w.name);
      try {
        await saveSettings({ maintFlow: { workshops, external: $('#mfExt').value } }, 'تم حفظ إعدادات دورة الصيانة');
      } catch (err) {
        $('.merr', $('#maintCard')).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* أحداث viewSettings: #tfSave */
  function wireTfSave(apRows, saveSettings) {
    $('#tfSave').onclick = async () => {
      const approvers = $$('.tf-ap', apRows)
        .map((r) => ({ userId: $('[data-t="user"]', r).value, label: $('[data-t="label"]', r).value.trim() }))
        .filter((x) => x.userId);
      try {
        await saveSettings({ transferFlow: { approvers, hr: $('#tfHr').value } }, 'تم حفظ مسؤولي دورة قرار نقل موظف');
      } catch (err) {
        $('.terr', $('#transferCard')).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* أحداث viewSettings: #mfSave */
  function wireMfSave(saveSettings) {
    $('#mfSave').onclick = async () => {
      try {
        await saveSettings(
          { mfgFlow: { ops: $('#mfOps').value, wsAcc: $('#mfAcc').value, fin: $('#mfFin').value } },
          'تم حفظ دورة طلب التصنيع وإذن الصرف',
        );
      } catch (err) {
        $('#mfgCard .mferr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* أحداث viewSettings: #hfSave */
  function wireHfSave(recRows, saveSettings, techRows) {
    $('#hfSave').onclick = async () => {
      const techList = $$('.hf-tech', techRows)
        .map((r) => ({ userId: $('[data-t="user"]', r).value, label: $('[data-t="label"]', r).value.trim() }))
        .filter((x) => x.userId);
      try {
        await saveSettings(
          {
            hiringFlow: {
              recruiters: $$('.hf-rec select', recRows)
                .map((s) => s.value)
                .filter(Boolean),
              techList,
              payroll: $('#hfPay').value,
              head: $('#hfHead').value,
            },
          },
          'تم حفظ مسؤولي دورة نموذج التوظيف',
        );
      } catch (err) {
        $('.herr', $('#hireCard')).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* أحداث viewSettings: #otSave */
  function wireOtSave(oc, saveSettings) {
    $('#otSave').onclick = async () => {
      const v = (k) =>
        $$(`[data-team="${k}"] select`, oc)
          .map((s) => s.value)
          .filter(Boolean);
      try {
        await saveSettings(
          {
            opsTeams: {
              inventory: v('inventory'),
              drilling: v('drilling'),
              store: v('store'),
              devMaint: v('devMaint'),
              hr: v('hr'),
              hse: v('hse'),
              gov: v('gov'),
              know: v('know'),
              train: v('train'),
            },
          },
          'تم حفظ فرق إدارة العمليات',
        );
      } catch (err) {
        $('.oerr', oc).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* أحداث viewSettings: #lfSave، #flSave */
  function wireSettings(saveSettings) {
    $('#lfSave').onclick = async () => {
      try {
        await saveSettings(
          {
            legalFlow: {
              legal: $('#lfLegal').value,
              adminMgr: $('#lfAdmin').value,
              mgr: $('#lfMgr').value,
              fin: $('#lfFin').value,
              wps: $('#lfWps').value,
            },
          },
          'تم حفظ مسؤولي دورة خصم الشئون القانونية',
        );
      } catch (err) {
        $('.lerr', $('#legalCard')).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    $('#flSave').onclick = async () => {
      try {
        await saveSettings(
          { settlementFlow: { hr: $('#flHr').value, traffic: $('#flTr').value, wps: $('#flWps').value } },
          'تم حفظ مسؤولي دورة التصفية',
        );
      } catch (err) {
        $('.ferr', $('#flowCard')).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  /* أجزاء صفحة الإعدادات (2) (settings-kit-2.js) */
  const {
    settingsToolsPart,
    viewUserPage,
    settingsForms,
    settingsRoutes,
    settingsGeneralValue3,
    settingsGeneralValue,
    settingsGeneralValue2,
    settingsGeneralPart2,
    drawPart,
  } = window.SES_PAGE_KITS['settings-2'](S, { settingsGeneralPart, viewSettings });

  /* جزء من settingsGeneral: let coItems = (s.customOccasions || []).map((x) =>… */
  function settingsGeneralPart(CO_DECOS, CO_THEMES, body, s, saveSettings) {
    let coItems = (s.customOccasions || []).map((x) => ({ ...x }));
    const coRow = (c, i) => `<div class="co-row" data-i="${i}">
      <div class="co-g"><input class="in" data-k="icon" value="${esc(c.icon || '🎉')}" maxlength="8" style="width:56px;text-align:center" title="أيقونة (إيموجي)"><input class="in" data-k="name" value="${esc(c.name || '')}" placeholder="اسم المناسبة *" maxlength="80"></div>
      <div class="co-g"><label>من <input class="in" type="date" data-k="from" value="${esc(c.from || '')}"></label><label>إلى <input class="in" type="date" data-k="to" value="${esc(c.to || '')}"></label><label class="check"><input type="checkbox" data-k="yearly"${c.yearly ? ' checked' : ''}> كل سنة</label><label class="check"><input type="checkbox" data-k="enabled"${c.enabled === false ? '' : ' checked'}> مفعّلة</label></div>
      <div class="co-g"><input class="in" data-k="title" value="${esc(c.title || '')}" placeholder="العنوان الكبير (اختياري)" maxlength="80"><input class="in" data-k="sub" value="${esc(c.sub || '')}" placeholder="سطر تحت العنوان (اختياري)" maxlength="120"><input class="in" data-k="greet" value="${esc(c.greet || '')}" placeholder="التهنئة في شاشة الدخول (اختياري)" maxlength="120"></div>
      <div class="co-g"><select class="in" data-k="theme">${CO_THEMES.map(([v, l]) => `<option value="${v}"${(c.theme || 'brand') === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select><select class="in" data-k="deco">${CO_DECOS.map(([v, l]) => `<option value="${v}"${(c.deco || 'none') === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
        ${c.id ? `<a class="btn sm ghost" href="/?occ=custom:${esc(c.id)}#/login" target="_blank" rel="noopener">معاينة</a>` : '<span class="muted" style="font-size:12px">المعاينة بعد الحفظ</span>'}<button type="button" class="btn sm ghost" data-del title="حذف">🗑</button></div></div>`;
    function coRead() {
      return $$('.co-row', $('#coList')).map((r) => {
        const o = { id: (coItems[r.dataset.i] || {}).id || '' };
        $$('[data-k]', r).forEach((el) => {
          o[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value.trim();
        });
        return o;
      });
    }
    const coDraw = () => {
      $('#coList').innerHTML = coItems.length
        ? coItems.map(coRow).join('')
        : '<div class="muted" style="font-size:13px">لا توجد مناسبات مخصصة — مثال: ذكرى تأسيس الشركة، إطلاق مشروع، حملة داخلية</div>';
      $$('[data-del]', $('#coList')).forEach((b) => {
        b.onclick = () => {
          coItems = coRead();
          coItems.splice(Number(b.closest('.co-row').dataset.i), 1);
          coDraw();
        };
      });
    };
    $('#coAdd').onclick = () => {
      coItems = coRead();
      coItems.push({ icon: '🎉', yearly: true, enabled: true, theme: 'brand', deco: 'national' });
      coDraw();
      $('#coList .co-row:last-child [data-k="name"]').focus();
    };
    coDraw();
    /* ألوان النظام: معاينة فورية + تنبيه إذا كان النص الأبيض غير واضح على اللون */
    const gf = $('#gf');
    const syncTheme = (from) => {
      const pick = (c, h) => {
        if (from === c) gf[h].value = gf[c].value;
        else if (/^#[0-9a-f]{6}$/i.test(gf[h].value.trim())) gf[c].value = gf[h].value.trim();
      };
      pick('tBrand', 'tBrandHex');
      pick('tSide', 'tSideHex');
      applyTheme({ brand: gf.tBrand.value, side: gf.tSide.value });
      const low = [gf.tBrand.value, gf.tSide.value].some((h) => contrastWhite(h) < 4.5);
      $('#tHint').innerHTML = low
        ? '<span style="color:var(--warn)">⚠ لون فاتح: الكتابة البيضاء عليه لن تكون واضحة. اختر لوناً أغمق.</span>'
        : 'تظهر الألوان على الصفحة فوراً للمعاينة، وتُطبَّق على الجميع بعد الحفظ. ألوان الخطاب المطبوع لا تتغير.';
    };
    ['tBrand', 'tSide', 'tBrandHex', 'tSideHex'].forEach((n) => {
      gf[n].addEventListener('input', () => syncTheme(n));
    });
    $$('.theme-chip', gf).forEach((b) => {
      b.onclick = () => {
        gf.tBrand.value = gf.tBrandHex.value = b.dataset.tb;
        gf.tSide.value = gf.tSideHex.value = b.dataset.ts;
        syncTheme(null);
      };
    });
    /* معاينة شكل رقم الطلب */
    const sp = () => {
      const f = $('#gf');
      const parts = [
        f.sPrefix.value.trim(),
        f.sYearly.checked ? new Date().getFullYear() : '',
        String(f.sNext.value || 1).padStart(Number(f.sDigits.value), '0'),
      ].filter(Boolean);
      $('#sPreview').textContent = parts.join(f.sSep.value);
    };
    $('#gf').addEventListener('input', sp);
    $('#gf').addEventListener('change', sp);
    sp();
    return wireGf(body, coRead, saveSettings);
  }

  /* أجزاء صفحة الإعدادات (1) (settings-kit.js) */
  const {
    settingsTools,
    settingsActivity,
    settingsOversight,
    settingsBackup,
    settingsEmail,
    settingsCalendar,
    settingsHrPart,
    renderSettingsHr,
    settingsHrDraw,
  } = window.SES_PAGE_KITS['settings'](S, { settingsToolsPart, viewSettings });
  /* فئات المستخدمين (المسميات) وصفحة صلاحياتها (settings-roles.js) */
  const { settingsRoles, categoryCards } = window.SES_PAGE_KITS['settings-roles'](S, { viewSettings });
  /* أجزاء صفحة الإعدادات (4) (settings-kit-4.js) */
  const {
    viewSettingsPart,
    settingsHr,
    viewSettingsPart2,
    settingsSaveSettings,
    settingsValue6,
    settingsValue5,
    settingsValue3,
    settingsValue4,
    settingsValue8,
    settingsValue10,
    settingsValue9,
    settingsValue7,
    settingsValue2,
    notifyCard,
    wireGf,
  } = window.SES_PAGE_KITS['settings-4'](S, {
    drawPart,
    otpCard,
    renderSettingsHr,
    settingsBackup,
    settingsCalendar,
    settingsCountries,
    settingsEmail,
    settingsGeneralPart2,
    settingsGeneralValue,
    settingsGeneralValue2,
    settingsGeneralValue3,
    settingsHrDraw,
    settingsHrPart,
    settingsOrgDiv,
    settingsRoles,
    categoryCards,
    viewSettings,
  });

  return { viewSettings, viewUserPage };
};
