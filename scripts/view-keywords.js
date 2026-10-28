#!/usr/bin/env node
// View SEO Keywords for any tool in any language
// Usage: node scripts/view-keywords.js [slug-or-id] [lang] [--all]

const fs = require('fs');
const path = require('path');
const { generateKeywords } = require('../src/seo/keyword-engine.js');

const R = p => path.join(__dirname, '..', p);
const tools = JSON.parse(fs.readFileSync(R('src/tools.json')));
if (fs.existsSync(R('src/tools.d'))) {
  for (const f of fs.readdirSync(R('src/tools.d')).sort()) {
    if (f.endsWith('.json')) tools.push(...JSON.parse(fs.readFileSync(R('src/tools.d/' + f))));
  }
}

const merge = (a, b) => {
  if (Array.isArray(a) || typeof a !== 'object') return b === undefined ? a : b;
  const o = { ...a };
  for (const k in b) o[k] = merge(a[k], b[k]);
  return o;
};

const load = c => {
  let o = JSON.parse(fs.readFileSync(R(`src/i18n/${c}.json`)));
  const d = R(`src/i18n/${c}`);
  if (fs.existsSync(d)) {
    for (const f of fs.readdirSync(d).sort()) {
      o = merge(o, JSON.parse(fs.readFileSync(path.join(d, f))));
    }
  }
  return o;
};

const args = process.argv.slice(2);
const target = args[0] || 'cdr-version-converter';
const lang = args[1] || 'en';
const showAll = args.includes('--all');

const tool = tools.find(x => x.slug === target || x.id === target);
if (!tool) {
  console.error(`Tool "${target}" not found.`);
  console.log('Try: cdr-version-converter, merge-pdf, compress-image, jpg-to-pdf, etc.');
  process.exit(1);
}

const i18n = load(lang);
const toolDef = (i18n.tools && i18n.tools[tool.id]) || { name: tool.name };
const kws = generateKeywords(tool, toolDef, lang);

const toolName = toolDef.name || (EN.tools && EN.tools[tool.id] && EN.tools[tool.id].name) || tool.slug;

console.log('====================================================');
console.log(`Tool:        ${toolName} (${tool.slug})`);
console.log(`Language:    ${lang.toUpperCase()}`);
console.log(`Total Count: ${kws.length} Keywords`);
console.log('====================================================');

if (showAll) {
  kws.forEach((kw, i) => console.log(`${i + 1}. ${kw}`));
} else {
  console.log('\n--- First 30 Keywords (Included in HTML Meta & Chips) ---');
  kws.slice(0, 30).forEach((kw, i) => console.log(`  ${i + 1}. ${kw}`));
  console.log(`\n... and ${kws.length - 30} more long-tail keywords indexed in Schema.org JSON-LD.`);
  console.log('\nTo see all ' + kws.length + ' keywords, run:');
  console.log(`node scripts/view-keywords.js ${tool.slug} ${lang} --all`);
}
