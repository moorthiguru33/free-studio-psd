// @needs txt
const parse=s=>{s=String(s||'').trim();const m=s.match(/^cmyk\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i);if(m){const [c,y0,k]=[+m[1]/100,+m[3]/100,+m[4]/100],mm=+m[2]/100;return [255*(1-c)*(1-k),255*(1-mm)*(1-k),255*(1-y0)*(1-k)].map(Math.round);}
 const hsv=s.match(/^hsv\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i);if(hsv){let h=+hsv[1]/60,S=+hsv[2]/100,V=+hsv[3]/100;const c=V*S,x=c*(1-Math.abs(h%2-1)),o=V-c;const t=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h)%6];return t.map(q=>Math.round((q+o)*255));}
 if(/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s))s='#'+s;const x=document.createElement('canvas').getContext('2d');x.fillStyle='#010203';x.fillStyle=s;const f=x.fillStyle;if(f==='#010203'&&!/^#?010203$/i.test(s))return null;x.fillRect(0,0,1,1);const d=x.getImageData(0,0,1,1).data;return [d[0],d[1],d[2]];};
const toHex=c=>'#'+c.map(q=>q.toString(16).padStart(2,'0')).join('').toUpperCase();
const toHsl=([r,g,b])=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;}return [Math.round(h),Math.round(s*100),Math.round(l*100)];};
const toHsv=([r,g,b])=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;}return [Math.round(h),Math.round(mx?d/mx*100:0),Math.round(mx*100)];};
const toCmyk=([r,g,b])=>{const k=1-Math.max(r,g,b)/255;if(k>=1)return [0,0,0,100];return [r,g,b].map(q=>Math.round((1-q/255-k)/(1-k)*100)).concat(Math.round(k*100));};
const lum=c=>{const [r,g,b]=c.map(q=>{q/=255;return q<=.03928?q/12.92:((q+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};
const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);};
const mix=(c,t,p)=>c.map((q,i)=>Math.round(q+(t[i]-q)*p));
TOOLS.colorconv={live:true,noAdv:true,
 opts:()=>inp('ccin','Colour (HEX, RGB, HSL, HSV, CMYK or name)','text','#1A68C4')+`<label>Pick a colour<input type="color" id="ccpick" value="#1a68c4"></label>`,
 setup(){const el=box(`<div id="ccout"></div>`);if(!this.b){this.b=1;work.addEventListener('input',e=>{if(e.target.id==='ccpick')$('#ccin',work).value=e.target.value;});}return el;},
 run(){const c=parse(v('ccin'));if(!c)throw soft('Unrecognised colour. Try #FF8800, rgb(255,136,0), hsl(32,100%,50%) or “tomato”.');const hx=toHex(c),[h,s,l]=toHsl(c),[H,S,V]=toHsv(c),[C,M,Y,K]=toCmyk(c);
  if($('#ccpick',work)&&document.activeElement?.id!=='ccpick')$('#ccpick',work).value=hx.toLowerCase();
  const rows=[['HEX',hx],['RGB',`rgb(${c.join(', ')})`],['HSL',`hsl(${h}, ${s}%, ${l}%)`],['HSV / HSB',`hsv(${H}, ${S}%, ${V}%)`],['CMYK',`cmyk(${C}%, ${M}%, ${Y}%, ${K}%)`],['CSS rgb (modern)',`rgb(${c.join(' ')})`],['Android / ARGB','#FF'+hx.slice(1)],['Decimal',String(c[0]*65536+c[1]*256+c[2])]];
  const W=ratio(c,[255,255,255]),B=ratio(c,[0,0,0]);const g=r=>r>=7?'AAA':r>=4.5?'AA':r>=3?'AA large':'Fail';
  const sw=[...[.8,.6,.4,.2].map(p=>mix(c,[255,255,255],p)),c,...[.2,.4,.6,.8].map(p=>mix(c,[0,0,0],p))].map(q=>`<button type="button" class="sw" data-copy="${toHex(q)}" style="background:${toHex(q)}" title="${toHex(q)}"></button>`).join('');
  setHTML('ccout',`<div class="ccbig" style="background:${hx}"><span style="color:${W>B?'#fff':'#000'}">${hx}</span></div><table class="kv">${rows.map(([k,x],i)=>`<tr><th>${k}</th><td><code id="cc${i}">${esc(x)}</code></td><td>${copyBtn('cc'+i)}</td></tr>`).join('')}</table><h3>Contrast (WCAG)</h3><p>On white: <b>${W.toFixed(2)}:1</b> (${g(W)}) · On black: <b>${B.toFixed(2)}:1</b> (${g(B)})</p><h3>Tints and shades</h3><div class="sws">${sw}</div>`);
  return {...txtOut('colour.txt',rows.map(r=>r.join(': ')).join('\n')+'\n'),info:hx};}};
