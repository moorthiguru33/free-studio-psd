// @needs txt
const STOP=new Set('the a an and or but of to in on at for with by from is are was were be been it this that as not no yes you i he she we they them his her our your their its into than then so if do does did have has had will would can could should may might must there here what which who whom when where why how all any each more most other some such only own same too very just over under about after before between de la le el en y que und der die das'.split(' '));
TOOLS.wordcount={live:true,noAdv:true,
 opts:()=>inp('wcwpm','Reading speed (words/min)','number','238','min="50" max="1000"')+inp('wcspm','Speaking speed (words/min)','number','140','min="50" max="400"')+chk('wckw','Show top keywords',true),
 setup(){return box(area('wctext','Your text','',12,'Type or paste your text here…')+`<div id="wcout"></div>`);},
 run(){const s=v('wctext')||'';const words=s.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu)||[];const W=words.length;
  const cjk=(s.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g)||[]).length;const total=W+cjk;
  const chars=[...s].length,nos=[...s.replace(/\s/g,'')].length;const sent=(s.match(/[^.!?。！？]+[.!?。！？]+/g)||[]).length||(s.trim()?1:0);
  const paras=s.split(/\n\s*\n/).filter(p=>p.trim()).length;const lines=s?s.split('\n').length:0;
  const t=m=>m<1?Math.round(m*60)+' sec':Math.floor(m)+' min '+Math.round((m%1)*60)+' sec';
  const rows=[['Words',nf(total)],['Characters',nf(chars)],['Characters (no spaces)',nf(nos)],['Sentences',nf(sent)],['Paragraphs',nf(paras)],['Lines',nf(lines)],['Avg. word length',W?nf(words.join('').length/W,1):'0'],['Avg. sentence length',sent?nf(total/sent,1)+' words':'–'],['Reading time',t(total/(+v('wcwpm')||238))],['Speaking time',t(total/(+v('wcspm')||140))]];
  let kw='';if(vb('wckw')&&W){const c={};for(const w of words){const k=w.toLowerCase();if(k.length<3||STOP.has(k))continue;c[k]=(c[k]||0)+1;}const top=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,10);if(top.length)kw=`<h3>Top keywords</h3><ol class="kw">${top.map(([k,n])=>`<li><b>${esc(k)}</b> ${n}× (${(n/W*100).toFixed(1)}%)</li>`).join('')}</ol>`;}
  setHTML('wcout',stats(rows)+kw);return {...txtOut('word-count.txt',rows.map(r=>r.join(': ')).join('\n')+'\n'),info:`${nf(total)} words · ${nf(chars)} characters`};}};
