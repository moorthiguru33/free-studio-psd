// Shared helpers for text / dev / calculator tools (English-only pages)
const area=(id,label,val='',rows=8,ph='')=>`<label class="tl">${esc(label)}<textarea id="${id}" rows="${rows}" placeholder="${esc(ph)}" spellcheck="false">${esc(val)}</textarea></label>`;
const box=html=>{const el=document.createElement('div');el.className='txtbox';el.innerHTML=html;el.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(!b)return;let t=null;try{t=$('#'+b.dataset.copy,work)||$('#'+b.dataset.copy);}catch(_){}const s=t?(t.value??t.textContent):b.dataset.copy;navigator.clipboard?.writeText(s).catch(()=>{});const o=b.textContent;b.textContent='✓ Copied';setTimeout(()=>b.textContent=o,1200);});return el;};
const copyBtn=(id,l='Copy')=>`<button type="button" class="btn ghost mini" data-copy="${id}">${l}</button>`;
const txtOut=(name,s,type='text/plain')=>({name,blob:new Blob([s],{type:type+';charset=utf-8'})});
const soft=m=>{const e=new Error(m);e.soft=1;return e;};
const stats=rows=>`<dl class="stats">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
const nf=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:d}):'–';
const num=id=>{const s=String(v(id)??'').replace(/,/g,'').trim();return s===''?NaN:+s;};
const setHTML=(id,h)=>{const e=$('#'+id,work);if(e)e.innerHTML=h;};

// PDF text helpers (pdf-lib standard fonts)
const WA=s=>String(s||'').normalize('NFC').replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/\u2022/g,'-').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF\u20AC\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u2026\u2122]/g,c=>c.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?'));
function wrapT(font,text,size,maxW){const out=[];for(const para of String(text).split('\n')){let line='';for(const w of para.split(/\s+/)){const t=line?line+' '+w:w;if(font.widthOfTextAtSize(t,size)>maxW&&line){out.push(line);line=w;}else line=t;}out.push(line);}return out;}
const hex2rgb=(h,rgb)=>rgb(parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255);
