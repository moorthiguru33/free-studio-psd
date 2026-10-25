// Fill PDF forms in the page itself: pages are rendered with PDF.js and live inputs are laid exactly over each AcroForm widget
// (text, multiline, checkbox, radio, dropdown, list). Non-fillable PDFs: blanks (____ / ..... runs) are auto-detected and turned into
// fields, and you can click anywhere to add a text box. Output keeps real, editable form fields (or flattens on request).
// vars.mode='create' (Form creator): output adds the detected/added boxes as real fillable fields instead of filled text.
TOOLS.formfill={maxFiles:1,noAdv:true,opts(){return chk('ffauto',T.o_ffAuto||'Auto-detect blank lines (____) as fields',true)+chk('ffflat',T.o_ffFlat||'Flatten (make answers non-editable)',false)+`<p class="hint">${esc(T.o_ffHint||'Click on a field to type. Click any empty spot on a page to add your own text box.')}</p>`;},
 async setup(files){const box=$('.custom',work);if(!box)return;box.innerHTML=`<p class="hint">${esc(T.working)}</p>`;const pj=await openPdfjs(await buf(files[0]));this._pj=pj;this._extra=[];const wrap=document.createElement('div');wrap.className='ffwrap';const self=this;let nf=0;
  const W=Math.min(900,(box.clientWidth||800));
  for(let i=1;i<=pj.numPages;i++){const pg=await pj.getPage(i);const vp0=pg.getViewport({scale:1});const sc=W/vp0.width;const vp=pg.getViewport({scale:sc});const c=document.createElement('canvas');c.width=vp.width*devicePixelRatio;c.height=vp.height*devicePixelRatio;await pg.render({canvasContext:c.getContext('2d'),viewport:pg.getViewport({scale:sc*devicePixelRatio}),annotationMode:0}).promise;
   c.style.width=vp.width+'px';const pd=document.createElement('div');pd.className='ffpage';pd.style.width=vp.width+'px';pd.style.height=vp.height+'px';pd.dataset.p=i;pd.append(c);
   const anns=await pg.getAnnotations();const pos=r=>{const [x1,y1,x2,y2]=vp.convertToViewportRectangle(r);return `left:${Math.min(x1,x2)}px;top:${Math.min(y1,y2)}px;width:${Math.abs(x2-x1)}px;height:${Math.abs(y2-y1)}px`;};
   for(const a of anns){if(a.subtype!=='Widget'||!a.fieldName||a.readOnly)continue;let el;const nm=a.fieldName;
    if(a.checkBox){el=document.createElement('input');el.type='checkbox';el.checked=a.fieldValue&&a.fieldValue!=='Off';}
    else if(a.radioButton){el=document.createElement('input');el.type='radio';el.name='r_'+nm;el.value=a.buttonValue;el.checked=a.fieldValue===a.buttonValue;}
    else if(a.fieldType==='Ch'){el=document.createElement('select');if(a.multiSelect)el.multiple=true;for(const o of a.options||[]){const op=document.createElement('option');op.value=o.exportValue??o.displayValue;op.textContent=o.displayValue;el.append(op);}el.value=Array.isArray(a.fieldValue)?a.fieldValue[0]:a.fieldValue||'';}
    else if(a.fieldType==='Tx'){el=document.createElement(a.multiLine?'textarea':'input');el.value=a.fieldValue||'';if(a.maxLen)el.maxLength=a.maxLen;}else continue;
    el.className='fff';el.dataset.name=nm;el.dataset.kind=a.checkBox?'cb':a.radioButton?'rb':a.fieldType;el.style.cssText='position:absolute;'+pos(a.rect);el.title=a.alternativeText||nm;pd.append(el);nf++;}
   if(!nf||vb('ffauto')){const tc=await pg.getTextContent();for(const it of tc.items){const m=/(_{4,}|\.{6,}|…{3,})/.exec(it.str||'');if(!m)continue;const ch=it.width/Math.max(1,it.str.length);const x=it.transform[4]+ch*m.index,y=it.transform[5],w=ch*m[0].length,h=Math.max(10,Math.abs(it.transform[3])*1.2);
     if(anns.some(a=>a.subtype==='Widget'&&a.rect[0]<x+w&&a.rect[2]>x&&a.rect[1]<y+h&&a.rect[3]>y))continue;self._addBox(pd,i,vp,[x,y-2,x+w,y+h-2],'');}}
   pd.addEventListener('click',e=>{if(e.target!==c)return;const r=c.getBoundingClientRect();const [px,py]=vp.convertToPdfPoint(e.clientX-r.left,e.clientY-r.top);const el=self._addBox(pd,i,vp,[px,py-6,px+160,py+10],'');el.focus();});
   wrap.append(pd);}
  box.innerHTML='';const info=document.createElement('p');info.className='hint';info.textContent=nf?`${nf} ${T.o_ffFound||'form fields found — fill them in on the page below.'}`:(T.o_ffNone||'No fillable fields in this PDF — blanks were auto-detected; click anywhere to add text.');box.append(info,wrap);},
 _addBox(pd,i,vp,rect,val){const [x1,y1,x2,y2]=vp.convertToViewportRectangle(rect);const el=document.createElement('input');el.className='fff ffx';el.value=val;el.dataset.p=i;el.dataset.rect=JSON.stringify(rect);el.style.cssText=`position:absolute;left:${Math.min(x1,x2)}px;top:${Math.min(y1,y2)}px;width:${Math.abs(x2-x1)}px;height:${Math.abs(y2-y1)}px`;
  el.addEventListener('keydown',e=>{if((e.key==='Backspace'||e.key==='Delete')&&!el.value&&el.classList.contains('ffx')){el.remove();}});pd.append(el);return el;},
 async run([f],status){const {PDFDocument,StandardFonts,rgb}=await L.pdflib();const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true});const form=d.getForm();const create=(this.vars||{}).mode==='create';let filled=0,added=0;
  const els=[...work.querySelectorAll('.fff')];const font=await d.embedFont(StandardFonts.Helvetica);const fix=s=>s.replace(/[^\x20-\x7E\xA0-\xFF\n]/g,'?');
  for(const el of els.filter(e=>!e.classList.contains('ffx'))){let fld;try{fld=form.getField(el.dataset.name);}catch(e){continue;}const k=el.dataset.kind;try{
    if(k==='cb'){el.checked?fld.check():fld.uncheck();filled+=el.checked;}else if(k==='rb'){if(el.checked){fld.select(el.value);filled++;}}
    else if(k==='Ch'){const vals=el.multiple?[...el.selectedOptions].map(o=>o.value):[el.value];if(vals[0]){fld.select(el.multiple?vals:vals[0]);filled++;}}
    else{if(el.value!==(fld.getText()||'')){fld.setText(fix(el.value));}if(el.value)filled++;}}catch(e){}}
  const pages=d.getPages();let k=0;for(const el of els.filter(e=>e.classList.contains('ffx'))){const p=pages[+el.dataset.p-1];const [x1,y1,x2,y2]=JSON.parse(el.dataset.rect);const h=y2-y1;
   if(create){const tf=form.createTextField(`field_${el.dataset.p}_${++k}`);if(el.value)tf.setText(fix(el.value));tf.addToPage(p,{x:x1,y:y1,width:x2-x1,height:h,borderWidth:0,font});added++;}
   else if(el.value){p.drawText(fix(el.value),{x:x1+2,y:y1+h*.25,size:Math.min(12,h*.75),font,color:rgb(0,0,.4)});added++;}}
  try{form.updateFieldAppearances(font);}catch(e){}if(vb('ffflat'))form.flatten();
  return {blob:pdfBlob(await d.save()),name:base(f.name)+(create?'-fillable.pdf':'-filled.pdf'),info:create?`${added} new fillable field(s) created`:`${filled} field(s) filled${added?`, ${added} text box(es) added`:''}`};}};
