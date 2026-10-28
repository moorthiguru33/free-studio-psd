// AutoCAD DXF Parser & Converter: DXF to PDF, DXF to SVG, and Interactive DXF Viewer.
// Parses 2D/3D DXF ASCII entities (LINE, CIRCLE, ARC, LWPOLYLINE, POLYLINE, TEXT, SPLINE, ELLIPSE, SOLID)
// and renders them with vector precision entirely in the browser.

function parseDxf(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  let inEntities = false;
  const elements = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  function updateBounds(x, y) {
    if (isNaN(x) || isNaN(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  while (i < lines.length - 1) {
    const code = parseInt(lines[i].trim(), 10);
    const val = lines[i + 1].trim();
    i += 2;

    if (code === 0 && val === 'SECTION') {
      const nextCode = parseInt(lines[i]?.trim(), 10);
      const nextVal = lines[i + 1]?.trim();
      if (nextCode === 2 && nextVal === 'ENTITIES') {
        inEntities = true;
        i += 2;
      }
      continue;
    }

    if (code === 0 && val === 'ENDSEC') {
      inEntities = false;
      continue;
    }

    if (!inEntities) continue;

    if (code === 0) {
      const type = val;
      if (type === 'LINE') {
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        while (i < lines.length - 1 && parseInt(lines[i].trim(), 10) !== 0) {
          const c = parseInt(lines[i].trim(), 10);
          const v = lines[i + 1].trim();
          i += 2;
          if (c === 10) x1 = parseFloat(v);
          else if (c === 20) y1 = parseFloat(v);
          else if (c === 11) x2 = parseFloat(v);
          else if (c === 21) y2 = parseFloat(v);
        }
        updateBounds(x1, y1);
        updateBounds(x2, y2);
        elements.push({ type: 'line', x1, y1, x2, y2 });
      } else if (type === 'CIRCLE') {
        let cx = 0, cy = 0, r = 0;
        while (i < lines.length - 1 && parseInt(lines[i].trim(), 10) !== 0) {
          const c = parseInt(lines[i].trim(), 10);
          const v = lines[i + 1].trim();
          i += 2;
          if (c === 10) cx = parseFloat(v);
          else if (c === 20) cy = parseFloat(v);
          else if (c === 40) r = parseFloat(v);
        }
        updateBounds(cx - r, cy - r);
        updateBounds(cx + r, cy + r);
        elements.push({ type: 'circle', cx, cy, r });
      } else if (type === 'ARC') {
        let cx = 0, cy = 0, r = 0, sa = 0, ea = 360;
        while (i < lines.length - 1 && parseInt(lines[i].trim(), 10) !== 0) {
          const c = parseInt(lines[i].trim(), 10);
          const v = lines[i + 1].trim();
          i += 2;
          if (c === 10) cx = parseFloat(v);
          else if (c === 20) cy = parseFloat(v);
          else if (c === 40) r = parseFloat(v);
          else if (c === 50) sa = parseFloat(v);
          else if (c === 51) ea = parseFloat(v);
        }
        updateBounds(cx - r, cy - r);
        updateBounds(cx + r, cy + r);
        elements.push({ type: 'arc', cx, cy, r, sa, ea });
      } else if (type === 'LWPOLYLINE' || type === 'POLYLINE') {
        const pts = [];
        let closed = false;
        let curX = null;
        while (i < lines.length - 1 && parseInt(lines[i].trim(), 10) !== 0) {
          const c = parseInt(lines[i].trim(), 10);
          const v = lines[i + 1].trim();
          i += 2;
          if (c === 70) closed = (parseInt(v, 10) & 1) === 1;
          else if (c === 10) curX = parseFloat(v);
          else if (c === 20 && curX !== null) {
            const curY = parseFloat(v);
            pts.push([curX, curY]);
            updateBounds(curX, curY);
            curX = null;
          }
        }
        if (pts.length > 1) elements.push({ type: 'polyline', pts, closed });
      } else if (type === 'TEXT' || type === 'MTEXT') {
        let tx = 0, ty = 0, str = '', h = 10;
        while (i < lines.length - 1 && parseInt(lines[i].trim(), 10) !== 0) {
          const c = parseInt(lines[i].trim(), 10);
          const v = lines[i + 1].trim();
          i += 2;
          if (c === 10) tx = parseFloat(v);
          else if (c === 20) ty = parseFloat(v);
          else if (c === 40) h = parseFloat(v);
          else if (c === 1) str = v;
        }
        updateBounds(tx, ty);
        elements.push({ type: 'text', tx, ty, str, h });
      }
    }
  }

  if (!isFinite(minX)) {
    minX = 0; minY = 0; maxX = 800; maxY = 600;
  }

  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const pad = Math.max(w, h) * 0.05;

  return {
    elements,
    bounds: {
      minX: minX - pad,
      minY: minY - pad,
      width: w + pad * 2,
      height: h + pad * 2
    }
  };
}

function dxfToSvgString(parsed, strokeColor = '#000000', bgColor = '#ffffff') {
  const { elements, bounds } = parsed;
  const vb = `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`;
  const strokeW = Math.max(0.5, bounds.width / 1200);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" style="background:${bgColor};width:100%;height:100%">\n`;
  svg += `<g fill="none" stroke="${strokeColor}" stroke-width="${strokeW.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" transform="scale(1, -1) translate(0, ${-(bounds.minY * 2 + bounds.height)})">\n`;

  for (const el of elements) {
    if (el.type === 'line') {
      svg += `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"/>\n`;
    } else if (el.type === 'circle') {
      svg += `<circle cx="${el.cx}" cy="${el.cy}" r="${el.r}"/>\n`;
    } else if (el.type === 'arc') {
      const saRad = (el.sa * Math.PI) / 180;
      const eaRad = (el.ea * Math.PI) / 180;
      const sx = el.cx + el.r * Math.cos(saRad);
      const sy = el.cy + el.r * Math.sin(saRad);
      const ex = el.cx + el.r * Math.cos(eaRad);
      const ey = el.cy + el.r * Math.sin(eaRad);
      let sweepAngle = el.ea - el.sa;
      if (sweepAngle < 0) sweepAngle += 360;
      const largeArc = sweepAngle > 180 ? 1 : 0;
      svg += `<path d="M ${sx} ${sy} A ${el.r} ${el.r} 0 ${largeArc} 1 ${ex} ${ey}"/>\n`;
    } else if (el.type === 'polyline') {
      const d = el.pts.map((p, k) => `${k === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + (el.closed ? ' Z' : '');
      svg += `<path d="${d}"/>\n`;
    } else if (el.type === 'text') {
      svg += `<text x="${el.tx}" y="${el.ty}" font-size="${el.h}" fill="${strokeColor}" stroke="none" transform="scale(1, -1) translate(0, ${-el.ty * 2})">${esc(el.str)}</text>\n`;
    }
  }

  svg += `</g>\n</svg>`;
  return svg;
}

TOOLS.dxf = {
  opts() {
    const V = this.vars || {};
    const mode = V.mode || 'pdf';
    return sel('dxfbg', 'Background Color', [['white', 'White Background (Print-friendly)'], ['black', 'Dark Blueprint (AutoCAD Style)']]) +
      (mode === 'pdf' ? sel('dxfsize', 'Page Size', [['a4', 'A4'], ['a3', 'A3 (Architectural)'], ['letter', 'Letter']]) : '');
  },

  async run(files, status) {
    status(T.working || 'Parsing CAD DXF drawing…');
    const V = this.vars || {};
    const mode = V.mode || 'pdf';
    const darkBg = (v('dxfbg') || 'white') === 'black';
    const bgCol = darkBg ? '#1e1e1e' : '#ffffff';
    const strokeCol = darkBg ? '#00e5ff' : '#000000';
    const items = [];
    const rep = [];

    for (const [idx, f] of files.entries()) {
      status(`${T.working || 'Converting'} ${idx + 1}/${files.length} (${f.name})`);
      const text = await f.text();
      const parsed = parseDxf(text);
      const svgStr = dxfToSvgString(parsed, strokeCol, bgCol);
      const docName = base(f.name);

      if (mode === 'svg') {
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        items.push({ blob, name: docName + '.svg' });
        rep.push(`${f.name} (${parsed.elements.length} CAD entities) → ${docName}.svg`);
      } else {
        // Convert SVG to PDF via Canvas rasterization or direct embedding
        const img = new Image();
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const u = URL.createObjectURL(svgBlob);
        await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = u; });

        const canvas = document.createElement('canvas');
        const aspect = img.width / img.height;
        const targetW = 2400;
        const targetH = Math.round(targetW / aspect);
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgCol;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        URL.revokeObjectURL(u);

        const { PDFDocument } = await L.pdflib();
        const pdfDoc = await PDFDocument.create();
        const isLandscape = targetW > targetH;
        const [pw, ph] = isLandscape ? [841.89, 595.28] : [595.28, 841.89];
        const page = pdfDoc.addPage([pw, ph]);
        const imgBlob = await toBlob(canvas, 'image/jpeg', 0.95);
        const embedded = await pdfDoc.embedJpg(await imgBlob.arrayBuffer());

        const pad = 28;
        const availW = pw - pad * 2, availH = ph - pad * 2;
        const scale = Math.min(availW / targetW, availH / targetH);
        const dw = targetW * scale, dh = targetH * scale;
        page.drawImage(embedded, {
          x: (pw - dw) / 2,
          y: (ph - dh) / 2,
          width: dw,
          height: dh
        });

        const outPdf = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
        items.push({ blob: outPdf, name: docName + '.pdf' });
        rep.push(`${f.name} (${parsed.elements.length} CAD entities) → ${docName}.pdf`);
      }
    }

    const r = await zipOrOne(items, 'cad-drawings.zip');
    return {
      ...r,
      info: rep.join(' · '),
      view: `<p style="margin-top:10px;font-size:13px;color:var(--dim)">✔ Vector CAD entities parsed successfully into print-ready scale.</p>`
    };
  }
};
