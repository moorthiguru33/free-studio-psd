// @needs media
// Audio joiner: merge MP3, WAV, M4A, OGG, FLAC… (and video soundtracks) in upload order, optional crossfade or gap, normalised loudness, MP3 or WAV output. All decoding/encoding happens in the browser.
TOOLS.audiojoin={noAdv:true,
 opts:()=>sel('ajmode','Between tracks',[['0','Join directly'],['cf2','Crossfade 2 s'],['cf5','Crossfade 5 s'],['g1','1 s silence'],['g3','3 s silence']])+chk('ajnorm','Even out loudness between tracks',true)+sel('aofmt','Format',[['mp3','MP3'],['wav','WAV (lossless)']])+sel('akbps','MP3 quality',[['192','192 kbps'],['128','128 kbps'],['320','320 kbps']]),
 async run(files,status){if(files.length<2)throw new Error('Add at least two audio files to join.');const bufs=[];for(const [i,f] of files.entries()){status(`${T.working} – reading ${i+1}/${files.length}`);bufs.push(await decodeAudio(f));}
  const rate=bufs[0].sampleRate,m=v('ajmode'),cf=m.startsWith('cf')?+m.slice(2):0,gap=m.startsWith('g')?+m.slice(1):0;const chs=Math.max(...bufs.map(b=>b.numberOfChannels))>1?2:1;
  const rms=b=>{const d=b.getChannelData(0);let s=0,n=0;for(let i=0;i<d.length;i+=16){s+=d[i]*d[i];n++;}return Math.sqrt(s/Math.max(1,n))||1e-4;};const target=vb('ajnorm')?bufs.map(rms).reduce((a,b)=>a+b,0)/bufs.length:0;
  const cfN=Math.floor(cf*rate),gapN=Math.floor(gap*rate);let total=0;bufs.forEach((b,i)=>{total+=b.length;if(i)total+=gapN-Math.min(cfN,b.length,bufs[i-1].length);});const data=Array.from({length:chs},()=>new Float32Array(total));let pos=0;
  bufs.forEach((b,i)=>{const g=target?Math.min(4,target/rms(b)):1;const ov=i?Math.min(cfN,b.length,bufs[i-1].length):0;if(i)pos+=gapN-ov;for(let c=0;c<chs;c++){const src=b.getChannelData(Math.min(c,b.numberOfChannels-1)),dst=data[c];for(let k=0;k<b.length;k++){let x=src[k]*g;if(k<ov)x*=k/ov;const j=pos+k;if(j<total)dst[j]+=x;}
   if(i<bufs.length-1){const nov=Math.min(cfN,b.length,bufs[i+1].length);for(let k=b.length-nov;k<b.length;k++)dst[pos+k]-=src[k]*g*(1-(b.length-k)/nov);}}pos+=b.length;status(`${T.working} – mixing ${i+1}/${bufs.length}`);});
  for(const d of data)for(let k=0;k<d.length;k++){if(d[k]>1)d[k]=1;else if(d[k]<-1)d[k]=-1;}
  const fmt=v('aofmt');const s={data,rate};const blob=fmt==='wav'?wavBlob(s):await mp3Blob(s,+v('akbps')||192,status);const dur=total/rate;
  return {blob,name:`joined-${files.length}-tracks.${fmt}`,info:`${files.length} tracks · ${fmtT(dur)}`,view:`<audio controls src="${URL.createObjectURL(blob)}" style="width:100%;margin-top:10px"></audio>`};}};
