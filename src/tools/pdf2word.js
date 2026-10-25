// PDF -> Word (.docx) with layout reconstruction. Two modes:
//  exact: page background (graphics+images, text removed) behind editable text boxes at the original positions
//  flow : real paragraphs/tables/columns/images in reading order, reflowable.
// Scanned pages are OCRed on-device (tesseract.js) and handled the same way.
const WOL=[['eng','English'],['spa','Español'],['fra','Français'],['deu','Deutsch'],['por','Português'],['ita','Italiano'],['rus','Русский'],['ara','العربية'],['hin','हिन्दी'],['tam','தமிழ்'],['chi_sim','中文'],['jpn','日本語']];
const wOcr=async(lang,status)=>{await load('tesseract/tesseract.min.js');return window.Tesseract.createWorker(lang,1,{workerPath:location.origin+'/vendor/tesseract/worker.min.js',corePath:location.origin+'/vendor/tesseract/',langPath:location.origin+'/models/tessdata',gzip:false,logger:m=>{if(m.status==='recognizing text')status(`OCR ${Math.round(m.progress*100)}%`);}});};
const W2={X:s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,''),
 tw:pt=>Math.round(pt*20),emu:pt=>Math.round(pt*12700),
 // PDF base font name -> Word font family + bold/italic
 font(name,fo){let n=String(name||'').replace(/^[A-Z]{6}\+/,'');const low=n.toLowerCase();
  let b=/bold|black|heavy|semibold|demi|extrabold|,b$/.test(low)||!!(fo&&(fo.bold||fo.black));let i=/italic|oblique|,i$|-it$|ital/.test(low)||!!(fo&&fo.italic);
  let fam=n.split(/[-,]/)[0].replace(/(PSMT|PS|MT|Std|Pro|LT|Com)$/,'').replace(/(Bold|Italic|Regular|Medium|Light)+$/,'');
  const M={arial:'Arial',arialmt:'Arial',helvetica:'Arial',helveticaneue:'Arial',timesnewroman:'Times New Roman',times:'Times New Roman',timesroman:'Times New Roman',couriernew:'Courier New',courier:'Courier New',symbol:'Symbol',zapfdingbats:'Wingdings',liberationsans:'Arial',arimo:'Arial',tinos:'Times New Roman',cousine:'Courier New',carlito:'Calibri',caladea:'Cambria',liberationserif:'Times New Roman',dejavusans:'DejaVu Sans',calibri:'Calibri',cambria:'Cambria',georgia:'Georgia',verdana:'Verdana',tahoma:'Tahoma',garamond:'Garamond',segoeui:'Segoe UI',trebuchetms:'Trebuchet MS'};
  const k=fam.toLowerCase().replace(/[^a-z]/g,'');if(M[k])fam=M[k];else if(!fam||/^(f\d+|t\d+|font\d*|sans-serif|serif|monospace)$/i.test(fam)){fam=/serif/i.test(n)&&!/sans/i.test(n)?'Times New Roman':/mono|courier/i.test(n)?'Courier New':'Arial';}else fam=fam.replace(/([a-z])([A-Z])/g,'$1 $2');
  return {fam,b,i};},
 css:f=>({'Times New Roman':'"Times New Roman",Tinos,"Liberation Serif",serif','Courier New':'"Courier New",Cousine,"Liberation Mono",monospace',Arial:'Arial,Arimo,"Liberation Sans",Helvetica,sans-serif'}[f]||`"${f}",Arial,sans-serif`),
 mctx:null,
 measure(t,r){const c=W2.mctx||(W2.mctx=document.createElement('canvas').getContext('2d'));c.font=`${r.i?'italic ':''}${r.b?'bold ':''}100px ${W2.css(r.fam)}`;return c.measureText(t).width/100*r.size;}};
