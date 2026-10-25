// OTF (CFF outlines) -> TTF (TrueType quadratic outlines). Glyph paths are read with opentype.js (MIT); cubic curves are
// approximated by quadratic splines within a tolerance of ~1/1000 em; all other OpenType tables (cmap, hmtx, GSUB, GPOS, name, OS/2…) are kept.
// PostScript hints are dropped (TrueType output is unhinted).
function otfToTtf(sf,opentype){
 const dv=new DataView(sf.buffer,sf.byteOffset,sf.byteLength);const n=dv.getUint16(4);const T={};
 for(let i=0;i<n;i++){const o=12+16*i;const tag=String.fromCharCode(sf[o],sf[o+1],sf[o+2],sf[o+3]);T[tag]=sf.slice(dv.getUint32(o+8),dv.getUint32(o+8)+dv.getUint32(o+12));}
 if(T['CFF2'])throw new Error('Variable CFF2 fonts are not supported.');if(!T['CFF '])throw new Error('This font has no CFF outlines.');
 const font=opentype.parse(sf.buffer.slice(sf.byteOffset,sf.byteOffset+sf.byteLength));const upem=font.unitsPerEm||1000;const tol=Math.max(0.5,upem/1000);
 const N=font.glyphs.length;const glyphs=[];let maxP=0,maxC=0;
 const cubic=(p0,p1,p2,p3,out)=>{const ex=p3[0]-3*p2[0]+3*p1[0]-p0[0],ey=p3[1]-3*p2[1]+3*p1[1]-p0[1];const err=Math.hypot(ex,ey)*Math.sqrt(3)/36;const k=Math.max(1,Math.ceil(Math.cbrt(err/tol)));
  const B=t=>{const u=1-t;return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]];};
  const D=t=>{const u=1-t;return [3*(u*u*(p1[0]-p0[0])+2*u*t*(p2[0]-p1[0])+t*t*(p3[0]-p2[0])),3*(u*u*(p1[1]-p0[1])+2*u*t*(p2[1]-p1[1])+t*t*(p3[1]-p2[1]))];};
  for(let i=0;i<k;i++){const t0=i/k,t1=(i+1)/k,a=B(t0),b=B(t1),da=D(t0),db=D(t1),h=(t1-t0)/3;const c1=[a[0]+da[0]*h,a[1]+da[1]*h],c2=[b[0]-db[0]*h,b[1]-db[1]*h];
   out.push([(3*(c1[0]+c2[0])-a[0]-b[0])/4,(3*(c1[1]+c2[1])-a[1]-b[1])/4,0],[b[0],b[1],1]);}};
 for(let g=0;g<N;g++){const cmds=font.glyphs.get(g).path.commands;const contours=[];let cur=null,last=null,start=null;
  for(const c of cmds){if(c.type==='M'){if(cur&&cur.length)contours.push(cur);cur=[[c.x,c.y,1]];last=start=[c.x,c.y];}
   else if(c.type==='L'){cur.push([c.x,c.y,1]);last=[c.x,c.y];}
   else if(c.type==='Q'){cur.push([c.x1,c.y1,0],[c.x,c.y,1]);last=[c.x,c.y];}
   else if(c.type==='C'){cubic(last,[c.x1,c.y1],[c.x2,c.y2],[c.x,c.y],cur);last=[c.x,c.y];}
   else if(c.type==='Z'){if(cur&&cur.length)contours.push(cur);cur=null;last=start;}}
  if(cur&&cur.length)contours.push(cur);
  const cs=[];for(let ct of contours){ct=ct.map(p=>[Math.round(p[0]),Math.round(p[1]),p[2]]);const f=ct[0],l=ct[ct.length-1];if(ct.length>1&&l[2]&&l[0]===f[0]&&l[1]===f[1])ct.pop();
   // drop consecutive duplicate on-curve points
   ct=ct.filter((p,i)=>{const q=ct[(i-1+ct.length)%ct.length];return !(i>0&&p[2]&&q[2]&&p[0]===q[0]&&p[1]===q[1]);});
   if(ct.length<2)continue;const r=[ct[0],...ct.slice(1).reverse()];cs.push(r);}
  if(!cs.length){glyphs.push(new Uint8Array(0));continue;}
  const pts=cs.flat();maxP=Math.max(maxP,pts.length);maxC=Math.max(maxC,cs.length);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of pts){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);}
  const fl=[],xs=[],ys=[];let px=0,py=0;for(const p of pts){let f=p[2]?1:0;const dx=p[0]-px,dy=p[1]-py;px=p[0];py=p[1];
   if(dx===0)f|=16;else if(Math.abs(dx)<256){f|=2;if(dx>0)f|=16;xs.push(1,Math.abs(dx));}else xs.push(2,dx);
   if(dy===0)f|=32;else if(Math.abs(dy)<256){f|=4;if(dy>0)f|=32;ys.push(1,Math.abs(dy));}else ys.push(2,dy);fl.push(f);}
  const sz=10+2*cs.length+2+fl.length+xs.reduce((s,v,i)=>i%2?s:s+v,0)+ys.reduce((s,v,i)=>i%2?s:s+v,0);const b=new Uint8Array((sz+3)&~3);const w=new DataView(b.buffer);let o=0;
  const u16=v=>{w.setUint16(o,v);o+=2},i16=v=>{w.setInt16(o,v);o+=2};i16(cs.length);i16(x0);i16(y0);i16(x1);i16(y1);let e=-1;for(const c of cs){e+=c.length;u16(e);}u16(0);
  for(const f of fl)b[o++]=f;for(const arr of [xs,ys])for(let i=0;i<arr.length;i+=2){if(arr[i]===1)b[o++]=arr[i+1];else i16(arr[i+1]);}glyphs.push(b);}
 let tot=0;for(const g of glyphs)tot+=g.length;const glyf=new Uint8Array(tot),loca=new Uint8Array(4*(N+1));const lv=new DataView(loca.buffer);let off=0;
 glyphs.forEach((g,i)=>{lv.setUint32(4*i,off);glyf.set(g,off);off+=g.length;});lv.setUint32(4*N,off);
 const maxp=new Uint8Array(32);const mv=new DataView(maxp.buffer);mv.setUint32(0,0x00010000);mv.setUint16(4,N);mv.setUint16(6,maxP);mv.setUint16(8,maxC);mv.setUint16(14,2);mv.setUint16(16,1);
 const head=T['head'].slice();const hv=new DataView(head.buffer);hv.setUint32(8,0);hv.setInt16(50,1);
 const post=N>65000?(()=>{const b=T["post"].slice(0,32);new DataView(b.buffer).setUint32(0,0x00030000);return b;})():(()=>{const names=[];for(let g=0;g<N;g++)names.push(font.glyphs.get(g).name||('glyph'+g));const strs=[];const idx=names.map((nm,i)=>{if(i===0&&nm==='.notdef')return 0;strs.push(nm.slice(0,63));return 257+strs.length;});
  let L=34+2*N;for(const t of strs)L+=1+t.length;const b=new Uint8Array(L);b.set(T['post'].slice(0,32));const w=new DataView(b.buffer);w.setUint32(0,0x00020000);w.setUint16(32,N);idx.forEach((x,i)=>w.setUint16(34+2*i,x));let o=34+2*N;for(const t of strs){b[o++]=t.length;for(let k=0;k<t.length;k++)b[o++]=t.charCodeAt(k)&127;}return b;})();T.post=post;
 delete T['CFF '];delete T['VORG'];delete T['DSIG'];T.glyf=glyf;T.loca=loca;T.maxp=maxp;T.head=head;
 const sum=d=>{let s=0;const p=new Uint8Array((d.length+3)&~3);p.set(d);const v=new DataView(p.buffer);for(let i=0;i<p.length;i+=4)s=(s+v.getUint32(i))>>>0;return s;};
 const tags=Object.keys(T).sort();const tabs=tags.map(t=>({tag:t,data:T[t]}));const cnt=tabs.length;let es=1,sel=0;while(es*2<=cnt){es*=2;sel++;}
 let size=12+16*cnt;for(const t of tabs)size+=(t.data.length+3)&~3;const out=new Uint8Array(size);const v=new DataView(out.buffer);
 v.setUint32(0,0x00010000);v.setUint16(4,cnt);v.setUint16(6,es*16);v.setUint16(8,sel);v.setUint16(10,cnt*16-es*16);let p=12+16*cnt,headOff=0;
 tabs.forEach((t,i)=>{const o=12+16*i;for(let k=0;k<4;k++)out[o+k]=t.tag.charCodeAt(k);v.setUint32(o+4,sum(t.data));v.setUint32(o+8,p);v.setUint32(o+12,t.data.length);out.set(t.data,p);if(t.tag==='head')headOff=p;p+=(t.data.length+3)&~3;});
 v.setUint32(headOff+8,(0xB1B0AFBA-sum(out))>>>0);return out;}
