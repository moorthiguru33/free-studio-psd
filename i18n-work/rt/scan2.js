const {chromium}=require('/workspace/freepdf-site/node_modules/playwright-core');const fs=require('fs');
const S=f=>'/workspace/freepdf-site/test/samples/'+f;
const dirs=fs.readdirSync('/workspace/freepdf-site/dist/es').filter(d=>fs.existsSync(`/workspace/freepdf-site/dist/es/${d}/index.html`)&&!['search','tools'].includes(d));
const W=new Set('the and with your you for from this that are is to of in on file files page pages choose select download free convert all only add keep remove image images text size quality mode high low none off auto custom original width height color colour margin small large output format language each per'.split(' '));
const pick=acc=>{if(!acc)return [];if(/pdf/.test(acc))return [S('sample.pdf')];if(/xls|csv/.test(acc))return [S('data.xlsx')];if(/doc/.test(acc))return [S('sample.docx')];if(/heic/.test(acc))return [S('photo.heic')];if(/video|mp4/.test(acc))return [S('clip.mp4')];if(/audio|mp3/.test(acc))return [S('clip.mp4')];if(/txt|text/.test(acc))return [S('notes.txt')];if(/image|jpg|png|webp/.test(acc))return [S('image.png')];return [];};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:1366,height:900}});
for(const d of (process.argv[2]?process.argv[2].split(','):dirs)){const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 try{await p.goto('http://localhost:8788/es/'+d+'/');const acc=await p.getAttribute('#tool','data-accept');const fl=pick(acc);
 if(fl.length&&await p.$('#tool input[type=file]'))await p.setInputFiles('#tool input[type=file]',fl);await p.waitForTimeout(2500);
 await p.evaluate(()=>document.querySelectorAll('#tool details').forEach(x=>x.open=true));
 const txt=await p.evaluate(()=>{const t=document.getElementById('tool');const a=[];const w=document.createTreeWalker(t,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const s=n.nodeValue.trim();if(s)a.push(s)}t.querySelectorAll('[placeholder],[title],[aria-label]').forEach(e=>['placeholder','title','aria-label'].forEach(k=>e.getAttribute(k)&&a.push(e.getAttribute(k))));return a;});
 const bad=[...new Set(txt)].filter(s=>{const ws=(s.toLowerCase().match(/[a-z]+/g)||[]);return ws.length>=2&&!/[áéíóúñ¿¡]/.test(s)});
 console.log(d,errs.length?'ERR '+errs[0]:'',JSON.stringify(bad));}catch(e){console.log(d,'FAIL',e.message.split('\n')[0]);}await p.close();}
await b.close();})();
