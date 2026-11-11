'use strict';
/* أقسام الدليل المترجمة التي تُبنى من بيانات النظام (نظام العمل، أدوات تحليل): القالب هنا مرة واحدة،
 * وعباراته L من ملف اللغة (guide-en.js، guide-ur.js)، وبيانات النظام نفسها تُترجم بالقاموس x.tr.
 * x = { SF, esc, tr, today, tools, chain } يمررها policy.js عند العرض. النسخة العربية الأصل في guide-data.js. */
(function () {
  const cells = (tag, list) => list.map((c) => `<${tag}>${c}</${tag}>`).join('');
  const table = (cols, rows) =>
    `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cells('th', cols)}</tr></thead><tbody>${rows.map((r) => `<tr>${cells('td', r)}</tr>`).join('')}</tbody></table></div>`;

  function labor(L, x) {
    const t = (s) => x.esc(x.tr(s || ''));
    const leaves = (x.SF.hrPolicyOf(x.today()).leaveTypes || []).map((v) => [
      `<b>${t(v.name)}</b>`,
      v.max ? L.days.replace('{0}', v.max) : '—',
      v.balance ? L.yes : L.no,
      t(v.note),
    ]);
    const notice = { worker: L.days.replace('{0}', 30), employer: L.days.replace('{0}', 60) };
    const ends = (x.SF.END_TYPES || []).map((v) => [
      `<b>${t(v.name)}</b>`,
      notice[v.notice] || '—',
      v.eos === 'resign' ? L.resign : t(v.eos),
    ]);
    return `<h4>${L.leaveH}</h4>${table(L.leaveCols, leaves)}<h4>${L.endH}</h4>${table(L.endCols, ends)}<div class="g-tip">${L.tip}</div>`;
  }

  /* شرح أداة تحليل واحدة: نصوصها من تعريفها (analysis-tools.js) مترجمة بالقاموس */
  function toolHtml(L, x, t, i) {
    const tr = (s) => x.esc(x.tr(s || ''));
    const name = (k) => (x.tools.find((o) => o.k === k) || { n: k }).n;
    const secs = t.secs.map(([, l, h]) => `${tr(l)}${h ? ` <small class="muted">(${tr(h)})</small>` : ''}`);
    if (t.problem) secs.unshift(t.problem === true ? L.problem : tr(t.problem));
    const next = (x.chain[t.k] || []).map(([n, why]) => `<b>${tr(name(n))}</b> (${tr(why)})`);
    return `<div class="g-an"><h5>${i + 1}. ${tr(t.n)} <small class="muted" dir="ltr">${x.esc(t.en)}</small> <a href="#/analysis/${t.k}">${L.open}</a></h5>
      <p><b>${L.what}</b> ${tr(t.what)}</p><p><b>${L.when}</b> ${tr(t.when)}</p>
      <p><b>${L.how}</b></p><ol>${cells('li', t.how.map(tr))}</ol>
      <p><b>${L.fields}</b> ${secs.join(L.sep)}${L.sep}${L.thenResult}</p>
      ${next.length ? `<p><b>${L.next}</b> ${next.join(L.sep)}.</p>` : ''}</div>`;
  }

  function analysis(L, x) {
    return `<p>${L.intro.replace('{0}', x.tools.length)}</p>
      <h4>${L.stepsH}</h4><ol>${cells('li', L.steps)}</ol>
      <h4>${L.chainsH}</h4><ul>${cells('li', L.chains)}</ul>
      <h4>${L.toolsH}</h4>${x.tools.map((t, i) => toolHtml(L, x, t, i)).join('')}
      <h4>${L.tipsH}</h4><ul>${cells('li', L.tips)}</ul>`;
  }

  window.SES_GUIDE = Object.assign(window.SES_GUIDE || {}, { GUIDE_DYN: { labor, analysis } });
})();
