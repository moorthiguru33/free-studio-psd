// @needs img
// Merge PDFs (and images) in the chosen order. Options: bookmarks from file names, blank page between files.
TOOLS.merge={noAdv:true,opts:()=>chk('mbm',T.o_mBookmarks||'Add a bookmark for each file (uses the file name)',true)+chk('mblank',T.o_mBlank||'Insert a blank page between files',false)+chk('mevenp',T.o_mEven||'Pad each file to an even page count (for double-sided printing)',false),
async run(files,status){const PL=await L.pdflib();const {PDFDocument,PDFName,PDFHexString,PDFNumber,PDFNull}=PL;const out=await PDFDocument.create();const bm=$('#mbm',work)?.checked,bl=$('#mblank',work)?.checked,ev=$('#mevenp',work)?.checked;const marks=[];let k=0,last=[612,792];
 for(const f of files){status(`${T.working} ${++k}/${files.length}`);const bytes=new Uint8Array(await buf(f));const isPdf=bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46;
  if(bl&&out.getPageCount())out.addPage(last);const start=out.getPageCount();
  if(isPdf){const src=await PDFDocument.load(bytes,{ignoreEncryption:false});const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p));}
  else{let img;if(bytes[0]===0xFF&&bytes[1]===0xD8)img=await out.embedJpg(bytes);else if(bytes[0]===0x89&&bytes[1]===0x50)img=await out.embedPng(bytes);else{const c=await fileToCanvas(f);img=await out.embedJpg(new Uint8Array(await (await toBlob(c,'image/jpeg',.92)).arrayBuffer()));c.width=c.height=0;}
   const s=Math.min(1,595.28/img.width,841.89/img.height,1)||1;const W=Math.max(img.width,img.height)>1200?img.width*Math.min(595.28/img.width,841.89/img.height):img.width,H=img.height*(W/img.width);const p=out.addPage([W,H]);p.drawImage(img,{x:0,y:0,width:W,height:H});}
  const n=out.getPageCount()-start;if(n){const lp=out.getPage(out.getPageCount()-1).getSize();last=[lp.width,lp.height];if(ev&&n%2)out.addPage(last);marks.push([base(f.name),out.getPage(start).ref]);}}
 if(bm&&marks.length){const ctx=out.context;const root=ctx.nextRef();const refs=marks.map(()=>ctx.nextRef());
  marks.forEach(([title,pref],i)=>{const d=ctx.obj({Title:PDFHexString.fromText(title),Parent:root,Dest:[pref,PDFName.of('Fit')]});if(i)d.set(PDFName.of('Prev'),refs[i-1]);if(i<refs.length-1)d.set(PDFName.of('Next'),refs[i+1]);ctx.assign(refs[i],d);});
  ctx.assign(root,ctx.obj({Type:'Outlines',First:refs[0],Last:refs[refs.length-1],Count:PDFNumber.of(refs.length)}));out.catalog.set(PDFName.of('Outlines'),root);out.catalog.set(PDFName.of('PageMode'),PDFName.of('UseOutlines'));}
 return {blob:pdfBlob(await out.save()),name:'merged.pdf',info:out.getPageCount()+' '+(T.pagesN||'pages')};}};
