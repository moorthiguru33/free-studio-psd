// @needs pdfx
// ---------- Deskew (projection-profile angle detection) ----------
TOOLS.deskew={opts:()=>inp('dmax',T.o_maxAngle,'number','10','min="1" max="20"'),
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);const pj=await openPdfjs(data);const src=await PDFDocument.load(data);const d=await PDFDocument.create();const maxA=+v('dmax')||10;const angles=[];
   for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);const c=await renderPage(pj,i,1);const ang=detectSkew(c,maxA);c.width=c.height=0;angles.push(ang);
    if(Math.abs(ang)<0.15){const [p]=await d.copyPages(src,[i-1]);d.addPage(p);continue;}
    await rasterInto(d,pj,i,{scale:2,q:.88,draw:(ctx,s)=>{const cv=ctx.canvas;const tmp=document.createElement('canvas');tmp.width=cv.width;tmp.height=cv.height;tmp.getContext('2d').drawImage(cv,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang*Math.PI/180);ctx.drawImage(tmp,-cv.width/2,-cv.height/2);ctx.restore();tmp.width=0;}});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-deskewed.pdf',info:'Angles: '+angles.map(a=>a.toFixed(1)+'°').join(', ')};}};
