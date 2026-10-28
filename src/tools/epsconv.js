// EPS & Adobe Illustrator (AI) Converter: Convert EPS to PNG/PDF/SVG and AI to SVG/PNG/PDF.
// 100% in-browser processing using Canvas, pdf.js, and PostScript vector parser.

async function parseEpsOrAi(buffer, fileName) {
  const bytes = new Uint8Array(buffer);

  // 1. Check if Adobe Illustrator (.ai) or PDF hybrid: '%PDF-' magic
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  if (isPdf || /\.ai$/i.test(fileName)) {
    try {
      const doc = await openPdfjs(buffer);
      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: 2 });
      const canvas = await renderPage(doc, 1, 2);
      return {
        canvas: canvas,
        width: vp.width,
        height: vp.height,
        isVector: true
      };
    } catch (e) {
      // Fallback to PostScript parser if PDF parser fails
    }
  }

  // 2. Check for DOS EPS binary header (0xC5D0D3C6)
  if (bytes[0] === 0xC5 && bytes[1] === 0xD0 && bytes[2] === 0xD3 && bytes[3] === 0xC6) {
    const view = new DataView(buffer);
    const psOffset = view.getUint32(4, true);
    const psLength = view.getUint32(8, true);
    const tiffOffset = view.getUint32(20, true);
    const tiffLength = view.getUint32(24, true);

    if (tiffOffset > 0 && tiffLength > 0) {
      try {
        await load('UTIF.js');
        const tiffBytes = bytes.subarray(tiffOffset, tiffOffset + tiffLength);
        const ifds = window.UTIF.decode(tiffBytes.buffer);
        window.UTIF.decodeImage(tiffBytes.buffer, ifds[0]);
        const rgba = window.UTIF.toRGBA8(ifds[0]);
        const c = document.createElement('canvas');
        c.width = ifds[0].width;
        c.height = ifds[0].height;
        const ctx = c.getContext('2d');
        const imgData = ctx.createImageData(c.width, c.height);
        imgData.data.set(rgba);
        ctx.putImageData(imgData, 0, 0);
        return { canvas: c, width: c.width, height: c.height, isVector: false };
      } catch (err) {}
    }
  }

  // 3. Parse ASCII PostScript EPS
  const text = new TextDecoder('latin1').decode(bytes);

  // Extract BoundingBox
  let bb = [0, 0, 612, 792]; // default Letter
  const bbMatch = text.match(/%%BoundingBox:\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/i);
  if (bbMatch) {
    bb = [parseFloat(bbMatch[1]), parseFloat(bbMatch[2]), parseFloat(bbMatch[3]), parseFloat(bbMatch[4])];
  }
  const w = Math.max(10, Math.round(bb[2] - bb[0]));
  const h = Math.max(10, Math.round(bb[3] - bb[1]));

  // Check for embedded JPEG binary in PostScript
  const jpgStart = text.indexOf('\xFF\xD8\xFF');
  if (jpgStart !== -1) {
    const jpgEnd = text.indexOf('\xFF\xD9', jpgStart);
    if (jpgEnd !== -1) {
      const jpgSlice = bytes.subarray(jpgStart, jpgEnd + 2);
      const blob = new Blob([jpgSlice], { type: 'image/jpeg' });
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      await new Promise(r => { img.onload = r; img.onerror = r; });
      const c = document.createElement('canvas');
      c.width = img.width || w;
      c.height = img.height || h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return { canvas: c, width: c.width, height: c.height, isVector: false };
    }
  }

  // Parse simple PostScript vector paths
  const svgPaths = [];
  const lines = text.split(/\r?\n/);
  let currentPath = '';

  for (const line of lines) {
    const l = line.trim();
    if (!l || l.startsWith('%')) continue;
    const tokens = l.split(/\s+/);
    const last = tokens[tokens.length - 1];

    if (last === 'moveto' || last === 'm') {
      currentPath += `M ${tokens[0]} ${h - parseFloat(tokens[1])} `;
    } else if (last === 'lineto' || last === 'l') {
      currentPath += `L ${tokens[0]} ${h - parseFloat(tokens[1])} `;
    } else if (last === 'curveto' || last === 'c') {
      currentPath += `C ${tokens[0]} ${h - parseFloat(tokens[1])}, ${tokens[2]} ${h - parseFloat(tokens[3])}, ${tokens[4]} ${h - parseFloat(tokens[5])} `;
    } else if (last === 'closepath' || last === 'h') {
      currentPath += 'Z ';
    } else if (last === 'fill' || last === 'f' || last === 'stroke' || last === 's') {
      if (currentPath) {
        svgPaths.push(`<path d="${currentPath.trim()}" fill="${last.startsWith('f') ? '#1e293b' : 'none'}" stroke="${last.startsWith('s') ? '#1e293b' : 'none'}" stroke-width="1.5"/>`);
        currentPath = '';
      }
    }
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    ${svgPaths.join('\n    ')}
  </svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await new Promise(r => { img.onload = r; img.onerror = r; });

  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = h * 2;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);

  return { canvas: c, width: w, height: h, isVector: true, svgText: svgContent };
}

TOOLS.epsconv = {
  opts() {
    const to = (this.vars.to || 'png').toUpperCase();
    return `<p style="font-size:13px;color:var(--txt2,#666);margin:0 0 10px">
      Converts EPS and Adobe Illustrator vector files to <b>${to}</b> with high resolution.
    </p>`;
  },

  async run(files, status) {
    if (!files.length) throw new Error('Please select an EPS or AI file.');
    const first = files[0];
    const targetFmt = (this.vars.to || 'png').toLowerCase();
    const baseName = first.name.replace(/\.[^/.]+$/, '');

    status('Parsing EPS / AI vector data...');
    const buf = await first.arrayBuffer();
    const parsed = await parseEpsOrAi(buf, first.name);

    if (targetFmt === 'png') {
      status('Exporting high-resolution PNG...');
      const blob = await new Promise(r => parsed.canvas.toBlob(r, 'image/png'));
      return {
        blob: blob,
        name: `${baseName}.png`,
        info: `Converted to PNG (${parsed.canvas.width}×${parsed.canvas.height} px)`
      };
    }

    if (targetFmt === 'svg') {
      status('Exporting SVG vector...');
      const svgText = parsed.svgText || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${parsed.width} ${parsed.height}">
        <image href="${parsed.canvas.toDataURL('image/png')}" width="${parsed.width}" height="${parsed.height}"/>
      </svg>`;
      return {
        blob: new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }),
        name: `${baseName}.svg`,
        info: 'Converted to SVG vector'
      };
    }

    if (targetFmt === 'pdf') {
      status('Generating PDF document...');
      await load('pdf-lib.min.js');
      const { PDFDocument } = window.PDFLib;
      const doc = await PDFDocument.create();
      const pngBytes = await new Promise(r => {
        parsed.canvas.toBlob(async b => r(new Uint8Array(await b.arrayBuffer())), 'image/png');
      });
      const img = await doc.embedPng(pngBytes);
      const page = doc.addPage([parsed.width || img.width, parsed.height || img.height]);
      page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      const pdfBytes = await doc.save();
      return {
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        name: `${baseName}.pdf`,
        info: 'Converted to PDF document'
      };
    }

    throw new Error('Unsupported target format: ' + targetFmt);
  }
};
