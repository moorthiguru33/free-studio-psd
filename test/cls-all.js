// Quick CLS scan (no throttling) of every tool page at mobile + desktop widths. node test/cls-all.js [BASE]
const {chromium}=require('playwright-core');const fs=require('fs');const BASE=process.argv[2]||'http://localhost:8788';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const slugs=(process.argv[3]?process.argv[3].split(','):fs.readdirSync('dist').filter(d=>fs.existsSync(`dist/${d}/index.html`)));const bad=[];let k=0;
await Promise.all(Array.from({length:6},async()=>{while(k<slugs.length){const s=slugs[k++];for(const [w,h,d] of [[412,823,1.75],[1350,940,1]]){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d});
 await p.addInitScript(()=>{window.__c=0;window.__n=[];new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput){window.__c+=e.value;window.__n.push(...e.sources.map(s=>s.node&&(s.node.id||s.node.className)||'?'));}}).observe({type:'layout-shift',buffered:true});});
 await p.goto(`${BASE}/${s}/`);await p.waitForTimeout(2500);const r=await p.evaluate(()=>[window.__c,[...new Set(window.__n)].join(',')]);if(r[0]>0.001)bad.push(`${s} ${w} ${r[0].toFixed(3)} ${r[1]}`);await p.close();}}}));
console.log(bad.sort().join('\n')||'all CLS 0');await b.close();})();
