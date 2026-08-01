import supabase from './db-client.js';

const ADMIN_EMAIL = 'portfolio.owner@example.com';

async function authenticate(req) {
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
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Please sign in first' });
    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
    if (req.method === 'GET') {
      let query = supabase.from('portfolio_conversations').select('*').order('last_message_at', { ascending: false });
      if (!isAdmin) query = query.eq('visitor_id', user.id);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      if (isAdmin) return res.status(400).json({ error: 'Owner conversations begin when a visitor writes' });
      const { data: existing, error: findError } = await supabase.from('portfolio_conversations').select('*').eq('visitor_id', user.id).limit(1).maybeSingle();
      if (findError) throw findError;
      if (existing) return res.status(200).json(existing);
      const visitorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'New friend';
      const { data, error } = await supabase.from('portfolio_conversations').insert({ visitor_id: user.id, visitor_name: visitorName, visitor_email: user.email || '', avatar_url: user.user_metadata?.avatar_url || null, status: 'open', unread_count: 0, last_message_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      if (!isAdmin) return res.status(401).json({ error: 'Owner access required' });
      const { id, unread_count, status } = req.body;
      if (!id) return res.status(400).json({ error: 'Conversation id is required' });
      const patch = {};
      if (Number.isInteger(unread_count)) patch.unread_count = unread_count;
      if (typeof status === 'string') patch.status = status;
      const { data, error } = await supabase.from('portfolio_conversations').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Conversations API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
