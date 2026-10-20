export PATH=/workspace/node22/bin:/home/box/.local/bin:$PATH WRANGLER_CACHE_DIR=/tmp/wcache CLOUDFLARE_ACCOUNT_ID=f111f0309c0fd852152da1211830b227
[ -z "$CLOUDFLARE_API_TOKEN" ] && [ -f /home/box/.secrets/cf_token ] && export CLOUDFLARE_API_TOKEN="$(cat /home/box/.secrets/cf_token)"
cd /workspace/fsp
git add -A site ads.json ui ui6 deploy_fsp.sh gen.py titles.py build.py blog.py blog2.py dpage.py landing.py landing_x.py idmap.json functions wrangler.toml site_routes.json r2sync.py .gitignore content.py guides_long.py guides_x*.py analytics.json lastmod.json pins.py
git -c user.name="Guru Moorthi" -c user.email="moorthiguru33@users.noreply.github.com" commit -qm "${FSP_MSG:-Auto: add freepsdking upload batch}" && git push -q origin main
wrangler pages deploy site --project-name freestudiopsd --branch main --commit-dirty=true 2>&1 | tail -2
echo "live count: $(curl -s https://freestudiopsd.pages.dev/data/index.json)"
