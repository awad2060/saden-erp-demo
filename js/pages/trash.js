'use strict';
/* صفحة «trash» (viewTrash) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['trash'] = function (S) {
  const { $, can, head, settingsTrash, shell } = S;
  /* ---------- سلة المحذوفات: الاسترجاع خلال 30 يوماً، وبعدها حذف نهائي تلقائي ---------- */
  async function viewTrash() {
    if (!can('settings.trash')) {
      location.hash = '#/';
      return;
    }
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/trash');
    main.innerHTML = `${head('سلة المحذوفات', 'محذوفات النظام تبقى 30 يوماً ويمكن استرجاعها كما كانت')}<div id="trBody"></div>`;
    await settingsTrash($('#trBody', main));
  }

  return { viewTrash };
};
