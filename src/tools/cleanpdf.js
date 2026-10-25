// PDF Cleaner / sanitizer: strips JavaScript, auto-actions, attachments, metadata, comments, XFA, hidden-layer config, thumbnails & private app data; reports what was removed.
TOOLS.cleanpdf={opts:()=>chk('cjs',T.o_cJs||'JavaScript & auto-run actions',true)+chk('cfiles',T.o_cFiles||'Embedded files / attachments',true)+chk('cmeta',T.o_cMeta||'Metadata (author, software, XMP)',true)+chk('cannots',T.o_cAnnots||'Comments & markup (keeps links)',false)+chk('clinks',T.o_cLinks||'External links',false)+chk('cforms',T.o_cForms||'XFA form data',true)+chk('cpriv',T.o_cPriv||'Thumbnails, private app data, hidden layers config',true)+chk('cbm',T.o_cBm||'Bookmarks',false),
 async run(files,status){const {PDFDocument,PDFName,PDFDict,PDFArray}=await L.pdflib();const items=[];const rep=[];
  for(const [fi,f] of files.entries()){status(`${T.working} ${fi+1}/${files.length}`);const d=await PDFDocument.load(await buf(f),{ignoreEncryption:true,updateMetadata:false});const C=d.catalog;const cnt={};const inc=k=>cnt[k]=(cnt[k]||0)+1;const N=n=>PDFName.of(n);
   const del=(dict,k,label)=>{if(dict&&dict.has(N(k))){dict.delete(N(k));inc(label);}};const names=C.lookup(N('Names'));
   if(vb('cjs')){del(C,'OpenAction','auto-run action');del(C,'AA','auto action');if(names instanceof PDFDict)del(names,'JavaScript','JavaScript');}
   if(vb('cfiles')){if(names instanceof PDFDict)del(names,'EmbeddedFiles','attachment list');}
   if(vb('cforms')){const af=C.lookup(N('AcroForm'));if(af instanceof PDFDict)del(af,'XFA','XFA form');}
   if(vb('cpriv')){del(C,'OCProperties','layer config');del(C,'PieceInfo','private data');del(C,'Threads','article threads');}
   if(vb('cbm')){del(C,'Outlines','bookmarks');}
   if(vb('cmeta')){del(C,'Metadata','XMP metadata');const info=d.context.trailerInfo.Info;if(info){d.context.trailerInfo.Info=undefined;inc('document info');}}
   for(const p of d.getPages()){const n=p.node;if(vb('cjs'))del(n,'AA','page action');if(vb('cpriv')){del(n,'Thumb','thumbnail');del(n,'PieceInfo','private data');}
    const an=n.lookup(N('Annots'));if(an instanceof PDFArray){const keep=[];for(let i=0;i<an.size();i++){const ref=an.get(i);const a=an.lookup(i);const st=a instanceof PDFDict?String(a.lookup(N('Subtype'))||''):'';const A=a instanceof PDFDict?a.lookup(N('A')):null;const S=A instanceof PDFDict?String(A.lookup(N('S'))||''):'';
      if(vb('cjs')&&a instanceof PDFDict){if(/JavaScript|Launch|ImportData|SubmitForm/.test(S)){a.delete(N('A'));inc('script/launch action');}del(a,'AA','field action');}
      if(vb('cfiles')&&st==='/FileAttachment'){inc('file attachment');continue;}
      if(st==='/Link'){if(vb('clinks')&&/URI|Launch|GoToR/.test(S)){inc('external link');continue;}keep.push(ref);continue;}
      if(st==='/Widget'){keep.push(ref);continue;}
      if(vb('cannots')&&st&&!/Widget|Link/.test(st)){inc('comment/markup');continue;}keep.push(ref);}
     if(keep.length!==an.size()){if(keep.length)n.set(N('Annots'),d.context.obj(keep));else n.delete(N('Annots'));}}}
   if(vb('cmeta')){d.setProducer('');d.setCreator('');}
   const out=await d.save({useObjectStreams:true});const sum=Object.entries(cnt).map(([k,c])=>`${k} ×${c}`).join(', ')||'nothing risky found';rep.push(`${f.name}: ${sum}`);items.push({blob:pdfBlob(out),name:base(f.name)+'-clean.pdf'});}
  const r=await zipOrOne(items,'cleaned-pdfs.zip');r.info=rep.join(' · ');r.view=`<ul class="aiout">${rep.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;return r;}};
