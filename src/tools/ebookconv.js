// @needs pdfx htmlpdf
// Ebook Converter: FB2 / MOBI / AZW3 / PRC -> EPUB or PDF
// Utilizes src/lib/ebook.js to decode and rebuild valid EPUB 3, and htmlToPdf for PDF export.
TOOLS.ebookconv = {
  opts() {
    const to = (this.vars || {}).to || 'epub';
    if (to === 'pdf') {
      return sel('psize', T.o_pagesize || 'Page size', [['a5', 'A5 (book)'], ['a4', 'A4'], ['letter', 'Letter']]) +
        sel('efont', T.o_fontSize || 'Font size', [['11', '11 pt'], ['10', '10 pt'], ['12', '12 pt'], ['14', '14 pt (large print)']]);
    }
    return `<p class="hint">Convert e-books to standard EPUB for Apple Books, Kobo, Android, and e-readers.</p>`;
  },

  async run(files, status) {
    await load('ebook.js');
    const JSZip = await L.zip();
    const to = (this.vars || {}).to || 'epub';
    const eps = [];

    for (const [i, f] of files.entries()) {
      status(`${T.working || 'Converting'} ${i + 1}/${files.length} · ${f.name}`);
      const { blob, book } = await window.Ebook.toEpub(f, JSZip);
      eps.push({ blob, name: base(f.name.replace(/\.fb2\.zip$/i, '.fb2')) + '.epub', book });
    }

    if (to === 'epub') {
      const r = await zipOrOne(eps.map(e => ({ blob: e.blob, name: e.name })), 'converted-ebooks.zip');
      r.info = eps.map(e => `${e.book.title || 'Ebook'}${e.book.author ? ' – ' + e.book.author : ''}: ${e.book.chapters ? e.book.chapters.length : 0} chapter(s)`).join(' · ');
      return r;
    }

    // Convert generated EPUB to PDF
    const pdfItems = [];
    for (const [i, ep] of eps.entries()) {
      status(`${T.working || 'Rendering PDF'} ${i + 1}/${eps.length} · ${ep.name}`);
      let html = `<h1>${esc(ep.book.title || 'Ebook')}</h1>`;
      if (ep.book.author) html += `<h3>${esc(ep.book.author)}</h3>`;
      if (ep.book.chapters) {
        for (const ch of ep.book.chapters) {
          if (ch.title) html += `<h2>${esc(ch.title)}</h2>`;
          if (ch.html) html += ch.html;
        }
      }
      const d = await htmlToPdf(html, {
        size: v('psize') || 'a5',
        base: +(v('efont') || 11),
        margin: (v('psize') === 'a5' ? 42 : 56),
        title: ep.book.title || ep.name
      });
      pdfItems.push({ blob: pdfBlob(await d.save()), name: base(ep.name) + '.pdf' });
    }
    return zipOrOne(pdfItems, 'converted-ebooks.zip');
  }
};
