const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LBL={'wedding-album-12x36':'12x36 Album','album-12x30':'12x30 Album','album-18x24':'18x24 Album','album-12x18':'12x18 Album','album-cover':'Album Cover','album-background':'Background','studio-background':'Studio BG','birthday-baby-album':'Birthday','wedding-invitation':'Invitation'};
const LS=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}},SS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const lab=d=>LBL[d.c]||(d.cn||'').replace(/ PSD$/,'');
const C=d=>`<div class="card"><a class="im" href="/psd/${d.slug}/"><span class="lb">${esc(lab(d))}</span><img loading="lazy" decoding="async" src="${d.img}" alt="${esc(d.t)}" width="${d.w}" height="${d.h}"></a><button class="hb" type="button" data-id="${d.id}" aria-label="Save to favourites">♥</button><a class="tx" href="/psd/${d.slug}/"><h3>${esc(d.t)}</h3><span class="meta"><span>${esc((d.cn||'').replace(/ PSD$/,''))}</span><span>${esc(d.sz||'')}</span></span></a></div>`;
const ADH=s=>`<div class="ad ad-${s}" data-slot="${s}"><span class="adl">Advertisement</span><div class="adc"></div></div>`;
/* ads: config from /ads.json, lazy via IntersectionObserver, nothing loads until a slot nears the viewport */
const ads=(()=>{let cfg=null,io=null,loaded=false;const mob=()=>matchMedia('(max-width:720px)').matches;
 const head=()=>{if(loaded)return;loaded=true;(cfg.head_scripts||[]).forEach(src=>{if(!src||/X{6,}/.test(src))return;const s=document.createElement('script');s.async=true;s.src=src;s.crossOrigin='anonymous';document.head.appendChild(s)})};
 const fill=el=>{if(el.dataset.done)return;el.dataset.done=1;const k=el.dataset.slot,h=(cfg.slots||{})[k]||'';const c=el.querySelector('.adc');
  if(cfg.enabled&&h){head();el.classList.remove('ph');c.innerHTML=h;c.querySelectorAll('script').forEach(o=>{const s=document.createElement('script');[...o.attributes].forEach(a=>s.setAttribute(a.name,a.value));s.text=o.text;o.replaceWith(s)});if(c.querySelector('ins.adsbygoogle'))try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}}
  else if(cfg.show_placeholders){el.classList.add('ph');c.textContent=(cfg.labels||{})[k]||'Ad space'}else{el.classList.add('off')}};
 const scan=()=>{if(!cfg)return;$$('.ad[data-slot]:not([data-obs])').forEach(el=>{el.dataset.obs=1;if(io)io.observe(el);else fill(el)})};
 const anchor=()=>{if(!mob()||sessionStorage.getItem('fsp_anc_x')||$('#dlbox'))return;const k='anchor',h=(cfg.slots||{})[k];if(!(cfg.enabled&&h)&&!cfg.show_placeholders)return;
  const a=document.createElement('div');a.className='anc ad';a.dataset.slot=k;a.setAttribute('role','complementary');a.setAttribute('aria-label','Advertisement');a.innerHTML='<span class="adl">Advertisement</span><div class="adc"></div><button class="x" type="button" aria-label="Close ad">×</button>';document.body.appendChild(a);document.body.classList.add('hasanc');a.querySelector('.x').onclick=()=>{a.remove();document.body.classList.remove('hasanc');sessionStorage.setItem('fsp_anc_x',1)};fill(a)
  /* never let the anchor overlap a download button: hide it while any .dlb/.btn is on screen */
  const vis=new Set();if('IntersectionObserver'in window){const bo=new IntersectionObserver(es=>{es.forEach(e=>e.isIntersecting?vis.add(e.target):vis.delete(e.target));a.style.visibility=vis.size?'hidden':''},{rootMargin:'0px 0px 140px 0px'});$$('.dlb,.btn').forEach(b=>bo.observe(b))}};
 const start=()=>fetch('/ads.json').then(r=>r.json()).then(c=>{cfg=c;if('IntersectionObserver'in window)io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);fill(e.target)}}),{rootMargin:'300px 0px'});scan();
  let fired=false;const go=()=>{if(fired)return;fired=true;anchor()};addEventListener('scroll',go,{once:true,passive:true});setTimeout(go,6000)}).catch(()=>{});
 if(document.readyState==='complete')setTimeout(start,300);else addEventListener('load',()=>setTimeout(start,300));
 return{scan}})();
