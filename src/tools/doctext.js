// Document & Ebook Text Extractor: Convert DOCX to TXT, EPUB to TXT, and MOBI to TXT.
// 100% in-browser processing using mammoth, JSZip, and ebook decoders.

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractDocxText(arrayBuffer) {
  try {
    await load('mammoth.browser.min.js');
    const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  } catch (e) {
    // Fallback: unzip word/document.xml
    await load('jszip.min.js');
    const zip = await window.JSZip.loadAsync(arrayBuffer);
    const xml = await zip.file('word/document.xml')?.async('string');
    if (!xml) throw new Error('Invalid DOCX document');
    return xml.replace(/<w:p[^>]*>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"');
  }
}

async function extractEpubText(arrayBuffer) {
  await load('jszip.min.js');
  const zip = await window.JSZip.loadAsync(arrayBuffer);
  const htmlFiles = Object.keys(zip.files).filter(p => /\.(x?html|xml)$/i.test(p) && !/toc|container/i.test(p)).sort();

  let fullText = '';
  for (const path of htmlFiles) {
    const content = await zip.files[path].async('string');
    const clean = stripHtml(content).trim();
    if (clean) fullText += clean + '\n\n';
  }
  return fullText || 'No readable text content found in EPUB.';
}

function extractMobiText(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const numRecords = view.getUint16(76, false);
  let text = '';
  const decoder = new TextDecoder('latin1');

  for (let i = 0; i < Math.min(numRecords, 30); i++) {
    const offset = view.getUint32(78 + i * 8, false);
    const nextOffset = i < numRecords - 1 ? view.getUint32(78 + (i + 1) * 8, false) : offset + 4096;
    const len = Math.min(nextOffset - offset, arrayBuffer.byteLength - offset);
    if (len <= 0) continue;

    const slice = new Uint8Array(arrayBuffer, offset, len);
    const piece = decoder.decode(slice);
    if (piece.includes('<') && piece.includes('>')) {
      text += stripHtml(piece) + '\n';
    } else {
      text += piece.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') + '\n';
    }
  }
  return text.trim() || 'No text found in MOBI file.';
}

TOOLS.doctext = {
  opts() {
    return `<p style="font-size:13px;color:var(--txt2,#666);margin:0 0 10px">
      Extracts clean, readable plain text without formatting or markup.
    </p>`;
  },

  async run(files, status) {
    if (!files.length) throw new Error('Please select a document or ebook file.');
    const first = files[0];
    const mode = this.vars.mode || 'docx2txt';
    const baseName = first.name.replace(/\.[^/.]+$/, '');

    status('Reading document and extracting plain text...');
    const buf = await first.arrayBuffer();
    let text = '';

    if (mode === 'docx2txt' || /\.docx$/i.test(first.name)) {
      text = await extractDocxText(buf);
    } else if (mode === 'epub2txt' || /\.epub$/i.test(first.name)) {
      text = await extractEpubText(buf);
    } else if (mode === 'mobi2txt' || /\.(mobi|prc|azw|azw3)$/i.test(first.name)) {
      text = extractMobiText(buf);
    } else {
      text = new TextDecoder('utf-8').decode(buf);
    }

    return {
      blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
      name: `${baseName}.txt`,
      info: `Extracted ${text.length.toLocaleString()} characters of text`
    };
  }
};
