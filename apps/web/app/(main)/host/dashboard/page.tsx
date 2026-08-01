'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';
import { formatPrice } from '@/lib/utils/format-price';

interface Booking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  hostPayout: number;
  status: string;
  createdAt: string;
  traveler: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  property: { id: string; title: string; images: { url: string }[] };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Nouvelle demande', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED: { label: 'Confirmée', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  COMPLETED: { label: 'Terminée', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  CANCELLED: { label: 'Annulée', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export default function HostDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('afristay_token');
    if (!token) return;

    apiRequest<Booking[]>('/api/bookings/received', { token })
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Calcul des statistiques
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const validBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
  const totalRevenue = validBookings.reduce((sum, b) => sum + (b.hostPayout || 0), 0);
  
  const monthlyBookings = bookings.filter(b => {
    const d = new Date(b.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

    async function handleAction(bookingId: string, action: 'accept' | 'reject') {
    const token = localStorage.getItem('afristay_token');
    if (!token) return;
    try {
      await apiRequest(`/api/bookings/${bookingId}/${action}`, { method: 'PATCH', token });
      // On met à jour la liste localement sans recharger toute la page
      setBookings(prev => prev.map(b => 
        b.id === bookingId 
          ? { ...b, status: action === 'accept' ? 'CONFIRMED' : 'CANCELLED' } 
          : b
      ));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold mb-2">Tableau de bord</h1>
          <p className="text-[var(--text-sec)] mb-8">Vue d'ensemble de vos activitées.</p>

          {/* Cartes Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
              <p className="text-sm text-[var(--text-sec)] mb-1">Revenus totaux</p>
              <p className="text-3xl font-extrabold text-primary">{formatPrice(totalRevenue)}</p>
              <p className="text-xs text-[var(--text-ter)] mt-2">Sur vos logements validés</p>
            </div>
            <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
              <p className="text-sm text-[var(--text-sec)] mb-1">Réservations ce mois</p>
              <p className="text-3xl font-extrabold">{monthlyBookings.length}</p>
              <p className="text-xs text-[var(--text-ter)] mt-2">{now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
              <p className="text-sm text-[var(--text-sec)] mb-1">Demandes totales</p>
              <p className="text-3xl font-extrabold">{bookings.length}</p>
              <p className="text-xs text-[var(--text-ter)] mt-2">Toutes périodes confondues</p>
            </div>
          </div>

          {/* Liste des réservations reçues */}
          <h2 className="text-lg font-bold mb-4">Dernières réservations reçues</h2>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[var(--border)]">
              <i className="fa-solid fa-calendar-xmark text-5xl text-[var(--text-ter)] mb-4 block" />
              <p className="text-lg font-medium mb-2">Aucune réservation reçue</p>
              <p className="text-sm text-[var(--text-sec)]">Dès qu'un voyageur réserve un de vos logements, il apparaîtra ici.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                const imageUrl = booking.property.images[0]?.url || `https://picsum.photos/seed/${booking.property.id}/100/100`;

                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-[var(--border)] p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
                    {/* Photo du voyageur */}
                    <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
                      {booking.traveler.avatarUrl ? (
                        <img src={booking.traveler.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        booking.traveler.firstName[0]
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{booking.traveler.firstName} {booking.traveler.lastName}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${status.color} ${status.bg}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-sec)] truncate">
                        pour <span className="font-medium text-[var(--text)]">{booking.property.title}</span>
                      </p>
                      <p className="text-xs text-[var(--text-ter)] mt-1">
                        {new Date(booking.checkInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(booking.checkOutDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    {/* Prix + Actions */}
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-lg">{formatPrice(booking.totalAmount)}</p>
                      <p className="text-xs text-[var(--text-ter)] mb-3">Vous recevez {formatPrice(booking.hostPayout || 0)}</p>
                      
                      {booking.status === 'PENDING' && (
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleAction(booking.id, 'reject')}
                            className="px-3 py-1.5 text-xs font-bold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Refuser
                          </button>
                          <button 
                            onClick={() => handleAction(booking.id, 'accept')}
                            className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accepter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}