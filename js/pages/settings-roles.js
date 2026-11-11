'use strict';
/* الإعدادات ← المستخدمون: الفئات الست (SF.CATEGORIES) ستة كروت، وبالضغط على الكارت صفحة الفئة (#/settings/roles/<id>):
 * «المستخدمون» فيها، و«الصلاحيات»: كل أيقونة بعلامة وتحتها أجزاؤها بعلامات.
 * العلامة الأولى حسب نوع الحساب، ويُحفظ ما غيّره المدير فقط (SF.mergePerms)، وتخصيص مستخدم بعينه يتقدم على فئته. */
window.SES_PAGE_KITS = window.SES_PAGE_KITS || {};
window.SES_PAGE_KITS['settings-roles'] = function (S, ctx) {
  const { $, $$, SF, api, esc, icon, isAdmin, navTree, navTreeWire, state } = S;
  const { viewSettings } = ctx;
  const canEditRoles = () => SF.settingsTabs(state.user).includes('roles');

  /* ---------- كروت الفئات في صفحة المستخدمين ---------- */
  const sortU = (xs) => xs.slice().sort((x, y) => Number(!x.active) - Number(!y.active) || x.name.localeCompare(y.name, 'ar'));
  function userLine(u) {
    const custom = Object.keys(u.pages || {}).length || Array.isArray(u.allowedForms);
    return `<li><a class="cat-u${u.active ? '' : ' off'}" href="#/settings/users/${u.id}"><b>${esc(u.name)}</b><small>${esc(u.title || u.branch || u.dept || '')}${u.branch && u.title ? ` — ${esc(u.branch)}` : ''}</small>${u.branchManager ? '<span class="u-tag mgr">مدير الفرع</span>' : ''}${custom ? '<span class="u-tag">عرض مخصص</span>' : ''}${u.active ? '' : '<span class="chip cancelled">موقوف</span>'}</a></li>`;
  }
  /* كارت الفئة: اسمها وعدد مستخدميها، والضغط يفتح صفحتها. مع البحث تظهر أسماء المطابقين تحته */
  function catCard(r, all, found, searching) {
    const name = r ? r.name : 'بدون فئة';
    const href = r ? `#/settings/roles/${r.id}` : '';
    const body = `<span class="cat-ic">${icon(r && r.base === 'admin' ? 'shield' : 'users')}</span><span class="cat-t"><b>${esc(name)}</b><small>${all.length} مستخدم${all.some((u) => !u.active) ? ` · ${all.filter((u) => !u.active).length} موقوف` : ''}</small></span><span class="cat-go">${icon('chevron')}</span>`;
    const hits = searching && found.length ? `<ul class="cat-users">${sortU(found).map(userLine).join('')}</ul>` : '';
    return `<section class="cat-card">${href ? `<a class="cat-h" href="${href}">${body}</a>` : `<div class="cat-h">${body}</div>`}${hits}</section>`;
  }
  /* box: مكان الكروت، match: فلتر البحث. حسابات الموظفين الشخصية خارج الفئات */
  function categoryCards(box, users, roles, match, searching) {
    const accts = users.filter((u) => u.role !== 'employee');
    const cats = SF.CATEGORIES.map((c) => [roles.find((r) => r.id === c.id) || c, accts.filter((u) => u.roleId === c.id)]);
    const stray = accts.filter((u) => !SF.CATEGORIES.some((c) => c.id === u.roleId));
    if (stray.length) cats.push([null, stray]);
    box.innerHTML =
      cats
        .filter(([, xs]) => !searching || xs.some(match))
        .map(([r, xs]) => catCard(r, xs, xs.filter(match), searching))
        .join('') || '<div class="empty">لا يوجد مستخدمون مطابقون</div>';
  }

  /* ---------- صفحة صلاحيات الفئة ---------- */
  /* علامة بند (data-was: علامته عند الفتح، ليُحفظ ما تغيّر فقط) */
  function permBox(role, k, labelHtml, cls = '') {
    const on = role.base === 'admin' || SF.rolePermOn(role, k);
    return `<label class="check ${cls}"><input type="checkbox" data-rp="${esc(k)}" data-was="${on ? 1 : 0}"${on ? ' checked' : ''}${role.base === 'admin' ? ' disabled' : ''}> ${labelHtml}</label>`;
  }
  const allBtns = (box, role) =>
    role.base === 'admin'
      ? ''
      : `<span class="perm-all"><button type="button" class="btn sm ghost" data-rpall="${box}" data-on="1">تحديد الكل</button><button type="button" class="btn sm ghost" data-rpall="${box}" data-on="0">إلغاء الكل</button></span>`;
  /* الصفحات مجمّعة بما قبل «←» في اسمها (الإعدادات ← المستخدمون...) بنفس شكل الأيقونات */
  function pagesTree(role, pageList) {
    const groups = new Map();
    for (const [k, l] of pageList) {
      const [g, rest] = l.includes(' ← ') ? [l.split(' ← ')[0], l.split(' ← ').slice(1).join(' ← ')] : ['', l];
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push([k, rest]);
    }
    return [...groups]
      .map(([g, xs]) =>
        g
          ? `<div class="nt-g"><div class="nt-r nt-h perm-gt">${esc(g)}</div><div class="nt-kids">${xs.map(([k, l]) => permBox(role, k, esc(l), 'nt-r')).join('')}</div></div>`
          : xs.map(([k, l]) => permBox(role, k, esc(l), 'nt-r')).join(''),
      )
      .join('');
  }
  const tri = (role, k) => {
    const v = (role.caps || {})[k];
    return `<select class="in tri" data-rc="${esc(k)}"${role.base === 'admin' ? ' disabled' : ''}><option value="">حسب نوع الحساب</option><option value="1"${v === true ? ' selected' : ''}>نعم</option><option value="0"${v === false ? ' selected' : ''}>لا</option></select>`;
  };
  const formChecks = (attr, picked) =>
    SF.GROUPS.map((g) => {
      const fs = SF.FORMS.filter((f) => f.group === g && (attr !== 'data-rv' || !f.autoOnly));
      return fs.length
        ? `<div class="perm-g">${esc(g)}</div><div class="perm-flow">${fs.map((f) => `<label class="check"><input type="checkbox" ${attr}="${f.id}"${!picked || picked.includes(f.id) ? ' checked' : ''}> ${esc(f.title)}</label>`).join('')}</div>`
        : '';
    }).join('');
  /* الإجراءات ونطاق الطلبات ولوحة المؤشرات والخطابات */
  function moreHtml(role) {
    const dash = [...new Set(SF.DASH_SECTIONS.map((s) => s[2]))]
      .map(
        (g) =>
          `<div class="perm-g">${esc(g)}</div><div class="perm-flow">${SF.DASH_SECTIONS.filter((s) => s[2] === g)
            .map(
              ([k, l]) =>
                `<label class="check"><input type="checkbox" data-rds="${k}"${!Array.isArray(role.dashSections) || role.dashSections.includes(k) ? ' checked' : ''}> ${esc(l)}</label>`,
            )
            .join('')}</div>`,
      )
      .join('');
    const sc = role.viewScope;
    const radio = (name, val, on, label) =>
      `<label class="check"><input type="radio" name="${name}" value="${val}"${on ? ' checked' : ''}> ${label}</label>`;
    return `<div class="perm-cols">
      <div><h4>الإجراءات</h4>${SF.CAPS.map(([k, l]) => `<div class="row tri-row"><span>${esc(l)}</span>${tri(role, k)}</div>`).join('')}</div>
      <div><h4>نطاق عرض الطلبات</h4>
        <select class="in" id="rScope"${role.base === 'admin' ? ' disabled' : ''}><option value="">حسب "يرى جميع الطلبات"</option><option value="all"${sc === 'all' ? ' selected' : ''}>كل الطلبات</option><option value="branch"${sc === 'branch' ? ' selected' : ''}>يرى طلبات فرعه</option><option value="route"${sc === 'route' ? ' selected' : ''}>يرى ما عليه فقط (المارة عليه للاعتماد)</option></select>
        <div class="hint" style="margin-bottom:12px">ما يرفعه المستخدم أو يمر عليه للاعتماد يظهر له دائماً.</div>
        <div id="rViewBox" class="perm-view"${['all', 'branch'].includes(sc) ? '' : ' hidden'}><b>${sc === 'all' ? 'الطلبات التي يراها' : 'الطلبات التي يراها من فرعه'}</b>
          ${radio('rvm', 'same', !Array.isArray(role.viewForms), 'نفس الخطابات المتاحة له')}${radio('rvm', 'some', Array.isArray(role.viewForms), 'أنواع محددة فقط:')}
          <div id="rViewList"${Array.isArray(role.viewForms) ? '' : ' hidden'}>${formChecks('data-rv', role.viewForms)}</div></div>
        <h4>أقسام لوحة المؤشرات</h4>${radio('rdm', 'all', !Array.isArray(role.dashSections), 'كل الأقسام')}${radio('rdm', 'some', Array.isArray(role.dashSections), 'المحددة فقط:')}
        <div id="rDashList" class="perm-view"${Array.isArray(role.dashSections) ? '' : ' hidden'}>${dash}</div>
        <h4>الخطابات المتاحة (للرفع والاطلاع)</h4>${radio('rfm', 'all', !Array.isArray(role.allowedForms), 'كل الخطابات')}${radio('rfm', 'some', Array.isArray(role.allowedForms), 'المحددة فقط:')}
        <div id="rFormList"${Array.isArray(role.allowedForms) ? '' : ' hidden'}>${formChecks('data-rf', role.allowedForms)}</div></div></div>`;
  }
  /* مستخدمو الفئة (تبويب «المستخدمون») */
  const usersHtml = (list) =>
    `<div class="row" style="justify-content:flex-end;margin-bottom:10px"><a class="btn primary" href="#/settings/users/new">➕ مستخدم جديد</a></div>${list.length ? `<ul class="cat-users cat-users-page">${sortU(list).map(userLine).join('')}</ul>` : '<div class="empty">لا يوجد مستخدمون في هذه الفئة</div>'}
      <div class="hint">لنقل مستخدم لفئة أخرى افتح صفحته واختر فئته.</div>`;
  function pageHtml(role, list, pageList, tab) {
    const isAdm = role.base === 'admin';
    const tb = (k, l) => `<button type="button" class="tab${tab === k ? ' on' : ''}" data-rtab="${k}">${l}</button>`;
    return `<div class="card perm-page">
      <div class="perm-top"><a class="btn ghost sm" href="#/settings/users">→ الفئات</a><h2 class="perm-name">${esc(role.name)}</h2><small class="muted">${list.length} مستخدم</small>
        <span class="perm-acts">${tab === 'perms' ? '<button type="button" class="btn primary" id="rSave">💾 حفظ</button>' : ''}</span></div>
      <div class="tabs">${tb('users', `${icon('users')} المستخدمون`)}${canEditRoles() ? tb('perms', `${icon('settings')} الصلاحيات`) : ''}</div>
      ${tab === 'users' ? usersHtml(list) : permsHtml(role, pageList, isAdm)}</div>`;
  }
  function permsHtml(role, pageList, isAdm) {
    return `${isAdm ? '<div class="need-att">نوع الحساب "مدير نظام": له كل الإجراءات والصفحات دائماً.</div>' : '<div class="hint">العلامة = يظهر لهذه الفئة. العلامات الأولى حسب نوع الحساب، ويُحفظ ما تغيّره فقط. وما تخصصه لمستخدم بعينه (من صفحته) يتقدم على الفئة. شِل علامة أيقونة لإخفائها بكل ما تحتها.</div>'}
      <section class="perm-sec"><div class="perm-sh"><h3>${icon('grid')} التطبيقات وما بداخلها</h3>${allBtns('#rNavTree', role)}</div>
        <div class="nav-tree perm-tree" id="rNavTree">${navTree((k, l, ic, d, g) => permBox(role, k, `<span class="nt-ic">${ic}</span> ${esc(l)}`, `nt-r${g ? ' nt-h' : ''}`))}</div></section>
      <section class="perm-sec"><div class="perm-sh"><h3>${icon('fileText')} الصفحات والإعدادات</h3>${allBtns('#rPages', role)}</div>
        <div class="nav-tree perm-tree" id="rPages">${pagesTree(role, pageList)}</div></section>
      <section class="perm-sec"><h3>${icon('shield')} الإجراءات ونطاق الطلبات والخطابات</h3>${moreHtml(role)}</section>
      <div class="ferr"></div>
      <div class="row save-bar"><button type="button" class="btn primary" id="rSave2">💾 حفظ صلاحيات الفئة</button></div>`;
  }
  /* قراءة الصفحة إلى الفئة */
  function collect(body, role) {
    const pick = (sel, attr) =>
      $$(sel, body)
        .filter((c) => c.checked)
        .map((c) => c.dataset[attr]);
    const radio = (n) => ($(`input[name="${n}"]:checked`, body) || {}).value;
    role.caps = Object.fromEntries(
      $$('[data-rc]', body)
        .filter((x) => x.value !== '')
        .map((x) => [x.dataset.rc, x.value === '1']),
    );
    role.pages = SF.mergePerms(
      role.pages,
      $$('[data-rp]', body).map((x) => [x.dataset.rp, x.dataset.was === '1', x.checked]),
    );
    role.viewScope = $('#rScope', body).value || undefined;
    role.allowedForms = radio('rfm') === 'some' ? pick('[data-rf]', 'rf') : null;
    role.dashSections = radio('rdm') === 'some' ? pick('[data-rds]', 'rds') : null;
    role.viewForms = ['all', 'branch'].includes(role.viewScope) && radio('rvm') === 'some' ? pick('[data-rv]', 'rv') : null;
  }
  function wirePage(body, role, draw, save) {
    $$('[data-rtab]', body).forEach((b) => {
      b.onclick = () => draw(b.dataset.rtab);
    });
    if (!$('#rNavTree', body)) return;
    navTreeWire($('#rNavTree', body), (r) => $('input', r).checked);
    $$('[data-rpall]', body).forEach((b) => {
      b.onclick = () => {
        $$(`${b.dataset.rpall} [data-rp]`, body).forEach((c) => {
          c.checked = b.dataset.on === '1';
        });
        $('#rNavTree', body).dispatchEvent(new Event('change'));
      };
    });
    const show = (id, on) => {
      $(id, body).hidden = !on;
    };
    $('#rScope', body).onchange = () => show('#rViewBox', ['all', 'branch'].includes($('#rScope', body).value));
    for (const [n, box] of [
      ['rvm', '#rViewList'],
      ['rdm', '#rDashList'],
      ['rfm', '#rFormList'],
    ])
      $$(`input[name="${n}"]`, body).forEach((x) => {
        x.onchange = () => show(box, x.value === 'some');
      });
    $('#rSave', body).onclick = save;
    $('#rSave2', body).onclick = save;
  }
  async function settingsRoles(body, settings, users, saveSettings, sub) {
    if (!sub) {
      location.hash = '#/settings/users';
      return;
    }
    const found = (settings.roles || []).find((r) => r.id === sub);
    if (!found) {
      body.innerHTML = '<div class="empty">الفئة غير موجودة — <a href="#/settings/users">المستخدمون</a></div>';
      return;
    }
    const role = JSON.parse(JSON.stringify(found));
    const list = users.filter((u) => u.roleId === role.id && u.role !== 'employee');
    const tools = isAdmin() ? await api('GET', '/api/admin/tools') : [];
    const pageList = [...SF.PAGES, ...tools.map((t) => [`tool:${t.file}`, `النماذج والأدوات ← ${t.title}`])];
    const others = () => (settings.roles || []).map((r) => (r.id === role.id ? role : r));
    let tab = 'users';
    const save = async () => {
      collect(body, role);
      try {
        await saveSettings({ roles: others() }, 'تم حفظ صلاحيات الفئة');
        draw('perms');
      } catch (err) {
        $('.ferr', body).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    /* التبديل بين التبويبين يحفظ علامات «الصلاحيات» في الذاكرة حتى «حفظ» */
    const draw = (next) => {
      if (tab === 'perms' && $('#rNavTree', body)) collect(body, role);
      tab = next || tab;
      body.innerHTML = pageHtml(role, list, pageList, tab);
      wirePage(body, role, draw, save);
    };
    draw('users');
  }

  return { settingsRoles, categoryCards };
};
