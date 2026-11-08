// Old TravStack links like /tour/?id=... go to the trips list.
export const onRequestGet = ({ request }) => Response.redirect(new URL('/tours/', request.url).toString(), 301);
