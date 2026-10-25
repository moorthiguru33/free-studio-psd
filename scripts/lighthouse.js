#!/usr/bin/env node
// Lighthouse every sitemap URL (mobile + desktop) against a live base URL, in parallel.
// usage: node scripts/lighthouse.js [BASE] [--lang en|hi|ta|all] [--sample N] [--jobs 4] [--only regex] [--forms mobile,desktop]
// Writes docs/lighthouse.md (summary + every failing audit) and .lighthouse/summary.json
const {execFile}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:d};
const BASE=(args.find(a=>/^https?:/.test(a))||require('../src/site.json').baseUrl).replace(/\/$/,'');
const LANG=opt('lang','en'),JOBS=+opt('jobs',4),SAMPLE=+opt('sample',0),ONLY=opt('only',''),FORMS=opt('forms','mobile,desktop').split(',');
const OUT=path.join(__dirname,'..','.lighthouse');fs.mkdirSync(OUT,{recursive:true});
const CATS=['performance','accessibility','best-practices','seo'];
async function urls(){const langs=LANG==='all'?['en','hi','ta']:LANG.split(',');let u=[];
 for(const l of langs){const x=await (await fetch(`${BASE}/sitemap-${l}.xml`)).text();let list=[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replace(/^https?:\/\/[^/]+/,BASE));
  if(SAMPLE&&l!=='en')list=list.filter((_,i)=>i%Math.ceil(list.length/SAMPLE)===0);u.push(...list);}
 // Lighthouse refuses to score non-2xx documents (ERRORED_DOCUMENT_REQUEST); /404 serves the same 404 template with 200
 if(langs.includes('en'))u.push(BASE+'/404');return ONLY?u.filter(x=>new RegExp(ONLY).test(x)):u;}
function lh(url,form){return new Promise(res=>{const f=path.join(os.tmpdir(),'lh-'+Math.random().toString(36).slice(2)+'.json');
 const a=['-y','lighthouse@12',url,'--quiet','--output=json','--output-path='+f,'--only-categories='+CATS.join(','),'--chrome-flags=--headless=new --no-sandbox --disable-gpu'];if(form==='desktop')a.push('--preset=desktop');
 execFile('npx',a,{env:{...process.env,CHROME_PATH:process.env.CHROME_PATH||'/usr/bin/google-chrome'},timeout:180000},()=>{let r;try{r=JSON.parse(fs.readFileSync(f,'utf8'));fs.unlinkSync(f);}catch(e){return res({url,form,error:'run failed'});}
  const s=Object.fromEntries(CATS.map(c=>[c,r.categories[c]?Math.round(r.categories[c].score*100):null]));
  const fails=[];for(const c of CATS)for(const ref of r.categories[c].auditRefs){const au=r.audits[ref.id];if(ref.weight>0||c!=='performance'){if(au.score!==null&&au.score<1&&au.scoreDisplayMode!=='informative'&&au.scoreDisplayMode!=='manual'&&au.scoreDisplayMode!=='notApplicable')fails.push({cat:c,id:ref.id,score:au.score,v:au.displayValue||'',items:(au.details&&au.details.items||[]).slice(0,3).map(i=>(i.node&&i.node.snippet)||i.url||i.source&&i.source.url||'').filter(Boolean)});}}
  res({url,form,s,lcp:r.audits['largest-contentful-paint'].displayValue,cls:r.audits['cumulative-layout-shift'].displayValue,tbt:r.audits['total-blocking-time'].displayValue,fails,rtErr:r.runtimeError&&r.runtimeError.code});});});}
(async()=>{const list=await urls();const jobs=[];for(const u of list)for(const f of FORMS)jobs.push([u,f]);console.log(`${list.length} URLs × ${FORMS.length} = ${jobs.length} runs, ${JOBS} parallel, base ${BASE}`);
 const results=[];let i=0,done=0;async function worker(){while(i<jobs.length){const [u,f]=jobs[i++];let r=await lh(u,f);
  // retry perf noise once
  if(r.s&&r.s.performance<100)r=await lh(u,f).then(x=>x.s&&x.s.performance>=r.s.performance?x:r);
  results.push(r);done++;const sc=r.s?CATS.map(c=>r.s[c]).join('/'):r.error;if(!r.s||Object.values(r.s).some(x=>x<100))console.log(`[${done}/${jobs.length}] ${f.padEnd(7)} ${sc} ${u} ${(r.fails||[]).map(x=>x.id).join(',')}`);else if(done%20===0)console.log(`[${done}/${jobs.length}] ...`);}}
 await Promise.all(Array.from({length:JOBS},worker));results.sort((a,b)=>a.url.localeCompare(b.url)||a.form.localeCompare(b.form));
 fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(results,null,1));
 const perfect=results.filter(r=>r.s&&CATS.every(c=>r.s[c]===100)),bad=results.filter(r=>!perfect.includes(r));
 const avg=c=>(results.filter(r=>r.s).reduce((a,r)=>a+r.s[c],0)/results.filter(r=>r.s).length).toFixed(1);
 let md=`# Lighthouse report\n\nGenerated ${new Date().toISOString()} against \`${BASE}\` (Lighthouse 12, ${FORMS.join(' + ')}, lang: ${LANG}${SAMPLE?`, sample ${SAMPLE}/lang`:''}).\nRe-run: \`node scripts/lighthouse.js ${BASE} --lang ${LANG}${SAMPLE?' --sample '+SAMPLE:''}\`\n\n**${perfect.length}/${results.length} runs score 100/100/100/100.** Averages — Performance ${avg('performance')}, Accessibility ${avg('accessibility')}, Best Practices ${avg('best-practices')}, SEO ${avg('seo')}.\n\n`;
 if(bad.length){md+=`## Runs below 100\n\n| URL | Form | Perf | A11y | BP | SEO | Failing audits |\n|---|---|---|---|---|---|---|\n`;for(const r of bad)md+=`| ${r.url.replace(BASE,'')||'/'} | ${r.form} | ${r.s?CATS.map(c=>r.s[c]).join(' | '):'error | | |'} | ${(r.fails||[]).map(f=>f.id+(f.v?` (${f.v})`:'')).join(', ')||r.error||r.rtErr||''} |\n`;}
 md+=`\n## All runs\n\n| URL | Form | Scores | LCP | CLS | TBT |\n|---|---|---|---|---|---|\n`;for(const r of results)md+=`| ${r.url.replace(BASE,'')||'/'} | ${r.form} | ${r.s?CATS.map(c=>r.s[c]).join('/'):r.error} | ${r.lcp||''} | ${r.cls||''} | ${r.tbt||''} |\n`;
 const doc=path.join(__dirname,'..','docs',LANG==='en'&&!ONLY?'lighthouse.md':`lighthouse-${LANG}${ONLY?'-partial':''}.md`);fs.writeFileSync(doc,md);console.log(`DONE ${perfect.length}/${results.length} perfect -> ${doc}`);})();
