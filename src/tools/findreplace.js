// @needs pdfx
// ---------- Find & replace (visual, best effort) ----------
TOOLS.findreplace={opts:()=>inp('frfind',T.o_find,'text','')+inp('frrep',T.o_replace,'text','')+chk('frcase',T.o_matchCase,true)+'<label>More pairs (one per line: old => new)<textarea id="frlist" rows="3" placeholder="2025 => 2026"></textarea></label>',
  async run([f]){const {PDFDocument,rgb}=await L.pdflib();const data=await buf(f);const pj=await openPdfjs(data);const d=await PDFDocument.load(data);const pairs=[[v('frfind'),v('frrep')||''],...(($('#frlist')||{}).value||'').split('\n').map(l=>l.split('=>')).filter(a=>a.length===2).map(a=>[a[0].trim(),a[1].trim()])].filter(a=>a[0]);if(!pairs.length)throw new Error(T.o_find);const cs=vb('frcase');let hits=0;
   const tx=await pageTexts(pj);const pages=d.getPages();
   for(let pi=0;pi<tx.length;pi++){const p=pages[pi];const {x:bx,y:by}=p.getCropBox();const view=pj?null:null;
    for(const it of tx[pi].items)for(const [q,rep] of pairs){const s=cs?it.str:it.str.toLowerCase(),qq=cs?q:q.toLowerCase();let at=s.indexOf(qq);if(at<0)continue;if(Math.abs(it.transform[1])>0.01||Math.abs(it.transform[2])>0.01)continue;
     const fs=Math.abs(it.transform[3])||Math.abs(it.transform[0])||10;const cw=it.width/Math.max(1,it.str.length);
     while(at>=0){hits++;const x=it.transform[4]+cw*at,y=it.transform[5];p.drawRectangle({x:x-0.5,y:y-fs*.22,width:cw*q.length+1,height:fs*1.12,color:rgb(1,1,1)});if(rep)await drawText(d,p,rep,{x,y,size:fs,color:rgb(0,0,0)});at=s.indexOf(qq,at+qq.length);}}}
   if(!hits)throw new Error(T.o_notFound+': '+pairs.map(a=>a[0]).join(', '));
   return {blob:pdfBlob(await d.save()),name:base(f.name)+'-replaced.pdf',info:`${hits} replacement(s)`};}};
