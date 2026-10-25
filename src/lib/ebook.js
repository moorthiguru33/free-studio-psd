// FB2 / FB2.ZIP / MOBI / AZW3 / PRC -> EPUB 3 (with EPUB 2 NCX), entirely in the browser. Own code, no dependencies besides JSZip.
(function(){
const X=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',svg:'image/svg+xml',webp:'image/webp'};
function xhtml(title,body,lang){return `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${X(lang)}" lang="${X(lang)}"><head><meta charset="utf-8"/><title>${X(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body>${body}</body></html>`;}
const toXhtml=html=>{const d=new DOMParser().parseFromString(`<!DOCTYPE html><html><body>${html}</body></html>`,'text/html');d.querySelectorAll('script,style,link,meta,object,embed,iframe').forEach(e=>e.remove());
 for(const e of d.body.querySelectorAll('*'))for(const a of [...e.attributes])if(/^on|^(recindex|hirecindex|lorecindex|filepos|mediarecindex|aid|data-aid)$/i.test(a.name)||a.name.includes(':'))e.removeAttribute(a.name);
 return [...d.body.childNodes].map(n=>new XMLSerializer().serializeToString(n)).join('').replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g,'');};
async function buildEpub(JSZip,{title,author,lang,chapters,images,cover,desc}){const z=new JSZip();z.file('mimetype','application/epub+zip',{compression:'STORE'});
 z.file('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
 z.file('OEBPS/style.css','body{font-family:serif;line-height:1.5;margin:0 5%}h1,h2,h3{font-family:sans-serif;line-height:1.2;page-break-after:avoid}p{margin:0 0 .6em;text-indent:0}blockquote,.epigraph{margin:1em 2em;font-style:italic}.verse{margin:0 0 0 2em}img{max-width:100%;height:auto}.cover{text-align:center}aside{font-size:.9em}');
 const uid='urn:uuid:'+(crypto.randomUUID?crypto.randomUUID():Date.now());const man=[],spine=[];
 for(const [n,im] of Object.entries(images)){z.file('OEBPS/'+n,im.data);man.push(`<item id="img_${n.replace(/\W/g,'_')}" href="${X(n)}" media-type="${im.type}"${cover===n?' properties="cover-image"':''}/>`);}
 if(cover){z.file('OEBPS/cover.xhtml',xhtml(title,`<div class="cover"><img src="${X(cover)}" alt="${X(title)}"/></div>`,lang));man.push('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>');spine.push('<itemref idref="cover"/>');}
 chapters.forEach((c,i)=>{const n=`ch${String(i+1).padStart(3,'0')}.xhtml`;c.file=n;z.file('OEBPS/'+n,xhtml(c.title||title,c.html,lang));man.push(`<item id="c${i+1}" href="${n}" media-type="application/xhtml+xml"/>`);spine.push(`<itemref idref="c${i+1}"/>`);});
 const toc=chapters.filter(c=>c.title);z.file('OEBPS/nav.xhtml',xhtml('Contents',`<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${(toc.length?toc:chapters).map((c,i)=>`<li><a href="${c.file}">${X(c.title||'Part '+(i+1))}</a></li>`).join('')}</ol></nav>`,lang));
 z.file('OEBPS/toc.ncx',`<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${uid}"/></head><docTitle><text>${X(title)}</text></docTitle><navMap>${(toc.length?toc:chapters).map((c,i)=>`<navPoint id="n${i+1}" playOrder="${i+1}"><navLabel><text>${X(c.title||'Part '+(i+1))}</text></navLabel><content src="${c.file}"/></navPoint>`).join('')}</navMap></ncx>`);
 z.file('OEBPS/content.opf',`<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="uid">${uid}</dc:identifier><dc:title>${X(title)}</dc:title>${author?`<dc:creator>${X(author)}</dc:creator>`:''}<dc:language>${X(lang)}</dc:language>${desc?`<dc:description>${X(desc)}</dc:description>`:''}<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/,'Z')}</meta>${cover?`<meta name="cover" content="img_${cover.replace(/\W/g,'_')}"/>`:''}</metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="style.css" media-type="text/css"/>${man.join('')}</manifest><spine toc="ncx">${spine.join('')}</spine></package>`);
 return z.generateAsync({type:'blob',mimeType:'application/epub+zip'});}

// ---------- FB2 ----------
async function fb2(ab,JSZip){let bytes=new Uint8Array(ab);if(bytes[0]===0x50&&bytes[1]===0x4b){const z=await JSZip.loadAsync(ab);const n=Object.keys(z.files).find(k=>/\.fb2$/i.test(k))||Object.keys(z.files).find(k=>!z.files[k].dir);bytes=await z.file(n).async('uint8array');}
 const head=new TextDecoder('latin1').decode(bytes.slice(0,200));const enc=(/encoding=["']([\w-]+)["']/i.exec(head)||[,'utf-8'])[1];let txt;try{txt=new TextDecoder(enc).decode(bytes)}catch(e){txt=new TextDecoder().decode(bytes)}
 const d=new DOMParser().parseFromString(txt,'application/xml');if(d.getElementsByTagName('parsererror').length&&!d.getElementsByTagName('body').length)throw new Error('This FB2 file is not valid XML.');
 const T=(n,t)=>n?.getElementsByTagNameNS('*',t)[0];const ti=T(d,'title-info');const title=T(ti,'book-title')?.textContent.trim()||'Untitled';
 const author=[...(ti?.getElementsByTagNameNS('*','author')||[])].map(a=>['first-name','middle-name','last-name'].map(k=>T(a,k)?.textContent.trim()).filter(Boolean).join(' ')||T(a,'nickname')?.textContent).filter(Boolean).join(', ');
 const lang=T(ti,'lang')?.textContent.trim()||'en';const desc=T(ti,'annotation')?.textContent.trim();const images={};
 for(const b of d.getElementsByTagNameNS('*','binary')){const id=b.getAttribute('id');const type=b.getAttribute('content-type')||'image/jpeg';const ext=(type.split('/')[1]||'jpg').replace('jpeg','jpg');try{images['img/'+id.replace(/[^\w.-]/g,'_').replace(/\.\w+$/,'')+'.'+ext]={data:Uint8Array.from(atob(b.textContent.replace(/\s+/g,'')),c=>c.charCodeAt(0)),type,id};}catch(e){}}
 const imgFor=href=>{const id=(href||'').replace(/^#/,'');return Object.keys(images).find(k=>images[k].id===id);};
 const href=n=>n.getAttributeNS('http://www.w3.org/1999/xlink','href')||n.getAttribute('l:href')||n.getAttribute('xlink:href')||n.getAttribute('href');
 const inl=n=>{let o='';for(const c of n.childNodes){if(c.nodeType===3){o+=X(c.textContent);continue}if(c.nodeType!==1)continue;const t=c.localName;
   if(t==='emphasis')o+=`<em>${inl(c)}</em>`;else if(t==='strong')o+=`<strong>${inl(c)}</strong>`;else if(t==='strikethrough')o+=`<del>${inl(c)}</del>`;else if(t==='sup')o+=`<sup>${inl(c)}</sup>`;else if(t==='sub')o+=`<sub>${inl(c)}</sub>`;else if(t==='code')o+=`<code>${inl(c)}</code>`;
   else if(t==='a'){const h=href(c)||'';o+=c.getAttribute('type')==='note'?`<sup>${inl(c)}</sup>`:/^https?:/.test(h)?`<a href="${X(h)}">${inl(c)}</a>`:inl(c);}else if(t==='image'){const k=imgFor(href(c));if(k)o+=`<img src="${X(k)}" alt=""/>`;}else o+=inl(c);}return o;};
 const blk=(n,lvl)=>{let o='';for(const c of n.childNodes){if(c.nodeType!==1)continue;const t=c.localName;
   if(t==='title'){const h=Math.min(6,lvl+1);o+=`<h${h}>${[...c.childNodes].filter(x=>x.nodeType===1).map(inl).join('<br/>')||X(c.textContent)}</h${h}>`;}
   else if(t==='p')o+=`<p>${inl(c)}</p>`;else if(t==='subtitle')o+=`<h${Math.min(6,lvl+2)}>${inl(c)}</h${Math.min(6,lvl+2)}>`;else if(t==='empty-line')o+='<p>&#160;</p>';
   else if(t==='epigraph'||t==='cite')o+=`<blockquote class="${t}">${blk(c,lvl)}</blockquote>`;else if(t==='text-author')o+=`<p><em>— ${inl(c)}</em></p>`;
   else if(t==='poem'||t==='stanza')o+=`<div class="${t}">${blk(c,lvl)}</div>`;else if(t==='v')o+=`<p class="verse">${inl(c)}</p>`;
   else if(t==='image'){const k=imgFor(href(c));if(k)o+=`<p><img src="${X(k)}" alt=""/></p>`;}
   else if(t==='table')o+=`<table>${[...c.getElementsByTagNameNS('*','tr')].map(r=>`<tr>${[...r.children].map(td=>`<${td.localName==='th'?'th':'td'}>${inl(td)}</${td.localName==='th'?'th':'td'}>`).join('')}</tr>`).join('')}</table>`;
   else if(t==='section')o+=blk(c,lvl+1);else if(t==='annotation')o+=`<blockquote>${blk(c,lvl)}</blockquote>`;}return o;};
 const chapters=[];const bodies=[...d.getElementsByTagNameNS('*','body')];
 for(const b of bodies){const notes=/notes|comments/.test(b.getAttribute('name')||'');const secs=[...b.children].filter(c=>c.localName==='section');const pre=[...b.children].filter(c=>c.localName!=='section');
  if(notes){chapters.push({title:pre.find(c=>c.localName==='title')?.textContent.trim()||'Notes',html:`<div class="notes">${blk(b,0)}</div>`});continue}
  const ph=blk({childNodes:pre},0);if(ph.replace(/<[^>]+>|&#160;/g,'').trim()||/<img/.test(ph))chapters.push({title:null,html:ph});
  for(const s of secs){const tt=[...s.children].find(c=>c.localName==='title');chapters.push({title:tt?tt.textContent.replace(/\s+/g,' ').trim():null,html:blk(s,1)});}}
 const cp=T(ti,'coverpage');const cimg=cp&&T(cp,'image');const cover=cimg?imgFor(href(cimg)):null;
 return {title,author,lang,desc,chapters,images,cover};}

// ---------- MOBI / AZW3 ----------
function palmdoc(src){const out=[];let i=0;while(i<src.length){const c=src[i++];if(c===0||c>=9&&c<=0x7f)out.push(c);else if(c<=8){for(let k=0;k<c;k++)out.push(src[i++])}else if(c>=0xc0){out.push(32,c^0x80)}else{const n=((c<<8)|src[i++]);const dist=(n>>3)&0x7ff,len=(n&7)+3;for(let k=0;k<len;k++)out.push(out[out.length-dist])}}return new Uint8Array(out);}
function trailing(rec,flags){let end=rec.length;for(let b=15;b>0;b--){if(flags&(1<<b)){let sz=0,shift=0;for(let k=end-1;k>=Math.max(0,end-4);k--){const v=rec[k];sz|=(v&0x7f)<<shift;shift+=7;if(v&0x80)break}end-=sz}}if(flags&1)end-=(rec[end-1]&3)+1;return rec.subarray(0,Math.max(0,end));}
async function mobi(ab){const b=new Uint8Array(ab);const dv=new DataView(ab);const sig=new TextDecoder('latin1').decode(b.slice(60,68));if(!/BOOKMOBI|TEXtREAd/.test(sig))throw new Error('Not a MOBI/AZW3 file.');
 const n=dv.getUint16(76);const offs=[];for(let i=0;i<n;i++)offs.push(dv.getUint32(78+i*8));offs.push(b.length);const rec=i=>b.subarray(offs[i],offs[i+1]);
 const parse=r0=>{const o=offs[r0];const comp=dv.getUint16(o),textRecs=dv.getUint16(o+8),encr=dv.getUint16(o+12);let hl=0,encd=1252,firstImg=0,trail=0,exth={},fullName='',ver=0,firstNon=0;
  if(sig==='BOOKMOBI'&&new TextDecoder('latin1').decode(b.slice(o+16,o+20))==='MOBI'){hl=dv.getUint32(o+20);encd=dv.getUint32(o+28);ver=dv.getUint32(o+36);firstNon=dv.getUint32(o+0x50);fullName=new TextDecoder(encd===65001?'utf-8':'windows-1252').decode(b.slice(o+dv.getUint32(o+0x54),o+dv.getUint32(o+0x54)+dv.getUint32(o+0x58)));firstImg=dv.getUint32(o+0x6c);if(hl>=0xe4)trail=dv.getUint16(o+0xf2);
   if(dv.getUint32(o+0x80)&0x40){let p=o+16+hl;if(new TextDecoder('latin1').decode(b.slice(p,p+4))==='EXTH'){const cnt=dv.getUint32(p+8);p+=12;for(let k=0;k<cnt;k++){const t=dv.getUint32(p),l=dv.getUint32(p+4);const data=b.slice(p+8,p+l);(exth[t]=exth[t]||[]).push(data);p+=l}}}}
  return {o,comp,textRecs,encr,encd,firstImg,trail,exth,fullName,ver,firstNon};};
 let h=parse(0);const u32=a=>a&&a.length>=4?new DataView(a.buffer,a.byteOffset).getUint32(0):null;const dec=a=>a&&new TextDecoder(h.encd===65001?'utf-8':'windows-1252').decode(a);
 let base=0;const kf8=u32(h.exth[121]?.[0]);let isKF8=h.ver>=8;if(kf8&&kf8!==0xffffffff&&kf8<n){const h8=parse(kf8);h8.firstImg=h.firstImg;Object.assign(h8.exth,h.exth);h=h8;base=kf8;isKF8=true;}
 if(h.encr)throw new Error('This e-book is DRM-protected (bought from the Kindle store). Only DRM-free MOBI/AZW3 files can be converted.');
 if(h.comp===17480)throw new Error('This e-book uses Kindle “HUFF/CDIC” compression (typical for store books), which is not supported. DRM-free files from Gutenberg, Calibre or KindleGen work.');
 const parts=[];for(let i=1;i<=h.textRecs;i++){let r=trailing(rec(base+i),h.trail);parts.push(h.comp===2?palmdoc(r):r)}const tl=parts.reduce((s,p)=>s+p.length,0);const all=new Uint8Array(tl);let q=0;for(const p of parts){all.set(p,q);q+=p.length}
 let html=new TextDecoder(h.encd===65001?'utf-8':'windows-1252').decode(all);
 const images={};let cover=null;const imgAt=idx=>{const ri=h.firstImg+idx;if(ri>=n||ri<0)return null;const k=`img/i${idx}`;for(const e of Object.keys(images))if(images[e].idx===idx)return e;const r=rec(ri);let t=null;if(r[0]===0xff&&r[1]===0xd8)t='jpg';else if(r[0]===0x89&&r[1]===0x50)t='png';else if(r[0]===0x47&&r[1]===0x49)t='gif';if(!t)return null;const nm=k+'.'+t;images[nm]={data:r.slice(),type:MIME[t],idx};return nm;};
 const cv=u32(h.exth[201]?.[0]);if(cv!=null&&cv!==0xffffffff)cover=imgAt(cv);
 html=html.replace(/<img([^>]*?)\b(?:recindex|hirecindex)=["']?(\d+)["']?([^>]*)>/gi,(m,a,i,c)=>{const nm=imgAt(+i-1);return nm?`<img${a} src="${nm}"${c}>`:''}).replace(/kindle:embed:([0-9A-V]{4})(\?mime=[^"')]*)?/gi,(m,s)=>imgAt(parseInt(s,32)-1)||'');
 const title=dec(h.exth[503]?.[0])||h.fullName||'Untitled',author=(h.exth[100]||[]).map(dec).join(', '),lang=(dec(h.exth[524]?.[0])||'en'),desc=dec(h.exth[103]?.[0])?.replace(/<[^>]+>/g,'');
 // split into chapters: KF8 = one per <html> skeleton part; MOBI6 = on page breaks
 let segs;if(isKF8){segs=html.split(/(?=<\?xml|<html[\s>])/i).map(s=>s.replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>|<\/?html[^>]*>|<head[\s>][\s\S]*?<\/head>|<\/?body[^>]*>/gi,'')).filter(s=>s.replace(/<[^>]+>/g,'').trim()||/<img/i.test(s));if(segs.length<=1)segs=[html.replace(/^[\s\S]*?<body[^>]*>/i,'').replace(/<\/body>[\s\S]*$/i,'')];}
 else{const bd=html.replace(/^[\s\S]*?<body[^>]*>/i,'').replace(/<\/body>[\s\S]*$/i,'');segs=bd.split(/<mbp:pagebreak\s*\/?>/i).filter(s=>s.replace(/<[^>]+>/g,'').trim()||/<img/i.test(s));}
 const chapters=segs.map(s=>{const x=toXhtml(s.replace(/<\/?mbp:[^>]*>/gi,''));const t=/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(x);return {title:t?t[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().slice(0,120)||null:null,html:x}});
 if(!chapters.length)throw new Error('No readable text found in this e-book.');return {title,author,lang,desc,chapters,images,cover};}
window.Ebook={async toEpub(file,JSZip){const ab=await file.arrayBuffer();const e=file.name.toLowerCase();const book=/\.fb2(\.zip)?$|\.fbz$/.test(e)?await fb2(ab,JSZip):await mobi(ab);const blob=await buildEpub(JSZip,book);return {blob,book};}};
})();
