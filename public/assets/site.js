// Public site interactions: menu, search, callbacks, enquiries and the booking flow.
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtD = (iso) => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d)); return DOW[t.getUTCDay()] + ' ' + d + ' ' + MON[m - 1]; };
  const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); };
  const AB = window.AB || {};
  const wa = (text) => 'https://wa.me/' + AB.wa + '?text=' + encodeURIComponent(text);
  const phoneOk = (p) => String(p || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').length >= 10;
  const icCheck = '<svg class="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  const icX = '<svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function toast(m) { const t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); }
  async function api(path, body) {
    const r = await fetch('/api/public/' + path, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
    return d;
  }
  const modalRoot = () => $('#modal-root');
  function modal(title, body, foot, sub) {
    modalRoot().innerHTML = `<div class="modal-back" data-act="close-bg"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-h"><div><h3>${esc(title)}</h3>${sub || ''}</div><button class="xbtn" data-act="close" aria-label="Close">${icX}</button></div>
      <div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div></div>`;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() { modalRoot().innerHTML = ''; document.body.style.overflow = ''; BK = null; }

  /* ---------- search on /tours ---------- */
  const q = $('#trip-q');
  if (q) {
    const run = () => { const v = q.value.trim().toLowerCase(); let n = 0; $$('#trip-results .tcard').forEach((c) => { const ok = !v || c.dataset.search.includes(v); c.hidden = !ok; if (ok) n++; }); $('#no-results').hidden = n > 0; };
    q.addEventListener('input', run); run();
  }

  /* ---------- callback / itinerary request ---------- */
  function openCallback(tripId, name, kind) {
    const it = kind === 'itinerary';
    modal(it ? 'Get the itinerary on WhatsApp' : 'Request a callback', `<p class="muted">${it ? 'We will send the full day-by-day plan for ' : 'Our team will call or WhatsApp you about '}<b>${esc(name || 'your trip')}</b>.</p>
      <form data-form="callback" data-trip="${esc(tripId || '')}" data-kind="${it ? 'itinerary' : 'callback'}" style="display:grid;gap:12px">
      <div class="field"><label for="cb-name">Your name</label><input class="in" id="cb-name" name="name" required autocomplete="name"></div>
      <div class="field"><label for="cb-phone">WhatsApp number</label><input class="in" id="cb-phone" name="phone" required inputmode="tel" autocomplete="tel" placeholder="10-digit mobile"></div>
      <input name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
      <button class="btn primary" type="submit">${it ? 'Send me the itinerary' : 'Call me back'}</button></form>`);
    setTimeout(() => { const i = $('#cb-name'); if (i) i.focus(); }, 50);
  }

  /* ---------- booking ---------- */
  const TD = (() => { const el = $('#trip-data'); try { return el ? JSON.parse(el.textContent) : null; } catch { return null; } })();
  let BK = null;
  const withGst = (p) => Math.floor((Number(p) || 0) * (1 + TD.gst / 100) + 0.01);
  const ebOk = (tk, date) => !(tk.ebDays > 0) || addDays(TD.today, tk.ebDays) <= date;
  const cheapest = (date) => TD.tickets.filter((t) => ebOk(t, date) && (t.pax || 1) === 1).sort((a, b) => a.price - b.price)[0] || TD.tickets.find((t) => ebOk(t, date));
  const slotOf = (d) => TD.slots.find((s) => s.date === d);
  function calc() {
    let sub = 0, people = 0; const slot = slotOf(BK.date) || { extra: 0 };
    TD.tickets.forEach((tk) => { const n = BK.qty[tk.id] || 0; if (n) { sub += (tk.price + slot.extra) * n; people += n * (tk.pax || 1); } });
    let disc = 0; const c = BK.coupon;
    if (c) disc = c.type === 'pct' ? Math.round(sub * c.value / 100) : Math.min(sub, c.value * people);
    const base = Math.max(0, sub - disc); const gst = Math.floor(base * TD.gst / 100 + 0.01); const total = base + gst;
    const adv = Math.round(total * TD.adv / 100);
    return { sub, disc, gst, total, people, adv, payNow: BK.plan === 'full' ? total : adv };
  }
  async function openBooking(date) {
    if (!TD) return;
    BK = { step: 1, date: '', qty: {}, contact: { name: '', phone: '', email: '' }, trav: [{ name: '', gender: '', age: '' }], pickup: '', plan: TD.allowOnline ? 'advance' : 'upi', coupon: null, leadId: '' };
    try { const a = await api('availability?trip=' + encodeURIComponent(TD.id)); TD.slots = a.slots; TD.today = a.today; } catch {}
    const open = TD.slots.filter((s) => s.left > 0);
    BK.date = (date && open.some((s) => s.date === date)) ? date : (open[0] ? open[0].date : '');
    const first = cheapest(BK.date); if (first) BK.qty[first.id] = 1;
    render();
  }
  function render() {
    if (!BK) return;
    const c = calc(); const names = ['Date & seats', 'Your details', 'Payment'];
    const sub = BK.step < 4 ? `<div class="bsteps">${names.map((n, i) => `<span class="${BK.step >= i + 1 ? 'on' : ''}">${i + 1}. ${n}</span>`).join('')}</div>` : '';
    let body = '', foot = '';
    if (BK.step === 1) {
      const slot = slotOf(BK.date); const over = slot && c.people > slot.left;
      body = `<div><div style="font-weight:700;margin-bottom:8px">Pick a departure</div><div class="slotgrid">${TD.slots.map((s) => `<button class="slot" data-act="date" data-date="${s.date}" aria-pressed="${BK.date === s.date}" ${s.left ? '' : 'disabled'}><b>${fmtD(s.date)}</b><small>${s.left ? s.left + ' seats left' : 'Full'}${s.extra ? ' · ' + (s.extra > 0 ? '+' : '') + inr(withGst(s.extra)) : ''}</small></button>`).join('') || '<p class="muted">No dates are open right now. WhatsApp us for the next dates.</p>'}</div></div>
        <div><div style="font-weight:700">Seats</div>${TD.tickets.map((tk) => { const ok = ebOk(tk, BK.date); const n = BK.qty[tk.id] || 0; const ex = (slotOf(BK.date) || { extra: 0 }).extra; return `<div class="trow"><div><b>${esc(tk.name)}</b><div class="hint">${ok ? inr(withGst(tk.price + ex)) + ' incl. GST' + (tk.pax > 1 ? ' · for ' + tk.pax + ' people' : '') : 'Closed for this date (book ' + tk.ebDays + '+ days ahead)'}${tk.note ? ' · ' + esc(tk.note) : ''}</div></div><div class="qty"><button data-act="qty" data-id="${esc(tk.id)}" data-d="-1" aria-label="Fewer" ${n ? '' : 'disabled'}>−</button><b class="num">${n}</b><button data-act="qty" data-id="${esc(tk.id)}" data-d="1" aria-label="More" ${ok ? '' : 'disabled'}>+</button></div></div>`; }).join('')}</div>`;
      foot = `<div><b class="num" style="font-size:18px">${inr(c.total)}</b> <span class="hint">for ${c.people} ${c.people === 1 ? 'person' : 'people'}</span>${over ? `<div class="hint" style="color:var(--bad)">Only ${slot.left} seats left on this date</div>` : ''}</div><button class="btn primary" data-act="next" ${!BK.date || !c.people || over ? 'disabled' : ''}>Continue</button>`;
    } else if (BK.step === 2) {
      while (BK.trav.length < c.people) BK.trav.push({ name: '', gender: '', age: '' });
      BK.trav.length = c.people;
      const g = (i) => `<select class="in" data-tr="${i}" data-k="gender" aria-label="Gender"><option value="">Gender</option>${['Male', 'Female', 'Other'].map((x) => `<option ${BK.trav[i].gender === x ? 'selected' : ''}>${x}</option>`).join('')}</select>`;
      const age = (i) => `<input class="in" data-tr="${i}" data-k="age" type="number" min="1" max="99" inputmode="numeric" placeholder="Age" value="${esc(BK.trav[i].age)}" aria-label="Age">`;
      body = `<div style="font-weight:700">Traveller 1 (you)</div>
        <div class="grid2"><div class="field"><label for="bk-name">Full name</label><input class="in" id="bk-name" data-bk="name" value="${esc(BK.contact.name)}" autocomplete="name"></div>
        <div class="field"><label for="bk-phone">WhatsApp number</label><input class="in" id="bk-phone" data-bk="phone" value="${esc(BK.contact.phone)}" inputmode="tel" autocomplete="tel"></div></div>
        <div class="trav-row"><div class="field"><label for="bk-email">Email (for your receipt)</label><input class="in" id="bk-email" type="email" data-bk="email" value="${esc(BK.contact.email)}" autocomplete="email"></div><div class="field"><label>Gender</label>${g(0)}</div><div class="field"><label>Age</label>${age(0)}</div></div>
        ${BK.trav.slice(1).map((t, j) => { const i = j + 1; return `<div style="font-weight:700;margin-top:4px">Traveller ${i + 1}</div><div class="trav-row"><div class="field"><label class="sr" for="tr-name-${i}">Name</label><input class="in" id="tr-name-${i}" data-tr="${i}" data-k="name" placeholder="Full name" value="${esc(t.name)}"></div>${g(i)}${age(i)}</div>`; }).join('')}
        ${TD.pickups.length ? `<div class="field"><label for="bk-pickup">Pickup point</label><select class="in" id="bk-pickup" data-bk="pickup"><option value="">Choose a pickup point</option>${TD.pickups.map((p) => `<option ${BK.pickup === p.place ? 'selected' : ''} value="${esc(p.place)}">${esc(p.place)} · ${esc(p.time)}</option>`).join('')}</select></div>` : ''}
        <p class="hint">Gender and age help us plan room sharing. We keep separate rooms for girls and boys.</p>`;
      foot = `<button class="btn" data-act="back">Back</button><button class="btn primary" data-act="next">Continue to payment</button>`;
    } else if (BK.step === 3) {
      body = `<div class="sum">${TD.tickets.filter((t) => BK.qty[t.id]).map((t) => `<div><span>${esc(t.name)} × ${BK.qty[t.id]}</span><span class="num">${inr((t.price + (slotOf(BK.date) || { extra: 0 }).extra) * BK.qty[t.id])}</span></div>`).join('')}
        ${c.disc ? `<div style="color:var(--good)"><span>Coupon ${esc(BK.coupon.code)}</span><span class="num">− ${inr(c.disc)}</span></div>` : ''}<div><span>GST ${TD.gst}%</span><span class="num">${inr(c.gst)}</span></div><div class="tot"><span>Total</span><span class="num">${inr(c.total)}</span></div></div>
        <div style="display:flex;gap:8px"><input class="in" id="bk-coupon" placeholder="Coupon code" value="${esc(BK.coupon ? BK.coupon.code : '')}" style="text-transform:uppercase" aria-label="Coupon code"><button class="btn" data-act="coupon">Apply</button></div>
        <div style="font-weight:700">How do you want to pay?</div>
        ${TD.allowOnline ? `<label class="opt"><input type="radio" name="plan" value="advance" ${BK.plan === 'advance' ? 'checked' : ''}><div><b>Pay ${TD.adv}% now: <span class="num">${inr(c.adv)}</span></b><small>UPI, cards or netbanking. Balance of ${inr(c.total - c.adv)} is due 24 hours before departure.</small></div></label>
        <label class="opt"><input type="radio" name="plan" value="full" ${BK.plan === 'full' ? 'checked' : ''}><div><b>Pay in full: <span class="num">${inr(c.total)}</span></b><small>Nothing more to pay later.</small></div></label>` : ''}
        <label class="opt"><input type="radio" name="plan" value="upi" ${BK.plan === 'upi' ? 'checked' : ''}><div><b>Pay by UPI transfer and send the screenshot</b><small>Pay ${inr(c.adv)} to <span class="mono">${esc(TD.upi)}</span>, then WhatsApp us the screenshot. We confirm your seat after checking it.</small></div></label>`;
      foot = `<button class="btn" data-act="back">Back</button><button class="btn primary" data-act="confirm">${BK.plan === 'upi' ? 'Reserve my seat' : 'Pay ' + inr(c.payNow)}</button>`;
    } else if (BK.step === 4) {
      const paid = BK.result.status === 'confirmed';
      body = `<div style="text-align:center;display:grid;gap:12px;padding:8px 0"><div class="okmark">${icCheck}</div><h3 style="font-size:21px">${paid ? 'Booking confirmed' : 'Seat reserved'}</h3>
        <p class="muted">Booking <b class="mono">${esc(BK.result.id)}</b> · ${esc(TD.name)} · ${fmtD(BK.date)}</p>
        <p>${paid ? 'Payment received. We will WhatsApp you the trip group and pickup details a day before departure.' : `Send <b>${inr(BK.result.payNow)}</b> to <b class="mono">${esc(BK.result.upi || TD.upi)}</b>, then share the screenshot with us on WhatsApp to confirm your seat.`}</p>
        <a class="btn wa" style="justify-self:center" href="${wa(`Hi! I just booked ${TD.name} for ${fmtD(BK.date)}. Booking ID ${BK.result.id}.${paid ? '' : ' Sharing my payment screenshot.'}`)}" target="_blank" rel="noopener">${paid ? 'Message us on WhatsApp' : 'Send screenshot on WhatsApp'}</a></div>`;
      foot = `<span></span><button class="btn" data-act="close">Done</button>`;
    }
    modal(TD.name, body, foot, sub);
  }
  async function next() {
    if (BK.step === 2) {
      BK.trav[0].name = BK.contact.name;
      if (!BK.contact.name.trim() || !phoneOk(BK.contact.phone)) { toast('Add your name and a 10-digit WhatsApp number.'); return; }
      const miss = BK.trav.findIndex((t) => !String(t.name).trim() || !t.gender || !(Number(t.age) >= 1 && Number(t.age) <= 99));
      if (miss >= 0) { toast(`Add the name, gender and age for traveller ${miss + 1}.`); return; }
      if (TD.pickups.length && !BK.pickup) { toast('Choose a pickup point.'); return; }
      try { const r = await api('checkout-lead', { leadId: BK.leadId, name: BK.contact.name, phone: BK.contact.phone, email: BK.contact.email, tripId: TD.id, date: BK.date, people: calc().people }); BK.leadId = r.leadId; } catch {}
    }
    BK.step++; render();
  }
  function loadRazorpay() {
    return new Promise((res, rej) => { if (window.Razorpay) return res(); const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = res; s.onerror = () => rej(new Error('Could not open the payment window. Check your connection.')); document.head.appendChild(s); });
  }
  async function confirm(btn) {
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Please wait…';
    try {
      const r = await api('book', { tripId: TD.id, date: BK.date, qty: BK.qty, contact: BK.contact, travellers: BK.trav.map((t, i) => ({ name: i ? t.name : BK.contact.name, gender: t.gender, age: Number(t.age), phone: i ? '' : BK.contact.phone })), pickup: BK.pickup, plan: BK.plan, coupon: BK.coupon ? BK.coupon.code : '', leadId: BK.leadId });
      BK.result = r;
      if (r.razorpay) {
        await loadRazorpay();
        const rz = new window.Razorpay({ key: r.razorpay.key, order_id: r.razorpay.order_id, amount: r.razorpay.amount, currency: 'INR', name: r.razorpay.name, description: r.razorpay.description, prefill: r.razorpay.prefill, theme: { color: '#EE8424' },
          handler: async (p) => {
            try { await api('verify', { bookingId: r.id, ...p }); BK.result.status = 'confirmed'; BK.step = 4; render(); }
            catch (e) { toast(e.message); BK.step = 4; render(); }
          },
          modal: { ondismiss: () => { btn.disabled = false; btn.textContent = label; toast('Payment not completed. Your booking ID is ' + r.id + '. You can try again or pay by UPI.'); } } });
        rz.open();
        return;
      }
      BK.step = 4; render();
    } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = label; if (/date|seats|full/i.test(e.message)) { BK.step = 1; openBooking(); } }
  }

  /* ---------- home page slideshow ---------- */
  let SLI = 0, SLT = null;
  function showSlide(i) {
    const imgs = document.querySelectorAll('.hero .slides img'); if (!imgs.length) return;
    SLI = (i + imgs.length) % imgs.length;
    imgs.forEach((im, n) => im.classList.toggle('on', n === SLI));
    document.querySelectorAll('.slide-caps .cap').forEach((c) => c.classList.toggle('on', Number(c.dataset.i) === SLI));
    document.querySelectorAll('.slide-caps .dots button').forEach((b, n) => b.classList.toggle('on', n === SLI));
  }
  if (document.querySelector('.hero .slides img')) { showSlide(0); if (document.querySelectorAll('.hero .slides img').length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) SLT = setInterval(() => showSlide(SLI + 1), 5000); }

  /* ---------- events ---------- */
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act;
    if (a === 'nav') { const n = $('#site-nav'); n.classList.toggle('open'); el.setAttribute('aria-expanded', n.classList.contains('open')); return; }
    if (a === 'close-bg' && e.target !== el) return;
    if (a === 'close' || a === 'close-bg') { closeModal(); return; }
    if (a === 'month') { document.querySelectorAll('.mtabs button').forEach((b) => b.classList.toggle('on', b === el)); const m = el.dataset.m; document.querySelectorAll('.up-cards .tcard').forEach((c) => { c.hidden = !!m && !(c.dataset.months || '').split(' ').includes(m); }); return; }
    if (a === 'slide') { showSlide(Number(el.dataset.i)); clearInterval(SLT); return; }
    if (a === 'callback') { openCallback(el.dataset.trip, el.dataset.name, el.dataset.kind); return; }
    if (a === 'book') { openBooking(el.dataset.date); return; }
    if (!BK) return;
    if (a === 'date') { BK.date = el.dataset.date; TD.tickets.forEach((t) => { if (!ebOk(t, BK.date)) delete BK.qty[t.id]; }); if (!Object.values(BK.qty).some(Boolean)) { const f = cheapest(BK.date); if (f) BK.qty[f.id] = 1; } render(); }
    else if (a === 'qty') { BK.qty[el.dataset.id] = Math.max(0, (BK.qty[el.dataset.id] || 0) + Number(el.dataset.d)); render(); }
    else if (a === 'next') next();
    else if (a === 'back') { BK.step--; render(); }
    else if (a === 'coupon') { const code = ($('#bk-coupon').value || '').trim(); if (!code) return; try { const c = await api('coupon', { code, tripId: TD.id }); BK.coupon = c; toast('Coupon applied'); } catch (err) { BK.coupon = null; toast(err.message); } render(); }
    else if (a === 'confirm') confirm(el);
  });
  document.addEventListener('input', (e) => {
    const ti = e.target.dataset && e.target.dataset.tr;
    if (ti !== undefined && BK) { BK.trav[Number(ti)][e.target.dataset.k] = e.target.value; return; }
    const k = e.target.dataset && e.target.dataset.bk; if (!k || !BK) return;
    if (['name', 'phone', 'email'].includes(k)) BK.contact[k] = e.target.value; else BK[k] = e.target.value;
  });
  document.addEventListener('change', (e) => { if (e.target.name === 'plan' && BK) { BK.plan = e.target.value; render(); } if (e.target.dataset && e.target.dataset.bk === 'pickup' && BK) BK.pickup = e.target.value; if (e.target.dataset && e.target.dataset.tr !== undefined && BK) BK.trav[Number(e.target.dataset.tr)][e.target.dataset.k] = e.target.value; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalRoot() && modalRoot().innerHTML) closeModal(); });
  document.addEventListener('submit', async (e) => {
    const f = e.target; if (!f.dataset.form) return; e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (!String(d.name || '').trim() || !phoneOk(d.phone)) { toast('Add your name and a 10-digit WhatsApp number.'); return; }
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      await api('enquiry', { ...d, tripId: f.dataset.trip || '', kind: f.dataset.kind || 'website' });
      const name = esc(String(d.name).trim());
      const msg = `<div class="notice" style="text-align:left"><h3>Thanks, ${name}!</h3>We'll message you on WhatsApp at <b class="num">${esc(d.phone)}</b> soon. Want a faster reply? <a href="${wa('Hi! I just sent an enquiry' + (f.dataset.name ? ' for ' + f.dataset.name : '') + '.')}" target="_blank" rel="noopener">Chat with us now</a>.</div>`;
      f.outerHTML = msg;
    } catch (err) { toast(err.message); btn.disabled = false; }
  });
})();
