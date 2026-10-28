// Image Editing & Photography Adjustments: Invert Colors, Brightness/Contrast, Blur & Pixelate, Round Corners, Flip/Mirror, and Print DPI Calculator.
// 100% in-browser HTML5 Canvas processing.

TOOLS.photoadjust = {
  opts() {
    const mode = (this.vars || {}).mode || 'invert';
    if (mode === 'brightness') {
      return `<div class="row2">${inp('imgbright', 'Brightness (-100 to +100)', 'range', '20', 'min="-100" max="100"')}${inp('imgcontrast', 'Contrast (-100 to +100)', 'range', '20', 'min="-100" max="100"')}</div>`;
    }
    if (mode === 'blur') {
      return sel('blurtype', 'Blur Mode', [['blur', 'Smooth Gaussian Blur'], ['pixelate', 'Pixelate Censor (Mosaic)']]) +
        inp('blurrad', 'Blur Radius / Block Size (px)', 'number', '12', 'min="2" max="60"');
    }
    if (mode === 'round') {
      return inp('roundrad', 'Corner Radius (px or %)', 'number', '32', 'min="2" max="500"') +
        chk('roundcircle', 'Make perfectly circular (Avatar)', false);
    }
    if (mode === 'flip') {
      return sel('flipdir', 'Mirror Direction', [
        ['h', 'Horizontal Flip (Left ↔ Right Mirror)'],
        ['v', 'Vertical Flip (Top ↕ Bottom Mirror)'],
        ['both', 'Both (180° Inverted Mirror)']
      ]);
    }
    if (mode === 'border') {
      return `<div class="row2">${inp('bdsize', 'Border Width (px)', 'number', '24', 'min="1" max="200"')}${inp('bdcol', 'Border Color', 'color', '#ffffff')}</div>`;
    }
    if (mode === 'dpi') {
      return sel('dpival', 'Target Print Resolution (DPI)', [
        ['300', '300 DPI · Professional Magazine & Photo Quality'],
        ['150', '150 DPI · Newsprint & Poster Quality'],
        ['72', '72 DPI · Standard Web / Screen Display']
      ]);
    }
    if (mode === 'pixelate') {
      return inp('pixsize', 'Pixelation Block Size (px)', 'number', '12', 'min="2" max="100"');
    }
    if (mode === 'grayscale') {
      return `<p class="hint">Converts color photo to high-fidelity grayscale / black & white using ITU-R luminance weighting.</p>`;
    }
    if (mode === 'colortransparent') {
      return inp('transcolor', 'Color to make transparent', 'color', '#ffffff') +
        inp('transtol', 'Color Match Tolerance (0 - 100)', 'number', '15', 'min="0" max="100"');
    }
    return '';
  },

  async run([file], status) {
    status(T.working || 'Adjusting image…');
    const mode = (this.vars || {}).mode || 'invert';

    const img = new Image();
    const u = URL.createObjectURL(file);
    await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = u; });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    URL.revokeObjectURL(u);

    if (mode === 'invert') {
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, w, h);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
      ctx.putImageData(id, 0, 0);
      const blob = await toBlob(canvas, 'image/jpeg', 0.95);
      return {
        name: base(file.name) + '_inverted.jpg',
        blob,
        info: `Inverted image colors (${w}×${h} px)`
      };
    }

    if (mode === 'brightness') {
      const bVal = (+v('imgbright') || 0) * 1.5;
      const cVal = (+v('imgcontrast') || 0) * 1.5;
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, w, h);
      const d = id.data;
      const factor = (259 * (cVal + 255)) / (255 * (259 - cVal));

      for (let i = 0; i < d.length; i += 4) {
        // Brightness
        let r = d[i] + bVal, g = d[i + 1] + bVal, b = d[i + 2] + bVal;
        // Contrast
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
        d[i] = Math.max(0, Math.min(255, r));
        d[i + 1] = Math.max(0, Math.min(255, g));
        d[i + 2] = Math.max(0, Math.min(255, b));
      }
      ctx.putImageData(id, 0, 0);
      const blob = await toBlob(canvas, 'image/jpeg', 0.95);
      return {
        name: base(file.name) + '_adjusted.jpg',
        blob,
        info: `Adjusted brightness & contrast (${w}×${h} px)`
      };
    }

    if (mode === 'blur') {
      const isPixel = (v('blurtype') || 'blur') === 'pixelate';
      const rad = Math.max(2, Math.min(60, +v('blurrad') || 12));

      if (isPixel) {
        // Downsample and upsample for pixelate mosaic
        const sw = Math.max(1, Math.floor(w / rad));
        const sh = Math.max(1, Math.floor(h / rad));
        const temp = document.createElement('canvas');
        temp.width = sw; temp.height = sh;
        temp.getContext('2d').drawImage(img, 0, 0, sw, sh);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(temp, 0, 0, sw, sh, 0, 0, w, h);
      } else {
        ctx.filter = `blur(${rad}px)`;
        ctx.drawImage(img, 0, 0);
      }
      const blob = await toBlob(canvas, 'image/jpeg', 0.95);
      return {
        name: base(file.name) + '_blurred.jpg',
        blob,
        info: `${isPixel ? 'Pixelated' : 'Blurred'} with ${rad}px radius`
      };
    }

    if (mode === 'round') {
      const isCircle = vb('roundcircle');
      let rad = isCircle ? Math.min(w, h) / 2 : (+v('roundrad') || 32);

      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      if (isCircle) {
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      } else {
        ctx.roundRect(0, 0, w, h, rad);
      }
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);

      const blob = await toBlob(canvas, 'image/png');
      return {
        name: base(file.name) + '_rounded.png',
        blob,
        info: `Rounded corners (${rad}px) with transparency`
      };
    }

    if (mode === 'flip') {
      const dir = v('flipdir') || 'h';
      ctx.save();
      if (dir === 'h') {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      } else if (dir === 'v') {
        ctx.translate(0, h);
        ctx.scale(1, -1);
      } else {
        ctx.translate(w, h);
        ctx.scale(-1, -1);
      }
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      const blob = await toBlob(canvas, 'image/jpeg', 0.95);
      return {
        name: base(file.name) + '_flipped.jpg',
        blob,
        info: `Flipped ${dir === 'h' ? 'Horizontally' : dir === 'v' ? 'Vertically' : 'Both Directions'}`
      };
    }

    if (mode === 'border') {
      const bw = +v('bdsize') || 24;
      const col = v('bdcol') || '#ffffff';
      canvas.width = w + bw * 2;
      canvas.height = h + bw * 2;
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, bw, bw);

      const blob = await toBlob(canvas, 'image/jpeg', 0.95);
      return {
        name: base(file.name) + '_bordered.jpg',
        blob,
        info: `Added ${bw}px border (${canvas.width}×${canvas.height} px)`
      };
    }

    if (mode === 'dpi') {
      const dpi = +v('dpival') || 300;
      const inW = (w / dpi).toFixed(2);
      const inH = (h / dpi).toFixed(2);
      const cmW = (w / dpi * 2.54).toFixed(2);
      const cmH = (h / dpi * 2.54).toFixed(2);

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:22px;font-weight:700;color:var(--r,#d32f29);margin-bottom:8px">Print Size at ${dpi} DPI:</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Dimensions in Inches:</b> ${inW}" × ${inH}" inches</li>
          <li><b>Dimensions in Centimeters:</b> ${cmW} × ${cmH} cm</li>
          <li><b>Pixel Dimensions:</b> ${w} × ${h} px</li>
        </ul>
      </div>`;
      return {
        name: 'print-size.txt',
        blob: new Blob([`Image: ${w}x${h} px\nDPI: ${dpi}\nSize: ${inW}x${inH} inches (${cmW}x${cmH} cm)`], { type: 'text/plain' }),
        info: `Print Size: ${inW}" × ${inH}" in (${dpi} DPI)`,
        view: html
      };
    }

    if (mode === 'pixelate') {
      const rad = Math.max(2, Math.min(100, +v('pixsize') || 12));
      const sw = Math.max(1, Math.floor(w / rad));
      const sh = Math.max(1, Math.floor(h / rad));
      const temp = document.createElement('canvas');
      temp.width = sw; temp.height = sh;
      temp.getContext('2d').drawImage(img, 0, 0, sw, sh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(temp, 0, 0, sw, sh, 0, 0, w, h);
      const blob = await toBlob(canvas, 'image/jpeg', 0.95);
      return {
        name: base(file.name) + '_pixelated.jpg',
        blob,
        info: `Pixelated image (${rad}px blocks)`
      };
    }

    if (mode === 'grayscale') {
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, w, h);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
      }
      ctx.putImageData(id, 0, 0);
      const blob = await toBlob(canvas, 'image/jpeg', 0.95);
      return {
        name: base(file.name) + '_grayscale.jpg',
        blob,
        info: `Converted to grayscale (${w}×${h} px)`
      };
    }

    if (mode === 'colortransparent') {
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, w, h);
      const d = id.data;
      const hex = (v('transcolor') || '#ffffff').replace('#', '');
      const trR = parseInt(hex.slice(0, 2), 16) || 255;
      const trG = parseInt(hex.slice(2, 4), 16) || 255;
      const trB = parseInt(hex.slice(4, 6), 16) || 255;
      const tol = (+v('transtol') || 15) * 2.55;

      for (let i = 0; i < d.length; i += 4) {
        const diff = Math.max(Math.abs(d[i] - trR), Math.abs(d[i + 1] - trG), Math.abs(d[i + 2] - trB));
        if (diff <= tol) {
          d[i + 3] = 0; // Transparent
        }
      }
      ctx.putImageData(id, 0, 0);
      const blob = await toBlob(canvas, 'image/png');
      return {
        name: base(file.name) + '_transparent.png',
        blob,
        info: `Replaced color #${hex} with transparency`
      };
    }

    throw new Error('Unsupported mode: ' + mode);
  }
};
