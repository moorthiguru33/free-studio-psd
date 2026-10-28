// Excel & Spreadsheet Toolkit: Unprotect Sheet, Unlock Workbook, Merge, Split, Compare,
// Transpose, Deduplicate, Text-to-Columns, Unpivot, Compress, Conversions (Markdown, LaTeX, XML, YAML, HTML, XLS -> XLSX),
// Formula Generators (VLOOKUP, INDEX/MATCH, Explainer), and Mock Data Generator.
// 100% in-browser processing using SheetJS and JSZip. Zero server uploads.

async function loadExcelLibs(needsZip = false) {
  await load('xlsx.full.min.js');
  if (needsZip) {
    await load('jszip.min.js');
  }
}

function cleanBaseName(fileName) {
  return fileName.replace(/\.[^/.]+$/, '');
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function parseWorkbook(buffer) {
  return window.XLSX.read(buffer, { type: 'array', cellDates: true });
}

function sheetToAoa(sheet) {
  return window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
}

function aoaToSheet(aoa) {
  return window.XLSX.utils.aoa_to_sheet(aoa);
}

function writeWorkbook(wb, bookType = 'xlsx') {
  const u8 = window.XLSX.write(wb, { bookType: bookType, type: 'array' });
  return new Blob([u8], {
    type: bookType === 'csv'
      ? 'text/csv;charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

// 1. Unprotect Sheets and Unlock Workbook in OpenXML (.xlsx / .xlsm)
async function unprotectExcel(fileBuffer) {
  await load('jszip.min.js');
  const zip = await window.JSZip.loadAsync(fileBuffer);
  let sheetsUnlocked = 0;
  let workbookUnlocked = false;

  // Strip sheetProtection tags from all worksheet XML files
  const worksheetFiles = Object.keys(zip.files).filter(p => /^xl\/worksheets\/sheet\d+\.xml$/i.test(p));
  for (const path of worksheetFiles) {
    let xml = await zip.files[path].async('string');
    const hasProtection = /<sheetProtection[^>]*(\/>|>.*?<\/sheetProtection>)/i.test(xml) ||
                          /<protectedRanges[^>]*>.*?<\/protectedRanges>/i.test(xml);
    if (hasProtection) {
      xml = xml.replace(/<sheetProtection[^>]*(\/>|>.*?<\/sheetProtection>)/gi, '');
      xml = xml.replace(/<protectedRanges[^>]*>.*?<\/protectedRanges>/gi, '');
      zip.file(path, xml);
      sheetsUnlocked++;
    }
  }

  // Strip workbookProtection and fileSharing from xl/workbook.xml
  if (zip.files['xl/workbook.xml']) {
    let wbXml = await zip.files['xl/workbook.xml'].async('string');
    if (/<workbookProtection[^>]*(\/>|>.*?<\/workbookProtection>)/i.test(wbXml) || /<fileSharing[^>]*(\/>|>.*?<\/fileSharing>)/i.test(wbXml)) {
      wbXml = wbXml.replace(/<workbookProtection[^>]*(\/>|>.*?<\/workbookProtection>)/gi, '');
      wbXml = wbXml.replace(/<fileSharing[^>]*(\/>|>.*?<\/fileSharing>)/gi, '');
      zip.file('xl/workbook.xml', wbXml);
      workbookUnlocked = true;
    }
  }

  const outBuf = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return {
    blob: new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    sheetsUnlocked,
    workbookUnlocked
  };
}

// 2. Remove Metadata / Personal Info from OpenXML
async function cleanExcelMetadata(fileBuffer) {
  await load('jszip.min.js');
  const zip = await window.JSZip.loadAsync(fileBuffer);

  // Clean docProps/core.xml
  if (zip.files['docProps/core.xml']) {
    let core = await zip.files['docProps/core.xml'].async('string');
    core = core.replace(/<dc:creator>.*?<\/dc:creator>/gi, '<dc:creator></dc:creator>');
    core = core.replace(/<cp:lastModifiedBy>.*?<\/cp:lastModifiedBy>/gi, '<cp:lastModifiedBy></cp:lastModifiedBy>');
    core = core.replace(/<cp:revision>.*?<\/cp:revision>/gi, '<cp:revision>1</cp:revision>');
    zip.file('docProps/core.xml', core);
  }

  // Clean docProps/app.xml
  if (zip.files['docProps/app.xml']) {
    let app = await zip.files['docProps/app.xml'].async('string');
    app = app.replace(/<Company>.*?<\/Company>/gi, '<Company></Company>');
    app = app.replace(/<Manager>.*?<\/Manager>/gi, '<Manager></Manager>');
    zip.file('docProps/app.xml', app);
  }

  const outBuf = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// 3. Compress Excel File (strip calcChain.xml, unused styles, max recompression)
async function compressExcelFile(fileBuffer) {
  await load('jszip.min.js');
  const zip = await window.JSZip.loadAsync(fileBuffer);

  // calcChain.xml is automatically reconstructed by Excel upon recalculation
  if (zip.files['xl/calcChain.xml']) {
    zip.remove('xl/calcChain.xml');
    if (zip.files['[Content_Types].xml']) {
      let ct = await zip.files['[Content_Types].xml'].async('string');
      ct = ct.replace(/<Override[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/gi, '');
      zip.file('[Content_Types].xml', ct);
    }
    if (zip.files['xl/_rels/workbook.xml.rels']) {
      let rels = await zip.files['xl/_rels/workbook.xml.rels'].async('string');
      rels = rels.replace(/<Relationship[^>]*Target="calcChain\.xml"[^>]*\/>/gi, '');
      zip.file('xl/_rels/workbook.xml.rels', rels);
    }
  }

  const outBuf = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// 4. Converters to Markdown, LaTeX, XML, YAML, HTML
function sheetToMarkdown(aoa) {
  if (!aoa.length) return '';
  const maxCols = Math.max(...aoa.map(r => r.length));
  if (!maxCols) return '';

  const header = aoa[0] || [];
  const headerCols = Array.from({ length: maxCols }, (_, i) => String(header[i] ?? `Col ${i + 1}`).trim().replace(/\|/g, '\\|') || `Col ${i + 1}`);
  const sep = Array.from({ length: maxCols }, () => '---');

  let md = '| ' + headerCols.join(' | ') + ' |\n| ' + sep.join(' | ') + ' |\n';
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] || [];
    const cols = Array.from({ length: maxCols }, (_, i) => String(row[i] ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' '));
    md += '| ' + cols.join(' | ') + ' |\n';
  }
  return md;
}

function sheetToLatex(aoa) {
  if (!aoa.length) return '';
  const maxCols = Math.max(...aoa.map(r => r.length));
  if (!maxCols) return '';

  const colSpec = 'l'.repeat(maxCols);
  let tex = `\\begin{table}[htbp]\n\\centering\n\\begin{tabular}{${colSpec}}\n\\hline\n`;

  for (let r = 0; r < aoa.length; r++) {
    const row = aoa[r] || [];
    const cols = Array.from({ length: maxCols }, (_, i) => {
      let s = String(row[i] ?? '').trim();
      s = s.replace(/([&%$#_{}~^\\])/g, '\\$1');
      return s;
    });
    tex += cols.join(' & ') + ' \\\\\n';
    if (r === 0) tex += '\\hline\n';
  }
  tex += '\\hline\n\\end{tabular}\n\\end{table}\n';
  return tex;
}

function sheetToXml(aoa, rootName = 'records', rowName = 'record') {
  if (!aoa.length) return `<${rootName}></${rootName}>`;
  const header = (aoa[0] || []).map((h, i) => {
    let s = String(h || `col_${i + 1}`).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (/^[0-9]/.test(s)) s = '_' + s;
    return s || `col_${i + 1}`;
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] || [];
    xml += `  <${rowName}>\n`;
    for (let c = 0; c < header.length; c++) {
      const val = row[c] !== undefined ? row[c] : '';
      xml += `    <${header[c]}>${escapeXml(val)}</${header[c]}>\n`;
    }
    xml += `  </${rowName}>\n`;
  }
  xml += `</${rootName}>\n`;
  return xml;
}

function sheetToYaml(aoa) {
  if (!aoa.length) return '[]\n';
  const header = (aoa[0] || []).map((h, i) => String(h || `col_${i + 1}`).trim() || `col_${i + 1}`);

  let yaml = '';
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] || [];
    for (let c = 0; c < header.length; c++) {
      const val = row[c] !== undefined ? String(row[c]).replace(/\r?\n/g, ' ') : '';
      const prefix = c === 0 ? '- ' : '  ';
      yaml += `${prefix}${header[c]}: "${val.replace(/"/g, '\\"')}"\n`;
    }
  }
  return yaml;
}

function sheetToHtmlTable(aoa) {
  if (!aoa.length) return '<table></table>';
  const maxCols = Math.max(...aoa.map(r => r.length));
  let html = '<table class="table" border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">\n';

  // Thead
  html += '  <thead>\n    <tr style="background:#f2f4f8;font-weight:bold">\n';
  for (let c = 0; c < maxCols; c++) {
    html += `      <th>${escapeXml(aoa[0]?.[c] ?? `Col ${c + 1}`)}</th>\n`;
  }
  html += '    </tr>\n  </thead>\n  <tbody>\n';

  // Tbody
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] || [];
    html += '    <tr>\n';
    for (let c = 0; c < maxCols; c++) {
      html += `      <td>${escapeXml(row[c] ?? '')}</td>\n`;
    }
    html += '    </tr>\n';
  }
  html += '  </tbody>\n</table>\n';
  return html;
}

// 5. Mock Data Generator
function generateMockSpreadsheet(rowCount = 100) {
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  const departments = ['Engineering', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'Operations', 'Product Management', 'Customer Support', 'Legal', 'IT'];
  const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'France', 'India', 'Japan', 'Brazil', 'Singapore'];

  const rows = [
    ['ID', 'First Name', 'Last Name', 'Email', 'Department', 'Country', 'Salary ($)', 'Join Date', 'Active Status']
  ];

  for (let i = 1; i <= rowCount; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 90 + 10)}@example.com`;
    const salary = Math.floor(Math.random() * 85000 + 45000);
    const year = Math.floor(Math.random() * 5 + 2020);
    const month = String(Math.floor(Math.random() * 12 + 1)).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28 + 1)).padStart(2, '0');
    const joinDate = `${year}-${month}-${day}`;
    const active = Math.random() > 0.1 ? 'Active' : 'On Leave';

    rows.push([1000 + i, fn, ln, email, dept, country, salary, joinDate, active]);
  }
  return rows;
}

TOOLS.excelutil = {
  opts() {
    const mode = this.vars.mode || 'unprotect';

    if (mode === 'unprotect' || mode === 'unlock') {
      return `<p style="font-size:13px;color:var(--txt2,#666);margin:0 0 10px">
        Instantly removes sheet protection and workbook edit locks from <b>.xlsx</b> files. Zero passwords needed!
      </p>`;
    }

    if (mode === 'merge') {
      return `<label><span>Merge Style</span>
        <select id="merge_style">
          <option value="tabs" selected>Combine as Separate Sheets / Tabs</option>
          <option value="stack">Stack / Append Rows into Single Table</option>
        </select>
      </label>`;
    }

    if (mode === 'split') {
      return `<label><span>Output Format</span>
        <select id="split_fmt">
          <option value="xlsx" selected>Excel (.xlsx) per sheet</option>
          <option value="csv">CSV (.csv) per sheet</option>
        </select>
      </label>`;
    }

    if (mode === 'compare') {
      return `<p style="font-size:13px;color:var(--txt2,#666);margin:0 0 10px">
        Upload 2 Excel workbooks (Base and Modified) to perform cell-by-cell comparison.
      </p>`;
    }

    if (mode === 'dedupe') {
      return `<label><span>Deduplication Scope</span>
        <select id="dedupe_scope">
          <option value="all" selected>All Columns Must Match</option>
          <option value="first">First Column (Unique ID/Key)</option>
        </select>
      </label>`;
    }

    if (mode === 'text2cols') {
      return `<label><span>Delimiter</span>
        <select id="delimiter">
          <option value="," selected>Comma (,)</option>
          <option value=";">Semicolon (;)</option>
          <option value="\t">Tab</option>
          <option value=" ">Space</option>
          <option value="|">Pipe (|)</option>
        </select>
      </label>
      <label><span>Target Column Index (1-based)</span>
        <input type="number" id="col_idx" value="1" min="1" max="100">
      </label>`;
    }

    if (mode === 'unpivot') {
      return `<p style="font-size:13px;color:var(--txt2,#666);margin:0 0 10px">
        Converts 2D crosstab matrix (wide format) into 3-column normalized database rows: <code>[Row Label, Column Header, Value]</code>.
      </p>`;
    }

    if (mode === 'vlookup') {
      return `<label><span>Lookup Function</span>
        <select id="vl_type">
          <option value="xlookup" selected>XLOOKUP (Modern &amp; Recommended)</option>
          <option value="vlookup">VLOOKUP (Classic)</option>
        </select>
      </label>
      <label><span>Lookup Value (Cell)</span>
        <input type="text" id="vl_lookup_val" value="A2" placeholder="e.g. A2">
      </label>
      <label><span>Lookup Range / Array</span>
        <input type="text" id="vl_range" value="Sheet2!$A$2:$D$100" placeholder="e.g. Sheet2!$A$2:$D$100">
      </label>
      <label><span>Return Column / Index</span>
        <input type="text" id="vl_return" value="3" placeholder="e.g. 3 or Sheet2!$C$2:$C$100">
      </label>
      <label><span>Exact Match?</span>
        <select id="vl_exact">
          <option value="true" selected>Exact Match (Recommended)</option>
          <option value="false">Approximate Match</option>
        </select>
      </label>`;
    }

    if (mode === 'indexmatch') {
      return `<label><span>Return Array (Values to Get)</span>
        <input type="text" id="im_return" value="Sheet2!$C$2:$C$100" placeholder="e.g. Sheet2!$C$2:$C$100">
      </label>
      <label><span>Lookup Value (Cell to Find)</span>
        <input type="text" id="im_lookup_val" value="A2" placeholder="e.g. A2">
      </label>
      <label><span>Lookup Array (Column to Search)</span>
        <input type="text" id="im_lookup_arr" value="Sheet2!$A$2:$A$100" placeholder="e.g. Sheet2!$A$2:$A$100">
      </label>`;
    }

    if (mode === 'explainer') {
      return `<label><span>Excel Formula to Explain</span>
        <input type="text" id="formula_input" value="=INDEX(C2:C50, MATCH(A2, B2:B50, 0))" placeholder="Paste formula here">
      </label>`;
    }

    if (mode === 'mockdata') {
      return `<label><span>Number of Rows</span>
        <select id="mock_rows">
          <option value="50">50 Rows</option>
          <option value="100" selected>100 Rows</option>
          <option value="500">500 Rows</option>
          <option value="1000">1,000 Rows</option>
        </select>
      </label>
      <label><span>Format</span>
        <select id="mock_fmt">
          <option value="xlsx" selected>Excel (.xlsx)</option>
          <option value="csv">CSV (.csv)</option>
        </select>
      </label>`;
    }

    return '';
  },

  async setup() {
    const mode = this.vars.mode || 'unprotect';
    const box = document.createElement('div');
    box.style.cssText = 'padding:14px;background:var(--bg2,#f7f9fa);border-radius:10px;margin-top:12px;font-size:14px;';

    if (mode === 'vlookup' || mode === 'indexmatch' || mode === 'explainer') {
      box.innerHTML = `
        <div style="margin-bottom:12px">
          <b>Formula Preview:</b>
          <div id="formula_result" style="font-family:monospace;background:var(--bg,#fff);padding:10px;border:1px solid var(--border,#ddd);border-radius:6px;margin-top:6px;font-size:15px;color:#0d6efd;word-break:break-all">
            Loading formula...
          </div>
        </div>
        <div id="formula_desc" style="font-size:13px;line-height:1.6;color:var(--txt2,#555)"></div>
        <button type="button" class="btn" id="copy_formula_btn" style="margin-top:10px">📋 Copy Formula</button>
      `;

      setTimeout(() => {
        const updateFormula = () => {
          const res = document.getElementById('formula_result');
          const desc = document.getElementById('formula_desc');
          if (!res) return;

          if (mode === 'vlookup') {
            const type = v('vl_type') || 'xlookup';
            const val = v('vl_lookup_val') || 'A2';
            const range = v('vl_range') || 'Sheet2!$A$2:$D$100';
            const ret = v('vl_return') || '3';
            const exact = v('vl_exact') === 'true';

            if (type === 'xlookup') {
              const returnRange = isNaN(ret) ? ret : `Sheet2!$${String.fromCharCode(64 + parseInt(ret))}$2:$${String.fromCharCode(64 + parseInt(ret))}$100`;
              res.textContent = `=XLOOKUP(${val}, ${range.split(':')[0]}:${range.split(':')[0].replace(/([A-Z]+)/g, '$1')}, ${returnRange}, "Not Found", 0)`;
              desc.innerHTML = `Searches for <b>${val}</b> in column 1 of <b>${range}</b> and returns the value from <b>${returnRange}</b>. If not found, returns "Not Found".`;
            } else {
              res.textContent = `=VLOOKUP(${val}, ${range}, ${ret}, ${exact ? 'FALSE' : 'TRUE'})`;
              desc.innerHTML = `Searches for <b>${val}</b> in the first column of <b>${range}</b> and retrieves the value from column <b>#${ret}</b> (${exact ? 'Exact Match' : 'Approximate Match'}).`;
            }
          } else if (mode === 'indexmatch') {
            const retArr = v('im_return') || 'Sheet2!$C$2:$C$100';
            const val = v('im_lookup_val') || 'A2';
            const lookupArr = v('im_lookup_arr') || 'Sheet2!$A$2:$A$100';
            res.textContent = `=INDEX(${retArr}, MATCH(${val}, ${lookupArr}, 0))`;
            desc.innerHTML = `Matches <b>${val}</b> inside <b>${lookupArr}</b> to find its exact row position, then retrieves that row from <b>${retArr}</b>. Far faster and more versatile than standard VLOOKUP!`;
          } else if (mode === 'explainer') {
            const raw = (v('formula_input') || '').trim();
            res.textContent = raw || '=SUM(A1:A10)';
            let explanations = [];
            if (/VLOOKUP/i.test(raw)) explanations.push('• <b>VLOOKUP:</b> Scans vertical table looking for matching identifier and returns neighboring column cell.');
            if (/XLOOKUP/i.test(raw)) explanations.push('• <b>XLOOKUP:</b> Modern bidirectional lookup returning exact results without left-to-right limitations.');
            if (/INDEX/i.test(raw) && /MATCH/i.test(raw)) explanations.push('• <b>INDEX / MATCH:</b> Dynamic lookup combo decoupling return array from search array.');
            if (/SUMIF/i.test(raw)) explanations.push('• <b>SUMIF(S):</b> Calculates total sum of cells that meet specific condition(s).');
            if (/IF\(/i.test(raw)) explanations.push('• <b>IF:</b> Logical decision branch testing conditional statement.');
            if (!explanations.length) explanations.push('• Standard spreadsheet formula expression evaluating cell references and arithmetic operations.');
            desc.innerHTML = explanations.join('<br>');
          }
        };

        const copyBtn = document.getElementById('copy_formula_btn');
        if (copyBtn) {
          copyBtn.onclick = () => {
            const txt = document.getElementById('formula_result')?.textContent || '';
            navigator.clipboard.writeText(txt);
            copyBtn.textContent = '✔ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy Formula'; }, 2000);
          };
        }

        document.querySelectorAll('#tool input, #tool select').forEach(el => {
          el.addEventListener('input', updateFormula);
          el.addEventListener('change', updateFormula);
        });
        updateFormula();
      }, 50);

      return box;
    }

    if (mode === 'mockdata') {
      box.innerHTML = `
        <p style="margin:0 0 8px"><b>Mock Test Data Generator:</b></p>
        <p style="margin:0 0 10px;color:var(--txt2,#666);font-size:13px">
          Generates complete enterprise test datasets with realistic employee names, corporate emails, job departments, countries, salaries, and hire dates.
        </p>
      `;
      return box;
    }

    return null;
  },

  async run(files, status) {
    const mode = this.vars.mode || 'unprotect';

    // Standalone No-File Tools
    if (mode === 'vlookup' || mode === 'indexmatch' || mode === 'explainer') {
      const formulaTxt = document.getElementById('formula_result')?.textContent || '';
      return {
        blob: new Blob([formulaTxt + '\r\n'], { type: 'text/plain;charset=utf-8' }),
        name: 'excel_formula.txt',
        info: 'Generated formula: ' + formulaTxt
      };
    }

    if (mode === 'mockdata') {
      status('Generating mock spreadsheet...');
      await loadExcelLibs(false);
      const rowsCount = parseInt(v('mock_rows') || '100', 10);
      const fmt = v('mock_fmt') || 'xlsx';
      const aoa = generateMockSpreadsheet(rowsCount);

      const wb = window.XLSX.utils.book_new();
      const ws = aoaToSheet(aoa);
      window.XLSX.utils.book_append_sheet(wb, ws, 'Sample_Data');

      const blob = writeWorkbook(wb, fmt);
      return {
        blob: blob,
        name: `mock_data_${rowsCount}_rows.${fmt}`,
        info: `Generated ${rowsCount} realistic spreadsheet rows`
      };
    }

    if (!files.length) {
      throw new Error('Please select an Excel or spreadsheet file.');
    }

    const first = files[0];
    const baseName = cleanBaseName(first.name);

    // 1. Unprotect Excel Sheet / Unlock Workbook
    if (mode === 'unprotect' || mode === 'unlock') {
      status('Unlocking Excel sheets and workbook protection...');
      const buf = await first.arrayBuffer();
      const result = await unprotectExcel(buf);
      return {
        blob: result.blob,
        name: `${baseName}_unlocked.xlsx`,
        info: `Successfully unlocked ${result.sheetsUnlocked} sheet(s)${result.workbookUnlocked ? ' and workbook structure' : ''}!`
      };
    }

    // 2. Remove Metadata
    if (mode === 'cleanmeta') {
      status('Sanitizing Excel author & company metadata...');
      const buf = await first.arrayBuffer();
      const blob = await cleanExcelMetadata(buf);
      return {
        blob: blob,
        name: `${baseName}_clean.xlsx`,
        info: 'Removed author names, company info, and edit history'
      };
    }

    // 3. Compress Excel File
    if (mode === 'compress') {
      status('Compressing workbook XML and removing cache...');
      const buf = await first.arrayBuffer();
      const blob = await compressExcelFile(buf);
      const saved = Math.max(0, Math.round((1 - blob.size / first.size) * 100));
      return {
        blob: blob,
        name: `${baseName}_compressed.xlsx`,
        info: `Reduced file size by ${saved}% (${fmtSize(first.size)} → ${fmtSize(blob.size)})`
      };
    }

    // 4. Merge Excel Files
    if (mode === 'merge') {
      if (files.length < 2) {
        throw new Error('Please select at least 2 Excel or CSV files to merge.');
      }
      status('Merging spreadsheets...');
      await loadExcelLibs(false);
      const mergeStyle = v('merge_style') || 'tabs';
      const outWb = window.XLSX.utils.book_new();

      if (mergeStyle === 'stack') {
        const stackedAoa = [];
        let headerAdded = false;

        for (let i = 0; i < files.length; i++) {
          const fBuf = await files[i].arrayBuffer();
          const wb = parseWorkbook(fBuf);
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const aoa = sheetToAoa(firstSheet);
          if (!aoa.length) continue;

          if (!headerAdded) {
            stackedAoa.push(...aoa);
            headerAdded = true;
          } else {
            stackedAoa.push(...aoa.slice(1));
          }
        }
        window.XLSX.utils.book_append_sheet(outWb, aoaToSheet(stackedAoa), 'Stacked_Data');
      } else {
        const usedNames = new Set();
        for (let i = 0; i < files.length; i++) {
          const fBuf = await files[i].arrayBuffer();
          const wb = parseWorkbook(fBuf);
          const filePrefix = cleanBaseName(files[i].name).slice(0, 15);

          for (const sName of wb.SheetNames) {
            let targetName = `${filePrefix}_${sName}`.slice(0, 31);
            let counter = 1;
            while (usedNames.has(targetName)) {
              targetName = `${filePrefix.slice(0, 12)}_${counter++}`.slice(0, 31);
            }
            usedNames.add(targetName);
            window.XLSX.utils.book_append_sheet(outWb, wb.Sheets[sName], targetName);
          }
        }
      }

      return {
        blob: writeWorkbook(outWb, 'xlsx'),
        name: 'merged_spreadsheets.xlsx',
        info: `Merged ${files.length} workbooks successfully`
      };
    }

    // 5. Split Excel Workbook
    if (mode === 'split') {
      status('Splitting workbook sheets...');
      await loadExcelLibs(true);
      const buf = await first.arrayBuffer();
      const wb = parseWorkbook(buf);
      const fmt = v('split_fmt') || 'xlsx';
      const zip = new window.JSZip();

      for (const sName of wb.SheetNames) {
        const singleWb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(singleWb, wb.Sheets[sName], sName);
        const u8 = window.XLSX.write(singleWb, { bookType: fmt, type: 'array' });
        const safeSheetName = sName.replace(/[^a-zA-Z0-9_\- ]/g, '_');
        zip.file(`${safeSheetName}.${fmt}`, u8);
      }

      const zipBuf = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
      return {
        blob: new Blob([zipBuf], { type: 'application/zip' }),
        name: `${baseName}_sheets.zip`,
        info: `Split into ${wb.SheetNames.length} separate ${fmt.toUpperCase()} files`
      };
    }

    // 6. Compare Excel Files
    if (mode === 'compare') {
      if (files.length < 2) {
        throw new Error('Please select exactly 2 Excel workbooks to compare.');
      }
      status('Comparing workbooks cell-by-cell...');
      await loadExcelLibs(false);
      const wb1 = parseWorkbook(await files[0].arrayBuffer());
      const wb2 = parseWorkbook(await files[1].arrayBuffer());

      const aoa1 = sheetToAoa(wb1.Sheets[wb1.SheetNames[0]]);
      const aoa2 = sheetToAoa(wb2.Sheets[wb2.SheetNames[0]]);

      const maxRows = Math.max(aoa1.length, aoa2.length);
      const diffRows = [['Row #', 'Column #', `Original (${files[0].name})`, `Modified (${files[1].name})`, 'Status']];
      let differences = 0;

      for (let r = 0; r < maxRows; r++) {
        const r1 = aoa1[r] || [];
        const r2 = aoa2[r] || [];
        const maxCols = Math.max(r1.length, r2.length);

        for (let c = 0; c < maxCols; c++) {
          const val1 = String(r1[c] ?? '');
          const val2 = String(r2[c] ?? '');
          if (val1 !== val2) {
            differences++;
            const statusType = !val1 ? 'Added' : !val2 ? 'Deleted' : 'Modified';
            diffRows.push([r + 1, c + 1, val1, val2, statusType]);
          }
        }
      }

      const diffWb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(diffWb, aoaToSheet(diffRows), 'Comparison_Diff');

      return {
        blob: writeWorkbook(diffWb, 'xlsx'),
        name: `diff_${cleanBaseName(files[0].name)}_vs_${cleanBaseName(files[1].name)}.xlsx`,
        info: differences ? `Found ${differences} cell difference(s)` : 'Files are identical!'
      };
    }

    // Parse single sheet for data operations
    await loadExcelLibs(false);
    status('Reading spreadsheet...');
    const buf = await first.arrayBuffer();
    const wb = parseWorkbook(buf);
    const activeSheetName = wb.SheetNames[0];
    const aoa = sheetToAoa(wb.Sheets[activeSheetName]);

    // 7. Transpose
    if (mode === 'transpose') {
      status('Transposing rows and columns...');
      const maxCols = Math.max(...aoa.map(r => r.length));
      const transposed = Array.from({ length: maxCols }, (_, c) =>
        aoa.map(r => (r[c] !== undefined ? r[c] : ''))
      );

      const outWb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(outWb, aoaToSheet(transposed), 'Transposed');
      return {
        blob: writeWorkbook(outWb, 'xlsx'),
        name: `${baseName}_transposed.xlsx`,
        info: `Transposed ${aoa.length} rows × ${maxCols} columns`
      };
    }

    // 8. Deduplicate
    if (mode === 'dedupe') {
      status('Removing duplicate rows...');
      const scope = v('dedupe_scope') || 'all';
      const seen = new Set();
      const cleaned = [];
      let dupesCount = 0;

      for (let i = 0; i < aoa.length; i++) {
        const row = aoa[i];
        if (i === 0) {
          cleaned.push(row);
          continue;
        }
        const key = scope === 'first' ? String(row[0] ?? '') : JSON.stringify(row);
        if (seen.has(key)) {
          dupesCount++;
        } else {
          seen.add(key);
          cleaned.push(row);
        }
      }

      const outWb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(outWb, aoaToSheet(cleaned), 'Deduplicated');
      return {
        blob: writeWorkbook(outWb, 'xlsx'),
        name: `${baseName}_deduped.xlsx`,
        info: `Removed ${dupesCount} duplicate row(s)`
      };
    }

    // 9. Text to Columns
    if (mode === 'text2cols') {
      status('Splitting delimited text into columns...');
      const delim = v('delimiter') || ',';
      const colIdx = Math.max(0, parseInt(v('col_idx') || '1', 10) - 1);
      const splitAoa = [];

      for (let r = 0; r < aoa.length; r++) {
        const row = [...aoa[r]];
        const targetCell = String(row[colIdx] ?? '');
        const pieces = targetCell.split(delim);
        row.splice(colIdx, 1, ...pieces);
        splitAoa.push(row);
      }

      const outWb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(outWb, aoaToSheet(splitAoa), 'TextToColumns');
      return {
        blob: writeWorkbook(outWb, 'xlsx'),
        name: `${baseName}_split_columns.xlsx`,
        info: 'Split column into multiple columns successfully'
      };
    }

    // 10. Unpivot / Reverse Pivot
    if (mode === 'unpivot') {
      status('Unpivoting crosstab to normalized rows...');
      if (aoa.length < 2) throw new Error('Spreadsheet has insufficient rows to unpivot.');
      const headers = aoa[0];
      const unpivoted = [[headers[0] || 'Row Item', 'Attribute', 'Value']];

      for (let r = 1; r < aoa.length; r++) {
        const row = aoa[r];
        const rowLabel = row[0] ?? '';
        for (let c = 1; c < headers.length; c++) {
          const colHeader = headers[c] ?? `Col ${c + 1}`;
          const val = row[c] !== undefined ? row[c] : '';
          unpivoted.push([rowLabel, colHeader, val]);
        }
      }

      const outWb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(outWb, aoaToSheet(unpivoted), 'Unpivoted');
      return {
        blob: writeWorkbook(outWb, 'xlsx'),
        name: `${baseName}_unpivoted.xlsx`,
        info: `Unpivoted into ${unpivoted.length - 1} normalized rows`
      };
    }

    // 11. Format Transcoding: XLS / XLSB / XLSM to standard XLSX
    if (mode === 'formatconv') {
      status('Converting to modern XLSX...');
      const outWb = window.XLSX.utils.book_new();
      for (const sName of wb.SheetNames) {
        window.XLSX.utils.book_append_sheet(outWb, wb.Sheets[sName], sName);
      }
      return {
        blob: writeWorkbook(outWb, 'xlsx'),
        name: `${baseName}.xlsx`,
        info: 'Converted to standard OpenXML (.xlsx)'
      };
    }

    // 12. Export to Structured Text: Markdown, LaTeX, XML, YAML, HTML
    if (mode === 'md') {
      const md = sheetToMarkdown(aoa);
      return {
        blob: new Blob([md], { type: 'text/markdown;charset=utf-8' }),
        name: `${baseName}.md`,
        info: 'Converted sheet to Markdown table'
      };
    }

    if (mode === 'latex') {
      const tex = sheetToLatex(aoa);
      return {
        blob: new Blob([tex], { type: 'text/plain;charset=utf-8' }),
        name: `${baseName}.tex`,
        info: 'Converted sheet to LaTeX tabular'
      };
    }

    if (mode === 'xml') {
      const xml = sheetToXml(aoa);
      return {
        blob: new Blob([xml], { type: 'application/xml;charset=utf-8' }),
        name: `${baseName}.xml`,
        info: 'Converted sheet to XML document'
      };
    }

    if (mode === 'yaml') {
      const yaml = sheetToYaml(aoa);
      return {
        blob: new Blob([yaml], { type: 'text/yaml;charset=utf-8' }),
        name: `${baseName}.yaml`,
        info: 'Converted sheet to YAML'
      };
    }

    if (mode === 'html') {
      const html = sheetToHtmlTable(aoa);
      return {
        blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
        name: `${baseName}.html`,
        info: 'Converted sheet to HTML table'
      };
    }

    throw new Error('Unsupported Excel tool mode: ' + mode);
  }
};
