// @needs pdfx htmlpdf
// Convert anything to PDF, in a batch: PDF, images (JPG/PNG/WebP/GIF/BMP/AVIF/SVG), Word (DOCX), OpenDocument text (ODT),
// spreadsheets (XLSX/XLS/ODS/CSV/TSV -> real tables, one section per sheet), TXT/Markdown/HTML, and ZIP archives (unpacked, every supported file inside).
// Output: one combined PDF (with a bookmark per source file) or one PDF per file. vars.only narrows accepted types for landing pages.
const AX=n=>(n.match(/\.([^.\/]+)$/)||[,''])[1].toLowerCase();const EH=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function odtHtml(ab){const z=await (await L.zip()).loadAsync(ab);const x=await z.file('content.xml')?.async('string');if(!x)throw new Error('not an ODF document');const dom=new DOMParser().parseFromString(x,'application/xml');const body=dom.getElementsByTagName('office:text')[0]||dom.documentElement;
 const walk=n=>{let h='';for(const c of n.childNodes){if(c.nodeType===3){h+=EH(c.textContent);continue;}if(c.nodeType!==1)continue;const t=c.nodeName;
  if(t==='text:h'){const l=Math.min(3,+c.getAttribute('text:outline-level')||1);h+=`<h${l}>${walk(c)}</h${l}>`;}else if(t==='text:p')h+=`<p>${walk(c)||'&nbsp;'}</p>`;else if(t==='text:list')h+=`<ul>${walk(c)}</ul>`;else if(t==='text:list-item')h+=`<li>${walk(c).replace(/<\/?p>/g,'')}</li>`;
  else if(t==='table:table')h+=`<table>${walk(c)}</table>`;else if(t==='table:table-row')h+=`<tr>${walk(c)}</tr>`;else if(t==='table:table-cell')h+=`<td>${walk(c).replace(/<\/?p>/g,' ')}</td>`;else if(t==='text:s')h+=' ';else if(t==='text:tab')h+='    ';else if(t==='text:line-break')h+='<br>';else h+=walk(c);}return h;};return walk(body);}
async function sheetHtml(f){await load('xlsx.full.min.js');const X=window.XLSX;const e=AX(f.name);const wb=e==='csv'||e==='tsv'?X.read(await f.text(),{type:'string',FS:e==='tsv'?'\t':undefined}):X.read(await buf(f),{cellDates:true});let h='';
 for(const n of wb.SheetNames){const rows=X.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:false,defval:''}).filter(r=>r.some(c=>String(c).trim()));if(!rows.length)continue;const w=Math.max(...rows.map(r=>r.length));
  if(wb.SheetNames.length>1)h+=`<h2>${EH(n)}</h2>`;for(let i=0;i<rows.length;i+=400){h+=`<table>${rows.slice(i,i+400).map((r,j)=>`<tr>${Array.from({length:w},(_,k)=>{const t=i+j===0?'th':'td';return `<${t}>${EH(r[k]??'')}</${t}>`;}).join('')}</tr>`).join('')}</table>`;}}return h||'<p>(empty)</p>';}
async function imgPdf(d,blob,name){const u=URL.createObjectURL(blob);try{const I=new Image();await new Promise((ok,ko)=>{I.onload=ok;I.onerror=()=>ko(new Error(name+': unsupported image'));I.src=u;});const c=document.createElement('canvas');c.width=I.naturalWidth||800;c.height=I.naturalHeight||600;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(I,0,0,c.width,c.height);
 const png=/png|gif|svg/.test(blob.type||AX(name));const b=new Uint8Array(await (await toBlob(c,png?'image/png':'image/jpeg',.92)).arrayBuffer());const im=png?await d.embedPng(b):await d.embedJpg(b);const [W,H]=c.width>c.height?[841.89,595.28]:[595.28,841.89];const s=Math.min((W-40)/c.width,(H-40)/c.height,1);const p=d.addPage([W,H]);p.drawImage(im,{x:(W-c.width*s)/2,y:(H-c.height*s)/2,width:c.width*s,height:c.height*s});}finally{URL.revokeObjectURL(u);}}
