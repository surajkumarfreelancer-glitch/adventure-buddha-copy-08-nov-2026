// Small shared helpers used by every function.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export const bad = (message, status = 400) => json({ error: message }, status);

export const html = (body, status = 200, headers = {}) =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });

export function rid(prefix = '', bytes = 9) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return prefix + Array.from(a, (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}

export function bookingId() {
  const a = new Uint8Array(5);
  crypto.getRandomValues(a);
  return 'AB' + Array.from(a, (b) => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b % 31]).join('');
}

export const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'trip';

const pad = (n) => String(n).padStart(2, '0');
// Dates are business dates in India (IST, UTC+5:30).
export function todayIST() {
  const d = new Date(Date.now() + 330 * 60000);
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
}
export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
}
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtD(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return DOW[t.getUTCDay()] + ' ' + d + ' ' + MON[m - 1];
}
export function fmtShort(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  return d + ' ' + MON[m - 1];
}
export const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export async function readJson(request, max = 200000) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > max) throw new Error('too_large');
  const text = await request.text();
  if (text.length > max) throw new Error('too_large');
  try { return JSON.parse(text || '{}'); } catch { throw new Error('bad_json'); }
}

export const cleanPhone = (p) => String(p || '').replace(/[^\d+]/g, '');
export const phoneOk = (p) => cleanPhone(p).replace(/^\+?91/, '').replace(/\D/g, '').length >= 10;
export const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);

// Allow-list HTML for rich text written in the dashboard (itinerary, sections).
const ALLOWED = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'h3', 'h4', 'a', 'blockquote']);
export function cleanHtml(input) {
  let s = String(input || '').slice(0, 60000);
  s = s.replace(/<(script|style|iframe|object|embed|template|svg|math)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  return s.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (m, tag, attrs) => {
    const t = tag.toLowerCase();
    const closing = m.startsWith('</');
    if (t === 'div') return closing ? '</p>' : '<p>';
    if (!ALLOWED.has(t)) return '';
    if (closing) return '</' + t + '>';
    if (t === 'a') {
      const href = /href\s*=\s*"(https?:\/\/[^"]*)"/i.exec(attrs) || /href\s*=\s*'(https?:\/\/[^']*)'/i.exec(attrs);
      return href ? `<a href="${esc(href[1])}" target="_blank" rel="noopener">` : '<a>';
    }
    return '<' + t + '>';
  });
}
export const textOnly = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
