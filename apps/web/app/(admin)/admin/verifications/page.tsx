'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';

const STATUS_TABS = [
  { label: 'En attente', value: 'PENDING' },
  { label: 'Approuvées', value: 'APPROVED' },
  { label: 'Refusées', value: 'REJECTED' },
  { label: 'Toutes', value: '' },
];

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const json = await apiFetch(`/admin/verifications?${params}`);
      setVerifications(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch {
      setMessage('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const review = async (id: string, status: string, reason?: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/admin/verifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      setMessage(status === 'APPROVED' ? 'Vérification approuvée' : 'Vérification refusée');
      fetchVerifications();
    } catch {
      setMessage('Erreur');
    } finally {
      setActionLoading(null);
      setRejectId(null);
      setRejectReason('');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vérifications d&apos;identité</h1>
        <p className="text-sm text-gray-500 mt-1">{total} vérification{total > 1 ? 's' : ''}</p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
              statusFilter === tab.value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="flex gap-6">
                <div className="w-56 h-36 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                  <div className="h-8 bg-gray-100 rounded w-64" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          Aucune vérification trouvée
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((v: any) => {
            const isActionLoading = actionLoading === v.id;
            const initials = (v.user?.firstName?.[0] || '') + (v.user?.lastName?.[0] || '');

            return (
              <div
                key={v.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* CORRECTION : un seul champ "documentUrl" */}
                  <div className="flex-shrink-0">
                    {v.documentUrl ? (
                      <button
                        onClick={() => setLightboxUrl(v.documentUrl)}
                        className="w-56 h-36 rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition cursor-pointer block"
                      >
                        <img
                          src={v.documentUrl}
                          alt="Document"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-56 h-36 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                        <i className="fas fa-id-card text-3xl" />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold">
                        {initials || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {v.user?.firstName} {v.user?.lastName}
                        </h3>
                        <p className="text-xs text-gray-400">{v.user?.email}</p>
                      </div>
                      <span
                        className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          v.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : v.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {v.status === 'PENDING'
                          ? 'En attente'
                          : v.status === 'APPROVED'
                          ? 'Approuvée'
                          : 'Refusée'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <span>
                        <i className="fas fa-id-card mr-1" />
                        {v.documentType || 'Non spécifié'}
                      </span>
                      <span>
                        <i className="fas fa-calendar mr-1" />
                        {new Date(v.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* CORRECTION : c'est "rejectReason" pas "rejectionReason" */}
                    {v.status === 'REJECTED' && v.rejectReason && (
                      <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">
                        <span className="font-medium">Raison : </span>
                        {v.rejectReason}
                      </div>
                    )}

                    {/* Actions */}
                    {v.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <button
                          disabled={isActionLoading}
                          onClick={() => review(v.id, 'APPROVED')}
                          className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {isActionLoading ? (
                            <i className="fas fa-spinner fa-spin" />
                          ) : (
                            <i className="fas fa-check mr-1" />
                          )}
                          Approuver
                        </button>
                        <button
                          disabled={isActionLoading}
                          onClick={() => setRejectId(v.id)}
                          className="px-5 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <i className="fas fa-times mr-1" />
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal refus */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">Refuser cette vérification</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Raison du refus (ex: photo illisible, document expiré...)"
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => review(rejectId, 'REJECTED', rejectReason)}
                className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox document */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <i className="fas fa-times" />
          </button>
          <img
            src={lightboxUrl}
            alt="Document"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
  );
}