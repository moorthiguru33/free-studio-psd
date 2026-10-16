bycat={}
for d in sorted(out,key=lambda x:(-x['q'],x['id'])): bycat.setdefault(d['c'],[]).append(d)
PRO='<div class="procard"><b>Need more premium designs?</b><span>TamilPSD Pro has a much larger studio PSD library for professional albums.</span><a href="https://tamilpsd.in" rel="noopener" target="_blank">Explore TamilPSD Pro →</a></div>'
CATTOT={}
def dhtml(d,c,nav2,tg,relhtml,more):
    alt=f"{d['t']} – free {d['cn']} download"
    url=SITE+'/psd/'+d['slug']+'/'
    return f'''<div class="wrap" id="dp" data-id="{d['id']}"><div class="crumb" style="margin-top:18px"><a href="/">Home</a> › <a href="/category/{c}/">{e(d['cn'])}</a> › <span>{e(d['t'][:60])}</span></div>
<div class="dt"><div><div class="pv"><a href="{d.get('zm',d['img'])}" class="zoom" id="zm"><img src="{d['img']}" alt="{e(alt)}" width="{d['w']}" height="{d['h']}" fetchpriority="high"></a><p class="note">Click the preview to zoom{' (high resolution)' if 'zm' in d else ''} · Full uncropped preview</p></div><a class="btn full mcta" href="/download/?id={d['id']}" rel="nofollow">⬇ Free Download · {d['sz']}</a>{nav2}
<h2 style="margin-top:24px">About this design</h2><p>{e(d['d'])}</p><div class="chips">{tg}</div></div>
<aside class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><span class="free">FREE PSD</span><button class="fav" id="fav" type="button" aria-label="Save to favourites">♡ Save</button></div><h1>{e(d['t'])}</h1><table class="spec"><tr><td>Dimensions</td><td>{d['dim']}</td></tr><tr><td>Resolution</td><td>{d['dpi']}</td></tr><tr><td>File size</td><td>{d['sz']}</td></tr><tr><td>Format</td><td>Layered PSD (ZIP)</td></tr><tr><td>Category</td><td><a href="/category/{c}/" style="color:var(--p2)">{e(d['cn'])}</a></td></tr></table>
<a class="btn full" href="/download/?id={d['id']}" rel="nofollow">⬇ Free Download</a><p class="note">No login required · Opens in Adobe Photoshop CC</p><div class="share"><a target="_blank" rel="noopener" href="https://wa.me/?text={quote(d['t']+' '+url)}">WhatsApp</a><a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u={quote(url)}">Facebook</a><a target="_blank" rel="noopener" href="https://pinterest.com/pin/create/button/?url={quote(url)}&media={quote(SITE+d['img'])}&description={quote(d['t'])}">Pinterest</a><button id="cpy" type="button">Copy link</button></div>{AD("AdSense 300×250 placeholder")}{PRO}</aside></div>
<section class="sec"><div class="sh"><h2>More like this</h2><a class="va" href="/category/{c}/">View all →</a></div><div class="grid">{relhtml}</div><nav class="pg" aria-label="More like this">{more}</nav></section>
<section class="sec" id="rv" hidden><div class="sh"><h2>Recently viewed</h2><a class="va" href="/favourites/">My favourites →</a></div><div class="row" id="rvl"></div></section></div>'''
for c,L in bycat.items():
  tot=(len(L)+PER-1)//PER; CATTOT[c]=tot
  for i,d in enumerate(L):
    d['pv']=L[i-1]['slug'] if i>0 else ''; d['nx']=L[i+1]['slug'] if i+1<len(L) else ''; d['pg']=i//PER+1
    urls.append(f"/psd/{d['slug']}/")
