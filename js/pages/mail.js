'use strict';
/* صفحة «mail» (viewMail، viewMailRead) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['mail'] = function (S) {
  const { $, $$, api, askYesNo, dt, dueTxt, esc, head, isAdmin, mailDate, mailHtml, refreshStats, setTopBadges, shell, state, toast } = S;
  const { mailCompose } = window.SES_PAGE_KITS['mail'](S, {});
  /* قائمة مجموعات المستلمين، ونموذج إضافة / تعديل مجموعة */
  function groupsListHtml(groups, all) {
    return `<h3 style="margin-top:0">👥 مجموعات المستلمين</h3>
      <div class="hint" style="margin-bottom:10px">اكتب اسم المجموعة في "إلى" أو "نسخة" لإضافة كل أعضائها. ومسميات النظام (مثل مدير فرع) متاحة تلقائياً بنفس الطريقة.</div>
      <div class="mg-list">${
        groups
          .map(
            (
              g,
            ) => `<div class="mg-row"><div><b>${esc(g.name)}</b> <small class="muted">${g.members.length} عضو${g.shared ? ' — مشتركة لكل المستخدمين' : ' — شخصية'}${g.shared && !g.canEdit ? ` — من ${esc(g.byName)}` : ''}</small>
          <div class="muted mg-names">${esc(
            g.members
              .map((id) => (all.find((u) => u.id === id) || {}).name || '')
              .filter(Boolean)
              .join('، '),
          )}</div></div>
          ${g.canEdit ? `<span class="row" style="gap:6px"><button class="btn sm" data-ge="${g.id}">✏️ تعديل</button><button class="btn sm bad" data-gd="${g.id}">حذف</button></span>` : ''}</div>`,
          )
          .join('') || '<div class="muted">لا توجد مجموعات بعد</div>'
      }</div>
      <div class="row" style="margin-top:14px;gap:8px"><button class="btn primary" data-gn>➕ مجموعة جديدة</button><button class="btn ghost" data-x>إغلاق</button></div>`;
  }
  function groupFormHtml(g, all) {
    return `<h3 style="margin-top:0">${g ? '✏️ تعديل المجموعة' : '➕ مجموعة جديدة'}</h3>
      <div class="field"><label>اسم المجموعة *</label><input class="in" id="mgName" maxlength="80" value="${esc(g ? g.name : '')}"></div>
      ${isAdmin() ? `<label class="check"><input type="checkbox" id="mgShared"${g && g.shared ? ' checked' : ''}> مشتركة لكل المستخدمين</label>` : ''}
      <div class="field"><label>الأعضاء *</label><input class="in" id="mgQ" placeholder="ابحث بالاسم أو المسمى أو الفرع...">
        <div class="mg-pick">${all.map((u) => `<label class="check" data-s="${esc(`${u.name} ${u.title} ${u.branch} ${u.roleName || ''}`)}"><input type="checkbox" value="${u.id}"${g && g.members.includes(u.id) ? ' checked' : ''}> ${esc(u.name)} <small class="muted">${esc([u.title, u.branch].filter(Boolean).join(' — '))}</small></label>`).join('')}</div>
        <div class="hint" id="mgCount"></div></div>
      <div id="mgErr"></div>
      <div class="row" style="margin-top:12px;gap:8px"><button class="btn primary" data-gs>💾 حفظ</button><button class="btn ghost" data-gb>رجوع</button></div>`;
  }

  /* مجموعات المستلمين: الشخصية لكل مستخدم، والمشتركة لكل المستخدمين يعملها مدير النظام */
  async function mailGroupsModal() {
    const [users, groups] = await Promise.all([api('GET', '/api/mail/users'), api('GET', '/api/mail/groups')]);
    const all = [...users, { id: state.user.id, name: state.user.name, title: state.user.title || '', branch: state.user.branch || '' }];
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const listView = () => groupsListHtml(groups, all);
    const formView = (g) => groupFormHtml(g, all);
    const box = document.createElement('div');
    box.className = 'modal';
    box.style.maxWidth = '640px';
    bg.appendChild(box);
    const showList = () => {
      box.innerHTML = listView();
      $('[data-x]', box).onclick = () => bg.remove();
      $('[data-gn]', box).onclick = () => showForm(null);
      $$('[data-ge]', box).forEach((b) => {
        b.onclick = () => showForm(groups.find((g) => g.id === b.dataset.ge));
      });
      $$('[data-gd]', box).forEach((b) => {
        b.onclick = async () => {
          if (!(await askYesNo('حذف هذه المجموعة؟'))) return;
          await api('DELETE', `/api/mail/groups/${b.dataset.gd}`);
          groups.splice(
            groups.findIndex((g) => g.id === b.dataset.gd),
            1,
          );
          showList();
        };
      });
    };
    const showForm = (g) => {
      box.innerHTML = formView(g);
      const count = () => {
        $('#mgCount', box).textContent = `المختارون: ${$$('.mg-pick input:checked', box).length}`;
      };
      $('#mgQ', box).oninput = () => {
        const q = $('#mgQ', box).value.trim();
        $$('.mg-pick label', box).forEach((l) => {
          l.hidden = !!q && !l.dataset.s.includes(q);
        });
      };
      $$('.mg-pick input', box).forEach((c) => {
        c.onchange = count;
      });
      count();
      $('[data-gb]', box).onclick = showList;
      $('[data-gs]', box).onclick = async () => {
        try {
          const body = {
            name: $('#mgName', box).value,
            members: $$('.mg-pick input:checked', box).map((c) => c.value),
            shared: !!($('#mgShared', box) || {}).checked,
          };
          const x = await api(g ? 'PUT' : 'POST', `/api/mail/groups${g ? `/${g.id}` : ''}`, body);
          if (g) groups[groups.findIndex((y) => y.id === g.id)] = x;
          else groups.push(x);
          toast('تم حفظ المجموعة');
          showList();
        } catch (err) {
          $('#mgErr', box).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
    };
    document.body.appendChild(bg);
    showList();
  }

  async function viewMail(id, query) {
    if (id === 'new') {
      await viewMail(null, {});
      return mailCompose(query);
    }
    if (id) return viewMailRead(id);
    const box = ['sent', 'drafts', 'starred', 'archive'].includes(query.box) ? query.box : 'inbox';
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/mail');
    const [list, drafts] = await Promise.all([box === 'drafts' ? [] : api('GET', `/api/mail?box=${box}`), api('GET', '/api/mail/drafts')]);
    const unread = box === 'inbox' ? list.filter((m) => !m.read).length : 0;
    const reqChip = (s) => (s ? ` <span class="mr-req">🔗 ${esc(s)}</span>` : '');
    /* كل صف محادثة: المشاركون وعدد رسائلها، وآخر رسالة فيها */
    const rows =
      box === 'drafts'
        ? drafts.map(
            (
              d,
            ) => `<a class="mail-row" href="#/mail/new?draft=${d.id}" data-s="${esc(`${d.toNames.join(' ')} ${d.subject} ${d.snippet} ${d.reqSerial}`)}">
          <span class="mr-who"><span class="mr-draft">مسودة</span> ${esc(d.toNames.join('، ') || '(بدون مستلم)')}</span>
          <span class="mr-sub"><b>${esc(d.subject || '(بدون موضوع)')}</b> <span class="muted">— ${esc(d.snippet)}</span>${reqChip(d.reqSerial)}</span>
          <span class="mr-meta">${esc(mailDate(d.at))} <button type="button" class="btn sm ghost" data-ddel="${d.id}" title="حذف المسودة">🗑</button></span></a>`,
          )
        : list.map(
            (
              m,
            ) => `<a class="mail-row${m.read ? '' : ' new'}" href="#/mail/${m.id}" data-s="${esc(`${m.people.join(' ')} ${m.toNames.join(' ')} ${m.subject} ${m.snippet} ${m.reqSerial || ''}`)}">
          <span class="mr-who"><span class="mr-star${m.starred ? ' on' : ''}" data-star="${m.id}" data-noicon title="${m.starred ? 'إزالة النجمة' : 'تمييز بنجمة'}">${m.starred ? '★' : '☆'}</span>${esc(box === 'sent' ? `إلى: ${m.toNames.slice(0, 3).join('، ')}${m.toNames.length > 3 ? ` +${m.toNames.length - 3}` : ''}` : m.people.join('، '))}${m.count > 1 ? ` <small class="mr-count">${m.count}</small>` : ''}${box !== 'sent' && (m.cc || []).includes(state.user.id) ? ' <small class="muted">(نسخة)</small>' : ''}</span>
          <span class="mr-sub"><b>${esc(m.subject)}</b> <span class="muted">— ${esc(m.snippet)}</span>${reqChip(m.reqSerial)}${m.due ? ` <span class="mr-due${new Date(m.due) < new Date() ? ' late' : ''}">⏰ رد قبل ${esc(dueTxt(m.due))}</span>` : ''}${m.waiting ? ` <span class="mr-due wait">⏳ بانتظار ${m.waiting} رد</span>` : ''}</span>
          <span class="mr-meta">${m.att ? '📎 ' : ''}${esc(mailDate(m.at))}</span></a>`,
          );
    main.innerHTML = `${head('البريد الداخلي', 'رسائل بين مستخدمي النظام', '<button class="btn" id="mGroups">👥 مجموعات المستلمين</button><a class="btn primary" href="#/mail/new">✏️ رسالة جديدة</a>')}
      <div class="tabs"><a href="#/mail" class="${box === 'inbox' ? 'on' : ''}">📥 الوارد${unread ? ` (${unread})` : ''}</a><a href="#/mail?box=sent" class="${box === 'sent' ? 'on' : ''}">📤 الصادر</a><a href="#/mail?box=drafts" class="${box === 'drafts' ? 'on' : ''}">📝 المسودات${drafts.length ? ` (${drafts.length})` : ''}</a><a href="#/mail?box=starred" class="${box === 'starred' ? 'on' : ''}"><span data-noicon>★</span> المميزة بنجمة</a><a href="#/mail?box=archive" class="${box === 'archive' ? 'on' : ''}">📦 الأرشيف</a></div>
      <div class="card" style="padding:0"><input class="in" id="mq" placeholder="بحث في الرسائل (الاسم، الموضوع، النص، رقم الطلب)..." style="margin:12px;width:calc(100% - 24px)">
        <div class="mail-list">${rows.join('') || `<div class="empty">${box === 'sent' ? 'لا توجد رسائل مرسلة' : box === 'drafts' ? 'لا توجد مسودات' : box === 'starred' ? 'لا توجد محادثات مميزة بنجمة' : box === 'archive' ? 'الأرشيف فارغ' : 'صندوق الوارد فارغ'}</div>`}</div></div>`;
    $('#mq').oninput = () => {
      const q = $('#mq').value.trim();
      $$('.mail-row', main).forEach((r) => {
        r.hidden = q && !r.dataset.s.includes(q);
      });
    };
    $$('[data-star]', main).forEach((s) => {
      s.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const x = await api('POST', `/api/mail/${s.dataset.star}/flag`, { star: !s.classList.contains('on') });
          s.classList.toggle('on', x.starred);
          s.textContent = x.starred ? '★' : '☆';
          if (box === 'starred' && !x.starred) s.closest('.mail-row').remove();
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
    $('#mGroups').onclick = () => mailGroupsModal();
    $$('[data-ddel]', main).forEach((btn) => {
      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!(await askYesNo('حذف هذه المسودة؟'))) return;
        try {
          await api('DELETE', `/api/mail/drafts/${btn.dataset.ddel}`);
          toast('تم حذف المسودة');
          viewMail(null, { box: 'drafts' });
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
  }

  /* المحادثة كاملة في صفحة واحدة: الرسائل بالترتيب، السابقة مطوية (تُفتح بالضغط)، والمفتوحة والجديدة والأخيرة ظاهرة */
  async function viewMailRead(id) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/mail');
    const c = await api('GET', `/api/mail/${id}`);
    refreshStats().then(setTopBadges);
    const msgs = c.messages && c.messages.length ? c.messages : [c];
    const att = (m, a2) =>
      `<a href="/api/mail/${m.id}/attachments/${a2.id}" target="_blank">📎 ${esc(a2.name)}</a> <small class="muted">${Math.ceil(a2.size / 1024)} KB</small>`;
    const card = (m, i) => {
      const open = m.id === c.id || m.wasUnread || i === msgs.length - 1;
      const mineSent = m.from === state.user.id;
      return `<div class="card mail-msg${open ? ' open' : ''}" data-mi="${m.id}">
        <div class="mm-head" data-tog><span class="mm-av">${esc((m.fromName || '?').trim().charAt(0))}</span>
          <div class="mm-who"><b>${esc(mineSent ? `أنا (${m.fromName})` : m.fromName)}</b>
            <small class="mm-to">إلى: ${esc(m.toNames.join('، '))}${m.ccNames.length ? ` — نسخة: ${esc(m.ccNames.join('، '))}` : ''}${m.bccNames.length ? ` — نسخة مخفية: ${esc(m.bccNames.join('، '))}` : ''}${m.bccMe ? ' — (وصلتك نسخة مخفية)' : ''}</small>
            ${m.replyBy ? `<small class="mm-due${m.mustReply ? ' me' : ''}${m.mustReply && new Date(m.replyBy) < new Date() ? ' late' : ''}">⏰ مطلوب رد قبل ${esc(dueTxt(m.replyBy))}${m.mustReply ? ' — لم ترد بعد' : ''}</small>` : ''}
            <small class="mm-snip">${esc(m.snippet)}</small></div>
          <span class="mm-date">${m.att ? '📎 ' : ''}${esc(dt(m.at))}</span></div>
        <div class="mm-body"><div class="mail-body gm-html" data-noicon data-mb="${i}"></div>
          ${m.attachments.length ? `<div class="mail-att"><b>المرفقات:</b>${m.attachments.map((a2) => `<div>${att(m, a2)}</div>`).join('')}</div>` : ''}
          ${m.replies.length ? `<div class="mail-readers"><b>الرد:</b> ${m.replies.map((x) => `<span class="chip ${x.done ? 'approved' : new Date(m.replyBy) < new Date() ? 'rejected' : 'pending'}">${esc(x.name)} ${x.done ? '✔ رد' : '— لم يرد'}</span>`).join(' ')}</div>` : ''}
          ${mineSent && m.readers.length ? `<div class="mail-readers"><b>القراءة:</b> ${m.readers.map((r) => `<span class="chip ${r.at ? 'approved' : 'pending'}" title="${r.at ? esc(dt(r.at)) : ''}">${esc(r.name)}${r.bcc ? ' (نسخة مخفية)' : r.cc ? ' (نسخة)' : ''} ${r.at ? '✔' : '— لم يقرأها'}</span>`).join(' ')}</div>` : ''}
          <div class="row mm-acts">${mineSent ? '' : `<a class="btn sm primary" href="#/mail/new?reply=${m.id}">↩ رد</a>`}${m.to.length + m.cc.length > 1 || mineSent ? `<a class="btn sm" href="#/mail/new?reply=${m.id}&all=1">↩ رد على الجميع</a>` : ''}<a class="btn sm" href="#/mail/new?fwd=${m.id}">↪ إعادة توجيه</a></div></div></div>`;
    };
    main.innerHTML = `${head(
      esc(msgs[0].subject),
      `${msgs.length > 1 ? `محادثة من ${msgs.length} رسائل` : 'رسالة واحدة'}${c.reqSerial ? ` — 🔗 مرتبطة بالطلب <a href="#/req/${esc(c.reqId)}"><bdi dir="ltr">${esc(c.reqSerial)}</bdi></a> ${esc(c.reqTitle || '')}` : ''}`,
      `<button class="btn" id="mStar"><span data-noicon>${c.starred ? '★' : '☆'}</span> ${c.starred ? 'مميزة بنجمة' : 'تمييز بنجمة'}</button><button class="btn" id="mArch">${c.archived ? '📥 نقل للوارد' : '📦 أرشفة'}</button><button class="btn bad" id="mDel">🗑 حذف المحادثة</button><a class="btn" href="#/mail">رجوع</a>`,
    )}
      <div class="mail-conv">${msgs.map(card).join('')}</div>`;
    /* المحتوى المنسق منظَّف في السيرفر، ويُعرض في عنصره وحده؛ والرسائل القديمة نص عادي */
    $$('[data-mb]', main).forEach((el) => {
      el.innerHTML = mailHtml(msgs[el.dataset.mb]);
    });
    $$('[data-tog]', main).forEach((h) => {
      h.onclick = (e) => {
        if (e.target.closest('a')) return;
        h.parentElement.classList.toggle('open');
      };
    });
    const cur = $(`[data-mi="${c.id}"]`, main);
    if (cur && msgs.length > 1) cur.scrollIntoView({ block: 'start' });
    $('#mStar').onclick = async () => {
      try {
        await api('POST', `/api/mail/${c.id}/flag`, { star: !c.starred });
        viewMailRead(id);
      } catch (err) {
        toast(err.message, true);
      }
    };
    $('#mArch').onclick = async () => {
      try {
        await api('POST', `/api/mail/${c.id}/flag`, { archive: !c.archived });
        if (c.archived) {
          toast('نُقلت المحادثة للوارد');
          viewMailRead(id);
        } else {
          toast('تمت أرشفة المحادثة — ترجع للوارد إذا وصلها رد جديد');
          location.hash = '#/mail';
        }
      } catch (err) {
        toast(err.message, true);
      }
    };
    $('#mDel').onclick = async () => {
      if (!(await askYesNo(msgs.length > 1 ? `حذف المحادثة (${msgs.length} رسائل) من صندوقك؟` : 'حذف الرسالة من صندوقك؟'))) return;
      try {
        await api('DELETE', `/api/mail/${c.id}?conv=1`);
        toast('تم الحذف من صندوقك');
        location.hash = '#/mail';
      } catch (err) {
        toast(err.message, true);
      }
    };
  }

  return { viewMail };
};
