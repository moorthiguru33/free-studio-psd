// @needs pdfx
// Remove metadata: Info dictionary, XMP, page piece info, embedded document-level JS/attachments (optional)
TOOLS.removemeta={opts:()=>chk('rmatt',T.o_rmAttach,true),
 async run([f]){const {PDFDocument,PDFName,PDFDict}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true,updateMetadata:false});const removed=[];
  const info=d.getInfoDict();for(const k of info.keys()){removed.push(k.decodeText?k.decodeText():String(k).slice(1));info.delete(k);}
  const cat=d.catalog;if(cat.get(PDFName.of('Metadata'))){cat.delete(PDFName.of('Metadata'));removed.push('XMP');}cat.delete(PDFName.of('PieceInfo'));
  if(vb('rmatt')){const nm=cat.lookup(PDFName.of('Names'));if(nm instanceof PDFDict){if(nm.get(PDFName.of('EmbeddedFiles'))){nm.delete(PDFName.of('EmbeddedFiles'));removed.push('Attachments');}if(nm.get(PDFName.of('JavaScript'))){nm.delete(PDFName.of('JavaScript'));removed.push('JavaScript');}}}
  for(const p of d.getPages()){p.node.delete(PDFName.of('Metadata'));p.node.delete(PDFName.of('PieceInfo'));}
  const out=await d.save({updateFieldAppearances:false});return {blob:pdfBlob(out),name:base(f.name)+'-clean.pdf',info:removed.length?T.o_rmRemoved+' '+[...new Set(removed)].join(', '):T.o_rmNone};}};
