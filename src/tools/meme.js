// @needs img
TOOLS.meme={opts:()=>inp('mtop',T.o_topText,'text','')+inp('mbot',T.o_bottomText,'text','')+inp('msize',T.o_sizePct,'number','10','min="3" max="30"')+'<label>Color<input id="mcol" type="color" value="#ffffff"></label>'+chk('mcaps',T.o_caps,true)+sel('ofmt',T.o_format,[['jpg','JPG'],['png','PNG']]),
 async setup(files){this.src=await fileToCanvas(files[0]);const pv=newCanvas(1,1);this.pv=pv;const view=canvasView(pv);const upd=()=>this.draw(pv);['mtop','mbot','msize','mcol','mcaps'].forEach(k=>$('#'+k,work).addEventListener('input',upd));upd();return view.el;},
 draw(o){const c=this.src;const sc=Math.min(1,2000/Math.max(c.width,c.height));o.width=Math.round(c.width*sc);o.height=Math.round(c.height*sc);const x=o.getContext('2d');x.drawImage(c,0,0,o.width,o.height);
  const fs=Math.round(o.height*(+v('msize')||10)/100);x.font=`900 ${fs}px Impact,Anton,"Arial Black","Noto Sans",sans-serif`;x.textAlign='center';x.fillStyle=v('mcol');x.strokeStyle='#000';x.lineWidth=Math.max(2,fs/12);x.lineJoin='round';
  const wrap=t=>{const words=t.split(/\s+/);const lines=[];let cur='';for(const w of words){const tt=cur?cur+' '+w:w;if(x.measureText(tt).width>o.width*.94&&cur){lines.push(cur);cur=w;}else cur=tt;}if(cur)lines.push(cur);return lines;};
  const put=(t,top)=>{if(!t)return;if(vb('mcaps'))t=t.toUpperCase();const ls=wrap(t);ls.forEach((l,i)=>{const y=top?fs*.1+fs*(i+1)*1.0:o.height-fs*.25-(ls.length-1-i)*fs;x.strokeText(l,o.width/2,y);x.fillText(l,o.width/2,y);});};
  put(v('mtop'),true);put(v('mbot'),false);},
 async run([f]){if(!v('mtop')&&!v('mbot'))throw new Error(T.o_topText+'?');const o=newCanvas(1,1);this.draw(o);const fmt=v('ofmt');return {name:imgName(f,'-meme',fmt),blob:await encodeCanvas(o,fmt,.92)};}};
