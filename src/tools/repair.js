// Repair PDF: 1) tolerant re-parse + rewrite with pdf-lib (rebuilds xref/trailer, drops broken objects); 2) if that fails or pages are missing,
// rebuild every page that PDF.js can still render (text-preserving copy where possible, image fallback otherwise). Reports what happened.
TOOLS.repair={opts:()=>sel('rmode',T.o_rMode||'Method',[['auto',T.o_rAuto||'Automatic (recommended)'],['rewrite',T.o_rRewrite||'Rebuild structure only (keeps text)'],['render',T.o_rRender||'Re-render pages (most robust, pages become images)']]),
 async run(files,status){const {PDFDocument}=await L.pdflib();const items=[];const rep=[];
  for(const [fi,f] of files.entries()){status(`${T.working} ${fi+1}/${files.length}`);const data=new Uint8Array(await buf(f));const mode=v('rmode');let out=null,how='',pj=null,pjN=0;
   try{pj=await openPdfjs(data);pjN=pj.numPages;}catch(e){}
   if(mode!=='render'){try{let bytes=data;const h=String.fromCharCode(...data.slice(0,1024));const at=h.indexOf('%PDF');if(at>0){bytes=data.slice(at);how+='removed junk before header; ';}
     const d=await PDFDocument.load(bytes,{ignoreEncryption:true,throwOnInvalidObject:false,updateMetadata:false});const n=d.getPageCount();if(n===0)throw new Error('no pages');
     if(pjN&&n<pjN&&mode==='auto')throw new Error('pages missing');const o=await PDFDocument.create();const cp=await o.copyPages(d,d.getPageIndices());cp.forEach(p=>o.addPage(p));out=await o.save();how+=`structure rebuilt, ${n} pages kept`;}catch(e){if(mode==='rewrite')throw new Error('Could not rebuild this PDF ('+e.message+'). Try "Re-render pages".');how='';}}
   if(!out){if(!pj){try{pj=await (await L.pdfjs()).getDocument({data:data.slice(0),stopAtErrors:false}).promise;}catch(e){throw new Error(`${f.name}: the file is too damaged to read (${e.message}).`);}}
    const o=await PDFDocument.create();let ok=0,bad=0;for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);try{const c=await renderPage(pj,i,2);const b=new Uint8Array(await (await toBlob(c,'image/jpeg',.88)).arrayBuffer());const im=await o.embedJpg(b);const p=o.addPage([c.width/2,c.height/2]);p.drawImage(im,{x:0,y:0,width:c.width/2,height:c.height/2});ok++;c.width=c.height=0;}catch(e){bad++;}}
    if(!ok)throw new Error(`${f.name}: no page could be recovered.`);out=await o.save();how=`re-rendered ${ok} page(s)${bad?`, ${bad} unrecoverable`:''}`;}
   rep.push(`${f.name}: ${how}`);items.push({blob:pdfBlob(out),name:base(f.name)+'-repaired.pdf'});}
  const r=await zipOrOne(items,'repaired.zip');r.info=rep.join(' · ');return r;}};
