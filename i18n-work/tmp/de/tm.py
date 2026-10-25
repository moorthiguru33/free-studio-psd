import json,sys,glob,os
TM='/tmp/de/tm.json';tm=json.load(open(TM)) if os.path.exists(TM) else {}
order=[];seen=set()
for f in sorted(glob.glob('/tmp/de/fl/*.txt')):
  for l in open(f).read().split('\n'):
    if '\t' in l:
      s=l.split('\t',1)[1]
      if s not in seen:seen.add(s);order.append(s)
if sys.argv[1]=='next':
  todo=[s for s in order if s not in tm];n=int(sys.argv[2]);c=0;out=[]
  for s in todo:
    out.append(f'{order.index(s)}\t{s}');c+=len(s)
    if c>n:break
  print('\n'.join(out));print('#left',len(todo),sum(map(len,todo)),file=sys.stderr)
elif sys.argv[1]=='add':
  for l in open(sys.argv[2]).read().split('\n'):
    if '\t' in l:
      i,t=l.split('\t',1);tm[order[int(i)]]=t
  json.dump(tm,open(TM,'w'),ensure_ascii=False);print('tm',len(tm),'of',len(order))
elif sys.argv[1]=='build':
  for f in sorted(glob.glob('/tmp/de/fl/*.txt')):
    id=os.path.basename(f)[:-4];L=[l for l in open(f).read().split('\n') if '\t' in l]
    if all(l.split('\t',1)[1] in tm for l in L):
      open(f'/tmp/de/tx/{id}.txt','w').write('\n'.join(l.split('\t')[0]+'\t'+tm[l.split('\t',1)[1]] for l in L)+'\n');print(id,end=' ')
