// Switch the site to a new domain: node scripts/set-domain.js https://www.example.com
// Updates src/site.json baseUrl (canonical, hreflang, sitemap, OG, robots, JSON-LD all derive from it),
// keeps the old host in legacyHosts (build then emits functions/_middleware.js that 301s pages.dev -> new domain) and rebuilds.
const fs=require('fs'),path=require('path');const f=path.join(__dirname,'..','src/site.json');const s=JSON.parse(fs.readFileSync(f));
const u=(process.argv[2]||'').replace(/\/+$/,'');if(!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(u)){console.error('usage: node scripts/set-domain.js https://www.example.com');process.exit(1);}
const old=new URL(s.baseUrl).host;s.legacyHosts=[...new Set([...(s.legacyHosts||[]),old])].filter(h=>h!==new URL(u).host);s.baseUrl=u;
fs.writeFileSync(f,JSON.stringify(s,null,1)+'\n');console.log('baseUrl ->',u,'| legacy hosts 301 ->',s.legacyHosts.join(', '));
require('child_process').execSync('node scripts/build.js && node scripts/seo-audit.js',{stdio:'inherit',cwd:path.join(__dirname,'..')});
