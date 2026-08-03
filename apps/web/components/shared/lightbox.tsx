'use client';

import { useState, useEffect, useCallback } from 'react';

interface LightboxImage {
  url: string;
  id?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Lightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, goPrev, goNext, onClose]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
      >
        <i className="fas fa-times text-lg" />
      </button>

      {/* Compteur */}
      <div className="absolute top-5 left-5 text-white/60 text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Précédent */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          <i className="fas fa-chevron-left text-xl" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[currentIndex].url}
        alt={`Photo ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Suivant */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          <i className="fas fa-chevron-right text-xl" />
        </button>
      )}

      {/* Miniatures */}
      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4 pb-1"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setCurrentIndex(i)}
              className={`w-16 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                i === currentIndex
                  ? 'border-white scale-105'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}