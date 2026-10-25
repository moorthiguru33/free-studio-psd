// Roman numeral converter: both directions, strict validation (standard subtractive form), 1–3,999,999 with vinculum (overline) for thousands.
const RN=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
const toRom=n=>{let s='';for(const [a,r] of RN)while(n>=a){s+=r;n-=a;}return s;};
const OL='\u0305';const toRomBig=n=>{if(n<4000)return toRom(n);const hi=Math.floor(n/1000),lo=n%1000;return toRom(hi).split('').map(c=>c+OL).join('')+toRom(lo);};
const fromRom=s=>{s=s.toUpperCase().replace(/\s/g,'');let total=0;const parts=s.split(/(?<=\u0305)(?=[^\u0305]*$)/);let hi='',lo=s;if(s.includes(OL)){const i=s.lastIndexOf(OL);hi=s.slice(0,i+1).replace(/\u0305/g,'');lo=s.slice(i+1);}
 const one=x=>{if(!x)return 0;if(!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(x))return NaN;const val={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let t=0;for(let i=0;i<x.length;i++){const a=val[x[i]],b=val[x[i+1]]||0;t+=a<b?-a:a;}return t;};
 total=one(hi)*1000+one(lo);return total;};
TOOLS.roman={live:true,noAdv:true,goLabel:()=>T.download,
 opts:()=>inp('rmval','Number or Roman numeral','text','2026','autocomplete="off" autocapitalize="characters"')+chk('rmlow','Show lower case (for page numbers: xiv)',false),
 setup(){const el=document.createElement('div');el.innerHTML='<p class="ubig" id="rmbig" style="font-size:1.6em"></p><p class="hint" id="rmhow"></p><table class="dtab" id="rmtab" style="width:100%"></table>';return el;},
 run(){const raw=(v('rmval')||'').trim();const low=vb('rmlow');let n,r;const soft=m=>{const e=new Error(m);e.soft=true;throw e;};
  if(/^\d[\d,\s]*$/.test(raw)){n=parseInt(raw.replace(/[,\s]/g,''),10);if(!(n>=1&&n<=3999999))soft('Roman numerals cover 1 to 3,999,999 (there is no zero).');r=toRomBig(n);}
  else if(/^[IVXLCDM\u0305\s]+$/i.test(raw)){n=fromRom(raw);if(!n)soft('“'+raw+'” is not a valid Roman numeral in standard form (e.g. IV not IIII, XC not LXXXX).');r=toRomBig(n);}else soft('Type a whole number (e.g. 1994) or Roman numerals (e.g. MCMXCIV).');
  const out=low?r.toLowerCase():r;const breakdown=[];let k=n%4000>=0&&n<4000?n:n%1000;for(const [a,s] of RN){while(k>=a){breakdown.push(`${s} = ${a}`);k-=a;}}
  $('#rmbig',work).textContent=`${n.toLocaleString('en')} = ${out}`;$('#rmhow',work).textContent=(n>=4000?`${Math.floor(n/1000)} × 1,000 (overlined) + `:'')+breakdown.join(' + ');
  const near=[n-1,n+1,Math.round(n/10)*10||10,2000+new Date().getFullYear()%1000].filter((x,i,a)=>x>=1&&x<=3999999&&x!==n&&a.indexOf(x)===i);$('#rmtab',work).innerHTML=near.map(x=>`<tr><td>${x.toLocaleString('en')}</td><td><b>${esc(low?toRomBig(x).toLowerCase():toRomBig(x))}</b></td></tr>`).join('');
  return {blob:new Blob([`${n} = ${out}\n${breakdown.join(' + ')}\n`],{type:'text/plain'}),name:'roman-numeral.txt',info:`${n} = ${out}`};}};
