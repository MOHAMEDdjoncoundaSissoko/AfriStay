'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';
import Link from 'next/link';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  reply: string | null;
  createdAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const userStr = localStorage.getItem('afristay_user');
        const userId = userStr ? JSON.parse(userStr).id : null;
        
        if (userId) {
          const data = await apiRequest<Ticket[]>(`/api/contact?userId=${userId}`);
          setTickets(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-[100px] min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Mes demandes</h1>
              <p className="text-[var(--text-sec)] text-sm mt-1">Retrouvez l&apos;historique de vos messages et nos réponses.</p>
            </div>
            <Link href="/contact" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition">
              Nouvelle demande
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20 text-[var(--text-ter)]">Chargement...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
              <i className="fa-regular fa-comments text-4xl text-[var(--text-ter)] mb-4" />
              <p className="font-semibold">Aucune demande pour le moment</p>
              <p className="text-sm text-[var(--text-sec)] mt-1">Besoin d&apos;aide ? N&apos;hésitez pas à nous contacter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold">{ticket.subject}</h3>
                    {ticket.reply ? (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Répondu</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">En attente</span>
                    )}
                  </div>
                  
                  <div className="bg-[var(--bg)] p-4 rounded-lg text-sm text-[var(--text-sec)] mb-4">
                    {ticket.message}
                  </div>

                  {ticket.reply && (
                    <div className="border-l-4 border-primary pl-4">
                      <p className="text-xs font-bold text-primary mb-1">Réponse d'AfriStay :</p>
                      <p className="text-sm text-[var(--text)] leading-relaxed">{ticket.reply}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-[var(--text-ter)] mt-4 text-right">
                    Envoyé le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}