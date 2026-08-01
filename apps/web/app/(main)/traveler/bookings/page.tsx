'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';
import { formatPrice } from '@/lib/utils/format-price';

interface Booking {
  id: string;
  bookingNumber: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: { name: string };
    country: { name: string; flagEmoji: string };
    images: { url: string }[];
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED: { label: 'Confirmée', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  COMPLETED: { label: 'Terminée', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  CANCELLED: { label: 'Annulée', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export default function TravelerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const token = localStorage.getItem('afristay_token');
    if (!token) return;

    apiRequest<Booking[]>('/api/bookings/mine', { token })
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold mb-2">Mes réservations</h1>
          <p className="text-[var(--text-sec)] mb-8">Retrouvez l'historique et le statut de vos voyages.</p>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-[var(--border)]">
              <i className="fa-solid fa-suitcase-rolling text-5xl text-[var(--text-ter)] mb-4 block" />
              <p className="text-lg font-medium mb-2">Aucune réservation</p>
              <p className="text-sm text-[var(--text-sec)] mb-6">Vous n'avez pas encore de réservation en cours.</p>
              <Link href="/search" className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors">
                Explorer les logements
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86400000);
                const imageUrl = booking.property.images[0]?.url || `https://picsum.photos/seed/${booking.property.id}/400/300`;

                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                    {/* Image */}
                    <Link href={`/property/${booking.property.id}`} className="md:w-64 h-48 md:h-auto shrink-0">
                      <img src={imageUrl} alt={booking.property.title} className="w-full h-full object-cover" />
                    </Link>

                    {/* Contenu */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <Link href={`/property/${booking.property.id}`} className="font-bold text-lg hover:text-primary transition-colors">
                            {booking.property.title}
                          </Link>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ml-4 ${status.color} ${status.bg}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        <p className="text-sm text-[var(--text-sec)] mb-4 flex items-center gap-2">
                          <i className="fa-solid fa-location-dot text-xs" />
                          {booking.property.address}, {booking.property.city.name} {booking.property.country.flagEmoji}
                        </p>

                        <div className="flex gap-6 text-sm mb-4">
                          <div>
                            <span className="text-[var(--text-ter)] block text-xs">Arrivée</span>
                            <span className="font-medium">{new Date(booking.checkInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-ter)] block text-xs">Départ</span>
                            <span className="font-medium">{new Date(booking.checkOutDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-ter)] block text-xs">Durée</span>
                            <span className="font-medium">{nights} nuit{nights > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                        <span className="text-lg font-extrabold">{formatPrice(booking.totalAmount)}</span>
                        <div className="flex gap-2">
                          <Link href={`/messages`} className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-xl hover:bg-gray-50 transition-colors">
                            <i className="fa-regular fa-message mr-1.5" />Message
                          </Link>
                        </div>
                      </div>
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