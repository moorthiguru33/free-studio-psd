// @needs txt
// Text to handwriting: renders text with OFL handwriting fonts on paper-like pages (PNG or PDF)
const HW=[['caveat','Caveat'],['indie-flower','Indie Flower'],['kalam','Kalam'],['homemade-apple','Homemade Apple'],['dancing-script','Dancing Script'],['great-vibes','Great Vibes']];
const fonts={};const loadFont=k=>fonts[k]||(fonts[k]=new FontFace('hw-'+k,`url(/fonts/hw-${k}.woff2)`).load().then(f=>{document.fonts.add(f);return f;}));
const PAPER={a4:[1240,1754],letter:[1275,1650]};
async function renderPages(text,o){await loadFont(o.font);const [W,H]=PAPER[o.size];const fs=o.fs,lh=Math.round(fs*o.ls),top=150,left=o.paper==='blank'?110:170,right=W-100,bottom=H-110;
 const pages=[];let c,x,y;const rnd=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647;})();
 const newPage=()=>{c=document.createElement('canvas');c.width=W;c.height=H;x=c.getContext('2d');x.fillStyle=o.paper==='yellow'?'#fdf7d2':'#fffefa';x.fillRect(0,0,W,H);
  if(o.paper!=='blank'){x.strokeStyle='rgba(80,130,200,.35)';x.lineWidth=2;for(let yy=top+lh*0.25;yy<H-60;yy+=lh){x.beginPath();x.moveTo(0,yy);x.lineTo(W,yy);x.stroke();}
   if(o.paper==='grid'){for(let xx=0;xx<W;xx+=lh){x.beginPath();x.moveTo(xx,0);x.lineTo(xx,H);x.stroke();}}else{x.strokeStyle='rgba(220,60,60,.55)';x.beginPath();x.moveTo(left-25,0);x.lineTo(left-25,H);x.stroke();}}
  x.font=`${fs}px "hw-${o.font}"`;x.fillStyle=o.ink;x.textBaseline='alphabetic';y=top;pages.push(c);};
 newPage();const sp=x.measureText(' ').width;
 for(const para of text.split(/\r?\n/)){let cx=left;const words=para.split(/(\s+)/).filter(w=>w!=='');if(!words.length){y+=lh;if(y>bottom)newPage();continue;}
  for(const w of words){if(/^\s+$/.test(w)){cx+=sp*w.length;continue;}const ww=x.measureText(w).width;if(cx+ww>right&&cx>left){cx=left;y+=lh;if(y>bottom)newPage();}
   for(const ch of w){const j=o.jitter;x.save();x.translate(cx,y+(rnd()-.5)*j*3);x.rotate((rnd()-.5)*j*0.05);x.globalAlpha=1-rnd()*j*0.15;x.fillText(ch,0,0);x.restore();cx+=x.measureText(ch).width+(rnd()-.5)*j;}}
  y+=lh;if(y>bottom)newPage();}
 if(pages.length>1){const last=pages[pages.length-1];if(y===top)pages.pop();}return pages;}
const opt=()=>({font:v('hwfont'),ink:v('hwink'),paper:v('hwpaper'),size:v('hwsize'),fs:+v('hwfs')||44,ls:+v('hwls')||1.5,jitter:(+v('hwj')||0)/5});
TOOLS.handwriting={noAdv:true,goLabel:()=>'Create handwriting',
 opts:()=>sel('hwfont','Handwriting style',HW)+`<label>Ink colour<select id="hwink"><option value="#1a3a8f">Blue pen</option><option value="#1b1b1b">Black pen</option><option value="#b3261e">Red pen</option><option value="#4a4a4a">Pencil</option></select></label>`+sel('hwpaper','Paper',[['lined','Lined (ruled)'],['blank','Plain'],['grid','Grid / squared'],['yellow','Yellow legal pad']])+sel('hwsize','Page size',[['a4','A4'],['letter','US Letter']])+inp('hwfs','Font size','number','44','min="20" max="90"')+inp('hwls','Line spacing','number','1.5','min="1" max="3" step="0.1"')+inp('hwj','Natural variation (0-5)','number','2','min="0" max="5"')+sel('hwfmt','Download as',[['pdf','PDF (all pages)'],['png','PNG image (first page)']]),
 setup(){const el=box(area('hwtext','Your text',"Dear friend,\nThis note was written with the free Text to Handwriting tool. It works entirely in your browser.\n\nBest wishes",8)+`<p class="hint">Preview</p><div id="hwprev" class="hwprev"></div>`);
  let tm;const upd=async()=>{try{const p=await renderPages(v('hwtext')||' ',opt());const pv=$('#hwprev',work);pv.innerHTML='';const im=p[0];im.style.cssText='width:100%;height:auto;box-shadow:0 2px 10px rgba(0,0,0,.15)';pv.appendChild(im);}catch(e){}};
  if(!this.b){this.b=1;work.addEventListener('input',e=>{if(/^hw/.test(e.target.id)){clearTimeout(tm);tm=setTimeout(upd,300);}});work.addEventListener('change',e=>{if(/^hw/.test(e.target.id))upd();});}setTimeout(upd,0);return el;},
 async run(){const pages=await renderPages(v('hwtext')||' ',opt());if(v('hwfmt')==='png')return {name:'handwriting.png',blob:await toBlob(pages[0],'image/png'),info:`${pages.length} page(s)`};
  const P=await L.pdflib();const d=await P.PDFDocument.create();const sz=v('hwsize')==='a4'?[595.28,841.89]:[612,792];
  for(const c of pages){const img=await d.embedJpg(await (await toBlob(c,'image/jpeg',.9)).arrayBuffer());d.addPage(sz).drawImage(img,{x:0,y:0,width:sz[0],height:sz[1]});}
  return {name:'handwriting.pdf',blob:pdfBlob(await d.save()),info:`${pages.length} page(s)`};}};
