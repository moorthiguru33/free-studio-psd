const {chromium}=require('playwright-core');const fs=require('fs');const B=process.env.BASE||'http://localhost:8099';fs.mkdirSync('/tmp/b5',{recursive:true});
const S=(id,val)=>async p=>p.selectOption('#'+id,val),F=(id,val)=>async p=>p.fill('#'+id,val),C=id=>async p=>p.check('#'+id);
const ONLY=process.env.ONLY;const steps0=[
['mp4-to-mp3',['/tmp/t.mov'],[F('atstart','0:02'),F('atend','0:08'),S('afin','2'),F('avol','150'),F('ttitle','Test Song'),F('tartist','Guru'),async p=>p.setInputFiles('#tcover','/tmp/photo.jpg')]],
['compress-video',['/tmp/t.mov'],[S('vtarget','c'),F('vtargetc','1')]],
['mov-to-mp4',['/tmp/t.mov'],[]],
['audio-cutter',['/tmp/t.mp3'],[F('cstart','0:05'),F('cend','0:10.5'),S('cmode','remove'),S('cfout','2')]],
['video-to-gif',['/tmp/t.mov'],[S('gspeed','2'),S('gloop','b'),F('gtext','Hello GIF'),S('gw','320')]],
];const steps=ONLY?steps0.filter(x=>x[0]===ONLY):steps0;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const ctx=await b.newContext({acceptDownloads:true});let k=0;
for(const [slug,f,pre] of steps){const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));try{await p.goto(`${B}/${slug}/`);if(f)await p.setInputFiles('#tool input[type=file]',f);await p.waitForSelector('#go',{state:'attached'});await p.evaluate(()=>document.querySelectorAll('#tool details').forEach(d=>d.open=true));for(const s of pre)await s(p);await p.evaluate(()=>document.getElementById('go').click());await p.waitForSelector('#dl,.err',{timeout:300000});if(await p.$('.err'))throw new Error(await p.textContent('.err'));const info=await p.evaluate(()=>(document.querySelector('.res,.result,#out')||document.querySelector('#tool')).innerText.match(/[^\n]*(→|KB|MB)[^\n]*/)?.[0]);const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('dl').click())]);const fp='/tmp/b5/'+(k++)+'-'+dl.suggestedFilename();await dl.saveAs(fp);console.log(slug,'->',fp,fs.statSync(fp).size,info||'');}catch(e){console.log(slug,'ERR',e.message.slice(0,300))}await p.close();}await b.close();})();
