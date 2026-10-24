// End-to-end test of every tool in real Chrome. node test/e2e.js
const {chromium}=require('playwright-core');const fs=require('fs');const path=require('path');const {PDFDocument}=require('@cantoo/pdf-lib');const JSZip=require('jszip');
const S=f=>path.join(__dirname,'samples',f);const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.BASE||'http://localhost:8788';const results=[];
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844}});// mobile viewport
async function run(name,slug,files,{opts={},before,check,lang=''}={}){const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const reqs=[];page.on('request',r=>{if(['POST','PUT'].includes(r.method()))reqs.push(r.url());});
 try{await page.goto(`${BASE}/${lang}${slug}/`);await page.setInputFiles('#tool input[type=file]',files.map(S2));await page.waitForSelector('#go');
  for(const [k,v] of Object.entries(opts)){const el=page.locator('#'+k);if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(v);else await el.fill(v);}
  if(before)await before(page);
  await page.click('#go');await page.waitForSelector('#dl,.status.err',{timeout:60000});
  if(await page.$('.status.err'))throw new Error(await page.textContent('.status'));
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#dl')]);const fp=path.join(OUT,name+'-'+dl.suggestedFilename());await dl.saveAs(fp);
  const info=await check(fs.readFileSync(fp),fp);if(errs.length)throw new Error('page errors: '+errs.join('; '));if(reqs.length)throw new Error('uploads detected: '+reqs);
  results.push(['PASS',name,info]);}catch(e){results.push(['FAIL',name,e.message.split('\n')[0]]);await page.screenshot({path:path.join(OUT,name+'-fail.png')});}await page.close();}
