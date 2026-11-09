'use strict';
/* صفحة «org-chart» (viewOrgPrint، viewOrg) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...).
 * المتغيرات المشتركة القابلة للتغيير تُقرأ وتُكتب عبر S.<الاسم> مباشرة. */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['org-chart'] = function (S) {
  const { $, $$, api, app, esc, head, money, ocClosed, orgChartHtml, shell, toast } = S;
  /* صفحة طباعة الهيكل (لتنزيله PDF من السيرفر): A4 بالعرض، العنوان ثم الرسم مصغّراً ليملأ الصفحة */
  async function viewOrgPrint(query) {
    window.__printReady = false;
    const d = await api('GET', '/api/about');
    S.ocMode = query.mode === 'br' ? 'br' : 'co';
    S.ocBranch = query.branch || '';
    S.ocInit = true;
    ocClosed.clear();
    String(query.closed || '')
      .split(',')
      .filter(Boolean)
      .forEach((id) => ocClosed.add(id));
    const chart = orgChartHtml(d, true);
    const br = (d.units.find((u) => u.id === S.ocBranch) || {}).name || '';
    const title = S.ocMode === 'br' ? (br ? `الهيكل الإداري لفرع ${br}` : 'الهيكل الإداري للفروع') : `الهيكل الإداري — ${d.company || ''}`;
    document.title = title;
    app.innerHTML = `<div class="oc-printpage"><div class="ocp-h"><img src="logo.png" alt=""><h2>${esc(title)}</h2></div><div class="oc" id="oc">${chart}</div></div>`;
    const oc = $('#oc', app);
    const W = ((297 - 16) * 96) / 25.4,
      H = ((210 - 16) * 96) / 25.4 - 60;
    const fitOne = (el) => {
      el.style.zoom = 1;
      el.style.zoom = Math.min(1, W / el.scrollWidth, H / el.scrollHeight).toFixed(3);
    };
    const fit = () => {
      const blks = $$('.oc-blk', oc);
      if (blks.length) blks.forEach(fitOne);
      else fitOne(oc);
    };
    fit();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    fit();
    window.__printReady = true;
  }

  async function viewOrg(query) {
    /* حالة الصفحة: ما يتغير بعد العرض (d، edit، D) */
    const st = {};
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/org');
    st.d = await api('GET', '/api/org');
    /* الإدارات والأقسام تُعدَّل من الإعدادات ← التقسيم الإداري، وتُعرض في حول الشركة */
    const tab = query.tab === 'cc' ? 'cc' : 'jobs';
    st.edit = false;
    const draft = () => ({
      units: st.d.units.map((x) => ({ ...x })),
      grades: st.d.grades.map((x) => ({ ...x })),
      jobs: st.d.jobs.map((x) => ({ ...x })),
      costCenters: st.d.costCenters.map((x) => ({ ...x })),
      branchCC: { ...(st.d.branchCC || {}) },
    });
    st.D = draft();
    const opt = (list, v, empty = '—') =>
      `<option value="">${empty}</option>${list.map(([val, l]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}`;
    viewOrgPart2(st);
    const row = (cells, i, key) => `<tr>${cells}<td><button class="btn sm bad" data-del="${key}:${i}">✕</button></td></tr>`;
    const inp = (key, i, f, v, extra = '') => `<input class="in" data-o="${key}:${i}:${f}" value="${esc(v == null ? '' : v)}" ${extra}>`;
    return viewOrgPart3(draft, inp, main, opt, row, st, tab);
  }
  /* جزء من viewOrg: const sel = (key, i, f, list, v) => `<select class… */
  function viewOrgPart3(draft, inp, main, opt, row, st, tab) {
    const sel = (key, i, f, list, v) => `<select class="in" data-o="${key}:${i}:${f}">${opt(list, v)}</select>`;
    const ccList = () => st.D.costCenters.filter((c) => c.code).map((c) => [c.code, `${c.code}${c.name ? ` — ${c.name}` : ''}`]);
    const body = () => {
      if (tab === 'jobs') {
        if (st.edit)
          return `<div class="card"><h3>الدرجات الوظيفية</h3><div class="hint">نطاق <b>الراتب الأساسي</b> لكل درجة — ويُنبَّه عن الموظفين خارج نطاق درجتهم.</div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>الدرجة</th><th>الحد الأدنى للأساسي</th><th>الحد الأعلى للأساسي</th><th></th></tr></thead><tbody>
          ${st.D.grades.map((g, i) => row(`<td>${inp('grades', i, 'name', g.name)}</td><td>${inp('grades', i, 'min', g.min, 'type="number" min="0"')}</td><td>${inp('grades', i, 'max', g.max, 'type="number" min="0"')}</td>`, i, 'grades')).join('')}
          </tbody></table></div><button class="btn sm" data-add="grades" style="margin-top:8px">➕ درجة</button></div>
          <div class="card"><h3>دليل الوظائف</h3><div class="hint">المسمى كما تكتبه في «المسمى الوظيفي» بملف الموظف، ودرجته، والإدارة التي يتبعها.</div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>المسمى الوظيفي</th><th>الدرجة</th><th>الإدارة</th><th></th></tr></thead><tbody>
          ${st.D.jobs
            .map((j, i) =>
              row(
                `<td>${inp('jobs', i, 'title', j.title)}</td><td>${sel(
                  'jobs',
                  i,
                  'grade',
                  st.D.grades.filter((g) => g.name).map((g) => [g.name, g.name]),
                  j.grade,
                )}</td><td>${sel(
                  'jobs',
                  i,
                  'unit',
                  st.D.units.filter((u) => u.name).map((u) => [u.name, u.name]),
                  j.unit,
                )}</td>`,
                i,
                'jobs',
              ),
            )
            .join('')}
          </tbody></table></div><button class="btn sm" data-add="jobs" style="margin-top:8px">➕ وظيفة</button>
          ${
            st.d.unknownJob.length
              ? `<div class="hint" style="margin-top:12px">مسميات في ملفات الموظفين وغير موجودة في الدليل: ${st.d.unknownJob
                  .filter((x) => !x.name.startsWith('('))
                  .slice(0, 40)
                  .map((x) => `<button class="btn sm" data-addjob="${esc(x.name)}">➕ ${esc(x.name)} (${x.count})</button>`)
                  .join(' ')}</div>`
              : ''
          }</div>`;
        const g = Object.fromEntries(st.d.grades.map((x) => [x.name, x]));
        return `<div class="card"><h3>دليل الوظائف (${st.d.jobs.length})</h3>${
          st.d.jobs.length
            ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>المسمى الوظيفي</th><th>الدرجة</th><th>نطاق الأساسي</th><th>الإدارة</th><th>عدد الموظفين</th></tr></thead><tbody>
          ${st.d.jobs.map((j) => `<tr><td><b>${esc(j.title)}</b></td><td>${esc(j.grade || '—')}</td><td>${g[j.grade] ? `${esc(money(g[j.grade].min || 0))} – ${g[j.grade].max ? esc(money(g[j.grade].max)) : '∞'}` : '—'}</td><td>${esc(j.unit || '—')}</td><td class="num">${st.d.byJob[j.title] || 0}</td></tr>`).join('')}</tbody></table></div>`
            : '<div class="empty">لا توجد وظائف — اضغط «تعديل» لإضافة الدرجات والوظائف.</div>'
        }</div>
          <div class="card"><h3>موظفون خارج نطاق درجتهم (${st.d.outGrade.length})</h3>${st.d.outGrade.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>المسمى</th><th>الدرجة</th><th>الأساسي</th><th>النطاق</th></tr></thead><tbody>${st.d.outGrade.map((x) => `<tr class="click" data-go="#/employee/${x.empId}"><td><b>${esc(x.name)}</b> <small class="muted">${esc(x.empNo)}</small></td><td>${esc(x.title)}</td><td>${esc(x.grade)}</td><td class="num"><b class="bad-t">${esc(money(x.basic))}</b></td><td>${esc(money(x.min || 0))} – ${x.max ? esc(money(x.max)) : '∞'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="emp-al ok">✔ لا يوجد</div>'}</div>`;
      }
      if (st.edit)
        return `<div class="card"><h3>مراكز التكلفة</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الكود</th><th>الاسم</th><th></th></tr></thead><tbody>
        ${st.D.costCenters.map((c, i) => row(`<td>${inp('costCenters', i, 'code', c.code, 'dir="ltr"')}</td><td>${inp('costCenters', i, 'name', c.name)}</td>`, i, 'costCenters')).join('')}
        </tbody></table></div><button class="btn sm" data-add="costCenters" style="margin-top:8px">➕ مركز تكلفة</button></div>
        <div class="card"><h3>مركز التكلفة الافتراضي لكل فرع</h3><div class="hint">يستخدمه النظام لمن ليس له مركز تكلفة في ملفه ولا في إدارته.</div><div class="grid2">${st.d.branches.map((b) => `<div class="field"><label>${esc(b)}</label><select class="in" data-bcc="${esc(b)}">${opt(ccList(), st.D.branchCC[b])}</select></div>`).join('')}</div></div>`;
      return `<div class="card"><h3>مراكز التكلفة</h3><div class="hint">ترتيب الإسناد: مركز التكلفة في ملف الموظف ← إدارته (أو الإدارة الأعلى) ← فرعه. ويُستخدم في القيد المحاسبي لمسير الرواتب.</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>الكود</th><th>الاسم</th><th>الإدارات</th><th>الفروع</th><th>الموظفون</th></tr></thead><tbody>
        ${
          st.d.costCenters
            .map(
              (c) =>
                `<tr><td dir="ltr" style="text-align:right"><b>${esc(c.code)}</b></td><td>${esc(c.name)}</td><td>${esc(
                  st.d.units
                    .filter((u) => u.cc === c.code)
                    .map((u) => u.name)
                    .join('، ') || '—',
                )}</td><td>${esc(
                  Object.keys(st.d.branchCC || {})
                    .filter((b) => st.d.branchCC[b] === c.code)
                    .join('، ') || '—',
                )}</td><td class="num">${st.d.byCC[c.code] || 0}</td></tr>`,
            )
            .join('') || '<tr><td colspan="5" class="empty">لا توجد مراكز تكلفة</td></tr>'
        }
        ${st.d.byCC[''] ? `<tr><td colspan="4" class="muted">بدون مركز تكلفة (يستخدم النظام الفرع في القيد)</td><td class="num">${st.d.byCC['']}</td></tr>` : ''}</tbody></table></div></div>`;
    };
    return viewOrgPart(body, draft, main, st, tab);
  }
  /* جزء من viewOrg: const ccName = (c) => {… */
  function viewOrgPart2(st) {
    const ccName = (c) => {
      const x = st.d.costCenters.find((y) => y.code === c);
      return x ? `${x.code}${x.name ? ` — ${x.name}` : ''}` : c || '';
    };
  }
  /* جزء من viewOrg: const draw = () => {… */
  function viewOrgPart(body, draft, main, st, tab) {
    const draw = () => {
      main.innerHTML = `${head('الوظائف والدرجات ومراكز التكلفة', `دليل الوظائف ودرجاتها ونطاق رواتبها، ومراكز التكلفة — ${st.d.total} موظف نشط`, st.d.canEdit ? (st.edit ? '<button class="btn" id="orgCancel">إلغاء</button><button class="btn primary" id="orgSave">💾 حفظ</button>' : '<button class="btn primary" id="orgEdit">✏️ تعديل</button>') : '')}
        <div class="tabs">${[
          ['jobs', 'الوظائف والدرجات'],
          ['cc', 'مراكز التكلفة'],
        ]
          .map(([k, l]) => `<a href="#/org?tab=${k}" class="${tab === k ? 'on' : ''}">${l}</a>`)
          .join('')}</div>
        ${body()}<div class="ferr"></div>`;
      $$('[data-go]', main).forEach((tr) => {
        tr.onclick = () => {
          location.hash = tr.dataset.go;
        };
      });
      if ($('#orgEdit'))
        $('#orgEdit').onclick = () => {
          st.edit = true;
          st.D = draft();
          draw();
        };
      if ($('#orgCancel'))
        $('#orgCancel').onclick = () => {
          st.edit = false;
          draw();
        };
      if (!st.edit) return;
      main.oninput = main.onchange = (e) => {
        const x = e.target;
        if (x.dataset.o) {
          const [k, i, f] = x.dataset.o.split(':');
          st.D[k][Number(i)][f] = x.value;
        }
        if (x.dataset.bcc !== undefined) {
          if (x.value) st.D.branchCC[x.dataset.bcc] = x.value;
          else delete st.D.branchCC[x.dataset.bcc];
        }
      };
      const blank = {
        units: () => ({ id: Math.random().toString(16).slice(2, 14), name: '', parent: '', manager: '', cc: '' }),
        grades: () => ({ name: '', min: '', max: '' }),
        jobs: () => ({ title: '', grade: '', unit: '' }),
        costCenters: () => ({ code: '', name: '' }),
      };
      $$('[data-add]', main).forEach((b) => {
        b.onclick = () => {
          st.D[b.dataset.add].push(blank[b.dataset.add]());
          draw();
        };
      });
      $$('[data-addjob]', main).forEach((b) => {
        b.onclick = () => {
          st.D.jobs.push({ ...blank.jobs(), title: b.dataset.addjob });
          b.remove();
          draw();
        };
      });
      $$('[data-del]', main).forEach((b) => {
        b.onclick = () => {
          const [k, i] = b.dataset.del.split(':');
          st.D[k].splice(Number(i), 1);
          draw();
        };
      });
      $('#orgSave').onclick = async () => {
        try {
          st.d = await api('PUT', '/api/org', st.D);
          st.edit = false;
          toast('تم الحفظ');
          draw();
        } catch (err) {
          $('.ferr', main).innerHTML = `<div class="err">${esc(err.message)}</div>`;
        }
      };
    };
    draw();
  }

  return { viewOrgPrint, viewOrg };
};
