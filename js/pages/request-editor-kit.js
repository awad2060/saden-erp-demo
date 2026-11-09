'use strict';
/* أدوات محرر الطلب: توقيع الموظف، ورفع بيان الجُمع / الإعاشات من Excel (للفرع ولموظف)، واختيار المستخدمين */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['request-editor'] = function (S, ctx) {
  const { $, SF, api, collect, downloadXlsx, esc, money, readXlsx, state, tableRowHtml, toast } = S;
  function empSignWire(root) {
    const box = root.querySelector('.es-box');
    if (!box) return;
    const fileBox = box.querySelector('.es-file'),
      fileIn = box.querySelector('[data-esfile]');
    box.querySelectorAll('[name="esMode"]').forEach((r) => {
      r.onchange = () => {
        fileBox.hidden = !(r.value === 'manual' && r.checked);
        box.querySelectorAll('.es-opt').forEach((o) => o.classList.toggle('on', o.querySelector('input').checked));
      };
    });
    box.esValue = () => {
      const c = box.querySelector('[name="esMode"]:checked'),
        m = c ? c.value : '';
      if (m === 'saved') return { mode: 'saved' };
      if (m === 'manual') {
        if (!fileIn.files[0]) throw new Error(`ارفع ${SF.ADV_SIGNED}`);
        return { mode: 'manual' };
      }
      return undefined;
    };
    /* ملف طلب السلفة الموقّع (يُرفع بعد إنشاء الطلب بنفس اسم المرفق الإلزامي) */
    box.esFile = () => {
      const c = box.querySelector('[name="esMode"]:checked');
      return c && c.value === 'manual' ? fileIn.files[0] || null : null;
    };
  }

  /* تحديد التلفيات على رسمة المركبة: الضغط على الرسمة يضيف علامة برقم تلقائي وسطراً لملاحظتها،
   * والضغط على العلامة يحذفها (وتُعاد الأرقام بالترتيب) */
  /* بيان الجُمع / الإعاشات: تحميل قالب إكسيل (المجمع: بموظفي الفرع، الفردي: بأيام الشهر)، ورفعه بعد تعبئة المبالغ فيُملأ الجدول */
  function setupSheetXlsx(root, form) {
    if (!form.xlsxSheet) return;
    const box = $('[data-table="rows"]', root),
      f = form.fields.find((x) => x.key === 'rows');
    if (!box || !f) return;
    const single = form.xlsxSheet === 'single';
    box.insertAdjacentHTML(
      'beforebegin',
      `<div class="card xs-bar"><b>📊 قالب الإكسيل</b>
      <button type="button" class="btn sm" id="xsTpl">⬇ ${single ? 'تحميل القالب بأيام الشهر' : 'تحميل القالب بموظفي الفرع'}</button>
      <label class="btn sm primary" style="cursor:pointer">📥 رفع ملف البيان<input type="file" accept=".xlsx" hidden id="xsFile"></label>
      <div class="hint" style="width:100%">${single ? 'اختر نوع البيان والشهر ثم حمّل القالب (فيه أيام الجُمع أو كل أيام الشهر للإعاشات)، واكتب المبلغ والتفاصيل أمام كل يوم، ثم ارفعه هنا — وتقبل النظام أيضاً قالب بيان الموظف الأصلي.' : 'حمّل القالب (فيه موظفو الفرع بأسمائهم ووظائفهم وأرقام هوياتهم)، واكتب المبلغ والتفاصيل أمام من يستحق، ثم ارفعه هنا — وتقبل النظام أيضاً قالب البيان المجمع الأصلي.'}</div></div>`,
    );
    return setupSheetXlsxPart(box, f, form, root, single);
  }
  /* جزء من setupSheetXlsx: if (single) return setupSingleSheetXlsx(root, form… */
  function setupSheetXlsxPart(box, f, form, root, single) {
    if (single) return setupSingleSheetXlsx(root, form, box, f);
    const nb = (b) =>
      String(b || '')
        .trim()
        .replace(/^فرع\s+/, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة$/, 'ه');
    $('#xsTpl', root).onclick = async () => {
      const d = collect(form, root),
        type = d.sheetType || 'جُمع',
        br = d.branch || '';
      if (!br) {
        toast('اختر الفرع أولاً', true);
        return;
      }
      const emps = ((await api('GET', '/api/emp-lookup').catch(() => ({ list: [] }))).list || []).filter(
        (e) => nb(e.branch) === nb(br) || { جيزان: 'جازان', جازان: 'جيزان' }[nb(br)] === nb(e.branch),
      );
      const word = type === 'إعاشات' ? 'الإعاشات' : 'الجُمع';
      downloadXlsx(
        `بيان ${type} مجمع - ${br} - ${d.month || ''} ${d.year || ''}.xlsx`,
        [
          ['شركة سادن المتخصصة للاستشارات الجيولوجية شركه مهنيه مختلطة'],
          [`فرع : ${br}`],
          [`بيان ${type} فرع / ${br} عن شهر ${d.month || '........'} ${d.year || ''}`],
          ['م', 'الاسم', 'الوظيفة', 'رقم الهوية / الإقامة', `مبلغ ${word}`, 'تفاصيل', 'ملاحظات'],
          ...emps.map((e, i) => [i + 1, e.nameAr, e.title || '', e.iqama || '', '', '', '']),
          [],
          ['', 'محاسب الفرع', '', '', '', 'إعتماد مدير الفرع'],
        ],
        `بيان ${type}`,
      );
      toast(`تم تحميل القالب (${emps.length} موظف)`);
    };
    $('#xsFile', root).onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      try {
        const rows = await readXlsx(file);
        const hi = rows.findIndex((r) => r.some((c) => /الاسم/.test(String(c))) && r.some((c) => /مبلغ/.test(String(c))));
        if (hi < 0) throw new Error('لم نجد صف العناوين (الاسم، المبلغ...) في الملف');
        const H = rows[hi].map((c) => String(c || '').trim());
        const col = (re) => H.findIndex((h) => re.test(h));
        const ix = {
          name: col(/الاسم/),
          job: col(/الوظيفة|المسمى/),
          iqama: col(/هوية|إقامة|اقامة/),
          amount: col(/مبلغ/),
          details: col(/تفاصيل/),
          notes: col(/ملاحظات/),
        };
        const num = (v) =>
          Number(
            String(v == null ? '' : v)
              .replace(/[٠-٩]/g, (x) => '٠١٢٣٤٥٦٧٨٩'.indexOf(x))
              .replace(/[^\d.]/g, ''),
          ) || 0;
        const out = [];
        for (const r of rows.slice(hi + 1)) {
          const g = (k) => (ix[k] >= 0 ? String(r[ix[k]] == null ? '' : r[ix[k]]).trim() : '');
          if (/إجمالي|الإجمالي/.test(r.join(' '))) break;
          const amount = num(g('amount'));
          if (!g('name') || !amount) continue;
          out.push({ name: g('name'), job: g('job'), iqama: g('iqama'), amount: String(amount), details: g('details'), notes: g('notes') });
        }
        if (!out.length) throw new Error('لا توجد صفوف فيها اسم ومبلغ في الملف');
        $('.trows', box).innerHTML = out.map((x) => tableRowHtml(f, x)).join('');
        root.dispatchEvent(new Event('input', { bubbles: true }));
        root.dispatchEvent(new Event('change', { bubbles: true }));
        const total = out.reduce((a, x) => a + Number(x.amount), 0);
        toast(`تم رفع البيان: ${out.length} موظف — الإجمالي ${money(total)} ريال`);
      } catch (err) {
        toast(err.message, true);
      }
      ev.target.value = '';
    };
  }

  /* بيان الموظف الفردي: القالب بأيام الشهر (أيام الجمعة للجُمع، وكل الأيام للإعاشات) */
  function setupSingleSheetXlsx(root, form, box, f) {
    const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const ymd = (y, m, dd) => `${y}-${String(m + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    $('#xsTpl', root).onclick = () => {
      const d = collect(form, root),
        type = d.sheetType || 'جُمع',
        mi = MONTHS.indexOf(d.month),
        y = Number(d.year) || new Date().getFullYear();
      if (mi < 0) {
        toast('اختر الشهر أولاً', true);
        return;
      }
      const word = type === 'إعاشات' ? 'الإعاشة' : 'الجمعة';
      const days = [];
      for (let dd = 1; dd <= new Date(y, mi + 1, 0).getDate(); dd++) {
        const wd = new Date(y, mi, dd).getDay();
        if (type === 'إعاشات' || wd === 5) days.push([ymd(y, mi, dd), DAYS[wd]]);
      }
      downloadXlsx(
        `بيان ${type} موظف - ${d.name || ''} - ${d.month} ${y}.xlsx`,
        [
          ['شركة سادن المتخصصة للاستشارات الجيولوجية شركه مهنيه مختلطة'],
          [`فرع : ${d.branch || '................'}`],
          [`بيان ${type} الموظف / ${d.name || '................'}${d.iqama ? ` (${d.iqama})` : ''} عن شهر ${d.month} ${y}`],
          ['م', 'التاريخ', 'اليوم', `مبلغ ${word}`, `تفاصيل ${word}`, 'ملاحظات'],
          ...days.map(([dt, wd], i) => [i + 1, dt, wd, '', '', '']),
          [],
          ['', 'محاسب الفرع', '', '', 'إعتماد مدير الفرع'],
        ],
        `بيان ${type}`,
      );
      toast(`تم تحميل القالب (${days.length} يوم)`);
    };
    /* التاريخ من الإكسيل: نص (2026-10-02 أو 02/10/2026) أو رقم تاريخ إكسيل */
    return setupSingleSheetXlsxPart(box, f, root, ymd);
  }
  /* جزء من setupSingleSheetXlsx: const toDate = (v) => {… */
  function setupSingleSheetXlsxPart(box, f, root, ymd) {
    const toDate = (v) => {
      const s = String(v == null ? '' : v)
        .replace(/[٠-٩]/g, (x) => '٠١٢٣٤٥٦٧٨٩'.indexOf(x))
        .trim();
      let m;
      if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return ymd(+m[1], +m[2] - 1, +m[3]);
      if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) return ymd(+m[3], +m[2] - 1, +m[1]);
      if (/^\d{5}(\.\d+)?$/.test(s)) {
        const t = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(s)) * 86400000);
        return ymd(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
      }
      return '';
    };
    $('#xsFile', root).onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      try {
        const rows = await readXlsx(file);
        const hi = rows.findIndex((r) => r.some((c) => /التاريخ/.test(String(c))) && r.some((c) => /مبلغ/.test(String(c))));
        if (hi < 0) throw new Error('لم نجد صف العناوين (التاريخ، المبلغ...) في الملف');
        const H = rows[hi].map((c) => String(c || '').trim());
        const col = (re) => H.findIndex((h) => re.test(h));
        const ix = { date: col(/التاريخ/), amount: col(/مبلغ/), details: col(/تفاصيل/), notes: col(/ملاحظات/) };
        const num = (v) =>
          Number(
            String(v == null ? '' : v)
              .replace(/[٠-٩]/g, (x) => '٠١٢٣٤٥٦٧٨٩'.indexOf(x))
              .replace(/[^\d.]/g, ''),
          ) || 0;
        const out = [];
        for (const r of rows.slice(hi + 1)) {
          const g = (k) => (ix[k] >= 0 ? String(r[ix[k]] == null ? '' : r[ix[k]]).trim() : '');
          if (/إجمالي|الإجمالي/.test(r.join(' '))) break;
          const amount = num(g('amount'));
          if (!amount) continue;
          out.push({ date: toDate(g('date')), amount: String(amount), details: g('details'), notes: g('notes') });
        }
        if (!out.length) throw new Error('لا توجد أيام فيها مبلغ في الملف');
        $('.trows', box).innerHTML = out.map((x) => tableRowHtml(f, x)).join('');
        root.dispatchEvent(new Event('input', { bubbles: true }));
        root.dispatchEvent(new Event('change', { bubbles: true }));
        const total = out.reduce((a, x) => a + Number(x.amount), 0);
        toast(`تم رفع البيان: ${out.length} يوم — الإجمالي ${money(total)} ريال`);
      } catch (err) {
        toast(err.message, true);
      }
      ev.target.value = '';
    };
  }

  /* قائمة «يُوجَّه إلى» المرتبة */
  function setupUsers(root, form) {
    form.fields
      .filter((f) => f.type === 'users')
      .forEach((f) => {
        const box = $(`[data-users="${f.key}"]`, root);
        if (!box) return;
        const hidden = $(`[data-key="${f.key}"]`, box),
          list = $('.us-list', box),
          add = $('[data-us-add]', box);
        const users = state.pickUsers || [];
        const get = () => {
          try {
            return JSON.parse(hidden.value || '[]');
          } catch {
            return [];
          }
        };
        const put = (ids) => {
          hidden.value = JSON.stringify(ids);
          draw();
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const draw = () => {
          const ids = get();
          list.innerHTML = ids.length
            ? ids
                .map((id, i) => {
                  const u = users.find((x) => x.id === id) || { name: '؟' };
                  return `<div class="us-row"><b class="us-n">${i + 1}</b><span>${esc(u.name)}${u.title ? ` <small class="muted">— ${esc(u.title)}</small>` : ''}</span>${i ? `<button type="button" class="btn sm" data-us-up="${i}" title="نقل لأعلى">▲</button>` : ''}<button type="button" class="btn sm bad" data-us-del="${i}" title="حذف">✕</button></div>`;
                })
                .join('')
            : '<div class="muted" style="font-size:13px">لم تختر أحداً بعد</div>';
        };
        list.onclick = (e) => {
          const up = e.target.closest('[data-us-up]'),
            del = e.target.closest('[data-us-del]'),
            ids = get();
          if (up) {
            const i = Number(up.dataset.usUp);
            [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
            put(ids);
          }
          if (del) {
            ids.splice(Number(del.dataset.usDel), 1);
            put(ids);
          }
        };
        const pick = () => {
          const v = add.value.trim();
          if (!v) return;
          const u = users.find((x) => `${x.name}${x.title ? ` — ${x.title}` : ''}` === v) || users.find((x) => x.name === v);
          if (!u) return;
          const ids = get();
          if (!ids.includes(u.id)) ids.push(u.id);
          add.value = '';
          put(ids);
        };
        add.addEventListener('change', pick);
        add.addEventListener('input', pick);
        draw();
      });
  }
  return { setupUsers, setupSheetXlsx, empSignWire };
};
