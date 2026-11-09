'use strict';
/* نافذة كتابة رسالة البريد الداخلي (mailCompose): المستلمون والمسودات والمحرر المنسق والمرفقات والإرسال.
 * حالة النافذة كلها في كائن واحد C يُمرَّر لكل دالة: win (النافذة)، ed (المحرر)، sel (المستلمون)، pre (القيم الأولية)،
 * files (المرفقات)، draftId، replyBy، range (آخر تحديد في المحرر)، وحالة الحفظ التلقائي (saveT، saving، sent) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['mail'] = function (S) {
  const { $, $$, GM, GM_COLORS, GM_EMOJI, GM_FONTS, api, askYesNo, dt, dueTxt, esc, mailHtml, state, toast } = S;

  /* ---------- القيم الأولية: رد / إعادة توجيه / مسودة / رسالة لشخص أو بخصوص طلب ---------- */
  const stripPrefix = (s) => s.replace(/^((رد|توجيه):\s*)+/, '');
  const replyPre = (o, all) => ({
    to: all ? [...new Set([o.from, ...o.to])].filter((x) => x !== state.user.id) : [o.from],
    cc: all ? (o.cc || []).filter((x) => x !== state.user.id) : [],
    bcc: [],
    subject: `رد: ${stripPrefix(o.subject)}`,
    html: '',
    replyTo: o.id,
    reqSerial: o.reqSerial || '',
  });
  const fwdPre = (o) => ({
    to: [],
    cc: [],
    bcc: [],
    subject: `توجيه: ${stripPrefix(o.subject)}`,
    html: `<br><br><div>---------- رسالة معاد توجيهها ----------<br>من: ${esc(o.fromName)}<br>التاريخ: ${esc(dt(o.at))}<br>العنوان: ${esc(o.subject)}</div><br>${mailHtml(o)}`,
    replyTo: '',
  });
  const draftPre = (d) => ({
    to: d.to,
    cc: d.cc || [],
    bcc: d.bcc || [],
    subject: d.subject,
    html: d.html,
    replyTo: d.replyTo || '',
    reqSerial: d.reqSerial || '',
    replyBy: d.replyBy || '',
  });
  async function loadPre(query, users) {
    let pre = { to: [], cc: [], bcc: [], subject: '', html: '', replyTo: '' };
    const src = query.reply || query.fwd;
    if (src) {
      const o = await api('GET', `/api/mail/${src}`);
      pre = query.reply ? replyPre(o, query.all) : fwdPre(o);
    }
    /* فتح مسودة محفوظة، أو رسالة بخصوص طلب (من صفحة الطلب) */
    let draftId = '';
    if (query.draft) {
      const d = await api('GET', `/api/mail/drafts/${query.draft}`);
      draftId = d.id;
      pre = draftPre(d);
    }
    /* رسالة لشخص محدد (من كارت الموظف) */
    if (query.to && !src && !query.draft && users.some((u) => u.id === query.to)) pre.to = [query.to];
    if (query.req) {
      try {
        const rq = await api('GET', `/api/requests/${query.req}`);
        pre.reqSerial = rq.serial;
        if (!pre.subject) pre.subject = `بخصوص الطلب ${rq.serial} — ${rq.typeTitle || ''}`;
      } catch {
        /* تجاهل */
      }
    }
    return { pre, draftId };
  }

  /* ---------- شكل النافذة ---------- */
  const LBL = { to: 'إلى', cc: 'نسخة', bcc: 'نسخة مخفية' };
  const rowHtml = (C, k) =>
    `<div class="gm-row gm-rcpt" data-k="${k}"${k !== 'to' && !C.sel[k].size ? ' hidden' : ''}><label>${LBL[k]}</label><div class="gm-chips"></div>
        <input class="gm-in" autocomplete="off" aria-label="${LBL[k]}">${k === 'to' ? '<span class="gm-ccbcc"><a href="#" data-show="cc">نسخة</a><a href="#" data-show="bcc">نسخة مخفية</a></span>' : ''}<div class="gm-sug" hidden></div></div>`;
  const tb = (cmd, ic, title) => `<button type="button" class="gm-tb" data-cmd="${cmd}" title="${title}">${GM[ic]}</button>`;
  /* شريط التنسيق */
  function toolsHtml() {
    return `<div class="gm-tools">
          <select class="gm-font" title="الخط">${GM_FONTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><span class="gm-sep"></span>
          <span class="gm-pop-w"><button type="button" class="gm-tb" data-pop="size" title="حجم الخط">${GM.size}${GM.more}</button><div class="gm-pop" data-p="size" hidden>${[
            ['2', 'صغير'],
            ['3', 'عادي'],
            ['5', 'كبير'],
            ['7', 'ضخم'],
          ]
            .map(
              ([v, l]) => `<button type="button" data-size="${v}" style="font-size:${{ 2: 12, 3: 15, 5: 20, 7: 26 }[v]}px">${l}</button>`,
            )
            .join('')}</div></span><span class="gm-sep"></span>
          ${tb('bold', 'bold', 'عريض (Ctrl+B)')}${tb('italic', 'italic', 'مائل (Ctrl+I)')}${tb('underline', 'underline', 'تحته خط (Ctrl+U)')}
          <span class="gm-pop-w"><button type="button" class="gm-tb" data-pop="color" title="لون النص">${GM.color}${GM.more}</button><div class="gm-pop gm-colors" data-p="color" hidden>
            <div><small>لون الخلفية</small><div class="gm-sw">${GM_COLORS.map((c) => `<button type="button" data-bg="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div></div>
            <div><small>لون النص</small><div class="gm-sw">${GM_COLORS.map((c) => `<button type="button" data-fg="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div></div></div></span><span class="gm-sep"></span>
          <span class="gm-pop-w"><button type="button" class="gm-tb" data-pop="align" title="المحاذاة">${GM.align}${GM.more}</button><div class="gm-pop gm-row-pop" data-p="align" hidden>${[
            ['justifyRight', 'يمين'],
            ['justifyCenter', 'وسط'],
            ['justifyLeft', 'يسار'],
            ['justifyFull', 'ضبط'],
          ]
            .map(([c, l]) => `<button type="button" data-cmd="${c}">${l}</button>`)
            .join('')}</div></span>
          ${tb('insertOrderedList', 'ol', 'قائمة مرقمة')}${tb('insertUnorderedList', 'ul', 'قائمة نقطية')}${tb('outdent', 'outdent', 'إنقاص المسافة البادئة')}${tb('indent', 'indent', 'زيادة المسافة البادئة')}${tb('quote', 'quote', 'اقتباس')}${tb('dir', 'dir', 'اتجاه النص (يمين / يسار)')}<span class="gm-sep"></span>
          <span class="gm-pop-w"><button type="button" class="gm-tb" data-pop="more" title="مزيد من خيارات التنسيق">${GM.more}</button><div class="gm-pop gm-col-pop" data-p="more" hidden>${tb('removeFormat', 'clear', 'إزالة التنسيق')}${tb('strikeThrough', 'strike', 'يتوسطه خط')}</div></span>
        </div>`;
  }
  /* الشريط السفلي: الإرسال والمرفقات والرابط والرموز والصورة وميعاد الرد */
  function footHtml(replyBy) {
    return `<div class="gm-foot">
          <button type="button" class="gm-send">إرسال</button>
          <button type="button" class="gm-fb on" data-f="fmt" title="خيارات التنسيق">${GM.aa}</button>
          <button type="button" class="gm-fb" data-f="att" title="إرفاق ملفات">${GM.clip}</button>
          <span class="gm-pop-w"><button type="button" class="gm-fb" data-pop="link" title="إدراج رابط">${GM.link}</button><div class="gm-pop gm-link-pop" data-p="link" hidden>
            <label>النص المعروض<input class="in" data-l="text"></label><label>الرابط<input class="in" data-l="url" placeholder="https://" dir="ltr"></label><button type="button" class="btn primary sm" data-l="ok">إدراج</button></div></span>
          <span class="gm-pop-w"><button type="button" class="gm-fb" data-pop="emoji" title="إدراج رمز تعبيري">${GM.emoji}</button><div class="gm-pop gm-emoji" data-p="emoji" hidden>${GM_EMOJI.map((e) => `<button type="button" data-emo="${e}">${e}</button>`).join('')}</div></span>
          <button type="button" class="gm-fb" data-f="img" title="إدراج صورة داخل الرسالة">${GM.image}</button>
          <span class="gm-pop-w"><button type="button" class="gm-fb${replyBy ? ' on' : ''}" data-pop="due" title="مطلوب رد قبل ميعاد">${GM.due}</button><div class="gm-pop gm-due-pop" data-p="due" hidden>
            <label>مطلوب رد قبل<input class="in" type="datetime-local" data-due="v" value="${esc(replyBy)}"></label><small class="muted">يصل للمستلمين في "إلى" تذكير قبل الميعاد بيوم وعند فواته، وتعرف من رد ومن لم يرد</small>
            <span class="row" style="gap:6px"><button type="button" class="btn primary sm" data-due="ok">تم</button><button type="button" class="btn sm ghost" data-due="clear">بدون ميعاد</button></span></div></span>
          <span class="gm-due-chip"${replyBy ? '' : ' hidden'}>⏰ رد قبل <b>${esc(replyBy ? dueTxt(replyBy) : '')}</b></span>
          <span class="gm-grow"></span>
          <button type="button" class="gm-fb" data-f="discard" title="تجاهل المسودة">${GM.trash}</button>
          <input type="file" data-file="att" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.zip,.rar"><input type="file" data-file="img" hidden accept=".png,.jpg,.jpeg,.gif,.webp">
        </div>`;
  }
  function composeHtml(C) {
    const { query, pre } = C;
    const title = query.draft ? 'مسودة' : query.reply ? 'رد' : query.fwd ? 'إعادة توجيه' : 'رسالة جديدة';
    return `<div class="gm-head"><span class="gm-title">${title} <small class="gm-saved"></small></span>
        <span class="gm-hbtns"><button type="button" data-w="min" title="تصغير">${GM.min}</button><button type="button" data-w="max" title="ملء الشاشة">${GM.max}</button><button type="button" data-w="close" title="حفظ وإغلاق">${GM.close}</button></span></div>
      <div class="gm-wrap">
        ${rowHtml(C, 'to')}${rowHtml(C, 'cc')}${rowHtml(C, 'bcc')}
        <div class="gm-row"><input class="gm-in gm-subj" placeholder="الموضوع" maxlength="200" value="${esc(pre.subject)}"></div>
        <div class="gm-row gm-req"><label>🔗 طلب مرتبط</label><input class="gm-in gm-reqin" placeholder="رقم الطلب (اختياري) مثل SADEN-2026-0104" dir="ltr" maxlength="40" value="${esc(pre.reqSerial || '')}"></div>
        <div class="gm-editor gm-html" contenteditable="true" dir="rtl" spellcheck="true"></div>
        <div class="gm-atts"></div><div class="gm-err"></div>
        ${toolsHtml()}
        ${footHtml(C.replyBy)}
      </div>`;
  }

  /* ---------- المسودة: تُحفظ تلقائياً بعد كل تعديل، وزر الإغلاق يحفظها، وسلة المهملات تحذفها ---------- */
  const hasContent = (C) =>
    C.sel.to.size + C.sel.cc.size + C.sel.bcc.size ||
    $('.gm-subj', C.win).value.trim() !== C.pre.subject ||
    C.ed.innerText.trim() ||
    C.files.length;
  const draftBody = (C) => ({
    to: [...C.sel.to],
    cc: [...C.sel.cc],
    bcc: [...C.sel.bcc],
    subject: $('.gm-subj', C.win).value,
    html: C.ed.innerHTML,
    reqSerial: $('.gm-reqin', C.win).value.trim(),
    replyTo: C.pre.replyTo,
    replyBy: C.replyBy,
  });
  async function saveDraft(C) {
    clearTimeout(C.saveT);
    if (C.sent || !hasContent(C)) return;
    try {
      C.saving = api('PUT', `/api/mail/drafts${C.draftId ? `/${C.draftId}` : ''}`, draftBody(C));
      C.draftId = (await C.saving).id;
      $('.gm-saved', C.win).textContent = '— حُفظت المسودة';
    } catch {
      $('.gm-saved', C.win).textContent = '— تعذر حفظ المسودة';
    } finally {
      C.saving = null;
    }
  }
  function queueSave(C) {
    clearTimeout(C.saveT);
    $('.gm-saved', C.win).textContent = '';
    C.saveT = setTimeout(() => saveDraft(C), 2000);
  }
  async function closeCompose(C, discard) {
    if (discard) {
      if (hasContent(C) && !(await askYesNo('حذف هذه المسودة؟'))) return;
      C.sent = true;
      clearTimeout(C.saveT);
      if (C.saving) await C.saving.catch(() => {});
      if (C.draftId) api('DELETE', `/api/mail/drafts/${C.draftId}`).catch(() => {});
    } else if (hasContent(C)) {
      await saveDraft(C);
      toast(C.files.length ? 'حفظنا الرسالة في المسودات (المسودة لا تحفظ المرفقات)' : 'حُفظت الرسالة في المسودات');
    }
    C.win.remove();
    if (location.hash.startsWith('#/mail/new')) location.hash = '#/mail';
  }

  /* ---------- المستلمون: شرائح + اقتراحات (مستخدمون وفروع)؛ من يُضاف في خانة يُحذف من غيرها ---------- */
  function addRcpt(C, k, id) {
    ['to', 'cc', 'bcc'].forEach((x) => C.sel[x].delete(id));
    C.sel[k].add(id);
  }
  function drawChips(C) {
    ['to', 'cc', 'bcc'].forEach((k) => {
      const row = $(`.gm-rcpt[data-k="${k}"]`, C.win);
      $('.gm-chips', row).innerHTML = [...C.sel[k]]
        .map((id) => {
          const u = C.users.find((x) => x.id === id);
          return u
            ? `<span class="gm-chip" title="${esc([u.title, u.branch].filter(Boolean).join(' — '))}">${esc(u.name)}<button type="button" data-rm="${id}" aria-label="إزالة">×</button></span>`
            : '';
        })
        .join('');
      $$('[data-rm]', row).forEach((b) => {
        b.onclick = () => {
          C.sel[k].delete(b.dataset.rm);
          drawChips(C);
          queueSave(C);
        };
      });
    });
  }
  /* اقتراحات البحث: مجموعات، ثم مسميات، ثم فروع، ثم مستخدمون */
  const rcptHits = (C, q) => [
    ...C.groups
      .filter((g) => g.name.includes(q))
      .slice(0, 4)
      .map((g) => ({ isGroup: true, g })),
    ...C.roleNames
      .filter((r) => r.includes(q))
      .slice(0, 3)
      .map((r) => ({ isRole: true, role: r })),
    ...C.branches
      .filter((b) => b.includes(q))
      .slice(0, 3)
      .map((b) => ({ isBranch: true, branch: b })),
    ...C.users.filter((u) => `${u.name} ${u.title} ${u.branch}`.includes(q)).slice(0, 8),
  ];
  const hitHtml = (C, h, i) =>
    h.isGroup
      ? `<button type="button" data-h="${i}"><b>👥 مجموعة: ${esc(h.g.name)}</b><small>${h.g.members.length} عضو${h.g.shared ? ' — مشتركة' : ''}</small></button>`
      : h.isRole
        ? `<button type="button" data-h="${i}"><b>👥 كل المسمى: ${esc(h.role)}</b><small>${C.users.filter((u) => u.roleName === h.role).length} مستخدم</small></button>`
        : h.isBranch
          ? `<button type="button" data-h="${i}"><b>👥 كل مستخدمي فرع ${esc(h.branch)}</b></button>`
          : `<button type="button" data-h="${i}"><b>${esc(h.name)}</b><small>${esc([h.title, h.branch].filter(Boolean).join(' — '))}</small></button>`;
  /* إضافة اقتراح: مجموعة / مسمى / فرع تضيف كل أعضائها */
  function pickHit(C, k, h) {
    const { users } = C;
    if (h.isGroup) h.g.members.filter((id) => id !== state.user.id && users.some((u) => u.id === id)).forEach((id) => addRcpt(C, k, id));
    else if (h.isRole) users.filter((u) => u.roleName === h.role).forEach((u) => addRcpt(C, k, u.id));
    else if (h.isBranch) users.filter((u) => u.branch === h.branch).forEach((u) => addRcpt(C, k, u.id));
    else addRcpt(C, k, h.id);
  }
  function wireRcptRow(C, row) {
    const k = row.dataset.k,
      inp = $('.gm-in', row),
      sug = $('.gm-sug', row);
    let hits = [];
    const pick = (h) => {
      pickHit(C, k, h);
      inp.value = '';
      sug.hidden = true;
      drawChips(C);
      queueSave(C);
      inp.focus();
    };
    inp.oninput = () => {
      const q = inp.value.trim();
      if (!q) {
        sug.hidden = true;
        return;
      }
      hits = rcptHits(C, q);
      sug.innerHTML = hits.map((h, i) => hitHtml(C, h, i)).join('') || '<div class="muted" style="padding:8px">لا نتائج</div>';
      sug.hidden = false;
      $$('[data-h]', sug).forEach((b) => {
        b.onmousedown = (e) => {
          e.preventDefault();
          pick(hits[b.dataset.h]);
        };
      });
    };
    inp.onkeydown = (e) => {
      if (e.key === 'Enter' && hits.length && !sug.hidden) {
        e.preventDefault();
        pick(hits[0]);
      }
      if (e.key === 'Backspace' && !inp.value && C.sel[k].size) {
        C.sel[k].delete([...C.sel[k]].pop());
        drawChips(C);
      }
    };
    inp.onblur = () =>
      setTimeout(() => {
        sug.hidden = true;
      }, 150);
    row.onclick = (e) => {
      if (e.target === row || e.target.classList.contains('gm-chips')) inp.focus();
    };
  }
  function wireRecipients(C) {
    const { win } = C;
    $$('.gm-rcpt', win).forEach((row) => wireRcptRow(C, row));
    $$('[data-show]', win).forEach((a) => {
      a.onclick = (e) => {
        e.preventDefault();
        const row = $(`.gm-rcpt[data-k="${a.dataset.show}"]`, win);
        row.hidden = false;
        a.hidden = true;
        $('.gm-in', row).focus();
      };
    });
    ['cc', 'bcc'].forEach((k) => {
      if (C.sel[k].size) $(`[data-show="${k}"]`, win).hidden = true;
    });
    drawChips(C);
  }

  /* ---------- المحرر: الأوامر على التحديد المحفوظ (الأزرار لا تسحب التركيز من النص) ---------- */
  function saveSel(C) {
    const s = getSelection();
    if (s.rangeCount && C.ed.contains(s.anchorNode)) C.range = s.getRangeAt(0).cloneRange();
  }
  function restoreSel(C) {
    C.ed.focus({ preventScroll: true });
    if (C.range) {
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(C.range);
    }
  }
  /* لو التحديد ما زال داخل المحرر يُستخدم كما هو، وإلا يُرجع آخر تحديد محفوظ */
  function ensureSel(C) {
    const s = getSelection();
    if (!(s.rangeCount && C.ed.contains(s.anchorNode))) restoreSel(C);
    else if (document.activeElement !== C.ed) {
      const r0 = s.getRangeAt(0).cloneRange();
      C.ed.focus();
      s.removeAllRanges();
      s.addRange(r0);
    }
  }
  function exec(C, cmd, val) {
    ensureSel(C);
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(cmd, false, val);
    saveSel(C);
    syncState(C);
  }
  function blockOf(C) {
    const s = getSelection();
    let n = s.anchorNode;
    while (n && n !== C.ed) {
      if (n.nodeType === 1 && /^(DIV|P|LI|BLOCKQUOTE|H[1-3])$/.test(n.tagName)) return n;
      n = n.parentNode;
    }
    return null;
  }
  function syncState(C) {
    ['bold', 'italic', 'underline', 'insertOrderedList', 'insertUnorderedList', 'strikeThrough'].forEach((c) => {
      const b = $(`.gm-tools [data-cmd="${c}"]`, C.win);
      if (b) b.classList.toggle('on', document.queryCommandState(c));
    });
  }
  const closePops = (C, except) =>
    $$('.gm-pop', C.win).forEach((p) => {
      if (p !== except) p.hidden = true;
    });
  function wireEditor(C) {
    const { win, ed } = C;
    const onSel = () => saveSel(C);
    document.addEventListener('selectionchange', onSel);
    ['keyup', 'mouseup', 'input'].forEach((ev) =>
      ed.addEventListener(ev, () => {
        saveSel(C);
        syncState(C);
      }),
    );
    win.addEventListener('mousedown', (e) => {
      if (e.target.closest('.gm-tb, .gm-pop button, .gm-fb')) e.preventDefault();
    });
    $$('[data-pop]', win).forEach((b) => {
      b.onclick = () => togglePop(C, b);
    });
    document.addEventListener('mousedown', function off(e) {
      if (!document.body.contains(win)) {
        document.removeEventListener('mousedown', off);
        document.removeEventListener('selectionchange', onSel);
        return;
      }
      if (!e.target.closest('.gm-pop-w')) closePops(C);
    });
    $$('.gm-tools [data-cmd], .gm-pop [data-cmd]', win).forEach((b) => {
      b.onclick = () => {
        runCmd(C, b.dataset.cmd);
        closePops(C);
      };
    });
  }
  /* فتح / إغلاق قائمة منبثقة؛ قائمة الرابط تبدأ بالنص المحدد */
  function togglePop(C, b) {
    const p = $(`.gm-pop[data-p="${b.dataset.pop}"]`, C.win);
    closePops(C, p);
    p.hidden = !p.hidden;
    if (!p.hidden && b.dataset.pop === 'link') {
      const s = C.range ? C.range.toString() : '';
      $('[data-l="text"]', p).value = s;
      $('[data-l="url"]', p).value = '';
      setTimeout(() => $('[data-l="url"]', p).focus(), 0);
    }
  }
  /* أمر من شريط التنسيق؛ الاقتباس واتجاه النص يُطبَّقان على الفقرة الحالية */
  function runCmd(C, c) {
    if (c === 'quote') {
      ensureSel(C);
      const bl = blockOf(C);
      exec(C, 'formatBlock', bl && bl.closest('blockquote') ? 'div' : 'blockquote');
    } else if (c === 'dir') {
      ensureSel(C);
      let bl = blockOf(C);
      if (!bl) {
        exec(C, 'formatBlock', 'div');
        bl = blockOf(C);
      }
      if (bl) {
        const ltr = (bl.getAttribute('dir') || getComputedStyle(bl).direction) !== 'ltr';
        bl.setAttribute('dir', ltr ? 'ltr' : 'rtl');
        bl.style.textAlign = ltr ? 'left' : 'right';
      }
    } else exec(C, c);
  }
  /* الخط والحجم والألوان والرموز */
  function wireFormat(C) {
    const { win } = C;
    $('.gm-font', win).onchange = (e) => exec(C, 'fontName', e.target.value);
    const each = (sel, fn) =>
      $$(sel, win).forEach((b) => {
        b.onclick = () => {
          fn(b);
          closePops(C);
        };
      });
    each('[data-size]', (b) => exec(C, 'fontSize', b.dataset.size));
    each('[data-fg]', (b) => {
      exec(C, 'foreColor', b.dataset.fg);
      $('.gm-col-bar', win).style.fill = b.dataset.fg;
    });
    each('[data-bg]', (b) => exec(C, 'hiliteColor', b.dataset.bg));
    each('[data-emo]', (b) => exec(C, 'insertText', b.dataset.emo));
    $('[data-l="ok"]', win).onclick = () => insertLink(C);
    $('.gm-link-pop', win).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('[data-l="ok"]', win).click();
      }
    });
  }
  function insertLink(C) {
    const p = $('.gm-link-pop', C.win),
      url = $('[data-l="url"]', p).value.trim(),
      text = $('[data-l="text"]', p).value.trim() || url;
    if (!/^(https?:\/\/|mailto:)/i.test(url)) {
      $('[data-l="url"]', p).focus();
      toast('اكتب رابطاً يبدأ بـ https://', true);
      return;
    }
    restoreSel(C);
    if (C.range && !C.range.collapsed && C.range.toString() === text) exec(C, 'createLink', url);
    else exec(C, 'insertHTML', `<a href="${esc(url)}">${esc(text)}</a>&nbsp;`);
    closePops(C);
  }
  /* ميعاد الرد */
  function setDue(C, v) {
    C.replyBy = v;
    const c = $('.gm-due-chip', C.win);
    c.hidden = !v;
    $('b', c).textContent = v ? dueTxt(v) : '';
    $('[data-pop="due"]', C.win).classList.toggle('on', !!v);
    queueSave(C);
  }
  function wireDue(C) {
    const { win } = C;
    $('[data-due="ok"]', win).onclick = () => {
      const v = $('[data-due="v"]', win).value;
      if (v && new Date(v) <= new Date()) {
        toast('اختر ميعاداً في المستقبل', true);
        return;
      }
      setDue(C, v);
      closePops(C);
    };
    $('[data-due="clear"]', win).onclick = () => {
      $('[data-due="v"]', win).value = '';
      setDue(C, '');
      closePops(C);
    };
  }

  /* ---------- المرفقات والصور داخل الرسالة ---------- */
  function drawAtts(C) {
    $('.gm-atts', C.win).innerHTML = C.files
      .map(
        (f, i) =>
          `<span class="gm-att"><span>📎 ${esc(f.name)}</span><small>${f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.ceil(f.size / 1024)} KB`}</small><button type="button" data-ra="${i}" aria-label="إزالة">×</button></span>`,
      )
      .join('');
    $$('[data-ra]', C.win).forEach((b) => {
      b.onclick = () => {
        C.files.splice(b.dataset.ra, 1);
        drawAtts(C);
      };
    });
  }
  /* الصورة تُصغَّر لعرض 900 بكسل كحد أقصى وتُدرج داخل النص */
  function insertImage(C, f) {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 900 / img.width),
        cv = document.createElement('canvas');
      cv.width = Math.round(img.width * s);
      cv.height = Math.round(img.height * s);
      const cx = cv.getContext('2d');
      cx.fillStyle = '#fff';
      cx.fillRect(0, 0, cv.width, cv.height);
      cx.drawImage(img, 0, 0, cv.width, cv.height);
      exec(C, 'insertImage', cv.toDataURL('image/jpeg', 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  }
  function wireFiles(C) {
    const { win } = C;
    const max = (Number(state.config.maxUploadMb) || 5) * 1024 * 1024;
    const fAtt = $('[data-file="att"]', win),
      fImg = $('[data-file="img"]', win);
    fAtt.onchange = () => {
      [...fAtt.files].forEach((f) => {
        if (f.size > max) toast(`${f.name}: حجمه أكبر من ${state.config.maxUploadMb} ميجابايت`, true);
        else if (C.files.length < 10) C.files.push(f);
      });
      fAtt.value = '';
      drawAtts(C);
    };
    fImg.onchange = () => {
      const f = fImg.files[0];
      fImg.value = '';
      if (!f) return;
      insertImage(C, f);
    };
    $$('[data-f]', win).forEach((b) => {
      b.onclick = () => {
        const f = b.dataset.f;
        if (f === 'fmt') {
          b.classList.toggle('on');
          $('.gm-tools', win).hidden = !b.classList.contains('on');
        }
        if (f === 'att') fAtt.click();
        if (f === 'img') {
          saveSel(C);
          fImg.click();
        }
        if (f === 'discard') closeCompose(C, true);
      };
    });
  }
  /* أزرار النافذة: تصغير / ملء الشاشة / إغلاق */
  function wireWindow(C) {
    const { win } = C;
    $$('[data-w]', win).forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        if (b.dataset.w === 'min') {
          win.classList.toggle('min');
          win.classList.remove('max');
        }
        if (b.dataset.w === 'max') {
          win.classList.toggle('max');
          win.classList.remove('min');
        }
        if (b.dataset.w === 'close') closeCompose(C, false);
      };
    });
    $('.gm-head', win).onclick = () => {
      if (win.classList.contains('min')) win.classList.remove('min');
    };
  }

  /* ---------- الإرسال ---------- */
  const sendErr = (C, m) => {
    $('.gm-err', C.win).innerHTML = m ? `<div class="err">${esc(m)}</div>` : '';
  };
  /* رسالة الخطأ قبل الإرسال، أو '' لو الرسالة سليمة */
  function sendProblem(C, subject) {
    if (!C.sel.to.size) return 'اختر مستلماً واحداً على الأقل في "إلى"';
    if (!subject) return 'اكتب موضوع الرسالة';
    if (!C.ed.innerText.trim() && !C.ed.querySelector('img')) return 'اكتب نص الرسالة';
    if (C.ed.innerHTML.length > 3 * 1024 * 1024) return 'حجم الرسالة كبير (الصور داخلها كثيرة) — أرسل الصور كمرفقات';
    return '';
  }
  async function uploadAtts(C, id) {
    for (const f of C.files) {
      const res = await fetch(`/api/mail/${id}/attachments?name=${encodeURIComponent(f.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: f,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast(`${f.name}: ${j.error || 'تعذر رفع المرفق'}`, true);
      }
    }
  }
  async function sendMail(C) {
    const { win, sel } = C;
    const subject = $('.gm-subj', win).value.trim();
    const problem = sendProblem(C, subject);
    if (problem) return sendErr(C, problem);
    const html = C.ed.innerHTML;
    sendErr(C, '');
    const btn = $('.gm-send', win);
    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';
    C.sent = true;
    clearTimeout(C.saveT);
    if (C.saving) await C.saving.catch(() => {});
    try {
      const m = await api('POST', '/api/mail', {
        to: [...sel.to],
        cc: [...sel.cc],
        bcc: [...sel.bcc],
        subject,
        html,
        replyTo: C.pre.replyTo,
        reqSerial: $('.gm-reqin', win).value.trim(),
        draftId: C.draftId,
        replyBy: C.replyBy,
      });
      await uploadAtts(C, m.id);
      toast('تم إرسال الرسالة');
      win.remove();
      location.hash = `#/mail/${m.id}`;
    } catch (x) {
      sendErr(C, x.message);
      btn.disabled = false;
      btn.textContent = 'إرسال';
      C.sent = false;
    }
  }

  async function mailCompose(query) {
    const main = $('#main') || document.querySelector('main');
    const [users, groups] = await Promise.all([api('GET', '/api/mail/users'), api('GET', '/api/mail/groups').catch(() => [])]);
    const { pre, draftId } = await loadPre(query, users);
    const C = {
      query,
      users,
      groups,
      pre,
      draftId,
      replyBy: pre.replyBy || '',
      roleNames: [...new Set(users.map((u) => u.roleName).filter(Boolean))],
      branches: [...new Set(users.map((u) => u.branch).filter(Boolean))].sort(),
      sel: { to: new Set(pre.to), cc: new Set(pre.cc), bcc: new Set(pre.bcc) },
      files: [],
      saveT: null,
      saving: null,
      sent: false,
      range: null,
    };
    const win = document.createElement('div');
    C.win = win;
    win.className = 'gm-compose';
    win.setAttribute('data-noicon', '');
    win.innerHTML = composeHtml(C);
    main.appendChild(win);
    C.ed = $('.gm-editor', win);
    C.ed.innerHTML = pre.html;
    win.addEventListener('input', () => queueSave(C));
    wireRecipients(C);
    wireEditor(C);
    wireFormat(C);
    wireDue(C);
    wireFiles(C);
    wireWindow(C);
    $('.gm-send', win).onclick = () => sendMail(C);
    (C.sel.to.size ? (pre.subject ? C.ed : $('.gm-subj', win)) : $('.gm-rcpt[data-k="to"] .gm-in', win)).focus();
  }

  return { mailCompose };
};
