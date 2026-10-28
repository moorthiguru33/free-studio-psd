// SEO audit over dist/: node scripts/seo-audit.js  (exit 1 on errors)
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '..', 'dist');
const site = require('../src/site.json');
const B = (process.env.SITE_URL || site.baseUrl).replace(/\/+$/, '');

const files = fs.readdirSync(D, { recursive: true }).filter(f => f.endsWith('index.html'));
const err = [], warn = [];
const T = new Map(), Dsc = new Map();
const canon = new Set();
const altPairs = new Set();
const altLinks = [];

const unshare = s => (s ? Buffer.from(s).toString('utf8') : '');
const m1 = (h, re) => {
  const m = h.match(re);
  return m ? unshare(m[1]) : null;
};
const un = x => x.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const L = x => [...un(x)].length;

for (let i = 0; i < files.length; i++) {
  const f = files[i];
  const h = fs.readFileSync(path.join(D, f), 'utf8');
  const u = '/' + f.replace(/\\/g, '/').replace(/index\.html$/, '');

  const t = m1(h, /<title>([^<]*)<\/title>/);
  const d = m1(h, /<meta name="description" content="([^"]*)"/);
  const c = m1(h, /<link rel="canonical" href="([^"]*)"/);
  const h1 = (h.match(/<h1[\s>]/g) || []).length;

  if (!t) {
    err.push(u + ' no title');
  } else {
    if (T.has(t)) {
      err.push(`duplicate title: ${t} (${T.get(t)} and ${u})`);
    } else {
      T.set(t, u);
    }
    if (L(t) > 60) warn.push(`${u} title ${L(t)} chars`);
  }

  if (!d) {
    err.push(u + ' no description');
  } else {
    if (Dsc.has(d)) {
      err.push(`duplicate description: ${d.slice(0, 60)} (${Dsc.get(d)} and ${u})`);
    } else {
      Dsc.set(d, u);
    }
    if (L(d) > 155 || L(d) < 70) warn.push(`${u} desc ${L(d)} chars`);
  }

  if (h1 !== 1) err.push(`${u} has ${h1} h1`);
  if (c !== B + u) err.push(`${u} canonical ${c}`);
  canon.add(u);

  let hasXDefault = false;
  let hasSelf = false;
  const reAlts = /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g;
  let match;
  while ((match = reAlts.exec(h)) !== null) {
    const lang = unshare(match[1]);
    const href = unshare(match[2].replace(B, ''));
    if (lang === 'x-default') {
      hasXDefault = true;
    } else {
      if (href === u) hasSelf = true;
      altPairs.add(u + '|' + href);
      altLinks.push([u, lang, href]);
    }
  }

  const hasAlts = altLinks.length > 0 && altLinks[altLinks.length - 1][0] === u;
  if (hasAlts) {
    if (!hasXDefault) err.push(u + ' hreflang without x-default');
    if (!hasSelf) err.push(u + ' hreflang missing self');
  }

  const reJsonLd = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let jMatch;
  while ((jMatch = reJsonLd.exec(h)) !== null) {
    try {
      const o = JSON.parse(jMatch[1]);
      if (!o['@context'] || !o['@type']) err.push(u + ' JSON-LD missing @context/@type');
      if (o['@type'] === 'FAQPage' && !o.mainEntity?.length) err.push(u + ' empty FAQ');
      if (o['@type'] === 'HowTo' && !o.step?.length) err.push(u + ' empty HowTo');
      if (o['@type'] === 'BreadcrumbList' && o.itemListElement.some(item => !item.item || !item.name)) {
        err.push(u + ' bad breadcrumb');
      }
    } catch (e) {
      err.push(u + ' invalid JSON-LD');
    }
  }

  if (/<img(?![^>]*\balt=)/.test(h)) warn.push(u + ' img without alt');
}

// Check hreflang reciprocals
for (let i = 0; i < altLinks.length; i++) {
  const [u, lang, href] = altLinks[i];
  if (!canon.has(href)) {
    err.push(`${u} hreflang ${lang} -> missing ${href}`);
  } else if (!altPairs.has(href + '|' + u)) {
    err.push(`${u} hreflang ${lang} not reciprocal (${href})`);
  }
}

// Sitemap checks
const sm = fs.readFileSync(path.join(D, 'sitemap.xml'), 'utf8');
if (!/sitemapindex/.test(sm)) err.push('sitemap.xml is not an index');
let n = 0;
for (const f of sm.match(/sitemap-[a-z0-9_-]+\.xml/g) || []) {
  const x = fs.readFileSync(path.join(D, f), 'utf8');
  for (const l of x.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    n++;
    if (!canon.has(l[1].replace(B, ''))) err.push(f + ' lists missing ' + l[1]);
  }
}

if (!fs.existsSync(path.join(D, '404.html'))) err.push('no 404.html');
if (!/Sitemap:/.test(fs.readFileSync(path.join(D, 'robots.txt'), 'utf8'))) err.push('robots without sitemap');

console.log(`pages ${files.length}, sitemap urls ${n}, errors ${err.length}, warnings ${warn.length}`);
const show = (k, a) => {
  const g = {};
  for (const e of a) {
    const key = e.replace(/^\/\S*\s/, '').replace(/\d+/g, '#').slice(0, 50);
    (g[key] = g[key] || []).push(e);
  }
  for (const [k2, v] of Object.entries(g)) console.log(k, v.length, '×', v[0]);
};
show('ERR', err);
warn.forEach(w => console.log('W', w));
process.exit(err.length ? 1 : 0);
