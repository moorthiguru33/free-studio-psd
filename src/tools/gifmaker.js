// @needs img
TOOLS.gifmaker={opts:()=>inp('gdelay',T.o_delayMs,'number','500','min="20" max="10000"')+inp('gw',T.o_width,'number','480','min="16" max="1600"')+chk('gloop',T.o_loop,true)+'<label>'+esc(T.o_bg)+'<input id="gbg" type="color" value="#ffffff"></label>',
 async run(files,status){const G=await IL.gifenc();const frames=[];for(const f of files)frames.push(await fileToCanvas(f));const W=Math.round(+v('gw')||480);const H=Math.round(W*frames[0].height/frames[0].width);if(W*H>4e6)throw new Error('Too large');
  const g=G.GIFEncoder();const d=+v('gdelay')||500;
  for(const [i,c] of frames.entries()){status(`${T.working} ${i+1}/${frames.length}`);const o=newCanvas(W,H);const x=o.getContext('2d');x.fillStyle=v('gbg');x.fillRect(0,0,W,H);const s=Math.min(W/c.width,H/c.height);x.imageSmoothingQuality='high';x.drawImage(c,(W-c.width*s)/2,(H-c.height*s)/2,c.width*s,c.height*s);
   const id=x.getImageData(0,0,W,H).data;const pal=G.quantize(id,256);g.writeFrame(G.applyPalette(id,pal),W,H,{palette:pal,delay:d,repeat:vb('gloop')?0:-1});await new Promise(r=>setTimeout(r));}
  g.finish();const blob=new Blob([g.bytes()],{type:'image/gif'});return {blob,name:'animation.gif',info:`${frames.length} frames · ${W}×${H}`,view:`<img src="${URL.createObjectURL(blob)}" alt="GIF" style="max-width:100%;display:block;margin:10px auto">`};}};
