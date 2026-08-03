'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { formatPrice } from '@/lib/utils/format-price';

interface DashboardData {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  monthlyRevenue: number;
  recentUsers: any[];
  recentBookings: any[];
  pendingVerifications: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/dashboard')
      .then((data: any) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur de chargement');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl">{error || 'Aucune donnée'}</div>
    );
  }

  const stats = [
    {
      label: 'Utilisateurs',
      value: data.totalUsers.toLocaleString(),
      icon: 'fas fa-users',
      lightColor: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Logements',
      value: data.totalProperties.toLocaleString(),
      icon: 'fas fa-building',
      lightColor: 'bg-green-50 text-green-600',
    },
    {
      label: 'Réservations',
      value: data.totalBookings.toLocaleString(),
      icon: 'fas fa-calendar-check',
      lightColor: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Revenus du mois',
      value: formatPrice(data.monthlyRevenue),
      icon: 'fas fa-money-bill-wave',
      lightColor: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d&apos;ensemble de la plateforme
          </p>
        </div>
        {data.pendingVerifications > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1.5 rounded-full">
            <i className="fas fa-clock mr-1" />
            {data.pendingVerifications} vérification{data.pendingVerifications > 1 ? 's' : ''} en attente
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <div className={`w-10 h-10 rounded-lg ${stat.lightColor} flex items-center justify-center`}>
                <i className={`${stat.icon} text-lg`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers utilisateurs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Derniers utilisateurs</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentUsers.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">Aucun utilisateur</p>
            ) : (
              data.recentUsers.map((u: any) => (
                <div key={u.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {u.roles?.map((r: string) => (
                      <span
                        key={r}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          r === 'ADMIN'
                            ? 'bg-red-100 text-red-700'
                            : r === 'HOST'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dernières réservations — CORRECTION : c'est "traveler" pas "user" */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Dernières réservations</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentBookings.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">Aucune réservation</p>
            ) : (
              data.recentBookings.map((b: any) => (
                <div key={b.id} className="px-6 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate mr-2">
                      {b.property?.title || 'Logement supprimé'}
                    </p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                        b.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : b.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : b.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {b.traveler?.firstName} {b.traveler?.lastName} · {formatPrice(b.totalAmount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}