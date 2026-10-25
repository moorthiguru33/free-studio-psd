// @needs txt
const LW='lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nunc pulvinar sapien ligula mauris vitae ultricies leo integer malesuada facilisis morbi tristique senectus netus fames ac turpis egestas pellentesque habitant vestibulum ante primis faucibus orci luctus ultrices posuere cubilia curae donec viverra justo nec ultrices dui placerat orci nulla pellentesque dignissim'.split(' ');
TOOLS.lorem={live:true,noAdv:true,
 opts:()=>inp('lcount','How many','number','3','min="1" max="200"')+sel('lunit','Unit',[['p','Paragraphs'],['s','Sentences'],['w','Words'],['l','List items']])+chk('lstart','Start with “Lorem ipsum dolor sit amet…”',true)+chk('lhtml','Wrap in HTML tags',false)+inp('lseed','Variation (seed)','number','1','min="1" max="9999"'),
 setup(){return box(`<label class="tl">Generated text ${copyBtn('lout')}<textarea id="lout" rows="14" readonly></textarea></label>`);},
 run(){let seed=+v('lseed')||1;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const pick=()=>LW[Math.floor(r()*LW.length)];
  const sentence=(first)=>{const n=8+Math.floor(r()*10);const w=first&&vb('lstart')?'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(' '):[];while(w.length<n)w.push(pick());if(n>10&&!first)w[Math.floor(n/2)]+=',';const s=w.join(' ');return s[0].toUpperCase()+s.slice(1)+'.';};
  const para=f=>Array.from({length:4+Math.floor(r()*4)},(_,i)=>sentence(f&&i===0)).join(' ');
  const n=Math.max(1,Math.min(200,+v('lcount')||3)),u=v('lunit'),H=vb('lhtml');let out;
  if(u==='p'){const ps=Array.from({length:n},(_,i)=>para(i===0));out=H?ps.map(p=>`<p>${p}</p>`).join('\n'):ps.join('\n\n');}
  else if(u==='s'){out=Array.from({length:n},(_,i)=>sentence(i===0)).join(' ');if(H)out=`<p>${out}</p>`;}
  else if(u==='w'){const w=vb('lstart')?'lorem ipsum dolor sit amet'.split(' ').slice(0,n):[];while(w.length<n)w.push(pick());out=w.join(' ');out=out[0].toUpperCase()+out.slice(1);if(H)out=`<p>${out}</p>`;}
  else{const it=Array.from({length:n},(_,i)=>sentence(i===0).replace(/\.$/,'').split(' ').slice(0,3+Math.floor(r()*5)).join(' '));out=H?'<ul>\n'+it.map(x=>`  <li>${x}</li>`).join('\n')+'\n</ul>':it.map(x=>'• '+x).join('\n');}
  $('#lout',work).value=out;return {...txtOut('lorem-ipsum.txt',out+'\n'),info:`${(out.match(/\S+/g)||[]).length} words`};}};
