// @needs img
// Add an image / logo / stamp to PDF pages (pdf-lib). Image is chosen with a second file input.
TOOLS.pdfimage={
 opts:()=>`<label>Image or logo (PNG, JPG, WEBP, SVG…)<input id="piimg" type="file" accept="image/*,.svg"></label>`+sel('pipos','Position',[['br','Bottom right'],['bl','Bottom left'],['bc','Bottom centre'],['tr','Top right'],['tl','Top left'],['tc','Top centre'],['mc','Centre']])+inp('piw','Width (% of page width)','number','20','min="1" max="100"')+inp('pim','Margin (mm)','number','10','min="0" max="100"')+inp('piop','Opacity (%)','number','100','min="5" max="100"')+inp('pirot','Rotation (°)','number','0','min="-180" max="180"')+inp('pipg','Pages (e.g. 1-3,5 or blank for all)','text','')+chk('pibehind','Place behind page content (watermark style)',false),
 async run([f],status){const im=$('#piimg',work).files[0];if(!im)throw new Error('Choose an image or logo to add.');const {PDFDocument,degrees}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true});
  const c=await fileToCanvas(im);const png=await encodeCanvas(c,'png');const emb=await d.embedPng(new Uint8Array(await png.arrayBuffer()));
  const pages=d.getPages();const sel2=String(v('pipg')||'').trim();const idx=sel2?parseRanges(sel2,pages.length).flatMap(r=>r.idx):pages.map((_,i)=>i);
  const op=Math.min(1,Math.max(.05,(+v('piop')||100)/100)),m=(+v('pim')||0)/25.4*72,pos=v('pipos'),rot=+v('pirot')||0;
  for(const i of idx){const p=pages[i];const {width:W,height:H}=p.getSize();const w=W*(+v('piw')||20)/100,h=w*c.height/c.width;
   const x=pos[1]==='l'?m:pos[1]==='r'?W-m-w:(W-w)/2,y=pos[0]==='b'?m:pos[0]==='t'?H-m-h:(H-h)/2;
   p.drawImage(emb,{x,y,width:w,height:h,opacity:op,rotate:degrees(rot)});
   if(vb('pibehind')){const cs=p.node.Contents();if(cs&&cs.size){const n=cs.size();const last=cs.get(n-1);cs.remove(n-1);cs.insert(0,last);}}}
  const out=await d.save();return {blob:pdfBlob(out),name:base(f.name)+'-with-image.pdf',info:`Image added to ${idx.length} page${idx.length>1?'s':''}`};}};
