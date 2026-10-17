# v6 presentation layer: tamilpsd.in DOM/classes, PSD Album brand. exec'd from build.py
os.makedirs(f'{S}/css',exist_ok=True)
import time
ADCFG=json.load(open('ads.json')) if os.path.exists('ads.json') else {}
ADON=bool(ADCFG.get('enabled'))  # ads off -> no ad markup at all (no empty boxes for reviewers/users)
ANCFG=json.load(open('analytics.json')) if os.path.exists('analytics.json') else {}
CFWA=(ANCFG.get('cf_web_analytics_token') or '').strip()
BEACON=(f'<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{{"token": "{CFWA}"}}\'></script>' if CFWA else '')
BUILD_DATE=time.strftime('%Y-%m-%d')
CONTACT='contact@psdalbum.in'
exec(open('ui6/purge.py').read())
_SRC=[open(f).read() for f in ['ui6/pres.py','dpage.py','landing.py','build.py','blog.py','blog2.py','ui6/app.js','functions/psd/[[slug]].js']]
TPCSS=purge(open('ui6/tp.css').read().replace('.footer-col h4','.footer-col .fh4'),used_tokens([],_SRC)); FSPCSS=open('ui6/fsp.css').read()
CSSV=str(abs(hash(TPCSS+FSPCSS))%10**8)
open(f'{S}/css/site.css','w').write(TPCSS+FSPCSS)
for f in glob.glob(f'{S}/style.css'): os.remove(f)
CATS=sorted({(d['c'],d['cn']) for d in out},key=lambda x:-sum(d['c']==x[0] for d in out))
TN={k:h for k,(h,f) in TAGS.items()}
TCOUNT={k:sum(k in d['g'] for d in out) for k in TN}
TOK=[k for k in TN if TCOUNT[k]>=6]
nav=''
LBL={'wedding-album-12x36':'12x36 Album','album-12x30':'12x30 Album','album-18x24':'18x24 Album','album-12x18':'12x18 Album','album-cover':'Album Cover','album-background':'Background','studio-background':'Studio BG','birthday-baby-album':'Birthday','wedding-invitation':'Invitation'}
FONTS='<style>'+open('ui6/fonts/fonts.css').read().replace('.woff2)','.woff2?v=1)')+'</style>'  # self-hosted subset fonts (OFL) – no Google Fonts round trips
os.makedirs(f'{S}/fonts',exist_ok=True)
for _ff in glob.glob('ui6/fonts/*.woff2'): shutil.copy(_ff,f'{S}/fonts/')
THEMEJS='<script>(function(){try{var t=localStorage.getItem("fsp-theme");if(t!=="dark"&&t!=="light")t="light";document.documentElement.setAttribute("data-theme",t);if(+localStorage.getItem("fsp-promo-x")>Date.now())document.documentElement.classList.add("nopromo");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();</script><style>html{background:#FAF7F2}html[data-theme="dark"]{background:#0c0a08}</style>'
# ---- TamilPSD Pro promotion (figures checked on tamilpsd.in public pages 2026-10-17: 14,037 designs; Pro 50 PSD/day, Rs189/28 days, Rs900/6 months, Rs1,499/year) ----
TPN='14,000+'
def PROURL(slot): return f'https://tamilpsd.in/?utm_source=psdalbum&utm_medium={slot}&utm_campaign=pro'
def PROCARD(slot,head=f'Want {TPN} premium PSDs? Get TamilPSD Pro',sub='50 PSD downloads a day · from ₹189 for 28 days · UPI, cards &amp; netbanking',go='See Pro plans →'):
  return f'<a class="pm-upsell fsp-procard" href="{PROURL(slot)}" target="_blank" rel="noopener" data-pro="{slot}"><span class="ic fsp-pro-ic" aria-hidden="true">PRO</span><span><b>{head}</b><small>{sub}</small></span><span class="go">{go}</span></a>'
