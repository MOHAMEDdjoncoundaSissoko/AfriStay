'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { apiFetch } from '@/lib/api/client';

interface Conversation {
  id: string;
  property: { id: string; title: string; images: { url: string }[] };
  otherUser: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  lastMessage: { content: string; createdAt: string } | null;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/messages/conversations')
      .then((data: any) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Messages</h1>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-sec)]">
              <i className="fa-regular fa-comments text-5xl mb-4 block" />
              <p className="text-lg font-medium">Aucun message pour le moment</p>
              <p className="text-sm mt-1">Contactez un hôte depuis la page d'un logement</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
              {conversations.map((conv) => (
                <Link key={conv.id} href={`/messages/${conv.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {conv.otherUser?.firstName?.[0] || '?'}
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-sm truncate">{conv.otherUser?.firstName} {conv.otherUser?.lastName}</span>
                      {conv.lastMessage && (
                        <span className="text-xs text-[var(--text-ter)] shrink-0 ml-2">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-sec)] truncate">{conv.property.title}</p>
                    {conv.lastMessage && (
                      <p className="text-xs text-[var(--text-ter)] truncate mt-0.5">{conv.lastMessage.content}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}