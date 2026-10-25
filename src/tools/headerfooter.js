// @needs pdfx
// ---------- Header & footer ----------
TOOLS.headerfooter={opts:()=>['hl','hc','hr','fl','fc','fr'].map(k=>inp(k,T['o_'+k],'text',k==='fc'?'{page} / {total}':'','placeholder="{page} {total} {date} {file}"')).join('')+inp('hfs',T.o_size,'number','10','min="6" max="36"')+inp('hfm',T.o_margin,'number','24','min="0" max="100"')+inp('hfskip','Skip first pages','number','0','min="0"')+inp('hfstart','First page number','number','1','min="0"')+inp('hfcol','Text colour','color','#333333'),
  async run(files){const {PDFDocument,rgb}=await L.pdflib();const items=[];const today=new Date().toISOString().slice(0,10);
   for(const f of files){const d=await PDFDocument.load(await buf(f));const pages=d.getPages(),N=pages.length,size=+v('hfs')||10,m=+v('hfm')||24;
    const sk=+v('hfskip')||0,st=+(v('hfstart')||1),hx=(v('hfcol')||'#333333').replace('#',''),col=rgb(parseInt(hx.slice(0,2),16)/255,parseInt(hx.slice(2,4),16)/255,parseInt(hx.slice(4,6),16)/255);for(let i=sk;i<N;i++){const p=pages[i];const {x:bx,y:by,width:W,height:H}=p.getCropBox();for(const k of ['hl','hc','hr','fl','fc','fr']){const raw=v(k);if(!raw)continue;const t=raw.replace(/\{page\}/g,i-sk+st).replace(/\{total\}/g,N-sk+st-1).replace(/\{date\}/g,today).replace(/\{file\}/g,f.name);const runs=await textRuns(d,t);const w=runsWidth(runs,size);
     const x=bx+(k[1]==='l'?m:k[1]==='c'?(W-w)/2:W-w-m),y=by+(k[0]==='h'?H-m-size:m);drawRuns(p,runs,{x,y,size,color:col});}}
    items.push({name:base(f.name)+'-header-footer.pdf',blob:pdfBlob(await d.save())});}
   return zipOrOne(items,'header-footer.zip');}};
