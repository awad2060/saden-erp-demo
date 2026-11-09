'use strict';
/* صفحة «my-profile» (viewMe) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['my-profile'] = function (S) {
  const { $$, SF, api, esc, head, kpiCard, kv, money, prMonth, shell } = S;
  /* ---------- الخدمة الذاتية: ملفي الوظيفي ---------- */
  async function viewMe() {
    /* حالة الصفحة: ما يتغير بعد العرض (d) */
    const st = {};
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/me');
    st.d = undefined;
    try {
      st.d = await api('GET', '/api/me/hr');
    } catch (err) {
      main.innerHTML = `${head('ملفي الوظيفي', '')}<div class="card empty">${esc(err.message)}</div>`;
      return;
    }
    const e = st.d.emp,
      lv = st.d.leave,
      c = st.d.contract;
    const span = (s) => (s ? `${s.y} سنة، ${s.m} شهر، ${s.d} يوم` : '—');
    const kv = (rows) =>
      `<table class="ep-t">${rows
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
        .join('')}</table>`;
    const RS = {
      pending: ['pending', 'قيد الاعتماد'],
      approved: ['approved', 'معتمد'],
      rejected: ['rejected', 'مرفوض'],
      returned: ['late', 'معاد للتعديل'],
      draft: ['', 'مسودة'],
    };
    renderViewMe(RS, c, e, kv, lv, main, span, st);
    viewMePart(main);
  }
  /* محتوى viewMe (HTML) */
  function renderViewMe(RS, c, e, kv, lv, main, span, st) {
    main.innerHTML = `${head(`ملفي الوظيفي — ${esc(e.nameAr)}`, [e.title, e.department, e.branch && `فرع ${e.branch}`].filter(Boolean).join(' · '), `<a class="btn primary" href="#/new/leaveRequest">🏖️ طلب إجازة</a>${SF.byId.advanceShort ? '<a class="btn" href="#/new/advanceShort">💵 طلب سلفة</a>' : ''}`)}
      <div class="pr-kpis">${[
        ['مدة الخدمة', span(lv.span)],
        ['رصيد الإجازة المتاح', `${lv.balance.toFixed(2)} يوم`],
        ['العقد', c.fixed ? (e.contractEnd ? `ينتهي ${SF.fmtDate(e.contractEnd)}` : 'محدد المدة') : 'غير محدد المدة'],
        ['آخر صافي راتب', st.d.payslips[0] ? `${money(st.d.payslips[0].net)} ريال` : '—'],
      ]
        .map(([l, v]) => `<div class="card pr-k"><small>${l}</small><b>${esc(String(v))}</b></div>`)
        .join('')}</div>
      <div class="me-grid">
        <div class="card"><h3>بياناتي</h3>${kv([
          ['الرقم الوظيفي', e.empNo],
          ['الهوية / الإقامة', e.iqama],
          ['الجنسية', e.nationality],
          ['المسمى الوظيفي', e.title],
          ['الدرجة', st.d.grade],
          ['الإدارة', e.department],
          ['الفرع', e.branch],
          ['المدير المباشر', e.managerLabel || e.manager],
          ['تاريخ التعيين', e.joinDate && SF.fmtDate(e.joinDate)],
          ['آخر مباشرة بعد إجازة', e.returnDate && SF.fmtDate(e.returnDate)],
          ['البنك', e.bank],
          ['الآيبان', e.iban],
          ['رقم التأمينات', e.gosi],
          ['اشتراك التأمينات الشهري (حصتي)', st.d.gosiEmp ? `${money(st.d.gosiEmp)} ريال` : ''],
        ])}</div>
        <div class="card"><h3>عقدي ومستنداتي</h3>${kv([
          ['نوع العقد', e.contractType],
          ['بداية العقد', e.contractStart && SF.fmtDate(e.contractStart)],
          [
            'نهاية العقد',
            e.contractEnd &&
              `${SF.fmtDate(e.contractEnd)}${c.left !== null ? ` (${c.left < 0 ? `منتهي منذ ${-c.left} يوم` : `بعد ${c.left} يوم`})` : ''}`,
          ],
          ['فترة التجربة', e.probationEnd && `${SF.fmtDate(e.probationEnd)}${e.probationStatus ? ` — ${e.probationStatus}` : ''}`],
        ])}
          ${st.d.docs.length ? `<h4 class="b-sec">صلاحية المستندات</h4>${st.d.docs.map((x) => `<div class="emp-al ${x.days < 0 ? 'bad' : x.days <= 30 ? 'warn' : 'ok'}">${esc(x.l)}: ${esc(SF.fmtDate(x.date))} — ${x.days < 0 ? `منتهي منذ ${-x.days} يوم` : `متبقي ${x.days} يوم`}</div>`).join('')}` : ''}</div>
        <div class="card"><h3>إجازاتي</h3>${kv([
          ['الرصيد السنوي', `${lv.rate} يوماً`],
          ['المستحق منذ آخر عودة', `${Number(lv.entitled || 0).toFixed(2)} يوم`],
          ['المستخدم', `${Number(lv.usedAfter || 0)} يوم`],
          ['المتاح الآن', `${lv.balance.toFixed(2)} يوم`],
        ])}
          ${st.d.leaves.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>النوع</th><th>من</th><th>إلى</th><th>الأيام</th></tr></thead><tbody>${st.d.leaves.map((x) => `<tr><td>${esc(x.type || '—')}</td><td>${esc(SF.fmtDate(x.from))}</td><td>${esc(SF.fmtDate(x.to))}</td><td class="num">${esc(String(x.days || ''))}</td></tr>`).join('')}</tbody></table></div>` : '<div class="muted">لا توجد إجازات مسجلة</div>'}</div>
        <div class="card"><h3>حضوري هذا الشهر</h3>${
          st.d.att
            ? kv([
                ['أيام العمل', String(st.d.att.work)],
                ['الحضور', String(st.d.att.present)],
                ['الإجازة', String(st.d.att.leave)],
                ['الغياب', String(st.d.att.absent)],
                ['التأخير', `${st.d.att.lateMin} دقيقة`],
                ['الإضافي', `${st.d.att.otHours} ساعة`],
              ])
            : '<div class="muted">لا توجد سجلات بصمة لهذا الشهر</div>'
        }</div>
        <div class="card"><h3>قسائم راتبي</h3>${st.d.payslips.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الشهر</th><th>الإجمالي</th><th>الاستقطاعات</th><th>الصافي</th><th></th></tr></thead><tbody>${st.d.payslips.map((p) => `<tr><td>${esc(prMonth(p.month))}</td><td class="num">${esc(money(p.gross))}</td><td class="num">${esc(money(p.totalDed))}</td><td class="num"><b>${esc(money(p.net))}</b></td><td><a class="btn sm" href="#/my-payslip/${p.id}" target="_blank">🧾 عرض</a></td></tr>`).join('')}</tbody></table></div>` : '<div class="muted">لا توجد مسيرات معتمدة بعد</div>'}</div>
        <div class="card"><h3>طلباتي</h3>${st.d.requests.length ? `<div class="tbl-wrap"><table class="tbl"><tbody>${st.d.requests.map((r) => `<tr class="click" data-go="#/req/${r.id}"><td>${esc(r.serial || '')}</td><td>${esc(r.title)}</td><td><span class="chip ${(RS[r.status] || [''])[0]}">${esc((RS[r.status] || ['', r.status])[1])}</span></td><td class="muted">${esc(SF.fmtDate(String(r.createdAt).slice(0, 10)))}</td></tr>`).join('')}</tbody></table></div>` : '<div class="muted">لا توجد طلبات</div>'}</div>
        ${kpiCard(st.d.kpi)}
        ${st.d.contracts.length ? `<div class="card"><h3>سجل عقودي</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>النوع</th><th>من</th><th>إلى</th></tr></thead><tbody>${st.d.contracts.map((x) => `<tr><td>${esc(x.type || '—')}</td><td>${esc(x.from ? SF.fmtDate(x.from) : '—')}</td><td>${esc(x.to ? SF.fmtDate(x.to) : '—')}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      </div>`;
  }
  /* جزء من viewMe: $$('[data-go]', main).forEach((tr) => {… */
  function viewMePart(main) {
    $$('[data-go]', main).forEach((tr) => {
      tr.onclick = () => {
        location.hash = tr.dataset.go;
      };
    });
  }

  return { viewMe };
};
