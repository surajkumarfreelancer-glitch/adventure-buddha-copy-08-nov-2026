import { isTrial } from '../lib/pages.js';
export function onRequestGet({ env, request }) {
  const o = new URL(request.url).origin;
  const body = isTrial(env) ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${o}/sitemap.xml\n`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