// ---------- page analysis ----------
async function w2Page(doc,n,o){const pj=window.pdfjsLib;const pg=await doc.getPage(n);const vp1=pg.getViewport({scale:1});const W=vp1.width,H=vp1.height;
 const s=Math.min(2.5,Math.sqrt(10e6/(W*H)));const vp=pg.getViewport({scale:s});
 const mk=()=>{const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);return [c,x];};
 const [full,fx]=mk();await pg.render({canvasContext:fx,viewport:vp}).promise;
 const [bg,bx]=mk();bx.fillText=bx.strokeText=function(){};await pg.render({canvasContext:bx,viewport:vp}).promise;
 const tc=await pg.getTextContent();const U=pj.Util;let items=[];
 for(const it of tc.items){if(!it.str||!it.str.length)continue;const t=U.transform(vp1.transform,it.transform);const size=Math.hypot(t[2],t[3]);if(size<1.5)continue;
  if(Math.abs(t[1])>Math.abs(t[0])+0.01)continue; // vertical/rotated text: kept in background instead
  const st=tc.styles[it.fontName]||{};let fo=null;try{fo=pg.commonObjs.get(it.fontName);}catch(e){}
  const f=W2.font(fo&&fo.name||st.fontFamily,fo);if(fo&&fo.name&&/sans-serif|serif|monospace/.test(f.fam))f.fam='Arial';
  items.push({str:it.str,x:t[4],y:t[5],w:it.width,size,asc:Math.min(1,Math.max(0.6,st.ascent||0.8)),...f});}
 // restore text on background for skipped vertical items: simplest = keep full render where those items are (rare) -> ignored
 const chars=items.reduce((a,x)=>a+x.str.trim().length,0);let ocr=false;
 if(o.ocrMode==='all'||(o.ocrMode==='auto'&&chars<20)){const r=await o.ocr(full);const rows=r.data.tsv.split('\n').slice(1).map(l=>l.split('\t'));const lines={};
  for(const c of rows){if(c.length<12||c[0]!=='5'||!c[11].trim()||+c[10]<20)continue;const k=c.slice(1,5).join('.');(lines[k]=lines[k]||[]).push({x:+c[6],y:+c[7],w:+c[8],h:+c[9],t:c[11]});}
  const tmp=[];for(const ws of Object.values(lines)){const bots=ws.map(w=>w.y+w.h).sort((a,b)=>a-b);const base=bots[Math.floor(bots.length/2)];const top=Math.min(...ws.map(w=>w.y));const size=Math.max(4,(base-top)/0.74/s);
   for(const w of ws)tmp.push({str:w.t,x:w.x/s,y:base/s,w:w.w/s,size,asc:0.8,fam:'Arial',b:false,i:false,ocrBox:w});}
  if(tmp.length){items=tmp;ocr=true;// erase recognised words from the scan background
   const d=bx.getImageData(0,0,bg.width,bg.height);bx.drawImage(full,0,0);const D=bx.getImageData(0,0,bg.width,bg.height),p=D.data;void d;
   for(const it of items){const b=it.ocrBox,pad=3;const x0=Math.max(0,b.x-pad),y0=Math.max(0,b.y-pad),x1=Math.min(bg.width-1,b.x+b.w+pad),y1=Math.min(bg.height-1,b.y+b.h+pad);const ring=[];
    for(let x=x0;x<=x1;x+=2){ring.push((y0*bg.width+x)*4,(y1*bg.width+x)*4);}for(let y=y0;y<=y1;y+=2){ring.push((y*bg.width+x0)*4,(y*bg.width+x1)*4);}
    const med=k=>{const a=ring.map(i=>p[i+k]).sort((m,n)=>m-n);return a[a.length>>1];};const col=[med(0),med(1),med(2)];
    // text colour = darkest-ish pixels inside the box
    let best=[0,0,0],bd=-1;for(let y=b.y;y<b.y+b.h;y+=2)for(let x=b.x;x<b.x+b.w;x+=2){const i=(y*bg.width+x)*4;const dd=Math.abs(p[i]-col[0])+Math.abs(p[i+1]-col[1])+Math.abs(p[i+2]-col[2]);if(dd>bd){bd=dd;best=[p[i],p[i+1],p[i+2]];}}
    it.color=w2hex(best.map(v=>v<70?0:v));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=(y*bg.width+x)*4;p[i]=col[0];p[i+1]=col[1];p[i+2]=col[2];}}
   bx.putImageData(D,0,0);}}
 // text colour from the difference between the full render and the text-less render
 if(!ocr&&items.length){const hard=[];const A=fx.getImageData(0,0,full.width,full.height).data,B=bx.getImageData(0,0,bg.width,bg.height).data,cw=full.width,ch=full.height;
  for(const it of items){const x0=Math.max(0,Math.floor(it.x*s)-1),x1=Math.min(cw-1,Math.ceil((it.x+it.w)*s)+1),y0=Math.max(0,Math.floor((it.y-it.size*it.asc)*s)-1),y1=Math.min(ch-1,Math.ceil((it.y+it.size*0.28)*s));if(x1<=x0||y1<=y0){it.color='000000';continue;}
   const step=Math.max(1,Math.floor(Math.sqrt((x1-x0)*(y1-y0)/6000)));const ring=[];for(let x=x0;x<=x1;x+=step)ring.push((y0*cw+x)*4,(y1*cw+x)*4);for(let y=y0;y<=y1;y+=step)ring.push((y*cw+x0)*4,(y*cw+x1)*4);
   const medOf=(P,k)=>{const a=ring.map(i=>P[i+k]).sort((m,n)=>m-n);return a[a.length>>1];};const ra=[0,1,2].map(k=>medOf(A,k)),rb=[0,1,2].map(k=>medOf(B,k));
   const dev=ring.reduce((a,i)=>a+Math.abs(B[i]-rb[0])+Math.abs(B[i+1]-rb[1])+Math.abs(B[i+2]-rb[2]),0)/ring.length;
   let mx=0,diffN=0,res=0;const px=[];
   for(let y=y0;y<=y1;y+=step)for(let x=x0;x<=x1;x+=step){const i=(y*cw+x)*4;const d=Math.abs(A[i]-ra[0])+Math.abs(A[i+1]-ra[1])+Math.abs(A[i+2]-ra[2]);if(d>40){px.push([d,i]);if(d>mx)mx=d;}
    if(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2])>40)diffN++;const r=Math.abs(B[i]-rb[0])+Math.abs(B[i+1]-rb[1])+Math.abs(B[i+2]-rb[2]);if(r>res)res=r;}
   const sel=px.filter(q=>q[0]>=mx*0.75);if(sel.length){const c=[0,0,0];for(const [,i] of sel){c[0]+=A[i];c[1]+=A[i+1];c[2]+=A[i+2];}it.color=w2hex(c.map(v=>{v/=sel.length;return v<40?0:v>235?255:v;}));}else it.color='000000';
   // text drawn as paths (Type3 fonts, fake bold strokes) is still in the background: paint it out
   if(res>60&&it.str.trim()&&(dev<14||diffN<3)){if(dev<14){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=(y*cw+x)*4;B[i]=rb[0];B[i+1]=rb[1];B[i+2]=rb[2];}}
    else for(let y=y0;y<=y1;y++){const l=(y*cw+Math.max(0,x0-1))*4,r=(y*cw+Math.min(cw-1,x1+1))*4;for(let x=x0;x<=x1;x++){const t=(x-x0+1)/(x1-x0+2),i=(y*cw+x)*4;for(let k=0;k<3;k++)B[i+k]=B[l+k]*(1-t)+B[r+k]*t;}}hard.push(it);}}
  if(hard.length)bx.putImageData(new ImageData(B,cw,ch),0,0);}
 // images (for flowing mode) from the operator list
 const imgs=[];if(o.mode==='flow'&&!ocr){const ol=await pg.getOperatorList();const OPS=pj.OPS;let ctm=[1,0,0,1,0,0];const st=[];
  for(let k=0;k<ol.fnArray.length;k++){const f=ol.fnArray[k],a=ol.argsArray[k];
   if(f===OPS.save)st.push(ctm);else if(f===OPS.restore)ctm=st.pop()||[1,0,0,1,0,0];else if(f===OPS.transform)ctm=U.transform(ctm,a);
   else if(f===OPS.paintFormXObjectBegin){st.push(ctm);if(a[0])ctm=U.transform(ctm,a[0]);}else if(f===OPS.paintFormXObjectEnd)ctm=st.pop()||ctm;
   else if(f===OPS.paintImageXObject||f===OPS.paintInlineImageXObject||f===OPS.paintImageXObjectRepeat||f===OPS.paintJpegXObject){const m=U.transform(vp1.transform,ctm);const pts=[[0,0],[1,0],[0,1],[1,1]].map(([u,v])=>[m[0]*u+m[2]*v+m[4],m[1]*u+m[3]*v+m[5]]);
    let x0=Math.max(0,Math.min(...pts.map(p=>p[0]))),x1=Math.min(W,Math.max(...pts.map(p=>p[0]))),y0=Math.max(0,Math.min(...pts.map(p=>p[1]))),y1=Math.min(H,Math.max(...pts.map(p=>p[1])));if(x1-x0<12||y1-y0<12)continue;imgs.push({x:x0,y:y0,w:x1-x0,h:y1-y0});}}}
 const blank=isBlank(bx,bg);
 return {W,H,s,items,bg,blank,ocr,imgs:dedupeImgs(imgs)};}
