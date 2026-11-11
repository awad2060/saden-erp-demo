/* الملاحظات اللاصقة (Sticky Notes) */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, $$, state, api, icon, askYesNo } = S;
  Object.assign(S, { snLoad, snSave, snNew, snWire, snLayer, snRender, snNavBadge, snBind });

  /* ---------- الملاحظات اللاصقة (Sticky Notes): في التطبيقات والقائمة الجانبية بجوار TO-DO، عائمة فوق كل الصفحات،
   * تُغلق وتُعاد، وتُفتح في صفحة مستقلة، وتُحفظ تلقائياً مع الكتابة (بخط يدوي وحبر أزرق جاف) ---------- */
  /* الأهمية: لون الدبوس والشارة (عادي بني كدبوس الورق) */
  const SN_PRI = [
    ['normal', 'عادي'],
    ['important', 'مهم'],
    ['urgent', 'مستعجل'],
    ['critical', 'عاجل جداً'],
  ];
  const snPri = (n) => (SN_PRI.some(([k]) => k === n.priority) ? n.priority : 'normal');
  const snPriL = (n) => SN_PRI.find(([k]) => k === snPri(n))[1];
  const SN_PIN = `<svg class="sn-pin" viewBox="0 0 34 46" aria-hidden="true"><path d="M17 29 15.7 45 18.3 29Z" fill="#8d939a" stroke="#3b2a20" stroke-width="1"/><path d="M8 25h18a2.6 2.6 0 0 1 0 5.2H8A2.6 2.6 0 0 1 8 25z" fill="currentColor" stroke="#3b2a20" stroke-width="1.6"/><path d="M12 11h10l-1.6 14h-6.8z" fill="currentColor" stroke="#3b2a20" stroke-width="1.6"/><ellipse cx="17" cy="9" rx="11" ry="6.5" fill="currentColor" stroke="#3b2a20" stroke-width="1.6"/><ellipse cx="13" cy="7.4" rx="3.6" ry="1.7" fill="#fff" opacity=".5"/></svg>`;
  /* الورقة: دبوس + ورقة (الشريط والمحرر) + ثنية الركن (+ مقبض الحجم للعائمة) */
  const snWrap = (n, inner, floating) =>
    `${SN_PIN}<div class="sn-paper">${inner}</div><i class="sn-curl"></i>${floating ? ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((d) => `<i class="sn-rz rz-${d}" data-rz="${d}"></i>`).join('') : ''}`;
  const SN_COLORS = [
    ['yellow', 'أصفر'],
    ['pink', 'وردي'],
    ['green', 'أخضر'],
    ['blue', 'أزرق'],
    ['orange', 'برتقالي'],
    ['purple', 'بنفسجي'],
  ];
  const sn = { list: null, timers: {}, pend: {}, z: 80, bc: null, busy: false };
  const snUid = () => (state.user || {}).id || '';
  const snOff = () => !state.user || S.SOLO || /^#\/(login|notes|print|orgprint)/.test(location.hash);
  function snChannel() {
    if (!sn.bc && 'BroadcastChannel' in window) {
      sn.bc = new BroadcastChannel('sticky-notes');
      sn.bc.onmessage = (e) => snRemote(e.data);
    }
    return sn.bc;
  }
  async function snLoad(force) {
    if (!sn.list || force || sn.uid !== snUid()) {
      try {
        sn.list = (await api('GET', '/api/notes')).list;
        sn.uid = snUid();
      } catch {
        sn.list = sn.list || [];
      }
    }
    snChannel();
    return sn.list;
  }
  const snTitle = (n) =>
    (
      String(n.text || '')
        .split('\n')
        .find((l) => l.trim()) || 'ملاحظة فارغة'
    )
      .trim()
      .slice(0, 40);
  const snStatus = (id, t) =>
    $$(`[data-sn-st="${id}"]`).forEach((el) => {
      el.textContent = t;
    });
  const snTell = (m) => {
    if (sn.bc) sn.bc.postMessage({ ...m, uid: snUid() });
  };
  /* الحفظ التلقائي: التعديلات تتجمع وتُرسل بعد توقف الكتابة */
  function snSave(n, patch, delay = 500) {
    Object.assign(n, patch);
    sn.pend[n.id] = { ...(sn.pend[n.id] || {}), ...patch };
    snStatus(n.id, 'جاري الحفظ…');
    clearTimeout(sn.timers[n.id]);
    sn.timers[n.id] = setTimeout(() => snFlush(n), delay);
  }
  async function snFlush(n) {
    const p = sn.pend[n.id];
    if (!p) return;
    delete sn.pend[n.id];
    try {
      const x = await api('PUT', `/api/notes/${n.id}`, p);
      n.updatedAt = x.updatedAt;
      snStatus(n.id, '✓ حُفظت تلقائياً');
      snTell({ t: 'upd', note: n });
    } catch {
      sn.pend[n.id] = { ...p, ...(sn.pend[n.id] || {}) };
      snStatus(n.id, '⚠ تعذر الحفظ — أعد المحاولة');
      sn.timers[n.id] = setTimeout(() => snFlush(n), 3000);
    }
  }
  /* إغلاق الصفحة قبل انتهاء المهلة: يُرسل ما لم يُحفظ */
  window.addEventListener('pagehide', () => {
    for (const [id, p] of Object.entries(sn.pend)) {
      try {
        fetch(`/api/notes/${id}`, {
          method: 'PUT',
          keepalive: true,
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        });
      } catch {
        /* تجاهل */
      }
    }
  });
  /* تبويب آخر عدّل الملاحظات: يُحدَّث العرض هنا (دون لمس ما يُكتب الآن) */
  function snRemote(m) {
    if (!sn.list || m.uid !== snUid()) return;
    if (m.t === 'upd') {
      const n = sn.list.find((x) => x.id === m.note.id);
      if (n) Object.assign(n, m.note);
      else sn.list.push(m.note);
    }
    if (m.t === 'del') sn.list = sn.list.filter((x) => x.id !== m.id);
    const t = m.note && $(`[data-sn-t="${m.note.id}"]`);
    if (m.t === 'upd' && t && document.activeElement === t) return;
    snRender();
    if (state.snPage) state.snPage();
    snNavBadge();
  }
  async function snNew(patch) {
    await snLoad();
    const n = await api('POST', '/api/notes', { ...(patch || {}), x: 32 + (sn.list.length % 6) * 28, y: 120 + (sn.list.length % 6) * 28 });
    sn.list.push(n);
    snTell({ t: 'upd', note: n });
    return n;
  }
  async function snDelete(n) {
    if (String(n.text || '').trim() && !(await askYesNo('حذف هذه الملاحظة نهائياً؟'))) return false;
    clearTimeout(sn.timers[n.id]);
    delete sn.pend[n.id];
    await api('DELETE', `/api/notes/${n.id}`);
    sn.list = sn.list.filter((x) => x !== n);
    snTell({ t: 'del', id: n.id });
    return true;
  }
  /* التنسيق المسموح في الملاحظة فقط (عريض، مائل، تسطير، شطب، قوائم، لون، تظليل، حجم) — أي شيء آخر يُزال */
  const SN_TAGS = ['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'UL', 'OL', 'LI', 'BR', 'DIV', 'P', 'SPAN', 'FONT'];
  const SN_CSS = /^[#\w(),.%\s-]{1,40}$/;
  function snClean(html) {
    const root = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html').body.firstChild;
    const walk = (el) => {
      for (const c of [...el.childNodes]) {
        if (c.nodeType === 3) continue;
        if (
          c.nodeType !== 1 ||
          ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'svg', 'SVG', 'IMG', 'VIDEO', 'AUDIO'].includes(c.tagName)
        ) {
          c.remove();
          continue;
        }
        walk(c);
        if (!SN_TAGS.includes(c.tagName)) {
          c.replaceWith(...c.childNodes);
          continue;
        }
        const st = c.style,
          keep = [
            ['color', st.color],
            ['background-color', st.backgroundColor],
            ['font-size', st.fontSize],
            ['font-weight', st.fontWeight],
            ['font-style', st.fontStyle],
            ['text-decoration-line', st.textDecorationLine || st.textDecoration],
          ].filter(([, v]) => v && SN_CSS.test(v));
        const fc = c.tagName === 'FONT' ? [c.getAttribute('color'), c.getAttribute('size')] : [];
        for (const a of [...c.attributes]) c.removeAttribute(a.name);
        if (keep.length) c.setAttribute('style', keep.map(([k, v]) => `${k}:${v}`).join(';'));
        if (fc[0] && SN_CSS.test(fc[0])) c.setAttribute('color', fc[0]);
        if (fc[1] && /^[1-7]$/.test(fc[1])) c.setAttribute('size', fc[1]);
      }
    };
    walk(root);
    return root.innerHTML;
  }
  const snHtml = (n) => (n.html != null ? snClean(n.html) : esc(n.text || '').replace(/\n/g, '<br>'));
  const snCaretEnd = (el) => {
    el.focus();
    try {
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch {
      /* تجاهل */
    }
  };
  /* شريط التنسيق: [الأمر، القيمة، الشكل، التلميح] */
  const SN_INKS = [
    ['#1d3f9e', 'أزرق جاف'],
    ['#1f2937', 'أسود'],
    ['#c62828', 'أحمر'],
    ['#2e7d32', 'أخضر'],
  ];
  const SN_FMT = [
    ['bold', '', '<b>B</b>', 'عريض (Ctrl+B)'],
    ['italic', '', '<i>I</i>', 'مائل (Ctrl+I)'],
    ['underline', '', '<u>U</u>', 'تحته خط (Ctrl+U)'],
    ['strikeThrough', '', '<s>S</s>', 'يتوسطه خط'],
    ['|'],
    ['insertUnorderedList', '', '•≡', 'تنقيط'],
    ['insertOrderedList', '', '1.≡', 'ترقيم'],
    ['size', '', '<span class="sn-fsl">الحجم ▾</span>', 'حجم الخط: للجزء المحدد، أو للملاحظة كلها إذا لم تحدد شيئاً'],
    ['|'],
    ...SN_INKS.map(([c, l]) => ['foreColor', c, `<i class="sn-ink" style="background:${c}"></i>`, `لون الحبر: ${l}`]),
    ['hiliteColor', '#fff176', '<i class="sn-hl">ab</i>', 'تظليل'],
    ['removeFormat', '', '<span class="sn-rf">T<sub>×</sub></span>', 'مسح التنسيق'],
  ];
  /* أحجام الخط بالأرقام (بكسل) — 21 هو الحجم الافتراضي */
  const SN_SIZES = [14, 16, 18, 21, 24, 28, 32, 36, 40];
  /* حجم الملاحظة كلها: الخط وارتفاع السطر (سطور الورقة تتبعه) */
  const snFsStyle = (n) => (Number(n.fs) ? ` style="--sn-fs:${Number(n.fs)}px;--sn-lh:${Math.round(Number(n.fs) * 1.52)}px"` : '');
  const snFmtBar = (
    n,
  ) => `<div class="sn-fmt" data-noicon>${SN_FMT.map(([c, v, h, t]) => (c === '|' ? '<i class="sn-sep"></i>' : `<button type="button" class="sn-fb" data-sn-f="${c}" data-v="${v}" title="${t}" aria-label="${t}">${c === 'size' ? `<span class="sn-fsl" data-fsl>${Number(n.fs) || 21}</span> ▾` : h}</button>`)).join('')}
    <div class="sn-fsz" hidden>${SN_SIZES.map((px) => `<button type="button" class="sn-fb sn-fsn${(Number(n.fs) || 21) === px ? ' on' : ''}" data-px="${px}" title="حجم ${px}">${px}</button>`).join('')}</div></div>`;
  const snBar = (n, page) => `<div class="sn-h"${page ? '' : ' data-sn-drag'}>
      <button type="button" class="sn-b" data-sn-col title="لون الملاحظة">${icon('palette')}</button>
      <button type="button" class="sn-pr" data-sn-prb title="الأهمية">${snPriL(n)}</button>
      ${page ? '' : `<button type="button" class="sn-b" data-sn-new title="ملاحظة جديدة">${icon('plus')}</button>`}
      <span class="sn-st" data-sn-st="${n.id}"></span>
      ${page ? `<button type="button" class="sn-b${n.open ? ' on' : ''}" data-sn-float title="${n.open ? 'إخفاء من الصفحات (عائمة)' : 'إظهار عائمة فوق الصفحات'}">${icon('layers')}</button>` : `<a class="sn-b" href="#/notes?id=${n.id}" target="_blank" rel="noopener" title="فتح في صفحة مستقلة">${icon('arrowUpRight')}</a>`}
      <button type="button" class="sn-b" data-sn-del title="حذف الملاحظة">${icon('trash')}</button>
      ${page ? '' : `<button type="button" class="sn-b" data-sn-x title="إغلاق (تعيدها من «الملاحظات اللاصقة» في القائمة الجانبية)">${icon('x')}</button>`}
    </div>
    <div class="sn-prs" hidden>${SN_PRI.map(([k, l]) => `<button type="button" class="sn-pr pr-${k}${snPri(n) === k ? ' on' : ''}" data-sn-p="${k}">${l}</button>`).join('')}</div>
    <div class="sn-cols" hidden>${SN_COLORS.map(([k, l]) => `<button type="button" class="sn-dot sn-${k}${n.color === k ? ' on' : ''}" data-sn-c="${k}" title="${l}" aria-label="${l}"></button>`).join('')}</div>
    ${snFmtBar(n)}
    <div class="sn-t" contenteditable="true" role="textbox" aria-multiline="true" data-sn-t="${n.id}" data-ph="اكتب ملاحظتك هنا..." spellcheck="false"${snFsStyle(n)}>${snHtml(n)}</div>`;
  /* أحداث الملاحظة المشتركة بين العائمة والصفحة */
  function snWire(box, n, onChange) {
    const t = $('.sn-t', box);
    const put = () => {
      if (!t.textContent.trim() && !t.querySelector('li')) t.innerHTML = '';
      snSave(n, { html: t.innerHTML, text: t.innerText.replace(/\n{3,}/g, '\n\n').trim() });
    };
    t.addEventListener('input', put);
    /* اللصق نص فقط (بدون تنسيقات المواقع والملفات) */
    t.addEventListener('paste', (e) => {
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
    });
    const mark = snMarker(box);
    t.addEventListener('keyup', mark);
    t.addEventListener('mouseup', mark);
    t.addEventListener('focus', mark);
    snWireFmt(box, t, put, mark);
    snWireSize(box, n, t, put);
    t.addEventListener('blur', () => {
      if (sn.pend[n.id]) {
        clearTimeout(sn.timers[n.id]);
        snFlush(n);
      }
    });
    snWirePick(box, n, onChange);
  }
  /* حالة أزرار التنسيق حسب مكان المؤشر */
  function snMarker(box) {
    return () =>
      $$('[data-sn-f]', box).forEach((b) => {
        try {
          b.classList.toggle(
            'on',
            ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'].includes(b.dataset.snF) &&
              document.queryCommandState(b.dataset.snF),
          );
        } catch {
          /* تجاهل */
        }
      });
  }
  /* أزرار التنسيق: عريض، مائل، قوائم، تظليل... وزر الحجم يفتح قائمة الأحجام */
  function snWireFmt(box, t, put, mark) {
    $$('[data-sn-f]', box).forEach((b) => {
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.onclick = () => {
        const c = b.dataset.snF;
        if (c === 'size') {
          const z = $('.sn-fsz', box);
          z.hidden = !z.hidden;
          b.classList.toggle('on', !z.hidden);
          return;
        }
        if (document.activeElement !== t) snCaretEnd(t);
        document.execCommand('styleWithCSS', false, c === 'hiliteColor' || c === 'foreColor');
        if (c === 'hiliteColor')
          document.execCommand(
            'hiliteColor',
            false,
            document.queryCommandValue('hiliteColor').replace(/\s/g, '') === 'rgb(255,241,118)' ? 'transparent' : b.dataset.v,
          );
        else document.execCommand(c, false, b.dataset.v || null);
        put();
        mark();
      };
    });
  }
  function snWireSize(box, n, t, put) {
    /* حجم الخط: كلام محدد ← يتغير حجمه هو، وإلا ← حجم الملاحظة كلها */
    $$('[data-px]', box).forEach((b) => {
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.onclick = () => {
        const s = getSelection(),
          px = Number(b.dataset.px);
        if (s.rangeCount && !s.isCollapsed && t.contains(s.anchorNode) && t.contains(s.focusNode)) {
          /* المتصفح لا يقبل إلا أحجام 1-7: يُطبَّق 7 مؤقتاً ثم يُستبدل بالحجم بالبكسل */
          document.execCommand('styleWithCSS', false, false);
          document.execCommand('fontSize', false, '7');
          $$('font[size="7"]', t).forEach((f) => {
            const sp = document.createElement('span');
            sp.style.fontSize = `${px}px`;
            sp.append(...f.childNodes);
            f.replaceWith(sp);
          });
          put();
        } else {
          t.style.setProperty('--sn-fs', `${px}px`);
          t.style.setProperty('--sn-lh', `${Math.round(px * 1.52)}px`);
          snSave(n, { fs: px }, 100);
          $('[data-fsl]', box).textContent = px;
          $$('.sn-fsn', box).forEach((x) => x.classList.toggle('on', x === b));
        }
        $('.sn-fsz', box).hidden = true;
        $('[data-sn-f="size"]', box).classList.remove('on');
        t.focus();
      };
    });
  }
  /* لون الملاحظة وأهميتها، وحذفها */
  function snWirePick(box, n, onChange) {
    $('[data-sn-col]', box).onclick = () => {
      $('.sn-cols', box).hidden = !$('.sn-cols', box).hidden;
      $('.sn-prs', box).hidden = true;
    };
    $('[data-sn-prb]', box).onclick = () => {
      $('.sn-prs', box).hidden = !$('.sn-prs', box).hidden;
      $('.sn-cols', box).hidden = true;
    };
    $$('[data-sn-p]', box).forEach((b) => {
      b.onclick = () => {
        box.classList.remove(...SN_PRI.map(([k]) => `pr-${k}`));
        box.classList.add(`pr-${b.dataset.snP}`);
        $$('[data-sn-p]', box).forEach((x) => x.classList.toggle('on', x === b));
        $('.sn-prs', box).hidden = true;
        snSave(n, { priority: b.dataset.snP }, 100);
        $('[data-sn-prb]', box).textContent = snPriL(n);
      };
    });
    $$('[data-sn-c]', box).forEach((b) => {
      b.onclick = () => {
        box.classList.remove(...SN_COLORS.map(([k]) => `sn-${k}`));
        box.classList.add(`sn-${b.dataset.snC}`);
        $$('[data-sn-c]', box).forEach((x) => x.classList.toggle('on', x === b));
        $('.sn-cols', box).hidden = true;
        snSave(n, { color: b.dataset.snC }, 100);
        snNavBadge();
      };
    });
    $('[data-sn-del]', box).onclick = async () => {
      if (await snDelete(n)) onChange();
    };
  }
  /* الطبقة العائمة: خارج إطار الصفحة فتبقى كما هي عند التنقل */
  function snLayer() {
    let el = document.getElementById('snLayer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'snLayer';
      el.className = 'sn-layer';
      el.setAttribute('translate', 'no');
      el.setAttribute('data-noicon', '');
      document.body.appendChild(el);
    }
    return el;
  }
  function snRender() {
    const L = snLayer();
    if (snOff() || !sn.list) {
      L.innerHTML = '';
      return;
    }
    const act = document.activeElement,
      keep = act && act.dataset && act.dataset.snT ? act.dataset.snT : null;
    const open = sn.list.filter((n) => n.open);
    const W = innerWidth,
      H = innerHeight;
    L.innerHTML = open
      .map((n) => {
        const w = Math.min(n.w || 260, W - 16),
          h = Math.min(n.h || 240, H - 80);
        const x = Math.max(8, Math.min(n.x || 0, W - w - 8)),
          y = Math.max(56, Math.min(n.y || 0, H - 60));
        return `<div class="sn sn-${n.color || 'yellow'} pr-${snPri(n)}" data-sn="${n.id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${++sn.z}">${snWrap(n, snBar(n), true)}</div>`;
      })
      .join('');
    for (const n of open) {
      const box = $(`[data-sn="${n.id}"]`, L);
      snWire(box, n, () => {
        snRender();
        snNavBadge();
      });
      box.addEventListener(
        'pointerdown',
        () => {
          box.style.zIndex = ++sn.z;
        },
        true,
      );
      snFloatBtns(box, n);
      snDrag(box, n);
      snResize(box, n);
    }
    if (keep) {
      const t = $(`[data-sn-t="${keep}"]`, L);
      if (t) snCaretEnd(t);
    }
  }
  /* أزرار الملاحظة العائمة: إغلاق، وملاحظة جديدة بنفس اللون */
  function snFloatBtns(box, n) {
    $('[data-sn-x]', box).onclick = () => {
      snSave(n, { open: false }, 50);
      snRender();
      snNavBadge();
    };
    $('[data-sn-new]', box).onclick = async () => {
      const m = await snNew({ color: n.color });
      snRender();
      snNavBadge();
      const t = $(`[data-sn-t="${m.id}"]`);
      if (t) t.focus();
    };
  }
  function snDrag(box, n) {
    /* السحب من شريط الملاحظة */
    const bar = $('[data-sn-drag]', box);
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a')) return;
      e.preventDefault();
      const r = box.getBoundingClientRect(),
        dx = e.clientX - r.left,
        dy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      const mv = (ev) => {
        box.style.left = `${Math.max(0, Math.min(ev.clientX - dx, innerWidth - 60))}px`;
        box.style.top = `${Math.max(48, Math.min(ev.clientY - dy, innerHeight - 40))}px`;
      };
      const up = () => {
        bar.removeEventListener('pointermove', mv);
        bar.removeEventListener('pointerup', up);
        snSave(n, { x: parseInt(box.style.left, 10), y: parseInt(box.style.top, 10) }, 200);
      };
      bar.addEventListener('pointermove', mv);
      bar.addEventListener('pointerup', up);
    });
  }
  function snResize(box, n) {
    /* تغيير الحجم من الركن */
    /* تغيير الحجم من أي اتجاه: الحواف الأربع والأركان الأربعة */
    $$('[data-rz]', box).forEach((rz) =>
      rz.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const d = rz.dataset.rz,
          x0 = e.clientX,
          y0 = e.clientY,
          w0 = box.offsetWidth,
          h0 = box.offsetHeight,
          l0 = box.offsetLeft,
          t0 = box.offsetTop;
        box.style.zIndex = ++sn.z;
        rz.setPointerCapture(e.pointerId);
        const mv = (ev) => {
          const dx = ev.clientX - x0,
            dy = ev.clientY - y0;
          let w = w0,
            h = h0,
            l = l0,
            t = t0;
          if (d.includes('e')) w = Math.min(w0 + dx, innerWidth - l0 - 4);
          if (d.includes('w')) {
            w = Math.min(w0 - dx, l0 + w0 - 4);
          }
          if (d.includes('s')) h = Math.min(h0 + dy, innerHeight - t0 - 4);
          if (d.includes('n')) h = Math.min(h0 - dy, t0 + h0 - 48);
          w = Math.max(180, w);
          h = Math.max(150, h);
          if (d.includes('w')) l = l0 + w0 - w;
          if (d.includes('n')) t = t0 + h0 - h;
          Object.assign(box.style, { width: `${w}px`, height: `${h}px`, left: `${l}px`, top: `${t}px` });
        };
        const up = () => {
          rz.removeEventListener('pointermove', mv);
          rz.removeEventListener('pointerup', up);
          snSave(n, { x: box.offsetLeft, y: box.offsetTop, w: box.offsetWidth, h: box.offsetHeight }, 200);
        };
        rz.addEventListener('pointermove', mv);
        rz.addEventListener('pointerup', up);
      }),
    );
  }
  window.addEventListener('hashchange', () =>
    setTimeout(() => {
      if (sn.list) snRender();
    }, 0),
  );
  window.addEventListener('resize', () => {
    if (sn.list && !snOff()) snRender();
  });
  /* عدد الملاحظات في القائمة الجانبية */
  function snNavBadge() {
    const a = $('[data-snnav]');
    if (!a || !sn.list) return;
    let b = $('.badge', a);
    if (!sn.list.length) {
      if (b) b.remove();
      return;
    }
    if (!b) {
      b = document.createElement('span');
      b.className = 'badge sn-badge';
      a.appendChild(b);
    }
    b.textContent = sn.list.length;
  }
  /* الضغط على «الملاحظات اللاصقة» في القائمة الجانبية: قائمة صغيرة بجوارها */
  async function snMenu(anchor) {
    let m = document.getElementById('snMenu');
    if (m) {
      m.remove();
      return;
    }
    await snLoad();
    m = document.createElement('div');
    m.id = 'snMenu';
    m.className = 'sn-menu';
    m.setAttribute('data-noicon', '');
    const draw = () => {
      const anyOpen = sn.list.some((n) => n.open);
      m.innerHTML = `<div class="sn-menu-h"><b>${icon('filePen')} الملاحظات اللاصقة</b><small>خاصة بك — يحفظها النظام تلقائياً</small></div>
        ${sn.list.map((n) => `<button type="button" class="sn-mi" data-sn-tg="${n.id}" title="${n.open ? 'إغلاق' : 'فتح'}"><i class="sn-sw sn-${n.color || 'yellow'}"></i><span>${esc(snTitle(n))}</span>${snPri(n) !== 'normal' ? `<b class="sn-pr pr-${snPri(n)}">${snPriL(n)}</b>` : ''}<em>${n.open ? 'مفتوحة' : 'مغلقة'}</em></button>`).join('') || '<div class="sn-mi-empty">لا توجد ملاحظات بعد</div>'}
        <div class="sn-menu-f"><button type="button" class="btn sm primary" data-sn-add>${icon('plus')} ملاحظة جديدة</button>
          ${sn.list.length ? `<button type="button" class="btn sm" data-sn-all>${anyOpen ? 'إخفاء الكل' : 'إظهار الكل'}</button>` : ''}
          <a class="btn sm ghost" href="#/notes">صفحة الملاحظات</a></div>`;
      $$('[data-sn-tg]', m).forEach((b) => {
        b.onclick = () => {
          const n = sn.list.find((x) => x.id === b.dataset.snTg);
          snSave(n, { open: !n.open }, 50);
          snRender();
          draw();
          if (n.open) {
            const t = $(`[data-sn-t="${n.id}"]`);
            if (t) t.focus();
          }
        };
      });
      $('[data-sn-add]', m).onclick = async () => {
        const n = await snNew();
        snRender();
        snNavBadge();
        m.remove();
        const t = $(`[data-sn-t="${n.id}"]`);
        if (t) t.focus();
      };
      const all = $('[data-sn-all]', m);
      if (all)
        all.onclick = () => {
          const v = !anyOpen;
          for (const n of sn.list) if (n.open !== v) snSave(n, { open: v }, 50);
          snRender();
          draw();
        };
      $('a', m).onclick = () => m.remove();
    };
    draw();
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect(),
      rtl = document.documentElement.dir !== 'ltr';
    m.style.top = `${Math.max(8, Math.min(r.top, innerHeight - m.offsetHeight - 8))}px`;
    if (innerWidth < 700) {
      m.style.left = '8px';
      m.style.right = '8px';
    } else if (rtl) m.style.right = `${innerWidth - r.left + 8}px`;
    else m.style.left = `${r.right + 8}px`;
    setTimeout(
      () =>
        document.addEventListener('pointerdown', function off(e) {
          if (!m.contains(e.target) && !anchor.contains(e.target)) {
            m.remove();
            document.removeEventListener('pointerdown', off);
          }
        }),
      0,
    );
  }
  /* يُستدعى بعد رسم إطار الصفحة */
  async function snBind() {
    const a = $('[data-snnav]');
    if (a)
      a.onclick = (e) => {
        e.preventDefault();
        snMenu(a);
      };
    if (S.SOLO) return;
    await snLoad();
    snRender();
    snNavBadge();
  }
  Object.assign(S, { SN_PRI, snPri, snWrap, sn, snTitle, snCaretEnd, snBar });
})((window.SES_APP = window.SES_APP || {}));
