'use strict';
/* صفحة «advances» (viewAdvances) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['advances'] = function (S) {
  /* خصائص أنواع الطلبات (public/js/form-traits.js): isForm(r, 'خاصية') بدل مقارنة النوع */
  const isForm = (r, trait) => window.SADEN_FORM_TRAITS.is(r, trait);
  const { $, $$, ADV_TABS, api, downloadCsv, esc, head, money, shell, viewAdvLedger } = S;
  async function viewAdvances(query) {
    if (query.tab !== 'requests') return viewAdvLedger(query);
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/advances');
    const d = await api('GET', '/api/advances');
    const f = query.f || 'open';
    const L = d.list.filter((x) => (f === 'open' ? x.state !== 'مسددة' : f === 'done' ? x.state === 'مسددة' : true));
    const s = (k, l = d.list.filter((x) => x.state !== 'مسددة')) => l.reduce((a, x) => a + (Number(x[k]) || 0), 0);
    main.innerHTML = `${ADV_TABS('requests')}${head('السلف', 'كل سلفة معتمدة (قصيرة وطويلة الأجل) بأقساطها: المسدد من مسيرات الرواتب المعتمدة والمتبقي — ويخصم النظام القسط في المسير تلقائياً', '<button class="btn" id="avXls">⬇ Excel</button>')}
      <div class="pr-kpis">${[
        ['سلف جارية', d.list.filter((x) => x.state !== 'مسددة').length],
        ['إجمالي السلف الجارية', money(s('amount'))],
        ['المسدد منها', money(s('paidAmt'))],
        ['المتبقي', money(s('remaining'))],
      ]
        .map(([l, v]) => `<div class="card pr-k"><small>${l}</small><b>${esc(String(v))}</b></div>`)
        .join('')}</div>
      <div class="tabs">${[
        ['open', 'الجارية'],
        ['done', 'المسددة'],
        ['all', 'الكل'],
      ]
        .map(([k, l]) => `<a href="#/advances?tab=requests&f=${k}" class="${f === k ? 'on' : ''}">${l}</a>`)
        .join('')}</div>
      <div class="card tk-tools"><input class="in" id="avQ" placeholder="بحث بالاسم أو الهوية أو رقم الطلب..." style="flex:1"></div>
      <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الطلب</th><th>الموظف</th><th>الفرع</th><th>النوع</th><th>المبلغ</th><th>القسط</th><th>بداية الخصم</th><th>الأقساط</th><th>المسدد</th><th>المتبقي</th><th>الحالة</th></tr></thead><tbody>
      ${
        L.map(
          (
            x,
          ) => `<tr class="click" data-go="#/req/${x.id}" data-s="${esc(`${x.name} ${x.iqama} ${x.serial}`)}"><td>${esc(x.serial)}</td><td><b>${esc(x.name)}</b><div class="muted" style="font-size:12px">${esc(x.iqama)}</div></td><td>${esc(x.branch)}</td><td>${isForm(x, 'longAdvance') ? 'طويلة الأجل' : 'قصيرة الأجل'}</td><td class="num">${esc(money(x.amount))}</td><td class="num">${esc(money(x.inst))}</td><td>${esc(x.start || '—')}</td>
        <td class="num">${x.paid} / ${x.count}<span class="tk-bar" style="margin-inline-start:6px"><i style="width:${Math.round((x.paid / x.count) * 100)}%"></i></span></td><td class="num">${esc(money(x.paidAmt))}</td><td class="num"><b>${esc(money(x.remaining))}</b></td><td><span class="chip ${x.state === 'مسددة' ? 'approved' : x.state === 'جارية' ? 'pending' : ''}">${esc(x.state)}</span></td></tr>`,
        ).join('') || '<tr><td colspan="11" class="empty">لا يوجد</td></tr>'
      }</tbody></table></div></div>`;
    $$('[data-go]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = tr.dataset.go;
      };
    });
    $('#avQ').oninput = () => {
      const q = $('#avQ').value.trim();
      $$('tbody tr[data-s]', main).forEach((r) => {
        r.hidden = !!q && !r.dataset.s.includes(q);
      });
    };
    $('#avXls').onclick = () =>
      downloadCsv('السلف.csv', [
        [
          'الطلب',
          'الموظف',
          'الهوية',
          'الفرع',
          'النوع',
          'المبلغ',
          'القسط',
          'بداية الخصم',
          'عدد الأقساط',
          'المسدد (أقساط)',
          'المسدد',
          'المتبقي',
          'الحالة',
          'أشهر السداد',
        ],
        ...L.map((x) => [
          x.serial,
          x.name,
          x.iqama,
          x.branch,
          isForm(x, 'longAdvance') ? 'طويلة' : 'قصيرة',
          x.amount,
          x.inst,
          x.start,
          x.count,
          x.paid,
          x.paidAmt,
          x.remaining,
          x.state,
          x.paidMonths.join(' '),
        ]),
      ]);
  }

  return { viewAdvances };
};
