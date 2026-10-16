ADJ=['Elegant','Royal','Classic','Modern','Premium','Graceful','Vibrant','Golden','Floral','Timeless','Stylish','Luxury','Soft Pastel','Bright','Charming','Traditional','Minimal','Grand','Rich Maroon','Dreamy','Cinematic','Ornate','Fresh','Regal','Artistic']
FMT=["{a} {th} {k} {sz} PSD – Free Download","{th} {k} {sz} PSD Template – {a} Layout","Free {a} {th} {k} PSD {sz}","{sz} {th} {k} PSD Design – {a} Style","{a} {k} PSD for {th} Photos {sz}","Editable {th} {k} {sz} PSD – {a} Theme","{a} {th} {k} Sheet {sz} PSD Free"]
INTRO=["Give your client album a polished finish with this","Save hours of layout work with this","Create a memorable keepsake using this","Impress couples and families with this","Speed up your studio workflow with this","Deliver albums faster with this","Add a premium touch to every spread with this","Bring your photos to life with this","Here is a ready-to-print","Download this hand-picked"]
USE=["Simply place photos into the smart clipping masks and tweak the colours.","Every element sits on its own layer, so swapping photos and text takes minutes.","The layout is balanced for print, leaving room for portraits and candid shots.","Fonts, shapes and decorations are fully editable to match each client's taste.","Clipping masks keep each photo neatly inside its frame while you resize it.","Background, ornaments and text are grouped separately for quick edits."]
AUD=["Ideal for wedding photographers, Karizma album designers and local photo studios.","A great pick for studios that print albums every week.","Works well for both beginners and experienced Photoshop designers.","Perfect for event photographers who want consistent, professional albums.","Suitable for digital labs, album designers and freelance photographers."]
TIP=["Tip: keep faces away from the centre fold before printing.","Tip: proof the spread at 100% zoom before sending it to the lab.","Tip: use an adjustment layer to match the theme colours to your photos.","Tip: save a flattened JPG copy for the print lab and keep the PSD for edits.",""]
THEME={'karizma':'Karizma','muslim':'Muslim Wedding','christian':'Christian Wedding','hindu':'Hindu Wedding','pre wedding':'Pre-Wedding','pre-wedding':'Pre-Wedding','engagement':'Engagement','reception':'Reception','haldi':'Haldi','mehndi':'Mehndi','birthday':'Birthday','baby':'Baby','kids':'Kids','puberty':'Puberty Ceremony','indian':'Indian Wedding','wedding':'Wedding'}
TAGS={ # slug: (heading, predicate)
 'wedding-album-12x36-psd-free-download':('Wedding Album 12x36 PSD Free Download',lambda d,t:d['c']=='wedding-album-12x36'),
 'karizma-album-psd':('Karizma Album PSD',lambda d,t:'karizma' in t),
 'muslim-wedding-album-psd':('Muslim Wedding Album PSD',lambda d,t:'muslim' in t),
 'christian-wedding-album-psd':('Christian Wedding Album PSD',lambda d,t:'christian' in t),
 'hindu-wedding-album-psd':('Hindu Wedding Album PSD',lambda d,t:'hindu' in t),
 'indian-wedding-album-psd':('Indian Wedding Album PSD',lambda d,t:'indian' in t),
 'pre-wedding-album-psd':('Pre-Wedding Album PSD',lambda d,t:'pre wedding' in t or 'pre-wedding' in t),
 'engagement-album-psd':('Engagement Album PSD',lambda d,t:'engagement' in t),
 'reception-album-psd':('Reception Album PSD',lambda d,t:'reception' in t),
 'birthday-album-psd-free-download':('Birthday Album PSD Free Download',lambda d,t:'birthday' in t),
 'baby-album-psd':('Baby Album PSD',lambda d,t:'baby' in t or 'kids' in t),
 'album-cover-psd-free-download':('Album Cover PSD Free Download',lambda d,t:d['c']=='album-cover'),
 'wedding-album-background-psd':('Wedding Album Background PSD',lambda d,t:d['c']=='album-background'),
 'studio-backdrop-psd':('Studio Backdrop PSD',lambda d,t:d['c']=='studio-background'),
 '12x36-album-psd':('12x36 Album PSD',lambda d,t:'12x36' in t),
 '12x30-album-psd':('12x30 Album PSD',lambda d,t:'12x30' in t),
 '18x24-album-psd':('18x24 Album PSD',lambda d,t:'18x24' in t),
 '12x18-album-psd':('12x18 Album PSD',lambda d,t:'12x18' in t),
 '6x18-album-psd':('6x18 Album PSD',lambda d,t:'6x18' in t),
 '300-dpi-album-psd':('300 DPI Album PSD',lambda d,t:'300 dpi' in t),
 'floral-album-psd':('Floral Album PSD',lambda d,t:'floral' in t or 'flower' in t),
 'tamil-wedding-album-psd':('Tamil Wedding Album PSD',lambda d,t:d['c'] in('wedding-album-12x36','album-cover','album-background') and any(w in t for w in('tamil','hindu','indian','temple','traditional'))),
 'south-indian-wedding-album-psd':('South Indian Wedding Album PSD',lambda d,t:any(w in t for w in('tamil','kerala','south indian','hindu')) and 'wedding' in t),
 'karizma-album-12x36-psd-free-download':('Karizma Album 12x36 PSD Free Download',lambda d,t:'karizma' in t and '12x36' in t),
 'wedding-invitation-psd':('Wedding Invitation PSD',lambda d,t:d['c']=='wedding-invitation'),
 'photo-album-psd-free-download':('Photo Album PSD Free Download',lambda d,t:d['c'].startswith(('wedding-album','album-1'))),
 'golden-album-psd':('Golden Album PSD',lambda d,t:'gold' in t),
}
def theme(r):
  t=(r['Title']+' '+r['Tags']).lower()
  for k,v in THEME.items():
    if k in t: return v
  return 'Studio'
