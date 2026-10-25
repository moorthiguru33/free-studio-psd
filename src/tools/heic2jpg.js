// @needs img
TOOLS.heic2jpg={opts:()=>sel('ofmt',T.o_format,[['jpg','JPG'],['png','PNG'],['webp','WEBP'],['pdf','PDF (all photos in one file)']])+qualityInp('q',92)+inp('hmaxw',T.o_maxWidth||'Max width (px)','number','','min="16" placeholder="—"'),
 async run(files,status){const items=[];const fmt=v('ofmt'),q=(+v('q')||92)/100,mw=+v('hmaxw')||0;let pdf=null;if(fmt==='pdf'){await load('pdf-lib.min.js');pdf=await window.PDFLib.PDFDocument.create();}
  for(const [i,f] of files.entries()){status(`${T.working} ${i+1}/${files.length}`);let c=await fileToCanvas(f);if(mw&&c.width>mw){const o=newCanvas(mw,Math.round(c.height*mw/c.width));const x=o.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(c,0,0,o.width,o.height);c=o;}
   if(pdf){const b=await encodeCanvas(c,'jpg',q);const im=await pdf.embedJpg(await b.arrayBuffer());const pw=c.width*72/150,ph=c.height*72/150;pdf.addPage([pw,ph]).drawImage(im,{x:0,y:0,width:pw,height:ph});}
   else items.push({name:imgName(f,'',fmt),blob:await encodeCanvas(c,fmt,q)});}
  if(pdf)return {name:'heic-photos.pdf',blob:new Blob([await pdf.save()],{type:'application/pdf'})};
  return zipOrOne(items,'heic-converted.zip');}};
