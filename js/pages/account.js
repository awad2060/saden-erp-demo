'use strict';
/* صفحة «account» (viewAccount) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['account'] = function (S) {
  const {
    $,
    api,
    app,
    asGet,
    asSet,
    assistantInit,
    esc,
    fmtDate,
    head,
    isApprover,
    pushEndpoint,
    refreshStats,
    shell,
    signatureBox,
    state,
    toast,
    today,
  } = S;
  /* ---------- التفويض ---------- */
  async function delegateBox(box) {
    const approvers = (await api('GET', '/api/approvers')).filter((a) => a.id !== state.user.id);
    const d = state.user.delegate;
    const active = d && today() >= d.from && today() <= d.until;
    box.innerHTML = `<h3>التفويض أثناء الغياب</h3>
      ${d ? `<div class="${active ? 'need-att' : 'muted'}" style="margin-bottom:10px">${active ? 'تفويض ساري:' : 'تفويض مسجل:'} ${esc(d.toName)} من ${esc(fmtDate(d.from))} إلى ${esc(fmtDate(d.until))}</div>` : ''}
      <div class="field" style="margin-bottom:10px"><label>المفوَّض</label><select class="in" id="dTo"><option value="">— اختر —</option>${approvers.map((a) => `<option value="${a.id}"${d && d.to === a.id ? ' selected' : ''}>${esc(a.name)}${a.title ? ` — ${esc(a.title)}` : ''}</option>`).join('')}</select></div>
      <div class="grid2"><div class="field"><label>من تاريخ</label><input class="in" type="date" id="dFrom" value="${esc(d ? d.from : today())}"></div><div class="field"><label>إلى تاريخ</label><input class="in" type="date" id="dUntil" value="${esc(d ? d.until : '')}"></div></div>
      <div class="hint" style="margin:8px 0">خلال هذه الفترة تصل طلباتك للمفوَّض أيضاً، ويعتمدها باسمه مع عبارة "نيابة عنك". تبقى أنت قادراً على الاعتماد.</div>
      <div class="row"><button type="button" class="btn primary" id="dSave">حفظ التفويض</button>${d ? '<button type="button" class="btn ghost" id="dClear">إلغاء التفويض</button>' : ''}</div>`;
    const put = async (body, msg) => {
      try {
        const r = await api('PUT', '/api/me/delegate', body);
        state.user = r.user;
        toast(msg);
        delegateBox(box);
      } catch (err) {
        toast(err.message, true);
      }
    };
    $('#dSave', box).onclick = () =>
      put({ to: $('#dTo', box).value, from: $('#dFrom', box).value, until: $('#dUntil', box).value }, 'تم حفظ التفويض');
    if ($('#dClear', box)) $('#dClear', box).onclick = () => put({ to: '' }, 'تم إلغاء التفويض');
  }

  /* ---------- حسابي ---------- */
  function viewAccount() {
    const forced = state.user.mustChange;
    const html = `${head('حسابي', `${esc(state.user.name)} — ${esc(state.user.roleLabel)}`)}
      ${forced ? '<div class="err">لأمان حسابك، يجب تغيير كلمة المرور المؤقتة قبل استخدام النظام.</div>' : ''}
      <div class="acc-grid"><form class="card" id="pf">
        <h3>تغيير كلمة المرور</h3>
        <div class="field" style="margin-bottom:12px"><label>كلمة المرور الحالية</label><input class="in" type="password" name="current" autocomplete="current-password" dir="ltr"></div>
        <div class="field" style="margin-bottom:12px"><label>كلمة المرور الجديدة (${state.config.passwordMin || 6} أحرف على الأقل)</label><input class="in" type="password" name="password" autocomplete="new-password" dir="ltr"></div>
        <div class="field" style="margin-bottom:12px"><label>تأكيد كلمة المرور الجديدة</label><input class="in" type="password" name="confirm" autocomplete="new-password" dir="ltr"></div>
        <div id="perr"></div>
        <div class="row"><button class="btn primary">حفظ</button>${forced ? '<button type="button" class="btn ghost" id="lo2">تسجيل الخروج</button>' : ''}</div>
      </form>
      ${!forced ? `<div class="card" id="sigCard"></div>` : ''}
      ${!forced && isApprover() ? `<div class="card" id="delCard"></div>` : ''}
      ${!forced ? `<div class="card" id="asCard"><h3>مساعد النظام "سند"</h3><p class="muted" style="margin-top:0">الشخصية أسفل الشاشة: اضغط عليها لتسألها، واسحبها لأي مكان.</p><div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="asTog"></button><button type="button" class="btn ghost" id="asPos">إعادته لمكانه الأصلي</button><button type="button" class="btn ghost" id="asStyle"></button></div></div>` : ''}</div>`;
    if (forced) app.innerHTML = `<div class="main" style="max-width:700px;margin:0 auto">${html}</div>`;
    else shell(html, '#/account');
    if ($('#delCard')) delegateBox($('#delCard'));
    if ($('#asTog')) {
      const lbl = () => {
        $('#asTog').textContent = asGet('hidden', false) ? '👁 إظهار المساعد' : 'إخفاء المساعد';
      };
      lbl();
      $('#asTog').onclick = () => {
        const h = !asGet('hidden', false);
        asSet('hidden', h);
        const el = document.getElementById('assist');
        if (el) el.hidden = h;
        else assistantInit();
        lbl();
        toast(h ? 'أخفيت المساعد' : 'ظهر المساعد أسفل الشاشة');
      };
      const drop = () => {
        const el = document.getElementById('assist');
        if (el) {
          if (el._eng) el._eng.dispose();
          clearInterval(el._idle);
          el.remove();
        }
      };
      $('#asPos').onclick = () => {
        asSet('pos', null);
        asSet('hidden', false);
        drop();
        assistantInit();
        lbl();
        toast('عاد المساعد لمكانه أسفل يسار الشاشة');
      };
      const slbl = () => {
        $('#asStyle').textContent = asGet('style', '3d') === '3d' ? 'الشكل: مجسّم 3D (تغيير للصورة)' : 'الشكل: صورة (تغيير لمجسّم 3D)';
      };
      slbl();
      $('#asStyle').onclick = () => {
        asSet('style', asGet('style', '3d') === '3d' ? 'img' : '3d');
        asSet('hidden', false);
        drop();
        assistantInit();
        slbl();
        lbl();
        toast(asGet('style', '3d') === '3d' ? 'المساعد الآن مجسّم ثلاثي الأبعاد' : 'المساعد الآن بالصورة');
      };
    }
    if ($('#sigCard'))
      signatureBox($('#sigCard'), state.user, '/api/me/signature', (u) => {
        state.user = u;
      });
    wireAccount(forced);
  }
  /* أحداث viewAccount: #lo2، #pf */
  function wireAccount(forced) {
    if ($('#lo2'))
      $('#lo2').onclick = async () => {
        await api('POST', '/api/logout', { pushEndpoint: await pushEndpoint() }).catch(() => {});
        state.user = null;
        state.pushSynced = false;
        location.hash = '#/login';
      };
    $('#pf').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      if (fd.get('password') !== fd.get('confirm')) {
        $('#perr').innerHTML = '<div class="err">كلمتا المرور غير متطابقتين</div>';
        return;
      }
      try {
        const r = await api('POST', '/api/me/password', { current: fd.get('current'), password: fd.get('password') });
        state.user = r.user;
        toast('تم تغيير كلمة المرور');
        if (forced) {
          await refreshStats();
          location.hash = '#/';
        } else e.target.reset();
      } catch (err) {
        $('#perr').innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
  }

  return { viewAccount };
};
