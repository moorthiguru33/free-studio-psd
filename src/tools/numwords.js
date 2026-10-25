// Number to words: international (million/billion) and Indian (lakh/crore) systems, cheque wording, ordinals. BigInt, live, offline.
const NW1=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'],NW10=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const NWS=['','thousand','million','billion','trillion','quadrillion','quintillion','sextillion','septillion','octillion','nonillion','decillion'];
const nw100=n=>{n=Number(n);let s='';if(n>=100){s=NW1[Math.floor(n/100)]+' hundred';n%=100;if(n)s+=' ';}if(n>=20){s+=NW10[Math.floor(n/10)];if(n%10)s+='-'+NW1[n%10];}else if(n||!s)s+=NW1[n];return s;};
function nwInt(b,indian){if(b===0n)return 'zero';const parts=[];if(!indian){let i=0;while(b>0n){const c=b%1000n;if(c)parts.unshift(nw100(c)+(NWS[i]?' '+NWS[i]:''));b/=1000n;i++;if(i>=NWS.length&&b>0n)throw new Error('Number too large');}return parts.join(' ');}
 // Indian: groups 3 then 2,2 then repeats with crore
 const unit=(x)=>{const p=[];const h=x%1000n;x/=1000n;const th=x%100n;x/=100n;const l=x%100n;x/=100n;if(l)p.push(nw100(l)+' lakh');if(th)p.push(nw100(th)+' thousand');if(h)p.push(nw100(h));return {p,rest:x};};
 let cr=0;const out=[];while(b>0n){const {p,rest}=unit(b);if(p.length)out.unshift(p.join(' ')+(cr?' '+Array(cr).fill('crore').join(' '):''));b=rest;cr++;if(cr>4&&b>0n)throw new Error('Number too large');}return out.join(' ');}
const nwOrd=w=>{const m={one:'first',two:'second',three:'third',five:'fifth',eight:'eighth',nine:'ninth',twelve:'twelfth'};return w.replace(/(\w+)$/,x=>m[x]||(x.endsWith('y')?x.slice(0,-1)+'ieth':x+'th'));};
const nwCase=(s,c)=>c==='upper'?s.toUpperCase():c==='title'?s.replace(/\b\w/g,x=>x.toUpperCase()):c==='sentence'?s.charAt(0).toUpperCase()+s.slice(1):s;
TOOLS.numwords={live:true,noAdv:true,goLabel:()=>T.download,
 opts:()=>inp('nwval',T.o_value||'Number','text','1234567.89','inputmode="decimal" autocomplete="off"')+sel('nwsys','Number system',[['intl','International (thousand, million, billion)'],['ind','Indian (lakh, crore)']])+sel('nwcase','Letter case',[['sentence','Sentence case'],['lower','lower case'],['title','Title Case'],['upper','UPPER CASE']])+sel('nwcur','Cheque currency',[['USD','Dollars / cents'],['GBP','Pounds / pence'],['EUR','Euros / cents'],['INR','Rupees / paise'],['AUD','Australian dollars / cents'],['CAD','Canadian dollars / cents'],['none','No currency']]),
 setup(){const el=document.createElement('div');el.innerHTML='<p class="ubig" id="nwbig" style="font-size:1.25em;line-height:1.5"></p><table class="dtab" id="nwtab" style="width:100%"></table>';return el;},
 conv(raw,sys,cs,cur){let s=String(raw).trim().replace(/[,\s_']/g,'');const neg=s.startsWith('-');if(neg)s=s.slice(1);if(!/^\d+(\.\d+)?$/.test(s)&&!/^\.\d+$/.test(s)){const e=new Error('Enter a number such as 1250 or 99.75');e.soft=true;throw e;}
  let [ip,fp='']=s.split('.');ip=ip||'0';const ind=sys==='ind';const I=BigInt(ip);const w=(neg?'minus ':'')+nwInt(I,ind);
  const dec=fp?w+' point '+fp.split('').map(d=>NW1[+d]).join(' '):w;
  const C={USD:['dollar','dollars','cent','cents'],GBP:['pound','pounds','penny','pence'],EUR:['euro','euros','cent','cents'],INR:['rupee','rupees','paisa','paise'],AUD:['dollar','dollars','cent','cents'],CAD:['dollar','dollars','cent','cents']}[cur];
  let cheque='';if(C){const c2=Math.round(Number('0.'+(fp||'0'))*100);const cc=c2===100?0:c2;const II=c2===100?I+1n:I;cheque=(neg?'minus ':'')+nwInt(II,ind)+' '+(II===1n?C[0]:C[1])+(cc?' and '+nwInt(BigInt(cc),ind)+' '+(cc===1?C[2]:C[3]):'')+' only';}
  const rows=[['Words',nwCase(dec,cs)]];if(cheque)rows.push(['Cheque / invoice',nwCase(cheque,cs)],['Cheque (fraction style)',nwCase((neg?'minus ':'')+nwInt(I,ind)+' and '+String(Math.round(Number('0.'+(fp||'0'))*100)).padStart(2,'0')+'/100 '+C[1],cs)]);
  if(!fp&&!neg&&I>0n)rows.push(['Ordinal',nwCase(nwOrd(w),cs)]);
  rows.push(['Digits',(neg?'-':'')+(ind?ip.replace(/(\d)(?=(\d\d)+\d$)/g,'$1,'):ip.replace(/\B(?=(\d{3})+(?!\d))/g,','))+(fp?'.'+fp:'')]);if(ip.length>3)rows.push(['Scientific',(neg?'-':'')+ip[0]+'.'+(ip.slice(1,4)).replace(/0+$/,'')+' × 10^'+(ip.length-1)]);
  return rows;},
 run(){const rows=this.conv(v('nwval'),v('nwsys'),v('nwcase'),v('nwcur'));const big=$('#nwbig',work);if(big)big.textContent=rows[0][1];const tb=$('#nwtab',work);if(tb)tb.innerHTML=rows.slice(1).map(([k,x])=>`<tr><td><b>${esc(k)}</b></td><td>${esc(x)}</td></tr>`).join('');
  return {blob:new Blob([rows.map(([k,x])=>k+': '+x).join('\n')+'\n'],{type:'text/plain'}),name:'number-in-words.txt',info:rows[0][1].slice(0,120)};}};
