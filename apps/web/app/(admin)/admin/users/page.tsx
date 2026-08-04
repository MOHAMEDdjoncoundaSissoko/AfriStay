'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ROLE_OPTIONS = ['TRAVELER', 'HOST', 'ADMIN'];

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('afristay_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setUsers(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch (err: any) {
      setMessage(err?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateRole = async (userId: string, roles: string[]) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('afristay_token');
      await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roles }),
      });
      setMessage('Rôle mis à jour');
      fetchUsers();
    } catch {
      setMessage('Erreur');
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleStatus = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('afristay_token');
      await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: isActive ? 'DISABLED' : 'ACTIVE' }),
      });
      setMessage(isActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
      fetchUsers();
    } catch {
      setMessage('Erreur');
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleRole = (userId: string, currentRoles: string[], role: string) => {
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];
    if (newRoles.length === 0) return;
    updateRole(userId, newRoles);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} utilisateur{total > 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-64"
          />
        </div>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Utilisateur</th>
                <th className="px-6 py-3 font-medium text-gray-500">Rôles</th>
                <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="px-6 py-3 font-medium text-gray-500">Vérifié</th>
                <th className="px-6 py-3 font-medium text-gray-500">Inscrit le</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((u: any) => {
                  const initials = (u.firstName?.[0] || '') + (u.lastName?.[0] || '');
                  const isLoading = actionLoading === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {ROLE_OPTIONS.map((role) => (
                            <button
                              key={role}
                              disabled={isLoading}
                              onClick={() => toggleRole(u.id, u.roles || [], role)}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded cursor-pointer transition ${
                                u.roles?.includes(role)
                                  ? role === 'ADMIN'
                                    ? 'bg-red-100 text-red-700'
                                    : role === 'HOST'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-200 text-gray-700'
                                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            u.isActive !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {u.isActive !== false ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <i className="fas fa-check-circle text-blue-500" />
                        ) : (
                          <i className="fas fa-minus-circle text-gray-300" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          disabled={isLoading}
                          onClick={() => toggleStatus(u.id, u.isActive !== false)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                            u.isActive !== false
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {isLoading ? (
                            <i className="fas fa-spinner fa-spin" />
                          ) : u.isActive !== false ? (
                            'Désactiver'
                          ) : (
                            'Activer'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}