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
const sel=(id,label,opts,def)=>`<label>${esc(label)}<select id="${id}">${opts.map(o=>`<option value="${o[0]}"${(def!==undefined?o[0]===def:o[2])?' selected':''}>${esc(o[1])}</option>`).join('')}</select></label>`;
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
function addFiles(list){const arr=[...list];if(!arr.length)return;const max=+root.dataset.maxmb||0;const big=max&&arr.find(f=>f.size>max*1048576);if(big){files=[];render();showErr(new Error(`${big.name}: ${fmtSize(big.size)} > ${max} MB limit (browser memory)`));return;}const allowBatch=multiple||!['sign','edit','bates','overlay','invoice','formfill','redact'].includes(toolId);files=allowBatch?files.concat(arr):[arr[0]];render();}

function checkChainedFile(){
  try{
    const req=indexedDB.open('fp_chain_db',1);
    req.onupgradeneeded=e=>{e.target.result.createObjectStore('store');};
    req.onsuccess=e=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains('store'))return;
      const tx=db.transaction('store','readwrite');
      const getReq=tx.objectStore('store').get('current');
      getReq.onsuccess=()=>{
        const it=getReq.result;
        if(it&&it.blob&&(Date.now()-it.time<120000)){
          tx.objectStore('store').delete('current');
          const f=new File([it.blob],it.name,{type:it.blob.type||'application/octet-stream'});
          addFiles([f]);
        }
      };
    };
  }catch(e){}
}

function saveChainedFile(blob,name,url){
  try{
    const req=indexedDB.open('fp_chain_db',1);
    req.onupgradeneeded=e=>{e.target.result.createObjectStore('store');};
    req.onsuccess=e=>{
      const db=e.target.result;
      const tx=db.transaction('store','readwrite');
      tx.objectStore('store').put({blob,name,time:Date.now()},'current');
      tx.oncomplete=()=>{window.location.href=url;};
      tx.onerror=()=>{window.location.href=url;};
    };
    req.onerror=()=>{window.location.href=url;};
  }catch(e){window.location.href=url;}
}

function getChainedActions(fileName){
  const ext=(fileName||'').match(/\.[^.]+$/)?.[0]?.toLowerCase()||'';
  const lmatch=window.location.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)\//i);
  const p=lmatch?'/'+lmatch[1]+'/':'/';
  if(ext==='.pdf'){
    return [
      {u:p+'compress-pdf/',n:'🗜️ Compress PDF',d:'Reduce file size'},
      {u:p+'protect-pdf/',n:'🔒 Protect PDF',d:'Add password'},
      {u:p+'sign-pdf/',n:'✍️ Sign PDF',d:'Digital signature'},
      {u:p+'pdf-to-word/',n:'📄 PDF to Word',d:'Edit in Word'},
      {u:p+'split-pdf/',n:'✂️ Split PDF',d:'Extract pages'},
      {u:p+'pdf-to-jpg/',n:'🖼️ PDF to JPG',d:'Convert pages'}
    ];
  }
  if(['.jpg','.jpeg','.png','.webp','.gif','.avif','.bmp','.tiff'].includes(ext)){
    return [
      {u:p+'compress-image/',n:'🗜️ Compress Image',d:'Save disk space'},
      {u:p+'resize-image/',n:'📐 Resize Image',d:'Change dimensions'},
      {u:p+'jpg-to-pdf/',n:'📄 Image to PDF',d:'Convert to PDF'},
      {u:p+'crop-image/',n:'✂️ Crop Image',d:'Trim borders'},
      {u:p+'passport-photo-maker/',n:'🛂 Passport Photo',d:'Official size'}
    ];
  }
  if(['.mp3','.wav','.m4a','.flac','.ogg','.aac','.opus'].includes(ext)){
    return [
      {u:p+'audio-cutter/',n:'✂️ Cut Audio',d:'Make ringtone'},
      {u:p+'compress-mp3/',n:'🗜️ Compress MP3',d:'Reduce bitrate'},
      {u:p+'audio-joiner/',n:'🔗 Join Audio',d:'Merge tracks'}
    ];
  }
  if(['.mp4','.webm','.mov','.mkv','.avi','.wmv'].includes(ext)){
    return [
      {u:p+'video-to-gif/',n:'🎞️ Video to GIF',d:'Create animation'},
      {u:p+'mp4-to-mp3/',n:'🎵 Video to MP3',d:'Extract audio'}
    ];
  }
  if(['.xlsx','.xls','.csv','.tsv','.ods'].includes(ext)){
    return [
      {u:p+'excel-to-pdf/',n:'📊 Excel to PDF',d:'Printable PDF'},
      {u:p+'csv-to-json/',n:'📋 CSV to JSON',d:'Web format'}
    ];
  }
  return [];
}

