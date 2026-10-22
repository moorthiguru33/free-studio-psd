/* PSD Album search: lazy index (/data/sx/), tokenized AND matching, ranking, prefix + typo tolerance, synonyms, header suggestions, /search/ page with filter chips */
(()=>{
const STOP=new Set('psd psds free download downloads file files template templates design designs the a an for with in of and on to photoshop editable layered hd new latest best online'.split(' '));
const SYN={kalyanam:'wedding',kalyana:'wedding',kalyanam_:'wedding',marriage:'wedding',marriages:'wedding',shaadi:'wedding',shadi:'wedding',vivah:'wedding',vivaha:'wedding',thirumanam:'wedding',muhurtham:'wedding',muhurtam:'wedding',bridal:'wedding',bride:'wedding',groom:'wedding',
 valaikappu:'baby',valaikaapu:'baby',valaikapu:'baby',valakappu:'baby',seemantham:'baby',seemandham:'baby',simantham:'baby',srimantham:'baby',shower:'baby',babyshower:'baby',maternity:'baby',pregnancy:'baby',godhbharai:'baby',newborn:'baby',kid:'baby',kids:'baby',child:'baby',children:'baby',naming:'baby',cradle:'baby',
 manjal:'puberty',neerattu:'puberty',neeratu:'puberty',neerattuvizha:'puberty',ritu:'puberty',rithu:'puberty',ruthu:'puberty',saree:'puberty',sadangu:'puberty',
 nalangu:'haldi',pasupu:'haldi',mehendi:'mehndi',mehandi:'mehndi',henna:'mehndi',nikah:'muslim',nikkah:'muslim',islamic:'muslim',church:'christian',christ:'christian',catholic:'christian',
 bday:'birthday',birthdays:'birthday',nichayathartham:'engagement',nischayathartham:'engagement',nichayam:'engagement',betrothal:'engagement',ring:'engagement',varaverpu:'reception',
 invite:'invitation',invites:'invitation',invitations:'invitation',card:'invitation',cards:'invitation',patrika:'invitation',bg:'background',backdrop:'background',backgrounds:'background',covers:'cover',
 karishma:'karizma',karisma:'karizma',krizma:'karizma',karizmaa:'karizma',albums:'album',photobook:'album',pics:'photo',photos:'photo'};
const norm=q=>(' '+String(q||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')+' ')
 .replace(/(\d{1,2})\s*(?:x|\*|×|by|-|\/)\s*(\d{1,2})(?!\d)/g,'$1x$2').replace(/b'?day/g,'birthday').replace(/baby\s+shower/g,'baby').replace(/pre[\s-]+wedding/g,'prewedding').replace(/half\s+saree/g,'puberty');
const toks=s=>(norm(s).match(/[a-z0-9]+/g)||[]);
let M=null,D=[],V=null,ready=null,LOADED=0;
const lev=(a,b,m)=>{if(Math.abs(a.length-b.length)>m)return m+1;let p=[...Array(b.length+1).keys()],pp=null;for(let i=1;i<=a.length;i++){const c=[i];let mn=i;for(let j=1;j<=b.length;j++){let v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));if(pp&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,pp[j-2]+1);c[j]=v;if(v<mn)mn=v}if(mn>m)return m+1;pp=p;p=c}return p[b.length]};
function add(rows){const sl=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 for(const r of rows){const [id,s,t,c,g,th,w,h,q]=r,d={id,slug:s||sl(t)+'-'+id,t,c,g,th,w,h,q};d.tt=new Set(toks(t));d.gt=new Set();for(const k of g)for(const x of M.tagT[k])d.gt.add(x);d.ct=c>=0?M.catT[c]:new Set();d.sz=(t.match(/\b\d{1,2}x\d{1,2}\b/i)||[''])[0].toLowerCase();D.push(d);for(const x of d.tt)V.add(x);for(const x of d.gt)V.add(x)}
 D.sort((a,b)=>a.id-b.id)}
function load(onShard){if(ready)return ready;ready=(async()=>{M=await (await fetch('/data/sx/meta.json',{cache:'default'})).json();V=new Set();
 M.catT=M.cats.map(c=>new Set(toks(c[1]+' '+c[0])));M.tagT=M.tags.map(t=>new Set(toks(t[1]+' '+t[0])));M.catT.forEach(s=>s.forEach(x=>V.add(x)));
 await Promise.all([...Array(M.n).keys()].map(async k=>{const r=await (await fetch(`/data/sx/s${k}.json?v=${M.v[k]}`)).json();add(r);LOADED++;onShard&&onShard()}));return true})();return ready}
/* expand one query token into {vocabWord: weight} */
function expand(w){const out=new Map(),put=(x,s)=>{if(!out.has(x)||out.get(x)<s)out.set(x,s)};
 const syn=SYN[w]; if(syn)put(syn,1);
 if(V.has(w))put(w,1);
 if(!V.has(w)&&w.endsWith('s')&&V.has(w.slice(0,-1)))put(w.slice(0,-1),.95);
 if(/^\d+x\d+$/.test(w)){const [a,b]=w.split('x');if(V.has(b+'x'+a))put(b+'x'+a,.7)}
 else if(!out.size){ if(w.length>=2)for(const x of V)if(x.startsWith(w))put(x,w.length>=4?.85:.7);
  const m=w.length>=8?2:w.length>=4?1:0; if(m)for(const x of V)if(!/^\d/.test(x)&&(x[0]===w[0]||m===2)){const e=lev(w,x,m);if(e<=m&&e>0)put(x,e===1?.75:.55)}
  if(!out.size&&w.length>=4)for(const k in SYN){if(lev(w,k,w.length>=8?2:1)<=(w.length>=8?2:1))put(SYN[k],.7)}}
 return out}
function search(q,opt={}){const raw=toks(q).filter(w=>!STOP.has(w));const seen=new Set();const terms=[],dropped=[];
 for(const w of raw){const e=expand(w);if(!e.size){dropped.push(w);continue}const key=[...e.keys()].sort().join('|');if(seen.has(key))continue;seen.add(key);terms.push({w,e})}
 const nq=raw.join(' ');let res=[],partial=false;
 const score=(d,need)=>{let s=0,hit=0;for(const {e} of terms){let b=0;for(const [x,wt] of e){const v=d.tt.has(x)?10*wt:d.gt.has(x)?5*wt:d.ct.has(x)?3*wt:0;if(v>b)b=v}if(b){hit++;s+=b}else if(need)return 0}if(!hit)return 0;
  if(terms.length>1&&d.t.toLowerCase().includes(nq))s+=6;return s+hit*20+Math.log10(1+(d.q||0))*.6};
 if(terms.length){for(const d of D){const s=score(d,true);if(s)res.push([s,d])}
  if(!res.length&&terms.length>1){partial=true;for(const d of D){const s=score(d,false);if(s)res.push([s,d])}}}
 res.sort((a,b)=>b[0]-a[0]||b[1].q-a[1].q||a[1].id-b[1].id);let list=res.map(x=>x[1]);
 const cats=new Map(),sizes=new Map();for(const d of list){cats.set(d.c,(cats.get(d.c)||0)+1);if(d.sz)sizes.set(d.sz,(sizes.get(d.sz)||0)+1)}
 if(opt.c!=null&&opt.c!=='')list=list.filter(d=>M.cats[d.c]&&M.cats[d.c][0]===opt.c);if(opt.s)list=list.filter(d=>d.sz===opt.s);
 const used=terms.map(t=>{const top=[...t.e].sort((a,b)=>b[1]-a[1])[0][0];return top===t.w?t.w:top});
 return {list,total:list.length,cats,sizes,dropped,partial,used,terms:terms.length}}
function suggest(q){const w=toks(q).filter(x=>!STOP.has(x));if(!w.length)return[];const out=[];const L=w[w.length-1];
 const mm=(name)=>{const nt=toks(name);return w.every(x=>{const e=expand(x);return nt.some(t=>e.has(t))||nt.some(t=>t.startsWith(x))})};
 M.cats.forEach(c=>{if(mm(c[1]))out.push({h:`/category/${c[0]}/`,t:c[1],n:c[2]})});M.tags.forEach(t=>{if(mm(t[1]))out.push({h:`/tag/${t[0]}/`,t:t[1].replace(' Free Download','')})});return out.slice(0,3)}
const img=d=>M.img+(d.th?'w360/':'')+d.slug+'.webp';
const API={load,search,suggest,toks,norm,img,get M(){return M},get D(){return D}};
if(typeof document==='undefined'){globalThis.FSPS=API;return}
window.FSPS=API;
/* ---------- UI ---------- */
const $=(s,r=document)=>r.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`.sx-box{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:1000;background:var(--bg2,#fff);border:1px solid var(--b2,#ddd);border-radius:14px;box-shadow:0 18px 50px -12px rgba(0,0,0,.35);overflow:hidden;max-height:min(70vh,560px);overflow-y:auto;text-align:left}
.sx-box a{display:flex;gap:10px;align-items:center;padding:8px 12px;color:inherit;text-decoration:none;font-size:14px;line-height:1.3}.sx-box a[aria-selected=true],.sx-box a:hover{background:rgba(245,166,35,.14)}
.sx-box img{width:56px;height:40px;object-fit:cover;border-radius:6px;flex:none;background:#eee}.sx-box .sx-h{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;padding:8px 12px 2px}
.sx-box .sx-cat{font-weight:600}.sx-box .sx-cat small{opacity:.6;font-weight:400;margin-left:auto}.sx-box .sx-all{justify-content:center;font-weight:600;border-top:1px solid var(--b1,#eee)}.sx-box .sx-msg{padding:12px;font-size:14px;opacity:.75}
.sx-chips{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 14px}.sx-chip{border:1px solid var(--b2,#ccc);background:var(--bg2,#fff);color:inherit;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}.sx-chip[aria-pressed=true]{background:#f5a623;border-color:#f5a623;color:#1a1208}.sx-chip small{opacity:.65;margin-left:4px}
.sx-note{font-size:14px;opacity:.8;margin:0 0 10px}.sx-more{display:block;margin:18px auto;padding:10px 22px;border-radius:999px;border:1px solid var(--b2,#ccc);background:var(--bg2,#fff);color:inherit;font:inherit;cursor:pointer}
.sx-pop{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}.sx-pop a{border:1px solid var(--b2,#ccc);border-radius:999px;padding:6px 12px;color:inherit;text-decoration:none;font-size:14px}
@media(max-width:960px){.sx-box{position:fixed;left:8px;right:8px;top:auto;margin-top:6px}.sx-box a{padding:10px 12px}}`;document.head.appendChild(css);
const deb=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
const SR=$('#sres');
/* header dropdown */
document.querySelectorAll('#search-input').forEach(inp=>{const f=inp.form;if(!f)return;f.style.position=f.style.position||'relative';let box=null,act=-1;
 inp.setAttribute('role','combobox');inp.setAttribute('aria-autocomplete','list');inp.setAttribute('aria-expanded','false');inp.setAttribute('aria-controls','sx-list');
 const close=()=>{if(box){box.remove();box=null;act=-1;inp.setAttribute('aria-expanded','false')}};
 const items=()=>box?[...box.querySelectorAll('a')]:[];
 const mark=()=>items().forEach((a,i)=>a.setAttribute('aria-selected',i===act?'true':'false'));
 const render=async()=>{const q=inp.value.trim();if(!q){close();return}
  if(!box){box=document.createElement('div');box.className='sx-box';box.id='sx-list';box.setAttribute('role','listbox');f.appendChild(box);inp.setAttribute('aria-expanded','true');
   if(innerWidth<=960){const r=f.getBoundingClientRect();box.style.top=(r.bottom+6)+'px'}}
  if(!D.length){box.innerHTML='<div class="sx-msg">Loading designs…</div>';await load(()=>{if(SR==null&&inp.value.trim()===q&&LOADED===1)render()})}
  await load();if(inp.value.trim()!==q||!box)return;
  if(innerWidth<=960){const r=f.getBoundingClientRect();box.style.top=(r.bottom+6)+'px'}
  const r=search(q),sg=suggest(q),u='/search/?q='+encodeURIComponent(q);let h='';
  if(sg.length)h+='<div class="sx-h">Categories</div>'+sg.map(s=>`<a role="option" class="sx-cat" href="${s.h}">${esc(s.t)}${s.n?`<small>${s.n.toLocaleString()}</small>`:''}</a>`).join('');
  if(r.total){h+=`<div class="sx-h">${r.partial?'Closest matches':'Designs'}</div>`+r.list.slice(0,6).map(d=>`<a role="option" href="/psd/${d.slug}/"><img src="${img(d)}" alt="" loading="lazy" decoding="async" width="56" height="40">${esc(d.t)}</a>`).join('')+`<a role="option" class="sx-all" href="${u}">See all ${r.total.toLocaleString()} results →</a>`}
  else h+='<div class="sx-msg">No designs found. Try “wedding album”, “karizma” or “12x36”.</div>';
  box.innerHTML=h;act=-1};
 const go=deb(render,110);
 const warm=()=>load();inp.addEventListener('focus',warm,{once:true});
 inp.addEventListener('input',()=>{if(SR)return liveSR(inp.value);go()});
 inp.addEventListener('keydown',e=>{const L=items();if(e.key==='ArrowDown'&&L.length){e.preventDefault();act=(act+1)%L.length;mark();L[act].scrollIntoView({block:'nearest'})}
  else if(e.key==='ArrowUp'&&L.length){e.preventDefault();act=(act-1+L.length)%L.length;mark();L[act].scrollIntoView({block:'nearest'})}
  else if(e.key==='Enter'&&act>=0&&L[act]){e.preventDefault();location.href=L[act].href}else if(e.key==='Escape'){close()}});
 document.addEventListener('click',e=>{if(box&&!f.contains(e.target))close()});
 if(inp.value&&document.activeElement===inp)go()});
/* search page */
let liveSR=()=>{};
if(SR){const sp=new URLSearchParams(location.search);let q=sp.get('q')||'',fc=sp.get('c')||'',fs=sp.get('s')||'',shown=30;
 const head=$('#cnt'),qv=$('#qv'),pg=$('#spg');let chips=$('#sxchips');if(!chips){chips=document.createElement('div');chips.id='sxchips';chips.className='sx-chips';SR.parentNode.insertBefore(chips,SR)}
 let note=$('#sxnote');if(!note){note=document.createElement('p');note.id='sxnote';note.className='sx-note';chips.parentNode.insertBefore(note,chips)}
 const pop=()=>`<div class="sx-pop">${M.cats.slice().sort((a,b)=>b[2]-a[2]).map(c=>`<a href="/category/${c[0]}/">${esc(c[1])}</a>`).join('')}</div>`;
 const url=()=>{const p=new URLSearchParams();if(q)p.set('q',q);if(fc)p.set('c',fc);if(fs)p.set('s',fs);history.replaceState(null,'',location.pathname+(p+''?'?'+p:''));document.title=(q?`“${q}” – `:'')+'Search Free Studio PSDs – PSD Album'};
 const draw=()=>{const t0=performance.now();qv.textContent=q;document.querySelectorAll('input[name=q]').forEach(i=>{if(i!==document.activeElement)i.value=q});
  if(!q.trim()){head.textContent=M.count.toLocaleString()+' designs';note.textContent='Type a search above, or browse a popular category:';chips.innerHTML='';SR.innerHTML=pop();pg.innerHTML='';return}
  const r=search(q,{c:fc,s:fs});
  head.textContent=r.total.toLocaleString()+' designs found';
  note.textContent=(r.dropped.length?`No designs match “${r.dropped.join(' ')}”, so it was ignored. `:'')+(r.partial?'No design matches every word; showing the closest matches. ':'')+(r.used.join(' ')!==toks(q).filter(x=>!STOP.has(x)).join(' ')&&r.terms?`Showing results for “${r.used.join(' ')}”.`:'');
  const cc=[...r.cats].sort((a,b)=>b[1]-a[1]),ss=[...r.sizes].sort((a,b)=>b[1]-a[1]).slice(0,8);
  chips.innerHTML=(cc.length>1||fc?cc.map(([c,n])=>`<button type="button" class="sx-chip" data-c="${M.cats[c][0]}" aria-pressed="${M.cats[c][0]===fc}">${esc(M.cats[c][1].replace(' PSD',''))}<small>${n}</small></button>`).join(''):'')+(ss.length>1||fs?ss.map(([s,n])=>`<button type="button" class="sx-chip" data-s="${s}" aria-pressed="${s===fs}">${s}<small>${n}</small></button>`).join(''):'');
  if(!r.total){SR.innerHTML=`<div class="empty-state"><div class="es-icon">🔍</div><h3>No designs found for “${esc(q)}”</h3><p>Try a shorter search such as “karizma”, “birthday” or “12x36”, or browse a popular category:</p>${pop()}</div>`;pg.innerHTML='';return}
  const card=d=>`<a class="design-card" href="/psd/${d.slug}/"><div class="card-thumb"><div class="wm-container"><img loading="lazy" decoding="async" src="${img(d)}" alt="${esc(d.t)}" width="${d.w}" height="${d.h}"></div></div><div class="pm-rel-t">${esc(d.t)}</div></a>`;
  SR.innerHTML=r.list.slice(0,shown).map(card).join('');
  pg.innerHTML=r.total>shown?`<button type="button" class="sx-more" id="sxmore">Show more designs (${(r.total-shown).toLocaleString()} left)</button>`:'';
  window.FSPS.last=performance.now()-t0;window.paintH&&window.paintH()};
 chips.addEventListener('click',e=>{const b=e.target.closest('.sx-chip');if(!b)return;if(b.dataset.c!=null){fc=fc===b.dataset.c?'':b.dataset.c}else{fs=fs===b.dataset.s?'':b.dataset.s}shown=30;url();draw()});
 pg.addEventListener('click',e=>{if(e.target.id==='sxmore'){shown+=30;draw()}});
 liveSR=deb(v=>{q=v.trim();fc='';fs='';shown=30;url();draw()},140);
 document.querySelectorAll('form[action="/search/"]').forEach(f=>f.addEventListener('submit',e=>{const i=f.querySelector('input[name=q]');if(i){e.preventDefault();q=i.value.trim();fc=fs='';shown=30;url();draw();i.blur()}}));
 head.textContent='Loading…';load(()=>{if(LOADED===1)draw()}).then(draw)}
})();
