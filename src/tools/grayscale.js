// @needs pdfx
// ---------- Grayscale / black & white ----------
TOOLS.grayscale={opts:()=>sel('gmode','Colour mode',[['gray','Grayscale (shades of grey)'],['bw','Black & white (pure, for text scans)']])+inp('gthr','Black & white threshold (0–255)','number','160','min="40" max="230"')+sel('gq',T.o_quality,[['2.78|.85','Print (200 dpi)'],['2|.85','High'],['1.5|.75','Medium'],['1|.6','Small file']]),
  async run([f],status){const {PDFDocument}=await L.pdflib();const pj=await openPdfjs(await buf(f));const d=await PDFDocument.create();const [sc,q]=v('gq').split('|').map(Number);const bw=v('gmode')==='bw',th=+v('gthr')||160;
   const draw=bw?(ctx)=>{const c=ctx.canvas,im=ctx.getImageData(0,0,c.width,c.height),a=im.data;for(let j=0;j<a.length;j+=4){const y=a[j]*.299+a[j+1]*.587+a[j+2]*.114,o=y<th?0:255;a[j]=a[j+1]=a[j+2]=o;}ctx.putImageData(im,0,0);}:undefined;
   for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);await rasterInto(d,pj,i,{scale:sc,q:bw?Math.max(q,.9):q,gray:true,draw});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+(bw?'-black-white.pdf':'-grayscale.pdf')};}};