/* favourites hearts */
const favs=()=>LS('fsp_fav');const paintH=()=>{const f=new Set(favs());$$('.hb').forEach(b=>b.classList.toggle('on',f.has(+b.dataset.id)))};
document.addEventListener('click',e=>{const b=e.target.closest('.hb');if(!b)return;e.preventDefault();const id=+b.dataset.id;let f=favs();f=f.includes(id)?f.filter(x=>x!==id):[id,...f];SS('fsp_fav',f);paintH()});
/* mobile search toggle */
const sb=$('#sbtn');sb&&(sb.onclick=()=>{const f=$('.hs');f.classList.toggle('open');f.classList.contains('open')&&f.querySelector('input').focus()});
/* masonry */
function mas(el,items,every){const w=el.clientWidth,n=w<560?2:w<900?3:w<1240?4:5;el.innerHTML='';el.classList.add('mas');el.classList.remove('grid');const cols=[],hh=[];for(let i=0;i<n;i++){const c=document.createElement('div');c.className='col';el.appendChild(c);cols.push(c);hh.push(0)}
 el._add=(list)=>{list.forEach(it=>{let k=hh.indexOf(Math.min(...hh));const t=document.createElement('div');t.innerHTML=it.ad?ADH('infeed'):C(it);const node=t.firstChild;cols[k].appendChild(node);hh[k]+=it.ad?1.1:(it.h/it.w)+.28;});paintH();ads.scan()};el._n=n;el._add(items)}
const withAds=(list,start)=>{const o=[];list.forEach((d,i)=>{o.push(d);if((start+i+1)%12===0)o.push({ad:1})});return o};
const day=()=>{const t=new Date();return t.getFullYear()*1e4+(t.getMonth()+1)*100+t.getDate()};
const seeded=(a,s)=>{a=a.slice();let x=s;const r=()=>(x=(x*1103515245+12345)%2147483648)/2147483648;for(let i=a.length-1;i>0;i--){const j=r()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
let IDX=null;const idx=async()=>IDX||(IDX=await (await fetch('/data/search.json')).json());
const F=$('#feed');
if(F){const init=JSON.parse($('#feedinit').textContent);let shown=0,all=null,mode='s';
 const render=list=>{mas(F,withAds(list,0),12);shown=list.length};render(init);
 const sel=$('#fsort');
 const getAll=async()=>{if(!all){const a=await idx();all={s:seeded(a,day()),n:a.slice().sort((x,y)=>y.id-x.id),q:a.slice().sort((x,y)=>y.q-x.q),m:a.slice().sort((x,y)=>y.mb-x.mb)}}return all[mode]};
 sel&&(sel.onchange=async()=>{mode=sel.value;const L=await getAll();render(L.slice(0,30))});
 let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{const w=F.clientWidth,n=w<560?2:w<900?3:w<1240?4:5;if(n!==F._n){const ids=$$('#feed .hb').map(b=>+b.dataset.id);(async()=>{const m=new Map((await idx()).map(d=>[d.id,d]));mas(F,withAds(ids.map(i=>m.get(i)).filter(Boolean),0),12)})()}},250)});
 const ho=$('#hshuf');ho&&(ho.onclick=async()=>{const a=await idx();sel&&(sel.value='s');mode='s';all&&(all.s=seeded(a,Date.now()%99991));render(all?all.s.slice(0,30):seeded(a,Date.now()%99991).slice(0,30))});}
/* search page */
const L=$('#list');
if(L){(async()=>{let a=await idx();const sp=new URLSearchParams(location.search),q=sp.get('q')||'',pg=+sp.get('p')||1;
 const w=q.toLowerCase().split(/\s+/).filter(Boolean);$('#qv').textContent=q;$$('input[name=q]').forEach(i=>i.value=q);
 a=a.filter(d=>w.every(x=>(d.t+' '+d.cn+' '+(d.g||[]).join(' ')).toLowerCase().includes(x))).sort((x,y)=>y.q-x.q||x.id-y.id);if(!a.length){$('#se').hidden=false}
 const tot=Math.ceil(a.length/30);$('#cnt').textContent=a.length.toLocaleString()+' designs found';const pgl=a.slice((pg-1)*30,pg*30);L.innerHTML='';mas(L,withAds(pgl,0),12);
 const u=p=>'?q='+encodeURIComponent(q)+'&p='+p;let h='';if(pg>1)h+=`<a href="${u(pg-1)}">‹ Prev</a>`;for(let p=Math.max(1,pg-3);p<=Math.min(tot,pg+3);p++)h+=p==pg?`<span class="on">${p}</span>`:`<a href="${u(p)}">${p}</a>`;if(pg<tot)h+=`<a href="${u(pg+1)}">Next ›</a>`;$('#spg').innerHTML=tot>1?h:''})()}
