const {chromium}=require('playwright-core');const fs=require('fs');const {execFileSync:x}=require('child_process');
const BASE=process.env.BASE||'http://localhost:8788';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1366,height:900}});
for(const [f,k,txt] of JSON.parse(process.argv[2])){const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')errs.push(m.text().slice(0,200));});
 await p.goto(BASE+'/edit-pdf/');await p.setInputFiles('#tool input[type=file]',''+require('path').join(__dirname,'samples/real',f));await p.waitForSelector('.psrc',{timeout:60000});
 const sh=p.locator('.psrc').nth(k);await sh.evaluate(e=>{e.scrollIntoView({block:'center'})});await p.waitForTimeout(300);const orig=await p.evaluate(k=>null,k);
 const bb=await sh.boundingBox();await p.mouse.click(bb.x+3,bb.y+bb.height/2);await p.waitForTimeout(200);const old=await p.locator('.pit .ptxt').last().textContent();await p.keyboard.press('Control+A');await p.keyboard.type(txt);
 await p.click('#go');await p.waitForSelector('#dl',{timeout:60000});const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);const out=require('os').tmpdir()+'/br-'+f;await dl.saveAs(out);
 const t=x('pdftotext',['-f','1','-l','1',out,'-']).toString().replace(/\s+/g,' ');const t0=x('pdftotext',['-f','1','-l','1',''+require('path').join(__dirname,'samples/real',f),'-']).toString().replace(/\s+/g,' ');
 const cnt=(s,q)=>s.split(q).length-1;
 console.log(f,'| old:',JSON.stringify(old),'| old count before/after',cnt(t0,old.trim()),cnt(t,old.trim()),'| new present',t.includes(txt),'|',errs.join(' ; ').slice(0,300));await p.close();}
await b.close();})();
