/* Fileopia – all processing happens in the browser. No uploads. */
(()=>{'use strict';
const T=window.I18N||{};const $=(s,r=document)=>r.querySelector(s);
const root=$('#tool');if(!root)return;
const toolId=root.dataset.tool,multiple=root.dataset.multiple==='true';
const work=$('.work',root),drop=$('.drop',root),input=$('.drop input[type=file]',root);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const loaded={};const load=src=>loaded[src]||(loaded[src]=new Promise((ok,ko)=>{const s=document.createElement('script');s.src='/vendor/'+src;s.onload=ok;s.onerror=()=>ko(new Error('Failed to load '+src));document.head.appendChild(s);}));
const L={pdflib:()=>load('pdf-lib.min.js').then(()=>window.PDFLib),
 pdfjs:()=>load('pdf.min.js').then(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='/vendor/pdf.worker.min.js';return pdfjsLib;}),
 zip:()=>load('jszip.min.js').then(()=>window.JSZip),mammoth:()=>load('mammoth.browser.min.js').then(()=>window.mammoth),fontkit:()=>load('fontkit.umd.min.js').then(()=>window.fontkit.default||window.fontkit)};
const buf=f=>f.arrayBuffer();
const base=n=>n.replace(/\.[^.]+$/,'');
const pdfBlob=b=>new Blob([b],{type:'application/pdf'});
const fmtSize=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';
async function openPdfjs(data,password,extra){const pj=await L.pdfjs();return pj.getDocument({data:new Uint8Array(data.slice(0)),password,...(extra||{})}).promise;}
async function renderPage(doc,n,scale){const p=await doc.getPage(n);const vp=p.getViewport({scale});const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);await p.render({canvasContext:ctx,viewport:vp}).promise;p.cleanup();return c;}
const toBlob=(c,type,q)=>new Promise(r=>c.toBlob(r,type,q));
function parseRanges(s,max){const out=[];for(const part of s.split(/[,;\s]+/).filter(Boolean)){const m=part.match(/^(\d+)?\s*-\s*(\d+)?$|^(\d+)$/);if(!m)throw new Error('Invalid range: '+part);let a,b;if(m[3]){a=b=+m[3];}else{a=m[1]?+m[1]:1;b=m[2]?+m[2]:max;}if(a<1||b>max||a>b)throw new Error('Range out of bounds: '+part+' (1-'+max+')');const r=[];for(let i=a;i<=b;i++)r.push(i-1);out.push({label:a===b?''+a:a+'-'+b,idx:r});}return out;}
async function zipOrOne(items,zipName){return items.length===1?items[0]:{blob:await zipBlobs(items),name:zipName};}
async function zipBlobs(items){const JSZip=await L.zip();const z=new JSZip();const used=new Set();for(const it of items){let n=it.name,k=2;while(used.has(n.toLowerCase())){n=it.name.replace(/(\.[^.\/]+)?$/,m=>` (${k})`+m);k++;}used.add(n.toLowerCase());z.file(n,it.blob);}return z.generateAsync({type:'blob'});}
// helper: select element
const sel=(id,label,opts)=>`<label>${esc(label)}<select id="${id}">${opts.map(o=>`<option value="${o[0]}">${esc(o[1])}</option>`).join('')}</select></label>`;
const inp=(id,label,type='text',val='',extra='')=>`<label>${esc(label)}<input id="${id}" type="${type}" value="${esc(val)}" ${extra}></label>`;
const v=id=>$('#'+id,work)?.value;
const chk=(id,label,on)=>`<label style="flex-direction:row;align-items:center;gap:8px"><input id="${id}" type="checkbox" ${on?'checked':''}> ${esc(label)}</label>`;
const vb=id=>$('#'+id,work)?.checked;