/* suggestions */
$$('.iq').forEach(inp=>{const f=inp.form;let box;inp.addEventListener('input',async()=>{const S=await idx();const w=inp.value.toLowerCase().split(/\s+/).filter(Boolean);if(!box){box=document.createElement('div');box.className='sug';f.appendChild(box)}if(!w.length){box.remove();box=null;return}
 const r=S.filter(d=>w.every(x=>(d.t+' '+d.cn+' '+d.g.join(' ')).toLowerCase().includes(x)));box.innerHTML=r.slice(0,6).map(d=>`<a href="/psd/${d.slug}/"><img src="${d.img}" alt="" loading="lazy">${esc(d.t)}</a>`).join('')+`<a class="all" href="/search/?q=${encodeURIComponent(inp.value)}">See all ${r.length} results →</a>`});
 document.addEventListener('click',e=>{if(box&&!f.contains(e.target)){box.remove();box=null}})});
/* design page */
const cp=$('#cpy');cp&&(cp.onclick=()=>{navigator.clipboard.writeText(location.href);cp.textContent='Copied!'});
const z=$('#zm');z&&(z.onclick=e=>{e.preventDefault();const o=document.createElement('div');o.className='lbx';o.innerHTML=`<img src="${z.getAttribute('href')}" alt="">`;o.onclick=()=>o.remove();document.body.appendChild(o)});
const dp=$('#dp');if(dp){const id=+dp.dataset.id;SS('fsp_rv',[id,...LS('fsp_rv').filter(x=>x!==id)].slice(0,16));const fb=$('#fav');const st=()=>{const on=favs().includes(id);fb.textContent=on?'♥ Saved':'♡ Save';fb.classList.toggle('on',on)};st();fb.onclick=()=>{let f=favs();f=f.includes(id)?f.filter(x=>x!==id):[id,...f];SS('fsp_fav',f);st();paintH()}}
(async()=>{const rv=$('#rvl');if(rv){const ids=LS('fsp_rv').filter(x=>!dp||x!==+dp.dataset.id);if(ids.length){const m=new Map((await idx()).map(d=>[d.id,d]));rv.innerHTML=ids.map(i=>m.get(i)).filter(Boolean).map(C).join('');$('#rv').hidden=false;paintH()}}
 const fl=$('#favl');if(fl){const ids=favs();if(!ids.length){$('#fave').hidden=false}else{const m=new Map((await idx()).map(d=>[d.id,d]));fl.innerHTML=ids.map(i=>m.get(i)).filter(Boolean).map(C).join('');paintH()}}})();
paintH();
/* download countdown */
const D=$('#dlbox');
if(D){(async()=>{const id=+new URLSearchParams(location.search).get('id');const s=Math.floor((id-1)/200);let sh=[],d;try{sh=await (await fetch('/data/shard-'+s+'.json')).json();d=sh.find(x=>x.id===id)}catch(e){}
 if(!d){$('#t').textContent='Design not found.';return}$('#nm').innerHTML=`<a href="/psd/${d.slug}/"><img src="${d.img}" alt="" style="max-width:380px;width:100%;border-radius:14px;margin:auto"></a><p style="margin:12px 0 0"><b>${esc(d.t)}</b><br><span style="color:var(--mut);font-size:13px">${esc(d.dim)} · ${esc(d.sz)}</span></p>`;
 const rel=$('#dlrel');if(rel){mas(rel,sh.filter(x=>x.c===d.c&&x.id!==d.id).slice(0,12),99)}
 let c=15;const iv=setInterval(()=>{c--;$('#c').textContent=c;if(c<=0){clearInterval(iv);$('#t').textContent='Your download link is ready';const a=$('#dl');a.href='https://drive.google.com/uc?export=download&id='+d.fid;a.style.visibility='visible';$('#ring').style.display='none'}},1000)})()}
