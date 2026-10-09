import { list } from '@vercel/blob';
import { checkKey, readBody, noStore, putAuto, readText } from './_lib.js';

// Every save is a new file under state/, so the newest one is the current page
// and older ones stay as history.
async function latest() {
  let cursor, all = [];
  do {
    const r = await list({ prefix: 'state/', limit: 1000, cursor });
    all = all.concat(r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  if (!all.length) return null;
  all.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  return all[0];
}

export default async function handler(req, res) {
  noStore(res);
  try {
    if (req.method === 'GET') {
      const b = await latest();
      if (!b) return res.status(404).json({ error: 'empty' });
      const text = await readText(b.pathname);
      if (!text) return res.status(404).json({ error: 'empty' });
      return res.status(200).json({ state: JSON.parse(text), savedAt: b.uploadedAt });
    }
    if (req.method === 'POST') {
      if (!checkKey(req)) return res.status(401).json({ error: 'bad_key' });
      const body = readBody(req);
      if (!body || typeof body.state !== 'object') return res.status(400).json({ error: 'bad_body' });
      const text = JSON.stringify(body.state);
      if (text.length > 3_000_000) return res.status(413).json({ error: 'too_large' });
      await putAuto(`state/${Date.now()}.json`, text, {
        contentType: 'application/json',
        addRandomSuffix: true,
      });
      return res.status(200).json({ ok: true, savedAt: new Date().toISOString() });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server', message: String(e && e.message || e) });
  }
}
