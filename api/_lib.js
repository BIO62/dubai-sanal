import crypto from 'node:crypto';

export function checkKey(req) {
  const expected = process.env.EDIT_PASSWORD || '';
  const given = String(req.headers['x-edit-key'] || '');
  if (!expected || !given) return false;
  const a = crypto.createHash('sha256').update(expected).digest();
  const b = crypto.createHash('sha256').update(given).digest();
  return crypto.timingSafeEqual(a, b);
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return null;
}

export function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}
