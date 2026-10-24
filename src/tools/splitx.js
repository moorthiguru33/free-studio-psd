// @needs pdfx
// ---------- Split by bookmarks / size / text ----------
TOOLS.splitx={opts(){return this.preset==='size'?inp('maxmb',T.o_maxSize,'number','1','min="0.05" step="0.05"'):this.preset==='text'?inp('stext',T.o_splitText,'text','','placeholder="Chapter"')+chk('scase',T.o_matchCase,false):sel('bmlevel',T.o_bmLevel,[['1','1'],['2','2']]);},
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);const src=await PDFDocument.load(data);const n=src.getPageCount();let starts=[],labels=[];
   const make=async idx=>{const d=await PDFDocument.create();(await d.copyPages(src,idx)).forEach(p=>d.addPage(p));return d.save({useObjectStreams:true});};
   const items=[];
   if(this.preset==='size'){const max=(+v('maxmb')||1)*1048576;let cur=[],last=null;for(let i=0;i<n;i++){status(`${T.working} ${i+1}/${n}`);const tryIdx=[...cur,i];const b=await make(tryIdx);if(b.byteLength>max&&cur.length){items.push({idx:cur,bytes:last});cur=[i];last=await make(cur);}else{cur=tryIdx;last=b;}}if(cur.length)items.push({idx:cur,bytes:last});
    return zipOrOne(items.map((it,k)=>({name:`${base(f.name)}-part${k+1}.pdf`,blob:pdfBlob(it.bytes)})),base(f.name)+'-split.zip');}
   const pj=await openPdfjs(data);
   if(this.preset==='text'){const q=(v('stext')||'').trim();if(!q)throw new Error(T.o_splitText);const cs=vb('scase');const tx=await pageTexts(pj);tx.forEach((p,i)=>{const s=p.items.map(it=>it.str).join(' ');if(cs?s.includes(q):s.toLowerCase().includes(q.toLowerCase()))starts.push(i);});if(!starts.length)throw new Error(T.o_notFound+': '+q);}
   else{const ol=await pj.getOutline();if(!ol||!ol.length)throw new Error(T.o_noBookmarks);const lvl=+v('bmlevel')||1;const flat=[];const walk=(arr,d)=>{for(const it of arr){flat.push({it,d});if(d<lvl&&it.items)walk(it.items,d+1);}};walk(ol,1);
    for(const {it} of flat){let dest=it.dest;if(typeof dest==='string')dest=await pj.getDestination(dest);if(!dest)continue;const pi=typeof dest[0]==='number'?dest[0]:await pj.getPageIndex(dest[0]);if(!starts.includes(pi)){starts.push(pi);labels[pi]=it.title;}}starts.sort((a,b)=>a-b);}
   if(starts[0]!==0)starts.unshift(0);
   for(let k=0;k<starts.length;k++){const a=starts[k],b=(starts[k+1]??n)-1;const idx=Array.from({length:b-a+1},(_,j)=>a+j);const lab=(labels[a]||'').replace(/[^\p{L}\p{N} _-]+/gu,'').trim().slice(0,40);items.push({name:`${base(f.name)}-${k+1}${lab?'-'+lab:''}.pdf`,blob:pdfBlob(await make(idx))});}
   return zipOrOne(items,base(f.name)+'-split.zip');}};