const S2=f=>f.startsWith('/')?f:S(f);
const pages=async b=>(await PDFDocument.load(b)).getPageCount();
const isPdf=b=>{if(b.slice(0,5).toString()!=='%PDF-')throw new Error('not a PDF');};
await run('merge','merge-pdf',['sample.pdf','second.pdf'],{check:async b=>{isPdf(b);const n=await pages(b);if(n!==6)throw new Error('pages '+n);return '6 pages'}});
await run('split-ranges','split-pdf',['sample.pdf'],{opts:{ranges:'1-2,4'},check:async b=>{const z=await JSZip.loadAsync(b);const fs_=Object.keys(z.files);const c=[];for(const f of fs_)c.push(await pages(await z.file(f).async('uint8array')));if(c.join()!=='2,1')throw new Error(fs_+' '+c);return fs_.join(' ')}});
await run('split-extract','split-pdf',['sample.pdf'],{opts:{ranges:'3-5'},check:async b=>{isPdf(b);if(await pages(b)!==3)throw new Error('bad');return '3 pages'}});
await run('split-all','split-pdf',['sample.pdf'],{check:async b=>{const z=await JSZip.loadAsync(b);const n=Object.keys(z.files).length;if(n!==5)throw new Error(n);return '5 files'}});
await run('rotate','rotate-pdf',['sample.pdf'],{opts:{angle:'90'},check:async b=>{const d=await PDFDocument.load(b);const a=d.getPages().map(p=>p.getRotation().angle);if(a.some(x=>x!==90))throw new Error(a);return 'all 90°'}});
await run('pagenumbers','add-page-numbers',['sample.pdf'],{opts:{fmt:'pnt',start:'1'},check:async(b,fp)=>{isPdf(b);return 'pages '+await pages(b)}});
await run('pdf2jpg','pdf-to-jpg',['sample.pdf'],{check:async b=>{const z=await JSZip.loadAsync(b);const fs_=Object.keys(z.files);const img=await z.file(fs_[0]).async('nodebuffer');if(img[0]!==0xFF||img[1]!==0xD8)throw new Error('not jpeg');fs.writeFileSync(path.join(OUT,'page1.jpg'),img);return fs_.length+' jpgs'}});
await run('pdf2png','pdf-to-jpg',['second.pdf'],{opts:{ifmt:'png'},check:async b=>{if(b[1]!==0x50)throw new Error('not png');return 'single png'}});
await run('jpg2pdf','jpg-to-pdf',[path.join(OUT,'page1.jpg'),'image.png'],{opts:{psize:'a4',margin:'20'},check:async b=>{isPdf(b);if(await pages(b)!==2)throw new Error('pages');return '2 pages A4'}});
await run('compress-lossless','compress-pdf',['sample.pdf'],{check:async b=>{isPdf(b);return b.length+' bytes'}});
await run('compress-strong','compress-pdf',['sample.pdf'],{opts:{level:'strong'},check:async b=>{isPdf(b);return b.length+' bytes, pages '+await pages(b)}});
await run('compress-images','compress-pdf',[path.join(OUT,'jpg2pdf-images.pdf')],{opts:{level:'strong'},check:async b=>{isPdf(b);return b.length+' bytes (input '+fs.statSync(path.join(OUT,'jpg2pdf-images.pdf')).size+')'}});
await run('protect','protect-pdf',['sample.pdf'],{opts:{pw:'s3cret',pw2:'s3cret'},check:async(b,fp)=>{if(!b.toString('latin1').includes('/Encrypt'))throw new Error('no /Encrypt');fs.copyFileSync(fp,path.join(OUT,'protected.pdf'));return 'encrypted'}});
await run('unlock','unlock-pdf',[path.join(OUT,'protected.pdf')],{opts:{pw:'s3cret'},check:async b=>{if(b.toString('latin1').includes('/Encrypt'))throw new Error('still encrypted');const n=await pages(b);return 'decrypted, '+n+' pages'}});
await run('unlock-wrongpw','unlock-pdf',[path.join(OUT,'protected.pdf')],{opts:{pw:'nope'},check:async b=>{throw new Error('should have failed')}}).then(()=>{const r=results[results.length-1];if(r[0]==='FAIL'&&!/should have/.test(r[2])){r[0]='PASS';r[2]='correctly rejected: '+r[2].slice(0,60);}});
await run('sign','sign-pdf',['sample.pdf'],{before:async p=>{await p.waitForSelector('.preview canvas');await p.locator('.sigpad').scrollIntoViewIfNeeded();const pad=await p.locator('.sigpad').boundingBox();await p.mouse.move(pad.x+20,pad.y+50);await p.mouse.down();for(let i=0;i<20;i++)await p.mouse.move(pad.x+20+i*12,pad.y+50+Math.sin(i)*30);await p.mouse.up();await p.selectOption('#pgsel','2');await p.waitForTimeout(300);await p.click('.preview canvas',{position:{x:100,y:300}});},check:async b=>{isPdf(b);const d=await PDFDocument.load(b);return 'signed, pages '+d.getPageCount()}});
await run('edit','edit-pdf',['sample.pdf'],{before:async p=>{await p.waitForSelector('.preview canvas');await p.fill('#etxt','Hello – edited “ok”');await p.click('.preview canvas',{position:{x:60,y:60}});await p.selectOption('#emode','white');await p.click('.preview canvas',{position:{x:120,y:150}});},check:async b=>{isPdf(b);return 'edited'}});
await run('pdf2word','pdf-to-word',['sample.pdf'],{check:async b=>{const z=await JSZip.loadAsync(b);const x=await z.file('word/document.xml').async('string');if(!x.includes('quick brown fox'))throw new Error('text missing');return (x.match(/<w:p>/g)||[]).length+' paragraphs'}});
await run('word2pdf','word-to-pdf',['sample.docx'],{check:async b=>{isPdf(b);return 'pages '+await pages(b)}});
await run('merge-ta','merge-pdf',['sample.pdf','second.pdf'],{lang:'ta/',check:async b=>'pages '+await pages(b)});
await run('rotate-hi','rotate-pdf',['second.pdf'],{lang:'hi/',check:async b=>'pages '+await pages(b)});
await browser.close();for(const r of results)console.log(r.join('  |  '));process.exit(results.some(r=>r[0]==='FAIL')?1:0);})();
