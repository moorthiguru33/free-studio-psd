// Sign PDF: draw / type / upload a signature, optional initials and date stamp, place it any number of times on any pages,
// optionally remember it on this device (localStorage only), optional flatten-on-save is implicit (signature is page content).
TOOLS.sign={async setup(files){const S=this;S.marks=[];
   const wrap=document.createElement('div');const saved=(()=>{try{return localStorage.getItem('fo_sig')}catch(e){return null}})();
   wrap.innerHTML=`<div class="opts"><div class="sigbox" style="display:flex;flex-direction:column;gap:4px;font-weight:600">${esc(T.o_drawSig)}<canvas class="sigpad" width="840" height="300"></canvas><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn ghost" id="sigclr">${esc(T.o_clear)}</button><button type="button" class="btn ghost" id="sigup">${esc(T.o_sigUpload||'Upload signature image')}</button>${saved?`<button type="button" class="btn ghost" id="sigld">${esc(T.o_sigSaved||'Use saved signature')}</button>`:''}<input type="file" id="sigf" accept="image/*" hidden></div></div>${inp('sigtxt',T.o_typeSig)}${sel('sigwhat',T.o_sigWhat||'Place',[['sig',T.o_signature||'Signature'],['ini',T.o_initials||'Initials (from typed name)'],['date',T.o_sigDate||'Today’s date'],['text',T.o_sigText||'Custom text']])}${inp('sigcustom',T.o_sigCustom||'Custom text','text','','placeholder="e.g. Approved"')}${inp('sigw','Width (%)','number','25','min="3" max="90"')}<label>${esc(T.o_color||'Colour')}<input type="color" id="sigcol" value="#0b2a6f"></label>${chk('sigrem',T.o_sigRemember||'Remember my signature on this device',!!saved)}<p class="hint">${esc(T.o_sigMulti||'Click the page to place. Each click adds another copy – switch pages to sign every page. Use Undo to remove the last one.')}</p><button type="button" class="btn ghost" id="sigundo">↶ ${esc(T.o_undo||'Undo last placement')}</button></div>`;
   const pad=$('.sigpad',wrap),ctx=pad.getContext('2d');ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';let drawing=false,dirty=false,upl=null;const col=()=>$('#sigcol',wrap).value;
   const pt=e=>{const r=pad.getBoundingClientRect();return [(e.clientX-r.left)*pad.width/r.width,(e.clientY-r.top)*pad.height/r.height];};
   pad.addEventListener('pointerdown',e=>{drawing=true;dirty=true;upl=null;ctx.strokeStyle=col();pad.setPointerCapture(e.pointerId);ctx.beginPath();ctx.moveTo(...pt(e));});pad.addEventListener('pointermove',e=>{if(!drawing)return;ctx.lineTo(...pt(e));ctx.stroke();});pad.addEventListener('pointerup',()=>drawing=false);
   $('#sigclr',wrap).onclick=()=>{ctx.clearRect(0,0,pad.width,pad.height);dirty=false;upl=null;};
   const loadImg=async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);return c;};
   const showOnPad=c=>{ctx.clearRect(0,0,pad.width,pad.height);const s=Math.min(pad.width/c.width,pad.height/c.height);ctx.drawImage(c,(pad.width-c.width*s)/2,(pad.height-c.height*s)/2,c.width*s,c.height*s);};
   $('#sigup',wrap).onclick=()=>$('#sigf',wrap).click();
   $('#sigf',wrap).onchange=async e=>{const f=e.target.files[0];if(!f)return;const c=await loadImg(URL.createObjectURL(f));// make near-white background transparent
     const x=c.getContext('2d'),id=x.getImageData(0,0,c.width,c.height),a=id.data;for(let i=0;i<a.length;i+=4)if(a[i]>225&&a[i+1]>225&&a[i+2]>225)a[i+3]=0;x.putImageData(id,0,0);upl=c;dirty=false;showOnPad(c);};
   if(saved)$('#sigld',wrap).onclick=async()=>{upl=await loadImg(saved);dirty=false;showOnPad(upl);};
   const trim=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=-1,y1=-1;for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(d[(y*c.width+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}if(x1<0)return c;const o=document.createElement('canvas');o.width=x1-x0+8;o.height=y1-y0+8;o.getContext('2d').drawImage(c,x0-4,y0-4,o.width,o.height,0,0,o.width,o.height);return o;};
   const txt=(t,font)=>{const c=document.createElement('canvas');c.width=1400;c.height=220;const x=c.getContext('2d');x.font=font;x.fillStyle=col();x.textBaseline='middle';x.fillText(t,10,110,1380);return trim(c);};
   const script='italic 120px "Segoe Script","Brush Script MT","Lucida Handwriting",cursive';
   S.sig=()=>{const w=$('#sigwhat',wrap).value,t=$('#sigtxt',wrap).value.trim();
     if(w==='date')return txt(new Date().toLocaleDateString(),'100px Helvetica,Arial,sans-serif');
     if(w==='text'){const c=$('#sigcustom',wrap).value.trim();return c?txt(c,'100px Helvetica,Arial,sans-serif'):null;}
     if(w==='ini'){if(!t)return null;return txt(t.split(/\s+/).map(p=>p[0]).join('').toUpperCase(),script);}
     if(upl)return trim(upl);if(dirty)return trim(pad);if(!t)return null;return txt(t,script);};
   const pv=await setupPreview(files[0],(page,fx,fy,r)=>{const fw0=(+$('#sigw',wrap).value||25)/100;const s=S.sig();if(!s){alert(T.o_drawSig);return null;}const w=$('#sigwhat',wrap).value;const fw=w==='sig'?fw0:Math.min(fw0,w==='ini'?0.08:0.2);const fh=fw*s.height/s.width*(r.width/r.height);
     const png=s.toDataURL('image/png');if(w==='sig'&&$('#sigrem',wrap).checked){try{localStorage.setItem('fo_sig',png)}catch(e){}}
     const m={page,fx:Math.max(0,Math.min(1-fw,fx-fw/2)),fy:Math.max(0,Math.min(1-fh,fy-fh/2)),fw,fh,label:'✍',png};S.marks.push(m);return m;});
   $('#sigrem',wrap).onchange=e=>{if(!e.target.checked)try{localStorage.removeItem('fo_sig')}catch(_){}};
   $('#sigundo',wrap).onclick=()=>{S.marks.pop();pv.state.marks.pop();pv.state.redraw();};
   S.pv=pv;wrap.appendChild(pv.el);return wrap;},
  async run([f]){if(!this.marks?.length)throw new Error(T.o_clickPlace);const {PDFDocument}=await L.pdflib();const d=await PDFDocument.load(await buf(f));const cache={};
   for(const m of this.marks){const p=d.getPage(m.page-1);const {x:bx,y:by,width:W,height:H}=p.getCropBox();const img=cache[m.png]||(cache[m.png]=await d.embedPng(m.png));const w=m.fw*W,h=m.fh*H;p.drawImage(img,{x:bx+m.fx*W,y:by+H-m.fy*H-h,width:w,height:h});}
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-signed.pdf',info:this.marks.length+' '+(T.o_placed||'placement(s)')};}};