PROMOBAR=f'<div class="fsp-promo" id="fsp-promo" role="region" aria-label="TamilPSD Pro offer"><a href="{PROURL("topbar")}" target="_blank" rel="noopener" data-pro="topbar"><b>⚡ TamilPSD Pro</b><span class="fsp-promo-t"> · {TPN} premium PSDs · 50 downloads a day from ₹189</span><span class="fsp-promo-go">See plans →</span></a><button type="button" class="fsp-promo-x" aria-label="Dismiss offer">×</button></div>'
MAG='<svg class="nav-search-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4-4"/></svg>'
NSTOG='<button type="button" class="nav-search-toggle" aria-label="Open search" aria-controls="nav-search" aria-expanded="false"><svg class="ns-mag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4-4"/></svg><svg class="ns-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
THTOG='<button type="button" class="theme-toggle" aria-label="Switch to dark theme" title="Dark theme"><svg class="theme-ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg><svg class="theme-ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/></svg></button>'
NAVL=[('/','Home',''),('/blog/','Guides',''),('/browse/','📂 Categories','nav-pro'),('/about/','About',''),('/contact/','Contact','nav-contact')]
def _act(u,path): return (u=='/' and path=='/') or (u!='/' and path.startswith(u))
def header(path):
  nv=''.join(f'<a href="{u}"'+(f' class="{" ".join(x for x in (c,"active" if _act(u,path) else "") if x)}"' if (c or _act(u,path)) else '')+f'>{t}</a>' for u,t,c in NAVL)
  mm=''.join(f'<a href="{u}">{t}</a>' for u,t,c in NAVL)+'<a href="/favourites/">♥ Favourites</a>'
  return f'''<header><div class="header-inner"><a href="/" class="logo"><div class="logo-icon">P</div><div class="logo-text"><span class="logo-name">PSD<span>Album</span></span><span class="logo-sub">Free album PSD library</span></div></a><div class="hdr-divider"></div><nav aria-label="Primary">{nv}</nav><form class="nav-search" id="nav-search" action="/search/" method="get" role="search">{MAG}<input type="search" name="q" id="search-input" class="nav-search-input" placeholder="Search designs, e.g. karizma album, 12x36" aria-label="Search designs" autocomplete="off" enterkeyhint="search" maxlength="80"></form>{NSTOG}{THTOG}<button class="hamburger" id="hamburger-btn" aria-label="Menu" type="button"><span></span><span></span><span></span></button></div></header><div class="mobile-menu" id="mobile-menu">{mm}</div>'''
MBN=[('/','🏠','Home',''),('/search/','🔍','Search',''),('/designs/','FREE','All PSDs','mbn-pro'),('/browse/','📂','Categories',''),('/favourites/','❤️','Saved','')]
def mbn(path):
  return '<nav class="mobile-bottom-nav" aria-label="Mobile navigation">'+''.join(f'<a href="{u}" class="mbn-item{" "+c if c else ""}{" active" if _act(u,path) else ""}"><span class="mbn-icon">{i}</span><span class="mbn-label">{t}</span></a>' for u,i,t,c in MBN)+'</nav>'
def footer():
  cats=''.join(f'<li><a href="/category/{c}/">{e(n.replace(" PSD",""))}</a></li>' for c,n in CATS[:6])
  gd=''.join(f'<li><a href="/blog/{s}/">{e(t)}</a></li>' for s,t,_ in BLOG[:4])
  return f'''<footer><div class="footer-grid"><div><div class="footer-brand">PSD<span>Album</span></div><p class="footer-tagline">Free layered Photoshop templates for photo studios, album designers and photographers. By Guru Moorthi.</p>{PROCARD("footer",head="Need more? "+TPN+" premium PSDs on TamilPSD Pro",sub="50 downloads a day · from ₹189",go="See plans →")}</div><div class="footer-col"><div class="fh4">Categories</div><ul>{cats}<li><a href="/browse/">All categories →</a></li></ul></div><div class="footer-col"><div class="fh4">Guides</div><ul>{gd}<li><a href="/blog/">All guides →</a></li></ul></div><div class="footer-col"><div class="fh4">Company</div><ul><li><a href="/about/">About Us</a></li><li><a href="/contact/">Contact</a></li><li><a href="/privacy/">Privacy Policy</a></li><li><a href="/terms/">Terms of Use</a></li><li><a href="/disclaimer/">Disclaimer &amp; DMCA</a></li><li><a href="/designs/">All designs</a></li></ul></div></div><div class="footer-bottom"><p>© 2026 PSD Album (psdalbum.in) · All templates free · No login required · <a href="mailto:{CONTACT}">{CONTACT}</a></p></div></footer><button id="back-top" type="button" aria-label="Back to top">↑</button>'''
