// Shared PDF helpers: multi-script Noto text, rasterize, text extraction, diff
const SCRIPTS=[[/[\u0B80-\u0BFF]/,'Tamil'],[/[\u0900-\u097F]/,'Devanagari'],[/[\u0980-\u09FF]/,'Bengali'],[/[\u0C00-\u0C7F]/,'Telugu'],[/[\u0C80-\u0CFF]/,'Kannada'],[/[\u0D00-\u0D7F]/,'Malayalam'],[/[\u0A80-\u0AFF]/,'Gujarati'],[/[\u0A00-\u0A7F]/,'Gurmukhi'],[/[\u0E00-\u0E7F]/,'Thai'],[/[\u0590-\u05FF\uFB1D-\uFB4F]/,'Hebrew'],[/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/,'Arabic'],[/[\u0530-\u058F]/,'Armenian'],[/[\u10A0-\u10FF\u1C90-\u1CBF]/,'Georgian'],[/[\u1200-\u139F\u2D80-\u2DDF]/,'Ethiopic'],[/[\u1780-\u17FF\u19E0-\u19FF]/,'Khmer'],[/[\u0E80-\u0EFF]/,'Lao'],[/[\u1000-\u109F\uAA60-\uAA7F]/,'Myanmar'],[/[\u0D80-\u0DFF]/,'Sinhala'],[/[\u0B00-\u0B7F]/,'Oriya'],[/[\u0F00-\u0FFF]/,'Tibetan'],[/[\u0780-\u07BF]/,'Thaana'],[/[\u1800-\u18AF]/,'Mongolian'],[/[\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F]/,'JP'],[/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/,'KR'],[/[\u2E80-\u2FDF\u3000-\u303F\u3100-\u312F\u31A0-\u31BF\u3200-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF65\uFFE0-\uFFEF]|[\uD840-\uD87F][\uDC00-\uDFFF]/,'CJK']];
// Han characters use the Japanese/Korean font when the text has kana/hangul, Traditional for zh-TW/HK/MO, else Simplified
const cjkKey=t=>/[\u3040-\u30FF\u31F0-\u31FF]/.test(t)?'JP':/[\uAC00-\uD7AF\u1100-\u11FF]/.test(t)?'KR':/^zh-(TW|HK|MO|Hant)/i.test((document.documentElement.lang&&document.documentElement.lang.startsWith('zh')?document.documentElement.lang:'')||navigator.language||'')?'TC':'SC';
const WINANSI_EXTRA='€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const NEUTRAL=/[\u200C\u200D\s\d.,:;!?'"()\[\]\-–—\/+*%&@#]/;
const fontBytes={};const fetchFont=n=>fontBytes[n]||(fontBytes[n]=fetch('/fonts/'+n+'.ttf').then(r=>{if(!r.ok)throw new Error('Font '+n);return r.arrayBuffer();}));
const docFonts=new WeakMap();
async function getFont(doc,key,bold){let c=docFonts.get(doc);if(!c){c={};docFonts.set(doc,c);}const id=key+(bold?'B':'');if(c[id])return c[id];
  if(key==='std'){const {StandardFonts}=window.PDFLib;c[id]=doc.embedFont(bold?StandardFonts.HelveticaBold:StandardFonts.Helvetica);}
  else{c[id]=(async()=>{const fk=await L.fontkit();doc.registerFontkit(fk);const n=key==='Latin'?(bold?'NotoSans-Bold':'NotoSans-Regular'):`NotoSans${key}-Regular`;return doc.embedFont(await fetchFont(n),{subset:true});})();}
  return c[id];}
