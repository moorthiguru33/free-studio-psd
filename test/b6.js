const {chromium}=require('playwright-core');const B=process.env.BASE||'http://localhost:8099';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
for(const [slug,val] of [['cm-to-inches','170'],['kg-to-lbs','70'],['celsius-to-fahrenheit','37']]){await p.goto(`${B}/${slug}/`);await p.waitForSelector('#uval');await p.fill('#uval',val);await p.dispatchEvent('#uval','input');await p.waitForTimeout(400);console.log(slug,'|',await p.textContent('#ubig'),'|',(await p.textContent('#uextra')).replace(/\n/g,' / '));}
await p.goto(`${B}/ist-to-est/#t=2026-10-26T19:30&from=Asia/Kolkata&to=America/New_York,Europe/London`);await p.waitForTimeout(1200);const t0=Date.now();
console.log((await p.textContent('#tzout')).slice(0,300));console.log('DST:',await p.textContent('#tzdst'));const rows=await p.$$eval('#tzgrid tr',r=>r.slice(0,4).map(x=>x.innerText.replace(/\s+/g,' ')));console.log(rows, 'green rows:',await p.$$eval('#tzgrid tr[style]',r=>r.map(x=>x.innerText.replace(/\s+/g,' '))));
await b.close();})();
