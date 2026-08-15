'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api/client';

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  subject: string;
  message: string;
  reply: string | null;
  createdAt: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);

  useEffect(() => {
    apiRequest('/api/contact').then(setContacts).catch(() => {});
  }, []);

  async function handleReply() {
    if (!selected || !replyText) return;
    setLoadingReply(true);
    try {
      await apiRequest(`/api/contact/${selected.id}/reply`, {
        method: 'PATCH',
        body: { reply: replyText },
      });
      setContacts(contacts.map(c => c.id === selected.id ? { ...c, reply: replyText } : c));
      setSelected({ ...selected, reply: replyText });
      setReplyText('');
    } catch (err) {
      alert("Erreur lors de l'envoi de la réponse.");
    } finally {
      setLoadingReply(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Messages de contact</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Liste des messages */}
        <div className="border border-[var(--border)] rounded-xl bg-[var(--card)] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[var(--border)] font-semibold text-sm bg-[var(--bg-alt)]">
            {contacts.length} Messages
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelected(c); setReplyText(c.reply || ''); }}
                className={`w-full text-left p-4 hover:bg-[var(--bg-alt)] transition ${selected?.id === c.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm">{c.subject}</p>
                  {c.reply ? (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Répondu</span>
                  ) : (
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">En attente</span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-sec)] mt-1 truncate">{c.message}</p>
                <p className="text-[10px] text-[var(--text-ter)] mt-2">{c.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Détail et Réponse */}
        <div className="lg:col-span-2 border border-[var(--border)] rounded-xl bg-[var(--card)] p-6 flex flex-col">
          {selected ? (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selected.subject}</h2>
                  <p className="text-sm text-[var(--text-sec)]">De : {selected.firstName} {selected.lastName} ({selected.email})</p>
                  <p className="text-xs text-[var(--text-ter)] mt-1">Le {new Date(selected.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <div className="bg-[var(--bg)] p-4 rounded-lg text-sm leading-relaxed">
                  {selected.message}
                </div>
                
                {selected.reply && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-xs font-bold text-green-700 mb-2">Votre réponse :</p>
                    <p className="text-sm text-green-900 leading-relaxed">{selected.reply}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Écrivez votre réponse ici..."
                  rows={4}
                  className="w-full p-3 border border-[var(--border)] rounded-lg text-sm outline-none focus:border-primary mb-3 bg-[var(--bg)]"
                />
                <button
                  onClick={handleReply}
                  disabled={loadingReply || !replyText}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {loadingReply ? 'Envoi...' : 'Envoyer la réponse'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-ter)]">
              Sélectionnez un message pour le lire et y répondre
            </div>
          )}
        </div>
      </div>
    </div>
  );
}