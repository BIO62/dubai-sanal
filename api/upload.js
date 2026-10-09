import { checkKey, readBody, noStore, putAuto, imageUrl } from './_lib.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!checkKey(req)) return res.status(401).json({ error: 'bad_key' });
  try {
    const body = readBody(req);
    const m = /^data:(image\/[a-z]+);base64,(.+)$/i.exec((body && body.dataUrl) || '');
    if (!m || !TYPES[m[1].toLowerCase()]) return res.status(400).json({ error: 'bad_image' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 3_500_000) return res.status(413).json({ error: 'too_large' });
    const type = m[1].toLowerCase();
    const blob = await putAuto(`img/${Date.now()}.${TYPES[type]}`, buf, {
      contentType: type,
      addRandomSuffix: true,
    });
    return res.status(200).json({ url: imageUrl(blob) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server', message: String(e && e.message || e) });
  }
}
