// الرسم الإنشائي للمنشآت: قراءة وصف المبنى بالعربي (المقاسات، عدد الغرف، أماكنها وأسماؤها) → توزيع الغرف → مخطط SVG
// يعمل في المتصفح (window.PLAN) وفي Node (للاختبار) بنفس الكود
(function (root) {
  'use strict';
  /* المفردات: plan-words.js (تُحمَّل قبله في المتصفح) */
  const { AR_DIG, WORD_NUM, ROLES, POS } = typeof module !== 'undefined' && module.exports ? require('./plan-words.js') : root.PLAN_WORDS;
  const norm = (s) =>
    String(s || '')
      .replace(/[٠-٩٫]/g, (d) => AR_DIG[d])
      .replace(/[إأآ]/g, 'ا')
      .replace(/(^|[\s:،,])لل(?=\S{2,})/g, '$1ال')
      .replace(/\s+/g, ' ')
      .trim();
  const num = (s) => {
    const n = parseFloat(String(s).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  /* قراءة الوصف: { w, l, count, rooms: [{ name, pos: [] }], notes: [] } */
  function parse(text) {
    /* حالة الصفحة: ما يتغير بعد العرض (w، l، m، count، typedCount) */
    const pageState = {};
    const t = norm(text),
      notes = [];
    pageState.w = null;
    pageState.l = null;
    const N = '(\\d+(?:[.,]\\d+)?)';
    const UNIT = '\\s*(?:م(?:تر)?\\b|متر|م)?\\s*';
    pageState.m = undefined;
    if ((pageState.m = new RegExp(`${N}${UNIT}(?:عرض)`).exec(t)) || (pageState.m = new RegExp(`عرض(?:ه|ها)?${UNIT}${N}`).exec(t)))
      pageState.w = num(pageState.m[1]);
    if ((pageState.m = new RegExp(`${N}${UNIT}(?:طول)`).exec(t)) || (pageState.m = new RegExp(`طول(?:ه|ها)?${UNIT}${N}`).exec(t)))
      pageState.l = num(pageState.m[1]);
    if (
      ((pageState.w == null || pageState.l == null) && (pageState.m = new RegExp(`${N}${UNIT}[x×*\\*]\\s*${N}`, 'i').exec(t))) ||
      ((pageState.w == null || pageState.l == null) && (pageState.m = new RegExp(`${N}${UNIT}في\\s*${N}`).exec(t)))
    ) {
      if (pageState.w == null) pageState.w = num(pageState.m[1]);
      if (pageState.l == null) pageState.l = num(pageState.m[2]);
    }
    if (pageState.w == null || pageState.l == null) notes.push('لم أجد المقاسات كاملة (العرض والطول) — اكتب مثلاً: 4م عرض × 6م طول');
    /* عدد الغرف المعلن */
    pageState.count = null;
    if ((pageState.m = /(\d+)\s*(?:غرف|غرفة|غرفه|حجرات|اوض)/.exec(t))) pageState.count = parseInt(pageState.m[1], 10);
    else if (
      (pageState.m = /(?:مقسم|مقسوم|فيه|به|يحتوي)\s*(?:الى|إلى|على)?\s*(\S+)\s*(?:غرف|غرفة|غرفه)/.exec(t)) &&
      WORD_NUM[pageState.m[1]]
    )
      pageState.count = WORD_NUM[pageState.m[1]];
    else if (/(?:^|\s)(?:ال)?(?:غرفتين|غرفتان)(?:\s|$)/.test(t) && !/(?:وحد|واحد|الاولى|الأولى)/.test(t)) pageState.count = 2;
    /* الجمل: تقسيم عند الفواصل و«و» قبل كلمة غرفة / الغرفة */
    const roleWords = [...new Set(ROLES.map((r) => r.replace(/^ال/, '').split(' ')[0]))].join('|');
    const clauses = t
      .split(new RegExp(`[،,؛;:.\\n]|\\s+و(?=\\s*(?:ال)?(?:غرف|${roleWords}))|\\s+ثم\\s+`))
      .map((x) => x.trim())
      .filter(Boolean);
    const rooms = [];
    pageState.typedCount = 0;
    parsePart3(clauses, pageState, rooms);
    /* أسماء مكررة لنفس الغرفة (ذُكرت مرتين) تُدمج */
    const out = [];
    parsePart(out, rooms);
    if (pageState.typedCount && pageState.count === pageState.typedCount) pageState.count = null;
    return parsePart2(pageState.count, pageState.l, notes, out, pageState.w);
  }
  /* جزء من parse: const roleIn = (s) => {… */
  function parsePart3(clauses, pageState, rooms) {
    const roleIn = (s) => {
      const r = ROLES.filter((x) => s.includes(x)).sort((a, b) => b.length - a.length)[0];
      return r || '';
    };
    const nice = (s) => s.trim();
    const DIMS = new RegExp(`\\d\\s*(?:م(?:تر)?)?\\s*(?:[x×*]|في)\\s*\\d|عرض|طول`);
    for (const c of clauses) {
      if (/(?:مقسم|مقسوم)\s/.test(c) && !/(?:يمين|يسار|شمال|امام|خلف|وسط)/.test(c) && !/(?:وحد|واحد|الاولى|الثانية|التانية)/.test(c))
        continue;
      /* جملة المقاسات («مكتب 5 في 3 متر غرفتين») تصف المبنى نفسه وليست غرفة */
      if (
        DIMS.test(c) &&
        !POS.some(([, re]) => re.test(c)) &&
        !/(?:\d+|\S+)\s*(?:غرف|غرفة|غرفه)\s+(?:نوم|مكاتب|اجتماعات|عمال|موظفين|ضيوف)/.test(c)
      )
        continue;
      const hasRoomWord = /غرف|حجر|اوض/.test(c);
      /* «غرفتين وحدة مخزن والثانية مختبر» / «الغرفتين: الأولى ... والثانية ...» */
      const typed = /(\d+|\S+)\s*(?:غرف|غرفة|غرفه)\s+(نوم|مكاتب|مكتب|اجتماعات|سكن|عمال|موظفين|ضيوف)/.exec(c);
      if (typed && (parseInt(typed[1], 10) || WORD_NUM[typed[1]])) {
        const k = parseInt(typed[1], 10) || WORD_NUM[typed[1]];
        const label =
          { مكاتب: 'مكتب', مكتب: 'مكتب', عمال: 'سكن عمال', موظفين: 'سكن موظفين', ضيوف: 'غرفة ضيوف', سكن: 'غرفة سكن' }[typed[2]] ||
          `غرفة ${typed[2]}`;
        for (let q = 1; q <= Math.min(k, 30); q++)
          rooms.push({ name: k > 1 ? `${label} ${q}` : label, pos: POS.filter(([, re]) => re.test(c)).map(([kk]) => kk) });
        pageState.typedCount += k;
        continue;
      }
      const multi = /(?:وحد[هة]|واحد[هة]?|الاولى|الأولى)\s+(.+?)\s+و\s*(?:ال)?(?:ثاني[هة]|تاني[هة]|اخرى|أخرى|التانيه|الثانيه)\s+(.+)/.exec(
        c,
      );
      if (multi) {
        [multi[1], multi[2]].forEach((x) => rooms.push({ name: nice(roleIn(x) || x.trim().split(' ').slice(0, 3).join(' ')), pos: [] }));
        continue;
      }
      const pos = POS.filter(([, re]) => re.test(c)).map(([k]) => k);
      const role = roleIn(c);
      if (!hasRoomWord && !role) continue;
      let name = role;
      if (!name) {
        /* الاسم بعد عبارة المكان: «غرفة على اليمين للمحاسب» */
        let rest = c;
        POS.forEach(([, re]) => {
          rest = rest.replace(re, ' ');
        });
        rest = rest
          .replace(/(?:ال)?غرف[هة]?|غرف|حجر[هة]|اوض[هة]|على|في|من|ل(?=ل)|\d+|م\b|متر/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        name = rest
          .split(' ')
          .filter((x) => x.length > 1)
          .slice(0, 3)
          .join(' ');
      }
      name = nice(name.replace(/^ل(?=ل)/, '').replace(/^لل/, 'ال'));
      if (!name && !pos.length) continue;
      rooms.push({ name: name || 'غرفة', pos });
    }
  }
  /* جزء من parse: if (count && out.length < count) for (let i = out.… */
  function parsePart2(count, l, notes, out, w) {
    if (count && out.length < count) for (let i = out.length; i < count; i++) out.push({ name: `غرفة ${i + 1}`, pos: [] });
    if (count && out.length > count) notes.push(`الوصف يذكر ${count} غرف لكن وُجدت ${out.length} — راجع الجدول`);
    if (!out.length) notes.push('لم أتعرف على الغرف — اكتب مثلاً: غرفة على اليمين للمحاسب، وغرفة على اليسار للمدير');
    return { w: w || null, l: l || null, count: out.length, rooms: out, notes };
  }
  /* جزء من parse: const key = (n) => String(n).replace(/^ال/, '');… */
  function parsePart(out, rooms) {
    const key = (n) => String(n).replace(/^ال/, '');
    for (const r of rooms) {
      const d = out.find((x) => key(x.name) === key(r.name) && r.name !== 'غرفة' && !/\d$/.test(r.name));
      if (d) {
        d.pos = [...new Set([...d.pos, ...r.pos])];
        if (r.name.startsWith('ال')) d.name = r.name;
      } else out.push(r);
    }
  }

  /* توزيع الغرف على شبكة: الأعمدة من اليسار لليمين (x) والصفوف من الأمام/المدخل (y=0) للخلف */
  function layout(W, L, rooms) {
    const n = rooms.length;
    if (!n || !(W > 0) || !(L > 0)) return [];
    const cols = n <= 2 ? n : n <= 4 ? 2 : n <= 6 ? 3 : n <= 9 ? 3 : 4;
    const rows = Math.ceil(n / cols);
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    const want = (r) => {
      const p = r.pos || [];
      const c = p.includes('right') ? cols - 1 : p.includes('left') ? 0 : p.includes('center') && cols > 2 ? Math.floor(cols / 2) : null;
      const w = p.includes('front') ? 0 : p.includes('back') ? rows - 1 : p.includes('center') && rows > 2 ? Math.floor(rows / 2) : null;
      return [w, c];
    };
    /* الأولوية للغرف المحددة المكان بالكامل، ثم الجزئي، ثم الباقي */
    const order = rooms
      .map((r, i) => ({ r, i, w: want(r) }))
      .sort((a, b) => b.w.filter((x) => x != null).length - a.w.filter((x) => x != null).length);
    const place = (it) => {
      const [wr, wc] = it.w;
      const cand = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
          if (!grid[y][x]) cand.push([y, x, (wr == null ? 0 : Math.abs(y - wr) * 10) + (wc == null ? 0 : Math.abs(x - wc) * 10) + y * 0.1]);
      cand.sort((a, b) => a[2] - b[2]);
      const [y, x] = cand[0];
      grid[y][x] = it;
    };
    order.forEach(place);
    const out = [];
    const rh = L / rows;
    for (let y = 0; y < rows; y++) {
      const cells = grid[y].map((it, x) => [it, x]).filter(([it]) => it);
      /* صف ناقص: الغرف تأخذ العرض كله */
      const full = cells.length < cols;
      const cw = W / (full ? cells.length : cols);
      cells.forEach(([it, x], k) => {
        const cx = full ? k : x;
        /* الحدود تُقرّب ثم يُحسب المقاس منها حتى لا يظهر تداخل وهمي (2.67 + 2.67 ≠ 5.33) */
        const x0 = r2(cx * cw),
          x1 = r2((cx + 1) * cw),
          y0 = r2(y * rh),
          y1 = r2((y + 1) * rh);
        out[it.i] = { ...it.r, x: x0, y: y0, w: r2(x1 - x0), h: r2(y1 - y0) };
      });
    }
    return out;
  }
  const r2 = (n) => Math.round(n * 100) / 100;

  /* ---------- قوالب جاهزة تُسحب إلى الرسم: [النوع، الاسم، العرض، الطول، اللون] (المقاسات بالمتر، قابلة للتعديل من كل الأطراف) ---------- */
  const BLOCKS = [
    ['room', 'غرفة', 4, 4, '#eef2ff'],
    ['bed', 'غرفة نوم', 4, 4, '#f5f3ff'],
    ['office', 'مكتب', 3.5, 4, '#ecfdf5'],
    ['majlis', 'مجلس / صالة', 5, 6, '#fff7ed'],
    ['reception', 'استقبال', 4, 5, '#fdf2f8'],
    ['meeting', 'اجتماعات', 4, 6, '#f0f9ff'],
    ['lab', 'مختبر', 5, 5, '#f0fdfa'],
    ['store', 'مخزن', 3, 3, '#fefce8'],
    ['kitchen', 'مطبخ', 3, 3.5, '#fff1f2'],
    ['bath', 'حمام', 2, 2.5, '#e0f2fe'],
    ['corridor', 'ممر', 1.5, 6, '#f1f5f9'],
    ['stairs', 'سلم', 2.5, 4.5, '#e2e8f0'],
    ['prayer', 'مصلى', 4, 4, '#ecfccb'],
    ['laundry', 'غسيل', 2.5, 2.5, '#e0e7ff'],
    ['garage', 'موقف / كراج', 3, 6, '#f8fafc'],
  ];
  const BLOCK = Object.fromEntries(BLOCKS.map((b) => [b[0], b]));
  /* أبعاد الرسم (لتحويل إحداثيات الفأرة إلى أمتار في المحرر) */
  function geom(plan) {
    const W = Number(plan.w) || 0,
      L = Number(plan.l) || 0;
    const S = Math.min(560 / W, 440 / L),
      pad = 70,
      top = 96;
    return { W, L, S, pad, top, PW: W * S + pad * 2, PH: L * S + top + pad + 30 };
  }
  /* اسم القالب الجديد: «حمام» ثم «حمام 2»... */
  function blockName(rooms, t) {
    const base = (BLOCK[t] || BLOCK.room)[1];
    const n = rooms.filter((r) => r.name === base || r.name.startsWith(`${base} `)).length;
    return n ? `${base} ${n + 1}` : base;
  }
  const overlaps = (a, b) => a.x < b.x + b.w - 0.001 && b.x < a.x + a.w - 0.001 && a.y < b.y + b.h - 0.001 && b.y < a.y + a.h - 0.001;
  /* إضافة قالب: عند (cx, cy) إن حُدد (مركز القالب)، وإلا في أول مكان فارغ داخل المبنى */
  function addBlock(plan, t, cx, cy) {
    const b = BLOCK[t] || BLOCK.room,
      W = plan.w,
      L = plan.l;
    const w = r2(Math.min(b[2], W)),
      h = r2(Math.min(b[3], L));
    let x, y;
    if (cx != null) {
      x = r2(Math.max(0, Math.min(W - w, Math.round((cx - w / 2) * 4) / 4)));
      y = r2(Math.max(0, Math.min(L - h, Math.round((cy - h / 2) * 4) / 4)));
    } else {
      outer: for (let yy = 0; yy + h <= L + 0.001; yy += 0.5)
        for (let xx = 0; xx + w <= W + 0.001; xx += 0.5) {
          const c = { x: xx, y: yy, w, h };
          if (!(plan.rooms || []).some((o) => overlaps(c, o))) {
            x = r2(xx);
            y = r2(yy);
            break outer;
          }
        }
      if (x == null) {
        x = r2((W - w) / 2);
        y = r2((L - h) / 2);
      }
    }
    return { name: blockName(plan.rooms || [], t), t: b[0], x, y, w, h };
  }

  /* باب محدد يدوياً: door = { s: front|back|left|right|none, at: موضع منتصف الباب على الجدار (0..1), flip: عكس جهة المفصلة } */
  const DOOR_SIDES = ['front', 'back', 'left', 'right'];
  function doorSvg(r, X, Y, S) {
    const d = r.door || {},
      s = d.s,
      len = s === 'front' || s === 'back' ? r.w : r.h;
    const dwM = Math.min(0.9, len * 0.45),
      at = Math.max(dwM / 2 / len, Math.min(1 - dwM / 2 / len, Number(d.at) >= 0 ? Number(d.at) : 0.5));
    const c = at * len,
      a = c - dwM / 2,
      b = c + dwM / 2,
      dw = dwM * S;
    /* طرفا الفتحة على الجدار (بكسل) والاتجاه للداخل */
    let P1, P2, n;
    if (s === 'front') {
      P1 = [X(r.x + a), Y(r.y)];
      P2 = [X(r.x + b), Y(r.y)];
      n = [0, -1];
    } else if (s === 'back') {
      P1 = [X(r.x + a), Y(r.y + r.h)];
      P2 = [X(r.x + b), Y(r.y + r.h)];
      n = [0, 1];
    } else if (s === 'left') {
      P1 = [X(r.x), Y(r.y + a)];
      P2 = [X(r.x), Y(r.y + b)];
      n = [1, 0];
    } else if (s === 'right') {
      P1 = [X(r.x + r.w), Y(r.y + a)];
      P2 = [X(r.x + r.w), Y(r.y + b)];
      n = [-1, 0];
    } else return '';
    const H = d.flip ? P2 : P1,
      O = d.flip ? P1 : P2,
      E = [H[0] + n[0] * dw, H[1] + n[1] * dw];
    const cross = (E[0] - H[0]) * (O[1] - H[1]) - (E[1] - H[1]) * (O[0] - H[0]);
    return (
      `<g pointer-events="none"><line x1="${P1[0]}" y1="${P1[1]}" x2="${P2[0]}" y2="${P2[1]}" stroke="#fff" stroke-width="5"/>` +
      `<line x1="${H[0]}" y1="${H[1]}" x2="${E[0]}" y2="${E[1]}" stroke="#475569" stroke-width="2"/>` +
      `<path d="M${E[0]} ${E[1]} A${dw} ${dw} 0 0 ${cross > 0 ? 1 : 0} ${O[0]} ${O[1]}" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3 2"/></g>`
    );
  }
  /* تدوير الغرفة 90° مع عقارب الساعة حول منتصفها (يبقى داخل المبنى) ويدور الباب معها */
  function rotate(plan, i) {
    const r = plan.rooms[i];
    if (!r) return;
    const cx = r.x + r.w / 2,
      cy = r.y + r.h / 2,
      w = Math.min(r.h, plan.w),
      h = Math.min(r.w, plan.l);
    r.x = r2(Math.max(0, Math.min(plan.w - w, Math.round((cx - w / 2) * 4) / 4)));
    r.y = r2(Math.max(0, Math.min(plan.l - h, Math.round((cy - h / 2) * 4) / 4)));
    r.w = r2(w);
    r.h = r2(h);
    /* مع عقارب الساعة على الرسم: الأمام ← اليسار ← الخلف ← اليمين ← الأمام */
    if (r.door && r.door.s !== 'none') {
      const nx = { front: 'left', left: 'back', back: 'right', right: 'front' }[r.door.s];
      /* الموضع يُقاس يساراً←يميناً للأمام والخلف، وأماماً←خلفاً للجانبين؛ عند الدوران من الأمام/الخلف ينعكس القياس فتنعكس المفصلة معه */
      const flipAt = r.door.s === 'front' || r.door.s === 'back';
      const at = r.door.at ?? 0.5;
      r.door = { ...r.door, s: nx, at: flipAt ? r2(1 - at) : at, flip: flipAt ? !r.door.flip : !!r.door.flip };
    }
  }

  /* رموز داخل القالب (سلم، حمام، مطبخ، ممر، غرفة نوم) — للتوضيح فقط */
  function symbol(r, X, Y, S) {
    const x0 = X(r.x),
      y0 = Y(r.y + r.h),
      w = r.w * S,
      h = r.h * S,
      st = 'stroke="#94a3b8" stroke-width="1.2" fill="none"';
    if (w < 26 || h < 26) return '';
    if (r.t === 'stairs') {
      const vert = h >= w,
        n = Math.max(3, Math.floor((vert ? r.h : r.w) / 0.3));
      let s = '';
      for (let k = 1; k < n; k++)
        s += vert
          ? `<line x1="${x0}" y1="${y0 + (h * k) / n}" x2="${x0 + w}" y2="${y0 + (h * k) / n}" ${st}/>`
          : `<line x1="${x0 + (w * k) / n}" y1="${y0}" x2="${x0 + (w * k) / n}" y2="${y0 + h}" ${st}/>`;
      s += vert
        ? `<path d="M${x0 + w / 2} ${y0 + h - 6} V${y0 + 8} m-5 7 l5 -7 l5 7" stroke="#64748b" stroke-width="1.6" fill="none"/>`
        : `<path d="M${x0 + 6} ${y0 + h / 2} H${x0 + w - 8} m-7 -5 l7 5 l-7 5" stroke="#64748b" stroke-width="1.6" fill="none"/>`;
      return s;
    }
    if (r.t === 'bath') {
      const u = Math.min(w, h) / 4;
      return (
        `<ellipse cx="${x0 + u * 1.2}" cy="${y0 + u * 1.1}" rx="${u * 0.55}" ry="${u * 0.75}" ${st}/><rect x="${x0 + u * 0.75}" y="${y0 + 3}" width="${u * 0.9}" height="${u * 0.35}" ${st}/>` +
        `<rect x="${x0 + w - u * 1.5}" y="${y0 + 4}" width="${u * 1.1}" height="${u * 0.8}" rx="3" ${st}/><circle cx="${x0 + w - u * 0.95}" cy="${y0 + 4 + u * 0.4}" r="${u * 0.2}" ${st}/>`
      );
    }
    if (r.t === 'kitchen') {
      const d = Math.min(0.6 * S, h / 3);
      return `<rect x="${x0 + 3}" y="${y0 + 3}" width="${w - 6}" height="${d}" ${st}/><circle cx="${x0 + w * 0.3}" cy="${y0 + 3 + d / 2}" r="${d * 0.28}" ${st}/><circle cx="${x0 + w * 0.65}" cy="${y0 + 3 + d / 2}" r="${d * 0.22}" ${st}/><circle cx="${x0 + w * 0.78}" cy="${y0 + 3 + d / 2}" r="${d * 0.22}" ${st}/>`;
    }
    if (r.t === 'corridor')
      return h >= w
        ? `<line x1="${x0 + w / 2}" y1="${y0 + 6}" x2="${x0 + w / 2}" y2="${y0 + h - 6}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6 5"/>`
        : `<line x1="${x0 + 6}" y1="${y0 + h / 2}" x2="${x0 + w - 6}" y2="${y0 + h / 2}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6 5"/>`;
    if (r.t === 'bed') {
      const bw = Math.min(1.6 * S, w * 0.5),
        bh = Math.min(2 * S, h * 0.55);
      return `<rect x="${x0 + (w - bw) / 2}" y="${y0 + 4}" width="${bw}" height="${bh}" rx="3" ${st}/><rect x="${x0 + (w - bw) / 2 + 4}" y="${y0 + 8}" width="${bw - 8}" height="${Math.min(14, bh * 0.2)}" rx="3" ${st}/>`;
    }
    return '';
  }

  /* مخطط SVG: الجدران، الغرف بأسمائها ومساحاتها، أبعاد المبنى، والمدخل في الواجهة الأمامية (أسفل الرسم)
   * opt.edit: مقابض تغيير المقاس من كل الأطراف للغرفة المختارة (محرر السحب) */
  function svg(plan, opt = {}) {
    /* حالة الصفحة: ما يتغير بعد العرض (g) */
    const vs = {};
    const W = Number(plan.w) || 0,
      L = Number(plan.l) || 0;
    if (!(W > 0 && L > 0)) return '';
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const { S, pad, top, PW, PH } = geom(plan);
    const X = (x) => pad + x * S,
      Y = (y) => top + (L - y) * S;
    const fs = Math.max(10, Math.min(16, S * 0.45));
    svgPart3(L, S, W, X, Y, esc, fs, opt, plan, vs);
    /* خطوط الأبعاد */
    const dim = (x1, y1, x2, y2, label, vertical) => {
      const tick = 6;
      let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#475569" stroke-width="1"/>`;
      s += vertical
        ? `<line x1="${x1 - tick}" y1="${y1}" x2="${x1 + tick}" y2="${y1}" stroke="#475569"/><line x1="${x2 - tick}" y1="${y2}" x2="${x2 + tick}" y2="${y2}" stroke="#475569"/>`
        : `<line x1="${x1}" y1="${y1 - tick}" x2="${x1}" y2="${y1 + tick}" stroke="#475569"/><line x1="${x2}" y1="${y2 - tick}" x2="${x2}" y2="${y2 + tick}" stroke="#475569"/>`;
      const mx = (x1 + x2) / 2,
        my = (y1 + y2) / 2;
      s += vertical
        ? `<text x="${mx - 10}" y="${my}" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a" transform="rotate(-90 ${mx - 10} ${my})" direction="ltr">${label}</text>`
        : `<text x="${mx}" y="${my - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a" direction="ltr">${label}</text>`;
      return s;
    };
    vs.g += dim(X(0), Y(L) - 28, X(W), Y(L) - 28, `العرض ${W} م`, false);
    vs.g += dim(X(0) - 30, Y(L), X(0) - 30, Y(0), `الطول ${L} م`, true);
    /* مقابض الغرفة المختارة: الأضلاع الأربعة والأركان (n = الخلف أعلى الرسم، s = الأمام) */
    const sr = opt.edit && (plan.rooms || [])[opt.sel];
    if (sr) {
      const x = X(sr.x),
        y = Y(sr.y + sr.h),
        w = sr.w * S,
        h = sr.h * S,
        k = 11;
      const H = [
        ['nw', x, y],
        ['n', x + w / 2, y],
        ['ne', x + w, y],
        ['e', x + w, y + h / 2],
        ['se', x + w, y + h],
        ['s', x + w / 2, y + h],
        ['sw', x, y + h],
        ['w', x, y + h / 2],
      ];
      const CUR = { n: 'ns', s: 'ns', e: 'ew', w: 'ew', ne: 'nesw', sw: 'nesw', nw: 'nwse', se: 'nwse' };
      vs.g += H.map(
        ([d, hx, hy]) =>
          `<rect data-h="${d}" x="${hx - k / 2}" y="${hy - k / 2}" width="${k}" height="${k}" rx="2" fill="#fff" stroke="#dc2626" stroke-width="2" style="cursor:${CUR[d]}-resize"/>`,
      ).join('');
      /* المقاس فوق الغرفة أثناء التحرير */
      vs.g += `<g pointer-events="none"><rect x="${x + w / 2 - 46}" y="${y - 30}" width="92" height="20" rx="10" fill="#0f172a" opacity=".85"/><text x="${x + w / 2}" y="${y - 16}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" direction="ltr" unicode-bidi="embed">${sr.w} × ${sr.h} م</text></g>`;
    }
    return svgPart2(PH, PW, esc, vs.g, opt);
  }
  /* جزء من svg: const cols = ['#eef2ff', '#ecfdf5', '#fff7ed', '#f… */
  function svgPart3(L, S, W, X, Y, esc, fs, opt, plan, vs) {
    const cols = ['#eef2ff', '#ecfdf5', '#fff7ed', '#fdf2f8', '#f0f9ff', '#fefce8', '#f5f3ff', '#f0fdfa'];
    const bad = new Set();
    svgPart(bad, opt, plan);
    vs.g = `<rect x="${X(0)}" y="${Y(L)}" width="${W * S}" height="${L * S}" fill="#fff"/>`;
    /* شبكة كل متر في المحرر */
    if (opt.edit) {
      for (let k = 1; k < W; k++)
        vs.g += `<line x1="${X(k)}" y1="${Y(L)}" x2="${X(k)}" y2="${Y(0)}" stroke="#eef2f7" stroke-width="1" pointer-events="none"/>`;
      for (let k = 1; k < L; k++)
        vs.g += `<line x1="${X(0)}" y1="${Y(k)}" x2="${X(W)}" y2="${Y(k)}" stroke="#eef2f7" stroke-width="1" pointer-events="none"/>`;
    }
    /* الغرفة المختارة تُرسم أخيراً لتظهر فوق غيرها أثناء السحب */
    const rs0 = plan.rooms || [];
    rs0
      .map((r, i) => [r, i])
      .sort((a, b) => (a[1] === opt.sel) - (b[1] === opt.sel))
      .forEach(([r, i]) => {
        const x = X(r.x),
          y = Y(r.y + r.h),
          w = r.w * S,
          h = r.h * S;
        const area = Math.round(r.w * r.h * 10) / 10;
        const sel = opt.sel === i;
        const fill = sel ? '#fde68a' : bad.has(i) ? '#fecaca' : BLOCK[r.t] ? BLOCK[r.t][4] : cols[i % cols.length];
        vs.g += `<rect data-i="${i}" x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${sel ? '#dc2626' : bad.has(i) ? '#dc2626' : '#334155'}" stroke-width="${sel ? 4 : 2}"${opt.edit ? ' style="cursor:move"' : opt.interactive ? ' style="cursor:pointer"' : ''}/>`;
        vs.g += `<g pointer-events="none">${symbol(r, X, Y, S)}`;
        const small = w < 70 || h < 46;
        vs.g += `<text x="${x + w / 2}" y="${y + h / 2 - (small ? -fs * 0.3 : 2)}" text-anchor="middle" font-size="${small ? fs * 0.8 : fs}" font-weight="700" fill="#0f172a">${esc(r.name)}</text>`;
        if (!small) {
          vs.g += `<text x="${x + w / 2}" y="${y + h / 2 + fs}" text-anchor="middle" font-size="${fs * 0.78}" fill="#475569">${area} م²</text>`;
          vs.g += `<text x="${x + w / 2}" y="${y + h / 2 + fs * 1.9}" text-anchor="middle" font-size="${fs * 0.7}" fill="#64748b" direction="ltr" unicode-bidi="embed">${r.w} × ${r.h}</text>`;
        }
        vs.g += '</g>';
        /* باب داخلي صغير على الضلع المواجه لوسط المبنى */
        const cx = r.x + r.w / 2,
          cy = r.y + r.h / 2,
          dw = Math.min(0.8, r.w * 0.3, r.h * 0.3) * S;
        const towardsX = Math.abs(W / 2 - cx) > Math.abs(L / 2 - cy);
        if (r.door) {
          if (r.door.s !== 'none') vs.g += doorSvg(r, X, Y, S);
        } else if (r.t === 'corridor' || r.t === 'stairs') {
          /* بدون باب داخلي */
        } else if (towardsX && r.w < W) {
          const ex = cx < W / 2 ? X(r.x + r.w) : X(r.x);
          const ey = Y(cy) - dw / 2;
          vs.g += `<line x1="${ex}" y1="${ey}" x2="${ex}" y2="${ey + dw}" stroke="#fff" stroke-width="4" pointer-events="none"/><path d="M${ex} ${ey} A${dw} ${dw} 0 0 ${cx < W / 2 ? 0 : 1} ${ex + (cx < W / 2 ? -dw : dw)} ${ey + dw}" fill="none" stroke="#94a3b8" stroke-width="1" pointer-events="none"/>`;
        } else if (r.h < L) {
          const ey = cy < L / 2 ? Y(r.y + r.h) : Y(r.y);
          const ex = X(cx) - dw / 2;
          vs.g += `<line x1="${ex}" y1="${ey}" x2="${ex + dw}" y2="${ey}" stroke="#fff" stroke-width="4" pointer-events="none"/><path d="M${ex} ${ey} A${dw} ${dw} 0 0 ${cy < L / 2 ? 1 : 0} ${ex + dw} ${ey + (cy < L / 2 ? dw : -dw)}" fill="none" stroke="#94a3b8" stroke-width="1" pointer-events="none"/>`;
        }
      });
    /* الجدار الخارجي */
    vs.g += `<rect x="${X(0)}" y="${Y(L)}" width="${W * S}" height="${L * S}" fill="none" stroke="#0f172a" stroke-width="8"/>`;
    /* المدخل الرئيسي في منتصف الواجهة الأمامية */
    const dW = Math.min(1.2, W * 0.25) * S,
      dx = X(W / 2) - dW / 2,
      dy = Y(0);
    vs.g += `<line x1="${dx}" y1="${dy}" x2="${dx + dW}" y2="${dy}" stroke="#fff" stroke-width="10"/><path d="M${dx} ${dy} A${dW} ${dW} 0 0 1 ${dx + dW} ${dy - dW}" fill="none" stroke="#b91c1c" stroke-width="1.5"/><line x1="${dx}" y1="${dy}" x2="${dx}" y2="${dy - dW}" stroke="#b91c1c" stroke-width="2"/>`;
    vs.g += `<text x="${X(W / 2)}" y="${dy + 34}" text-anchor="middle" font-size="12" font-weight="700" fill="#b91c1c">▲ المدخل (الواجهة)</text>`;
  }
  /* جزء من svg: const title = opt.title… */
  function svgPart2(PH, PW, esc, g, opt) {
    const title = opt.title
      ? `<text x="${PW / 2}" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">${esc(opt.title)}</text>`
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${PW}" height="${PH}" font-family="Tajawal, Tahoma, sans-serif" direction="rtl" role="img" aria-label="${esc(opt.title || 'مخطط المبنى')}"><rect width="${PW}" height="${PH}" fill="#f8fafc"/>${title}${g}<text x="${PW - 12}" y="${PH - 10}" text-anchor="end" font-size="10" fill="#94a3b8">${esc(opt.foot || 'مخطط توضيحي — المقاسات بالمتر')}</text></svg>`;
  }
  /* جزء من svg: if (opt.edit)… */
  function svgPart(bad, opt, plan) {
    if (opt.edit)
      (plan.rooms || []).forEach((r, i) =>
        (plan.rooms || []).forEach((o, j) => {
          if (i !== j && overlaps(r, o)) bad.add(i);
        }),
      );
  }

  /* مشكلات المخطط: غرفة خارج حدود المبنى أو متداخلة مع أخرى */
  function issues(plan) {
    const out = [],
      rs = plan.rooms || [],
      W = Number(plan.w),
      L = Number(plan.l),
      eps = 0.001;
    rs.forEach((r, i) => {
      if (!(r.w > 0 && r.h > 0)) out.push(`«${r.name}»: المقاس غير صحيح`);
      if (r.x < -eps || r.y < -eps || r.x + r.w > W + eps || r.y + r.h > L + eps) out.push(`«${r.name}» خارج حدود المبنى`);
      for (let j = i + 1; j < rs.length; j++) {
        const o = rs[j];
        if (r.x < o.x + o.w - eps && o.x < r.x + r.w - eps && r.y < o.y + o.h - eps && o.y < r.y + r.h - eps)
          out.push(`«${r.name}» متداخلة مع «${o.name}»`);
      }
    });
    return out;
  }

  /* من الوصف مباشرة إلى مخطط */
  function fromText(text, prev) {
    const p = parse(text);
    const W = p.w || (prev && prev.w) || 0,
      L = p.l || (prev && prev.l) || 0;
    return { w: W, l: L, rooms: layout(W, L, p.rooms), notes: p.notes };
  }

  /* ---------- الإدخال بالضغط: قوالب جاهزة، وتقسيم غرفة، ودمج غرفتين متجاورتين ---------- */
  const TEMPLATES = [
    ['one', 'غرفة واحدة'],
    ['two-lr', 'غرفتان (يمين / يسار)'],
    ['two-fb', 'غرفتان (أمام / خلف)'],
    ['four', '4 غرف'],
    ['six', '6 غرف'],
    ['corr', 'ممر في الوسط وغرف على الجانبين'],
  ];
  /* شبكة متساوية: cols أعمدة (يسار ← يمين) و rows صفوف (أمام ← خلف) */
  function grid(W, L, cols, rows) {
    const out = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const x0 = r2((x * W) / cols),
          x1 = r2(((x + 1) * W) / cols),
          y0 = r2((y * L) / rows),
          y1 = r2(((y + 1) * L) / rows);
        out.push({ name: 'غرفة', x: x0, y: y0, w: r2(x1 - x0), h: r2(y1 - y0) });
      }
    return out;
  }
  function template(id, W, L) {
    if (!(W > 0 && L > 0)) return [];
    let rs;
    if (id === 'two-lr') rs = grid(W, L, 2, 1);
    else if (id === 'two-fb') rs = grid(W, L, 1, 2);
    else if (id === 'four') rs = grid(W, L, 2, 2);
    else if (id === 'six') rs = grid(W, L, W >= L ? 3 : 2, W >= L ? 2 : 3);
    else if (id === 'corr') {
      /* ممر بعرض 1.5م (أو ربع العرض) من المدخل للخلف، وغرفتان على كل جانب */
      const cw = r2(Math.min(1.5, W / 4)),
        side = r2((W - cw) / 2),
        half = r2(L / 2);
      rs = [
        { name: 'غرفة', x: 0, y: 0, w: side, h: half },
        { name: 'غرفة', x: 0, y: half, w: side, h: r2(L - half) },
        { name: 'ممر', x: side, y: 0, w: cw, h: L },
        { name: 'غرفة', x: r2(side + cw), y: 0, w: r2(W - side - cw), h: half },
        { name: 'غرفة', x: r2(side + cw), y: half, w: r2(W - side - cw), h: r2(L - half) },
      ];
    } else rs = [{ name: 'غرفة', x: 0, y: 0, w: W, h: L }];
    let n = 0;
    return rs.map((r) => (r.name === 'غرفة' ? { ...r, name: `غرفة ${++n}` } : r));
  }
  /* تقسيم غرفة: dir = 'lr' (يمين / يسار) أو 'fb' (أمام / خلف)، وsize = مقاس الجزء الأيمن / الأمامي بالمتر */
  function split(rooms, i, dir, size) {
    const r = rooms[i];
    if (!r) return rooms;
    const total = dir === 'lr' ? r.w : r.h;
    const a = r2(Number(size) || total / 2);
    if (!(a > 0 && a < total)) throw new Error(`المقاس يجب أن يكون بين 0 و ${total} م`);
    const b = r2(total - a);
    const out = rooms.slice();
    if (dir === 'lr') out.splice(i, 1, { ...r, x: r2(r.x + b), w: a }, { ...r, name: 'غرفة جديدة', x: r.x, w: b });
    else out.splice(i, 1, { ...r, y: r.y, h: a }, { ...r, name: 'غرفة جديدة', y: r2(r.y + a), h: b });
    return out;
  }
  const eq = (a, b) => Math.abs(a - b) < 0.011;
  /* الغرف المجاورة التي تشترك مع الغرفة في ضلع كامل (يمكن دمجها معها) */
  function neighbors(rooms, i) {
    const r = rooms[i],
      out = [];
    rooms.forEach((o, j) => {
      if (j === i) return;
      if (eq(o.y, r.y) && eq(o.h, r.h) && (eq(o.x + o.w, r.x) || eq(r.x + r.w, o.x)))
        out.push({ j, side: eq(o.x + o.w, r.x) ? 'left' : 'right' });
      if (eq(o.x, r.x) && eq(o.w, r.w) && (eq(o.y + o.h, r.y) || eq(r.y + r.h, o.y)))
        out.push({ j, side: eq(o.y + o.h, r.y) ? 'front' : 'back' });
    });
    return out;
  }
  function merge(rooms, i, j) {
    const a = rooms[i],
      b = rooms[j];
    const m = {
      ...a,
      x: r2(Math.min(a.x, b.x)),
      y: r2(Math.min(a.y, b.y)),
      w: eq(a.y, b.y) && eq(a.h, b.h) ? r2(a.w + b.w) : a.w,
      h: eq(a.x, b.x) && eq(a.w, b.w) ? r2(a.h + b.h) : a.h,
    };
    return rooms.filter((_, k) => k !== i && k !== j).concat([m]);
  }

  /* سحب/تغيير مقاس غرفة في المحرر مع الالتصاق بالجدران وحواف الغرف الأخرى (خطوة 0.25 م)
   * mode: 'move' أو اتجاه المقبض (n s e w ne nw se sw)، start: الغرفة قبل السحب، dx/dy: إزاحة الفأرة بالمتر */
  function drag(plan, i, mode, start, dx, dy) {
    const W = plan.w,
      L = plan.l,
      MIN = 0.5,
      SNAP = 0.3;
    const xs = [0, W],
      ys = [0, L];
    plan.rooms.forEach((o, j) => {
      if (j !== i) {
        xs.push(o.x, o.x + o.w);
        ys.push(o.y, o.y + o.h);
      }
    });
    const q = (v) => Math.round(v * 4) / 4;
    const near = (v, list) => {
      let best = null;
      for (const c of list) if (Math.abs(c - v) <= SNAP && (best === null || Math.abs(c - v) < Math.abs(best - v))) best = c;
      return best;
    };
    const sx = (v) => {
      const n = near(v, xs);
      return n !== null ? n : q(v);
    };
    const sy = (v) => {
      const n = near(v, ys);
      return n !== null ? n : q(v);
    };
    let { x, y, w, h } = start;
    if (mode === 'move') {
      let nx = start.x + dx,
        ny = start.y + dy;
      /* يلتصق الضلع الأقرب (الأيسر أو الأيمن / الأمامي أو الخلفي) */
      const a = near(nx, xs),
        b = near(nx + w, xs);
      nx = a !== null && (b === null || Math.abs(a - nx) <= Math.abs(b - nx - w)) ? a : b !== null ? b - w : q(nx);
      const c = near(ny, ys),
        d = near(ny + h, ys);
      ny = c !== null && (d === null || Math.abs(c - ny) <= Math.abs(d - ny - h)) ? c : d !== null ? d - h : q(ny);
      x = Math.max(0, Math.min(W - w, nx));
      y = Math.max(0, Math.min(L - h, ny));
    } else {
      let x1 = x,
        x2 = x + w,
        y1 = y,
        y2 = y + h;
      if (mode.includes('w')) x1 = Math.max(0, Math.min(x2 - MIN, sx(start.x + dx)));
      if (mode.includes('e')) x2 = Math.min(W, Math.max(x1 + MIN, sx(start.x + start.w + dx)));
      if (mode.includes('s')) y1 = Math.max(0, Math.min(y2 - MIN, sy(start.y + dy)));
      if (mode.includes('n')) y2 = Math.min(L, Math.max(y1 + MIN, sy(start.y + start.h + dy)));
      x = x1;
      y = y1;
      w = x2 - x1;
      h = y2 - y1;
    }
    plan.rooms[i] = { ...plan.rooms[i], x: r2(x), y: r2(y), w: r2(w), h: r2(h) };
    return plan.rooms[i];
  }

  const PLAN = {
    parse,
    layout,
    svg,
    issues,
    fromText,
    TEMPLATES,
    template,
    split,
    neighbors,
    merge,
    BLOCKS,
    BLOCK,
    geom,
    addBlock,
    drag,
    rotate,
    DOOR_SIDES,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = PLAN;
  else root.PLAN = PLAN;
})(typeof window !== 'undefined' ? window : this);
