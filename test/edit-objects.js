// Browser test: edit existing images/shapes in Edit PDF. usage: node test/edit-objects.js file.pdf
const {chromium}=require('playwright-core');const path=require('path');const {execFileSync:x}=require('child_process');
const BASE=process.env.BASE||'http://localhost:8788';const f=process.argv[2]||'flyer.pdf';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await (await b.newContext({acceptDownloads:true,viewport:{width:1366,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(/warn|error/.test(m.type()))errs.push(m.text().slice(0,200));});
 await p.goto(BASE+'/edit-pdf/');await p.setInputFiles('#tool input[type=file]',path.join(__dirname,'samples/real',f));await p.waitForSelector('.psrc',{timeout:60000});
 await p.click('[data-m=obj]');await p.waitForSelector('.pobj',{timeout:30000});
 const objs=await p.$$eval('.pobj',a=>a.map(e=>({k:e.dataset.k,c:e.className,w:e.offsetWidth,h:e.offsetHeight})));console.log('objects',objs.length,JSON.stringify(objs.slice(0,12)));
 const log=[];const pick=async sel=>{await p.waitForTimeout(500);const el=p.locator(sel).last();await el.scrollIntoViewIfNeeded();const bb=await el.boundingBox();return bb;};
 // 3) delete another shape
 const sh2=objs.filter(o=>/path/.test(o.c)&&o.w>8).sort((a,b)=>a.w*a.h-b.w*b.h)[0];objs.splice(objs.indexOf(sh2),1);
 if(sh2){const bb=await pick(`.pobj[data-k="${sh2.k}"]`);await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.click('#podel');log.push('deleted '+sh2.k);}
 // 1) move the smallest image (or shape) 40px right/down
 const img=objs.filter(o=>/img/.test(o.c)).sort((a,b)=>a.w*a.h-b.w*b.h)[0];
 if(img){let bb=await pick(`.pobj[data-k="${img.k}"]`);await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.mouse.move(bb.x+bb.width/2+40,bb.y+bb.height/2+30,{steps:5});await p.mouse.up();log.push('moved img '+img.k);
  await p.setInputFiles('#porepf','/workspace/qa/cs/green.png');await p.waitForTimeout(400);log.push('replaced img');}
 // 2) recolour a filled shape
 const shp=objs.filter(o=>/path/.test(o.c)&&o.w>20&&o.h>20).sort((a,b)=>a.w*a.h-b.w*b.h)[0];
 if(shp){const bb=await pick(`.pobj[data-k="${shp.k}"]`);await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(150);if(await p.isVisible('#pofill')){await p.$eval('#pofill',e=>{e.value='#00aa00';e.dispatchEvent(new Event('input',{bubbles:true}))});log.push('fill green '+shp.k);}
  // resize via corner
  const r=await p.locator('.pit.obj.sel .prs').boundingBox();if(r){await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(r.x+30,r.y+20,{steps:5});await p.mouse.up();log.push('resized');}}
 await p.waitForTimeout(3000);const du=await p.$eval('.ppage canvas',c=>c.toDataURL('image/png'));require('fs').writeFileSync('/tmp/obj-'+f+'.png',Buffer.from(du.split(',')[1],'base64'));
 await p.click('#go');await p.waitForSelector('#dl',{timeout:60000});const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]);const out=require('os').tmpdir()+'/obj-'+f;await dl.saveAs(out);
 console.log(log.join('; '));console.log('images before/after:',x('pdfimages',['-list',path.join(__dirname,'samples/real',f)]).toString().split('\n').length-3,x('pdfimages',['-list',out]).toString().split('\n').length-3);
 console.log('text before==after:',x('pdftotext',[path.join(__dirname,'samples/real',f),'-']).toString()===x('pdftotext',[out,'-']).toString(),'errors:',errs.join(' ; ').slice(0,400));await b.close();})();
