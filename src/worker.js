// Cloudflare Workers entry point. Routes requests to the same handlers used by Pages Functions.
import { onRequest as middleware } from '../functions/_middleware.js';
import { onRequestGet as home } from '../functions/index.js';
import { onRequestGet as tours } from '../functions/tours/index.js';
import { onRequestGet as tourIndex } from '../functions/tour/index.js';
import { onRequestGet as tour } from '../functions/tour/[slug].js';
import { onRequestGet as textPage } from '../functions/p/[page].js';
import { onRequestGet as sitemap } from '../functions/sitemap.xml.js';
import { onRequestGet as robots } from '../functions/robots.txt.js';
import { onRequestGet as image } from '../functions/img/[id].js';
import { onRequest as api } from '../functions/api/[[path]].js';

const notAllowed = () => new Response('Method not allowed', { status: 405 });

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const get = request.method === 'GET' || request.method === 'HEAD';
  let m;
  if (path.startsWith('/api/')) return api({ request, env, params: { path: path.slice(5).split('/').filter(Boolean).map(decodeURIComponent) } });
  if (path === '/') return get ? home({ request, env }) : notAllowed();
  if (path === '/tours' || path === '/tours/') return get ? tours({ request, env }) : notAllowed();
  if (path === '/tour' || path === '/tour/') return tourIndex({ request, env });
  if ((m = path.match(/^\/tour\/([^/]+)\/?$/))) return get ? tour({ request, env, params: { slug: decodeURIComponent(m[1]) } }) : notAllowed();
  if ((m = path.match(/^\/p\/([^/]+)\/?$/))) return get ? textPage({ request, env, params: { page: decodeURIComponent(m[1]) } }) : notAllowed();
  if (path === '/sitemap.xml') return sitemap({ request, env });
  if (path === '/robots.txt') return robots({ request, env });
  if ((m = path.match(/^\/img\/([^/]+)$/))) return image({ request, env, params: { id: m[1] } });
  if (path === '/admin') return Response.redirect(url.origin + '/admin/', 301);
  const res = await env.ASSETS.fetch(request);
  if (res.status === 404) return new Response('<!doctype html><meta name="viewport" content="width=device-width"><p style="font-family:system-ui;padding:40px">Page not found. <a href="/">Go to the home page</a></p>', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  return res;
}

export default {
  fetch(request, env) {
    return middleware({ request, env, next: () => route(request, env) });
  },
};
