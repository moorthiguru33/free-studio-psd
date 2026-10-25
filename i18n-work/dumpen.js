const fs=require('fs');const merge=(a,b)=>{if(Array.isArray(b)||typeof b!=='object'||!b)return b;const o={...a};for(const k in b)o[k]=(a&&typeof a[k]==='object'&&!Array.isArray(a[k]))?merge(a[k],b[k]):b[k];return o;};
let o=JSON.parse(fs.readFileSync('src/i18n/en.json'));for(const f of fs.readdirSync('src/i18n/en').sort())o=merge(o,JSON.parse(fs.readFileSync('src/i18n/en/'+f)));
let T=[];for(const f of fs.readdirSync('src/tools.d'))T=T.concat(JSON.parse(fs.readFileSync('src/tools.d/'+f)));
module.exports={o,T};
