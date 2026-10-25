// @needs txt
const wordsOf=s=>s.replace(/([a-z\d])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const SMALL=new Set('a an and as at but by for in nor of on or per the to vs via with'.split(' '));
const cap=w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();
const M={upper:s=>s.toUpperCase(),lower:s=>s.toLowerCase(),
 title:s=>s.toLowerCase().replace(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu,(w,i)=>i>0&&SMALL.has(w)&&!/[.:!?]\s*$/.test(s.slice(0,i))?w:cap(w)),
 sentence:s=>s.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu,(m,a,b)=>a+b.toUpperCase()).replace(/\bi\b/g,'I'),
 camel:s=>s.split('\n').map(l=>wordsOf(l).map((w,i)=>i?cap(w):w.toLowerCase()).join('')).join('\n'),
 pascal:s=>s.split('\n').map(l=>wordsOf(l).map(cap).join('')).join('\n'),
 snake:s=>s.split('\n').map(l=>wordsOf(l).map(w=>w.toLowerCase()).join('_')).join('\n'),
 kebab:s=>s.split('\n').map(l=>wordsOf(l).map(w=>w.toLowerCase()).join('-')).join('\n'),
 constant:s=>s.split('\n').map(l=>wordsOf(l).map(w=>w.toUpperCase()).join('_')).join('\n'),
 dot:s=>s.split('\n').map(l=>wordsOf(l).map(w=>w.toLowerCase()).join('.')).join('\n'),
 alt:s=>{let i=0;return [...s].map(c=>/\p{L}/u.test(c)?(i++%2?c.toUpperCase():c.toLowerCase()):c).join('');},
 inverse:s=>[...s].map(c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase()).join('')};
TOOLS.caseconv={live:true,noAdv:true,
 opts:()=>sel('ccmode','Convert to',[['upper','UPPERCASE'],['lower','lowercase'],['title','Title Case'],['sentence','Sentence case'],['camel','camelCase'],['pascal','PascalCase'],['snake','snake_case'],['kebab','kebab-case'],['constant','CONSTANT_CASE'],['dot','dot.case'],['alt','aLtErNaTiNg'],['inverse','iNVERSE cASE']]),
 setup(){return box(area('cvin','Input text','',8,'Paste text to convert…')+`<label class="tl">Result ${copyBtn('cvout')}<textarea id="cvout" rows="8" readonly></textarea></label>`);},
 run(){const s=v('cvin')||'';const r=M[v('ccmode')||'upper'](s);$('#cvout',work).value=r;return {...txtOut('converted.txt',r),info:`${[...r].length} characters`};}};
