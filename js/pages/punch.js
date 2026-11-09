'use strict';
/* صفحة «punch» (viewPunch) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['punch'] = function (S) {
  const { $, $$, SF, api, attMin, attTags, dt, esc, getPos, head, punchDeviceId, shell } = S;
  async function viewPunch() {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/punch');
    let d;
    try {
      d = await api('GET', `/api/punch?device=${encodeURIComponent(punchDeviceId())}`);
    } catch (err) {
      main.innerHTML = `${head('بصمتي', '')}<div class="card empty">${esc(err.message)}</div>`;
      return;
    }
    let timer;
    const draw = (msg, bad) => {
      const a = d.att || {};
      main.innerHTML = `${head('بصمتي', `${esc(d.name)} — ${esc(d.branch)}`)}
        <div class="card pn-card">
          <div class="pn-clock" id="pnClock"></div><div class="muted">${esc(SF.fmtDate(d.today))}</div>
          <div class="pn-st"><div><small>الحضور</small><b>${esc(a.in || '—')}</b></div><div><small>الانصراف</small><b>${esc(a.out || '—')}</b></div></div>
          ${d.todayAtt && d.todayAtt.shiftStart ? `<div class="muted" style="font-size:12.5px">الدوام ${esc(d.todayAtt.shiftStart)} — ${esc(d.todayAtt.shiftEnd)}</div>` : ''}
          ${d.todayAtt ? `<div class="pn-tags">${attTags(d.todayAtt)}${d.todayAtt.ot ? ` <span class="att-tag ot">ساعات عمل إضافي ${d.todayAtt.ot} س</span>` : ''}</div>` : ''}
          ${d.month ? `<div class="pn-month"><span>هذا الشهر:</span> حضور متأخر ${attMin(d.month.lateMin, d.month.lateDays)} · حضور مبكر ${attMin(d.month.earlyInMin || 0, d.month.earlyInDays || 0)} · انصراف مبكر ${attMin(d.month.earlyOutMin || 0, d.month.earlyOutDays || 0)} · انصراف متأخر ${attMin(d.month.lateOutMin || 0, d.month.lateOutDays || 0)} · ساعات عمل إضافي ${d.month.otHours || 0}</div>` : ''}
          ${!a.in ? '<button class="btn primary pn-btn" data-pn="in">👆 تسجيل الحضور</button>' : '<button class="btn pn-btn pn-out" data-pn="out">👋 تسجيل الانصراف</button>'}
          <div id="pnMsg" class="${msg ? `emp-al ${bad ? 'bad' : 'ok'}` : ''}" style="margin-top:12px">${msg ? esc(msg) : ''}</div>
          <div class="hint" style="margin-top:10px">${d.remote ? 'مسموح لك بالبصمة عن بُعد.' : d.geofence ? `يقبل النظام البصمة داخل نطاق الفرع (${d.geofence.radius} م).` : '⚠ لم يحدد مدير النظام موقع الفرع بعد — راجع شئون الموظفين.'} ${d.device ? (d.device.mine ? 'حسابك مربوط بهذا الجهاز للبصمة.' : '<b>⚠ حسابك مربوط بجهاز آخر للبصمة — اطلب من شئون الموظفين إلغاء ربطه لتبصم من هذا الجهاز.</b>') : 'أول بصمة تربط حسابك بهذا الجهاز.'}${window.isSecureContext ? '' : '<br><b>تحديد الموقع يحتاج فتح النظام باتصال آمن (https).</b>'}</div>
        </div>
        ${d.logs.length ? `<div class="card"><h3>آخر البصمات</h3>${d.logs.map((l) => `<div class="pn-log"><b>${l.type === 'in' ? 'حضور' : 'انصراف'}</b> <span>${esc(dt(l.at))}</span> <small class="muted">${l.remote ? 'عن بُعد' : l.dist != null ? `على بعد ${l.dist} م` : ''}</small></div>`).join('')}</div>` : ''}
        <div class="hint">لإضافة النظام لشاشة الجوال: من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية».</div>`;
      const tick = () => {
        const c = $('#pnClock');
        if (!c) {
          clearInterval(timer);
          return;
        }
        c.textContent = new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      };
      clearInterval(timer);
      tick();
      timer = setInterval(tick, 1000);
      $$('[data-pn]', main).forEach((b) => {
        b.onclick = async () => {
          b.disabled = true;
          $('#pnMsg').className = 'emp-al';
          $('#pnMsg').textContent = 'جاري تحديد موقعك...';
          try {
            let c = {};
            if (!d.remote) c = await getPos();
            else c = await getPos().catch(() => ({}));
            const x = await api('POST', '/api/punch', {
              type: b.dataset.pn,
              lat: c.latitude,
              lng: c.longitude,
              acc: c.accuracy,
              deviceId: punchDeviceId(),
            });
            d = await api('GET', `/api/punch?device=${encodeURIComponent(punchDeviceId())}`);
            draw(
              `✔ تم تسجيل ${x.type === 'in' ? 'الحضور' : 'الانصراف'} الساعة ${x.time}${x.dist != null ? ` (على بعد ${x.dist} م من الفرع)` : ''}`,
            );
          } catch (err) {
            draw(err.message, true);
          }
        };
      });
    };
    draw();
  }

  return { viewPunch };
};
