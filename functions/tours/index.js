import { renderList } from '../../lib/pages.js';
export const onRequestGet = ({ env, request }) => renderList(env, request);
