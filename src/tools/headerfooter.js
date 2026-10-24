// @needs pdfx
// ---------- Header & footer ----------
TOOLS.headerfooter={opts:()=>['hl','hc','hr','fl','fc','fr'].map(k=>inp(k,T['o_'+k],'text',k==='fc'?'{page} / {total}':'','placeholder="{page} {total} {date} {file}"')).join('')+inp('hfs',T.o_size,'number','10','min="6" max="36"')+inp('hfm',T.o_margin,'number','24','min="0" max="100"'),
  async run(files){const {PDFDocument,rgb}=await L.pdflib();const items=[];const today=new Date().toISOString().slice(0,10);
   for(const f of files){const d=await PDFDocument.load(await buf(f));const pages=d.getPages(),N=pages.length,size=+v('hfs')||10,m=+v('hfm')||24;
    for(let i=0;i<N;i++){const p=pages[i];const {x:bx,y:by,width:W,height:H}=p.getCropBox();for(const k of ['hl','hc','hr','fl','fc','fr']){const raw=v(k);if(!raw)continue;const t=raw.replace(/\{page\}/g,i+1).replace(/\{total\}/g,N).replace(/\{date\}/g,today).replace(/\{file\}/g,f.name);const runs=await textRuns(d,t);const w=runsWidth(runs,size);
     const x=bx+(k[1]==='l'?m:k[1]==='c'?(W-w)/2:W-w-m),y=by+(k[0]==='h'?H-m-size:m);drawRuns(p,runs,{x,y,size,color:rgb(.2,.2,.2)});}}
    items.push({name:base(f.name)+'-header-footer.pdf',blob:pdfBlob(await d.save())});}
   return zipOrOne(items,'header-footer.zip');}};
