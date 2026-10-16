export async function onRequestGet({ request, env, params }) {
  const cache = caches.default;
  let res = await cache.match(request);
  if (res) return res;
  const key = 'img/' + [].concat(params.path || []).join('/');
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  res = new Response(obj.body, { headers: {
    'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'ETag': obj.httpEtag } });
  await cache.put(request, res.clone());
  return res;
}
