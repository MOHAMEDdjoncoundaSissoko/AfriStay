'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import StarRating from '@/components/shared/star-rating';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  hostReply?: string;
  hostRepliedAt?: string;
  createdAt: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

interface PropertyReviewsProps {
  propertyId: string;
}

export default function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const [data, setData] = useState<{ reviews: Review[]; total: number; avgRating: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
    checkCanReview();
  }, [propertyId]);

  async function loadData() {
    try {
      const json = await apiFetch(`/api/reviews/property/${propertyId}`);
      setData(json);
    } catch {}
    setLoading(false);
  }

  async function checkCanReview() {
    const token = localStorage.getItem('afristay_token');
    if (!token) return;
    try {
      const json = await apiFetch(`/api/reviews/can-review/${propertyId}`);
      setCanReview(json.canReview);
    } catch {}
  }

  async function submitReview() {
    if (formRating === 0 || !formComment.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: formRating,
          title: formTitle || undefined,
          comment: formComment,
        }),
      });
      setMessage('Avis publié avec succès !');
      setShowForm(false);
      setFormRating(0);
      setFormTitle('');
      setFormComment('');
      setCanReview(false);
      loadData();
    } catch (err: any) {
      setMessage(err.message || 'Erreur lors de la publication');
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(''), 4000);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-24 bg-gray-100 rounded-lg" />
        <div className="h-24 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Avis ({data?.total || 0})</h2>
          {data && data.total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={data.avgRating} size="md" />
              <span className="text-sm text-gray-500">{data.avgRating} / 5</span>
            </div>
          )}
        </div>
        {canReview && !showForm && (
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition">
            <i className="fas fa-star mr-2" />Laisser un avis
          </button>
        )}
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-lg ${message.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900">Votre avis</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <StarRating rating={formRating} size="lg" interactive onRate={setFormRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre (optionnel)</label>
            <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Résumez votre expérience" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
            <textarea value={formComment} onChange={(e) => setFormComment(e.target.value)} placeholder="Détaillez votre séjour..." rows={4} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition">Annuler</button>
            <button onClick={submitReview} disabled={formRating === 0 || !formComment.trim() || submitting} className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50">
              {submitting ? <i className="fas fa-spinner fa-spin" /> : 'Publier'}
            </button>
          </div>
        </div>
      )}

      {!data || data.total === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="far fa-comment-dots text-4xl mb-3" />
          <p>Aucun avis pour ce logement</p>
          <p className="text-sm mt-1">Soyez le premier à donner votre avis !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((review) => {
            const initials = (review.reviewer.firstName?.[0] || '') + (review.reviewer.lastName?.[0] || '');
            return (
              <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {review.reviewer.avatarUrl ? (
                      <img src={review.reviewer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{review.reviewer.firstName} {review.reviewer.lastName}</span>
                        <span className="text-xs text-gray-400 ml-2">{new Date(review.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.title && <h4 className="font-semibold text-gray-900 mt-2 text-sm">{review.title}</h4>}
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{review.comment}</p>
                    {review.hostReply && (
                      <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/30 bg-gray-50 rounded-r-lg p-3">
                        <p className="text-xs font-medium text-primary mb-1">
                          <i className="fas fa-home mr-1" />Réponse de lhôte
                          {review.hostRepliedAt && <span className="text-gray-400 font-normal ml-2">{new Date(review.hostRepliedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>}
                        </p>
                        <p className="text-sm text-gray-600">{review.hostReply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}