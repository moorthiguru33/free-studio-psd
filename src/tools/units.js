// Unit converter: exact factors (SI/NIST), temperatures via offset formulas, Indian number system. Live, nothing leaves the device.
const U={
 length:{m:1,km:1e3,cm:.01,mm:.001,'µm':1e-6,mi:1609.344,yd:.9144,ft:.3048,in:.0254,nmi:1852},
 mass:{kg:1,g:.001,mg:1e-6,t:1000,lb:.45359237,oz:.028349523125,st:6.35029318,tola:.01166381,quintal:100},
 temp:{'°C':1,'°F':1,K:1},
 area:{'m²':1,'km²':1e6,'cm²':1e-4,ha:1e4,acre:4046.8564224,'ft²':.09290304,'yd²':.83612736,'in²':.00064516,'mi²':2589988.110336,cent:40.468564224,ground:222.967},
 volume:{L:1,mL:.001,'m³':1000,'gal (US)':3.785411784,'gal (UK)':4.54609,'qt (US)':.946352946,'pt (US)':.473176473,'cup (US)':.2365882365,'fl oz (US)':.0295735295625,tbsp:.01478676478125,tsp:.00492892159375,'ft³':28.316846592},
 speed:{'km/h':1/3.6,'m/s':1,mph:.44704,kn:1852/3600,'ft/s':.3048},
 time:{s:1,ms:.001,min:60,h:3600,day:86400,week:604800,month:2629746,year:31556952},
 data:{B:1,KB:1e3,MB:1e6,GB:1e9,TB:1e12,KiB:1024,MiB:1048576,GiB:1073741824,TiB:1099511627776,bit:.125,Mbit:125000,Gbit:1.25e8},
 pressure:{Pa:1,kPa:1e3,bar:1e5,atm:101325,psi:6894.757293168,mmHg:133.322387415},
 energy:{J:1,kJ:1e3,cal:4.184,kcal:4184,Wh:3600,kWh:3.6e6,BTU:1055.05585262,eV:1.602176634e-19},
 number:{one:1,thousand:1e3,lakh:1e5,million:1e6,crore:1e7,billion:1e9,arab:1e9,trillion:1e12,kharab:1e11}};
const toK=(x,u)=>u==='°C'?x+273.15:u==='°F'?(x-32)*5/9+273.15:x;const fromK=(k,u)=>u==='°C'?k-273.15:u==='°F'?(k-273.15)*9/5+32:k;
const conv=(cat,x,a,b)=>cat==='temp'?fromK(toK(x,a),b):x*U[cat][a]/U[cat][b];
const nf=x=>{if(!isFinite(x))return '—';const a=Math.abs(x);if(a!==0&&(a<1e-6||a>=1e15))return x.toExponential(6).replace(/\.?0+e/,'e');return (+x.toPrecision(10)).toLocaleString(document.documentElement.lang==='en'?'en-US':'en-IN',{maximumFractionDigits:8});};
const frac16=x=>{const s=x<0?'−':'';x=Math.abs(x);let w=Math.floor(x),n=Math.round((x-w)*16);if(n===16){w++;n=0;}if(!n)return s+w;let d=16;while(n%2===0){n/=2;d/=2;}return s+(w?w+' ':'')+n+'/'+d;};
function uExtra(c,x,a,b,r){const L=[];const f=U[c]&&U[c][a]&&U[c][b]&&c!=='temp'?U[c][a]/U[c][b]:null;
 if(c==='temp'){const k=toK(x,a);if(a==='°C'&&b==='°F')L.push(`°F = °C × 9/5 + 32 = ${nf(x)} × 1.8 + 32 = ${nf(r)}`);else if(a==='°F'&&b==='°C')L.push(`°C = (°F − 32) × 5/9 = (${nf(x)} − 32) ÷ 1.8 = ${nf(r)}`);L.push(`= ${nf(k)} K`);if(a!=='°C'&&b!=='°C')L.push(`= ${nf(fromK(k,'°C'))} °C`);if(a!=='°F'&&b!=='°F')L.push(`= ${nf(fromK(k,'°F'))} °F`);}
 else if(f)L.push(`${T.o_formula||'Formula'}: ${b} = ${a} × ${nf(f)}  →  ${nf(x)} × ${nf(f)} = ${nf(r)}`);
 if(c==='length'){const inch=x*U.length[a]/U.length.in;if(['in','ft','cm','mm','m'].includes(b)||['in','ft'].includes(a)){L.push(`≈ ${frac16(inch)} in (${T.o_nearest16||'nearest 1/16'})`);if(Math.abs(inch)>=12){const ft=Math.trunc(inch/12);L.push(`= ${ft} ft ${frac16(Math.abs(inch-ft*12))} in`);}}}
 if(c==='mass'){const lb=x*U.mass[a]/U.mass.lb;if(['lb','kg','st','oz'].includes(b)||['lb','st'].includes(a)){const w=Math.trunc(lb);L.push(`= ${w} lb ${nf(+(Math.abs(lb-w)*16).toFixed(1))} oz`);if(Math.abs(lb)>=14){const st=Math.trunc(lb/14);L.push(`= ${st} st ${nf(+(Math.abs(lb-st*14)).toFixed(1))} lb`);}}}
 return L.join('\n');}
