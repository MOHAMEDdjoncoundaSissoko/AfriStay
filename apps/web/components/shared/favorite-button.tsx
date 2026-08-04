'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';

interface FavoriteButtonProps {
  propertyId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7 text-sm',
  md: 'w-9 h-9 text-lg',
  lg: 'w-12 h-12 text-2xl',
};

export default function FavoriteButton({
  propertyId,
  size = 'md',
  className = '',
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('afristay_token');
    if (!token) return;
    apiFetch(`/api/favorites/check/${propertyId}`)
      .then((data: any) => setFavorited(data.favorited))
      .catch(() => {});
  }, [propertyId]);

  async function toggle() {
    const token = localStorage.getItem('afristay_token');
    if (!token) {
      setShowLoginHint(true);
      setTimeout(() => setShowLoginHint(false), 3000);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch(`/api/favorites/${propertyId}`, {
        method: 'POST',
      });
      setFavorited(data.favorited);
    } catch {}
    setLoading(false);
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={toggle}
        disabled={loading}
        className={`${sizeMap[size]} flex items-center justify-center rounded-full transition-all duration-200 ${
          favorited
            ? 'bg-red-50 text-red-500 hover:bg-red-100'
            : 'bg-white/80 text-gray-500 hover:bg-white hover:text-red-400'
        } backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md ${className}`}
        aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        {loading ? (
          <i className="fas fa-spinner fa-spin" />
        ) : favorited ? (
          <i className="fas fa-heart" />
        ) : (
          <i className="far fa-heart" />
        )}
      </button>

      {showLoginHint && (
        <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10 shadow-lg">
          Connectez-vous pour ajouter aux favoris
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
}