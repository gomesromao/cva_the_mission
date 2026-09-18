// Checks the submitted password against GAME_PASSWORD and, when it matches,
// hands back the cookie the gate in middleware.js expects.

import { createHmac, timingSafeEqual } from 'node:crypto';

const STAMP = 'the-mission-gate-v1';
const MAX_BODY = 4096;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function expectedToken(secret) {
  return createHmac('sha256', secret).update(STAMP).digest('hex');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function matches(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  const secret = process.env.GAME_PASSWORD;
  if (!secret) {
    res.statusCode = 503;
    res.end('GAME_PASSWORD is not set on this deployment.');
    return;
  }

  let submitted = '';
  try {
    const raw = await readBody(req);
    submitted = new URLSearchParams(raw).get('password') || '';
  } catch {
    submitted = '';
  }

  if (!submitted || !matches(submitted, secret)) {
    // Slow down repeated guesses a little without holding the function open.
    await new Promise((r) => setTimeout(r, 700));
    res.statusCode = 302;
    res.setHeader('location', '/login?e=1');
    res.end();
    return;
  }

  res.statusCode = 302;
  res.setHeader('set-cookie', [
    'cva_auth=' + expectedToken(secret),
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=' + COOKIE_MAX_AGE,
  ].join('; '));
  res.setHeader('location', '/');
  res.end();
}
