# usage: python3 add.py batchfile.txt  -> merges into src/i18n/en/9-guides.json
# batch format: blocks separated by blank line; lines: id / title / desc / intro / uses (|) / tips (|) / faq (Q?=A ||)
import json,sys
p='/workspace/freepdf-site/src/i18n/en/9-guides.json';d=json.load(open(p))
for b in open(sys.argv[1]).read().strip().split('\n\n'):
    L=[l.strip() for l in b.strip().split('\n')];i=L[0];o=d['tools'].setdefault(i,{})
    if L[1]!='-':o['title']=L[1]
    if L[2]!='-':o['desc']=L[2]
    o['guide']={'intro':L[3],'uses':L[4].split(' | '),'tips':L[5].split(' | '),'faq':[{'q':q.split('?=')[0]+'?','a':q.split('?=')[1]} for q in L[6].split(' || ')] if len(L)>6 and L[6]!='-' else []}
json.dump(d,open(p,'w'),ensure_ascii=False,indent=0);print(len([k for k in d['tools'] if 'guide' in d['tools'][k]]),'guides')
