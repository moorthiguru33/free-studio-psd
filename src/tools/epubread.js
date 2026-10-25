// EPUB Reader: reads EPUB 2/3 in the browser (container.xml -> OPF manifest/spine -> nav/NCX table of contents). Chapters are shown in a
// sandboxed iframe (scripts never run) with images, CSS and fonts served from blob URLs. Also opens DRM-free MOBI/AZW3/FB2 via lib/ebook.js.
// Controls: contents, previous/next, text size, night mode, full-text search across chapters, remembers the last chapter per book.
TOOLS.epubread={maxFiles:1,noAdv:true,goLabel:()=>T.o_erDl||'Download as EPUB',opts:()=>'',
 async setup(files){const box=$('.custom',work);if(!box)return;const f=files[0];const JSZip=await L.zip();let blob=f;
  if(!/\.epub$/i.test(f.name)){await load('ebook.js');blob=(await window.Ebook.toEpub(f,JSZip)).blob;}this._epub=blob;
  const z=await JSZip.loadAsync(await blob.arrayBuffer());const txt=p=>z.file(p)?.async('string');const X=s=>new DOMParser().parseFromString(s,'application/xml');
  const cont=X(await txt('META-INF/container.xml')||'');const opfPath=cont.querySelector('rootfile')?.getAttribute('full-path');if(!opfPath)throw new Error(T.o_erBad||'Not a valid EPUB file.');
  const dir=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')+1):'';const res=(b,h)=>{const u=new URL(h,'http://x/'+b);return decodeURIComponent(u.pathname.slice(1));};
  const opf=X(await txt(opfPath));const od=dir(opfPath);const man={};opf.querySelectorAll('manifest>item').forEach(i=>man[i.getAttribute('id')]={href:res(od,i.getAttribute('href')),type:i.getAttribute('media-type')||'',props:i.getAttribute('properties')||''});
  const spine=[...opf.querySelectorAll('spine>itemref')].map(r=>man[r.getAttribute('idref')]).filter(m=>m&&/html/.test(m.type)).map(m=>m.href);if(!spine.length)throw new Error(T.o_erBad||'Not a valid EPUB file.');
  const title=opf.querySelector('metadata title, metadata dc\\:title')?.textContent||base(f.name);
  const urls={};for(const m of Object.values(man))if(!/html/.test(m.type)&&z.file(m.href))urls[m.href]=URL.createObjectURL(new Blob([await z.file(m.href).async('uint8array')],{type:m.type}));
  const toc=[];try{const nav=Object.values(man).find(m=>/\bnav\b/.test(m.props));if(nav){const d=new DOMParser().parseFromString(await txt(nav.href),'text/html');(d.querySelector('nav[*|type="toc"], nav')||d).querySelectorAll('a[href]').forEach(a=>toc.push({t:a.textContent.trim(),h:res(dir(nav.href),a.getAttribute('href'))}));}
   if(!toc.length){const ncx=Object.values(man).find(m=>/ncx/.test(m.type));if(ncx)X(await txt(ncx.href)).querySelectorAll('navPoint').forEach(n=>toc.push({t:n.querySelector('text')?.textContent.trim()||'',h:res(dir(ncx.href),n.querySelector('content')?.getAttribute('src')||'')}));}}catch(e){}
  if(!toc.length)spine.forEach((h,i)=>toc.push({t:(T.o_erCh||'Chapter')+' '+(i+1),h}));
  const key='epubpos:'+title+':'+blob.size;let cur=Math.min(spine.length-1,+localStorage.getItem(key)||0),fs=100,night=false;
  box.innerHTML=`<div class="vbar"><button type="button" class="btn ghost" id="erp">‹</button><select id="ert" style="max-width:16em"></select><button type="button" class="btn ghost" id="ern">›</button><button type="button" class="btn ghost" id="ers">A−</button><button type="button" class="btn ghost" id="erb">A+</button><button type="button" class="btn ghost" id="ernt">◐</button><input id="erq" type="search" placeholder="${esc(T.o_vFind||'Search text…')}"></div><div id="erh" class="hint" style="max-height:7em;overflow:auto"></div><p class="hint" id="eri"></p><iframe id="erf" sandbox="allow-same-origin" style="width:100%;height:75vh;border:1px solid #ccd;border-radius:10px;background:#fff"></iframe>`;
  const sel=$('#ert',box);toc.forEach((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=c.t.slice(0,80);sel.append(o);});
  const fr=$('#erf',box);const cache={};
  const page=async i=>{if(cache[i])return cache[i];const p=spine[i];let h=await txt(p)||'';const d=new DOMParser().parseFromString(h,/<\?xml|xmlns=/.test(h)?'application/xhtml+xml':'text/html');const doc=d.querySelector('parsererror')?new DOMParser().parseFromString(h,'text/html'):d;
   doc.querySelectorAll('script,iframe,object,embed').forEach(x=>x.remove());const fix=v=>{if(!v||/^(https?:|data:|blob:|#|mailto:)/.test(v))return v;const r=res(dir(p),v.split('#')[0]);return urls[r]||v;};
   doc.querySelectorAll('[src]').forEach(e=>{const v=e.getAttribute('src');if(/^kindle:/i.test(v))e.remove();else e.setAttribute('src',fix(v));});doc.querySelectorAll('image').forEach(e=>{for(const a of ['href','xlink:href'])if(e.getAttribute(a))e.setAttribute(a,fix(e.getAttribute(a)));});
   doc.querySelectorAll('link[rel~="stylesheet"]').forEach(l=>l.setAttribute('href',fix(l.getAttribute('href'))));
   const body=doc.body||doc.querySelector('body');const head=doc.head||doc.querySelector('head');return cache[i]={head:head?head.innerHTML:'',body:body?body.innerHTML:h};};
  const css=()=>`<style>html{background:${night?'#16171b':'#fff'}}body{max-width:42em;margin:0 auto;padding:1.2em 1.4em 3em;font-size:${fs}%;line-height:1.65;color:${night?'#ddd':'#222'};font-family:Georgia,serif;word-wrap:break-word}img,svg,video{max-width:100%;height:auto}a{color:${night?'#8ab4f8':'#1a5fd0'}}${night?'*{background-color:transparent!important;color:inherit!important}':''}</style>`;
  const show=async(i,hash)=>{cur=Math.max(0,Math.min(spine.length-1,i));localStorage.setItem(key,cur);const c=await page(cur);fr.srcdoc=`<!doctype html><html><head><meta charset="utf-8">${c.head}${css()}</head><body>${c.body}</body></html>`;
   fr.onload=()=>{const d=fr.contentDocument;if(!d)return;if(hash){const t=d.getElementById(hash);if(t)t.scrollIntoView();}
    d.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const h=a.getAttribute('href');if(/^(https?:|mailto:)/.test(h)){e.preventDefault();window.open(h,'_blank','noopener');return;}e.preventDefault();if(h.startsWith('#')){d.getElementById(h.slice(1))?.scrollIntoView();return;}const [pp,hh]=res(dir(spine[cur]),h).split('#');const k=spine.indexOf(pp);if(k>=0)show(k,hh);});};
   let t=0;toc.forEach((c,k)=>{if(spine.indexOf(c.h.split('#')[0])<=cur&&spine.indexOf(c.h.split('#')[0])>=0)t=k;});sel.value=t;$('#eri',box).textContent=`${esc(title)} · ${cur+1} / ${spine.length}`;};
  sel.onchange=()=>{const [p,h]=toc[+sel.value].h.split('#');const k=spine.indexOf(p);if(k>=0)show(k,h);};$('#erp',box).onclick=()=>show(cur-1);$('#ern',box).onclick=()=>show(cur+1);
  $('#ers',box).onclick=()=>{fs=Math.max(70,fs-10);show(cur);};$('#erb',box).onclick=()=>{fs=Math.min(200,fs+10);show(cur);};$('#ernt',box).onclick=()=>{night=!night;show(cur);};
  let tm,texts=null;$('#erq',box).oninput=e=>{clearTimeout(tm);tm=setTimeout(async()=>{const q=e.target.value.trim().toLowerCase();const out=$('#erh',box);if(q.length<2){out.innerHTML='';return;}
   if(!texts){texts=[];for(let i=0;i<spine.length;i++){const d=new DOMParser().parseFromString((await page(i)).body,'text/html');texts.push(d.body.textContent.replace(/\s+/g,' '));}}
   const hits=[];texts.forEach((t,i)=>{const lt=t.toLowerCase();let k=lt.indexOf(q),c=0;while(k>=0&&c<20){hits.push({i,s:t.slice(Math.max(0,k-40),k+q.length+40)});k=lt.indexOf(q,k+1);c++;}});
   out.innerHTML=hits.length?`${hits.length} ${esc(T.o_vHits||'matches')}: `+hits.slice(0,30).map(h=>`<a href="#" data-i="${h.i}">${h.i+1}</a> <small>…${esc(h.s)}…</small>`).join(' · '):esc(T.o_vNone||'No matches');
   out.querySelectorAll('a').forEach(a=>a.onclick=ev=>{ev.preventDefault();show(+a.dataset.i);});},250);};
  await show(cur);},
 async run([f]){const b=this._epub||f;return {blob:b instanceof Blob&&b!==f?b:new Blob([await f.arrayBuffer()],{type:'application/epub+zip'}),name:base(f.name.replace(/\.fb2\.zip$/i,'.fb2'))+'.epub',info:''};}};
