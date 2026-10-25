// @needs pdfx
// ---------- Crop (manual margins or auto-trim white margins) ----------
TOOLS.crop={opts:()=>sel('cmode','Mode',[['auto','Auto crop – trim white margins'],['manual','Manual margins (mm)']])+inp('cpad','Padding for auto crop (mm)','number','3','min="0" step="1"')+chk('cuni','Auto: same crop box on every page',true)+['ct','cr','cb','cl'].map(k=>inp(k,T['o_'+k]+' (mm)','number','10','min="0" step="1"')).join('')+inp('cpages',T.o_pagesOpt,'text','','placeholder="1-3,5"'),
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);const d=await PDFDocument.load(data);const mm=x=>(+x||0)*72/25.4;const pages=d.getPages();
   const idx=(v('cpages')||'').trim()?parseRanges(v('cpages'),pages.length).flatMap(x=>x.idx):pages.map((_,i)=>i);const M={};
   if(v('cmode')==='auto'){const pj=await openPdfjs(data);const pad=mm(v('cpad'));let skipped=0;
    for(const i of idx){status(`${T.working} ${i+1}/${pages.length}`);if(pages[i].getRotation().angle%360){skipped++;continue;}const c=await renderPage(pj,i+1,1);const x=c.getContext('2d'),W=c.width,H=c.height,dt=x.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=-1,y1=-1;
     for(let y=0;y<H;y++)for(let X=0;X<W;X++){const j=(y*W+X)*4;if(dt[j]+dt[j+1]+dt[j+2]<720){if(X<x0)x0=X;if(X>x1)x1=X;if(y<y0)y0=y;if(y>y1)y1=y;}}
     if(x1<0)continue;M[i]=[Math.max(0,y0-pad),Math.max(0,W-1-x1-pad),Math.max(0,H-1-y1-pad),Math.max(0,x0-pad)];}
    if(vb('cuni')){const ks=Object.keys(M);if(ks.length){const u=[0,1,2,3].map(k=>Math.min(...ks.map(i=>M[i][k])));ks.forEach(i=>M[i]=u);}}
   }else{const m=['ct','cr','cb','cl'].map(k=>mm(v(k)));idx.forEach(i=>M[i]=m);}
   let n=0;for(const i of Object.keys(M)){const [t,r,b,l]=M[i];const p=pages[i];const {x,y,width:W,height:H}=p.getCropBox();if(l+r>=W||t+b>=H)throw new Error('Crop larger than page '+(+i+1));const box=[x+l,y+b,W-l-r,H-t-b];p.setCropBox(...box);p.setMediaBox(...box);p.setTrimBox(...box);p.setBleedBox(...box);n++;}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-cropped.pdf',info:`${n} ${T.pages}`};}};
