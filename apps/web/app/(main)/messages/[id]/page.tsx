'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { apiRequest } from '@/lib/api/client';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string };
}

interface ConversationInfo {
  id: string;
  property: { id: string; title: string };
  otherUser: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [convInfo, setConvInfo] = useState<ConversationInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentUserId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('afristay_user') || '{}').id : null;

  // Charger les messages
  useEffect(() => {
    if (!id) return;
    
    // Charger la liste des conversations pour trouver l'autre utilisateur et le logement
    apiRequest<ConversationInfo[]>('/api/messages/conversations').then(convs => {
      const current = convs.find(c => c.id === id);
      if (current) setConvInfo(current);
    });

    // Charger les messages
    apiRequest<Message[]>(`/api/messages/conversations/${id}`)
      .then(setMessages)
      .catch(() => router.push('/messages'))
      .finally(() => setLoading(false));
  }, [id, router]);

  // Scroll en bas quand les messages changent
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const token = localStorage.getItem('afristay_token');
    if (!token) return;

    try {
      const sent = await apiRequest<Message>(`/api/messages/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: { content: newMessage }
      });
      setMessages(prev => [...prev, sent]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-[68px] h-[calc(100vh-68px)] flex flex-col" style={{ background: 'var(--bg)' }}>
        {/* Header */}
        <div className="bg-white border-b border-[var(--border)] px-6 py-4 flex items-center gap-4 shrink-0">
          <button onClick={() => router.push('/messages')} className="text-[var(--text-sec)] hover:text-[var(--text)]">
            <i className="fa-solid fa-arrow-left text-lg" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            {convInfo?.otherUser?.firstName?.[0] || '?'}
          </div>
          <div>
            <p className="font-semibold text-sm">{convInfo?.otherUser?.firstName} {convInfo?.otherUser?.lastName}</p>
            <p className="text-xs text-[var(--text-sec)] truncate max-w-[200px]">{convInfo?.property?.title}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-2xl text-[var(--text-ter)]" /></div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender.id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-white border border-[var(--border)] text-[var(--text)] rounded-bl-md'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70 text-right' : 'text-[var(--text-ter)]'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-[var(--border)] p-4 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 px-4 py-3 border border-[var(--border)] rounded-full outline-none focus:border-primary text-sm bg-[var(--bg)]"
            />
            <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 transition-colors shrink-0">
              <i className="fa-solid fa-paper-plane text-sm" />
            </button>
          </form>
        </div>
      </main>
    </>
  );
}