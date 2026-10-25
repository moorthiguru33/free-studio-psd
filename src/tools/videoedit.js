// @needs media
// Video trim / crop / compress / mute / convert using mediabunny (MPL-2.0) + browser WebCodecs. Output MP4 (H.264/AAC) or WebM.
const VQ=()=>({vhigh:Mediabunny.QUALITY_HIGH,vmed:Mediabunny.QUALITY_MEDIUM,vlow:Mediabunny.QUALITY_LOW,vvlow:Mediabunny.QUALITY_VERY_LOW});
TOOLS.videoedit={opts(){const m=this.vars.mode||'trim';let h='';
  if(m==='trim')h+=`<div class="row2">${inp('vstart',T.o_start||'Start (m:ss)','text','0:00')}${inp('vend',T.o_end||'End (m:ss)','text','')}</div>`;
  if(m==='crop')h+=sel('vcrop',T.o_cropTo||'Crop to',[['1:1','1:1 '+(T.o_square||'square')],['9:16','9:16 (Reels/Shorts/TikTok)'],['16:9','16:9'],['4:5','4:5 (Instagram)'],['4:3','4:3']]);
  h+=sel('vqual',T.o_quality||'Quality',m==='compress'?[['vmed',T.o_vMed||'Recommended (smaller)'],['vlow',T.o_vLow||'Strong compression'],['vvlow',T.o_vVlow||'Extreme (smallest)'],['vhigh',T.o_vHigh||'High quality']]:[['vhigh',T.o_vHigh||'High quality'],['vmed',T.o_vMed||'Recommended (smaller)'],['vlow',T.o_vLow||'Strong compression']]);
  h+=sel('vwidth',T.o_resolution||'Resolution',m==='compress'?[['1280','720p'],['0',T.o_keep||'Keep'],['854','480p'],['1920','1080p']]:[['0',T.o_keep||'Keep'],['1920','1080p'],['1280','720p'],['854','480p']]);
  h+=sel('vaudio',T.o_audio||'Sound',m==='mute'?[['drop',T.o_mute||'Remove sound']]:[['keep',T.o_keep||'Keep'],['drop',T.o_mute||'Remove sound']]);
  {const F=[['mp4','MP4 (H.264/AAC)'],['webm','WebM (VP9/Opus)'],['mov','MOV (QuickTime)'],['mkv','MKV (Matroska)']];const to=this.vars.to||'mp4';h+=sel('vfmt',T.o_format||'Format',F.sort((a,b)=>(b[0]===to)-(a[0]===to)));}return h;},
 async setup(files){const box=$('.custom',work);if(!box||(this.vars.mode||'trim')==='convert')return;const vid=document.createElement('video');vid.controls=true;vid.muted=true;vid.playsInline=true;vid.src=URL.createObjectURL(files[0]);vid.style.cssText='width:100%;max-height:50vh;border-radius:10px;background:#000';box.innerHTML='';box.append(vid);
  if((this.vars.mode||'trim')==='trim'){const b=document.createElement('div');b.className='row2';b.innerHTML=`<button type="button" class="btn ghost mini" id="setS">⏮ ${esc(T.o_setStart||'Set start here')}</button><button type="button" class="btn ghost mini" id="setE">⏭ ${esc(T.o_setEnd||'Set end here')}</button>`;box.append(b);
   vid.addEventListener('loadedmetadata',()=>{if(!v('vend'))$('#vend').value=fmtT(vid.duration);});$('#setS',b).onclick=()=>$('#vstart').value=fmtT(vid.currentTime);$('#setE',b).onclick=()=>$('#vend').value=fmtT(vid.currentTime);}},
 async run(files,status){needWC();const M=await MB();const m=this.vars.mode||'trim';const items=[];
  for(const [i,f] of files.entries()){const input=new M.Input({source:new M.BlobSource(f),formats:M.ALL_FORMATS});const vt=await input.getPrimaryVideoTrack();if(!vt)throw new Error(T.o_noVideo||'No video track found in this file.');
   const fmt=v('vfmt');const output=new M.Output({format:fmt==='webm'?new M.WebMOutputFormat():fmt==='mkv'?new M.MkvOutputFormat():fmt==='mov'?new M.MovOutputFormat({fastStart:'in-memory'}):new M.Mp4OutputFormat({fastStart:'in-memory'}),target:new M.BufferTarget()});
   const W=vt.displayWidth,H=vt.displayHeight;const video={bitrate:VQ()[v('vqual')]||M.QUALITY_HIGH,forceTranscode:(m!=='trim'&&m!=='convert')||v('vqual')!=='vhigh'||+v('vwidth')>0||fmt==='webm'};
   if(fmt==='webm')video.codec='vp9';else if(fmt!=='mkv')video.codec='avc';
   const tw=+v('vwidth');if(m==='crop'){const [a,b]=v('vcrop').split(':').map(Number);let cw=W,ch=Math.round(W*b/a);if(ch>H){ch=H;cw=Math.round(H*a/b);}cw-=cw%2;ch-=ch%2;video.crop={left:Math.round((W-cw)/2),top:Math.round((H-ch)/2),width:cw,height:ch};if(tw&&tw<cw){video.width=tw-tw%2;video.fit='contain';}}
   else if(tw&&tw<W){video.width=tw;video.height=Math.round(H*tw/W/2)*2;video.fit='contain';}
   const opt={input,output,video,audio:v('vaudio')==='drop'?{discard:true}:(fmt==='webm'?{codec:'opus'}:fmt==='mkv'||((await input.getPrimaryAudioTrack())||{}).codec==='aac'?{}:{codec:(await M.canEncodeAudio('aac').catch(()=>false))?'aac':'opus'})};
   if(m==='trim'){const a=secs(v('vstart'))||0,b=secs(v('vend'));if(b!=null&&!(b>a))throw new Error(T.o_badRange||'End must be after start.');opt.trim={start:a,...(b!=null?{end:b}:{})};}
   const conv=await M.Conversion.init(opt);if(!conv.isValid)throw new Error((T.o_noCodec||'This browser cannot encode this video.')+' '+conv.discardedTracks.map(d=>d.reason).join(', '));
   conv.onProgress=p=>status(`${T.working} ${files.length>1?`${i+1}/${files.length} · `:''}${Math.round(p*100)}%`);await conv.execute();
   const blob=new Blob([output.target.buffer],{type:{webm:'video/webm',mkv:'video/x-matroska',mov:'video/quicktime'}[fmt]||'video/mp4'});items.push({blob,name:base(f.name)+(m==='convert'?'':'-'+m)+'.'+fmt,info:`${W}×${H} → ${video.crop?video.crop.width+'×'+video.crop.height:video.width?video.width+'×'+video.height:W+'×'+H}`});}
  const r=await zipOrOne(items,'videos.zip');if(items.length===1)r.view=`<video controls playsinline src="${URL.createObjectURL(items[0].blob)}" style="width:100%;max-height:60vh;margin-top:10px;border-radius:10px;background:#000"></video>`;return r;}};
