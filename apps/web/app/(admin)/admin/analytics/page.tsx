'use client';

import { useEffect, useState } from 'react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function adminFetch(url: string) {
  const token = localStorage.getItem('afristay_token');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

interface Overview {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  activeListings: number;
  pendingBookings: number;
}

interface RevenueDay {
  date: string;
  revenue: number;
}

interface TopProperty {
  property: { id: string; title: string; city: { name: string } | null };
  bookingCount: number;
  totalRevenue: number;
}

interface TopCity {
  name: string;
  country: string;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenue, setRevenue] = useState<RevenueDay[]>([]);
  const [topProperties, setTopProperties] = useState<TopProperty[]>([]);
  const [topCities, setTopCities] = useState<TopCity[]>([]);
  const [statuses, setStatuses] = useState<StatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ov, rev, props, cities, st] = await Promise.all([
          adminFetch('/api/analytics/overview'),
          adminFetch('/api/analytics/revenue?days=30'),
          adminFetch('/api/analytics/top-properties?limit=5'),
          adminFetch('/api/analytics/top-cities?limit=5'),
          adminFetch('/api/analytics/booking-statuses'),
        ]);
        setOverview(ov);
        setRevenue(rev);
        setTopProperties(props);
        setTopCities(cities);
        setStatuses(st);
      } catch (e) {
        console.error('Erreur chargement analytics', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-gray-100 text-gray-800',
  };

  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📊 Analytics</h1>

      {/* Cartes vue d'ensemble */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Utilisateurs" value={overview?.totalUsers ?? 0} color="text-blue-600" />
        <StatCard label="Logements actifs" value={overview?.activeListings ?? 0} color="text-green-600" />
        <StatCard label="Réservations" value={overview?.totalBookings ?? 0} color="text-purple-600" />
        <StatCard label="En attente" value={overview?.pendingBookings ?? 0} color="text-yellow-600" />
        <StatCard label="Revenus (FCFA)" value={overview?.totalRevenue ?? 0} color="text-emerald-600" format />
        <StatCard label="Taux de conversion" value={overview && overview.totalBookings > 0 ? Math.round((overview.totalBookings / Math.max(overview.totalUsers, 1)) * 100) : 0} color="text-orange-600" suffix="%" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique revenus (barres simples en CSS) */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Revenus — 30 derniers jours</h2>
          {revenue.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucun revenu</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {revenue.map((r) => (
                <div
                  key={r.date}
                  className="flex-1 bg-green-500 rounded-t hover:bg-green-600 transition-colors min-w-[2px]"
                  style={{ height: `${Math.max((r.revenue / maxRevenue) * 100, 2)}%` }}
                  title={`${r.date}: ${r.revenue.toLocaleString('fr-FR')} FCFA`}
                ></div>
              ))}
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{revenue[0]?.date?.slice(5)}</span>
            <span>{revenue[revenue.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>

        {/* Répartition statuts */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Statuts des réservations</h2>
          {statuses.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune réservation</p>
          ) : (
            <div className="space-y-3">
              {statuses.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[s.status] || 'bg-gray-100 text-gray-800'}`}>
                    {s.status}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(s.count / Math.max(...statuses.map((x) => x.count), 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top logements */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">🏆 Top logements</h2>
          {topProperties.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune réservation</p>
          ) : (
            <div className="space-y-3">
              {topProperties.map((p, i) => (
                <div key={p.property.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{p.property.title}</p>
                      <p className="text-xs text-gray-400">{p.property.city?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{p.bookingCount} résa</p>
                    <p className="text-xs text-gray-400">{p.totalRevenue.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top villes */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">🌍 Top villes</h2>
          {topCities.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune réservation</p>
          ) : (
            <div className="space-y-3">
              {topCities.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.country}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">{c.count} résa</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  format,
  suffix,
}: {
  label: string;
  value: number;
  color: string;
  format?: boolean;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {format ? value.toLocaleString('fr-FR') : value}
        {suffix}
      </p>
    </div>
  );
}