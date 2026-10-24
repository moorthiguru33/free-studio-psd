// @needs pdfx img
// OCR (tesseract.js, Apache-2.0; self-hosted LSTM models). Images -> text; PDFs/images -> searchable PDF (invisible text layer over the original page)
const OCRL=[['eng','English'],['spa','Español'],['fra','Français'],['deu','Deutsch'],['por','Português'],['ita','Italiano'],['rus','Русский'],['ara','العربية'],['hin','हिन्दी'],['tam','தமிழ்'],['chi_sim','中文 (简体)'],['jpn','日本語']];
const ocrWorker=async(langs,status)=>{await load('tesseract/tesseract.min.js');const w=await window.Tesseract.createWorker(langs,1,{workerPath:location.origin+'/vendor/tesseract/worker.min.js',corePath:location.origin+'/vendor/tesseract/',langPath:location.origin+'/models/tessdata',gzip:false,
 logger:m=>{if(m.status==='recognizing text')status(`${T.o_ocrReading} ${Math.round(m.progress*100)}%`);else if(/loading/.test(m.status))status(T.o_ocrLoading+' '+Math.round(m.progress*100)+'%');}});return w;};
TOOLS.ocr={opts(){const pdf=this.vars.pdf;return sel('olang',T.o_ocrLang,OCRL)+sel('olang2',T.o_ocrLang2,[['','—'],...OCRL])+(pdf?'':sel('oout',T.o_ocrOut,[['txt',T.o_ocrText],['pdf',T.o_ocrPdf]]))+inp('odpi',T.o_dpi,'number','200','min="100" max="400"');},
 async run(files,status){const langs=[v('olang'),v('olang2')].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join('+');const w=await ocrWorker(langs,status);const wantPdf=this.vars.pdf||v('oout')==='pdf';const items=[];let chars=0;
  try{const {PDFDocument}=await L.pdflib();
   for(const f of files){const isPdf=/pdf$/i.test(f.name)||f.type==='application/pdf';let out=wantPdf?await PDFDocument.create():null;let text='';
    if(isPdf){const bytes=await buf(f);const pj=await openPdfjs(bytes.slice(0));const src=await PDFDocument.load(bytes,{ignoreEncryption:true});out=src;
     for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${f.name} ${i}/${pj.numPages}`);const c=await renderPage(pj,i,(+v('odpi')||200)/72);const r=await w.recognize(c,{pdfTextOnly:true},{text:true,pdf:true});text+=(i>1?'\n\n':'')+r.data.text;
      const tp=await PDFDocument.load(new Uint8Array(r.data.pdf));const [e]=await src.embedPages([tp.getPage(0)]);const p=src.getPage(i-1);const {x,y,width:W,height:H}=p.getCropBox();p.drawPage(e,{x,y,width:W,height:H});}}
    else{const c=await fileToCanvas(f);const r=await w.recognize(c,{pdfTextOnly:false},{text:true,pdf:wantPdf});text=r.data.text;if(wantPdf){const tp=await PDFDocument.load(new Uint8Array(r.data.pdf));const [pg]=await out.copyPages(tp,[0]);out.addPage(pg);}}
    chars+=text.trim().length;
    items.push(wantPdf?{name:base(f.name)+'-ocr.pdf',blob:pdfBlob(await out.save())}:{name:base(f.name)+'.txt',blob:new Blob([text],{type:'text/plain;charset=utf-8'})});
    this.lastText=text;}
  }finally{await w.terminate();}
  const r=await zipOrOne(items,'ocr-results.zip');r.info=`${chars} ${T.o_xChars}`;if(!wantPdf&&files.length===1)r.view=`<textarea readonly rows="10" style="width:100%">${esc(this.lastText)}</textarea>`;return r;}};
