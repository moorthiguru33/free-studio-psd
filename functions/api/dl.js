// Download gate: 50 downloads per IST day per person (stricter of client IP and signed device cookie).
// Counters live in the private R2 bucket freestudiopsd-dlcount (lifecycle deletes them after 2 days).
// Shards never contain raw Drive ids, only 'k' (fid XOR HMAC-SHA512(DL_KEY,'fid:'+id)); this is the only place it is decoded.
const BOT = /bot\b|bot\/|spider|crawl|slurp|curl|wget|python|httpx|aiohttp|scrapy|go-http|java\/|okhttp|libwww|perl|ruby|php\/|node-fetch|axios|undici|got\/|headless|phantom|selenium|puppeteer|playwright|httpclient|postman|insomnia|powershell|winhttp|apache-http|nutch|semrush|ahrefs|mj12|dotbot|petal|bytespider|gptbot|ccbot|claudebot|facebookexternalhit/i;
const MSG = 'Daily download limit reached (50 per day). Please come back tomorrow.';
const enc = new TextEncoder();
const keys = {};
async function hkey(secret) { return keys[secret] ||= crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']); }
async function mac(secret, s) { return new Uint8Array(await crypto.subtle.sign('HMAC', await hkey(secret), enc.encode(s))); }
const hex = (b, n = 32) => [...b].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, n);
const b64d = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const istDay = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const json = (o, st = 200, h = {}) => new Response(JSON.stringify(o), { status: st, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...h } });
const page = (t, st, h = {}) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Download – PSD Album</title><style>body{font:16px/1.5 system-ui,sans-serif;background:#FAF7F2;color:#222;display:grid;place-items:center;min-height:90vh;margin:0;padding:20px;text-align:center}a{color:#c46a00}</style></head><body><div><h1 style="font-size:22px">${t}</h1><p><a href="/">Back to PSD Album</a></p></div></body></html>`, { status: st, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...h } });
async function getN(env, k) { const o = await env.DLC.get(k); return o ? (parseInt(await o.text()) || 0) : 0; }

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), K = env.DL_KEY, LIMIT = parseInt(env.DL_LIMIT) || 50;
  if (!K || !env.DLC) return page('Downloads are temporarily unavailable. Please try again later.', 503);
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOT.test(ua)) return new Response('Forbidden', { status: 403, headers: { 'X-Robots-Tag': 'noindex' } });
  const id = parseInt(url.searchParams.get('id')) || 0;
  if (id < 1) return json({ error: 'bad id' }, 400);
  let ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  if (ip.includes(':')) { // IPv6: count per /64 (privacy addresses rotate inside it)
    const [h, t = ''] = ip.split('::'), H = h ? h.split(':') : [], T = t ? t.split(':') : [];
    ip = H.concat(Array(Math.max(0, 8 - H.length - T.length)).fill('0'), T).slice(0, 4).map(x => parseInt(x, 16) || 0).join(':') + '::/64'; }
  // signed device cookie
  let dev = null, setC = {};
  const ck = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)fspd=([0-9a-f]{32})\.([0-9a-f]{32})/);
  if (ck && hex(await mac(K, 'dev:' + ck[1])) === ck[2]) dev = ck[1];
  if (!dev) { dev = hex(crypto.getRandomValues(new Uint8Array(16))); setC = { 'Set-Cookie': `fspd=${dev}.${hex(await mac(K, 'dev:' + dev))}; Path=/api/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax` }; }
  const day = istDay();
  const kI = `${day}/i/${hex(await mac(K, 'ip:' + ip))}`, kD = `${day}/d/${hex(await mac(K, 'dv:' + dev))}`;
  const [nI, nD] = await Promise.all([getN(env, kI), getN(env, kD)]);
  const used = Math.max(nI, nD);
  if (url.searchParams.get('s') === '1') { // countdown start: issue a short-lived ticket bound to design + device cookie
    if (used >= LIMIT) return json({ limit: true, msg: MSG, used, max: LIMIT }, 429, setC);
    const ts = Date.now();
    return json({ t: ts + '.' + hex(await mac(K, `t:${id}:${ts}:${dev}`)), left: LIMIT - used }, 200, setC);
  }
  const t = (url.searchParams.get('t') || '').split('.');
  const ts = +t[0];
  if (t.length !== 2 || !ts || hex(await mac(K, `t:${id}:${ts}:${dev}`)) !== t[1] || Date.now() - ts > 3 * 3600e3)
    return Response.redirect(url.origin + '/download/?id=' + id, 302);
  if (Date.now() - ts < 8000) return page('Please wait for the countdown to finish, then click the download button.', 429, setC);
  if (used >= LIMIT) return page(MSG, 429, setC);
  const sh = await env.ASSETS.fetch(new Request(`${url.origin}/data/shard-${Math.floor((id - 1) / 200)}.json`));
  const d = sh.ok ? (await sh.json()).find(x => x.id === id) : null;
  if (!d || !(d.k || d.fid)) return page('Design not found.', 404, setC);
  let fid = d.fid;
  if (!fid) { const ks = await mac(K, 'fid:' + id), b = b64d(d.k); fid = new TextDecoder().decode(b.map((x, i) => x ^ ks[i])); }
  if (!/^[\w-]{10,80}$/.test(fid)) return page('Design not found.', 404, setC);
  await Promise.all([env.DLC.put(kI, String(nI + 1)), env.DLC.put(kD, String(nD + 1))]);
  return new Response(null, { status: 302, headers: { Location: 'https://drive.google.com/uc?export=download&id=' + fid, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-DL-Left': String(LIMIT - used - 1), ...setC } });
}
