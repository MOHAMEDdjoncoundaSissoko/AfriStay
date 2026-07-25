import Link from 'next/link';

export function Navbar() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('afristay_token') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('afristay_user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
            <path d="M14 2L2 24h24L14 2z" fill="#D4522A" opacity="0.15" />
            <path d="M14 6L5 22h18L14 6z" stroke="#D4522A" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="14" cy="16" r="3" fill="#D4522A" />
          </svg>
          <span className="font-display font-bold text-xl text-primary">AfriStay</span>
        </Link>

        <div className="flex-1 max-w-md hidden md:flex items-center border border-[var(--border)] rounded-full px-4 py-2 cursor-pointer hover:shadow-md transition-shadow">
          <span className="text-sm text-[var(--text-sec)]">Rechercher un logement...</span>
          <Link href="/search" className="ml-auto w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
            <i className="fa-solid fa-magnifying-glass" />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-auto">
          <Link href="/host/become-host" className="px-4 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary-light transition-colors">
            Devenir hôte
          </Link>

          {token && user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                {user.firstName[0]}
              </div>
              <span className="text-sm font-medium">{user.firstName}</span>
            </div>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
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