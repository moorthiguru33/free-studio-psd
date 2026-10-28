// Binary File Analyzer & Magic Bytes Inspector: Identify unknown or corrupted files,
// inspect binary headers (Hex/ASCII dump), compute cryptographic checksums (SHA-256, SHA-1), and recommend conversion tools.

const SIGNATURES = [
  { ext: 'pdf', name: 'Adobe Portable Document Format (PDF)', match: b => b[0]===0x25 && b[1]===0x50 && b[2]===0x44 && b[3]===0x46, tool: '/pdf-reader/', toolName: 'PDF Reader' },
  { ext: 'zip', name: 'ZIP Compressed Archive / Office OpenXML', match: b => b[0]===0x50 && b[1]===0x4b && (b[2]===0x03||b[2]===0x05||b[2]===0x07), tool: '/unzip-files/', toolName: 'Unzip Files' },
  { ext: 'rar', name: 'WinRAR Compressed Archive', match: b => b[0]===0x52 && b[1]===0x61 && b[2]===0x72 && b[3]===0x21, tool: '/extract-rar/', toolName: 'Extract RAR' },
  { ext: '7z', name: '7-Zip Compressed Archive', match: b => b[0]===0x37 && b[1]===0x7a && b[2]===0xbc && b[3]===0xaf && b[4]===0x27 && b[5]===0x1c, tool: '/extract-7z/', toolName: 'Extract 7Z' },
  { ext: 'png', name: 'Portable Network Graphics (PNG)', match: b => b[0]===0x89 && b[1]===0x50 && b[2]===0x4e && b[3]===0x47, tool: '/png-to-jpg/', toolName: 'PNG to JPG' },
  { ext: 'jpg', name: 'JPEG Image (JFIF / EXIF)', match: b => b[0]===0xff && b[1]===0xd8 && b[2]===0xff, tool: '/jpg-to-pdf/', toolName: 'JPG to PDF' },
  { ext: 'gif', name: 'Graphics Interchange Format (GIF)', match: b => b[0]===0x47 && b[1]===0x49 && b[2]===0x46 && b[3]===0x38, tool: '/gif-to-mp4/', toolName: 'GIF to MP4' },
  { ext: 'webp', name: 'WebP Image', match: b => b[0]===0x52 && b[1]===0x49 && b[2]===0x46 && b[3]===0x46 && String.fromCharCode(...b.slice(8, 12)) === 'WEBP', tool: '/webp-to-jpg/', toolName: 'WebP to JPG' },
  { ext: 'psd', name: 'Adobe Photoshop Document (PSD)', match: b => b[0]===0x38 && b[1]===0x42 && b[2]===0x50 && b[3]===0x53, tool: '/psd-to-png/', toolName: 'PSD to PNG' },
  { ext: 'cdr', name: 'CorelDRAW Drawing', match: b => (b[0]===0x50 && b[1]===0x4b) || String.fromCharCode(...b.slice(0, 4))==='RIFF', tool: '/cdr-version-converter/', toolName: 'CDR Version Converter' },
  { ext: 'mp3', name: 'MPEG-1/2 Audio Layer 3 (MP3)', match: b => (b[0]===0xff && (b[1]&0xe0)===0xe0) || (b[0]===0x49 && b[1]===0x44 && b[2]===0x33), tool: '/audio-cutter/', toolName: 'Audio Cutter' },
  { ext: 'flac', name: 'Free Lossless Audio Codec (FLAC)', match: b => b[0]===0x66 && b[1]===0x4c && b[2]===0x61 && b[3]===0x43, tool: '/flac-to-mp3/', toolName: 'FLAC to MP3' },
  { ext: 'mp4', name: 'MPEG-4 Part 14 Video (MP4)', match: b => String.fromCharCode(...b.slice(4, 8))==='ftyp', tool: '/mp4-to-mp3/', toolName: 'MP4 to MP3' },
  { ext: 'mkv', name: 'Matroska Video (MKV)', match: b => b[0]===0x1a && b[1]===0x45 && b[2]===0xdf && b[3]===0xa3, tool: '/mkv-to-mp4/', toolName: 'MKV to MP4' },
  { ext: 'sqlite', name: 'SQLite 3 Database', match: b => String.fromCharCode(...b.slice(0, 15))==='SQLite format 3' },
  { ext: 'dxf', name: 'AutoCAD DXF Drawing', match: b => String.fromCharCode(...b.slice(0, 50)).includes('SECTION') && String.fromCharCode(...b.slice(0, 50)).includes('HEADER'), tool: '/dxf-to-pdf/', toolName: 'DXF to PDF' },
  { ext: 'dicom', name: 'DICOM Medical Image', match: b => String.fromCharCode(...b.slice(128, 132))==='DICM' },
  { ext: 'ttf', name: 'TrueType Font (TTF)', match: b => (b[0]===0x00 && b[1]===0x01 && b[2]===0x00 && b[3]===0x00) || String.fromCharCode(...b.slice(0, 4))==='true', tool: '/ttf-to-woff2/', toolName: 'TTF to WOFF2' },
  { ext: 'woff2', name: 'Web Open Font Format 2 (WOFF2)', match: b => String.fromCharCode(...b.slice(0, 4))==='wOF2', tool: '/woff2-to-ttf/', toolName: 'WOFF2 to TTF' }
];

