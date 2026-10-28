// Static site generator: node scripts/build.js -> dist/
const fs=require('fs'),path=require('path');
const { generateKeywords } = require('../src/seo/keyword-engine.js');
const R=p=>path.join(__dirname,'..',p);
const site=JSON.parse(fs.readFileSync(R('src/site.json')));
// SITE_URL env overrides src/site.json baseUrl (switch to the real domain there or via env)
site.baseUrl=(process.env.SITE_URL||site.baseUrl).replace(/\/+$/,'');
const tools=JSON.parse(fs.readFileSync(R('src/tools.json')));
// extra tool lists (src/tools.d/*.json) are appended; enOnly tools are built for English only
if(fs.existsSync(R('src/tools.d')))for(const f of fs.readdirSync(R('src/tools.d')).sort())if(f.endsWith('.json'))tools.push(...JSON.parse(fs.readFileSync(R('src/tools.d/'+f))));
const matrixTools = fs.existsSync(R('src/tools.d/b30-format-matrix.json')) ? JSON.parse(fs.readFileSync(R('src/tools.d/b30-format-matrix.json'))) : [];
const matrixToolSet = new Set(matrixTools.map(t => t.id));
const matrixFullLangs = new Set(['en', 'es', 'pt', 'de']);
const frMatrixSet = new Set(matrixTools.slice(0, 300).map(t => t.id));
const zhMatrixSet = new Set(matrixTools.slice(0, 288).map(t => t.id));

const isToolForLang = (toolId, lang) => {
  if (!matrixToolSet.has(toolId)) return true; // All 508 Core Tools in ALL 19 languages!
  if (matrixFullLangs.has(lang)) return true; // All matrix tools in en, es, pt, de
  if (lang === 'fr') return frMatrixSet.has(toolId);
  if (lang === 'zh-cn') return zhMatrixSet.has(toolId);
  return false;
};

const UNTR={};// lang -> Set of tool ids whose page text is not translated (English fallback) – not built in that language to avoid duplicate content
const forLang=(lang)=>tools.filter(x=>isToolForLang(x.id, lang)&&!(UNTR[lang]&&UNTR[lang].has(x.id)));
// Reserved #tool heights (scripts/measure-ui.js) so JS-rendered tool UIs never shift the page (CLS 0)
const UIH=fs.existsSync(R('src/ui-heights.json'))?JSON.parse(fs.readFileSync(R('src/ui-heights.json'))):{};
const uiCss=slug=>{const h=UIH[slug];if(!h)return '';const q={s:'(max-width:599px)',m:'(min-width:600px) and (max-width:899px)',l:'(min-width:900px)'};return '<style>'+Object.entries(h).map(([k,v])=>`@media${q[k[0]]}{#tool${k[1]?' .custom':''}{min-height:${v}px}}`).join('')+'</style>';};
const langs=JSON.parse(fs.readFileSync(R('src/languages.json')));
const enabled=langs.filter(l=>l.enabled&&fs.existsSync(R(`src/i18n/${l.code}.json`)));