out=[];seen=set();BUCK={}
MOTIF=['Floral Border','Gold Frame','Mandala Art','Bokeh Lights','Watercolour Splash','Paisley Pattern','Lace Ornaments','Damask Texture','Vintage Frame','Rose Petals','Glitter Accents','Geometric Lines','Royal Arch','Temple Motif','Peacock Art','Pastel Clouds','Kolam Pattern','Lotus Design','Brush Strokes','Silk Texture']
FMT2=["{a} {th} {k} {sz} PSD with {m}","{th} {k} {sz} PSD – {a} {m} Design","{a} {k} {sz} PSD for {th} – {m}","{sz} {th} {k} PSD in {a} {m} Style","Free {a} {th} {k} {sz} PSD – {m}","{a} {m} {th} {k} {sz} PSD"]
IDMAP=json.load(open('idmap.json')) if os.path.exists('idmap.json') else {}
seen={v['t'] for v in IDMAP.values()}
NEXT=max([v['id'] for v in IDMAP.values()]+[0])+1
pick.sort(key=lambda r:(IDMAP[r['ID']]['id'] if r['ID'] in IDMAP else 10**9, r['ID']))
for r in pick:
  cslug,cname=CATMAP[r['Category']]
  m0=IDMAP.get(r['ID'])
  if m0 and m0.get('c')==cslug:
    did,t,slug,desc=m0['id'],m0['t'],m0['slug'],m0['d']
  else:
    rng=random.Random(r['ID'])
    th=theme(r); sz=size(r); kind=re.sub(r'\s*\d+x\d+','',cname.replace(' PSD','')).strip()
    if th=='Studio' or th in kind or ('Wedding' in th and 'Wedding' in kind and th=='Wedding'): th=''
    if 'Wedding' in th and 'Wedding' in kind: kind=kind.replace('Wedding ','')
    combos=[(f,a,m) for f in FMT2 for a in ADJ for m in MOTIF if a[:4].lower() not in m.lower()]; rng.shuffle(combos)
    t=None
    for f,a,m in combos:
      x=re.sub(r'\s+',' ',re.sub(r'\b(\w+) \1\b',r'\1',f.format(a=a,th=th,k=kind,sz=sz,m=m))).strip().replace(' for –',' –').replace(' for  ',' ')
      if x not in seen: t=x; break
    if t is None:
      for f,a,m in combos:
        x=f"{a} & {rng.choice(ADJ)} {th} {kind} {sz} PSD with {m}".replace('  ',' ')
        if x not in seen: t=x; break
    did=m0['id'] if m0 else NEXT
    if not m0: NEXT+=1
    slug=re.sub(r'[^a-z0-9]+','-',t.lower()).strip('-')[:70].strip('-')+'-'+str(did)
    desc=f"{rng.choice(INTRO)} {re.sub(r' – .*','',t).lower()} Photoshop file. {rng.choice(USE)} {rng.choice(AUD)} Size: {r['Dimensions']} at {r['DPI']}, {r['Color Mode']} colour, about {r['File Size']}. Free download, no login needed. {rng.choice(TIP)}".strip()
    IDMAP[r['ID']]=dict(id=did,t=t,slug=slug,d=desc,c=cslug)
  seen.add(t)
  fid=re.search(r'id=([\w-]+)',r['Download URL']).group(1)
  d=dict(id=did,slug=slug,t=t,d=desc,c=cslug,cn=cname,dim=r['Dimensions'],dpi=r['DPI'],sz=r['File Size'],img=f"/img/{slug}.webp",fid=fid,src=r['_p'])
  txt=(r['Title']+' '+r['Tags']+' '+t+' '+r['DPI']).lower()
  d['g']=[k for k,(h,f) in TAGS.items() if f(d,txt)]
  out.append(d)

json.dump(IDMAP,open('idmap.json','w'))
out.sort(key=lambda d:d['id'])
TINTRO={'tamil-wedding-album-psd':'Free Tamil wedding album PSD designs with traditional temple motifs, rich maroon and gold themes, ready for 12x36 album printing. Popular with studios in Tamil Nadu for Kalyanam, Muhurtham and reception albums.',
'south-indian-wedding-album-psd':'South Indian wedding album PSD templates inspired by Tamil, Kerala and Hindu wedding traditions. Layered files with editable frames for ceremony and family photos.',
'karizma-album-12x36-psd-free-download':'Karizma album 12x36 PSD sheets for free download. These wide panoramic spreads are the most requested format for premium wedding albums.'}
