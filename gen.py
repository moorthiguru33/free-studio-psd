import json,subprocess,glob,random,os,shutil,re,html,hashlib
random.seed(2026)
SITE="https://psdalbum.in"
IMG="https://img.psdalbum.in"  # R2 custom domain for media (bypasses Pages Function quota); /img/* Function stays as fallback
rows={}
for f in sorted(glob.glob('/workspace/studiopk/rows_batch*.json'))+sorted(glob.glob('/workspace/freepsdking/rows_batch*.json'))+sorted(glob.glob('/workspace/freepsdking/rows_fsp_b*.json'))+sorted(glob.glob('/workspace/freepsdking/rows_reuse*.json')):
  d=os.path.dirname(f)
  for r in json.load(open(f)):
    p=f"{d}/previews/{r['ID']}.webp"
    if r['ID'] not in rows and os.path.exists(p) and 'id=' in r['Download URL']: r['_p']=p; rows[r['ID']]=r
import ast
_st=json.load(open('/workspace/freepsdking/state.json'))
for x in _st.values():
  if x.get('drive_id') and x.get('stage')=='uploaded' and x['id'] not in rows and os.path.exists(f"/workspace/freepsdking/previews/{x['id']}.webp"):
    try: ps=x['psd'] if isinstance(x.get('psd'),dict) else ast.literal_eval(x.get('psd') or '{}')
    except Exception: ps={}
    rows[x['id']]=dict(ID=x['id'],**{'Download URL':x['link'],'Title':x.get('title') or 'Studio Background PSD','Category':x['cat'],'Tags':'','Description':'','Dimensions':f"{ps.get('W','?')}x{ps.get('H','?')} pixels",'DPI':f"{ps.get('dpi',300)} DPI",'File Size':f"{int(x.get('zip_bytes') or x.get('main_bytes') or 0)/1048576:.2f} MB",'Color Mode':ps.get('mode','RGB')},_p=f"/workspace/freepsdking/previews/{x['id']}.webp")
CATMAP={'photo-album-12x36':('wedding-album-12x36','Wedding Album 12x36 PSD'),'photo-album-18x24':('album-18x24','Photo Album 18x24 PSD'),
'photo-album-12x30':('album-12x30','Photo Album 12x30 PSD'),'photo-album-12x18':('album-12x18','Photo Album 12x18 PSD'),
'album-cover':('album-cover','Album Cover PSD'),'album-background':('album-background','Album Background PSD'),
'studio-background':('studio-background','Studio Background PSD'),'birthday-baby-album':('birthday-baby-album','Birthday & Baby Album PSD'),'invitation':('wedding-invitation','Wedding Invitation PSD')}
for r in rows.values():
  if r['Category'].startswith('photo-album') and re.search(r'invitation|save the date|invite',(r['Title']+' '+r['Tags']).lower()): r['Category']='invitation'
quota={k:99999 for k in CATMAP}
pick=[]
for c,q in quota.items():
  L=[r for r in rows.values() if r['Category']==c]; random.shuffle(L); pick+=L[:q]
MAXD=int(os.environ.get('FSP_MAXD','999999'))
if len(pick)>MAXD:
  extra=sorted([r for r in pick if r.get('_fsp')],key=lambda r:r['_fsp'])[MAXD-len(pick):] if False else None
  keepn=MAXD; base=[r for r in pick if not r.get('_fsp')]; fs=sorted([r for r in pick if r.get('_fsp')],key=lambda r:(r['_fsp'],r['ID']))
  pick=base+fs[:max(0,keepn-len(base))]; print('CAP: designs limited to',len(pick),'(dropped',len(fs)-max(0,keepn-len(base)),'new items)')
random.shuffle(pick)
ADJ=['Elegant','Royal','Classic','Modern','Premium','Graceful','Vibrant','Golden','Floral','Timeless','Stylish','Luxury','Soft','Bright','Charming']
THEME={'wedding':'Wedding','muslim':'Muslim Wedding','christian':'Christian Wedding','hindu':'Hindu Wedding','karizma':'Karizma','birthday':'Birthday','baby':'Baby','engagement':'Engagement','reception':'Reception','pre wedding':'Pre-Wedding','kids':'Kids','haldi':'Haldi','mehndi':'Mehndi'}
def theme(r):
  t=(r['Title']+' '+r['Tags']).lower()
  for k,v in THEME.items():
    if k in t: return v
  return 'Studio'
size=lambda r:(re.search(r'(\d+x\d+)',r['Title']) or re.search(r'(\d+x\d+)',r['Category']) or [None,''])[1]
exec(open('titles.py').read())
S='site'
for p in ['psd','category','tag','blog','data']: shutil.rmtree(f'{S}/{p}',ignore_errors=True)
for p in ['img','data','psd','category','blog','download','tag']: os.makedirs(f'{S}/{p}',exist_ok=True)
from PIL import Image
from multiprocessing import Pool
def cv(a):
  src,dst=a; im=Image.open(src); im.thumbnail((720,720)); im.convert('RGB').save(dst,'WEBP',quality=62,method=4)
for d in out:
  im=Image.open(d['src']); d['q']=im.size[0]*im.size[1]//1000+os.path.getsize(d['src'])//1000
  m=re.search(r'([\d.]+)\s*MB',d['sz']); d['mb']=float(m.group(1)) if m else 0
json.dump({d['id']:d['src'] for d in out},open('srcmap.json','w'))
M='media'
todo=[(d['src'],M+d['img']) for d in out if not os.path.exists(M+d['img'])]
best=sorted([d for d in out if d['c']=='wedding-album-12x36'],key=lambda d:('karizma-album-psd' in d['g'],d['q']),reverse=True)[:60]
os.makedirs(M+'/img/zoom',exist_ok=True)
def zm(a):
  src,dst=a; im=Image.open(src); im.thumbnail((1800,1800)); im.convert('RGB').save(dst,'WEBP',quality=70,method=4)
