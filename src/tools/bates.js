// @needs pdfx
// ---------- Bates numbering (continuous across files) ----------
TOOLS.bates={opts:()=>inp('bpre',T.o_prefix,'text','ABC')+inp('bstart',T.o_start,'number','1','min="0"')+inp('bdig',T.o_digits,'number','6','min="1" max="12"')+inp('bsuf',T.o_suffix,'text','')+sel('bpos',T.o_position,POS().map(([a,b])=>[a,b]).sort((x,y)=>x[0]==='br'?-1:0))+inp('bfs',T.o_size,'number','10','min="6" max="36"'),
  async run(files){const {PDFDocument,rgb}=await L.pdflib();let n=+v('bstart')||0;const items=[];const first=n;
   for(const f of files){const d=await PDFDocument.load(await buf(f));const size=+v('bfs')||10;for(const p of d.getPages()){const t=`${v('bpre')}${String(n++).padStart(+v('bdig')||6,'0')}${v('bsuf')}`;const runs=await textRuns(d,t,true);const w=runsWidth(runs,size);drawRuns(p,runs,{...place(p,v('bpos'),w,size,20),size,color:rgb(0,0,0)});}
    items.push({name:base(f.name)+'-bates.pdf',blob:pdfBlob(await d.save())});}
   return {...await zipOrOne(items,'bates.zip'),info:`${v('bpre')}${String(first).padStart(+v('bdig')||6,'0')} – ${v('bpre')}${String(n-1).padStart(+v('bdig')||6,'0')}`};}};
