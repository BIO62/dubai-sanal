import { Readable } from 'node:stream';
import { getAuto } from './_lib.js';

// Serves images from a Private Blob store. Each upload has a unique pathname,
// so the response can be cached for a long time.
export default async function handler(req, res) {
  const p = String((req.query && req.query.p) || '');
  if (!/^img\/[\w.\-]+$/.test(p)) return res.status(400).end('bad path');
  try {
    const r = await getAuto(p);
    if (!r || !r.stream) return res.status(404).end('not found');
    res.setHeader('Content-Type', (r.blob && r.blob.contentType) || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    Readable.fromWeb(r.stream).pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).end('error');
  }
}
