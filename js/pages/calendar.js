'use strict';
/* صفحة «calendar» (viewCalendar) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['calendar'] = function (S) {
  const { $, $$, CAL_CLS, DAYS, SF, api, askYesNo, esc, head, shell, state, toast, today } = S;
  async function viewCalendar(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/calendar');
    const m = /^\d{4}-\d{2}$/.test(query.m || '') ? query.m : new Date().toISOString().slice(0, 7);
    const d = await api('GET', `/api/calendar?month=${m}`);
    const branches = state.config.branches || [];
    const today = new Date().toISOString().slice(0, 10);
    const [Y, M] = m.split('-').map(Number);
    const dim = new Date(Date.UTC(Y, M, 0)).getUTCDate(),
      first = new Date(Date.UTC(Y, M - 1, 1)).getUTCDay();
    const shift = (n) => {
      const x = new Date(Date.UTC(Y, M - 1 + n, 1));
      return x.toISOString().slice(0, 7);
    };
    const monthName = new Date(Date.UTC(Y, M - 1, 1)).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const on = (ds, a, b) => ds >= a && ds <= (b || a);
    const showLeaves = d.leaves.length > 0;
    const dayItems = (ds) => ({
      events: d.events.filter((v) => on(ds, v.from, v.to)),
      hol: d.holidays.filter((h) => on(ds, h.from, h.to)),
      todos: d.todos.filter((t) => t.due === ds),
      leaves: d.leaves.filter((l) => on(ds, l.from, l.to)),
    });
    const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<div class="cal-d empty"></div>';
    for (let n = 1; n <= dim; n++) {
      const ds = `${m}-${String(n).padStart(2, '0')}`,
        it = dayItems(ds);
      const wk = d.weekend.includes(new Date(`${ds}T00:00:00Z`).getUTCDay()),
        off = it.hol.length || it.events.some((v) => v.off);
      const chips = [
        ...it.hol.map((h) => `<span class="cal-ev off">🏖 ${esc(h.name || 'عطلة رسمية')}</span>`),
        ...it.events.map(
          (v) =>
            `<span class="cal-ev ${CAL_CLS[v.kind] || 'oth'}">${v.time ? `<bdi dir="ltr">${esc(v.time)}</bdi> ` : ''}${esc(v.title)}</span>`,
        ),
        ...it.todos.map((t) => `<span class="cal-ev todo${t.done ? ' done' : ''}">☑ ${esc(t.title)}</span>`),
      ];
      cells += `<button type="button" class="cal-d${wk ? ' wk' : ''}${off ? ' offd' : ''}${ds === today ? ' today' : ''}" data-day="${ds}"><span class="cal-n">${n}</span>
        <span class="cal-evs">${chips.slice(0, 3).join('')}${chips.length > 3 ? `<span class="cal-more">+${chips.length - 3}</span>` : ''}</span>${it.leaves.length ? `<span class="cal-lv" title="موظفون في إجازة">🧳 ${it.leaves.length}</span>` : ''}</button>`;
    }
    const upcoming = d.events.filter((v) => (v.to || v.from) >= today).sort((a, b) => a.from.localeCompare(b.from));
    main.innerHTML = `${head('Calendar', 'الأحداث المهمة والإجازات والعطل — لا يحسب النظام الإجازة / العطلة المحددة هنا غياباً على الموظفين', d.mgr ? '<button class="btn primary" id="calNew">➕ حدث جديد</button>' : '')}
      <div class="cal-bar card"><div class="row"><a class="btn sm ghost" href="#/calendar?m=${shift(-1)}">→ السابق</a><h2 class="cal-title">${esc(monthName)}</h2><a class="btn sm ghost" href="#/calendar?m=${shift(1)}">التالي ←</a>
        ${m !== today.slice(0, 7) ? '<a class="btn sm" href="#/calendar">اليوم</a>' : ''}</div>
        <div class="cal-legend"><span class="cal-ev off">إجازة / عطلة</span><span class="cal-ev meet">اجتماع</span><span class="cal-ev train">تدريب</span><span class="cal-ev occ">مناسبة</span><span class="cal-ev dead">موعد نهائي</span><span class="cal-ev todo">مهامي (TO-DO)</span>${showLeaves ? '<span class="cal-lv">🧳 موظفون في إجازة</span>' : ''}</div></div>
      <div class="cal-grid card">${DAYS.map((x) => `<div class="cal-h">${x}</div>`).join('')}${cells}</div>
      <div class="card"><h3>الأحداث القادمة هذا الشهر</h3>${
        upcoming.length
          ? upcoming
              .map(
                (v) => `<div class="cal-up"><span class="cal-ev ${CAL_CLS[v.kind] || 'oth'}">${esc(v.kind)}</span><b>${esc(v.title)}</b>
        <span class="muted">${esc(SF.fmtDate(v.from))}${v.to !== v.from ? ` — ${esc(SF.fmtDate(v.to))}` : ''}${v.time ? ` · <bdi dir="ltr">${esc(v.time)}</bdi>` : ''}${v.place ? ` · ${esc(v.place)}` : ''} · ${v.allBranches ? 'كل الشركة' : esc(v.branches.join('، '))}</span></div>`,
              )
              .join('')
          : '<div class="empty">لا توجد أحداث قادمة</div>'
      }</div>`;
    /* نافذة الحدث: إضافة / تعديل */
    viewCalendarPart(branches, d, dayItems, main, query, today);
  }
  /* جزء من viewCalendar: const evModal = (v, day) => {… */
  function viewCalendarPart(branches, d, dayItems, main, query, today) {
    const evModal = (v, day) => {
      v = v || { kind: 'اجتماع', from: day || today, to: day || today, allBranches: true, branches: [] };
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<form class="modal" style="max-width:640px;width:96%" novalidate><h3 style="margin-top:0">${v.id ? '✏️ تعديل الحدث' : '➕ حدث جديد'}</h3>
        <div class="field"><label>العنوان *</label><input class="in" name="title" value="${esc(v.title || '')}" maxlength="150"></div>
        <div class="grid2"><div class="field"><label>النوع</label><select class="in" name="kind">${d.kinds.map((k) => `<option${k === v.kind ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></div>
          <div class="field"><label>الوقت</label><input class="in" type="time" name="time" value="${esc(v.time || '')}"></div>
          <div class="field"><label>من</label><input class="in" type="date" name="from" value="${esc(v.from)}"></div><div class="field"><label>إلى</label><input class="in" type="date" name="to" value="${esc(v.to || v.from)}"></div></div>
        <div class="hint cal-offhint" ${v.kind === 'إجازة / عطلة' ? '' : 'hidden'}>🏖 الأيام من «من» إلى «إلى» يعتبرها النظام راحة للفروع المحددة: لا يحسبها غياباً في الدوام والحضور</div>
        <div class="field"><label>المكان</label><input class="in" name="place" value="${esc(v.place || '')}"></div>
        <label class="crm-allck"><input type="checkbox" name="allBranches"${v.allBranches ? ' checked' : ''}> 🌐 كل الشركة</label>
        <div class="crm-brs" id="calBrs"${v.allBranches ? ' hidden' : ''}>${branches.map((b) => `<label><input type="checkbox" value="${esc(b)}"${(v.branches || []).includes(b) ? ' checked' : ''}> ${esc(b)}</label>`).join('')}</div>
        <div class="field" style="margin-top:10px"><label>ملاحظات</label><textarea class="in" name="notes" rows="2">${esc(v.notes || '')}</textarea></div>
        <label class="row" style="gap:6px;margin-top:6px"><input type="checkbox" name="notify" checked> إشعار المعنيين بالحدث</label>
        <div class="merr"></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">💾 حفظ</button>${v.id ? '<button type="button" class="btn ghost" data-delev>🗑 حذف</button>' : ''}<button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
      document.body.appendChild(bg);
      const f = $('form', bg);
      $('[data-x]', bg).onclick = () => bg.remove();
      f.kind.onchange = () => {
        $('.cal-offhint', bg).hidden = f.kind.value !== 'إجازة / عطلة';
      };
      f.allBranches.onchange = () => {
        $('#calBrs', bg).hidden = f.allBranches.checked;
      };
      f.from.onchange = () => {
        if (!f.to.value || f.to.value < f.from.value) f.to.value = f.from.value;
      };
      if ($('[data-delev]', bg))
        $('[data-delev]', bg).onclick = async () => {
          if (!(await askYesNo(`حذف الحدث «${v.title}»؟`))) return;
          try {
            await api('DELETE', `/api/calendar/${v.id}`);
            bg.remove();
            viewCalendar(query);
          } catch (e) {
            toast(e.message, true);
          }
        };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const b = {
          title: f.title.value,
          kind: f.kind.value,
          time: f.time.value,
          from: f.from.value,
          to: f.to.value,
          place: f.place.value,
          notes: f.notes.value,
          allBranches: f.allBranches.checked,
          branches: $$('#calBrs input:checked', bg).map((x) => x.value),
          notify: f.notify.checked,
        };
        try {
          await api(v.id ? 'PUT' : 'POST', v.id ? `/api/calendar/${v.id}` : '/api/calendar', b);
          bg.remove();
          toast('تم الحفظ');
          viewCalendar(query);
        } catch (err) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
      f.title.focus();
    };
    /* تفاصيل اليوم */
    wireCalendar(d, dayItems, evModal, main);
  }
  /* أحداث viewCalendar: #calNew */
  function wireCalendar(d, dayItems, evModal, main) {
    $$('[data-day]', main).forEach((c) => {
      c.onclick = () => {
        const ds = c.dataset.day,
          it = dayItems(ds);
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = `<div class="modal" style="max-width:620px;width:96%"><h3 style="margin-top:0">📅 ${esc(SF.fmtDate(ds))}</h3>
          ${it.hol.map((h) => `<div class="cal-up"><span class="cal-ev off">عطلة رسمية</span><b>${esc(h.name || 'عطلة')}</b><span class="muted">من الإعدادات ← التقويم</span></div>`).join('')}
          ${it.events
            .map(
              (
                v,
              ) => `<div class="cal-up"><span class="cal-ev ${CAL_CLS[v.kind] || 'oth'}">${esc(v.kind)}</span><b>${esc(v.title)}</b><span class="muted">${v.time ? `<bdi dir="ltr">${esc(v.time)}</bdi> · ` : ''}${v.place ? `${esc(v.place)} · ` : ''}${v.allBranches ? 'كل الشركة' : esc(v.branches.join('، '))}${v.off ? ' · لا يحسبه النظام غياباً' : ''}</span>
            ${v.notes ? `<div class="td-n">${esc(v.notes)}</div>` : ''}${d.mgr ? `<button class="btn sm ghost" data-ev="${v.id}">✏️ تعديل</button>` : ''}</div>`,
            )
            .join('')}
          ${it.todos.map((t) => `<div class="cal-up"><span class="cal-ev todo">TO-DO</span><b${t.done ? ' style="text-decoration:line-through"' : ''}>${esc(t.title)}</b></div>`).join('')}
          ${it.leaves.length ? `<h4 class="b-sec">🧳 في إجازة (${it.leaves.length})</h4><div class="cal-lvs">${it.leaves.map((l) => `<div><b>${esc(l.name)}</b> <small class="muted">${esc(l.type)} · ${esc(l.branch)} · ${esc(SF.fmtDate(l.from))} — ${esc(SF.fmtDate(l.to))}</small></div>`).join('')}</div>` : ''}
          ${!it.hol.length && !it.events.length && !it.todos.length && !it.leaves.length ? '<div class="empty">لا يوجد شيء في هذا اليوم</div>' : ''}
          <div class="row" style="margin-top:12px;gap:8px">${d.mgr ? '<button class="btn primary" data-add>➕ حدث في هذا اليوم</button>' : ''}<a class="btn" href="#/todo">☑ TO-DO</a><button class="btn ghost" data-x>إغلاق</button></div></div>`;
        document.body.appendChild(bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        bg.onclick = (e) => {
          if (e.target === bg) bg.remove();
        };
        if ($('[data-add]', bg))
          $('[data-add]', bg).onclick = () => {
            bg.remove();
            evModal(null, ds);
          };
        $$('[data-ev]', bg).forEach((b) => {
          b.onclick = () => {
            bg.remove();
            evModal(d.events.find((v) => v.id === b.dataset.ev));
          };
        });
      };
    });
    if ($('#calNew')) $('#calNew').onclick = () => evModal();
  }

  return { viewCalendar };
};
