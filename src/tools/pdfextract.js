// @needs pdfx
// PDF -> Text / HTML / Markdown (text layer; headings guessed from font size). vars.to presets the format
const blocksOf=pt=>{const lines=[];let cur=null;for(const it of pt.items){const y=it.transform[5],h=Math.abs(it.transform[3])||10;if(!cur||Math.abs(cur.y-y)>h*.5){cur={y,h,t:''};lines.push(cur);}cur.t+=it.str;cur.h=Math.max(cur.h,h);if(it.hasEOL)cur=null;}
 const ls=lines.map(l=>({...l,t:l.t.replace(/\s+/g,' ').trim()})).filter(l=>l.t);const body=ls.map(l=>Math.round(l.h)).sort((a,b)=>a-b)[Math.floor(ls.length/2)]||10;
 const out=[];let prev=null;for(const l of ls){const kind=l.h>body*1.6?'h1':l.h>body*1.25?'h2':/^([•●▪◦\-–*]|\d+[.)])\s+/.test(l.t)?'li':'p';
  if(kind==='p'&&prev&&prev.kind==='p'&&Math.abs(prev.y-l.y)<l.h*1.9){prev.t+=(prev.t.endsWith('-')?'':' ')+l.t;prev.y=l.y;continue;}const b={kind,t:l.t,y:l.y};out.push(b);prev=b;}return out;};
TOOLS.pdfextract={opts(){const to=this.vars.to||'txt';return sel('xfmt',T.o_format,[['txt','Text (.txt)'],['html','HTML'],['md','Markdown']].sort((a,b)=>(b[0]===to)-(a[0]===to)))+chk('xbreak',T.o_xPageBreaks,true);},
 async run([f],status){const pj=await openPdfjs(await buf(f));const pts=await pageTexts(pj);const fmt=v('xfmt');const br=vb('xbreak');let s='';let chars=0;
  pts.forEach((pt,i)=>{status(`${T.working} ${i+1}/${pts.length}`);const bl=blocksOf(pt);chars+=bl.reduce((a,b)=>a+b.t.length,0);
   if(fmt==='txt')s+=(i&&br?`\n\n----- ${T.o_page} ${i+1} -----\n\n`:i?'\n\n':'')+bl.map(b=>b.t).join('\n\n');
   else if(fmt==='md')s+=(i&&br?'\n\n---\n\n':i?'\n\n':'')+bl.map(b=>b.kind==='h1'?'# '+b.t:b.kind==='h2'?'## '+b.t:b.kind==='li'?b.t.replace(/^([•●▪◦\-–*])\s+/,'- '):b.t.replace(/([*_`#\[\]])/g,'\\$1')).join('\n\n');
   else s+=`<section class="page" id="page-${i+1}">\n`+bl.map(b=>b.kind==='li'?`<p class="li">${esc(b.t)}</p>`:`<${b.kind}>${esc(b.t)}</${b.kind}>`).join('\n')+'\n</section>\n'+(br&&i<pts.length-1?'<hr>\n':'');});
  if(!chars)throw new Error(T.o_xNoText);
  if(fmt==='html')s=`<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(base(f.name))}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2em auto;padding:0 1em;line-height:1.6}.li{margin-left:1.5em}</style></head><body>\n${s}</body></html>\n`;
  const mime={txt:'text/plain',html:'text/html',md:'text/markdown'}[fmt];return {blob:new Blob([s],{type:mime+';charset=utf-8'}),name:base(f.name)+'.'+fmt,info:`${chars} ${T.o_xChars}`};}};
