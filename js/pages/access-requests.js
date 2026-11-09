'use strict';
/* صفحة «access-requests» (viewAccessRequests) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
/* أدوات الصفحة خارج دالتها: بطاقة الطلب، وتنفيذ الإجراء */
const ACCESS_REQ_UI = {
  card(x, { esc, fmtDate }, ST) {
    const reset = x.kind === 'reset';
    const info = [
      ['اسم المستخدم', x.username],
      ['الرقم الوظيفي / الهوية', x.empNo],
      ['الفرع', x.branch],
      ['المسمى', x.title],
      ['الجوال', x.phone],
      ['البريد', x.email],
    ]
      .filter(([, v]) => v)
      .map(([l, v]) => `<div><small class="muted">${l}</small><b dir="auto">${esc(v)}</b></div>`)
      .join('');
    const match = x.user
      ? `<div class="ar-match ok">✔ الحساب المطابق: <b dir="ltr">${esc(x.user.username)}</b> — ${esc(x.user.name)}${x.user.active ? '' : ' <span class="chip">موقوف</span>'}</div>`
      : x.emp
        ? `<div class="ar-match">📁 ملف موظف مطابق: ${esc(x.emp.name)} — ${esc(x.emp.branch || '')}${reset ? ' (بدون حساب على النظام)' : ''}</div>`
        : '<div class="ar-match no">⚠ لا يوجد حساب أو ملف موظف مطابق</div>';
    const regTxt = [x.reg && x.reg.phone, x.reg && x.reg.email].filter(Boolean).join(' — ');
    const warn =
      (x.user || x.emp) && !x.contactOk
        ? `<div class="ar-match no">⚠ بيانات التواصل في الطلب لا تطابق المسجلة${regTxt ? ` (<b dir="ltr">${esc(regTxt)}</b>)` : ' (لا توجد بيانات مسجلة)'} — تحقق من هويته قبل إرسال كلمة المرور</div>`
        : '';
    let acts = '';
    if (x.status === 'new') {
      if (x.user) acts += `<button class="btn sm primary" data-ar="reset">🔑 تعيين كلمة مرور مؤقتة</button>`;
      else if (!reset && x.emp) acts += `<button class="btn sm primary" data-ar="create">👤 إنشاء حساب للموظف</button>`;
      acts += `<button class="btn sm" data-ar="done">✔ تم يدوياً</button><button class="btn sm ghost" data-ar="reject">✖ رفض</button>`;
    } else
      acts = `<span class="muted">${esc(ST[x.status])} بواسطة ${esc(x.doneBy || '')} — ${esc(fmtDate(x.doneAt))}${x.doneNote ? ` — ${esc(x.doneNote)}` : ''}</span><button class="btn sm ghost" data-ar="reopen">↺ إعادة فتح</button>`;
    return `<div class="card ar-card" data-id="${x.id}"><div class="ar-top"><span class="chip ${reset ? 'warn' : 'info'}">${reset ? '🔑 نسيت كلمة المرور' : '👤 إنشاء حساب'}</span><b>${esc(x.name)}</b><small class="muted">${esc(fmtDate(x.at))}</small></div>
      <div class="ar-info">${info}</div>${x.note ? `<div class="ar-note">📝 ${esc(x.note)}</div>` : ''}${match}${warn}<div class="row ar-acts">${acts}</div></div>`;
  },
  /* اختلاف بيانات التواصل عن المسجلة: يرفض السيرفر حتى يؤكد مدير النظام أنه تحقق من هوية صاحب الطلب */
  async act({ api, askYesNo }, id, body) {
    const url = `/api/access-requests/${id}/action`;
    try {
      return await api('POST', url, body);
    } catch (e) {
      if (!/لا تطابق/.test(e.message) || !(await askYesNo(`${e.message} — هل تحققت من هويته وتريد المتابعة؟`))) throw e;
      return api('POST', url, { ...body, confirmMismatch: true });
    }
  },
};
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['access-requests'] = function (S) {
  const { $, $$, api, askYesNo, esc, fmtDate, head, refreshStats, shell, toast } = S;
  /* ---------- طلبات الحسابات (لمدير النظام) ---------- */
  async function viewAccessRequests(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/access-requests');
    const list = await api('GET', '/api/access-requests');
    const tab = ['new', 'done', 'rejected'].includes(query.s) ? query.s : 'new';
    const ST = { new: 'جديدة', done: 'تمت', rejected: 'مرفوضة' };
    const rows = list.filter((x) => x.status === tab);
    const card = (x) => ACCESS_REQ_UI.card(x, S, ST);
    main.innerHTML =
      head('طلبات الحسابات', 'طلبات «نسيت كلمة المرور» و«إنشاء حساب» المرسلة من شاشة الدخول') +
      `<div class="gtabs" style="overflow-y:hidden">${Object.entries(ST)
        .map(
          ([k, l]) =>
            `<a class="gtab${k === tab ? ' on' : ''}" href="#/access-requests?s=${k}">${l} <small>${list.filter((x) => x.status === k).length}</small></a>`,
        )
        .join('')}</div>` +
      (rows.length ? `<div class="ar-list">${rows.map(card).join('')}</div>` : '<div class="empty">لا توجد طلبات</div>');
    /* كلمة المرور المؤقتة تُرسل على بيانات التواصل المسجلة للحساب، لا على ما كُتب في الطلب */
    const sendTo = (r) => (r.reg && (r.reg.phone || r.reg.email)) || '';
    const showPw = (r) => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal" style="max-width:460px"><h3 style="margin-top:0">✅ تم</h3><p>بلّغ صاحب الحساب ${esc(r.name)}${sendTo(r) ? ` على بياناته المسجلة <b dir="ltr">${esc(sendTo(r))}</b>` : ' بعد التحقق من هويته'} ببيانات الدخول، وسيُطلب منه تغيير كلمة المرور عند أول دخول:</p>
        <div class="ar-cred"><div>اسم المستخدم: <b dir="ltr">${esc(r.username)}</b></div><div>كلمة المرور المؤقتة: <b dir="ltr">${esc(r.password)}</b></div></div>
        <div class="row" style="margin-top:12px"><button class="btn primary" data-cp>📋 نسخ</button><button class="btn ghost" data-x>إغلاق</button></div></div>`;
      document.body.appendChild(bg);
      $('[data-cp]', bg).onclick = () => {
        try {
          navigator.clipboard.writeText(`اسم المستخدم: ${r.username}\nكلمة المرور المؤقتة: ${r.password}`);
          toast('تم النسخ');
        } catch {
          /* تجاهل */
        }
      };
      $('[data-x]', bg).onclick = () => {
        bg.remove();
        viewAccessRequests(query);
      };
    };
    $$('[data-ar]', main).forEach((b) => {
      b.onclick = async () => {
        const id = b.closest('[data-id]').dataset.id,
          x = list.find((r) => r.id === id),
          a = b.dataset.ar;
        const body = { action: a };
        if (a === 'reset') {
          if (!(await askYesNo(`تعيين كلمة مرور مؤقتة جديدة لحساب ${x.user.username}؟ سيتم تسجيل خروجه من كل الأجهزة.`))) return;
          if (!x.user.active) body.activate = await askYesNo('الحساب موقوف، هل تريد تفعيله أيضاً؟');
        }
        if (a === 'create') {
          const un = prompt('اسم المستخدم للحساب الجديد (بالإنجليزية):', x.username || '');
          if (un === null) return;
          body.username = un;
        }
        if (a === 'reject' || a === 'done') {
          const n = prompt(a === 'reject' ? 'سبب الرفض (اختياري):' : 'ملاحظة (اختياري):', '');
          if (n === null) return;
          body.note = n;
        }
        try {
          const r = await ACCESS_REQ_UI.act(S, id, body);
          refreshStats();
          if (r.password) showPw(r);
          else {
            toast('تم');
            viewAccessRequests(query);
          }
        } catch (e) {
          toast(e.message, true);
        }
      };
    });
  }

  return { viewAccessRequests };
};
