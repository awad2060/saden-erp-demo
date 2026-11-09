/* تسجيل الدخول، ثيمات المناسبات، محرر النموذج، البرامج المدمجة */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc, fmtNum } = SF;
  const { $, $$, state, chip, dt, api, fitLetters } = S;
  Object.assign(S, {
    occasionNow,
    applyOccasion,
    loadPersonal,
    bindPersonal,
    requestsTable,
    bindRows,
    hbars,
    downloadCsv,
    tableRowHtml,
    fieldHtml,
    collect,
    setupMarks,
    uploadFile,
    carAssetSync,
    embedCollect,
    embedRestore,
    embedBasicMissing,
    embedPick,
    embedHide,
    fitFrame,
    fillEmbeds,
    eosToProgram,
  });

  /* ---------- تسجيل الدخول ---------- */
  /* حسابات التواصل الاجتماعي: [المفتاح، الاسم، مثال] — الروابط من الإعدادات العامة */
  const SOCIAL = [
    ['website', 'الموقع الإلكتروني', 'https://example.com'],
    ['x', 'X (تويتر)', 'https://x.com/...'],
    ['linkedin', 'لينكدإن', 'https://linkedin.com/company/...'],
    ['instagram', 'إنستجرام', 'https://instagram.com/...'],
    ['facebook', 'فيسبوك', 'https://facebook.com/...'],
    ['youtube', 'يوتيوب', 'https://youtube.com/@...'],
    ['tiktok', 'تيك توك', 'https://tiktok.com/@...'],
    ['snapchat', 'سناب شات', 'https://snapchat.com/add/...'],
    ['whatsapp', 'واتساب', '966500000000'],
  ];
  const SOCIAL_CLR = {
    website: '#475569',
    x: '#111111',
    linkedin: '#0a66c2',
    instagram: '#d62976',
    facebook: '#1877f2',
    youtube: '#ff0000',
    tiktok: '#111111',
    snapchat: '#e6c200',
    whatsapp: '#25d366',
  };
  const SOC_PATHS = {
    website:
      '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    linkedin:
      '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    youtube:
      '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V3c.5 2.5 2.5 4.5 5 5"/>',
    snapchat:
      '<path d="M12 2a6 6 0 0 0-6 6v3l-2 1 2 1c-.5 2-2 3-4 3.5 1 1 2.5 1 3 1.5L6 20c2 0 3.5.5 6 2 2.5-1.5 4-2 6-2l1-1.5c.5-.5 2-.5 3-1.5-2-.5-3.5-1.5-4-3.5l2-1-2-1V8a6 6 0 0 0-6-6z"/>',
    whatsapp:
      '<path d="M3 21l1.6-4.8A9 9 0 1 1 7.8 19.4z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-.9.9a5 5 0 0 1-2.9-2.9l.9-.9-1-2L9 8.5z"/>',
  };
  const socIcon = (k) =>
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SOC_PATHS[k] || ''}</svg>`;
  /* قيمة النظام: رابط واحد (قديم) أو قائمة { url, label } */
  const socList = (v) =>
    (Array.isArray(v) ? v : v ? [v] : []).map((x) => (typeof x === 'string' ? { url: x } : x)).filter((x) => x && x.url);
  const socialLinks = () => {
    const so = state.config.social || {};
    return SOCIAL.flatMap(([k, l]) =>
      socList(so[k]).map((x) => {
        const href = k === 'whatsapp' ? `https://wa.me/${encodeURIComponent(x.url)}` : x.url,
          t = x.label ? `${l} — ${x.label}` : l;
        return `<a class="soc-ic" style="--sc:${SOCIAL_CLR[k]}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="${esc(t)}" aria-label="${esc(t)}">${socIcon(k)}</a>`;
      }),
    ).join('');
  };
  /* ---------- ثيمات المناسبات: تتغير تلقائياً بحلول المناسبة (التقويم الميلادي وأم القرى الهجري) ---------- */
  const OCC = {
    national: { name: 'اليوم الوطني السعودي', icon: '💚' },
    founding: { name: 'يوم التأسيس', icon: '🌴' },
    flag: { name: 'يوم العلم', icon: '💚' },
    ramadan: { name: 'شهر رمضان', icon: '🌙' },
    fitr: { name: 'عيد الفطر', icon: '🎉' },
    adha: { name: 'عيد الأضحى', icon: '🎉' },
    hijri: { name: 'رأس السنة الهجرية', icon: '🌙' },
  };
  /* المناسبة الحالية من السيرفر (state.config.occasion)، أو المعاينة من الرابط ?occ=ramadan */
  function occasionNow() {
    const o = state.occPreview || (state.config && state.config.occasion);
    return o && (o.theme || OCC[o.id]) ? o : null;
  }
  /* تطبيق ثيم المناسبة على النظام كلها: لون مميز، شريط علوي ملون، وتهنئة */
  function applyOccasion() {
    const o = occasionNow(),
      root = document.documentElement;
    if (!o) {
      delete root.dataset.occ;
      ['--occ-g1', '--occ-g2', '--occ-g3', '--occ-accent'].forEach((k) => root.style.removeProperty(k));
      return;
    }
    root.dataset.occ = o.theme || o.id;
    (o.grad || []).forEach((c, i) => root.style.setProperty(`--occ-g${i + 1}`, c));
    if (o.accent) root.style.setProperty('--occ-accent', o.accent);
  }
  const occChip = () => {
    const o = occasionNow(),
      p = state.personal;
    return (
      (p ? `<button type="button" class="occ-chip occ-me" data-personal title="${esc(p.title)}">${esc(p.chip)}</button>` : '') +
      (o ? `<span class="occ-chip" title="${esc(o.name)}">${esc(o.chip)}</span>` : '')
    );
  };
  /* المناسبة الشخصية (عيد الميلاد / ذكرى الانضمام): تُجلب بعد الدخول مرة في اليوم، وتظهر نافذة تهنئة أول مرة فقط */
  async function loadPersonal() {
    const day = new Date().toDateString();
    if (!state.user || state.personalDay === `${day}:${state.user.id}`) return;
    state.personalDay = `${day}:${state.user.id}`;
    state.personal = null;
    let pv = '';
    try {
      pv = new URLSearchParams(location.search).get('occ') || '';
    } catch {
      /* تجاهل */
    }
    try {
      const r = await api('GET', `/api/occasion${pv === 'birthday' || pv === 'anniversary' ? `?preview=${pv}` : ''}`);
      state.personal = r.personal || null;
    } catch {
      state.personal = null;
    }
    const tb = document.querySelector('.topbar');
    if (tb && state.personal && !tb.querySelector('[data-personal]')) {
      tb.insertAdjacentHTML('afterbegin', occChip().replace(/<span class="occ-chip"[\s\S]*$/, ''));
      bindPersonal();
    }
    let seen = '';
    const key = `personal:${state.user.id}:${state.personal && state.personal.kind}:${day}`;
    try {
      seen = localStorage.getItem(key);
    } catch {
      /* تجاهل */
    }
    if (state.personal && (!seen || pv)) {
      try {
        localStorage.setItem(key, '1');
      } catch {
        /* تجاهل */
      }
      personalModal();
    }
  }
  function bindPersonal() {
    document.querySelectorAll('[data-personal]').forEach((b) => {
      b.onclick = () => personalModal();
    });
  }
  function personalModal() {
    const p = state.personal;
    if (!p) return;
    const cols = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];
    const bits = Array.from(
      { length: 46 },
      (_, i) =>
        `<i style="left:${(Math.random() * 100).toFixed(1)}%;--c:${cols[i % cols.length]};animation-delay:${(Math.random() * 1.2).toFixed(2)}s;--w:${(5 + Math.random() * 6).toFixed(1)}px"></i>`,
    ).join('');
    const bg = document.createElement('div');
    bg.className = 'modal-bg pm-bg';
    bg.innerHTML = `<div class="pm-cf" aria-hidden="true">${bits}</div><div class="modal pm" role="dialog" aria-modal="true" aria-label="${esc(p.title)}">
      <div class="pm-ic" aria-hidden="true">${esc(p.icon)}</div><h2>${esc(p.title)}</h2><p>${esc(p.sub)}</p>
      <button type="button" class="btn primary" data-x>شكراً 🌹</button></div>`;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.querySelector('[data-x]').onclick = close;
    bg.onclick = (e) => {
      if (e.target === bg) close();
    };
    bg.querySelector('[data-x]').focus();
  }
  S.loginRemember = false;

  /* ---------- طلبات الحسابات (لمدير النظام) ---------- */

  /* ---------- الرئيسية ---------- */

  function requestsTable(list) {
    if (!list.length) return '<div class="empty">لا توجد طلبات</div>';
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>رقم الطلب</th><th>نوع الطلب</th><th>البيان</th><th>الفرع</th><th>المبلغ</th><th>مقدم الطلب</th><th>آخر تحديث</th><th>الحالة</th></tr></thead><tbody>
      ${list.map((r) => `<tr class="click" data-id="${esc(r.id)}"><td class="num"><b dir="ltr">${esc(r.serial)}</b></td><td>${esc(r.typeTitle)}</td><td>${esc(r.summary)}</td><td>${esc(r.branch)}</td><td class="num">${r.amount ? esc(fmtNum(r.amount)) : '—'}</td><td>${esc(r.createdByName)}</td><td class="num muted">${esc(dt(r.updatedAt))}</td><td>${chip(r)}</td></tr>`).join('')}
    </tbody></table></div>`;
  }
  function bindRows(el) {
    $$('tr.click', el).forEach((tr) => {
      tr.onclick = () => {
        location.hash = `#/req/${tr.dataset.id}`;
      };
    });
  }

  /* أشرطة أفقية بسيطة (لون واحد) */
  function hbars(rows, fmt) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return `<div class="hbars">${rows.map((r) => `<div class="hb-row"><div class="hb-l">${esc(r.label)}</div><div class="hb-track"><div class="hb-bar" style="width:${(r.value / max) * 100}%"></div></div><div class="hb-v">${esc(fmt ? fmt(r.value) : r.value)}</div></div>`).join('')}</div>`;
  }

  /* ---------- قوائم الطلبات ---------- */
  function downloadCsv(name, rows) {
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    a.click();
  }

  /* ---------- اختيار نوع الطلب ---------- */
  /* البحث بالعربي بدون فروق الكتابة: الهمزات، التاء المربوطة، الألف المقصورة، التشكيل والتطويل */
  const normAr = (s) =>
    String(s || '')
      .replace(/[\u064B-\u0652\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  /* أقسام صفحة رفع طلب جديد، وأيقونة ولون كل مجموعة (المجموعات غير المذكورة تظهر في "عام") */
  const NF_SECTIONS = [
    ['fin', 'المالية والرواتب', 'calc', ['البدلات', 'المستحقات', 'المصروفات', 'السلف', 'الخصومات والتصفية']],
    ['hr', 'الموارد البشرية', 'users', ['شئون الموظفين', 'التوظيف']],
    ['ops', 'إدارة العمليات', 'layers', ['إدارة الحركة', 'الورشة', 'قسم الحفر', 'إدارة الجرد']],
    ['gen', 'عام', 'file', []],
  ];
  const NF_GROUP = {
    البدلات: ['briefcase', '#2563eb'],
    المستحقات: ['calc', '#059669'],
    المصروفات: ['receipt', '#d97706'],
    السلف: ['zap', '#7c3aed'],
    'الخصومات والتصفية': ['scale', '#db2777'],
    'شئون الموظفين': ['idCard', '#0891b2'],
    التوظيف: ['users', '#65a30d'],
    'إدارة الحركة': ['car', '#2563eb'],
    الورشة: ['wrench', '#ea580c'],
    'قسم الحفر': ['pickaxe', '#7c3aed'],
    'إدارة الجرد': ['boxes', '#059669'],
  };

  /* ---------- محرر النموذج ---------- */
  function inputHtml(f, value, attrs) {
    const v = value == null ? '' : value;
    if (f.type === 'textarea') return `<textarea class="in" ${attrs} rows="${f.rows || 3}">${esc(v)}</textarea>`;
    if (f.type === 'select')
      return `<select class="in" ${attrs}><option value="">— اختر —</option>${f.options.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    /* قائمة قيمتها رقم المستخدم ونصها الاسم والتخصص (عضو اللجنة الفنية في نموذج التوظيف) */
    if (f.choicesFrom)
      return `<select class="in" ${attrs}><option value="">— اختر —</option>${(state.config[f.choicesFrom] || [])
        .map((o) => (typeof o === 'string' ? { id: o, label: o } : o))
        .map((o) => `<option value="${esc(o.id)}"${o.id === v ? ' selected' : ''}>${esc(o.label)}</option>`)
        .join('')}</select>`;
    const type = f.type === 'number' ? 'number" step="0.01" min="0' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text';
    const list = f.key === 'branch' ? ' list="dl-branches"' : '';
    return `<input class="in" type="${type}" ${attrs}${list}${f.readonly ? ' readonly tabindex="-1"' : ''} value="${esc(v)}">`;
  }
  function tableRowHtml(f, row) {
    /* كل خانة باسمها (يظهر الاسم فوقها في المساحات الضيقة مثل لوحة القرار) */
    return `<div class="trow" style="grid-template-columns:repeat(${f.columns.length},1fr) 30px">${f.columns.map((c) => `<label class="tcell"><small>${esc(c.label)}</small>${inputHtml(c, row[c.key], `data-col="${c.key}" placeholder="${esc(c.label)}" title="${esc(c.label)}"`)}</label>`).join('')}<button type="button" class="btn sm ghost rm" title="حذف">✕</button></div>`;
  }
  /* محاسب الفرع يرفع طلبات فرعه فقط: خانة الفرع بفرع حسابه وغير قابلة للتعديل */
  const lockedBranch = () => (state.user && state.user.role === 'accountant' && state.user.branch ? state.user.branch : '');
  function fieldHtml(f, value) {
    const lbl = `<label>${esc(f.label)}${f.required ? '<span class="req">*</span>' : ''}</label>`;
    if (f.type === 'users') {
      const ids = Array.isArray(value) ? value : [];
      return `<div class="field full" data-users="${f.key}">${lbl}<input type="hidden" data-key="${f.key}" value="${esc(JSON.stringify(ids))}">
        <div class="us-list"></div>
        <div class="row" style="gap:8px;margin-top:6px"><input class="in" list="dl-us-${f.key}" data-us-add placeholder="ابحث بالاسم أو المسمى ثم اختر..." style="flex:1"><datalist id="dl-us-${f.key}">${(state.pickUsers || []).map((u) => `<option value="${esc(`${u.name}${u.title ? ` — ${u.title}` : ''}`)}">`).join('')}</datalist></div>
        ${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
    }
    if (f.picker === 'user' || f.picker === 'anyUser') {
      return `<div class="field">${lbl}<select class="in" data-key="${f.key}"${f.required ? ' required' : ''}><option value="">— اختر —</option>${(state.pickUsers || []).map((u) => `<option value="${esc(u.id)}"${u.id === value ? ' selected' : ''}>${esc(u.name)}${u.title ? ` — ${esc(u.title)}` : ''}${u.branch ? ` (${esc(u.branch)})` : ''}</option>`).join('')}</select>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
    }
    if (f.key === 'branch' && lockedBranch()) {
      return `<div class="field">${lbl}<input class="in" type="text" data-key="branch" value="${esc(lockedBranch())}" readonly tabindex="-1" title="فرعك المسجل في حسابك"><div class="hint">فرعك المسجل في حسابك (غير قابل للتعديل)</div></div>`;
    }
    if (f.type === 'marks') {
      return `<div class="field full" data-marks="${f.key}">${lbl}<input type="hidden" data-key="${f.key}" value="${esc(JSON.stringify(Array.isArray(value) ? value : []))}"><div class="mk-board"></div><div class="mk-list"></div></div>`;
    }
    if (f.type === 'table') {
      const rows = Array.isArray(value) && value.length ? value : [{}];
      /* عناوين الأعمدة فوق الصفوف حتى يظهر مكان كل قيمة */
      const heads = `<div class="thead" style="grid-template-columns:repeat(${f.columns.length},1fr) 30px">${f.columns.map((c) => `<span>${esc(c.label)}</span>`).join('')}<span></span></div>`;
      return `<div class="field full">${lbl}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}<div class="tfield" data-table="${f.key}">${heads}<div class="trows">${rows.map((r) => tableRowHtml(f, r)).join('')}</div><button type="button" class="btn sm add">+ إضافة صف</button></div></div>`;
    }
    if (f.type === 'heading') return `<div class="f-head" data-hkey="${esc(f.key)}">${esc(f.label)}</div>`;
    const full = f.type === 'textarea' || f.full ? ' full' : '';
    return `<div class="field${full}">${lbl}${inputHtml(f, value, `data-key="${f.key}"`)}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
  }
  function collect(form, root) {
    const d = {};
    form.fields
      .filter((f) => !f.hidden)
      .forEach((f) => {
        if (f.type === 'table') {
          d[f.key] = $$(`[data-table="${f.key}"] .trow`, root)
            .map((tr) => {
              const o = {};
              $$('[data-col]', tr).forEach((i) => {
                o[i.dataset.col] = i.value.trim();
              });
              return o;
            })
            .filter((o) => Object.values(o).some(Boolean));
        } else if (f.type === 'marks' || f.type === 'users') {
          const el = $(`[data-key="${f.key}"]`, root);
          try {
            d[f.key] = el ? JSON.parse(el.value || '[]') : [];
          } catch {
            d[f.key] = [];
          }
        } else {
          const el = $(`[data-key="${f.key}"]`, root);
          d[f.key] = el ? el.value.trim() : '';
        }
      });
    return d;
  }
  function setupMarks(root, form) {
    form.fields
      .filter((f) => f.type === 'marks')
      .forEach((f) => {
        const box = $(`[data-marks="${f.key}"]`, root);
        if (!box) return;
        const hidden = $(`[data-key="${f.key}"]`, box),
          board = $('.mk-board', box),
          list = $('.mk-list', box);
        let marks = [];
        try {
          marks = JSON.parse(hidden.value || '[]');
        } catch {
          marks = [];
        }
        const sync = () => {
          hidden.value = JSON.stringify(marks);
          hidden.dispatchEvent(new Event('input', { bubbles: true }));
        };
        const src = () => {
          const t = $(`[data-key="${f.imgFrom}"]`, root);
          return (f.images || {})[t ? t.value : ''];
        };
        const draw = (focus) => {
          const img = src();
          if (!img) {
            board.innerHTML =
              '<div class="hint">اختر فئة المركبة لتظهر الرسمة (المعدة بدون رسمة، اكتب ملاحظاتها في الملاحظات العامة)</div>';
            list.innerHTML = '';
            return;
          }
          board.innerHTML = `<div class="mk-pic"><img src="${img}" alt="" draggable="false">${marks.map((m, i) => `<span class="mk-pin" data-pin="${i}" style="left:${m.x}%;top:${m.y}%" title="حذف العلامة ${i + 1}">${i + 1}</span>`).join('')}</div>
          <div class="hint">اضغط على مكان التلف في الرسمة لإضافة علامة برقم، واضغط على العلامة لحذفها</div>`;
          list.innerHTML = marks
            .map(
              (m, i) =>
                `<div class="mk-row"><span class="mk-n">${i + 1}</span><input class="in" data-mi="${i}" value="${esc(m.note || '')}" placeholder="اكتب الملاحظة (مثال: خدش في الباب الأمامي الأيمن)"><button type="button" class="btn sm ghost" data-mdel="${i}" title="حذف">✕</button></div>`,
            )
            .join('');
          $('.mk-pic img', board).onclick = (e) => {
            const r = e.target.getBoundingClientRect();
            marks.push({
              x: +(((e.clientX - r.left) / r.width) * 100).toFixed(1),
              y: +(((e.clientY - r.top) / r.height) * 100).toFixed(1),
              note: '',
            });
            sync();
            draw(marks.length - 1);
          };
          const del = (i) => {
            marks.splice(i, 1);
            sync();
            draw();
          };
          $$('[data-pin]', board).forEach((p) => {
            p.onclick = (e) => {
              e.stopPropagation();
              del(Number(p.dataset.pin));
            };
          });
          $$('[data-mdel]', list).forEach((b) => {
            b.onclick = () => del(Number(b.dataset.mdel));
          });
          $$('[data-mi]', list).forEach((inp) => {
            inp.oninput = (e) => {
              e.stopPropagation();
              marks[Number(inp.dataset.mi)].note = inp.value;
              sync();
            };
          });
          if (focus != null) {
            const inp = $(`[data-mi="${focus}"]`, list);
            if (inp) inp.focus();
          }
        };
        const t = $(`[data-key="${f.imgFrom}"]`, root);
        if (t) t.addEventListener('change', () => draw());
        draw();
      });
  }
  const ACCEPT = '.pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.zip,.rar';
  const readFile = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  /* رفع مرفق خاماً مع شريط تقدم (للملفات الكبيرة حتى 1 جيجا) */
  /* url: رفع لغير مرفقات الطلبات (مثل مستندات الموظف) */
  function uploadFile(reqId, file, label, url) {
    const max = (Number(state.config.maxUploadMb) || 5) * 1024 * 1024;
    if (file.size > max) return Promise.reject(new Error(`${file.name}: حجمه أكبر من ${state.config.maxUploadMb} ميجابايت`));
    const bar = document.createElement('div');
    bar.className = 'up-bar';
    bar.innerHTML = `<div>⬆ ${esc(file.name)} <span>0%</span></div><i></i>`;
    document.body.appendChild(bar);
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      const base = url || `/api/requests/${reqId}/attachments`;
      x.open(
        'POST',
        `${base}${base.includes('?') ? '&' : '?'}name=${encodeURIComponent(file.name)}&label=${encodeURIComponent(label || '')}`,
      );
      x.setRequestHeader('Content-Type', 'application/octet-stream');
      x.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pc = Math.round((e.loaded / e.total) * 100);
          $('span', bar).textContent = `${pc}%`;
          $('i', bar).style.width = `${pc}%`;
        }
      };
      x.onload = () => {
        bar.remove();
        let d = null;
        try {
          d = JSON.parse(x.responseText);
        } catch {
          /* تجاهل */
        }
        if (x.status >= 200 && x.status < 300) resolve(d);
        else reject(new Error(`${file.name}: ${(d && d.error) || 'تعذر رفع الملف'}`));
      };
      x.onerror = () => {
        bar.remove();
        reject(new Error(`${file.name}: انقطع الاتصال أثناء الرفع`));
      };
      x.send(file);
    });
  }
  const routeText = (route, starter) => [starter || 'محاسب الفرع', ...route.map((s) => `${s.label} (${s.name})`)].join(' ← ');

  /* ملف التصفية: الموظف مستلم سيارة ← تختفي "سيارة" من خيارات العهد العينية (تأتي من محضر التسليم) */
  function carAssetSync(root) {
    const hc = $('[data-key="hasCar"]', root);
    if (!hc) return;
    const run = () => {
      const on = hc.value === 'نعم';
      $$('[data-table="assets"] [data-col="type"]', root).forEach((s) =>
        [...s.options].forEach((o) => {
          if (o.text !== 'سيارة') return;
          o.hidden = on;
          o.disabled = on;
          if (on && o.selected) s.value = '';
        }),
      );
    };
    root.addEventListener('change', run);
    root.addEventListener('click', () => setTimeout(run));
    run();
  }

  /* ---------- البرامج المدمجة (برنامج التصفية) ----------
   * البرنامج يُفتح كما هو داخل إطار، والنظام يقرأ خاناته بالترتيب وتعيد تعبئتها */
  /* البرامج المضمّنة تأخذ لون الهوية وخلفية البطاقة من النظام */
  const loadFrame = (frame, src) =>
    new Promise((res) => {
      frame.onload = () => {
        try {
          const root = frame.contentDocument.documentElement,
            cs = getComputedStyle(document.documentElement);
          root.classList.add('embedded');
          ['--brand', '--navy'].forEach((k) => {
            const v = cs.getPropertyValue(k).trim();
            if (v) root.style.setProperty(k, v);
          });
        } catch {
          /* برنامج من مصدر آخر */
        }
        res();
      };
      frame.src = src;
    });
  function embedInputs(doc, em) {
    return $$(`${em.root} input, ${em.root} select, ${em.root} textarea`, doc).filter((el) => !(em.skip && el.matches(em.skip)));
  }
  function embedCollect(frame, em) {
    const doc = frame.contentDocument;
    const rows = em.rows ? Math.max(0, $(em.rows.table, doc).rows.length - em.rows.base) : 0;
    return { rows, values: embedInputs(doc, em).map((el) => (el.type === 'checkbox' ? el.checked : el.value)) };
  }
  function embedRestore(frame, em, st) {
    const w = frame.contentWindow,
      doc = frame.contentDocument;
    if (!st) return;
    if (em.rows) for (let i = 0; i < (st.rows || 0); i++) w[em.rows.add]();
    const els = embedInputs(doc, em);
    (st.values || []).forEach((v, i) => {
      const el = els[i];
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v;
    });
    (em.recalc || []).forEach((fn) => {
      try {
        if (typeof w[fn] === 'function') w[fn]();
      } catch {
        /* أخطاء البرنامج الأصلي لا توقف التعبئة */
      }
    });
  }
  /* الراتب الأساسي إلزامي في برنامج التصفية: تُميَّز الخانة ويُنقل إليها */
  function embedBasicMissing(frame) {
    const el = frame.contentDocument.getElementById('الراتب_الأساسي');
    if (!el || Number(String(el.value).replace(/,/g, '')) > 0) return false;
    el.classList.add('need');
    el.addEventListener('input', () => el.classList.remove('need'), { once: true });
    el.scrollIntoView({ block: 'center' });
    el.focus();
    return true;
  }
  function embedPick(frame, em) {
    const doc = frame.contentDocument,
      o = {};
    Object.entries(em.pick).forEach(([k, sel]) => {
      const el = $(sel, doc);
      o[k] = el ? el.value.trim() : '';
    });
    /* مبلغ سطر "مكافأة نهاية الخدمة" في جدول مستحقات البرنامج */
    if (em.eosRow) {
      const tr = [...doc.querySelectorAll('#salaryTable tr')].find((x) => {
        const c = x.cells[0];
        return c && ((c.querySelector('input') || {}).value || c.textContent).includes(em.eosRow);
      });
      const amt = tr && tr.querySelector('.salary');
      o.eos = amt ? String(Number(String(amt.value).replace(/,/g, '')) || '') : '';
    }
    return o;
  }
  function embedHide(frame, list) {
    const doc = frame.contentDocument;
    (list || []).forEach((sel) =>
      $$(sel, doc).forEach((el) => {
        el.style.display = 'none';
      }),
    );
  }
  function embedLock(frame, em) {
    const doc = frame.contentDocument;
    embedHide(frame, em.lockHide);
    embedInputs(doc, em).forEach((el) => {
      el.readOnly = true;
      el.tabIndex = -1;
      el.style.pointerEvents = 'none';
    });
    $$('[contenteditable]', doc).forEach((el) => {
      el.contentEditable = 'false';
    });
  }
  function fitFrame(frame) {
    try {
      frame.style.height = `${frame.contentDocument.documentElement.scrollHeight + 20}px`;
    } catch {
      /* تجاهل */
    }
  }
  /* نسخة للعرض والطباعة: خانات البرنامج تتحول لنصوص، وتُحذف أزراره وتوقيعاته (تحل محلها أختام النظام) */
  async function embedSnapshot(box, form, st) {
    const em = form.embed;
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;height:50px;visibility:hidden';
    document.body.appendChild(frame);
    try {
      await loadFrame(frame, em.src);
      embedRestore(frame, em, st);
      const doc = frame.contentDocument;
      const live = $(em.root, doc);
      const copy = live.cloneNode(true);
      const sel = `input, select, textarea`;
      const src = $$(sel, live),
        dst = $$(sel, copy);
      dst.forEach((el, i) => {
        const o = src[i];
        const span = doc.createElement('span');
        span.className = 'snap-val';
        span.textContent =
          o.type === 'checkbox'
            ? o.checked
              ? '✔'
              : '—'
            : o.tagName === 'SELECT'
              ? (o.options[o.selectedIndex] || {}).text || ''
              : o.value;
        el.replaceWith(span);
      });
      $$('.no-print, style, script, button, h2', copy).forEach((el) => el.remove());
      box.replaceChildren(...Array.from(copy.childNodes).map((n) => document.importNode(n, true)));
    } catch {
      box.innerHTML = '<div class="err">تعذر تحميل بيانات التصفية</div>';
    } finally {
      frame.remove();
    }
  }
  async function fillEmbeds(scope, r) {
    const form = SF.byId[r.type];
    if (!form || !form.embed) return;
    for (const box of $$('.settle-snap', scope)) await embedSnapshot(box, form, r.data.state);
    fitLetters();
  }

  /* ---------- مكافأة نهاية الخدمة من حاسبة قوى (التصفية النهائية) ---------- */
  const eosHint = (r) => {
    const a = r.attachments.find((x) => x.label === SF.EOS_ATT);
    return a
      ? `🧮 مكافأة نهاية الخدمة: <b>${r.data.eosQiwa ? `${esc(SF.fmtNum(r.data.eosQiwa.amount))} ريال` : '—'}</b> — نتيجة حاسبة قوى مرفقة: <a href="/api/requests/${r.id}/attachments/${a.id}" target="_blank">${esc(a.name)}</a> (تظهر في مرفقات التصفية باسم "${esc(SF.EOS_ATT)}")`
      : 'التصفية النهائية: احسب مكافأة نهاية الخدمة من مربع "🧮 مكافأة نهاية الخدمة" في صفحة الملف، وتنزل هنا تلقائياً';
  };
  /* كتابة المبلغ في سطر "مكافأة نهاية الخدمة" بجدول المبالغ المستحقة (أو أول سطر فارغ) */
  function eosToProgram(frame, amount) {
    const doc = frame.contentDocument;
    const rows = [...doc.querySelectorAll('#salaryTable tr')];
    const lbl = (x) => {
      const c0 = x.cells[0];
      return c0 ? ((c0.querySelector('input') || {}).value || c0.textContent).trim() : '';
    };
    const tr =
      rows.find((x) => lbl(x).includes('مكافأة نهاية الخدمة')) ||
      rows.find((x) => {
        const i = x.cells[0] && x.cells[0].querySelector('input');
        return i && !i.value.trim();
      });
    if (!tr) return false;
    const fire = (el, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const lab = tr.cells[0].querySelector('input');
    if (lab && !lab.value.trim()) fire(lab, 'مكافأة نهاية الخدمة');
    const amt = tr.cells[1] && tr.cells[1].querySelector('input'),
      det = tr.cells[2] && tr.cells[2].querySelector('input');
    if (amt) fire(amt, String(amount));
    if (det && !det.value.trim()) fire(det, 'حسب حاسبة مكافأة نهاية الخدمة في منصة قوى (مرفق)');
    fitFrame(frame);
    return true;
  }
  Object.assign(S, {
    SOCIAL,
    SOCIAL_CLR,
    socIcon,
    socList,
    socialLinks,
    OCC,
    occChip,
    normAr,
    NF_SECTIONS,
    NF_GROUP,
    ACCEPT,
    readFile,
    routeText,
    loadFrame,
    eosHint,
  });
})((window.SES_APP = window.SES_APP || {}));
