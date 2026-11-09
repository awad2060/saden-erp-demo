'use strict';
/* صفحة «crm» (viewCrm) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['crm'] = function (S) {
  const { $, $$, CRM_ST, SF, api, askYesNo, crmBranches, dt, esc, head, kv, normAr, shell, state, toast, today } = S;
  async function viewCrm(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/crm');
    const d = await api('GET', '/api/crm');
    const branches = state.config.branches || [];
    const today = new Date().toISOString().slice(0, 10);
    /* نافذة إضافة / تعديل العميل: اختيار الفروع (فرع أو أكثر) أو «كل فروع الشركة» */
    const editModal = (...args) => crmEditModal(branches, d, query, ...args);
    /* صفحة العميل: البيانات والفروع وجهات الاتصال وسجل التواصل */
    return viewCrmPart2(branches, d, editModal, main, query, today);
  }
  /* editModal من viewCrm (يأخذ branches، d، query من الصفحة) */
  function crmEditModal(branches, d, query, c) {
    c = c || { kind: 'شركة', status: 'نشط', branches: d.branch ? [d.branch] : [], contacts: [] };
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const inp = (k, l, attrs = '') =>
      `<div class="field"><label>${l}</label><input class="in" name="${k}" value="${esc(c[k] || '')}" ${attrs}></div>`;
    const sel = (k, l, opts) =>
      `<div class="field"><label>${l}</label><select class="in" name="${k}">${opts.map((o) => `<option${o === c[k] ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
    const contactRow = (x = {}) =>
      `<div class="crm-ct"><input class="in" data-c="name" placeholder="الاسم" value="${esc(x.name || '')}"><input class="in" data-c="title" placeholder="المسمى" value="${esc(x.title || '')}"><input class="in" data-c="phone" placeholder="الجوال" dir="ltr" value="${esc(x.phone || '')}"><input class="in" data-c="email" placeholder="البريد" dir="ltr" value="${esc(x.email || '')}"><select class="in" data-c="branch"><option value="">— الفرع —</option>${branches.map((b) => `<option${b === x.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select><button type="button" class="btn sm ghost" data-rm>✖</button></div>`;
    bg.innerHTML = `<form class="modal" style="max-width:880px;width:96%" novalidate><h3 style="margin-top:0">${c.id ? `✏️ تعديل ${esc(c.no)}` : '➕ عميل جديد'}</h3>
        <div class="grid2">${inp('name', 'اسم العميل *', 'required maxlength="200"')}${inp('nameEn', 'الاسم بالإنجليزية', 'dir="ltr"')}${sel('kind', 'نوع العميل', d.kinds)}${sel('status', 'الحالة', d.statuses)}
          ${inp('cr', 'رقم السجل التجاري', 'dir="ltr"')}${inp('vat', 'الرقم الضريبي', 'dir="ltr"')}${inp('sector', 'النشاط / القطاع')}${inp('city', 'المدينة')}
          ${inp('phone', 'الهاتف', 'dir="ltr"')}${inp('email', 'البريد الإلكتروني', 'dir="ltr"')}${inp('website', 'الموقع الإلكتروني', 'dir="ltr"')}
          <div class="field"><label>مسؤول العميل</label><select class="in" name="accountMgr"><option value="">—</option>${d.users.map((u) => `<option value="${u.id}"${u.id === c.accountMgr ? ' selected' : ''}>${esc(u.name)}${u.branch ? ` — ${esc(u.branch)}` : ''}</option>`).join('')}</select></div></div>
        <div class="field"><label>العنوان</label><input class="in" name="address" value="${esc(c.address || '')}"></div>
        <h4 class="b-sec">الفروع المتعاملة مع العميل</h4>
        ${
          d.full
            ? `<label class="crm-allck"><input type="checkbox" name="allBranches"${c.allBranches ? ' checked' : ''}> 🌐 عميل لكل فروع الشركة</label>
          <div class="crm-brs" id="crmBrs"${c.allBranches ? ' hidden' : ''}>${branches.map((b) => `<label><input type="checkbox" value="${esc(b)}"${(c.branches || []).includes(b) ? ' checked' : ''}> ${esc(b)}</label>`).join('')}</div>
          <div class="hint">اختر فرعاً واحداً، أو أكثر من فرع للعميل المشترك، أو «كل فروع الشركة»</div>`
            : `<div>${crmBranches(c)}</div><div class="hint">إضافة فروع أخرى أو جعل العميل لكل الفروع من مسؤول العملاء</div>`
        }
        <h4 class="b-sec">جهات الاتصال</h4><div id="crmCts">${(c.contacts.length ? c.contacts : [{}]).map(contactRow).join('')}</div>
        <button type="button" class="btn sm" id="crmAddCt">➕ جهة اتصال</button>
        <div class="field" style="margin-top:10px"><label>ملاحظات</label><textarea class="in" name="notes" rows="3">${esc(c.notes || '')}</textarea></div>
        <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
    document.body.appendChild(bg);
    const f = $('form', bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    if (f.allBranches)
      f.allBranches.onchange = () => {
        $('#crmBrs', bg).hidden = f.allBranches.checked;
      };
    $('#crmAddCt', bg).onclick = () => $('#crmCts', bg).insertAdjacentHTML('beforeend', contactRow());
    $('#crmCts', bg).onclick = (e) => {
      const b = e.target.closest('[data-rm]');
      if (b) b.closest('.crm-ct').remove();
    };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(
        [
          'name',
          'nameEn',
          'kind',
          'status',
          'cr',
          'vat',
          'sector',
          'city',
          'phone',
          'email',
          'website',
          'accountMgr',
          'address',
          'notes',
        ].map((k) => [k, f[k].value]),
      );
      if (d.full) {
        v.allBranches = f.allBranches.checked;
        v.branches = $$('#crmBrs input:checked', bg).map((x) => x.value);
      }
      v.contacts = $$('.crm-ct', bg).map((r) => Object.fromEntries($$('[data-c]', r).map((i) => [i.dataset.c, i.value])));
      try {
        const r = await api(c.id ? 'PUT' : 'POST', c.id ? `/api/crm/${c.id}` : '/api/crm', v);
        bg.remove();
        toast('تم الحفظ');
        location.hash = `#/crm?id=${r.id}`;
        if (query.id === r.id) viewCrm(query);
      } catch (err) {
        $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    f.name.focus();
  }
  /* جزء من viewCrm: if (query.id) {… */
  function viewCrmPart2(branches, d, editModal, main, query, today) {
    if (query.id) {
      const c = d.list.find((x) => x.id === query.id);
      if (!c) {
        main.innerHTML = '<div class="card empty">العميل غير موجود</div>';
        return;
      }
      const kv = (rows) =>
        `<table class="ep-t">${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><th>${esc(k)}</th><td dir="auto">${esc(v)}</td></tr>`)
          .join('')}</table>`;
      const acts = c.activities || [];
      renderViewCrm2(acts, c, kv, main, today);
      wireCrm(c, editModal);
      $$('[data-done]', main).forEach((b) => {
        b.onclick = async () => {
          try {
            await api('POST', `/api/crm/${c.id}/activities/${b.dataset.done}/done`);
            viewCrm(query);
          } catch (e) {
            toast(e.message, true);
          }
        };
      });
      wireCrmAct(branches, c, d, query, today);
      return;
    }
    /* قائمة العملاء: ملخص + فلاتر (بحث، فرع، حالة، نوع، نطاق الفروع) */
    viewCrmPart(branches, d, editModal, main, query, today);
  }
  /* محتوى viewCrm (HTML) */
  function renderViewCrm2(acts, c, kv, main, today) {
    main.innerHTML = `${head(
      `${esc(c.no)} — ${esc(c.name)}`,
      `${esc(c.kind)}${c.sector ? ` — ${esc(c.sector)}` : ''}${c.city ? ` — ${esc(c.city)}` : ''}`,
      `<a class="btn ghost" href="#/crm">→ كل العملاء</a>${c.canEdit ? '<button class="btn" id="crmEdit">✏️ تعديل</button>' : ''}${state.user.role === 'admin' ? '<button class="btn ghost" id="crmDel">🗑 حذف</button>' : ''}`,
    )}
        <div class="me-grid crm-detail"><div class="card"><h3>بيانات العميل <span class="chip ${CRM_ST[c.status] || ''}">${esc(c.status)}</span></h3>
          ${kv([
            ['الاسم بالإنجليزية', c.nameEn],
            ['السجل التجاري', c.cr],
            ['الرقم الضريبي', c.vat],
            ['الهاتف', c.phone],
            ['البريد', c.email],
            ['الموقع', c.website],
            ['العنوان', c.address],
            ['مسؤول العميل', c.accountMgrName],
          ])}
          <h4 class="b-sec">الفروع</h4><div class="crm-chips">${crmBranches(c)}</div>
          ${c.contacts.length ? `<h4 class="b-sec">جهات الاتصال</h4>${c.contacts.map((x) => `<div class="crm-ctv"><b>${esc(x.name)}</b>${x.title ? ` <small class="muted">${esc(x.title)}</small>` : ''}${x.branch ? ` <span class="chip crm-br">${esc(x.branch)}</span>` : ''}<div class="muted" dir="ltr">${[x.phone, x.email].filter(Boolean).map(esc).join(' · ')}</div></div>`).join('')}` : ''}
          ${c.notes ? `<h4 class="b-sec">ملاحظات</h4><p>${esc(c.notes).replace(/\n/g, '<br>')}</p>` : ''}</div>
          <div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">سجل التواصل (${acts.length})</h3><button class="btn primary sm" id="crmAct">➕ تسجيل تواصل</button></div>
            ${
              acts.length
                ? `<ul class="timeline" style="margin-top:12px">${acts
                    .map(
                      (
                        a,
                      ) => `<li><b>${esc(a.kind)}</b> <span class="when">${esc(SF.fmtDate(a.date))} — ${esc(a.by)}${a.branch ? ` — فرع ${esc(a.branch)}` : ''}</span>
              <div class="note">${esc(a.summary)}</div>${a.next ? `<div class="crm-next${a.done ? ' done' : a.next < today ? ' late' : ''}">📅 متابعة: ${esc(SF.fmtDate(a.next))}${a.done ? ' ✔ تمت' : ` <button class="btn sm ghost" data-done="${a.id}">✔ تمت</button>`}</div>` : ''}</li>`,
                    )
                    .join('')}</ul>`
                : '<div class="empty">لا يوجد تواصل مسجل بعد</div>'
            }</div>
          <div class="card"><h3>السجل</h3>${c.log
            .slice()
            .reverse()
            .map((l) => `<div class="muted" style="font-size:13px">${esc(dt(l.at))} — ${esc(l.by)}: ${esc(l.action)}</div>`)
            .join('')}</div></div>`;
  }
  /* أحداث viewCrm: #crmEdit، #crmDel */
  function wireCrm(c, editModal) {
    if ($('#crmEdit')) $('#crmEdit').onclick = () => editModal(JSON.parse(JSON.stringify(c)));
    if ($('#crmDel'))
      $('#crmDel').onclick = async () => {
        if (!(await askYesNo(`حذف العميل ${c.name} نهائياً؟`))) return;
        try {
          await api('DELETE', `/api/crm/${c.id}`);
          toast('تم الحذف');
          location.hash = '#/crm';
        } catch (e) {
          toast(e.message, true);
        }
      };
  }
  /* أحداث viewCrm: #crmAct */
  function wireCrmAct(branches, c, d, query, today) {
    $('#crmAct').onclick = () => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      const brs = c.allBranches ? branches : c.branches;
      bg.innerHTML = `<form class="modal" style="max-width:560px;width:96%" novalidate><h3 style="margin-top:0">➕ تسجيل تواصل — ${esc(c.name)}</h3>
          <div class="grid2"><div class="field"><label>النوع</label><select class="in" name="kind">${d.actKinds.map((k) => `<option>${esc(k)}</option>`).join('')}</select></div>
            <div class="field"><label>التاريخ</label><input class="in" type="date" name="date" value="${today}"></div>
            ${d.full ? `<div class="field"><label>الفرع</label><select class="in" name="branch"><option value="">—</option>${brs.map((b) => `<option${b === state.user.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></div>` : ''}
            <div class="field"><label>موعد المتابعة القادمة</label><input class="in" type="date" name="next"></div></div>
          <div class="field"><label>ما تم *</label><textarea class="in" name="summary" rows="4" required></textarea></div>
          <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
      document.body.appendChild(bg);
      const f = $('form', bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      f.onsubmit = async (e) => {
        e.preventDefault();
        try {
          await api('POST', `/api/crm/${c.id}/activities`, {
            kind: f.kind.value,
            date: f.date.value,
            next: f.next.value,
            summary: f.summary.value,
            branch: f.branch ? f.branch.value : '',
          });
          bg.remove();
          toast('تم التسجيل');
          viewCrm(query);
        } catch (err) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
      f.summary.focus();
    };
  }
  /* جزء من viewCrm: const L = d.list;… */
  function viewCrmPart(branches, d, editModal, main, query, today) {
    const L = d.list;
    const shared = L.filter((c) => !c.allBranches && c.branches.length > 1).length,
      allB = L.filter((c) => c.allBranches).length;
    const due = L.filter((c) => c.nextFollow && c.nextFollow <= today).length;
    const tile = (n, l, ic, f) =>
      `<button type="button" class="card crm-tile${query.f === f ? ' on' : ''}" data-f="${f}"><span class="crm-ti">${ic}</span><b>${n}</b><small>${l}</small></button>`;
    renderViewCrm(L, allB, branches, d, due, main, query, shared, tile);
    const draw = () => {
      const q = normAr($('#crmQ').value),
        b = $('#crmB') ? $('#crmB').value : '',
        k = $('#crmK').value,
        fl = query.f || '';
      const rows = L.filter(
        (c) =>
          (!q ||
            normAr(
              [c.no, c.name, c.nameEn, c.cr, c.vat, c.phone, c.city, ...c.contacts.flatMap((x) => [x.name, x.phone])].join(' '),
            ).includes(q)) &&
          (!b || c.allBranches || c.branches.includes(b)) &&
          (!k || c.kind === k) &&
          (!fl ||
            (fl === 'active' && c.status === 'نشط') ||
            (fl === 'lead' && c.status === 'عميل محتمل') ||
            (fl === 'shared' && !c.allBranches && c.branches.length > 1) ||
            (fl === 'all' && c.allBranches) ||
            (fl === 'due' && c.nextFollow && c.nextFollow <= today)),
      );
      $('#crmList').innerHTML = rows.length
        ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الرقم</th><th>العميل</th><th>النوع</th><th>الفروع</th><th>جهة الاتصال</th><th>آخر تواصل</th><th>المتابعة</th><th>الحالة</th></tr></thead><tbody>
        ${rows
          .map(
            (
              c,
            ) => `<tr class="click" data-id="${c.id}"><td><bdi dir="ltr">${esc(c.no)}</bdi></td><td><b>${esc(c.name)}</b>${c.city ? `<div class="muted" style="font-size:12px">${esc(c.city)}</div>` : ''}</td><td>${esc(c.kind)}</td>
          <td class="crm-chips">${crmBranches(c)}</td><td>${c.contacts[0] ? `${esc(c.contacts[0].name)}<div class="muted" dir="ltr" style="font-size:12px">${esc(c.contacts[0].phone || '')}</div>` : '—'}</td>
          <td>${c.lastActivity ? esc(SF.fmtDate(c.lastActivity)) : '—'}</td><td>${c.nextFollow ? `<span class="${c.nextFollow < today ? 'crm-late' : ''}">${esc(SF.fmtDate(c.nextFollow))}</span>` : '—'}</td>
          <td><span class="chip ${CRM_ST[c.status] || ''}">${esc(c.status)}</span></td></tr>`,
          )
          .join('')}</tbody></table></div>`
        : `<div class="empty">${L.length ? 'لا يوجد عميل يطابق البحث' : 'لم تسجّل أي عميل بعد — ابدأ بـ «عميل جديد»'}</div>`;
      $$('#crmList tr[data-id]').forEach((tr) => {
        tr.onclick = () => {
          location.hash = `#/crm?id=${tr.dataset.id}`;
        };
      });
    };
    $('#crmQ').oninput = draw;
    if ($('#crmB')) $('#crmB').onchange = draw;
    $('#crmK').onchange = draw;
    $$('[data-f]', main).forEach((t) => {
      t.onclick = () => {
        query.f = query.f === t.dataset.f || !t.dataset.f ? '' : t.dataset.f;
        $$('[data-f]', main).forEach((x) => x.classList.toggle('on', x.dataset.f === (query.f || '')));
        draw();
      };
    });
    $('#crmNew').onclick = () => editModal();
    draw();
  }
  /* محتوى viewCrm (HTML) */
  function renderViewCrm(L, allB, branches, d, due, main, query, shared, tile) {
    main.innerHTML = `${head('CRM', d.full ? 'عملاء الشركة في كل الفروع' : `عملاء فرع ${esc(d.branch)} والعملاء المشتركون معه`, '<button class="btn primary" id="crmNew">➕ عميل جديد</button>')}
      <div class="crm-tiles">${tile(L.length, 'كل العملاء', '👥', '')}${tile(L.filter((c) => c.status === 'نشط').length, 'نشط', '✅', 'active')}${tile(L.filter((c) => c.status === 'عميل محتمل').length, 'عميل محتمل', '🎯', 'lead')}
        ${tile(shared, 'مشترك بين فروع', '🔗', 'shared')}${tile(allB, 'لكل فروع الشركة', '🌐', 'all')}${tile(due, 'متابعات مستحقة', '📅', 'due')}</div>
      <div class="card"><div class="filters"><input class="in" id="crmQ" placeholder="بحث بالاسم أو السجل أو الجوال أو جهة الاتصال..." value="${esc(query.q || '')}">
        ${d.full ? `<select class="in" id="crmB"><option value="">كل الفروع</option>${branches.map((b) => `<option${b === query.b ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select>` : ''}
        <select class="in" id="crmK"><option value="">كل الأنواع</option>${d.kinds.map((k) => `<option${k === query.k ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></div>
        <div id="crmList"></div></div>`;
  }

  return { viewCrm };
};
