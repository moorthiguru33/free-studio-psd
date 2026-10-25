// @needs txt
TOOLS.urlenc={live:true,noAdv:true,
 opts:()=>sel('ueMode','Mode',[['enc','Encode (component)'],['encuri','Encode full URL (keep : / ? & =)'],['dec','Decode']])+chk('uePlus','Use + for spaces (form encoding)',false),
 setup(){return box(area('uein','Input','',6,'https://example.com/search?q=café & crème')+`<label class="tl">Output ${copyBtn('ueout')}<textarea id="ueout" rows="6" readonly></textarea></label><div id="ueq"></div>`);},
 run(){const s=v('uein')||'';const m=v('ueMode');let out;try{if(m==='enc'){out=encodeURIComponent(s);if(vb('uePlus'))out=out.replace(/%20/g,'+');}else if(m==='encuri')out=encodeURI(s);else out=decodeURIComponent(vb('uePlus')?s.replace(/\+/g,' '):s);}catch(e){throw soft('Cannot decode: malformed % sequence.');}
  $('#ueout',work).value=out;let q='';try{const u=new URL(m==='dec'?out:s);const ps=[...u.searchParams];q=`<h3>URL parts</h3><table class="kv"><tr><th>Protocol</th><td>${esc(u.protocol)}</td></tr><tr><th>Host</th><td>${esc(u.host)}</td></tr><tr><th>Path</th><td>${esc(decodeURIComponent(u.pathname))}</td></tr>${ps.map(([k,val])=>`<tr><th>?${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}${u.hash?`<tr><th>Fragment</th><td>${esc(u.hash)}</td></tr>`:''}</table>`;}catch(e){}
  setHTML('ueq',q);return {...txtOut('url.txt',out),info:`${s.length} → ${out.length} characters`};}};
