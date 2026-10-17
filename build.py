e=html.escape
def crumbs(items):
  return {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":SITE+u} for i,(n,u) in enumerate(items)]}
LANDMAP={'karizma-album-psd':'karizma-album-psd','wedding-album-12x36-psd-free-download':'12x36-wedding-album-psd-free-download','tamil-wedding-album-psd':'tamil-wedding-album-psd','birthday-album-psd-free-download':'birthday-album-psd','baby-album-psd':'baby-album-psd','muslim-wedding-album-psd':'muslim-wedding-album-psd','pre-wedding-album-psd':'pre-wedding-album-psd','engagement-album-psd':'engagement-album-psd','album-cover-psd-free-download':'album-cover-psd','wedding-album-background-psd':'album-background-psd','12x30-album-psd':'12x30-album-psd','12x18-album-psd':'12x18-album-psd','18x24-album-psd':'18x24-album-psd','wedding-invitation-psd':'wedding-invitation-psd','studio-backdrop-psd':'studio-background-psd'}
from urllib.parse import quote
exec(open('blog.py').read());exec(open('blog2.py').read());exec(open('landing.py').read())
CSS=open('ui/style.css').read().replace('\n','')
open(f'{S}/style.css','w').write(CSS)
CATS=sorted({(d['c'],d['cn']) for d in out},key=lambda x:-sum(d['c']==x[0] for d in out))
TN={k:h for k,(h,f) in TAGS.items()}
TCOUNT={k:sum(k in d['g'] for d in out) for k in TN}
TOK=[k for k in TN if TCOUNT[k]>=6]
nav=''.join(f'<a href="/category/{c}/">{e(n.replace(" PSD",""))}</a>' for c,n in CATS)+'<a href="/tag/karizma-album-psd/">Karizma</a>'
LBL={'wedding-album-12x36':'12x36 Album','album-12x30':'12x30 Album','album-18x24':'18x24 Album','album-12x18':'12x18 Album','album-cover':'Album Cover','album-background':'Background','studio-background':'Studio BG','birthday-baby-album':'Birthday','wedding-invitation':'Invitation'}
SVG_S='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
MARK='<svg viewBox="0 0 24 24" fill="none" stroke="#f6d58e" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6l1.5-2.5h5L16 6"/><circle cx="12" cy="13" r="3.6"/></svg>'
TABS=[('/','Home','<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),('/search/?q=album','Search','<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),('/browse/','Categories','<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),('/favourites/','Saved','<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),('/blog/','Guides','<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>')]
def tabs(path):
  return '<nav class="tabs" aria-label="Main">'+''.join(f'<a href="{u}"{" class=on" if (u=="/" and path=="/") or (u!="/" and path.startswith(u.split("?")[0]) and u!="/search/?q=album") else ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">{ic}</svg>{t}</a>' for u,t,ic in TABS)+'</nav>'
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Manrope:wght@400;600;700;800&display=swap" media="print" onload="this.media=\'all\'">'

def page(path,title,desc,body,ld=None,img=None,noindex=False,head='',canon=None,lb=True):
  url=SITE+path; cu=canon or url
  h=f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{cu}"><link rel="alternate" hreflang="en-IN" href="{url}"><link rel="alternate" hreflang="x-default" href="{url}">{head}{'<meta name="robots" content="noindex">' if noindex else ''}<meta property="og:type" content="website"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}{img or '/og.png'}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#FAF7F2">{FONTS}<style>{CSS}</style>
<!-- Google Search Console: <meta name="google-site-verification" content="REPLACE_ME"> -->
<!-- Bing Webmaster: <meta name="msvalidate.01" content="REPLACE_ME"> -->
<!-- Ads: all ad code is configured in /ads.json and lazy-loaded by /app.js -->
{f'<script type="application/ld+json">{json.dumps(ld)}</script>' if ld else ''}</head><body>
<header class="hd"><div class="r1"><a class="logo" href="/"><span class="mk">{MARK}</span><span class="nm">Free<b>Studio</b>PSD<small>Free studio PSD library</small></span></a><nav class="mn" aria-label="Primary"><a href="/"{' class=on' if path=='/' else ''}>Home</a><a href="/browse/"{' class=on' if path.startswith('/browse') else ''}>Categories</a><a href="/blog/"{' class=on' if path.startswith('/blog') else ''}>Guides</a><a href="/favourites/">♡ Saved</a><a class="gl" href="https://tamilpsd.in" rel="noopener">★ Pro</a></nav><form class="hs" action="/search/" role="search">{SVG_S}<input name="q" autocomplete="off" class="iq" placeholder="Search designs, e.g. karizma 12x36, birthday album" aria-label="Search designs"></form><button class="ib" id="sbtn" type="button" aria-label="Search">{SVG_S}</button></div><nav class="cn" aria-label="Categories">{nav}</nav></header>
{('<div class="wrap">'+AD('leaderboard')+'</div>') if lb else ''}
{body}
<footer><div class="fc"><div><p class="fh">FreeStudioPSD</p>Free layered Photoshop templates for photo studios, album designers and photographers. By Guru Moorthi.</div><div><p class="fh">Categories</p>{''.join(f'<a href="/category/{c}/">{e(n)}</a>' for c,n in CATS[:6])}</div><div><p class="fh">Popular</p>{''.join(f'<a href="/tag/{k}/">{e(TN[k])}</a>' for k in TOK[:6])}</div><div><p class="fh">Site</p><a href="/browse/">Browse all</a><a href="/favourites/">Favourites</a><a href="/blog/">Guides</a><a href="/about/">About</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a></div></div><p style="text-align:center;margin-top:24px">&copy; 2026 FreeStudioPSD. All templates free to download.</p></footer>
{tabs(path)}<script src="/app.js?v=5" defer></script></body></html>"""
  os.makedirs(S+path,exist_ok=True); open(S+path+'index.html','w').write(h)
urls=[]
def P(path,*a,**k):
  if not k.get('noindex') and not k.get('canon'): urls.append(path)
  page(path,*a,**k)
def card(d,badge=''):
  lb=f'<span class="lb t">{badge}</span>' if badge else f'<span class="lb">{e(LBL.get(d["c"],d["cn"].replace(" PSD","")))}</span>'
  return f'<div class="card"><a class="im" href="/psd/{d["slug"]}/">{lb}<img loading="lazy" decoding="async" src="{d["img"]}" alt="{e(d["t"])}" width="{d["w"]}" height="{d["h"]}"></a><button class="hb" type="button" data-id="{d["id"]}" aria-label="Save to favourites">♥</button><a class="tx" href="/psd/{d["slug"]}/"><h3>{e(d["t"])}</h3><span class="meta"><span>{e(d["cn"].replace(" PSD",""))}</span><span>{e(d["sz"])}</span></span></a></div>'
APP=open('ui/app.js').read()
open(f'{S}/app.js','w').write(APP)
def lite(items,path):
  json.dump([{k:x[k] for k in ('id','slug','t','img','c','cn','sz','mb','q','g','w','h')} for x in items],open(S+path,'w'),separators=(',',':'))
def listing(items,src,filters=True):
  lite(items,src)
  fl=''
  if filters:
    fk=[k for k in TOK if 4<=sum(k in d['g'] for d in items)<len(items)]
    if fk: fl='<div class="chips" id="flt"><button class="on" data-f="">All</button>'+''.join(f'<button data-f="{k}">{e(TN[k].replace(" PSD Free Download","").replace(" PSD",""))}</button>' for k in fk[:12])+'</div>'
  first=''.join(card(d) for d in sorted(items,key=lambda x:-x['q'])[:24])
  return f'''<div class="bar">{fl}<div><span id="cnt" style="color:var(--mut);font-size:14px;margin-right:10px">{len(items)} designs</span><select id="sort" aria-label="Sort"><option value="r">Shuffle</option><option value="q">Best quality</option><option value="n">Newest</option><option value="s">Largest file</option><option value="a">A–Z</option></select></div></div>
<div class="grid" data-src="{src}">{first}</div>'''
SLOTS=['leaderboard','infeed','sidebar','anchor','incontent','countdown_top','countdown_mid','countdown_bottom','inarticle']
def AD(n):
  s=n if n in SLOTS else ('leaderboard' if 'leaderboard' in n.lower() else 'sidebar' if '300' in n else 'infeed' if 'native' in n.lower() else 'inarticle' if 'article' in n.lower() else 'incontent')
  return f'<div class="ad ad-{s}" data-slot="{s}"><span class="adl">Advertisement</span><div class="adc"></div></div>'
def LAY(main):
  return f'<div class="lay"><div class="lmain">{main}</div><aside class="sb" aria-label="Advertisement">{AD("sidebar")}</aside></div>'
def GRID(items,every=12):
  h=''
  for i,d in enumerate(items):
    h+=card(d)
    if (i+1)%every==0 and i+1<len(items): h+=AD('infeed')
  return f'<div class="grid">{h}</div>'
PER=30
# trending: 12x36 wedding/karizma, highest quality
best=sorted([d for d in out if d['c']=='wedding-album-12x36'],key=lambda d:('karizma-album-psd' in d['g'],d['q']),reverse=True)[:60]
trend=random.sample(best,16)
CSUB={'wedding-album-12x36':'Karizma & 12x36 wedding album sheets','album-background':'Textures & backdrops for album spreads','album-cover':'Front covers for 12x18 & 12x36 albums','studio-background':'HD backdrops for portrait studios','birthday-baby-album':'Kids, baby & 1st birthday albums','album-12x30':'Compact panoramic album sheets','album-18x24':'Large-format coffee-table albums','wedding-invitation':'Invitations & save-the-dates','album-12x18':'Small albums & parent books'}
CIC={'wedding-album-12x36':'12×36','album-background':'BG','album-cover':'CV','studio-background':'ST','birthday-baby-album':'BD','album-12x30':'12×30','album-18x24':'18×24','wedding-invitation':'INV','album-12x18':'12×18'}
ccs=''
for n_,(c,n) in enumerate(CATS):
  items=sorted([d for d in out if d['c']==c],key=lambda x:-x['q'])
  _l=[d for d in items if d['w']>=d['h']*1.25]; _p=(_l if len(_l)>=4 else items)[:12]; _p=random.Random(c).sample(_p,min(4,len(_p)))
  q4=''.join(f'<img {"loading=lazy " if n_>2 else ""}decoding="async" src="{d["img"]}" alt="{e(d["t"])}" width="360" height="240">' for d in _p)
  ccs+=f'<div class="cc t{n_%9+1}"><a class="ct" href="/category/{c}/"><span class="ic">{CIC.get(c,"PSD")}</span><span><h3>{e(n.replace(" PSD",""))}</h3><p>{len(items):,} free designs · {e(CSUB.get(c,""))}</p></span></a><a class="q4" href="/category/{c}/" tabindex="-1" aria-hidden="true">{q4}</a><a class="vb" href="/category/{c}/">View All →</a></div>'
_rs=random.Random(7); feed=_rs.sample(sorted(out,key=lambda x:-x['q'])[:900],30)
feedinit=json.dumps([{k:x[k] for k in ('id','slug','t','img','c','cn','sz','w','h')} for x in feed],separators=(',',':')).replace('</','<\\/')
def homepager():
  tot=(len(out)+PER-1)//PER; u=lambda p:'/designs/' if p==1 else f'/designs/page/{p}/'
  nums=sorted({1,2,3,4,5,tot}); h=[];last=0
  for p in nums:
    if p>tot: continue
    if p-last>1: h.append('<span class="gap">…</span>')
    h.append(f'<a href="{u(p)}">{p}</a>'); last=p
  return f'<p style="text-align:center;margin:22px 0 0;font-weight:700">Browse all {len(out):,} designs page by page</p><nav class="pg" aria-label="All designs pages">{"".join(h)}<a href="{u(2)}">Next ›</a></nav>'
web={"@context":"https://schema.org","@type":"WebSite","name":"FreeStudioPSD","url":SITE,"potentialAction":{"@type":"SearchAction","target":SITE+"/search/?q={q}","query-input":"required name=q"}}
P('/','Free Studio PSD Download – Wedding Album 12x36, Karizma & Birthday PSD',f'Download {len(out):,}+ free studio PSD templates: wedding album 12x36, Karizma album, album covers, backgrounds, birthday and baby albums. Layered, print-ready, no login.',
f'''<div class="wrap"><section class="intro"><p class="eyb">Free studio PSD library</p><h1>Free Studio PSD Templates for Wedding &amp; Karizma Albums</h1><p>{len(out):,}+ layered, print-ready Photoshop designs for photographers and album designers. Free download, no login, no signup.</p></section>
<section class="sec"><div class="sh"><div><p class="eyb">Categories</p><h2>Browse by category</h2></div><a class="va" href="/browse/">All categories →</a></div><div class="ccards">{ccs}</div></section>
<section class="sec" id="rv" hidden><div class="sh"><h2>Continue where you left off</h2><a class="va" href="/favourites/">My favourites →</a></div><div class="row" id="rvl"></div></section>
<section class="sec"><div class="sh"><div><p class="eyb">Hand-picked</p><h2>Best &amp; trending PSDs</h2></div><a class="va" href="/tag/karizma-album-psd/">View all →</a></div><div class="row">{"".join(card(d,"Trending") for d in trend)}</div></section>
<section class="sec"><div class="bar"><span class="pill">{len(out):,} designs</span><select class="pill" id="fsort" aria-label="Sort designs"><option value="s">🎲 Daily shuffle</option><option value="n">Newest</option><option value="q">Best quality</option><option value="m">Largest file</option></select><button class="pill" id="hshuf" type="button">Shuffle again</button><a class="pill" href="/favourites/">❤ Favourites</a></div>
{LAY(f'<div class="grid" id="feed">{"".join(card(d) for d in feed[:12])}{AD("infeed")}{"".join(card(d) for d in feed[12:24])}{AD("infeed")}{"".join(card(d) for d in feed[24:])}</div><script type="application/json" id="feedinit">{feedinit}</script>{homepager()}')}</section>
<section class="sec"><div class="sh"><h2>Popular searches</h2></div><div class="chips">{"".join(f'<a href="/tag/{k}/">{e(TN[k])} <small>{TCOUNT[k]}</small></a>' for k in TOK)}</div></section>
<section class="sec"><div class="sh"><h2>Top collections</h2><a class="va" href="/browse/">Browse all →</a></div><div class="chips">{''.join(f'<a href="/{x[0]}/">{e(x[1])}</a>' for x in LAND)}</div></section>
<section class="sec"><div class="sh"><h2>Album design guides</h2><a class="va" href="/blog/">All guides →</a></div><div class="bcards">{"".join(f'<a href="/blog/{s}/">{e(t)}<span>{e(ps[0][:90])}…</span></a>' for s,t,ps in BLOG[:6])}</div></section></div>''',ld=web)
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
def faq(h,n):
  qa=[(f'Are these {h} files really free?',f'Yes. All {n} {h} designs on FreeStudioPSD are free to download with no login or signup.'),
      (f'Which software opens {h} files?','The files are layered PSDs. Open them in Adobe Photoshop CC or any editor that supports PSD layers.'),
      ('How do I replace the photos?','Place your photo above the frame layer and press Alt+Ctrl+G (Option+Cmd+G on Mac) to clip it into the mask, then resize with Ctrl+T.'),
      ('Can I use these designs for client albums?','Yes, you can use them for personal and studio client work. Reselling the files as template packs is not allowed.')]
  FAQH.append(qa)
  return {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in qa]}
FAQH=[]
def faqhtml(h,n):
  q=faq(h,n)['mainEntity']
  return '<section class="sec faq"><h2>Frequently asked questions</h2>'+''.join(f'<details><summary>{e(x["name"])}</summary><p>{e(x["acceptedAnswer"]["text"])}</p></details>' for x in q)+'</section>'
HUBLINK='<p style="text-align:center"><a class="va" href="/browse/">Browse all categories, sizes and styles →</a></p>'
def paged(base,title,desc,h1,intro,items,crumb,ldname,canon=None):
  items=sorted(items,key=lambda x:(-x['q'],x['id'])); tot=(len(items)+PER-1)//PER
  fk=[k for k in TOK if 4<=sum(k in d['g'] for d in items)<len(items) and f'/tag/{k}/'!=base]
  chips=('<div class="chips" style="margin:14px 0">'+''.join(f'<a href="/tag/{k}/">{e(TN[k])}</a>' for k in fk[:12])+'</div>') if fk else ''
  for p in range(1,tot+1):
    path=base if p==1 else f'{base}page/{p}/'
    hd=(f'<link rel="prev" href="{SITE}{base if p==2 else f"{base}page/{p-1}/"}">' if p>1 else '')+(f'<link rel="next" href="{SITE}{base}page/{p+1}/">' if p<tot else '')
    sfx='' if p==1 else f' – Page {p}'
    P(path,title+sfx,desc+('' if p==1 else f' Page {p} of {tot}.'),
     f'<div class="wrap"><div class="crumb"><a href="/">Home</a> › <span>{crumb}</span></div><div class="ph"><h1>{e(h1)}{sfx}</h1><p>{intro}</p></div>{chips}'+LAY(f'<p style="color:var(--mut);font-size:13.5px;margin:10px 0 14px">Showing {(p-1)*PER+1}–{min(p*PER,len(items))} of {len(items)} designs</p>{GRID(items[(p-1)*PER:p*PER])}{pager(base,p,tot)}{faqhtml(h1,len(items)) if p==1 else ""}{HUBLINK}')+'</div>',     ld=[{"@context":"https://schema.org","@type":"CollectionPage","name":h1+sfx,"url":SITE+path},crumbs([('Home','/'),(ldname,base)])]+([faq(h1,len(items))] if p==1 else []),head=hd,canon=(canon if p==1 else None),noindex=len(items)<12)
    if p==1: pass
for c,n in CATS:
  items=[d for d in out if d['c']==c]
  paged(f'/category/{c}/',f'{n} Free Download – {len(items)} Editable Templates',f'Browse {len(items)} free {n} files for photo studios. Layered, print-ready Photoshop templates, free to download with no login.',f'Free {n} Designs',f'{len(items)} editable {e(n)} files, sorted by preview quality. Download any design free.',items,e(n),n)
for k in TOK:
  h=TN[k]; items=[d for d in out if k in d['g']]
  paged(f'/tag/{k}/',f'{h} – {len(items)} Free Editable Templates',f'Download {len(items)} free {h.lower()} files. Layered Photoshop templates for photo studios, free with no login.',h,TINTRO.get(k) or f'Browse {len(items)} free {e(h.lower())} designs. Every file is a layered PSD you can edit in Photoshop and send straight to print.',items,e(h),h,canon=(f'{SITE}/{LANDMAP[k]}/' if k in LANDMAP else None))
paged('/designs/',f'All Free Studio PSD Designs – {len(out):,} Editable Templates',f'Browse all {len(out):,} free studio PSD templates page by page: wedding albums, Karizma, covers, backgrounds and birthday albums. Free download, no login.','All Free Studio PSD Designs',f'Every free design on FreeStudioPSD, {len(out):,} layered PSDs, sorted by preview quality. 30 designs per page.',out,'All designs','All designs')
lite(out,'/data/search.json')
page('/search/','Search Free Studio PSDs – FreeStudioPSD','Search free studio PSD templates.',f'<div class="wrap"><div class="ph"><p class="eyb">Search</p><h1>Results for “<span id="qv"></span>”</h1></div><p id="cnt" class="pill" style="display:inline-flex"></p>'+LAY('<div class="grid" id="list" data-src="/data/search.json" style="margin-top:14px"></div><nav class="pg" id="spg"></nav>')+f'<div id="se" class="empty" hidden><b>No designs match your search</b><p>Try fewer words or one of these popular searches:</p><div class="chips" style="justify-content:center">'+''.join(f'<a href="/tag/{k}/">{e(TN[k])}</a>' for k in TOK[:8])+'</div></div></div>',noindex=True)
exec(open('dpage.py').read())
landing_pages()
exec(open('blog.py').read());exec(open('blog2.py').read())
bl=''
for s,t,ps in BLOG:
  others=[x for x in BLOG if x[0]!=s]; rg=random.sample(others,3); tk=random.sample(TOK,3)
  _ps=[f'<p>{e(p)}</p>' for p in ps]
  if len(_ps)>3: _ps.insert(2,AD('inarticle'))
  P(f'/blog/{s}/',t+' – FreeStudioPSD',ps[0][:155],'<div class="wrap">'+LAY(f'<article><div class="crumb"><a href="/">Home</a> › <a href="/blog/">Guides</a></div><h1>{e(t)}</h1>'+''.join(_ps)+
   f'{AD("inarticle")}<h3>Free templates to practise with</h3><p>'+' · '.join(f'<a style="color:var(--p2)" href="/tag/{k}/">{e(TN[k])}</a>' for k in tk)+'</p><h3>Related guides</h3><ul>'+''.join(f'<li><a style="color:var(--p2)" href="/blog/{x[0]}/">{e(x[1])}</a></li>' for x in rg)+'</ul></article>')+'</div>',
   ld=[{"@context":"https://schema.org","@type":"Article","headline":t,"author":{"@type":"Person","name":"Guru Moorthi"},"datePublished":"2026-10-16","dateModified":"2026-10-16","publisher":{"@type":"Organization","name":"FreeStudioPSD"}},crumbs([('Home','/'),('Guides','/blog/'),(t,f'/blog/{s}/')])])
P('/blog/','Album Design Guides & Photoshop Tutorials – FreeStudioPSD','Free guides on editing wedding album PSDs, album sizes, Karizma design tips and print settings.',f'<div class="wrap"><div class="ph"><p class="eyb">Guides</p><h1>Album Design Guides</h1><p>{len(BLOG)} practical guides for photographers and album designers.</p></div><div class="bcards">'+''.join(f'<a href="/blog/{s}/">{e(t)}<span>{e(ps[0][:100])}…</span></a>' for s,t,ps in BLOG)+'</div></div>')
ST={'about':('About FreeStudioPSD','<p>FreeStudioPSD is run by Guru Moorthi to help photographers and studios find free, editable Photoshop templates for wedding albums, Karizma albums, birthday albums, covers and backgrounds.</p><p>All files are free to download without login.</p>'),
'privacy':('Privacy Policy','<p>We do not require accounts and do not collect personal data directly. Third-party advertising partners (such as Google AdSense) may use cookies to show relevant ads. You can manage cookies in your browser settings.</p><p>Downloads are served from Google Drive, which is subject to Google\'s privacy policy.</p>'),
'terms':('Terms of Use','<p>Templates are provided free for personal and studio client work. Do not resell or redistribute the files as your own template packs. Files are provided as-is without warranty.</p>'),
'contact':('Contact Us','<p>Email: <b>contact@example.com</b> (placeholder)</p><form onsubmit="alert(\'Contact form coming soon.\');return false"><p><input placeholder="Your name" required style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:10px"></p><p><input type="email" placeholder="Your email" required style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:10px"></p><p><textarea placeholder="Message" rows="5" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:10px"></textarea></p><button class="btn2">Send message</button></form>')}
for k,(t,b) in ST.items(): P(f'/{k}/',t+' – FreeStudioPSD',t+' for FreeStudioPSD, free studio PSD downloads.',f'<div class="wrap"><article><h1>{t}</h1>{b}</article></div>')
page('/404-tmp/','Page not found – FreeStudioPSD','Page not found.','<div class="wrap" style="text-align:center;padding:60px 0"><h1 style="font-size:64px;margin:0;color:var(--p2)">404</h1><h2>Sorry, this page could not be found</h2><p>Try searching or browse our most popular categories.</p><form action="/search/" style="max-width:480px;margin:20px auto;display:flex;gap:8px"><input name="q" placeholder="Search PSDs" style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:10px"><button class="btn2">Search</button></form><div class="chips" style="justify-content:center">'+''.join(f'<a href="/category/{c}/">{e(n)}</a>' for c,n in CATS)+'</div></div>',noindex=True)
shutil.move(f'{S}/404-tmp/index.html',f'{S}/404.html'); shutil.rmtree(f'{S}/404-tmp')
open(f'{S}/favicon.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#6d28d9"/><text x="32" y="42" font-family="Arial" font-weight="700" font-size="26" fill="#fff" text-anchor="middle">PSD</text></svg>')
from PIL import ImageDraw,ImageFont
og=Image.new('RGB',(1200,630),'#3b1a8f');dr=ImageDraw.Draw(og)
for i,d in enumerate(trend[:6]):
  t=Image.open('media'+d['img']).convert('RGB');t.thumbnail((380,250));og.paste(t,(20+(i%3)*395,330+(i//3)*0) if i<3 else (20+(i%3)*395,330))
try: F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',64);F2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',32)
except: F=F2=ImageFont.load_default()
dr.text((60,90),'FreeStudioPSD',font=F,fill='#fff');dr.text((60,180),f'{len(out):,}+ free wedding & Karizma album PSDs',font=F2,fill='#ddd6fe');dr.text((60,230),'No login. Free download.',font=F2,fill='#fde68a')
og.save(f'{S}/og.png',optimize=True)
H='<?xml version="1.0" encoding="UTF-8"?>'
for f in glob.glob(f'{S}/sitemap*.xml'): os.remove(f)
ch=[urls[i:i+5000] for i in range(0,len(urls),5000)]
for n,c in enumerate(ch): open(f'{S}/sitemap-{n+1}.xml','w').write(H+'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{SITE}{u}</loc><lastmod>2026-10-16</lastmod></url>' for u in c)+'</urlset>')
open(f'{S}/sitemap-images.xml','w').write(H+'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+''.join(f'<url><loc>{SITE}/psd/{d["slug"]}/</loc><image:image><image:loc>{SITE}{d.get("zm",d["img"])}</image:loc></image:image></url>' for d in out)+'</urlset>')
open(f'{S}/sitemap.xml','w').write(H+'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<sitemap><loc>{SITE}/sitemap-{n+1}.xml</loc><lastmod>2026-10-16</lastmod></sitemap>' for n in range(len(ch)))+f'<sitemap><loc>{SITE}/sitemap-images.xml</loc><lastmod>2026-10-16</lastmod></sitemap></sitemapindex>')
import secrets
if not os.path.exists('indexnow.key'): open('indexnow.key','w').write(secrets.token_hex(16))
IK=open('indexnow.key').read().strip(); open(f'{S}/{IK}.txt','w').write(IK)
shutil.copy('ads.txt',f'{S}/ads.txt') if os.path.exists('ads.txt') else open(f'{S}/ads.txt','w').write('# ads.txt placeholder – replace with your real lines, e.g.\n# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n')
shutil.copy('ads.json',f'{S}/ads.json')
open(f'{S}/robots.txt','w').write(f'User-agent: *\nDisallow: /download/\nDisallow: /search/\nDisallow: /_tpl/\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
open(f'{S}/_headers','w').write('/img/*\n  Cache-Control: public, max-age=31536000, immutable\n/data/*\n  Cache-Control: public, max-age=3600\n/download/*\n  X-Robots-Tag: noindex\n')
print('designs',len(out),'tags',len(TOK),'cats',len(CATS),'urls',len(urls),'files',sum(len(f) for _,_,f in os.walk(S)))