function renderRecentShelf(){
  const shelf=document.getElementById('recent-shelf');
  if(!shelf)return;
  try{
    const list=JSON.parse(localStorage.getItem('fp_recent')||'[]');
    if(!list.length){shelf.hidden=true;return;}
    shelf.hidden=false;
    shelf.querySelector('.rec-items').innerHTML=list.map(x=>`<div class="rec-item"><span class="rec-icon">📄</span><div class="rec-meta"><span class="rec-name" title="${esc(x.n)}">${esc(x.n)}</span><small>${fmtSize(x.s)} · <a href="${x.u}">${esc(x.tn)}</a></small></div></div>`).join('');
    shelf.querySelector('#rec-clear')?.addEventListener('click',()=>{localStorage.removeItem('fp_recent');shelf.hidden=true;},{once:true});
  }catch(e){}
}

function start(){tool=TOOLS[toolId];if(!tool){console.error('tool missing',toolId);return;}tool.preset=root.dataset.preset||'';try{tool.vars=JSON.parse(root.dataset.vars||'{}');}catch(e){tool.vars={};}
  checkChainedFile();
  renderRecentShelf();
  if(input){input.multiple=true;input.addEventListener('change',()=>{addFiles(input.files);input.value='';});
   ['dragenter','dragover'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
   ['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
   drop.addEventListener('drop',ev=>addFiles(ev.dataTransfer.files));document.addEventListener('paste',ev=>{const fs=[...(ev.clipboardData?.files||[])];if(fs.length&&!/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'')){ev.preventDefault();addFiles(fs);}});}
  if(nofile)render();}
const NEXT=(()=>{try{return JSON.parse(root.dataset.next||'[]');}catch(e){return [];}})();
const setStep=n=>{root.dataset.step=n;};
const isImg=f=>/^image\/(png|jpe?g|gif|webp|bmp|svg|avif)/.test(f.type);
async function thumb(f){if(f._thumb!==undefined)return f._thumb;f._thumb=null;try{const dpr=Math.min(2,window.devicePixelRatio||1);
  if(isImg(f))f._thumb=URL.createObjectURL(f);
  else if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)){const doc=await openPdfjs(await buf(f));const p=await doc.getPage(1);const vp0=p.getViewport({scale:1});const c=await renderPage(doc,1,(120*dpr)/vp0.width);f._thumb=c.toDataURL('image/jpeg',.85);f._pages=doc.numPages;doc.destroy();}}catch(e){}return f._thumb;}
