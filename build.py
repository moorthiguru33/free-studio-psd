e=html.escape
exec(open('blog.py').read())
CSS=""":root{--p:#5b21b6;--p2:#7c3aed;--ink:#0f172a;--mut:#64748b;--bg:#f8fafc;--line:#e2e8f0}
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}a{color:inherit;text-decoration:none}img{display:block}
.hd{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid var(--line);box-shadow:0 1px 8px #0f172a0d}
.hd .r1{max-width:1280px;margin:auto;display:flex;align-items:center;gap:16px;padding:10px 18px}.logo{font-weight:800;font-size:21px;letter-spacing:-.5px;white-space:nowrap}.logo b{color:var(--p2)}
.hs{flex:1;display:flex;max-width:520px}.hs input{flex:1;border:1px solid var(--line);border-radius:10px 0 0 10px;padding:10px 14px;font-size:15px;outline:0;min-width:0}.hs button{border:0;background:var(--p2);color:#fff;padding:0 16px;border-radius:0 10px 10px 0;font-weight:600;cursor:pointer}
.hd .lk{display:flex;gap:16px;font-size:14px;color:var(--mut);font-weight:500}.nav{max-width:1280px;margin:auto;display:flex;gap:6px;overflow-x:auto;padding:0 18px 10px;scrollbar-width:none}.nav a{white-space:nowrap;font-size:13.5px;padding:6px 12px;border-radius:999px;background:#f1f5f9;color:#334155;font-weight:500}.nav a:hover,.nav a.on{background:var(--p2);color:#fff}
.pro{background:linear-gradient(90deg,#fde68a,#fbbf24);text-align:center;padding:8px 12px;font-size:14px;font-weight:600}.pro a{text-decoration:underline;color:#4c1d95}
.wrap{max-width:1280px;margin:auto;padding:0 18px}
.hero{background:radial-gradient(1200px 400px at 20% -10%,#a78bfa55,transparent),linear-gradient(135deg,#1e1b4b,#4c1d95 60%,#7c3aed);color:#fff;padding:56px 18px 64px;text-align:center}
.hero h1{font-size:clamp(28px,4.4vw,48px);line-height:1.1;margin:0 0 12px;letter-spacing:-1px}.hero p{color:#ddd6fe;font-size:18px;margin:0 auto 26px;max-width:680px}
.hero form{display:flex;max-width:640px;margin:auto;background:#fff;border-radius:14px;padding:6px;box-shadow:0 10px 40px #0005}.hero input{flex:1;border:0;padding:14px;font-size:16px;outline:0;border-radius:10px;min-width:0}.hero button{border:0;background:var(--p2);color:#fff;font-weight:700;padding:0 22px;border-radius:10px;font-size:15px;cursor:pointer}
.stats{display:flex;justify-content:center;gap:28px;margin-top:22px;color:#c4b5fd;font-size:14px;flex-wrap:wrap}.stats b{color:#fff;font-size:18px;display:block}
.sec{margin:40px 0}.sh{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-bottom:14px}.sh h2{margin:0;font-size:24px;letter-spacing:-.4px}.sh p{margin:2px 0 0;color:var(--mut);font-size:14px}.va{color:var(--p2);font-weight:700;font-size:14px;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}.row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(280px,1fr);gap:18px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory}.row .card{scroll-snap-align:start}
.card{background:#fff;border-radius:14px;overflow:hidden;border:1px solid var(--line);transition:transform .18s,box-shadow .18s;display:flex;flex-direction:column}.card:hover{transform:translateY(-4px);box-shadow:0 14px 30px #4c1d9522}
.card .im{position:relative;aspect-ratio:3/2;background:#e2e8f0;overflow:hidden}.card img{width:100%;height:100%;object-fit:cover}.badge{position:absolute;left:10px;top:10px;background:#16a34aee;color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}.badge.t{background:#f59e0bee}
.card .tx{padding:10px 12px 12px}.card h3{font-size:14px;margin:0 0 6px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.meta{font-size:12px;color:var(--mut);display:flex;justify-content:space-between}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chips a,.chips button{background:#fff;border:1px solid var(--line);padding:7px 13px;border-radius:999px;font-size:13.5px;cursor:pointer;color:#334155}.chips .on{background:var(--p2);color:#fff;border-color:var(--p2)}
.ad{background:#f1f5f9;border:1px dashed #cbd5e1;color:#94a3b8;text-align:center;padding:26px 10px;margin:26px 0;font-size:12px;border-radius:10px}.ad:before{content:"Advertisement";display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#16a34a;color:#fff;padding:15px 28px;border-radius:12px;font-weight:800;font-size:17px;border:0;cursor:pointer;box-shadow:0 6px 18px #16a34a44}.btn:hover{background:#15803d}.btn.full{width:100%}.btn2{background:var(--p2);color:#fff;border:0;padding:12px 22px;border-radius:10px;font-weight:700;cursor:pointer;font-size:15px}
.ph{padding:30px 0 10px}.ph h1{margin:0 0 6px;font-size:clamp(24px,3vw,34px);letter-spacing:-.6px}.ph p{color:var(--mut);margin:0;max-width:760px}.crumb{font-size:13px;color:var(--mut);margin-bottom:8px}.crumb a{color:var(--p2)}
.bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin:18px 0}.bar select{padding:9px 12px;border-radius:10px;border:1px solid var(--line);font-size:14px;background:#fff}
.dt{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,1fr);gap:28px;margin-top:10px}.dt .pv{background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px}.dt .pv img{width:100%;height:auto;border-radius:10px}
.panel{position:sticky;top:120px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;align-self:start}.panel h1{font-size:22px;margin:0 0 10px;line-height:1.25}.spec{width:100%;border-collapse:collapse;margin:14px 0;font-size:14px}.spec td{padding:8px 0;border-bottom:1px solid var(--line)}.spec td:last-child{text-align:right;font-weight:600}
.free{display:inline-block;background:#dcfce7;color:#166534;font-weight:700;font-size:12px;padding:3px 9px;border-radius:6px}.note{font-size:12.5px;color:var(--mut);margin-top:10px;text-align:center}
article{background:#fff;border:1px solid var(--line);padding:30px;border-radius:16px;line-height:1.8;max-width:820px;margin:20px 0}article h1{line-height:1.25}
.bcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}.bcards a{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;font-weight:600}.bcards a span{display:block;color:var(--mut);font-weight:400;font-size:13px;margin-top:6px}
footer{background:#0f172a;color:#94a3b8;padding:36px 18px;margin-top:50px;font-size:14px}footer .fc{max-width:1280px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}footer h4{color:#fff;margin:0 0 8px}footer a{display:block;color:#cbd5e1;padding:2px 0}
.pg{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:30px 0}.pg a,.pg span{min-width:42px;text-align:center;padding:9px 13px;border-radius:10px;background:#fff;border:1px solid var(--line);font-weight:600;font-size:14px}.pg a:hover{border-color:var(--p2);color:var(--p2)}.pg .on{background:var(--p2);color:#fff;border-color:var(--p2)}.pg .gap{border:0;background:none}
@media(max-width:860px){.dt{grid-template-columns:1fr}.panel{position:static}.hd .lk{display:none}.hero{padding:40px 16px 46px}.stats{gap:16px}}
@media(max-width:560px){.hs{display:none}.grid{grid-template-columns:repeat(2,1fr);gap:10px}.card h3{font-size:12.5px}.card .tx{padding:8px}.meta{font-size:11px}.row{grid-auto-columns:78%}.sh h2{font-size:19px}}"""
open(f'{S}/style.css','w').write(CSS)
CATS=sorted({(d['c'],d['cn']) for d in out},key=lambda x:-sum(d['c']==x[0] for d in out))
TN={k:h for k,(h,f) in TAGS.items()}
TCOUNT={k:sum(k in d['g'] for d in out) for k in TN}
TOK=[k for k in TN if TCOUNT[k]>=6]
nav=''.join(f'<a href="/category/{c}/">{e(n.replace(" PSD",""))}</a>' for c,n in CATS)+'<a href="/tag/karizma-album-psd/">Karizma</a><a href="/blog/">Guides</a>'
def page(path,title,desc,body,ld=None,img=None,noindex=False,head=''):
  url=SITE+path
  h=f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{url}">{head}{'<meta name="robots" content="noindex">' if noindex else ''}<meta property="og:type" content="website"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}">{f'<meta property="og:image" content="{SITE}{img}"><meta name="twitter:card" content="summary_large_image">' if img else ''}<meta name="theme-color" content="#4c1d95"><link rel="stylesheet" href="/style.css">
