const {chromium}=require('playwright-core');const B=process.env.BASE||'http://localhost:8099';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const ctx=await b.newContext({acceptDownloads:true});
for(const [slug,file,raster] of [['compress-pdf-to-100kb','/tmp/scan.pdf',1],['compress-pdf-to-1mb','/tmp/scan.pdf',1],['compress-pdf-to-500kb','/tmp/scan.pdf',1],['compress-pdf-to-200kb','/tmp/scan.pdf',0]]){const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`${B}/${slug}/`);await p.setInputFiles('#tool input[type=file]',file);await p.waitForSelector('#go');if(!raster)await p.uncheck('#pkr');await p.click('#go');
 await p.waitForSelector('#dl',{timeout:180000});const info=await p.evaluate(()=>document.querySelector('#tool').innerText.match(/.*→.*/)?.[0]);const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);const fp='/tmp/'+dl.suggestedFilename();await dl.saveAs(fp);
 console.log(slug,raster?'':'(no raster)',require('fs').statSync(fp).size,'|',info,errs.join(';'));await p.close();}
await b.close()})();
