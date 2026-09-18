// Password gate.
//
// The password itself lives only in the GAME_PASSWORD environment variable on
// Vercel. Nothing secret is committed here: both this gate and /api/login
// derive the same cookie value from that variable independently, so the repo
// can stay public.

export const config = {
  // Everything is gated except the login page and the endpoint that checks it.
  matcher: ['/((?!api/login|login\\.html).*)'],
};

const STAMP = 'the-mission-gate-v1';

async function expectedToken(secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(STAMP));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function middleware(request) {
  const secret = process.env.GAME_PASSWORD;

  // Fail closed, and say why, rather than quietly serving the game to everyone.
  if (!secret) {
    return new Response(
      'GAME_PASSWORD is not set on this deployment. Add it in Vercel > Settings > Environment Variables and redeploy.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }

  const cookie = request.headers.get('cookie') || '';
  const match = /(?:^|;\s*)cva_auth=([a-f0-9]{64})/.exec(cookie);
  if (match && sameString(match[1], await expectedToken(secret))) return;

  const url = new URL(request.url);
  url.pathname = '/login.html';
  url.search = '';
  return Response.redirect(url, 302);
}
