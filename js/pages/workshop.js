'use strict';
/* صفحة «workshop» (viewWorkshop) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['workshop'] = function (S) {
  const {
    $,
    $$,
    MOVE_KIND,
    SF,
    api,
    askYesNo,
    collect,
    esc,
    fieldHtml,
    formModal,
    head,
    issueDoc,
    printDocs,
    prodDoc,
    route,
    sar,
    scrapDoc,
    shell,
    state,
    toast,
    today,
  } = S;
  async function viewWorkshop(query) {
    const res = await api('GET', '/api/workshop');
    const main = shell('', '#/workshop');
    const tab = ['stock', 'prod', 'scrap'].includes(query.tab) ? query.tab : 'stock';
    const ws = res.workshops.includes(query.ws) ? query.ws : res.workshops[0];
    const bal = res.balances.find((b) => b.workshop === ws) || { stock: [], scrap: [] };
    const go = (o) => {
      const q = new URLSearchParams({ tab, ws, ...o });
      location.hash = `#/workshop?${q}`;
    };
    const moves = res[tab === 'scrap' ? 'scrapMoves' : 'stockMoves'].filter(
      (m) => m.workshop === ws && (tab !== 'prod' || m.kind === 'prod'),
    );
    const calc = (f) => {
      const q = Number($('[data-key="qty"]', f).value) || 0,
        p = Number($('[data-key="unitPrice"]', f).value) || 0,
        s = q * p;
      return `الإجمالي: ${sar(s)} — الضريبة 15%: ${sar(s * res.vat)} — الإجمالي النهائي: <b>${sar(s * (1 + res.vat))}</b> ريال`;
    };
    const docOf = (m) => (m.kind === 'issue' ? issueDoc(m) : m.kind === 'prod' ? prodDoc(m) : m.kind === 'sale' ? scrapDoc(m) : '');
    renderViewWorkshop(docOf, main, moves, res, tab, ws);
    const body = $('#wsBody');
    const post = async (kind, v, col = 'stock') => {
      const m = await api('POST', `/api/workshop/${col}`, { ...v, kind, workshop: ws });
      toast(m.docNo ? `تم — رقم المستند ${m.docNo}` : 'تم الحفظ');
      if (docOf(m)) printDocs(m.docNo, docOf(m));
      route();
    };
    if (tab === 'stock') {
      const unitOf = (p) => ((res.catalog || []).find((x) => x.name === p) || {}).unit || 'حبة';
      body.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="margin:0">رصيد المخزن</h3><span class="row" style="gap:6px">${res.catEditor ? '<button class="btn sm" id="wsCat">🏷️ إضافة صنف جديد</button>' : ''}${bal.editor ? '<button class="btn sm primary" id="wsOpen">➕ إضافة كمية يدوياً</button>' : ''}</span></div>
        <div class="ws-grid">${bal.stock.map((p) => `<div class="ws-item${p.qty > 0 ? '' : ' empty'}">${res.catEditor ? `<button type="button" class="ws-edit" data-cat="${esc(p.product)}" title="تعديل الصنف">✏️</button>` : ''}<b>${esc(p.product)}</b><div class="ws-qty">${esc(p.qty)}<small> ${esc(unitOf(p.product))}</small></div>${bal.editor && p.qty > 0 ? `<button class="btn sm primary" data-issue="${esc(p.product)}" title="طلب إذن صرف يعتمده مسئول الورشة ثم مدير العمليات">طلب إذن صرف</button>` : ''}</div>`).join('')}</div></div>`;
      body.onclick = (e) => {
        const ce = e.target.closest('[data-cat]');
        if (ce) {
          const name = ce.dataset.cat,
            c = (res.catalog || []).find((x) => x.name === name) || {};
          formModal({
            title: `تعديل الصنف: ${name}`,
            values: { name, unit: c.unit || 'حبة', hidden: c.hidden ? 'مخفي' : 'ظاهر' },
            fields: [
              { key: 'name', label: 'اسم الصنف', required: true, hint: 'تغيير الاسم يشمل حركات المخزن السابقة' },
              { key: 'unit', label: 'الوحدة', type: 'select', options: res.storeUnits, required: true },
              {
                key: 'hidden',
                label: 'الظهور في المخزن',
                type: 'select',
                options: ['ظاهر', 'مخفي'],
                hint: 'المخفي لا يظهر إلا إذا كان له رصيد أو حركات',
              },
            ],
            onSave: async (v) => {
              await api('PUT', '/api/workshop/products', { old: name, name: v.name, unit: v.unit, hidden: v.hidden === 'مخفي' });
              toast('تم تعديل الصنف');
              route();
            },
          });
          return;
        }
        const b = e.target.closest('[data-issue]');
        if (!b) return;
        const p = b.dataset.issue;
        location.hash = `#/new/stockIssue?prefill=${encodeURIComponent(JSON.stringify({ workshop: ws, items: [{ product: p, qty: '', price: '' }] }))}`;
      };
      wireWorkshop(post, res, ws);
    }
    viewWorkshopPart2(bal, body, calc, docOf, go, main, moves, post, res, tab, ws);
  }
  /* أحداث viewWorkshop: #wsCat، #wsOpen */
  function wireWorkshop(post, res, ws) {
    if ($('#wsCat'))
      $('#wsCat').onclick = () =>
        formModal({
          title: 'إضافة صنف جديد للمخزن',
          fields: [
            { key: 'name', label: 'اسم الصنف', required: true, hint: 'مثال: قواعد حديد 6 بوصة' },
            { key: 'unit', label: 'الوحدة', type: 'select', options: res.storeUnits, required: true, default: 'حبة' },
          ],
          onSave: async (v) => {
            await api('POST', '/api/workshop/products', v);
            toast(`تمت إضافة الصنف "${v.name}" — أضف كميته من "إضافة كمية يدوياً"`);
            route();
          },
        });
    /* إضافة كمية يدوياً بدون دورة تصنيع: منتج من القائمة أو جديد، ومصدر الكمية، وتكلفة الوحدة اختيارية */
    if ($('#wsOpen'))
      $('#wsOpen').onclick = () => {
        const m = formModal({
          title: `إضافة كمية للمخزن يدوياً — ${ws}`,
          fields: [
            { key: 'product', label: 'المنتج', required: true, hint: 'اختر من القائمة أو اكتب منتجاً جديداً' },
            {
              key: 'party',
              label: 'مصدر الكمية',
              type: 'select',
              required: true,
              options: ['رصيد افتتاحي', 'تصنيع بالورشة', 'توريد / شراء خارجي', 'مرتجع من فرع', 'تسوية جرد', 'أخرى'],
            },
            { key: 'qty', label: 'الكمية', type: 'number', required: true },
            { key: 'unitPrice', label: 'تكلفة الوحدة (ريال، اختياري)', type: 'number' },
            { key: 'date', label: 'التاريخ', type: 'date', default: today() },
            { key: 'notes', label: 'ملاحظات', type: 'textarea' },
          ],
          onSave: (v) => post('open', v),
        });
        const pi = $('[data-key="product"]', m);
        if (pi) {
          const dl = document.createElement('datalist');
          dl.id = 'wsProdList';
          dl.innerHTML = res.products.map((p) => `<option value="${esc(p)}">`).join('');
          m.appendChild(dl);
          pi.setAttribute('list', 'wsProdList');
          pi.setAttribute('autocomplete', 'off');
        }
      };
  }
  /* جزء من viewWorkshop: viewWorkshopPart(bal, body, calc, go, main, post, … */
  function viewWorkshopPart2(bal, body, calc, docOf, go, main, moves, post, res, tab, ws) {
    viewWorkshopPart(bal, body, calc, go, main, post, res, tab, ws);
    main.addEventListener('click', async (e) => {
      const p = e.target.closest('[data-pr]'),
        d = e.target.closest('[data-mdel]');
      if (p) {
        const m = moves.find((x) => x.id === p.dataset.pr);
        printDocs(m.docNo, docOf(m));
      }
      if (d && (await askYesNo('حذف الحركة؟ يتغير الرصيد، وتُنقل الحركة إلى سلة المحذوفات.'))) {
        try {
          await api('DELETE', `/api/workshop/${tab === 'scrap' ? 'scrap' : 'stock'}/${d.dataset.mdel}`);
          toast('تم الحذف');
          route();
        } catch (err) {
          toast(err.message, true);
        }
      }
    });
  }
  /* جزء من viewWorkshop: if (tab === 'prod') {… */
  function viewWorkshopPart(bal, body, calc, go, main, post, res, tab, ws) {
    if (tab === 'prod') {
      body.innerHTML = bal.editor
        ? `<div class="card"><h3>أمر تشغيل وترحيل للمخزن</h3><form id="pf" novalidate><div class="grid2">
        ${fieldHtml({ key: 'party', label: 'اسم العميل / الجهة الطالبة', required: true }, '')}${fieldHtml({ key: 'product', label: 'المنتج المطلوب تصنيعه', required: true, hint: 'اختر من القائمة أو اكتب منتجاً جديداً' }, '')}
        ${fieldHtml({ key: 'qty', label: 'الكمية المصنعة', type: 'number', required: true }, '1')}${fieldHtml({ key: 'unitPrice', label: 'سعر الوحدة (ريال)', type: 'number', required: true }, '')}
        ${fieldHtml({ key: 'date', label: 'التاريخ', type: 'date' }, today())}${fieldHtml({ key: 'notes', label: 'ملاحظات', type: 'textarea' }, '')}</div>
        <datalist id="dl-products">${res.products.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
        <div class="hint" id="pfCalc" style="margin-top:8px"></div><div id="pfErr"></div>
        <button class="btn primary" style="margin-top:12px">💾 إصدار الأمر وترحيل الكمية لمخزن ${esc(ws)}</button></form></div>`
        : '<div class="card muted">إصدار أوامر التصنيع لمسؤولي مخزن هذه الورشة.</div>';
      const pf = $('#pf');
      if (pf) {
        $('[data-key="product"]', pf).setAttribute('list', 'dl-products');
        pf.addEventListener('input', () => {
          $('#pfCalc').innerHTML = calc(pf);
        });
        $('#pfCalc').innerHTML = calc(pf);
        pf.onsubmit = async (e) => {
          e.preventDefault();
          try {
            await post('prod', collect({ fields: ['party', 'product', 'qty', 'unitPrice', 'date', 'notes'].map((key) => ({ key })) }, pf));
          } catch (err) {
            $('#pfErr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      }
    }
    if (tab === 'scrap') {
      body.innerHTML = `<div class="detail" style="grid-template-columns:1fr 1.4fr">${
        bal.editor
          ? `<div class="card"><h3>📥 توريد خردة / عهدة</h3><form id="sf" novalidate>
        ${fieldHtml({ key: 'party', label: 'الفرع المورِّد (من أين جاءت الخردة)', type: 'select', options: [...state.config.branches.map((b) => `فرع ${b}`), 'الورشة نفسها', 'أخرى'], required: true, full: true }, '')}${fieldHtml({ key: 'material', label: 'نوع المادة', required: true, hint: 'مثال: حديد سكراب، خشب، بطاريات' }, '')}${fieldHtml({ key: 'unit', label: 'وحدة القياس', type: 'select', options: res.units, required: true }, '')}
        ${fieldHtml({ key: 'qty', label: 'الكمية الموردة', type: 'number', required: true }, '')}${fieldHtml({ key: 'date', label: 'التاريخ', type: 'date' }, today())}
        <datalist id="dl-scrap">${bal.scrap.map((s) => `<option value="${esc(s.material)}">`).join('')}</datalist><div id="sfErr"></div>
        <button class="btn primary" style="margin-top:10px">إضافة لرصيد الخردة</button></form></div>`
          : ''
      }
        <div class="card"><h3>📊 رصيد ساحة الخردة</h3><div class="hint" style="margin:-4px 0 10px">الفروع تورّد الخردة بنموذج <a href="#/new/scrapSupply">توريد خردة للورشة</a> (مدير الفرع ← محاسب الورش ← مدير العمليات)، وتُضاف هنا بعد الاعتماد.</div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>المادة</th><th>الرصيد الحالي</th><th></th></tr></thead><tbody>
        ${
          bal.scrap
            .filter((s) => s.qty > 0)
            .map(
              (s) =>
                `<tr><td><b>${esc(s.material)}</b></td><td>${esc(s.qty)} ${esc(s.unit || '')}</td><td>${bal.editor ? `<button class="btn sm primary" data-sale="${esc(s.material)}" title="طلب إذن صرف وبيع خردة: محاسب الورش ← مدير العمليات ← تعميد المدير المالي">طلب إذن صرف وبيع</button>` : ''}</td></tr>`,
            )
            .join('') || '<tr><td colspan="3" class="muted">لا يوجد رصيد</td></tr>'
        }</tbody></table></div></div></div>`;
      const sf = $('#sf');
      if (sf) {
        $('[data-key="material"]', sf).setAttribute('list', 'dl-scrap');
        sf.onsubmit = async (e) => {
          e.preventDefault();
          try {
            await post('in', collect({ fields: ['party', 'material', 'unit', 'qty', 'date'].map((key) => ({ key })) }, sf), 'scrap');
          } catch (err) {
            $('#sfErr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      }
      body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-sale]');
        if (!b) return;
        const s = bal.scrap.find((x) => x.material === b.dataset.sale);
        location.hash = `#/new/scrapSale?prefill=${encodeURIComponent(JSON.stringify({ workshop: ws, items: [{ material: s.material, qty: '', unit: s.unit || '', price: '' }] }))}`;
      });
    }
    $$('[data-ws]', main).forEach((b) => {
      b.onclick = () => go({ ws: b.dataset.ws });
    });
    $$('[data-tab]', main).forEach((b) => {
      b.onclick = () => go({ tab: b.dataset.tab });
    });
  }
  /* محتوى viewWorkshop (HTML) */
  function renderViewWorkshop(docOf, main, moves, res, tab, ws) {
    main.innerHTML = `${head('الورشة', `مخزن ${esc(ws)}`, '')}
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">${res.workshops.map((w) => `<button class="btn${w === ws ? ' primary' : ''}" data-ws="${esc(w)}">${esc(w)}</button>`).join('')}</div>
      <div class="tabs" style="margin-bottom:14px">${[
        ['stock', '📦 المخزون وإذن الصرف'],
        ['prod', '🏭 أوامر التصنيع'],
        ['scrap', '♻️ الخردة'],
      ]
        .map(([k, l]) => `<button class="tab${k === tab ? ' on' : ''}" data-tab="${k}">${l}</button>`)
        .join('')}</div>
      <div id="wsBody"></div>
      <div class="card"><h3>${tab === 'scrap' ? 'حركات الخردة' : tab === 'prod' ? 'أوامر التصنيع' : 'حركات المخزن'} — ${esc(ws)}</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>التاريخ</th><th>الرقم</th><th>النوع</th><th>الصنف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th><th>الجهة</th><th>بواسطة</th><th></th></tr></thead><tbody>
        ${
          moves
            .map(
              (
                m,
              ) => `<tr><td>${esc(SF.fmtDate(m.date))}</td><td><bdi>${esc(m.docNo || '—')}</bdi></td><td>${esc(MOVE_KIND[m.kind])}</td><td>${esc(m.product || m.material)}</td><td>${esc(m.qty)} ${esc(m.unit || '')}</td><td>${esc(sar(m.unitPrice))}</td><td>${esc(sar(m.total))}</td><td>${esc(m.party || '—')}</td><td>${esc(m.byName)}</td>
          <td style="white-space:nowrap">${docOf(m) ? `<button class="btn sm" data-pr="${m.id}">🖨️</button>` : ''}${state.user.role === 'admin' ? ` <button class="btn sm ghost" data-mdel="${m.id}" title="حذف الحركة">🗑️</button>` : ''}</td></tr>`,
            )
            .join('') || '<tr><td colspan="10" class="muted" style="text-align:center;padding:20px">لا توجد حركات</td></tr>'
        }</tbody></table></div></div>`;
  }

  return { viewWorkshop };
};
