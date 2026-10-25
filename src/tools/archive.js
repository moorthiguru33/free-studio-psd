// Extract RAR/7Z/TAR/GZ/BZ2/XZ/ISO… and create TAR, TAR.GZ, TAR.XZ, 7Z with libarchive.js (MIT; libarchive BSD-2). WASM is lazy-loaded on Start.
let _LA;const LA=async()=>{if(_LA)return _LA;const m=await import('/vendor/libarchive/libarchive.js');m.Archive.init({workerUrl:'/vendor/libarchive/worker-bundle.js'});return _LA=m;};
TOOLS.archive={opts(){const V=this.vars||{};if(V.mode!=='create')return '';
  const F=[['tgz','.tar.gz (gzip)'],['tar','.tar (no compression)'],['txz','.tar.xz (smallest, slower)'],['tbz','.tar.bz2'],['7z','.7z']];const d=V.fmt||'tgz';return inp('aname',T.o_zipName||'Archive name','text','archive')+sel('afmt',T.o_format||'Format',[...F.filter(f=>f[0]===d),...F.filter(f=>f[0]!==d)]);},
 async run(files,status){status(T.working+' …');const {Archive,ArchiveCompression:C,ArchiveFormat:F}=await LA();
  if((this.vars||{}).mode==='create'){const m={tgz:[F.USTAR,C.GZIP,'.tar.gz'],tar:[F.USTAR,null,'.tar'],txz:[F.USTAR,C.XZ,'.tar.xz'],tbz:[F.USTAR,C.BZIP2,'.tar.bz2'],'7z':[F.SEVEN_ZIP,null,'.7z']}[v('afmt')]||[F.USTAR,C.GZIP,'.tar.gz'];
   const name=(v('aname')||'archive').replace(/\.(tar(\.(gz|xz|bz2))?|tgz|7z)$/i,'')+m[2];const out=await Archive.write({files:files.map(f=>({file:f,pathname:f.webkitRelativePath||f.name})),outputFileName:name,compression:m[1],format:m[0],passphrase:null});
   return {blob:out,name,info:`${files.length} files → ${fmtSize(out.size)}`};}
  const items=[];for(const f of files){if(/\.gz$/i.test(f.name)&&!/\.t(ar\.)?gz$/i.test(f.name)){const b=await new Response(f.stream().pipeThrough(new DecompressionStream('gzip'))).blob();const nm=f.name.replace(/\.gz$/i,'');items.push({blob:b,name:nm,path:nm});continue;}let a;try{a=await Archive.open(f);}catch(e){throw new Error((T.o_badArch||'This archive could not be opened.')+' '+(e.message||''));}
   
   let n=0;let arr;try{arr=await a.getFilesArray();await a.extractFiles(()=>status(`${T.working} ${++n}/${arr.length}`));arr=await a.getFilesArray();}catch(e){throw new Error(/encrypt/i.test(e.message||'')?(T.o_archEnc||'This archive is password-protected (encrypted). Encrypted RAR/7Z archives are not supported yet – open it with 7-Zip on a computer.'):(T.o_badArch||'Extraction failed.')+' '+(e.message||''))}
   for(const e of arr){const fl=e.file;if(fl instanceof File||fl instanceof Blob)items.push({blob:fl,name:fl.name,path:(e.path||'')+fl.name});}
   if(!arr.length&&/\.(gz|bz2|xz)$/i.test(f.name)){}}
  if(!items.length)throw new Error(T.o_emptyZip||'The archive is empty.');const tot=items.reduce((a,b)=>a+b.blob.size,0);
  const list=`<ul class="zlist">${items.slice(0,300).map(it=>`<li><a href="${URL.createObjectURL(it.blob)}" download="${esc(it.name)}">⬇ ${esc(it.path)}</a> <small>${fmtSize(it.blob.size)}</small></li>`).join('')}</ul>`;
  if(items.length===1)return {blob:items[0].blob,name:items[0].name,info:`1 file · ${fmtSize(tot)}`,view:list};
  const r=await zipOrOne(items.map(i=>({blob:i.blob,name:i.path})),'extracted.zip');return {...r,info:`${items.length} files · ${fmtSize(tot)} – download all as ZIP or pick files below`,view:list};}};
