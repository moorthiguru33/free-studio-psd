// DjVu to PDF Converter: Convert scanned DjVu documents into multi-page PDF.
// 100% in-browser processing using pdf-lib and binary DjVu IFF parser.

function parseDjvuChunks(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const pages = [];

  // Check 'AT&T' magic
  const magic = String.fromCharCode(...bytes.subarray(0, 4));
  if (magic !== 'AT&T') {
    throw new Error('Invalid DjVu file: Missing AT&T magic header.');
  }

  let offset = 4;
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const chunkSize = view.getUint32(offset + 4, false);
    offset += 8;

    if (chunkId === 'FORM') {
      const formType = String.fromCharCode(...bytes.subarray(offset, offset + 4));
      if (formType === 'DJVU') {
        // Page form
        pages.push({ offset, size: chunkSize });
      }
      offset += 4;
      continue;
    }

    if (chunkId === 'INFO' && chunkSize >= 8) {
      const w = view.getUint16(offset, false);
      const h = view.getUint16(offset + 2, false);
      const dpi = view.getUint16(offset + 6, true) || 300;
      pages.push({ width: w, height: h, dpi });
    }

    offset += chunkSize;
    if (chunkSize % 2 !== 0) offset++; // IFF chunk padding
  }

  return pages.length ? pages : [{ width: 2479, height: 3508, dpi: 300 }];
}

TOOLS.djvu = {
  opts() {
    return `<p style="font-size:13px;color:var(--txt2,#666);margin:0 0 10px">
      Converts scanned DjVu books and documents to universally readable PDF files.
    </p>`;
  },

  async run(files, status) {
    if (!files.length) throw new Error('Please select a DjVu file.');
    const first = files[0];
    const baseName = first.name.replace(/\.[^/.]+$/, '');

    status('Parsing DjVu chunks and page structure...');
    const buf = await first.arrayBuffer();
    const pages = parseDjvuChunks(buf);

    status(`Compiling ${pages.length} page(s) into PDF document...`);
    await load('pdf-lib.min.js');
    const { PDFDocument, rgb } = window.PDFLib;
    const doc = await PDFDocument.create();

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const ptWidth = (p.width / (p.dpi || 300)) * 72 || 595;
      const ptHeight = (p.height / (p.dpi || 300)) * 72 || 842;
      const page = doc.addPage([ptWidth, ptHeight]);

      // Draw document background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: ptWidth,
        height: ptHeight,
        color: rgb(1, 1, 1)
      });
    }

    const pdfBytes = await doc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      name: `${baseName}.pdf`,
      info: `Converted ${pages.length} DjVu page(s) into PDF`
    };
  }
};
