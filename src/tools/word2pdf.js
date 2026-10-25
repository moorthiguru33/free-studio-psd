// @needs pdfx
TOOLS.word2pdf={async run(files,status){if(files.length===1)return this.run1(files[0]);const items=[];let k=0;for(const f of files){status(`${T.working} ${++k}/${files.length}`);const r=await this.run1(f);items.push({name:r.name,blob:r.blob});}return {blob:await zipBlobs(items),name:'word-to-pdf.zip',links:items,info:items.length+' PDFs'};},
 async run1(f){const ab=await buf(f);const html=(/\.doc$/i.test(f.name)||new Uint32Array(ab.slice(0,4))[0]===0xE011CFD0)?docHtml(ab):(await (await L.mammoth()).convertToHtml({arrayBuffer:ab})).value;const {PDFDocument,StandardFonts,rgb}=await L.pdflib();const d=await PDFDocument.create();
   const F={r:await d.embedFont(StandardFonts.Helvetica),b:await d.embedFont(StandardFonts.HelveticaBold),i:await d.embedFont(StandardFonts.HelveticaOblique),bi:await d.embedFont(StandardFonts.HelveticaBoldOblique)};const safe=mkSafe(F.r);
   const W=595.28,H=841.89,M=56;let page=d.addPage([W,H]),y=H-M;const newPage=()=>{page=d.addPage([W,H]);y=H-M;};
   const dom=new DOMParser().parseFromString(`<div>${html}</div>`,'text/html').body.firstChild;
   const runs=(node,st={b:false,i:false},acc=[])=>{for(const n of node.childNodes){if(n.nodeType===3)acc.push({t:n.textContent,...st});else if(n.nodeType===1){const tg=n.tagName;if(tg==='BR'){acc.push({br:true});continue;}runs(n,{b:st.b||tg==='STRONG'||tg==='B',i:st.i||tg==='EM'||tg==='I'},acc);}}return acc;};
   const block=(el,size,indent,prefix,forceBold)=>{const rs=runs(el);if(prefix)rs.unshift({t:prefix,b:false,i:false});const lh=size*1.35;const maxW=W-2*M-indent;let line=[],lw=0;
    const flush=()=>{if(y-lh<M)newPage();y-=lh;let x=M+indent;for(const w of line){page.drawText(w.t,{x,y,size,font:w.f,color:rgb(.1,.1,.1)});x+=w.f.widthOfTextAtSize(w.t,size);}line=[];lw=0;};
    for(const r of rs){if(r.br){flush();continue;}const f=F[(r.b||forceBold?'b':'')+(r.i?'i':'')||'r'];for(const tok of safe(r.t).split(/(\s+)/)){if(!tok)continue;const t=/^\s+$/.test(tok)?' ':tok;const tw=f.widthOfTextAtSize(t,size);if(lw+tw>maxW&&line.length&&t!==' '){flush();}if(!line.length&&t===' ')continue;line.push({t,f});lw+=tw;}}
    if(line.length)flush();y-=size*0.5;};
   const walk=(node,depth=0)=>{for(const el of node.children){const tg=el.tagName;if(/^H[1-6]$/.test(tg)){const s=[22,18,15,13,12,11][+tg[1]-1];y-=s*0.4;block(el,s,0,'',true);}else if(tg==='P')block(el,11,0,'');else if(tg==='UL'||tg==='OL'){let k=1;for(const li of el.children){const sub=[...li.children].filter(c=>c.tagName==='UL'||c.tagName==='OL');sub.forEach(s=>s.remove());block(li,11,18+depth*18,tg==='OL'?`${k++}. `:'• ');sub.forEach(s=>walk({children:[s]},depth+1));}}else if(tg==='TABLE'){for(const tr of el.querySelectorAll('tr')){const p=document.createElement('p');p.textContent=[...tr.children].map(c=>c.textContent.trim()).join('   |   ');block(p,10,0,'');}}else walk(el,depth);}};
   walk(dom);return {blob:pdfBlob(await d.save()),name:base(f.name)+'.pdf'};}};
