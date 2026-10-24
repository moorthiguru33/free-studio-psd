// ===== Phase 2 tools (inlined into app.js at build time) =====
// --- Multi-script font support (Noto, lazy-loaded per script) ---
const SCRIPTS=[[/[\u0B80-\u0BFF]/,'Tamil'],[/[\u0900-\u097F]/,'Devanagari'],[/[\u0980-\u09FF]/,'Bengali'],[/[\u0C00-\u0C7F]/,'Telugu'],[/[\u0C80-\u0CFF]/,'Kannada'],[/[\u0D00-\u0D7F]/,'Malayalam'],[/[\u0A80-\u0AFF]/,'Gujarati'],[/[\u0A00-\u0A7F]/,'Gurmukhi'],[/[\u0E00-\u0E7F]/,'Thai'],[/[\u0590-\u05FF\uFB1D-\uFB4F]/,'Hebrew'],[/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/,'Arabic']];
const WINANSI_EXTRA='€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const NEUTRAL=/[\s\d.,:;!?'"()\[\]\-–—\/+*%&@#]/;
const fontBytes={};const fetchFont=n=>fontBytes[n]||(fontBytes[n]=fetch('/fonts/'+n+'.ttf').then(r=>{if(!r.ok)throw new Error('Font '+n);return r.arrayBuffer();}));
const docFonts=new WeakMap();
async function getFont(doc,key,bold){let c=docFonts.get(doc);if(!c){c={};docFonts.set(doc,c);}const id=key+(bold?'B':'');if(c[id])return c[id];
  if(key==='std'){const {StandardFonts}=window.PDFLib;c[id]=doc.embedFont(bold?StandardFonts.HelveticaBold:StandardFonts.Helvetica);}
  else{c[id]=(async()=>{const fk=await L.fontkit();doc.registerFontkit(fk);const n=key==='Latin'?(bold?'NotoSans-Bold':'NotoSans-Regular'):`NotoSans${key}-Regular`;return doc.embedFont(await fetchFont(n),{subset:true});})();}
  return c[id];}
const scriptKey=ch=>{for(const [re,k] of SCRIPTS)if(re.test(ch))return k;return 'std';};
async function textRuns(doc,text,bold){text=String(text).replace(/[\r\n\t]+/g,' ');const enc=ch=>{const c=ch.codePointAt(0);return (c>=32&&c<127)||(c>=160&&c<=255)||WINANSI_EXTRA.includes(ch);};
  const runs=[];for(const ch of text){let k=NEUTRAL.test(ch)&&runs.length?runs[runs.length-1].k:scriptKey(ch);if(k==='std'&&!enc(ch))k='Latin';const last=runs[runs.length-1];if(last&&last.k===k)last.t+=ch;else runs.push({k,t:ch});}
  for(const r of runs)r.font=await getFont(doc,r.k,bold);return runs;}
const runsWidth=(runs,size)=>runs.reduce((a,r)=>a+r.font.widthOfTextAtSize(r.t,size),0);
function drawRuns(page,runs,{x,y,size,color,opacity=1,rotate=0}){const {degrees}=window.PDFLib;const a=rotate*Math.PI/180;for(const r of runs){page.drawText(r.t,{x,y,size,font:r.font,color,opacity,rotate:degrees(rotate)});const w=r.font.widthOfTextAtSize(r.t,size);x+=w*Math.cos(a);y+=w*Math.sin(a);}}
async function drawText(doc,page,text,o){const runs=await textRuns(doc,text,o.bold);drawRuns(page,runs,o);return runsWidth(runs,o.size);}
const hex2rgb=h=>{const {rgb}=window.PDFLib;const c=(h||'#000000').match(/\w\w/g).map(x=>parseInt(x,16)/255);return rgb(...c);};
const POS=()=>[['bc','Bottom center'],['br','Bottom right'],['bl','Bottom left'],['tc','Top center'],['tr','Top right'],['tl','Top left']];
const place=(p,pos,w,size,m=24)=>{const {x:bx,y:by,width:W,height:H}=p.getCropBox();return {x:bx+(pos[1]==='c'?(W-w)/2:pos[1]==='r'?W-w-m:m),y:by+(pos[0]==='b'?m:H-m-size)};};
const chk=(id,label,on)=>`<label style="flex-direction:row;align-items:center;gap:8px"><input id="${id}" type="checkbox" ${on?'checked':''}> ${esc(label)}</label>`;
const vb=id=>$('#'+id,work)?.checked;
// rasterize page i (1-based) of pdf.js doc into pdf-lib doc d as JPEG page of same size
async function rasterInto(d,pjDoc,i,{scale=2,q=.85,gray=false,draw}={}){const pg=await pjDoc.getPage(i);const vp=pg.getViewport({scale:1});const c=await renderPage(pjDoc,i,scale);const ctx=c.getContext('2d');
  if(draw)draw(ctx,scale,vp);
  if(gray){const im=ctx.getImageData(0,0,c.width,c.height),dt=im.data;for(let k=0;k<dt.length;k+=4){const g=dt[k]*.299+dt[k+1]*.587+dt[k+2]*.114;dt[k]=dt[k+1]=dt[k+2]=g;}ctx.putImageData(im,0,0);}
  const img=await d.embedJpg(new Uint8Array(await (await toBlob(c,'image/jpeg',q)).arrayBuffer()));c.width=c.height=0;const p=d.addPage([vp.width,vp.height]);p.drawImage(img,{x:0,y:0,width:vp.width,height:vp.height});return p;}
