import json,glob,random,os,shutil,re,html,hashlib
random.seed(2026)
SITE="https://freestudiopsd.pages.dev"
rows={}
for f in sorted(glob.glob('/workspace/studiopk/rows_batch*.json'))+sorted(glob.glob('/workspace/freepsdking/rows_batch*.json')):
  d=os.path.dirname(f)
  for r in json.load(open(f)):
    p=f"{d}/previews/{r['ID']}.webp"
    if r['ID'] not in rows and os.path.exists(p) and 'id=' in r['Download URL']: r['_p']=p; rows[r['ID']]=r
CATMAP={'photo-album-12x36':('wedding-album-12x36','Wedding Album 12x36 PSD'),'photo-album-18x24':('album-18x24','Photo Album 18x24 PSD'),
'photo-album-12x30':('album-12x30','Photo Album 12x30 PSD'),'photo-album-12x18':('album-12x18','Photo Album 12x18 PSD'),
'album-cover':('album-cover','Album Cover PSD'),'album-background':('album-background','Album Background PSD'),
'studio-background':('studio-background','Studio Background PSD'),'birthday-baby-album':('birthday-baby-album','Birthday & Baby Album PSD')}
quota={'photo-album-12x36':200,'album-cover':70,'album-background':70,'birthday-baby-album':60,'studio-background':40,'photo-album-18x24':25,'photo-album-12x30':20,'photo-album-12x18':15}
pick=[]
for c,q in quota.items():
  L=[r for r in rows.values() if r['Category']==c]; random.shuffle(L); pick+=L[:q]
random.shuffle(pick)
ADJ=['Elegant','Royal','Classic','Modern','Premium','Graceful','Vibrant','Golden','Floral','Timeless','Stylish','Luxury','Soft','Bright','Charming']
THEME={'wedding':'Wedding','muslim':'Muslim Wedding','christian':'Christian Wedding','hindu':'Hindu Wedding','karizma':'Karizma','birthday':'Birthday','baby':'Baby','engagement':'Engagement','reception':'Reception','pre wedding':'Pre-Wedding','kids':'Kids','haldi':'Haldi','mehndi':'Mehndi'}
def theme(r):
  t=(r['Title']+' '+r['Tags']).lower()
  for k,v in THEME.items():
    if k in t: return v
  return 'Studio'
size=lambda r:(re.search(r'(\d+x\d+)',r['Title']) or re.search(r'(\d+x\d+)',r['Category']) or [None,''])[1]
out=[];seen=set()
INTRO=["Give your client album a polished finish with this","Save hours of layout work with this","Create a memorable keepsake using this","Impress couples and families with this","Speed up your studio workflow with this"]
USE=["Simply place photos into the smart clipping masks and tweak the colours.","Every element sits on its own layer, so swapping photos and text takes minutes.","The layout is balanced for print, leaving room for portraits and candid shots.","Fonts, shapes and decorations are fully editable to match each client's taste."]
for i,r in enumerate(pick):
  cslug,cname=CATMAP[r['Category']]; th=theme(r); sz=size(r); kind=cname.replace(' PSD','').replace(sz,'').strip()
  while True:
    t=f"{random.choice(ADJ)} {th} {kind} {sz} PSD Template".replace('  ',' ').strip()
    t=re.sub(r'\b(\w+) \1\b',r'\1',t)
    if t not in seen: break
    t+=f" Design {i+1}"; 
    if t not in seen: break
  seen.add(t)
  slug=re.sub(r'[^a-z0-9]+','-',t.lower()).strip('-')+'-'+str(i+1)
  desc=f"{random.choice(INTRO)} {t.lower().replace(' psd template','')} Photoshop file. {random.choice(USE)} Size: {r['Dimensions']} at {r['DPI']}, {r['Color Mode']} colour, about {r['File Size']}. Free download, no login needed."
  fid=re.search(r'id=([\w-]+)',r['Download URL']).group(1)
  out.append(dict(id=i+1,slug=slug,t=t,d=desc,c=cslug,cn=cname,dim=r['Dimensions'],dpi=r['DPI'],sz=r['File Size'],img=f"/img/{i+1}.webp",fid=fid,src=r['_p']))
