// @needs pdfx
// ---------- PDF/A-2b (best effort) ----------
TOOLS.pdfa={opts:()=>sel('pamode',T.o_mode,[['raster',T.o_paRaster],['keep',T.o_paKeep]]),
  async run([f],status){const P=await L.pdflib();const {PDFDocument,PDFName,PDFString,PDFHexString}=P;const data=await buf(f);let d;
   if(v('pamode')==='raster'){const pj=await openPdfjs(data);d=await PDFDocument.create();for(let i=1;i<=pj.numPages;i++){status(`${T.working} ${i}/${pj.numPages}`);await rasterInto(d,pj,i,{scale:2,q:.9});}}
   else{d=await PDFDocument.load(data);}
   const title=base(f.name),now=new Date(),iso=now.toISOString().replace(/\.\d+Z$/,'Z');d.setTitle(title);d.setProducer('FreePDF');d.setCreator('FreePDF');d.setCreationDate(now);d.setModificationDate(now);
   const xe=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
   const xmp=`<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/"><pdfaid:part>2</pdfaid:part><pdfaid:conformance>B</pdfaid:conformance><dc:format>application/pdf</dc:format><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xe(title)}</rdf:li></rdf:Alt></dc:title><xmp:CreateDate>${iso}</xmp:CreateDate><xmp:ModifyDate>${iso}</xmp:ModifyDate><xmp:CreatorTool>FreePDF</xmp:CreatorTool><pdf:Producer>FreePDF</pdf:Producer></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
   const ctx=d.context;const meta=ctx.stream(new TextEncoder().encode(xmp),{Type:'Metadata',Subtype:'XML'});d.catalog.set(PDFName.of('Metadata'),ctx.register(meta));
   const icc=new Uint8Array(await (await fetch('/fonts/sRGB.icc')).arrayBuffer());const iccS=ctx.flateStream(icc,{N:3});const iccRef=ctx.register(iccS);
   d.catalog.set(PDFName.of('OutputIntents'),ctx.obj([ctx.obj({Type:'OutputIntent',S:'GTS_PDFA1',OutputConditionIdentifier:PDFString.of('sRGB IEC61966-2.1'),Info:PDFString.of('sRGB IEC61966-2.1'),DestOutputProfile:iccRef})]));
   const id=PDFHexString.of([...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join(''));ctx.trailerInfo.ID=ctx.obj([id,id]);
   for(const k of ['OpenAction','AA','JavaScript'])try{d.catalog.delete(PDFName.of(k));}catch(e){}
   return {blob:pdfBlob(await d.save({useObjectStreams:false})),name:base(f.name)+'-pdfa.pdf'};}};
