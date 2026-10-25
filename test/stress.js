// Real-world stress QA: every file-input tool with heavy files. BASE=... DESKTOP=1 FROM=0 TO=25 node test/stress.js
const {chromium}=require('playwright-core');const fs=require('fs');const path=require('path');
const R=process.env.REAL||'/workspace/qa/real';const OUT=process.env.OUT||'/workspace/qa/stress';fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.BASE||'http://localhost:8788';const tools=require('../src/tools.json');
const pick=(t)=>{const a=t.accept||'';if(!a)return null;
 if(a.startsWith('.pdf'))return t.multiple?['big.pdf','scan10.pdf']:[/ocr|scan|deskew|searchable|pdfa/.test(t.id)?'scan10.pdf':'big.pdf'];
 if(a.startsWith('.docx')||a.includes('.docx,'))return ['report.docx'];
 if(a.includes('.zip'))return [path.join(__dirname,'samples','bundle.zip')];
 if(a.includes('video/*')&&!a.startsWith('audio'))return ['video.mp4'];if(a.startsWith('audio'))return ['audio.mp3'];
 if(a.includes('gif'))return [path.join(__dirname,'samples','anim.gif')];if(a.includes('.csv')||a.includes('.xlsx'))return ['data.csv'];
 if(a.includes('.epub'))return [path.join(__dirname,'samples','book.epub')];if(a.includes('.odt'))return [path.join(__dirname,'samples','notes.odt')];
 if(a.includes('.rtf'))return [path.join(__dirname,'samples','notes.rtf')];if(a.includes('.md')||a.includes('.txt'))return [path.join(__dirname,'samples','notes.md')];
 if(a.includes('.heic'))return a.startsWith('.heic')?[path.join(__dirname,'samples','photo.heic')]:(t.multiple?['photo.jpg','photo.png']:['photo.jpg']);
 if(a.includes('png'))return ['photo.png'];if(a.includes('jpg')||a.includes('image'))return ['photo.jpg'];return ['big.pdf'];};
const FILL={protect:{pw:'Abc12345',pw2:'Abc12345'},splittext:{stext:'Invoice'},findreplace:{frfind:'the',frrep:'THE'},redact:{rterms:'the'}};
const ACT={extractpages:async p=>{await p.waitForSelector('.thumb canvas',{timeout:60000});await p.locator('.thumb').nth(2).click({position:{x:20,y:20}});},sign:async p=>{await p.waitForSelector('.preview canvas',{timeout:60000});await p.locator('.sigpad').scrollIntoViewIfNeeded();const b=await p.locator('.sigpad').boundingBox();await p.mouse.move(b.x+20,b.y+40);await p.mouse.down();for(let i=0;i<15;i++)await p.mouse.move(b.x+20+i*10,b.y+40+Math.sin(i)*20);await p.mouse.up();await p.locator('.preview canvas').evaluate(e=>e.scrollIntoView({block:'center'}));const c=await p.locator('.preview canvas').boundingBox();await p.mouse.click(c.x+c.width/2,c.y+c.height/2);},edit:async p=>{await p.waitForSelector('.ppage canvas',{timeout:90000});await p.click('[data-m=text]');await p.locator('.play').evaluate(e=>{e.scrollIntoView({block:'start'});scrollBy(0,-120);});await p.waitForTimeout(300);const b=await p.locator('.play').boundingBox();await p.mouse.click(b.x+50,b.y+80);await p.keyboard.type('QA edit');}};
const list=tools.filter(t=>pick(t)).slice(+(process.env.FROM||0),+(process.env.TO||999));
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const ctx=await browser.newContext({acceptDownloads:true,viewport:process.env.DESKTOP?{width:1366,height:900}:{width:390,height:844}});const res=[];
for(const t of list){const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));const f=pick(t).map(x=>x.startsWith('/')?x:path.join(R,x));const t0=Date.now();let r;
 try{await page.goto(`${BASE}/${t.slug}/`,{timeout:60000});await page.setInputFiles('#tool input[type=file]',f);await page.waitForSelector('#go',{state:'attached',timeout:60000});await page.waitForTimeout(2500);await page.evaluate(()=>document.querySelectorAll('details.adv').forEach(d=>d.open=true));for(const [k,v] of Object.entries(FILL[t.id]||{})){const el=page.locator('#'+k);if(await el.count())await el.fill(v).catch(()=>{});}if(ACT[t.id])await ACT[t.id](page).catch(e=>console.log('act',e.message));
  const hz=await page.$eval('#tool',e=>e.scrollWidth>e.clientWidth+4).catch(()=>false);
  const go=await page.$('#go');if(go&&await go.isVisible()&&await go.isEnabled())await go.click({timeout:10000});
  await page.waitForSelector('#dl,.status.err,.result',{timeout:180000});
  if(await page.$('.status.err')){const m=(await page.textContent('.status')).replace(/\s+/g,' ').slice(0,160);const hint=await page.$('.status.err.hint');r=[hint?'INPUT':'FAIL',m];}
  else if(await page.$('#dl')){const [dl]=await Promise.all([page.waitForEvent('download',{timeout:60000}),page.click('#dl')]);const fp=path.join(OUT,t.id+'-'+dl.suggestedFilename());await dl.saveAs(fp);const sz=fs.statSync(fp).size;r=[sz>0?'PASS':'FAIL',dl.suggestedFilename()+' '+sz+'B'];}
  else r=['PASS','result shown'];
  if(hz)r[1]+=' [h-overflow]';if(errs.length){r[0]='FAIL';r[1]+=' pageerror: '+errs[0].slice(0,120);}
 }catch(e){r=['FAIL',e.message.split('\n')[0].slice(0,160)];await page.screenshot({path:path.join(OUT,t.id+'-fail.png')}).catch(()=>{});}
 r.push(((Date.now()-t0)/1000).toFixed(1)+'s');res.push([t.id,...r]);console.log([r[0],t.id,t.slug,f.map(x=>path.basename(x)).join('+'),r[2],r[1]].join(' | '));await page.close();}
await browser.close();})();
