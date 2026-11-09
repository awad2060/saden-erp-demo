/* تفاصيل الطلب، ملفات Excel، أدوات صفحات إدارة العمليات */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { $, state, isAdmin, dt, can, toast, fieldHtml, collect } = S;
  Object.assign(S, { defaultPayer, zipStore, downloadXlsx, readXlsx, parseCsv, formModal, printDocs });

  /* ---------- تفاصيل الطلب ---------- */
  /* الجهة الافتراضية في المخالصة: الكفالة إذا كانت إحدى شركات المجموعة، وإلا اسم الشركة الرسمي (الكفالات الخارجية تستلم من سادن) */
  const companyOfficial = () => state.config.companyName || state.config.orgName || '';
  function defaultPayer(d) {
    if (d.payer) return d.payer;
    const sp = String(((d.tasks || {}).hr || {}).sponsorship || '').trim();
    const group = state.config.groupCompanies || [];
    const hit = sp && group.find((g) => sp.includes(g) || g.includes(sp));
    return hit || companyOfficial();
  }
  const payersList = (d) =>
    `<datalist id="dl-payers">${[...new Set([companyOfficial(), ...(state.config.groupCompanies || []), String(((d.tasks || {}).hr || {}).sponsorship || '')].filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`;
  const canEditPayer = (r) =>
    !r.closedAt &&
    (isAdmin() || ((r.createdBy === state.user.id || (r.perms && r.perms.canAct)) && (r.status === 'pending' || r.status === 'approved')));
  const offerCtx = (r) => ({
    serial: r.serial,
    approvedAt: r.approvedAt,
    createdByName: r.createdByName,
    createdBySig: r.createdBySig,
    orgName: state.config.companyName || state.config.orgName,
    verify: r.verify,
  });
  const clearanceCtx = (r) => ({
    serial: r.serial,
    approvedAt: r.status === 'approved' ? r.approvedAt : null,
    orgName: state.config.companyName || state.config.orgName,
    verify: r.verify,
  });
  const caseCtx = (r) => ({
    serial: r.serial,
    route: r.route,
    approvals: r.approvals,
    createdByName: r.createdByName,
    carPaper: (r.attachments || [])
      .filter((a) => a.label === SF.CAR_PAPER)
      .map((a) => a.name)
      .join('، '),
  });
  /* محضر السيارة المرفوع مع ملف التصفية قبل تسجيله: توقيع إدارة الحركة من مرحلتها في الملف */
  const carCtx = (r) => {
    const i = r.route.findIndex((s) => s.task === 'carApprove');
    const { task, ...st } = r.route[i] || {};
    return {
      route: i >= 0 ? [st] : [],
      approvals: i >= 0 ? [r.approvals[i]] : [],
      serial: r.serial,
      attachLabels: (r.attachments || []).map((a) => a.label),
    };
  };
  /* زر الإعادة لمقدم الطلب: "للمحاسب" إذا رفعه محاسب */
  const retCreator = (r) => (r.createdByRole === 'accountant' || !r.createdByRole ? 'إعادة للمحاسب' : 'إعادة لمقدم الطلب');
  /* خطاب تعميد بيان الجُمع / الإعاشات: موجه لمراحل الخطاب فقط (المدير المالي والتنفيذي)، ومدير الفرع يعتمد البيان */
  const sheetLetterCtx = (r) => {
    const keep = r.route.map((s, i) => (/مدير الفرع/.test(s.label || '') ? -1 : i)).filter((i) => i >= 0);
    return { ...letterCtx(r), route: keep.map((i) => r.route[i]), approvals: keep.map((i) => r.approvals[i]) };
  };
  const letterCtx = (r) => ({
    route: r.route,
    approvals: r.approvals,
    rejection: r.rejection,
    serial: r.serial,
    createdByName: r.createdByName,
    createdBySig: r.createdBySig,
    createdAt: r.createdAt,
    verify: r.verify,
    attachLabels: (r.attachments || []).map((a) => a.label),
  });

  /* صفحة الطلب: رسائل البريد المرتبطة به (مما أنت طرف فيه) وزر مراسلة بخصوصه */
  const reqMailCard = (r) =>
    !can('mail')
      ? ''
      : `<div class="card req-mail"><h3>📨 مراسلات البريد</h3>
    ${
      (r.mails || []).length
        ? `<ul class="files">${r.mails
            .slice()
            .reverse()
            .map(
              (m) =>
                `<li><a href="#/mail/${m.id}">${m.read ? '' : '<b>● </b>'}${esc(m.subject)}</a><small class="muted">${esc(m.fromName)} — ${esc(dt(m.at))}</small></li>`,
            )
            .join('')}</ul>`
        : '<div class="muted" style="margin-bottom:8px">لا توجد رسائل مرتبطة بهذا الطلب</div>'
    }
    <a class="btn sm" href="#/mail/new?req=${r.id}">✉️ مراسلة بخصوص هذا الطلب</a></div>`;

  /* ---------- ملفات Excel (xlsx) بدون مكتبات خارجية ----------
   * الكتابة: ملف zip غير مضغوط فيه ورقة واحدة من اليمين لليسار. القراءة: فك الضغط بأداة المتصفح (DecompressionStream) */
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (b) => {
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  function zipStore(files) {
    const enc = new TextEncoder(),
      parts = [],
      central = [];
    let off = 0;
    for (const [name, text] of files) {
      const nm = enc.encode(name),
        data = enc.encode(text),
        crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true);
      h.setUint16(4, 20, true);
      h.setUint16(6, 0x0800, true);
      h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true);
      h.setUint32(22, data.length, true);
      h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true);
      c.setUint16(4, 20, true);
      c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true);
      c.setUint32(24, data.length, true);
      c.setUint16(28, nm.length, true);
      c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm);
      off += 30 + nm.length + data.length;
    }
    const size = central.reduce((a, x) => a + x.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true);
    e.setUint16(8, files.length, true);
    e.setUint16(10, files.length, true);
    e.setUint32(12, size, true);
    e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
  const xmlEsc = (s) =>
    String(s == null ? '' : s)
      .replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const colName = (i) => {
    let s = '';
    for (i++; i; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
    return s;
  };
  /* rows: صفوف القيم، والصف الأول عناوين بخط عريض. أو قائمة أوراق [{ name, rows }] لملف بعدة أوراق */
  function downloadXlsx(name, rows, sheet = 'Sheet1') {
    const sheets = rows.length && rows[0] && Array.isArray(rows[0].rows) ? rows : [{ name: sheet, rows }];
    /* أسماء الأوراق: حتى 31 حرفاً، بدون الرموز الممنوعة في Excel، وبلا تكرار */
    const used = new Set();
    const names = sheets.map((s, i) => {
      let n =
        String(s.name || `Sheet${i + 1}`)
          .replace(/[\[\]:*?/\\]/g, ' ')
          .trim()
          .slice(0, 31) || `Sheet${i + 1}`;
      for (let k = 2; used.has(n); k++) n = `${n.slice(0, 27)} (${k})`;
      used.add(n);
      return n;
    });
    const sheetXmlOf = (rows) => {
      const width = Math.max(1, ...rows.map((r) => r.length));
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="${width}" width="20" customWidth="1"/></cols><sheetData>${rows.map((r, i) => `<row r="${i + 1}">${r.map((v, k) => (v === '' || v == null ? '' : typeof v === 'number' ? `<c r="${colName(k)}${i + 1}"${i ? '' : ' s="1"'}><v>${v}</v></c>` : `<c r="${colName(k)}${i + 1}" t="inlineStr"${i ? '' : ' s="1"'}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`)).join('')}</row>`).join('')}</sheetData></worksheet>`;
    };
    const blob = zipStore([
      [
        '[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          sheets
            .map(
              (s, i) =>
                `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
            )
            .join('') +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      ],
      [
        '_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      ],
      [
        'xl/workbook.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${xmlEsc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
      ],
      [
        'xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          sheets
            .map(
              (s, i) =>
                `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
            )
            .join('') +
          `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      ],
      [
        'xl/styles.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
      ],
      ...sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXmlOf(s.rows)]),
    ]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }
  /* ملف Excel منسّق (ألوان وحدود ودمج خلايا): sheets = [{ name, cols: [عرض], rows: [[قيمة أو { v, s }]], merges: ['A1:C1'] }]
   * الأنماط s: 1 عنوان قسم، 2 رأس أحمر، 3 رأس كحلي، 4 نص، 5 رقم، 6 أساسي، 7 صافي، 8 إجمالي رقم، 9 إجمالي نص، 10 مصروف نص، 11 مصروف رقم، 12 عنوان الورقة، 13 نص وسط */
  const XS_STYLES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.##;-#,##0.##;&quot;-&quot;"/></numFmts>' +
    '<fonts count="6"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="13"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFC00000"/><name val="Calibri"/></font><font><b/><sz val="15"/><color rgb="FF1F3864"/><name val="Calibri"/></font></fonts>' +
    '<fills count="9"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    ['C00000', '1F3864', '92CDDC', 'BDD7EE', '92D050', 'C4BD97', 'F2F2F2']
      .map((c) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${c}"/><bgColor indexed="64"/></patternFill></fill>`)
      .join('') +
    '</fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF7F7F7F"/></left><right style="thin"><color rgb="FF7F7F7F"/></right><top style="thin"><color rgb="FF7F7F7F"/></top><bottom style="thin"><color rgb="FF7F7F7F"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="14">' +
    [
      [0, 0, 0, 0, ''],
      [0, 3, 4, 1, 'center'],
      [0, 2, 2, 1, 'center'],
      [0, 2, 3, 1, 'center'],
      [0, 0, 0, 1, 'right'],
      [164, 0, 0, 1, 'center'],
      [164, 1, 5, 1, 'center'],
      [164, 1, 6, 1, 'center'],
      [164, 1, 7, 1, 'center'],
      [0, 1, 7, 1, 'center'],
      [0, 4, 0, 1, 'right'],
      [164, 4, 8, 1, 'center'],
      [0, 5, 0, 0, 'center'],
      [0, 0, 0, 1, 'center'],
    ]
      .map(
        ([nf, f, fi, b, h]) =>
          `<xf numFmtId="${nf}" fontId="${f}" fillId="${fi}" borderId="${b}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"${h ? ' applyAlignment="1"><alignment horizontal="' + h + '" vertical="center" wrapText="1"/></xf>' : '/>'}`,
      )
      .join('') +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  /* قراءة أول ورقة من ملف xlsx: صفوف نصوص، والتواريخ الرقمية تبقى رقماً تسلسلياً يحوّلها normDate */
  async function readXlsx(file) {
    const buf = new Uint8Array(await file.arrayBuffer()),
      dv = new DataView(buf.buffer);
    let eo = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--)
      if (dv.getUint32(i, true) === 0x06054b50) {
        eo = i;
        break;
      }
    if (eo < 0) throw new Error('الملف ليس ملف Excel صالحاً (xlsx)');
    const entries = {};
    let p = dv.getUint32(eo + 16, true);
    for (let k = 0, n = dv.getUint16(eo + 10, true); k < n; k++) {
      const nl = dv.getUint16(p + 28, true),
        xl = dv.getUint16(p + 30, true),
        cl = dv.getUint16(p + 32, true);
      const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl));
      entries[name] = { method: dv.getUint16(p + 10, true), size: dv.getUint32(p + 20, true), off: dv.getUint32(p + 42, true) };
      p += 46 + nl + xl + cl;
    }
    const read = async (name) => {
      const e = entries[name];
      if (!e) return '';
      const start = e.off + 30 + dv.getUint16(e.off + 26, true) + dv.getUint16(e.off + 28, true);
      const raw = buf.subarray(start, start + e.size);
      if (e.method === 0) return new TextDecoder().decode(raw);
      if (typeof DecompressionStream === 'undefined') throw new Error('المتصفح لا يدعم قراءة ملفات Excel، استخدم Chrome أو Edge حديث');
      return new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    };
    const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
    const shared = [...xml(await read('xl/sharedStrings.xml')).getElementsByTagName('si')].map((si) =>
      [...si.getElementsByTagName('t')].map((t) => t.textContent).join(''),
    );
    const rels = xml(await read('xl/_rels/workbook.xml.rels'));
    const first = xml(await read('xl/workbook.xml')).getElementsByTagName('sheet')[0];
    const rid =
      first &&
      (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
    const rel = [...rels.getElementsByTagName('Relationship')].find((r) => r.getAttribute('Id') === rid);
    const target = rel
      ? `xl/${rel
          .getAttribute('Target')
          .replace(/^\/?xl\//, '')
          .replace(/^\//, '')}`
      : 'xl/worksheets/sheet1.xml';
    const sheet = xml((await read(target)) || (await read('xl/worksheets/sheet1.xml')));
    const col = (ref) => [...ref.replace(/\d+/g, '')].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
    return [...sheet.getElementsByTagName('row')]
      .map((row) => {
        const out = [];
        for (const c of row.getElementsByTagName('c')) {
          const t = c.getAttribute('t'),
            v = c.getElementsByTagName('v')[0];
          const val =
            t === 's'
              ? shared[Number(v && v.textContent)]
              : t === 'inlineStr'
                ? [...c.getElementsByTagName('t')].map((x) => x.textContent).join('')
                : v
                  ? v.textContent
                  : '';
          out[col(c.getAttribute('r') || '')] = val == null ? '' : String(val);
        }
        return Array.from(out, (x) => x || '');
      })
      .filter((r) => r.some((x) => String(x).trim()));
  }

  /* التاريخ من Excel: 2027-05-01 أو 2027/05/01 أو 01/05/2027 */
  const normDate = (s) => {
    /* التاريخ مع الوقت (2026-10-20 00:00:00) يؤخذ تاريخه فقط */
    const x = String(s || '')
      .trim()
      .replace(/^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})[T ].*$/, '$1');
    if (/^\d{5}(\.\d+)?$/.test(x)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(x)) * 86400000).toISOString().slice(0, 10);
    let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(x);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(x);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return x;
  };
  function parseCsv(text) {
    const rows = [];
    let row = [],
      cell = '',
      q = false;
    const src = text.replace(/^\uFEFF/, '');
    const sep = (src.split('\n')[0].match(/;/g) || []).length > (src.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (q) {
        if (ch === '"' && src[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) {
        row.push(cell);
        cell = '';
      } else if (ch === '\n') {
        row.push(cell.replace(/\r$/, ''));
        rows.push(row);
        row = [];
        cell = '';
      } else cell += ch;
    }
    if (cell || row.length) {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim()));
  }

  /* ---------- أدوات مشتركة لصفحات إدارة العمليات ---------- */
  /* نافذة نموذج عامة: حقول النظام نفسها، والحفظ عبر onSave */
  function formModal({ title, fields, values, onSave, extra }) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:820px;width:96%"><h3 style="margin-top:0">${esc(title)}</h3><form id="fm" novalidate>
      <div class="grid2">${fields.map((f) => fieldHtml(f, (values || {})[f.key] != null ? values[f.key] : f.default || '')).join('')}</div>${extra || ''}
      <div id="fmErr"></div><div class="row" style="margin-top:14px;gap:8px"><button class="btn primary">💾 حفظ</button><button type="button" class="btn ghost" data-x>إلغاء</button></div></form></div>`;
    document.body.appendChild(bg);
    $('[data-x]', bg).onclick = () => bg.remove();
    $('#fm', bg).onsubmit = async (e) => {
      e.preventDefault();
      const v = collect({ fields }, $('#fm', bg));
      const miss = fields.find((f) => f.required && !String(v[f.key] || '').trim());
      if (miss) {
        $('#fmErr', bg).innerHTML = `<div class="err">الحقل "${esc(miss.label)}" مطلوب</div>`;
        return;
      }
      try {
        await onSave(v, bg);
        bg.remove();
      } catch (err) {
        $('#fmErr', bg).innerHTML = `<div class="err">${esc(err.message)}</div>`;
      }
    };
    return bg;
  }
  /* مستند مطبوع بترويسة الشركة في نافذة مستقلة */
  const opsDoc = ({ title, no, date, body, sigs }) => `<div class="letter has-head"><img class="l-head" src="header.png" alt="">
    <div class="l-top"><div>التاريخ : <span class="red">${esc(SF.fmtDate(date || new Date().toISOString()))}</span></div>${no ? `<div>الرقم : <bdi dir="ltr" class="red">${esc(no)}</bdi></div>` : ''}</div>
    <div class="l-title">${esc(title)}</div>${body}
    ${sigs ? `<div class="l-sigs" style="grid-template-columns:repeat(${sigs.length},1fr);margin-top:14mm">${sigs.map((s) => `<div class="l-sig"><div>${esc(s)}</div><div class="l-sig-line">...........................</div></div>`).join('')}</div>` : ''}</div>`;
  /* طباعة مستند في نافذة مستقلة؛ { landscape: true } لصفحة A4 بالعرض (مثل تقرير الجرد كثير الأعمدة) */
  function printDocs(title, opt, html) {
    if (html === undefined) {
      html = opt;
      opt = {};
    }
    const w = window.open('', '_blank');
    if (!w) {
      toast('اسمح بفتح النوافذ المنبثقة للطباعة', true);
      return;
    }
    w.document
      .write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(title)}</title><link rel="stylesheet" href="css/style.css"></head>
      ${opt.landscape ? '<style>@page { size: A4 landscape; margin: 0; } .letter { width: 297mm !important; min-height: 210mm !important; } .letter.compact { height: auto !important; } .letter.has-head { padding-top: 40mm !important; }</style>' : ''}
      <body class="print-page" style="background:#fff;--letter-top:${state.config.letterTopMargin || 35}mm">${html}<script>window.onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
    w.document.close();
  }
  const kv = (pairs) =>
    `<table class="lt">${pairs.map(([l, v]) => `<tr><td class="lbl">${esc(l)}</td><td>${esc(v == null || v === '' ? '—' : v)}</td></tr>`).join('')}</table>`;
  const daysBadge = (d) =>
    d === null || d === undefined
      ? '<span class="muted">—</span>'
      : d < 0
        ? `<span class="chip rejected">منتهية منذ ${-d} يوم</span>`
        : d <= 30
          ? `<span class="chip pending">باقٍ ${d} يوم</span>`
          : '<span class="chip approved">سارية</span>';
  const sar = (v) => SF.fmtNum(Math.round(Number(v || 0) * 100) / 100) || '0';

  /* ---------- قسم الحفر: سجل الحفارات ---------- */
  const RIG_FIELDS = (res) => [
    { key: 'code', label: 'كود الحفارة', required: true },
    { key: 'plate', label: 'رقم السيارة / المعدة' },
    { key: 'branch', label: 'الفرع', required: true, choicesFrom: 'branches' },
    { key: 'mfg', label: 'نوع التصنيع', type: 'select', options: res.mfg },
    { key: 'model', label: 'الماركة والطراز' },
    { key: 'year', label: 'سنة الصنع' },
    { key: 'tuvStart', label: 'إصدار شهادة TUV', type: 'date' },
    { key: 'tuvEnd', label: 'انتهاء شهادة TUV', type: 'date' },
    { key: 'status', label: 'الحالة', type: 'select', options: res.status, default: 'في الخدمة' },
    { key: 'operator', label: 'مشغّل الحفارة (الحفار)' },
    { key: 'opTuvNo', label: 'رقم شهادة TUV للحفار', hint: 'شهادة المشغّل نفسه، غير شهادة الحفارة' },
    { key: 'opTuvEnd', label: 'انتهاء شهادة TUV للحفار', type: 'date' },
    { key: 'helper', label: 'العامل', hint: 'أكثر من عامل: افصل بينهم بفاصلة' },
    { key: 'notes', label: 'ملاحظات', type: 'textarea' },
  ];
  const rigCard = (r) =>
    opsDoc({
      title: 'كارت بيانات المعدة الفنية (حفارة)',
      no: r.code,
      body: kv([
        ['كود الحفارة', r.code],
        ['رقم السيارة / المعدة', r.plate],
        ['الفرع التابع', r.branch],
        ['نوع التصنيع', r.mfg],
        ['الماركة والطراز', r.model],
        ['سنة الصنع', r.year],
        ['إصدار شهادة TUV', SF.fmtDate(r.tuvStart)],
        ['انتهاء شهادة TUV', SF.fmtDate(r.tuvEnd)],
        ['حالة الشهادة', r.tuvDays === null ? '—' : r.tuvDays < 0 ? `منتهية منذ ${-r.tuvDays} يوم` : `سارية (باقٍ ${r.tuvDays} يوم)`],
        ['الحالة', r.status],
        ['مشغّل الحفارة', r.operator],
        ['العامل', r.helper],
        ['المشروع الحالي', r.project ? r.project.name : 'لا يعمل على مشروع'],
        ['ملاحظات', r.notes],
      ]),
    });
  /* ---------- قسم الحفر: مشاريع تحت التنفيذ ---------- */

  /* ---------- الورشة: المخزون وإذن الصرف، أوامر التصنيع، الخردة ---------- */
  const MOVE_KIND = { prod: 'أمر تصنيع', issue: 'إذن صرف', open: 'إضافة يدوية', in: 'توريد خردة', sale: 'بيع خردة' };
  const issueDoc = (m) =>
    opsDoc({
      title: 'إذن صرف مواد من المخزن',
      no: m.docNo,
      date: m.date,
      sigs: ['أمين المخزن', 'المستلم'],
      body: `${kv([
        ['الورشة / المخزن', m.workshop],
        ['صُرف لجهة', m.party],
      ])}<table class="lt grid"><thead><tr><th>البيان (اسم المنتج)</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
      <tbody><tr><td>${esc(m.product)}</td><td>${esc(Math.abs(Number(m.qty)))}</td><td>${esc(sar(m.unitPrice))}</td><td>${esc(sar(m.subtotal))}</td></tr></tbody></table>
      ${kv([
        ['الضريبة (15%)', `${sar(m.vat)} ريال`],
        ['الإجمالي النهائي', `${sar(m.total)} ريال (${SF.tafqeet(m.total)})`],
      ])}${m.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(m.notes)}</div>` : ''}
      <p class="l-para" style="font-size:12px;color:#555">يعتبر هذا الإذن مستنداً رسمياً لصرف المنتجات والمواد من مستودعات ورش سادن.</p>`,
    });
  const prodDoc = (m) =>
    opsDoc({
      title: 'أمر تشغيل وإنتاج',
      no: m.docNo,
      date: m.date,
      sigs: ['ختم واعتماد الورشة', 'المدير العام للورش'],
      body: `${kv([
        ['الجهة المستفيدة (العميل)', m.party],
        ['المنتج المطلوب', m.product],
        ['الكمية', m.qty],
        ['سعر الوحدة', `${sar(m.unitPrice)} ريال`],
        ['الورشة المصنعة', m.workshop],
        ['الإجمالي (بدون ضريبة)', `${sar(m.subtotal)} ريال`],
        ['الضريبة (15%)', `${sar(m.vat)} ريال`],
        ['الإجمالي النهائي (شامل الضريبة)', `${sar(m.total)} ريال (${SF.tafqeet(m.total)})`],
      ])}
      <p class="l-para">بناءً على هذا الأمر، تم الانتهاء من عملية التصنيع وترحيل الكمية للمخزن.</p>${m.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(m.notes)}</div>` : ''}`,
    });
  const scrapDoc = (m) =>
    opsDoc({
      title: 'إذن مغادرة وبيع خردة',
      no: m.docNo,
      date: m.date,
      sigs: ['أمين العهدة / المحاسب', 'المستلم / المشتري'],
      body: `${kv([
        ['الورشة', m.workshop],
        ['يُصرف للسادة', m.party],
      ])}<table class="lt grid"><thead><tr><th>نوع الخردة</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي (ريال)</th></tr></thead>
      <tbody><tr><td>${esc(m.material)}</td><td>${esc(Math.abs(Number(m.qty)))} ${esc(m.unit)}</td><td>${esc(sar(m.unitPrice))}</td><td>${esc(sar(m.total))}</td></tr></tbody></table>
      <p class="l-para">الإجمالي النهائي : <b>${esc(sar(m.total))}</b> ريال (${esc(SF.tafqeet(m.total))}).</p>${m.notes ? `<div class="l-notes"><b>ملاحظات :</b><br>${esc(m.notes)}</div>` : ''}`,
    });
  Object.assign(S, {
    payersList,
    canEditPayer,
    offerCtx,
    clearanceCtx,
    caseCtx,
    carCtx,
    retCreator,
    sheetLetterCtx,
    letterCtx,
    reqMailCard,
    xmlEsc,
    colName,
    XS_STYLES,
    normDate,
    opsDoc,
    kv,
    daysBadge,
    sar,
    RIG_FIELDS,
    rigCard,
    MOVE_KIND,
    issueDoc,
    prodDoc,
    scrapDoc,
  });
})((window.SES_APP = window.SES_APP || {}));
