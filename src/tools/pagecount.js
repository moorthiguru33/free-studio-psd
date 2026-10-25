// @needs txt
TOOLS.pagecount={live:true,noAdv:true,
 opts:()=>chk('pcsz','Show page sizes',true),
 setup(){return box('<div id="pcout"></div>');},
 async run(files,status){const pj=await L.pdfjs();const rows=[];let tot=0;
  for(const f of files){let n='?',sz='',note='';try{const d=await pj.getDocument({data:new Uint8Array(await buf(f))}).promise;n=d.numPages;tot+=n;if(vb('pcsz')){const m=new Map();for(let i=1;i<=Math.min(n,500);i++){const p=await d.getPage(i);const [x0,y0,x1,y1]=p.view;const w=Math.round((x1-x0)/72*25.4),h=Math.round((y1-y0)/72*25.4);const k=(Math.abs(w-210)<3&&Math.abs(h-297)<3?'A4 ':Math.abs(w-216)<3&&Math.abs(h-279)<3?'Letter ':Math.abs(w-216)<3&&Math.abs(h-356)<3?'Legal ':'')+`${w}×${h} mm`;m.set(k,(m.get(k)||0)+1);}sz=[...m].map(([k,c])=>`${k} (${c})`).join(', ');}d.destroy();}catch(e){note=/password/i.test(e.message)?'Password protected':'Could not read: '+e.message;}
   rows.push([f.name,n,fmtSize(f.size),sz,note]);status&&status(`Counted ${rows.length}/${files.length}`);}
  setHTML('pcout',`<p class="bigres">Total pages: <b>${nf(tot,0)}</b> in ${files.length} PDF${files.length>1?'s':''}</p><table class="kv"><thead><tr><th>File</th><th>Pages</th><th>Size</th>${vb('pcsz')?'<th>Page sizes</th>':''}</tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${r[4]?esc(r[4]):r[1]}</td><td>${r[2]}</td>${vb('pcsz')?`<td>${esc(r[3])}</td>`:''}</tr>`).join('')}</tbody></table>`);
  const q=s=>'"'+String(s).replace(/"/g,'""')+'"';const csv='File,Pages,Size,Page sizes,Note\n'+rows.map(r=>r.map(q).join(',')).join('\n')+`\n"TOTAL",${tot}\n`;
  return {...txtOut('pdf-page-count.csv',csv,'text/csv'),info:`Total pages: ${tot} in ${files.length} file${files.length>1?'s':''}`};}};