def page(path,title,desc,body,ld=None,img=None,noindex=False,head='',canon=None,lb=True):
  url=SITE+path; cu=canon or url
  h=f"""<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{THEMEJS}<title>{e(title)}</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{cu}"><link rel="alternate" hreflang="en-IN" href="{cu}"><link rel="alternate" hreflang="x-default" href="{cu}"><meta name="theme-color" content="#FAF7F2">{'<meta name="robots" content="noindex,follow">' if noindex else '<meta name="robots" content="index,follow,max-image-preview:large">'}<meta property="og:type" content="website"><meta property="og:locale" content="en_IN"><meta property="og:site_name" content="PSD Album"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{cu}"><meta property="og:image" content="{SITE+(img or '/og.png')}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml">{FONTS}<link rel="stylesheet" href="/css/site.css?v={CSSV}">{head}
<!-- Google Search Console: <meta name="google-site-verification" content="REPLACE_ME"> -->
<!-- Ads: all ad code is configured in /ads.json and lazy-loaded by /app.js -->
{f'<script type="application/ld+json">{json.dumps(ld)}</script>' if ld else ''}</head><body>
{PROMOBAR}{header(path)}
{('<div class="fsp-lb">'+AD('leaderboard')+'</div>') if (lb and ADON) else ''}
{body}
{footer()}
{mbn(path)}<script src="/app.js?v={APPV}" defer></script>{BEACON}</body></html>"""
  os.makedirs(S+path,exist_ok=True); open(S+path+'index.html','w').write(h)
urls=[]
def P(path,*a,**k):
  if not k.get('noindex') and not k.get('canon'): urls.append(path)
  page(path,*a,**k)
CSIZES='(max-width:720px) 46vw, 320px'
def ISRC(d):
  if not d.get('th'): return f'src="{d["img"]}"'
  return f'src="{IMG}/img/w360/{d["slug"]}.webp" srcset="{IMG}/img/w360/{d["slug"]}.webp 360w, {IMG}/img/w600/{d["slug"]}.webp 600w" sizes="{CSIZES}"'
def card(d,badge='',title=True):
  lb=badge or LBL.get(d["c"],d["cn"].replace(" PSD",""))
  return f'<a class="design-card" href="/psd/{d["slug"]}/"><div class="card-thumb"><div class="wm-container"><img loading="lazy" decoding="async" {ISRC(d)} alt="{e(d["t"])}" width="{d["w"]}" height="{d["h"]}"></div><div class="card-overlay" aria-hidden="true"><span class="fsp-pill">⬇ Free PSD</span></div><div class="card-cat">{e(lb)}</div><button class="card-fav" type="button" data-id="{d["id"]}" aria-label="Save to favourites">♥</button></div>'+(f'<div class="pm-rel-t">{e(d["t"])}</div>' if title else '')+'</a>'
APP=open('ui6/app.js').read(); APPV=str(abs(hash(APP))%10**8)
open(f'{S}/app.js','w').write(APP)
def lite(items,path):
  json.dump([{k:x[k] for k in ('id','slug','t','img','c','cn','sz','mb','q','g','w','h','th') if k in x} for x in items],open(S+path,'w'),separators=(',',':'))
SLOTS=['leaderboard','infeed','sidebar','anchor','incontent','countdown_top','countdown_mid','countdown_bottom','inarticle']
def AD(n):
  if not ADON: return ''
  s=n if n in SLOTS else 'incontent'
  return f'<div class="ad ad-{s}" data-slot="{s}"><span class="adl">Advertisement</span><div class="adc"></div></div>'
