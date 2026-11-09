'use strict';
/* صفحة «محاضر التسليم والتسلم» (من قائمة إدارة الحركة: #/fleet?tab=hand): كل محاضر تسليم المركبات
 * برقم المحضر والمركبة والمسلِّم والمستلم والفرعين والحالة وملف التصفية المرتبط، مع البحث والفلاتر وExcel.
 * المحاسب يرى محاضر فرعه وما رفعه، والباقون كل المحاضر (/api/fleet/handovers). تُستدعى من fleet-list.js بـ S. */
(function () {
  /* أدوات app.js المشتركة: تُضبط عند الاستدعاء */
  let $, SF, api, downloadXlsx, esc, head, shell;
  const HAND_ST = { approved: 'معتمد', pending: 'قيد الاعتماد', returned: 'معاد', rejected: 'مرفوض' };

  function handHtml(hand) {
    const hb = [...new Set(hand.list.flatMap((h) => [h.branch, h.toBranch]).filter(Boolean))].sort();
    const st = Object.entries(HAND_ST)
      .map(([k, l]) => `<option value="${k}">${l}</option>`)
      .join('');
    const tools = `${hand.canNew ? '<a class="btn primary" href="#/new/vehicleHandover">📝 إعداد محضر</a>' : ''}<button class="btn" id="hXls">📊 Excel</button>`;
    return `${head('📝 محاضر التسليم والتسلم', `${hand.list.length} محضر`, tools)}
      <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <input class="in" id="hQ" placeholder="بحث: رقم المحضر، اللوحة، المسلِّم، المستلم..." style="flex:1;min-width:200px">
        <select class="in" id="hB" style="width:auto"><option value="">كل الفروع</option>${hb.map((b) => `<option>${esc(b)}</option>`).join('')}</select>
        <select class="in" id="hS" style="width:auto"><option value="">كل الحالات</option>${st}</select></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>رقم المحضر</th><th>التاريخ</th><th>المركبة</th><th>المسلِّم</th><th>المستلم</th><th>من فرع ← إلى فرع</th><th>الحالة</th><th>ملف تصفية</th></tr></thead><tbody id="hRows"></tbody></table></div></div>`;
  }
  function shownHand(hl) {
    const q = $('#hQ').value.trim(),
      b = $('#hB').value,
      s = $('#hS').value;
    return hl.filter(
      (h) =>
        (!b || h.branch === b || h.toBranch === b) &&
        (!s || h.status === s) &&
        (!q || [h.serial, h.plate, h.model, h.fromName, h.name, h.caseSerial].join(' ').includes(q)),
    );
  }
  function handTr(h) {
    const step = h.status === 'pending' && h.stepLabel ? `<div class="muted" style="font-size:12px">${esc(h.stepLabel)}</div>` : '';
    const plate = h.vehicleId ? `<a href="#/fleet/${esc(h.vehicleId)}"><bdi>${esc(h.plate)}</bdi></a>` : `<bdi>${esc(h.plate)}</bdi>`;
    return `<tr>
          <td><a href="#/req/${h.id}"><b><bdi dir="ltr">${esc(h.serial)}</bdi></b></a></td><td>${esc(SF.fmtDate(h.receiveDate || h.createdAt.slice(0, 10)))}</td>
          <td>${plate}<div class="muted" style="font-size:12px">${esc([h.vType, h.model].filter(Boolean).join(' — '))}</div></td>
          <td>${esc(h.fromName || '—')}</td><td><b>${esc(h.name || '—')}</b></td><td>${esc([h.fromBranch || h.branch, h.toBranch].filter(Boolean).join(' ← '))}</td>
          <td><span class="chip ${esc(h.status)}">${esc(HAND_ST[h.status] || h.status)}</span>${step}</td>
          <td>${h.caseId ? `<a href="#/req/${h.caseId}"><bdi dir="ltr">${esc(h.caseSerial)}</bdi></a>` : '<span class="muted">—</span>'}</td></tr>`;
  }
  const HAND_XLS = [
    ['رقم المحضر', (h) => h.serial],
    ['تاريخ الاستلام', (h) => h.receiveDate],
    ['رقم اللوحة', (h) => h.plate],
    ['الفئة', (h) => h.vType],
    ['النوع', (h) => h.model],
    ['المسلِّم', (h) => h.fromName],
    ['المستلم', (h) => h.name],
    ['من فرع', (h) => h.fromBranch || h.branch],
    ['إلى فرع', (h) => h.toBranch],
    ['الحالة', (h) => HAND_ST[h.status] || h.status],
    ['أعده', (h) => h.createdByName],
    ['ملف تصفية', (h) => h.caseSerial],
  ];
  const sheet = (xs) => [HAND_XLS.map(([l]) => l), ...xs.map((x) => HAND_XLS.map(([, f]) => f(x)))];

  async function viewHandovers() {
    const hand = await api('GET', '/api/fleet/handovers');
    const main = shell('', '#/fleet?tab=hand');
    main.innerHTML = handHtml(hand);
    const draw = () => {
      $('#hRows').innerHTML =
        shownHand(hand.list).map(handTr).join('') ||
        '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">لا توجد محاضر</td></tr>';
    };
    ['input', 'change'].forEach((ev) => ['#hQ', '#hB', '#hS'].forEach((s) => $(s).addEventListener(ev, draw)));
    draw();
    $('#hXls').onclick = () => downloadXlsx('محاضر-التسليم-والتسلم.xlsx', sheet(shownHand(hand.list)), 'محاضر التسليم');
  }

  window.SES_FLEET = window.SES_FLEET || {};
  window.SES_FLEET.handovers = function (S) {
    ({ $, SF, api, downloadXlsx, esc, head, shell } = S);
    return { viewHandovers };
  };
})();
