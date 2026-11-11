'use strict';
/* صفحة «companies» (viewCompanies) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['companies'] = function (S) {
  const { $, $$, api, esc, icon, shell, state, switchCo, toast } = S;
  async function viewCompanies(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/companies');
    const d = await api('GET', '/api/group/companies');
    main.innerHTML = `<div class="ap-wrap co-wrap"><div class="ap-head"><div><h1>شركات المجموعة</h1><div class="muted">أهلاً ${esc(state.user.name.split(' ')[0])} — اختر الشركة للدخول إلى نظامها</div></div>
        ${d.manage ? '<div class="ap-tools"><a class="btn" href="#/companies?admin=1">⚙️ إعدادات المجموعة</a></div>' : ''}</div>
      <div class="co-tree" style="--n:${d.list.length}"><div class="co-root"><span class="co-root-ic">${icon('buildings')}</span><b dir="ltr">SADEN GROUP</b><small>${d.list.length} شركة</small></div>
        <div class="co-kids">${d.list
          .map(
            (
              c,
            ) => `<button type="button" class="co-node${c.id === d.current ? ' on' : ''}" data-co="${c.id}"${c.down ? ' disabled' : ''} title="${esc(c.name)}">
          <span class="co-circle"><img src="/api/group/logo/${c.id}?v=2" alt="" data-cobg></span><b>${esc(c.name)}</b>${c.nameEn ? `<small dir="ltr">${esc(c.nameEn)}</small>` : ''}
          <span class="co-stats">${c.down ? '<span class="chip bad">غير متاحة الآن</span>' : `<span>${icon('users')} ${c.employees || 0}</span><span>${icon('inbox')} ${c.pending || 0}</span>`}</span>
          ${c.id === d.current ? '<span class="chip co-cur">الحالية</span>' : ''}</button>`,
          )
          .join('')}</div></div>
      <div id="coAdmin"></div></div>`;
    $$('[data-co]', main).forEach((b) => {
      b.onclick = () => (b.dataset.co === d.current ? (location.hash = '#/apps') : switchCo(b.dataset.co));
    });
    if (d.manage && query.admin) groupAdmin($('#coAdmin', main), query);
  }

  /* إدارة المجموعة: أسماء الشركات وتفعيلها وشعارها وترويستها، وإضافة شركة، وأعضاء المجموعة وصلاحياتهم */
  async function groupAdmin(box, query) {
    const g = await api('GET', '/api/group/admin');
    const cos = g.companies;
    const memRow = (
      m,
    ) => `<tr data-m><td><input class="in" data-k="username" list="gmUsers" value="${esc(m.username || '')}" dir="ltr" placeholder="اسم المستخدم"></td>
      <td><select class="in" data-k="home">${cos.map((c) => `<option value="${c.id}"${c.id === m.home ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></td>
      <td><label class="row" style="gap:4px"><input type="checkbox" data-all${m.companies === 'all' ? ' checked' : ''}> كل الشركات</label>
        <div class="gm-cos"${m.companies === 'all' ? ' hidden' : ''}>${cos.map((c) => `<label><input type="checkbox" value="${c.id}"${Array.isArray(m.companies) && m.companies.includes(c.id) ? ' checked' : ''}> ${esc(c.name)}</label>`).join('')}</div></td>
      <td><label class="row" style="gap:4px"><input type="checkbox" data-k="manage"${m.manage ? ' checked' : ''}> يدير المجموعة</label></td><td><button type="button" class="btn sm ghost" data-rm>✖</button></td></tr>`;
    renderGroupAdmin(box, cos, g, memRow);
    const body = $('#gmBody', box);
    $('#gmAdd', box).onclick = () => body.insertAdjacentHTML('beforeend', memRow({ home: cos[0].id, companies: 'all' }));
    body.onclick = (e) => {
      const b = e.target.closest('[data-rm]');
      if (b) b.closest('tr').remove();
    };
    body.onchange = (e) => {
      if (e.target.matches('[data-all]')) e.target.closest('td').querySelector('.gm-cos').hidden = e.target.checked;
    };
    $$('[data-up]', box).forEach((inp) => {
      inp.onchange = async () => {
        const f = inp.files[0];
        if (!f) return;
        const id = inp.closest('[data-c]').dataset.c;
        try {
          const res = await fetch(`/api/group/admin/brand/${id}/${inp.dataset.up}`, {
            method: 'POST',
            headers: { 'content-type': 'application/octet-stream' },
            body: f,
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error);
          toast('تم رفع الصورة');
          groupAdmin(box, query);
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
    $('#coAdd', box).onclick = async () => {
      const name = $('#coNewName', box).value.trim();
      if (!name) return;
      try {
        await api('POST', '/api/group/admin/company', {
          name,
          nameEn: $('#coNewEn', box).value,
          country: $('#coNewCountry', box) ? $('#coNewCountry', box).value : 'SA',
        });
        toast('تمت إضافة الشركة');
        viewCompanies(query);
      } catch (err) {
        toast(err.message, true);
      }
    };
    $('#gaSave', box).onclick = async () => {
      const companies = $$('[data-c]', box).map((tr) => ({
        id: tr.dataset.c,
        name: $('[data-k=name]', tr).value,
        nameEn: $('[data-k=nameEn]', tr).value,
        active: $('[data-k=active]', tr) ? $('[data-k=active]', tr).checked : true,
      }));
      const members = $$('[data-m]', box).map((tr) => ({
        username: $('[data-k=username]', tr).value,
        home: $('[data-k=home]', tr).value,
        manage: $('[data-k=manage]', tr).checked,
        companies: $('[data-all]', tr).checked ? 'all' : $$('.gm-cos input:checked', tr).map((x) => x.value),
      }));
      try {
        await api('PUT', '/api/group/admin', { companies, members });
        toast('تم الحفظ');
        state.group = await api('GET', '/api/group/me');
        viewCompanies(query);
      } catch (err) {
        $('.merr', box).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* محتوى groupAdmin (HTML) */
  function renderGroupAdmin(box, cos, g, memRow) {
    box.innerHTML = `<div class="card co-admin"><h2>⚙️ إدارة المجموعة</h2>
      <h3>الشركات</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الشعار</th><th>الاسم</th><th>الاسم بالإنجليزية</th><th>مفعّلة</th><th>الشعار والترويسة (PNG)</th></tr></thead><tbody>
      ${cos
        .map(
          (
            c,
            i,
          ) => `<tr data-c="${c.id}"><td><img class="co-mini" src="/api/group/logo/${c.id}?v=2&t=${Date.now()}" alt=""></td><td><input class="in" data-k="name" value="${esc(c.name)}"></td><td><input class="in" data-k="nameEn" value="${esc(c.nameEn)}" dir="ltr"></td>
        <td>${i === 0 ? '<span class="chip">الشركة الأم</span>' : `<input type="checkbox" data-k="active"${c.active ? ' checked' : ''}>`}</td>
        <td class="row" style="gap:6px"><label class="btn sm">🖼 الشعار<input type="file" accept="image/png" data-up="logo" hidden></label><label class="btn sm">📄 الترويسة<input type="file" accept="image/png" data-up="header" hidden></label>
          ${c.logo ? '<span class="chip ok">شعار خاص</span>' : ''}${c.header ? '<span class="chip ok">ترويسة خاصة</span>' : ''}</td></tr>`,
        )
        .join('')}</tbody></table></div>
      <div class="row" style="gap:8px;margin:8px 0 18px"><input class="in" id="coNewName" placeholder="اسم شركة جديدة" style="max-width:280px"><input class="in" id="coNewEn" placeholder="English name" dir="ltr" style="max-width:220px">${(g.countries || []).length ? `<label class="row" style="gap:6px">الدولة<select class="in" id="coNewCountry" style="max-width:220px" title="عملة الشركة الأساسية عملة دولتها">${g.countries.map((k) => `<option value="${esc(k.code)}">${esc(k.name_ar)} — ${esc(k.currency)}</option>`).join('')}</select></label>` : ''}<button class="btn" id="coAdd">➕ إضافة شركة</button></div>
      <h3>أعضاء المجموعة</h3><div class="hint">العضو يرى شاشة شركات المجموعة ويدخل الشركات المحددة له بنفس اسم المستخدم وكلمة المرور (من شركته الأم). «يدير المجموعة» يضيف الشركات والأعضاء. غير الأعضاء يدخلون شركتهم مباشرة.</div>
      <datalist id="gmUsers">${g.users.map((u) => `<option value="${esc(u.username)}">${esc(u.name)}${u.title ? ` — ${esc(u.title)}` : ''}</option>`).join('')}</datalist>
      <div class="tbl-wrap"><table class="tbl gm-t"><thead><tr><th>اسم المستخدم</th><th>شركته الأم</th><th>الشركات المسموحة</th><th>الإدارة</th><th></th></tr></thead><tbody id="gmBody">${g.members.map(memRow).join('')}</tbody></table></div>
      <button class="btn sm" id="gmAdd" style="margin-top:8px">➕ عضو</button>
      <div class="merr"></div><div class="row" style="margin-top:14px;gap:8px"><button class="btn primary" id="gaSave">💾 حفظ</button><a class="btn ghost" href="#/companies">إغلاق</a></div></div>`;
  }

  return { viewCompanies };
};