const w2hex=c=>c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase();
function isBlank(x,c){const d=x.getImageData(0,0,c.width,c.height).data;const step=4*Math.max(1,Math.floor(c.width*c.height/60000));for(let i=0;i<d.length;i+=step)if(d[i]<245||d[i+1]<245||d[i+2]<245)return false;return true;}
function dedupeImgs(a){const out=[];for(const r of a){if(out.some(q=>Math.abs(q.x-r.x)<2&&Math.abs(q.y-r.y)<2&&Math.abs(q.w-r.w)<2))continue;out.push(r);}return out;}
// ---------- text structure ----------
const sameStyle=(a,b)=>a.fam===b.fam&&a.b===b.b&&a.i===b.i&&a.color===b.color&&Math.abs(a.size-b.size)<0.6;
function w2Segments(items){items=items.slice().sort((a,b)=>a.y-b.y||a.x-b.x);const rows=[];
 for(const it of items){let r=rows.find(r=>Math.abs(r.y-it.y)<Math.min(r.size,it.size)*0.35);if(!r){r={y:it.y,size:it.size,items:[]};rows.push(r);}r.items.push(it);r.size=Math.max(r.size,it.size);}
 const segs=[];for(const r of rows){r.items.sort((a,b)=>a.x-b.x);let cur=null;
  for(const it of r.items){const right=cur?cur.x+cur.w:0;const gap=cur?it.x-right:0;
   if(!cur||gap>Math.max(it.size,cur.size)*1.6){cur={x:it.x,y:r.y,w:0,size:it.size,asc:it.asc,runs:[]};segs.push(cur);}
   let t=it.str;const last=cur.runs[cur.runs.length-1];if(last&&gap>it.size*0.12&&!/\s$/.test(last.t)&&!/^\s/.test(t))t=' '+t;
   if(last&&sameStyle(last,it))last.t+=t;else cur.runs.push({t,fam:it.fam,b:it.b,i:it.i,color:it.color||'000000',size:it.size});
   cur.size=Math.max(cur.size,it.size);cur.asc=Math.max(cur.asc,it.asc);cur.w=Math.max(cur.w,it.x+it.w-cur.x);}}
 for(const g of segs){g.runs.forEach(r=>r.t=r.t.replace(/\s+/g,' '));g.runs[0].t=g.runs[0].t.replace(/^\s+/,'');const L=g.runs[g.runs.length-1];L.t=L.t.replace(/\s+$/,'');g.runs=g.runs.filter(r=>r.t);g.text=g.runs.map(r=>r.t).join('');g.top=g.y-g.size*g.asc;g.bot=g.y+g.size*0.25;}
 return segs.filter(g=>g.text.trim());}
