// @needs pdfx
// PDF to RTF / ODT: Extract formatted document text, headings, lists, and paragraphs from PDF into editable Rich Text Format (.rtf) or OpenDocument Text (.odt).

function escapeRtf(s) {
  return String(s).replace(/[\r\n]+/g, ' ').replace(/[\\{}]/g, c => '\\' + c).replace(/[^\x20-\x7E]/g, c => {
    const code = c.charCodeAt(0);
    return code < 256 ? `\\'${code.toString(16).padStart(2, '0')}` : `\\u${code}?`;
  });
}

function escapeXml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function buildOdt(JSZip, docName, blocksByPage) {
  const zip = new JSZip();
  zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });
  
  zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`);

  zip.file('styles.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" office:version="1.2">
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:text-properties style:font-name="Arial" fo:font-size="11pt" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"/>
    </style:default-style>
  </office:styles>
</office:document-styles>`);

  let contentBody = '';
  for (const [pageIdx, blocks] of blocksByPage.entries()) {
    if (pageIdx > 0) {
      contentBody += `<text:p text:style-name="PageBreak"/>`;
    }
    for (const b of blocks) {
      const text = escapeXml(b.t);
      if (b.kind === 'h1') {
        contentBody += `<text:h text:outline-level="1">${text}</text:h>`;
      } else if (b.kind === 'h2') {
        contentBody += `<text:h text:outline-level="2">${text}</text:h>`;
      } else if (b.kind === 'li') {
        contentBody += `<text:list><text:list-item><text:p>${text}</text:p></text:list-item></text:list>`;
      } else {
        contentBody += `<text:p>${text}</text:p>`;
      }
    }
  }

  zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" office:version="1.2">
  <office:body>
    <office:text>
      ${contentBody}
    </office:text>
  </office:body>
</office:document-content>`);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.text' });
}

TOOLS.pdf2doc = {
  opts() {
    const to = (this.vars || {}).to || 'rtf';
    const opts = [
      ['rtf', 'Rich Text Format (.rtf) — Compatible with MS Word & WordPad'],
      ['odt', 'OpenDocument Text (.odt) — Compatible with LibreOffice & Google Docs']
    ];
    return sel('docto', T.o_format || 'Convert to', [...opts.filter(o => o[0] === to), ...opts.filter(o => o[0] !== to)]) +
      chk('pbreak', T.o_xPageBreaks || 'Include page breaks', true);
  },

  async run(files, status) {
    const file = files[0];
    const to = v('docto') || (this.vars || {}).to || 'rtf';
    const keepBreaks = vb('pbreak');
    status(T.working || 'Reading PDF…');

    const pj = await openPdfjs(await buf(file));
    const pts = await pageTexts(pj);
    let totalChars = 0;
    const blocksByPage = [];

    pts.forEach((pt, i) => {
      status(`${T.working || 'Extracting'} ${i + 1}/${pts.length}`);
      const bl = blocksOf(pt);
      totalChars += bl.reduce((a, b) => a + b.t.length, 0);
      blocksByPage.push(bl);
    });

    if (!totalChars) throw new Error(T.o_xNoText || 'No readable text layer found in this PDF.');

    const docName = base(file.name);

    if (to === 'rtf') {
      let rtf = '{\\rtf1\\ansi\\deff0\\deflang1033{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}{\\f1\\fnil\\fcharset0 Times New Roman;}}\n';
      rtf += '{\\colortbl ;\\red0\\green0\\blue0;\\red33\\green33\\blue33;}\n\\f0\\fs22 ';

      blocksByPage.forEach((blocks, i) => {
        if (i > 0 && keepBreaks) {
          rtf += '\\page\n';
        }
        for (const b of blocks) {
          const t = escapeRtf(b.t);
          if (b.kind === 'h1') {
            rtf += `\\par\\fs36\\b ${t}\\b0\\fs22\\par\n`;
          } else if (b.kind === 'h2') {
            rtf += `\\par\\fs28\\b ${t}\\b0\\fs22\\par\n`;
          } else if (b.kind === 'li') {
            rtf += `\\bullet  ${t}\\par\n`;
          } else {
            rtf += `${t}\\par\\par\n`;
          }
        }
      });
      rtf += '}';
      const blob = new Blob([rtf], { type: 'application/rtf;charset=utf-8' });
      return { blob, name: `${docName}.rtf`, info: `${totalChars} characters extracted to RTF` };
    }

    // ODT format
    const JSZip = await L.zip();
    const odtBlob = await buildOdt(JSZip, docName, blocksByPage);
    return { blob: odtBlob, name: `${docName}.odt`, info: `${totalChars} characters extracted to ODT` };
  }
};
