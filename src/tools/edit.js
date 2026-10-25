// @needs pdfx
// Visual PDF editor: fit-width page, click to add text, white-out, image/signature, drag/resize, undo, multi-page.
const ED_FONTS=[['sans','Sans (Helvetica)'],['serif','Serif (Times)'],['mono','Mono (Courier)']];
const ED_CSS={sans:'Helvetica,Arial,"Noto Sans",sans-serif',serif:'"Times New Roman",Times,serif',mono:'"Courier New",Courier,monospace'};

const edFont=(name,fo)=>{const n=String(name||'').replace(/^[A-Z]{6}\+/,'').toLowerCase();return {font:/courier|mono|cousine|consol/.test(n)?'mono':/times|serif|roman|georgia|garamond|tinos|cambria|book|minion/.test(n)&&!/sans/.test(n)?'serif':'sans',bold:/bold|black|heavy|semibold|demi/.test(n)||!!(fo&&(fo.bold||fo.black)),italic:/italic|oblique/.test(n)||!!(fo&&fo.italic)};};
const edHex=c=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
// sample background (ring median) and ink colour inside a canvas-pixel box
function edSample(ctx,x0,y0,x1,y1){const W=ctx.canvas.width,H=ctx.canvas.height;x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(W-1,Math.ceil(x1));y1=Math.min(H-1,Math.ceil(y1));if(x1<=x0||y1<=y0)return {bg:'#ffffff',ink:'#000000'};
 const d=ctx.getImageData(x0,y0,x1-x0+1,y1-y0+1).data,w=x1-x0+1,h=y1-y0+1;const ring=[];for(let x=0;x<w;x++)ring.push(x*4,((h-1)*w+x)*4);for(let y=0;y<h;y++)ring.push(y*w*4,(y*w+w-1)*4);
 const bg=[0,1,2].map(k=>{const a=ring.map(i=>d[i+k]).sort((m,n)=>m-n);return a[a.length>>1];});let mx=0;const px=[];
 for(let i=0;i<d.length;i+=4){const q=Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2]);if(q>40){px.push([q,i]);if(q>mx)mx=q;}}
 const sel=px.filter(p=>p[0]>=mx*0.75);const ink=sel.length?[0,1,2].map(k=>sel.reduce((a,p)=>a+d[p[1]+k],0)/sel.length).map(v=>v<40?0:v>235?255:v):[0,0,0];return {bg:edHex(bg),ink:edHex(ink)};}
