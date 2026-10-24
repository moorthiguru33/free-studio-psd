// Static site generator: node scripts/build.js -> dist/
const fs=require('fs'),path=require('path');
const R=p=>path.join(__dirname,'..',p);
const site=JSON.parse(fs.readFileSync(R('src/site.json')));
const tools=JSON.parse(fs.readFileSync(R('src/tools.json')));
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
const OUT=R('dist');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const prefix=c=>c===site.defaultLang?'/':`/${c}/`;
const url=(c,slug)=>prefix(c)+(slug?slug+'/':'');
const abs=u=>site.baseUrl+u;
const ver=Date.now().toString(36);
const write=(u,html)=>{const f=path.join(OUT,u,'index.html');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,html);};
const ad=(id,t)=>`<aside class="ad-slot" data-ad-slot="${id}" aria-label="${esc(t.ui.ad)}"><span>${esc(t.ui.ad)}</span></aside>`;
function layout({t,lang,slug,title,desc,body,jsonld}){
  const L=langs.find(l=>l.code===lang);
  const alts=enabled.map(l=>`<link rel="alternate" hreflang="${l.code}" href="${abs(url(l.code,slug))}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${abs(url(site.defaultLang,slug))}">`;
  const langSel=enabled.map(l=>`<a href="${url(l.code,slug)}" hreflang="${l.code}" lang="${l.code}"${l.code===lang?' aria-current="true"':''}>${esc(l.name)}</a>`).join('');
  const nav=tools.map(x=>`<a href="${url(lang,x.slug)}">${esc(t.tools[x.id].name)}</a>`).join('');
  return `<!doctype html><html lang="${lang}" dir="${L.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${abs(url(lang,slug))}">${alts}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${abs(url(lang,slug))}"><meta property="og:site_name" content="${esc(site.brand)}"><meta property="og:locale" content="${lang}"><meta name="twitter:card" content="summary">
<meta name="theme-color" content="#e5322d"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/assets/style.css?v=${ver}">
${jsonld.map(j=>`<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('')}
</head><body class="${site.adsEnabled?'ads-on':''}">
<header class="top"><div class="wrap"><a class="logo" href="${prefix(lang)}">${esc(site.brand)}</a>
<details class="menu"><summary aria-label="${esc(t.ui.allTools)}">☰ <span class="mt">${esc(t.ui.allTools)}</span></summary><nav class="toolnav">${nav}</nav></details>
<details class="langs"><summary aria-label="${esc(t.ui.language)}">🌐 ${esc(L.name)}</summary><nav>${langSel}</nav></details></div></header>
<main class="wrap">${body}</main>
<footer class="foot"><div class="wrap"><nav class="toolnav">${nav}</nav><p>${esc(t.ui.footer)}</p><p>© ${new Date().getFullYear()} ${esc(site.brand)}</p></div></footer>
</body></html>`;
}
const pages=[];
for(const L of enabled){
  const t=merge(EN,load(L.code));for(const x of tools)t.tools[x.id]=toolText(t,x);const lang=L.code;const V={brand:site.brand};
  // Home
  const card=x=>`<a class="card" href="${url(lang,x.slug)}"><span class="ic" aria-hidden="true">${x.icon}</span><b>${esc(t.tools[x.id].name)}${x.beta?` <small class="beta">${esc(t.ui.beta)}</small>`:''}</b><span>${esc(t.tools[x.id].short)}</span></a>`;
  const cats=['organize','edit','convert','optimize','security','image','qr','ai','media','data'];
  const cards=cats.map(c=>`<h2 class="cat">${esc(t.ui['cat_'+c]||c)}</h2><div class="grid">${tools.filter(x=>x.cat===c).map(card).join('')}</div>`).join('');
  const homeBody=`<section class="hero"><h1>${esc(t.home.h1)}</h1><p class="lead">${esc(t.ui.heroSub)}</p></section>
<section aria-label="${esc(t.ui.allTools)}">${cards}</section>${ad('home-mid',t)}
<section class="feats"><div><h2>${esc(t.ui.f1t)}</h2><p>${esc(t.ui.f1d)}</p></div><div><h2>${esc(t.ui.f2t)}</h2><p>${esc(t.ui.f2d)}</p></div><div><h2>${esc(t.ui.f3t)}</h2><p>${esc(t.ui.f3d)}</p></div></section>`;
  write(url(lang,''),layout({t,lang,slug:'',title:fill(t.home.title,V),desc:fill(t.home.desc,V),body:homeBody,jsonld:[{"@context":"https://schema.org","@type":"WebSite",name:site.brand,url:abs(url(lang,'')),inLanguage:lang},{"@context":"https://schema.org","@type":"Organization",name:site.brand,url:site.baseUrl,logo:site.baseUrl+'/favicon.svg'}]}));
  pages.push('');
  // Tools
  for(const x of tools){
    const tt=t.tools[x.id];const v={...V,tool:tt.name};
    const faq=[...tt.faq,...t.commonFaq].map(f=>({q:fill(f.q,v),a:fill(f.a,v)}));
    const steps=tt.steps.map(s=>fill(s,v));
    const rel=[...tools.filter(y=>y.id!==x.id&&y.cat===x.cat),...tools.filter(y=>y.cat!==x.cat)].slice(0,14).map(y=>`<a class="chip" href="${url(lang,y.slug)}">${esc(t.tools[y.id].name)}</a>`).join('');
    const body=`<section class="hero small"><h1>${esc(tt.h1)}${x.beta?` <small class="beta">${esc(t.ui.beta)}</small>`:''}</h1><p class="lead">${esc(fill(tt.desc,v))}</p></section>
<section class="tool" id="tool" data-tool="${x.impl||x.id}" data-preset="${x.preset||''}" data-vars="${esc(JSON.stringify(x.vars||{}))}" data-accept="${x.accept||''}" data-multiple="${!!x.multiple}" data-nofile="${!!x.nofile}" data-maxmb="${x.maxmb||''}">
${x.nofile?'':`<label class="drop"><input type="file" accept="${x.accept}" ${x.multiple?'multiple':''} hidden><span class="btn big">${esc(t.ui.select)}</span><span class="hint">${esc(t.ui.drop)}${x.maxmb?` · max ${x.maxmb} MB`:''}</span></label>`}
<div class="work" hidden></div><p class="priv">🔒 ${esc(t.ui.privacy)}</p></section>
${ad('tool-below',t)}
<section class="howto"><h2>${esc(t.ui.howTo)}: ${esc(tt.name)}</h2><ol>${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></section>
<section class="faq"><h2>${esc(t.ui.faq)}</h2>${faq.map(f=>`<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
<section class="rel"><h2>${esc(t.ui.related)}</h2>${rel}</section>
<script>window.I18N=${JSON.stringify(t.ui)};</script><script src="/assets/core.js?v=${ver}" defer></script><script src="/assets/t/${x.impl||x.id}.js?v=${ver}" defer></script>`;
    const jsonld=[
      {"@context":"https://schema.org","@type":"SoftwareApplication",name:`${tt.name} – ${site.brand}`,applicationCategory:"UtilitiesApplication",operatingSystem:"Any (web browser)",url:abs(url(lang,x.slug)),inLanguage:lang,description:fill(tt.desc,v),offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}},
      {"@context":"https://schema.org","@type":"HowTo",name:`${t.ui.howTo}: ${tt.name}`,inLanguage:lang,step:steps.map((s,i)=>({"@type":"HowToStep",position:i+1,text:s}))},
      {"@context":"https://schema.org","@type":"FAQPage",inLanguage:lang,mainEntity:faq.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))},
      {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:site.brand,item:abs(prefix(lang))},{"@type":"ListItem",position:2,name:tt.name,item:abs(url(lang,x.slug))}]}
    ];
    write(url(lang,x.slug),layout({t,lang,slug:x.slug,title:fill(tt.title,v),desc:fill(tt.desc,v),body,jsonld}));
    if(lang===site.defaultLang)pages.push(x.slug);
  }
}
// sitemap with hreflang alternates
const today=new Date().toISOString().slice(0,10);
const sm=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for(const slug of pages)for(const L of enabled){sm.push(`<url><loc>${abs(url(L.code,slug))}</loc><lastmod>${today}</lastmod>${enabled.map(l=>`<xhtml:link rel="alternate" hreflang="${l.code}" href="${abs(url(l.code,slug))}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${abs(url(site.defaultLang,slug))}"/></url>`);}
sm.push('</urlset>');fs.writeFileSync(path.join(OUT,'sitemap.xml'),sm.join('\n'));
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
const V={ 'pdf-lib.min.js':'node_modules/@cantoo/pdf-lib/dist/pdf-lib.min.js','pdf.min.js':'node_modules/pdfjs-dist/build/pdf.min.js','pdf.worker.min.js':'node_modules/pdfjs-dist/build/pdf.worker.min.js','jszip.min.js':'node_modules/jszip/dist/jszip.min.js','mammoth.browser.min.js':'node_modules/mammoth/mammoth.browser.min.js','fontkit.umd.min.js':'node_modules/@cantoo/fontkit/dist/fontkit.umd.min.js',
 'qrcode.js':'node_modules/qrcode-generator/dist/qrcode.js','jsQR.js':'node_modules/jsqr/dist/jsQR.js','JsBarcode.all.min.js':'node_modules/jsbarcode/dist/JsBarcode.all.min.js',
 'marked.umd.js':'node_modules/marked/lib/marked.umd.js','tesseract/tesseract.min.js':'node_modules/tesseract.js/dist/tesseract.min.js','tesseract/worker.min.js':'node_modules/tesseract.js/dist/worker.min.js',
 'pako.min.js':'node_modules/pako/dist/pako.min.js','UPNG.js':'node_modules/upng-js/UPNG.js','UTIF.js':'node_modules/utif/UTIF.js','heic2any.min.js':'node_modules/heic2any/dist/heic2any.min.js','imagetracer.js':'node_modules/imagetracerjs/imagetracer_v1.2.6.js','face-api.min.js':'node_modules/@vladmandic/face-api/dist/face-api.js','avif_enc.wasm':'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm'};
const MODELS={'face/tiny_face_detector_model-weights_manifest.json':'node_modules/@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json','face/tiny_face_detector_model.bin':'node_modules/@vladmandic/face-api/model/tiny_face_detector_model.bin'};
for(const k in MODELS)cp(MODELS[k],'models/'+k);
for(const f of fs.readdirSync(R('node_modules/tesseract.js-core')))if(/lstm\.wasm\.js$/.test(f))cp('node_modules/tesseract.js-core/'+f,'vendor/tesseract/'+f);
// large model files are fetched by scripts/fetch-models.sh (not in git)
if(fs.existsSync(R('models')))for(const f of fs.readdirSync(R('models'),{recursive:true}))if(fs.statSync(R('models/'+f)).isFile())cp('models/'+f,'models/'+f);
// ESM-only libraries are bundled into small IIFE globals
for(const f of fs.readdirSync(R('scripts/vendor')))esbuild.buildSync({entryPoints:[R('scripts/vendor/'+f)],bundle:true,minify:true,format:'iife',outfile:path.join(OUT,'vendor',f),logLevel:'error',platform:'browser'});
for(const k in V)cp(V[k],'vendor/'+k);
for(const f of fs.readdirSync(R('src/fonts')))cp('src/fonts/'+f,'fonts/'+f);
const n=fs.readdirSync(OUT,{recursive:true}).filter(f=>f.endsWith('.html')).length;
console.log(`Built ${n} HTML pages for ${enabled.map(l=>l.code).join(', ')} -> dist/`);
