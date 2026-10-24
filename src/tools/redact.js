// @needs pdfx
// ---------- Redact (true removal: affected pages are rebuilt as images) ----------
TOOLS.redact={async setup(files){const wrap=document.createElement('div');wrap.innerHTML=`<div class="opts">${inp('rterms',T.o_rTerms,'text','','placeholder="John Smith, 555-1234"')}${chk('rcase',T.o_matchCase,false)}</div><p class="hint">${esc(T.o_rDraw)}</p>`;
   this.boxes=[];const pv=await setupPreview(files[0],()=>null);wrap.appendChild(pv.el);const box=$('.preview',pv.el);let st=null,tmp=null;
   const fr=e=>{const r=box.querySelector('canvas').getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))];};
   box.style.touchAction='none';
   box.addEventListener('pointerdown',e=>{st=fr(e);box.setPointerCapture(e.pointerId);tmp={page:pv.state.page,fx:st[0],fy:st[1],fw:0,fh:0,label:''};pv.state.marks.push(tmp);});
   box.addEventListener('pointermove',e=>{if(!st)return;const [x,y]=fr(e);Object.assign(tmp,{fx:Math.min(x,st[0]),fy:Math.min(y,st[1]),fw:Math.abs(x-st[0]),fh:Math.abs(y-st[1])});pv.state.redraw();});
   box.addEventListener('pointerup',()=>{if(tmp&&tmp.fw>0.005&&tmp.fh>0.005)this.boxes.push(tmp);else pv.state.marks.pop();st=tmp=null;pv.state.redraw();});
   return wrap;},
  async run([f],status){const {PDFDocument}=await L.pdflib();const data=await buf(f);const pj=await openPdfjs(data);const src=await PDFDocument.load(data);
   const boxes=[...this.boxes];const terms=(v('rterms')||'').split(',').map(s=>s.trim()).filter(Boolean);const cs=vb('rcase');let hits=0;
   if(terms.length){const tx=await pageTexts(pj);tx.forEach((p,pi)=>{const {width:W,height:H}=p.vp;for(const it of p.items){const s=cs?it.str:it.str.toLowerCase();for(const term of terms){const q=cs?term:term.toLowerCase();let at=s.indexOf(q);while(at>=0){hits++;const fs=Math.hypot(it.transform[2],it.transform[3])||10;const cw=it.width/Math.max(1,it.str.length);const x=it.transform[4]+cw*at,y=it.transform[5];
      const vx=p.vp.convertToViewportPoint(x-1,y-fs*.25),vy=p.vp.convertToViewportPoint(x+cw*q.length+1,y+fs*.95);boxes.push({page:pi+1,fx:Math.min(vx[0],vy[0])/W,fy:Math.min(vx[1],vy[1])/H,fw:Math.abs(vy[0]-vx[0])/W,fh:Math.abs(vy[1]-vx[1])/H});at=s.indexOf(q,at+q.length);}}}});
    if(!hits&&!boxes.length)throw new Error(T.o_notFound+': '+terms.join(', '));}
   if(!boxes.length)throw new Error(T.o_rDraw);
   const d=await PDFDocument.create();const aff=new Set(boxes.map(b=>b.page));
   for(let i=1;i<=pj.numPages;i++){if(!aff.has(i)){const [p]=await d.copyPages(src,[i-1]);d.addPage(p);continue;}status(`${T.working} ${i}/${pj.numPages}`);
    await rasterInto(d,pj,i,{scale:2.5,q:.9,draw:ctx=>{ctx.fillStyle='#000';const cw=ctx.canvas.width,ch=ctx.canvas.height;for(const b of boxes.filter(b=>b.page===i))ctx.fillRect(b.fx*cw,b.fy*ch,b.fw*cw,b.fh*ch);}});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-redacted.pdf',info:`${boxes.length} area(s) on ${aff.size} page(s) permanently removed; metadata cleared`};}};
