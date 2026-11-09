'use strict';
/* صفحة «about» (viewAbout) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...).
 * المتغيرات المشتركة القابلة للتغيير تُقرأ وتُكتب عبر S.<الاسم> مباشرة. */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['about'] = function (S) {
  const {
    $,
    $$,
    SF,
    api,
    askText,
    askYesNo,
    dt,
    esc,
    head,
    icon,
    loadPdfLib,
    normAr,
    ocClosed,
    orgChartHtml,
    printDocs,
    shell,
    state,
    toast,
    today,
    uploadFile,
  } = S;
  async function orgEditStart(draw) {
    try {
      const r = await api('GET', '/api/admin/orgdiv');
      S.otEdit = { units: r.units.map((u) => ({ ...u })), emps: r.emps || [], dirty: false };
      S.ocMode = 'co';
      draw();
    } catch (err) {
      toast(err.message, true);
    }
  }

  /* ---------- الهيكل التنظيمي ---------- */
  /* كل الوحدات تحت وحدة (بكل المستويات) */
  const unitsUnder = (units, id) => units.filter((u) => u.parent === id).flatMap((k) => [k.id, ...unitsUnder(units, k.id)]);
  /* طي / فتح وحدة، وفتح الكل أو طي الكل */
  function bindOcToggles(main, draw, before, closeAll) {
    main.querySelectorAll('[data-tg]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.tg;
        if (ocClosed.has(id)) ocClosed.delete(id);
        else ocClosed.add(id);
        before();
        draw();
      };
    });
    main.querySelectorAll('[data-oall]').forEach((b) => {
      b.onclick = () => {
        ocClosed.clear();
        if (b.dataset.oall === 'close') closeAll();
        draw();
      };
    });
  }

  function bindOrgChart(main, d, draw) {
    main.querySelectorAll('[data-ov]').forEach((b) => {
      b.onclick = () => {
        if (S.ocView === b.dataset.ov) return;
        S.ocView = b.dataset.ov;
        S.ocFitted = false;
        draw();
      };
    });
    if ($('#otWrap', main)) return bindOrgTree(main, d, draw);
    bindOrgClassic(main, d, draw);
  }

  /* عرض الشجرة: أوضاع الشركة / الفروع، والتكبير، والتعديل، والبحث */
  function bindOrgTree(main, d, draw) {
    main.querySelectorAll('[data-om]').forEach((b) => {
      b.onclick = () => {
        if (S.ocMode === b.dataset.om) return;
        S.ocMode = b.dataset.om;
        S.ocBranch = '';
        draw();
      };
    });
    /* فرع واحد: يُعرض وحده مفتوحاً بالكامل */
    if ($('#otBr', main))
      $('#otBr', main).onchange = (e) => {
        S.ocBranch = e.target.value;
        if (S.ocBranch) [S.ocBranch, ...unitsUnder(d.units, S.ocBranch)].forEach((id) => ocClosed.delete(id));
        draw();
      };
    const keep = bindTreeZoom(main);
    /* ---- وضع التعديل ---- */
    if (S.otEdit) bindOrgEdit(main, d, draw, keep);
    bindOcToggles(main, draw, keep, () => {
      S.otInit = false;
    });
    bindOrgSearch(main, d, draw);
  }
  /* التكبير والتمرير؛ ترجع دالة تحفظ موضع التمرير قبل إعادة الرسم */
  function bindTreeZoom(main) {
    const w = $('#otWrap', main),
      t = $('#otTree', main);
    const center = () => {
      w.scrollLeft = ((w.scrollWidth - w.clientWidth) / 2) * (getComputedStyle(w).direction === 'rtl' ? -1 : 1);
    };
    const setZ = (z) => {
      S.ocZoom = Math.max(0.25, Math.min(1.5, Math.round(z * 100) / 100));
      t.style.zoom = S.ocZoom;
      $('#otZ', main).textContent = `${Math.round(S.ocZoom * 100)}%`;
      center();
    };
    const fit = () => {
      t.style.zoom = 1;
      setZ(Math.min(1, (w.clientWidth - 16) / t.scrollWidth));
    };
    main.querySelectorAll('[data-oz]').forEach((b) => {
      b.onclick = () => (b.dataset.oz === 'fit' ? fit() : setZ(S.ocZoom + (b.dataset.oz === '+' ? 0.1 : -0.1)));
    });
    /* يبدأ العرض من منتصف الرسم حيث رأس الهيكل، وبعد الطي / الفتح يبقى في مكانه */
    if (S.otScroll) {
      w.scrollLeft = S.otScroll[0];
      w.scrollTop = S.otScroll[1];
      S.otScroll = null;
    } else center();
    return () => {
      S.otScroll = [w.scrollLeft, w.scrollTop];
    };
  }
  /* البحث في الشجرة: يفتح أصول كل نتيجة مطوية ويميّز النتائج */
  function bindOrgSearch(main, d, draw) {
    const q = $('#ogQ', main);
    const mark = () => {
      const v = normAr(S.otQuery);
      let first = null,
        n = 0;
      $$('.ot-p', main).forEach((p) => {
        const hit = !!v && p.dataset.oq.includes(v);
        p.classList.toggle('hit', hit);
        if (hit) {
          n++;
          first = first || p;
        }
      });
      $('#ogN', main).textContent = v ? `${n} نتيجة` : '';
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    };
    if (!q) return;
    q.value = S.otQuery;
    q.oninput = () => {
      S.otQuery = q.value.trim();
      if (!openHits(d, normAr(S.otQuery))) return mark();
      draw();
      const q2 = $('#ogQ');
      if (q2) {
        q2.focus();
        q2.setSelectionRange(q2.value.length, q2.value.length);
      }
    };
    if (S.otQuery) mark();
  }
  /* يفتح أصول الوحدات المطابقة للبحث؛ ترجع true لو فُتح شيء */
  function openHits(d, v) {
    let opened = false;
    if (v)
      d.units
        .filter((u) => normAr(`${u.name} ${u.manager || ''}`).includes(v))
        .forEach((u) => {
          for (let x = d.units.find((y) => y.id === u.parent), i = 0; x && i < 30; x = d.units.find((y) => y.id === x.parent), i++)
            if (ocClosed.delete(x.id)) opened = true;
        });
    return opened;
  }

  /* ---- تعديل الهيكل ---- */
  const OT_KINDS = ['إدارة', 'فرع', 'قسم', 'منصب'];
  const OT_CAN = {
    إدارة: ['إدارة', 'فرع', 'قسم', 'منصب'],
    فرع: ['قسم', 'منصب'],
    قسم: ['قسم', 'منصب'],
    منصب: ['إدارة', 'فرع', 'قسم', 'منصب'],
  };
  const empLabel = (e) => `${e[1]} — ${e[2] || '؟'}`;
  /* نوع الوحدة الجديدة حسب نوع الأب */
  const childKind = (par) =>
    par ? (par.kind === 'إدارة' ? 'قسم' : par.kind === 'فرع' ? 'قسم' : par.kind === 'قسم' ? 'منصب' : 'إدارة') : 'إدارة';
  function unitFormHtml(U, u, isNew) {
    const par = U.find((x) => x.id === u.parent);
    const allowed = par ? OT_CAN[par.kind] : ['إدارة', 'منصب'];
    const no = new Set([u.id, ...unitsUnder(U, u.id)]);
    const parents = U.filter((p) => !no.has(p.id) && p.name);
    const curEmp = u.empId && S.otEdit.emps.find((e) => e[0] === u.empId);
    return `<form class="modal" style="max-width:560px;width:96%" novalidate><h3 style="margin-top:0">${isNew ? `${icon('plus')} إضافة وحدة${par ? ` تحت «${esc(par.name)}»` : ' في أعلى الهيكل'}` : `${icon('pencil')} تعديل «${esc(u.name)}»`}</h3>
            <div class="field"><label>النوع</label><div class="ot-kinds">${OT_KINDS.map((k) => `<label class="${allowed.includes(k) ? '' : 'dis'}"><input type="radio" name="kind" value="${k}"${u.kind === k ? ' checked' : ''}${allowed.includes(k) ? '' : ' disabled'}> ${k}</label>`).join('')}</div></div>
            <div class="field"><label>الاسم *</label><input class="in" name="name" value="${esc(u.name || '')}" placeholder="مثال: إدارة الموارد البشرية / المدير المالي"></div>
            <div class="field"><label>الشخص (المدير / شاغل المنصب) <small class="muted">من سجل الموظفين، أو اكتب الاسم</small></label><input class="in" name="manager" list="otEmps" value="${esc(curEmp ? empLabel(curEmp) : u.manager || '')}" placeholder="ابحث بالاسم أو الرقم الوظيفي..."><datalist id="otEmps">${S.otEdit.emps.map((e) => `<option value="${esc(empLabel(e))}">${esc(e[3] || '')}</option>`).join('')}</datalist></div>
            <div class="field"><label>يتبع</label><select class="in" name="parent">${['إدارة', 'منصب'].includes(u.kind) ? '<option value="">— أعلى الهيكل —</option>' : ''}${parents.map((p) => `<option value="${p.id}"${p.id === u.parent ? ' selected' : ''}>${esc(`${p.kind} ${p.name}`)}</option>`).join('')}</select></div>
            <div class="merr"></div><div class="row" style="gap:8px;margin-top:10px"><button class="btn primary">${isNew ? 'إضافة' : 'تطبيق'}</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
  }
  /* نافذة إضافة / تعديل وحدة */
  function unitForm(U, u, isNew, touch) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = unitFormHtml(U, u, isNew);
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    setTimeout(() => $('[name=name]', bg).focus(), 50);
    $('form', bg).onsubmit = (ev) => {
      ev.preventDefault();
      const f = ev.target,
        name = f.name.value.trim(),
        kind = (f.querySelector('[name=kind]:checked') || {}).value || u.kind || 'قسم';
      if (!name) {
        $('.merr', bg).innerHTML = '<div class="err">اكتب الاسم</div>';
        return;
      }
      const mv = f.manager.value.trim(),
        m = /—\s*(\S+)\s*$/.exec(mv),
        emp = m && S.otEdit.emps.find((e) => (e[2] || '؟') === m[1] && mv.startsWith(e[1]));
      Object.assign(u, { name, kind, parent: f.parent.value, manager: emp ? emp[1] : mv, empId: emp ? emp[0] : '' });
      if (isNew) U.push(u);
      if (u.parent) ocClosed.delete(u.parent);
      bg.remove();
      touch();
    };
  }
  function bindOrgEdit(main, d, draw, keep) {
    const U = S.otEdit.units;
    const touch = () => {
      S.otEdit.dirty = true;
      keep();
      draw();
    };
    main.querySelectorAll('[data-ued]').forEach((b) => {
      b.onclick = () =>
        unitForm(
          U,
          U.find((x) => x.id === b.dataset.ued),
          false,
          touch,
        );
    });
    main.querySelectorAll('[data-uadd]').forEach((b) => {
      b.onclick = () => {
        const par = U.find((x) => x.id === b.dataset.uadd);
        unitForm(
          U,
          { id: Math.random().toString(16).slice(2, 14), name: '', kind: childKind(par), parent: par ? par.id : '', manager: '' },
          true,
          touch,
        );
      };
    });
    main.querySelectorAll('[data-udel]').forEach((b) => {
      b.onclick = async () => {
        const u = U.find((x) => x.id === b.dataset.udel),
          sub = unitsUnder(U, u.id);
        if (!(await askYesNo(sub.length ? `حذف «${u.name}» وكل ما تحته (${sub.length} وحدة)؟` : `حذف «${u.name}»؟`))) return;
        const gone = new Set([u.id, ...sub]);
        S.otEdit.units = U.filter((x) => !gone.has(x.id));
        touch();
      };
    });
    bindOrgEditSave(main, d, draw);
  }
  function bindOrgEditSave(main, d, draw) {
    $('#otCancel', main).onclick = async () => {
      if (S.otEdit.dirty && !(await askYesNo('إلغاء التعديلات غير المحفوظة؟'))) return;
      S.otEdit = null;
      draw();
    };
    $('#otSave', main).onclick = async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        await api('PUT', '/api/admin/orgdiv', { units: S.otEdit.units });
        Object.assign(d, await api('GET', '/api/about'));
        S.otEdit = null;
        toast('تم حفظ الهيكل');
        draw();
      } catch (err) {
        toast(err.message, true);
        btn.disabled = false;
      }
    };
  }

  /* العرض الكلاسيكي (#ocWrap): التكبير، الطي، أوضاع الشركة / الفروع، وPDF والطباعة */
  function bindOrgClassic(main, d, draw) {
    const wrap = $('#ocWrap', main),
      oc = $('#oc', main);
    if (!wrap) return;
    const setZ = (z) => {
      S.ocZoom = Math.max(0.3, Math.min(1.6, Math.round(z * 100) / 100));
      oc.style.zoom = S.ocZoom;
      $('.oc-zv', main).textContent = `${Math.round(S.ocZoom * 100)}%`;
    };
    const fit = () => {
      oc.style.zoom = 1;
      setZ(Math.min(1, (wrap.clientWidth - 20) / oc.scrollWidth));
    };
    /* يُمرَّر للمنتصف حيث رأس الهيكل */
    const center = () => {
      wrap.scrollLeft = ((wrap.scrollWidth - wrap.clientWidth) / 2) * (getComputedStyle(wrap).direction === 'rtl' ? -1 : 1);
    };
    main.querySelectorAll('[data-oz]').forEach((b) => {
      b.onclick = () => {
        if (b.dataset.oz === 'fit') fit();
        else setZ(S.ocZoom + (b.dataset.oz === '+' ? 0.1 : -0.1));
        center();
      };
    });
    bindOcToggles(
      main,
      draw,
      () => {},
      () => d.units.filter((u) => d.units.some((x) => x.parent === u.id)).forEach((u) => ocClosed.add(u.id)),
    );
    bindOcModes(main, d, draw);
    /* أول فتح: ملاءمة الرسم لعرض الشاشة */
    if (!S.ocFitted) {
      S.ocFitted = true;
      fit();
    }
    bindOcExport(main, d, oc);
    center();
  }
  /* التبديل بين هيكل الشركة وهيكل الفروع؛ الفرع المختار يُعرض مفتوحاً بالكامل */
  function bindOcModes(main, d, draw) {
    const openBranch = () => {
      (S.ocBranch ? [S.ocBranch] : d.units.filter((u) => u.kind === 'فرع').map((u) => u.id)).forEach((b) =>
        [b, ...unitsUnder(d.units, b)].forEach((id) => ocClosed.delete(id)),
      );
    };
    main.querySelectorAll('[data-om]').forEach((b) => {
      b.onclick = () => {
        if (S.ocMode === b.dataset.om) return;
        S.ocMode = b.dataset.om;
        S.ocFitted = false;
        if (S.ocMode === 'br') openBranch();
        draw();
      };
    });
    if ($('#ocBr', main))
      $('#ocBr', main).onchange = (e) => {
        S.ocBranch = e.target.value;
        openBranch();
        S.ocFitted = false;
        draw();
      };
  }
  /* تنزيل PDF والطباعة */
  function bindOcExport(main, d, oc) {
    const brName = S.ocMode === 'br' ? (d.units.find((u) => u.id === S.ocBranch) || {}).name || '' : '';
    const pTitle =
      S.ocMode === 'br' ? (brName ? `الهيكل الإداري لفرع ${brName}` : 'الهيكل الإداري للفروع') : `الهيكل الإداري — ${d.company || ''}`;
    $('#ocPdf', main).onclick = (e) => downloadOcPdf(main, e.currentTarget, pTitle);
    $('#ocPrint', main).onclick = () =>
      printDocs(
        pTitle,
        { landscape: true },
        `<div class="oc-print"><h2 style="text-align:center;margin:0 0 6mm">${esc(pTitle)}</h2>${oc.outerHTML.replace(/style="zoom:[^"]*"/, '')}</div>`,
      );
  }
  /* تنزيل PDF من السيرفر بالعرض الظاهر نفسه (المطويّ منه والفرع المختار)؛ وبدون متصفح على السيرفر تُفتح الطباعة */
  async function downloadOcPdf(main, b, pTitle) {
    const old = b.innerHTML;
    b.disabled = true;
    b.innerHTML = '⏳ جارٍ التجهيز...';
    try {
      const q = new URLSearchParams({ mode: S.ocMode, branch: S.ocMode === 'br' ? S.ocBranch : '', closed: [...ocClosed].join(',') });
      const res = await fetch(`/api/org-chart/pdf?${q}`, { credentials: 'same-origin' });
      if (res.status === 501) {
        toast('اختر «حفظ PDF» من نافذة الطباعة');
        $('#ocPrint', main).click();
        return;
      }
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'تعذر إنشاء الملف');
      const m = /filename\*=UTF-8''([^;]+)/.exec(res.headers.get('Content-Disposition') || '');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await res.blob());
      a.download = m ? decodeURIComponent(m[1]) : `${pTitle}.pdf`;
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
  }

  /* ---------- حول الشركة: لكل العاملين ---------- */
  /* اللائحة الداخلية: صفحات PDF تُرسم داخل الصفحة (بدون أزرار تنزيل أو طباعة)، بعلامة مائية باسم المستخدم،
   * ويُمنع الزر الأيمن وCtrl+P / Ctrl+S عليها، وتظهر فارغة عند الطباعة — والتنزيل لمن يعدّل اللائحة فقط */
  async function renderRulesPdf(main) {
    const boxes = $$('.ab-pdf[data-pdf]', main);
    if (!boxes.length) return;
    const wm = esc(`${state.user.name} — ${today()}`);
    boxes.forEach((b) => {
      const det = b.closest('details');
      if (!det || det.open) showPdf(b, wm);
      if (det)
        det.addEventListener('toggle', () => {
          if (det.open) showPdf(b, wm);
        });
    });
    $$('.ab-pdf', main).forEach((b) => {
      b.oncontextmenu = (e) => e.preventDefault();
      b.ondragstart = (e) => e.preventDefault();
    });
  }
  /* عرض الصفحات بعرض المساحة كلها (ملء العرض)، مع تكبير / تصغير وملء الشاشة؛ يُعاد الرسم بدقة الشاشة عند كل تغيير */
  async function showPdf(box, wm) {
    if (box.dataset.done) return;
    box.dataset.done = '1';
    try {
      const lib = await loadPdfLib();
      /* الخطوط تُرسم من الملف نفسه (الحروف العربية متصلة كما في الأصل) */
      const pdf = await lib.getDocument({ url: box.dataset.pdf, disableFontFace: true, useSystemFonts: false, isEvalSupported: false })
        .promise;
      const bar = document.createElement('div');
      bar.className = 'ab-pdfbar';
      bar.innerHTML = `<button type="button" class="btn sm" data-z="-" title="تصغير">−</button><span class="ab-zv">100%</span><button type="button" class="btn sm" data-z="+" title="تكبير">+</button>
          <button type="button" class="btn sm" data-z="fit" title="ملء العرض">↔ ملء العرض</button><button type="button" class="btn sm" data-z="fs" title="ملء الشاشة">⛶ ملء الشاشة</button><span class="muted ab-np">${pdf.numPages} صفحة</span>`;
      box.before(bar);
      const st = { zoom: 1, seq: 0 };
      const render = () => renderPdfPages(box, bar, pdf, wm, st);
      wirePdfBar(box, bar, st, render);
      await render();
    } catch (err) {
      box.innerHTML = `<div class="err">${esc(err.message || 'تعذر عرض الملف')}</div>`;
    }
  }
  async function renderPdfPages(box, bar, pdf, wm, st) {
    const my = ++st.seq;
    const fitW = Math.max(280, box.clientWidth - 24),
      W = Math.round(fitW * st.zoom),
      dpr = Math.min(2, window.devicePixelRatio || 1);
    $('.ab-zv', bar).textContent = `${Math.round(st.zoom * 100)}%`;
    const top = box.scrollTop / Math.max(1, box.scrollHeight);
    box.innerHTML = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      if (my !== st.seq) return;
      const pg = await pdf.getPage(i),
        v1 = pg.getViewport({ scale: 1 }),
        vp = pg.getViewport({ scale: (W / v1.width) * dpr });
      const wrap = document.createElement('div');
      wrap.className = 'ab-pg';
      wrap.dataset.wm = wm;
      const c = document.createElement('canvas');
      c.width = vp.width;
      c.height = vp.height;
      c.style.width = `${W}px`;
      wrap.appendChild(c);
      box.appendChild(wrap);
      await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      if (i === 1 && top) box.scrollTop = top * box.scrollHeight;
    }
  }
  function wirePdfBar(box, bar, st, render) {
    bar.onclick = (e) => {
      const z = (e.target.closest('[data-z]') || {}).dataset;
      if (!z || !z.z) return;
      if (z.z === 'fs') {
        const host = box.closest('.ab-file') || box.parentElement;
        if (document.fullscreenElement) document.exitFullscreen();
        else if (host.requestFullscreen) host.requestFullscreen();
        return;
      }
      st.zoom = z.z === 'fit' ? 1 : Math.min(3, Math.max(0.4, Math.round((st.zoom + (z.z === '+' ? 0.2 : -0.2)) * 10) / 10));
      render();
    };
    document.addEventListener('fullscreenchange', () => {
      if (box.isConnected) setTimeout(render, 120);
    });
    let rt = null;
    window.addEventListener('resize', () => {
      if (!box.isConnected) return;
      clearTimeout(rt);
      rt = setTimeout(render, 250);
    });
  }

  /* ---------- صفحة «حول الشركة» ----------
   * حالة الصفحة في A: main، d (البيانات)، tab، edit، secs (نسخة المواد أثناء التعديل) */
  const para = (s) => esc(s || '').replace(/\n/g, '<br>');
  /* ملف من ملفات اللائحة: PDF بعارض داخل الصفحة والصور مباشرة، وغيرها (Word / Excel) تنزيل */
  function ruleFileHtml(d, f, i) {
    const ext = (String(f.name).match(/\.[^.]+$/) || [''])[0].toLowerCase(),
      url = `/api/about/files/${f.id}`;
    const view =
      ext === '.pdf'
        ? `<div class="ab-pdf" data-pdf="${url}"><div class="muted" style="padding:14px">جاري عرض اللائحة...</div></div>`
        : ['.png', '.jpg', '.jpeg'].includes(ext)
          ? `<img class="ab-img" src="${url}" alt="${esc(f.label || f.name)}">`
          : `<div class="muted" style="padding:10px 0">لا يمكن عرض هذا النوع داخل المتصفح${d.canEdit ? ` — <a href="${url}">⬇ تنزيل الملف</a>` : ' — يعرضه النظام بعد رفعه بصيغة PDF'}</div>`;
    return `<details class="ab-file"${i === 0 ? ' open' : ''}><summary><span>📄 ${f.label ? `<b>${esc(f.label)}</b> — ` : ''}${esc(f.name)}</span><small class="muted">${esc(dt(f.at))}</small>
              ${d.canEdit ? `<a class="btn sm ghost" href="${url}" download title="تنزيل (لمن يعدّل اللائحة فقط)">⬇</a>` : ''}${d.canEdit ? `<button class="btn sm bad" data-fdel="${f.id}">حذف</button>` : ''}</summary>${view}</details>`;
  }
  function ruleFilesCard(d) {
    if (!(d.files.length || d.canEdit)) return '';
    return `<div class="card"><div class="emp-sec-h"><h3>📎 ملفات اللائحة والسياسات</h3>${d.canEdit ? '<label class="btn sm" style="cursor:pointer">⬆ رفع ملف<input type="file" id="abFile" hidden multiple></label>' : ''}</div>
          ${d.files.length ? d.files.map((f, i) => ruleFileHtml(d, f, i)).join('') : '<div class="muted">لا توجد ملفات</div>'}</div>`;
  }
  function aboutBody(A) {
    const { d } = A;
    /* الهيكل التنظيمي: الرسم الهرمي (من التقسيم الإداري في الإعدادات) */
    if (A.tab === 'org') return orgChartHtml(d);
    if (A.edit)
      return `<div class="card"><h3>مواد / فصول اللائحة الداخلية</h3>${A.secs.map((x, i) => `<div class="ab-sec-e"><div class="row" style="gap:8px"><input class="in" data-s="${i}:title" value="${esc(x.title)}" placeholder="العنوان (مثال: الفصل الأول — ساعات العمل)"><button class="btn sm" data-up="${i}" title="أعلى">▲</button><button class="btn sm bad" data-sdel="${i}">✕</button></div><textarea class="in" rows="5" data-s="${i}:body" placeholder="نص المادة">${esc(x.body)}</textarea></div>`).join('')}
        <button class="btn sm" id="abAdd">➕ مادة / فصل</button></div>`;
    return `
        ${ruleFilesCard(d)}
        ${d.sections.length ? d.sections.map((x, i) => `<details class="card ab-sec" data-s="${esc(`${x.title} ${x.body}`)}"${i === 0 ? ' open' : ''}><summary><b>${esc(x.title || `مادة ${i + 1}`)}</b></summary><div class="ab-body">${para(x.body)}</div></details>`).join('') : '<div class="card empty">لم تضف اللائحة الداخلية بعد.</div>'}`;
  }
  /* أزرار رأس الصفحة.
   * ملاحظة: في الكود الأصلي كان شرط إخفاء «تعديل الهيكل» أثناء التعديل يقرأ otEdit من مصفوفة المواد المحلية
   * (كانت باسم S فتغطي S المشترك)، فكان الزر يظهر دائماً — والسلوك محفوظ كما هو */
  function aboutActions(A) {
    if (A.tab === 'org')
      return SF.settingsTabs(state.user).includes('orgdiv')
        ? '<button type="button" class="btn" id="abOrgEdit">✏️ تعديل الهيكل</button>'
        : '';
    if (!A.d.canEdit) return '';
    return A.edit
      ? '<button class="btn" id="abCancel">إلغاء</button><button class="btn primary" id="abSave">💾 حفظ</button>'
      : '<button class="btn primary" id="abEdit">✏️ تعديل</button>';
  }
  function drawAbout(A) {
    const { main, d, tab, edit } = A;
    const draw = () => drawAbout(A);
    main.innerHTML = `${head('حول الشركة', 'الهيكل التنظيمي واللائحة الداخلية — متاحة لكل العاملين', aboutActions(A))}
        <div class="tabs">${[
          ['org', 'الهيكل التنظيمي'],
          ['rules', 'اللائحة الداخلية'],
        ]
          .map(([k, l]) => `<a href="#/about?tab=${k}" class="${tab === k ? 'on' : ''}">${l}</a>`)
          .join('')}<a href="#/policy">سياسة الاستخدام</a></div>
        ${aboutBody(A)}${d.updatedAt && !edit ? `<div class="muted" style="font-size:12px;margin-top:6px">آخر تحديث ${esc(dt(d.updatedAt))}${d.updatedBy ? ` — ${esc(d.updatedBy)}` : ''}</div>` : ''}<div class="ferr"></div>`;
    if (tab === 'rules' && !edit) renderRulesPdf(main);
    if ($('#abEdit'))
      $('#abEdit').onclick = () => {
        A.edit = true;
        A.secs = A.d.sections.map((x) => ({ ...x }));
        draw();
      };
    if (tab === 'org') bindOrgChart(main, d, draw);
    if ($('#abOrgEdit')) $('#abOrgEdit').onclick = () => orgEditStart(draw);
    if ($('#abCancel'))
      $('#abCancel').onclick = () => {
        A.edit = false;
        draw();
      };
    bindAboutView(A);
    if (A.edit) bindAboutEdit(A);
  }
  /* البحث في المواد، ورفع ملفات اللائحة وحذفها */
  function bindAboutView(A) {
    const { main } = A;
    const reload = async () => {
      A.d = await api('GET', '/api/about');
      drawAbout(A);
    };
    if ($('#abQ'))
      $('#abQ').oninput = () => {
        const q = $('#abQ').value.trim();
        $$('details[data-s]', main).forEach((x) => {
          const hit = !q || x.dataset.s.includes(q);
          x.hidden = !hit;
          if (q && hit) x.open = true;
        });
      };
    if ($('#abFile'))
      $('#abFile').onchange = async (ev) => {
        const files = [...ev.target.files];
        if (!files.length) return;
        const label = files.length === 1 ? await askText('عنوان الملف', 'مثال: اللائحة الداخلية المعتمدة 2026', false) : '';
        if (label === null) return;
        try {
          for (const f of files) await uploadFile(null, f, label, '/api/about/files');
          toast('تم رفع الملف');
          await reload();
        } catch (err) {
          toast(err.message, true);
        }
      };
    $$('[data-fdel]', main).forEach((b) => {
      b.onclick = async (ev) => {
        ev.preventDefault();
        if (!(await askYesNo('حذف الملف؟'))) return;
        try {
          await api('DELETE', `/api/about/files/${b.dataset.fdel}`);
          await reload();
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
  }
  /* تعديل مواد اللائحة: الكتابة والإضافة والحذف والترتيب والحفظ */
  function bindAboutEdit(A) {
    const { main, secs } = A;
    const draw = () => drawAbout(A);
    main.oninput = (e) => {
      const x = e.target;
      if (x.dataset.s) {
        const [i, f] = x.dataset.s.split(':');
        secs[Number(i)][f] = x.value;
      }
    };
    if ($('#abAdd'))
      $('#abAdd').onclick = () => {
        secs.push({ id: '', title: '', body: '' });
        draw();
      };
    $$('[data-sdel]', main).forEach((b) => {
      b.onclick = () => {
        secs.splice(Number(b.dataset.sdel), 1);
        draw();
      };
    });
    $$('[data-up]', main).forEach((b) => {
      b.onclick = () => {
        const i = Number(b.dataset.up);
        if (i > 0) {
          [secs[i - 1], secs[i]] = [secs[i], secs[i - 1]];
          draw();
        }
      };
    });
    $('#abSave').onclick = async () => {
      try {
        A.d = await api('PUT', '/api/about', { sections: secs });
        A.edit = false;
        toast('تم الحفظ');
        draw();
      } catch (err) {
        $('.ferr', main).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  async function viewAbout(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/about');
    const d = await api('GET', '/api/about');
    /* تبويبان: الهيكل التنظيمي واللائحة الداخلية */
    drawAbout({ main, d, tab: query.tab === 'rules' ? 'rules' : 'org', edit: false, secs: [] });
  }

  return { viewAbout };
};
