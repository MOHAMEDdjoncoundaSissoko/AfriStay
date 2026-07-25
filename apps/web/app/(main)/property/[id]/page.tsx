'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';
import { formatPrice } from '@/lib/utils/format-price';

interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  pricePerNight: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaSqm: number;
  maxGuests: number;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  ratingAverage: number;
  reviewCount: number;
  address: string;
  latitude: number;
  longitude: number;
  city: { name: string; slug: string };
  country: { name: string; code: string; flagEmoji: string };
  propertyType: { name: string; icon: string };
  amenities: { amenity: { name: string; icon: string; slug: string } }[];
  host: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  reviews: { id: string; rating: number; comment: string; createdAt: string; reviewer: { firstName: string; lastName: string } }[];
}

export default function PropertyPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<Property>(`/api/properties/${id}`)
      .then(setProperty)
      .catch(() => setError('Logement non trouvé'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
          <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[400px] mb-8">
              <div className="md:col-span-2 bg-gray-200 rounded-2xl" />
              <div className="bg-gray-200 rounded-2xl" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </main>
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Navbar />
        <main className="pt-[68px] min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div className="text-center">
            <i className="fa-solid fa-house-crack text-6xl text-[var(--text-ter)] mb-4" />
            <h1 className="text-2xl font-bold mb-2">Logement non trouvé</h1>
            <p className="text-[var(--text-sec)] mb-6">{error}</p>
            <Link href="/search" className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors">
              Retour aux résultats
            </Link>
          </div>
        </main>
      </>
    );
  }

  const imgUrl = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;
  const imageSeeds = [property.id, property.id + 'b', property.id + 'c', property.id + 'd', property.id + 'e'];

  return (
    <>
      <Navbar />

      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Titre et localisation */}
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
          <p className="text-[var(--text-sec)] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-location-dot text-primary text-sm" />
            {property.address}, {property.city.name}, {property.country.name}
          </p>
          <div className="flex items-center gap-4 pb-6 border-b border-[var(--border)] mb-8 flex-wrap">
            {property.reviewCount > 0 && (
              <span className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                <i className="fa-solid fa-star text-xs" />
                {property.ratingAverage.toFixed(1)}
              </span>
            )}
            <span className="text-sm text-[var(--text-sec)]">{property.reviewCount} avis</span>
            <span className="text-sm font-medium bg-primary-light text-primary px-3 py-1.5 rounded-lg">{property.propertyType.name}</span>
            <span className="text-sm text-[var(--text-sec)]">{property.areaSqm}m²</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Colonne gauche */}
            <div className="lg:col-span-2">
              {/* Galerie */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-auto md:h-[400px] mb-8 rounded-2xl overflow-hidden">
                <div className="md:col-span-2">
                  <img src={imgUrl(imageSeeds[0])} alt={property.title} className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <img src={imgUrl(imageSeeds[1])} alt="" className="w-full h-full object-cover rounded-lg" />
                  <img src={imgUrl(imageSeeds[2])} alt="" className="w-full h-full object-cover rounded-lg" />
                </div>
              </div>

              {/* Hôte */}
              <div className="flex items-center gap-4 py-6 border-b border-[var(--border)] mb-8">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
                  {property.host.firstName[0]}
                </div>
                <div>
                  <p className="font-semibold">Hôte : {property.host.firstName} {property.host.lastName}</p>
                  <p className="text-sm text-[var(--text-sec)]">Membre depuis 2024</p>
                </div>
              </div>

              {/* Chiffres clés */}
              <div className="grid grid-cols-3 gap-6 py-6 border-b border-[var(--border)] mb-8 text-center">
                <div>
                  <div className="text-2xl font-extrabold">{property.bedrooms}</div>
                  <div className="text-sm text-[var(--text-sec)]">Chambre{property.bedrooms > 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{property.beds}</div>
                  <div className="text-sm text-[var(--text-sec)]">Lit{property.beds > 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{property.bathrooms}</div>
                  <div className="text-sm text-[var(--text-sec)]">SdB</div>
                </div>
              </div>

              {/* Description */}
              <h2 className="text-lg font-bold mb-4">À propos de ce logement</h2>
              <p className="text-[var(--text-sec)] leading-relaxed mb-8">{property.description}</p>

              {/* Équipements */}
              <h2 className="text-lg font-bold mb-4">Équipements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {property.amenities.map((a) => (
                  <div key={a.amenity.slug} className="flex items-center gap-3 py-2">
                    <i className={`fa-solid ${a.amenity.icon} text-primary w-6 text-center`} />
                    <span className="text-sm">{a.amenity.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 py-2">
                  <i className={`fa-solid ${property.petsAllowed ? 'fa-paw text-green-600' : 'fa-ban text-red-500'} w-6 text-center`} />
                  <span className="text-sm">{property.petsAllowed ? 'Animaux autorisés' : 'Animaux non autorisés'}</span>
                </div>
              </div>

              {/* Avis */}
              {property.reviews.length > 0 && (
                <>
                  <h2 className="text-lg font-bold mb-4">Avis ({property.reviews.length})</h2>
                  <div className="space-y-4 mb-8">
                    {property.reviews.map((review) => (
                      <div key={review.id} className="py-4 border-b border-[var(--border-light)] last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm">{review.reviewer.firstName} {review.reviewer.lastName}</span>
                          <span className="text-xs text-[var(--text-ter)]">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i key={star} className={`fa-${star <= review.rating ? 'solid' : 'regular'} fa-star text-xs ${star <= review.rating ? 'text-accent' : 'text-[var(--border)]'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-[var(--text-sec)]">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Colonne droite - Carte réservation */}
            <div>
              <div className="sticky top-[84px] bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <span className="text-2xl font-extrabold">{formatPrice(property.pricePerNight)}</span>
                    <span className="text-sm text-[var(--text-sec)] font-normal"> / nuit</span>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Arrivée</label>
                    <input type="date" className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Départ</label>
                    <input type="date" className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Voyageurs</label>
                    <select className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary text-sm bg-white">
                      {Array.from({ length: property.maxGuests }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} voyageur{i > 0 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="block w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors text-center text-[15px]"
                >
                  Réserver
                </Link>

                <hr className="my-5 border-[var(--border)]" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-sec)]">{formatPrice(property.pricePerNight)} x 5 nuits</span>
                    <span className="font-medium">{formatPrice(property.pricePerNight * 5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-sec)]">Frais de service</span>
                    <span className="font-medium">{formatPrice(Math.round(property.pricePerNight * 5 * 0.08))}</span>
                  </div>
                  <hr className="border-[var(--border)]" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatPrice(property.pricePerNight * 5 + Math.round(property.pricePerNight * 5 * 0.08))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}