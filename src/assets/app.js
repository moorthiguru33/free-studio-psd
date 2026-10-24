/* FreePDF – all processing happens in the browser. No uploads. */
(()=>{'use strict';
const T=window.I18N||{};const $=(s,r=document)=>r.querySelector(s);
const root=$('#tool');if(!root)return;
const toolId=root.dataset.tool,multiple=root.dataset.multiple==='true';
const work=$('.work',root),drop=$('.drop',root),input=$('input[type=file]',root);
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
async function zipBlobs(items){const JSZip=await L.zip();const z=new JSZip();for(const it of items)z.file(it.name,it.blob);return z.generateAsync({type:'blob'});}
// helper: select element
const sel=(id,label,opts)=>`<label>${esc(label)}<select id="${id}">${opts.map(o=>`<option value="${o[0]}">${esc(o[1])}</option>`).join('')}</select></label>`;
const inp=(id,label,type='text',val='',extra='')=>`<label>${esc(label)}<input id="${id}" type="${type}" value="${esc(val)}" ${extra}></label>`;
const v=id=>$('#'+id,work)?.value;

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
const TOOLS={
 merge:{async run(files){const {PDFDocument}=await L.pdflib();const out=await PDFDocument.create();for(const f of files){const src=await PDFDocument.load(await buf(f),{ignoreEncryption:false});const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p));}return {blob:pdfBlob(await out.save()),name:'merged.pdf'};}},
 split:{opts:()=>inp('ranges',T.o_ranges,'text','','placeholder="1-3,5"'),
  async run([f]){const {PDFDocument}=await L.pdflib();const src=await PDFDocument.load(await buf(f));const n=src.getPageCount();const ranges=(v('ranges')||'').trim()?parseRanges(v('ranges'),n):Array.from({length:n},(_,i)=>({label:''+(i+1),idx:[i]}));const items=[];for(const r of ranges){const d=await PDFDocument.create();(await d.copyPages(src,r.idx)).forEach(p=>d.addPage(p));items.push({name:`${base(f.name)}-${r.label}.pdf`,blob:pdfBlob(await d.save())});}if(items.length===1)return items[0];return {blob:await zipBlobs(items),name:base(f.name)+'-split.zip'};}},
 rotate:{opts:()=>sel('angle',T.o_angle,[['90','90° ⟳'],['180','180°'],['270','270° ⟲']]),
  async run(files){const {PDFDocument,degrees}=await L.pdflib();const a=+v('angle');const items=[];for(const f of files){const d=await PDFDocument.load(await buf(f));d.getPages().forEach(p=>p.setRotation(degrees((p.getRotation().angle+a)%360)));items.push({name:base(f.name)+'-rotated.pdf',blob:pdfBlob(await d.save())});}return items.length===1?items[0]:{blob:await zipBlobs(items),name:'rotated.zip'};}},
 pagenumbers:{opts:()=>sel('pos',T.o_position,[['bc','↓ ·'],['br','↓ →'],['bl','↓ ←'],['tc','↑ ·'],['tr','↑ →'],['tl','↑ ←']])+inp('start',T.o_start,'number','1','min="0"')+sel('fmt',T.o_format,[['n','1'],['nt','1 / N'],['pn','Page 1'],['pnt','Page 1 of N']])+inp('fs',T.o_size,'number','11','min="6" max="48"'),
  async run([f]){const {PDFDocument,StandardFonts,rgb}=await L.pdflib();const d=await PDFDocument.load(await buf(f));const font=await d.embedFont(StandardFonts.Helvetica);const pages=d.getPages(),N=pages.length,st=+v('start')||0,pos=v('pos'),fs=+v('fs')||11,fmt=v('fmt');
   pages.forEach((p,i)=>{const n=st+i,tot=st+N-1;const txt=fmt==='nt'?`${n} / ${tot}`:fmt==='pn'?`Page ${n}`:fmt==='pnt'?`Page ${n} of ${tot}`:`${n}`;const {x:bx,y:by,width:w,height:h}=p.getCropBox();const tw=font.widthOfTextAtSize(txt,fs),m=24;
    const x=bx+(pos[1]==='c'?(w-tw)/2:pos[1]==='r'?w-tw-m:m);const y=by+(pos[0]==='b'?m:h-m-fs);p.drawText(txt,{x,y,size:fs,font,color:rgb(.15,.15,.15)});});
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-numbered.pdf'};}},
 jpg2pdf:{opts:()=>sel('psize',T.o_pagesize,[['fit',T.o_fit],['a4','A4'],['letter','US Letter']])+sel('margin',T.o_margin,[['0','0'],['20','20 pt'],['40','40 pt']]),
  async run(files){const {PDFDocument}=await L.pdflib();const d=await PDFDocument.create();const ps=v('psize'),mg=+v('margin');
   for(const f of files){let bytes=new Uint8Array(await buf(f)),img;const isPng=bytes[0]===0x89&&bytes[1]===0x50,isJpg=bytes[0]===0xFF&&bytes[1]===0xD8;
    if(isJpg)img=await d.embedJpg(bytes);else if(isPng)img=await d.embedPng(bytes);else{const bm=await createImageBitmap(f);const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0);img=await d.embedJpg(new Uint8Array(await (await toBlob(c,'image/jpeg',.92)).arrayBuffer()));}
    let W,H;if(ps==='fit'){W=img.width+2*mg;H=img.height+2*mg;}else{[W,H]=ps==='a4'?[595.28,841.89]:[612,792];if(img.width>img.height)[W,H]=[H,W];}
    const s=Math.min((W-2*mg)/img.width,(H-2*mg)/img.height);const w=img.width*s,h=img.height*s;const p=d.addPage([W,H]);p.drawImage(img,{x:(W-w)/2,y:(H-h)/2,width:w,height:h});}
   return {blob:pdfBlob(await d.save()),name:(files.length===1?base(files[0].name):'images')+'.pdf'};}},
 pdf2jpg:{opts:()=>sel('ifmt',T.o_format,[['jpg','JPG'],['png','PNG']])+sel('scale',T.o_scale,[['2','2x (144 DPI)'],['1','1x (72 DPI)'],['3','3x (216 DPI)']]),
  async run([f],status){const doc=await openPdfjs(await buf(f));const png=v('ifmt')==='png',sc=+v('scale');const items=[];for(let i=1;i<=doc.numPages;i++){status(`${T.working} ${i}/${doc.numPages}`);const c=await renderPage(doc,i,sc);items.push({name:`${base(f.name)}-${i}.${png?'png':'jpg'}`,blob:await toBlob(c,png?'image/png':'image/jpeg',.9)});c.width=c.height=0;}
   return items.length===1?items[0]:{blob:await zipBlobs(items),name:base(f.name)+'-images.zip'};}},
 compress:{opts:()=>sel('level',T.o_level,[['lossless',T.o_lossless],['strong',T.o_strong],['extreme',T.o_strong+' −−']]),
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);let out;const lvl=v('level');
   if(lvl==='lossless'){const d=await PDFDocument.load(data);d.setProducer('');d.setCreator('');out=await d.save({useObjectStreams:true});}
   else{const doc=await openPdfjs(data);const d=await PDFDocument.create();const [sc,q]=lvl==='strong'?[1.5,.65]:[1,.45];for(let i=1;i<=doc.numPages;i++){status(`${T.working} ${i}/${doc.numPages}`);const pg=await doc.getPage(i);const vp=pg.getViewport({scale:1});const c=await renderPage(doc,i,sc);const img=await d.embedJpg(new Uint8Array(await (await toBlob(c,'image/jpeg',q)).arrayBuffer()));c.width=c.height=0;const p=d.addPage([vp.width,vp.height]);p.drawImage(img,{x:0,y:0,width:vp.width,height:vp.height});}out=await d.save({useObjectStreams:true});}
   let note;if(out.byteLength>=data.byteLength){out=new Uint8Array(data);note='Already optimized — original kept.';}
   const pct=Math.round(100-out.byteLength/data.byteLength*100);return {blob:pdfBlob(out),name:base(f.name)+'-compressed.pdf',info:`${fmtSize(data.byteLength)} → ${fmtSize(out.byteLength)} (−${pct}%)${note?' · '+note:''}`};}},
 protect:{opts:()=>inp('pw',T.o_password,'password','','autocomplete="new-password"')+inp('pw2',T.o_password2,'password','','autocomplete="new-password"'),
  async run([f]){if(!v('pw'))throw new Error(T.o_password+'?');if(v('pw')!==v('pw2'))throw new Error(T.o_mismatch);const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(f));d.encrypt({userPassword:v('pw'),ownerPassword:v('pw')});return {blob:pdfBlob(await d.save()),name:base(f.name)+'-protected.pdf'};}},
 unlock:{opts:()=>inp('pw',T.o_password,'password','','autocomplete="current-password"'),
  async run([f]){const {PDFDocument}=await L.pdflib();const s=await PDFDocument.load(await buf(f),{password:v('pw')||''});const d=await PDFDocument.create();(await d.copyPages(s,s.getPageIndices())).forEach(p=>d.addPage(p));try{d.setTitle(s.getTitle()||'');}catch(e){}return {blob:pdfBlob(await d.save()),name:base(f.name)+'-unlocked.pdf'};}},
 sign:{async setup(files){
   const wrap=document.createElement('div');wrap.innerHTML=`<div class="opts"><div class="sigbox" style="display:flex;flex-direction:column;gap:4px;font-weight:600">${esc(T.o_drawSig)}<canvas class="sigpad" width="840" height="300"></canvas><button type="button" class="btn ghost" id="sigclr" style="margin-top:6px;align-self:flex-start">${esc(T.o_clear)}</button></div>${inp('sigtxt',T.o_typeSig)}${inp('sigw','Width (%)','number','25','min="5" max="90"')}</div>`;
   const pad=$('.sigpad',wrap),ctx=pad.getContext('2d');ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#0b2a6f';let drawing=false,dirty=false;
   const pt=e=>{const r=pad.getBoundingClientRect();return [(e.clientX-r.left)*pad.width/r.width,(e.clientY-r.top)*pad.height/r.height];};
   pad.addEventListener('pointerdown',e=>{drawing=true;dirty=true;pad.setPointerCapture(e.pointerId);ctx.beginPath();ctx.moveTo(...pt(e));});pad.addEventListener('pointermove',e=>{if(!drawing)return;ctx.lineTo(...pt(e));ctx.stroke();});pad.addEventListener('pointerup',()=>drawing=false);
   $('#sigclr',wrap).onclick=()=>{ctx.clearRect(0,0,pad.width,pad.height);dirty=false;};
   this.sig=()=>{if(dirty)return pad;const t=$('#sigtxt',wrap).value.trim();if(!t)return null;const c=document.createElement('canvas');c.width=900;c.height=220;const x=c.getContext('2d');x.font='italic 120px "Segoe Script","Brush Script MT","Lucida Handwriting",cursive';x.fillStyle='#0b2a6f';x.textBaseline='middle';const w=Math.min(880,x.measureText(t).width);x.fillText(t,10,110,880);const o=document.createElement('canvas');o.width=w+20;o.height=220;o.getContext('2d').drawImage(c,0,0);return o;};
   const pv=await setupPreview(files[0],(page,fx,fy)=>{const fw=(+$('#sigw',wrap).value||25)/100;const s=this.sig();if(!s){alert(T.o_drawSig);return null;}const fh=fw*s.height/s.width*(this.pageAR||1.414)**-1;this.marks=[{page,fx,fy,fw,fh,label:'✍'}];pv.state.marks=[];return this.marks[0];});
   this.pv=pv;wrap.appendChild(pv.el);return wrap;},
  async run([f]){const s=this.sig();if(!s)throw new Error(T.o_drawSig);if(!this.marks?.length)throw new Error(T.o_clickPlace);const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(f));
   // trim transparent edges
   const png=await d.embedPng(new Uint8Array(await (await toBlob(s,'image/png')).arrayBuffer()));
   for(const m of this.marks){const p=d.getPage(m.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();const w=m.fw*W,h=w*s.height/s.width;p.drawImage(png,{x:bx+m.fx*W,y:by+H-m.fy*H-h,width:w,height:h});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-signed.pdf'};}},
 edit:{async setup(files){
   const wrap=document.createElement('div');wrap.innerHTML=`<div class="opts">${sel('emode',T.o_mode,[['text',T.o_addText],['white',T.o_whiteout]])}${inp('etxt',T.o_text,'text','')}${inp('efs',T.o_size,'number','14','min="6" max="72"')}<label>Color<input id="ecol" type="color" value="#000000"></label></div>`;
   this.items=[];
   const pv=await setupPreview(files[0],(page,fx,fy,r)=>{const mode=v('emode'),fs=+v('efs')||14;if(mode==='text'){const t=v('etxt');if(!t){$('#etxt',wrap).focus();return null;}const it={type:'text',page,fx,fy,text:t,fs,color:v('ecol'),label:t,fw:0.001,fh:0.001};this.items.push(it);return it;}
     const it={type:'white',page,fx:fx-0.08,fy:fy-0.015,fw:0.16,fh:0.03,label:''};this.items.push(it);return it;});
   wrap.appendChild(pv.el);return wrap;},
  async run([f]){if(!this.items.length)throw new Error(T.o_clickPlace);const {PDFDocument,StandardFonts,rgb}=await L.pdflib();const d=await PDFDocument.load(await buf(f));const font=await d.embedFont(StandardFonts.Helvetica);const safe=mkSafe(font);
   for(const it of this.items){const p=d.getPage(it.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();
    if(it.type==='white')p.drawRectangle({x:bx+it.fx*W,y:by+H-(it.fy+it.fh)*H,width:it.fw*W,height:it.fh*H,color:rgb(1,1,1)});
    else{const c=it.color.match(/\w\w/g).map(h=>parseInt(h,16)/255);p.drawText(safe(it.text),{x:bx+it.fx*W,y:by+H-it.fy*H-it.fs*0.8,size:it.fs,font,color:rgb(...c)});}}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-edited.pdf'};}},
 pdf2word:{async run([f],status){const doc=await openPdfjs(await buf(f));const JSZip=await L.zip();const X=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');let body='';
   for(let i=1;i<=doc.numPages;i++){status(`${T.working} ${i}/${doc.numPages}`);const pg=await doc.getPage(i);const tc=await pg.getTextContent();
    const lines=[];let cur=null;for(const it of tc.items){if(!('str' in it))continue;const y=it.transform[5],h=Math.abs(it.transform[3])||10;if(!cur||Math.abs(cur.y-y)>h*0.5){cur={y,h,t:''};lines.push(cur);}cur.t+=it.str;if(it.hasEOL){cur=null;}}
    const paras=[];let p=null,prevY=null;for(const ln of lines){if(!ln.t.trim()){p=null;continue;}if(p&&prevY!==null&&Math.abs(prevY-ln.y)<ln.h*1.8){p.t+=' '+ln.t.trim();}else{p={t:ln.t.trim(),h:ln.h};paras.push(p);}prevY=ln.y;}
    for(const q of paras){const sz=Math.max(16,Math.min(64,Math.round(q.h*2)));body+=`<w:p><w:r><w:rPr><w:sz w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${X(q.t)}</w:t></w:r></w:p>`;}
    if(i<doc.numPages)body+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';}
   const z=new JSZip();z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
   z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
   z.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`);
   return {blob:await z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),name:base(f.name)+'.docx'};}},
 word2pdf:{async run([f]){const mammoth=await L.mammoth();const {value:html}=await mammoth.convertToHtml({arrayBuffer:await buf(f)});const {PDFDocument,StandardFonts,rgb}=await L.pdflib();const d=await PDFDocument.create();
   const F={r:await d.embedFont(StandardFonts.Helvetica),b:await d.embedFont(StandardFonts.HelveticaBold),i:await d.embedFont(StandardFonts.HelveticaOblique),bi:await d.embedFont(StandardFonts.HelveticaBoldOblique)};const safe=mkSafe(F.r);
   const W=595.28,H=841.89,M=56;let page=d.addPage([W,H]),y=H-M;const newPage=()=>{page=d.addPage([W,H]);y=H-M;};
   const dom=new DOMParser().parseFromString(`<div>${html}</div>`,'text/html').body.firstChild;
   const runs=(node,st={b:false,i:false},acc=[])=>{for(const n of node.childNodes){if(n.nodeType===3)acc.push({t:n.textContent,...st});else if(n.nodeType===1){const tg=n.tagName;if(tg==='BR'){acc.push({br:true});continue;}runs(n,{b:st.b||tg==='STRONG'||tg==='B',i:st.i||tg==='EM'||tg==='I'},acc);}}return acc;};
   const block=(el,size,indent,prefix,forceBold)=>{const rs=runs(el);if(prefix)rs.unshift({t:prefix,b:false,i:false});const lh=size*1.35;const maxW=W-2*M-indent;let line=[],lw=0;
    const flush=()=>{if(y-lh<M)newPage();y-=lh;let x=M+indent;for(const w of line){page.drawText(w.t,{x,y,size,font:w.f,color:rgb(.1,.1,.1)});x+=w.f.widthOfTextAtSize(w.t,size);}line=[];lw=0;};
    for(const r of rs){if(r.br){flush();continue;}const f=F[(r.b||forceBold?'b':'')+(r.i?'i':'')||'r'];for(const tok of safe(r.t).split(/(\s+)/)){if(!tok)continue;const t=/^\s+$/.test(tok)?' ':tok;const tw=f.widthOfTextAtSize(t,size);if(lw+tw>maxW&&line.length&&t!==' '){flush();}if(!line.length&&t===' ')continue;line.push({t,f});lw+=tw;}}
    if(line.length)flush();y-=size*0.5;};
   const walk=(node,depth=0)=>{for(const el of node.children){const tg=el.tagName;if(/^H[1-6]$/.test(tg)){const s=[22,18,15,13,12,11][+tg[1]-1];y-=s*0.4;block(el,s,0,'',true);}else if(tg==='P')block(el,11,0,'');else if(tg==='UL'||tg==='OL'){let k=1;for(const li of el.children){const sub=[...li.children].filter(c=>c.tagName==='UL'||c.tagName==='OL');sub.forEach(s=>s.remove());block(li,11,18+depth*18,tg==='OL'?`${k++}. `:'• ');sub.forEach(s=>walk({children:[s]},depth+1));}}else if(tg==='TABLE'){for(const tr of el.querySelectorAll('tr')){const p=document.createElement('p');p.textContent=[...tr.children].map(c=>c.textContent.trim()).join('   |   ');block(p,10,0,'');}}else walk(el,depth);}};
   walk(dom);return {blob:pdfBlob(await d.save()),name:base(f.name)+'.pdf'};}}
};
/*__EXTRA__*/
// Replace characters the standard font cannot encode
function mkSafe(font){const cache={};const ok=ch=>{if(ch in cache)return cache[ch];try{font.encodeText(ch);cache[ch]=true;}catch(e){cache[ch]=false;}return cache[ch];};
 const map={'\u2018':"'",'\u2019':"'",'\u201C':'"','\u201D':'"','\u2013':'-','\u2014':'-','\u2026':'...','\u00A0':' ','\t':' '};
 return s=>[...String(s)].map(c=>map[c]??c).map(c=>c.length>1?c:ok(c)?c:'?').join('').replace(/[\r\n]+/g,' ');}

// --- UI ---
let files=[];const tool=TOOLS[toolId];tool.preset=root.dataset.preset||'';
function addFiles(list){const arr=[...list];if(!arr.length)return;files=multiple?files.concat(arr):[arr[0]];render();}
input.addEventListener('change',()=>{addFiles(input.files);input.value='';});
['dragenter','dragover'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
drop.addEventListener('drop',ev=>addFiles(ev.dataTransfer.files));
async function render(){
  if(!files.length){work.hidden=true;drop.hidden=false;return;}
  drop.hidden=true;work.hidden=false;
  work.innerHTML=`<ul class="files">${files.map((f,i)=>`<li><span class="nm">📄 ${esc(f.name)}</span><small>${fmtSize(f.size)}</small>${multiple&&files.length>1?`<button type="button" data-a="up" data-i="${i}" aria-label="${esc(T.moveUp)}">↑</button><button type="button" data-a="down" data-i="${i}" aria-label="${esc(T.moveDown)}">↓</button>`:''}<button type="button" data-a="rm" data-i="${i}" aria-label="${esc(T.remove)}">✕</button></li>`).join('')}</ul>
  ${multiple?`<p style="text-align:center;margin:0 0 12px"><button type="button" class="btn ghost" id="addmore">+ ${esc(T.select)}</button></p>`:''}
  <div class="opts">${tool.opts?tool.opts.call(tool):''}</div><div class="custom"></div>
  <div class="actions"><button type="button" class="btn big" id="go">${esc(T.process)}</button></div><p class="status" role="status" aria-live="polite"></p>`;
  work.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,a=b.dataset.a;if(a==='rm')files.splice(i,1);else{const j=a==='up'?i-1:i+1;if(j<0||j>=files.length)return;[files[i],files[j]]=[files[j],files[i]];}render();});
  $('#addmore',work)?.addEventListener('click',()=>input.click());
  $('#go',work).onclick=go;if(tool.minFiles&&files.length<tool.minFiles){$('#go',work).disabled=true;$('.status',work).textContent=tool.minMsg||'';}
  if(tool.setup){try{const el=await tool.setup(files);$('.custom',work).appendChild(el);}catch(e){showErr(e);}}
}
function showErr(e){console.error(e);const s=$('.status',work);s.className='status err';let m=e&&e.message||String(e);if(/encrypt|password/i.test(m)&&toolId!=='unlock')m+=' — try the Unlock PDF tool first.';s.textContent=`${T.error} ${m}`;}
async function go(){const btn=$('#go',work),st=$('.status',work);btn.disabled=true;st.className='status';st.textContent=T.working;
  try{const r=await tool.run.call(tool,files,m=>st.textContent=m);const u=URL.createObjectURL(r.blob);window.__lastResult=r;
   $('.actions',work).innerHTML=`<a class="btn big" id="dl" href="${u}" download="${esc(r.name)}">⬇ ${esc(T.download)}</a><button type="button" class="btn ghost" id="again">${esc(T.another)}</button>`;
   st.textContent=`${T.done} ${r.name} · ${fmtSize(r.blob.size)}${r.info?' · '+r.info:''}`;
   if(r.view){const vw=document.createElement('div');vw.className='resview';vw.innerHTML=r.view;work.appendChild(vw);}
   $('#again',work).onclick=()=>{URL.revokeObjectURL(u);files=[];render();};
  }catch(e){btn.disabled=false;showErr(e);}}
})();
