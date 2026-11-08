// All JSON endpoints: public booking/enquiry endpoints and the team dashboard API.
import { json, bad, readJson, rid, bookingId, slugify, str, phoneOk, cleanHtml, todayIST } from '../../lib/util.js';
import { ensureSchema, getSettings, saveSettings, allTrips, tripBy, saveTrip, seatsMap, upcoming, quote, logActivity, DEFAULT_SETTINGS, pickupsFor } from '../../lib/db.js';
import { hashPassword, checkPassword, createSession, clearCookie, endSession, currentUser, can, ROLES } from '../../lib/auth.js';
import { SEED_TRIPS } from '../../lib/seed.js';
import { isTrial } from '../../lib/pages.js';

const enc = new TextEncoder();
async function hmacHex(secret, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg))), (b) => b.toString(16).padStart(2, '0')).join('');
}
const LEAD_ST = ['new', 'contacted', 'interested', 'converted', 'lost'];
const LEAD_LABEL = { new: 'New', contacted: 'Contacted', interested: 'Interested', converted: 'Booked', lost: 'Not interested' };
const LEAD_CH = ['website', 'whatsapp', 'call', 'instagram', 'meta_ad', 'google', 'referral', 'repeat', 'walkin', 'other'];
const rzpOn = (env) => !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

async function getBooking(env, id) {
  const r = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
  return r ? { ...JSON.parse(r.data), id: r.id, status: r.status } : null;
}
async function putBooking(env, b) {
  const { id, status, ...rest } = b;
  await env.DB.prepare(`INSERT INTO bookings (id, trip_id, slot_date, status, phone, created_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET trip_id = excluded.trip_id, slot_date = excluded.slot_date, status = excluded.status, phone = excluded.phone, data = excluded.data`)
    .bind(id, rest.tripId, rest.slotDate, status, rest.phone || '', rest.createdAt || Date.now(), JSON.stringify(rest)).run();
}
async function getEnquiry(env, id) {
  const r = await env.DB.prepare('SELECT * FROM enquiries WHERE id = ?').bind(id).first();
  return r ? { ...JSON.parse(r.data), id: r.id, source: r.source, status: r.status } : null;
}
async function putEnquiry(env, e) {
  const { id, source, status, ...rest } = e;
  await env.DB.prepare(`INSERT INTO enquiries (id, source, status, created_at, data) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET source = excluded.source, status = excluded.status, data = excluded.data`)
    .bind(id, source, status, rest.createdAt || Date.now(), JSON.stringify(rest)).run();
}
async function getCoupon(env, code) {
  const r = await env.DB.prepare('SELECT data FROM coupons WHERE code = ?').bind(String(code || '').toUpperCase()).first();
  if (!r) return null; const c = JSON.parse(r.data);
  return c.active === false ? null : { ...c, code: String(code).toUpperCase() };
}
// Record a payment once (by payment id) and confirm the booking.
async function applyPayment(env, b, paymentId, amount, via) {
  b.payments = b.payments || [];
  if (b.payments.some((p) => p.id === paymentId)) return b;
  b.payments.push({ id: paymentId, amount, via, at: Date.now() });
  b.paid = (Number(b.paid) || 0) + amount;
  if (b.status === 'awaiting_payment' || b.status === 'pending') b.status = 'confirmed';
  await putBooking(env, b);
  return b;
}

