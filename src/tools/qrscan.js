// @needs img
// QR / barcode scanner: images or live camera. jsQR (Apache-2.0) for QR; the browser's BarcodeDetector (where available) adds 1D barcodes
TOOLS.qrscan={goLabel:()=>T.o_sdownload,
 async setup(){this.found=[];const el=document.createElement('div');
  el.innerHTML=`<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><label class="btn">🖼️ ${esc(T.o_sfile)}<input id="sfile" type="file" accept="image/*,.heic,.heif" multiple hidden></label><button type="button" class="btn ghost" id="scam">📷 ${esc(T.o_scamera)}</button></div>
  <video id="svid" playsinline muted style="display:none;width:100%;max-width:480px;margin:12px auto;border-radius:12px"></video><p class="hint" id="sinfo" style="text-align:center">${esc(T.o_shint)} You can also paste a screenshot (Ctrl+V / ⌘V).</p><ul class="links" id="sres"></ul>`;
  $('#sfile',el).onchange=e=>{this.pending=this.scanFiles([...e.target.files]);};if(!this.pasteBound){this.pasteBound=1;document.addEventListener('paste',e=>{const fs=[...(e.clipboardData?.files||[])].filter(f=>/^image\//.test(f.type));if(fs.length&&document.getElementById('sres')){e.preventDefault();this.pending=this.scanFiles(fs);}});}$('#scam',el).onclick=()=>this.camera(el);return el;},
 add(text,fmt){if(!text||this.found.some(f=>f.text===text))return;this.found.push({text,fmt});const li=document.createElement('li');const url=/^(https?:\/\/|mailto:|tel:)/i.test(text);
  li.innerHTML=`<small>${esc(fmt)}</small> ${url?`<a href="${esc(text)}" target="_blank" rel="noopener nofollow">${esc(text)}</a>`:`<code style="white-space:pre-wrap;word-break:break-all">${esc(text)}</code>`} <button type="button" class="btn ghost" style="padding:2px 8px">${esc(T.o_scopy)}</button>`;
  li.querySelector('button').onclick=()=>navigator.clipboard?.writeText(text);$('#sres',work).appendChild(li);$('#sinfo',work).textContent=`${this.found.length} ${T.o_sfound}`;},
 async decode(c){const out=[];if('BarcodeDetector' in window){try{const bd=new BarcodeDetector();for(const b of await bd.detect(c))out.push([b.rawValue,b.format]);}catch(e){}}
  if(!out.length){await load('jsQR.js');for(const s of [1,.5,.25]){const w=Math.round(c.width*s),h=Math.round(c.height*s);if(w<60)break;const t=newCanvas(w,h);t.getContext('2d').drawImage(c,0,0,w,h);const id=t.getContext('2d').getImageData(0,0,w,h);const r=window.jsQR(id.data,w,h,{inversionAttempts:'attemptBoth'});if(r){out.push([r.data,'qr_code']);break;}}}
  return out;},
 async scanFiles(fs){let n=0;$('#sinfo',work).textContent=T.working;for(const f of fs){const c0=await fileToCanvas(f);const sc=Math.min(1,1600/Math.max(c0.width,c0.height));const c=newCanvas(c0.width*sc,c0.height*sc);c.getContext('2d').drawImage(c0,0,0,c.width,c.height);for(const [t,fm] of await this.decode(c)){this.add(t,fm);n++;}}
  if(!n)$('#sinfo',work).textContent=T.o_snone;},
 async camera(el){const vd=$('#svid',el);if(this.stream){this.stream.getTracks().forEach(t=>t.stop());this.stream=null;vd.style.display='none';return;}
  try{this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});}catch(e){$('#sinfo',el).textContent=T.o_snocam;return;}
  vd.srcObject=this.stream;vd.style.display='block';await vd.play();const c=document.createElement('canvas');
  const tick=async()=>{if(!this.stream)return;if(vd.videoWidth){c.width=vd.videoWidth;c.height=vd.videoHeight;c.getContext('2d').drawImage(vd,0,0);for(const [t,fm] of await this.decode(c))this.add(t,fm);}setTimeout(tick,250);};tick();},
 async run(){if(this.pending)await this.pending;if(!this.found.length)throw new Error(T.o_snone);
  return {name:'scan-results.txt',blob:new Blob([this.found.map(f=>`[${f.fmt}] ${f.text}`).join('\n\n')+'\n'],{type:'text/plain'}),extra:[{name:'scan-results.csv',label:'CSV',blob:new Blob(['\ufeffformat,content\n'+this.found.map(f=>[f.fmt,f.text].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n')+'\n'],{type:'text/csv'})}],info:`${this.found.length} ${T.o_sfound}`};}};
