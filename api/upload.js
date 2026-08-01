import supabase from './db-client.js';

const ADMIN_EMAIL = 'portfolio.owner@example.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || authData.user?.email?.toLowerCase() !== ADMIN_EMAIL) return res.status(401).json({ error: 'Owner access required' });
    const { fileName, fileBase64, contentType } = req.body;
    if (!fileBase64 || !contentType || (!contentType.startsWith('image/') && !contentType.startsWith('video/'))) return res.status(400).json({ error: 'A valid image or video is required' });
    const safeName = String(fileName || 'media').replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${Date.now()}-${safeName}`;
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'File must be smaller than 4 MB' });
    const { error } = await supabase.storage.from('portfolio-media').upload(path, buffer, { contentType, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('portfolio-media').getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl });
  } catch (err) {
    console.error('Upload API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
