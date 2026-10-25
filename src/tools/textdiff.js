// @needs txt
// Myers-style LCS diff on tokens (lines, then words inside changed lines)
function lcs(a,b){const n=a.length,m=b.length;if(n*m>4e7)throw soft('Texts are too large to compare in the browser (try smaller parts).');const dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const out=[];let i=0,j=0;while(i<n&&j<m){if(a[i]===b[j]){out.push(['=',a[i]]);i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])out.push(['-',a[i++]]);else out.push(['+',b[j++]]);}while(i<n)out.push(['-',a[i++]]);while(j<m)out.push(['+',b[j++]]);return out;}
const norm=(s,o)=>{if(o.ws)s=s.replace(/\s+/g,' ').trim();if(o.ci)s=s.toLowerCase();return s;};
function wordDiff(a,b){const ta=a.split(/(\s+)/),tb=b.split(/(\s+)/);const d=lcs(ta,tb);return [d.map(([k,t])=>k==='+'?'':k==='-'?`<del>${esc(t)}</del>`:esc(t)).join(''),d.map(([k,t])=>k==='-'?'':k==='+'?`<ins>${esc(t)}</ins>`:esc(t)).join('')];}
TOOLS.textdiff={live:true,noAdv:true,
 opts:()=>chk('tdws','Ignore whitespace differences',false)+chk('tdci','Ignore upper/lower case',false)+chk('tdsame','Show unchanged lines',true),
 setup(){return box(`<div class="two">${area('tda','Original text','',10,'Paste the original…')}${area('tdb','Changed text','',10,'Paste the new version…')}</div><div id="tdout"></div>`);},
 run(){const A=(v('tda')||'').split(/\r?\n/),B=(v('tdb')||'').split(/\r?\n/);const o={ws:vb('tdws'),ci:vb('tdci')};
  if(!v('tda')&&!v('tdb'))throw soft('Paste two texts to compare.');
  const d=lcs(A.map(x=>norm(x,o)),B.map(x=>norm(x,o)));let ia=0,ib=0;const rows=[];let add=0,del=0;
  for(let k=0;k<d.length;k++){const [t]=d[k];if(t==='='){rows.push(['=',A[ia++],B[ib++]]);}else if(t==='-'&&d[k+1]&&d[k+1][0]==='+'){rows.push(['~',A[ia++],B[ib++]]);k++;add++;del++;}else if(t==='-'){rows.push(['-',A[ia++],null]);del++;}else{rows.push(['+',null,B[ib++]]);add++;}}
  let la=0,lb=0;const same=vb('tdsame');const html=rows.map(([t,a,b])=>{if(a!==null)la++;if(b!==null)lb++;if(t==='='&&!same)return '';let x=a===null?'':esc(a),y=b===null?'':esc(b);if(t==='~')[x,y]=wordDiff(a,b);
   return `<tr class="d${t==='='?'s':t==='-'?'d':t==='+'?'a':'c'}"><td class="ln">${a!==null?la:''}</td><td>${x}</td><td class="ln">${b!==null?lb:''}</td><td>${y}</td></tr>`;}).join('');
  const sum=add||del?`${add} line${add===1?'':'s'} added/changed, ${del} removed/changed`:'No differences found – the texts are identical.';
  setHTML('tdout',`<p class="hint"><b>${esc(sum)}</b></p><div class="tdw"><table class="diff"><tbody>${html}</tbody></table></div>`);
  const uni=rows.map(([t,a,b])=>t==='='?'  '+a:t==='-'?'- '+a:t==='+'?'+ '+b:'- '+a+'\n+ '+b).join('\n');return {...txtOut('diff.txt',uni+'\n'),info:sum};}};
