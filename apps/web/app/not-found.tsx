import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <h1 className="font-display text-8xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page introuvable</h2>
        <p className="text-[var(--text-sec)] mb-8 max-w-md mx-auto">
          Oups ! La page que vous recherchez semble avoir disparu ou n&apos;existe pas.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
        >
          <i className="fa-solid fa-house" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}