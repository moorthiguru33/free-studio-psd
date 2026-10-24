// @needs pdfx
// ---------- N-up ----------
TOOLS.nup={opts:()=>sel('nper',T.o_perSheet,[['2','2'],['4','4'],['6','6'],['9','9']])+sel('nsheet',T.o_pagesize,[['a4','A4'],['letter','US Letter']])+chk('nborder',T.o_border,true),
  async run([f]){const {PDFDocument,rgb}=await L.pdflib();const src=await PDFDocument.load(await buf(f));const d=await PDFDocument.create();const per=+v('nper');const [cols,rows]={2:[2,1],4:[2,2],6:[3,2],9:[3,3]}[per];
   let [W,H]=v('nsheet')==='a4'?[595.28,841.89]:[612,792];if(cols>rows)[W,H]=[H,W];const emb=await d.embedPages(src.getPages());const m=18,g=8;const cw=(W-2*m-(cols-1)*g)/cols,ch=(H-2*m-(rows-1)*g)/rows;
   for(let i=0;i<emb.length;i+=per){const p=d.addPage([W,H]);for(let k=0;k<per&&i+k<emb.length;k++){const e=emb[i+k];const c=k%cols,r=Math.floor(k/cols);const s=Math.min(cw/e.width,ch/e.height);const w=e.width*s,h=e.height*s;const x=m+c*(cw+g)+(cw-w)/2,y=H-m-(r+1)*ch-r*g+(ch-h)/2;p.drawPage(e,{x,y,width:w,height:h});if(vb('nborder'))p.drawRectangle({x,y,width:w,height:h,borderColor:rgb(.7,.7,.7),borderWidth:.5});}}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+`-${per}up.pdf`,info:`${emb.length} → ${d.getPageCount()} ${T.pages}`};}};
