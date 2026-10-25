// Static site generator: node scripts/build.js -> dist/
const fs=require('fs'),path=require('path');
const R=p=>path.join(__dirname,'..',p);
const site=JSON.parse(fs.readFileSync(R('src/site.json')));
// SITE_URL env overrides src/site.json baseUrl (switch to the real domain there or via env)
site.baseUrl=(process.env.SITE_URL||site.baseUrl).replace(/\/+$/,'');
const tools=JSON.parse(fs.readFileSync(R('src/tools.json')));
// extra tool lists (src/tools.d/*.json) are appended; enOnly tools are built for English only
if(fs.existsSync(R('src/tools.d')))for(const f of fs.readdirSync(R('src/tools.d')).sort())if(f.endsWith('.json'))tools.push(...JSON.parse(fs.readFileSync(R('src/tools.d/'+f))));
const UNTR={};// lang -> Set of tool ids whose page text is not translated (English fallback) – not built in that language to avoid duplicate content
const forLang=(lang)=>tools.filter(x=>lang==='en'||(!x.enOnly&&!(UNTR[lang]&&UNTR[lang].has(x.id))));
// Reserved #tool heights (scripts/measure-ui.js) so JS-rendered tool UIs never shift the page (CLS 0)
const UIH=fs.existsSync(R('src/ui-heights.json'))?JSON.parse(fs.readFileSync(R('src/ui-heights.json'))):{};
const uiCss=slug=>{const h=UIH[slug];if(!h)return '';const q={s:'(max-width:599px)',m:'(min-width:600px) and (max-width:899px)',l:'(min-width:900px)'};return '<style>'+Object.entries(h).map(([k,v])=>`@media${q[k]}{#tool{min-height:${v}px}}`).join('')+'</style>';};
const langs=JSON.parse(fs.readFileSync(R('src/languages.json')));
const enabled=langs.filter(l=>l.enabled&&fs.existsSync(R(`src/i18n/${l.code}.json`)));

