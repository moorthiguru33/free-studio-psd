import re,sys,glob,collections
W=set('the and with your you for from this that are is to of in on files file page pages choose select download free online convert'.split())
c=collections.Counter();ex={}
for f in glob.glob('/workspace/freepdf-site/dist/es/**/index.html',recursive=True):
  h=open(f).read();h=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S)
  for seg in re.findall(r'>([^<>]{3,})<',h)+re.findall(r'(?:title|placeholder|aria-label|alt|content)="([^"]{3,})"',h):
    ws=re.findall(r'[A-Za-z]+',seg.lower())
    if len(ws)>=2 and sum(w in W for w in ws)>=2: c[seg.strip()[:90]]+=1;ex[seg.strip()[:90]]=f.split('/es/')[1]
for s,n in c.most_common(60):print(n,ex[s],'|',s)
