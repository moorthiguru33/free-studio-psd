// @needs txt
TOOLS.dedupe={live:true,noAdv:true,
 opts:()=>chk('ddci','Ignore upper/lower case',false)+chk('ddtrim','Trim spaces at line ends',true)+chk('ddempty','Remove empty lines',true)+sel('ddsort','Sort result',[['','Keep original order'],['az','A → Z'],['za','Z → A'],['len','Shortest first'],['num','Numeric']])+sel('ddkeep','Show',[['uniq','Unique lines (duplicates removed)'],['dups','Only lines that were duplicated'],['single','Only lines that appear once']]),
 setup(){return box(area('ddin','Your list (one item per line)','',10,'apple\nbanana\napple\ncherry')+`<label class="tl">Result ${copyBtn('ddout')}<textarea id="ddout" rows="10" readonly></textarea></label>`);},
 run(){let L=(v('ddin')||'').split(/\r?\n/);if(vb('ddtrim'))L=L.map(x=>x.trim());if(vb('ddempty'))L=L.filter(x=>x!=='');const key=x=>vb('ddci')?x.toLowerCase():x;
  const cnt=new Map();for(const x of L)cnt.set(key(x),(cnt.get(key(x))||0)+1);const seen=new Set();let out=[];const k=v('ddkeep');
  for(const x of L){const q=key(x);if(seen.has(q))continue;seen.add(q);if(k==='dups'&&cnt.get(q)<2)continue;if(k==='single'&&cnt.get(q)>1)continue;out.push(x);}
  const s=v('ddsort'),col=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});if(s==='az')out.sort(col.compare);if(s==='za')out.sort((a,b)=>col.compare(b,a));if(s==='len')out.sort((a,b)=>a.length-b.length);if(s==='num')out.sort((a,b)=>parseFloat(a)-parseFloat(b));
  const r=out.join('\n');$('#ddout',work).value=r;return {...txtOut('unique-lines.txt',r+'\n'),info:`${L.length} lines → ${out.length} lines (${L.length-seen.size} duplicates removed)`};}};
