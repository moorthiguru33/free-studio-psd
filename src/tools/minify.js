// @needs txt
const cssMin=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{}:;,>~+])\s*/g,'$1').replace(/;}/g,'}').replace(/(^|[^.\d])0(px|em|rem|%|pt)/g,'$10').replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/gi,'#$1$2$3').trim();
const jsMin=async(s,mangle)=>{await load('terser.js');const r=await window.Terser.minify(s,{compress:true,mangle,format:{comments:false}});return r.code||'';};
async function htmlMin(s,o){const keep=[];s=s.replace(/<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,m0=>{keep.push(m0);return `\u0000${keep.length-1}\u0000`;});
 if(o.comments)s=s.replace(/<!--(?!\[if)[\s\S]*?-->/g,'');s=s.replace(/\s+/g,' ').replace(/>\s+</g,'><').replace(/\s+>/g,'>').trim();
 for(let i=0;i<keep.length;i++){let b=keep[i];const m=b.match(/^<(script|style)(\b[^>]*)>([\s\S]*)<\/\1>$/i);if(m&&o.inline){if(/^style$/i.test(m[1]))b=`<style${m[2]}>${cssMin(m[3])}</style>`;else if(!/type=["']?(?!text\/javascript|module)[a-z]/i.test(m[2])&&m[3].trim()){try{b=`<script${m[2]}>${await jsMin(m[3],true)}</script>`;}catch(e){}}}s=s.replace(`\u0000${i}\u0000`,()=>b);}return s;}
TOOLS.minify={live:true,noAdv:true,
 opts:()=>sel('mnlang','Language',[['auto','Detect automatically'],['html','HTML'],['css','CSS'],['js','JavaScript']])+chk('mnmangle','Shorten JS variable names (mangle)',true)+chk('mncom','Remove HTML comments',true)+chk('mninl','Minify inline <style> and <script>',true),
 setup(){return box(area('mnin','Code to minify','',12,'Paste HTML, CSS or JavaScript…')+`<p id="mnstat" class="jstat"></p><label class="tl">Minified ${copyBtn('mnout')}<textarea id="mnout" rows="10" readonly></textarea></label>`);},
 async run(){const s=v('mnin')||'';if(!s.trim())throw soft('Paste code to minify.');let L=v('mnlang');if(L==='auto')L=/^\s*</.test(s)?'html':/[{]\s*[\w-]+\s*:[^;]+;/.test(s)&&!/\b(function|const|let|var|=>|return)\b/.test(s)?'css':'js';
  let out;try{out=L==='css'?cssMin(s):L==='js'?await jsMin(s,vb('mnmangle')):await htmlMin(s,{comments:vb('mncom'),inline:vb('mninl')});}catch(e){$('#mnstat',work).className='jstat bad';$('#mnstat',work).textContent='✗ '+(e.message||e);throw soft('Syntax error');}
  const a=new TextEncoder().encode(s).length,b=new TextEncoder().encode(out).length;$('#mnstat',work).className='jstat ok';$('#mnstat',work).textContent=`✓ ${L.toUpperCase()}: ${fmtSize(a)} → ${fmtSize(b)} (−${a?Math.round((1-b/a)*100):0}%)`;
  $('#mnout',work).value=out;return {...txtOut('minified.'+(L==='js'?'js':L),out),info:`${L.toUpperCase()} −${a?Math.round((1-b/a)*100):0}%`};}};
