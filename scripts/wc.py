import sys,re,html
from html.parser import HTMLParser
def words(path):
    s=open(path,encoding='utf-8').read()
    m=re.search(r'<main[^>]*>(.*)</main>',s,re.S); b=m.group(1) if m else s
    b=re.sub(r'<(script|style|nav)[^>]*>.*?</\1>','',b,flags=re.S)
    b=re.sub(r'<section class="rel">.*?</section>','',b,flags=re.S)
    t=html.unescape(re.sub(r'<[^>]+>',' ',b))
    w=re.findall(r"[A-Za-z0-9][\w'’.-]*",t)
    return len(w),len(set(x.lower() for x in w))
for p in sys.argv[1:]:
    s=open(p,encoding='utf-8').read()
    ti=re.search(r'<title>(.*?)</title>',s).group(1); de=re.search(r'<meta name="description" content="(.*?)"',s).group(1)
    n,u=words(p); fq=s.count('"@type":"Question"')
    print(f"{p.split('dist/')[-1]:32} words={n} uniq={u} faq={fq} title={len(html.unescape(ti))} desc={len(html.unescape(de))}")
