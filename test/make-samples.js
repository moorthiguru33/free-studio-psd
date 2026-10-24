const {PDFDocument,StandardFonts,rgb}=require('@cantoo/pdf-lib');const fs=require('fs');const JSZip=require('jszip');const zlib=require('zlib');
(async()=>{const d=await PDFDocument.create();const f=await d.embedFont(StandardFonts.Helvetica);
for(let i=1;i<=5;i++){const p=d.addPage([595,842]);p.drawText(`Sample page ${i}`,{x:60,y:760,size:28,font:f});for(let k=0;k<25;k++)p.drawText(`Line ${k+1}: The quick brown fox jumps over the lazy dog.`,{x:60,y:700-k*22,size:12,font:f});p.drawRectangle({x:60,y:80,width:200,height:60,color:rgb(.9,.2,.2)});}
fs.writeFileSync('test/samples/sample.pdf',await d.save());
const d2=await PDFDocument.create();d2.addPage([612,792]).drawText('Second file',{x:50,y:700,size:30,font:await d2.embedFont(StandardFonts.Helvetica)});fs.writeFileSync('test/samples/second.pdf',await d2.save());
// PNG 300x200 gradient
const w=300,h=200;const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++){raw[y*(w*3+1)]=0;for(let x=0;x<w;x++){const o=y*(w*3+1)+1+x*3;raw[o]=x%256;raw[o+1]=y;raw[o+2]=128;}}
const crc=b=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}c=0xFFFFFFFF;for(const x of b)c=t[(c^x)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
const chunk=(ty,data)=>{const l=Buffer.alloc(4);l.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(ty),data]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;
fs.writeFileSync('test/samples/image.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
// DOCX
const z=new JSZip();z.file('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
z.file('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
const para=(t,b)=>`<w:p><w:r>${b?'<w:rPr><w:b/></w:rPr>':''}<w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
z.file('word/document.xml',`<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${para('Quarterly Report “Test”',true)}${Array.from({length:60},(_,i)=>para(`Paragraph ${i+1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. தமிழ் text.`)).join('')}</w:body></w:document>`);
fs.writeFileSync('test/samples/sample.docx',await z.generateAsync({type:'nodebuffer'}));
console.log('samples ok');})();