let edOcrW=null;const edOcr=async()=>{if(edOcrW)return edOcrW;await load('tesseract/tesseract.min.js');edOcrW=await window.Tesseract.createWorker('eng',1,{workerPath:location.origin+'/vendor/tesseract/worker.min.js',corePath:location.origin+'/vendor/tesseract/',langPath:location.origin+'/models/tessdata',gzip:false});return edOcrW;};
// existing text lines of a page (PDF text layer, or OCR when the page is an image), in view-fraction units
async function edLines(doc,n,useOcr,status,force){const pg=await doc.getPage(n);const vp1=pg.getViewport({scale:1});const VW=vp1.width,VH=vp1.height;const sc=Math.min(2,Math.sqrt(6e6/(VW*VH)));const vp=pg.getViewport({scale:sc});
 const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);const ctx=c.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);await pg.render({canvasContext:ctx,viewport:vp}).promise;
 const tc=await pg.getTextContent();const U=window.pdfjsLib.Util;const its=[];
 for(const it of tc.items){if(!it.str||!it.str.trim()&&!it.str)continue;const t=U.transform(vp1.transform,it.transform);const size=Math.hypot(t[2],t[3]);if(size<2||Math.abs(t[1])>Math.abs(t[0])+0.01)continue;let fo=null;try{fo=pg.commonObjs.get(it.fontName);}catch(e){}const st=tc.styles[it.fontName]||{};
  its.push({str:it.str,x:t[4],y:t[5],w:it.width,size,asc:Math.min(1,Math.max(0.6,st.ascent||0.85)),...edFont(fo&&fo.name||st.fontFamily,fo)});}
 let lines=[];const chars=its.reduce((a,x)=>a+x.str.trim().length,0);let ocr=false;
 if((chars>=10||!useOcr)&&!force){its.sort((a,b)=>a.y-b.y||a.x-b.x);const rows=[];for(const it of its){let r=rows.find(r=>Math.abs(r.y-it.y)<Math.min(r.size,it.size)*0.35);if(!r){r={y:it.y,size:it.size,items:[]};rows.push(r);}r.items.push(it);}
  for(const r of rows){r.items.sort((a,b)=>a.x-b.x);let cur=null;for(const it of r.items){const gap=cur?it.x-(cur.x+cur.w):0;if(!cur||gap>Math.max(it.size,cur.size)*1.5||Math.abs(it.size-cur.size)>cur.size*0.25){cur={x:it.x,base:it.y,w:0,size:it.size,asc:it.asc,text:'',font:it.font,bold:it.bold,italic:it.italic};lines.push(cur);}
   if(cur.text&&gap>it.size*0.12&&!/\s$/.test(cur.text)&&!/^\s/.test(it.str))cur.text+=' ';cur.text+=it.str;cur.w=Math.max(cur.w,it.x+it.w-cur.x);}}}
 else{status&&status('Detecting text in the image (OCR)…');const w=await edOcr();const r=await w.recognize(c,{},{text:true,tsv:true});ocr=true;const L={};
  for(const q of r.data.tsv.split('\n').slice(1).map(l=>l.split('\t'))){if(q.length<12||q[0]!=='5'||!q[11].trim()||+q[10]<55)continue;const k=q.slice(1,5).join('.');(L[k]=L[k]||[]).push({x:+q[6],y:+q[7],w:+q[8],h:+q[9],t:q[11]});}
  for(const ws of Object.values(L)){const bots=ws.map(w=>w.y+w.h).sort((a,b)=>a-b);const base=bots[Math.floor((bots.length-1)*0.2)];const top=Math.min(...ws.map(w=>w.y));if((base-top)>c.height*0.12)continue;const x0=Math.min(...ws.map(w=>w.x)),x1=Math.max(...ws.map(w=>w.x+w.w));
   lines.push({x:x0/sc,base:base/sc,w:(x1-x0)/sc,size:Math.max(4,(base-top)/0.72/sc),asc:0.78,text:ws.map(w=>w.t).join(' '),font:'sans',bold:false,italic:false,ocrBot:Math.max(...ws.map(w=>w.y+w.h))/sc});}}
 lines=lines.filter(l=>l.text.trim());
 for(const l of lines){const top=l.base-l.size*l.asc-1,bot=Math.max(l.base+l.size*0.25,l.ocrBot||0)+1;const sm=edSample(ctx,(l.x-1)*sc,top*sc,(l.x+l.w+1)*sc,bot*sc);l.color=sm.ink;l.bg=sm.bg;l.text=l.text.replace(/\s+/g,' ').trim();
  l.cov={fx:(l.x-1.5)/VW,fy:(top-0.5)/VH,fw:(l.w+3)/VW,fh:(bot-top+1)/VH};l.fx=l.x/VW;l.fy=(l.base-l.size*0.97)/VH;l.fs=Math.round(l.size*2)/2;}
 c.width=0;return {lines,ocr};}
