// Password generator (crypto.getRandomValues, unbiased) – nothing leaves the device
const CS={lower:'abcdefghijklmnopqrstuvwxyz',upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',digits:'0123456789',symbols:'!@#$%^&*()-_=+[]{};:,.?/~'};
const rnd=n=>{const lim=Math.floor(4294967296/n)*n;const a=new Uint32Array(1);do crypto.getRandomValues(a);while(a[0]>=lim);return a[0]%n;};
TOOLS.passgen={live:true,goLabel:()=>T.o_pgDownload,
 opts:()=>inp('pglen',T.o_pgLength,'number','16','min="4" max="128"')+inp('pgcount',T.o_pgCount,'number','5','min="1" max="100"')+chk('pglower','a-z',true)+chk('pgupper','A-Z',true)+chk('pgdigits','0-9',true)+chk('pgsym','!@#$…',true)+chk('pgsim',T.o_pgSimilar,true),
 gen(){let pools=[['pglower','lower'],['pgupper','upper'],['pgdigits','digits'],['pgsym','symbols']].filter(([id])=>vb(id)).map(([,k])=>CS[k]);if(vb('pgsim'))pools=pools.map(p=>p.replace(/[Il1O0o|]/g,''));if(!pools.length)throw new Error(T.o_pgNone);
  const len=Math.max(4,Math.min(128,+v('pglen')||16));const all=pools.join('');const one=()=>{const c=pools.map(p=>p[rnd(p.length)]);while(c.length<len)c.push(all[rnd(all.length)]);for(let i=c.length-1;i>0;i--){const j=rnd(i+1);[c[i],c[j]]=[c[j],c[i]];}return c.slice(0,len).join('');};
  const n=Math.max(1,Math.min(100,+v('pgcount')||5));return {list:Array.from({length:n},one),bits:Math.round(len*Math.log2(all.length))};},
 setup(){const el=document.createElement('div');el.innerHTML='<ul class="links" id="pglist" style="font-family:monospace;font-size:1.05em"></ul><p class="hint" id="pginfo" style="text-align:center"></p><p style="text-align:center"><button type="button" class="btn ghost" id="pgre">🔄 '+esc(T.o_pgRegen)+'</button></p>';
  const show=()=>{try{const {list,bits}=this.gen();this.last=list;$('#pglist',work).innerHTML=list.map(p=>`<li><code>${esc(p)}</code> <button type="button" class="btn ghost" style="padding:2px 8px" data-c="${esc(p)}">${esc(T.o_scopy)}</button></li>`).join('');
   $('#pginfo',work).textContent=`≈${bits} bits – ${bits>=100?T.o_pgVeryStrong:bits>=72?T.o_pgStrong:bits>=50?T.o_pgOk:T.o_pgWeak}`;$('#pglist',work).querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>navigator.clipboard?.writeText(b.dataset.c));}catch(e){$('#pginfo',work).textContent=e.message;}};
  if(!this.bound)this.bound=1,work.addEventListener('change',e=>{if(/^pg/.test(e.target.id))show();});$('#pgre',el).onclick=show;setTimeout(show,0);return el;},
 async run(){const l=this.last||this.gen().list;return {name:'passwords.txt',blob:new Blob([l.join('\n')+'\n'],{type:'text/plain'})};}};
