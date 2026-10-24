// @needs pdfx
// ---------- Grayscale ----------
TOOLS.grayscale={opts:()=>sel('gq',T.o_quality,[['2|.85','High'],['1.5|.75','Medium'],['1|.6','Small file']]),
  async run([f],status){const {PDFDocument}=await L.pdflib();const pj=await openPdfjs(await buf(f));const d=await PDFDocument.create();const [sc,q]=v('gq').split('|').map(Number);
   for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);await rasterInto(d,pj,i,{scale:sc,q,gray:true});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-grayscale.pdf'};}};
