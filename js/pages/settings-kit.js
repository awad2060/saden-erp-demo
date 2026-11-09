'use strict';
/* أجزاء صفحة الإعدادات (1) */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['settings'] = function (S, ctx) {
  const {
    $,
    $$,
    DAYS,
    HR_SETTINGS,
    SF,
    api,
    chatErr,
    chatModal,
    downloadCsv,
    dt,
    esc,
    icon,
    isAdmin,
    navTree,
    navTreeWire,
    state,
    toast,
    today,
  } = S;
  const { settingsToolsPart, viewSettings } = ctx;
  /* ---------- الأدوات والبرامج ---------- */
  async function settingsTools(body, saveSettings) {
    /* حالة الصفحة: ما يتغير بعد العرض (list) */
    const pageState = {};
    pageState.list = await api('GET', '/api/admin/tools');
    const upload = (file, q) =>
      new Promise((resolve, reject) => {
        const x = new XMLHttpRequest();
        x.open('POST', `/api/admin/tools-upload?${new URLSearchParams({ name: file.name, ...q })}`);
        x.setRequestHeader('Content-Type', 'application/octet-stream');
        x.onload = () => {
          let d = null;
          try {
            d = JSON.parse(x.responseText);
          } catch {
            /* تجاهل */
          }
          if (x.status < 300) resolve(d);
          else reject(new Error((d && d.error) || 'تعذر رفع الملف'));
        };
        x.onerror = () => reject(new Error('انقطع الاتصال'));
        x.send(file);
      });
    return settingsToolsPart(body, pageState, saveSettings, upload);
  }
  /* draw من settingsHr (يأخذ BASE، BLOCKS، CI، CTRS، body، brCount، draw، fresh، saveSettings، sec، vs من الصفحة) */
  function settingsHrDraw(BASE, BLOCKS, CI, CTRS, body, brCount, draw, fresh, saveSettings, sec, vs) {
    const mine = vs.list.filter((p) => p.country === vs.ctry);
    const cur = drawValue(mine).from;
    body.innerHTML = `<div class="card"><div class="emp-sec-h"><h3><a href="#/settings/hr" class="hr-back">الموارد البشرية</a> › ${esc(sec.t)}</h3><button class="btn" id="hpNew">➕ إصدار جديد من تاريخ</button></div>
        <p class="muted" style="margin-top:0">قواعد قابلة للتحديث بدل الأرقام الثابتة: عند تغيّر النظام أو اللائحة أضف إصداراً جديداً بتاريخ سريانه، فيُطبَّق كل إصدار على الفترات من تاريخه. <b>لكل دولة سياستها</b>: يطبق النظام على كل موظف سياسة دولة فرعه (تحدد دولة الفرع من الإعدادات ← الدول والفروع).</p>
        <div class="hp-ctrs">${CTRS.map((c) => `<button class="btn sm${c === vs.ctry ? ' primary' : ''}" data-ctry="${c}">${esc(SF.COUNTRY_INFO[c].name)} <small>${brCount(c)} فرع</small>${c === BASE ? ' · دولة الشركة' : ''}</button>`).join('')}</div></div>
        ${mine.length ? '' : `<div class="card"><div class="empty">لا يوجد إصدار مخصص لـ${esc(CI().name)} — يطبق النظام الافتراضي حسب نظام العمل فيها (${esc((SF.HR_COUNTRY_DEFAULTS[vs.ctry] || {}).note || '')}).<br><button class="btn primary" id="hpFresh" style="margin-top:10px">تعديل سياسة ${esc(CI().name)} (يبدأ من الافتراضي)</button></div></div>`}
        ${vs.list
          .map((p, i) =>
            p.country !== vs.ctry
              ? ''
              : `<div class="card hp-card${p.from === cur ? ' hp-cur' : ''}"><div class="emp-sec-h"><h3>${esc(CI().name)} — إصدار ساري من <input class="in" type="date" data-p="${i}" data-k="from" value="${esc(p.from)}" style="width:auto;display:inline-block"></h3>${p.from === cur ? '<span class="chip approved">الساري الآن</span>' : ''}${mine.length > 1 || vs.ctry !== BASE ? `<button class="btn sm bad" data-del="${i}">حذف الإصدار</button>` : ''}</div>
          <div class="field"><label>ملاحظة (مرجع القرار / اللائحة)</label><input class="in" data-p="${i}" data-k="note" value="${esc(p.note || '')}"></div>
          ${sec.blocks.map((b) => BLOCKS[b](p, i)).join('')}</div>`,
          )
          .join('')}
        <div class="ferr"></div><div class="row save-bar"><button class="btn primary" id="hpSave">💾 حفظ ${esc(sec.t)}</button></div>`;
    body.oninput = body.onchange = (e) => {
      const x = e.target;
      if (x.dataset.k) vs.list[x.dataset.p][x.dataset.k] = x.type === 'number' ? (x.value === '' ? '' : Number(x.value)) : x.value;
      if (x.dataset.lt) {
        const [i, j] = x.dataset.lt.split(':').map(Number);
        vs.list[i].leaveTypes[j][x.dataset.f] =
          x.type === 'checkbox' ? x.checked : x.type === 'number' ? (x.value === '' ? '' : Number(x.value)) : x.value;
      }
    };
    wireSettingsHrDraw(draw, fresh, mine, vs);
    $$('[data-ctry]', body).forEach((b) => {
      b.onclick = () => {
        vs.ctry = b.dataset.ctry;
        try {
          sessionStorage.setItem('hpCtry', vs.ctry);
        } catch {
          /* */
        }
        draw();
      };
    });
    $$('[data-del]', body).forEach((b) => {
      b.onclick = () => {
        vs.list.splice(Number(b.dataset.del), 1);
        draw();
      };
    });
    $$('[data-ltadd]', body).forEach((b) => {
      b.onclick = () => {
        vs.list[Number(b.dataset.ltadd)].leaveTypes.push({ name: '', max: '', balance: false, note: '' });
        draw();
      };
    });
    $$('[data-ltdel]', body).forEach((b) => {
      b.onclick = () => {
        const [i, j] = b.dataset.ltdel.split(':').map(Number);
        vs.list[i].leaveTypes.splice(j, 1);
        draw();
      };
    });
    $('#hpSave').onclick = async () => {
      try {
        const sv = await saveSettings({ hrPolicies: vs.list }, 'تم حفظ سياسات الموارد البشرية');
        SF.setHrPolicies(sv.hrPolicies || []);
        state.config.hrPolicies = sv.hrPolicies || [];
        state.config.leaveTypes = SF.hrPolicyOf(today()).leaveTypes.map((x) => x.name);
        vs.list = (sv.hrPolicies || []).map((p) => ({ ...SF.HR_POLICY_DEFAULT, ...p, leaveTypes: p.leaveTypes.map((x) => ({ ...x })) }));
        draw();
      } catch (err) {
        $('.ferr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }
  /* أحداث settingsHrDraw: #hpNew، #hpFresh */
  function wireSettingsHrDraw(draw, fresh, mine, vs) {
    $('#hpNew').onclick = () => {
      const last = mine[mine.length - 1] || fresh(vs.ctry);
      vs.list.push({
        ...last,
        country: vs.ctry,
        from: mine.length ? today() : last.from,
        note: mine.length ? '' : last.note,
        leaveTypes: last.leaveTypes.map((x) => ({ ...x })),
      });
      draw();
    };
    if ($('#hpFresh'))
      $('#hpFresh').onclick = () => {
        vs.list.push(fresh(vs.ctry));
        draw();
      };
  }
  /* جزء من settingsHr: vs.list = (s.hrPolicies && s.hrPolicies.length ? s… */
  function settingsHrPart(BASE, CTRS, fresh, s, vs) {
    vs.list = (s.hrPolicies && s.hrPolicies.length ? s.hrPolicies : [fresh(BASE)]).map((p) => {
      const c = p.country || BASE,
        D = SF.HR_COUNTRY_DEFAULTS[c] || SF.HR_POLICY_DEFAULT;
      return {
        ...SF.HR_POLICY_DEFAULT,
        ...D,
        ...p,
        country: c,
        leaveTypes: (p.leaveTypes && p.leaveTypes.length ? p.leaveTypes : D.leaveTypes).map((x) => ({ ...x })),
      };
    });
    vs.ctry = (() => {
      try {
        const v = sessionStorage.getItem('hpCtry');
        return CTRS.includes(v) ? v : BASE;
      } catch {
        return BASE;
      }
    })();
  }
  /* محتوى settingsHr (HTML) */
  function renderSettingsHr(body) {
    body.innerHTML = `<div class="card"><h3 style="margin-top:0">الموارد البشرية</h3><p class="muted" style="margin-top:0">اختر الإعداد الذي تريد تعديله.</p>
        <div class="hr-set-grid">${HR_SETTINGS.map((x) => `<a class="hr-set" href="#/settings/hr/${x.k}" data-hrs="${x.k}"><span class="b-ic" style="--m:${x.color}">${icon(x.ic)}</span><span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></span></a>`).join('')}</div></div>`;
    $$('[data-hrs]', body).forEach((a) => {
      const x = HR_SETTINGS.find((y) => y.k === a.dataset.hrs);
      if (x.open)
        a.onclick = (e) => {
          e.preventDefault();
          x.open();
        };
    });
    return;
  }
  /* جزء من draw: mine.filter((p) => p.from <= today()).pop() || mine[0] || {}… */
  function drawValue(mine) {
    return mine.filter((p) => p.from <= today()).pop() || mine[0] || {};
  }

  function settingsCalendar(body, s, saveSettings) {
    const weekend = s.weekend || [5, 6];
    const lines = (s.holidays || [])
      .map((h) => `${h.country ? `${h.country} ` : ''}${h.from}${h.to && h.to !== h.from ? ` ${h.to}` : ''}${h.name ? ` ${h.name}` : ''}`)
      .join('\n');
    body.innerHTML = `<div class="card"><h3>أيام العمل والإجازات الرسمية</h3>
      <p class="muted" style="margin-top:0">يستخدمها النظام لحساب تأخر الطلبات: لا يحتسب أيام نهاية الأسبوع والإجازات ضمن مدة بقاء الطلب عند المعتمد.</p>
      <label>أيام نهاية الأسبوع</label>
      <div class="row" style="flex-wrap:wrap;gap:4px 16px;margin:6px 0 14px">${DAYS.map((d, i) => `<label class="check"><input type="checkbox" data-wd="${i}"${weekend.includes(i) ? ' checked' : ''}> ${d}</label>`).join('')}</div>
      <div class="field full"><label>الإجازات الرسمية — إجازة في كل سطر</label>
        <textarea class="in" id="hol" rows="10" dir="auto" placeholder="2026-09-23 اليوم الوطني&#10;2026-03-19 2026-03-23 إجازة عيد الفطر">${esc(lines)}</textarea>
        <div class="hint">اكتب التاريخ ثم اسم الإجازة. للإجازة الممتدة اكتب تاريخ البداية ثم تاريخ النهاية ثم الاسم.<br>يطبق النظام العطلة على فروع دولة الشركة؛ ولعطلة دولة أخرى ابدأ السطر برمزها: <b>EG</b> لمصر، <b>OM</b> لعُمان — مثال: <code>EG 2027-01-07 عيد الميلاد المجيد</code></div></div>
      <div class="ferr"></div>
      <div class="row save-bar"><button class="btn primary" id="saveCal">💾 حفظ</button></div></div>`;
    $('#saveCal').onclick = async () => {
      const holidays = [];
      for (const line of $('#hol')
        .value.split('\n')
        .map((x) => x.trim())
        .filter(Boolean)) {
        const m = /^(?:([A-Za-z]{2})\s+)?(\d{4}-\d{2}-\d{2})(?:\s+(\d{4}-\d{2}-\d{2}))?\s*(.*)$/.exec(line);
        if (!m) {
          $('.ferr', body).innerHTML = `<div class="err">سطر غير مفهوم: ${esc(line)} — اكتب التاريخ بصيغة 2026-09-23</div>`;
          return;
        }
        if (m[1] && !SF.COUNTRY_INFO[m[1].toUpperCase()]) {
          $('.ferr', body).innerHTML =
            `<div class="err">رمز دولة غير معروف: ${esc(m[1])} — المتاح: ${Object.keys(SF.COUNTRY_INFO).join('، ')}</div>`;
          return;
        }
        holidays.push({ from: m[2], to: m[3] || m[2], name: m[4], ...(m[1] ? { country: m[1].toUpperCase() } : {}) });
      }
      try {
        await saveSettings(
          {
            weekend: $$('[data-wd]', body)
              .filter((c) => c.checked)
              .map((c) => Number(c.dataset.wd)),
            holidays,
          },
          'تم حفظ العطلات',
        );
      } catch (err) {
        $('.ferr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  /* ---------- البريد والإشعارات ---------- */
  function settingsEmail(body, s, saveSettings) {
    const e = s.email || {};
    const ev = e.events || {};
    const EVENTS = [
      ['pending', 'وصول طلب للمعتمد (عند الرفع وبعد كل اعتماد)'],
      ['approved', 'الاعتماد النهائي (لمقدم الطلب)'],
      ['returned', 'الإعادة للتعديل (لمقدم الطلب)'],
      ['rejected', 'الرفض (لمقدم الطلب)'],
      ['overdue', 'تذكير يومي بالطلبات المتأخرة (للمعتمد)'],
    ];
    body.innerHTML = `<form class="card" id="ef2"><h3>البريد والإشعارات</h3>
      <p class="muted" style="margin-top:0">يرسل النظام الإشعارات إلى البريد المسجل لكل مستخدم (الإعدادات ← المستخدمون). أدخل بيانات خادم البريد الخاص بالشركة.</p>
      <label class="check"><input type="checkbox" name="enabled"${e.enabled ? ' checked' : ''}> تفعيل الإشعارات بالبريد</label>
      <div class="grid2" style="margin-top:8px">
        <div class="field"><label>خادم البريد (SMTP)</label><input class="in" name="host" dir="ltr" value="${esc(e.host || '')}" placeholder="smtp.office365.com"></div>
        <div class="field"><label>المنفذ</label><input class="in" name="port" type="number" dir="ltr" value="${esc(e.port || 587)}"></div>
        <div class="field"><label>التشفير</label><select class="in" name="security">${[
          ['starttls', 'STARTTLS (المنفذ 587)'],
          ['ssl', 'SSL (المنفذ 465)'],
          ['none', 'بدون تشفير'],
        ]
          .map(([v, l]) => `<option value="${v}"${(e.security || 'starttls') === v ? ' selected' : ''}>${l}</option>`)
          .join('')}</select></div>
        <div class="field"><label>عنوان المرسل</label><input class="in" name="from" dir="ltr" value="${esc(e.from || '')}" placeholder="النظام <payroll@company.com>"></div>
        <div class="field"><label>اسم المستخدم</label><input class="in" name="user" dir="ltr" autocomplete="off" value="${esc(e.user || '')}"></div>
        <div class="field"><label>كلمة المرور</label><input class="in" name="pass" type="password" dir="ltr" autocomplete="new-password" placeholder="${e.hasPass ? 'محفوظة — اتركها فارغة لعدم التغيير' : ''}"></div>
      </div>
      <h4 class="b-sec">متى يرسل النظام إشعاراً</h4>
      <div class="ev-cols">${EVENTS.map(([k, l]) => `<label class="check"><input type="checkbox" data-ev="${k}"${ev[k] !== false ? ' checked' : ''}> ${l}</label>`).join('')}</div>
      <div class="hint">يأخذ النظام رابط الطلب داخل الرسالة من "رابط النظام" في الإعدادات العامة.</div>
      <div class="ferr"></div>
      <div class="row save-bar"><button class="btn primary">💾 حفظ</button></div>
      <h4 class="b-sec">تجربة الإرسال</h4>
      <div class="row" style="gap:8px"><input class="in" id="testTo" dir="ltr" placeholder="your@company.com" value="${esc(state.user.email || '')}" style="flex:1"><button type="button" class="btn" id="testMail">✉️ إرسال رسالة تجربة</button></div>
      <div class="hint">احفظ الإعدادات أولاً ثم جرّب.</div></form>`;
    const f = $('#ef2');
    f.onsubmit = async (ev2) => {
      ev2.preventDefault();
      const fd = new FormData(f);
      try {
        await saveSettings(
          {
            email: {
              enabled: !!fd.get('enabled'),
              host: fd.get('host'),
              port: Number(fd.get('port')),
              security: fd.get('security'),
              from: fd.get('from'),
              user: fd.get('user'),
              pass: fd.get('pass'),
              events: Object.fromEntries($$('[data-ev]', f).map((c) => [c.dataset.ev, c.checked])),
            },
          },
          'تم حفظ إعدادات البريد',
        );
      } catch (err) {
        $('.ferr', f).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    $('#testMail').onclick = async () => {
      const b = $('#testMail');
      b.disabled = true;
      try {
        await api('POST', '/api/admin/email-test', { to: $('#testTo').value });
        toast('تم إرسال رسالة التجربة');
      } catch (err) {
        toast(err.message, true);
      } finally {
        b.disabled = false;
      }
    };
  }

  /* ---------- النسخ الاحتياطي ---------- */
  async function settingsBackup(body) {
    const list = await api('GET', '/api/admin/backups');
    const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);
    body.innerHTML = `<div class="card"><h3>النسخ الاحتياطي</h3>
      <p class="muted" style="margin-top:0">ينشئ النظام نسخة تلقائية كل يوم. النسخة تحتوي الطلبات والمستخدمين والإعدادات، أما المرفقات وصور التوقيعات فتنسخها مع مجلد البيانات على السيرفر.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:14px"><button class="btn primary" id="bkNow">➕ إنشاء نسخة الآن</button>
        <label class="btn" style="cursor:pointer">⬆ رفع نسخة من جهازك<input type="file" id="bkUp" accept=".json" hidden></label></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>النسخة</th><th>التاريخ</th><th>الحجم</th><th></th></tr></thead><tbody>
      ${
        list
          .map(
            (
              b,
            ) => `<tr><td dir="ltr" style="text-align:right">${esc(b.name)}</td><td class="num">${esc(dt(b.at))}</td><td class="num">${kb(b.size)}</td>
        <td><a class="btn sm" href="/api/admin/backups/${encodeURIComponent(b.name)}" download="${esc(b.name)}">⬇ تنزيل</a> ${isAdmin() ? `<button class="btn sm bad" data-restore="${esc(b.name)}">↺ استرجاع</button>` : ''}</td></tr>`,
          )
          .join('') || '<tr><td colspan="4" class="muted">لا توجد نسخ</td></tr>'
      }
      </tbody></table></div></div>`;
    $('#bkNow').onclick = async () => {
      try {
        await api('POST', '/api/admin/backups', {});
        toast('تم إنشاء النسخة');
        settingsBackup(body);
      } catch (err) {
        toast(err.message, true);
      }
    };
    $('#bkUp').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await api('POST', '/api/admin/backups/upload', { data: await file.text() });
        toast('تم رفع النسخة، يمكنك استرجاعها من القائمة');
        settingsBackup(body);
      } catch (err) {
        toast(err.message, true);
      }
    };
    $$('[data-restore]', body).forEach((b) => {
      b.onclick = async () => {
        if (
          !confirm(
            `استرجاع النسخة ${b.dataset.restore}؟\nستستبدل النظام كل البيانات الحالية بمحتوى هذه النسخة.\nوتحفظ نسخة أمان من الوضع الحالي تلقائياً قبل الاسترجاع.`,
          )
        )
          return;
        try {
          const r = await api('POST', `/api/admin/backups/${encodeURIComponent(b.dataset.restore)}/restore`, {});
          toast(`تم الاسترجاع — نسخة الأمان: ${r.safety}`);
          setTimeout(() => location.reload(), 1200);
        } catch (err) {
          toast(err.message, true);
        }
      };
    });
  }

  /* ---------- رقابة المراسلات: مدير النظام يطّلع على كل البريد وكل الدردشات (قراءة فقط، وكل فتح يُسجَّل في سجل النشاط) ---------- */
  async function settingsOversight(body, sub) {
    const mode = sub === 'chat' ? 'chat' : 'mail';
    const KIND = { branch: 'مجموعة فرع', direct: 'خاصة', req: 'بخصوص طلب' };
    const fmtSize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} م.ب` : `${Math.max(1, Math.round((n || 0) / 1024))} ك.ب`);
    await settingsOversightPart(KIND, body, mode, openChat, openMail);
    const close =
      '<div class="row" style="justify-content:flex-end;margin-top:10px"><button type="button" class="btn" data-x>إغلاق</button></div>';
    async function openMail(conv) {
      const d = await api('GET', `/api/oversight/mail/${encodeURIComponent(conv)}`);
      const who = (l, a) => (a.length ? `<div><span class="muted">${l}:</span> ${esc(a.join('، '))}</div>` : '');
      chatModal(
        `${icon('mail')} ${esc(d.subject)}`,
        `<div class="hint">اطلاع رقابي — للقراءة فقط</div><div style="max-height:65vh;overflow:auto">${d.messages
          .map(
            (m) => `<div class="card" style="margin:8px 0;padding:12px">
        <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(m.fromName)}</b><span class="muted num">${esc(dt(m.at))}</span></div>
        <div style="font-size:13px;margin:4px 0 8px">${who('إلى', m.toNames)}${who('نسخة', m.ccNames)}${who('نسخة مخفية', m.bccNames)}</div>
        <div class="ov-mail-body" style="white-space:${m.html ? 'normal' : 'pre-wrap'};overflow-wrap:anywhere">${m.html || esc(m.body)}</div>
        ${m.attachments.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${m.attachments.map((a) => `<a class="chip" target="_blank" href="/api/mail/${m.id}/attachments/${a.id}">📎 ${esc(a.name)} (${fmtSize(a.size)})</a>`).join('')}</div>` : ''}
        <div class="muted" style="font-size:12px;margin-top:8px">القراءة: ${m.readers.map((r) => `${esc(r.name)} ${r.at ? `✓ ${esc(dt(r.at))}` : '— لم يقرأ'}`).join(' · ')}${m.deletedBy.length ? ` · حذفها من صندوقه: ${esc(m.deletedBy.join('، '))}` : ''}</div></div>`,
          )
          .join('')}</div>${close}`,
        760,
      );
    }
    async function openChat(id) {
      const bg = chatModal(
        `${icon('message')} <span id="ovT"></span>`,
        `<div class="hint">اطلاع رقابي — للقراءة فقط (الرسائل المحذوفة تظهر بمحتواها مع علامة الحذف)</div><div id="ovMsgs" style="max-height:65vh;overflow:auto"></div>${close}`,
        760,
      );
      let msgs = [];
      const load = async (before) => {
        const d = await api('GET', `/api/oversight/chat/${encodeURIComponent(id)}${before ? `?before=${encodeURIComponent(before)}` : ''}`);
        $('#ovT', bg).textContent = d.title;
        msgs = [...d.msgs, ...msgs];
        const box = $('#ovMsgs', bg);
        box.innerHTML = `${d.more ? '<div style="text-align:center"><button type="button" class="btn sm" id="ovMore">عرض الأقدم</button></div>' : ''}${
          msgs
            .map(
              (m) => `<div style="padding:8px 4px;border-bottom:1px solid var(--line, #e5e7eb)${m.deleted ? ';opacity:.7' : ''}">
          <div class="row" style="justify-content:space-between;gap:8px"><b>${esc(m.fromName)}</b><span class="muted num" style="font-size:12px">${esc(dt(m.at))}${m.deleted ? ' · <span style="color:var(--bad, #b91c1c)">محذوفة</span>' : ''}</span></div>
          <div style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.text || (m.file ? '' : m.preview))}</div>
          ${m.file ? `<a class="chip" target="_blank" href="/api/chat/files/${m.id}?ov=1">📎 ${esc(m.file.name)} (${fmtSize(m.file.size)})</a>` : ''}</div>`,
            )
            .join('') || '<div class="muted">لا توجد رسائل</div>'
        }`;
        if (!before) box.scrollTop = box.scrollHeight;
        if ($('#ovMore', bg)) $('#ovMore', bg).onclick = () => load(msgs[0].at);
      };
      try {
        await load();
      } catch (e) {
        chatErr(bg, e.message);
      }
    }
  }
  /* جزء من settingsOversight: renderSettingsOversight(KIND, body, mode);… */
  async function settingsOversightPart(KIND, body, mode, openChat, openMail) {
    renderSettingsOversight(KIND, body, mode);
    const list = await api('GET', `/api/oversight/${mode}`);
    const people = [...new Set(list.flatMap((x) => x.people))].filter((p) => p && p !== '—').sort((a, b) => a.localeCompare(b, 'ar'));
    $('#ovU').insertAdjacentHTML('beforeend', people.map((p) => `<option>${esc(p)}</option>`).join(''));
    const apply = () => {
      const q = $('#ovQ').value.trim(),
        u = $('#ovU').value,
        d = $('#ovD').value,
        k = $('#ovK') ? $('#ovK').value : '';
      const rows = list.filter(
        (x) =>
          (!u || x.people.includes(u)) &&
          (!d || x.at.slice(0, 10) >= d) &&
          (!k || x.kind === k) &&
          (!q || `${x.subject || x.title} ${x.people.join(' ')} ${x.snippet || x.last || ''}`.includes(q)),
      );
      $('#ovList').innerHTML =
        mode === 'mail'
          ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>آخر رسالة</th><th>العنوان</th><th>الأطراف</th><th>الرسائل</th></tr></thead><tbody>
          ${
            rows
              .slice(0, 500)
              .map(
                (x) =>
                  `<tr class="clickable" data-ov="${esc(x.conv)}" style="cursor:pointer"><td class="num muted">${esc(dt(x.at))}</td><td><b>${esc(x.subject)}</b>${x.att ? ` <span class="chip">📎 ${x.att}</span>` : ''}<div class="muted" style="font-size:12.5px">${esc(x.fromName)}: ${esc(x.snippet)}</div></td><td>${esc(x.people.join('، '))}</td><td class="num">${x.count}</td></tr>`,
              )
              .join('') || '<tr><td colspan="4" class="muted">لا توجد رسائل</td></tr>'
          }</tbody></table></div>`
          : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>آخر رسالة</th><th>المحادثة</th><th>النوع</th><th>الرسائل</th></tr></thead><tbody>
          ${
            rows
              .slice(0, 500)
              .map(
                (x) =>
                  `<tr class="clickable" data-ov="${esc(x.id)}" style="cursor:pointer"><td class="num muted">${esc(dt(x.at))}</td><td><b>${esc(x.title)}</b><div class="muted" style="font-size:12.5px">${esc(x.last)}</div></td><td><span class="chip">${KIND[x.kind] || ''}</span></td><td class="num">${x.count}</td></tr>`,
              )
              .join('') || '<tr><td colspan="4" class="muted">لا توجد محادثات</td></tr>'
          }</tbody></table></div>`;
      $('#ovCount').textContent = `العدد: ${rows.length}${rows.length > 500 ? ' (يظهر أحدث 500 — استخدم البحث للوصول للأقدم)' : ''}`;
      $$('[data-ov]', body).forEach((tr) => {
        tr.onclick = () => (mode === 'mail' ? openMail(tr.dataset.ov) : openChat(tr.dataset.ov));
      });
    };
    ['ovQ', 'ovU', 'ovD', 'ovK'].forEach((k) => {
      if ($(`#${k}`)) $(`#${k}`).oninput = apply;
    });
    apply();
  }
  /* محتوى settingsOversight (HTML) */
  function renderSettingsOversight(KIND, body, mode) {
    body.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <h3 style="margin:0">${icon('eye')} رقابة المراسلات</h3>
        <span class="row" style="gap:6px"><a class="btn sm${mode === 'mail' ? ' primary' : ''}" href="#/settings/oversight">${icon('mail')} البريد</a><a class="btn sm${mode === 'chat' ? ' primary' : ''}" href="#/settings/oversight/chat">${icon('message')} الدردشة</a></span></div>
      <div class="hint">اطلاع لمدير النظام فقط — للقراءة دون تغيير حالة القراءة أو الرد أو الحذف. يسجّل النظام كل فتح لمحادثة في «سجل النشاط».</div>
      <div class="filters"><input class="in" id="ovQ" placeholder="بحث بالاسم أو العنوان أو النص..."><select class="in" id="ovU"><option value="">كل المستخدمين</option></select>${
        mode === 'chat'
          ? `<select class="in" id="ovK"><option value="">كل الأنواع</option>${Object.entries(KIND)
              .map(([k, l]) => `<option value="${k}">${l}</option>`)
              .join('')}</select>`
          : ''
      }<input class="in" type="date" id="ovD" title="من تاريخ"></div>
      <div id="ovList"><div class="empty">جاري التحميل...</div></div><div class="muted" id="ovCount" style="margin-top:8px;font-size:13px"></div></div>`;
  }

  /* ---------- سجل النشاط ---------- */
  async function settingsActivity(body) {
    const list = await api('GET', '/api/admin/activity');
    const actions = [...new Set(list.map((a) => a.action))].sort();
    const people = [...new Set(list.map((a) => a.byName).filter(Boolean))].sort();
    body.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">سجل النشاط</h3><button class="btn" id="actCsv">⬇ تصدير Excel (CSV)</button></div>
      <div class="filters">
        <input class="in" id="aq" placeholder="بحث في التفاصيل...">
        <select class="in" id="aa"><option value="">كل الأحداث</option>${actions.map((a) => `<option>${esc(a)}</option>`).join('')}</select>
        <select class="in" id="au"><option value="">كل المستخدمين</option>${people.map((p) => `<option>${esc(p)}</option>`).join('')}</select>
        <input class="in" type="date" id="ad" title="من تاريخ">
      </div>
      <div id="alist"></div><div class="muted" id="acount" style="margin-top:8px;font-size:13px"></div></div>`;
    let rows = list;
    const apply = () => {
      const q = $('#aq').value.trim(),
        a = $('#aa').value,
        u = $('#au').value,
        d = $('#ad').value;
      rows = list.filter(
        (x) =>
          (!a || x.action === a) &&
          (!u || x.byName === u) &&
          (!d || x.at.slice(0, 10) >= d) &&
          (!q || `${x.detail} ${x.byName}`.includes(q)),
      );
      $('#alist').innerHTML =
        `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الوقت</th><th>المستخدم</th><th>الحدث</th><th>التفاصيل</th></tr></thead><tbody>
        ${
          rows
            .slice(0, 500)
            .map(
              (x) =>
                `<tr><td class="num muted">${esc(dt(x.at))}</td><td>${esc(x.byName || '—')}</td><td><b>${esc(x.action)}</b></td><td>${esc(x.detail)}</td></tr>`,
            )
            .join('') || '<tr><td colspan="4" class="muted">لا توجد أحداث</td></tr>'
        }</tbody></table></div>`;
      $('#acount').textContent = `عدد الأحداث: ${rows.length}${rows.length > 500 ? ' (يظهر أحدث 500، والتصدير يشمل الكل)' : ''}`;
    };
    ['aq', 'aa', 'au', 'ad'].forEach((k) => {
      $(`#${k}`).oninput = apply;
    });
    $('#actCsv').onclick = () =>
      downloadCsv(
        `سجل_النشاط_${today()}.csv`,
        [['الوقت', 'المستخدم', 'الحدث', 'التفاصيل']].concat(rows.map((x) => [dt(x.at), x.byName, x.action, x.detail])),
      );
    apply();
  }

  /* ---------- المسميات والصلاحيات ---------- */
  function settingsRoles(body, s, users, saveSettings) {
    let list = (s.roles || []).map((r) => JSON.parse(JSON.stringify(r)));
    const capsTxt = (r) =>
      r.base === 'admin'
        ? 'كل الصلاحيات'
        : SF.CAPS.filter(([k]) => r.caps && r.caps[k])
            .map(([, l]) => l)
            .join('، ') || 'الاعتيادية حسب نوع الحساب';
    const draw = () => {
      body.innerHTML = `<div class="card"><h3>المسميات والصلاحيات</h3>
        <p class="muted" style="margin-top:0">لكل مسمى: نوع الحساب الأساسي، والصفحات التي يراها، والإجراءات المسموحة، والخطابات المتاحة. تسند المسمى لكل مستخدم من نافذته في "المستخدمون". وما تخصصه لفئة أو لمستخدم بعينه يتقدم على إعداد المسمى.</p>
        ${list
          .map(
            (r, i) => `<div class="role-row">
          <input class="in" data-rn="${i}" value="${esc(r.name)}">
          <select class="in" data-rb="${i}">${SF.BASES.map(([k, l]) => `<option value="${k}"${r.base === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
          <small class="muted">${users.filter((u) => u.roleId === r.id).length} مستخدم</small>
          <button type="button" class="btn sm" data-rperm="${i}">الصلاحيات${Object.keys(r.pages || {}).length || Object.keys(r.caps || {}).length || Array.isArray(r.allowedForms) || r.viewScope || Array.isArray(r.viewForms) || Array.isArray(r.dashSections) ? ' ✓' : ''}</button>
          <button type="button" class="btn sm bad" data-rdel="${i}">حذف</button>
          <div class="role-caps muted">الإجراءات: ${esc(capsTxt(r))}</div>
        </div>`,
          )
          .join('')}
        <div class="row" style="gap:8px;margin-top:12px"><input class="in" id="newRole" placeholder="اسم المسمى الجديد (مثال: محاسب حماية الأجور)" style="flex:1"><button type="button" class="btn" id="addRole">➕ إضافة مسمى</button></div>
        <div class="ferr"></div>
        <div class="row save-bar"><button class="btn primary" id="saveRoles">💾 حفظ</button></div></div>`;
      const sync = () => {
        $$('[data-rn]', body).forEach((e) => {
          list[e.dataset.rn].name = e.value;
        });
        $$('[data-rb]', body).forEach((e) => {
          list[e.dataset.rb].base = e.value;
        });
      };
      $('#addRole').onclick = () => {
        sync();
        const v = $('#newRole').value.trim();
        if (v) {
          list.push({ id: '', name: v, base: 'approver' });
          draw();
        }
      };
      $$('[data-rdel]', body).forEach((b) => {
        b.onclick = () => {
          sync();
          const r = list[b.dataset.rdel];
          if (users.some((u) => u.roleId === r.id)) {
            toast('لا يمكن حذف مسمى مُسند لمستخدمين، غيّر مسماهم أولاً', true);
            return;
          }
          list.splice(b.dataset.rdel, 1);
          draw();
        };
      });
      $$('[data-rperm]', body).forEach((b) => {
        b.onclick = () => {
          sync();
          rolePermsModal(list[b.dataset.rperm], draw);
        };
      });
      $('#saveRoles').onclick = async () => {
        sync();
        try {
          await saveSettings({ roles: list }, 'تم حفظ المسميات');
          viewSettings('roles');
        } catch (err) {
          $('.ferr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
    };
    draw();
  }

  /* صلاحيات المسمى: الصفحات والإجراءات "حسب نوع الحساب / نعم / لا"، والخطابات المتاحة */
  async function rolePermsModal(role, done) {
    const tools = isAdmin() ? await api('GET', '/api/admin/tools') : [];
    const pageList = [...SF.PAGES, ...tools.map((t) => [`tool:${t.file}`, `النماذج والأدوات ← ${t.title}`])];
    const pages = role.pages || {},
      caps = role.caps || {};
    const restricted = Array.isArray(role.allowedForms);
    const tri = (attr, k, v, dis) =>
      `<select class="in tri" ${attr}="${esc(k)}"${dis ? ' disabled' : ''}><option value="">حسب نوع الحساب</option><option value="1"${v === true ? ' selected' : ''}>نعم</option><option value="0"${v === false ? ' selected' : ''}>لا</option></select>`;
    const isAdm = role.base === 'admin';
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    renderRolePermsModal(bg, caps, isAdm, pageList, pages, restricted, role, tri);
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    /* قائمة "الطلبات التي يراها" تظهر مع "يرى طلبات فرعه" و"كل الطلبات" */
    $('#rScope', bg).onchange = () => {
      const v = $('#rScope', bg).value;
      $('#rViewBox', bg).hidden = !['all', 'branch'].includes(v);
      $('#rViewT', bg).textContent = v === 'all' ? 'الطلبات التي يراها' : 'الطلبات التي يراها من فرعه';
    };
    $$('input[name="rvm"]', bg).forEach((x) => {
      x.onchange = () => {
        $('#rViewList', bg).hidden = $('input[name="rvm"]:checked', bg).value !== 'some';
      };
    });
    $$('[data-vall]', bg).forEach((b) => {
      b.onclick = () =>
        $$('[data-rv]', bg).forEach((c) => {
          c.checked = b.dataset.vall === '1';
        });
    });
    $$('input[name="rdm"]', bg).forEach((x) => {
      x.onchange = () => {
        $('#rDashList', bg).hidden = $('input[name="rdm"]:checked', bg).value !== 'some';
      };
    });
    navTreeWire($('#rNavTree', bg), (r) => $('select', r).value !== '0');
    $('[data-ok]', bg).onclick = () => {
      role.caps = Object.fromEntries(
        $$('[data-rc]', bg)
          .filter((x) => x.value !== '')
          .map((x) => [x.dataset.rc, x.value === '1']),
      );
      role.pages = Object.fromEntries(
        $$('[data-rp]', bg)
          .filter((x) => x.value !== '')
          .map((x) => [x.dataset.rp, x.value === '1']),
      );
      role.allowedForms =
        $('input[name="rfm"]:checked', bg).value === 'some'
          ? $$('[data-rf]', bg)
              .filter((c) => c.checked)
              .map((c) => c.dataset.rf)
          : null;
      role.viewScope = $('#rScope', bg).value || undefined;
      role.dashSections =
        $('input[name="rdm"]:checked', bg).value === 'some'
          ? $$('[data-rds]', bg)
              .filter((c) => c.checked)
              .map((c) => c.dataset.rds)
          : null;
      role.viewForms =
        ['all', 'branch'].includes(role.viewScope) && $('input[name="rvm"]:checked', bg).value === 'some'
          ? $$('[data-rv]', bg)
              .filter((c) => c.checked)
              .map((c) => c.dataset.rv)
          : null;
      bg.remove();
      done();
    };
  }
  /* محتوى rolePermsModal (HTML) */
  function renderRolePermsModal(bg, caps, isAdm, pageList, pages, restricted, role, tri) {
    bg.innerHTML = `<div class="modal" style="max-width:820px"><h3>صلاحيات: ${esc(role.name)}</h3>
      ${isAdm ? '<div class="need-att">نوع الحساب "مدير نظام": له كل الإجراءات والصفحات دائماً.</div>' : ''}
      <div class="perm-cols">
        <div><b>الإجراءات</b>
          ${SF.CAPS.map(([k, l]) => `<div class="row tri-row"><span>${esc(l)}</span>${tri('data-rc', k, caps[k], isAdm)}</div>`).join('')}
          <b style="display:block;margin-top:12px">الصفحات</b>
          ${pageList.map(([k, l]) => `<div class="row tri-row"><span>${esc(l)}</span>${tri('data-rp', k, pages[k], isAdm)}</div>`).join('')}
          <b style="display:block;margin-top:12px">أيقونات التطبيقات وما تحتها</b>
          <div class="hint" style="margin:2px 0 6px">اختر «لا» لإخفاء الأيقونة أو جزء منها عن هذا المسمى. الأيقونة تظهر فقط إذا كانت صلاحياته تسمح بها أصلاً.</div>
          <div class="nav-tree" id="rNavTree">${navTree((k, l, ic, d, g) => `<div class="row tri-row nt-r${g ? ' nt-h' : ''}" style="--d:${d}"><span><span class="nt-ic">${ic}</span> ${esc(l)}</span><select class="in tri" data-rp="${esc(k)}"${isAdm ? ' disabled' : ''}><option value="">ظاهرة</option><option value="0"${pages[k] === false ? ' selected' : ''}>لا</option></select></div>`)}</div>
        </div>
        <div><b>نطاق عرض الطلبات</b>
          <select class="in" id="rScope"${isAdm ? ' disabled' : ''}>
            <option value="">حسب "يرى جميع الطلبات"</option>
            <option value="all"${role.viewScope === 'all' ? ' selected' : ''}>كل الطلبات</option>
            <option value="branch"${role.viewScope === 'branch' ? ' selected' : ''}>يرى طلبات فرعه</option>
            <option value="route"${role.viewScope === 'route' ? ' selected' : ''}>يرى ما عليه فقط (المارة عليه للاعتماد)</option>
          </select>
          <div class="hint" style="margin-bottom:12px">ما يرفعه المستخدم أو يمر عليه للاعتماد يظهر له دائماً.</div>
          <div id="rViewBox" class="perm-view"${['all', 'branch'].includes(role.viewScope) ? '' : ' hidden'}>
            <b id="rViewT">${role.viewScope === 'all' ? 'الطلبات التي يراها' : 'الطلبات التي يراها من فرعه'}</b>
            <label class="check"><input type="radio" name="rvm" value="same"${Array.isArray(role.viewForms) ? '' : ' checked'}> نفس الخطابات المتاحة له (أسفل)</label>
            <label class="check"><input type="radio" name="rvm" value="some"${Array.isArray(role.viewForms) ? ' checked' : ''}> أنواع محددة فقط:</label>
            <div id="rViewList"${Array.isArray(role.viewForms) ? '' : ' hidden'}>
              <div class="row" style="gap:6px;margin:4px 0"><button type="button" class="btn sm" data-vall="1">تحديد الكل</button><button type="button" class="btn sm ghost" data-vall="0">إلغاء الكل</button></div>
              ${SF.GROUPS.map((g) => {
                const fs = SF.FORMS.filter((f) => f.group === g && !f.autoOnly);
                return fs.length
                  ? `<div class="perm-g">${esc(g)}</div>${fs.map((f) => `<label class="check"><input type="checkbox" data-rv="${f.id}"${!Array.isArray(role.viewForms) || role.viewForms.includes(f.id) ? ' checked' : ''}> ${esc(f.title)}</label>`).join('')}`
                  : '';
              }).join('')}
            </div>
          </div>
          <b>أقسام لوحة المؤشرات</b>
          <label class="check"><input type="radio" name="rdm" value="all"${Array.isArray(role.dashSections) ? '' : ' checked'}> كل الأقسام</label>
          <label class="check"><input type="radio" name="rdm" value="some"${Array.isArray(role.dashSections) ? ' checked' : ''}> المحددة فقط:</label>
          <div id="rDashList" class="perm-view"${Array.isArray(role.dashSections) ? '' : ' hidden'}>${[
            ...new Set(SF.DASH_SECTIONS.map((s) => s[2])),
          ]
            .map(
              (g) =>
                `<div class="perm-g">${esc(g)}</div>${SF.DASH_SECTIONS.filter((s) => s[2] === g)
                  .map(
                    ([k, l]) =>
                      `<label class="check"><input type="checkbox" data-rds="${k}"${!Array.isArray(role.dashSections) || role.dashSections.includes(k) ? ' checked' : ''}> ${esc(l)}</label>`,
                  )
                  .join('')}`,
            )
            .join('')}</div>
          <b>الخطابات المتاحة (للرفع والاطلاع)</b>
          <label class="check"><input type="radio" name="rfm" value="all"${restricted ? '' : ' checked'}> كل الخطابات</label>
          <label class="check"><input type="radio" name="rfm" value="some"${restricted ? ' checked' : ''}> المحددة فقط:</label>
          ${SF.GROUPS.map((g) => {
            const fs = SF.FORMS.filter((f) => f.group === g);
            return fs.length
              ? `<div class="perm-g">${esc(g)}</div>${fs.map((f) => `<label class="check"><input type="checkbox" data-rf="${f.id}"${!restricted || role.allowedForms.includes(f.id) ? ' checked' : ''}> ${esc(f.title)}</label>`).join('')}`
              : '';
          }).join('')}
        </div>
      </div>
      <div class="row" style="margin-top:16px"><button type="button" class="btn primary" data-ok>تم</button><button type="button" class="btn ghost" data-x>إلغاء</button></div>
      <div class="hint">يحفظ النظام التغييرات عند الضغط على "حفظ" في صفحة المسميات.</div></div>`;
  }
  return {
    settingsTools,
    settingsActivity,
    settingsOversight,
    settingsBackup,
    settingsEmail,
    settingsRoles,
    settingsCalendar,
    settingsHrPart,
    renderSettingsHr,
    settingsHrDraw,
  };
};
