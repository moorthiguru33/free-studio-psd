// Shared image helpers (canvas based). Decoders/encoders for formats the browser lacks are lazy-loaded.
const IL={upng:()=>load('pako.min.js').then(()=>load('UPNG.js')).then(()=>window.UPNG),utif:()=>load('pako.min.js').then(()=>load('UTIF.js')).then(()=>window.UTIF),
 heic:()=>load('heic2any.min.js').then(()=>window.heic2any),avif:()=>load('avif.js').then(()=>window.AvifEnc),gifenc:()=>load('gifenc.js').then(()=>window.gifenc),
 tracer:()=>load('imagetracer.js').then(()=>window.ImageTracer)};
const EXT={jpg:'jpg',jpeg:'jpg',png:'png',webp:'webp',avif:'avif',bmp:'bmp',gif:'gif',ico:'ico',tiff:'tiff',svg:'svg'};
const MIME={jpg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif',bmp:'image/bmp',gif:'image/gif',ico:'image/x-icon',tiff:'image/tiff',svg:'image/svg+xml'};
const extOf=n=>(n.match(/\.([^.]+)$/)||[,''])[1].toLowerCase();
const fmtOf=f=>{const e=extOf(f.name);if(EXT[e])return EXT[e];if(/heic|heif/.test(e)||/hei[cf]/.test(f.type))return 'heic';if(/tif/.test(e))return 'tiff';const t=(f.type||'').split('/')[1]||'';return EXT[t]||'png';};
const newCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;};
async function isHeic(f){const b=new Uint8Array(await f.slice(0,32).arrayBuffer());const s=String.fromCharCode(...b.slice(4,12));return /ftyp(heic|heix|hevc|hevx|mif1|msf1|heim|heis)/.test(s);}
// Decode any supported image file into a canvas (EXIF orientation applied).
async function fileToCanvas(f){const e=extOf(f.name);
 if(/^(cr2|cr3|nef|nrw|arw|srf|sr2|dng|orf|rw2|pef|raf|srw|raw|rwl|3fr|erf|kdc|mrw|x3f)$/.test(e)){await load('rawimg.js');return rawToCanvas(f);}
 if(e==='tga'||e==='icb'||e==='vda'){await load('rawimg.js');return tgaToCanvas(await f.arrayBuffer());}
 if(e==='psd'||e==='psb'){await load('agpsd.js');const p=window.agPsd.readPsd(await f.arrayBuffer(),{skipLayerImageData:true,skipThumbnail:true,useImageData:false});if(!p.canvas)throw new Error(f.name+': this PSD has no composite image (save it with “Maximize compatibility” in Photoshop).');return p.canvas;}
 if(/tiff?/.test(e)||f.type==='image/tiff'){const U=await IL.utif();const ab=await f.arrayBuffer();const ifds=U.decode(ab);U.decodeImage(ab,ifds[0]);const rgba=U.toRGBA8(ifds[0]);const c=newCanvas(ifds[0].width,ifds[0].height);c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer),c.width,c.height),0,0);return c;}
 if(/heic|heif/.test(e)||await isHeic(f)){const h2a=await IL.heic();let b=await h2a({blob:f,toType:'image/png'});if(Array.isArray(b))b=b[0];f=b;}
 if(e==='svg'||f.type==='image/svg+xml'){const u=URL.createObjectURL(f);try{const im=new Image();im.src=u;await im.decode();const w=im.naturalWidth||1024,h=im.naturalHeight||1024;const sc=Math.max(1,1024/Math.max(w,h));const c=newCanvas(w*sc,h*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c;}finally{URL.revokeObjectURL(u);}}
 let bm;try{bm=await createImageBitmap(f,{imageOrientation:'from-image'});}catch(err){const u=URL.createObjectURL(f);try{const im=new Image();im.src=u;await im.decode();bm=im;}catch(e2){throw new Error(`Cannot read image ${f.name} (unsupported format)`);}finally{URL.revokeObjectURL(u);}}
 const c=newCanvas(bm.width||bm.naturalWidth,bm.height||bm.naturalHeight);c.getContext('2d').drawImage(bm,0,0);bm.close?.();return c;}
const flatten=(c,bg='#ffffff')=>{const o=newCanvas(c.width,c.height);const x=o.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,o.width,o.height);x.drawImage(c,0,0);return o;};
function bmpBlob(c){const w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data;const row=w*4,size=54+row*h;const b=new ArrayBuffer(size),v=new DataView(b);v.setUint16(0,0x424D);v.setUint32(2,size,true);v.setUint32(10,54,true);v.setUint32(14,40,true);v.setInt32(18,w,true);v.setInt32(22,-h,true);v.setUint16(26,1,true);v.setUint16(28,32,true);v.setUint32(34,row*h,true);
 const u=new Uint8Array(b);for(let i=0,o=54;i<w*h;i++,o+=4){u[o]=d[i*4+2];u[o+1]=d[i*4+1];u[o+2]=d[i*4];u[o+3]=d[i*4+3];}return new Blob([b],{type:'image/bmp'});}
