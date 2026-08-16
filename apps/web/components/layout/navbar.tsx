'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import NotificationBell from '@/components/shared/notification-bell';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ firstName: string; lastName?: string; avatarUrl?: string | null; isVerified?: boolean; role?: string; email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('afristay_user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  const token = typeof window !== 'undefined' ? localStorage.getItem('afristay_token') : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
            <path d="M14 2L2 24h24L14 2z" fill="#D4522A" opacity="0.15" />
            <path d="M14 6L5 22h18L14 6z" stroke="#D4522A" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="14" cy="16" r="3" fill="#D4522A" />
          </svg>
          <span className="font-display font-bold text-xl text-primary">AfriStay</span>
        </Link>

        {/* Recherche Desktop */}
        <div className="flex-1 max-w-md hidden md:flex items-center border border-[var(--border)] rounded-full px-4 py-2 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
          <span className="text-sm text-[var(--text-sec)]">Rechercher un logement...</span>
          <Link href="/search" className="ml-auto w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
            <i className="fa-solid fa-magnifying-glass" />
          </Link>
        </div>

        {/* Boutons à droite */}
        <div className="flex items-center gap-2 ml-auto">
          
          {/* Theme (tout le temps) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-[var(--text-sec)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Changer de thème"
          >
            {mounted ? (
              theme === 'dark' ? <i className="fa-solid fa-sun text-yellow-400" /> : <i className="fa-solid fa-moon" />
            ) : (
              <div className="w-5 h-5" />
            )}
          </button>

          {/* Hamburger (SEULEMENT sur mobile) - EN DEHORS DU BLOC CACHE */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-800 dark:text-white hover:bg-white/50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Menu"
          >
            <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'} text-xl`} />
          </button>

          {/* Menu Desktop (CACHÉ sur mobile) */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/host/become-host" className="px-4 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary-light dark:hover:bg-orange-900/30 transition-colors">
              Devenir hôte
            </Link>

            {token && user ? (
              <>
                <Link href="/traveler/bookings" className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-sec)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  Mes réservations
                </Link>

                <Link href="/traveler/favorites" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-sec)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <i className="fa-regular fa-heart" />
                  <span>Favoris</span>
                </Link>
                
                <NotificationBell />

                {user?.role === 'HOST' && (
                  <Link href="/host/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-sec)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    Tableau de bord
                  </Link>
                )}

                <Link href="/messages" className="relative p-2 text-[var(--text-sec)] hover:text-[var(--text)] transition-colors">
                  <i className="fa-regular fa-comment-dots text-xl" />
                </Link>

                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.firstName[0]
                    )}
                  </div>
                  <span className="text-sm font-medium">{user.firstName}</span>
                  {user.isVerified && <VerifiedBadge size="sm" />}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  Connexion
                </Link>
                <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PANNEAU MOBILE (EN DEHORS DE LA BARRE PRINCIPALE) */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-[var(--border)] shadow-xl p-6 space-y-3">
          
          <Link 
            href="/search" 
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 w-full px-4 py-3 border border-[var(--border)] rounded-xl text-[var(--text-sec)]"
          >
            <i className="fa-solid fa-magnifying-glass" />
            <span>Rechercher un logement...</span>
          </Link>

          <hr className="border-[var(--border)]" />

          {token && user ? (
            <>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold overflow-hidden">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.firstName[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{user.firstName} {user.lastName} {user.isVerified && <VerifiedBadge size="sm" />}</p>
                  <p className="text-xs text-[var(--text-sec)]">Voir mon profil</p>
                </div>
              </Link>

              <hr className="border-[var(--border)]" />

              <Link href="/traveler/bookings" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium hover:text-primary transition">Mes réservations</Link>
              <Link href="/traveler/favorites" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium hover:text-primary transition">Favoris</Link>
              <Link href="/messages" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium hover:text-primary transition">Messages</Link>
              
              {user.role === 'HOST' && (
                <Link href="/host/dashboard" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium hover:text-primary transition">Tableau de bord</Link>
              )}

              <hr className="border-[var(--border)]" />
              <Link href="/host/become-host" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-semibold text-primary">Devenir hôte</Link>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full py-3 text-center border border-[var(--border)] rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition">Connexion</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="w-full py-3 text-center bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition">Inscription</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}