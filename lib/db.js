// Database access (Cloudflare D1, bound as env.DB).
import { todayIST, addDays } from './util.js';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS trips (id TEXT PRIMARY KEY, slug TEXT UNIQUE, status TEXT, sort INTEGER DEFAULT 99, data TEXT NOT NULL, updated_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, trip_id TEXT, slot_date TEXT, status TEXT, phone TEXT, created_at INTEGER, data TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS bookings_trip ON bookings(trip_id, slot_date)`,
  `CREATE TABLE IF NOT EXISTS enquiries (id TEXT PRIMARY KEY, source TEXT, status TEXT, created_at INTEGER, data TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS coupons (code TEXT PRIMARY KEY, data TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, role TEXT, pass TEXT, active INTEGER DEFAULT 1, created_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT, expires INTEGER)`,
  `CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, type TEXT, data BLOB, size INTEGER, created_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, who TEXT, action TEXT, detail TEXT)`,
];

let ready = false;
export async function ensureSchema(env) {
  if (ready) return;
  if (!env.DB) throw new Error('NO_DB');
  await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
  ready = true;
}

export const DEFAULT_SETTINGS = {
  brand: 'Adventure Buddha',
  logo: 'https://tsprodimages.s3.ap-south-1.amazonaws.com/v/19804109/profileimages/ts_20240703141804000000504386082.webp',
  tagline: "India's favourite travel community for group trips",
  heroTitle: 'Weekend trips from Bangalore with a group that feels like friends by Sunday',
  heroText: 'Friday-night departures, AC travel, a comfortable stay and a trip lead who knows the route. You just pack the bag.',
  heroImage: 'https://tsprodimages.s3.ap-south-1.amazonaws.com/v/19804109/v/19804109/trips/ts_20260627035640000000838553006.webp',
  googleRating: '', googleReviewCount: '', googleReviewsUrl: '',
  phones: '8073465622 / 9353810775', callNumber: '919353810775', whatsapp: '919353810775', email: 'adventurebuddha@gmail.com',
  address: '#132, Chikka Bettahalli, BHEL Layout, Yelahanka, Bangalore 560097',
  upi: '9353810775@axisbank', advancePct: 50,
  instagram: 'https://www.instagram.com/adventurebuddha/', facebook: 'https://www.facebook.com/adventurebuddha/', youtube: 'https://www.youtube.com/channel/UCoacHXx07dz9Gmp8DGzACEw',
  stats: [{ v: '2,400+', k: 'trip enquiries' }, { v: '750+', k: 'bookings' }, { v: '30+', k: 'routes from Bangalore' }],
  trust: ['Trip lead on every departure', 'AC Tempo Traveller or mini bus', 'Balanced groups for solo travellers', 'Friday-night pickups across Bangalore', 'Pay 50% to hold your seat'],
  about: 'Adventure Buddha runs small group trips from Bangalore: weekend getaways, long weekends, one-day treks and backpacking trips. Every group travels with a trip lead, and we keep the male-to-female ratio balanced so solo travellers feel at home.',
  terms: 'Bookings are confirmed after the advance payment. The balance is due 24 hours before departure. If a departure does not reach the minimum group size, you can take a full refund or move to another date. Weather and road conditions can change the plan; your safety comes first.',
  cancellation: 'Cancellation more than 15 days before departure: 75% refund of the amount paid.\nBetween 7 and 15 days: 50% refund.\nLess than 7 days: no refund, but you can transfer your seat to a friend.',
  privacy: 'We use your name, phone number and email only to manage your booking and send you trip updates. We never sell your details. To delete your data, write to us at the email above.',
  reviews: [],
  pickups: [
    { place: 'Majestic (in front of Shanthala Silks)', time: '8:30 PM' },
    { place: 'Koramangala (opposite Forum Mall)', time: '9:00 PM' },
    { place: 'Silk Board', time: '10:00 PM' },
    { place: 'Electronic City (after toll plaza)', time: '10:20 PM' },
  ],
  favicon: '', twitter: '', linkedin: '', googleBusiness: '',
  heroSlides: [],
  moments: [],
  homeSections: [
    { k: 'ticker', type: 'ticker', on: true },
    { k: 'upcoming', type: 'upcoming', on: true, title: 'Upcoming trips', sub: "Pick a month, pick a weekend. We'll handle the rest." },
    { k: 'vibes', type: 'vibes', on: true, title: "What's your vibe?", sub: '' },
    { k: 'why', type: 'why', on: true, title: 'Travel more. *Worry less.*', sub: '' },
    { k: 'steps', type: 'steps', on: true, title: 'You pick the weekend. We do the rest.', sub: '' },
    { k: 'moments', type: 'moments', on: true, title: 'Moments from recent trips', sub: '' },
    { k: 'reviews', type: 'reviews', on: true, title: 'Loved by travellers', sub: '' },
    { k: 'callback', type: 'callback', on: true, title: "Not sure which trip? We'll call you.", sub: "Tell us your free dates. We'll suggest the right weekend." },
  ],
  whyItems: [
    { icon: 'guide', title: 'A trip lead on every departure', text: 'Part guide, part friend. Keeps the group together and the plan on time.' },
    { icon: 'transport', title: 'Planned end to end', text: 'AC travel, stay, food and sightseeing sorted. You just pack the bag.' },
    { icon: 'shield', title: 'Comfortable for solo travellers', text: 'Balanced groups and verified stays, so first-timers and women travelling alone feel at home.' },
    { icon: 'check', title: 'Clear prices, no surprises', text: 'GST included. What is and is not covered is written on every trip.' },
    { icon: 'pin', title: '4 pickup points in Bangalore', text: 'Majestic, Koramangala, Silk Board and Electronic City.' },
    { icon: 'wa', title: 'Real people on WhatsApp', text: 'Ask anything before you book and during the trip.' },
  ],
  menu: [
    { label: 'Weekend trips', url: '/tours/?categories=weekend trips from bangalore' },
    { label: 'Long weekend trips', url: '/tours/?categories=long weekend trips from bangalore' },
    { label: 'One-day trips', url: '/tours/?categories=one day trips from bangalore' },
    { label: 'All trips', url: '/tours/' },
    { label: 'About', url: '/p/about-us' },
  ],
  footerLinks: [
    { label: 'About us', url: '/p/about-us' },
    { label: 'Terms & cancellation', url: '/p/terms-and-conditions' },
    { label: 'Privacy policy', url: '/p/privacy-policy' },
  ],
  categories: [
    { id: 'weekend', name: 'Weekend trips', match: 'weekend trips from bangalore' },
    { id: 'long-weekend', name: 'Long weekend trips', match: 'long weekend trips from bangalore' },
    { id: 'one-day', name: 'One-day trips', match: 'one day trips from bangalore' },
    { id: 'backpacking', name: 'Backpacking', match: 'backpacking trips' },
    { id: 'christmas', name: 'Christmas trips', match: 'christmas trip' },
    { id: 'new-year', name: 'New Year trips', match: 'new year trip' },
  ],
};

export async function getSettings(env) {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('site').first();
  let s = {};
  if (row) { try { s = JSON.parse(row.value); } catch {} }
  return { ...DEFAULT_SETTINGS, ...s };
}
export async function saveSettings(env, s) {
  await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind('site', JSON.stringify(s)).run();
}

const rowTrip = (r) => ({ ...JSON.parse(r.data), id: r.id, slug: r.slug, status: r.status });
export async function allTrips(env) {
  const { results } = await env.DB.prepare('SELECT * FROM trips ORDER BY sort, updated_at DESC').all();
  return results.map(rowTrip);
}
export async function liveTrips(env) {
  const { results } = await env.DB.prepare("SELECT * FROM trips WHERE status = 'live' ORDER BY sort, updated_at DESC").all();
  return results.map(rowTrip);
}
export async function tripBy(env, field, value) {
  const r = await env.DB.prepare(`SELECT * FROM trips WHERE ${field === 'slug' ? 'slug' : 'id'} = ?`).bind(value).first();
  return r ? rowTrip(r) : null;
}
export async function saveTrip(env, t) {
  const { id, slug, status, ...rest } = t;
  await env.DB.prepare(`INSERT INTO trips (id, slug, status, sort, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, status = excluded.status, sort = excluded.sort, data = excluded.data, updated_at = excluded.updated_at`)
    .bind(id, slug, status || 'draft', Number(rest.order ?? 99) || 99, JSON.stringify(rest), Date.now()).run();
}

// Seats held: confirmed + pending (UPI holds) + online payments started in the last 30 minutes.
export async function seatsMap(env, tripIds) {
  if (!tripIds.length) return {};
  const since = Date.now() - 30 * 60000;
  const ph = tripIds.map(() => '?').join(',');
  const { results } = await env.DB.prepare(`SELECT trip_id, slot_date, SUM(json_extract(data, '$.people')) AS n FROM bookings
     WHERE trip_id IN (${ph}) AND (status IN ('confirmed','pending') OR (status = 'awaiting_payment' AND created_at > ?))
     GROUP BY trip_id, slot_date`).bind(...tripIds, since).all();
  const m = {};
  for (const r of results) m[r.trip_id + '|' + r.slot_date] = Number(r.n) || 0;
  return m;
}

/* ---------- pricing (the server is the source of truth) ---------- */
export const gstOf = (t) => (t.gst ?? 5);
export const withGst = (price, t) => Math.floor((Number(price) || 0) * (1 + gstOf(t) / 100) + 0.01);
export const ticketsOf = (t) => (t.tickets || []).filter((x) => x && x.name);
export const slotExtra = (slot) => Number(slot && slot.extra) || 0;
export const cutoff = (t) => addDays(todayIST(), Number(t.closeDays) || 0);
export const upcoming = (t) => (t.mode === 'enquire' ? [] : (t.slots || []).filter((s) => s && s.date && s.date >= cutoff(t)).sort((a, b) => a.date.localeCompare(b.date)));
export const ebOk = (tk, date) => !(Number(tk.ebDays) > 0) || addDays(todayIST(), Number(tk.ebDays)) <= date;
export function fromPrice(t) {
  const ts = ticketsOf(t); if (!ts.length) return 0;
  const s = upcoming(t); const ex = s.length ? Math.min(...s.map(slotExtra)) : 0;
  return Math.min(...ts.map((x) => withGst(Number(x.price) + ex, t)));
}
export function quote(t, slot, qty, coupon, plan, settings) {
  let sub = 0, people = 0; const items = [];
  for (const tk of ticketsOf(t)) {
    const q = Math.max(0, Math.min(50, Math.floor(Number(qty[tk.id]) || 0)));
    if (!q) continue;
    if (!ebOk(tk, slot.date)) throw new Error('ticket_closed');
    const price = (Number(tk.price) || 0) + slotExtra(slot);
    items.push({ ticketId: tk.id, name: tk.name, price, qty: q });
    sub += price * q; people += q * (Number(tk.pax) || 1);
  }
  let discount = 0;
  if (coupon) discount = coupon.type === 'pct' ? Math.round(sub * (Number(coupon.value) || 0) / 100) : Math.min(sub, (Number(coupon.value) || 0) * people);
  const base = Math.max(0, sub - discount);
  const gst = Math.floor(base * gstOf(t) / 100 + 0.01);
  const total = base + gst;
  const adv = Number(t.advancePct ?? settings.advancePct ?? 50);
  const payNow = plan === 'full' ? total : Math.round(total * adv / 100);
  return { items, sub, discount, gst, total, people, adv, payNow };
}

export const pickupsFor = (t, s) => ((t.pickups || []).filter((p) => p && p.place).length ? t.pickups : (s.pickups || [])).filter((p) => p && p.place);

export async function logActivity(env, who, action, detail = '') {
  try { await env.DB.prepare('INSERT INTO activity (at, who, action, detail) VALUES (?, ?, ?, ?)').bind(Date.now(), who || '', action, String(detail).slice(0, 300)).run(); } catch {}
}
