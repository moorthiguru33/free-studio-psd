const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LBL={'wedding-album-12x36':'12x36 Album','album-12x30':'12x30 Album','album-18x24':'18x24 Album','album-12x18':'12x18 Album','album-cover':'Album Cover','album-background':'Background','studio-background':'Studio BG','birthday-baby-album':'Birthday','wedding-invitation':'Invitation'};
const IS=d=>d.th?`src="${d.img.replace('/img/','/img/w360/')}" srcset="${d.img.replace('/img/','/img/w360/')} 360w, ${d.img.replace('/img/','/img/w600/')} 600w" sizes="(max-width:720px) 46vw, 320px"`:`src="${d.img}"`;
const LS=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}},SS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const lab=d=>LBL[d.c]||(d.cn||'').replace(/ PSD$/,'');
const C=(d,t=true)=>`<a class="design-card" href="/psd/${d.slug}/"><div class="card-thumb"><div class="wm-container"><img loading="lazy" decoding="async" ${IS(d)} alt="${esc(d.t)}" width="${d.w}" height="${d.h}"></div><div class="card-overlay" aria-hidden="true"><span class="fsp-pill">⬇ Free PSD</span></div><div class="card-cat">${esc(lab(d))}</div><button class="card-fav" type="button" data-id="${d.id}" aria-label="Save to favourites">♥</button></div>${t?`<div class="pm-rel-t">${esc(d.t)}</div>`:''}</a>`;
const ADH=s=>`<div class="ad ad-${s}" data-slot="${s}"><span class="adl">Advertisement</span><div class="adc"></div></div>`;
const G=(list,t=true)=>list.map((d,i)=>C(d,t)+((i+1)%12===0&&i+1<list.length?ADH('infeed'):'')).join('');
/* theme (light default / dark), same behaviour as the reference UI */
(()=>{const K='fsp-theme',r=document.documentElement;const ap=t=>{if(t!=='dark'&&t!=='light')t='light';r.setAttribute('data-theme',t);try{localStorage.setItem(K,t)}catch(e){}$$('.theme-toggle').forEach(b=>{b.setAttribute('aria-label',t==='dark'?'Switch to light theme':'Switch to dark theme');b.title=t==='dark'?'Light theme':'Dark theme'})};
 ap(r.getAttribute('data-theme'));document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.theme-toggle');if(!b)return;e.preventDefault();ap(r.getAttribute('data-theme')==='dark'?'light':'dark')})})();
/* header search toggle (<=960px), hamburger, back to top */
(()=>{const h=$('header'),t=$('.nav-search-toggle'),i=$('#search-input');window.fspOpenSearch=()=>{h.classList.add('ns-open');t&&t.setAttribute('aria-expanded','true');setTimeout(()=>i&&i.focus(),30);return false};
 t&&t.addEventListener('click',()=>{const o=!h.classList.contains('ns-open');h.classList.toggle('ns-open',o);t.setAttribute('aria-expanded',o);t.setAttribute('aria-label',o?'Close search':'Open search');if(o)setTimeout(()=>i.focus(),30)});
 const b=$('#hamburger-btn'),m=$('#mobile-menu');b&&m&&b.addEventListener('click',()=>{b.classList.toggle('open');m.classList.toggle('open')});
 const bt=$('#back-top');if(bt){addEventListener('scroll',()=>bt.classList.toggle('visible',scrollY>400),{passive:true});bt.onclick=()=>scrollTo({top:0,behavior:'smooth'})}
 const ms=$('.mobile-bottom-nav a[href="/search/"]');ms&&ms.addEventListener('click',e=>{if(innerWidth<=960&&!location.pathname.startsWith('/search')){e.preventDefault();scrollTo({top:0});fspOpenSearch()}})})();
/* browse-by-category cards: first click expands, "View All" while open goes to the category */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.bc-head,.bc-all');if(!t)return;const c=t.closest('.bc-card'),o=c.classList.contains('is-open');
 if(t.classList.contains('bc-all')&&o){location.href=t.dataset.href;return}const n=!o;c.classList.toggle('is-open',n);c.querySelectorAll('.bc-head,.bc-all').forEach(x=>x.setAttribute('aria-expanded',n));const a=c.querySelector('.bc-all');if(a)a.innerHTML=n?'View All Designs <span aria-hidden="true">→</span>':'View All <span aria-hidden="true">→</span>'});
