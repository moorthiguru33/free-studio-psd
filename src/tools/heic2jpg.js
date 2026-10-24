// @needs img
TOOLS.heic2jpg={opts:()=>sel('ofmt',T.o_format,[['jpg','JPG'],['png','PNG'],['webp','WEBP']])+qualityInp('q',92),
 async run(files,status){const items=[];for(const [i,f] of files.entries()){status(`${T.working} ${i+1}/${files.length}`);const c=await fileToCanvas(f);const fmt=v('ofmt');items.push({name:imgName(f,'',fmt),blob:await encodeCanvas(c,fmt,(+v('q')||92)/100)});}
  return zipOrOne(items,'heic-converted.zip');}};
