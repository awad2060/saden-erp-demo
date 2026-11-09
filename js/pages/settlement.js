'use strict';
/* صفحة «settlement» (viewSettle) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['settlement'] = function (S) {
  const {
    $,
    SF,
    api,
    defaultPayer,
    dt,
    embedBasicMissing,
    embedCollect,
    embedHide,
    embedPick,
    embedRestore,
    eosHint,
    eosToProgram,
    esc,
    fitFrame,
    fmtDate,
    head,
    loadFrame,
    payersList,
    shell,
    state,
    toast,
    today,
  } = S;
  /* تعبئة برنامج التصفية من ملف التصفية: بيانات الموظف وشئون الموظفين والخصومات والعهد والسيارة */
  function prefillSettlement(frame, d) {
    const doc = frame.contentDocument,
      w = frame.contentWindow;
    const hr = (d.tasks || {}).hr || {},
      car = (d.tasks || {}).traffic || null;
    const set = (el, v) => {
      if (!el || v == null || v === '') return;
      el.value = v;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const byId = (id) => doc.getElementById(id);
    set(byId('رقم_الإقامة'), d.iqama);
    set(byId('اسم_الموظف'), d.name);
    set(byId('الجنسية'), hr.nationality);
    /* "الشركة أو المؤسسة / الفرع / الوظيفة": الكفالة كما كتبتها شئون الموظفين، ثم الفرع والوظيفة كما هما */
    set(
      byId('الشركة_المؤسسة'),
      [hr.sponsorship || state.config.companyName || state.config.orgName, d.branch, d.job].filter(Boolean).join(' / '),
    );
    set(byId('الراتب_الأساسي'), hr.basic);
    set(byId('startDate'), hr.joinDate);
    set(byId('تاريخ_مباشرة_العمل'), hr.startWork || hr.lastReturn);
    set(byId('leaveDate'), hr.lastDay || d.lastDay);
    /* خانة "مدة الإجازة" في البرنامج (الثانية التي تحمل نفس المعرف) */
    set(doc.querySelectorAll('[id="الجنسية"]')[1], d.kind === 'تصفية نهائية' ? 'تصفية نهائية' : hr.leaveDuration);
    /* التصفية النهائية: سطر جاهز لمكافأة نهاية الخدمة في المستحقات (يكتب محاسب الرواتب مبلغها) */
    if (d.kind === 'تصفية نهائية') {
      const free = [...doc.querySelectorAll('#salaryTable tr')].find((x) => {
        const i = x.cells[0] && x.cells[0].querySelector('input');
        return i && !i.value.trim();
      });
      if (free) set(free.cells[0].querySelector('input'), 'مكافأة نهاية الخدمة');
    }
    /* الخصومات: كل نوع في سطره في البرنامج، والمبالغ تُجمع والبيانات تُضم */
    const ROW = { سلف: 0, 'مصروفات إدارية': 1, 'مخالفات مرورية': 2, 'عهدة نقدية': 3, 'خصومات أخرى': 4 };
    const acc = [0, 1, 2, 3, 4].map(() => ({ amount: 0, details: [] }));
    (d.deductions || []).forEach((x) => {
      const i = ROW[x.type] ?? 4;
      acc[i].amount += Number(x.amount) || 0;
      if (x.details) acc[i].details.push(x.details);
    });
    if (car && Number(car.damages)) {
      acc[4].amount += Number(car.damages);
      acc[4].details.push(`على السيارة ${car.plate || ''} (${car.condition || ''})`);
    }
    const rows = [...doc.querySelectorAll('#discountTable tr')].slice(1, 6);
    rows.forEach((tr, i) => {
      const ins = tr.querySelectorAll('input');
      if (acc[i].details.length) set(ins[0], acc[i].details.join('، '));
      if (acc[i].amount) set(ins[1], acc[i].amount);
    });
    /* العهد العينية: سيارة، جوال، شريحة، لاب توب */
    const cust = byId('phoneRecipient') && byId('phoneRecipient').closest('table');
    if (cust) {
      const CUST = { سيارة: 0, جوال: 1, 'شريحة إتصال': 2, 'لاب توب': 3 };
      const tr = cust.querySelectorAll('tr');
      const mark = (i, who) => {
        const ins = tr[i] && tr[i].querySelectorAll('input');
        if (!ins) return;
        ins[0].checked = true;
        set(ins[1], who);
      };
      (d.assets || []).forEach((x) => {
        if (CUST[x.type] !== undefined) mark(CUST[x.type], x.receiver || '');
      });
      if (car) mark(0, [SF.carSpec(car), `المستلم: ${car.receiver || 'إدارة الحركة'}`, fmtDate(car.date)].filter(Boolean).join(' — '));
      else if (d.hasCar === 'نعم') mark(0, 'إدارة الحركة — حسب محضر التسليم المعتمد (مرفق بالملف)');
    }
    ['calculateFinalLeave', 'calculateTotalSalary', 'calculateTotalDeductions', 'calculateNetSalary'].forEach((fn) => {
      try {
        if (typeof w[fn] === 'function') w[fn]();
      } catch {
        /* تجاهل */
      }
    });
  }

  async function viewSettle(id) {
    const r = await api('GET', `/api/requests/${id}`);
    const form = SF.byId[r.type];
    const cur = r.route[r.step];
    if (!form || !form.flow || !r.perms.canAct || !cur || cur.task !== 'settlement') {
      location.hash = `#/req/${id}`;
      return;
    }
    const em = form.embed;
    const main = shell('', '#/inbox');
    main.innerHTML = `${head(`إعداد التصفية — ملف <bdi dir="ltr">${esc(r.serial)}</bdi>`, `${esc(r.data.kind)}: ${esc(r.data.name)} — البيانات معبأة من الملف، أكمل المستحقات ثم أرسل`, `<a class="btn" href="#/req/${r.id}">رجوع للملف</a>`)}
      ${r.data.notes ? `<div class="need-att">ملاحظة المحاسب: ${esc(r.data.notes)}</div>` : ''}
      <div class="card embed-card"><iframe class="embed-frame" id="emb" title="برنامج التصفية"></iframe></div>
      <div class="card embed-actions"><div id="eerr"></div>
        <div class="embed-bar"><div class="field"><label>يستلم من (في المخالصة)</label><input class="in" id="spayer" list="dl-payers" value="${esc(defaultPayer(r.data))}" style="min-width:260px">${payersList(r.data)}</div>
          <div class="field"><label>تحمّلها على مصروف رواتب شهر <span class="req">*</span></label><input class="in" type="month" id="spm" value="${esc(r.data.payMonth || today().slice(0, 7))}"></div>
          <div class="field"><label>ملاحظة (اختياري)</label><input class="in" id="snote"></div>
          <button class="btn" id="sEdit" hidden>✏️ تعديل</button><button class="btn" id="sSave">💾 حفظ التصفية</button><button class="btn primary" id="sendBtn">📤 إرسال التصفية للاعتماد</button></div>
        <div class="hint" id="sSaved" style="margin-top:6px">${r.data.settleDraft ? `آخر حفظ: ${esc(dt(r.data.settleDraft.at))} — ${esc(r.data.settleDraft.byName || '')}` : 'يمكنك حفظ التصفية والرجوع لإكمالها لاحقاً قبل إرسالها للاعتماد'}</div>
        ${r.data.kind === 'تصفية نهائية' ? `<div class="hint" id="sEosHint" style="margin-top:6px">${eosHint(r)}</div>` : ''}
        <div class="hint" style="margin-top:6px">بعد الإرسال تمر على: ${esc(
          r.route
            .slice(r.step + 1)
            .map((x) => x.label)
            .join(' ← '),
        )}</div></div>`;
    const frame = $('#emb');
    await loadFrame(frame, em.src);
    if (r.data.state) embedRestore(frame, em, r.data.state);
    else prefillSettlement(frame, r.data);
    embedHide(frame, em.hide);
    fitFrame(frame);
    frame.contentDocument.addEventListener('input', () => fitFrame(frame));
    /* بعد الحفظ يُقفل البرنامج للقراءة، و"تعديل" يفتحه؛ والتصفية المحفوظة سابقاً تُفتح مقفلة */
    const lock = (on) => {
      frame.classList.toggle('embed-locked', on);
      $('#sEdit').hidden = !on;
      $('#sSave').hidden = on;
    };
    lock(!!r.data.settleDraft);
    $('#sEdit').onclick = () => lock(false);
    /* المبلغ المسجل من صفحة الملف ينزل تلقائياً في سطر "مكافأة نهاية الخدمة" */
    if (r.data.kind === 'تصفية نهائية' && r.data.eosQiwa && String(Number(embedPick(frame, em).eos) || 0) !== String(r.data.eosQiwa.amount))
      eosToProgram(frame, r.data.eosQiwa.amount);
    wireSettle(em, frame, lock, r);
  }
  /* أحداث viewSettle: #sSave، #sendBtn */
  function wireSettle(em, frame, lock, r) {
    $('#sSave').onclick = async () => {
      const pick = embedPick(frame, em);
      $('#eerr').innerHTML = '';
      $('#sSave').disabled = true;
      try {
        const x = await api('PUT', `/api/requests/${r.id}/settle-draft`, {
          payMonth: $('#spm').value,
          taskData: { ...pick, payer: $('#spayer').value.trim(), state: embedCollect(frame, em) },
        });
        r.data = x.data;
        $('#sSaved').textContent = `آخر حفظ: ${dt(x.data.settleDraft.at)} — ${x.data.settleDraft.byName || ''}`;
        toast('تم حفظ التصفية — يمكنك الرجوع وتعديلها قبل الإرسال');
        lock(true);
      } catch (err) {
        $('#eerr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
      $('#sSave').disabled = false;
    };
    $('#sendBtn').onclick = async () => {
      const pick = embedPick(frame, em);
      if (!pick.name || !pick.iqama) {
        $('#eerr').innerHTML = '<div class="err">اسم الموظف ورقم الإقامة مطلوبان في البرنامج</div>';
        return;
      }
      if (embedBasicMissing(frame)) {
        lock(false);
        $('#eerr').innerHTML = '<div class="err">الراتب الأساسي مطلوب في برنامج التصفية — لا تكتمل التصفية بدونه</div>';
        return;
      }
      if (
        r.data.kind === 'تصفية نهائية' &&
        !Number(pick.eos) &&
        !confirm('لم تكتب مبلغاً في سطر "مكافأة نهاية الخدمة" بالبرنامج، وسيظهر فارغاً في المخالصة. متابعة؟')
      )
        return;
      if (
        r.data.kind === 'تصفية نهائية' &&
        Number(pick.eos) &&
        !r.attachments.some((a) => a.label === SF.EOS_ATT) &&
        !confirm('لم ترفق نتيجة حاسبة قوى لمكافأة نهاية الخدمة. متابعة بدون المرفق؟')
      )
        return;
      if (!$('#spm').value) {
        $('#eerr').innerHTML = '<div class="err">حدد مصروف رواتب الشهر الذي تحمّل عليه التصفية</div>';
        return;
      }
      if (!confirm('إرسال التصفية للاعتماد؟')) return;
      $('#sendBtn').disabled = true;
      try {
        await api('POST', `/api/requests/${r.id}/action`, {
          action: 'approve',
          note: $('#snote').value,
          payMonth: $('#spm').value,
          taskData: { ...pick, payer: $('#spayer').value.trim(), state: embedCollect(frame, em) },
        });
        toast('تم إرسال التصفية للاعتماد');
        location.hash = `#/req/${r.id}`;
      } catch (err) {
        $('#eerr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
        $('#sendBtn').disabled = false;
      }
    };
  }

  return { viewSettle };
};
