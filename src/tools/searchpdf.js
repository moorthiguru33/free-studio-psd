// @needs pdfx
// Search text in one or many PDFs: matches with page numbers and context; CSV export
TOOLS.searchpdf={opts:()=>inp('sq',T.o_sqQuery,'text','')+chk('scase',T.o_sqCase,false)+chk('sword',T.o_sqWord,false),goLabel:()=>T.o_sqSearch,
 async run(files,status){const q=(v('sq')||'').trim();if(!q)throw new Error(T.o_sqQuery);const re=new RegExp((vb('sword')?'\\b':'')+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+(vb('sword')?'\\b':''),vb('scase')?'g':'gi');const hits=[];
  for(const [fi,f] of files.entries()){status(`${T.working} ${fi+1}/${files.length}`);const pj=await openPdfjs(await buf(f));const pts=await pageTexts(pj);
   pts.forEach((pt,i)=>{const txt=lineTexts(pt.items).join(' ');let m;re.lastIndex=0;while((m=re.exec(txt))){hits.push({file:f.name,page:i+1,ctx:txt.slice(Math.max(0,m.index-60),m.index+m[0].length+60),at:m.index-Math.max(0,m.index-60),len:m[0].length});if(!m[0].length)re.lastIndex++;}});}
  const hl=h=>esc(h.ctx.slice(0,h.at))+'<mark>'+esc(h.ctx.substr(h.at,h.len))+'</mark>'+esc(h.ctx.slice(h.at+h.len));
  const csv='file,page,context\n'+hits.map(h=>[h.file,h.page,h.ctx].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
  return {name:'search-results.csv',blob:new Blob([csv],{type:'text/csv'}),info:`${hits.length} ${T.o_sqMatches}`,view:`<ol class="hits">${hits.slice(0,500).map(h=>`<li><b>${esc(h.file)}</b> · ${esc(T.o_page)} ${h.page}<br><small>…${hl(h)}…</small></li>`).join('')||`<p>${esc(T.o_sqNone)}</p>`}</ol>`};}};
