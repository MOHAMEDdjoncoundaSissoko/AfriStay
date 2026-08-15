import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const TEAM = [
  { name: 'Mohamed Sissoko', role: 'Fondateur & CEO', emoji: '👨🏾‍💼' },
  { name: 'Aminata Diallo', role: 'CTO', emoji: '👩🏾‍💻' },
  { name: 'Kofi Mensah', role: 'Lead Design', emoji: '🧑🏾‍🎨' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[100px] min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Notre histoire</h1>
            <p className="text-lg text-[var(--text-sec)] leading-relaxed max-w-2xl mx-auto">
              AfriStay est né d&apos;un constat simple : il était trop difficile de trouver des logements de qualité, fiables et abordables en Afrique de l&apos;Ouest. Nous avons décidé de changer ça.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">🌍</div>
              <h3 className="font-bold mb-2">Ancrage local</h3>
              <p className="text-sm text-[var(--text-sec)]">Nous connaissons chaque ville, chaque quartier. Notre expertise est 100% locale.</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">🤝</div>
              <h3 className="font-bold mb-2">Confiance</h3>
              <p className="text-sm text-[var(--text-sec)]">Vérification des hôtes, avis authentiques, paiements sécurisés.</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">🚀</div>
              <h3 className="font-bold mb-2">Innovation</h3>
              <p className="text-sm text-[var(--text-sec)]">Une technologie moderne pensée pour les réalités du terrain africain.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-8">L&apos;équipe derrière AfriStay</h2>
          <div className="flex flex-wrap justify-center gap-8 mb-20">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-4xl mb-3 mx-auto">
                  {member.emoji}
                </div>
                <h3 className="font-bold text-sm">{member.name}</h3>
                <p className="text-xs text-[var(--text-sec)]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}