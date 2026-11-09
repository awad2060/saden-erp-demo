'use strict';
/* صفحة «branch-map» (viewBranchMap) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['branch-map'] = function (S) {
  const { $, $$, SITE_IC, api, askYesNo, esc, head, loadLeaflet, mapLayers, parseLatLng, shell, sitePin, toast } = S;
  async function viewBranchMap(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (d، L، fRegion، fType، q، sel) */
    const vs = {};
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/branch-map');
    vs.d = await api('GET', '/api/branch-map');
    vs.L = undefined;
    try {
      vs.L = await loadLeaflet();
    } catch (e) {
      main.innerHTML = `<div class="err">${esc(e.message)}</div>`;
      return;
    }
    vs.fRegion = '';
    vs.fType = '';
    vs.q = '';
    vs.sel = '';
    const reg = () => Object.fromEntries(vs.d.regions.map((r) => [r.id, r]));
    const colorOf = (x) => (reg()[x.region] || {}).color || '#64748b';
    /* الشخص من الموارد البشرية: الاسم والمسمى والجوال ورابط ملف الموظف */
    const who = (p, text) =>
      p
        ? `${vs.d.canEmp ? `<a href="#/employee/${esc(p.id)}">${esc(p.name)}</a>` : esc(p.name)}${p.title ? ` <small class="muted">${esc(p.title)}</small>` : ''}`
        : text
          ? `${esc(text)} <small class="bad" title="غير مربوط بسجل الموظفين">⚠</small>`
          : '—';
    const empLabel = (e) => `${e.name} — ${e.title || ''}${e.branch ? ` (${e.branch})` : ''}`;
    renderViewBranchMap(vs.d, main);
    const map = vs.L.map($('#smMap', main), { zoomControl: true, attributionControl: true }).setView([23.9, 44.5], 5);
    await viewBranchMapPart3(map, vs);
    const group = vs.L.featureGroup().addTo(map);
    const markers = new Map();
    /* أسماء المواقع تظهر عند التقريب فقط */
    const zoomCls = () => $('#smMap', main).classList.toggle('sm-near', map.getZoom() >= 9);
    map.on('zoomend', zoomCls);
    const visible = () =>
      vs.d.sites.filter(
        (x) =>
          (!vs.fRegion || x.region === vs.fRegion) &&
          (!vs.fType || x.type === vs.fType) &&
          (!vs.q ||
            `${x.name} ${x.branch} ${(x.managerP || {}).name || ''} ${(x.accountantP || {}).name || ''} ${x.address}`.includes(vs.q)),
      );
    const popup = (x) => {
      const r = reg()[x.region] || {};
      return `<div class="sm-pop" dir="rtl"><div class="sm-pop-h"><b>${SITE_IC[x.type] || '📍'} ${esc(x.name)}</b><span class="chip" style="background:${colorOf(x)};color:#fff">${esc(x.type)}</span></div>
      ${r.name ? `<div><span>المنطقة</span><b>${esc(r.name)}</b></div>` : ''}${x.branch ? `<div><span>الفرع في النظام</span><b>${esc(x.branch)}</b></div>` : ''}
      ${x.managerP || x.managerText ? `<div><span>👤 المدير</span><b>${who(x.managerP, x.managerText)}</b></div>` : ''}${x.managerP && x.managerP.phone ? `<div><span>📱 جوال المدير</span><b dir="ltr"><a href="tel:${esc(x.managerP.phone)}">${esc(x.managerP.phone)}</a></b></div>` : ''}
      ${x.accountantP || x.accountantText ? `<div><span>🧮 المحاسب</span><b>${who(x.accountantP, x.accountantText)}</b></div>` : ''}
      ${x.phone ? `<div><span>📞 هاتف الموقع</span><b dir="ltr"><a href="tel:${esc(x.phone)}">${esc(x.phone)}</a></b></div>` : ''}${x.address ? `<div><span>📍 العنوان</span><b>${esc(x.address)}</b></div>` : ''}
      ${x.docsExpired ? `<div class="bad"><span>📑 وثائق منتهية</span><b>${x.docsExpired}</b></div>` : ''}${x.note ? `<p class="muted">${esc(x.note)}</p>` : ''}
      <div class="sm-pop-a"><a class="btn sm" href="https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lng}" target="_blank" rel="noopener">🧭 الاتجاهات</a>${x.branch ? `<a class="btn sm" href="#/facilities?b=${encodeURIComponent(x.branch)}">🏢 المنشآت</a>` : ''}${vs.d.edit ? `<button class="btn sm ghost" data-sed="${x.id}">✎ تعديل</button>` : ''}</div></div>`;
    };
    return viewBranchMapPart5(colorOf, empLabel, group, main, map, markers, popup, query, reg, visible, vs, zoomCls);
  }
  /* جزء من viewBranchMap: const draw = (fit) => {… */
  function viewBranchMapPart5(colorOf, empLabel, group, main, map, markers, popup, query, reg, visible, vs, zoomCls) {
    const draw = (fit) => {
      const R = reg(),
        V = visible();
      $('#smRegs', main).innerHTML = vs.d.regions
        .map(
          (r) =>
            `<button type="button" class="bm-reg${vs.fRegion === r.id ? ' on' : ''}" data-rg="${esc(r.id)}" style="--rc:${r.color}"><b>${esc(r.name)}</b><small>👤 مدير المنطقة</small><strong>${r.managerP ? esc(r.managerP.name) : r.managerText ? `${esc(r.managerText)} ⚠` : '-'}</strong><span>${vs.d.sites.filter((x) => x.region === r.id).length} موقع</span></button>`,
        )
        .join('');
      $('#smLeg', main).innerHTML =
        vs.d.regions.map((r) => `<span><i style="background:${r.color}"></i>${esc(r.name)}</span>`).join('') +
        `<span class="muted">${Object.entries(SITE_IC)
          .map(([t, i]) => `${i} ${t}`)
          .join(' · ')}</span>`;
      $('#smN', main).textContent = `${V.length} موقع`;
      group.clearLayers();
      markers.clear();
      V.forEach((x) => {
        const m = vs.L.marker([x.lat, x.lng], {
          icon: sitePin(vs.L, colorOf(x), SITE_IC[x.type] || '📍', x.id === vs.sel),
          title: x.name,
          riseOnHover: true,
        })
          .bindPopup(popup(x), { maxWidth: 320 })
          .bindTooltip(esc(x.name), { permanent: true, direction: 'bottom', offset: [0, 4], className: 'sm-lbl' });
        m.on('click', () => {
          vs.sel = x.id;
          markActive();
        });
        m.addTo(group);
        markers.set(x.id, m);
      });
      const groups = vs.d.regions
        .map((r) => [r, V.filter((x) => x.region === r.id)])
        .concat([[{ name: 'بدون منطقة', color: '#64748b' }, V.filter((x) => !R[x.region])]])
        .filter(([, l]) => l.length);
      $('#smList', main).innerHTML =
        groups
          .map(
            ([r, l]) =>
              `<div class="bm-group"><h4 style="--rc:${r.color}">${esc(r.name)} <small>(${l.length})</small></h4><div class="bm-cards">${l
                .map(
                  (
                    x,
                  ) => `<div class="bm-card${x.id === vs.sel ? ' on' : ''}" data-site="${x.id}" style="--rc:${colorOf(x)}"><b>${SITE_IC[x.type] || '📍'} ${esc(x.name)}</b><span class="sm-type">${esc(x.type)}${x.branch && x.branch !== x.name ? ` — ${esc(x.branch)}` : ''}</span>
        ${x.managerP || x.managerText ? `<div><span>👤 المدير</span><strong>${x.managerP ? esc(x.managerP.name) : `${esc(x.managerText)} ⚠`}</strong></div>` : ''}${x.accountantP || x.accountantText ? `<div><span>🧮 المحاسب</span><strong>${x.accountantP ? esc(x.accountantP.name) : `${esc(x.accountantText)} ⚠`}</strong></div>` : ''}</div>`,
                )
                .join('')}</div></div>`,
          )
          .join('') || '<div class="empty">لا توجد مواقع</div>';
      $$('[data-site]', main).forEach((c) => {
        c.onclick = () => focus(c.dataset.site);
      });
      $$('[data-rg]', main).forEach((b) => {
        b.onclick = () => {
          vs.fRegion = vs.fRegion === b.dataset.rg ? '' : b.dataset.rg;
          draw(true);
        };
      });
      zoomCls();
      if (fit && V.length) map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 13 });
    };
    const markActive = () => {
      $$('[data-site]', main).forEach((c) => c.classList.toggle('on', c.dataset.site === vs.sel));
    };
    const focus = (id) => {
      const m = markers.get(id);
      if (!m) return;
      vs.sel = id;
      markActive();
      map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.8 });
      setTimeout(() => m.openPopup(), 850);
    };
    return viewBranchMapPart4(draw, empLabel, focus, main, map, query, vs);
  }
  /* جزء من viewBranchMap: viewBranchMapPart2(draw, main, map, siteForm, vs);… */
  function viewBranchMapPart4(draw, empLabel, focus, main, map, query, vs) {
    viewBranchMapPart2(draw, main, map, siteForm, vs);
    const reload = async (keepView) => {
      vs.d = await api('GET', '/api/branch-map');
      draw(!keepView);
    };
    /* نافذة إضافة / تعديل موقع: خريطة صغيرة لتحديد المكان بالضغط أو سحب الدبوس، أو لصق رابط جوجل / الإحداثيات */
    const siteForm = (...args) => branchMapSiteForm(empLabel, focus, map, reload, vs, ...args);
    /* المناطق: الاسم واللون ومدير المنطقة */
    return viewBranchMapPart(draw, empLabel, focus, map, query, reload, siteForm, vs);
  }
  /* siteForm من viewBranchMap (يأخذ empLabel، focus، map، reload، vs من الصفحة) */
  async function branchMapSiteForm(empLabel, focus, map, reload, vs, x) {
    /* حالة الصفحة: ما يتغير بعد العرض (x) */
    return branchMapSiteFormPart2(empLabel, focus, map, reload, vs, x);
  }
  /* جزء من branchMapSiteForm: const pageState = {};… */
  async function branchMapSiteFormPart2(empLabel, focus, map, reload, vs, x) {
    const pageState = {};
    pageState.x = x;
    /* حالة الصفحة: ما يتغير بعد العرض (pos) */
    const st = {};
    pageState.x = pageState.x || { type: 'فرع', region: vs.fRegion || '' };
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    renderBranchMapSiteForm(bg, empLabel, pageState, vs);
    document.body.appendChild(bg);
    const f = $('form', bg);
    branchMapSiteFormPart(f, vs, pageState.x);
    const err = (m) => {
      $('.merr', bg).innerHTML = m ? `<div class="err">${esc(m)}</div>` : '';
    };
    st.pos = pageState.x.lat != null ? [pageState.x.lat, pageState.x.lng] : null;
    const mini = vs.L.map($('#smMini', bg)).setView(
      st.pos || [map.getCenter().lat, map.getCenter().lng],
      st.pos ? 16 : Math.max(map.getZoom(), 5),
    );
    const ml = await mapLayers(vs.L);
    siteFormPart2(vs.L, bg, err, f, mini, ml, st);
    wireBranchMapSiteFormPart2(bg, empLabel, err, f, focus, map, mini, pageState, reload, st, vs);
    f.name.focus();
  }
  /* أحداث branchMapSiteFormPart2 */
  function wireBranchMapSiteFormPart2(bg, empLabel, err, f, focus, map, mini, pageState, reload, st, vs) {
    if ($('[data-del]', bg))
      $('[data-del]', bg).onclick = async () => {
        if (!(await askYesNo(`حذف «${pageState.x.name}» من الخريطة؟`))) return;
        try {
          await api('DELETE', `/api/branch-map/sites/${pageState.x.id}`);
          mini.remove();
          bg.remove();
          map.closePopup();
          reload(true);
        } catch (e) {
          err(e.message);
        }
      };
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!st.pos) return err('حدد الموقع على الخريطة أو الصق رابطه');
      const pick = (v, what) => {
        v = v.trim();
        if (!v) return '';
        const e = vs.d.employees.find((y) => empLabel(y) === v);
        if (!e) throw new Error(`اختر ${what} من قائمة الموظفين`);
        return e.id;
      };
      let managerEmp, accountantEmp;
      try {
        managerEmp = pick(f.manager.value, 'المدير');
        accountantEmp = pick(f.accountant.value, 'المحاسب');
      } catch (er) {
        return err(er.message);
      }
      const b = {
        name: f.name.value,
        type: f.type.value,
        branch: f.branch.value,
        region: f.region.value,
        lat: st.pos[0],
        lng: st.pos[1],
        managerEmp,
        accountantEmp,
        phone: f.phone.value,
        address: f.address.value,
        note: f.note.value,
      };
      try {
        const r = await api(
          pageState.x.id ? 'PUT' : 'POST',
          pageState.x.id ? `/api/branch-map/sites/${pageState.x.id}` : '/api/branch-map/sites',
          b,
        );
        mini.remove();
        bg.remove();
        toast('تم الحفظ');
        vs.sel = r.id;
        map.closePopup();
        await reload(true);
        focus(r.id);
      } catch (er) {
        err(er.message);
      }
    };
  }
  /* محتوى branchMapSiteForm (HTML) */
  function renderBranchMapSiteForm(bg, empLabel, pageState, vs) {
    bg.innerHTML = `<form class="modal sm-form" novalidate><h3 style="margin-top:0">${pageState.x.id ? '✎ تعديل موقع' : '＋ إضافة موقع'}</h3>
        <div class="grid2"><div class="field"><label>اسم الموقع *</label><input class="in" name="name" value="${esc(pageState.x.name || '')}" placeholder="مثال: المكتب الفني — جدة" maxlength="100"></div>
          <div class="field"><label>النوع</label><select class="in" name="type">${vs.d.types
            .map((t) => `<option${t === pageState.x.type ? ' selected' : ''}>${SITE_IC[t] || ''} ${esc(t)}</option>`)
            .join('')
            .replace(/<option( selected)?>(\S+) /g, '<option$1 value="">')}</select></div>
          <div class="field"><label>يتبع فرع (في النظام)</label><select class="in" name="branch"><option value="">—</option>${vs.d.branches.map((b) => `<option${b === pageState.x.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></div>
          <div class="field"><label>المنطقة</label><select class="in" name="region"><option value="">—</option>${vs.d.regions.map((r) => `<option value="${esc(r.id)}"${r.id === pageState.x.region ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div></div>
        <div class="field"><label>الموقع على الخريطة *</label><div class="sm-loc"><input class="in" name="loc" dir="ltr" placeholder="الصق رابط خرائط جوجل أو الإحداثيات مثل 21.5433, 39.1728" value="${pageState.x.lat != null ? `${pageState.x.lat}, ${pageState.x.lng}` : ''}"><button type="button" class="btn sm" id="smFind">تحديد</button></div>
          <div class="hint">أو اضغط على المكان في الخريطة / اسحب الدبوس — قرّب الخريطة حتى المبنى</div><div id="smMini" class="sm-mini"></div></div>
        <datalist id="smEmps">${vs.d.employees.map((e) => `<option value="${esc(empLabel(e))}">`).join('')}</datalist>
        <div class="grid2"><div class="field"><label>المدير / المسؤول <small class="muted">(من الموارد البشرية)</small></label><input class="in" name="manager" list="smEmps" value="${esc(pageState.x.managerEmp && pageState.x.managerP ? empLabel(vs.d.employees.find((e) => e.id === pageState.x.managerEmp) || { name: pageState.x.managerP.name }) : '')}" placeholder="${pageState.x.managerAuto && pageState.x.managerP ? esc(`تلقائي: ${pageState.x.managerP.name}`) : 'اكتب اسم الموظف للبحث'}"><div class="hint">فارغ = تلقائي: مدير الفرع من سجل الموظفين</div></div>
          <div class="field"><label>المحاسب <small class="muted">(من الموارد البشرية)</small></label><input class="in" name="accountant" list="smEmps" value="${esc(pageState.x.accountantEmp && pageState.x.accountantP ? empLabel(vs.d.employees.find((e) => e.id === pageState.x.accountantEmp) || { name: pageState.x.accountantP.name }) : '')}" placeholder="${pageState.x.accountantAuto && pageState.x.accountantP ? esc(`تلقائي: ${pageState.x.accountantP.name}`) : 'اكتب اسم الموظف للبحث'}"><div class="hint">فارغ = تلقائي: محاسب الفرع من سجل الموظفين</div></div>
          <div class="field"><label>الهاتف</label><input class="in" name="phone" dir="ltr" value="${esc(pageState.x.phone || '')}"></div><div class="field"><label>العنوان</label><input class="in" name="address" value="${esc(pageState.x.address || '')}" placeholder="الحي، الشارع"></div></div>
        <div class="field"><label>ملاحظات</label><input class="in" name="note" value="${esc(pageState.x.note || '')}"></div><div class="merr"></div>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn primary">💾 حفظ</button>${pageState.x.id ? '<button type="button" class="btn ghost" data-del>🗑 حذف الموقع</button>' : ''}<button type="button" class="btn ghost" data-x>إلغاء</button></div></form>`;
  }
  /* جزء من branchMapSiteForm: f.type.value = x.type || 'فرع';… */
  function branchMapSiteFormPart(f, vs, x) {
    f.type.value = x.type || 'فرع';
    Array.from(f.type.options).forEach((o, i) => {
      o.value = vs.d.types[i];
    });
    f.type.value = x.type || 'فرع';
  }
  /* جزء من viewBranchMap: const layers = await mapLayers(vs.L);… */
  async function viewBranchMapPart3(map, vs) {
    const layers = await mapLayers(vs.L);
    layers[Object.keys(layers)[0]].addTo(map);
    vs.L.control.layers(layers, null, { position: 'topleft' }).addTo(map);
    vs.L.control.scale({ imperial: false }).addTo(map);
  }
  /* جزء من viewBranchMap: map.on('popupopen', (e) => {… */
  function viewBranchMapPart2(draw, main, map, siteForm, vs) {
    map.on('popupopen', (e) => {
      const b = e.popup.getElement().querySelector('[data-sed]');
      if (b) b.onclick = () => siteForm(vs.d.sites.find((x) => x.id === b.dataset.sed));
    });
    $('#smQ', main).oninput = (e) => {
      vs.q = e.target.value.trim();
      draw(true);
    };
    $('#smT', main).onchange = (e) => {
      vs.fType = e.target.value;
      draw(true);
    };
  }
  /* جزء من viewBranchMap: const regForm = () => {… */
  function viewBranchMapPart(draw, empLabel, focus, map, query, reload, siteForm, vs) {
    const regForm = () => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      const row = (r) =>
        `<tr><td><input class="in" data-k="name" value="${esc(r.name)}"></td><td><input type="color" data-k="color" value="${esc(r.color)}"></td><td><input class="in" data-k="manager" list="rgEmps" value="${esc(r.managerEmp ? empLabel(vs.d.employees.find((e) => e.id === r.managerEmp) || { name: (r.managerP || {}).name || '' }) : '')}" placeholder="${esc(r.managerText ? `غير مربوط: ${r.managerText}` : 'اكتب اسم الموظف')}"></td><td><input type="hidden" data-k="id" value="${esc(r.id)}"><button type="button" class="btn sm ghost" data-rm>✕</button></td></tr>`;
      bg.innerHTML = `<div class="modal" style="max-width:760px"><h3 style="margin-top:0">🧭 المناطق</h3><datalist id="rgEmps">${vs.d.employees.map((e) => `<option value="${esc(empLabel(e))}">`).join('')}</datalist><div class="tbl-wrap"><table class="tbl"><thead><tr><th>المنطقة</th><th>اللون</th><th>مدير المنطقة</th><th></th></tr></thead><tbody id="rgB">${vs.d.regions.map(row).join('')}</tbody></table></div>
        <button type="button" class="btn sm" id="rgAdd">＋ منطقة</button><div class="merr"></div><div class="row" style="gap:8px;margin-top:12px"><button type="button" class="btn primary" id="rgSave">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></div>`;
      document.body.appendChild(bg);
      const bindRm = () =>
        $$('[data-rm]', bg).forEach((b) => {
          b.onclick = () => b.closest('tr').remove();
        });
      bindRm();
      $('#rgAdd', bg).onclick = () => {
        $('#rgB', bg).insertAdjacentHTML('beforeend', row({ id: '', name: 'منطقة جديدة', color: '#0ea5e9', manager: '' }));
        bindRm();
      };
      $('[data-x]', bg).onclick = () => bg.remove();
      $('#rgSave', bg).onclick = async () => {
        let regions;
        try {
          regions = $$('#rgB tr', bg).map((tr) => {
            const o = Object.fromEntries($$('[data-k]', tr).map((el) => [el.dataset.k, el.value]));
            const v = o.manager.trim();
            const e = v ? vs.d.employees.find((y) => empLabel(y) === v) : null;
            if (v && !e) throw new Error(`اختر مدير «${o.name}» من قائمة الموظفين`);
            return { id: o.id, name: o.name, color: o.color, managerEmp: e ? e.id : '' };
          });
        } catch (er) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(er.message)}</div>`;
          return;
        }
        try {
          await api('PUT', '/api/branch-map/regions', { regions });
          bg.remove();
          toast('تم حفظ المناطق');
          reload(true);
        } catch (e) {
          $('.merr', bg).innerHTML = `<div class="err">${esc(e.message)}</div>`;
        }
      };
    };
    return wireBranchMap(draw, focus, map, query, regForm, siteForm);
  }
  /* أحداث viewBranchMap: #smAdd، #smReg */
  function wireBranchMap(draw, focus, map, query, regForm, siteForm) {
    if ($('#smAdd')) $('#smAdd').onclick = () => siteForm();
    if ($('#smReg')) $('#smReg').onclick = regForm;
    draw(true);
    setTimeout(() => map.invalidateSize(), 60);
    if (query.s) focus(query.s);
  }
  /* محتوى viewBranchMap (HTML) */
  function renderViewBranchMap(d, main) {
    main.innerHTML = `${head('خريطة الفروع', 'مواقع الشركة الحقيقية: الفروع والمكاتب والمختبرات والسكن — حسب التقسيم الإداري', d.edit ? '<button class="btn" id="smReg">🧭 المناطق</button><button class="btn primary" id="smAdd">＋ إضافة موقع</button>' : '')}
      <div class="bm-regions" id="smRegs"></div>
      <div class="sm-bar"><input class="in" id="smQ" placeholder="بحث بالاسم أو الفرع أو المدير"><select class="in" id="smT"><option value="">كل الأنواع</option>${d.types.map((t) => `<option>${esc(t)}</option>`).join('')}</select><span class="muted" id="smN"></span></div>
      <div class="sm-wrap"><div class="card sm-mapc"><div id="smMap" class="sm-map"></div><div class="bm-legend" id="smLeg"></div></div><div class="sm-side" id="smList"></div></div>`;
  }
  /* جزء من siteForm: (ml['جوجل — هجين'] || ml['قمر صناعي']).addTo(mini)… */
  function siteFormPart2(L, bg, err, f, mini, ml, st) {
    (ml['جوجل — هجين'] || ml['قمر صناعي']).addTo(mini);
    L.control.layers(ml, null, { position: 'topleft' }).addTo(mini);
    const mk = L.marker(st.pos || mini.getCenter(), { draggable: true, opacity: st.pos ? 1 : 0.4 }).addTo(mini);
    const setPos = (ll, zoom) => {
      st.pos = [Math.round(ll[0] * 1e6) / 1e6, Math.round(ll[1] * 1e6) / 1e6];
      mk.setLatLng(st.pos).setOpacity(1);
      f.loc.value = `${st.pos[0]}, ${st.pos[1]}`;
      if (zoom) mini.setView(st.pos, zoom);
      err('');
    };
    siteFormPart(bg, err, f, mini, mk, setPos);
  }
  /* جزء من siteForm: mini.on('click', (e) => setPos([e.latlng.lat, e.la… */
  function siteFormPart(bg, err, f, mini, mk, setPos) {
    mini.on('click', (e) => setPos([e.latlng.lat, e.latlng.lng]));
    mk.on('dragend', () => {
      const ll = mk.getLatLng();
      setPos([ll.lat, ll.lng]);
    });
    setTimeout(() => mini.invalidateSize(), 50);
    const find = async () => {
      const v = f.loc.value.trim();
      if (!v) return;
      let p = parseLatLng(v);
      if (!p && /^https:\/\//i.test(v)) {
        try {
          const r = await api('GET', `/api/branch-map/resolve?url=${encodeURIComponent(v)}`);
          p = parseLatLng(r.url);
        } catch (e) {
          return err(e.message);
        }
      }
      if (!p) return err('لم أجد إحداثيات في الرابط — افتح الموقع في خرائط جوجل وانسخ الرابط من شريط العنوان، أو حدد على الخريطة');
      setPos(p, 17);
    };
    $('#smFind', bg).onclick = find;
    f.loc.onchange = find;
    f.branch.onchange = () => {
      if (!f.name.value.trim() && f.branch.value)
        f.name.value = `${f.type.value === 'فرع' ? 'فرع ' : `${f.type.value} — `}${f.branch.value}`;
    };
    $('[data-x]', bg).onclick = () => {
      mini.remove();
      bg.remove();
    };
  }

  return { viewBranchMap };
};
