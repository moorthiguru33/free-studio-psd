// @needs pdfx
// Overlay: put the pages of the 2nd PDF (letterhead, stamp, form) on top of / underneath the 1st PDF's pages
TOOLS.overlay={minFiles:2,get minMsg(){return T.o_ovNeed2;},opts:()=>sel('ovmode',T.o_ovMode,[['fg',T.o_ovFg],['bg',T.o_ovBg]])+sel('ovrep',T.o_ovRepeat,[['cycle',T.o_ovCycle],['last',T.o_ovLast],['first',T.o_ovFirst],['once',T.o_ovOnce]])+inp('ovop',T.o_opacity+' (%)','number','100','min="5" max="100"'),
 async run(files){const {PDFDocument}=await L.pdflib();const [a,b]=files;const doc=await PDFDocument.load(await buf(a),{ignoreEncryption:true});const ov=await PDFDocument.load(await buf(b),{ignoreEncryption:true});
  const emb=await doc.embedPages(ov.getPages());const rep=v('ovrep'),op=(+v('ovop')||100)/100;const pages=doc.getPages();
  pages.forEach((p,i)=>{let k=rep==='cycle'?i%emb.length:rep==='last'?Math.min(i,emb.length-1):rep==='first'?0:i;if(k>=emb.length)return;const e=emb[k];const {x,y,width:W,height:H}=p.getCropBox();const s=Math.min(W/e.width,H/e.height);const w=e.width*s,h=e.height*s;
   const opt={x:x+(W-w)/2,y:y+(H-h)/2,width:w,height:h,opacity:op};
   if(v('ovmode')==='fg')p.drawPage(e,opt);else{// draw underneath: prepend content stream
    p.drawPage(e,opt);const c=p.node.Contents();const arr=c.asArray?c.asArray():null;if(arr){const last=arr.pop();arr.unshift(last);}}});
  return {blob:pdfBlob(await doc.save()),name:base(a.name)+'-overlay.pdf'};}};
