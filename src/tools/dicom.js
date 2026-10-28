// Medical DICOM (.dcm) Parser & Converter: Convert CT, MRI, and X-ray medical imaging to JPG, PNG, and PDF.
// Completely private, browser-side parsing with Window Center / Window Width (WW/WC) grayscale normalization.

function parseDicom(ab) {
  const bytes = new Uint8Array(ab);
  const dv = new DataView(ab);
  // Check magic DICM at byte 128
  const magic = String.fromCharCode(...bytes.slice(128, 132));
  let offset = magic === 'DICM' ? 132 : 0;

  let width = 512, height = 512, bitsAlloc = 16, bitsStored = 12, isSigned = 0;
  let windowCenter = 0, windowWidth = 0, rescaleSlope = 1, rescaleIntercept = 0;
  let pixelOffset = -1, pixelLen = 0;
  let patientName = '', studyDate = '', modality = 'Medical Scan';

  while (offset < bytes.length - 8) {
    const group = dv.getUint16(offset, true);
    const element = dv.getUint16(offset + 2, true);
    offset += 4;

    let len = 0;
    // Check if explicit VR
    const vr = String.fromCharCode(bytes[offset], bytes[offset + 1]);
    if (/^[A-Z]{2}$/.test(vr)) {
      if (['OB', 'OW', 'OF', 'SQ', 'UT', 'UN'].includes(vr)) {
        offset += 4; // skip VR and 2 reserved bytes
        len = dv.getUint32(offset, true);
        offset += 4;
      } else {
        offset += 2;
        len = dv.getUint16(offset, true);
        offset += 2;
      }
    } else {
      // Implicit VR
      len = dv.getUint32(offset, true);
      offset += 4;
    }

    if (len === 0xffffffff || len < 0 || offset + len > bytes.length) {
      if (group === 0x7fe0 && element === 0x0010) {
        pixelOffset = offset;
        pixelLen = bytes.length - offset;
        break;
      }
      break;
    }

    // Read attributes
    if (group === 0x0008 && element === 0x0060) {
      modality = new TextDecoder('latin1').decode(bytes.slice(offset, offset + len)).trim();
    } else if (group === 0x0010 && element === 0x0010) {
      patientName = new TextDecoder('latin1').decode(bytes.slice(offset, offset + len)).trim();
    } else if (group === 0x0028 && element === 0x0010) {
      height = len === 2 ? dv.getUint16(offset, true) : dv.getUint32(offset, true);
    } else if (group === 0x0028 && element === 0x0011) {
      width = len === 2 ? dv.getUint16(offset, true) : dv.getUint32(offset, true);
    } else if (group === 0x0028 && element === 0x0100) {
      bitsAlloc = dv.getUint16(offset, true);
    } else if (group === 0x0028 && element === 0x0101) {
      bitsStored = dv.getUint16(offset, true);
    } else if (group === 0x0028 && element === 0x0103) {
      isSigned = dv.getUint16(offset, true);
    } else if (group === 0x0028 && element === 0x1050) {
      windowCenter = parseFloat(new TextDecoder('latin1').decode(bytes.slice(offset, offset + len))) || 0;
    } else if (group === 0x0028 && element === 0x1051) {
      windowWidth = parseFloat(new TextDecoder('latin1').decode(bytes.slice(offset, offset + len))) || 0;
    } else if (group === 0x0028 && element === 0x1052) {
      rescaleIntercept = parseFloat(new TextDecoder('latin1').decode(bytes.slice(offset, offset + len))) || 0;
    } else if (group === 0x0028 && element === 0x1053) {
      rescaleSlope = parseFloat(new TextDecoder('latin1').decode(bytes.slice(offset, offset + len))) || 1;
    } else if (group === 0x7fe0 && element === 0x0010) {
      pixelOffset = offset;
      pixelLen = len;
      break;
    }

    offset += len;
  }

  if (pixelOffset < 0) {
    throw new Error('No pixel data found in this DICOM file.');
  }

  return {
    width,
    height,
    bitsAlloc,
    bitsStored,
    isSigned,
    windowCenter,
    windowWidth,
    rescaleSlope,
    rescaleIntercept,
    pixelOffset,
    pixelLen,
    modality,
    patientName,
    bytes
  };
}

