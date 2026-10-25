import json,re,sys,os
lang=sys.argv[1];D='/workspace/freepdf-site/src/i18n/'+lang
def walk(a,b,p,errs,st):
  if isinstance(a,dict):
    if not isinstance(b,dict):errs.append(p+' type');return
    if set(a)!=set(b):errs.append(p+' keys %s'%(set(a)^set(b)))
    for k in a:
      if k in b:walk(a[k],b[k],p+'.'+k,errs,st)
  elif isinstance(a,list):
    if not isinstance(b,list) or len(a)!=len(b):errs.append(p+' len');return
    for i,(x,y) in enumerate(zip(a,b)):walk(x,y,p+'[%d]'%i,errs,st)
  elif isinstance(a,str):
    if not isinstance(b,str):errs.append(p+' type');return
    if set(re.findall(r'\{\w+\}',a))!=set(re.findall(r'\{\w+\}',b)):errs.append(p+' ph')
    if sorted(re.findall(r'\]\((/[^)]*)\)',a))!=sorted(re.findall(r'\]\((/[^)]*)\)',b)):errs.append(p+' link')
    st[0]+=1
    if a==b and len(a)>25 and p.split('.')[-1] not in('updated',) and '.related' not in p:st[1]+=1;st.append(p)
  else:
    if a!=b:errs.append(p+' val')
for id in sys.argv[2:]:
  src=json.load(open(f'/tmp/es/src/{id}.json'));f=f'{D}/t-{id}.json'
  if not os.path.exists(f):print(id,'MISSING');continue
  out=json.load(open(f))['tools'][id];errs=[];st=[0,0];walk(src,out,id,errs,st)
  for k in('title','desc'):
    for o in (out,out.get('seo',{})):
      if k in o:
        L=len(o[k].replace('{brand}','Fileopia').replace('{tool}',out['name']))
        if (k=='title' and L>60 and o is out.get('seo')) or (k=='desc' and L>155):errs.append(f'{k} len {L} '+('seo' if o is out.get('seo') else 'tool'))
  print(id,'OK' if not errs and st[1]==0 else 'ERR',errs[:6],'same:',st[2:8])
