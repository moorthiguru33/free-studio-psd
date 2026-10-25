// Shared media helpers: WebAudio decode, MP3 (lamejs, LGPL-3.0 – loaded unmodified as a separate file) & WAV encode, mediabunny (MPL-2.0) loader
const MB=()=>load('mediabunny.js').then(()=>window.Mediabunny);
const needWC=()=>{if(!('VideoEncoder' in window)||!('VideoDecoder' in window))throw new Error(T.o_noWebCodecs||'Your browser does not support video processing (WebCodecs). Please use a recent Chrome, Edge or Safari 17+.');};
async function decodeAudio(f){const ab=await f.arrayBuffer();const Ctx=window.OfflineAudioContext||window.webkitOfflineAudioContext;const ctx=new Ctx(2,44100,44100);try{return await ctx.decodeAudioData(ab);}catch(e){throw new Error((T.o_noAudio||'Could not read audio from this file.')+' ('+e.message+')');}}
function sliceAudio(buf,start,end,{mono=false,rate=0,fadeIn=0,fadeOut=0,gain=1}={}){const sr=buf.sampleRate;const s0=Math.max(0,Math.floor(start*sr)),s1=Math.min(buf.length,Math.ceil((end||buf.duration)*sr));const n=Math.max(1,s1-s0);const chs=mono||buf.numberOfChannels===1?1:2;
  let data=[];for(let c=0;c<chs;c++){const o=new Float32Array(n);if(chs===1&&buf.numberOfChannels>1){const a=buf.getChannelData(0),b=buf.getChannelData(1);for(let i=0;i<n;i++)o[i]=(a[s0+i]+b[s0+i])/2;}else o.set(buf.getChannelData(c).subarray(s0,s1));data.push(o);}
  const fi=Math.floor(fadeIn*sr),fo=Math.floor(fadeOut*sr);for(const o of data)for(let i=0;i<n;i++){let g=gain;if(i<fi)g*=i/fi;if(i>n-fo)g*=(n-i)/fo;o[i]*=g;}
  let outRate=sr;if(rate&&rate<sr){const k=sr/rate;const m=Math.floor(n/k);data=data.map(o=>{const r=new Float32Array(m);for(let i=0;i<m;i++){const a=Math.floor(i*k),b=Math.min(n,Math.floor((i+1)*k));let s=0;for(let j=a;j<b;j++)s+=o[j];r[i]=s/(b-a||1);}return r;});outRate=rate;}
  return {data,rate:outRate};}
function wavBlob({data,rate}){const ch=data.length,n=data[0].length;const b=new DataView(new ArrayBuffer(44+n*ch*2));const w=(o,s)=>[...s].forEach((c,i)=>b.setUint8(o+i,c.charCodeAt(0)));w(0,'RIFF');b.setUint32(4,36+n*ch*2,true);w(8,'WAVE');w(12,'fmt ');b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,ch,true);b.setUint32(24,rate,true);b.setUint32(28,rate*ch*2,true);b.setUint16(32,ch*2,true);b.setUint16(34,16,true);w(36,'data');b.setUint32(40,n*ch*2,true);
  let p=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){const s=Math.max(-1,Math.min(1,data[c][i]));b.setInt16(p,s<0?s*32768:s*32767,true);p+=2;}return new Blob([b],{type:'audio/wav'});}
async function mp3Blob({data,rate},kbps,status){await load('lame.min.js');const ch=data.length;const LR=[32000,44100,48000,22050,24000,16000,11025,12000,8000];if(!LR.includes(rate)){const r=LR.reduce((a,b)=>Math.abs(b-rate)<Math.abs(a-rate)?b:a);rate=r;}
  const enc=new window.lamejs.Mp3Encoder(ch,rate,kbps);const n=data[0].length;const toI=a=>{const o=new Int16Array(a.length);for(let i=0;i<a.length;i++){const s=Math.max(-1,Math.min(1,a[i]));o[i]=s<0?s*32768:s*32767;}return o;};const L=toI(data[0]),R=ch>1?toI(data[1]):null;const out=[];const B=1152*20;
  for(let i=0;i<n;i+=B){const l=L.subarray(i,i+B);const m=ch>1?enc.encodeBuffer(l,R.subarray(i,i+B)):enc.encodeBuffer(l);if(m.length)out.push(new Uint8Array(m));if(status&&(i/B)%40===0){status(`${T.working} ${Math.round(i/n*100)}%`);await new Promise(r=>setTimeout(r));}}
  const e=enc.flush();if(e.length)out.push(new Uint8Array(e));return new Blob(out,{type:'audio/mpeg'});}
const secs=s=>{s=String(s||'').trim();if(!s)return null;const p=s.split(':').map(Number);if(p.some(isNaN))throw new Error('Invalid time: '+s);return p.reduce((a,b)=>a*60+b,0);};
const fmtT=t=>{const m=Math.floor(t/60),s=(t%60).toFixed(1);return m+':'+(s<10?'0':'')+s;};
function waveform(buf,W=600,H=80){const c=newCanvas0(W,H);const x=c.getContext('2d');x.fillStyle='#e9eef7';x.fillRect(0,0,W,H);x.fillStyle='#1f7ae0';const d=buf.getChannelData(0);const step=Math.ceil(d.length/W);for(let i=0;i<W;i++){let mn=1,mx=-1;for(let j=i*step;j<Math.min(d.length,(i+1)*step);j+=8){const v=d[j];if(v<mn)mn=v;if(v>mx)mx=v;}x.fillRect(i,(1+mn)*H/2,1,Math.max(1,(mx-mn)*H/2));}return c;}
const newCanvas0=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

// Minimal ID3v2.3 writer (title/artist/album/year + optional JPEG/PNG cover)
async function id3Tag({title='',artist='',album='',year='',cover=null}={}){const fr=[];const enc=new TextEncoder();
 const tf=(id,t)=>{if(!t)return;const u=new Uint8Array(1+t.length*2+2);u[0]=1;const b=[0xFF,0xFE];u.set(b,1);for(let i=0;i<t.length;i++){const c=t.charCodeAt(i);u[3+i*2]=c&255;u[4+i*2]=c>>8;}fr.push([id,u.subarray(0,3+t.length*2)]);};
 tf('TIT2',title);tf('TPE1',artist);tf('TALB',album);tf('TYER',year);
 if(cover){const img=new Uint8Array(await cover.arrayBuffer());const mime=enc.encode(cover.type==='image/png'?'image/png':'image/jpeg');const u=new Uint8Array(1+mime.length+1+1+1+img.length);u[0]=0;u.set(mime,1);let o=1+mime.length;u[o++]=0;u[o++]=3;u[o++]=0;u.set(img,o);fr.push(['APIC',u]);}
 if(!fr.length)return null;const size=fr.reduce((a,[,d])=>a+10+d.length,0);const out=new Uint8Array(10+size);out.set([73,68,51,3,0,0],0);const ss=[(size>>21)&127,(size>>14)&127,(size>>7)&127,size&127];out.set(ss,6);let o=10;
 for(const [id,d] of fr){out.set(enc.encode(id),o);const n=d.length;out.set([n>>>24&255,n>>16&255,n>>8&255,n&255,0,0],o+4);out.set(d,o+10);o+=10+n;}return out;}
function joinAudio(a,b){return {rate:a.rate,data:a.data.map((x,i)=>{const y=b.data[i]||b.data[0];const o=new Float32Array(x.length+y.length);o.set(x);o.set(y,x.length);return o;})};}
