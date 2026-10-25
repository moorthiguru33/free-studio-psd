// PPTX / ODP -> slide canvases (rendered by the browser, so every script incl. CJK/RTL/Indic uses system fonts).
// Supports: slide size, solid/image backgrounds (slide→layout→master), positioned text boxes & placeholders with
// inherited positions and master text sizes, runs (size/bold/italic/colour), alignment, vertical anchor, autofit scale,
// bullets, pictures, rect/ellipse/roundRect fills + outlines, groups, simple tables. Not supported: charts, SmartArt, animations, gradients (first stop used).
(function(){
const NS={a:'http://schemas.openxmlformats.org/drawingml/2006/main',p:'http://schemas.openxmlformats.org/presentationml/2006/main',r:'http://schemas.openxmlformats.org/officeDocument/2006/relationships'};
const P=s=>new DOMParser().parseFromString(s,'application/xml');
const kids=(n,ln)=>n?[...n.childNodes].filter(c=>c.nodeType===1&&(!ln||c.localName===ln)):[];
const kid=(n,ln)=>kids(n,ln)[0];const path=(n,...ls)=>{for(const l of ls){n=kid(n,l);if(!n)return null}return n};
const all=(n,ln)=>n?[...n.getElementsByTagNameNS('*',ln)]:[];
const dir=p=>p.replace(/[^/]*$/,'');const norm=p=>{const o=[];for(const s of p.split('/')){if(s==='..')o.pop();else if(s&&s!=='.')o.push(s)}return o.join('/')};
const RTL=/[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/;const CJK=/[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\u3040-\u30ff]/;
function tokens(t){const o=[];let cur='';for(const ch of t){if(/\s/.test(ch)){if(cur)o.push(cur);o.push(ch);cur=''}else if(CJK.test(ch)){if(cur)o.push(cur);o.push(ch);cur=''}else cur+=ch}if(cur)o.push(cur);return o}
const font=r=>`${r.i?'italic ':''}${r.b?'bold ':''}${Math.max(1,r.size)}px ${r.face?JSON.stringify(r.face)+',':''}Arial,"Helvetica Neue","Noto Sans","Noto Sans CJK SC","Noto Sans Arabic","Noto Sans Devanagari",sans-serif`;
// paras: [{runs:[{t,size(px),b,i,color,face}],align:'l'|'ctr'|'r'|'just',bullet,indent(px)}]
function drawText(x,box,paras,anchor,ins){const W=box.w-ins.l-ins.r;const lines=[];
 for(const p of paras){let line=[],lw=0;const ind=p.indent||0;let first=true;const push=()=>{lines.push({items:line,w:lw,align:p.align,rtl:p.rtl,h:Math.max(...line.map(i=>i.r.size),p.size||12)*1.18,ind:first?ind-(p.bullet?Math.min(ind,(p.size||12)*0.9):0):ind});line=[];lw=0;first=false};
  const runs=[...p.runs];if(p.bullet&&runs.length)runs.unshift({...runs[0],t:p.bullet+' '});
  if(!runs.length||runs.every(r=>!r.t)){lines.push({items:[],w:0,h:(p.size||12)*1.18,align:p.align,ind:0});continue}
  for(const r of runs){for(const seg of r.t.split('\n').flatMap((s,k)=>k?['\n',s]:[s])){if(seg==='\n'){push();continue}for(const tk of tokens(seg)){x.font=font(r);const w=x.measureText(tk).width;if(lw+w>W-ind&&line.length&&!/^\s+$/.test(tk)){push();if(/^\s+$/.test(tk))continue}line.push({t:tk,r,w});lw+=w}}}if(line.length||first)push()}
 const th=lines.reduce((s,l)=>s+l.h,0);let y=box.y+ins.t+(anchor==='ctr'?(box.h-ins.t-ins.b-th)/2:anchor==='b'?box.h-ins.t-ins.b-th:0);
 for(const l of lines){let xx=box.x+ins.l+l.ind;const lw=l.items.reduce((s,i)=>s+i.w,0);const rtl=l.rtl||l.items.some(i=>RTL.test(i.t));const al=l.align||(rtl?'r':'l');if(al==='ctr')xx+=(W-l.ind-lw)/2;else if(al==='r')xx+=W-l.ind-lw;
  x.textBaseline='alphabetic';const base=y+l.h*0.82;if(rtl){x.direction='rtl';x.textAlign='right';let r0=xx+lw;for(const it of l.items){x.font=font(it.r);x.fillStyle=it.r.color||'#000';x.fillText(it.t,r0,base);if(it.r.u)x.fillRect(r0-it.w,base+2,it.w,Math.max(1,it.r.size/14));r0-=it.w}x.direction='ltr';x.textAlign='left'}
  else for(const it of l.items){x.font=font(it.r);x.fillStyle=it.r.color||'#000';x.fillText(it.t,xx,base);if(it.r.u)x.fillRect(xx,base+2,it.w,Math.max(1,it.r.size/14));xx+=it.w}y+=l.h}}
function shape(x,b,geom,fill,line,lw){x.beginPath();if(geom==='ellipse')x.ellipse(b.x+b.w/2,b.y+b.h/2,Math.abs(b.w/2),Math.abs(b.h/2),0,0,7);else if(geom==='roundRect'&&x.roundRect)x.roundRect(b.x,b.y,b.w,b.h,Math.min(b.w,b.h)*0.1667);else x.rect(b.x,b.y,b.w,b.h);if(fill){x.fillStyle=fill;x.fill()}if(line){x.strokeStyle=line;x.lineWidth=lw||1;x.stroke()}}
async function imgFrom(z,p){const f=z.file(p);if(!f)return null;let b=await f.async('blob');const ext=p.split('.').pop().toLowerCase();if(/^(emf|wmf|tif|tiff)$/.test(ext))return null;if(ext==='svg')b=new Blob([await b.text()],{type:'image/svg+xml'});try{return await createImageBitmap(b)}catch(e){try{const u=URL.createObjectURL(b);const I=new Image();I.src=u;await I.decode();return I}catch(_){return null}}}
function newC(w,h){const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);return c}

// ---------- PPTX ----------
async function pptx(z,TW){const rd=async p=>{const f=z.file(p);return f?P(await f.async('string')):null};
 const rels=async p=>{const d=await rd(dir(p)+'_rels/'+p.split('/').pop()+'.rels');const m={};if(d)for(const r of all(d,'Relationship'))m[r.getAttribute('Id')]={t:r.getAttribute('TargetMode')==='External'?null:norm(dir(p)+r.getAttribute('Target')),type:r.getAttribute('Type')};return m};
 const pres=await rd('ppt/presentation.xml');if(!pres)throw new Error('not a PowerPoint file');const sz=all(pres,'sldSz')[0];const CX=+(sz?.getAttribute('cx')||12192000),CY=+(sz?.getAttribute('cy')||6858000);
 const pr=await rels('ppt/presentation.xml');const order=all(pres,'sldId').map(s=>pr[s.getAttributeNS(NS.r,'id')]?.t).filter(Boolean);
 const S=TW/CX,H=CY*S;const out=[];const cache={};
 const getPart=async p=>cache[p]||(cache[p]=(async()=>{const d=await rd(p);return {d,rel:await rels(p),p}})());
 for(const sp of order){const slide=await getPart(sp);if(!slide.d)continue;const layP=Object.values(slide.rel).find(r=>/slideLayout$/.test(r.type))?.t;const lay=layP?await getPart(layP):null;
  const masP=lay&&Object.values(lay.rel).find(r=>/slideMaster$/.test(r.type))?.t;const mas=masP?await getPart(masP):null;
  const thP=mas&&Object.values(mas.rel).find(r=>/theme$/.test(r.type))?.t;const th=thP?await getPart(thP):null;const scheme={};
  if(th?.d)for(const c of kids(all(th.d,'clrScheme')[0])){const v=kid(c,'srgbClr')?.getAttribute('val')||kid(c,'sysClr')?.getAttribute('lastClr');if(v)scheme[c.localName]='#'+v}
  const cmap=mas?.d&&all(mas.d,'clrMap')[0];const mapC=n=>{const m={tx1:'dk1',bg1:'lt1',tx2:'dk2',bg2:'lt2'};const k=m[n]?(cmap?.getAttribute(n)||m[n]):n;return scheme[k]||scheme[n]};
  const color=n=>{if(!n)return null;const c=kid(n,'srgbClr')||kid(n,'schemeClr')||kid(n,'sysClr')||kid(n,'prstClr');if(!c)return null;let hex=c.localName==='srgbClr'?'#'+c.getAttribute('val'):c.localName==='schemeClr'?mapC(c.getAttribute('val')):c.localName==='sysClr'?'#'+(c.getAttribute('lastClr')||'000000'):({black:'#000000',white:'#ffffff',red:'#ff0000'}[c.getAttribute('val')]||'#000000');if(!hex)return null;
   let [r,g,b]=[1,3,5].map(i=>parseInt(hex.substr(i,2),16));for(const m of kids(c)){const v=+m.getAttribute('val')/100000;if(m.localName==='lumMod'){r*=v;g*=v;b*=v}else if(m.localName==='lumOff'){r+=255*v;g+=255*v;b+=255*v}else if(m.localName==='tint'){r=r+(255-r)*(1-v);g=g+(255-g)*(1-v);b=b+(255-b)*(1-v)}else if(m.localName==='shade'){r*=v;g*=v;b*=v}}
   const al=kid(c,'alpha');const cl=x=>Math.max(0,Math.min(255,Math.round(x)));return al?`rgba(${cl(r)},${cl(g)},${cl(b)},${+al.getAttribute('val')/100000})`:`rgb(${cl(r)},${cl(g)},${cl(b)})`};
  const fillOf=spPr=>{if(!spPr||kid(spPr,'noFill'))return null;const sf=kid(spPr,'solidFill');if(sf)return color(sf);const gf=kid(spPr,'gradFill');if(gf){const gs=all(gf,'gs');return color(gs[Math.floor(gs.length/2)]||gs[0])}return undefined};
  const c=newC(TW,H);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,TW,H);
  // background
  for(const part of [slide,lay,mas]){const bg=part?.d&&all(part.d,'bg')[0];if(!bg)continue;const bp=kid(bg,'bgPr');if(bp){const bl=all(bp,'blip')[0];if(bl){const im=await imgFrom(z,part.rel[bl.getAttributeNS(NS.r,'embed')]?.t||'');if(im){x.drawImage(im,0,0,TW,H);break}}const f=fillOf(bp);if(f){x.fillStyle=f;x.fillRect(0,0,TW,H);break}}const br=kid(bg,'bgRef');if(br){const f=color(br);if(f){x.fillStyle=f;x.fillRect(0,0,TW,H)}break}}
  const phOf=n=>{const ph=all(path(n,'nvSpPr','nvPr')||path(n,'nvPicPr','nvPr')||n,'ph')[0];return ph?{type:ph.getAttribute('type')||'body',idx:ph.getAttribute('idx')}:null};
  const findPh=(part,ph)=>{if(!part?.d||!ph)return null;const sps=all(part.d,'sp');return sps.find(s=>{const p=phOf(s);return p&&ph.idx!=null&&p.idx===ph.idx})||sps.find(s=>{const p=phOf(s);return p&&(p.type===ph.type||(ph.type==='ctrTitle'&&p.type==='title')||(ph.type==='subTitle'&&p.type==='body'))})};
  const masterSize=(ph,lvl)=>{const ts=mas?.d&&all(mas.d,'txStyles')[0];if(!ts)return null;const st=kid(ts,ph&&/title/i.test(ph.type)?'titleStyle':ph?'bodyStyle':'otherStyle');const l=st&&kid(st,`lvl${lvl+1}pPr`);const d=l&&kid(l,'defRPr');return l?{sz:d?.getAttribute('sz'),b:d?.getAttribute('b'),color:d&&color(kid(d,'solidFill')),algn:l.getAttribute('algn')}:null};
  const lstSize=(sp,lvl)=>{const l=sp&&path(sp,'txBody','lstStyle');const p=l&&kid(l,`lvl${lvl+1}pPr`);const d=p&&kid(p,'defRPr');return d?{sz:d.getAttribute('sz'),b:d.getAttribute('b'),color:color(kid(d,'solidFill')),algn:p.getAttribute('algn')}:null};
  const xf=(n)=>{const t=n&&(kid(n,'xfrm'));if(!t)return null;const o=kid(t,'off'),e=kid(t,'ext');if(!o||!e)return null;return {x:+o.getAttribute('x'),y:+o.getAttribute('y'),w:+e.getAttribute('cx'),h:+e.getAttribute('cy'),rot:+(t.getAttribute('rot')||0)/60000}};
  const tx=(g,b)=>({x:(g.a*b.x+g.ox)*S,y:(g.d*b.y+g.oy)*S,w:g.a*b.w*S,h:g.d*b.h*S});
  const render=async(tree,g,part)=>{for(const n of kids(tree)){const ln=n.localName;
    if(ln==='grpSp'){const t=path(n,'grpSpPr','xfrm');if(!t)continue;const o=kid(t,'off'),e=kid(t,'ext'),co=kid(t,'chOff'),ce=kid(t,'chExt');const a=+ce.getAttribute('cx')?+e.getAttribute('cx')/+ce.getAttribute('cx'):1,d=+ce.getAttribute('cy')?+e.getAttribute('cy')/+ce.getAttribute('cy'):1;
     const ng={a:g.a*a,d:g.d*d,ox:g.a*(+o.getAttribute('x')-a*+co.getAttribute('x'))+g.ox,oy:g.d*(+o.getAttribute('y')-d*+co.getAttribute('y'))+g.oy};await render(n,ng,part);continue}
    if(ln==='pic'){const b=xf(kid(n,'spPr'));const bl=all(n,'blip')[0];if(!b||!bl)continue;const im=await imgFrom(z,part.rel[bl.getAttributeNS(NS.r,'embed')]?.t||'');if(!im)continue;const r=tx(g,b);const sr=all(n,'srcRect')[0];
     if(sr){const L=+(sr.getAttribute('l')||0)/1e5,T=+(sr.getAttribute('t')||0)/1e5,R=+(sr.getAttribute('r')||0)/1e5,B=+(sr.getAttribute('b')||0)/1e5;const iw=im.width,ih=im.height;x.drawImage(im,iw*L,ih*T,iw*(1-L-R),ih*(1-T-B),r.x,r.y,r.w,r.h)}else x.drawImage(im,r.x,r.y,r.w,r.h);continue}
    if(ln==='graphicFrame'){const tbl=all(n,'tbl')[0];const t=kid(n,'xfrm');if(!tbl||!t)continue;const o=kid(t,'off');const cols=all(tbl,'gridCol').map(c=>+c.getAttribute('w'));let yy=+o.getAttribute('y');
     for(const tr of all(tbl,'tr')){const h=+tr.getAttribute('h');let xx=+o.getAttribute('x');let ci=0;let rowH=h;
      for(const tc of kids(tr,'tc')){const span=+(tc.getAttribute('gridSpan')||1);const w=cols.slice(ci,ci+span).reduce((s,v)=>s+v,0);ci+=span;const r=tx(g,{x:xx,y:yy,w,h:rowH});const tcPr=kid(tc,'tcPr');const f=fillOf(tcPr);shape(x,r,'rect',f||null,'#888',1);
       const tb=kid(tc,'txBody');if(tb)drawText(x,r,paras(tb,null,null,1200),'t',{l:91440*S,r:91440*S,t:45720*S,b:45720*S});xx+=w}yy+=rowH}continue}
    if(ln!=='sp'&&ln!=='cxnSp')continue;
    const ph=phOf(n);const lp=findPh(lay,ph),mp=findPh(mas,ph);const spPr=kid(n,'spPr');
    const b=xf(spPr)||xf(lp&&kid(lp,'spPr'))||xf(mp&&kid(mp,'spPr'));if(!b)continue;const r=tx(g,b);
    const geom=all(spPr,'prstGeom')[0]?.getAttribute('prst')||'rect';let f=fillOf(spPr);if(f===undefined){const st=path(n,'style','fillRef');f=st&&+st.getAttribute('idx')>0?color(st):null}
    const lnN=kid(spPr,'ln');let lc=lnN&&!kid(lnN,'noFill')?color(kid(lnN,'solidFill')):null;if(!lnN){const st=path(n,'style','lnRef');if(st&&+st.getAttribute('idx')>0&&ln==='sp'&&!ph)lc=color(st)}
    const lw=lnN?.getAttribute('w')?+lnN.getAttribute('w')*S:Math.max(1,9525*S);
    if(ln==='cxnSp'){if(lc){x.strokeStyle=lc;x.lineWidth=lw;x.beginPath();x.moveTo(r.x,r.y);x.lineTo(r.x+r.w,r.y+r.h);x.stroke()}continue}
    if(b.rot){x.save();x.translate(r.x+r.w/2,r.y+r.h/2);x.rotate(b.rot*Math.PI/180);r.x=-r.w/2;r.y=-r.h/2}
    if(f||lc)shape(x,r,geom,f,lc,lw);
    const tb=kid(n,'txBody');if(tb){const bp=kid(tb,'bodyPr')||{getAttribute:()=>null};const lbp=lp&&path(lp,'txBody','bodyPr');const mbp=mp&&path(mp,'txBody','bodyPr');const ga=k=>bp.getAttribute(k)??lbp?.getAttribute(k)??mbp?.getAttribute(k);
     const ins={l:+(ga('lIns')??91440)*S,r:+(ga('rIns')??91440)*S,t:+(ga('tIns')??45720)*S,b:+(ga('bIns')??45720)*S};const na=all(bp,'normAutofit')[0];const fs=na?+(na.getAttribute('fontScale')||100000)/100000:1;
     const fr=path(n,'style','fontRef');const defColor=fr?color(fr):null;
     const ps=paras(tb,ph,lvl=>({...(masterSize(ph,lvl)||{}),...Object.fromEntries(Object.entries(lstSize(mp,lvl)||{}).filter(e=>e[1]!=null)),...Object.fromEntries(Object.entries(lstSize(lp,lvl)||{}).filter(e=>e[1]!=null)),...Object.fromEntries(Object.entries(lstSize(n,lvl)||{}).filter(e=>e[1]!=null))}),ph?(/title/i.test(ph.type)?4400:1800):1800,fs,defColor);
     drawText(x,r,ps,ga('anchor')||(ph&&/title/i.test(ph.type)&&ph.type!=='title'?'ctr':ph?.type==='title'?'ctr':'t'),ins)}
    if(b.rot)x.restore()}};
  function paras(tb,ph,inh,dsz,fs=1,defColor){const o=[];for(const p of kids(tb,'p')){const pPr=kid(p,'pPr');const lvl=+(pPr?.getAttribute('lvl')||0);const I=inh?inh(lvl):{};const base=+(I.sz||dsz);const runs=[];
    for(const r of kids(p)){if(r.localName==='br'){runs.push({t:'\n',size:base/100*12700*S*fs,color:I.color||defColor});continue}if(r.localName!=='r'&&r.localName!=='fld')continue;const rp=kid(r,'rPr');const t=kid(r,'t')?.textContent||'';
     const lat=rp&&(kid(rp,'latin')||kid(rp,'ea')||kid(rp,'cs'));let face=lat?.getAttribute('typeface');if(face&&face.startsWith('+'))face=null;
     runs.push({t,size:+(rp?.getAttribute('sz')||base)/100*12700*S*fs,b:(rp?.getAttribute('b')??I.b)==='1',i:rp?.getAttribute('i')==='1',u:!!rp?.getAttribute('u')&&rp.getAttribute('u')!=='none',color:color(rp&&kid(rp,'solidFill'))||(ph?I.color||defColor:defColor||I.color)||mapC('tx1')||'#000',face})}
    const ep=kid(p,'endParaRPr');const sz=+(ep?.getAttribute('sz')||base)/100*12700*S*fs;
    const bu=pPr&&kid(pPr,'buChar');const noBu=pPr&&kid(pPr,'buNone');const isBody=ph&&!/title/i.test(ph.type)&&ph.type!=='ctrTitle'&&ph.type!=='subTitle';
    const mar=+(pPr?.getAttribute('marL')??(isBody?(lvl+1)*342900:0))*S;
    o.push({runs,size:sz,align:pPr?.getAttribute('algn')||I.algn,bullet:noBu?null:bu?bu.getAttribute('char'):(isBody&&runs.length?'•':null),indent:mar})}return o}
  // layout/master non-placeholder shapes first (logos, decorations)
  for(const part of [mas,lay]){if(!part?.d)continue;if(part===mas&&lay?.d&&kid(lay.d.documentElement,'cSld')&&lay.d.documentElement.getAttribute('showMasterSp')==='0')continue;if(slide.d.documentElement.getAttribute('showMasterSp')==='0')continue;
   const tree=all(part.d,'spTree')[0];const tmp=tree.cloneNode(true);for(const k of kids(tmp))if(phOf(k)||k.localName==='nvGrpSpPr'||k.localName==='grpSpPr')tmp.removeChild(k);await render(tmp,{a:1,d:1,ox:0,oy:0},part)}
  await render(all(slide.d,'spTree')[0],{a:1,d:1,ox:0,oy:0},slide);out.push(c)}
 return out}

// ---------- ODP ----------
const unit=s=>{if(!s)return 0;const m=String(s).match(/^(-?[\d.]+)\s*(cm|mm|in|pt|px|pc)?$/);if(!m)return 0;return +m[1]*({cm:28.3465,mm:2.83465,in:72,pt:1,px:0.75,pc:12}[m[2]||'pt'])};
async function odp(z,TW){const cx=P(await z.file('content.xml').async('string'));const sx=z.file('styles.xml')?P(await z.file('styles.xml').async('string')):null;
 const styles={};for(const d of [sx,cx])if(d)for(const s of all(d,'style'))styles[s.getAttribute('style:name')]=s;
 const prop=(name,k,seen=0)=>{const s=styles[name];if(!s||seen>8)return null;for(const p of kids(s)){const v=p.getAttribute(k);if(v!=null)return v}const par=s.getAttribute('style:parent-style-name');return par?prop(par,k,seen+1):null};
 const mp0=sx&&all(sx,'master-page')[0];const pln=mp0?.getAttribute('style:page-layout-name');const pl=sx&&((pln&&all(sx,'page-layout').find(l=>l.getAttribute('style:name')===pln)&&all(all(sx,'page-layout').find(l=>l.getAttribute('style:name')===pln),'page-layout-properties')[0])||all(sx,'page-layout-properties')[0]);const PW=unit(pl?.getAttribute('fo:page-width'))||793.7,PH=unit(pl?.getAttribute('fo:page-height'))||446.4;const S=TW/PW;const out=[];
 const masters={};if(sx)for(const m of all(sx,'master-page'))masters[m.getAttribute('style:name')]=m;
 for(const pg of all(cx,'page')){const c=newC(TW,PH*S);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  const ms=masters[pg.getAttribute('draw:master-page-name')];const bgc=prop(pg.getAttribute('draw:style-name'),'draw:fill-color')||(ms&&prop(ms.getAttribute('draw:style-name'),'draw:fill-color'));const bgf=prop(pg.getAttribute('draw:style-name'),'draw:fill')||(ms&&prop(ms.getAttribute('draw:style-name'),'draw:fill'));if(bgc&&bgf!=='none'){x.fillStyle=bgc;x.fillRect(0,0,c.width,c.height)}
  const draw=async(n,ox,oy,isMaster)=>{for(const e of kids(n)){const ln=e.localName;if(ln==='g'){await draw(e,ox,oy,isMaster);continue}if(!/^(frame|rect|custom-shape|ellipse|line)$/.test(ln))continue;if(isMaster&&e.getAttribute('presentation:class'))continue;
    const gs=e.getAttribute('draw:style-name')||e.getAttribute('presentation:style-name');const r={x:(unit(e.getAttribute('svg:x'))+ox)*S,y:(unit(e.getAttribute('svg:y'))+oy)*S,w:unit(e.getAttribute('svg:width'))*S,h:unit(e.getAttribute('svg:height'))*S};
    if(ln==='line'){x.strokeStyle=prop(gs,'svg:stroke-color')||'#000';x.lineWidth=Math.max(1,unit(prop(gs,'svg:stroke-width'))*S);x.beginPath();x.moveTo(unit(e.getAttribute('svg:x1'))*S,unit(e.getAttribute('svg:y1'))*S);x.lineTo(unit(e.getAttribute('svg:x2'))*S,unit(e.getAttribute('svg:y2'))*S);x.stroke();continue}
    const fill=kid(e,'table')?null:prop(gs,'draw:fill')==='solid'||(ln!=='frame'&&prop(gs,'draw:fill')!=='none')?prop(gs,'draw:fill-color')||(ln!=='frame'?'#729fcf':null):null;const st=prop(gs,'draw:stroke');const lc=st&&st!=='none'?prop(gs,'svg:stroke-color')||'#3465a4':null;
    const geo=ln==='ellipse'||all(e,'enhanced-geometry')[0]?.getAttribute('draw:type')==='ellipse'?'ellipse':'rect';if(fill||lc)shape(x,r,geo,fill,lc,Math.max(1,unit(prop(gs,'svg:stroke-width'))*S));
    const tbl=kid(e,'table');if(tbl){const rows=all(tbl,'table-row');const nc=Math.max(1,...rows.map(r=>kids(r,'table-cell').length));const rh=r.h/Math.max(1,rows.length),cw=r.w/nc;rows.forEach((row,ri)=>kids(row,'table-cell').forEach((cell,ci)=>{const b={x:r.x+ci*cw,y:r.y+ri*rh,w:cw,h:rh};const cf=prop(cell.getAttribute('table:style-name'),'draw:fill-color')||prop(cell.getAttribute('table:style-name'),'fo:background-color');shape(x,b,'rect',cf||null,'#888',1);
      const ps=kids(cell,'p').map(p=>({runs:[{t:p.textContent,size:12*S*1.2,color:'#000'}],size:12*S*1.2,align:'l'}));drawText(x,b,ps,'t',{l:4*S,r:4*S,t:2*S,b:2*S})}));continue}
    const im=kid(e,'image');if(im){const bm=await imgFrom(z,(im.getAttribute('xlink:href')||'').replace(/^\.\//,''));if(bm){x.drawImage(bm,r.x,r.y,r.w,r.h);continue}}
    const tb=kid(e,'text-box')||(ln!=='frame'?e:null);if(!tb)continue;const cls=e.getAttribute('presentation:class');const dsz=cls==='title'?40:cls==='subtitle'?28:cls==='outline'?24:18;const ps=[];
    const walkP=(p,lvl,bul)=>{const ps0=p.getAttribute('text:style-name');const size=unit(prop(ps0,'fo:font-size')||prop(gs,'fo:font-size'))||dsz;const runs=[];
     const rr=(n,st)=>{for(const c of n.childNodes){if(c.nodeType===3){runs.push({t:c.textContent,...st});continue}if(c.nodeType!==1)continue;const l=c.localName;if(l==='s'){runs.push({...st,t:' '.repeat(+(c.getAttribute('text:c')||1))});continue}if(l==='tab'){runs.push({...st,t:'    '});continue}if(l==='line-break'){runs.push({...st,t:'\n'});continue}
       const sn=c.getAttribute('text:style-name');const s2={...st};if(sn){const fz=prop(sn,'fo:font-size');if(fz)s2.size=(/%$/.test(fz)?st.size*parseFloat(fz)/100:unit(fz)*S);const fw=prop(sn,'fo:font-weight');if(fw)s2.b=fw==='bold'||+fw>=600;const fi=prop(sn,'fo:font-style');if(fi)s2.i=fi==='italic';const co=prop(sn,'fo:color');if(co)s2.color=co;const fn=prop(sn,'style:font-name');if(fn)s2.face=fn}rr(c,s2)}};
     rr(p,{size:size*S,b:(prop(ps0,'fo:font-weight')||prop(gs,'fo:font-weight'))==='bold',i:false,color:prop(ps0,'fo:color')||prop(gs,'fo:color')||'#000'});const al=prop(ps0,'fo:text-align')||prop(gs,'fo:text-align');
     ps.push({runs,size:size*S,align:{center:'ctr',end:'r',right:'r',justify:'l'}[al]||'l',bullet:bul,indent:lvl*size*S*1.2})};
    const walk=(n,lvl)=>{for(const c of kids(n)){if(c.localName==='p'||c.localName==='h')walkP(c,lvl,lvl>0||cls==='outline'?'•':null);else if(c.localName==='list')walk(c,lvl+1);else if(c.localName==='list-item'||c.localName==='list-header')walk(c,lvl)}};walk(tb,0);
    const va=prop(gs,'draw:textarea-vertical-align');drawText(x,r,ps,va==='middle'?'ctr':va==='bottom'?'b':(cls==='title'?'ctr':'t'),{l:unit(prop(gs,'fo:padding-left')||'0.25cm')*S,r:unit(prop(gs,'fo:padding-right')||'0.25cm')*S,t:unit(prop(gs,'fo:padding-top')||'0.125cm')*S,b:unit(prop(gs,'fo:padding-bottom')||'0.125cm')*S})}};
  if(ms)await draw(ms,0,0,true);await draw(pg,0,0,false);out.push(c)}
 return out}
window.Slides={async render(ab,ext,width=1920,JZ=window.JSZip){const z=await JZ.loadAsync(ab);if(ext==='odp'||ext==='otp'||z.file('content.xml'))return odp(z,width);return pptx(z,width)}};
})();