// tools generated from i18n templates (e.g. "PNG to JPG") get their texts from t.templates[tpl] with {from}/{to} vars
const toolText=(t,x)=>{if(!x.tpl)return x.impl&&t.tools[x.impl]?merge(t.tools[x.impl],t.tools[x.id]||{}):t.tools[x.id];const fillDeep=o=>Array.isArray(o)?o.map(fillDeep):typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,fillDeep(v)])):fill(o,x.vars||{});return merge(fillDeep(t.templates[x.tpl]),t.tools[x.id]||{});};
// deep merge so missing keys fall back to English
const merge=(a,b)=>{if(Array.isArray(a)||typeof a!=='object')return b===undefined?a:b;const o={...a};for(const k in b)o[k]=merge(a[k],b[k]);return o;};
const load=c=>{let o=JSON.parse(fs.readFileSync(R(`src/i18n/${c}.json`)));const d=R(`src/i18n/${c}`);if(fs.existsSync(d))for(const f of fs.readdirSync(d).sort())o=merge(o,JSON.parse(fs.readFileSync(path.join(d,f))));return o;};
const EN=load('en');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>v[k]??m);
{const te=merge(EN,{});const tit={};for(const x of tools)tit[x.id]=toolText(te,x).title;for(const L of enabled){if(L.code==='en')continue;const t=merge(EN,load(L.code));UNTR[L.code]=new Set(tools.filter(x=>toolText(t,x).title===tit[x.id]).map(x=>x.id));if(UNTR[L.code].size)console.log(`${L.code}: ${UNTR[L.code].size} untranslated tools skipped: ${[...UNTR[L.code]].join(' ')}`);}}
const OUT=R('dist');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const prefix=c=>c===site.defaultLang?'/':`/${c}/`;
const url=(c,slug)=>prefix(c)+(slug?slug+'/':'');
const abs=u=>site.baseUrl+u;
const HOST=new URL(site.baseUrl).host;const OGL={en:'en_US',hi:'hi_IN',ta:'ta_IN'};const catSlug=c=>'tools/'+c;
const ver=Date.now().toString(36);
const write=(u,html)=>{const f=path.join(OUT,u,'index.html');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,html);};
const ad=(id,t)=>`<aside class="ad-slot" data-ad-slot="${id}" aria-label="${esc(t.ui.ad)}"><span>${esc(t.ui.ad)}</span></aside>`;
function layout({t,lang,slug,title,desc,body,jsonld,cat,og,alts:A=true}){
  const L=langs.find(l=>l.code===lang);
  const alts=!A||enabled.length<2?'':enabled.map(l=>`<link rel="alternate" hreflang="${l.code}" href="${abs(url(l.code,slug))}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${abs(url(site.defaultLang,slug))}">`;
  const langSel=enabled.map(l=>`<a href="${url(l.code,A?slug:"")}" hreflang="${l.code}" lang="${l.code}"${l.code===lang?' aria-current="true"':''}>${esc(l.name)}</a>`).join('');
  const nav=forLang(lang).map(x=>`<a href="${url(lang,x.slug)}">${esc(t.tools[x.id].name)}</a>`).join('');
  return `<!doctype html><html lang="${lang}" dir="${L.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${abs(url(lang,slug))}">${alts}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${abs(url(lang,slug))}"><meta property="og:site_name" content="${esc(site.brand)}"><meta property="og:locale" content="${OGL[lang]||lang}">${enabled.filter(l=>l.code!==lang&&A).map(l=>`<meta property="og:locale:alternate" content="${OGL[l.code]||l.code}">`).join('')}<meta property="og:image" content="${abs('/og/'+(og||'home')+'.jpg')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${abs('/og/'+(og||'home')+'.jpg')}">
<meta name="theme-color" content="#e5322d"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/assets/style.css?v=${ver}">
${jsonld.map(j=>`<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('')}
${uiCss(slug)}</head><body class="${site.adsEnabled?'ads-on':''} ${cat?'cat-'+cat:''}">
<header class="top"><div class="wrap"><a class="logo" href="${prefix(lang)}">${esc(site.brand)}</a>
<details class="menu"><summary aria-label="${esc(t.ui.allTools)}">☰ <span class="mt">${esc(t.ui.allTools)}</span></summary><nav class="toolnav">${nav}</nav></details>
${enabled.length>1?`<details class="langs"><summary aria-label="${esc(L.name)} – ${esc(t.ui.language)}">🌐 ${esc(L.name)}</summary><nav>${langSel}</nav></details>`:''}</div></header>
<nav class="toptools"><div class="wrap">${TOP.map(id=>tools.find(x=>x.id===id)).filter(Boolean).map(x=>`<a class="c-${x.cat}" href="${url(lang,x.slug)}">${esc(t.tools[x.id].name)}</a>`).join('')}</div></nav>
<main class="wrap">${body}</main>
<footer class="foot"><div class="wrap"><nav class="toolnav" aria-label="${esc(t.ui.popular)}">${FOOT.map(id=>tools.find(x=>x.id===id)).filter(Boolean).map(x=>`<a href="${url(lang,x.slug)}">${esc(t.tools[x.id].name)}</a>`).join('')}<a href="${prefix(lang)}#all">${esc(t.ui.allToolsLink)}</a></nav><nav class="legal">${['about','privacy','terms','contact'].map(k=>`<a href="/${k}/">${esc(EN.ui[k+'Link'])}</a>`).join(' · ')}</nav><p>${esc(t.ui.footer)}</p><p>© ${new Date().getFullYear()} ${esc(site.brand)}</p></div></footer>
</body></html>`;
}
const fmtList=a=>{if(!a)return '';const m=a.split(',').map(z=>z.trim()).map(z=>z==='image/*'?'JPG, PNG, WEBP, GIF':z.startsWith('.')?z.slice(1).toUpperCase():z.includes('/')?z.split('/')[1].replace(/^\*$/,'').toUpperCase():z).filter(Boolean);return [...new Set(m.join(', ').split(', '))].join(', ');};
const FOLLOW={pdf:['compress','merge','split','protect','pagenumbers','pdf2word'],image:['imgcompress','imgresize','jpg2pdf','imgconvert']};
const nextOf=x=>{const out=x.accept&&/pdf/.test(x.accept)||['jpg2pdf','word2pdf','txt2pdf','invoice','camera2pdf'].includes(x.id)?FOLLOW.pdf:x.cat==='image'?FOLLOW.image:[];return [...out.map(id=>tools.find(y=>y.id===id)).filter(Boolean),...tools.filter(y=>y.cat===x.cat)].filter((y,i,a)=>y.id!==x.id&&a.indexOf(y)===i).slice(0,6);};
const FOOT=['merge','compress','split','pdf2word','word2pdf','jpg2pdf','pdf2jpg','edit','sign','protect','unlock','rotate','organize','ocrpdf','imgcompress','imgresize','qr','bgremove'];
const TOP=['merge','compress','split','pdf2word','jpg2pdf','edit','ocr','qr'];
const pages=[];let TEN;const RAW={};
for(const L of enabled){
  const t=merge(EN,load(L.code));for(const x of tools)t.tools[x.id]=toolText(t,x);if(L.code==="en")TEN=t;const lang=L.code;const V={brand:site.brand};
  // Home
  const card=x=>`<a class="card c-${x.cat}" href="${url(lang,x.slug)}"><span class="ic" aria-hidden="true">${x.icon}</span><b>${esc(t.tools[x.id].name)}${x.beta?` <small class="beta">${esc(t.ui.beta)}</small>`:''}</b><span>${esc(t.tools[x.id].short)}</span></a>`;
  const cats=['organize','edit','convert','optimize','security','image','qr','ai','media','text','dev','calc','web','prod','fun','data','units','more'];const LT=forLang(lang);
  const cards=cats.filter(c=>LT.some(x=>x.cat===c)).map(c=>`<h2 class="cat"><a href="${url(lang,catSlug(c))}">${esc(t.ui['cat_'+c]||c)}</a></h2><div class="grid">${LT.filter(x=>x.cat===c).map(card).join('')}</div>`).join('');
  const homeBody=`<section class="hero"><h1>${esc(t.home.h1)}</h1><p class="lead">${esc(t.ui.heroSub)}</p></section>
<section id="all" aria-label="${esc(t.ui.allTools)}">${cards}</section>${ad('home-mid',t)}
<section class="feats"><div><h2>${esc(t.ui.f1t)}</h2><p>${esc(t.ui.f1d)}</p></div><div><h2>${esc(t.ui.f2t)}</h2><p>${esc(t.ui.f2d)}</p></div><div><h2>${esc(t.ui.f3t)}</h2><p>${esc(t.ui.f3d)}</p></div></section>`;
  write(url(lang,''),layout({t,lang,slug:'',title:fill(t.home.title,V),desc:fill(t.home.desc,V),body:homeBody,jsonld:[{"@context":"https://schema.org","@type":"WebSite",name:site.brand,url:abs(url(lang,'')),inLanguage:lang},{"@context":"https://schema.org","@type":"Organization",name:site.brand,url:site.baseUrl,logo:site.baseUrl+'/favicon.svg'}]}));
  pages.push('');
  // Tools
  for(const x of tools){if(!forLang(lang).includes(x))continue;const altOK=!x.enOnly&&enabled.every(l=>forLang(l.code).includes(x));
    const tt=t.tools[x.id];const v={...V,tool:tt.name};
    const LG=RAW[lang]||(RAW[lang]=load(lang));const G=tt.guide&&(lang==='en'||(LG.tools&&LG.tools[x.id]&&LG.tools[x.id].guide))?tt.guide:null;const faq=[...tt.faq,...(G?G.faq:[]),...t.commonFaq].map(f=>({q:fill(f.q,v),a:fill(f.a,v)}));
    const steps=tt.steps.map(s=>fill(s,v));
    const rel=[...LT.filter(y=>y.id!==x.id&&y.cat===x.cat),...LT.filter(y=>y.cat!==x.cat)].slice(0,14).map(y=>`<a class="chip" href="${url(lang,y.slug)}">${esc(t.tools[y.id].name)}</a>`).join('');
    const crumbs=`<nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix(lang)}">${esc(t.ui.crumbHome||'Home')}</a> › <a href="${url(lang,catSlug(x.cat))}">${esc(t.ui['cat_'+x.cat]||x.cat)}</a> › <span aria-current="page">${esc(tt.name)}</span></nav>`;
    const guide=G?`<section class="guide"><p>${esc(fill(G.intro,v))}</p><h2>${esc(t.ui.usesTitle)}</h2><ul>${G.uses.map(u=>`<li>${esc(fill(u,v))}</li>`).join('')}</ul><h2>${esc(t.ui.tipsTitle)}</h2><ul>${G.tips.map(u=>`<li>${esc(fill(u,v))}</li>`).join('')}</ul>${(G.more||[]).map(m=>`<h2>${esc(fill(m[0],v))}</h2><p>${esc(fill(m[1],v))}</p>`).join('')}</section>`:'';
    const cmp=(lang==='en'||LG.ui.cmpRow1)?`<section class="cmp"><h2>${esc(fill(t.ui.whyTitle,v))}</h2><table><thead><tr><th></th><th scope="col">${esc(site.brand)}</th><th scope="col">${esc(t.ui.cmpThem)}</th></tr></thead><tbody>${(x.nofile?[6,2,3,5]:[1,2,3,4,5]).map(i=>`<tr><th scope="row">${esc(t.ui['cmpRow'+i])}</th><td>${esc(t.ui['cmpRow'+i+'us'])}</td><td>${esc(t.ui['cmpRow'+i+'them'])}</td></tr>`).join('')}</tbody></table></section>`:'';
    const body=`${crumbs}<section class="hero small"><h1>${esc(tt.h1)}${x.beta?` <small class="beta">${esc(t.ui.beta)}</small>`:''}</h1><p class="lead">${esc(fill(tt.desc,v))}</p></section>
<section class="tool" id="tool" data-tool="${x.impl||x.id}" data-step="1" data-next="${esc(JSON.stringify(nextOf(x).filter(y=>forLang(lang).includes(y)).map(y=>({n:t.tools[y.id].name,u:url(lang,y.slug)}))))}" data-preset="${x.preset||''}" data-vars="${esc(JSON.stringify(x.vars||{}))}" data-accept="${x.accept||''}" data-multiple="${!!x.multiple}" data-nofile="${!!x.nofile}" data-maxmb="${x.maxmb||''}">
<ol class="stepper"><li class="s1">${esc(t.ui.stepUpload)}</li><li class="s2">${esc(t.ui.stepOptions)}</li><li class="s3">${esc(t.ui.stepDownload)}</li></ol>
${x.nofile?'':`<label class="drop"><input type="file" accept="${x.accept}" ${x.multiple?'multiple':''} hidden><span class="btn huge">⬆ ${esc(x.multiple?t.ui.selectMany:t.ui.select)}</span><span class="or">${esc(t.ui.orDrop)}</span><span class="fmts">${esc(fmtList(x.accept))}${x.maxmb?` · max ${x.maxmb} MB`:''}</span></label>`}
<ul class="trust"><li>✓ ${esc(t.ui.tFree)}</li><li>✓ ${esc(t.ui.tNoSign)}</li><li>✓ ${esc(t.ui.tNoLimit)}</li><li>🔒 ${esc(t.ui.tLocal)}</li></ul>
<div class="work" hidden></div></section>
<section class="howto"><h2>${esc(t.ui.howTo)}: ${esc(tt.name)}</h2><ol>${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></section>
${guide}${cmp}<section class="faq"><h2>${esc(t.ui.faq)}</h2>${faq.map(f=>`<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
${ad('tool-below',t)}
<section class="rel"><h2>${esc(t.ui.related)}</h2>${rel}</section>
<script>window.I18N=${JSON.stringify(t.ui)};</script><script src="/assets/core.js?v=${ver}" defer></script><script src="/assets/t/${x.impl||x.id}.js?v=${ver}" defer></script>`;
    const jsonld=[
      {"@context":"https://schema.org","@type":"SoftwareApplication",name:`${tt.name} – ${site.brand}`,applicationCategory:"UtilitiesApplication",operatingSystem:"Any (web browser)",url:abs(url(lang,x.slug)),inLanguage:lang,description:fill(tt.desc,v),offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}},
      {"@context":"https://schema.org","@type":"HowTo",name:`${t.ui.howTo}: ${tt.name}`,inLanguage:lang,step:steps.map((s,i)=>({"@type":"HowToStep",position:i+1,text:s}))},
      {"@context":"https://schema.org","@type":"FAQPage",inLanguage:lang,mainEntity:faq.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))},
      {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:t.ui.crumbHome||'Home',item:abs(prefix(lang))},{"@type":"ListItem",position:2,name:t.ui['cat_'+x.cat]||x.cat,item:abs(url(lang,catSlug(x.cat)))},{"@type":"ListItem",position:3,name:tt.name,item:abs(url(lang,x.slug))}]}
    ];
    write(url(lang,x.slug),layout({t,lang,slug:x.slug,title:fill(tt.title,v),desc:fill(tt.desc,v),body,jsonld,cat:x.cat,og:x.slug,alts:altOK}));
    if(lang===site.defaultLang)pages.push(x.slug);
  }
  // category hub pages
  for(const c of cats){const list=LT.filter(x=>x.cat===c);if(!list.length)continue;const cn=t.ui['cat_'+c]||c;const vv={...V,cat:cn,n:list.length,list:list.slice(0,4).map(x=>t.tools[x.id].name).join(', ')};const slug=catSlug(c);const onlyEn=list.every(x=>x.enOnly);if(onlyEn&&lang!=='en')continue;
   const others=cats.filter(o=>o!==c&&LT.some(x=>x.cat===o)).map(o=>`<a class="chip" href="${url(lang,catSlug(o))}">${esc(t.ui['cat_'+o]||o)}</a>`).join('');
   const body=`<nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix(lang)}">${esc(t.ui.crumbHome||'Home')}</a> › <span aria-current="page">${esc(cn)}</span></nav><section class="hero small"><h1>${esc(cn)}</h1><p class="lead">${esc(fill(t.ui.catLead,vv))}</p></section><div class="grid">${list.map(card).join('')}</div><section class="rel"><h2>${esc(t.ui.catOther)}</h2>${others}</section>`;
   write(url(lang,slug),layout({t,lang,slug,title:fill(t.ui.catTitle,vv),desc:fill(t.ui.catDesc,vv),body,cat:c,alts:enabled.every(l=>forLang(l.code).some(x=>x.cat===c)),jsonld:[{"@context":"https://schema.org","@type":"CollectionPage",name:cn,url:abs(url(lang,slug)),inLanguage:lang,hasPart:list.map(x=>({"@type":"SoftwareApplication",name:t.tools[x.id].name,url:abs(url(lang,x.slug)),applicationCategory:"UtilitiesApplication",operatingSystem:"Any (web browser)"}))},{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:t.ui.crumbHome||'Home',item:abs(prefix(lang))},{"@type":"ListItem",position:2,name:cn,item:abs(url(lang,slug))}]}]}));
   if(lang===site.defaultLang)pages.push(slug);}
}
// static info pages (English)
{const t=TEN;const P=JSON.parse(fs.readFileSync(R('src/pages.json')));for(const k in P){const pg=P[k];const body=`<article class="page"><h1>${esc(fill(pg.h1,{brand:site.brand}))}</h1>${pg.html.replace(/\{brand\}/g,esc(site.brand)).replace(/\{email\}/g,esc(site.email))}</article>`;
  write('/'+k+'/',layout({t,lang:'en',slug:k,title:fill(pg.title,{brand:site.brand}),desc:fill(pg.desc,{brand:site.brand}),body,jsonld:[{"@context":"https://schema.org","@type":k==='about'?'AboutPage':k==='contact'?'ContactPage':'WebPage',name:fill(pg.title,{brand:site.brand}),url:abs('/'+k+'/')}],alts:false}));}
 var STATIC=Object.keys(P);}
