// @needs pdfx
// ---------- Flatten ----------
TOOLS.flatten={opts:()=>sel('flmode',T.o_mode,[['forms',T.o_flForms],['all',T.o_flAll]]),
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);let n=0;
   if(v('flmode')==='all'){const pj=await openPdfjs(data);const d=await PDFDocument.create();for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);await rasterInto(d,pj,i,{scale:2,q:.9});}return {blob:pdfBlob(await d.save()),name:base(f.name)+'-flattened.pdf'};}
   const d=await PDFDocument.load(data);const form=d.getForm();n=form.getFields().length;try{form.updateFieldAppearances();}catch(e){}form.flatten();
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-flattened.pdf',info:`${n} form fields flattened`};}};