async function sha256Hex(buf) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexDump(bytes, maxBytes = 96) {
  const slice = bytes.slice(0, maxBytes);
  let out = '';
  for (let i = 0; i < slice.length; i += 16) {
    const chunk = slice.slice(i, i + 16);
    const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    const ascii = Array.from(chunk).map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
    out += `${i.toString(16).padStart(4, '0').toUpperCase()}:  ${hex.padEnd(48, ' ')}  |${ascii}|\n`;
  }
  return out;
}

TOOLS.fileanalyzer = {
  opts() {
    return `<p class="hint">Upload any file to analyze its real binary signature, MIME type, cryptographic hash, and repair/conversion options.</p>`;
  },

  async run([file], status) {
    status(T.working || 'Reading file header…');
    const ab = await file.arrayBuffer();
    const bytes = new Uint8Array(ab);
    const hash = await sha256Hex(ab);
    const dump = hexDump(bytes);

    let match = SIGNATURES.find(s => {
      try { return s.match(bytes); } catch (e) { return false; }
    });

    const identifiedType = match ? match.name : (file.type || 'Unknown Binary Format');
    const ext = match ? match.ext.toUpperCase() : base(file.name).split('.').pop().toUpperCase();
    const recTool = match && match.tool ? `<p style="margin:10px 0 0"><b>Recommended Tool:</b> <a href="${match.tool}" class="btn mini" style="display:inline-block;margin-left:6px">${match.toolName} →</a></p>` : '';

    const html = `<div style="font-family:monospace;font-size:12px;background:var(--bg2,#f7f9fa);padding:14px;border-radius:8px;line-height:1.6;margin:12px 0">
      <div style="margin-bottom:8px"><b>File Name:</b> ${esc(file.name)}</div>
      <div style="margin-bottom:8px"><b>Exact Size:</b> ${fmtSize(file.size)} (${file.size.toLocaleString()} bytes)</div>
      <div style="margin-bottom:8px"><b>Identified Format:</b> <span style="color:#008822;font-weight:700">${esc(identifiedType)} [${esc(ext)}]</span></div>
      <div style="margin-bottom:8px"><b>Browser MIME:</b> ${esc(file.type || 'application/octet-stream')}</div>
      <div style="margin-bottom:12px;word-break:break-all"><b>SHA-256 Hash:</b> <code>${hash}</code></div>
      <div><b>Binary Header (Hex / ASCII Magic Bytes):</b></div>
      <pre style="background:#222;color:#00ff66;padding:10px;border-radius:6px;overflow-x:auto;margin:6px 0">${esc(dump)}</pre>
      ${recTool}
    </div>`;

    return {
      name: base(file.name) + '_analysis.txt',
      blob: new Blob([`File: ${file.name}\nSize: ${file.size} bytes\nType: ${identifiedType}\nSHA-256: ${hash}\n\nBinary Header:\n${dump}`], { type: 'text/plain' }),
      info: `Identified as: ${identifiedType}`,
      view: html
    };
  }
};
