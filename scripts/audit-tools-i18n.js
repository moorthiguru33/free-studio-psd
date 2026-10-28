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

console.log('Total tools in site:', tools.length);
console.log('Tools in loaded EN:', Object.keys(EN.tools || {}).length);

const langs = JSON.parse(fs.readFileSync(R('src/languages.json'))).filter(l => l.enabled);
console.log('Enabled languages:', langs.map(l => l.code).join(', '));

for (const L of langs) {
  const t = load(L.code);
  const toolKeys = Object.keys(t.tools || {});
  console.log(`Lang ${L.code}: has ${toolKeys.length} tools in root json`);
}
