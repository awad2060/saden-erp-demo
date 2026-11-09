'use strict';
/* أجزاء تمويل الرواتب (3) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['pay-funding-3'] = function (S, ctx) {
  const { $, $$, MP_MONTH, SF, api, askYesNo, colName, esc, normAr, normDate, readXlsx, toast } = S;
  const { bpReconXlsx, downloadXlsxStyled, viewBranchPay } = ctx;
  /* settleHtml من bpEditor (يأخذ SLEAD، STC، cellHtml، m، settleOf، stNum، stSum من الصفحة) */
  function bpEditorSettleHtml(SLEAD, STC, cellHtml, m, settleOf, stNum, stSum) {
    const idx = settleOf();
    if (!idx.length) return '<div class="card empty">لا توجد تصفيات — اختر حالة «تصفية» أو «توزيع تصفية» للموظف فينتقل لهذا التبويب</div>';
    const S = SF.bpSummary(idx.map(([l]) => l));
    return `<div class="card bp-sec bp-ext"><div class="bp-sec-h"><span class="bp-sh"><b>التصفيات</b><small>${idx.length} موظف — تصرفها خارج مدد وتضيفها لمصروف رواتب الفرع</small></span>
          <span class="bp-sk"><span>إجمالي التصفيات: <b>${m(S.settle)}</b></span><span>مصروف الرواتب: <b>${m(S.expense)}</b></span></span></div>
        <div class="tbl-wrap"><table class="bpx"><thead><tr>${STC.map((cl) => `<th${cl.t === 'net' ? ' class="bx-hb"' : ''}>${esc(cl.h)}</th>`).join('')}<th>التحقق</th></tr></thead>
        <tbody>${idx
          .map(([l, i], j) => {
            const c = SF.bpCalc(l);
            return `<tr class="bp-r${c.warn.length ? ' bp-bad' : ''}" data-row="${i}">${STC.map((cl) => cellHtml(cl, l, c, j + 1, i)).join('')}<td>${c.warn.length ? `<span class="chip doc-bad" title="${esc(c.warn.join('؛ '))}">${esc(c.warn[0])}</span>` : '<span class="chip doc-ok">سليم</span>'}</td></tr>`;
          })
          .join('')}</tbody>
        <tfoot><tr class="bx-tot"><td colspan="${SLEAD}">إجمالي التصفيات</td>${STC.slice(SLEAD)
          .map((cl) => {
            const v = stNum(cl) ? stSum(idx, cl) : null;
            return `<td>${v == null ? '' : v ? m(v) : '-'}</td>`;
          })
          .join('')}<td></td></tr>
          <tr class="bx-exp"><td colspan="${SLEAD}">مصروف التصفيات المضاف إلى مصروف رواتب الفرع</td><td class="bx-ev">${m(S.expense)}</td><td colspan="${STC.length - SLEAD}"></td></tr></tfoot></table></div></div>`;
  }
  /* جزء من bpEditor: {… */
  function bpEditorValue() {
    return {
      h: 'الحالة',
      f: (l, c) => (c.code === 6 && l.startDate ? `${l.status} من ${SF.fmtDate(l.startDate)} (${c.days} يوم)` : l.status || ''),
      t: 'st',
    };
  }
  /* drawer من bpEditor (يأخذ draw، ed، lines، m، rule50، tabOf، vs، x من الصفحة) */
  function bpEditorDrawer(draw, ed, lines, m, rule50, tabOf, vs, x, i) {
    const l = lines[i],
      bg = document.createElement('div');
    bg.className = 'modal-bg bp-drawer-bg';
    const f = (k, lab, attrs = '') =>
      `<label class="bp-f"><span>${lab}</span><input class="in" name="${k}" value="${esc(l[k] == null || l[k] === 0 ? '' : l[k])}" ${ed ? '' : 'disabled'} ${attrs}></label>`;
    const num = (k, lab) => f(k, lab, 'inputmode="decimal"');
    bg.innerHTML = `<form class="modal bp-drawer" novalidate><div class="bp-dh"><h3>${esc(l.name || 'موظف جديد')}</h3><button type="button" class="btn sm ghost" data-x>✕</button></div>
        <div class="bp-grid">${f('name', 'الاسم')}${f('iqama', 'رقم الإقامة', 'dir="ltr"')}${l.empId ? `<label class="bp-f"><span>الجنسية (من ملف الموظف)</span><input class="in" value="${esc(SF.bpNatOf(l))}" disabled></label>` : f('nationality', 'الجنسية')}${f('title', 'الوظيفة')}
          <label class="bp-f"><span>الحالة</span><select class="in" name="status" ${ed ? '' : 'disabled'}>${SF.BP_STATUS.map((o) => `<option${o === l.status ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>
          <label class="bp-f" id="bpSD"><span>تاريخ بداية الدوام</span><input class="in" type="date" name="startDate" value="${esc(l.startDate || '')}" min="${x.month}-01" max="${x.month}-${String(new Date(Date.UTC(+x.month.slice(0, 4), +x.month.slice(5, 7), 0)).getUTCDate())}" ${ed ? '' : 'disabled'}></label>
          <label class="bp-f"><span>الكفالة</span><select class="in" name="kafala" ${ed ? '' : 'disabled'}><option value="">—</option>${SF.BP_KAFALA.map((o) => `<option${o === l.kafala ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label></div>
        <h4 class="b-sec">① الاستحقاقات</h4><div class="bp-grid">${num('basic', 'الراتب الأساسي')}${SF.BP_ALLOW.map(([k, lab]) => num(k, lab)).join('')}${num('due', 'مستحقات أخرى')}</div>
        <h4 class="b-sec">② الخصومات من الراتب</h4><div class="bp-grid">${SF.BP_DED.map(([k, lab]) => num(k, lab)).join('')}</div>
        <h4 class="b-sec">③ على المصروف (خارج مدد)</h4><div class="bp-grid">${num('settlement', 'مبلغ التصفية / الجزء المحمل')}${num('leaveAllow', 'بدلات أثناء الأجازة')}</div>
        <h4 class="b-sec">التحويل</h4><div class="bp-grid">${f('iban', 'الآيبان', 'dir="ltr"')}${f('bank', 'البنك')}${f('notes', 'ملاحظات')}</div>
        <div class="bp-res" id="bpRes"></div>
        <div class="row" style="gap:8px;margin-top:10px">${ed ? '<button class="btn primary">✔ تم</button><button type="button" class="btn ghost" data-del>🗑 حذف من البيان</button>' : ''}<button type="button" class="btn ghost" data-x>إغلاق</button></div></form>`;
    document.body.appendChild(bg);
    const fm = $('form', bg);
    const res = () => {
      const t = { ...l };
      $$('[name]', fm).forEach((el) => {
        t[el.name] = el.value;
      });
      const c = SF.bpCalc(t);
      $('#bpSD', bg).hidden = t.status !== 'بداية دوام';
      $('#bpRes', bg).innerHTML =
        `<div><small>الإجمالي</small><b>${m(c.gross)}</b></div><div><small>الخصومات</small><b>${m(c.ded)}</b></div>${c.code === 6 ? `<div><small>أيام العمل</small><b>${c.days == null ? '—' : `${c.days} / 30`}</b></div><div><small>خصم أيام (قبل المباشرة)</small><b>${m(c.daysDed)}</b></div>` : ''}<div class="ok"><small>الصافي المستلم</small><b>${m(c.paid)}</b></div><div><small>${c.ext ? 'خارج مدد' : 'ترفعه على مدد'}</small><b>${m(c.ext ? c.paid : c.mudad)}</b></div><div class="bad"><small>مصروف الرواتب</small><b>${m(c.expense)}</b></div><div><small>تأمينات الشركة</small><b>${m(c.gosi)}</b></div>
          ${c.warn.length ? `<div class="bp-w">${c.warn.map((w) => `<span class="chip doc-bad">${esc(w)}</span>`).join(' ')}</div>` : ''}`;
    };
    fm.addEventListener('input', res);
    fm.addEventListener('change', res);
    res();
    $$('[data-x]', bg).forEach((b) => {
      b.onclick = () => bg.remove();
    });
    if ($('[data-del]', bg))
      $('[data-del]', bg).onclick = async () => {
        if (!(await askYesNo(`حذف «${l.name}» من البيان؟`))) return;
        lines.splice(i, 1);
        bg.remove();
        draw();
      };
    fm.onsubmit = (e) => {
      e.preventDefault();
      const st0 = l.status;
      $$('[name]', fm).forEach((el) => {
        l[el.name] = el.value;
      });
      if (l.status !== st0) {
        l.stManual = true;
        l.autoSt = false;
      }
      rule50();
      vs.open = l.kafala || '';
      vs.tab = tabOf(l);
      bg.remove();
      draw();
    };
  }
  /* upImport من bpEditor (يأخذ UPC، UP_TXT، lines من الصفحة) */
  async function bpEditorUpImport(UPC, UP_TXT, lines, file) {
    const rows = await readXlsx(file);
    const hi = rows.findIndex((rw) => rw.some((c) => /الإسم|الاسم/.test(String(c))) && rw.some((c) => /إقامة|اقامة|هوية/.test(String(c))));
    if (hi < 0) throw new Error('لم نجد صف العناوين (الإسم، رقم الإقامة...) — استخدم «📥 نموذج الرفع»');
    const H = rows[hi].map((c) => normAr(String(c || '').trim()));
    const ix = upImportHtml(H, UPC).filter(([, c]) => c >= 0);
    const num = (v) => {
      const t = String(v == null ? '' : v)
        .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
        .replace(/[,\s]/g, '');
      return t === '' ? '' : Number(t) || 0;
    };
    const digits = (v) =>
      String(v || '')
        .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
        .replace(/\D/g, '');
    const res = { upd: 0, add: 0, badKaf: [], badSt: [] };
    for (const rw of rows.slice(hi + 1)) {
      const get = (k) => {
        const p = ix.find(([kk]) => kk === k);
        return p ? rw[p[1]] : undefined;
      };
      const name = String(get('name') || '').trim(),
        iq = digits(get('iqama'));
      if (!name && !iq) continue;
      let l = (iq && lines.find((y) => digits(y.iqama) === iq)) || (name && lines.find((y) => normAr(y.name || '') === normAr(name)));
      if (!l) {
        l = { status: 'على رأس العمل', name, iqama: iq, kafala: '' };
        lines.push(l);
        res.add++;
      } else res.upd++;
      for (const [k] of ix) {
        const v = get(k);
        if (k === 'kafala') {
          const t = String(v || '').trim();
          if (t) {
            bpEditorUpImportPart(iq, l, name, res, t);
          }
          continue;
        }
        if (k === 'status') {
          const t = String(v || '').trim();
          if (t) {
            bpEditorUpImportPart2(iq, l, name, res, t);
          }
          continue;
        }
        if (k === 'iqama') {
          if (iq) l.iqama = iq;
          continue;
        }
        if (k === 'name') {
          if (name) l.name = name;
          continue;
        }
        if (k === 'startDate') {
          l.startDate = v === '' || v == null ? '' : normDate(v) || '';
          continue;
        }
        l[k] = UP_TXT.includes(k) ? String(v == null ? '' : v).trim() : num(v);
      }
    }
    return res;
  }
  /* جزء من bpEditorUpImport: if (SF.BP_STATUS.includes(t)) l.status = t;… */
  function bpEditorUpImportPart2(iq, l, name, res, t) {
    if (SF.BP_STATUS.includes(t)) l.status = t;
    else res.badSt.push(`${name || iq}: ${t}`);
  }
  /* جزء من bpEditorUpImport: const kk = SF.bpKaf(t);… */
  function bpEditorUpImportPart(iq, l, name, res, t) {
    const kk = SF.bpKaf(t);
    if (kk) l.kafala = kk;
    else res.badKaf.push(`${name || iq}: ${t}`);
  }
  /* bpExcel من bpEditor (يأخذ BXC، BXG، LEAD، SLEAD، STC، colSums، expLbl، groupsOf، lines، settleOf، stNum، stSum، x من الصفحة) */
  function bpEditorBpExcel(BXC, BXG, LEAD, SLEAD, STC, colSums, expLbl, groupsOf, lines, settleOf, stNum, stSum, x) {
    const W = BXC.length,
      M = (r1, c1, r2, c2) => `${colName(c1)}${r1 + 1}:${colName(c2)}${r2 + 1}`;
    const sheetOf = (name, groups) => {
      const rows = [],
        merges = [];
      rows.push([{ v: `بيان رواتب فرع ${x.branch} — ${MP_MONTH(x.month)} — ${name}`, s: 12 }]);
      merges.push(M(0, 0, 0, W - 1));
      rows.push([]);
      for (const { title, idx, kind } of groups) {
        if (!idx.length) continue;
        const S = SF.bpSummary(idx.map(([l]) => l)),
          sums = colSums(idx),
          ext = kind !== 'in';
        let r = rows.length;
        rows.push(BXC.map((cl, ci) => ({ v: ci ? '' : title, s: 1 })));
        merges.push(M(r, 0, r, W - 1));
        r = rows.length;
        const h1 = [],
          h2 = [];
        BXC.forEach((cl, ci) => {
          const s = cl.g === 'd' ? 3 : 2;
          if (!cl.g) {
            h1.push({ v: cl.h, s });
            h2.push({ v: '', s });
            merges.push(M(r, ci, r + 1, ci));
            return;
          }
          const first = BXC[ci - 1].g !== cl.g;
          h1.push({ v: first ? BXG[cl.g] : '', s });
          h2.push({ v: cl.h, s });
          if (first) merges.push(M(r, ci, r, ci + BXC.filter((y) => y.g === cl.g).length - 1));
        });
        rows.push(h1, h2);
        idx.forEach(([l], j) => {
          const c = SF.bpCalc(l);
          rows.push(
            BXC.map((cl) => {
              const v = cl.f(l, c, j + 1);
              return {
                v: typeof v === 'number' ? Math.round(v * 100) / 100 : v,
                s: cl.t === 'basic' ? 6 : cl.t === 'net' ? 7 : typeof v === 'number' ? 5 : cl.t === 'ltr' || cl.t === 'i' ? 13 : 4,
              };
            }),
          );
        });
        r = rows.length;
        rows.push(
          BXC.map((cl, ci) =>
            ci < LEAD
              ? { v: ci ? '' : 'إجمالي', s: 9 }
              : { v: sums[ci] == null ? '' : Math.round(sums[ci] * 100) / 100, s: sums[ci] == null ? 9 : 8 },
          ),
        );
        merges.push(M(r, 0, r, LEAD - 1));
        for (const [lab, val] of [
          [expLbl(title), S.expense],
          [ext ? 'خارج مدد (الصافي + التصفيات)' : 'المرفوع على مدد', ext ? S.outside : S.mudad],
        ]) {
          r = rows.length;
          rows.push(BXC.map((cl, ci) => (ci < LEAD ? { v: ci ? '' : lab, s: 10 } : ci === LEAD ? { v: val, s: 11 } : { v: '', s: 4 })));
          merges.push(M(r, 0, r, LEAD - 1), M(r, LEAD + 1, r, W - 1));
        }
        rows.push([]);
      }
      if (rows.length === 2) rows.push(['لا يوجد موظفون']);
      return {
        name,
        rows,
        merges,
        cols: BXC.map((cl) => ({ i: 5, name: 28, ltr: 26, st: 16 })[cl.t] || (cl.h === 'الوظيفة' || cl.h === 'ملاحظات' ? 18 : 11)),
      };
    };
    return bpExcelPart(M, SLEAD, STC, groupsOf, lines, settleOf, sheetOf, stNum, stSum, x);
  }
  /* bind من bpEditor (يأخذ TAB_N، applyZoom، bpExcel، draw، drawer، ed، lines، main، moveBack، moveIn، moveOut، mudadFile، query، save، setZoom، tabOf، top، upImport، upTemplate، vs، x من الصفحة) */
  function bpEditorBind(
    TAB_N,
    applyZoom,
    bpExcel,
    draw,
    drawer,
    ed,
    lines,
    main,
    moveBack,
    moveIn,
    moveOut,
    mudadFile,
    query,
    save,
    setZoom,
    tabOf,
    top,
    upImport,
    upTemplate,
    vs,
    x,
  ) {
    return wireBpEditorBind(
      TAB_N,
      applyZoom,
      bpExcel,
      draw,
      drawer,
      ed,
      lines,
      main,
      moveBack,
      moveIn,
      moveOut,
      mudadFile,
      query,
      save,
      setZoom,
      tabOf,
      top,
      upImport,
      upTemplate,
      vs,
      x,
    );
  }
  /* أحداث bpEditorBind: #bpX، #bpRec */
  function wireBpEditorBind(
    TAB_N,
    applyZoom,
    bpExcel,
    draw,
    drawer,
    ed,
    lines,
    main,
    moveBack,
    moveIn,
    moveOut,
    mudadFile,
    query,
    save,
    setZoom,
    tabOf,
    top,
    upImport,
    upTemplate,
    vs,
    x,
  ) {
    return wireBpEditorBind2(
      TAB_N,
      applyZoom,
      bpExcel,
      draw,
      drawer,
      ed,
      lines,
      main,
      moveBack,
      moveIn,
      moveOut,
      mudadFile,
      query,
      save,
      setZoom,
      tabOf,
      top,
      upImport,
      upTemplate,
      vs,
      x,
    );
  }
  /* أحداث wireBpEditorBind: #bpX، #bpRec */
  function wireBpEditorBind2(
    TAB_N,
    applyZoom,
    bpExcel,
    draw,
    drawer,
    ed,
    lines,
    main,
    moveBack,
    moveIn,
    moveOut,
    mudadFile,
    query,
    save,
    setZoom,
    tabOf,
    top,
    upImport,
    upTemplate,
    vs,
    x,
  ) {
    $('#bpX').onclick = bpExcel;
    $('#bpRec').onclick = () => bpReconXlsx([{ ...x, lines }], x.month);
    $$('[data-tab]', main).forEach((b) => {
      b.onclick = () => {
        vs.tab = b.dataset.tab;
        draw();
      };
    });
    $$('[data-zoom]', main).forEach((b) => {
      b.onclick = () => {
        const z = b.dataset.zoom;
        setZoom(z === 'fit' ? 'fit' : String(Math.round(Math.max(0.5, Math.min(1.5, vs.zNow + (z === 'in' ? 0.1 : -0.1))) * 10) / 10));
      };
    });
    return bpEditorBind2Part(
      TAB_N,
      applyZoom,
      draw,
      drawer,
      ed,
      lines,
      main,
      moveBack,
      moveIn,
      moveOut,
      mudadFile,
      query,
      save,
      tabOf,
      top,
      upImport,
      upTemplate,
      vs,
      x,
    );
  }
  /* جزء من wireBpEditorBind2: wireBxCols(draw, vs);… */
  function bpEditorBind2Part(
    TAB_N,
    applyZoom,
    draw,
    drawer,
    ed,
    lines,
    main,
    moveBack,
    moveIn,
    moveOut,
    mudadFile,
    query,
    save,
    tabOf,
    top,
    upImport,
    upTemplate,
    vs,
    x,
  ) {
    wireBxCols(draw, vs);
    $$('details.bp-sec', main).forEach((d) => {
      d.addEventListener('toggle', () => {
        if (d.open) applyZoom();
      });
    });
    $$('[data-mudadx]', main).forEach((b) => {
      b.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        mudadFile(b.dataset.mudadx);
      };
    });
    $$('tr.bp-r', main).forEach((tr) => {
      tr.onclick = (e) => {
        if (!e.target.closest('select, button')) drawer(+tr.dataset.row);
      };
    });
    $$('[data-mvin]', main).forEach((b) => {
      b.onclick = () => moveIn(+b.dataset.mvin);
    });
    $$('[data-mvout]', main).forEach((b) => {
      b.onclick = () => moveOut(+b.dataset.mvout);
    });
    $$('[data-mvback]', main).forEach((b) => {
      b.onclick = () => moveBack(+b.dataset.mvback);
    });
    wireBind2(lines, main, query, x);
    if (!ed) return;
    wireBpPrep(top, x);
    $$('[data-st]', main).forEach((s2) => {
      s2.onchange = () => {
        const l = lines[+s2.dataset.st],
          was = tabOf(l);
        l.status = s2.value;
        l.stManual = true;
        l.autoSt = false;
        vs.open = l.kafala || '';
        if (tabOf(l) !== was) toast(`نُقل «${l.name}» إلى تبويب ${TAB_N[tabOf(l)]}`);
        draw();
        if (l.status === 'بداية دوام' && !l.startDate) drawer(+s2.dataset.st);
      };
    });
    wireBpKafGo(draw, lines, vs);
    return wireBind(draw, drawer, lines, query, save, upImport, upTemplate, x);
  }
  /* أحداث bpEditorBind: #bpPrep */
  function wireBpPrep(top, x) {
    $('#bpPrep').oninput = () => {
      x.preparer = $('#bpPrep').value;
      $('#bpTop').innerHTML = top();
    };
  }
  /* أحداث bpEditorBind: #bpKafGo */
  function wireBpKafGo(draw, lines, vs) {
    $('#bpKafGo').onclick = () => {
      const k = $('#bpKafAll').value;
      if (!k) return;
      lines.forEach((l) => {
        if (!l.kafala) l.kafala = k;
      });
      vs.open = k;
      draw();
    };
  }
  /* أحداث bpEditorBind: #bxCols */
  function wireBxCols(draw, vs) {
    $('#bxCols').onclick = () => {
      vs.showAll = !vs.showAll;
      try {
        localStorage.setItem('bpCols', vs.showAll ? 'all' : '');
      } catch {
        /* متصفح بلا تخزين */
      }
      draw();
    };
  }
  /* جزء من bpEditor: const onResize = () => {… */
  function bpEditorPart3(applyZoom, main, vs) {
    const onResize = () => {
      if (!document.body.contains(main) || !$('.bpx', main)) return window.removeEventListener('resize', onResize);
      if (vs.zoom === 'fit') applyZoom();
    };
    window.addEventListener('resize', onResize);
  }
  /* جزء من bpEditor: vs.zoom = (() => {… */
  function bpEditorPart2(vs) {
    vs.zoom = (() => {
      try {
        return localStorage.getItem('bpZoom') || 'fit';
      } catch {
        return 'fit';
      }
    })();
  }
  /* جزء من bpEditor: vs.showAll = (() => {… */
  function bpEditorPart(vs) {
    vs.showAll = (() => {
      try {
        return localStorage.getItem('bpCols') === 'all';
      } catch {
        return false;
      }
    })();
  }
  /* جزء من upImport: UPC.map(([k, h]) => [… */
  function upImportHtml(H, UPC) {
    return UPC.map(([k, h]) => [
      k,
      H.indexOf(normAr(h)) >= 0
        ? H.indexOf(normAr(h))
        : k === 'due'
          ? H.indexOf(normAr('مبالغ مستحقة'))
          : k === 'car'
            ? H.indexOf(normAr('بدل سيارة / نقل'))
            : -1,
    ]);
  }
  /* جزء من bpExcel: const settleSheet = () => {… */
  function bpExcelPart(M, SLEAD, STC, groupsOf, lines, settleOf, sheetOf, stNum, stSum, x) {
    const settleSheet = () => {
      const idx = settleOf(),
        W2 = STC.length,
        rows = [[{ v: `بيان رواتب فرع ${x.branch} — ${MP_MONTH(x.month)} — التصفيات`, s: 12 }], [], STC.map((cl) => ({ v: cl.h, s: 2 }))],
        merges = [M(0, 0, 0, W2 - 1)];
      idx.forEach(([l], j) => {
        const c = SF.bpCalc(l);
        rows.push(
          STC.map((cl) => {
            const v = cl.f(l, c, j + 1);
            return {
              v: typeof v === 'number' ? Math.round(v * 100) / 100 : v,
              s: cl.t === 'net' ? 7 : typeof v === 'number' ? 5 : cl.t === 'ltr' || cl.t === 'i' ? 13 : 4,
            };
          }),
        );
      });
      const S = SF.bpSummary(idx.map(([l]) => l)),
        r0 = rows.length;
      rows.push(
        STC.map((cl, ci) =>
          ci < SLEAD
            ? { v: ci ? '' : 'إجمالي التصفيات', s: 9 }
            : stNum(cl)
              ? { v: Math.round(stSum(idx, cl) * 100) / 100, s: 8 }
              : { v: '', s: 9 },
        ),
      );
      rows.push(
        STC.map((cl, ci) =>
          ci < SLEAD
            ? { v: ci ? '' : 'مصروف التصفيات المضاف إلى مصروف رواتب الفرع', s: 10 }
            : ci === SLEAD
              ? { v: S.expense, s: 11 }
              : { v: '', s: 4 },
        ),
      );
      merges.push(M(r0, 0, r0, SLEAD - 1), M(r0 + 1, 0, r0 + 1, SLEAD - 1), M(r0 + 1, SLEAD + 1, r0 + 1, W2 - 1));
      return {
        name: 'التصفيات',
        rows,
        merges,
        cols: STC.map((cl) => ({ i: 5, name: 28, ltr: 26, st: 16, net: 18 })[cl.t] || (cl.h === 'الكفالة' ? 34 : 14)),
      };
    };
    const sumRows = [
      ['الكفالة', 'عدد الموظفين', 'الصافي المستلم', 'المرفوع على مدد', 'خارج مدد', 'منها تصفيات', 'تأمينات الشركة', 'مصروف الرواتب'].map(
        (v) => ({ v, s: 2 }),
      ),
    ];
    for (const [lab, idx] of [...[...groupsOf('in'), ...groupsOf('out')].map((g) => [g.title, g.idx]), ['التصفيات', settleOf()]]) {
      if (!idx.length) continue;
      const S = SF.bpSummary(idx.map(([l]) => l));
      sumRows.push([
        { v: lab, s: 4 },
        ...[idx.length, S.paid, S.mudad, S.outside, S.settle, S.gosi, S.expense].map((v, vi) => ({ v, s: vi === 6 ? 7 : 5 })),
      ]);
    }
    const T = SF.bpSummary(lines);
    sumRows.push([
      { v: 'الإجمالي', s: 9 },
      ...[T.count, T.paid, T.mudad, T.outside, T.settle, T.gosi, T.expense].map((v) => ({ v, s: 8 })),
    ]);
    downloadXlsxStyled(`بيان رواتب ${x.branch} ${x.month}.xlsx`, [
      sheetOf('داخل الكفالة', groupsOf('in')),
      sheetOf('خارج الكفالة', groupsOf('out')),
      settleSheet(),
      {
        name: 'ملخص الكفالات',
        rows: [[{ v: `ملخص كفالات فرع ${x.branch} — ${MP_MONTH(x.month)}`, s: 12 }], [], ...sumRows],
        merges: ['A1:H1'],
        cols: [44, 13, 15, 15, 15, 13, 14, 16],
      },
    ]);
  }
  /* أحداث bind: #bpQ، #bpPass، #bpRet، #bpOk */
  function wireBind2(lines, main, query, x) {
    $('#bpQ').oninput = () => {
      const q = normAr($('#bpQ').value);
      $$('tr.bp-r', main).forEach((tr) => {
        const l = lines[+tr.dataset.row];
        tr.hidden = !!q && !normAr(`${l.name} ${l.iqama}`).includes(q);
      });
      if (q)
        $$('details.bp-sec', main).forEach((dd) => {
          dd.open = true;
        });
    };
    if ($('#bpPass'))
      $('#bpPass').onclick = async () => {
        if (!(await askYesNo(`تمت مراجعة بيان فرع ${x.branch} — رفعه لـ ${x.flow.approver || 'المعتمد'} للاعتماد؟`))) return;
        try {
          await api('POST', `/api/branch-pay/${x.id}/review`, {});
          toast('رُفع للاعتماد');
          viewBranchPay(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    if ($('#bpRet'))
      $('#bpRet').onclick = async () => {
        const note = prompt('سبب الإرجاع للتعديل:');
        if (!note) return;
        try {
          await api('POST', `/api/branch-pay/${x.id}/return`, { note });
          toast('أعدته للفرع');
          viewBranchPay(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    if ($('#bpOk'))
      $('#bpOk').onclick = async () => {
        if (!(await askYesNo(`اعتماد بيان رواتب فرع ${x.branch} — ${MP_MONTH(x.month)}؟`))) return;
        try {
          await api('POST', `/api/branch-pay/${x.id}/approve`, {});
          toast('تم الاعتماد');
          viewBranchPay(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
  }
  /* أحداث bind: #bpAdd، #bpSave، #bpDel، #bpUpT، #bpUpF، #bpSend */
  function wireBind(draw, drawer, lines, query, save, upImport, upTemplate, x) {
    $('#bpAdd').onclick = () => {
      lines.push({ status: 'على رأس العمل', name: '', iqama: '', kafala: '' });
      drawer(lines.length - 1);
    };
    $('#bpSave').onclick = () => save().catch((e) => toast(e.message, true));
    $('#bpDel').onclick = async () => {
      if (
        !(await askYesNo(
          `حذف مسودة بيان رواتب فرع ${x.branch} — ${MP_MONTH(x.month)} نهائياً؟ يمكنك فتح بيان جديد للشهر بعدها (يعبئه النظام من سجل الموظفين).`,
        ))
      )
        return;
      try {
        await api('DELETE', `/api/branch-pay/${x.id}`);
        toast('تم حذف المسودة');
        location.hash = `#/branch-pay?month=${x.month}`;
      } catch (e) {
        toast(e.message, true);
      }
    };
    $('#bpUpT').onclick = upTemplate;
    $('#bpUpF').onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      try {
        const R = await upImport(file);
        draw();
        const bad = [...R.badKaf.map((t) => `كفالة غير معروفة — ${t}`), ...R.badSt.map((t) => `حالة غير معروفة — ${t}`)];
        toast(
          `تم الرفع: تحديث ${R.upd} موظف${R.add ? `، وإضافة ${R.add} جديد` : ''}${bad.length ? ` — ${bad.length} ملاحظة` : ''}. راجع ثم اضغط «💾 حفظ»`,
          !!bad.length,
        );
        if (bad.length) alert(`ملاحظات الرفع (لم يطبّق النظام هذه القيم):\n${bad.slice(0, 30).join('\n')}`);
      } catch (e) {
        toast(e.message, true);
      }
    };
    $('#bpSend').onclick = async () => {
      try {
        await save(true);
        if (
          !(await askYesNo(
            `إرسال البيان للمراجعة (${x.flow.reviewer || 'إدارة الرواتب'})؟ لن تستطيع تعديله بعد الإرسال إلا إذا أعاده لك المعتمد.`,
          ))
        )
          return;
        await api('POST', `/api/branch-pay/${x.id}/submit`, {});
        toast('تم الإرسال');
        viewBranchPay(query);
      } catch (e) {
        toast(e.message, true);
      }
    };
  }
  return {
    bpEditorValue,
    bpEditorPart,
    bpEditorPart2,
    bpEditorPart3,
    bpEditorUpImport,
    bpEditorSettleHtml,
    bpEditorBpExcel,
    bpEditorDrawer,
    bpEditorBind,
  };
};
