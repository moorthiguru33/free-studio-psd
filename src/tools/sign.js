TOOLS.sign={async setup(files){
   const wrap=document.createElement('div');wrap.innerHTML=`<div class="opts"><div class="sigbox" style="display:flex;flex-direction:column;gap:4px;font-weight:600">${esc(T.o_drawSig)}<canvas class="sigpad" width="840" height="300"></canvas><button type="button" class="btn ghost" id="sigclr" style="margin-top:6px;align-self:flex-start">${esc(T.o_clear)}</button></div>${inp('sigtxt',T.o_typeSig)}${inp('sigw','Width (%)','number','25','min="5" max="90"')}</div>`;
   const pad=$('.sigpad',wrap),ctx=pad.getContext('2d');ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#0b2a6f';let drawing=false,dirty=false;
   const pt=e=>{const r=pad.getBoundingClientRect();return [(e.clientX-r.left)*pad.width/r.width,(e.clientY-r.top)*pad.height/r.height];};
   pad.addEventListener('pointerdown',e=>{drawing=true;dirty=true;pad.setPointerCapture(e.pointerId);ctx.beginPath();ctx.moveTo(...pt(e));});pad.addEventListener('pointermove',e=>{if(!drawing)return;ctx.lineTo(...pt(e));ctx.stroke();});pad.addEventListener('pointerup',()=>drawing=false);
   $('#sigclr',wrap).onclick=()=>{ctx.clearRect(0,0,pad.width,pad.height);dirty=false;};
   this.sig=()=>{if(dirty)return pad;const t=$('#sigtxt',wrap).value.trim();if(!t)return null;const c=document.createElement('canvas');c.width=900;c.height=220;const x=c.getContext('2d');x.font='italic 120px "Segoe Script","Brush Script MT","Lucida Handwriting",cursive';x.fillStyle='#0b2a6f';x.textBaseline='middle';const w=Math.min(880,x.measureText(t).width);x.fillText(t,10,110,880);const o=document.createElement('canvas');o.width=w+20;o.height=220;o.getContext('2d').drawImage(c,0,0);return o;};
   const pv=await setupPreview(files[0],(page,fx,fy)=>{const fw=(+$('#sigw',wrap).value||25)/100;const s=this.sig();if(!s){alert(T.o_drawSig);return null;}const fh=fw*s.height/s.width*(this.pageAR||1.414)**-1;this.marks=[{page,fx,fy,fw,fh,label:'✍'}];pv.state.marks=[];return this.marks[0];});
   this.pv=pv;wrap.appendChild(pv.el);return wrap;},
  async run([f]){const s=this.sig();if(!s)throw new Error(T.o_drawSig);if(!this.marks?.length)throw new Error(T.o_clickPlace);const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(f));
   // trim transparent edges
   const png=await d.embedPng(new Uint8Array(await (await toBlob(s,'image/png')).arrayBuffer()));
   for(const m of this.marks){const p=d.getPage(m.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();const w=m.fw*W,h=w*s.height/s.width;p.drawImage(png,{x:bx+m.fx*W,y:by+H-m.fy*H-h,width:w,height:h});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-signed.pdf'};}};
