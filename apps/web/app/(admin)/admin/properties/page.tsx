'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatPrice } from '@/lib/utils/format-price';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const STATUS_TABS = [
  { label: 'Tous', value: '' },
  { label: 'Publiés', value: 'PUBLISHED' },
  { label: 'Brouillons', value: 'DRAFT' },
  { label: 'Archivés', value: 'ARCHIVED' },
];

export default function AdminProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('afristay_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API_URL}/api/admin/properties?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setProperties(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch {
      setMessage('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const updateStatus = async (propertyId: string, status: string) => {
    setActionLoading(propertyId);
    try {
      const token = localStorage.getItem('afristay_token');
      await fetch(`${API_URL}/api/admin/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setMessage('Statut mis à jour');
      fetchProperties();
    } catch { setMessage('Erreur'); }
    finally { setActionLoading(null); setTimeout(() => setMessage(''), 3000); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logements</h1>
        <p className="text-sm text-gray-500 mt-1">{total} logement{total > 1 ? 's' : ''}</p>
      </div>

      {message && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">{message}</div>}

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition ${statusFilter === tab.value ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">Aucun logement trouvé</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p: any) => {
            const coverUrl = p.images?.[0]?.url;
            const isLoading = actionLoading === p.id;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-40 bg-gray-100 relative">
                  {coverUrl ? (
                    <img src={coverUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fas fa-image text-3xl" /></div>
                  )}
                  <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${p.status === 'PUBLISHED' ? 'bg-green-500 text-white' : p.status === 'DRAFT' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {p.status === 'PUBLISHED' ? 'Publié' : p.status === 'DRAFT' ? 'Brouillon' : 'Archivé'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{p.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{p.city?.name}, {p.country?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">par {p.host?.firstName} {p.host?.lastName}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-primary text-sm">{formatPrice(p.pricePerNight)}<span className="font-normal text-gray-400">/nuit</span></span>
                    <div className="flex items-center gap-1 text-xs text-gray-400"><i className="fas fa-bed" />{p._count?.bookings || 0} résa.</div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    {p.status === 'DRAFT' && (
                      <button disabled={isLoading} onClick={() => updateStatus(p.id, 'PUBLISHED')} className="flex-1 text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50">
                        {isLoading ? <i className="fas fa-spinner fa-spin" /> : 'Publier'}
                      </button>
                    )}
                    {p.status === 'PUBLISHED' && (
                      <button disabled={isLoading} onClick={() => updateStatus(p.id, 'ARCHIVED')} className="flex-1 text-xs font-medium py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50">
                        {isLoading ? <i className="fas fa-spinner fa-spin" /> : 'Archiver'}
                      </button>
                    )}
                    {p.status === 'ARCHIVED' && (
                      <button disabled={isLoading} onClick={() => updateStatus(p.id, 'PUBLISHED')} className="flex-1 text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50">
                        {isLoading ? <i className="fas fa-spinner fa-spin" /> : 'Republier'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Précédent</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Suivant</button>
          </div>
        </div>
      )}
    </div>
  );
}