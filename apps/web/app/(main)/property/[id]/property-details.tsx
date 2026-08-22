'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';
import { formatPrice } from '@/lib/utils/format-price';
import { BookingCalendar } from '@/components/booking/booking-calendar';
import Lightbox from '@/components/shared/lightbox';
import PropertyReviews from '@/components/property/property-reviews';
import FavoriteButton from '@/components/shared/favorite-button';
import { useCurrency } from '@/lib/currency/currency-context';

interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  pricePerNight: number;
  currency: string;
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
  images: { id: string; url: string; isCover: boolean; sortOrder: number }[];
  host: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  reviews: { id: string; rating: number; comment: string; createdAt: string; reviewer: { firstName: string; lastName: string } }[];
}

interface PropertyDetailsProps {
  property: Property | null;
  error?: string;
}

export default function PropertyDetails({ property, error }: PropertyDetailsProps) {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [guests, setGuests] = useState(1);
  const { convert } = useCurrency();

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

  // Calculs pour le récapitulatif des prix
  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000) 
    : 0;
  const nightsTotal = property.pricePerNight * nights;
  const serviceFee = Math.round(nightsTotal * 0.08);

  const imgUrl = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;
  const imageSeeds = [property.id, property.id + 'b', property.id + 'c', property.id + 'd', property.id + 'e'];

  return (
    <>
      <Navbar />

      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Titre et localisation */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {property.title}
              </h1>

              <p className="text-[var(--text-sec)] mt-2 flex items-center gap-2">
                <i className="fa-solid fa-location-dot text-primary text-sm" />
                {property.address}, {property.city.name}, {property.country.name}
              </p>
            </div>

            <FavoriteButton
              propertyId={property.id}
              size="lg"
              className="flex-shrink-0"
            />
          </div>
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
                  <img
                    src={property.images && property.images.length > 0 ? property.images[0].url : imgUrl(imageSeeds[0])}
                    alt={property.title}
                    onClick={() => {
                      setLightboxIndex(0);
                      setLightboxOpen(true);
                    }}
                    className="w-full h-full object-cover cursor-pointer"
                  />
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <img
                    src={property.images && property.images.length > 1 ? property.images[1].url : imgUrl(imageSeeds[1])}
                    alt=""
                    onClick={() => {
                      setLightboxIndex(1);
                      setLightboxOpen(true);
                    }}
                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                  />
                  <img
                    src={property.images && property.images.length > 2 ? property.images[2].url : imgUrl(imageSeeds[2])}
                    alt=""
                    onClick={() => {
                      setLightboxIndex(2);
                      setLightboxOpen(true);
                    }}
                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Hôte */}
              <Link href={`/host/${property.host.id}`} className="flex items-center gap-4 py-6 border-b border-[var(--border)] mb-8 group">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold overflow-hidden">
                  {property.host.avatarUrl ? (
                    <img src={property.host.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    property.host.firstName[0]
                  )}
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">Hôte : {property.host.firstName} {property.host.lastName}</p>
                  <p className="text-sm text-[var(--text-sec)]">Membre depuis 2024</p>
                </div>
              </Link>

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
              <div className="mt-8 mb-8">
                <PropertyReviews propertyId={property.id} />
              </div>
            </div>

            {/* Colonne droite - Carte réservation */}
            <div>
              <div className="sticky top-[84px] bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-2xl font-extrabold">{formatPrice(property.pricePerNight)}</span>
                    {(() => {
                      const conv = convert(property.pricePerNight, property.currency || 'XOF');
                      return conv.symbol !== 'FCFA' ? (
                        <span className="text-xs text-[var(--text-sec)] block mt-0.5">
                          ≈ {conv.amount} {conv.symbol} / nuit
                        </span>
                      ) : null;
                    })()}

                    {property.currency && property.currency !== 'XOF' && (
                      <span className="text-xs text-[var(--text-sec)] block mt-0.5">
                        ≈ {convert(property.pricePerNight, property.currency).amount} {convert(property.pricePerNight, property.currency).symbol} / nuit
                      </span>
                    )}
                  </div>
                </div>

                {/* Calendrier */}
                <div className="mb-4">
                  <BookingCalendar
                    propertyId={property.id}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onDateSelect={(date) => {
                      if (!checkIn || (checkIn && checkOut)) {
                        setCheckIn(date);
                        setCheckOut(null);
                      } else if (date > checkIn) {
                        setCheckOut(date);
                      } else {
                        setCheckIn(date);
                      }
                    }}
                  />
                  {checkIn && !checkOut && (
                    <p className="text-xs text-[var(--text-sec)] mt-2 text-center">Sélectionnez votre date de départ</p>
                  )}
                </div>

                {/* Voyageurs */}
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Voyageurs</label>
                  <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary text-sm bg-white">
                    {Array.from({ length: property.maxGuests }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} voyageur{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Récapitulatif prix */}
                {checkIn && checkOut && (
                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sec)]">{formatPrice(property.pricePerNight)} x {Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000)} nuits</span>
                      <span className="font-medium">{formatPrice(property.pricePerNight * Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sec)]">Frais de service (8%)</span>
                      <span className="font-medium">{formatPrice(Math.round(property.pricePerNight * Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000) * 0.08))}</span>
                    </div>
                    <hr className="border-[var(--border)]" />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatPrice(nightsTotal + serviceFee)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bouton Contacter l'hôte */}
                <button
                  onClick={async () => {
                    const token = localStorage.getItem('afristay_token');
                    if (!token) { setBookingError('Connectez-vous pour envoyer un message'); return; }
                    try {
                      const result = await apiRequest<any>('/api/messages/conversations', {
                        method: 'POST',
                        token,
                        body: { propertyId: property.id, message: `Bonjour, je suis intéressé par votre logement : ${property.title}` }
                      });
                      window.location.href = `/messages/${result.conversation.id}`;
                    } catch (err: any) {
                      setBookingError(err?.message || 'Erreur lors de l\'envoi');
                    }
                  }}
                  className="w-full py-3.5 border-2 border-[var(--text)] text-[var(--text)] font-semibold rounded-xl transition-colors text-[15px] hover:bg-gray-50 mb-3"
                >
                  <i className="fa-regular fa-message mr-2" />Contacter l'hôte
                </button>

                {!checkIn || !checkOut ? (
                  <p className="text-sm text-[var(--text-sec)] text-center py-3 border border-[var(--border)] rounded-xl">
                    Sélectionnez vos dates pour voir le prix
                  </p>
                ) : (
                  <button
                    onClick={async () => {
                      setBookingLoading(true);
                      setBookingError('');
                      const token = localStorage.getItem('afristay_token');
                      if (!token) {
                        setBookingError('Connectez-vous pour réserver');
                        setBookingLoading(false);
                        return;
                      }
                      try {
                        const result = await apiRequest<any>('/api/bookings', {
                          method: 'POST',
                          token,
                          body: {
                            propertyId: property.id,
                            checkInDate: checkIn.toISOString().split('T')[0],
                            checkOutDate: checkOut.toISOString().split('T')[0],
                            numberOfGuests: guests,
                          },
                        });

                        try {
                          const payment = await apiRequest<any>('/api/payments/initiate', {
                            method: 'POST',
                            token,
                            body: { bookingId: result.booking.id },
                          });
                          window.location.href = payment.paymentUrl;
                        } catch {
                          setBookingSuccess(true);
                        }
                      } catch (err: unknown) {
                        setBookingError(err instanceof Error ? err.message : 'Erreur lors de la réservation');
                      } finally {
                        setBookingLoading(false);
                      }
                    }}
                    disabled={bookingLoading}
                    className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-[15px]"
                  >
                    {bookingLoading ? 'Réservation...' : 'Réserver'}
                  </button>
                )}

                {bookingError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {bookingError}
                  </div>
                )}

                {bookingSuccess && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <i className="fa-solid fa-circle-check text-green-600 text-2xl mb-2 block" />
                    <p className="font-semibold text-green-800">Demande envoyée !</p>
                    <p className="text-sm text-green-600 mt-1">L'hôte a 24h pour accepter ou refuser votre demande.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Lightbox
        images={property.images.map((img) => ({
          url: img.url,
          id: img.id,
        }))}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}