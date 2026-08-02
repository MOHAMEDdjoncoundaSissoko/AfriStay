'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';

interface HostProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  properties: { id: string; title: string; images: { url: string }[] }[];
  _count: { properties: number };
}

export default function HostPublicProfilePage() {
  const { id } = useParams();
  const [host, setHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiRequest<HostProfile>(`/api/references/users/${id}/public`)
      .then(setHost)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-[68px] min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary" />
        </main>
      </>
    );
  }

  if (!host) {
    return (
      <>
        <Navbar />
        <main className="pt-[68px] min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div className="text-center">
            <i className="fa-solid fa-user-slash text-5xl text-[var(--text-ter)] mb-4 block" />
            <h1 className="text-2xl font-bold mb-2">Hôte introuvable</h1>
            <Link href="/search" className="text-primary hover:underline">Retour à la recherche</Link>
          </div>
        </main>
      </>
    );
  }

  const memberSince = new Date(host.createdAt).getFullYear();

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* En-tête Profil */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-28 h-28 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-4xl font-bold overflow-hidden shrink-0">
              {host.avatarUrl ? (
                <img src={host.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                host.firstName[0]
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold mb-1">{host.firstName} {host.lastName}</h1>
              <p className="text-sm text-[var(--text-sec)] mb-4">Membre depuis {memberSince}</p>
              <div className="flex justify-center md:justify-start gap-4 text-sm">
                <span className="bg-primary-light text-primary px-3 py-1 rounded-lg font-medium">
                  {host._count.properties} logement{host._count.properties > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {host.bio && (
            <div className="bg-white rounded-2xl border border-[var(--border)] p-8 mb-8">
              <h2 className="text-lg font-bold mb-3">À propos</h2>
              <p className="text-[var(--text-sec)] leading-relaxed">{host.bio}</p>
            </div>
          )}

          {/* Logements de l'hôte */}
          {host.properties.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Logements de {host.firstName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {host.properties.map((prop) => (
                  <Link key={prop.id} href={`/property/${prop.id}`} className="group block">
                    <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden group-hover:shadow-lg transition-all">
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        <img 
                          src={prop.images[0]?.url || `https://picsum.photos/seed/${prop.id}/600/400`} 
                          alt={prop.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm line-clamp-2">{prop.title}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}