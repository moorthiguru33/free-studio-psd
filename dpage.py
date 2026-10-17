bycat={}
for d in sorted(out,key=lambda x:(-x['q'],x['id'])): bycat.setdefault(d['c'],[]).append(d)
PRO='<div class="procard"><b>Need more premium designs?</b><span>TamilPSD Pro has a much larger studio PSD library for professional albums.</span><a href="https://tamilpsd.in" rel="noopener" target="_blank">Explore TamilPSD Pro →</a></div>'
DLI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>'
CATTOT={}
def dhtml(d,c,nav2,tg,relhtml,more):
    alt=f"{d['t']} – free {d['cn']} download"
    url=SITE+'/psd/'+d['slug']+'/'
    return f'''<div class="wrap" id="dp" data-id="{d['id']}"><div class="crumb"><a href="/">Home</a> › <a href="/category/{c}/">{e(d['cn'])}</a> › <span>{e(d['t'][:60])}</span></div>
<div class="dt"><div><div class="pv"><a href="{d.get('zm',d['img'])}" class="zoom" id="zm"><img src="{d['img']}" alt="{e(alt)}" width="{d['w']}" height="{d['h']}" fetchpriority="high"></a></div><div class="pvm"><span class="tagp">{e(d['cn'].replace(' PSD',''))}</span><span>Click to zoom{' (high resolution)' if 'zm' in d else ''} · #fsp-{d['id']}</span></div>{nav2}</div>
<aside class="panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="free">★ Free PSD</span><button class="fav" id="fav" type="button" aria-label="Save to favourites">♡ Save</button></div><h1>{e(d['t'])}</h1><p class="sub">Design #{d['id']} · {d['dim']} · {d['dpi']} · {d['sz']} · <a href="/category/{c}/">{e(d['cn'].replace(' PSD',''))}</a></p>
<table class="spec"><tr><td>Design ID</td><td>#fsp-{d['id']}</td></tr><tr><td>Category</td><td><a href="/category/{c}/">{e(d['cn'])}</a></td></tr><tr><td>File type</td><td><span class="ftb">PSD</span>Layered Photoshop (ZIP)</td></tr><tr><td>License</td><td><span class="okb">✓ Free · personal &amp; client work</span></td></tr><tr><td>Tags</td><td style="font-size:12.5px">{tg}</td></tr></table>
<div class="schips"><span>📐 {d['dim']}</span><span>🖨 {d['dpi']}</span><span>💾 {d['sz']}</span><span>💻 Photoshop CC</span></div>
<a class="btn full dlb" href="/download/?id={d['id']}" rel="nofollow"><span class="di">{DLI}</span><span><b>Download PSD — Free</b><small>No login · {d['sz']} · Google Drive</small></span><span class="ar">→</span></a>
<div class="share">Share: <a target="_blank" rel="noopener" href="https://wa.me/?text={quote(d['t']+' '+url)}">WhatsApp</a><a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u={quote(url)}">Facebook</a><a target="_blank" rel="noopener" href="https://pinterest.com/pin/create/button/?url={quote(url)}&media={quote(SITE+d['img'])}&description={quote(d['t'])}">Pinterest</a><button id="cpy" type="button">Copy link</button></div>
<div class="box"><h4>📥 How to download</h4><ol><li>Click <b>Download PSD</b> above</li><li>Wait a few seconds for the secure Google Drive link</li><li>If Drive shows a virus-scan notice, choose <b>Download anyway</b></li><li>Extract the ZIP and open the PSD in <b>Adobe Photoshop CC</b></li></ol></div>
<div class="box warn">⚠️ Download not starting? Try again, or tell us via <a href="/contact/">Contact</a>.</div>{PRO}</aside></div>
<section class="about"><h2>📝 About this design</h2><p>{e(d['d'])}</p><h2>🖨 Print &amp; usage tips</h2><p>Clip your photos into the frame layers with Alt+Ctrl+G, keep important faces away from the centre fold, and check your lab's bleed before export.</p><p style="margin:0;font-size:13.5px">More in <a href="/category/{c}/" style="color:var(--goldi);text-decoration:underline">{e(d['cn'])}</a> · Guide: <a href="/blog/" style="color:var(--goldi);text-decoration:underline">Album design guides</a></p></section>
{AD('incontent')}
<section class="sec"><div class="sh"><div><p class="eyb">Similar designs</p><h2>More like this</h2></div><a class="va" href="/category/{c}/">View all →</a></div><div class="grid">{relhtml}</div><nav class="pg" aria-label="More like this">{more}</nav></section>
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
f'''<div class="wrap dlw" id="dlbox"><div class="ph" style="text-align:center"><p class="eyb">Free download</p><h1>Your free download is almost ready</h1></div>{AD("countdown_top")}<div class="dlcard"><div id="nm" style="text-align:center"></div><div class="cd"><div id="ring"><div class="ring"><b id="c">15</b>s</div></div><p id="t" style="font-size:18px;font-weight:700;margin:8px 0 0">Preparing your secure Google Drive link…</p>
<div class="dlslot"><a class="btn" id="dl" style="visibility:hidden" rel="nofollow noopener" target="_blank"><span>⬇ Download from Google Drive</span></a></div><p class="note">The file opens on Google Drive. If Drive shows a virus-scan notice for large files, choose “Download anyway”.</p>{PRO}</div></div>{AD("countdown_mid")}
<section class="sec"><div class="sh"><h2>While you wait: similar free designs</h2></div><div class="grid" id="dlrel"></div></section>{AD("countdown_bottom")}</div>''',noindex=True,lb=False)
page('/favourites/','My Favourite PSDs – FreeStudioPSD','Your saved designs.','<div class="wrap"><div class="ph"><p class="eyb">Saved</p><h1>My favourites</h1><p>Designs you saved on this device. Tap “♡ Save” on any design page to add it here.</p></div><div class="grid" id="favl"></div><div id="fave" class="empty" hidden><b>No favourites yet</b><p>Browse the <a href="/">latest studio PSDs</a> and save the ones you like.</p></div><section class="sec" id="rv" hidden><div class="sh"><h2>Recently viewed</h2></div><div class="row" id="rvl"></div></section></div>',noindex=True)
hub=f'<div class="wrap"><div class="ph"><p class="eyb">Categories</p><h1>Browse all free studio PSDs</h1><p>Every category, size and style on FreeStudioPSD in one place.</p></div><section class="sec"><h2>Categories</h2><div class="chips">'+''.join(f'<a href="/category/{c}/">{e(n)} ({len(bycat[c])})</a>' for c,n in CATS)+'</div></section><section class="sec"><h2>Styles, sizes and popular searches</h2><div class="chips">'+''.join(f'<a href="/tag/{k}/">{e(TN[k])} ({TCOUNT[k]})</a>' for k in TOK)+'</div></section><section class="sec"><h2>Guides</h2><div class="chips">'+''.join(f'<a href="/blog/{s}/">{e(t)}</a>' for s,t,_ in BLOG)+'</div></section><section class="sec"><h2>Top collections</h2><div class="chips">'+''.join(f'<a href="/{x[0]}/">{e(x[1])}</a>' for x in LAND)+'</div></section></div>'
P('/browse/','Browse All Free Studio PSD Categories, Sizes & Styles','Index of all free studio PSD categories, album sizes, styles and guides on FreeStudioPSD.',hub)
