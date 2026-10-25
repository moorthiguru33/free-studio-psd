import sys
id=sys.argv[1];L=open(f'/tmp/es/raw_{id}.txt').read().rstrip('\n').split('\n')
o=[];n=0
for l in L:
  if l.startswith('C|'):o.append('C\t'+l[2:])
  else:o.append(f'{n}\t{l}');n+=1
open(f'/tmp/es/tx/{id}.txt','w').write('\n'.join(o)+'\n')