/* ads: config from /ads.json, lazy via IntersectionObserver; nothing loads until a slot nears the viewport */
const ads=(()=>{let cfg=null,io=null,loaded=false;const mob=()=>matchMedia('(max-width:720px)').matches;
 const head=()=>{if(loaded)return;loaded=true;(cfg.head_scripts||[]).forEach(src=>{if(!src||/X{6,}/.test(src))return;const s=document.createElement('script');s.async=true;s.src=src;s.crossOrigin='anonymous';document.head.appendChild(s)})};
 const fill=el=>{if(el.dataset.done)return;el.dataset.done=1;const k=el.dataset.slot,h=(cfg.slots||{})[k]||'';const c=el.querySelector('.adc');
  if(cfg.enabled&&h){head();el.classList.remove('ph');c.innerHTML=h;c.querySelectorAll('script').forEach(o=>{const s=document.createElement('script');[...o.attributes].forEach(a=>s.setAttribute(a.name,a.value));s.text=o.text;o.replaceWith(s)});if(c.querySelector('ins.adsbygoogle'))try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}}
  else if(cfg.enabled&&cfg.show_placeholders){el.classList.add('ph');c.textContent=(cfg.labels||{})[k]||'Ad space'}else{el.classList.add('off')}};
 const scan=()=>{if(!cfg)return;$$('.ad[data-slot]:not([data-obs])').forEach(el=>{el.dataset.obs=1;if(io)io.observe(el);else fill(el)})};
 const anchor=()=>{if(!mob()||sessionStorage.getItem('fsp_anc_x')||$('#dlbox'))return;const k='anchor',h=(cfg.slots||{})[k];if(!cfg.enabled||(!h&&!cfg.show_placeholders))return;
  const a=document.createElement('div');a.className='anc ad';a.dataset.slot=k;a.setAttribute('role','complementary');a.setAttribute('aria-label','Advertisement');a.innerHTML='<span class="adl">Advertisement</span><div class="adc"></div><button class="x" type="button" aria-label="Close ad">×</button>';document.body.appendChild(a);document.body.classList.add('hasanc');a.querySelector('.x').onclick=()=>{a.remove();document.body.classList.remove('hasanc');sessionStorage.setItem('fsp_anc_x',1)};fill(a);
  /* never let the anchor overlap a download button: hide it while any download button is near the screen */
  const vis=new Set();if('IntersectionObserver'in window){const bo=new IntersectionObserver(es=>{es.forEach(e=>e.isIntersecting?vis.add(e.target):vis.delete(e.target));a.style.visibility=vis.size?'hidden':''},{rootMargin:'0px 0px 160px 0px'});$$('.dlb,.spg-dl-btn').forEach(b=>bo.observe(b))}};
 const start=()=>!document.querySelector('.ad[data-slot]')?0:fetch('/ads.json').then(r=>r.json()).then(c=>{cfg=c;if('IntersectionObserver'in window)io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);fill(e.target)}}),{rootMargin:'300px 0px'});scan();
  let fired=false;const go=()=>{if(fired)return;fired=true;anchor()};addEventListener('scroll',go,{once:true,passive:true});setTimeout(go,6000)}).catch(()=>{});
 if(document.readyState==='complete')setTimeout(start,300);else addEventListener('load',()=>setTimeout(start,300));
 return{scan}})();
