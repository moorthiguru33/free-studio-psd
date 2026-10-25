// SEO audit over dist/: node scripts/seo-audit.js  (exit 1 on errors)
const fs=require('fs'),path=require('path');const D=path.join(__dirname,'..','dist');const site=require('../src/site.json');const B=(process.env.SITE_URL||site.baseUrl).replace(/\/+$/,'');
const files=fs.readdirSync(D,{recursive:true}).filter(f=>f.endsWith('index.html'));const err=[],warn=[];const T={},Dsc={},canon={},alts={};
const m1=(h,re)=>(h.match(re)||[])[1];
for(const f of files){const h=fs.readFileSync(path.join(D,f),'utf8');const u='/'+f.replace(/index\.html$/,'');
 const t=m1(h,/<title>([^<]*)<\/title>/),d=m1(h,/<meta name="description" content="([^"]*)"/),c=m1(h,/<link rel="canonical" href="([^"]*)"/);const h1=(h.match(/<h1[\s>]/g)||[]).length;
 if(!t)err.push(u+' no title');else{(T[t]=T[t]||[]).push(u);if(t.length>70)warn.push(`${u} title ${t.length} chars`);}
 if(!d)err.push(u+' no description');else{(Dsc[d]=Dsc[d]||[]).push(u);if(d.length>165||d.length<70)warn.push(`${u} desc ${d.length} chars`);}
 if(h1!==1)err.push(`${u} has ${h1} h1`);if(c!==B+u)err.push(`${u} canonical ${c}`);canon[u]=1;
 const a=[...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(x=>[x[1],x[2].replace(B,'')]);alts[u]=a;
 if(a.length&&!a.some(x=>x[0]==='x-default'))err.push(u+' hreflang without x-default');if(a.length&&!a.some(x=>x[1]===u))err.push(u+' hreflang missing self');
 for(const j of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{const o=JSON.parse(j[1]);if(!o['@context']||!o['@type'])err.push(u+' JSON-LD missing @context/@type');if(o['@type']==='FAQPage'&&!o.mainEntity?.length)err.push(u+' empty FAQ');if(o['@type']==='HowTo'&&!o.step?.length)err.push(u+' empty HowTo');if(o['@type']==='BreadcrumbList'&&o.itemListElement.some(i=>!i.item||!i.name))err.push(u+' bad breadcrumb');}catch(e){err.push(u+' invalid JSON-LD');}}
 if(/<img(?![^>]*\balt=)/.test(h))warn.push(u+' img without alt');}
for(const [u,a] of Object.entries(alts))for(const [l,v] of a){if(l==='x-default')continue;if(!canon[v]){err.push(`${u} hreflang ${l} -> missing ${v}`);continue;}if(!alts[v].some(x=>x[1]===u))err.push(`${u} hreflang ${l} not reciprocal (${v})`);}
for(const [t,us] of Object.entries(T))if(us.length>1)err.push(`duplicate title (${us.length}): ${t} ${us.slice(0,3)}`);
for(const [t,us] of Object.entries(Dsc))if(us.length>1)err.push(`duplicate description (${us.length}): ${t.slice(0,60)} ${us.slice(0,3)}`);
const sm=fs.readFileSync(path.join(D,'sitemap.xml'),'utf8');if(!/sitemapindex/.test(sm))err.push('sitemap.xml is not an index');let n=0;for(const f of sm.match(/sitemap-[a-z]+\.xml/g)||[]){const x=fs.readFileSync(path.join(D,f),'utf8');for(const l of x.matchAll(/<loc>([^<]+)<\/loc>/g)){n++;if(!canon[l[1].replace(B,'')])err.push(f+' lists missing '+l[1]);}}
if(!fs.existsSync(path.join(D,'404.html')))err.push('no 404.html');if(!/Sitemap:/.test(fs.readFileSync(path.join(D,'robots.txt'),'utf8')))err.push('robots without sitemap');
console.log(`pages ${files.length}, sitemap urls ${n}, errors ${err.length}, warnings ${warn.length}`);const show=(k,a)=>{const g={};for(const e of a){const key=e.replace(/^\/\S*\s/,'').replace(/\d+/g,'#').slice(0,50);(g[key]=g[key]||[]).push(e);}for(const [k2,v] of Object.entries(g))console.log(k,v.length,'×',v[0]);};show('ERR',err);show('WARN',warn);process.exit(err.length?1:0);
