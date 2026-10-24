const {PDFDocument,StandardFonts,rgb,degrees,PDFName,PDFString,PDFNumber}=require('@cantoo/pdf-lib');const fs=require('fs');
(async()=>{
// bookmarks: 6 pages, 3 chapters at pages 1,3,5
const d=await PDFDocument.create();const f=await d.embedFont(StandardFonts.Helvetica);
for(let i=1;i<=6;i++){const p=d.addPage([595,842]);p.drawText(`${i%2?'Chapter '+((i+1)/2):'Continued'} page ${i}`,{x:60,y:760,size:24,font:f});}
const ctx=d.context;const pages=d.getPages();const outlines=ctx.nextRef();const items=[0,2,4].map(()=>ctx.nextRef());
[0,2,4].forEach((pi,k)=>{ctx.assign(items[k],ctx.obj({Title:PDFString.of('Chapter '+(k+1)),Parent:outlines,Dest:[pages[pi].ref,PDFName.of('Fit')],...(k>0?{Prev:items[k-1]}:{}),...(k<2?{Next:items[k+1]}:{})}));});
ctx.assign(outlines,ctx.obj({Type:'Outlines',First:items[0],Last:items[2],Count:PDFNumber.of(3)}));d.catalog.set(PDFName.of('Outlines'),outlines);
fs.writeFileSync('test/samples/bookmarks.pdf',await d.save());
// form
const fd=await PDFDocument.create();const fp=fd.addPage([595,842]);const form=fd.getForm();const tf=form.createTextField('name');tf.setText('Jane Form Value');tf.addToPage(fp,{x:60,y:700,width:300,height:30});const cb=form.createCheckBox('agree');cb.check();cb.addToPage(fp,{x:60,y:650,width:20,height:20});
fs.writeFileSync('test/samples/form.pdf',await fd.save());
// skewed: lines rotated 4 degrees
const sd=await PDFDocument.create();const sf=await sd.embedFont(StandardFonts.Helvetica);const sp=sd.addPage([595,842]);const a=4*Math.PI/180;
for(let k=0;k<30;k++){const y0=760-k*22;sp.drawText('Skewed scan line '+(k+1)+' lorem ipsum dolor sit amet consectetur',{x:60-y0*Math.sin(a)*0+ (k*22)*Math.sin(a),y:y0,size:12,font:sf,rotate:degrees(4)});}
fs.writeFileSync('test/samples/skewed.pdf',await sd.save());
// compare v2
const s=await PDFDocument.create();const f2=await s.embedFont(StandardFonts.Helvetica);
for(let i=1;i<=2;i++){const p=s.addPage([595,842]);p.drawText(`Sample page ${i}`,{x:60,y:760,size:28,font:f2});for(let k=0;k<25;k++){let t=`Line ${k+1}: The quick brown fox jumps over the lazy dog.`;if(i===1&&k===4)t='Line 5: The quick red fox leaps over the lazy dog.';if(i===2&&k===10)continue;p.drawText(t,{x:60,y:700-k*22,size:12,font:f2});}if(i===2)p.drawText('Brand new added line here.',{x:60,y:120,size:12,font:f2});}
fs.writeFileSync('test/samples/compare-v2.pdf',await s.save());
const s1=await PDFDocument.create();const f3=await s1.embedFont(StandardFonts.Helvetica);for(let i=1;i<=2;i++){const p=s1.addPage([595,842]);p.drawText(`Sample page ${i}`,{x:60,y:760,size:28,font:f3});for(let k=0;k<25;k++)p.drawText(`Line ${k+1}: The quick brown fox jumps over the lazy dog.`,{x:60,y:700-k*22,size:12,font:f3});}
fs.writeFileSync('test/samples/compare-v1.pdf',await s1.save());
console.log('samples2 ok');})();
