// End-to-end test of every tool in real Chrome. node test/e2e.js
const {chromium}=require('playwright-core');const fs=require('fs');const path=require('path');const {PDFDocument}=require('@cantoo/pdf-lib');const JSZip=require('jszip');
const S=f=>path.join(__dirname,'samples',f);const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.BASE||'http://localhost:8788';const results=[];
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--auto-select-desktop-capture-source=Entire screen']});
const ctx=await browser.newContext({acceptDownloads:true,permissions:['camera','microphone'],viewport:process.env.DESKTOP?{width:1366,height:900}:{width:390,height:844}});// mobile viewport
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
const dims=b=>{if(b[0]===0x89)return [b.readUInt32BE(16),b.readUInt32BE(20),'png'];if(b[0]===0xFF){let i=2;while(i<b.length){const m=b[i+1],L=b.readUInt16BE(i+2);if(m>=0xC0&&m<=0xC3)return [b.readUInt16BE(i+7),b.readUInt16BE(i+5),'jpg'];i+=2+L;}}if(b.slice(0,4).toString()==='RIFF')return [0,0,'webp'];if(b.slice(0,3).toString()==='GIF')return [b.readUInt16LE(6),b.readUInt16LE(8),'gif'];throw new Error('unknown image');};
const isz=(w,h,fmt)=>async b=>{const [W,H,F]=dims(b);if((w&&W!==w)||(h&&H!==h)||(fmt&&F!==fmt))throw new Error(`got ${W}x${H} ${F}`);return `${W}x${H} ${F}`;};
const maxKB=k=>async b=>{if(b.length>k*1024)throw new Error('size '+b.length);const [W,H,F]=dims(b);return `${(b.length/1024).toFixed(1)}KB ${W}x${H} ${F}`;};
const zipN=min=>async b=>{const z=await JSZip.loadAsync(b);const n=Object.keys(z.files).length;if(n<min)throw new Error('files '+n);return n+' files';};
const minB=(n,re)=>async b=>{if(b.length<n)throw new Error('small '+b.length);if(re&&!re.test(b.slice(0,12).toString('latin1')))throw new Error('magic '+b.slice(0,12).toString('hex'));return b.length+' bytes';};
const click=(...ids)=>async p=>{for(const [id,ms] of ids){await p.waitForSelector(id);await p.click(id);await p.waitForTimeout(ms);}};
await run('imgkb','compress-image-to-kb',['face.jpg'],{opts:{kbt:'30'},check:maxKB(30)});
await run('kb20','compress-image-to-20kb',['face.jpg'],{check:maxKB(20)});
await run('kb50-webp','compress-image-to-50kb',['photo.heic'],{opts:{kbf:'webp'},check:maxKB(50)});
await run('kb100-batch','compress-image-to-100kb',['face.jpg','image.png'],{check:zipN(2)});
await run('kb200-fill','compress-image-to-200kb',['logo.png'],{opts:{kbex:'1'},check:async b=>{if(b.length<150*1024||b.length>200*1024)throw new Error('size '+b.length);return b.length+'';}});
await run('pdf2long','pdf-to-long-image',['sample.pdf'],{check:async b=>{const [W,H]=dims(b);if(H<=W)throw new Error(`${W}x${H}`);return `${W}x${H}`;}});
await run('gifcompress','compress-gif',['anim.gif'],{opts:{gcc:'32'},check:async b=>{const [W,H,F]=dims(b);if(F!=='gif')throw new Error(F);return `${W}x${H} ${b.length}B (orig ${fs.statSync(S('anim.gif')).size})`;}});
await run('video2frames','video-to-frames',['clip.mp4'],{opts:{vfm:'count',vfn:'5'},check:zipN(5)});
await run('audiospeed','change-audio-speed',['tone.mp3'],{opts:{asr:'1.5'},check:minB(1000,/^(ID3|\xff)/)});
await run('audiospeed-wav','change-audio-speed',['tone.wav'],{opts:{asr:'1',asp:'2',asf:'wav'},check:minB(1000,/^RIFF/)});
await run('exif','exif-viewer',['exif.jpg'],{check:async b=>{const t=b.toString();if(!/TestCam/.test(t)||!/12\.9/.test(t))throw new Error(t.slice(0,300));return 'csv ok';}});
await run('rmexif','remove-exif-data',['exif.jpg'],{check:async b=>{if(/TestCam|Exif\0/.test(b.toString('latin1')))throw new Error('exif left');return isz(0,0,'jpg')(b);}});
await run('ascii','image-to-ascii',['logo.png'],{opts:{acw:'60'},check:async b=>{const t=b.toString();const l=t.split('\n');if(l[0].length<50)throw new Error('line '+l[0].length);return l.length+' lines';}});
await run('voicerec','voice-recorder',[],{opts:{vrf:'wav'},before:click(['#vrgo',2500],['#vrstop',1500]),check:minB(10000,/^RIFF/)});
await run('webcam','webcam-photo',[],{before:click(['#wcon',2000],['#wcsnap',800]),check:async b=>{try{return await isz(0,0)(b);}catch(e){return zipN(1)(b);}}});
await run('screenrec','screen-recorder',[],{before:click(['#srgo',3000],['#srstop',1500]),check:minB(1000)});
await browser.close();for(const r of results)console.log(r.join('  |  '));process.exit(results.some(r=>r[0]==='FAIL')?1:0);})();
