// @needs pdfx
// PDF -> SVG (vector, via pdf.js SVG backend; one SVG per page, ZIP for several)
TOOLS.pdf2svg={opts:()=>inp('svrange',T.o_pagesOpt,'text','','placeholder="1-3,5"'),
 async run([f],status){const pj=await openPdfjs(await buf(f));const lib=window.pdfjsLib;if(!lib.SVGGraphics)throw new Error('SVG backend unavailable');const pages=v('svrange')?parseRanges(v('svrange'),pj.numPages).flatMap(r=>r.idx.map(i=>i+1)):Array.from({length:pj.numPages},(_,i)=>i+1);const items=[];
  for(const n of pages){status(`${T.working} ${n}/${pj.numPages}`);const pg=await pj.getPage(n);const vp=pg.getViewport({scale:1});const ops=await pg.getOperatorList();const g=new lib.SVGGraphics(pg.commonObjs,pg.objs);g.embedFonts=true;const svg=await g.getSVG(ops,vp);
   items.push({name:`${base(f.name)}-page${n}.svg`,blob:new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'})});}
  return zipOrOne(items,base(f.name)+'-svg.zip');}};
