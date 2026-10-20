exec(open('gen.py').read().split('# sync new images to R2')[0].split('S=\'site\'')[0]) if False else None
import json,os,subprocess,glob,time
if not os.environ.get('CLOUDFLARE_API_TOKEN') and os.path.exists('/home/box/.secrets/cf_token'): os.environ['CLOUDFLARE_API_TOKEN']=open('/home/box/.secrets/cf_token').read().strip()
M='media'; keep={f[len(M):] for f in glob.glob(M+'/img/*.webp')+glob.glob(M+'/img/zoom/*.webp')+glob.glob(M+'/img/bc/*.webp')+glob.glob(M+'/img/w360/*.webp')+glob.glob(M+'/img/w600/*.webp')}
UP=set(open(M+'/.uploaded').read().split()) if os.path.exists(M+'/.uploaded') else set()
new=sorted(keep-UP); print('to upload',len(new),flush=True)
for i in range(0,len(new),500):
  ch=new[i:i+500]; json.dump([{'key':k.lstrip('/'),'file':os.path.abspath(M+k)} for k in ch],open('/tmp/r2bulk.json','w'))
  for a in range(4):
    r=subprocess.run(['bash','-c','export PATH=/workspace/node22/bin:/home/box/.local/bin:$PATH WRANGLER_CACHE_DIR=/tmp/wcache CLOUDFLARE_ACCOUNT_ID=f111f0309c0fd852152da1211830b227; wrangler r2 bulk put freestudiopsd-media --remote -f /tmp/r2bulk.json --ct image/webp --cc "public, max-age=31536000, immutable" --concurrency 3 -y'],capture_output=True,text=True)
    if r.returncode==0: break
    print('retry',(r.stdout+r.stderr)[-200:],flush=True); time.sleep(150)
  else: print('FAILED chunk',i); break
  UP|=set(ch); open(M+'/.uploaded','w').write('\n'.join(sorted(UP))); print('ok',len(UP),flush=True)
  time.sleep(60)
