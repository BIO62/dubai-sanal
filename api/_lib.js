import crypto from 'node:crypto';
import { put, get } from '@vercel/blob';

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

// Works with both Private and Public Blob stores. Set BLOB_ACCESS to force one;
// otherwise start with private and switch once if the store says otherwise.
let access = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
export function blobAccess() { return access; }

function otherAccessFrom(err) {
  const m = String(err && err.message || err);
  if (/public access on a private store/i.test(m)) return 'private';
  if (/private access on a public store/i.test(m)) return 'public';
  return null;
}

export async function putAuto(pathname, data, opts) {
  try {
    return await put(pathname, data, { ...opts, access });
  } catch (e) {
    const next = otherAccessFrom(e);
    if (!next || next === access) throw e;
    access = next;
    return await put(pathname, data, { ...opts, access });
  }
}

export async function getAuto(pathname) {
  try {
    const r = await get(pathname, { access, useCache: false });
    if (r) return r;
  } catch (e) {
    const next = otherAccessFrom(e);
    if (!next || next === access) throw e;
    access = next;
  }
  return await get(pathname, { access, useCache: false });
}

export async function readText(pathname) {
  const r = await getAuto(pathname);
  if (!r || !r.stream) return null;
  return await new Response(r.stream).text();
}

// URL the page uses for an uploaded image.
export function imageUrl(blob) {
  return access === 'public' ? blob.url : '/api/img?p=' + encodeURIComponent(blob.pathname);
}
