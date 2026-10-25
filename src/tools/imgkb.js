// @needs img
// Compress image to an exact target size in KB: binary search on quality, then step down resolution if needed.
async function toTarget(c,fmt,maxB,minQ=.05){let lo=minQ,hi=.95,best=null;const mime=fmt==='webp'?'image/webp':'image/jpeg';const src=fmt==='jpg'?flatten(c):c;
 for(let i=0;i<9;i++){const q=(lo+hi)/2;const b=await toBlob(src,mime,q);if(b.size<=maxB){best={b,q};lo=q;}else hi=q;}
 if(!best){const b=await toBlob(src,mime,minQ);if(b.size<=maxB)best={b,q:minQ};}return best;}
TOOLS.imgkb={
 opts(){const kb=this.vars?.kb||'100';return inp('kbt','Target size (KB)','number',kb,'min="5" max="20000"')+sel('kbu','Unit',[['kb','KB (1 KB = 1024 bytes)'],['kb1000','kB (1 kB = 1000 bytes)']])+sel('kbf','Format',[['jpg','JPG (best for photos)'],['webp','WEBP (smaller, modern)']])+inp('kbmax','Maximum width/height (px, optional)','number','','min="16"')+chk('kbex','JPG: fill up to about 95% of the target (for forms with a minimum size)',false);},
 async run(files,status){const K=v('kbu')==='kb1000'?1000:1024;const tKB=+v('kbt');if(!(tKB>0))throw new Error('Enter a target size.');const maxB=Math.floor(tKB*K);const fmt=v('kbf');const items=[];const rep=[];
  for(const [n,f] of files.entries()){status(`Compressing ${n+1}/${files.length}`);let c=await fileToCanvas(f);const mx=+v('kbmax');if(mx>0&&Math.max(c.width,c.height)>mx){const s=mx/Math.max(c.width,c.height);const o=newCanvas(c.width*s,c.height*s);o.getContext('2d').drawImage(c,0,0,o.width,o.height);c=o;}
   let r=await toTarget(c,fmt,maxB,.3);let w=c.width;while(!r&&w>32){w=Math.round(w*0.85);const o=newCanvas(w,c.height*w/c.width);const x=o.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(c,0,0,o.width,o.height);r=await toTarget(o,fmt,maxB,.3);if(r)r.w=o.width,r.h=o.height;}
   if(!r)throw new Error(`${f.name}: cannot reach ${tKB} KB – try a larger target.`);let blob=r.b;
   if(vb('kbex')&&fmt==='jpg'&&blob.size<maxB*0.9){const ab=new Uint8Array(await blob.arrayBuffer());let need=Math.floor(maxB*0.95)-ab.length;const segs=[];while(need>4){const n=Math.min(65533,need-4);const sg=new Uint8Array(n+4);sg[0]=0xFF;sg[1]=0xFE;sg[2]=(n+2)>>8;sg[3]=(n+2)&255;sg.fill(32,4);segs.push(sg);need-=n+4;}blob=new Blob([ab.slice(0,2),...segs,ab.slice(2)],{type:'image/jpeg'});}
   rep.push(`${f.name}: ${(blob.size/K).toFixed(1)} KB${r.w?` (${r.w}×${r.h})`:''} q${Math.round(r.q*100)}`);items.push({name:imgName(f,'-'+tKB+'kb',fmt),blob});}
  const out=await zipOrOne(items,'images-'+tKB+'kb.zip');return {...out,info:rep.join(' · ')};}};
