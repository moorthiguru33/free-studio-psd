// @needs txt
// Resume / CV builder → PDF (pdf-lib standard fonts; text outside Windows-1252 is transliterated where possible).
const RS_EX=`Senior Product Designer | Northwind Labs, Berlin | 2022 – Present
- Led redesign of the mobile checkout, lifting conversion by 18%
- Built and documented a design system used by 6 product teams

Product Designer | Bright Apps, Toronto | 2019 – 2022
- Shipped 30+ features across web and iOS for 2M monthly users`;
TOOLS.resume={goLabel:()=>'Create resume PDF',noAdv:true,
 opts:()=>sel('rst','Template',[['classic','Classic (single column, ATS-friendly)'],['modern','Modern (coloured sidebar)'],['minimal','Minimal']])+sel('rsp','Paper',[['a4','A4'],['letter','US Letter']])+'<label>Accent colour<input id="rsc" type="color" value="#1f4e79"></label>',
 setup(){return box(`<div class="row2">${inp('rsn','Full name','text','Alex Morgan')}${inp('rsh','Headline / job title','text','Product Designer')}</div><div class="row2">${inp('rse','Email','email','alex@example.com')}${inp('rsph','Phone','text','+44 20 7946 0000')}</div><div class="row2">${inp('rsl','Location','text','London, UK')}${inp('rsw','Website / LinkedIn','text','linkedin.com/in/alexmorgan')}</div>${area('rss','Profile summary','Designer with 7 years of experience turning complex problems into simple, accessible products. Comfortable leading research, prototyping and design systems.',3)}${area('rsx','Experience (first line: Role | Company | Dates, then "- " bullets; blank line between jobs)',RS_EX,8)}${area('rsed','Education (same format)','BA Interaction Design | University of the Arts London | 2015 – 2018',3)}${inp('rsk','Skills (comma separated)','text','Figma, User research, Prototyping, HTML & CSS, Accessibility (WCAG), Workshop facilitation')}${inp('rsla','Languages (comma separated)','text','English (native), German (B2), Spanish (A2)')}${area('rsxtra','Extra section (optional: first line = heading)','Certifications\n- Google UX Design Certificate (2021)',3)}`);},
 async run(){const {PDFDocument,StandardFonts,rgb}=await L.pdflib();const d=await PDFDocument.create();const [W,H]=v('rsp')==='letter'?[612,792]:[595.28,841.89];const F=await d.embedFont(StandardFonts.Helvetica),B=await d.embedFont(StandardFonts.HelveticaBold),I=await d.embedFont(StandardFonts.HelveticaOblique);
  const tpl=v('rst'),acc=hex2rgb(v('rsc'),rgb),ink=rgb(.13,.13,.15),mut=rgb(.38,.4,.45);const name=WA(v('rsn'));if(!name.trim())throw soft('Enter your name.');d.setTitle(name+' – Resume');d.setAuthor(name);
  let p=d.addPage([W,H]);const side=tpl==='modern'?170:0;const M=42,X0=side?side+28:M,XW=W-X0-M;let y=H-M;
  const newPage=()=>{p=d.addPage([W,H]);if(side)p.drawRectangle({x:0,y:0,width:side,height:H,color:acc});y=H-M;};
  const need=h=>{if(y-h<M)newPage();};
  const text=(t,{f=F,s=10,c=ink,x=X0,w=XW,lh=1.35}={})=>{for(const l of wrapT(f,WA(t),s,w)){need(s*lh);p.drawText(l,{x,y:y-s,size:s,font:f,color:c});y-=s*lh;}};
  const heading=t=>{y-=8;need(30);p.drawText(WA(t).toUpperCase(),{x:X0,y:y-11,size:10.5,font:B,color:acc});y-=16;if(tpl!=='minimal')p.drawLine({start:{x:X0,y},end:{x:X0+XW,y},thickness:.8,color:acc});y-=8;};
  const blocks=s=>String(s||'').trim().split(/\n\s*\n/).filter(Boolean).map(b=>b.split('\n'));
  const entries=s=>{for(const b of blocks(s)){const [a='',c='',dt='']=b[0].split('|').map(x=>x.trim());need(40);p.drawText(WA(a),{x:X0,y:y-11,size:11,font:B,color:ink});if(dt){const dw=F.widthOfTextAtSize(WA(dt),9.5);p.drawText(WA(dt),{x:X0+XW-dw,y:y-11,size:9.5,font:F,color:mut});}y-=15;if(c)text(c,{f:I,s:10,c:mut});
   for(const l of b.slice(1)){const t=l.replace(/^\s*[-*•]\s*/,'');const bullet=/^\s*[-*•]/.test(l);need(14);if(bullet)p.drawText('-',{x:X0+2,y:y-10,size:10,font:F,color:acc});text(t,{x:bullet?X0+12:X0,w:XW-(bullet?12:0)});}y-=6;}};
  const contact=[v('rse'),v('rsph'),v('rsl'),v('rsw')].map(WA).filter(x=>x.trim());
  if(side){p.drawRectangle({x:0,y:0,width:side,height:H,color:acc});let sy=H-M;const white=rgb(1,1,1),soft2=rgb(.9,.93,.97);const st=(t,f,s,c)=>{for(const l of wrapT(f,WA(t),s,side-36)){p.drawText(l,{x:18,y:sy-s,size:s,font:f,color:c});sy-=s*1.35;}};
   st(name,B,17,white);sy-=2;st(v('rsh'),F,10.5,soft2);sy-=14;st('CONTACT',B,9.5,white);sy-=2;contact.forEach(c=>{st(c,F,8.8,soft2);sy-=3;});
   const sk=String(v('rsk')||'').split(',').map(s=>s.trim()).filter(Boolean);if(sk.length){sy-=12;st('SKILLS',B,9.5,white);sy-=2;sk.forEach(s=>{st('- '+s,F,9,soft2);});}
   const lg=String(v('rsla')||'').split(',').map(s=>s.trim()).filter(Boolean);if(lg.length){sy-=12;st('LANGUAGES',B,9.5,white);sy-=2;lg.forEach(s=>st(s,F,9,soft2));}}
  else{p.drawText(name,{x:X0,y:y-24,size:24,font:B,color:tpl==='minimal'?ink:acc});y-=30;if(v('rsh'))text(v('rsh'),{s:12,c:mut});y-=2;text(contact.join('   |   '),{s:9.5,c:mut});y-=4;}
  if(String(v('rss')).trim()){heading(side?'Profile':'Summary');text(v('rss'));}
  if(String(v('rsx')).trim()){heading('Experience');entries(v('rsx'));}
  if(String(v('rsed')).trim()){heading('Education');entries(v('rsed'));}
  if(!side){const sk=String(v('rsk')||'').trim();if(sk){heading('Skills');text(sk.split(',').map(s=>s.trim()).filter(Boolean).join('  -  '));}const lg=String(v('rsla')||'').trim();if(lg){heading('Languages');text(lg);}}
  const ex=String(v('rsxtra')||'').trim();if(ex){const [h,...rest]=ex.split('\n');heading(h);entries('|\n'+rest.join('\n'));}
  const out=await d.save();const fn=(name.trim().replace(/[^\w]+/g,'-')||'resume')+'-resume.pdf';return {blob:pdfBlob(out),name:fn,info:`${d.getPageCount()} page${d.getPageCount()>1?'s':''} · ${tpl} template · ${v('rsp').toUpperCase()}`};}};