// group segments into blocks (paragraph-like) for exact mode boxes
function w2Blocks(segs){const sorted=segs.slice().sort((a,b)=>a.y-b.y||a.x-b.x);const blocks=[];
 for(const g of sorted){let best=null;for(const b of blocks){const l=b.lines[b.lines.length-1];const dy=g.y-l.y;if(dy<=l.size*0.3||dy>Math.max(l.size,g.size)*1.75)continue;if(Math.abs(g.size-l.size)>l.size*0.2)continue;
   const ov=Math.min(l.x+l.w,g.x+g.w)-Math.max(l.x,g.x);const alignL=Math.abs(g.x-l.x)<l.size*0.8,alignC=Math.abs((g.x+g.w/2)-(l.x+l.w/2))<l.size;if(ov<=0||!(alignL||alignC||g.x>=b.x-2&&g.x+g.w<=b.x+b.w+l.size*3))continue;best=b;break;}
  if(best){best.lines.push(g);best.x=Math.min(best.x,g.x);best.w=Math.max(best.x+best.w,g.x+g.w)-best.x;}else blocks.push({x:g.x,w:g.w,lines:[g]});}
 return blocks;}
// ---------- DOCX xml pieces ----------
function w2rPr(r,sp){const f=W2.X(r.fam);return `<w:rPr><w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:cs="${f}" w:eastAsia="${f}"/>${r.b?'<w:b/><w:bCs/>':''}${r.i?'<w:i/><w:iCs/>':''}${r.color&&r.color!=='000000'?`<w:color w:val="${r.color}"/>`:''}${sp?`<w:spacing w:val="${sp}"/>`:''}<w:sz w:val="${Math.max(2,Math.round(r.size*2))}"/><w:szCs w:val="${Math.max(2,Math.round(r.size*2))}"/></w:rPr>`;}
const w2runs=(runs,sp)=>runs.map(r=>`<w:r>${w2rPr(r,sp)}<w:t xml:space="preserve">${W2.X(r.t)}</w:t></w:r>`).join('');
const w2has={};function w2avail(fam){if(fam in w2has)return w2has[fam];const c=document.createElement('canvas').getContext('2d');const m=f=>{c.font='72px '+f;return c.measureText('mmmmmlllliiWW@#').width;};const a=m('monospace'),b=m('serif');w2has[fam]=m(W2.css(fam).split(',')[0]+',monospace')!==a||m(W2.css(fam).split(',')[0]+',serif')!==b;return w2has[fam];}
// letter-spacing (twentieths of a point) so each line keeps the PDF's width in Word
function w2fit(seg){const n=[...seg.text].length;if(!seg.w||n<4||!seg.runs.every(r=>w2avail(r.fam)))return 0;const m=seg.runs.reduce((a,r)=>a+W2.measure(r.t,r),0);if(!m)return 0;const d=(seg.w-m)/n;if(Math.abs(d)<seg.size*0.008)return 0;return Math.round(Math.max(-seg.size*0.12,Math.min(seg.size*0.4,d))*20);}
let w2id=1;
const w2anchor=(inner,x,y,w,h,behind,z)=>`<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${z}" behindDoc="${behind?1:0}" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>${W2.emu(x)}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>${W2.emu(y)}</wp:posOffset></wp:positionV><wp:extent cx="${W2.emu(w)}" cy="${W2.emu(h)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${w2id}" name="Shape ${w2id++}"/><wp:cNvGraphicFramePr/>${inner(w,h)}</wp:anchor></w:drawing></w:r>`;
const w2pic=(rid)=>(w,h)=>`<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${w2id}" name="img${w2id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W2.emu(w)}" cy="${W2.emu(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>`;
const w2inlinePic=(rid,w,h)=>`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${W2.emu(w)}" cy="${W2.emu(h)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${w2id}" name="Picture ${w2id++}"/><wp:cNvGraphicFramePr/>${w2pic(rid)(w,h)}</wp:inline></w:drawing></w:r>`;
const w2txbox=(paras)=>(w,h)=>`<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr txBox="1"/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W2.emu(w)}" cy="${W2.emu(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></wps:spPr><wps:txbx><w:txbxContent>${paras}</w:txbxContent></wps:txbx><wps:bodyPr rot="0" vert="horz" wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t" anchorCtr="0"><a:noAutofit/></wps:bodyPr></wps:wsp></a:graphicData></a:graphic>`;
const w2sect=(pg,o={})=>`<w:sectPr>${o.type?`<w:type w:val="${o.type}"/>`:''}<w:pgSz w:w="${W2.tw(pg.W)}" w:h="${W2.tw(pg.H)}"${pg.W>pg.H?' w:orient="landscape"':''}/><w:pgMar w:top="${W2.tw(o.mt??0)}" w:right="${W2.tw(o.mr??0)}" w:bottom="${W2.tw(o.mb??0)}" w:left="${W2.tw(o.ml??0)}" w:header="0" w:footer="0" w:gutter="0"/><w:cols w:num="${o.cols||1}" w:space="${W2.tw(o.gap||18)}"${o.cols>1?' w:equalWidth="1"':''}/></w:sectPr>`;
// Exact mode: one anchor paragraph per page holding the background picture and one text box per block.
const W2LH=1.2,W2BASE=0.94; // line box = size*W2LH ; baseline sits W2BASE*size below line top (calibrated on LibreOffice/Word)
function w2Exact(pg,rid){let z=10;let out=rid?w2anchor(w2pic(rid),0,0,pg.W,pg.H,true,1):'';
 for(const b of w2Blocks(w2Segments(pg.items))){const L=b.lines;let paras='';let top=null;
  for(let k=0;k<L.length;k++){const g=L[k];const lh=k<L.length-1?L[k+1].y-g.y:g.size*W2LH;if(top===null)top=g.y-g.size*W2BASE-(lh-g.size*W2LH)*0;
   paras+=`<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${W2.tw(Math.max(lh,g.size*0.9))}" w:lineRule="exact"/><w:ind w:left="${W2.tw(Math.max(0,g.x-b.x))}"/></w:pPr>${w2runs(g.runs,w2fit(g))}</w:p>`;}
  const last=L[L.length-1];const h=last.y-top+last.size*0.5;
  out+=w2anchor(w2txbox(paras),b.x,top,b.w+L[0].size*1.5,h,false,z++);}
 return out;}