/* ================= public ================= */
async function publicRoutes(env, request, parts, method) {
  const [, name] = parts;
  if (name === 'availability' && method === 'GET') {
    const t = await tripBy(env, 'id', new URL(request.url).searchParams.get('trip') || '');
    if (!t || t.status !== 'live') return bad('Trip not found', 404);
    const seats = await seatsMap(env, [t.id]);
    return json({ slots: upcoming(t).map((s) => ({ date: s.date, time: s.time || '20:30', left: Math.max(0, (Number(s.seats) || 0) - (seats[t.id + '|' + s.date] || 0)), extra: Number(s.extra) || 0 })), today: todayIST() });
  }
  if (method !== 'POST') return bad('Not found', 404);
  const b = await readJson(request);
  if (b.company) return json({ ok: true }); // spam trap
  if (name === 'enquiry') {
    if (!str(b.name) || !phoneOk(b.phone)) return bad('Add your name and a 10-digit WhatsApp number.');
    const t = b.tripId ? await tripBy(env, 'id', str(b.tripId, 60)) : null;
    const kind = ['callback', 'itinerary'].includes(b.kind) ? b.kind : 'website';
    await putEnquiry(env, { id: rid('q'), source: kind, status: 'new', name: str(b.name, 80), phone: str(b.phone, 20), people: Math.max(1, Math.min(99, Number(b.people) || 1)), date: str(b.date, 10), message: str(b.message, 1000) || (kind === 'itinerary' ? 'Wants the itinerary on WhatsApp' : kind === 'callback' ? 'Requested a callback' : ''), tripId: t ? t.id : '', tripName: t ? t.name : '', createdAt: Date.now() });
    return json({ ok: true });
  }
  if (name === 'checkout-lead') {
    if (!str(b.name) || !phoneOk(b.phone)) return bad('Add your name and a 10-digit WhatsApp number.');
    const t = await tripBy(env, 'id', str(b.tripId, 60));
    const id = /^co-[a-z0-9]{6,20}$/.test(b.leadId || '') ? b.leadId : 'co-' + rid('', 10);
    await putEnquiry(env, { id, source: 'checkout', status: 'new', name: str(b.name, 80), phone: str(b.phone, 20), email: str(b.email, 120), people: Number(b.people) || 1, date: str(b.date, 10), tripId: t ? t.id : '', tripName: t ? t.name : '', message: 'Started booking, did not pay yet', createdAt: Date.now() });
    return json({ leadId: id });
  }
  if (name === 'coupon') {
    const c = await getCoupon(env, b.code);
    return c ? json({ ok: true, code: c.code, type: c.type, value: c.value }) : bad('That code is not valid.');
  }
  if (name === 'book') {
    const s = await getSettings(env);
    const t = await tripBy(env, 'id', str(b.tripId, 60));
    if (!t || t.status !== 'live' || t.mode === 'enquire') return bad('This trip is not open for booking.');
    const slot = upcoming(t).find((x) => x.date === b.date);
    if (!slot) return bad('That date is closed. Please pick another date.');
    const c = b.contact || {};
    if (!str(c.name) || !phoneOk(c.phone)) return bad('Add your name and a 10-digit WhatsApp number.');
    const coupon = b.coupon ? await getCoupon(env, b.coupon) : null;
    const plan = ['advance', 'full', 'upi'].includes(b.plan) ? b.plan : 'upi';
    if (plan !== 'upi' && (t.allowOnline === false || !rzpOn(env))) return bad('Online payment is not available. Please choose UPI.');
    let q;
    try { q = quote(t, slot, b.qty || {}, coupon, plan, s); } catch { return bad('One of the ticket types is closed for this date.'); }
    if (!q.people) return bad('Choose at least one seat.');
    const seats = await seatsMap(env, [t.id]);
    const left = (Number(slot.seats) || 0) - (seats[t.id + '|' + slot.date] || 0);
    if (q.people > left) return bad(left > 0 ? `Only ${left} seats are left on this date.` : 'This date just got full. Please pick another date.');
    // Every traveller: name, gender, age. The first one is the person booking.
    const tr = Array.isArray(b.travellers) ? b.travellers : [];
    if (tr.length !== q.people) return bad('Add the name, gender and age of every traveller.');
    const travellers = [];
    for (const x of tr) {
      const age = Math.floor(Number(x && x.age));
      const gender = ['Male', 'Female', 'Other'].includes(x && x.gender) ? x.gender : '';
      if (!str(x && x.name) || !gender || !(age >= 1 && age <= 99)) return bad('Add the name, gender and age of every traveller.');
      travellers.push({ name: str(x.name, 80), gender, age, phone: str(x.phone, 20) });
    }
    const picks = pickupsFor(t, s);
    const pickup = str(b.pickup, 120);
    if (picks.length && !picks.some((p) => p.place === pickup)) return bad('Choose a pickup point.');
    const id = bookingId();
    const bk = { id, status: plan === 'upi' ? 'pending' : 'awaiting_payment', tripId: t.id, tripName: t.name, slotDate: slot.date, items: q.items, people: q.people,
      name: str(c.name, 80), phone: str(c.phone, 20), email: str(c.email, 120), travellers, others: '', pickup,
      coupon: coupon ? coupon.code : '', subtotal: q.sub, discount: q.discount, gst: q.gst, total: q.total, plan, payNow: q.payNow, paid: 0, payments: [], source: 'website', createdAt: Date.now() };
    let razorpay = null;
    if (plan !== 'upi') {
      const r = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Basic ' + btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET) },
        body: JSON.stringify({ amount: q.payNow * 100, currency: 'INR', receipt: id, notes: { booking_id: id, trip: t.name.slice(0, 200), date: slot.date } }) });
      if (!r.ok) { console.error('razorpay order', r.status, await r.text()); return bad('Online payment is not working right now. Please choose UPI or try again.', 502); }
      const order = await r.json();
      bk.orderId = order.id;
      razorpay = { key: env.RAZORPAY_KEY_ID, order_id: order.id, amount: order.amount, name: s.brand, description: `${t.name} · ${slot.date}`, prefill: { name: bk.name, contact: bk.phone, email: bk.email } };
    }
    await putBooking(env, bk);
    if (/^co-[a-z0-9]{6,20}$/.test(b.leadId || '')) {
      const lead = await getEnquiry(env, b.leadId);
      if (lead) { lead.status = 'converted'; lead.bookingId = id; await putEnquiry(env, lead); }
    }
    return json({ id, total: q.total, payNow: q.payNow, plan, status: bk.status, razorpay, upi: t.upi || s.upi });
  }
  if (name === 'verify') {
    if (!rzpOn(env)) return bad('Payments are not set up.');
    const bk = await getBooking(env, str(b.bookingId, 20));
    if (!bk || !bk.orderId || bk.orderId !== b.razorpay_order_id) return bad('Booking not found.', 404);
    const sig = await hmacHex(env.RAZORPAY_KEY_SECRET, b.razorpay_order_id + '|' + b.razorpay_payment_id);
    if (sig !== b.razorpay_signature) return bad('Payment could not be verified. If money was deducted, WhatsApp us your booking ID.');
    await applyPayment(env, bk, str(b.razorpay_payment_id, 60), bk.payNow, 'razorpay');
    return json({ ok: true, status: 'confirmed' });
  }
  return bad('Not found', 404);
}

