'use strict';
/* صفحة «tasks» (viewTasks، viewTask) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['tasks'] = function (S) {
  const { $, $$, TK_ST, api, dt, esc, head, refreshStats, setTopBadges, shell, state, tkBar, tkDue, tkPrio, tkStatus, toast } = S;
  async function viewTasks(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (mode) */
    const st = {};
    const view = ['assigned', 'all'].includes(query.view) ? query.view : 'mine';
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/tasks');
    const d = await api('GET', `/api/tasks?view=${view}`);
    st.mode = 'list';
    try {
      st.mode = localStorage.getItem('tasks:mode') || 'list';
    } catch {
      /* تجاهل */
    }
    return viewTasksPart4(d, main, st, view);
  }
  /* جزء من viewTasks: const L = d.list;… */
  function viewTasksPart4(d, main, st, view) {
    const L = d.list;
    viewTasksPart3(L, d, main, st.mode, view);
    const shown = () => {
      const q = $('#tkQ').value.trim(),
        s = $('#tkS').value,
        pr = $('#tkP').value,
        u = $('#tkU').value;
      return L.filter(
        (k) =>
          (!q || `${k.serial} ${k.title} ${k.assigneeName} ${k.byName} ${k.reqSerial}`.includes(q)) &&
          (!s ||
            (s === 'open'
              ? st.mode === 'board'
                ? k.status !== 'cancelled'
                : ['new', 'doing', 'review'].includes(k.status)
              : s === 'late'
                ? k.late
                : k.status === s)) &&
          (!pr || k.priority === pr) &&
          (!u || (view === 'mine' ? k.byName : k.assigneeName) === u),
      );
    };
    const draw = () => {
      const list = shown();
      if (st.mode === 'board') {
        const cols = ['new', 'doing', 'review', 'done'];
        $('#tkOut').innerHTML = `<div class="tk-board">${cols
          .map((c) => {
            const cs = list.filter((k) => k.status === c);
            return `<div class="tk-col"><div class="tk-col-h st-${c}">${TK_ST[c]} <small>${cs.length}</small></div>
          ${
            cs
              .map(
                (
                  k,
                ) => `<a class="tk-card${k.late ? ' late' : ''}" href="#/tasks/${k.id}"><div class="tk-card-t"><b>${esc(k.title)}</b>${tkPrio(k)}</div>
            <small class="muted">${esc(view === 'mine' ? `من: ${k.byName}` : `إلى: ${k.assigneeName}`)}</small>
            <div class="tk-card-f"><span>📅 ${tkDue(k)}</span><span class="tk-prog">${tkBar(k)}</span></div>${k.commentsCount ? `<small class="muted">💬 ${k.commentsCount}</small>` : ''}</a>`,
              )
              .join('') || '<div class="muted tk-empty">لا توجد مهام</div>'
          }</div>`;
          })
          .join('')}</div>`;
      } else {
        $('#tkOut').innerHTML =
          `<div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>رقم المهمة</th><th>المهمة</th><th>${view === 'mine' ? 'من' : 'الموظف'}</th><th>الأولوية</th><th>التسليم</th><th>المرحلة</th><th>الإنجاز</th></tr></thead><tbody>
          ${
            list
              .map(
                (
                  k,
                ) => `<tr class="click${k.late ? ' tk-row-late' : ''}" data-go="#/tasks/${k.id}"><td><bdi dir="ltr">${esc(k.serial)}</bdi></td><td><b>${esc(k.title)}</b>${k.reqSerial ? ` <span class="mr-req">🔗 ${esc(k.reqSerial)}</span>` : ''}${k.commentsCount ? ` <small class="muted">💬 ${k.commentsCount}</small>` : ''}${k.att ? ' <small class="muted">📎</small>' : ''}</td>
            <td>${esc(view === 'mine' ? k.byName : k.assigneeName)}${view !== 'mine' && k.assigneeBranch ? `<div class="muted" style="font-size:12px">${esc(k.assigneeBranch)}</div>` : ''}</td><td>${tkPrio(k)}</td><td>${tkDue(k)}</td><td>${tkStatus(k)}</td><td><span class="tk-prog">${tkBar(k)}</span></td></tr>`,
              )
              .join('') || '<tr><td colspan="7" class="empty">لا توجد مهام</td></tr>'
          }</tbody></table></div></div>`;
        $$('[data-go]', main).forEach((tr) => {
          tr.onclick = () => {
            location.hash = tr.dataset.go;
          };
        });
      }
    };
    viewTasksPart2(draw, main);
    $$('[data-mode]', main).forEach((b) => {
      b.onclick = () => {
        st.mode = b.dataset.mode;
        try {
          localStorage.setItem('tasks:mode', st.mode);
        } catch {
          /* تجاهل */
        }
        $$('[data-mode]', main).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      };
    });
    viewTasksPart();
    draw();
  }
  /* جزء من viewTasks: const cnt = (f) => L.filter(f).length;… */
  function viewTasksPart3(L, d, main, mode, view) {
    const cnt = (f) => L.filter(f).length;
    const stats =
      view === 'mine'
        ? [
            ['مفتوحة', cnt((k) => ['new', 'doing'].includes(k.status)), '', 'open'],
            ['متأخرة', cnt((k) => k.late), 'bad', 'late'],
            ['بانتظار اعتماد المدير', cnt((k) => k.status === 'review'), 'warn', 'review'],
            ['مكتملة', cnt((k) => k.status === 'done'), 'ok', 'done'],
          ]
        : [
            ['مفتوحة', cnt((k) => ['new', 'doing'].includes(k.status)), '', 'open'],
            ['متأخرة', cnt((k) => k.late), 'bad', 'late'],
            ['بانتظار اعتمادي', cnt((k) => k.status === 'review'), 'warn', 'review'],
            ['مكتملة', cnt((k) => k.status === 'done'), 'ok', 'done'],
          ];
    const people = [...new Set(L.map((k) => (view === 'mine' ? k.byName : k.assigneeName)))].sort();
    renderViewTasks(d, main, mode, people, stats, view);
  }
  /* جزء من viewTasks: ['#tkQ', '#tkS', '#tkP', '#tkU'].forEach((s) =>… */
  function viewTasksPart2(draw, main) {
    ['#tkQ', '#tkS', '#tkP', '#tkU'].forEach((s) =>
      ['input', 'change'].forEach((ev) =>
        $(s).addEventListener(ev, () => {
          markF();
          draw();
        }),
      ),
    );
    /* كروت المؤشرات فلتر: الضغط يعرض مهام المرحلة (والضغط مرة أخرى يرجع للمفتوحة) */
    const markF = () =>
      $$('[data-tkf]', main).forEach((b) => b.classList.toggle('on', b.dataset.tkf === $('#tkS').value && b.dataset.tkf !== 'open'));
    $$('[data-tkf]', main).forEach((b) => {
      b.onclick = () => {
        $('#tkS').value = $('#tkS').value === b.dataset.tkf ? 'open' : b.dataset.tkf;
        markF();
        draw();
      };
    });
  }
  /* محتوى viewTasks (HTML) */
  function renderViewTasks(d, main, mode, people, stats, view) {
    main.innerHTML = `${head('إدارة المهام', view === 'mine' ? 'المهام الموجهة إليك' : view === 'assigned' ? 'المهام التي وجّهتها للموظفين ومتابعة تنفيذها' : 'كل المهام على النظام', d.canAssign ? '<button class="btn primary" id="tkNew">➕ مهمة جديدة</button>' : '')}
      <div class="tabs"><a href="#/tasks" class="${view === 'mine' ? 'on' : ''}">📋 مهامي</a>${d.canAssign ? `<a href="#/tasks?view=assigned" class="${view === 'assigned' ? 'on' : ''}">📤 مهام وجهتها</a>` : ''}${d.isAdm ? `<a href="#/tasks?view=all" class="${view === 'all' ? 'on' : ''}">🗂 كل المهام</a>` : ''}</div>
      <div class="tk-stats">${stats.map(([l, n, c, f]) => `<button type="button" class="card tk-stat ${c}" data-tkf="${f}" title="عرض المهام: ${l}"><b>${n}</b><span>${l}</span></button>`).join('')}</div>
      <div class="card tk-tools"><input class="in" id="tkQ" placeholder="بحث: رقم المهمة، العنوان، الموظف...">
        <select class="in" id="tkS"><option value="open"${view === 'all' ? '' : ' selected'}>المفتوحة</option><option value=""${view === 'all' ? ' selected' : ''}>كل المراحل</option>${Object.entries(
          TK_ST,
        )
          .map(([k, l]) => `<option value="${k}">${l}</option>`)
          .join('')}<option value="late">المتأخرة</option></select>
        <select class="in" id="tkP"><option value="">كل الأولويات</option><option>عاجلة</option><option>مهمة</option><option>عادية</option></select>
        <select class="in" id="tkU"><option value="">${view === 'mine' ? 'كل المديرين' : 'كل الموظفين'}</option>${people.map((x) => `<option>${esc(x)}</option>`).join('')}</select>
        <span class="tk-mode"><button class="btn sm${mode === 'list' ? ' on' : ''}" data-mode="list">☰ قائمة</button><button class="btn sm${mode === 'board' ? ' on' : ''}" data-mode="board">▦ لوحة</button></span></div>
      <div id="tkOut"></div>`;
  }
  /* جزء من viewTasks: if ($('#tkNew'))… */
  function viewTasksPart() {
    if ($('#tkNew'))
      $('#tkNew').onclick = () =>
        taskModal(null, (made) => {
          location.hash = made.length === 1 ? `#/tasks/${made[0].id}` : '#/tasks?view=assigned';
          if (made.length > 1) viewTasks({ view: 'assigned' });
        });
  }

  /* نافذة مهمة جديدة / تعديل مهمة */
  async function taskModal(k, done) {
    const users = await api('GET', '/api/tasks/users');
    const branches = [...new Set(users.map((u) => u.branch).filter(Boolean))].sort();
    const sel = new Set(k ? [k.assignee] : []);
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    renderTaskModal(bg, branches, k);
    document.body.appendChild(bg);
    const f = $('form', bg);
    const chips = () => {
      $('.tk-chips', bg).innerHTML =
        [...sel]
          .map((id) => {
            const u = users.find((x) => x.id === id);
            return u ? `<span class="to-chip">${esc(u.name)}<button type="button" data-rm="${id}">×</button></span>` : '';
          })
          .join('') || '<span class="muted">لم تختر أحداً</span>';
      $$('[data-rm]', bg).forEach((b) => {
        b.onclick = () => {
          sel.delete(b.dataset.rm);
          chips();
          ulist();
        };
      });
    };
    const ulist = () => {
      const q = $('#tkUq', bg).value.trim();
      $('.tk-ulist', bg).innerHTML = q
        ? users
            .filter((u) => `${u.name} ${u.title} ${u.branch} ${u.roleName}`.includes(q))
            .slice(0, 40)
            .map(
              (u) =>
                `<label class="check"><input type="${k ? 'radio' : 'checkbox'}" name="tku" value="${u.id}"${sel.has(u.id) ? ' checked' : ''}> ${esc(u.name)} <small class="muted">${esc([u.title, u.branch].filter(Boolean).join(' — '))}</small></label>`,
            )
            .join('') || '<div class="muted">لا نتائج</div>'
        : '';
      $$('.tk-ulist input', bg).forEach((c) => {
        c.onchange = () => {
          if (k) sel.clear();
          if (c.checked) sel.add(c.value);
          else sel.delete(c.value);
          chips();
        };
      });
    };
    return wireTaskModal(bg, chips, done, f, k, sel, ulist, users);
  }
  /* أحداث taskModal */
  function wireTaskModal(bg, chips, done, f, k, sel, ulist, users) {
    $('#tkUq', bg).oninput = ulist;
    if ($('#tkBr', bg))
      $('#tkBr', bg).onchange = () => {
        users.filter((u) => u.branch === $('#tkBr', bg).value).forEach((u) => sel.add(u.id));
        $('#tkBr', bg).value = '';
        chips();
        ulist();
      };
    chips();
    $('[data-x]', bg).onclick = () => bg.remove();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const err = (m) => {
        $('.tk-merr', bg).innerHTML = `<div class="err">${esc(m)}</div>`;
      };
      if (!f.title.value.trim()) return err('اكتب عنوان المهمة');
      if (!sel.size) return err('اختر الموظف المكلف');
      const body = { title: f.title.value, desc: f.desc.value, priority: f.priority.value, due: f.due.value, reqSerial: f.reqSerial.value };
      const btn = $('button.primary', f);
      btn.disabled = true;
      try {
        if (k) {
          const x = await api('PUT', `/api/tasks/${k.id}`, { ...body, assignee: [...sel][0] });
          bg.remove();
          toast('تم حفظ التعديل');
          done(x);
          return;
        }
        const made = await api('POST', '/api/tasks', { ...body, assignees: [...sel] });
        for (const file of [...(f.files ? f.files.files : [])]) {
          for (const m of made) {
            const res = await fetch(`/api/tasks/${m.id}/attachments?name=${encodeURIComponent(file.name)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: file,
            });
            if (!res.ok) {
              const j = await res.json().catch(() => ({}));
              toast(`${file.name}: ${j.error || 'تعذر رفع المرفق'}`, true);
              break;
            }
          }
        }
        bg.remove();
        toast(made.length > 1 ? `تم توجيه المهمة إلى ${made.length} موظف` : 'تم توجيه المهمة');
        done(made);
      } catch (x) {
        err(x.message);
        btn.disabled = false;
      }
    };
  }
  /* محتوى taskModal (HTML) */
  function renderTaskModal(bg, branches, k) {
    bg.innerHTML = `<form class="modal" style="max-width:720px;width:96%" novalidate><h3 style="margin-top:0">${k ? `✏️ تعديل المهمة <bdi dir="ltr">${esc(k.serial)}</bdi>` : '➕ مهمة جديدة'}</h3>
      <div class="field"><label>عنوان المهمة *</label><input class="in" name="title" maxlength="200" value="${esc(k ? k.title : '')}"></div>
      <div class="field"><label>الوصف والتفاصيل</label><textarea class="in" name="desc" rows="4" maxlength="10000">${esc(k ? k.desc : '')}</textarea></div>
      <div class="field"><label>${k ? 'الموظف المكلف (اختيار موظف آخر يعيد توجيهها إليه)' : 'الموظفون المكلفون * (مهمة مستقلة لكل موظف)'}</label>
        <div class="tk-chips"></div>
        <div class="row" style="gap:8px;margin-top:6px"><input class="in" id="tkUq" placeholder="ابحث بالاسم أو المسمى أو الفرع..." style="flex:1">${k ? '' : `<select class="in" id="tkBr" style="max-width:200px"><option value="">+ كل موظفي فرع</option>${branches.map((b) => `<option>${esc(b)}</option>`).join('')}</select>`}</div>
        <div class="tk-ulist"></div></div>
      <div class="grid2">
        <div class="field"><label>الأولوية</label><select class="in" name="priority">${['عادية', 'مهمة', 'عاجلة'].map((x) => `<option${k && k.priority === x ? ' selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>تاريخ التسليم</label><input class="in" type="date" name="due" value="${esc(k ? k.due : '')}"></div>
        <div class="field"><label>🔗 طلب مرتبط (اختياري)</label><input class="in" name="reqSerial" dir="ltr" placeholder="SADEN-2026-0104" value="${esc(k ? k.reqSerial : '')}"></div>
        ${k ? '' : '<div class="field"><label>مرفقات (اختياري)</label><input class="in" type="file" name="files" multiple accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.zip,.rar"></div>'}
      </div>
      <div class="tk-merr"></div>
      <div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">${k ? '💾 حفظ التعديل' : '📤 توجيه المهمة'}</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
  }

  /* صفحة المهمة: التفاصيل، الإجراءات حسب الدور والمرحلة، الإنجاز، التعليقات، المرفقات، السجل */
  async function viewTask(id) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/tasks');
    const k = await api('GET', `/api/tasks/${id}`);
    const open = ['new', 'doing'].includes(k.status),
      self = k.by === k.assignee;
    const acts = [];
    if (k.iAmAssignee && k.status === 'new') acts.push(['doing', '▶ بدء التنفيذ', 'primary']);
    if (k.iAmAssignee && k.status === 'doing' && !self) acts.push(['review', '📤 تم التنفيذ — إرسال للمدير', 'ok']);
    if ((k.iAmAssignee || k.iAmMgr) && open && self) acts.push(['done', '✔ إنهاء المهمة', 'ok']);
    if (k.iAmMgr && k.status === 'review') {
      acts.push(['done', '✔ اعتماد التنفيذ', 'ok']);
      acts.push(['doing', '↩ إعادة للتنفيذ', 'warn', true]);
    }
    if (k.iAmMgr && ['new', 'doing', 'review'].includes(k.status)) acts.push(['cancelled', '⛔ إلغاء المهمة', 'bad', true]);
    if (k.iAmMgr && ['done', 'cancelled'].includes(k.status)) acts.push(['doing', '↺ إعادة فتح المهمة', '']);
    const att = (a) =>
      `<div class="tk-att"><a href="/api/tasks/${k.id}/attachments/${a.id}" target="_blank">📎 ${esc(a.name)}</a> <small class="muted">${Math.ceil(a.size / 1024)} KB — ${esc(a.byName || '')}</small></div>`;
    renderViewTask(acts, att, k, main, open);
    if ($('#tkEdit')) $('#tkEdit').onclick = () => taskModal(k, () => viewTask(id));
    $$('[data-st]', main).forEach((b) => {
      b.onclick = async () => {
        try {
          await api('POST', `/api/tasks/${k.id}/status`, { status: b.dataset.st, note: $('#tkNote').value });
          toast('تم');
          refreshStats()
            .then(setTopBadges)
            .catch(() => {});
          viewTask(id);
        } catch (err) {
          $('#tkErr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
    });
    if ($('#tkProg')) {
      $('#tkProg').oninput = () => {
        $('#tkProgV').textContent = `${$('#tkProg').value}%`;
      };
      $('#tkProgSave').onclick = async () => {
        try {
          await api('POST', `/api/tasks/${k.id}/progress`, { progress: $('#tkProg').value });
          toast('تم تحديث نسبة الإنجاز');
          viewTask(id);
        } catch (err) {
          toast(err.message, true);
        }
      };
    }
    return wireTask(id, k);
  }
  /* محتوى viewTask (HTML) */
  function renderViewTask(acts, att, k, main, open) {
    main.innerHTML = `${head(esc(k.title), `<bdi dir="ltr">${esc(k.serial)}</bdi> — ${tkStatus(k)} ${tkPrio(k)}`, `${k.iAmMgr && !['done', 'cancelled'].includes(k.status) ? '<button class="btn" id="tkEdit">✏️ تعديل</button>' : ''}<a class="btn" href="#/tasks${k.iAmMgr && !k.iAmAssignee ? '?view=assigned' : ''}">رجوع</a>`)}
      <div class="tk-page">
        <div>
          <div class="card"><h3>تفاصيل المهمة</h3><div class="tk-desc">${k.desc ? esc(k.desc).replace(/\n/g, '<br>') : '<span class="muted">لا يوجد وصف</span>'}</div>
            <h4 class="b-sec">المرفقات</h4>${k.attachments.map(att).join('') || '<div class="muted">لا توجد مرفقات</div>'}
            <div class="row" style="margin-top:8px;gap:8px"><input type="file" class="in" id="tkFile" multiple accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.zip,.rar" style="flex:1"><button class="btn sm" id="tkUp">⬆ رفع</button></div></div>
          <div class="card"><h3>💬 التعليقات والمتابعة</h3>
            <div class="tk-comments">${k.comments.map((c) => `<div class="tk-cm${c.by === state.user.id ? ' me' : ''}"><div class="tk-cm-h"><b>${esc(c.byName)}</b><small class="muted">${esc(dt(c.at))}</small></div><div>${esc(c.text).replace(/\n/g, '<br>')}</div></div>`).join('') || '<div class="muted">لا توجد تعليقات بعد</div>'}</div>
            <div class="field" style="margin-top:10px"><textarea class="in" id="tkCm" rows="2" placeholder="اكتب تعليقاً أو تحديثاً عن سير العمل..."></textarea></div>
            <button class="btn primary sm" id="tkCmSend">إرسال التعليق</button></div>
        </div>
        <div>
          <div class="card"><h3>البيانات</h3><dl class="kv">
            <dt>وجّهها</dt><dd>${esc(k.byName)}</dd><dt>الموظف المكلف</dt><dd>${esc(k.assigneeName)}${k.assigneeTitle || k.assigneeBranch ? `<div class="muted" style="font-size:12px">${esc([k.assigneeTitle, k.assigneeBranch].filter(Boolean).join(' — '))}</div>` : ''}</dd>
            <dt>الأولوية</dt><dd>${tkPrio(k)}</dd><dt>التسليم</dt><dd>${tkDue(k)}${k.late ? ' <span class="tk-late">متأخرة</span>' : ''}</dd>
            ${k.reqSerial ? `<dt>طلب مرتبط</dt><dd><a href="#/req/${esc(k.reqId)}"><bdi dir="ltr">${esc(k.reqSerial)}</bdi></a></dd>` : ''}
            <dt>تاريخ التوجيه</dt><dd>${esc(dt(k.createdAt))}</dd>${k.doneAt ? `<dt>اكتملت</dt><dd>${esc(dt(k.doneAt))}</dd>` : ''}</dl>
            <h4 class="b-sec">نسبة الإنجاز</h4>
            ${k.iAmAssignee && open ? `<div class="row" style="gap:8px;align-items:center"><input type="range" id="tkProg" min="0" max="100" step="5" value="${k.progress}" style="flex:1"><b id="tkProgV">${k.progress}%</b><button class="btn sm" id="tkProgSave">حفظ</button></div>` : `<div class="tk-prog big">${tkBar(k)}</div>`}</div>
          ${
            acts.length
              ? `<div class="card act-box"><h3>الإجراء</h3>
            ${k.status === 'review' && k.iAmMgr ? '<div class="hint" style="margin-bottom:8px">أنهى الموظف التنفيذ — راجع واعتمد أو أعدها بملاحظة</div>' : ''}
            <div class="field"><label>ملاحظة${acts.some((a) => a[3]) ? ' (مطلوبة عند الإعادة أو الإلغاء)' : ' (اختياري)'}</label><textarea class="in" id="tkNote" rows="2"></textarea></div>
            <div class="row" style="gap:8px;flex-wrap:wrap">${acts.map(([s, l, c]) => `<button class="btn ${c}" data-st="${s}">${l}</button>`).join('')}</div><div id="tkErr"></div></div>`
              : ''
          }
          <div class="card"><h3>سجل المهمة</h3><ul class="timeline tk-hist">${k.history
            .slice()
            .reverse()
            .map((h) => `<li><b>${esc(h.byName)}</b> — ${esc(h.note || h.action)}<small class="muted"> ${esc(dt(h.at))}</small></li>`)
            .join('')}</ul></div>
        </div></div>`;
  }
  /* أحداث viewTask: #tkCmSend، #tkUp */
  function wireTask(id, k) {
    $('#tkCmSend').onclick = async () => {
      const text = $('#tkCm').value.trim();
      if (!text) return;
      try {
        await api('POST', `/api/tasks/${k.id}/comments`, { text });
        viewTask(id);
      } catch (err) {
        toast(err.message, true);
      }
    };
    $('#tkUp').onclick = async () => {
      const files = [...$('#tkFile').files];
      if (!files.length) return;
      for (const file of files) {
        const res = await fetch(`/api/tasks/${k.id}/attachments?name=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: file,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast(`${file.name}: ${j.error || 'تعذر رفع المرفق'}`, true);
        }
      }
      viewTask(id);
    };
  }

  return { viewTasks, viewTask };
};
