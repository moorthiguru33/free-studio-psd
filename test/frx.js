const {chromium}=require('playwright-core');const fs=require('fs');const B=process.env.BASE||'http://localhost:8099';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await (await b.newContext({acceptDownloads:true})).newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(`${B}/find-and-replace-pdf/`);await p.setInputFiles('input[type=file]',process.env.IN);await p.waitForTimeout(1500);
await p.fill('#frfind',process.env.W);await p.fill('#frrep',process.env.R||'Zebra');await p.click('#go');
const ok=await p.waitForSelector('#dl',{state:'visible',timeout:30000}).then(()=>1,()=>0);
if(!ok){console.log('FAIL',(await p.evaluate(()=>document.querySelector('#tool').innerText)).slice(-300));await b.close();return;}
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);fs.copyFileSync(await dl.path(),'/tmp/fr-out.pdf');console.log(await p.evaluate(()=>document.querySelector('#tool').innerText.match(/\d+ replacement[^\n]*/)?.[0]));await b.close();})();