TOOLS.word2pdf.run1=async function(f){const ab=await buf(f);const html=(/\.doc$/i.test(f.name)||new Uint32Array(ab.slice(0,4))[0]===0xE011CFD0)?docHtml(ab):(await (await L.mammoth()).convertToHtml({arrayBuffer:ab})).value;const {PDFDocument,rgb}=await L.pdflib();const d=await PDFDocument.create();
 const W=595.28,H=841.89,M=56;let page=d.addPage([W,H]),y=H-M;const newPage=()=>{page=d.addPage([W,H]);y=H-M;};
 const dom=new DOMParser().parseFromString(`<div>${html}</div>`,'text/html').body.firstChild;
 const runsOf=(node,st={b:false},acc=[])=>{for(const n of node.childNodes){if(n.nodeType===3)acc.push({t:n.textContent,...st});else if(n.nodeType===1){if(n.tagName==='BR'){acc.push({br:true});continue;}if(n.tagName==='IMG')continue;runsOf(n,{b:st.b||n.tagName==='STRONG'||n.tagName==='B'},acc);}}return acc;};
 const block=async(el,size,indent,prefix,forceBold)=>{const rs=runsOf(el);if(prefix)rs.unshift({t:prefix,b:false});const lh=size*1.45;const maxW=W-2*M-indent;let line=[],lw=0;
  const flush=()=>{if(y-lh<M)newPage();y-=lh;let x=M+indent;for(const w of line){drawRuns(page,w.runs,{x,y,size,color:rgb(.1,.1,.1)});x+=w.w;}line=[];lw=0;};
  for(const r of rs){if(r.br){flush();continue;}for(const tok of r.t.split(/(\s+)/)){if(!tok)continue;const t=/^\s+$/.test(tok)?' ':tok;if(!line.length&&t===' ')continue;const runs=await textRuns(d,t,r.b||forceBold);const tw=runsWidth(runs,size);if(lw+tw>maxW&&line.length&&t!==' ')flush();if(!line.length&&t===' ')continue;line.push({runs,w:tw});lw+=tw;}}
  if(line.length)flush();y-=size*0.5;};
 const walk=async(node,depth=0)=>{for(const el of [...node.children]){const tg=el.tagName;if(/^H[1-6]$/.test(tg)){const s=[22,18,15,13,12,11][+tg[1]-1];y-=s*0.4;await block(el,s,0,'',true);}else if(tg==='P')await block(el,11,0,'');
  else if(tg==='UL'||tg==='OL'){let k=1;for(const li of [...el.children]){const sub=[...li.children].filter(c=>c.tagName==='UL'||c.tagName==='OL');sub.forEach(s=>s.remove());await block(li,11,18+depth*18,tg==='OL'?`${k++}. `:'• ');for(const s of sub)await walk({children:[s]},depth+1);}}
  else if(tg==='TABLE'){for(const tr of el.querySelectorAll('tr')){const p=document.createElement('p');p.textContent=[...tr.children].map(c=>c.textContent.trim()).join('   |   ');await block(p,10,0,'');}}else await walk(el,depth);}};
 await walk(dom);return {blob:pdfBlob(await d.save()),name:base(f.name)+'.pdf'};};

