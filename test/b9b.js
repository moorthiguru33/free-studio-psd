const {chromium}=require('playwright-core');const fs=require('fs');const {execSync}=require('child_process');const B=process.env.BASE||'http://localhost:8099';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await (await b.newContext({acceptDownloads:true})).newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(`${B}/ean-13-barcode-generator/`);await p.waitForTimeout(1500);await p.$$eval('#tool details',d=>d.forEach(x=>x.open=true));
await p.fill('#bbulk','590123412345\n400638133393\n123');await p.selectOption('#bscale','3');await p.waitForFunction(()=>/barcodes/.test(document.querySelector('#tool').innerText),null,{timeout:20000});
console.log('info',await p.evaluate(()=>document.querySelector('#tool').innerText.match(/\d+ barcodes[^\n]*/)?.[0]));
let [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);fs.copyFileSync(await dl.path(),'/tmp/bc.zip');console.log(execSync('unzip -l /tmp/bc.zip | tail -6').toString());
execSync('cd /tmp && rm -rf bcx && mkdir bcx && cd bcx && unzip -q ../bc.zip');const png=execSync('ls /tmp/bcx/*.png|head -1').toString().trim();fs.copyFileSync(png,'/tmp/bc1.png');
await p.goto(`${B}/qr-code-scanner/`);await p.waitForTimeout(1200);
// make QR image via qrcode in page
await p.setInputFiles('#sfile','/tmp/bc1.png');await p.waitForTimeout(2500);console.log('scan barcode:',await p.$eval('#sinfo',e=>e.textContent));
const q=fs.readFileSync('/tmp/o_qr.png').toString('base64');
await p.evaluate(async b64=>{const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const f=new File([bin],'q.png',{type:'image/png'});const dt=new DataTransfer();dt.items.add(f);document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true}));},q);await p.waitForTimeout(2500);
console.log('paste:',await p.$eval('#sres',e=>e.innerText.slice(0,120)));await p.click('#go');await p.waitForSelector('#dl',{state:'visible'});
const [d2]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);console.log('txt:',fs.readFileSync(await d2.path(),'utf8').trim());const ex=await p.$$eval('a',as=>as.filter(a=>/csv/i.test(a.download||'')).map(a=>a.download));console.log('csv link',ex);
await b.close();})();