def LAY(main):
  if not ADON: return f'<div class="fsp-lay fsp-noads"><div class="fsp-lmain">{main}</div></div>'
  return f'<div class="fsp-lay"><div class="fsp-lmain">{main}</div><aside class="fsp-sb" aria-label="Advertisement">{AD("sidebar")}</aside></div>'
def GRID(items,every=12,title=True,gid=''):
  h=''
  for i,d in enumerate(items):
    h+=card(d,title=title)
    if (i+1)%every==0 and i+1<len(items): h+=AD('infeed')
  return f'<div class="designs-grid"{f" id={gid}" if gid else ""}>{h}</div>'
PER=30
best=sorted([d for d in out if d['c']=='wedding-album-12x36'],key=lambda d:('karizma-album-psd' in d['g'],d['q']),reverse=True)[:60]
trend=random.sample(best,16)
def pager(base,cur,tot,count=None,first=None,jump=True):
  if tot<2: return ''
  u=lambda p:(first or base) if p==1 else f'{base}page/{p}/'
  nums=sorted({1,tot,*range(max(1,cur-2),min(tot,cur+2)+1)}) if cur>3 else sorted({1,2,3,4,5,tot}&set(range(1,tot+1)))
  li=[];last=0
  li.append(f'<li><a class="tp-pg tp-pg-step" rel="prev" href="{u(cur-1)}">« Prev</a></li>' if cur>1 else '<li><span class="tp-pg tp-pg-off tp-pg-step">« Prev</span></li>')
  for p in nums:
    if p-last>1: li.append('<li><span class="tp-pg tp-pg-gap">…</span></li>')
    li.append(f'<li><span class="tp-pg tp-pg-cur" aria-current="page">{p}</span></li>' if p==cur else f'<li><a class="tp-pg" href="{u(p)}">{p}</a></li>'); last=p
  li.append(f'<li><a class="tp-pg tp-pg-step" rel="next" href="{u(cur+1)}">Next »</a></li>' if cur<tot else '<li><span class="tp-pg tp-pg-off tp-pg-step">Next »</span></li>')
  info=f'<p class="tp-pager-info">Showing <strong>{(cur-1)*PER+1}–{min(cur*PER,count)}</strong> of <strong>{count:,}</strong> designs</p>' if count else ''
  jf=f'<form class="tp-pager-jump" data-base="{base}" data-first="{first or base}" data-tot="{tot}"><label>Go to page <input type="number" min="1" max="{tot}" value="{cur}" aria-label="Page number"></label><span>of {tot}</span><button type="submit">Go</button></form>' if jump else ''
  return f'<div class="tp-pager">{info}<nav class="tp-pager-nav" aria-label="Pagination"><ul class="tp-pager-list">{"".join(li)}</ul></nav>{jf}</div>'
# ---- home: browse-by-category cards (tamilpsd bc-cards) ----
ICO_PS='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="3" width="42" height="42" rx="10" fill="currentColor" opacity=".16"/><rect x="3" y="3" width="42" height="42" rx="10" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="24" y="31.5" text-anchor="middle" font-family="Sora,Manrope,sans-serif" font-weight="700" font-size="18" fill="currentColor">Ps</text></svg>'
ICO_CAM='<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M6 15.5a3.5 3.5 0 0 1 3.5-3.5h5.2l3-4.5h12.6l3 4.5h5.2a3.5 3.5 0 0 1 3.5 3.5V37a3.5 3.5 0 0 1-3.5 3.5h-29A3.5 3.5 0 0 1 6 37z" fill="currentColor" fill-opacity=".14"/><circle cx="24" cy="25.5" r="8"/><circle cx="24" cy="25.5" r="3.2" fill="currentColor"/></svg>'
ICO_BG='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="3" width="42" height="42" rx="10" fill="currentColor" opacity=".16"/><rect x="3" y="3" width="42" height="42" rx="10" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M9 36l10-12 7 8 5-6 8 10z" fill="currentColor"/><circle cx="33" cy="15" r="4" fill="currentColor"/></svg>'
CHEV='<svg class="bc-chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'
GROUPS=[('albums','bc-gold',ICO_PS,'Wedding Album PSD','12x36, Karizma and album sheets',['wedding-album-12x36','album-12x30','album-18x24','album-12x18'],'wedding-album-12x36'),
        ('studio','bc-purple',ICO_CAM,'Covers & Invitations','Album covers, invitations and birthday albums',['album-cover','wedding-invitation','birthday-baby-album'],'album-cover'),
        ('backgrounds','bc-green',ICO_BG,'Backgrounds PSD','Album and studio backdrops',['album-background','studio-background'],'album-background')]