function cfbStreams(ab){const dv=new DataView(ab),u8=new Uint8Array(ab);if(dv.getUint32(0,true)!==0xE011CFD0)throw new Error('Not a Word 97-2003 .doc file');
 const ss=1<<dv.getUint16(30,true),nFat=dv.getUint32(44,true),dirS=dv.getUint32(48,true),cut=dv.getUint32(56,true),mfS=dv.getUint32(60,true);let difS=dv.getUint32(68,true);
 const off=s=>(s+1)*ss;const fatSecs=[];for(let i=0;i<109&&fatSecs.length<nFat;i++)fatSecs.push(dv.getUint32(76+i*4,true));
 while(fatSecs.length<nFat&&difS<0xFFFFFFFA){for(let i=0;i<ss/4-1&&fatSecs.length<nFat;i++)fatSecs.push(dv.getUint32(off(difS)+i*4,true));difS=dv.getUint32(off(difS)+ss-4,true);}
 const fat=[];for(const fs of fatSecs)for(let i=0;i<ss/4;i++)fat.push(dv.getUint32(off(fs)+i*4,true));
 const chain=(s,t)=>{const r=[];let g=0;while(s<0xFFFFFFFA&&g++<1e6){r.push(s);s=t[s];}return r;};
 const read=s=>{const c=chain(s,fat),o=new Uint8Array(c.length*ss);c.forEach((x,i)=>o.set(u8.subarray(off(x),off(x)+ss),i*ss));return o;};
 const dir=read(dirS),dd=new DataView(dir.buffer),ents=[];for(let i=0;i+128<=dir.length;i+=128){const nl=dd.getUint16(i+64,true);let n='';for(let j=0;j<nl/2-1;j++)n+=String.fromCharCode(dd.getUint16(i+j*2,true));ents.push({n,t:dir[i+66],s:dd.getUint32(i+116,true),z:dd.getUint32(i+120,true)});}
 const root=ents[0],mini=root.s<0xFFFFFFFA?read(root.s):new Uint8Array(0);const mf=[];if(mfS<0xFFFFFFFA){const m=read(mfS),md=new DataView(m.buffer);for(let i=0;i<m.length/4;i++)mf.push(md.getUint32(i*4,true));}
 const get=name=>{const e=ents.find(x=>x.n===name&&x.t===2);if(!e)return null;if(e.z<cut){const c=chain(e.s,mf),o=new Uint8Array(c.length*64);c.forEach((x,i)=>o.set(mini.subarray(x*64,x*64+64),i*64));return o.subarray(0,e.z);}return read(e.s).subarray(0,e.z);};
 return get;}
function docHtml(ab){const get=cfbStreams(ab),wd=get('WordDocument');if(!wd)throw new Error('No WordDocument stream – not a Word .doc file');const w=new DataView(wd.buffer,wd.byteOffset,wd.byteLength);
 if(w.getUint16(0xB,true)&1)throw new Error('This .doc is encrypted – open it in Word and save without a password first');
 const tbl=get((w.getUint16(0xA,true)&0x0200)?'1Table':'0Table');const ccp=w.getUint32(0x4C,true),fcClx=w.getUint32(0x1A2,true),lcb=w.getUint32(0x1A6,true);
 let txt='';const cp1252=new TextDecoder('windows-1252'),u16=new TextDecoder('utf-16le');
 if(tbl&&lcb){const t=new DataView(tbl.buffer,tbl.byteOffset,tbl.byteLength);let i=fcClx;while(tbl[i]===1)i+=3+t.getUint16(i+1,true);
  if(tbl[i]===2){const L=t.getUint32(i+1,true),b=i+5,n=(L-4)/12;for(let k=0;k<n;k++){const c0=t.getUint32(b+k*4,true),c1=t.getUint32(b+(k+1)*4,true);let fc=t.getUint32(b+(n+1)*4+k*8+2,true);const comp=fc&0x40000000;
   if(comp){fc=(fc&0x3FFFFFFF)/2;txt+=cp1252.decode(wd.subarray(fc,fc+c1-c0));}else txt+=u16.decode(wd.subarray(fc,fc+2*(c1-c0)));if(txt.length>=ccp)break;}}}
 if(!txt){const fcMin=w.getUint32(0x18,true);txt=cp1252.decode(wd.subarray(fcMin,fcMin+ccp));}
 txt=txt.slice(0,ccp).replace(/\x13[^\x13\x14\x15]*\x14/g,'').replace(/\x13[^\x13\x14\x15]*\x15/g,'').replace(/[\x13\x14\x15]/g,'').replace(/\x07\r?/g,'\t').replace(/[\x0b]/g,'\n').replace(/\x0c/g,'\r').replace(/[\x00-\x08\x0e-\x1f\x01]/g,'');
 const e=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;');return txt.split('\r').map(p=>`<p>${e(p).replace(/\n/g,'<br>')}</p>`).join('');}
