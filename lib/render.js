// Server-rendered public pages (good for Google and fast on phones).
import { esc, fmtD, fmtShort, inr, todayIST, textOnly } from './util.js';
import { upcoming, fromPrice, withGst, ticketsOf, gstOf, slotExtra, pickupsFor } from './db.js';

// Page text written in the dashboard is stored as cleaned HTML; older plain text is shown as paragraphs.
export const rich = (v) => /<(p|ul|ol|h3|h4|b|strong|br)\b/i.test(String(v || '')) ? String(v) : esc(v).split(/\n+/).filter(Boolean).map((l) => `<p>${l}</p>`).join('');

const I = {
  wa: '<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6L3 21z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.3-1.3-2-1-1 .8a4 4 0 0 1-2.3-2.3l.8-1-1-2L9 9.5z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  meals: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 0-4 2.5-4 7h4"/>',
  guide: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0M12 14l1.5 3-1.5 4-1.5-4z"/>',
  transport: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
  stay: '<path d="M3 20V8M3 13h18v7M21 13a4 4 0 0 0-4-4h-6v4"/><circle cx="7" cy="10.5" r="1.8"/>',
  fire: '<path d="M12 21c-4 0-6.5-2.5-6.5-6 0-4 3.5-6 4-10 2.5 1.5 4 4 4 6 1-1 1.5-2 1.5-3 2 1.5 3.5 4 3.5 7 0 3.5-2.5 6-6.5 6z"/>',
  trek: '<path d="M3 20l6-11 4 6 3-4 5 9z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
};
export const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;
export const INCL = [
  { id: 'transport', name: 'Transport', icon: 'transport' }, { id: 'stay', name: 'Stay', icon: 'stay' }, { id: 'meals', name: 'Meals', icon: 'meals' },
  { id: 'guide', name: 'Trip lead', icon: 'guide' }, { id: 'sightseeing', name: 'Sightseeing', icon: 'eye' }, { id: 'trek', name: 'Trek', icon: 'trek' },
  { id: 'campfire', name: 'Campfire', icon: 'fire' }, { id: 'photos', name: 'Photos', icon: 'camera' }, { id: 'insurance', name: 'First aid', icon: 'shield' },
];

