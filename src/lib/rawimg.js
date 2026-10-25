function newCanvas(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c}
// Camera RAW (CR2/CR3/NEF/ARW/DNG/ORF/RW2/PEF/RAF/SRW): extract the largest embedded full-size JPEG preview the camera stored.
// No demosaicing – the preview is what the camera rendered (same as the camera's own JPEG at the shot's settings).
function rawJpegs(b){const out=[];for(let i=0;i<b.length-4;i++){if(b[i]!==0xFF||b[i+1]!==0xD8||b[i+2]!==0xFF)continue;let p=i+2,w=0,h=0,ok=false,lossless=false;
  while(p<b.length-4){if(b[p]!==0xFF){break}const m=b[p+1];if(m===0xD8||m===0x01||(m>=0xD0&&m<=0xD7)){p+=2;continue}const L=(b[p+2]<<8)|b[p+3];
   if(m===0xC0||m===0xC1||m===0xC2){h=(b[p+5]<<8)|b[p+6];w=(b[p+7]<<8)|b[p+8];}if(m===0xC3)lossless=true;
   if(m===0xDA){p+=2+L;while(p<b.length-1){if(b[p]===0xFF&&b[p+1]!==0&&!(b[p+1]>=0xD0&&b[p+1]<=0xD7)){if(b[p+1]===0xD9){ok=true;p+=2}break}p++}break}p+=2+L;}
  if(ok&&!lossless&&w*h>0){out.push({s:i,e:p,w,h});i=p-1;}}return out.sort((a,b)=>b.w*b.h-a.w*a.h);}
function rawOrientation(b){try{const le=b[0]===0x49;if(!(le||b[0]===0x4D))return 1;const v=new DataView(b.buffer,b.byteOffset);const u16=o=>v.getUint16(o,le),u32=o=>v.getUint32(o,le);const ifd=u32(4);const n=u16(ifd);for(let k=0;k<n;k++){const o=ifd+2+k*12;if(u16(o)===0x112)return u16(o+8)||1;}}catch(e){}return 1;}
async function rawToCanvas(f){const b=new Uint8Array(await f.arrayBuffer());const js=rawJpegs(b);if(!js.length)throw new Error(f.name+': no embedded preview found in this RAW file.');
 let bm;for(const j of js){try{bm=await createImageBitmap(new Blob([b.subarray(j.s,j.e)],{type:'image/jpeg'}));break}catch(e){}}if(!bm)throw new Error(f.name+': could not decode the RAW preview.');
 const o=rawOrientation(b);const rot=o===6||o===8;const c=newCanvas(rot?bm.height:bm.width,rot?bm.width:bm.height);const x=c.getContext('2d');if(o===6){x.translate(c.width,0);x.rotate(Math.PI/2)}else if(o===8){x.translate(0,c.height);x.rotate(-Math.PI/2)}else if(o===3){x.translate(c.width,c.height);x.rotate(Math.PI)}x.drawImage(bm,0,0);return c;}
// TGA (uncompressed + RLE, 8/16/24/32-bit, colour-mapped and grayscale)
function tgaToCanvas(buf){const b=new Uint8Array(buf);const idl=b[0],cmt=b[1],it=b[2],cml=b[5]|(b[6]<<8),cmd=b[7],w=b[12]|(b[13]<<8),h=b[14]|(b[15]<<8),bpp=b[16],desc=b[17];if(!w||!h||![1,2,3,9,10,11].includes(it))throw new Error('Not a supported TGA file.');
 let p=18+idl;const cm=[];if(cmt){const eb=Math.ceil(cmd/8);for(let i=0;i<cml;i++){cm.push(b.slice(p,p+eb));p+=eb;}}const px=Math.ceil(bpp/8);const n=w*h;const raw=new Uint8Array(n*px);
 if(it>8){let i=0;while(i<n){const c=b[p++];const cnt=(c&0x7f)+1;if(c&0x80){const v=b.subarray(p,p+px);p+=px;for(let k=0;k<cnt;k++)raw.set(v,(i++)*px);}else{raw.set(b.subarray(p,p+cnt*px),i*px);p+=cnt*px;i+=cnt;}}}else raw.set(b.subarray(p,p+n*px));
 const c=newCanvas(w,h);const id=c.getContext('2d').createImageData(w,h);const d=id.data;const top=desc&0x20,right=desc&0x10;const col=(src,eb)=>{if(eb===1)return [src[0],src[0],src[0],255];if(eb===2){const v=src[0]|(src[1]<<8);return [((v>>10)&31)*255/31,((v>>5)&31)*255/31,(v&31)*255/31,255]}return [src[2],src[1],src[0],eb===4?src[3]:255]};
 const alpha=(desc&15)>0||bpp===32;for(let i=0;i<n;i++){let s=raw.subarray(i*px,i*px+px);let rgba;if(it===1||it===9){const e=cm[px===2?s[0]|(s[1]<<8):s[0]];rgba=col(e,e.length)}else if(it===3||it===11)rgba=[s[0],s[0],s[0],px===2?s[1]:255];else rgba=col(s,px);
  const x0=i%w,y0=(i/w)|0;const x=right?w-1-x0:x0,y=top?y0:h-1-y0;const o=(y*w+x)*4;d[o]=rgba[0];d[o+1]=rgba[1];d[o+2]=rgba[2];d[o+3]=alpha?rgba[3]:255;}
 c.getContext('2d').putImageData(id,0,0);return c;}
