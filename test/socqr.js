const {chromium}=require('playwright-core');const fs=require('fs');const B=process.env.BASE||'http://localhost:8099';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await (await b.newContext()).newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(`${B}/social-media-qr-code-generator/`);await p.addScriptTag({content:fs.readFileSync('node_modules/jsqr/dist/jsQR.js','utf8')});await p.waitForTimeout(800);await p.$$eval('#tool details',d=>d.forEach(x=>x.open=true));
let ok=0;const P=['threads','pinterest','snapchat','twitch','reddit','instagram'];
for(const s of P){await p.selectOption('#qsoc',s);await p.fill('#quser','@fileopia_test');await p.waitForTimeout(700);
 const r=await p.evaluate(()=>{const c=document.querySelector('#qprev canvas')||document.querySelector('#tool canvas');if(!c)return 'nocanvas';const x=c.getContext('2d').getImageData(0,0,c.width,c.height);const q=jsQR(x.data,c.width,c.height);return q?q.data:'nodecode';});
 const exp={threads:'https://www.threads.net/@fileopia_test',pinterest:'https://www.pinterest.com/fileopia_test',snapchat:'https://www.snapchat.com/add/fileopia_test',twitch:'https://www.twitch.tv/fileopia_test',reddit:'https://www.reddit.com/user/fileopia_test',instagram:'https://instagram.com/fileopia_test'}[s];
 console.log(s,r,r===exp?'OK':'FAIL');if(r===exp)ok++;}
console.log('pass',ok+'/'+P.length);await b.close();})();
