// @needs pdfx
TOOLS.edit={async setup(files){
   const wrap=document.createElement('div');wrap.innerHTML=`<div class="opts">${sel('emode',T.o_mode,[['text',T.o_addText],['white',T.o_whiteout]])}${inp('etxt',T.o_text,'text','')}${inp('efs',T.o_size,'number','14','min="6" max="72"')}<label>Color<input id="ecol" type="color" value="#000000"></label></div>`;
   this.items=[];
   const pv=await setupPreview(files[0],(page,fx,fy,r)=>{const mode=v('emode'),fs=+v('efs')||14;if(mode==='text'){const t=v('etxt');if(!t){$('#etxt',wrap).focus();return null;}const it={type:'text',page,fx,fy,text:t,fs,color:v('ecol'),label:t,fw:0.001,fh:0.001};this.items.push(it);return it;}
     const it={type:'white',page,fx:fx-0.08,fy:fy-0.015,fw:0.16,fh:0.03,label:''};this.items.push(it);return it;});
   wrap.appendChild(pv.el);return wrap;},
  async run([f]){if(!this.items.length)throw new Error(T.o_clickPlace);const {PDFDocument,StandardFonts,rgb}=await L.pdflib();const d=await PDFDocument.load(await buf(f));const font=await d.embedFont(StandardFonts.Helvetica);const safe=mkSafe(font);
   for(const it of this.items){const p=d.getPage(it.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();
    if(it.type==='white')p.drawRectangle({x:bx+it.fx*W,y:by+H-(it.fy+it.fh)*H,width:it.fw*W,height:it.fh*H,color:rgb(1,1,1)});
    else{const c=it.color.match(/\w\w/g).map(h=>parseInt(h,16)/255);p.drawText(safe(it.text),{x:bx+it.fx*W,y:by+H-it.fy*H-it.fs*0.8,size:it.fs,font,color:rgb(...c)});}}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-edited.pdf'};}};
TOOLS.edit.run=async function([f]){if(!this.items.length)throw new Error(T.o_clickPlace);const {PDFDocument,rgb}=await L.pdflib();const d=await PDFDocument.load(await buf(f));
 for(const it of this.items){const p=d.getPage(it.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();
  if(it.type==='white')p.drawRectangle({x:bx+it.fx*W,y:by+H-(it.fy+it.fh)*H,width:it.fw*W,height:it.fh*H,color:rgb(1,1,1)});
  else await drawText(d,p,it.text,{x:bx+it.fx*W,y:by+H-it.fy*H-it.fs*0.8,size:it.fs,color:hex2rgb(it.color)});}
 return {blob:pdfBlob(await d.save()),name:base(f.name)+'-edited.pdf'};};
