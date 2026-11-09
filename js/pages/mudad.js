'use strict';
/* صفحة «mudad» (viewMudadPay) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['mudad'] = function (S) {
  const { $, $$, DOC_MONTHS, MP_HOW, MP_MONTH, api, askYesNo, downloadXlsx, dt, esc, fmtNum, head, icon, readXlsx, shell, state, toast } =
    S;
  /* قراءة تقرير مدد: صف العناوين (رقم الموظف ...) وصف العناوين الفرعية (الأساسي، بدل السكن، بدل النقل ...) */
  function parseMudadPay(rows) {
    const hi = rows.findIndex((r) => r.some((c) => /رقم الموظف/.test(c)));
    if (hi < 0) throw new Error('لم أجد عمود «رقم الموظف» — تأكد أنه تقرير رواتب مدد');
    const h = rows[hi],
      sub = rows[hi + 1] || [];
    const at = (re, list = h) => list.findIndex((c) => re.test(String(c || '')));
    const C = {
      mid: at(/رقم الموظف/),
      name: at(/اسم الموظف/),
      basic: at(/الأساسي/, sub),
      housing: at(/السكن/, sub),
      transport: at(/النقل/, sub),
      otherAdd: at(/مستحقات|بدلات أخرى/, sub) >= 0 ? at(/مستحقات|بدلات أخرى/, sub) : at(/بدلات أخرى/),
      otherDed: at(/استقطاع|إستقطاع|DEDUCTION/i, sub) >= 0 ? at(/استقطاع|إستقطاع|DEDUCTION/i, sub) : at(/DEDUCTION|استقطاع/i),
      net: at(/الصافي/),
      method: at(/طريقة الدفع/),
      status: at(/حالة السداد/),
      reason: at(/السبب/),
    };
    if (C.basic < 0) C.basic = at(/الراتب العادي/);
    const v = (r, k) => (C[k] >= 0 ? String(r[C[k]] == null ? '' : r[C[k]]).trim() : '');
    return rows
      .slice(hi + 1)
      .filter((r) => /^\d+$/.test(v(r, 'mid')))
      .map((r) => Object.fromEntries(Object.keys(C).map((k) => [k, v(r, k)])));
  }

  /* نموذج رفع الرواتب من مدد: اسم الموظف + رقم هوية الموظف + الأساسي والبدلات */
  function parseMudadUpload(rows) {
    const hi = rows.findIndex((r) => r.some((c) => /رقم هوية/.test(c)));
    if (hi < 0) throw new Error('لم أجد عمود «رقم هوية الموظف» — تأكد أنه نموذج رفع الرواتب من مدد');
    const h = rows[hi],
      at = (re) => h.findIndex((c) => re.test(String(c || '')));
    const C = {
      name: at(/اسم الموظف/),
      iqama: at(/رقم هوية/),
      basic: at(/الأساسي/),
      housing: at(/السكن/),
      transport: at(/نقل/),
      total: at(/إجمالي|اجمالي/),
    };
    const v = (r, k) => (C[k] >= 0 ? String(r[C[k]] == null ? '' : r[C[k]]).trim() : '');
    return rows
      .slice(hi + 1)
      .filter((r) => v(r, 'name') && /\d/.test(v(r, 'iqama')))
      .map((r) => Object.fromEntries(Object.keys(C).map((k) => [k, v(r, k)])));
  }

  async function viewMudadPay(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/mudad-pay');
    const n2 = (x) => fmtNum(Math.round((Number(x) || 0) * 100) / 100);
    /* عرض تقرير محفوظ */
    if (query.id) {
      return viewMudadPayPart2(main, n2, query, review);
    }
    const d = await api('GET', '/api/mudad-pay');
    /* شاشة مراجعة المطابقة قبل الحفظ */
    function review(m, kafala, month, file) {
      const rows = m.rows.map((x) => ({ ...x }));
      const opt = m.emps
        .map((e) => `<option value="${esc(`${e.name} | ${e.empNo || '-'} | ${e.iqama || '-'}`)}" data-id="${e.id}">`)
        .join('');
      const byLabel = new Map(m.emps.map((e) => [`${e.name} | ${e.empNo || '-'} | ${e.iqama || '-'}`, e.id]));
      const cnt = () => ({ ok: rows.filter((x) => x.empId).length, need: rows.filter((x) => !x.empId && x.how !== 'skip').length });
      const draw = () => {
        const c = cnt();
        main.innerHTML = `${head(`مراجعة الربط — ${esc(kafala)} (${esc(month)})`, `${rows.length} موظف في تقرير مدد — مربوط ${c.ok} — يحتاج اختيار ${c.need}`, '<a class="btn ghost" href="#/mudad-pay">إلغاء</a><button class="btn primary" id="mpSave">💾 حفظ التقرير</button>')}
          <div class="card"><div class="hint" style="margin-bottom:10px">يحفظ النظام الربط مع رقم الموظف على مدد، فلا تحتاج لمراجعته مرة أخرى في الشهور التالية. الموظف غير الموجود في سجل الموظفين اتركه «غير مسجل» أو أضفه لسجل الموظفين أولاً.</div>
          <datalist id="mpEmps">${opt}</datalist><div class="tbl-wrap"><table class="tbl doc-t mp-rev"><thead><tr><th>رقم مدد</th><th>الاسم في مدد</th><th>الأساسي</th><th>الصافي</th><th>الحالة</th><th>الموظف في سجل الموظفين</th></tr></thead><tbody>
          ${rows
            .map((x, i) => {
              const [t, cl] = MP_HOW[x.how] || MP_HOW.none;
              return `<tr data-i="${i}"><td dir="ltr">${esc(x.mid)}</td><td><b>${esc(x.name)}</b></td><td>${n2(x.basic)}</td><td>${n2(x.net)}</td><td><span class="chip doc-${cl}">${t}</span></td>
            <td>${
              x.empId && x.emp
                ? `<b>${esc(x.emp.name)}</b> <small class="muted">${esc(x.emp.empNo || '')} · ${esc(x.emp.iqama || '')} · ${esc(x.emp.branch || '')}${x.emp.basic ? ` · أساسي ${esc(x.emp.basic)}` : ''}</small> <button class="btn sm ghost" data-clr="${i}">تغيير</button>`
                : `<div class="mp-pick">${(x.cands || []).map((e) => `<button type="button" class="btn sm" data-pick="${i}" data-id="${e.id}" title="${esc(e.empNo || '')} · ${esc(e.iqama || '')} · أساسي ${esc(e.basic || '-')}">${esc(e.name)} <small class="muted">${esc(e.branch || '')}</small></button>`).join('')}
                <input class="in mp-q" list="mpEmps" data-q="${i}" placeholder="ابحث بالاسم أو الرقم الوظيفي أو الهوية..."><button type="button" class="btn sm ghost" data-skip="${i}">${x.how === 'skip' ? '✔ غير مسجل' : 'غير مسجل'}</button></div>`
            }</td></tr>`;
            })
            .join('')}</tbody></table></div></div>`;
        const set = (i, id, how) => {
          const e = id && m.emps.find((y) => y.id === id);
          const cand = (rows[i].cands || []).find((y) => y.id === id);
          rows[i].empId = id || '';
          rows[i].emp = e
            ? { id: e.id, name: e.name, empNo: e.empNo, iqama: e.iqama, branch: e.branch, basic: (cand || {}).basic || '' }
            : null;
          rows[i].how = how;
          draw();
        };
        $$('[data-pick]', main).forEach((b) => {
          b.onclick = () => set(+b.dataset.pick, b.dataset.id, 'manual');
        });
        $$('[data-clr]', main).forEach((b) => {
          b.onclick = () => set(+b.dataset.clr, '', 'pick');
        });
        $$('[data-skip]', main).forEach((b) => {
          b.onclick = () => set(+b.dataset.skip, '', 'skip');
        });
        $$('[data-q]', main).forEach((inp) => {
          inp.onchange = () => {
            const id = byLabel.get(inp.value);
            if (id) set(+inp.dataset.q, id, 'manual');
          };
        });
        $('#mpSave').onclick = async () => {
          try {
            const res = await api('POST', '/api/mudad-pay', {
              kafala,
              month,
              file,
              unlink: true,
              rows: rows.map(({ emp, cands, how, ...x }) => x),
            });
            toast(res.replaced ? 'تم تحديث التقرير' : 'تم حفظ التقرير');
            location.hash = `#/mudad-pay?id=${res.id}`;
          } catch (e) {
            toast(e.message, true);
          }
        };
      };
      draw();
    }
    /* رفع تقرير جديد */
    /* رفع تقرير: من خانة الشهر داخل الكفالة (الكفالة والشهر محددان)، أو كفالة جديدة */
    return viewMudadPayPart(d, main, n2, query, review);
  }
  /* جزء من viewMudadPay: const r = await api('GET', `/api/mudad-pay/${query… */
  async function viewMudadPayPart2(main, n2, query, review) {
    const r = await api('GET', `/api/mudad-pay/${query.id}`);
    const tot = (k) => r.rows.reduce((s, x) => s + (Number(x[k]) || 0), 0);
    const linked = r.rows.filter((x) => x.emp).length;
    renderViewMudadPay2(linked, main, n2, r, tot);
    wireMudadPay(r, review);
    return;
  }
  /* جزء من viewMudadPay: const upload = (kafala, month) => {… */
  function viewMudadPayPart(d, main, n2, query, review) {
    const upload = (kafala, month) => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<form class="modal" style="max-width:520px;width:96%" novalidate><h3 style="margin-top:0">📤 رفع تقرير رواتب مدد</h3>
        ${
          kafala
            ? `<div class="mp-fixed"><span>الكفالة</span><b>${esc(kafala)}</b></div><input type="hidden" name="kafala" value="${esc(kafala)}">`
            : `<div class="field"><label>الكفالة (المنشأة) *</label><input class="in" name="kafala" list="mpK"><datalist id="mpK">${d.kafalat.map((k) => `<option value="${esc(k)}">`).join('')}</datalist></div>`
        }
        ${month ? `<div class="mp-fixed"><span>الشهر</span><b>${esc(MP_MONTH(month))}</b></div><input type="hidden" name="month" value="${esc(month)}">` : `<div class="field"><label>الشهر *</label><input class="in" type="month" name="month" value="${new Date().toISOString().slice(0, 7)}"></div>`}
        <div class="field"><label>ملف التقرير من مدد (Excel) *</label><input class="in" type="file" name="file" accept=".xlsx,.xls"></div>
        <div class="hint">التقرير كما ينزل من منصة مدد (رقم الموظف، اسم الموظف، الأساسي، البدلات، الاستقطاعات، الصافي، حالة السداد).</div>
        <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">متابعة ← مطابقة الموظفين</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
      document.body.appendChild(bg);
      const f = $('form', bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const err = (m) => {
          $('.merr', bg).innerHTML = `<div class="err">${esc(m)}</div>`;
        };
        const k = f.kafala.value.trim(),
          mo = f.month.value;
        if (!k || !mo || !f.file.files[0]) return err('حدد الكفالة والشهر واختر الملف');
        if (
          d.list.some((x) => x.kafala === k && x.month === mo) &&
          !(await askYesNo(`يوجد تقرير ${MP_MONTH(mo)} لهذه الكفالة — استبداله؟`))
        )
          return;
        try {
          const rows = parseMudadPay(await readXlsx(f.file.files[0]));
          if (!rows.length) return err('لا توجد صفوف موظفين في الملف');
          const m = await api('POST', '/api/mudad-pay/match', { rows, kafala: k });
          bg.remove();
          review(m, k, mo, f.file.files[0].name);
        } catch (ex) {
          err(ex.message);
        }
      };
    };
    const kafalat = [...new Set([...d.kafalat, ...d.list.map((x) => x.kafala)])];
    /* داخل الكفالة: شهور السنة، كل شهر في خانة (مرفوع بملخصه، أو زر رفع) */
    if (query.k) {
      const k = query.k,
        mine = d.list.filter((x) => x.kafala === k);
      const years = [...new Set([String(new Date().getFullYear()), ...mine.map((x) => x.month.slice(0, 4))])].sort();
      const y = years.includes(query.y) ? query.y : String(new Date().getFullYear());
      const nowM = new Date().toISOString().slice(0, 7);
      const cells = Array.from({ length: 12 }, (_, i) => {
        const mo = `${y}-${String(i + 1).padStart(2, '0')}`,
          x = mine.find((r) => r.month === mo);
        if (x)
          return `<button type="button" class="card mp-m done" data-id="${x.id}"><span class="mp-mn">${DOC_MONTHS[i]}</span><b>${n2(x.net)}</b><small>صافي — ${x.count} موظف</small>
          <span class="mp-ms">${x.linked === x.count ? '<span class="chip doc-ok">✔ مربوط بالكامل</span>' : `<span class="chip doc-warn">${x.linked} من ${x.count} مربوط</span>`}${x.failed ? `<span class="chip doc-bad">${x.failed} لم ينجح</span>` : ''}</span></button>`;
        return `<button type="button" class="card mp-m${mo > nowM ? ' future' : ''}" data-up="${mo}"${mo > nowM ? ' disabled' : ''}><span class="mp-mn">${DOC_MONTHS[i]}</span><span class="mp-plus">${mo > nowM ? 'لم يحن بعد' : '📤 رفع التقرير'}</span></button>`;
      }).join('');
      const tot = mine.filter((x) => x.month.startsWith(y));
      renderViewMudadPay3(cells, k, main, n2, tot, y, years);
      $('#mpY').onchange = () => {
        location.hash = `#/mudad-pay?k=${encodeURIComponent(k)}&y=${$('#mpY').value}`;
      };
      $$('[data-id]', main).forEach((b) => {
        b.onclick = () => {
          location.hash = `#/mudad-pay?id=${b.dataset.id}`;
        };
      });
      $$('[data-up]', main).forEach((b) => {
        b.onclick = () => upload(k, b.dataset.up);
      });
      wireMpIdl(k, main, n2);
      return;
    }
    /* الصفحة الرئيسية: بطاقة لكل كفالة */
    renderViewMudadPay(d, kafalat, main, n2);
    $('#mpNewK').onclick = () => upload('', '');
  }
  /* محتوى viewMudadPay (HTML) */
  function renderViewMudadPay3(cells, k, main, n2, tot, y, years) {
    main.innerHTML = `${head(`رواتب مدد — ${esc(k)}`, `سنة ${y}: ${tot.length} من 12 شهر مرفوع — إجمالي الصافي ${n2(tot.reduce((s, x) => s + x.net, 0))}`, '<button class="btn primary" id="mpIdl">🔗 ربط الموظفين بالهوية</button><a class="btn ghost" href="#/mudad-pay">→ كل الكفالات</a>')}
        <div class="card"><div class="row" style="gap:8px;margin-bottom:14px"><label>السنة</label><select class="in" id="mpY" style="width:auto">${[
          ...new Set([...years, String(Number(y) - 1)]),
        ]
          .sort()
          .map((v) => `<option${v === y ? ' selected' : ''}>${v}</option>`)
          .join('')}</select></div>
        <div class="mp-months">${cells}</div></div>`;
  }
  /* محتوى viewMudadPay (HTML) */
  function renderViewMudadPay2(linked, main, n2, r, tot) {
    main.innerHTML = `${head(
      `رواتب مدد — ${esc(r.kafala)}`,
      `${esc(MP_MONTH(r.month))} — ${r.rows.length} موظف — ${linked} مربوط بسجل الموظفين — رفعه ${esc(r.by)} ${esc(dt(r.at))}`,
      `<a class="btn ghost" href="#/mudad-pay?k=${encodeURIComponent(r.kafala)}&y=${r.month.slice(0, 4)}">→ ${esc(r.kafala)}</a><button class="btn" id="mpRelink">🔗 مراجعة الربط</button><button class="btn" id="mpXls">📊 Excel</button>${state.user.role === 'admin' ? '<button class="btn ghost" id="mpDel">🗑 حذف</button>' : ''}`,
    )}
        <div class="doc-tiles">${[
          ['الموظفون', r.rows.length],
          ['مربوط بالسجل', linked, 'ok'],
          ['غير مربوط', r.rows.length - linked, r.rows.length - linked ? 'warn' : ''],
          ['إجمالي الأساسي', n2(tot('basic'))],
          ['الاستقطاعات', n2(tot('otherDed')), 'bad'],
          ['إجمالي الصافي', n2(tot('net')), 'ok'],
          ['دفع لم ينجح', r.rows.filter((x) => x.status && !/نجح/.test(x.status)).length, 'bad'],
        ]
          .map(([l, v, c]) => `<div class="card doc-tile ${c || ''}"><b>${v}</b><small>${l}</small></div>`)
          .join('')}</div>
        <div class="card"><div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>#</th><th>رقم مدد</th><th>الاسم في مدد</th><th>الموظف في السجل</th><th>الرقم الوظيفي</th><th>رقم الهوية</th><th>الفرع</th><th>الأساسي</th><th>السكن</th><th>النقل</th><th>مستحقات أخرى</th><th>استقطاعات</th><th>الصافي</th><th>حالة السداد</th></tr></thead><tbody>
        ${r.rows
          .map(
            (
              x,
              i,
            ) => `<tr><td>${i + 1}</td><td dir="ltr">${esc(x.mid)}</td><td>${esc(x.name)}</td><td>${x.emp ? `<a href="#/employee/${x.emp.id}"><b>${esc(x.emp.name)}</b></a>` : '<span class="chip doc-na">غير مربوط</span>'}</td><td>${esc((x.emp || {}).empNo || '—')}</td><td dir="ltr">${esc((x.emp || {}).iqama || '—')}</td><td>${esc((x.emp || {}).branch || '—')}</td>
          <td${x.emp && Number(x.emp.basic) && Number(x.emp.basic) !== Number(x.basic) ? ` class="mp-diff" title="الأساسي في سجل الموظف: ${esc(x.emp.basic)}"` : ''}>${n2(x.basic)}</td><td>${n2(x.housing)}</td><td>${n2(x.transport)}</td><td>${n2(x.otherAdd)}</td><td>${n2(x.otherDed)}</td><td><b>${n2(x.net)}</b></td><td>${x.status ? `<span class="chip ${/نجح/.test(x.status) ? 'doc-ok' : 'doc-bad'}">${esc(x.status)}</span>` : '—'}${x.reason ? `<div class="muted doc-n">${esc(x.reason)}</div>` : ''}</td></tr>`,
          )
          .join('')}</tbody>
        <tfoot><tr><th colspan="7">الإجمالي</th><th>${n2(tot('basic'))}</th><th>${n2(tot('housing'))}</th><th>${n2(tot('transport'))}</th><th>${n2(tot('otherAdd'))}</th><th>${n2(tot('otherDed'))}</th><th>${n2(tot('net'))}</th><th></th></tr></tfoot></table></div>
        <div class="hint">🟡 الأساسي بخلفية صفراء: مختلف عن الأساسي المسجل في ملف الموظف.</div></div>`;
  }
  /* أحداث viewMudadPay: #mpIdl */
  function wireMpIdl(k, main, n2) {
    $('#mpIdl').onclick = () => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<form class="modal" style="max-width:540px;width:96%" novalidate><h3 style="margin-top:0">🔗 ربط موظفي «${esc(k)}» برقم الهوية</h3>
          <div class="hint" style="margin-bottom:10px">ارفع «نموذج رفع الرواتب» من مدد لهذه الكفالة (فيه اسم الموظف ورقم هويته). يربط النظام كل موظف بملفه في سجل الموظفين برقم الهوية، وبرقمه على مدد من التقارير المرفوعة — مرة واحدة، ويطابق التقارير القادمة تلقائياً.</div>
          <div class="field"><label>نموذج رفع الرواتب (Excel) *</label><input class="in" type="file" name="file" accept=".xlsx,.xls"></div>
          <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">🔗 ربط</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
      document.body.appendChild(bg);
      const f = $('form', bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const err = (m2) => {
          $('.merr', bg).innerHTML = `<div class="err">${esc(m2)}</div>`;
        };
        if (!f.file.files[0]) return err('اختر الملف');
        try {
          const rows = parseMudadUpload(await readXlsx(f.file.files[0]));
          const res = await api('POST', '/api/mudad-pay/idlink', { kafala: k, rows });
          bg.remove();
          const c = (s2) => res.rows.filter((x) => x.state === s2).length;
          const ST = {
            linked: ['✔ مربوط (هوية + رقم مدد)', 'ok'],
            noreport: ['موجود في السجل — يربطه النظام عند رفع تقرير', 'warn'],
            noemp: ['الهوية غير موجودة في سجل الموظفين', 'bad'],
          };
          main.innerHTML = `${head(`نتيجة الربط بالهوية — ${esc(k)}`, `${res.rows.length} موظف في النموذج — مربوط ${c('linked')} — بانتظار تقرير ${c('noreport')} — غير موجود في السجل ${c('noemp')}${res.fixed ? ` — حُدِّث ${res.fixed} صف في التقارير المرفوعة` : ''}`, `<a class="btn primary" href="#/mudad-pay?k=${encodeURIComponent(k)}">✔ تم</a>`)}
              <div class="doc-tiles">${[
                ['في النموذج', res.rows.length],
                ['مربوط بالكامل', c('linked'), 'ok'],
                ['بانتظار تقرير رواتب', c('noreport'), 'warn'],
                ['غير موجود في سجل الموظفين', c('noemp'), 'bad'],
              ]
                .map(([l, v2, cl]) => `<div class="card doc-tile ${cl || ''}"><b>${v2}</b><small>${l}</small></div>`)
                .join('')}</div>
              <div class="card"><div class="tbl-wrap"><table class="tbl doc-t"><thead><tr><th>#</th><th>الاسم في مدد</th><th>رقم الهوية</th><th>الأساسي</th><th>رقم مدد</th><th>الموظف في السجل</th><th>الرقم الوظيفي</th><th>الفرع</th><th>الحالة</th></tr></thead><tbody>
              ${res.rows
                .map(
                  (
                    x,
                    i,
                  ) => `<tr><td>${i + 1}</td><td><b>${esc(x.name)}</b></td><td dir="ltr">${esc(x.iqama)}</td><td>${n2(x.basic)}</td><td dir="ltr">${esc(x.mid || '—')}</td><td>${x.emp ? `<a href="#/employee/${x.emp.id}">${esc(x.emp.name)}</a>` : '—'}</td><td>${esc((x.emp || {}).empNo || '—')}</td><td>${esc((x.emp || {}).branch || '—')}</td>
                <td><span class="chip doc-${ST[x.state][1]}">${ST[x.state][0]}</span></td></tr>`,
                )
                .join('')}</tbody></table></div>
              ${c('noemp') ? '<div class="hint">الموظفون «غير موجود في سجل الموظفين»: أضفهم لسجل الموظفين برقم هويتهم ثم أعد رفع النموذج.</div>' : ''}</div>`;
        } catch (ex) {
          err(ex.message);
        }
      };
    };
  }
  /* أحداث viewMudadPay: #mpXls، #mpRelink، #mpDel */
  function wireMudadPay(r, review) {
    $('#mpXls').onclick = () =>
      downloadXlsx(
        `رواتب مدد - ${r.kafala} - ${r.month}.xlsx`,
        [
          [
            'رقم مدد',
            'الاسم في مدد',
            'الموظف في السجل',
            'الرقم الوظيفي',
            'رقم الهوية',
            'الفرع',
            'الأساسي',
            'السكن',
            'النقل',
            'مستحقات أخرى',
            'استقطاعات',
            'الصافي',
            'طريقة الدفع',
            'حالة السداد',
            'السبب',
          ],
          ...r.rows.map((x) => [
            x.mid,
            x.name,
            (x.emp || {}).name || '',
            (x.emp || {}).empNo || '',
            (x.emp || {}).iqama || '',
            (x.emp || {}).branch || '',
            x.basic,
            x.housing,
            x.transport,
            x.otherAdd,
            x.otherDed,
            x.net,
            x.method,
            x.status,
            x.reason,
          ]),
        ],
        r.month,
      );
    $('#mpRelink').onclick = async () => {
      const m = await api('POST', '/api/mudad-pay/match', { kafala: r.kafala, rows: r.rows.map(({ emp, ...x }) => x) });
      review(m, r.kafala, r.month, r.file);
    };
    if ($('#mpDel'))
      $('#mpDel').onclick = async () => {
        if (!(await askYesNo(`حذف تقرير ${r.kafala} — ${r.month}؟`))) return;
        await api('DELETE', `/api/mudad-pay/${r.id}`);
        location.hash = `#/mudad-pay?k=${encodeURIComponent(r.kafala)}`;
      };
  }
  /* محتوى viewMudadPay (HTML) */
  function renderViewMudadPay(d, kafalat, main, n2) {
    main.innerHTML = `${head('تقارير رواتب مدد', 'كل كفالة لوحدها — ادخل الكفالة وارفع تقرير كل شهر في خانته، ويُربط بسجل الموظفين (الرقم الوظيفي والهوية والفرع)', '<button class="btn" id="mpNewK">➕ كفالة جديدة</button>')}
      ${
        kafalat.length
          ? `<div class="mp-ks">${kafalat
              .map((k) => {
                const mine = d.list.filter((x) => x.kafala === k),
                  last = mine.slice().sort((a2, b2) => b2.month.localeCompare(a2.month))[0];
                return `<a class="card mp-k" href="#/mudad-pay?k=${encodeURIComponent(k)}"><span class="mp-ki">${icon('buildings')}</span><b>${esc(k)}</b>
          <small class="muted">${mine.length ? `${mine.length} شهر مرفوع — آخر شهر ${esc(MP_MONTH(last.month))}` : 'لا توجد تقارير بعد'}</small>${last ? `<span class="mp-kn">صافي آخر شهر: <b>${n2(last.net)}</b></span>` : ''}</a>`;
              })
              .join('')}</div>`
          : '<div class="card empty">لا توجد كفالات — أضف الكفالات من «وثائق ومستندات ← اشتراكات مدد» أو «كفالة جديدة»</div>'
      }`;
  }

  return { viewMudadPay };
};
