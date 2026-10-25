import csv,re,html,json,glob,sys
from collections import Counter
D='/workspace/freepdf-site/dist/'
rows=list(csv.DictReader(open('/workspace/freepdf-site/docs/keywords.csv')))
lim=int(sys.argv[1]) if len(sys.argv)>1 else 40
anch=Counter()
for f in glob.glob(D+'*/index.html'):
    for m in re.finditer(r'<a [^>]*>(.*?)</a>',open(f).read(),re.S): anch[re.sub('<[^>]+>','',m.group(1)).strip().lower()]+=1
def norm(s): return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s))).lower().replace('–',' ').replace('-',' ')
out=[]
for r in rows[:lim]:
    s,p=r['slug'],r['primary'];pn=p.replace('-',' ')
    try: h=open(D+s+'/index.html').read()
    except: out.append((s,'MISSING PAGE'));continue
    g=lambda rx:norm((re.search(rx,h,re.S) or [None,''])[1]) if re.search(rx,h,re.S) else ''
    title=g(r'<title>(.*?)</title>');desc=g(r'name="description" content="(.*?)"');h1=g(r'<h1[^>]*>(.*?)</h1>')
    h2s=[norm(x) for x in re.findall(r'<h2[^>]*>(.*?)</h2>',h,re.S)]
    body=norm(re.sub(r'<(script|style|header|nav|footer)[^>]*>.*?</\1>','',h,flags=re.S))
    i=body.find(h1.strip()[:20]) if h1 else 0;first=' '.join(body[i:].split()[:130])
    faqq=[norm(x) for x in re.findall(r'<summary[^>]*>(.*?)</summary>',h,re.S)]
    ld=norm(' '.join(re.findall(r'application/ld\+json">(.*?)</script>',h,re.S)))
    alts=re.findall(r'alt="([^"]*)"',h)
    toks=pn.split();words=body.split();cnt=body.count(pn);dens=cnt*len(toks)/max(1,len(words))*100
    # a loose match: all tokens present
    has=lambda t:pn in t or all(w in t for w in toks if len(w)>2)
    qs=[q for q in r['questions'].split('; ') if q]
    qcov=sum(1 for q in qs if any(len(set(q.split())&set(f.split()))>=max(3,len(q.split())-2) for f in faqq))
    miss=[k for k,v in [('title',has(title)),('desc',has(desc)),('h1',has(h1)),('h2',any(has(x) for x in h2s)),('intro100',has(first)),('faq',any(has(x) for x in faqq)),('schema',has(ld)),('alt',(not [a for a in alts if a]) or any(has(norm(a)) for a in alts if a)),('anchor',any(has(a) for a in anch if a))] if not v]
    out.append((s,f"miss={','.join(miss) or '-'} dens={dens:.1f}% qcov={qcov}/{len(qs)} words={len(words)}"))
for o in out: print(*o)
