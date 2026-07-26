'use client';

import { useState } from 'react';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  current: FilterState;
}

export interface FilterState {
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  amenities: string[];
}

const AMENITIES = [
  { slug: 'wifi', name: 'Wifi', icon: 'fa-wifi' },
  { slug: 'climatisation', name: 'Climatisation', icon: 'fa-snowflake' },
  { slug: 'piscine', name: 'Piscine', icon: 'fa-person-swimming' },
  { slug: 'parking', name: 'Parking', icon: 'fa-square-parking' },
  { slug: 'cuisine', name: 'Cuisine', icon: 'fa-utensils' },
  { slug: 'balcon', name: 'Balcon', icon: 'fa-door-open' },
  { slug: 'jardin', name: 'Jardin', icon: 'fa-tree' },
  { slug: 'animaux-autorises', name: 'Animaux autorisés', icon: 'fa-paw' },
  { slug: 'espace-travail', name: 'Espace de travail', icon: 'fa-laptop' },
  { slug: 'television', name: 'Télévision', icon: 'fa-tv' },
];

export function FilterModal({ open, onClose, onApply, current }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(current);

  // Reset les filtres quand on ouvre
  useState(() => {
    if (open) setFilters(current);
  });

  function toggleAmenity(slug: string) {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(slug)
        ? prev.amenities.filter((s) => s !== slug)
        : [...prev.amenities, slug],
    }));
  }

  function handleApply() {
    onApply(filters);
    onClose();
  }

  function handleReset() {
    const empty: FilterState = { minPrice: '', maxPrice: '', minBedrooms: '', amenities: [] };
    setFilters(empty);
    onApply(empty);
    onClose();
  }

  if (!open) return null;

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.minBedrooms || filters.amenities.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto z-10 animate-[scaleIn_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-0">
          <h3 className="text-xl font-bold">Filtres</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[var(--bg-alt)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <div className="p-6 space-y-7">
          {/* Prix */}
          <div>
            <label className="block text-sm font-semibold mb-3">Prix par nuit (FCFA)</label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))}
                placeholder="Min"
                className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary text-sm"
              />
              <span className="text-[var(--text-ter)]">—</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))}
                placeholder="Max"
                className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          {/* Chambres */}
          <div>
            <label className="block text-sm font-semibold mb-3">Chambres minimum</label>
            <div className="flex gap-2">
              {['', '1', '2', '3', '4', '5'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, minBedrooms: n }))}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    filters.minBedrooms === n
                      ? 'bg-[var(--text)] text-white border-[var(--text)]'
                      : 'border-[var(--border)] hover:border-[var(--text-sec)]'
                  }`}
                >
                  {n || 'Peu importe'}
                </button>
              ))}
            </div>
          </div>

          {/* Équipements */}
          <div>
            <label className="block text-sm font-semibold mb-3">Équipements</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button
                  key={a.slug}
                  type="button"
                  onClick={() => toggleAmenity(a.slug)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    filters.amenities.includes(a.slug)
                      ? 'bg-primary-light border-primary text-primary'
                      : 'border-[var(--border)] hover:border-[var(--text-sec)]'
                  }`}
                >
                  <i className={`fa-solid ${a.icon} text-xs`} />
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleReset}
            className="px-5 py-3 border border-[var(--border)] rounded-xl font-medium hover:bg-[var(--bg-alt)] transition-colors text-sm"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Appliquer les filtres
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}