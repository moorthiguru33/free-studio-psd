// Barcode generator (JsBarcode, MIT): CODE128, EAN-13/8, UPC, CODE39, ITF-14, Codabar, MSI, Pharmacode -> PNG + SVG
const BF=[['CODE128','Code 128'],['EAN13','EAN-13'],['EAN8','EAN-8'],['UPC','UPC-A'],['CODE39','Code 39'],['ITF14','ITF-14'],['codabar','Codabar'],['MSI','MSI'],['pharmacode','Pharmacode']];
const BX={CODE128:'Fileopia-12345',EAN13:'590123412345',EAN8:'9638507',UPC:'03600029145',CODE39:'ABC-123',ITF14:'1540014128876',codabar:'A12345B',MSI:'1234567',pharmacode:'1234'};
TOOLS.barcode={live:true,goLabel:()=>T.o_bcreate,
 opts(){const f=this.vars.format||'CODE128';return sel('bfmt',T.o_bformat,BF.slice().sort((a,b)=>(b[0]===f)-(a[0]===f)))+inp('bval',T.o_bvalue,'text',BX[f])+inp('bw',T.o_bbar,'number','2','min="1" max="6"')+inp('bh',T.o_bheight,'number','100','min="20" max="400"')+
  `<label>${esc(T.o_qfg)}<input id="bfg" type="color" value="#000000"></label><label>${esc(T.o_bg)}<input id="bbg" type="color" value="#ffffff"></label>`+chk('btxt',T.o_btext,true)+inp('bfs','Text size (px)','number','20','min="8" max="48"')+sel('bscale','PNG resolution',[['1','Screen (1×)'],['2','Print 2× (≈ 200 dpi)'],['3','Print 3× (≈ 300 dpi)']])+`<label>Bulk: one value per line (optional – makes a ZIP of PNG + SVG)<textarea id="bbulk" rows="4" placeholder="590123412345&#10;590123412352"></textarea></label>`;},
 async setup(){await load('JsBarcode.all.min.js');const el=document.createElement('div');el.innerHTML=`<div style="text-align:center;overflow:auto"><svg id="bprev"></svg><p class="hint" id="binfo"></p></div>`;
  if(!this.bound)this.bound=1,work.addEventListener('input',()=>this.preview()),work.addEventListener('change',e=>{if(e.target.id==='bfmt')$('#bval',work).value=BX[v('bfmt')];this.preview();});
  setTimeout(()=>this.preview(),0);return el;},
 o(){return {format:v('bfmt'),width:+v('bw')||2,height:+v('bh')||100,displayValue:$('#btxt',work).checked,lineColor:v('bfg'),background:v('bbg'),margin:10,font:'monospace',fontSize:+v('bfs')||20,valid:ok=>{this.ok=ok;}};},
 draw(target,val,sc=1){this.ok=true;const o=this.o();if(sc>1){o.width*=sc;o.height*=sc;o.fontSize*=sc;o.margin*=sc;}window.JsBarcode(target,val??v('bval'),o);return this.ok;},
 preview(){const s=$('#bprev',work);if(!s)return;try{const ok=this.draw(s);$('#binfo',work).textContent=ok?'':T.o_binvalid;s.style.display=ok?'':'none';}catch(e){$('#binfo',work).textContent=T.o_binvalid;s.style.display='none';}},
 async run(){const sc=+v('bscale')||1;const lines=(v('bbulk')||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const vals=lines.length?lines:[v('bval')];const items=[],bad=[];const fm=v('bfmt').toLowerCase();
  for(const [i,val] of vals.entries()){const c=document.createElement('canvas');let ok;try{ok=this.draw(c,val,sc);}catch(e){ok=false;}if(!ok){bad.push(val);continue;}
   const s=document.createElementNS('http://www.w3.org/2000/svg','svg');this.draw(s,val);const nm=vals.length>1?`barcode-${fm}-${String(i+1).padStart(3,'0')}-${val.replace(/[^\w-]+/g,'_').slice(0,40)}`:'barcode-'+fm;
   items.push({name:nm+'.png',blob:await toBlob(c,'image/png')});items.push({name:nm+'.svg',blob:new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(s)],{type:'image/svg+xml'})});}
  if(!items.length)throw new Error(T.o_binvalid);
  if(vals.length===1)return {name:items[0].name,blob:items[0].blob,extra:[{name:items[1].name,label:'SVG',blob:items[1].blob}]};
  const r=await zipOrOne(items,'barcodes-'+fm+'.zip');return {...r,info:`${items.length/2} barcodes (PNG + SVG)`+(bad.length?` – ${bad.length} invalid skipped: ${bad.slice(0,5).join(', ')}`:'')};}};