async function zipOrOne(items,zipName){return items.length===1?items[0]:{blob:await zipBlobs(items),name:zipName};}
async function pageTexts(pjDoc){const out=[];for(let i=1;i<=pjDoc.numPages;i++){const pg=await pjDoc.getPage(i);const tc=await pg.getTextContent();out.push({items:tc.items.filter(it=>'str' in it),vp:pg.getViewport({scale:1})});}return out;}
const lineTexts=items=>{const lines=[];let cur=null;for(const it of items){const y=it.transform[5],h=Math.abs(it.transform[3])||10;if(!cur||Math.abs(cur.y-y)>h*.5){cur={y,t:''};lines.push(cur);}cur.t+=it.str;if(it.hasEOL)cur=null;}return lines.map(l=>l.t.replace(/\s+/g,' ').trim()).filter(Boolean);};

Object.assign(TOOLS,{
 // ---------- Organize / delete / extract with thumbnails + drag reorder ----------
 organize:{async setup(files){const pj=await openPdfjs(await buf(files[0]));const n=pj.numPages;this.order=Array.from({length:n},(_,i)=>({i,rot:0,del:false,sel:false}));
   const wrap=document.createElement('div');const pre=this.preset;
   wrap.innerHTML=`<p class="hint" style="text-align:center">${esc(pre==='delete'?T.o_tapDelete:pre==='extract'?T.o_tapSelect:T.o_dragHint)}</p><div class="thumbs"></div>`;const grid=$('.thumbs',wrap);
   const draw=()=>{grid.innerHTML='';this.order.forEach((o,pos)=>{const el=document.createElement('div');el.className='thumb'+(o.del?' del':'')+(o.sel?' sel':'');el.draggable=true;el.dataset.pos=pos;el.dataset.page=o.i+1;
     el.innerHTML=`<div class="tc" style="transform:rotate(${o.rot}deg)"></div><span class="pn">${o.i+1}</span><div class="tb"><button type="button" data-a="l" title="←">←</button><button type="button" data-a="r" title="↻">↻</button><button type="button" data-a="d" title="✕">${o.del?'↺':'✕'}</button><button type="button" data-a="s" title="✓">${o.sel?'☑':'☐'}</button><button type="button" data-a="m" title="→">→</button></div>`;
     $('.tc',el).appendChild(o.canvas);grid.appendChild(el);});};
   for(const o of this.order){const c=await renderPage(pj,o.i+1,.3);c.style.cssText='width:100%;height:auto;display:block';o.canvas=c;}
   draw();let from=null;
   grid.addEventListener('dragstart',e=>{const t=e.target.closest('.thumb');from=+t.dataset.pos;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',''+from);});
   grid.addEventListener('dragover',e=>{e.preventDefault();});
   grid.addEventListener('drop',e=>{e.preventDefault();const t=e.target.closest('.thumb');if(!t||from===null)return;const to=+t.dataset.pos;const [m]=this.order.splice(from,1);this.order.splice(to,0,m);from=null;draw();});
   grid.addEventListener('click',e=>{const b=e.target.closest('button');const t=e.target.closest('.thumb');if(!t)return;const pos=+t.dataset.pos,o=this.order[pos];const a=b?b.dataset.a:(pre==='delete'?'d':pre==='extract'?'s':null);if(!a)return;
     if(a==='r')o.rot=(o.rot+90)%360;else if(a==='d')o.del=!o.del;else if(a==='s')o.sel=!o.sel;else if(a==='l'&&pos>0)[this.order[pos-1],this.order[pos]]=[o,this.order[pos-1]];else if(a==='m'&&pos<this.order.length-1)[this.order[pos+1],this.order[pos]]=[o,this.order[pos+1]];draw();});
   return wrap;},
  opts(){return this.preset?'':sel('omode',T.o_output,[['all',T.o_outKept],['sel',T.o_outSel]]);},
  async run([f]){const {PDFDocument,degrees}=await L.pdflib();const src=await PDFDocument.load(await buf(f));const onlySel=this.preset==='extract'||v('omode')==='sel';
   const keep=this.order.filter(o=>onlySel?o.sel&&!o.del:!o.del);if(!keep.length)throw new Error(onlySel?T.o_tapSelect:T.o_noPages);
   const d=await PDFDocument.create();const pages=await d.copyPages(src,keep.map(o=>o.i));pages.forEach((p,k)=>{if(keep[k].rot)p.setRotation(degrees((p.getRotation().angle+keep[k].rot)%360));d.addPage(p);});
   return {blob:pdfBlob(await d.save()),name:base(f.name)+(this.preset==='extract'?'-extracted':this.preset==='delete'?'-pages-removed':'-organized')+'.pdf',info:`${keep.length} ${T.pages}`};}},
 // ---------- Split by bookmarks / size / text ----------
 splitx:{opts(){return this.preset==='size'?inp('maxmb',T.o_maxSize,'number','1','min="0.05" step="0.05"'):this.preset==='text'?inp('stext',T.o_splitText,'text','','placeholder="Chapter"')+chk('scase',T.o_matchCase,false):sel('bmlevel',T.o_bmLevel,[['1','1'],['2','2']]);},
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);const src=await PDFDocument.load(data);const n=src.getPageCount();let starts=[],labels=[];
   const make=async idx=>{const d=await PDFDocument.create();(await d.copyPages(src,idx)).forEach(p=>d.addPage(p));return d.save({useObjectStreams:true});};
   const items=[];
   if(this.preset==='size'){const max=(+v('maxmb')||1)*1048576;let cur=[],last=null;for(let i=0;i<n;i++){status(`${T.working} ${i+1}/${n}`);const tryIdx=[...cur,i];const b=await make(tryIdx);if(b.byteLength>max&&cur.length){items.push({idx:cur,bytes:last});cur=[i];last=await make(cur);}else{cur=tryIdx;last=b;}}if(cur.length)items.push({idx:cur,bytes:last});
    return zipOrOne(items.map((it,k)=>({name:`${base(f.name)}-part${k+1}.pdf`,blob:pdfBlob(it.bytes)})),base(f.name)+'-split.zip');}
   const pj=await openPdfjs(data);
   if(this.preset==='text'){const q=(v('stext')||'').trim();if(!q)throw new Error(T.o_splitText);const cs=vb('scase');const tx=await pageTexts(pj);tx.forEach((p,i)=>{const s=p.items.map(it=>it.str).join(' ');if(cs?s.includes(q):s.toLowerCase().includes(q.toLowerCase()))starts.push(i);});if(!starts.length)throw new Error(T.o_notFound+': '+q);}
   else{const ol=await pj.getOutline();if(!ol||!ol.length)throw new Error(T.o_noBookmarks);const lvl=+v('bmlevel')||1;const flat=[];const walk=(arr,d)=>{for(const it of arr){flat.push({it,d});if(d<lvl&&it.items)walk(it.items,d+1);}};walk(ol,1);
    for(const {it} of flat){let dest=it.dest;if(typeof dest==='string')dest=await pj.getDestination(dest);if(!dest)continue;const pi=typeof dest[0]==='number'?dest[0]:await pj.getPageIndex(dest[0]);if(!starts.includes(pi)){starts.push(pi);labels[pi]=it.title;}}starts.sort((a,b)=>a-b);}
   if(starts[0]!==0)starts.unshift(0);
   for(let k=0;k<starts.length;k++){const a=starts[k],b=(starts[k+1]??n)-1;const idx=Array.from({length:b-a+1},(_,j)=>a+j);const lab=(labels[a]||'').replace(/[^\p{L}\p{N} _-]+/gu,'').trim().slice(0,40);items.push({name:`${base(f.name)}-${k+1}${lab?'-'+lab:''}.pdf`,blob:pdfBlob(await make(idx))});}
   return zipOrOne(items,base(f.name)+'-split.zip');}},
 // ---------- N-up ----------
 nup:{opts:()=>sel('nper',T.o_perSheet,[['2','2'],['4','4'],['6','6'],['9','9']])+sel('nsheet',T.o_pagesize,[['a4','A4'],['letter','US Letter']])+chk('nborder',T.o_border,true),
  async run([f]){const {PDFDocument,rgb}=await L.pdflib();const src=await PDFDocument.load(await buf(f));const d=await PDFDocument.create();const per=+v('nper');const [cols,rows]={2:[2,1],4:[2,2],6:[3,2],9:[3,3]}[per];
   let [W,H]=v('nsheet')==='a4'?[595.28,841.89]:[612,792];if(cols>rows)[W,H]=[H,W];const emb=await d.embedPages(src.getPages());const m=18,g=8;const cw=(W-2*m-(cols-1)*g)/cols,ch=(H-2*m-(rows-1)*g)/rows;
   for(let i=0;i<emb.length;i+=per){const p=d.addPage([W,H]);for(let k=0;k<per&&i+k<emb.length;k++){const e=emb[i+k];const c=k%cols,r=Math.floor(k/cols);const s=Math.min(cw/e.width,ch/e.height);const w=e.width*s,h=e.height*s;const x=m+c*(cw+g)+(cw-w)/2,y=H-m-(r+1)*ch-r*g+(ch-h)/2;p.drawPage(e,{x,y,width:w,height:h});if(vb('nborder'))p.drawRectangle({x,y,width:w,height:h,borderColor:rgb(.7,.7,.7),borderWidth:.5});}}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+`-${per}up.pdf`,info:`${emb.length} → ${d.getPageCount()} ${T.pages}`};}},
 // ---------- Watermark ----------
 watermark:{opts:()=>inp('wtext',T.o_text,'text','CONFIDENTIAL')+inp('wsize',T.o_size,'number','48','min="8" max="200"')+inp('wop',T.o_opacity,'number','25','min="5" max="100"')+inp('wrot',T.o_angle,'number','45','min="-180" max="180"')+'<label>Color<input id="wcol" type="color" value="#e5322d"></label>'+sel('wlay',T.o_layout,[['center',T.o_center],['tile',T.o_tile]]),
  async run(files){const {PDFDocument}=await L.pdflib();const items=[];const txt=v('wtext');if(!txt)throw new Error(T.o_text);
   for(const f of files){const d=await PDFDocument.load(await buf(f));const size=+v('wsize')||48,op=(+v('wop')||25)/100,rot=+v('wrot')||0,color=hex2rgb(v('wcol'));const runs=await textRuns(d,txt,true);const w=runsWidth(runs,size);const a=rot*Math.PI/180;
    for(const p of d.getPages()){const {x:bx,y:by,width:W,height:H}=p.getCropBox();const at=(cx,cy)=>drawRuns(p,runs,{x:cx-(w/2)*Math.cos(a)+(size/3)*Math.sin(a),y:cy-(w/2)*Math.sin(a)-(size/3)*Math.cos(a),size,color,opacity:op,rotate:rot});
     if(v('wlay')==='tile'){const sx=w*.8+size*2,sy=size*4;for(let yy=by;yy<by+H+sy;yy+=sy)for(let xx=bx;xx<bx+W+sx;xx+=sx)at(xx,yy);}else at(bx+W/2,by+H/2);}
    items.push({name:base(f.name)+'-watermarked.pdf',blob:pdfBlob(await d.save())});}
   return zipOrOne(items,'watermarked.zip');}},
 // ---------- Header & footer ----------
 headerfooter:{opts:()=>['hl','hc','hr','fl','fc','fr'].map(k=>inp(k,T['o_'+k],'text',k==='fc'?'{page} / {total}':'','placeholder="{page} {total} {date} {file}"')).join('')+inp('hfs',T.o_size,'number','10','min="6" max="36"')+inp('hfm',T.o_margin,'number','24','min="0" max="100"'),
  async run(files){const {PDFDocument,rgb}=await L.pdflib();const items=[];const today=new Date().toISOString().slice(0,10);
   for(const f of files){const d=await PDFDocument.load(await buf(f));const pages=d.getPages(),N=pages.length,size=+v('hfs')||10,m=+v('hfm')||24;
    for(let i=0;i<N;i++){const p=pages[i];const {x:bx,y:by,width:W,height:H}=p.getCropBox();for(const k of ['hl','hc','hr','fl','fc','fr']){const raw=v(k);if(!raw)continue;const t=raw.replace(/\{page\}/g,i+1).replace(/\{total\}/g,N).replace(/\{date\}/g,today).replace(/\{file\}/g,f.name);const runs=await textRuns(d,t);const w=runsWidth(runs,size);
     const x=bx+(k[1]==='l'?m:k[1]==='c'?(W-w)/2:W-w-m),y=by+(k[0]==='h'?H-m-size:m);drawRuns(p,runs,{x,y,size,color:rgb(.2,.2,.2)});}}
    items.push({name:base(f.name)+'-header-footer.pdf',blob:pdfBlob(await d.save())});}
   return zipOrOne(items,'header-footer.zip');}},
 // ---------- Bates numbering (continuous across files) ----------
 bates:{opts:()=>inp('bpre',T.o_prefix,'text','ABC')+inp('bstart',T.o_start,'number','1','min="0"')+inp('bdig',T.o_digits,'number','6','min="1" max="12"')+inp('bsuf',T.o_suffix,'text','')+sel('bpos',T.o_position,POS().map(([a,b])=>[a,b]).sort((x,y)=>x[0]==='br'?-1:0))+inp('bfs',T.o_size,'number','10','min="6" max="36"'),
  async run(files){const {PDFDocument,rgb}=await L.pdflib();let n=+v('bstart')||0;const items=[];const first=n;
   for(const f of files){const d=await PDFDocument.load(await buf(f));const size=+v('bfs')||10;for(const p of d.getPages()){const t=`${v('bpre')}${String(n++).padStart(+v('bdig')||6,'0')}${v('bsuf')}`;const runs=await textRuns(d,t,true);const w=runsWidth(runs,size);drawRuns(p,runs,{...place(p,v('bpos'),w,size,20),size,color:rgb(0,0,0)});}
    items.push({name:base(f.name)+'-bates.pdf',blob:pdfBlob(await d.save())});}
   return {...await zipOrOne(items,'bates.zip'),info:`${v('bpre')}${String(first).padStart(+v('bdig')||6,'0')} – ${v('bpre')}${String(n-1).padStart(+v('bdig')||6,'0')}`};}},
 // ---------- Crop ----------
 crop:{opts:()=>['ct','cr','cb','cl'].map(k=>inp(k,T['o_'+k]+' (mm)','number','10','min="0" step="1"')).join('')+inp('cpages',T.o_pagesOpt,'text','','placeholder="1-3,5"'),
  async run([f]){const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(f));const mm=x=>(+x||0)*72/25.4;const [t,r,b,l]=['ct','cr','cb','cl'].map(k=>mm(v(k)));const pages=d.getPages();
   const idx=(v('cpages')||'').trim()?parseRanges(v('cpages'),pages.length).flatMap(x=>x.idx):pages.map((_,i)=>i);
   for(const i of idx){const p=pages[i];const {x,y,width:W,height:H}=p.getCropBox();if(l+r>=W||t+b>=H)throw new Error('Crop larger than page '+(i+1));const box=[x+l,y+b,W-l-r,H-t-b];p.setCropBox(...box);p.setMediaBox(...box);p.setTrimBox(...box);p.setBleedBox(...box);}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-cropped.pdf'};}},
 // ---------- Edit metadata ----------
 metadata:{async setup(files){const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(files[0]),{updateMetadata:false});const g=k=>{try{const x=d['get'+k]();return x||'';}catch(e){return '';}};
   const el=document.createElement('div');el.className='opts';el.innerHTML=['Title','Author','Subject','Keywords','Creator','Producer'].map(k=>inp('m'+k,T['o_m'+k]||k,'text',k==='Keywords'?String(g(k)):g(k))).join('')+chk('mstrip',T.o_mStrip,false);return el;},
  async run([f]){const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{updateMetadata:false});const strip=vb('mstrip');
   for(const k of ['Title','Author','Subject','Creator','Producer'])d['set'+k](strip?'':v('m'+k)||'');d.setKeywords(strip?[]:(v('mKeywords')||'').split(/[,;]\s*/).filter(Boolean));const now=new Date();d.setModificationDate(now);
   if(strip){try{d.catalog.delete(window.PDFLib.PDFName.of('Metadata'));}catch(e){}}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-metadata.pdf'};}},
 // ---------- Flatten ----------
 flatten:{opts:()=>sel('flmode',T.o_mode,[['forms',T.o_flForms],['all',T.o_flAll]]),
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);let n=0;
   if(v('flmode')==='all'){const pj=await openPdfjs(data);const d=await PDFDocument.create();for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);await rasterInto(d,pj,i,{scale:2,q:.9});}return {blob:pdfBlob(await d.save()),name:base(f.name)+'-flattened.pdf'};}
   const d=await PDFDocument.load(data);const form=d.getForm();n=form.getFields().length;try{form.updateFieldAppearances();}catch(e){}form.flatten();
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-flattened.pdf',info:`${n} form fields flattened`};}},
 // ---------- Grayscale ----------
 grayscale:{opts:()=>sel('gq',T.o_quality,[['2|.85','High'],['1.5|.75','Medium'],['1|.6','Small file']]),
  async run([f],status){const {PDFDocument}=await L.pdflib();const pj=await openPdfjs(await buf(f));const d=await PDFDocument.create();const [sc,q]=v('gq').split('|').map(Number);
   for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);await rasterInto(d,pj,i,{scale:sc,q,gray:true});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-grayscale.pdf'};}},
 // ---------- Deskew (projection-profile angle detection) ----------
 deskew:{opts:()=>inp('dmax',T.o_maxAngle,'number','10','min="1" max="20"'),
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);const pj=await openPdfjs(data);const src=await PDFDocument.load(data);const d=await PDFDocument.create();const maxA=+v('dmax')||10;const angles=[];
   for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);const c=await renderPage(pj,i,1);const ang=detectSkew(c,maxA);c.width=c.height=0;angles.push(ang);
    if(Math.abs(ang)<0.15){const [p]=await d.copyPages(src,[i-1]);d.addPage(p);continue;}
    await rasterInto(d,pj,i,{scale:2,q:.88,draw:(ctx,s)=>{const cv=ctx.canvas;const tmp=document.createElement('canvas');tmp.width=cv.width;tmp.height=cv.height;tmp.getContext('2d').drawImage(cv,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang*Math.PI/180);ctx.drawImage(tmp,-cv.width/2,-cv.height/2);ctx.restore();tmp.width=0;}});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-deskewed.pdf',info:'Angles: '+angles.map(a=>a.toFixed(1)+'°').join(', ')};}},
 // ---------- Redact (true removal: affected pages are rebuilt as images) ----------
 redact:{async setup(files){const wrap=document.createElement('div');wrap.innerHTML=`<div class="opts">${inp('rterms',T.o_rTerms,'text','','placeholder="John Smith, 555-1234"')}${chk('rcase',T.o_matchCase,false)}</div><p class="hint">${esc(T.o_rDraw)}</p>`;
   this.boxes=[];const pv=await setupPreview(files[0],()=>null);wrap.appendChild(pv.el);const box=$('.preview',pv.el);let st=null,tmp=null;
   const fr=e=>{const r=box.querySelector('canvas').getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))];};
   box.style.touchAction='none';
   box.addEventListener('pointerdown',e=>{st=fr(e);box.setPointerCapture(e.pointerId);tmp={page:pv.state.page,fx:st[0],fy:st[1],fw:0,fh:0,label:''};pv.state.marks.push(tmp);});
   box.addEventListener('pointermove',e=>{if(!st)return;const [x,y]=fr(e);Object.assign(tmp,{fx:Math.min(x,st[0]),fy:Math.min(y,st[1]),fw:Math.abs(x-st[0]),fh:Math.abs(y-st[1])});pv.state.redraw();});
   box.addEventListener('pointerup',()=>{if(tmp&&tmp.fw>0.005&&tmp.fh>0.005)this.boxes.push(tmp);else pv.state.marks.pop();st=tmp=null;pv.state.redraw();});
   return wrap;},
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);const pj=await openPdfjs(data);const src=await PDFDocument.load(data);
   const boxes=[...this.boxes];const terms=(v('rterms')||'').split(',').map(s=>s.trim()).filter(Boolean);const cs=vb('rcase');let hits=0;
   if(terms.length){const tx=await pageTexts(pj);tx.forEach((p,pi)=>{const {width:W,height:H}=p.vp;for(const it of p.items){const s=cs?it.str:it.str.toLowerCase();for(const term of terms){const q=cs?term:term.toLowerCase();let at=s.indexOf(q);while(at>=0){hits++;const fs=Math.hypot(it.transform[2],it.transform[3])||10;const cw=it.width/Math.max(1,it.str.length);const x=it.transform[4]+cw*at,y=it.transform[5];
      const vx=p.vp.convertToViewportPoint(x-1,y-fs*.25),vy=p.vp.convertToViewportPoint(x+cw*q.length+1,y+fs*.95);boxes.push({page:pi+1,fx:Math.min(vx[0],vy[0])/W,fy:Math.min(vx[1],vy[1])/H,fw:Math.abs(vy[0]-vx[0])/W,fh:Math.abs(vy[1]-vx[1])/H});at=s.indexOf(q,at+q.length);}}}});
    if(!hits&&!boxes.length)throw new Error(T.o_notFound+': '+terms.join(', '));}
   if(!boxes.length)throw new Error(T.o_rDraw);
   const d=await PDFDocument.create();const aff=new Set(boxes.map(b=>b.page));
   for(let i=1;i<=pj.numPages;i++){if(!aff.has(i)){const [p]=await d.copyPages(src,[i-1]);d.addPage(p);continue;}status(`${T.working} ${i}/${pj.numPages}`);
    await rasterInto(d,pj,i,{scale:2.5,q:.9,draw:ctx=>{ctx.fillStyle='#000';const cw=ctx.canvas.width,ch=ctx.canvas.height;for(const b of boxes.filter(b=>b.page===i))ctx.fillRect(b.fx*cw,b.fy*ch,b.fw*cw,b.fh*ch);}});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-redacted.pdf',info:`${boxes.length} area(s) on ${aff.size} page(s) permanently removed; metadata cleared`};}},
 // ---------- Compare (side-by-side text diff) ----------
 compare:{minFiles:2,get minMsg(){return T.o_two;},
  async run(files,status){if(files.length<2)throw new Error(T.o_two);const [a,b]=files;status(T.working);
   const lines=async f=>{const pj=await openPdfjs(await buf(f));const tx=await pageTexts(pj);const out=[];tx.forEach((p,i)=>lineTexts(p.items).forEach(t=>out.push({t,p:i+1})));return out;};
   const A=await lines(a),B=await lines(b);const ops=diffLines(A.map(x=>x.t),B.map(x=>x.t));let add=0,del=0,chg=0;
   const rows=[];for(let k=0;k<ops.length;k++){const o=ops[k];if(o.t==='='){rows.push(['eq',A[o.i],B[o.j]]);continue;}
    if(o.t==='-'&&ops[k+1]&&ops[k+1].t==='+'){const w=wordDiff(A[o.i].t,B[ops[k+1].j].t);rows.push(['chg',{...A[o.i],h:w[0]},{...B[ops[k+1].j],h:w[1]}]);chg++;k++;continue;}
    if(o.t==='-'){rows.push(['del',A[o.i],null]);del++;}else{rows.push(['add',null,B[o.j]]);add++;}}
   const cell=x=>x?`<td class="pg">${x.p}</td><td>${x.h||esc(x.t)}</td>`:'<td class="pg"></td><td></td>';
   const table=`<div class="cmpsum"><b>${esc(a.name)}</b> ⇔ <b>${esc(b.name)}</b> — <span class="cdel">−${del}</span> <span class="cadd">+${add}</span> <span class="cchg">~${chg}</span></div><div class="cmpwrap"><table class="cmp"><tbody>${rows.map(([t,x,y])=>`<tr class="${t}">${cell(x)}${cell(y)}</tr>`).join('')}</tbody></table></div>`;
   const css='body{font:14px system-ui,sans-serif;margin:16px}.cmp{border-collapse:collapse;width:100%;table-layout:fixed}.cmp td{border-bottom:1px solid #eee;padding:3px 6px;vertical-align:top;word-wrap:break-word}.cmp td.pg{width:34px;color:#999;font-size:11px}.cmp tr.del td:nth-child(2){background:#fde2e1}.cmp tr.add td:nth-child(4){background:#dff5e3}.cmp tr.chg td:nth-child(2),.cmp tr.chg td:nth-child(4){background:#fff6d6}del{background:#f7b4b0;text-decoration:line-through}ins{background:#a8e6b4;text-decoration:none}.cdel{color:#c4221d}.cadd{color:#18843a}.cchg{color:#a37b00}';
   const html=`<!doctype html><meta charset="utf-8"><title>Compare ${esc(a.name)} vs ${esc(b.name)}</title><style>${css}</style>${table}`;
   return {blob:new Blob([html],{type:'text/html'}),name:`compare-${base(a.name)}-vs-${base(b.name)}.html`,view:`<style>${css.replace('body{','.resview{')}</style>${table}`,info:`−${del} +${add} ~${chg}`};}},
 // ---------- PDF/A-2b (best effort) ----------
 pdfa:{opts:()=>sel('pamode',T.o_mode,[['raster',T.o_paRaster],['keep',T.o_paKeep]]),
  async run([f],status){const P=await L.pdflib();const {PDFDocument,PDFName,PDFString,PDFHexString}=P;const data=await buf(f);let d;
   if(v('pamode')==='raster'){const pj=await openPdfjs(data);d=await PDFDocument.create();for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);await rasterInto(d,pj,i,{scale:2,q:.9});}}
   else{d=await PDFDocument.load(data);}
   const title=base(f.name),now=new Date(),iso=now.toISOString().replace(/\.\d+Z$/,'Z');d.setTitle(title);d.setProducer('FreePDF');d.setCreator('FreePDF');d.setCreationDate(now);d.setModificationDate(now);
   const xe=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
   const xmp=`<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/"><pdfaid:part>2</pdfaid:part><pdfaid:conformance>B</pdfaid:conformance><dc:format>application/pdf</dc:format><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xe(title)}</rdf:li></rdf:Alt></dc:title><xmp:CreateDate>${iso}</xmp:CreateDate><xmp:ModifyDate>${iso}</xmp:ModifyDate><xmp:CreatorTool>FreePDF</xmp:CreatorTool><pdf:Producer>FreePDF</pdf:Producer></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
   const ctx=d.context;const meta=ctx.stream(new TextEncoder().encode(xmp),{Type:'Metadata',Subtype:'XML'});d.catalog.set(PDFName.of('Metadata'),ctx.register(meta));
   const icc=new Uint8Array(await (await fetch('/fonts/sRGB2014.icc')).arrayBuffer());const iccS=ctx.flateStream(icc,{N:3});const iccRef=ctx.register(iccS);
   d.catalog.set(PDFName.of('OutputIntents'),ctx.obj([ctx.obj({Type:'OutputIntent',S:'GTS_PDFA1',OutputConditionIdentifier:PDFString.of('sRGB IEC61966-2.1'),Info:PDFString.of('sRGB IEC61966-2.1'),DestOutputProfile:iccRef})]));
   const id=PDFHexString.of([...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join(''));ctx.trailerInfo.ID=ctx.obj([id,id]);
   for(const k of ['OpenAction','AA','JavaScript'])try{d.catalog.delete(PDFName.of(k));}catch(e){}
   return {blob:pdfBlob(await d.save({useObjectStreams:false})),name:base(f.name)+'-pdfa.pdf'};}},
 // ---------- Extract images ----------
 extractimages:{opts:()=>sel('eifmt',T.o_format,[['png','PNG'],['jpg','JPG']])+inp('eimin',T.o_minPx,'number','16','min="1"'),
  async run([f],status){const pj=await L.pdfjs();const doc=await openPdfjs(await buf(f));const OPS=pj.OPS;const items=[];const seen=new Set();const png=v('eifmt')==='png',min=+v('eimin')||1;
   for(let i=1;i<=doc.numPages;i++){status(`${T.working} ${i}/${doc.numPages}`);const pg=await doc.getPage(i);const ol=await pg.getOperatorList();
    for(let k=0;k<ol.fnArray.length;k++){const fn=ol.fnArray[k];if(fn!==OPS.paintImageXObject&&fn!==OPS.paintInlineImageXObject&&fn!==OPS.paintImageXObjectRepeat)continue;let img;
     if(fn===OPS.paintInlineImageXObject)img=ol.argsArray[k][0];else{const name=ol.argsArray[k][0];if(seen.has(name))continue;seen.add(name);img=await new Promise(res=>{const store=name.startsWith('g_')?pg.commonObjs:pg.objs;try{store.get(name,res);}catch(e){res(null);}});}
     if(!img)continue;const c=imgToCanvas(img);if(!c||c.width<min||c.height<min)continue;items.push({name:`${base(f.name)}-p${i}-${items.length+1}.${png?'png':'jpg'}`,blob:await toBlob(c,png?'image/png':'image/jpeg',.92)});}
    pg.cleanup();}
   if(!items.length)throw new Error(T.o_noImages);return {...await zipOrOne(items,base(f.name)+'-images.zip'),info:`${items.length} image(s)`};}},
 // ---------- Find & replace (visual, best effort) ----------
 findreplace:{opts:()=>inp('frfind',T.o_find,'text','')+inp('frrep',T.o_replace,'text','')+chk('frcase',T.o_matchCase,true),
  async run([f]){const {PDFDocument,rgb}=await L.pdflib();const data=await buf(f);const pj=await openPdfjs(data);const d=await PDFDocument.load(data);const q=v('frfind'),rep=v('frrep')||'';if(!q)throw new Error(T.o_find);const cs=vb('frcase');let hits=0;
   const tx=await pageTexts(pj);const pages=d.getPages();
   for(let pi=0;pi<tx.length;pi++){const p=pages[pi];const {x:bx,y:by}=p.getCropBox();const view=pj?null:null;
    for(const it of tx[pi].items){const s=cs?it.str:it.str.toLowerCase(),qq=cs?q:q.toLowerCase();let at=s.indexOf(qq);if(at<0)continue;if(Math.abs(it.transform[1])>0.01||Math.abs(it.transform[2])>0.01)continue;
     const fs=Math.abs(it.transform[3])||Math.abs(it.transform[0])||10;const cw=it.width/Math.max(1,it.str.length);
     while(at>=0){hits++;const x=it.transform[4]+cw*at,y=it.transform[5];p.drawRectangle({x:x-0.5,y:y-fs*.22,width:cw*q.length+1,height:fs*1.12,color:rgb(1,1,1)});if(rep)await drawText(d,p,rep,{x,y,size:fs,color:rgb(0,0,0)});at=s.indexOf(qq,at+qq.length);}}}
   if(!hits)throw new Error(T.o_notFound+': '+q);
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-replaced.pdf',info:`${hits} replacement(s)`};}}
});
function imgToCanvas(img){if(img.bitmap){const c=document.createElement('canvas');c.width=img.bitmap.width;c.height=img.bitmap.height;c.getContext('2d').drawImage(img.bitmap,0,0);return c;}
 if(typeof ImageBitmap!=='undefined'&&img instanceof ImageBitmap){const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);return c;}
 if(!img.data||!img.width)return null;const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');const id=ctx.createImageData(img.width,img.height);const src=img.data,dst=id.data,n=img.width*img.height;
 if(img.kind===3||src.length===n*4)dst.set(src.subarray?src.subarray(0,n*4):src.slice(0,n*4));
 else if(img.kind===2||src.length===n*3){for(let i=0,j=0;i<n;i++){dst[j++]=src[i*3];dst[j++]=src[i*3+1];dst[j++]=src[i*3+2];dst[j++]=255;}}
 else{const rb=(img.width+7)>>3;for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){const bit=(src[y*rb+(x>>3)]>>(7-(x&7)))&1;const v=bit?255:0,o=(y*img.width+x)*4;dst[o]=dst[o+1]=dst[o+2]=v;dst[o+3]=255;}}
 ctx.putImageData(id,0,0);return c;}
function detectSkew(c,maxA){const s=Math.min(1,1000/Math.max(c.width,c.height));const w=Math.round(c.width*s),h=Math.round(c.height*s);const t=document.createElement('canvas');t.width=w;t.height=h;const x=t.getContext('2d');x.drawImage(c,0,0,w,h);const d=x.getImageData(0,0,w,h).data;
 const pts=[];for(let yy=0;yy<h;yy+=1)for(let xx=0;xx<w;xx+=2){const o=(yy*w+xx)*4;if(d[o]+d[o+1]+d[o+2]<384)pts.push(xx-w/2,yy-h/2);}t.width=0;if(pts.length<50)return 0;
 const score=a=>{const r=a*Math.PI/180,sn=Math.sin(r),cs=Math.cos(r);const bins=new Float64Array(h*2+4);for(let i=0;i<pts.length;i+=2){const y=Math.round(pts[i+1]*cs-pts[i]*sn+h);if(y>=0&&y<bins.length)bins[y]++;}let sc=0;for(const b of bins)sc+=b*b;return sc;};
 let best=0,bs=-1;for(let a=-maxA;a<=maxA;a+=0.5){const sc=score(a);if(sc>bs){bs=sc;best=a;}}const c0=best;for(let a=c0-0.5;a<=c0+0.5;a+=0.05){const sc=score(a);if(sc>bs){bs=sc;best=a;}}return best;}
function diffLines(a,b){const n=a.length,m=b.length;if(n*m>25e6)throw new Error('Documents too large to compare in the browser');const dp=Array.from({length:n+1},()=>new Uint32Array(m+1));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const ops=[];let i=0,j=0;while(i<n&&j<m){if(a[i]===b[j]){ops.push({t:'=',i,j});i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])ops.push({t:'-',i:i++});else ops.push({t:'+',j:j++});}while(i<n)ops.push({t:'-',i:i++});while(j<m)ops.push({t:'+',j:j++});return ops;}
function wordDiff(x,y){const a=x.split(/(\s+)/),b=y.split(/(\s+)/);const ops=diffLines(a,b);let l='',r='';for(const o of ops){if(o.t==='=')l+=esc(a[o.i]),r+=esc(b[o.j]);else if(o.t==='-')l+=`<del>${esc(a[o.i])}</del>`;else r+=`<ins>${esc(b[o.j])}</ins>`;}return [l,r];}
// --- Upgrade Edit + Word->PDF to multi-script Noto fonts ---
TOOLS.edit.run=async function([f]){if(!this.items.length)throw new Error(T.o_clickPlace);const {PDFDocument,rgb}=await L.pdflib();const d=await PDFDocument.load(await buf(f));
 for(const it of this.items){const p=d.getPage(it.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();
  if(it.type==='white')p.drawRectangle({x:bx+it.fx*W,y:by+H-(it.fy+it.fh)*H,width:it.fw*W,height:it.fh*H,color:rgb(1,1,1)});
  else await drawText(d,p,it.text,{x:bx+it.fx*W,y:by+H-it.fy*H-it.fs*0.8,size:it.fs,color:hex2rgb(it.color)});}
 return {blob:pdfBlob(await d.save()),name:base(f.name)+'-edited.pdf'};};
TOOLS.word2pdf.run=async function([f]){const mammoth=await L.mammoth();const {value:html}=await mammoth.convertToHtml({arrayBuffer:await buf(f)});const {PDFDocument,rgb}=await L.pdflib();const d=await PDFDocument.create();
 const W=595.28,H=841.89,M=56;let page=d.addPage([W,H]),y=H-M;const newPage=()=>{page=d.addPage([W,H]);y=H-M;};
 const dom=new DOMParser().parseFromString(`<div>${html}</div>`,'text/html').body.firstChild;
 const runsOf=(node,st={b:false},acc=[])=>{for(const n of node.childNodes){if(n.nodeType===3)acc.push({t:n.textContent,...st});else if(n.nodeType===1){if(n.tagName==='BR'){acc.push({br:true});continue;}if(n.tagName==='IMG')continue;runsOf(n,{b:st.b||n.tagName==='STRONG'||n.tagName==='B'},acc);}}return acc;};
 const block=async(el,size,indent,prefix,forceBold)=>{const rs=runsOf(el);if(prefix)rs.unshift({t:prefix,b:false});const lh=size*1.45;const maxW=W-2*M-indent;let line=[],lw=0;
  const flush=()=>{if(y-lh<M)newPage();y-=lh;let x=M+indent;for(const w of line){drawRuns(page,w.runs,{x,y,size,color:rgb(.1,.1,.1)});x+=w.w;}line=[];lw=0;};
  for(const r of rs){if(r.br){flush();continue;}for(const tok of r.t.split(/(\s+)/)){if(!tok)continue;const t=/^\s+$/.test(tok)?' ':tok;if(!line.length&&t===' ')continue;const runs=await textRuns(d,t,r.b||forceBold);const tw=runsWidth(runs,size);if(lw+tw>maxW&&line.length&&t!==' ')flush();if(!line.length&&t===' ')continue;line.push({runs,w:tw});lw+=tw;}}
  if(line.length)flush();y-=size*0.5;};
 const walk=async(node,depth=0)=>{for(const el of [...node.children]){const tg=el.tagName;if(/^H[1-6]$/.test(tg)){const s=[22,18,15,13,12,11][+tg[1]-1];y-=s*0.4;await block(el,s,0,'',true);}else if(tg==='P')await block(el,11,0,'');
  else if(tg==='UL'||tg==='OL'){let k=1;for(const li of [...el.children]){const sub=[...li.children].filter(c=>c.tagName==='UL'||c.tagName==='OL');sub.forEach(s=>s.remove());await block(li,11,18+depth*18,tg==='OL'?`${k++}. `:'• ');for(const s of sub)await walk({children:[s]},depth+1);}}
  else if(tg==='TABLE'){for(const tr of el.querySelectorAll('tr')){const p=document.createElement('p');p.textContent=[...tr.children].map(c=>c.textContent.trim()).join('   |   ');await block(p,10,0,'');}}else await walk(el,depth);}};
 await walk(dom);return {blob:pdfBlob(await d.save()),name:base(f.name)+'.pdf'};};
