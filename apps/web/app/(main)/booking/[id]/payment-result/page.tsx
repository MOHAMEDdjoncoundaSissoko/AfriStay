'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';

type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

interface PaymentInfo {
  status: string;
  amount: number;
  currency: string;
  method: string | null;
  paidAt: string | null;
}

export default function PaymentResultPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer le statut du paiement
  useEffect(() => {
    if (!bookingId) return;

    async function fetchStatus() {
      try {
        const data = await apiFetch(`/payments/${bookingId}/status`);
        setPayment(data);
      } catch {
        setPayment(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();

    // Si PENDING, vérifier toutes les 5 secondes (le webhook peut arriver)
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // Arrêter le polling si le statut est final
  useEffect(() => {
    if (payment && (payment.status === 'SUCCESS' || payment.status === 'FAILED' || payment.status === 'CANCELLED')) {
      // Le clearInterval du premier useEffect s'occupe d'arrêter
    }
  }, [payment]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❓</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Paiement introuvable</h2>
          <p className="text-gray-500 mb-6">
            Nous n&apos;avons pas pu trouver les informations de ce paiement.
          </p>
          <button
            onClick={() => router.push('/search')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  // ✅ SUCCÈS
  if (payment.status === 'SUCCESS') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h1>
          <p className="text-gray-500 mb-2">Ta réservation est confirmée.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-2xl font-bold text-green-600">
              {payment.amount.toLocaleString('fr-FR')} {payment.currency}
            </p>
            {payment.method && (
              <p className="text-sm text-gray-400 mt-1">Payé par {payment.method}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/traveler/bookings')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Voir mes réservations
            </button>
            <button
              onClick={() => router.push('/search')}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              Continuer à chercher
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ⏳ EN ATTENTE
  if (payment.status === 'PENDING' || payment.status === 'PROCESSING') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement en cours...</h1>
          <p className="text-gray-500 mb-2">
            Nous attendons la confirmation du prestataire de paiement.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Cette page se mettra à jour automatiquement.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-2xl font-bold text-yellow-600">
              {payment.amount.toLocaleString('fr-FR')} {payment.currency}
            </p>
          </div>
          <button
            onClick={() => router.push('/traveler/bookings')}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
          >
            Voir mes réservations
          </button>
        </div>
      </div>
    );
  }

  // ❌ ÉCHOUÉ / ANNULÉ
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement échoué</h1>
        <p className="text-gray-500 mb-2">
          Le paiement n&apos;a pas pu être complété. Aucun montant n&apos;a été débité.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-2xl font-bold text-red-600">
            {payment.amount.toLocaleString('fr-FR')} {payment.currency}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push(`/property/${bookingId}`)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Réessayer le paiement
          </button>
          <button
            onClick={() => router.push('/search')}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
          >
            Chercher un autre logement
          </button>
        </div>
      </div>
    </div>
  );
}