TOOLS.edit={noAdv:true,
 async setup(files){const S=this;S.items=[];S.imgs={};S.hist=[];S.src={};let uid=1;
  const doc=await openPdfjs(await buf(files[0]));const N=doc.numPages;S.dims=[];
  const w=document.createElement('div');w.className='ped';
  w.innerHTML=`<div class="ptb" role="toolbar">
   <div class="pmodes"><button type="button" data-m="edit" class="on">✎ ${esc(T.o_editExisting||"Edit existing text")}</button><button type="button" data-m="text">T ${esc(T.o_addText||'Add text')}</button><button type="button" data-m="white">▭ ${esc(T.o_whiteout||'White-out')}</button><button type="button" data-m="move">✥ ${esc(T.o_select||'Select / move')}</button><button type="button" id="pimg">🖼 ${esc(T.o_image||'Image')}</button><button type="button" id="psig">✍ ${esc(T.o_signature||'Signature')}</button><input type="file" id="pimgf" accept="image/*" hidden></div>
   <div class="pfmt"><select id="pfont" aria-label="Font">${ED_FONTS.map(f=>`<option value="${f[0]}">${f[1]}</option>`).join('')}</select><input id="psize" type="number" min="4" max="200" value="14" aria-label="Font size" title="Font size (pt)"><input id="pcol" type="color" value="#000000" aria-label="Text color"><button type="button" id="pb" aria-pressed="false" title="Bold"><b>B</b></button><button type="button" id="pi" aria-pressed="false" title="Italic"><i>I</i></button><button type="button" id="pdel" title="Delete selected">🗑</button><button type="button" id="pundo" title="Undo">↶</button></div></div>
   <div class="pfr"><input id="pfind" placeholder="Find"><input id="prepl" placeholder="Replace with"><button type="button" id="pfrb">Replace all</button><button type="button" id="pocr" title="Recognise text in images on this page">🔍 OCR this page</button></div><p class="hint" id="phint"></p>
   <div class="pnav"><button type="button" id="pprev" aria-label="Previous page">‹</button><span id="pnum"></span><button type="button" id="pnext" aria-label="Next page">›</button></div>
   <div class="pstage"><div class="ppage"><canvas></canvas><div class="play"></div></div></div>`;
  const q=s=>w.querySelector(s),stage=q('.pstage'),pg=q('.ppage'),cv=q('canvas'),lay=q('.play');
  let page=1,mode='edit',selId=null,pxpt=1,busy=0;
  const hint=()=>{const n=S.items.filter(x=>x.type!=='text'||x.text.trim()||x.cov).length;const go=document.querySelector('#go');if(go)go.disabled=!n;
   q('#phint').textContent=n?`${n} edit(s) added. Drag to move, corner ● to resize. Press Start when done.`:mode==='white'?'Drag on the page to cover something with a white box.':mode==='move'?'Tap an item to select it, drag to move.':mode==='edit'?'Tap any existing text on the page to edit it (scanned pages are read with OCR automatically).':'Tap/click anywhere on the page to add text there, then type. Start unlocks after your first edit.';};
  S._hint=hint;
  const snap=()=>{S.hist.push(JSON.stringify(S.items));if(S.hist.length>100)S.hist.shift();};
  const convert=(pg,k,text)=>{const l=S.src[pg][k];snap();const it={id:uid++,type:'text',page:pg,srcK:k,fx:l.fx,fy:l.fy,text:text??l.text,orig:l.text,fs:l.fs,color:l.color,font:l.font,bold:l.bold,italic:l.italic,cov:{...l.cov,bg:l.bg}};S.items.push(it);return it;};
  async function loadSrc(pg){if(S.src[pg])return;const r=await edLines(doc,pg,true,m=>q('#phint').textContent=m);S.src[pg]=r.lines;if(r.ocr&&pg===page)setTimeout(()=>q('#phint').textContent=`Image-only page: OCR found ${r.lines.length} text line(s). Tap one to edit, drag ✥ to move.`,0);}
  async function edLinesOcr(pg){const r=await edLines(doc,pg,true,m=>q('#phint').textContent=m,true);return r.lines;}
  const cur=()=>S.items.find(x=>x.id===selId);
  async function show(){const my=++busy;const p=await doc.getPage(page);const vp1=p.getViewport({scale:1});S.dims[page]={w:vp1.width,h:vp1.height};
   const cssW=Math.max(260,Math.min(stage.clientWidth||document.querySelector('#tool .custom')?.clientWidth||800,1100));const dpr=Math.min(2,window.devicePixelRatio||1);let sc=cssW*dpr/vp1.width;const maxPx=14e6;if(vp1.width*vp1.height*sc*sc>maxPx)sc=Math.sqrt(maxPx/(vp1.width*vp1.height));
   const vp=p.getViewport({scale:sc});const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);await p.render({canvasContext:ctx,viewport:vp}).promise;
   if(my!==busy)return;cv.width=c.width;cv.height=c.height;cv.getContext('2d').drawImage(c,0,0);c.width=0;
   pg.style.width=cssW+'px';pg.style.aspectRatio=vp1.width+'/'+vp1.height;pxpt=cssW/vp1.width;q('#pnum').textContent=`${T.o_page||'Page'} ${page} / ${N}`;q('#pprev').disabled=page<=1;q('#pnext').disabled=page>=N;draw();if(!S.src[page]){const pp=page;loadSrc(pp).then(()=>{if(page===pp)draw();}).catch(e=>console.warn(e));}}
  function styleText(el,it){el.style.fontSize=it.fs*pxpt+'px';el.style.color=it.color;el.style.fontFamily=ED_CSS[it.font];el.style.fontWeight=it.bold?'700':'400';el.style.fontStyle=it.italic?'italic':'normal';}
  function draw(){const ae=document.activeElement;const fid=ae&&ae.classList&&ae.classList.contains('ptxt')?+ae.parentNode.dataset.id:0;lay.innerHTML='';
   for(const it of S.items.filter(x=>x.page===page&&x.cov)){const c=document.createElement('div');c.className='pcov';Object.assign(c.style,{left:it.cov.fx*100+'%',top:it.cov.fy*100+'%',width:it.cov.fw*100+'%',height:it.cov.fh*100+'%',background:it.cov.bg});lay.appendChild(c);}
   if(mode!=='white')(S.src[page]||[]).forEach((l,k)=>{if(S.items.some(x=>x.page===page&&x.srcK===k))return;const h=document.createElement('div');h.className='psrc';h.dataset.k=k;Object.assign(h.style,{left:l.cov.fx*100+'%',top:l.cov.fy*100+'%',width:l.cov.fw*100+'%',height:l.cov.fh*100+'%'});h.title='Click to edit this text';lay.appendChild(h);});
   for(const it of S.items.filter(x=>x.page===page)){const d=document.createElement('div');d.className='pit '+it.type+(it.id===selId?' sel':'');d.dataset.id=it.id;d.style.left=it.fx*100+'%';d.style.top=it.fy*100+'%';
    if(it.type==='text'){const t=document.createElement('div');t.className='ptxt';t.contentEditable='true';t.spellcheck=false;t.innerText=it.text;styleText(t,it);d.appendChild(t);
     t.addEventListener('focus',()=>{if(selId!==it.id){selId=it.id;mark();syncFmt();}t._before=it.text;});
     t.addEventListener('input',()=>{it.text=t.innerText.replace(/\n$/,'');hint();});
     t.addEventListener('blur',()=>{if(t._before!==it.text){S.hist.push(JSON.stringify(S.items.map(x=>x.id===it.id?{...x,text:t._before}:x)));}if(!it.text.trim()&&!it.cov){S.items=S.items.filter(x=>x!==it);draw();}hint();});}
    else{d.style.width=it.fw*100+'%';d.style.height=it.fh*100+'%';if(it.type==='img')d.style.backgroundImage=`url(${S.imgs[it.img].url})`;}
    const mv=document.createElement('span');mv.className='pmv';mv.textContent='✥';mv.title='Drag to move';d.appendChild(mv);
    const rs=document.createElement('span');rs.className='prs';rs.title='Drag to resize';d.appendChild(rs);
    lay.appendChild(d);}
   if(fid){const t=lay.querySelector(`.pit[data-id="${fid}"] .ptxt`);if(t){t.focus();const r=document.createRange();r.selectNodeContents(t);r.collapse(false);const sl=getSelection();sl.removeAllRanges();sl.addRange(r);}}
   hint();}
  function mark(){lay.querySelectorAll('.pit').forEach(e=>e.classList.toggle('sel',+e.dataset.id===selId));}
  function syncFmt(){const it=cur();if(!it||it.type!=='text')return;q('#pfont').value=it.font;q('#psize').value=it.fs;q('#pcol').value=it.color;q('#pb').setAttribute('aria-pressed',!!it.bold);q('#pi').setAttribute('aria-pressed',!!it.italic);}
  const frac=e=>{const r=lay.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
  const clamp=(a,lo,hi)=>Math.max(lo,Math.min(hi,a));
  // Pointer handling
  let drag=null;
  lay.addEventListener('pointerdown',e=>{const itEl=e.target.closest('.pit');const [fx,fy]=frac(e);
   const sh=e.target.closest('.psrc');if(sh&&!itEl){e.preventDefault();const it=convert(page,+sh.dataset.k);selId=it.id;draw();const t=lay.querySelector(`.pit[data-id="${it.id}"] .ptxt`);if(t){t.focus();const r=document.createRange();r.selectNodeContents(t);const sl=getSelection();sl.removeAllRanges();sl.addRange(r);}return;}
   if(itEl){const it=S.items.find(x=>x.id===+itEl.dataset.id);selId=it.id;mark();syncFmt();const isTxt=e.target.closest('.ptxt');
    if(e.target.classList.contains('prs')){e.preventDefault();snap();drag={k:'rs',it,fx,fy,o:{...it},el:itEl,moved:0};}
    else if(isTxt&&document.activeElement===isTxt)return; // editing text: let caret work
    else{if(!isTxt)e.preventDefault();snap();drag={k:'mv',it,fx,fy,o:{...it},el:itEl,moved:0,txt:isTxt};}
    lay.setPointerCapture(e.pointerId);return;}
   if(document.activeElement&&document.activeElement.classList?.contains('ptxt')){document.activeElement.blur();selId=null;mark();return;}
   selId=null;mark();
   if(mode==='text'){e.preventDefault();snap();const fs=+q('#psize').value||14;const it={id:uid++,type:'text',page,fx:clamp(fx,0,0.98),fy:clamp(fy-fs*0.6*pxpt/lay.clientHeight,0,0.98),text:'',fs,color:q('#pcol').value,font:q('#pfont').value,bold:q('#pb').getAttribute('aria-pressed')==='true',italic:q('#pi').getAttribute('aria-pressed')==='true'};S.items.push(it);selId=it.id;draw();const t=lay.querySelector(`.pit[data-id="${it.id}"] .ptxt`);if(t)t.focus();}
   else if(mode==='white'){e.preventDefault();snap();const it={id:uid++,type:'white',page,fx,fy,fw:0.001,fh:0.001};S.items.push(it);selId=it.id;draw();drag={k:'new',it,fx,fy,el:lay.querySelector(`.pit[data-id="${it.id}"]`),moved:0};lay.setPointerCapture(e.pointerId);}
  });
  lay.addEventListener('pointermove',e=>{if(!drag)return;const [fx,fy]=frac(e);const dx=fx-drag.fx,dy=fy-drag.fy;if(Math.abs(dx)+Math.abs(dy)>0.004)drag.moved=1;if(!drag.moved)return;const it=drag.it,el=drag.el;
   if(drag.k==='mv'){it.fx=clamp(drag.o.fx+dx,-0.05,0.99);it.fy=clamp(drag.o.fy+dy,-0.02,0.99);el.style.left=it.fx*100+'%';el.style.top=it.fy*100+'%';}
   else if(drag.k==='new'){it.fx=Math.min(fx,drag.fx);it.fy=Math.min(fy,drag.fy);it.fw=Math.abs(dx);it.fh=Math.abs(dy);Object.assign(el.style,{left:it.fx*100+'%',top:it.fy*100+'%',width:it.fw*100+'%',height:it.fh*100+'%'});}
   else if(drag.k==='rs'){if(it.type==='text'){const h0=el.offsetHeight/lay.clientHeight||0.01;it.fs=Math.round(clamp(drag.o.fs*(1+dy/h0),4,200)*2)/2;styleText(el.querySelector('.ptxt'),it);q('#psize').value=it.fs;}
    else{let nw=Math.max(0.01,drag.o.fw+dx),nh=Math.max(0.005,drag.o.fh+dy);if(it.type==='img'&&!e.shiftKey){const ar=drag.o.fh/drag.o.fw;nh=nw*ar;}it.fw=nw;it.fh=nh;el.style.width=nw*100+'%';el.style.height=nh*100+'%';}}});
  const end=e=>{if(!drag)return;const d=drag;drag=null;
   if(d.k==='new'&&(d.it.fw<0.01||d.it.fh<0.005)){d.it.fw=0.2;d.it.fh=0.04;d.it.fx=clamp(d.fx-0.1,0,0.8);d.it.fy=clamp(d.fy-0.02,0,0.96);draw();}
   else if(!d.moved){S.hist.pop();if(d.txt)d.txt.focus();}
   hint();};
  lay.addEventListener('pointerup',end);lay.addEventListener('pointercancel',end);
  // Toolbar
  w.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;w.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b));lay.dataset.mode=mode;hint();});lay.dataset.mode=mode;
  const fmt=(k,val)=>{const it=cur();if(it&&it.type==='text'){snap();it[k]=val;const el=lay.querySelector(`.pit[data-id="${it.id}"] .ptxt`);if(el)styleText(el,it);}};
  q('#pfont').onchange=e=>fmt('font',e.target.value);q('#psize').oninput=e=>{const n=+e.target.value;if(n>=4&&n<=200)fmt('fs',n);};q('#pcol').oninput=e=>fmt('color',e.target.value);
  for(const [id,k] of [['#pb','bold'],['#pi','italic']])q(id).onmousedown=e=>e.preventDefault(),q(id).onclick=()=>{const b=q(id);const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);fmt(k,on);};
  q('#pdel').onclick=()=>{if(!selId)return;snap();const c=cur();if(c&&c.cov){c.text='';draw();return;}S.items=S.items.filter(x=>x.id!==selId);selId=null;draw();};
  document.addEventListener('keydown',S._kd=e=>{if(!w.isConnected){document.removeEventListener('keydown',S._kd);return;}if(document.activeElement?.isContentEditable||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName))return;if((e.key==='Delete'||e.key==='Backspace')&&selId){e.preventDefault();q('#pdel').click();}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();q('#pundo').click();}});
  q('#pfrb').onclick=async()=>{const f=q('#pfind').value,r=q('#prepl').value;if(!f)return;let n=0;for(let pg=1;pg<=N;pg++){q('#phint').textContent=`Searching page ${pg}/${N}…`;await loadSrc(pg);(S.src[pg]||[]).forEach((l,k)=>{const ex=S.items.find(x=>x.page===pg&&x.srcK===k);const cur=ex?ex.text:l.text;if(!cur.includes(f))return;const nt=cur.split(f).join(r);n+=cur.split(f).length-1;if(ex){snap();ex.text=nt;}else convert(pg,k,nt);});}draw();q('#phint').textContent=n?`Replaced ${n} occurrence(s). Press Start to save.`:`“${f}” not found.`;};
  q('#pocr').onclick=async()=>{q('#pocr').disabled=true;try{S.src[page]=await edLinesOcr(page);S.items=S.items.filter(x=>!(x.page===page&&x.srcK!=null&&x.text===x.orig));draw();q('#phint').textContent=`OCR found ${S.src[page].length} text line(s). Tap one to edit.`;}finally{q('#pocr').disabled=false;}};
  q('#pundo').onclick=()=>{const s=S.hist.pop();if(s==null)return;S.items=JSON.parse(s);selId=null;draw();};
  q('#pprev').onclick=()=>{if(page>1){page--;selId=null;show();}};q('#pnext').onclick=()=>{if(page<N){page++;selId=null;show();}};
  const addImg=async(blob)=>{const url=URL.createObjectURL(blob);const im=new Image();im.src=url;await im.decode();const key='i'+uid;S.imgs[key]={blob,url,w:im.naturalWidth,h:im.naturalHeight};const dm=S.dims[page];const fw=0.3,fh=fw*(im.naturalHeight/im.naturalWidth)*(dm.w/dm.h);snap();const it={id:uid++,type:'img',img:key,page,fx:0.35,fy:clamp(0.4-fh/2,0,0.9),fw,fh};S.items.push(it);selId=it.id;mode='move';w.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x.dataset.m==='move'));lay.dataset.mode=mode;draw();};
  q('#pimg').onclick=()=>q('#pimgf').click();q('#pimgf').onchange=e=>{const f=e.target.files[0];if(f)addImg(f);e.target.value='';};
  q('#psig').onclick=()=>{const m=document.createElement('div');m.className='psigm';m.innerHTML=`<div class="psigb"><p><b>${esc(T.o_signature||'Signature')}</b> – draw below</p><canvas width="600" height="220"></canvas><div class="psiga"><button type="button" class="btn ghost mini" data-a="clr">Clear</button><button type="button" class="btn ghost mini" data-a="x">Cancel</button><button type="button" class="btn mini" data-a="ok">Insert</button></div></div>`;document.body.appendChild(m);const c=m.querySelector('canvas'),x=c.getContext('2d');x.lineWidth=3.5;x.lineCap=x.lineJoin='round';x.strokeStyle=q('#pcol').value==='#ffffff'?'#000':q('#pcol').value;let dn=0,inked=0;
   const P=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height];};
   c.onpointerdown=e=>{dn=1;c.setPointerCapture(e.pointerId);x.beginPath();x.moveTo(...P(e));};c.onpointermove=e=>{if(!dn)return;x.lineTo(...P(e));x.stroke();inked=1;};c.onpointerup=()=>dn=0;
   m.onclick=async e=>{const a=e.target.dataset.a;if(a==='clr')x.clearRect(0,0,c.width,c.height),inked=0;if(a==='x')m.remove();if(a==='ok'){if(!inked)return;const d=x.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++)if(d[(yy*c.width+xx)*4+3]){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy;}
    const o=document.createElement('canvas');o.width=x1-x0+9;o.height=y1-y0+9;o.getContext('2d').drawImage(c,x0-4,y0-4,o.width,o.height,0,0,o.width,o.height);m.remove();addImg(await toBlob(o,'image/png'));}};};
  let rt;S._ro=new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(()=>{if(!w.isConnected){S._ro.disconnect();return;}if(Math.abs((stage.clientWidth||0)-pg.clientWidth)>30)show();},200);});S._ro.observe(stage);
  await show();setTimeout(()=>{hint();if(w.getBoundingClientRect().top>innerHeight*0.6)w.scrollIntoView({behavior:'smooth',block:'start'});},50);S.doc=doc;return w;},
 async run([f],status){const items=this.items.filter(x=>x.type!=='text'||x.text.trim()||x.cov);if(!items.length)throw new Error(T.o_editHint||'Add at least one edit first: tap the page to add text or a white-out box.');
  status(T.working);const {PDFDocument,StandardFonts,degrees,rgb}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const std={};
  const SF={sans:['Helvetica','HelveticaBold','HelveticaOblique','HelveticaBoldOblique'],serif:['TimesRoman','TimesRomanBold','TimesRomanItalic','TimesRomanBoldItalic'],mono:['Courier','CourierBold','CourierOblique','CourierBoldOblique']};
  const enc=s=>[...s].every(ch=>{const c=ch.codePointAt(0);return (c>=32&&c<127)||(c>=160&&c<=255)||'€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.includes(ch);});
  const imgCache={};
  for(const it of items.filter(x=>x.cov)){const p=d.getPage(it.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();const r=((p.getRotation().angle%360)+360)%360;const m=(fx,fy)=>{const [ux,uy]=r===90?[fy*W,fx*H]:r===180?[(1-fx)*W,fy*H]:r===270?[(1-fy)*W,(1-fx)*H]:[fx*W,(1-fy)*H];return {x:bx+ux,y:by+uy};};const c=it.cov,a=m(c.fx,c.fy),b=m(c.fx+c.fw,c.fy+c.fh);p.drawRectangle({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y),color:hex2rgb(c.bg)});}
  for(const it of items){const p=d.getPage(it.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();const r=((p.getRotation().angle%360)+360)%360;const VW=r%180?H:W,VH=r%180?W:H;
   const m=(fx,fy)=>{const [ux,uy]=r===90?[fy*W,fx*H]:r===180?[(1-fx)*W,fy*H]:r===270?[(1-fy)*W,(1-fx)*H]:[fx*W,(1-fy)*H];return {x:bx+ux,y:by+uy};};
   if(it.type==='white'){const a=m(it.fx,it.fy),b=m(it.fx+it.fw,it.fy+it.fh);p.drawRectangle({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y),color:rgb(1,1,1)});}
   else if(it.type==='img'){const im=this.imgs[it.img];if(!imgCache[it.img]){const isJ=/jpe?g/.test(im.blob.type),isP=/png/.test(im.blob.type);let bytes;if(isJ||isP)bytes=await im.blob.arrayBuffer();else{const c=document.createElement('canvas');c.width=im.w;c.height=im.h;const ii=new Image();ii.src=im.url;await ii.decode();c.getContext('2d').drawImage(ii,0,0);bytes=await (await toBlob(c,'image/png')).arrayBuffer();}imgCache[it.img]=isJ?await d.embedJpg(bytes):await d.embedPng(bytes);}
    const a=m(it.fx,it.fy+it.fh);p.drawImage(imgCache[it.img],{x:a.x,y:a.y,width:it.fw*VW,height:it.fh*VH,rotate:degrees(r)});}
   else if(it.text.trim()){const lines=it.text.split('\n');const col=hex2rgb(it.color);const lh=it.fs*1.2;
    for(let i=0;i<lines.length;i++){const ln=lines[i];if(!ln.trim())continue;const base=it.fy+(i*lh+it.fs*0.97)/VH;const a=m(it.fx,base);
     if(enc(ln)){const k=SF[it.font][(it.bold?1:0)+(it.italic?2:0)];std[k]=std[k]||await d.embedFont(StandardFonts[k]);p.drawText(ln,{x:a.x,y:a.y,size:it.fs,font:std[k],color:col,rotate:degrees(r)});}
     else await drawText(d,p,ln,{x:a.x,y:a.y,size:it.fs,color:col,bold:it.bold,rotate:r});}}}
  return {blob:pdfBlob(await d.save()),name:base(f.name)+'-edited.pdf'};}};
