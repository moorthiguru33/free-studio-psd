// @needs media
// Change audio speed and/or pitch. Time-stretch with WSOLA (keeps pitch), pitch shift = stretch + resample.
function wsola(x,rate,N=2048){if(Math.abs(rate-1)<1e-4)return x.slice();const Ha=Math.round(N/4*rate),Hs=N/4,tol=Math.round(N/8);const outLen=Math.ceil(x.length/rate)+N;const y=new Float32Array(outLen),wsum=new Float32Array(outLen);const w=new Float32Array(N);for(let i=0;i<N;i++)w[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);
 let prev=0;for(let k=0,ps=0;;k++){const ia=k*Ha,os=k*Hs;if(ia+N+tol>=x.length||os+N>=outLen)break;let best=0;if(k>0){let bc=-Infinity;const nat=prev+Hs;for(let d=-tol;d<=tol;d+=4){const s=ia+d;if(s<0)continue;let c=0;for(let i=0;i<N/2;i+=4)c+=x[s+i]*x[nat+i];if(c>bc){bc=c;best=d;}}}
  const s=Math.max(0,ia+best);for(let i=0;i<N;i++){y[os+i]+=x[s+i]*w[i];wsum[os+i]+=w[i];}prev=s;}
 const n=Math.ceil(x.length/rate);const o=new Float32Array(n);for(let i=0;i<n;i++)o[i]=wsum[i]>1e-3?y[i]/wsum[i]:0;return o;}
function resample(x,f){const n=Math.floor(x.length/f);const o=new Float32Array(n);for(let i=0;i<n;i++){const p=i*f,j=Math.floor(p),t=p-j;o[i]=(x[j]||0)*(1-t)+(x[j+1]||0)*t;}return o;}
TOOLS.audiospeed={
 opts:()=>inp('asr','Speed (0.25–4×)','number','1.25','min="0.25" max="4" step="0.05"')+inp('asp','Pitch (semitones, −12 to +12)','number','0','min="-12" max="12" step="0.5"')+chk('askeep','Keep original pitch when changing speed',true)+sel('asf','Format',[['mp3','MP3 192 kbps'],['wav','WAV (lossless)']]),
 async run(files,status){const f=files[0];status('Decoding audio…');const b=await decodeAudio(f);let rate=Math.min(4,Math.max(.25,+v('asr')||1));const semi=Math.max(-12,Math.min(12,+v('asp')||0));const keep=vb('askeep');
  const pf=Math.pow(2,semi/12);const data=[];for(let c=0;c<b.numberOfChannels;c++){status(`Processing channel ${c+1}/${b.numberOfChannels}…`);await new Promise(r=>setTimeout(r));let x=b.getChannelData(c);
   if(keep){x=wsola(x,rate/pf);if(pf!==1)x=resample(x,pf);}else{x=resample(x,rate);if(pf!==1){x=wsola(x,1/pf);x=resample(x,pf);}}data.push(x);}
  const n=Math.min(...data.map(d=>d.length));const out={data:data.map(d=>d.subarray(0,n)),rate:b.sampleRate};const tag=`-${rate}x${semi?(semi>0?'+':'')+semi+'st':''}`;
  const blob=v('asf')==='wav'?wavBlob(out):await mp3Blob(out,192,status);return {name:base(f.name)+tag+'.'+v('asf'),blob,info:`${fmtT(b.duration)} → ${fmtT(n/b.sampleRate)} · speed ${rate}× · pitch ${semi>0?'+':''}${semi} semitones`};}};
