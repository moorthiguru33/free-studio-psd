e=html.escape
def crumbs(items):
  return {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":SITE+u} for i,(n,u) in enumerate(items)]}
LANDMAP={'karizma-album-psd':'karizma-album-psd','wedding-album-12x36-psd-free-download':'12x36-wedding-album-psd-free-download','tamil-wedding-album-psd':'tamil-wedding-album-psd','birthday-album-psd-free-download':'birthday-album-psd','baby-album-psd':'baby-album-psd','muslim-wedding-album-psd':'muslim-wedding-album-psd','pre-wedding-album-psd':'pre-wedding-album-psd','engagement-album-psd':'engagement-album-psd','album-cover-psd-free-download':'album-cover-psd','wedding-album-background-psd':'album-background-psd','12x30-album-psd':'12x30-album-psd','12x18-album-psd':'12x18-album-psd','18x24-album-psd':'18x24-album-psd','wedding-invitation-psd':'wedding-invitation-psd','studio-backdrop-psd':'studio-background-psd'}
from urllib.parse import quote
exec(open('blog.py').read());exec(open('blog2.py').read());exec(open('landing.py').read())
exec(open('ui6/pres.py').read())
exec(open('dpage.py').read())
landing_pages()
exec(open('blog.py').read());exec(open('blog2.py').read())
bl=''
for s,t,ps in BLOG:
  others=[x for x in BLOG if x[0]!=s]; rg=random.sample(others,3); tk=random.sample(TOK,3)
  _ps=[f'<p>{e(p)}</p>' for p in ps]
  if len(_ps)>3: _ps.insert(2,AD('inarticle'))
  P(f'/blog/{s}/',t+' – FreeStudioPSD',ps[0][:155],crumbbar([('Guides','/blog/'),(e(t[:60]),None)])+'<div class="main-wrap"><main>'+LAY(f'<article class="fsp-art"><h1>{e(t)}</h1>'+''.join(_ps)+
   f'{AD("inarticle")}<h3>Free templates to practise with</h3><p>'+' · '.join(f'<a href="/tag/{k}/">{e(TN[k])}</a>' for k in tk)+'</p><h3>Related guides</h3><ul>'+''.join(f'<li><a href="/blog/{x[0]}/">{e(x[1])}</a></li>' for x in rg)+'</ul></article>')+'</main></div>',
   ld=[{"@context":"https://schema.org","@type":"Article","headline":t,"author":{"@type":"Person","name":"Guru Moorthi"},"datePublished":"2026-10-16","dateModified":"2026-10-16","publisher":{"@type":"Organization","name":"FreeStudioPSD"}},crumbs([('Home','/'),('Guides','/blog/'),(t,f'/blog/{s}/')])])
P('/blog/','Album Design Guides & Photoshop Tutorials – FreeStudioPSD','Free guides on editing wedding album PSDs, album sizes, Karizma design tips and print settings.',crumbbar([('Guides',None)])+f'<div class="main-wrap"><main><div class="sec-head"><h1 class="sec-title">Album Design Guides</h1><span class="results-count">{len(BLOG)} guides</span></div><div class="pm-cat-intro"><p>{len(BLOG)} practical guides for photographers and album designers.</p></div><ul class="pm-guide-list fsp-guides">'+''.join(f'<li><a href="/blog/{s}/"><b>{e(t)}</b><span>{e(ps[0][:110])}…</span></a></li>' for s,t,ps in BLOG)+'</ul></main></div>')
ST={'about':('About FreeStudioPSD','<p>FreeStudioPSD is run by Guru Moorthi to help photographers and studios find free, editable Photoshop templates for wedding albums, Karizma albums, birthday albums, covers and backgrounds.</p><p>All files are free to download without login.</p>'),
'privacy':('Privacy Policy','<p>We do not require accounts and do not collect personal data directly. Third-party advertising partners (such as Google AdSense) may use cookies to show relevant ads. You can manage cookies in your browser settings.</p><p>Downloads are served from Google Drive, which is subject to Google\'s privacy policy.</p>'),
'terms':('Terms of Use','<p>Templates are provided free for personal and studio client work. Do not resell or redistribute the files as your own template packs. Files are provided as-is without warranty.</p>'),
'contact':('Contact Us','<p>Email: <b>contact@example.com</b> (placeholder)</p><form onsubmit="alert(\'Contact form coming soon.\');return false"><p><input placeholder="Your name" required class="fsp-in"></p><p><input type="email" placeholder="Your email" required class="fsp-in"></p><p><textarea placeholder="Message" rows="5" class="fsp-in"></textarea></p><button class="fsp-btn">Send message</button></form>')}
for k,(t,b) in ST.items(): P(f'/{k}/',t+' – FreeStudioPSD',t+' for FreeStudioPSD, free studio PSD downloads.',crumbbar([(t,None)])+f'<div class="main-wrap"><main><article class="fsp-art"><h1>{t}</h1>{b}</article></main></div>')
page('/404-tmp/','Page not found – FreeStudioPSD','Page not found.','<div class="main-wrap"><main class="empty-state"><div class="es-icon">🔍</div><h1 class="fsp-404">404</h1><h2>Sorry, this page could not be found</h2><p>Try searching or browse our most popular categories.</p><form action="/search/" style="max-width:480px;margin:20px auto;display:flex;gap:8px"><input name="q" placeholder="Search PSDs" class="fsp-in" style="flex:1"><button class="fsp-btn">Search</button></form><div class="fsp-chips" style="justify-content:center">'+''.join(f'<a href="/category/{c}/">{e(n)}</a>' for c,n in CATS)+'</div></main></div>',noindex=True)
shutil.move(f'{S}/404-tmp/index.html',f'{S}/404.html'); shutil.rmtree(f'{S}/404-tmp')
open(f'{S}/favicon.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#C9A227"/><text x="32" y="42" font-family="Arial" font-weight="700" font-size="26" fill="#fff" text-anchor="middle">PSD</text></svg>')
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
