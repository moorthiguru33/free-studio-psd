const {chromium}=require('playwright-core');const B=process.env.BASE||'http://localhost:8099';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(`${B}/password-generator/`);await p.waitForTimeout(800);
console.log('pw:',(await p.$$eval('#pglist code',c=>c.map(x=>x.textContent))).slice(0,2),await p.textContent('#pginfo'));
await p.fill('#pgex','abcdefABCDEF');await p.dispatchEvent('#pgex','change');await p.waitForTimeout(300);const L=await p.$$eval('#pglist code',c=>c.map(x=>x.textContent));console.log('exclude ok:',!L.join('').match(/[a-fA-F]/));
await p.selectOption('#pgmode','pp');await p.waitForTimeout(1200);console.log('pp:',(await p.$$eval('#pglist code',c=>c.map(x=>x.textContent))).slice(0,2),await p.textContent('#pginfo'),'lenHidden:',await p.$eval('#pglen',e=>e.closest('label').style.display));
await p.selectOption('#pgsep','#');await p.dispatchEvent('#pgsep','change');await p.waitForTimeout(500);console.log('pp#:',(await p.$$eval('#pglist code',c=>c.map(x=>x.textContent)))[0]);
await p.selectOption('#pgmode','pin');await p.fill('#pglen','6');await p.dispatchEvent('#pglen','change');await p.waitForTimeout(400);console.log('pin:',(await p.$$eval('#pglist code',c=>c.map(x=>x.textContent)))[0],await p.textContent('#pginfo'));
await p.click('summary:has-text("Check the strength")');for(const t of ['password','Summer2024!!','Tr0ub4dor&3xQ9#kLm']){await p.fill('#pgchk',t);console.log('chk',t,'=>',await p.textContent('#pgchkout'));}
await b.close();})();