async function onePdf(f){const {PDFDocument}=await L.pdflib();const e=AX(f.name);const H=(h,o={})=>htmlToPdf(h,{size:v('apsize'),title:base(f.name),...o});
 if(e==='pdf')return PDFDocument.load(await buf(f),{ignoreEncryption:true});
 if(/^(jpe?g|png|webp|gif|bmp|avif|svg|ico)$/.test(e)){const d=await PDFDocument.create();await imgPdf(d,e==='svg'?new Blob([await f.text()],{type:'image/svg+xml'}):f,f.name);return d;}
 if(e==='docx'){const m=await L.mammoth();return H((await m.convertToHtml({arrayBuffer:await buf(f)})).value);}
 if(e==='odt'||e==='ott')return H(await odtHtml(await buf(f)));
 if(/^(xlsx|xls|ods|csv|tsv)$/.test(e))return H(await sheetHtml(f),{base:9,margin:36});
 if(e==='md'||e==='markdown'){const t=await f.text();const md=t.split('\n').map(l=>/^#{1,3}\s/.test(l)?`<h${l.match(/^#+/)[0].length}>${EH(l.replace(/^#+\s*/,''))}</h${l.match(/^#+/)[0].length}>`:/^\s*[-*]\s/.test(l)?`<ul><li>${EH(l.replace(/^\s*[-*]\s/,''))}</li></ul>`:l.trim()?`<p>${EH(l)}</p>`:'').join('');return H(md);}
 if(e==='html'||e==='htm'){const dom=new DOMParser().parseFromString(await f.text(),'text/html');dom.querySelectorAll('script,style,nav,footer').forEach(x=>x.remove());return H(dom.body.innerHTML);}
 if(/^(txt|log|json|xml|js|css|py|java|c|cpp|ts|ini|yml|yaml|srt|vtt)$/.test(e)||!e)return H(`<pre>${EH(await f.text())}</pre>`);
 throw Object.assign(new Error(`${f.name}: .${e} is not supported (skipped).`),{skip:true});}
TOOLS.anypdf={opts(){const o=this.vars.only;return sel('amode',T.o_aMode||'Output',[['one',T.o_aOne||'Combine into one PDF (bookmark per file)'],['sep',T.o_aSep||'One PDF per file (ZIP)']].sort((a,b)=>o?(b[0]==='sep')-(a[0]==='sep'):0))+sel('apsize',T.o_pagesize||'Page size for text & tables',[['a4','A4'],['letter','Letter'],['legal','Legal'],['a3','A3']])+chk('asort',T.o_aSort||'Sort files by name',false);},
 async run(files,status){const {PDFDocument,PDFName,PDFString}=await L.pdflib();let list=[...files];const JSZip=await L.zip();
  const flat=[];for(const f of list){if(AX(f.name)==='zip'){const z=await JSZip.loadAsync(await buf(f));for(const [n,e] of Object.entries(z.files)){if(e.dir||/(^|\/)(__MACOSX|\.)/.test(n))continue;flat.push(new File([await e.async('blob')],n.split('/').pop(),{type:''}));}}else flat.push(f);}
  if(vb('asort'))flat.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));const out=[],skipped=[];
  for(const [i,f] of flat.entries()){status(`${T.working} ${i+1}/${flat.length} · ${f.name}`);try{out.push({f,d:await onePdf(f)});}catch(e){if(e.skip||flat.length>1)skipped.push(f.name);else throw e;}}
  if(!out.length)throw new Error((T.o_aNone||'None of these files could be converted: ')+skipped.join(', '));
  const info=`${out.length} file(s) converted${skipped.length?` · skipped: ${skipped.join(', ')}`:''}`;
  if(v('amode')==='sep'||out.length===1){const items=[];for(const {f,d} of out)items.push({blob:pdfBlob(await d.save()),name:base(f.name)+'.pdf'});const r=await zipOrOne(items,'converted-pdfs.zip');r.info=info;return r;}
  const m=await PDFDocument.create();const marks=[];for(const {f,d} of out){const cp=await m.copyPages(d,d.getPageIndices());marks.push({t:f.name,p:m.getPageCount()});cp.forEach(p=>m.addPage(p));}
  const ctx=m.context;const root=ctx.nextRef();const refs=marks.map(()=>ctx.nextRef());marks.forEach((k,i)=>ctx.assign(refs[i],ctx.obj({Title:PDFString.of(k.t),Parent:root,Dest:[m.getPage(k.p).ref,PDFName.of('XYZ'),null,null,null],...(i?{Prev:refs[i-1]}:{}),...(i<refs.length-1?{Next:refs[i+1]}:{})})));
  ctx.assign(root,ctx.obj({Type:'Outlines',First:refs[0],Last:refs.at(-1),Count:refs.length}));m.catalog.set(PDFName.of('Outlines'),root);m.catalog.set(PDFName.of('PageMode'),PDFName.of('UseOutlines'));
  return {blob:pdfBlob(await m.save()),name:(out.length>1?'combined':base(out[0].f.name))+'.pdf',info};}};
