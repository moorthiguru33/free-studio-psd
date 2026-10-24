// @needs pdfx
// Change page size: scale every page to fit A4/Letter/... (vector, centered)
const PS={a4:[595.28,841.89],letter:[612,792],legal:[612,1008],a3:[841.89,1190.55],a5:[419.53,595.28],b5:[498.9,708.66],tabloid:[792,1224]};
TOOLS.pagesize={opts:()=>sel('psz',T.o_pagesize,Object.keys(PS).map(k=>[k,k.length<3?k.toUpperCase():k[0].toUpperCase()+k.slice(1)]))+sel('pori',T.o_orient,[['auto',T.o_auto],['p',T.o_portrait],['l',T.o_landscape]])+sel('pfit',T.o_fit,[['fit',T.o_fitScale],['none',T.o_fitNone]])+inp('pmar',T.o_margin+' (mm)','number','0','min="0" max="50"'),
 async run([f]){const {PDFDocument}=await L.pdflib();const src=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const d=await PDFDocument.create();const emb=await d.embedPages(src.getPages());const m=(+v('pmar')||0)*2.8346;
  src.getPages().forEach((sp,i)=>{const e=emb[i];const rot=sp.getRotation().angle%180!==0;const ew=rot?e.height:e.width,eh=rot?e.width:e.height;let [W,H]=PS[v('psz')];const o=v('pori');if(o==='l'||(o==='auto'&&ew>eh))[W,H]=[H,W];
   const p=d.addPage([W,H]);const s=v('pfit')==='fit'?Math.min((W-2*m)/ew,(H-2*m)/eh):1;const w=ew*s,h=eh*s;const x=(W-w)/2,y=(H-h)/2;const {degrees}=window.PDFLib;const a=sp.getRotation().angle%360;
   if(!a)p.drawPage(e,{x,y,width:w,height:h});else if(a===90)p.drawPage(e,{x,y:y+h,width:h,height:w,rotate:degrees(-90)});else if(a===180)p.drawPage(e,{x:x+w,y:y+h,width:w,height:h,rotate:degrees(180)});else p.drawPage(e,{x:x+w,y,width:h,height:w,rotate:degrees(90)});});
  return {blob:pdfBlob(await d.save()),name:base(f.name)+'-'+v('psz')+'.pdf'};}};