/* favourites */
const favs=()=>LS('fsp_fav');const paintH=()=>{const f=new Set(favs());$$('.card-fav').forEach(b=>b.classList.toggle('on',f.has(+b.dataset.id)))};
const togFav=id=>{let f=favs();f=f.includes(id)?f.filter(x=>x!==id):[id,...f];SS('fsp_fav',f);paintH();return f.includes(id)};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.card-fav');if(!b)return;e.preventDefault();e.stopPropagation();togFav(+b.dataset.id)});
const day=()=>{const t=new Date();return t.getFullYear()*1e4+(t.getMonth()+1)*100+t.getDate()};
const seeded=(a,s)=>{a=a.slice();let x=s;const r=()=>(x=(x*1103515245+12345)%2147483648)/2147483648;for(let i=a.length-1;i>0;i--){const j=r()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
let IDX=null;const idx=async()=>IDX||(IDX=await (await fetch('/data/search.json')).json());
/* home feed: sort / reset / favourites (first 30 only; the numbered pager below leads to the full list) */
const F=$('#designs-grid');
if(F){const init=F.innerHTML,sel=$('#sort-select'),fb=$('#fav-filter-btn'),rc=$('.results-count');const rc0=rc?rc.textContent:'';
 const show=(l,t)=>{F.innerHTML=G(l,false);paintH();ads.scan();if(rc)rc.textContent=t||rc0};
 sel&&(sel.onchange=async()=>{const a=await idx(),m=sel.value;show(m==='n'?a.slice().sort((x,y)=>y.id-x.id).slice(0,30):m==='q'?a.slice().sort((x,y)=>y.q-x.q).slice(0,30):seeded(a,day()).slice(0,30))});
 const rb=$('#reset-filters-btn');rb&&(rb.onclick=()=>{sel&&(sel.value='s');F.innerHTML=init;paintH();ads.scan();if(rc)rc.textContent=rc0;fb&&fb.classList.remove('active')});
 fb&&(fb.onclick=async()=>{const on=!fb.classList.contains('active');fb.classList.toggle('active',on);if(!on){rb.onclick();return}const m=new Map((await idx()).map(d=>[d.id,d]));const l=favs().map(i=>m.get(i)).filter(Boolean);
  if(!l.length){F.innerHTML='<div class="empty-state"><div class="es-icon">♥</div><h3>No favourites yet</h3><p>Tap ♥ on any design to save it here.</p></div>';if(rc)rc.textContent='0 favourites';return}show(l,l.length+' favourites')})}
/* pager "Go to page" */
document.addEventListener('submit',e=>{const f=e.target.closest('.tp-pager-jump');if(!f)return;e.preventDefault();const n=Math.max(1,Math.min(+f.dataset.tot,parseInt(f.querySelector('input').value)||1));location.href=n===1?f.dataset.first:f.dataset.base+'page/'+n+'/'});
/* search: engine + UI live in /search.js, loaded only on the search page or on first focus/keystroke in a search box (keeps it off the LCP path) */
(()=>{let p=null;const v=(document.querySelector('script[src*="/app.js"]')||{}).src||'',sv=(v.match(/v=(\w+)/)||[])[1]||'1';
 const get=()=>p||(p=new Promise(r=>{const s=document.createElement('script');s.src='/search.js?v='+sv;s.async=true;s.onload=r;document.head.appendChild(s)}));
 if($('#sres'))get();
 $$('#search-input').forEach(i=>{const k=()=>get().then(()=>{if(document.activeElement===i&&i.value)i.dispatchEvent(new Event('input'))});i.addEventListener('focus',k,{once:true});i.addEventListener('input',k,{once:true})})})();
/* design page */
const cp=$('#share-cp');cp&&(cp.onclick=()=>{navigator.clipboard.writeText(location.href);cp.lastChild.textContent=' Copied!'});
const z=$('#zm');z&&(z.onclick=e=>{e.preventDefault();const o=document.createElement('div');o.className='lbx';o.innerHTML=`<img src="${z.getAttribute('href')}" alt="">`;o.onclick=()=>o.remove();document.body.appendChild(o)});
const dp=$('#dp');if(dp){const id=+dp.dataset.id;SS('fsp_rv',[id,...LS('fsp_rv').filter(x=>x!==id)].slice(0,16));const fb=$('#fav');const st=()=>{const on=favs().includes(id);fb.textContent=on?'♥ Saved':'♡ Save';fb.classList.toggle('on',on)};st();fb.onclick=()=>{togFav(id);st()}}
(async()=>{const rv=$('#rvl');if(rv){const ids=LS('fsp_rv').filter(x=>!dp||x!==+dp.dataset.id).slice(0,12);if(ids.length){const m=new Map((await idx()).map(d=>[d.id,d]));rv.innerHTML=ids.map(i=>m.get(i)).filter(Boolean).map(d=>C(d)).join('');$('#rv').hidden=false;paintH()}}
 const fl=$('#favl');if(fl){const ids=favs();if(!ids.length){$('#fave').hidden=false}else{const m=new Map((await idx()).map(d=>[d.id,d]));fl.innerHTML=ids.map(i=>m.get(i)).filter(Boolean).map(d=>C(d)).join('');paintH()}}})();
paintH();
/* download countdown */
const D=$('#dlbox');
if(D){(async()=>{const id=+new URLSearchParams(location.search).get('id');const s=Math.floor((id-1)/200);let sh=[],d;try{sh=await (await fetch('/data/shard-'+s+'.json')).json();d=sh.find(x=>x.id===id)}catch(e){}
 if(!d){$('#t').textContent='Design not found.';$('#ring').style.display='none';return}
 $('#nmimg').innerHTML=`<a class="dp-wm-container" href="/psd/${d.slug}/"><img src="${d.img}" alt="${esc(d.t)}" width="${d.w}" height="${d.h}"></a>`;$('#nm').textContent=d.t;$('#nmspec').textContent=`Design #${d.id} · ${d.dim} · ${d.dpi} · ${d.sz}`;$('#nmcat').textContent=lab(d);$('#nmid').textContent='#psd-'+d.id;
 const rel=$('#dlrel');if(rel){rel.innerHTML=sh.filter(x=>x.c===d.c&&x.id!==d.id).slice(0,12).map(x=>C(x)).join('');paintH()}
 let tk=null,lim=null;try{const r=await fetch('/api/dl?s=1&id='+id,{credentials:'same-origin'});const j=await r.json();if(j.limit)lim=j.msg;else tk=j.t}catch(e){}
 if(lim){$('#t').textContent=lim;$('#ring').style.display='none';$('#c').textContent='';return}
 let c=10;const iv=setInterval(()=>{c--;$('#c').textContent=c;if(c<=0){clearInterval(iv);$('#t').textContent='Your download link is ready';const a=$('#dl');a.href='/api/dl?id='+id+'&t='+encodeURIComponent(tk||'');a.rel='nofollow';a.style.visibility='visible';$('#ring').style.display='none'}},1000)})()}
/* Pro promo bar: dismiss for 14 days */
(()=>{const x=$('.fsp-promo-x');x&&(x.onclick=()=>{document.documentElement.classList.add('nopromo');try{localStorage.setItem('fsp-promo-x',Date.now()+14*864e5)}catch(e){}})})();
