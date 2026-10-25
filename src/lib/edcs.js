//<edcs>
// Content-stream engine: parse page/form content, interpret text/graphics state, find glyphs, images and paths, and rewrite operators in place.
const EDCS=(()=>{
const WS=new Set([0,9,10,12,13,32]),DL=new Set('()<>[]{}/%'.split('').map(c=>c.charCodeAt(0)));
function lex(s){const t=[];let i=0;const n=s.length;
 while(i<n){const c=s.charCodeAt(i);
  if(WS.has(c)){i++;continue;}
  if(c===37){while(i<n&&s[i]!=='\n'&&s[i]!=='\r')i++;continue;}
  const st=i;
  if(c===40){let d=1;i++;let v='';while(i<n&&d>0){let ch=s[i];if(ch==='\\'){const nx=s[i+1];i+=2;const E={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f'};if(E[nx]){v+=E[nx];}else if(/[0-7]/.test(nx)){let o=nx;while(o.length<3&&/[0-7]/.test(s[i])){o+=s[i++];}v+=String.fromCharCode(parseInt(o,8)&255);}else if(nx==='\r'){if(s[i]==='\n')i++;}else if(nx==='\n'){}else v+=nx;continue;}if(ch==='(')d++;else if(ch===')'){d--;if(!d){i++;break;}}v+=ch;i++;}t.push({k:'s',v,s:st,e:i});continue;}
  if(c===60&&s[i+1]==='<'){t.push({k:'<<',s:i,e:i+2});i+=2;continue;}
  if(c===62&&s[i+1]==='>'){t.push({k:'>>',s:i,e:i+2});i+=2;continue;}
  if(c===60){i++;let h='';while(i<n&&s[i]!=='>'){if(!WS.has(s.charCodeAt(i)))h+=s[i];i++;}i++;if(h.length%2)h+='0';let v='';for(let k=0;k<h.length;k+=2)v+=String.fromCharCode(parseInt(h.substr(k,2),16));t.push({k:'s',v,hex:1,s:st,e:i});continue;}
  if(c===91||c===93){t.push({k:s[i],s:i,e:i+1});i++;continue;}
  if(c===123||c===125){i++;continue;}
  if(c===47){i++;while(i<n&&!WS.has(s.charCodeAt(i))&&!DL.has(s.charCodeAt(i)))i++;t.push({k:'n',v:s.slice(st+1,i).replace(/#([0-9a-fA-F]{2})/g,(m,h)=>String.fromCharCode(parseInt(h,16))),s:st,e:i});continue;}
  while(i<n&&!WS.has(s.charCodeAt(i))&&!DL.has(s.charCodeAt(i)))i++;if(i===st){i++;continue;}
  const w=s.slice(st,i);if(/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w))t.push({k:'#',v:parseFloat(w),s:st,e:i});
  else if(w==='true'||w==='false'||w==='null')t.push({k:'#',v:w==='true'?1:0,s:st,e:i});
  else{t.push({k:'op',v:w,s:st,e:i});if(w==='ID'){let j=i+1;while(j<n){if(s[j]==='E'&&s[j+1]==='I'&&WS.has(s.charCodeAt(j-1))&&(j+2>=n||WS.has(s.charCodeAt(j+2)))){break;}j++;}t.push({k:'bin',s:i,e:j});t.push({k:'op',v:'EI',s:j,e:j+2});i=j+2;}}}
 return t;}
// group tokens into operations {op,args,s,e}
function ops(s){const t=lex(s);const out=[];let st=[];
 const val=(arr,k)=>{const x=arr[k];if(x.k==='['){const a=[];let j=k+1;while(j<arr.length&&arr[j].k!==']'){const r=val(arr,j);a.push(r.v);j=r.j;}return {v:{k:'a',v:a,s:x.s,e:arr[j]?.e},j:j+1};}if(x.k==='<<'){let j=k+1,d=1;while(j<arr.length&&d){if(arr[j].k==='<<')d++;else if(arr[j].k==='>>')d--;j++;}return {v:{k:'d',s:x.s,e:arr[j-1].e},j};}return {v:x,j:k+1};};
 let i=0;while(i<t.length){const x=t[i];if(x.k==='op'){const args=[];let j=0;while(j<st.length){const r=val(st,j);args.push(r.v);j=r.j;}const s0=st.length?st[0].s:x.s;out.push({op:x.v,args,s:s0,e:x.e});st=[];if(x.v==='ID'){const b=t[i+1];out[out.length-1].bin=b;i+=2;continue;}i++;continue;}st.push(x);i++;}
 return out;}
const mul=(a,b)=>[a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3],a[4]*b[0]+a[5]*b[2]+b[4],a[4]*b[1]+a[5]*b[3]+b[5]];
const inv=m=>{const d=m[0]*m[3]-m[1]*m[2];if(!d)return [1,0,0,1,0,0];return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];};
const ap=(m,x,y)=>[x*m[0]+y*m[2]+m[4],x*m[1]+y*m[3]+m[5]];
const num=x=>{const r=Math.round(x*1e4)/1e4;return Object.is(r,-0)?'0':String(r);};
const hexs=b=>'<'+[...b].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('')+'>';
function makeCtx(P){const {PDFName,PDFRawStream,PDFArray,PDFDict,PDFRef,PDFNumber,decodePDFRawStream}=P;
 const N=s=>PDFName.of(s);
 return {N,look:(d,o)=>o instanceof PDFRef?d.context.lookup(o):o,
  bytes(d,o){o=this.look(d,o);if(!o)return '';let u8;if(o instanceof PDFRawStream){const f=o.dict.get(N('Filter'));u8=f?decodePDFRawStream(o).decode():o.contents;}else if(o.getUnencodedContents)u8=o.getUnencodedContents();else if(o.getContents)u8=o.getContents();else return '';let s='';for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return s;},
  arr(d,o){o=this.look(d,o);return o instanceof PDFArray?o.asArray().map(x=>this.look(d,x)):[];},
  n(d,o){o=this.look(d,o);return o&&o.asNumber?o.asNumber():(o&&typeof o.numberValue==='number'?o.numberValue:undefined);}};}
// font metrics
function fontInfo(d,X,ref,P){const f=X.look(d,ref);if(!f||!f.get)return null;const N=X.N;const st=f.get(N('Subtype'))?.toString()||'';const bf=f.get(N('BaseFont'))?.toString().slice(1)||'';
 const fi={ref,dict:f,type0:st==='/Type0',type3:st==='/Type3',name:bf,w:{},dw:0,fm:0.001,tu:null};
 if(fi.type0){const enc=f.get(N('Encoding'))?.toString()||'';fi.twoByte=true;fi.okEnc=/Identity-[HV]/.test(enc);const df=X.arr(d,f.get(N('DescendantFonts')))[0];if(df){fi.dw=X.n(d,df.get(N('DW')))??1000;const W=X.arr(d,df.get(N('W')));for(let i=0;i<W.length;){const a=X.n(d,W[i]);const b=W[i+1];const bb=X.look(d,b);if(bb&&bb.asArray){const ws=X.arr(d,bb);ws.forEach((w,k)=>fi.w[a+k]=X.n(d,w));i+=2;}else{const e=X.n(d,W[i+1]),w=X.n(d,W[i+2]);for(let c=a;c<=e&&c-a<70000;c++)fi.w[c]=w;i+=3;}}}}
 else{fi.okEnc=true;const fc=X.n(d,f.get(N('FirstChar')))??0;const W=X.arr(d,f.get(N('Widths')));W.forEach((w,k)=>fi.w[fc+k]=X.n(d,w));const fd=X.look(d,f.get(N('FontDescriptor')));fi.dw=fd?(X.n(d,fd.get(N('MissingWidth')))||0):0;if(!W.length)fi.std=bf.replace(/^[A-Z]{6}\+/,'');
  if(fi.type3){const fm=X.arr(d,f.get(N('FontMatrix'))).map(x=>X.n(d,x));fi.fm=fm[0]||0.001;fi.fm3=fm;}}
 // ToUnicode
 const tu=X.look(d,f.get(N('ToUnicode')));if(tu&&tu.dict){const s=X.bytes(d,tu);const m={};const u=h=>{let r='';for(let k=0;k+4<=h.length;k+=4)r+=String.fromCharCode(parseInt(h.substr(k,4),16));return r;};
  for(const b of s.matchAll(/beginbfchar([\s\S]*?)endbfchar/g))for(const q of b[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g))m[parseInt(q[1],16)]=u(q[2]);
  for(const b of s.matchAll(/beginbfrange([\s\S]*?)endbfrange/g))for(const q of b[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]*>|\[[^\]]*\])/g)){const a=parseInt(q[1],16),e=parseInt(q[2],16);if(e-a>65535)continue;if(q[3][0]==='['){const L=[...q[3].matchAll(/<([0-9a-fA-F]*)>/g)];for(let c=a;c<=e;c++)m[c]=u(L[c-a]?.[1]||'');}else{const h=q[3].slice(1,-1);const base=parseInt(h.slice(-4)||'0',16);for(let c=a;c<=e;c++)m[c]=u(h.slice(0,-4))+String.fromCharCode(base+c-a);}}
  fi.tu=m;}
 return fi;}
const WINANSI=(()=>{const m={};for(let i=32;i<127;i++)m[i]=String.fromCharCode(i);for(let i=160;i<256;i++)m[i]=String.fromCharCode(i);'€\x81‚ƒ„…†‡ˆ‰Š‹Œ\x8dŽ\x8f\x90‘’“”•–—˜™š›œ\x9džŸ'.split('').forEach((c,k)=>m[128+k]=c);return m;})();
// interpret one content stream; cb receives glyphs, images, paths
function walk(d,X,P,content,res,ctm0,path,acc,depth=0){if(depth>8)return;const N=X.N;const O=ops(content);acc.streams[path]={O,content,res,ctm0};
 const fonts={};const getFont=nm=>{if(nm in fonts)return fonts[nm];const fd=X.look(d,res?.get(N('Font')));const r=fd&&fd.get?fd.get(N(nm)):null;return fonts[nm]=r?fontInfo(d,X,r,P):null;};
 let gs={ctm:ctm0.slice(),Tc:0,Tw:0,Th:1,TL:0,font:null,fname:'',fs:0,Ts:0,Tr:0,fill:'0 g',stroke:'0 G'};const stk=[];let Tm=[1,0,0,1,0,0],Tlm=[1,0,0,1,0,0];let pth=null;
 const A=(o,k)=>o.args[k]?.v;
 const show=(oi,o,strs)=>{const f=gs.font;const gl=[];if(!f)return;let ei=0;
  for(const el of strs){if(el.k==='#'){Tm=mul([1,0,0,1,-el.v/1000*gs.fs*gs.Th,0],Tm);ei++;continue;}if(el.k!=='s'){ei++;continue;}const b=el.v;const step=f.twoByte?2:1;
   for(let k=0;k+step<=b.length;k+=step){const code=step===2?(b.charCodeAt(k)<<8)|b.charCodeAt(k+1):b.charCodeAt(k);let w0=f.w[code];if(w0===undefined)w0=f.std?stdW(f.std,code):f.dw;const wt=w0*f.fm*(f.type3?1:1);
    const adv=(wt*gs.fs+gs.Tc+(step===1&&code===32?gs.Tw:0))*gs.Th;const trm=mul(Tm,gs.ctm);const cx=ap(trm,adv/2,gs.fs*0.3+gs.Ts),org=ap(trm,0,gs.Ts);
    const uni=f.tu?f.tu[code]:(f.twoByte?'':WINANSI[code]);acc.glyphs.push({path,oi,ei,k,code,bytes:b.substr(k,step),adv,cx:cx[0],cy:cy(cx),org,trm,fs:gs.fs,Th:gs.Th,font:f,fname:gs.fname,res,uni,Tr:gs.Tr,fill:gs.fill,inForm:depth>0});
    Tm=mul([1,0,0,1,adv,0],Tm);}ei++;}};
 function cy(p){return p[1];}
 for(let oi=0;oi<O.length;oi++){const o=O[oi];const op=o.op;
  switch(op){
   case 'q':stk.push({...gs,ctm:gs.ctm.slice()});break;case 'Q':if(stk.length)gs=stk.pop();break;
   case 'cm':gs.ctm=mul(o.args.map(a=>a.v),gs.ctm);break;
   case 'BT':Tm=[1,0,0,1,0,0];Tlm=[1,0,0,1,0,0];break;
   case 'Tf':gs.fname=A(o,0);gs.fs=A(o,1);gs.font=getFont(gs.fname);break;
   case 'Tc':gs.Tc=A(o,0);break;case 'Tw':gs.Tw=A(o,0);break;case 'Tz':gs.Th=A(o,0)/100;break;case 'TL':gs.TL=A(o,0);break;case 'Ts':gs.Ts=A(o,0);break;case 'Tr':gs.Tr=A(o,0);break;
   case 'Td':Tlm=mul([1,0,0,1,A(o,0),A(o,1)],Tlm);Tm=Tlm.slice();break;
   case 'TD':gs.TL=-A(o,1);Tlm=mul([1,0,0,1,A(o,0),A(o,1)],Tlm);Tm=Tlm.slice();break;
   case 'Tm':Tlm=o.args.map(a=>a.v);Tm=Tlm.slice();break;
   case 'T*':Tlm=mul([1,0,0,1,0,-gs.TL],Tlm);Tm=Tlm.slice();break;
   case 'Tj':show(oi,o,[o.args[0]]);break;
   case 'TJ':show(oi,o,o.args[0]?.v||[]);break;
   case "'":Tlm=mul([1,0,0,1,0,-gs.TL],Tlm);Tm=Tlm.slice();show(oi,o,[o.args[0]]);break;
   case '"':gs.Tw=A(o,0);gs.Tc=A(o,1);Tlm=mul([1,0,0,1,0,-gs.TL],Tlm);Tm=Tlm.slice();show(oi,o,[o.args[2]]);break;
   case 'g':case 'rg':case 'k':case 'sc':case 'scn':case 'cs':gs.fill=(op==='cs'?'':'')+content.slice(o.s,o.e);if(op==='cs')gs.fillCS=content.slice(o.s,o.e);break;
   case 'G':case 'RG':case 'K':case 'SC':case 'SCN':case 'CS':gs.stroke=content.slice(o.s,o.e);break;
   case 'Do':{const nm=A(o,0);const xd=X.look(d,res?.get(N('XObject')));const ref=xd&&xd.get?xd.get(N(nm)):null;const xo=X.look(d,ref);if(!xo||!xo.dict)break;const stp=xo.dict.get(N('Subtype'))?.toString();
    if(stp==='/Image'){acc.objs.push({kind:'img',path,oi,s:o.s,e:o.e,ctm:gs.ctm.slice(),bb:bbox(gs.ctm,[[0,0],[1,0],[0,1],[1,1]]),name:nm,res,depth});}
    else if(stp==='/Form'){const fm=X.arr(d,xo.dict.get(N('Matrix'))).map(x=>X.n(d,x));const M=fm.length===6?fm:[1,0,0,1,0,0];const fr=X.look(d,xo.dict.get(N('Resources')))||res;acc.forms[path+'/'+nm]=ref;walk(d,X,P,X.bytes(d,xo),fr,mul(M,gs.ctm),path+'/'+nm,acc,depth+1);}break;}
   case 'BI':break;
   case 'EI':{acc.objs.push({kind:'img',inline:1,path,oi,s:O[oi-2]?.op==='BI'?O[oi-2].s:o.s,e:o.e,ctm:gs.ctm.slice(),bb:bbox(gs.ctm,[[0,0],[1,0],[0,1],[1,1]]),res,depth});break;}
   case 'm':case 'l':case 'c':case 'v':case 'y':case 're':case 'h':{if(!pth)pth={s:o.s,oi,pts:[]};const a=o.args.map(x=>x.v);if(op==='re'){pth.pts.push([a[0],a[1]],[a[0]+a[2],a[1]+a[3]]);}else for(let k=0;k+1<a.length;k+=2)pth.pts.push([a[k],a[k+1]]);break;}
   case 'W':case 'W*':if(pth)pth.clip=1;break;
   case 'f':case 'F':case 'f*':case 'B':case 'B*':case 'b':case 'b*':case 'S':case 's':case 'n':{if(pth&&pth.clip)(acc.clips=acc.clips||[]).push({path,oi0:pth.oi,oi,s:pth.s,e:o.e,ctm:gs.ctm.slice()});if(pth&&op!=='n'&&!pth.clip&&pth.pts.length){acc.objs.push({kind:'path',path,oi0:pth.oi,oi,s:pth.s,e:o.e,ctm:gs.ctm.slice(),bb:bbox(gs.ctm,pth.pts),fill:/[fFBb]/.test(op)?gs.fill:null,stroke:/[SsBb]/.test(op)?gs.stroke:null,lw:1,res,depth,paint:op});}pth=null;break;}
  }}}
function bbox(m,pts){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [x,y] of pts){const p=ap(m,x,y);x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);}return [x0,y0,x1,y1];}
let STDW=null;function stdW(name,code){if(!STDW)return 500;const t=STDW[name.replace(/,.*$/,'')]||STDW.Helvetica;const ch=WINANSI[code];return (ch&&t?t(ch):500);}
// analyse a page
function analyse(d,P,pageIndex){const X=makeCtx(P);const N=X.N;const pg=d.getPage(pageIndex);const node=pg.node;let c=node.get(N('Contents'));c=X.look(d,c);let content='';if(c&&c.asArray)content=c.asArray().map(r=>X.bytes(d,r)).join('\n');else if(c)content=X.bytes(d,c);
 const res=node.Resources?node.Resources():X.look(d,node.get(N('Resources')));const acc={glyphs:[],objs:[],streams:{},forms:{}};walk(d,X,P,content,res,[1,0,0,1,0,0],'p',acc,0);acc.X=X;acc.pg=pg;return acc;}
// rewrite streams given edit list: {path,s,e,rep} replacements
function commit(d,P,acc,reps){const X=acc.X;const N=X.N;const by={};for(const r of reps)(by[r.path]=by[r.path]||[]).push(r);
 for(const [path,list] of Object.entries(by)){const st=acc.streams[path];let s=st.content;list.sort((a,b)=>b.s-a.s||b.e-a.e);let last=Infinity;for(const r of list){if(r.e>last)continue;s=s.slice(0,r.s)+r.rep+s.slice(r.e);last=r.s;}
  const u8=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u8[i]=s.charCodeAt(i)&255;
  if(path==='p'){const ns=d.context.flateStream(u8);acc.pg.node.set(N('Contents'),d.context.register(ns));}
  else{const ref=acc.forms[path];const old=X.look(d,ref);const ns=d.context.flateStream(u8);for(const [k,v] of old.dict.entries()){const kn=k.toString();if(['/Length','/Filter','/DecodeParms'].includes(kn))continue;ns.dict.set(k,v);}d.context.assign(ref,ns);}}}
// build replacement for a show op, removing glyphs in set `kill` (keyed by ei:k)
function rebuildShow(st,o,glyphs,kill){const op=o.op;const fs=glyphs[0].fs,Th=glyphs[0].Th;const two=glyphs[0].font.twoByte;
 const strs=op==='TJ'?(o.args[0]?.v||[]):[o.args[op==='"'?2:0]];const parts=[];let pend=0;let ei=0;
 const flushNum=()=>{if(Math.abs(pend)>1e-6)parts.push(num(pend));pend=0;};
 for(const el of strs){if(el.k==='#'){pend+=el.v;ei++;continue;}if(el.k!=='s'){ei++;continue;}let keep='';const step=two?2:1;
  for(let k=0;k+step<=el.v.length;k+=step){const g=glyphs.find(x=>x.ei===ei&&x.k===k);if(g&&kill.has(g)){if(keep){flushNum();parts.push(hexs(keep));keep='';}pend+=-(g.adv*1000)/(fs*Th||1);}else{if(!keep)flushNum();keep+=el.v.substr(k,step);}}
  if(keep){flushNum();parts.push(hexs(keep));}ei++;}
 flushNum();const body='['+parts.join(' ')+'] TJ';
 if(op==="'")return 'T* '+body;if(op==='"')return num(o.args[0].v)+' Tw '+num(o.args[1].v)+' Tc T* '+body;return body;}
// remove glyphs whose centre lies in any rect [x0,y0,x1,y1] (user space). returns per-rect stats
function removeText(d,P,acc,rects){const hit=rects.map(()=>[]);for(const g of acc.glyphs){if(!g.font.okEnc)continue;for(let r=0;r<rects.length;r++){const R=rects[r];if(g.cx>=R[0]&&g.cx<=R[2]&&g.cy>=R[1]&&g.cy<=R[3]){hit[r].push(g);break;}}}
 const kill=new Set(hit.flat());const byOp={};for(const g of kill)(byOp[g.path+'#'+g.oi]=byOp[g.path+'#'+g.oi]||[]).push(g);const reps=[];
 for(const key of Object.keys(byOp)){const [path,oi]=[key.slice(0,key.lastIndexOf('#')),+key.slice(key.lastIndexOf('#')+1)];const st=acc.streams[path];const o=st.O[oi];const all=acc.glyphs.filter(g=>g.path===path&&g.oi===oi);reps.push({path,s:o.s,e:o.e,rep:rebuildShow(st,o,all,kill)});}
 return {reps,hit};}
return {lex,ops,analyse,commit,removeText,rebuildShow,mul,inv,ap,num,hexs,setStdW:f=>STDW=f,WINANSI};})();
//</edcs>
// map view fractions -> PDF user space for a pdf-lib page (handles crop box + rotation)
function edMap(p){const {x:bx,y:by,width:W,height:H}=p.getCropBox();const r=((p.getRotation().angle%360)+360)%360;return (fx,fy)=>{const [ux,uy]=r===90?[fy*W,fx*H]:r===180?[(1-fx)*W,fy*H]:r===270?[(1-fy)*W,(1-fx)*H]:[fx*W,(1-fy)*H];return [bx+ux,by+uy];};}
async function edStdW(P){if(edStdW.ok)return;const sd=await P.PDFDocument.create();const F={};const fam=n=>/Times/i.test(n)?(/Bold/i.test(n)?(/Italic/i.test(n)?'TimesRomanBoldItalic':'TimesRomanBold'):/Italic/i.test(n)?'TimesRomanItalic':'TimesRoman'):/Courier/i.test(n)?(/Bold/i.test(n)?'CourierBold':'Courier'):/Symbol|Dingbat/i.test(n)?null:(/Bold/i.test(n)?'HelveticaBold':'Helvetica');
 const tabs={};for(const k of ['Helvetica','HelveticaBold','TimesRoman','TimesRomanBold','TimesRomanItalic','TimesRomanBoldItalic','Courier','CourierBold'])tabs[k]=await sd.embedFont(P.StandardFonts[k]);
 EDCS.setStdW(new Proxy({},{get:(o,n)=>{const k=fam(String(n));const f=k&&tabs[k];return f?(ch=>{try{return f.widthOfTextAtSize(ch,1000);}catch(e){return 500;}}):null;}}));edStdW.ok=1;}
