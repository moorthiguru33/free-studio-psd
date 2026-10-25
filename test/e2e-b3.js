// End-to-end test of every tool in real Chrome. node test/e2e.js
const {chromium}=require('playwright-core');const fs=require('fs');const path=require('path');const {PDFDocument}=require('@cantoo/pdf-lib');const JSZip=require('jszip');
const S=f=>path.join(__dirname,'samples',f);const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.BASE||'http://localhost:8788';const results=[];
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await browser.newContext({acceptDownloads:true,viewport:process.env.DESKTOP?{width:1366,height:900}:{width:390,height:844}});// mobile viewport
async function run(name,slug,files,{opts={},before,check,lang='',noDownload=false}={}){if(process.env.ONLY&&!new RegExp(process.env.ONLY).test(name))return;const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const reqs=[];page.on('request',r=>{if(['POST','PUT'].includes(r.method()))reqs.push(r.url());});
 try{await page.goto(`${BASE}/${lang}${slug}/`);if(files.length)await page.setInputFiles('#tool input[type=file]',files.map(S2));await page.waitForSelector('#go',{state:'attached'});await page.evaluate(()=>document.querySelectorAll('details.adv').forEach(d=>d.open=true));
  for(const [k,v] of Object.entries(opts)){const el=page.locator('#'+k);const tg=await el.evaluate(e=>e.tagName+(e.type||''));if(tg==='INPUTcheckbox')await el.setChecked(v==='1');else if(tg.startsWith('SELECT'))await el.selectOption(v);else await el.fill(v);}
  if(before)await before(page);
  if(await page.isVisible('#go'))await page.click('#go');else await page.waitForTimeout(900);await page.waitForSelector(noDownload?'.result,.status.err':'#dl,.status.err',{timeout:60000});
  if(await page.$('.status.err'))throw new Error(await page.textContent('.status'));
  if(noDownload){results.push(['PASS',name,await check(null,null,page)]);await page.close();return;}
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#dl')]);const fp=path.join(OUT,name+'-'+dl.suggestedFilename());await dl.saveAs(fp);
  const info=await check(fs.readFileSync(fp),fp);if(errs.length)throw new Error('page errors: '+errs.join('; '));if(reqs.length)throw new Error('uploads detected: '+reqs);
  results.push(['PASS',name,info]);}catch(e){results.push(['FAIL',name,e.message.split('\n')[0]]);await page.screenshot({path:path.join(OUT,name+'-fail.png')});}await page.close();}
