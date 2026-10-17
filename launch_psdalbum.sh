#!/usr/bin/env bash
# Launch psdalbum.in: gate on zone active + live SSL, merge branch launch-psdalbum, rebuild, deploy, verify, IndexNow.
set -uo pipefail
export PATH=/workspace/node22/bin:/home/box/.local/bin:$PATH WRANGLER_CACHE_DIR=/tmp/wcache CLOUDFLARE_ACCOUNT_ID=f111f0309c0fd852152da1211830b227
A=f111f0309c0fd852152da1211830b227; Z=0cb14d76365cdef87cbf05394d18ffc2; D=psdalbum.in
cd /workspace/fsp || exit 1
T=$(npx wrangler auth token 2>/dev/null | tail -1)
api(){ curl -s -H "Authorization: Bearer $T" "https://api.cloudflare.com/client/v4$1"; }
ZS=$(api /zones/$Z | python3 -c 'import sys,json;print((json.load(sys.stdin).get("result") or {}).get("status"))')
PS=$(api /accounts/$A/pages/projects/freestudiopsd/domains | python3 -c 'import sys,json;print(" ".join(d["name"]+"="+d["status"] for d in json.load(sys.stdin)["result"]))')
SSL=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 https://$D/)   # curl verifies the cert by default
echo "zone=$ZS pages=[$PS] https://$D -> $SSL"
OURS=$(curl -s --max-time 20 https://$D/data/index.json | head -c 200)
PDOK=0; grep -q "psdalbum.in=active" <<<"$PS" && PDOK=1; [ "${LAUNCH_RELAX:-0}" = 1 ] && [ -n "$OURS" ] && PDOK=1
if [ "$ZS" != active ] || [ "$SSL" != 200 ] || [ $PDOK != 1 ]; then echo "NOT READY - aborting, nothing changed"; exit 2; fi
# don't collide with the uploader's own rebuild/deploy
while pgrep -f "python3 gen.py|deploy_fsp.sh|wrangler pages deploy" >/dev/null; do echo "waiting for uploader rebuild..."; sleep 30; done
git -c user.name="Guru Moorthi" -c user.email="moorthiguru33@users.noreply.github.com" merge --no-edit launch-psdalbum || { echo "MERGE CONFLICT - resolve manually"; git merge --abort; exit 3; }
python3 gen.py 2>&1 | tail -4
grep -q "Sitemap: https://$D/sitemap.xml" site/robots.txt || { echo "build did not pick up new SITE"; exit 4; }
bash deploy_fsp.sh 2>&1 | tail -6
sleep 20
echo "== verify"
DES=$(grep -o "https://$D/psd/[^<]*" site/sitemap-1.xml | head -1); CAT=$(grep -o "https://$D/category/[^<]*" site/sitemap-*.xml | head -1 | cut -d: -f2-)
for u in https://$D/ "$DES" "$CAT" https://$D/sitemap.xml https://$D/robots.txt; do
  echo "$(curl -s -o /tmp/lp.html -w '%{http_code}' "$u") $u canon=$(grep -o '<link rel="canonical" href="[^"]*"' /tmp/lp.html | head -1 | cut -d'"' -f4)"; done
for u in https://www.$D/ "https://www.$D/category/x/" https://freestudiopsd.pages.dev/ https://freestudiopsd.pages.dev/sitemap.xml; do
  echo "$(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' "$u")  ($u)"; done
echo "== IndexNow"
K=$(cat indexnow.key)
curl -s -o /dev/null -w "key file %{http_code}\n" https://$D/$K.txt
python3 - "$D" "$K" <<'PY'
import sys,re,glob,json,urllib.request
D,K=sys.argv[1:]
urls=sorted({u for f in glob.glob('site/sitemap-[0-9]*.xml') for u in re.findall(r'<loc>([^<]+)</loc>',open(f).read())})
print('urls',len(urls))
for i in range(0,len(urls),5000):
  body=json.dumps({"host":D,"key":K,"keyLocation":f"https://{D}/{K}.txt","urlList":urls[i:i+5000]}).encode()
  rq=urllib.request.Request("https://api.indexnow.org/indexnow",body,{"Content-Type":"application/json; charset=utf-8","User-Agent":"psdalbum-indexnow/1.0"})
  try: print('IndexNow',urllib.request.urlopen(rq,timeout=60).status)
  except Exception as e: print('IndexNow error',e)
PY
