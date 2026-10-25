// @needs txt
const iso=d=>d.toISOString().slice(0,10);const pd=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?new Date(Date.UTC(+m[1],m[2]-1,+m[3])):null;};
function ymd(a,b){let y=b.getUTCFullYear()-a.getUTCFullYear(),m=b.getUTCMonth()-a.getUTCMonth(),d=b.getUTCDate()-a.getUTCDate();if(d<0){m--;d+=new Date(Date.UTC(b.getUTCFullYear(),b.getUTCMonth(),0)).getUTCDate();}if(m<0){y--;m+=12;}return [y,m,d];}
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
TOOLS.age={live:true,noAdv:true,
 opts:()=>inp('agdob','Date of birth','date','1990-05-15')+inp('agat','Age on date','date',new Date().toISOString().slice(0,10)),
 setup(){return box(`<div id="agout"></div>`);},
 run(){const a=pd(v('agdob')),b=pd(v('agat'));if(!a||!b)throw soft('Enter both dates.');if(a>b)throw soft('The date of birth must be before the second date.');
  const [y,m,d]=ymd(a,b);const days=Math.round((b-a)/864e5);let nb=new Date(Date.UTC(b.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate()));if(a.getUTCMonth()===1&&a.getUTCDate()===29&&nb.getUTCMonth()!==1)nb=new Date(Date.UTC(b.getUTCFullYear(),2,1));if(nb<b)nb=new Date(Date.UTC(b.getUTCFullYear()+1,a.getUTCMonth(),a.getUTCDate()));const toNb=Math.round((nb-b)/864e5);
  const rows=[['Age',`${y} years, ${m} months, ${d} days`],['Total months',nf(y*12+m)],['Total weeks',`${nf(Math.floor(days/7))} weeks ${days%7} days`],['Total days',nf(days)],['Total hours (approx.)',nf(days*24)],['Born on a',DAYS[a.getUTCDay()]],['Next birthday',`${iso(nb)} (${DAYS[nb.getUTCDay()]}) – ${toNb===0?'today! 🎉':'in '+toNb+' days'}, turning ${nb.getUTCFullYear()-a.getUTCFullYear()}`]];
  setHTML('agout',`<p class="bigres"><b>${y}</b> years <b>${m}</b> months <b>${d}</b> days</p>`+stats(rows.slice(1)));return {...txtOut('age.txt',rows.map(r=>r.join(': ')).join('\n')+'\n'),info:rows[0][1]};}};
