// Simple HTML -> PDF flow layout (headings, paragraphs, lists, quotes, code, tables, hr) with multi-script Noto text. Needs pdfx.
const PSZ={a4:[595.28,841.89],letter:[612,792],legal:[612,1008],a3:[841.89,1190.55],a5:[419.53,595.28]};
async function htmlToPdf(html,{size='a4',margin=56,base=11,title}={}){const {PDFDocument,rgb,StandardFonts}=await L.pdflib();const d=await PDFDocument.create();if(title)d.setTitle(title);d.setProducer('FreePDF');
 const [W,H]=PSZ[size]||PSZ.a4,M=margin;let page=d.addPage([W,H]),y=H-M;const newPage=()=>{page=d.addPage([W,H]);y=H-M;};const mono=await d.embedFont(StandardFonts.Courier);
 const dom=new DOMParser().parseFromString(`<div>${html}</div>`,'text/html').body.firstChild;
 const runsOf=(node,st={b:false,c:false},acc=[])=>{for(const n of node.childNodes){if(n.nodeType===3)acc.push({t:n.textContent,...st});else if(n.nodeType===1){const tg=n.tagName;if(tg==='BR'){acc.push({br:true});continue;}if(tg==='IMG'){if(n.alt)acc.push({t:`[${n.alt}]`,...st});continue;}if(/^(UL|OL)$/.test(tg))continue;runsOf(n,{b:st.b||tg==='STRONG'||tg==='B'||tg==='TH',c:st.c||tg==='CODE',a:st.a||tg==='A'},acc);}}return acc;};
 const block=async(el,size,indent,{prefix='',bold=false,color=rgb(.1,.1,.1),bar=false,rs}={})=>{rs=rs||runsOf(el);if(prefix)rs.unshift({t:prefix});const lh=size*1.45;const maxW=W-2*M-indent;let line=[],lw=0;
  const flush=()=>{if(y-lh<M)newPage();y-=lh;let x=M+indent;if(bar)page.drawRectangle({x:M+indent-10,y:y-size*.3,width:3,height:lh,color:rgb(.8,.8,.8)});for(const w of line){drawRuns(page,w.runs,{x,y,size,color:w.a?rgb(.1,.3,.8):color});x+=w.w;}line=[];lw=0;};
  for(const r of rs){if(r.br){flush();continue;}for(const tok of String(r.t).split(/(\s+)/)){if(!tok)continue;const t=/^\s+$/.test(tok)?' ':tok;if(!line.length&&t===' ')continue;
   let runs;if(r.c&&/^[\x20-\x7e]+$/.test(t))runs=[{t,font:mono}];else runs=await textRuns(d,t,r.b||bold);let tw=runsWidth(runs,size);
   if(tw>maxW){// hard-wrap very long words
    for(const ch of [...t]){const cr=r.c&&/[\x20-\x7e]/.test(ch)?[{t:ch,font:mono}]:await textRuns(d,ch,r.b||bold);const cw=runsWidth(cr,size);if(lw+cw>maxW&&line.length)flush();line.push({runs:cr,w:cw,a:r.a});lw+=cw;}continue;}
   if(lw+tw>maxW&&line.length&&t!==' ')flush();if(!line.length&&t===' ')continue;line.push({runs,w:tw,a:r.a});lw+=tw;}}
  if(line.length)flush();y-=size*0.5;};
 const pre=async(el,size)=>{const lh=size*1.3;for(const ln of el.textContent.replace(/\n$/,'').split('\n')){if(y-lh<M)newPage();y-=lh;page.drawRectangle({x:M-4,y:y-size*.35,width:W-2*M+8,height:lh,color:rgb(.95,.95,.96)});
  let x=M;for(const seg of ln.replace(/\t/g,'    ').match(/[\x20-\x7e]+|[^\x20-\x7e]+/g)||[]){const runs=/^[\x20-\x7e]+$/.test(seg)?[{t:seg,font:mono}]:await textRuns(d,seg);drawRuns(page,runs,{x,y,size,color:rgb(.15,.15,.15)});x+=runsWidth(runs,size);}}y-=size*.6;};
 const walk=async(node,depth=0)=>{for(const el of [...node.children]){const tg=el.tagName;{const im=tg==='IMG'?el:(!el.textContent.trim()&&el.querySelector&&el.querySelector('img'));if(im&&/^data:image\/(png|jpe?g)/i.test(im.getAttribute('src')||'')){try{const src=im.getAttribute('src');const b=Uint8Array.from(atob(src.split(',')[1]),c=>c.charCodeAt(0));const e=/png/i.test(src.slice(0,20))?await d.embedPng(b):await d.embedJpg(b);const cw=W-2*M;let w=Math.min(cw,e.width*.75),h=e.height*w/e.width;if(h>H-2*M){h=H-2*M;w=e.width*h/e.height;}if(y-h<M)newPage();y-=h;page.drawImage(e,{x:M+(cw-w)/2,y,width:w,height:h});y-=base*.6;}catch(err){}continue;}}
  if(/^H[1-6]$/.test(tg)){const s=[base*2,base*1.6,base*1.35,base*1.15,base*1.05,base][+tg[1]-1];y-=s*0.5;if(y-s*2<M)newPage();await block(el,s,0,{bold:true});if(tg==='H1'||tg==='H2'){page.drawLine({start:{x:M,y:y+s*.3},end:{x:W-M,y:y+s*.3},thickness:.5,color:rgb(.85,.85,.85)});}}
  else if(tg==='P')await block(el,base,0);
  else if(tg==='UL'||tg==='OL'){let k=+(el.getAttribute('start')||1);for(const li of [...el.children]){const sub=[...li.children].filter(c=>c.tagName==='UL'||c.tagName==='OL');const cb=li.querySelector('input[type=checkbox]');await block(li,base,18+depth*18,{prefix:tg==='OL'?`${k++}. `:cb?(cb.checked?'☑ ':'☐ '):'• '});y+=base*.35;for(const s of sub)await walk({children:[s]},depth+1);}y-=base*.3;}
  else if(tg==='BLOCKQUOTE'){for(const c of [...el.children])await block(c,base,14,{color:rgb(.35,.35,.35),bar:true});if(!el.children.length)await block(el,base,14,{bar:true});}
  else if(tg==='PRE')await pre(el,base*.85);
  else if(tg==='HR'){y-=base*.6;page.drawLine({start:{x:M,y},end:{x:W-M,y},thickness:.75,color:rgb(.75,.75,.75)});y-=base*.6;}
  else if(tg==='TABLE'){const rows=[...el.querySelectorAll('tr')];const nc=Math.max(...rows.map(r=>r.children.length));const cw=(W-2*M)/nc;const sz=base*.9;
   for(const tr of rows){const cells=[...tr.children];let hmax=sz*1.6;const lay=[];for(const c of cells){const runs=await textRuns(d,c.textContent.trim(),c.tagName==='TH');let words=[];// wrap within the cell
     const parts=c.textContent.trim().split(/\s+/);let cur='',lines=[];for(const p of parts){const t=cur?cur+' '+p:p;if(runsWidth(await textRuns(d,t,c.tagName==='TH'),sz)>cw-8&&cur){lines.push(cur);cur=p;}else cur=t;}if(cur)lines.push(cur);lay.push({lines,b:c.tagName==='TH'});hmax=Math.max(hmax,lines.length*sz*1.3+sz*.6);}
    if(y-hmax<M)newPage();cells.forEach((c,i)=>{page.drawRectangle({x:M+i*cw,y:y-hmax,width:cw,height:hmax,borderColor:rgb(.7,.7,.7),borderWidth:.5,color:lay[i].b?rgb(.94,.95,.97):undefined});});
    for(const [i,l] of lay.entries()){let yy=y-sz*1.2;for(const ln of l.lines){drawRuns(page,await textRuns(d,ln,l.b),{x:M+i*cw+4,y:yy,size:sz,color:rgb(.1,.1,.1)});yy-=sz*1.3;}}y-=hmax;}y-=base*.6;}
  else if(el.children.length&&![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))await walk(el,depth);
  else if(el.textContent.trim())await block(el,base,0);}};
 await walk(dom);return d;}
