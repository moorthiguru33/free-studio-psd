import json,sys,os
lang=sys.argv[1];C=json.load(open(f'/tmp/{lang}/cmp_{lang}.json'))
for id in sys.argv[2:]:
  src=json.load(open(f'/tmp/{lang}/src/{id}.json'));tr=json.load(open(f'/tmp/{lang}/tr/{id}.json'))
  if 'seo' in src and 'compare' in src['seo']:
    rows=tr.get('seo',{}).pop('_cmp',{})  # extra translations
    D={**C,**rows};miss=set()
    def t(c):
      if c in D:return D[c]
      miss.add(c);return c
    tr['seo']['compare']=[[t(c) for c in r] for r in src['seo']['compare']]
    if miss:print(id,'CMP MISSING',json.dumps(sorted(miss),ensure_ascii=False))
  for k in ('related','updated'):
    if 'seo' in src and k in src['seo']:tr['seo'][k]=src['seo'][k]
  for k in list(src.get('seo',{})):
    if k not in tr.get('seo',{}) and k in('compareCols',):tr['seo'][k]=src['seo'][k]
  # reorder seo keys like src
  if 'seo' in src:tr['seo']={k:tr['seo'][k] for k in src['seo'] if k in tr['seo']}|{k:v for k,v in tr['seo'].items() if k not in src['seo']}
  json.dump({'tools':{id:tr}},open(f'/workspace/freepdf-site/src/i18n/{lang}/t-{id}.json','w'),ensure_ascii=False)
