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
    const conversationId = Number(req.method === 'GET' ? req.query.conversationId : req.body.conversation_id);
    if (!conversationId) return res.status(400).json({ error: 'Conversation id is required' });
    const { data: conversation, error: conversationError } = await supabase.from('portfolio_conversations').select('*').eq('id', conversationId).single();
    if (conversationError) throw conversationError;
    if (!isAdmin && conversation.visitor_id !== user.id) return res.status(403).json({ error: 'This conversation is private' });
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('portfolio_messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = String(req.body.body || '').trim();
      const attachmentUrl = req.body.attachment_url || null;
      if (!body && !attachmentUrl) return res.status(400).json({ error: 'Write a message or add an attachment' });
      if (body.length > 3000) return res.status(400).json({ error: 'Please keep messages under 3,000 characters' });
      const { data, error } = await supabase.from('portfolio_messages').insert({ conversation_id: conversationId, sender_id: user.id, sender_role: isAdmin ? 'admin' : 'visitor', body, attachment_url: attachmentUrl, created_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      const unread = isAdmin ? 0 : (conversation.unread_count || 0) + 1;
      const { error: updateError } = await supabase.from('portfolio_conversations').update({ last_message_at: new Date().toISOString(), unread_count: unread }).eq('id', conversationId);
      if (updateError) throw updateError;
      return res.status(201).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Messages API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
