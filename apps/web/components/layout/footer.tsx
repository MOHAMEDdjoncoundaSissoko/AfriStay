import Link from 'next/link';

const CITIES = ['Abidjan', 'Dakar', 'Lagos', 'Accra', 'Cotonou', 'Bamako'];

export function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--border)] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div>
          <div className="font-display font-bold text-xl text-primary mb-3">AfriStay</div>
          <p className="text-sm text-[var(--text-sec)] leading-relaxed">
            La plateforme de réservation N°1 en Afrique de l&apos;Ouest.
          </p>
        </div>

        {/* Cities */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Destinations</h4>
          <div className="flex flex-col gap-2">
            {CITIES.map((city) => (
              <Link key={city} href={`/search?q=${city}`} className="text-sm text-[var(--text-sec)] hover:text-primary transition-colors">
                {city}
              </Link>
            ))}
          </div>
        </div>

        {/* Help */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Assistance</h4>
          <div className="flex flex-col gap-2">
            {['Centre d\'aide', 'Conditions générales', 'Confidentialité', 'Contact'].map((item) => (
              <Link key={item} href="#" className="text-sm text-[var(--text-sec)] hover:text-primary transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Newsletter</h4>
          <p className="text-sm text-[var(--text-sec)] mb-3">Recevez les meilleures offres.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="votre@email.com"
              className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-transparent outline-none focus:border-primary"
            />
            <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors">
              OK
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-[var(--border)] flex justify-between items-center">
        <p className="text-xs text-[var(--text-sec)]">2025 AfriStay. Tous droits réservés.</p>
        <div className="flex gap-3">
          {['facebook-f', 'x-twitter', 'instagram', 'linkedin-in'].map((icon) => (
            <a key={icon} href="#" className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-sec)] hover:bg-primary hover:text-white hover:border-primary transition-all text-xs">
              <i className={`fa-brands fa-${icon}`} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}