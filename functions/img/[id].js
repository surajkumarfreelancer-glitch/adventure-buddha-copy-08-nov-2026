import { ensureSchema } from '../../lib/db.js';
export async function onRequestGet({ env, params }) {
  await ensureSchema(env);
  const r = await env.DB.prepare('SELECT type, data FROM images WHERE id = ?').bind(String(params.id).replace(/\.\w+$/, '')).first();
  if (!r) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(r.data), { headers: { 'content-type': r.type || 'image/webp', 'cache-control': 'public, max-age=31536000, immutable' } });
}
