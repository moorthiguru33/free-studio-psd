import json,sys,glob,os
B='/workspace/freepdf-site/src/i18n/'
def walk(o,p,out):
  if isinstance(o,str): out.append((p,o))
  elif isinstance(o,list):
    for i,x in enumerate(o): walk(x,p+[i],out)
  elif isinstance(o,dict):
    for k,x in o.items():
      if k in('related','updated','compareCols'):continue
      walk(x,p+[k],out)
def flat(id):
  d=json.load(open(B+f'es/t-{id}.json'));out=[];walk(d,[],out);return d,out
if sys.argv[1]=='dump':
  for f in sorted(glob.glob(B+'es/t-*.json')):
    id=f.split('t-')[1][:-5];d,out=flat(id)
    open(f'/tmp/de/fl/{id}.txt','w').write(''.join(f'{i}\t{s}\n'.replace('\n','',0) for i,(p,s) in enumerate(out)))
else:
  for id in sys.argv[2:]:
    d,out=flat(id);L=[l for l in open(f'/tmp/de/tx/{id}.txt').read().split('\n') if l.strip()]
    assert len(L)==len(out),(id,len(L),len(out))
    for (p,_),l in zip(out,L):
      n,t=l.split('\t',1);assert int(n)==out.index((p,_)) or True
      o=d
      for k in p[:-1]:o=o[k]
      o[p[-1]]=t
    json.dump(d,open(B+f'de/t-{id}.json','w'),ensure_ascii=False);print('ok',id)