async function razorpayWebhook(env, request) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return bad('Webhook not configured', 404);
  const raw = await request.text();
  const sig = await hmacHex(env.RAZORPAY_WEBHOOK_SECRET, raw);
  if (sig !== request.headers.get('x-razorpay-signature')) return bad('Bad signature', 401);
  const ev = JSON.parse(raw);
  if (ev.event === 'payment.captured' || ev.event === 'order.paid') {
    const p = ev.payload && ev.payload.payment && ev.payload.payment.entity;
    const id = p && p.notes && p.notes.booking_id;
    const bk = id ? await getBooking(env, id) : null;
    if (bk && p) await applyPayment(env, bk, p.id, Math.round(p.amount / 100), 'razorpay');
  }
  return json({ ok: true });
}

/* ================= team dashboard ================= */
function cleanTrip(t, existing) {
  const num = (v, d = 0) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? d : Number(v));
  const out = {
    id: existing ? existing.id : rid('t'),
    name: str(t.name, 160), slug: slugify(t.slug || t.name), status: t.status === 'live' ? 'live' : 'draft',
    mode: t.mode === 'enquire' ? 'enquire' : 'fixed', categories: (t.categories || []).map((c) => str(c, 60)).slice(0, 10),
    days: num(t.days, 1), nights: num(t.nights, 0), location: str(t.location, 80), tagline: str(t.tagline, 400), about: cleanHtml(t.about),
    inclusions: (t.inclusions || []).map((x) => str(x, 30)).slice(0, 20), difficulty: str(t.difficulty, 30), groupSize: str(t.groupSize, 60),
    minGroup: num(t.minGroup, 8), bestSeason: str(t.bestSeason, 60), tripLead: str(t.tripLead, 80), tripLeadPhone: str(t.tripLeadPhone, 20), featured: !!t.featured,
    order: num(t.order, 99), mrp: num(t.mrp, 0), gst: num(t.gst, 5), closeDays: num(t.closeDays, 1), defaultSeats: num(t.defaultSeats, 25),
    tickets: (t.tickets || []).filter((k) => k && k.name).slice(0, 12).map((k) => ({ id: str(k.id, 20) || rid('k', 4), name: str(k.name, 80), price: num(k.price), ebDays: num(k.ebDays), pax: Math.max(1, num(k.pax, 1)), note: str(k.note, 120) })),
    slots: (t.slots || []).filter((s) => s && /^\d{4}-\d{2}-\d{2}$/.test(s.date)).slice(0, 200).map((s) => ({ id: str(s.id, 20) || rid('d', 4), date: s.date, seats: num(s.seats, 25), time: str(s.time, 12) || '20:30', extra: num(s.extra, 0) })),
    pickups: (t.pickups || []).filter((p) => p && p.place).slice(0, 15).map((p) => ({ place: str(p.place, 120), time: str(p.time, 20) })),
    allowOnline: t.allowOnline !== false, advancePct: num(t.advancePct, 50), upi: str(t.upi, 80),
    itinerary: (t.itinerary || []).filter((d) => d && (d.title || d.body)).slice(0, 30).map((d) => ({ title: str(d.title, 160), body: cleanHtml(d.body), travel: str(d.travel, 80), stay: str(d.stay, 80), meals: str(d.meals, 80) })),
    sections: (t.sections || []).filter((s) => s && (s.title || s.body)).slice(0, 20).map((s) => ({ id: str(s.id, 20) || rid('s', 4), title: str(s.title, 120), body: cleanHtml(s.body) })),
    faqs: (t.faqs || []).filter((f) => f && f.q).slice(0, 30).map((f) => ({ q: str(f.q, 300), a: str(f.a, 1500) })),
    cover: str(t.cover, 600), gallery: (t.gallery || []).filter((g) => g && g.url).slice(0, 40).map((g) => ({ url: str(g.url, 600), caption: str(g.caption, 140) })),
    seoTitle: str(t.seoTitle, 90), seoDesc: str(t.seoDesc, 200),
  };
  return out;
}
const MAX_IMG = 1800000;
async function storeImage(env, bytes, type) {
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) throw new Error('type');
  if (bytes.byteLength > MAX_IMG) throw new Error('size');
  const id = rid('i', 12);
  await env.DB.prepare('INSERT INTO images (id, type, data, size, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, type, bytes, bytes.byteLength, Date.now()).run();
  return '/img/' + id;
}
function bookingForRole(b, user) {
  if (can(user, 'money.view')) return b;
  const { subtotal, discount, gst, total, payNow, paid, payments, coupon, ...rest } = b;
  return rest;
}