// tools generated from i18n templates (e.g. "PNG to JPG") get their texts from t.templates[tpl] with {from}/{to} vars
const toolText=(t,x)=>{if(!x.tpl){if(x.impl&&t.tools[x.impl]){const base=merge(t.tools[x.impl],{});delete base.seo;return merge(base,t.tools[x.id]||{});}return t.tools[x.id];}const fillDeep=o=>Array.isArray(o)?o.map(fillDeep):typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,fillDeep(v)])):fill(o,x.vars||{});return merge(fillDeep(t.templates[x.tpl]),t.tools[x.id]||{});};
// deep merge so missing keys fall back to English
const merge=(a,b)=>{if(Array.isArray(a)||typeof a!=='object')return b===undefined?a:b;const o={...a};for(const k in b)o[k]=merge(a[k],b[k]);return o;};
const load=c=>{let o=JSON.parse(fs.readFileSync(R(`src/i18n/${c}.json`)));const d=R(`src/i18n/${c}`);if(fs.existsSync(d))for(const f of fs.readdirSync(d).sort())o=merge(o,JSON.parse(fs.readFileSync(path.join(d,f))));return o;};
const EN=load('en');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>v[k]??m);
{const te=merge(EN,{});const tit={};for(const x of tools)tit[x.id]=toolText(te,x).title;for(const L of enabled){if(L.code==='en')continue;const t=merge(EN,load(L.code));UNTR[L.code]=new Set(tools.filter(x=>toolText(t,x).title===tit[x.id]).map(x=>x.id));if(UNTR[L.code].size)console.log(`${L.code}: ${UNTR[L.code].size} untranslated tools skipped: ${[...UNTR[L.code]].join(' ')}`);}}
const OUT=R('dist');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
for(const f of fs.readdirSync(R('src/i18n')).filter(f=>/^rt-[\w-]+\.json$/.test(f))){fs.mkdirSync(R('dist/assets'),{recursive:true});fs.writeFileSync(R('dist/assets/'+f.replace('.json','.js')),'window.I18N_RT='+JSON.stringify(JSON.parse(fs.readFileSync(R('src/i18n/'+f))))+';');}
const prefix=c=>c===site.defaultLang?'/':`/${c}/`;
const url=(c,slug)=>prefix(c)+(slug?slug+'/':'');
const locLink=(c,u)=>{if(c===site.defaultLang)return u;const m=u.match(/^\/([^\/#?]+)\/(.*)$/);if(!m)return u;const y=tools.find(z=>z.slug===m[1]);return y&&forLang(c).includes(y)?url(c,m[1])+m[2]:u;};
const abs=u=>site.baseUrl+u;
const HOST=new URL(site.baseUrl).host;const OGL={en:'en_US',es:'es_ES',pt:'pt_BR',fr:'fr_FR',de:'de_DE',it:'it_IT',ru:'ru_RU',ja:'ja_JP',ko:'ko_KR','zh-cn':'zh_CN','zh-tw':'zh_TW',ar:'ar_AR',hi:'hi_IN',id:'id_ID',tr:'tr_TR',vi:'vi_VN',pl:'pl_PL',nl:'nl_NL',th:'th_TH',uk:'uk_UA'};const catSlug=c=>'tools/'+c;
const ver=Date.now().toString(36);
const LANG_BRAND_SUFFIX={en:'| Fileopia',es:'| Fileopia ES',pt:'| Fileopia PT',fr:'| Fileopia FR',de:'| Fileopia DE',it:'| Fileopia IT',ru:'| Fileopia RU',ja:'| Fileopia 日本語',ko:'| Fileopia 한국어','zh-cn':'| Fileopia 中文','zh-tw':'| Fileopia 繁中',ar:'| Fileopia بالعربية',hi:'| Fileopia हिंदी',id:'| Fileopia ID',tr:'| Fileopia TR',vi:'| Fileopia VN',pl:'| Fileopia PL',nl:'| Fileopia NL',th:'| Fileopia ไทย',uk:'| Fileopia UA'};
const CSS=fs.readFileSync(R('src/assets/style.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};:,>])\s*/g,'$1').replace(/;}/g,'}').trim();
const write=(u,html)=>{const f=path.join(OUT,u,'index.html');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,html);};
const ad=(id,t)=>`<aside class="ad-slot" data-ad-slot="${id}" aria-label="${esc(t.ui.ad)}"><span>${esc(t.ui.ad)}</span></aside>`;
const VS_LANG_DESC = {
  en: 'Fast, secure, browser-local processing with zero file limits.',
  es: 'Rápido, seguro, privado y sin límites de archivos en tu navegador.',
  pt: 'Rápido, seguro, privado e sem limites de arquivos no navegador.',
  fr: 'Rapide, sécurisé, privé et sans limite de fichiers.',
  de: 'Schnell, sicher, privat und ohne Dateilimits im Browser.',
  it: 'Veloce, sicuro, privato e senza limiti di file nel tuo browser.',
  ru: 'Быстро, безопасно, конфиденциально и без ограничений.',
  ja: 'ブラウザで高速かつ安全に無料実行。ファイル制限なし。',
  ko: '브라우저에서 안전하고 빠르게 무료 처리. 파일 제한 없음.',
  'zh-cn': '在浏览器中高速且安全地免费处理。无文件大小限制。',
  'zh-tw': '在瀏覽器中快速且安全地免費處理。無檔案大小限制。',
  ar: 'أداء فائق السرعة وأمان تام دون قيود على الملفات.',
  hi: 'बिना किसी सर्वर अपलोड के सुरक्षित, तेज़ और सीधे ब्राउज़र में।',
  id: 'Cepat, aman, privat, dan tanpa batasan jumlah file di browser.',
  tr: 'Tarayıcınızda hızlı, güvenli, gizli ve sınırsız dosya işleme.',
  vi: 'Nhanh chóng, an toàn, bảo mật và không giới hạn tệp.',
  pl: 'Szybko, bezpiecznie, prywatnie i bez limitów plików.',
  nl: 'Snel, veilig, privé en zonder bestandslimieten in uw browser.',
  th: 'รวดเร็ว ปลอดภัย มีความเป็นส่วนตัว และไม่มีขีดจำกัดไฟล์',
  uk: 'Швидко, безпечно, конфіденційно та без обмежень у браузері.'
};

function vsBody(comp, t, lang) {
  if (!comp) {
    return `<nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix(lang)}">${esc(t.ui.crumbHome||'Home')}</a> › <span aria-current="page">Compare</span></nav>
<section class="hero small"><h1>Fileopia vs Competitors</h1><p class="lead">Compare Fileopia with other file platforms. Discover 100% free browser-local processing with zero cloud uploads.</p></section>
<div class="vs-wrap">
  <div class="grid">${['ilovepdf','smallpdf','convertio','adobe-acrobat','cloudconvert'].map(c=>`<a class="card c-convert" href="${url(lang,'vs/'+c)}"><b>Fileopia vs ${c.replace('-',' ').toUpperCase()}</b><span>Compare features, pricing, and limits.</span></a>`).join('')}</div>
</div>`;
  }
  const cName = comp.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix(lang)}">${esc(t.ui.crumbHome||'Home')}</a> › <a href="${url(lang,'vs/')}">Compare</a> › <span aria-current="page">vs ${cName}</span></nav>
<section class="hero small"><h1>Fileopia vs ${cName}</h1><p class="lead">Compare privacy, file limits, pricing, and features between Fileopia and ${cName}.</p></section>
<div class="vs-wrap">
  <div class="vs-summary">
    <div class="vs-card winner">
      <h3>🏆 Fileopia (100% Free &amp; Private)</h3>
      <ul>
        <li><strong>Price:</strong> 100% Free Forever ($0)</li>
        <li><strong>Privacy:</strong> Zero Cloud Upload – 100% In-Browser Memory</li>
        <li><strong>Task Limits:</strong> Unlimited Tasks, No Daily Wait Times</li>
        <li><strong>Batch Processing:</strong> Free Unlimited Multi-file ZIP Bundling</li>
        <li><strong>Compliance:</strong> GDPR &amp; HIPAA Ready by Design</li>
        <li><strong>Offline Mode:</strong> Works 100% Offline without Wi-Fi</li>
      </ul>
    </div>
    <div class="vs-card competitor">
      <h3>⚠️ ${cName}</h3>
      <ul>
        <li><strong>Price:</strong> Free tier limited, Subscriptions cost $6–$20/mo</li>
        <li><strong>Privacy:</strong> Uploads files to remote cloud servers</li>
        <li><strong>Task Limits:</strong> Strict hourly or daily task quotas</li>
        <li><strong>Batch Processing:</strong> Restricted on free tier</li>
        <li><strong>Compliance:</strong> Subject to cloud server retention policies</li>
        <li><strong>Offline Mode:</strong> Requires active Internet connection</li>
      </ul>
    </div>
  </div>
  <div class="vs-matrix">
    <table>
      <thead>
        <tr>
          <th>Feature / Capability</th>
          <th>Fileopia</th>
          <th>${cName}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Pricing</strong></td>
          <td class="vs-highlight">100% Free Forever ($0)</td>
          <td class="vs-disadv">Paid Subscription Required</td>
        </tr>
        <tr>
          <td><strong>Where Files are Processed</strong></td>
          <td class="vs-highlight">Local Device (WebAssembly)</td>
          <td class="vs-disadv">Remote Cloud Servers</td>
        </tr>
        <tr>
          <td><strong>Daily Free Tasks</strong></td>
          <td class="vs-highlight">Unlimited (No Limits)</td>
          <td class="vs-disadv">Restricted Quota</td>
        </tr>
        <tr>
          <td><strong>Multi-file Batch ZIP</strong></td>
          <td class="vs-highlight">Unlimited Batch ZIP</td>
          <td class="vs-disadv">Restricted on Free Tier</td>
        </tr>
        <tr>
          <td><strong>Account / Login Required</strong></td>
          <td class="vs-highlight">No Account Needed</td>
          <td class="vs-disadv">Account Prompts Often</td>
        </tr>
        <tr>
          <td><strong>Works Offline</strong></td>
          <td class="vs-highlight">Yes (Disconnect Wi-Fi &amp; Test)</td>
          <td class="vs-disadv">No (Upload Required)</td>
        </tr>
      </tbody>
    </table>
  </div>
  <section class="faq">
    <h2>Frequently Asked Questions</h2>
    <details><summary>Why choose Fileopia over ${cName}?</summary><p>Fileopia processes all files 100% locally in your web browser using WebAssembly. There are no server uploads, no 2-task hourly limits, and no paid subscriptions.</p></details>
    <details><summary>Are my files uploaded when using Fileopia?</summary><p>No. Unlike ${cName} which transmits your files to cloud servers, Fileopia runs client-side in browser memory. You can even turn off Wi-Fi while using Fileopia.</p></details>
  </section>
</div>`;
}

function extBody(t, lang) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix(lang)}">${esc(t.ui.crumbHome||'Home')}</a> › <span aria-current="page">Chrome Extension</span></nav>
<section class="hero small"><h1>Official Fileopia Extension</h1><p class="lead">Convert, compress, and edit files directly from your browser. 100% private, client-side, with zero cloud uploads.</p></section>
<div class="vs-wrap" style="text-align:center">
  <div style="margin:24px 0"><a href="/extension.zip" download="fileopia-extension.zip" class="btn huge">⬇ Download Free Extension (.zip)</a></div>
  <div class="vs-summary" style="text-align:left">
    <div class="vs-card winner">
      <h3>🚀 Extension Features</h3>
      <ul>
        <li><strong>Right-Click Instant Actions:</strong> Right-click any PDF or image on any webpage to compress or convert instantly.</li>
        <li><strong>Quick Search:</strong> Search and open all 2,780+ tools right from your browser toolbar.</li>
        <li><strong>Zero Cloud Uploads:</strong> Runs 100% in local memory with privacy guaranteed.</li>
        <li><strong>Works on Chrome &amp; Edge:</strong> Full Manifest V3 compliance.</li>
      </ul>
    </div>
    <div class="vs-card competitor" style="background:#f8fafc;border-color:#cbd5e1">
      <h3>📦 Easy 3-Step Installation</h3>
      <ul>
        <li><strong>Step 1:</strong> Download the extension ZIP file above and extract it to a folder on your computer.</li>
        <li><strong>Step 2:</strong> In Chrome or Edge, open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong> (top right).</li>
        <li><strong>Step 3:</strong> Click <strong>Load unpacked</strong> and select the extracted folder. Fileopia is now ready in your browser!</li>
      </ul>
    </div>
  </div>
</div>`;
}

function layout({t,lang,slug,title,desc,keywords,body,jsonld,cat,og,alts:A=true}){
  const L=langs.find(l=>l.code===lang);
  const alts=!A||enabled.length<2?'':enabled.map(l=>`<link rel="alternate" hreflang="${l.code}" href="${abs(url(l.code,slug))}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${abs(url(site.defaultLang,slug))}">`;
  const langSel=enabled.map(l=>`<a href="${url(l.code,A?slug:"")}" onclick="document.cookie='lang=${l.code};path=/;max-age=31536000;samesite=lax'" hreflang="${l.code}" lang="${l.code}"${l.code===lang?' aria-current="true"':''}>${esc(l.name)}</a>`).join('');
  const nav=forLang(lang).map(x=>`<a href="${url(lang,x.slug)}">${esc(t.tools[x.id].name)}</a>`).join('');
  return `<!doctype html><html lang="${lang}" dir="${L.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">${keywords?`<meta name="keywords" content="${esc(keywords)}">`:''}<link rel="canonical" href="${abs(url(lang,slug))}">${alts}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${abs(url(lang,slug))}"><meta property="og:site_name" content="${esc(site.brand)}"><meta property="og:locale" content="${OGL[lang]||lang}">${enabled.filter(l=>l.code!==lang&&A).map(l=>`<meta property="og:locale:alternate" content="${OGL[l.code]||l.code}">`).join('')}<meta property="og:image" content="${abs('/og/'+(og||'home')+'.jpg')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${abs('/og/'+(og||'home')+'.jpg')}">
<meta name="theme-color" content="#e5322d"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest">
<style>${CSS}</style>
${jsonld.map(j=>`<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('')}
${uiCss(slug)}</head><body class="${site.adsEnabled?'ads-on':''} ${cat?'cat-'+cat:''}">
<header class="top"><div class="wrap"><a class="logo" href="${prefix(lang)}" aria-label="${esc(site.brand)} home"><img src="/favicon.svg" width="28" height="28" alt="">${esc(site.brand)}</a><form class="srch" role="search" action="${prefix(lang)}search/" data-none="${esc(t.ui.noResults||'No tools found')}"><input type="search" name="q" autocomplete="off" placeholder="${esc(t.ui.searchPh||'Search tools…')}" aria-label="${esc(t.ui.searchPh||'Search tools')}" role="combobox" aria-expanded="false" aria-controls="sres" aria-autocomplete="list"><kbd>/</kbd><div class="sres" id="sres" role="listbox" hidden></div></form><script>(()=>{let d;const g=()=>{if(d)return;d=1;const s=document.createElement('script');s.src='/assets/search.js?v=${ver}';document.head.appendChild(s)};const f=document.querySelector('form.srch');f.addEventListener('focusin',g,{once:true});f.addEventListener('pointerenter',g,{once:true});addEventListener('keydown',e=>{if((e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable)||(e.key==='k'&&(e.ctrlKey||e.metaKey))){e.preventDefault();f.querySelector('input').focus()}});${slug==='search'?'g();':''}})()</script>
<details class="menu"><summary aria-label="${esc(t.ui.allTools)}">☰ <span class="mt">${esc(t.ui.allTools)}</span></summary><nav class="toolnav">${nav}</nav></details>
${enabled.length>1?`<details class="langs"><summary aria-label="${esc(L.name)} – ${esc(t.ui.language)}">🌐 ${esc(L.name)}</summary><nav>${langSel}</nav></details>`:''}</div></header>
<nav class="toptools"><div class="wrap">${TOP.map(id=>tools.find(x=>x.id===id)).filter(x=>x&&forLang(lang).includes(x)).map(x=>`<a class="c-${x.cat}" href="${url(lang,x.slug)}">${esc(t.tools[x.id].name)}</a>`).join('')}</div></nav>
<main class="wrap">${body}</main>
<div class="wrap"><div class="recent-shelf" id="recent-shelf" hidden><div class="rec-head"><span>📁 ${esc(t.ui.recentActivity||'Recent Local Activity (100% Private on this device)')}</span><button type="button" class="btn ghost micro" id="rec-clear">${esc(t.ui.clear||'Clear')}</button></div><div class="rec-items"></div></div></div>
<footer class="foot"><div class="wrap"><nav class="toolnav" aria-label="${esc(t.ui.popular)}">${FOOT.map(id=>tools.find(x=>x.id===id)).filter(x=>x&&forLang(lang).includes(x)).map(x=>`<a href="${url(lang,x.slug)}">${esc(t.tools[x.id].name)}</a>`).join('')}<a href="${prefix(lang)}#all">${esc(t.ui.allToolsLink)}</a></nav><nav class="legal">${['about','privacy','terms','contact'].map(k=>`<a href="/${k}/">${esc(EN.ui[k+'Link'])}</a>`).join(' · ')} · <a href="${url(lang,'vs/')}">${esc(t.ui.compareLink||'Compare Alternatives')}</a> · <a href="${url(lang,'chrome-extension/')}">${esc(t.ui.extensionLink||'Chrome Extension')}</a></nav><p>${esc(t.ui.footer)}</p><p>© ${new Date().getFullYear()} ${esc(site.brand)}</p></div></footer>
</body></html>`;
}
const fmtList=a=>{if(!a)return '';const m=a.split(',').map(z=>z.trim()).map(z=>z==='image/*'?'JPG, PNG, WEBP, GIF':z.startsWith('.')?z.slice(1).toUpperCase():z.includes('/')?z.split('/')[1].replace(/^\*$/,'').toUpperCase():z).filter(Boolean);return [...new Set(m.join(', ').split(', '))].join(', ');};
const FOLLOW={pdf:['compress','merge','split','protect','pagenumbers','pdf2word'],image:['imgcompress','imgresize','jpg2pdf','imgconvert']};
const nextOf=x=>{const out=x.accept&&/pdf/.test(x.accept)||['jpg2pdf','word2pdf','txt2pdf','invoice','camera2pdf'].includes(x.id)?FOLLOW.pdf:x.cat==='image'?FOLLOW.image:[];return [...out.map(id=>tools.find(y=>y.id===id)).filter(Boolean),...tools.filter(y=>y.cat===x.cat)].filter((y,i,a)=>y.id!==x.id&&a.indexOf(y)===i).slice(0,6);};
const FOOT=['merge','compress','split','pdf2word','word2pdf','jpg2pdf','pdf2jpg','edit','sign','protect','unlock','rotate','organize','ocrpdf','imgcompress','imgresize','qr','bgremove'];
const TOP=['merge','compress','split','pdf2word','jpg2pdf','edit','ocr','qr'];
const pages=[];let TEN;const RAW={};
const allToolSet = new Set(tools.filter(x => enabled.every(l => forLang(l.code).some(y => y.id === x.id))).map(x => x.id));
console.log(`Starting static generation for ${enabled.length} languages (${tools.length} tools)...`);
for(const L of enabled){
  const lang=L.code;
  console.log(`[${lang}] Building pages for ${L.name}...`);
  const t=merge(EN,load(lang));for(const x of tools)t.tools[x.id]=toolText(t,x);if(lang==="en")TEN=t;const V={brand:site.brand};
  const LT=forLang(lang);
  const langToolSet=new Set(LT.map(y=>y.id));
  const byCat={};for(const y of LT)(byCat[y.cat]=byCat[y.cat]||[]).push(y);
  fs.writeFileSync(path.join(OUT,'search-'+lang+'.json'),JSON.stringify(LT.map(x=>({i:x.id,s:x.slug,u:url(lang,x.slug),n:t.tools[x.id].name,d:t.tools[x.id].short||'',e:x.icon||'',c:x.cat,k:lang!=='en'&&TEN?((TEN.tools[x.id]||{}).name||''):''}))));
  write(url(lang,'search'),layout({t,lang,slug:'search',title:(t.ui.searchTitle||'Search tools')+' | '+site.brand,desc:t.ui.searchDesc||'Search all '+LT.length+' free online PDF, image, video and text tools. Everything runs in your browser.',body:`<section class="hero"><h1>${esc(t.ui.searchTitle||'Search tools')}</h1></section><div id="searchpage" data-none="${esc(t.ui.noResults||'No tools found for')}" style="min-height:60vh"><div class="sgrid">${LT.slice(0,24).map(x=>`<a class="c-${x.cat}" href="${url(lang,x.slug)}"><span class="si" aria-hidden="true">${esc(x.icon||'•')}</span><span><b>${esc(t.tools[x.id].name)}</b><small>${esc(t.tools[x.id].short||'')}</small></span></a>`).join('')}</div></div>`,jsonld:[],alts:false}));
  // Home
  const card=x=>`<a class="card c-${x.cat}" href="${url(lang,x.slug)}"><span class="ic" aria-hidden="true">${x.icon}</span><b>${esc(t.tools[x.id].name)}${x.beta?` <small class="beta">${esc(t.ui.beta)}</small>`:''}</b><span>${esc(t.tools[x.id].short)}</span></a>`;
  const cats=['organize','edit','convert','optimize','security','image','qr','ai','media','text','dev','calc','web','prod','fun','data','units','more'];
  const cards=cats.filter(c=>byCat[c]&&byCat[c].length).map(c=>`<h2 class="cat"><a href="${url(lang,catSlug(c))}">${esc(t.ui['cat_'+c]||c)}</a></h2><div class="grid">${(byCat[c]||[]).map(card).join('')}</div>`).join('');
  const homeBody=`<section class="hero"><h1>${esc(t.home.h1)}</h1><p class="lead">${esc(t.ui.heroSub)}</p></section>
<section id="all" aria-label="${esc(t.ui.allTools)}">${cards}</section>${ad('home-mid',t)}
<section class="feats"><div><h2>${esc(t.ui.f1t)}</h2><p>${esc(t.ui.f1d)}</p></div><div><h2>${esc(t.ui.f2t)}</h2><p>${esc(t.ui.f2d)}</p></div><div><h2>${esc(t.ui.f3t)}</h2><p>${esc(t.ui.f3d)}</p></div></section>`;
  write(url(lang,''),layout({t,lang,slug:'',title:fill(t.home.title,V),desc:fill(t.home.desc,V),body:homeBody,jsonld:[{"@context":"https://schema.org","@type":"WebSite",name:site.brand,url:abs(url(lang,'')),inLanguage:lang,potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:abs(url(lang,'search'))+'?q={search_term_string}'},"query-input":"required name=search_term_string"}},{"@context":"https://schema.org","@type":"Organization",name:site.brand,url:site.baseUrl,logo:site.baseUrl+'/icon-512.png'}]}));
  pages.push('');
  // Tools
  for(const x of tools){if(!langToolSet.has(x.id))continue;const altOK=allToolSet.has(x.id);
    const tt=t.tools[x.id];const v={...V,tool:tt.name};
    const kws=generateKeywords(x,tt,lang);const topKws=kws.slice(0,30);const metaKws=topKws.join(', ');
    const tagChips=topKws.slice(0,12).map(k=>`<span class="tag-chip">${esc(k)}</span>`).join('');
    const tagSection=`<section class="tags" aria-label="${esc(t.ui.popularSearches||'Popular Searches')}"><h2>${esc(t.ui.popularSearches||'Popular Searches')}</h2><div class="tag-cloud">${tagChips}</div></section>`;
    const LG=RAW[lang]||(RAW[lang]=load(lang));const G=tt.guide&&(lang==='en'||(LG.tools&&LG.tools[x.id]&&LG.tools[x.id].guide))?tt.guide:null;const S=tt.seo&&(lang==='en'||(LG.tools&&LG.tools[x.id]&&LG.tools[x.id].seo))?tt.seo:null;const faq=(S?(()=>{const seen=new Set();return [...tt.faq,...(S.faqKw||[]),...S.faq,...(G?G.faq:[]),...t.commonFaq].filter(f=>{const k=f.q.toLowerCase().replace(/\W/g,'');if(seen.has(k))return false;seen.add(k);return true;}).slice(0,10)})():[...tt.faq,...(G?G.faq:[]),...t.commonFaq]).map(f=>({q:fill(f.q,v),a:fill(f.a,v)}));
    const steps=tt.steps.map(s=>fill(s,v));
    const sameCat=(byCat[x.cat]||[]).filter(y=>y.id!==x.id);
    const otherCat=LT.filter(y=>y.cat!==x.cat).slice(0,6);
    const rel=[...sameCat.slice(0,8),...otherCat].slice(0,14).map(y=>`<a class="chip" href="${url(lang,y.slug)}">${esc(t.tools[y.id].name)}</a>`).join('');
    const crumbs=`<nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix(lang)}">${esc(t.ui.crumbHome||'Home')}</a> › <a href="${url(lang,catSlug(x.cat))}">${esc(t.ui['cat_'+x.cat]||x.cat)}</a> › <span aria-current="page">${esc(tt.name)}</span></nav>`;
    const guide=G?`<section class="guide"><p>${esc(fill(G.intro,v))}</p><h2>${esc(t.ui.usesTitle)}</h2><ul>${G.uses.map(u=>`<li>${esc(fill(u,v))}</li>`).join('')}</ul><h2>${esc(t.ui.tipsTitle)}</h2><ul>${G.tips.map(u=>`<li>${esc(fill(u,v))}</li>`).join('')}</ul>${(G.more||[]).map(m=>`<h2>${esc(fill(m[0],v))}</h2><p>${esc(fill(m[1],v))}</p>`).join('')}</section>`:'';
    const md=h=>esc(h).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g,(m,a,u)=>`<a href="${locLink(lang,u)}">${a}</a>`);
    const seoHtml=S?(S.sections||[]).map(([h,...ps])=>`<h2>${esc(fill(h,v))}</h2>${ps.map(p=>(p&&!Array.isArray(p)&&typeof p==='object'&&(p.list||p.steps))?`<${p.steps?'ol':'ul'}>${(p.steps||p.list).map(li=>`<li>${md(fill(li,v))}</li>`).join('')}</${p.steps?'ol':'ul'}>`:Array.isArray(p)?`<ul>${p.map(li=>`<li>${md(fill(li,v))}</li>`).join('')}</ul>`:typeof p==='object'&&p.table?`<div class="tw"><table><thead><tr>${p.table[0].map(c=>`<th scope="col">${md(fill(c,v))}</th>`).join('')}</tr></thead><tbody>${p.table.slice(1).map(r=>`<tr>${r.map((c,i)=>i?`<td>${md(fill(c,v))}</td>`:`<th scope="row">${md(fill(c,v))}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`:`<p>${md(fill(p,v))}</p>`).join('')}`).join(''):'';
    const cmpX=S&&S.compare?`<section class="cmp"><h2>${esc(fill(S.compareTitle||t.ui.cmpTitleDef,v))}</h2><div class="tw"><table><thead><tr><th></th>${[site.brand,...(S.compareCols||['iLovePDF','Smallpdf','Adobe Acrobat online','Sejda'])].map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${S.compare.map(r=>`<tr><th scope="row">${esc(fill(r[0],v))}</th>${r.slice(1).map(c=>`<td>${esc(fill(c,v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="note">${esc(S.compareNote||t.ui.cmpNoteDef)}</p></section>`:'';
    const priv=`<section class="priv"><h2>${esc(x.nofile?t.ui.privHnf:t.ui.privH)}</h2><p>${esc(fill(x.nofile?t.ui.privPnf:t.ui.privP,v))}</p><ul>${[1,2,3].map(i=>`<li><strong>${esc(t.ui['privL'+i+'b'])}</strong> ${esc(t.ui['privL'+i])}</li>`).join('')}</ul></section>`;
    const relX=S&&S.related?`<section class="relx"><h2>${esc(t.ui.related)}</h2><ul>${S.related.map(id=>tools.find(y=>y.id===id||y.slug===id)).filter(y=>y&&langToolSet.has(y.id)).map(y=>`<li><a href="${url(lang,y.slug)}">${esc(t.tools[y.id].name)}</a> – ${esc(fill(t.tools[y.id].short||t.tools[y.id].desc,{...V,tool:t.tools[y.id].name}))}</li>`).join('')}</ul></section>`:'';
    const upd=S&&S.updated?`<p class="upd">${esc(t.ui.updLabel)} <time datetime="${S.updated}">${new Date(S.updated+'T00:00:00Z').toLocaleDateString(lang==='en'?'en-GB':lang,{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</time> · ${esc(fill(t.ui.updBy,V))}</p>`:'';
    const cmp=cmpX?cmpX:(lang==='en'||LG.ui.cmpRow1)?`<section class="cmp"><h2>${esc(fill(t.ui.whyTitle,v))}</h2><table><thead><tr><th></th><th scope="col">${esc(site.brand)}</th><th scope="col">${esc(t.ui.cmpThem)}</th></tr></thead><tbody>${(x.nofile?[6,2,3,5]:[1,2,3,4,5]).map(i=>`<tr><th scope="row">${esc(t.ui['cmpRow'+i])}</th><td>${esc(t.ui['cmpRow'+i+'us'])}</td><td>${esc(t.ui['cmpRow'+i+'them'])}</td></tr>`).join('')}</tbody></table></section>`:'';
    const privacySeal=`<section class="privacy-seal" aria-label="Privacy Guarantee"><div class="seal-inner"><div class="seal-badge">🛡️ 100% Client-Side Privacy Guarantee</div><p class="seal-desc">All file conversions, editing and compression run locally in your browser memory via WebAssembly. Files never leave your device and are never uploaded to any cloud server. GDPR (EU) &amp; HIPAA (US) Compliant.</p><div class="seal-points"><span>🔒 Zero Cloud Upload</span><span>🇪🇺 GDPR Ready</span><span>🇺🇸 HIPAA Compliant</span><span>⚡ Works Offline</span><span>🚫 No File Limits</span></div></div></section>`;
    const embedBar = `<div class="embed-bar" style="margin:16px 0;text-align:right"><button type="button" class="mini" id="btn-embed" style="cursor:pointer;color:var(--mu);background:#fff;border:1px solid var(--bd);border-radius:8px;padding:5px 12px;font:inherit;font-size:.85rem;display:inline-flex;align-items:center;gap:6px"><span>&lt;/&gt;</span> ${esc(t.ui.embedTool||'Embed this tool')}</button></div><div class="embed-powered">Powered by <a href="${site.baseUrl}/" target="_blank" rel="noopener">${esc(site.brand)} Free Tools</a></div>`;
    const body=`${crumbs}<section class="hero small"><h1>${esc(tt.h1)}${x.beta?` <small class="beta">${esc(t.ui.beta)}</small>`:''}</h1><p class="lead">${esc(fill(tt.desc,v))}</p></section>
<section class="tool" id="tool" data-tool="${x.impl||x.id}" data-step="1" data-next="${esc(JSON.stringify(nextOf(x).filter(y=>langToolSet.has(y.id)).map(y=>({n:t.tools[y.id].name,u:url(lang,y.slug)}))))}" data-preset="${x.preset||''}" data-vars="${esc(JSON.stringify(x.vars||{}))}" data-accept="${x.accept||''}" data-multiple="${!!x.multiple}" data-nofile="${!!x.nofile}" data-maxmb="${x.maxmb||''}">
<ol class="stepper"><li class="s1">${esc(t.ui.stepUpload)}</li><li class="s2">${esc(t.ui.stepOptions)}</li><li class="s3">${esc(t.ui.stepDownload)}</li></ol>
${x.nofile?'':`<label class="drop"><input type="file" accept="${x.accept}" ${x.multiple?'multiple':''} hidden><span class="btn huge">⬆ ${esc(x.multiple?t.ui.selectMany:t.ui.select)}</span><span class="or">${esc(t.ui.orDrop)}</span><span class="fmts">${esc(fmtList(x.accept))}${x.maxmb?` · max ${x.maxmb} MB`:''}</span></label>`}
<ul class="trust"><li>✓ ${esc(t.ui.tFree)}</li><li>✓ ${esc(t.ui.tNoSign)}</li><li>✓ ${esc(t.ui.tNoLimit)}</li><li>🔒 ${esc(t.ui.tLocal)}</li></ul>
<div class="work" hidden></div></section>
<section class="howto"><h2>${esc(t.ui.howTo)}: ${esc(tt.name)}</h2><ol>${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></section>
${guide}${seoHtml?`<section class="guide seo">${seoHtml}</section>`:''}${cmp}${priv}${privacySeal}${relX}<section class="faq"><h2>${esc(t.ui.faq)}</h2>${faq.map(f=>`<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
${upd}${tagSection}${embedBar}${ad('tool-below',t)}
<section class="rel"><h2>${esc(t.ui.related)}</h2>${rel}</section>
<script>window.I18N=${JSON.stringify(t.ui)};</script>${fs.existsSync(R(`src/i18n/rt-${lang}.json`))?`<script src="/assets/rt-${lang}.js?v=${ver}" defer></script>`:''}<script src="/assets/core.js?v=${ver}" defer></script><script src="/assets/t/${x.impl||x.id}.js?v=${ver}" defer></script>`;
    const jsonld=[
      {"@context":"https://schema.org","@type":"SoftwareApplication",name:`${tt.name} – ${site.brand}`,applicationCategory:"UtilitiesApplication",operatingSystem:"Any (web browser)",url:abs(url(lang,x.slug)),inLanguage:lang,description:fill(tt.desc,v),keywords:metaKws,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}},
      ...(S&&S.updated?[{"@context":"https://schema.org","@type":"WebPage",name:fill(S.title||tt.title,v),url:abs(url(lang,x.slug)),dateModified:S.updated,inLanguage:lang}]:[]),
      {"@context":"https://schema.org","@type":"HowTo",name:`${t.ui.howTo}: ${tt.name}`,inLanguage:lang,step:steps.map((s,i)=>({"@type":"HowToStep",position:i+1,text:s}))},
      {"@context":"https://schema.org","@type":"FAQPage",inLanguage:lang,mainEntity:faq.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))},
      {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:t.ui.crumbHome||'Home',item:abs(prefix(lang))},{"@type":"ListItem",position:2,name:t.ui['cat_'+x.cat]||x.cat,item:abs(url(lang,catSlug(x.cat)))},{"@type":"ListItem",position:3,name:tt.name,item:abs(url(lang,x.slug))}]}
    ];
    write(url(lang,x.slug),layout({t,lang,slug:x.slug,title:fill((S&&S.title)||tt.title,v),desc:fill((S&&S.desc)||tt.desc,v),keywords:metaKws,body,jsonld,cat:x.cat,og:x.slug,alts:altOK}));
    if(lang===site.defaultLang)pages.push(x.slug);
  }
  // category hub pages
  for(const c of cats){const list=LT.filter(x=>x.cat===c);if(!list.length)continue;const cn=t.ui['cat_'+c]||c;const cnT=lang==='en'?cn.replace(/\s*tools$/i,''):cn;const vv={...V,cat:cnT,n:list.length,list:''};for(let k=4;k>=1;k--){vv.list=list.slice(0,k).map(x=>t.tools[x.id].name).join(', ');if(fill(t.ui.catDesc,vv).length<=155)break;}const slug=catSlug(c);
   const others=cats.filter(o=>o!==c&&LT.some(x=>x.cat===o)).map(o=>`<a class="chip" href="${url(lang,catSlug(o))}">${esc(t.ui['cat_'+o]||o)}</a>`).join('');
   const body=`<nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix(lang)}">${esc(t.ui.crumbHome||'Home')}</a> › <span aria-current="page">${esc(cn)}</span></nav><section class="hero small"><h1>${esc(cn)}</h1><p class="lead">${esc(fill(t.ui.catLead,vv))}</p></section><div class="grid">${list.map(card).join('')}</div><section class="rel"><h2>${esc(t.ui.catOther)}</h2>${others}</section>`;
   let catTit=fill(t.ui.catTitle,vv);const bPart=LANG_BRAND_SUFFIX[lang]||'| '+site.brand;if(catTit.length>60)catTit=cn+' '+bPart;if(catTit.length>60)catTit=catTit.slice(0,60);
   let catDsc=fill(t.ui.catDesc,vv);if(catDsc.length>150)catDsc=catDsc.slice(0,147)+'...';if(catDsc.length<72)catDsc=catDsc+' Free, fast and private browser-local processing.';
   write(url(lang,slug),layout({t,lang,slug,title:catTit,desc:catDsc,body,cat:c,alts:enabled.every(l=>forLang(l.code).some(x=>x.cat===c)),jsonld:[{"@context":"https://schema.org","@type":"CollectionPage",name:cn,url:abs(url(lang,slug)),inLanguage:lang,hasPart:list.map(x=>({"@type":"SoftwareApplication",name:t.tools[x.id].name,url:abs(url(lang,x.slug)),applicationCategory:"UtilitiesApplication",operatingSystem:"Any (web browser)"}))},{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:t.ui.crumbHome||'Home',item:abs(prefix(lang))},{"@type":"ListItem",position:2,name:cn,item:abs(url(lang,slug))}]}]}));
   if(lang===site.defaultLang)pages.push(slug);}
  // Competitor Displacement Hubs & Extension Landing
  const vsHubs = [
    { slug: 'vs', title: 'Fileopia vs Competitors' },
    { slug: 'vs/ilovepdf', comp: 'ilovepdf', title: 'Fileopia vs iLovePDF' },
    { slug: 'vs/smallpdf', comp: 'smallpdf', title: 'Fileopia vs Smallpdf' },
    { slug: 'vs/convertio', comp: 'convertio', title: 'Fileopia vs Convertio' },
    { slug: 'vs/adobe-acrobat', comp: 'adobe-acrobat', title: 'Fileopia vs Adobe Acrobat' },
    { slug: 'vs/cloudconvert', comp: 'cloudconvert', title: 'Fileopia vs CloudConvert' },
    { slug: 'chrome-extension', ext: true, title: 'Free Chrome Extension for PDF & Tools' }
  ];

  for (const h of vsHubs) {
    const hubBody = h.ext ? extBody(t, lang) : vsBody(h.comp, t, lang);
    const bPart = LANG_BRAND_SUFFIX[lang] || '| ' + site.brand;
    let hTit = `${h.title} ${bPart}`;
    if (hTit.length > 60) hTit = hTit.slice(0, 60);
    const langPhrase = VS_LANG_DESC[lang] || VS_LANG_DESC.en;
    let hDsc = `${h.title}. ${langPhrase} 100% free client-side file tools.`;
    if (hDsc.length > 150) hDsc = hDsc.slice(0, 147) + '...';
    if (hDsc.length < 72) hDsc = hDsc + ' Free, fast and private browser-local processing.';

    const jsonld = [
      { "@context": "https://schema.org", "@type": "WebPage", name: h.title, url: abs(url(lang, h.slug)), inLanguage: lang, description: hDsc },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: t.ui.crumbHome || 'Home', item: abs(prefix(lang)) },
        { "@type": "ListItem", position: 2, name: h.title, item: abs(url(lang, h.slug)) }
      ]}
    ];
    if (h.comp) {
      const cName = h.comp.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      jsonld.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: lang,
        mainEntity: [
          { "@type": "Question", name: `Why choose ${site.brand} over ${cName}?`, acceptedAnswer: { "@type": "Answer", text: `${site.brand} processes all files 100% locally in your web browser using WebAssembly. There are no server uploads, no 2-task hourly limits, and no paid subscriptions.` } },
          { "@type": "Question", name: `Are my files uploaded when using ${site.brand}?`, acceptedAnswer: { "@type": "Answer", text: `No. Unlike ${cName} which transmits your files to cloud servers, ${site.brand} runs client-side in browser memory. You can even turn off Wi-Fi while using ${site.brand}.` } }
        ]
      });
    }

    write(url(lang, h.slug), layout({ t, lang, slug: h.slug, title: hTit, desc: hDsc, body: hubBody, jsonld, alts: true }));
    if (lang === site.defaultLang) pages.push(h.slug);
  }
  console.log(`[${L.code}] Completed ${forLang(lang).length} tools & pages.`);
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
{const rd=['/index.html / 301','/home / 301','/home/ / 301'];for(const L of enabled)if(L.code!=='en')for(const x of tools)if(!x.enOnly&&UNTR[L.code]?.has(x.id))rd.push(`${url(L.code,x.slug)} ${url('en',x.slug)} 301`);for(const L of langs)if(!enabled.includes(L)&&L.code!=='en'&&fs.existsSync(R(`src/i18n/${L.code}.json`)))rd.push(`/sitemap-${L.code}.xml /sitemap.xml 301`,`/${L.code} / 301`,`/${L.code}/* /:splat 301`);fs.writeFileSync(path.join(OUT,'_redirects'),rd.join('\n')+'\n');}
// 404 page: full layout (nav, popular tools), noindex, no canonical/hreflang
{const t=TEN;const pop=FOOT.map(id=>tools.find(x=>x.id===id)).filter(Boolean);const body=`<section class="hero"><h1>${esc(t.ui.e404t)}</h1><p class="lead">${esc(t.ui.e404d)}</p></section><div class="grid">${pop.map(x=>`<a class="card c-${x.cat}" href="${url('en',x.slug)}"><span class="ic" aria-hidden="true">${x.icon}</span><b>${esc(t.tools[x.id].name)}</b><span>${esc(t.tools[x.id].short)}</span></a>`).join('')}</div><p><a class="btn" href="/#all">${esc(t.ui.catAll)}</a></p>`;
 let h=layout({t,lang:'en',slug:'',title:t.ui.e404t+' | '+site.brand,desc:t.ui.e404d,body,jsonld:[],alts:false});h=h.replace(/<link rel="canonical"[^>]*>/,'<meta name="robots" content="noindex">').replace(/<meta property="og:url"[^>]*>/,'');fs.writeFileSync(path.join(OUT,'404.html'),h);}
