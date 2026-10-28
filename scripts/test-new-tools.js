// Real-user test suite for newly added tools
// Simulates browser execution environment and tests every new tool with real files/data.

const fs = require('fs');
const path = require('path');

// Setup browser globals simulation for Node
const XLSX = require('xlsx');
const JSZip = require('jszip');
const PDFLib = require('@cantoo/pdf-lib');
const Papa = require('papaparse');

global.window = {
  XLSX,
  JSZip,
  PDFLib,
  Papa,
  FP: {}
};

global.document = {
  createElement: (tag) => {
    return {
      tagName: tag.toUpperCase(),
      style: {},
      children: [],
      appendChild: function(c) { this.children.push(c); return c; },
      getContext: () => ({
        fillRect: () => {},
        drawImage: () => {},
        putImageData: () => {},
        createImageData: (w, h) => ({ data: new Uint8Array(w * h * 4) }),
        getImageData: (x, y, w, h) => ({ data: new Uint8Array(w * h * 4), width: w, height: h })
      }),
      toBlob: function(cb, type) { cb(new Blob(['mock_img'], { type: type || 'image/png' })); },
      toDataURL: () => 'data:image/png;base64,mock',
      innerHTML: '',
      textContent: ''
    };
  },
  getElementById: (id) => ({
    textContent: 'test',
    innerHTML: '',
    value: '100',
    addEventListener: () => {}
  }),
  querySelectorAll: () => []
};

global.navigator = {
  clipboard: {
    writeText: async () => {}
  }
};

global.Image = function() {
  const img = {
    width: 100,
    height: 100,
    addEventListener: () => {}
  };
  setTimeout(() => { if (img.onload) img.onload(); }, 1);
  return img;
};

global.URL = {
  createObjectURL: () => 'blob:mock-url',
  revokeObjectURL: () => {}
};

global.Blob = global.Blob || require('buffer').Blob;

const formInputs = {};
global.v = (id) => formInputs[id] !== undefined ? formInputs[id] : '';
global.vb = (id) => formInputs[id] === true || formInputs[id] === 'true' || formInputs[id] === '1';
global.setV = (id, val) => { formInputs[id] = val; };
global.L = {
  pdflib: async () => PDFLib,
  zip: async () => JSZip
};

global.toBlob = (c, type, q) => new Promise(r => c.toBlob(r, type, q));

global.zipBlobs = async (items) => {
  const zip = new JSZip();
  for (const it of items) zip.file(it.name, it.blob);
  return zip.generateAsync({ type: 'blob' });
};

global.zipOrOne = async (items, zipName) => items.length === 1 ? items[0] : { blob: await global.zipBlobs(items), name: zipName };

global.fmtSize = (s) => `${s} B`;
global.base = (s) => String(s || '').replace(/\.[^/.]+$/, '');
global.AudioContext = global.window.AudioContext = function() {
  return {
    decodeAudioData: async () => ({
      numberOfChannels: 2,
      length: 1000,
      sampleRate: 44100,
      getChannelData: (ch) => new Float32Array(1000).fill(0.1 * (ch + 1))
    }),
    createBuffer: (ch, len, sr) => {
      const data = Array.from({ length: ch }, () => new Float32Array(len));
      return {
        numberOfChannels: ch,
        length: len,
        sampleRate: sr,
        getChannelData: (c) => data[c]
      };
    }
  };
};

global.OfflineAudioContext = function(ch, len, sr) {
  return {
    createBufferSource: () => ({
      playbackRate: { value: 1 },
      connect: () => {},
      start: () => {}
    }),
    destination: {},
    startRendering: async () => {
      const data = Array.from({ length: ch }, () => new Float32Array(len).fill(0.2));
      return {
        numberOfChannels: ch,
        length: len,
        sampleRate: sr,
        getChannelData: (c) => data[c]
      };
    }
  };
};

global.load = async (lib) => {
  if (lib.includes('xlsx')) global.window.XLSX = XLSX;
  if (lib.includes('jszip')) global.window.JSZip = JSZip;
  if (lib.includes('pdf-lib')) global.window.PDFLib = PDFLib;
  if (lib.includes('papaparse')) global.window.Papa = Papa;
  if (lib.includes('jsQR')) global.window.jsQR = () => ({ data: 'https://fileopia.com/tools' });
  return true;
};
global.T = { working: 'Working', o_format: 'Format' };
global.TOOLS = {};
global.sel = () => ''; global.inp = () => ''; global.chk = () => ''; global.esc = s => s;

