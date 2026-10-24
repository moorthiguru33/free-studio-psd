// @needs pdfx
// ---------- Extract images ----------
TOOLS.extractimages={opts:()=>sel('eifmt',T.o_format,[['png','PNG'],['jpg','JPG']])+inp('eimin',T.o_minPx,'number','16','min="1"'),
  async run([f],status){const pj=await L.pdfjs();const doc=await openPdfjs(await buf(f));const OPS=pj.OPS;const items=[];const seen=new Set();const png=v('eifmt')==='png',min=+v('eimin')||1;
   for(let i=1;i<=doc.numPages;i++){status(`${T.working} ${i}/${doc.numPages}`);const pg=await doc.getPage(i);const ol=await pg.getOperatorList();
    for(let k=0;k<ol.fnArray.length;k++){const fn=ol.fnArray[k];if(fn!==OPS.paintImageXObject&&fn!==OPS.paintInlineImageXObject&&fn!==OPS.paintImageXObjectRepeat)continue;let img;
     if(fn===OPS.paintInlineImageXObject)img=ol.argsArray[k][0];else{const name=ol.argsArray[k][0];if(seen.has(name))continue;seen.add(name);img=await new Promise(res=>{const store=name.startsWith('g_')?pg.commonObjs:pg.objs;try{store.get(name,res);}catch(e){res(null);}});}
     if(!img)continue;const c=imgToCanvas(img);if(!c||c.width<min||c.height<min)continue;items.push({name:`${base(f.name)}-p${i}-${items.length+1}.${png?'png':'jpg'}`,blob:await toBlob(c,png?'image/png':'image/jpeg',.92)});}
    pg.cleanup();}
   if(!items.length)throw new Error(T.o_noImages);return {...await zipOrOne(items,base(f.name)+'-images.zip'),info:`${items.length} image(s)`};}};
