// @needs pdfx
// Rasterize: turn every page into an image (flattens everything, defeats copy/edit)
TOOLS.rasterize={opts:()=>sel('rdpi',T.o_dpi,[['150','150 DPI'],['100','100 DPI'],['200','200 DPI'],['300','300 DPI'],['72','72 DPI']])+sel('rfmt',T.o_format,[['jpg','JPG'],['png','PNG ('+T.o_lossless+')']])+chk('rgray',T.o_grayscale,false),
 async run([f],status){const {PDFDocument}=await L.pdflib();const pj=await openPdfjs(await buf(f));const d=await PDFDocument.create();const sc=(+v('rdpi'))/72;
  for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);if(v('rfmt')==='png'){const pg=await pj.getPage(i);const vp=pg.getViewport({scale:1});const c=await renderPage(pj,i,sc);if(vb('rgray')){const x=c.getContext('2d');x.filter='grayscale(1)';x.drawImage(c,0,0);}const im=await d.embedPng(await (await toBlob(c,'image/png')).arrayBuffer());d.addPage([vp.width,vp.height]).drawImage(im,{x:0,y:0,width:vp.width,height:vp.height});}
   else await rasterInto(d,pj,i,{scale:sc,q:.85,gray:vb('rgray')});}
  return {blob:pdfBlob(await d.save()),name:base(f.name)+'-rasterized.pdf'};}};
