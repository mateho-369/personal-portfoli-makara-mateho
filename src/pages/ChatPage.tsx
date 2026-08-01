import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, FileText, Inbox, LoaderCircle, MessageCircle, Paperclip, Search, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import type { Conversation, Message, Profile } from '../types';
import LoadingState from '../components/LoadingState';

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
}

function relativeTime(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function ChatPage() {
  const { user, session, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const headers = useCallback(() => ({ Authorization: `Bearer ${session?.access_token}` }), [session]);
  const fetchMessages = useCallback(async (conversationId: number) => {
    const res = await fetch(`/api/messages?conversationId=${conversationId}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load messages.');
    setMessages(data);
  }, [headers]);

  const fetchConversations = useCallback(async () => {
    if (!session || !user) return;
    try {
      const res = await fetch('/api/conversations', { headers: headers() });
      let data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not open conversations.');
      if (!isAdmin && data.length === 0) {
        const createRes = await fetch('/api/conversations', { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const created = await createRes.json();
        if (!createRes.ok) throw new Error(created.error || 'Could not begin a conversation.');
        data = [created];
      }
      setConversations(data);
      setSelected((current) => current ? data.find((item: Conversation) => item.id === current.id) || data[0] || null : data[0] || null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not open conversations.'); }
    finally { setLoading(false); }
  }, [headers, isAdmin, session, user]);

  useEffect(() => { fetch('/api/profile').then((res) => res.json()).then(setProfile).catch(() => null); fetchConversations(); }, [fetchConversations]);
  useEffect(() => { if (selected) fetchMessages(selected.id).catch((err) => setError(err.message)); else setMessages([]); }, [selected?.id, fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!selected) return;
    const channel = supabase.channel(`messages-${selected.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selected.id}` }, () => fetchMessages(selected.id)).subscribe();
    const poll = window.setInterval(() => fetchMessages(selected.id).catch(() => null), 6000);
    return () => { supabase.removeChannel(channel); window.clearInterval(poll); };
  }, [selected?.id, fetchMessages]);

  const chooseConversation = async (conversation: Conversation) => {
    setSelected(conversation);
    if (isAdmin && conversation.unread_count > 0) {
      await fetch('/api/conversations', { method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ id: conversation.id, unread_count: 0 }) });
      fetchConversations();
    }
  };

  const send = async () => {
    if (!selected || (!draft.trim() && !attachment)) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: selected.id, body: draft.trim(), attachment_url: attachment || null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The message could not be sent.');
      setDraft(''); setAttachment(''); await fetchMessages(selected.id); await fetchConversations();
    } catch (err) { setError(err instanceof Error ? err.message : 'The message could not be sent.'); }
    finally { setSending(false); }
  };

  const uploadAttachment = async (file?: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return setError('Attachments must be smaller than 4 MB.');
    setUploading(true); setError('');
    try {
      const fileBase64 = await fileToBase64(file);
      const res = await fetch('/api/chat-upload', { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileBase64, contentType: file.type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Attachment upload failed.');
      setAttachment(data.url);
    } catch (err) { setError(err instanceof Error ? err.message : 'Attachment upload failed.'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  if (loading) return <LoadingState label="Finding your letters…" />;
  const visibleConversations = conversations.filter((item) => `${item.visitor_name} ${item.visitor_email}`.toLowerCase().includes(search.toLowerCase()));
  const otherName = isAdmin ? selected?.visitor_name : profile?.display_name;

  return (
    <div className="page-shell py-6 md:py-10">
      <div className="mb-7 flex items-end justify-between"><div><p className="eyebrow"><MessageCircle size={13} /> Personal letters</p><h1 className="mt-3 font-serif text-4xl tracking-tight">{isAdmin ? 'Your inbox' : 'A quiet conversation'}</h1></div>{isAdmin && <span className="hidden rounded-full bg-[#D9A441]/14 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.14em] text-[#8A611E] sm:block">{conversations.reduce((sum, item) => sum + item.unread_count, 0)} unread</span>}</div>
      {error && <div className="mb-4 rounded-xl bg-[#D9A441]/12 px-4 py-3 text-sm text-[#7C5922]">{error}</div>}
      <div className={`chat-shell ${isAdmin ? 'admin-chat-shell' : 'visitor-chat-shell'}`}>
        {isAdmin && (
          <aside className={`${selected ? 'hidden md:flex' : 'flex'} min-h-[650px] flex-col border-r border-[#6E7C52]/12 bg-[#F4F1E6] md:flex`}>
            <div className="p-4"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#778071]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field !py-2.5 !pl-10" placeholder="Search people" /></div></div>
            <div className="flex-1 overflow-y-auto px-2 pb-3">
              {visibleConversations.length ? visibleConversations.map((conversation) => <button key={conversation.id} onClick={() => chooseConversation(conversation)} className={`conversation-row ${selected?.id === conversation.id ? 'conversation-row-active' : ''}`}><span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#6E7C52]/12 font-serif text-[#52623F]">{conversation.avatar_url ? <img src={conversation.avatar_url} alt="" className="h-full w-full object-cover" /> : conversation.visitor_name.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1 text-left"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm font-medium">{conversation.visitor_name}</strong><time className="font-mono text-[9px] text-[#7A8275]">{relativeTime(conversation.last_message_at)}</time></span><span className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-xs text-[#737B6F]">{conversation.visitor_email}</span>{conversation.unread_count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-[#D9A441] px-1.5 py-0.5 font-mono text-[8px] text-[#F8F4E9]">{conversation.unread_count}</span>}</span></span></button>) : <div className="px-4 py-16 text-center text-[#7A8275]"><Inbox className="mx-auto" size={23} /><p className="mt-3 text-sm">No letters yet.</p></div>}
            </div>
          </aside>
        )}

        <section className={`${isAdmin && !selected ? 'hidden md:flex' : 'flex'} min-h-[650px] flex-col bg-[#F8F4E9]`}>
          {selected ? <>
            <header className="flex h-[76px] items-center gap-3 border-b border-[#6E7C52]/10 px-4 sm:px-6">{isAdmin && <button className="icon-button md:hidden" onClick={() => setSelected(null)}><ArrowLeft size={18} /></button>}<span className="grid h-10 w-10 place-items-center rounded-full bg-[#D9A441]/14 font-serif text-[#8A611E]">{otherName?.charAt(0) || 'F'}</span><div><h2 className="font-serif text-lg">{otherName || 'Your conversation'}</h2><p className="mt-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.13em] text-[#6D7868]"><span className="h-1.5 w-1.5 rounded-full bg-[#5C7A89]" /> Here in the quiet</p></div></header>
            <div className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(217,164,65,.055),transparent_42%)] p-4 sm:p-7">
              {messages.length === 0 && <div className="mx-auto max-w-sm py-20 text-center"><MessageCircle className="mx-auto text-[#6E7C52]" size={25} /><h3 className="mt-4 font-serif text-2xl">Begin with a simple hello.</h3><p className="mt-2 text-sm leading-relaxed text-[#737B6F]">This is a small, private space for a thoughtful conversation.</p></div>}
              <AnimatePresence initial={false}>{messages.map((message) => {
                const mine = message.sender_id === user?.id;
                return <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] sm:max-w-[68%] ${mine ? 'text-right' : 'text-left'}`}><div className={`message-bubble ${mine ? 'message-mine' : 'message-theirs'}`}>{message.body && <p className="whitespace-pre-wrap">{message.body}</p>}{message.attachment_url && <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-lg bg-[#F8F4E9]/50 p-2 text-sm underline"><FileText size={16} /> View attachment</a>}</div><time className="mt-1.5 block px-1 font-mono text-[8px] uppercase tracking-[.1em] text-[#858C81]">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div></motion.div>;
              })}</AnimatePresence><div ref={bottomRef} />
            </div>
            <div className="border-t border-[#6E7C52]/10 p-3 sm:p-5">{attachment && <div className="mb-2 flex items-center justify-between rounded-lg bg-[#6E7C52]/8 px-3 py-2 text-xs text-[#596354]"><span className="flex items-center gap-2"><FileText size={14} /> Attachment ready</span><button onClick={() => setAttachment('')}>Remove</button></div>}<div className="flex items-end gap-2 rounded-2xl border border-[#6E7C52]/15 bg-[#EEF2EA]/70 p-2 focus-within:border-[#6E7C52]/40"><input ref={fileRef} type="file" className="hidden" onChange={(event) => uploadAttachment(event.target.files?.[0])} /><button onClick={() => fileRef.current?.click()} disabled={uploading} className="icon-button shrink-0" aria-label="Attach a file">{uploading ? <LoaderCircle className="animate-spin" size={17} /> : <Paperclip size={17} />}</button><textarea rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[#92988E]" placeholder="Write something kind…" /><button onClick={send} disabled={sending || (!draft.trim() && !attachment)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D9A441] text-[#F8F4E9] shadow-sm transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40" aria-label="Send message">{sending ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={16} />}</button></div></div>
          </> : <div className="hidden flex-1 flex-col items-center justify-center text-center md:flex"><Inbox size={28} className="text-[#6E7C52]" /><h2 className="mt-4 font-serif text-2xl">Choose a conversation</h2><p className="mt-2 text-sm text-[#737B6F]">Open a letter from the list to begin.</p></div>}
        </section>
      </div>
    </div>
  );
}
