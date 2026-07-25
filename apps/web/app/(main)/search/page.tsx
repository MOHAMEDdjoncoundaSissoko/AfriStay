'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { PropertyCard } from '@/components/property/property-card';
import { apiRequest } from '@/lib/api/client';

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
  ratingAverage: number;
  reviewCount: number;
}

interface SearchResponse {
  properties: Property[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const CITIES = ['Abidjan', 'Dakar', 'Lagos', 'Accra', 'Bamako', 'Cotonou', 'Conakry', 'Lomé'];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('q') || '';

  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialCity);
  const [activeCity, setActiveCity] = useState(initialCity);

  async function fetchProperties(city?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      params.set('limit', '20');

      const data = await apiRequest<SearchResponse>(`/api/properties?${params.toString()}`);
      setProperties(data.properties);
      setTotal(data.pagination.total);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProperties(activeCity);
  }, [activeCity]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveCity(search);
  }

  function filterByCity(city: string) {
    setSearch(city);
    setActiveCity(city);
  }

  return (
    <>
      <Navbar />

      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Barre de recherche */}
        <div className="bg-white border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 flex items-center border border-[var(--border)] rounded-full px-5 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <i className="fa-solid fa-magnifying-glass text-[var(--text-sec)] mr-3 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par ville, pays ou quartier..."
                  className="flex-1 outline-none text-[15px] bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors text-sm"
              >
                Rechercher
              </button>
            </form>

            {/* Filtres par ville */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              <button
                onClick={() => { setSearch(''); setActiveCity(''); }}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  !activeCity
                    ? 'bg-[var(--text)] text-white border-[var(--text)]'
                    : 'border-[var(--border)] hover:border-[var(--text-sec)]'
                }`}
              >
                Toutes les villes
              </button>
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => filterByCity(city)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                    activeCity === city
                      ? 'bg-[var(--text)] text-white border-[var(--text)]'
                      : 'border-[var(--border)] hover:border-[var(--text-sec)]'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold">
              {activeCity ? `Logements à ${activeCity}` : 'Tous les logements'}
            </h1>
            <span className="text-sm text-[var(--text-sec)]">
              {total} logement{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <i className="fa-solid fa-magnifying-glass text-5xl text-[var(--text-ter)] mb-4" />
              <h2 className="text-xl font-semibold mb-2">Aucun résultat</h2>
              <p className="text-[var(--text-sec)]">Essayez de modifier vos critères de recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}