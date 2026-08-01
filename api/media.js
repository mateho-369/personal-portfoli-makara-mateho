import supabase from './db-client.js';

const ADMIN_EMAIL = 'portfolio.owner@example.com';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await getUser(req);
    const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;
    if (req.method === 'GET') {
      let query = supabase.from('portfolio_media').select('*').order('captured_at', { ascending: false });
      if (req.query.manage === 'true') {
        if (!isAdmin) return res.status(401).json({ error: 'Owner access required' });
      } else query = query.eq('is_public', true);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (!isAdmin) return res.status(401).json({ error: 'Owner access required' });
    if (req.method === 'POST') {
      const { title, description, media_type, category, thumbnail_url, media_url, size_label, aspect_ratio, captured_at, is_favorite, is_public } = req.body;
      if (!title?.trim() || !media_url) return res.status(400).json({ error: 'Title and media URL are required' });
      const { data, error } = await supabase.from('portfolio_media').insert({ title: title.trim(), description: description || '', media_type, category: category || 'Field Notes', thumbnail_url: thumbnail_url || media_url, media_url, size_label: size_label || '—', aspect_ratio: aspect_ratio || 'landscape', captured_at: captured_at || new Date().toISOString(), is_favorite: Boolean(is_favorite), is_public: is_public !== false }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...values } = req.body;
      if (!id) return res.status(400).json({ error: 'Media id is required' });
      const allowed = ['title', 'description', 'category', 'is_favorite', 'is_public'];
      const patch = Object.fromEntries(Object.entries(values).filter(([key]) => allowed.includes(key)));
      const { data, error } = await supabase.from('portfolio_media').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Media id is required' });
      const { error } = await supabase.from('portfolio_media').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Media API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