const cjkHint=(doc,text)=>{let c=docFonts.get(doc);if(!c){c={};docFonts.set(doc,c);}if(!c.cjk&&/[\u2E80-\u9FFF\uAC00-\uD7AF]/.test(text))c.cjk=cjkKey(text);};
const scriptKey=ch=>{for(const [re,k] of SCRIPTS)if(re.test(ch))return k;return 'std';};
async function textRuns(doc,text,bold){text=String(text).replace(/[\r\n\t]+/g,' ');const enc=ch=>{const c=ch.codePointAt(0);return (c>=32&&c<127)||(c>=160&&c<=255)||WINANSI_EXTRA.includes(ch);};
  const runs=[];for(const ch of text){let k=NEUTRAL.test(ch)&&runs.length?runs[runs.length-1].k:scriptKey(ch);if(k==='std'&&!enc(ch))k='Latin';const last=runs[runs.length-1];if(last&&last.k===k)last.t+=ch;else runs.push({k,t:ch});}
  const dc=docFonts.get(doc)||{};const CJ=['SC','TC','JP','KR'];const has=(f,ch)=>{const ff=f.embedder&&f.embedder.font;return !ff||!ff.hasGlyphForCodePoint||ff.hasGlyphForCodePoint(ch.codePointAt(0));};const out=[];
  for(const r of runs){if(r.k==='CJK')r.k=dc.cjk||cjkKey(text);r.font=await getFont(doc,r.k,bold);
   if(!CJ.includes(r.k)||[...r.t].every(ch=>has(r.font,ch))){out.push(r);continue;}
   // a CJK font lacks some characters (e.g. Simplified-only Han in a Japanese document): fall back per character to the other CJK fonts
   for(const ch of r.t){let k=r.k,f=r.font;if(!has(f,ch)&&!NEUTRAL.test(ch))for(const k2 of CJ){if(k2===r.k)continue;const f2=await getFont(doc,k2,bold);if(has(f2,ch)){k=k2;f=f2;break;}}const l=out[out.length-1];if(l&&l.k===k)l.t+=ch;else out.push({k,t:ch,font:f});}}
  // characters missing from a script font (e.g. ':' in Thai/Bengali/Hebrew) are drawn with the Latin Noto font
  const fin=[];for(const r of out){if(r.k==='std'||r.k==='Latin'||CJ.includes(r.k)||[...r.t].every(ch=>has(r.font,ch))){fin.push(r);continue;}let cur=null;for(const ch of r.t){const k=has(r.font,ch)||/[\u200C\u200D]/.test(ch)?r.k:'Latin';if(!cur||cur.k!==k){cur={k,t:'',font:k===r.k?r.font:await getFont(doc,'Latin',bold)};fin.push(cur);}cur.t+=ch;}}
  await shapeRuns(fin);return fin;}
// ---- complex-script shaping (HarfBuzz, lazy-loaded wasm): conjuncts/ligatures, mark positioning, Arabic joining, RTL ----
const COMPLEX=new Set(['Devanagari','Bengali','Tamil','Telugu','Kannada','Malayalam','Gujarati','Gurmukhi','Oriya','Sinhala','Thai','Lao','Khmer','Myanmar','Tibetan','Arabic','Hebrew','Thaana','Mongolian']);
const RTLK=new Set(['Arabic','Hebrew','Thaana']);
const hbLib=()=>window.__hb||(window.__hb=import('/vendor/hb/index.mjs'));const hbFonts={};
const hbFont=k=>hbFonts[k]||(hbFonts[k]=(async()=>{const hb=await hbLib();const face=new hb.Face(new hb.Blob(await fetchFont(`NotoSans${k}-Regular`)));return {hb,font:new hb.Font(face),upem:face.upem};})());
function hbShape(H,text,rtl){const {hb,font}=H;const b=new hb.Buffer();b.addText(text);b.guessSegmentProperties();if(rtl!=null)b.setDirection(rtl?hb.Direction.RTL:hb.Direction.LTR);hb.shape(font,b);const inf=b.getGlyphInfos(),pos=b.getGlyphPositions();
  const cls=[...new Set(inf.map(g=>g.cluster))].sort((a,b)=>a-b);const seen=new Set();
  return inf.map((g,i)=>{let cps=[];if(!seen.has(g.cluster)){seen.add(g.cluster);const j=cls.indexOf(g.cluster);cps=[...text.slice(g.cluster,j+1<cls.length?cls[j+1]:text.length)].map(c=>c.codePointAt(0));}return {g:g.codepoint,ax:pos[i].xAdvance,dx:pos[i].xOffset,dy:pos[i].yOffset,cps};});}
