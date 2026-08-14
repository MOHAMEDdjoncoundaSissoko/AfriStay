import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const SECTIONS = [
  { id: '1', title: 'Données que nous collectons', content: "Nous collectons vos données d'inscription (nom, email, téléphone), vos données de navigation, vos préférences de voyage et les informations de paiement sécurisées via nos prestataires." },
  { id: '2', title: 'Utilisation de vos données', content: "Vos données servent à améliorer votre expérience, à traiter vos réservations, à communiquer avec vous et à assurer la sécurité de la plateforme. Nous ne vendons jamais vos données personnelles." },
  { id: '3', title: 'Cookies et suivi', content: "Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques pour comprendre comment vous utilisez AfriStay. Vous pouvez gérer vos préférences à tout moment." },
  { id: '4', title: 'Sécurité des données', content: "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé ou toute modification." },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[100px] min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-display text-4xl font-bold mb-2">Politique de Confidentialité</h1>
          <p className="text-[var(--text-sec)] mb-10">Dernière mise à jour : 15 Août 2026</p>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-10 flex items-start gap-4">
            <i className="fa-solid fa-shield-halved text-primary text-2xl mt-1" />
            <div>
              <h3 className="font-bold mb-1">Notre engagement</h3>
              <p className="text-sm text-[var(--text-sec)] leading-relaxed">Chez AfriStay, la confidentialité de vos données est une priorité absolue. Cette page explique exactement ce que nous faisons de vos informations.</p>
            </div>
          </div>

          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold mb-3">{s.title}</h2>
                <p className="text-[var(--text-sec)] leading-relaxed text-[15px]">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}