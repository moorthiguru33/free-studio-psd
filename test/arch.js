const {chromium}=require('playwright-core');const B=process.env.BASE||'http://localhost:8099';const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const ctx=await b.newContext({acceptDownloads:true});
const cases=[['extract-rar','t-v4.rar'],['extract-rar','t-v5.rar'],['extract-7z','t.7z'],['extract-7z','t-pw.7z','Secret'],['extract-7z','t-pw.7z'],['extract-tar','t.tar'],['extract-tar-gz','t.tar.gz'],['extract-tar-gz','t.tar.xz'],['extract-tar-gz','single.gz'],['create-tar-gz',['src/a.txt','src/sub/b.bin']]];
for(const [slug,f,pw] of cases){const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));try{await p.goto(`${B}/${slug}/`);await p.setInputFiles('#tool input[type=file]',[].concat(f).map(x=>'/tmp/arc/'+x));await p.waitForSelector('#go');if(pw)await p.fill('#apw',pw);await p.click('#go');
 await p.waitForSelector('#dl,.err',{timeout:60000}).catch(()=>0);const dlb=await p.$('#dl');
 const txt=(await p.innerText('#tool')).split('\n').filter(l=>/files ·|file ·|could|failed|protected|empty/i.test(l)).slice(0,4).join(' / ');
 let extra='';if(dlb){const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);const fp='/tmp/arc/out-'+dl.suggestedFilename();await dl.saveAs(fp);extra=fs.statSync(fp).size+'B '+dl.suggestedFilename();if(/tar\.gz$/.test(fp))extra+=' tar:'+require('child_process').execSync('tar tzf '+fp).toString().trim().replace(/\n/g,',');}
 console.log(slug,[].concat(f).join('+'),pw?'(pw)':'',dlb?'OK':'NO-DL','|',txt,'|',extra,errs.join(';'));}catch(e){console.log(slug,f,'ERR',e.message.slice(0,150),errs.join(';'))}await p.close();}
await b.close()})();
