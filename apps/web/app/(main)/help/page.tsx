import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const FAQS = [
  { q: "Comment réserver un logement ?", a: "Rendez-vous sur la page de recherche, sélectionnez votre destination, vos dates et le nombre de voyageurs. Cliquez sur le logement qui vous plaît puis sur 'Réserver'." },
  { q: "Comment fonctionne le paiement ?", a: "Nous acceptons les paiements par carte bancaire et mobile money. Le paiement est débité uniquement après confirmation de l'hôte." },
  { q: "Puis-je annuler ma réservation ?", a: "Oui, chaque réservation est soumise à la politique d'annulation propre au logement. Vous pouvez consulter cette politique avant de valider." },
  { q: "Comment devenir hôte sur AfriStay ?", a: "Cliquez sur 'Devenir hôte' dans le menu, créez votre annonce en quelques étapes et commencez à recevoir des réservations." },
];

const CATEGORIES = [
  { icon: 'fa-credit-card', title: 'Paiements', desc: 'Moyens de paiement, facturation, remboursements' },
  { icon: 'fa-calendar-xmark', title: 'Réservations', desc: 'Annulation, modification, confirmation' },
  { icon: 'fa-user-shield', title: 'Mon Compte', desc: 'Profil, vérification, sécurité' },
  { icon: 'fa-house-user', title: 'Espace Hôte', desc: 'Gérer ses annonces, calendrier, tarifs' },
];

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[100px] min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="font-display text-4xl font-bold mb-2 text-center">Centre d&apos;aide</h1>
          <p className="text-center text-[var(--text-sec)] mb-12">Trouvez rapidement la réponse à votre question</p>

          <div className="relative mb-16">
            <input 
              type="text" 
              placeholder="Tapez votre question ici..." 
              className="w-full px-6 py-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] outline-none focus:ring-2 focus:ring-primary/20 text-[16px]"
            />
            <i className="fa-solid fa-magnifying-glass absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-ter)]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {CATEGORIES.map((cat) => (
              <div key={cat.title} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
                <i className={`fa-solid ${cat.icon} text-2xl text-primary mb-3`} />
                <h3 className="font-semibold text-sm mb-1">{cat.title}</h3>
                <p className="text-xs text-[var(--text-sec)]">{cat.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-6">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-sm font-semibold hover:bg-[var(--bg-alt)] transition">
                  <span>{faq.q}</span>
                  <i className="fas fa-chevron-down text-xs text-[var(--text-ter)] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-5 text-sm text-[var(--text-sec)] leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}