'use client';

import { useEffect, useRef } from 'react';
import { useCurrency } from '@/lib/currency/currency-context';

interface MapMarker {
  id: string;
  title: string;
  pricePerNight: number;
  latitude: number;
  longitude: number;
  city: { name: string };
}

interface SearchMapProps {
  markers: MapMarker[];
  activeId?: string;
  onMarkerClick?: (id: string) => void;
}

export function SearchMap({ markers, activeId, onMarkerClick }: SearchMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const leafletMarkers = useRef<L.Marker[]>([]);
  const { convert } = useCurrency();

  // Initialiser la carte
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([8.0, -2.0], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Mettre à jour les marqueurs
  useEffect(() => {
    if (!mapInstance.current) return;
    const L = (window as any).L;
    if (!L) return;
    const map = mapInstance.current;

    // Supprimer les anciens marqueurs
    leafletMarkers.current.forEach((m) => m.remove());
    leafletMarkers.current = [];

    if (markers.length === 0) return;

    markers.forEach((m) => {
      const isActive = m.id === activeId;
      const divIcon = L.divIcon({
        className: '',
        html: `<div style="
          background: ${isActive ? '#D4522A' : '#fff'};
          color: ${isActive ? '#fff' : '#1F1F1F'};
          font-family: DM Sans, sans-serif;
          font-size: 13px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,${isActive ? '0.3' : '0.18'});
          white-space: nowrap;
          cursor: pointer;
          border: 2px solid ${isActive ? '#D4522A' : 'transparent'};
          transform: scale(${isActive ? '1.1' : '1'});
          transition: all 0.2s;
        ">${(() => {
          const basePrice = new Intl.NumberFormat('fr-FR').format(m.pricePerNight);
          const cur = (m as any).currency || 'XOF';
          const conv = convert(m.pricePerNight, cur);
          return conv.symbol && conv.symbol !== 'FCFA'
            ? `${basePrice} FCFA<br><span style="font-size:10px;color:#666">≈ ${conv.amount} ${conv.symbol}</span>`
            : `${basePrice} FCFA`;
        })()}</div>`,
        iconSize: [80, 32],
        iconAnchor: [40, 32],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon: divIcon }).addTo(map);

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(m.id);
      });

      leafletMarkers.current.push(marker);
    });

    // Ajuster la vue
    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 12);
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [markers, activeId, onMarkerClick]);

  // Centrer sur le marqueur actif
  useEffect(() => {
    if (!mapInstance.current || !activeId) return;
    const marker = markers.find((m) => m.id === activeId);
    if (marker) {
      mapInstance.current.setView([marker.latitude, marker.longitude], 13, { animate: true });
    }
  }, [activeId]);

  return <div ref={mapRef} className="w-full h-full" />;
}