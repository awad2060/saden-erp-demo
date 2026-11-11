/* دوال forms.js (forms-fn-3): buildBlocks، buildFieldDef، B، editableFully، builtinDef، applyOverride، setCustomForms، dashSectionsOf، dashBranchOf، cap، baseSee، isOpsForm، canSee، formAllowed، formAllowedPart2، formAllowedPart، settingsTabs، ymd، workDaysSince، bpKaf، bpN، bpR، bpNat، bpNatOf، bpSaudi، bpStartDays، bpCalc، buildAllow، bpOver50، bpSummary، sheetLetterData
 * جزء مشترك بين الخادم (require) والواجهة (يُحمَّل قبل forms.js). H: أسماء forms.js التي يحتاجها (تُقرأ وقت الاستخدام) */
(function (root, part) {
  if (typeof module === 'object' && module.exports) module.exports = part;
  else (root.SADEN_FORMS_PARTS = root.SADEN_FORMS_PARTS || {})['forms-fn-3'] = part;
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  /* جزء من buildCustom: const defs = def.fields || [];… */
  function buildBlocks(def) {
    const defs = def.fields || [];
    const inputs = defs.filter((f) => f.type !== 'heading');
    const fv = (f, d) => (f.type === 'branch' ? String(d[f.key] || '') : H.fieldText(f, d));
    const fill = (t, d) =>
      H.esc(t || '')
        .replace(/\{([^{}]{1,80})\}/g, (m, label) => {
          const name = label.trim();
          if (name === 'التفقيط') return H.val(H.tafqeet(d[def.amountKey]), '....................');
          if (name === 'الفرع') return H.val(d.branch);
          if (name === 'التاريخ') return H.val(H.fmtDate(d.date));
          const f = inputs.find((x) => x.label === name);
          return f ? H.val(fv(f, d)) : m;
        })
        .replace(/\n/g, '<br>');
    /* تعريف الحقل كما يستخدمه محرر الطلب والخادم */
    const { fieldDef, fieldsTable, tableHtml } = buildFieldDef(def, fv, inputs);
    const legacy = (d) => `${def.intro ? `<p class="l-para">${fill(def.intro, d)}</p>` : ''}
      ${def.showTable ? fieldsTable(null, d) : ''}
      ${
        def.showTable
          ? inputs
              .filter((f) => f.type === 'textarea' && f.inLetter !== false && H.shownBy(f, d))
              .map((f) => H.decisionBox(H.esc(f.label), H.esc(d[f.key]), true))
              .join('')
          : ''
      }
      ${
        def.showTable
          ? inputs
              .filter((f) => f.type === 'table' && f.inLetter !== false && H.shownBy(f, d))
              .map((f) => `<h4 class="l-sec">${H.esc(f.label)} :</h4>${tableHtml(f, d)}`)
              .join('')
          : ''
      }
      ${def.outro ? `<p class="l-para">${fill(def.outro, d)}</p>` : ''}`;
    /* نص الخطاب أقسام مرتبة يحددها مصمم النموذج */
    const blocks = (d) =>
      def.blocks
        .map((b) => {
          const f = b.key && inputs.find((x) => x.key === b.key);
          if (f && !H.shownBy(f, d)) return '';
          switch (b.type) {
            case 'para':
              return b.text ? `<p class="l-para">${fill(b.text, d)}</p>` : '';
            case 'heading':
              return b.text ? `<h4 class="l-sec">${H.esc(b.text)}</h4>` : '';
            case 'fields':
              return fieldsTable(b.keys, d);
            case 'box':
              return H.decisionBox(H.esc(b.title || ''), fill(b.text, d), true);
            case 'table':
              return f ? `${b.title ? `<h4 class="l-sec">${H.esc(b.title)}</h4>` : ''}${tableHtml(f, d)}` : '';
            case 'long':
              return f ? H.decisionBox(H.esc(b.title || f.label), H.esc(d[f.key]).replace(/\n/g, '<br>'), true) : '';
            default:
              return '';
          }
        })
        .join('');
    const sumF = inputs.find((f) => f.key === def.summaryKey) || inputs.find((f) => f.type !== 'table');
    return { blocks, defs, fieldDef, fv, legacy, sumF };
  }
  /* جزء من buildCustom: const fieldDef = (f) => {… */
  function buildFieldDef(def, fv, inputs) {
    const fieldDef = (f) => {
      const base = {
        key: f.key,
        label: f.label,
        required: !!f.required && f.type !== 'heading',
        hint: f.hint || undefined,
        default: f.default || undefined,
        full: !!f.full,
      };
      if (f.showIf && f.showIf.key)
        base.showIf = [
          f.showIf.key,
          String(f.showIf.value || '')
            .split(/[,،]/)
            .map((x) => x.trim())
            .filter(Boolean),
        ];
      if (f.type === 'heading') return { ...base, type: 'heading' };
      if (f.type === 'branch') return { ...base, choicesFrom: 'branches' };
      if (f.type === 'table')
        return {
          ...base,
          type: 'table',
          columns: (f.columns || []).map((c, i) => ({
            key: c.key || `c${i + 1}`,
            label: c.label,
            type: c.type === 'text' ? undefined : c.type,
          })),
        };
      return { ...base, type: f.type === 'text' ? undefined : f.type, options: f.type === 'select' ? f.options || [] : undefined };
    };
    const tableHtml = (f, d) => {
      const cols = f.columns || [],
        rows = Array.isArray(d[f.key]) ? d[f.key] : [];
      return `<table class="lt grid sm"><thead><tr><th>م</th>${cols.map((c) => `<th>${H.esc(c.label)}</th>`).join('')}</tr></thead><tbody>
        ${
          rows
            .map(
              (r, i) =>
                `<tr><td>${i + 1}</td>${cols
                  .map((c, k) => {
                    const v = r[c.key || `c${k + 1}`];
                    return `<td>${H.esc(c.type === 'date' ? H.fmtDate(v) : c.type === 'number' ? H.fmtNum(v) : v)}</td>`;
                  })
                  .join('')}</tr>`,
            )
            .join('') || `<tr><td colspan="${cols.length + 1}">لا يوجد</td></tr>`
        }</tbody></table>`;
    };
    /* حقول جدول البيانات: المختارة، أو كل الحقول القصيرة الظاهرة في الخطاب */
    const autoFields = (d) => inputs.filter((f) => f.inLetter !== false && !['textarea', 'table'].includes(f.type) && H.shownBy(f, d));
    const fieldsTable = (keys, d) => {
      const list =
        keys && keys.length ? keys.map((k) => inputs.find((f) => f.key === k)).filter((f) => f && H.shownBy(f, d)) : autoFields(d);
      const rows = [
        ...list.map((f) => [H.esc(f.label), fv(f, d)]),
        ...(!keys || !keys.length ? (def.noBranch ? [] : [[H.esc(def.branchLabel || 'الفرع'), d.branch]]) : []),
      ];
      return rows.length ? H.infoTable(rows) : '';
    };
    return { fieldDef, fieldsTable, tableHtml };
  }
  /* ---------- تعديل نصوص النماذج الأصلية ----------
   * النماذج البسيطة تتحول لنفس صيغة منشئ النماذج بنصها الحالي، فيعدّلها مدير النظام بالكامل.
   * النماذج المركبة (جداول وحسابات) يُعدَّل فيها عنوان الخطاب والتوقيعات فقط. */
  const B = (label) => `{${label}}`;
  const editableFully = (id) => !!H.TEMPLATES[id];
  function builtinDef(id) {
    const o = H.ORIGINAL[id];
    if (!o) return null;
    const base = {
      id,
      title: o.title,
      letterTitle: typeof o.letterTitle === 'string' ? o.letterTitle : '',
      extraSigs: o.extraSigs || [],
      sigLabel: o.sigLabel || '',
    };
    if (!editableFully(id)) return { ...base, light: true };
    return {
      ...base,
      group: o.group,
      amountKey: o.amountKey || '',
      needsValue: !!o.needsValue,
      noDest: !!o.noDest,
      ...H.TEMPLATES[id],
      fields: o.fields
        .filter((f) => f.key !== 'date' && f.key !== 'branch' && f.key !== H.NOTE_FIELD.key)
        .map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type || 'text',
          required: !!f.required,
          ...(f.options ? { options: f.options } : {}),
        })),
    };
  }
  /* نموذج أصلي بعد تطبيق تعديل مدير النظام عليه (بدون تسجيله) */
  function applyOverride(id, ov) {
    const o = H.ORIGINAL[id];
    if (!o || !ov) return o;
    const common = {
      letterTitle: ov.letterTitle || o.letterTitle,
      extraSigs: (ov.extraSigs || []).length ? ov.extraSigs : o.extraSigs,
      sigLabel: ov.sigLabel || o.sigLabel,
      overridden: true,
      ...H.letterOpts(ov, o),
    };
    if (ov.light || !editableFully(id)) return { ...o, ...common };
    const b = H.buildCustom({ ...ov, id, group: o.group });
    return {
      ...o,
      ...common,
      title: ov.title || o.title,
      fields: b.fields,
      body: b.body,
      amountKey: ov.amountKey || undefined,
      needsValue: !!ov.needsValue,
      noDest: !!ov.noDest,
      extraSigs: b.extraSigs || common.extraSigs,
      summary: ov.summaryKey ? b.summary : o.summary,
      requiredAttachments: b.requiredAttachments || o.requiredAttachments,
      greetText: b.greetText,
      closeText: b.closeText,
      hideGreet: b.hideGreet,
      hideClosing: b.hideClosing,
    };
  }
  function setCustomForms(defs, overrides) {
    if (!Object.keys(H.ORIGINAL).length)
      H.FORMS.forEach((f) => {
        if (!f.custom) H.ORIGINAL[f.id] = f;
      });
    /* إرجاع النماذج الأصلية ثم تطبيق التعديلات الحالية */
    H.FORMS.forEach((f, i) => {
      if (H.ORIGINAL[f.id]) {
        const v = applyOverride(f.id, (overrides || {})[f.id]);
        H.FORMS[i] = v;
        H.byId[f.id] = v;
      }
    });
    for (let i = H.FORMS.length - 1; i >= 0; i--)
      if (H.FORMS[i].custom) {
        delete H.byId[H.FORMS[i].id];
        H.FORMS.splice(i, 1);
      }
    (defs || []).forEach((def) => {
      const f = H.buildCustom(def);
      H.FORMS.push(f);
      H.byId[f.id] = f;
      if (!H.GROUPS.includes(f.group)) H.GROUPS.splice(H.GROUPS.length - 1, 0, f.group);
    });
    H.FORMS.forEach((f, i) => {
      H.FORMS[i] = H.withNote(f);
      H.byId[f.id] = H.FORMS[i];
    });
  }
  /* الأقسام المسموحة: إعداد المستخدم ← مسماه ← الكل */
  function dashSectionsOf(u) {
    if (!u) return [];
    if (Array.isArray(u.dashSections)) return u.dashSections.filter((k) => H.DASH_KEYS.includes(k));
    const r = H.roleOf(u);
    return r && Array.isArray(r.dashSections) ? r.dashSections.filter((k) => H.DASH_KEYS.includes(k)) : H.DASH_KEYS.slice();
  }
  /* مدير الفرع ومحاسب الفرع يرون لوحة المؤشرات مقيدة بفرعهم */
  const dashBranchOf = (u) => (u && u.role !== 'admin' && u.branch && (u.role === 'accountant' || u.branchManager) ? u.branch : '');
  /* الإجراءات: مدير النظام له كلها دائماً، وغيره حسب مسماه (يرى الكل الافتراضي من إعداد المستخدم) */
  function cap(u, key) {
    if (!u) return false;
    if (u.role === 'admin') return true;
    const r = H.roleOf(u);
    if (r && r.caps && typeof r.caps[key] === 'boolean') return r.caps[key];
    return false;
  }
  /* ترتيب القرار في الصفحات: إعداد المستخدم نفسه ← مسماه ← الافتراضي حسب نوع حسابه */
  function baseSee(u, key) {
    const r = H.roleOf(u || {});
    return r && r.pages && typeof r.pages[key] === 'boolean' ? r.pages[key] : H.pageDefault(u || {}, key);
  }
  const isOpsForm = (id) => !!H.byId[id] && H.OPS_GROUPS.includes(H.byId[id].group);
  const canSee = (u, key) =>
    u && u.opsOnly && (H.OPS_HIDDEN.includes(key) || String(key).startsWith('settings.') || String(key).startsWith('tool:'))
      ? false
      : u && u.pages && typeof u.pages[key] === 'boolean'
        ? u.pages[key]
        : baseSee(u, key);
  function formAllowed(u, id) {
    if (H.byId[id] && H.byId[id].driverForm)
      return !!u && (u.role === 'admin' || (u.flowRoles || []).some((k) => ['driver', 'traffic'].includes(k)));
    if (u && u.role === 'employee' && !Array.isArray(u.allowedForms)) return H.SELF_FORMS.includes(id);
    /* يرفعه محاسب قسم الحفر فقط */
    if (H.byId[id] && H.byId[id].drillAccOnly) return !!u && (u.role === 'admin' || (u.role === 'accountant' && u.branch === 'قسم الحفر'));
    if (
      H.byId[id] &&
      H.byId[id].drillOnly &&
      !(u && (u.role === 'admin' || u.branch === 'قسم الحفر' || (u.flowRoles || []).includes('drillMgr')))
    )
      return false;
    return formAllowedPart2(id, u);
  }
  /* جزء من formAllowed: if (u && u.opsOnly && !isOpsForm(id)) return false… */
  function formAllowedPart2(id, u) {
    if (u && u.opsOnly && !isOpsForm(id)) return false;
    if (H.byId[id] && H.byId[id].autoOnly) return false;
    if (H.byId[id] && H.byId[id].legalFlow) return !!u && (u.role === 'admin' || (u.flowRoles || []).includes('legal'));
    /* نموذج التوظيف يرفعه مسؤولو التوظيف المحددون في دورته (ومدير النظام) */
    if (H.byId[id] && H.byId[id].hiringFlow) return !!u && (u.role === 'admin' || (u.flowRoles || []).includes('recruiter'));
    /* قرار نقل موظف: شئون الموظفين المحددة في دورته ترفعه (وتختار الفرعين من كل الفروع) */
    if (H.byId[id] && H.byId[id].transferFlow && u && (u.flowRoles || []).includes('transHr')) return true;
    if (
      H.byId[id] &&
      (H.byId[id].hrFlow || H.byId[id].workStartFlow) &&
      u &&
      ['transHr', 'empMgr'].some((k) => (u.flowRoles || []).includes(k))
    )
      return true;
    return formAllowedPart(id, u);
  }
  /* جزء من formAllowed: if (byId[id] && byId[id].scrapFlow)… */
  function formAllowedPart(id, u) {
    if (H.byId[id] && H.byId[id].scrapFlow)
      return !!u && (u.role === 'admin' || ['wsAcc', 'maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k)));
    if (H.byId[id] && H.byId[id].issueFlow)
      return !!u && (u.role === 'admin' || ['maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k)));
    if (H.byId[id] && H.byId[id].group === 'الورشة' && u && ['maintWs', 'storeMgr'].some((k) => (u.flowRoles || []).includes(k)))
      return true;
    /* مسؤول الشئون القانونية أو التوظيف (معتمد) يرفع نموذج دورته فقط، إلا إذا أتاح له مدير النظام صفحة رفع الطلبات صراحة */
    if (
      u &&
      u.role === 'approver' &&
      ['legal', 'recruiter', 'transHr', 'empMgr'].some((k) => (u.flowRoles || []).includes(k)) &&
      !(u.pages && u.pages.new === true)
    )
      return false;
    if (u && Array.isArray(u.allowedForms)) return u.allowedForms.includes(id);
    const r = H.roleOf(u || {});
    return !(r && Array.isArray(r.allowedForms)) || r.allowedForms.includes(id);
  }
  const settingsTabs = (u) => H.PAGES.filter(([k]) => k.startsWith('settings.') && canSee(u, k)).map(([k]) => k.slice(9));

  /* عدد أيام العمل منذ تاريخ معين حتى اليوم، بدون أيام نهاية الأسبوع والإجازات الرسمية
   * cal: { weekend: [5, 6], holidays: [{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', name }] } */
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function workDaysSince(since, cal, nowMs) {
    if (!since) return 0;
    const weekend = (cal && cal.weekend) || [5, 6];
    const hol = (cal && cal.holidays) || [];
    const d = new Date(since);
    d.setHours(0, 0, 0, 0);
    const end = new Date(nowMs || Date.now());
    end.setHours(0, 0, 0, 0);
    let n = 0;
    for (d.setDate(d.getDate() + 1); d <= end && n < 3650; d.setDate(d.getDate() + 1)) {
      const k = ymd(d);
      if (!weekend.includes(d.getDay()) && !hol.some((h) => k >= h.from && k <= (h.to || h.from))) n++;
    }
    return n;
  }
  const bpKaf = (k) => (H.BP_KAFALA.includes(k) ? k : H.BP_KAF_OLD[k] || '');
  const bpN = (v) => {
    const n = Number(String(v == null ? '' : v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const bpR = (v) => Math.round(v * 100) / 100;
  /* الجنسية من ملف الموظف؛ وإن لم توجد (موظف مضاف يدوياً) فمن أول رقم في الإقامة (1 = سعودي) */
  const bpNat = (iq) => (String(iq || '').trim() ? (String(iq).trim()[0] === '1' ? 'سعودي' : 'غير سعودي') : '');
  const bpNatOf = (l) => String(l.nationality || '').trim() || bpNat(l.iqama);
  const bpSaudi = (nat) => /سعود/.test(nat || '') && !/غير/.test(nat || '');
  /* بداية دوام: الشهر 30 يوماً، المباشرة يوم ي ← (31 − ي) يوماً ÷ 30 (يوم 1 = شهر كامل) */
  const bpStartDays = (d) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ''));
    if (!m) return null;
    return Math.max(1, Math.min(30, 31 - +m[3]));
  };
  function bpCalc(l) {
    const { allow, code, days, daysDed, ded, expense, ext, f, g, gosi, gross, kaf, mudad, nat, outside, paid, warn, work } = buildAllow(l);
    if (code === 7 && !g('due')) warn.push('مطلوب مبلغ المستحقات');
    if (code === 6 && days == null) warn.push('حدد تاريخ بداية الدوام');
    if (l.payBy) warn.push(`يتحمل راتبه فرع ${l.payBy} هذا الشهر (قرار النقل) — احذفه من البيان`);
    if (code === 4 && g('settlement') + g('leaveAllow') + g('due') > 0) warn.push('أجازة مع مبالغ مستحقة');
    if (work && !g('basic') && !g('due')) warn.push('الراتب الأساسي فارغ');
    if (work && paid < 0) warn.push('الخصومات أكبر من الراتب');
    if (!kaf) warn.push('الكفالة غير محددة');
    if (!nat && !ext) warn.push('الجنسية غير محددة');
    return { code, kaf, ext, nat, allow: bpR(allow), ded, daysDed, gross, paid, net: paid, gosi, expense, mudad, outside, warn, days, f };
  }
  /* جزء من bpCalc: const code = BP_STATUS.indexOf(l.status) + 1,… */
  function buildAllow(l) {
    const code = H.BP_STATUS.indexOf(l.status) + 1,
      g = (k) => bpN(l[k]),
      kaf = bpKaf(l.kafala),
      ext = kaf === H.BP_OUT,
      work = [1, 6].includes(code);
    const days = code === 6 ? bpStartDays(l.startDate) : null,
      f = days == null ? 1 : days / 30;
    /* الأساسي والبدلات تظهر كاملة دائماً، وأيام ما قبل المباشرة تنزل في الخصومات (خصم أيام):
     * السكن والانتقال والإقامة تُستحق كاملة، والأساسي والجوال والموقع / الإعاشة والبدلات الأخرى حسب أيام الدوام */
    const allow = H.BP_ALLOW.reduce((s, [k]) => s + g(k), 0),
      daysDed = work && f < 1 ? bpR(H.BP_PRORATE.reduce((s, k) => s + g(k), 0) * (1 - f)) : 0;
    const ded = bpR(H.BP_DED.reduce((s, [k]) => s + g(k), 0) + daysDed);
    const nat = bpNatOf(l),
      gross = bpR(work ? g('basic') + allow : 0);
    const paid = bpR(g('due') + (work ? gross - ded : code === 5 ? g('leaveAllow') : 0));
    const gosi =
      !nat || ext || code === 7 || !kaf ? 0 : bpR((g('basic') + g('housing')) * f * (bpSaudi(nat) ? H.BP_GOSI.sa : H.BP_GOSI.other));
    const expense = bpR(
      gross +
        g('due') +
        g('settlement') +
        (code === 5 ? g('leaveAllow') : 0) -
        (work ? H.BP_DED_COST.reduce((s, k) => s + g(k), 0) + daysDed : 0),
    );
    const mudad = !ext && kaf && work ? paid : 0;
    const outside = bpR(paid - mudad + g('settlement'));
    const warn = [];
    if (!code) warn.push('حالة غير معروفة');
    if (code === 2 && !g('settlement')) warn.push('مطلوب مبلغ التصفية');
    if (code === 3 && !g('settlement')) warn.push('مطلوب الجزء المحمل على الفرع');
    if (code === 5 && !g('leaveAllow')) warn.push('مطلوب بدل أثناء الأجازة');
    return { allow, code, days, daysDed, ded, expense, ext, f, g, gosi, gross, kaf, mudad, nat, outside, paid, warn, work };
  }
  /* خصومات أكثر من 50% من إجمالي الراتب (على رأس العمل / بداية دوام) — لا تُقبل في مدد */
  const bpOver50 = (l, c = bpCalc(l)) =>
    [1, 6].includes(c.code) && c.gross - c.daysDed > 0 && c.ded - c.daysDed > (c.gross - c.daysDed) * 0.5;
  function bpSummary(lines) {
    const L = (lines || []).map((l) => ({ l, c: bpCalc(l) }));
    const S = (f, X = L) => bpR(X.reduce((s, x) => s + f(x), 0)),
      g = (x, k) => bpN(x.l[k]);
    const byKafala = Object.fromEntries(
      H.BP_KAFALA.map((k) => {
        const X = L.filter((x) => x.c.kaf === k);
        return [
          k,
          {
            n: X.length,
            paid: S((x) => x.c.paid, X),
            mudad: S((x) => x.c.mudad, X),
            expense: S((x) => x.c.expense, X),
            gosi: S((x) => x.c.gosi, X),
          },
        ];
      }),
    );
    const paid = S((x) => x.c.paid),
      mudad = S((x) => x.c.mudad),
      expense = S((x) => x.c.expense),
      settle = S((x) => g(x, 'settlement'));
    const ded = Object.fromEntries(H.BP_DED.map(([k]) => [k, S((x) => (x.c.code === 1 || x.c.code === 6 ? g(x, k) : 0))]));
    return {
      count: L.length,
      gross: S((x) => x.c.gross),
      paid,
      net: paid,
      mudad,
      external: byKafala[H.BP_OUT].paid,
      outside: bpR(paid - mudad + settle),
      expense,
      ctc: expense,
      gosi: S((x) => x.c.gosi),
      settle,
      adv: bpR(ded.adv + ded.custody),
      legal: ded.legal,
      ded,
      inside: bpR(paid - byKafala[H.BP_OUT].paid),
      notMudad: bpR(paid - mudad + settle),
      warnings: L.reduce((s, x) => s + (x.c.warn.length ? 1 : 0), 0),
      unassigned: L.filter((x) => !x.c.kaf).length,
      kafalaDiff: L.filter((x) => !x.c.kaf).length,
      byKafala,
    };
  }
  const sheetLetterData = (d, branch) => ({
    date: d.date,
    amount: String(H.sheetTotal(d) || ''),
    branch: d.branch || branch || '',
    sheetType: d.sheetType || '',
    name: d.name || '',
    iqama: d.iqama || '',
    month: d.month || '',
    year: d.year || '',
    bulk: d.bulk ? '1' : '',
    count: d.bulk ? (d.rows || []).filter((r) => r.name || r.amount).length : 0,
  });
  return {
    buildBlocks,
    buildFieldDef,
    B,
    editableFully,
    builtinDef,
    applyOverride,
    setCustomForms,
    dashSectionsOf,
    dashBranchOf,
    cap,
    baseSee,
    isOpsForm,
    canSee,
    formAllowed,
    formAllowedPart2,
    formAllowedPart,
    settingsTabs,
    ymd,
    workDaysSince,
    bpKaf,
    bpN,
    bpR,
    bpNat,
    bpNatOf,
    bpSaudi,
    bpStartDays,
    bpCalc,
    buildAllow,
    bpOver50,
    bpSummary,
    sheetLetterData,
  };
});