S='site'; shutil.rmtree(S,ignore_errors=True)
for p in ['img','data','psd','category','blog','download']: os.makedirs(f'{S}/{p}')
for d in out: shutil.copy(d.pop('src'),f"{S}{d['img']}")
for k in range(0,len(out),200): json.dump(out[k:k+200],open(f'{S}/data/shard-{k//200}.json','w'))
json.dump({'shards':(len(out)+199)//200,'count':len(out)},open(f'{S}/data/index.json','w'))
e=html.escape
CSS="""*{box-sizing:border-box}body{margin:0;font-family:system-ui,Segoe UI,Roboto,sans-serif;background:#f6f5fb;color:#222}a{color:#5b2bd6;text-decoration:none}
header{background:linear-gradient(90deg,#3a1c9c,#7b3fe4);color:#fff;padding:14px 18px;display:flex;flex-wrap:wrap;gap:14px;align-items:center}header a{color:#fff;font-size:15px}header .logo{font-weight:800;font-size:20px;margin-right:auto}
.pro{background:#ffcc33;color:#222;text-align:center;padding:10px;font-weight:600}.pro a{color:#3a1c9c;text-decoration:underline}
main{max-width:1200px;margin:auto;padding:18px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
.card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px #0001;transition:.2s}.card:hover{transform:translateY(-3px)}.card img{width:100%;aspect-ratio:3/2;object-fit:cover;background:#ddd}.card h3{font-size:14px;margin:8px 10px 12px;color:#222}
.btn{display:inline-block;background:#16a34a;color:#fff;padding:13px 26px;border-radius:8px;font-weight:700;font-size:17px;border:0;cursor:pointer}.ad{background:#eee;border:1px dashed #aaa;color:#888;text-align:center;padding:30px;margin:16px 0;font-size:12px}
.cats{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 20px}.cats a{background:#fff;padding:7px 13px;border-radius:20px;box-shadow:0 1px 4px #0001;font-size:14px}
.detail img{width:100%;max-width:900px;border-radius:10px}table td{padding:5px 12px;border-bottom:1px solid #eee}footer{background:#1d1238;color:#ccc;padding:24px;text-align:center;font-size:14px}footer a{color:#fff;margin:0 8px}
article{background:#fff;padding:22px;border-radius:12px;line-height:1.7;max-width:850px}#more{margin:22px auto;display:block}"""
open(f'{S}/style.css','w').write(CSS)
CATS=sorted({(d['c'],d['cn']) for d in out})
def page(path,title,desc,body,ld=None,img=None):
  url=SITE+path
  h=f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}">{f'<meta property="og:image" content="{SITE}{img}">' if img else ''}<link rel="stylesheet" href="/style.css">
<!-- AdSense placeholder: <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX"></script> -->
{f'<script type="application/ld+json">{json.dumps(ld)}</script>' if ld else ''}</head><body>
<header><a class="logo" href="/">FreeStudioPSD</a><a href="/">Home</a><a href="/category/wedding-album-12x36/">Wedding Albums</a><a href="/category/album-cover/">Covers</a><a href="/blog/">Guides</a><a href="/about/">About</a></header>
<div class="pro">Need more premium designs? Try <a href="https://tamilpsd.in" rel="noopener">TamilPSD Pro</a> for the full studio PSD library.</div>
<main>{body}</main><footer><p><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a><a href="/sitemap.xml">Sitemap</a></p><p>&copy; 2026 FreeStudioPSD by Guru Moorthi. Free PSD templates for photo studios.</p></footer></body></html>"""
  os.makedirs(S+path,exist_ok=True); open(S+path+'index.html','w').write(h)
urls=[]
def P(path,*a,**k): urls.append(path); page(path,*a,**k)
cat_html='<div class="cats">'+''.join(f'<a href="/category/{c}/">{e(n)}</a>' for c,n in CATS)+'</div>'
card=lambda d:f'<a class="card" href="/psd/{d["slug"]}/"><img loading="lazy" src="{d["img"]}" alt="{e(d["t"])}" width="300" height="200"><h3>{e(d["t"])}</h3></a>'
JS="""<script>
(async()=>{const g=document.getElementById('g');if(!g)return;const ix=await (await fetch('/data/index.json')).json();let all=[];
const o=[...Array(ix.shards).keys()].sort(()=>Math.random()-.5);
for(const s of o){all=all.concat(await (await fetch('/data/shard-'+s+'.json')).json())}
const cat=g.dataset.cat;if(cat)all=all.filter(d=>d.c==cat);
for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
let n=0;const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function more(){g.insertAdjacentHTML('beforeend',all.slice(n,n+48).map(d=>`<a class="card" href="/psd/${d.slug}/"><img loading="lazy" src="${d.img}" alt="${esc(d.t)}"><h3>${esc(d.t)}</h3></a>`).join(''));n+=48;document.getElementById('more').style.display=n<all.length?'block':'none'}
g.innerHTML='';more();document.getElementById('more').onclick=more})()</script>"""
def grid(items,cat=''):
  return f'<div class="grid" id="g" data-cat="{cat}">'+''.join(card(d) for d in items[:24])+'</div><button class="btn" id="more">Load more designs</button>'+JS
web={"@context":"https://schema.org","@type":"WebSite","name":"FreeStudioPSD","url":SITE}
P('/','Free Studio PSD Download – Wedding Album, Karizma & Birthday PSD Templates',f'Download {len(out)}+ free studio PSD files: wedding album 12x36, album covers, backgrounds, birthday and baby album designs. No login required.',
 f'<h1>Free Studio PSD Templates for Photographers</h1><p>{len(out)} hand-picked layered Photoshop designs for wedding albums, Karizma albums, birthday and baby albums. Free download, no login.</p>{cat_html}<div class="ad">Ad slot – AdSense / Adsterra placeholder</div>'+grid(out),ld=web)
for c,n in CATS:
  items=[d for d in out if d['c']==c]
  P(f'/category/{c}/',f'Free {n} Download – {len(items)} Editable Templates',f'Browse {len(items)} free {n} files for photo studios. Layered, print-ready and free to download.',
   f'<h1>Free {e(n)} Designs</h1><p>{len(items)} editable {e(n)} files, shown in random order. Click any design for details and a free download.</p>{cat_html}'+grid(items,c),
   ld={"@context":"https://schema.org","@type":"CollectionPage","name":n,"url":f"{SITE}/category/{c}/"})
for d in out:
  rel=[x for x in out if x['c']==d['c'] and x is not d]; random.shuffle(rel)
  ld={"@context":"https://schema.org","@type":"CreativeWork","name":d['t'],"description":d['d'],"image":SITE+d['img'],"encodingFormat":"image/vnd.adobe.photoshop","isAccessibleForFree":True,"author":{"@type":"Person","name":"Guru Moorthi"},
      "offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}
  P(f"/psd/{d['slug']}/",f"{d['t']} Free Download",d['d'][:155],
   f'''<div class="detail"><p><a href="/">Home</a> › <a href="/category/{d['c']}/">{e(d['cn'])}</a></p><h1>{e(d['t'])}</h1><img src="{d['img']}" alt="{e(d['t'])}"><p>{e(d['d'])}</p>
<table><tr><td>Dimensions</td><td>{d['dim']}</td></tr><tr><td>Resolution</td><td>{d['dpi']}</td></tr><tr><td>File size</td><td>{d['sz']}</td></tr><tr><td>Format</td><td>Layered PSD (ZIP)</td></tr><tr><td>Price</td><td>Free</td></tr></table>
<div class="ad">Ad slot – AdSense placeholder</div><p><a class="btn" href="/download/?id={d['id']}" rel="nofollow">Free Download</a></p><h2>Related designs</h2><div class="grid">{''.join(card(x) for x in rel[:8])}</div></div>''',ld=ld,img=d['img'])
# download page (not in sitemap)
page('/download/','Preparing your download – FreeStudioPSD','Your free PSD download is being prepared.',
'''<h1>Your download is almost ready</h1><div class="ad">Ad slot – AdSense placeholder (top)</div><p id="t" style="font-size:22px">Please wait <b id="c">15</b> seconds…</p><div class="ad">Ad slot – Adsterra / Monetag placeholder</div>
<p><a class="btn" id="dl" style="display:none" rel="nofollow noopener" target="_blank">Download from Google Drive</a></p><p id="nm"></p><div class="ad">Ad slot – AdSense placeholder (bottom)</div>
<script>(async()=>{const id=+new URLSearchParams(location.search).get('id');const s=Math.floor((id-1)/200);const L=await (await fetch('/data/shard-'+s+'.json')).json();const d=L.find(x=>x.id===id);
if(!d){document.getElementById('t').textContent='Design not found.';return}document.getElementById('nm').textContent=d.t;let c=15;const iv=setInterval(()=>{c--;document.getElementById('c').textContent=c;if(c<=0){clearInterval(iv);document.getElementById('t').textContent='Your link is ready!';const a=document.getElementById('dl');a.href='https://drive.google.com/uc?export=download&id='+d.fid;a.style.display='inline-block'}},1000)})()</script>''')
open(f'{S}/download/index.html','a')
BLOG=[('how-to-edit-wedding-album-psd','How to Edit a Wedding Album PSD in Photoshop (Step-by-Step)',['Open the PSD and check the Layers panel. Album templates group photo placeholders, text and decorations separately.','Drag your photo onto the document and place it just above a placeholder layer, then press Alt+Ctrl+G (Option+Cmd+G on Mac) to clip it inside the mask.','Use Free Transform to scale and position each photo. Hold Shift to keep proportions.','Edit names and dates with the Type tool, and recolour shapes using Hue/Saturation adjustment layers.','Save a copy as JPG at full resolution for the print lab and keep the PSD for future edits.']),
('12x36-album-size-guide','12x36 Album Size Guide: Pixels, DPI and Print Settings',['A 12x36 inch spread at 300 DPI is 10800x3600 pixels; at 150 DPI it is 5400x1800 pixels.','Most labs accept 150–300 DPI. Higher DPI gives sharper prints but larger files.','Leave a 0.25 inch bleed and keep faces and text away from the centre fold.','Use RGB for most digital labs unless your printer asks for CMYK.']),
('karizma-album-design-tips','10 Karizma Album Design Tips for Photo Studios',['Tell a story: arrange spreads in event order from preparation to reception.','Limit each spread to one hero photo and a few supporting shots.','Repeat a colour palette across the album for a premium look.','Use matching backgrounds so pages flow together.','Proof every spread on screen at 100% before sending to print.']),
('birthday-album-psd-ideas','Birthday and Baby Album PSD Ideas Clients Love',['Use bright pastel backgrounds and playful fonts for kids albums.','Add milestone pages: first smile, first step, first birthday cake.','Include a family page with grandparents for a complete keepsake.','Keep text short so photos remain the hero.']),
('choose-album-background-psd','How to Choose the Right Album Background PSD',['Match the background mood to the event: gold and maroon for weddings, pastels for baby albums.','Pick backgrounds with low detail behind faces.','Check the resolution matches your album size before you start designing.'])]
bl=''
for s,t,ps in BLOG:
  P(f'/blog/{s}/',t+' – FreeStudioPSD',ps[0][:150],f'<article><h1>{e(t)}</h1>'+''.join(f'<p>{e(p)}</p>' for p in ps)+'<p>Looking for templates? <a href="/">Browse free studio PSD designs</a>.</p></article>',
   ld={"@context":"https://schema.org","@type":"Article","headline":t,"author":{"@type":"Person","name":"Guru Moorthi"},"datePublished":"2026-10-16"})
  bl+=f'<li><a href="/blog/{s}/">{e(t)}</a></li>'
P('/blog/','Studio PSD Guides & Tutorials – FreeStudioPSD','Guides on editing wedding album PSDs, album sizes and design tips.',f'<article><h1>Guides</h1><ul>{bl}</ul></article>')
ST={'about':('About FreeStudioPSD','<p>FreeStudioPSD is run by Guru Moorthi to help photographers and studios find free, editable Photoshop templates for wedding albums, Karizma albums, birthday albums, covers and backgrounds.</p><p>All files are free to download without login.</p>'),
'privacy':('Privacy Policy','<p>We do not require accounts and do not collect personal data directly. Third-party advertising partners (such as Google AdSense) may use cookies to show relevant ads. You can manage cookies in your browser settings.</p><p>Downloads are served from Google Drive, which is subject to Google\'s privacy policy.</p>'),
'terms':('Terms of Use','<p>Templates are provided free for personal and studio client work. Do not resell or redistribute the files as your own template packs. Files are provided as-is without warranty.</p>'),
'contact':('Contact Us','<p>Email: <b>contact@example.com</b> (placeholder)</p><form onsubmit="alert(\'Contact form coming soon.\');return false"><p><input placeholder="Your name" required style="width:100%;padding:10px"></p><p><input type="email" placeholder="Your email" required style="width:100%;padding:10px"></p><p><textarea placeholder="Message" rows="5" style="width:100%;padding:10px"></textarea></p><button class="btn">Send</button></form>')}
for k,(t,b) in ST.items(): P(f'/{k}/',t+' – FreeStudioPSD',t+' for FreeStudioPSD, free studio PSD downloads.',f'<article><h1>{t}</h1>{b}</article>')
open(f'{S}/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{SITE}{u}</loc></url>' for u in urls)+'</urlset>')
open(f'{S}/robots.txt','w').write(f'User-agent: *\nDisallow: /download/\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
open(f'{S}/_headers','w').write('/img/*\n  Cache-Control: public, max-age=31536000\n/download/*\n  X-Robots-Tag: noindex\n')
print(len(out),sum(len(f) for _,_,f in os.walk(S)))
