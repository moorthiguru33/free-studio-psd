// Print-ready PDF for commercial printers: adds bleed (mirrored/stretched edge or white), trim/crop marks, registration targets,
// colour bar, sets TrimBox/BleedBox/MediaBox correctly, optional resize to a trim size. 
const MMP=72/25.4;const TRIM={keep:null,a4:[210,297],a5:[148,210],letter:[215.9,279.4],bc:[85,55],a6:[105,148]};
TOOLS.printready={opts:()=>inp('bleed',T.o_bleed||'Bleed (mm)','number','3','min="0" max="10" step="0.5"')+sel('bmode',T.o_bMode||'Bleed fill',[['mirror',T.o_bMirror||'Extend artwork (mirror edges)'],['white',T.o_bWhite||'White (no extension)']])+chk('cmarks',T.o_cropMarks||'Crop marks',true)+chk('rmarks',T.o_regMarks||'Registration marks & colour bar',false)+sel('trim',T.o_trim||'Trim size',[['keep','Keep page size'],['a4','A4'],['a5','A5'],['a6','A6'],['letter','Letter'],['bc','Business card 85×55 mm']]),
 async run([f],status){const {PDFDocument,rgb,cmyk,PDFName}=await L.pdflib();const src=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const o=await PDFDocument.create();const b=(+v('bleed')||0)*MMP;const slug=(vb('cmarks')||vb('rmarks'))?24:0;const n=src.getPageCount();
  const emb=await o.embedPages(src.getPages());const notes=[];
  for(let i=0;i<n;i++){status(`${T.working} ${i+1}/${n}`);const e=emb[i];let tw=e.width,th=e.height;const T0=TRIM[v('trim')];if(T0){[tw,th]=T0.map(x=>x*MMP);if((e.width>e.height)!==(tw>th))[tw,th]=[th,tw];}
   const s=Math.max(tw/e.width,th/e.height);const W=tw+2*(b+slug),H=th+2*(b+slug);const p=o.addPage([W,H]);const x0=slug+b,y0=slug+b;const dw=e.width*s,dh=e.height*s;const dx=x0+(tw-dw)/2,dy=y0+(th-dh)/2;
   if(b>0&&v('bmode')==='mirror'){const ops=PDFLib;const clip=(x,y,w,h,fn)=>{p.pushOperators(ops.pushGraphicsState(),ops.rectangle(x,y,w,h),ops.clip(),ops.endPath());fn();p.pushOperators(ops.popGraphicsState());};
    // mirrored copies around the trim box fill the bleed with matching artwork
    const M=(sx,sy)=>clip(slug,slug,tw+2*b,th+2*b,()=>p.drawPage(e,{x:sx<0?2*x0-dx:sx>0?2*(x0+tw)-dx:dx,y:sy<0?2*y0-dy:sy>0?2*(y0+th)-dy:dy,xScale:s*(sx?-1:1),yScale:s*(sy?-1:1)}));
    for(const sx of [-1,0,1])for(const sy of [-1,0,1])if(sx||sy)M(sx,sy);}
   p.pushOperators(PDFLib.pushGraphicsState(),PDFLib.rectangle(slug,slug,tw+2*b,th+2*b),PDFLib.clip(),PDFLib.endPath());p.drawPage(e,{x:dx,y:dy,xScale:s,yScale:s});p.pushOperators(PDFLib.popGraphicsState());
   const box=(k,x,y,w,h)=>p.node.set(PDFName.of(k),o.context.obj([x,y,x+w,y+h]));box('TrimBox',x0,y0,tw,th);box('BleedBox',slug,slug,tw+2*b,th+2*b);
   const reg=cmyk(1,1,1,1);
   if(vb('cmarks')){const L2=slug-b-4>6?slug-6:12;for(const [x,y,dxs,dys] of [[x0,y0,-1,-1],[x0+tw,y0,1,-1],[x0,y0+th,-1,1],[x0+tw,y0+th,1,1]]){p.drawLine({start:{x:x+dxs*(b+3),y},end:{x:x+dxs*(b+3+L2),y},thickness:.25,color:reg});p.drawLine({start:{x,y:y+dys*(b+3)},end:{x,y:y+dys*(b+3+L2)},thickness:.25,color:reg});}}
   if(vb('rmarks')){for(const [cx,cy] of [[W/2,slug/2],[W/2,H-slug/2],[slug/2,H/2],[W-slug/2,H/2]]){p.drawCircle({x:cx,y:cy,size:4,borderColor:reg,borderWidth:.3});p.drawLine({start:{x:cx-7,y:cy},end:{x:cx+7,y:cy},thickness:.3,color:reg});p.drawLine({start:{x:cx,y:cy-7},end:{x:cx,y:cy+7},thickness:.3,color:reg});}
    [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],[0,0,0,.5],[0,0,0,.25]].forEach((c,k)=>p.drawRectangle({x:slug+b+10+k*9,y:H-slug+4,width:8,height:8,color:cmyk(...c)}));}}

  o.setTitle(src.getTitle()||base(f.name));o.setProducer('Fileopia print-ready');
  return {blob:pdfBlob(await o.save()),name:base(f.name)+'-print.pdf',info:`${n} page(s) · bleed ${v('bleed')} mm · TrimBox & BleedBox set${vb('cmarks')?' · crop marks':''}`};}};
