// @needs pdfx
// ---------- Crop ----------
TOOLS.crop={opts:()=>['ct','cr','cb','cl'].map(k=>inp(k,T['o_'+k]+' (mm)','number','10','min="0" step="1"')).join('')+inp('cpages',T.o_pagesOpt,'text','','placeholder="1-3,5"'),
  async run([f]){const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(f));const mm=x=>(+x||0)*72/25.4;const [t,r,b,l]=['ct','cr','cb','cl'].map(k=>mm(v(k)));const pages=d.getPages();
   const idx=(v('cpages')||'').trim()?parseRanges(v('cpages'),pages.length).flatMap(x=>x.idx):pages.map((_,i)=>i);
   for(const i of idx){const p=pages[i];const {x,y,width:W,height:H}=p.getCropBox();if(l+r>=W||t+b>=H)throw new Error('Crop larger than page '+(i+1));const box=[x+l,y+b,W-l-r,H-t-b];p.setCropBox(...box);p.setMediaBox(...box);p.setTrimBox(...box);p.setBleedBox(...box);}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-cropped.pdf'};}};