async function adminRoutes(env, request, parts, method) {
  const sub = parts.slice(1);
  const s0 = sub[0];
  const usersCount = async () => (await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first()).n;

  if (method !== 'GET' && request.headers.get('x-ab') !== '1') return bad('Bad request', 400);

  if (s0 === 'status' && method === 'GET') {
    const n = await usersCount();
    return json({ needsSetup: n === 0, setupCodeSet: !!env.SETUP_CODE, user: await currentUser(env, request) });
  }
  if (s0 === 'setup' && method === 'POST') {
    if ((await usersCount()) > 0) return bad('Setup is already done. Please log in.');
    if (!env.SETUP_CODE) return bad('Add a SETUP_CODE in Cloudflare first (see SETUP.md).');
    const b = await readJson(request);
    if (String(b.code || '') !== String(env.SETUP_CODE)) return bad('The setup code is not correct.');
    if (!/^\S+@\S+\.\S+$/.test(b.email || '') || String(b.password || '').length < 8) return bad('Enter a valid email and a password of at least 8 characters.');
    const id = rid('u');
    await env.DB.prepare('INSERT INTO users (id, email, name, role, pass, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').bind(id, b.email.toLowerCase().trim(), str(b.name, 80) || 'Owner', 'owner', await hashPassword(b.password), Date.now()).run();
    await logActivity(env, b.email, 'Created the owner account');
    return json({ ok: true }, 200, { 'set-cookie': await createSession(env, id) });
  }
  if (s0 === 'login' && method === 'POST') {
    const b = await readJson(request);
    const u = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(String(b.email || '').toLowerCase().trim()).first();
    if (!u || !u.active || !(await checkPassword(String(b.password || ''), u.pass))) return bad('Email or password is not correct.', 401);
    await logActivity(env, u.email, 'Logged in');
    return json({ ok: true }, 200, { 'set-cookie': await createSession(env, u.id) });
  }
  if (s0 === 'logout' && method === 'POST') { await endSession(env, request); return json({ ok: true }, 200, { 'set-cookie': clearCookie() }); }

  const user = await currentUser(env, request);
  if (!user) return bad('Please log in again.', 401);
  const need = (perm) => { if (!can(user, perm)) throw Object.assign(new Error('forbidden'), { forbidden: true }); };
  const who = user.email;

  try {
    if (s0 === 'password' && method === 'POST') {
      const b = await readJson(request);
      const u = await env.DB.prepare('SELECT pass FROM users WHERE id = ?').bind(user.id).first();
      if (!(await checkPassword(String(b.current || ''), u.pass))) return bad('Your current password is not correct.');
      if (String(b.next || '').length < 8) return bad('Use at least 8 characters for the new password.');
      await env.DB.prepare('UPDATE users SET pass = ? WHERE id = ?').bind(await hashPassword(b.next), user.id).run();
      return json({ ok: true });
    }
    if (s0 === 'data' && method === 'GET') {
      const out = { me: user, roles: Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, v.label])), perms: ROLES[user.role].can, trial: isTrial(env), razorpay: rzpOn(env), today: todayIST() };
      out.settings = await getSettings(env);
      if (can(user, 'trips.view')) out.trips = await allTrips(env);
      if (can(user, 'bookings.view')) {
        const { results } = await env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5000').all();
        out.bookings = results.map((r) => bookingForRole({ ...JSON.parse(r.data), id: r.id, status: r.status }, user));
      }
      if (can(user, 'leads.view')) {
        const { results } = await env.DB.prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 5000').all();
        out.enquiries = results.map((r) => ({ ...JSON.parse(r.data), id: r.id, source: r.source, status: r.status }));
      }
      if (can(user, 'coupons.edit') || can(user, 'leads.view')) {
        const { results } = await env.DB.prepare('SELECT * FROM coupons').all();
        out.coupons = results.map((r) => ({ ...JSON.parse(r.data), code: r.code }));
      }
      const { results: team } = await env.DB.prepare('SELECT id, email, name, role, active, created_at FROM users ORDER BY created_at').all();
      out.team = team;
      return json(out);
    }
    if (s0 === 'trips') {
      if (sub[1] === 'seed' && method === 'POST') {
        need('trips.edit');
        const n = (await env.DB.prepare('SELECT COUNT(*) AS n FROM trips').first()).n;
        if (n > 0) return bad('Trips already exist.');
        for (const t of SEED_TRIPS) await saveTrip(env, cleanTrip({ ...t, status: t.status }, { id: t.id }));
        await logActivity(env, who, 'Loaded starter trips', SEED_TRIPS.length + ' trips');
        return json({ ok: true });
      }
      const id = sub[1];
      if (!id) return bad('Not found', 404);
      if (sub[2] === 'status' && method === 'POST') {
        need('trips.edit');
        const t = await tripBy(env, 'id', id); if (!t) return bad('Trip not found', 404);
        t.status = (await readJson(request)).status === 'live' ? 'live' : 'draft';
        await saveTrip(env, t); await logActivity(env, who, t.status === 'live' ? 'Published trip' : 'Unpublished trip', t.name);
        return json({ ok: true });
      }
      if (method === 'PUT') {
        need('trips.edit');
        const b = await readJson(request, 900000);
        const existing = await tripBy(env, 'id', id);
        const t = cleanTrip(b, existing || { id });
        if (!t.name) return bad('Give the trip a name.');
        const clash = await env.DB.prepare('SELECT id FROM trips WHERE slug = ? AND id != ?').bind(t.slug, t.id).first();
        if (clash) return bad('Another trip already uses this web address. Change it in Basic details.');
        await saveTrip(env, t);
        await logActivity(env, who, existing ? 'Edited trip' : 'Created trip', t.name);
        return json({ ok: true, trip: t });
      }
      if (method === 'DELETE') {
        need('trips.edit');
        const n = (await env.DB.prepare("SELECT COUNT(*) AS n FROM bookings WHERE trip_id = ? AND status != 'cancelled'").bind(id).first()).n;
        if (n > 0) return bad('This trip has bookings. Unpublish it instead.');
        const t = await tripBy(env, 'id', id);
        await env.DB.prepare('DELETE FROM trips WHERE id = ?').bind(id).run();
        await logActivity(env, who, 'Deleted trip', t ? t.name : id);
        return json({ ok: true });
      }
    }
    if (s0 === 'bookings') {
      need('bookings.edit');
      if (!sub[1] && method === 'POST') {
        const b = await readJson(request);
        const t = await tripBy(env, 'id', str(b.tripId, 60));
        if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(b.slotDate || '')) return bad('Choose a trip and a date.');
        if (!str(b.name) || !phoneOk(b.phone)) return bad('Add the traveller name and a 10-digit phone number.');
        const total = Math.max(0, Number(b.total) || 0), paid = Math.max(0, Number(b.paid) || 0);
        const bk = { id: bookingId(), status: b.status === 'confirmed' ? 'confirmed' : 'pending', tripId: t.id, tripName: t.name, slotDate: b.slotDate, people: Math.max(1, Number(b.people) || 1),
          items: [{ name: 'Seats (added by team)', price: 0, qty: Math.max(1, Number(b.people) || 1) }], name: str(b.name, 80), phone: str(b.phone, 20), email: str(b.email, 120), others: str(b.others, 1500), pickup: str(b.pickup, 120),
          subtotal: total, discount: 0, gst: 0, total, plan: 'offline', payNow: 0, paid, payments: paid ? [{ id: rid('m'), amount: paid, via: 'recorded by ' + who, at: Date.now() }] : [], note: str(b.note, 500), source: 'team', addedBy: who, createdAt: Date.now() };
        await putBooking(env, bk); await logActivity(env, who, 'Added booking', `${bk.id} · ${bk.name} · ${t.name}`);
        return json({ ok: true, id: bk.id });
      }
      const bk = await getBooking(env, sub[1]);
      if (!bk) return bad('Booking not found', 404);
      if (method === 'PATCH') {
        const b = await readJson(request);
        if (b.status && ['pending', 'confirmed', 'cancelled', 'awaiting_payment'].includes(b.status)) { bk.status = b.status; await logActivity(env, who, 'Changed booking status', `${bk.id} → ${b.status}`); }
        if (Number(b.addPayment) > 0) {
          const amt = Math.round(Number(b.addPayment));
          bk.payments = bk.payments || []; bk.payments.push({ id: rid('m'), amount: amt, via: (str(b.via, 40) || 'UPI') + ' · recorded by ' + who, at: Date.now() });
          bk.paid = (Number(bk.paid) || 0) + amt;
          if (bk.status === 'pending' || bk.status === 'awaiting_payment') bk.status = 'confirmed';
          await logActivity(env, who, 'Recorded payment', `${bk.id} · ₹${amt}`);
        }
        if (typeof b.note === 'string') bk.note = str(b.note, 500);
        if (typeof b.pickup === 'string') bk.pickup = str(b.pickup, 120);
        await putBooking(env, bk);
        return json({ ok: true, booking: bk });
      }
    }
    if (s0 === 'enquiries' && !sub[1] && method === 'POST') {
      need('leads.edit');
      const b = await readJson(request);
      const name = str(b.name, 80), phone = str(b.phone, 20);
      if (!name || String(phone).replace(/\D/g, '').length < 10) return bad('Enter a name and a 10-digit phone number.');
      const t = b.tripId ? await tripBy(env, 'id', str(b.tripId, 60)) : null;
      const id = rid('q'), now = Date.now();
      const e = { id, source: 'manual', status: LEAD_ST.includes(b.status) ? b.status : 'new', name, phone, people: Math.max(1, Math.min(99, Number(b.people) || 1)), date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : '',
        tripId: t ? t.id : '', tripName: t ? t.name : str(b.tripName, 120), channel: LEAD_CH.includes(b.channel) ? b.channel : 'other', assignedTo: str(b.assignedTo, 120), addedBy: who,
        followUp: /^\d{4}-\d{2}-\d{2}$/.test(b.followUp || '') ? b.followUp : '', message: '', notes: b.note ? [{ at: now, by: who, text: str(b.note, 1000) }] : [], createdAt: now };
      await putEnquiry(env, e);
      await logActivity(env, who, 'Added a lead', name);
      return json({ ok: true, id });
    }
    if (s0 === 'enquiries' && sub[1] && method === 'PATCH') {
      need('leads.edit');
      const e = await getEnquiry(env, sub[1]); if (!e) return bad('Not found', 404);
      const b = await readJson(request);
      if (b.status && LEAD_ST.includes(b.status)) { if (b.status !== e.status) { e.notes = e.notes || []; e.notes.push({ at: Date.now(), by: who, text: 'Status: ' + LEAD_LABEL[b.status], auto: true }); } e.status = b.status; }
      if (typeof b.assignedTo === 'string') e.assignedTo = str(b.assignedTo, 120);
      if (typeof b.channel === 'string' && LEAD_CH.includes(b.channel)) e.channel = b.channel;
      if (typeof b.followUp === 'string') e.followUp = /^\d{4}-\d{2}-\d{2}$/.test(b.followUp) ? b.followUp : '';
      if (typeof b.note === 'string') e.note = str(b.note, 1000);
      if (typeof b.addNote === 'string' && b.addNote.trim()) { e.notes = e.notes || []; e.notes.push({ at: Date.now(), by: who, text: str(b.addNote, 1000) }); e.notes = e.notes.slice(-100); }
      if (b.tripId !== undefined) { const t = b.tripId ? await tripBy(env, 'id', str(b.tripId, 60)) : null; e.tripId = t ? t.id : ''; e.tripName = t ? t.name : e.tripName; }
      e.updatedBy = who; e.updatedAt = Date.now();
      await putEnquiry(env, e);
      return json({ ok: true });
    }
    if (s0 === 'coupons') {
      need('coupons.edit');
      const code = String(sub[1] || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!code) return bad('Enter a code using letters and numbers.');
      if (method === 'PUT') {
        const b = await readJson(request);
        await env.DB.prepare('INSERT INTO coupons (code, data) VALUES (?, ?) ON CONFLICT(code) DO UPDATE SET data = excluded.data').bind(code, JSON.stringify({ type: b.type === 'pct' ? 'pct' : 'flat', value: Math.max(0, Number(b.value) || 0), active: b.active !== false, createdAt: Number(b.createdAt) || Date.now() })).run();
        await logActivity(env, who, 'Saved coupon', code);
        return json({ ok: true });
      }
      if (method === 'DELETE') { await env.DB.prepare('DELETE FROM coupons WHERE code = ?').bind(code).run(); await logActivity(env, who, 'Deleted coupon', code); return json({ ok: true }); }
    }
    if (s0 === 'settings' && method === 'PUT') {
      need('site.edit');
      const b = await readJson(request, 300000);
      const cur = await getSettings(env);
      const next = { ...cur };
      for (const k of Object.keys(DEFAULT_SETTINGS)) if (k in b) next[k] = b[k];
      next.advancePct = Number(next.advancePct) || 0;
      next.whatsapp = String(next.whatsapp || '').replace(/\D/g, '');
      next.callNumber = String(next.callNumber || '').replace(/\D/g, '');
      next.categories = (next.categories || []).filter((c) => c && c.name).map((c) => ({ id: str(c.id, 60) || slugify(c.name), name: str(c.name, 60), match: str(c.match, 80) || c.name.toLowerCase(), heading: str(c.heading, 120), intro: cleanHtml(c.intro), seoTitle: str(c.seoTitle, 90), seoDesc: str(c.seoDesc, 200) }));
      for (const k of ['about', 'terms', 'cancellation', 'privacy']) next[k] = cleanHtml(next[k]);
      next.pickups = (next.pickups || []).filter((x) => x && x.place).slice(0, 20).map((x) => ({ place: str(x.place, 120), time: str(x.time, 20) }));
      next.reviews = (next.reviews || []).filter((r) => r && r.text).slice(0, 40).map((r) => ({ name: str(r.name, 60), text: str(r.text, 600), trip: str(r.trip, 80), date: str(r.date, 30), rating: Math.max(1, Math.min(5, Number(r.rating) || 5)) }));
      next.trust = (next.trust || []).map((x) => str(x, 60)).filter(Boolean).slice(0, 10);
      next.stats = (next.stats || []).slice(0, 4).map((x) => ({ v: str(x.v, 20), k: str(x.k, 40) }));
      const okUrl = (u) => { u = str(u, 400); return /^(\/|https?:\/\/)/i.test(u) ? u : ''; };
      const links = (a, n) => (Array.isArray(a) ? a : []).filter((x) => x && x.label).slice(0, n).map((x) => ({ label: str(x.label, 40), url: okUrl(x.url) || '/' }));
      next.menu = links(next.menu, 8); next.footerLinks = links(next.footerLinks, 10);
      next.heroSlides = (Array.isArray(next.heroSlides) ? next.heroSlides : []).filter((x) => x && okUrl(x.url)).slice(0, 8).map((x) => ({ url: okUrl(x.url), caption: str(x.caption, 80), link: okUrl(x.link) }));
      next.moments = (Array.isArray(next.moments) ? next.moments : []).map(okUrl).filter(Boolean).slice(0, 12);
      next.whyItems = (Array.isArray(next.whyItems) ? next.whyItems : []).filter((x) => x && x.title).slice(0, 9).map((x) => ({ icon: str(x.icon, 20) || 'check', title: str(x.title, 60), text: str(x.text, 200) }));
      const TYPES = ['ticker', 'upcoming', 'vibes', 'why', 'steps', 'moments', 'reviews', 'callback', 'category', 'text'];
      const seen = new Set();
      next.homeSections = (Array.isArray(next.homeSections) ? next.homeSections : []).filter((x) => x && TYPES.includes(x.type)).slice(0, 25).map((x) => ({ k: str(x.k, 40) || x.type, type: x.type, on: x.on !== false, title: str(x.title, 120), sub: str(x.sub, 200), ...(x.type === 'category' ? { cat: str(x.cat, 60) } : {}), ...(x.type === 'text' ? { body: cleanHtml(x.body) } : {}) })).filter((x) => !seen.has(x.k) && seen.add(x.k));
      for (const k of ['favicon', 'twitter', 'linkedin', 'googleBusiness']) next[k] = okUrl(next[k]);
      await saveSettings(env, next);
      await logActivity(env, who, 'Updated website settings');
      return json({ ok: true, settings: next });
    }
    if (s0 === 'images') {
      if (!can(user, 'trips.edit') && !can(user, 'site.edit')) need('trips.edit');
      if (sub[1] === 'import' && method === 'POST') {
        const b = await readJson(request);
        if (!/^https:\/\//.test(b.url || '')) return bad('Use an https:// image link.');
        const r = await fetch(b.url, { headers: { accept: 'image/*' } });
        if (!r.ok) return bad('Could not download that image.');
        const type = (r.headers.get('content-type') || '').split(';')[0];
        try { return json({ url: await storeImage(env, await r.arrayBuffer(), type) }); }
        catch (e) { return bad(e.message === 'size' ? 'That image is too big (max 1.8 MB).' : 'That link is not an image.'); }
      }
      if (!sub[1] && method === 'POST') {
        const type = (request.headers.get('content-type') || '').split(';')[0];
        const buf = await request.arrayBuffer();
        try { return json({ url: await storeImage(env, buf, type) }); }
        catch (e) { return bad(e.message === 'size' ? 'That photo is too big even after compressing.' : 'Upload a JPG, PNG or WebP photo.'); }
      }
    }
    if (s0 === 'team') {
      need('*');
      if (!sub[1] && method === 'POST') {
        const b = await readJson(request);
        const email = String(b.email || '').toLowerCase().trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) return bad('Enter a valid email.');
        if (!ROLES[b.role]) return bad('Choose a role.');
        if (String(b.password || '').length < 8) return bad('Set a temporary password of at least 8 characters.');
        if (await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()) return bad('This email already has a login.');
        await env.DB.prepare('INSERT INTO users (id, email, name, role, pass, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').bind(rid('u'), email, str(b.name, 80), b.role, await hashPassword(b.password), Date.now()).run();
        await logActivity(env, who, 'Added team member', `${email} (${ROLES[b.role].label})`);
        return json({ ok: true });
      }
      if (sub[1] && method === 'PATCH') {
        const b = await readJson(request);
        const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(sub[1]).first();
        if (!u) return bad('Not found', 404);
        if (u.id === user.id && (b.role && b.role !== 'owner' || b.active === false)) return bad("You can't remove your own owner access.");
        if (b.role && ROLES[b.role]) await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(b.role, u.id).run();
        if (typeof b.active === 'boolean') { await env.DB.prepare('UPDATE users SET active = ? WHERE id = ?').bind(b.active ? 1 : 0, u.id).run(); if (!b.active) await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id).run(); }
        if (b.password) { if (String(b.password).length < 8) return bad('Use at least 8 characters.'); await env.DB.prepare('UPDATE users SET pass = ? WHERE id = ?').bind(await hashPassword(b.password), u.id).run(); }
        await logActivity(env, who, 'Changed team member', u.email);
        return json({ ok: true });
      }
    }
    if (s0 === 'activity' && method === 'GET') {
      need('activity.view');
      const { results } = await env.DB.prepare('SELECT at, who, action, detail FROM activity ORDER BY id DESC LIMIT 300').all();
      return json({ items: results });
    }
  } catch (e) {
    if (e.forbidden) return bad("Your role doesn't allow this. Ask the owner.", 403);
    if (e.message === 'too_large') return bad('That is too much data to save at once.', 413);
    if (e.message === 'bad_json') return bad('Bad request.');
    throw e;
  }
  return bad('Not found', 404);
}

export async function onRequest({ request, env, params }) {
  await ensureSchema(env);
  const parts = [].concat(params.path || []).map(String);
  const method = request.method;
  try {
    if (parts[0] === 'public') return await publicRoutes(env, request, parts, method);
    if (parts[0] === 'razorpay' && parts[1] === 'webhook' && method === 'POST') return await razorpayWebhook(env, request);
    if (parts[0] === 'admin') return await adminRoutes(env, request, parts, method);
  } catch (e) {
    if (e.message === 'too_large') return bad('That is too much data.', 413);
    if (e.message === 'bad_json') return bad('Bad request.');
    throw e;
  }
  return bad('Not found', 404);
}