function dicomToCanvas(info) {
  const { width, height, bitsAlloc, isSigned, pixelOffset, bytes } = info;
  let { windowCenter: wc, windowWidth: ww, rescaleSlope: slope, rescaleIntercept: intercept } = info;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const dv = new DataView(bytes.buffer, bytes.byteOffset + pixelOffset);
  const numPixels = width * height;

  // Compute dynamic window if not in header
  if (!ww) {
    let minVal = Infinity, maxVal = -Infinity;
    for (let i = 0; i < Math.min(numPixels, 10000); i++) {
      let val = bitsAlloc === 8 ? dv.getUint8(i) : (isSigned ? dv.getInt16(i * 2, true) : dv.getUint16(i * 2, true));
      val = val * slope + intercept;
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }
    ww = Math.max(1, maxVal - minVal);
    wc = minVal + ww / 2;
  }

  const low = wc - ww / 2;
  const high = wc + ww / 2;

  for (let i = 0; i < numPixels; i++) {
    let val = 0;
    if (bitsAlloc === 8) {
      val = dv.getUint8(i);
    } else {
      val = isSigned ? dv.getInt16(i * 2, true) : dv.getUint16(i * 2, true);
    }
    val = val * slope + intercept;

    let gray = 0;
    if (val <= low) gray = 0;
    else if (val >= high) gray = 255;
    else gray = Math.round(((val - low) / ww) * 255);

    const idx = i * 4;
    data[idx] = gray;
    data[idx + 1] = gray;
    data[idx + 2] = gray;
    data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

TOOLS.dicom = {
  opts() {
    const to = (this.vars || {}).to || 'jpg';
    return sel('dcmto', T.o_format || 'Convert to', [
      ['jpg', 'JPEG Image (.jpg)'],
      ['png', 'PNG Image (.png)'],
      ['pdf', 'PDF Document (.pdf)']
    ]);
  },

  async run(files, status) {
    status(T.working || 'Reading DICOM medical scan…');
    const to = v('dcmto') || (this.vars || {}).to || 'jpg';
    const items = [];
    const rep = [];

    for (const [idx, f] of files.entries()) {
      status(`${T.working || 'Processing'} ${idx + 1}/${files.length} (${f.name})`);
      const info = parseDicom(await f.arrayBuffer());
      const canvas = dicomToCanvas(info);
      const docName = base(f.name);

      if (to === 'pdf') {
        const { PDFDocument } = await L.pdflib();
        const pdfDoc = await PDFDocument.create();
        const imgBlob = await toBlob(canvas, 'image/jpeg', 0.95);
        const embedded = await pdfDoc.embedJpg(await imgBlob.arrayBuffer());
        const [pw, ph] = canvas.width > canvas.height ? [841.89, 595.28] : [595.28, 841.89];
        const page = pdfDoc.addPage([pw, ph]);
        const scale = Math.min((pw - 40) / canvas.width, (ph - 40) / canvas.height);
        const dw = canvas.width * scale, dh = canvas.height * scale;
        page.drawImage(embedded, {
          x: (pw - dw) / 2,
          y: (ph - dh) / 2,
          width: dw,
          height: dh
        });
        const pdfBlob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
        items.push({ blob: pdfBlob, name: docName + '.pdf' });
      } else {
        const mime = to === 'png' ? 'image/png' : 'image/jpeg';
        const imgBlob = await toBlob(canvas, mime, 0.95);
        items.push({ blob: imgBlob, name: `${docName}.${to}` });
      }

      rep.push(`${f.name} (${info.modality || 'Scan'}, ${info.width}×${info.height}) → ${to.toUpperCase()}`);
    }

    const r = await zipOrOne(items, 'medical-scans.zip');
    return {
      ...r,
      info: rep.join(' · '),
      view: `<p style="margin-top:10px;font-size:13px;color:var(--dim)">✔ Medical scan converted with high diagnostic contrast (Window Center/Width normalized).</p>`
    };
  }
};
