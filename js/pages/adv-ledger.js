'use strict';
/* صفحة «adv-ledger» (viewAdvLedger) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['adv-ledger'] = function (S) {
  const { $, $$, ADV_ST, ADV_TABS, SF, advCalc, api, askYesNo, downloadXlsx, esc, fmtNum, head, icon, normAr, sameBrC, shell, toast } = S;
  /* ---------- سجل سلف الفروع ---------- */
  async function viewAdvLedger(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/advances');
    const d = await api('GET', '/api/advances/ledger');
    const tab = ['ledger', 'summary', 'settled'].includes(query.tab) ? query.tab : 'ledger';
    const m = (v) => fmtNum(Math.round((Number(v) || 0) * 100) / 100);
    const P = d.people.map((p) => ({ ...p, c: advCalc(p) }));
    return viewAdvLedgerPart2(P, d, m, main, query, tab);
  }
  /* جزء من viewAdvLedger: const brs = [...new Set(P.map((p) => p.branch))].s… */
  function viewAdvLedgerPart2(P, d, m, main, query, tab) {
    const brs = [...new Set(P.map((p) => p.branch))].sort((x, y) => x.localeCompare(y, 'ar'));
    const sum = (L, k) => L.reduce((s, p) => s + p.c[k], 0);
    const tile = (v, l, cl = '') => `<div class="card doc-tile ${cl}"><b>${v}</b><small>${l}</small></div>`;
    const fd = (x) => (x ? esc(SF.fmtDate(x)) : '—');
    /* ملف موظف في السجل: سلفه وخصوماته */
    if (query.p) {
      return viewAdvLedgerPart(P, d, fd, m, main, query, tile);
    }
    let body = '';
    if (tab === 'ledger') {
      const b = query.b && brs.includes(query.b) ? query.b : (d.branch && brs.find((x) => sameBrC(x, d.branch))) || '';
      const L = P.filter((p) => !b || p.branch === b)
        .filter((p) => query.all || p.c.state !== 'مسددة')
        .sort((x, y) => y.c.rem - x.c.rem);
      const T = P.filter((p) => !b || p.branch === b);
      body = `${
        d.branch
          ? ''
          : `<div class="av-brs"><a class="chip${!b ? ' on' : ''}" href="#/advances">كل الفروع <small>${m(sum(P, 'rem'))}</small></a>${brs
              .map(
                (x) =>
                  `<a class="chip${x === b ? ' on' : ''}" href="#/advances?b=${encodeURIComponent(x)}">${esc(x)} <small>${m(
                    sum(
                      P.filter((p) => p.branch === x),
                      'rem',
                    ),
                  )}</small></a>`,
              )
              .join('')}</div>`
      }
        <div class="doc-tiles">${tile(T.filter((p) => p.c.rem > 0.5).length, 'موظفون عليهم سلف')}${tile(m(sum(T, 'A')), 'إجمالي الممنوح')}${tile(m(sum(T, 'G')), 'المخصوم', 'ok')}${tile(m(sum(T, 'rem')), 'المتبقي', 'bad')}${tile(T.filter((p) => p.c.state === 'لم يبدأ السداد').length, 'لم يبدأ سدادها', 'warn')}</div>
        <div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><input class="in" id="avQ2" placeholder="بحث بالاسم..." style="max-width:320px"><span class="row" style="gap:8px">
          <a class="btn sm ghost" href="#/advances?${b ? `b=${encodeURIComponent(b)}&` : ''}${query.all ? '' : 'all=1'}">${query.all ? 'إخفاء المسددة' : 'عرض المسددة أيضاً'}</a>${d.canEdit ? '<button class="btn sm" id="avNewP">➕ موظف</button>' : ''}<button class="btn sm" id="avXls2">📊 Excel</button></span></div>
        <div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>#</th><th>مستلم السلفة</th>${b ? '' : '<th>الفرع</th>'}<th>عدد السلف</th><th>الممنوح</th><th>المخصوم</th><th>المتبقي</th><th>آخر خصم</th><th>الحالة</th></tr></thead><tbody>
        ${L.map((p, i) => `<tr class="click" data-p="${p.id}" data-s="${esc(p.label)}"><td>${i + 1}</td><td><b>${esc(p.label)}</b>${p.emp ? `<div class="muted doc-n">${esc(p.emp.empNo || '')} · ${esc(p.emp.iqama || '')}</div>` : ''}</td>${b ? '' : `<td>${esc(p.branch)}</td>`}<td>${p.c.n}</td><td>${m(p.c.A)}</td><td>${m(p.c.G)}</td><td><b class="${p.c.rem > 0 ? 'av-rem' : ''}">${m(p.c.rem)}</b></td><td>${fd(p.c.last)}</td><td><span class="chip ${ADV_ST[p.c.state]}">${p.c.state}</span></td></tr>`).join('') || '<tr><td colspan="9" class="empty">لا توجد سلف</td></tr>'}</tbody>
        <tfoot><tr><th colspan="${b ? 3 : 4}">الإجمالي</th><th>${m(sum(L, 'A'))}</th><th>${m(sum(L, 'G'))}</th><th>${m(sum(L, 'rem'))}</th><th colspan="2"></th></tr></tfoot></table></div></div>`;
      main.innerHTML = `${ADV_TABS('ledger')}${head(b ? `سلف فرع ${esc(b)}` : 'سجل سلف الفروع', `كل موظف بسلفه وخصوماته — أي سلفة يعتمدها المعتمدون على النظام تنزل تلقائياً في سجل فرعها${d.importedFrom ? ` — الرصيد الافتتاحي من «${esc(d.importedFrom)}»` : ''}`)}${body}`;
      $$('tr[data-p]', main).forEach((tr) => {
        tr.onclick = () => {
          location.hash = `#/advances?p=${tr.dataset.p}`;
        };
      });
      wireAdvLedger(L, b, d, main);
      return;
    }
    if (tab === 'summary') {
      const rows = brs.map((b) => {
        const L = P.filter((p) => p.branch === b);
        return {
          b,
          n: L.filter((p) => p.c.rem > 0.5).length,
          A: sum(L, 'A'),
          G: sum(L, 'G'),
          rem: sum(L, 'rem'),
          per: sum(L, 'personal'),
          hou: sum(L, 'housing'),
          going: L.filter((p) => p.c.state === 'جاري السداد').reduce((s, p) => s + p.c.rem, 0),
          none: L.filter((p) => p.c.state === 'لم يبدأ السداد').reduce((s, p) => s + p.c.rem, 0),
        };
      });
      const T = (k) => rows.reduce((s, x) => s + x[k], 0),
        maxRem = Math.max(1, ...rows.map((x) => x.rem));
      body = `<div class="doc-tiles">${tile(P.filter((p) => p.c.rem > 0.5).length, 'عدد السلف القائمة')}${tile(m(T('rem')), 'المتبقي', 'bad')}${tile(`${T('A') ? Math.round((T('rem') / T('A')) * 1000) / 10 : 0}%`, 'نسبة المتبقي من الممنوح')}${tile(m(T('going')), 'جاري سدادها (متبقي)', 'warn')}${tile(m(T('none')), 'لم يبدأ سدادها', 'bad')}${tile(m(T('A')), 'إجمالي الممنوح')}</div>
        <div class="card"><h3>مجمع السلف حسب الفرع</h3><div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>#</th><th>الفرع</th><th>موظفون</th><th>الممنوح</th><th>المخصوم</th><th>المتبقي</th><th style="min-width:180px"></th><th>شخصية</th><th>بدل سكن</th></tr></thead><tbody>
        ${rows.map((x, i) => `<tr class="click" data-b="${esc(x.b)}"><td>${i + 1}</td><td><b>${esc(x.b)}</b></td><td>${x.n}</td><td>${m(x.A)}</td><td>${m(x.G)}</td><td><b>${m(x.rem)}</b></td><td><span class="av-bar"><i style="width:${Math.round((x.rem / maxRem) * 100)}%"></i></span></td><td>${m(x.per)}</td><td>${m(x.hou)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><th colspan="2">إجمالي مجمع السلف</th><th>${T('n')}</th><th>${m(T('A'))}</th><th>${m(T('G'))}</th><th>${m(T('rem'))}</th><th></th><th>${m(T('per'))}</th><th>${m(T('hou'))}</th></tr></tfoot></table></div></div>`;
      main.innerHTML = `${ADV_TABS('summary')}${head('إجمالي وتحليل السلف', 'الممنوح والمخصوم والمتبقي لكل فرع، وأنواع السلف (شخصية / دفعات بدل السكن)')}${body}`;
      $$('tr[data-b]', main).forEach((tr) => {
        tr.onclick = () => {
          location.hash = `#/advances?b=${encodeURIComponent(tr.dataset.b)}`;
        };
      });
      return;
    }
    renderViewAdvLedger(d, m, main);
  }
  /* جزء من viewAdvLedger: const p = P.find((x) => x.id === query.p);… */
  function viewAdvLedgerPart(P, d, fd, m, main, query, tile) {
    const p = P.find((x) => x.id === query.p);
    if (!p) {
      main.innerHTML = '<div class="card empty">غير موجود</div>';
      return;
    }
    const adv = p.entries.filter((e) => e.k === 'adv'),
      ded = p.entries.filter((e) => e.k === 'ded').sort((x, y) => String(x.date).localeCompare(String(y.date))),
      notes = p.entries.filter((e) => e.k === 'note');
    const src = (e) =>
      e.src === 'request'
        ? `<a class="chip doc-ok" href="#/req/${e.reqId}">طلب ${esc(e.serial || '')}</a>`
        : e.src === 'payroll'
          ? '<span class="chip doc-ok">مسير النظام</span>'
          : e.src === 'manual'
            ? `<span class="chip doc-na" title="${esc(e.by || '')}">يدوي</span>`
            : '';
    const act = (e) =>
      d.canEdit && !['request', 'payroll'].includes(e.src)
        ? `<button class="btn sm ghost" data-ee="${e.id}" title="تعديل">${icon('pencil')}</button>`
        : '';
    renderViewAdvLedger2(act, adv, d, ded, fd, m, main, notes, p, src, tile);
    if (!d.canEdit) return;
    const entryModal = (k, e) => {
      e = e || { k, type: 'شخصية', date: new Date().toISOString().slice(0, 10) };
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<form class="modal" style="max-width:520px;width:96%" novalidate><h3 style="margin-top:0">${e.id ? '✏️ تعديل' : k === 'adv' ? '➕ سلفة جديدة' : '➖ تسجيل خصم'} — ${esc(p.label)}</h3>
          ${k === 'adv' ? `<div class="field"><label>نوع السلفة</label><select class="in" name="type">${['شخصية', 'دفعة بدل سكن'].map((t) => `<option${t === e.type ? ' selected' : ''}>${t}</option>`).join('')}</select></div>` : ''}
          <div class="grid2"><div class="field"><label>${k === 'adv' ? 'قيمة السلفة' : 'المبلغ المخصوم'} *</label><input class="in" name="amount" type="number" step="0.01" min="0" value="${esc(e.amount || '')}"></div><div class="field"><label>التاريخ</label><input class="in" type="date" name="date" value="${esc(e.date || '')}"></div></div>
          <div class="field"><label>${k === 'adv' ? 'البيان' : 'ملاحظات (مثال: خصم من راتب نوفمبر 2026)'}</label><textarea class="in" name="txt" rows="2">${esc(k === 'adv' ? e.desc || '' : e.note || '')}</textarea></div>
          <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button>${e.id ? '<button type="button" class="btn ghost" data-del>🗑 حذف</button>' : ''}<button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
      document.body.appendChild(bg);
      const f = $('form', bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      if ($('[data-del]', bg))
        $('[data-del]', bg).onclick = async () => {
          if (!(await askYesNo('حذف هذا القيد؟'))) return;
          await api('DELETE', `/api/advances/ledger/${p.id}/entries/${e.id}`);
          bg.remove();
          viewAdvLedger(query);
        };
      f.onsubmit = async (ev) => {
        ev.preventDefault();
        const b = {
          k,
          type: f.type ? f.type.value : '',
          amount: f.amount.value,
          date: f.date.value,
          [k === 'adv' ? 'desc' : 'note']: f.txt.value,
        };
        try {
          await api(
            e.id ? 'PUT' : 'POST',
            e.id ? `/api/advances/ledger/${p.id}/entries/${e.id}` : `/api/advances/ledger/${p.id}/entries`,
            b,
          );
          bg.remove();
          toast('تم الحفظ');
          viewAdvLedger(query);
        } catch (err) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
      f.amount.focus();
    };
    $('#avAddA').onclick = () => entryModal('adv');
    $('#avAddD').onclick = () => entryModal('ded');
    $$('[data-ee]', main).forEach((b) => {
      b.onclick = () => {
        const e = p.entries.find((x) => x.id === b.dataset.ee);
        entryModal(e.k, e);
      };
    });
    wireAvEdP(d, p, query);
    return;
  }
  /* محتوى viewAdvLedger (HTML) */
  function renderViewAdvLedger2(act, adv, d, ded, fd, m, main, notes, p, src, tile) {
    main.innerHTML = `${ADV_TABS('ledger')}${head(
      esc(p.label),
      `فرع ${esc(p.branch)}${p.emp ? ` — <a href="#/employee/${p.emp.id}">${esc(p.emp.name)}</a> (${esc(p.emp.empNo || '')} · ${esc(p.emp.iqama || '')})` : ' — غير مربوط بملف موظف'}`,
      `<a class="btn ghost" href="#/advances?b=${encodeURIComponent(p.branch)}">→ فرع ${esc(p.branch)}</a>${d.canEdit ? '<button class="btn" id="avEdP">✏️ البيانات والربط</button><button class="btn" id="avAddA">➕ سلفة</button><button class="btn primary" id="avAddD">➖ خصم</button>' : ''}`,
    )}
        <div class="doc-tiles">${tile(m(p.c.A), 'إجمالي السلف')}${tile(m(p.c.G), 'المخصوم', 'ok')}${tile(m(p.c.rem), 'المتبقي', p.c.rem > 0 ? 'bad' : 'ok')}${tile(`<span class="chip ${ADV_ST[p.c.state]}">${p.c.state}</span>`, 'الحالة')}${tile(p.c.last ? fd(p.c.last) : '—', 'آخر خصم')}</div>
        <div class="me-grid av-grid"><div class="card"><h3>السلف (${adv.length})</h3><div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>النوع</th><th>القيمة</th><th>البيان</th><th>التاريخ</th><th></th><th></th></tr></thead><tbody>
          ${adv.map((e) => `<tr><td><span class="chip ${e.type === 'دفعة بدل سكن' ? 'info' : ''}">${esc(e.type)}</span></td><td><b>${m(e.amount)}</b></td><td class="doc-n">${esc(e.desc || '')}</td><td>${fd(e.date)}</td><td>${src(e)}</td><td>${act(e)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">لا توجد سلف</td></tr>'}</tbody>
          <tfoot><tr><th>الإجمالي</th><th>${m(p.c.A)}</th><th colspan="4"></th></tr></tfoot></table></div></div>
          <div class="card"><h3>الخصومات (${ded.length})</h3><div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>المخصوم</th><th>ملاحظات</th><th>التاريخ</th><th></th><th></th></tr></thead><tbody>
          ${ded.map((e) => `<tr><td><b>${m(e.amount)}</b></td><td class="doc-n">${esc(e.note || '')}</td><td>${fd(e.date)}</td><td>${src(e)}</td><td>${act(e)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">لا توجد خصومات</td></tr>'}</tbody>
          <tfoot><tr><th>${m(p.c.G)}</th><th colspan="4">المتبقي: ${m(p.c.rem)}</th></tr></tfoot></table></div>${notes.length ? `<div class="hint">${notes.map((e) => esc(e.note)).join(' · ')}</div>` : ''}</div></div>`;
  }
  /* أحداث viewAdvLedger: #avQ2، #avXls2، #avNewP */
  function wireAdvLedger(L, b, d, main) {
    $('#avQ2').oninput = () => {
      const q = normAr($('#avQ2').value);
      $$('tr[data-p]', main).forEach((tr) => {
        tr.hidden = !!q && !normAr(tr.dataset.s).includes(q);
      });
    };
    $('#avXls2').onclick = () =>
      downloadXlsx(
        `سلف ${b || 'كل الفروع'}.xlsx`,
        [
          ['مستلم السلفة', 'الفرع', 'الرقم الوظيفي', 'الهوية', 'عدد السلف', 'الممنوح', 'المخصوم', 'المتبقي', 'آخر خصم', 'الحالة'],
          ...L.map((p) => [
            p.label,
            p.branch,
            (p.emp || {}).empNo || '',
            (p.emp || {}).iqama || '',
            p.c.n,
            p.c.A,
            p.c.G,
            p.c.rem,
            p.c.last,
            p.c.state,
          ]),
        ],
        'السلف',
      );
    if ($('#avNewP'))
      $('#avNewP').onclick = async () => {
        const name = prompt('اسم مستلم السلفة:');
        if (!name) return;
        const br = b || prompt('الفرع:', d.branches[0] || '');
        if (!br) return;
        const p = await api('POST', '/api/advances/ledger', { name, branch: br });
        location.hash = `#/advances?p=${p.id}`;
      };
  }
  /* أحداث viewAdvLedger: #avEdP */
  function wireAvEdP(d, p, query) {
    $('#avEdP').onclick = async () => {
      const emps = ((await api('POST', '/api/mudad-pay/match', { rows: [] }).catch(() => ({ emps: [] }))).emps || []).map((x) => ({
        empId: x.id,
        name: x.name,
        empNo: x.empNo || '',
      }));
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<form class="modal" style="max-width:520px;width:96%" novalidate><h3 style="margin-top:0">✏️ بيانات الموظف في سجل السلف</h3>
          <div class="field"><label>الاسم كما في السجل</label><input class="in" name="name" value="${esc(p.label)}"></div>
          <div class="field"><label>الفرع</label><input class="in" name="branch" list="avBr" value="${esc(p.branch)}"><datalist id="avBr">${d.branches.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></div>
          <div class="field"><label>ربط بملف موظف (ابحث بالاسم أو الرقم الوظيفي)</label><input class="in" name="emp" list="avEmp" value="${esc(p.emp ? `${p.emp.name} | ${p.emp.empNo}` : '')}"><datalist id="avEmp">${emps
            .filter((x) => x.empId)
            .map((x) => `<option value="${esc(`${x.name} | ${x.empNo}`)}" data-id="${x.empId}">`)
            .join('')}</datalist></div>
          <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
      document.body.appendChild(bg);
      const f = $('form', bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      f.onsubmit = async (ev) => {
        ev.preventDefault();
        const hit = emps.find((x) => x.empId && `${x.name} | ${x.empNo}` === f.emp.value);
        try {
          await api('PUT', `/api/advances/ledger/${p.id}`, {
            name: f.name.value,
            branch: f.branch.value,
            empId: f.emp.value ? (hit ? hit.empId : p.empId) : '',
          });
          bg.remove();
          toast('تم الحفظ');
          viewAdvLedger(query);
        } catch (err) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
    };
  }
  /* محتوى viewAdvLedger (HTML) */
  function renderViewAdvLedger(d, m, main) {
    main.innerHTML = `${ADV_TABS('settled')}${head('مسددو السلف', `${d.settled.length} سلفة مسددة بالكامل (أرشيف من ملف السلف)`)}
      <div class="card"><input class="in" id="avQ3" placeholder="بحث بالاسم أو الفرع..." style="max-width:320px;margin-bottom:10px"><div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>#</th><th>مستلم السلفة</th><th>الفرع</th><th>قيمة السلفة</th><th>المخصوم</th><th>المتبقي</th><th>ملاحظات</th></tr></thead><tbody>
      ${d.settled.map((x, i) => `<tr data-s="${esc(`${x.name} ${x.branch}`)}"><td>${i + 1}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.branch)}</td><td>${m(x.amount)}</td><td>${m(x.deducted)}</td><td>${m(x.remaining)}</td><td class="muted doc-n">${esc(x.note)}</td></tr>`).join('')}</tbody></table></div></div>`;
    wireAvQ3(main);
  }
  /* أحداث viewAdvLedger: #avQ3 */
  function wireAvQ3(main) {
    $('#avQ3').oninput = () => {
      const q = normAr($('#avQ3').value);
      $$('tr[data-s]', main).forEach((tr) => {
        tr.hidden = !!q && !normAr(tr.dataset.s).includes(q);
      });
    };
  }

  return { viewAdvLedger };
};
