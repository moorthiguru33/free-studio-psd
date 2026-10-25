const {chromium}=require('playwright-core');const fs=require('fs');const B=process.env.BASE||'http://localhost:8099';fs.mkdirSync('/tmp/b4',{recursive:true});
const S=(id,val)=>async p=>p.selectOption('#'+id,val),F=(id,val)=>async p=>p.fill('#'+id,val),C=id=>async p=>p.check('#'+id);
const ONLY=process.env.ONLY;const steps0=[
['compress-image',['/tmp/photo.jpg'],[S('tkb','50')]],
['compress-image',['/tmp/photo.jpg','/tmp/onwhite.png'],[]],
['resize-image',['/tmp/photo.jpg'],[S('rpre','yt')]],
['resize-image',['/tmp/photo.jpg'],[S('rmode','cm'),F('rw','5'),F('rh','5'),S('rfit','pad'),F('rdpi','300')]],
['resize-image',['/tmp/photo.jpg'],[S('rpre','passport'),F('rkb','40'),S('ofmt','jpg')]],
['heic-to-jpg',['/tmp/a.heic'],[S('ofmt','pdf')]],
['heic-to-jpg',['/tmp/a.heic'],[F('hmaxw','600')]],
['jpg-to-png',['/tmp/onwhite.png'],[C('ctrans')]],
['png-to-jpg',['/tmp/logo.png'],[F('cmaxw','100')]],
['upscale-image',['/tmp/onwhite.png'],[S('escale','8'),S('enoise','1')]],
['remove-background',['/tmp/onwhite.png'],[S('bgout','image'),async p=>p.setInputFiles('#bgimg','/tmp/photo.jpg')]],
['qr-code-generator',null,[F('qurl','https://fileopia.com'),C('qgrad'),S('qeye','circle'),S('qframe','box')]],
['image-to-text',['/tmp/invp-1.png'],[]],
];const steps=ONLY?steps0.filter(x=>x[0]===ONLY):steps0;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const ctx=await b.newContext({acceptDownloads:true});let k=0;
for(const [slug,f,pre] of steps){const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));try{await p.goto(`${B}/${slug}/`);if(f)await p.setInputFiles('#tool input[type=file]',f);await p.waitForSelector('#go',{state:'attached'});await p.evaluate(()=>document.querySelectorAll('#tool details').forEach(d=>d.open=true));for(const s of pre)await s(p);await p.evaluate(()=>document.getElementById('go').click());await p.waitForSelector('#dl,.err',{timeout:300000});if(await p.$('.err'))throw new Error(await p.textContent('.err'));const info=await p.evaluate(()=>(document.querySelector('.res,.result,#out')||document.querySelector('#tool')).innerText.match(/[^\n]*(→|KB|MB)[^\n]*/)?.[0]);const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('dl').click())]);const fp='/tmp/b4/'+(k++)+'-'+dl.suggestedFilename();await dl.saveAs(fp);console.log(slug,'->',fp,fs.statSync(fp).size,info||'');}catch(e){console.log(slug,'ERR',e.message.slice(0,300))}await p.close();}await b.close();})();
