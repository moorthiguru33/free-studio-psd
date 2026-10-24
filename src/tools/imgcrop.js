// @needs img
TOOLS.imgcrop={opts:()=>sel('ratio',T.o_aspect,[['0',T.o_free],['1','1:1'],['1.3333','4:3'],['1.5','3:2'],['1.7778','16:9'],['0.5625','9:16'],['0.8','4:5']])+['cx','cy','cw','ch'].map(k=>inp(k,{cx:'X',cy:'Y',cw:T.o_width,ch:T.o_height}[k]+' (px)','number','','min="0"')).join('')+fmtSel('ofmt',T.o_format),
 async setup(files){const c=await fileToCanvas(files[0]);this.c=c;const view=canvasView(c);const hint=document.createElement('div');hint.innerHTML=`<p class="hint" style="text-align:center">${esc(T.o_dragCrop)}</p>`;hint.appendChild(view.el);
  const set=r=>{['cx','cy','cw','ch'].forEach((k,i)=>$('#'+k,work).value=[r.x,r.y,r.w,r.h][i]);};set({x:0,y:0,w:c.width,h:c.height});
  const rs=rectSelect(view,c,(r)=>{if(r)set(r);},{aspect:()=>+v('ratio')});
  const sync=()=>{const r={x:+v('cx'),y:+v('cy'),w:+v('cw'),h:+v('ch')};rs.show(r);};['cx','cy','cw','ch'].forEach(k=>$('#'+k,work).addEventListener('input',sync));
  $('#ratio',work).addEventListener('change',()=>{const a=+v('ratio');if(!a)return;let w=c.width,h=w/a;if(h>c.height){h=c.height;w=h*a;}set({x:Math.round((c.width-w)/2),y:Math.round((c.height-h)/2),w:Math.round(w),h:Math.round(h)});sync();});
  return hint;},
 async run([f]){const c=this.c;let x=Math.max(0,+v('cx')||0),y=Math.max(0,+v('cy')||0),w=+v('cw')||c.width,h=+v('ch')||c.height;w=Math.min(w,c.width-x);h=Math.min(h,c.height-y);if(w<1||h<1)throw new Error(T.o_dragCrop);
  const o=newCanvas(w,h);o.getContext('2d').drawImage(c,x,y,w,h,0,0,w,h);const fmt=outFmt(f,v('ofmt'));return {name:imgName(f,'-cropped',fmt),blob:await encodeCanvas(o,fmt,.92),info:`${w}×${h}px`};}};
