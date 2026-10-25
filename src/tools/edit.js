// @needs pdfx edcs
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
  for(const r of rows){r.items.sort((a,b)=>a.x-b.x);let cur=null;for(const it of r.items){const gap=cur?it.x-(cur.x+cur.w):0;if(!cur||gap>Math.max(it.size,cur.size)*1.5||Math.abs(it.size-cur.size)>cur.size*0.25){cur={x:it.x,base:it.y,w:0,size:it.size,asc:it.asc,text:'',font:it.font,bold:it.bold,italic:it.italic,vec:1};lines.push(cur);}
   if(cur.text&&gap>it.size*0.12&&!/\s$/.test(cur.text)&&!/^\s/.test(it.str))cur.text+=' ';cur.text+=it.str;cur.w=Math.max(cur.w,it.x+it.w-cur.x);}}}
 else{status&&status('Detecting text in the image (OCR)…');const w=await edOcr();const r=await w.recognize(c,{},{text:true,tsv:true});ocr=true;const L={};
  for(const q of r.data.tsv.split('\n').slice(1).map(l=>l.split('\t'))){if(q.length<12||q[0]!=='5'||!q[11].trim()||+q[10]<55)continue;const k=q.slice(1,5).join('.');(L[k]=L[k]||[]).push({x:+q[6],y:+q[7],w:+q[8],h:+q[9],t:q[11]});}
  for(const ws of Object.values(L)){const bots=ws.map(w=>w.y+w.h).sort((a,b)=>a-b);const base=bots[Math.floor((bots.length-1)*0.2)];const top=Math.min(...ws.map(w=>w.y));if((base-top)>c.height*0.12)continue;const x0=Math.min(...ws.map(w=>w.x)),x1=Math.max(...ws.map(w=>w.x+w.w));
   lines.push({x:x0/sc,base:base/sc,w:(x1-x0)/sc,size:Math.max(4,(base-top)/0.72/sc),asc:0.78,text:ws.map(w=>w.t).join(' '),font:'sans',bold:false,italic:false,ocrBot:Math.max(...ws.map(w=>w.y+w.h))/sc});}}
 lines=lines.filter(l=>l.text.trim());
 for(const l of lines){const top=l.base-l.size*l.asc-1,bot=Math.max(l.base+l.size*0.25,l.ocrBot||0)+1;const sm=edSample(ctx,(l.x-1)*sc,top*sc,(l.x+l.w+1)*sc,bot*sc);l.color=sm.ink;l.bg=sm.bg;l.text=l.text.replace(/\s+/g,' ').trim();
  l.cov={fx:(l.x-1.5)/VW,fy:(top-0.5)/VH,fw:(l.w+3)/VW,fh:(bot-top+1)/VH,vec:!!l.vec};l.fx=l.x/VW;l.fy=(l.base-l.size*0.97)/VH;l.fs=Math.round(l.size*2)/2;}
 c.width=0;return {lines,ocr};}
// Remove the original glyphs of edited text lines from the content streams and, where possible, redraw the new text with the original embedded font.
// Returns Map(item -> {drawn}) for items whose original text was removed (no cover needed).
async function edRemove(d,items,L){const done=new Map();const want=items.filter(x=>x.cov?.vec);if(!want.length)return done;const P=await L.pdflib();await edStdW(P);
 const pages=[...new Set(want.map(x=>x.page))];
 for(const pn of pages){try{const p=d.getPage(pn-1);const mp=edMap(p);const its=want.filter(x=>x.page===pn);const acc=EDCS.analyse(d,P,pn-1);
  const rect=c=>{const a=mp(c.fx,c.fy),b=mp(c.fx+c.fw,c.fy+c.fh);return [Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];};
  const R=its.map(it=>rect(it.cov));const {hit}=EDCS.removeText(d,P,acc,R);
  const ok=its.map((it,i)=>{const n=(it.o?.text||'').replace(/\s/g,'').length;const h=hit[i].filter(g=>!/^\s*$/.test(g.uni||'x')).length;return n>0&&h>=n*0.8&&h<=n*1.5+2&&!hit[i].some(g=>g.Tr===3||g.Tr===7);});
  const good=its.filter((_,i)=>ok[i]);if(!good.length)continue;const {reps}=EDCS.removeText(d,P,acc,R.filter((_,i)=>ok[i]));
  // try original font for unchanged-style single-line text
  let extra='';const res=p.node.Resources();let fdict=res.lookup(P.PDFName.of('Font'));if(!fdict){fdict=d.context.obj({});res.set(P.PDFName.of('Font'),fdict);}let fid=0;const fname={};
  for(const it of good){const i=its.indexOf(it);const gl=hit[i];const info={drawn:false};done.set(it,info);const t=it.text;
   if(!t.trim()){info.drawn=true;continue;}
   const o=it.o||{};if(t.includes('\n')||it.font!==o.font||!!it.bold!==!!o.bold||!!it.italic!==!!o.italic)continue;
   const g0=gl.slice().sort((a,b)=>a.oi-b.oi||a.ei-b.ei||a.k-b.k)[0];const f=g0.font;if(!f||f.type3||!gl.every(g=>g.font===f))continue;
   const rev={};const src=f.tu||(f.twoByte?null:EDCS.WINANSI);if(!src)continue;for(const [c,u] of Object.entries(src))if(u&&u.length===1&&!(u in rev)&&(f.w[c]>0||u===' '))rev[u]=+c;
   let parts=[];let okc=true;for(const ch of t){const c=rev[ch];if(c===undefined){if(ch===' '){parts.push(-280);continue;}okc=false;break;}parts.push(f.twoByte?String.fromCharCode(c>>8,c&255):String.fromCharCode(c));}if(!okc)continue;
   let nm=fname[f.ref.toString()];if(!nm){if(!g0.inForm&&res.lookup(P.PDFName.of('Font'))===fdict&&fdict.get(P.PDFName.of(g0.fname))===f.ref)nm=g0.fname;else{do{nm='EdF'+(fid++);}while(fdict.get(P.PDFName.of(nm)));fdict.set(P.PDFName.of(nm),f.ref);}fname[f.ref.toString()]=nm;}
   const sc=(it.fs||o.fs)/(o.fs||it.fs||1);const a0=mp(o.fx||0,o.fy||0),a1=mp(it.fx,it.fy);const dx=a1[0]-a0[0],dy=a1[1]-a0[1];const M=g0.trm;const mm=[M[0],M[1],M[2],M[3],M[4]+dx,M[5]+dy];
   const fill=(it.color===o.color&&/^[\d.\s-]+(g|rg|k)$/.test(g0.fill.trim()))?g0.fill:(()=>{const h=it.color||'#000000';return [1,3,5].map(k=>EDCS.num(parseInt(h.substr(k,2),16)/255)).join(' ')+' rg';})();
   const tj='['+parts.map(x=>typeof x==='number'?String(x):EDCS.hexs(x)).join(' ')+'] TJ';
   extra+=`\nq ${mm.map(EDCS.num).join(' ')} cm BT /${nm} ${EDCS.num(g0.fs*sc)} Tf ${EDCS.num(g0.Th*100)} Tz 0 Tc 0 Tw 0 Tr ${fill} 0 0 Td ${tj} ET Q`;info.drawn=true;}
  const len=acc.streams.p.content.length;if(extra)reps.push({path:'p',s:0,e:0,rep:'q\n'},{path:'p',s:len,e:len,rep:'\nQ'+extra+'\n'});
  EDCS.commit(d,P,acc,reps);}catch(e){console.warn('edRemove page',pn,e);for(const it of want.filter(x=>x.page===pn))done.delete(it);}}
 return done;}