for d in best: d['zm']=f"/img/zoom/{d['slug']}.webp"
with Pool(8) as pl: pl.map(zm,[(d['src'],M+d['zm']) for d in best if not os.path.exists(M+d['zm'])])
# responsive card thumbnails (360w + 600w) from the preview images (never the PSDs); used in srcset once uploaded to R2
for _w in (360,600): os.makedirs(f'{M}/img/w{_w}',exist_ok=True)
def th(a):
  src,slug=a
  try:
    im=Image.open(src).convert('RGB')
    for w,q in ((360,62),(600,64)):
      dst=f'{M}/img/w{w}/{slug}.webp'
      if not os.path.exists(dst): t=im.copy(); t.thumbnail((w,10*w)); t.save(dst,'WEBP',quality=q,method=5)
  except Exception as ex: print('thumb fail',slug,ex)
with Pool(8) as pl: pl.map(th,[(d['src'],d['slug']) for d in out if not (os.path.exists(f"{M}/img/w360/{d['slug']}.webp") and os.path.exists(f"{M}/img/w600/{d['slug']}.webp"))])
_UPD=set(open(M+'/.uploaded').read().split()) if os.path.exists(M+'/.uploaded') else set()
for d in out:
  if f"/img/w360/{d['slug']}.webp" in _UPD and f"/img/w600/{d['slug']}.webp" in _UPD: d['th']=1
print('thumbs live',sum(1 for d in out if d.get('th')),'of',len(out))
for d in out: d.pop('src')
with Pool(8) as pl: pl.map(cv,todo)
for d in out: d['w'],d['h']=Image.open(M+d['img']).size
SH={}
for d in out: SH.setdefault((d['id']-1)//200,[]).append(d)
NSH=max(SH)+1
for k in range(NSH): json.dump(SH.get(k,[]),open(f'{S}/data/shard-{k}.json','w'),separators=(',',':'))
json.dump({'shards':NSH,'count':len(out)},open(f'{S}/data/index.json','w'))
exec(open('build.py').read())
_keep={d['img'] for d in out}|{d['zm'] for d in out if 'zm' in d}
for f in glob.glob(M+'/img/*.webp')+glob.glob(M+'/img/zoom/*.webp'):
  if f[len(M):] not in _keep: os.remove(f)
shutil.rmtree(S+'/img',ignore_errors=True)
# sync new images to R2
if not os.environ.get('FSP_NOUPLOAD'): subprocess.run(['python3','r2sync.py'])
# point image URLs at the R2 custom domain + preconnect hint
if IMG:
  _pc=f'<link rel="preconnect" href="{IMG}">'
  # Google AdSense (Auto ads) loader, async at the end of <head> so it never competes with the LCP preloads
  _ADS='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9817687198003924" crossorigin="anonymous"></script>'
  for _a,_,_fs in os.walk(S):
    for _f in _fs:
      if not _f.endswith(('.html','.xml','.json')): continue
      _p=os.path.join(_a,_f); _s=open(_p,encoding='utf-8').read(); _o=_s
      _s=_s.replace(SITE+'/img/',IMG+'/img/').replace(SITE+'ZZIMGZZ','ZZIMGZZ').replace(SITE+'ZZZMZZ','ZZZMZZ').replace('="/img/','="'+IMG+'/img/').replace('"img":"/img/','"img":"'+IMG+'/img/').replace('"zm":"/img/','"zm":"'+IMG+'/img/')
      if _f.endswith('.html') and _pc not in _s: _s=_s.replace('<meta charset="utf-8">','<meta charset="utf-8">'+_pc,1)
      if _f.endswith('.html') and _ADS not in _s and '</head>' in _s: _s=_s.replace('</head>',_ADS+'</head>',1)
      if _s!=_o: open(_p,'w',encoding='utf-8').write(_s)
shutil.copy('site_routes.json',S+'/_routes.json')
# downloads: never publish raw Drive file ids; shards carry 'k' (fid XOR HMAC-SHA512 keystream), decoded only by functions/api/dl.js
import hmac as _hm,base64 as _b64
_DK=open('/home/box/.secrets/fsp_dl_key').read().strip().encode()
def _enc(i,f):
  ks=_hm.new(_DK,f'fid:{i}'.encode(),'sha512').digest(); b=f.encode(); assert len(b)<=64
  return _b64.urlsafe_b64encode(bytes(x^y for x,y in zip(b,ks))).decode().rstrip('=')
for _f in glob.glob(S+'/data/shard-*.json'):
  _L=json.load(open(_f))
  for _d in _L:
    if 'fid' in _d: _d['k']=_enc(_d['id'],_d.pop('fid'))
  json.dump(_L,open(_f,'w'),separators=(',',':'))

# LCP: inline the stylesheet on the home page (removes one render-blocking round trip before the hero thumbnails paint)
_hp=S+'/index.html'; _h=open(_hp,encoding='utf-8').read(); _m=re.search(r'<link rel="stylesheet" href="/css/site\.css\?v=[^"]*">',_h)
if _m: open(_hp,'w',encoding='utf-8').write(_h.replace(_m.group(0),'<style>'+open(S+'/css/site.css',encoding='utf-8').read().replace('</style','<\\/style')+'</style>',1))

print('FILES',sum(len(f) for _,_,f in os.walk(S)),'MEDIA MB',sum(os.path.getsize(os.path.join(a,f)) for a,_,fs in os.walk(M) for f in fs)//2**20)
