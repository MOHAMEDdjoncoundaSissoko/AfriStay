'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { PropertyCard } from '@/components/property/property-card';
import { SearchMap } from '@/components/search/search-map';
import { FilterModal, FilterState } from '@/components/search/filter-modal';
import { apiRequest } from '@/lib/api/client';
import { loadLeaflet } from '@/lib/utils/load-leaflet';

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

interface MapMarker {
  id: string;
  title: string;
  pricePerNight: number;
  latitude: number;
  longitude: number;
  city: { name: string };
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
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);
  const [search, setSearch] = useState(initialCity);
  const [activeCity, setActiveCity] = useState(initialCity);
  const [activePropertyId, setActivePropertyId] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ minPrice: '', maxPrice: '', minBedrooms: '', amenities: [] });
  const [showMap, setShowMap] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Charger Leaflet
  useEffect(() => {
    loadLeaflet().then(() => setLeafletReady(true));
  }, []);

  // Fetch propriétés + marqueurs
  async function fetchData(city?: string, f?: FilterState) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city.toLowerCase());
      if (f?.minPrice) params.set('minPrice', f.minPrice);
      if (f?.maxPrice) params.set('maxPrice', f.maxPrice);
      if (f?.minBedrooms) params.set('minBedrooms', f.minBedrooms);
      if (f?.amenities?.length) f.amenities.forEach((a) => params.append('amenities', a));
      params.set('limit', '30');

      const [propsData, mapData] = await Promise.all([
        apiRequest<SearchResponse>(`/api/properties?${params.toString()}`),
        apiRequest<MapMarker[]>(`/api/properties/map?${params.toString()}`),
      ]);

      setProperties(propsData.properties);
      setTotal(propsData.pagination.total);
      setMapMarkers(mapData);
    } catch {
      setProperties([]);
      setMapMarkers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(activeCity, filters);
  }, [activeCity, filters]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveCity(search);
  }

  function filterByCity(city: string) {
    setSearch(city);
    setActiveCity(city);
  }

  function handleMarkerClick(id: string) {
    setActivePropertyId(id);
    // Scroller vers la carte correspondante
    const el = cardRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '3px solid #D4522A';
      el.style.outlineOffset = '-3px';
      el.style.borderRadius = '16px';
      setTimeout(() => {
        el.style.outline = '';
        el.style.outlineOffset = '';
      }, 2000);
    }
  }

  function handleApplyFilters(f: FilterState) {
    setFilters(f);
  }

  const activeFilterCount = [
    filters.minPrice,
    filters.maxPrice,
    filters.minBedrooms,
    filters.amenities.length > 0 ? 'yes' : '',
  ].filter(Boolean).length;

  return (
    <>
      <Navbar />

      <main className="pt-[68px] h-[calc(100vh-68px)] flex flex-col" style={{ background: 'var(--bg)' }}>
        {/* Barre de recherche */}
        <div className="bg-white border-b border-[var(--border)] px-6 py-3 shrink-0">
          <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex items-center border border-[var(--border)] rounded-full px-4 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <i className="fa-solid fa-magnifying-glass text-[var(--text-sec)] mr-3 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ville, quartier, pays..."
                className="flex-1 outline-none text-[15px] bg-transparent min-w-0"
              />
              <button type="submit" className="hidden md:flex w-8 h-8 rounded-full bg-primary text-white items-center justify-center text-sm shrink-0">
                <i className="fa-solid fa-magnifying-glass" />
              </button>
            </form>

            <button
              onClick={() => setFilterOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeFilterCount > 0 ? 'border-[var(--text)] bg-[var(--text)] text-white' : 'border-[var(--border)] hover:border-[var(--text-sec)]'
              }`}
            >
              <i className="fa-solid fa-sliders" />
              Filtres {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </button>

            <button
              onClick={() => setShowMap(!showMap)}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-full text-sm font-medium"
            >
              <i className="fa-solid fa-map" />
              Carte
            </button>
          </div>

          {/* Filtres par ville */}
          <div className="max-w-6xl mx-auto flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => { setSearch(''); setActiveCity(''); }}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                !activeCity ? 'bg-[var(--text)] text-white border-[var(--text)]' : 'border-[var(--border)] hover:border-[var(--text-sec)]'
              }`}
            >
              Toutes
            </button>
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => filterByCity(city)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  activeCity === city ? 'bg-[var(--text)] text-white border-[var(--text)]' : 'border-[var(--border)] hover:border-[var(--text-sec)]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu principal : liste + carte */}
        <div className="flex-1 flex overflow-hidden">
          {/* Liste des logements */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-5">
                <h1 className="text-lg font-bold">
                  {activeCity ? `Logements à ${activeCity}` : 'Tous les logements'}
                </h1>
                <span className="text-sm text-[var(--text-sec)]">
                  {total} résultat{total > 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
                  <i className="fa-solid fa-magnifying-glass text-5xl text-[var(--text-ter)] mb-4 block" />
                  <h2 className="text-xl font-semibold mb-2">Aucun résultat</h2>
                  <p className="text-[var(--text-sec)]">Essayez de modifier vos critères.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map((property) => (
                    <div key={property.id} ref={(el) => { cardRefs.current[property.id] = el; }}>
                      <PropertyCard property={property} isActive={property.id === activePropertyId} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Carte (desktop) */}
          <div className={`hidden md:block w-[45%] shrink-0 relative ${showMap ? '' : ''}`}>
            {leafletReady ? (
              <SearchMap
                markers={mapMarkers}
                activeId={activePropertyId}
                onMarkerClick={handleMarkerClick}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <i className="fa-solid fa-map text-3xl text-[var(--text-ter)] mb-2 block animate-pulse" />
                  <p className="text-sm text-[var(--text-sec)]">Chargement de la carte...</p>
                </div>
              </div>
            )}
          </div>

          {/* Carte (mobile overlay) */}
          {showMap && (
            <div className="md:hidden fixed inset-0 top-[68px] z-50 bg-white">
              <button
                onClick={() => setShowMap(false)}
                className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-[var(--border)] flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark" />
              </button>
              {leafletReady ? (
                <SearchMap
                  markers={mapMarkers}
                  activeId={activePropertyId}
                  onMarkerClick={(id) => { handleMarkerClick(id); setShowMap(false); }}
                />
              ) : null}
            </div>
          )}
        </div>
      </main>

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilters}
        current={filters}
      />
    </>
  );
}