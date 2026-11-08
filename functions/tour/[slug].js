import { renderTrip } from '../../lib/pages.js';
import { currentUser } from '../../lib/auth.js';
export async function onRequestGet({ env, request, params }) {
  const preview = new URL(request.url).searchParams.has('preview') ? !!(await currentUser(env, request)) : false;
  return renderTrip(env, request, String(params.slug), preview);
}
