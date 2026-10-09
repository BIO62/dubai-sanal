import { checkKey, noStore } from './_lib.js';

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.EDIT_PASSWORD) return res.status(500).json({ error: 'no_password_set' });
  return checkKey(req) ? res.status(200).json({ ok: true }) : res.status(401).json({ error: 'bad_key' });
}