<!-- AdSense placeholder: <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script> -->
{f'<script type="application/ld+json">{json.dumps(ld)}</script>' if ld else ''}</head><body>
<header class="hd"><div class="r1"><a class="logo" href="/">Free<b>Studio</b>PSD</a><form class="hs" action="/search/"><input name="q" placeholder="Search wedding album, karizma, 12x36…" aria-label="Search"><button>Search</button></form><nav class="lk"><a href="/blog/">Guides</a><a href="/about/">About</a></nav></div><nav class="nav">{nav}</nav></header>
<div class="pro">⭐ Want 10,000+ premium designs? Explore <a href="https://tamilpsd.in" rel="noopener">TamilPSD Pro</a></div>
{body}
<footer><div class="fc"><div><h4>FreeStudioPSD</h4>Free layered Photoshop templates for photo studios, album designers and photographers. By Guru Moorthi.</div><div><h4>Categories</h4>{''.join(f'<a href="/category/{c}/">{e(n)}</a>' for c,n in CATS[:6])}</div><div><h4>Popular</h4>{''.join(f'<a href="/tag/{k}/">{e(TN[k])}</a>' for k in TOK[:6])}</div><div><h4>Site</h4><a href="/blog/">Guides</a><a href="/about/">About</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a></div></div><p style="text-align:center;margin-top:24px">&copy; 2026 FreeStudioPSD. All templates free to download.</p></footer>
<script src="/app.js" defer></script></body></html>"""
  os.makedirs(S+path,exist_ok=True); open(S+path+'index.html','w').write(h)
urls=[]
def P(path,*a,**k): urls.append(path); page(path,*a,**k)
def card(d,badge=''):
  b=f'<span class="badge{" t" if badge=="Trending" else ""}">{badge}</span>' if badge else ''
  return f'<a class="card" href="/psd/{d["slug"]}/"><div class="im">{b}<img loading="lazy" decoding="async" src="{d["img"]}" alt="{e(d["t"])}" width="480" height="320"></div><div class="tx"><h3>{e(d["t"])}</h3><div class="meta"><span>{e(d["cn"].replace(" PSD",""))}</span><span>{e(d["sz"])}</span></div></div></a>'
APP=r"""
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
const D=$('#dlbox');
if(D){(async()=>{const id=+new URLSearchParams(location.search).get('id');const s=Math.floor((id-1)/200);let d;try{d=(await (await fetch('/data/shard-'+s+'.json')).json()).find(x=>x.id===id)}catch(e){}
 if(!d){$('#t').textContent='Design not found.';return}$('#nm').innerHTML=`<a href="/psd/${d.slug}/"><img src="${d.img}" alt="" style="max-width:360px;width:100%;border-radius:12px;margin:auto"></a><p><b>${esc(d.t)}</b><br>${esc(d.dim)} · ${esc(d.sz)}</p>`;
 let c=15;const iv=setInterval(()=>{c--;$('#c').textContent=c;if(c<=0){clearInterval(iv);$('#t').textContent='Your download link is ready';const a=$('#dl');a.href='https://drive.google.com/uc?export=download&id='+d.fid;a.style.display='inline-flex'}},1000)})()}