// Flow mode helpers
function w2Order(units){// recursive XY-cut; marks column groups
 const med=units.map(u=>u.size||10).sort((a,b)=>a-b)[units.length>>1]||10;
 function rec(us,depth){if(us.length<=1)return us;
  const xs=us.map(u=>[u.x,u.x+u.w]).sort((a,b)=>a[0]-b[0]);let best=null,end=xs[0][1];for(let k=1;k<xs.length;k++){const gap=xs[k][0]-end;if(gap>Math.max(8,med*1.0)&&(!best||gap>best.g))best={g:gap,x:xs[k][0]};end=Math.max(end,xs[k][1]);}
  if(best){const A=us.filter(u=>u.x<best.x),B=us.filter(u=>u.x>=best.x);const lines=a=>a.filter(u=>u.kind==='seg').length;const ra=rec(A,depth+1),rb=rec(B,depth+1);
   if(lines(A)>=3&&lines(B)>=3){const ha=Math.max(...A.map(u=>u.bot))-Math.min(...A.map(u=>u.top)),hb=Math.max(...B.map(u=>u.bot))-Math.min(...B.map(u=>u.top));if(Math.min(ha,hb)>med*6)return [{kind:'cols',cols:[ra,rb],gap:best.g}];}
   return ra.concat(rb);}
  const ys=us.map(u=>[u.top,u.bot]).sort((a,b)=>a[0]-b[0]);let bh=null;end=ys[0][1];for(let k=1;k<ys.length;k++){const gap=ys[k][0]-end;if(gap>0.5&&(!bh||gap>bh.g))bh={g:gap,y:ys[k][0]};end=Math.max(end,ys[k][1]);}
  if(bh){return rec(us.filter(u=>u.top<bh.y),depth+1).concat(rec(us.filter(u=>u.top>=bh.y),depth+1));}
  return us.slice().sort((a,b)=>a.y-b.y||a.x-b.x);}
 const r=rec(units,0);// flatten nested col groups: merge adjacent column lists
 const flat=a=>a.flatMap(u=>u.kind==='cols'?u.cols.flatMap(c=>flat(c)):[u]);
 return r.map(u=>u.kind==='cols'?{kind:'cols',cols:u.cols.flatMap(c=>c.length===1&&c[0].kind==='cols'?c[0].cols.map(flat):[flat(c)]),gap:u.gap}:u);}
