// Adventure Buddha team dashboard.
(function () {
'use strict';
/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const uid = (p = '') => p + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6);
const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'trip';
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseISO = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return isoOf(d); };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtD = (s) => { if (!s) return ''; const d = parseISO(s); return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; };
const fmtDY = (s) => { if (!s) return ''; const d = parseISO(s); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
const fmtTs = (t) => { if (!t) return ''; const d = new Date(t); return d.getDate() + ' ' + MON[d.getMonth()] + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const ago = (t) => { if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); if (m < 60) return Math.max(1, m) + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' h ago'; return Math.round(h / 24) + ' d ago'; };
const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3000); }

const I = {
  wa: '<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6L3 21z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.3-1.3-2-1-1 .8a4 4 0 0 1-2.3-2.3l.8-1-1-2L9 9.5z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  meals: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 0-4 2.5-4 7h4"/>', guide: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0M12 14l1.5 3-1.5 4-1.5-4z"/>',
  transport: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
  stay: '<path d="M3 20V8M3 13h18v7M21 13a4 4 0 0 0-4-4h-6v4"/><circle cx="7" cy="10.5" r="1.8"/>', fire: '<path d="M12 21c-4 0-6.5-2.5-6.5-6 0-4 3.5-6 4-10 2.5 1.5 4 4 4 6 1-1 1.5-2 1.5-3 2 1.5 3.5 4 3.5 7 0 3.5-2.5 6-6.5 6z"/>',
  trek: '<path d="M3 20l6-11 4 6 3-4 5 9z"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', grid: '<rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', home: '<path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>', inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4a2 2 0 0 1 0-4V6H3z"/>', tag: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>', download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
};
const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;
const INCL = [{ id: 'transport', name: 'Transport', icon: 'transport' }, { id: 'stay', name: 'Stay', icon: 'stay' }, { id: 'meals', name: 'Meals', icon: 'meals' }, { id: 'guide', name: 'Trip lead', icon: 'guide' }, { id: 'sightseeing', name: 'Sightseeing', icon: 'eye' }, { id: 'trek', name: 'Trek', icon: 'trek' }, { id: 'campfire', name: 'Campfire', icon: 'fire' }, { id: 'photos', name: 'Photos', icon: 'camera' }, { id: 'insurance', name: 'First aid', icon: 'shield' }];
const SECTION_TEMPLATES = ['Inclusions', 'Exclusions', 'Things to carry', 'Dress code', 'Important notes', 'Who should come', 'Group size'];

/* ================= API & state ================= */
let D = null;
async function api(method, path, body, raw) {
  const opt = { method, headers: { 'x-ab': '1' }, credentials: 'same-origin' };
  if (raw) { opt.body = raw; opt.headers['content-type'] = raw.type; }
  else if (body !== undefined) { opt.body = JSON.stringify(body); opt.headers['content-type'] = 'application/json'; }
  let r;
  try { r = await fetch('/api/admin/' + path, opt); } catch { throw new Error('No internet connection. Try again.'); }
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== 'login') { D = null; renderAuth(); throw new Error(d.error || 'Please log in again.'); }
  if (!r.ok) throw new Error(d.error || 'Something went wrong.');
  return d;
}
async function load() { D = await api('GET', 'data'); D.trips = D.trips || []; D.bookings = D.bookings || []; D.enquiries = D.enquiries || []; D.coupons = D.coupons || []; }
async function act(fn, okMsg) { try { const r = await fn(); if (okMsg) toast(okMsg); await load(); render(); return r || true; } catch (e) { toast(e.message); return false; } }
const can = (p) => D && (D.perms.includes('*') || D.perms.includes(p));
const S = () => D.settings;
const cats = () => S().categories || [];
const catName = (id) => (cats().find((c) => c.id === id) || {}).name || id;
const tripById = (id) => D.trips.find((t) => t.id === id);
const today = () => D.today || isoOf(new Date());
const gstOf = (t) => (t.gst ?? 5);
const withGst = (p, t) => Math.floor((Number(p) || 0) * (1 + gstOf(t) / 100) + 0.01);
const ticketsOf = (t) => (t.tickets || []).filter((x) => x && x.name);
const fromPrice = (t) => { const ts = ticketsOf(t); return ts.length ? Math.min(...ts.map((x) => withGst(x.price, t))) : 0; };
const held = (b) => b.status === 'confirmed' || b.status === 'pending' || (b.status === 'awaiting_payment' && Date.now() - (b.createdAt || 0) < 30 * 60000);
const booked = (tripId, date) => D.bookings.filter((b) => b.tripId === tripId && b.slotDate === date && held(b)).reduce((s, b) => s + (Number(b.people) || 0), 0);
const upcoming = (t) => (t.slots || []).filter((s) => s.date >= today()).sort((a, b) => a.date.localeCompare(b.date));
const waLink = (text, num) => 'https://wa.me/' + String(num || S().whatsapp || '').replace(/\D/g, '').replace(/^(\d{10})$/, '91$1') + '?text=' + encodeURIComponent(text || '');
// Travellers of a booking: website bookings store name/gender/age per person; team-added ones keep free text.
function travOf(b) {
  if (Array.isArray(b.travellers) && b.travellers.length) return b.travellers;
  const extra = String(b.others || '').split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => { const [name, g, age] = l.split(/\s*[,|]\s*/); return { name, gender: /^f/i.test(g || '') ? 'Female' : /^m/i.test(g || '') ? 'Male' : (g || ''), age: Number(age) || '' }; });
  const out = [{ name: b.name, gender: '', age: '', phone: b.phone }, ...extra];
  while (out.length < (Number(b.people) || 1)) out.push({ name: '(name not given)', gender: '', age: '' });
  return out;
}
const gShort = (g) => g === 'Male' ? 'M' : g === 'Female' ? 'F' : g ? 'Other' : '';
function statusPill(s) { const m = { new: ['info', 'New'], contacted: ['warn', 'Contacted'], interested: ['info', 'Interested'], converted: ['good', 'Booked'], lost: ['neutral', 'Not interested'], pending: ['warn', 'Payment pending'], awaiting_payment: ['neutral', 'Payment not completed'], confirmed: ['good', 'Confirmed'], cancelled: ['bad', 'Cancelled'], live: ['good', 'Live'], draft: ['neutral', 'Draft'] }; const x = m[s] || ['neutral', s || '—']; return `<span class="pill ${x[0]}">${esc(x[1])}</span>`; }
const srcPill = (s) => s === 'manual' ? '<span class="pill info">Added by team</span>' : s === 'callback' ? '<span class="pill info">Callback</span>' : s === 'itinerary' ? '<span class="pill info">Itinerary request</span>' : s === 'checkout' ? '<span class="pill warn">Checkout</span>' : '<span class="pill neutral">Website</span>';

/* ================= auth screens ================= */
async function renderAuth() {
  let st = { needsSetup: false, setupCodeSet: true };
  try { const r = await fetch('/api/admin/status'); st = await r.json(); } catch {}
  const brand = '<a class="brandmark" href="/" style="color:var(--fg)"><span>Adventure Buddha</span></a>';
  if (st.needsSetup) {
    $('#app').innerHTML = `<div class="auth"><form class="card" data-form="setup">${brand}<h1>Create the owner account</h1>
      <p class="muted">This is the first login for your dashboard. ${st.setupCodeSet ? 'Enter the setup code you added in Cloudflare.' : '<b>First add a SETUP_CODE in Cloudflare (see the setup guide), then reload this page.</b>'}</p>
      <div class="field"><label for="s-code">Setup code</label><input class="in" id="s-code" name="code" required autocomplete="off"></div>
      <div class="field"><label for="s-name">Your name</label><input class="in" id="s-name" name="name" required autocomplete="name"></div>
      <div class="field"><label for="s-email">Email</label><input class="in" id="s-email" name="email" type="email" required autocomplete="username"></div>
      <div class="field"><label for="s-pass">Password (8+ characters)</label><input class="in" id="s-pass" name="password" type="password" minlength="8" required autocomplete="new-password"></div>
      <p class="err" id="auth-err" hidden></p><button class="btn primary" type="submit">Create account</button></form></div>`;
  } else {
    $('#app').innerHTML = `<div class="auth"><form class="card" data-form="login">${brand}<h1>Team login</h1>
      <div class="field"><label for="l-email">Email</label><input class="in" id="l-email" name="email" type="email" required autocomplete="username"></div>
      <div class="field"><label for="l-pass">Password</label><input class="in" id="l-pass" name="password" type="password" required autocomplete="current-password"></div>
      <p class="err" id="auth-err" hidden></p><button class="btn primary" type="submit">Log in</button>
      <p class="hint">Forgot your password? Ask the owner to set a new one from Team.</p></form></div>`;
  }
}

