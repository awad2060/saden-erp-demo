/* أعمال الإدارات للإدارة العليا ولوحة المؤشرات */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc, fmtNum } = SF;
  const {
    $,
    state,
    compact,
    hbars,
    downloadCsv,
    SERIES,
    columnChart,
    lineChart,
    money,
    daysTxt,
    delta,
    periodTxt,
    dPeriod,
    monthLabels,
    monthShort,
    STATUS_AR,
  } = S;
  Object.assign(S, { dashboardHtml, drawDashCharts, dashCsv });

  /* محتوى اللوحة: يُستخدم في الشاشة وفي التقرير المطبوع */
  /* ---------- أعمال الإدارات (للإدارة العليا): ملخص كل إدارة في الفترة والفرع المختارين ---------- */
  /* أقسام اللوحة الظاهرة: المسموح من مدير النظام (يرسله السيرفر) عدا ما أخفاه الشخص لنفسه */
  const dashHidden = () => {
    try {
      return JSON.parse(localStorage.getItem(`dash:hide:${state.user.id}`) || '[]');
    } catch {
      return [];
    }
  };
  const dashOn = (d, k) => (d.sections || SF.DASH_KEYS).includes(k) && !dashHidden().includes(k);
  const dashOnCount = (d) => SF.DASH_KEYS.filter((k) => dashOn(d, k)).length;
  function deptsHtml(d, forPrint) {
    const x = d.depts,
      n = (v) => fmtNum(Math.round(Number(v) || 0));
    const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
    const kpi = (v, l, cls) => `<div class="stat dx-s${cls ? ` ${cls}` : ''}"><div class="n">${v}</div><div class="l">${l}</div></div>`;
    const bars = (list, unit) =>
      list.length
        ? hbars(
            list.map((i) => ({ label: i.k, value: i.n })),
            (v) => `${n(v)}${unit || ''}`,
          )
        : '<div class="muted">لا توجد بيانات</div>';
    const reqT = (rows) =>
      `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الطلبات</th><th>جديد في الفترة</th><th>معتمد</th><th>جاري</th><th>متأخر</th></tr></thead><tbody>${rows.map(([l, r, amt]) => `<tr><td>${l}</td><td>${r.created}</td><td>${r.approved}${amt && r.amount ? `<small> · ${esc(money(r.amount))} ريال</small>` : ''}</td><td>${r.pending}</td><td class="${r.overdue ? 'dx-bad' : ''}">${r.overdue}</td></tr>`).join('')}</tbody></table></div>`;
    const card = (
      ic,
      title,
      link,
      kpis,
      body,
      cls,
    ) => `<div class="card dx-c ${cls || ''}"><div class="dx-ch"><h3>${title}</h3>${!forPrint && link ? `<a href="${link}" class="dx-go">فتح ←</a>` : ''}</div>
      <div class="dx-ss">${kpis.join('')}</div>${body}</div>`;
    const hr = x.hr,
      fin = x.finance,
      fl = x.fleet,
      ws = x.workshop,
      dr = x.drilling,
      inv = x.inventory,
      tk = x.tasks,
      cm = x.comm;
    const hs = x.hse,
      gv = x.gov,
      sp = x.sup,
      tr = x.train,
      fu = x.fuel,
      dc = x.docs,
      cr = x.crm;
    const on = (k) => dashOn(d, `d.${k}`) && x[k];
    if (
      ![
        'hr',
        'finance',
        'fleet',
        'workshop',
        'drilling',
        'inventory',
        'tasks',
        'comm',
        'hse',
        'gov',
        'sup',
        'train',
        'fuel',
        'docs',
        'crm',
      ].some(on)
    )
      return '';
    return `<h2 class="dx-title">باقي الشركة — أعمال الإدارات (${esc(dPeriod(d))})${d.branch ? ` · فرع ${esc(d.branch)}` : ''}</h2>
    <div class="dash-grid">
      ${
        !on('hr')
          ? ''
          : card(
              '👥',
              'الموارد البشرية',
              '#/employees',
              [
                kpi(n(hr.active), 'موظف نشط'),
                kpi(pct(hr.saudi, hr.active), `نسبة السعودة (${n(hr.saudi)})`),
                kpi(n(hr.joined), 'التحقوا في الفترة'),
                kpi(n(hr.iqamaExpired), 'إقامات منتهية', hr.iqamaExpired ? 'bad' : ''),
                kpi(n(hr.iqamaSoon), 'إقامات تنتهي خلال 30 يوماً', hr.iqamaSoon ? 'warn' : ''),
              ],
              `<div class="dx-2"><div><h4>الموظفون حسب الفرع</h4>${bars(hr.byBranch)}</div><div><h4>حسب الجنسية</h4>${bars(hr.byNat)}</div></div>
        ${reqT([
          ['التوظيف وطلبات الاحتياج', hr.req.hiring],
          ['قرارات النقل', hr.req.transfers],
          ['مباشرات العمل', hr.req.workStart],
          ['ملفات التصفية', hr.req.settlements, true],
          ['الإقامات والتأشيرات ونقل الكفالة', hr.req.residency],
        ])}`,
            )
      }
      ${
        !on('finance')
          ? ''
          : card(
              '💰',
              'المالية والرواتب',
              '#/all',
              [
                kpi(esc(money(fin.all.amount)), 'المبالغ المعتمدة (ريال)'),
                kpi(n(fin.all.approved), 'خطاب معتمد'),
                kpi(n(fin.all.pending), 'جارية الآن'),
                kpi(n(fin.all.overdue), 'متأخرة', fin.all.overdue ? 'bad' : ''),
              ],
              reqT(fin.byGroup.map((g) => [esc(g.k), g, true])),
            )
      }
      ${
        !on('fleet')
          ? ''
          : card(
              '🚚',
              'إدارة الحركة',
              '#/fleet',
              [
                kpi(n(fl.total), 'مركبة'),
                kpi(n(fl.docsExpired), 'مركبات بوثائق منتهية', fl.docsExpired ? 'bad' : ''),
                kpi(n(fl.docsSoon), 'وثائق تنتهي خلال 30 يوماً', fl.docsSoon ? 'warn' : ''),
                kpi(n(fl.violations), `مخالفة في الفترة (${esc(money(fl.violationsAmount))} ريال)`),
                kpi(n(fl.vioOpen), 'مخالفات غير مسواة', fl.vioOpen ? 'warn' : ''),
              ],
              `<div class="dx-2"><div><h4>حالة المركبات</h4>${bars(fl.byStatus)}</div><div><h4>المخالفات حسب الحالة</h4>${bars(fl.vioByStatus)}</div></div>
        ${reqT([
          ['محاضر التسليم والتسلم', fl.req.handovers],
          ['صيانة المركبات', fl.req.maintenance, true],
        ])}`,
            )
      }
      ${
        !on('workshop')
          ? ''
          : card(
              '🛠',
              'الورشة (المخازن والتصنيع والخردة)',
              '#/workshop',
              [
                kpi(n(ws.products), 'صنف في المخزن'),
                kpi(n(ws.issued), `كمية مصروفة (${ws.issueDocs} إذن)`),
                kpi(n(ws.produced), 'كمية مُصنَّعة'),
                kpi(esc(money(ws.scrapSales)), 'مبيعات الخردة (ريال)'),
              ],
              reqT([
                ['طلبات التصنيع', ws.req.mfg, true],
                ['أذونات الصرف', ws.req.stockIssue],
                ['عروض الأسعار', ws.req.quotes, true],
                ['بيع وتوريد الخردة', ws.req.scrap, true],
              ]),
            )
      }
      ${
        !on('drilling')
          ? ''
          : card(
              '⛏',
              'قسم الحفر',
              '#/drilling-projects',
              [
                kpi(n(dr.active), `مشروع تحت التنفيذ (من ${dr.projects})`),
                kpi(n(dr.activeRigs), 'حفارة عاملة'),
                kpi(`${dr.pct}%`, `إنجاز الأمتار (${n(dr.doneM)} من ${n(dr.plannedM)})`),
                kpi(n(dr.holes), `جسة في الفترة (${n(dr.metersPeriod)} م)`),
              ],
              `<h4>المشروعات الجارية (نسبة الإنجاز)</h4>${
                dr.top.length
                  ? hbars(
                      dr.top.map((pj) => ({ label: pj.name, value: Math.min(100, pj.pct) })),
                      (v) => `${v}%`,
                    )
                  : '<div class="muted">لا توجد مشروعات جارية</div>'
              }
        ${reqT([
          ['المصروفات الثانوية', dr.req.expense, true],
          ['المطالبات المالية', dr.req.claims, true],
          ['إعارة الحفارات', dr.req.rigLoans],
        ])}`,
            )
      }
      ${
        !on('inventory')
          ? ''
          : card(
              '📋',
              'إدارة الجرد والأجهزة النوعية',
              '#/inventory',
              [
                kpi(n(inv.items), 'صنف في جرد الفروع'),
                kpi(n(inv.broken), 'لا يعمل', inv.broken ? 'warn' : ''),
                kpi(n(inv.loaned), 'معار'),
                kpi(n(inv.devices), 'جهاز نوعي'),
              ],
              `<div class="dx-2"><div><h4>الجرد حسب الفرع</h4>${bars(inv.byBranch)}</div><div><h4>الأجهزة النوعية</h4>${bars(inv.devByState)}</div></div>
        ${reqT([
          ['استعارة الأجهزة', inv.req.loans],
          ['صيانة الأجهزة', inv.req.maint],
        ])}`,
            )
      }
      ${
        !on('fuel')
          ? ''
          : card(
              '',
              'المحروقات',
              '#/fuel',
              [
                kpi(n(fu.amount), 'ريال شامل الضريبة'),
                kpi(n(fu.liters), 'لتر'),
                kpi(n(fu.vehicles), 'مركبة'),
                kpi(`${fu.approved} / ${fu.months}`, 'شهر معتمد / مرفوع'),
              ],
              `<h4>المبالغ حسب الفرع (ريال)</h4>${bars(fu.byBranch)}`,
            )
      }
      ${
        !on('hse')
          ? ''
          : card(
              '',
              'السلامة والصحة المهنية',
              '#/hse',
              [
                kpi(n(hs.incidents), 'حادث في الفترة', hs.incidents ? 'bad' : ''),
                kpi(n(hs.open), 'حوادث مفتوحة', hs.open ? 'warn' : ''),
                kpi(n(hs.permits), 'تصريح عمل سارٍ'),
                kpi(n(hs.inspections), 'فحص سلامة'),
                kpi(n(hs.observations), 'ملاحظة سلامة'),
              ],
              `<div class="dx-2"><div><h4>الحوادث حسب الخطورة</h4>${bars(hs.bySeverity)}</div><div><h4>الحوادث حسب النوع</h4>${bars(hs.byType)}</div></div>`,
            )
      }
      ${
        !on('gov')
          ? ''
          : card(
              '',
              'الحوكمة والامتثال',
              '#/governance',
              [
                kpi(n(gv.risks), 'خطر مفتوح'),
                kpi(n(gv.highRisks), 'خطر مرتفع', gv.highRisks ? 'bad' : ''),
                kpi(n(gv.findings), 'ملاحظة تدقيق مفتوحة'),
                kpi(n(gv.overdue), 'ملاحظة متأخرة', gv.overdue ? 'bad' : ''),
                kpi(n(gv.coi), 'إقرار تعارض مصالح هذا العام'),
                kpi(n(gv.reports), 'بلاغ مفتوح'),
              ],
              `<h4>المخاطر المفتوحة حسب الفئة</h4>${bars(gv.byCategory)}`,
            )
      }
      ${
        !on('sup')
          ? ''
          : card(
              '',
              'المتابعة والإشراف',
              '#/supervision',
              [
                kpi(n(sp.reports), 'تقرير فرع في الفترة'),
                kpi(n(sp.issues), 'شكوى / مشكلة مفتوحة', sp.issues ? 'warn' : ''),
                kpi(n(sp.urgent), 'عاجلة', sp.urgent ? 'bad' : ''),
                kpi(n(sp.moves), 'طلب نقل / انتداب'),
              ],
              `<div class="dx-2"><div><h4>المفتوحة حسب الأولوية</h4>${bars(sp.byPriority)}</div><div><h4>المفتوحة حسب الفرع</h4>${bars(sp.byBranch)}</div></div>`,
            )
      }
      ${
        !on('train')
          ? ''
          : card(
              '',
              'مركز التدريب',
              '#/training',
              [
                kpi(n(tr.courses), 'دورة في الفترة'),
                kpi(n(tr.upcoming), 'دورة قادمة'),
                kpi(n(tr.trainees), 'متدرب'),
                kpi(n(tr.completed), 'أتموا الدورات'),
                kpi(n(tr.hours), 'ساعة تدريب'),
              ],
              `<h4>المتدربون حسب الدورة</h4>${bars(tr.byCourse)}`,
            )
      }
      ${
        !on('docs')
          ? ''
          : card(
              '',
              'الوثائق والمستندات',
              '#/docs',
              [
                kpi(n(dc.total), 'وثيقة لها تاريخ انتهاء'),
                kpi(n(dc.expired), 'منتهية', dc.expired ? 'bad' : ''),
                kpi(n(dc.soon), 'تنتهي خلال 30 يوماً', dc.soon ? 'warn' : ''),
              ],
              `<h4>المنتهية والقريبة حسب النوع</h4>${bars(dc.byType)}`,
            )
      }
      ${
        !on('crm')
          ? ''
          : card(
              '',
              'العملاء والقضايا',
              '#/crm',
              [
                kpi(n(cr.customers), 'عميل'),
                kpi(n(cr.added), 'عميل جديد في الفترة'),
                kpi(n(cr.cases), 'قضية مفتوحة', cr.cases ? 'warn' : ''),
              ],
              cr.byStatus.length ? `<h4>العملاء حسب الحالة</h4>${bars(cr.byStatus)}` : '',
            )
      }
      ${
        !on('tasks')
          ? ''
          : card(
              '✅',
              'إدارة المهام',
              '#/tasks?view=all',
              [
                kpi(n(tk.created), 'مهمة وُجّهت في الفترة'),
                kpi(n(tk.done), 'اكتملت'),
                kpi(n(tk.open), 'مفتوحة'),
                kpi(n(tk.late), 'متأخرة', tk.late ? 'bad' : ''),
                kpi(tk.onTime == null ? '—' : `${tk.onTime}%`, 'اكتملت في موعدها'),
              ],
              `<table class="dx-req"><thead><tr><th>المدير</th><th>المهام</th><th>مكتملة</th><th>مفتوحة</th><th>متأخرة</th></tr></thead><tbody>${tk.byManager.map((m) => `<tr><td>${esc(m.k)}</td><td>${m.total}</td><td>${m.done}</td><td>${m.open}</td><td class="${m.late ? 'dx-bad' : ''}">${m.late}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">لا توجد مهام</td></tr>'}</tbody></table>
        ${tk.avgDays != null ? `<div class="hint">متوسط مدة إنجاز المهمة: ${esc(daysTxt(tk.avgDays))}${tk.review ? ` · ${tk.review} بانتظار اعتماد المدير` : ''}</div>` : ''}`,
            )
      }
      ${
        !on('comm')
          ? ''
          : card(
              '💬',
              'التواصل والنشاط على النظام',
              '#/mail',
              [
                kpi(n(cm.logins), 'مرة دخول في الفترة'),
                kpi(`${n(cm.activeUsers)} / ${n(cm.users)}`, 'مستخدم نشط / إجمالي'),
                kpi(n(cm.mails), 'رسالة بريد داخلي'),
                kpi(n(cm.notices), `تعميم${cm.noticeRead != null ? ` (قُرئ ${cm.noticeRead}%)` : ''}`),
              ],
              x.legal.req.created || x.legal.req.pending ? reqT([['الشئون القانونية', x.legal.req, true]]) : '',
            )
      }
    </div>`;
  }
  function dashboardHtml(d, forPrint) {
    const k = d.kpi;
    const decided = k.approved + k.rejected;
    const tbl = (head, rows, empty) =>
      `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${head.length}" class="muted">${empty}</td></tr>`}</tbody></table></div>`;
    const on = (key) => dashOn(d, key);
    const half = [];
    if (on('trend'))
      half.push(
        '<div class="card"><h3>المبالغ المعتمدة شهرياً: الفترة المختارة مقارنة بالفترة السابقة</h3><div id="cTrend" class="chart-slot"></div></div>',
      );
    if (on('count'))
      half.push('<div class="card"><h3>الخطابات المعتمدة شهرياً حسب المجموعة</h3><div id="cCount" class="chart-slot"></div></div>');
    if (on('branches'))
      half.push(`<div class="card"><h3>المبالغ المعتمدة حسب الفرع (ريال)</h3>
          ${
            d.byBranch.some((b) => b.amount)
              ? hbars(
                  d.byBranch
                    .filter((b) => b.amount)
                    .map((b) => ({ label: `${b.branch} (${b.approved} خطاب)`, value: Math.round(b.amount) })),
                  (v) => fmtNum(v),
                )
              : '<div class="muted">لا توجد مبالغ معتمدة في هذه الفترة</div>'
          }</div>`);
    if (on('types'))
      half.push(`<div class="card"><h3>عدد الخطابات المعتمدة حسب النوع</h3>
          ${
            d.byType.some((t2) => t2.approved)
              ? hbars(
                  d.byType
                    .filter((t2) => t2.approved)
                    .sort((a, b) => b.approved - a.approved)
                    .map((t2) => ({ label: t2.title, value: t2.approved })),
                )
              : '<div class="muted">لا توجد خطابات معتمدة في هذه الفترة</div>'
          }</div>`);
    if (on('waiting'))
      half.push(`<div class="card"><h3>أين تتوقف الطلبات الآن؟</h3>
          ${tbl(
            ['المرحلة / المعتمد', 'جارية', 'متأخرة', 'أقدم طلب منذ'],
            d.waiting.map(
              (w) =>
                `<tr><td>${esc(w.label)} — ${esc(w.name)}</td><td class="num"><b>${w.count}</b></td><td class="num">${w.overdue ? `<span class="chip late">${w.overdue}</span>` : '0'}</td><td class="num">${esc(daysTxt(w.waitDays))}</td></tr>`,
            ),
            'لا توجد طلبات جارية',
          )}</div>`);
    if (on('stages'))
      half.push(`<div class="card"><h3>متوسط زمن كل مرحلة اعتماد في الفترة</h3>
          ${
            d.stages.length
              ? hbars(
                  d.stages.map((x) => ({ label: `${x.label} (${x.n} اعتماد)`, value: Math.round(x.avg * 10) / 10 })),
                  (v) => daysTxt(v),
                )
              : '<div class="muted">لا توجد اعتمادات في هذه الفترة</div>'
          }</div>`);
    if (on('status'))
      half.push(`<div class="card"><h3>حالة الطلبات المرفوعة في الفترة</h3>
          ${hbars(
            STATUS_AR.map(([key, l]) => ({ label: l, value: d.status[key] || 0 })),
            (v) => `${v} طلب`,
          )}</div>`);
    if (on('people'))
      half.push(`<div class="card"><h3>أعلى الموظفين في المبالغ المعتمدة</h3>
          ${tbl(
            ['الموظف', 'رقم الإقامة', 'خطابات', 'المبلغ (ريال)'],
            d.topPeople.map(
              (p) =>
                `<tr><td>${esc(p.name)}</td><td class="num">${esc(p.iqama)}</td><td class="num">${p.count}</td><td class="num"><b>${esc(money(p.amount))}</b></td></tr>`,
            ),
            'لا توجد بيانات',
          )}</div>`);
    return `
      ${
        !on('kpis')
          ? ''
          : `<div class="stats kpis">
        <div class="stat"><div class="n">${k.approved}</div><div class="l">خطاب معتمد في الفترة</div>${delta(k.approved, d.prev.approved)}</div>
        <div class="stat"><div class="n">${esc(money(k.amount))}</div><div class="l">إجمالي المبالغ المعتمدة (ريال)</div>${delta(k.amount, d.prev.amount)}</div>
        <div class="stat"><div class="n">${k.pending}</div><div class="l">طلبات جارية الآن</div>${k.overdue ? `<span class="delta down">⚠ منها ${k.overdue} متأخر</span>` : '<span class="delta">لا يوجد متأخر</span>'}</div>
        <div class="stat"><div class="n">${decided ? `${Math.round((k.approved / decided) * 100)}%` : '—'}</div><div class="l">نسبة الاعتماد من الطلبات المحسومة</div><span class="delta">${k.rejected} مرفوض · ${k.returned} معاد</span></div>
        <div class="stat"><div class="n">${esc(daysTxt(k.avgDays))}</div><div class="l">متوسط مدة الاعتماد الكاملة</div></div>
        <div class="stat"><div class="n">${d.byBranch.filter((b) => b.approved).length}</div><div class="l">فروع لها خطابات معتمدة</div></div>
      </div>`
      }
      ${half.length ? `<div class="dash-grid">${half.join('')}</div>` : ''}
      ${
        !on('matrix')
          ? ''
          : `
      <div class="card"><h3>مصروفات الفروع حسب نوع الخطاب (المعتمد نهائياً في الفترة)</h3>
        ${
          d.matrix.rows.length
            ? `<div class="tbl-wrap"><table class="tbl mx-tbl"><thead><tr><th>الفرع</th>${d.matrix.types.map((t) => `<th>${esc(t.title)}</th>`).join('')}<th>الإجمالي</th></tr></thead><tbody>
          ${d.matrix.rows
            .map(
              (r) =>
                `<tr><td><b>${esc(r.branch)}</b></td>${d.matrix.types
                  .map((t) => {
                    const c = r.cells[t.type];
                    return `<td class="num">${c ? `${c.amount ? `<b>${esc(money(c.amount))}</b><br>` : ''}<small class="muted">${c.count} خطاب</small>` : '<span class="muted">—</span>'}</td>`;
                  })
                  .join('')}<td class="num"><b>${esc(money(r.amount))}</b><br><small class="muted">${r.count} خطاب</small></td></tr>`,
            )
            .join('')}
          <tr class="total-row"><td>الإجمالي</td>${d.matrix.types.map((t) => `<td class="num">${esc(money(t.amount))}<br><small>${t.count} خطاب</small></td>`).join('')}<td class="num">${esc(money(d.matrix.rows.reduce((a, r) => a + r.amount, 0)))}<br><small>${d.matrix.rows.reduce((a, r) => a + r.count, 0)} خطاب</small></td></tr>
          </tbody></table></div>`
            : '<div class="muted">لا توجد خطابات معتمدة في هذه الفترة</div>'
        }
        <p class="muted" style="font-size:12.5px;margin-bottom:0">المبالغ بالريال حسب الفلاتر أعلاه (الفترة والفرع ونوع الخطاب)، والخطابات بدون مبلغ تظهر بعددها فقط.</p></div>`
      }
      ${
        !on('detail')
          ? ''
          : `<div class="card"><h3>تفصيل حسب نوع الخطاب</h3>
        ${tbl(
          ['نوع الخطاب', 'المجموعة', 'معتمد', 'المبالغ المعتمدة', 'جاري', 'معاد للتعديل', 'مرفوض'],
          [
            ...d.byType
              .filter((t) => !forPrint || t.approved || t.pending || t.returned || t.rejected)
              .map(
                (t) =>
                  `<tr class="click" data-type="${t.type}"><td><b>${esc(t.title)}</b></td><td class="muted">${esc(t.group)}</td><td class="num">${t.approved}</td><td class="num">${t.amount ? esc(money(t.amount)) : '—'}</td><td class="num">${t.pending}</td><td class="num">${t.returned}</td><td class="num">${t.rejected}</td></tr>`,
              ),
            `<tr class="total-row"><td>الإجمالي</td><td></td><td class="num">${k.approved}</td><td class="num">${esc(money(k.amount))}</td><td class="num">${k.pending}</td><td class="num">${k.returned}</td><td class="num">${k.rejected}</td></tr>`,
          ],
          '',
        )}
        <p class="muted" style="font-size:12.5px;margin-bottom:0">المعتمد والمبالغ بتاريخ الاعتماد النهائي، والمرفوض والمعاد بتاريخ رفع الطلب، والجاري هو الوضع الحالي. التأخر بأيام العمل بدون العطلات.</p></div>`
      }
      ${d.depts ? deptsHtml(d, forPrint) : ''}
      ${dashOnCount(d) ? '' : '<div class="card empty">لا توجد أقسام ظاهرة في لوحتك — اضغط "⚙ تخصيص العرض" لإظهار ما تحتاجه، أو اطلب من مدير النظام إتاحة أقسام لك</div>'}`;
  }
  function drawDashCharts(d, scope, fixedWidth) {
    const series = d.groups.map((g, i) => ({ name: g, color: SERIES[i % SERIES.length] }));
    const w = (id) => fixedWidth || $(id, scope).clientWidth;
    if ($('#cTrend', scope))
      $('#cTrend', scope).replaceChildren(
        lineChart({
          series: [
            { name: 'الفترة المختارة', color: SERIES[0], values: d.months.map((m) => m.amount) },
            {
              name: `الفترة السابقة (${periodTxt(d.prevFrom, d.prevTo)})`,
              color: '#9aa3ae',
              dashed: true,
              values: d.monthsPrev.map((m) => m.amount),
            },
          ],
          width: w('#cTrend'),
          fmtTick: compact,
          fmtTip: (v) => `${money(v)} ريال`,
          labels: monthLabels(d),
          short: monthShort(d),
        }),
      );
    if ($('#cCount', scope))
      $('#cCount', scope).replaceChildren(
        columnChart({
          series,
          values: d.months.map((m) => d.groups.map((g) => m.byGroup[g] || 0)),
          width: w('#cCount'),
          fmtTick: (v) => fmtNum(Math.round(v)),
          fmtTip: (v) => `${v} خطاب`,
          totalLabel: 'all',
          labels: monthLabels(d),
          short: monthShort(d),
        }),
      );
  }
  /* أعمال الإدارات في ملف Excel */
  function deptsCsv(x) {
    const r = (label, q) => [label, q.created, q.approved, q.amount, q.pending, q.overdue];
    const H = ['الطلبات', 'جديد في الفترة', 'معتمد', 'المبالغ المعتمدة', 'جاري', 'متأخر'];
    return [
      [],
      ['أعمال الإدارات'],
      [],
      ['الموارد البشرية'],
      ['موظف نشط', x.hr.active],
      ['سعوديون', x.hr.saudi],
      ['التحقوا في الفترة', x.hr.joined],
      ['تركوا في الفترة', x.hr.left],
      ['إقامات منتهية', x.hr.iqamaExpired],
      ['إقامات تنتهي خلال 30 يوماً', x.hr.iqamaSoon],
      H,
      r('التوظيف وطلبات الاحتياج', x.hr.req.hiring),
      r('قرارات النقل', x.hr.req.transfers),
      r('مباشرات العمل', x.hr.req.workStart),
      r('ملفات التصفية', x.hr.req.settlements),
      r('الإقامات والتأشيرات', x.hr.req.residency),
      ['الفرع', 'موظفون نشطون'],
      ...x.hr.byBranch.map((b) => [b.k, b.n]),
      [],
      ['المالية والرواتب'],
      H,
      ...x.finance.byGroup.map((g) => r(g.k, g)),
      r('الإجمالي', x.finance.all),
      [],
      ['إدارة الحركة'],
      ['مركبات', x.fleet.total],
      ['بوثائق منتهية', x.fleet.docsExpired],
      ['وثائق تنتهي خلال 30 يوماً', x.fleet.docsSoon],
      ['مخالفات في الفترة', x.fleet.violations],
      ['مبالغ المخالفات', x.fleet.violationsAmount],
      ['مخالفات غير مسواة', x.fleet.vioOpen],
      ...x.fleet.byStatus.map((s) => [`مركبات: ${s.k}`, s.n]),
      H,
      r('محاضر التسليم', x.fleet.req.handovers),
      r('صيانة المركبات', x.fleet.req.maintenance),
      [],
      ['الورشة'],
      ['أصناف المخزن', x.workshop.products],
      ['كمية مصروفة', x.workshop.issued],
      ['كمية مصنعة', x.workshop.produced],
      ['مبيعات الخردة', x.workshop.scrapSales],
      H,
      r('طلبات التصنيع', x.workshop.req.mfg),
      r('أذونات الصرف', x.workshop.req.stockIssue),
      r('عروض الأسعار', x.workshop.req.quotes),
      r('الخردة', x.workshop.req.scrap),
      [],
      ['قسم الحفر'],
      ['مشروعات', x.drilling.projects],
      ['تحت التنفيذ', x.drilling.active],
      ['حفارات عاملة', x.drilling.activeRigs],
      ['الأمتار المخططة', x.drilling.plannedM],
      ['الأمتار المنفذة', x.drilling.doneM],
      ['نسبة الإنجاز %', x.drilling.pct],
      ['جسات في الفترة', x.drilling.holes],
      ['أمتار الفترة', x.drilling.metersPeriod],
      ['المشروع', 'العميل', 'المخطط (م)', 'المنفذ (م)', 'الإنجاز %'],
      ...x.drilling.top.map((p2) => [p2.name, p2.client, p2.plannedM, p2.doneM, p2.pct]),
      H,
      r('المصروفات الثانوية', x.drilling.req.expense),
      r('المطالبات المالية', x.drilling.req.claims),
      r('إعارة الحفارات', x.drilling.req.rigLoans),
      [],
      ['إدارة الجرد'],
      ['أصناف الجرد', x.inventory.items],
      ['لا يعمل', x.inventory.broken],
      ['معار', x.inventory.loaned],
      ['أجهزة نوعية', x.inventory.devices],
      H,
      r('استعارة الأجهزة', x.inventory.req.loans),
      r('صيانة الأجهزة', x.inventory.req.maint),
      [],
      ['إدارة المهام'],
      ['وُجّهت في الفترة', x.tasks.created],
      ['اكتملت', x.tasks.done],
      ['مفتوحة', x.tasks.open],
      ['متأخرة', x.tasks.late],
      ['اكتملت في موعدها %', x.tasks.onTime == null ? '' : x.tasks.onTime],
      ['المدير', 'المهام', 'مكتملة', 'مفتوحة', 'متأخرة'],
      ...x.tasks.byManager.map((m) => [m.k, m.total, m.done, m.open, m.late]),
      [],
      ['التواصل والنشاط'],
      ['مرات الدخول', x.comm.logins],
      ['مستخدمون نشطون', x.comm.activeUsers],
      ['إجمالي المستخدمين', x.comm.users],
      ['رسائل البريد', x.comm.mails],
      ['التعاميم', x.comm.notices],
      ['نسبة قراءة التعاميم %', x.comm.noticeRead == null ? '' : x.comm.noticeRead],
      [],
      H,
      r('الشئون القانونية', x.legal.req),
    ];
  }
  function dashCsv(d) {
    downloadCsv(
      `مؤشرات_${d.from}_${d.to}${d.branch ? `_${d.branch}` : ''}.csv`,
      [
        [`${d.app} — تقرير المؤشرات ${dPeriod(d)}${d.branch ? ` — فرع ${d.branch}` : ''}`],
        [],
        ['المؤشر', 'القيمة', `الفترة السابقة (${periodTxt(d.prevFrom, d.prevTo)})`],
        ['خطابات معتمدة', d.kpi.approved, d.prev.approved],
        ['المبالغ المعتمدة', d.kpi.amount, d.prev.amount],
        ['جارية الآن', d.kpi.pending],
        ['متأخرة الآن', d.kpi.overdue],
        ['مرفوضة', d.kpi.rejected],
        ['معادة', d.kpi.returned],
        ['متوسط مدة الاعتماد (يوم)', d.kpi.avgDays == null ? '' : d.kpi.avgDays.toFixed(1)],
        [],
        ['الشهر', ...d.groups, 'إجمالي الخطابات', 'المبالغ المعتمدة', 'مبالغ الفترة السابقة'],
      ]
        .concat(
          d.months.map((m, i) => [monthLabels(d)[i], ...d.groups.map((g) => m.byGroup[g] || 0), m.count, m.amount, d.monthsPrev[i].amount]),
        )
        .concat(
          [[], ['الفرع', 'خطابات معتمدة', 'المبالغ المعتمدة', 'جارية']],
          d.byBranch.map((b) => [b.branch, b.approved, b.amount, b.pending]),
        )
        .concat(
          [[], ['نوع الخطاب', 'المجموعة', 'معتمد', 'المبالغ المعتمدة', 'جاري', 'معاد للتعديل', 'مرفوض']],
          d.byType.map((t) => [t.title, t.group, t.approved, t.amount, t.pending, t.returned, t.rejected]),
        )
        .concat(
          [
            [],
            ['مصروفات الفروع حسب نوع الخطاب'],
            [
              'الفرع',
              ...d.matrix.types.map((t) => `${t.title} (المبلغ)`),
              ...d.matrix.types.map((t) => `${t.title} (العدد)`),
              'الإجمالي (المبلغ)',
              'الإجمالي (العدد)',
            ],
          ],
          d.matrix.rows.map((r) => [
            r.branch,
            ...d.matrix.types.map((t) => (r.cells[t.type] || {}).amount || 0),
            ...d.matrix.types.map((t) => (r.cells[t.type] || {}).count || 0),
            r.amount,
            r.count,
          ]),
        )
        .concat(
          [[], ['المرحلة / المعتمد', 'جارية', 'متأخرة', 'أقدم طلب (يوم)']],
          d.waiting.map((x) => [`${x.label} — ${x.name}`, x.count, x.overdue, x.waitDays.toFixed(1)]),
        )
        .concat(
          [[], ['المرحلة', 'متوسط الزمن (يوم)', 'عدد الاعتمادات']],
          d.stages.map((x) => [x.label, x.avg.toFixed(1), x.n]),
        )
        .concat(
          [[], ['الموظف', 'رقم الإقامة', 'خطابات', 'المبلغ']],
          d.topPeople.map((p) => [p.name, p.iqama, p.count, p.amount]),
        )
        .concat(d.depts ? deptsCsv(d.depts) : []),
    );
  }
  Object.assign(S, { dashHidden });
})((window.SES_APP = window.SES_APP || {}));
