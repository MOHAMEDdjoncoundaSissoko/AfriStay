import Link from 'next/link';
import { formatPrice } from '@/lib/utils/format-price';
import FavoriteButton from '@/components/shared/favorite-button';

interface Property {
  id: string;
  title: string;
  slug: string;
  pricePerNight: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaSqm: number;
  city: { name: string };
  country: { name: string; code: string };
  propertyType: { name: string };
  amenities: { amenity: { name: string; icon: string } }[];
  images: { id: string; url: string }[];
  ratingAverage: number;
  reviewCount: number;
}

export function PropertyCard({ property, isActive }: { property: Property; isActive?: boolean }) {
  // Image de remplacement basée sur l'ID
  const imgUrl = `https://picsum.photos/seed/${property.id}/600/450`;

  return (
    <Link href={`/property/${property.id}`} className="group block">
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm group-hover:shadow-lg transition-all group-hover:-translate-y-1 ${
    isActive
      ? 'ring-2 ring-primary ring-offset-2'
      : 'border-[var(--border)]'
  }`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img 
            src={property.images && property.images.length > 0 ? property.images[0].url : `https://picsum.photos/seed/${property.id}/600/400`} 
            alt={property.title} 
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton propertyId={property.id} size="sm" />
          </div>
          <div className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-md">
            {property.propertyType.name}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-semibold text-[15px] leading-snug line-clamp-2">
              {property.title}
            </h3>
            {property.reviewCount > 0 && (
              <span className="flex items-center gap-1 text-sm font-semibold shrink-0">
                <i className="fa-solid fa-star text-accent text-xs" />
                {property.ratingAverage.toFixed(1)}
              </span>
            )}
          </div>

          <p className="text-sm text-[var(--text-sec)] mb-2">
            <i className="fa-solid fa-location-dot text-xs mr-1" />
            {property.city.name}, {property.country.name}
          </p>

          <p className="text-xs text-[var(--text-sec)] mb-3">
            {property.bedrooms} ch. · {property.beds} lits · {property.bathrooms} SdB · {property.areaSqm}m²
          </p>

          <p className="font-bold text-base">
            {formatPrice(property.pricePerNight)} <span className="font-normal text-sm text-[var(--text-sec)]">/ nuit</span>
          </p>
        </div>
      </div>
    </Link>
  );
}