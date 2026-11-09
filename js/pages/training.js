'use strict';
/* صفحة «training» (viewTraining) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['training'] = function (S) {
  const { $, $$, SF, TR_TODAY, api, askYesNo, empEmpty, esc, head, icon, normAr, printDocs, setCrumb, shell, toast, trState, uploadFile } =
    S;
  /* شهادة إتمام الدورة للطباعة / الحفظ PDF */
  function trPrintCert(d, p) {
    const html = `<div style="direction:rtl;font-family:inherit;border:10px double #1e293b;padding:14mm 18mm;text-align:center;min-height:150mm;position:relative">
      <img src="logo.png" alt="" style="height:22mm;margin-bottom:4mm"><div style="font-size:13pt;color:#475569">${esc(d.company || '')}</div>
      <div style="font-size:30pt;font-weight:800;color:#9b1c1c;margin:6mm 0 2mm">شهادة إتمام دورة تدريبية</div>
      <div style="font-size:13pt;color:#475569">تشهد الإدارة بأن</div>
      <div style="font-size:24pt;font-weight:800;margin:4mm 0;color:#0f172a">${esc(p.name)}</div>
      ${p.empNo ? `<div style="color:#64748b">الرقم الوظيفي: ${esc(p.empNo)}</div>` : ''}
      <div style="font-size:13pt;color:#475569;margin-top:4mm">أتم بنجاح الدورة التدريبية</div>
      <div style="font-size:19pt;font-weight:800;margin:3mm 0;color:#1e293b">«${esc(d.title)}»</div>
      <div style="font-size:12pt;color:#334155">${d.start === d.end || !d.end ? `بتاريخ ${esc(SF.fmtDate(d.start))}` : `في الفترة من ${esc(SF.fmtDate(d.start))} إلى ${esc(SF.fmtDate(d.end))}`} — بإجمالي ${d.hours} ساعة تدريبية${p.score != null ? ` — الدرجة ${p.score}%` : ''}</div>
      <div style="display:flex;justify-content:space-between;margin-top:16mm;font-size:12pt"><div>المدرب<br><b>${esc(d.trainer || '—')}</b></div><div>رقم الشهادة<br><b dir="ltr">${esc(p.certNo || '')}</b></div><div>مدير التدريب<br><b>..................</b></div></div></div>`;
    printDocs(`شهادة ${p.name} — ${d.title}`, { landscape: true }, html);
  }

  async function viewTraining(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/training');
    let d;
    try {
      d = await api('GET', '/api/training');
    } catch (err) {
      main.innerHTML = `<div class="card err">${esc(err.message)}</div>`;
      return;
    }
    if (query.id) return trDetail(main, d, query.id);
    const L = d.list;
    const st = (k) => L.filter((c) => trState(c)[1] === k).length;
    const tile = (lbl, n, ic, c) => `<div class="tr-k" style="--c:${c}"><span>${icon(ic)}</span><b>${n}</b><small>${lbl}</small></div>`;
    const row = (c) => {
      const [sl, sk] = trState(c),
        dd = c.start ? new Date(`${c.start}T00:00:00`) : null;
      return `<a class="tr-row ${sk}" href="#/training?id=${c.id}" data-st="${sk}" data-s="${esc(normAr(`${c.title} ${c.trainer || ''} ${c.provider || ''} ${c.location || ''}`))}">
        <span class="tr-date">${dd ? `<b>${dd.getDate()}</b><small>${esc(dd.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short' }))}</small>` : '—'}</span>
        <span class="tr-rt"><b>${esc(c.title)}${c.mandatory ? ' <i class="tr-tag m">إلزامية</i>' : ''} <i class="tr-tag ${sk}">${sl}</i></b>
          <small>${[c.trainer && `${icon('user')} ${esc(c.trainer)}`, `${icon(c.mode === 'أونلاين' ? 'monitor' : 'mapPin')} ${esc(c.mode === 'أونلاين' ? 'أونلاين' : c.location || c.mode)}`, `${icon('clock')} ${c.sessions} جلسة · ${c.hours} ساعة`, c.files && `${icon('paperclip')} ${c.files}`].filter(Boolean).join(' <em>·</em> ')}</small></span>
        <span class="tr-side">${
          d.manage
            ? `<b>${c.targets}</b><small>متدرب${c.closed ? ` · أتمها ${c.completed}` : ''}</small>${c.ratings ? `<small>⭐ ${c.rating}</small>` : ''}`
            : c.mine
              ? c.mine.completed
                ? `<b class="ok">${icon('fileAward')}</b><small>الشهادة جاهزة</small>`
                : `<b>${c.mine.pct}%</b><small>حضورك</small>`
              : ''
        }</span></a>`;
    };
    main.innerHTML = `${head('مركز التدريب', d.manage ? 'الدورات ومواعيدها ومادتها التدريبية والحضور والنتائج والشهادات — مربوطة بمهن مكتبة المهن' : 'دوراتك التدريبية ومواعيدها ومادتها وشهاداتك', d.manage ? `<button class="btn primary" id="trNew">${icon('plus')} دورة جديدة</button>` : '')}
      <div class="tr-ks">${tile('كل الدورات', L.length, 'bookOpen', '#1e293b')}${tile('قادمة', st('soon'), 'calendar', '#2563eb')}${tile('جارية', st('live'), 'clock', '#d97706')}${tile('منتهية', st('done'), 'checkCircle', '#0f766e')}
        ${
          d.manage
            ? tile(
                'أتموا دورات',
                L.reduce((a, c) => a + (c.completed || 0), 0),
                'fileAward',
                '#9b1c1c',
              )
            : tile('شهاداتي', L.filter((c) => c.mine && c.mine.completed).length, 'fileAward', '#9b1c1c')
        }</div>
      <div class="card"><div class="filters"><input class="in" id="trQ" placeholder="ابحث بعنوان الدورة أو المدرب أو المكان..."><span class="kn-chips">${[
        ['', 'الكل'],
        ['soon', 'قادمة'],
        ['live', 'جارية'],
        ['done', 'منتهية'],
      ]
        .map(([k, l]) => `<button type="button" data-tf="${k}" class="${k ? '' : 'on'}">${l}</button>`)
        .join('')}</span></div>
        <div class="tr-list" id="trL">${L.length ? L.map(row).join('') : empEmpty(d.manage ? 'لا توجد دورات بعد — أنشئ أول دورة من «دورة جديدة»' : 'لا توجد دورات تدريبية لك حالياً')}</div></div>`;
    let tf = '';
    const filt = () => {
      const v = normAr($('#trQ').value.trim());
      $$('#trL .tr-row', main).forEach((r) => {
        r.hidden = (tf && r.dataset.st !== tf) || (v && !r.dataset.s.includes(v));
      });
    };
    $('#trQ').oninput = filt;
    $$('[data-tf]', main).forEach((b) => {
      b.onclick = () => {
        tf = b.dataset.tf;
        $$('[data-tf]', main).forEach((x) => x.classList.toggle('on', x === b));
        filt();
      };
    });
    if ($('#trNew'))
      $('#trNew').onclick = () =>
        trForm(d, null, (id) => {
          location.hash = `#/training?id=${id}`;
        });
  }

  /* نموذج الدورة: البيانات والمستهدفون والجلسات والمادة */
  function trForm(d, c, done) {
    const it = c || {
      mode: 'حضوري',
      profIds: [],
      branches: [],
      empIds: [],
      sessionsList: [{ date: TR_TODAY(), from: '09:00', to: '13:00' }],
    };
    const emps = d.emps || [],
      empL = (e) => `${e[1]} — ${e[2] || '؟'}`;
    let picked = [...(it.empIds || [])],
      S = (it.sessionsList || []).map((x) => ({ ...x }));
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    renderTrForm(bg, c, d, empL, emps, it);
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#trPq', bg).oninput = (e) => {
      const v = normAr(e.target.value.trim());
      $$('#trPs label', bg).forEach((l) => {
        l.hidden = !!v && !l.dataset.t.includes(v);
      });
    };
    const drawE = () => {
      $('#trEc', bg).innerHTML = picked
        .map((id) => {
          const e = emps.find((x) => x[0] === id);
          return `<span>${esc(e ? e[1] : id)} <button type="button" data-ex="${id}">×</button></span>`;
        })
        .join('');
      $$('[data-ex]', bg).forEach((b) => {
        b.onclick = () => {
          picked = picked.filter((x) => x !== b.dataset.ex);
          drawE();
        };
      });
    };
    $('#trEq', bg).onchange = (ev) => {
      const v = ev.target.value.trim(),
        e = emps.find((x) => empL(x) === v);
      if (e && !picked.includes(e[0])) picked.push(e[0]);
      ev.target.value = '';
      drawE();
    };
    trFormPart(S, bg, drawE);
    $('form', bg).onsubmit = async (ev) => {
      ev.preventDefault();
      const f = ev.target,
        files = $('#trF', bg) ? $('#trF', bg).files : [];
      const b = {
        title: f.title.value,
        trainer: f.trainer.value,
        provider: f.provider.value,
        mode: f.mode.value,
        location: f.location.value,
        link: f.link.value.trim(),
        passScore: f.passScore.value,
        desc: f.desc.value,
        mandatory: f.mandatory.checked,
        profIds: $$('[name=prof]:checked', bg).map((x) => x.value),
        branches: $$('[name=br]:checked', bg).map((x) => x.value),
        empIds: picked,
        sessions: S,
      };
      const btn = $('button.primary', bg);
      btn.disabled = true;
      try {
        const r = await api(c ? 'PUT' : 'POST', c ? `/api/training/${c.id}` : '/api/training', b);
        for (const fl of files) await uploadFile(null, fl, '', `/api/training/${c ? c.id : r.id}/files`);
        bg.remove();
        toast('تم حفظ الدورة');
        done(c ? c.id : r.id);
      } catch (e) {
        $('.merr', bg).innerHTML = `<div class="err">${esc(e.message)}</div>`;
        btn.disabled = false;
      }
    };
  }
  /* جزء من trForm: const drawS = () => {… */
  function trFormPart(S, bg, drawE) {
    const drawS = () => {
      $('#trS', bg).innerHTML = S.map(
        (x, i) =>
          `<div class="tr-srow"><b>${i + 1}</b><input class="in" type="date" data-s="${i}:date" value="${esc(x.date || '')}"><input class="in" type="time" data-s="${i}:from" value="${esc(x.from || '')}"><span>إلى</span><input class="in" type="time" data-s="${i}:to" value="${esc(x.to || '')}"><input class="in" data-s="${i}:place" value="${esc(x.place || '')}" placeholder="المكان (اختياري)"><button type="button" class="btn sm ghost" data-sd="${i}">${icon('trash')}</button></div>`,
      ).join('');
      $$('[data-s]', bg).forEach((inp) => {
        inp.oninput = () => {
          const [i, k] = inp.dataset.s.split(':');
          S[i][k] = inp.value;
        };
      });
      $$('[data-sd]', bg).forEach((b) => {
        b.onclick = () => {
          S.splice(Number(b.dataset.sd), 1);
          drawS();
        };
      });
    };
    $('#trSA', bg).onclick = () => {
      const l = S[S.length - 1] || {};
      const nd = l.date ? new Date(new Date(`${l.date}T00:00:00`).getTime() + 864e5).toISOString().slice(0, 10) : TR_TODAY();
      S.push({ date: nd, from: l.from || '09:00', to: l.to || '13:00' });
      drawS();
    };
    drawE();
    drawS();
  }
  /* محتوى trForm (HTML) */
  function renderTrForm(bg, c, d, empL, emps, it) {
    bg.innerHTML = `<form class="modal tr-form" style="max-width:900px;width:96%" novalidate><h3 style="margin-top:0">${c ? `${icon('pencil')} تعديل الدورة` : `${icon('plus')} دورة تدريبية جديدة`}</h3>
      <div class="field"><label>عنوان الدورة *</label><input class="in" name="title" value="${esc(it.title || '')}" placeholder="مثال: السلامة في مواقع الحفر"></div>
      <div class="grid2"><div class="field"><label>المدرب</label><input class="in" name="trainer" value="${esc(it.trainer || '')}"></div><div class="field"><label>الجهة المقدمة</label><input class="in" name="provider" value="${esc(it.provider || '')}" placeholder="داخلي / اسم المعهد"></div></div>
      <div class="grid2"><div class="field"><label>طريقة التدريب</label><select class="in" name="mode">${['حضوري', 'أونلاين', 'مدمج'].map((m) => `<option${it.mode === m ? ' selected' : ''}>${m}</option>`).join('')}</select></div><div class="field"><label>المكان</label><input class="in" name="location" value="${esc(it.location || '')}" placeholder="قاعة التدريب — فرع ..."></div></div>
      <div class="grid2"><div class="field"><label>رابط الاجتماع (للأونلاين)</label><input class="in" name="link" dir="ltr" value="${esc(it.link || '')}" placeholder="https://..."></div><div class="field"><label>درجة النجاح % <small class="muted">(اتركها فارغة لو الإتمام بالحضور فقط)</small></label><input class="in" type="number" min="0" max="100" name="passScore" value="${esc(it.passScore === 0 ? '0' : it.passScore || '')}"></div></div>
      <div class="field"><label>وصف الدورة وأهدافها</label><textarea class="in" name="desc" rows="3">${esc(it.desc || '')}</textarea></div>
      <label class="check"><input type="checkbox" name="mandatory"${it.mandatory ? ' checked' : ''}> دورة إلزامية لأصحاب المهن المختارة</label>
      <h4 class="b-sec">${icon('users')} المستهدفون <small class="muted">(مهنة أو أكثر، و / أو فروع، و / أو موظفون بالاسم)</small></h4>
      <div class="field"><label>المهن (من مكتبة المهن)</label><input class="in" id="trPq" placeholder="ابحث في المهن..." style="margin-bottom:6px"><div class="kn-profs" id="trPs">${d.profs.map((p) => `<label data-t="${esc(normAr(p.name))}"><input type="checkbox" name="prof" value="${p.id}"${(it.profIds || []).includes(p.id) ? ' checked' : ''}> ${esc(p.name)}</label>`).join('') || '<span class="muted">أنشئ المهن من مكتبة المهن أولاً</span>'}</div></div>
      <div class="field"><label>الفروع <small class="muted">(فارغة = كل الفروع)</small></label><div class="kn-profs">${d.branches.map((b) => `<label><input type="checkbox" name="br" value="${esc(b)}"${(it.branches || []).includes(b) ? ' checked' : ''}> ${esc(b)}</label>`).join('')}</div></div>
      <div class="field"><label>موظفون بالاسم</label><input class="in" id="trEq" list="trEl" placeholder="اكتب الاسم أو الرقم الوظيفي ثم اختر..."><datalist id="trEl">${emps.map((e) => `<option value="${esc(empL(e))}">${esc(`${e[4] || ''} — ${e[3] || ''}`)}</option>`).join('')}</datalist><div class="tr-chips" id="trEc"></div></div>
      <h4 class="b-sec">${icon('calendar')} الجلسات والمواعيد *</h4><div id="trS"></div><button type="button" class="btn sm" id="trSA">${icon('plus')} جلسة</button>
      ${c ? '' : `<div class="field" style="margin-top:12px"><label>${icon('paperclip')} المادة التدريبية (PDF، عروض، فيديو MP4، Word، Excel)</label><input type="file" class="in" id="trF" multiple></div>`}
      <div class="merr"></div><div class="row" style="gap:8px;margin-top:12px"><button class="btn primary">💾 حفظ ${c ? '' : 'وإرسال إشعار للمستهدفين'}</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
  }

  /* صفحة الدورة */
  async function trDetail(main, list, id) {
    /* حالة الصفحة: ما يتغير بعد العرض (c، body، stars) */
    const vs = {};
    vs.c = undefined;
    try {
      vs.c = await api('GET', `/api/training/${id}`);
    } catch (err) {
      main.innerHTML = `<div class="card err">${esc(err.message)}</div>`;
      return;
    }
    setCrumb([[vs.c.title, location.hash]]);
    const [sl, sk] = trState(vs.c),
      reload = () => trDetail(main, list, id);
    const SS = vs.c.sessionsList || [];
    const sess = SS.map((x, i) => {
      const past = x.date < TR_TODAY();
      return `<div class="tr-s${past ? ' past' : ''}"><b>${i + 1}</b><span>${icon('calendar')} ${esc(SF.fmtDate(x.date))}</span><span>${icon('clock')} ${esc(x.from || '')} – ${esc(x.to || '')}</span>${x.place || vs.c.location ? `<span>${icon('mapPin')} ${esc(x.place || vs.c.location)}</span>` : ''}</div>`;
    }).join('');
    const files = (vs.c.fileList || [])
      .map(
        (f) =>
          `<div class="tr-f"><a href="/api/training/${vs.c.id}/files/${f.id}" target="_blank">${icon('paperclip')} ${esc(f.name)}</a><small>${Math.ceil((f.size || 0) / 1024)} KB</small>${vs.c.manage ? `<button class="btn sm ghost" data-fd="${f.id}">${icon('trash')}</button>` : ''}</div>`,
      )
      .join('');
    const hero = `<div class="card tr-hero ${sk}"><div class="tr-hh"><div><small>${vs.c.mandatory ? '<i class="tr-tag m">إلزامية</i> ' : ''}<i class="tr-tag ${sk}">${sl}</i></small><h2>${esc(vs.c.title)}</h2>${vs.c.desc ? `<p>${esc(vs.c.desc)}</p>` : ''}</div></div>
      <div class="kn-meta">${vs.c.trainer ? `<span>${icon('user')} المدرب: ${esc(vs.c.trainer)}</span>` : ''}${vs.c.provider ? `<span>${icon('companyHq')} ${esc(vs.c.provider)}</span>` : ''}<span>${icon(vs.c.mode === 'أونلاين' ? 'monitor' : 'mapPin')} ${esc(vs.c.mode)}${vs.c.location ? ` — ${esc(vs.c.location)}` : ''}</span><span>${icon('clock')} ${SS.length} جلسة · ${vs.c.hours} ساعة</span>${vs.c.passScore !== '' ? `<span>${icon('target')} النجاح ${vs.c.passScore}%</span>` : ''}${vs.c.manage ? `<span>${icon('users')} ${vs.c.targets} متدرب</span>` : ''}${vs.c.ratings ? `<span>⭐ ${vs.c.rating} (${vs.c.ratings})</span>` : ''}</div>
      ${vs.c.link && vs.c.mode !== 'حضوري' ? `<a class="btn" href="${esc(vs.c.link)}" target="_blank" rel="noopener" style="margin-top:10px">${icon('link')} دخول الاجتماع</a>` : ''}</div>`;
    return trDetailPart5(SS, files, hero, list, main, reload, sess, vs);
  }
  /* جزء من trDetail: vs.body = `<div class="tr-cols"><div class="card">… */
  function trDetailPart5(SS, files, hero, list, main, reload, sess, vs) {
    vs.body = `<div class="tr-cols"><div class="card"><h3 style="margin-top:0">${icon('calendar')} الجلسات</h3><div class="tr-ss">${sess}</div></div>
      <div class="card"><div class="emp-sec-h"><h3>${icon('bookOpen')} المادة التدريبية</h3>${vs.c.manage ? `<label class="btn sm" style="cursor:pointer">${icon('upload')} رفع<input type="file" id="trUp" hidden multiple></label>` : ''}</div>${files || '<div class="muted">لا توجد ملفات بعد</div>'}</div></div>`;
    if (vs.c.manage) {
      const P = vs.c.people || [];
      vs.body += `<div class="card"><div class="emp-sec-h"><h3>${icon('users')} المتدربون والحضور والنتائج (${P.length})</h3><span class="row" style="gap:6px">${vs.c.closed ? '' : `<button class="btn sm primary" id="trSave">💾 حفظ الحضور والدرجات</button>`}</span></div>
        ${
          P.length
            ? `<input class="in" id="trPQ" placeholder="ابحث بالاسم أو الفرع..." style="margin-bottom:8px"><div class="tbl-wrap" style="max-height:60vh;overflow:auto"><table class="tbl tr-t"><thead><tr><th>المتدرب</th><th>الفرع</th>${SS.map((x, i) => `<th title="${esc(x.date)}">ج${i + 1}<br><small>${esc(x.date.slice(5))}</small>${vs.c.closed ? '' : `<br><input type="checkbox" data-all="${x.id}" title="الكل">`}</th>`).join('')}<th>الحضور</th><th>الدرجة</th><th>الحالة</th></tr></thead>
          <tbody>${P.map(
            (
              p,
            ) => `<tr data-q="${esc(normAr(`${p.name} ${p.branch} ${p.empNo}`))}"><td><b>${esc(p.name)}</b><br><small class="muted">${esc(p.title)}${p.empNo ? ` · ${esc(p.empNo)}` : ''}</small></td><td>${esc(p.branch)}</td>
            ${SS.map((x) => `<td class="c"><input type="checkbox" data-at="${x.id}" value="${p.id}"${((vs.c.attend || {})[x.id] || []).includes(p.id) ? ' checked' : ''}${vs.c.closed ? ' disabled' : ''}></td>`).join('')}
            <td class="num">${p.pct}%</td><td><input class="in tr-sc" type="number" min="0" max="100" data-sc="${p.id}" value="${p.score == null ? '' : p.score}"${vs.c.closed ? ' disabled' : ''}></td>
            <td>${vs.c.closed ? (p.completed ? `<button class="btn sm" data-cert="${p.id}">${icon('fileAward')} الشهادة</button>` : '<span class="muted">لم يتم</span>') : `<span class="muted">${p.pct >= 75 ? 'حضور مكتمل' : 'جارٍ'}</span>`}</td></tr>`,
          ).join('')}</tbody></table></div>`
            : empEmpty('لا يوجد مستهدفون — عدّل الدورة وحدد المهن أو الفروع أو الموظفين')
        }
        <div class="hint">الإتمام = حضور 75% من الجلسات أو أكثر${vs.c.passScore !== '' ? ` + درجة ${vs.c.passScore}% أو أعلى` : ''}. عند «إنهاء الدورة» تُضاف الدورة لملف كل من أتمها (الدورات التدريبية) ويصله إشعار بشهادته.</div></div>
        ${(vs.c.reviews || []).length ? `<div class="card"><h3 style="margin-top:0">⭐ تقييم المتدربين (${vs.c.reviews.length}) — المتوسط ${vs.c.rating}</h3>${vs.c.reviews.map((r) => `<div class="tr-rv"><b>${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</b> ${esc(r.name)}${r.comment ? `<div>${esc(r.comment)}</div>` : ''}</div>`).join('')}</div>` : ''}`;
    } else if (vs.c.mine) {
      const m = vs.c.mine;
      vs.body += `<div class="card tr-mine"><h3 style="margin-top:0">${icon('user')} حالتك في الدورة</h3><div class="tr-ks">${[
        ['حضورك', `${m.attended}/${m.sessions}`, 'checkCircle', '#0f766e'],
        ['نسبة الحضور', `${m.pct}%`, 'gauge', '#2563eb'],
        ['درجتك', m.score == null ? '—' : `${m.score}%`, 'target', '#d97706'],
      ]
        .map(([l, n, ic, col]) => `<div class="tr-k" style="--c:${col}"><span>${icon(ic)}</span><b>${n}</b><small>${l}</small></div>`)
        .join('')}</div>
        ${m.completed ? `<button class="btn primary" id="trMyCert">${icon('fileAward')} تحميل شهادتي</button>` : vs.c.closed ? '<div class="muted">انتهت الدورة ولم تستوفِ شروط الإتمام</div>' : ''}</div>
        <div class="card"><h3 style="margin-top:0">⭐ قيّم الدورة</h3><div class="tr-stars" id="trSt">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" class="${vs.c.myRating && vs.c.myRating.stars >= n ? 'on' : ''}">★</button>`).join('')}</div>
          <textarea class="in" id="trCm" rows="2" placeholder="رأيك في الدورة والمدرب والمادة (اختياري)">${esc((vs.c.myRating || {}).comment || '')}</textarea><button class="btn sm primary" id="trRate" style="margin-top:8px">إرسال التقييم</button></div>`;
    }
    main.innerHTML = `${head(vs.c.title, 'مركز التدريب', `<span class="row" style="gap:6px"><a class="btn" href="#/training">${icon('undo')} كل الدورات</a>${vs.c.manage ? (vs.c.closed ? '<button class="btn" id="trOpen">إعادة فتح الدورة</button>' : `<button class="btn" id="trEdit">${icon('pencil')} تعديل</button><button class="btn primary" id="trClose">${icon('checkCircle')} إنهاء الدورة</button>`) + `<button class="btn bad ghost" id="trDel">${icon('trash')}</button>` : ''}</span>`)}${hero}${vs.body}`;
    /* الأحداث */
    wireTrDetail2(list, reload, vs);
    const saveAll = async () => {
      for (const x of SS)
        await api('POST', `/api/training/${vs.c.id}/attend`, {
          sid: x.id,
          empIds: $$(`[data-at="${x.id}"]:checked`, main).map((i) => i.value),
        });
      const results = {};
      $$('[data-sc]', main).forEach((i) => {
        results[i.dataset.sc] = i.value;
      });
      await api('POST', `/api/training/${vs.c.id}/results`, { results });
    };
    trDetailPart(reload, saveAll);
    trDetailPart4(reload, saveAll, vs);
    wireTrDetail(main);
    $$('[data-cert]', main).forEach((b) => {
      b.onclick = () =>
        trPrintCert(
          vs.c,
          vs.c.people.find((p) => p.id === b.dataset.cert),
        );
    });
    wireTrDetail3(reload, vs);
    $$('[data-fd]', main).forEach((b) => {
      b.onclick = async () => {
        if (!(await askYesNo('حذف الملف؟'))) return;
        try {
          await api('DELETE', `/api/training/${vs.c.id}/files/${b.dataset.fd}`);
          reload();
        } catch (e) {
          toast(e.message, true);
        }
      };
    });
    vs.stars = (vs.c.myRating || {}).stars || 0;
    $$('[data-star]', main).forEach((b) => {
      b.onclick = () => {
        vs.stars = Number(b.dataset.star);
        $$('[data-star]', main).forEach((x) => x.classList.toggle('on', Number(x.dataset.star) <= vs.stars));
      };
    });
    return trDetailPart3(vs);
  }
  /* أحداث trDetail: #trMyCert، #trUp */
  function wireTrDetail3(reload, vs) {
    if ($('#trMyCert'))
      $('#trMyCert').onclick = () =>
        trPrintCert(vs.c, { name: vs.c.me.name, empNo: vs.c.me.empNo, score: vs.c.mine.score, certNo: vs.c.certNo });
    if ($('#trUp'))
      $('#trUp').onchange = async (ev) => {
        try {
          for (const f of ev.target.files) await uploadFile(null, f, '', `/api/training/${vs.c.id}/files`);
          toast('تم رفع المادة');
          reload();
        } catch (e) {
          toast(e.message, true);
        }
      };
  }
  /* جزء من trDetail: if ($('#trClose'))… */
  function trDetailPart4(reload, saveAll, vs) {
    if ($('#trClose'))
      $('#trClose').onclick = async () => {
        if (!(await askYesNo('إنهاء الدورة؟ سنحفظ الحضور والدرجات، ونضيف الدورة لملف كل من أتمها، ونرسل له إشعاراً بشهادته.'))) return;
        try {
          if ($('#trSave')) await saveAll();
          const r = await api('POST', `/api/training/${vs.c.id}/close`, {});
          toast(`انتهت الدورة — أتمها ${r.completed} متدرب`);
          reload();
        } catch (e) {
          toast(e.message, true);
        }
      };
  }
  /* جزء من trDetail: if ($('#trRate'))… */
  function trDetailPart3(vs) {
    if ($('#trRate'))
      $('#trRate').onclick = async () => {
        if (!vs.stars) {
          toast('اختر عدد النجوم', true);
          return;
        }
        try {
          await api('POST', `/api/training/${vs.c.id}/rate`, { stars: vs.stars, comment: $('#trCm').value });
          toast('شكراً على تقييمك');
        } catch (e) {
          toast(e.message, true);
        }
      };
  }
  /* أحداث trDetail: #trEdit، #trDel، #trOpen */
  function wireTrDetail2(list, reload, vs) {
    if ($('#trEdit')) $('#trEdit').onclick = () => trForm(list, vs.c, reload);
    if ($('#trDel'))
      $('#trDel').onclick = async () => {
        if (!(await askYesNo(`حذف دورة «${vs.c.title}» نهائياً؟`))) return;
        try {
          await api('DELETE', `/api/training/${vs.c.id}`);
          location.hash = '#/training';
        } catch (e) {
          toast(e.message, true);
        }
      };
    if ($('#trOpen'))
      $('#trOpen').onclick = async () => {
        try {
          await api('POST', `/api/training/${vs.c.id}/reopen`, {});
          reload();
        } catch (e) {
          toast(e.message, true);
        }
      };
  }
  /* أحداث trDetail */
  function wireTrDetail(main) {
    $$('[data-all]', main).forEach((b) => {
      b.onchange = () =>
        $$(`[data-at="${b.dataset.all}"]`, main).forEach((i) => {
          if (!i.closest('tr').hidden) i.checked = b.checked;
        });
    });
    trDetailPart2(main);
  }
  /* جزء من trDetail: if ($('#trPQ'))… */
  function trDetailPart2(main) {
    if ($('#trPQ'))
      $('#trPQ').oninput = (e) => {
        const v = normAr(e.target.value.trim());
        $$('.tr-t tbody tr', main).forEach((r) => {
          r.hidden = !!v && !r.dataset.q.includes(v);
        });
      };
  }
  /* جزء من trDetail: if ($('#trSave'))… */
  function trDetailPart(reload, saveAll) {
    if ($('#trSave'))
      $('#trSave').onclick = async (e) => {
        e.currentTarget.disabled = true;
        try {
          await saveAll();
          toast('تم حفظ الحضور والدرجات');
          reload();
        } catch (err) {
          toast(err.message, true);
          e.currentTarget.disabled = false;
        }
      };
  }

  return { viewTraining };
};
