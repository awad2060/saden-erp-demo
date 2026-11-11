/* دوال forms.js (forms-fn-2): buildD، buildDecisions، buildAp، renderLicenseAck، clearanceAmount، renderClearance، clearancePart، empShown، certFiles، certRequired، empMissingCerts، empCitizen، saudiCounted، flagOf، empSpan، addDays، branchGeo، countryOf، empNational، scheduleOf، punchModeOf، scheduleHours، hrPolicyOf، eosOf، gosiOf، empLeave، empLeavePart2، empLeavePart، pageDefault، pageDefaultValue9، pageDefaultValue8، pageDefaultValue7، pageDefaultValue6، pageDefaultValue5، pageDefaultValue4، pageDefaultValue3، pageDefaultValue2، pageDefaultValue، fieldText، letterOpts، shownBy، buildCustom
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-fn-2'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  /* جزء من renderLetter: const d = data || {};… */
  function buildD(data, form, vs) {
    const d = data || {};
    vs.ctx = vs.ctx || {};
    const { decisions, dest, extraSigs, noSig, qr, route, side, sideDecisions, sigTask, sigs, title } = buildDecisions(vs.ctx, d, form);
    /* في الصفحة المضغوطة يأخذ رمز QR خانة بجانب التوقيعات بدل أسفل الصفحة */
    vs.sigCols =
      route.filter((st, i) => (!st.task || sigTask(st)) && !noSig(st, i)).length + extraSigs.length + (form.compact && qr ? 1 : 0);
    vs.sigsHtml = sigs;
    /* نموذج التوظيف الذي رفعه شئون الموظفين: توقيعه في خانة مرحلته، بدون خانة مسئول التوظيف */
    if (form.legalFlow || (form.issuer && !d.byHr)) {
      const issued = vs.ctx.serial && vs.ctx.createdByName;
      /* توقيع مُصدر الخطاب (الشئون القانونية / مسئول التوظيف) ثم توقيعات مراحل الاعتماد */
      vs.sigsHtml = `<div class="l-sig"><div>${H.esc(form.issuer || 'الشئون القانونية')}</div>${issued && vs.ctx.createdBySig ? `<img class="l-sig-img" src="/api/signatures/${encodeURIComponent(vs.ctx.createdBySig)}" alt="توقيع ${H.esc(vs.ctx.createdByName)}">` : ''}${issued ? `<div class="stamp ok">صادر إلكترونياً<br>${H.esc(vs.ctx.createdByName)}<br><small>${H.esc(H.fmtDate(vs.ctx.createdAt || d.date))}</small></div>` : '<div class="l-sig-line">...........................</div>'}</div>${sigs}`;
      vs.sigCols = 1 + route.filter((st, i) => (!st.task || sigTask(st)) && !noSig(st, i)).length;
    }
    /* كل الخطابات بترويسة الشركة ما عدا التصفية (لها تصميمها من برنامج التصفية) */
    const head = H.LETTERHEAD && !form.embed ? '<img class="l-head" src="header.png" alt="شركة سادن المتخصصة للاستشارات الجيولوجية">' : '';
    return { d, decisions, dest, head, qr, side, sideDecisions, title };
  }
  /* جزء من renderLetter: const { ap, decisions, dest, extraSigs, isRej, noS… */
  function buildDecisions(ctx, d, form) {
    const { ap, decisions, dest, extraSigs, isRej, noSig, person, rej, route, side, sideDecisions, sigTask, title } = buildAp(ctx, d, form);
    const sigs =
      extraSigs.join('') +
      route
        .map((s, i) => {
          /* مرحلة إبداء الرأي (إعادة توجيه) لا تظهر في الخطاب */
          if ((s.task && !sigTask(s)) || s.consult || noSig(s, i)) return '';
          const p = person(i);
          let mark = '<div class="l-sig-line">...........................</div>';
          if (ap[i])
            mark = `${ap[i].sig ? `<img class="l-sig-img" src="/api/signatures/${encodeURIComponent(ap[i].sig)}" alt="توقيع ${H.esc(ap[i].name)}">` : ''}<div class="stamp ok">معتمد إلكترونياً<br>${H.esc(ap[i].name)}<br><small>${H.esc(H.fmtDate(ap[i].at))}</small></div>`;
          else if (isRej(i)) mark = `<div class="stamp no">مرفوض<br>${H.esc(rej.name)}<br><small>${H.esc(H.fmtDate(rej.at))}</small></div>`;
          return `<div class="l-sig"><div>${H.esc(sigTask(s) || (form.sigLabel === 'step' ? s.label : p.title || s.label))}</div>${mark}</div>`;
        })
        .join('');

    const qr = ctx.verify
      ? `<div class="l-qr"><img src="/qr/${H.esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق من صحة الخطاب</small></div>`
      : '';
    return { decisions, dest, extraSigs, noSig, qr, route, side, sideDecisions, sigTask, sigs, title };
  }
  /* جزء من renderLetter: const route = ctx.route && ctx.route.length ? ctx.… */
  function buildAp(ctx, d, form) {
    const route = ctx.route && ctx.route.length ? ctx.route : H.DEFAULT_ROUTE;
    const ap = ctx.approvals || [];
    const rej = ctx.rejection;
    const isRej = (i) => rej && rej.step === i;
    const person = (i) => ap[i] || route[i];
    /* العنوان قد يتغير بعد رفع المحضر الموقّع (paperSigned) */
    const paperUp = !!form.paperLabel && ((ctx.attachLabels || []).includes(form.paperLabel) || !!(d.tasks && d.tasks.vehSign));
    const title = typeof form.letterTitle === 'function' ? form.letterTitle(d, { paperSigned: paperUp }) : form.letterTitle || form.title;

    /* الترويسة: من أعلى سلطة إلى أدناها (عكس ترتيب المسار) */
    /* المرسَل إليهم: قائمة يحددها مدير النظام للنموذج، أو تلقائياً من مسار الاعتماد */
    const destRow = (pre, name, ttl) =>
      `<div class="l-dest-row"><span>السيد ${H.esc(pre || 'الأستاذ')} / ${H.esc(name)}</span><span>${H.esc(ttl)}</span></div>`;
    const dest =
      form.recipientsMode === 'custom' && (form.recipients || []).length
        ? form.recipients.map((x) => destRow(x.prefix, x.name, x.title)).join('')
        : route
            .map((st, i) => (st.task || st.consult ? '' : destRow(person(i).prefix, person(i).name, person(i).title)))
            .reverse()
            .join('');

    const decisionOf = (s, i) => {
      if (isRej(i)) return `<div class="l-dec rej">✖ ${H.esc(s.label)} (${H.esc(rej.name)}): مرفوض — ${H.esc(rej.note)}</div>`;
      const a = ap[i];
      if (!a) return '';
      return `<div class="l-dec">✔ ${H.esc(s.label)} (${H.esc(a.name)}): معتمد${a.amount ? ` — القيمة المعتمدة: <b>${H.esc(H.fmtNum(a.amount))}</b> ريال` : ''}${a.note ? ` — ${H.esc(a.note)}` : ''}</div>`;
    };
    const side = form.sideBox;
    const inSide = (s) => side && !s.consult && `${s.label || ''} ${s.title || ''}`.includes(side.match);
    const decisions = route.map((s, i) => (inSide(s) || s.task || s.consult ? '' : decisionOf(s, i))).join('');
    const sideDecisions = side ? route.map((s, i) => (inSide(s) ? decisionOf(s, i) : '')).join('') : '';

    /* خانات التوقيع اليدوي (من نموذج الورد) تُخفى إذا كان صاحبها مرحلة اعتماد في المسار، حتى لا يتكرر التوقيع */
    const norm = (x) =>
      String(x || '')
        .replace(/\s+/g, ' ')
        .trim();
    const inRoute = route
      .filter((s) => !s.task && !s.consult)
      .flatMap((s, i) => [norm(s.label), norm((person(route.indexOf(s)) || {}).title)])
      .filter(Boolean);
    const covered = (t) =>
      inRoute.includes(norm(t)) || (norm(t) === 'مدير الفرع' && inRoute.some((n) => n.startsWith('مدير فرع') || n === 'مدير الفرع'));
    const paperSigned = !!form.paperLabel && (ctx.attachLabels || []).includes(form.paperLabel);
    const extraSigs = (form.extraSigs || [])
      .filter((t) => !covered(t))
      .map(
        (t) =>
          `<div class="l-sig"><div>${H.esc(t)}</div>${paperSigned && (form.paperSigs || []).includes(t) ? '<div class="stamp ok">موقّع<br><small>في المحضر المرفوع</small></div>' : '<div class="l-sig-line">...........................</div>'}</div>`,
      );
    /* مراحل مهام يظهر توقيع صاحبها الإلكتروني على الخطاب (sigTasks: المهمة ← عنوان الخانة) */
    const sigTask = (s) => s.task && (form.sigTasks || {})[s.task];
    /* مراحل تعتمد بدون خانة توقيع على الخطاب (hideSigs في تعريف النموذج) */
    const isBranchMgr = (n) => n === 'مدير الفرع' || n.startsWith('مدير فرع');
    /* المحضر المطبوع للتوقيع يظهر فيه المسلِّم والمستلم فقط، وتظهر توقيعات المسار بعد رفع المحضر الموقّع */
    const noSig = (s, i) =>
      (form.paperLabel && !paperSigned) ||
      (form.hideSigs || []).some((t) =>
        [norm(s.label), norm((person(i) || {}).title)].some((n) => n === norm(t) || (norm(t) === 'مدير الفرع' && isBranchMgr(n))),
      );
    return { ap, decisions, dest, extraSigs, isRej, noSig, person, rej, route, side, sideDecisions, sigTask, title };
  }

  /* ---------- إقرار المخالصة المرتبط بالتصفية ----------
   * نفس نص "برنامج المخالصة"، وبياناته من التصفية: الصافي، وتاريخ الالتحاق، وتاريخ نزول الإجازة */
  /* إقرار مصروفات رخصة القيادة: يتكوّن تلقائياً بعد اعتماد «خطاب تعميد مصروفات رخصة قيادة»، ويوقّعه الموظف ويبصم،
   * ولا يُقفل الطلب حتى يُرفع موقّعاً. ctx: { serial, approvedAt, amount, verify } */
  function renderLicenseAck(d, ctx) {
    ctx = ctx || {};
    const amount = Number(String(ctx.amount || '').replace(/,/g, '')) || 0;
    const date = ctx.approvedAt ? H.fmtDate(ctx.approvedAt) : '';
    const dots = '....../....../..........';
    const head = H.LETTERHEAD ? '<img class="l-head" src="header.png" alt="">' : '';
    return `<div class="letter clearance lic-ack${head ? ' has-head' : ''}">${head}
      <div class="l-top"><div>التاريخ : <span class="red">${H.esc(date) || dots}</span></div>${ctx.serial ? `<div>رقم المستند : <bdi dir="ltr" class="red">إقرار-${H.esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">إقرار مصروفات رخصة قيادة</div>
      <p class="c-para">أُقر أنا الموقع أدناه / ${H.val(d.name, '..............................')}
      هوية / إقامة رقم : ${H.val(d.iqama, '....................')}
      وأعمل بوظيفة ${H.val(d.job, '....................')} بفرع ${H.val(d.branch, '....................')}</p>
      <p class="c-para">بأن الشركة قد تحمّلت عني مصروفات رخصة القيادة ( ${H.val(d.licenseType, '..........')} )
      بمبلغ ( ${H.val(amount ? H.fmtNum(amount) : '', '..........')} ) ريال سعودي ( ${H.val(amount ? H.tafqeet(amount) : '', '..............................')} )
      وذلك بموجب خطاب التعميد رقم ( <bdi dir="ltr">${H.val(ctx.serial, '..........')}</bdi> )${date ? ` المعتمد بتاريخ ${H.val(date)}` : ''}.</p>
      <p class="c-para">وأوافق على خصم هذا المبلغ من مستحقاتي لدى الشركة في حال انتهاء خدمتي أو تركي العمل وفقاً لسياسات الشركة ولوائحها الداخلية. وعلى ذلك أوقع ،،</p>
      <div class="c-ack">المقر بما فيه ،،،</div>
      <div class="c-sign"><div>الاسم / ..................................</div><div>التوقيع / ..................................</div><div>البصمة /<div class="c-print"></div></div></div>
      ${
        ctx.serial || ctx.verify
          ? `<div class="c-foot">
        ${ctx.serial ? `<div class="c-link">هذا الإقرار مرتبط بخطاب تعميد مصروفات رخصة القيادة رقم <bdi dir="ltr">${H.esc(ctx.serial)}</bdi>${date ? ` المعتمد نهائياً بتاريخ ${H.esc(date)}` : ''}</div>` : ''}
        ${ctx.verify ? `<div class="c-qr"><img src="/qr/${H.esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق من الخطاب المرتبط</small></div>` : ''}
      </div>`
          : ''
      }
    </div>`;
  }
  /* مبلغ المخالصة: إجمالي المستحقات قبل الخصومات (والتصفيات المحفوظة قبل حفظه: الصافي) */
  const clearanceAmount = (d) => Math.max(Number(d.gross) > 0 ? Number(d.gross) : Number(d.net) || 0, 0);
  function renderClearance(d, ctx) {
    ctx = ctx || {};
    const net = clearanceAmount(d);
    const date = ctx.approvedAt ? H.fmtDate(ctx.approvedAt) : '';
    /* خانة البرنامج "الشركة أو المؤسسة / الفرع / الوظيفة": الجزء الأول الشركة والثاني الفرع */
    const parts = String(d.company || '')
      .split('/')
      .map((x) => x.trim());
    return clearancePart(ctx, d, date, net, parts);
  }
  /* جزء من renderClearance: const company = String(d.payer || '').trim() || pa… */
  function clearancePart(ctx, d, date, net, parts) {
    const company = String(d.payer || '').trim() || parts[0] || ctx.orgName || '';
    const branch = parts[1] || d.branch || '';
    /* التصفية النهائية: نص "مخالصة نهائية / نهاية خدمة" كما في نموذج الشركة */
    const final = d.kind === 'تصفية نهائية';
    if (final) {
      const eos = Number(d.eos) > 0 ? Number(d.eos) : 0;
      /* مدة الخدمة بنفس طريقة "إجمالي مدة الخدمة بالشركة" في برنامج التصفية */
      const dur = /^(\d+) سنة، (\d+) شهر، (\d+) يوم$/.exec(H.durationText(d.startDate, d.endDate)) || [];
      const dots = '....../....../..........';
      return `<div class="letter clearance final">
      <div class="l-top"><div>التاريخ : <span class="red">${H.esc(date) || dots}</span></div>${ctx.serial ? `<div>رقم المستند : <bdi dir="ltr" class="red">مخالصة-${H.esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">إقرار مخالصة نهائية / نهاية خدمة</div>
      <p class="c-para">أُقر أنا الموقع أدناه / ${H.val(d.name, '..............................')}
      الجنسية : ${H.val(d.nationality, '....................')}
      هوية رقم : ${H.val(d.iqama, '....................')}</p>
      <p class="c-para">اني قد استلمت من / ${H.val(company, '..............................')}
      مبلغ ${H.val(H.fmtNum(net), '..........')} ريال سعودي (${H.val(H.tafqeet(net), '..............................')})
      وهذا ما يخص جميع حقوقي المالية والعمالية والمعنوية وذلك منذ العمل لدى الشركة بتاريخ ${H.val(H.fmtDate(d.startDate), dots)}
      وحتى تاريخ ${H.val(H.fmtDate(d.endDate), dots)}
      وهذه تصفية نهائية متضمنة مكافأة نهاية الخدمة بمبلغ ( ${H.val(eos ? `${H.fmtNum(eos)} ريال سعودي` : '', '..............................')} )
      عن مدة خدمة ${H.val(dur[1], '.....')} سنة و ${H.val(dur[2], '....')} شهر و ${H.val(dur[3], '.....')} يوم .
      هذا الإقرار يعتبر مخالصة نهائية لا يحق لي بعدها مطالبة الشركة بأي شيء لا مادياً ولا معنوياً ولا عمالياً . وعلى ذلك أوقع ،،</p>
      <div class="c-ack">المقر بما فيه ،،،</div>
      <div class="c-sign"><div>الاسم / ..................................</div><div>التوقيع / ..................................</div><div>البصمة /<div class="c-print"></div></div></div>
      ${
        ctx.serial || ctx.verify
          ? `<div class="c-foot">
        ${ctx.serial ? `<div class="c-link">هذه المخالصة مرتبطة بتصفية الحساب رقم <bdi dir="ltr">${H.esc(ctx.serial)}</bdi>${ctx.approvedAt ? ` المعتمدة نهائياً بتاريخ ${H.esc(date)}` : ' (لم تُعتمد التصفية بعد — لا تُسلَّم للموظف قبل الاعتماد النهائي)'}</div>` : '<div></div>'}
        ${ctx.verify ? `<div class="c-qr"><img src="/qr/${H.esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق من التصفية المرتبطة</small></div>` : ''}
      </div>`
          : ''
      }
    </div>`;
    }
    return `<div class="letter clearance">
      <div class="l-top"><div>التاريخ : <span class="red">${H.esc(date) || '....../....../..........'}</span></div>${ctx.serial ? `<div>رقم المستند : <bdi dir="ltr" class="red">مخالصة-${H.esc(ctx.serial)}</bdi></div>` : ''}</div>
      <div class="l-title">إقرار مخالصة نهائية</div>
      <p class="c-para">أُقر أنا الموقع أدناه / ${H.val(d.name, '..............................')}<br>
      الجنسية : ${H.val(d.nationality, '....................')}<br>
      الفرع : ${H.val(branch, '....................')}<br>
      هوية / إقامة رقم : ${H.val(d.iqama, '....................')}</p>
      <p class="c-para">أنني قد استلمت من شركة / مؤسسة / ${H.val(company, '....................')}<br>
      مبلغ ${H.val(H.fmtNum(net), '..........')} ريال سعودي<br>
      ${H.val(H.tafqeet(net), '..............................')}<br>
      وذلك مقابل جميع حقوقي المالية والمعنوية منذ بداية عملي بتاريخ ${H.val(H.fmtDate(d.startDate), '....../....../..........')}
      وحتى تاريخ ${H.val(H.fmtDate(d.endDate), '....../....../..........')} .</p>
      <p class="c-para">ويعد هذا الإقرار مخالصة نهائية لا يحق لي بعدها مطالبة الشركة / المؤسسة بأي مستحقات مالية أو عمالية وعلى ذلك أوقع .</p>
      <div class="c-sign"><div>الاسم : ..................................</div><div>التوقيع : ..................................</div><div>البصمة :<div class="c-print"></div></div></div>
      <!-- الرمز بجوار سطر الربط داخل الصفحة نفسها (لا يطفو فوق النص ولا ينزل لصفحة ثانية) -->
      ${
        ctx.serial || ctx.verify
          ? `<div class="c-foot">
        ${ctx.serial ? `<div class="c-link">هذه المخالصة مرتبطة بتصفية الحساب رقم <bdi dir="ltr">${H.esc(ctx.serial)}</bdi>${ctx.approvedAt ? ` المعتمدة نهائياً بتاريخ ${H.esc(date)}` : ' (لم تُعتمد التصفية بعد — لا تُسلَّم للموظف قبل الاعتماد النهائي)'}</div>` : '<div></div>'}
        ${ctx.verify ? `<div class="c-qr"><img src="/qr/${H.esc(ctx.verify)}.svg" alt="رمز التحقق"><small>امسح الرمز للتحقق من التصفية المرتبطة</small></div>` : ''}
      </div>`
          : ''
      }
    </div>`;
  }
  /* الحقل الشرطي في ملف الموظف (يظهر عند قيمة معيّنة لحقل آخر) */
  const empShown = (f, e) => !f.showIf || [].concat(f.showIf[1]).includes(String((e || {})[f.showIf[0]] || ''));
  const certFiles = (e, c) => ((e && e.files) || []).filter((f) => f.label === c.l);
  const certRequired = (e, c) => !!(c.need && e && e[c.need] === 'نعم');
  const empMissingCerts = (e) => H.EMP_CERTS.filter((c) => certRequired(e, c) && !certFiles(e, c).length);
  /* مواطن: الجنسية سعودية أو رقم الهوية يبدأ بـ 1 */
  const empCitizen = (e) => /سعود|saudi/i.test(e.nationality || '') || /^1\d{9}$/.test(String(e.iqama || '').trim());
  /* محتسب في نطاق التوطين: سعودي نشط لم يُحدَّد له «لا» */
  const saudiCounted = (e) => !!e && e.status !== 'غير نشط' && empCitizen(e) && e.saNitaqat !== 'لا';
  const flagOf = (nat) => {
    const n = String(nat || '')
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, '')
      .replace(/[ًٌٍَُِّْ]/g, '')
      .replace(/^ال/, '');
    if (!n) return '';
    const hit = H.NAT_FLAGS.find(([re]) => re.test(n));
    return hit ? hit[1] : '';
  };
  /* ---------- مدة الخدمة ورصيد الإجازة (نفس طريقة برنامج التصفية) ----------
   * المدة: سنوات وأشهر وأيام من تاريخ الانضمام حتى آخر يوم عمل (أو اليوم)
   * الرصيد السنوي: 21 يوماً لأول 5 سنوات خدمة، و30 يوماً بعدها
   * المستحق بعد آخر عودة = (أيام الخدمة منذ مباشرة العمل بعد آخر إجازة ÷ 365) × الرصيد السنوي
   * وفي حالة عدم النزول من بداية التعيين: أول 5 سنوات × 21 (+ الأشهر × 1.75 + الأيام × 21/365)، وما بعدها × 30 (+ الأشهر × 2.5 + الأيام × 30/365) */
  function empSpan(from, to) {
    const a = new Date(from),
      b = new Date(to);
    if (!from || !to || isNaN(a) || isNaN(b) || b < a) return null;
    let y = b.getUTCFullYear() - a.getUTCFullYear(),
      m = b.getUTCMonth() - a.getUTCMonth(),
      d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) {
      m--;
      d += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    return { y, m, d };
  }
  const addDays = (s, n) => {
    const d = new Date(s);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const branchGeo = (br) => H.BRANCH_GEO[String(br || '').trim()] || null;
  /* دولة عمل الموظف = دولة فرعه، وإلا دولة الشركة */
  const countryOf = (e) => {
    const c = e && typeof e === 'object' ? (branchGeo(e.branch) || {}).country : typeof e === 'string' ? e : '';
    return H.COUNTRY_INFO[c] ? c : H.BASE_COUNTRY;
  };
  /* مواطن دولة العمل (للتأمينات ونهاية الخدمة) — والسعودة تبقى على empCitizen */
  const empNational = (e) => {
    const c = countryOf(e),
      k = H.COUNTRY_INFO[c];
    return c === 'SA' ? empCitizen(e) : !!(k && k.nat.test(e.nationality || ''));
  };
  function scheduleOf(e, list) {
    const L = list || H.WORK_SCHEDULES;
    if (!e || !L.length) return null;
    const own = String(e.workSchedule || '').trim();
    if (own) {
      const m = L.find((x) => x.name === own || x.id === own);
      if (m) return m;
    }
    const keys = [e.empNo, e.iqama, e.id].map((x) => String(x || '').trim()).filter(Boolean);
    const br = String(e.branch || '').trim(),
      sa = empCitizen(e);
    return (
      L.find((x) => x.applyTo === 'employees' && (x.employees || []).some((k) => keys.includes(String(k).trim()))) ||
      L.find((x) => x.applyTo === 'branches' && (x.branches || []).some((b) => String(b).trim() === br)) ||
      L.find((x) => (x.applyTo === 'saudi' && sa) || (x.applyTo === 'nonSaudi' && !sa)) ||
      L.find((x) => x.applyTo === 'all') ||
      null
    );
  }
  /* نوع البصمة الفعلي: المحدد في ملف الموظف، وإلا نوع بصمة دوامه، وإلا مكتبية */
  const punchModeOf = (e, sch) =>
    e && e.punchType === 'بصمة مرنة'
      ? 'flex'
      : e && e.punchType === 'بصمة مكتبية'
        ? 'office'
        : sch && (sch.punch || sch.mode) === 'flex'
          ? 'flex'
          : 'office';
  /* ساعات الشيفت من بدايته ونهايته (الشيفت الليلي يعبر منتصف الليل) */
  const scheduleHours = (x) => {
    const m = (s) => {
      const r = /^(\d{1,2}):(\d{2})$/.exec(s || '');
      return r ? Number(r[1]) * 60 + Number(r[2]) : null;
    };
    const a = m(x && x.start),
      b = m(x && x.end);
    return a === null || b === null ? 0 : Math.round(((b - a + 1440) % 1440 || 1440) / 6) / 10;
  };
  /* السياسة السارية في تاريخ معين (أحدث إصدار تاريخه لا يتجاوز التاريخ) */
  /* السياسة السارية في تاريخ معين لدولة معينة (who = موظف أو رمز دولة، وبدونه دولة الشركة):
   * أحدث إصدار لتلك الدولة تاريخه لا يتجاوز التاريخ، وإن لم يوجد إصدار للدولة فالافتراضي حسب نظام العمل فيها.
   * الإصدارات القديمة بدون دولة تُعد لدولة الشركة */
  function hrPolicyOf(date, who) {
    const d = date || new Date().toISOString().slice(0, 10);
    const c = who ? countryOf(who) : H.BASE_COUNTRY;
    const D = H.HR_COUNTRY_DEFAULTS[c] || H.HR_POLICY_DEFAULT;
    const mine = H.HR_POLICIES.filter((x) => (x.country || H.BASE_COUNTRY) === c);
    const p = mine.filter((x) => x.from <= d).pop() || mine[0] || {};
    const out = { ...H.HR_POLICY_DEFAULT, ...D, ...p, country: c };
    if (!out.eosModel) out.eosModel = D.eosModel || 'sa';
    if (!Array.isArray(out.leaveTypes) || !out.leaveTypes.length) out.leaveTypes = D.leaveTypes || H.HR_POLICY_DEFAULT.leaveTypes;
    return out;
  }
  /* مكافأة نهاية الخدمة التقديرية حسب دولة العمل (للمؤشرات والتقديرات — التصفية الفعلية بحاسبة الجهة الرسمية) */
  function eosOf(e, at) {
    const n = (v) => Number(String(v == null ? '' : v).replace(/,/g, '')) || 0;
    if (!/^\d{4}-\d{2}-\d{2}/.test(e.joinDate || '')) return 0;
    const end = at || e.leaveDate || new Date().toISOString().slice(0, 10);
    const yrs = Math.max(
      0,
      (new Date(end + 'T12:00:00Z') - new Date(String(e.joinDate).slice(0, 10) + 'T12:00:00Z')) / (365.25 * 86400000),
    );
    const pol = hrPolicyOf(end, e);
    if (pol.eosModel === 'none') return 0;
    if (pol.eosModel === 'om') return empNational(e) ? 0 : Math.round(yrs * n(e.basic));
    const w = ['basic', 'housing', 'transport', 'carAllow', 'phoneAllow', 'siteAllow', 'residenceAllow', 'otherAllow'].reduce(
      (a, k) => a + n(e[k]),
      0,
    );
    return Math.round(yrs <= 5 ? (yrs * w) / 2 : 2.5 * w + (yrs - 5) * w);
  }
  /* اشتراك التأمينات: الأجر الخاضع = الأساسي + السكن (بين الحد الأدنى والأعلى)، والنسب حسب الجنسية من السياسة السارية */
  function gosiOf(e, date) {
    const pol = hrPolicyOf(date, e),
      n = (v) => Number(String(v == null ? '' : v).replace(/,/g, '')) || 0;
    const citizen = empNational(e);
    const raw = n(e.basic) + n(e.housing);
    const base = raw ? Math.min(Number(pol.gosiMax) || 1e9, Math.max(Number(pol.gosiMin) || 0, raw)) : 0;
    const off = ['غير مسجل', 'مستبعد'].includes(e.gosiStatus);
    const rE = citizen ? Number(pol.gosiSaudiEmp) : Number(pol.gosiNonSaudiEmp),
      rR = citizen ? Number(pol.gosiSaudiEr) : Number(pol.gosiNonSaudiEr);
    const r2 = (v) => Math.round(v * 100) / 100;
    return {
      citizen,
      country: pol.country,
      base: off ? 0 : base,
      rateEmp: rE,
      rateEr: rR,
      emp: off ? 0 : r2((base * rE) / 100),
      er: off ? 0 : r2((base * rR) / 100),
      off,
    };
  }
  function empLeave(e, todayStr) {
    const t = todayStr || new Date().toISOString().slice(0, 10);
    return empLeavePart2(e, t);
  }
  /* جزء من empLeave: const end = e.leaveDate || t;… */
  function empLeavePart2(e, t) {
    const end = e.leaveDate || t;
    const rows = (e.lists || {}).leaves || [];
    const days = (x) => Number(x.days) || (H.daysBetween(x.from, x.to) || 0) + 1;
    const span = /^\d{4}-\d{2}-\d{2}$/.test(e.joinDate || '') ? empSpan(e.joinDate, end) : null;
    const years = span ? span.y : 0;
    /* رصيد الإجازة من السياسة السارية في نهاية الفترة (21 يوماً، و30 بعد 5 سنوات افتراضياً) */
    const pol = hrPolicyOf(end, e),
      B = Number(pol.annualBase) || 21,
      A = Number(pol.annualAfter) || 30,
      Y = Number(pol.afterYears) || 5;
    /* الرصيد السنوي بنظام العمل (مثل برنامج التصفية): 21 يوماً حتى إتمام 5 سنوات متصلة و30 بعدها — لا يُؤخذ من خانة مستوردة */
    const auto = years >= Y ? A : B;
    const rate = auto;
    const first = span ? Math.min(years, Y) * B + (years <= Y ? span.m * (B / 12) + span.d * (B / 365) : 0) : 0;
    const extra = span && years > Y ? (years - Y) * A + span.m * (A / 12) + span.d * (A / 365) : 0;
    /* مباشرة العمل بعد آخر إجازة: الخانة، وإلا اليوم التالي لنهاية آخر إجازة سنوية في السجل، وإلا تاريخ الانضمام */
    const lastAnnual = rows.filter((x) => x.type === 'سنوية' && x.to && x.to < end).sort((a, b) => b.to.localeCompare(a.to))[0];
    const ret = e.returnDate || (lastAnnual ? addDays(lastAnnual.to, 1) : span ? e.joinDate : '');
    const since = ret && end >= ret ? Math.floor((new Date(end) - new Date(ret)) / 86400000) : 0;
    /* المستحق منذ آخر عودة: الأيام قبل تاريخ إتمام 5 سنوات × 21 ÷ 365، وبعده × 30 ÷ 365 (كسطري بدل الإجازة في برنامج التصفية) */
    const fiveAt = span ? `${Number(e.joinDate.slice(0, 4)) + Y}${e.joinDate.slice(4)}` : '';
    const dd = (a, b) => Math.max(0, Math.floor((new Date(b) - new Date(a)) / 86400000));
    let acc21 = 0,
      acc30 = 0;
    if (since) {
      const cut = !fiveAt || fiveAt >= end ? end : fiveAt <= ret ? ret : fiveAt;
      acc21 = (dd(ret, cut) / 365) * B;
      acc30 = (dd(cut, end) / 365) * A;
    }
    const entitled = acc21 + acc30;
    const usedAfter = rows.filter((x) => x.type === 'سنوية' && ret && x.from >= ret && x.from <= end).reduce((a, x) => a + days(x), 0);
    const prev = Number(e.prevBalance) || 0;
    /* الإجازات المرضية والتعويضية: في سنة الخدمة الحالية (من ذكرى تاريخ الانضمام) */
    return empLeavePart(
      A,
      B,
      Y,
      acc21,
      acc30,
      auto,
      days,
      e,
      end,
      entitled,
      extra,
      first,
      fiveAt,
      pol,
      prev,
      rate,
      ret,
      rows,
      since,
      span,
      usedAfter,
      years,
    );
  }
  /* جزء من empLeave: let from = '',… */
  function empLeavePart(
    A,
    B,
    Y,
    acc21,
    acc30,
    auto,
    days,
    e,
    end,
    entitled,
    extra,
    first,
    fiveAt,
    pol,
    prev,
    rate,
    ret,
    rows,
    since,
    span,
    usedAfter,
    years,
  ) {
    let from = '',
      to = '';
    if (span) {
      const md = e.joinDate.slice(5);
      let y = Number(end.slice(0, 4));
      if (`${y}-${md}` > end) y--;
      from = `${y}-${md}`;
      to = addDays(`${y + 1}-${md}`, -1);
    }
    const inYear = (x) => !from || (x.from >= from && x.from <= to);
    const used = (type) => rows.filter((x) => x.type === type && inYear(x)).reduce((a, x) => a + days(x), 0);
    const r2 = (n) => Math.round(n * 100) / 100;
    /* قيمة بدل الإجازة: على آخر راتب أساسي فقط — الأجر اليومي = الأساسي ÷ 30 */
    const daily = Number(e.basic) > 0 ? Number(e.basic) / 30 : 0;
    const val = (n) => (daily ? r2(n * daily) : 0);
    const balance = r2(entitled + prev - usedAfter);
    return {
      fiveAt,
      done5: years >= Y,
      B,
      A,
      acc21: r2(acc21),
      acc30: r2(acc30),
      daily: r2(daily),
      value: { acc21: val(acc21), acc30: val(acc30), prev: val(prev), used: val(usedAfter), total: val(balance) },
      span,
      years,
      rate,
      auto,
      first: r2(first),
      extra: r2(extra),
      noLeave: r2(first + extra),
      country: pol.country,
      extraSpan: years >= Y ? { y: years - Y, m: span.m, d: span.d } : { y: 0, m: 0, d: 0 },
      ret,
      retSpan: ret ? empSpan(ret, end) : null,
      since,
      entitled: r2(entitled),
      usedAfter,
      prev,
      balance,
      from,
      to,
      sickUsed: used('مرضية'),
      compensatory: used('تعويضية'),
      days,
    };
  }
  function pageDefault(u, key) {
    /* أيقونات التطبيقات وما تحتها (nav:…): تظهر افتراضياً حسب صلاحيات صاحبها، ومدير النظام يخفي منها ما يريد */
    if (String(key).startsWith('nav:')) return true;
    if (u.role === 'employee') return H.EMP_PAGES.includes(key);
    const admin = u.role === 'admin',
      approver = u.role === 'approver',
      acc = u.role === 'accountant';
    if (key.startsWith('settings.')) return admin;
    if (key.startsWith('tool:')) return true;
    const rule = Object.hasOwn(H.PAGE_DEFAULTS, key) ? H.PAGE_DEFAULTS[key] : null;
    return rule ? rule(acc, admin, approver, u) : true;
  }
  /* جزء من pageDefault: admin || (u.flowRoles || []).includes('invMgr')… */
  function pageDefaultValue9(admin, u) {
    return admin || (u.flowRoles || []).includes('invMgr');
  }
  /* جزء من pageDefault: admin || (u.flowRoles || []).includes('invMgr')… */
  function pageDefaultValue8(admin, u) {
    return admin || (u.flowRoles || []).includes('invMgr');
  }
  /* جزء من pageDefault: !!u.branch && (acc || !!u.branchManager)… */
  function pageDefaultValue7(acc, u) {
    return !!u.branch && (acc || !!u.branchManager);
  }
  /* جزء من pageDefault: !!u.branch && (acc || !!u.branchManager)… */
  function pageDefaultValue6(acc, u) {
    return !!u.branch && (acc || !!u.branchManager);
  }
  /* جزء من pageDefault: admin || (u.flowRoles || []).includes('traffic')… */
  function pageDefaultValue5(admin, u) {
    return admin || (u.flowRoles || []).includes('traffic');
  }
  /* جزء من pageDefault: admin || (acc && !!u.branch)… */
  function pageDefaultValue4(acc, admin, u) {
    return admin || (acc && !!u.branch);
  }
  /* جزء من pageDefault: admin || (acc && !!u.branch)… */
  function pageDefaultValue3(acc, admin, u) {
    return admin || (acc && !!u.branch);
  }
  /* جزء من pageDefault: !!u.branch && (acc || !!u.branchManager)… */
  function pageDefaultValue2(acc, u) {
    return !!u.branch && (acc || !!u.branchManager);
  }
  /* جزء من pageDefault: admin ||… */
  function pageDefaultValue(admin, approver, u) {
    return admin || (approver && !!(u.dashboardFlag !== undefined ? u.dashboardFlag : u.dashboard));
  }
  function fieldText(f, d) {
    if (f.picker === 'user') return d[`${f.key.replace(/Id$/, '')}Name`] || '';
    const v = d[f.key];
    if (f.type === 'date') return H.fmtDate(v);
    if (f.type === 'number') return H.fmtNum(v);
    return v == null ? '' : String(v);
  }
  /* خيارات شكل الخطاب المشتركة: المرسَل إليهم، وعنوان صندوق القرار وإظهاره، وسطر مُعد الطلب */
  function letterOpts(def, orig) {
    const o = orig || {};
    return {
      recipientsMode: def.recipientsMode === 'custom' ? 'custom' : 'route',
      recipients: def.recipients || [],
      decisionTitle: def.decisionTitle || o.decisionTitle || '',
      noDecisionBox: def.showDecision === undefined ? !!o.noDecisionBox : !def.showDecision,
      hidePrep: !!def.hidePrep,
    };
  }
  /* الحقل يظهر إذا تحقق شرطه (قيمة حقل آخر = قيمة أو إحدى قيم مفصولة بفاصلة) */
  const shownBy = (f, d) =>
    !f.showIf ||
    !f.showIf.key ||
    String(f.showIf.value || '')
      .split(/[,،]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .includes(String(d[f.showIf.key] || ''));
  function buildCustom(def) {
    const { blocks, defs, fieldDef, fv, legacy, sumF } = H.buildBlocks(def);
    return {
      id: def.id,
      custom: true,
      group: def.group || 'عام',
      title: def.title,
      letterTitle: def.letterTitle || undefined,
      fields: [
        { ...H.F.date, label: def.dateLabel || H.F.date.label },
        ...defs.map(fieldDef),
        ...(def.noBranch ? [] : [{ ...H.F.branch, label: def.branchLabel || H.F.branch.label }]),
      ],
      needsValue: !!def.needsValue,
      amountKey: def.amountKey || undefined,
      noDest: !!def.noDest,
      ...letterOpts(def),
      extraSigs: (def.extraSigs || []).length ? def.extraSigs : undefined,
      sigLabel: def.sigLabel || undefined,
      requiredAttachments: (def.requiredAttachments || []).length ? def.requiredAttachments : undefined,
      greetText: def.greetText || undefined,
      closeText: def.closeText || undefined,
      hideGreet: !!def.hideGreet,
      hideClosing: !!def.hideClosing,
      summary: (d) => (sumF ? fv(sumF, d) : ''),
      body: (d) => (Array.isArray(def.blocks) && def.blocks.length ? blocks(d) : legacy(d)),
    };
  }
  return {
    buildD,
    buildDecisions,
    buildAp,
    renderLicenseAck,
    clearanceAmount,
    renderClearance,
    clearancePart,
    empShown,
    certFiles,
    certRequired,
    empMissingCerts,
    empCitizen,
    saudiCounted,
    flagOf,
    empSpan,
    addDays,
    branchGeo,
    countryOf,
    empNational,
    scheduleOf,
    punchModeOf,
    scheduleHours,
    hrPolicyOf,
    eosOf,
    gosiOf,
    empLeave,
    empLeavePart2,
    empLeavePart,
    pageDefault,
    pageDefaultValue9,
    pageDefaultValue8,
    pageDefaultValue7,
    pageDefaultValue6,
    pageDefaultValue5,
    pageDefaultValue4,
    pageDefaultValue3,
    pageDefaultValue2,
    pageDefaultValue,
    fieldText,
    letterOpts,
    shownBy,
    buildCustom,
  };
});
