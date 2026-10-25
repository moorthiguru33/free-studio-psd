// @needs txt
const P={of:['What is X% of Y?','X (%)','Y',(x,y)=>[x/100*y,`${nf(x)}% of ${nf(y)} = ${nf(x/100*y,4)}`]],
 is:['X is what % of Y?','X','Y',(x,y)=>[x/y*100,`${nf(x)} is ${nf(x/y*100,4)}% of ${nf(y)}`]],
 chg:['% change from X to Y','From (X)','To (Y)',(x,y)=>{const p=(y-x)/Math.abs(x)*100;return [p,`From ${nf(x)} to ${nf(y)} is a ${p>=0?'increase':'decrease'} of ${nf(Math.abs(p),4)}%`];}],
 inc:['Increase X by Y%','Value (X)','Increase (%)',(x,y)=>[x*(1+y/100),`${nf(x)} + ${nf(y)}% = ${nf(x*(1+y/100),4)}`]],
 dec:['Decrease X by Y%','Value (X)','Decrease (%)',(x,y)=>[x*(1-y/100),`${nf(x)} − ${nf(y)}% = ${nf(x*(1-y/100),4)}`]],
 rev:['X is Y% of what?','X','Y (%)',(x,y)=>[x/(y/100),`${nf(x)} is ${nf(y)}% of ${nf(x/(y/100),4)}`]],
 diff:['% difference between X and Y','X','Y',(x,y)=>{const p=Math.abs(x-y)/((x+y)/2)*100;return [p,`Percentage difference between ${nf(x)} and ${nf(y)} = ${nf(p,4)}%`];}],
 pp:['Percentage points from X% to Y%','From (%)','To (%)',(x,y)=>[y-x,`${nf(x)}% → ${nf(y)}% is ${nf(y-x,4)} percentage points (${nf((y-x)/x*100,2)}% relative change)`]]};
TOOLS.percent={live:true,noAdv:true,
 opts:()=>sel('pcm','Calculation',Object.entries(P).map(([k,a])=>[k,a[0]]))+inp('pcx','X','text','15','inputmode="decimal"')+inp('pcy','Y','text','80','inputmode="decimal"'),
 setup(){const el=box(`<div id="pcout" class="bigres"></div><div id="pcall"></div>`);if(!this.b){this.b=1;work.addEventListener('change',e=>{if(e.target.id==='pcm'){const a=P[e.target.value];$('#pcx',work).previousSibling.textContent=a[1];$('#pcy',work).previousSibling.textContent=a[2];}});}return el;},
 run(){const x=num('pcx'),y=num('pcy');const m=v('pcm');const a=P[m];$('#pcx',work).previousSibling.textContent=a[1];$('#pcy',work).previousSibling.textContent=a[2];if(!Number.isFinite(x)||!Number.isFinite(y))throw soft('Enter two numbers.');
  const [r,txt]=a[3](x,y);if(!Number.isFinite(r))throw soft('Cannot divide by zero.');setHTML('pcout',`<b>${esc(txt)}</b>`);
  const all=Object.entries(P).filter(([k])=>k!==m).map(([k,b])=>{const [q,t]=b[3](x,y);return Number.isFinite(q)?`<li>${esc(t)}</li>`:'';}).join('');setHTML('pcall',`<h2 class="h3">Same numbers, other questions</h2><ul>${all}</ul>`);
  return {...txtOut('percentage.txt',txt+'\n'),info:txt};}};
