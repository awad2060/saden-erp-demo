'use strict';
/* أجزاء صفحة الطلب: إعادة التوجيه، وبطاقة مكافأة نهاية الخدمة ونافذتها، ومحادثة الطلب، ومسار الاعتماد */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['request-details'] = function (S, ctx) {
  const { $, $$, IMG_EXT, SF, api, dt, eosToProgram, esc, extOf, fmtDate, route, toast } = S;
  const { isForm } = ctx;
  /* صفحة الملف: زر الحساب (لمحاسب إدارة الرواتب) وتحته القيمة ومعاينة ملف نتيجة قوى (صورة أو PDF) */
  /* إعادة توجيه الطلب لأي مستخدم: تحويل المرحلة إليه، أو إحالته لإبداء الرأي ثم يرجع */
  async function forwardModal(r) {
    const users = await api('GET', '/api/mail/users');
    const cur = r.route[r.step];
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:620px;width:96%"><h3 style="margin-top:0">↪ إعادة توجيه الطلب <bdi dir="ltr">${esc(r.serial)}</bdi></h3>
      <form id="fwdF" novalidate>
        <div class="field"><label>إلى *</label><input class="in" id="fwdQ" placeholder="ابحث بالاسم أو المسمى أو الفرع..." autocomplete="off">
          <select class="in fwd-list" id="fwdTo" size="7">${users
            .filter((u) => u.id !== cur.userId)
            .map(
              (u) =>
                `<option value="${esc(u.id)}" data-s="${esc([u.name, u.title, u.branch].join(' '))}">${esc(u.name)}${u.title ? ` — ${esc(u.title)}` : ''}${u.branch ? ` (${esc(u.branch)})` : ''}</option>`,
            )
            .join('')}</select></div>
        <div class="field"><label>نوع التوجيه *</label>
          <label class="check"><input type="radio" name="mode" value="transfer" checked> تحويل مرحلة "${esc(cur.label)}" إليه: يعتمد هو بدلاً من ${esc(cur.name)} ويكمل الطلب مساره</label>
          <label class="check"><input type="radio" name="mode" value="consult"> إحالته لإبداء الرأي: يكتب رأيه ثم يرجع الطلب إلى ${esc(cur.name)}</label></div>
        <div class="field"><label>سبب إعادة التوجيه *</label><textarea class="in" name="note" rows="3"></textarea></div>
        <div id="fwdErr"></div>
        <div class="row" style="margin-top:12px;gap:8px"><button class="btn primary">↪ إعادة توجيه</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#fwdQ', bg).oninput = () => {
      const q = $('#fwdQ', bg).value.trim();
      $$('#fwdTo option', bg).forEach((o) => {
        o.hidden = !!q && !o.dataset.s.includes(q);
      });
    };
    $('#fwdF', bg).onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target,
        to = $('#fwdTo', bg).value,
        mode = $('input[name="mode"]:checked', f).value,
        note = f.note.value.trim();
      const err = (m) => {
        $('#fwdErr', bg).innerHTML = `<div class="err">${esc(m)}</div>`;
      };
      if (!to) return err('اختر المستخدم الذي توجّه إليه الطلب');
      if (!note) return err('اكتب سبب إعادة التوجيه');
      const btn = $('button.primary', f);
      btn.disabled = true;
      try {
        await api('POST', `/api/requests/${r.id}/forward`, { to, mode, note });
        bg.remove();
        toast(mode === 'consult' ? 'تمت إحالة الطلب لإبداء الرأي' : 'تم تحويل الطلب');
        route();
      } catch (x) {
        err(x.message);
        btn.disabled = false;
      }
    };
  }

  function eosCard(r, canEdit) {
    if (!isForm(r, 'settlementFile') || r.data.kind !== 'تصفية نهائية') return '';
    const a = r.attachments.find((x) => x.label === SF.EOS_ATT),
      q = r.data.eosQiwa;
    if (!canEdit && !a && !q) return '';
    const url = a ? `/api/requests/${r.id}/attachments/${a.id}` : '';
    const prev = !a
      ? ''
      : IMG_EXT.includes(extOf(a.name))
        ? `<a href="${url}" target="_blank"><img src="${url}" alt="${esc(a.name)}"></a>`
        : extOf(a.name) === '.pdf'
          ? `<iframe src="${url}#toolbar=0&view=FitH" title="${esc(a.name)}"></iframe>`
          : '';
    return `<div class="card eos-card"><h3>🧮 مكافأة نهاية الخدمة</h3>
      ${
        canEdit
          ? `<button class="btn primary" id="eosBtn">🧮 ${q ? 'تعديل حساب مكافأة نهاية الخدمة' : 'حساب مكافأة نهاية الخدمة'}</button>
        <div class="hint" style="margin:6px 0 10px">احسبها على حاسبة قوى، ثم اكتب المبلغ وارفع النتيجة (صورة أو PDF)، فينزل المبلغ تلقائياً في برنامج التصفية</div>`
          : ''
      }
      ${
        q || a
          ? `<div class="eos-val"><div class="eos-amt"><small>قيمة مكافأة نهاية الخدمة</small><b>${q ? `${esc(SF.fmtNum(q.amount))} ريال` : '—'}</b>${q ? `<small>${esc(SF.tafqeet(q.amount))}</small><small class="muted">سجّلها ${esc(q.byName || '')} — ${esc(dt(q.at))}</small>` : ''}</div>
        ${a ? `<div class="eos-file"><div class="eos-file-h">📎 <a href="${url}" target="_blank">${esc(SF.EOS_ATT)}</a><small class="muted">${esc(a.name)}</small></div>${prev}</div>` : '<div class="muted">لم ترفع نتيجة حاسبة قوى</div>'}</div>`
          : '<div class="muted">لم تحسبها بعد</div>'
      }
    </div>`;
  }

  function eosModal(r, frame, done) {
    const hr = (r.data.tasks || {}).hr || {};
    const old = r.attachments.find((a) => a.label === SF.EOS_ATT);
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:620px;width:96%"><h3 style="margin-top:0">🧮 مكافأة نهاية الخدمة — ${esc(r.data.name)}</h3>
      <ol class="eos-steps">
        <li>افتح حاسبة قوى واحسب المكافأة: <a class="btn sm primary" href="${SF.EOS_QIWA}" target="_blank" rel="noopener">↗ فتح حاسبة نهاية الخدمة في قوى</a>
          <div class="hint">بيانات الموظف للحاسبة: تاريخ التعيين <b>${esc(SF.fmtDate(hr.joinDate) || '—')}</b>، آخر يوم دوام <b>${esc(SF.fmtDate(hr.lastDay) || '—')}</b>${hr.endReason ? `، سبب انتهاء العلاقة: <b>${esc(hr.endReason)}</b>` : ''}</div></li>
        <li>اكتب المبلغ الذي ظهر في قوى، وارفع صورة النتيجة أو ملف PDF منها.</li></ol>
      <form id="eosF" novalidate><div class="grid2">
        <div class="field"><label>مبلغ مكافأة نهاية الخدمة (ريال) *</label><input class="in" type="number" min="0" step="0.01" name="amount" value="${esc((r.data.eosQiwa || {}).amount ?? '')}"></div>
        <div class="field"><label>نتيجة حاسبة قوى (صورة أو PDF) *</label><input class="in" type="file" name="file" accept=".png,.jpg,.jpeg,.pdf">
          ${old ? `<div class="hint">المرفق الحالي: ${esc(old.name)} — رفع ملف جديد يحل محله</div>` : ''}</div>
      </div><div id="eosErr"></div>
      <div class="row" style="margin-top:14px;gap:8px"><button class="btn primary">✅ نقل المبلغ للتصفية وإرفاق النتيجة</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#eosF', bg).onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target,
        amount = Number(f.amount.value),
        file = f.file.files[0];
      const err = (m) => {
        $('#eosErr', bg).innerHTML = `<div class="err">${esc(m)}</div>`;
      };
      if (!(amount >= 0) || f.amount.value.trim() === '') return err('اكتب مبلغ المكافأة كما ظهر في حاسبة قوى');
      if (!file) return err('ارفع صورة أو ملف PDF بنتيجة حاسبة قوى');
      if (!['.png', '.jpg', '.jpeg', '.pdf'].includes(extOf(file.name))) return err('الملف يجب أن يكون صورة أو PDF');
      const btn = $('button.primary', f);
      btn.disabled = true;
      $('#eosErr', bg).innerHTML = '';
      try {
        const res = await fetch(
          `/api/requests/${r.id}/attachments?name=${encodeURIComponent(file.name)}&label=${encodeURIComponent(SF.EOS_ATT)}`,
          { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/octet-stream' }, body: file },
        );
        const att = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(att.error || 'تعذر رفع الملف');
        const x = await api('PUT', `/api/requests/${r.id}/eos`, { amount });
        const ok = frame ? eosToProgram(frame, amount) : true;
        bg.remove();
        toast(
          !frame
            ? 'تم حفظ مكافأة نهاية الخدمة وإرفاق نتيجة قوى — تنزل تلقائياً في برنامج التصفية'
            : ok
              ? 'تم نقل المكافأة إلى البرنامج وإرفاق نتيجة قوى — احفظ التصفية أو أرسلها'
              : 'تم إرفاق نتيجة قوى، لكن لا يوجد سطر فارغ في المبالغ المستحقة لكتابة المبلغ',
        );
        done(x);
      } catch (x) {
        err(x.message);
        btn.disabled = false;
      }
    };
  }

  /* محادثة سريعة بخصوص الطلب: خاصة مع كل شخص على حدة، والمتاحون فقط من رفع الطلب ومن اعتمده ومن الاعتماد عنده الآن */
  async function reqChatCard(r) {
    const box = $('#rqChat');
    if (!box) return;
    let d;
    try {
      d = await api('GET', `/api/chat/request/${r.id}`);
    } catch {
      return;
    }
    if (!d.people.length) return;
    box.innerHTML = `<div class="card rq-chat"><h3>💬 محادثة بخصوص الطلب</h3>
      <div class="hint" style="margin:-4px 0 8px">محادثة خاصة بينك وبين كل شخص على حدة — المتاحون فقط: من رفع الطلب، ومن اعتمده، ومن الاعتماد عنده الآن</div>
      <ul class="rq-ppl">${d.people
        .map(
          (
            p,
          ) => `<li><span class="rq-who"><b>${esc(p.name)}${p.online ? ' <i class="rq-on" title="متصل الآن"></i>' : ''}</b><small>${esc(p.roles.join(' · '))}</small></span>
        <button class="btn sm${p.started ? '' : ' primary'}" data-rqc="${esc(p.id)}">${p.started ? 'فتح المحادثة' : 'بدء محادثة'}${p.unread ? ` <span class="ch-un">${p.unread}</span>` : ''}</button></li>`,
        )
        .join('')}</ul></div>`;
    $$('[data-rqc]', box).forEach((b) => {
      b.onclick = async () => {
        b.disabled = true;
        try {
          const x = await api('POST', `/api/chat/request/${r.id}`, { userId: b.dataset.rqc });
          location.hash = `#/chat/${encodeURIComponent(x.id)}`;
        } catch (err) {
          toast(err.message);
          b.disabled = false;
        }
      };
    });
  }

  /* ---------- تفاصيل الطلب ---------- */
  function flowHtml(r) {
    const steps = [
      { t: 'محاسب الفرع', s: r.createdByName, cls: r.status === 'returned' ? 'back' : 'done', mark: r.status === 'returned' ? '↩' : '✓' },
    ];
    /* ملف التصفية مع سيارة: خطوات المحاسب (الطلب ومحضر السيارة) خطوة واحدة في المسار */
    const merge =
      isForm(r, 'settlementFile') && r.route[0] && r.route[0].task === 'deductions' && r.route.findIndex((x) => x.task === 'hr') > 0
        ? 1
        : 0;
    if (merge && !r.approvals[0] && r.status === 'pending' && r.step === 0)
      Object.assign(steps[0], { cls: 'cur', mark: 1, s: `${r.createdByName} - قيد إعداد محضر تسليم السيارة` });
    r.route.forEach((st, i) => {
      if (i < merge) return;
      let cls = '',
        mark = i + 2 - merge,
        s = st.name;
      const a = r.approvals[i];
      if (a) {
        cls = 'done';
        mark = '✓';
        s = `${a.name} - ${fmtDate(a.at)}`;
      } else if (r.status === 'pending' && r.step === i) {
        cls = 'cur';
        s = `${st.name} - قيد المراجعة الآن`;
      } else if (r.rejection && r.rejection.step === i) {
        cls = 'bad';
        mark = '✕';
        s = `${st.name} - رفض الطلب`;
      }
      steps.push({ t: st.label, s, cls, mark });
    });
    return `<div class="flow" style="grid-template-columns:repeat(${steps.length},1fr)">${steps.map((x) => `<div class="st ${x.cls}"><div class="dot">${x.mark}</div><div class="t">${esc(x.t)}</div><div class="s">${esc(x.s)}</div></div>`).join('')}</div>`;
  }
  return { flowHtml, eosCard, reqChatCard, eosModal, forwardModal };
};
