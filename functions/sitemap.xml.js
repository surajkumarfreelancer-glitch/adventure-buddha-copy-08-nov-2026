import { ensureSchema, liveTrips, getSettings } from '../lib/db.js';
export async function onRequestGet({ env, request }) {
  await ensureSchema(env);
  const o = new URL(request.url).origin;
  const s = await getSettings(env);
  const trips = await liveTrips(env);
  const urls = ['/', '/tours/', ...(s.categories || []).map((c) => '/tours/?categories=' + encodeURIComponent(c.match || c.id)), '/p/about-us', '/p/terms-and-conditions', '/p/privacy-policy', ...trips.map((t) => '/tour/' + t.slug)];
  const x = (u) => u.replace(/&/g, '&amp;');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${x(o + u)}</loc></url>`).join('')}</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
