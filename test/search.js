const {chromium}=require('playwright-core');const B=process.argv[2]||'http://localhost:8099';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
for(const [nm,vp] of [['desktop',{width:1350,height:900}],['mobile',{width:390,height:800}]]){const p=await b.newPage({viewport:vp,isMobile:nm==='mobile',hasTouch:nm==='mobile'});
await p.goto(B+'/compress-pdf/');const cls=await p.evaluate(()=>new Promise(r=>{let c=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)c+=e.value})).observe({type:'layout-shift',buffered:true});setTimeout(()=>r(c),1500)}));
if(nm==='desktop')await p.keyboard.press('Control+k');else await p.click('form.srch input');
for(const q of ['combine','shrink','compres','mrege','jpg to pdf','heic','pasword','pdf to wrod']){await p.fill('form.srch input',q);await p.waitForTimeout(300);const r=await p.$$eval('.sres a b',a=>a.slice(0,3).map(x=>x.textContent));console.log(nm,q,'->',r.join(' | '));}
const w=await p.$eval('form.srch input',e=>Math.round(e.getBoundingClientRect().width));await p.screenshot({path:`/tmp/s-${nm}.png`});
await p.fill('form.srch input','combine');await p.waitForTimeout(200);await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowUp');await Promise.all([p.waitForNavigation(),p.keyboard.press('Enter')]);console.log(nm,'cls',cls.toFixed(4),'inputW',w,'enter->',p.url());
await p.goto(B+'/search/?q=shrink');await p.waitForTimeout(600);console.log(nm,'searchpage',(await p.$$eval('#searchpage a b',a=>a.slice(0,3).map(x=>x.textContent))).join(' | '));}
await b.close()})();