function w2Tables(segs){// find runs of rows with >=2 aligned segments
 const rows=[];for(const g of segs.slice().sort((a,b)=>a.y-b.y||a.x-b.x)){const r=rows.find(r=>Math.abs(r.y-g.y)<g.size*0.35);if(r)r.segs.push(g);else rows.push({y:g.y,size:g.size,segs:[g]});}
 const tables=[],used=new Set();let run=[];
 const flush=()=>{if(run.length>=2){const cols=[];for(const r of run)for(const g of r.segs){let c=cols.find(c=>g.x<c.r+2&&g.x+g.w>c.l-2);if(c){c.l=Math.min(c.l,g.x);c.r=Math.max(c.r,g.x+g.w);}else cols.push({l:g.x,r:g.x+g.w});}
   // merge overlapping columns
   cols.sort((a,b)=>a.l-b.l);const C=[];for(const c of cols){const p=C[C.length-1];if(p&&c.l<p.r+2)p.r=Math.max(p.r,c.r);else C.push({...c});}
   const fill=run.reduce((a,r)=>a+r.segs.length,0)/(run.length*C.length);
   const wordy=C.filter(c=>{const cells=run.flatMap(r=>r.segs.filter(g=>g.x<c.r+1&&g.x+g.w>c.l-1));return cells.length&&cells.reduce((a,g)=>a+g.text.split(/\s+/).length,0)/cells.length>5;}).length;
   if(C.length>=2&&fill>=0.5&&wordy<2){const t={kind:'tbl',cols:C,rows:run.map(r=>C.map(c=>r.segs.filter(g=>g.x<c.r+1&&g.x+g.w>c.l-1)))};const all=run.flatMap(r=>r.segs);t.x=Math.min(...all.map(g=>g.x));t.w=Math.max(...all.map(g=>g.x+g.w))-t.x;t.top=Math.min(...all.map(g=>g.top));t.bot=Math.max(...all.map(g=>g.bot));t.y=t.top;t.size=run[0].size;all.forEach(g=>used.add(g));tables.push(t);}}
  run=[];};
 for(const r of rows){const prev=run[run.length-1];if(r.segs.length>=2&&(!prev||r.y-prev.y<Math.max(r.size,prev.size)*3.2))run.push(r);else{flush();if(r.segs.length>=2)run.push(r);}}flush();
 return {tables,rest:segs.filter(g=>!used.has(g))};}
