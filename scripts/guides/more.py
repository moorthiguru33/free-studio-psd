# blocks: id / H2 heading / paragraph [/ H2 / paragraph ...] ; optional line starting "FAQ:" Q?=A || Q?=A replaces guide faq
import json,sys
p='/workspace/freepdf-site/src/i18n/en/9-guides.json';d=json.load(open(p))
for b in open(sys.argv[1]).read().strip().split('\n\n'):
    L=[l.strip() for l in b.strip().split('\n')];g=d['tools'][L[0]]['guide'];rest=L[1:]
    fq=[l for l in rest if l.startswith('FAQ:')];rest=[l for l in rest if not l.startswith('FAQ:')]
    g['more']=[[rest[i],rest[i+1]] for i in range(0,len(rest),2)]
    if fq:g['faq']=[{'q':q.split('?=')[0].strip()+'?','a':q.split('?=')[1].strip()} for q in fq[0][4:].split(' || ')]
json.dump(d,open(p,'w'),ensure_ascii=False,indent=0);print('ok')
