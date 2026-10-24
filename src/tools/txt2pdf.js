// @needs pdfx htmlpdf
// Text / Markdown / RTF -> PDF (vars.from preselects behaviour; auto-detect by extension)
const rtfToHtml=r=>{// minimal RTF reader: paragraphs, bold, unicode/hex escapes; skips font/colour/info tables and pictures
 let out='',b=false,stack=[],skip=0,depth=0,i=0;const cp1252=n=>new TextDecoder('windows-1252').decode(new Uint8Array([n]));let uc=1,pendingSkip=0;let para='';const flush=()=>{out+='<p>'+para+'</p>';para='';};
 while(i<r.length){const ch=r[i];
  if(ch==='{'){stack.push({b,skip});depth++;i++;if(r.startsWith('\\*',i))skip=depth;continue;}
  if(ch==='}'){const s=stack.pop()||{};if(para&&b!==s.b)para+=s.b?'<b>':'</b>';b=s.b;if(skip>=depth)skip=s.skip&&s.skip<depth?s.skip:0;depth--;i++;continue;}
  if(ch==='\\'){const m=/^\\([a-z]+)(-?\d+)? ?|^\\'([0-9a-f]{2})|^\\([^a-z])/i.exec(r.slice(i,i+40));if(!m){i++;continue;}i+=m[0].length;if(skip)continue;
   if(m[3]){if(pendingSkip){pendingSkip--;continue;}para+=esc(cp1252(parseInt(m[3],16)));continue;}
   if(m[4]){if(m[4]==='\n'||m[4]==='\r')flush();else if('\\{}'.includes(m[4]))para+=esc(m[4]);else if(m[4]==='~')para+=' ';continue;}
   const w=m[1],n=m[2];if(['fonttbl','colortbl','stylesheet','info','pict','header','footer','listtable','listoverridetable','generator'].includes(w)){skip=depth;continue;}
   if(w==='par'||w==='line')flush();else if(w==='tab')para+=' ';else if(w==='b'){const nb=n!=='0';if(nb!==b)para+=nb?'<b>':'</b>';b=nb;}else if(w==='u'){let c=+n;if(c<0)c+=65536;para+=esc(String.fromCharCode(c));pendingSkip=uc;}else if(w==='uc')uc=+n;continue;}
  if(ch==='\r'||ch==='\n'){i++;continue;}if(!skip){if(pendingSkip){pendingSkip--;i++;continue;}para+=esc(ch);}i++;}
 if(para)flush();return out.replace(/<b><\/b>|<\/b><b>/g,'');};
TOOLS.txt2pdf={opts:()=>sel('tsize',T.o_pagesize,[['a4','A4'],['letter','US Letter'],['legal','Legal'],['a5','A5']])+inp('tfont',T.o_fontSize,'number','11','min="6" max="24"')+inp('tmar',T.o_margin+' (mm)','number','20','min="5" max="50"'),
 async run(files,status){const items=[];for(const f of files){status(T.working+' '+f.name);const txt=await f.text();const e=(f.name.split('.').pop()||'').toLowerCase();let html;
   if(/^(md|markdown)$/.test(e)||this.vars.from==='md'&&e!=='txt'&&e!=='rtf'){await load('marked.umd.js');html=window.marked.parse(txt,{gfm:true});}
   else if(e==='rtf'||txt.startsWith('{\\rtf'))html=rtfToHtml(txt);
   else html=txt.replace(/\r\n?/g,'\n').split(/\n/).map(l=>l.trim()?`<pre>${esc(l)}</pre>`:'<p>\u00a0</p>').join('');
   if(!/^(md|markdown|rtf)$/.test(e)&&!txt.startsWith('{\\rtf')&&this.vars.from!=='md')html=`<div>${txt.replace(/\r\n?/g,'\n').split(/\n{2,}/).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('')}</div>`;
   const d=await htmlToPdf(html,{size:v('tsize'),base:+v('tfont')||11,margin:(+v('tmar')||20)*2.8346,title:base(f.name)});items.push({name:base(f.name)+'.pdf',blob:pdfBlob(await d.save())});}
  return zipOrOne(items,'converted-pdfs.zip');}};
