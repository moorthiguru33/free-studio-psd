// @needs txt
const LIM=[['X (Twitter) post',280],['Meta description (Google)',160],['Page title (Google)',60],['SMS (1 segment)',160],['Instagram caption',2200],['LinkedIn post',3000],['YouTube title',100],['Facebook post (shown before “See more”)',125]];
const GSM=/^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà^{}\\\[~\]|€]*$/;
TOOLS.charcount={live:true,noAdv:true,
 opts:()=>chk('ccspace','Count spaces',true)+chk('ccnl','Count line breaks',true),
 setup(){return box(area('cctext','Your text','',10,'Type or paste text…')+`<div id="ccout"></div>`);},
 run(){let s=v('cctext')||'';const seg=new (Intl.Segmenter||function(){return {segment:x=>[...x].map(c=>({segment:c}))}})('en',{granularity:'grapheme'});
  let t=s;if(!vb('ccnl'))t=t.replace(/\r?\n/g,'');if(!vb('ccspace'))t=t.replace(/[ \t\u00a0]/g,'');const n=[...seg.segment(t)].length;
  const bytes=new TextEncoder().encode(s).length;const gsm=GSM.test(s);const smsLen=gsm?s.length+(s.match(/[\^{}\\\[~\]|€]/g)||[]).length:[...s].length;const per=gsm?(smsLen>160?153:160):(smsLen>70?67:70);const segs=s?Math.ceil(smsLen/per):0;
  const words=(s.match(/[\p{L}\p{N}]+/gu)||[]).length;
  const rows=[['Characters',nf(n)],['Characters (all, incl. spaces)',nf([...seg.segment(s)].length)],['Words',nf(words)],['Letters',nf((s.match(/\p{L}/gu)||[]).length)],['Digits',nf((s.match(/\p{N}/gu)||[]).length)],['Spaces',nf((s.match(/ /g)||[]).length)],['UTF-8 bytes',nf(bytes)],['SMS',`${segs} segment${segs===1?'':'s'} (${gsm?'GSM-7':'Unicode/UCS-2'})`]];
  const lim=LIM.map(([k,m])=>{const p=Math.min(100,n/m*100);return `<li><span>${esc(k)}</span><span class="${n>m?'over':''}">${nf(n)} / ${m}${n>m?` (−${n-m})`:''}</span><i style="--w:${p}%"></i></li>`;}).join('');
  setHTML('ccout',stats(rows)+`<h3>Platform limits</h3><ul class="lim">${lim}</ul>`);return {...txtOut('character-count.txt',rows.map(r=>r.join(': ')).join('\n')+'\n'),info:`${nf(n)} characters`};}};