CN=dict(CATS)
BCPRE=[]
def bcthumb(d):
  """small 360px thumbnail for the category cards (they render at <=320px); keeps mobile LCP light"""
  u=f"/img/bc/{d['slug']}.webp"; dst='media'+u
  if not os.path.exists(dst):
    os.makedirs('media/img/bc',exist_ok=True); im=Image.open('media'+d['img']).convert('RGB'); im.thumbnail((360,360)); im.save(dst,'WEBP',quality=60,method=5)
  return u
def bccards():
  h=''
  for gi,(gid,cls,ico,ti,tg,cs,main) in enumerate(GROUPS):
    cs=[c for c in cs if c in CN]
    pool=sorted([d for d in out if d['c'] in cs],key=lambda x:-x['q'])
    land=[d for d in pool if d['w']>=d['h']*1.2][:24] or pool[:24]
    pick=random.Random(gid).sample(land,min(4,len(land)))
    th=''.join(f'<span class="bc-th"><img {"" if gi==0 else "loading=lazy "}{"fetchpriority=high " if gi==0 and ti_==0 else ""}decoding="async" src="{bcthumb(d)}" alt="" width="320" height="220"></span>' for ti_,d in enumerate(pick))
    if gi==0: BCPRE.append(bcthumb(pick[0]))
    links=''.join(f'<li><a class="bc-link" href="/category/{c}/">{e(CN[c].replace(" PSD",""))}</a></li>' for c in cs)
    links+=''.join(f'<li><a class="bc-link" href="/tag/{k}/">{e(TN[k].replace(" Free Download","").replace(" PSD",""))}</a></li>' for k in TOK if any(k in d['g'] for d in pool[:400]))[:0] if False else ''
    extra=[k for k in TOK if sum(k in d['g'] for d in pool)>=6][:8]
    links+=''.join(f'<li><a class="bc-link" href="/tag/{k}/">{e(TN[k].replace(" Free Download","").replace(" PSD",""))}</a></li>' for k in extra)
    h+=f'<article class="bc-card {cls}" data-group="{gid}"><button type="button" class="bc-head" id="bc-head-{gid}" aria-expanded="false" aria-controls="bc-panel-{gid}"><span class="bc-top"><span class="bc-icon">{ico}</span><span class="bc-titles"><span class="bc-title">{ti}</span><span class="bc-tag">{tg}</span></span>{CHEV}</span><span class="bc-grid">{th}</span></button><div class="bc-panel" id="bc-panel-{gid}" role="region" aria-labelledby="bc-head-{gid}"><div class="bc-panel-in"><ul class="bc-links">{links}</ul></div></div><button type="button" class="bc-all" aria-expanded="false" aria-controls="bc-panel-{gid}" data-href="/category/{main}/">View All <span aria-hidden="true">→</span></button></article>'
  return f'<section class="pm-sec pm-wrap" id="browse-cats"><div class="pm-sec-h"><h2><small>Categories</small>Browse by category</h2><a href="/browse/">All categories →</a></div><div class="bc-root bc-ready"><div class="bc-cards">{h}</div></div></section>'
