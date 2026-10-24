// @needs pdfx
// ---------- Watermark ----------
TOOLS.watermark={opts:()=>inp('wtext',T.o_text,'text','CONFIDENTIAL')+inp('wsize',T.o_size,'number','48','min="8" max="200"')+inp('wop',T.o_opacity,'number','25','min="5" max="100"')+inp('wrot',T.o_angle,'number','45','min="-180" max="180"')+'<label>Color<input id="wcol" type="color" value="#e5322d"></label>'+sel('wlay',T.o_layout,[['center',T.o_center],['tile',T.o_tile]]),
  async run(files){const {PDFDocument}=await L.pdflib();const items=[];const txt=v('wtext');if(!txt)throw new Error(T.o_text);
   for(const f of files){const d=await PDFDocument.load(await buf(f));const size=+v('wsize')||48,op=(+v('wop')||25)/100,rot=+v('wrot')||0,color=hex2rgb(v('wcol'));const runs=await textRuns(d,txt,true);const w=runsWidth(runs,size);const a=rot*Math.PI/180;
    for(const p of d.getPages()){const {x:bx,y:by,width:W,height:H}=p.getCropBox();const at=(cx,cy)=>drawRuns(p,runs,{x:cx-(w/2)*Math.cos(a)+(size/3)*Math.sin(a),y:cy-(w/2)*Math.sin(a)-(size/3)*Math.cos(a),size,color,opacity:op,rotate:rot});
     if(v('wlay')==='tile'){const sx=w*.8+size*2,sy=size*4;for(let yy=by;yy<by+H+sy;yy+=sy)for(let xx=bx;xx<bx+W+sx;xx+=sx)at(xx,yy);}else at(bx+W/2,by+H/2);}
    items.push({name:base(f.name)+'-watermarked.pdf',blob:pdfBlob(await d.save())});}
   return zipOrOne(items,'watermarked.zip');}};