// Page preview with click-to-place (sign, edit)
async function setupPreview(file,onPlace,password){
  const data=await buf(file);const doc=await openPdfjs(data,password);
  const pv=document.createElement('div');pv.className='pv';
  pv.innerHTML=`<label style="display:inline-flex;gap:6px;align-items:center;font-weight:600">${esc(T.o_page)} <select id="pgsel">${Array.from({length:doc.numPages},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label><p class="hint">${esc(T.o_clickPlace)}</p><div class="preview"></div>`;
  const box=$('.preview',pv);
  const state={page:1,marks:[]};
  async function show(){const pg=await doc.getPage(state.page);const v1=pg.getViewport({scale:1}),w1=v1.width;const cw=Math.max(260,Math.min(pv.clientWidth||document.querySelector('#tool .custom')?.clientWidth||700,900,(window.innerHeight*0.8)*w1/v1.height));const dpr=Math.min(2,window.devicePixelRatio||1);box.innerHTML='';const c=await renderPage(doc,state.page,cw*dpr/w1);c.style.width=cw+'px';box.appendChild(c);drawMarks();}
  function drawMarks(){box.querySelectorAll('.mark').forEach(m=>m.remove());for(const m of state.marks.filter(m=>m.page===state.page)){const d=document.createElement('div');d.className='mark';d.style.left=m.fx*100+'%';d.style.top=m.fy*100+'%';d.style.width=(m.fw||0.02)*100+'%';d.style.height=(m.fh||0.02)*100+'%';d.textContent=m.label||'';box.appendChild(d);}}
  box.addEventListener('click',e=>{const c=box.querySelector('canvas');const r=c.getBoundingClientRect();const fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height;const m=onPlace(state.page,fx,fy,r);if(m){state.marks.push(m);drawMarks();}});
  $('#pgsel',pv).onchange=e=>{state.page=+e.target.value;show();};
  await show();state.redraw=drawMarks;state.numPages=doc.numPages;return {el:pv,state};
}

// --- Tool definitions ---
const TOOLS={};
// Replace characters the standard font cannot encode
function mkSafe(font){const cache={};const ok=ch=>{if(ch in cache)return cache[ch];try{font.encodeText(ch);cache[ch]=true;}catch(e){cache[ch]=false;}return cache[ch];};
 const map={'\u2018':"'",'\u2019':"'",'\u201C':'"','\u201D':'"','\u2013':'-','\u2014':'-','\u2026':'...','\u00A0':' ','\t':' '};
 return s=>[...String(s)].map(c=>map[c]??c).map(c=>c.length>1?c:ok(c)?c:'?').join('').replace(/[\r\n]+/g,' ');}

// --- UI (runs after the per-tool bundle has registered itself) ---
let files=[],tool;const nofile=root.dataset.nofile==='true';
function addFiles(list){const arr=[...list];if(!arr.length)return;const max=+root.dataset.maxmb||0;const big=max&&arr.find(f=>f.size>max*1048576);if(big){files=[];render();showErr(new Error(`${big.name}: ${fmtSize(big.size)} > ${max} MB limit (browser memory)`));return;}files=multiple?files.concat(arr):[arr[0]];render();}
function start(){tool=TOOLS[toolId];if(!tool){console.error('tool missing',toolId);return;}tool.preset=root.dataset.preset||'';try{tool.vars=JSON.parse(root.dataset.vars||'{}');}catch(e){tool.vars={};}
  if(input){input.addEventListener('change',()=>{addFiles(input.files);input.value='';});
   ['dragenter','dragover'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
   ['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
   drop.addEventListener('drop',ev=>addFiles(ev.dataTransfer.files));}
  if(nofile)render();}
const NEXT=(()=>{try{return JSON.parse(root.dataset.next||'[]');}catch(e){return [];}})();
const setStep=n=>{root.dataset.step=n;};
const isImg=f=>/^image\/(png|jpe?g|gif|webp|bmp|svg|avif)/.test(f.type);
async function thumb(f){if(f._thumb!==undefined)return f._thumb;f._thumb=null;try{const dpr=Math.min(2,window.devicePixelRatio||1);
  if(isImg(f))f._thumb=URL.createObjectURL(f);
  else if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)){const doc=await openPdfjs(await buf(f));const p=await doc.getPage(1);const vp0=p.getViewport({scale:1});const c=await renderPage(doc,1,(120*dpr)/vp0.width);f._thumb=c.toDataURL('image/jpeg',.85);f._pages=doc.numPages;doc.destroy();}}catch(e){}return f._thumb;}
