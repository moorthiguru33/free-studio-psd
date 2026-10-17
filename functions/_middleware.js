// psdalbum.in launch: 301 www + pages.dev to apex; noindex any other (preview) host.
const APEX = 'psdalbum.in';
const REDIRECT_HOSTS = new Set(['www.psdalbum.in', 'freestudiopsd.pages.dev']);
export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  const h = url.hostname;
  if (h === APEX) return ctx.next();
  if (REDIRECT_HOSTS.has(h)) {
    url.protocol = 'https:'; url.hostname = APEX; url.port = '';
    return Response.redirect(url.toString(), 301);
  }
  if (url.pathname === '/robots.txt')
    return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex' } });
  const r = await ctx.next();
  const res = new Response(r.body, r);
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}
