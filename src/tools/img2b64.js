// @needs txt
TOOLS.img2b64={live:true,noAdv:true,
 opts:()=>sel('ibf','Output format',[['uri','Data URI (data:image/…;base64,…)'],['raw','Raw Base64 only'],['img','HTML <img> tag'],['css','CSS background-image'],['md','Markdown image'],['json','JSON {"name","mime","base64"}']]),
 setup(){return box('<div id="ibout"></div>');},
 async run(files){const fmt=v('ibf');const parts=[];let html='';let i=0;
  for(const f of files){const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]||'');r.onerror=()=>rej(r.error);r.readAsDataURL(f);});const mime=f.type||'image/'+(f.name.split('.').pop()||'png');const uri=`data:${mime};base64,${b64}`;
   const s=fmt==='raw'?b64:fmt==='img'?`<img src="${uri}" alt="${f.name.replace(/"/g,'')}">`:fmt==='css'?`background-image: url("${uri}");`:fmt==='md'?`![${f.name}](${uri})`:fmt==='json'?JSON.stringify({name:f.name,mime,base64:b64}):uri;parts.push(s);
   const id='ib'+i++;html+=`<div class="ibitem"><p><b>${esc(f.name)}</b> · ${fmtSize(f.size)} → ${nf(s.length,0)} characters (+${Math.round((s.length/f.size-1)*100)}%) ${copyBtn(id)}</p>${/^image\//.test(mime)?`<img src="${uri}" alt="" style="max-height:80px;max-width:160px">`:''}<textarea id="${id}" rows="4" readonly spellcheck="false">${esc(s.length>200000?s.slice(0,200000)+'… (truncated in preview – download for the full text)':s)}</textarea></div>`;}
  setHTML('ibout',html);const out=parts.join('\n\n');return {...txtOut(files.length===1?base(files[0].name)+'-base64.txt':'images-base64.txt',out),info:`${files.length} image${files.length>1?'s':''} encoded · ${nf(out.length,0)} characters`};}};
