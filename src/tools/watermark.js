// @needs pdfx
// ---------- Watermark ----------
TOOLS.watermark={opts:()=>sel('wkind',T.o_wKind||'Watermark type',[['text','Text'],['img','Image / logo']])+inp('wtext',T.o_text,'text','CONFIDENTIAL')+`<label>${esc(T.o_wImg||'Image (PNG/JPG)')}<input id="wimg" type="file" accept="image/png,image/jpeg"></label>`+inp('wsize',T.o_size+' (text pt / image % of page width)','number','48','min="5" max="200"')+inp('wop',T.o_opacity,'number','25','min="5" max="100"')+inp('wrot',T.o_angle,'number','45','min="-180" max="180"')+'<label>Color<input id="wcol" type="color" value="#e5322d"></label>'+sel('wlay',T.o_layout,[['center',T.o_center],['tile',T.o_tile],['tl','Top left'],['tc','Top centre'],['tr','Top right'],['ml','Middle left'],['mr','Middle right'],['bl','Bottom left'],['bc','Bottom centre'],['br','Bottom right']])+inp('wpages',T.o_wPages||'Pages (blank = all, e.g. 1,3-5)','text','','placeholder="all"'),
  async run(files){const {PDFDocument,degrees}=await L.pdflib();const items=[];const kind=v('wkind')||'text';const txt=v('wtext');if(kind==='text'&&!txt)throw new Error(T.o_text);
   const imf=document.getElementById('wimg')?.files?.[0];if(kind==='img'&&!imf)throw new Error(T.o_wImg||'Choose an image');const imb=imf?new Uint8Array(await imf.arrayBuffer()):null;
   for(const f of files){const d=await PDFDocument.load(await buf(f));const size=+v('wsize')||48,op=(+v('wop')||25)/100,rot=+v('wrot')||0,color=hex2rgb(v('wcol')),lay=v('wlay');const a=rot*Math.PI/180;const ps=d.getPages();
    const set=(v('wpages')||'').trim()?new Set(parseRanges(v('wpages'),ps.length).flatMap(r=>r.idx)):null;
    let runs,w,h,img;if(kind==='img'){img=/png/i.test(imf.type)||imb[0]===0x89?await d.embedPng(imb):await d.embedJpg(imb);}else{runs=await textRuns(d,txt,true);w=runsWidth(runs,size);h=size;}
    ps.forEach((p,pi)=>{if(set&&!set.has(pi))return;const {x:bx,y:by,width:W,height:H}=p.getCropBox();
     let iw,ih;if(img){iw=W*Math.min(size,100)/100;ih=iw*img.height/img.width;w=iw;h=ih;}
     const at=(cx,cy)=>{if(img){p.drawImage(img,{x:cx-(iw/2)*Math.cos(a)+(ih/2)*Math.sin(a),y:cy-(iw/2)*Math.sin(a)-(ih/2)*Math.cos(a),width:iw,height:ih,opacity:op,rotate:degrees(rot)});}else drawRuns(p,runs,{x:cx-(w/2)*Math.cos(a)+(size/3)*Math.sin(a),y:cy-(w/2)*Math.sin(a)-(size/3)*Math.cos(a),size,color,opacity:op,rotate:rot});};
     const ext=Math.abs(w*Math.cos(a))+Math.abs(h*Math.sin(a)),exty=Math.abs(w*Math.sin(a))+Math.abs(h*Math.cos(a)),m=24;
     if(lay==='tile'){const sx=Math.max(ext,w*.8)+Math.max(size,40)*2,sy=Math.max(exty,h)+Math.max(size,40)*2;for(let yy=by;yy<by+H+sy;yy+=sy)for(let xx=bx;xx<bx+W+sx;xx+=sx)at(xx,yy);}
     else if(lay==='center')at(bx+W/2,by+H/2);else{const cx=lay[1]==='l'?bx+m+ext/2:lay[1]==='r'?bx+W-m-ext/2:bx+W/2,cy=lay[0]==='t'?by+H-m-exty/2:lay[0]==='b'?by+m+exty/2:by+H/2;at(cx,cy);}});
    items.push({name:base(f.name)+'-watermarked.pdf',blob:pdfBlob(await d.save())});}
   return zipOrOne(items,'watermarked.zip');}};
