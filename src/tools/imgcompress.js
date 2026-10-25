// @needs img
async function toTargetKB(c,fmt,kb,q0){const T0=kb*1024;let lo=.05,hi=q0,b=await encodeCanvas(c,fmt,hi);if(b.size<=T0)return b;let best=null;for(let k=0;k<7;k++){const m=(lo+hi)/2;const t=await encodeCanvas(c,fmt,m);if(t.size<=T0){best=t;lo=m;}else hi=m;}if(best)return best;
 let s=c;for(let k=0;k<8;k++){const o=newCanvas(Math.max(16,Math.round(s.width*.85)),Math.max(16,Math.round(s.height*.85)));const x=o.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(s,0,0,o.width,o.height);s=o;const t=await encodeCanvas(s,fmt,.6);if(t.size<=T0)return t;}return await encodeCanvas(s,fmt,.4);}
TOOLS.imgcompress={opts:()=>qualityInp('q',70)+fmtSel('ofmt',T.o_format,true,['jpg','webp','png','avif'])+sel('tkb',T.o_targetKb||'Target file size',[['',T.o_off||'Off — use quality'],['20','20 KB'],['50','50 KB'],['100','100 KB'],['200','200 KB'],['500','500 KB'],['1024','1 MB'],['c','Custom…']])+inp('tkbc',T.o_kb||'Custom size (KB)','number','','min="5" placeholder="KB"')+inp('maxw',T.o_maxWidth,'number','','min="16" placeholder="—"')+chk('strip',T.o_stripMeta,true),
 async run(files,status){const q=Math.min(100,Math.max(1,+v('q')||70))/100,maxw=+v('maxw')||0;const kb=v('tkb')==='c'?+v('tkbc')||0:+v('tkb')||0;const items=[],rows=[];let tin=0,tout=0;
  for(const [i,f] of files.entries()){status(`${T.working} ${i+1}/${files.length}`);let c=await fileToCanvas(f);if(maxw&&c.width>maxw){const o=newCanvas(maxw,c.height*maxw/c.width);const x=o.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(c,0,0,o.width,o.height);c=o;}
   let fmt=outFmt(f,v('ofmt'));if(kb&&fmt==='png')fmt='webp';let b;
   if(kb)b=await toTargetKB(c,fmt,kb,q);
   else if(fmt==='png'){const U=await IL.upng();const id=c.getContext('2d').getImageData(0,0,c.width,c.height);const colors=q>=.95?0:Math.max(16,Math.round(256*q));b=new Blob([U.encode([id.data.buffer],c.width,c.height,colors)],{type:'image/png'});}
   else b=await encodeCanvas(c,fmt,q);
   if(!kb&&b.size>=f.size&&fmt===fmtOf(f)&&!maxw)b=f;// never make it bigger
   tin+=f.size;tout+=b.size;items.push({name:imgName(f,'-compressed',fmt),blob:b});rows.push(`<tr><td>${esc(f.name)}</td><td>${fmtSize(f.size)}</td><td>${fmtSize(b.size)}</td><td>−${Math.max(0,Math.round(100-b.size/f.size*100))}%</td></tr>`);}
  return {...await zipOrOne(items,'compressed-images.zip'),info:`${fmtSize(tin)} → ${fmtSize(tout)} (−${Math.max(0,Math.round(100-tout/tin*100))}%)`,view:files.length>1?`<table class="tbl"><tr><th>File</th><th>Before</th><th>After</th><th>Saved</th></tr>${rows.join('')}</table>`:''};}};
