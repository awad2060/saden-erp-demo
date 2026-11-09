'use strict';
/* صفحة «ended-employees» (viewEnded) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['ended-employees'] = function (S) {
  const { $, $$, SF, api, downloadCsv, dt, esc, head, isAdmin, shell, toast } = S;
  /* ---------- الموظفون المنتهية خدماتهم (حسب نوع انتهاء الخدمة) + محذوفات الموظفين لمدير النظام ---------- */
  async function viewEnded(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/employees-ended');
    const d = await api('GET', '/api/employees/ended');
    const del = isAdmin() ? await api('GET', '/api/employees-deleted') : null;
    const types = [...new Set(d.list.map((x) => x.endType || 'غير محدد'))].sort(
      (a, b) => d.list.filter((x) => (x.endType || 'غير محدد') === b).length - d.list.filter((x) => (x.endType || 'غير محدد') === a).length,
    );
    const f = query.f || '';
    const shown = f === '__del' ? [] : d.list.filter((x) => !f || (x.endType || 'غير محدد') === f);
    main.innerHTML = `${head('المنتهية خدماتهم', 'الموظفون بحالة «غير نشط» مصنفون حسب نوع انتهاء الخدمة — ويُحدَّد النوع من ملف الموظف أو تلقائياً من نموذج آخر يوم دوام عند التصفية النهائية', '<button class="btn" id="enXls">⬇ Excel</button>')}
      <div class="tabs"><a href="#/employees-ended" class="${!f ? 'on' : ''}">الكل (${d.list.length})</a>${types.map((t) => `<a href="#/employees-ended?f=${encodeURIComponent(t)}" class="${f === t ? 'on' : ''}">${esc(t)} (${d.list.filter((x) => (x.endType || 'غير محدد') === t).length})</a>`).join('')}${del ? `<a href="#/employees-ended?f=__del" class="${f === '__del' ? 'on' : ''}">🗑 المحذوفون (${del.length})</a>` : ''}</div>
      ${
        f === '__del'
          ? `<div class="hint" style="margin-bottom:10px">حذف الموظف لا يمحوه من النظام: يبقى هنا بملفه ومستنداته، ولا يعيد النظام استخدام رقمه الوظيفي، ويمكنك استعادته.</div>
        <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>الهوية</th><th>الفرع</th><th>حُذف</th><th>بواسطة</th><th>السبب</th><th></th></tr></thead><tbody>
        ${del.map((x) => `<tr><td><b>${esc(x.nameAr)}</b><div class="muted" style="font-size:12px">${esc([x.empNo, x.title].filter(Boolean).join(' — '))}</div></td><td>${esc(x.iqama)}</td><td>${esc(x.branch)}</td><td>${esc(dt(x.deletedAt))}</td><td>${esc(x.deletedByName)}</td><td>${esc(x.deleteReason || '—')}</td><td><button class="btn sm" data-restore="${x.id}">↩ استعادة</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">لا يوجد</td></tr>'}</tbody></table></div></div>`
          : `<div class="card tk-tools"><input class="in" id="enQ" placeholder="بحث..." style="flex:1"></div>
        <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>الفرع</th><th>تاريخ التعيين</th><th>تاريخ ترك العمل</th><th>نوع انتهاء الخدمة</th><th>ملف التصفية</th></tr></thead><tbody>
        ${shown.map((x) => `<tr class="click" data-go="#/employee/${x.id}" data-s="${esc(`${x.nameAr} ${x.empNo} ${x.iqama}`)}"><td><b>${esc(x.nameAr)}</b><div class="muted" style="font-size:12px">${esc([x.empNo, x.title].filter(Boolean).join(' — '))}</div></td><td>${esc(x.branch)}</td><td>${esc(x.joinDate ? SF.fmtDate(x.joinDate) : '—')}</td><td>${esc(x.leaveDate ? SF.fmtDate(x.leaveDate) : '—')}</td><td>${x.endType ? esc(x.endType) : '<span class="muted">غير محدد</span>'}</td><td>${x.settle ? `<a href="#/req/${x.settle.id}" data-stop>${esc(x.settle.serial)}</a>` : '—'}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">لا يوجد</td></tr>'}</tbody></table></div></div>`
      }`;
    $$('[data-go]', main).forEach((tr) => {
      tr.onclick = (ev) => {
        if (ev.target.closest('[data-stop]')) return;
        location.hash = tr.dataset.go;
      };
    });
    if ($('#enQ'))
      $('#enQ').oninput = () => {
        const q = $('#enQ').value.trim();
        $$('tbody tr[data-s]', main).forEach((r) => {
          r.hidden = !!q && !r.dataset.s.includes(q);
        });
      };
    $('#enXls').onclick = () =>
      downloadCsv('المنتهية_خدماتهم.csv', [
        ['الرقم الوظيفي', 'الاسم', 'الهوية', 'الفرع', 'المسمى', 'تاريخ التعيين', 'تاريخ ترك العمل', 'نوع انتهاء الخدمة', 'ملف التصفية'],
        ...d.list
          .filter((x) => !f || f === '__del' || (x.endType || 'غير محدد') === f)
          .map((x) => [
            x.empNo,
            x.nameAr,
            x.iqama,
            x.branch,
            x.title,
            x.joinDate,
            x.leaveDate,
            x.endType || '',
            x.settle ? x.settle.serial : '',
          ]),
      ]);
    $$('[data-restore]', main).forEach((b) => {
      b.onclick = async () => {
        try {
          const r = await api('POST', `/api/employees-deleted/${b.dataset.restore}/restore`);
          toast('تمت استعادة الموظف');
          location.hash = `#/employee/${r.id}`;
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
  }

  return { viewEnded };
};
