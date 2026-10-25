const {chromium}=require('playwright-core');const B=process.env.BASE||'http://localhost:8099';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
for(const [slug,val] of [['inches-to-cm','69'],['feet-to-meters','5.75'],['lbs-to-kg','165'],['grams-to-ounces','500'],['fahrenheit-to-celsius','98.6']]){await p.goto(`${B}/${slug}/`);await p.waitForSelector('#uval');await p.fill('#uval',val);await p.dispatchEvent('#uval','input');await p.waitForTimeout(400);console.log(slug,'|',await p.textContent('#ubig'),'|',(await p.textContent('#uextra')).replace(/\n/g,' / '));}
await p.goto(`${B}/ist-to-est/#t=2026-10-26T19:30&from=Asia/Kolkata&to=America/New_York,Europe/London`);await p.waitForTimeout(1200);
console.log('tz cells highlighted:',await p.$$eval('#tzgrid td',t=>t.filter(x=>getComputedStyle(x).backgroundColor!=='rgba(0, 0, 0, 0)').length));
await b.close();})();
