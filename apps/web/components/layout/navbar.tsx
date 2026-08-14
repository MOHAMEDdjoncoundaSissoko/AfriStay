'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import NotificationBell from '@/components/shared/notification-bell';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ firstName: string; avatarUrl?: string | null; isVerified?: boolean } | null>(null);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('afristay_user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  const token = typeof window !== 'undefined' ? localStorage.getItem('afristay_token') : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
            <path d="M14 2L2 24h24L14 2z" fill="#D4522A" opacity="0.15" />
            <path d="M14 6L5 22h18L14 6z" stroke="#D4522A" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="14" cy="16" r="3" fill="#D4522A" />
          </svg>
          <span className="font-display font-bold text-xl text-primary">AfriStay</span>
        </Link>

        <div className="flex-1 max-w-md hidden md:flex items-center border border-[var(--border)] rounded-full px-4 py-2 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
          <span className="text-sm text-[var(--text-sec)]">Rechercher un logement...</span>
          <Link href="/search" className="ml-auto w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
            <i className="fa-solid fa-magnifying-glass" />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-auto">
          
          {/* Bouton thème */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-[var(--text-sec)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Changer de thème"
          >
            {mounted ? (
              theme === 'dark' ? (
                <i className="fa-solid fa-sun text-yellow-400" />
              ) : (
                <i className="fa-solid fa-moon" />
              )
            ) : (
              <div className="w-5 h-5" />
            )}
          </button>

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

              <Link href="/host/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-sec)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                Tableau de bord
              </Link>

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
    </nav>
  );
}