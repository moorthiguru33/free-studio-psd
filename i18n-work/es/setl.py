import sys
f,n,t=sys.argv[1],sys.argv[2],sys.argv[3]
L=open(f).read().split('\n')
for i,l in enumerate(L):
    if l.startswith(n+'\t'): L[i]=n+'\t'+t
open(f,'w').write('\n'.join(L)); print(len(t))