function w2Flow(pg,addImg){const {tables,rest}=w2Tables(w2Segments(pg.items));
 const units=rest.map(g=>({...g,kind:'seg'})).concat(tables);
 const bigBg=[];for(const im of pg.imgs){if(im.w*im.h>pg.W*pg.H*0.5){bigBg.push(im);continue;}units.push({kind:'img',...im,top:im.y,bot:im.y+im.h,size:10});}
 // drop text inside images? keep.
 const all=units.length?units:[];const ml=Math.max(18,Math.min(90,Math.min(...all.map(u=>u.x),pg.W)-2)),mr=Math.max(18,Math.min(90,pg.W-Math.max(...all.map(u=>u.x+u.w),0)-2));
 const mt=Math.max(18,Math.min(72,Math.min(...all.map(u=>u.top),pg.H)-2)),mb=18;
 const ord=w2Order(units);let out='';let prevBot=mt;
 for(const im of bigBg){const rid=addImg(pg,im);out+=`<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${w2anchor(w2pic(rid),im.x,im.y,im.w,im.h,true,1)}</w:p>`;}
 const emit=(list,colL,colR)=>{let s='';let i=0;
  while(i<list.length){const u=list[i];const before=Math.max(0,u.top-prevBot);
   if(u.kind==='img'){const rid=addImg(pg,u);s+=`<w:p><w:pPr><w:spacing w:before="${W2.tw(before)}" w:after="0"/><w:ind w:left="${W2.tw(Math.max(0,u.x-colL))}"/></w:pPr>${w2inlinePic(rid,Math.min(u.w,colR-colL),u.h*Math.min(1,(colR-colL)/u.w))}</w:p>`;prevBot=u.bot;i++;continue;}
   if(u.kind==='tbl'){const tw=u.cols.map((c,k)=>(k<u.cols.length-1?u.cols[k+1].l:Math.max(c.r,u.x+u.w))-c.l);
    s+=`<w:tbl><w:tblPr><w:tblW w:w="${W2.tw(tw.reduce((a,b)=>a+b,0))}" w:type="dxa"/><w:tblInd w:w="${W2.tw(Math.max(0,u.x-colL))}" w:type="dxa"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(k=>`<w:${k} w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/>`).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="40" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${tw.map(x=>`<w:gridCol w:w="${W2.tw(x)}"/>`).join('')}</w:tblGrid>`;
    for(const row of u.rows){s+='<w:tr>';row.forEach((cell,k)=>{const c=u.cols[k];const right=cell.length&&Math.abs(Math.max(...cell.map(g=>g.x+g.w))-c.r)<2&&cell[0].x-c.l>4;
      s+=`<w:tc><w:tcPr><w:tcW w:w="${W2.tw(tw[k])}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="40"/>${right?'<w:jc w:val="right"/>':''}</w:pPr>${cell.map((g,j)=>w2runs(j?[{...g.runs[0],t:' '+g.runs[0].t},...g.runs.slice(1)]:g.runs)).join('')}</w:p></w:tc>`;});s+='</w:tr>';}
    s+=`</w:tbl>`;prevBot=u.bot;i++;continue;}
   // paragraph: absorb following segs that continue it
   const L=[u];let j=i+1;while(j<list.length&&list[j].kind==='seg'){const a=L[L.length-1],b=list[j];const dy=b.y-a.y;if(dy<=a.size*0.3||dy>Math.max(a.size,b.size)*1.6||Math.abs(a.size-b.size)>a.size*0.05||a.runs[0].fam!==b.runs[0].fam||a.runs[0].color!==b.runs[0].color)break;if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<=0)break;L.push(b);j++;}
   const lefts=L.map(g=>g.x),rights=L.map(g=>g.x+g.w),cent=L.map(g=>g.x+g.w/2);const spread=a=>Math.max(...a)-Math.min(...a);const cw=colR-colL;
   let jc='';if(L.length>1){if(spread(lefts)<3&&L.length>2&&spread(rights.slice(0,-1))<3)jc='both';else if(spread(lefts)>=3&&spread(cent)<3)jc='center';else if(spread(lefts)>=3&&spread(rights)<3)jc='right';}
   else{const g=L[0];if(Math.abs(g.x+g.w/2-(colL+cw/2))<4&&g.x-colL>20)jc='center';else if(Math.abs(g.x+g.w-colR)<4&&g.x-colL>cw*0.3)jc='right';}
   const ind=jc==='center'||jc==='right'?0:Math.max(0,Math.min(...lefts.slice(1).concat(L.length>1?[]:lefts))-colL);const first=L.length>1&&!jc?L[0].x-colL-ind:0;
   const runs=[];L.forEach((g,k)=>{g.runs.forEach((r,m)=>{let t=r.t;if(k&&m===0){const prev=runs[runs.length-1];if(prev&&/[a-z]-$/.test(prev.t)&&/^[a-z]/.test(t))prev.t=prev.t.slice(0,-1);else t=' '+t;}const p=runs[runs.length-1];if(p&&sameStyle(p,r))p.t+=t;else runs.push({...r,t});});});
   const lh=L.length>1?(L[L.length-1].y-L[0].y)/(L.length-1):0;
   s+=`<w:p><w:pPr><w:spacing w:before="${W2.tw(Math.min(before,200))}" w:after="0"${lh?` w:line="${W2.tw(lh)}" w:lineRule="exact"`:''}/><w:ind w:left="${W2.tw(ind)}"${first>2?` w:firstLine="${W2.tw(first)}"`:first<-2?` w:hanging="${W2.tw(-first)}"`:''}/>${jc?`<w:jc w:val="${jc}"/>`:''}</w:pPr>${w2runs(runs)}</w:p>`;
   prevBot=L[L.length-1].bot;i=j;}
  return s;};
 const secs=[];let cur=[];for(const u of ord){if(u.kind==='cols'){if(cur.length)secs.push({cols:1,list:cur});cur=[];secs.push(u);}else cur.push(u);}if(cur.length||!secs.length)secs.push({cols:1,list:cur});
 const margins={ml,mr,mt,mb};const parts=[];
 for(const sct of secs){if(sct.kind==='cols'){prevBot=Math.min(...sct.cols.flat().map(u=>u.top));const colW=(pg.W-ml-mr-sct.gap*(sct.cols.length-1))/sct.cols.length;let s='';
   sct.cols.forEach((c,k)=>{const top=prevBot;const cl=ml+k*(colW+sct.gap);s+=emit(c,cl,cl+colW);if(k<sct.cols.length-1)s+='<w:p><w:r><w:br w:type="column"/></w:r></w:p>';prevBot=top;});prevBot=Math.max(...sct.cols.flat().map(u=>u.bot));parts.push({xml:s,cols:sct.cols.length,gap:sct.gap});}
  else parts.push({xml:emit(sct.list,ml,pg.W-mr),cols:1});}
 return {parts:out?[{xml:out,cols:1}].concat(parts):parts,margins};}
