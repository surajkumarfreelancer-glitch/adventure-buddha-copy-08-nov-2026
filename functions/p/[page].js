import { renderText } from '../../lib/pages.js';
export const onRequestGet = ({ env, request, params }) => renderText(env, request, String(params.page));
