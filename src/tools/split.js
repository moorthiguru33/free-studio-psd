// Split PDF – Sejda-style visual scissors between page thumbnails + modes; one output = PDF, many = ZIP
TOOLS.split={noAdv:true,opts(){return sel('smode',T.o_sMode||'Split mode',[['every',T.o_sEvery||'Every page'],['cut',T.o_sCut||'Where I click the scissors'],['select',T.o_sSelect||'Select page ranges'],['everyx',T.o_sEveryX||'Every X pages'],['evenodd',T.o_sEvenOdd||'Even / odd pages']])
  +`<div data-m="select">${inp('ranges',T.o_ranges,'text','','placeholder="1-3,5"')}</div><div data-m="everyx">${inp('sx',T.o_sX||'Pages per file','number','2','min="1"')}</div>`
  +inp('sname',T.o_sName||'File name','text','{name}-{range}')+`<p class="hint" id="sprev"></p>`;},
 async setup([f]){const m=$('#smode',work);const sync=()=>{work.querySelectorAll('[data-m]').forEach(e=>e.hidden=e.dataset.m!==m.value);this.preview();};m.addEventListener('change',sync);$('#ranges',work).addEventListener('input',e=>{if(e.target.value.trim()&&m.value!=='select'){m.value='select';sync();}});['sx','sname'].forEach(id=>$('#'+id,work).addEventListener('input',()=>this.preview()));
  this.cuts=new Set();const doc=await openPdfjs(await buf(f));this.n=doc.numPages;const el=document.createElement('div');el.className='scis';el.innerHTML=`<p class="hint">✂ ${esc(T.o_sCutHint||'Click the scissors between pages to split there.')}</p><div class="sstrip"></div>`;const st=$('.sstrip',el);
  for(let i=1;i<=doc.numPages;i++){const d=document.createElement('div');d.className='sp';d.innerHTML=`<div class="spc"></div><small>${i}</small>`;st.appendChild(d);if(i<doc.numPages){const b=document.createElement('button');b.type='button';b.className='cutb';b.dataset.after=i;b.title=T.o_sCut||'Split here';b.textContent='✂';b.onclick=()=>{const k=+b.dataset.after;this.cuts.has(k)?this.cuts.delete(k):this.cuts.add(k);b.classList.toggle('on');m.value='cut';sync();};st.appendChild(b);}
   if(i<=60)renderPage(doc,i,.25*Math.min(2,devicePixelRatio||1)).then(c=>$('.spc',d).appendChild(c));}
  sync();return el;},
 groups(){const n=this.n,m=v('smode');const all=Array.from({length:n},(_,i)=>i);const g=(a,b)=>({label:a===b?''+(a+1):(a+1)+'-'+(b+1),idx:all.slice(a,b+1)});
  if(m==='select'&&(v('ranges')||'').trim())return parseRanges(v('ranges'),n);
  if(m==='everyx'){const x=Math.max(1,+v('sx')||1);const o=[];for(let a=0;a<n;a+=x)o.push(g(a,Math.min(n,a+x)-1));return o;}
  if(m==='evenodd')return [{label:'odd',idx:all.filter(i=>i%2===0)},{label:'even',idx:all.filter(i=>i%2===1)}].filter(r=>r.idx.length);
  if(m==='cut'){const c=[...this.cuts].sort((a,b)=>a-b);const o=[];let s=0;for(const k of c){o.push(g(s,k-1));s=k;}o.push(g(s,n-1));return o;}
  return all.map(i=>g(i,i));},
 fname(f,r,i){return (v('sname')||'{name}-{range}').replace(/\{name\}/g,base(f.name)).replace(/\{range\}/g,r.label).replace(/\{n\}/g,i+1).replace(/[\\/:*?"<>|]/g,'_')+'.pdf';},
 preview(){const p=$('#sprev',work);if(!p||!this.n)return;try{const gs=this.groups();const f={name:'document.pdf'};p.textContent=`→ ${gs.length} ${gs.length===1?'PDF':'PDFs (ZIP)'}: ${gs.slice(0,3).map((r,i)=>this.fname({name:root.dataset.fname||'document.pdf'},r,i)).join(', ')}${gs.length>3?' …':''}`;}catch(e){p.textContent=e.message;}},
 async run([f]){root.dataset.fname=f.name;const {PDFDocument}=await L.pdflib();const src=await PDFDocument.load(await buf(f));this.n=src.getPageCount();const gs=this.groups();const items=[];let i=0;for(const r of gs){const d=await PDFDocument.create();(await d.copyPages(src,r.idx)).forEach(p=>d.addPage(p));items.push({name:this.fname(f,r,i++),blob:pdfBlob(await d.save())});}
  if(items.length===1)return items[0];return {blob:await zipBlobs(items),name:base(f.name)+'-split.zip',links:items,info:items.length+' PDFs'};}};
