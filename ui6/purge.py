# keep only CSS rules whose class/id selectors are used by our HTML/JS (tamilpsd CSS has lots of unrelated UI)
import re,sys,glob
def used_tokens(htmls,jss):
  U=set()
  for t in htmls:
    for m in re.finditer(r'class="([^"]*)"',t): U.update(m.group(1).split())
    for m in re.finditer(r'class=([A-Za-z0-9_-]+)',t): U.add(m.group(1))
    U.update(re.findall(r'id="([^"]+)"',t)); U.update(re.findall(r'<([a-z0-9]+)',t))
  for t in jss: U.update(re.findall(r'[A-Za-z0-9_-]+',t))
  return U
def split_sel(s):
  out=[];d=0;cur=''
  for ch in s:
    if ch in '([': d+=1
    elif ch in ')]': d-=1
    if ch==',' and d==0: out.append(cur);cur=''
    else: cur+=ch
  out.append(cur); return out
def sel_ok(sel,U):
  s=re.sub(r':(not|is|where|has)\(','(',sel)
  s=re.sub(r'\[[^\]]*\]','',s)
  toks=re.findall(r'[.#](-?[A-Za-z_][A-Za-z0-9_-]*)',s)
  return all(t in U for t in toks)
def purge(css,U):
  out=[];i=0;n=len(css)
  while i<n:
    j=css.find('{',i)
    if j<0: break
    pre=css[i:j].strip()
    # find matching brace
    d=1;k=j+1
    while d and k<n:
      if css[k]=='{': d+=1
      elif css[k]=='}': d-=1
      k+=1
    body=css[j+1:k-1]
    if pre.startswith('@media') or pre.startswith('@supports'):
      inner=purge(body,U)
      if inner: out.append(pre+'{'+inner+'}')
    elif pre.startswith('@'):
      if not pre.startswith('@import'): out.append(pre+'{'+body+'}')
    else:
      keep=[x for x in split_sel(pre) if x.strip() and sel_ok(x.strip(),U)]
      if keep and body.strip(): out.append(','.join(keep)+'{'+body+'}')
    i=k
  return ''.join(out)
