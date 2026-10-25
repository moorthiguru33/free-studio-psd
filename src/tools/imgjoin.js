// @needs img
// Image joiner / stitcher: combine photos side by side, top to bottom or in a grid, matching heights/widths, with gap, border colour and max output size.
TOOLS.imgjoin={maxFiles:50,noAdv:true,
 opts:()=>sel('ijdir','Layout',[['h','Side by side (horizontal)'],['v','Top to bottom (vertical)'],['grid','Grid']])+inp('ijcols','Grid columns','number','2','min="1" max="10"')+sel('ijfit','Sizing',[['match','Match sizes (same height in a row / width in a column)'],['orig','Keep original sizes']])+`<div class="row2">${inp('ijgap','Gap (px)','number','0','min="0" max="200"')}${inp('ijbg','Background','color','#ffffff')}</div>`+sel('ijmax','Max output size',[['4000','4000 px'],['2048','2048 px'],['8000','8000 px'],['16000','16000 px (very large)']])+fmtSel('ijfmt','Format',false,['jpg','png','webp']),
 async run(files,status){const cs=[];for(const [i,f] of files.entries()){cs.push(await fileToCanvas(f));status(`${T.working} ${i+1}/${files.length}`);}if(cs.length<2)throw new Error('Add at least two images to join.');
  const dir=v('ijdir'),gap=Math.max(0,+v('ijgap')||0),match=v('ijfit')==='match';const cols=dir==='h'?cs.length:dir==='v'?1:Math.max(1,Math.min(10,+v('ijcols')||2));
  let cells;if(dir==='v'){const W=match?Math.max(...cs.map(c=>c.width)):0;cells=cs.map(c=>{const w=match?W:c.width,h=match?c.height*W/c.width:c.height;return {c,w,h};});}
  else if(dir==='h'){const H=match?Math.max(...cs.map(c=>c.height)):0;cells=cs.map(c=>{const h=match?H:c.height,w=match?c.width*H/c.height:c.width;return {c,w,h};});}
  else{const cw=Math.max(...cs.map(c=>c.width));cells=cs.map(c=>({c,w:cw,h:match?c.height*cw/c.width:c.height}));}
  const rows=[];for(let i=0;i<cells.length;i+=cols)rows.push(cells.slice(i,i+cols));
  if(dir==='grid'){/* each cell fits in a uniform box */const bw=Math.max(...cells.map(x=>x.w)),bh=Math.max(...cells.map(x=>x.h));rows.forEach(r=>r.forEach(x=>{x.bw=bw;x.bh=bh;}));}
  const rowW=r=>r.reduce((s,x)=>s+(x.bw||x.w),0)+gap*(r.length-1),rowH=r=>Math.max(...r.map(x=>x.bh||x.h));let W=Math.max(...rows.map(rowW))+gap*2,H=rows.reduce((s,r)=>s+rowH(r),0)+gap*(rows.length+1);
  const mx=+v('ijmax')||4000;const sc=Math.min(1,mx/Math.max(W,H));const out=document.createElement('canvas');out.width=Math.round(W*sc);out.height=Math.round(H*sc);const x=out.getContext('2d');x.fillStyle=v('ijbg')||'#fff';x.fillRect(0,0,out.width,out.height);x.imageSmoothingQuality='high';
  let y=gap;for(const r of rows){let xx=gap+(W-gap*2-rowW(r))/2;const rh=rowH(r);for(const cl of r){const bw=cl.bw||cl.w,bh=cl.bh||rh;const ox=(bw-cl.w)/2,oy=(bh-cl.h)/2+(cl.bh?0:(rh-cl.h)/2);x.drawImage(cl.c,(xx+ox)*sc,(y+oy)*sc,cl.w*sc,cl.h*sc);xx+=bw+gap;}y+=rh+gap;}
  const f=v('ijfmt')||'jpg';const blob=await encodeCanvas(out,f,.9);return {blob,name:`joined-${cs.length}-images.${f}`,info:`${out.width}×${out.height} px`,view:`<img src="${URL.createObjectURL(blob)}" alt="" style="max-width:100%;max-height:60vh;display:block;margin:10px auto;border-radius:8px">`};}};
