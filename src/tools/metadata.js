// @needs pdfx
// ---------- Edit metadata ----------
TOOLS.metadata={async setup(files){const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(files[0]),{updateMetadata:false});const g=k=>{try{const x=d['get'+k]();return x||'';}catch(e){return '';}};
   const el=document.createElement('div');el.className='opts';el.innerHTML=['Title','Author','Subject','Keywords','Creator','Producer'].map(k=>inp('m'+k,T['o_m'+k]||k,'text',k==='Keywords'?String(g(k)):g(k))).join('')+chk('mstrip',T.o_mStrip,false);return el;},
  async run([f]){const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{updateMetadata:false});const strip=vb('mstrip');
   for(const k of ['Title','Author','Subject','Creator','Producer'])d['set'+k](strip?'':v('m'+k)||'');d.setKeywords(strip?[]:(v('mKeywords')||'').split(/[,;]\s*/).filter(Boolean));const now=new Date();d.setModificationDate(now);
   if(strip){try{d.catalog.delete(window.PDFLib.PDFName.of('Metadata'));}catch(e){}}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-metadata.pdf'};}};
