// @needs pdfx
// ---------- Organize / delete / extract with thumbnails + drag reorder ----------
TOOLS.organize={async setup(files){const pj=await openPdfjs(await buf(files[0]));const n=pj.numPages;this.order=Array.from({length:n},(_,i)=>({i,rot:0,del:false,sel:false}));
   const wrap=document.createElement('div');const pre=this.preset;
   wrap.innerHTML=`<p class="hint" style="text-align:center">${esc(pre==='delete'?T.o_tapDelete:pre==='extract'?T.o_tapSelect:T.o_dragHint)}</p>${pre==='delete'?`<div class="drow" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0"><input id="drange" placeholder="2,5-8" aria-label="Pages to delete" style="max-width:140px"><button type="button" id="dapply">Mark pages</button><button type="button" id="dblank">Mark blank pages</button><button type="button" id="dundo">Undo</button><span id="dinfo" class="hint"></span></div>`:''}<div class="thumbs"></div>`;const grid=$('.thumbs',wrap);
   const draw=()=>{grid.innerHTML='';this.order.forEach((o,pos)=>{const el=document.createElement('div');el.className='thumb'+(o.del?' del':'')+(o.sel?' sel':'');el.draggable=true;el.dataset.pos=pos;el.dataset.page=o.i+1;
     el.innerHTML=`<div class="tc" style="transform:rotate(${o.rot}deg)"></div><span class="pn">${o.i+1}</span><div class="tb"><button type="button" data-a="l" title="←">←</button><button type="button" data-a="r" title="↻">↻</button><button type="button" data-a="d" title="✕">${o.del?'↺':'✕'}</button><button type="button" data-a="s" title="✓">${o.sel?'☑':'☐'}</button><button type="button" data-a="m" title="→">→</button></div>`;
     $('.tc',el).appendChild(o.canvas);grid.appendChild(el);});};
   for(const o of this.order){const c=await renderPage(pj,o.i+1,.3);c.style.cssText='width:100%;height:auto;display:block';o.canvas=c;}
   draw();let from=null;
   if(pre==='delete'){const hist=[];const snap=()=>hist.push(this.order.map(o=>o.del));const info=()=>{$('#dinfo',wrap).textContent=this.order.filter(o=>o.del).length+' marked';};
    $('#dapply',wrap).onclick=()=>{try{snap();for(const r of parseRanges($('#drange',wrap).value,n))r.idx.forEach(i=>{const o=this.order.find(x=>x.i===i);if(o)o.del=true;});draw();info();}catch(e){$('#dinfo',wrap).textContent=e.message;}};
    $('#dblank',wrap).onclick=()=>{snap();let k=0;for(const o of this.order){const c=o.canvas,x=c.getContext('2d'),dt=x.getImageData(0,0,c.width,c.height).data;let dark=0;for(let j=0;j<dt.length;j+=4)if(dt[j]+dt[j+1]+dt[j+2]<690)dark++;if(dark/(dt.length/4)<0.002){o.del=true;k++;}}draw();info();};
    $('#dundo',wrap).onclick=()=>{const h=hist.pop();if(h){h.forEach((d,j)=>this.order[j].del=d);draw();info();}};
    grid.addEventListener('click',()=>setTimeout(info,0));}
   grid.addEventListener('dragstart',e=>{const t=e.target.closest('.thumb');from=+t.dataset.pos;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',''+from);});
   grid.addEventListener('dragover',e=>{e.preventDefault();});
   grid.addEventListener('drop',e=>{e.preventDefault();const t=e.target.closest('.thumb');if(!t||from===null)return;const to=+t.dataset.pos;const [m]=this.order.splice(from,1);this.order.splice(to,0,m);from=null;draw();});
   grid.addEventListener('click',e=>{const b=e.target.closest('button');const t=e.target.closest('.thumb');if(!t)return;const pos=+t.dataset.pos,o=this.order[pos];const a=b?b.dataset.a:(pre==='delete'?'d':pre==='extract'?'s':null);if(!a)return;
     if(a==='r')o.rot=(o.rot+90)%360;else if(a==='d')o.del=!o.del;else if(a==='s')o.sel=!o.sel;else if(a==='l'&&pos>0)[this.order[pos-1],this.order[pos]]=[o,this.order[pos-1]];else if(a==='m'&&pos<this.order.length-1)[this.order[pos+1],this.order[pos]]=[o,this.order[pos+1]];draw();});
   return wrap;},
  opts(){return this.preset?'':sel('omode',T.o_output,[['all',T.o_outKept],['sel',T.o_outSel]]);},
  async run([f]){const {PDFDocument,degrees}=await L.pdflib();const src=await PDFDocument.load(await buf(f));const onlySel=this.preset==='extract'||v('omode')==='sel';
   const keep=this.order.filter(o=>onlySel?o.sel&&!o.del:!o.del);if(!keep.length)throw new Error(onlySel?T.o_tapSelect:T.o_noPages);
   const d=await PDFDocument.create();const pages=await d.copyPages(src,keep.map(o=>o.i));pages.forEach((p,k)=>{if(keep[k].rot)p.setRotation(degrees((p.getRotation().angle+keep[k].rot)%360));d.addPage(p);});
   return {blob:pdfBlob(await d.save()),name:base(f.name)+(this.preset==='extract'?'-extracted':this.preset==='delete'?'-pages-removed':'-organized')+'.pdf',info:`${keep.length} ${T.pages}`};}};
