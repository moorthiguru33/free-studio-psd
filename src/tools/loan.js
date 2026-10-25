// @needs txt
const CUR=[['$','$ (USD, CAD, AUD…)'],['€','€ (EUR)'],['£','£ (GBP)'],['₹','₹ (INR)'],['¥','¥ (JPY, CNY)'],['R$','R$ (BRL)'],['','No symbol']];
TOOLS.loan={live:true,noAdv:true,
 opts:()=>inp('lnp','Loan amount','text','300000','inputmode="decimal"')+inp('lnr','Annual interest rate (%)','text','6.5','inputmode="decimal"')+inp('lny','Term (years)','text','30','inputmode="decimal"')+sel('lnf','Payments',[['12','Monthly'],['26','Every two weeks'],['52','Weekly'],['4','Quarterly']])+inp('lnx','Extra payment each period','text','0','inputmode="decimal"')+inp('lnd','Down payment (optional)','text','0','inputmode="decimal"')+sel('lnc','Currency',CUR),
 setup(){return box(`<div id="lnout"></div>`);},
 run(){const P0=num('lnp'),dn=num('lnd')||0,r=num('lnr')/100,yrs=num('lny'),f=+v('lnf'),ex=num('lnx')||0,c=v('lnc');const P=P0-dn;if(!(P>0)||!(yrs>0)||!(r>=0))throw soft('Enter amount, rate and term.');
  const n=Math.round(yrs*f),i=r/f;const pay=i?P*i/(1-Math.pow(1+i,-n)):P/n;const m=x=>c+nf(x,2);
  let bal=P,tot=0,ti=0,k=0;const rows=[];while(bal>0.005&&k<n+1){k++;const int=bal*i;let pr=Math.min(bal,pay-int+ex);bal-=pr;ti+=int;tot+=int+pr;rows.push([k,int+pr,pr,int,Math.max(0,bal)]);}
  const yr=[];for(let y=0;y*f<rows.length;y++){const s=rows.slice(y*f,(y+1)*f);yr.push([y+1,s.reduce((a,q)=>a+q[2],0),s.reduce((a,q)=>a+q[3],0),s[s.length-1][4]]);}
  const saved=ex?((i?P*i/(1-Math.pow(1+i,-n)):P/n)*n-P)-ti:0;
  setHTML('lnout',`<p class="bigres">Payment <b>${m(pay+ex)}</b> <small>/ ${({12:'month',26:'2 weeks',52:'week',4:'quarter'})[f]}</small></p>`+stats([['Loan amount',m(P)],['Total interest',m(ti)],['Total paid',m(tot)],['Number of payments',`${rows.length}${ex?` (instead of ${n})`:''}`],['Payoff time',`${Math.floor(rows.length/f)} years ${Math.round(rows.length%f*12/f)} months`],...(ex?[['Interest saved by extra payments',m(saved)]]:[])])+
   `<div class="lnbar"><i style="width:${P/tot*100}%"></i></div><p class="hint">■ principal ${nf(P/tot*100,0)}% · interest ${nf(ti/tot*100,0)}%</p><h3>Amortisation by year</h3><div class="tdw"><table class="kv amort"><tr><th>Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr>${yr.map(q=>`<tr><td>${q[0]}</td><td>${m(q[1])}</td><td>${m(q[2])}</td><td>${m(q[3])}</td></tr>`).join('')}</table></div>`);
  const csv='Payment,Amount,Principal,Interest,Balance\n'+rows.map(q=>q.map((x,j)=>j?x.toFixed(2):x).join(',')).join('\n')+'\n';return {...txtOut('amortization-schedule.csv',csv,'text/csv'),info:`${m(pay+ex)} per period · total interest ${m(ti)}`};}};