const waLink = (s, text) => 'https://wa.me/' + String(s.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(text || '');
const catOf = (s, id) => (s.categories || []).find((c) => c.id === id);
const seatsLeft = (seats, t, slot) => Math.max(0, (Number(slot.seats) || 0) - (seats[t.id + '|' + slot.date] || 0));
const img = (url, alt, attrs = '') => url ? `<img src="${esc(url)}" alt="${esc(alt || '')}" ${attrs}>` : '';

function head({ s, title, desc, canonical, image, jsonld, origin, trial }) {
  const ld = [{ '@context': 'https://schema.org', '@type': 'TravelAgency', name: s.brand, url: origin + '/', logo: s.logo, telephone: '+' + String(s.callNumber || '').replace(/\D/g, ''), email: s.email,
    address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Bengaluru', addressRegion: 'Karnataka', addressCountry: 'IN' },
    sameAs: [s.instagram, s.facebook, s.youtube, s.twitter, s.linkedin].filter(Boolean) }, ...(jsonld || [])];
  return `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${canonical ? `<link rel="canonical" href="${esc(origin + canonical)}">` : ''}
${trial ? '<meta name="robots" content="noindex,nofollow">' : ''}
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(s.brand)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
${canonical ? `<meta property="og:url" content="${esc(origin + canonical)}">` : ''}${image ? `<meta property="og:image" content="${esc(image.startsWith('/') ? origin + image : image)}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#3E4040">
<link rel="icon" href="${esc(s.favicon || s.logo)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=3">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>`;
}

function header(s, active) {
  const cur = (u) => { const c = (s.categories || []).find((x) => active === x.id); return (active === 'home' && u === '/') || (active === 'all' && /^\/tours\/?$/.test(u)) || (active === 'about' && u === '/p/about-us') || (c && decodeURIComponent(u).toLowerCase().includes('categories=' + String(c.match || c.id).toLowerCase())); };
  const nav = (s.menu || []).map((m) => `<a href="${esc(m.url)}" ${cur(m.url) ? 'aria-current="page"' : ''}>${esc(m.label)}</a>`).join('');
  return `<header class="site-head"><div class="wrap">
  <a class="brandmark" href="/">${s.logo ? img(s.logo, s.brand, 'height="48"') : `<span>${esc(s.brand)}</span>`}</a>
  <nav class="site-nav" id="site-nav" aria-label="Main">${nav}</nav>
  <a class="btn wa sm head-wa" href="${waLink(s, 'Hi Adventure Buddha! I want to know about your upcoming trips.')}" target="_blank" rel="noopener">${ic('wa')}<span class="t">WhatsApp us</span></a>
  <button class="menu-btn" data-act="nav" aria-label="Open menu" aria-controls="site-nav">${ic('menu')}</button>
</div></header>`;
}

function footer(s) {
  const tel = String(s.callNumber || '').replace(/\D/g, '');
  return `<footer class="foot"><div class="wrap">
  <div><a class="brandmark" href="/" style="color:var(--on-brand)">${s.logo ? img(s.logo, s.brand, 'height="60" loading="lazy"') : `<span>${esc(s.brand)}</span>`}</a>
    <p style="margin-top:12px;max-width:42ch;font-size:15px">${esc(s.tagline)}.</p><p style="margin-top:8px;font-size:14px">${esc(s.address)}</p></div>
  <div><h4>Trips</h4><ul>${(s.categories || []).map((c) => `<li><a href="/tours/?categories=${encodeURIComponent(c.match || c.id)}">${esc(c.name)}</a></li>`).join('')}</ul></div>
  <div><h4>Talk to us</h4><ul><li><a href="tel:+${tel}">Call ${esc(s.phones)}</a></li><li><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li><li><a href="${waLink(s, 'Hi Adventure Buddha!')}" target="_blank" rel="noopener">WhatsApp chat</a></li></ul></div>
  <div><h4>Company</h4><ul>${(s.footerLinks || []).map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join('')}
    ${[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['youtube', 'YouTube'], ['twitter', 'X (Twitter)'], ['linkedin', 'LinkedIn'], ['googleBusiness', 'Google reviews']].filter(([k]) => s[k]).map(([k, n]) => `<li><a href="${esc(s[k])}" target="_blank" rel="noopener">${n}</a></li>`).join('')}</ul></div>
  <div class="copy"><span>© ${new Date().getFullYear()} ${esc(s.brand)}</span><a href="/admin/">Team login</a></div>
</div></footer>
<div class="fab"><a class="w" href="${waLink(s, 'Hi Adventure Buddha!')}" target="_blank" rel="noopener" aria-label="WhatsApp us">${ic('wa')}</a><a class="c" href="tel:+${tel}" aria-label="Call us">${ic('phone')}</a></div>
<div id="modal-root"></div><div id="toast" role="status" aria-live="polite"></div>
<script>window.AB=${JSON.stringify({ wa: String(s.whatsapp || '').replace(/\D/g, ''), upi: s.upi, brand: s.brand }).replace(/</g, '\\u003c')}</script>
<script src="/assets/site.js?v=3" defer></script>`;
}

function page(ctx, active, body, extraClass = '') {
  const { s, trial } = ctx;
  return head(ctx) + `<body class="${extraClass}">${trial ? '<div class="trial-bar">Test website: bookings here are for testing only.</div>' : ''}${header(s, active)}<main>${body}</main>${footer(s)}</body></html>`;
}

export function tripCard(s, t, seats) {
  const slots = upcoming(t);
  const price = fromPrice(t);
  const mrp = Number(t.mrp) || 0;
  const early = ticketsOf(t).some((x) => Number(x.ebDays) > 0);
  const firstLeft = slots[0] ? seatsLeft(seats, t, slots[0]) : null;
  return `<article class="tcard" data-search="${esc((t.name + ' ' + (t.location || '') + ' ' + (t.tagline || '')).toLowerCase())}">
  <a class="img" href="/tour/${esc(t.slug)}">${img(t.cover, t.name, 'loading="lazy" width="400" height="300"')}
    <span class="tags"><span class="dur">${Number(t.days) || 1}D${Number(t.nights) ? ' / ' + Number(t.nights) + 'N' : ''}</span>${early ? '<span class="pill accent">Early bird</span>' : firstLeft !== null && firstLeft <= 5 && firstLeft > 0 ? `<span class="pill warn">${firstLeft} seats left</span>` : ''}</span>
    <h3>${esc(t.name)}</h3></a>
  <div class="body">
    <span class="loc">${ic('pin')}${esc(t.location || 'Bangalore')} · from Bangalore</span>
    ${t.mode === 'enquire' ? '<div class="dchips"><span>Dates on request</span></div>' : slots.length ? `<div class="dchips">${slots.slice(0, 3).map((x) => `<span>${fmtShort(x.date)}</span>`).join('')}${slots.length > 3 ? `<span class="more">+${slots.length - 3} more</span>` : ''}</div>` : '<div class="dchips"><span class="more">New dates soon</span></div>'}
    <div class="price-row">${price ? `${mrp > price ? `<s class="num">${inr(mrp)}</s>` : ''}<b class="num">${inr(price)}</b><span class="per">/ person</span>${mrp > price ? `<span class="save">Save ${inr(mrp - price)}</span>` : ''}` : '<b>Price on request</b>'}</div>
    <div class="card-acts"><button class="btn sm" data-act="callback" data-trip="${esc(t.id)}" data-name="${esc(t.name)}">${ic('phone')}Callback</button><a class="btn primary sm" href="/tour/${esc(t.slug)}">${t.mode === 'enquire' ? 'Plan this trip' : 'View trip'}</a></div>
  </div></article>`;
}

function board(s, trips, seats) {
  const rows = [];
  trips.forEach((t) => upcoming(t).forEach((sl) => rows.push({ t, sl })));
  rows.sort((a, b) => a.sl.date.localeCompare(b.sl.date));
  const top = rows.filter((r) => seatsLeft(seats, r.t, r.sl) > 0).slice(0, 6);
  return `<div class="board" aria-label="Upcoming departures"><div class="board-top"><span class="live">Departures from Bangalore</span><span>Seats</span></div>
  ${top.length ? top.map(({ t, sl }) => { const l = seatsLeft(seats, t, sl); return `<a class="board-row" href="/tour/${esc(t.slug)}"><span>${fmtD(sl.date)}</span><span class="t">${esc(sl.time || '20:30')}</span><span class="n">${esc(t.location || t.name)}</span><span class="s ${l <= 5 ? 'low' : ''}">${l} left</span></a>`; }).join('')
    : '<div class="board-empty">New departures are being added. Ask us on WhatsApp.</div>'}</div>`;
}

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const monKey = (iso) => String(iso).slice(0, 7);
const monLabel = (k) => MON[Number(k.slice(5, 7)) - 1] + " '" + k.slice(2, 4);
const VIBE = ['#2E8B6E', '#D97A2B', '#2468A0', '#784A8C', '#C2453A', '#3E4040'];

export function homePage(ctx, trips, seats) {
  const s = ctx.s;
  const tel = String(s.callNumber || '').replace(/\D/g, '');
  const reviews = (s.reviews || []).filter((r) => r && r.text);
  const own = (s.moments || []).filter(Boolean);
  const moments = (own.length ? own : trips.flatMap((t) => (t.gallery || []).map((g) => g.url)).filter(Boolean)).slice(0, own.length ? 12 : 5);
  const ht = String(s.heroTitle || '');
  const cut = ht.lastIndexOf(' ', Math.floor(ht.length * 0.6));
  const title = cut > 0 ? `${esc(ht.slice(0, cut))} <em>${esc(ht.slice(cut + 1))}</em>` : esc(ht);
  const ticker = [...(s.stats || []).map((x) => `${x.v} ${x.k}`), ...(s.trust || [])].filter(Boolean);
  const slides = (s.heroSlides || []).filter((x) => x && x.url);
  const card = (t) => tripCard(s, t, seats).replace('<article class="tcard"', `<article class="tcard" data-months="${[...new Set(upcoming(t).map((x) => monKey(x.date)))].join(' ')}"`);
  const head = (x, more = '', center = false) => `<div class="sec-head${center ? ' center' : ''}"><div><span class="bar"></span><h2>${hl(x.title)}</h2>${x.sub ? `<p>${esc(x.sub)}</p>` : ''}</div>${more}</div>`;
  let tint = false;
  const sec = (cls, inner, id = '') => { tint = !tint; return `<section class="sec ${cls || (tint ? 'tint' : '')}"${id ? ` id="${id}"` : ''}><div class="wrap">${inner}</div></section>`; };

  const R = {
    ticker: () => ticker.length ? `<div class="ticker" aria-label="Why travel with us"><div class="track">${[...ticker, ...ticker].map((x) => `<span>✦ ${esc(x)}</span>`).join('')}</div></div>` : '',
    upcoming: (x) => {
      const dated = trips.filter((t) => upcoming(t).length);
      const months = [...new Set(dated.flatMap((t) => upcoming(t).map((d) => monKey(d.date))))].sort().slice(0, 6);
      const order = [...dated].sort((a, b) => upcoming(a)[0].date.localeCompare(upcoming(b)[0].date));
      const rest = trips.filter((t) => !upcoming(t).length);
      return sec('', `${head(x, '<a class="more-link" href="/tours/">View all trips →</a>')}
        ${months.length > 1 ? `<div class="mtabs" role="tablist"><button class="on" data-act="month" data-m="">All</button>${months.map((m) => `<button data-act="month" data-m="${m}">${monLabel(m)}</button>`).join('')}</div>` : ''}
        ${trips.length ? `<div class="cards up-cards">${order.map(card).join('')}${rest.map(card).join('')}</div>` : '<div class="notice"><h3>New trips coming soon</h3>Message us on WhatsApp for upcoming dates.</div>'}`);
    },
    category: (x) => {
      const c = (s.categories || []).find((y) => y.id === x.cat); if (!c) return '';
      const list = trips.filter((t) => (t.categories || []).includes(c.id)); if (!list.length) return '';
      return sec('', `${head({ ...x, title: x.title || c.name + ' from Bangalore' }, `<a class="more-link" href="/tours/?categories=${encodeURIComponent(c.match || c.id)}">View all ${list.length} →</a>`)}<div class="cards">${list.slice(0, 8).map((t) => tripCard(s, t, seats)).join('')}</div>`);
    },
    vibes: (x) => {
      const vibes = (s.categories || []).map((c) => ({ c, list: trips.filter((t) => (t.categories || []).includes(c.id)) })).filter((v) => v.list.length).slice(0, 6);
      if (!vibes.length) return '';
      return sec('', `${head(x)}<div class="vibes">${vibes.map(({ c, list }, i) => { const fp = list.map(fromPrice).filter(Boolean); const cover = (list.find((t) => t.cover) || {}).cover; return `<a class="vibe" style="--v:${VIBE[i % VIBE.length]}" href="/tours/?categories=${encodeURIComponent(c.match || c.id)}">${img(cover, '', 'loading="lazy"')}<span><b>${esc(c.name)}</b><small>${list.length} trip${list.length > 1 ? 's' : ''}${fp.length ? ' · from ' + inr(Math.min(...fp)) : ''}</small></span></a>`; }).join('')}</div>`);
    },
    why: (x) => {
      const items = (s.whyItems || []).filter((w) => w && w.title); if (!items.length) return '';
      tint = !tint;
      return `<section class="sec dark"><div class="wrap">${head(x)}<div class="why">${items.map((w, n) => `<div style="--v:${WHYC[n % WHYC.length]}"><span class="wi">${ic(I[w.icon] ? w.icon : 'check')}</span><b>${esc(w.title)}</b>${w.text ? `<p>${esc(w.text)}</p>` : ''}</div>`).join('')}</div></div></section>`;
    },
    steps: (x) => sec('', `${head(x, '', true)}<div class="steps3">
      <div><b>Choose a trip and date</b><p>Every trip shows seats left, pickup points and the full day-by-day plan.</p></div>
      <div><b>Pay ${Number(s.advancePct) || 50}% to book</b><p>Pay online or by UPI to hold your seat. The balance is due a day before you leave.</p></div>
      <div><b>Show up Friday night</b><p>We add you to the trip WhatsApp group. Meet your trip lead at the pickup point. Bags in, music on.</p></div></div>`),
    moments: (x) => moments.length >= 3 ? sec('', `${head(x, s.instagram ? `<a class="more-link" href="${esc(s.instagram)}" target="_blank" rel="noopener">More on Instagram →</a>` : '')}<div class="moments">${moments.map((u) => img(u, 'Adventure Buddha group trip', 'loading="lazy"')).join('')}</div>`) : '',
    reviews: (x) => reviews.length ? sec('', `${head({ ...x, sub: x.sub || (s.googleRating ? '' : '') }, s.googleReviewsUrl ? `<a class="more-link" href="${esc(s.googleReviewsUrl)}" target="_blank" rel="noopener">Read all reviews →</a>` : '')}${s.googleRating ? `<p style="margin:-10px 0 18px"><b class="gold">★ ${esc(s.googleRating)}</b> on Google${s.googleReviewCount ? ' from ' + esc(s.googleReviewCount) + ' reviews' : ''}</p>` : ''}
      <div class="reviews">${reviews.map((r, i) => `<figure class="review" style="margin:0"><span class="stars" aria-label="${Number(r.rating) || 5} stars">${'★'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 5)))}</span><blockquote class="rich" style="margin:0">${esc(r.text)}</blockquote><figcaption class="who"><span class="av" style="background:${VIBE[i % VIBE.length]}">${esc(String(r.name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase())}</span><span><b>${esc(r.name)}</b><br><span class="muted">${esc(r.trip || '')}${r.date ? ' · ' + esc(r.date) : ''}</span></span></figcaption></figure>`).join('')}</div>`, 'reviews') : '',
    text: (x) => (x.title || x.body) ? sec('', `${x.title ? head({ title: x.title, sub: x.sub }) : ''}<div class="rich" style="max-width:80ch">${x.body || ''}</div>`) : '',
    callback: (x) => `<section class="cta-band"><div class="wrap">
      <div><h2>${esc(x.title || '')}</h2>${x.sub ? `<p>${esc(x.sub)}</p>` : ''}<p style="margin-top:14px"><a class="btn dark" href="tel:+${tel}">${ic('phone')} ${esc(String(s.phones || '').split('/')[0].trim())}</a></p></div>
      <form class="cta-form" data-form="callback" data-kind="callback">
        <input class="in" name="name" required autocomplete="name" placeholder="Your name" aria-label="Your name">
        <input class="in" name="phone" required inputmode="tel" autocomplete="tel" placeholder="WhatsApp number (10 digits)" aria-label="WhatsApp number">
        <input class="in" name="message" placeholder="Which weekend or place? (optional)" aria-label="Which weekend or place">
        <input name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
        <button class="btn dark block" type="submit">Request a callback</button>
      </form></div></section>`,
  };

  const hero = `<section class="hero">${slides.length ? `<div class="slides">${slides.map((x, i) => img(x.url, '', i ? 'loading="lazy"' : 'fetchpriority="high"')).join('')}</div>` : img(s.heroImage, '', 'fetchpriority="high"')}<div class="wrap">
    ${s.googleRating ? `<a class="rating" href="${esc(s.googleReviewsUrl || '#reviews')}" ${s.googleReviewsUrl ? 'target="_blank" rel="noopener"' : ''}><span class="st">★★★★★</span><b>${esc(s.googleRating)}</b> on Google${s.googleReviewCount ? ' · ' + esc(s.googleReviewCount) + ' reviews' : ''}</a>` : `<span class="rating">${esc(s.tagline)}</span>`}
    <h1>${title}</h1><p class="lead">${esc(s.heroText)}</p>
    <form class="hero-search" action="/tours/" method="get" role="search"><input name="q" placeholder="Where do you want to go? Hampi, Coorg…" aria-label="Search trips"><button class="btn primary" type="submit">${ic('search')} Find trips</button></form>
    <div class="hero-chips">${(s.categories || []).slice(0, 5).map((c, i) => `<a class="${i ? '' : 'on'}" href="/tours/?categories=${encodeURIComponent(c.match || c.id)}">${esc(c.name)}</a>`).join('')}</div>
  </div>${slides.length ? `<div class="slide-caps">${slides.map((x, i) => x.caption ? `<a class="cap${i ? '' : ' on'}" data-i="${i}" href="${esc(x.link || '#')}">${esc(x.caption)} →</a>` : `<span class="cap${i ? '' : ' on'}" data-i="${i}"></span>`).join('')}${slides.length > 1 ? `<div class="dots">${slides.map((_, i) => `<button data-act="slide" data-i="${i}" class="${i ? '' : 'on'}" aria-label="Photo ${i + 1}"></button>`).join('')}</div>` : ''}</div>` : ''}</section>`;

  const body = hero + (s.homeSections || []).filter((x) => x && x.on !== false && R[x.type]).map((x) => R[x.type](x)).join('');
  return page(ctx, 'home', body, 'home');
}
const WHYC = ['#EF9A4C', '#2E8B6E', '#2468A0', '#C2453A', '#784A8C', '#25D366', '#D97A2B', '#3E4040', '#2E8B6E'];
// Headings: text between *stars* is shown in saffron, e.g. "Travel more. *Worry less.*"
const hl = (t) => esc(t || '').replace(/\*([^*]+)\*/g, '<em>$1</em>');

export function listPage(ctx, trips, seats, cat, q) {
  const s = ctx.s;
  const title = cat ? cat.name + ' from Bangalore' : 'All trips from Bangalore';
  const body = `<section class="sec"><div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Group trips</p><h1 class="trip-title" style="margin:6px 0 0">${esc(cat && cat.heading ? cat.heading : title)}</h1>${cat && cat.intro ? `<div class="rich" style="margin-top:10px;color:var(--muted)">${rich(cat.intro)}</div>` : ''}</div></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px"><input class="in" id="trip-q" type="search" placeholder="Search a place, like Hampi or Coorg" value="${esc(q || '')}" style="max-width:420px" aria-label="Search trips"></div>
    <div class="chips" style="margin-bottom:22px"><a class="chip ${!cat ? 'on' : ''}" href="/tours/">All</a>${(s.categories || []).map((c) => `<a class="chip ${cat && cat.id === c.id ? 'on' : ''}" href="/tours/?categories=${encodeURIComponent(c.match || c.id)}">${esc(c.name)}</a>`).join('')}</div>
    <div class="cards" id="trip-results">${trips.map((t) => tripCard(s, t, seats)).join('')}</div>
    <div class="notice" id="no-results" ${trips.length ? 'hidden' : ''}><h3>No trips match</h3>Try another place, or ask us on WhatsApp for custom dates.</div>
  </div></section>`;
  return page(ctx, cat ? cat.id : 'all', body);
}

export function tripPage(ctx, t, seats, related) {
  const s = ctx.s;
  const slots = upcoming(t);
  const ts = ticketsOf(t);
  const enquire = t.mode === 'enquire';
  const price = fromPrice(t);
  const mrp = Number(t.mrp) || 0;
  const incl = INCL.filter((x) => (t.inclusions || []).includes(x.id));
  const secs = (t.sections || []).filter((x) => x && (x.title || x.body));
  const days = (t.itinerary || []).filter((d) => d && (d.title || d.body));
  const faqs = (t.faqs || []).filter((f) => f && f.q && f.a);
  const photos = [t.cover, ...(t.gallery || []).map((g) => g.url)].filter(Boolean);
  const cat = catOf(s, (t.categories || [])[0]);
  const adv = Number(t.advancePct ?? s.advancePct ?? 50);
  const picks = pickupsFor(t, s);
  const facts = [
    `${ic('clock')} ${Number(t.days) || 1} days${Number(t.nights) ? ', ' + Number(t.nights) + ' night' + (Number(t.nights) > 1 ? 's' : '') : ''}`,
    `${ic('pin')} Pickup & drop: Bangalore`,
    t.groupSize ? `${ic('users')} ${esc(t.groupSize)}` : '',
    t.difficulty ? `${ic('trek')} ${esc(t.difficulty)}` : '',
    t.bestSeason ? `${ic('cal')} Best time: ${esc(t.bestSeason)}` : '',
  ].filter(Boolean);
  const bookBtn = enquire ? `<button class="btn primary block" data-act="callback" data-trip="${esc(t.id)}" data-name="${esc(t.name)}">Plan this trip with us</button>`
    : `<button class="btn primary block" data-act="book" ${slots.length ? '' : 'disabled'}>${slots.length ? 'Book your seat' : 'New dates coming soon'}</button>`;
  const widget = { id: t.id, name: t.name, gst: gstOf(t), adv, allowOnline: t.allowOnline !== false && !!ctx.rzp, upi: t.upi || s.upi,
    tickets: ts.map((x) => ({ id: x.id, name: x.name, price: Number(x.price) || 0, ebDays: Number(x.ebDays) || 0, pax: Number(x.pax) || 1, note: x.note || '' })),
    slots: slots.map((x) => ({ date: x.date, time: x.time || '20:30', left: seatsLeft(seats, t, x), extra: slotExtra(x) })),
    pickups: picks, today: todayIST() };
  const origin = ctx.origin;
  ctx.jsonld = [
    { '@context': 'https://schema.org', '@type': 'TouristTrip', name: t.name, description: t.seoDesc || t.tagline || '', image: photos.slice(0, 5).map((u) => u.startsWith('/') ? origin + u : u),
      touristType: 'Group travellers', provider: { '@type': 'TravelAgency', name: s.brand, url: origin + '/' },
      ...(days.length ? { itinerary: { '@type': 'ItemList', itemListElement: days.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.title })) } } : {}),
      ...(price ? { offers: { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: price, offerCount: Math.max(1, slots.length), availability: slots.length ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url: origin + '/tour/' + t.slug } } : {}) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' }, ...(cat ? [{ '@type': 'ListItem', position: 2, name: cat.name, item: origin + '/tours/?categories=' + encodeURIComponent(cat.match || cat.id) }] : []), { '@type': 'ListItem', position: cat ? 3 : 2, name: t.name }] },
    ...(faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
  ];
  const tabs = [['overview', 'Overview'], ...(days.length ? [['itinerary', 'Itinerary']] : []), ...(!enquire && slots.length ? [['dates', 'Dates']] : []), ['details', 'Inclusions & policies'], ...(photos.length > 1 ? [['photos', 'Photos']] : []), ...(faqs.length ? [['faqs', 'FAQs']] : [])];
  const body = `<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / ${cat ? `<a href="/tours/?categories=${encodeURIComponent(cat.match || cat.id)}">${esc(cat.name)}</a> / ` : ''}<span>${esc(t.location || t.name)}</span></nav>
  ${t.status !== 'live' ? '<p class="pill warn" style="margin-top:10px">Draft preview: customers cannot see this trip yet</p>' : ''}
  <h1 class="trip-title">${esc(t.name)}</h1>
  ${photos.length ? `<div class="slider">${photos.slice(0, 10).map((u, i) => img(u, t.name + ' photo ' + (i + 1), i ? 'loading="lazy"' : 'fetchpriority="high"')).join('')}</div>` : ''}
  <div class="facts">${facts.map((f) => `<span>${f}</span>`).join('')}</div>
  <div class="tlayout"><div class="tmain">
    <nav class="tabs" aria-label="Trip sections">${tabs.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</nav>
    <section class="tsec" id="overview"><h2>Overview</h2>${t.tagline ? `<p class="tagline">${esc(t.tagline)}</p>` : ''}${t.about ? `<div class="rich">${t.about}</div>` : ''}${incl.length ? `<div class="incl">${incl.map((x) => `<span>${ic(x.icon)}${esc(x.name)}</span>`).join('')}</div>` : ''}</section>
    ${days.length ? `<section class="tsec" id="itinerary"><h2>Itinerary</h2><div class="days">${days.map((d, i) => `<details class="day" ${i < 2 ? 'open' : ''}><summary><span class="dn">${i + 1}</span><span>${esc(d.title)}</span></summary><div class="db"><div class="rich">${d.body || ''}</div>${d.travel || d.stay || d.meals ? `<div class="meta">${d.travel ? `<span>${ic('transport')}${esc(d.travel)}</span>` : ''}${d.stay ? `<span>${ic('stay')}${esc(d.stay)}</span>` : ''}${d.meals ? `<span>${ic('meals')}${esc(d.meals)}</span>` : ''}</div>` : ''}</div></details>`).join('')}</div></section>` : ''}
    ${!enquire && slots.length ? `<section class="tsec" id="dates"><h2>Upcoming dates</h2><div class="dates">${slots.slice(0, 12).map((x) => { const l = seatsLeft(seats, t, x); const p = ts.length ? withGst(Number(ts[0].price) + slotExtra(x), t) : 0; return `<div class="daterow"><div><b>${fmtD(x.date)}</b> <span class="muted">· ${esc(x.time || '20:30')}</span>${p ? `<div class="hint num">${inr(p)} / person</div>` : ''}</div><span class="pill ${l === 0 ? 'neutral' : l <= 5 ? 'warn' : 'good'}">${l === 0 ? 'Full' : l + ' seats left'}</span><button class="btn sm ${l ? 'primary' : ''}" data-act="book" data-date="${esc(x.date)}" ${l ? '' : 'disabled'}>Book</button></div>`; }).join('')}</div></section>` : ''}
    <section class="tsec" id="details"><h2>Inclusions & policies</h2>
      ${secs.map((x, i) => `<details class="acc" ${i === 0 ? 'open' : ''}><summary>${esc(x.title)}</summary><div class="rich">${x.body || ''}</div></details>`).join('')}
      ${picks.length ? `<details class="acc"><summary>Pickup points</summary><div class="rich"><ul>${picks.map((p) => `<li><b>${esc(p.time)}</b>: ${esc(p.place)}</li>`).join('')}</ul></div></details>` : ''}
      <details class="acc"><summary>Payment</summary><div class="rich"><p>Pay ${adv}% to confirm your seat. The balance is due 24 hours before departure.${(t.upi || s.upi) ? ` UPI: <span class="mono">${esc(t.upi || s.upi)}</span>` : ''}</p></div></details>
      <details class="acc"><summary>Cancellation policy</summary><div class="rich">${rich(s.cancellation)}</div></details>
      <details class="acc"><summary>Terms & conditions</summary><div class="rich">${rich(s.terms)}</div></details>
    </section>
    ${photos.length > 1 ? `<section class="tsec" id="photos"><h2>Photos</h2><div class="gallery">${(t.gallery || []).filter((g) => g && g.url).map((g) => img(g.url, g.caption || t.name, 'loading="lazy"')).join('')}</div></section>` : ''}
    ${faqs.length ? `<section class="tsec" id="faqs"><h2>Frequently asked questions</h2>${faqs.map((f) => `<details class="acc"><summary>${esc(f.q)}</summary><div class="rich"><p>${esc(f.a)}</p></div></details>`).join('')}</section>` : ''}
    <section class="tsec" id="enquire"><h2>Have a question?</h2><p class="muted" style="margin-bottom:14px">Leave your number and we'll WhatsApp you, usually within a few hours.</p>
      <form class="enq" data-form="enquiry" data-trip="${esc(t.id)}" data-name="${esc(t.name)}" style="display:grid;gap:12px">
        <div class="grid2"><div class="field"><label for="eq-name">Your name</label><input class="in" id="eq-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="eq-phone">WhatsApp number</label><input class="in" id="eq-phone" name="phone" required inputmode="tel" autocomplete="tel" placeholder="10-digit mobile"></div></div>
        <div class="grid2"><div class="field"><label for="eq-people">How many people?</label><input class="in" id="eq-people" name="people" type="number" min="1" value="1"></div>
        <div class="field"><label for="eq-date">Preferred date</label><input class="in" id="eq-date" name="date" type="date"></div></div>
        <div class="field"><label for="eq-msg">Message (optional)</label><textarea class="in" id="eq-msg" name="message" rows="3"></textarea></div>
        <input name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
        <div><button class="btn dark" type="submit">Send enquiry</button></div></form></section>
  </div>
  <aside class="bookcard" aria-label="Book this trip">
    <div><div class="hint">${enquire ? 'Price' : 'Starting from'}</div>
      <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">${price ? `<span class="big num">${inr(price)}</span>${mrp > price ? `<s class="muted num">${inr(mrp)}</s><span class="save">Save ${inr(mrp - price)}</span>` : ''}` : '<span class="big">On request</span>'}</div>
      <div class="hint">per person, includes ${gstOf(t)}% GST</div></div>
    ${ts.length ? `<div>${ts.map((x) => `<div class="tk"><span>${esc(x.name)}${Number(x.ebDays) ? `<small>Book ${Number(x.ebDays)}+ days before departure</small>` : ''}${x.note ? `<small>${esc(x.note)}</small>` : ''}</span><b class="num">${inr(withGst(x.price, t))}</b></div>`).join('')}</div>` : ''}
    ${picks.length ? `<div class="pick"><b>Pickup points</b>${picks.slice(0, 6).map((p) => `<div><span>${esc(p.place)}</span><span class="muted num">${esc(p.time)}</span></div>`).join('')}</div>` : ''}
    ${bookBtn}
    <button class="btn block" data-act="callback" data-trip="${esc(t.id)}" data-name="${esc(t.name)}" data-kind="itinerary">${ic('wa')} Get itinerary on WhatsApp</button>
    <p class="hint">Pay ${adv}% now to hold your seat. Balance is due 24 hours before departure.</p>
  </aside></div></div>
  ${related.length ? `<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec-head"><h2>You may also like</h2></div><div class="cards">${related.map((r) => tripCard(s, r, seats)).join('')}</div></div></section>` : ''}
  <div class="mbar"><div><div class="hint">From</div><b class="num" style="font-size:19px">${price ? inr(price) : 'On request'}</b></div>${enquire ? `<button class="btn primary" data-act="callback" data-trip="${esc(t.id)}" data-name="${esc(t.name)}">Plan this trip</button>` : `<button class="btn primary" data-act="book" ${slots.length ? '' : 'disabled'}>Book your seat</button>`}</div>
  <script type="application/json" id="trip-data">${JSON.stringify(widget).replace(/</g, '\\u003c')}</script>`;
  return page(ctx, (t.categories || [])[0] || '', body, 'has-mbar');
}

export function textPage(ctx, kind) {
  const s = ctx.s;
  const map = {
    'about-us': ['About ' + s.brand, `<div class="rich">${rich(s.about)}</div><h2 style="margin-top:24px;font-size:20px">Contact</h2><div class="rich"><p>Phone: <span class="num">${esc(s.phones)}</span><br>Email: ${esc(s.email)}<br>Office: ${esc(s.address)}</p></div>`],
    'terms-and-conditions': ['Terms & cancellation policy', `<div class="rich"><h3>Booking terms</h3>${rich(s.terms)}<h3>Cancellation policy</h3>${rich(s.cancellation)}</div>`],
    'privacy-policy': ['Privacy policy', `<div class="rich">${rich(s.privacy)}</div>`],
  };
  const [title, inner] = map[kind];
  return page(ctx, kind === 'about-us' ? 'about' : '', `<section class="sec"><div class="wrap" style="max-width:820px"><h1 class="trip-title">${esc(title)}</h1><div class="tsec">${inner}</div></div></section>`);
}

export function notFoundPage(ctx) {
  return page(ctx, '', `<section class="sec"><div class="wrap"><div class="notice"><h3>We couldn't find that page</h3><p>The trip may have ended or moved.</p><p style="margin-top:14px"><a class="btn primary" href="/tours/">See all trips</a></p></div></div></section>`);
}

export const metaDesc = (t) => (t.seoDesc || t.tagline || textOnly(t.about) || '').slice(0, 165);
