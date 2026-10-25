const {chromium}=require('playwright-core');const B=process.env.BASE||'http://localhost:8099';const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const ctx=await b.newContext({acceptDownloads:true});fs.mkdirSync('/tmp/gp',{recursive:true});
const steps=[['compress-pdf',['/tmp/big.pdf'],async p=>{await p.click('.cadv summary');await p.check('#cgray');await p.selectOption('#cdpi','96');await p.selectOption('#cq','45')}],
['pdf-to-jpg',['/tmp/b1/merge-pdf-merged.pdf'],async p=>{await p.selectOption('#pmode','extract')}],
['pdf-to-word',['/tmp/br-article.pdf'],async p=>{await p.fill('#wpages','2')}],
['pdf-to-word',['/tmp/br-article.pdf','/tmp/br-invoice.pdf'],null]];
for(const [slug,f,pre] of steps){const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));try{await p.goto(`${B}/${slug}/`);await p.setInputFiles('#tool input[type=file]',f);await p.waitForSelector('#go');if(pre)await pre(p);await p.click('#go');await p.waitForSelector('#dl,.err',{timeout:120000});if(await p.$('.err'))throw new Error(await p.textContent('.err'));const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);const fp='/tmp/gp/'+slug+'-'+dl.suggestedFilename();await dl.saveAs(fp);console.log(slug,'->',fp,fs.statSync(fp).size);}catch(e){console.log(slug,'ERR',e.message.slice(0,160))}await p.close();}
await b.close()})();