// IndexNow key file
if(site.indexNowKey)fs.writeFileSync(path.join(OUT,site.indexNowKey+'.txt'),site.indexNowKey);
// legacy host (pages.dev) -> custom domain 301, only when baseUrl is a custom domain
{const fdir=R('functions');const mw=path.join(fdir,'_middleware.js');const legacy=(site.legacyHosts||[]).filter(h=>h!==HOST);
 if(legacy.length&&!/\.pages\.dev$/.test(HOST)){fs.mkdirSync(fdir,{recursive:true});fs.writeFileSync(mw,`// generated by scripts/build.js – legacy-host 301 + Accept-Language auto redirect\nconst L=${JSON.stringify(legacy)};\nconst LG=${JSON.stringify(enabled.map(l=>l.code).filter(c=>c!==site.defaultLang))};
const BOT=/bot|crawl|spider|slurp|mediapartners|adsbot|bingpreview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|preview|lighthouse|headless|pagespeed|curl|wget|python|java\\/|httpclient|okhttp|go-http|monitor|uptime|validator|archiver|semrush|ahrefs/i;
function pick(al){const xs=(al||'').split(',').map((s,i)=>{const[t,...p]=s.trim().split(';');const q=p.map(x=>x.trim()).find(x=>x.startsWith('q='));return{c:t.toLowerCase().split('-')[0],q:q?parseFloat(q.slice(2))||0:1,i}}).filter(x=>x.c&&x.q>0).sort((a,b)=>b.q-a.q||a.i-b.i);for(const x of xs){if(x.c==='en')return null;if(LG.includes(x.c))return x.c;}return null;}
function vary(r){const h=new Headers(r.headers);h.append('Vary','Accept-Language');return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h});}
async function auto(ctx,u){const req=ctx.request;if(req.method!=='GET'&&req.method!=='HEAD')return null;const p=u.pathname;if(!p.endsWith('/')||/\\.[a-z0-9]+$/i.test(p))return null;const seg=p.split('/')[1];if(LG.includes(seg)||seg==='en')return 'skip';
 const ck=(req.headers.get('Cookie')||'').match(/(?:^|;\\s*)lang=([a-z-]+)/);if(ck)return 'vary';const ua=req.headers.get('User-Agent')||'';if(!ua||BOT.test(ua))return 'vary';
 const c=pick(req.headers.get('Accept-Language'));if(!c)return 'vary';const t='/'+c+p;
 try{const r=await ctx.env.ASSETS.fetch(new Request(new URL(t,u.origin),{method:'HEAD'}));if(r.status!==200)return 'vary';}catch(e){return 'vary';}
 return new Response(null,{status:302,headers:{Location:t+u.search,Vary:'Accept-Language, Cookie','Cache-Control':'private, no-store'}});}
export async function onRequest(ctx){const u=new URL(ctx.request.url);if(u.protocol==='http:'||L.some(h=>u.host===h||u.host.endsWith('.'+h)))return Response.redirect('${site.baseUrl}'+u.pathname+u.search,301);
 const a=await auto(ctx,u);if(a instanceof Response)return a;const r=await ctx.next();return a==='vary'?vary(r):r;}
`);}
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
 'pako.min.js':'node_modules/pako/dist/pako.min.js','opentype.min.js':'node_modules/opentype.js/dist/opentype.min.js','UPNG.js':'node_modules/upng-js/UPNG.js','UTIF.js':'node_modules/utif/UTIF.js','heic2any.min.js':'node_modules/heic2any/dist/heic2any.min.js','imagetracer.js':'node_modules/imagetracerjs/imagetracer_v1.2.6.js','face-api.min.js':'node_modules/@vladmandic/face-api/dist/face-api.js','lame.min.js':'node_modules/lamejs/lame.min.js','avif_enc.wasm':'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm'};
