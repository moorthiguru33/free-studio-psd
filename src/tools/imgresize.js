// @needs img
const RPRE={passport:[413,531,'Passport 35×45 mm @300 DPI'],ig:[1080,1080,'Instagram post 1080×1080'],igp:[1080,1350,'Instagram portrait 1080×1350'],story:[1080,1920,'Story / Reel 1080×1920'],yt:[1280,720,'YouTube thumbnail 1280×720'],li:[1584,396,'LinkedIn banner 1584×396'],fb:[820,312,'Facebook cover 820×312'],x:[1500,500,'X header 1500×500'],hd:[1920,1080,'Full HD 1920×1080'],a4:[2480,3508,'A4 @300 DPI']};
async function encTarget(c,fmt,kb){if(!kb||fmt==='png')return encodeCanvas(c,fmt,.9);let lo=.05,hi=.95,best=null;for(let k=0;k<8;k++){const m=(lo+hi)/2;const t=await encodeCanvas(c,fmt,m);if(t.size<=kb*1024){best=t;lo=m;}else hi=m;}return best||encodeCanvas(c,fmt,.05);}
TOOLS.imgresize={opts:()=>sel('rpre',T.o_preset||'Preset',[['',T.o_custom||'Custom'],...Object.entries(RPRE).map(([k,x])=>[k,x[2]])])+sel('rmode',T.o_mode,[['px',T.o_byPx],['pct',T.o_byPct],['cm','cm'],['in','inches'],['mm','mm']])+inp('rw',T.o_width,'number','800','min="0.01" step="any"')+inp('rh',T.o_height,'number','','min="0.01" step="any" placeholder="auto"')+inp('rpct','%','number','50','min="1" max="1000"')+inp('rdpi','DPI (cm/inch/mm)','number','300','min="50" max="1200"')+chk('rkeep',T.o_keepAspect,true)+sel('rfit',T.o_fit||'When both sides are set',[['fit','Fit inside (no crop)'],['fill','Fill & crop to exact size'],['pad','Pad to exact size'],['stretch','Stretch']])+inp('rpad',T.o_bg||'Pad colour','color','#ffffff')+chk('rnoup',T.o_noUp||'Do not enlarge smaller images',false)+fmtSel('ofmt',T.o_format)+inp('rkb',T.o_targetKb||'Max file size KB (JPG/WebP)','number','','min="5" placeholder="—"'),
 async run(files,status){const items=[];const pre=RPRE[v('rpre')];for(const [i,f] of files.entries()){status(`${T.working} ${i+1}/${files.length}`);const c=await fileToCanvas(f);let w,h,fit=v('rfit');
   const mode=v('rmode'),dpi=+v('rdpi')||300,u={px:1,cm:dpi/2.54,in:dpi,mm:dpi/25.4}[mode]||1;
   if(pre){[w,h]=pre;if(fit==='fit')fit='fill';}
   else if(mode==='pct'){const p=(+v('rpct')||100)/100;w=c.width*p;h=c.height*p;fit='stretch';}else{w=(+v('rw')||0)*u;h=(+v('rh')||0)*u;if(!w&&!h)throw new Error(T.o_width+'?');if(!w||!h){if(w)h=c.height*w/c.width;else w=c.width*h/c.height;fit='stretch';}else if(!vb('rkeep'))fit='stretch';}
   w=Math.round(w);h=Math.round(h);if(vb('rnoup')&&(w>c.width||h>c.height)){const s=Math.min(1,c.width/w,c.height/h);w=Math.round(w*s);h=Math.round(h*s);}
   if(w>16384||h>16384)throw new Error('Max 16384 px');
   let sx=0,sy=0,sw=c.width,sh=c.height,dx=0,dy=0,dw=w,dh=h,ow=w,oh=h;
   if(fit==='fit'){const s=Math.min(w/c.width,h/c.height);ow=dw=Math.round(c.width*s);oh=dh=Math.round(c.height*s);}
   else if(fit==='fill'){const s=Math.max(w/c.width,h/c.height);sw=w/s;sh=h/s;sx=(c.width-sw)/2;sy=(c.height-sh)/2;}
   else if(fit==='pad'){const s=Math.min(w/c.width,h/c.height);dw=Math.round(c.width*s);dh=Math.round(c.height*s);dx=(w-dw)/2;dy=(h-dh)/2;}
   let src=c;while(src.width/2>dw*(src.width/sw)&&src.height/2>dh*(src.height/sh)&&src.width>32){const t=newCanvas(src.width/2,src.height/2);const x=t.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(src,0,0,t.width,t.height);const k=t.width/src.width;sx*=k;sy*=k;sw*=k;sh*=k;src=t;}
   const o=newCanvas(ow,oh);const x=o.getContext('2d');const fmt=outFmt(f,v('ofmt'));if(fit==='pad'){x.fillStyle=v('rpad');x.fillRect(0,0,ow,oh);}x.imageSmoothingQuality='high';x.drawImage(src,sx,sy,sw,sh,dx,dy,dw,dh);
   items.push({name:imgName(f,`-${ow}x${oh}`,fmt),blob:await encTarget(o,fmt,+v('rkb')||0)});}
  return zipOrOne(items,'resized-images.zip');}};
