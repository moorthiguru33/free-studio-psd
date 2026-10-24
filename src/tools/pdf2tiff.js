// @needs pdfx
// PDF -> multi-page TIFF (Deflate compressed, fax/archive friendly)
function tiffMulti(pages,dpi){// pages: [{w,h,gray,data(Uint8Array deflated)}]
 const parts=[];let off=8;const hdr=new Uint8Array(8);const hv=new DataView(hdr.buffer);hv.setUint16(0,0x4949);hv.setUint16(2,42,true);parts.push(hdr);let prevNext=null;
 for(const p of pages){const spp=p.gray?1:3;const nT=12;const ifdSize=2+nT*12+4;const bpsOff=off+ifdSize,resOff=bpsOff+8,dataOff=resOff+16;
  if(prevNext)prevNext.v.setUint32(prevNext.o,off,true);else hv.setUint32(4,off,true);
  const b=new Uint8Array(ifdSize+8+16);const dv=new DataView(b.buffer);dv.setUint16(0,nT,true);let k=2;const tag=(t,ty,c,val)=>{dv.setUint16(k,t,true);dv.setUint16(k+2,ty,true);dv.setUint32(k+4,c,true);if(ty===3&&c===1)dv.setUint16(k+8,val,true);else dv.setUint32(k+8,val,true);k+=12;};
  tag(256,4,1,p.w);tag(257,4,1,p.h);if(spp===3)tag(258,3,3,bpsOff);else tag(258,3,1,8);tag(259,3,1,8);tag(262,3,1,spp===3?2:1);tag(273,4,1,dataOff);tag(277,3,1,spp);tag(278,4,1,p.h);tag(279,4,1,p.data.length);tag(282,5,1,resOff);tag(283,5,1,resOff+8);tag(296,3,1,2);
  prevNext={v:dv,o:k};dv.setUint32(k,0,true);const o2=ifdSize;dv.setUint16(o2,8,true);dv.setUint16(o2+2,8,true);dv.setUint16(o2+4,8,true);dv.setUint32(o2+8,dpi,true);dv.setUint32(o2+12,1,true);dv.setUint32(o2+16,dpi,true);dv.setUint32(o2+20,1,true);
  parts.push(b,p.data);off=dataOff+p.data.length;if(off%2){parts.push(new Uint8Array(1));off++;}}
 return new Blob(parts,{type:'image/tiff'});}
TOOLS.pdf2tiff={opts:()=>sel('tdpi',T.o_dpi,[['150','150 DPI'],['200','200 DPI'],['300','300 DPI'],['100','100 DPI']])+chk('tgray',T.o_grayscale,false),
 async run([f],status){await load('pako.min.js');const pj=await openPdfjs(await buf(f));const dpi=+v('tdpi');const gray=vb('tgray');const pages=[];
  for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);const c=await renderPage(pj,i,dpi/72);const id=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const n=c.width*c.height;const raw=new Uint8Array(n*(gray?1:3));
   for(let j=0,o=0;j<n;j++){const r=id[j*4],g=id[j*4+1],b=id[j*4+2],a=id[j*4+3]/255;const R=r*a+255*(1-a),G=g*a+255*(1-a),B=b*a+255*(1-a);if(gray)raw[o++]=.299*R+.587*G+.114*B;else{raw[o++]=R;raw[o++]=G;raw[o++]=B;}}
   pages.push({w:c.width,h:c.height,gray,data:window.pako.deflate(raw)});}
  return {blob:tiffMulti(pages,dpi),name:base(f.name)+'.tiff',info:`${pages.length} ${T.pages}`};}};
