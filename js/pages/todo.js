'use strict';
/* صفحة «todo» (viewTodo) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['todo'] = function (S) {
  const { $, SF, TABS, TD_PRI, TD_REM, api, askYesNo, esc, head, icon, refreshStats, shell, tdRemSel, toast, today } = S;
  async function viewTodo(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (list، tab) */
    const st = {};
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/todo');
    st.list = await api('GET', '/api/todos');
    const today = new Date().toISOString().slice(0, 10);
    const TABS = [
      ['open', 'الحالية'],
      ['today', 'اليوم'],
      ['late', 'المتأخرة'],
      ['upcoming', 'القادمة'],
      ['done', 'المنجزة'],
      ['all', 'الكل'],
    ];
    st.tab = TABS.some(([k]) => k === query.t) ? query.t : 'open';
    const pass = (t) =>
      ({
        open: !t.done,
        today: !t.done && t.due === today,
        late: !t.done && t.due && t.due < today,
        upcoming: !t.done && t.due > today,
        done: t.done,
        all: true,
      })[st.tab];
    const order = (a, b) =>
      a.done - b.done ||
      (b.priority === 'عاجل') - (a.priority === 'عاجل') ||
      (b.priority === 'مهم') - (a.priority === 'مهم') ||
      String(a.due || '9999').localeCompare(String(b.due || '9999')) ||
      String(a.time || '99').localeCompare(String(b.time || '99')) ||
      String(b.createdAt).localeCompare(String(a.createdAt));
    const row = (
      t,
    ) => `<div class="td-row${t.done ? ' done' : ''}" data-id="${t.id}"><label class="td-ck"><input type="checkbox"${t.done ? ' checked' : ''} data-tg></label>
      <div class="td-body"><div class="td-t">${esc(t.title)}</div>${t.notes ? `<div class="td-n">${esc(t.notes)}</div>` : ''}
        <div class="td-meta">${t.priority !== 'عادي' ? `<span class="chip ${TD_PRI[t.priority]}">${esc(t.priority)}</span>` : ''}${t.due ? `<span class="td-due${!t.done && t.due < today ? ' late' : t.due === today ? ' today' : ''}">📅 ${t.due === today ? 'اليوم' : esc(SF.fmtDate(t.due))}${t.time ? ` <bdi dir="ltr">${esc(t.time)}</bdi>` : ''}</span>` : ''}${t.remind !== '' && t.remind != null && !t.done ? `<span class="td-rem${t.reminded ? ' sent' : ''}" title="${t.reminded ? 'تم التذكير' : 'تذكير'}">🔔 ${esc((TD_REM.find(([k]) => k === String(t.remind)) || [, ''])[1])}</span>` : ''}</div></div>
      <button class="btn sm ghost" data-ed title="تعديل">${icon('pencil')}</button><button class="btn sm ghost" data-del title="حذف">${icon('trash')}</button></div>`;
    const draw = () => {
      const rows = st.list.filter(pass).sort(order);
      $('#tdTabs').innerHTML = TABS.map(
        ([k, l]) =>
          `<a class="gtab${k === st.tab ? ' on' : ''}" href="#" data-t="${k}">${l} <small>${st.list.filter((t) => ({ open: !t.done, today: !t.done && t.due === today, late: !t.done && t.due && t.due < today, upcoming: !t.done && t.due > today, done: t.done, all: true })[k]).length}</small></a>`,
      ).join('');
      $('#tdList').innerHTML = rows.length
        ? rows.map(row).join('')
        : `<div class="empty">${st.tab === 'done' ? 'لا توجد مهام منجزة' : 'لا توجد مهام هنا — اكتب مهمتك في الأعلى'}</div>`;
    };
    renderViewTodo(main);
    const f = $('#tdAdd');
    viewTodoPart(f, today);
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!f.title.value.trim()) return f.title.focus();
      try {
        const t = await api('POST', '/api/todos', {
          title: f.title.value,
          due: f.due.value,
          time: f.time.value,
          remind: f.remind.value,
          priority: f.priority.value,
        });
        st.list.push(t);
        f.title.value = '';
        f.due.value = '';
        f.time.value = '';
        f.remind.value = '';
        f.priority.value = 'عادي';
        draw();
        refreshStats();
        f.title.focus();
      } catch (err) {
        toast(err.message, true);
      }
    };
    wireTodo(draw, st);
    draw();
    f.title.focus();
  }
  /* أحداث viewTodo: #tdTabs، #tdList */
  function wireTodo(draw, st) {
    $('#tdTabs').onclick = (e) => {
      const a = e.target.closest('[data-t]');
      if (!a) return;
      e.preventDefault();
      st.tab = a.dataset.t;
      draw();
    };
    $('#tdList').onclick = async (e) => {
      const r = e.target.closest('[data-id]');
      if (!r) return;
      const t = st.list.find((x) => x.id === r.dataset.id);
      const put = async (b) => {
        Object.assign(t, await api('PUT', `/api/todos/${t.id}`, b));
        draw();
        refreshStats();
      };
      try {
        if (e.target.closest('[data-tg]')) await put({ done: !t.done });
        else if (e.target.closest('[data-del]')) {
          if (await askYesNo(`حذف المهمة «${t.title}»؟`)) {
            await api('DELETE', `/api/todos/${t.id}`);
            st.list = st.list.filter((x) => x !== t);
            draw();
            refreshStats();
          }
        } else if (e.target.closest('[data-ed]')) {
          const bg = document.createElement('div');
          bg.className = 'modal-bg';
          bg.innerHTML = `<form class="modal" style="max-width:520px;width:96%" novalidate><h3 style="margin-top:0">✏️ تعديل المهمة</h3>
            <div class="field"><label>المهمة</label><input class="in" name="title" value="${esc(t.title)}" maxlength="300"></div>
            <div class="grid2"><div class="field"><label>التاريخ</label><input class="in" type="date" name="due" value="${esc(t.due || '')}"></div>
              <div class="field"><label>الوقت</label><input class="in" type="time" name="time" value="${esc(t.time || '')}"></div>
              <div class="field"><label>التذكير</label>${tdRemSel(t.remind)}</div>
              <div class="field"><label>الأولوية</label><select class="in" name="priority">${Object.keys(TD_PRI)
                .map((p) => `<option${p === t.priority ? ' selected' : ''}>${p}</option>`)
                .join('')}</select></div></div>
            <div class="field"><label>ملاحظات</label><textarea class="in" name="notes" rows="3">${esc(t.notes || '')}</textarea></div>
            <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
          document.body.appendChild(bg);
          const ef = $('form', bg);
          $('[data-x]', bg).onclick = () => bg.remove();
          ef.onsubmit = async (ev) => {
            ev.preventDefault();
            try {
              await put({
                title: ef.title.value,
                due: ef.due.value,
                time: ef.time.value,
                remind: ef.remind.value,
                priority: ef.priority.value,
                notes: ef.notes.value,
              });
              bg.remove();
            } catch (err) {
              $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
            }
          };
        }
      } catch (err) {
        toast(err.message, true);
      }
    };
  }
  /* جزء من viewTodo: f.remind.onchange = () => {… */
  function viewTodoPart(f, today) {
    f.remind.onchange = () => {
      if (f.remind.value !== '' && !f.due.value) f.due.value = today;
    };
    f.time.onchange = () => {
      if (f.time.value && !f.due.value) f.due.value = today;
    };
  }
  /* محتوى viewTodo (HTML) */
  function renderViewTodo(main) {
    main.innerHTML = `${head('TO-DO', 'مهامك الشخصية — لا يراها أحد غيرك')}
      <form class="card td-add" id="tdAdd" novalidate><input class="in" name="title" placeholder="اكتب مهمة جديدة واضغط Enter..." maxlength="300" autocomplete="off">
        <input class="in" type="date" name="due" title="التاريخ"><input class="in" type="time" name="time" title="الوقت">${tdRemSel('', 'title="التذكير"')}<select class="in" name="priority" title="الأولوية"><option>عادي</option><option>مهم</option><option>عاجل</option></select>
        <button class="btn primary">➕ إضافة</button></form>
      <div class="gtabs" id="tdTabs" style="overflow-y:hidden"></div><div class="card" id="tdList"></div>`;
  }

  return { viewTodo };
};
