import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const DESTINATIONS = [
  { name: 'Abidjan', country: "Côte d'Ivoire", emoji: '🇨🇮' },
  { name: 'Dakar', country: 'Sénégal', emoji: '🇸🇳' },
  { name: 'Lagos', country: 'Nigeria', emoji: '🇳🇬' },
  { name: 'Accra', country: 'Ghana', emoji: '🇬🇭' },
  { name: 'Bamako', country: 'Mali', emoji: '🇲🇱' },
  { name: 'Cotonou', country: 'Bénin', emoji: '🇧🇯' },
  { name: 'Conakry', country: 'Guinée', emoji: '🇬🇳' },
  { name: 'Lomé', country: 'Togo', emoji: '🇹🇬' },
];

const STATS = [
  { value: '2 500+', label: 'Logements' },
  { value: '12', label: 'Pays' },
  { value: '50 000+', label: 'Voyageurs' },
  { value: '4.7', label: 'Note moyenne' },
];

const STEPS = [
  {
    icon: 'fa-magnifying-glass',
    title: 'Recherchez',
    desc: 'Trouvez le logement idéal parmi des milliers d\'annonces en Afrique de l\'Ouest.',
  },
  {
    icon: 'fa-calendar-check',
    title: 'Réservez',
    desc: 'Choisissez vos dates, confirmez en quelques clics. Paiement sécurisé.',
  },
  {
    icon: 'fa-key',
    title: 'Profitez',
    desc: 'Recevez vos clés et vivez une expérience authentique, comme chez vous.',
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
        style={{
          background: 'linear-gradient(135deg, #1A3C34 0%, #2D5A4A 25%, #D4522A 60%, #E8A838 100%)',
          backgroundSize: '300% 300%',
          animation: 'gradient 12s ease infinite',
        }}
      >
        {/* Floating shapes */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-white/5 top-[-100px] right-[-100px] animate-bounce" style={{ animationDuration: '8s' }} />
        <div className="absolute w-[250px] h-[250px] rounded-full bg-white/5 bottom-[50px] left-[-80px] animate-bounce" style={{ animationDuration: '10s', animationDelay: '2s' }} />

        <div className="relative z-10 text-center max-w-3xl">
          <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4">
            Découvrez l&apos;Afrique,<br />chez vous
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-light mb-10 leading-relaxed">
            Réservez des logements uniques dans les plus belles villes d&apos;Afrique de l&apos;Ouest.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-xl mx-auto flex">
            <input
              type="text"
              placeholder="Où allez-vous ?"
              className="flex-1 px-5 py-4 text-[var(--text)] outline-none text-[15px]"
            />
            <input
              type="date"
              className="hidden md:block px-4 py-4 border-l border-[var(--border)] text-[15px] outline-none"
            />
            <button className="px-6 bg-primary hover:bg-primary-hover transition-colors text-white text-lg">
              <i className="fa-solid fa-magnifying-glass" />
            </button>
          </div>

          {/* Destination chips */}
          <div className="flex flex-wrap gap-3 mt-8 justify-center">
            {DESTINATIONS.map((d) => (
              <Link
                key={d.name}
                href={`/search?q=${d.name}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all"
              >
                {d.name}
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-12 mt-14 justify-center">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50% }
            50% { background-position: 100% 50% }
            100% { background-position: 0% 50% }
          }
        `}</style>
      </section>

      {/* How it works */}
      <section className="py-24 px-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Comment ça marche</h2>
          <p className="text-[var(--text-sec)] mb-16">Trois étapes simples pour votre prochain séjour</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="bg-white border border-[var(--border)] rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-5 text-primary text-2xl">
                  <i className={`fa-solid ${step.icon}`} />
                </div>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-[var(--text-sec)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-secondary text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Prêt à vivre l&apos;expérience AfriStay ?</h2>
          <p className="text-white/70 mb-8">Rejoignez des milliers de voyageurs qui découvrent l&apos;Afrique autrement.</p>
          <Link
            href="/search"
            className="inline-block px-10 py-4 bg-white text-secondary font-semibold rounded-xl hover:shadow-lg transition-shadow text-base"
          >
            Explorer les logements
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}