// Dark mode PDF: render pages with pdf.js and recolour (invert keeping hues / sepia / night) into a new PDF.
const DTH={dark:'Dark (inverted, keeps colours)',black:'Pure black (OLED)',sepia:'Sepia (warm paper)',night:'Night (amber text on black)',grey:'Soft grey'};
function recolor(c,th){const x=c.getContext('2d'),id=x.getImageData(0,0,c.width,c.height),d=id.data;
 for(let i=0;i<d.length;i+=4){let r=d[i],g=d[i+1],b=d[i+2];
  if(th==='sepia'){const l=.299*r+.587*g+.114*b;const t=l/255;d[i]=Math.round(91+(244-91)*t);d[i+1]=Math.round(70+(236-70)*t);d[i+2]=Math.round(54+(216-54)*t);continue;}
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),k=255-mx-mn;let R=r+k,G=g+k,B=b+k;const l=(510-mx-mn)/2;
  if(th==='black'){const k=l<40?0:1;R*=k;G*=k;B*=k;}
  if(th==='night'){const t=l/255;R=t*255;G=t*176;B=t*64;}
  if(th==='grey'){R=34+R*0.82;G=34+G*0.82;B=36+B*0.82;}
  else if(th==='dark'){R=Math.max(R,24);G=Math.max(G,24);B=Math.max(B,28);}
  d[i]=R;d[i+1]=G;d[i+2]=B;}
 x.putImageData(id,0,0);}
TOOLS.darkpdf={
 opts:()=>sel('dkt','Theme',Object.entries(DTH))+sel('dks','Quality',[['1.5','Standard (smaller file)'],['2','High'],['1','Small (fast)']])+inp('dkpg','Pages (blank for all)','text','')+chk('dkimg','Keep photos in natural colours',true),
 async run([f],status){const pj=await openPdfjs(await buf(f));const {PDFDocument}=await L.pdflib();const out=await PDFDocument.create();const th=v('dkt');const sc=+v('dks')||1.5;
  const s2=String(v('dkpg')||'').trim();const idx=s2?parseRanges(s2,pj.numPages).flatMap(r=>r.idx):[...Array(pj.numPages).keys()];
  for(const [k,i] of idx.entries()){status(`Page ${k+1}/${idx.length}`);progress((k+.5)/idx.length);const c=await renderPage(pj,i+1,sc);
   let imgs=[];if(vb('dkimg')){try{const pg=await pj.getPage(i+1);const ops=await pg.getOperatorList();const O=(await L.pdfjs()).OPS;let tm=[1,0,0,1,0,0];const st=[];
     const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
     const vp=pg.getViewport({scale:sc});for(let j=0;j<ops.fnArray.length;j++){const fn=ops.fnArray[j];if(fn===O.save)st.push(tm);else if(fn===O.restore)tm=st.pop()||tm;else if(fn===O.transform)tm=mul(tm,ops.argsArray[j]);else if(fn===O.paintImageXObject||fn===O.paintInlineImageXObject||fn===O.paintJpegXObject){const m=mul(vp.transform,tm);const xs=[m[4],m[4]+m[0],m[4]+m[2],m[4]+m[0]+m[2]],ys=[m[5],m[5]+m[1],m[5]+m[3],m[5]+m[1]+m[3]];const x0=Math.max(0,Math.min(...xs)),y0=Math.max(0,Math.min(...ys)),x1=Math.min(c.width,Math.max(...xs)),y1=Math.min(c.height,Math.max(...ys));if(x1-x0>8&&y1-y0>8&&(x1-x0)*(y1-y0)<c.width*c.height*0.9)imgs.push([x0,y0,x1-x0,y1-y0]);}}pg.cleanup();}catch(e){imgs=[];}}
   const keep=imgs.map(([x,y,w,h])=>{const t=newCanvasD(w,h);t.getContext('2d').drawImage(c,x,y,w,h,0,0,w,h);return [t,x,y];});
   recolor(c,th);const cx=c.getContext('2d');keep.forEach(([t,x,y])=>cx.drawImage(t,x,y));
   const jb=await toBlob(c,'image/jpeg',.85);const im=await out.embedJpg(new Uint8Array(await jb.arrayBuffer()));const p=await pj.getPage(i+1);const vp=p.getViewport({scale:1});const pg=out.addPage([vp.width,vp.height]);pg.drawImage(im,{x:0,y:0,width:vp.width,height:vp.height});}
  const b=await out.save();return {blob:pdfBlob(b),name:base(f.name)+'-'+th+'-mode.pdf',info:`${idx.length} page${idx.length>1?'s':''} converted to ${DTH[th].split(' (')[0]} mode`};}};
function newCanvasD(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;}