// ---- existing page objects (images + vector paths) ----
function edUnmap(p){const m=edMap(p);const o=m(0,0),a=m(1,0),b=m(0,1);const ax=a[0]-o[0],ay=a[1]-o[1],bx=b[0]-o[0],by=b[1]-o[1];const det=ax*by-ay*bx;return (ux,uy)=>{const dx=ux-o[0],dy=uy-o[1];return [(dx*by-dy*bx)/det,(ax*dy-ay*dx)/det];};}
// list objects of a page as view-fraction boxes
function edObjList(d,P,pn){const p=d.getPage(pn-1);const um=edUnmap(p);const acc=EDCS.analyse(d,P,pn-1);const out=[];
 acc.objs.forEach((o,k)=>{const [x0,y0,x1,y1]=o.bb;if(!isFinite(x0))return;const a=um(x0,y0),b=um(x1,y1);const fx=Math.min(a[0],b[0]),fy=Math.min(a[1],b[1]),fw=Math.abs(a[0]-b[0]),fh=Math.abs(a[1]-b[1]);
  if(fx>1||fy>1||fx+fw<0||fy+fh<0)return;if(fw<0.004&&fh<0.004)return;if(fw*fh>0.97)return; // skip invisible, specks and full-page backgrounds
  out.push({k,kind:o.kind,inline:!!o.inline,fill:!!o.fill,stroke:!!o.stroke,fx,fy,fw:Math.max(fw,0.004),fh:Math.max(fh,0.004)});});
 out.sort((a,b)=>b.fw*b.fh-a.fw*a.fh);return out;}
const edHexRgb=h=>{const n=parseInt(h.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255].map(EDCS.num).join(' ');};
const edObjChanged=it=>it.del||it.fill||it.stroke||it.rep||['fx','fy','fw','fh'].some(k=>Math.abs(it[k]-it.o[k])>1e-4);
// clip path that only affects this image: `q [marked/gs/cm] <clip W n> [q cm gs] IMG [Q] ... Q`
function edOwnClip(acc,o){const st=acc.streams[o.path];const O=st.O;const i0=o.inline?o.oi-2:o.oi;const cl=(acc.clips||[]).filter(c=>c.path===o.path&&c.oi<i0).pop();if(!cl)return null;
 const neutral=new Set(['BDC','BMC','EMC','MP','DP','gs','cm','w','J','j','M','d','ri','i']);let k=0;for(let i=cl.oi+1;i<i0;i++){const op=O[i].op;if(op==='q')k++;else if(op==='Q'){if(--k<0)return null;}else if(!neutral.has(op))return null;}
 let j=(o.inline?o.oi:o.oi)+1;for(;j<O.length;j++){const op=O[j].op;if(op==='Q'){if(k===0)break;k--;}else if(op==='q'||!neutral.has(op))return null;}
 for(let i=cl.oi0-1;i>=0;i--){const op=O[i].op;if(op==='q')return cl;if(!neutral.has(op))return null;}return cl;}
// apply object edits for one page directly in the content streams
async function edObjApply(d,P,items,pn,imgs,cache){const its=items.filter(x=>x.type==='obj'&&x.page===pn&&edObjChanged(x));if(!its.length)return 0;
 const p=d.getPage(pn-1);const mp=edMap(p);const acc=EDCS.analyse(d,P,pn-1);const N=n=>P.PDFName.of(n);const reps=[];let nimg=0;
 const ubox=(fx,fy,fw,fh)=>{const a=mp(fx,fy),b=mp(fx+fw,fy+fh);return [Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];};
 for(const it of its){const o=acc.objs[it.k];if(!o)continue;const st=acc.streams[o.path];const span=st.content.slice(o.s,o.e);
  if(it.del){reps.push({path:o.path,s:o.s,e:o.e,rep:' '});continue;}
  let pre='',body=span;
  if(['fx','fy','fw','fh'].some(k=>Math.abs(it[k]-it.o[k])>1e-4)){const A=ubox(it.o.fx,it.o.fy,it.o.fw,it.o.fh),B=ubox(it.fx,it.fy,it.fw,it.fh);const sx=(B[2]-B[0])/((A[2]-A[0])||1),sy=(B[3]-B[1])/((A[3]-A[1])||1);
   const U=[sx,0,0,sy,B[0]-sx*A[0],B[1]-sy*A[1]];const C=o.ctm;const M=EDCS.mul(EDCS.mul(C,U),EDCS.inv(C));pre+=M.map(EDCS.num).join(' ')+' cm ';
   if(o.kind==='img'){const cl=edOwnClip(acc,o);if(cl){const Mc=EDCS.mul(EDCS.mul(cl.ctm,U),EDCS.inv(cl.ctm));reps.push({path:o.path,s:cl.s,e:cl.e,rep:' '+Mc.map(EDCS.num).join(' ')+' cm '+st.content.slice(cl.s,cl.e)+' '+EDCS.inv(Mc).map(EDCS.num).join(' ')+' cm '});it._clip=1;}}}
  if(o.kind==='path'){if(it.fill)pre+=edHexRgb(it.fill)+' rg ';if(it.stroke)pre+=edHexRgb(it.stroke)+' RG ';}
  if(o.kind==='img'&&it.rep&&imgs[it.rep]){let im=cache[it.rep];if(!im){const b=imgs[it.rep].blob;let bytes=await b.arrayBuffer();const isJ=/jpe?g/.test(b.type);if(!isJ&&!/png/.test(b.type)){const c=document.createElement('canvas');const ii=new Image();ii.src=imgs[it.rep].url;await ii.decode();c.width=ii.naturalWidth;c.height=ii.naturalHeight;c.getContext('2d').drawImage(ii,0,0);bytes=await (await toBlob(c,'image/png')).arrayBuffer();}im=cache[it.rep]=isJ?await d.embedJpg(bytes):await d.embedPng(bytes);}
   let res=o.res;if(!res){res=d.context.obj({});p.node.set(N('Resources'),res);}let xd=res.get(N('XObject'));xd=xd instanceof P.PDFRef?d.context.lookup(xd):xd;if(!xd){xd=d.context.obj({});res.set(N('XObject'),xd);}
   const nm='EdIm'+(Date.now()%1e6)+'_'+(nimg++);xd.set(N(nm),im.ref);body=`/${nm} Do`;}
  reps.push({path:o.path,s:o.s,e:o.e,rep:`\nq ${pre}${body}\nQ\n`});}
 if(reps.length)EDCS.commit(d,P,acc,reps);return reps.length;}