// sitemap with hreflang alternates
const today=new Date().toISOString().slice(0,10);
const EO=new Set(tools.filter(x=>!enabled.every(l=>forLang(l.code).includes(x))).map(x=>x.slug));const SMS=[];
for(const L of enabled){const sm=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
 for(const slug of pages){if(!fs.existsSync(path.join(OUT,url(L.code,slug),'index.html')))continue;if(EO.has(slug)){sm.push(`<url><loc>${abs(url('en',slug))}</loc><lastmod>${today}</lastmod></url>`);continue;}const alt=enabled.filter(l=>fs.existsSync(path.join(OUT,url(l.code,slug),'index.html')));sm.push(`<url><loc>${abs(url(L.code,slug))}</loc><lastmod>${today}</lastmod>${alt.map(l=>`<xhtml:link rel="alternate" hreflang="${l.code}" href="${abs(url(l.code,slug))}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${abs(url(site.defaultLang,slug))}"/></url>`);}
 if(L.code===site.defaultLang)for(const k of STATIC)sm.push(`<url><loc>${abs('/'+k+'/')}</loc><lastmod>${today}</lastmod></url>`);
 sm.push('</urlset>');const fn=`sitemap-${L.code}.xml`;fs.writeFileSync(path.join(OUT,fn),sm.join('\n'));SMS.push(fn);}
fs.writeFileSync(path.join(OUT,'sitemap.xml'),['<?xml version="1.0" encoding="UTF-8"?>','<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...SMS.map(f=>`<sitemap><loc>${abs('/'+f)}</loc><lastmod>${today}</lastmod></sitemap>`),'</sitemapindex>'].join('\n'));
// 301s for pages no longer built in a language (untranslated tools) -> English page
{const rd=[];for(const L of enabled)if(L.code!=='en')for(const x of tools)if(!x.enOnly&&UNTR[L.code]?.has(x.id))rd.push(`${url(L.code,x.slug)} ${url('en',x.slug)} 301`);for(const L of langs)if(!enabled.includes(L)&&L.code!=='en'&&fs.existsSync(R(`src/i18n/${L.code}.json`)))rd.push(`/sitemap-${L.code}.xml /sitemap.xml 301`,`/${L.code} / 301`,`/${L.code}/* /:splat 301`);fs.writeFileSync(path.join(OUT,'_redirects'),rd.join('\n')+'\n');}
// 404 page: full layout (nav, popular tools), noindex, no canonical/hreflang
{const t=TEN;const pop=FOOT.map(id=>tools.find(x=>x.id===id)).filter(Boolean);const body=`<section class="hero"><h1>${esc(t.ui.e404t)}</h1><p class="lead">${esc(t.ui.e404d)}</p></section><div class="grid">${pop.map(x=>`<a class="card c-${x.cat}" href="${url('en',x.slug)}"><span class="ic" aria-hidden="true">${x.icon}</span><b>${esc(t.tools[x.id].name)}</b><span>${esc(t.tools[x.id].short)}</span></a>`).join('')}</div><p><a class="btn" href="/#all">${esc(t.ui.catAll)}</a></p>`;
 let h=layout({t,lang:'en',slug:'',title:t.ui.e404t+' | '+site.brand,desc:t.ui.e404d,body,jsonld:[],alts:false});h=h.replace(/<link rel="canonical"[^>]*>/,'<meta name="robots" content="noindex">').replace(/<meta property="og:url"[^>]*>/,'');fs.writeFileSync(path.join(OUT,'404.html'),h);}
// IndexNow key file
if(site.indexNowKey)fs.writeFileSync(path.join(OUT,site.indexNowKey+'.txt'),site.indexNowKey);
// legacy host (pages.dev) -> custom domain 301, only when baseUrl is a custom domain
{const fdir=R('functions');const mw=path.join(fdir,'_middleware.js');const legacy=(site.legacyHosts||[]).filter(h=>h!==HOST);
 if(legacy.length&&!/\.pages\.dev$/.test(HOST)){fs.mkdirSync(fdir,{recursive:true});fs.writeFileSync(mw,`// generated by scripts/build.js – 301 legacy hosts to ${site.baseUrl}\nconst L=${JSON.stringify(legacy)};\nexport async function onRequest(ctx){const u=new URL(ctx.request.url);if(L.some(h=>u.host===h||u.host.endsWith('.'+h)))return Response.redirect('${site.baseUrl}'+u.pathname+u.search,301);return ctx.next();}\n`);}
 else if(fs.existsSync(mw)&&/generated by scripts\/build\.js/.test(fs.readFileSync(mw,'utf8'))){fs.rmSync(mw);if(!fs.readdirSync(fdir).length)fs.rmdirSync(fdir);}}
fs.writeFileSync(path.join(OUT,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
// assets
const cp=(a,b)=>{fs.mkdirSync(path.dirname(path.join(OUT,b)),{recursive:true});fs.copyFileSync(R(a),path.join(OUT,b));};
for(const f of fs.readdirSync(R('src/assets')))cp('src/assets/'+f,'assets/'+f);
// JS: core (UI + helpers) + one bundle per tool implementation, minified with esbuild
const esbuild=require('esbuild');const mini=code=>esbuild.transformSync(code,{minify:true,target:'es2020'}).code;
const coreSrc=fs.readFileSync(R('src/core.js'),'utf8');fs.writeFileSync(path.join(OUT,'assets/core.js'),mini(coreSrc));
const FPNAMES=coreSrc.match(/window\.FP=\{([^}]*)\}/)[1];fs.mkdirSync(path.join(OUT,'assets/t'),{recursive:true});
for(const impl of new Set(tools.map(x=>x.impl||x.id))){const src=fs.readFileSync(R(`src/tools/${impl}.js`),'utf8');const needs=(src.match(/^\/\/ @needs (.+)$/m)||[,''])[1].split(/[ ,]+/).filter(Boolean);
  const code=`(()=>{'use strict';const {${FPNAMES}}=window.FP;\n${needs.map(n=>fs.readFileSync(R(`src/lib/${n}.js`),'utf8')).join('\n')}\n${src}\n})();`;fs.writeFileSync(path.join(OUT,`assets/t/${impl}.js`),mini(code));}
for(const f of fs.readdirSync(R('src/public')))cp('src/public/'+f,f);
const V={'xlsx.full.min.js':'node_modules/xlsx/dist/xlsx.full.min.js','papaparse.min.js':'node_modules/papaparse/papaparse.min.js', 'pdf-lib.min.js':'node_modules/@cantoo/pdf-lib/dist/pdf-lib.min.js','pdf.min.js':'node_modules/pdfjs-dist/build/pdf.min.js','pdf.worker.min.js':'node_modules/pdfjs-dist/build/pdf.worker.min.js','jszip.min.js':'node_modules/jszip/dist/jszip.min.js','mammoth.browser.min.js':'node_modules/mammoth/mammoth.browser.min.js','fontkit.umd.min.js':'node_modules/@cantoo/fontkit/dist/fontkit.umd.min.js',
 'qrcode.js':'node_modules/qrcode-generator/dist/qrcode.js','jsQR.js':'node_modules/jsqr/dist/jsQR.js','JsBarcode.all.min.js':'node_modules/jsbarcode/dist/JsBarcode.all.min.js',
 'marked.umd.js':'node_modules/marked/lib/marked.umd.js','tesseract/tesseract.min.js':'node_modules/tesseract.js/dist/tesseract.min.js','tesseract/worker.min.js':'node_modules/tesseract.js/dist/worker.min.js',
 'pako.min.js':'node_modules/pako/dist/pako.min.js','UPNG.js':'node_modules/upng-js/UPNG.js','UTIF.js':'node_modules/utif/UTIF.js','heic2any.min.js':'node_modules/heic2any/dist/heic2any.min.js','imagetracer.js':'node_modules/imagetracerjs/imagetracer_v1.2.6.js','face-api.min.js':'node_modules/@vladmandic/face-api/dist/face-api.js','lame.min.js':'node_modules/lamejs/lame.min.js','avif_enc.wasm':'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm'};
const MODELS={'face/tiny_face_detector_model-weights_manifest.json':'node_modules/@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json','face/tiny_face_detector_model.bin':'node_modules/@vladmandic/face-api/model/tiny_face_detector_model.bin'};
for(const k in MODELS)cp(MODELS[k],'models/'+k);
for(const f of ['ort.wasm.min.js','ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])cp('node_modules/onnxruntime-web/dist/'+f,'vendor/ort/'+f);
for(const f of fs.readdirSync(R('node_modules/tesseract.js-core')))if(/lstm\.wasm\.js$/.test(f))cp('node_modules/tesseract.js-core/'+f,'vendor/tesseract/'+f);
// large model files are fetched by scripts/fetch-models.sh (not in git)
if(fs.existsSync(R('models')))for(const f of fs.readdirSync(R('models'),{recursive:true}))if(fs.statSync(R('models/'+f)).isFile())cp('models/'+f,'models/'+f);
// ESM-only libraries are bundled into small IIFE globals
for(const f of fs.readdirSync(R('scripts/vendor')))esbuild.buildSync({entryPoints:[R('scripts/vendor/'+f)],bundle:true,minify:true,format:'iife',outfile:path.join(OUT,'vendor',f),logLevel:'error',platform:'browser'});
for(const k in V)cp(V[k],'vendor/'+k);
for(const f of fs.readdirSync(R('src/og')))cp('src/og/'+f,'og/'+f);
for(const f of fs.readdirSync(R('src/fonts')))cp('src/fonts/'+f,'fonts/'+f);
const n=fs.readdirSync(OUT,{recursive:true}).filter(f=>f.endsWith('.html')).length;
console.log(`Built ${n} HTML pages for ${enabled.map(l=>l.code).join(', ')} -> dist/`);
