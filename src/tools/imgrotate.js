// @needs img
TOOLS.imgrotate={opts:()=>sel('rang',T.o_angle,[['90','90° ⟳'],['180','180°'],['270','90° ⟲'],['0','0°']])+inp('rfree',T.o_customAngle,'number','0','min="-180" max="180" step="0.1"')+chk('fliph',T.o_flipH,false)+chk('flipv',T.o_flipV,false)+'<label>'+esc(T.o_bg)+'<input id="rbg" type="color" value="#ffffff"></label>'+fmtSel('ofmt',T.o_format),
 async run(files){const items=[];for(const f of files){const c=await fileToCanvas(f);const a=((+v('rang')||0)+(+v('rfree')||0))*Math.PI/180;const cs=Math.abs(Math.cos(a)),sn=Math.abs(Math.sin(a));const W=Math.round(c.width*cs+c.height*sn),H=Math.round(c.width*sn+c.height*cs);
   const o=newCanvas(W,H);const x=o.getContext('2d');const fmt=outFmt(f,v('ofmt'));if(+v('rfree')&&fmt==='jpg'){x.fillStyle=v('rbg');x.fillRect(0,0,W,H);}x.translate(W/2,H/2);x.rotate(a);x.scale(vb('fliph')?-1:1,vb('flipv')?-1:1);x.drawImage(c,-c.width/2,-c.height/2);
   items.push({name:imgName(f,'-rotated',fmt),blob:await encodeCanvas(o,fmt,.92)});}
  return zipOrOne(items,'rotated-images.zip');}};
