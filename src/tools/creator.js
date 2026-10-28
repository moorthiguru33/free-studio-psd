// Creator & Social Media Suite: YouTube Thumbnail/Banner, Instagram Post/Story/Grid, Facebook/Twitter/LinkedIn headers, Subtitle SRT <-> VTT, and Image Aspect Ratios.
// 100% in-browser canvas and text processing.

const SOCIAL_PRESETS = {
  yt_thumb: { w: 1280, h: 720, label: 'YouTube Thumbnail (1280×720)' },
  yt_banner: { w: 2560, h: 1440, label: 'YouTube Channel Banner (2560×1440)' },
  ig_square: { w: 1080, h: 1080, label: 'Instagram Square Post (1080×1080)' },
  ig_portrait: { w: 1080, h: 1350, label: 'Instagram Portrait Post (1080×1350 - 4:5)' },
  ig_story: { w: 1080, h: 1920, label: 'Instagram Story / Reel (1080×1920 - 9:16)' },
  fb_cover: { w: 820, h: 312, label: 'Facebook Page Cover (820×312)' },
  tw_header: { w: 1500, h: 500, label: 'Twitter / X Header (1500×500)' },
  li_banner: { w: 1584, h: 396, label: 'LinkedIn Background Banner (1584×396)' },
  discord_av: { w: 512, h: 512, label: 'Discord Server / Profile Avatar (512×512)' },
  podcast: { w: 3000, h: 3000, label: 'Podcast Cover Artwork (3000×3000)' }
};

TOOLS.creator = {
  opts() {
    const mode = (this.vars || {}).mode || 'yt_thumb';
    if (mode === 'subtitles') {
      const def = (this.vars || {}).subdir || 'srt2vtt';
      const opts = def === 'vtt2srt'
        ? [['vtt2srt', 'WebVTT to SubRip (.srt)'], ['srt2vtt', 'SRT to WebVTT (.vtt)']]
        : [['srt2vtt', 'SRT to WebVTT (.vtt)'], ['vtt2srt', 'WebVTT to SubRip (.srt)']];
      return sel('subdir', 'Conversion Direction', opts);
    }
    if (mode === 'grid') {
      return sel('gridtype', 'Grid Layout', [
        ['3x3', '3×3 Square Grid (9 Instagram Tiles)'],
        ['3x1', '3×1 Panoramic Row (3 Tiles)'],
        ['3x2', '3×2 Banner (6 Tiles)']
      ]);
    }
    const preset = SOCIAL_PRESETS[mode] || SOCIAL_PRESETS.yt_thumb;
    return `<p class="hint">Target dimensions: <b>${preset.label}</b>. Image will be fitted and cropped with high-quality resampling.</p>` +
      sel('fitmode', 'Image Sizing Mode', [
        ['cover', 'Cover & Center Crop (Fills entire frame)'],
        ['contain', 'Contain & Fit (Pads borders without cropping)']
      ]) +
      inp('padcol', 'Padding / Canvas Color', 'color', '#ffffff');
  },

  async run([file], status) {
    status(T.working || 'Processing creator asset…');
    const mode = (this.vars || {}).mode || 'yt_thumb';

    if (mode === 'subtitles') {
      const isSrt2Vtt = (v('subdir') || (this.vars || {}).subdir || 'srt2vtt') === 'srt2vtt';
      const text = await file.text();
      let res = '';

      if (isSrt2Vtt) {
        // SRT to VTT: add WEBVTT header and change comma decimals to dots (00:01:23,456 -> 00:01:23.456)
        res = 'WEBVTT\n\n' + text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
      } else {
        // VTT to SRT: remove WEBVTT header and change dot decimals to commas
        res = text.replace(/^WEBVTT[^\n]*\n+/i, '').replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2');
      }

      const outExt = isSrt2Vtt ? 'vtt' : 'srt';
      return {
        name: base(file.name) + '.' + outExt,
        blob: new Blob([res], { type: 'text/vtt;charset=utf-8' }),
        info: isSrt2Vtt ? 'Converted Subtitles to WebVTT' : 'Converted Subtitles to SRT'
      };
    }

    if (mode === 'grid') {
      const gtype = v('gridtype') || '3x3';
      const [cols, rows] = gtype.split('x').map(Number);
      const img = new Image();
      const u = URL.createObjectURL(file);
      await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = u; });

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const tileW = Math.floor(w / cols);
      const tileH = Math.floor(h / rows);
      const items = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = tileW;
          canvas.height = tileH;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH);
          const blob = await toBlob(canvas, 'image/jpeg', 0.95);
          items.push({
            name: `${base(file.name)}_tile_r${r + 1}_c${c + 1}.jpg`,
            blob
          });
        }
      }
      URL.revokeObjectURL(u);
      const r = await zipOrOne(items, `${base(file.name)}_grid.zip`);
      r.info = `Generated ${items.length} Instagram grid tiles (${tileW}×${tileH} px)`;
      return r;
    }

    // Social Media Resizer Presets
    const target = SOCIAL_PRESETS[mode] || SOCIAL_PRESETS.yt_thumb;
    const tw = target.w, th = target.h;
    const fit = v('fitmode') || 'cover';
    const bgCol = v('padcol') || '#ffffff';

    const img = new Image();
    const u = URL.createObjectURL(file);
    await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = u; });

    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, tw, th);

    if (fit === 'cover') {
      const scale = Math.max(tw / sw, th / sh);
      const dw = sw * scale, dh = sh * scale;
      const dx = (tw - dw) / 2, dy = (th - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      const scale = Math.min(tw / sw, th / sh);
      const dw = sw * scale, dh = sh * scale;
      const dx = (tw - dw) / 2, dy = (th - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    URL.revokeObjectURL(u);

    const outBlob = await toBlob(canvas, 'image/jpeg', 0.95);
    return {
      name: `${base(file.name)}_${tw}x${th}.jpg`,
      blob: outBlob,
      info: `Resized to ${tw}×${th} px (${target.label})`,
      view: `<p style="margin-top:10px;font-size:13px;color:var(--dim)">✔ Resized perfectly for ${target.label} with crisp 95% JPEG quality.</p>`
    };
  }
};