const S2=f=>f.startsWith('/')?f:S(f);
const pages=async b=>(await PDFDocument.load(b)).getPageCount();
const isPdf=b=>{if(b.slice(0,5).toString()!=='%PDF-')throw new Error('not a PDF');};
const txt=b=>Buffer.from(b).toString();
const has=(re)=>async b=>{const t=txt(b);if(!re.test(t))throw new Error(t.slice(0,200));return t.split('\n')[0].slice(0,80);};
const dims=b=>{if(b[0]===0x89)return [b.readUInt32BE(16),b.readUInt32BE(20),'png'];if(b[0]===0xFF){let i=2;while(i<b.length){const m=b[i+1],L=b.readUInt16BE(i+2);if(m>=0xC0&&m<=0xC3)return [b.readUInt16BE(i+7),b.readUInt16BE(i+5),'jpg'];i+=2+L;}}if(b.slice(0,4).toString()==='RIFF')return [0,0,'webp'];throw new Error('unknown image');};
const isz=(w,h,fmt)=>async b=>{const [W,H,F]=dims(b);if((w&&W!==w)||(h&&H!==h)||(fmt&&F!==fmt))throw new Error(`got ${W}x${H} ${F}`);return `${W}x${H} ${F}`;};
const pdfPages=n=>async b=>{isPdf(b);const d=await PDFDocument.load(b,{ignoreEncryption:true});if(n&&d.getPageCount()!==n)throw new Error('pages '+d.getPageCount());return d.getPageCount()+' pages';};
const links=n=>async b=>{const d=await PDFDocument.load(b);let c=0;for(const p of d.getPages()){const a=p.node.Annots();if(a)c+=a.size();}if(c!==n)throw new Error('annots '+c);return c+' links left';};
const IMG=['face.jpg'];
// ---- Batch 3: image
await run('passport','passport-photo-maker',IMG,{opts:{ppc:'us'},check:isz(602,602,'jpg')});
await run('passport-sheet','passport-photo-maker',IMG,{opts:{ppc:'uk',ppsheet:'4x6'},check:isz(1800,1200,'jpg')});
await run('circlecrop','circle-crop-image',IMG,{opts:{ccsize:'400'},check:async b=>{const r=await isz(400,400,'png')(b);return r;}});
await run('textimg','add-text-to-image',['image.png'],{opts:{tit:'Hello world'},check:isz(0,0,'png')});
await run('textimg-hw','add-text-to-image',IMG,{opts:{tit:'Hi',tif:'hw-caveat',tifmt:'jpg'},check:isz(0,0,'jpg')});
await run('filters','photo-filters',IMG,{opts:{fxp:'vintage',fxf:'jpg'},check:isz(0,0,'jpg')});
await run('img2b64','image-to-base64',['logo.png'],{check:has(/^data:image\/png;base64,iVBOR/)});
await run('img2b64-css','image-to-base64',['logo.png','face.jpg'],{opts:{ibf:'css'},check:has(/^background-image: url\("data:image\/png;base64[\s\S]*data:image\/jpeg/)});
await run('social','social-media-image-resizer',IMG,{opts:{soc:'yt_th'},check:isz(1280,720,'jpg')});
await run('social-fill','social-media-image-resizer',IMG,{opts:{soc:'ig_st',som:'fill',sof:'png'},check:isz(1080,1920,'png')});
await run('mockup','screenshot-mockup',['image.png'],{check:isz(0,0,'png')});
await run('mockup-phone','screenshot-mockup',['image.png'],{opts:{mkf:'phone',mkfmt:'jpg'},check:isz(0,0,'jpg')});
await run('signature-type','signature-maker',[],{opts:{sgm:'type',sgn:'Jane Doe'},check:isz(0,0,'png')});
await run('signature-draw','signature-maker',[],{before:async p=>{const c=await p.$('#sgcv');const bb=await c.boundingBox();await p.mouse.move(bb.x+20,bb.y+40);await p.mouse.down();for(let i=0;i<20;i++)await p.mouse.move(bb.x+20+i*10,bb.y+40+Math.sin(i)*20);await p.mouse.up();await p.waitForTimeout(800);},check:isz(0,0,'png')});
// ---- Batch 3: PDF
await run('pagecount','pdf-page-counter',['sample.pdf','article.pdf'],{check:has(/"TOTAL",\d+/)});
await run('pdfimage','add-image-to-pdf',['sample.pdf'],{before:async p=>{await p.setInputFiles('#piimg',S2('logo.png'));},check:async b=>{const r=await pdfPages(0)(b);const s=b.toString('latin1');if(!/\/Subtype\s*\/Image/.test(s))throw new Error('no image');return r;}});
await run('bookmarks','pdf-bookmark-editor',['sample.pdf'],{before:async p=>{await p.waitForSelector('#bktext');await p.fill('#bktext','Intro | 1\n  Part A | 1\nEnd | 1');},check:async b=>{const s=b.toString('latin1');if(!/\/Outlines/.test(s))throw new Error('no outline');return 'outline ok';}});
await run('rmlinks','remove-links-from-pdf',['links.pdf'],{opts:{rlm:'ext'},check:links(2)});
await run('rmlinks-all','remove-links-from-pdf',['links.pdf'],{check:links(0)});
await run('darkpdf','dark-mode-pdf',['sample.pdf'],{check:pdfPages(0)});
await run('resume','resume-builder',[],{check:pdfPages(0)});
await run('resume-modern','resume-builder',[],{opts:{rst:'modern',rsp:'letter'},check:pdfPages(0)});
await run('receipt','receipt-maker',[],{check:async(b,f)=>{const r=await pdfPages(1)(b);return r;}});
await run('receipt-a4','receipt-maker',[],{opts:{rcfmt:'a4',rctax:'20',rcincl:'1'},check:pdfPages(1)});
await browser.close();for(const r of results)console.log(r.join('  |  '));process.exit(results.some(r=>r[0]==='FAIL')?1:0);})();
