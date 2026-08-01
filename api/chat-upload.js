import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return res.status(401).json({ error: 'Please sign in first' });
    const { fileName, fileBase64, contentType } = req.body;
    if (!fileBase64 || !contentType) return res.status(400).json({ error: 'A file is required' });
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'File must be smaller than 4 MB' });
    const safeName = String(fileName || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${authData.user.id}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('chat-attachments').upload(path, buffer, { contentType, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl });
  } catch (err) {
    console.error('Chat upload API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
