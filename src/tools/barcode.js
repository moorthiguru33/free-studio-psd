// Barcode generator (JsBarcode, MIT): CODE128, EAN-13/8, UPC, CODE39, ITF-14, Codabar, MSI, Pharmacode -> PNG + SVG
const BF=[['CODE128','Code 128'],['EAN13','EAN-13'],['EAN8','EAN-8'],['UPC','UPC-A'],['CODE39','Code 39'],['ITF14','ITF-14'],['codabar','Codabar'],['MSI','MSI'],['pharmacode','Pharmacode']];
const BX={CODE128:'FreePDF-12345',EAN13:'590123412345',EAN8:'9638507',UPC:'03600029145',CODE39:'ABC-123',ITF14:'1540014128876',codabar:'A12345B',MSI:'1234567',pharmacode:'1234'};
TOOLS.barcode={goLabel:()=>T.o_bcreate,
 opts(){const f=this.vars.format||'CODE128';return sel('bfmt',T.o_bformat,BF.slice().sort((a,b)=>(b[0]===f)-(a[0]===f)))+inp('bval',T.o_bvalue,'text',BX[f])+inp('bw',T.o_bbar,'number','2','min="1" max="6"')+inp('bh',T.o_bheight,'number','100','min="20" max="400"')+
  `<label>${esc(T.o_qfg)}<input id="bfg" type="color" value="#000000"></label><label>${esc(T.o_bg)}<input id="bbg" type="color" value="#ffffff"></label>`+chk('btxt',T.o_btext,true);},
 async setup(){await load('JsBarcode.all.min.js');const el=document.createElement('div');el.innerHTML=`<div style="text-align:center;overflow:auto"><svg id="bprev"></svg><p class="hint" id="binfo"></p></div>`;
  if(!this.bound)this.bound=1,work.addEventListener('input',()=>this.preview()),work.addEventListener('change',e=>{if(e.target.id==='bfmt')$('#bval',work).value=BX[v('bfmt')];this.preview();});
  setTimeout(()=>this.preview(),0);return el;},
 o(){return {format:v('bfmt'),width:+v('bw')||2,height:+v('bh')||100,displayValue:$('#btxt',work).checked,lineColor:v('bfg'),background:v('bbg'),margin:10,font:'monospace',valid:ok=>{this.ok=ok;}};},
 draw(target){this.ok=true;window.JsBarcode(target,v('bval'),this.o());return this.ok;},
 preview(){const s=$('#bprev',work);if(!s)return;try{const ok=this.draw(s);$('#binfo',work).textContent=ok?'':T.o_binvalid;s.style.display=ok?'':'none';}catch(e){$('#binfo',work).textContent=T.o_binvalid;s.style.display='none';}},
 async run(){const c=document.createElement('canvas');let ok;try{ok=this.draw(c);}catch(e){ok=false;}if(!ok)throw new Error(T.o_binvalid);
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg');this.draw(s);const name='barcode-'+v('bfmt').toLowerCase();
  return {name:name+'.png',blob:await toBlob(c,'image/png'),extra:[{name:name+'.svg',label:'SVG',blob:new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(s)],{type:'image/svg+xml'})}]};}};
