# Generate 1000x1500 Pinterest pins for top designs + bulk-upload CSVs. Does not post anything.
import json,glob,csv,os,re,textwrap
from PIL import Image,ImageDraw,ImageFont,ImageFilter
OUT='/workspace/psdalbum-pins'; os.makedirs(OUT+'/img',exist_ok=True)
G='/usr/share/fonts/truetype/sand-box/google/Poppins/Poppins-'
F=lambda w,s:ImageFont.truetype(G+w+'.ttf',s)
D=[d for f in glob.glob('/workspace/fsp/site/data/shard-*.json') for d in json.load(open(f))]
SRC=json.load(open('/workspace/fsp/srcmap.json'))
Q={'wedding-album-12x36':150,'album-cover':35,'album-background':30,'album-12x30':25,'album-18x24':20,'birthday-baby-album':20,'studio-background':10,'wedding-invitation':10}
BOARD={'wedding-album-12x36':'12x36 Wedding Album PSD Free Download','album-cover':'Album Cover PSD Designs','album-background':'Album Background PSD','album-12x30':'12x30 & 18x24 Album PSD','album-18x24':'12x30 & 18x24 Album PSD','birthday-baby-album':'Birthday & Baby Album PSD','studio-background':'Studio Background PSD','wedding-invitation':'Wedding Invitation PSD Templates'}
pick=[]
for c,n in Q.items():
  L=sorted([d for d in D if d['c']==c],key=lambda d:(-d['q'],d['id']))
  seen=set(); 
  for d in L:
    k=re.sub(r'[^a-z]','',d['t'].lower().split('–')[-1])[:14]   # avoid near-identical titles
    if k in seen: continue
    seen.add(k); pick.append(d)
    if sum(x['c']==c for x in pick)>=n: break
def board(d): return 'Karizma Album Design PSD' if d['c']=='wedding-album-12x36' and 'karizma-album-psd' in d['g'] else BOARD[d['c']]
def src(d):
  p=SRC.get(str(d['id'])) or ''
  if p and os.path.exists(p): return Image.open(p).convert('RGB')
  return Image.open('/workspace/fsp/media'+d['img'].replace('https://img.psdalbum.in','')).convert('RGB')
def fit(im,w,h):
  r=min(w/im.width,h/im.height); return im.resize((max(1,int(im.width*r)),max(1,int(im.height*r))),Image.LANCZOS)
def card(base,im,x,y,rad=18):
  sh=Image.new('L',(im.width+40,im.height+40),0); ImageDraw.Draw(sh).rounded_rectangle((20,24,im.width+20,im.height+24),rad,fill=90)
  base.paste((60,40,20),(x-20,y-20),sh.filter(ImageFilter.GaussianBlur(12)))
  m=Image.new('L',im.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,im.width,im.height),rad,fill=255); base.paste(im,(x,y),m)
def size_lbl(d):
  m=re.search(r'(\d+x\d+)',d['cn']+' '+d['t']); return m.group(1) if m else ''
rows=[]
for d in pick:
  W,H=1000,1500; im=Image.new('RGB',(W,H),'#FAF7F2'); dr=ImageDraw.Draw(im)
  dr.rounded_rectangle((40,40,330,96),28,fill='#3b1a8f'); dr.text((185,68),'FREE PSD DOWNLOAD',font=F('Bold',24),fill='#fff',anchor='mm')
  dr.text((960,68),'PSD Album',font=F('Bold',34),fill='#3b1a8f',anchor='rm')
  s=src(d); y=130
  if s.width/s.height>=2:
    half=s.crop((0,0,s.width//2,s.height)); a=fit(half,920,560); card(im,a,(W-a.width)//2,y); y+=a.height+34
    b=fit(s,920,300); card(im,b,(W-b.width)//2,y,12); y+=b.height+12
    dr.text((W//2,y+14),'Full spread preview',font=F('Medium',22),fill='#7a6a55',anchor='mm'); y+=40
  else:
    a=fit(s,920,900); card(im,a,(W-a.width)//2,y); y+=a.height+40
  t=re.sub(r'\s+',' ',d['t']).strip()
  ft=F('Bold',50); lines=textwrap.wrap(t,26)[:3]
  while len(textwrap.wrap(t,26))>3 and ft.size>40: ft=F('Bold',ft.size-4); lines=textwrap.wrap(t,30)[:3]
  blk=len(lines)*(ft.size+12)+50; ty=y+max(10,(1340-y-blk)//2)
  for ln in lines: dr.text((W//2,ty),ln,font=ft,fill='#1f1a14',anchor='mt'); ty+=ft.size+12
  spec=' · '.join(x for x in [size_lbl(d), d['dpi'], 'Layered PSD', 'No login'] if x)
  dr.text((W//2,ty+8),spec,font=F('Medium',28),fill='#7a5c12',anchor='mt')
  dr.rectangle((0,1370,W,H),fill='#3b1a8f'); dr.text((W//2,1435),'psdalbum.in',font=F('Bold',58),fill='#fde68a',anchor='mm')
  fn=f"{d['slug']}.jpg"; im.save(f'{OUT}/img/{fn}','JPEG',quality=86,optimize=True,progressive=True)
  desc=(f"Free download: {t}. Layered Photoshop PSD for {d['cn'].replace(' PSD','').lower()} work – {d['dim']}, {d['dpi']}, {d['sz']}. "
        f"Edit photos, names and colours in Photoshop CC, then print. No login, no password. More free album PSDs at psdalbum.in")[:495]
  kw=', '.join(dict.fromkeys([d['cn'].lower(),'free psd','album psd','wedding album psd' if 'wedding' in d['c'] or 'album' in d['c'] else 'photoshop template']+[g.replace('-',' ') for g in d['g'][:4]]))
  rows.append({'Title':t[:100],'Media URL':f'https://img.psdalbum.in/pins/{fn}','Pinterest board':board(d),'Thumbnail':'','Description':desc,
    'Link':f"https://psdalbum.in/psd/{d['slug']}/?utm_source=pinterest&utm_medium=pin&utm_campaign=bulk1",'Publish date':'','Keywords':kw})
cols=['Title','Media URL','Pinterest board','Thumbnail','Description','Link','Publish date','Keywords']
for i in range(0,len(rows),150):
  with open(f'{OUT}/pinterest_bulk_{i//150+1}.csv','w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader(); w.writerows(rows[i:i+150])
json.dump([{'key':'pins/'+os.path.basename(r['Media URL']),'file':f"{OUT}/img/{os.path.basename(r['Media URL'])}"} for r in rows],open(f'{OUT}/r2bulk.json','w'))
print('pins',len(rows),{b:sum(r['Pinterest board']==b for r in rows) for b in sorted({r['Pinterest board'] for r in rows})})
