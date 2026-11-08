import { renderHome } from '../lib/pages.js';
export const onRequestGet = ({ env, request }) => renderHome(env, request);
