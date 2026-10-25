import json,sys,os
L=sys.argv[2] if len(sys.argv)>3 else 'es'
mode,id=sys.argv[1],sys.argv[-1]
W=f'/tmp/{L}' if L!='es' else '/tmp/es'
src=json.load(open(f'/tmp/es/src/{id}.json'))
seo=src.get('seo',{})
comp=seo.get('compare',[])
for k in ('related','updated','compare','compareCols'): seo.pop(k,None)
out=[]
def walk(o,p):
  if isinstance(o,str): out.append((p,o))
  elif isinstance(o,list):
    for i,x in enumerate(o): walk(x,p+[i])
  elif isinstance(o,dict):
    for k,x in o.items(): walk(x,p+[k])
walk(src,[])
cmpmap=json.load(open(f'{W}/cmp_{L}.json')) if os.path.exists(f'{W}/cmp_{L}.json') else {}
cells=[]
for r in comp:
  for c in r:
    if c not in cmpmap and c not in cells and c!='Yes' and c!='No': cells.append(c)
if mode=='dump':
  with open(f'{W}/flat_{id}.txt','w') as f:
    for i,(p,s) in enumerate(out): f.write(f'{i}\t{s}\n')
    for c in cells: f.write(f'C\t{c}\n')
  print(len(out),'strings',len(cells),'cells', sum(len(s) for _,s in out),'chars')
else:
  tx=open(f'{W}/tx/{id}.txt').read().rstrip('\n').split('\n')
  res=json.loads(json.dumps(src)); cm={}
  ss=[l for l in tx if not l.startswith('C\t')]
  cl=[l[2:] for l in tx if l.startswith('C\t')]
  assert len(ss)==len(out),(len(ss),len(out))
  for (p,_),l in zip(out,ss):
    n,t=l.split('\t',1); o=res
    for k in p[:-1]: o=o[k]
    o[p[-1]]=t
  for c,t in zip(cells,cl): cm[c]=t
  if cm: res.setdefault('seo',{})['_cmp']=cm
  os.makedirs(f'{W}/tr',exist_ok=True)
  json.dump(res,open(f'{W}/tr/{id}.json','w'),ensure_ascii=False)
  print('built',id)