"""
open(f'{S}/app.js','w').write(APP)
def lite(items,path):
  json.dump([{k:x[k] for k in ('id','slug','t','img','cn','sz','mb','q','g')} for x in items],open(S+path,'w'),separators=(',',':'))
def listing(items,src,filters=True):
  lite(items,src)
  fl=''
  if filters:
    fk=[k for k in TOK if 4<=sum(k in d['g'] for d in items)<len(items)]
    if fk: fl='<div class="chips" id="flt"><button class="on" data-f="">All</button>'+''.join(f'<button data-f="{k}">{e(TN[k].replace(" PSD Free Download","").replace(" PSD",""))}</button>' for k in fk[:12])+'</div>'
  first=''.join(card(d) for d in sorted(items,key=lambda x:-x['q'])[:24])
  return f'''<div class="bar">{fl}<div><span id="cnt" style="color:var(--mut);font-size:14px;margin-right:10px">{len(items)} designs</span><select id="sort" aria-label="Sort"><option value="r">Shuffle</option><option value="q">Best quality</option><option value="n">Newest</option><option value="s">Largest file</option><option value="a">A–Z</option></select></div></div>
<div class="grid" id="list" data-src="{src}">{first}</div><button class="btn2" id="more">Load more designs</button>'''
AD=lambda n:f'<div class="ad">{n}</div>'
# trending: 12x36 wedding/karizma, highest quality
pri=lambda d:(('karizma' in d['g'] or 'karizma-album-psd' in d['g']),d['c']=='wedding-album-12x36',d['q'])
best=sorted([d for d in out if d['c']=='wedding-album-12x36'],key=lambda d:('karizma-album-psd' in d['g'],d['q']),reverse=True)[:60]
trend=random.sample(best,16)
secs=''
for c,n in CATS:
  items=[d for d in out if d['c']==c]; pool=sorted(items,key=lambda x:-x['q'])[:40]; pk=random.sample(pool,min(12,len(pool)))
  secs+=f'<section class="sec"><div class="sh"><div><h2>{e(n)}</h2><p>{len(items)} free designs</p></div><a class="va" href="/category/{c}/">View all →</a></div><div class="grid" data-shuffle>{"".join(card(d) for d in pk)}</div></section>'
  if c==CATS[1][0]: secs+=AD('AdSense responsive placeholder')
web={"@context":"https://schema.org","@type":"WebSite","name":"FreeStudioPSD","url":SITE,"potentialAction":{"@type":"SearchAction","target":SITE+"/search/?q={q}","query-input":"required name=q"}}
P('/','Free Studio PSD Download – Wedding Album 12x36, Karizma & Birthday PSD',f'Download {len(out):,}+ free studio PSD templates: wedding album 12x36, Karizma album, album covers, backgrounds, birthday and baby albums. Layered, print-ready, no login.',
f'''<section class="hero"><h1>Free Studio PSD Templates<br>for Wedding &amp; Karizma Albums</h1><p>{len(out):,}+ layered, print-ready Photoshop designs for photographers and album designers. Free download — no login, no signup.</p>
<form action="/search/"><input name="q" placeholder="Try “karizma 12x36” or “birthday album”" aria-label="Search designs"><button>Search</button></form>
<div class="stats"><span><b>{len(out):,}+</b>Free PSDs</span><span><b>{len(CATS)}</b>Categories</span><span><b>12x36</b>Album ready</span><span><b>0</b>Login needed</span></div></section>
<div class="wrap"><section class="sec"><div class="sh"><div><h2>🔥 Best &amp; Trending PSDs</h2><p>Top-quality 12x36 wedding and Karizma album sheets</p></div><a class="va" href="/tag/karizma-album-psd/">View all →</a></div><div class="row" data-shuffle>{"".join(card(d,"Trending") for d in trend)}</div></section>
<section class="sec"><div class="sh"><h2>Popular searches</h2></div><div class="chips">{"".join(f'<a href="/tag/{k}/">{e(TN[k])} <small style="color:#94a3b8">{TCOUNT[k]}</small></a>' for k in TOK)}</div></section>
{secs}{AD('Adsterra / Monetag banner placeholder')}
<section class="sec"><div class="sh"><h2>Album design guides</h2><a class="va" href="/blog/">All guides →</a></div><div class="bcards">{"".join(f'<a href="/blog/{s}/">{e(t)}<span>{e(ps[0][:90])}…</span></a>' for s,t,ps in BLOG[:6])}</div></section></div>''',ld=web)
PER=30
def pager(base,cur,tot):
  if tot<2: return ''
  u=lambda p:base if p==1 else f'{base}page/{p}/'
  nums=sorted({1,tot,*range(max(1,cur-2),min(tot,cur+2)+1)}); h=[];last=0
  for p in nums:
    if p-last>1: h.append('<span class="gap">…</span>')
    h.append(f'<span class="on">{p}</span>' if p==cur else f'<a href="{u(p)}">{p}</a>'); last=p
  pv=f'<a rel="prev" href="{u(cur-1)}">‹ Prev</a>' if cur>1 else ''
  nx=f'<a rel="next" href="{u(cur+1)}">Next ›</a>' if cur<tot else ''
  return f'<nav class="pg" aria-label="Pagination">{pv}{"".join(h)}{nx}</nav>'
def paged(base,title,desc,h1,intro,items,crumb,ldname):
  items=sorted(items,key=lambda x:(-x['q'],x['id'])); tot=(len(items)+PER-1)//PER
  fk=[k for k in TOK if 4<=sum(k in d['g'] for d in items)<len(items) and f'/tag/{k}/'!=base]
  chips=('<div class="chips" style="margin:14px 0">'+''.join(f'<a href="/tag/{k}/">{e(TN[k])}</a>' for k in fk[:12])+'</div>') if fk else ''
  for p in range(1,tot+1):
    path=base if p==1 else f'{base}page/{p}/'
    hd=(f'<link rel="prev" href="{SITE}{base if p==2 else f"{base}page/{p-1}/"}">' if p>1 else '')+(f'<link rel="next" href="{SITE}{base}page/{p+1}/">' if p<tot else '')
    sfx='' if p==1 else f' – Page {p}'
    P(path,title+sfx,desc+('' if p==1 else f' Page {p} of {tot}.'),
     f'<div class="wrap"><div class="ph"><div class="crumb"><a href="/">Home</a> › {crumb}</div><h1>{e(h1)}{sfx}</h1><p>{intro}</p></div>{chips}{AD("AdSense leaderboard placeholder")}<p style="color:var(--mut);font-size:14px">Showing {(p-1)*PER+1}–{min(p*PER,len(items))} of {len(items)} designs</p><div class="grid">{"".join(card(d) for d in items[(p-1)*PER:p*PER])}</div>{AD("AdSense responsive placeholder")}{pager(base,p,tot)}</div>',
     ld={"@context":"https://schema.org","@type":"CollectionPage","name":h1+sfx,"url":SITE+path},head=hd)
for c,n in CATS:
  items=[d for d in out if d['c']==c]
  paged(f'/category/{c}/',f'{n} Free Download – {len(items)} Editable Templates',f'Browse {len(items)} free {n} files for photo studios. Layered, print-ready Photoshop templates, free to download with no login.',f'Free {n} Designs',f'{len(items)} editable {e(n)} files, sorted by preview quality. Download any design free.',items,e(n),n)
for k in TOK:
  h=TN[k]; items=[d for d in out if k in d['g']]
  paged(f'/tag/{k}/',f'{h} – {len(items)} Free Editable Templates',f'Download {len(items)} free {h.lower()} files. Layered Photoshop templates for photo studios, free with no login.',h,f'Browse {len(items)} free {e(h.lower())} designs. Every file is a layered PSD you can edit in Photoshop and send straight to print.',items,e(h),h)
lite(out,'/data/search.json')
page('/search/','Search Free Studio PSDs – FreeStudioPSD','Search free studio PSD templates.',f'<div class="wrap"><div class="ph"><h1>Results for “<span id="qv"></span>”</h1></div><p id="cnt" style="color:var(--mut)"></p><div class="grid" id="list" data-src="/data/search.json"></div><nav class="pg" id="spg"></nav></div>',noindex=True)
bycat={}
for d in out: bycat.setdefault(d['c'],[]).append(d)
for d in out:
  tg=''.join(f'<a href="/tag/{k}/">{e(TN[k])}</a>' for k in d['g'] if k in TOK)
  rel=random.sample(bycat[d['c']],min(13,len(bycat[d['c']]))); rel=[x for x in rel if x is not d][:12]
  ld={"@context":"https://schema.org","@type":"ImageObject","name":d['t'],"description":d['d'],"contentUrl":SITE+d['img'],"thumbnailUrl":SITE+d['img'],"encodingFormat":"image/webp","creator":{"@type":"Person","name":"Guru Moorthi"},"isAccessibleForFree":True}
  bc={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},{"@type":"ListItem","position":2,"name":d['cn'],"item":f"{SITE}/category/{d['c']}/"},{"@type":"ListItem","position":3,"name":d['t']}]}
  P(f"/psd/{d['slug']}/",f"{d['t']} | FreeStudioPSD",d['d'][:155],
   f'''<div class="wrap"><div class="crumb" style="margin-top:18px"><a href="/">Home</a> › <a href="/category/{d['c']}/">{e(d['cn'])}</a></div>
<div class="dt"><div><div class="pv"><img src="{d['img']}" alt="{e(d['t'])}" width="720" height="480" fetchpriority="high"></div>
<h2 style="margin-top:24px">About this design</h2><p>{e(d['d'])}</p><div class="chips">{tg}</div></div>
<aside class="panel"><span class="free">FREE PSD</span><h1>{e(d['t'])}</h1><table class="spec"><tr><td>Dimensions</td><td>{d['dim']}</td></tr><tr><td>Resolution</td><td>{d['dpi']}</td></tr><tr><td>File size</td><td>{d['sz']}</td></tr><tr><td>Format</td><td>Layered PSD (ZIP)</td></tr><tr><td>Category</td><td><a href="/category/{d['c']}/" style="color:var(--p2)">{e(d['cn'])}</a></td></tr></table>
<a class="btn full" href="/download/?id={d['id']}" rel="nofollow">⬇ Free Download</a><p class="note">No login required · Opens in Adobe Photoshop CC</p>{AD("AdSense 300×250 placeholder")}</aside></div>
<section class="sec"><div class="sh"><h2>More {e(d['cn'])} designs</h2><a class="va" href="/category/{d['c']}/">View all →</a></div><div class="grid">{''.join(card(x) for x in rel)}</div></section></div>''',ld=[ld,bc],img=d['img'])
page('/download/','Preparing your download – FreeStudioPSD','Your free PSD download is being prepared.',
f'''<div class="wrap" id="dlbox" style="text-align:center;max-width:760px"><div class="ph"><h1>Your free download is almost ready</h1></div>{AD("AdSense placeholder (top)")}<div id="nm"></div><p id="t" style="font-size:20px">Preparing your file… <b id="c">15</b>s</p>
<p><a class="btn" id="dl" style="display:none" rel="nofollow noopener" target="_blank">⬇ Download from Google Drive</a></p><p class="note">The file opens on Google Drive. Use the Drive download button if prompted.</p>{AD("Adsterra / Monetag placeholder")}{AD("AdSense placeholder (bottom)")}</div>''',noindex=True)
exec(open('blog.py').read())
bl=''
for s,t,ps in BLOG:
  others=[x for x in BLOG if x[0]!=s]; rg=random.sample(others,3); tk=random.sample(TOK,3)
  P(f'/blog/{s}/',t+' – FreeStudioPSD',ps[0][:155],f'<div class="wrap"><article><div class="crumb"><a href="/blog/">Guides</a></div><h1>{e(t)}</h1>'+''.join(f'<p>{e(p)}</p>' for p in ps)+
   f'{AD("AdSense in-article placeholder")}<h3>Free templates to practise with</h3><p>'+' · '.join(f'<a style="color:var(--p2)" href="/tag/{k}/">{e(TN[k])}</a>' for k in tk)+'</p><h3>Related guides</h3><ul>'+''.join(f'<li><a style="color:var(--p2)" href="/blog/{x[0]}/">{e(x[1])}</a></li>' for x in rg)+'</ul></article></div>',
   ld={"@context":"https://schema.org","@type":"Article","headline":t,"author":{"@type":"Person","name":"Guru Moorthi"},"datePublished":"2026-10-16"})
P('/blog/','Album Design Guides & Photoshop Tutorials – FreeStudioPSD','Free guides on editing wedding album PSDs, album sizes, Karizma design tips and print settings.',f'<div class="wrap"><div class="ph"><h1>Album Design Guides</h1><p>{len(BLOG)} practical guides for photographers and album designers.</p></div><div class="bcards">'+''.join(f'<a href="/blog/{s}/">{e(t)}<span>{e(ps[0][:100])}…</span></a>' for s,t,ps in BLOG)+'</div></div>')
ST={'about':('About FreeStudioPSD','<p>FreeStudioPSD is run by Guru Moorthi to help photographers and studios find free, editable Photoshop templates for wedding albums, Karizma albums, birthday albums, covers and backgrounds.</p><p>All files are free to download without login.</p>'),
'privacy':('Privacy Policy','<p>We do not require accounts and do not collect personal data directly. Third-party advertising partners (such as Google AdSense) may use cookies to show relevant ads. You can manage cookies in your browser settings.</p><p>Downloads are served from Google Drive, which is subject to Google\'s privacy policy.</p>'),
'terms':('Terms of Use','<p>Templates are provided free for personal and studio client work. Do not resell or redistribute the files as your own template packs. Files are provided as-is without warranty.</p>'),
'contact':('Contact Us','<p>Email: <b>contact@example.com</b> (placeholder)</p><form onsubmit="alert(\'Contact form coming soon.\');return false"><p><input placeholder="Your name" required style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:10px"></p><p><input type="email" placeholder="Your email" required style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:10px"></p><p><textarea placeholder="Message" rows="5" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:10px"></textarea></p><button class="btn2">Send message</button></form>')}
for k,(t,b) in ST.items(): P(f'/{k}/',t+' – FreeStudioPSD',t+' for FreeStudioPSD, free studio PSD downloads.',f'<div class="wrap"><article><h1>{t}</h1>{b}</article></div>')
H='<?xml version="1.0" encoding="UTF-8"?>'
for f in glob.glob(f'{S}/sitemap*.xml'): os.remove(f)
ch=[urls[i:i+5000] for i in range(0,len(urls),5000)]
for n,c in enumerate(ch): open(f'{S}/sitemap-{n+1}.xml','w').write(H+'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{SITE}{u}</loc><lastmod>2026-10-16</lastmod></url>' for u in c)+'</urlset>')
open(f'{S}/sitemap.xml','w').write(H+'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<sitemap><loc>{SITE}/sitemap-{n+1}.xml</loc></sitemap>' for n in range(len(ch)))+'</sitemapindex>')
open(f'{S}/robots.txt','w').write(f'User-agent: *\nDisallow: /download/\nDisallow: /search/\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
open(f'{S}/_headers','w').write('/img/*\n  Cache-Control: public, max-age=31536000, immutable\n/data/*\n  Cache-Control: public, max-age=3600\n/download/*\n  X-Robots-Tag: noindex\n')
print('designs',len(out),'tags',len(TOK),'cats',len(CATS),'urls',len(urls),'files',sum(len(f) for _,_,f in os.walk(S)))
