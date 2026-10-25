// PDF/A validator (best-effort preflight, not a certified veraPDF replacement): checks the structural rules that cause most PDF/A rejections:
// header & binary comment, XMP metadata with pdfaid part/conformance, Info vs XMP title consistency, encryption, OutputIntent with ICC profile,
// embedded fonts (incl. standard-14 not embedded), JavaScript/actions, embedded files (A-1/A-2), transparency (A-1), LZW, external content, annotations' print flags.
TOOLS.pdfacheck={opts:()=>sel('pal',T.o_paLevel||'Check against',[['auto','Claimed level (from XMP)'],['1b','PDF/A-1b'],['2b','PDF/A-2b'],['3b','PDF/A-3b']]),
 async run(files,status){const {PDFDocument,PDFName,PDFDict,PDFArray,PDFRawStream,PDFStream}=await L.pdflib();const reports=[];let html='';
  for(const [fi,f] of files.entries()){status(`${T.working} ${fi+1}/${files.length}`);const bytes=new Uint8Array(await buf(f));const head=new TextDecoder('latin1').decode(bytes.slice(0,1024));const R=[];const add=(ok,msg,warn)=>R.push({ok,msg,warn});
   const enc=/\/Encrypt\b/.test(new TextDecoder('latin1').decode(bytes.slice(-4096)));let d;try{d=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});}catch(e){add(false,'File cannot be parsed: '+e.message);reports.push({f,R});continue;}
   const C=d.catalog,N=PDFName.of;const xmpS=C.lookup(N('Metadata'));let xmp='';if(xmpS instanceof PDFRawStream){try{xmp=new TextDecoder().decode(xmpS.getContents());}catch(e){}}
   const part=(/pdfaid:part(?:>|=")\s*(\d)/.exec(xmp)||[])[1],conf=(/pdfaid:conformance(?:>|=")\s*([ABU])/i.exec(xmp)||[])[1];let lvl=v('pal');if(lvl==='auto')lvl=part?part+(conf||'b').toLowerCase():'2b';const p=+lvl[0];
   add(/^%PDF-1\.[0-7]/.test(head)||/^%PDF-2/.test(head),'Header %PDF-x.y at byte 0');add(/%PDF-[\d.]+\r?\n%[\x80-\xff]{4}/.test(head),'Binary comment after header (4 bytes ≥128)',true);
   add(!!part,part?`XMP declares PDF/A-${part}${(conf||'').toLowerCase()}`:'No PDF/A identification (pdfaid) in XMP metadata');if(part&&+part!==p)add(false,`Declared part ${part} differs from checked level ${lvl}`);
   add(!enc,'Not encrypted');const oi=C.lookup(N('OutputIntents'));let icc=false;if(oi instanceof PDFArray)for(let i=0;i<oi.size();i++){const o=oi.lookup(i);if(o instanceof PDFDict&&o.lookup(N('DestOutputProfile')))icc=true;}add(icc,'OutputIntent with embedded ICC colour profile');
   const names=C.lookup(N('Names'));add(!(names instanceof PDFDict&&names.has(N('JavaScript')))&&!C.has(N('AA')),'No JavaScript / document actions');
   const ef=names instanceof PDFDict&&names.has(N('EmbeddedFiles'));if(p===1)add(!ef,'No embedded files (A-1)');else if(p===2&&ef)add(false,'Embedded files must themselves be PDF/A (A-2) — check manually',true);
   const af=C.lookup(N('AcroForm'));add(!(af instanceof PDFDict&&af.has(N('XFA'))),'No XFA forms');add(!(af instanceof PDFDict&&af.lookup(N('NeedAppearances'))?.toString()==='true'),'Form NeedAppearances not set');
   let unemb=new Set(),fontsN=0,lzw=false,trans=false,badAnn=0,ext=false;
   for(const [ref,obj] of d.context.enumerateIndirectObjects()){const dict=obj instanceof PDFDict?obj:obj instanceof PDFStream?obj.dict:null;if(!dict)continue;const ty=String(dict.lookup(N('Type'))||'');
    if(ty==='/Font'){const st=String(dict.lookup(N('Subtype'))||'');if(st==='/Type3'||st==='/Type0')continue;fontsN++;const fd=dict.lookup(N('FontDescriptor'));const has=fd instanceof PDFDict&&(fd.has(N('FontFile'))||fd.has(N('FontFile2'))||fd.has(N('FontFile3')));if(!has)unemb.add(String(dict.lookup(N('BaseFont'))||'?').replace('/',''));}
    if(ty==='/FontDescriptor'&&!(dict.has(N('FontFile'))||dict.has(N('FontFile2'))||dict.has(N('FontFile3'))))unemb.add(String(dict.lookup(N('FontName'))||'?').replace('/',''));
    const fl=dict.lookup(N('Filter'));if(fl&&/LZWDecode/.test(String(fl)))lzw=true;if(dict.has(N('SMask'))&&String(dict.lookup(N('SMask')))!=='/None')trans=true;if(ty==='/Group'||dict.lookup(N('S'))?.toString()==='/Transparency')trans=true;
    if(dict.has(N('F'))&&dict.lookup(N('FS'))?.toString()==='/URL')ext=true;
    if(ty==='/Annot'||dict.has(N('Subtype'))&&dict.has(N('Rect'))&&!dict.has(N('Type'))){const st=String(dict.lookup(N('Subtype'))||'');if(st&&st!=='/Popup'&&st!=='/Link'){const F=+(dict.lookup(N('F'))?.asNumber?.()??0);if(!(F&4))badAnn++;}}}
   add(!unemb.size,unemb.size?`Fonts not embedded: ${[...unemb].slice(0,8).join(', ')}`:`All ${fontsN} font(s) embedded`);add(!lzw,'No LZW compression');if(p===1)add(!trans,'No transparency (A-1)');add(!badAnn,badAnn?`${badAnn} annotation(s) without the Print flag`:'Annotations have Print flag');add(!ext,'No external content references');
   const info=d.getTitle();if(info&&xmp&&!xmp.includes(info.replace(/[<&]/g,'')))add(false,'Document title in Info dictionary differs from XMP dc:title',true);
   reports.push({f,R,lvl});}
  let txt='';for(const {f,R,lvl} of reports){const fail=R.filter(r=>!r.ok&&!r.warn).length,warn=R.filter(r=>!r.ok&&r.warn).length;const verdict=fail?`FAILS PDF/A-${lvl} (${fail} problem${fail>1?'s':''})`:`Passes key PDF/A-${lvl} checks${warn?` with ${warn} warning(s)`:''}`;
   html+=`<h3>${esc(f.name)} — <span class="${fail?'bad':'good'}">${esc(verdict)}</span></h3><ul class="aiout">${R.map(r=>`<li>${r.ok?'✅':r.warn?'⚠️':'❌'} ${esc(r.msg)}</li>`).join('')}</ul>`;txt+=`${f.name}: ${verdict}\n${R.map(r=>`  [${r.ok?'OK':r.warn?'WARN':'FAIL'}] ${r.msg}`).join('\n')}\n\n`;}
  html+=`<p class="hint">${esc(T.o_paFix||'To fix problems, run the file through our PDF to PDF/A converter, then validate again.')}</p>`;
  return {blob:new Blob([txt],{type:'text/plain'}),name:files.length>1?'pdfa-report.txt':base(files[0].name)+'-pdfa-report.txt',view:html,info:reports.map(r=>r.f.name).join(', ')};}};
