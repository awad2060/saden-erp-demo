'use strict';
/* صفحة «facilities» (viewFacilities) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['facilities'] = function (S) {
  const { $, $$, FAC_IC, FAC_NAMES, SF, api, askYesNo, esc, fmtDate, head, setCrumb, shell, state, toast } = S;
  /* وثائق الفرع (تُدار في «وثائق ومستندات» وتُعرض هنا للقراءة) */
  async function facDocs(box, branch, facilityId) {
    if (!box) return;
    let r;
    try {
      r = await api('GET', `/api/facilities/docs?b=${encodeURIComponent(branch)}`);
    } catch {
      box.innerHTML = '';
      return;
    }
    const L = r.list
      .filter((x) => !facilityId || x.facilityId === facilityId)
      .sort((a, b) => String(a.expiry || '9').localeCompare(String(b.expiry || '9')));
    const days = (iso) => (iso ? Math.round((new Date(`${iso}T00:00:00`) - new Date(`${r.today}T00:00:00`)) / 86400000) : null);
    const st = (iso) => {
      const n = days(iso);
      if (n === null) return ['بدون انتهاء', ''];
      if (n < 0) return [`منتهية منذ ${-n} يوم`, 'bad'];
      if (n <= 60) return [`تنتهي بعد ${n} يوم`, 'warn'];
      return ['سارية', 'ok'];
    };
    const manage = r.manage ? `<a class="btn sm" href="#/docs?tab=branchDocs&b=${encodeURIComponent(branch)}">⚙ إدارة الوثائق</a>` : '';
    box.innerHTML = `<div class="card fac-docs"><div class="fac-plan-h"><b>📑 ${facilityId ? 'وثائق المبنى' : 'وثائق الفرع'}</b>${manage}</div>
      ${
        L.length
          ? `<div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>الوثيقة</th><th>الرقم</th><th>جهة الإصدار</th><th>الانتهاء</th><th>الحالة</th><th>الملفات</th></tr></thead><tbody>
        ${L.map((x) => {
          const [t, c] = st(x.expiry);
          return `<tr><td><b>${esc(x.type)}</b>${x.title ? `<div class="muted doc-n">${esc(x.title)}</div>` : ''}</td><td dir="ltr">${esc(x.number || '—')}</td><td>${esc(x.issuer || '—')}</td><td>${x.expiry ? esc(SF.fmtDate(x.expiry)) : '—'}</td><td><span class="chip doc-${c || 'na'}">${t}</span></td>
          <td>${(x.files || []).map((fl) => `<a href="/api/facilities/docs/${x.id}/files/${fl.id}" target="_blank" rel="noopener" title="${esc(fl.name)}">📎</a>`).join(' ') || '—'}</td></tr>`;
        }).join('')}</tbody></table></div>`
          : `<div class="muted">لا توجد وثائق${facilityId ? ' مرتبطة بهذا المبنى' : ' لهذا الفرع'}${r.manage ? ' — أضفها من «وثائق ومستندات ← وثائق الفروع»' : ''}</div>`
      }</div>`;
  }

  async function viewFacilities(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/facilities');
    if (query.id) return facBuilding(main, query.id);
    const d = await api('GET', '/api/facilities');
    const P = window.PLAN;
    if (!query.b) {
      main.innerHTML = `${head('المنشآت', 'مباني الفروع: مبنى الفرع والسكن — الوصف والمخطط الإنشائي والتصميمات المرسومة')}
        <div class="fac-grid">${
          d.branches
            .map(
              (
                b,
              ) => `<a class="card fac-br" href="#/facilities?b=${encodeURIComponent(b.name)}"><span class="fac-ic">🏢</span><b>${esc(b.name)}</b>
          <small>${b.total ? `${b.office ? `مبنى الفرع${b.office > 1 ? ` (${b.office})` : ''}` : ''}${b.office && b.housing ? ' · ' : ''}${b.housing ? `السكن${b.housing > 1 ? ` (${b.housing})` : ''}` : ''}${b.total - b.office - b.housing > 0 ? ` · ${b.total - b.office - b.housing} أخرى` : ''}` : '<span class="muted">لم تسجّل مبانٍ بعد</span>'}</small></a>`,
            )
            .join('') || '<div class="empty">لا توجد فروع</div>'
        }</div>`;
      return;
    }
    const br = d.branches.find((x) => x.name === query.b);
    if (!br) {
      main.innerHTML = '<div class="empty">الفرع غير موجود أو غير متاح لك</div>';
      return;
    }
    const list = d.list.filter((f) => f.branch === br.name);
    const thumb = (f) => `<div class="fac-th" data-th="${f.id}"><span class="muted">${f.rooms ? '' : 'لا يوجد مخطط بعد'}</span></div>`;
    const card = (f) =>
      `<a class="card fac-b" href="#/facilities?id=${f.id}"><div class="fac-bh"><span>${FAC_IC[f.kind] || '🏗'}</span><div><b>${esc(f.name)}</b><small>${esc(f.kindLabel)}${f.w && f.l ? ` — ${f.w}×${f.l} م · ${f.rooms} غرفة` : ''}${f.files ? ` · ${f.files} تصميم مرفوع` : ''}</small></div></div>${thumb(f)}</a>`;
    const missing = ['office', 'housing'].filter((k) => !list.some((f) => f.kind === k));
    main.innerHTML = `${head(`المنشآت — ${esc(br.name)}`, 'مباني الفرع وسكنه')}
      <div class="row" style="margin-bottom:12px"><a class="btn sm ghost" href="#/facilities">→ كل الفروع</a>${br.canEdit ? '<button class="btn sm" id="facAdd">＋ مبنى آخر</button>' : ''}</div>
      <div class="fac-list">${list.map(card).join('')}
        ${br.canEdit ? missing.map((k) => `<button type="button" class="card fac-new" data-new="${k}"><span>${FAC_IC[k]}</span><b>${d.kinds[k]}</b><small>اضغط للإضافة</small></button>`).join('') : ''}
        ${!list.length && !br.canEdit ? '<div class="empty">لم تسجّل مبانٍ لهذا الفرع بعد</div>' : ''}</div>
      <div id="facDocs" style="margin-top:14px"></div>`;
    facDocs($('#facDocs', main), br.name, '');
    setCrumb([[br.name, location.hash]]);
    /* مصغرات المخططات */
    for (const f of list) {
      if (!f.rooms || !P) continue;
      api('GET', `/api/facilities/${f.id}`)
        .then((x) => {
          const el = $(`[data-th="${f.id}"]`, main);
          if (el) el.innerHTML = P.svg(x.plan, {});
        })
        .catch(() => {});
    }
    const create = async (kind, name) => {
      try {
        const x = await api('POST', '/api/facilities', { branch: br.name, kind, name });
        location.hash = `#/facilities?id=${x.id}`;
      } catch (e) {
        toast(e.message, true);
      }
    };
    $$('[data-new]', main).forEach((b) => {
      b.onclick = () => create(b.dataset.new, `${d.kinds[b.dataset.new]} — ${br.name}`);
    });
    if ($('#facAdd'))
      $('#facAdd').onclick = () => {
        const n = prompt('اسم المبنى (مثلاً: سكن العمال، المستودع، الورشة):', '');
        if (n && n.trim()) create('other', n.trim());
      };
  }

  async function facBuilding(main, id) {
    /* حالة الصفحة: ما يتغير بعد العرض (f، plan، sel) */
    const vs = {};
    const P = window.PLAN;
    await facBuildingPart2(id, vs);
    const ed = vs.f.canEdit;
    vs.sel = -1;
    const hist = [];
    const title = () => `${vs.f.name} — ${vs.f.branch}`;
    const area = (r) => Math.round(r.w * r.h * 100) / 100;
    renderFacBuilding(P, ed, vs.f, main);
    facBuildingPart4(P, area, ed, hist, main, title, vs);
    return wireFacBuilding(P, area, title, vs);
  }
  /* جزء من facBuilding: const mark = () => {… */
  function facBuildingPart4(P, area, ed, hist, main, title, vs) {
    const mark = () => {
      if ($('#fcDirty')) $('#fcDirty').textContent = '● تعديلات غير محفوظة';
    };
    const push = () => {
      hist.push(JSON.stringify(vs.plan));
      if (hist.length > 50) hist.shift();
      if ($('#fcUndo')) $('#fcUndo').disabled = false;
      mark();
    };
    const SIDE = { left: 'اليسار', right: 'اليمين', front: 'الأمام', back: 'الخلف' };
    const tool = (...args) => facBuildingTool(P, SIDE, area, hist, mark, push, render, title, vs, ...args);
    const render = (...args) => facBuildingRender(P, area, ed, title, tool, vs, ...args);
    const drawFiles = (...args) => facBuildingDrawFiles(drawFiles, ed, main, vs, ...args);
    render();
    drawFiles();
    facDocs($('#fcDocs', main), vs.f.branch, vs.f.id);
    if (ed) {
      /* المحرر بالسحب: الضغط على غرفة يختارها ويحركها، والمقابض تغيّر المقاس من أي طرف (بالمتر مع الالتصاق بالجدران والغرف) */
      const box = $('#fcSvgBox');
      /* نقطة الفأرة بإحداثيات الرسم (بكسل SVG) ثم بالمتر */
      const svgPt = (e) => {
        const s = $('svg', box);
        if (!s) return null;
        const m = s.getScreenCTM();
        if (!m) return null;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
        return p;
      };
      const toM = (p) => {
        const G = P.geom(vs.plan);
        return { x: (p.x - G.pad) / G.S, y: G.L - (p.y - G.top) / G.S };
      };
      facBuildingPart3(P, box, hist, mark, render, svgPt, toM, vs);
      /* لوحة المفاتيح: الأسهم تحرك الغرفة المختارة 25 سم (Shift = متر)، وDelete يحذفها */
      document.addEventListener('keydown', function facKeys(e) {
        if (!document.body.contains(box)) {
          document.removeEventListener('keydown', facKeys);
          return;
        }
        if (vs.sel < 0 || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
        const st = e.shiftKey ? 1 : 0.25,
          mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[e.key];
        if (mv) {
          e.preventDefault();
          push();
          const r = vs.plan.rooms[vs.sel];
          r.x = Math.round(Math.max(0, Math.min(vs.plan.w - r.w, r.x + mv[0])) * 100) / 100;
          r.y = Math.round(Math.max(0, Math.min(vs.plan.l - r.h, r.y + mv[1])) * 100) / 100;
          render();
        } else if (e.key === 'Delete') {
          e.preventDefault();
          push();
          vs.plan.rooms.splice(vs.sel, 1);
          vs.sel = -1;
          render();
        } else if (e.key === 'r' || e.key === 'R' || e.key === 'ق') {
          e.preventDefault();
          push();
          P.rotate(vs.plan, vs.sel);
          render();
        }
      });
      /* القوالب: سحب إلى الرسم (يظهر شبح القالب أثناء السحب) أو ضغطة تضعه في أول مكان فارغ */
      wireFacBuilding3(P, box, main, push, render, svgPt, toM, vs);
      $$('[data-tpl]', main).forEach((b) => {
        b.onclick = async () => {
          const W = Number($('#fcW').value),
            L = Number($('#fcL').value);
          if (!(W > 0 && L > 0)) return toast('اكتب عرض المبنى وطوله أولاً', true);
          if (vs.plan.rooms.length > 1 && !(await askYesNo('استبدال التقسيمة الحالية؟'))) return;
          push();
          vs.plan = { w: W, l: L, rooms: P.template(b.dataset.tpl, W, L) };
          vs.sel = 0;
          render();
        };
      });
      wireFacBuilding2(drawFiles, hist, render, vs);
    }
  }
  /* جزء من facBuilding: let dr = null,… */
  function facBuildingPart3(P, box, hist, mark, render, svgPt, toM, vs) {
    let dr = null,
      raf = 0;
    box.addEventListener('pointerdown', (e) => {
      if (!(vs.plan.w && vs.plan.l) || e.button > 0) return;
      const h = e.target.closest('[data-h]'),
        t = e.target.closest('[data-i]');
      if (!h && !t) {
        if (vs.sel !== -1) {
          vs.sel = -1;
          render();
        }
        return;
      }
      const p = svgPt(e);
      if (!p) return;
      if (t && !h) {
        vs.sel = Number(t.dataset.i);
      }
      const r = vs.plan.rooms[vs.sel];
      if (!r) return;
      e.preventDefault();
      dr = { mode: h ? h.dataset.h : 'move', start: { ...r }, p0: toM(p), before: JSON.stringify(vs.plan), moved: false };
      try {
        box.setPointerCapture(e.pointerId);
      } catch {
        /* مؤشر غير نشط */
      }
      render();
    });
    box.addEventListener('pointermove', (e) => {
      if (!dr) return;
      const p = svgPt(e);
      if (!p) return;
      const m = toM(p),
        dx = m.x - dr.p0.x,
        dy = m.y - dr.p0.y;
      if (!dr.moved && Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
      dr.moved = true;
      P.drag(vs.plan, vs.sel, dr.mode, dr.start, dx, dy);
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          render();
        });
    });
    const end = () => {
      if (!dr) return;
      if (dr.moved) {
        hist.push(dr.before);
        if (hist.length > 50) hist.shift();
        $('#fcUndo').disabled = false;
        mark();
      }
      dr = null;
      render();
      if (vs.sel >= 0 && window.innerWidth < 1000) $('#fcTool').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
  }
  /* أحداث facBuilding: #fcW، #fcL */
  function wireFacBuilding3(P, box, main, push, render, svgPt, toM, vs) {
    $$('[data-blk]', main).forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        const W = Number($('#fcW').value),
          L = Number($('#fcL').value);
        if (!(W > 0 && L > 0)) {
          toast('اكتب عرض المبنى وطوله أولاً', true);
          return;
        }
        if (!(vs.plan.w && vs.plan.l)) {
          vs.plan.w = W;
          vs.plan.l = L;
        }
        e.preventDefault();
        const t = b.dataset.blk,
          x0 = e.clientX,
          y0 = e.clientY;
        let ghost = null;
        const mv = (ev) => {
          if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
          if (!ghost) {
            ghost = document.createElement('div');
            ghost.className = 'fac-ghost';
            ghost.style.setProperty('--c', P.BLOCK[t][4]);
            ghost.textContent = P.BLOCK[t][1];
            document.body.appendChild(ghost);
          }
          ghost.style.left = `${ev.clientX}px`;
          ghost.style.top = `${ev.clientY}px`;
        };
        const up = (ev) => {
          document.removeEventListener('pointermove', mv);
          document.removeEventListener('pointerup', up);
          if (ghost) ghost.remove();
          let at = null;
          if (ghost) {
            const s = $('svg', box),
              rc = s && s.getBoundingClientRect();
            if (!rc || ev.clientX < rc.left || ev.clientX > rc.right || ev.clientY < rc.top || ev.clientY > rc.bottom) return;
            at = toM(svgPt(ev));
          }
          push();
          const nr = P.addBlock(vs.plan, t, at && at.x, at && at.y);
          vs.plan.rooms.push(nr);
          vs.sel = vs.plan.rooms.length - 1;
          render();
        };
        document.addEventListener('pointermove', mv);
        document.addEventListener('pointerup', up);
      });
    });
    /* تغيير المقاس: الغرف تتمدد بالتناسب */
    const resize = (k, v) => {
      v = Number(v) || 0;
      if (!(v > 0)) return;
      const old = vs.plan[k];
      push();
      if (old > 0 && vs.plan.rooms.length) {
        const f2 = v / old;
        vs.plan.rooms = vs.plan.rooms.map((r) =>
          k === 'w'
            ? { ...r, x: Math.round(r.x * f2 * 100) / 100, w: Math.round(r.w * f2 * 100) / 100 }
            : { ...r, y: Math.round(r.y * f2 * 100) / 100, h: Math.round(r.h * f2 * 100) / 100 },
        );
      }
      vs.plan[k] = v;
      render();
    };
    $('#fcW').onchange = (e) => resize('w', e.target.value);
    $('#fcL').onchange = (e) => resize('l', e.target.value);
  }
  /* أحداث facBuilding: #fcUndo، #fcSave، #fcDel، #fcUp */
  function wireFacBuilding2(drawFiles, hist, render, vs) {
    $('#fcUndo').onclick = () => {
      const h = hist.pop();
      if (h) {
        vs.plan = JSON.parse(h);
        vs.sel = -1;
        render();
      }
      $('#fcUndo').disabled = !hist.length;
    };
    $('#fcSave').onclick = async () => {
      try {
        vs.f = await api('PUT', `/api/facilities/${vs.f.id}`, { name: $('#fcName').value, notes: $('#fcNotesTxt').value, plan: vs.plan });
        vs.plan = JSON.parse(JSON.stringify(vs.f.plan));
        toast('تم الحفظ');
        $('#fcDirty').textContent = '';
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    if ($('#fcDel'))
      $('#fcDel').onclick = async () => {
        if (!(await askYesNo(`حذف «${vs.f.name}»؟`))) return;
        try {
          await api('DELETE', `/api/facilities/${vs.f.id}`);
          location.hash = `#/facilities?b=${encodeURIComponent(vs.f.branch)}`;
        } catch (e) {
          toast(e.message, true);
        }
      };
    $('#fcUp').onchange = async (e) => {
      for (const file of e.target.files) {
        try {
          const res = await fetch(`/api/facilities/${vs.f.id}/files?name=${encodeURIComponent(file.name)}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: file,
          });
          let j = null;
          try {
            j = await res.json();
          } catch {
            /* تجاهل */
          }
          if (!res.ok) throw new Error((j && j.error) || `تعذر رفع ${file.name}`);
        } catch (er) {
          toast(er.message, true);
        }
      }
      vs.f = await api('GET', `/api/facilities/${vs.f.id}`);
      drawFiles();
      toast('تم رفع التصميم');
    };
  }
  /* render من facBuilding (يأخذ P، area، ed، title، tool، vs من الصفحة) */
  function facBuildingRender(P, area, ed, title, tool, vs) {
    $('#fcW').value = vs.plan.w || '';
    $('#fcL').value = vs.plan.l || '';
    $('#fcSvgBox').innerHTML =
      vs.plan.w && vs.plan.l
        ? P.svg(vs.plan, { title: title(), sel: ed ? vs.sel : -1, interactive: ed, edit: ed })
        : `<div class="empty">${ed ? 'اكتب عرض المبنى وطوله ثم اسحب القوالب إلى الرسم' : 'لم ترسم المخطط بعد'}</div>`;
    const iss = vs.plan.w && vs.plan.l ? P.issues(vs.plan) : [];
    const used = vs.plan.rooms.reduce((s, r) => s + area(r), 0),
      tot = (vs.plan.w || 0) * (vs.plan.l || 0);
    $('#fcIssues').innerHTML =
      (iss.length ? `<div class="err">${iss.map(esc).join('<br>')}</div>` : '') +
      (tot ? `<div class="hint">مساحة المبنى ${Math.round(tot * 100) / 100} م² — ${vs.plan.rooms.length} غرفة</div>` : '');
    $('#fcRooms').innerHTML =
      vs.plan.rooms
        .map((r) => `<tr><td>${esc(r.name)}</td><td dir="ltr">${r.w}</td><td dir="ltr">${r.h}</td><td>${area(r)}</td></tr>`)
        .join('') || '<tr><td colspan="4" class="empty">لا توجد غرف</td></tr>';
    tool();
  }
  /* drawFiles من facBuilding (يأخذ drawFiles، ed، main، vs من الصفحة) */
  function facBuildingDrawFiles(drawFiles, ed, main, vs) {
    const img = (n) => /\.(png|jpe?g)$/i.test(n);
    $('#fcFiles').innerHTML =
      (vs.f.files || [])
        .map(
          (
            x,
          ) => `<div class="fac-file">${img(x.name) ? `<a href="/api/facilities/${vs.f.id}/files/${x.id}" target="_blank" rel="noopener"><img src="/api/facilities/${vs.f.id}/files/${x.id}" alt="${esc(x.name)}" loading="lazy"></a>` : `<a class="fac-fic" href="/api/facilities/${vs.f.id}/files/${x.id}" target="_blank" rel="noopener">${/\.pdf$/i.test(x.name) ? '📄 PDF' : '📐 CAD'}</a>`}
        <div><a href="/api/facilities/${vs.f.id}/files/${x.id}" target="_blank" rel="noopener"><b>${esc(x.name)}</b></a><small class="muted">${esc(x.byName)} — ${esc(fmtDate(x.at))}</small></div>${ed ? `<button class="btn sm ghost" data-fdel="${x.id}" title="حذف">✕</button>` : ''}</div>`,
        )
        .join('') || '<div class="muted">لم ترفع تصميماً بعد</div>';
    $$('[data-fdel]', main).forEach((b) => {
      b.onclick = async () => {
        if (!(await askYesNo('حذف ملف التصميم؟'))) return;
        try {
          await api('DELETE', `/api/facilities/${vs.f.id}/files/${b.dataset.fdel}`);
          vs.f = await api('GET', `/api/facilities/${vs.f.id}`);
          drawFiles();
        } catch (e) {
          toast(e.message, true);
        }
      };
    });
  }
  /* tool من facBuilding (يأخذ P، SIDE، area، hist، mark، push، render، title، vs من الصفحة) */
  function facBuildingTool(P, SIDE, area, hist, mark, push, render, title, vs) {
    const box = $('#fcTool');
    return facBuildingToolPart(P, SIDE, area, box, hist, mark, push, render, title, vs);
  }
  /* جزء من facBuildingTool: if (!box) return;… */
  function facBuildingToolPart(P, SIDE, area, box, hist, mark, push, render, title, vs) {
    if (!box) return;
    const r = vs.plan.rooms[vs.sel];
    if (!r) {
      box.innerHTML = `<div class="muted fac-hint">${vs.plan.rooms.length ? '👆 اضغط على غرفة في الرسم لتعديلها' : vs.plan.w && vs.plan.l ? 'اسحب قالباً إلى الرسم' : 'اكتب مقاس المبنى أولاً'}</div>`;
      return;
    }
    const nb = P.neighbors(vs.plan.rooms, vs.sel);
    renderFacBuildingTool(P, SIDE, area, box, nb, r, vs);
    wireTool(box, push, r, render);
    /* المقاس بالأرقام: يبقى الركن الأمامي الأيسر ثابتاً، ولا يتجاوز حدود المبنى */
    const setDim = (k, v) => {
      v = Math.round(Number(v) * 100) / 100;
      const max = k === 'w' ? vs.plan.w - r.x : vs.plan.l - r.y;
      if (!(v >= 0.5)) return render();
      push();
      r[k] = Math.min(v, Math.round(max * 100) / 100);
      render();
    };
    $('#fcRW', box).onchange = (e) => setDim('w', e.target.value);
    $('#fcRH', box).onchange = (e) => setDim('h', e.target.value);
    $('#fcRot', box).onclick = () => {
      push();
      P.rotate(vs.plan, vs.sel);
      render();
    };
    /* الباب: الجدار (أو تلقائي / بدون)، والموضع على الجدار، وجهة المفصلة */
    toolPart(box, push, r, render);
    if ($('#fcDAt', box)) {
      $('#fcDAt', box).oninput = (e) => {
        r.door.at = Number(e.target.value);
        $('#fcSvgBox').innerHTML = P.svg(vs.plan, { title: title(), sel: vs.sel, interactive: true, edit: true });
      };
      $('#fcDAt', box).onchange = () => {
        mark();
      };
      $('#fcDAt', box).onpointerdown = () => push();
      $('#fcDFlip', box).onclick = () => {
        push();
        r.door.flip = !r.door.flip;
        render();
      };
    }
    $('#fcDup', box).onclick = () => {
      push();
      const c = P.addBlock(vs.plan, r.t || 'room');
      vs.plan.rooms.push({ ...c, name: `${r.name} (2)`, t: r.t, w: Math.min(r.w, vs.plan.w), h: Math.min(r.h, vs.plan.l) });
      vs.sel = vs.plan.rooms.length - 1;
      render();
    };
    $('#fcRDel', box).onclick = () => {
      push();
      vs.plan.rooms.splice(vs.sel, 1);
      vs.sel = -1;
      render();
    };
    $$('[data-sp]', box).forEach((b) => {
      b.onclick = () => {
        try {
          const before = JSON.stringify(vs.plan);
          vs.plan.rooms = P.split(vs.plan.rooms, vs.sel, b.dataset.sp, $('#fcSpS', box).value);
          hist.push(before);
          $('#fcUndo').disabled = false;
          mark();
          vs.sel = vs.plan.rooms.length - 1;
          render();
        } catch (e) {
          toast(e.message, true);
        }
      };
    });
    $$('[data-mg]', box).forEach((b) => {
      b.onclick = () => {
        push();
        vs.plan.rooms = P.merge(vs.plan.rooms, vs.sel, Number(b.dataset.mg));
        vs.sel = vs.plan.rooms.length - 1;
        render();
      };
    });
  }
  /* محتوى facBuildingTool (HTML) */
  function renderFacBuildingTool(P, SIDE, area, box, nb, r, vs) {
    box.innerHTML = `<div class="fac-selh">الغرفة المختارة: <b>${esc(r.name)}</b> <small class="muted" dir="ltr">${r.w} × ${r.h} م — ${area(r)} م²</small></div>
        <div class="fac-lbl">اسم الغرفة</div>
        <div class="fac-names">${FAC_NAMES.map((n) => `<button type="button" class="chip-btn${n === r.name ? ' on' : ''}" data-nm="${esc(n)}">${esc(n)}</button>`).join('')}</div>
        <input class="in" id="fcRName" value="${esc(r.name)}" placeholder="أو اكتب اسماً آخر" maxlength="60">
        <div class="fac-lbl">النوع والمقاس بالمتر</div>
        <div class="fac-dims"><select class="in" id="fcRT"><option value="">— بدون —</option>${P.BLOCKS.map(([k, l]) => `<option value="${k}"${r.t === k ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
          <label>العرض <input class="in" id="fcRW" type="number" min="0.5" step="0.25" dir="ltr" value="${r.w}"></label><label>الطول <input class="in" id="fcRH" type="number" min="0.5" step="0.25" dir="ltr" value="${r.h}"></label></div>
        <div class="fac-lbl">الباب</div>
        <div class="fac-door">${[
          ['', 'تلقائي'],
          ['front', '⬇ أمام'],
          ['back', '⬆ خلف'],
          ['right', '➡ يمين'],
          ['left', '⬅ يسار'],
          ['none', 'بدون'],
        ]
          .map(
            ([k, l]) =>
              `<button type="button" class="chip-btn${((r.door && r.door.s) || '') === k ? ' on' : ''}" data-ds="${k}">${l}</button>`,
          )
          .join('')}</div>
        ${r.door && r.door.s !== 'none' ? `<div class="fac-door2"><label>مكانه على الجدار <input type="range" id="fcDAt" min="0" max="1" step="0.05" value="${r.door.at ?? 0.5}"></label><button type="button" class="btn sm" id="fcDFlip" title="تبديل جهة المفصلة">⇋ عكس فتحة الباب</button></div>` : ''}
        <div class="fac-split"><button type="button" class="btn sm" id="fcRot" title="تدوير الغرفة 90° حول منتصفها (R)">⟳ تدوير 90°</button><button type="button" class="btn sm" id="fcDup">⧉ نسخة</button><button type="button" class="btn sm ghost" id="fcRDel">🗑 حذف</button></div>
        <details class="fac-adv"><summary>تقسيم أو دمج</summary>
        <div class="fac-lbl">تقسيم الغرفة إلى غرفتين</div>
        <div class="fac-split"><button type="button" class="btn sm" data-sp="lr">⇆ يمين / يسار</button><button type="button" class="btn sm" data-sp="fb">⇅ أمام / خلف</button>
          <label>مقاس الجزء الأيمن / الأمامي <input class="in" id="fcSpS" type="number" min="0.5" step="0.5" dir="ltr" placeholder="النصف"></label> م</div>
        ${nb.length ? `<div class="fac-lbl">دمج مع غرفة مجاورة</div><div class="fac-split">${nb.map((x) => `<button type="button" class="btn sm ghost" data-mg="${x.j}">⊕ مع ${esc(vs.plan.rooms[x.j].name)} (${SIDE[x.side]})</button>`).join('')}</div>` : ''}</details>`;
  }
  /* جزء من facBuilding: vs.f = await api('GET', `/api/facilities/${id}`);… */
  async function facBuildingPart2(id, vs) {
    vs.f = await api('GET', `/api/facilities/${id}`);
    /* المسار: المنشآت › الفرع › المبنى (فيرجع «لأعلى» لمباني الفرع) */
    facBuildingPart(vs.f);
    vs.plan = JSON.parse(JSON.stringify(vs.f.plan || { w: 0, l: 0, rooms: [] }));
  }
  /* أحداث facBuilding: #fcSvg، #fcPrint */
  function wireFacBuilding(P, area, title, vs) {
    $('#fcSvg').onclick = () => {
      if (!(vs.plan.w && vs.plan.l)) return toast('لا يوجد مخطط', true);
      const blob = new Blob([P.svg(vs.plan, { title: title() })], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `مخطط-${vs.f.name}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    $('#fcPrint').onclick = () => {
      if (!(vs.plan.w && vs.plan.l)) return toast('لا يوجد مخطط', true);
      const w = window.open('', '_blank');
      if (!w) return toast('اسمح بالنوافذ المنبثقة للطباعة', true);
      w.document
        .write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title())}</title><style>body{margin:0;font-family:Tahoma,sans-serif;text-align:center}svg{max-width:100%;height:auto}table{margin:12px auto;border-collapse:collapse;font-size:13px}td,th{border:1px solid #cbd5e1;padding:4px 10px}@page{size:A4;margin:12mm}</style></head><body>
        ${P.svg(vs.plan, { title: title() })}<table><tr><th>الغرفة</th><th>العرض × الطول (م)</th><th>المساحة (م²)</th></tr>${vs.plan.rooms.map((r) => `<tr><td>${esc(r.name)}</td><td dir="ltr">${r.w} × ${r.h}</td><td>${area(r)}</td></tr>`).join('')}</table>
        ${vs.f.notes ? `<p style="max-width:680px;margin:8px auto;color:#475569;font-size:13px">${esc(vs.f.notes)}</p>` : ''}<script>setTimeout(()=>print(),300)<\/script></body></html>`);
      w.document.close();
    };
  }
  /* جزء من facBuilding: setCrumb([… */
  function facBuildingPart(f) {
    setCrumb([
      [f.branch, `#/facilities?b=${encodeURIComponent(f.branch)}`],
      [f.name, location.hash],
    ]);
  }
  /* محتوى facBuilding (HTML) */
  function renderFacBuilding(P, ed, f, main) {
    main.innerHTML = `${head(esc(f.name), `${esc(f.kindLabel)} — فرع ${esc(f.branch)}`)}
      <div class="row" style="margin-bottom:12px"><a class="btn sm ghost" href="#/facilities?b=${encodeURIComponent(f.branch)}">→ مباني ${esc(f.branch)}</a></div>
      <div class="fac-ed">
        <div class="card fac-side">
          ${ed ? `<div class="field"><label>اسم المبنى</label><input class="in" id="fcName" value="${esc(f.name)}" maxlength="100"></div>` : ''}
          <div class="fac-step"><span>1</span><b>مقاس المبنى (بالمتر)</b></div>
          <div class="grid2"><div class="field"><label>العرض (الواجهة / المدخل)</label><input class="in" id="fcW" type="number" min="1" step="0.5" inputmode="decimal" dir="ltr" ${ed ? '' : 'readonly'}></div>
            <div class="field"><label>الطول (من المدخل للخلف)</label><input class="in" id="fcL" type="number" min="1" step="0.5" inputmode="decimal" dir="ltr" ${ed ? '' : 'readonly'}></div></div>
          ${
            ed
              ? `<div class="fac-step"><span>2</span><b>اسحب القوالب وضعها في الرسم</b></div>
          <div class="hint">اسحب القالب إلى مكانه في المخطط، أو اضغط عليه ليوضع في أول مكان فارغ</div>
          <div class="fac-blocks">${P.BLOCKS.map(([k, l, w, h, c]) => `<button type="button" class="fac-blk" data-blk="${k}" style="--c:${c}"><i></i><b>${esc(l)}</b><small dir="ltr">${w}×${h}</small></button>`).join('')}</div>
          <details class="fac-adv"><summary>أو ابدأ بتقسيمة جاهزة للمبنى كله</summary><div class="fac-tpl">${P.TEMPLATES.map(([k, l]) => `<button type="button" class="btn sm" data-tpl="${k}">${esc(l)}</button>`).join('')}</div></details>
          <div class="fac-step"><span>3</span><b>اسحب الغرفة لتحريكها، ومن المقابض الحمراء لتكبيرها أو تصغيرها من أي طرف</b></div>
          <div id="fcTool" class="fac-tool"></div>
          <div class="row" style="gap:6px;margin-top:8px"><button type="button" class="btn sm ghost" id="fcUndo" disabled>↶ تراجع</button></div>`
              : ''
          }
          <div id="fcIssues"></div>
          <details class="fac-adv"><summary>جدول الغرف (المقاسات بالتفصيل)</summary>
            <div class="tbl-wrap"><table class="tbl fac-rt"><thead><tr><th>الغرفة</th><th>العرض</th><th>الطول</th><th>المساحة م²</th></tr></thead><tbody id="fcRooms"></tbody></table></div></details>
          <div class="field" style="margin-top:10px"><label>ملاحظات</label><textarea class="in" id="fcNotesTxt" rows="2" ${ed ? '' : 'readonly'}>${esc(f.notes)}</textarea></div>
          ${ed ? `<div class="row" style="gap:8px"><button class="btn primary" id="fcSave">💾 حفظ</button>${state.user.role === 'admin' ? '<button class="btn ghost" id="fcDel">🗑 حذف المبنى</button>' : ''}<span class="muted" id="fcDirty"></span></div>` : ''}
        </div>
        <div class="fac-main">
          <div class="card fac-plan"><div class="fac-plan-h"><b>المخطط الإنشائي</b><span class="row"><button class="btn sm" id="fcPrint">🖨 طباعة</button><button class="btn sm" id="fcSvg">⬇ تنزيل المخطط</button></span></div><div id="fcSvgBox" class="fac-svg"></div></div>
          <div class="card fac-files"><div class="fac-plan-h"><b>التصميمات المرسومة</b>${ed ? '<label class="btn sm primary">⬆ رفع تصميم<input type="file" id="fcUp" multiple accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf" hidden></label>' : ''}</div>
            <div class="hint">PDF أو صورة (PNG/JPG) أو AutoCAD (DWG/DXF)</div><div id="fcFiles"></div></div>
          <div id="fcDocs"></div>
        </div>
      </div>`;
  }
  /* جزء من tool: $$('[data-ds]', box).forEach((b) => {… */
  function toolPart(box, push, r, render) {
    $$('[data-ds]', box).forEach((b) => {
      b.onclick = () => {
        push();
        const s = b.dataset.ds;
        if (!s) delete r.door;
        else r.door = { at: 0.5, flip: false, ...(r.door || {}), s };
        render();
      };
    });
  }
  /* أحداث tool */
  function wireTool(box, push, r, render) {
    $$('[data-nm]', box).forEach((b) => {
      b.onclick = () => {
        push();
        r.name = b.dataset.nm;
        render();
      };
    });
    $('#fcRName', box).onchange = (e) => {
      const v = e.target.value.trim();
      if (v && v !== r.name) {
        push();
        r.name = v;
        render();
      }
    };
    $('#fcRT', box).onchange = (e) => {
      push();
      if (e.target.value) r.t = e.target.value;
      else delete r.t;
      render();
    };
  }

  return { viewFacilities };
};
