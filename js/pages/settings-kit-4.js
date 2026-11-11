'use strict';
/* أجزاء صفحة الإعدادات (4) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['settings-4'] = function (S, ctx) {
  const {
    $,
    $$,
    HR_SETTINGS,
    OCC,
    SF,
    SOCIAL,
    SOCIAL_CLR,
    THEMES,
    api,
    applyConfig,
    askYesNo,
    esc,
    isAdmin,
    socIcon,
    socList,
    state,
    toast,
  } = S;
  const {
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
  } = ctx;
  /* جزء من viewSettings: `<div class="card" id="mfgCard"><h3>دورة طلب التصنيع وإذن ال… */
  function settingsValue10(mff, opts) {
    return `<div class="card" id="mfgCard"><h3>دورة طلب التصنيع وإذن الصرف</h3>
        <p class="muted" style="margin-top:0">طلب التصنيع: محاسب الفرع ← مدير الفرع ← مسئول الورشة (عرض سعر: خامات + مصنوعية) ← <b>مدير العمليات</b> (اعتماد العرض) ← مدير الفرع (الموافقة على العرض أو رفضه) ← الورشة (التصنيع ثم الترحيل للمخزن تلقائياً).<br>إذن الصرف من المخزن: مسئول الورشة ← <b>مدير العمليات</b>، وبعد الاعتماد يخصم النظام الكمية من الرصيد.<br>إذن صرف وبيع خردة: <b>محاسب الورش</b> ← <b>مدير العمليات</b> ← <b>المدير المالي</b> (التعميد). ومسئول كل ورشة من دورة طلب صيانة مركبة.</p>
        <div class="grid2" style="max-width:820px"><div class="field"><label>مدير العمليات</label><select class="in" id="mfOps">${opts(mff.ops)}</select></div><div class="field"><label>محاسب الورش (إذن بيع الخردة)</label><select class="in" id="mfAcc">${opts(mff.wsAcc)}</select></div><div class="field"><label>المدير المالي (تعميد بيع الخردة)</label><select class="in" id="mfFin">${opts(mff.fin)}</select></div></div><div class="mferr"></div>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="mfSave">💾 حفظ</button></div></div>`;
  }
  /* جزء من viewSettings: `<div class="card" id="transferCard"><h3>دورة قرار نقل موظف<… */
  function settingsValue9(opts, tfl) {
    return `<div class="card" id="transferCard"><h3>دورة قرار نقل موظف</h3>
        <p class="muted" style="margin-top:0">مدير الفرع المنقول منه ← مدير الفرع المنقول إليه (من حسابات مديري الفروع تلقائياً) ← المعتمد المختص ← شئون الموظفين.</p>
        <div class="field" style="max-width:720px"><label>معتمدو قرار النقل</label><div class="hint" style="margin-bottom:6px">مرسل الطلب يختار واحداً منهم حسب وظيفة الموظف (مثال: المدير المالي إذا كان محاسباً)، ويظهر الوصف في خانة توقيعه على القرار.</div>
          <div id="tfApRows"></div><button type="button" class="btn sm" id="tfApAdd">+ إضافة معتمد</button></div>
        <div class="field" style="max-width:360px"><label>شئون الموظفين</label><select class="in" id="tfHr">${opts(tfl.hr)}</select></div><div class="terr"></div>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="tfSave">💾 حفظ مسؤولي الدورة</button></div></div>`;
  }
  /* جزء من viewSettings: `<div class="card" id="wsCard"><h3>دورة مباشرة عمل موظف</h3>… */
  function settingsValue8(opts, wsf, wsvRow) {
    return `<div class="card" id="wsCard"><h3>دورة مباشرة عمل موظف</h3>
        <p class="muted" style="margin-top:0">محاسب الفرع يرفع المباشرة ← شئون الموظفين تعتمدها. والمدير الإداري يرى كل المباشرات للعلم (في الموارد البشرية ← مباشرات العمل) ويصله إشعار عند رفعها واعتمادها.</p>
        <div class="grid2" style="grid-template-columns:repeat(2,1fr);max-width:820px">
          <div class="field"><label>شئون الموظفين (تعتمد المباشرة)</label><select class="in" id="wsHr">${opts(wsf.hr)}</select></div>
          <div class="field"><label>المدير الإداري (يرى المباشرات للعلم)</label><div id="wsViewers">${settingsValue(wsf).map(wsvRow).join('')}</div><button type="button" class="btn sm" id="wsAdd">+ إضافة</button></div>
        </div><div class="wserr"></div>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="wsSave">💾 حفظ</button></div></div>`;
  }
  /* جزء من viewSettings: `<div class="card" id="maintCard"><h3>دورة طلب صيانة مركبة</… */
  function settingsValue7(mf, opts) {
    return `<div class="card" id="maintCard"><h3>دورة طلب صيانة مركبة</h3>
        <p class="muted" style="margin-top:0">محاسب الفرع يرفع الطلب ويختار جهة الصيانة ← مسئول الورشة يشخّص ويقدّر التكلفة ← مسار اعتماد "طلب صيانة مركبة" في قائمة المسارات أدناه (افتراضياً: مدير الفرع ← مدير الحركة) ← نفس الورشة تنفّذ وتسجّل التكلفة الفعلية.</p>
        <h4 class="b-sec" style="margin:10px 0 6px">الورش ومسؤولوها</h4>
        <div id="mfRows"></div>
        <button type="button" class="btn sm" id="mfAdd">+ إضافة ورشة</button>
        <div class="field" style="margin-top:12px;max-width:420px"><label>مسئول الورشة الخارجية (يسجل تقدير وتنفيذ الورش الخارجية)</label><select class="in" id="mfExt">${opts(mf.external)}</select></div>
        <div class="merr"></div>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="mfSave">💾 حفظ إعدادات الصيانة</button></div></div>`;
  }
  /* جزء من viewSettings: `<div class="card" id="flowCard"><h3>دورة ملف التصفية</h3>… */
  function settingsValue6(fl, opts) {
    return `<div class="card" id="flowCard"><h3>دورة ملف التصفية</h3>
        <p class="muted" style="margin-top:0">محاسب الفرع يطلب البيانات ← شئون الموظفين تعتمدها وترجعها ← المحاسب يملأ الخصومات والعهد ومحضر السيارة ← إدارة الحركة تعتمد المحضر (إن وُجدت سيارة) ← المحاسب يوجّه الملف ← محاسب إدارة الرواتب يعدّ التصفية ← مسار اعتماد "طلب تصفية موظف" أدناه.</p>
        <div class="grid2" style="grid-template-columns:repeat(3,1fr)">
          <div class="field"><label>شئون الموظفين</label><select class="in" id="flHr">${opts(fl.hr)}</select></div>
          <div class="field"><label>إدارة الحركة</label><select class="in" id="flTr">${opts(fl.traffic)}</select></div>
          <div class="field"><label>محاسب إدارة الرواتب</label><select class="in" id="flWps">${opts(fl.wps)}</select></div>
        </div><div class="ferr"></div>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="flSave">💾 حفظ مسؤولي الدورة</button></div></div>`;
  }
  /* جزء من viewSettings: `<div class="card" id="legalCard"><h3>دورة خصم الشئون القانو… */
  function settingsValue5(lf, opts) {
    return `<div class="card" id="legalCard"><h3>دورة خصم الشئون القانونية</h3>
        <p class="muted" style="margin-top:0">الشئون القانونية ترفع نتيجة التحقيق ← المدير الإداري ← مدير قسم الرواتب وحماية الأجور (طريقة التطبيق) ← المدير المالي ← محاسب إدارة الرواتب (قيمة الخصم) ← إبلاغ محاسب فرع الموظف.</p>
        <div class="grid2" style="grid-template-columns:repeat(3,1fr)">
          <div class="field"><label>الشئون القانونية (ترفع الطلب)</label><select class="in" id="lfLegal">${opts(lf.legal)}</select></div>
          <div class="field"><label>المدير الإداري</label><select class="in" id="lfAdmin">${opts(lf.adminMgr)}</select></div>
          <div class="field"><label>مدير قسم الرواتب وحماية الأجور</label><select class="in" id="lfMgr">${opts(lf.mgr)}</select></div>
          <div class="field"><label>المدير المالي</label><select class="in" id="lfFin">${opts(lf.fin)}</select></div>
          <div class="field"><label>محاسب إدارة الرواتب</label><select class="in" id="lfWps">${opts(lf.wps)}</select></div>
        </div><div class="lerr"></div>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="lfSave">💾 حفظ مسؤولي الدورة</button></div></div>`;
  }
  /* جزء من viewSettings: `<div class="card" id="opsCard"><h3>فرق إدارة العمليات</h3>… */
  function settingsValue4(teamBox) {
    return `<div class="card" id="opsCard"><h3>فرق إدارة العمليات</h3>
        <p class="muted" style="margin-top:0">من يدير كل قسم. مدير النظام له كل الصلاحيات دائماً.</p>
        <div class="grid2" style="grid-template-columns:repeat(2,1fr)">
          ${teamBox('inventory', 'مسؤولو الجرد', 'يضيفون ويعدّلون وينقلون بنود جرد كل الفروع. محاسب الفرع يرى جرد فرعه ويطبعه.')}
          ${teamBox('drilling', 'فريق قسم الحفر', 'يسجلون الحفارات ويعدّلونها ويصلهم تنبيه انتهاء TUV (ومعهم مدير الحركة).')}
          ${teamBox('store', 'مسؤولو مخازن الورش', 'يصدرون أوامر التصنيع وأذونات الصرف والخردة لكل الورش. ومسئول كل ورشة في دورة الصيانة يدير مخزن ورشته.')}
          ${teamBox('hr', 'مسؤولو سجل الموظفين', 'يضيفون الموظفين ويعدّلون بياناتهم وصورهم ويرفعونهم من Excel (ومعهم شئون الموظفين في دورة قرار النقل). محاسب الفرع يرى موظفي فرعه.')}
          ${teamBox('train', 'مسؤولو مركز التدريب', 'ينشئون الدورات ومواعيدها ويرفعون المادة التدريبية ويسجلون الحضور والدرجات ويصدرون الشهادات.')}
          ${teamBox('know', 'مسؤولو مكتبة المهن', 'يضيفون المهن ومحتوى مكتبة كل مهنة (شروحات، إجراءات، مراجع، فيديوهات، ملفات)، ويصل أصحاب المهنة إشعار بكل جديد.')}
          ${teamBox('gov', 'فريق الحوكمة والامتثال والتدقيق الداخلي', 'يديرون سجل المخاطر وتفويض الصلاحيات والتدقيق الداخلي والسياسات، ويطلعون على إقرارات تعارض المصالح والبلاغات السرية.')}
          ${teamBox('hse', 'مسؤولو السلامة والصحة المهنية', 'يرون كل بلاغات الحوادث وملاحظات وتصاريح وفحوصات السلامة لكل الفروع، ويحققون ويغلقون، ويصلهم إشعار كل بلاغ.')}
          ${teamBox('devMaint', 'مسؤولو صيانة الأجهزة', 'يصلهم طلب صيانة الجهاز بعد اعتماد مسئول الجرد، فيحددون العطل والإجراء ويتراسلون مع محاسب الفرع ثم يقفلون الطلب (يصل لأول مسئول فعّال).')}
        </div><div class="oerr"></div>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="otSave">💾 حفظ الفرق</button></div></div>`;
  }
  /* جزء من viewSettings: `<div class="card" id="hireCard"><h3>دورة نموذج التوظيف</h3>… */
  function settingsValue3(hf, opts) {
    return `<div class="card" id="hireCard"><h3>دورة نموذج التوظيف</h3>
        <p class="muted" style="margin-top:0">أحد مسؤولي التوظيف يرسل بيانات المرشح والتعاقد ويختار عضو اللجنة الفنية المختص ← عضو اللجنة الفنية المختار (التقييم الفني) ← مدير قسم الرواتب (العرض المالي) ← رئيس لجنة التوظيف (القرار النهائي).</p>
        <div class="grid2" style="grid-template-columns:repeat(3,1fr)">
          <div class="field"><label>مدير قسم الرواتب</label><select class="in" id="hfPay">${opts(hf.payroll)}</select></div>
          <div class="field"><label>رئيس لجنة التوظيف</label><select class="in" id="hfHead">${opts(hf.head)}</select></div>
        </div>
        <h4 class="b-sec" style="margin:14px 0 6px">مسؤولو التوظيف (يرسلون الطلب)</h4>
        <div class="hint" style="margin-bottom:8px">أي واحد منهم يرسل الطلب، ثم يذهب مباشرة لعضو اللجنة الفنية الذي يختاره.</div>
        <div id="hfRecRows"></div>
        <button type="button" class="btn sm" id="hfRecAdd">+ إضافة مسئول توظيف</button>
        <h4 class="b-sec" style="margin:14px 0 6px">أعضاء اللجنة الفنية</h4>
        <div class="hint" style="margin-bottom:8px">عضو لكل تخصص (مالي، هندسي، جيولوجي...). مرسل الطلب يختار العضو المختص بالوظيفة، فيصل الطلب إليه وحده.</div>
        <div id="hfTechRows"></div>
        <button type="button" class="btn sm" id="hfTechAdd">+ إضافة عضو</button>
        <div class="herr"></div>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="hfSave">💾 حفظ مسؤولي الدورة</button></div></div>`;
  }
  /* جزء من viewSettings: (mf.workshops || []).length ? mf.workshops : [{}]… */
  function settingsValue2(mf) {
    return (mf.workshops || []).length ? mf.workshops : [{}];
  }
  /* جزء من viewSettings: (wsf.viewers || []).length ? wsf.viewers : ['']… */
  function settingsValue(wsf) {
    return (wsf.viewers || []).length ? wsf.viewers : [''];
  }
  /* saveSettings من viewSettings */
  async function settingsSaveSettings(patch, msg) {
    const s = await api('PUT', '/api/admin/settings', patch);
    applyConfig({
      ...state.config,
      googleMapsKey: s.googleMapsKey || '',
      groupCompanies: s.groupCompanies || [],
      companyName: s.companyName || s.orgName,
      appName: s.appName,
      orgName: s.orgName,
      letterTopMargin: s.letterTopMargin,
      letterhead: s.letterhead !== false,
      branches: s.branches,
      disabledForms: s.disabledForms,
      maxUploadMb: s.maxUploadMb,
      overdueDays: s.overdueDays,
      roles: s.roles,
      customForms: s.customForms,
      formOverrides: s.formOverrides,
      weekend: s.weekend,
      holidays: s.holidays,
      theme: s.theme,
    });
    toast(msg || 'تم حفظ الإعدادات');
    return s;
  }
  /* جزء من viewSettings: if (tab === 'email') {… */
  async function viewSettingsPart2(body, saveSettings, settings, tab) {
    if (tab === 'email') {
      settingsEmail(body, settings, saveSettings);
      if (isAdmin()) otpCard(body, settings);
    }
    if (tab === 'backup') await settingsBackup(body);
  }
  /* جزء من viewSettings: if (tab === 'general') settingsGeneral(body, setti… */
  async function viewSettingsPart(body, saveSettings, settings, tab, users, sub) {
    if (tab === 'general') settingsGeneral(body, settings, saveSettings);
    if (tab === 'orgdiv') settingsOrgDiv(body);
    if (tab === 'users') settingsUsers(body, users, settings, saveSettings);
    if (tab === 'roles') await settingsRoles(body, settings, users, saveSettings, sub);
    if (tab === 'calendar') settingsCalendar(body, settings, saveSettings);
    if (tab === 'countries') await settingsCountries(body);
  }

  /* إعدادات الإشعارات: إبلاغ شخص بمرحلة معينة أو بالاعتماد النهائي، وإبلاغ كل أطراف المسار بكل مرحلة */
  function notifyCard(settings, users, saveSettings) {
    const rules = (settings.notifyRules || []).map((x) => ({ ...x }));
    const steps = [
      ...new Set(
        [
          ...(settings.routes || []).flatMap((rt) => (rt.steps || []).map((s) => s.label)),
          'مدير الفرع',
          'شئون الموظفين',
          'إدارة الحركة',
          'محاسب إدارة الرواتب',
          'المدير الإداري',
          'مدير قسم الرواتب وحماية الأجور',
          'المدير المالي',
        ].filter(Boolean),
      ),
    ];
    const WHEN = [
      ['final', 'عند الاعتماد النهائي'],
      ['step', 'بعد اعتماد مرحلة'],
      ['submit', 'عند رفع الطلب'],
    ];
    const userOpts = (sel) =>
      `<option value="">— اختر الشخص —</option>${users
        .filter((u) => u.active)
        .map(
          (u) => `<option value="${u.id}"${sel === u.id ? ' selected' : ''}>${esc(u.name)}${u.title ? ` — ${esc(u.title)}` : ''}</option>`,
        )
        .join('')}`;
    const formOpts = (sel) =>
      `<option value="">كل الخطابات والطلبات</option>${SF.FORMS.map((f) => `<option value="${f.id}"${sel === f.id ? ' selected' : ''}>${esc(f.title)}</option>`).join('')}`;
    $('#legalCard').insertAdjacentHTML(
      'afterend',
      `<div class="card" id="notifyCard"><h3>🔔 إعدادات الإشعارات</h3>
      <label class="check" style="margin-bottom:10px"><input type="checkbox" id="nAll"${settings.notifyAllSteps ? ' checked' : ''}> إشعار بكل مرحلة موافقة لجميع أطراف مسار الاعتماد ومنشئ الطلب</label>
      <p class="muted" style="margin:0 0 8px">إشعارات إضافية لأشخاص محددين (محاسب إدارة الرواتب يصله الاعتماد النهائي لكل الطلبات دائماً):</p>
      <datalist id="dl-steps">${steps.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
      <div id="nRules"></div>
      <div class="row" style="margin-top:10px"><button type="button" class="btn" id="nAdd">➕ إضافة إشعار</button><button type="button" class="btn primary" id="nSave">💾 حفظ إعدادات الإشعارات</button></div>
      <div class="nerr"></div></div>`,
    );
    const draw = () => {
      $('#nRules').innerHTML = rules.length
        ? rules
            .map(
              (x, i) => `<div class="row" style="gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <select class="in" data-n="userId" data-i="${i}" style="flex:2;min-width:180px">${userOpts(x.userId)}</select>
          <select class="in" data-n="form" data-i="${i}" style="flex:2;min-width:180px">${formOpts(x.form)}</select>
          <select class="in" data-n="when" data-i="${i}" style="flex:1;min-width:150px">${WHEN.map(([k, l]) => `<option value="${k}"${x.when === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
          <input class="in" data-n="step" data-i="${i}" list="dl-steps" placeholder="اسم المرحلة (مثل: المدير المالي)" value="${esc(x.step || '')}" style="flex:2;min-width:180px"${x.when === 'step' ? '' : ' hidden'}>
          <button type="button" class="btn sm ghost" data-ndel="${i}" title="حذف">🗑</button></div>`,
            )
            .join('')
        : '<div class="muted">لا توجد إشعارات إضافية</div>';
      $$('[data-n]', $('#nRules')).forEach((el) => {
        el.onchange = () => {
          rules[el.dataset.i][el.dataset.n] = el.value;
          if (el.dataset.n === 'when') draw();
        };
      });
      $$('[data-ndel]', $('#nRules')).forEach((b) => {
        b.onclick = () => {
          rules.splice(Number(b.dataset.ndel), 1);
          draw();
        };
      });
    };
    draw();
    return wireNotifyCard(draw, rules, saveSettings);
  }
  /* أحداث notifyCard: #nAdd، #nSave */
  function wireNotifyCard(draw, rules, saveSettings) {
    $('#nAdd').onclick = () => {
      rules.push({ userId: '', form: '', when: 'final', step: '' });
      draw();
    };
    $('#nSave').onclick = async () => {
      $$('[data-n="step"]', $('#nRules')).forEach((el) => {
        rules[el.dataset.i].step = el.value.trim();
      });
      if (rules.some((x) => !x.userId)) {
        $('.nerr', $('#notifyCard')).innerHTML = '<div class="err">اختر الشخص في كل إشعار أو احذف السطر</div>';
        return;
      }
      if (rules.some((x) => x.when === 'step' && !x.step)) {
        $('.nerr', $('#notifyCard')).innerHTML = '<div class="err">اكتب اسم المرحلة في إشعارات "بعد اعتماد مرحلة"</div>';
        return;
      }
      try {
        await saveSettings({ notifyRules: rules, notifyAllSteps: $('#nAll').checked }, 'تم حفظ إعدادات الإشعارات');
        $('.nerr', $('#notifyCard')).innerHTML = '';
      } catch (err) {
        $('.nerr', $('#notifyCard')).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  function settingsGeneral(body, s, saveSettings) {
    body.innerHTML = `<form class="card" id="gf"><div class="grid2 gs-wide">
      <div class="field"><label>اسم النظام</label><input class="in" name="appName" value="${esc(s.appName)}"></div>
      <div class="field"><label>اسم الشركة الرسمي في المستندات</label><input class="in" name="companyName" value="${esc(s.companyName || '')}"><div class="hint">يكتبه النظام في المخالصة (استلمت من شركة...) وفي برنامج التصفية</div></div>
      <div class="field"><label>شركات المجموعة (سطر لكل شركة)</label><textarea class="in" name="groupCompanies" rows="4" placeholder="سادن المتوسطة&#10;أرابور&#10;بحر الشهد">${esc((s.groupCompanies || []).join('\n'))}</textarea><div class="hint">تظهر كاختيارات في "يستلم من" بالمخالصة. الموظف على كفالة خارجية يستلم من اسم الشركة الرسمي أعلاه.</div></div>
      <div class="field"><label>اسم الشركة / المجموعة</label><input class="in" name="orgName" value="${esc(s.orgName)}"></div>
      <div class="field full"><label class="row" style="gap:8px;cursor:pointer"><input type="checkbox" name="letterhead"${s.letterhead !== false ? ' checked' : ''}> طباعة ترويسة الشركة أعلى الخطابات</label><div class="hint">تظهر الترويسة (الشعار واسم الشركة بالعربي والإنجليزي) أعلى كل الخطابات ما عدا التصفية. ألغِ التحديد إذا كنت تطبع على ورق رسمي مطبوع الترويسة.</div></div>
      <div class="field"><label>الهامش العلوي للخطاب (مم)</label><input class="in" type="number" min="5" max="80" name="letterTopMargin" value="${esc(s.letterTopMargin)}"><div class="hint">المسافة المتروكة لترويسة الورق الرسمي عند الطباعة</div></div>
      <div class="field full serial-box"><label>ألوان النظام</label>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin:8px 0">${THEMES.map(([n, b, sd]) => `<button type="button" class="theme-chip" data-tb="${b}" data-ts="${sd}" title="${esc(n)}"><i style="background:${sd}"></i><i style="background:${b}"></i>${esc(n)}</button>`).join('')}</div>
        <div class="grid2">
          <div class="field"><label>اللون الأساسي (الأزرار والعنصر المختار)</label><div class="row" style="gap:8px"><input type="color" name="tBrand" value="${esc(settingsGeneralValue3(s))}"><input class="in" name="tBrandHex" dir="ltr" value="${esc(settingsGeneralValue4(s))}" style="max-width:120px"></div></div>
          <div class="field"><label>لون القائمة الجانبية</label><div class="row" style="gap:8px"><input type="color" name="tSide" value="${esc(settingsGeneralValue5(s))}"><input class="in" name="tSideHex" dir="ltr" value="${esc(settingsGeneralValue6(s))}" style="max-width:120px"></div></div>
        </div>
        <div class="hint" id="tHint">تظهر الألوان على الصفحة فوراً للمعاينة، وتُطبَّق على الجميع بعد الحفظ. ألوان الخطاب المطبوع لا تتغير.</div>
      </div>
      <div class="field full serial-box"><label>سياسة كلمات المرور</label>
        <div class="grid2" style="margin-top:6px">
          <div class="field"><label>أقل عدد أحرف</label><input class="in" type="number" min="8" max="32" name="pMin" value="${esc(settingsGeneralValue7(s))}"></div>
          <div class="field"><label>تغييرها إجبارياً كل (يوم)</label><input class="in" type="number" min="0" max="3650" name="pExpire" value="${esc(settingsGeneralValue8(s))}"><div class="hint">0 = بدون انتهاء</div></div>
          <div class="field"><label>محاولات الدخول الخاطئة قبل الإيقاف</label><input class="in" type="number" min="3" max="50" name="pAttempts" value="${esc(settingsGeneralValue9(s))}"></div>
          <div class="field"><label>مدة الإيقاف (دقيقة)</label><input class="in" type="number" min="1" max="1440" name="pLock" value="${esc(settingsGeneralValue10(s))}"></div>
        </div>
      </div>
      <div class="field full serial-box"><label>ترقيم الطلبات</label>
        <div class="grid2" style="margin-top:6px">
          <div class="field"><label>البادئة (اختياري)</label><input class="in" name="sPrefix" dir="ltr" value="${esc((s.serial || {}).prefix || '')}" placeholder="SADEN"></div>
          <div class="field"><label>الفاصل</label><select class="in" name="sSep">${[
            ['-', 'شرطة -'],
            ['/', 'شرطة مائلة /'],
            ['', 'بدون فاصل'],
          ]
            .map(([v, l]) => `<option value="${v}"${((s.serial || {}).sep ?? '-') === v ? ' selected' : ''}>${l}</option>`)
            .join('')}</select></div>
          <div class="field"><label>عدد خانات الرقم</label><select class="in" name="sDigits">${[3, 4, 5, 6].map((n) => `<option${((s.serial || {}).digits || 4) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field"><label>الرقم التالي (اختياري)</label><input class="in" name="sNext" type="number" min="1" placeholder="اتركه فارغاً للاستمرار"></div>
        </div>
        <label class="check"><input type="checkbox" name="sYearly"${(s.serial || {}).yearly === false ? '' : ' checked'}> إضافة السنة للرقم وبدء الترقيم من 1 كل سنة</label>
        <div class="hint">مثال لشكل الرقم: <b dir="ltr" id="sPreview"></b> — الطلبات السابقة تحتفظ بأرقامها.</div>
      </div>
      <div class="field"><label>اعتبار الطلب متأخراً بعد (يوم)</label><input class="in" type="number" min="1" max="30" name="overdueDays" value="${esc(s.overdueDays || 2)}"><div class="hint">يظهر الطلب باللون الأحمر ويُنبَّه المعتمد إذا بقي عنده أكثر من هذه المدة</div></div>
      <div class="field"><label>رابط النظام (لرمز QR في الخطاب)</label><input class="in" name="publicUrl" dir="ltr" value="${esc(s.publicUrl || '')}" placeholder="http://192.168.100.30:3000"><div class="hint">الرابط الذي يفتحه الموظفون. إذا تركته فارغاً يستخدم النظام الرابط الذي فتحتها منه عند الطباعة</div></div>
      <div class="field" style="grid-column:1/-1"><label>إعلان شاشة الدخول (يظهر لكل المستخدمين قبل الدخول)</label>
        <div class="ln-set"><textarea class="in" name="lnText" rows="2" maxlength="300" placeholder="مثال: صيانة مجدولة يوم الخميس من 10 إلى 12 ظهراً">${esc((s.loginNotice || {}).text || '')}</textarea>
        <select class="in" name="lnType">${settingsGeneralHtml(s)}</select>
        <label class="ln-until"><span>يختفي بعد</span><input class="in" type="date" name="lnUntil" value="${esc((s.loginNotice || {}).until || '')}"></label></div>
        <div class="hint">اترك النص فارغاً لإخفاء الإعلان. تاريخ الانتهاء اختياري: يختفي الإعلان تلقائياً بعده.</div></div>
      <div class="field" style="grid-column:1/-1"><label>ثيمات المناسبات (تتغير تلقائياً في النظام وتطبيق الجوال)</label>
        <label class="check"><input type="checkbox" name="occOn"${(s.occasionThemes || {}).enabled === false ? '' : ' checked'}> تفعيل ثيمات المناسبات</label>
        <div class="occ-opt" style="margin:4px 0 8px"><label class="check"><input type="checkbox" name="occMe"${(s.occasionThemes || {}).personal === false ? '' : ' checked'}> 🎂 تهنئة الموظف بعيد ميلاده وذكرى انضمامه (تظهر له وحده)</label><span class="row" style="gap:6px"><a href="/?occ=birthday#/apps" target="_blank" rel="noopener" class="btn sm ghost">معاينة الميلاد</a><a href="/?occ=anniversary#/apps" target="_blank" rel="noopener" class="btn sm ghost">معاينة الانضمام</a></span></div>
        <div class="occ-set">${Object.entries(OCC)
          .map(
            ([k, o]) =>
              `<div class="occ-opt"><label class="check"><input type="checkbox" name="occ_${k}"${((s.occasionThemes || {}).off || []).includes(k) ? '' : ' checked'}> ${o.icon} ${o.name}</label><a href="/?occ=${k}#/login" target="_blank" rel="noopener" class="btn sm ghost">معاينة</a></div>`,
          )
          .join('')}</div>
        <div class="co-head"><b>مناسبات مخصصة</b><button type="button" class="btn sm" id="coAdd">＋ إضافة مناسبة</button></div>
        <div id="coList" class="co-list"></div>
        <div class="hint">المواعيد: اليوم الوطني 21–25 سبتمبر، يوم التأسيس 20–24 فبراير، يوم العلم 11 مارس، رمضان كاملاً، عيد الفطر 1–4 شوال، عيد الأضحى 9–13 ذو الحجة (يوم عرفة ثم العيد)، رأس السنة الهجرية 1–3 محرم — حسب تقويم أم القرى. المعاينة تفتح في تبويب جديد (شاشة الدخول تظهر عند تسجيل الخروج أو في نافذة خاصة).</div></div>
      <div class="field" style="grid-column:1/-1"><label>أسماء المستندات في «وثائق ومستندات» — اسم في كل سطر</label>
        <div class="grid2"><label class="field"><small class="muted">مستندات الشركة</small><textarea class="in" name="dtCo" rows="8">${esc(settingsGeneralValue(s).join('\n'))}</textarea></label>
          <label class="field"><small class="muted">وثائق الفروع</small><textarea class="in" name="dtBr" rows="8">${esc(settingsGeneralValue2(s).join('\n'))}</textarea></label></div>
        <div class="hint">تظهر كأصناف مطلوبة لكل شركة / فرع (وينبّه النظام على الناقص منها). شهادة الالتزام بحماية الأجور واشتراك مدد في «الرواتب ← مدد وحماية الأجور».</div></div>
      <div class="field" style="grid-column:1/-1"><label>مفتاح خرائط جوجل (Google Maps API Key) — لخريطة الفروع</label><input class="in" name="gmKey" dir="ltr" value="${esc(s.googleMapsKey || '')}" placeholder="AIza...">
        <div class="hint">من Google Cloud: فعّل «Map Tiles API» وأنشئ مفتاحاً مقيداً بنطاق النظام (HTTP referrers). بدون مفتاح يستخدم النظام الخرائط الحالية (OpenStreetMap / Esri).</div></div>
      <div class="field" style="grid-column:1/-1"><label>روابط تطبيق الجوال في المتاجر (تظهر كأزرار في شاشة الدخول)</label>
        <div class="ln-set" style="grid-template-columns:1fr 1fr"><input class="in" name="alPlay" dir="ltr" value="${esc((s.appLinks || {}).play || '')}" placeholder="Google Play: https://play.google.com/store/apps/details?id=..."><input class="in" name="alIos" dir="ltr" value="${esc((s.appLinks || {}).ios || '')}" placeholder="App Store: https://apps.apple.com/app/..."></div>
        <div class="hint">بدون رابط Google Play يحمّل الزر ملف أندرويد المرفوع على النظام مباشرة، وبدون رابط App Store يظهر الزر «قريباً».</div></div>
      <div class="field" style="grid-column:1/-1"><label>حسابات التواصل الاجتماعي (تظهر أيقوناتها في شاشة الدخول)</label>
        <div class="soc-set">${settingsGeneralHtml2(s)}</div>
        <div class="hint">رابط في كل سطر، ويمكن كتابة اسم قبله: <b dir="ltr">سادن | https://...</b> (يظهر عند الوقوف على الأيقونة). اترك الحقل فارغاً لإخفاء أيقونته. الواتساب: الرقم بالصيغة الدولية بدون + (مثل 966500000000). روابط المجموعة في group.json تظهر في شاشة الدخول أيضاً.</div></div>
      <div class="field"><label>مدة بقاء الجلسة (ساعة)</label><input class="in" type="number" min="1" max="72" name="sessionHours" value="${esc(s.sessionHours)}"><div class="hint">يطلب النظام الدخول مجدداً بعد عدم الاستخدام لهذه المدة</div></div>
      <div class="field"><label class="check"><input type="checkbox" name="posLoginOff"${s.posLoginOff ? ' checked' : ''}> إيقاف الدخول المباشر لحسابات المناصب التي لها شاغل</label><div class="hint">بعد التفعيل يدخل الكل برقم الهوية فقط، ويعمل شاغل المنصب بصفته من حسابه الشخصي. اتركه غير مفعل في الفترة الانتقالية.</div></div>
      <div class="field"><label class="check"><input type="checkbox" name="singleSession"${s.singleSession !== false ? ' checked' : ''}> ربط كل حساب بجوال واحد (تطبيق SES)</label><div class="hint">يربط النظام بحساب الموظف أول جوال يدخل منه، وترفض الدخول من جوال آخر حتى تلغي الربط من بيانات المستخدم. الكمبيوتر غير مربوط: يفتح الموظف حسابه على الكمبيوتر والجوال معاً.</div></div>
      <div class="field"><label>الحد الأقصى لحجم المرفق (ميجابايت — حتى 1024 = 1 جيجا)</label><input class="in" type="number" min="1" max="1024" name="maxUploadMb" value="${esc(s.maxUploadMb)}"></div>
      </div><div class="gerr"></div><div class="row" style="margin-top:16px"><button class="btn primary">حفظ</button></div></form>`;
    /* المناسبات المخصصة: صف لكل مناسبة (الاسم، الفترة، كل سنة، الأيقونة، العنوان، التهنئة، الألوان، الزينة) */
    return settingsGeneralPart2(body, s, saveSettings);
  }
  /* جزء من settingsGeneral: SOCIAL.map(… */
  function settingsGeneralHtml2(s) {
    return SOCIAL.map(
      ([k, l, ph]) =>
        `<label class="soc-in"><span class="soc-ic" style="--sc:${SOCIAL_CLR[k]}">${socIcon(k)}</span><span>${l}</span><textarea class="in" name="so_${k}" dir="ltr" rows="2" placeholder="${ph}">${esc(
          socList((s.social || {})[k])
            .map((x) => (x.label ? `${x.label} | ${x.url}` : x.url))
            .join('\n'),
        )}</textarea></label>`,
    ).join('');
  }
  /* جزء من settingsGeneral: [… */
  function settingsGeneralHtml(s) {
    return [
      ['info', 'ℹ️ معلومة'],
      ['warn', '⚠️ تنبيه'],
      ['bad', '⛔ مهم جداً'],
      ['ok', '✅ خبر سار'],
    ]
      .map(([v, l]) => `<option value="${v}"${((s.loginNotice || {}).type || 'info') === v ? ' selected' : ''}>${l}</option>`)
      .join('');
  }
  /* جزء من settingsGeneral: (s.passwordPolicy || {}).lockMinutes || 5… */
  function settingsGeneralValue10(s) {
    return (s.passwordPolicy || {}).lockMinutes || 5;
  }
  /* جزء من settingsGeneral: (s.passwordPolicy || {}).maxAttempts || 5… */
  function settingsGeneralValue9(s) {
    return (s.passwordPolicy || {}).maxAttempts || 5;
  }
  /* جزء من settingsGeneral: (s.passwordPolicy || {}).expireDays || 0… */
  function settingsGeneralValue8(s) {
    return (s.passwordPolicy || {}).expireDays || 0;
  }
  /* جزء من settingsGeneral: أقل عدد أحرف لكلمة المرور — يُعرض المطبَّق فعلاً (لا يقل عن 8 مهما كان المحفوظ) */
  function settingsGeneralValue7(s) {
    return Math.max(8, (s.passwordPolicy || {}).minLength || 10);
  }
  /* جزء من settingsGeneral: (s.theme || {}).side || '#1e293b'… */
  function settingsGeneralValue6(s) {
    return (s.theme || {}).side || '#1e293b';
  }
  /* جزء من settingsGeneral: (s.theme || {}).side || '#1e293b'… */
  function settingsGeneralValue5(s) {
    return (s.theme || {}).side || '#1e293b';
  }
  /* جزء من settingsGeneral: (s.theme || {}).brand || '#9b1c1c'… */
  function settingsGeneralValue4(s) {
    return (s.theme || {}).brand || '#9b1c1c';
  }
  /* أحداث settingsGeneral: #gf */
  function wireGf(body, coRead, saveSettings) {
    $('#gf').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const patch = Object.fromEntries(
          [
            'appName',
            'orgName',
            'companyName',
            'groupCompanies',
            'letterTopMargin',
            'sessionHours',
            'maxUploadMb',
            'overdueDays',
            'publicUrl',
          ].map((k) => [k, fd.get(k)]),
        );
        patch.occasionThemes = {
          enabled: !!fd.get('occOn'),
          personal: !!fd.get('occMe'),
          off: Object.keys(OCC).filter((k) => !fd.get(`occ_${k}`)),
        };
        patch.customOccasions = coRead();
        patch.appLinks = { play: String(fd.get('alPlay') || '').trim(), ios: String(fd.get('alIos') || '').trim() };
        patch.googleMapsKey = String(fd.get('gmKey') || '').trim();
        patch.docTypes = {
          company: String(fd.get('dtCo') || '')
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean),
          branch: String(fd.get('dtBr') || '')
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean),
        };
        patch.loginNotice = { text: String(fd.get('lnText') || '').trim(), type: fd.get('lnType'), until: fd.get('lnUntil') || '' };
        patch.social = Object.fromEntries(SOCIAL.map(([k]) => [k, String(fd.get(`so_${k}`) || '').trim()]));
        patch.singleSession = !!fd.get('singleSession');
        patch.posLoginOff = !!fd.get('posLoginOff');
        patch.letterhead = !!fd.get('letterhead');
        patch.serial = {
          prefix: fd.get('sPrefix'),
          sep: fd.get('sSep'),
          digits: Number(fd.get('sDigits')),
          yearly: !!fd.get('sYearly'),
          next: fd.get('sNext'),
        };
        patch.theme = { brand: fd.get('tBrandHex'), side: fd.get('tSideHex') };
        patch.passwordPolicy = {
          minLength: Number(fd.get('pMin')),
          expireDays: Number(fd.get('pExpire')),
          maxAttempts: Number(fd.get('pAttempts')),
          lockMinutes: Number(fd.get('pLock')),
        };
        await saveSettings(patch);
        viewSettings('general');
      } catch (err) {
        $('.gerr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  function settingsUsers(body, users, settings, saveSettings) {
    const usedIn = (id) => settings.routes.filter((r) => r.steps.some((s) => s.userId === id)).length;
    const roleName = (u) => ((state.config.roles || []).find((r) => r.id === u.roleId) || {}).name || u.roleLabel || '';
    let view = 'cards',
      q = '';
    try {
      view = localStorage.getItem('users:view2') || 'cards';
    } catch {
      /* افتراضي */
    }
    /* ترتيب داخل المجموعة: مدير الفرع ثم المحاسب ثم الباقي، والموقوف في الآخر */
    const rank = (u) => (!u.active ? 9 : u.branchManager ? 0 : u.role === 'accountant' ? 1 : 2);
    const sortU = (xs) => xs.slice().sort((x, y) => rank(x) - rank(y) || x.name.localeCompare(y.name, 'ar'));
    const row = (u) =>
      `<tr class="u-row${u.active ? '' : ' u-off'}" data-uid="${u.id}" title="فتح صفحة المستخدم"><td><b>${esc(u.name)}</b>${u.branchManager ? ' <span class="u-tag mgr">مدير الفرع</span>' : ''}${u.opsOnly ? ' <span class="u-tag">إدارة العمليات فقط</span>' : ''}</td><td dir="ltr" style="text-align:right">${esc(u.username)}</td><td>${esc(u.roleLabel)}${u.role === 'approver' && u.viewAll ? ' <small class="muted">(يرى الكل)</small>' : ''}${u.role === 'approver' && u.dashboard ? ' <small class="muted">(لوحة المؤشرات)</small>' : ''}${Object.keys(u.pages || {}).length || Array.isArray(u.allowedForms) ? ' <small class="muted">(عرض مخصص)</small>' : ''}</td><td>${esc(u.title)}</td><td>${esc(u.branch)}</td><td class="num">${u.role === 'accountant' ? '—' : usedIn(u.id)}</td><td>${u.active ? '<span class="chip approved">نشط</span>' : '<span class="chip cancelled">موقوف</span>'}</td><td><button class="btn sm" data-edit="${u.id}">فتح</button></td></tr>`;
    const group = (title, xs, cls = '') =>
      xs.length
        ? `<tbody><tr class="cat-row ${cls}"><td colspan="8">${title} <small class="muted">(${xs.length})</small></td></tr>${sortU(xs).map(row).join('')}</tbody>`
        : '';
    const section = (title, n) => `<tbody><tr class="sec-row"><td colspan="8">${title} <small>(${n})</small></td></tr></tbody>`;
    const draw = () => {
      const match = (u) => !q || `${u.name} ${u.username} ${u.title} ${u.branch} ${roleName(u)}`.toLowerCase().includes(q);
      $('#uTblWrap', body).hidden = view === 'cards';
      $('#uCards', body).hidden = view !== 'cards';
      if (view === 'cards') categoryCards($('#uCards', body), users, settings.roles || [], match, !!q);
      else drawPart(body, group, match, section, users, view);
      $$('[data-uv]', body).forEach((x) => x.classList.toggle('on', x.dataset.uv === view));
      $$('[data-edit]', body).forEach((x) => {
        x.onclick = (e) => {
          e.stopPropagation();
          location.hash = `#/settings/users/${x.dataset.edit}`;
        };
      });
      $$('#uTbl tr[data-uid]', body).forEach((x) => {
        x.onclick = () => {
          location.hash = `#/settings/users/${x.dataset.uid}`;
        };
      });
    };
    body.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><div class="tabs" style="margin:0"><button class="tab" data-uv="cards">الفئات</button><button class="tab" data-uv="org">الفروع والإدارات</button></div>
          <input class="in" id="uQ" placeholder="بحث بالاسم أو اسم المستخدم أو الفرع..." style="width:260px"></div>
        <span class="row" style="gap:6px">${isAdmin() ? '<button class="btn" id="posLink" title="ربط حسابات المحاسبين والمعتمدين بشاغليها من سجل الموظفين بمطابقة الاسم">🔗 ربط المناصب بالموظفين</button>' : ''}<button class="btn primary" id="addU">➕ مستخدم جديد</button></span></div>
      <div class="muted" style="margin-bottom:10px">اضغط كارت الفئة لمستخدميها وصلاحياتها، واسم المستخدم لصفحته (وفيها فئته وتخصيص ما يظهر له وحده). عند إنشاء حساب أو إعادة تعيين كلمة المرور يطلب النظام من المستخدم تغييرها عند أول دخول.</div>
      <div class="cat-grid" id="uCards"></div>
      <div class="tbl-wrap" id="uTblWrap"><table class="tbl" id="uTbl"></table></div></div>`;
    wireSettingsUsers();
    $$('[data-uv]', body).forEach((x) => {
      x.onclick = () => {
        view = x.dataset.uv;
        try {
          localStorage.setItem('users:view2', view);
        } catch {
          /* تجاهل */
        }
        draw();
      };
    });
    $('#uQ', body).addEventListener('input', (e) => {
      q = e.target.value.trim().toLowerCase();
      draw();
    });
    draw();
  }
  /* أحداث settingsUsers: #addU، #posLink */
  function wireSettingsUsers() {
    $('#addU').onclick = () => {
      location.hash = '#/settings/users/new';
    };
    if ($('#posLink'))
      $('#posLink').onclick = async () => {
        if (
          !(await askYesNo(
            'ربط كل حساب محاسب ومعتمد بالموظف الذي يحمل نفس الاسم في سجل الموظفين (التطابق الوحيد فقط)؟ ينشئ النظام للموظف حسابه الشخصي برقم هويته إن لم يوجد، ويدخل بعدها بهويته ويعمل بصفة المنصب.',
          ))
        )
          return;
        try {
          const r = await api('POST', '/api/admin/positions/autolink', {});
          const bg = document.createElement('div');
          bg.className = 'modal-bg';
          bg.innerHTML = `<div class="modal" style="max-width:640px;width:95%"><h3 style="margin-top:0">🔗 نتيجة ربط المناصب</h3><p><b>ربطنا ${r.linked.length}</b> منصب بشاغليه.</p>
          ${r.unmatched.length ? `<p>لم نجد تطابقاً وحيداً لـ <b>${r.unmatched.length}</b> حساب — افتح كل حساب واختر شاغله يدوياً:</p><div class="tbl-wrap" style="max-height:45vh;overflow:auto"><table class="tbl"><thead><tr><th>الحساب</th><th>الفرع</th><th>السبب</th></tr></thead><tbody>${r.unmatched.map((x) => `<tr><td><a href="#/settings/users/${x.id}">${esc(x.name)}</a></td><td>${esc(x.branch)}</td><td class="muted">${x.matches ? `${x.matches} موظفين بنفس الاسم` : 'لا يوجد موظف بهذا الاسم'}</td></tr>`).join('')}</tbody></table></div>` : ''}
          <div class="row" style="margin-top:12px"><button class="btn" data-x>إغلاق</button></div></div>`;
          document.body.appendChild(bg);
          $('[data-x]', bg).onclick = () => {
            bg.remove();
            location.reload();
          };
        } catch (e) {
          toast(e.message, true);
        }
      };
  }

  function settingsHr(body, s, saveSettings, sub) {
    /* حالة الصفحة: ما يتغير بعد العرض (list، ctry) */
    const vs = {};
    const pg = HR_SETTINGS.find((x) => x.k === sub && x.page);
    if (pg) return pg.page(body, s, saveSettings);
    const sec = HR_SETTINGS.find((x) => x.k === sub && x.blocks);
    /* الصفحة الرئيسية: أيقونات الإعدادات */
    if (!sec) {
      return renderSettingsHr(body);
    }
    /* تعدد الدول: لكل دولة إصداراتها (السعودية / مصر / عُمان)، والدولة الافتراضية دولة الشركة */
    const geo = state.config.geo || { base: 'SA', branches: [] },
      BASE = SF.COUNTRY_INFO[geo.base] ? geo.base : 'SA';
    const CTRS = Object.keys(SF.COUNTRY_INFO);
    const brCount = (c) => (geo.branches || []).filter((b) => (b[1] || BASE) === c).length;
    const fresh = (c) => {
      const D = SF.HR_COUNTRY_DEFAULTS[c] || SF.HR_POLICY_DEFAULT;
      return { ...SF.HR_POLICY_DEFAULT, ...D, country: c, leaveTypes: D.leaveTypes.map((x) => ({ ...x })) };
    };
    settingsHrPart(BASE, CTRS, fresh, s, vs);
    const CI = () => SF.COUNTRY_INFO[vs.ctry];
    const EOS_L = {
      sa: 'نظام العمل السعودي — نصف شهر عن كل سنة من الخمس الأولى ثم شهر (على الأجر الشامل)',
      om: 'عُمان — أجر أساسي شهر عن كل سنة لغير العُمانيين (العُماني يغطيه صندوق الحماية)',
      none: 'لا مكافأة من المنشأة — يغطيها التأمين الاجتماعي (مصر)',
    };
    const num = (k, l, i, unit) =>
      `<div class="field"><label>${l}</label><div class="row" style="gap:6px;align-items:center"><input class="in" type="number" min="0" data-p="${i}" data-k="${k}" value="${esc(vs.list[i][k])}" style="max-width:110px">${unit ? `<small class="muted">${unit}</small>` : ''}</div></div>`;
    /* أجزاء السياسة: كل أيقونة تعرض أجزاءها فقط من كل إصدار */
    const BLOCKS = {
      annual: (
        p,
        i,
      ) => `<h4 class="b-sec">الإجازة السنوية وفترة التجربة</h4><div class="grid2" style="grid-template-columns:repeat(4,1fr)">${num('annualBase', 'الرصيد السنوي', i, 'يوم')}${num('annualAfter', 'الرصيد بعد سنوات الخدمة', i, 'يوم')}${num('afterYears', 'عدد سنوات الخدمة لزيادة الرصيد', i, 'سنة')}${num('probationDays', 'مدة فترة التجربة', i, 'يوم')}${num('probationMax', 'أقصى مدة للتجربة مع التمديد', i, 'يوم')}</div>
        <div class="field"><label>مكافأة نهاية الخدمة (التقديرية في المؤشرات)</label><select class="in" data-p="${i}" data-k="eosModel" style="max-width:560px">${Object.entries(
          EOS_L,
        )
          .map(([k, l]) => `<option value="${k}"${(p.eosModel || 'sa') === k ? ' selected' : ''}>${l}</option>`)
          .join('')}</select></div>`,
      hours: (p, i) =>
        `<h4 class="b-sec">ساعات العمل</h4><div class="grid2" style="grid-template-columns:repeat(4,1fr)">${num('hoursDay', 'يومياً', i, 'ساعة')}${num('hoursWeek', 'أسبوعياً', i, 'ساعة')}${num('ramadanDay', 'يومياً في رمضان (للمسلمين)', i, 'ساعة')}${num('ramadanWeek', 'أسبوعياً في رمضان', i, 'ساعة')}</div>`,
      shift: (p, i) =>
        `<h4 class="b-sec">الدوام والإضافي</h4><div class="grid2" style="grid-template-columns:repeat(4,1fr)"><div class="field"><label>بداية الدوام</label><input class="in" type="time" data-p="${i}" data-k="shiftStart" value="${esc(p.shiftStart || '08:00')}" style="max-width:130px"></div>${num('graceMin', 'سماح التأخير', i, 'دقيقة')}${num('otExtra', 'نسبة الإضافي من أجر الساعة الأساسي', i, '%')}<div class="field"><label>فترة رمضان (للساعات المخفضة)</label><div class="row" style="gap:6px"><input class="in" type="date" data-p="${i}" data-k="ramadanFrom" value="${esc(p.ramadanFrom || '')}"><input class="in" type="date" data-p="${i}" data-k="ramadanTo" value="${esc(p.ramadanTo || '')}"></div></div></div>`,
      gosi: (p, i) => {
        const c = SF.COUNTRY_INFO[p.country] || CI();
        return `<h4 class="b-sec">التأمينات الاجتماعية — ${esc(c.name)} (نسب % من الأجر الخاضع: الأساسي + السكن)</h4><div class="grid2" style="grid-template-columns:repeat(4,1fr)">${num('gosiSaudiEmp', `${c.citizen} — حصة الموظف`, i, '%')}${num('gosiSaudiEr', `${c.citizen} — حصة المنشأة`, i, '%')}${num('gosiNonSaudiEmp', `غير ${c.citizen} — حصة الموظف`, i, '%')}${num('gosiNonSaudiEr', `غير ${c.citizen} — حصة المنشأة`, i, '%')}${num('gosiMin', 'الحد الأدنى للأجر الخاضع', i, c.ccyAr)}${num('gosiMax', 'الحد الأعلى للأجر الخاضع', i, c.ccyAr)}</div>`;
      },
      types: (
        p,
        i,
      ) => `<h4 class="b-sec">أنواع الإجازات</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>النوع</th><th>الحد الأقصى (يوم)</th><th>تخصم من الرصيد</th><th>ملاحظة</th><th></th></tr></thead><tbody>
            ${p.leaveTypes.map((x, j) => `<tr><td><input class="in" data-lt="${i}:${j}" data-f="name" value="${esc(x.name)}"></td><td><input class="in" type="number" min="0" data-lt="${i}:${j}" data-f="max" value="${esc(x.max)}" placeholder="بدون حد" style="max-width:110px"></td><td><input type="checkbox" data-lt="${i}:${j}" data-f="balance"${x.balance ? ' checked' : ''}></td><td><input class="in" data-lt="${i}:${j}" data-f="note" value="${esc(x.note || '')}"></td><td><button class="btn sm ghost" data-ltdel="${i}:${j}">✕</button></td></tr>`).join('')}
          </tbody></table></div><button class="btn sm" data-ltadd="${i}" style="margin-top:8px">➕ نوع إجازة</button>`,
    };
    const draw = (...args) => settingsHrDraw(BASE, BLOCKS, CI, CTRS, body, brCount, draw, fresh, saveSettings, sec, vs, ...args);
    draw();
  }
  return {
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
  };
};