function createMockFile(name, content, type = 'application/octet-stream') {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return {
    name,
    size: buf.length,
    type,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    text: async () => buf.toString('utf8')
  };
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✔ PASS: ${msg}`);
  } else {
    failed++;
    console.error(`  ✘ FAIL: ${msg}`);
  }
}

async function runTests() {
  console.log('=== REAL USER AUTOMATED TEST SUITE ===\n');

  // 1. TEST EXCELUTIL.JS
  console.log('--- Testing excelutil.js (Excel & Spreadsheet Suite) ---');
  eval(fs.readFileSync('src/tools/excelutil.js', 'utf8'));
  const excel = global.TOOLS.excelutil;

  // Test 1.1: Unprotect Excel Sheet
  {
    const zip = new JSZip();
    zip.file('xl/worksheets/sheet1.xml', '<worksheet><sheetProtection password="ABCD" sheet="1"/><sheetData/></worksheet>');
    zip.file('xl/workbook.xml', '<workbook><workbookProtection lockStructure="1"/></workbook>');
    zip.file('[Content_Types].xml', '<Types/>');
    const u8 = await zip.generateAsync({ type: 'uint8array' });
    const f = createMockFile('protected.xlsx', u8);

    excel.vars = { mode: 'unprotect' };
    const res = await excel.run([f], () => {});
    assert(res && res.blob && res.name === 'protected_unlocked.xlsx', 'Unprotect Excel sheet generates unlocked XLSX');
    const unzipped = await JSZip.loadAsync(await res.blob.arrayBuffer());
    const sheetXml = await unzipped.file('xl/worksheets/sheet1.xml').async('string');
    assert(!sheetXml.includes('sheetProtection'), 'sheetProtection tag successfully stripped');
  }

  // Test 1.2: Merge Excel Files
  {
    const wb1 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb1, XLSX.utils.aoa_to_sheet([['A', 'B'], [1, 2]]), 'Sheet1');
    const f1 = createMockFile('file1.xlsx', XLSX.write(wb1, { bookType: 'xlsx', type: 'buffer' }));

    const wb2 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet([['A', 'B'], [3, 4]]), 'Sheet1');
    const f2 = createMockFile('file2.xlsx', XLSX.write(wb2, { bookType: 'xlsx', type: 'buffer' }));

    excel.vars = { mode: 'merge' };
    setV('merge_style', 'tabs');
    const res = await excel.run([f1, f2], () => {});
    assert(res && res.blob && res.name === 'merged_spreadsheets.xlsx', 'Merge Excel workbooks into tabs');

    setV('merge_style', 'stack');
    const resStack = await excel.run([f1, f2], () => {});
    assert(resStack && resStack.blob, 'Merge Excel by stacking rows');
  }

  // Test 1.3: Split Excel Workbook
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Jan', 100]]), 'January');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Feb', 200]]), 'February');
    const f = createMockFile('annual.xlsx', XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));

    excel.vars = { mode: 'split' };
    setV('split_fmt', 'xlsx');
    const res = await excel.run([f], () => {});
    assert(res && res.blob && res.name === 'annual_sheets.zip', 'Split Excel workbook into ZIP archive');
    const zip = await JSZip.loadAsync(await res.blob.arrayBuffer());
    assert(zip.file('January.xlsx') && zip.file('February.xlsx'), 'ZIP contains individual sheet files');
  }

  // Test 1.4: Compare Excel Files
  {
    const wb1 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb1, XLSX.utils.aoa_to_sheet([['ID', 'Val'], [1, 'A'], [2, 'B']]), 'Data');
    const f1 = createMockFile('v1.xlsx', XLSX.write(wb1, { bookType: 'xlsx', type: 'buffer' }));

    const wb2 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet([['ID', 'Val'], [1, 'A'], [2, 'MODIFIED']]), 'Data');
    const f2 = createMockFile('v2.xlsx', XLSX.write(wb2, { bookType: 'xlsx', type: 'buffer' }));

    excel.vars = { mode: 'compare' };
    const res = await excel.run([f1, f2], () => {});
    assert(res && res.blob && res.info.includes('Found 1 cell difference'), 'Compare Excel detects modified cells');
  }

  // Test 1.5: Transpose Excel Data
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['R1C1', 'R1C2', 'R1C3'], ['R2C1', 'R2C2', 'R2C3']]), 'Matrix');
    const f = createMockFile('matrix.xlsx', XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));

    excel.vars = { mode: 'transpose' };
    const res = await excel.run([f], () => {});
    assert(res && res.blob && res.name === 'matrix_transposed.xlsx', 'Transpose Excel matrix');
    const tWb = XLSX.read(await res.blob.arrayBuffer());
    const tSheet = XLSX.utils.sheet_to_json(tWb.Sheets[tWb.SheetNames[0]], { header: 1 });
    assert(tSheet.length === 3 && tSheet[0].length === 2, '2x3 matrix successfully transposed to 3x2 matrix');
  }

  // Test 1.6: Deduplicate Excel Rows
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Name', 'Email'], ['John', 'j@test.com'], ['John', 'j@test.com'], ['Mary', 'm@test.com']]), 'Users');
    const f = createMockFile('users.xlsx', XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));

    excel.vars = { mode: 'dedupe' };
    setV('dedupe_scope', 'all');
    const res = await excel.run([f], () => {});
    assert(res && res.info.includes('Removed 1 duplicate row'), 'Deduplicate Excel removes duplicate records');
  }

  // Test 1.7: Unpivot / Flatten Crosstab
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Product', 'Q1', 'Q2'], ['Laptop', 100, 150]]), 'Sales');
    const f = createMockFile('sales.xlsx', XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));

    excel.vars = { mode: 'unpivot' };
    const res = await excel.run([f], () => {});
    assert(res && res.blob && res.info.includes('Unpivoted into 2 normalized rows'), 'Unpivot wide crosstab to normalized rows');
  }

  // Test 1.8: Markdown, LaTeX, XML, YAML, HTML exports
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Code', 'Name'], ['US', 'United States'], ['IN', 'India']]), 'Data');
    const f = createMockFile('countries.xlsx', XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));

    excel.vars = { mode: 'md' };
    const rMd = await excel.run([f], () => {});
    const mdTxt = await rMd.blob.text();
    assert(mdTxt.includes('| Code | Name |') && mdTxt.includes('| US | United States |'), 'Excel to Markdown table');

    excel.vars = { mode: 'latex' };
    const rTex = await excel.run([f], () => {});
    const texTxt = await rTex.blob.text();
    assert(texTxt.includes('\\begin{tabular}') && texTxt.includes('United States'), 'Excel to LaTeX tabular');

    excel.vars = { mode: 'xml' };
    const rXml = await excel.run([f], () => {});
    const xmlTxt = await rXml.blob.text();
    assert(xmlTxt.includes('<records>') && xmlTxt.includes('<code>US</code>'), 'Excel to XML');

    excel.vars = { mode: 'yaml' };
    const rYaml = await excel.run([f], () => {});
    const yamlTxt = await rYaml.blob.text();
    assert(yamlTxt.includes('- Code: "US"') && yamlTxt.includes('Name: "United States"'), 'Excel to YAML');

    excel.vars = { mode: 'html' };
    const rHtml = await excel.run([f], () => {});
    const htmlTxt = await rHtml.blob.text();
    assert(htmlTxt.includes('<table') && htmlTxt.includes('<td>United States</td>'), 'Excel to HTML table');
  }

  // Test 1.9: Mock Data Generator
  {
    excel.vars = { mode: 'mockdata' };
    setV('mock_rows', '50');
    setV('mock_fmt', 'xlsx');
    const res = await excel.run([], () => {});
    assert(res && res.blob && res.info.includes('50 realistic spreadsheet rows'), 'Mock data generator creates valid spreadsheet');
  }

  // 2. TEST IWORK.JS (Apple Pages, Numbers, Keynote)
  console.log('\n--- Testing iwork.js (Apple iWork Suite) ---');
  eval(fs.readFileSync('src/tools/iwork.js', 'utf8'));
  const iwork = global.TOOLS.iwork;

  {
    // Create mock Apple .pages package with QuickLook/Preview.pdf
    const zip = new JSZip();
    zip.file('QuickLook/Preview.pdf', '%PDF-1.4 mock vector document');
    const u8 = await zip.generateAsync({ type: 'uint8array' });
    const fPages = createMockFile('proposal.pages', u8);

    iwork.vars = { mode: 'pages' };
    const res = await iwork.run([fPages], () => {});
    assert(res && res.blob && res.name === 'proposal.pdf', 'Pages to PDF extracts authentic vector PDF');
    const pdfText = await res.blob.text();
    assert(pdfText.includes('%PDF-1.4'), 'Valid PDF extracted from Apple Pages package');

    const fNumbers = createMockFile('budget.numbers', u8);
    iwork.vars = { mode: 'numbers2xlsx' };
    const resNum = await iwork.run([fNumbers], () => {});
    assert(resNum && resNum.blob && resNum.name === 'budget.xlsx', 'Numbers to XLSX creates Excel workbook');
  }

  // 3. TEST THREED.JS (3D STL, OBJ, Viewer)
  console.log('\n--- Testing threed.js (3D STL & OBJ Suite) ---');
  eval(fs.readFileSync('src/tools/threed.js', 'utf8'));
  const threed = global.TOOLS.threed;

  {
    const asciiStl = `solid test
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 1 0
    endloop
  endfacet
endsolid test`;
    const fStl = createMockFile('model.stl', asciiStl);

    threed.vars = { mode: 'stl2obj' };
    const resObj = await threed.run([fStl], () => {});
    assert(resObj && resObj.blob && resObj.name === 'model.obj', 'STL to OBJ converts 3D mesh');
    const objTxt = await resObj.blob.text();
    assert(objTxt.includes('v 0 0 0') && objTxt.includes('f 1 2 3'), 'OBJ output contains vertices and faces');

    const fObj = createMockFile('model.obj', objTxt);
    threed.vars = { mode: 'obj2stl' };
    const resStl = await threed.run([fObj], () => {});
    assert(resStl && resStl.blob && resStl.name === 'model.stl', 'OBJ to STL converts to binary STL');

    threed.vars = { mode: 'viewer' };
    const resView = await threed.run([fStl], () => {});
    assert(resView && resView.info.includes('Triangles'), '3D STL viewer parses dimensions and triangles');
  }

  // 4. TEST DOCTEXT.JS (DOCX, EPUB, MOBI to TXT)
  console.log('\n--- Testing doctext.js (Document Text Extractor) ---');
  eval(fs.readFileSync('src/tools/doctext.js', 'utf8'));
  const doctext = global.TOOLS.doctext;

  {
    // Mock DOCX
    const zipDocx = new JSZip();
    zipDocx.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Hello Fileopia Word Test</w:t></w:r></w:p></w:body></w:document>');
    const docxBuf = await zipDocx.generateAsync({ type: 'uint8array' });
    const fDocx = createMockFile('document.docx', docxBuf);

    doctext.vars = { mode: 'docx2txt' };
    const resDocx = await doctext.run([fDocx], () => {});
    assert(resDocx && (await resDocx.blob.text()).includes('Hello Fileopia Word Test'), 'DOCX to TXT extracts plain text');

    // Mock EPUB
    const zipEpub = new JSZip();
    zipEpub.file('OEBPS/chapter1.xhtml', '<html><body><p>Chapter 1: The Beginning</p></body></html>');
    const epubBuf = await zipEpub.generateAsync({ type: 'uint8array' });
    const fEpub = createMockFile('book.epub', epubBuf);

    doctext.vars = { mode: 'epub2txt' };
    const resEpub = await doctext.run([fEpub], () => {});
    assert(resEpub && (await resEpub.blob.text()).includes('Chapter 1: The Beginning'), 'EPUB to TXT extracts ebook text');
  }

  // 5. TEST ICOCONV.JS (ICO to PNG)
  console.log('\n--- Testing icoconv.js (ICO Multi-Resolution Extractor) ---');
  eval(fs.readFileSync('src/tools/icoconv.js', 'utf8'));
  const icoconv = global.TOOLS.icoconv;

  {
    // Build binary ICO containing an embedded PNG
    const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]);
    const icoBuf = Buffer.alloc(6 + 16 + pngMagic.length);
    icoBuf.writeUInt16LE(0, 0); // reserved
    icoBuf.writeUInt16LE(1, 2); // type 1 (ico)
    icoBuf.writeUInt16LE(1, 4); // count 1
    // Dir entry
    icoBuf.writeUInt8(32, 6); // width
    icoBuf.writeUInt8(32, 7); // height
    icoBuf.writeUInt8(0, 8);  // colors
    icoBuf.writeUInt8(0, 9);  // reserved
    icoBuf.writeUInt16LE(1, 10); // planes
    icoBuf.writeUInt16LE(32, 12); // bpp
    icoBuf.writeUInt32LE(pngMagic.length, 14); // bytes in res
    icoBuf.writeUInt32LE(22, 18); // offset
    pngMagic.copy(icoBuf, 22);

    const fIco = createMockFile('app.ico', icoBuf);
    setV('ico_mode', 'best');
    const resIco = await icoconv.run([fIco], () => {});
    assert(resIco && resIco.blob && resIco.name.includes('32x32.png'), 'ICO to PNG extracts icon resolution');
  }

  // 6. TEST DJVU.JS (DjVu to PDF)
  console.log('\n--- Testing djvu.js (DjVu to PDF Converter) ---');
  eval(fs.readFileSync('src/tools/djvu.js', 'utf8'));
  const djvu = global.TOOLS.djvu;

  {
    const djvuBuf = Buffer.alloc(32);
    djvuBuf.write('AT&TFORM', 0, 'ascii');
    djvuBuf.writeUInt32BE(20, 8);
    djvuBuf.write('DJVUINFO', 12, 'ascii');
    djvuBuf.writeUInt32BE(8, 20); // INFO chunk size
    djvuBuf.writeUInt16BE(800, 24); // width
    djvuBuf.writeUInt16BE(1200, 26); // height
    djvuBuf.writeUInt16LE(300, 28); // dpi

    const fDjvu = createMockFile('scanned_book.djvu', djvuBuf);
    const resDjvu = await djvu.run([fDjvu], () => {});
    assert(resDjvu && resDjvu.blob && resDjvu.name === 'scanned_book.pdf', 'DjVu to PDF generates multi-page PDF');
  }

  // 7. TEST DEVUTILS.JS & TEXTTOOLS.JS
  console.log('\n--- Testing devutils.js & texttools.js ---');
  eval(fs.readFileSync('src/tools/devutils.js', 'utf8'));
  eval(fs.readFileSync('src/tools/texttools.js', 'utf8'));

  {
    const texttools = global.TOOLS.texttools;
    texttools.vars = { mode: 'slug' };
    setV('slugsrc', 'This is a Super Cool Fileopia Tool!');
    const rSlug = await texttools.run([], () => {});
    assert(rSlug && (await rSlug.blob.text()).includes('this-is-a-super-cool-fileopia-tool'), 'URL slug generator cleans string');

    texttools.vars = { mode: 'morse' };
    setV('morseop', 'enc');
    setV('morsetxt', 'SOS');
    const rMorse = await texttools.run([], () => {});
    assert(rMorse && (await rMorse.blob.text()).includes('... --- ...'), 'Morse code translator generates correct code');

    texttools.vars = { mode: 'rot13' };
    setV('rottxt', 'hello');
    const rRot = await texttools.run([], () => {});
    assert(rRot && (await rRot.blob.text()).includes('uryyb'), 'ROT13 cipher encodes correctly');

    texttools.vars = { mode: 'nato' };
    setV('natoword', 'FILE');
    const rNato = await texttools.run([], () => {});
    assert(rNato && (await rNato.blob.text()).includes('Foxtrot - India - Lima - Echo'), 'NATO phonetic alphabet translator');

    texttools.vars = { mode: 'bintext' };
    setV('binop', 'text2bin');
    setV('bintxt', 'A');
    const rBin = await texttools.run([], () => {});
    assert(rBin && (await rBin.blob.text()).includes('01000001'), 'Binary to text encodes binary bytes');

    texttools.vars = { mode: 'sort' };
    const sortFile = createMockFile('list.txt', 'Banana\nApple\nCherry');
    setV('sortdir', 'az');
    const rSort = await texttools.run([sortFile], () => {});
    assert(rSort && (await rSort.blob.text()).trim() === 'Apple\nBanana\nCherry', 'Sort lines A-Z alphabetically');
  }

  // 8. TEST HEALTHCALC.JS
  console.log('\n--- Testing healthcalc.js (Health & Fitness Suite) ---');
  eval(fs.readFileSync('src/tools/healthcalc.js', 'utf8'));
  const health = global.TOOLS.healthcalc;

  {
    health.vars = { mode: 'calorie' };
    setV('calgender', 'm');
    setV('calage', '28');
    setV('calwt', '75');
    setV('calht', '178');
    setV('calact', '1.55');
    const rCal = await health.run([], () => {});
    assert(rCal && rCal.info.includes('Maintenance:'), 'TDEE Calorie calculator calculates energy expenditure');

    health.vars = { mode: 'water' };
    setV('watwt', '70');
    setV('watact', '30');
    setV('watcli', 'normal');
    const rWat = await health.run([], () => {});
    assert(rWat && rWat.info.includes('Daily Water:'), 'Daily water intake calculator calculates volume');

    health.vars = { mode: 'sleep' };
    setV('sleeptype', 'wake');
    setV('sleeptime', '07:00');
    const rSleep = await health.run([], () => {});
    assert(rSleep && rSleep.info.includes('Recommended Bedtime:'), 'Sleep cycle calculator projects 90-min REM cycles');

    health.vars = { mode: 'petage' };
    setV('pettype', 'dog_m');
    setV('petageyrs', '5');
    const rPet = await health.run([], () => {});
    assert(rPet && rPet.info.includes('pet yrs ='), 'Pet age to human years conversion');
  }

  // 9. TEST FINANCECALC.JS
  console.log('\n--- Testing financecalc.js (Finance & Money Suite) ---');
  eval(fs.readFileSync('src/tools/financecalc.js', 'utf8'));
  const finance = global.TOOLS.financecalc;

  {
    finance.vars = { mode: 'compound' };
    setV('ciprinc', '10000');
    setV('cirate', '7');
    setV('ciyears', '10');
    setV('cifreq', '12');
    setV('cimonthly', '100');
    const rCmp = await finance.run([], () => {});
    assert(rCmp && rCmp.info.includes('Future Balance: $'), 'Compound interest calculator projects returns');

    finance.vars = { mode: 'simple' };
    setV('siprinc', '5000');
    setV('sirate', '5');
    setV('sitime', '3');
    const rSim = await finance.run([], () => {});
    assert(rSim && rSim.info.includes('Total: $5,750'), 'Simple interest calculator computes I=P*r*t');

    finance.vars = { mode: 'salary' };
    setV('salrate', '25');
    setV('salperiod', 'hour');
    setV('salhrs', '40');
    setV('salwks', '52');
    const rSal = await finance.run([], () => {});
    assert(rSal && rSal.info.includes('Annual: $52,000'), 'Hourly wage to annual salary conversion');

    finance.vars = { mode: 'tip' };
    setV('tipbill', '100');
    setV('tippct', '18');
    setV('tipsplit', '2');
    const rTip = await finance.run([], () => {});
    assert(rTip && rTip.info.includes('Per Person: $59.00'), 'Tip and split bill calculator');

    finance.vars = { mode: 'tax' };
    setV('taxamt', '100');
    setV('taxrate', '10');
    setV('taxmode', 'add');
    const rTax = await finance.run([], () => {});
    assert(rTax && rTax.info.includes('Gross: $110.00'), 'Sales Tax / VAT calculator');

    finance.vars = { mode: 'margin' };
    setV('mgcost', '50');
    setV('mgsell', '100');
    const rMar = await finance.run([], () => {});
    assert(rMar && rMar.info.includes('Margin: 50.0%'), 'Profit margin and markup calculator');

    finance.vars = { mode: 'pctchange' };
    setV('pctfrom', '100');
    setV('pctto', '150');
    const rPct = await finance.run([], () => {});
    assert(rPct && rPct.info.includes('+50.0% Increase'), 'Percentage increase/decrease calculator');
  }

  // 10. TEST MATHCALC.JS
  console.log('\n--- Testing mathcalc.js (Math & Academic Suite) ---');
  eval(fs.readFileSync('src/tools/mathcalc.js', 'utf8'));
  const math = global.TOOLS.mathcalc;

  {
    math.vars = { mode: 'fraction' };
    setV('fr1', '1/2');
    setV('frop', '+');
    setV('fr2', '1/4');
    const rFrc = await math.run([], () => {});
    assert(rFrc && rFrc.info.includes('3/4'), 'Fraction calculator simplifies math fractions');

    math.vars = { mode: 'stats' };
    setV('statnums', '10, 20, 30, 40, 50');
    const rSts = await math.run([], () => {});
    assert(rSts && rSts.info.includes('Mean: 30'), 'Statistics calculator calculates mean and metrics');

    math.vars = { mode: 'quadratic' };
    setV('qa', '1'); setV('qb', '-5'); setV('qc', '6');
    const rQda = await math.run([], () => {});
    assert(rQda && rQda.info.includes('x₁ = 3.000') && rQda.info.includes('x₂ = 2.000'), 'Quadratic equation solver finds roots');
  }

  // 11. TEST DEVUTILS.JS
  console.log('\n--- Testing devutils.js (Developer Utilities Suite) ---');
  const dev = global.TOOLS.devutils;

  {
    dev.vars = { mode: 'chmod' };
    setV('chmodval', '755');
    const rCh = await dev.run([], () => {});
    assert(rCh && rCh.info.includes('rwxr-xr-x'), 'Linux chmod permissions calculator computes 755');

    dev.vars = { mode: 'cidr' };
    setV('cidrip', '192.168.1.0/24');
    const rCidr = await dev.run([], () => {});
    assert(rCidr && rCidr.info.includes('254 usable hosts'), 'IP subnet CIDR calculator computes host limits');

    dev.vars = { mode: 'entities' };
    setV('entmode', 'encode');
    setV('enttxt', '<div class="test">&</div>');
    const rEnt = await dev.run([], () => {});
    assert(rEnt && (await rEnt.blob.text()).includes('&#60;div class=&#34;test&#34;&#62;&#38;&#60;/div&#62;'), 'HTML entities encoder');

    dev.vars = { mode: 'contrast' };
    setV('colfg', '#000000');
    setV('colbg', '#ffffff');
    const rCnt = await dev.run([], () => {});
    assert(rCnt && rCnt.info.includes('Contrast Ratio: 21.00:1'), 'WCAG color contrast checker evaluates 21:1 ratio');

    dev.vars = { mode: 'cron' };
    setV('cronexp', '0 12 * * *');
    const rCron = await dev.run([], () => {});
    assert(rCron && (await rCron.blob.text()).includes('0 12 * * *'), 'Cron expression generator builds schedule');
  }

  // 12. TEST CODECONV.JS
  console.log('\n--- Testing codeconv.js (Structured Data Converters) ---');
  eval(fs.readFileSync('src/tools/codeconv.js', 'utf8'));
  const code = global.TOOLS.codeconv;

  {
    code.vars = { mode: 'json2yaml' };
    const jsonF = createMockFile('config.json', JSON.stringify({ name: 'Fileopia', active: true, ports: [80, 443] }));
    const rYaml = await code.run([jsonF], () => {});
    const yamlTxt = await rYaml.blob.text();
    assert(yamlTxt.includes('name: Fileopia') && yamlTxt.includes('- 80'), 'JSON to YAML converter');

    code.vars = { mode: 'yaml2json' };
    const yamlF = createMockFile('config.yaml', 'name: Fileopia\nversion: 2.0');
    const rJson = await code.run([yamlF], () => {});
    const jsonTxt = await rJson.blob.text();
    assert(jsonTxt.includes('"name": "Fileopia"'), 'YAML to JSON converter');

    code.vars = { mode: 'csv2sql' };
    setV('sqltable', 'customers');
    const csvF = createMockFile('users.csv', 'id,name,email\n1,Alice,alice@test.com\n2,Bob,bob@test.com');
    const rSql = await code.run([csvF], () => {});
    const sqlTxt = await rSql.blob.text();
    assert(sqlTxt.includes('CREATE TABLE IF NOT EXISTS customers') && sqlTxt.includes('INSERT INTO customers'), 'CSV to SQL query generator');
  }

  // 13. TEST EPSCONV.JS
  console.log('\n--- Testing epsconv.js (PostScript & EPS Suite) ---');
  eval(fs.readFileSync('src/tools/epsconv.js', 'utf8'));
  const eps = global.TOOLS.epsconv;

  {
    const epsText = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 100 100
newpath
0 0 moveto
100 0 lineto
100 100 lineto
closepath
fill`;
    const epsF = createMockFile('vector.eps', epsText);

    eps.vars = { to: 'svg' };
    const rEpsSvg = await eps.run([epsF], () => {});
    assert(rEpsSvg && (await rEpsSvg.blob.text()).includes('<svg'), 'EPS to SVG converts vector paths');

    eps.vars = { to: 'png' };
    const rEpsPng = await eps.run([epsF], () => {});
    assert(rEpsPng && rEpsPng.blob && rEpsPng.name === 'vector.png', 'EPS to PNG renders image');
  }

  // 14. TEST CDR.JS (CorelDRAW Version Converter & Tools)
  console.log('\n--- Testing cdr.js (CorelDRAW Suite) ---');
  eval(fs.readFileSync('src/tools/cdr.js', 'utf8'));
  const cdr = global.TOOLS.cdr;

  {
    // Build mock CorelDRAW 2024 ZIP package (v25)
    const cdrZip = new JSZip();
    cdrZip.file('metadata/metadata.xml', '<metadata><ApplicationVersion>25.0.0.230</ApplicationVersion><Version>25.0.0.230</Version></metadata>');
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF, 0x61, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
    cdrZip.file('previews/thumbnail.png', pngHeader);

    const cdrU8 = await cdrZip.generateAsync({ type: 'uint8array' });
    const fCdr = createMockFile('design_2024.cdr', cdrU8);

    // Test CorelDRAW Downgrader to CorelDRAW 11 (Legacy RIFF CDRB)
    cdr.vars = { mode: 'convert' };
    setV('cdrver', '11');
    const res11 = await cdr.run([fCdr], () => {});
    assert(res11 && res11.name.includes('_Corel11.cdr'), 'CorelDRAW Version Converter creates CorelDRAW 11 file');
    const u8Cdr11 = new Uint8Array(await res11.blob.arrayBuffer());
    assert(String.fromCharCode(...u8Cdr11.slice(0, 4)) === 'RIFF', 'CorelDRAW 11 output is RIFF container');
    assert(String.fromCharCode(...u8Cdr11.slice(8, 12)) === 'CDRB', 'CorelDRAW 11 output FormType is CDRB');
    assert(res11.extra && res11.extra.some(x => x.name.includes('_Corel11_Vector_Import.pdf')), 'CorelDRAW 11 includes companion Vector Import PDF');

    // Test CorelDRAW Downgrader to CorelDRAW 9 (Legacy RIFF CDR9 - Printing Press Legend)
    setV('cdrver', '9');
    const res9 = await cdr.run([fCdr], () => {});
    assert(res9 && res9.name.includes('_Corel9.cdr'), 'CorelDRAW Version Converter creates CorelDRAW 9 file');
    const u8Cdr9 = new Uint8Array(await res9.blob.arrayBuffer());
    assert(String.fromCharCode(...u8Cdr9.slice(8, 12)) === 'CDR9', 'CorelDRAW 9 output FormType is CDR9');
    assert(res9.extra && res9.extra.some(x => x.name.includes('_Corel9_Vector_Import.pdf')), 'CorelDRAW 9 includes companion Vector Import PDF');

    // Test CorelDRAW Downgrader to X7
    setV('cdrver', 'x7');
    const resDown = await cdr.run([fCdr], () => {});
    assert(resDown && resDown.name.includes('_X7.cdr'), 'CorelDRAW Version Converter creates X7 downgraded file');

    // Verify metadata inside downgraded CDR
    const downZip = await JSZip.loadAsync(await resDown.blob.arrayBuffer());
    const downMeta = await downZip.file('metadata/metadata.xml').async('string');
    assert(downMeta.includes('17.0.0.491'), 'CorelDRAW internal version downgraded to 17.0.0.491 (X7)');

    // Test CDR to PDF
    cdr.vars = { mode: 'topdf' };
    const resPdf = await cdr.run([fCdr], () => {});
    assert(resPdf && resPdf.name.includes('.pdf'), 'CDR to PDF generates vector PDF');

    // Test CDR to PNG
    cdr.vars = { mode: 'topng' };
    const resPng = await cdr.run([fCdr], () => {});
    assert(resPng && resPng.name.includes('.png'), 'CDR to PNG extracts image preview');

    // Test Legacy CorelDRAW RIFF (X3 to Corel 11 downgrade)
    const riffBuf = Buffer.alloc(32);
    riffBuf.write('RIFF', 0, 'ascii');
    riffBuf.writeUInt32LE(24, 4);
    riffBuf.write('CDRD', 8, 'ascii'); // CorelDRAW X3
    const fRiff = createMockFile('old_banner.cdr', riffBuf);
    cdr.vars = { mode: 'convert' };
    setV('cdrver', '11');
    const resRiff = await cdr.run([fRiff], () => {});
    assert(resRiff && resRiff.name.includes('_Corel11.cdr'), 'Legacy CorelDRAW RIFF downgraded to CorelDRAW 11');
    const u8RiffPatched = new Uint8Array(await resRiff.blob.arrayBuffer());
    assert(String.fromCharCode(...u8RiffPatched.slice(8, 12)) === 'CDRB', 'RIFF FormType successfully patched to CDRB');
  }

  // 15. TEST AUDIOFX.JS (Reverse, Karaoke, Nightcore)
  console.log('\n--- Testing audiofx.js (Audio Utilities) ---');
  eval(fs.readFileSync('src/tools/audiofx.js', 'utf8'));
  const afx = global.TOOLS.audiofx;
  const mockAudio = createMockFile('song.mp3', Buffer.from([0, 1, 2, 3]), 'audio/mp3');

  afx.vars = { mode: 'reverse' };
  const rRev = await afx.run([mockAudio], () => {});
  assert(rRev && rRev.name.includes('_reversed.wav'), 'Reverse Audio generates reversed WAV');

  afx.vars = { mode: 'karaoke' };
  const rKar = await afx.run([mockAudio], () => {});
  assert(rKar && rKar.name.includes('_karaoke_instrumental.wav'), 'Vocal Remover generates karaoke instrumental WAV');

  afx.vars = { mode: 'nightcore' };
  setV('ncspeed', '1.25');
  const rNc = await afx.run([mockAudio], () => {});
  assert(rNc && rNc.name.includes('_nightcore.wav'), 'Nightcore Generator speeds up audio');

  // 16. TEST CODECONV.JS (HTML to MD, JSON Diff, CSV <-> TSV)
  console.log('\n--- Testing codeconv.js (HTML to MD, JSON Diff, CSV <-> TSV) ---');
  eval(fs.readFileSync('src/tools/codeconv.js', 'utf8'));
  const cc = global.TOOLS.codeconv;

  // HTML to Markdown
  cc.vars = { mode: 'html2md' };
  const htmlFile = createMockFile('article.html', '<h1>Hello World</h1><p>This is a <strong>test</strong> of <a href="https://example.com">links</a>.</p><ul><li>Item 1</li><li>Item 2</li></ul>');
  const rHmd = await cc.run([htmlFile], () => {});
  const mdStr = await rHmd.blob.text();
  assert(mdStr.includes('# Hello World') && mdStr.includes('**test**') && mdStr.includes('[links](https://example.com)'), 'HTML to Markdown converts tags accurately');

  // JSON Diff
  cc.vars = { mode: 'jsondiff' };
  const j1 = createMockFile('base.json', JSON.stringify({ name: 'Alice', age: 30, city: 'NY' }));
  const j2 = createMockFile('modified.json', JSON.stringify({ name: 'Alice', age: 31, country: 'USA' }));
  const rDiff = await cc.run([j1, j2], () => {});
  const diffStr = await rDiff.blob.text();
  assert(diffStr.includes('age') && diffStr.includes('country') && diffStr.includes('city'), 'JSON Diff detects added, removed, and changed keys');

  // CSV to TSV
  cc.vars = { mode: 'csv2tsv' };
  const csvFile = createMockFile('data.csv', 'id,name,role\n1,"Doe, John",Admin\n2,Jane,User');
  const rCsv2Tsv = await cc.run([csvFile], () => {});
  const tsvStr = await rCsv2Tsv.blob.text();
  assert(tsvStr.includes('1\tDoe, John\tAdmin'), 'CSV to TSV converts commas to tab stops cleanly');

  // TSV to CSV
  cc.vars = { mode: 'tsv2csv' };
  const tsvFile = createMockFile('data.tsv', 'id\tname\trole\n1\tDoe, John\tAdmin\n2\tJane\tUser');
  const rTsv2Csv = await cc.run([tsvFile], () => {});
  const csvStr = await rTsv2Csv.blob.text();
  assert(csvStr.includes('1,"Doe, John",Admin'), 'TSV to CSV adds smart quoting for commas');

  // 17. TEST COMIC.JS (CBR to CBZ Converter)
  console.log('\n--- Testing comic.js (CBR to CBZ) ---');
  global._LA = {
    Archive: {
      open: async () => ({
        extractFiles: async () => {},
        getFilesArray: async () => [
          { file: createMockFile('page01.jpg', Buffer.from([1, 2, 3])) },
          { file: createMockFile('page02.jpg', Buffer.from([4, 5, 6])) }
        ]
      })
    }
  };
  eval(fs.readFileSync('src/tools/comic.js', 'utf8'));
  const comic = global.TOOLS.comic;
  comic.vars = { mode: 'cbr2cbz' };
  const cbrFile = createMockFile('issue1.cbr', Buffer.from([0x52, 0x61, 0x72, 0x21])); // Rar!
  const rCbz = await comic.run([cbrFile], () => {});
  assert(rCbz && rCbz.name === 'issue1.cbz', 'CBR to CBZ repacks comic into CBZ format');
  const cbzZip = await JSZip.loadAsync(await rCbz.blob.arrayBuffer());
  assert(cbzZip.file('page01.jpg') && cbzZip.file('page02.jpg'), 'CBZ archive contains all comic pages');

  // 18. TEST CREATOR.JS (VTT to SRT Converter)
  console.log('\n--- Testing creator.js (VTT to SRT) ---');
  eval(fs.readFileSync('src/tools/creator.js', 'utf8'));
  const cr = global.TOOLS.creator;
  cr.vars = { mode: 'subtitles', subdir: 'vtt2srt' };
  const vttFile = createMockFile('sub.vtt', 'WEBVTT\n\n1\n00:01:23.456 --> 00:01:25.789\nHello world!\n');
  const rSrt = await cr.run([vttFile], () => {});
  const srtStr = await rSrt.blob.text();
  assert(!srtStr.includes('WEBVTT') && srtStr.includes('00:01:23,456'), 'VTT to SRT converts timecodes and removes WEBVTT header');

  // 19. TEST QRREAD.JS (Scan QR Code from Image)
  console.log('\n--- Testing qrread.js (Scan QR from Image) ---');
  eval(fs.readFileSync('src/tools/qrread.js', 'utf8'));
  const qrTool = global.TOOLS.qrread;
  const qrImgFile = createMockFile('qr.png', Buffer.from([0x89, 0x50, 0x4E, 0x47]));
  const rQr = await qrTool.run([qrImgFile], () => {});
  const qrDecoded = await rQr.blob.text();
  assert(qrDecoded === 'https://fileopia.com/tools', 'QR Scanner extracts URL from image');

  // 20. TEST TEXTTOOLS.JS (Batch 20: OnlineTools Text Suite)
  console.log('\n--- Testing texttools.js (Batch 20: OnlineTools Suite) ---');
  eval(fs.readFileSync('src/tools/texttools.js', 'utf8'));
  const tt20 = global.TOOLS.texttools;

  // Reverse Text
  tt20.vars = { mode: 'reversetext' };
  setV('revmode', 'chars');
  const rRevC = await tt20.run([createMockFile('t.txt', 'Hello')], () => {});
  assert(await rRevC.blob.text() === 'olleH', 'Reverse text (characters) flips string');

  setV('revmode', 'words');
  const rRevW = await tt20.run([createMockFile('t.txt', 'hello world')], () => {});
  assert(await rRevW.blob.text() === 'world hello', 'Reverse text (words) flips word order');

  // Text to Hex & Hex to Text
  tt20.vars = { mode: 'hextext' };
  setV('hexdir', 'text2hex');
  setV('hexdelim', 'space');
  const rT2H = await tt20.run([createMockFile('t.txt', 'Hello')], () => {});
  const hexStr = await rT2H.blob.text();
  assert(hexStr.toLowerCase() === '48 65 6c 6c 6f', 'Text to Hex encodes correctly');

  setV('hexdir', 'hex2text');
  const rH2T = await tt20.run([createMockFile('t.hex', '48 65 6c 6c 6f')], () => {});
  assert(await rH2T.blob.text() === 'Hello', 'Hex to Text decodes correctly');

  // Find & Replace Text
  tt20.vars = { mode: 'findreplace' };
  setV('frfind', 'fox');
  setV('frrep', 'cat');
  setV('frcase', false);
  const rFR = await tt20.run([createMockFile('t.txt', 'The quick brown fox jumps')], () => {});
  assert(await rFR.blob.text() === 'The quick brown cat jumps', 'Find and Replace substitutes matching words');

  // Extract Emails
  tt20.vars = { mode: 'extractemails' };
  setV('emdedup', true);
  setV('emsort', true);
  const rEM = await tt20.run([createMockFile('t.txt', 'Contact us at support@fileopia.com or sales@fileopia.com or support@fileopia.com')], () => {});
  const emStr = await rEM.blob.text();
  assert(emStr.includes('sales@fileopia.com') && emStr.includes('support@fileopia.com'), 'Extract Emails finds and deduplicates emails');

  // Extract URLs
  tt20.vars = { mode: 'extracturls' };
  setV('urldedup', true);
  const rURL = await tt20.run([createMockFile('t.txt', 'Visit https://fileopia.com/tools and https://google.com for info.')], () => {});
  const urlStr = await rURL.blob.text();
  assert(urlStr.includes('https://fileopia.com/tools') && urlStr.includes('https://google.com'), 'Extract URLs retrieves all web links');

  // Prefix & Suffix
  tt20.vars = { mode: 'prefixsuffix' };
  setV('psprefix', '>> ');
  setV('pssuffix', ' <<');
  const rPS = await tt20.run([createMockFile('t.txt', 'apple\nbanana')], () => {});
  assert(await rPS.blob.text() === '>> apple <<\n>> banana <<', 'Add Prefix & Suffix appends text to each line');

  // Text Repeater
  tt20.vars = { mode: 'repeater' };
  setV('repcount', '3');
  setV('repsep', 'comma');
  const rRep = await tt20.run([createMockFile('t.txt', 'ping')], () => {});
  assert(await rRep.blob.text() === 'ping, ping, ping', 'Text Repeater duplicates string with separator');

  // Shuffle List
  tt20.vars = { mode: 'shuffle' };
  const rShuf = await tt20.run([createMockFile('t.txt', '1\n2\n3\n4\n5\n6\n7\n8\n9\n10')], () => {});
  const shufLines = (await rShuf.blob.text()).split('\n');
  assert(shufLines.length === 10, 'Shuffle List preserves all items');

  // Filter Lines
  tt20.vars = { mode: 'filterlines' };
  setV('flquery', 'error');
  setV('flmode', 'keep');
  const rFL = await tt20.run([createMockFile('t.txt', 'INFO: ok\nERROR: disk full\nDEBUG: trace\nERROR: timeout')], () => {});
  const flStr = await rFL.blob.text();
  assert(flStr.includes('disk full') && flStr.includes('timeout') && !flStr.includes('INFO'), 'Filter Lines keeps matching lines');

  // Remove Empty Lines
  tt20.vars = { mode: 'rmemptylines' };
  setV('rmleadtrail', true);
  const rRM = await tt20.run([createMockFile('t.txt', 'line 1\n\n   \nline 2\n\nline 3\n')], () => {});
  assert(await rRM.blob.text() === 'line 1\nline 2\nline 3', 'Remove Empty Lines purges blank and whitespace rows');

  // 21. TEST MATHCALC.JS (Sum & Average Calculator)
  console.log('\n--- Testing mathcalc.js (Sum & Average) ---');
  eval(fs.readFileSync('src/tools/mathcalc.js', 'utf8'));
  const mc20 = global.TOOLS.mathcalc;
  mc20.vars = { mode: 'sumavg' };
  setV('statnums', '10, 20, 30, 40');
  const rSumAvg = await mc20.run([], () => {});
  assert(rSumAvg && rSumAvg.blob && rSumAvg.info.includes('Mean: 25.00'), 'Sum & Average calculates mean 25.00 accurately');

  // 22. TEST CODECONV.JS (Change CSV Delimiter)
  console.log('\n--- Testing codeconv.js (Change Delimiter) ---');
  eval(fs.readFileSync('src/tools/codeconv.js', 'utf8'));
  const cc20 = global.TOOLS.codeconv;
  cc20.vars = { mode: 'changedelimiter' };
  setV('srcdelim', ',');
  setV('dstdelim', ';');
  const rDelim = await cc20.run([createMockFile('d.csv', 'name,role,age\nAlice,Admin,30\n"Bob, Jr.",User,25')], () => {});
  const delimStr = await rDelim.blob.text();
  assert(delimStr.includes('name;role;age') && delimStr.includes('"Bob, Jr.";User;25'), 'Change CSV Delimiter preserves quoted cells with target delimiter');

  // 23. TEST PHOTOADJUST.JS (Pixelate, Grayscale, Color to Transparent)
  console.log('\n--- Testing photoadjust.js (Image Micro-Tools) ---');
  eval(fs.readFileSync('src/tools/photoadjust.js', 'utf8'));
  const pa20 = global.TOOLS.photoadjust;
  const mockImg = createMockFile('pic.jpg', Buffer.from([0xFF, 0xD8, 0xFF]));

  pa20.vars = { mode: 'pixelate' };
  setV('pixsize', '16');
  const rPix = await pa20.run([mockImg], () => {});
  assert(rPix && rPix.name.includes('_pixelated.jpg'), 'Pixelate Image creates mosaic effect');

  pa20.vars = { mode: 'grayscale' };
  const rGray = await pa20.run([mockImg], () => {});
  assert(rGray && rGray.name.includes('_grayscale.jpg'), 'Grayscale Image converts color to B&W');

  pa20.vars = { mode: 'colortransparent' };
  setV('transcolor', '#ffffff');
  setV('transtol', '20');
  const rTrans = await pa20.run([mockImg], () => {});
  assert(rTrans && rTrans.name.includes('_transparent.png'), 'Color to Transparent generates transparent PNG');

  console.log('\n=======================================');
  console.log(`TOTAL TESTS RUN: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=======================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal error during testing:', err);
  process.exit(1);
});
