// @needs pdfx
// Split every page into two halves (scanned spreads) – vector, keeps text
TOOLS.halve={opts:()=>sel('hdir',T.o_hdir,[['v',T.o_hVert],['h',T.o_hHoriz]])+chk('hrtl',T.o_bRtl,false)+chk('hfirst',T.o_hKeepFirst,false),
 async run([f]){const {PDFDocument}=await L.pdflib();const src=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const d=await PDFDocument.create();const n=src.getPageCount();
  for(let i=0;i<n;i++){const sp=src.getPage(i);const {x,y,width:w,height:h}=sp.getCropBox();if(i===0&&vb('hfirst')){const [c]=await d.copyPages(src,[i]);d.addPage(c);continue;}
   const rot=sp.getRotation().angle%180!==0;let vert=v('hdir')==='v';if(rot)vert=!vert;// visual left/right on rotated pages
   let halves=vert?[[x,y,w/2,h],[x+w/2,y,w/2,h]]:[[x,y+h/2,w,h/2],[x,y,w,h/2]];if(vb('hrtl')&&vert)halves.reverse();if(rot&&sp.getRotation().angle%360===90)halves.reverse();
   for(const [a,b,c,e] of halves){const [cp]=await d.copyPages(src,[i]);cp.setMediaBox(a,b,c,e);cp.setCropBox(a,b,c,e);d.addPage(cp);}}
  return {blob:pdfBlob(await d.save()),name:base(f.name)+'-halved.pdf',info:`${n} → ${d.getPageCount()} ${T.pages}`};}};
