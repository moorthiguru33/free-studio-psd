const pageSet=(spec,N)=>{if(!spec||!spec.trim())return null;const s=new Set();for(const r of parseRanges(spec,N))r.idx.forEach(i=>s.add(i));return s;};
TOOLS.rotate={opts:()=>sel('angle',T.o_angle,[['90','90° ⟳'],['180','180°'],['270','270° ⟲']])+sel('rscope',T.o_rScope||'Rotate which pages',[['all','All pages'],['odd','Odd pages'],['even','Even pages'],['land','Landscape pages only'],['port','Portrait pages only'],['range','Page range…']])+inp('rpages',T.o_rPages||'Pages (e.g. 1,3-5)','text','','placeholder="1,3-5"'),
  async run(files){const {PDFDocument,degrees}=await L.pdflib();const a=+v('angle'),sc=v('rscope');const items=[];let n=0;
   for(const f of files){const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const ps=d.getPages();const set=sc==='range'?pageSet(v('rpages'),ps.length):null;if(sc==='range'&&!set)throw new Error(T.o_rPages||'Enter pages');
    ps.forEach((p,i)=>{const r=p.getRotation().angle,{width:w,height:h}=p.getSize(),land=((r/90)%2?h>w:w>h);const ok=sc==='all'||(sc==='odd'&&i%2===0)||(sc==='even'&&i%2===1)||(sc==='land'&&land)||(sc==='port'&&!land)||(set&&set.has(i));if(ok){p.setRotation(degrees((r+a)%360));n++;}});
    items.push({name:base(f.name)+'-rotated.pdf',blob:pdfBlob(await d.save())});}
   const o=items.length===1?items[0]:{blob:await zipBlobs(items),name:'rotated.zip',links:items};o.info=n+' page(s) rotated';return o;}};
