import json,re,csv,time,urllib.request,urllib.parse,concurrent.futures as cf
BR=re.compile(r"i ?love ?pdf|ilovepdf|adobe|acrobat|smallpdf|sejda|pdf24|canva|tinypng|tinyjpg|cloudconvert|freeconvert|reddit|youtube|chatgpt|google|microsoft|cnet|apk|login|download|app\b|ilovimg|iloveimg|photoshop|gimp|python|java|excel vba|npm|linux command|cmd|\bmac\b|iphone|android|windows|chrome|in word$|bluebeam|nitro|foxit|wondershare|preview",re.I)
def sug(q):
    u="https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q="+urllib.parse.quote(q)
    for _ in range(3):
        try: return json.loads(urllib.request.urlopen(u,timeout=10).read().decode('utf-8','ignore'))[1]
        except Exception: time.sleep(1)
    return []
P={"add-page-numbers":"add page numbers to pdf","add-watermark-to-pdf":"add watermark to pdf","delete-pdf-pages":"delete pages from pdf","ocr-pdf":"ocr pdf","image-to-text":"image to text","ist-to-est":"ist to est","remove-background":"remove background from image","upscale-image":"upscale image","qr-code-generator":"qr code generator","password-generator":"password generator","audio-cutter":"audio cutter","edit-pdf":"edit pdf","sign-pdf":"sign pdf"}
tools=json.load(open('/workspace/freepdf-site/src/tools.json'));tools=tools if isinstance(tools,list) else tools['tools']
top=[l.split()[1] for l in open('/workspace/pdf-research/verified-top40.md') if l.startswith('### ')]
slugs=top+[t['slug'] for t in tools if t['slug'] not in top]
# competitor terms
comp={}
for f in ['verified-top40.md','verified-rest.md']:
    try: txt=open('/workspace/pdf-research/'+f).read()
    except: continue
    for blk in re.split(r'\n### ',txt)[1:]:
        s=blk.split()[0];terms=[]
        for m in re.finditer(r'(?:Title|H1): ([^\n·]+)',blk): terms.append(m.group(1).strip())
        for m in re.finditer(r'Sections: ([^\n]+)',blk): terms+= [x.strip() for x in m.group(1).split(' ; ')][:6]
        qs=[];[qs.extend(x.strip() for x in m.group(1).split('|')) for m in re.finditer(r'FAQ \(\d+\): ([^\n]+)',blk)]
        comp[s]=(terms,qs)
def work(s):
    p=P.get(s,s.replace('-',' '))
    a=sug(p);b=sug(('how to convert ' if re.match(r'^[a-z0-9]+ to [a-z0-9]+$',p) and not p.startswith(('add','delete','remove')) else 'how to ')+p);c=sug(p+' free');d=sug('can i '+p);e=sug('is '+p)+sug('what is '+p.split(' to ')[0]) if ' to ' in p else sug('best '+p)
    cl=lambda L:[x for x in dict.fromkeys(L) if re.match('[a-z]',x) and not BR.search(x) and x!=p]
    sec=cl(a+c)[:6]; lt=cl([x for x in a+c if len(x.split())>=4]+b)[:8]; qs=cl(b+d+e)
    qs=[x for x in qs if re.match(r'(how|can|is|what|why|does|which|best)\b',x)][:8]
    t,cq=comp.get(s,([],[]))
    return [s,p,'; '.join(sec),'; '.join(lt),'; '.join(qs),'; '.join([q for q in cq if q.lower()!='none' and not BR.search(q)][:6]),' | '.join(t[:6])]
with cf.ThreadPoolExecutor(6) as ex: rows=list(ex.map(work,slugs))
w=csv.writer(open('/workspace/freepdf-site/docs/keywords.csv','w',newline=''))
w.writerow(['slug','primary','secondary','long_tail','questions','competitor_faq_questions','competitor_titles_h2'])
w.writerows(rows);print(len(rows))
