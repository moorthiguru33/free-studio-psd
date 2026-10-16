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
quota={k:99999 for k in CATMAP}
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
todo=[(d['src'],S+d['img']) for d in out if not os.path.exists(S+d['img'])]
for d in out: d.pop('src')
with Pool(8) as pl: pl.map(cv,todo)
for k in range(0,len(out),200): json.dump(out[k:k+200],open(f'{S}/data/shard-{k//200}.json','w'))
json.dump({'shards':(len(out)+199)//200,'count':len(out)},open(f'{S}/data/index.json','w'))
exec(open('build.py').read())
