'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: 'fas fa-chart-pie' },
  { label: 'Utilisateurs', href: '/admin/users', icon: 'fas fa-users' },
  { label: 'Logements', href: '/admin/properties', icon: 'fas fa-building' },
  { label: 'Vérifications', href: '/admin/verifications', icon: 'fas fa-id-card' },
  { label: 'Versements', href: '/admin/payouts', icon: 'fas fa-money-bill-transfer' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('afristay_user') || localStorage.getItem('user');
    if (!raw) {
      window.location.href = '/login';
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.roles?.includes('ADMIN')) {
        window.location.href = '/';
        return;
      }
      setUser(parsed);
    } catch {
      window.location.href = '/login';
      return;
    }
    setReady(true);
  }, []);

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <span className="text-xl font-bold">
            <span className="text-green-400">Afri</span>
            <span className="text-orange-400">Stay</span>
            <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Admin</span>
          </span>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-green-500/20 text-green-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <i className={`${item.icon} w-5 text-center`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <i className="fas fa-arrow-left w-5 text-center" />
            Retour au site
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
            <i className="fas fa-bars text-xl" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{user.firstName} {user.lastName}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}