TOOLS.units={live:true,noAdv:true,goLabel:()=>T.download,
 opts(){const V=this.vars||{};const cat=V.cat||'length';const cats=Object.keys(U);const ks=Object.keys(U[cat]);const o=(arr,d)=>arr.map(k=>[k,k]).sort((x,y)=>(y[0]===d)-(x[0]===d));
  return sel('ucat',T.o_ucat||'Category',cats.map(c=>[c,T['u_'+c]||c]).sort((x,y)=>(y[0]===cat)-(x[0]===cat)))+inp('uval',T.o_value||'Value','number',V.val||'1','step="any" inputmode="decimal"')+`<div class="row2">${sel('ufrom',T.o_from||'From',o(ks,V.from||ks[0]))}${sel('uto',T.o_to||'To',o(ks,V.to||ks[1]))}</div><button type="button" class="btn ghost mini" id="uswap">⇄ ${esc(T.o_swap||'Swap')}</button>`;},
 setup(){const el=document.createElement('div');el.innerHTML='<p class="ubig" id="ubig"></p><p class="hint" id="uextra" style="white-space:pre-line"></p><table class="dtab" id="utab" style="width:100%"></table>';
  const fill=()=>{const c=v('ucat');for(const id of ['ufrom','uto']){const s=$('#'+id);if(!s||s.dataset.cat===c)continue;const ks=Object.keys(U[c]);const keep=s.value;s.innerHTML=ks.map(k=>`<option>${esc(k)}</option>`).join('');s.value=ks.includes(keep)?keep:(id==='uto'?ks[1]:ks[0]);s.dataset.cat=c;}};
  setTimeout(()=>{$('#ucat')?.addEventListener('change',()=>{fill();});$('#uswap')?.addEventListener('click',()=>{const a=$('#ufrom'),b=$('#uto');[a.value,b.value]=[b.value,a.value];a.dispatchEvent(new Event('change',{bubbles:true}));});['ufrom','uto'].forEach(id=>$('#'+id).dataset.cat=v('ucat'));});return el;},
 run(){const c=v('ucat'),x=parseFloat(v('uval')),a=v('ufrom'),b=v('uto');if(!U[c][a]||!U[c][b]){const e=new Error('…');e.soft=true;throw e;}if(isNaN(x)){const e=new Error(T.o_enterValue||'Enter a number');e.soft=true;throw e;}
  const r=conv(c,x,a,b);const line=`${nf(x)} ${a} = ${nf(r)} ${b}`;const big=$('#ubig');if(big)big.textContent=line;const ex=$('#uextra');const xt=uExtra(c,x,a,b,r);if(ex)ex.textContent=xt;
  const rows=Object.keys(U[c]).filter(k=>k!==a).map(k=>[k,nf(conv(c,x,a,k))]);const tb=$('#utab');if(tb)tb.innerHTML=rows.map(([k,y])=>`<tr><td>${esc(y)}</td><td><b>${esc(k)}</b></td></tr>`).join('');
  const txt=line+'\n'+xt+'\n\n'+rows.map(([k,y])=>`${nf(x)} ${a} = ${y} ${k}`).join('\n')+'\n';return {blob:new Blob([txt],{type:'text/plain'}),name:`${c}-conversion.txt`,info:line};}};
