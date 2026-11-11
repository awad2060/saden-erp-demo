/* بصمتي، الجرد والباركود، المخالفات، المحروقات */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, $$, dt, api, toast, readXlsx, normDate, normTime, parseCsv } = S;
  Object.assign(S, { geofencesModal, barcodeSvg, gridImportModal });
  /* ---------- بصمتي: الحضور والانصراف من الجوال بالموقع ---------- */
  const punchDeviceId = () => {
    try {
      let id = localStorage.getItem('punch:device');
      if (!id) {
        id = crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('punch:device', id);
      }
      return id;
    } catch {
      return '';
    }
  };
  const getPos = () =>
    new Promise((ok, no) => {
      if (!navigator.geolocation) {
        no(new Error('المتصفح لا يدعم تحديد الموقع'));
        return;
      }
      if (!window.isSecureContext) {
        no(new Error('تحديد الموقع يحتاج فتح النظام باتصال آمن (https) — راجع مدير النظام'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => ok(p.coords),
        (e) =>
          no(
            new Error(
              e.code === 1
                ? 'لم تسمح للمتصفح باستخدام موقعك — اسمح بالموقع من إعدادات المتصفح ثم أعد المحاولة'
                : `تعذر تحديد موقعك: ${e.message}`,
            ),
          ),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      );
    });
  /* مواقع الفروع للبصمة (شئون الموظفين): خط العرض وخط الطول والنطاق، أو لصق رابط جوجل ماب فتُستخرج الإحداثيات */
  /* استخراج الإحداثيات من رابط جوجل ماب أو نص: !3d..!4d (موقع المكان بدقة) ← @lat,lng ← q=/query= ← "lat, lng" ← درجات ودقائق وثوانٍ */
  const parseCoords = (raw) => {
    const s = decodeURIComponent(String(raw || '')).replace(/%2C/gi, ',');
    let m = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(s);
    if (!m) m = /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/.exec(s);
    if (!m) m = /[?&](?:q|query|ll|center|destination)=(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/.exec(s);
    if (!m) m = /(-?\d{1,2}\.\d{3,})\s*[,،\s]\s*(-?\d{1,3}\.\d{3,})/.exec(s);
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
    const dms = /(\d{1,2})°\s*(\d{1,2})['′]\s*([\d.]+)["″]?\s*([NS])[\s,]+(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)["″]?\s*([EW])/i.exec(s);
    if (dms) {
      const v = (d, mi, se, h) => (Number(d) + Number(mi) / 60 + Number(se) / 3600) * (/[SW]/i.test(h) ? -1 : 1);
      return { lat: v(dms[1], dms[2], dms[3], dms[4]), lng: v(dms[5], dms[6], dms[7], dms[8]) };
    }
    return null;
  };
  const okCoord = (c) =>
    c &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lng) <= 180 &&
    !(c.lat === 0 && c.lng === 0);
  async function geofencesModal() {
    const d = await api('GET', '/api/punch-admin/geofences');
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const ro = d.canEdit ? '' : ' readonly';
    bg.innerHTML = gfHtml(d, ro);
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    gfWireLink(bg);
    gfWireCoords(bg);
    if ($('#gfSave', bg)) $('#gfSave', bg).onclick = () => gfSave(bg);
  }
  /* جدول مواقع الفروع: الرابط وخط العرض والطول والنطاق، وأزرار الموقع الحالي والمسح والخريطة */
  function gfHtml(d, ro) {
    return `<div class="modal" style="max-width:980px;width:97%"><h3 style="margin-top:0">📍 مواقع الفروع للبصمة من الجوال</h3>
      <div class="hint">لكل فرع: <b>خط العرض</b> و<b>خط الطول</b> ونصف قطر النطاق بالمتر — أو الصق رابط الموقع من جوجل ماب (رابط المشاركة القصير أو رابط المتصفح) فيملأ النظام الإحداثيات تلقائياً. يقبل النظام بصمة الموظف داخل نطاق فرعه فقط، إلا من سمحت له بالحضور عن بُعد في ملفه.</div>
      <div class="tbl-wrap" style="max-height:60vh;overflow:auto"><table class="tbl gf-t"><thead><tr><th>الفرع</th><th>لصق رابط جوجل ماب</th><th>خط العرض (Latitude)</th><th>خط الطول (Longitude)</th><th>النطاق (م)</th><th></th></tr></thead><tbody>
      ${d.branches
        .map((b) => {
          const g = d.geofences[b];
          return `<tr data-br="${esc(b)}"><td><b>${esc(b)}</b></td>
        <td><input class="in" dir="ltr" data-link placeholder="الصق الرابط هنا"${ro}><div class="gf-msg muted" style="font-size:11.5px"></div></td>
        <td><input class="in" dir="ltr" data-lat inputmode="decimal" value="${g ? g.lat : ''}" placeholder="مثال: 21.5433"${ro}></td>
        <td><input class="in" dir="ltr" data-lng inputmode="decimal" value="${g ? g.lng : ''}" placeholder="مثال: 39.1728"${ro}></td>
        <td><input class="in" type="number" min="30" max="5000" data-rad value="${g ? g.radius : 150}" style="max-width:95px"${ro}></td>
        <td style="white-space:nowrap">${d.canEdit ? '<button class="btn sm" data-here title="موقعي الحالي">📍</button> <button class="btn sm" data-clr title="مسح الموقع">✕</button> ' : ''}<a class="btn sm" data-map target="_blank" title="عرض على الخريطة"${g ? ` href="https://www.google.com/maps?q=${g.lat},${g.lng}"` : ' hidden'}>🗺</a></td></tr>`;
        })
        .join('')}</tbody></table></div>
      <div class="merr"></div><div class="row" style="margin-top:12px">${d.canEdit ? '<button class="btn primary" id="gfSave">💾 حفظ</button>' : ''}<button class="btn" data-x>إغلاق</button></div></div>`;
  }
  /* تعبئة صف الفرع بالإحداثيات (أو مسحها) ورابط الخريطة والرسالة */
  const gfSetRow = (tr, c, note) => {
    tr.querySelector('[data-lat]').value = c ? c.lat.toFixed(6) : '';
    tr.querySelector('[data-lng]').value = c ? c.lng.toFixed(6) : '';
    const a = tr.querySelector('[data-map]');
    if (c) {
      a.href = `https://www.google.com/maps?q=${c.lat},${c.lng}`;
      a.hidden = false;
    } else a.hidden = true;
    tr.querySelector('.gf-msg').textContent = note || '';
  };
  function gfWireLink(bg) {
    /* لصق الرابط: يُستخرج الموقع مباشرة، والرابط القصير يفتحه الخادم لمعرفة الإحداثيات */
    $$('[data-link]', bg).forEach((inp) => {
      const run = async () => {
        const tr = inp.closest('tr'),
          v = inp.value.trim(),
          msg = tr.querySelector('.gf-msg');
        if (!v) return;
        const c = parseCoords(v);
        if (okCoord(c)) {
          gfSetRow(tr, c, '✔ تم استخراج الإحداثيات');
          return;
        }
        if (
          /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs|maps\.google\.|www\.google\.[a-z.]+\/maps|google\.[a-z.]+\/maps)/i.test(
            v,
          )
        ) {
          msg.textContent = 'جاري قراءة الرابط...';
          try {
            const r = await api('POST', '/api/punch-admin/resolve-map', { url: v });
            if (okCoord(r)) gfSetRow(tr, r, '✔ تم استخراج الإحداثيات من الرابط');
            else msg.textContent = 'تعذر استخراج الإحداثيات — افتح الرابط وانسخ الإحداثيات يدوياً';
          } catch (err) {
            msg.textContent = err.message;
          }
        } else msg.textContent = 'الرابط لا يحتوي إحداثيات — الصق رابط جوجل ماب أو اكتب خط العرض وخط الطول';
      };
      inp.addEventListener('paste', () => setTimeout(run, 30));
      inp.addEventListener('change', run);
    });
  }
  /* خانة خط العرض، وموقعي الحالي، والمسح */
  function gfWireCoords(bg) {
    /* لصق «خط العرض، خط الطول» معاً في خانة خط العرض يُوزَّع على الخانتين */
    $$('[data-lat]', bg).forEach((inp) =>
      inp.addEventListener('change', () => {
        const c = parseCoords(inp.value);
        if (okCoord(c) && /[,،\s]/.test(inp.value.trim())) gfSetRow(inp.closest('tr'), c);
      }),
    );
    $$('[data-here]', bg).forEach((b) => {
      b.onclick = async () => {
        try {
          const c = await getPos();
          gfSetRow(b.closest('tr'), { lat: c.latitude, lng: c.longitude }, `✔ موقعك الحالي (دقة ${Math.round(c.accuracy)} م)`);
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
    $$('[data-clr]', bg).forEach((b) => {
      b.onclick = () => {
        gfSetRow(b.closest('tr'), null);
        b.closest('tr').querySelector('[data-link]').value = '';
      };
    });
  }
  /* الحفظ: التحقق من إحداثيات كل فرع ثم الإرسال */
  async function gfSave(bg) {
    const out = {};
    for (const tr of $$('tr[data-br]', bg)) {
      const la = tr.querySelector('[data-lat]').value.trim(),
        lo = tr.querySelector('[data-lng]').value.trim();
      if (!la && !lo) continue;
      const c = { lat: Number(la), lng: Number(lo) };
      if (!okCoord(c)) {
        $('.merr', bg).innerHTML =
          `<div class="err">إحداثيات فرع ${esc(tr.dataset.br)} غير صحيحة — خط العرض بين -90 و90، وخط الطول بين -180 و180 (مثال: 21.5433 و 39.1728)</div>`;
        return;
      }
      out[tr.dataset.br] = { ...c, radius: Number(tr.querySelector('[data-rad]').value) || 150 };
    }
    try {
      await api('PUT', '/api/punch-admin/geofences', { geofences: out });
      toast('تم حفظ مواقع الفروع');
      bg.remove();
    } catch (err) {
      $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
    }
  }

  /* ---------- تبويب «الدخول والحساب» في ملف الموظف: الحساب الشخصي للتطبيق والنظام ---------- */
  const empAccCard = (e) => {
    const a = e.account;
    if (!a) return '';
    if (!a.exists)
      return `<div class="card"><div class="emp-sec-h"><h3>🔑 حساب الدخول (تطبيق SES والنظام)</h3><span class="chip">بدون حساب</span></div>
      <p class="muted" style="margin-top:0">لا يوجد حساب للموظف. اسم المستخدم وكلمة المرور الافتراضيان: رقم الهوية <b dir="ltr">${esc(a.defaultUsername || '—')}</b>.</p><button class="btn primary" data-acc="create">➕ إنشاء حساب الدخول</button></div>`;
    return `<div class="me-grid">
      <div class="card"><div class="emp-sec-h"><h3>🔑 بيانات الدخول</h3><span class="chip ${a.active ? 'approved' : 'rejected'}">${a.active ? 'فعّال' : 'موقوف'}</span></div>
        <table class="ep-t"><tr><th>اسم المستخدم</th><td dir="ltr" style="text-align:right"><b>${esc(a.username)}</b></td></tr>
          <tr><th>كلمة المرور</th><td>${a.isDefault ? '<span class="chip pending">رقم الهوية (الافتراضية)</span>' : '<span class="chip approved">غيّرها الموظف / عُيّنت</span>'}${a.mustChange ? '<div class="muted" style="font-size:12px;margin-top:4px">تطلب منه النظام تغييرها عند الدخول</div>' : ''}</td></tr>
          <tr><th>الصلاحية</th><td>${esc(a.roleLabel || a.role)} (الخدمة الذاتية)</td></tr></table>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" data-acc="username">✏️ تغيير اسم المستخدم</button><button class="btn sm" data-acc="password">🔒 تعيين كلمة مرور</button><button class="btn sm" data-acc="reset">↺ إعادة كلمة المرور لرقم الهوية</button><button class="btn sm" data-acc="print">🖨 بطاقة الدخول</button></div></div>
      <div class="card"><div class="emp-sec-h"><h3>📱 الجوال والأجهزة</h3></div>
        <table class="ep-t"><tr><th>الجوال المربوط</th><td>${a.mobile ? `📱 ${esc(a.mobile.model || 'جوال')}<div class="muted" style="font-size:12px">منذ ${esc(dt(a.mobile.at))}</div>` : '<span class="muted">غير مربوط — يربط النظام أول جوال يدخل منه</span>'}</td></tr>
          <tr><th>آخر دخول</th><td>${a.lastLogin ? esc(dt(a.lastLogin)) : '<span class="muted">لم يدخل بعد</span>'}</td></tr><tr><th>مرات الدخول</th><td>${a.logins || 0}</td></tr><tr><th>جلسات نشطة الآن</th><td>${a.sessions || 0}</td></tr></table>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">${a.mobile ? '<button class="btn sm" data-acc="unbindMobile">📱 إعادة تعيين الهاتف</button>' : ''}${a.sessions ? '<button class="btn sm" data-acc="logout">⏏ تسجيل الخروج من كل الأجهزة</button>' : ''}<button class="btn sm ${a.active ? 'bad' : ''}" data-acc="toggle">${a.active ? '⏸ إيقاف الحساب' : '▶ تفعيل الحساب'}</button></div></div>
    </div>
    <div class="hint">الحساب الشخصي تبع الموظف: يتحدث فرعه ووظيفته تلقائياً عند النقل، ويُوقف عند انتهاء الخدمة. وحسابات الوظائف (مثل محاسب الفرع) منفصلة وتُسلَّم لمن يخلف صاحبها.</div>`;
  };

  /* ---------- إدارة الجرد: جرد الفروع ---------- */
  const INV_TABS = [
    ['labs', 'soil', 'مختبر التربة'],
    ['labs', 'concrete', 'مختبر الخرسانة'],
    ['labs', 'asphalt', 'مختبر الأسفلت'],
    ['sites', '', 'جرد المواقع'],
    ['housing', '', 'جرد السكنات'],
    ['store', '', 'مخزن الفرع'],
    ['office', 'furniture', 'المكاتب'],
    ['office', 'ac', 'المكيفات'],
    ['office', 'electronics', 'الأجهزة الإلكترونية'],
    ['civil', '', 'جرد إنشائي'],
  ];
  /* ---------- الباركود (Code 39) من التكويد المرفوع كما هو ----------
   * كل رمز 9 عناصر (خط، مسافة، خط...) منها 3 عريضة: 5 خطوط اثنان منها عريضان بترتيب ثابت للأرقام والحروف،
   * ومسافة عريضة واحدة يحدد موضعها مجموعة الرمز: 1-0 (الثانية)، A-J (الثالثة)، K-T (الرابعة)، U-* (الأولى)؛
   * والرموز $ / + % خطوطها رفيعة وثلاث مسافات عريضة. الجدول يُبنى من هذه القاعدة القياسية */
  const C39 = (() => {
    const bars = ['WNNNW', 'NWNNW', 'WWNNN', 'NNWNW', 'WNWNN', 'NWWNN', 'NNNWW', 'WNNWN', 'NWNWN', 'NNWWN'];
    const groups = [
      ['1234567890', 1],
      ['ABCDEFGHIJ', 2],
      ['KLMNOPQRST', 3],
      ['UVWXYZ-. *', 0],
    ];
    const mix = (b, s) => [...b].map((c, i) => c + (s[i] || '')).join('');
    const t = {};
    for (const [chars, wide] of groups)
      [...chars].forEach((ch, i) => {
        t[ch] = mix(bars[i], ['N', 'N', 'N', 'N'].map((x, k) => (k === wide ? 'W' : x)).join(''));
      });
    Object.assign(t, { $: mix('NNNNN', 'WWWN'), '/': mix('NNNNN', 'WWNW'), '+': mix('NNNNN', 'WNWW'), '%': mix('NNNNN', 'NWWW') });
    return t;
  })();
  /* رسم الباركود SVG؛ التكويد غير القابل للترميز (مثل الحروف العربية) يظهر نصاً فقط */
  function barcodeSvg(text, h = 34) {
    const s = String(text == null ? '' : text)
      .trim()
      .toUpperCase();
    if (!s || [...s].some((ch) => !C39[ch] || ch === '*')) return '';
    let x = 10,
      rects = '';
    for (const ch of `*${s}*`) {
      [...C39[ch]].forEach((w, i) => {
        const wd = w === 'W' ? 3 : 1;
        if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${wd}" height="${h}"/>`;
        x += wd;
      });
      x += 1;
    }
    return `<svg class="bc" viewBox="0 0 ${x + 9} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(s)}">${rects}</svg>`;
  }
  /* أعمدة نموذج رفع الجرد بنفس أسماء جدول البيان المعروض (والأسماء القديمة مقبولة عند قراءة الملفات) */
  const INV_COLS = [
    { key: 'ar', label: 'البيان (عربي)', required: true, aliases: ['الاسم (عربي)'] },
    { key: 'en', label: 'البيان (إنجليزي)', aliases: ['الاسم (إنجليزي)'] },
    { key: 'qty', label: 'العدد', type: 'number' },
    { key: 'brand', label: 'الماركة', aliases: ['الماركة / النوع'] },
    { key: 'serial', label: 'السيريال' },
    { key: 'code', label: 'التكويد', aliases: ['التكويد (Barcode)', 'الباركود'] },
    { key: 'parts', label: 'الوصف والمشتملات' },
    { key: 'status', label: 'الحالة' },
    { key: 'notes', label: 'ملاحظات' },
  ];
  /* عمود "م" في نموذج الرفع: ترقيم تلقائي مثل البيان (لا يُحفظ) */
  const INV_NO = { key: '_n', label: 'م', auto: true };
  /* تبويبات بأعمدة خاصة: المكاتب والمكيفات والكمبيوتر، والجرد الإنشائي (وباقي التبويبات بأعمدة الجرد المعتادة) */
  const INV_COLSETS = {
    /* الأجهزة الإلكترونية: كمبيوتر - لاب توب - جوالات - أجهزة لوحية (مع السيريال) */
    electronics: [
      { key: 'type', label: 'نوع الجهاز', required: true, hint: 'كمبيوتر / لاب توب / جوال / جهاز لوحي' },
      { key: 'user', label: 'المستخدم' },
      { key: 'qty', label: 'العدد' },
      { key: 'brand', label: 'الماركة' },
      { key: 'serial', label: 'السيريال' },
      { key: 'code', label: 'التكويد', aliases: ['الباركود'] },
      { key: 'notes', label: 'ملاحظات' },
    ],
    office: [
      { key: 'type', label: 'نوع الجهاز', required: true },
      { key: 'user', label: 'المستخدم' },
      { key: 'qty', label: 'عدد الأجهزة', aliases: ['عدد االجهزة', 'العدد'] },
      { key: 'brand', label: 'الماركة' },
      { key: 'code', label: 'التكويد', aliases: ['الباركود'] },
      { key: 'notes', label: 'ملاحظات' },
    ],
    civil: [
      { key: 'type', label: 'النوع', required: true },
      { key: 'qty', label: 'العدد' },
      { key: 'status', label: 'الحالة' },
      { key: 'notes', label: 'ملاحظات' },
    ],
  };
  const invCols = (sec, sub) => INV_COLSETS[sub] || INV_COLSETS[sec] || INV_COLS;
  const INV_SAMPLE = {
    furniture: [1, 'مكتب خشب 70*140*75', 'أحمد محمد', 2, '', 'SADEN-RD-OFF-0001', 'غرفة المحاسب'],
    ac: [1, 'مكيف سبليت', 'غرفة المحاسب', 2, 'LG', 'SADEN-RD-AC-0001', ''],
    electronics: [1, 'لاب توب', 'أحمد محمد', 1, 'Dell', 'SN-5521', 'SADEN-RD-EL-0001', ''],
    civil: [1, 'كرفان', 2, 'جيد', ''],
    store: [1, 'جهاز قص مباشر', 'Direct Shear', 1, 'ELE', 'SN-1001', 'SADEN-RD-STR-0001', 'جديد بالكرتونة', 'لم يدخل الخدمة', ''],
  };
  /* اسم البند للرسائل: البيان أو نوع الجهاز */
  const invName = (x) => x.ar || x.type || x.en || x.code || 'البند';
  const loanTagHtml = (x) => (x._tag ? `<div class="loan-tag ${x._tagKind}">${esc(x._tag)}</div>` : '');
  const invCell = (c, x, live, first) =>
    first
      ? `<td>${esc(x[c.key])}${loanTagHtml(x)}</td>`
      : c.key === 'code'
        ? `<td class="bc-cell">${barcodeSvg(x.code)}${esc(x.code)}</td>`
        : c.key === 'status' && live && x.status
          ? `<td><span class="chip ${{ يعمل: 'approved', صيانة: 'pending', تالف: 'rejected' }[x.status] || ''}">${esc(x.status)}</span></td>`
          : `<td>${esc(x[c.key])}</td>`;
  /* print: جدول الطباعة (التقرير)، وغيره جدول الشاشة سواء فيه أزرار أم لا */
  const invTable = (
    items,
    actions,
    cols = INV_COLS,
    print = false,
  ) => `<table class="${print ? 'lt grid sm' : 'tbl'}"><thead><tr><th>م</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}${actions ? '<th></th>' : ''}</tr></thead><tbody>
    ${items.map((x, i) => `<tr${x._tag ? ` class="loan-row ${x._tagKind}"` : ''}><td>${i + 1}</td>${cols.map((c, k) => invCell(c, x, !print, k === 0)).join('')}${actions ? `<td style="white-space:nowrap">${actions(x)}</td>` : ''}</tr>`).join('') || `<tr><td colspan="${cols.length + (actions ? 2 : 1)}" class="muted" style="text-align:center;padding:20px">لا توجد بنود</td></tr>`}</tbody></table>`;
  /* ---------- الأجهزة النوعية: أجهزة تملكها الإدارة وتُعار للفروع لمدة معينة ---------- */
  const DEV_COLS = [
    { key: 'name', label: 'اسم الجهاز', required: true },
    { key: 'brand', label: 'الماركة' },
    { key: 'model', label: 'الموديل' },
    { key: 'serial', label: 'السيريال' },
    { key: 'code', label: 'التكويد' },
    { key: 'notes', label: 'ملاحظات' },
  ];
  const devState = (x) =>
    x.loan
      ? `<span class="chip ${x.overdue ? 'rejected' : 'pending'}">معار لفرع ${esc(x.loan.branch)} حتى ${esc(SF.fmtDate(x.loan.to))}${x.overdue ? ' — متأخر' : ''}</span>`
      : x.pending
        ? `<span class="chip returned">طلب استعارة جارٍ (${esc(x.pending.branch)})</span>`
        : (x.state || 'متاح') === 'متاح'
          ? '<span class="chip approved">متاح</span>'
          : `<span class="chip">${esc(x.state)}</span>`;

  /* ---------- المخالفات المرورية (إدارة الحركة) ---------- */
  const VIOL_COLS = [
    { key: 'plate', label: 'رقم اللوحة', required: true },
    { key: 'number', label: 'رقم المخالفة' },
    { key: 'date', label: 'تاريخ المخالفة', type: 'date', required: true },
    { key: 'time', label: 'الوقت', type: 'time' },
    { key: 'type', label: 'نوع المخالفة' },
    { key: 'amount', label: 'المبلغ', required: true },
    { key: 'location', label: 'الموقع / المدينة' },
  ];
  const violChip = (s) =>
    `<span class="chip ${{ 'محالة للفرع': 'pending', 'معتمدة للسداد': 'pending', مسددة: 'approved', 'مخصومة من الموظف': 'approved', 'معترض عليها': 'returned', ملغاة: 'rejected' }[s] || ''}">${esc(s)}</span>`;
  /* جدول إدخال عام: صف لكل سجل، لصق من Excel، أو رفع ملف Excel / CSV بنفس عناوين الأعمدة */
  /* guide: شرح النموذج لورقة «شرح النموذج» في قالب Excel ({ about, help, steps, notes } — templates-center.js) */
  function gridImportModal({ title, hint, cols, template, sample, guide, save, done }) {
    const cell = (f, v) =>
      f.auto
        ? `<input class="in" data-c="${f.key}" readonly tabindex="-1" style="width:46px;min-width:0;text-align:center">`
        : `<input class="in" data-c="${f.key}" ${f.type === 'date' ? 'type="date"' : ''} value="${esc(f.type === 'date' ? normDate(v) : v == null ? '' : String(v).trim())}">`;
    const rowHtml = (vals = {}) =>
      `<tr>${cols.map((f) => `<td>${cell(f, vals[f.key])}</td>`).join('')}<td><button type="button" class="btn sm ghost" data-rm title="حذف الصف">✕</button></td></tr>`;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = giHtml(title, hint, cols, rowHtml);
    document.body.appendChild(bg);
    /* نموذج الجدول G: النافذة وجسم الجدول والأعمدة وأدوات الصفوف */
    const G = { bg, body: $('#giRows', bg), cols, rowHtml };
    Object.assign(G, giTools(G));
    $('[data-x]', bg).onclick = () => bg.remove();
    giWireRows(G);
    giWireFile(G, { title, file: template, defs: cols, sample, guide });
    giWireSave(G, save, done);
    G.count();
  }
  /* النافذة: الشرح، والقالب ورفع الملف وإضافة الصفوف، والجدول (5 صفوف فارغة)، والحفظ */
  const giHtml = (
    title,
    hint,
    cols,
    rowHtml,
  ) => `<div class="modal" style="max-width:96vw;width:1200px"><h3 style="margin-top:0">${esc(title)}</h3>
      <div class="hint" style="margin-bottom:10px">${hint}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <button type="button" class="btn sm" id="giTpl">📊 تحميل قالب Excel</button>
        <label class="btn sm" style="cursor:pointer">📂 رفع ملف Excel<input type="file" id="giFile" accept=".xlsx,.csv" hidden></label>
        <button type="button" class="btn sm" id="giAdd">+ صف</button><button type="button" class="btn sm" id="giAdd10">+ 10 صفوف</button>
        <span class="muted" id="giCount" style="align-self:center"></span></div>
      <div class="tbl-wrap" style="max-height:55vh;overflow:auto"><table class="tbl bulk-t"><thead><tr>${cols.map((f) => `<th>${esc(f.label)}${f.required ? '<span class="req">*</span>' : ''}</th>`).join('')}<th></th></tr></thead><tbody id="giRows">${Array(
        5,
      )
        .fill(0)
        .map(() => rowHtml())
        .join('')}</tbody></table></div>
      <div id="giErr"></div>
      <div class="row" style="margin-top:12px;gap:8px"><button type="button" class="btn primary" id="giSave">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></div>`;
  /* قيمة الخانة من الملف أو اللصق: التاريخ والوقت يوحَّدان (خانات Excel تُقرأ أرقاماً)، والباقي نص كما هو */
  const GI_NORM = { date: normDate, time: normTime };
  const giValue = (f, v) => (GI_NORM[f.type] || ((x) => String(x == null ? '' : x).trim()))(v);
  /* أدوات الصفوف: المكتوب منها، والترقيم والعدد، وتعبئة صفوف من لصق أو ملف */
  function giTools({ bg, body, cols, rowHtml }) {
    /* الصف مكتوب إذا فيه قيمة في خانة غير الترقيم التلقائي */
    const filled = () => $$('tr', body).filter((tr) => $$('[data-c]', tr).some((i) => !i.readOnly && i.value.trim()));
    const count = () => {
      $$('tr', body).forEach((tr, i) => {
        $$('[data-c]', tr).forEach((inp) => {
          if (inp.readOnly) inp.value = i + 1;
        });
      });
      $('#giCount', bg).textContent = `${filled().length} صف مكتوب`;
    };
    const fillRows = (rows, startTr, startCol) => {
      let tr = startTr;
      rows.forEach((vals) => {
        if (!tr) {
          body.insertAdjacentHTML('beforeend', rowHtml());
          tr = body.lastElementChild;
        }
        const inputs = $$('[data-c]', tr);
        vals.forEach((v, k) => {
          const inp = inputs[startCol + k];
          if (inp && !inp.readOnly) inp.value = giValue(cols[startCol + k], v);
        });
        tr = tr.nextElementSibling;
      });
      count();
    };
    return { filled, count, fillRows };
  }
  /* إضافة الصفوف وحذفها، والعدّ عند الكتابة، ولصق جدول (من Excel) يوزَّع على الصفوف والأعمدة */
  function giWireRows({ bg, body, rowHtml, count, fillRows }) {
    $('#giAdd', bg).onclick = () => body.insertAdjacentHTML('beforeend', rowHtml());
    $('#giAdd10', bg).onclick = () =>
      body.insertAdjacentHTML(
        'beforeend',
        Array(10)
          .fill(0)
          .map(() => rowHtml())
          .join(''),
      );
    body.addEventListener('click', (e) => {
      if (e.target.closest('[data-rm]')) {
        e.target.closest('tr').remove();
        count();
      }
    });
    body.addEventListener('input', count);
    body.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (!/[\t\n]/.test(text.trim())) return;
      e.preventDefault();
      const tr = e.target.closest('tr');
      fillRows(
        text
          .replace(/\r/g, '')
          .replace(/\n$/, '')
          .split('\n')
          .map((l) => l.split('\t')),
        tr,
        [...tr.children].indexOf(e.target.closest('td')),
      );
    });
  }
  /* قالب Excel، ورفع ملف Excel / CSV (الصف الأول عناوين إن طابقت أسماء الأعمدة) */
  function giWireFile({ bg, body, cols, fillRows }, tpl) {
    $('#giTpl', bg).onclick = () => window.SES_TEMPLATES.download(S, tpl);
    $('#giFile', bg).onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      let rows;
      try {
        rows = /\.csv$/i.test(f.name) ? parseCsv(await f.text()) : await readXlsx(f);
      } catch (err) {
        $('#giErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        e.target.value = '';
        return;
      }
      $('#giErr', bg).innerHTML = '';
      /* الصف الأول عناوين: كل عمود بعنوانه أو بأحد أسمائه القديمة */
      const names = (c) => [c.label, ...(c.aliases || [])];
      const headRow = rows.length ? rows[0].map((x) => String(x).trim()) : [];
      if (cols.some((c) => !c.auto && names(c).some((n) => headRow.includes(n)))) {
        const idx = cols.map((c) => headRow.findIndex((h) => names(c).includes(h)));
        rows = rows.slice(1).map((r) => idx.map((k) => (k >= 0 ? r[k] : '')));
      }
      body.innerHTML = '';
      fillRows(rows, null, 0);
      e.target.value = '';
    };
  }
  /* الحفظ: الصفوف المكتوبة فقط (صف واحد على الأقل) */
  function giWireSave({ bg, filled }, save, done) {
    $('#giSave', bg).onclick = async () => {
      const list = filled().map((tr) => Object.fromEntries($$('[data-c]', tr).map((i) => [i.dataset.c, i.value.trim()])));
      $('#giErr', bg).innerHTML = '';
      if (!list.length) {
        $('#giErr', bg).innerHTML = '<div class="err">اكتب صفاً واحداً على الأقل</div>';
        return;
      }
      $('#giSave', bg).disabled = true;
      try {
        const r = await save(list);
        bg.remove();
        done(r);
      } catch (err) {
        $('#giErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        $('#giSave', bg).disabled = false;
      }
    };
  }
  /* ---------- المحروقات (سيارة آب): رفع ملف الاستهلاك الشهري وتوزيعه على مركبات الأسطول وفروعها ---------- */
  const FUEL_COLS = [
    ['plate', 'رقم اللوحة', /رقم اللوح|اللوحه|اللوحة|لوحة المركبة|لوحه المركبه|plate/i, true],
    ['brand', 'الماركة', /الماركه|الماركة|brand|make/i],
    ['model', 'الطراز', /الطراز|model name|vehicle model/i],
    ['year', 'الموديل (السنة)', /الموديل|سنه|سنة|year/i],
    ['color', 'اللون', /اللون|colou?r/i],
    ['user', 'المستخدم / السائق', /المستخدم|السائق|driver|user/i],
    ['branch', 'الفرع', /الفرع|branch|group|المجموعه|المجموعة/i],
    ['fuel', 'نوع الوقود', /نوع الوقود|الوقود|fuel|product/i],
    ['liters', 'اللترات', /لتر|ليتر|استهلاك|liter|litre|الكميه|الكمية|quantity/i, true],
    ['amount', 'المبلغ شامل الضريبة', /المبلغ|اجمالي|إجمالي|التكلفة|التكلفه|amount|total|cost|ريال/i, true],
  ];
  const fuelMonthName = (m) => {
    try {
      return new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(new Date(`${m}-15T12:00:00`));
    } catch {
      return m;
    }
  };
  const fuelSrc = {
    fleet: ['من الأسطول', 'ok'],
    digits: ['بالأرقام فقط', 'warn'],
    alias: ['ربط محفوظ', 'info'],
    manual: ['ربط يدوي', 'info'],
    file: ['فرع الملف', 'warn'],
    tank: ['تانك', 'info'],
    '': ['بدون فرع', 'bad'],
  };
  const tankName = (l) => `تانك ${l.branch || 'بدون فرع'}`;
  const fuelInBr = (l, b) => l.branch === b || (Array.isArray(l.alloc) && l.alloc.some((a) => a.branch === b));
  /* قالب Excel للشهر: «بيان تفصيلي بتحميل الوقود بسيارات شركة سادن» معبأ مسبقاً بمركبات الأسطول، ويُكمل المسؤول اللترات والمبلغ */
  /* نموذج الرفع: مطابق لتقرير «معدل الاستهلاك للمركبة» الذي ينزل من الشركة المتعاقدة — الربط بلوحة المركبة فقط */
  const FUEL_TPL_HEAD = [
    'الرقم التسلسلي',
    'الفرع',
    'لوحة المركبة',
    'رقم المركبة الداخلي',
    'رقم الهيكل',
    'نوع الوقود',
    'الاستهلاك بالليتر',
    'التكلفة',
  ];
  const fuelUpload = async (month, file, kind) => {
    const res = await fetch(`/api/fuel/${month}/files?kind=${kind}&name=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
    });
    let d = null;
    try {
      d = await res.json();
    } catch {
      /* تجاهل */
    }
    if (!res.ok) throw new Error((d && d.error) || `تعذر رفع ${file.name}`);
    return d;
  };
  /* ---------- المنشآت: الفروع ← مباني كل فرع (مبنى الفرع، السكن...) ← الوصف والمخطط الإنشائي والتصميمات المرسومة ---------- */
  const FAC_IC = { office: '🏢', housing: '🏠', other: '🏗' };
  Object.assign(S, {
    punchDeviceId,
    getPos,
    empAccCard,
    INV_TABS,
    INV_NO,
    invCols,
    INV_SAMPLE,
    invName,
    invCell,
    invTable,
    DEV_COLS,
    devState,
    VIOL_COLS,
    violChip,
    FUEL_COLS,
    fuelMonthName,
    fuelSrc,
    tankName,
    fuelInBr,
    FUEL_TPL_HEAD,
    fuelUpload,
    FAC_IC,
  });
})((window.SES_APP = window.SES_APP || {}));
