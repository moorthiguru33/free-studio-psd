// Remove hyperlinks (Link annotations) from a PDF with pdf-lib.
TOOLS.rmlinks={
 opts:()=>sel('rlm','Remove',[['all','All links (web, email and internal)'],['ext','Web & email links only (keep table-of-contents links)'],['int','Internal links only']])+chk('rlact','Also remove document open actions & JavaScript',true),
 async run([f]){const {PDFDocument,PDFName,PDFArray,PDFDict}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const mode=v('rlm');let n=0,urls=new Set();
  for(const p of d.getPages()){const an=p.node.Annots();if(!an)continue;const keep=[];for(let i=0;i<an.size();i++){const ref=an.get(i);const a=d.context.lookup(ref);
    const isLink=a instanceof PDFDict&&String(a.get(PDFName.of('Subtype')))==='/Link';if(!isLink){keep.push(ref);continue;}
    const act=a.lookup(PDFName.of('A'));const s=act instanceof PDFDict?String(act.get(PDFName.of('S'))):'';const ext=s==='/URI'||s==='/Launch'||s==='/GoToR'||s==='/SubmitForm';
    if(ext){const u=act.lookup(PDFName.of('URI'));if(u)urls.add(u.decodeText?u.decodeText():String(u));}
    const rm=mode==='all'||(mode==='ext'&&ext)||(mode==='int'&&!ext);if(rm)n++;else keep.push(ref);}
   if(keep.length)p.node.set(PDFName.of('Annots'),d.context.obj(keep));else p.node.delete(PDFName.of('Annots'));}
  if(vb('rlact')){d.catalog.delete(PDFName.of('OpenAction'));d.catalog.delete(PDFName.of('AA'));const nm=d.catalog.lookup(PDFName.of('Names'));if(nm instanceof PDFDict)nm.delete(PDFName.of('JavaScript'));}
  const out=await d.save();return {blob:pdfBlob(out),name:base(f.name)+'-no-links.pdf',info:n?`Removed ${n} link${n>1?'s':''}${urls.size?` (${urls.size} unique web address${urls.size>1?'es':''})`:''}`:'No matching links found – the PDF is unchanged.'};}};
