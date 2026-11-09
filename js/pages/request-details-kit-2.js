'use strict';
/* أجزاء request-details (2) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['request-details-2'] = function (S, ctx) {
  const {
    $,
    $$,
    ACCEPT,
    ACTIONS,
    SF,
    api,
    askText,
    attachmentPages,
    canEditPayer,
    carCtx,
    caseCtx,
    chip,
    clearanceCtx,
    collect,
    defaultPayer,
    dt,
    esc,
    fieldHtml,
    fillEmbeds,
    fitLetters,
    fmtNum,
    head,
    letterCtx,
    offerCtx,
    payersList,
    prMonth,
    refreshStats,
    reqMailCard,
    retCreator,
    route,
    sar,
    sheetLetterCtx,
    shell,
    state,
    toast,
    today,
    uploadFile,
  } = S;
  const { closePapers, clrFields, eosCard, eosModal, flowHtml, forwardModal, isForm, reqChatCard, sendClosePapers, viewRequestPart6 } = ctx;
  async function viewRequest(id) {
    await refreshStats();
    const r = await api('GET', `/api/requests/${id}`);
    const form = SF.byId[r.type];
    const back = r.perms.canAct ? '#/inbox' : state.user.role === 'accountant' ? '#/mine' : '#/all';
    const main = shell('', back);
    const p = r.perms;
    const isLast = r.step === r.route.length - 1;
    /* خطوة مهمة في دورة التصفية (شئون الموظفين / الحركة / إعداد التصفية) */
    const task = p.canAct && r.route[r.step] && r.route[r.step].task;
    const tk = r.data.tasks || {};
    const had = (k, rows) => r.data[k] || ((rows || []).length ? 'يوجد' : '');
    const taskVals = task === 'deductions' ? requestValue26(had, r, tk) : requestHtml(r, task, tk);
    viewRequestPart4(r, task, taskVals);
    const ownStep = requestValue19(task) || task === 'dmClose';
    /* مرحلة إبداء الرأي (طلب محال لمستخدم ليكتب رأيه ثم يرجع) */
    const consultStep = requestValue20(p, r) ? r.route[r.step].consult : null;
    const vehPaper = (r.attachments || []).filter((a) => a.label === SF.VEH_PAPER);
    /* ملف التصفية (الدورة الجديدة) مع سيارة: خطوات المحضر كلها من صفحة الملف */
    const carStep = task === 'deductions' && isForm(r, 'settlementFile') && r.route.findIndex((x) => x.task === 'hr') > r.step;
    const carPanel = (...args) => requestCarPanel(r, ...args);
    /* المستند الموقّع الذي يغلق الملف بعد الاعتماد النهائي (المخالصة / العرض الوظيفي) */
    const cd = SF.closeDoc(r.type);
    const carPaper = (r.attachments || []).filter((a) => a.label === SF.CAR_PAPER);
    renderViewRequest(carPanel, carPaper, carStep, cd, consultStep, form, isLast, main, ownStep, p, r, task, taskVals, vehPaper);
    viewRequestPart2(main, r);
    /* نموذج المهمة: إضافة وحذف صفوف الجداول، وإظهار محضر السيارة عند اختيار "نعم" */
    const tf = $('.task-form', main);
    if (tf) {
      viewRequestPart6(r, task, tf);
    }
    return viewRequestPart3(carPaper, cd, main, r, task, vehPaper);
  }
  /* محتوى viewRequest (HTML) */
  function renderViewRequest(carPanel, carPaper, carStep, cd, consultStep, form, isLast, main, ownStep, p, r, task, taskVals, vehPaper) {
    main.innerHTML = `${requestValue17(p, r)}
      <div class="card" style="margin-bottom:16px;overflow-x:auto">${flowHtml(r)}</div>
      <div class="detail">
        <div>
          <div class="preview-wrap" style="max-height:none">${SF.renderLetter(r.type, r.data, letterCtx(r))}</div>
          ${requestValue10(r)}
          ${requestValue4(form, r)}
          ${requestValue11(form, r)}
          ${requestValue12(form, r)}
          ${requestValue13(form, r)}
          ${requestValue14(form, r)}
          ${requestValue15(r)}
        </div>
        <div>
          ${requestValue18(cd, p, r)}
          ${requestHtml5(cd, r)}
          ${r.sheet ? `<div class="card"><h3>البيان المعتمد من مدير الفرع</h3><a href="#/req/${r.sheet.id}"><bdi dir="ltr">${esc(r.sheet.serial)}</bdi></a> ${chip(r.sheet)}<div class="hint">تطبع البيان مع الخطاب في نفس الملف</div></div>` : ''}
          ${r.letter ? `<div class="card"><h3>خطاب إعتماد الصرف</h3><a href="#/req/${r.letter.id}"><bdi dir="ltr">${esc(r.letter.serial)}</bdi></a> ${chip(r.letter)}<div class="hint">أنشأه النظام تلقائياً بعد اعتماد مدير الفرع للبيان</div></div>` : ''}
          ${requestValue21(r)}
          ${r.transfer ? `<div class="card"><h3>قرار النقل المرتبط</h3><div class="row" style="gap:8px;align-items:center"><a href="#/req/${r.transfer.id}"><bdi dir="ltr">${esc(r.transfer.serial)}</bdi></a> ${chip(r.transfer)}</div><div class="hint" style="margin-top:6px">تكمل شئون الموظفين أسماء الموظفين وترسل القرار في دورة النقل المعتادة.</div></div>` : ''}
          ${requestValue9(r)}
          ${requestValue16(p, r, task)}
          ${requestHtml2(form, p, r, task)}
           ${eosCard(r, p.canAct && task === 'settlement')}
           ${p.canAct ? requestValue8(carPanel, carPaper, carStep, consultStep, form, isLast, ownStep, p, r, task, taskVals, vehPaper) : ''}
          <div id="rqChat"></div>
          ${reqMailCard(r)}
          <div class="card"><h3>بيانات الطلب</h3><dl class="kv">
            <dt>نوع الطلب</dt><dd>${esc(r.typeTitle)}</dd><dt>الفرع</dt><dd>${esc(r.branch)}</dd>
            <dt>مقدم الطلب</dt><dd>${esc(r.createdByName)}</dd><dt>تاريخ الرفع</dt><dd>${esc(dt(r.createdAt))}</dd>
            <dt>الحالة</dt><dd>${chip(r)}</dd>${r.amount ? `<dt>المبلغ</dt><dd><b>${esc(fmtNum(r.amount))}</b> ريال</dd>` : ''}
          </dl></div>
          ${r.doaWarn ? `<div class="card gv-doa">⚖️ <b>تجاوز حد تفويض الصلاحيات:</b> مبلغ الطلب ${fmtNum(r.doaWarn.amount)} ريال أعلى من حد اعتماد ${esc(r.doaWarn.name)} (${fmtNum(r.doaWarn.limit)} ريال — ${esc(r.doaWarn.scope)}). راجع مسار الاعتماد أو صعّد الطلب لصاحب الصلاحية.</div>` : ''}
          ${requestValue22(r)}
          <div class="card"><h3>المرفقات</h3>
            ${requestHtml6(r)}
            ${r.attachments.length ? `<ul class="files">${r.attachments.map((a) => `<li><a href="/api/requests/${r.id}/attachments/${a.id}" target="_blank">📎 ${a.label ? `<b>${esc(a.label)}:</b> ` : ''}${esc(a.name)}</a><span class="row"><small class="muted">${Math.ceil(a.size / 1024)} KB</small>${SF.cap(state.user, 'deleteAttachments') || (p.canUpload && a.by === state.user.id) ? `<button class="btn sm ghost" data-del="${a.id}" title="حذف">✕</button>` : ''}</span></li>`).join('')}</ul>` : '<div class="muted" style="margin-bottom:10px">لا توجد مرفقات</div>'}
            ${requestHtml4(p, r)}
          </div>
          ${requestValue23(r)}
          ${requestValue2(p, r)}
          ${p.canCancelDed ? '<div class="card"><h3>تظلم الموظف</h3><p class="muted" style="margin-top:0">للشئون القانونية: إلغاء قرار الخصم المعتمد مع ذكر السبب — لا يحتسبه النظام في مسيرات الرواتب بعد الإلغاء.</p><button class="btn bad" id="cancelDed">⛔ إلغاء قرار الخصم</button></div>' : ''}
          <div class="card"><h3>سجل الإجراءات</h3><ul class="timeline">
            ${requestHtml7(r)}
          </ul></div>
        </div>
      </div>`;
  }
  /* جزء من viewRequest: r.history… */
  function requestHtml7(r) {
    return r.history
      .slice()
      .reverse()
      .map(
        (h) =>
          `<li class="${h.action}"><b>${esc(ACTIONS[h.action] || h.action)}</b>${h.stepLabel ? ` <small class="muted">(${esc(h.stepLabel)})</small>` : ''}<div class="when">${esc(h.byName)} — ${esc(dt(h.at))}</div>${h.amount ? `<div class="note">القيمة المعتمدة: ${esc(fmtNum(h.amount))} ريال</div>` : ''}${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}</li>`,
      )
      .join('');
  }
  /* جزء من viewRequest: {… */
  function requestValue26(had, r, tk) {
    return {
      deductions: r.data.deductions,
      assets: r.data.assets,
      hasDed: had('hasDed', r.data.deductions),
      hasAssets: had('hasAssets', r.data.assets),
      hasCar: r.data.hasCar,
      ...(tk.traffic || {}),
    };
  }
  /* جزء من viewRequest: sw && ld && wd… */
  function requestValue25(ld, sw, wd) {
    return sw && ld && wd;
  }
  /* جزء من viewRequest: `<div class="${A.found ? 'auto-ok' : 'need-att'}" style="mar… */
  function requestValue24(A) {
    return `<div class="${A.found ? 'auto-ok' : 'need-att'}" style="margin-bottom:10px">${A.found ? `✔ البيانات مرتبطة بسجل الموظفين (${esc(A.empName)})` : '⚠ الموظف غير موجود في سجل الموظفين برقم الهوية — أدخل البيانات يدوياً'}${A.lastDaySerial ? ` — نموذج آخر يوم دوام: <a href="#/req/${esc(A.lastDayId)}"><bdi dir="ltr">${esc(A.lastDaySerial)}</bdi></a>` : ''}</div>`;
  }
  /* جزء من viewRequest: r.data.dedCancelled ? `<div class="card emp-al bad"><b>⛔ قرا… */
  function requestValue23(r) {
    return r.data.dedCancelled
      ? `<div class="card emp-al bad"><b>⛔ قرار الخصم ملغى</b> — بواسطة ${esc(r.data.dedCancelled.byName)} في ${esc(dt(r.data.dedCancelled.at))}<div>السبب: ${esc(r.data.dedCancelled.reason)}</div>${r.data.dedCancelled.payrun ? `<div>كان الخصم ضمن مسير ${esc(r.data.dedCancelled.payrun)} المعتمد — ترده الإدارة للموظف في المسير التالي (إضافات أخرى)</div>` : ''}</div>`
      : '';
  }
  /* جزء من viewRequest: r.missingAttachments && r.missingAttachments.length ? `<div … */
  function requestHtml6(r) {
    return r.missingAttachments && r.missingAttachments.length
      ? `<div class="need-att">⚠ مرفقات مطلوبة غير موجودة: ${esc(r.missingAttachments.join('، '))}</div>`
      : '';
  }
  /* جزء من viewRequest: r.cancel ? `<div class="card cancel-box"><h3>⛔ سبب الإلغاء</… */
  function requestValue22(r) {
    return r.cancel
      ? `<div class="card cancel-box"><h3>⛔ سبب الإلغاء</h3><p style="margin:0">${esc(r.cancel.reason)}</p><div class="muted" style="font-size:12.5px;margin-top:6px">ألغاه ${esc(r.cancel.by)}${r.cancel.at ? ` — ${esc(dt(r.cancel.at))}` : ''}</div></div>`
      : '';
  }
  /* جزء من viewRequest: isForm(r, 'vehicleRecord') && r.data.caseId ? `<div class="c… */
  function requestValue21(r) {
    return isForm(r, 'vehicleRecord') && r.data.caseId
      ? `<div class="card">🔗 مرتبط بملف التصفية: <a href="#/req/${esc(r.data.caseId)}">فتح ملف التصفية</a></div>`
      : '';
  }
  /* جزء من viewRequest: p.canAct && r.route[r.step] && r.route[r.step].consult… */
  function requestValue20(p, r) {
    return p.canAct && r.route[r.step] && r.route[r.step].consult;
  }
  /* جزء من viewRequest: task === 'deductions' || task === 'forward' || task === 'veh… */
  function requestValue19(task) {
    return task === 'deductions' || task === 'forward' || task === 'vehSign';
  }
  /* جزء من viewRequest: r.closedAt && cd… */
  function requestHtml5(cd, r) {
    return r.closedAt && cd
      ? `<div class="card clr-done">✔ <b>الملف مغلق</b> — ${closePapers(r).map(esc).join(' و')} — بتاريخ ${esc(dt(r.closedAt))}${r.attachments
          .filter((a) => closePapers(r).includes(a.label))
          .map((a) => `<div><a href="/api/requests/${r.id}/attachments/${a.id}" target="_blank">📎 ${esc(a.name)}</a></div>`)
          .join('')}</div>`
      : '';
  }
  /* جزء من viewRequest: p.canUploadClearance && cd… */
  function requestValue18(cd, p, r) {
    return p.canUploadClearance && cd
      ? `<div class="card act-box clr-box"><h3>🖊️ ${esc(cd.title)}</h3>
            <div class="hint" style="margin-bottom:10px">${cd.box}</div>
            <a class="btn" href="#/print/${r.id}" target="_blank" style="margin-bottom:10px">🖨️ طباعة ${esc(cd.doc)}</a>
            ${clrFields(r)}
            <div id="clrErr"></div>
            <button class="btn ok" id="clrSend" style="margin-top:10px">⬆ رفع المستندات</button></div>`
      : '';
  }
  /* جزء من viewRequest: head(… */
  function requestValue17(p, r) {
    return head(
      `طلب رقم <bdi dir="ltr">${esc(r.serial)}</bdi>`,
      `${esc(r.typeTitle)} — ${chip(r)}`,
      `
        <a class="btn" href="#/print/${r.id}" target="_blank">🖨️ طباعة</a>
        <button class="btn primary" data-pdf="${r.id}">⬇ تنزيل PDF</button>
        ${p.canEdit ? `<a class="btn primary" href="#/edit/${r.id}">✏️ تعديل وإعادة الإرسال</a>` : ''}
        ${p.canCancel ? '<button class="btn bad" id="cancelBtn">إلغاء الطلب</button>' : ''}
        ${SF.cap(state.user, 'deleteRequests') ? '<button class="btn bad" id="deleteBtn">🗑️ حذف</button>' : ''}`,
    );
  }
  /* جزء من viewRequest: r.vehicle && !(p.canAct && task === 'deductions') ? `<div cl… */
  function requestValue16(p, r, task) {
    return r.vehicle && !(p.canAct && task === 'deductions')
      ? `<div class="card"><h3>محضر تسليم وتسلم السيارة</h3><a href="#/req/${r.vehicle.id}"><bdi dir="ltr">${esc(r.vehicle.serial)}</bdi></a> ${chip(r.vehicle)}</div>`
      : '';
  }
  /* جزء من viewRequest: isForm(r, 'settlementFile') && (r.attachments.length || r.la… */
  function requestValue15(r) {
    return isForm(r, 'settlementFile') && (r.attachments.length || r.lastDayDoc)
      ? '<h3 class="companion-h">📎 مرفقات الملف</h3><div class="req-att" id="reqAtt"></div>'
      : '';
  }
  /* جزء من viewRequest: form && form.flow && r.data.state… */
  function requestValue14(form, r) {
    return form && form.flow && r.data.state
      ? `<h3 class="companion-h">ملاحق ملف التصفية</h3>
          <div class="preview-wrap appendix-wrap" style="max-height:none">${SF.renderCaseAppendix(r.data, caseCtx(r))}</div>`
      : '';
  }
  /* جزء من viewRequest: form && form.companion === 'offer' && r.status === 'approved… */
  function requestValue13(form, r) {
    return form && form.companion === 'offer' && r.status === 'approved'
      ? `<h3 class="companion-h">العرض الوظيفي (يتولد تلقائياً بعد الاعتماد النهائي)</h3>
          <div class="preview-wrap" style="max-height:none">${SF.renderJobOffer(r.data, offerCtx(r))}</div>`
      : '';
  }
  /* جزء من viewRequest: form && form.companion === 'licenseAck' && r.status === 'app… */
  function requestValue12(form, r) {
    return form && form.companion === 'licenseAck' && r.status === 'approved'
      ? `<h3 class="companion-h">إقرار مصروفات رخصة القيادة (يتولد تلقائياً بعد الاعتماد — يوقّعه الموظف ويُرفع لإغلاق الطلب)</h3>
          <div class="preview-wrap" style="max-height:none">${SF.renderLicenseAck(r.data, { ...clearanceCtx(r), amount: r.amount })}</div>`
      : '';
  }
  /* جزء من viewRequest: form && form.companion === 'allowanceLetter' && r.data.combi… */
  function requestValue11(form, r) {
    return form && form.companion === 'allowanceLetter' && r.data.combined
      ? `<h3 class="companion-h">خطاب إعتماد الصرف (يتولد تلقائياً من البيان ويُعتمد معه)</h3>
          <div class="preview-wrap" style="max-height:none">${SF.renderLetter('allowanceLetter', SF.sheetLetterData(r.data, r.branch), sheetLetterCtx(r))}</div>`
      : '';
  }
  /* جزء من viewRequest: p.canUpload ? `${r.missingAttachments && r.missingAttachment… */
  function requestHtml4(p, r) {
    return p.canUpload
      ? `${r.missingAttachments && r.missingAttachments.length ? `<select class="in" id="uplLabel" style="margin-bottom:8px"><option value="">مرفق عام</option>${r.missingAttachments.map((l) => `<option selected>${esc(l)}</option>`).join('')}</select>` : ''}<input type="file" class="in" id="upl" multiple accept="${ACCEPT}"><div class="hint">حتى ${state.config.maxUploadMb || 5} ميجابايت للملف، ويمكن اختيار عدة ملفات</div>`
      : '';
  }
  /* جزء من viewRequest: isForm(r, 'settlementFile') && r.data.car && !r.vehicle && r… */
  function requestValue10(r) {
    return isForm(r, 'settlementFile') && r.data.car && !r.vehicle && r.route.some((s) => s.task === 'carApprove')
      ? `<h3 class="companion-h">محضر تسليم وتسلم السيارة (مرفوع مع الملف)</h3><div class="preview-wrap" style="max-height:none">${SF.renderLetter('vehicleHandover', r.data.car, carCtx(r))}</div>`
      : '';
  }
  /* جزء من viewRequest: r.issue… */
  function requestValue9(r) {
    return r.issue
      ? `<div class="card"><h3>إذن الصرف من المخزن</h3><div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><a href="#/req/${r.issue.id}"><bdi dir="ltr">${esc(r.issue.serial)}</bdi></a> ${chip(r.issue)}</div>
            <div class="tbl-wrap"><table class="tbl"><thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>${(
              r.issue.data.items || []
            )
              .filter((x) => x.product)
              .map(
                (x) =>
                  `<tr><td>${esc(x.product)}</td><td>${esc(x.qty)}</td><td>${esc(sar(x.price))}</td><td>${esc(sar((Number(x.qty) || 0) * (Number(x.price) || 0)))}</td></tr>`,
              )
              .join('')}</tbody></table></div>
            ${(r.issue.data.posted || []).length ? `<div class="hint" style="margin-top:6px">صُرفت من المخزن بالحركة: ${r.issue.data.posted.map((x) => esc(x.docNo)).join('، ')}</div>` : ''}<a class="btn sm" href="#/req/${r.issue.id}" style="margin-top:8px">فتح إذن الصرف</a></div>`
      : '';
  }
  /* جزء من viewRequest: `<div class="card act-box"><h3>${task ? esc(SF.TASKS[task].l… */
  function requestValue8(carPanel, carPaper, carStep, consultStep, form, isLast, ownStep, p, r, task, taskVals, vehPaper) {
    return `<div class="card act-box"><h3>${task ? esc(SF.TASKS[task].label) : `قرارك (${esc(r.stepLabel)})`}</h3>
            ${task === 'mfgQuote' ? `<div class="mq-box">${r.quote ? `<div>✔ عرض السعر <a href="#/req/${esc(r.quote.id)}"><b>${esc(r.quote.serial)}</b></a> — ${esc(r.quote.summary || '')}</div><a class="btn sm" href="#/new/priceQuote?mfg=${esc(r.id)}&from=${esc(r.quote.id)}">✏️ تعديل عرض السعر</a>` : `<a class="btn primary" href="#/new/priceQuote?mfg=${esc(r.id)}">📝 إعداد عرض سعر</a><div class="hint">يفتح النظام نموذج عرض السعر ببيانات الطلب ومرتبطاً به. بعد حفظه يرجع هنا: اكتب موعد التسليم وأرسله لمدير الفرع.</div>`}</div>` : ''}
            ${carStep ? carPanel() : ''}
            ${requestHtml3(carStep, r, task, taskVals)}
            ${
              task === 'vehSign'
                ? `<div class="car-paper" style="margin-bottom:10px"><p style="margin-top:0">1) اطبع المحضر &nbsp; 2) يوقّعه المسلِّم والمستلم &nbsp; 3) ارفع صورته هنا ثم أرسله لإدارة الحركة</p>
              <a class="btn" href="#/print/${r.id}" target="_blank" style="margin-bottom:10px">🖨️ طباعة المحضر للتوقيع</a>
              ${vehPaper.length ? `<div style="margin-bottom:6px">✔ مرفوع: ${vehPaper.map((a) => `<a href="/api/requests/${r.id}/attachments/${a.id}" target="_blank">📎 ${esc(a.name)}</a>`).join('، ')}</div>` : ''}
              <div class="field"><label>${vehPaper.length ? 'استبدال المحضر الموقّع (اختياري)' : 'المحضر الموقّع من المسلِّم والمستلم'}${vehPaper.length ? '' : '<span class="req">*</span>'}</label><input type="file" class="in" id="vehFile" accept=".pdf,.png,.jpg,.jpeg"></div></div>`
                : ''
            }
            ${
              task === 'carApprove'
                ? `<div class="car-paper" style="margin-bottom:10px"><b>المحضر الموقّع من المسلِّم والمستلم:</b>
              ${vehPaper.length ? vehPaper.map((a) => `<div><a href="/api/requests/${r.id}/attachments/${a.id}" target="_blank">📎 ${esc(a.name)}</a></div>`).join('') : '<div class="muted">لم ترفعه</div>'}<div class="hint" style="margin-top:6px">راجع بيانات المحضر أسفل الخطاب. بعد الاعتماد يسجّل النظام المحضر في الأسطول ويحوّل الملف لشئون الموظفين.</div></div>`
                : ''
            }
            ${
              task === 'traffic'
                ? `<div class="car-paper" style="margin-bottom:10px"><b>المحضر الورقي الموقّع من المسلِّم والمستلم:</b>
              ${carPaper.length ? carPaper.map((a) => `<div><a href="/api/requests/${r.id}/attachments/${a.id}" target="_blank">📎 ${esc(a.name)}</a></div>`).join('') : '<div class="muted">لم ترفعه</div>'}</div>`
                : ''
            }
            ${task === 'forward' ? `<p class="muted" style="margin-top:0">اعتمدت إدارة الحركة محضر تسليم السيارة. وجّه الملف الآن لمحاسب إدارة الرواتب ليعدّ التصفية.</p>` : ''}
            ${requestValue5(r, task)}
            ${r.route[r.step] && r.route[r.step].userId !== state.user.id ? `<div class="hint" style="margin-bottom:10px">يسجّل النظام قرارك نيابة عن ${esc(r.stepUser)}</div>` : ''}
            ${requestValue6(p, r, task)}
            ${requestValue3(form, r, task)}
            <div class="field"${carStep ? ' hidden' : ''}><label>ملاحظات / القرار</label><textarea class="in" id="aNote" rows="3" placeholder="مطلوبة عند الرفض أو الإعادة"></textarea></div>
            <div id="aerr"></div>
            ${consultStep ? `<div class="fwd-note">↪ أحاله إليك <b>${esc(consultStep.byName)}</b> لإبداء الرأي${consultStep.note ? `: ${esc(consultStep.note)}` : ''} — اكتب رأيك في الملاحظات ثم أرجعه</div>` : ''}
            <div class="row" style="margin-top:12px">${requestValue(carStep, consultStep, isLast, task)}${requestValue7(consultStep, ownStep, r)}${consultStep ? '' : '<button class="btn" data-fwd>↪ إعادة توجيه</button>'}</div>
            ${!isLast && !consultStep ? `<div class="hint" style="margin-top:8px">سيُحوَّل إلى: ${esc(r.route[r.step + 1].label)} (${esc(r.route[r.step + 1].name)})</div>` : ''}
            ${r.route[r.step] && r.route[r.step].fwdFrom ? `<div class="hint" style="margin-top:6px">↪ حُوِّلت هذه المرحلة إليك من ${esc(r.route[r.step].fwdFrom.name)}</div>` : ''}
          </div>`;
  }
  /* جزء من viewRequest: ownStep || consultStep ? '' : `${r.step > 0 && r.route && r.… */
  function requestValue7(consultStep, ownStep, r) {
    return ownStep || consultStep
      ? ''
      : `${r.step > 0 && r.route && r.route[r.step - 1] ? `<button class="btn warn" data-act="return" data-to="prev" title="${esc(r.route[r.step - 1].name)}">↩ إعادة إلى ${esc(r.route[r.step - 1].label)}</button>` : ''}<button class="btn warn" data-act="return" data-to="creator" title="${esc(r.createdByName)}">↩ ${retCreator(r)}</button><button class="btn bad" data-act="reject">✕ رفض</button>`;
  }
  /* جزء من viewRequest: !task && p.payAsk ? `<div class="field" style="margin-bottom… */
  function requestValue6(p, r, task) {
    return !task && p.payAsk
      ? `<div class="field" style="margin-bottom:10px"><label>ينزل في رواتب شهر <span class="req">*</span></label><input class="in" type="month" id="aPayM" value="${esc(r.data.payMonth || today().slice(0, 7))}" style="width:auto"><div class="hint">${SF.PAY_ALLOW[r.type] ? 'بعد الاعتماد النهائي يتعدل راتب الموظف في ملفه تلقائياً من هذا الشهر، ويظهر في بيان رواتب فرعه' : isForm(r, 'managerDeduction') ? 'بعد الاعتماد النهائي ينزل الخصم مرة واحدة في عمود الجزاءات ببيان رواتب فرع الموظف لهذا الشهر' : 'بعد الاعتماد النهائي تصرفه الإدارة مرة واحدة في «مستحقات أخرى» ببيان رواتب فرع الموظف لهذا الشهر'}</div></div>`
      : '';
  }
  /* جزء من viewRequest: task === 'settlement'… */
  function requestValue5(r, task) {
    return task === 'settlement'
      ? `<p class="muted" style="margin-top:0">اكتملت بيانات شئون الموظفين${r.data.hasCar === 'نعم' ? ' وتسليم السيارة' : ''}. افتح برنامج التصفية، وستجد بيانات الموظف والخصومات والعهد معبأة تلقائياً، ثم أكمله وأرسله للاعتماد.</p>
              ${r.data.settleDraft ? `<div class="hint" style="margin-bottom:8px">💾 التصفية محفوظة (لم ترسلها) — آخر حفظ: ${esc(dt(r.data.settleDraft.at))}</div>` : ''}<a class="btn primary" href="#/settle/${r.id}" style="margin-bottom:12px">${r.data.settleDraft ? '✏️ تعديل التصفية' : r.data.state ? '📝 متابعة إعداد التصفية' : '📝 إعداد التصفية في البرنامج'}</a>`
      : '';
  }
  /* جزء من viewRequest: form && form.companion === 'clearance' && (!form.flow || r.d… */
  function requestValue4(form, r) {
    return form && form.companion === 'clearance' && (!form.flow || r.data.state)
      ? `<h3 class="companion-h">إقرار المخالصة (يتولد تلقائياً من التصفية)</h3>
          ${
            canEditPayer(r)
              ? `<div class="card payer-box"><div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">
            <div class="field" style="flex:1;min-width:220px"><label>يستلم الموظف من (في المخالصة)</label><input class="in" id="payerIn" list="dl-payers" value="${esc(r.data.payer || defaultPayer(r.data))}">${payersList(r.data)}</div>
            <button class="btn" id="payerSave">💾 حفظ</button></div>
            <div class="hint">اختر سادن أو الشركة التابعة التي على كفالتها الموظف، أو اكتب الاسم. يحفظه النظام في سجل الطلب.</div></div>`
              : ''
          }
          <div class="preview-wrap" style="max-height:none">${SF.renderClearance(r.data, clearanceCtx(r))}</div>`
      : '';
  }
  /* جزء من viewRequest: !task && ((form && form.needsValue) || r.amount) ? `<div cla… */
  function requestValue3(form, r, task) {
    return !task && ((form && form.needsValue) || r.amount)
      ? `<div class="field" style="margin-bottom:10px"><label>القيمة المعتمدة (ريال)${form && form.needsValue ? '' : ' — اختياري'}</label><input class="in" type="number" step="0.01" min="0" id="aAmount" value="${esc(r.amount || '')}"></div>`
      : '';
  }
  /* جزء من viewRequest: task && task !== 'settlement' && task !== 'forward' && !carS… */
  function requestHtml3(carStep, r, task, taskVals) {
    return task && task !== 'settlement' && task !== 'forward' && !carStep
      ? `<div class="task-form">
              <div class="grid2">${SF.TASKS[task].fields
                .filter(
                  (f) => !f.car && (!f.finalOnly || r.data.kind === 'تصفية نهائية') && (!f.leaveOnly || r.data.kind !== 'تصفية نهائية'),
                )
                .map((f) => fieldHtml(f, taskVals[f.key]))
                .join('')}</div>
              ${
                task === 'deductions'
                  ? `<div class="car-box"${taskVals.hasCar === 'نعم' ? '' : ' hidden'}><h4 class="b-sec">محضر تسليم وتسلم السيارة</h4>
                ${
                  r.vehicle
                    ? `<div class="car-paper"><div style="margin-bottom:6px">المحضر رقم <a href="#/req/${r.vehicle.id}"><bdi dir="ltr">${esc(r.vehicle.serial)}</bdi></a> ${chip(r.vehicle)}</div>
                    ${
                      r.vehicle.status === 'approved'
                        ? '<div>✔ <b>اعتمدته إدارة الحركة</b> — يمكنك إرسال الملف الآن</div>'
                        : `<div class="hint">اعتماد محضر التسليم من إدارة الحركة: افتح المحضر، واطبعه ليوقّعه الموظف (المسلِّم) والمستلم، ثم ارفعه موقّعاً وأرسله لإدارة الحركة. بعد اعتماده ترسل الملف من هنا.</div>
                    <a class="btn" href="#/req/${r.vehicle.id}" style="margin-top:8px">فتح المحضر</a>`
                    }</div>`
                    : `<div class="car-paper"><a class="btn primary" href="#/new/vehicleHandover?case=${r.id}">📝 إعداد محضر تسليم وتسلم</a>
                    <div class="hint" style="margin-top:8px">يفتح النظام نموذج المحضر وبيانات الموظف (المسلِّم) مكتوبة فيه، ثم تطبعه ويوقّعه الموظف والمستلم وترفعه موقّعاً، وتعتمده إدارة الحركة، وبعد اعتماده يرسل النظام الملف تلقائياً لشئون الموظفين.</div></div>`
                }
                </div>`
                  : ''
              }
            </div>`
      : '';
  }
  /* جزء من viewRequest: SF.byId[r.type] && ['allowanceSheet', 'allowanceSheetBulk', … */
  function requestValue2(p, r) {
    return SF.byId[r.type] &&
      [
        'allowanceSheet',
        'allowanceSheetBulk',
        'housingFixed',
        'housingVisit',
        'transport',
        'contact',
        'contactBulk',
        'salaryRaise',
        'deduction',
        'residence',
        'site',
        'allowanceLetter',
        'familyVisit',
        'bizTrip',
      ].includes(r.type) &&
      (!['allowanceSheet', 'allowanceSheetBulk'].includes(r.type) || r.data.combined) &&
      r.status === 'approved'
      ? `<div class="card"><h3>💼 الصرف في مسير الرواتب</h3>${r.data.payMonth ? `<p style="margin:0 0 8px">شهر الصرف: <b>${esc(prMonth(r.data.payMonth))}</b></p>` : '<p class="muted" style="margin:0 0 8px">لم يحدد مدير إدارة الرواتب شهر الصرف بعد.</p>'}${p.canPayMonth ? `<div class="row" style="gap:8px"><input class="in" type="month" id="payM" value="${esc(r.data.payMonth || today().slice(0, 7))}" style="width:auto"><button class="btn primary sm" id="payMSet">تحديد شهر الصرف</button>${r.data.payMonth ? '<button class="btn sm" id="payMClr">إلغاء</button>' : ''}</div>` : ''}</div>`
      : '';
  }
  /* جزء من viewRequest: consultStep ? `<button class="btn ok" data-act="approve">↩ إ… */
  function requestValue(carStep, consultStep, isLast, task) {
    return consultStep
      ? `<button class="btn ok" data-act="approve">↩ إرسال الرأي وإرجاع الطلب إلى ${esc(consultStep.backTo)}</button>`
      : task === 'settlement' || carStep
        ? ''
        : `<button class="btn ok" data-act="approve">${task && SF.TASKS[task].button ? SF.TASKS[task].button : task === 'forward' ? '↗ توجيه لمحاسب إدارة الرواتب' : task === 'deductions' ? '✔ اعتماد وإرسال' : task ? '✔ اعتماد وإرجاع للمحاسب' : isLast ? '✔ اعتماد نهائي' : '✔ اعتماد وتحويل'}</button>`;
  }
  /* جزء من viewRequest: form && form.devMaintFlow && ((r.data.thread || []).length |… */
  function requestHtml2(form, p, r, task) {
    return form && form.devMaintFlow && ((r.data.thread || []).length || p.canReply)
      ? `<div class="card dm-thread"><h3>💬 المراسلات مع مسئول الصيانة</h3>
            ${(r.data.thread || []).map((m) => `<div class="dm-msg ${m.side === 'maint' ? 'maint' : 'branch'}"><div><b>${esc(m.name)}</b> <small class="muted">${m.side === 'maint' ? 'مسئول الصيانة' : 'الفرع'} — ${esc(dt(m.at))}</small></div><div class="dm-t">${esc(m.text)}</div></div>`).join('') || '<div class="muted" style="margin-bottom:8px">لا توجد ردود بعد</div>'}
            ${
              p.canReply
                ? `<textarea class="in" id="dmText" rows="3" placeholder="${task === 'dmClose' ? 'اكتب العطل أو الإجراء المطلوب أو استفسارك للفرع...' : 'اكتب ردك لمسئول الصيانة...'}"></textarea><div id="dmErr"></div>
              <button class="btn primary" id="dmSend" style="margin-top:8px">↩ إرسال الرد</button>`
                : ''
            }
            ${task === 'dmClose' ? '<div class="hint" style="margin-top:8px">بعد انتهاء المراسلات اكتب العطل والإجراء المتخذ ونتيجة الصيانة، واضغط "إقفال طلب الصيانة".</div>' : ''}
          </div>`
      : '';
  }
  /* جزء من viewRequest: task && task !== 'settlement' && task !== 'forward'… */
  function requestHtml(r, task, tk) {
    return task && task !== 'settlement' && task !== 'forward'
      ? {
          job: r.data.job,
          ...Object.fromEntries(SF.TASKS[task].fields.filter((f) => f.default).map((f) => [f.key, f.default])),
          ...(task === 'loanIssue' ? { deliveryDate: today(), returnDue: r.data.toDate } : {}),
          ...(task === 'dmClose' ? { closeDate: today() } : {}),
          ...(task === 'issueEdit' ? { items: (r.data.items || []).map((x) => ({ ...x })), editNote: '' } : {}),
          ...(task === 'mfgQuote'
            ? {
                qItems: (r.data.items || [])
                  .filter((x) => x.product)
                  .map((x) => ({ item: x.product, qty: x.qty, price: '', note: x.spec || '' })),
              }
            : {}),
          ...(tk[task] || {}),
        }
      : {};
  }
  /* carPanel من viewRequest (يأخذ r من الصفحة) */
  function requestCarPanel(r) {
    const v = r.vehicle,
      vt = v && v.status === 'pending' && v.route[v.step] ? v.route[v.step].task : '';
    const vp = v ? (v.attachments || []).filter((a) => a.label === SF.VEH_PAPER) : [];
    const ret = v && v.status === 'returned' ? (v.history || []).filter((h) => h.action === 'return').pop() : null;
    const st = (n, done, title, body) =>
      `<li class="cs-step${done ? ' done' : ''}"><span class="cs-n">${done ? '✔' : n}</span><div><b>${title}</b>${body ? `<div class="cs-b">${body}</div>` : ''}</div></li>`;
    const sent = v && (v.status === 'approved' || (v.status === 'pending' && vt !== 'vehSign'));
    return `<div class="car-steps"><h4 class="b-sec">🚗 خطوات تسليم السيارة</h4><ol>
        ${st(
          1,
          !!v,
          'إعداد محضر تسليم وتسلم السيارة',
          v
            ? `المحضر رقم <a href="#/req/${v.id}"><bdi dir="ltr">${esc(v.serial)}</bdi></a> ${chip(v)}${ret ? `<div class="need-att" style="margin-top:6px">أعادته إدارة الحركة: ${esc(ret.note)}</div><a class="btn sm" href="#/edit/${v.id}" style="margin-top:6px">✏️ تعديل المحضر وإعادة إرساله</a>` : ''}`
            : `<a class="btn primary" href="#/new/vehicleHandover?case=${r.id}">📝 إعداد المحضر</a><div class="hint" style="margin-top:6px">بيانات الموظف (المسلِّم) مكتوبة فيه، وبعد حفظه ترجع لهذه الصفحة</div>`,
        )}
        ${st(2, sent, 'طباعة المحضر ليوقّعه المسلِّم والمستلم', v ? `<a class="btn sm" href="#/print/${v.id}" target="_blank">🖨️ طباعة المحضر للتوقيع</a>` : '<span class="muted">بعد إعداد المحضر</span>')}
        ${st(
          3,
          sent,
          'رفع المحضر الموقّع وإرساله لإدارة الحركة',
          vt === 'vehSign' && v.perms.canAct
            ? `${vp.length ? `<div style="margin-bottom:6px">✔ مرفوع: ${vp.map((a) => `<a href="/api/requests/${v.id}/attachments/${a.id}" target="_blank">📎 ${esc(a.name)}</a>`).join('، ')}</div>` : ''}
            <input type="file" class="in" id="carPaperIn" accept=".pdf,.png,.jpg,.jpeg"><button type="button" class="btn ok" id="carSend" style="margin-top:8px">↗ ${vp.length ? 'إرسال' : 'رفع المحضر الموقّع وإرساله'} لإدارة الحركة</button><div id="carErr"></div>`
            : sent
              ? '<span class="muted">تم الإرسال</span>'
              : '<span class="muted">بعد طباعة المحضر وتوقيعه</span>',
        )}
        ${st(4, v && v.status === 'approved', 'اعتماد إدارة الحركة', v && v.status === 'approved' ? 'اعتمدت إدارة الحركة المحضر' : sent ? '⏳ بانتظار اعتماد إدارة الحركة' : '')}
        ${st(5, false, 'إرسال الملف لشئون الموظفين', 'يتم تلقائياً بعد اعتماد إدارة الحركة للمحضر')}
      </ol></div>`;
  }
  /* جزء من viewRequest: const hrA = task === 'hr' && r.hrAuto;… */
  function viewRequestPart4(r, task, taskVals) {
    const hrA = task === 'hr' && r.hrAuto;
    if (hrA) {
      if (hrA.lastDay) taskVals.lastDay = hrA.lastDay;
      if (hrA.found)
        Object.assign(taskVals, {
          joinDate: hrA.joinDate || taskVals.joinDate,
          startWork: hrA.startWork || taskVals.startWork,
          nationality: hrA.nationality || taskVals.nationality,
          paidLeave: hrA.paidLeave,
        });
    }
  }
  /* جزء من viewRequest: wireRequest3(carPaper, main, r, task, vehPaper);… */
  function viewRequestPart3(carPaper, cd, main, r, task, vehPaper) {
    wireRequest3(carPaper, main, r, task, vehPaper);
    wireRequest(cd, main, r);
    viewRequestPart(r);
    $$('[data-del]', main).forEach((b) => {
      b.onclick = async () => {
        if (!confirm('حذف المرفق؟ ينتقل إلى سلة المحذوفات وتستطيع استرجاعه خلال 30 يوماً.')) return;
        try {
          await api('DELETE', `/api/requests/${r.id}/attachments/${b.dataset.del}`);
          route();
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
  }
  /* جزء من viewRequest: fitLetters();… */
  function viewRequestPart2(main, r) {
    fitLetters();
    fillEmbeds(main, r);
    reqChatCard(r);
    /* طلب صيانة جهاز: إرسال رد في المراسلات */
    const dmSend = $('#dmSend', main);
    if (dmSend)
      dmSend.onclick = async () => {
        const text = $('#dmText').value.trim();
        if (!text) {
          $('#dmErr').innerHTML = '<div class="err">اكتب الرد</div>';
          return;
        }
        dmSend.disabled = true;
        try {
          await api('POST', `/api/requests/${r.id}/reply`, { text });
          toast('تم إرسال الرد');
          viewRequest(r.id);
        } catch (err) {
          $('#dmErr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
          dmSend.disabled = false;
        }
      };
  }
  /* أحداث viewRequest: #eosBtn */
  function wireRequest3(carPaper, main, r, task, vehPaper) {
    wireRequest32(carPaper, main, r, task, vehPaper);
    if ($('#reqAtt'))
      attachmentPages($('#reqAtt'), r).catch((err) => {
        $('#reqAtt').insertAdjacentHTML('beforeend', `<div class="err">تعذر عرض المرفقات: ${esc(err.message)}</div>`);
      });
  }
  /* أحداث wireRequest3: #eosBtn */
  function wireRequest32(carPaper, main, r, task, vehPaper) {
    $$('[data-act]', main).forEach((b) => {
      b.onclick = async () => {
        /* حالة الصفحة: ما يتغير بعد العرض (taskData، carFile) */
        const vs = {};
        const action = b.dataset.act;
        const note = $('#aNote').value.trim();
        const amount = $('#aAmount') ? $('#aAmount').value.trim() : '';
        const payMonth = $('#aPayM') ? $('#aPayM').value : '';
        $('#aerr').innerHTML = '';
        if (action === 'approve' && $('#aPayM') && !payMonth) {
          $('#aerr').innerHTML = '<div class="err">حدد رواتب أي شهر ينزل فيها الطلب</div>';
          return;
        }
        if (action !== 'approve' && !note) {
          $('#aerr').innerHTML = '<div class="err">يجب كتابة السبب في خانة الملاحظات</div>';
          return;
        }
        vs.taskData = undefined;
        vs.carFile = null;
        if (task && action === 'approve' && task !== 'forward') {
          vs.taskData = collect({ fields: SF.TASKS[task].fields }, $('.task-form', main));
          const car = vs.taskData.hasCar === 'نعم';
          /* الحقل المخفي بشرط الإظهار (مثل بنود الراتب المعتمد عند الموافقة بالعرض المقترح) لا يُطلب */
          const shown = (f) => !f.showIf || [].concat(f.showIf[1]).includes(String(vs.taskData[f.showIf[0]] || ''));
          const miss = SF.TASKS[task].fields.find(
            (f) =>
              f.required &&
              shown(f) &&
              (!f.car || car) &&
              (!f.finalOnly || r.data.kind === 'تصفية نهائية') &&
              (!f.leaveOnly || r.data.kind !== 'تصفية نهائية') &&
              f.type !== 'table' &&
              !String(vs.taskData[f.key] || '').trim(),
          );
          if (miss) {
            $('#aerr').innerHTML = `<div class="err">الحقل "${esc(miss.label)}" مطلوب</div>`;
            return;
          }
          const filled = (rows, k) => (rows || []).filter((x) => String(x[k] || '').trim());
          if (vs.taskData.hasDed === 'يوجد' && !filled(vs.taskData.deductions, 'amount').length) {
            $('#aerr').innerHTML = '<div class="err">أضف السلف / الخصومات وقيمها، أو اختر "لا يوجد"</div>';
            return;
          }
          if (vs.taskData.hasAssets === 'يوجد' && !filled(vs.taskData.assets, 'type').length) {
            $('#aerr').innerHTML = '<div class="err">أضف العهد العينية، أو اختر "لا يوجد"</div>';
            return;
          }
          if (car && task === 'deductions' && !(r.vehicle && r.vehicle.status === 'approved')) {
            $('#aerr').innerHTML =
              `<div class="err">${r.vehicle ? `محضر تسليم السيارة رقم ${esc(r.vehicle.serial)} لم تعتمده إدارة الحركة بعد` : 'أعد محضر تسليم وتسلم السيارة أولاً من زر "إعداد محضر تسليم وتسلم"'}</div>`;
            return;
          }
          if (task === 'vehSign') {
            vs.carFile = $('#vehFile', main) && $('#vehFile', main).files[0];
            if (!vs.carFile && !vehPaper.length) {
              $('#aerr').innerHTML = '<div class="err">ارفع صورة المحضر بعد توقيعه من المسلِّم والمستلم</div>';
              return;
            }
          }
        }
        return partPart(action, amount, b, carPaper, main, note, payMonth, r, task, vehPaper, vs);
      };
    });
    if ($('#eosBtn')) $('#eosBtn').onclick = () => eosModal(r, null, () => route());
    if ($('[data-fwd]')) $('[data-fwd]').onclick = () => forwardModal(r);
    const payM = async (month) => {
      try {
        const x = await api('POST', '/api/payroll-allowances', { ids: [r.id], month });
        toast(x.updated ? 'تم تحديث شهر الصرف' : 'لم يتغير (البدل داخل مسير معتمد)', !x.updated);
        viewRequest(r.id);
      } catch (err) {
        toast(err.message, true);
      }
    };
    wireRequest2(payM, r);
  }
  /* جزء من viewRequest: if ($('#upl'))… */
  function viewRequestPart(r) {
    if ($('#upl'))
      $('#upl').onchange = async (e) => {
        if (!e.target.files.length) return;
        e.target.disabled = true;
        try {
          for (const f of e.target.files) await uploadFile(r.id, f, $('#uplLabel') ? $('#uplLabel').value : '');
          toast('تم رفع المرفقات');
          route();
        } catch (err) {
          toast(err.message, true);
          e.target.value = '';
          e.target.disabled = false;
        }
      };
  }
  /* أحداث viewRequest: #payMSet، #payMClr، #cancelDed */
  function wireRequest2(payM, r) {
    if ($('#payMSet')) $('#payMSet').onclick = () => payM($('#payM').value);
    if ($('#payMClr')) $('#payMClr').onclick = () => payM('');
    if ($('#cancelDed'))
      $('#cancelDed').onclick = async () => {
        const reason = await askText(`إلغاء قرار الخصم ${r.serial}`, 'سبب الإلغاء (نتيجة التظلم)');
        if (reason === null) return;
        try {
          await api('POST', `/api/requests/${r.id}/cancel-ded`, { reason });
          toast('تم إلغاء قرار الخصم');
          viewRequest(r.id);
        } catch (err) {
          toast(err.message, true);
        }
      };
  }
  /* أحداث viewRequest: #carSend، #payerSave، #clrSend، #deleteBtn، #cancelBtn */
  function wireRequest(cd, main, r) {
    if ($('#carSend'))
      $('#carSend').onclick = async () => {
        const v = r.vehicle,
          f = $('#carPaperIn').files[0],
          old = (v.attachments || []).filter((a) => a.label === SF.VEH_PAPER);
        if (!f && !old.length) {
          $('#carErr').innerHTML = '<div class="err">ارفع صورة المحضر بعد توقيعه من المسلِّم والمستلم</div>';
          return;
        }
        $('#carSend').disabled = true;
        try {
          if (f) {
            await uploadFile(v.id, f, SF.VEH_PAPER);
            for (const a of old) await api('DELETE', `/api/requests/${v.id}/attachments/${a.id}`).catch(() => {});
          }
          await api('POST', `/api/requests/${v.id}/action`, { action: 'approve', note: '', taskData: {} });
          toast('تم إرسال المحضر لإدارة الحركة');
          route();
        } catch (err) {
          $('#carErr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
          $('#carSend').disabled = false;
        }
      };
    if ($('#payerSave'))
      $('#payerSave').onclick = async () => {
        try {
          await api('PUT', `/api/requests/${r.id}/payer`, { payer: $('#payerIn').value });
          toast('تم تعديل الجهة في المخالصة');
          route();
        } catch (err) {
          toast(err.message, true);
        }
      };
    if ($('#clrSend')) $('#clrSend').onclick = () => sendClosePapers(r, cd, main);
    if ($('#deleteBtn'))
      $('#deleteBtn').onclick = async () => {
        const warn =
          r.status === 'approved' ? '\n\nتنبيه: هذا خطاب معتمد نهائياً، وبعد حذفه سيظهر رمز QR المطبوع عليه كخطاب غير موجود.' : '';
        if (
          !confirm(
            `حذف الطلب رقم ${r.serial} مع مرفقاته؟\nينتقل إلى سلة المحذوفات ويستطيع مدير النظام استرجاعه خلال 30 يوماً، ثم يحذفه النظام نهائياً.${warn}`,
          )
        )
          return;
        if (prompt(`للتأكيد اكتب رقم الطلب: ${r.serial}`) !== r.serial) {
          toast('لم يتم الحذف: رقم الطلب غير مطابق', true);
          return;
        }
        try {
          await api('DELETE', `/api/requests/${r.id}`);
          toast(`تم حذف الطلب ${r.serial}`);
          location.hash = '#/all';
        } catch (err) {
          toast(err.message, true);
        }
      };
    if ($('#cancelBtn'))
      $('#cancelBtn').onclick = async () => {
        /* سبب الإلغاء إلزامي ويظهر في سجل الإجراءات */
        const reason = await askText(`إلغاء الطلب ${r.serial}`, 'سبب الإلغاء (إلزامي — يظهر في سجل الإجراءات)');
        if (reason === null) return;
        try {
          await api('POST', `/api/requests/${r.id}/cancel`, { reason });
          toast('تم إلغاء الطلب');
          route();
        } catch (err) {
          toast(err.message, true);
        }
      };
  }
  /* جزء من part: const msg = {… */
  async function partPart(action, amount, b, carPaper, main, note, payMonth, r, task, vehPaper, vs) {
    const msg = {
      approve: task ? 'حفظ البيانات وإرسال الملف للمرحلة التالية؟' : 'تأكيد اعتماد الطلب؟',
      return:
        b.dataset.to === 'prev' && r.route[r.step - 1]
          ? `إعادة الطلب إلى ${r.route[r.step - 1].label} (${r.route[r.step - 1].name})؟`
          : `إعادة الطلب إلى ${r.createdByName} (${retCreator(r).replace('إعادة ', '')}) لتعديله وإعادة إرساله؟`,
      reject: 'تأكيد رفض الطلب نهائياً؟',
    }[action];
    if (!confirm(msg)) return;
    $$('[data-act]', main).forEach((x) => {
      x.disabled = true;
    });
    try {
      /* محضر واحد فقط: النسخة الجديدة تحل محل السابقة (تذهب السابقة لسلة المحذوفات) */
      if (vs.carFile) {
        const old = task === 'vehSign' ? vehPaper : carPaper;
        await uploadFile(r.id, vs.carFile, task === 'vehSign' ? SF.VEH_PAPER : SF.CAR_PAPER);
        for (const a of old) await api('DELETE', `/api/requests/${r.id}/attachments/${a.id}`).catch(() => {});
      }
      await api('POST', `/api/requests/${r.id}/action`, {
        action,
        note,
        amount,
        taskData: vs.taskData,
        ...(payMonth ? { payMonth } : {}),
        ...(b.dataset.to ? { to: b.dataset.to } : {}),
      });
      toast({ approve: 'تم الاعتماد', return: 'تمت إعادة الطلب', reject: 'تم رفض الطلب' }[action]);
      location.hash = '#/inbox';
    } catch (err) {
      $('#aerr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
      $$('[data-act]', main).forEach((x) => {
        x.disabled = false;
      });
    }
  }
  return { viewRequest, requestValue25, requestValue24 };
};