function edShapeSvg(it,pxpt,lay){const W=Math.max(1,it.fw*lay.clientWidth),H=Math.max(1,it.fh*lay.clientHeight),sw=it.sw*pxpt,c=it.color;const pad=sw/2;
 if(it.shape==='hl')return `<svg width="100%" height="100%" style="position:absolute;inset:0;overflow:visible" aria-hidden="true"><rect width="100%" height="100%" fill="${c}" fill-opacity=".4"/></svg>`;
 if(it.shape==='rect')return `<svg width="100%" height="100%" style="position:absolute;inset:0;overflow:visible" aria-hidden="true"><rect x="0" y="0" width="100%" height="100%" fill="none" stroke="${c}" stroke-width="${sw}"/></svg>`;
 if(it.shape==='ell')return `<svg width="100%" height="100%" style="position:absolute;inset:0;overflow:visible" aria-hidden="true"><ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="none" stroke="${c}" stroke-width="${sw}"/></svg>`;
 if(it.shape==='pen'){const pts=it.pts.map(([x,y])=>`${(x-it.fx)/it.fw*W},${(y-it.fy)/it.fh*H}`).join(' ');return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;inset:0;overflow:visible" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
 const [x1,y1,x2,y2]=edLineEnds(it,W,H);const ah=it.shape==='arrow'?edArrow(x1,y1,x2,y2,sw):'';return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;inset:0;overflow:visible" aria-hidden="true"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>${ah?`<polygon points="${ah.map(p=>p.join(',')).join(' ')}" fill="${c}"/>`:''}</svg>`;}
function edLineEnds(it,W,H){let a=[0,it.flip?H:0],b=[W,it.flip?0:H];if(it.rev)[a,b]=[b,a];return [a[0],a[1],b[0],b[1]];}
function edArrow(x1,y1,x2,y2,sw){const L=Math.max(8,sw*4),an=Math.atan2(y2-y1,x2-x1);return [[x2,y2],[x2-L*Math.cos(an-0.45),y2-L*Math.sin(an-0.45)],[x2-L*Math.cos(an+0.45),y2-L*Math.sin(an+0.45)]];}
async function edShapePdf(d,p,it,m,VW,VH,rgb,hex2rgb){const P=await L.pdflib();const col=hex2rgb(it.color||'#000000');const a=m(it.fx,it.fy),b=m(it.fx+it.fw,it.fy+it.fh);const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(a.x-b.x),h=Math.abs(a.y-b.y);
 if(it.type==='link'){const N=P.PDFName,href=it.href||'';let A;if(/^\d+$/.test(href)){const tp=d.getPage(Math.min(d.getPageCount(),Math.max(1,+href))-1);A={Dest:[tp.ref,N.of('Fit')]};}else{const u=/^(https?:|mailto:|tel:)/i.test(href)?href:'https://'+href;A={A:{Type:'Action',S:'URI',URI:P.PDFString.of(u)}};}
  const an=d.context.register(d.context.obj({Type:'Annot',Subtype:'Link',Rect:[x,y,x+w,y+h],Border:[0,0,0],...A}));let arr=p.node.lookup(N.of('Annots'));if(!arr){arr=d.context.obj([]);p.node.set(N.of('Annots'),arr);}arr.push(an);return;}
 if(it.shape==='hl'){p.drawRectangle({x,y,width:w,height:h,color:col,opacity:0.4,blendMode:P.BlendMode?P.BlendMode.Multiply:undefined});return;}
 if(it.shape==='rect'){p.drawRectangle({x,y,width:w,height:h,borderColor:col,borderWidth:it.sw});return;}
 if(it.shape==='ell'){p.drawEllipse({x:x+w/2,y:y+h/2,xScale:w/2,yScale:h/2,borderColor:col,borderWidth:it.sw});return;}
 if(it.shape==='pen'){for(let i=1;i<it.pts.length;i++){const s=m(...it.pts[i-1]),e=m(...it.pts[i]);p.drawLine({start:s,end:e,thickness:it.sw,color:col,lineCap:P.LineCapStyle?P.LineCapStyle.Round:undefined});}return;}
 const W=it.fw,H=it.fh;let s0=[it.fx,it.flip?it.fy+H:it.fy],e0=[it.fx+W,it.flip?it.fy:it.fy+H];if(it.rev)[s0,e0]=[e0,s0];const s=m(...s0),e=m(...e0);p.drawLine({start:s,end:e,thickness:it.sw,color:col});
 if(it.shape==='arrow'){const ah=edArrow(s.x,s.y,e.x,e.y,it.sw);p.drawSvgPath(`M ${ah[0][0]} ${-ah[0][1]} L ${ah[1][0]} ${-ah[1][1]} L ${ah[2][0]} ${-ah[2][1]} Z`,{x:0,y:0,color:col});}}
TOOLS.edit={noAdv:true,
 async setup(files){const S=this;S.items=[];S.imgs={};S.hist=[];S.src={};S.objs={};let uid=1;S.bytes=await buf(files[0]);
  const doc=await openPdfjs(S.bytes.slice(0));const N=doc.numPages;S.dims=[];
  const w=document.createElement('div');w.className='ped';
  w.innerHTML=`<div class="ptb" role="toolbar">
   <div class="pmodes"><button type="button" data-m="edit" class="on">✎ ${esc(T.o_editExisting||"Edit existing text")}</button><button type="button" data-m="text">T ${esc(T.o_addText||'Add text')}</button><button type="button" data-m="white">▭ ${esc(T.o_whiteout||'White-out')}</button><button type="button" data-m="obj" title="Select, move, resize, delete or recolour images, logos and shapes already on the page">◧ ${esc(T.o_objects||'Images & shapes')}</button><button type="button" data-m="shape">◯ ${esc(T.o_shapes||'Highlight & shapes')}</button><button type="button" data-m="link">🔗 ${esc(T.o_link||'Link')}</button><button type="button" data-m="move">✥ ${esc(T.o_select||'Select / move')}</button><button type="button" id="pimg">🖼 ${esc(T.o_image||'Image')}</button><button type="button" id="psig">✍ ${esc(T.o_signature||'Signature')}</button><input type="file" id="pimgf" accept="image/*" hidden></div>
   <div class="pfmt"><select id="pfont" aria-label="Font">${ED_FONTS.map(f=>`<option value="${f[0]}">${f[1]}</option>`).join('')}</select><input id="psize" type="number" min="4" max="200" value="14" aria-label="Font size" title="Font size (pt)"><input id="pcol" type="color" value="#000000" aria-label="Text color"><button type="button" id="pb" aria-pressed="false" title="Bold"><b>B</b></button><button type="button" id="pi" aria-pressed="false" title="Italic"><i>I</i></button><button type="button" id="pdel" title="Delete selected">🗑</button><button type="button" id="pundo" title="Undo">↶</button><button type="button" id="predo" title="Redo">↷</button><select id="pshape" aria-label="Shape"><option value="hl">Highlight</option><option value="rect">Rectangle</option><option value="ell">Ellipse</option><option value="line">Line</option><option value="arrow">Arrow</option><option value="pen">Freehand pen</option></select><input id="psw" type="number" min="0.5" max="20" step="0.5" value="2" aria-label="Line width" title="Line width (pt)"></div>
   <div class="pobjp" hidden><span id="poinfo"></span><label id="pofl">Fill <input type="color" id="pofill" value="#000000"></label><label id="postl">Stroke <input type="color" id="postr" value="#000000"></label><button type="button" id="porep">Replace image</button><input type="file" id="porepf" accept="image/*" hidden><button type="button" id="podel">🗑 Delete</button><button type="button" id="poreset">Reset</button></div></div>
   <div class="pfr"><input id="pfind" placeholder="Find"><input id="prepl" placeholder="Replace with"><button type="button" id="pfrb">Replace all</button><button type="button" id="pocr" title="Recognise text in images on this page">🔍 OCR this page</button></div><p class="hint" id="phint"></p><p class="hint warn" id="pwarn" hidden></p>
   <div class="pnav"><button type="button" id="pprev" aria-label="Previous page">‹</button><span id="pnum"></span><button type="button" id="pnext" aria-label="Next page">›</button></div>
   <div class="pstage"><div class="ppage"><canvas></canvas><div class="play"></div></div></div>`;
  const q=s=>w.querySelector(s),stage=q('.pstage'),pg=q('.ppage'),cv=q('canvas'),lay=q('.play');
  let page=1,mode='edit',selId=null,pxpt=1,busy=0;
  const hint=()=>{const n=S.items.filter(x=>x.type==='obj'?edObjChanged(x):(x.type!=='text'||x.text.trim()||x.cov)).length;const go=document.querySelector('#go');if(go)go.disabled=!n;
   q('#phint').textContent=n?`${n} edit(s) added. Drag to move, corner ● to resize. Press Start when done.`:mode==='white'?'Drag on the page to cover something with a white box.':mode==='obj'?(S.objs?.[page]?.length?'Tap an image, logo or shape on the page to select it: drag to move, corner ● to resize, or use the bar above to recolour, replace or delete.':'No images or vector shapes found on this page.'):mode==='shape'?'Drag on the page to draw the selected shape (choose highlight, rectangle, ellipse, line, arrow or pen above; colour = text colour).':mode==='link'?'Drag a box over the area that should be clickable, then enter a web address, e-mail or page number.':mode==='move'?'Tap an item to select it, drag to move.':mode==='edit'?'Tap any existing text on the page to edit it (scanned pages are read with OCR automatically).':'Tap/click anywhere on the page to add text there, then type. Start unlocks after your first edit.';};
  S._hint=hint;
  const snap=()=>{S.hist.push(JSON.stringify(S.items));if(S.hist.length>100)S.hist.shift();};
  const convert=(pg,k,text)=>{const l=S.src[pg][k];snap();const it={id:uid++,type:'text',page:pg,srcK:k,fx:l.fx,fy:l.fy,text:text??l.text,orig:l.text,fs:l.fs,color:l.color,font:l.font,bold:l.bold,italic:l.italic,cov:{...l.cov,bg:l.bg},o:{fx:l.fx,fy:l.fy,fs:l.fs,color:l.color,font:l.font,bold:l.bold,italic:l.italic,text:l.text}};S.items.push(it);return it;};
  async function loadSrc(pg){if(S.src[pg])return;const r=await edLines(doc,pg,true,m=>q('#phint').textContent=m);S.src[pg]=r.lines;if(r.ocr&&pg===page)setTimeout(()=>q('#phint').textContent=`Image-only page: OCR found ${r.lines.length} text line(s). Tap one to edit, drag ✥ to move.`,0);}
  async function edLinesOcr(pg){const r=await edLines(doc,pg,true,m=>q('#phint').textContent=m,true);return r.lines;}
  const cur=()=>S.items.find(x=>x.id===selId);
  async function pageFor(pg){const ch=S.items.filter(x=>x.type==='obj'&&x.page===pg&&edObjChanged(x));if(!ch.length)return doc.getPage(pg);const key=JSON.stringify(ch);S.pv=S.pv||{};if(S.pv[pg]?.key!==key){try{const P=await L.pdflib();S.pd0=S.pd0||await P.PDFDocument.load(S.bytes,{ignoreEncryption:true});const dd=await P.PDFDocument.load(S.bytes,{ignoreEncryption:true});await edObjApply(dd,P,S.items,pg,S.imgs,{});const nd=await P.PDFDocument.create();const [cp]=await nd.copyPages(dd,[pg-1]);nd.addPage(cp);const pdoc=await openPdfjs(await nd.save());S.pv[pg]={key,doc:pdoc};}catch(e){console.warn('preview',e);return doc.getPage(pg);}}return S.pv[pg].doc.getPage(1);}
  async function loadObjs(pg){if(S.objs[pg])return;try{const P=await L.pdflib();S.pd0=S.pd0||await P.PDFDocument.load(S.bytes,{ignoreEncryption:true});await edStdW(P);S.objs[pg]=edObjList(S.pd0,P,pg);}catch(e){console.warn('objs',e);S.objs[pg]=[];}}
  let pvT;const repaint=()=>{clearTimeout(pvT);pvT=setTimeout(()=>show(),250);};S._repaint=repaint;
  async function show(){const my=++busy;const p=await pageFor(page);const vp1=p.getViewport({scale:1});S.dims[page]={w:vp1.width,h:vp1.height};
   const cssW=Math.max(260,Math.min(stage.clientWidth||document.querySelector('#tool .custom')?.clientWidth||800,1100));const dpr=Math.min(2,window.devicePixelRatio||1);let sc=cssW*dpr/vp1.width;const maxPx=14e6;if(vp1.width*vp1.height*sc*sc>maxPx)sc=Math.sqrt(maxPx/(vp1.width*vp1.height));
   const vp=p.getViewport({scale:sc});const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);await p.render({canvasContext:ctx,viewport:vp}).promise;
   if(my!==busy)return;cv.width=c.width;cv.height=c.height;cv.getContext('2d').drawImage(c,0,0);c.width=0;
   pg.style.width=cssW+'px';pg.style.aspectRatio=vp1.width+'/'+vp1.height;pxpt=cssW/vp1.width;q('#pnum').textContent=`${T.o_page||'Page'} ${page} / ${N}`;q('#pprev').disabled=page<=1;q('#pnext').disabled=page>=N;draw();if(S._post){const f=S._post;S._post=null;f();}if(mode==='obj'&&!S.objs[page]){const pp=page;loadObjs(pp).then(()=>{if(page===pp)draw();});}if(!S.src[page]){const pp=page;loadSrc(pp).then(()=>{if(page===pp)draw();}).catch(e=>console.warn(e));}}
  function styleText(el,it){el.style.fontSize=it.fs*pxpt+'px';el.style.color=it.color;el.style.fontFamily=ED_CSS[it.font];el.style.fontWeight=it.bold?'700':'400';el.style.fontStyle=it.italic?'italic':'normal';}
  function draw(){const ae=document.activeElement;const fid=ae&&ae.classList&&ae.classList.contains('ptxt')?+ae.parentNode.dataset.id:0;lay.innerHTML='';
   for(const it of S.items.filter(x=>x.page===page&&x.cov)){const c=document.createElement('div');c.className='pcov';Object.assign(c.style,{left:it.cov.fx*100+'%',top:it.cov.fy*100+'%',width:it.cov.fw*100+'%',height:it.cov.fh*100+'%',background:it.cov.bg});lay.appendChild(c);}
   if(!/^(white|shape|link)$/.test(mode))(S.src[page]||[]).forEach((l,k)=>{if(S.items.some(x=>x.page===page&&x.srcK===k))return;const h=document.createElement('div');h.className='psrc';h.dataset.k=k;Object.assign(h.style,{left:l.cov.fx*100+'%',top:l.cov.fy*100+'%',width:l.cov.fw*100+'%',height:l.cov.fh*100+'%'});h.title='Click to edit this text';lay.appendChild(h);});
   if(mode==='obj')(S.objs[page]||[]).forEach(o=>{if(S.items.some(x=>x.type==='obj'&&x.page===page&&x.k===o.k))return;const h=document.createElement('div');h.className='pobj '+o.kind;h.dataset.k=o.k;Object.assign(h.style,{left:o.fx*100+'%',top:o.fy*100+'%',width:o.fw*100+'%',height:o.fh*100+'%'});h.title=o.kind==='img'?'Image – click to select':'Shape – click to select';lay.appendChild(h);});
   for(const it of S.items.filter(x=>x.page===page)){const d=document.createElement('div');d.className='pit '+it.type+(it.type==='obj'?' '+it.kind+(it.del?' del':''):'')+(it.id===selId?' sel':'');d.dataset.id=it.id;d.style.left=it.fx*100+'%';d.style.top=it.fy*100+'%';
    if(it.type==='text'){const t=document.createElement('div');t.className='ptxt';t.contentEditable='true';t.spellcheck=false;t.innerText=it.text;styleText(t,it);d.appendChild(t);
     t.addEventListener('focus',()=>{if(selId!==it.id){selId=it.id;mark();syncFmt();}t._before=it.text;});
     t.addEventListener('input',()=>{it.text=t.innerText.replace(/\n$/,'');hint();ovw(it,t);});
     t.addEventListener('blur',()=>{if(t._before!==it.text){S.hist.push(JSON.stringify(S.items.map(x=>x.id===it.id?{...x,text:t._before}:x)));}if(!it.text.trim()&&!it.cov){S.items=S.items.filter(x=>x!==it);draw();}hint();});}
    else{d.style.width=it.fw*100+'%';d.style.height=it.fh*100+'%';if(it.type==='img')d.style.backgroundImage=`url(${S.imgs[it.img].url})`;if(it.type==='shape')d.innerHTML=edShapeSvg(it,pxpt,lay);if(it.type==='link'){d.style.outline='2px dashed #2563eb';d.title=it.href;}}
    const mv=document.createElement('span');mv.className='pmv';mv.textContent='✥';mv.title='Drag to move';d.appendChild(mv);
    const rs=document.createElement('span');rs.className='prs';rs.title='Drag to resize';d.appendChild(rs);
    lay.appendChild(d);}
   if(fid){const t=lay.querySelector(`.pit[data-id="${fid}"] .ptxt`);if(t){t.focus();const r=document.createRange();r.selectNodeContents(t);r.collapse(false);const sl=getSelection();sl.removeAllRanges();sl.addRange(r);}}
   hint();}
  // warn when edited existing text spills past its original background and becomes hard to read there
  const lum=([r,g,b])=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);};
  const hx=h=>{const n=parseInt((h||'#000').slice(1),16);return [n>>16&255,n>>8&255,n&255];};
  function ovw(it,t){const W=q('#pwarn');if(!it.cov||!t){W.hidden=true;return;}const fw=t.offsetWidth/lay.clientWidth,fh=t.offsetHeight/lay.clientHeight;const over=it.fx+fw-(it.cov.fx+it.cov.fw);
   if(over<0.008){W.hidden=true;return;}const a=lum(hx(it.color));let cr=99,b=1;const g=cv.getContext('2d');for(let i=1;i<=6;i++){const x=Math.round((it.cov.fx+it.cov.fw+over*i/6.5)*cv.width),y=Math.round((it.fy+fh*0.5)*cv.height);let px=[255,255,255];try{px=[...g.getImageData(Math.max(0,Math.min(cv.width-1,x)),Math.max(0,Math.min(cv.height-1,y)),1,1).data].slice(0,3);}catch(e){}const l=lum(px);const c=(Math.max(a,l)+0.05)/(Math.min(a,l)+0.05);if(c<cr){cr=c;b=l;}}
   W.hidden=false;W.innerHTML=`⚠ The new text is wider than the original and runs past its background${cr<2.5?' – where it spills it is hard to read (low contrast)':''}. <button type="button" class="btn ghost mini" data-w="fit">Shrink to fit</button> <button type="button" class="btn ghost mini" data-w="col">${b>0.4?'Use dark text':'Use light text'}</button> <input type="color" value="${it.color}" title="Pick text colour" data-w="pick">`;
   W.onclick=e=>{const k=e.target.dataset.w;if(k==='fit'){snap();it.fs=Math.max(4,Math.floor(it.fs*(it.cov.fw/(fw+0.002))*2)/2);styleText(t,it);q('#psize').value=it.fs;ovw(it,t);}if(k==='col'){snap();it.color=b>0.4?'#111111':'#ffffff';styleText(t,it);q('#pcol').value=it.color;ovw(it,t);}};
   W.querySelector('[data-w=pick]').oninput=e=>{it.color=e.target.value;styleText(t,it);q('#pcol').value=it.color;};}
  function mark(){lay.querySelectorAll('.pit').forEach(e=>e.classList.toggle('sel',+e.dataset.id===selId));}
  function syncFmt(){const it=cur();if(!it||it.type!=='text')return;q('#pfont').value=it.font;q('#psize').value=it.fs;q('#pcol').value=it.color;q('#pb').setAttribute('aria-pressed',!!it.bold);q('#pi').setAttribute('aria-pressed',!!it.italic);}
  const frac=e=>{const r=lay.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
  const clamp=(a,lo,hi)=>Math.max(lo,Math.min(hi,a));
  // Pointer handling
  let drag=null;
  lay.addEventListener('pointerdown',e=>{const itEl=e.target.closest('.pit');const [fx,fy]=frac(e);
   const ob=e.target.closest('.pobj');if(ob&&!itEl){e.preventDefault();const o=S.objs[page].find(x=>x.k===+ob.dataset.k);snap();const it={id:uid++,type:'obj',page,k:o.k,kind:o.kind,canFill:o.fill,canStroke:o.stroke,inline:o.inline,fx:o.fx,fy:o.fy,fw:o.fw,fh:o.fh,o:{fx:o.fx,fy:o.fy,fw:o.fw,fh:o.fh}};S.items.push(it);selId=it.id;draw();syncObj();const el=lay.querySelector(`.pit[data-id="${it.id}"]`);drag={k:'mv',it,fx,fy,o:{...it},el,moved:0,obj:1};lay.setPointerCapture(e.pointerId);return;}
   const sh=e.target.closest('.psrc');if(sh&&!itEl){e.preventDefault();const it=convert(page,+sh.dataset.k);selId=it.id;draw();const t=lay.querySelector(`.pit[data-id="${it.id}"] .ptxt`);if(t){t.focus();const r=document.createRange();r.selectNodeContents(t);const sl=getSelection();sl.removeAllRanges();sl.addRange(r);}return;}
   if(itEl){const it=S.items.find(x=>x.id===+itEl.dataset.id);selId=it.id;mark();syncFmt();syncObj();const isTxt=e.target.closest('.ptxt');
    if(e.target.classList.contains('prs')){e.preventDefault();snap();drag={k:'rs',it,fx,fy,o:{...it},el:itEl,moved:0};}
    else if(isTxt&&document.activeElement===isTxt)return; // editing text: let caret work
    else{if(!isTxt)e.preventDefault();snap();drag={k:'mv',it,fx,fy,o:{...it},el:itEl,moved:0,txt:isTxt};}
    lay.setPointerCapture(e.pointerId);return;}
   if(document.activeElement&&document.activeElement.classList?.contains('ptxt')){document.activeElement.blur();selId=null;mark();return;}
   selId=null;mark();
   if(mode==='text'){e.preventDefault();snap();const fs=+q('#psize').value||14;const it={id:uid++,type:'text',page,fx:clamp(fx,0,0.98),fy:clamp(fy-fs*0.6*pxpt/lay.clientHeight,0,0.98),text:'',fs,color:q('#pcol').value,font:q('#pfont').value,bold:q('#pb').getAttribute('aria-pressed')==='true',italic:q('#pi').getAttribute('aria-pressed')==='true'};S.items.push(it);selId=it.id;draw();const t=lay.querySelector(`.pit[data-id="${it.id}"] .ptxt`);if(t)t.focus();}
   else if(mode==='shape'&&q('#pshape').value==='pen'){e.preventDefault();snap();const it={id:uid++,type:'shape',shape:'pen',page,fx,fy,fw:0.001,fh:0.001,pts:[[fx,fy]],color:q('#pcol').value,sw:+q('#psw').value||2};S.items.push(it);selId=it.id;draw();drag={k:'pen',it,fx,fy,el:lay.querySelector(`.pit[data-id="${it.id}"]`),moved:0};lay.setPointerCapture(e.pointerId);}
   else if(mode==='white'||mode==='shape'||mode==='link'){e.preventDefault();snap();const it=mode==='white'?{id:uid++,type:'white',page,fx,fy,fw:0.001,fh:0.001}:mode==='link'?{id:uid++,type:'link',page,fx,fy,fw:0.001,fh:0.001,href:''}:{id:uid++,type:'shape',shape:q('#pshape').value,page,fx,fy,fw:0.001,fh:0.001,color:q('#pshape').value==='hl'&&q('#pcol').value==='#000000'?'#ffeb3b':q('#pcol').value,sw:+q('#psw').value||2};S.items.push(it);selId=it.id;draw();drag={k:'new',it,fx,fy,el:lay.querySelector(`.pit[data-id="${it.id}"]`),moved:0};lay.setPointerCapture(e.pointerId);}
  });
  lay.addEventListener('pointermove',e=>{if(!drag)return;const [fx,fy]=frac(e);const dx=fx-drag.fx,dy=fy-drag.fy;if(Math.abs(dx)+Math.abs(dy)>0.004)drag.moved=1;if(!drag.moved)return;const it=drag.it,el=drag.el;
   if(drag.k==='mv'){it.fx=clamp(drag.o.fx+dx,-0.05,0.99);it.fy=clamp(drag.o.fy+dy,-0.02,0.99);el.style.left=it.fx*100+'%';el.style.top=it.fy*100+'%';}
   else if(drag.k==='pen'){it.pts.push([fx,fy]);const xs=it.pts.map(p=>p[0]),ys=it.pts.map(p=>p[1]);it.fx=Math.min(...xs);it.fy=Math.min(...ys);it.fw=Math.max(0.002,Math.max(...xs)-it.fx);it.fh=Math.max(0.002,Math.max(...ys)-it.fy);Object.assign(el.style,{left:it.fx*100+'%',top:it.fy*100+'%',width:it.fw*100+'%',height:it.fh*100+'%'});el.innerHTML=edShapeSvg(it,pxpt,lay);}
   else if(drag.k==='new'){it.fx=Math.min(fx,drag.fx);it.fy=Math.min(fy,drag.fy);it.fw=Math.abs(dx);it.fh=Math.abs(dy);it.flip=dx*dy<0;it.rev=dx<0;if(it.type==='shape')el.innerHTML=edShapeSvg(it,pxpt,lay);Object.assign(el.style,{left:it.fx*100+'%',top:it.fy*100+'%',width:it.fw*100+'%',height:it.fh*100+'%'});}
   else if(drag.k==='rs'){if(it.type==='text'){const h0=el.offsetHeight/lay.clientHeight||0.01;it.fs=Math.round(clamp(drag.o.fs*(1+dy/h0),4,200)*2)/2;styleText(el.querySelector('.ptxt'),it);q('#psize').value=it.fs;}
    else{let nw=Math.max(0.01,drag.o.fw+dx),nh=Math.max(0.005,drag.o.fh+dy);if((it.type==='img'||it.kind==='img')&&!e.shiftKey){const ar=drag.o.fh/drag.o.fw;nh=nw*ar;}it.fw=nw;it.fh=nh;el.style.width=nw*100+'%';el.style.height=nh*100+'%';}}});
  const end=e=>{if(!drag)return;const d=drag;drag=null;
   if(d.k==='new'&&d.it.type==='link'){const h=prompt('Link to (https://…, mailto:…, or a page number):',d.it.href||'https://');if(!h){S.items=S.items.filter(x=>x!==d.it);draw();hint();return;}d.it.href=h.trim();}
   if(d.k==='new'&&d.it.type==='shape'&&/line|arrow/.test(d.it.shape)){}else if(d.k==='new'&&(d.it.fw<0.01||d.it.fh<0.005)){d.it.fw=0.2;d.it.fh=0.04;d.it.fx=clamp(d.fx-0.1,0,0.8);d.it.fy=clamp(d.fy-0.02,0,0.96);draw();}
   else if(!d.moved){S.hist.pop();if(d.txt)d.txt.focus();}
   if(d.moved&&d.it.type==='obj')repaint();
   hint();};
  lay.addEventListener('pointerup',end);lay.addEventListener('pointercancel',end);
  // Toolbar
  w.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;w.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b));lay.dataset.mode=mode;q('.pobjp').hidden=mode!=='obj';q('.pfmt').classList.toggle('dim',mode==='obj');selId=null;show();});lay.dataset.mode=mode;
  function syncObj(){const it=cur();const pn=q('.pobjp');if(!it||it.type!=='obj'){q('#poinfo').textContent='Select an image or shape';for(const id of ['#pofl','#postl','#porep','#podel','#poreset'])q(id).hidden=true;return;}
   q('#poinfo').textContent=(it.kind==='img'?(it.inline?'Inline image':'Image'):'Shape')+(it.del?' (deleted)':'');q('#pofl').hidden=it.kind!=='path'||!it.canFill;q('#postl').hidden=it.kind!=='path'||!it.canStroke;q('#porep').hidden=it.kind!=='img';q('#podel').hidden=q('#poreset').hidden=false;q('#podel').textContent=it.del?'↺ Restore':'🗑 Delete';if(it.fill)q('#pofill').value=it.fill;if(it.stroke)q('#postr').value=it.stroke;}
  const objSet=(k,v)=>{const it=cur();if(!it||it.type!=='obj')return;snap();it[k]=v;syncObj();draw();repaint();};
  q('#pofill').oninput=e=>objSet('fill',e.target.value);q('#postr').oninput=e=>objSet('stroke',e.target.value);
  q('#podel').onclick=async()=>{const it=cur();if(!(it&&it.type==='obj'))return;objSet('del',!it.del);q('#pwarn').hidden=true;if(!it.del||it.kind!=='path')return;
   await loadSrc(page);const L=(S.src[page]||[]).map((l,k)=>({l,k})).filter(({l,k})=>{const c=l.cov,cx=c.fx+c.fw/2,cy=c.fy+c.fh/2;return cx>=it.fx&&cx<=it.fx+it.fw&&cy>=it.fy&&cy<=it.fy+it.fh&&!S.items.some(x=>x.page===page&&x.srcK===k);});if(!L.length)return;
   S._post=()=>{const g=cv.getContext('2d');const bad=L.filter(({l})=>{const c=l.cov;let best=99;for(const [ax,ay] of [[-0.004,0.5],[1.004,0.5],[0.5,-0.15],[0.5,1.15]]){const x=Math.round((c.fx+c.fw*ax+(ax<0?-0.002:ax>1?0.002:0))*cv.width),y=Math.round((c.fy+c.fh*ay)*cv.height);let px=[255,255,255];try{px=[...g.getImageData(Math.max(0,Math.min(cv.width-1,x)),Math.max(0,Math.min(cv.height-1,y)),1,1).data].slice(0,3);}catch(e){}const a=lum(hx(l.color)),b=lum(px);const cc=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);if(cc<best){best=cc;l._bgHex='#'+px.map(v=>v.toString(16).padStart(2,'0')).join('');}}l._bgL=best;return best<2.5;});
    if(!bad.length)return;const W=q('#pwarn');W.hidden=false;W.innerHTML=`⚠ ${bad.length} text line(s) sat on this shape and are now hard to read: “${esc(bad[0].l.text.slice(0,40))}”${bad.length>1?'…':''} <button type="button" class="btn ghost mini" data-w="dk">Make that text dark</button> <input type="color" value="#111111" title="Pick a colour for that text" data-w="pk"> <button type="button" class="btn ghost mini" data-w="x">Keep</button>`;
    const apply=col=>{for(const {k} of bad){const t=convert(page,k);t.color=col;if(S.src[page][k]._bgHex)t.cov.bg=S.src[page][k]._bgHex;}draw();W.hidden=true;hint();};
    W.onclick=e=>{const k=e.target.dataset.w;if(k==='dk')apply('#111111');if(k==='x')W.hidden=true;};W.querySelector('[data-w=pk]').onchange=e=>apply(e.target.value);};repaint();};
  q('#poreset').onclick=()=>{const it=cur();if(!it||it.type!=='obj')return;snap();S.items=S.items.filter(x=>x!==it);selId=null;draw();syncObj();repaint();};
  q('#porep').onclick=()=>q('#porepf').click();q('#porepf').onchange=async e=>{const f=e.target.files[0];e.target.value='';const it=cur();if(!f||!it||it.type!=='obj')return;const url=URL.createObjectURL(f);const im=new Image();im.src=url;await im.decode();const key='r'+uid++;S.imgs[key]={blob:f,url,w:im.naturalWidth,h:im.naturalHeight};objSet('rep',key);};
  syncObj();
  const fmt=(k,val)=>{const it=cur();if(it&&it.type==='text'){snap();it[k]=val;const el=lay.querySelector(`.pit[data-id="${it.id}"] .ptxt`);if(el)styleText(el,it);}};
  q('#pfont').onchange=e=>fmt('font',e.target.value);q('#psize').oninput=e=>{const n=+e.target.value;if(n>=4&&n<=200)fmt('fs',n);};q('#pcol').oninput=e=>{const it=cur();if(it&&it.type==='shape'){snap();it.color=e.target.value;draw();}else fmt('color',e.target.value);};q('#psw').oninput=e=>{const it=cur();if(it&&it.type==='shape'){it.sw=+e.target.value||2;draw();}};
  for(const [id,k] of [['#pb','bold'],['#pi','italic']])q(id).onmousedown=e=>e.preventDefault(),q(id).onclick=()=>{const b=q(id);const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);fmt(k,on);};
  q('#pdel').onclick=()=>{if(!selId)return;const c0=cur();if(c0&&c0.type==='obj'){q('#podel').click();return;}snap();const c=cur();if(c&&c.cov){c.text='';draw();return;}S.items=S.items.filter(x=>x.id!==selId);selId=null;draw();};
  document.addEventListener('keydown',S._kd=e=>{if(!w.isConnected){document.removeEventListener('keydown',S._kd);return;}if(document.activeElement?.isContentEditable||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName))return;if((e.key==='Delete'||e.key==='Backspace')&&selId){e.preventDefault();q('#pdel').click();}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();q(e.shiftKey?'#predo':'#pundo').click();}if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();q('#predo').click();}});
  q('#pfrb').onclick=async()=>{const f=q('#pfind').value,r=q('#prepl').value;if(!f)return;let n=0;for(let pg=1;pg<=N;pg++){q('#phint').textContent=`Searching page ${pg}/${N}…`;await loadSrc(pg);(S.src[pg]||[]).forEach((l,k)=>{const ex=S.items.find(x=>x.page===pg&&x.srcK===k);const cur=ex?ex.text:l.text;if(!cur.includes(f))return;const nt=cur.split(f).join(r);n+=cur.split(f).length-1;if(ex){snap();ex.text=nt;}else convert(pg,k,nt);});}draw();q('#phint').textContent=n?`Replaced ${n} occurrence(s). Press Start to save.`:`“${f}” not found.`;};
  q('#pocr').onclick=async()=>{q('#pocr').disabled=true;try{S.src[page]=await edLinesOcr(page);S.items=S.items.filter(x=>!(x.page===page&&x.srcK!=null&&x.text===x.orig));draw();q('#phint').textContent=`OCR found ${S.src[page].length} text line(s). Tap one to edit.`;}finally{q('#pocr').disabled=false;}};
  S.fut=[];q('#pundo').onclick=()=>{const s=S.hist.pop();if(s==null)return;S.fut.push(JSON.stringify(S.items));S.items=JSON.parse(s);selId=null;draw();};q('#predo').onclick=()=>{const s=S.fut.pop();if(s==null)return;S.hist.push(JSON.stringify(S.items));S.items=JSON.parse(s);selId=null;draw();};
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
 async run([f],status){const items=this.items.filter(x=>x.type==='obj'?edObjChanged(x):(x.type!=='text'||x.text.trim()||x.cov));if(!items.length)throw new Error(T.o_editHint||'Add at least one edit first: tap the page to add text or a white-out box.');
  status(T.working);const {PDFDocument,StandardFonts,degrees,rgb}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const std={};
  const SF={sans:['Helvetica','HelveticaBold','HelveticaOblique','HelveticaBoldOblique'],serif:['TimesRoman','TimesRomanBold','TimesRomanItalic','TimesRomanBoldItalic'],mono:['Courier','CourierBold','CourierOblique','CourierBoldOblique']};
  const enc=s=>[...s].every(ch=>{const c=ch.codePointAt(0);return (c>=32&&c<127)||(c>=160&&c<=255)||'€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.includes(ch);});
  const imgCache={};
  const done=await edRemove(d,items,L);
  {const P=await L.pdflib();const cache={};for(const pn of [...new Set(items.filter(x=>x.type==='obj').map(x=>x.page))])await edObjApply(d,P,items,pn,this.imgs,cache);}
  for(const it of items.filter(x=>x.cov&&!done.has(x))){const p=d.getPage(it.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();const r=((p.getRotation().angle%360)+360)%360;const m=(fx,fy)=>{const [ux,uy]=r===90?[fy*W,fx*H]:r===180?[(1-fx)*W,fy*H]:r===270?[(1-fy)*W,(1-fx)*H]:[fx*W,(1-fy)*H];return {x:bx+ux,y:by+uy};};const c=it.cov,a=m(c.fx,c.fy),b=m(c.fx+c.fw,c.fy+c.fh);p.drawRectangle({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y),color:hex2rgb(c.bg)});}
  for(const it of items){const p=d.getPage(it.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();const r=((p.getRotation().angle%360)+360)%360;const VW=r%180?H:W,VH=r%180?W:H;
   const m=(fx,fy)=>{const [ux,uy]=r===90?[fy*W,fx*H]:r===180?[(1-fx)*W,fy*H]:r===270?[(1-fy)*W,(1-fx)*H]:[fx*W,(1-fy)*H];return {x:bx+ux,y:by+uy};};
   if(it.type==='obj')continue;
   if(it.type==='shape'||it.type==='link'){await edShapePdf(d,p,it,m,VW,VH,rgb,hex2rgb);continue;}
   if(it.type==='white'){const a=m(it.fx,it.fy),b=m(it.fx+it.fw,it.fy+it.fh);p.drawRectangle({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y),color:rgb(1,1,1)});}
   else if(it.type==='img'){const im=this.imgs[it.img];if(!imgCache[it.img]){const isJ=/jpe?g/.test(im.blob.type),isP=/png/.test(im.blob.type);let bytes;if(isJ||isP)bytes=await im.blob.arrayBuffer();else{const c=document.createElement('canvas');c.width=im.w;c.height=im.h;const ii=new Image();ii.src=im.url;await ii.decode();c.getContext('2d').drawImage(ii,0,0);bytes=await (await toBlob(c,'image/png')).arrayBuffer();}imgCache[it.img]=isJ?await d.embedJpg(bytes):await d.embedPng(bytes);}
    const a=m(it.fx,it.fy+it.fh);p.drawImage(imgCache[it.img],{x:a.x,y:a.y,width:it.fw*VW,height:it.fh*VH,rotate:degrees(r)});}
   else if(it.text.trim()&&done.get?.(it)?.drawn){}
   else if(it.text.trim()){const lines=it.text.split('\n');const col=hex2rgb(it.color);const lh=it.fs*1.2;
    for(let i=0;i<lines.length;i++){const ln=lines[i];if(!ln.trim())continue;const base=it.fy+(i*lh+it.fs*0.97)/VH;const a=m(it.fx,base);
     if(enc(ln)){const k=SF[it.font][(it.bold?1:0)+(it.italic?2:0)];std[k]=std[k]||await d.embedFont(StandardFonts[k]);p.drawText(ln,{x:a.x,y:a.y,size:it.fs,font:std[k],color:col,rotate:degrees(r)});}
     else await drawText(d,p,ln,{x:a.x,y:a.y,size:it.fs,color:col,bold:it.bold,rotate:r});}}}
  return {blob:pdfBlob(await d.save()),name:base(f.name)+'-edited.pdf'};}};