const MODELS={'face/tiny_face_detector_model-weights_manifest.json':'node_modules/@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json','face/tiny_face_detector_model.bin':'node_modules/@vladmandic/face-api/model/tiny_face_detector_model.bin'};
for(const k in MODELS)cp(MODELS[k],'models/'+k);
for(const f of ['ort.wasm.min.js','ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])cp('node_modules/onnxruntime-web/dist/'+f,'vendor/ort/'+f);
for(const f of fs.readdirSync(R('node_modules/tesseract.js-core')))if(/lstm\.wasm\.js$/.test(f))cp('node_modules/tesseract.js-core/'+f,'vendor/tesseract/'+f);
// large model files are fetched by scripts/fetch-models.sh (not in git)
if(fs.existsSync(R('models')))for(const f of fs.readdirSync(R('models'),{recursive:true}))if(fs.statSync(R('models/'+f)).isFile())cp('models/'+f,'models/'+f);
// ESM-only libraries are bundled into small IIFE globals
for(const f of fs.readdirSync(R('scripts/vendor')))esbuild.buildSync({entryPoints:[R('scripts/vendor/'+f)],bundle:true,minify:true,format:'iife',outfile:path.join(OUT,'vendor',f),logLevel:'error',platform:'browser',external:['fs','path','crypto']});
for(const k in V)cp(V[k],'vendor/'+k);
{const rd=f=>fs.readFileSync(R('node_modules/wawoff2/build/'+f),'utf8');fs.writeFileSync(path.join(OUT,'vendor/woff2.js'),`/* wawoff2 (MIT) – Google woff2 (MIT) */window.Woff2=(()=>{const c=(function(){${rd('compress_binding.js')};return Module})();const d=(function(){${rd('decompress_binding.js')};return Module})();const ready=m=>new Promise(r=>{if(m.calledRun)return r();const t=setInterval(()=>{if(m.calledRun){clearInterval(t);r()}},30)});return {async compress(b){await ready(c);const r=c.compress(b);if(r===false)throw new Error('WOFF2 compression failed');return r},async decompress(b){await ready(d);const r=d.decompress(b);if(r===false)throw new Error('WOFF2 decompression failed');return r}}})();`);}
cp('src/lib/rawimg.js','vendor/rawimg.js');cp('src/lib/slides.js','vendor/slides.js');cp('src/lib/ebook.js','vendor/ebook.js');cp('node_modules/opentype.js/LICENSE','vendor/opentype.LICENSE.txt');
for(const f of ['index.mjs','harfbuzz.js','harfbuzz.wasm'])cp('node_modules/harfbuzzjs/dist/'+f,'vendor/hb/'+f);cp('node_modules/harfbuzzjs/LICENSE','vendor/hb/LICENSE.txt');
for(const f of ['libarchive.js','worker-bundle.js','libarchive.wasm'])cp('node_modules/libarchive.js/dist/'+f,'vendor/libarchive/'+f);
for(const f of fs.readdirSync(R('src/og')))cp('src/og/'+f,'og/'+f);
for(const f of fs.readdirSync(R('src/fonts')))cp('src/fonts/'+f,'fonts/'+f);
// Package Chrome / Edge Extension
const extDir=R('src/extension');
if(fs.existsSync(extDir)){
  const JSZip=require('jszip');const z=new JSZip();
  for(const f of fs.readdirSync(extDir))z.file(f,fs.readFileSync(path.join(extDir,f)));
  z.generateAsync({type:'nodebuffer'}).then(buf=>{fs.writeFileSync(path.join(OUT,'extension.zip'),buf);});
}
const n=fs.readdirSync(OUT,{recursive:true}).filter(f=>f.endsWith('.html')).length;
console.log(`Built ${n} HTML pages for ${enabled.map(l=>l.code).join(', ')} -> dist/`);