const fileIcon=f=>/pdf/i.test(f.name)?'📄':isImg(f)?'🖼':/\.(mp3|wav|m4a|ogg)$/i.test(f.name)?'🎵':/\.(mp4|mov|webm)$/i.test(f.name)?'🎬':'📎';
function cards(){const many=files.length>1;const isBatch=!multiple&&many;return `<div class="fbar">${many?`<span>${isBatch?'<span class="batch-badge">⚡ Batch Mode</span> ':''}${files.length} ${esc(T.filesN||'files')}</span><button type="button" class="mini" data-sort="az">A→Z</button><button type="button" class="mini" data-sort="za">Z→A</button>`:''}</div><ul class="files">${files.map((f,i)=>`<li draggable="${many}" data-i="${i}"><div class="th" style="--rot:${f._rot||0}deg"><span class="fi">${fileIcon(f)}</span></div><span class="nm" title="${esc(f.name)}">${esc(f.name)}</span><small>${fmtSize(f.size)}${f._pages?' · '+f._pages+' '+esc(T.pagesN||'pages'):''}</small><div class="fa">${tool.rotatable?`<button type="button" data-a="rot" data-i="${i}" aria-label="${esc(T.rotate||'Rotate')}">⟳</button>`:''}${many?`<button type="button" data-a="up" data-i="${i}" aria-label="${esc(T.moveUp)}">←</button><button type="button" data-a="down" data-i="${i}" aria-label="${esc(T.moveDown)}">→</button>`:''}<button type="button" data-a="rm" data-i="${i}" aria-label="${esc(T.remove)}">✕</button></div></li>`).join('')}<li class="addtile"><button type="button" id="addmore" aria-label="${esc(T.addMore||T.select)}"><b>+</b><span>${esc(T.addMore||T.select)}</span></button></li></ul>`;}
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
let goSeq=0;async function go(live){const seq=++goSeq;const btn=$('#go',work),st=$('.status',work);if(!live){btn.disabled=true;st.className='status';st.textContent=T.working;progress(0.02);}
  const inSize=files.reduce((a,f)=>a+f.size,0);
  try{
    let r;
    const isSingleBatch = files.length > 1 && !multiple && !tool.combine && !['merge','audiojoin','imgjoin','videomerge'].includes(toolId);
    if (isSingleBatch && !live) {
      const items = [];
      for (let i = 0; i < files.length; i++) {
        const curFile = files[i];
        st.textContent = `${T.working || 'Processing'} ${i + 1}/${files.length} · ${curFile.name}`;
        progress((i + 0.1) / files.length);
        const singleRes = await tool.run.call(tool, [curFile], m => {
          st.textContent = `${i + 1}/${files.length}: ${m}`;
        });
        if (singleRes && singleRes.blob) {
          items.push({ blob: singleRes.blob, name: singleRes.name || curFile.name });
        }
      }
      r = await zipOrOne(items, (base(files[0].name) || 'batch') + '-batch.zip');
      r.info = `${items.length} files processed in batch · 100% complete`;
    } else {
      r = await tool.run.call(tool,files,m=>{st.textContent=m;if(!live)progress(m);});
    }
    if(live&&seq!==goSeq)return;window.__lastResult=r;const urls=[];const mk=b=>{const u=URL.createObjectURL(b);urls.push(u);return u;};
    const extra=(r.extra||[]).map((x,k)=>`<a class="btn ghost dlx" id="dl${k+2}" href="${mk(x.blob)}" download="${esc(x.name)}">⬇ ${esc(x.label||x.name)}</a>`).join('');
    if(live){liveUrls.forEach(u=>URL.revokeObjectURL(u));liveUrls=urls;$('.actions',work).innerHTML=`<button type="button" class="btn big" id="go" hidden></button>${r.blob?`<a class="btn big" id="dl" href="${mk(r.blob)}" download="${esc(r.name)}">⬇ ${esc(T.download)}</a>`:''}${extra}`;st.className='status';st.textContent=r.info||'';setStep(3);return;}
    setStep(3);const ext=(r.name||'').match(/\.[^.]+$/)?.[0]||'';const out=r.blob?r.blob.size:0;const saved=inSize&&out&&out<inSize?Math.round((1-out/inSize)*100):0;
    const nx=NEXT.map(n=>`<a class="chip" href="${n.u}">${esc(n.n)}</a>`).join('');

    // Viral Share & Quality Compare
    const pageUrl = window.location.href.split('?')[0];
    const shareText = encodeURIComponent(saved > 0 ? `I just saved ${saved}% file size using Fileopia for free without any software! Try it here:` : `Check out this 100% free & private online tool on Fileopia:`);
    const encUrl = encodeURIComponent(pageUrl);
    const shareHtml = `<div class="share-box"><span class="share-label">🚀 ${saved ? `Saved ${saved}% space! ` : ''}Share with friends & colleagues:</span><div class="share-btns"><a href="https://api.whatsapp.com/send?text=${shareText}%20${encUrl}" target="_blank" rel="noopener" class="sh-btn sh-wa">💬 WhatsApp</a><a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encUrl}" target="_blank" rel="noopener" class="sh-btn sh-x">𝕏 Twitter</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}" target="_blank" rel="noopener" class="sh-btn sh-li">💼 LinkedIn</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encUrl}" target="_blank" rel="noopener" class="sh-btn sh-fb">📘 Facebook</a><a href="https://reddit.com/submit?url=${encUrl}&title=${shareText}" target="_blank" rel="noopener" class="sh-btn sh-rd">🔴 Reddit</a><button type="button" class="sh-btn sh-cp" id="sh-copy">🔗 Copy Link</button></div></div>`;
    const canCompare = saved > 0 && files[0] && r.blob && (isImg(files[0]) || /pdf$/i.test(files[0].name));
    const compareHtml = canCompare ? `<div class="compare-box"><button type="button" class="btn ghost mini compare-toggle" id="btn-toggle-cmp">🔍 Compare Quality: Before vs After</button><div class="compare-view" id="cmp-view" hidden><div class="compare-pane"><b>Original (${fmtSize(inSize)})</b><div id="cmp-orig-pv"><span class="hint">Loading preview…</span></div></div><div class="compare-pane"><b>Processed (${fmtSize(out)} · -${saved}%)</b><div id="cmp-out-pv"><span class="hint">Loading preview…</span></div></div></div></div>` : '';

    const chainList = getChainedActions(r.name);
    const chainHtml = chainList.length && r.blob ? `<div class="chain-box"><span class="chain-title">⚡ ${esc(T.nextActions||'Next Actions – Chain directly with another tool:')}</span><div class="chain-btns">${chainList.map(c=>`<a href="${c.u}" class="chain-btn" data-chain-url="${c.u}"><b>${esc(c.n)}</b><small>${esc(c.d)}</small></a>`).join('')}</div></div>` : '';

    const res=document.createElement('div');res.className='result';
    res.innerHTML=`<div class="rtop">${saved?`<div class="ring" style="--p:${saved}"><b>${saved}%</b><small>${esc(T.saved||'saved')}</small></div>`:'<div class="ok">✓</div>'}<div class="rinfo"><h2>${esc(T.done)}</h2>${r.blob?`<label class="rn">${esc(T.rename||'File name')}<span><input id="rename" value="${esc(base(r.name))}"><em>${esc(ext)}</em></span></label><p class="sz">${inSize&&!nofile?`${fmtSize(inSize)} → `:''}<b>${fmtSize(out)}</b></p>`:''}${r.info?`<p class="ri">${esc(r.info)}</p>`:''}</div></div>
    <div class="actions">${r.blob?`<a class="btn huge" id="dl" href="${mk(r.blob)}" download="${esc(r.name)}">⬇ ${esc(T.download)}</a>`:''}${extra}</div>
    ${compareHtml}${shareHtml}${chainHtml}
    <p class="again"><button type="button" class="btn ghost" id="again">↺ ${esc(T.startOver||T.another)}</button></p>${nx?`<div class="next"><h2 class="h3">${esc(T.tryAnother||'Continue with another tool')}</h2>${nx}</div>`:''}`;
    const wk=$('.wk',work);wk.hidden=true;work.appendChild(res);
    $('#rename',res)?.addEventListener('input',e=>{$('#dl',res).download=(e.target.value.trim()||base(r.name))+ext;});
    res.querySelectorAll('.chain-btn').forEach(btn=>{
      btn.addEventListener('click',e=>{
        if(r.blob){
          e.preventDefault();
          saveChainedFile(r.blob,r.name,btn.getAttribute('href'));
        }
      });
    });
    if(r.blob){
      try{
        const list=JSON.parse(localStorage.getItem('fp_recent')||'[]');
        const tn=document.querySelector('.hero h1')?.textContent?.trim()||'File Tool';
        const next=[{n:r.name,s:out,t:Date.now(),u:window.location.pathname,tn},...list.filter(x=>x.n!==r.name)].slice(0,5);
        localStorage.setItem('fp_recent',JSON.stringify(next));
        renderRecentShelf();
      }catch(err){}
    }
    $('#sh-copy', res)?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pageUrl);
        const b = $('#sh-copy', res);
        b.textContent = '✓ Copied!';
        setTimeout(() => { b.textContent = '🔗 Copy Link'; }, 2000);
      } catch (err) {}
    });
    if (canCompare) {
      $('#btn-toggle-cmp', res)?.addEventListener('click', async () => {
        const view = $('#cmp-view', res);
        const isHidden = view.hidden;
        view.hidden = !isHidden;
        if (isHidden) {
          const origBox = $('#cmp-orig-pv', res);
          const outBox = $('#cmp-out-pv', res);
          if (isImg(files[0])) {
            origBox.innerHTML = `<img src="${URL.createObjectURL(files[0])}" alt="Original">`;
            outBox.innerHTML = `<img src="${URL.createObjectURL(r.blob)}" alt="Processed">`;
          } else if (/pdf$/i.test(files[0].name)) {
            try {
              const dpr = Math.min(2, window.devicePixelRatio || 1);
              const origDoc = await openPdfjs(await buf(files[0]));
              const origCanv = await renderPage(origDoc, 1, (240 * dpr) / (origDoc.numPages ? 400 : 300));
              origBox.innerHTML = ''; origBox.appendChild(origCanv); origDoc.destroy();
              const outDoc = await openPdfjs(await buf(r.blob));
              const outCanv = await renderPage(outDoc, 1, (240 * dpr) / (outDoc.numPages ? 400 : 300));
              outBox.innerHTML = ''; outBox.appendChild(outCanv); outDoc.destroy();
            } catch (err) {
              origBox.textContent = 'PDF Preview';
              outBox.textContent = 'PDF Preview';
            }
          }
        }
      });
    }
    if(r.view||r.links){const vw=document.createElement('div');vw.className='resview';vw.innerHTML=(r.view||'')+(r.links?`<ul class="links">${r.links.map(x=>`<li><a href="${mk(x.blob)}" download="${esc(x.name.split('/').pop())}">${esc(x.name)}</a> <small>${fmtSize(x.blob.size)}</small></li>`).join('')}</ul>`:'');res.appendChild(vw);if(r.mount)r.mount(vw);}
    $('#again',res).onclick=()=>{urls.forEach(u=>URL.revokeObjectURL(u));files=[];render();};
    res.scrollIntoView({block:'start',behavior:'smooth'});
  }catch(e){if(live&&seq!==goSeq)return;if(btn)btn.disabled=false;if(live)work.querySelectorAll('#dl,.dlx').forEach(a=>a.remove());if(live&&e&&e.soft){st.className='status';st.textContent=e.message;return;}showErr(e,live?null:()=>go());}}
