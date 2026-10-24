// @needs img
const WPOS=()=>[['mc','●'],['tl','↖'],['tc','↑'],['tr','↗'],['ml','←'],['mr','→'],['bl','↙'],['bc','↓'],['br','↘'],['tile',T.o_tile]];
TOOLS.imgwatermark={opts:()=>inp('wtext',T.o_text,'text','© Your Name')+`<label>${esc(T.o_logo)}<input id="wlogo" type="file" accept="image/*"></label>`+sel('wpos',T.o_position,WPOS())+inp('wsize',T.o_sizePct,'number','6','min="1" max="80"')+inp('wop',T.o_opacity,'number','50','min="5" max="100"')+inp('wrot',T.o_angle,'number','0','min="-180" max="180"')+'<label>Color<input id="wcol" type="color" value="#ffffff"></label>'+chk('wshadow',T.o_shadow,true)+fmtSel('ofmt',T.o_format),
 async run(files,status){const txt=v('wtext');const lf=$('#wlogo',work).files[0];if(!txt&&!lf)throw new Error(T.o_text+' / '+T.o_logo);const logo=lf?await fileToCanvas(lf):null;const items=[];
  for(const [i,f] of files.entries()){status(`${T.working} ${i+1}/${files.length}`);const c=await fileToCanvas(f);const x=c.getContext('2d');const W=c.width,H=c.height;const pct=(+v('wsize')||6)/100;const pos=v('wpos');const rot=(+v('wrot')||0)*Math.PI/180;x.globalAlpha=(+v('wop')||50)/100;
   let mw,mh,draw;if(logo){mw=W*pct*4;mh=logo.height*mw/logo.width;draw=()=>x.drawImage(logo,-mw/2,-mh/2,mw,mh);}
   else{const fs=Math.max(8,Math.round(Math.min(W,H)*pct));x.font=`bold ${fs}px system-ui,"Segoe UI",Roboto,"Noto Sans",Arial,sans-serif`;mw=x.measureText(txt).width;mh=fs;x.textAlign='center';x.textBaseline='middle';x.fillStyle=v('wcol');
    draw=()=>{if(vb('wshadow')){x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=fs/8;x.shadowOffsetX=x.shadowOffsetY=fs/20;}x.fillText(txt,0,0);x.shadowColor='transparent';};}
   const at=(cx,cy)=>{x.save();x.translate(cx,cy);x.rotate(rot);draw();x.restore();};const m=Math.min(W,H)*.03;
   if(pos==='tile'){const sx=mw*1.6+mh,sy=mh*4;for(let yy=sy/2;yy<H+sy;yy+=sy)for(let xx=(yy/sy%2)*sx/2;xx<W+sx;xx+=sx)at(xx,yy);}
   else at(pos[1]==='l'?m+mw/2:pos[1]==='r'?W-m-mw/2:W/2,pos[0]==='t'?m+mh/2:pos[0]==='b'?H-m-mh/2:H/2);
   const fmt=outFmt(f,v('ofmt'));items.push({name:imgName(f,'-watermarked',fmt),blob:await encodeCanvas(c,fmt,.92)});}
  return zipOrOne(items,'watermarked-images.zip');}};
