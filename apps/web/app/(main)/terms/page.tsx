import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const SECTIONS = [
  { id: "1", title: "1. Acceptation des conditions", content: "En accédant au site AfriStay, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces termes, veuillez ne pas utiliser nos services. Ces conditions s'appliquent à tous les utilisateurs, voyageurs et hôtes." },
  { id: "2", title: "2. Inscription et comptes", content: "Pour utiliser certains services, vous devez créer un compte. Vous êtes responsable de la confidentialité de vos identifiants. Toute information que vous fournissez doit être exacte et à jour. AfriStay se réserve le droit de suspendre les comptes suspects." },
  { id: "3", title: "3. Responsabilités de l'hôte", content: "Les hôtes s'engagent à fournir des descriptions exactes de leurs logements, à maintenir les propriétés propres et sécurisées, et à répondre aux demandes de réservation dans un délai raisonnable." },
  { id: "4", title: "4. Paiements et tarifs", content: "Les prix affichés incluent les frais de service. Le paiement intégral est requis pour confirmer une réservation. Les remboursements sont soumis à la politique d'annulation spécifique du logement." },
  { id: "5", title: "5. Annulations", content: "Les conditions d'annulation varient selon le logement (Flexible, Modérée ou Stricte). En cas de litige, AfriStay peut intervenir en tant que médiateur pour trouver une solution équitable." },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[100px] min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-display text-4xl font-bold mb-2">Conditions Générales</h1>
          <p className="text-[var(--text-sec)] mb-10">Dernière mise à jour : 15 Août 2026</p>

          <div className="border-l-2 border-primary pl-6 mb-10">
            <p className="text-[var(--text-sec)] leading-relaxed">
              Bienvenue sur AfriStay. Ces Conditions Générales d&apos;Utilisation régissent votre utilisation de notre plateforme et de nos services en Afrique de l&apos;Ouest.
            </p>
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