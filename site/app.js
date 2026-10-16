
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const C=d=>`<a class="card" href="/psd/${d.slug}/"><div class="im"><img loading="lazy" decoding="async" src="${d.img}" alt="${esc(d.t)}" width="${d.w}" height="${d.h}"></div><div class="tx"><h3>${esc(d.t)}</h3><div class="meta"><span>${esc(d.cn||'')}</span><span>${esc(d.sz||'')}</span></div></div></a>`;
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
document.querySelectorAll('[data-shuffle]').forEach(el=>shuf([...el.children]).forEach(c=>el.appendChild(c)));
const L=$('#list');
if(L){(async()=>{let all=await (await fetch(L.dataset.src)).json();const sp=new URLSearchParams(location.search),q=sp.get('q')||'',pg=+sp.get('p')||1;
 const w=q.toLowerCase().split(/\s+/).filter(Boolean);$('#qv').textContent=q;document.querySelectorAll('input[name=q]').forEach(i=>i.value=q);
 all=all.filter(d=>w.every(x=>(d.t+' '+d.cn+' '+(d.g||[]).join(' ')).toLowerCase().includes(x))).sort((a,b)=>b.q-a.q||a.id-b.id);if(!all.length){$('#se').hidden=false}
 const tot=Math.ceil(all.length/30);$('#cnt').textContent=all.length+' designs found';L.innerHTML=all.slice((pg-1)*30,pg*30).map(C).join('');
 const u=p=>'?q='+encodeURIComponent(q)+'&p='+p;let h='';if(pg>1)h+=`<a href="${u(pg-1)}">‹ Prev</a>`;for(let p=Math.max(1,pg-3);p<=Math.min(tot,pg+3);p++)h+=p==pg?`<span class="on">${p}</span>`:`<a href="${u(p)}">${p}</a>`;if(pg<tot)h+=`<a href="${u(pg+1)}">Next ›</a>`;$('#spg').innerHTML=tot>1?h:''})()}
let SI=null;document.querySelectorAll('.iq').forEach(inp=>{const f=inp.form;let box;inp.addEventListener('input',async()=>{if(!SI)SI=await (await fetch('/data/search.json')).json();const w=inp.value.toLowerCase().split(/\s+/).filter(Boolean);if(!box){box=document.createElement('div');box.className='sug';f.appendChild(box)}if(!w.length){box.remove();box=null;return}
 const r=SI.filter(d=>w.every(x=>(d.t+' '+d.cn+' '+d.g.join(' ')).toLowerCase().includes(x)));box.innerHTML=r.slice(0,6).map(d=>`<a href="/psd/${d.slug}/"><img src="${d.img}" alt="" loading="lazy">${esc(d.t)}</a>`).join('')+`<a class="all" href="/search/?q=${encodeURIComponent(inp.value)}">See all ${r.length} results →</a>`});
 document.addEventListener('click',e=>{if(box&&!f.contains(e.target)){box.remove();box=null}})});
const cp=$('#cpy');cp&&(cp.onclick=()=>{navigator.clipboard.writeText(location.href);cp.textContent='Copied!'});
const z=$('#zm');z&&(z.onclick=e=>{e.preventDefault();const o=document.createElement('div');o.className='lb';o.innerHTML=`<img src="${z.getAttribute('href')}" alt="">`;o.onclick=()=>o.remove();document.body.appendChild(o)});
const LS=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}},SS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let IDX=null;const idx=async()=>IDX||(IDX=await (await fetch('/data/search.json')).json());
const dp=$('#dp');if(dp){const id=+dp.dataset.id;SS('fsp_rv',[id,...LS('fsp_rv').filter(x=>x!==id)].slice(0,16));const fb=$('#fav');const st=()=>{const on=LS('fsp_fav').includes(id);fb.textContent=on?'♥ Saved':'♡ Save';fb.classList.toggle('on',on)};st();fb.onclick=()=>{let f=LS('fsp_fav');f=f.includes(id)?f.filter(x=>x!==id):[id,...f];SS('fsp_fav',f);st()}}
(async()=>{const rv=$('#rvl');if(rv){const ids=LS('fsp_rv').filter(x=>!dp||x!==+dp.dataset.id);if(ids.length){const m=new Map((await idx()).map(d=>[d.id,d]));rv.innerHTML=ids.map(i=>m.get(i)).filter(Boolean).map(C).join('');$('#rv').hidden=false}}
 const fl=$('#favl');if(fl){const ids=LS('fsp_fav');if(!ids.length){$('#fave').hidden=false}else{const m=new Map((await idx()).map(d=>[d.id,d]));fl.innerHTML=ids.map(i=>m.get(i)).filter(Boolean).map(C).join('')}}})();
fetch('/ads.json').then(r=>r.json()).then(cfg=>{if(!cfg.enabled)return;(cfg.head_scripts||[]).forEach(src=>{if(!src)return;const s=document.createElement('script');s.async=true;s.src=src;s.crossOrigin='anonymous';document.head.appendChild(s)});
 document.querySelectorAll('.ad[data-slot]').forEach(el=>{const h=(cfg.slots||{})[el.dataset.slot];if(!h)return;el.className='adr';el.innerHTML=h;el.querySelectorAll('script').forEach(o=>{const s=document.createElement('script');[...o.attributes].forEach(a=>s.setAttribute(a.name,a.value));s.text=o.text;o.replaceWith(s)})})}).catch(()=>{});
const D=$('#dlbox');
if(D){(async()=>{const id=+new URLSearchParams(location.search).get('id');const s=Math.floor((id-1)/200);let d;try{d=(await (await fetch('/data/shard-'+s+'.json')).json()).find(x=>x.id===id)}catch(e){}
 if(!d){$('#t').textContent='Design not found.';return}$('#nm').innerHTML=`<a href="/psd/${d.slug}/"><img src="${d.img}" alt="" style="max-width:360px;width:100%;border-radius:12px;margin:auto"></a><p><b>${esc(d.t)}</b><br>${esc(d.dim)} · ${esc(d.sz)}</p>`;
 const rel=$('#dlrel');if(rel){const sh=await (await fetch('/data/shard-'+s+'.json')).json();rel.innerHTML=sh.filter(x=>x.c===d.c&&x.id!==d.id).slice(0,12).map(C).join('')}
 let c=15;const iv=setInterval(()=>{c--;$('#c').textContent=c;if(c<=0){clearInterval(iv);$('#t').textContent='Your download link is ready';const a=$('#dl');a.href='https://drive.google.com/uc?export=download&id='+d.fid;a.style.display='inline-flex'}},1000)})()}