/* ================= layout ================= */
let ED = null, ED_TAB = 'basic', ED_DIRTY = false, ED_FOR = null, SITE = null, LAST = null;
const ADM = { tripQ: '', tripTag: 'all', bkQ: '', bkTrip: '', bkStatus: '', bkWhen: 'upcoming', leadStatus: 'open', leadSrc: '', leadCh: '', leadWho: '', leadQ: '', leadView: 'list', repPeriod: 'month', convLead: '', calMonth: null, depTrip: '', depDate: '' };
const route = () => decodeURIComponent(location.hash.replace(/^#/, '')) || 'overview';
function closeSide() { const s = $('.side'); if (s) s.classList.remove('open'); const sc = $('.scrim'); if (sc) sc.remove(); }
window.addEventListener('hashchange', () => { closeSide(); window.scrollTo(0, 0); render(); });
window.addEventListener('beforeunload', (e) => { if (ED_DIRTY) { e.preventDefault(); e.returnValue = ''; } });

function sideNav(r) {
  const newLeads = D.enquiries.filter((e) => e.source !== 'checkout' && e.status === 'new').length;
  const missed = D.enquiries.filter((e) => e.source === 'checkout' && e.status === 'new').length;
  const pend = D.bookings.filter((b) => b.status === 'pending').length;
  const a = (h, icn, label, cnt) => `<a href="#${h}" ${r === h || r.startsWith(h + '-') ? 'aria-current="page"' : ''}>${ic(icn)}${label}${cnt ? `<span class="cnt">${cnt}</span>` : ''}</a>`;
  return `<nav class="side" aria-label="Dashboard">
    <a class="brandmark" href="#overview" style="color:var(--fg)">${S().logo ? `<img src="${esc(S().logo)}" alt="${esc(S().brand)}">` : `<span>${esc(S().brand)}</span>`}</a>
    ${a('overview', 'home', 'Overview')}
    ${can('trips.view') ? a('trips', 'map', 'Trips') : ''}
    ${can('bookings.view') ? a('calendar', 'cal', 'Departures calendar') : ''}
    ${can('leads.view') ? `<div class="grp">Leads</div>${a('leads', 'inbox', 'Enquiries & leads', newLeads)}${a('followups', 'clock', 'Follow-ups', dueFollow().length)}${a('missed', 'alert', 'Missed checkouts', missed)}${a('lead-report', 'chart', 'Lead sources')}` : ''}
    ${can('bookings.view') ? `<div class="grp">Bookings</div>${a('bookings', 'ticket', 'All bookings', can('money.view') ? pend : 0)}${a('departures', 'list', 'Passenger lists')}${can('money.view') ? a('customers', 'users', 'Customers') : ''}` : ''}
    ${can('coupons.edit') ? a('coupons', 'tag', 'Coupons') : ''}
    ${can('site.edit') || can('*') ? '<div class="grp">Settings</div>' : ''}
    ${can('site.edit') ? a('home', 'home', 'Home page') + a('site', 'gear', 'Website settings') + a('pages', 'list', 'Pages & policies') : ''}
    ${can('*') ? a('team', 'users', 'Team & logins') : ''}
    ${can('activity.view') ? a('activity', 'clock', 'Activity log') : ''}
    <div class="bottom"><a href="/" target="_blank" rel="noopener">${ic('globe')}View website</a>${a('account', 'user', 'My account')}
      <div class="me"><div class="av">${esc(initials(D.me.name || D.me.email))}</div><div><b>${esc(D.me.name || D.me.email)}</b><span class="role-pill">${esc(D.roles[D.me.role] || D.me.role)}</span></div></div></div>
  </nav>`;
}
function render(fromPoll) {
  if (!D) return;
  const r = route();
  const routeChanged = r !== LAST; LAST = r;
  if (fromPoll && (r.startsWith('edit-') || r === 'new' || r === 'site' || r === 'pages' || r === 'home')) { refreshSide(r); return; }
  let title = 'Overview', body = '', actions = '', foot = '';
  const deny = `<div class="notice"><h3>Not available for your role</h3>Ask the owner if you need access.</div>`;
  if (r === 'overview') { title = 'Overview'; body = vOverview(); if (can('trips.edit')) actions = `<a class="btn primary sm" href="#new">${ic('plus')} New trip</a>`; }
  else if (r === 'trips') { title = 'Trips'; body = can('trips.view') ? vTrips() : deny; if (can('trips.edit')) actions = `<a class="btn primary sm" href="#new">${ic('plus')} New trip</a>`; }
  else if (r === 'new' || r.startsWith('edit-')) {
    if (!can('trips.edit')) { body = deny; }
    else {
      const id = r === 'new' ? null : r.slice(5);
      if (!ED || (id && ED.id !== id) || (!id && !ED._new) || (routeChanged && !ED_DIRTY && !ED._new)) startEdit(id);
      if (id && !ED) { title = 'Trip not found'; body = `<div class="notice"><h3>This trip no longer exists</h3><a href="#trips">Back to trips</a></div>`; }
      else { title = ED._new ? 'New trip' : 'Edit trip'; body = vEditor(); foot = edFoot(); if (!ED._new) actions = `<a class="btn sm" href="/tour/${esc(ED.slug)}?preview" target="_blank" rel="noopener">${ic('eye')} Preview</a>`; }
    }
  }
  else if (r === 'calendar') { title = 'Departures calendar'; body = can('bookings.view') ? vCalendar() : deny; }
  else if (r === 'leads') { title = 'Enquiries & leads'; body = can('leads.view') ? vLeads(false) : deny; if (can('leads.edit')) actions = `<button class="btn primary sm" data-act="add-lead">${ic('plus')} Add lead</button>`; }
  else if (r === 'followups') { title = 'Follow-ups'; body = can('leads.view') ? vFollowups() : deny; if (can('leads.edit')) actions = `<button class="btn primary sm" data-act="add-lead">${ic('plus')} Add lead</button>`; }
  else if (r === 'lead-report') { title = 'Lead sources'; body = can('leads.view') ? vLeadReport() : deny; }
  else if (r === 'missed') { title = 'Missed checkouts'; body = can('leads.view') ? vLeads(true) : deny; }
  else if (r === 'bookings') { title = 'All bookings'; body = can('bookings.view') ? vBookings() : deny; actions = (can('bookings.edit') ? `<button class="btn primary sm" data-act="add-booking">${ic('plus')} Add booking</button>` : '') + (can('money.view') ? `<button class="btn sm" data-act="export">${ic('download')} Export</button>` : ''); }
  else if (r === 'departures') { title = 'Passenger lists'; body = can('bookings.view') ? vDepartures() : deny; actions = `<button class="btn sm no-print" data-act="print">Print</button>`; }
  else if (r === 'customers') { title = 'Customers'; body = can('money.view') ? vCustomers() : deny; }
  else if (r === 'coupons') { title = 'Coupons'; body = can('coupons.edit') ? vCoupons() : deny; }
  else if (r === 'pages') { title = 'Pages & policies'; body = can('site.edit') ? vPages() : deny; if (can('site.edit')) actions = `<button class="btn primary sm" data-act="save-site">Save changes</button>`; }
  else if (r === 'home') { title = 'Home page'; body = can('site.edit') ? vHome() : deny; if (can('site.edit')) actions = `<a class="btn sm" href="/" target="_blank" rel="noopener">${ic('eye')} View</a><button class="btn primary sm" data-act="save-site">Save changes</button>`; }
  else if (r === 'site') { title = 'Website settings'; body = can('site.edit') ? vSite() : deny; if (can('site.edit')) actions = `<button class="btn primary sm" data-act="save-site">Save changes</button>`; }
  else if (r === 'team') { title = 'Team & logins'; body = can('*') ? vTeam() : deny; }
  else if (r === 'activity') { title = 'Activity log'; body = can('activity.view') ? '<div class="panel" id="activity"><div class="panel-b muted">Loading…</div></div>' : deny; }
  else if (r === 'account') { title = 'My account'; body = vAccount(); }
  else { location.hash = 'overview'; return; }
  const y = window.scrollY;
  $('#app').innerHTML = `<div class="adm">${sideNav(r)}<main class="amain">
    ${D.trial ? '<div style="background:var(--warn-soft);color:var(--warn);font-size:13px;font-weight:600;padding:6px 24px">Test mode: the website is hidden from Google and this is your trial setup.</div>' : ''}
    <div class="atop"><button class="iconbtn mob-only" data-act="open-side" aria-label="Menu">${ic('menu')}</button><h1>${esc(title)}</h1>${actions}</div>
    <div class="abody">${body}</div>${foot}</main></div>`;
  if (fromPoll) window.scrollTo(0, y);
  if (r === 'trips') renderTripList();
  if (r === 'bookings') renderBkTable();
  if (r === 'activity' && can('activity.view')) loadActivity();
  const q = $('#adm-q'); if (q) q.value = ADM.tripQ; const bq = $('#bk-q'); if (bq) bq.value = ADM.bkQ;
}
function refreshSide(r) { const side = $('.side'); if (side) { const tmp = document.createElement('div'); tmp.innerHTML = sideNav(r); side.replaceWith(tmp.firstElementChild); } }

/* ================= overview ================= */
function vOverview() {
  const now = today(), in30 = addDays(now, 30);
  const live = D.trips.filter((t) => t.status === 'live');
  const deps = []; D.trips.forEach((t) => (t.slots || []).forEach((s) => { if (s.date >= now) deps.push({ t, s }); }));
  deps.sort((a, b) => a.s.date.localeCompare(b.s.date));
  const act = D.bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  const todayB = act.filter((b) => isoOf(new Date(b.createdAt || 0)) === now);
  const month = act.filter((b) => isoOf(new Date(b.createdAt || 0)).slice(0, 7) === now.slice(0, 7));
  const due = act.filter((b) => b.slotDate >= now).reduce((s, b) => s + Math.max(0, (b.total || 0) - (b.paid || 0)), 0);
  const newLeads = D.enquiries.filter((e) => e.source !== 'checkout' && e.status === 'new');
  const missed = D.enquiries.filter((e) => e.source === 'checkout' && e.status === 'new');
  const money = can('money.view');
  const empty = !D.trips.length && can('trips.edit');
  return `${empty ? `<div class="panel" style="border-color:var(--accent)"><div class="panel-b" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between"><span><b>Welcome!</b> Your website has no trips yet. Load the 8 starter trips copied from your current site, or create your own.</span><span class="toolbar"><button class="btn primary sm" data-act="seed">Load starter trips</button><a class="btn sm" href="#new">Create a trip</a></span></div></div>` : ''}
  <div class="stats">
    <a class="stat" href="#trips"><div class="k">Live trips</div><div class="v">${live.length}</div><div class="s">${deps.filter((d) => d.s.date <= in30).length} departures in next 30 days</div></a>
    ${money ? `<a class="stat" href="#bookings"><div class="k">Today's bookings</div><div class="v num">${inr(todayB.reduce((s, b) => s + (b.total || 0), 0))}</div><div class="s">${todayB.length} today · ${month.length} this month</div></a>
    <a class="stat" href="#bookings"><div class="k">Balance to collect</div><div class="v num">${inr(due)}</div><div class="s">from upcoming departures</div></a>` : `<a class="stat" href="#departures"><div class="k">Travellers this month</div><div class="v">${month.reduce((s, b) => s + (Number(b.people) || 0), 0)}</div><div class="s">booked</div></a>`}
    ${can('leads.view') ? `<a class="stat" href="#leads"><div class="k">New enquiries</div><div class="v">${newLeads.length}</div><div class="s">+ ${missed.length} missed checkouts</div></a><a class="stat" href="#followups"><div class="k">Follow-ups due</div><div class="v" ${dueFollow().length ? 'style="color:var(--warn)"' : ''}>${dueFollow().length}</div><div class="s">${dueFollow().filter((e) => e.assignedTo === D.me.email).length} assigned to you</div></a>` : ''}
  </div>
  <div class="cols2">
    <div class="panel"><div class="panel-h"><h2>Next departures</h2><a class="btn sm ghost" href="#calendar">Calendar</a></div><div>
    ${deps.slice(0, 8).map(({ t, s }) => { const b = booked(t.id, s.date), cap = Number(s.seats) || 0, pct = cap ? Math.min(100, Math.round(b / cap * 100)) : 0, d = parseISO(s.date), min = Number(t.minGroup) || 8;
      return `<a class="dep" href="#departures" data-act="pick-dep" data-trip="${esc(t.id)}" data-date="${esc(s.date)}"><div class="dt">${DOW[d.getDay()]}<b>${d.getDate()}</b>${MON[d.getMonth()]}</div><div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.name)}</b><span class="hint">${b} of ${cap} seats booked${b < min ? ` · needs ${min - b} more to run` : ''}</span></div><div><div class="bar"><i class="${pct >= 70 ? 'hi' : pct < 30 ? 'lo' : ''}" style="width:${pct}%"></i></div><div class="hint num" style="text-align:right;margin-top:4px">${pct}%</div></div></a>`; }).join('') || '<div class="panel-b muted">No upcoming departures. Add dates to a trip.</div>'}</div></div>
    ${can('leads.view') ? `<div class="panel"><div class="panel-h"><h2>Latest enquiries</h2><a class="btn sm ghost" href="#leads">See all</a></div><div>
    ${D.enquiries.filter((e) => e.status === 'new').slice(0, 7).map((e) => `<div class="list-row"><div class="av">${esc(initials(e.name))}</div><div style="min-width:0;flex:1"><b>${esc(e.name)}</b><div class="hint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.tripName || 'General enquiry')} · ${ago(e.createdAt)}</div></div>${srcPill(e.source)}<a class="iconbtn" href="${waLink(`Hi ${e.name || ''}, this is Adventure Buddha about ${e.tripName || 'your enquiry'}.`, e.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic('wa')}</a></div>`).join('') || '<div class="panel-b muted">No new enquiries.</div>'}</div></div>` : ''}
  </div>`;
}

/* ================= trips ================= */
function vTrips() {
  const tags = [{ id: 'all', name: 'All' }, { id: 'live', name: 'Live' }, { id: 'draft', name: 'Draft' }, ...cats()];
  return `<div class="toolbar"><div class="search">${ic('search')}<input class="in" id="adm-q" type="search" placeholder="Search trips" autocomplete="off"></div></div>
  <div class="chips">${tags.map((x) => `<button class="chip" data-act="trip-tag" data-tag="${esc(x.id)}" aria-pressed="${ADM.tripTag === x.id}">${esc(x.name)}</button>`).join('')}</div>
  <div class="panel"><div class="trows" id="trip-list"></div></div>`;
}
function renderTripList() {
  const box = $('#trip-list'); if (!box) return;
  const q = ADM.tripQ.toLowerCase(), tag = ADM.tripTag;
  const list = D.trips.filter((t) => (!q || (t.name + ' ' + (t.location || '')).toLowerCase().includes(q)) && (tag === 'all' || (tag === 'live' && t.status === 'live') || (tag === 'draft' && t.status !== 'live') || (t.categories || []).includes(tag)))
    .sort((a, b) => (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1) || String(a.name).localeCompare(b.name));
  box.innerHTML = list.map((t) => { const n = upcoming(t)[0]; return `<div class="trip-row">${t.cover ? `<img src="${esc(t.cover)}" alt="" loading="lazy">` : '<div class="ph"></div>'}
    <div style="min-width:0"><h3>${esc(t.name)}</h3><div class="meta">${statusPill(t.status === 'live' ? 'live' : 'draft')}${t.mode === 'enquire' ? '<span class="pill info">Enquire only</span>' : ''}${t.featured ? `<span class="pill accent">${ic('star')} Featured</span>` : ''}<span>${Number(t.days) || 1}D/${Number(t.nights) || 0}N</span><span class="num">${fromPrice(t) ? inr(fromPrice(t)) : 'No price'}</span><span>${n ? 'Next ' + fmtD(n.date) : 'No upcoming dates'}</span></div></div>
    <div class="acts">${can('trips.edit') ? `<a class="btn sm" href="#edit-${esc(t.id)}">${ic('edit')} Edit</a><button class="btn sm" data-act="dup-trip" data-id="${esc(t.id)}">${ic('copy')} Copy</button><button class="btn sm" data-act="toggle-live" data-id="${esc(t.id)}">${t.status === 'live' ? 'Unpublish' : 'Publish'}</button>` : ''}<a class="btn sm ghost" href="/tour/${esc(t.slug)}?preview" target="_blank" rel="noopener" aria-label="View on website">${ic('ext')}</a></div></div>`; }).join('')
    || `<div class="panel-b"><div class="notice"><h3>No trips here</h3>${can('trips.edit') ? '<a class="btn primary sm" href="#new">Create a trip</a>' : ''}</div></div>`;
}

/* ================= editor ================= */
function blankTrip() {
  return { id: uid('t'), _new: true, name: '', slug: '', status: 'draft', mode: 'fixed', categories: [cats()[0] ? cats()[0].id : 'weekend'], days: 2, nights: 1, location: '', tagline: '', about: '', inclusions: ['transport', 'stay', 'guide'], difficulty: 'Easy', groupSize: '12 to 25 travellers', minGroup: 8, bestSeason: '', tripLead: '', tripLeadPhone: '', featured: false, order: 99, mrp: 0,
    gst: 5, tickets: [{ id: uid('k'), name: 'Regular', price: 0, ebDays: 0, note: '', pax: 1 }], closeDays: 1, defaultSeats: 25, slots: [], pickups: [], allowOnline: true, advancePct: Number(S().advancePct) || 50, upi: '',
    itinerary: [{ title: 'Day 0 (Friday): Departure from Bangalore', body: '', travel: 'AC Tempo Traveller / mini bus', stay: 'Overnight journey', meals: '' }],
    sections: [{ id: uid('s'), title: 'Inclusions', body: '' }, { id: uid('s'), title: 'Exclusions', body: '' }, { id: uid('s'), title: 'Things to carry', body: '' }], faqs: [], cover: '', gallery: [], seoTitle: '', seoDesc: '' };
}
function startEdit(id) {
  ED_DIRTY = false;
  if (ED_FOR !== (id || 'new')) { ED_TAB = 'basic'; ED_FOR = id || 'new'; }
  if (!id) { ED = blankTrip(); return; }
  const t = tripById(id); ED = t ? JSON.parse(JSON.stringify(t)) : null;
  if (ED) { ED.itinerary = ED.itinerary || []; ED.sections = ED.sections || []; ED.faqs = ED.faqs || []; ED.gallery = ED.gallery || []; ED.slots = ED.slots || []; ED.pickups = ED.pickups || []; ED.tickets = ED.tickets || []; }
}
const fld = (label, html, hint) => `<div class="field"><label>${label}</label>${html}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
const inp = (k, attrs = '') => `<input class="in" data-ed="${k}" value="${esc(ED[k] ?? '')}" ${attrs}>`;
const rteBar = () => `<div class="rte-bar">${[['bold', 'B'], ['italic', 'I'], ['h3', 'Heading'], ['insertUnorderedList', '• List'], ['insertOrderedList', '1. List'], ['removeFormat', 'Clear']].map(([c, l]) => `<button type="button" data-cmd="${c}">${l}</button>`).join('')}</div>`;
function vEditor() {
  const tabs = [['basic', 'Basic details'], ['tickets', 'Prices & dates'], ['itinerary', 'Itinerary'], ['details', 'Inclusions & FAQs'], ['photos', 'Photos']];
  let h = '';
  if (ED_TAB === 'basic') {
    h = `<div class="ed-group"><h3>About the trip</h3>
      ${fld('Trip name', inp('name', 'placeholder="e.g. Hampi & Hippie Island Weekend Trip"'))}
      <div class="grid2">${fld('Web address', `<div style="display:flex;align-items:center;gap:6px"><span class="hint">/tour/</span>${inp('slug', 'placeholder="made from the name"')}</div>`, 'Keep it the same as on your old site so Google rankings carry over.')}
      ${fld('Booking type', `<div class="toggles"><label class="tog"><input type="radio" name="ed-mode" data-ed="mode" value="fixed" ${ED.mode !== 'enquire' ? 'checked' : ''}>Fixed departures</label><label class="tog"><input type="radio" name="ed-mode" data-ed="mode" value="enquire" ${ED.mode === 'enquire' ? 'checked' : ''}>Enquire only / custom</label></div>`)}</div>
      ${fld('Short highlight line', `<textarea class="in" data-ed="tagline" rows="2" placeholder="One or two lines at the top of the trip page">${esc(ED.tagline)}</textarea>`)}
      <div class="field"><label>About this trip</label><div class="secbox">${rteBar()}<div class="rte rich" contenteditable="true" data-rte="about" data-ph="A short story about the place and why people love this trip…">${ED.about || ''}</div></div></div>
      <div class="grid3">${fld('Days', inp('days', 'type="number" min="1"'))}${fld('Nights', inp('nights', 'type="number" min="0"'))}${fld('Main place', inp('location', 'placeholder="Hampi"'))}</div></div>
    <div class="ed-group"><h3>Where it shows on the website</h3>
      ${fld('Categories', `<div class="toggles">${cats().map((c) => `<label class="tog"><input type="checkbox" data-ed-arr="categories" value="${esc(c.id)}" ${(ED.categories || []).includes(c.id) ? 'checked' : ''}>${esc(c.name)}</label>`).join('')}</div>`)}
      <div class="grid2"><label class="tog" style="justify-self:start"><input type="checkbox" data-ed="featured" ${ED.featured ? 'checked' : ''}>${ic('star')} Show in "Popular right now"</label>${fld('Display order', inp('order', 'type="number" min="0"'), 'Lower numbers show first.')}</div></div>
    <div class="ed-group"><h3>What's included (icons)</h3><div class="toggles">${INCL.map((x) => `<label class="tog"><input type="checkbox" data-ed-arr="inclusions" value="${x.id}" ${(ED.inclusions || []).includes(x.id) ? 'checked' : ''}>${ic(x.icon)}${x.name}</label>`).join('')}</div></div>
    <div class="ed-group"><h3>Trip facts</h3>
      <div class="grid3">${fld('Difficulty', `<select class="in" data-ed="difficulty">${['', 'Easy', 'Moderate', 'Challenging'].map((v) => `<option value="${v}" ${ED.difficulty === v ? 'selected' : ''}>${v || 'Not shown'}</option>`).join('')}</select>`)}${fld('Group size', inp('groupSize', 'placeholder="12 to 25 travellers"'))}${fld('Minimum to run', inp('minGroup', 'type="number" min="1"'), 'Dashboard only')}</div>
      <div class="grid2">${fld('Best time to visit', inp('bestSeason', 'placeholder="Oct to Feb"'))}<div></div></div></div>
    <div class="ed-group"><h3>Trip lead (team only)</h3><div class="grid2">${fld('Name', inp('tripLead'))}${fld('WhatsApp number', inp('tripLeadPhone', 'inputmode="tel"'))}</div></div>
    <div class="ed-group"><h3>Google search listing</h3>
      ${fld('Search title', inp('seoTitle', 'maxlength="90" placeholder="Hampi Weekend Trip from Bangalore | Adventure Buddha"'), 'Leave empty to use the trip name.')}
      ${fld('Search description', `<textarea class="in" data-ed="seoDesc" rows="2" maxlength="200" placeholder="About 150 characters shown under the title on Google">${esc(ED.seoDesc)}</textarea>`)}</div>`;
  } else if (ED_TAB === 'tickets') {
    h = `<div class="ed-group"><h3>Ticket types</h3><p class="hint">Enter the price before GST. Customers see the price with GST.</p>
      ${ED.tickets.map((k, i) => `<div class="arow tk-row">
        <div class="field grow"><label>Ticket name</label><input class="in" data-arr="tickets" data-i="${i}" data-k="name" value="${esc(k.name)}" placeholder="Regular / Early bird / Couple room"></div>
        <div class="field"><label>Price before GST</label><input class="in" type="number" min="0" step="0.01" data-arr="tickets" data-i="${i}" data-k="price" value="${esc(k.price)}"><span class="hint">With GST: <b class="num" data-gst-for="${i}">${inr(withGst(k.price, ED))}</b></span></div>
        <div class="field"><label>Early bird: days ahead</label><input class="in" type="number" min="0" data-arr="tickets" data-i="${i}" data-k="ebDays" value="${esc(k.ebDays || 0)}"><span class="hint">0 = always on sale</span></div>
        <button class="iconbtn" data-act="arr-del" data-arr="tickets" data-i="${i}" aria-label="Remove ticket">${ic('trash')}</button>
        <div class="field grow" style="grid-column:1/-2"><label>Note (optional)</label><input class="in" data-arr="tickets" data-i="${i}" data-k="note" value="${esc(k.note || '')}" placeholder="e.g. Private room for 2"></div>
        <div class="field"><label>People per ticket</label><input class="in" type="number" min="1" data-arr="tickets" data-i="${i}" data-k="pax" value="${esc(k.pax || 1)}"></div></div>`).join('')}
      <div><button class="btn sm" data-act="arr-add" data-arr="tickets">${ic('plus')} Add ticket type</button></div>
      <div class="grid3">${fld('GST %', inp('gst', 'type="number" min="0" step="0.5"'))}${fld('Original price (crossed out)', inp('mrp', 'type="number" min="0"'), 'Per person incl. GST. Shows "Save ₹…". 0 = hide.')}${fld('Close bookings', `<div style="display:flex;align-items:center;gap:8px">${inp('closeDays', 'type="number" min="0"')}<span class="hint">days before</span></div>`)}</div></div>
    ${ED.mode === 'enquire' ? '<div class="notice">This trip is "Enquire only". Switch to Fixed departures in Basic details to add dates.</div>' : `
    <div class="ed-group"><h3>Departure dates</h3><p class="hint">"Extra per person" changes the price for one date, e.g. +500 on a long weekend (before GST).</p>
      ${ED.slots.map((s, i) => ({ s, i })).sort((a, b) => String(a.s.date).localeCompare(String(b.s.date))).map(({ s, i }) => { const b = booked(ED.id, s.date); return `<div class="arow slot-row" ${s.date < today() ? 'style="opacity:.6"' : ''}>
        <div class="field"><label>Date</label><input class="in" type="date" data-arr="slots" data-i="${i}" data-k="date" value="${esc(s.date)}"></div>
        <div class="field"><label>Seats</label><input class="in" type="number" min="0" data-arr="slots" data-i="${i}" data-k="seats" value="${esc(s.seats)}"><span class="hint">${b} booked${s.date < today() ? ' · past' : ''}</span></div>
        <div class="field"><label>Time · extra ₹/person</label><div style="display:flex;gap:6px"><input class="in" data-arr="slots" data-i="${i}" data-k="time" value="${esc(s.time || '20:30')}" style="width:80px"><input class="in" type="number" data-arr="slots" data-i="${i}" data-k="extra" value="${esc(s.extra || 0)}"></div></div>
        <button class="iconbtn" data-act="arr-del" data-arr="slots" data-i="${i}" aria-label="Remove date" ${b ? 'disabled title="Has bookings"' : ''}>${ic('trash')}</button></div>`; }).join('') || '<p class="hint">No dates yet.</p>'}
      <div class="toolbar"><button class="btn sm" data-act="arr-add" data-arr="slots">${ic('plus')} Add a date</button><button class="btn sm" data-act="add-weekly" data-dow="5">${ic('cal')} Add next 8 Fridays</button><button class="btn sm" data-act="add-weekly" data-dow="6">Add next 8 Saturdays</button>
        <span class="hint">New dates get</span><input class="in" style="width:80px" type="number" min="1" data-ed="defaultSeats" value="${esc(ED.defaultSeats || 25)}"><span class="hint">seats</span></div></div>`}
    <div class="ed-group"><h3>Pickup points</h3><p class="hint">Leave empty to use your default pickup points (${(S().pickups || []).length} set in Website settings).</p>
      ${ED.pickups.map((p, i) => `<div class="arow pk-row"><div class="field grow"><label>Place</label><input class="in" data-arr="pickups" data-i="${i}" data-k="place" value="${esc(p.place)}"></div><div class="field"><label>Time</label><input class="in" data-arr="pickups" data-i="${i}" data-k="time" value="${esc(p.time)}" placeholder="8:30 PM"></div><button class="iconbtn" data-act="arr-del" data-arr="pickups" data-i="${i}" aria-label="Remove">${ic('trash')}</button></div>`).join('')}
      <div class="toolbar"><button class="btn sm" data-act="arr-add" data-arr="pickups">${ic('plus')} Add pickup point</button>${D.trips.some((t) => (t.pickups || []).length && t.id !== ED.id) ? `<button class="btn sm" data-act="copy-pickups">Copy from another trip</button>` : ''}</div></div>
    <div class="ed-group"><h3>Payment</h3>
      <label class="tog" style="justify-self:start"><input type="checkbox" data-ed="allowOnline" ${ED.allowOnline !== false ? 'checked' : ''}>Accept online payment (Razorpay)${D.razorpay ? '' : ' · not connected yet'}</label>
      <div class="grid2">${fld('Advance to hold a seat (%)', inp('advancePct', 'type="number" min="0" max="100"'))}${fld('UPI ID for this trip', inp('upi', `placeholder="${esc(S().upi)}"`), 'Leave empty to use your main UPI ID.')}</div></div>`;
  } else if (ED_TAB === 'itinerary') {
    h = `<div class="ed-group"><h3>Day-by-day plan</h3><p class="hint">Each day shows as a card on the trip page, with travel, stay and meals.</p>
      ${ED.itinerary.map((d, i) => `<div class="day-ed"><div class="secbox-h"><b>${i + 1}</b><input class="in" data-arr="itinerary" data-i="${i}" data-k="title" value="${esc(d.title)}" placeholder="Day ${i + 1}: title" aria-label="Day title">
        <button class="iconbtn" data-act="arr-move" data-arr="itinerary" data-i="${i}" data-d="-1" aria-label="Move up" ${i ? '' : 'disabled'}>${ic('up')}</button><button class="iconbtn" data-act="arr-move" data-arr="itinerary" data-i="${i}" data-d="1" aria-label="Move down" ${i < ED.itinerary.length - 1 ? '' : 'disabled'}>${ic('down')}</button><button class="iconbtn" data-act="arr-del" data-arr="itinerary" data-i="${i}" aria-label="Delete day">${ic('trash')}</button></div>
        ${rteBar()}<div class="rte rich" contenteditable="true" data-rte="itinerary" data-i="${i}" data-ph="What happens on this day…">${d.body || ''}</div>
        <div class="day-meta"><div class="field"><label>${ic('transport')} Travel</label><input class="in" data-arr="itinerary" data-i="${i}" data-k="travel" value="${esc(d.travel)}" placeholder="AC Tempo Traveller"></div><div class="field"><label>${ic('stay')} Stay</label><input class="in" data-arr="itinerary" data-i="${i}" data-k="stay" value="${esc(d.stay)}" placeholder="Hotel, 3 sharing"></div><div class="field"><label>${ic('meals')} Meals</label><input class="in" data-arr="itinerary" data-i="${i}" data-k="meals" value="${esc(d.meals)}" placeholder="Breakfast"></div></div></div>`).join('')}
      <div><button class="btn sm" data-act="add-day">${ic('plus')} Add a day</button></div></div>`;
  } else if (ED_TAB === 'details') {
    h = `<div class="ed-group"><h3>Inclusions, exclusions and other details</h3><p class="hint">Each section shows as a fold-out on the trip page. Cancellation policy and terms come from Website settings, so you don't repeat them here.</p>
      ${ED.sections.map((s, i) => `<div class="secbox"><div class="secbox-h"><input class="in" data-arr="sections" data-i="${i}" data-k="title" value="${esc(s.title)}" aria-label="Section title">
        <button class="iconbtn" data-act="arr-move" data-arr="sections" data-i="${i}" data-d="-1" aria-label="Move up" ${i ? '' : 'disabled'}>${ic('up')}</button><button class="iconbtn" data-act="arr-move" data-arr="sections" data-i="${i}" data-d="1" aria-label="Move down" ${i < ED.sections.length - 1 ? '' : 'disabled'}>${ic('down')}</button><button class="iconbtn" data-act="arr-del" data-arr="sections" data-i="${i}" aria-label="Delete section">${ic('trash')}</button></div>
        ${rteBar()}<div class="rte rich" contenteditable="true" data-rte="sections" data-i="${i}" data-ph="Write the ${esc((s.title || 'section').toLowerCase())} here…">${s.body || ''}</div></div>`).join('')}
      <div class="toolbar"><span class="hint">Add:</span>${SECTION_TEMPLATES.map((n) => `<button class="btn sm" data-act="add-section" data-title="${esc(n)}">${ic('plus')} ${esc(n)}</button>`).join('')}<button class="btn sm" data-act="add-section" data-title="">${ic('plus')} Custom</button></div></div>
    <div class="ed-group"><h3>Frequently asked questions</h3><p class="hint">FAQs help customers and can appear directly in Google results.</p>
      ${ED.faqs.map((f, i) => `<div class="faq-row"><div style="display:flex;gap:8px"><input class="in" data-arr="faqs" data-i="${i}" data-k="q" value="${esc(f.q)}" placeholder="Question"><button class="iconbtn" data-act="arr-del" data-arr="faqs" data-i="${i}" aria-label="Delete">${ic('trash')}</button></div><textarea class="in" data-arr="faqs" data-i="${i}" data-k="a" rows="2" placeholder="Answer">${esc(f.a)}</textarea></div>`).join('')}
      <div><button class="btn sm" data-act="add-faq">${ic('plus')} Add a question</button></div></div>`;
  } else if (ED_TAB === 'photos') {
    h = `<div class="ed-group"><h3>Cover photo</h3><div class="cover-pick"><div class="im">${ED.cover ? `<img src="${esc(ED.cover)}" alt="Cover">` : ''}</div>
      <div class="ed-form" style="gap:10px"><div class="toolbar">${upBtn('cover')}</div>${fld('…or image link', inp('cover', 'placeholder="https://…"'))}<p class="hint">Use a wide (landscape) photo. It shows on trip cards and first in the slider.</p></div></div></div>
    <div class="ed-group"><h3>Gallery</h3>
      <div class="photos">${ED.gallery.map((g, i) => `<div class="ph-item"><div class="im"><img src="${esc(g.url)}" alt="" loading="lazy"></div><div class="c"><input class="in" data-arr="gallery" data-i="${i}" data-k="caption" value="${esc(g.caption || '')}" placeholder="Caption (optional)"><div class="ph-acts"><button class="iconbtn" data-act="arr-move" data-arr="gallery" data-i="${i}" data-d="-1" aria-label="Move left">${ic('left')}</button><button class="iconbtn" data-act="arr-move" data-arr="gallery" data-i="${i}" data-d="1" aria-label="Move right">${ic('right')}</button><button class="iconbtn" data-act="set-cover" data-i="${i}" aria-label="Use as cover">${ic('star')}</button><button class="iconbtn" data-act="arr-del" data-arr="gallery" data-i="${i}" aria-label="Remove">${ic('trash')}</button></div></div></div>`).join('')}</div>
      <div class="toolbar">${upBtn('gallery')}<input class="in" id="gal-url" placeholder="…or paste an image link" style="flex:1;min-width:200px"><button class="btn sm" data-act="add-gal-url">Add link</button></div>
      <p class="hint">Photos are resized automatically before upload, so phone photos are fine.</p></div>`;
  }
  return `<div class="panel"><div class="ed-tabs" role="tablist">${tabs.map(([k, l], i) => `<button role="tab" data-act="ed-tab" data-tab="${k}" aria-selected="${ED_TAB === k}"><i>${i + 1}</i>${l}</button>`).join('')}</div><div class="panel-b"><div class="ed-form">${h}</div></div></div>`;
}
const upBtn = (target) => `<label class="btn sm primary" style="cursor:pointer">${ic('upload')} Upload photo${target === 'gallery' ? 's' : ''}<input type="file" accept="image/*" ${target === 'gallery' ? 'multiple' : ''} data-upload="${target}" hidden></label>`;
function edFoot() {
  return `<div class="ed-foot"><span class="sp">${statusPill(ED.status === 'live' ? 'live' : 'draft')}<span id="dirty">${ED_DIRTY ? 'Unsaved changes' : ''}</span></span>
    ${!ED._new ? `<button class="btn sm danger" data-act="del-trip">${ic('trash')} Delete</button>` : ''}
    <button class="btn" data-act="ed-save">Save</button><button class="btn primary" data-act="ed-publish">${ED.status === 'live' ? 'Save (stays live)' : 'Save & publish'}</button></div>`;
}
function markDirty() { ED_DIRTY = true; const d = $('#dirty'); if (d) d.textContent = 'Unsaved changes'; }
async function edSave(publish) {
  if (!ED.name.trim()) { toast('Give the trip a name first.'); ED_TAB = 'basic'; render(); return; }
  ED.slug = slugify(ED.slug || ED.name);
  if (publish) ED.status = 'live';
  const wasNew = ED._new; const body = JSON.parse(JSON.stringify(ED)); delete body._new;
  try {
    await api('PUT', 'trips/' + encodeURIComponent(ED.id), body);
    ED_DIRTY = false; delete ED._new; toast(publish ? 'Saved. The trip is live on the website.' : 'Saved');
    await load();
    if (wasNew) { ED_FOR = ED.id; location.hash = 'edit-' + ED.id; } else { startEdit(ED.id); render(); }
  } catch (e) { toast(e.message); if (publish && wasNew) ED.status = 'draft'; }
}

/* ================= images ================= */
async function compress(file) {
  if (!/^image\//.test(file.type)) throw new Error(file.name + ' is not a photo.');
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const max = 1600, sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.82, blob = await new Promise((r) => c.toBlob(r, 'image/webp', q));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', q));
  while (blob.size > 900000 && q > 0.45) { q -= 0.12; blob = await new Promise((r) => c.toBlob(r, blob.type, q)); }
  return blob;
}
async function uploadFiles(files, target) {
  for (const f of Array.from(files || [])) {
    toast('Uploading ' + f.name + '…');
    try { const blob = await compress(f); const r = await api('POST', 'images', undefined, blob);
      if (target === 'cover') ED.cover = r.url; else if (target === 'gallery') { ED.gallery.push({ url: r.url, caption: '' }); if (!ED.cover) ED.cover = r.url; }
      else if (target === 'slides') { SITE.heroSlides = SITE.heroSlides || []; SITE.heroSlides.push({ url: r.url, caption: '', link: '' }); }
      else if (target === 'moments') { SITE.moments = SITE.moments || []; SITE.moments.push(r.url); }
      else if (target.startsWith('site:')) SITE[target.slice(5)] = r.url;
      if (!target.startsWith('site:') && target !== 'slides' && target !== 'moments' && ED) markDirty(); }
    catch (e) { toast(e.message); }
  }
  toast('Photos added. Click Save to keep them.'); render();
}

/* ================= calendar ================= */
function vCalendar() {
  const base = ADM.calMonth || today().slice(0, 7);
  const [y, m] = base.split('-').map(Number); const first = new Date(y, m - 1, 1);
  const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
  const ev = {}; D.trips.forEach((t) => (t.slots || []).forEach((s) => { (ev[s.date] = ev[s.date] || []).push({ t, s }); }));
  const cells = []; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
  const prev = isoOf(new Date(y, m - 2, 1)).slice(0, 7), next = isoOf(new Date(y, m, 1)).slice(0, 7);
  return `<div class="toolbar"><button class="iconbtn" data-act="cal-go" data-m="${prev}" aria-label="Previous month">${ic('left')}</button><b style="min-width:150px;text-align:center">${MONTHS[m - 1]} ${y}</b><button class="iconbtn" data-act="cal-go" data-m="${next}" aria-label="Next month">${ic('right')}</button><button class="btn sm" data-act="cal-go" data-m="">Today</button></div>
  <div class="tbl-wrap"><div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<div class="h">${d}</div>`).join('')}
  ${cells.map((d) => { const k = isoOf(d); return `<div class="d ${d.getMonth() !== m - 1 ? 'out' : ''} ${k === today() ? 'today' : ''}"><span class="n">${d.getDate()}</span>${(ev[k] || []).map(({ t, s }) => `<a class="ev" href="#departures" data-act="pick-dep" data-trip="${esc(t.id)}" data-date="${k}" title="${esc(t.name)}">${esc(t.location || t.name)} · ${booked(t.id, s.date)}/${Number(s.seats) || 0}</a>`).join('')}</div>`; }).join('')}</div></div>
  <p class="hint">Each departure shows booked / total seats. Tap one to see its passenger list.</p>`;
}

/* ================= leads (CRM) ================= */
const LEAD_ST = [['new', 'New'], ['contacted', 'Contacted'], ['interested', 'Interested'], ['converted', 'Booked'], ['lost', 'Not interested']];
const LEAD_CH = { website: 'Website', whatsapp: 'WhatsApp', call: 'Phone call', instagram: 'Instagram (not ad)', meta_ad: 'Instagram / Facebook ad', google: 'Google', referral: 'Friend / referral', repeat: 'Repeat traveller', walkin: 'Walk-in / event', other: 'Other' };
const chOf = (e) => e.channel || (e.source === 'manual' ? 'other' : 'website');
const isOpen = (e) => e.status === 'new' || e.status === 'contacted' || e.status === 'interested';
const todayS = () => D.today || isoOf(new Date());
const dueFollow = () => D.enquiries.filter((e) => isOpen(e) && e.followUp && e.followUp <= todayS()).sort((a, b) => a.followUp.localeCompare(b.followUp));
const memberName = (email) => { const u = (D.team || []).find((x) => x.email === email); return u ? (u.name || u.email) : (email || ''); };
const plusDays = (n) => { const d = parseISO(todayS()); d.setDate(d.getDate() + n); return isoOf(d); };
function fuPill(e) {
  if (!e.followUp || !isOpen(e)) return '';
  const t = todayS();
  if (e.followUp < t) return `<span class="pill bad">${ic('clock')} Follow-up overdue · ${fmtD(e.followUp)}</span>`;
  if (e.followUp === t) return `<span class="pill warn">${ic('clock')} Follow up today</span>`;
  return `<span class="pill neutral">${ic('clock')} Follow up ${fmtD(e.followUp)}</span>`;
}
const leadWa = (e) => waLink(e.source === 'checkout' ? `Hi ${e.name || ''}! You were booking ${e.tripName || 'a trip'} with Adventure Buddha${e.date ? ' for ' + fmtD(e.date) : ''}. Seats are filling up. Can I help you finish the booking?` : e.source === 'itinerary' ? `Hi ${e.name || ''}! Here is the itinerary for ${e.tripName || 'the trip'} you asked for:` : `Hi ${e.name || ''}, this is Adventure Buddha about ${e.tripName || 'your enquiry'}.`, e.phone);
const lastNote = (e) => { const n = (e.notes || []).filter((x) => !x.auto); return n.length ? n[n.length - 1] : (e.note ? { text: e.note } : null); };
function leadRow(e) {
  const team = (D.team || []).filter((u) => u.active), ln = lastNote(e);
  return `<div class="lrow"><div style="min-width:0"><div class="who"><div class="av">${esc(initials(e.name))}</div><div><button class="linkbtn" data-act="open-lead" data-id="${esc(e.id)}"><b>${esc(e.name)}</b></button> ${srcPill(e.source)} <span class="pill neutral">${esc(LEAD_CH[chOf(e)])}</span>${fuPill(e) ? ' ' + fuPill(e) : ''}<div class="hint"><span class="num" style="user-select:all">${esc(e.phone)}</span> · ${ago(e.createdAt)}${e.addedBy ? ' · added by ' + esc(memberName(e.addedBy)) : ''}</div></div></div>
      <div class="hint" style="margin-top:8px">${esc(e.tripName || 'General enquiry')}${e.date ? ' · ' + fmtD(e.date) : ''}${e.people ? ' · ' + Number(e.people) + ' people' : ''}${e.assignedTo ? ' · Assigned to <b>' + esc(memberName(e.assignedTo)) + '</b>' : ''}</div></div>
    <div class="side-acts">${can('leads.edit') ? `<select class="in" style="width:auto;padding:6px 10px" data-lead-status="${esc(e.id)}" aria-label="Status">${LEAD_ST.map(([v, l]) => `<option value="${v}" ${e.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="in" style="width:auto;padding:6px 10px" data-lead-assign="${esc(e.id)}" aria-label="Assigned to"><option value="">Unassigned</option>${team.map((u) => `<option value="${esc(u.email)}" ${e.assignedTo === u.email ? 'selected' : ''}>${esc(u.name || u.email)}</option>`).join('')}</select>` : statusPill(e.status)}
      <button class="btn sm" data-act="open-lead" data-id="${esc(e.id)}">${ic('edit')} Open</button>
      <a class="btn sm primary" href="${leadWa(e)}" target="_blank" rel="noopener">${ic('wa')} WhatsApp</a><a class="btn sm" href="tel:${esc(String(e.phone || '').replace(/[^\d+]/g, ''))}" aria-label="Call">${ic('phone')}</a></div>
    ${e.message || ln ? `<div class="msg">${e.message ? esc(e.message) : ''}${e.message && ln ? '<br>' : ''}${ln ? `<span class="hint">Latest note${ln.by ? ' · ' + esc(memberName(ln.by)) : ''}:</span> ${esc(ln.text)}` : ''}</div>` : ''}</div>`;
}
function vLeads(missed) {
  const all = D.enquiries.filter((e) => missed ? e.source === 'checkout' : e.source !== 'checkout');
  const filters = missed ? [['open', 'To follow up'], ['converted', 'Booked'], ['lost', 'Not interested'], ['all', 'All']] : [['open', 'Open'], ['new', 'New'], ['contacted', 'Contacted'], ['interested', 'Interested'], ['converted', 'Booked'], ['lost', 'Not interested'], ['all', 'All']];
  const st = ADM.leadStatus;
  const match = (e, k) => k === 'all' || (k === 'open' ? isOpen(e) : e.status === k);
  const q = ADM.leadQ.trim().toLowerCase(), qd = q.replace(/\D/g, '');
  const pre = all.filter((e) => (missed || !ADM.leadSrc || e.source === ADM.leadSrc) && (!ADM.leadCh || chOf(e) === ADM.leadCh) && (!ADM.leadWho || (ADM.leadWho === '-' ? !e.assignedTo : ADM.leadWho === 'me' ? e.assignedTo === D.me.email : e.assignedTo === ADM.leadWho))
    && (!q || String(e.name || '').toLowerCase().includes(q) || (qd.length >= 3 && String(e.phone || '').replace(/\D/g, '').includes(qd)) || String(e.tripName || '').toLowerCase().includes(q)));
  const board = !missed && ADM.leadView === 'board';
  const list = board ? pre : pre.filter((e) => match(e, st));
  const team = (D.team || []).filter((u) => u.active);
  const sel = (attr, val, opts) => `<select class="in" style="width:auto" ${attr}>${opts.map(([v, l]) => `<option value="${esc(v)}" ${val === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  return `${missed ? '<p class="muted" style="max-width:72ch">People who entered their name and number in the booking form but didn\'t finish. A quick WhatsApp message brings many of them back.</p>' : ''}
  <div class="toolbar">${missed ? '' : `<div class="seg" role="group" aria-label="View"><button data-act="lead-view" data-v="list" aria-pressed="${!board}">${ic('list')} List</button><button data-act="lead-view" data-v="board" aria-pressed="${board}">${ic('grid')} Board</button></div>`}
    <input class="in" style="width:auto;min-width:200px;flex:1" type="search" placeholder="Search name, phone or trip" value="${esc(ADM.leadQ)}" data-lead-q aria-label="Search leads">
    ${sel('data-lead-ch aria-label="Lead from"', ADM.leadCh, [['', 'All sources'], ...Object.entries(LEAD_CH)])}
    ${sel('data-lead-who aria-label="Assigned to"', ADM.leadWho, [['', 'Everyone'], ['me', 'Assigned to me'], ['-', 'Unassigned'], ...team.map((u) => [u.email, u.name || u.email])])}
    ${missed ? '' : sel('data-lead-src aria-label="Type"', ADM.leadSrc, [['', 'All types'], ['manual', 'Added by team'], ['website', 'Enquiry form'], ['callback', 'Callback'], ['itinerary', 'Itinerary request']])}</div>
  ${board ? '' : `<div class="toolbar"><div class="chips">${filters.map(([k, l]) => `<button class="chip" data-act="lead-filter" data-s="${k}" aria-pressed="${st === k}">${l} <span class="num">(${pre.filter((e) => match(e, k)).length})</span></button>`).join('')}</div></div>`}
  ${board ? `<p class="hint">Drag a card to another column to change its status. On a phone, open the card and change the status there.</p><div class="kanban">${LEAD_ST.map(([k, l]) => { const col = list.filter((e) => e.status === k); return `<div class="kcol" data-drop="${k}"><div class="kcol-h"><b>${l}</b><span class="num">${col.length}</span></div>${col.slice(0, 150).map((e) => `<div class="kcard" draggable="${can('leads.edit')}" data-drag="${esc(e.id)}" data-act="open-lead" data-id="${esc(e.id)}"><b>${esc(e.name)}</b><div class="hint">${esc(e.tripName || 'General enquiry')}${e.date ? ' · ' + fmtD(e.date) : ''}</div><div class="hint">${esc(LEAD_CH[chOf(e)])}${e.assignedTo ? ' · ' + esc(memberName(e.assignedTo)) : ''}</div>${fuPill(e)}</div>`).join('') || '<div class="hint" style="padding:8px">Nothing here</div>'}</div>`; }).join('')}</div>`
  : `<div class="panel">${list.slice(0, 300).map(leadRow).join('') || `<div class="panel-b"><div class="notice"><h3>Nothing here</h3>${missed ? 'Unfinished bookings show up here.' : 'Website enquiries, callback requests and leads your team adds land here.'}</div></div>`}</div>`}`;
}
function vFollowups() {
  const t = todayS(), open = D.enquiries.filter((e) => isOpen(e) && e.followUp);
  const mine = (e) => !ADM.leadWho || (ADM.leadWho === 'me' ? e.assignedTo === D.me.email : ADM.leadWho === '-' ? !e.assignedTo : e.assignedTo === ADM.leadWho);
  const groups = [['Overdue', open.filter((e) => e.followUp < t)], ['Today', open.filter((e) => e.followUp === t)], ['Tomorrow', open.filter((e) => e.followUp === plusDays(1))], ['Later', open.filter((e) => e.followUp > plusDays(1))]].map(([l, g]) => [l, g.filter(mine).sort((a, b) => a.followUp.localeCompare(b.followUp))]);
  const noDate = D.enquiries.filter((e) => isOpen(e) && !e.followUp && e.source !== 'checkout' && mine(e)).length;
  const team = (D.team || []).filter((u) => u.active);
  return `<div class="toolbar"><p class="muted" style="flex:1;max-width:70ch">Leads with a follow-up date. Set a date when you open a lead, for example "call back on Friday". When you're done, change the status or set the next date.</p>
    <select class="in" style="width:auto" data-lead-who aria-label="Assigned to">${[['', 'Everyone'], ['me', 'Assigned to me'], ['-', 'Unassigned'], ...team.map((u) => [u.email, u.name || u.email])].map(([v, l]) => `<option value="${esc(v)}" ${ADM.leadWho === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
  ${groups.map(([l, g]) => g.length ? `<h3 class="grp-h">${l} <span class="num muted">(${g.length})</span></h3><div class="panel">${g.map(leadRow).join('')}</div>` : '').join('') || '<div class="panel"><div class="panel-b"><div class="notice"><h3>No follow-ups planned</h3>Open a lead and pick a follow-up date. It will show here and on the Overview on that day.</div></div></div>'}
  ${noDate ? `<p class="hint" style="margin-top:12px">${noDate} open lead${noDate > 1 ? 's have' : ' has'} no follow-up date. <a href="#leads">See them in Enquiries & leads</a>.</p>` : ''}`;
}
function vLeadReport() {
  const t = todayS(), per = ADM.repPeriod;
  const from = per === 'month' ? t.slice(0, 7) + '-01' : per === 'last' ? (() => { const d = parseISO(t.slice(0, 7) + '-01'); d.setMonth(d.getMonth() - 1); return isoOf(d); })() : per === '90' ? plusDays(-90) : '0000';
  const to = per === 'last' ? t.slice(0, 7) + '-01' : '9999';
  const inP = (ts) => { const d = isoOf(new Date(ts || 0)); return d >= from && d < to; };
  const leads = D.enquiries.filter((e) => inP(e.createdAt));
  const money = can('money.view');
  const rows = (groups) => groups.filter((g) => g.n).map((g) => `<tr><td><b>${esc(g.label)}</b></td><td class="r num">${g.n}</td><td class="r num">${g.open}</td><td class="r num">${g.won}</td><td class="r num">${g.n ? Math.round(g.won / g.n * 100) : 0}%</td>${g.extra !== undefined ? g.extra : ''}</tr>`).join('');
  const stat = (list) => ({ n: list.length, open: list.filter(isOpen).length, won: list.filter((e) => e.status === 'converted').length });
  const byCh = Object.entries(LEAD_CH).map(([k, l]) => ({ label: l, ...stat(leads.filter((e) => chOf(e) === k)) })).sort((a, b) => b.won - a.won || b.n - a.n);
  const team = D.team || [];
  const bks = (D.bookings || []).filter((b) => b.source === 'team' && b.status !== 'cancelled' && b.status !== 'awaiting_payment' && inP(b.createdAt));
  const byWho = team.map((u) => { const l = leads.filter((e) => e.addedBy === u.email || e.assignedTo === u.email); const mb = bks.filter((b) => b.addedBy === u.email || b.addedBy === u.name); return { label: u.name || u.email, ...stat(l), n: l.length || mb.length, extra: `<td class="r num">${mb.length}</td>${money ? `<td class="r num">${inr(mb.reduce((s, b) => s + (b.total || 0), 0))}</td>` : ''}` }; }).sort((a, b) => b.won - a.won || b.n - a.n);
  const all = stat(leads);
  return `<div class="toolbar"><div class="chips">${[['month', 'This month'], ['last', 'Last month'], ['90', 'Last 90 days'], ['all', 'All time']].map(([k, l]) => `<button class="chip" data-act="rep-period" data-p="${k}" aria-pressed="${per === k}">${l}</button>`).join('')}</div></div>
  <div class="stats"><div class="stat"><div class="k">Leads</div><div class="v">${all.n}</div></div><div class="stat"><div class="k">Still open</div><div class="v">${all.open}</div></div><div class="stat"><div class="k">Booked</div><div class="v">${all.won}</div><div class="s">${all.n ? Math.round(all.won / all.n * 100) : 0}% of leads</div></div></div>
  <div class="panel"><div class="panel-h"><h2>Where leads come from</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Source</th><th class="r">Leads</th><th class="r">Open</th><th class="r">Booked</th><th class="r">Conversion</th></tr></thead><tbody>${rows(byCh) || '<tr><td colspan="5" class="hint">No leads in this period.</td></tr>'}</tbody></table></div>
    <div class="panel-b hint">Website leads are counted as "Website". For leads your team adds, the source is what they pick in "Lead from".</div></div>
  <div class="panel"><div class="panel-h"><h2>By team member</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th class="r">Leads</th><th class="r">Open</th><th class="r">Booked</th><th class="r">Conversion</th><th class="r">Bookings they added</th>${money ? '<th class="r">Value</th>' : ''}</tr></thead><tbody>${rows(byWho) || `<tr><td colspan="${money ? 7 : 6}" class="hint">No team activity in this period.</td></tr>`}</tbody></table></div>
    <div class="panel-b hint">A lead counts for a person if they added it or it is assigned to them. "Bookings they added" are bookings entered in All bookings → Add booking. Useful for monthly incentives.</div></div>`;
}
function openLead(id) {
  const e = D.enquiries.find((x) => x.id === id); if (!e) return;
  const ed = can('leads.edit'), team = (D.team || []).filter((u) => u.active);
  const notes = [...(e.notes || [])].reverse();
  modal(`${esc(e.name)} ${statusPill(e.status)}`, `<dl class="kv"><dt>Phone</dt><dd><span class="num" style="user-select:all">${esc(e.phone)}</span>${e.email ? '<br>' + esc(e.email) : ''}</dd>
    <dt>Trip</dt><dd>${esc(e.tripName || 'General enquiry')}${e.date ? ' · ' + fmtD(e.date) : ''}${e.people ? ' · ' + Number(e.people) + ' people' : ''}</dd>
    <dt>Came in</dt><dd>${fmtTs(e.createdAt)} · ${srcPill(e.source)}${e.addedBy ? ' · added by ' + esc(memberName(e.addedBy)) : ''}</dd>${e.message ? `<dt>Message</dt><dd>${esc(e.message)}</dd>` : ''}${e.bookingId ? `<dt>Booking</dt><dd><button class="linkbtn" data-act="open-booking" data-id="${esc(e.bookingId)}">${esc(e.bookingId)}</button></dd>` : ''}</dl>
    ${ed ? `<div class="grid2"><div class="field"><label for="ld-status">Status</label><select class="in" id="ld-status" data-ld="status">${LEAD_ST.map(([v, l]) => `<option value="${v}" ${e.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="ld-assign">Assigned to</label><select class="in" id="ld-assign" data-ld="assignedTo"><option value="">Unassigned</option>${team.map((u) => `<option value="${esc(u.email)}" ${e.assignedTo === u.email ? 'selected' : ''}>${esc(u.name || u.email)}</option>`).join('')}</select></div>
      <div class="field"><label for="ld-ch">Lead from</label><select class="in" id="ld-ch" data-ld="channel">${Object.entries(LEAD_CH).map(([v, l]) => `<option value="${v}" ${chOf(e) === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="field"><label for="ld-trip">Trip</label><select class="in" id="ld-trip" data-ld="tripId"><option value="">General enquiry</option>${D.trips.map((t) => `<option value="${esc(t.id)}" ${e.tripId === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div></div>
    <div class="field"><label for="ld-fu">Follow up on</label><div class="toolbar"><input class="in" type="date" id="ld-fu" data-ld="followUp" value="${esc(e.followUp || '')}" style="width:auto">${[['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([l, n]) => `<button class="btn sm" data-act="ld-fu" data-id="${esc(e.id)}" data-v="${plusDays(n)}">${l}</button>`).join('')}${e.followUp ? `<button class="btn sm ghost" data-act="ld-fu" data-id="${esc(e.id)}" data-v="">Clear</button>` : ''}</div></div>
    <div class="field"><label for="ld-note">Add a note</label><div style="display:flex;gap:8px"><input class="in" id="ld-note" placeholder="e.g. Called, wants Hampi 14 Nov for 3 people. Call back Friday."><button class="btn" data-act="ld-note" data-id="${esc(e.id)}">Add</button></div></div>` : ''}
    <div class="field"><label>History</label>${notes.length || e.note ? `<ul class="timeline">${notes.map((n) => `<li class="${n.auto ? 'auto' : ''}"><span class="hint">${fmtTs(n.at)}${n.by ? ' · ' + esc(memberName(n.by)) : ''}</span><div>${esc(n.text)}</div></li>`).join('')}${e.note ? `<li><span class="hint">Earlier note</span><div>${esc(e.note)}</div></li>` : ''}</ul>` : '<p class="hint">No notes yet.</p>'}</div>`,
    `<a class="btn primary" href="${leadWa(e)}" target="_blank" rel="noopener">${ic('wa')} WhatsApp</a><a class="btn" href="tel:${esc(String(e.phone || '').replace(/[^\d+]/g, ''))}">${ic('phone')} Call</a>${ed && can('bookings.edit') && e.status !== 'converted' ? `<button class="btn" data-act="ld-book" data-id="${esc(e.id)}">${ic('ticket')} Make booking</button>` : ''}<button class="btn" data-act="m-close">Close</button>`, true);
  $('#modal-root').dataset.lead = id;
}
function addLeadModal() {
  const team = (D.team || []).filter((u) => u.active);
  modal('Add a lead', `<p class="hint">For enquiries that came on WhatsApp, calls, Instagram DMs or from friends.</p>
    <form data-form="add-lead" style="display:grid;gap:12px" id="al-form">
    <div class="grid2"><div class="field"><label for="al-name">Name</label><input class="in" id="al-name" name="name" required></div><div class="field"><label for="al-phone">Phone</label><input class="in" id="al-phone" name="phone" inputmode="tel" required data-dup-check></div></div>
    <div id="al-dup"></div>
    <div class="grid2"><div class="field"><label for="al-ch">Lead from</label><select class="in" id="al-ch" name="channel">${Object.entries(LEAD_CH).filter(([k]) => k !== 'website').map(([v, l]) => `<option value="${v}" ${v === 'whatsapp' ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="field"><label for="al-trip">Interested in</label><select class="in" id="al-trip" name="tripId"><option value="">Not sure yet</option>${D.trips.filter((t) => t.status === 'live').map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></div></div>
    <div class="grid2"><div class="field"><label for="al-date">Travel date (if known)</label><input class="in" id="al-date" name="date" type="date"></div><div class="field"><label for="al-people">People</label><input class="in" id="al-people" name="people" type="number" min="1" value="1"></div></div>
    <div class="grid2"><div class="field"><label for="al-assign">Assign to</label><select class="in" id="al-assign" name="assignedTo"><option value="">Unassigned</option>${team.map((u) => `<option value="${esc(u.email)}" ${u.email === D.me.email ? 'selected' : ''}>${esc(u.name || u.email)}</option>`).join('')}</select></div>
      <div class="field"><label for="al-fu">Follow up on</label><input class="in" id="al-fu" name="followUp" type="date" value="${plusDays(1)}"></div></div>
    <div class="field"><label for="al-status">Status</label><select class="in" id="al-status" name="status">${LEAD_ST.filter(([v]) => v !== 'converted').map(([v, l]) => `<option value="${v}" ${v === 'contacted' ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="al-note">Note</label><textarea class="in" id="al-note" name="note" rows="2" placeholder="What did they ask?"></textarea></div></form>`,
    `<button class="btn" data-act="m-close">Cancel</button><button class="btn primary" type="submit" form="al-form">Add lead</button>`);
}

/* ================= bookings ================= */
function vBookings() {
  const trips = [...new Set(D.bookings.map((b) => b.tripId))].map((id) => tripById(id) || { id, name: (D.bookings.find((b) => b.tripId === id) || {}).tripName });
  return `<div class="toolbar"><div class="search">${ic('search')}<input class="in" id="bk-q" type="search" placeholder="Search name, phone or booking ID" autocomplete="off"></div>
    <select class="in" style="width:auto" data-bkf="bkTrip" aria-label="Trip"><option value="">All trips</option>${trips.map((t) => `<option value="${esc(t.id)}" ${ADM.bkTrip === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
    <select class="in" style="width:auto" data-bkf="bkStatus" aria-label="Status"><option value="">Any status</option>${[['pending', 'Payment pending'], ['confirmed', 'Confirmed'], ['awaiting_payment', 'Payment not completed'], ['cancelled', 'Cancelled']].map(([v, l]) => `<option value="${v}" ${ADM.bkStatus === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <select class="in" style="width:auto" data-bkf="bkWhen" aria-label="When"><option value="upcoming" ${ADM.bkWhen === 'upcoming' ? 'selected' : ''}>Upcoming trips</option><option value="past" ${ADM.bkWhen === 'past' ? 'selected' : ''}>Past trips</option><option value="all" ${ADM.bkWhen === 'all' ? 'selected' : ''}>All</option></select></div>
    <div class="panel"><div class="tbl-wrap" id="bk-table"></div></div>`;
}
function filteredBookings() {
  const q = ADM.bkQ.trim().toLowerCase(), now = today();
  return D.bookings.filter((b) => (!ADM.bkTrip || b.tripId === ADM.bkTrip) && (!ADM.bkStatus || b.status === ADM.bkStatus)
    && (ADM.bkWhen === 'all' || (ADM.bkWhen === 'upcoming' ? (b.slotDate || '') >= now : (b.slotDate || '') < now))
    && (!q || [b.name, b.phone, b.id, b.tripName].join(' ').toLowerCase().includes(q)));
}
function renderBkTable() {
  const box = $('#bk-table'); if (!box) return;
  const list = filteredBookings(), money = can('money.view');
  const tot = list.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  box.innerHTML = list.length ? `<table class="tbl"><thead><tr><th>Booking</th><th>Traveller</th><th>Trip & date</th><th class="r">People</th>${money ? '<th class="r">Total</th><th class="r">Paid</th>' : ''}<th>Status</th></tr></thead><tbody>
    ${list.slice(0, 500).map((b) => `<tr class="click" data-act="open-booking" data-id="${esc(b.id)}"><td><b class="mono">${esc(b.id)}</b><div class="hint">${fmtTs(b.createdAt)}${b.source === 'team' ? ' · by team' : ''}</div></td><td><b>${esc(b.name)}</b><div class="hint num">${esc(b.phone)}</div></td><td>${esc(b.tripName)}<div class="hint">${fmtD(b.slotDate)}</div></td><td class="r num">${Number(b.people) || 0}</td>
      ${money ? `<td class="r num">${inr(b.total)}</td><td class="r num">${inr(b.paid)}${(b.total || 0) - (b.paid || 0) > 0 && b.status !== 'cancelled' && b.status !== 'awaiting_payment' ? `<div class="hint" style="color:var(--warn)">${inr((b.total || 0) - (b.paid || 0))} due</div>` : ''}</td>` : ''}<td>${statusPill(b.status)}</td></tr>`).join('')}
    </tbody>${money ? `<tfoot><tr><td colspan="3" class="hint">${list.length} bookings · totals exclude cancelled and unfinished payments</td><td class="r num"><b>${tot.reduce((s, b) => s + (Number(b.people) || 0), 0)}</b></td><td class="r num"><b>${inr(tot.reduce((s, b) => s + (b.total || 0), 0))}</b></td><td class="r num"><b>${inr(tot.reduce((s, b) => s + (b.paid || 0), 0))}</b></td><td></td></tr></tfoot>` : ''}</table>`
    : '<div class="panel-b"><div class="notice"><h3>No bookings match</h3>Change the filters, or choose "All".</div></div>';
}
function modal(title, body, foot, wide) {
  $('#modal-root').innerHTML = `<div class="modal-back" data-act="m-backdrop"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-h"><h3>${title}</h3><button class="iconbtn" data-act="m-close" aria-label="Close">${ic('x')}</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div></div>`;
}
const closeModal = () => { $('#modal-root').innerHTML = ''; };
function openBooking(id) {
  const b = D.bookings.find((x) => x.id === id); if (!b) return;
  const money = can('money.view'), due = Math.max(0, (b.total || 0) - (b.paid || 0));
  modal(`Booking <span class="mono">${esc(b.id)}</span>`, `<dl class="kv"><dt>Traveller</dt><dd><b>${esc(b.name)}</b><br><span class="num" style="user-select:all">${esc(b.phone)}</span>${b.email ? '<br>' + esc(b.email) : ''}</dd>
    <dt>Trip</dt><dd>${esc(b.tripName)}<br>${fmtDY(b.slotDate)}</dd><dt>Seats</dt><dd>${(b.items || []).map((i) => `${esc(i.name)} × ${Number(i.qty)}`).join('<br>')} (${Number(b.people)} people)</dd>
${b.pickup ? `<dt>Pickup</dt><dd>${esc(b.pickup)}</dd>` : ''}${b.note ? `<dt>Note</dt><dd>${esc(b.note)}</dd>` : ''}
    <dt>Travellers</dt><dd><table class="paxlist"><tbody>${travOf(b).map((t, i) => `<tr><td>${i + 1}</td><td>${esc(t.name)}</td><td>${esc(t.gender || '—')}</td><td>${t.age ? esc(t.age) + ' yrs' : '—'}</td></tr>`).join('')}</tbody></table></dd>
    <dt>Booked</dt><dd>${fmtTs(b.createdAt)} · ${b.source === 'team' ? 'added by ' + esc(b.addedBy || 'team') : 'website'}${money ? ' · ' + (b.plan === 'upi' ? 'UPI transfer' : b.plan === 'full' ? 'full online' : b.plan === 'advance' ? 'advance online' : 'offline') : ''}${b.coupon ? ' · coupon ' + esc(b.coupon) : ''}</dd></dl>
    ${money ? `<div class="sum"><div><span>Total</span><span class="num">${inr(b.total)}</span></div><div><span>Paid</span><span class="num">${inr(b.paid)}</span></div><div class="tot"><span>Balance due</span><span class="num">${inr(due)}</span></div></div>
    ${(b.payments || []).length ? `<div class="hint">${b.payments.map((p) => `${inr(p.amount)} · ${esc(p.via)} · ${fmtTs(p.at)}`).join('<br>')}</div>` : ''}` : ''}
    ${can('bookings.edit') ? `<div class="grid2">${money ? `<div class="field"><label for="bk-pay">Record a payment (₹)</label><div style="display:flex;gap:8px"><input class="in" id="bk-pay" type="number" min="0" value="${due}"><button class="btn" data-act="bk-record" data-id="${esc(b.id)}">Add</button></div></div>` : ''}
      <div class="field"><label for="bk-status">Status</label><select class="in" id="bk-status" data-bk-status="${esc(b.id)}">${[['pending', 'Payment pending'], ['confirmed', 'Confirmed'], ['awaiting_payment', 'Payment not completed'], ['cancelled', 'Cancelled']].map(([v, l]) => `<option value="${v}" ${b.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="field"><label for="bk-note">Team note</label><div style="display:flex;gap:8px"><input class="in" id="bk-note" value="${esc(b.note || '')}"><button class="btn" data-act="bk-note" data-id="${esc(b.id)}">Save</button></div></div>` : ''}`,
    `<a class="btn primary" href="${waLink(`Hi ${b.name}, your Adventure Buddha booking ${b.id} for ${b.tripName} on ${fmtD(b.slotDate)}${money && due ? ` has a balance of ${inr(due)}. Please pay to ${S().upi}.` : ' is confirmed. See you soon!'}`, b.phone)}" target="_blank" rel="noopener">${ic('wa')} WhatsApp ${money && due ? 'payment reminder' : 'confirmation'}</a><button class="btn" data-act="m-close">Close</button>`);
}
function addBookingModal() {
  const trips = D.trips.filter((t) => t.mode !== 'enquire');
  modal('Add a booking', `<p class="hint">For bookings that came on WhatsApp or by phone. Seats are counted like website bookings.</p>
    <form data-form="add-booking" style="display:grid;gap:12px" id="ab-form">
    <div class="field"><label for="ab-trip">Trip</label><select class="in" id="ab-trip" name="tripId" required>${trips.map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></div>
    <div class="grid2"><div class="field"><label for="ab-date">Departure date</label><select class="in" id="ab-date" name="slotDate" required></select></div><div class="field"><label for="ab-people">People</label><input class="in" id="ab-people" name="people" type="number" min="1" value="1" required></div></div>
    <div class="grid2"><div class="field"><label for="ab-name">Name</label><input class="in" id="ab-name" name="name" required></div><div class="field"><label for="ab-phone">Phone</label><input class="in" id="ab-phone" name="phone" inputmode="tel" required></div></div>
    <div class="grid2"><div class="field"><label for="ab-total">Total amount (₹)</label><input class="in" id="ab-total" name="total" type="number" min="0" required></div><div class="field"><label for="ab-paid">Paid so far (₹)</label><input class="in" id="ab-paid" name="paid" type="number" min="0" value="0"></div></div>
    <div class="field"><label for="ab-pickup">Pickup point</label><input class="in" id="ab-pickup" name="pickup"></div>
    <div class="field"><label for="ab-others">Other travellers</label><textarea class="in" id="ab-others" name="others" rows="3" placeholder="One per line: Name, Gender, Age&#10;e.g. Priya Sharma, F, 26"></textarea></div>
    <div class="field"><label for="ab-note">Note</label><input class="in" id="ab-note" name="note"></div></form>`,
    `<button class="btn" data-act="m-close">Cancel</button><button class="btn primary" type="submit" form="ab-form">Add booking</button>`);
  const fillDates = () => { const t = tripById($('#ab-trip').value); $('#ab-date').innerHTML = (t ? upcoming(t) : []).map((s) => `<option value="${s.date}">${fmtD(s.date)} · ${Math.max(0, (Number(s.seats) || 0) - booked(t.id, s.date))} left</option>`).join('') || '<option value="">No upcoming dates</option>';
    const p = t && ticketsOf(t)[0]; if (p) $('#ab-total').value = withGst(p.price, t) * (Number($('#ab-people').value) || 1); };
  $('#ab-trip').addEventListener('change', fillDates); $('#ab-people').addEventListener('input', fillDates); fillDates();
}
function exportBookings() {
  const rows = [['Booking ID', 'Booked on', 'Name', 'Phone', 'Email', 'Trip', 'Departure', 'People', 'Pickup', 'Total', 'Paid', 'Due', 'Status', 'Travellers (name gender age)', 'Note']];
  filteredBookings().forEach((b) => rows.push([b.id, fmtTs(b.createdAt), b.name, b.phone, b.email, b.tripName, b.slotDate, b.people, b.pickup, b.total, b.paid, (b.total || 0) - (b.paid || 0), b.status, travOf(b).map((t) => [t.name, gShort(t.gender), t.age].filter(Boolean).join(' ')).join('; '), b.note || '']));
  downloadCsv(rows, 'bookings-' + today() + '.csv');
}
function downloadCsv(rows, name) {
  const csv = '﻿' + rows.map((r) => r.map((v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

/* ================= passenger lists ================= */
function vDepartures() {
  const now = today(); const deps = [];
  D.trips.forEach((t) => (t.slots || []).forEach((s) => deps.push({ t, s })));
  deps.sort((a, b) => a.s.date.localeCompare(b.s.date));
  const upcomingDeps = deps.filter((d) => d.s.date >= addDays(now, -14));
  if (!ADM.depTrip && upcomingDeps[0]) { ADM.depTrip = upcomingDeps.find((d) => d.s.date >= now)?.t.id || upcomingDeps[0].t.id; ADM.depDate = upcomingDeps.find((d) => d.s.date >= now)?.s.date || upcomingDeps[0].s.date; }
  const t = tripById(ADM.depTrip);
  const list = D.bookings.filter((b) => b.tripId === ADM.depTrip && b.slotDate === ADM.depDate && (b.status === 'confirmed' || b.status === 'pending'));
  const money = can('money.view');
  const rows = []; list.forEach((b) => travOf(b).forEach((tr, i) => rows.push({ b, tr, lead: i === 0 })));
  const male = rows.filter((r) => r.tr.gender === 'Male').length, female = rows.filter((r) => r.tr.gender === 'Female').length;
  return `<div class="toolbar no-print"><select class="in" style="width:auto;max-width:100%" data-dep-pick aria-label="Departure">${upcomingDeps.map(({ t, s }) => `<option value="${esc(t.id)}|${s.date}" ${t.id === ADM.depTrip && s.date === ADM.depDate ? 'selected' : ''}>${fmtD(s.date)} · ${esc(t.name)} (${booked(t.id, s.date)}/${s.seats})</option>`).join('')}</select>
    ${list.length ? `<button class="btn sm" data-act="dep-csv">${ic('download')} Download list</button>` : ''}</div>
  ${t ? `<div class="panel"><div class="panel-h"><h2>${esc(t.name)} · ${fmtDY(ADM.depDate)}</h2><span class="hint">${rows.length} travellers · ${male} male · ${female} female · ${list.length} bookings${t.tripLead ? ' · Trip lead: ' + esc(t.tripLead) : ''}</span></div>
    <div class="tbl-wrap"><table class="paxlist"><thead><tr><th>#</th><th>Traveller</th><th>Gender</th><th>Age</th><th>Booked by</th><th>Phone</th><th>Pickup</th>${money ? '<th>Balance</th>' : ''}<th>Status</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.tr.name)}</b></td><td>${esc(gShort(r.tr.gender))}</td><td class="num">${esc(r.tr.age)}</td><td>${r.lead ? esc(r.b.name) + `<div class="hint mono">${esc(r.b.id)}</div>` : '<span class="hint">same booking</span>'}</td><td class="num">${r.lead ? esc(r.b.phone) : ''}</td><td>${r.lead ? esc(r.b.pickup || '') : ''}</td>${money ? `<td class="num">${r.lead ? inr(Math.max(0, (r.b.total || 0) - (r.b.paid || 0))) : ''}</td>` : ''}<td>${r.lead ? (r.b.status === 'confirmed' ? 'Confirmed' : 'Pending') : ''}</td></tr>`).join('') || `<tr><td colspan="9" class="muted">No bookings yet for this departure.</td></tr>`}
    </tbody></table></div></div>` : '<div class="notice"><h3>No departures yet</h3>Add dates to a trip first.</div>'}`;
}

/* ================= customers ================= */
function vCustomers() {
  const map = {};
  D.bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').forEach((b) => { const k = String(b.phone || '').replace(/\D/g, '').slice(-10) || b.name; const c = map[k] || (map[k] = { name: b.name, phone: b.phone, trips: 0, spent: 0, last: '' }); c.trips++; c.spent += b.total || 0; if ((b.slotDate || '') > c.last) { c.last = b.slotDate; c.lastTrip = b.tripName; } });
  const list = Object.values(map).sort((a, b) => b.trips - a.trips || b.spent - a.spent);
  return `<div class="toolbar"><p class="muted" style="flex:1">Everyone who booked, combined by phone number. Repeat travellers are your best audience for new trips.</p>${list.length ? `<button class="btn sm" data-act="cust-csv">${ic('download')} Download</button>` : ''}</div>
  <div class="panel"><div class="tbl-wrap">${list.length ? `<table class="tbl"><thead><tr><th>Name</th><th>Phone</th><th class="r">Trips</th><th class="r">Spent</th><th>Last trip</th><th></th></tr></thead><tbody>${list.map((c) => `<tr><td><b>${esc(c.name)}</b>${c.trips > 1 ? ' <span class="pill good">Repeat</span>' : ''}</td><td class="num" style="user-select:all">${esc(c.phone)}</td><td class="r num">${c.trips}</td><td class="r num">${inr(c.spent)}</td><td>${esc(c.lastTrip || '')}<div class="hint">${fmtD(c.last)}</div></td><td><a class="iconbtn" href="${waLink('Hi ' + c.name + '! ', c.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic('wa')}</a></td></tr>`).join('')}</tbody></table>` : '<div class="panel-b"><div class="notice"><h3>No customers yet</h3>Customers appear after their first booking.</div></div>'}</div></div>`;
}

/* ================= coupons ================= */
function vCoupons() {
  return `<div class="panel"><div class="panel-h"><h2>Create a coupon</h2></div><div class="panel-b"><form data-form="coupon" class="toolbar" style="align-items:end">
    <div class="field"><label for="cp-code">Code</label><input class="in" id="cp-code" name="code" required placeholder="MONSOON500" style="text-transform:uppercase"></div>
    <div class="field"><label for="cp-type">Discount</label><select class="in" id="cp-type" name="type"><option value="flat">₹ off per person</option><option value="pct">% off</option></select></div>
    <div class="field"><label for="cp-val">Amount</label><input class="in" id="cp-val" name="value" type="number" min="1" required style="width:120px"></div>
    <button class="btn primary" type="submit">Create coupon</button></form><p class="hint" style="margin-top:8px">Discounts apply before GST.</p></div></div>
  <div class="panel"><div class="tbl-wrap">${D.coupons.length ? `<table class="tbl"><thead><tr><th>Code</th><th>Discount</th><th class="r">Used</th><th>Status</th><th></th></tr></thead><tbody>${D.coupons.map((c) => `<tr><td><b class="mono">${esc(c.code)}</b></td><td>${c.type === 'pct' ? Number(c.value) + '% off' : inr(c.value) + ' off per person'}</td><td class="r num">${D.bookings.filter((b) => b.coupon === c.code).length}</td><td><label class="tog"><input type="checkbox" data-coupon-active="${esc(c.code)}" ${c.active !== false ? 'checked' : ''}>${c.active !== false ? 'Active' : 'Paused'}</label></td><td><button class="iconbtn" data-act="del-coupon" data-id="${esc(c.code)}" aria-label="Delete coupon">${ic('trash')}</button></td></tr>`).join('')}</tbody></table>` : '<div class="panel-b muted">No coupons yet.</div>'}</div></div>`;
}

/* ================= website settings ================= */
function vSite() {
  if (!SITE) SITE = JSON.parse(JSON.stringify(S()));
  const f = (k, label, attrs = '', hint = '') => fld(label, `<input class="in" data-site="${k}" value="${esc(SITE[k] ?? '')}" ${attrs}>`, hint);
  const ta = (k, label, rows = 3) => fld(label, `<textarea class="in" data-site="${k}" rows="${rows}">${esc(SITE[k] ?? '')}</textarea>`);
  const extImgs = externalImages().length;
  return `<div class="panel"><div class="panel-b ed-form">
    <p class="hint">Cover photos, headline, home page sections and "Why choose us" are in <a href="#home">Home page</a>.</p>
    <div class="ed-group"><h3>Google reviews</h3><div class="grid3">${f('googleRating', 'Google rating', 'placeholder="4.9"')}${f('googleReviewCount', 'Number of reviews', 'placeholder="1,200"')}${f('googleReviewsUrl', 'Link to your Google reviews', 'placeholder="https://g.page/…"')}</div>
      <p class="hint">Add a few real reviews below (copy them from Google). They show on the home page.</p>
      ${(SITE.reviews || []).map((r, i) => `<div class="faq-row"><div class="grid3"><input class="in" data-site-rev="${i}" data-k="name" value="${esc(r.name)}" placeholder="Name"><input class="in" data-site-rev="${i}" data-k="trip" value="${esc(r.trip)}" placeholder="Trip"><div style="display:flex;gap:6px"><input class="in" data-site-rev="${i}" data-k="date" value="${esc(r.date)}" placeholder="Month year"><select class="in" data-site-rev="${i}" data-k="rating" style="width:80px">${[5, 4, 3].map((n) => `<option ${Number(r.rating) === n ? 'selected' : ''}>${n}</option>`).join('')}</select><button class="iconbtn" data-act="rev-del" data-i="${i}" aria-label="Delete review">${ic('trash')}</button></div></div><textarea class="in" data-site-rev="${i}" data-k="text" rows="2" placeholder="What they said">${esc(r.text)}</textarea></div>`).join('')}
      <div><button class="btn sm" data-act="rev-add">${ic('plus')} Add a review</button></div></div>
    <div class="ed-group"><h3>Contact</h3><div class="grid2">${f('phones', 'Phone numbers shown')}${f('callNumber', 'Number for the Call button (with 91)', 'inputmode="tel"')}${f('whatsapp', 'WhatsApp number (with 91)', 'inputmode="tel"')}${f('email', 'Email')}${f('upi', 'Main UPI ID')}${f('advancePct', 'Default advance %', 'type="number" min="0" max="100"')}</div>${f('address', 'Office address')}</div>
    <div class="ed-group"><h3>Social links</h3><div class="grid3">${f('instagram', 'Instagram')}${f('facebook', 'Facebook')}${f('youtube', 'YouTube')}${f('twitter', 'X (Twitter)')}${f('linkedin', 'LinkedIn')}${f('googleBusiness', 'Google Business page')}</div><p class="hint">Filled links show in the website footer and tell Google these pages are yours.</p></div>
    <div class="ed-group"><h3>Top menu links</h3><p class="hint">The links across the top of every page. Tip: open a page on your website and copy its address, or start with / for your own pages (like /tours/ or /p/about-us).</p>${linkRows('menu')}</div>
    <div class="ed-group"><h3>Footer links</h3>${linkRows('footerLinks')}</div>
    <div class="ed-group"><h3>Brand</h3><div class="grid2">${f('brand', 'Business name')}<div class="field"><label>Logo</label><div class="toolbar">${SITE.logo ? `<img src="${esc(SITE.logo)}" alt="" style="height:44px;width:auto;border-radius:6px;background:#fff">` : ''}${upBtn('site:logo')}</div></div><div class="field"><label>Favicon (the small icon in the browser tab)</label><div class="toolbar">${SITE.favicon ? `<img src="${esc(SITE.favicon)}" alt="" style="width:32px;height:32px;border-radius:6px;object-fit:cover">` : '<span class="hint">Uses your logo</span>'}${upBtn('site:favicon')}${SITE.favicon ? `<button class="btn sm ghost" data-act="sl-clear" data-k="favicon">Use logo</button>` : ''}</div><span class="hint">A square image works best.</span></div></div></div>
    <div class="ed-group"><h3>Default pickup points</h3><p class="hint">Used for every trip that doesn't have its own pickup points. Customers must pick one when booking.</p>
      ${(SITE.pickups || []).map((x, i) => `<div class="arow pk-row"><div class="field grow"><label>Place</label><input class="in" data-site-pick="${i}" data-k="place" value="${esc(x.place)}"></div><div class="field"><label>Time</label><input class="in" data-site-pick="${i}" data-k="time" value="${esc(x.time)}" placeholder="8:30 PM"></div><button class="iconbtn" data-act="pick-del" data-i="${i}" aria-label="Remove">${ic('trash')}</button></div>`).join('')}
      <div><button class="btn sm" data-act="pick-add">${ic('plus')} Add pickup point</button></div></div>
    <p class="hint">About us, terms, cancellation, privacy and category pages are edited in <a href="#pages">Pages & policies</a>.</p>
    <div class="ed-group"><h3>Photos stored on other websites</h3><p class="hint">${extImgs ? `${extImgs} photos still load from TravStack or other sites. Copy them into your own website before you cancel TravStack, or they will disappear.` : 'All photos are stored on your own website.'}</p>${extImgs ? `<div><button class="btn sm" data-act="import-images">${ic('download')} Copy ${extImgs} photos into my website</button></div>` : ''}</div>
    <div><button class="btn primary" data-act="save-site">Save changes</button></div>
  </div></div>`;
}
const linkRows = (k) => `${(SITE[k] || []).map((l, i, arr) => `<div class="arow lk-row"><div class="field grow"><label>Label</label><input class="in" data-sl="${k}.${i}.label" value="${esc(l.label)}"></div><div class="field grow"><label>Link</label><input class="in" data-sl="${k}.${i}.url" value="${esc(l.url)}" placeholder="/tours/ or https://…"></div><button class="iconbtn" data-act="sl-move" data-list="${k}" data-i="${i}" data-d="-1" aria-label="Move up" ${i ? '' : 'disabled'}>${ic('up')}</button><button class="iconbtn" data-act="sl-move" data-list="${k}" data-i="${i}" data-d="1" aria-label="Move down" ${i < arr.length - 1 ? '' : 'disabled'}>${ic('down')}</button><button class="iconbtn" data-act="sl-del" data-list="${k}" data-i="${i}" aria-label="Remove">${ic('trash')}</button></div>`).join('')}<div><button class="btn sm" data-act="sl-add" data-list="${k}">${ic('plus')} Add link</button></div>`;
const SEC_NAMES = { ticker: ['Scrolling strip', 'Your numbers and trust points on a saffron strip'], upcoming: ['Upcoming trips', 'All trips with month buttons (OCT, NOV…)'], vibes: ["What's your vibe? tiles", 'One colourful photo tile per trip category'], why: ['Why choose us', 'The coloured cards you edit below'], steps: ['How it works (1-2-3)', 'Choose, pay to book, show up'], moments: ['Trip photos', 'The photos you add below'], reviews: ['Reviews', 'Your Google reviews (add them in Website settings)'], callback: ['Callback form', 'Saffron band with a "call me back" form'], category: ['Trips from one category', 'A row of trips, like "Weekend trips from Bangalore"'], text: ['Text block', 'Your own heading and text'] };
const WHY_ICONS = ['guide', 'transport', 'shield', 'check', 'pin', 'wa', 'users', 'meals', 'stay', 'fire', 'trek', 'camera', 'star', 'cal', 'clock'];
function vHome() {
  if (!SITE) SITE = JSON.parse(JSON.stringify(S()));
  const f = (k, label, attrs = '', hint = '') => fld(label, `<input class="in" data-site="${k}" value="${esc(SITE[k] ?? '')}" ${attrs}>`, hint);
  const slides = SITE.heroSlides || [], secs = SITE.homeSections || [], why = SITE.whyItems || [], mom = SITE.moments || [];
  const mv = (list, i, n) => `<button class="iconbtn" data-act="sl-move" data-list="${list}" data-i="${i}" data-d="-1" aria-label="Move up" ${i ? '' : 'disabled'}>${ic('up')}</button><button class="iconbtn" data-act="sl-move" data-list="${list}" data-i="${i}" data-d="1" aria-label="Move down" ${i < n - 1 ? '' : 'disabled'}>${ic('down')}</button>`;
  return `<div class="panel"><div class="panel-h"><h2>Cover photos</h2></div><div class="panel-b ed-form">
    <p class="hint">The big photos at the top of the home page. With more than one, they change every 5 seconds. Wide, bright group photos look best. A caption with a link shows as a small button on that photo (for example "Weekend trips from Bangalore").</p>
    ${slides.length ? `<div class="slide-grid">${slides.map((x, i) => `<div class="slide-card"><div class="im"><img src="${esc(x.url)}" alt="">${i === 0 ? '<span class="pill good">First</span>' : ''}</div>
      <input class="in" data-sl="heroSlides.${i}.caption" value="${esc(x.caption)}" placeholder="Caption (optional)"><input class="in" data-sl="heroSlides.${i}.link" value="${esc(x.link)}" placeholder="Link, like /tours/ (optional)">
      <div class="toolbar">${mv('heroSlides', i, slides.length)}<button class="iconbtn" data-act="sl-del" data-list="heroSlides" data-i="${i}" aria-label="Remove photo">${ic('trash')}</button></div></div>`).join('')}</div>`
    : `<div class="cover-pick"><div class="im">${SITE.heroImage ? `<img src="${esc(SITE.heroImage)}" alt="">` : ''}</div><p class="hint">Right now the home page shows this one photo. Upload photos below to make a slideshow.</p></div>`}
    <div class="toolbar"><label class="btn sm primary" style="cursor:pointer">${ic('upload')} Upload cover photos<input type="file" accept="image/*" multiple data-upload="slides" hidden></label></div>
  </div></div>
  <div class="panel"><div class="panel-h"><h2>Headline</h2></div><div class="panel-b ed-form">
    ${f('heroTitle', 'Main headline', '', 'The last part of the headline shows in saffron.')}${fld('Line under the headline', `<textarea class="in" data-site="heroText" rows="2">${esc(SITE.heroText || '')}</textarea>`)}
    ${f('tagline', 'Small badge above the headline', '', 'Shown until you add your Google rating in Website settings; then the rating shows there instead.')}
    <div class="grid3">${(SITE.stats || []).map((x, i) => fld('Number ' + (i + 1), `<div style="display:flex;gap:6px"><input class="in" data-site-stat="${i}" data-k="v" value="${esc(x.v)}" style="width:90px"><input class="in" data-site-stat="${i}" data-k="k" value="${esc(x.k)}"></div>`)).join('')}</div>
    ${fld('Scrolling strip points (one per line)', `<textarea class="in" data-site-lines="trust" rows="4">${esc((SITE.trust || []).join('\n'))}</textarea>`, 'Shown on the saffron strip after your numbers.')}
  </div></div>
  <div class="panel"><div class="panel-h"><h2>Home page sections</h2><span class="toolbar"><button class="btn sm" data-act="sec-add" data-type="category">${ic('plus')} Trips from a category</button><button class="btn sm" data-act="sec-add" data-type="text">${ic('plus')} Text block</button></span></div><div class="panel-b ed-form">
    <p class="hint">Sections appear on the home page in this order. Untick a section to hide it. In headings, put *stars* around words to show them in saffron.</p>
    ${secs.map((x, i) => { const nm = SEC_NAMES[x.type] || [x.type, '']; const custom = x.type === 'category' || x.type === 'text'; return `<div class="secbox ${x.on === false ? 'off' : ''}"><div class="secbox-h"><label class="tog"><input type="checkbox" data-sec-on="${i}" ${x.on !== false ? 'checked' : ''}>${x.on !== false ? 'Shown' : 'Hidden'}</label><div style="flex:1;min-width:0"><b>${esc(nm[0])}</b><div class="hint">${esc(nm[1])}</div></div>${mv('homeSections', i, secs.length)}${custom ? `<button class="iconbtn" data-act="sl-del" data-list="homeSections" data-i="${i}" aria-label="Remove section">${ic('trash')}</button>` : ''}</div>
      ${x.type === 'ticker' ? '' : `<div class="panel-b ed-form" style="gap:10px">
        ${x.type === 'category' ? fld('Category', `<select class="in" data-sl="homeSections.${i}.cat">${(SITE.categories || []).map((c) => `<option value="${esc(c.id)}" ${c.id === x.cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`) : ''}
        <div class="grid2">${fld('Heading', `<input class="in" data-sl="homeSections.${i}.title" value="${esc(x.title || '')}" ${x.type === 'category' ? 'placeholder="Weekend trips from Bangalore"' : ''}>`)}${fld('Line under the heading', `<input class="in" data-sl="homeSections.${i}.sub" value="${esc(x.sub || '')}" placeholder="Optional">`)}</div>
        ${x.type === 'text' ? `<div class="secbox">${rteBar()}<div class="rte rich" contenteditable="true" data-sec-rte="${i}" data-ph="Write here…" style="min-height:100px">${x.body || ''}</div></div>` : ''}
      </div>`}</div>`; }).join('')}
  </div></div>
  <div class="panel"><div class="panel-h"><h2>Why choose us cards</h2><button class="btn sm" data-act="sl-add" data-list="whyItems" ${why.length >= 9 ? 'disabled' : ''}>${ic('plus')} Add card</button></div><div class="panel-b ed-form">
    ${why.map((w, i) => `<div class="arow why-row"><div class="field"><label>Icon</label><div class="icon-pick">${WHY_ICONS.map((n) => `<button class="${w.icon === n ? 'on' : ''}" data-act="why-icon" data-i="${i}" data-n="${n}" aria-label="${n}">${ic(n)}</button>`).join('')}</div></div>
      <div class="field grow"><label>Title</label><input class="in" data-sl="whyItems.${i}.title" value="${esc(w.title)}"><label style="margin-top:6px">Text</label><textarea class="in" data-sl="whyItems.${i}.text" rows="2">${esc(w.text)}</textarea></div>
      <div class="toolbar" style="flex-direction:column">${mv('whyItems', i, why.length)}<button class="iconbtn" data-act="sl-del" data-list="whyItems" data-i="${i}" aria-label="Remove card">${ic('trash')}</button></div></div>`).join('')}
  </div></div>
  <div class="panel"><div class="panel-h"><h2>Trip photos</h2><label class="btn sm primary" style="cursor:pointer">${ic('upload')} Upload photos<input type="file" accept="image/*" multiple data-upload="moments" hidden></label></div><div class="panel-b ed-form">
    <p class="hint">Group photos from recent trips (up to 12). The first one shows bigger. ${mom.length ? '' : 'Until you add some, photos from your trip galleries are used.'}</p>
    ${mom.length ? `<div class="mom-grid">${mom.map((u, i) => `<div><img src="${esc(u)}" alt=""><span class="toolbar">${mv('moments', i, mom.length)}<button class="iconbtn" data-act="sl-del" data-list="moments" data-i="${i}" aria-label="Remove photo">${ic('trash')}</button></span></div>`).join('')}</div>` : ''}
  </div></div>
  <div class="toolbar"><button class="btn primary" data-act="save-site">Save changes</button><a class="btn" href="/" target="_blank" rel="noopener">${ic('eye')} View home page</a></div>`;
}
function vPages() {
  if (!SITE) SITE = JSON.parse(JSON.stringify(S()));
  const page = (key, title, url, hint) => `<div class="ed-group"><h3 style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>${title}</span><a class="btn sm ghost" href="${url}" target="_blank" rel="noopener">${ic('ext')} View page</a></h3>${hint ? `<p class="hint">${hint}</p>` : ''}
    <div class="secbox">${rteBar()}<div class="rte rich" contenteditable="true" data-page-rte="${key}" data-ph="Write here…">${toHtml(SITE[key])}</div></div></div>`;
  return `<div class="panel"><div class="panel-b ed-form">
    ${page('about', 'About us', '/p/about-us', 'Your story: who you are, how the trips work, why people travel with you. Your contact details are added below it automatically.')}
    ${page('terms', 'Terms & conditions', '/p/terms-and-conditions', 'Shown on its own page and inside every trip under "Inclusions & policies".')}
    ${page('cancellation', 'Cancellation policy', '/p/terms-and-conditions', 'Shown on every trip and on the terms page.')}
    ${page('privacy', 'Privacy policy', '/p/privacy-policy')}
  </div></div>
  <div class="panel"><div class="panel-h"><h2>Category pages (Weekend trips, Long weekends…)</h2><button class="btn sm" data-act="cat-add">${ic('plus')} Add category</button></div><div class="panel-b ed-form">
    <p class="hint">Each category is a menu item and a page listing its trips. A short intro and a good Google title help these pages rank for searches like "weekend trips from Bangalore".</p>
    ${(SITE.categories || []).map((c, i) => `<div class="secbox"><div class="secbox-h"><input class="in" data-site-cat="${i}" data-k="name" value="${esc(c.name)}" aria-label="Menu name"><a class="btn sm ghost" href="/tours/?categories=${encodeURIComponent(c.match || c.id)}" target="_blank" rel="noopener" aria-label="View page">${ic('ext')}</a><button class="iconbtn" data-act="cat-move" data-i="${i}" aria-label="Move up" ${i ? '' : 'disabled'}>${ic('up')}</button><button class="iconbtn" data-act="cat-del" data-i="${i}" aria-label="Remove" ${D.trips.some((t) => (t.categories || []).includes(c.id)) ? 'disabled title="Trips use this category"' : ''}>${ic('trash')}</button></div>
      <div class="panel-b ed-form" style="gap:12px">
        ${fld('Page heading', `<input class="in" data-site-cat="${i}" data-k="heading" value="${esc(c.heading || '')}" placeholder="${esc(c.name)} from Bangalore">`)}
        <div class="field"><label>Intro text</label><div class="secbox">${rteBar()}<div class="rte rich" contenteditable="true" data-cat-rte="${i}" data-ph="A few lines about these trips…" style="min-height:90px">${c.intro || ''}</div></div></div>
        <div class="grid2">${fld('Google title', `<input class="in" data-site-cat="${i}" data-k="seoTitle" maxlength="90" value="${esc(c.seoTitle || '')}" placeholder="${esc(c.name)} from Bangalore | ${esc(S().brand)}">`)}${fld('Google description', `<input class="in" data-site-cat="${i}" data-k="seoDesc" maxlength="200" value="${esc(c.seoDesc || '')}">`)}</div>
        ${fld('Old link text', `<input class="in" data-site-cat="${i}" data-k="match" value="${esc(c.match || '')}">`, 'Keeps old TravStack links like /tours/?categories=weekend trips from bangalore working.')}
      </div></div>`).join('')}
    <div><button class="btn primary" data-act="save-site">Save changes</button></div>
  </div></div>`;
}
const toHtml = (v) => /<(p|ul|ol|h3|h4|b|strong|br)\b/i.test(String(v || '')) ? String(v) : esc(v || '').split(/\n+/).filter(Boolean).map((l) => `<p>${l}</p>`).join('');
function externalImages() {
  const out = [];
  D.trips.forEach((t) => { if (t.cover && /^https?:/.test(t.cover)) out.push({ t, k: 'cover' }); (t.gallery || []).forEach((g, i) => { if (/^https?:/.test(g.url)) out.push({ t, k: 'gallery', i }); }); });
  ['logo', 'heroImage'].forEach((k) => { if (/^https?:/.test(S()[k] || '')) out.push({ site: k }); });
  return out;
}
async function importImages(btn) {
  const list = externalImages(); let done = 0, failed = 0; btn.disabled = true;
  const changed = new Set(); const cache = {};
  const imp = async (url) => { if (cache[url]) return cache[url]; const r = await api('POST', 'images/import', { url }); cache[url] = r.url; return r.url; };
  for (const x of list) {
    btn.textContent = `Copying ${done + failed + 1} of ${list.length}…`;
    try {
      if (x.site) { SITE = SITE || JSON.parse(JSON.stringify(S())); SITE[x.site] = await imp(S()[x.site]); changed.add('site'); }
      else if (x.k === 'cover') { x.t.cover = await imp(x.t.cover); changed.add(x.t); }
      else { x.t.gallery[x.i].url = await imp(x.t.gallery[x.i].url); changed.add(x.t); }
      done++;
    } catch { failed++; }
  }
  for (const c of changed) { try { if (c === 'site') await api('PUT', 'settings', SITE); else await api('PUT', 'trips/' + c.id, c); } catch (e) { toast(e.message); } }
  SITE = null; toast(`${done} photos copied${failed ? `, ${failed} could not be copied` : ''}.`); await load(); render();
}

/* ================= team ================= */
function vTeam() {
  return `<div class="panel"><div class="panel-h"><h2>Add a team member</h2></div><div class="panel-b"><form data-form="team" class="ed-form" style="gap:12px">
    <div class="grid3"><div class="field"><label for="tm-name">Name</label><input class="in" id="tm-name" name="name" required></div><div class="field"><label for="tm-email">Email</label><input class="in" id="tm-email" name="email" type="email" required></div>
    <div class="field"><label for="tm-role">Role</label><select class="in" id="tm-role" name="role">${Object.entries(D.roles).filter(([k]) => k !== 'owner').map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}<option value="owner">Owner</option></select></div></div>
    <div class="grid2"><div class="field"><label for="tm-pass">Temporary password (8+ characters)</label><input class="in" id="tm-pass" name="password" required minlength="8" autocomplete="new-password"></div><div class="field" style="align-self:end"><button class="btn primary" type="submit">Add member</button></div></div>
    <p class="hint">Share the email and temporary password with them privately. They can change it in My account.</p></form></div></div>
  <div class="panel"><div class="panel-h"><h2>What each role can do</h2></div><div class="panel-b"><dl class="kv"><dt>Owner</dt><dd>Everything, including team logins.</dd><dt>Manager</dt><dd>Trips, dates, prices, photos, bookings, payments, coupons, website settings.</dd><dt>Sales</dt><dd>Enquiries, missed checkouts, bookings and payments. Can't edit trips or prices.</dd><dt>Trip lead</dt><dd>Departures and passenger lists only. No amounts.</dd></dl></div></div>
  <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
    ${(D.team || []).map((u) => `<tr><td><b>${esc(u.name || '')}</b></td><td>${esc(u.email)}</td><td><select class="in" style="width:auto;padding:6px 10px" data-team-role="${esc(u.id)}" ${u.id === D.me.id ? 'disabled' : ''}>${Object.entries(D.roles).map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></td><td>${u.active ? '<span class="pill good">Active</span>' : '<span class="pill neutral">Removed</span>'}</td>
      <td>${u.id === D.me.id ? '<span class="hint">You</span>' : `<span class="toolbar"><button class="btn sm" data-act="team-pass" data-id="${esc(u.id)}">Reset password</button><button class="btn sm" data-act="team-active" data-id="${esc(u.id)}" data-on="${u.active ? '0' : '1'}">${u.active ? 'Remove access' : 'Restore'}</button></span>`}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}
function vAccount() {
  return `<div class="panel" style="max-width:520px"><div class="panel-b ed-form"><dl class="kv"><dt>Name</dt><dd>${esc(D.me.name)}</dd><dt>Email</dt><dd>${esc(D.me.email)}</dd><dt>Role</dt><dd>${esc(D.roles[D.me.role])}</dd></dl>
    <form data-form="password" class="ed-form" style="gap:12px"><h3 style="font-size:15px">Change password</h3><div class="field"><label for="pw-cur">Current password</label><input class="in" id="pw-cur" name="current" type="password" required autocomplete="current-password"></div><div class="field"><label for="pw-new">New password (8+ characters)</label><input class="in" id="pw-new" name="next" type="password" minlength="8" required autocomplete="new-password"></div><div><button class="btn primary" type="submit">Change password</button></div></form>
    <div><button class="btn" data-act="logout">${ic('logout')} Log out</button></div></div></div>`;
}
async function loadActivity() {
  try { const r = await api('GET', 'activity'); const box = $('#activity'); if (!box) return;
    box.innerHTML = r.items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>${r.items.map((x) => `<tr><td class="num" style="white-space:nowrap">${fmtTs(x.at)}</td><td>${esc(x.who)}</td><td>${esc(x.action)}${x.detail ? ` <span class="muted">· ${esc(x.detail)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="panel-b muted">Nothing yet.</div>';
  } catch (e) { toast(e.message); }
}

/* ================= events ================= */
function syncRte(box) {
  if (box.dataset.pageRte) { SITE[box.dataset.pageRte] = box.innerHTML; return; }
  if (box.dataset.secRte !== undefined) { SITE.homeSections[Number(box.dataset.secRte)].body = box.innerHTML; return; }
  if (box.dataset.catRte !== undefined) { SITE.categories[Number(box.dataset.catRte)].intro = box.innerHTML; return; }
  const kind = box.dataset.rte;
  if (kind === 'about') ED.about = box.innerHTML; else if (ED[kind] && ED[kind][Number(box.dataset.i)]) ED[kind][Number(box.dataset.i)].body = box.innerHTML;
  markDirty();
}
function setPath(o, path, v) { const p = path.split('.'); let x = o; for (let i = 0; i < p.length - 1; i++) { x = x[/^\d+$/.test(p[i]) ? Number(p[i]) : p[i]]; if (!x) return; } x[p[p.length - 1]] = v; }
function nextWeekday(dow) { const d = parseISO(today()); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7 || 7)); return isoOf(d); }
document.addEventListener('click', async (e) => {
  const cmd = e.target.closest('[data-cmd]');
  if (cmd) { e.preventDefault(); const c = cmd.dataset.cmd; const box = cmd.parentElement.nextElementSibling; box.focus();
    if (c === 'h3') document.execCommand('formatBlock', false, 'h3'); else if (c === 'removeFormat') { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'p'); } else document.execCommand(c);
    syncRte(box); return; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;
  if (a === 'open-side') { $('.side').classList.add('open'); const sc = document.createElement('div'); sc.className = 'scrim'; sc.dataset.act = 'close-side'; document.body.appendChild(sc); return; }
  if (a === 'close-side') { closeSide(); return; }
  if (a === 'm-backdrop' && e.target === el) { closeModal(); return; }
  if (a === 'm-close') { closeModal(); return; }
  if (a === 'logout') { await api('POST', 'logout').catch(() => {}); D = null; renderAuth(); return; }
  if (a === 'seed') { el.disabled = true; await act(() => api('POST', 'trips/seed'), 'Starter trips loaded. Check prices and dates before publishing.'); return; }
  if (a === 'pick-dep') { ADM.depTrip = el.dataset.trip; ADM.depDate = el.dataset.date; return; }
  if (a === 'print') { window.print(); return; }
  /* trips */
  if (a === 'trip-tag') { ADM.tripTag = el.dataset.tag; $$('[data-act="trip-tag"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tag === ADM.tripTag)); renderTripList(); return; }
  if (a === 'toggle-live') { const t = tripById(el.dataset.id); if (t) await act(() => api('POST', `trips/${t.id}/status`, { status: t.status === 'live' ? 'draft' : 'live' }), t.status === 'live' ? 'Unpublished' : 'Published'); return; }
  if (a === 'dup-trip') { const t = tripById(el.dataset.id); if (!t) return; const c = JSON.parse(JSON.stringify(t)); c.id = uid('t'); c.name = 'Copy of ' + t.name; c.slug = slugify(c.name) + '-' + c.id.slice(-4); c.status = 'draft'; c.slots = [];
    const ok = await act(() => api('PUT', 'trips/' + c.id, c), 'Copied as a draft'); if (ok) location.hash = 'edit-' + c.id; return; }
  /* editor */
  if (a === 'ed-tab') { ED_TAB = el.dataset.tab; render(); return; }
  if (a === 'ed-save') { edSave(false); return; }
  if (a === 'ed-publish') { edSave(true); return; }
  if (a === 'del-trip') {
    if (el.dataset.confirm !== '1') { el.dataset.confirm = '1'; el.innerHTML = ic('trash') + ' Tap again to delete'; setTimeout(() => { if (el.isConnected) { el.dataset.confirm = ''; el.innerHTML = ic('trash') + ' Delete'; } }, 4000); return; }
    const ok = await act(() => api('DELETE', 'trips/' + ED.id), 'Trip deleted'); if (ok) { ED = null; ED_DIRTY = false; location.hash = 'trips'; } return; }
  if (a === 'arr-add') { const k = el.dataset.arr;
    if (k === 'tickets') ED.tickets.push({ id: uid('k'), name: '', price: 0, ebDays: 0, note: '', pax: 1 });
    if (k === 'slots') { const last = ED.slots.map((s) => s.date).sort().pop(); ED.slots.push({ id: uid('d'), date: last ? addDays(last, 7) : nextWeekday(5), seats: Number(ED.defaultSeats) || 25, time: '20:30', extra: 0 }); }
    if (k === 'pickups') ED.pickups.push({ place: '', time: '' });
    markDirty(); render(); return; }
  if (a === 'arr-del') { ED[el.dataset.arr].splice(Number(el.dataset.i), 1); markDirty(); render(); return; }
  if (a === 'arr-move') { const k = el.dataset.arr, i = Number(el.dataset.i), j = i + Number(el.dataset.d); if (j < 0 || j >= ED[k].length) return; [ED[k][i], ED[k][j]] = [ED[k][j], ED[k][i]]; markDirty(); render(); return; }
  if (a === 'add-weekly') { const have = new Set(ED.slots.map((s) => s.date)); let d = nextWeekday(Number(el.dataset.dow)), n = 0;
    for (let k = 0; k < 8; k++) { if (!have.has(d)) { ED.slots.push({ id: uid('d'), date: d, seats: Number(ED.defaultSeats) || 25, time: '20:30', extra: 0 }); n++; } d = addDays(d, 7); }
    markDirty(); toast(n + ' dates added'); render(); return; }
  if (a === 'copy-pickups') { const src = D.trips.find((t) => (t.pickups || []).length && t.id !== ED.id); ED.pickups = JSON.parse(JSON.stringify(src.pickups)); markDirty(); toast('Copied from ' + src.name); render(); return; }
  if (a === 'add-day') { ED.itinerary.push({ title: 'Day ' + (ED.itinerary.length + 1) + ': ', body: '', travel: '', stay: '', meals: '' }); markDirty(); render(); return; }
  if (a === 'add-section') { ED.sections.push({ id: uid('s'), title: el.dataset.title || 'New section', body: '' }); markDirty(); render(); return; }
  if (a === 'add-faq') { ED.faqs.push({ q: '', a: '' }); markDirty(); render(); return; }
  if (a === 'set-cover') { ED.cover = ED.gallery[Number(el.dataset.i)].url; markDirty(); toast('Cover photo updated'); render(); return; }
  if (a === 'add-gal-url') { const v = ($('#gal-url').value || '').trim(); if (!/^https?:\/\//.test(v)) { toast('Paste a link that starts with https://'); return; } ED.gallery.push({ url: v, caption: '' }); markDirty(); render(); return; }
  /* calendar, leads */
  if (a === 'cal-go') { ADM.calMonth = el.dataset.m || null; render(); return; }
  if (a === 'lead-filter') { ADM.leadStatus = el.dataset.s; render(); return; }
  /* bookings */
  if (a === 'open-booking') { openBooking(el.dataset.id); return; }
  if (a === 'add-booking') { addBookingModal(); return; }
  if (a === 'add-lead') { addLeadModal(); return; }
  if (a === 'open-lead') { openLead(el.dataset.id); return; }
  if (a === 'lead-view') { ADM.leadView = el.dataset.v; render(); return; }
  if (a === 'rep-period') { ADM.repPeriod = el.dataset.p; render(); return; }
  if (a === 'ld-fu') { const v = el.dataset.v; const ok = await act(() => api('PATCH', 'enquiries/' + el.dataset.id, { followUp: v }), v ? 'Follow-up set for ' + fmtD(v) : 'Follow-up cleared'); if (ok) openLead(el.dataset.id); return; }
  if (a === 'ld-note') { const v = $('#ld-note').value.trim(); if (!v) return; const ok = await act(() => api('PATCH', 'enquiries/' + el.dataset.id, { addNote: v }), 'Note added'); if (ok) openLead(el.dataset.id); return; }
  if (a === 'ld-book') { const e = D.enquiries.find((x) => x.id === el.dataset.id); ADM.convLead = e.id; addBookingModal(); const set = (id, v) => { const x = $(id); if (x && v) { x.value = v; x.dispatchEvent(new Event('change', { bubbles: true })); } }; set('#ab-trip', e.tripId); set('#ab-date', e.date); set('#ab-name', e.name); set('#ab-phone', e.phone); set('#ab-people', e.people); return; }
  if (a === 'export') { exportBookings(); return; }
  if (a === 'bk-record') { const amt = Number($('#bk-pay').value) || 0; if (amt <= 0) return; const ok = await act(() => api('PATCH', 'bookings/' + el.dataset.id, { addPayment: amt }), inr(amt) + ' recorded'); if (ok) openBooking(el.dataset.id); return; }
  if (a === 'bk-note') { await act(() => api('PATCH', 'bookings/' + el.dataset.id, { note: $('#bk-note').value }), 'Note saved'); openBooking(el.dataset.id); return; }
  if (a === 'dep-csv') { const t = tripById(ADM.depTrip); const rows = [['#', 'Traveller', 'Gender', 'Age', 'Booking', 'Booked by', 'Phone', 'Pickup', 'Status']]; let n = 0; D.bookings.filter((b) => b.tripId === ADM.depTrip && b.slotDate === ADM.depDate && (b.status === 'confirmed' || b.status === 'pending')).forEach((b) => travOf(b).forEach((tr) => rows.push([++n, tr.name, tr.gender, tr.age, b.id, b.name, b.phone, b.pickup || '', b.status]))); downloadCsv(rows, slugify(t ? t.name : 'trip') + '-' + ADM.depDate + '.csv'); return; }
  if (a === 'cust-csv') { const rows = [['Name', 'Phone', 'Trips', 'Spent', 'Last trip', 'Last date']]; $$('.tbl tbody tr').forEach((tr) => rows.push(Array.from(tr.children).slice(0, 5).map((td) => td.innerText.replace(/\n/g, ' ')))); downloadCsv(rows, 'customers-' + today() + '.csv'); return; }
  /* coupons */
  if (a === 'del-coupon') { await act(() => api('DELETE', 'coupons/' + el.dataset.id), 'Coupon deleted'); return; }
  /* site */
  if (a === 'save-site') { el.disabled = true; const ok = await act(() => api('PUT', 'settings', SITE || S()), 'Website updated'); if (ok) SITE = null; render(); return; }
  if (a === 'rev-add') { SITE.reviews = SITE.reviews || []; SITE.reviews.push({ name: '', text: '', trip: '', date: '', rating: 5 }); render(); return; }
  if (a === 'rev-del') { SITE.reviews.splice(Number(el.dataset.i), 1); render(); return; }
  if (a === 'pick-add') { SITE.pickups = SITE.pickups || []; SITE.pickups.push({ place: '', time: '' }); render(); return; }
  if (a === 'pick-del') { SITE.pickups.splice(Number(el.dataset.i), 1); render(); return; }
  if (a === 'cat-add') { SITE.categories.push({ id: 'cat-' + uid(), name: 'New category', match: '' }); render(); return; }
  if (a === 'cat-del') { SITE.categories.splice(Number(el.dataset.i), 1); render(); return; }
  if (a === 'cat-move') { const i = Number(el.dataset.i); [SITE.categories[i - 1], SITE.categories[i]] = [SITE.categories[i], SITE.categories[i - 1]]; render(); return; }
  if (a === 'import-images') { importImages(el); return; }
  if (a === 'sl-add') { const k = el.dataset.list; SITE[k] = SITE[k] || []; SITE[k].push(k === 'whyItems' ? { icon: 'check', title: '', text: '' } : { label: '', url: '' }); render(); return; }
  if (a === 'sl-del') { const k = el.dataset.list; SITE[k].splice(Number(el.dataset.i), 1); render(); return; }
  if (a === 'sl-move') { const k = el.dataset.list, i = Number(el.dataset.i), j = i + Number(el.dataset.d); if (j < 0 || j >= SITE[k].length) return; [SITE[k][i], SITE[k][j]] = [SITE[k][j], SITE[k][i]]; render(); return; }
  if (a === 'sl-clear') { SITE[el.dataset.k] = ''; render(); return; }
  if (a === 'why-icon') { SITE.whyItems[Number(el.dataset.i)].icon = el.dataset.n; render(); return; }
  if (a === 'sec-add') { const t = el.dataset.type; SITE.homeSections = SITE.homeSections || []; const c = (SITE.categories || [])[0] || {}; SITE.homeSections.push(t === 'category' ? { k: 'cat-' + uid(), type: 'category', on: true, cat: c.id || '', title: (c.name || 'Trips') + ' from Bangalore', sub: '' } : { k: 'txt-' + uid(), type: 'text', on: true, title: 'About Adventure Buddha', sub: '', body: '' }); render(); toast('Section added at the bottom. Move it up where you want it.'); return; }
  /* team */
  if (a === 'team-active') { await act(() => api('PATCH', 'team/' + el.dataset.id, { active: el.dataset.on === '1' }), 'Updated'); return; }
  if (a === 'team-pass') { modal('Reset password', `<form data-form="team-pass" data-id="${esc(el.dataset.id)}" id="tp-form" style="display:grid;gap:12px"><div class="field"><label for="tp-pass">New temporary password (8+ characters)</label><input class="in" id="tp-pass" name="password" minlength="8" required autocomplete="new-password"></div></form>`, `<button class="btn" data-act="m-close">Cancel</button><button class="btn primary" type="submit" form="tp-form">Set password</button>`); return; }
});
document.addEventListener('paste', (e) => {
  const box = e.target.closest && e.target.closest('.rte'); if (!box) return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
  const lines = text.split(/\r?\n/);
  if (lines.length > 1) document.execCommand('insertHTML', false, lines.map((l) => esc(l)).join('<br>')); else document.execCommand('insertText', false, text);
  syncRte(box);
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'adm-q') { ADM.tripQ = t.value; renderTripList(); return; }
  if (t.id === 'bk-q') { ADM.bkQ = t.value; renderBkTable(); return; }
  if (t.matches('.rte')) { syncRte(t); return; }
  if (SITE && t.dataset.sitePick) { SITE.pickups[Number(t.dataset.sitePick)][t.dataset.k] = t.value; return; }
  if (ED && t.dataset.ed && t.type !== 'checkbox' && t.type !== 'radio') { ED[t.dataset.ed] = t.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value;
    if (t.dataset.ed === 'name' && (ED._new || !ED.slug)) { ED.slug = slugify(t.value); const s = $('[data-ed="slug"]'); if (s) s.value = ED.slug; }
    if (t.dataset.ed === 'gst') $$('[data-gst-for]').forEach((x) => { const k = ED.tickets[Number(x.dataset.gstFor)]; if (k) x.textContent = inr(withGst(k.price, ED)); });
    markDirty(); return; }
  if (ED && t.dataset.arr) { const row = ED[t.dataset.arr][Number(t.dataset.i)]; if (!row) return; row[t.dataset.k] = t.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value;
    if (t.dataset.arr === 'tickets' && t.dataset.k === 'price') { const x = $(`[data-gst-for="${t.dataset.i}"]`); if (x) x.textContent = inr(withGst(row.price, ED)); }
    markDirty(); return; }
  if (t.hasAttribute('data-lead-q')) { ADM.leadQ = t.value; clearTimeout(ADM._lq); ADM._lq = setTimeout(() => { const pos = t.selectionStart; render(); const n = $('[data-lead-q]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch {} } }, 250); return; }
  if (t.hasAttribute('data-dup-check')) { const d = t.value.replace(/\D/g, '').slice(-10); const box = $('#al-dup'); if (!box) return; const m = d.length === 10 ? D.enquiries.filter((e) => String(e.phone || '').replace(/\D/g, '').slice(-10) === d) : []; const bk = d.length === 10 ? D.bookings.filter((b) => String(b.phone || '').replace(/\D/g, '').slice(-10) === d && b.status !== 'awaiting_payment') : []; box.innerHTML = m.length || bk.length ? `<div class="notice" style="padding:10px 12px">${m.length ? `Already a lead: ${m.slice(0, 3).map((e) => `<button type="button" class="linkbtn" data-act="open-lead" data-id="${esc(e.id)}"><b>${esc(e.name)}</b></button> (${esc((LEAD_ST.find(([k]) => k === e.status) || [, e.status])[1])}, ${ago(e.createdAt)})`).join(', ')}. ` : ''}${bk.length ? `Has booked ${bk.length} trip${bk.length > 1 ? 's' : ''} before. Pick "Repeat traveller".` : ''}</div>` : ''; return; }
  if (SITE && t.dataset.sl) { setPath(SITE, t.dataset.sl, t.value); return; }
  if (SITE && t.dataset.site) { SITE[t.dataset.site] = t.value; return; }
  if (SITE && t.dataset.siteStat) { SITE.stats[Number(t.dataset.siteStat)][t.dataset.k] = t.value; return; }
  if (SITE && t.dataset.siteCat) { SITE.categories[Number(t.dataset.siteCat)][t.dataset.k] = t.value; return; }
  if (SITE && t.dataset.siteRev) { SITE.reviews[Number(t.dataset.siteRev)][t.dataset.k] = t.value; return; }
  if (SITE && t.dataset.siteLines) { SITE[t.dataset.siteLines] = t.value.split('\n').map((x) => x.trim()).filter(Boolean); return; }
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (ED && t.dataset.ed && (t.type === 'checkbox' || t.type === 'radio')) { ED[t.dataset.ed] = t.type === 'checkbox' ? t.checked : t.value; markDirty(); if (t.dataset.ed === 'mode') render(); return; }
  if (ED && t.dataset.edArr) { const k = t.dataset.edArr; ED[k] = ED[k] || []; if (t.checked) { if (!ED[k].includes(t.value)) ED[k].push(t.value); } else ED[k] = ED[k].filter((v) => v !== t.value); markDirty(); return; }
  if (ED && t.dataset.ed === 'cover') { render(); return; }
  if (t.dataset.upload) { await uploadFiles(t.files, t.dataset.upload); t.value = ''; return; }
  if (SITE && t.dataset.secOn !== undefined) { SITE.homeSections[Number(t.dataset.secOn)].on = t.checked; render(); return; }
  if (SITE && t.dataset.sl && t.tagName === 'SELECT') { setPath(SITE, t.dataset.sl, t.value); return; }
  if (SITE && t.dataset.siteRev && t.tagName === 'SELECT') { SITE.reviews[Number(t.dataset.siteRev)].rating = Number(t.value); return; }
  if (t.dataset.leadStatus) { await act(() => api('PATCH', 'enquiries/' + t.dataset.leadStatus, { status: t.value }), 'Status updated'); return; }
  if (t.dataset.leadAssign !== undefined && t.dataset.leadAssign) { await act(() => api('PATCH', 'enquiries/' + t.dataset.leadAssign, { assignedTo: t.value }), t.value ? 'Assigned' : 'Unassigned'); return; }
  if (t.hasAttribute('data-lead-src')) { ADM.leadSrc = t.value; render(); return; }
  if (t.hasAttribute('data-lead-ch')) { ADM.leadCh = t.value; render(); return; }
  if (t.hasAttribute('data-lead-who')) { ADM.leadWho = t.value; render(); return; }
  if (t.dataset.ld) { const id = $('#modal-root').dataset.lead; const ok = await act(() => api('PATCH', 'enquiries/' + id, { [t.dataset.ld]: t.value }), 'Saved'); if (ok) openLead(id); return; }
  if (t.dataset.bkStatus) { await act(() => api('PATCH', 'bookings/' + t.dataset.bkStatus, { status: t.value }), 'Booking updated'); openBooking(t.dataset.bkStatus); return; }
  if (t.dataset.couponActive) { const c = D.coupons.find((x) => x.code === t.dataset.couponActive); await act(() => api('PUT', 'coupons/' + c.code, { ...c, active: t.checked }), t.checked ? 'Coupon active' : 'Coupon paused'); return; }
  if (t.dataset.bkf) { ADM[t.dataset.bkf] = t.value; renderBkTable(); return; }
  if (t.hasAttribute('data-dep-pick')) { const [id, d] = t.value.split('|'); ADM.depTrip = id; ADM.depDate = d; render(); return; }
  if (t.dataset.teamRole) { await act(() => api('PATCH', 'team/' + t.dataset.teamRole, { role: t.value }), 'Role updated'); return; }
});
document.addEventListener('dragstart', (e) => { const c = e.target.closest && e.target.closest('[data-drag]'); if (!c) return; e.dataTransfer.setData('text/plain', c.dataset.drag); e.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); });
document.addEventListener('dragend', (e) => { const c = e.target.closest && e.target.closest('[data-drag]'); if (c) c.classList.remove('dragging'); document.querySelectorAll('.kcol.over').forEach((x) => x.classList.remove('over')); });
document.addEventListener('dragover', (e) => { const col = e.target.closest && e.target.closest('[data-drop]'); if (!col) return; e.preventDefault(); document.querySelectorAll('.kcol.over').forEach((x) => x !== col && x.classList.remove('over')); col.classList.add('over'); });
document.addEventListener('drop', async (e) => { const col = e.target.closest && e.target.closest('[data-drop]'); if (!col) return; e.preventDefault(); col.classList.remove('over'); const id = e.dataTransfer.getData('text/plain'); const l = D.enquiries.find((x) => x.id === id); if (!l || l.status === col.dataset.drop) return; l.status = col.dataset.drop; render(); await act(() => api('PATCH', 'enquiries/' + id, { status: col.dataset.drop }), 'Moved to ' + (LEAD_ST.find(([k]) => k === col.dataset.drop) || [])[1]); });
document.addEventListener('submit', async (e) => {
  const f = e.target; e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  const err = (m) => { const x = $('#auth-err'); if (x) { x.textContent = m; x.hidden = false; } else toast(m); };
  const btn = f.querySelector('[type=submit]') || $(`[form="${f.id}"]`); if (btn) btn.disabled = true;
  const done = () => { if (btn) btn.disabled = false; };
  try {
    if (f.dataset.form === 'login' || f.dataset.form === 'setup') {
      await api('POST', f.dataset.form, d); await load(); if (!location.hash) location.hash = 'overview'; render(); return;
    }
    if (f.dataset.form === 'coupon') { const ok = await act(() => api('PUT', 'coupons/' + String(d.code).toUpperCase().replace(/[^A-Z0-9]/g, ''), { type: d.type, value: Number(d.value), active: true }), 'Coupon created'); done(); return; }
    if (f.dataset.form === 'add-booking') { const r = await act(() => api('POST', 'bookings', d), 'Booking added'); if (r) { if (ADM.convLead) { const bid = r.id || r.bookingId || ''; await act(() => api('PATCH', 'enquiries/' + ADM.convLead, { status: 'converted', addNote: 'Booking added' + (bid ? ' · ' + bid : '') })); } closeModal(); } ADM.convLead = ''; done(); return; }
    if (f.dataset.form === 'add-lead') { const r = await act(() => api('POST', 'enquiries', d), 'Lead added'); if (r) closeModal(); done(); return; }
    if (f.dataset.form === 'team') { await act(() => api('POST', 'team', d), 'Team member added'); done(); return; }
    if (f.dataset.form === 'team-pass') { const ok = await act(() => api('PATCH', 'team/' + f.dataset.id, { password: d.password }), 'Password changed. Share it with them privately.'); if (ok) closeModal(); done(); return; }
    if (f.dataset.form === 'password') { await api('POST', 'password', d); toast('Password changed'); f.reset(); done(); return; }
  } catch (ex) { err(ex.message); done(); }
});

/* ================= boot ================= */
(async () => {
  try { await load(); render(); } catch (e) { if (!D) renderAuth(); }
  setInterval(async () => { if (!D || document.hidden || $('#modal-root').innerHTML) return; try { await load(); render(true); } catch {} }, 60000);
})();
})();
