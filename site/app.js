
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const C=d=>`<a class="card" href="/psd/${d.slug}/"><div class="im"><img loading="lazy" decoding="async" src="${d.img}" alt="${esc(d.t)}" width="480" height="320"></div><div class="tx"><h3>${esc(d.t)}</h3><div class="meta"><span>${esc(d.cn||'')}</span><span>${esc(d.sz||'')}</span></div></div></a>`;
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
document.querySelectorAll('[data-shuffle]').forEach(el=>shuf([...el.children]).forEach(c=>el.appendChild(c)));
const L=$('#list');
if(L){(async()=>{let all=await (await fetch(L.dataset.src)).json();const sp=new URLSearchParams(location.search),q=sp.get('q')||'',pg=+sp.get('p')||1;
 const w=q.toLowerCase().split(/\s+/).filter(Boolean);$('#qv').textContent=q;document.querySelectorAll('input[name=q]').forEach(i=>i.value=q);
 all=all.filter(d=>w.every(x=>(d.t+' '+d.cn+' '+(d.g||[]).join(' ')).toLowerCase().includes(x))).sort((a,b)=>b.q-a.q||a.id-b.id);
 const tot=Math.ceil(all.length/30);$('#cnt').textContent=all.length+' designs found';L.innerHTML=all.slice((pg-1)*30,pg*30).map(C).join('');
 const u=p=>'?q='+encodeURIComponent(q)+'&p='+p;let h='';if(pg>1)h+=`<a href="${u(pg-1)}">‹ Prev</a>`;for(let p=Math.max(1,pg-3);p<=Math.min(tot,pg+3);p++)h+=p==pg?`<span class="on">${p}</span>`:`<a href="${u(p)}">${p}</a>`;if(pg<tot)h+=`<a href="${u(pg+1)}">Next ›</a>`;$('#spg').innerHTML=tot>1?h:''})()}
let SI=null;document.querySelectorAll('.iq').forEach(inp=>{const f=inp.form;let box;inp.addEventListener('input',async()=>{if(!SI)SI=await (await fetch('/data/search.json')).json();const w=inp.value.toLowerCase().split(/\s+/).filter(Boolean);if(!box){box=document.createElement('div');box.className='sug';f.appendChild(box)}if(!w.length){box.remove();box=null;return}
 const r=SI.filter(d=>w.every(x=>(d.t+' '+d.cn+' '+d.g.join(' ')).toLowerCase().includes(x)));box.innerHTML=r.slice(0,6).map(d=>`<a href="/psd/${d.slug}/"><img src="${d.img}" alt="" loading="lazy">${esc(d.t)}</a>`).join('')+`<a class="all" href="/search/?q=${encodeURIComponent(inp.value)}">See all ${r.length} results →</a>`});
 document.addEventListener('click',e=>{if(box&&!f.contains(e.target)){box.remove();box=null}})});
const cp=$('#cpy');cp&&(cp.onclick=()=>{navigator.clipboard.writeText(location.href);cp.textContent='Copied!'});
const D=$('#dlbox');
if(D){(async()=>{const id=+new URLSearchParams(location.search).get('id');const s=Math.floor((id-1)/200);let d;try{d=(await (await fetch('/data/shard-'+s+'.json')).json()).find(x=>x.id===id)}catch(e){}
 if(!d){$('#t').textContent='Design not found.';return}$('#nm').innerHTML=`<a href="/psd/${d.slug}/"><img src="${d.img}" alt="" style="max-width:360px;width:100%;border-radius:12px;margin:auto"></a><p><b>${esc(d.t)}</b><br>${esc(d.dim)} · ${esc(d.sz)}</p>`;
 let c=15;const iv=setInterval(()=>{c--;$('#c').textContent=c;if(c<=0){clearInterval(iv);$('#t').textContent='Your download link is ready';const a=$('#dl');a.href='https://drive.google.com/uc?export=download&id='+d.fid;a.style.display='inline-flex'}},1000)})()}
