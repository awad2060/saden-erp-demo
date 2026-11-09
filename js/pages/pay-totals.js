'use strict';
/* صفحة «مبالغ رواتب الشهر» (#/pay-totals): لكل شهر الكفالات بمبالغها داخل الكفالة وخارجها، وثلاث بطاقات:
 * إجمالي داخل الكفالة، وإجمالي خارج الكفالة، وإجمالي رواتب الشهر. يدخلها معد الرواتب ومدير النظام،
 * ويراها المدير التنفيذي والمدير العام (لوحة الإدارة العليا). الخادم: /api/pay-totals (server/modules/finance). */
(function () {
  const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthName = (m) => `${AR_MONTHS[Number(m.slice(5, 7)) - 1] || ''} ${m.slice(0, 4)}`;
  const sar = (v) => `${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} <small class="muted">ريال</small>`;
  const CSS = `.pt{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.pt .stats,.pt-dash .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:0}
.pt-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.pt-months{display:flex;flex-wrap:wrap;gap:6px}.pt-months .chip{cursor:pointer}.pt-months .chip.on{background:var(--brand);color:#fff}
.pt-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px}
.pt-tbl td{vertical-align:middle}.pt-tbl .in{width:100%}.pt-tbl td.num{width:170px}.pt-tbl tfoot th{background:var(--surface-2)}
.pt .card h3{display:flex;align-items:center;gap:8px;margin:0 0 10px}`;
  function style() {
    if (document.getElementById('ptCss')) return;
    const el = document.createElement('style');
    el.id = 'ptCss';
    el.textContent = CSS;
    document.head.appendChild(el);
  }
  const sumRows = (rows) => Math.round(rows.reduce((a, x) => a + (Number(x.amount) || 0), 0) * 100) / 100;

  /* صف كفالة: اسم ومبلغ (خانات إدخال لمن يدخل المبالغ) */
  const rowHtml = (S, x, edit) =>
    edit
      ? `<tr><td><input class="in" data-n list="ptSponsors" value="${S.esc(x.name || '')}" placeholder="اسم الكفالة"></td><td class="num"><input class="in" data-a inputmode="decimal" value="${S.esc(x.amount || '')}" dir="ltr"></td><td><button type="button" class="btn sm ghost" data-rm title="حذف">✖</button></td></tr>`
      : `<tr><td>${S.esc(x.name)}</td><td class="num">${sar(x.amount)}</td></tr>`;
  /* جدول كفالات: صف لكل كفالة وإجماليها */
  function table(S, key, title, rows, edit) {
    const { esc, icon } = S;
    const row = (x) => rowHtml(S, x, edit);
    return `<div class="card" data-t="${key}"><h3>${icon(key === 'inside' ? 'idCard' : 'users')} ${esc(title)}</h3>
      <div class="tbl-wrap"><table class="tbl pt-tbl"><thead><tr><th>الكفالة</th><th>المبلغ</th>${edit ? '<th></th>' : ''}</tr></thead>
      <tbody>${(rows.length ? rows : edit ? [{}] : []).map(row).join('') || `<tr><td colspan="2" class="muted">لا توجد مبالغ</td></tr>`}</tbody>
      <tfoot><tr><th>الإجمالي</th><th class="num" data-sum>${sar(sumRows(rows))}</th>${edit ? '<th></th>' : ''}</tr></tfoot></table></div>
      ${edit ? `<button type="button" class="btn sm" data-add style="margin-top:8px">+ إضافة كفالة</button>` : ''}</div>`;
  }
  const cards = (t) => `<div class="stats">
      <div class="stat"><div class="n">${sar(t.inside)}</div><div class="l">إجمالي داخل الكفالة</div></div>
      <div class="stat"><div class="n">${sar(t.outside)}</div><div class="l">إجمالي خارج الكفالة</div></div>
      <div class="stat hi"><div class="n">${sar(t.total)}</div><div class="l">إجمالي مبالغ رواتب الشهر</div></div></div>`;
  function monthsBar(S, d) {
    const chips = d.months
      .slice(0, 18)
      .map(
        (m) =>
          `<span class="chip${m.month === d.month ? ' on' : ''}" data-m="${m.month}" title="${S.esc(String(m.total))}">${monthName(m.month)}</span>`,
      )
      .join('');
    return `<div class="card pt-bar"><label>الشهر <input class="in" type="month" id="ptMonth" value="${d.month}" style="width:auto"></label>
      <div class="pt-months">${chips || '<span class="muted">لا توجد شهور مسجلة بعد</span>'}</div></div>`;
  }

  /* الصفوف كما في الجداول الآن (للحفظ ولتحديث الإجماليات) */
  const read = (S, main, key) =>
    S.$$(`[data-t="${key}"] tbody tr`, main)
      .map((tr) => ({ name: (S.$('[data-n]', tr) || {}).value || '', amount: (S.$('[data-a]', tr) || {}).value || '' }))
      .filter((x) => x.name.trim() || Number(x.amount));
  function refreshSums(S, main) {
    const ins = sumRows(read(S, main, 'inside')),
      out = sumRows(read(S, main, 'outside'));
    S.$('[data-t="inside"] [data-sum]', main).innerHTML = sar(ins);
    S.$('[data-t="outside"] [data-sum]', main).innerHTML = sar(out);
    S.$('#ptCards', main).innerHTML = cards({ inside: ins, outside: out, total: Math.round((ins + out) * 100) / 100 });
  }
  function bindEdit(S, main, d) {
    const { $, api, toast, askYesNo } = S;
    main.addEventListener('input', () => refreshSums(S, main));
    main.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-rm]')) ev.target.closest('tr').remove();
      const add = ev.target.closest('[data-add]');
      if (add) add.previousElementSibling.querySelector('tbody').insertAdjacentHTML('beforeend', rowHtml(S, {}, true));
      if (ev.target.closest('[data-rm]') || add) refreshSums(S, main);
    });
    $('#ptEst').onclick = async () => {
      if (
        (read(S, main, 'inside').length || read(S, main, 'outside').length) &&
        !(await askYesNo('استبدال المبالغ الحالية بالتقدير من سجل الموظفين؟'))
      )
        return;
      render(S, main, { ...d, data: { ...(d.data || {}), ...d.estimate } }, true);
    };
    $('#ptSave').onclick = async () => {
      try {
        const r = await api('PUT', `/api/pay-totals/${d.month}`, {
          inside: read(S, main, 'inside'),
          outside: read(S, main, 'outside'),
          note: $('#ptNote').value,
        });
        toast(`تم حفظ مبالغ رواتب ${monthName(d.month)}`);
        render(S, main, r);
      } catch (e) {
        toast(e.message, true);
      }
    };
  }
  function render(S, main, d, dirty) {
    const { esc, icon, $, $$ } = S;
    const data = d.data || { inside: [], outside: [] };
    const t = dirty ? { inside: sumRows(data.inside), outside: sumRows(data.outside) } : d.totals;
    if (dirty) t.total = Math.round((t.inside + t.outside) * 100) / 100;
    const edit = d.canEdit;
    const meta =
      d.data && d.data.at
        ? `آخر تحديث: ${esc(d.data.byName)} — ${esc(S.SF.fmtDate(d.data.at.slice(0, 10)))}`
        : 'لم تُسجَّل مبالغ لهذا الشهر بعد';
    main.innerHTML = `<div class="pt"><div class="page-head"><div><h1>مبالغ رواتب الشهر</h1><p>${monthName(d.month)} — ${meta}</p></div>
        <div class="row">${edit ? `<button class="btn" id="ptEst">${icon('calc')} تعبئة تقديرية من سجل الموظفين</button><button class="btn primary" id="ptSave">💾 حفظ الشهر</button>` : ''}</div></div>
      ${monthsBar(S, d)}<div id="ptCards">${cards(t)}</div>
      <div class="pt-cols">${table(S, 'inside', 'داخل الكفالة (كفالات المجموعة)', data.inside || [], edit)}${table(S, 'outside', 'خارج الكفالة', data.outside || [], edit)}</div>
      ${edit ? `<div class="card"><label>ملاحظات الشهر</label><textarea class="in" id="ptNote" rows="2">${esc(data.note || '')}</textarea></div>` : data.note ? `<div class="card">${esc(data.note)}</div>` : ''}
      ${edit ? `<datalist id="ptSponsors">${(d.sponsors || []).map((s) => `<option value="${esc(s)}">`).join('')}<option value="كفالة خارجية"></datalist>` : ''}</div>`;
    $('#ptMonth').onchange = () => (location.hash = `#/pay-totals?month=${$('#ptMonth').value}`);
    $$('[data-m]', main).forEach((c) => (c.onclick = () => (location.hash = `#/pay-totals?month=${c.dataset.m}`)));
    if (edit) bindEdit(S, main, d);
  }

  async function view(S, query) {
    style();
    const main = S.shell('<div class="empty">جاري التحميل...</div>', '#/pay-totals');
    try {
      render(S, main, await S.api('GET', `/api/pay-totals${query.month ? `?month=${encodeURIComponent(query.month)}` : ''}`));
    } catch (e) {
      main.innerHTML = `<div class="card empty">${S.esc(e.message)}</div>`;
    }
  }
  window.SES_ROUTES = window.SES_ROUTES || {};
  window.SES_ROUTES['pay-totals'] = (S, query) => view(S, query);
  /* بطاقة آخر شهر مسجل في لوحة المؤشرات ومركز القيادة: الإجماليات الثلاثة ورابط التفاصيل (لمن يرى الشاشة فقط) */
  async function fill(S, box) {
    let d;
    try {
      d = await S.api('GET', '/api/pay-totals');
    } catch {
      return;
    }
    const m = d.months[0];
    if (!box || !m) return;
    style();
    box.innerHTML = `<div class="card pt-dash" style="margin:12px 0"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${S.icon('wallet')} مبالغ رواتب ${monthName(m.month)}</h3><a class="btn sm" href="#/pay-totals?month=${m.month}">التفاصيل حسب الكفالة</a></div>${cards(m)}</div>`;
  }
  window.SES_PAY_TOTALS = { cards, monthName, fill };
})();
