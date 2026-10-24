/* FreePDF – all processing happens in the browser. No uploads. */
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
async function openPdfjs(data,password){const pj=await L.pdfjs();return pj.getDocument({data:new Uint8Array(data.slice(0)),password}).promise;}
async function renderPage(doc,n,scale){const p=await doc.getPage(n);const vp=p.getViewport({scale});const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);await p.render({canvasContext:ctx,viewport:vp}).promise;p.cleanup();return c;}
const toBlob=(c,type,q)=>new Promise(r=>c.toBlob(r,type,q));
function parseRanges(s,max){const out=[];for(const part of s.split(/[,;\s]+/).filter(Boolean)){const m=part.match(/^(\d+)?\s*-\s*(\d+)?$|^(\d+)$/);if(!m)throw new Error('Invalid range: '+part);let a,b;if(m[3]){a=b=+m[3];}else{a=m[1]?+m[1]:1;b=m[2]?+m[2]:max;}if(a<1||b>max||a>b)throw new Error('Range out of bounds: '+part+' (1-'+max+')');const r=[];for(let i=a;i<=b;i++)r.push(i-1);out.push({label:a===b?''+a:a+'-'+b,idx:r});}return out;}
async function zipOrOne(items,zipName){return items.length===1?items[0]:{blob:await zipBlobs(items),name:zipName};}
async function zipBlobs(items){const JSZip=await L.zip();const z=new JSZip();for(const it of items)z.file(it.name,it.blob);return z.generateAsync({type:'blob'});}
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
  async function show(){box.innerHTML='';const c=await renderPage(doc,state.page,1.2);box.appendChild(c);drawMarks();}
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
async function render(){
  if(!files.length&&!nofile){work.hidden=true;drop.hidden=false;return;}
  if(drop)drop.hidden=true;work.hidden=false;
  work.innerHTML=`${nofile?'':`<ul class="files">${files.map((f,i)=>`<li><span class="nm">📄 ${esc(f.name)}</span><small>${fmtSize(f.size)}</small>${multiple&&files.length>1?`<button type="button" data-a="up" data-i="${i}" aria-label="${esc(T.moveUp)}">↑</button><button type="button" data-a="down" data-i="${i}" aria-label="${esc(T.moveDown)}">↓</button>`:''}<button type="button" data-a="rm" data-i="${i}" aria-label="${esc(T.remove)}">✕</button></li>`).join('')}</ul>`}
  ${multiple?`<p style="text-align:center;margin:0 0 12px"><button type="button" class="btn ghost" id="addmore">+ ${esc(T.select)}</button></p>`:''}
  <div class="opts">${tool.opts?tool.opts.call(tool):''}</div><div class="custom"></div>
  <div class="actions"><button type="button" class="btn big" id="go">${esc(tool.goLabel?tool.goLabel():T.process)}</button></div><p class="status" role="status" aria-live="polite"></p>`;
  work.querySelectorAll('.files [data-a]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,a=b.dataset.a;if(a==='rm')files.splice(i,1);else{const j=a==='up'?i-1:i+1;if(j<0||j>=files.length)return;[files[i],files[j]]=[files[j],files[i]];}render();});
  $('#addmore',work)?.addEventListener('click',()=>input.click());
  $('#go',work).onclick=go;if(tool.minFiles&&files.length<tool.minFiles){$('#go',work).disabled=true;$('.status',work).textContent=tool.minMsg||'';}
  if(tool.setup){try{const el=await tool.setup(files);if(el)$('.custom',work).appendChild(el);}catch(e){showErr(e);}}
}
function showErr(e){console.error(e);const s=$('.status',work)||(()=>{work.hidden=false;const p=document.createElement('p');p.className='status';work.appendChild(p);return p;})();s.className='status err';let m=e&&e.message||String(e);if(/encrypt|password/i.test(m)&&toolId!=='unlock'&&/pdf/.test(toolId))m+=' — try the Unlock PDF tool first.';s.textContent=`${T.error} ${m}`;}
async function go(){const btn=$('#go',work),st=$('.status',work);btn.disabled=true;st.className='status';st.textContent=T.working;
  try{const r=await tool.run.call(tool,files,m=>st.textContent=m);window.__lastResult=r;const urls=[];const mk=b=>{const u=URL.createObjectURL(b);urls.push(u);return u;};
   $('.actions',work).innerHTML=`${r.blob?`<a class="btn big" id="dl" href="${mk(r.blob)}" download="${esc(r.name)}">⬇ ${esc(T.download)}</a>`:''}${(r.extra||[]).map((x,k)=>`<a class="btn ghost dlx" id="dl${k+2}" href="${mk(x.blob)}" download="${esc(x.name)}">⬇ ${esc(x.label||x.name)}</a>`).join('')}<button type="button" class="btn ghost" id="again">${esc(T.another)}</button>`;
   st.textContent=`${T.done} ${r.blob?r.name+' · '+fmtSize(r.blob.size):''}${r.info?' · '+r.info:''}`;
   if(r.view||r.links){const vw=document.createElement('div');vw.className='resview';vw.innerHTML=(r.view||'')+(r.links?`<ul class="links">${r.links.map(x=>`<li><a href="${mk(x.blob)}" download="${esc(x.name.split('/').pop())}">${esc(x.name)}</a> <small>${fmtSize(x.blob.size)}</small></li>`).join('')}</ul>`:'');work.appendChild(vw);if(r.mount)r.mount(vw);}
   $('#again',work).onclick=()=>{urls.forEach(u=>URL.revokeObjectURL(u));files=[];render();};
  }catch(e){btn.disabled=false;showErr(e);}}
window.FP={T,$,esc,load,L,buf,base,pdfBlob,fmtSize,openPdfjs,renderPage,toBlob,parseRanges,zipBlobs,zipOrOne,sel,inp,v,setupPreview,mkSafe,chk,vb,TOOLS,work,root,toolId};
document.readyState==='complete'?start():document.addEventListener('DOMContentLoaded',start);
})();
