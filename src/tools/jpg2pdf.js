TOOLS.jpg2pdf={opts:()=>sel('psize',T.o_pagesize,[['fit',T.o_fit],['a4','A4'],['letter','US Letter']])+sel('margin',T.o_margin,[['0','0'],['20','20 pt'],['40','40 pt']]),
  async run(files){const {PDFDocument}=await L.pdflib();const d=await PDFDocument.create();const ps=v('psize'),mg=+v('margin');
   for(const f of files){let bytes=new Uint8Array(await buf(f)),img;const isPng=bytes[0]===0x89&&bytes[1]===0x50,isJpg=bytes[0]===0xFF&&bytes[1]===0xD8;
    if(isJpg)img=await d.embedJpg(bytes);else if(isPng)img=await d.embedPng(bytes);else{const bm=await createImageBitmap(f);const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0);img=await d.embedJpg(new Uint8Array(await (await toBlob(c,'image/jpeg',.92)).arrayBuffer()));}
    let W,H;if(ps==='fit'){W=img.width+2*mg;H=img.height+2*mg;}else{[W,H]=ps==='a4'?[595.28,841.89]:[612,792];if(img.width>img.height)[W,H]=[H,W];}
    const s=Math.min((W-2*mg)/img.width,(H-2*mg)/img.height);const w=img.width*s,h=img.height*s;const p=d.addPage([W,H]);p.drawImage(img,{x:(W-w)/2,y:(H-h)/2,width:w,height:h});}
   return {blob:pdfBlob(await d.save()),name:(files.length===1?base(files[0].name):'images')+'.pdf'};}};
