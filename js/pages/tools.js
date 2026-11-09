'use strict';
/* صفحة «tools» (viewTools) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['tools'] = function (S) {
  const { api, esc, head, shell } = S;
  /* ---------- النماذج والأدوات القديمة ---------- */
  async function viewTools() {
    const main = shell('', '#/tools');
    const files = await api('GET', '/api/legacy');
    const isTool = (f) => f.kind === 'tool';
    const cards = (list, ic) =>
      `<div class="forms-grid">${list.map((f) => `<a class="form-card" href="/legacy/${encodeURIComponent(f.file)}" target="_blank"><div class="ic">${ic}</div><b>${esc(f.title)}</b></a>`).join('') || '<div class="muted">لا يوجد</div>'}</div>`;
    main.innerHTML = `${head('النماذج والأدوات المساعدة', 'نماذج وأدوات لا تحتاج مسار اعتماد (تفتح في نافذة جديدة)')}
      <div class="card"><h3>📄 النماذج</h3>${cards(
        files.filter((f) => !isTool(f)),
        '📄',
      )}</div>
      <div class="card"><h3>🧮 الأدوات</h3>${cards(files.filter(isTool), '🧮')}</div>`;
  }

  return { viewTools };
};
