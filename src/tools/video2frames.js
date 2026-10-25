// @needs img media
// Video → image frames (JPG/PNG) as ZIP using mediabunny CanvasSink.
TOOLS.video2frames={
 opts:()=>sel('vfm','Extract',[['int','One frame every N seconds'],['fps','N frames per second'],['count','N evenly spaced frames']])+inp('vfn','N','number','1','min="0.05" step="0.05"')+`<div class="row2">${inp('vfa','Start (m:ss, optional)','text','')}${inp('vfb','End (m:ss, optional)','text','')}</div>`+sel('vfw','Size',[['0','Original resolution'],['1920','1920 px wide'],['1280','1280 px wide'],['640','640 px wide']])+sel('vff','Format',[['jpg','JPG'],['png','PNG'],['webp','WEBP']]),
 async run(files,status){needWC();const M=await MB();const f=files[0];const input=new M.Input({source:new M.BlobSource(f),formats:M.ALL_FORMATS});const vt=await input.getPrimaryVideoTrack();if(!vt)throw new Error('No video track found.');
  const dur=await input.computeDuration();const a=Math.max(0,secs(v('vfa'))||0),b=Math.min(dur,secs(v('vfb'))||dur);if(b<=a)throw new Error('End must be after start.');const n=+v('vfn')||1,m=v('vfm');const ts=[];
  if(m==='int')for(let t=a;t<b;t+=Math.max(.05,n))ts.push(t);else if(m==='fps')for(let t=a;t<b;t+=1/Math.min(60,Math.max(.05,n)))ts.push(t);else{const k=Math.max(1,Math.round(n));for(let i=0;i<k;i++)ts.push(a+(b-a)*(i+.5)/k);}
  if(ts.length>500)throw new Error(`That would create ${ts.length} images – please choose at most 500.`);
  const W0=vt.displayWidth,H0=vt.displayHeight;const W=+v('vfw')&&+v('vfw')<W0?+v('vfw'):W0,H=Math.round(W*H0/W0/2)*2;const sink=new M.CanvasSink(vt,{width:W,height:H,fit:'fill'});const items=[];let i=0;const fmt=v('vff');
  const pad=x=>String(x).padStart(String(ts.length).length,'0');const tl=t=>{const mm=Math.floor(t/60),ss=(t%60).toFixed(2).padStart(5,'0');return `${mm}m${ss}s`;};
  for await(const wc of sink.canvasesAtTimestamps(ts)){const t=ts[i++];if(!wc)continue;items.push({name:`${base(f.name)}-${pad(i)}-${tl(t)}.${fmt}`,blob:await encodeCanvas(wc.canvas,fmt,.9)});status(`Frame ${i}/${ts.length}`);progress(i/ts.length);}
  if(!items.length)throw new Error('No frames could be decoded.');const r=await zipOrOne(items,base(f.name)+'-frames.zip');return {...r,info:`${items.length} frame${items.length>1?'s':''} · ${W}×${H}`};}};
