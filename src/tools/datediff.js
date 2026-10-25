// @needs txt
const pd=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?new Date(Date.UTC(+m[1],m[2]-1,+m[3])):null;};const iso=d=>d.toISOString().slice(0,10);
const DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function ymd(a,b){let y=b.getUTCFullYear()-a.getUTCFullYear(),m=b.getUTCMonth()-a.getUTCMonth(),d=b.getUTCDate()-a.getUTCDate();if(d<0){m--;d+=new Date(Date.UTC(b.getUTCFullYear(),b.getUTCMonth(),0)).getUTCDate();}if(m<0){y--;m+=12;}return [y,m,d];}
TOOLS.datediff={live:true,noAdv:true,
 opts:()=>{const t=new Date();const a=t.toISOString().slice(0,10);t.setDate(t.getDate()+100);return inp('ddA','Start date','date',a)+inp('ddB','End date','date',t.toISOString().slice(0,10))+chk('ddinc','Include the end date (+1 day)',false)+sel('ddwk','Weekend days (for working days)',[['06','Saturday + Sunday'],['56','Friday + Saturday'],['5','Friday only'],['0','Sunday only'],['','None']])+inp('ddhol','Holidays to exclude (YYYY-MM-DD, comma separated)','text','')+inp('ddadd','Add / subtract days from start date','number','30');},
 setup(){return box(`<div id="ddout"></div>`);},
 run(){let a=pd(v('ddA')),b=pd(v('ddB'));if(!a||!b)throw soft('Choose two dates.');let sign=1;if(a>b){[a,b]=[b,a];sign=-1;}const inc=vb('ddinc')?1:0;
  const days=Math.round((b-a)/864e5)+inc;const [y,m,d]=ymd(a,new Date(+b+inc*864e5));const wk=new Set((v('ddwk')||'').split('').map(Number));const hol=new Set((v('ddhol')||'').split(/[,\s]+/).filter(Boolean));
  let work_=0,wkend=0;for(let t=+a;t<+b+inc*864e5;t+=864e5){const D=new Date(t);if(wk.has(D.getUTCDay()))wkend++;else if(!hol.has(iso(D)))work_++;}
  const add=+v('ddadd')||0;const ad=new Date(+pd(v('ddA'))+add*864e5);
  const rows=[['Years, months, days',`${y} y ${m} m ${d} d`],['Total days',nf(sign*days)],['Weeks',`${Math.floor(days/7)} weeks ${days%7} days`],['Months (approx.)',nf(days/30.436875,2)],['Working days',nf(work_)],['Weekend days',nf(wkend)],['Hours',nf(days*24)],[`${v('ddA')} ${add>=0?'+':'−'} ${Math.abs(add)} days`,`${iso(ad)} (${DN[ad.getUTCDay()]})`]];
  setHTML('ddout',`<p class="bigres"><b>${nf(days)}</b> days</p>`+stats(rows));return {...txtOut('date-difference.txt',rows.map(r=>r.join(': ')).join('\n')+'\n'),info:`${days} days · ${work_} working days`};}};
