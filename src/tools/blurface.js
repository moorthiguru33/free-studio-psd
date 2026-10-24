// @needs img
TOOLS.blurface={opts:()=>sel('bmode',T.o_mode,[['blur',T.o_blur],['pixel',T.o_pixelate],['black',T.o_blackBox]])+inp('bstr',T.o_strength,'number','12','min="1" max="50"')+fmtSel('ofmt',T.o_format),
 async setup(files){const c=await fileToCanvas(files[0]);this.c=c;this.boxes=[];const pv=newCanvas(c.width,c.height);const view=canvasView(pv);
  const el=document.createElement('div');el.innerHTML=`<p style="text-align:center"><button type="button" class="btn ghost" id="bdetect">🙂 ${esc(T.o_detectFaces)}</button> <button type="button" class="btn ghost" id="bclear">${esc(T.o_clear)}</button></p><p class="hint" style="text-align:center">${esc(T.o_drawAreas)}</p><p class="hint" id="bcount" style="text-align:center"></p>`;el.appendChild(view.el);
  const redraw=(tmp)=>{const x=pv.getContext('2d');x.drawImage(c,0,0);x.lineWidth=Math.max(2,c.width/300);x.strokeStyle='#e5322d';for(const b of [...this.boxes,...(tmp?[tmp]:[])])x.strokeRect(b.x,b.y,b.w,b.h);$('#bcount',el).textContent=`${this.boxes.length} ${T.o_areas}`;};
  let cur=null;rectSelect(view,pv,(r,done)=>{if(r){cur=r;redraw(r);}if(done&&cur){if(cur.w>3&&cur.h>3)this.boxes.push(cur);cur=null;redraw();}});
  view.el.querySelector('.selrect').style.visibility='hidden';
  $('#bclear',el).onclick=()=>{this.boxes=[];redraw();};
  $('#bdetect',el).onclick=async()=>{const st=$('.status',work);st.className='status';st.textContent=T.working;try{const n=await this.detect();st.textContent=`${n} ${T.o_facesFound}`;redraw();}catch(e){st.className='status err';st.textContent=T.error+' '+e.message;}};
  redraw();setTimeout(()=>$('#bdetect',el).click(),50);return el;},
 async detect(){await load('face-api.min.js');const fa=window.faceapi;if(!this.net){await fa.nets.tinyFaceDetector.loadFromUri('/models/face');this.net=1;}
  const c=this.c;const sc=Math.min(1,1280/Math.max(c.width,c.height));const s=newCanvas(c.width*sc,c.height*sc);s.getContext('2d').drawImage(c,0,0,s.width,s.height);
  const det=await fa.detectAllFaces(s,new fa.TinyFaceDetectorOptions({inputSize:608,scoreThreshold:.35}));for(const d of det){const b=d.box;const p=.15;this.boxes.push({x:Math.max(0,(b.x-b.width*p)/sc),y:Math.max(0,(b.y-b.height*p*1.5)/sc),w:b.width*(1+2*p)/sc,h:b.height*(1+2*p*1.5)/sc});}return det.length;},
 async run([f]){if(!this.boxes.length)throw new Error(T.o_drawAreas);const c=newCanvas(this.c.width,this.c.height);const x=c.getContext('2d');x.drawImage(this.c,0,0);const s=+v('bstr')||12,mode=v('bmode');
  for(const b of this.boxes){const bx=Math.round(b.x),by=Math.round(b.y),bw=Math.round(Math.min(b.w,c.width-bx)),bh=Math.round(Math.min(b.h,c.height-by));if(bw<1||bh<1)continue;
   if(mode==='black'){x.fillStyle='#000';x.fillRect(bx,by,bw,bh);continue;}
   if(mode==='pixel'){const k=Math.max(2,Math.round(Math.max(bw,bh)/(60/s*4)));const t=newCanvas(Math.max(1,bw/k),Math.max(1,bh/k));t.getContext('2d').drawImage(c,bx,by,bw,bh,0,0,t.width,t.height);x.imageSmoothingEnabled=false;x.drawImage(t,0,0,t.width,t.height,bx,by,bw,bh);x.imageSmoothingEnabled=true;continue;}
   // blur: downscale + blur filter, clipped to an ellipse; repeated so the original cannot be recovered
   const t=newCanvas(bw,bh);const tx=t.getContext('2d');tx.filter=`blur(${Math.max(bw,bh)*s/100}px)`;for(let k=0;k<3;k++){tx.drawImage(k?t:c,k?0:bx,k?0:by,bw,bh,0,0,bw,bh);}
   x.save();x.beginPath();x.ellipse(bx+bw/2,by+bh/2,bw/2,bh/2,0,0,Math.PI*2);x.clip();x.drawImage(t,bx,by);x.restore();}
  const fmt=outFmt(f,v('ofmt'));return {name:imgName(f,'-blurred',fmt),blob:await encodeCanvas(c,fmt,.92),info:`${this.boxes.length} ${T.o_areas}`};}};
