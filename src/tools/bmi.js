// @needs txt
const CAT=[[16,'Severe thinness','#b3261e'],[17,'Moderate thinness','#e07b00'],[18.5,'Mild thinness (underweight)','#e0a800'],[25,'Normal weight','#0b7a43'],[30,'Overweight (pre-obese)','#e0a800'],[35,'Obesity class I','#e07b00'],[40,'Obesity class II','#c8201b'],[1e9,'Obesity class III','#8e0000']];
TOOLS.bmi={live:true,noAdv:true,
 opts:()=>sel('bmu','Units',[['m','Metric (kg, cm)'],['i','Imperial (lb, ft + in)']])+inp('bmw','Weight (kg)','text','70','inputmode="decimal"')+inp('bmh','Height (cm)','text','175','inputmode="decimal"')+inp('bmin','Inches (imperial only)','text','0','inputmode="decimal"')+chk('bmasia','Use Asian cut-offs (WHO expert consultation)',false),
 setup(){const el=box(`<div id="bmout"></div>`);if(!this.b){this.b=1;work.addEventListener('change',e=>{if(e.target.id==='bmu'){const i=e.target.value==='i';$('#bmw',work).value=i?'154':'70';$('#bmh',work).value=i?'5':'175';$('#bmin',work).value=i?'9':'0';}});}return el;},
 run(){const i=v('bmu')==='i';$('#bmw',work).previousSibling.textContent=i?'Weight (lb)':'Weight (kg)';$('#bmh',work).previousSibling.textContent=i?'Height (feet)':'Height (cm)';
  let w=num('bmw'),h=num('bmh');const inch=num('bmin')||0;if(!(w>0)||!(h>0))throw soft('Enter weight and height.');if(i){w*=0.45359237;h=(h*12+inch)*2.54;}const hm=h/100;const bmi=w/hm/hm;
  let cats=CAT;if(vb('bmasia'))cats=[[18.5,'Underweight','#e0a800'],[23,'Normal weight','#0b7a43'],[27.5,'Overweight (increased risk)','#e07b00'],[1e9,'Obese (high risk)','#c8201b']];
  const c=cats.find(x=>bmi<x[0]);const lo=18.5*hm*hm,hi=(vb('bmasia')?23:25)*hm*hm;const u=x=>i?nf(x/0.45359237,1)+' lb':nf(x,1)+' kg';
  const pos=Math.max(0,Math.min(100,(bmi-12)/(42-12)*100));
  setHTML('bmout',`<p class="bigres">BMI <b>${bmi.toFixed(1)}</b> <span class="pill" style="background:${c[2]}">${esc(c[1])}</span></p><div class="bmibar"><i style="left:${pos}%"></i></div>`+stats([['Healthy weight for your height',`${u(lo)} – ${u(hi)}`],['BMI Prime',(bmi/(vb('bmasia')?23:25)).toFixed(2)],['Height',`${nf(h,1)} cm / ${Math.floor(h/2.54/12)} ft ${nf(h/2.54%12,1)} in`],['Weight',`${nf(w,1)} kg / ${nf(w/0.45359237,1)} lb`]])+`<p class="hint">BMI is a screening measure for adults (18+). It does not distinguish muscle from fat; ask a health professional for advice.</p>`);
  const t=`BMI ${bmi.toFixed(1)} – ${c[1]}`;return {...txtOut('bmi.txt',t+'\n'),info:t};}};