window.FP={progress,T,$,esc,load,L,buf,base,pdfBlob,fmtSize,openPdfjs,renderPage,toBlob,parseRanges,zipBlobs,zipOrOne,sel,inp,v,setupPreview,mkSafe,chk,vb,TOOLS,work,root,toolId};
document.readyState==='complete'?start():document.addEventListener('DOMContentLoaded',start);
})();
// Runtime translation of tool UI strings that are hard-coded in English (exact matches + fragments)
(()=>{const R=window.I18N_RT;if(!R)return;const X=R.x||{},F=Object.entries(R.f||{}).sort((a,b)=>b[0].length-a[0].length);
const tr=s=>{if(!s||!/[A-Za-z]/.test(s))return s;const t=s.trim();if(Object.prototype.hasOwnProperty.call(X,t))return s.replace(t,X[t]);const m=t.match(/^([^A-Za-z(]*?)\s*([A-Za-z(].*?)\s*([→↻…]?)$/);if(m&&m[2]!==t&&Object.prototype.hasOwnProperty.call(X,m[2]))return s.replace(m[2],X[m[2]]);let o=s;for(const[a,b]of F)if(o.includes(a))o=o.split(a).join(b);return o;};
const skip=n=>n.closest&&n.closest('textarea,[contenteditable="true"],.ptxt,.edl,.textLayer,.vpages,script,style');
const at=['placeholder','title','aria-label','data-none'];
const walk=n=>{if(n.nodeType===3){const p=n.parentElement;if(p&&skip(p))return;const v=tr(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;return;}if(n.nodeType!==1||skip(n))return;for(const a of at){const v=n.getAttribute(a);if(v){const w=tr(v);if(w!==v)n.setAttribute(a,w);}}if(n.tagName==='INPUT'&&/^(button|submit)$/.test(n.type)&&n.value)n.value=tr(n.value);for(const c of [...n.childNodes])walk(c);};
const go=()=>{const root=document.getElementById('tool')||document.body;walk(root);new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')walk(m.target);else if(m.type==='attributes')walk(m.target);else m.addedNodes.forEach(walk);}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:at});};
for(const k of ['alert','confirm','prompt']){const o=window[k];if(o)window[k]=(m,...r)=>o.call(window,tr(String(m??'')),...r);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();})();
// Embed mode and modal generator
(()=>{
  if (typeof window !== 'undefined' && window.location) {
    if (new URLSearchParams(window.location.search).has('embed')) {
      document.body.classList.add('is-embedded');
    }
    document.addEventListener('click', e => {
      const btn = e.target.closest('#btn-embed');
      if (!btn) return;
      e.preventDefault();
      let m = document.getElementById('embed-modal');
      if (!m) {
        m = document.createElement('div');
        m.id = 'embed-modal';
        m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
        const embedUrl = location.origin + location.pathname + '?embed=true';
        const embedCode = `<iframe src="${embedUrl}" width="100%" height="520" frameborder="0" style="border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05)"></iframe>\n<p style="font-size:12px;color:#64748b;margin-top:4px">Free tools powered by <a href="https://fileopia.com/" target="_blank" rel="noopener">Fileopia</a></p>`;
        m.innerHTML = `<div style="background:#fff;border-radius:14px;padding:24px;max-width:540px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.25);position:relative">
          <h3 style="margin:0 0 8px;font-size:1.25rem;color:#1e293b">Embed this tool on your website</h3>
          <p style="font-size:0.9rem;color:#64748b;margin:0 0 14px">Copy and paste this HTML snippet into your website, blog, or CMS (WordPress, Notion, etc.). It runs 100% free with zero server load.</p>
          <textarea readonly style="width:100%;height:110px;font:13px/1.4 monospace;padding:10px;border:1px solid #cbd5e1;border-radius:8px;resize:none;box-sizing:border-box">${embedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px">
            <button type="button" class="btn ghost mini" id="btn-close-embed">Close</button>
            <button type="button" class="btn mini" id="btn-copy-embed">Copy Embed Code</button>
          </div>
        </div>`;
        document.body.appendChild(m);
        m.querySelector('#btn-close-embed').onclick = () => m.remove();
        m.onclick = ev => { if (ev.target === m) m.remove(); };
        m.querySelector('#btn-copy-embed').onclick = async () => {
          try {
            await navigator.clipboard.writeText(embedCode);
            const copyBtn = m.querySelector('#btn-copy-embed');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy Embed Code'; }, 2000);
          } catch (err) {
            m.querySelector('textarea').select();
          }
        };
      }
    });
  }
})();
