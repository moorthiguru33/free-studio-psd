// @needs txt
// MD5 (RFC 1321), CRC32 + SHA family via Web Crypto. Text or file, all local.
function md5(bytes){const K=new Uint32Array(64),S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296);
 const n=bytes.length,len=((n+8>>>6)+1)*64,m=new Uint8Array(len);m.set(bytes);m[n]=0x80;const dv=new DataView(m.buffer);dv.setUint32(len-8,(n*8)>>>0,true);dv.setUint32(len-4,Math.floor(n/536870912),true);
 let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;const M=new Uint32Array(16);
 for(let off=0;off<len;off+=64){for(let i=0;i<16;i++)M[i]=dv.getUint32(off+i*4,true);let A=a0,B=b0,C=c0,D=d0;
  for(let i=0;i<64;i++){let F,g;if(i<16){F=(B&C)|(~B&D);g=i;}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16;}else if(i<48){F=B^C^D;g=(3*i+5)%16;}else{F=C^(B|~D);g=(7*i)%16;}
   F=(F+A+K[i]+M[g])>>>0;A=D;D=C;C=B;const s=S[(i>>4)*4+(i&3)];B=(B+((F<<s)|(F>>>(32-s))))>>>0;}
  a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0;}
 return [a0,b0,c0,d0].map(x=>[0,8,16,24].map(s=>((x>>>s)&255).toString(16).padStart(2,'0')).join('')).join('');}
let CT;const crc32=b=>{if(!CT){CT=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CT[n]=c>>>0;}}let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CT[(c^b[i])&255]^(c>>>8);return ((c^0xFFFFFFFF)>>>0).toString(16).padStart(8,'0');};
const hx=buf=>[...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function hmac(alg,key,data){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:alg},false,['sign']);return hx(await crypto.subtle.sign('HMAC',k,data));}
TOOLS.hash={live:true,noAdv:true,
 opts:()=>sel('hsrc','Input',[['text','Text'],['file','File']])+inp('hkey','HMAC secret key (optional)','text','')+chk('hup','UPPERCASE hex',false)+inp('hcmp','Compare with expected hash (optional)','text',''),
 setup(){const el=box(area('htext','Text to hash','',6,'Type text…')+`<label class="tl">Or choose a file<input type="file" id="hfile"></label><div id="hout"></div>`);$('#hfile',el).onchange=()=>{$('#hsrc',work).value='file';work.dispatchEvent(new Event('change'));};return el;},
 async run(){let data,label;if(v('hsrc')==='file'){const f=$('#hfile',work).files[0];if(!f)throw soft('Choose a file to hash.');data=new Uint8Array(await f.arrayBuffer());label=f.name+' ('+fmtSize(f.size)+')';}else{data=new TextEncoder().encode(v('htext')||'');label='text ('+data.length+' bytes UTF-8)';}
  const key=v('hkey');const rows=[];if(key){for(const a of ['SHA-1','SHA-256','SHA-384','SHA-512'])rows.push(['HMAC-'+a,await hmac(a,key,data)]);}else{rows.push(['MD5',md5(data)]);for(const a of ['SHA-1','SHA-256','SHA-384','SHA-512'])rows.push([a,hx(await crypto.subtle.digest(a,data))]);rows.push(['CRC32',crc32(data)]);}
  if(vb('hup'))rows.forEach(r=>r[1]=r[1].toUpperCase());const cmp=(v('hcmp')||'').trim().toLowerCase();
  setHTML('hout',`<p class="hint">Hashes of ${esc(label)}</p><table class="kv hashes">${rows.map(([k,h],i)=>`<tr class="${cmp&&h.toLowerCase()===cmp?'match':''}"><th>${k}</th><td><code id="hh${i}">${h}</code></td><td>${copyBtn('hh'+i)}</td></tr>`).join('')}</table>${cmp?`<p class="${rows.some(r=>r[1].toLowerCase()===cmp)?'ok':'bad'}">${rows.some(r=>r[1].toLowerCase()===cmp)?'✓ Match: '+rows.find(r=>r[1].toLowerCase()===cmp)[0]:'✗ No algorithm matches the expected hash'}</p>`:''}`);
  return {...txtOut('hashes.txt',rows.map(r=>r.join(': ')).join('\n')+'\n'),info:rows[0][0]+' '+rows[0][1].slice(0,16)+'…'};}};
