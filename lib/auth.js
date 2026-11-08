// Team logins: email + password, sessions stored in D1, cookie "ab_session".
import { rid } from './util.js';

const ITER = 20000; // kept modest so login fits the Workers CPU budget
const enc = new TextEncoder();
const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

async function derive(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, key, 256));
}
export async function hashPassword(password) {
  const s = new Uint8Array(16); crypto.getRandomValues(s);
  const salt = hex(s);
  return `pbkdf2$${ITER}$${salt}$${await derive(password, salt)}`;
}
export async function checkPassword(password, stored) {
  const [, , salt, h] = String(stored || '').split('$');
  if (!salt || !h) return false;
  const d = await derive(password, salt);
  let diff = d.length ^ h.length;
  for (let i = 0; i < Math.min(d.length, h.length); i++) diff |= d.charCodeAt(i) ^ h.charCodeAt(i);
  return diff === 0;
}

const COOKIE = 'ab_session';
export function readCookie(request, name = COOKIE) {
  const c = request.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
export async function createSession(env, userId) {
  const token = rid('', 32);
  const expires = Date.now() + 30 * 864e5;
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, ?)').bind(token, userId, expires).run();
  await env.DB.prepare('DELETE FROM sessions WHERE expires < ?').bind(Date.now()).run();
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
export async function endSession(env, request) {
  const t = readCookie(request);
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(t).run();
}
export async function currentUser(env, request) {
  const t = readCookie(request);
  if (!t) return null;
  const r = await env.DB.prepare(`SELECT u.id, u.email, u.name, u.role, u.active, s.expires FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).bind(t).first();
  if (!r || !r.active || r.expires < Date.now()) return null;
  return { id: r.id, email: r.email, name: r.name, role: r.role };
}

// What each role may do.
export const ROLES = {
  owner: { label: 'Owner', can: ['*'] },
  manager: { label: 'Manager', can: ['trips.edit', 'trips.view', 'bookings.view', 'bookings.edit', 'money.view', 'leads.view', 'leads.edit', 'coupons.edit', 'site.edit', 'activity.view'] },
  sales: { label: 'Sales', can: ['trips.view', 'bookings.view', 'bookings.edit', 'money.view', 'leads.view', 'leads.edit'] },
  lead: { label: 'Trip lead', can: ['trips.view', 'bookings.view'] },
};
export const can = (user, perm) => !!user && !!ROLES[user.role] && (ROLES[user.role].can.includes('*') || ROLES[user.role].can.includes(perm));
