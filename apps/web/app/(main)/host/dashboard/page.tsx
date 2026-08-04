'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';
import { formatPrice } from '@/lib/utils/format-price';

type Tab = 'properties' | 'bookings';

interface Property {
  id: string;
  title: string;
  status: string;
  pricePerNight: number;
  city: { name: string };
  images: { url: string }[];
}

interface Booking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  hostPayout: number;
  status: string;
  traveler: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  property: { id: string; title: string; images: { url: string }[] };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Nouvelle demande', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED: { label: 'Confirmée', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  REJECTED: { label: 'Refusée', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  COMPLETED: { label: 'Terminée', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  CANCELLED: { label: 'Annulée', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
  PUBLISHED: { label: 'En ligne', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  DRAFT: { label: 'Brouillon', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
};

export default function HostDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('afristay_token');
    if (!token) return;

    Promise.all([
      apiRequest<Property[]>('/api/properties/mine', { token }),
      apiRequest<Booking[]>('/api/bookings/received', { token }),
    ]).then(([props, books]) => {
      setProperties(props);
      setBookings(books);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleDeleteProperty(id: string) {
    if (!confirm('Es-tu sûr de vouloir supprimer ce logement ? Cette action est irréversible.')) return;
    const token = localStorage.getItem('afristay_token');
    try {
      await apiRequest(`/api/properties/${id}`, { method: 'DELETE', token });
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    }
  }

  async function handleAccept(bookingId: string) {
    setActionLoading(bookingId);
    const token = localStorage.getItem('afristay_token');
    try {
      await apiRequest(`/api/bookings/${bookingId}/accept`, { method: 'PATCH', token });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b)),
      );
    } catch {
      alert('Erreur lors de l\'acceptation');
    }
    setActionLoading(null);
  }

  async function handleReject(bookingId: string) {
    if (!confirm('Es-tu sûr de vouloir refuser cette réservation ?')) return;
    setActionLoading(bookingId);
    const token = localStorage.getItem('afristay_token');
    try {
      await apiRequest(`/api/bookings/${bookingId}/reject`, { method: 'PATCH', token });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'REJECTED' } : b)),
      );
    } catch {
      alert('Erreur lors du refus');
    }
    setActionLoading(null);
  }

  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.hostPayout || 0), 0);

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold mb-2">Tableau de bord</h1>
          
          <div className="flex gap-4 border-b border-[var(--border)] mb-8">
            <button
              onClick={() => setActiveTab('properties')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'properties' ? 'border-primary text-primary' : 'border-transparent text-[var(--text-sec)] hover:text-[var(--text)]'}`}
            >
              Mes logements ({properties.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'bookings' ? 'border-primary text-primary' : 'border-transparent text-[var(--text-sec)] hover:text-[var(--text)]'}`}
            >
              Réservations ({bookings.length})
            </button>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
            </div>
          ) : activeTab === 'properties' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Mes annonces</h2>
                <Link href="/host/become-host?edit=new" className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors">
                  + Créer un logement
                </Link>
              </div>
              {properties.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[var(--border)]">
                  <i className="fa-solid fa-house-circle-xmark text-5xl text-[var(--text-ter)] mb-4 block" />
                  <p className="text-lg font-medium mb-2">Aucun logement</p>
                  <Link href="/host/become-host" className="text-primary hover:underline text-sm">Créer votre première annonce</Link>
                </div>
              ) : (
                properties.map((prop) => (
                  <div key={prop.id} className="bg-white rounded-2xl border border-[var(--border)] p-4 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <img 
                      src={prop.images[0]?.url || `https://picsum.photos/seed/${prop.id}/200/150`} 
                      alt="" 
                      className="w-24 h-20 rounded-xl object-cover shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{prop.title}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_CONFIG[prop.status]?.bg || 'bg-gray-50 border-gray-200'} ${STATUS_CONFIG[prop.status]?.color || 'text-gray-700'}`}>
                          {STATUS_CONFIG[prop.status]?.label || prop.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-ter)]">{prop.city.name} · {formatPrice(prop.pricePerNight)} / nuit</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link 
                        href={`/host/become-host?edit=${prop.id}`} 
                        className="px-3 py-1.5 text-xs font-bold border border-[var(--border)] rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Modifier
                      </Link>
                      <button 
                        onClick={() => handleDeleteProperty(prop.id)}
                        className="px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
                  <p className="text-sm text-[var(--text-sec)] mb-1">Revenus totaux</p>
                  <p className="text-3xl font-extrabold text-primary">{formatPrice(totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
                  <p className="text-sm text-[var(--text-sec)] mb-1">Demandes totales</p>
                  <p className="text-3xl font-extrabold">{bookings.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
                  <p className="text-sm text-[var(--text-sec)] mb-1">Logements actifs</p>
                  <p className="text-3xl font-extrabold">{properties.length}</p>
                </div>
              </div>
              <h2 className="text-lg font-bold mb-4">Dernières réservations reçues</h2>
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                  const imageUrl = booking.property.images[0]?.url || `https://picsum.photos/seed/${booking.property.id}/100/100`;
                  const isLoading = actionLoading === booking.id;
                  const isPending = booking.status === 'PENDING';
                  return (
                    <div key={booking.id} className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow ${isPending ? 'border-amber-200' : 'border-[var(--border)]'}`}>
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
                          {booking.traveler.avatarUrl ? <img src={booking.traveler.avatarUrl} alt="" className="w-full h-full object-cover" /> : booking.traveler.firstName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{booking.traveler.firstName} {booking.traveler.lastName}</span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${status.color} ${status.bg}`}>{status.label}</span>
                          </div>
                          <p className="text-sm text-[var(--text-sec)] truncate">pour <span className="font-medium text-[var(--text)]">{booking.property.title}</span></p>
                          <p className="text-xs text-[var(--text-ter)] mt-1">{new Date(booking.checkInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(booking.checkOutDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-lg">{formatPrice(booking.totalAmount)}</p>
                          <p className="text-xs text-[var(--text-ter)]">Vous recevez {formatPrice(booking.hostPayout || 0)}</p>
                        </div>
                      </div>
                      {isPending && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => handleAccept(booking.id)}
                            disabled={isLoading}
                            className="flex-1 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {isLoading ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-check mr-2" />Accepter</>}
                          </button>
                          <button
                            onClick={() => handleReject(booking.id)}
                            disabled={isLoading}
                            className="flex-1 py-2.5 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {isLoading ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-times mr-2" />Refuser</>}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}