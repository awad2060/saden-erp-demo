'use strict';
/* صفحة «request-details» (viewRequest) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['request-details'] = function (S) {
  /* خصائص أنواع الطلبات (public/js/form-traits.js): isForm(r, 'خاصية') بدل مقارنة النوع */
  const isForm = (r, trait) => window.SADEN_FORM_TRAITS.is(r, trait);
  const {
    $,
    $$,
    ACCEPT,
    ACTIONS,
    IMG_EXT,
    SF,
    api,
    askText,
    askYesNo,
    attachmentPages,
    canEditPayer,
    carAssetSync,
    carCtx,
    caseCtx,
    chip,
    clearanceCtx,
    collect,
    defaultPayer,
    dt,
    eosToProgram,
    esc,
    extOf,
    fieldHtml,
    fillEmbeds,
    fitLetters,
    fmtDate,
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
    setupMarks,
    sheetLetterCtx,
    shell,
    state,
    tableRowHtml,
    toast,
    today,
    uploadFile,
  } = S;
  /* أجزاء صفحة الطلب: إعادة التوجيه، وبطاقة مكافأة نهاية الخدمة ونافذتها، ومحادثة الطلب، ومسار الاعتماد (request-details-kit.js) */
  const { flowHtml, eosCard, reqChatCard, eosModal, forwardModal } = window.SES_PAGE_KITS['request-details'](S, { isForm });
  /* مستندات إغلاق الملف بعد الاعتماد النهائي (المخالصة الموقّعة وإثبات صرف المستحقات) — كلها إلزامية */
  const closePapers = (r) => {
    const d = SF.closeDoc(r.type);
    return d ? [d.paper, d.proof].filter(Boolean) : [];
  };
  /* خاناتها: المرفوع يظهر ✔، والباقي خانة رفع إلزامية */
  const clrFields = (r) =>
    closePapers(r)
      .map((p) =>
        (r.attachments || []).some((a) => a.label === p)
          ? `<div class="field"><label>${esc(p)}</label><div class="chip ok">✔ مرفوع</div></div>`
          : `<div class="field"><label>${esc(p)} <span class="req">*</span></label><input class="in" type="file" data-clr="${esc(p)}" accept=".pdf,.png,.jpg,.jpeg"></div>`,
      )
      .join('');
  /* رفع المستندات المختارة (المخالصة و/أو إثبات الصرف)، والملف يُغلق عند اكتمالها */
  async function sendClosePapers(r, cd, main) {
    const fields = $$('[data-clr]', main);
    const picked = fields.filter((x) => x.files[0]);
    if (!picked.length) {
      $('#clrErr').innerHTML = `<div class="err">${esc(cd.pick)}</div>`;
      return;
    }
    const rest = fields.length - picked.length;
    if (!(await askYesNo(rest ? 'رفع المستند المختار؟ يبقى الملف مفتوحاً حتى رفع باقي المستندات' : 'رفع المستندات وإغلاق الملف؟'))) return;
    $('#clrSend').disabled = true;
    try {
      for (const x of picked) await uploadFile(r.id, x.files[0], x.dataset.clr);
      toast(rest ? 'تم الرفع — بانتظار باقي مستندات الإغلاق' : 'تم رفع المستندات وإغلاق الملف');
      route();
    } catch (err) {
      $('#clrErr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
      $('#clrSend').disabled = false;
    }
  }
  /* أجزاء request-details (2) (request-details-kit-2.js) */
  const { viewRequest, requestValue25, requestValue24 } = window.SES_PAGE_KITS['request-details-2'](S, { closePapers, clrFields, eosCard, eosModal, flowHtml, forwardModal, isForm, reqChatCard, sendClosePapers, viewRequestPart6 });

  /* جزء من viewRequest: tf.addEventListener('click', (e) => {… */
  function viewRequestPart6(r, task, tf) {
    tf.addEventListener('click', (e) => {
      if (e.target.classList.contains('add')) {
        const box = e.target.closest('[data-table]');
        const f = SF.TASKS[task].fields.find((x) => x.key === box.dataset.table);
        $('.trows', box).insertAdjacentHTML('beforeend', tableRowHtml(f, {}));
      }
      if (e.target.classList.contains('rm')) {
        const rows = e.target.closest('.trows');
        if (rows.children.length > 1) e.target.closest('.trow').remove();
        else
          $$('.in', e.target.closest('.trow')).forEach((i) => {
            i.value = '';
          });
      }
    });
    /* شئون الموظفين: الحقول المرتبطة بسجل الموظفين ونموذج آخر يوم دوام للقراءة، ومدة الإجازة لا تقل عن الرصيد */
    if (task === 'hr' && r.hrAuto) {
      const A = r.hrAuto;
      const lock = (k, src) => {
        const i = $(`[data-key="${k}"]`, tf);
        if (!i) return;
        i.readOnly = true;
        i.classList.add('auto-in');
        i.title = src;
        const h = document.createElement('div');
        h.className = 'hint auto-src';
        h.textContent = src;
        i.after(h);
      };
      if (A.lastDay) lock('lastDay', `من نموذج آخر يوم دوام المعتمد ${A.lastDaySerial}`);
      if (A.found) {
        ['joinDate', 'startWork', 'nationality'].forEach((k) => lock(k, 'من سجل الموظفين'));
        lock('paidLeave', `رصيد الإجازات من سجل الموظفين (${A.rate} يوماً سنوياً)`);
      }
      tf.insertAdjacentHTML('afterbegin', requestValue24(A));
      const dur = $('[data-key="leaveDuration"]', tf),
        pl = $('[data-key="paidLeave"]', tf);
      if (dur && pl) {
        dur.min = pl.value || 0;
        const chk = () => {
          dur.setCustomValidity(
            Number(pl.value) > 0 && dur.value !== '' && Number(dur.value) < Number(pl.value) ? `مدة الإجازة لا تقل عن ${pl.value} يوم` : '',
          );
        };
        dur.addEventListener('input', chk);
        chk();
      }
    }
    /* شئون الموظفين: عدد أيام العمل = الفرق بين بداية العمل/العودة وآخر دوام (نفس طريقة برنامج التصفية) */
    const sw = $('[data-key="startWork"]', tf),
      ld = $('[data-key="lastDay"]', tf),
      wd = $('[data-key="workDays"]', tf);
    if (requestValue25(ld, sw, wd)) {
      const hint = document.createElement('div');
      hint.className = 'hint';
      wd.after(hint);
      const calc = () => {
        const n = SF.daysBetween(sw.value, ld.value);
        wd.value = n === null ? '' : n;
        hint.textContent = n === null ? '' : n < 0 ? '⚠ تاريخ آخر دوام قبل تاريخ بداية العمل' : `= ${SF.durationText(sw.value, ld.value)}`;
        hint.style.color = n !== null && n < 0 ? 'var(--bad)' : '';
      };
      sw.addEventListener('input', calc);
      sw.addEventListener('change', calc);
      ld.addEventListener('input', calc);
      ld.addEventListener('change', calc);
      calc();
    }
    /* العرض المالي في نموذج التوظيف: الإجمالي = الأساسي + البدلات */
    /* مراحل لها إجمالي يُحسب من بنودها (sum في تعريف المرحلة) */
    viewRequestPart5(r, task, tf);
  }
  /* جزء من viewRequest: const sm = SF.TASKS[task].sum,… */
  function viewRequestPart5(r, task, tf) {
    const sm = SF.TASKS[task].sum,
      smOut = sm && $(`[data-key="${sm[0]}"]`, tf);
    if (smOut) {
      const calc = () => {
        smOut.value = SF.sumOf(collect({ fields: SF.TASKS[task].fields }, tf), sm[1]) || '';
      };
      tf.addEventListener('input', calc);
      calc();
    }
    const qBox = task === 'mfgQuote' && $('[data-table="qItems"]', tf);
    if (qBox) {
      const out = document.createElement('div');
      out.className = 'quote-tot';
      const lf = $('[data-key="laborCost"]', tf);
      (lf ? lf.closest('.field') : qBox).after(out);
      const qc = () => {
        const c = collect({ fields: SF.TASKS.mfgQuote.fields }, tf),
          v = SF.mfgTotals(c.qItems || [], c.laborCost);
        out.innerHTML = `<span>الإجمالي بدون الضريبة: <b>${sar(v.subtotal)}</b></span><span>الضريبة (15%) على البنود: <b>${sar(v.vat)}</b></span><span>الإجمالي شامل الضريبة: <b>${sar(v.withVat)}</b> ريال</span><span>المصنوعية (بدون ضريبة): <b>${sar(v.labor)}</b></span><span class="qt-final">الإجمالي النهائي (شامل الضريبة + المصنوعية): <b>${sar(v.total)}</b> ريال</span>`;
      };
      tf.addEventListener('input', qc);
      tf.addEventListener('click', () => setTimeout(qc, 0));
      qc();
    }
    const tot = task === 'hireSalary' && $('[data-key="total"]', tf);
    if (tot) {
      const sum = () => {
        const v = collect({ fields: SF.TASKS.hireSalary.fields }, tf);
        const n = SF.hireTotal(v);
        tot.value = n || '';
      };
      tf.addEventListener('input', sum);
      sum();
    }
    /* التلفيات على رسمة المركبة (محضر السيارة عند المحاسب وعند إدارة الحركة) */
    setupMarks(tf, { fields: SF.TASKS[task].fields });
    /* طباعة المحضر من البيانات المكتوبة الآن، ليوقّع عليه المسلِّم والمستلم */
    const cp = $('#carPrint', tf);
    if (cp)
      cp.onclick = () => {
        const v = collect({ fields: SF.TASKS.deductions.fields.filter((f) => f.car) }, tf);
        const w = window.open('', '_blank');
        if (!w) {
          toast('اسمح بفتح النوافذ المنبثقة للطباعة', true);
          return;
        }
        w.document
          .write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>محضر تسليم وتسلم سيارة</title><link rel="stylesheet" href="css/style.css"></head>
          <body class="print-page" style="background:#fff">${SF.renderCarRecord({ ...r.data, tasks: { traffic: v } }, { serial: r.serial })}<script>window.onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
        w.document.close();
      };
    const hc = $('[data-key="hasCar"]', tf);
    if (hc)
      hc.onchange = () => {
        $('.car-box', tf).hidden = hc.value !== 'نعم';
      };
    /* بعد رفع محضر التسليم المرتبط: الموظف مستلم سيارة (نعم) ولا يُغيَّر الاختيار */
    if (hc && r.vehicle) {
      hc.value = 'نعم';
      hc.disabled = true;
      hc.title = 'تم إعداد محضر تسليم السيارة لهذا الملف';
      $('.car-box', tf).hidden = false;
    }
    carAssetSync(tf);
    /* الجداول تظهر فقط عند اختيار "يوجد" */
    SF.TASKS[task].fields
      .filter((f) => f.showIf)
      .forEach((f) => {
        const sel = $(`[data-key="${f.showIf[0]}"]`, tf),
          box = $(`[data-table="${f.key}"]`, tf) || $(`[data-key="${f.key}"]`, tf);
        const wrap = box && (box.closest('.field') || box);
        if (!sel || !wrap) return;
        const sync = () => {
          wrap.hidden = ![].concat(f.showIf[1]).includes(sel.value);
        };
        sel.addEventListener('change', sync);
        sync();
      });
  }

  return { viewRequest };
};
