// @needs img
// Photo filters done with per-pixel colour matrices (works in every browser, no ctx.filter dependency).
const FPRE={none:{},grayscale:{sat:-100},sepia:{sepia:100},vintage:{sepia:45,con:-10,bri:5,vig:40,sat:-20},warm:{temp:35,sat:10},cool:{temp:-35},vivid:{sat:45,con:15},matte:{con:-25,bri:8,fade:20},noir:{sat:-100,con:40,vig:35},invert:{inv:1},polaroid:{con:10,temp:12,fade:12,vig:20},kodachrome:{sat:30,con:20,temp:15},lomo:{sat:30,con:30,vig:60},dramatic:{con:45,sat:-25,vig:30}};
function applyFx(c,p){const x=c.getContext('2d'),W=c.width,H=c.height;const id=x.getImageData(0,0,W,H),d=id.data;
 const b=(p.bri||0)*2.55,k=(100+(p.con||0))/100,sat=1+(p.sat||0)/100,sp=(p.sepia||0)/100,tm=(p.temp||0)*0.6,fade=(p.fade||0)*1.2,vig=(p.vig||0)/100,hue=(p.hue||0)*Math.PI/180;
 const ch=Math.cos(hue),sh=Math.sin(hue);const hm=[.213+ch*.787-sh*.213,.715-ch*.715-sh*.715,.072-ch*.072+sh*.928,.213-ch*.213+sh*.143,.715+ch*.285+sh*.140,.072-ch*.072-sh*.283,.213-ch*.213-sh*.787,.715-ch*.715+sh*.715,.072+ch*.928+sh*.072];
 const cx=W/2,cy=H/2,md=Math.hypot(cx,cy);
 for(let y=0,i=0;y<H;y++)for(let X=0;X<W;X++,i+=4){let r=d[i],g=d[i+1],bl=d[i+2];
  if(hue){const R=r,G=g,B=bl;r=hm[0]*R+hm[1]*G+hm[2]*B;g=hm[3]*R+hm[4]*G+hm[5]*B;bl=hm[6]*R+hm[7]*G+hm[8]*B;}
  r+=b;g+=b;bl+=b;r=(r-128)*k+128;g=(g-128)*k+128;bl=(bl-128)*k+128;
  const l=.299*r+.587*g+.114*bl;r=l+(r-l)*sat;g=l+(g-l)*sat;bl=l+(bl-l)*sat;
  if(sp){const R=r,G=g,B=bl;r=R*(1-sp)+(R*.393+G*.769+B*.189)*sp;g=G*(1-sp)+(R*.349+G*.686+B*.168)*sp;bl=B*(1-sp)+(R*.272+G*.534+B*.131)*sp;}
  r+=tm;bl-=tm;if(fade){r=r*(1-fade/255)+fade;g=g*(1-fade/255)+fade;bl=bl*(1-fade/255)+fade;}
  if(vig){const f=1-vig*Math.pow(Math.hypot(X-cx,y-cy)/md,2);r*=f;g*=f;bl*=f;}
  if(p.inv){r=255-r;g=255-g;bl=255-bl;}d[i]=r;d[i+1]=g;d[i+2]=bl;}
 x.putImageData(id,0,0);return c;}
TOOLS.filters={live:true,
 opts:()=>sel('fxp','Filter',Object.keys(FPRE).map(k=>[k,k==='none'?'None (adjust manually)':k[0].toUpperCase()+k.slice(1)]))+inp('fxi','Filter strength (%)','range','100','min="0" max="100"')+inp('fxb','Brightness','range','0','min="-100" max="100"')+inp('fxc','Contrast','range','0','min="-100" max="100"')+inp('fxs','Saturation','range','0','min="-100" max="100"')+inp('fxt','Warmth','range','0','min="-100" max="100"')+inp('fxh','Hue shift (°)','range','0','min="-180" max="180"')+inp('fxv','Vignette','range','0','min="0" max="100"')+fmtSel('fxf','Format'),
 setup(){const d=document.createElement('div');d.innerHTML='<div id="fxpv" style="text-align:center"></div>';return d;},
 async run(files){const f=files[0];if(!this.c||this.cf!==f){this.c=await fileToCanvas(f);this.cf=f;}const c=this.c;const P=FPRE[v('fxp')]||{};const s=(+v('fxi')??100)/100;
  const p={};for(const k in P)p[k]=k==='inv'?(s>=.5?1:0):P[k]*s;const add=(k,id)=>{p[k]=(p[k]||0)+(+v(id)||0);};add('bri','fxb');add('con','fxc');add('sat','fxs');add('temp','fxt');add('hue','fxh');add('vig','fxv');
  const mk=src=>{const o=newCanvas(src.width,src.height);o.getContext('2d').drawImage(src,0,0);return o;};
  const sc=Math.min(1,600/Math.max(c.width,c.height));const sm=newCanvas(c.width*sc,c.height*sc);sm.getContext('2d').drawImage(c,0,0,sm.width,sm.height);applyFx(sm,p);sm.style.cssText='max-width:100%;max-height:420px';const el=document.getElementById('fxpv');if(el){el.innerHTML='';el.appendChild(sm);}
  this.p=p;const fmt=outFmt(f,v('fxf'));return {name:imgName(f,'-'+(v('fxp')==='none'?'edited':v('fxp')),fmt),blob:await encodeCanvas(applyFx(mk(c),p),fmt,.92),info:`${c.width}×${c.height} px`};}};
