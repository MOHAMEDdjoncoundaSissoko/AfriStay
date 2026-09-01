'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_TABS = [
  { key: 'PENDING', label: 'En attente', color: 'yellow' },
  { key: 'PAID', label: 'Payés', color: 'green' },
  { key: 'FAILED', label: 'Échoués', color: 'red' },
];

const METHOD_LABELS: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo',
  BANK_TRANSFER: 'Virement',
  NON_RENSEIGNE: 'Non renseigné',
};

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [showModal, setShowModal] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const token = localStorage.getItem('afristay_token');
      const res = await fetch(`${API_URL}/api/admin/payouts/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPending(json || []);
      }
    } catch { /* silencieux */ }
  }, []);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('afristay_token');
      const params = activeTab !== 'PENDING' ? `?status=${activeTab}` : '';
      const res = await fetch(`${API_URL}/api/admin/payouts${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPayouts(json || []);
    } catch {
      setMessage('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  useEffect(() => {
    if (activeTab !== 'PENDING') {
      fetchPayouts();
    }
  }, [fetchPayouts]);

  const totalPending = pending.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const markAsPaid = async () => {
    if (!showModal) return;
    setActionLoading(showModal);
    try {
      const token = localStorage.getItem('afristay_token');
      const res = await fetch(`${API_URL}/api/admin/payouts/${showModal}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference: reference || undefined }),
      });
      if (!res.ok) throw new Error();
      setMessage('Versement marqué comme payé');
      setShowModal(null);
      setReference('');
      fetchPending();
    } catch {
      setMessage('Erreur lors du marquage');
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const displayList = activeTab === 'PENDING' ? pending : payouts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Versements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Paiements aux hôtes après les séjours
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`text-sm px-4 py-3 rounded-lg ${
          message.includes('Erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Carte résumé */}
      {pending.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Versements en attente</p>
              <p className="text-3xl font-bold mt-1">{pending.length}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-100 text-sm font-medium">Montant total</p>
              <p className="text-3xl font-bold mt-1">
                {totalPending.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === 'PENDING' ? pending.length : null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                activeTab === tab.key
                  ? `bg-${tab.color}-50 text-${tab.color}-700 border-${tab.color}-200`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {count !== null && count > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full bg-${tab.color}-100 text-${tab.color}-700`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Hôte</th>
                <th className="px-6 py-3 font-medium text-gray-500">Réservation</th>
                <th className="px-6 py-3 font-medium text-gray-500">Moyen de paiement</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Montant</th>
                <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <i className="fas fa-check-circle text-3xl text-green-300 mb-2 block" />
                    Aucun versement {activeTab === 'PENDING' ? 'en attente' : activeTab === 'PAID' ? 'payé' : 'échoué'}
                  </td>
                </tr>
              ) : (
                displayList.map((p: any) => {
                  const host = p.host || {};
                  const booking = p.booking || {};
                  const method = p.payoutMethod || {};
                  const initials = (host.firstName?.[0] || '') + (host.lastName?.[0] || '');
                  const isLoading = actionLoading === p.id;
                  const checkOut = booking.checkOutDate ? new Date(booking.checkOutDate) : null;
                  const canPay = checkOut ? checkOut <= new Date() : false;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{host.firstName} {host.lastName}</p>
                            {host.phone && <p className="text-xs text-gray-400">{host.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 text-xs font-mono font-medium">{booking.bookingNumber || '—'}</p>
                        <p className="text-xs text-gray-700 font-medium truncate max-w-[200px]">{booking.property?.title || '—'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {booking.checkInDate && (
                            <span><i className="fas fa-calendar-check-in mr-0.5 text-green-500" />{new Date(booking.checkInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          )}
                          <span>→</span>
                          {checkOut && (
                            <span className={canPay ? 'text-green-600 font-medium' : 'text-orange-500'}>
                              <i className="fas fa-calendar-check mr-0.5" />{checkOut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          {booking.numberOfNights && <span>{booking.numberOfNights} nuits</span>}
                          {booking.numberOfGuests && <span>· {booking.numberOfGuests} pers.</span>}
                          {booking.traveler && <span>· par {booking.traveler.firstName} {booking.traveler.lastName}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {METHOD_LABELS[p.method] || p.method || '—'}
                        </span>
                        {method.phoneNumber && (
                          <p className="text-xs text-gray-400 mt-0.5">{method.phoneNumber}</p>
                        )}
                        {method.accountName && (
                          <p className="text-xs text-gray-400">{method.accountName}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-900">
                          {(p.amount || 0).toLocaleString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-400">FCFA</p>
                      </td>
                      <td className="px-6 py-4">
                        {p.status === 'PENDING' ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">
                            {checkOut ? (
                              canPay ? 'Payable' : `Dispo le ${checkOut.toLocaleDateString('fr-FR')}`
                            ) : 'En attente'}
                          </span>
                        ) : p.status === 'PAID' ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-green-700">
                            <i className="fas fa-check mr-1" />Payé le {p.paidAt ? new Date(p.paidAt).toLocaleDateString('fr-FR') : ''}
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">
                            Échoué
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'PENDING' ? (
                          <button
                            disabled={isLoading || !canPay}
                            onClick={() => canPay && setShowModal(p.id)}
                            className={`text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition ${
                              canPay
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                            title={!canPay && checkOut ? `Paiement possible le ${checkOut.toLocaleDateString('fr-FR')}` : undefined}
                          >
                            {isLoading ? <i className="fas fa-spinner fa-spin" /> : canPay ? 'Marquer payé' : 'En attente...'}
                          </button>
                        ) : p.status === 'PAID' ? (
                          <span className="text-xs font-medium px-2 py-1 rounded bg-green-50 text-green-700">
                            <i className="fas fa-check mr-1" />Payé
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-1 rounded bg-red-50 text-red-700">
                            Échoué
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal "Marquer payé" */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowModal(null); setReference(''); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer le versement</h3>
            <p className="text-sm text-gray-500 mb-6">
              Vous avez envoyé l'argent à l'hôte ? Ajoutez le numéro de transaction si vous l'avez.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence transaction <span className="text-gray-400">(optionnel)</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: WV-TRANSF-123456"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowModal(null); setReference(''); }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Annuler
              </button>
              <button
                disabled={actionLoading === showModal}
                onClick={markAsPaid}
                className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {actionLoading === showModal ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  'Confirmer le paiement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}