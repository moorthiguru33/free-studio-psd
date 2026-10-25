// Random name / number picker: cryptographically secure (crypto.getRandomValues), unbiased, unique draws, teams. Offline.
const PKr=n=>{if(n<=1)return 0;const lim=Math.floor(4294967296/n)*n;const a=new Uint32Array(1);do crypto.getRandomValues(a);while(a[0]>=lim);return a[0]%n;};
const PKshuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=PKr(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
TOOLS.picker={live:true,noAdv:true,goLabel:()=>T.download,
 opts(){const V=this.vars||{};const m=V.mode||'names';return sel('pkmode','Pick from',m==='numbers'?[['numbers','A number range'],['names','A list of names / items'],['teams','Split list into teams']]:[['names','A list of names / items'],['numbers','A number range'],['teams','Split list into teams']])+`<label>List (one per line or comma-separated)<textarea id="pklist" rows="7">Alice\nBob\nCharlie\nDiana\nEthan\nFatima\nGeorge\nHana</textarea></label><div class="row2">${inp('pkmin','Min','number','1')}${inp('pkmax','Max','number','100')}</div>`+inp('pkcount','How many to pick / number of teams','number','1','min="1" max="1000"')+chk('pkuniq','No repeats',true);},
 setup(){const el=document.createElement('div');el.innerHTML='<div id="pkout" class="ubig" style="font-size:1.6em;min-height:2em;text-align:center"></div><p style="text-align:center"><button type="button" class="btn" id="pkgo">🎲 Pick again</button></p><p class="hint" id="pkinfo" style="text-align:center"></p>';
  $('#pkgo',el).onclick=()=>{this.seed++;$('#pkcount',work).dispatchEvent(new Event('input',{bubbles:true}));};return el;},seed:0,
 run(){const mode=v('pkmode'),n=Math.max(1,Math.min(1000,parseInt(v('pkcount'))||1)),uniq=vb('pkuniq');const soft=m=>{throw Object.assign(new Error(m),{soft:true});};let out,lines;
  $('#pklist',work).closest('label').hidden=mode==='numbers';$('#pkmin',work).closest('.row2').hidden=mode!=='numbers';
  if(mode==='numbers'){const a=Math.ceil(+v('pkmin')),b=Math.floor(+v('pkmax'));if(!(b>=a))soft('Max must be at least Min');const span=b-a+1;if(uniq&&n>span)soft(`Only ${span} numbers in that range`);
   const got=new Set(),res=[];while(res.length<n){const x=a+(span>4294967295?Math.floor(Math.random()*span):PKr(span));if(uniq){if(got.has(x))continue;got.add(x);}res.push(x);}out=res.map(String);lines=out;}
  else{const items=(v('pklist')||'').split(/\n|,/).map(s=>s.trim()).filter(Boolean);if(!items.length)soft('Add at least one name');
   if(mode==='teams'){const k=Math.min(n,items.length);const sh=PKshuf(items);const teams=Array.from({length:k},()=>[]);sh.forEach((x,i)=>teams[i%k].push(x));out=teams.map((t,i)=>`Team ${i+1}: ${t.join(', ')}`);lines=out;}
   else{if(uniq&&n>items.length)soft(`Only ${items.length} items in the list`);out=uniq?PKshuf(items).slice(0,n):Array.from({length:n},()=>items[PKr(items.length)]);lines=out;}}
  const o=$('#pkout',work);o.innerHTML=out.map(x=>`<div>${esc(x)}</div>`).join('');o.style.fontSize=out.length>3?'1.1em':'1.6em';$('#pkinfo',work).textContent=`Picked at ${new Date().toLocaleTimeString()} with a cryptographically secure random generator.`;
  return {blob:new Blob([lines.join('\n')+'\n'],{type:'text/plain'}),name:'random-pick.txt',info:out.slice(0,5).join(', ')};}};
