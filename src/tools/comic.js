// Comic Book Reader & Converter: CBR to PDF & CBZ to PDF.
// Unpacks CBZ (ZIP) or CBR (RAR via libarchive.js), orders comic pages alphabetically/numerically,
// and packages them into a clean, full-resolution PDF ebook.

let _LA;
const LA = async () => {
  if (_LA) return _LA;
  if (typeof global !== 'undefined' && global._LA) return _LA = global._LA;
  const m = await import('/vendor/libarchive/libarchive.js');
  m.Archive.init({ workerUrl: '/vendor/libarchive/worker-bundle.js' });
  return _LA = m;
};

TOOLS.comic = {
  opts() {
    const mode = (this.vars || {}).mode || 'pdf';
    if (mode === 'cbr2cbz') {
      return `<p class="hint">Converts RAR-compressed CBR comics into standard ZIP-compressed CBZ format compatible with all e-readers and tablet comic apps.</p>`;
    }
    return sel('comicfit', 'Page Sizing', [
      ['fit', 'Original Comic Dimensions (Best Quality)'],
      ['a4', 'Standard A4 Page'],
      ['letter', 'Standard US Letter']
    ]);
  },

  async run([file], status) {
    const mode = (this.vars || {}).mode || 'pdf';
    if (mode === 'cbr2cbz') {
      status('Unpacking CBR archive…');
      const { Archive } = await LA();
      const a = await Archive.open(file);
      await a.extractFiles(() => {});
      const files = await a.getFilesArray();
      const JSZip = await L.zip();
      const zip = new JSZip();
      let count = 0;
      for (const f of files) {
        const fl = f.file;
        if (fl && !/(^|\/)\./.test(fl.name)) {
          const fileData = fl.arrayBuffer ? await fl.arrayBuffer() : fl;
          zip.file(fl.name, fileData);
          count++;
        }
      }
      if (!count) throw new Error('No files found inside CBR archive.');
      status('Building CBZ archive…');
      const cbzBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      return {
        name: base(file.name) + '.cbz',
        blob: cbzBlob,
        info: `Repacked ${count} comic pages into CBZ format (${fmtSize(cbzBlob.size)})`
      };
    }

    status(T.working || 'Reading comic book archive…');
    const isCbr = /\.cbr$/i.test(file.name);
    const pages = [];

    if (isCbr) {
      status('Unpacking CBR archive…');
      const { Archive } = await LA();
      const a = await Archive.open(file);
      const arr = await a.getFilesArray();
      await a.extractFiles(() => {});
      const files = await a.getFilesArray();
      for (const f of files) {
        const fl = f.file;
        if (fl && /\.(jpe?g|png|webp|gif|bmp)$/i.test(fl.name)) {
          pages.push({ name: fl.name, blob: fl });
        }
      }
    } else {
      // CBZ (ZIP)
      status('Unpacking CBZ archive…');
      const JSZip = await L.zip();
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      for (const [name, entry] of Object.entries(zip.files)) {
        if (!entry.dir && /\.(jpe?g|png|webp|gif|bmp)$/i.test(name) && !/(^|\/)\./.test(name)) {
          const blob = await entry.async('blob');
          pages.push({ name: name.split('/').pop(), blob });
        }
      }
    }

    if (!pages.length) {
      throw new Error('No comic page images found inside this CBR/CBZ archive.');
    }

    // Sort pages naturally: page1, page2, page10...
    pages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const { PDFDocument } = await L.pdflib();
    const pdfDoc = await PDFDocument.create();

    for (const [idx, page] of pages.entries()) {
      status(`${T.working || 'Building PDF'} ${idx + 1}/${pages.length}`);
      const img = new Image();
      const u = URL.createObjectURL(page.blob);
      await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = u; });

      const w = img.naturalWidth || img.width || 800;
      const h = img.naturalHeight || img.height || 1200;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(u);

      const jpgBlob = await toBlob(canvas, 'image/jpeg', 0.92);
      const embedded = await pdfDoc.embedJpg(await jpgBlob.arrayBuffer());

      const pdfPage = pdfDoc.addPage([w, h]);
      pdfPage.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
    }

    const outBlob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
    return {
      blob: outBlob,
      name: base(file.name) + '.pdf',
      info: `Compiled ${pages.length} comic pages into PDF`
    };
  }
};
