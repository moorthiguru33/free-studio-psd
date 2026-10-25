const {chromium}=require('playwright-core');const fs=require('fs');const B=process.env.BASE||'http://localhost:8099';fs.mkdirSync('/tmp/b3',{recursive:true});
const det=async(p,id)=>p.evaluate(i=>{const e=document.getElementById(i);const d=e&&e.closest('details');if(d)d.open=true;},id);
const steps=[
['rotate-pdf',['/tmp/br-article.pdf'],async p=>{await p.selectOption('#rscope','even');}],
['protect-pdf',['/tmp/br-article.pdf'],async p=>{await p.fill('#pw','Secret#2026');await p.fill('#pw2','Secret#2026');await det(p,'pprint');await p.uncheck('#pcopy');await p.fill('#opw','Owner#99');}],
['unlock-pdf',['/tmp/b3/protect-pdf-br-article-protected.pdf'],async p=>{await p.fill('#pw','Secret#2026');}],
['add-page-numbers',['/tmp/withblank.pdf'],async p=>{await p.selectOption('#fmt','pnt');await det(p,'pskip');await p.fill('#pskip','1');await p.check('#pface');await p.selectOption('#pos','br');}],
['add-watermark-to-pdf',['/tmp/br-article.pdf'],async p=>{await p.selectOption('#wkind','img');await p.setInputFiles('#wimg','/tmp/logo.png');await p.fill('#wsize','30');await p.fill('#wrot','0');await p.fill('#wop','60');await p.selectOption('#wlay','tr');await p.fill('#wpages','1');}],
['delete-pdf-pages',['/tmp/withblank.pdf'],async p=>{await p.waitForSelector('#dblank');await p.waitForTimeout(800);await p.click('#dblank');await p.fill('#drange','1');await p.click('#dapply');console.log('  info',await p.textContent('#dinfo'));}],
['ocr-pdf',['/tmp/inv-scan.pdf'],async p=>{await p.selectOption('#oout','both');}],
['excel-to-pdf',['/tmp/wide.xlsx'],async p=>{await p.fill('#asheets','Summary');}],
['pdf-to-powerpoint',['/tmp/br-article.pdf'],null],
];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const ctx=await b.newContext({acceptDownloads:true});
for(const [slug,f,pre] of steps){const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));try{await p.goto(`${B}/${slug}/`);await p.setInputFiles('#tool input[type=file]',f);await p.waitForSelector('#go');await p.evaluate(()=>document.querySelectorAll('#tool details').forEach(d=>d.open=true));if(pre)await pre(p);await p.click('#go');await p.waitForSelector('#dl,.err',{timeout:180000});if(await p.$('.err'))throw new Error(await p.textContent('.err'));const info=await p.evaluate(()=>document.querySelector('#tool')?.innerText.match(/\d+ (page|char)[^\n]*/)?.[0]);const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);const fp='/tmp/b3/'+slug+'-'+dl.suggestedFilename();await dl.saveAs(fp);console.log(slug,'->',fp,fs.statSync(fp).size,info||'');}catch(e){console.log(slug,'ERR',e.message.slice(0,200))}await p.close();}await b.close();})();