// ICO containing PNG images (Vista+ format, supported by all browsers)
async function icoBlob(c,sizes=[16,32,48]){const pngs=[];for(const s of sizes){const o=newCanvas(s,s);const x=o.getContext('2d');x.imageSmoothingQuality='high';const sc=Math.min(s/c.width,s/c.height);x.drawImage(c,(s-c.width*sc)/2,(s-c.height*sc)/2,c.width*sc,c.height*sc);pngs.push(new Uint8Array(await (await toBlob(o,'image/png')).arrayBuffer()));}
 const head=6+16*sizes.length;let off=head;const out=new Uint8Array(head+pngs.reduce((a,p)=>a+p.length,0));const v=new DataView(out.buffer);v.setUint16(2,1,true);v.setUint16(4,sizes.length,true);
 sizes.forEach((s,i)=>{const o=6+16*i;out[o]=s>=256?0:s;out[o+1]=s>=256?0:s;v.setUint16(o+4,1,true);v.setUint16(o+6,32,true);v.setUint32(o+8,pngs[i].length,true);v.setUint32(o+12,off,true);out.set(pngs[i],off);off+=pngs[i].length;});return new Blob([out],{type:'image/x-icon'});}
// Encode a canvas to the requested format. q = 0..1
async function encodeCanvas(c,fmt,q=.85){fmt=EXT[fmt]||fmt;
 if(fmt==='jpg')return toBlob(flatten(c),'image/jpeg',q);
 if(fmt==='png')return toBlob(c,'image/png');
 if(fmt==='webp')return toBlob(c,'image/webp',q);
 if(fmt==='bmp')return bmpBlob(c);
 if(fmt==='ico')return icoBlob(c,c.width>=256&&c.height>=256?[16,32,48,256]:[16,32,48]);
 if(fmt==='avif'){const A=await IL.avif();const id=c.getContext('2d').getImageData(0,0,c.width,c.height);return new Blob([await A.encode(id,{quality:Math.round(q*100)})],{type:'image/avif'});}
 if(fmt==='tiff'){const U=await IL.utif();const id=c.getContext('2d').getImageData(0,0,c.width,c.height);return new Blob([U.encodeImage(id.data.buffer,c.width,c.height)],{type:'image/tiff'});}
 if(fmt==='gif'){const G=await IL.gifenc();const id=c.getContext('2d').getImageData(0,0,c.width,c.height);const pal=G.quantize(id.data,256,{format:'rgba4444',oneBitAlpha:true});const g=G.GIFEncoder();g.writeFrame(G.applyPalette(id.data,pal,'rgba4444'),c.width,c.height,{palette:pal,transparent:true});g.finish();return new Blob([g.bytes()],{type:'image/gif'});}
 throw new Error('Unsupported output format '+fmt);}
const outFmt=(f,choice)=>!choice||choice==='keep'?(['jpg','png','webp','avif','bmp','gif','tiff','ico'].includes(fmtOf(f))?fmtOf(f):'png'):choice;
const imgName=(f,suffix,fmt)=>`${base(f.name)}${suffix}.${fmt}`;
const fmtSel=(id,label,withKeep=true,list=['jpg','png','webp','avif','gif','bmp','tiff','ico'])=>sel(id,label,[...(withKeep?[['keep',T.o_keepFmt||'Same as input']]:[]),...list.map(x=>[x,x.toUpperCase()])]);
const qualityInp=(id='q',def=80)=>inp(id,T.o_quality+' (1-100)','number',String(def),'min="1" max="100"');
// interactive preview: shows a canvas scaled to fit, returns {el, toImg(e)->[x,y] in image px}
function canvasView(c){const wrap=document.createElement('div');wrap.className='imgview';wrap.style.cssText='position:relative;max-width:100%;margin:10px auto;touch-action:none;user-select:none;line-height:0';c.style.cssText='max-width:100%;height:auto;display:block;margin:auto';wrap.appendChild(c);
 const toImg=e=>{const r=c.getBoundingClientRect();return [Math.min(c.width,Math.max(0,(e.clientX-r.left)*c.width/r.width)),Math.min(c.height,Math.max(0,(e.clientY-r.top)*c.height/r.height))];};return {el:wrap,toImg};}
// drag-a-rectangle overlay on a canvas view; onChange(rect in image px)
function rectSelect(view,c,onRect,{aspect=()=>0}={}){let st=null;const box=document.createElement('div');box.className='selrect';box.style.cssText='position:absolute;border:2px dashed #e5322d;background:rgba(229,50,45,.12);pointer-events:none;display:none';view.el.appendChild(box);
 const show=r=>{if(!r){box.style.display='none';return;}const cr=c.getBoundingClientRect(),wr=view.el.getBoundingClientRect();const s=cr.width/c.width;Object.assign(box.style,{display:'block',left:(cr.left-wr.left+r.x*s)+'px',top:(cr.top-wr.top+r.y*s)+'px',width:r.w*s+'px',height:r.h*s+'px'});};
 view.el.addEventListener('pointerdown',e=>{st=view.toImg(e);view.el.setPointerCapture(e.pointerId);});
 view.el.addEventListener('pointermove',e=>{if(!st)return;let [x,y]=view.toImg(e);let w=x-st[0],h=y-st[1];const a=aspect();if(a){const sh=Math.sign(h)||1;h=sh*Math.abs(w)/a;}const r={x:Math.round(Math.min(st[0],st[0]+w)),y:Math.round(Math.min(st[1],st[1]+h)),w:Math.round(Math.abs(w)),h:Math.round(Math.abs(h))};r.w=Math.min(r.w,c.width-r.x);r.h=Math.min(r.h,c.height-r.y);show(r);onRect(r,false);});
 view.el.addEventListener('pointerup',()=>{if(st){st=null;onRect(null,true);}});return {show};}
