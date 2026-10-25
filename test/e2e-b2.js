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
const fillA=(id,s)=>async p=>{await p.fill('#'+id,s);await p.waitForTimeout(700);};
// ---- Batch 2: text
await run('wordcount','word-counter',[],{before:fillA('wctext','Hello world. This is a test!\n\nSecond paragraph here.'),check:has(/Words: 9[\s\S]*Sentences: 3[\s\S]*Paragraphs: 2/)});
await run('charcount','character-counter',[],{before:fillA('cctext','Hi 👍🏽 é'),check:has(/Characters: 6\n[\s\S]*SMS: 1 segment \(Unicode/)});
await run('caseconv','case-converter',[],{opts:{ccmode:'snake'},before:fillA('cvin','userProfile ID\nHello World'),check:has(/^user_profile_id\nhello_world$/)});
await run('caseconv-title','case-converter',[],{opts:{ccmode:'title'},before:fillA('cvin','the lord of the rings'),check:has(/^The Lord of the Rings$/)});
await run('textdiff','text-diff-checker',[],{before:async p=>{await p.fill('#tda','a\nquick brown fox\nc');await p.fill('#tdb','a\nquick red fox\nc\nd');await p.waitForTimeout(700);if(!await p.$('.diff del'))throw new Error('no word diff');},check:has(/- quick brown fox\n\+ quick red fox[\s\S]*\+ d/)});
await run('lorem','lorem-ipsum-generator',[],{opts:{lcount:'5',lunit:'w'},check:has(/^Lorem ipsum dolor sit amet\n?$/)});
await run('dedupe','remove-duplicate-lines',[],{opts:{ddci:'1',ddsort:'az'},before:fillA('ddin','b\nA\na \nc\nb'),check:has(/^A\nb\nc\n$/)});
await run('handwriting','text-to-handwriting',[],{before:async p=>{await p.fill('#hwtext','Hello handwriting '.repeat(200));await p.waitForSelector('#hwprev canvas');},check:async b=>{isPdf(b);const n=await pages(b);if(n<2)throw new Error('pages '+n);return n+' pages'}});
// ---- dev
await run('jsonfmt','json-formatter',[],{opts:{jsort:'1'},before:fillA('jin','{"b":1,"a":[1,2]}'),check:has(/^\{\n  "a": \[\n    1,/)});
{const p=await ctx.newPage();try{await p.goto(BASE+'/json-formatter/');await p.fill('#jin','{"a":1,}');await p.waitForTimeout(1200);const t=await p.textContent('#jstat');if(!/Invalid JSON/.test(t))throw new Error(t);results.push(['PASS','jsonfmt-err',t.slice(0,60)]);}catch(e){results.push(['FAIL','jsonfmt-err',e.message.split('\n')[0]]);}await p.close();}
await run('base64','base64-encode-decode',[],{before:fillA('b6in','héllo 👍'),check:has(/^aMOpbGxvIPCfkY0=$/)});
await run('base64-dec','base64-encode-decode',[],{opts:{b6mode:'dec'},before:fillA('b6in','aMOpbGxvIPCfkY0'),check:has(/^héllo 👍$/)});
await run('urlenc','url-encode-decode',[],{before:fillA('uein','a b&c=é'),check:has(/^a%20b%26c%3D%C3%A9$/)});
await run('hash','hash-generator',[],{before:fillA('htext','abc'),check:has(/MD5: 900150983cd24fb0d6963f7d28e17f72[\s\S]*SHA-256: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad[\s\S]*CRC32: 352441c2/)});
await run('hash-file','hash-generator',[],{before:async p=>{await p.setInputFiles('#hfile',S('notes.txt'));await p.waitForTimeout(800);},check:async b=>{const h=require('crypto').createHash('sha256').update(fs.readFileSync(S('notes.txt'))).digest('hex');if(!txt(b).includes(h))throw new Error('sha mismatch');return 'file sha256 ok'}});
await run('uuid','uuid-generator',[],{opts:{uuver:'7',uun:'5'},check:async b=>{const l=txt(b).trim().split('\n');if(l.length!==5||l.some(x=>!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x)))throw new Error(l);return '5 v7'}});
await run('regex','regex-tester',[],{opts:{rxrep:'<$2>'},check:has(/Contact <example.com> or <navy.mil>/)});
await run('minify-js','html-css-js-minifier',[],{opts:{mnlang:'js'},before:async p=>{await p.fill('#mnin','function add(first, second) {\n  // sum\n  return first + second;\n}\nconsole.log(add(1, 2));');await p.waitForTimeout(1500);},check:has(/^function add\(\w,\w\)\{return \w\+\w\}console\.log\(add\(1,2\)\);?$/)});
await run('minify-css','html-css-js-minifier',[],{before:fillA('mnin','a { color : #ffffff ; margin: 0px; }\n/* c */ b{x:y}'),check:has(/^a\{color:#fff;margin:0\}b\{x:y\}$/)});
await run('minify-html','html-css-js-minifier',[],{before:async p=>{await p.fill('#mnin','<div>\n  <!-- x -->\n  <p> Hi </p>\n<pre>  a\n  b</pre></div>');await p.waitForTimeout(1200);},check:has(/^<div><p> Hi ?<\/p> ?<pre>  a\n  b<\/pre><\/div>$/)});
await run('colorconv','color-converter',[],{opts:{ccin:'tomato'},check:has(/HEX: #FF6347[\s\S]*HSL: hsl\(9, 100%, 64%\)[\s\S]*CMYK: cmyk\(0%, 61%, 72%, 0%\)/)});
// ---- calc
await run('percent','percentage-calculator',[],{opts:{pcm:'chg',pcx:'80',pcy:'100'},check:has(/increase of 25%/)});
await run('age','age-calculator',[],{opts:{agdob:'2000-02-29',agat:'2026-03-01'},check:has(/Age: 26 years, 0 months, [01] days/)});
await run('bmi','bmi-calculator',[],{opts:{bmw:'70',bmh:'175'},check:has(/BMI 22\.9 – Normal weight/)});
await run('bmi-imp','bmi-calculator',[],{opts:{bmu:'i',bmw:'154',bmh:'5',bmin:'9'},check:has(/BMI 22\.7/)});
await run('loan','loan-calculator',[],{opts:{lnp:'200000',lnr:'6',lny:'30'},check:async b=>{const l=txt(b).trim().split('\n');if(l.length!==361)throw new Error(l.length);if(!/^1,1199\.10,199\.10,1000\.00/.test(l[1]))throw new Error(l[1]);return '360 payments of 1199.10'}});
await run('discount','discount-calculator',[],{opts:{dsp:'100',dsd:'20',dsd2:'10',dst:'8'},check:has(/\$100 − 28% = \$72, total \$77\.76/)});
await run('datediff','date-difference-calculator',[],{opts:{ddA:'2026-01-05',ddB:'2026-01-19',ddhol:'2026-01-12'},check:has(/Total days: 14[\s\S]*Working days: 9/)});
await browser.close();for(const r of results)console.log(r.join('  |  '));process.exit(results.some(r=>r[0]==='FAIL')?1:0);})();
