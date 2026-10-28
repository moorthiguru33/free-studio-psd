// Scan & Read QR Code from Image File (PNG, JPG, WEBP, etc.)
// 100% in-browser decoding via jsQR library, zero server uploads.

TOOLS.qrread = {
  opts() {
    return `<p class="hint">Upload any image, photo, or screenshot containing a QR code to extract its link, text, contact, or credentials instantly.</p>`;
  },

  async run([file], status) {
    if (!file) throw new Error('Please select an image file containing a QR code.');
    status(T.working || 'Scanning QR code from image…');

    await load('jsQR.js');
    if (!window.jsQR) {
      throw new Error('QR code scanner engine failed to load.');
    }

    const img = new Image();
    const u = URL.createObjectURL(file);
    try {
      await new Promise((ok, ko) => {
        img.onload = ok;
        img.onerror = () => ko(new Error('Failed to load image file. Please upload a valid image.'));
        img.src = u;
      });
    } finally {
      URL.revokeObjectURL(u);
    }

    const canvas = document.createElement('canvas');
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    let code = window.jsQR(imgData.data, w, h, { inversionAttempts: 'dontInvert' });
    if (!code) {
      code = window.jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
    }

    if (!code || !code.data) {
      throw new Error('No QR code detected in this image. Please check that the QR code is clearly visible and well-lit.');
    }

    const text = code.data;
    const isUrl = /^https?:\/\//i.test(text);

    const outBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const viewHtml = `
      <div style="background:var(--bg,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:20px;margin-top:16px;text-align:left">
        <h3 style="margin-top:0;font-size:1.1rem;color:var(--text,#0f172a)">Decoded QR Code Content:</h3>
        <textarea readonly style="width:100%;min-height:90px;font-family:monospace;padding:10px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box">${esc(text)}</textarea>
        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn" onclick="navigator.clipboard.writeText(${JSON.stringify(text)}).then(()=>alert('Copied to clipboard!'))">📋 Copy Content</button>
          ${isUrl ? `<a href="${esc(text)}" target="_blank" rel="noopener noreferrer" class="btn ghost" style="text-decoration:none">🔗 Open Link</a>` : ''}
        </div>
      </div>
    `;

    return {
      blob: outBlob,
      name: `${base(file.name)}_qr_decoded.txt`,
      info: `QR code successfully decoded (${text.length} chars)`,
      view: viewHtml
    };
  }
};
