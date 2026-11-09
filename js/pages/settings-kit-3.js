'use strict';
/* أجزاء صفحة الإعدادات (3) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['settings-3'] = function (S, ctx) {
  const { $, $$, SF, api, askYesNo, esc, icon, state, toast } = S;
  /* تباين النص الأبيض على اللون (WCAG) */
  function contrastWhite(hex) {
    const ch = (i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const L = 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
    return 1.05 / (L + 0.05);
  }

  /* ---------- رمز التحقق لدخول مدير النظام (في تبويب البريد) ---------- */
  function otpCard(body, s) {
    const o = s.adminOtp || {};
    const box = document.createElement('div');
    box.className = 'card';
    box.id = 'otpCard';
    const draw = (st) => {
      box.innerHTML = `<h3>🔐 رمز التحقق (OTP) لدخول مدير النظام</h3>
        <p class="muted" style="margin-top:0">عند التفعيل: بعد كلمة المرور يرسل النظام رمزاً من 6 أرقام إلى بريد حساب مدير النظام، ولا يدخل إلا به (صالح 10 دقائق، 5 محاولات).</p>
        <p>الحالة: ${st.enabled ? '<span class="chip approved">مفعّل</span>' : '<span class="chip pending">غير مفعّل</span>'} &nbsp; بريد حسابك: <b dir="ltr">${esc(state.user.email || 'غير مسجل')}</b></p>
        ${state.user.email ? '' : '<div class="err">سجّل بريد حساب مدير النظام أولاً من الإعدادات ← المستخدمون.</div>'}
        ${
          st.enabled
            ? '<button class="btn bad" id="otpOff">إيقاف رمز التحقق</button>'
            : `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end"><button class="btn" id="otpTest">📧 إرسال رمز تجربة إلى بريدي</button>
             <div class="field" style="margin:0"><label>الرمز الذي وصلك</label><input class="in" id="otpCode" inputmode="numeric" maxlength="6" dir="ltr" style="width:140px"></div>
             <button class="btn primary" id="otpOn">تفعيل</button></div>
             <div class="hint">يجب أن تكون إعدادات البريد (SMTP) أعلاه صحيحة؛ لا يفعّله النظام إلا بعد وصول رمز التجربة وإدخاله، حتى لا ينقفل الحساب.</div>`
        }
        <div class="hint" style="margin-top:8px">للطوارئ (تعطل البريد): أنشئ ملفاً فارغاً باسم <b dir="ltr">otp-off</b> داخل مجلد <b dir="ltr">data</b> على السيرفر فيتوقف الرمز مؤقتاً، واحذفه بعد إصلاح البريد.</div>
        <div id="otpErr"></div>`;
      const err = (m) => {
        $('#otpErr', box).innerHTML = `<div class="err">${esc(m)}</div>`;
      };
      if ($('#otpTest', box))
        $('#otpTest', box).onclick = async () => {
          try {
            const r = await api('POST', '/api/admin/otp/test', {});
            toast(`أرسلنا رمز التجربة إلى ${r.email}`);
          } catch (e) {
            err(e.message);
          }
        };
      if ($('#otpOn', box))
        $('#otpOn', box).onclick = async () => {
          try {
            const r = await api('POST', '/api/admin/otp/enable', { code: $('#otpCode', box).value });
            toast('تم تفعيل رمز التحقق');
            draw(r.adminOtp);
          } catch (e) {
            err(e.message);
          }
        };
      if ($('#otpOff', box))
        $('#otpOff', box).onclick = async () => {
          if (!(await askYesNo('إيقاف رمز التحقق لدخول مدير النظام؟'))) return;
          try {
            const r = await api('POST', '/api/admin/otp/disable', {});
            toast('تم إيقاف رمز التحقق');
            draw(r.adminOtp);
          } catch (e) {
            err(e.message);
          }
        };
    };
    draw(o);
    body.appendChild(box);
  }

  /* ---------- الإعدادات: الدول والفروع (قاعدة البيانات) ---------- */
  async function settingsCountries(body) {
    const d = await api('GET', '/api/admin/geo');
    if (!d.enabled) {
      body.innerHTML =
        '<div class="card"><h3>الدول والفروع</h3><div class="muted">تعمل هذه الصفحة عند تشغيل النظام على قاعدة البيانات (STORAGE=pg).</div></div>';
      return;
    }
    const cOpt = (sel) =>
      d.countries
        .map((c) => `<option value="${c.code}"${c.code === sel ? ' selected' : ''}>${esc(c.name_ar)} (${c.code})</option>`)
        .join('');
    const yOpt = (sel) =>
      d.currencies
        .map((c) => `<option value="${c.code}"${c.code === sel ? ' selected' : ''}>${c.code} — ${esc(c.name_ar)}</option>`)
        .join('');
    const byCountry = d.branches.reduce((a, b) => {
      a[b.country_code] = (a[b.country_code] || 0) + 1;
      return a;
    }, {});
    renderSettingsCountries(body, byCountry, cOpt, d, yOpt);
    $('#geoCoC', body).onchange = () => {
      const c = d.countries.find((x) => x.code === $('#geoCoC', body).value);
      if (c) $('#geoCoY', body).value = c.currency;
    };
    $('#geoCoS', body).onclick = async () => {
      try {
        await api('PUT', '/api/admin/geo/company', { country_code: $('#geoCoC', body).value, base_currency: $('#geoCoY', body).value });
        toast('تم حفظ دولة الشركة وعملتها');
      } catch (err) {
        toast(err.message, true);
      }
    };
    $$('[data-gb]', body).forEach((tr) => {
      const val = (k) => $(`[data-k="${k}"]`, tr).value;
      const saveRow = async () => {
        const st = $('[data-st]', tr);
        try {
          await api('PUT', `/api/admin/geo/branches/${tr.dataset.gb}`, {
            country_code: val('country_code'),
            city: val('city'),
            currency: val('currency'),
            timezone: val('timezone'),
          });
          st.textContent = '✔';
        } catch (err) {
          st.textContent = '';
          toast(err.message, true);
        }
      };
      $('[data-k="country_code"]', tr).onchange = () => {
        const c = d.countries.find((x) => x.code === val('country_code'));
        if (c) {
          $('[data-k="currency"]', tr).value = c.currency;
          $('[data-k="timezone"]', tr).value = c.timezone;
        }
        saveRow();
      };
      ['city', 'currency', 'timezone'].forEach((k) => {
        $(`[data-k="${k}"]`, tr).onchange = saveRow;
      });
    });
    $('#geoRS', body).onclick = async () => {
      try {
        await api('POST', '/api/admin/geo/rates', {
          rate_date: $('#geoRD', body).value,
          from_ccy: $('#geoRF', body).value,
          to_ccy: $('#geoRT', body).value,
          rate: $('#geoRR', body).value,
        });
        toast('تم حفظ سعر الصرف');
        settingsCountries(body);
      } catch (err) {
        toast(err.message, true);
      }
    };
  }
  /* محتوى settingsCountries (HTML) */
  function renderSettingsCountries(body, byCountry, cOpt, d, yOpt) {
    body.innerHTML = `<div class="card"><h3>الشركة</h3><div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <div class="field"><label>دولة التسجيل</label><select class="in" id="geoCoC">${cOpt(d.company.country_code)}</select></div>
        <div class="field"><label>العملة الأساسية (عملة القوائم المالية)</label><select class="in" id="geoCoY">${yOpt(d.company.base_currency)}</select></div>
        <div class="field"><label>&nbsp;</label><button class="btn primary" id="geoCoS">حفظ</button></div></div>
        <div class="muted" style="font-size:12.5px">الفروع حسب الدولة: ${Object.entries(byCountry)
          .map(([k, n]) => `${esc((d.countries.find((c) => c.code === k) || {}).name_ar || k)}: ${n}`)
          .join(' — ')}</div></div>
      <div class="card"><h3>الفروع</h3><p class="muted" style="margin-top:0">حدد دولة كل فرع ومدينته — تتغير العملة والتوقيت تلقائياً حسب الدولة ويمكن تعديلهما. يحفظ النظام كل سطر عند التعديل.</p>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>الفرع</th><th>الموظفون</th><th>الدولة</th><th>المدينة</th><th>العملة</th><th>التوقيت</th><th></th></tr></thead><tbody>
        ${d.branches.map((b) => `<tr data-gb="${b.id}"><td><b>${esc(b.name)}</b></td><td>${b.emps || ''}</td><td><select class="in sm" data-k="country_code">${cOpt(b.country_code)}</select></td><td><input class="in sm" data-k="city" value="${esc(b.city || '')}" placeholder="المدينة"></td><td><select class="in sm" data-k="currency">${yOpt(b.currency)}</select></td><td><input class="in sm" data-k="timezone" value="${esc(b.timezone || '')}" dir="ltr" style="width:140px"></td><td class="muted" data-st></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><h3>أسعار الصرف</h3><p class="muted" style="margin-top:0">لتوحيد أرقام الفروع والشركات بعملة المجموعة في التقارير ومركز القيادة.</p>
        <div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end"><label class="field" style="margin:0">التاريخ<input class="in" type="date" id="geoRD" value="${new Date().toISOString().slice(0, 10)}"></label>
          <label class="field" style="margin:0">من<select class="in" id="geoRF">${yOpt('EGP')}</select></label><label class="field" style="margin:0">إلى<select class="in" id="geoRT">${yOpt('SAR')}</select></label>
          <label class="field" style="margin:0">السعر<input class="in" id="geoRR" inputmode="decimal" placeholder="مثال: 0.0775" dir="ltr"></label><button class="btn primary" id="geoRS">إضافة</button></div>
        ${d.rates.length ? `<div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>التاريخ</th><th>من</th><th>إلى</th><th>السعر</th><th>بواسطة</th></tr></thead><tbody>${d.rates.map((r) => `<tr><td>${esc(SF.fmtDate(String(r.rate_date).slice(0, 10)))}</td><td>${r.from_ccy}</td><td>${r.to_ccy}</td><td dir="ltr">${r.rate}</td><td>${esc(r.source || '')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="muted" style="margin-top:8px">لا توجد أسعار صرف بعد</div>'}</div>`;
  }

  /* ---------- التقسيم الإداري: إدارات، وداخلها فروع وأقسام (هي وحدات الهيكل التنظيمي، ومنها يُرسم الهيكل الهرمي) ---------- */
  async function settingsOrgDiv(body) {
    /* حالة الصفحة: ما يتغير بعد العرض (d، U، dirty) */
    const undefined = {};
    undefined.d = await api('GET', '/api/admin/orgdiv');
    undefined.U = undefined.d.units.map((u) => ({ ...u }));
    undefined.dirty = false;
    const KIND = { إدارة: ['layers', 'od-dep'], فرع: ['branch', 'od-br'], قسم: ['folderOpen', 'od-sec'], منصب: ['user', 'od-pos'] };
    /* ما يمكن إضافته داخل كل نوع */
    /* المنصب (المدير العام، نائب مدير الفرع، المحاسب...) يكون في أي مستوى ويحتوي ما تحته */
    const CAN = {
      إدارة: ['إدارة', 'فرع', 'قسم', 'منصب'],
      فرع: ['قسم', 'منصب'],
      قسم: ['قسم', 'منصب'],
      منصب: ['إدارة', 'فرع', 'قسم', 'منصب'],
    };
    const newId = () => Math.random().toString(16).slice(2, 14);
    const kids = (pid) => undefined.U.filter((u) => (u.parent || '') === pid);
    const under = (id) => kids(id).flatMap((k) => [k.id, ...under(k.id)]);
    const deep = (u) =>
      u.kind === 'فرع'
        ? undefined.d.count[u.id] || 0
        : (undefined.d.count[u.id] || 0) + kids(u.id).reduce((a, k) => a + (k.kind === 'فرع' ? 0 : deep(k)), 0);
    /* الوحدات التي يمكن أن تتبعها الوحدة (بدون نفسها وما تحتها، وبحسب نوعها) */
    const parents = (u) => {
      const no = new Set([u.id, ...under(u.id)]);
      return undefined.U.filter((p) => !no.has(p.id) && p.name && CAN[p.kind].includes(u.kind));
    };
    const label = (u) => `${u.kind} ${u.name}`;
    const node = (u) => {
      const [ic, cls] = KIND[u.kind] || KIND['إدارة'];
      const ps = parents(u);
      return `<li><div class="od-n ${cls}" data-id="${u.id}">
        <span class="od-k">${icon(ic)}${esc(u.kind)}</span>
        <input class="in od-name" data-f="name" value="${esc(u.name)}" placeholder="${u.kind === 'منصب' ? 'المسمى (مثل: نائب مدير الفرع)' : `اسم ${esc(u.kind === 'إدارة' ? 'الإدارة' : u.kind === 'فرع' ? 'الفرع' : 'القسم')}`}"${u.kind === 'فرع' ? ' list="dl-od-br"' : ''}>
        <input class="in od-mgr${u.empId ? ' linked' : ''}" data-f="manager" list="dl-od-emp" value="${esc(u.manager || '')}" placeholder="${u.kind === 'منصب' ? 'اسم الشخص — اختر من الموظفين' : 'المدير — اختر من الموظفين'}" title="${u.empId ? 'مرتبط بملف موظف (صورته في الهيكل)' : 'اختر الموظف من القائمة لربط صورته من ملفه، أو اكتب الاسم'}">
        <select class="in od-par" data-f="parent" title="يتبع">${['إدارة', 'منصب'].includes(u.kind) ? '<option value="">— في أعلى الهيكل —</option>' : ''}${ps.map((p) => `<option value="${p.id}"${p.id === u.parent ? ' selected' : ''}>يتبع: ${esc(label(p))}</option>`).join('')}</select>
        <span class="chip" title="الموظفون النشطون">${deep(u)} موظف</span>
        <span class="od-acts">${CAN[u.kind].map((k) => `<button type="button" class="btn sm" data-add="${k}" title="إضافة ${k} داخل ${esc(u.name)}">+ ${k}</button>`).join('')}<button type="button" class="btn sm bad" data-del title="حذف">✕</button></span></div>
        ${kids(u.id).length ? `<ul>${kids(u.id).map(node).join('')}</ul>` : ''}</li>`;
    };
    return settingsOrgDivPart2(body, newId, node, undefined, under);
  }
  /* جزء من settingsOrgDiv: const draw = () => {… */
  function settingsOrgDivPart2(body, newId, node, undefined, under) {
    const draw = () => {
      const roots = undefined.U.filter((u) => !u.parent);
      const freeBr = undefined.d.branches.filter((b) => !undefined.U.some((u) => u.kind === 'فرع' && u.name === b));
      const deps = undefined.U.filter((u) => u.kind === 'إدارة' && u.name);
      const n = (k) => undefined.U.filter((u) => u.kind === k).length;
      body.innerHTML = `<div class="card"><div class="emp-sec-h"><h3>${icon('layers')} التقسيم الإداري</h3>
          <span class="row" style="gap:6px"><span class="chip">${n('إدارة')} إدارة</span><span class="chip">${n('فرع')} فرع</span><span class="chip">${n('قسم')} قسم</span><span class="chip">${n('منصب')} منصب</span><button type="button" class="btn sm" id="odRootP">+ منصب في الأعلى</button><button type="button" class="btn primary sm" id="odRoot">+ إدارة رئيسية</button></span></div>
        <div class="hint">أنشئ الإدارات، ثم أضف داخل كل إدارة فروعها وأقسامها (ويمكن أن يكون القسم داخل فرع، والإدارة داخل إدارة أعلى)، و«المنصب» مربع لوظيفة قيادية أو مسئولية (المدير العام، نائب مدير الفرع، المحاسب...) في أي مستوى. هذا التقسيم هو الهيكل التنظيمي نفسه ويُرسم منه الهيكل الهرمي.
          اسم الإدارة أو القسم يطابق خانة «الإدارة / القسم» في ملف الموظف، واسم الفرع يطابق فرعه — لحساب عدد الموظفين.</div>
        <datalist id="dl-od-emp">${(undefined.d.emps || []).map(([, nm, no, br]) => `<option value="${esc(`${nm} — ${no || '؟'}`)}">${esc(br)}</option>`).join('')}</datalist>
        <datalist id="dl-od-br">${undefined.d.branches.map((b) => `<option value="${esc(b)}">`).join('')}</datalist>
        ${roots.length ? `<ul class="od-tree">${roots.map(node).join('')}</ul>` : '<div class="emp-empty">لم تنشئ إدارات بعد — ابدأ بـ «+ إدارة رئيسية»</div>'}
      </div>
      ${
        freeBr.length
          ? `<div class="card"><h3>${icon('branch')} فروع النظام غير الموجودة في التقسيم (${freeBr.length})</h3>
        <div class="row" style="gap:8px;margin-bottom:8px"><label class="muted">أضفها إلى:</label><select class="in" id="odTo" style="width:auto">${deps.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('') || '<option value="">— أنشئ إدارة أولاً —</option>'}</select>
          <button type="button" class="btn sm" id="odAll"${deps.length ? '' : ' disabled'}>إضافة الكل</button></div>
        <div class="od-free">${freeBr.map((b) => `<button type="button" class="btn sm ghost" data-fb="${esc(b)}"${deps.length ? '' : ' disabled'}>+ ${esc(b)}</button>`).join('')}</div></div>`
          : ''
      }
      <div class="ferr"></div>
      <div class="row save-bar"><button class="btn primary" id="odSave">💾 حفظ التقسيم</button>${undefined.dirty ? '<span class="muted">تغييرات غير محفوظة</span>' : ''}</div>`;
    };
    const mark = () => {
      if (!undefined.dirty) {
        undefined.dirty = true;
        const s = $('.save-bar', body);
        if (s && !$('.muted', s)) s.insertAdjacentHTML('beforeend', '<span class="muted">تغييرات غير محفوظة</span>');
      }
    };
    body.oninput = (e) => {
      const x = e.target,
        n = x.closest('.od-n');
      if (!n || !x.dataset.f || x.dataset.f === 'parent') return;
      const u = undefined.U.find((y) => y.id === n.dataset.id);
      if (!u) return;
      /* المدير / الشخص: اختيار موظف من القائمة يربط ملفه (صورته في الهيكل)، والكتابة الحرة تلغي الربط */
      if (x.dataset.f === 'manager') {
        const hit = (undefined.d.emps || []).find(([, nm, no]) => `${nm} — ${no || '؟'}` === x.value);
        if (hit) {
          u.manager = hit[1];
          u.empId = hit[0];
          x.value = hit[1];
          x.classList.add('linked');
        } else {
          u.manager = x.value;
          u.empId = '';
          x.classList.remove('linked');
        }
        mark();
        return;
      }
      u[x.dataset.f] = x.value;
      mark();
    };
    body.onchange = (e) => {
      const x = e.target,
        n = x.closest('.od-n');
      if (n && x.dataset.f === 'parent') {
        const u = undefined.U.find((y) => y.id === n.dataset.id);
        u.parent = x.value;
        undefined.dirty = true;
        draw();
      } else if (n && x.dataset.f === 'name') draw();
    };
    return settingsOrgDivPart(body, draw, newId, undefined, under);
  }
  /* جزء من settingsOrgDiv: body.onclick = async (e) => {… */
  function settingsOrgDivPart(body, draw, newId, undefined, under) {
    body.onclick = async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const n = b.closest('.od-n'),
        u = n && undefined.U.find((y) => y.id === n.dataset.id);
      if (b.id === 'odRoot' || b.id === 'odRootP') {
        undefined.U.push({ id: newId(), name: '', kind: b.id === 'odRoot' ? 'إدارة' : 'منصب', parent: '', manager: '' });
        undefined.dirty = true;
        draw();
        $$('.od-name', body)
          .filter((i) => !i.value)
          .pop()
          ?.focus();
        return;
      }
      if (b.dataset.add && u) {
        const id = newId();
        undefined.U.push({ id, name: '', kind: b.dataset.add, parent: u.id, manager: '' });
        undefined.dirty = true;
        draw();
        $(`.od-n[data-id="${id}"] .od-name`, body)?.focus();
        return;
      }
      if (b.dataset.del !== undefined && u) {
        const sub = under(u.id);
        if (
          (sub.length || u.name) &&
          !window.confirm(`حذف «${u.name || u.kind}»${sub.length ? ` وما بداخله (${sub.length})` : ''}؟ — لا يحذف النظام أي موظف أو فرع`)
        )
          return;
        const no = new Set([u.id, ...sub]);
        undefined.U = undefined.U.filter((y) => !no.has(y.id));
        undefined.dirty = true;
        draw();
        return;
      }
      const to = $('#odTo', body) && $('#odTo', body).value;
      if (b.dataset.fb && to) {
        undefined.U.push({ id: newId(), name: b.dataset.fb, kind: 'فرع', parent: to, manager: '' });
        undefined.dirty = true;
        draw();
        return;
      }
      if (b.id === 'odAll' && to) {
        undefined.d.branches
          .filter((x) => !undefined.U.some((y) => y.kind === 'فرع' && y.name === x))
          .forEach((x) => undefined.U.push({ id: newId(), name: x, kind: 'فرع', parent: to, manager: '' }));
        undefined.dirty = true;
        draw();
        return;
      }
      if (b.id === 'odSave') {
        const empty = undefined.U.find((y) => !y.name.trim());
        if (empty) {
          $('.ferr', body).innerHTML = `<div class="err">اكتب اسم كل ${esc(empty.kind)} أو احذفه</div>`;
          $(`.od-n[data-id="${empty.id}"] .od-name`, body)?.focus();
          return;
        }
        try {
          undefined.d = await api('PUT', '/api/admin/orgdiv', { units: undefined.U });
          undefined.U = undefined.d.units.map((x) => ({ ...x }));
          undefined.dirty = false;
          state.config.branches = undefined.d.branches;
          draw();
          toast('تم حفظ التقسيم الإداري');
        } catch (err) {
          $('.ferr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      }
    };
    draw();
  }
  return { otpCard, settingsOrgDiv, settingsCountries, contrastWhite };
};
