const fs=require('fs'),path=require('path');process.chdir('/workspace/freepdf-site');
const {o}=require('/tmp/dumpen.js');const tools=JSON.parse(fs.readFileSync('src/tools.json'));for(const f of fs.readdirSync('src/tools.d').sort())tools.push(...JSON.parse(fs.readFileSync('src/tools.d/'+f)));
const merge=(a,b)=>{if(Array.isArray(b)||typeof b!=='object'||!b)return b;const r={...a};for(const k in b)r[k]=(a&&typeof a[k]==='object'&&!Array.isArray(a[k]))?merge(a[k],b[k]):b[k];return r;};
const fill=(s,v)=>typeof s==='string'?s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m):s;
const toolText=(t,x)=>{if(!x.tpl){if(x.impl&&t.tools[x.impl]){const base=merge(t.tools[x.impl],{});delete base.seo;return merge(base,t.tools[x.id]||{});}return t.tools[x.id];}const fd=o=>Array.isArray(o)?o.map(fd):typeof o==='object'&&o?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,fd(v)])):fill(o,x.vars||{});return merge(fd(t.templates[x.tpl]),t.tools[x.id]||{});};
module.exports={o,tools,toolText};
if(require.main===module){const ids=process.argv[2].split(' ');for(const id of ids){const x=tools.find(t=>t.id===id);if(!x){console.log('NO',id);continue;}fs.writeFileSync(`/tmp/es/src/${id}.json`,JSON.stringify(toolText(o,x),null,1));}
fs.writeFileSync('/tmp/es/src/_ui.json',JSON.stringify({ui:o.ui,home:o.home,commonFaq:o.commonFaq},null,1));}
