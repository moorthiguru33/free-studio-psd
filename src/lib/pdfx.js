// Shared PDF helpers: multi-script Noto text, rasterize, text extraction, diff
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
// rasterize page i (1-based) of pdf.js doc into pdf-lib doc d as JPEG page of same size
async function rasterInto(d,pjDoc,i,{scale=2,q=.85,gray=false,draw}={}){const pg=await pjDoc.getPage(i);const vp=pg.getViewport({scale:1});const c=await renderPage(pjDoc,i,scale);const ctx=c.getContext('2d');
  if(draw)draw(ctx,scale,vp);
  if(gray){const im=ctx.getImageData(0,0,c.width,c.height),dt=im.data;for(let k=0;k<dt.length;k+=4){const g=dt[k]*.299+dt[k+1]*.587+dt[k+2]*.114;dt[k]=dt[k+1]=dt[k+2]=g;}ctx.putImageData(im,0,0);}
  const img=await d.embedJpg(new Uint8Array(await (await toBlob(c,'image/jpeg',q)).arrayBuffer()));c.width=c.height=0;const p=d.addPage([vp.width,vp.height]);p.drawImage(img,{x:0,y:0,width:vp.width,height:vp.height});return p;}
async function zipOrOne(items,zipName){return items.length===1?items[0]:{blob:await zipBlobs(items),name:zipName};}
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
