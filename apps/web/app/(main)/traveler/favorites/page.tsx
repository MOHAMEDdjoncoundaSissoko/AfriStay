'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { formatPrice } from '@/lib/utils/format-price';
import FavoriteButton from '@/components/shared/favorite-button';
import Link from 'next/link';

export default function FavoritesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('afristay_token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch('/api/favorites')
      .then((data: any) => {
        setProperties(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes favoris</h1>
        <p className="text-sm text-gray-500 mb-8">
          {loading
            ? 'Chargement...'
            : `${properties.length} logement${properties.length > 1 ? 's' : ''} sauvegardé${properties.length > 1 ? 's' : ''}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <i className="far fa-heart text-6xl text-gray-200 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucun favori</h2>
            <p className="text-gray-500 mb-6">
              Vous n&apos;avez pas encore sauvegardé de logement.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
            >
              <i className="fas fa-search" />
              Explorer les logements
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p: any) => {
              const coverUrl = p.images?.[0]?.url;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="relative h-48 bg-gray-100">
                    {coverUrl ? (
                      <img src={coverUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <i className="fas fa-image text-3xl" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <FavoriteButton propertyId={p.id} size="sm" />
                    </div>
                    {p.propertyType && (
                      <span className="absolute top-3 left-3 bg-white/90 text-xs font-medium px-2 py-1 rounded-md text-gray-700 backdrop-blur-sm">
                        {p.propertyType.name}
                      </span>
                    )}
                  </div>
                  <Link href={`/property/${p.id}`} className="block p-4">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {p.city?.name}{p.country?.name ? `, ${p.country.name}` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {p.bedrooms > 0 && <span><i className="fas fa-bed mr-1" />{p.bedrooms}</span>}
                      {p.bathrooms > 0 && <span><i className="fas fa-bath mr-1" />{p.bathrooms}</span>}
                      {p.areaSqm > 0 && <span>{p.areaSqm} m²</span>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="font-bold text-primary text-sm">
                        {formatPrice(p.pricePerNight)}<span className="font-normal text-gray-400 text-xs">/nuit</span>
                      </span>
                      {p.ratingAverage > 0 && (
                        <span className="text-xs text-gray-500">
                          <i className="fas fa-star text-yellow-400 mr-1" />{p.ratingAverage}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}