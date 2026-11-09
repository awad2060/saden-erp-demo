'use strict';
/* صفحة «emp-affairs» (viewEmpAffairs) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['emp-affairs'] = function (S) {
  const { $, $$, APP_TONES, esc, icon, shell, state } = S;
  /* شئون الموظفين: كروت للصفحات التابعة (حسب صلاحيات المستخدم) */
  function viewEmpAffairs() {
    const main = shell('', '#/emp-affairs');
    const L = state.empAffairs || [];
    if (!L.length) {
      location.hash = '#/';
      return;
    }
    const DESC = {
      '#/iqamas': 'الإقامات المنتهية والقريبة من الانتهاء وتجديدها',
      '#/employees-ended': 'من انتهت خدماتهم وتصفياتهم وأسباب الانتهاء',
      hiring: 'طلبات التوظيف واستمارات المرشحين والعروض الوظيفية',
      empTransfer: 'قرارات نقل الموظفين بين الفروع',
      workStart: 'مباشرات العمل: التعيين الجديد والعودة من الإجازة',
      '#/contracts': 'حالة العقود والتجديد وتنبيه المادة 55',
      '#/attendance': 'البصمة والحضور والانصراف والتأخير والغياب',
      '#/gosi': 'الاشتراك والمطلوب إضافته واستبعاده ومطابقة الكشف',
      '#/org': 'دليل الوظائف ودرجاتها ونطاق رواتبها، ومراكز التكلفة',
    };
    const key = (h) => (h.includes('?type=') ? h.split('?type=')[1] : h);
    /* نفس أيقونات صفحة التطبيقات وألوانها، والوصف عند الوقوف على الأيقونة، والعرض شبكة أو قائمة (نفس اختيار التطبيقات) */
    const VK = `apps-view:${state.user.id}`;
    let view = 'grid';
    try {
      view = localStorage.getItem(VK) === 'list' ? 'list' : 'grid';
    } catch {
      /* تجاهل */
    }
    main.innerHTML = `<div class="ap-wrap"><div class="ap-head"><div><h1>شئون الموظفين</h1><div class="muted">اختر الصفحة</div></div>
        <div class="ap-tools"><span class="ap-vw"><button type="button" data-vw="grid" title="عرض شبكة">${icon('grid')}</button><button type="button" data-vw="list" title="عرض قائمة تحت بعض">${icon('list')}</button></span></div></div>
      <div class="ap-backrow"><a class="btn sm ap-back" href="#/apps?g=hr">→ رجوع</a></div>
      <div class="ap-grid" id="apGrid">${L.map(([h, ic, t], i) => {
        const [a, c, d] = APP_TONES[i % APP_TONES.length];
        return `<a class="ap-t" href="${h}" title="${esc(DESC[key(h)] || t)}"><span class="ap-g" style="--a:${a};--b:${c};--c:${d}"><i class="ap-x"></i><i class="ap-y"></i>${ic}</span><span class="ap-l">${esc(t)}<small class="ap-d">${esc(DESC[key(h)] || '')}</small></span></a>`;
      }).join('')}</div></div>`;
    const grid = $('#apGrid', main);
    const setView = (v) => {
      grid.classList.toggle('list', v === 'list');
      $$('[data-vw]', main).forEach((b) => b.classList.toggle('on', b.dataset.vw === v));
      try {
        localStorage.setItem(VK, v);
      } catch {
        /* تجاهل */
      }
    };
    $$('[data-vw]', main).forEach((b) => {
      b.onclick = () => setView(b.dataset.vw);
    });
    setView(view);
  }

  return { viewEmpAffairs };
};
