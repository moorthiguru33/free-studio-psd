// ICO to PNG Converter: Extract high-res PNG from Windows .ico files (16x16 up to 256x256).
// 100% in-browser processing using Canvas and binary ICO parser.

function parseIco(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1) {
    throw new Error('Invalid ICO file: Missing icon resource header.');
  }

  const count = view.getUint16(4, true);
  if (!count) throw new Error('ICO file contains 0 icons.');

  const icons = [];
  for (let i = 0; i < count; i++) {
    const offset = 6 + i * 16;
    let w = view.getUint8(offset);
    let h = view.getUint8(offset + 1);
    if (w === 0) w = 256;
    if (h === 0) h = 256;
    const bpp = view.getUint16(offset + 6, true);
    const size = view.getUint32(offset + 8, true);
    const imgOffset = view.getUint32(offset + 12, true);

    const imgBytes = bytes.subarray(imgOffset, imgOffset + size);
    icons.push({ width: w, height: h, bpp, bytes: imgBytes });
  }

  // Sort by resolution descending (largest first)
  icons.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return icons;
}

async function iconToBlob(icon) {
  const b = icon.bytes;
  // Modern ICO format: Embedded raw PNG (\x89PNG\r\n\x1a\n)
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) {
    return new Blob([b], { type: 'image/png' });
  }

  // Legacy ICO: BMP DIB header
  const dibSize = new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(0, true);
  const dibW = new DataView(b.buffer, b.byteOffset, b.byteLength).getInt32(4, true);
  const dibH = Math.floor(new DataView(b.buffer, b.byteOffset, b.byteLength).getInt32(8, true) / 2); // height in ICO is doubled for XOR + AND masks

  const bmpHeader = new Uint8Array(14);
  const bv = new DataView(bmpHeader.buffer);
  bv.setUint16(0, 0x4D42, false); // 'BM'
  bv.setUint32(2, 14 + b.length, true); // Total file size
  bv.setUint32(10, 14 + dibSize, true); // Offset to image data

  const fullBmp = new Uint8Array(14 + b.length);
  fullBmp.set(bmpHeader, 0);
  fullBmp.set(b, 14);

  // Fix height in DIB header to single height
  const fullView = new DataView(fullBmp.buffer);
  fullView.setInt32(14 + 8, dibH, true);

  const bmpBlob = new Blob([fullBmp], { type: 'image/bmp' });
  const img = new Image();
  img.src = URL.createObjectURL(bmpBlob);
  await new Promise(r => { img.onload = r; img.onerror = r; });

  const c = document.createElement('canvas');
  c.width = icon.width || dibW;
  c.height = icon.height || dibH;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  return new Promise(r => c.toBlob(r, 'image/png'));
}

TOOLS.icoconv = {
  opts() {
    return `<label><span>Output Mode</span>
      <select id="ico_mode">
        <option value="best" selected>Largest Resolution (Best Quality PNG)</option>
        <option value="all">Extract All Sizes into ZIP Archive</option>
      </select>
    </label>`;
  },

  async run(files, status) {
    if (!files.length) throw new Error('Please select an ICO file.');
    const first = files[0];
    const baseName = first.name.replace(/\.[^/.]+$/, '');
    const mode = v('ico_mode') || 'best';

    status('Parsing icon entries and resolutions...');
    const buf = await first.arrayBuffer();
    const icons = parseIco(buf);

    if (mode === 'all' && icons.length > 1) {
      status(`Extracting ${icons.length} resolutions to ZIP...`);
      await load('jszip.min.js');
      const zip = new window.JSZip();

      for (let i = 0; i < icons.length; i++) {
        const ic = icons[i];
        const pngBlob = await iconToBlob(ic);
        const pngBuf = await pngBlob.arrayBuffer();
        zip.file(`${baseName}_${ic.width}x${ic.height}.png`, pngBuf);
      }

      const zipBuf = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
      return {
        blob: new Blob([zipBuf], { type: 'application/zip' }),
        name: `${baseName}_icons.zip`,
        info: `Extracted ${icons.length} icon sizes (16×16 to ${icons[0].width}×${icons[0].height})`
      };
    }

    // Default: Largest icon
    status('Extracting highest resolution PNG...');
    const bestIcon = icons[0];
    const bestBlob = await iconToBlob(bestIcon);

    return {
      blob: bestBlob,
      name: `${baseName}_${bestIcon.width}x${bestIcon.height}.png`,
      info: `Exported ${bestIcon.width}×${bestIcon.height} px PNG`
    };
  }
};
