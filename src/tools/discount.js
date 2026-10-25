// @needs txt
TOOLS.discount={live:true,noAdv:true,
 opts:()=>inp('dsp','Original price','text','80','inputmode="decimal"')+inp('dsd','Discount (%)','text','25','inputmode="decimal"')+inp('dsd2','Extra discount on top (%)','text','0','inputmode="decimal"')+inp('dst','Sales tax / VAT (%)','text','0','inputmode="decimal"')+sel('dstm','Tax',[['add','Added at checkout (US style)'],['incl','Already included in price (VAT style)']])+inp('dsc','Currency symbol','text','$'),
 setup(){return box(`<div id="dsout"></div><h3>Reverse: what discount is this?</h3><div class="two"><label>Original price<input id="dsr1" type="text" inputmode="decimal" placeholder="120"></label><label>Sale price<input id="dsr2" type="text" inputmode="decimal" placeholder="90"></label></div><p id="dsrev" class="hint"></p>`);},
 run(){const p=num('dsp'),d1=num('dsd')||0,d2=num('dsd2')||0,t=num('dst')||0,c=v('dsc')||'';if(!(p>=0))throw soft('Enter a price.');
  const a1=p*(1-d1/100),fin=a1*(1-d2/100);const eff=p?(1-fin/p)*100:0;const tax=v('dstm')==='add'?fin*t/100:fin-fin/(1+t/100);const total=v('dstm')==='add'?fin+tax:fin;const m=x=>c+nf(x,2);
  setHTML('dsout',`<p class="bigres">You pay <b>${m(total)}</b> <small>save ${m(p-fin)}</small></p>`+stats([['Price after discount',m(fin)],['You save',`${m(p-fin)} (${nf(eff,2)}%)`],...(d2?[['Effective discount',`${nf(eff,2)}% (not ${nf(d1+d2,2)}%)`]]:[]),...(t?[[v('dstm')==='add'?'Tax added':'Tax included',m(tax)]]:[]),['Final price',m(total)]]));
  const r1=num('dsr1'),r2=num('dsr2');$('#dsrev',work).textContent=r1>0&&r2>=0?`${c}${nf(r1,2)} → ${c}${nf(r2,2)} is a ${nf((1-r2/r1)*100,2)}% discount (you save ${c}${nf(r1-r2,2)}).`:'';
  const s=`${m(p)} − ${nf(eff,2)}% = ${m(fin)}${t?`, total ${m(total)}`:''}`;return {...txtOut('discount.txt',s+'\n'),info:s};}};
