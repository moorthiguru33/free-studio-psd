#!/usr/bin/env node
// Measures each tool's settled #tool height (after JS renders live UI) at several widths and writes src/ui-heights.json.
// build.js turns it into a per-page inline min-height so JS-rendered tools cause zero layout shift (CLS 0).
// usage: node scripts/measure-ui.js [BASE=http://localhost:8788]   (serve dist/ first)
const {chromium}=require('playwright-core');const fs=require('fs');const path=require('path');
const BASE=process.argv[2]||'http://localhost:8788';
const BANDS={s:[360,412,599],m:[600,760,899],l:[900,1350,1920]};
(async()=>{const dist=path.join(__dirname,'..','dist');const slugs=fs.readdirSync(dist).filter(d=>fs.existsSync(path.join(dist,d,'index.html'))&&fs.readFileSync(path.join(dist,d,'index.html'),'utf8').includes('data-nofile="true"'));
 const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const out={};const ctx=await b.newContext();const noJs=await b.newContext({javaScriptEnabled:false});
 let k=0;await Promise.all(Array.from({length:6},async()=>{const p=await ctx.newPage(),q=await noJs.newPage();while(k<slugs.length){const s=slugs[k++];const r={};
  for(const [band,ws] of Object.entries(BANDS)){let mx=0,st=0,cu=0;for(const w of ws){await q.setViewportSize({width:w,height:900});await q.goto(`${BASE}/${s}/`);st=Math.max(st,await q.$eval('#tool',e=>e.getBoundingClientRect().height));
    await p.setViewportSize({width:w,height:900});await p.goto(`${BASE}/${s}/`);await p.waitForTimeout(1800);mx=Math.max(mx,await p.$eval('#tool',e=>e.getBoundingClientRect().height));cu=Math.max(cu,await p.$eval('#tool .custom',e=>e.getBoundingClientRect().height).catch(()=>0));}
   if(mx>st+2)r[band]=Math.ceil(mx);if(cu)r[band+'c']=Math.ceil(cu);}
  if(Object.keys(r).length)out[s]=r;}}));
 await b.close();const sorted=Object.fromEntries(Object.keys(out).sort().map(k=>[k,out[k]]));fs.writeFileSync(path.join(__dirname,'..','src','ui-heights.json'),JSON.stringify(sorted,null,1)+'\n');console.log(Object.keys(out).length,'tools need reserved height of',slugs.length);})();
