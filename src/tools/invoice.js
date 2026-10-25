// @needs pdfx
// Simple invoice maker -> PDF (multi-script text, any currency). Live totals.
const CUR=['USD $','EUR €','GBP £','INR ₹','JPY ¥','CNY ¥','AUD $','CAD $','SGD $','AED','BRL R$','MXN $','ZAR R','CHF','SEK kr','NGN ₦','IDR Rp','PHP ₱'];
const today=()=>new Date().toISOString().slice(0,10);
TOOLS.invoice={goLabel:()=>T.o_invCreate,
 opts:()=>`<label>${esc(T.o_invFrom)}<textarea id="ifrom" rows="3" placeholder="Your Company\n1 Main St, City\nyou@example.com"></textarea></label><label>${esc(T.o_invTo)}<textarea id="ito" rows="3" placeholder="Client name\nAddress"></textarea></label>`+
  inp('ino',T.o_invNo,'text','INV-001')+inp('idate',T.o_invDate,'date',today())+inp('idue',T.o_invDue,'date','')+sel('icur',T.o_invCurrency,CUR.map(c=>[c,c]))+
  `<label style="grid-column:1/-1">${esc(T.o_invItems)}<textarea id="iitems" rows="5" placeholder="Website design | 1 | 1200\nHosting (12 months) | 12 | 15"></textarea><small class="hint">${esc(T.o_invItemsHint)}</small></label>`+
  inp('itax',T.o_invTax+' (%)','number','0','min="0" max="100" step="any"')+inp('idisc',T.o_invDiscount,'number','0','min="0" step="any"')+`<label style="grid-column:1/-1">${esc(T.o_invNotes)}<textarea id="inotes" rows="2" placeholder="Payment details, thank you note…"></textarea></label>`,
 items(){return (v('iitems')||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(a=>a[0]).map(([d,q,p])=>{const qty=parseFloat((q||'1').replace(',','.'))||0,pr=parseFloat((p||'0').replace(/[^\d.,-]/g,'').replace(',','.'))||0;return {d,qty,pr,t:qty*pr};});},
 totals(){const it=this.items();const sub=it.reduce((a,b)=>a+b.t,0);const disc=+v('idisc')||0;const tax=(sub-disc)*(+v('itax')||0)/100;return {it,sub,disc,tax,total:sub-disc+tax};},
 money(n){const c=v('icur');const sym=c.split(' ')[1]||c;return sym+' '+n.toLocaleString('en',{minimumFractionDigits:c.startsWith('JPY')||c.startsWith('IDR')?0:2,maximumFractionDigits:c.startsWith('JPY')||c.startsWith('IDR')?0:2});},
 setup(){const el=document.createElement('p');el.className='hint';el.id='itot';el.style.textAlign='center';const up=()=>{const t=this.totals();el.textContent=`${t.it.length} ${T.o_invLines} · ${T.o_invTotal}: ${this.money(t.total)}`;};if(!this.bound)this.bound=1,work.addEventListener('input',()=>$('#itot',work)&&up());setTimeout(up,0);return el;},
 async run(){const t=this.totals();if(!t.it.length)throw new Error(T.o_invItemsHint);const {PDFDocument,rgb}=await L.pdflib();const d=await PDFDocument.create();d.setTitle(`${T.o_invoice} ${v('ino')}`);d.setProducer('Fileopia');
  const W=595.28,H=841.89,M=50;let p=d.addPage([W,H]);const tx=async(s,x,y,size=10,bold=false,color=rgb(.15,.15,.15),align='l')=>{const runs=await textRuns(d,String(s),bold);const w=runsWidth(runs,size);drawRuns(p,runs,{x:align==='r'?x-w:x,y,size,color});return w;};
  const acc=rgb(.11,.33,.75);p.drawRectangle({x:0,y:H-8,width:W,height:8,color:acc});
  await tx(T.o_invoice.toUpperCase(),W-M,H-M-14,24,true,acc,'r');let y=H-M-14;for(const l of (v('ifrom')||'').split('\n')){await tx(l,M,y,l===(v('ifrom')||'').split('\n')[0]?13:10,l===(v('ifrom')||'').split('\n')[0]);y-=15;}
  let yr=H-M-40;for(const [k,val] of [[T.o_invNo,v('ino')],[T.o_invDate,v('idate')],[T.o_invDue,v('idue')]])if(val){await tx(k+':',W-M-150,yr,9,false,rgb(.45,.45,.45));await tx(val,W-M,yr,10,true,undefined,'r');yr-=14;}
  y=Math.min(y,yr)-20;await tx(T.o_invTo.toUpperCase(),M,y,8,true,rgb(.45,.45,.45));y-=14;for(const l of (v('ito')||'').split('\n')){await tx(l,M,y,10);y-=14;}y-=16;
  const cols=[M,W-M-230,W-M-120,W-M];const head=async()=>{p.drawRectangle({x:M,y:y-6,width:W-2*M,height:20,color:rgb(.94,.95,.98)});await tx(T.o_invDesc,M+6,y,9,true);await tx(T.o_invQty,cols[1]+40,y,9,true,undefined,'r');await tx(T.o_invPrice,cols[2]+40,y,9,true,undefined,'r');await tx(T.o_invAmount,cols[3]-6,y,9,true,undefined,'r');y-=24;};await head();
  for(const i of t.it){if(y<M+120){p=d.addPage([W,H]);y=H-M;await head();}await tx(i.d.slice(0,70),M+6,y,10);await tx(i.qty,cols[1]+40,y,10,false,undefined,'r');await tx(this.money(i.pr),cols[2]+40,y,10,false,undefined,'r');await tx(this.money(i.t),cols[3]-6,y,10,false,undefined,'r');y-=8;p.drawLine({start:{x:M,y},end:{x:W-M,y},thickness:.4,color:rgb(.85,.85,.85)});y-=14;}
  y-=6;const row=async(k,val,b=false)=>{await tx(k,cols[2]-20,y,b?12:10,b);await tx(this.money(val),cols[3]-6,y,b?12:10,b,b?acc:undefined,'r');y-=b?22:16;};await row(T.o_invSubtotal,t.sub);if(t.disc)await row(T.o_invDiscount,-t.disc);if(t.tax)await row(`${T.o_invTax} (${+v('itax')}%)`,t.tax);
  p.drawLine({start:{x:cols[2]-20,y:y+12},end:{x:W-M,y:y+12},thickness:1,color:acc});y-=4;await row(T.o_invTotal,t.total,true);
  if(v('inotes')){y-=10;await tx(T.o_invNotes.toUpperCase(),M,y,8,true,rgb(.45,.45,.45));y-=14;for(const l of v('inotes').split('\n')){await tx(l,M,y,10);y-=14;}}
  return {blob:pdfBlob(await d.save()),name:`invoice-${(v('ino')||'1').replace(/[^\w-]+/g,'_')}.pdf`,info:`${T.o_invTotal}: ${this.money(t.total)}`};}};