TOOLS.pdf2word={noAdv:true,opts:()=>sel('wmode',T.o_wMode||'Layout',[['exact',T.o_wExact||'Exact layout – looks identical, text in movable boxes'],['flow',T.o_wFlow||'Flowing text – normal paragraphs, tables & columns']])+sel('wocr',T.o_wOcr||'OCR for scanned pages (free)',[['auto',T.o_wOcrAuto||'Auto – only pages without text'],['off',T.o_wOcrOff||'Off'],['all',T.o_wOcrAll||'All pages']])+sel('wlang',T.o_ocrLang||'Language',WOL),
 async run([f],status){let ocrW=null;const mode=v('wmode')||'exact',ocrMode=v('wocr')||'auto';const doc=await openPdfjs(await buf(f));await L.pdfjs();const JSZip=await L.zip();w2id=1;
  const media=[];const addBlob=async(blob,ext)=>{const rid='rIdM'+(media.length+1);media.push({rid,name:`image${media.length+1}.${ext}`,blob});return rid;};
  let body='';let ocrPages=0;const pend=[];
  const pages=[];for(let i=1;i<=doc.numPages;i++){status(`${T.working} ${i}/${doc.numPages}`);
   const pg=await w2Page(doc,i,{mode,ocrMode,ocr:async c=>{ocrW=ocrW||await wOcr(v('wlang')||'eng',status);return ocrW.recognize(c,{},{text:true,tsv:true});}});if(pg.ocr)ocrPages++;
   if(mode==='exact'){let rid=null;if(!pg.blank){const b=await toBlob(pg.bg,'image/jpeg',0.85);rid=await addBlob(b,'jpeg');}
    const last=i===doc.numPages;const xml=w2Exact(pg,rid);body+=`<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr>${last?'':w2sect(pg,{type:i>1?'nextPage':undefined})}</w:pPr>${xml}</w:p>`;pages.push(pg);if(last)body+=w2sect(pg,{type:i>1?'nextPage':undefined});}
   else{const crops=[];const addImg=(p,im)=>{const rid='rIdM'+(media.length+crops.length+1);crops.push({rid,im});return rid;};const r=w2Flow(pg,addImg);
    for(const c of crops){const cv=document.createElement('canvas');const sx=Math.max(0,c.im.x*pg.s),sy=Math.max(0,c.im.y*pg.s);cv.width=Math.max(1,Math.round(c.im.w*pg.s));cv.height=Math.max(1,Math.round(c.im.h*pg.s));cv.getContext('2d').drawImage(pg.bg,sx,sy,cv.width,cv.height,0,0,cv.width,cv.height);media.push({rid:c.rid,name:`image${media.length+1}.jpeg`,blob:await toBlob(cv,'image/jpeg',0.9)});}
    const last=i===doc.numPages;r.parts.forEach((p,k)=>{const isLastPart=k===r.parts.length-1;const type=k===0?(i>1?'nextPage':null):'continuous';const sp=w2sect(pg,{...r.margins,cols:p.cols,gap:p.gap,type:type||undefined});
      body+=p.xml||'<w:p/>';if(!(last&&isLastPart))body+=`<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr>${sp}</w:pPr></w:p>`;else body+=sp;});}
   pg.bg.width=pg.bg.height=0;}
  if(ocrW)await ocrW.terminate();
  const z=new JSZip();
  z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>');
  z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/_rels/document.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>${media.map(m=>`<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`).join('')}</Relationships>`);
  z.file('word/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>');
  z.file('word/settings.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>');
  for(const m of media)z.file('word/media/'+m.name,m.blob);
  z.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable=""><w:body>${body}</w:body></w:document>`);
  return {blob:await z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),name:base(f.name)+'.docx',info:ocrPages?`${ocrPages} scanned page(s) converted with OCR.`:''};}};
