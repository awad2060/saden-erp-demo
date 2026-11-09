'use strict';
/* صفحة سياسة الخصوصية (privacy.html): تبديل اللغة */
/* تبديل اللغة (ويُفتح بالإنجليزية من ?lang=en) */
const set = (l) => {
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'en' ? 'ltr' : 'rtl';
  document.getElementById('ar').hidden = l === 'en';
  document.getElementById('en').hidden = l !== 'en';
  document.getElementById('t').textContent = l === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية';
  document.getElementById('v').textContent = l === 'en' ? 'SADEN ERP — Last updated: 05/11/2026' : 'SADEN ERP — آخر تحديث: 05/11/2026';
  document.querySelectorAll('[data-l]').forEach((b) => b.classList.toggle('on', b.dataset.l === l));
};
document.querySelectorAll('[data-l]').forEach((b) => {
  b.onclick = () => set(b.dataset.l);
});
if (new URLSearchParams(location.search).get('lang') === 'en') set('en');
