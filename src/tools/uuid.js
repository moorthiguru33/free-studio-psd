// @needs txt
const hex=b=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const fmt=h=>`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
const v4=()=>{const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;return fmt(hex(b));};
const v7=()=>{const b=crypto.getRandomValues(new Uint8Array(16));let t=Date.now();for(let i=5;i>=0;i--){b[i]=t%256;t=Math.floor(t/256);}b[6]=b[6]&15|112;b[8]=b[8]&63|128;return fmt(hex(b));};
TOOLS.uuid={live:true,noAdv:true,
 opts:()=>sel('uuver','Version',[['4','UUID v4 (random)'],['7','UUID v7 (time-ordered)'],['nil','Nil UUID']])+inp('uun','How many','number','10','min="1" max="1000"')+chk('uuup','UPPERCASE',false)+chk('uuhy','Include hyphens',true)+chk('uubr','Wrap in braces {…}',false),
 setup(){const el=box(`<label class="tl">UUIDs ${copyBtn('uuout','Copy all')}<textarea id="uuout" rows="12" readonly style="font-family:monospace"></textarea></label><p style="text-align:center"><button type="button" class="btn ghost" id="uure">🔄 Generate new</button></p>`);$('#uure',el).onclick=()=>work.dispatchEvent(new Event('change'));return el;},
 run(){const n=Math.max(1,Math.min(1000,+v('uun')||10));const g=v('uuver')==='7'?v7:v('uuver')==='nil'?()=>'00000000-0000-0000-0000-000000000000':v4;
  const list=Array.from({length:n},()=>{let u=g();if(!vb('uuhy'))u=u.replace(/-/g,'');if(vb('uuup'))u=u.toUpperCase();if(vb('uubr'))u='{'+u+'}';return u;});
  const out=list.join('\n');$('#uuout',work).value=out;return {...txtOut('uuids.txt',out+'\n'),info:`${n} UUID${n>1?'s':''} generated`};}};
