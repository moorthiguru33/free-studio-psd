// @needs img
TOOLS.imgresize={opts:()=>sel('rmode',T.o_mode,[['px',T.o_byPx],['pct',T.o_byPct]])+inp('rw',T.o_width,'number','800','min="1"')+inp('rh',T.o_height,'number','','min="1" placeholder="auto"')+inp('rpct','%','number','50','min="1" max="1000"')+chk('rkeep',T.o_keepAspect,true)+fmtSel('ofmt',T.o_format),
 async run(files,status){const items=[];for(const [i,f] of files.entries()){status(`${T.working} ${i+1}/${files.length}`);const c=await fileToCanvas(f);let w,h;
   if(v('rmode')==='pct'){const p=(+v('rpct')||100)/100;w=c.width*p;h=c.height*p;}else{w=+v('rw')||0;h=+v('rh')||0;if(!w&&!h)throw new Error(T.o_width+'?');if(vb('rkeep')||!w||!h){if(w&&h){const s=Math.min(w/c.width,h/c.height);w=c.width*s;h=c.height*s;}else if(w)h=c.height*w/c.width;else w=c.width*h/c.height;}}
   w=Math.round(w);h=Math.round(h);if(w>16384||h>16384)throw new Error('Max 16384 px');
   // step down in halves for better quality when shrinking a lot
   let src=c;while(src.width/2>w&&src.height/2>h){const t=newCanvas(src.width/2,src.height/2);const x=t.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(src,0,0,t.width,t.height);src=t;}
   const o=newCanvas(w,h);const x=o.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(src,0,0,w,h);const fmt=outFmt(f,v('ofmt'));items.push({name:imgName(f,`-${w}x${h}`,fmt),blob:await encodeCanvas(o,fmt,.9)});}
  return zipOrOne(items,'resized-images.zip');}};
