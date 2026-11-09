/* خريطة الفروع، صفحة الطباعة، المرفقات، الرسوم البيانية */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc, fmtDate, fmtNum } = SF;
  const { $, $$, state, MONTHS, toast, letterCtx } = S;
  Object.assign(S, { loadPdfLib, attachmentPages, columnChart, lineChart, delta });
  /* ---------- خريطة الفروع: خريطة حقيقية (شوارع / قمر صناعي) بمواقع الشركة بإحداثياتها ---------- */
  const SITE_IC = {
    فرع: '🏢',
    'مكتب إداري': '🏛',
    'مكتب فني': '📐',
    مختبر: '🧪',
    سكن: '🏠',
    مستودع: '📦',
    ورشة: '🔧',
    'موقع مشروع': '🚧',
    أخرى: '📍',
  };
  /* تحميل مكتبة الخرائط (Leaflet من ملفات النظام) مرة واحدة */
  let leafletP = null;
  const loadLeaflet = () =>
    leafletP ||
    (leafletP = new Promise((ok, no) => {
      if (window.L) return ok(window.L);
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'vendor/leaflet/leaflet.css';
      document.head.appendChild(css);
      const js = document.createElement('script');
      js.src = 'vendor/leaflet/leaflet.js';
      js.onload = () => ok(window.L);
      js.onerror = () => {
        leafletP = null;
        no(new Error('تعذر تحميل مكتبة الخرائط'));
      };
      document.head.appendChild(js);
    }));
  /* طبقات الخريطة: شوارع OpenStreetMap (بالعربي)، شوارع Esri، وقمر صناعي Esri مع أسماء الأماكن.
     OpenStreetMap يشترط إرسال عنوان الموقع (Referer)، والنظام يمنعه افتراضياً، فيُسمح به لصور الخريطة فقط */
  /* خرائط جوجل (Google Map Tiles API): جلسة لكل نوع خريطة تُحفظ حتى قرب انتهائها، والطلب من المتصفح فيُطبَّق قيد النطاق على المفتاح */
  const G_SESS = {};
  async function gmSession(mapType, layerTypes) {
    const key = state.config.googleMapsKey,
      id = `${mapType}|${(layerTypes || []).join(',')}`,
      LS = `gm:${key.slice(-8)}:${id}`;
    let c = G_SESS[id];
    if (!c) {
      try {
        c = JSON.parse(localStorage.getItem(LS) || 'null');
      } catch {
        c = null;
      }
    }
    if (c && Number(c.expiry) * 1000 > Date.now() + 3600000) return (G_SESS[id] = c);
    const r = await fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapType, language: 'ar', region: 'SA', ...(layerTypes ? { layerTypes } : {}) }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.session) throw new Error((j.error && j.error.message) || `Google Maps ${r.status}`);
    G_SESS[id] = j;
    try {
      localStorage.setItem(LS, JSON.stringify(j));
    } catch {
      /* تجاهل */
    }
    return j;
  }
  const mapLayers = async (L) => {
    const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      referrerPolicy: 'strict-origin-when-cross-origin',
      attribution: '© OpenStreetMap',
    });
    const esriStreets = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri',
    });
    const sat = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '© Esri',
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
      }),
    ]);
    const base = { 'خريطة الشوارع': streets, 'شوارع (Esri)': esriStreets, 'قمر صناعي': sat };
    const key = state.config.googleMapsKey;
    if (!key) return base;
    try {
      const [rd, st, hy] = await Promise.all([gmSession('roadmap'), gmSession('satellite'), gmSession('satellite', ['layerRoadmap'])]);
      const g = (x) =>
        L.tileLayer(
          `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(x.session)}&key=${encodeURIComponent(key)}`,
          {
            maxZoom: 21,
            maxNativeZoom: 20,
            tileSize: Number(x.tileWidth) || 256,
            attribution: `خرائط Google ©${new Date().getFullYear()} Google`,
          },
        );
      return { 'خرائط جوجل': g(rd), 'جوجل — هجين': g(hy), 'جوجل — قمر صناعي': g(st), ...base };
    } catch (e) {
      console.warn('Google Maps', e);
      toast(`تعذر تحميل خرائط جوجل (${e.message}) — يعرض النظام الخريطة البديلة`, true);
      return base;
    }
  };
  /* الإحداثيات من نص أو رابط خرائط جوجل (‎@lat,lng / q=lat,lng / !3dlat!4dlng / «lat, lng») */
  const parseLatLng = (t) => {
    const s = String(t || '')
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/%2C/gi, ',');
    const ok = (a, b) => {
      a = Number(a);
      b = Number(b);
      return a >= 15 && a <= 33 && b >= 34 && b <= 56 ? [a, b] : b >= 15 && b <= 33 && a >= 34 && a <= 56 ? [b, a] : null;
    };
    let m = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(s);
    if (m) return ok(m[1], m[2]);
    m = /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/.exec(s);
    if (m) return ok(m[1], m[2]);
    m = /[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/.exec(s);
    if (m) return ok(m[1], m[2]);
    m = /(-?\d{1,2}\.\d{3,})\s*[,،\s]\s*(-?\d{1,2}\.\d{3,})/.exec(s);
    if (m) return ok(m[1], m[2]);
    return null;
  };
  const sitePin = (L, color, ic, on) =>
    L.divIcon({
      className: 'st-pin-w',
      iconSize: [34, 44],
      iconAnchor: [17, 42],
      popupAnchor: [0, -38],
      html: `<div class="st-pin${on ? ' on' : ''}" style="--pc:${color}"><span>${ic}</span></div>`,
    });

  /* ---------- صفحة الطباعة ---------- */
  /* زر «تنزيل PDF»: ملف جاهز من السيرفر باسم الطلب؛ وإن لم يتوفر متصفح على السيرفر تُفتح نافذة الطباعة (حفظ PDF) */
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-pdf]');
    if (!b || b.disabled) return;
    const old = b.innerHTML;
    b.disabled = true;
    b.innerHTML = '⏳ جارٍ تجهيز الملف...';
    try {
      const res = await fetch(`/api/requests/${b.dataset.pdf}/pdf`, { credentials: 'same-origin' });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).error || 'تعذر إنشاء الملف';
        if (res.status === 501) {
          toast('اختر «حفظ PDF» من نافذة الطباعة');
          if (location.hash.startsWith('#/print/')) window.print();
          else window.open(`#/print/${b.dataset.pdf}`, '_blank');
          return;
        }
        throw new Error(msg);
      }
      const cd = res.headers.get('Content-Disposition') || '';
      const m = /filename\*=UTF-8''([^;]+)/.exec(cd);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await res.blob());
      a.download = m ? decodeURIComponent(m[1]) : 'طلب.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast('تم تنزيل الملف');
    } catch (err) {
      toast(err.message, true);
    } finally {
      b.disabled = false;
      b.innerHTML = old;
    }
  });

  /* ---------- المرفقات تحت الخطاب في صفحات A4 (تُطبع وتُحفظ PDF مع الخطاب كملف واحد) ----------
   * الصور: صفحة لكل صورة. PDF: صفحة لكل صفحة منه (pdf.js محلياً). باقي الأنواع: قائمة بأسمائها */
  const IMG_EXT = ['.png', '.jpg', '.jpeg'];
  const extOf = (n) => (String(n).match(/\.[^.]+$/) || [''])[0].toLowerCase();
  let pdfLib = null;
  function loadPdfLib() {
    if (!pdfLib)
      pdfLib = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'vendor/pdf.min.js';
        s.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        };
        s.onerror = () => {
          pdfLib = null;
          reject(new Error('تعذر تحميل قارئ PDF'));
        };
        document.head.appendChild(s);
      });
    return pdfLib;
  }
  async function attachmentPages(box, r) {
    /* نموذج آخر يوم دوام المعتمد المرتبط بملف التصفية: أول مرفقاته */
    if (box && r.lastDayDoc)
      box.insertAdjacentHTML(
        'beforeend',
        `<div class="att-page"><div class="att-head"><span class="att-title">📎 نموذج آخر يوم دوام معتمد</span><small><bdi dir="ltr">${esc(r.lastDayDoc.serial)}</bdi></small><span>${esc(r.serial)}</span></div><div class="att-body att-letter">${SF.renderLetter('lastWorkDay', r.lastDayDoc.data, letterCtx(r.lastDayDoc))}</div></div>`,
      );
    /* الخطاب بعرض صفحة المرفق (يُصغَّر ليظهر كاملاً) */
    if (box && r.lastDayDoc) {
      const pg = box.lastElementChild,
        body = $('.att-letter', pg),
        L = $('.letter', pg);
      const fit = () => {
        L.style.transform = '';
        const k = Math.min(1, body.clientWidth / L.offsetWidth);
        L.style.transform = `scale(${k})`;
        body.style.height = `${Math.ceil(L.offsetHeight * k)}px`;
      };
      requestAnimationFrame(fit);
      window.addEventListener('resize', fit);
    }
    if (!box || !r.attachments.length) return;
    const btns = $$('[data-print]');
    btns.forEach((b) => {
      b.disabled = true;
    });
    const bar = $('.print-bar');
    const wait = document.createElement('span');
    wait.className = 'att-wait';
    wait.textContent = bar ? 'جاري تجهيز المرفقات للطباعة...' : 'جاري عرض المرفقات...';
    (bar || box).appendChild(wait);
    /* اسم المرفق عنوان الصفحة، واسم الملف تحته */
    const head = (a, extra) =>
      `<div class="att-head"><span class="att-title">📎 ${esc(a.label || a.name)}</span><small>${a.label ? esc(a.name) : ''}${extra ? ` (${extra})` : ''}</small><span>${esc(r.serial)}</span></div>`;
    const url = (a) => `/api/requests/${r.id}/attachments/${a.id}`;
    const others = [];
    for (const a of r.attachments) {
      const ext = extOf(a.name);
      if (IMG_EXT.includes(ext)) {
        box.insertAdjacentHTML(
          'beforeend',
          `<div class="att-page">${head(a)}<div class="att-body"><img src="${url(a)}" alt="${esc(a.name)}"></div></div>`,
        );
      } else if (ext === '.pdf') {
        try {
          const lib = await loadPdfLib();
          const buf = await (await fetch(url(a), { credentials: 'same-origin' })).arrayBuffer();
          const pdf = await lib.getDocument({ data: buf }).promise;
          const n = Math.min(pdf.numPages, 50);
          for (let i = 1; i <= n; i++) {
            const pg = await pdf.getPage(i);
            const vp1 = pg.getViewport({ scale: 1 });
            /* دقة طباعة مناسبة (حوالي 150 نقطة لكل بوصة لعرض A4) */
            const vp = pg.getViewport({ scale: 1240 / vp1.width });
            const cv = document.createElement('canvas');
            cv.width = Math.round(vp.width);
            cv.height = Math.round(vp.height);
            const ctx = cv.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, cv.width, cv.height);
            await pg.render({ canvasContext: ctx, viewport: vp }).promise;
            box.insertAdjacentHTML(
              'beforeend',
              `<div class="att-page">${head(a, pdf.numPages > 1 ? `صفحة ${i} من ${pdf.numPages}` : '')}<div class="att-body"><img src="${cv.toDataURL('image/jpeg', 0.88)}" alt=""></div></div>`,
            );
          }
          if (pdf.numPages > n) others.push({ a, note: `عُرضت أول ${n} صفحة فقط` });
        } catch {
          others.push({ a, note: 'تعذر عرض الملف' });
        }
      } else others.push({ a, note: 'لا يمكن عرض هذا النوع في الطباعة' });
    }
    if (others.length) {
      box.insertAdjacentHTML(
        'beforeend',
        `<div class="att-page att-list"><div class="att-head">📎 مرفقات أخرى<span>${esc(r.serial)}</span></div>
        <table class="lt"><tr><td class="lbl">المرفق</td><td class="lbl">اسم الملف</td><td class="lbl">ملاحظة</td></tr>${others.map(({ a, note }) => `<tr><td>${esc(a.label || '—')}</td><td>${esc(a.name)}</td><td>${esc(note)}</td></tr>`).join('')}</table>
        <p class="muted">هذه المرفقات متاحة للتحميل من صفحة الطلب في النظام.</p></div>`,
      );
    }
    /* انتظار تحميل الصور قبل السماح بالطباعة */
    await Promise.all(
      $$('img', box).map((im) =>
        im.complete
          ? 0
          : new Promise((ok) => {
              im.onload = ok;
              im.onerror = ok;
            }),
      ),
    );
    wait.remove();
    btns.forEach((b) => {
      b.disabled = false;
    });
  }

  /* ---------- لوحة المؤشرات ---------- */
  const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
  function niceMax(v) {
    if (v <= 0) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }
  /* مسار عمود بزاوية علوية مستديرة 4px وقاعدة مستوية */
  function colPath(x, y, w, h, r) {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
  /* مخطط أعمدة شهرية (مكدسة عند تعدد السلاسل) — الأشهر من اليمين لليسار */
  /* labels: أسماء الشهور على المحور (افتراضياً شهور السنة) */
  function columnChart({ series, values, fmtTick, fmtTip, totalLabel, width, labels = MONTHS, short }) {
    const W = Math.max(300, Math.round(width || 600)),
      H = 260,
      mT = 22,
      mB = 30,
      mR = 46,
      mL = 4;
    const iw = W - mR - mL,
      ih = H - mT - mB,
      band = iw / Math.max(1, values.length),
      bw = Math.min(30, band * 0.55);
    const totals = values.map((v) => v.reduce((a, b) => a + b, 0));
    const max = niceMax(Math.max(...totals));
    const y = (v) => mT + ih - (v / max) * ih;
    const xC = (i) => W - mR - (i + 0.5) * band;
    let s = '';
    for (let t = 0; t <= 4; t++) {
      const v = (max / 4) * t,
        yy = y(v);
      s += `<line x1="${mL}" x2="${W - mR}" y1="${yy}" y2="${yy}" class="${t ? 'grid' : 'base'}"/><text x="${W - mR + 8}" y="${yy + 4}" class="tick" text-anchor="start">${esc(fmtTick(v))}</text>`;
    }
    const maxIdx = totals.indexOf(Math.max(...totals));
    values.forEach((vals, i) => {
      const cx = xC(i),
        x0 = cx - bw / 2;
      let acc = 0;
      const top = vals.reduce((last, v, k) => (v > 0 ? k : last), -1);
      vals.forEach((v, k) => {
        if (v <= 0) return;
        const y1 = y(acc + v),
          y0 = y(acc);
        const gap = acc > 0 ? 2 : 0; /* فاصل 2px بين الأجزاء المكدسة */
        const h = y0 - y1 - gap;
        s +=
          k === top
            ? `<path d="${colPath(x0, y1, bw, h, 4)}" fill="${series[k].color}"/>`
            : `<rect x="${x0}" y="${y1}" width="${bw}" height="${Math.max(0, h)}" fill="${series[k].color}"/>`;
        acc += v;
      });
      if (totals[i] > 0 && (totalLabel === 'all' || i === maxIdx))
        s += `<text x="${cx}" y="${y(totals[i]) - 6}" class="vlabel" text-anchor="middle">${esc(fmtTick(totals[i]))}</text>`;
      s += `<text x="${cx}" y="${H - 10}" class="tick" text-anchor="middle">${esc(band < Math.max(44, Math.max(...labels.map((l) => String(l).length)) * 7.5) ? (short || labels.map((_, k) => k + 1))[i] : labels[i])}</text>`;
      s += `<rect class="hit" x="${cx - band / 2}" y="${mT}" width="${band}" height="${ih}" data-i="${i}" tabindex="0"/>`;
    });
    const legend =
      series.length > 1
        ? `<div class="legend">${series.map((x) => `<span><i style="background:${x.color}"></i>${esc(x.name)}</span>`).join('')}</div>`
        : '';
    const el = document.createElement('div');
    el.className = 'chart';
    el.innerHTML = `${legend}<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" role="img">${s}</svg><div class="tip" hidden></div></div>`;
    const tip = $('.tip', el),
      box = $('.chart-box', el);
    const show = (rect) => {
      const i = Number(rect.dataset.i);
      $$('.hit', el).forEach((h) => h.classList.toggle('on', h === rect));
      tip.replaceChildren();
      const hd = document.createElement('div');
      hd.className = 'tip-h';
      hd.textContent = labels[i];
      tip.appendChild(hd);
      const rows = series.length > 1 ? series.map((x, k) => [x, values[i][k]]) : [[series[0], values[i][0]]];
      rows.forEach(([x, v]) => {
        const row = document.createElement('div');
        row.className = 'tip-r';
        const key = document.createElement('i');
        key.style.background = x.color;
        const b = document.createElement('b');
        b.textContent = fmtTip(v);
        const l = document.createElement('span');
        l.textContent = x.name;
        row.append(key, b, l);
        tip.appendChild(row);
      });
      if (series.length > 1) {
        const tot = document.createElement('div');
        tot.className = 'tip-t';
        tot.textContent = `الإجمالي: ${fmtTip(totals[i])}`;
        tip.appendChild(tot);
      }
      tip.hidden = false;
      const br = box.getBoundingClientRect(),
        rr = rect.getBoundingClientRect();
      let left = rr.left - br.left + rr.width / 2 - tip.offsetWidth / 2;
      left = Math.max(0, Math.min(left, br.width - tip.offsetWidth));
      tip.style.left = `${left}px`;
      tip.style.top = '4px';
    };
    const hide = () => {
      tip.hidden = true;
      $$('.hit', el).forEach((h) => h.classList.remove('on'));
    };
    $$('.hit', el).forEach((h) => {
      h.addEventListener('pointerenter', () => show(h));
      h.addEventListener('focus', () => show(h));
      h.addEventListener('blur', hide);
    });
    box.addEventListener('pointerleave', hide);
    return el;
  }

  /* مخطط خطي شهري (سنة حالية مقابل السابقة) مع خط عمودي وتلميح عند المرور — الأشهر من اليمين لليسار */
  function lineChart({ series, fmtTick, fmtTip, width, labels = MONTHS, short }) {
    const n = Math.max(1, series[0].values.length);
    const W = Math.max(300, Math.round(width || 600)),
      H = 260,
      mT = 22,
      mB = 30,
      mR = 46,
      mL = 10;
    const iw = W - mR - mL,
      ih = H - mT - mB,
      band = iw / n;
    const max = niceMax(Math.max(1, ...series.flatMap((x) => x.values)));
    const y = (v) => mT + ih - (v / max) * ih;
    const xC = (i) => W - mR - (i + 0.5) * band;
    let s = '';
    for (let t = 0; t <= 4; t++) {
      const v = (max / 4) * t,
        yy = y(v);
      s += `<line x1="${mL}" x2="${W - mR}" y1="${yy}" y2="${yy}" class="${t ? 'grid' : 'base'}"/><text x="${W - mR + 8}" y="${yy + 4}" class="tick" text-anchor="start">${esc(fmtTick(v))}</text>`;
    }
    for (let i = 0; i < n; i++)
      s += `<text x="${xC(i)}" y="${H - 10}" class="tick" text-anchor="middle">${esc(band < Math.max(44, Math.max(...labels.map((l) => String(l).length)) * 7.5) ? (short || labels.map((_, k) => k + 1))[i] : labels[i])}</text>`;
    s += '<line class="xhair" x1="0" x2="0" y1="0" y2="0"/>';
    series.forEach((x) => {
      const pts = x.values.map((v, i) => `${xC(i)},${y(v)}`).join(' ');
      s += `<polyline points="${pts}" fill="none" stroke="${x.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${x.dashed ? ' stroke-dasharray="5 4"' : ''}/>`;
      x.values.forEach((v, i) => {
        s += `<circle class="pt" data-i="${i}" cx="${xC(i)}" cy="${y(v)}" r="4" fill="${x.color}" stroke="var(--surface)" stroke-width="2"/>`;
      });
    });
    /* تسمية مباشرة لآخر قيمة غير صفرية في كل سلسلة */
    series.forEach((x) => {
      let i = n - 1;
      while (i > 0 && !x.values[i]) i--;
      if (x.values[i])
        s += `<text x="${xC(i)}" y="${y(x.values[i]) - 9}" class="vlabel" text-anchor="middle">${esc(fmtTick(x.values[i]))}</text>`;
    });
    for (let i = 0; i < n; i++)
      s += `<rect class="hit" x="${xC(i) - band / 2}" y="${mT}" width="${band}" height="${ih}" data-i="${i}" tabindex="0"/>`;
    const el = document.createElement('div');
    el.className = 'chart';
    el.innerHTML = `<div class="legend">${series.map((x) => `<span><i style="background:${x.color}${x.dashed ? ';opacity:.6' : ''}"></i>${esc(x.name)}</span>`).join('')}</div><div class="chart-box"><svg viewBox="0 0 ${W} ${H}" role="img">${s}</svg><div class="tip" hidden></div></div>`;
    const tip = $('.tip', el),
      box = $('.chart-box', el),
      xh = $('.xhair', el);
    const show = (rect) => {
      const i = Number(rect.dataset.i);
      $$('.pt', el).forEach((c) => {
        c.classList.toggle('on', Number(c.dataset.i) === i);
      });
      xh.setAttribute('x1', xC(i));
      xh.setAttribute('x2', xC(i));
      xh.setAttribute('y1', mT);
      xh.setAttribute('y2', mT + ih);
      xh.classList.add('on');
      tip.replaceChildren();
      const hd = document.createElement('div');
      hd.className = 'tip-h';
      hd.textContent = labels[i];
      tip.appendChild(hd);
      series.forEach((x) => {
        const row = document.createElement('div');
        row.className = 'tip-r';
        const key = document.createElement('i');
        key.style.background = x.color;
        const b = document.createElement('b');
        b.textContent = fmtTip(x.values[i]);
        const l = document.createElement('span');
        l.textContent = x.name;
        row.append(key, b, l);
        tip.appendChild(row);
      });
      tip.hidden = false;
      const br = box.getBoundingClientRect(),
        rr = rect.getBoundingClientRect();
      tip.style.left = `${Math.max(0, Math.min(rr.left - br.left + rr.width / 2 - tip.offsetWidth / 2, br.width - tip.offsetWidth))}px`;
      tip.style.top = '4px';
    };
    const hide = () => {
      tip.hidden = true;
      xh.classList.remove('on');
      $$('.pt', el).forEach((c) => {
        c.classList.remove('on');
      });
    };
    $$('.hit', el).forEach((h) => {
      h.addEventListener('pointerenter', () => show(h));
      h.addEventListener('focus', () => show(h));
      h.addEventListener('blur', hide);
    });
    box.addEventListener('pointerleave', hide);
    return el;
  }

  const money = (v) => fmtNum(Math.round((Number(v) || 0) * 100) / 100);
  const daysTxt = (d) => (d == null ? '—' : d < 1 ? `${Math.max(1, Math.round(d * 24))} ساعة` : `${d.toFixed(1)} يوم`);
  /* التغير عن السنة السابقة: سهم ونص (لا يعتمد على اللون وحده) */
  function delta(cur, prev) {
    if (!prev) return cur ? '<span class="delta">جديد في هذه الفترة</span>' : '';
    const pc = Math.round(((cur - prev) / prev) * 100);
    return `<span class="delta ${pc >= 0 ? 'up' : 'down'}">${pc >= 0 ? '▲' : '▼'} ${Math.abs(pc)}% عن الفترة السابقة</span>`;
  }
  /* الفترة المختارة في لوحة المؤشرات، وأسماء شهورها */
  const periodTxt = (a, b) => `من ${fmtDate(a)} إلى ${fmtDate(b)}`;
  const dPeriod = (d) => periodTxt(d.from, d.to);
  const monthLabels = (d) => {
    const multi = d.monthKeys.length && d.monthKeys[0].slice(0, 4) !== d.monthKeys[d.monthKeys.length - 1].slice(0, 4);
    return d.monthKeys.map((k) => `${MONTHS[Number(k.slice(5, 7)) - 1]}${multi ? ` ${k.slice(0, 4)}` : ''}`);
  };
  const monthShort = (d) => d.monthKeys.map((k) => Number(k.slice(5, 7)));
  const dashQs = (d) => `from=${d.from}&to=${d.to}&branch=${encodeURIComponent(d.branch)}&type=${encodeURIComponent(d.type || '')}`;
  const STATUS_AR = [
    ['approved', 'معتمد'],
    ['pending', 'قيد الاعتماد'],
    ['returned', 'معاد للتعديل'],
    ['rejected', 'مرفوض'],
    ['cancelled', 'ملغي'],
  ];
  Object.assign(S, {
    SITE_IC,
    loadLeaflet,
    mapLayers,
    parseLatLng,
    sitePin,
    IMG_EXT,
    extOf,
    SERIES,
    money,
    daysTxt,
    periodTxt,
    dPeriod,
    monthLabels,
    monthShort,
    dashQs,
    STATUS_AR,
  });
})((window.SES_APP = window.SES_APP || {}));