async function shapeRuns(runs){for(const r of runs){if(!COMPLEX.has(r.k))continue;try{const H=await hbFont(r.k);r.upem=H.upem;r.rtl=RTLK.has(r.k);
   if(!r.rtl){r.glyphs=hbShape(H,r.t);continue;}
   // inside RTL text, digit groups stay left-to-right: shape segments separately, then lay them out right-to-left
   const segs=r.t.match(/[0-9\u0660-\u0669\u06F0-\u06F9]+(?:[.,:\/][0-9\u0660-\u0669\u06F0-\u06F9]+)*|[^0-9\u0660-\u0669\u06F0-\u06F9]+/g)||[];r.glyphs=segs.reverse().flatMap(t=>hbShape(H,t,!/^[0-9\u0660-\u0669\u06F0-\u06F9]/.test(t)));}catch(e){console.warn('shaping',e);delete r.glyphs;}}}
const runW=(r,size)=>r.glyphs?r.glyphs.reduce((a,g)=>a+g.ax,0)*size/r.upem:r.font.widthOfTextAtSize(r.t,size);
const runsWidth=(runs,size)=>runs.reduce((a,r)=>a+runW(r,size),0);
// visual order of runs: reverse right-to-left sequences (base direction from the first strong run)
function visualRuns(runs,forceBase){const strong=r=>r.rtl?1:/[^\s\d.,:;!?'"()\[\]\-–—\/+*%&@#]/.test(r.t)?0:-1;const base=forceBase!=null?forceBase:runs.map(strong).find(x=>x>=0)===1;
  const out=base?[...runs].reverse():[...runs];const want=base?0:1;for(let i=0;i<out.length;){if(strong(out[i])!==want){i++;continue;}let j=i;while(j+1<out.length&&strong(out[j+1])!==(1-want))j++;while(j>i&&strong(out[j])!==want)j--;out.splice(i,j-i+1,...out.slice(i,j+1).reverse());i=j+1;}return out;}
function drawShaped(page,r,{x,y,size,color,opacity=1,rotate=0,noAT=false}){const P=window.PDFLib;const emb=r.font.embedder;const k=size/r.upem,a=rotate*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  page.setFont(r.font);const key=page.fontKey;const ops=[P.pushGraphicsState()];// RTL: marked content with /ActualText in logical order so copy/paste and search are correct in every reader
  if(r.rtl&&noAT===false)ops.push(P.PDFOperator.of('BDC',[P.PDFName.of('Span'),page.doc.context.obj({ActualText:P.PDFHexString.fromText(r.t)})]));if(opacity<1){const gs=page.maybeEmbedGraphicsState({opacity});if(gs)ops.push(P.setGraphicsState(gs));}
  ops.push(P.setFillingColor(color||P.rgb(0,0,0)),P.beginText(),P.setFontAndSize(key,size));let pen=0;
  for(const g of r.glyphs){const fg=emb.font.getGlyph(g.g,g.cps);if(!fg.codePoints.length&&g.cps.length)fg.codePoints=g.cps;const sid=emb.subset.includeGlyph(fg);emb.glyphs[sid-1]=fg;emb.glyphIdMap.set(fg.id,sid);
   const gx=(pen+g.dx)*k,gy=g.dy*k;ops.push(P.setTextMatrix(c,s,-s,c,x+gx*c-gy*s,y+gx*s+gy*c),P.showText(P.PDFHexString.of(sid.toString(16).padStart(4,'0'))));pen+=g.ax;}
  emb.glyphCache.invalidate();ops.push(P.endText());if(r.rtl&&noAT===false)ops.push(P.PDFOperator.of('EMC'));ops.push(P.popGraphicsState());page.pushOperators(...ops);}
function drawRuns(page,runs,{x,y,size,color,opacity=1,rotate=0,noAT=false}){const {degrees}=window.PDFLib;const a=rotate*Math.PI/180;for(const r of visualRuns(runs)){if(r.glyphs)drawShaped(page,r,{x,y,size,color,opacity,rotate,noAT});else page.drawText(r.t,{x,y,size,font:r.font,color,opacity,rotate:degrees(rotate)});const w=runW(r,size);x+=w*Math.cos(a);y+=w*Math.sin(a);}}
async function drawText(doc,page,text,o){const runs=await textRuns(doc,text,o.bold);drawRuns(page,runs,o);return runsWidth(runs,o.size);}
const hex2rgb=h=>{const {rgb}=window.PDFLib;const c=(h||'#000000').match(/\w\w/g).map(x=>parseInt(x,16)/255);return rgb(...c);};
const POS=()=>[['bc','Bottom center'],['br','Bottom right'],['bl','Bottom left'],['tc','Top center'],['tr','Top right'],['tl','Top left']];
const place=(p,pos,w,size,m=24)=>{const {x:bx,y:by,width:W,height:H}=p.getCropBox();return {x:bx+(pos[1]==='c'?(W-w)/2:pos[1]==='r'?W-w-m:m),y:by+(pos[0]==='b'?m:H-m-size)};};
// rasterize page i (1-based) of pdf.js doc into pdf-lib doc d as JPEG page of same size
async function rasterInto(d,pjDoc,i,{scale=2,q=.85,gray=false,draw}={}){const pg=await pjDoc.getPage(i);const vp=pg.getViewport({scale:1});const c=await renderPage(pjDoc,i,scale);const ctx=c.getContext('2d');
  if(draw)draw(ctx,scale,vp);
  if(gray){const im=ctx.getImageData(0,0,c.width,c.height),dt=im.data;for(let k=0;k<dt.length;k+=4){const g=dt[k]*.299+dt[k+1]*.587+dt[k+2]*.114;dt[k]=dt[k+1]=dt[k+2]=g;}ctx.putImageData(im,0,0);}
  const img=await d.embedJpg(new Uint8Array(await (await toBlob(c,'image/jpeg',q)).arrayBuffer()));c.width=c.height=0;const p=d.addPage([vp.width,vp.height]);p.drawImage(img,{x:0,y:0,width:vp.width,height:vp.height});return p;}
async function pageTexts(pjDoc){const out=[];for(let i=1;i<=pjDoc.numPages;i++){const pg=await pjDoc.getPage(i);const tc=await pg.getTextContent();out.push({items:tc.items.filter(it=>'str' in it),vp:pg.getViewport({scale:1})});}return out;}
const lineTexts=items=>{const lines=[];let cur=null;for(const it of items){const y=it.transform[5],h=Math.abs(it.transform[3])||10;if(!cur||Math.abs(cur.y-y)>h*.5){cur={y,t:''};lines.push(cur);}cur.t+=it.str;if(it.hasEOL)cur=null;}return lines.map(l=>l.t.replace(/\s+/g,' ').trim()).filter(Boolean);};

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

// wrap a whole line in one /ActualText span (logical order) so multi-word RTL lines copy correctly
function lineActualText(page,text,fn,font,size){const P=window.PDFLib;page.pushOperators(P.PDFOperator.of('BDC',[P.PDFName.of('Span'),page.doc.context.obj({ActualText:P.PDFHexString.fromText(text)})]));fn();
  // some readers (poppler) need a current font when the span closes
  if(font){page.setFont(font);page.pushOperators(P.setFontAndSize(page.fontKey,size));}page.pushOperators(P.PDFOperator.of('EMC'));}