_rs=random.Random(7); feed=_rs.sample(sorted(out,key=lambda x:-x['q'])[:900],PER)
web={"@context":"https://schema.org","@type":"WebSite","name":"PSD Album","url":SITE,"potentialAction":{"@type":"SearchAction","target":SITE+"/search/?q={q}","query-input":"required name=q"}}
TOTP=(len(out)+PER-1)//PER
ABOUT=f'''<section class="pm-sec pm-wrap pm-reveal pm-about visible" aria-label="About PSD Album"><div class="pm-about-grid"><div><h1 class="fsp-about-h">Free studio PSD templates for wedding &amp; Karizma albums</h1><p>PSD Album is run by Guru Moorthi for photographers, album designers and photo studios. We publish {len(out):,}+ layered, print-ready Photoshop designs: 12x36 wedding album sheets, Karizma albums, album covers, studio backgrounds, birthday and baby albums. Each design page lists the canvas size, DPI and file size so you can pick the right template before downloading.</p><p>Every design is free to download with no login and no signup. Questions or a broken link? <a href="/contact/">Contact us</a>. New to album editing? Start with our <a href="/blog/">album design guides</a>.</p></div><div><h2 class="fsp-about-h3">Guides for editing and printing</h2><ul class="pm-guide-list">{"".join(f'<li><a href="/blog/{s}/">{e(t)}</a></li>' for s,t,_ in BLOG[:5])}<li><a href="/blog/">All guides →</a></li></ul></div></div></section>'''
_BC=bccards()
P('/','Free Studio PSD Download – Wedding Album 12x36, Karizma & Birthday PSD',f'Download {len(out):,}+ free studio PSD templates: wedding album 12x36, Karizma album, album covers, backgrounds, birthday and baby albums. Layered, print-ready, no login.',
_BC+f'''<div class="main-wrap"><main>{LAY(f"""<div class="sec-head"><span class="results-count">{len(out):,} designs</span></div><div class="sort-row"><select id="sort-select" aria-label="Sort designs"><option value="s">🎲 Daily Shuffle</option><option value="n">🆕 Newest</option><option value="q">⭐ Best quality</option></select><button type="button" id="reset-filters-btn">Reset Filters</button><button type="button" id="fav-filter-btn">❤️ Favourites</button></div>{GRID(feed,title=False,gid="designs-grid")}{pager("/designs/",1,TOTP,len(out))}""")}</main></div>
<section class="pm-sec pm-wrap fsp-rv" id="rv" hidden><div class="pm-sec-h"><h2><small>History</small>Recently viewed</h2><a href="/favourites/">My favourites →</a></div><div class="designs-grid fsp-row" id="rvl"></div></section>
{ABOUT}''',ld=web,head=f'<link rel="preload" as="image" href="{BCPRE[0]}" fetchpriority="high">')
def faq(h,n):
  qa=[(f'Are these {h} files really free?',f'Yes. All {n} {h} designs on PSD Album are free to download with no login or signup.'),
      (f'Which software opens {h} files?','The files are layered PSDs. Open them in Adobe Photoshop CC or any editor that supports PSD layers.'),
      ('How do I replace the photos?','Place your photo above the frame layer and press Alt+Ctrl+G (Option+Cmd+G on Mac) to clip it into the mask, then resize with Ctrl+T.'),
      ('Can I use these designs for client albums?','Yes, you can use them for personal and studio client work. Reselling the files as template packs is not allowed.')]
  FAQH.append(qa)
  return {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in qa]}
FAQH=[]
def faqhtml(h,n):
  q=faq(h,n)['mainEntity']
  return '<section class="fsp-faq"><h2>Frequently asked questions</h2>'+''.join(f'<details><summary>{e(x["name"])}</summary><p>{e(x["acceptedAnswer"]["text"])}</p></details>' for x in q)+'</section>'
def crumbbar(items):
  return '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a>'+''.join(f'<span>›</span>'+(f'<a href="{u}">{n}</a>' if u else f'<span>{n}</span>') for n,u in items)+'</nav>'
