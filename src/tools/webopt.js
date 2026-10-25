// @needs pdfx
// Web optimize: rebuild a compact PDF (object streams, drop unused objects, thumbnails, page-piece data, JS) for faster download & display.
// Note: true linearization ("Fast Web View") is not possible in the browser; most viewers stream PDFs fine without it.
TOOLS.webopt={opts:()=>chk('wmeta',T.o_wRemoveMeta,false)+chk('wjs',T.o_wRemoveJs,true),
 async run([f]){const {PDFDocument,PDFName}=await L.pdflib();const src=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const d=await PDFDocument.create();
  const pages=await d.copyPages(src,src.getPageIndices());for(const p of pages){for(const k of ['Thumb','PieceInfo','Metadata'])p.node.delete(PDFName.of(k));if(vb('wjs'))p.node.delete(PDFName.of('AA'));d.addPage(p);}
  if(!vb('wmeta')){const t=src.getTitle(),a=src.getAuthor(),s=src.getSubject(),k=src.getKeywords();if(t)d.setTitle(t);if(a)d.setAuthor(a);if(s)d.setSubject(s);if(k)d.setKeywords([k]);}
  d.setProducer('Fileopia');d.setCreator('');const out=await d.save({useObjectStreams:true});return {blob:pdfBlob(out),name:base(f.name)+'-web.pdf',info:`${fmtSize(f.size)} → ${fmtSize(out.length)}`};}};
