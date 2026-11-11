/* نسخة العرض من نظام SES (GitHub Pages): لا خادم ولا قاعدة بيانات.
 * - طلبات القراءة (GET /api/...) تُجاب من ردود مسجلة مسبقاً من نسخة النظام ببيانات وهمية (demo-api.js)
 * - الحفظ والتعديل والحذف لا تُنفذ: ترد برسالة «نسخة عرض»
 * - المسارات المطلقة لملفات الواجهة تُحوَّل لمكان النسخة (المستودع تحت /اسم-المستودع/) */
(function () {
  'use strict';
  const DATA = window.SES_DEMO_API || {};
  const BASE = location.pathname.replace(/[^/]*$/, '');
  const realFetch = window.fetch.bind(window);
  const MSG = 'نسخة عرض: التعديلات غير متاحة — البيانات وهمية ولا تُحفظ';
  const jsonRes = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  /* الرد المسجل: بالرابط كاملاً، وإلا أول رد مسجل لنفس المسار */
  function recorded(path) {
    if (DATA[path]) return DATA[path];
    const p = path.split('?')[0];
    const k = Object.keys(DATA).find((x) => x.split('?')[0] === p);
    return k ? DATA[k] : null;
  }
  function toResponse(r) {
    const headers = { 'Content-Type': r.t || 'application/json' };
    if (!r.b64) return new Response(r.b, { status: r.s, headers });
    const bin = atob(r.b);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(bytes, { status: r.s, headers });
  }
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input.url;
    const u = new URL(url, location.href);
    if (u.origin !== location.origin) return realFetch(input, init);
    const method = ((init && init.method) || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
    if (u.pathname.startsWith('/api/')) {
      if (method === 'GET') {
        const r = recorded(u.pathname + u.search);
        return Promise.resolve(r ? toResponse(r) : jsonRes(404, { error: 'هذه الصفحة غير متاحة في نسخة العرض' }));
      }
      if (u.pathname === '/api/logout') return Promise.resolve(jsonRes(200, {}));
      return Promise.resolve(jsonRes(403, { error: MSG }));
    }
    /* ملفات الواجهة بمسار مطلق (img/...) ← مكان النسخة */
    if (!u.pathname.startsWith(BASE)) return realFetch(BASE + u.pathname.replace(/^\//, '') + u.search, init);
    return realFetch(input, init);
  };
  /* الدردشة المباشرة (بث الرسائل) غير متاحة بلا خادم */
  window.EventSource = function () {
    this.readyState = 1;
    this.close = () => {};
    this.addEventListener = () => {};
  };
  /* شريط تعريفي ثابت */
  addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('div');
    bar.textContent = 'نسخة عرض لنظام SES — بيانات وهمية، والتعديلات لا تُحفظ';
    bar.style.cssText =
      'position:fixed;bottom:12px;left:12px;z-index:99999;background:#8b1a1a;color:#fff;font:600 12.5px Tajawal,Tahoma,sans-serif;padding:6px 12px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.25);pointer-events:none;opacity:.92';
    document.body.appendChild(bar);
  });
})();
