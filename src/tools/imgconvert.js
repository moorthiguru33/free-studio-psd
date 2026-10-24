// @needs img
// Generic converter; landing pages preset the target via data-vars {to:"jpg"}
TOOLS.imgconvert={opts(){const to=(this.vars.to||'jpg').toLowerCase();return sel('ofmt',T.o_format,['jpg','png','webp','avif','gif','bmp','tiff','ico','svg'].map(x=>[x,x.toUpperCase()+(x==='svg'?' (trace)':'')]).sort((a,b)=>(b[0]===to)-(a[0]===to)))+qualityInp('q',90)+'<label>'+esc(T.o_bg)+' (JPG)<input id="cbg" type="color" value="#ffffff"></label>';},
 async run(files,status){const fmt=v('ofmt');const q=(+v('q')||90)/100;const items=[];
  for(const [i,f] of files.entries()){status(`${T.working} ${i+1}/${files.length}`);const c=await fileToCanvas(f);let b;
   if(fmt==='svg'){const IT=await IL.tracer();const id=c.getContext('2d').getImageData(0,0,c.width,c.height);b=new Blob([IT.imagedataToSVG(id,{numberofcolors:16,ltres:1,qtres:1,pathomit:8,roundcoords:1,viewbox:true})],{type:'image/svg+xml'});}
   else if(fmt==='jpg')b=await toBlob(flatten(c,v('cbg')),'image/jpeg',q);else b=await encodeCanvas(c,fmt,q);
   items.push({name:imgName(f,'',fmt),blob:b});}
  return zipOrOne(items,`converted-${fmt}.zip`);}};
