'use strict';
/* أجزاء ملف الموظف: نافذة صف الجدول، وربط حساب الموظف، وطباعة الملف، والسيرة الذاتية */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['employee-file'] = function (S, ctx) {
  const {
    $,
    $$,
    SF,
    api,
    app,
    askText,
    askYesNo,
    collect,
    docLeft,
    downloadCsv,
    dt,
    empDocs,
    empPhoto,
    esc,
    fieldHtml,
    fmtNum,
    state,
    toast,
    today,
  } = S;
  /* نافذة صف في سجل متكرر (إجازة، دورة، عهدة...): الحفظ يرسل السجل كاملاً */
  function empRowModal(e, key, row, done) {
    const def = SF.EMP_LISTS[key];
    const rows = ((e.lists || {})[key] || []).slice();
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:720px;width:96%"><h3 style="margin-top:0">${row ? '✏️ تعديل' : '➕ إضافة'} — ${esc(def.title)}</h3><form id="erf" novalidate>
      <div class="grid2">${def.cols.map((c) => fieldHtml(c, row ? row[c.key] : c.key === 'by' && key === 'assets' ? state.user.name : '')).join('')}</div>
      <div id="erErr"></div><div class="row" style="margin-top:14px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#erf', bg).onsubmit = async (ev) => {
      ev.preventDefault();
      const v = collect({ fields: def.cols }, $('#erf', bg));
      const miss = def.cols.find((c) => c.required && !String(v[c.key] || '').trim());
      if (miss) {
        $('#erErr', bg).innerHTML = `<div class="err">الحقل "${esc(miss.label)}" مطلوب</div>`;
        return;
      }
      if (row) rows[rows.findIndex((x) => x.id === row.id)] = { ...row, ...v };
      else rows.push(v);
      try {
        await api('PUT', `/api/employees/${e.id}/lists/${key}`, { rows });
        bg.remove();
        toast('تم الحفظ');
        done();
      } catch (err) {
        $('#erErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  function bindEmpAcc(e, reload) {
    $$('[data-acc]').forEach((b) => {
      b.onclick = async () => {
        const k = b.dataset.acc,
          url = `/api/employees/${e.id}/account`;
        try {
          if (k === 'print') {
            const w = window.open('', '_blank');
            w.document
              .write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>بطاقة الدخول — ${esc(e.nameAr)}</title><style>body{font-family:Tahoma,Arial;margin:20px}.c{border:1.5px dashed #8b1a1a;border-radius:12px;padding:16px;max-width:430px}.c h3{margin:0 0 8px;color:#8b1a1a}.c div{margin:5px 0}.c b{direction:ltr;unicode-bidi:embed}.n{color:#555;font-size:12px;margin-top:10px}@media print{button{display:none}}</style></head><body><button data-print>🖨 طباعة</button><script src="js/dom-hooks.js"></script>
            <div class="c"><h3>تطبيق SES</h3><div>${esc(e.nameAr)} — الرقم الوظيفي ${esc(e.empNo || '—')}</div><div>عنوان الخادم: <b>${esc((state.config.publicUrl || '').replace(/^https?:\/\//, '') || location.host)}</b></div><div>اسم المستخدم: <b>${esc(e.account.username)}</b></div><div>كلمة المرور: ${e.account.isDefault ? 'رقم هويتك / إقامتك' : 'كما سلّمتك شئون الموظفين'}</div><div class="n">يُطلب منك اختيار كلمة مرور جديدة عند أول دخول، ويُربط حسابك بجوالك. لا تشارك بياناتك مع أحد.</div></div></body></html>`);
            w.document.close();
            return;
          }
          if (k === 'create') {
            const must = await askYesNo(
              'إنشاء الحساب باسم مستخدم وكلمة مرور = رقم الهوية.\n\nهل يطلب النظام من الموظف تغيير كلمة المرور عند أول دخول؟ (موصى به)',
            );
            await api('POST', url, { action: 'create', mustChange: must });
            toast('تم إنشاء الحساب');
          } else if (k === 'username') {
            const v = await askText('تغيير اسم المستخدم', `اسم المستخدم الجديد (أرقام أو حروف إنجليزية) — الحالي: ${e.account.username}`);
            if (v === null) return;
            await api('POST', url, { action: 'update', username: v });
            toast('تم تغيير اسم المستخدم');
          } else if (k === 'password') {
            const v = await askText('تعيين كلمة مرور', 'كلمة المرور الجديدة (يطلب النظام من الموظف تغييرها عند الدخول)');
            if (v === null) return;
            await api('POST', url, { action: 'password', password: v, mustChange: true });
            toast('تم تعيين كلمة المرور');
          } else if (k === 'reset') {
            const must = await askYesNo('إعادة كلمة المرور إلى رقم الهوية.\n\nهل يطلب النظام من الموظف تغييرها عند الدخول؟');
            await api('POST', url, { action: 'reset', mustChange: must });
            toast('أعدنا كلمة المرور لرقم الهوية');
          } else if (k === 'unbindMobile') {
            if (!(await askYesNo('إعادة تعيين الهاتف؟ يلغي النظام ربط الجوال الحالي (والبصمة)، وتربط بحسابه أول جوال يدخل منه بعدها.')))
              return;
            await api('POST', url, { action: 'unbindMobile' });
            toast('تمت إعادة تعيين الهاتف');
          } else if (k === 'logout') {
            await api('POST', url, { action: 'logout' });
            toast('تم تسجيل الخروج من كل الأجهزة');
          } else if (k === 'toggle') {
            if (e.account.active && !(await askYesNo('إيقاف حساب الدخول؟ لن يستطيع الموظف الدخول للتطبيق أو النظام.'))) return;
            await api('POST', url, { action: 'update', active: !e.account.active });
            toast(e.account.active ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب');
          }
          reload();
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
  }

  async function viewEmployeePrint(id) {
    const e = await api('GET', `/api/employees/${id}`);
    const L = (k) => (e.lists || {})[k] || [];
    const lv = SF.empLeave(e, today());
    const docs = empDocs(e);
    const v = (f, x) =>
      !x ? '—' : f.type === 'date' ? SF.fmtDate(x) : f.type === 'number' ? fmtNum(x) : Array.isArray(x) ? x.join('، ') : x;
    const secs = SF.EMP_SECTIONS.filter(([k]) => k !== 'notes' && (e.salary || k !== 'salary'));
    const pairs = (fs) => {
      let h = '';
      for (let i = 0; i < fs.length; i += 2) {
        const a = fs[i],
          b = fs[i + 1];
        h += `<tr><th>${esc(a[0])}</th><td>${esc(a[1])}</td>${b ? `<th>${esc(b[0])}</th><td>${esc(b[1])}</td>` : '<th></th><td></td>'}</tr>`;
      }
      return `<table class="ep-t">${h}</table>`;
    };
    const secHtml = ([, title, fs]) => {
      const rows = fs.filter((f) => f.type !== 'heading' && e[f.key]).map((f) => [f.label, v(f, e[f.key])]);
      return rows.length ? `<h3>${esc(title)}</h3>${pairs(rows)}` : '';
    };
    const listHtml = (k) => {
      const def = SF.EMP_LISTS[k],
        rows = L(k);
      return rows.length
        ? `<h3>${esc(def.title)} (${rows.length})</h3><table class="ep-t ep-list"><thead><tr><th>#</th>${def.cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td>${def.cols.map((c) => `<td>${esc(c.key === 'returned' ? (r.returned ? 'مُرجعة' : 'لدى الموظف') : v(c, r[c.key]))}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        : '';
    };
    const span = (s) => (s ? `${s.y} سنة، ${s.m} شهر، ${s.d} يوم` : '—');
    document.title = `ملف الموظف — ${e.nameAr}`;
    app.innerHTML = `<div class="print-page emp-print"><div class="print-bar"><button class="btn primary" id="pBtn">🖨️ طباعة / حفظ PDF</button><button class="btn" id="eCsv">⬇ Excel (CSV)</button><a class="btn" href="#/employee/${id}">رجوع لملف الموظف</a></div>
      <div class="ep-doc">
        <div class="ep-head"><div class="ep-photo">${e.photo ? `<img src="/api/employees/${e.id}/photo?v=${encodeURIComponent(e.photo)}" alt="">` : ''}</div>
          <div class="ep-id"><div class="ep-org">${esc(state.config.companyName || state.config.orgName || '')}</div><h1>ملف موظف</h1><h2>${esc(e.nameAr)}</h2>${e.nameEn ? `<div dir="ltr" class="ep-en">${esc(e.nameEn)}</div>` : ''}
            <div class="ep-tags">${[e.title, e.department, e.branch && `فرع ${e.branch}`, e.status || 'نشط']
              .filter(Boolean)
              .map((x) => `<span>${esc(x)}</span>`)
              .join('')}</div></div>
          <div class="ep-meta">الرقم الوظيفي: <b>${esc(e.empNo || '—')}</b><br>الهوية / الإقامة: <b>${esc(e.iqama || '—')}</b><br>أعدّه النظام بتاريخ ${esc(dt(new Date().toISOString()))}<br>بواسطة ${esc(state.user.name)}</div></div>
        <div class="ep-kpis">
          <div><small>تاريخ التعيين</small><b>${esc(e.joinDate ? SF.fmtDate(e.joinDate) : '—')}</b><span>خدمة ${esc(span(lv.span))}</span></div>
          <div><small>تاريخ مباشرة العمل (آخر عودة)</small><b>${esc(lv.ret ? SF.fmtDate(lv.ret) : '—')}</b><span>منذ ${esc(span(lv.retSpan))}</span></div>
          <div><small>رصيد الإجازة المتاح</small><b>${lv.balance.toFixed(2)} يوم</b><span>السنوي ${lv.rate} يوماً</span></div>
          ${docs
            .slice(0, 3)
            .map(
              (d) =>
                `<div class="${d.days < 0 ? 'bad' : d.days <= 30 ? 'warn' : ''}"><small>${esc(d.l)}</small><b>${esc(SF.fmtDate(d.date))}</b><span>${esc(docLeft(d))}</span></div>`,
            )
            .join('')}
        </div>
        ${secs.map(secHtml).join('')}
        <h3>الإجازات</h3>${pairs([
          ['مدة الخدمة', span(lv.span)],
          ['مدة الخدمة بعد آخر عودة', span(lv.retSpan)],
          ['الرصيد السنوي', `${lv.rate} يوماً`],
          ['بداية السنة السادسة (30 يوماً)', lv.fiveAt ? SF.fmtDate(lv.fiveAt) : '—'],
          ['الرصيد المرحل', `${lv.prev} يوم`],
          ['المستحق على 21 يوماً (حتى نهاية السنة الخامسة)', `${lv.acc21.toFixed(2)} يوم`],
          ...(lv.done5 ? [['المستحق على 30 يوماً (من بداية السنة السادسة)', `${lv.acc30.toFixed(2)} يوم`]] : []),
          ['المستهلك بعد آخر عودة', `${lv.usedAfter} يوم`],
          ['الرصيد المتاح', `${lv.balance.toFixed(2)} يوم`],
          ...(e.salary && lv.daily
            ? [
                ['الأجر اليومي (الأساسي ÷ 30)', `${fmtNum(lv.daily)} ريال`],
                ['قيمة بدل الإجازة', `${fmtNum(lv.value.total)} ريال`],
              ]
            : []),
        ])}
        ${['leaves', 'contracts', 'periods', 'courses', 'evaluations', 'assets', 'penalties', 'licenses', 'dependents'].map(listHtml).join('')}
        ${e.files.length ? `<h3>المستندات المرفوعة (${e.files.length})</h3>${pairs(e.files.map((f) => [f.label || 'مستند', f.name]))}` : ''}
        ${e.requests.length ? `<h3>طلبات الموظف في النظام (${e.requests.length})</h3><table class="ep-t ep-list"><thead><tr><th>رقم الطلب</th><th>نوع الطلب</th><th>البيان</th><th>آخر تحديث</th></tr></thead><tbody>${e.requests.map((r) => `<tr><td dir="ltr">${esc(r.serial)}</td><td>${esc(r.typeTitle)}</td><td>${esc(r.summary || '')}</td><td>${esc(dt(r.updatedAt))}</td></tr>`).join('')}</tbody></table>` : ''}
        ${e.notes ? `<h3>ملاحظات</h3><div class="ep-note">${esc(e.notes)}</div>` : ''}
      </div></div>`;
    return wireEmployeePrint(L, e, lv, secs, span);
  }
  /* أحداث viewEmployeePrint: #pBtn، #eCsv */
  function wireEmployeePrint(L, e, lv, secs, span) {
    $('#pBtn').onclick = () => window.print();
    $('#eCsv').onclick = () => {
      const rows = [
        [`ملف الموظف — ${e.nameAr}`],
        [],
        ['البيان', 'القيمة'],
        ['تاريخ التعيين', e.joinDate || ''],
        ['تاريخ مباشرة العمل (آخر عودة)', lv.ret || ''],
        ['مدة الخدمة', span(lv.span)],
        ['رصيد الإجازة المتاح', lv.balance.toFixed(2)],
      ];
      for (const [, title, fs] of secs) {
        rows.push([], [title]);
        fs.filter((f) => f.type !== 'heading').forEach((f) =>
          rows.push([f.label, Array.isArray(e[f.key]) ? e[f.key].join('، ') : e[f.key] || '']),
        );
      }
      for (const k of ['leaves', 'contracts', 'periods', 'courses', 'evaluations', 'assets', 'penalties', 'licenses', 'dependents']) {
        const def = SF.EMP_LISTS[k],
          rs = L(k);
        if (!rs.length) continue;
        rows.push(
          [],
          [def.title],
          def.cols.map((c) => c.label),
        );
        rs.forEach((r) => rows.push(def.cols.map((c) => (c.key === 'returned' ? (r.returned ? 'مُرجعة' : 'لدى الموظف') : r[c.key] || ''))));
      }
      downloadCsv(`ملف_موظف_${e.empNo || ''}_${e.nameAr}.csv`, rows);
    };
  }

  /* السيرة الذاتية للموظف من بياناته: البيانات الشخصية، الخبرة في الشركة، المؤهلات (والعليا)، الدورات، الرخص والشهادات المهنية */
  function empCvHtml(e) {
    const L = (k) => (e.lists || {})[k] || [];
    const d = (v) => (v ? SF.fmtDate(v) : '');
    const row = (l, v) => (v ? `<div class="cv-r"><small>${esc(l)}</small><b>${esc(v)}</b></div>` : '');
    const sp = e.joinDate ? SF.empSpan(e.joinDate, e.leaveDate || today()) : null;
    const edu = [
      [e.degreeType || 'المؤهل', e.degreeTitle, e.university, e.gradDate],
      ...[
        ['Pg', 'الدراسات العليا'],
        ['Master', 'الماجستير'],
        ['Phd', 'الدكتوراه'],
      ]
        .filter(([k]) => e[`has${k}`] === 'نعم')
        .map(([k, l]) => [l, e[`${k.toLowerCase()}Title`], e[`${k.toLowerCase()}Uni`], e[`${k.toLowerCase()}Date`]]),
    ].filter((x) => x[1] || x[2] || x[3]);
    const sec = (t, body) => (body ? `<section class="cv-s"><h4>${t}</h4>${body}</section>` : '');
    return `<div class="cv-hd">${empPhoto(e, true)}<div><h2>${esc(e.nameAr)}</h2>${e.nameEn ? `<div class="muted" dir="ltr">${esc(e.nameEn)}</div>` : ''}<div class="cv-t">${esc([e.title, e.department, e.branch ? `فرع ${e.branch}` : ''].filter(Boolean).join(' — '))}</div></div></div>
      ${sec('البيانات الشخصية', `<div class="cv-g">${row('الجنسية', e.nationality)}${row('تاريخ الميلاد', d(e.birthDate))}${row('الجنس', e.gender)}${row('الحالة الاجتماعية', e.marital)}${row('الجوال', e.phone)}${row('البريد', e.email)}${row('المدينة', e.city)}</div>`)}
      ${sec(
        'الخبرة العملية',
        `<div class="cv-i"><b>${esc(e.title || 'موظف')}</b> — ${esc(state.config.orgName || 'الشركة')}<div class="muted">${e.joinDate ? `من ${esc(d(e.joinDate))} ${e.leaveDate ? `إلى ${esc(d(e.leaveDate))}` : 'حتى الآن'}${sp ? ` (${sp.y} سنة و${sp.m} شهر)` : ''}` : ''}${e.department ? ` · ${esc(e.department)}` : ''}${e.branch ? ` · فرع ${esc(e.branch)}` : ''}</div></div>
        ${L('periods')
          .map(
            (p) =>
              `<div class="cv-i"><b>${esc(p.name || '')}</b><div class="muted">${esc(d(p.from))}${p.to ? ` — ${esc(d(p.to))}` : ''}</div></div>`,
          )
          .join('')}`,
      )}
      ${sec('المؤهلات العلمية', edu.map(([l, t, u, g]) => `<div class="cv-i"><b>${esc(l)}${t ? ` — ${esc(t)}` : ''}</b><div class="muted">${esc([u, d(g)].filter(Boolean).join(' · '))}</div></div>`).join(''))}
      ${sec(
        'الدورات التدريبية',
        L('courses')
          .map(
            (c) =>
              `<div class="cv-i"><b>${esc(c.name || c.title || '')}</b><div class="muted">${esc([c.provider || c.issuer, d(c.date), c.hours ? `${c.hours} ساعة` : ''].filter(Boolean).join(' · '))}</div></div>`,
          )
          .join(''),
      )}
      ${sec('الرخص والشهادات المهنية', [e.license ? `<div class="cv-i"><b>رخصة القيادة</b><div class="muted">${esc(e.license)}${e.licenseEnd ? ` · تنتهي ${esc(d(e.licenseEnd))}` : ''}</div></div>` : '', ...L('licenses').map((x) => `<div class="cv-i"><b>${esc(x.name || '')}</b><div class="muted">${esc([x.issuer, x.number, x.end ? `تنتهي ${d(x.end)}` : ''].filter(Boolean).join(' · '))}</div></div>`)].join(''))}`;
  }

  function printEmpCv(e) {
    const w = window.open('', '_blank');
    if (!w) {
      toast('اسمح بالنوافذ المنبثقة للطباعة', true);
      return;
    }
    w.document
      .write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>السيرة الذاتية — ${esc(e.nameAr)}</title><style>
      @page{size:A4;margin:14mm} body{font-family:Tajawal,'Segoe UI',Tahoma,sans-serif;color:#1e293b;margin:0;font-size:13.5px}
      .cv-hd{display:flex;gap:14px;align-items:center;border-bottom:3px solid #9b1c1c;padding-bottom:12px;margin-bottom:10px} .cv-hd img,.cv-hd .emp-av{width:84px;height:84px;border-radius:12px;object-fit:cover}
      h2{margin:0;font-size:22px} .cv-t{color:#9b1c1c;font-weight:700;margin-top:4px} .muted{color:#64748b} .cv-s{margin-top:12px;break-inside:avoid} .cv-s h4{margin:0 0 6px;font-size:15px;color:#9b1c1c;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      .cv-g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 14px} .cv-r small{display:block;color:#64748b;font-size:11.5px} .cv-i{margin:6px 0} .ft{margin-top:18px;text-align:center;color:#94a3b8;font-size:11px}</style></head>
      <body>${empCvHtml(e).replace(/src="\//g, `src="${location.origin}/`)}<div class="ft">SES - SADEN ERP SYSTEM</div><script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`);
    w.document.close();
  }
  return { viewEmployeePrint, bindEmpAcc, empCvHtml, empRowModal, printEmpCv };
};
