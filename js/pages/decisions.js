'use strict';
/* صفحة «decisions» (viewDecisionCenter) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['decisions'] = function (S) {
  const { $, $$, SF, api, chip, esc, head, shell, toast } = S;
  /* ---------- مركز القرارات: إصدار قرار (تعيين داخلي، تعديل الهيكل، ترقية، نقل، تكليف، قرار إداري، تعميم) لمن يحدده المُصدر ---------- */
  async function viewDecisionCenter(id) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/decision-center');
    const [d, meta] = await Promise.all([api('GET', '/api/decrees'), api('GET', '/api/decrees/meta')]);
    const KCOL = {
      'تعيين داخلي': '#059669',
      'تعديل الهيكل التنظيمي': '#7c3aed',
      ترقية: '#d97706',
      نقل: '#2563eb',
      تكليف: '#0891b2',
      'قرار إداري': '#be123c',
      تعميم: '#475569',
    };
    const chip = (k) => `<span class="dc-kind" style="--c:${KCOL[k] || '#475569'}">${esc(k)}</span>`;
    main.innerHTML = `${head('مركز القرارات', 'القرارات الإدارية الصادرة وتصل لمن يحددهم المُصدر في النظام وتطبيق الموبايل', meta.canIssue ? '<button class="btn primary" id="dcNew">＋ إصدار قرار</button>' : '')}
      <div class="dc-list">${
        d.list.length
          ? d.list
              .map(
                (x) => `<div class="card dc-item${x.read ? '' : ' unread'}" data-dc="${x.id}">
        <div class="dc-top">${chip(x.kind)}<b>${esc(x.title)}</b><small class="muted">${esc(x.no)} — ${esc(SF.fmtDate(x.date))}</small></div>
        <div class="muted" style="margin-top:4px">${esc(x.snippet || '')}</div>
        <div class="dc-meta"><span>${esc(x.byName)}</span><span>إلى: ${esc(x.toLabel)}</span>${x.total != null ? `<span>قرأه ${x.readCount}/${x.total}</span>` : ''}</div></div>`,
              )
              .join('')
          : '<div class="card empty">لا توجد قرارات</div>'
      }</div>`;
    const open = async (did) => {
      const x = await api('GET', `/api/decrees/${did}`);
      if (!x.read) api('POST', `/api/decrees/${did}/read`, {}).catch(() => {});
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal" style="max-width:760px;width:96%"><div class="dc-top">${chip(x.kind)}<h3 style="margin:0">${esc(x.title)}</h3></div>
        <div class="muted" style="margin:6px 0 10px">${esc(x.no)} — صدر ${esc(SF.fmtDate(x.date))}${x.effective ? ` — يسري من ${esc(SF.fmtDate(x.effective))}` : ''} — ${esc(x.byName)} — إلى: ${esc(x.toLabel)}</div>
        ${x.subject ? `<div class="dc-subj">بخصوص: <b>${esc(x.subject)}</b></div>` : ''}<div class="dc-text">${esc(x.text)}</div>
        ${x.readers ? `<details style="margin-top:12px"><summary>المستلمون (${x.readers.filter((r) => r.at).length}/${x.readers.length} قرأ)</summary><div class="dc-readers">${x.readers.map((r) => `<span class="${r.at ? 'ok' : ''}">${esc(r.name)}${r.at ? ' ✔' : ''}</span>`).join('')}</div></details>` : ''}
        <div class="row" style="margin-top:14px;gap:8px">${x.mine ? '<button class="btn danger" id="dcDel">حذف القرار</button>' : ''}<button class="btn" data-x>إغلاق</button><button class="btn" data-print>🖨️ طباعة</button></div></div>`;
      document.body.appendChild(bg);
      $('[data-x]', bg).onclick = () => {
        bg.remove();
        viewDecisionCenter();
      };
      if ($('#dcDel', bg))
        $('#dcDel', bg).onclick = async () => {
          if (!confirm('حذف القرار نهائياً؟')) return;
          await api('DELETE', `/api/decrees/${did}`);
          bg.remove();
          toast('تم حذف القرار');
          location.hash = '#/decision-center';
          viewDecisionCenter();
        };
    };
    $$('[data-dc]', main).forEach((c) => {
      c.onclick = () => open(c.dataset.dc);
    });
    if (id) open(id).catch((err) => toast(err.message, true));
    viewDecisionCenterPart(meta);
  }
  /* جزء من viewDecisionCenter: if ($('#dcNew'))… */
  function viewDecisionCenterPart(meta) {
    if ($('#dcNew'))
      $('#dcNew').onclick = () => {
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        const opt = (l) => l.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
        bg.innerHTML = `<div class="modal" style="max-width:820px;width:96%"><h3 style="margin-top:0">＋ إصدار قرار</h3><form id="dcf" novalidate>
        <div class="grid2" style="grid-template-columns:repeat(3,1fr)">
          <div class="field"><label>نوع القرار<span class="req">*</span></label><select class="in" id="dcK">${opt(meta.kinds)}</select></div>
          <div class="field"><label>تاريخ السريان</label><input class="in" type="date" id="dcE"></div>
          <div class="field"><label>بخصوص (الموظف / الإدارة)</label><input class="in" id="dcS" placeholder="مثال: تعيين م. أحمد مديراً لفرع جدة"></div></div>
        <div class="field"><label>عنوان القرار<span class="req">*</span></label><input class="in" id="dcT"></div>
        <div class="field"><label>نص القرار<span class="req">*</span></label><textarea class="in" id="dcX" rows="7" placeholder="بناءً على ... تقرر ..."></textarea></div>
        <div class="field"><label>يصل القرار إلى<span class="req">*</span></label>
          <div class="row" style="gap:14px;flex-wrap:wrap">${[
            ['all', 'جميع المستخدمين'],
            ['branches', 'فروع محددة'],
            ['depts', 'إدارات / أقسام محددة'],
            ['users', 'أشخاص محددون'],
          ]
            .map(
              ([v, l], i) => `<label class="check"><input type="radio" name="dcTo" value="${v}"${i === 0 ? ' checked' : ''}> ${l}</label>`,
            )
            .join('')}</div>
          <div class="dc-pick" data-for="branches" hidden>${meta.branches.map((b) => `<label class="check"><input type="checkbox" data-br value="${esc(b)}"> ${esc(b)}</label>`).join('')}</div>
          <div class="dc-pick" data-for="depts" hidden>${meta.depts.map((b) => `<label class="check"><input type="checkbox" data-dp value="${esc(b)}"> ${esc(b)}</label>`).join('')}</div>
          <div class="dc-pick" data-for="users" hidden><input class="in" id="dcQ" placeholder="ابحث بالاسم أو الفرع..." style="margin-bottom:6px"><div class="dc-users">${meta.users.map((u) => `<label class="check" data-s="${esc(`${u.name} ${u.title} ${u.branch}`)}"><input type="checkbox" data-us value="${esc(u.id)}"> ${esc(u.name)} <small class="muted">${esc([u.title, u.branch].filter(Boolean).join(' — '))}</small></label>`).join('')}</div></div></div>
        <div id="dcErr"></div><div class="row" style="gap:8px;margin-top:10px"><button class="btn primary">📜 إصدار وإرسال</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form></div>`;
        document.body.appendChild(bg);
        $('[data-x]', bg).onclick = () => bg.remove();
        const sync = () => {
          const v = $('[name="dcTo"]:checked', bg).value;
          $$('.dc-pick', bg).forEach((p) => {
            p.hidden = p.dataset.for !== v;
          });
        };
        $$('[name="dcTo"]', bg).forEach((r) => {
          r.onchange = sync;
        });
        $('#dcQ', bg).oninput = () => {
          const q = $('#dcQ', bg).value.trim();
          $$('.dc-users label', bg).forEach((l) => {
            l.hidden = !!q && !l.dataset.s.includes(q);
          });
        };
        $('#dcf', bg).onsubmit = async (e) => {
          e.preventDefault();
          const body = {
            kind: $('#dcK', bg).value,
            effective: $('#dcE', bg).value,
            subject: $('#dcS', bg).value,
            title: $('#dcT', bg).value,
            text: $('#dcX', bg).value,
            to: $('[name="dcTo"]:checked', bg).value,
            branches: $$('[data-br]:checked', bg).map((i) => i.value),
            depts: $$('[data-dp]:checked', bg).map((i) => i.value),
            ids: $$('[data-us]:checked', bg).map((i) => i.value),
          };
          try {
            const r = await api('POST', '/api/decrees', body);
            bg.remove();
            toast('تم إصدار القرار وإرساله');
            location.hash = `#/decision-center/${r.id}`;
          } catch (err) {
            $('#dcErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      };
  }

  return { viewDecisionCenter };
};