def paged(base,title,desc,h1,intro,items,crumb,ldname,canon=None):
  items=sorted(items,key=lambda x:(-x['q'],x['id'])); tot=(len(items)+PER-1)//PER
  fk=[k for k in TOK if 4<=sum(k in d['g'] for d in items)<len(items) and f'/tag/{k}/'!=base]
  chips=('<div class="fsp-chips">'+''.join(f'<a href="/tag/{k}/">{e(TN[k])}</a>' for k in fk[:12])+'</div>') if fk else ''
  for p in range(1,tot+1):
    path=base if p==1 else f'{base}page/{p}/'
    hd=(f'<link rel="prev" href="{SITE}{base if p==2 else f"{base}page/{p-1}/"}">' if p>1 else '')+(f'<link rel="next" href="{SITE}{base}page/{p+1}/">' if p<tot else '')
    sfx='' if p==1 else f' – Page {p}'
    sl=items[(p-1)*PER:p*PER]
    cb=crumbbar([(crumb,None)] if p==1 else [(crumb,base),(f'Page {p}',None)])
    body=cb+'<div class="main-wrap"><main>'+LAY(f'<div class="sec-head"><h1 class="sec-title">{e(h1)}{sfx}</h1><div class="pm-cat-intro"><p>{intro}</p><p class="pm-more">{len(items):,} free designs · page {p} of {tot} · New to PSD editing? Read our <a href="/blog/">album design guides</a>.</p></div></div>{chips}{GRID(sl)}{pager(base,p,tot,len(items))}'+(faqhtml(h1,len(items)) if p==1 else '')+HUBLINK)+'</main></div>'
    P(path,title+sfx,desc+('' if p==1 else f' Page {p} of {tot}.'),body,
     ld=[{"@context":"https://schema.org","@type":"CollectionPage","name":h1+sfx,"url":SITE+path},crumbs([('Home','/'),(ldname,base)])]+([faq(h1,len(items))] if p==1 else []),head=hd,canon=(canon if p==1 else None),noindex=len(items)<12)
HUBLINK='<p class="fsp-hub"><a href="/browse/">Browse all categories, sizes and styles →</a></p>'
for c,n in CATS:
  items=[d for d in out if d['c']==c]
  paged(f'/category/{c}/',f'{n} Free Download – {len(items)} Editable Templates',f'Browse {len(items)} free {n} files for photo studios. Layered, print-ready Photoshop templates, free to download with no login.',f'Free {n} Designs',e(CATINTRO.get(c,''))+f' <b>{len(items)} editable {e(n)} files</b>, sorted by preview quality; download any design free.',items,e(n),n)
for k in TOK:
  h=TN[k]; items=[d for d in out if k in d['g']]
  paged(f'/tag/{k}/',f'{h} – {len(items)} Free Editable Templates',f'Download {len(items)} free {h.lower()} files. Layered Photoshop templates for photo studios, free with no login.',h,TINTRO.get(k) or f'Browse {len(items)} free {e(h.lower())} designs. Every file is a layered PSD you can edit in Photoshop and send straight to print.',items,e(h),h,canon=(f'{SITE}/{LANDMAP[k]}/' if k in LANDMAP else None))
paged('/designs/',f'All Free Studio PSD Designs – {len(out):,} Editable Templates',f'Browse all {len(out):,} free studio PSD templates page by page: wedding albums, Karizma, covers, backgrounds and birthday albums. Free download, no login.','All Free Studio PSD Designs',f'Every free design on PSD Album, {len(out):,} layered PSDs, sorted by preview quality. 30 designs per page.',out,'All designs','All designs')
lite(out,'/data/search.json')
page('/search/','Search Free Studio PSDs – PSD Album','Search free studio PSD templates.',crumbbar([('Search',None)])+'<div class="main-wrap"><main>'+LAY('<div class="sec-head"><h1 class="sec-title">Results for “<span id="qv"></span>”</h1><span class="results-count" id="cnt"></span></div><div class="designs-grid" id="sres"></div><div id="spg"></div>')+'</main></div>',noindex=True)
