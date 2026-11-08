import { isTrial } from '../lib/pages.js';

export async function onRequest({ request, env, next }) {
  let res;
  try {
    res = await next();
  } catch (e) {
    if (String(e && e.message) === 'NO_DB') {
      return new Response('Setup needed: connect the D1 database to this Pages project with the binding name DB (see SETUP.md).', { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    console.error(e);
    const api = new URL(request.url).pathname.startsWith('/api/');
    return api ? new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), { status: 500, headers: { 'content-type': 'application/json' } })
      : new Response('Something went wrong. Please refresh the page.', { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  res = new Response(res.body, res);
  res.headers.set('x-content-type-options', 'nosniff');
  res.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  res.headers.set('x-frame-options', 'SAMEORIGIN');
  if (isTrial(env)) res.headers.set('x-robots-tag', 'noindex, nofollow');
  return res;
}
