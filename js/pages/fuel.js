'use strict';
/* صفحة «fuel» (viewFuel) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['fuel'] = function (S) {
  const {
    $,
    $$,
    FUEL_COLS,
    FUEL_TPL_HEAD,
    SF,
    api,
    askYesNo,
    downloadXlsx,
    esc,
    fmtDate,
    fuelInBr,
    fuelMonthName,
    fuelSrc,
    fuelUpload,
    head,
    icon,
    parseCsv,
    printDocs,
    readXlsx,
    shell,
    state,
    tankName,
    toast,
  } = S;
  /* قراءة الأعمدة من صف العناوين (أول 20 صفاً) */
  function fuelDetect(rows) {
    const norm = (v) =>
      String(v == null ? '' : v)
        .replace(/\s+/g, ' ')
        .trim();
    let hi = -1,
      best = 0;
    rows.slice(0, 20).forEach((r, i) => {
      const n = FUEL_COLS.filter(([, , re]) => (r || []).some((c) => re.test(norm(c)))).length;
      if (n > best) {
        best = n;
        hi = i;
      }
    });
    if (hi < 0 || best < 2) return { header: -1, map: {} };
    const head = rows[hi].map(norm),
      map = {},
      used = new Set();
    /* المبلغ: يُفضّل عمود «شامل الضريبة»، واللترات قبل المبلغ حتى لا يأخذ «الإجمالي» عمود اللترات */
    const order = ['plate', 'liters', 'amount', 'year', 'model', 'brand', 'color', 'branch', 'fuel', 'user'];
    for (const k of order) {
      const re = FUEL_COLS.find((c) => c[0] === k)[2];
      let idx = head.findIndex((h, j) => !used.has(j) && re.test(h) && (k !== 'amount' || /شامل|vat|ضريب/i.test(h)));
      if (idx < 0) idx = head.findIndex((h, j) => !used.has(j) && re.test(h) && !(k === 'year' && /الطراز/.test(h)));
      if (idx >= 0) {
        map[k] = idx;
        used.add(idx);
      }
    }
    return { header: hi, map };
  }

  function fuelTemplate(month, vehicles, branches) {
    const fuelOf = (f) => (/ديزل/.test(f || '') ? 'diesel' : /95/.test(f || '') ? '_95' : /بنزين/.test(f || '') ? '_91' : '');
    const list = vehicles
      .slice()
      .sort((a, b) => String(a.branch).localeCompare(String(b.branch), 'ar') || String(a.plate).localeCompare(String(b.plate), 'ar'));
    const rows = [
      [`تقرير أستهلاك المركبة - ${month}`],
      [''],
      FUEL_TPL_HEAD,
      ...list.map((v, i) => [i + 1, v.branch || '', v.plate, '', '', fuelOf(v.fuel), '', '']),
    ];
    const help = [
      ['تعليمات رفع تقرير استهلاك المركبات'],
      [''],
      [
        '1',
        'ارفع تقرير «معدل الاستهلاك للمركبة» كما ينزل من الشركة المتعاقدة بدون أي تعديل (بالعربي أو بالإنجليزي Veichle Depreciation Rate) — هذا القالب بنفس أعمدته للرجوع إليه فقط.',
      ],
      ['2', 'الأعمدة: الرقم التسلسلي، الفرع، لوحة المركبة، رقم المركبة الداخلي، رقم الهيكل، نوع الوقود، الاستهلاك بالليتر، التكلفة.'],
      [
        '3',
        'يربط النظام كل صف بمركبته من «لوحة المركبة» فقط، ويوزّعه على فرع المركبة في سجل الأسطول. يتجاهل النظام «رقم المركبة الداخلي» و«رقم الهيكل».',
      ],
      [
        '4',
        'اللوحة غير الموجودة في الأسطول تظهر في «يحتاج مراجعة / ربط»: اربطها بمركبة أو بفرع (فردياً أو بالربط الجماعي) ويحفظ النظام الربط للأشهر التالية.',
      ],
      ['5', 'عند الرفع: اختر الشهر، وارفع التقرير + فاتورة الشهر (إلزامية، PDF أو صورة) + أي مرفقات أخرى (اختياري).'],
      ['6', 'بعد الربط: «حسب الفرع» ← «بيان إجمالي» للطباعة أو Excel بالفرع والاستهلاك باللتر والمبلغ شامل الضريبة.'],
    ];
    downloadXlsx(`نموذج-رفع-استهلاك-المركبات-${month}.xlsx`, [
      { name: 'Combined Data', rows },
      { name: 'تعليمات', rows: help },
      { name: 'الفروع', rows: [['الفروع'], ...branches.map((x) => [x])] },
    ]);
  }

  async function fuelImport(done, months, base) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    const defM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    renderFuelImport(bg, defM);
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#fuTpl', bg).onclick = (e) => {
      e.preventDefault();
      const mo = $('#fuM', bg).value;
      if (!mo) return toast('اختر الشهر أولاً', true);
      fuelTemplate(mo, (base && base.vehicles) || [], (base && base.branches) || []);
    };
    return fuelImportPart(bg, done, months);
  }
  /* جزء من fuelImport: let rows = [],… */
  function fuelImportPart(bg, done, months) {
    let rows = [],
      det = { header: -1, map: {} },
      fileName = '';
    const err = (m) => {
      $('.merr', bg).innerHTML = m ? `<div class="err">${esc(m)}</div>` : '';
    };
    const drawMap = () => {
      const head = det.header >= 0 ? rows[det.header] : rows[0] || [];
      const opts = (k) =>
        `<option value="">—</option>${head.map((h, j) => `<option value="${j}"${det.map[k] === j ? ' selected' : ''}>${esc(String(h || `عمود ${j + 1}`).slice(0, 40))}</option>`).join('')}`;
      const data = rows.slice(det.header + 1).filter((r) => r && r.some((c) => String(c || '').trim()));
      $('#fuMap', bg).innerHTML = `<div class="hint">تعرّف النظام على الأعمدة تلقائياً — راجعها (الحقول المعلّمة * مطلوبة):</div>
        <div class="fu-map">${FUEL_COLS.map(([k, l, , req]) => `<label><span>${l}${req ? ' *' : ''}</span><select class="in" data-col="${k}">${opts(k)}</select></label>`).join('')}</div>
        <div class="hint">${data.length} سطر في الملف</div>`;
      $$('[data-col]', bg).forEach((s) => {
        s.onchange = () => {
          det.map[s.dataset.col] = s.value === '' ? undefined : Number(s.value);
        };
      });
      $('#fuGo', bg).disabled = false;
    };
    $('#fuF', bg).onchange = async (e) => {
      err('');
      const f = e.target.files[0];
      if (!f) return;
      fileName = f.name;
      try {
        rows = /\.csv$/i.test(f.name) ? parseCsv(await f.text()) : await readXlsx(f);
      } catch (x) {
        return err(x.message);
      }
      det = fuelDetect(rows);
      if (det.header < 0) err('لم أتعرف على صف العناوين — حدد الأعمدة يدوياً');
      drawMap();
    };
    $('#fuGo', bg).onclick = async () => {
      err('');
      const mo = $('#fuM', bg).value;
      if (!mo) return err('اختر الشهر');
      const invF = $('#fuInvF', bg).files[0];
      if (!invF) return err('فاتورة سيارة آب إلزامية — ارفع ملف الفاتورة (PDF أو صورة)');
      if (!/\.(pdf|png|jpe?g)$/i.test(invF.name)) return err('الفاتورة بصيغة PDF أو صورة');
      for (const [k, l, , req] of FUEL_COLS) if (req && det.map[k] === undefined) return err(`حدد عمود «${l}»`);
      if (months.some((x) => x.month === mo) && !(await askYesNo(`يوجد ملف لشهر ${fuelMonthName(mo)} — استبداله بالملف الجديد؟`))) return;
      const out = rows
        .slice(det.header + 1)
        .map((r) => Object.fromEntries(FUEL_COLS.map(([k]) => [k, det.map[k] === undefined ? '' : (r || [])[det.map[k]]])))
        .filter((r) => String(r.plate || '').trim() && !/اجمال|إجمال|الأجمال|total/i.test(String(r.plate)));
      const b = $('#fuGo', bg);
      b.disabled = true;
      b.textContent = 'جاري التوزيع...';
      try {
        await api('POST', '/api/fuel/import', { month: mo, fileName, rows: out, invoice: { total: $('#fuInv', bg).value } });
        /* الفاتورة ثم المرفقات الأخرى (إن فشل رفع أحدها يبقى التوزيع ويُكمل الرفع من صفحة الشهر) */
        b.textContent = 'جاري رفع الفاتورة والمرفقات...';
        const fails = [];
        try {
          await fuelUpload(mo, invF, 'invoice');
        } catch (x) {
          fails.push(x.message);
        }
        for (const f of $('#fuOth', bg).files) {
          try {
            await fuelUpload(mo, f, 'other');
          } catch (x) {
            fails.push(x.message);
          }
        }
        bg.remove();
        if (fails.length) toast(`تم التوزيع، لكن: ${fails.join(' — ')}`, true);
        else toast('تم توزيع الملف ورفع الفاتورة والمرفقات');
        done(mo);
      } catch (x) {
        err(x.message);
        b.disabled = false;
        b.textContent = 'توزيع على المركبات';
      }
    };
  }
  /* محتوى fuelImport (HTML) */
  function renderFuelImport(bg, defM) {
    bg.innerHTML = `<div class="modal fu-imp" role="dialog" aria-modal="true" aria-label="رفع ملف المحروقات"><h3 style="margin-top:0">⛽ رفع ملف استهلاك سيارة آب</h3>
      <div class="grid2"><div class="field"><label>الشهر</label><input class="in" type="month" id="fuM" value="${defM}"></div>
      <div class="field"><label>إجمالي فاتورة سيارة شامل الضريبة (للمطابقة — اختياري)</label><input class="in" id="fuInv" inputmode="decimal" dir="ltr" placeholder="205577.74"></div></div>
      <div class="field"><label>تقرير «معدل الاستهلاك للمركبة» من الشركة المتعاقدة (Excel) *</label><input class="in" type="file" id="fuF" accept=".xlsx,.csv"><div class="hint">ارفعه كما ينزل بدون تعديل (عربي أو إنجليزي). الأعمدة: الرقم التسلسلي، الفرع، لوحة المركبة، رقم المركبة الداخلي، رقم الهيكل، نوع الوقود، الاستهلاك بالليتر، التكلفة — الربط من «لوحة المركبة» فقط، ويتجاهل النظام رقم المركبة الداخلي ورقم الهيكل. <a href="#" id="fuTpl">⬇ النموذج</a></div></div>
      <div class="grid2"><div class="field"><label>فاتورة سيارة آب للشهر * <small class="muted">(PDF أو صورة)</small></label><input class="in" type="file" id="fuInvF" accept=".pdf,.png,.jpg,.jpeg"></div>
      <div class="field"><label>مرفقات أخرى <small class="muted">(اختياري)</small></label><input class="in" type="file" id="fuOth" multiple accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.zip,.rar"></div></div>
      <div id="fuMap"></div><div class="merr"></div>
      <div class="row" style="margin-top:12px"><button class="btn primary" id="fuGo" disabled>توزيع على المركبات</button><button class="btn ghost" data-x>إلغاء</button></div></div>`;
  }

  async function viewFuel(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/fuel');
    const base = await api('GET', '/api/fuel');
    const mo = query.m && base.list.some((x) => x.month === query.m) ? query.m : (base.list[0] || {}).month;
    const go = (m, extra = '') => {
      location.hash = `#/fuel?m=${m}${extra}`;
    };
    const head0 = head(
      'المحروقات',
      base.myBranch ? `استهلاك مركبات فرع ${base.myBranch} من سيارة آب` : 'توزيع فاتورة سيارة آب الشهرية على مركبات الأسطول وفروعها',
    );
    const upBtn = base.editor
      ? '<span class="row fu-upb"><button class="btn" id="fuTplB">⬇ قالب Excel</button><button class="btn primary" id="fuUp">⬆ رفع بيان الشهر</button></span>'
      : '';
    if (!mo) {
      main.innerHTML = `${head0}<div class="card empty-state"><div style="font-size:42px">⛽</div><p>لم ترفع أي ملف محروقات بعد.</p>${upBtn}</div>`;
      wireFuel3(base, go);
      return;
    }
    const x = await api('GET', `/api/fuel/${mo}`);
    const tab = ['branches', 'lines', 'link', 'tank', 'flags'].includes(query.t) ? query.t : 'branches';
    const fmt = (n) => (SF.fmtNum ? SF.fmtNum(Math.round(n * 100) / 100) : String(n));
    const needLink = x.lines.filter((l) => l.kind !== 'tank' && (!l.branch || ['file', 'digits'].includes(l.src)));
    const tanks = x.lines.filter((l) => l.kind === 'tank');
    const flagged = x.lines.filter((l) => l.flags.length);
    const inv = Number(x.invoice.total) || 0,
      diff = inv ? Math.round(((x.all || x.totals).amount - inv) * 100) / 100 : null;
    const pct = (a, b) => (b ? `${a >= b ? '▲' : '▼'} ${Math.abs(Math.round((a / b - 1) * 100))}%` : '—');
    viewFuelPart2(base, diff, flagged, fmt, head0, inv, main, mo, needLink, tab, tanks, upBtn, x);
    const body = $('#fuBody');
    const lineRow = (
      l,
      actions,
    ) => `<tr${l.flags.length ? ' class="fu-flag"' : ''}><td>${l.i + 1}</td><td dir="auto"><b>${esc(l.plate)}</b>${l.vehiclePlate && l.vehiclePlate !== l.plate ? `<br><small class="muted">الأسطول: ${esc(l.vehiclePlate)}</small>` : ''}</td>
      <td>${l.kind === 'tank' ? `<b>⛽ ${esc(tankName(l))}</b><br><small class="muted">وقود غير مركبات</small>` : esc([l.brand, l.model, l.year].filter(Boolean).join(' '))}</td><td>${esc(l.user)}</td><td>${l.kind === 'tank' && (l.alloc || []).length ? l.alloc.map((a) => `<div class="fu-al">${esc(a.branch)}: <b>${fmt(a.liters)}</b> لتر <small class="muted">${esc(a.purpose)}</small></div>`).join('') : esc(l.branch || '—')}${l.fileBranch && l.fileBranch !== l.branch ? `<br><small class="muted">الملف: ${esc(l.fileBranch)}</small>` : ''}</td>
      <td>${esc(l.fuel)}</td><td class="num">${fmt(l.liters)}</td><td class="num">${fmt(l.amount)}</td><td><span class="chip ${fuelSrc[l.src] ? fuelSrc[l.src][1] : ''}">${fuelSrc[l.src] ? fuelSrc[l.src][0] : esc(l.src)}</span>${l.flags.map((f) => `<div class="fu-fl">⚠ ${esc(f)}</div>`).join('')}</td>${actions ? `<td>${actions(l)}</td>` : ''}</tr>`;
    const TH = (extra) =>
      `<thead><tr><th>#</th><th>اللوحة</th><th>المركبة</th><th>المستخدم</th><th>الفرع</th><th>الوقود</th><th>لتر</th><th>المبلغ</th><th>الربط</th>${extra ? `<th>${extra}</th>` : ''}</tr></thead>`;
    if (tab === 'branches') {
      const tot = x.totals;
      body.innerHTML = `<div class="row" style="gap:8px;margin-bottom:10px;justify-content:flex-end"><button class="btn" id="fuStP">${icon('printer')} بيان إجمالي (طباعة / PDF)</button><button class="btn" id="fuStX">${icon('download')} بيان إجمالي Excel</button></div><div class="card tbl-wrap"><table class="tbl fu-br"><thead><tr><th>#</th><th>الفرع</th><th>المركبات</th><th>الاستهلاك باللتر</th><th>المبلغ شامل الضريبة</th><th>${x.prevMonth ? `مقارنة بـ${esc(fuelMonthName(x.prevMonth))}` : 'الشهر السابق'}</th><th>النسبة من الإجمالي</th></tr></thead><tbody>
        ${fuelHtml2(fmt, mo, pct, tot, x)}
        <tr class="fu-total"><td></td><td>الإجمالي</td><td>${tot.count}</td><td class="num">${fmt(tot.liters)}</td><td class="num">${fmt(tot.amount)}</td><td></td><td></td></tr></tbody></table></div>`;
      /* البيان الإجمالي الشهري: الفرع، الاستهلاك باللتر، المبلغ شامل الضريبة، والإجمالي */
      const stTitle = `بيان إجمالي بتحميل الوقود على فروع الشركة ${x.month}${base.myBranch ? ` — ${base.myBranch}` : ''}`;
      const stRows = x.branches.slice().sort((a, b) => !a.branch - !b.branch || String(a.branch).localeCompare(String(b.branch), 'ar'));
      const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
      wireFuel5(r2, stRows, stTitle, tot, x);
    } else if (tab === 'lines' || tab === 'flags') {
      const fb = query.b || '';
      let q = '';
      const draw = () => {
        const list = (tab === 'flags' ? flagged : x.lines).filter(
          (l) => (!fb || fuelInBr(l, fb)) && (!q || `${l.plate} ${l.vehiclePlate} ${l.user} ${l.brand} ${l.model}`.includes(q)),
        );
        $('#fuT').innerHTML = list.length
          ? list.map((l) => lineRow(l)).join('')
          : '<tr><td colspan="9" class="empty">لا توجد سطور</td></tr>';
        $('#fuN').textContent =
          `${list.length} سطر — ${fmt(list.reduce((s, l) => s + l.liters, 0))} لتر — ${fmt(list.reduce((s, l) => s + l.amount, 0))} ريال`;
      };
      body.innerHTML = `<div class="row fu-filter">${base.myBranch ? '' : `<select class="in" id="fuB"><option value="">كل الفروع</option>${x.branches.map((b) => `<option value="${esc(b.branch)}"${b.branch === fb ? ' selected' : ''}>${esc(b.branch || 'بدون فرع')}</option>`).join('')}</select>`}
        <input class="in" id="fuQ" placeholder="بحث باللوحة أو المستخدم أو المركبة"><span class="muted" id="fuN"></span></div>
        <div class="card tbl-wrap"><table class="tbl fu-lines">${TH()}<tbody id="fuT"></tbody></table></div>`;
      if ($('#fuB')) $('#fuB').onchange = (e) => go(mo, `&t=${tab}${e.target.value ? `&b=${encodeURIComponent(e.target.value)}` : ''}`);
      $('#fuQ').oninput = (e) => {
        q = e.target.value.trim();
        draw();
      };
      draw();
    } else if (tab === 'tank') {
      viewFuelPart3(base, body, fmt, mo, query, tanks, x);
    } else if (tab === 'link') {
      viewFuelPart4(TH, base, body, lineRow, mo, needLink, query);
    }
    return viewFuelPart(base, go, inv, main, mo, query, x);
  }
  /* جزء من viewFuel: const vOpts = `<datalist id="fuVeh">${base.vehicle… */
  function viewFuelPart4(TH, base, body, lineRow, mo, needLink, query) {
    const vOpts = `<datalist id="fuVeh">${base.vehicles.map((v) => `<option value="${esc(v.label)}">`).join('')}</datalist>`;
    const brOpts = `<option value="">— فرع بدون مركبة —</option>${base.branches.map((b) => `<option>${esc(b)}</option>`).join('')}`;
    body.innerHTML = `<div class="hint" style="margin-bottom:8px">السطور التي لم يطابقها النظام بمركبة في الأسطول (أو طابقها بالأرقام فقط / بفرع الملف). اختر المركبة أو الفرع — يحفظ النظام الربط ويطبقه تلقائياً في الأشهر القادمة.</div>${vOpts}
        ${needLink.length ? `<div class="card tbl-wrap"><table class="tbl fu-lines">${TH('ربط')}<tbody>${needLink.map((l) => lineRow(l, () => `<div class="fu-link" data-i="${l.i}"><input type="checkbox" class="fu-pick" data-pick="${l.i}" title="تحديد للربط الجماعي"><input class="in" list="fuVeh" placeholder="ابحث عن المركبة..." data-v><select class="in" data-br>${brOpts}</select><button class="btn sm primary" data-save>حفظ</button></div>`)).join('')}</tbody></table></div>` : '<div class="card empty">✔ كل السطور مربوطة بمركبات الأسطول</div>'}`;
    /* الربط الجماعي: تحديد سطور (أو الكل بعد البحث) ثم فرع واحد لها */
    const tb = $('.fu-lines', body);
    if (tb && needLink.length) {
      tb.closest('.card').insertAdjacentHTML(
        'beforebegin',
        `<div class="card fu-bulk"><b>${icon('listChecks')} ربط جماعي</b><input class="in" id="fuBq" placeholder="فلترة باللوحة أو المستخدم..."><label class="check"><input type="checkbox" id="fuBall"> تحديد الظاهر</label><span class="muted" id="fuBn">0 محدد</span><input class="in" id="fuBbr" list="fuBrL" placeholder="الفرع / الجهة (مثال: الإدارة، ورشة جدة)"><datalist id="fuBrL">${base.branches.map((b) => `<option value="${esc(b)}">`).join('')}</datalist><button class="btn primary sm" id="fuBgo">ربط المحدد بالفرع</button></div>`,
      );
      const rowsOf = () => $$('tbody tr', tb).filter((r) => $('.fu-pick', r));
      const cnt = () => {
        $('#fuBn').textContent = `${$$('.fu-pick:checked', tb).length} محدد`;
      };
      $$('.fu-pick', tb).forEach((c) => {
        c.onchange = cnt;
      });
      $('#fuBq').oninput = (e) => {
        const v = e.target.value.trim().replace(/\s+/g, '').toLowerCase();
        rowsOf().forEach((r) => {
          r.hidden = !!v && !r.textContent.replace(/\s+/g, '').toLowerCase().includes(v);
        });
      };
      $('#fuBall').onchange = (e) => {
        rowsOf().forEach((r) => {
          if (!r.hidden) $('.fu-pick', r).checked = e.target.checked;
        });
        cnt();
      };
      $('#fuBgo').onclick = async () => {
        const is = $$('.fu-pick:checked', tb).map((c) => Number(c.dataset.pick)),
          br = $('#fuBbr').value.trim();
        if (!is.length) return toast('حدد سطراً واحداً على الأقل', true);
        if (!br) return toast('اختر الفرع', true);
        try {
          await api('PUT', `/api/fuel/${mo}/lines`, { is, branch: br });
          toast(`تم ربط ${is.length} سطر بفرع ${br} — وسنطبق الربط تلقائياً في الأشهر التالية`);
          viewFuel(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    }
    $$('.fu-link', body).forEach((w) => {
      $('[data-save]', w).onclick = async () => {
        const label = $('[data-v]', w).value.trim(),
          v = base.vehicles.find((y) => y.label === label),
          br = $('[data-br]', w).value;
        if (label && !v) return toast('اختر المركبة من القائمة', true);
        if (!v && !br) return toast('اختر مركبة أو فرعاً', true);
        try {
          await api('PUT', `/api/fuel/${mo}/line`, { i: Number(w.dataset.i), vehicleId: v ? v.id : '', branch: v ? '' : br });
          toast('تم الربط');
          viewFuel(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    });
  }
  /* جزء من viewFuel: const ed = base.editor && x.status !== 'approved';… */
  function viewFuelPart3(base, body, fmt, mo, query, tanks, x) {
    const ed = base.editor && x.status !== 'approved';
    const P = x.tankPurposes || ['أخرى'];
    const brSel = (v) =>
      `<select class="in" data-k="branch"><option value="">— الفرع / الموقع —</option>${base.branches
        .concat(v && !base.branches.includes(v) ? [v] : [])
        .map((b) => `<option${b === v ? ' selected' : ''}>${esc(b)}</option>`)
        .join('')}</select>`;
    const pSel = (v) =>
      `<select class="in" data-k="purpose">${P.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    const part = (a) =>
      `<div class="tk-row">${brSel(a.branch)}${pSel(a.purpose)}<input class="in" data-k="liters" inputmode="decimal" dir="ltr" value="${esc(String(a.liters || ''))}" placeholder="لتر"><input class="in" data-k="note" value="${esc(a.note || '')}" placeholder="ملاحظة (الموقع / المعدة)" maxlength="120"><button type="button" class="btn sm ghost" data-rm title="حذف">✕</button></div>`;
    body.innerHTML = `<div class="hint" style="margin-bottom:8px">تسحب بالتانك كارت بنزيناً أو جازاً (غسيل وتنظيف في الورش، أو نقل لمواقع المعدات). وزّع لتراته على الفرع / الموقع والغرض — يحسب النظام المبلغ لكل جزء بالتناسب، ويظهر نصيب كل فرع في ملخص الفروع.</div>
        ${fuelHtml(P, base, ed, fmt, part, tanks)}`;
    $$('.tk-card', body).forEach((c) => {
      const l = x.lines[Number(c.dataset.i)];
      const rows = () => $$('.tk-row', c);
      const rem = () => {
        const sum = rows().reduce((s2, r) => s2 + (Number($('[data-k="liters"]', r).value) || 0), 0),
          left = Math.round((l.liters - sum) * 100) / 100;
        const el = $('.tk-rem', c);
        if (el) {
          el.textContent = left ? `المتبقي ${fmt(left)} لتر` : '✔ موزّع بالكامل';
          el.className = `tk-rem ${left ? 'bad' : 'ok'}`;
        }
      };
      const bind = () => {
        rows().forEach((r) => {
          $('[data-rm]', r).onclick = () => {
            r.remove();
            rem();
          };
          $('[data-k="liters"]', r).oninput = rem;
        });
        rem();
      };
      if ($('[data-tkbr]', c))
        $('[data-tkbr]', c).onchange = async (e) => {
          if (!e.target.value) return;
          try {
            await api('PUT', `/api/fuel/${mo}/line`, { i: l.i, branch: e.target.value });
            toast(`تم: ${tankName({ branch: e.target.value })}`);
            viewFuel(query);
          } catch (er) {
            toast(er.message, true);
          }
        };
      if ($('[data-add]', c)) {
        $('[data-add]', c).onclick = () => {
          const sum = rows().reduce((s2, r) => s2 + (Number($('[data-k="liters"]', r).value) || 0), 0);
          $('.tk-rows', c).insertAdjacentHTML(
            'beforeend',
            part({ branch: '', purpose: P[0], liters: Math.max(0, Math.round((l.liters - sum) * 100) / 100) || '' }),
          );
          bind();
        };
        $('[data-save]', c).onclick = async () => {
          const alloc = rows().map((r) => Object.fromEntries($$('[data-k]', r).map((el) => [el.dataset.k, el.value.trim()])));
          try {
            await api('PUT', `/api/fuel/${mo}/tank`, { i: l.i, alloc });
            toast('تم حفظ توزيع التانك');
            viewFuel(query);
          } catch (e) {
            toast(e.message, true);
          }
        };
        bind();
      }
    });
  }
  /* أحداث viewFuel: #fuStX، #fuStP */
  function wireFuel5(r2, stRows, stTitle, tot, x) {
    $('#fuStX').onclick = () =>
      downloadXlsx(`بيان-المحروقات-${x.month}.xlsx`, [
        {
          name: 'البيان الإجمالي',
          rows: [
            [stTitle],
            ['م', 'الفرع', 'الاستهلاك باللتر', 'إجمالي المبلغ شامل الضريبة'],
            ...stRows.map((b, i) => [i + 1, b.branch || 'بدون فرع', r2(b.liters), r2(b.amount)]),
            ['', 'الإجمالي', r2(tot.liters), r2(tot.amount)],
          ],
        },
      ]);
    $('#fuStP').onclick = () =>
      printDocs(
        stTitle,
        {},
        `<div style="direction:rtl"><table style="width:100%;border-collapse:collapse;font-size:12pt;border:2px solid #1d4ed8">
        <tr><th colspan="4" style="background:#fde68a;padding:8px;font-size:15pt">${esc(stTitle)}</th></tr>
        <tr>${['م', 'الفرع', 'الاستهلاك باللتر', 'إجمالي المبلغ شامل الضريبة'].map((h) => `<th style="background:#1f6fc5;color:#fff;padding:7px;border:1px solid #1e3a8a">${h}</th>`).join('')}</tr>
        ${stRows.map((b, i) => `<tr><td style="background:#fcd9c4;text-align:center;border:1px solid #333;padding:5px">${i + 1}</td><td style="text-align:center;border:1px solid #333;padding:5px">${esc(b.branch || 'بدون فرع')}</td><td style="background:#ffc000;text-align:center;font-weight:700;border:1px solid #333;padding:5px">${r2(b.liters)}</td><td style="background:#ffc000;text-align:center;font-weight:700;border:1px solid #333;padding:5px">${r2(b.amount)}</td></tr>`).join('')}
        <tr><td colspan="2" style="background:#fde68a;text-align:center;font-weight:800;font-size:14pt;padding:8px;border:1px solid #333">الإجمالي</td><td style="background:#1f6fc5;color:#fff;text-align:center;font-weight:800;font-size:14pt;border:1px solid #333">${r2(tot.liters)}</td><td style="background:#1f6fc5;color:#fff;text-align:center;font-weight:800;font-size:14pt;border:1px solid #333">${r2(tot.amount)}</td></tr></table>
        ${x.unassigned ? `<p style="color:#b91c1c;margin-top:8px">ملاحظة: ${x.unassigned} سطر بدون فرع — اربطها من تبويب «يحتاج مراجعة / ربط» قبل اعتماد البيان.</p>` : ''}</div>`,
      );
  }
  /* جزء من viewFuel: x.branches… */
  function fuelHtml2(fmt, mo, pct, tot, x) {
    return x.branches
      .map(
        (
          b,
          i,
        ) => `<tr${b.branch ? '' : ' class="fu-flag"'}><td>${i + 1}</td><td><a href="#/fuel?m=${mo}&t=lines&b=${encodeURIComponent(b.branch)}"><b>${esc(b.branch || 'بدون فرع')}</b></a></td><td>${b.count}${b.tankLiters ? `<br><small class="muted">+ تانك ${fmt(b.tankLiters)} لتر</small>` : ''}</td><td class="num">${fmt(b.liters)}</td><td class="num"><b>${fmt(b.amount)}</b></td>
          <td class="num">${b.prevAmount ? `${fmt(b.prevAmount)} <small class="${b.amount > b.prevAmount ? 'bad' : 'ok'}">${pct(b.amount, b.prevAmount)}</small>` : '—'}</td><td><div class="fu-bar"><i style="width:${tot.amount ? Math.round((b.amount / tot.amount) * 100) : 0}%"></i><small>${tot.amount ? Math.round((b.amount / tot.amount) * 1000) / 10 : 0}%</small></div></td></tr>`,
      )
      .join('');
  }
  /* جزء من viewFuel: tanks… */
  function fuelHtml(P, base, ed, fmt, part, tanks) {
    return tanks
      .map((l) => {
        const al = (l.alloc || []).length ? l.alloc : [{ branch: l.branch, purpose: P[0], liters: l.liters, note: '' }];
        return `<div class="card tk-card" data-i="${l.i}"><div class="tk-head"><b>⛽ ${esc(tankName(l))}</b><small class="muted" dir="ltr">${esc(l.plate)}</small><span>${esc(l.fuel)}</span><span><b>${fmt(l.liters)}</b> لتر</span><span><b>${fmt(l.amount)}</b> ريال</span>${l.fileBranch ? `<small class="muted">فرع الملف: ${esc(l.fileBranch)}</small>` : ''}${(l.alloc || []).length ? '<span class="chip ok">موزّع</span>' : '<span class="chip warn">غير مقسّم — يحسبه النظام كله على فرعه</span>'}</div>
            ${
              ed
                ? `<div class="tk-br"><label>فرع التانك <select class="in" data-tkbr><option value="">— اختر الفرع —</option>${base.branches.map((b) => `<option${b === l.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label><small class="muted">يحفظه النظام للأشهر القادمة</small></div>
              <div class="tk-sub">تقسيم لترات التانك حسب الغرض (ويمكن تحويل جزء لفرع / موقع آخر):</div>
              <div class="tk-rows">${al.map(part).join('')}</div><div class="row tk-acts"><button type="button" class="btn sm" data-add>＋ جزء</button><span class="tk-rem muted"></span><button type="button" class="btn sm primary" data-save>حفظ التوزيع</button></div>`
                : `<div>${(l.alloc || []).map((a) => `<div class="fu-al">${esc(a.branch)} — ${esc(a.purpose)}: <b>${fmt(a.liters)}</b> لتر${a.note ? ` <small class="muted">(${esc(a.note)})</small>` : ''}</div>`).join('') || `<div class="muted">${esc(l.branch || 'بدون فرع')}</div>`}</div>`
            }</div>`;
      })
      .join('');
  }
  /* جزء من viewFuel: const kpis = [… */
  function viewFuelPart2(base, diff, flagged, fmt, head0, inv, main, mo, needLink, tab, tanks, upBtn, x) {
    const kpis = [
      [fmt(x.totals.liters), 'لتر'],
      [fmt(x.totals.amount), 'ريال شامل الضريبة'],
      [x.totals.count, 'سطر / مركبة'],
    ];
    if (!base.myBranch) kpis.push([x.branches.filter((b) => b.branch).length, 'فرع']);
    renderViewFuel(base, diff, flagged, fmt, head0, inv, kpis, main, mo, needLink, tab, tanks, upBtn, x);
  }
  /* جزء من viewFuel: wireFuel(base, go, mo, x);… */
  function viewFuelPart(base, go, inv, main, mo, query, x) {
    wireFuel(base, go, mo, x);
    const addFiles = async (files, kind) => {
      for (const f of files) {
        try {
          await fuelUpload(mo, f, kind);
        } catch (e) {
          toast(e.message, true);
        }
      }
      viewFuel(query);
    };
    wireFuel4(addFiles);
    $$('[data-fdel]', main).forEach((b) => {
      b.onclick = async () => {
        if (!(await askYesNo('حذف المرفق؟'))) return;
        try {
          await api('DELETE', `/api/fuel/${mo}/files/${b.dataset.fdel}`);
          viewFuel(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    });
    return wireFuel2(inv, mo, query);
  }
  /* محتوى viewFuel (HTML) */
  function renderViewFuel(base, diff, flagged, fmt, head0, inv, kpis, main, mo, needLink, tab, tanks, upBtn, x) {
    main.innerHTML = `${head0}
      <div class="fu-top"><div class="gtabs fu-months">${base.list.map((m) => `<a class="gtab${m.month === mo ? ' on' : ''}" href="#/fuel?m=${m.month}">${esc(fuelMonthName(m.month))}${m.status === 'approved' ? ' ✔' : ''}</a>`).join('')}</div>${upBtn}</div>
      <div class="card fu-head"><div class="fu-title"><h3>${esc(fuelMonthName(x.month))}</h3><span class="chip ${x.status === 'approved' ? 'ok' : 'warn'}">${x.status === 'approved' ? `معتمد — ${esc(x.approvedByName)}` : 'مسودة — بانتظار الاعتماد'}</span></div>
        <div class="fu-kpis">${kpis.map(([v, l]) => `<div><b>${esc(String(v))}</b><small>${l}</small></div>`).join('')}</div>
        ${
          base.editor
            ? `<div class="fu-inv">${inv ? `فاتورة سيارة: <b>${fmt(inv)}</b> ريال — ${diff === 0 ? '<span class="ok">مطابق ✔</span>' : `<span class="${Math.abs(diff) > 1 ? 'bad' : 'warn'}">الفرق ${fmt(diff)} ريال</span>${Math.abs(inv - (x.all || x.totals).liters) < 1 ? ' <span class="bad">— المبلغ المدخل يساوي إجمالي اللترات: عدّله بإجمالي الفاتورة بالريال من ✎</span>' : ''}`}` : '<span class="muted">لم تدخل إجمالي الفاتورة للمطابقة</span>'} <button class="btn sm ghost" id="fuInvE">✎</button>
          · <span class="muted">${esc(x.fileName || '')} — رفعه ${esc(x.uploadedByName)} ${esc(fmtDate(x.uploadedAt))}</span></div>`
            : ''
        }
        ${
          base.editor
            ? `<div class="fu-files">${x.hasInvoice ? '' : '<div class="err fu-noinv">⚠ فاتورة سيارة آب لهذا الشهر لم ترفعها بعد — الفاتورة إلزامية قبل الاعتماد</div>'}
          <div class="fu-fl-list">${
            x.files
              .filter((f) => f.kind !== 'old-invoice')
              .map(
                (f) =>
                  `<span class="fu-file${f.kind === 'invoice' ? ' inv' : ''}"><a href="/api/fuel/${mo}/files/${f.id}" target="_blank" rel="noopener">${f.kind === 'invoice' ? '🧾 الفاتورة: ' : '📎 '}${esc(f.name)}</a><small>${esc(f.byName)}</small>${x.status !== 'approved' ? `<button type="button" class="fu-fdel" data-fdel="${f.id}" title="حذف" aria-label="حذف ${esc(f.name)}">✕</button>` : ''}</span>`,
              )
              .join('') || '<span class="muted">لا توجد مرفقات</span>'
          }</div>
          ${x.status !== 'approved' ? `<div class="row fu-fadd"><label class="btn sm${x.hasInvoice ? '' : ' primary'}">🧾 ${x.hasInvoice ? 'استبدال الفاتورة' : 'رفع الفاتورة'}<input type="file" id="fuAddInv" accept=".pdf,.png,.jpg,.jpeg" hidden></label><label class="btn sm">📎 إضافة مرفق<input type="file" id="fuAddOth" multiple hidden></label></div>` : ''}</div>`
            : ''
        }
        <div class="row fu-acts"><button class="btn sm" id="fuX">⬇ تصدير Excel</button>
          ${base.editor && x.status !== 'approved' ? `<button class="btn sm primary" id="fuOk"${x.unassigned ? ' disabled title="اربط السطور بدون فرع أولاً"' : !x.hasInvoice ? ' disabled title="ارفع فاتورة سيارة آب أولاً"' : ''}>✔ اعتماد التوزيع وإشعار الفروع</button><button class="btn sm ghost" id="fuDel">🗑 حذف المسودة</button>` : ''}
          ${base.editor && x.status === 'approved' && state.user.role === 'admin' ? '<button class="btn sm ghost" id="fuRe">↺ إعادة فتح</button>' : ''}</div></div>
      <div class="gtabs">${[
        ['branches', 'حسب الفرع', x.branches.length],
        ['lines', 'التفصيلي', x.lines.length],
        ...(base.editor ? [['link', 'يحتاج مراجعة / ربط', needLink.length]] : []),
        ...(tanks.length ? [['tank', '⛽ تانكات الفروع', tanks.length]] : []),
        ['flags', 'تنبيهات', flagged.length],
      ]
        .map(([k, l, n]) => `<a class="gtab${k === tab ? ' on' : ''}" href="#/fuel?m=${mo}&t=${k}">${l} <small>${n}</small></a>`)
        .join('')}</div>
      <div id="fuBody"></div>`;
  }
  /* أحداث viewFuel: #fuAddInv، #fuAddOth */
  function wireFuel4(addFiles) {
    if ($('#fuAddInv'))
      $('#fuAddInv').onchange = (e) => {
        if (e.target.files[0]) addFiles([e.target.files[0]], 'invoice');
      };
    if ($('#fuAddOth')) $('#fuAddOth').onchange = (e) => addFiles([...e.target.files], 'other');
  }
  /* أحداث viewFuel: #fuUp، #fuTplB */
  function wireFuel3(base, go) {
    if ($('#fuUp')) $('#fuUp').onclick = () => fuelImport((m) => go(m), base.list, base);
    if ($('#fuTplB'))
      $('#fuTplB').onclick = () => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
        fuelTemplate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, base.vehicles, base.branches);
      };
  }
  /* أحداث viewFuel: #fuInvE، #fuOk، #fuRe، #fuDel */
  function wireFuel2(inv, mo, query) {
    if ($('#fuInvE'))
      $('#fuInvE').onclick = async () => {
        const v = prompt('إجمالي فاتورة سيارة آب شامل الضريبة:', inv || '');
        if (v === null) return;
        try {
          await api('PUT', `/api/fuel/${mo}/invoice`, { total: v });
          viewFuel(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    if ($('#fuOk'))
      $('#fuOk').onclick = async () => {
        if (!(await askYesNo(`اعتماد توزيع محروقات ${fuelMonthName(mo)} وإشعار محاسبي الفروع باستهلاكهم؟`))) return;
        try {
          await api('POST', `/api/fuel/${mo}/approve`);
          toast('تم الاعتماد وإشعار الفروع');
          viewFuel(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    if ($('#fuRe'))
      $('#fuRe').onclick = async () => {
        if (!(await askYesNo('إعادة فتح الشهر للتعديل؟'))) return;
        try {
          await api('POST', `/api/fuel/${mo}/reopen`);
          viewFuel(query);
        } catch (e) {
          toast(e.message, true);
        }
      };
    if ($('#fuDel'))
      $('#fuDel').onclick = async () => {
        if (!(await askYesNo(`حذف مسودة ${fuelMonthName(mo)}؟`))) return;
        try {
          await api('DELETE', `/api/fuel/${mo}`);
          location.hash = '#/fuel';
        } catch (e) {
          toast(e.message, true);
        }
      };
  }
  /* أحداث viewFuel: #fuUp، #fuTplB، #fuX */
  function wireFuel(base, go, mo, x) {
    if ($('#fuUp')) $('#fuUp').onclick = () => fuelImport((m) => go(m), base.list, base);
    if ($('#fuTplB')) $('#fuTplB').onclick = () => fuelTemplate(mo, base.vehicles, base.branches);
    $('#fuX').onclick = () => {
      const sum = [
        ['م', 'الفرع', 'عدد المركبات', 'الاستهلاك باللتر', 'إجمالي المبلغ شامل الضريبة'],
        ...x.branches.map((b, i) => [i + 1, b.branch || 'بدون فرع', b.count, b.liters, b.amount]),
        ['', 'الإجمالي', x.totals.count, x.totals.liters, x.totals.amount],
      ];
      const det = [
        [
          'م',
          'رقم اللوحة',
          'لوحة الأسطول',
          'الماركة',
          'الطراز',
          'الموديل',
          'اللون',
          'المستخدم',
          'الفرع',
          'نوع الوقود',
          'الاستهلاك باللتر',
          'إجمالي المبلغ شامل الضريبة',
          'الربط',
          'تنبيهات',
        ],
        ...x.lines.map((l) => [
          l.i + 1,
          l.plate,
          l.kind === 'tank' ? tankName(l) : l.vehiclePlate,
          l.brand,
          l.model,
          l.year,
          l.color,
          l.user,
          l.kind === 'tank' && (l.alloc || []).length
            ? l.alloc.map((a) => `${a.branch}: ${a.liters} لتر (${a.purpose}${a.note ? ` — ${a.note}` : ''})`).join(' | ')
            : l.branch,
          l.fuel,
          l.liters,
          l.amount,
          (fuelSrc[l.src] || [l.src])[0],
          l.flags.join(' — '),
        ]),
        ['', '', '', '', '', '', '', '', '', 'الإجمالي', x.totals.liters, x.totals.amount, '', ''],
      ];
      downloadXlsx(`المحروقات-${x.month}${base.myBranch ? `-${base.myBranch}` : ''}.xlsx`, [
        { name: 'التوزيع حسب الفرع', rows: sum },
        { name: 'التفصيلي', rows: det },
      ]);
    };
  }

  return { viewFuel };
};
