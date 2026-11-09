'use strict';
/* صفحة «kpi» (viewKpi) — منقولة من public/js/app.js كما هي دون تغيير في المنطق.
 * تُحمَّل قبل app.js، وتعمل داخله عند أول استخدام: S فيه أدوات app.js المشتركة (esc، api، icon ...). */
window.SES_PAGES = window.SES_PAGES || {};
window.SES_PAGES['kpi'] = function (S) {
  const { $, $$, api, downloadCsv, esc, head, kpiGrade, shell, toast, today } = S;
  async function viewKpi(query) {
    const main = shell('<div class="empty">جاري التحميل...</div>', '#/kpi');
    let d = await api('GET', '/api/kpi');
    const tab = query.tab === 'defs' ? 'defs' : 'eval';
    if (tab === 'defs') {
      let D = d.defs.map((x) => ({ ...x }));
      const draw = () => {
        const byU = {};
        D.forEach((x, i) => {
          (byU[x.unit || ''] = byU[x.unit || ''] || []).push(i);
        });
        main.innerHTML = `${head('مؤشرات الأداء (KPIs)', 'تحدد إدارة الجودة مؤشرات كل إدارة / قسم بوزنها ومستهدفها — والمؤشر بدون إدارة يطبقه النظام على كل الموظفين', '<button class="btn primary" id="kSave">💾 حفظ المؤشرات</button>')}
          <div class="tabs"><a href="#/kpi">التقييم الشهري</a><a href="#/kpi?tab=defs" class="on">تعريف المؤشرات</a></div>
          <datalist id="dl-kunits">${d.units.map((u) => `<option value="${esc(u)}">`).join('')}</datalist>
          <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الإدارة / القسم</th><th>المؤشر</th><th>طريقة القياس</th><th>المستهدف</th><th>الوزن %</th><th></th></tr></thead><tbody>
          ${D.map((x, i) => `<tr><td><input class="in" list="dl-kunits" data-k="${i}:unit" value="${esc(x.unit)}" placeholder="كل الموظفين"></td><td><input class="in" data-k="${i}:name" value="${esc(x.name)}" placeholder="مثال: نسبة إنجاز المهام في موعدها"></td><td><input class="in" data-k="${i}:measure" value="${esc(x.measure)}" placeholder="مثال: المنجز ÷ المخطط"></td><td><input class="in" data-k="${i}:target" value="${esc(x.target)}" style="max-width:110px"></td><td><input class="in" type="number" min="0" max="100" data-k="${i}:weight" value="${esc(x.weight)}" style="max-width:90px"></td><td><button class="btn sm bad" data-del="${i}">✕</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">لا توجد مؤشرات</td></tr>'}
          </tbody></table></div></div><button class="btn sm" id="kAdd">➕ مؤشر</button>
          ${
            Object.keys(byU).length
              ? `<div class="card"><h3>مجموع الأوزان لكل إدارة</h3><div class="org-chips">${Object.entries(byU)
                  .map(([u, ix]) => {
                    const w = ix.reduce((a, i) => a + (Number(D[i].weight) || 0), 0);
                    return `<span class="chip ${w === 100 ? 'approved' : 'late'}">${esc(u || 'كل الموظفين')}: ${w}%</span>`;
                  })
                  .join('')}</div><div class="hint">الأفضل أن يكون مجموع أوزان مؤشرات كل إدارة (مع المؤشرات العامة) 100%.</div></div>`
              : ''
          }<div class="ferr"></div>`;
        main.oninput = (e) => {
          const x = e.target;
          if (x.dataset.k) {
            const [i, f] = x.dataset.k.split(':');
            D[Number(i)][f] = x.value;
          }
        };
        $('#kAdd').onclick = () => {
          D.push({ id: '', unit: '', name: '', measure: '', target: '', weight: '' });
          draw();
        };
        $$('[data-del]', main).forEach((b) => {
          b.onclick = () => {
            D.splice(Number(b.dataset.del), 1);
            draw();
          };
        });
        $('#kSave').onclick = async () => {
          try {
            d = await api('PUT', '/api/kpi', { defs: D });
            D = d.defs.map((x) => ({ ...x }));
            toast('تم حفظ المؤشرات');
            draw();
          } catch (err) {
            $('.ferr', main).innerHTML = `<div class="err">${esc(err.message)}</div>`;
          }
        };
      };
      draw();
      return;
    }
    const month = /^\d{4}-\d{2}$/.test(query.month || '') ? query.month : today().slice(0, 7);
    const ev = await api(
      'GET',
      `/api/kpi/eval?month=${month}&unit=${encodeURIComponent(query.unit || '')}&branch=${encodeURIComponent(query.branch || '')}`,
    );
    const defById = Object.fromEntries(d.defs.map((x) => [x.id, x]));
    const cols = [...new Set(ev.rows.flatMap((r) => r.defs))].map((id) => defById[id]).filter(Boolean);
    renderViewKpi(cols, d, ev, main, month);
    viewKpiPart(cols, ev, main, month, query);
  }
  /* محتوى viewKpi (HTML) */
  function renderViewKpi(cols, d, ev, main, month) {
    main.innerHTML = `${head('مؤشرات الأداء (KPIs)', 'التقييم الشهري لكل موظف على مؤشرات إدارته (من 0 إلى 100) — ويُسجَّل في ملف الموظف (الأداء والتطوير)', '<button class="btn primary" id="kSaveE">💾 حفظ التقييم</button><button class="btn" id="kXls">⬇ Excel</button>')}
      <div class="tabs"><a href="#/kpi" class="on">التقييم الشهري</a><a href="#/kpi?tab=defs">تعريف المؤشرات</a></div>
      <div class="card tk-tools"><label>الشهر <input class="in" type="month" id="kM" value="${month}" style="width:auto"></label><select class="in" id="kU"><option value="">كل الإدارات</option>${d.units.map((u) => `<option${u === ev.unit ? ' selected' : ''}>${esc(u)}</option>`).join('')}</select><select class="in" id="kB"><option value="">كل الفروع</option>${d.branches.map((b) => `<option${b === ev.branch ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select><input class="in" id="kQ" placeholder="بحث..." style="flex:1"></div>
      ${
        !d.defs.length
          ? '<div class="card empty">لم تعرّف مؤشرات بعد — ابدأ من تبويب «تعريف المؤشرات».</div>'
          : `<div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الموظف</th>${cols.map((c) => `<th title="${esc(`${c.measure || ''}${c.target ? ` — المستهدف ${c.target}` : ''}`)}">${esc(c.name)}<div class="muted" style="font-size:11px">${c.unit ? esc(c.unit) : 'عام'}${c.weight ? ` · ${c.weight}%` : ''}</div></th>`).join('')}<th>الإجمالي</th><th>ملاحظة</th></tr></thead><tbody>
      ${
        ev.rows
          .map(
            (
              r,
            ) => `<tr data-emp="${r.empId}" data-s="${esc(`${r.name} ${r.empNo}`)}"><td><b>${esc(r.name)}</b><div class="muted" style="font-size:12px">${esc([r.empNo, r.department].filter(Boolean).join(' — '))}</div></td>${cols.map((c) => `<td>${r.defs.includes(c.id) ? `<input class="in" type="number" min="0" max="100" data-v="${c.id}" value="${esc(r.score && r.score.vals[c.id] != null ? r.score.vals[c.id] : '')}" style="max-width:80px">` : '<span class="muted">—</span>'}</td>`).join('')}
        <td class="num">${r.score ? `<b>${r.score.total}</b> <span class="chip ${kpiGrade(r.score.total)[1]}">${kpiGrade(r.score.total)[0]}</span>` : '—'}</td><td><input class="in" data-n value="${esc(r.score ? r.score.note : '')}"></td></tr>`,
          )
          .join('') || `<tr><td colspan="${cols.length + 3}" class="empty">لا يوجد موظفون</td></tr>`
      }</tbody></table></div></div>`
      }<div class="ferr"></div>`;
  }
  /* جزء من viewKpi: const go = () => {… */
  function viewKpiPart(cols, ev, main, month, query) {
    const go = () => {
      location.hash = `#/kpi?month=${$('#kM').value}&unit=${encodeURIComponent($('#kU').value)}&branch=${encodeURIComponent($('#kB').value)}`;
    };
    wireKpi(cols, ev, go, main, month, query);
  }
  /* أحداث viewKpi: #kM، #kU، #kB، #kQ، #kSaveE، #kXls */
  function wireKpi(cols, ev, go, main, month, query) {
    $('#kM').onchange = go;
    $('#kU').onchange = go;
    $('#kB').onchange = go;
    $('#kQ').oninput = () => {
      const q = $('#kQ').value.trim();
      $$('tbody tr[data-s]', main).forEach((r) => {
        r.hidden = !!q && !r.dataset.s.includes(q);
      });
    };
    $('#kSaveE').onclick = async () => {
      const rows = $$('tr[data-emp]', main).map((tr) => ({
        empId: tr.dataset.emp,
        note: $('[data-n]', tr).value,
        vals: Object.fromEntries($$('[data-v]', tr).map((i) => [i.dataset.v, i.value])),
      }));
      try {
        const x = await api('POST', `/api/kpi/eval?month=${month}`, { rows });
        toast(`تم حفظ تقييم ${x.saved} موظف`);
        viewKpi(query);
      } catch (err) {
        $('.ferr', main).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    $('#kXls').onclick = () =>
      downloadCsv(`تقييم_الأداء_${month}.csv`, [
        ['الرقم الوظيفي', 'الموظف', 'الإدارة', 'الفرع', ...cols.map((c) => c.name), 'الإجمالي', 'التقدير', 'ملاحظة'],
        ...ev.rows.map((r) => [
          r.empNo,
          r.name,
          r.department,
          r.branch,
          ...cols.map((c) => (r.score && r.score.vals[c.id] != null ? r.score.vals[c.id] : '')),
          r.score ? r.score.total : '',
          r.score ? kpiGrade(r.score.total)[0] : '',
          r.score ? r.score.note : '',
        ]),
      ]);
  }

  return { viewKpi };
};
