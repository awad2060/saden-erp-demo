/* الاتصال بالخادم، والأيقونات، وتوقيع الموظف على الإقرار */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { $, state } = S;
  Object.assign(S, { api, toast, applyTheme, applyConfig });

  /* ---------- الاتصال بالخادم ---------- */
  async function api(method, url, body) {
    /* الخادم يقبل طلبات التعديل والحذف بصيغة JSON فقط (حماية من الطلبات المزوّرة)، فيُرسل جسم فارغ عند عدم وجوده */
    if (method !== 'GET' && body === undefined) body = {};
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* ليس JSON */
    }
    if (res.status === 401 && url !== '/api/login') {
      state.user = null;
      location.hash = '#/login';
      const msg = data && data.error && /جهاز آخر/.test(data.error) ? data.error : 'انتهت الجلسة، يرجى تسجيل الدخول';
      if (msg !== 'انتهت الجلسة، يرجى تسجيل الدخول') setTimeout(() => toast(msg, true), 400);
      throw new Error(msg);
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || 'حدث خطأ غير متوقع');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }
  function toast(msg, bad) {
    const t = document.createElement('div');
    t.textContent = msg;
    if (bad) t.className = 'bad';
    $('#toast').appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
  /* ألوان النظام من الإعدادات */
  function applyTheme(t) {
    const r = document.documentElement.style;
    r.setProperty('--brand', (t && t.brand) || '#9b1c1c');
    r.setProperty('--navy', (t && t.side) || '#1e293b');
  }
  const THEMES = [
    ['أحمر سادن (من الشعار)', '#b3122a', '#161a22'],
    ['الأحمر الداكن (الحالي)', '#9b1c1c', '#1e293b'],
    ['أسود وأحمر', '#c8102e', '#0b0b0c'],
    ['أزرق', '#1d4ed8', '#0f172a'],
    ['أخضر', '#047857', '#0f241c'],
    ['رمادي فحمي', '#374151', '#111827'],
  ];
  /* فحص تحديث النظام كل دقيقتين للتبويبات المفتوحة */
  setInterval(async () => {
    if (!state.user) return;
    try {
      applyConfig(await api('GET', '/api/config'));
    } catch {
      /* تجاهل */
    }
  }, 120000);
  function applyConfig(c) {
    state.config = c;
    state.configAt = c.roles ? Date.now() : 0; /* إعدادات ما قبل الدخول مختصرة (بلا المسميات): تُحمَّل كاملة مع أول صفحة بعده */
    try {
      S.applyOccasion();
    } catch {
      /* تجاهل */
    }
    /* تحديث النظام على السيرفر: التبويب المفتوح يعمل بالنسخة القديمة حتى يُعاد تحميله، فيظهر تنبيه بزر التحديث */
    if (!state.uiVersion) state.uiVersion = c.uiVersion;
    else if (c.uiVersion && c.uiVersion !== state.uiVersion && !document.querySelector('.upd-bar')) {
      const bar = document.createElement('div');
      bar.className = 'upd-bar';
      bar.innerHTML =
        '<span>🔄 تم تحديث النظام بإضافات جديدة — حمّل النسخة الجديدة</span><button type="button" class="btn sm primary">تحديث الآن</button>';
      bar.querySelector('button').onclick = () => location.reload();
      document.body.appendChild(bar);
    }
    SF.setCustomForms(c.customForms || [], c.formOverrides || {});
    SF.setLetterhead(c.letterhead);
    SF.setRoleResolver((u) => (c.roles || []).find((x) => x.id === u.roleId) || null);
    SF.setGeo(c.geo);
    SF.setHrPolicies(c.hrPolicies || []);
    SF.setWorkSchedules(c.workSchedules || []);
    document.title = /^SES/.test(c.appName || '') ? c.appName : `SES - ${c.appName || 'SADEN ERP SYSTEM'}`;
    document.documentElement.style.setProperty('--letter-top', `${c.letterTopMargin || 35}mm`);
    applyTheme(c.theme);
  }

  /* أيقونات خطية بلون النص (رسم خطي رفيع، بدل الرموز التعبيرية) */
  const ICON_PATHS = {
    fileText:
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    inbox:
      '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    clipboard:
      '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M16 14v4"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    truck:
      '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    settings:
      '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    printer:
      '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    paperclip:
      '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    wrench:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4"/><path d="M8.2 13.8 7 22l5-3 5 3-1.2-8.2"/>',
    wallet:
      '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3"/><path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M21 12h-4a2 2 0 0 0 0 4h4z"/>',
    /* لوحة بعلامة صح (متابعة الإنجاز): إدارة الفروع */
    clipboardCheck:
      '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    /* عين المراقبة داخل إطار تركيز */
    scanEye:
      '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1.6"/><path d="M18.94 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.88 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.88 0"/>',
    binoculars:
      '<path d="M10 10h4"/><path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/><path d="M20 21a2 2 0 0 0 2-2v-3.85c0-1.6-2.4-2.4-2.4-4.15V7a1 1 0 0 0-1-1h-3.2a1 1 0 0 0-1 1v4"/><path d="M4 21a2 2 0 0 1-2-2v-3.85c0-1.6 2.4-2.4 2.4-4.15V7a1 1 0 0 1 1-1h3.2a1 1 0 0 1 1 1v4"/><path d="M14 16a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" /><path d="M6 16a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z"/><path d="M10 16h4"/>',
    target:
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="M21 3l-6.5 6.5"/><path d="M17 3h4v4"/>',
    /* عدّاد المؤشرات: لوحة المؤشرات */
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/><path d="M12 14h.01"/>',
    fuelPump:
      '<path d="M3 22h12"/><path d="M4 9h10"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
    /* ورقة تقرير بأعمدة: التقارير */
    fileChart:
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 18v-2"/><path d="M12 18v-5"/><path d="M16 18v-3"/>',
    /* برج مكاتب الشركة (سقف مائل، جناح جانبي، شبابيك وباب): حول الشركة */
    companyHq:
      '<path d="M3 22h18"/><path d="M6 22V6.2a1 1 0 0 1 .7-.95l8-2.6A1 1 0 0 1 16 3.6V22"/><path d="M16 10h2.4a.6.6 0 0 1 .6.6V22"/><path d="M9 8.5h4M9 12h4M9 15.5h4"/><path d="M10.2 22v-3h1.6v3"/>',
    /* قائمة بعلامات صح: TO-DO */
    /* سلة المحذوفات: غطاء مرفوع وسهم استرجاع */
    binRestore:
      '<path d="M4.2 6.9 18.9 3.6"/><path d="M9.9 5.6 9.6 4.3a1.2 1.2 0 0 1 .9-1.4l2.4-.5a1.2 1.2 0 0 1 1.4.9l.3 1.3"/><path d="M5.6 9.3h12.8l-1.1 10.4a2 2 0 0 1-2 1.8H8.7a2 2 0 0 1-2-1.8Z"/><path d="M9.6 13.6h3.6a2 2 0 0 1 0 4h-1.7"/><path d="m11.1 12.1-1.5 1.5 1.5 1.5"/>',
    /* المناقصات: كراسة بختم/وسام الترسية */
    fileAward:
      '<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.5"/><path d="M13 3v4a1 1 0 0 0 1 1h4v2.5"/><path d="M8.5 11h4M8.5 14.5h2.5"/><circle cx="17" cy="15" r="3.2"/><path d="m15.4 17.8-.9 3.7 2.5-1.2 2.5 1.2-.9-3.7"/>',
    /* إدارة المشاريع: مخطط زمني (Gantt) */
    gantt: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M7 8h6"/><path d="M10 12h7"/><path d="M8 16h5"/>',
    /* المشتريات: عربة تسوق */
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17.5" cy="20" r="1.5"/><path d="M2.5 3h2.4l2.5 11.4a1.7 1.7 0 0 0 1.7 1.3h8.2a1.7 1.7 0 0 0 1.6-1.2L21 7H5.8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    smartphone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 5.5h3"/><path d="M11.5 18.5h1"/>',
    listChecks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    /* بطاقة جهة اتصال: CONTACTS */
    contactCard:
      '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v3M16 2v3"/><circle cx="12" cy="11" r="3"/><path d="M7 20a5 5 0 0 1 10 0"/>',
    buildings:
      '<path d="M3 21h18"/><rect x="4" y="8" width="7" height="13" rx="1"/><rect x="13" y="3" width="7" height="18" rx="1"/><path d="M6.5 11.5h2M6.5 14.5h2M6.5 17.5h2M15.5 6.5h2M15.5 9.5h2M15.5 12.5h2M15.5 15.5h2"/>',
    building:
      '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    trash:
      '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    rocket:
      '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
    /* إيصال بعلامة الريال السعودي (بدل الدولار): الرواتب */
    receiptRiyal:
      '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M10.3 6.6v8.1c0 1.3-.6 2-1.7 2.5"/><path d="M13.7 6v10.3"/><path d="M7.9 11l8.3-1.8"/><path d="M7.9 14.1l8.3-1.8"/><path d="M14.9 16.5l1.6-.35"/>',
    receipt:
      '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    scale:
      '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    filePen:
      '<path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    forward: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13"/>',
    bookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    arrowUpRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    xCircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    folderOpen:
      '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',
    idCard:
      '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4"/><path d="M14 14h4"/><path d="M5 17a3 3 0 0 1 6 0"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    layers:
      '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    palette:
      '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.7 1.7-1.7h2c3.1 0 5.5-2.5 5.5-5.6C22 6 17.5 2 12 2Z"/>',
    smile:
      '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    calendar:
      '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    phone:
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    camera:
      '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    handshake:
      '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    /* رمز الفرع في كل النظام */
    branch:
      '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    pickaxe:
      '<path d="M14.53 12.47 6.62 20.38a1 1 0 1 1-3-3l7.91-7.91"/><path d="M15.69 4.31A12.5 12.5 0 0 0 5.46 2.96a1 1 0 0 0 .12 1.75 22 22 0 0 1 6.32 3.39"/><path d="M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z"/><path d="M19.69 8.31a12.5 12.5 0 0 1 1.35 10.23 1 1 0 0 1-1.75-.12 22 22 0 0 0-3.39-6.32"/>',
    /* اللغة (قائمة الحساب) */
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    guide:
      '<path d="M2.5 6.2c0-.9.7-1.6 1.6-1.6H8.6a3.4 3.4 0 0 1 3.4 3.4v11.4a2.6 2.6 0 0 0-2.6-2.6H4.1a1.6 1.6 0 0 1-1.6-1.6z"/><path d="M21.5 6.2c0-.9-.7-1.6-1.6-1.6h-4.5A3.4 3.4 0 0 0 12 8v11.4a2.6 2.6 0 0 1 2.6-2.6h5.3a1.6 1.6 0 0 0 1.6-1.6z"/><path d="M16.7 7.6l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="currentColor"/><path d="M5.5 9h3.5M5.5 12h3.5"/>',
    shield:
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    warehouse:
      '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12M6 14h12"/><rect x="6" y="10" width="12" height="12"/>',
    boxes:
      '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  };
  /* كل الرموز التعبيرية في الواجهة تتحول تلقائياً لأيقونة خطية بنفس الاستايل (عدا الخطابات المطبوعة وخيارات القوائم) */
  const EMOJI_ICON = {
    '💾': 'save',
    '➕': 'plus',
    '📢': 'megaphone',
    '✕': 'x',
    '🔔': 'bell',
    '🖨': 'printer',
    '✔': 'check',
    '✓': 'check',
    '📎': 'paperclip',
    '✉': 'mail',
    '📧': 'mail',
    '⚠': 'alert',
    '🧮': 'calc',
    '↩': 'undo',
    '📤': 'send',
    '⬇': 'download',
    '📄': 'file',
    '✅': 'checkCircle',
    '🚚': 'truck',
    '✏': 'pencil',
    '🛠': 'wrench',
    '⬆': 'upload',
    '⚙': 'settings',
    '💡': 'bulb',
    '🏢': 'branch',
    '🗑': 'trash',
    '↺': 'rotate',
    '🚀': 'rocket',
    '🏠': 'home',
    '📘': 'book',
    '📖': 'bookOpen',
    '🖥': 'monitor',
    '🧾': 'receipt',
    '👥': 'users',
    '🚗': 'car',
    '⚖': 'scale',
    '🧭': 'compass',
    '🔍': 'search',
    '❓': 'help',
    '📥': 'inbox',
    '🔐': 'lock',
    '🔒': 'lock',
    '📝': 'filePen',
    '📋': 'clipboard',
    '⏻': 'power',
    '🧑‍💼': 'briefcase',
    '⛔': 'ban',
    '↪': 'forward',
    '👁': 'eye',
    '🖊': 'pen',
    '🔗': 'link',
    '↗': 'arrowUpRight',
    '✖': 'xCircle',
    '📂': 'folderOpen',
    '📊': 'chart',
    '📇': 'idCard',
    '👤': 'user',
    '🔑': 'key',
    '🗂': 'list',
    '🛑': 'ban',
    '❌': 'xCircle',
    '📌': 'paperclip',
    '📅': 'clipboard',
    '🔄': 'rotate',
    '📦': 'inbox',
    '🏭': 'building',
    '♻': 'rotate',
    '🤝': 'handshake',
    '💬': 'message',
    '📷': 'camera',
    '🔧': 'wrench',
  };
  const EMOJI_RE = new RegExp(
    `(${Object.keys(EMOJI_ICON)
      .sort((a, b) => b.length - a.length)
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})\uFE0F?`,
    'gu',
  );
  const NO_ICON =
    '.letter, option, select, textarea, script, style, title, svg, .ei, [data-noicon], .cm-t, .cm-reply, .ch-last, .ch-emo, .toast-chat, .cm-stk, .ch-stks, .cm-pt, .ch-qr-t, .cm-card b, .cm-reacts, .cm-rbar';
  /* أي تاريخ يظهر بصيغة سنة-شهر-يوم في الصفحات يُعرض يوم/شهر/سنة (الحقول وخانات الكتابة لا تتغير) */
  const DATE_RE = /(^|[^\d/-])((?:19|20)\d{2})[-/](\d{2})[-/](\d{2})(?![\d/-])/g;
  const NO_DATE = 'textarea, script, style, [contenteditable], [data-rawdate]';
  function fixDates(root) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const v = n.nodeValue;
      if (v.length < 10 || !/\d{4}[-/]\d{2}[-/]\d{2}/.test(v) || (n.parentElement && n.parentElement.closest(NO_DATE))) continue;
      const out = v.replace(DATE_RE, (m, pre, y, mo, d) => `${pre}${d}/${mo}/${y}`);
      if (out !== v) n.nodeValue = out;
    }
  }
  function iconize(root) {
    if (!root || (root.nodeType === 1 && root.closest(NO_ICON))) return;
    const nodes = [];
    const walk = document.createTreeWalker(root.nodeType === 3 ? root.parentNode || root : root, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      EMOJI_RE.lastIndex = 0;
      if (EMOJI_RE.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest(NO_ICON))) nodes.push(n);
    }
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      let last = 0;
      const v = n.nodeValue;
      v.replace(EMOJI_RE, (m, e, at) => {
        if (at > last) frag.appendChild(document.createTextNode(v.slice(last, at)));
        const s = document.createElement('span');
        s.className = 'ei';
        s.innerHTML = icon(EMOJI_ICON[e]);
        frag.appendChild(s);
        last = at + m.length;
        return m;
      });
      if (last < v.length) frag.appendChild(document.createTextNode(v.slice(last)));
      n.replaceWith(frag);
    }
    /* رمز الفرع: يُضاف تلقائياً قبل عناوين الفرع في الجداول وبيانات الطلب وخانات النماذج في كل النظام */
    const scope = root.nodeType === 1 ? root : document.body;
    for (const el of scope.querySelectorAll('th, dt, .field > label')) {
      if (el.dataset.bri || el.closest(NO_ICON)) continue;
      const own = [...el.childNodes]
        .filter((c) => c.nodeType === 3)
        .map((c) => c.nodeValue)
        .join('')
        .trim();
      if (!BRANCH_LABEL.test(own)) continue;
      el.dataset.bri = '1';
      const s = document.createElement('span');
      s.className = 'ei bri';
      s.innerHTML = icon('branch');
      el.insertBefore(s, el.firstChild);
    }
  }
  const BRANCH_LABEL =
    /^(الفرع|فرع العمل|الفرع التابع|الفرع المستلم|من فرع|إلى فرع|مكان التوظيف|الإدارة \/ الفرع|الفرع المستخدم|Branch|From branch|To branch)(\s|$|\(|:|\*)/;
  let iconQueued = false;
  new MutationObserver(() => {
    if (iconQueued) return;
    iconQueued = true;
    requestAnimationFrame(() => {
      iconQueued = false;
      iconize(document.body);
      fixDates(document.body);
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  const icon = (name) =>
    `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;

  /* رموز تطبيق الموبايل (Ionicons — public/js/ion.js): أيقونات التطبيقات والقائمة بنفس تصميم تطبيق SES */
  const ION_MAP = {
    '#/apps': 'grid-outline',
    '#/dashboard': 'speedometer-outline',
    '#/': 'home-outline',
    comm: 'chatbubbles-outline',
    '#/mail': 'mail-outline',
    '#/chat': 'chatbox-ellipses-outline',
    '#/notices': 'megaphone-outline',
    '#/notifications': 'notifications-outline',
    '#/tasks': 'checkbox-outline',
    requests: 'documents-outline',
    '#/new': 'add-circle-outline',
    '#/mine': 'document-text-outline',
    '#/inbox': 'file-tray-full-outline',
    '#/all': 'list-outline',
    '#/docs': 'folder-outline',
    '#/reports': 'bar-chart-outline',
    '#/todo': 'list-circle-outline',
    '#/notes': 'create-outline',
    tools: 'briefcase-outline',
    '#/calendar': 'calendar-outline',
    '#/contacts': 'call-outline',
    hr: 'people-outline',
    '#/employees': 'people-circle-outline',
    '#/employees-ended': 'person-remove-outline',
    '#/attendance': 'time-outline',
    '#/iqamas': 'id-card-outline',
    '#/contracts': 'document-attach-outline',
    '#/gosi': 'umbrella-outline',
    '#/emp-affairs': 'folder-open-outline',
    '#/org': 'git-network-outline',
    '#/investigations': 'search-outline',
    '#/ot-approvals': 'checkmark-done-outline',
    '#/register': 'archive-outline',
    payroll: 'cash-outline',
    '#/payroll': 'clipboard-outline',
    '#/advances': 'card-outline',
    '#/branch-pay': 'receipt-outline',
    '#/mudad-pay': 'swap-horizontal-outline',
    '#/pay-funding': 'send-outline',
    quality: 'medal-outline',
    '#/kpi': 'trophy-outline',
    ops: 'layers-outline',
    traffic: 'car-outline',
    '#/fleet': 'car-sport-outline',
    '#/violations': 'warning-outline',
    inventory: 'file-tray-stacked-outline',
    '#/inventory': 'cube-outline',
    '#/devices': 'desktop-outline',
    '#/inventory-deleted': 'remove-circle-outline',
    workshop: 'construct-outline',
    '#/workshop': 'build-outline',
    drilling: 'hammer-outline',
    '#/drilling': 'cog-outline',
    '#/drilling-projects': 'flag-outline',
    '#/drilling-projects?type=shared': 'git-merge-outline',
    legal: 'library-outline',
    '#/legal-cases': 'document-lock-outline',
    '#/tools': 'calculator-outline',
    '#/facilities': 'storefront-outline',
    '#/branch-map': 'map-outline',
    '#/stock': 'basket-outline',
    '#/analysis': 'compass-outline',
    '#/hse': 'medkit-outline',
    '#/governance': 'shield-half-outline',
    '#/knowledge': 'book-outline',
    '#/training': 'school-outline',
    '#/settings': 'settings-outline',
    '#/trash': 'trash-outline',
    '#/access-requests': 'key-outline',
    '#/decision-center': 'newspaper-outline',
    '#/about': 'information-circle-outline',
    '#/mobile-app': 'phone-portrait-outline',
    '#/account': 'person-circle-outline',
    me: 'person-outline',
    '#/me': 'reader-outline',
    '#/punch': 'finger-print-outline',
    '#/wps': 'shield-checkmark-outline',
    '#/my-overtime': 'flash-outline',
    '#/supervision': 'hierarchy',
    '#/marketing': 'pie-chart-outline',
    '#/tenders': 'pricetags-outline',
    '#/projects': 'git-branch-outline',
    '#/procurement': 'cart-outline',
    marketing: 'trending-up-outline',
    '#/crm': 'business-outline',
    '#/finance': 'wallet-outline',
  };
  /* إضافات داخل الرمز الأساسي (اسم+إضافة): checks = علامتا صح تحت بعض (إدارة الفروع) */
  const ION_EXTRA = {
    checks:
      '<path d="M196 262l36 36 84-84M196 372l36 36 84-84" fill="none" stroke="currentColor" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  /* رموز مرسومة هنا كمسار ممتلئ بسُمك خط رموز الموبايل (ليست في خطه): hierarchy = هيكل هرمي — مربع فوق وثلاثة تحته (إدارة الفروع) */
  const ION_DRAW = {
    hierarchy:
      'M208 40h96a28 28 0 0 1 28 28v72a28 28 0 0 1 -28 28h-96a28 28 0 0 1 -28 -28v-72a28 28 0 0 1 28 -28zM220 72h72a8 8 0 0 1 8 8v48a8 8 0 0 1 -8 8h-72a8 8 0 0 1 -8 -8v-48a8 8 0 0 1 8 -8zM52 344h96a28 28 0 0 1 28 28v72a28 28 0 0 1 -28 28h-96a28 28 0 0 1 -28 -28v-72a28 28 0 0 1 28 -28zM64 376h72a8 8 0 0 1 8 8v48a8 8 0 0 1 -8 8h-72a8 8 0 0 1 -8 -8v-48a8 8 0 0 1 8 -8zM208 344h96a28 28 0 0 1 28 28v72a28 28 0 0 1 -28 28h-96a28 28 0 0 1 -28 -28v-72a28 28 0 0 1 28 -28zM220 376h72a8 8 0 0 1 8 8v48a8 8 0 0 1 -8 8h-72a8 8 0 0 1 -8 -8v-48a8 8 0 0 1 8 -8zM364 344h96a28 28 0 0 1 28 28v72a28 28 0 0 1 -28 28h-96a28 28 0 0 1 -28 -28v-72a28 28 0 0 1 28 -28zM376 376h72a8 8 0 0 1 8 8v48a8 8 0 0 1 -8 8h-72a8 8 0 0 1 -8 -8v-48a8 8 0 0 1 8 -8zM240 168H272V240H428V344H396V272H272V344H240V272H116V344H84V240H240z',
  };
  const ion = (key) => {
    const [name, extra] = String(key || '').split('+');
    if (ION_DRAW[name])
      return `<svg class="i ion" viewBox="0 0 512 512" fill="currentColor" stroke="none" aria-hidden="true"><path fill-rule="evenodd" d="${ION_DRAW[name]}"/></svg>`;
    return window.ION && window.ION[name]
      ? `<svg class="i ion" viewBox="0 0 512 512" fill="currentColor" stroke="none" aria-hidden="true"><path d="${window.ION[name]}"/>${ION_EXTRA[extra] || ''}</svg>`
      : '';
  };
  /* يستبدل رمز كل عنصر في القائمة (وصفحاته الفرعية) برمز الموبايل المقابل إن وُجد */
  const ionize = (list) =>
    list.map((it) => {
      if (Array.isArray(it)) {
        const x = ion(ION_MAP[it[0]]);
        return x ? [it[0], x, ...it.slice(2)] : it;
      }
      const x = ion(ION_MAP[it.group]);
      return { ...it, ...(x ? { ic: x } : {}), items: ionize(it.items) };
    });

  /* ---------- توقيع الموظف على الإقرار (السلف): توقيعه الإلكتروني المحفوظ أو توقيع حي يرسمه الآن ---------- */
  const empSignBox = () => {
    const sig = state.user.signature;
    return `<div class="field full es-box" style="margin-top:14px"><label>توقيع الموظف على الإقرار${state.user.role === 'employee' ? '<span class="req">*</span>' : ' <small class="muted">(عند تقديم الموظف بنفسه)</small>'}</label>
      <div class="es-opts">
        <label class="es-opt${sig ? '' : ' dis'}"><input type="radio" name="esMode" value="saved"${sig ? '' : ' disabled'}><span><b>✍ توقيعي الإلكتروني المحفوظ</b>${sig ? `<img src="/api/signatures/${encodeURIComponent(sig)}" alt="توقيعي">` : '<small class="muted">لا يوجد توقيع محفوظ — احفظه من «حسابي» أو اختر «توقيع»</small>'}</span></label>
        <label class="es-opt"><input type="radio" name="esMode" value="manual"><span><b>🖊 توقيع</b><small class="muted">يوقّع الموظف على طلب السلفة ورقياً ويرفعه المحاسب</small></span></label>
      </div>
      <div class="es-file field" hidden style="margin-top:8px"><label>طلب السلفة موقّعاً من الموظف<span class="req">*</span></label><input type="file" class="in" data-esfile accept=".pdf,.png,.jpg,.jpeg"><small class="muted">صورة أو PDF لطلب السلفة بعد توقيع الموظف عليه</small></div></div>`;
  };
  const empSignValue = (root) => {
    const box = root.querySelector('.es-box');
    return box && box.esValue ? box.esValue() : undefined;
  };

  /* شعار واتساب (للتواصل من CONTACTS) */
  const WA_ICON =
    '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.5 5 5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.1.82.83-3-.2-.31a8.2 8.2 0 1 1 6.97 3.82Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22a7.4 7.4 0 0 1-1.37-1.7c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.57c.12.16 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.6.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>';
  /* أيقونة Calendar: رقم اليوم من الشهر داخل التقويم */
  const calDayIcon = () =>
    `<svg class="i cal-day-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="9" y2="9"/><text x="12" y="19.2" text-anchor="middle" font-size="9.5" font-weight="800" font-family="Tajawal, Arial, sans-serif" fill="currentColor" stroke="none">${new Date().getDate()}</text></svg>`;
  Object.assign(S, { THEMES, icon, ion, ionize, empSignBox, empSignValue, WA_ICON, calDayIcon });
})((window.SES_APP = window.SES_APP || {}));
