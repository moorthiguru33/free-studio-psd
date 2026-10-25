// @needs img
// GIF compressor: decode with gifuct-js, optionally resize / drop frames / reduce colours, re-encode with gifenc.
TOOLS.gifcompress={
 opts:()=>sel('gcc','Colours',[['128','128 colours (balanced)'],['256','256 colours (best quality)'],['64','64 colours (smaller)'],['32','32 colours (smallest)']])+sel('gcs','Size',[['100','Keep size'],['75','75%'],['50','50%'],['33','33%']])+sel('gcd','Frames',[['1','Keep all frames'],['2','Drop every 2nd frame'],['3','Keep 1 in 3 frames']])+chk('gclossy','Lossy: merge similar colours between frames',true),
 async run(files,status){await load('gifuct.js');const G=await IL.gifenc();const items=[];let rep=[];
  for(const f of files){const gif=gifuct.parseGIF(await f.arrayBuffer());const fr=gifuct.decompressFrames(gif,true);if(!fr.length)throw new Error(f.name+': no frames');const W0=gif.lsd.width,H0=gif.lsd.height;
   const sc=(+v('gcs')||100)/100,W=Math.max(1,Math.round(W0*sc)),H=Math.max(1,Math.round(H0*sc));const full=newCanvas(W0,H0),fx=full.getContext('2d');const tmp=newCanvas(1,1),tx=tmp.getContext('2d');const out=newCanvas(W,H),ox=out.getContext('2d');
   const step=+v('gcd')||1,cols=+v('gcc')||128,lossy=vb('gclossy');const frames=[];let acc=0,alpha=false;
   for(const [i,F] of fr.entries()){const {dims:d}=F;if(tmp.width!==d.width||tmp.height!==d.height){tmp.width=d.width;tmp.height=d.height;}const id=tx.createImageData(d.width,d.height);id.data.set(F.patch);tx.putImageData(id,0,0);
    const before=F.disposalType===3?fx.getImageData(0,0,W0,H0):null;fx.drawImage(tmp,d.left,d.top);acc+=F.delay||100;
    if(i%step===0){ox.clearRect(0,0,W,H);ox.imageSmoothingQuality='high';ox.drawImage(full,0,0,W,H);const px=ox.getImageData(0,0,W,H).data;for(let k=3;k<px.length;k+=4){if(px[k]<128){alpha=true;px[k]=0;}else px[k]=255;}frames.push({px,delay:acc});acc=0;}
    if(F.disposalType===2)fx.clearRect(d.left,d.top,d.width,d.height);else if(before)fx.putImageData(before,0,0);
    if(i%10===0){status(`${f.name}: frame ${i+1}/${fr.length}`);await new Promise(r=>setTimeout(r));}}
   if(acc&&frames.length)frames[frames.length-1].delay+=acc;
   // one global palette from a sample of frames (cheaper than a palette per frame), one slot kept for transparency
   const n=frames.length,pick=[...new Set([0,Math.floor(n/4),Math.floor(n/2),Math.floor(3*n/4),n-1])].filter(k=>k>=0&&k<n);const sample=new Uint8ClampedArray(pick.length*W*H*4);pick.forEach((k,j)=>sample.set(frames[k].px,j*W*H*4));
   const pal=G.quantize(sample,cols-1,{format:'rgb565'});const T=pal.length;pal.push([0,0,0]);const thr=lossy?24:0;
   const g=G.GIFEncoder();let shown=null;
   for(const [j,{px,delay}] of frames.entries()){const idx=G.applyPalette(px,pal.slice(0,T),'rgb565');
    for(let p=0,k=0;p<idx.length;p++,k+=4){if(px[k+3]===0){idx[p]=T;continue;}
     if(!alpha&&shown){const c=pal[idx[p]];if(Math.abs(c[0]-shown[k])+Math.abs(c[1]-shown[k+1])+Math.abs(c[2]-shown[k+2])<=thr){idx[p]=T;continue;}}
     if(shown){const c=pal[idx[p]];shown[k]=c[0];shown[k+1]=c[1];shown[k+2]=c[2];}}
    if(!shown&&!alpha){shown=new Uint8ClampedArray(px.length);for(let p=0,k=0;p<idx.length;p++,k+=4){const c=pal[idx[p]];shown[k]=c[0];shown[k+1]=c[1];shown[k+2]=c[2];}}
    g.writeFrame(idx,W,H,{palette:j===0?pal:undefined,delay,transparent:true,transparentIndex:T,dispose:alpha?2:1,repeat:0});
    if(j%10===0){status(`${f.name}: encoding ${j+1}/${n}`);await new Promise(r=>setTimeout(r));}}
   g.finish();let blob=new Blob([g.bytes()],{type:'image/gif'});
   if(blob.size>=f.size){rep.push(`${f.name}: already optimised – kept original (${fmtSize(f.size)}); try fewer colours, a smaller size or dropping frames`);blob=f;}else rep.push(`${fmtSize(f.size)} → ${fmtSize(blob.size)} (−${Math.round(100-blob.size/f.size*100)}%)`);
   items.push({name:base(f.name)+'-compressed.gif',blob});}
  const r=await zipOrOne(items,'compressed-gifs.zip');return {...r,info:rep.join(' · ')};}};