TK=dict(id='ZZIDZZ',slug='ZZSLUGZZ',t='ZZTZZ',d='ZZDZZ',c='ZZCZZ',cn='ZZCNZZ',dim='ZZDIMZZ',dpi='ZZDPIZZ',sz='ZZSZZ',img='ZZIMGZZ',zm='ZZZMZZ',w='ZZWZZ',h='ZZHZZ')
_b=dhtml(TK,'ZZCZZ','ZZNAVZZ','ZZTAGSZZ','ZZRELZZ','ZZMOREZZ').replace('{\'\' if 0 else \'\'}','')
page('/_tpl/design/','ZZTZZ | Free Download','ZZDESCZZ',_b,ld='ZZLDZZ',img='ZZIMGZZ',noindex=False)
_tp=open(S+'/_tpl/design/index.html').read().replace('"ZZLDZZ"','ZZLDZZ').replace(' (high resolution)','ZZHRZZ').replace('text=ZZTZZ%20','text=ZZTQZZ%20').replace('description=ZZTZZ','description=ZZTQZZ')
open(S+'/_tpl/design/index.html','w').write(_tp)
json.dump({'TN':{k:TN[k] for k in TOK},'CATTOT':CATTOT,'SITE':SITE},open(S+'/_tpl/cfg.json','w'))
for k in range(NSH): json.dump(SH.get(k,[]),open(f'{S}/data/shard-{k}.json','w'),separators=(',',':'))
page('/download/','Preparing your download – FreeStudioPSD','Your free PSD download is being prepared.',
f'''<div class="wrap" id="dlbox" style="max-width:980px"><div class="ph" style="text-align:center"><h1>Your free download is almost ready</h1></div>{AD("AdSense placeholder (top)")}<div class="dlg"><div id="nm" style="text-align:center"></div><div style="text-align:center"><p id="t" style="font-size:20px">Preparing your file… <b id="c">15</b>s</p>
<p><a class="btn" id="dl" style="display:none" rel="nofollow noopener" target="_blank">⬇ Download from Google Drive</a></p><p class="note">The file opens on Google Drive. If Drive shows a virus-scan notice for large files, choose “Download anyway”.</p>{PRO}</div></div>{AD("Adsterra / Monetag placeholder")}
<section class="sec"><div class="sh"><h2>While you wait: similar free designs</h2></div><div class="grid" id="dlrel"></div></section>{AD("AdSense placeholder (bottom)")}</div>''',noindex=True)
page('/favourites/','My Favourite PSDs – FreeStudioPSD','Your saved designs.','<div class="wrap"><div class="ph"><h1>My favourites</h1><p>Designs you saved on this device. Tap “♡ Save” on any design page to add it here.</p></div><div class="grid" id="favl"></div><div id="fave" class="empty" hidden><b>No favourites yet</b><p>Browse the <a href="/">latest studio PSDs</a> and save the ones you like.</p></div><section class="sec" id="rv" hidden><div class="sh"><h2>Recently viewed</h2></div><div class="row" id="rvl"></div></section></div>',noindex=True)
hub=f'<div class="wrap"><div class="ph"><h1>Browse all free studio PSDs</h1><p>Every category, size and style on FreeStudioPSD in one place.</p></div><section class="sec"><h2>Categories</h2><div class="chips">'+''.join(f'<a href="/category/{c}/">{e(n)} ({len(bycat[c])})</a>' for c,n in CATS)+'</div></section><section class="sec"><h2>Styles, sizes and popular searches</h2><div class="chips">'+''.join(f'<a href="/tag/{k}/">{e(TN[k])} ({TCOUNT[k]})</a>' for k in TOK)+'</div></section><section class="sec"><h2>Guides</h2><div class="chips">'+''.join(f'<a href="/blog/{s}/">{e(t)}</a>' for s,t,_ in BLOG)+'</div></section><section class="sec"><h2>Top collections</h2><div class="chips">'+''.join(f'<a href="/{x[0]}/">{e(x[1])}</a>' for x in LAND)+'</div></section></div>'
P('/browse/','Browse All Free Studio PSD Categories, Sizes & Styles','Index of all free studio PSD categories, album sizes, styles and guides on FreeStudioPSD.',hub)
