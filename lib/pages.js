// Shared logic for the public page routes.
import { getSettings, liveTrips, tripBy, seatsMap, ensureSchema } from './db.js';
import { homePage, listPage, tripPage, textPage, notFoundPage, metaDesc } from './render.js';
import { html } from './util.js';

export const isTrial = (env) => String(env.SITE_MODE || 'trial').toLowerCase() !== 'live';

async function ctxFor(env, request, extra) {
  await ensureSchema(env);
  const s = await getSettings(env);
  const url = new URL(request.url);
  return { s, origin: url.origin, trial: isTrial(env), rzp: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET), ...extra };
}
const cacheHdr = { 'cache-control': 'public, max-age=60' };

export async function renderHome(env, request) {
  const trips = await liveTrips(env);
  const seats = await seatsMap(env, trips.map((t) => t.id));
  const ctx = await ctxFor(env, request, {});
  Object.assign(ctx, { title: `${ctx.s.brand} | Weekend & Group Trips from Bangalore`, desc: `${ctx.s.tagline}. Weekend getaways, long weekend trips, treks and backpacking trips from Bangalore with a trip lead and a fun group.`, canonical: '/', image: ctx.s.heroImage });
  return html(homePage(ctx, trips, seats), 200, cacheHdr);
}

export async function renderList(env, request) {
  const url = new URL(request.url);
  const ctx = await ctxFor(env, request, {});
  const want = (url.searchParams.get('categories') || '').trim().toLowerCase();
  const q = (url.searchParams.get('q') || '').trim();
  const cat = want ? (ctx.s.categories || []).find((c) => c.id === want || (c.match || '').toLowerCase() === want || c.name.toLowerCase() === want) : null;
  let trips = await liveTrips(env);
  if (cat) trips = trips.filter((t) => (t.categories || []).includes(cat.id));
  const seats = await seatsMap(env, trips.map((t) => t.id));
  const name = cat ? cat.name : 'All trips';
  Object.assign(ctx, { title: (cat && cat.seoTitle) || `${name} from Bangalore | ${ctx.s.brand}`, desc: (cat && cat.seoDesc) || `Book ${name.toLowerCase()} from Bangalore with ${ctx.s.brand}: dates, prices, itineraries and seats left.`, canonical: cat ? '/tours/?categories=' + encodeURIComponent(cat.match || cat.id) : '/tours/' });
  return html(listPage(ctx, trips, seats, cat, q), 200, cacheHdr);
}

export async function renderTrip(env, request, slug, preview) {
  const ctx = await ctxFor(env, request, {});
  const t = await tripBy(env, 'slug', slug);
  if (!t || (t.status !== 'live' && !preview)) {
    Object.assign(ctx, { title: 'Trip not found | ' + ctx.s.brand, desc: '', canonical: '' });
    return html(notFoundPage(ctx), 404);
  }
  const live = await liveTrips(env);
  const related = live.filter((x) => x.id !== t.id && (x.categories || []).some((c) => (t.categories || []).includes(c))).slice(0, 3);
  const seats = await seatsMap(env, [t.id, ...related.map((r) => r.id)]);
  Object.assign(ctx, { title: t.seoTitle || `${t.name} from Bangalore | ${ctx.s.brand}`, desc: metaDesc(t), canonical: '/tour/' + t.slug, image: t.cover });
  return html(tripPage(ctx, t, seats, related), 200, preview ? { 'cache-control': 'no-store' } : cacheHdr);
}

export async function renderText(env, request, kind) {
  const ctx = await ctxFor(env, request, {});
  const titles = { 'about-us': 'About us', 'terms-and-conditions': 'Terms & cancellation policy', 'privacy-policy': 'Privacy policy' };
  if (!titles[kind]) { Object.assign(ctx, { title: 'Page not found', desc: '', canonical: '' }); return html(notFoundPage(ctx), 404); }
  Object.assign(ctx, { title: `${titles[kind]} | ${ctx.s.brand}`, desc: String(ctx.s.about || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160), canonical: '/p/' + kind });
  return html(textPage(ctx, kind), 200, cacheHdr);
}
