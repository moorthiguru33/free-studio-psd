// @needs txt
const sortK=o=>Array.isArray(o)?o.map(sortK):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().map(k=>[k,sortK(o[k])])):o;
function where(s,e){const m=String(e.message).match(/position (\d+)/);let pos=m?+m[1]:-1;const lc=String(e.message).match(/line (\d+) column (\d+)/);if(lc)return {line:+lc[1],col:+lc[2]};if(pos<0)return null;const pre=s.slice(0,pos);const line=pre.split('\n').length;return {line,col:pos-pre.lastIndexOf('\n')};}
TOOLS.jsonfmt={live:true,noAdv:true,
 opts:()=>sel('jmode','Action',[['fmt','Format / beautify'],['min','Minify (one line)']])+sel('jind','Indent',[['2','2 spaces'],['4','4 spaces'],['t','Tab']])+chk('jsort','Sort keys A→Z',false),
 setup(){return box(area('jin','JSON input','',12,'{"name":"Ada","skills":["math","code"],"active":true}')+`<p id="jstat" class="jstat"></p><label class="tl">Output ${copyBtn('jout')}<textarea id="jout" rows="14" readonly></textarea></label>`);},
 run(){const s=(v('jin')||'').trim();const st=$('#jstat',work);if(!s){st.textContent='';$('#jout',work).value='';throw soft('Paste JSON to format or validate.');}
  let o;try{o=JSON.parse(s);}catch(e){const w=where(s,e);st.className='jstat bad';st.textContent='✗ Invalid JSON'+(w?` – line ${w.line}, column ${w.col}`:'')+': '+e.message.replace(/^JSON\.parse: /,'');$('#jout',work).value='';throw soft('Invalid JSON');}
  if(vb('jsort'))o=sortK(o);const ind=v('jind')==='t'?'\t':+v('jind');const out=v('jmode')==='min'?JSON.stringify(o):JSON.stringify(o,null,ind);
  const cnt=x=>x&&typeof x==='object'?1+Object.values(x).reduce((a,y)=>a+cnt(y),0):1;st.className='jstat ok';st.textContent=`✓ Valid JSON · ${Array.isArray(o)?'array of '+o.length:typeof o==='object'&&o?Object.keys(o).length+' top-level keys':typeof o} · ${cnt(o)} values`;
  $('#jout',work).value=out;return {...txtOut(v('jmode')==='min'?'data.min.json':'data.json',out,'application/json'),info:fmtSize(new TextEncoder().encode(out).length)};}};
