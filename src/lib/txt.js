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
