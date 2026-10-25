#!/usr/bin/env python3
"""python3 newtools.py src.txt out.json  – builds i18n tool entries (name, short, title, desc, h1, steps, faq, guide) from a block file.
Blocks start with '@id'. Keys: name short title desc h1 steps(a | b) faq(Q?=A || Q?=A) intro uses tips; then '## Heading' lines followed by paragraph lines; 'gfaq:' = guide FAQ."""
import sys,json,re
src,out=sys.argv[1],sys.argv[2]
try: data=json.load(open(out))
except Exception: data={}
tools=data.setdefault('tools',{})
ui=data.setdefault('ui',{})
cur=None;h=None
def faq(s): return [{'q':q.strip(),'a':a.strip()} for q,a in (x.split('?=',1) for x in s.split(' || '))] if s.strip()!='-' else []
for line in open(src,encoding='utf-8'):
    line=line.rstrip('\n')
    if not line.strip(): continue
    if line.startswith('ui.'):
        k,v=line[3:].split(':',1);ui[k.strip()]=v.strip();continue
    if line.startswith('@'):
        cur={'guide':{'more':[]}};tools[line[1:].strip()]=cur;h=None;continue
    if line.startswith('## '):
        h=[line[3:].strip(),''];cur['guide']['more'].append(h);continue
    m=re.match(r'^(name|short|title|desc|h1|steps|faq|gfaq|intro|uses|tips):\s*(.*)$',line)
    if m and h is None:
        k,v=m.groups()
        if k=='steps': cur['steps']=[x.strip() for x in v.split(' | ')]
        elif k=='faq': cur['faq']=faq(v)
        elif k=='gfaq': cur['guide']['faq']=faq(v)
        elif k in('uses','tips'): cur['guide'][k]=[x.strip() for x in v.split(' | ')]
        elif k=='intro': cur['guide']['intro']=v
        else: cur[k]=v
        continue
    if h is not None: h[1]=(h[1]+' '+line.strip()).strip()
for t in tools.values(): t['guide'].setdefault('faq',[])
json.dump(data,open(out,'w'),ensure_ascii=False,indent=0)
print(len(tools),'tools')
