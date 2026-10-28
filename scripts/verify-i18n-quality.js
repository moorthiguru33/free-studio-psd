const fs = require('fs');
const path = require('path');

const R = p => path.join(__dirname, '..', p);
const merge = (a, b) => {
  if (Array.isArray(a) || typeof a !== 'object') return b === undefined ? a : b;
  const o = { ...a };
  for (const k in b) o[k] = merge(a[k], b[k]);
  return o;
};
const load = c => {
  let o = JSON.parse(fs.readFileSync(R('src/i18n/' + c + '.json')));
  const d = R('src/i18n/' + c);
  if (fs.existsSync(d)) {
    for (const f of fs.readdirSync(d).sort()) {
      if (f.endsWith('.json')) o = merge(o, JSON.parse(fs.readFileSync(path.join(d, f))));
    }
  }
  return o;
};

const EN = load('en');
let tools = JSON.parse(fs.readFileSync(R('src/tools.json')));
fs.readdirSync(R('src/tools.d')).forEach(f => {
  if (f.endsWith('.json')) tools.push(...JSON.parse(fs.readFileSync(R('src/tools.d/' + f))));
});

const toolText = (t, x) => {
  if (!x.tpl) {
    if (x.impl && t.tools[x.impl]) {
      const base = merge(t.tools[x.impl], {});
      delete base.seo;
      return merge(base, t.tools[x.id] || {});
    }
    return t.tools[x.id];
  }
  const fillDeep = o => Array.isArray(o) ? o.map(fillDeep) : typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fillDeep(v)])) : String(o).replace(/\{(\w+)\}/g, (m, k) => (x.vars || {})[k] ?? m);
  return merge(fillDeep(t.templates[x.tpl]), t.tools[x.id] || {});
};

const un = x => String(x || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const Llen = x => [...un(x)].length;
const V = { brand: 'Fileopia' };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);

const langs = JSON.parse(fs.readFileSync(R('src/languages.json'))).filter(l => l.enabled);
let titleWarns = 0, descWarns = 0, dupTitles = 0, dupDescs = 0;

for (const L of langs) {
  const t = merge(EN, load(L.code));
  const titles = {}, descs = {};
  for (const x of tools) {
    const tt = toolText(t, x);
    if (!tt) {
      console.log(`[${L.code}] Missing tool text for ${x.id}`);
      continue;
    }
    const tit = fill(tt.title, V);
    const dsc = fill(tt.desc, V);
    const tLen = Llen(tit);
    const dLen = Llen(dsc);
    if (tLen > 60) {
      titleWarns++;
      if (titleWarns <= 5) console.log(`[${L.code}] Title too long (${tLen}): ${tit}`);
    }
    if (dLen < 70 || dLen > 155) {
      descWarns++;
      if (descWarns <= 5) console.log(`[${L.code}] Desc bad len (${dLen}): ${dsc}`);
    }
    if (titles[tit]) {
      dupTitles++;
      if (dupTitles <= 5) console.log(`[${L.code}] Dup title: ${tit} (tools: ${titles[tit]}, ${x.id})`);
    } else {
      titles[tit] = x.id;
    }
    if (descs[dsc]) {
      dupDescs++;
      if (dupDescs <= 5) console.log(`[${L.code}] Dup desc: ${dsc.slice(0, 40)} (tools: ${descs[dsc]}, ${x.id})`);
    } else {
      descs[dsc] = x.id;
    }
  }
}

console.log({ titleWarns, descWarns, dupTitles, dupDescs });
