// @needs img
TOOLS.imgcompress={opts:()=>qualityInp('q',70)+fmtSel('ofmt',T.o_format,true,['jpg','webp','png','avif'])+inp('maxw',T.o_maxWidth,'number','','min="16" placeholder="—"')+chk('strip',T.o_stripMeta,true),
 async run(files,status){const q=Math.min(100,Math.max(1,+v('q')||70))/100,maxw=+v('maxw')||0;const items=[];let tin=0,tout=0;
  for(const [i,f] of files.entries()){status(`${T.working} ${i+1}/${files.length}`);let c=await fileToCanvas(f);if(maxw&&c.width>maxw){const o=newCanvas(maxw,c.height*maxw/c.width);const x=o.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(c,0,0,o.width,o.height);c=o;}
   const fmt=outFmt(f,v('ofmt'));let b;
   if(fmt==='png'){const U=await IL.upng();const id=c.getContext('2d').getImageData(0,0,c.width,c.height);const colors=q>=.95?0:Math.max(16,Math.round(256*q));b=new Blob([U.encode([id.data.buffer],c.width,c.height,colors)],{type:'image/png'});}
   else b=await encodeCanvas(c,fmt,q);
   if(b.size>=f.size&&fmt===fmtOf(f)&&!maxw)b=f;// never make it bigger
   tin+=f.size;tout+=b.size;items.push({name:imgName(f,'-compressed',fmt),blob:b});}
  return {...await zipOrOne(items,'compressed-images.zip'),info:`${fmtSize(tin)} → ${fmtSize(tout)} (−${Math.max(0,Math.round(100-tout/tin*100))}%)`};}};