const fileIcon=f=>/pdf/i.test(f.name)?'📄':isImg(f)?'🖼':/\.(mp3|wav|m4a|ogg)$/i.test(f.name)?'🎵':/\.(mp4|mov|webm)$/i.test(f.name)?'🎬':'📎';
function cards(){const many=multiple&&files.length>1;return `<div class="fbar">${many?`<span>${files.length} ${esc(T.filesN||'files')}</span><button type="button" class="mini" data-sort="az">A→Z</button><button type="button" class="mini" data-sort="za">Z→A</button>`:''}</div><ul class="files">${files.map((f,i)=>`<li draggable="${many}" data-i="${i}"><div class="th" style="--rot:${f._rot||0}deg"><span class="fi">${fileIcon(f)}</span></div><span class="nm" title="${esc(f.name)}">${esc(f.name)}</span><small>${fmtSize(f.size)}${f._pages?' · '+f._pages+' '+esc(T.pagesN||'pages'):''}</small><div class="fa">${tool.rotatable?`<button type="button" data-a="rot" data-i="${i}" aria-label="${esc(T.rotate||'Rotate')}">⟳</button>`:''}${many?`<button type="button" data-a="up" data-i="${i}" aria-label="${esc(T.moveUp)}">←</button><button type="button" data-a="down" data-i="${i}" aria-label="${esc(T.moveDown)}">→</button>`:''}<button type="button" data-a="rm" data-i="${i}" aria-label="${esc(T.remove)}">✕</button></div></li>`).join('')}${multiple?`<li class="addtile"><button type="button" id="addmore" aria-label="${esc(T.addMore||T.select)}"><b>+</b><span>${esc(T.addMore||T.select)}</span></button></li>`:''}</ul>`;}
function fillThumbs(){work.querySelectorAll('.files li[data-i]').forEach(async li=>{const f=files[+li.dataset.i];const u=await thumb(f);if(u&&li.isConnected){const th=$('.th',li);th.innerHTML=`<img src="${u}" alt="">`;}const s=$('small',li);if(f._pages&&s&&!/·/.test(s.textContent))s.textContent+=` · ${f._pages} ${T.pagesN||'pages'}`;});}
function advWrap(){const o=$('.opts',work);if(!o||tool.noAdv)return;const ls=[...o.children].filter(e=>e.tagName==='LABEL');if(ls.length<=3)return;const d=document.createElement('details');d.className='adv';d.innerHTML=`<summary>${esc(T.advanced||'Advanced (optional)')}</summary><div class="advb"></div>`;ls.slice(2).forEach(l=>$('.advb',d).appendChild(l));o.appendChild(d);}
async function render(){
  const keep={};work.querySelectorAll('.opts [id]').forEach(e=>{if(e.type==='file')return;keep[e.id]=e.type==='checkbox'||e.type==='radio'?e.checked:e.value;});
  if(!files.length&&!nofile){work.hidden=true;drop.hidden=false;setStep(1);return;}
  if(drop)drop.hidden=true;work.hidden=false;setStep(2);root.classList.toggle('isnofile',nofile);
  work.innerHTML=`<div class="wk"><div class="fcol">${nofile?'':cards()}<div class="custom"></div></div><aside class="side"><h2 class="sideh">${esc(T.stepOptions||'Options')}</h2><div class="opts">${tool.opts?tool.opts.call(tool):''}</div>
  <div class="actions"><button type="button" class="btn big" id="go"${tool.live?' hidden':''}>${esc(tool.goLabel?tool.goLabel():T.process)} →</button></div><div class="prog" hidden><div class="bar"><i></i></div><span class="pct"></span></div><p class="status" role="status" aria-live="polite"></p></aside></div>`;
  advWrap();
  for(const [k,val] of Object.entries(keep)){const e=$('#'+k,work);if(!e)continue;if(typeof val==='boolean')e.checked=val;else e.value=val;}
  work.querySelectorAll('.files [data-a]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,a=b.dataset.a;if(a==='rm')files.splice(i,1);else if(a==='rot'){files[i]._rot=((files[i]._rot||0)+90)%360;$('.th',b.closest('li')).style.setProperty('--rot',files[i]._rot+'deg');return;}else{const j=a==='up'?i-1:i+1;if(j<0||j>=files.length)return;[files[i],files[j]]=[files[j],files[i]];}render();});
  work.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{const k=b.dataset.sort==='az'?1:-1;files.sort((a,c)=>k*a.name.localeCompare(c.name,undefined,{numeric:true}));render();});
  let dragI=null;work.querySelectorAll('.files li[draggable=true]').forEach(li=>{li.ondragstart=e=>{dragI=+li.dataset.i;li.classList.add('drag');e.dataTransfer.effectAllowed='move';};li.ondragend=()=>li.classList.remove('drag');li.ondragover=e=>{if(dragI!==null){e.preventDefault();li.classList.add('dov');}};li.ondragleave=()=>li.classList.remove('dov');li.ondrop=e=>{e.preventDefault();e.stopPropagation();const j=+li.dataset.i;if(dragI===null||dragI===j)return;const [m]=files.splice(dragI,1);files.splice(j,0,m);dragI=null;render();};});
  $('#addmore',work)?.addEventListener('click',()=>input.click());
  fillThumbs();
  $('#go',work).onclick=()=>go();if(tool.minFiles&&files.length<tool.minFiles){$('#go',work).disabled=true;$('.status',work).textContent=tool.minMsg||'';}
  if(tool.setup){try{const el=await tool.setup(files);if(el)$('.custom',work).appendChild(el);}catch(e){showErr(e);}}
  if(tool.live){let tm;const kick=e=>{if(e&&e.target&&e.target.id==='rename')return;clearTimeout(tm);tm=setTimeout(()=>go(true),350);};if(work._kick){work.removeEventListener('input',work._kick);work.removeEventListener('change',work._kick);}work._kick=kick;work.addEventListener('input',kick);work.addEventListener('change',kick);go(true);}  // first run immediately (same task as render) so results paint with the UI: no layout shift
}
function showErr(e,retry){console.error(e);const s=$('.status',work)||(()=>{work.hidden=false;const p=document.createElement('p');p.className='status';work.appendChild(p);return p;})();s.className='status err';let m=e&&e.message||String(e);if(/encrypt|password/i.test(m)&&toolId!=='unlock'&&/pdf/.test(toolId))m+=' — try the Unlock PDF tool first.';const top=(e&&e.stack||'').split('\n').find(l=>/^\s+at /.test(l))||'';const user=(e&&e.user)||(e&&e.constructor===Error&&/\/assets\/t\//.test(top)&&!/undefined|null|NaN|is not|Cannot|failed|Invalid array/i.test(m))||Object.entries(T).some(([k,h])=>/^o_/.test(k)&&typeof h==='string'&&h.length>2&&m.startsWith(h.replace(/[?:.]+$/,'')));if(user&&m.split(' ').length<=3&&Object.entries(T).some(([k,h])=>/^o_/.test(k)&&(m===h||m===h+'?')))m=(T.fillIn||'Please fill in')+' “'+m.replace(/\?$/,'')+'”.';s.classList.toggle('hint',user);s.innerHTML=(user?`<b>ℹ ${esc(m)}</b> `:`<b>⚠ ${esc(T.errFriendly||'Something went wrong.')}</b> ${esc(T.error)} ${esc(m)} `)+(retry&&!user?`<button type="button" class="btn ghost mini" id="retry">↻ ${esc(T.retry||'Try again')}</button>`:'');$('#retry',s)?.addEventListener('click',retry);const pg=$('.prog',work);if(pg)pg.hidden=true;}
function progress(m){const pg=$('.prog',work);if(!pg)return;pg.hidden=false;let f=null;if(typeof m==='number')f=m;else{const a=String(m).match(/(\d+)\s*%/),b=String(m).match(/(\d+)\s*\/\s*(\d+)/);if(a)f=+a[1]/100;else if(b&&+b[2])f=+b[1]/+b[2];}
  pg.classList.toggle('ind',f===null);if(f!==null){f=Math.max(0,Math.min(1,f));$('.bar i',pg).style.width=(f*100).toFixed(0)+'%';$('.pct',pg).textContent=(f*100).toFixed(0)+'%';}else $('.pct',pg).textContent='';}
let liveUrls=[];
async function go(live){const btn=$('#go',work),st=$('.status',work);if(!live){btn.disabled=true;st.className='status';st.textContent=T.working;progress(0.02);}
  const inSize=files.reduce((a,f)=>a+f.size,0);
  try{const r=await tool.run.call(tool,files,m=>{st.textContent=m;if(!live)progress(m);});window.__lastResult=r;const urls=[];const mk=b=>{const u=URL.createObjectURL(b);urls.push(u);return u;};
   const extra=(r.extra||[]).map((x,k)=>`<a class="btn ghost dlx" id="dl${k+2}" href="${mk(x.blob)}" download="${esc(x.name)}">⬇ ${esc(x.label||x.name)}</a>`).join('');
   if(live){liveUrls.forEach(u=>URL.revokeObjectURL(u));liveUrls=urls;$('.actions',work).innerHTML=`<button type="button" class="btn big" id="go" hidden></button>${r.blob?`<a class="btn big" id="dl" href="${mk(r.blob)}" download="${esc(r.name)}">⬇ ${esc(T.download)}</a>`:''}${extra}`;st.className='status';st.textContent=r.info||'';setStep(3);return;}
   setStep(3);const ext=(r.name||'').match(/\.[^.]+$/)?.[0]||'';const out=r.blob?r.blob.size:0;const saved=inSize&&out&&out<inSize?Math.round((1-out/inSize)*100):0;
   const nx=NEXT.map(n=>`<a class="chip" href="${n.u}">${esc(n.n)}</a>`).join('');
   const res=document.createElement('div');res.className='result';
   res.innerHTML=`<div class="rtop">${saved?`<div class="ring" style="--p:${saved}"><b>${saved}%</b><small>${esc(T.saved||'saved')}</small></div>`:'<div class="ok">✓</div>'}<div class="rinfo"><h2>${esc(T.done)}</h2>${r.blob?`<label class="rn">${esc(T.rename||'File name')}<span><input id="rename" value="${esc(base(r.name))}"><em>${esc(ext)}</em></span></label><p class="sz">${inSize&&!nofile?`${fmtSize(inSize)} → `:''}<b>${fmtSize(out)}</b></p>`:''}${r.info?`<p class="ri">${esc(r.info)}</p>`:''}</div></div>
   <div class="actions">${r.blob?`<a class="btn huge" id="dl" href="${mk(r.blob)}" download="${esc(r.name)}">⬇ ${esc(T.download)}</a>`:''}${extra}</div>
   <p class="again"><button type="button" class="btn ghost" id="again">↺ ${esc(T.startOver||T.another)}</button></p>${nx?`<div class="next"><h2 class="h3">${esc(T.tryAnother||'Continue with another tool')}</h2>${nx}</div>`:''}`;
   const wk=$('.wk',work);wk.hidden=true;work.appendChild(res);
   $('#rename',res)?.addEventListener('input',e=>{$('#dl',res).download=(e.target.value.trim()||base(r.name))+ext;});
   if(r.view||r.links){const vw=document.createElement('div');vw.className='resview';vw.innerHTML=(r.view||'')+(r.links?`<ul class="links">${r.links.map(x=>`<li><a href="${mk(x.blob)}" download="${esc(x.name.split('/').pop())}">${esc(x.name)}</a> <small>${fmtSize(x.blob.size)}</small></li>`).join('')}</ul>`:'');res.appendChild(vw);if(r.mount)r.mount(vw);}
   $('#again',res).onclick=()=>{urls.forEach(u=>URL.revokeObjectURL(u));files=[];render();};
   res.scrollIntoView({block:'start',behavior:'smooth'});
  }catch(e){if(btn)btn.disabled=false;if(live)work.querySelectorAll('#dl,.dlx').forEach(a=>a.remove());if(live&&e&&e.soft){st.className='status';st.textContent=e.message;return;}showErr(e,live?null:()=>go());}}
window.FP={progress,T,$,esc,load,L,buf,base,pdfBlob,fmtSize,openPdfjs,renderPage,toBlob,parseRanges,zipBlobs,zipOrOne,sel,inp,v,setupPreview,mkSafe,chk,vb,TOOLS,work,root,toolId};
document.readyState==='complete'?start():document.addEventListener('DOMContentLoaded',start);
})();
