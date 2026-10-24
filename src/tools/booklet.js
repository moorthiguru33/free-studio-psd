// @needs pdfx
// Saddle-stitch booklet: pad to a multiple of 4, imposition 2-up on landscape sheets (print double-sided, flip on short edge, fold)
TOOLS.booklet={opts:()=>sel('bsheet',T.o_pagesize,[['a4','A4'],['letter','US Letter'],['a3','A3']])+chk('bcreep',T.o_bRtl,false),
 async run([f]){const {PDFDocument}=await L.pdflib();const src=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const n=src.getPageCount();const N=Math.ceil(n/4)*4;
  const [w0,h0]={a4:[595.28,841.89],letter:[612,792],a3:[841.89,1190.55]}[v('bsheet')];const W=h0,H=w0;const d=await PDFDocument.create();const emb=await d.embedPages(src.getPages());const rtl=vb('bcreep');
  const order=[];for(let i=0;i<N/2;i+=2){order.push([N-1-i,i],[i+1,N-2-i]);}
  for(const pair of order){const p=d.addPage([W,H]);const pr=rtl?pair.slice().reverse():pair;pr.forEach((k,j)=>{if(k>=n)return;const e=emb[k];const s=Math.min((W/2)/e.width,H/e.height);const w=e.width*s,h=e.height*s;p.drawPage(e,{x:j*W/2+(W/2-w)/2,y:(H-h)/2,width:w,height:h});});}
  return {blob:pdfBlob(await d.save()),name:base(f.name)+'-booklet.pdf',info:`${n} → ${order.length} ${T.o_sides}`};}};
