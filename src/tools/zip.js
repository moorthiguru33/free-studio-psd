// Create ZIP / extract ZIP with JSZip (MIT, dual-licensed MIT/GPLv3 – used under MIT).
const JZ=()=>load('jszip.min.js').then(()=>window.JSZip);
TOOLS.zip={opts(){return this.vars.mode==='unzip'?'':inp('zname',T.o_zipName||'ZIP file name','text','archive')+sel('zlevel',T.o_zlevel||'Compression',[['6',T.o_zNormal||'Normal'],['9',T.o_zMax||'Maximum (slower)'],['0',T.o_zStore||'None (fastest)']]);},
 async run(files,status){const Z=await JZ();
  if(this.vars.mode==='unzip'){const items=[];for(const f of files){let z;try{z=await Z.loadAsync(f);}catch(e){throw new Error((T.o_badZip||'Not a valid ZIP file (encrypted ZIPs are not supported).')+' '+e.message);}
    const ents=Object.values(z.files).filter(e=>!e.dir&&!/^__MACOSX\//.test(e.name));let i=0;for(const e of ents){status(`${T.working} ${++i}/${ents.length}`);items.push({blob:await e.async('blob'),name:e.name.split('/').pop(),path:e.name});}}
   if(!items.length)throw new Error(T.o_emptyZip||'The ZIP is empty.');const tot=items.reduce((a,b)=>a+b.blob.size,0);
   const list=`<ul class="zlist">${items.slice(0,300).map(it=>`<li><a href="${URL.createObjectURL(it.blob)}" download="${esc(it.name)}">⬇ ${esc(it.path)}</a> <small>${fmtSize(it.blob.size)}</small></li>`).join('')}</ul>`;
   return {info:`${items.length} files · ${fmtSize(tot)}`,view:list,...(items.length===1?{blob:items[0].blob,name:items[0].name}:{})};}
  const z=new Z();const seen={};for(const f of files){let n=f.webkitRelativePath||f.name;if(seen[n]){const m=n.match(/^(.*?)(\.[^.]*)?$/);n=`${m[1]} (${seen[n]++})${m[2]||''}`;}else seen[n]=1;z.file(n,f);}
  const lv=+v('zlevel');const blob=await z.generateAsync({type:'blob',compression:lv?'DEFLATE':'STORE',compressionOptions:{level:lv||1}},m=>status(`${T.working} ${Math.round(m.percent)}%`));
  return {blob,name:(v('zname')||'archive').replace(/\.zip$/i,'')+'.zip',info:`${files.length} files`};}};
