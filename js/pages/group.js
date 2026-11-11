'use strict';
/* صفحة «إدارة المجموعة» (#/group) لأعضاء المجموعة: أول شاشة بعد الدخول، بالهوية البصرية للنظام
 * (أيقونات صفحة التطبيقات وألوانها، ورأس الصفحة وبطاقات الأرقام والجداول نفسها).
 * كل إدارة (#/group?d=<المفتاح>) تعرض أرقامها مجمّعة من كل الشركات (GET /api/group/summary/<المفتاح>): الإجمالي ثم صف لكل شركة.
 * أرقام كل إدارة في server/modules/group/application (core.js وcontrol.js وsupport.js). */
(function () {
  /* الأقسام: [العنوان، [[المفتاح، العنوان، الأيقونة، الوصف، soon: لا بيانات لها بعد]]]
   * إدارات المجموعة الست (قرار الإدارة 2026-11): المالية، والموارد البشرية، والحوكمة والامتثال، والتدريب والتطوير، والتسويق، والتخطيط الاستراتيجي.
   * وقبلها «شركات المجموعة» (#/companies)؛ وأرقام الإدارات في server/modules/group/application */
  const SECTIONS = [
    [
      'إدارات المجموعة',
      [
        ['companies', 'شركات المجموعة', 'buildings', 'الدخول إلى نظام كل شركة وبياناتها'],
        ['fin', 'الإدارة المالية', 'wallet', 'الرواتب والمستحقات والسلف والمصروفات'],
        ['hr', 'الموارد البشرية', 'users', 'الموظفون والتوطين والإقامات'],
        ['gov', 'الحوكمة والامتثال', 'scale', 'المخاطر والسياسات والتدقيق وتعارض المصالح والبلاغات'],
        ['train', 'التدريب والتطوير', 'fileAward', 'الدورات والحضور والاجتياز'],
        ['mkt', 'التسويق', 'megaphone', 'العملاء والعقود والهوية والتعاميم'],
        ['strategy', 'التخطيط الاستراتيجي', 'target', 'الخطط والمبادرات والأهداف الاستراتيجية', true],
      ],
    ],
  ];
  /* رأس الصفحة (أيقونة المجموعة) + الإدارات: لون كل منها ثابت بترتيبه هنا */
  const COMPANIES = ['companies', 'شركات المجموعة', 'buildings', 'الدخول إلى نظام كل شركة'];
  /* إعدادات المجموعة (لمدير المجموعة فقط، بعد «شركات المجموعة»): إضافة الشركات وشعاراتها، والأعضاء وصلاحياتهم */
  const SETTINGS = ['settings', 'إعدادات المجموعة', 'settings', 'إضافة الشركات وشعاراتها، وأعضاء المجموعة وصلاحياتهم'];
  const ALL = [COMPANIES, SETTINGS, ...SECTIONS.flatMap(([, list]) => list)];
  const LINKS = { companies: '#/companies', settings: '#/companies?admin=1' };
  const hrefOf = (k) => LINKS[k] || `#/group?d=${k}`;
  /* لون كل إدارة ثابت بترتيبها (كما تُلوَّن أيقونات صفحة التطبيقات) */
  const toneOf = (S, k) => {
    const [a, b, c] = S.APP_TONES[ALL.findIndex((x) => x[0] === k) % S.APP_TONES.length];
    return `--a:${a};--b:${b};--c:${c};--m:${S.appHue(hrefOf(k))}`;
  };
  const badge = (S, k, ic, cls = 'ap-g') =>
    `<span class="${cls}" style="${toneOf(S, k)}"><i class="ap-x"></i><i class="ap-y"></i>${S.icon(ic)}</span>`;
  /* ما ليس في ملف التنسيق العام: بطاقة كل قسم وإداراته (أيقونة الإدارة ثم اسمها ووصفها، بألوان صفحة التطبيقات)، وشريط المقارنة بين الشركات */
  const CSS = `.grp{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.grp-sec-h{display:flex;align-items:center;gap:8px;margin:0 0 14px;font-size:16px}
.grp-sec-h .i{color:var(--text)}.grp-sec-h .chip{margin-inline-start:auto}
.grp-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
.grp-item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:18px 12px 16px;border-radius:12px;background:transparent;color:var(--text);text-decoration:none;transition:background-color .15s}
.grp-item:hover,.grp-item:focus-visible{background:color-mix(in srgb,var(--text) 6%,transparent)}
.grp-item .ap-g.ph-ic{width:52px;height:52px}
html.ap-formal .grp-item .ap-g.ph-ic .i{color:var(--text)}html.ap-formal .grp-item:hover .ap-g.ph-ic .i,html.ap-formal .grp-item:focus-visible .ap-g.ph-ic .i{color:var(--brand-ic,var(--brand))}
.grp-txt{min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px}
.grp-txt b{font-size:15px;line-height:1.4}.grp-txt small{color:var(--muted);font-size:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.grp-go{display:none}
.grp-item.soon{opacity:.75}.grp-txt .chip{font-size:11px}
@media (max-width:600px){.grp-list{grid-template-columns:1fr 1fr;gap:8px}.grp-item{padding:14px 8px 12px}.grp-txt small{display:none}.grp .card{padding:14px}}
.grp-bar{display:block;height:4px;border-radius:4px;margin-top:5px;width:var(--w);min-width:2px;background:var(--pg,var(--brand))}
.grp .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px;margin:0}
.grp .stat .n{white-space:nowrap}.grp .stat .n small{font-size:12px;font-weight:600}
.grp-soon{display:flex;flex-direction:column;align-items:center;gap:8px;padding:44px 16px;text-align:center}
.grp-tbl td{white-space:nowrap}.grp-tbl thead th{white-space:normal;min-width:72px;vertical-align:bottom;line-height:1.4}.grp-tbl tfoot th{background:var(--surface-2)}`;
  function style() {
    if (document.getElementById('grpCss')) return;
    const el = document.createElement('style');
    el.id = 'grpCss';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* أيقونة عنوان كل قسم بترتيب SECTIONS */
  const SEC_IC = ['layers'];
  function hub(S) {
    const { shell, esc, state, icon } = S;
    style();
    document.documentElement.style.removeProperty('--pg');
    const main = shell('', '#/group');
    const n = ((state.group && state.group.companies) || []).length;
    const item = ([k, t, ic, sub, soon]) =>
      `<a class="grp-item${soon ? ' soon' : ''}" href="${hrefOf(k)}">${badge(S, k, ic, 'ap-g ph-ic')}<span class="grp-txt"><b>${esc(t)}</b>${soon ? '<span class="chip">قيد الإنشاء</span>' : `<small>${esc(sub)}</small>`}</span>${soon ? '' : `<span class="grp-go">${icon('chevron')}</span>`}</a>`;
    const section = ([title, list], i) =>
      `<section class="card"><h2 class="grp-sec-h">${icon(SEC_IC[i])} ${esc(title)}<span class="chip">${list.length}</span></h2><div class="grp-list">${list.map(item).join('')}</div></section>`;
    const manage = !!(state.group && state.group.manage);
    const secs = SECTIONS.map(([t, list]) => [t, manage ? [list[0], SETTINGS, ...list.slice(1)] : list]);
    main.innerHTML = `<div class="grp"><div class="page-head ph-dec">${badge(S, 'companies', 'grid', 'ap-g ph-ic')}<div><h1>إدارة المجموعة</h1><p>أهلاً ${esc(state.user.name.split(' ')[0])} — ${n} شركة في المجموعة، وأرقام كل إدارة مجمّعة من كل الشركات</p></div></div>
      ${secs.map(section).join('')}</div>`;
  }

  /* قيمة الخلية: العدد، والمبلغ بالريال، والنسبة من بسطها ومقامها */
  const fmt = (v, kind) => {
    if (kind === 'sar') return `${Math.round(v || 0).toLocaleString('en-US')} <small class="muted">ريال</small>`;
    return kind === 'pct' ? `${v || 0}%` : Number(v || 0).toLocaleString('en-US');
  };
  function cell(row, [key, , kind]) {
    if (kind !== 'pct') return row[key] || 0;
    const [a, b] = key.split('/');
    return row[b] ? Math.round(((row[a] || 0) / row[b]) * 1000) / 10 : 0;
  }
  /* الإجمالي: مجموع قيم الشركات المتاحة، والنسبة من مجموع بسطها ومقامها */
  function totalOf(list) {
    const t = {};
    for (const x of list.filter((y) => !y.down))
      for (const [k, v] of Object.entries(x.row || {})) if (typeof v === 'number') t[k] = (t[k] || 0) + v;
    return t;
  }
  /* رأس الصفحة بأيقونة الإدارة ولونها (كرأس كل صفحات النظام) */
  const pageHead = (S, D, sub) =>
    `<div class="page-head ph-dec">${badge(S, D[0], D[2], 'ap-g ph-ic')}<div><h1>${S.esc(D[1])} — المجموعة</h1><p>${S.esc(sub)}</p></div><div class="row"><a class="btn" href="#/group">${S.icon('grid')} إدارة المجموعة</a></div></div>`;

  function table(S, d, tot) {
    const { esc } = S;
    const max = Math.max(1, ...d.list.map((x) => (x.down ? 0 : cell(x.row, d.cols[0]))));
    const row = (x) =>
      x.down
        ? `<tr><td><b>${esc(x.name)}</b></td><td colspan="${d.cols.length}"><span class="chip bad">غير متاحة الآن</span></td></tr>`
        : `<tr><td><a href="javascript:void 0" data-co="${esc(x.id)}" title="الدخول إلى نظام الشركة"><b>${esc(x.name)}</b></a><span class="grp-bar" style="--w:${(cell(x.row, d.cols[0]) / max) * 100}%"></span></td>${d.cols.map((c) => `<td class="num">${fmt(cell(x.row, c), c[2])}</td>`).join('')}</tr>`;
    return `<div class="card"><div class="tbl-wrap"><table class="tbl grp-tbl"><thead><tr><th>الشركة</th>${d.cols.map((c) => `<th>${esc(c[1])}</th>`).join('')}</tr></thead>
      <tbody>${d.list.map(row).join('')}</tbody><tfoot><tr><th>إجمالي المجموعة</th>${d.cols.map((c) => `<th class="num">${fmt(cell(tot, c), c[2])}</th>`).join('')}</tr></tfoot></table></div></div>`;
  }

  async function dept(S, key) {
    const { shell, api, $$, switchCo } = S;
    const D = ALL.find((x) => x[0] === key);
    if (!D || LINKS[key]) return (location.hash = '#/group');
    style();
    document.documentElement.style.setProperty('--pg', S.appHue(hrefOf(key)));
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/group');
    if (D[4]) {
      main.innerHTML = `<div class="grp">${pageHead(S, D, D[3])}<div class="card grp-soon">${badge(S, D[0], D[2], 'ap-g ph-ic')}<b>قيد الإنشاء</b><span class="muted">تظهر أرقامها هنا مجمّعة من كل الشركات عند بناء الإدارة في النظام</span></div></div>`;
      return;
    }
    const d = await api('GET', `/api/group/summary/${key}`);
    const tot = totalOf(d.list);
    const stats = d.cols
      .map(
        (c, i) =>
          `<div class="stat${i ? '' : ' hi'}"><div class="n">${fmt(cell(tot, c), c[2])}</div><div class="l">${S.esc(c[1])}</div></div>`,
      )
      .join('');
    main.innerHTML = `<div class="grp">${pageHead(S, D, `${D[3]} — مجمّعة من ${d.list.length} شركة`)}<div class="stats">${stats}</div>${table(S, d, tot)}</div>`;
    $$('[data-co]', main).forEach((a) => (a.onclick = () => switchCo(a.dataset.co)));
  }

  window.SES_ROUTES = window.SES_ROUTES || {};
  /* لأعضاء المجموعة فقط (أكثر من شركة)، وغيرهم إلى التطبيقات */
  window.SES_ROUTES.group = (S, query) => (!S.multiCo() ? (location.hash = '#/apps') : query.d ? dept(S, query.d) : hub(S));
})();
