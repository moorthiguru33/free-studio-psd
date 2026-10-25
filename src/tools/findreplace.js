// @needs pdfx edcs
// ---------- Find & replace: removes original glyphs from the content stream, redraws in original font/size/colour ----------
TOOLS.findreplace={opts:()=>inp('frfind',T.o_find,'text','')+inp('frrep',T.o_replace,'text','')+chk('frcase',T.o_matchCase,true)+'<label>More pairs (one per line: old => new)<textarea id="frlist" rows="3" placeholder="2025 => 2026"></textarea></label>',
 async run([f]){const P=await L.pdflib();const {PDFDocument,rgb,cmyk,StandardFonts,PDFName}=P;const data=await buf(f);const d=await PDFDocument.load(data);await edStdW(P);
  const pairs=[[v('frfind'),v('frrep')||''],...(($('#frlist')||{}).value||'').split('\n').map(l=>l.split('=>')).filter(a=>a.length===2).map(a=>[a[0].trim(),a[1].trim()])].filter(a=>a[0]);if(!pairs.length)throw new Error(T.o_find);
  const cs=vb('frcase');let hits=0,orig=0,skipped=0;const stdCache={};
  const colOf=fl=>{const a=(fl||'').trim().split(/\s+/);const op=a.pop();const n=a.map(Number);if(op==='g'&&n.length===1)return rgb(n[0],n[0],n[0]);if(op==='rg'&&n.length===3)return rgb(...n);if(op==='k'&&n.length===4)return cmyk(...n);return rgb(0,0,0);};
  const stdFor=async nm=>{const k=/Courier|Mono/i.test(nm)?(/Bold/i.test(nm)?'CourierBold':'Courier'):/Times|Serif|Roman|Georgia|Garamond/i.test(nm)?(/Bold/i.test(nm)?(/Italic/i.test(nm)?'TimesRomanBoldItalic':'TimesRomanBold'):/Italic/i.test(nm)?'TimesRomanItalic':'TimesRoman'):(/Bold/i.test(nm)?(/Oblique|Italic/i.test(nm)?'HelveticaBoldOblique':'HelveticaBold'):/Oblique|Italic/i.test(nm)?'HelveticaOblique':'Helvetica');return stdCache[k]=stdCache[k]||await d.embedFont(StandardFonts[k]);};
  for(let pi=0;pi<d.getPageCount();pi++){const acc=EDCS.analyse(d,P,pi);const G=acc.glyphs.filter(g=>g.font&&g.font.okEnc&&g.Tr!==3&&g.Tr!==7);if(!G.length)continue;
   // build lines of text with glyph index map
   const lines=[];let cur=null;for(const g of G){const sz=g.fs*Math.hypot(g.trm[0],g.trm[1])||1;const rot=Math.abs(g.trm[1])>1e-3||Math.abs(g.trm[2])>1e-3;
    if(!cur||rot||cur.rot||Math.abs(g.org[1]-cur.y)>sz*0.4||g.org[0]<cur.x-sz*0.3||g.org[0]-cur.x>sz*1.5){cur={s:'',map:[],y:g.org[1],x:g.org[0],sz,rot};lines.push(cur);}
    else if(g.org[0]-cur.x>sz*0.2&&!cur.s.endsWith(' ')&&g.uni!==' '){cur.s+=' ';cur.map.push(null);}
    const u=g.uni||'';for(const ch of u){cur.s+=ch;cur.map.push(g);}cur.x=g.org[0]+g.adv*Math.hypot(g.trm[0],g.trm[1]);}
   const kill=new Set();const draws=[];
   for(const ln of lines){if(ln.rot)continue;const S=cs?ln.s:ln.s.toLowerCase();const taken=new Array(S.length).fill(false);
    for(const [q,rep] of pairs){const qq=cs?q:q.toLowerCase();let at=S.indexOf(qq);
     while(at>=0){const gs=[...new Set(ln.map.slice(at,at+qq.length).filter(Boolean))];if(gs.length&&!taken.slice(at,at+qq.length).some(Boolean)){for(let k=at;k<at+qq.length;k++)taken[k]=true;gs.forEach(g=>kill.add(g));draws.push({g:gs[0],gs,rep});hits++;}at=S.indexOf(qq,at+Math.max(1,qq.length));}}}
   if(!kill.size)continue;
   // rebuild show operators without the killed glyphs
   const byOp={};for(const g of kill)(byOp[g.path+'#'+g.oi]=1);const reps=[];
   for(const key of Object.keys(byOp)){const i=key.lastIndexOf('#');const path=key.slice(0,i),oi=+key.slice(i+1);const st=acc.streams[path];const o=st.O[oi];const all=acc.glyphs.filter(g=>g.path===path&&g.oi===oi);
    reps.push({path,s:o.s,e:o.e,rep:EDCS.rebuildShow?EDCS.rebuildShow(st,o,all,kill):null});}
   if(reps.some(r=>r.rep==null)){// fall back to rect-based remover
    reps.length=0;const R=draws.flatMap(dw=>dw.gs.map(g=>[g.cx-0.01,g.cy-0.01,g.cx+0.01,g.cy+0.01]));reps.push(...EDCS.removeText(d,P,acc,R).reps);}
   // redraw replacements: original embedded font when it has every glyph, else closest standard font; same size & colour
   const p=d.getPage(pi);const res=p.node.Resources();let fdict=res.lookup(PDFName.of('Font'));if(!fdict){fdict=d.context.obj({});res.set(PDFName.of('Font'),fdict);}let fid=0;const fname={};let extra='';const later=[];
   for(const {g,rep} of draws){if(!rep)continue;const f=g.font;let parts=null;
    if(f&&!f.type3){const rev={};const src=f.tu||(f.twoByte?null:EDCS.WINANSI);if(src){for(const [c,u] of Object.entries(src))if(u&&u.length===1&&!(u in rev)&&(f.w[c]>0||f.std||u===" "))rev[u]=+c;parts=[];for(const ch of rep){const c=rev[ch];if(c===undefined){if(ch===' '){parts.push(-280);continue;}parts=null;break;}parts.push(f.twoByte?String.fromCharCode(c>>8,c&255):String.fromCharCode(c));}}}
    if(parts){let nm=fname[f.ref.toString()];if(!nm){if(!g.inForm&&fdict.get(PDFName.of(g.fname))===f.ref)nm=g.fname;else{do{nm='FrF'+(fid++);}while(fdict.get(PDFName.of(nm)));fdict.set(PDFName.of(nm),f.ref);}fname[f.ref.toString()]=nm;}
     const fill=/^[\d.\s-]+(g|rg|k)$/.test((g.fill||'').trim())?g.fill.trim():'0 g';
     extra+=`\nq ${g.trm.map(EDCS.num).join(' ')} cm BT /${nm} ${EDCS.num(g.fs)} Tf ${EDCS.num(g.Th*100)} Tz 0 Tc 0 Tw 0 Tr ${fill} 0 0 Td [${parts.map(x=>typeof x==='number'?String(x):EDCS.hexs(x)).join(' ')}] TJ ET Q`;orig++;}
    else later.push({g,rep});}
   const len=acc.streams.p.content.length;reps.push({path:'p',s:0,e:0,rep:'q\n'},{path:'p',s:len,e:len,rep:'\nQ'+extra+'\n'});EDCS.commit(d,P,acc,reps);
   for(const {g,rep} of later){const size=g.fs*Math.hypot(g.trm[0],g.trm[1]);const color=colOf(g.fill);
    try{const ft=await stdFor((g.font&&g.font.name)||g.fname||'');ft.encodeText(rep);p.drawText(rep,{x:g.org[0],y:g.org[1],size,font:ft,color});}catch(e){await drawText(d,p,rep,{x:g.org[0],y:g.org[1],size,color});}}}
  if(!hits)throw new Error(T.o_notFound+': '+pairs.map(a=>a[0]).join(', '));
  return {blob:pdfBlob(await d.save()),name:base(f.name)+'-replaced.pdf',info:`${hits} replacement(s) – old text removed; ${orig} redrawn in the original font`};}};
