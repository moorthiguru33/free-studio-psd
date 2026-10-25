// @needs txt
const enc=(s,url)=>{const b=new TextEncoder().encode(s);let bin='';for(let i=0;i<b.length;i+=32768)bin+=String.fromCharCode(...b.subarray(i,i+32768));let r=btoa(bin);if(url)r=r.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return r;};
const dec=s=>{s=s.replace(/^data:[^,]*,/,'').replace(/\s/g,'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);const b=Uint8Array.from(bin,c=>c.charCodeAt(0));return {bytes:b,text:new TextDecoder('utf-8',{fatal:false}).decode(b)};};
TOOLS.base64={live:true,noAdv:true,
 opts:()=>sel('b6mode','Mode',[['enc','Encode text → Base64'],['dec','Decode Base64 → text']])+chk('b6url','URL-safe alphabet (- _ , no padding)',false)+chk('b6line','Encode each line separately',false),
 setup(){return box(area('b6in','Input','',8,'Hello, world!')+`<label class="tl">Output ${copyBtn('b6out')}<textarea id="b6out" rows="8" readonly></textarea></label><p class="hint">To convert a file or image, use <a href="/image-to-base64/">Image to Base64</a>.</p>`);},
 run(){const s=v('b6in')||'';let out;try{if(v('b6mode')==='enc')out=vb('b6line')?s.split('\n').map(l=>enc(l,vb('b6url'))).join('\n'):enc(s,vb('b6url'));else{const r=vb('b6line')?s.split('\n').map(l=>dec(l).text).join('\n'):dec(s).text;out=r;}}catch(e){$('#b6out',work).value='';throw soft('Not valid Base64: '+e.message);}
  $('#b6out',work).value=out;return {...txtOut(v('b6mode')==='enc'?'base64.txt':'decoded.txt',out),info:`${[...s].length} → ${[...out].length} characters`};}};
