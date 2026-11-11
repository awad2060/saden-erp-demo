'use strict';
/* صفحة «request-editor» (viewEditor) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['request-editor'] = function (S) {
  /* خصائص أنواع الطلبات (public/js/form-traits.js): isForm(r, 'خاصية') بدل مقارنة النوع */
  const isForm = (r, trait) => window.SADEN_FORM_TRAITS.is(r, trait);
  /* نماذج يتغير مسارها مع مدخلاتها (الفرع، الجهة، المعتمد...) فتُعاد معاينة المسار عند تغييرها */
  const LIVE_ROUTE = ['drillFlow', 'issueFlow', 'scrapFlow', 'supplyFlow', 'flow', 'pickApprover', 'pickApprovers', 'lastDayFlow'];
  const {
    $,
    $$,
    ACCEPT,
    DAYS,
    MONTHS,
    SF,
    api,
    can,
    carAssetSync,
    collect,
    downloadXlsx,
    dt,
    embedBasicMissing,
    embedCollect,
    embedHide,
    embedPick,
    embedRestore,
    empSignBox,
    empSignValue,
    esc,
    fieldHtml,
    fitFrame,
    fitLetters,
    head,
    icon,
    isAdmin,
    loadFrame,
    money,
    readXlsx,
    route,
    routeText,
    setupMarks,
    shell,
    state,
    tableRowHtml,
    toast,
    today,
    uploadFile,
  } = S;
  /* أدوات محرر الطلب: توقيع الموظف، ورفع بيان الجُمع / الإعاشات من Excel (للفرع ولموظف)، واختيار المستخدمين (request-editor-kit.js) */
  const { setupUsers, setupSheetXlsx, empSignWire } = window.SES_PAGE_KITS['request-editor'](S, {});

  const CHOICE_URLS = { fleet: '/api/fleet/choices', fleetAll: '/api/fleet/choices?all=1', violPay: '/api/violations/pay-choices' };
  async function viewEditor(typeId, reqId, query) {
    /* حالة الصفحة: ما يتغير بعد العرض (req، form، route، linkCase) */
    const vs = {};
    vs.req = null;
    vs.form = undefined;
    if (reqId) {
      vs.req = await api('GET', `/api/requests/${reqId}`);
      if (!vs.req.perms.canEdit) {
        location.hash = `#/req/${reqId}`;
        return;
      }
      vs.form = SF.byId[vs.req.type];
    } else {
      vs.form = SF.byId[typeId];
      if (!can('new')) {
        location.hash = '#/';
        return;
      }
    }
    if (!vs.form) {
      location.hash = '#/new';
      return;
    }
    /* المسار حسب الفرع أو الجهة المختارة (قسم الحفر وأذون الصرف والخردة) */
    const RK = ['branch', 'toBranch', 'lender', 'workshop', 'reqKind', 'hasCar', 'approverId', 'approverIds', 'approverKind', 'iqama'];
    /* قائمة المستخدمين لحقل "يُوجَّه لاعتماد" */
    if (vs.form.fields.some((f) => f.picker === 'user' || f.type === 'users'))
      state.pickUsers = await api('GET', '/api/mail/users?approvers=1').catch(() => []);
    if (vs.form.fields.some((f) => f.picker === 'anyUser')) state.pickUsers = await api('GET', '/api/mail/users').catch(() => []);
    const routeUrl = (d) =>
      `/api/route?type=${encodeURIComponent(vs.form.id)}${RK.map((k) => (d && d[k] && (!Array.isArray(d[k]) || d[k].length) ? `&${k}=${encodeURIComponent([].concat(d[k]).join(','))}` : '')).join('')}`;
    vs.route = await api('GET', routeUrl(vs.req && vs.req.data));
    /* قوائم الاختيار من الخادم حسب حقول النموذج (المركبات، والمخالفات...) */
    for (const [k, url] of Object.entries(CHOICE_URLS))
      if (vs.form.fields.some((f) => f.choicesFrom === k)) state.config[k] = await api('GET', url);
    /* أجهزة جرد الفرع (طلب صيانة جهاز)، والجهاز المختار في الطلب المعاد يبقى ظاهراً */
    return viewEditorPart11(RK, query, reqId, routeUrl, vs);
  }
  /* جزء من viewEditor: if (vs.form.fields.some((f) => f.choicesFrom === '… */
  async function viewEditorPart11(RK, query, reqId, routeUrl, vs) {
    if (vs.form.fields.some((f) => f.choicesFrom === 'invItems')) {
      state.config.invItems = await api('GET', '/api/inventory/choices');
      if (vs.req && vs.req.data.item && !state.config.invItems.some((x) => x.id === vs.req.data.item))
        state.config.invItems.unshift({
          id: vs.req.data.item,
          label: (vs.req.data.inv || {}).name || 'الجهاز',
          branch: vs.req.data.branch,
          inv: vs.req.data.inv || {},
        });
    }
    /* محضر التسليم القديم بدون فرع مستلم: فرع المحضر */
    if (vs.req && vs.form.fields.some((f) => f.key === 'toBranch') && !vs.req.data.toBranch) vs.req.data.toBranch = vs.req.data.branch;
    /* البرنامج المدمج هو شاشة الإدخال، إلا في ملف التصفية فالمحاسب يملأ الملف ويعدّ التصفيةَ محاسبُ حماية الأجور */
    if (vs.form.embed && !vs.form.flow) return embedEditor(vs.form, vs.req, vs.route);
    const init = vs.req ? vs.req.data : {};
    await viewEditorPart6(vs.form, init, query, vs.req);
    await viewEditorPart5(vs.form, init, query, vs.req);
    viewEditorPart8(vs.form, init, query, vs.req);
    /* محضر تسليم السيارة من ملف التصفية: الموظف هو المسلِّم */
    vs.linkCase = null;
    if (!vs.req && vs.form.id === 'vehicleHandover' && query && query.case) {
      try {
        vs.linkCase = await api('GET', `/api/requests/${encodeURIComponent(query.case)}`);
      } catch {
        vs.linkCase = null;
      }
      if (vs.linkCase)
        Object.assign(init, {
          fromName: vs.linkCase.data.name || '',
          fromIqama: vs.linkCase.data.iqama || '',
          branch: vs.linkCase.branch || init.branch,
          caseId: vs.linkCase.id,
        });
    }
    const main = shell('', reqId ? '#/mine' : '#/new');
    const lastNote = vs.req && [...vs.req.history].reverse().find((h) => h.action === 'return');
    renderViewEditor(vs.form, init, lastNote, vs.linkCase, main, vs.req, vs.route);
    const ef = $('#ef');
    viewEditorPart3(ef, vs.form, vs.req);
    /* مرفق إلزامي يظهر عند اختيار معيّن (محضر تسليم السيارة عند "مستلم سيارة؟ نعم") */
    await viewEditorPart(ef, vs.form);
    /* محضر التسليم: اختيار المركبة من الأسطول يملأ بياناتها، والمسلِّم من سائقها الحالي (إذا لم يُكتب) */
    viewEditorPart4(ef, vs.form, vs.req);
    /* المتبقي في الإقامة يُحسب تلقائياً تحت تاريخ انتهائها */
    const ie = vs.form.id === 'hiring' && $('[data-key="iqamaExpiry"]', ef);
    if (ie) {
      const hint = document.createElement('div');
      hint.className = 'hint';
      ie.after(hint);
      const calc = () => {
        const left = SF.iqamaLeft(collect(vs.form, ef));
        hint.textContent = left ? `المتبقي في الإقامة: ${left}` : '';
        hint.style.color = left.startsWith('منتهية') ? 'var(--bad)' : '';
      };
      ef.addEventListener('input', calc);
      ef.addEventListener('change', calc);
      calc();
    }
    /* معاينة طلب الاستعارة: بيانات الجهاز المختار من قائمة الأجهزة المتاحة */
    return viewEditorPart10(RK, ef, routeUrl, vs);
  }
  /* جزء من viewEditor: const pvData = () => {… */
  function viewEditorPart10(RK, ef, routeUrl, vs) {
    const pvData = () => {
      const d = collect(vs.form, ef);
      if (vs.form.loanFlow) {
        const o = (state.config.devices || []).find((x) => x.id === d.device);
        if (o) d.dev = o.dev;
      }
      /* طلب صيانة جهاز: بيانات الجهاز المختار وفرعه في المعاينة */
      if (vs.form.devMaintFlow) {
        const o = (state.config.invItems || []).find((x) => x.id === d.item);
        if (o) {
          d.inv = o.inv;
          d.hist = o.hist;
          if (o.branch) d.branch = o.branch;
        }
      }
      return d;
    };
    /* بيان الجُمع / الإعاشات: خطاب إعتماد الصرف يظهر تحته في المعاينة (بدون توقيع مدير الفرع، فهو على البيان) */
    const render = () => {
      const d = pvData();
      let html = SF.renderLetter(vs.form.id, d, { route: vs.route, serial: vs.req && vs.req.serial, createdByName: state.user.name });
      if (vs.form.companion === 'allowanceLetter') {
        if (vs.form.xlsxSheet && vs.form.xlsxSheet !== 'single') d.bulk = '1';
        html += SF.renderLetter('allowanceLetter', SF.sheetLetterData(d, state.user.branch), {
          route: (vs.route || []).filter((s) => !/مدير الفرع/.test(s.label || '')),
          serial: vs.req && vs.req.serial,
          createdByName: state.user.name,
        });
      }
      $('#pv').innerHTML = html;
      fitLetters();
    };
    /* طلب صيانة جهاز: تنبيه تحت اختيار الجهاز إذا تكرر عطله في فترة قريبة */
    viewEditorPart7(ef, vs.form, render);
    if (LIVE_ROUTE.some((k) => vs.form[k]))
      ef.addEventListener('change', async (e) => {
        if (!RK.includes((e.target.closest('[data-key]') || {}).dataset?.key)) return;
        try {
          vs.route = await api('GET', routeUrl(collect(vs.form, ef)));
          render();
          /* المسار الجديد يفعّل زر الإرسال أو يعطله، ويحدّث سطر المسار */
          if ($('#sendBtn')) $('#sendBtn').disabled = !vs.route.length && !vs.form.pickApprover && !vs.form.pickApprovers;
          if ($('#routeHint'))
            $('#routeHint').textContent = vs.route.length
              ? `مسار الاعتماد: ${routeText(vs.route, vs.form.issuer)}`
              : vs.form.pickApprover
                ? 'اختر "يوجَّه لاعتماد" ليظهر مسار الاعتماد'
                : 'لا يوجد مسار اعتماد صالح لهذا الخطاب، تواصل مع مدير النظام';
        } catch {
          /* تبقى المعاينة بالمسار السابق */
        }
      });
    ef.addEventListener('click', (e) => {
      if (e.target.classList.contains('add')) {
        const box = e.target.closest('[data-table]');
        const f = vs.form.fields.find((x) => x.key === box.dataset.table);
        $('.trows', box).insertAdjacentHTML('beforeend', tableRowHtml(f, {}));
        render();
      }
      if (e.target.classList.contains('rm')) {
        const rows = e.target.closest('.trows');
        if (rows.children.length > 1) e.target.closest('.trow').remove();
        else
          $$('.in', e.target.closest('.trow')).forEach((i) => {
            i.value = '';
          });
        render();
      }
    });
    return viewEditorPart9(ef, render, vs);
  }
  /* جزء من viewEditor: ef.onsubmit = async (e) => {… */
  function viewEditorPart9(ef, render, vs) {
    ef.onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('#sendBtn');
      btn.disabled = true;
      $('#eerr').innerHTML = '';
      try {
        const data = collect(vs.form, ef);
        if (vs.linkCase) data.caseId = vs.linkCase.id;
        let saved;
        if (vs.req) {
          if (vs.req.missingAttachments && vs.req.missingAttachments.length)
            throw new Error(`يجب رفع المرفقات المطلوبة أولاً من صفحة الطلب: ${vs.req.missingAttachments.join('، ')}`);
          saved = await api('PUT', `/api/requests/${vs.req.id}`, { data, note: $('#rnote').value });
        } else {
          const reqFiles = [
            ...(vs.form.requiredAttachments || []).map((l, i) => ({ label: l, file: $(`[data-reqatt="${i}"]`, ef).files[0] })),
            ...(vs.form.requiredIf || [])
              .map(([l], i) => ({ label: l, file: $(`[data-reqifatt="${i}"]`, ef).files[0], box: $(`[data-reqif="${i}"]`, ef) }))
              .filter((x) => x.box && !x.box.hidden)
              .map(({ label, file }) => ({ label, file })),
          ];
          const missing = reqFiles.filter((x) => !x.file).map((x) => x.label);
          if (missing.length) throw new Error(`مرفق إلزامي: ${missing.join('، ')}`);
          const empSign = vs.form.empSign ? empSignValue(ef) : undefined;
          if (vs.form.empSign && state.user.role === 'employee' && !empSign)
            throw new Error('وقّع على إقرار السلفة: اختر توقيعك الإلكتروني المحفوظ أو «توقيع»');
          const esBox = vs.form.empSign && ef.querySelector('.es-box'),
            esFile = esBox && esBox.esFile ? esBox.esFile() : null;
          if (esFile) reqFiles.push({ label: SF.ADV_SIGNED, file: esFile });
          try {
            saved = await api('POST', '/api/requests', { type: vs.form.id, data, empSign });
          } catch (err) {
            if (err.status !== 409 || !confirm(`${err.message}\n\nهل تريد إرسال الطلب رغم ذلك؟`)) throw err;
            saved = await api('POST', '/api/requests', { type: vs.form.id, data, empSign, confirmDuplicate: true });
          }
          for (const x of reqFiles) {
            try {
              await uploadFile(saved.id, x.file, x.label);
            } catch (err) {
              toast(`${x.label}: ${err.message}`, true);
            }
          }
          for (const [i, l] of (vs.form.optionalAttachments || []).entries()) {
            const f = $(`[data-optatt="${i}"]`, ef).files[0];
            if (f) {
              await onsubmitPart(f, l, saved);
            }
          }
          for (const file of $('#files').files) {
            try {
              await uploadFile(saved.id, file);
            } catch (err) {
              toast(err.message, true);
            }
          }
        }
        toast(vs.req ? 'تمت إعادة إرسال الطلب' : `تم إرسال الطلب رقم ⁦${saved.serial}⁩`);
        /* عرض السعر المرتبط: الرجوع للطلب لإكمال مرحلة عرض السعر، ومحضر السيارة المرتبط: الرجوع لملف التصفية */
        location.hash = `#/req/${saved.data && saved.data.mfgId ? saved.data.mfgId : saved.data && saved.data.caseId ? saved.data.caseId : saved.id}`;
      } catch (err) {
        $('#eerr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
        btn.disabled = false;
      }
    };
    render();
  }
  /* جزء من onsubmit: try {… */
  async function onsubmitPart(f, l, saved) {
    try {
      await uploadFile(saved.id, f, l);
    } catch (err) {
      toast(`${l}: ${err.message}`, true);
    }
  }
  /* جزء من viewEditor: if (!req && query && query.prefill) {… */
  function viewEditorPart8(form, init, query, req) {
    if (!req && query && query.prefill) {
      try {
        const pf = JSON.parse(query.prefill);
        form.fields.forEach((f) => {
          if (pf[f.key] != null && f.key !== 'branch')
            init[f.key] = f.type === 'table' && Array.isArray(pf[f.key]) ? pf[f.key] : String(pf[f.key]);
        });
      } catch {
        /* تجاهل */
      }
    }
  }
  /* جزء من viewEditor: const itemSel = form.devMaintFlow && $('[data-key=… */
  function viewEditorPart7(ef, form, render) {
    const itemSel = form.devMaintFlow && $('[data-key="item"]', ef);
    if (itemSel) {
      const warn = document.createElement('div');
      warn.className = 'need-att';
      warn.style.marginTop = '6px';
      itemSel.after(warn);
      const sync = () => {
        const h = ((state.config.invItems || []).find((x) => x.id === itemSel.value) || {}).hist || {};
        warn.style.display = h.total ? '' : 'none';
        warn.innerHTML = !h.total
          ? ''
          : h.recent
            ? `⚠ تكرر عطل هذا الجهاز ${h.recent} ${h.recent > 1 ? 'مرات' : 'مرة'} خلال آخر ${h.days} يوماً — آخرها الطلب <bdi dir="ltr">${esc(h.items[0].serial)}</bdi> بتاريخ ${esc(SF.fmtDate(h.items[0].date))}`
            : `للجهاز ${h.total} طلب صيانة سابق (آخرها بتاريخ ${esc(SF.fmtDate(h.items[0].date))})`;
      };
      itemSel.addEventListener('change', sync);
      sync();
    }
    ef.addEventListener('input', render);
    ef.addEventListener('change', render);
    carAssetSync(ef);
  }
  /* جزء من viewEditor: if (!req)… */
  async function viewEditorPart6(form, init, query, req) {
    if (!req)
      form.fields.forEach((f) => {
        if (f.today) init[f.key] = today();
        if (f.default) init[f.key] = f.default;
        if (f.fromUser) init[f.key] = state.user[f.fromUser] || '';
      });
    if (!req && query && query.plate && form.fields.some((f) => f.key === 'plate')) init.plate = query.plate;
    /* خصم ناتج عن تحقيق: تنزل بيانات التحقيق وقراره */
    if (!req && form.id === 'legalDeduction' && query && query.inv) {
      try {
        const iv = await api('GET', `/api/legal/investigations/${encodeURIComponent(query.inv)}`);
        const D = iv.decision || {};
        Object.assign(init, {
          name: iv.name,
          iqama: iv.iqama,
          job: iv.job,
          branch: iv.branch,
          invNo: iv.no,
          invDate: D.date || '',
          invResult: D.penalty ? `${D.penalty}: ${D.text || ''}`.slice(0, 1000) : '',
          penalty: D.amount || '',
          reason: iv.subject,
        });
      } catch {
        /* تجاهل */
      }
    }
  }
  /* جزء من viewEditor: let mfgSrc = null;… */
  async function viewEditorPart5(form, init, query, req) {
    let mfgSrc = null;
    if (!req && form.id === 'priceQuote' && query && query.mfg) {
      try {
        mfgSrc = await api('GET', `/api/requests/${encodeURIComponent(query.mfg)}`);
      } catch {
        mfgSrc = null;
      }
      /* تعديل عرض السعر: يبدأ ببيانات العرض الحالي، والمحفوظ يحل محله */
      let prev = null;
      if (mfgSrc && query.from) {
        try {
          prev = await api('GET', `/api/requests/${encodeURIComponent(query.from)}`);
        } catch {
          prev = null;
        }
      }
      if (prev && isForm(prev, 'linkedQuote')) Object.assign(init, prev.data, { date: today(), mfgRef: mfgSrc.serial });
      else if (mfgSrc)
        Object.assign(init, {
          branch: init.branch || 'الورشة',
          customer: `فرع ${mfgSrc.data.branch || mfgSrc.branch || ''}`,
          mfgRef: mfgSrc.serial,
          vat: 'تضاف 15%',
          validity: '15',
          items: (mfgSrc.data.items || [])
            .filter((x) => x.product)
            .map((x) => ({ item: `${x.product}${x.spec ? ` — ${x.spec}` : ''}`, qty: x.qty, unit: '', price: '' })),
        });
    }
  }
  /* جزء من viewEditor: if (form.fleetFill) {… */
  function viewEditorPart4(ef, form, req) {
    if (form.fleetFill) {
      const pl = $('[data-key="plate"]', ef);
      let auto = {};
      const set = (k, v, onlyEmpty) => {
        const i = $(`[data-key="${k}"]`, ef);
        if (!i || (onlyEmpty && i.value.trim() && i.value !== auto[k])) return;
        i.value = v || '';
        auto[k] = i.value;
      };
      const fill = () => {
        const v = (state.config.fleetAll || []).find((x) => x.id === pl.value);
        if (!v) return;
        if (SF.VEH_TYPES.includes(v.vType)) {
          set('vType', v.vType);
          $('[data-key="vType"]', ef).dispatchEvent(new Event('change', { bubbles: true }));
        }
        set('model', v.model);
        set('year', v.year);
        set('fromName', v.driver, true);
        set('fromIqama', v.driverIqama, true);
        ef.dispatchEvent(new Event('input'));
      };
      if (pl) {
        pl.addEventListener('change', fill);
        if (pl.value && !req) fill();
      }
    }
    /* حقول تظهر حسب اختيار آخر (مثل الجنسية عند اختيار "مقيم") */
    form.fields
      .filter((f) => f.showIf)
      .forEach((f) => {
        const sel = $(`[data-key="${f.showIf[0]}"]`, ef),
          inp = $(`[data-key="${f.key}"]`, ef) || $(`[data-table="${f.key}"]`, ef) || $(`[data-hkey="${f.key}"]`, ef);
        const wrap = inp && inp.closest('.field, .f-head');
        if (!sel || !wrap) return;
        /* الشرط قيمة واحدة أو قائمة قيم */
        const sync = () => {
          wrap.hidden = ![].concat(f.showIf[1]).includes(sel.value.trim());
        };
        sel.addEventListener('change', sync);
        sel.addEventListener('input', sync);
        sync();
      });
  }
  /* جزء من viewEditor: setupMarks(ef, form);… */
  function viewEditorPart3(ef, form, req) {
    setupMarks(ef, form);
    setupUsers(ef, form);
    setupSheetXlsx(ef, form);
    /* طلب إجازة: عدد الأيام ورصيد الموظف حتى بداية الإجازة، وتنبيه عند تجاوز الرصيد أو الحد الأقصى */
    /* قرار النقل: من يتحمل راتب شهر النقل يُعبّأ من تاريخ المباشرة (≤ 15 المنقول إليه، > 15 المنقول منه) ما لم يغيّره المستخدم */
    if (form.id === 'empTransfer') {
      const dI = $('[data-key="effectiveDate"]', ef),
        pI = $('[data-key="payBranch"]', ef);
      if (dI && pI) {
        let touched = !!pI.value;
        pI.addEventListener('change', () => {
          touched = true;
        });
        const fill = () => {
          if (!touched && dI.value) pI.value = SF.trFromPays({ effectiveDate: dI.value }) ? SF.TR_PAY[0] : SF.TR_PAY[1];
        };
        dI.addEventListener('change', fill);
        dI.addEventListener('input', fill);
        fill();
      }
    }
    viewEditorPart2(ef, form, req);
    /* رقم محضر تسليم السيارة: يظهر المحضر ومستلمه من النظام للتأكد قبل الإرسال */
    const recNo = form.id === 'settlementCase' && $('[data-key="carRecNo"]', ef);
    if (recNo) {
      const info = document.createElement('div');
      info.className = 'hint';
      recNo.after(info);
      const look = async () => {
        const v = recNo.value.trim();
        if (!v) {
          info.textContent = '';
          return;
        }
        try {
          const x = await api('GET', `/api/vehicle-record?no=${encodeURIComponent(v)}`);
          const ok = x.status === 'approved';
          info.style.color = ok ? '#15803d' : 'var(--bad)';
          info.textContent = ok ? `✔ ${x.serial}: ${x.spec} — المستلم: ${x.receiver}` : `⚠ المحضر ${x.serial} لم تعتمده إدارة الحركة بعد`;
        } catch (err) {
          info.style.color = 'var(--bad)';
          info.textContent = `⚠ ${err.message}`;
        }
      };
      recNo.addEventListener('change', look);
      look();
    }
  }
  /* جزء من viewEditor: if (form.empSign && !req) empSignWire(ef);… */
  function viewEditorPart2(ef, form, req) {
    if (form.empSign && !req) empSignWire(ef);
    if (form.id === 'leaveRequest') {
      /* رصيد الإجازة السنوية للموظف: كارت ظاهر أعلى النموذج (المتاح الآن، الاستحقاق السنوي، أيام الطلب، الرصيد بعد الإجازة) */
      const info = document.createElement('div');
      info.className = 'leave-info';
      const ltI = $('[data-key="leaveType"]', ef);
      (ltI ? ltI.closest('.field') : ef.firstElementChild || ef).before(info);
      const look = async () => {
        const g = (k) => (($(`[data-key="${k}"]`, ef) || {}).value || '').trim();
        const from = g('from'),
          to = g('to'),
          iq = g('iqama'),
          type = (SF.hrPolicyOf(from || today()).leaveTypes || []).find((x) => x.name === g('leaveType'));
        const days = from && to && to >= from ? SF.daysBetween(from, to) + 1 : 0;
        let x = null;
        if (iq) {
          try {
            x = await api('GET', `/api/leave-balance?iqama=${encodeURIComponent(iq)}&from=${encodeURIComponent(from || today())}`);
          } catch {
            x = null;
          }
        }
        const bal = x && x.found ? Number(x.balance) : null;
        const uses = !type || type.balance;
        const after = bal !== null && days && uses ? Math.round((bal - days) * 100) / 100 : null;
        const over = uses && bal !== null && days > bal,
          overMax = type && type.max !== '' && Number(type.max) > 0 && days > Number(type.max);
        const ret = to ? SF.fmtDate(new Date(new Date(to).getTime() + 86400000).toISOString().slice(0, 10)) : '';
        const st = (l, v, cls = '') => `<div class="lv-s ${cls}"><small>${l}</small><b>${v}</b></div>`;
        info.className = `leave-info${over || overMax ? ' bad' : ''}`;
        return renderLook(after, bal, days, info, iq, over, overMax, ret, st, type, x);
      };
      ef.addEventListener('change', look);
      look();
    }
    /* رقم نموذج آخر يوم دوام المعتمد: يظهر الموظف وتاريخ آخر دوام للتأكد قبل الإرسال */
    const ldNo = form.id === 'settlementCase' && $('[data-key="lastDayNo"]', ef);
    if (ldNo) {
      const info = document.createElement('div');
      info.className = 'hint';
      ldNo.after(info);
      const look = async () => {
        const v = ldNo.value.trim();
        if (!v) {
          info.textContent = '';
          return;
        }
        try {
          const x = await api('GET', `/api/lastday-record?no=${encodeURIComponent(v)}`);
          const iq = ($('[data-key="iqama"]', ef) || {}).value || '';
          const ok = x.status === 'approved',
            same = !iq || !x.iqama || iq.trim() === x.iqama.trim();
          info.style.color = ok && same ? '#15803d' : 'var(--bad)';
          info.textContent = !ok
            ? `⚠ النموذج ${x.serial} لم يعتمده أحد بعد`
            : !same
              ? `⚠ النموذج ${x.serial} للموظف ${x.name} (${x.iqama})`
              : `✔ ${x.serial}: ${x.name} — آخر يوم دوام ${SF.fmtDate(x.lastDay)}${x.approverName ? ` — اعتمده ${x.approverName}` : ''}`;
        } catch (err) {
          info.style.color = 'var(--bad)';
          info.textContent = `⚠ ${err.message}`;
        }
      };
      ldNo.addEventListener('change', look);
      look();
    }
  }
  /* جزء من viewEditor: (form.requiredIf || []).forEach(([, k, v], i) => {… */
  async function viewEditorPart(ef, form) {
    (form.requiredIf || []).forEach(([, k, v], i) => {
      const sel = $(`[data-key="${k}"]`, ef),
        box = $(`[data-reqif="${i}"]`, ef);
      if (!sel || !box) return;
      const sync = () => {
        box.hidden = sel.value !== v;
      };
      sel.addEventListener('change', sync);
      sync();
    });
    /* نماذج بيانات الموظف (مباشرة العمل): اختيار الموظف من سجل الموظفين يملأ بياناته */
    if (form.empLookup || (form.fields.some((f) => f.key === 'iqama') && form.fields.some((f) => f.key === 'name'))) {
      const emps = (await api('GET', '/api/emp-lookup').catch(() => ({ list: [] }))).list || [];
      if (emps.length) {
        ef.insertAdjacentHTML(
          'afterbegin',
          `<div class="field" style="margin-bottom:12px"><label>اختر الموظف من سجل الموظفين</label><input class="in" id="empPick" list="dl-emps" autocomplete="off" placeholder="ابحث بالرقم الوظيفي أو الاسم أو رقم الهوية..."><datalist id="dl-emps">${emps.map((x) => `<option value="${esc(`${x.empNo ? `${x.empNo} — ` : ''}${x.nameAr}${x.iqama ? ` — ${x.iqama}` : ''}`)}">`).join('')}</datalist><div class="hint">يملأ الاسم والهوية والرقم الوظيفي والجنس والجنسية والمسمى والإدارة، ويمكن تعديلها</div></div>`,
        );
        const MAP = {
          name: 'nameAr',
          iqama: 'iqama',
          empNo: 'empNo',
          gender: 'gender',
          nationality: 'nationality',
          job: 'title',
          department: 'department',
          passport: 'passport',
          iqamaEnd: 'iqamaEnd',
          oldSponsor: 'sponsor',
          joinDate: 'joinDate',
          contractType: 'contractType',
        };
        /* بمجرد اختيار الموظف (من القائمة أو بكتابة رقمه الوظيفي / هويته كاملاً) تنزل بياناته، والفرع باسم فرع النظام المطابق */
        const brN = (b) => {
          const s = String(b || '')
            .trim()
            .replace(/^فرع\s+/, '')
            .replace(/[أإآ]/g, 'ا')
            .replace(/ى/g, 'ي');
          return { جازان: 'جيزان' }[s] || s;
        };
        const pickEmp = (ev) => {
          const q = ev.target.value.trim();
          if (!q) return;
          const x =
            emps.find((y) => `${y.empNo ? `${y.empNo} — ` : ''}${y.nameAr}${y.iqama ? ` — ${y.iqama}` : ''}` === q) ||
            emps.find((y) => (y.empNo && String(y.empNo) === q) || (y.iqama && String(y.iqama) === q));
          if (!x) return;
          Object.entries(MAP).forEach(([k, src]) => {
            const i = $(`[data-key="${k}"]`, ef);
            if (i && x[src]) {
              i.value = x[src];
              i.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
          const bi = $('[data-key="branch"]', ef);
          if (bi && !bi.readOnly && x.branch) {
            const m = (state.config.branches || []).find((b) => brN(b) === brN(x.branch));
            bi.value = m || x.branch;
            bi.dispatchEvent(new Event('change', { bubbles: true }));
          }
          ev.target.value = `${x.empNo ? `${x.empNo} — ` : ''}${x.nameAr}${x.iqama ? ` — ${x.iqama}` : ''}`;
          ef.dispatchEvent(new Event('input'));
        };
        $('#empPick', ef).addEventListener('input', pickEmp);
        $('#empPick', ef).addEventListener('change', pickEmp);
      }
    }
  }
  /* محتوى viewEditor (HTML) */
  function renderViewEditor(form, init, lastNote, linkCase, main, req, route) {
    main.innerHTML = `${head(esc(form.title), req ? `تعديل الطلب رقم <bdi dir="ltr">${esc(req.serial)}</bdi> وإعادة إرساله` : 'املأ البيانات وراجع الخطاب قبل الإرسال', `<a class="btn" href="${req ? `#/req/${req.id}` : '#/new'}">رجوع</a>`)}
      ${lastNote ? `<div class="err">سبب الإعادة من ${esc(lastNote.byName)}: ${esc(lastNote.note)}</div>` : ''}
      ${linkCase ? `<div class="need-att">محضر مرتبط بملف التصفية رقم <bdi dir="ltr">${esc(linkCase.serial)}</bdi> — ${esc(linkCase.data.name || '')}</div>` : ''}
      <datalist id="dl-branches">${state.config.branches.map((b) => `<option value="${esc(b)}">`).join('')}</datalist>
      <div class="editor">
        <form class="card sticky" id="ef" novalidate>
          <div class="grid2">${form.fields
            .filter((f) => !f.hidden)
            .map((f) => fieldHtml(f, init[f.key]))
            .join('')}</div>
          ${!req && form.empSign ? empSignBox() : ''}
          ${!req ? (form.requiredAttachments || []).map((l, i) => `<div class="field full" style="margin-top:14px"><label>${esc(l)}<span class="req">*</span></label><input type="file" class="in" data-reqatt="${i}" accept=".pdf,.png,.jpg,.jpeg"></div>`).join('') : ''}
          ${!req ? (form.requiredIf || []).map(([l], i) => `<div class="field full" style="margin-top:14px" data-reqif="${i}" hidden><label>${esc(l)}<span class="req">*</span></label><input type="file" class="in" data-reqifatt="${i}" accept=".pdf,.png,.jpg,.jpeg"></div>`).join('') : ''}
          ${!req ? (form.optionalAttachments || []).map((l, i) => `<div class="field full" style="margin-top:14px"><label>${esc(l)} <small class="muted">(اختياري)</small></label><input type="file" class="in" data-optatt="${i}" accept=".pdf,.png,.jpg,.jpeg"></div>`).join('') : ''}
          ${!req ? `<div class="field full" style="margin-top:14px"><label>مرفقات أخرى (اختياري)</label><input type="file" class="in" id="files" multiple accept="${ACCEPT}"><div class="hint">PDF، صور، Word، Excel، ZIP — حتى ${state.config.maxUploadMb || 5} ميجابايت للملف</div></div>` : `<div class="field full" style="margin-top:14px"><label>ملاحظة مع إعادة الإرسال</label><input class="in" id="rnote" placeholder="مثال: تم تصحيح رقم الإقامة"></div>`}
          <div id="eerr"></div>
          <div class="row" style="margin-top:14px"><button class="btn primary" id="sendBtn" ${route.length || form.pickApprover || form.pickApprovers ? '' : 'disabled'}>📤 ${req ? 'حفظ وإعادة الإرسال' : 'إرسال الطلب للاعتماد'}</button></div>
          <div class="hint" id="routeHint" style="margin-top:8px">${route.length ? `مسار الاعتماد: ${esc(routeText(route, form.issuer))}` : form.pickApprover ? 'اختر "يوجَّه لاعتماد" ليظهر مسار الاعتماد' : '<span style="color:var(--bad)">لا يوجد مسار اعتماد صالح لهذا الخطاب، تواصل مع مدير النظام</span>'}</div>
        </form>
        <div class="preview-wrap"><div id="pv"></div></div>
      </div>`;
  }
  /* محتوى look (HTML) */
  function renderLook(after, bal, days, info, iq, over, overMax, ret, st, type, x) {
    info.innerHTML = `<div class="lv-h">${icon('calendar')} رصيد الإجازة السنوية${x && x.found && x.name ? ` — ${esc(x.name)}` : ''}</div>
          <div class="lv-g">${st('الرصيد المتاح', bal !== null ? `${bal} يوم` : '—', 'main')}${st('الاستحقاق السنوي', x && x.rate ? `${x.rate} يوم` : '—')}${st('أيام الطلب', days ? `${days} يوم` : '—')}${st('بعد الإجازة', after !== null ? `${after} يوم` : '—', after !== null && after < 0 ? 'neg' : '')}</div>
          <div class="lv-n">${[
            !iq
              ? 'اكتب رقم الهوية / الإقامة أو اختر الموظف لعرض رصيده'
              : x && !x.found
                ? 'الموظف غير موجود في سجل الموظفين (لن يتحقق النظام من الرصيد)'
                : bal !== null
                  ? 'الرصيد محسوب حتى تاريخ بداية الإجازة'
                  : '',
            ret ? `العودة ${ret}` : '',
            type && !type.balance ? 'هذا النوع لا يخصم من الرصيد السنوي' : '',
            type && type.note ? `ℹ ${esc(type.note)}` : '',
            over ? '⛔ الرصيد لا يكفي' : '',
            overMax ? `⛔ الحد الأقصى ${type.max} يوماً` : '',
          ]
            .filter(Boolean)
            .join('<br>')}</div>`;
  }

  async function embedEditor(form, req, route) {
    const em = form.embed;
    const main = shell('', req ? '#/mine' : '#/new');
    const lastNote = req && [...req.history].reverse().find((h) => h.action === 'return');
    main.innerHTML = `${head(esc(form.title), req ? `تعديل الطلب رقم <bdi dir="ltr">${esc(req.serial)}</bdi> وإعادة إرساله` : 'أدخل بيانات التصفية في البرنامج كالمعتاد، ثم أرسلها للاعتماد من أسفل الصفحة', `<a class="btn" href="${req ? `#/req/${req.id}` : '#/new'}">رجوع</a>`)}
      ${lastNote ? `<div class="err">سبب الإعادة من ${esc(lastNote.byName)}: ${esc(lastNote.note)}</div>` : ''}
      <div class="card embed-card"><iframe class="embed-frame" id="emb" title="${esc(form.title)}"></iframe></div>
      <div class="card embed-actions">
        <div id="eerr"></div>
        <div class="embed-bar">
          ${
            !state.user.branch || (req && isAdmin())
              ? `<datalist id="dl-eb">${state.config.branches.map((b) => `<option value="${esc(b)}">`).join('')}</datalist>
          <div class="field" style="max-width:220px"><label>الفرع<span class="req">*</span></label><input class="in" id="ebranch" list="dl-eb" value="${esc((req && req.data.branch) || '')}"></div>`
              : ''
          }
          ${!req ? `<div class="field"><label>مرفقات (اختياري)</label><input type="file" class="in" id="files" multiple accept="${ACCEPT}"></div>` : `<div class="field"><label>ملاحظة مع إعادة الإرسال</label><input class="in" id="rnote" placeholder="مثال: تم تصحيح رصيد الإجازة"></div>`}
          <button class="btn primary" id="sendBtn" ${route.length ? '' : 'disabled'}>📤 ${req ? 'حفظ وإعادة الإرسال' : 'إرسال التصفية للاعتماد'}</button>
        </div>
        <div class="hint" style="margin-top:6px">${route.length ? `مسار الاعتماد: ${esc(routeText(route))}` : '<span style="color:var(--bad)">لا يوجد مسار اعتماد صالح، تواصل مع مدير النظام</span>'}</div>
      </div>`;
    const frame = $('#emb');
    await loadFrame(frame, em.src);
    if (req) embedRestore(frame, em, req.data.state);
    embedHide(frame, em.hide);
    fitFrame(frame);
    const doc = frame.contentDocument;
    doc.addEventListener('input', () => fitFrame(frame));
    doc.addEventListener('click', () => setTimeout(() => fitFrame(frame), 50));
    $('#sendBtn').onclick = async () => {
      const btn = $('#sendBtn');
      $('#eerr').innerHTML = '';
      const pick = embedPick(frame, em);
      if (!pick.name || !pick.iqama) {
        $('#eerr').innerHTML = '<div class="err">أدخل اسم الموظف ورقم الإقامة في البرنامج أولاً</div>';
        return;
      }
      if (embedBasicMissing(frame)) {
        $('#eerr').innerHTML = '<div class="err">الراتب الأساسي مطلوب في برنامج التصفية — لا تكتمل التصفية بدونه</div>';
        return;
      }
      const branch = $('#ebranch') ? $('#ebranch').value.trim() : (req && req.data.branch) || state.user.branch || '';
      if (!branch) {
        $('#eerr').innerHTML = '<div class="err">حدد الفرع</div>';
        return;
      }
      /* كل ما يُقرأ من البرنامج (الاسم، الإقامة، الصافي، الجنسية، التواريخ) يُحفظ مع الطلب */
      const data = { ...pick, date: req ? req.data.date : today(), branch, state: embedCollect(frame, em) };
      btn.disabled = true;
      try {
        let saved;
        if (req) saved = await api('PUT', `/api/requests/${req.id}`, { data, note: $('#rnote').value });
        else {
          try {
            saved = await api('POST', '/api/requests', { type: form.id, data });
          } catch (err) {
            if (err.status !== 409 || !confirm(`${err.message}\n\nهل تريد إرسال الطلب رغم ذلك؟`)) throw err;
            saved = await api('POST', '/api/requests', { type: form.id, data, confirmDuplicate: true });
          }
          for (const file of $('#files').files) {
            try {
              await uploadFile(saved.id, file);
            } catch (err) {
              toast(err.message, true);
            }
          }
        }
        toast(req ? 'تمت إعادة إرسال الطلب' : `تم إرسال الطلب رقم ⁦${saved.serial}⁩`);
        location.hash = `#/req/${saved.id}`;
      } catch (err) {
        $('#eerr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
        btn.disabled = false;
      }
    };
  }

  return { viewEditor };
};
