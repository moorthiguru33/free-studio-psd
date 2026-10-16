const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let TPL = null, CFG = null;
const card = d => `<a class="card" href="/psd/${d.slug}/"><div class="im"><img loading="lazy" decoding="async" src="${d.img}" alt="${esc(d.t)}" width="${d.w}" height="${d.h}"></div><div class="tx"><h3>${esc(d.t)}</h3><div class="meta"><span>${esc(d.cn.replace(' PSD', ''))}</span><span>${esc(d.sz)}</span></div></div></a>`;
async function asset(env, origin, p) { const r = await env.ASSETS.fetch(new Request(origin + p)); if (!r.ok) throw new Error('asset ' + p + ' ' + r.status); return r; }
export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url), origin = url.origin;
  const cache = caches.default;
  const ck = new Request(origin + url.pathname);
  let hit = await cache.match(ck); if (hit) return hit;
  const parts = [].concat(params.slug || []);
  const slug = parts[0] || '';
  const notFound = async () => { const r = await asset(env, origin, '/404.html'); return new Response(r.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }); };
  const m = slug.match(/-(\d+)$/);
  if (!m || parts.length > 1) return notFound();
  if (!url.pathname.endsWith('/')) return Response.redirect(origin + '/psd/' + slug + '/', 301);
  const id = +m[1];
  if (!TPL) TPL = await (await asset(env, origin, '/_tpl/design/')).text();
  if (!CFG) CFG = await (await asset(env, origin, '/_tpl/cfg.json')).json();
  let shard;
  try { shard = await (await asset(env, origin, `/data/shard-${Math.floor((id - 1) / 200)}.json`)).json(); } catch (e) { return notFound(); }
  const d = shard.find(x => x.id === id);
  if (!d) return notFound();
  if (d.slug !== slug) return Response.redirect(origin + '/psd/' + d.slug + '/', 301);
  const S = CFG.SITE;
  const rel = shard.filter(x => x.id !== id && x.c === d.c).sort((a, b) => Math.abs(a.id - id) - Math.abs(b.id - id)).slice(0, 12);
  if (rel.length < 12) rel.push(...shard.filter(x => x.id !== id && x.c !== d.c).slice(0, 12 - rel.length));
  const nav = `<div class="pn">${d.pv ? `<a rel=prev href=/psd/${d.pv}/>‹ Previous design</a>` : '<span></span>'}${d.nx ? `<a rel=next href=/psd/${d.nx}/>Next design ›</a>` : ''}</div>`;
  const tags = (d.g || []).filter(k => CFG.TN[k]).map(k => `<a href="/tag/${k}/">${esc(CFG.TN[k])}</a>`).join('');
  const tot = CFG.CATTOT[d.c] || 1, pg = d.pg || 1; let more = [];
  for (let p = pg; p <= Math.min(tot, pg + 5); p++) more.push(`<a href="/category/${d.c}/${p === 1 ? '' : 'page/' + p + '/'}">Page ${p}</a>`);
  const ld = [{ "@context": "https://schema.org", "@type": "ImageObject", name: d.t, description: d.d, contentUrl: S + (d.zm || d.img), thumbnailUrl: S + d.img, encodingFormat: "image/webp", creator: { "@type": "Person", name: "Guru Moorthi" }, isAccessibleForFree: true },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: S + "/" }, { "@type": "ListItem", position: 2, name: d.cn, item: `${S}/category/${d.c}/` }, { "@type": "ListItem", position: 3, name: d.t }] }];
  const R = {
    ZZLDZZ: JSON.stringify(ld).replace(/</g, '\\u003c'), ZZTQZZ: encodeURIComponent(d.t), ZZHRZZ: d.zm ? ' (high resolution)' : '',
    ZZDESCZZ: esc(d.d.slice(0, 155)), ZZNAVZZ: nav, ZZTAGSZZ: tags, ZZRELZZ: rel.map(card).join(''), ZZMOREZZ: more.join(' '),
    ZZIDZZ: d.id, ZZSLUGZZ: d.slug, ZZTZZ: esc(d.t), ZZDZZ: esc(d.d), ZZCZZ: d.c, ZZCNZZ: esc(d.cn), ZZDIMZZ: esc(d.dim), ZZDPIZZ: esc(d.dpi),
    ZZSZZ: esc(d.sz), ZZIMGZZ: d.img, ZZZMZZ: d.zm || d.img, ZZWZZ: d.w, ZZHZZ: d.h };
  const html = TPL.replace(/ZZ[A-Z0-9]+ZZ/g, k => (k in R ? R[k] : k));
  const res = new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=600, s-maxage=86400' } });
  await cache.put(ck, res.clone());
  return res;
}
