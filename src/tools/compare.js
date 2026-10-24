// @needs pdfx
// ---------- Compare (side-by-side text diff) ----------
TOOLS.compare={minFiles:2,get minMsg(){return T.o_two;},
  async run(files,status){if(files.length<2)throw new Error(T.o_two);const [a,b]=files;status(T.working);
   const lines=async f=>{const pj=await openPdfjs(await buf(f));const tx=await pageTexts(pj);const out=[];tx.forEach((p,i)=>lineTexts(p.items).forEach(t=>out.push({t,p:i+1})));return out;};
   const A=await lines(a),B=await lines(b);const ops=diffLines(A.map(x=>x.t),B.map(x=>x.t));let add=0,del=0,chg=0;
   const rows=[];for(let k=0;k<ops.length;k++){const o=ops[k];if(o.t==='='){rows.push(['eq',A[o.i],B[o.j]]);continue;}
    if(o.t==='-'&&ops[k+1]&&ops[k+1].t==='+'){const w=wordDiff(A[o.i].t,B[ops[k+1].j].t);rows.push(['chg',{...A[o.i],h:w[0]},{...B[ops[k+1].j],h:w[1]}]);chg++;k++;continue;}
    if(o.t==='-'){rows.push(['del',A[o.i],null]);del++;}else{rows.push(['add',null,B[o.j]]);add++;}}
   const cell=x=>x?`<td class="pg">${x.p}</td><td>${x.h||esc(x.t)}</td>`:'<td class="pg"></td><td></td>';
   const table=`<div class="cmpsum"><b>${esc(a.name)}</b> ⇔ <b>${esc(b.name)}</b> — <span class="cdel">−${del}</span> <span class="cadd">+${add}</span> <span class="cchg">~${chg}</span></div><div class="cmpwrap"><table class="cmp"><tbody>${rows.map(([t,x,y])=>`<tr class="${t}">${cell(x)}${cell(y)}</tr>`).join('')}</tbody></table></div>`;
   const css='body{font:14px system-ui,sans-serif;margin:16px}.cmp{border-collapse:collapse;width:100%;table-layout:fixed}.cmp td{border-bottom:1px solid #eee;padding:3px 6px;vertical-align:top;word-wrap:break-word}.cmp td.pg{width:34px;color:#999;font-size:11px}.cmp tr.del td:nth-child(2){background:#fde2e1}.cmp tr.add td:nth-child(4){background:#dff5e3}.cmp tr.chg td:nth-child(2),.cmp tr.chg td:nth-child(4){background:#fff6d6}del{background:#f7b4b0;text-decoration:line-through}ins{background:#a8e6b4;text-decoration:none}.cdel{color:#c4221d}.cadd{color:#18843a}.cchg{color:#a37b00}';
   const html=`<!doctype html><meta charset="utf-8"><title>Compare ${esc(a.name)} vs ${esc(b.name)}</title><style>${css}</style>${table}`;
   return {blob:new Blob([html],{type:'text/html'}),name:`compare-${base(a.name)}-vs-${base(b.name)}.html`,view:`<style>${css.replace('body{','.resview{')}</style>${table}`,info:`−${del} +${add} ~${chg}`};}};
