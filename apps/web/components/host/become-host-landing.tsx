'use client';

import Link from 'next/link';

const STEPS = [
  { icon: 'fas fa-camera', title: 'Creez votre annonce', desc: 'Ajoutez des photos, une description et un prix en 5 minutes', time: '5 min' },
  { icon: 'fas fa-handshake', title: 'Recevez des reservations', desc: 'Les voyageurs interesses vous envoient des demandes', time: '24h en moyenne' },
  { icon: 'fas fa-wallet', title: 'Recevez vos paiements', desc: 'Versement direct sur votre mobile money ou compte bancaire', time: 'Chaque mois' },
];

const STATS = [
  { value: '2 500+', label: 'Logements' },
  { value: '12', label: 'Pays couverts' },
  { value: '50 000+', label: 'Voyageurs' },
  { value: '4.7/5', label: 'Note moyenne' },
];

const TESTIMONIALS = [
  { name: 'Fatou S.', city: 'Dakar', text: "J'ai gagne 350 000 FCFA le premier mois en louant mon appartement via AfriStay.", rating: 5 },
  { name: 'Kouame B.', city: 'Abidjan', text: "Je ne suis pas proprietaire, je sous-loue mon appartement. AfriStay m'a permis de generer un revenu complementaire.", rating: 5 },
  { name: 'Aicha M.', city: 'Lagos', text: "En tant qu'hotesse, j'apprecie le dashboard qui me permet de gerer mes reservations.", rating: 4 },
];

const FAQS = [
  { q: 'Je ne suis pas proprietaire, je peux quand meme etre hote ?', a: "Oui ! Si vous sous-louez, vous pouvez relouer sur AfriStay avec l'accord de votre proprietaire." },
  { q: 'Combien coute ?', a: "L'inscription est 100% gratuite. AfriStay prend une commission de 10% uniquement quand vous recevez un paiement." },
  { q: 'Comment je suis paye ?', a: "Directement sur votre compte mobile money (Wave, Orange Money, MTN) ou par virement bancaire." },
  { q: 'Je choisis mes voyageurs ?', a: "Oui. Vous recevez une demande avec le profil du voyageur. Vous pouvez accepter ou refuser." },
  { q: 'Et si le voyageur annule ?', a: "Les dates sont liberees automatiquement et vous etes priorise pour la prochaine reservation." },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <i key={s} className={`fa-${s <= rating ? 'solid' : 'regular'} fa-star text-yellow-400 text-xs`} />
      ))}
    </div>
  );
}

export default function BecomeHostLanding() {
  return (
    <main className="pt-[68px]">
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <i className="fas fa-bolt text-yellow-300" />
            Rejoignez +500 hotes en Afrique de l'Ouest
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Gagnez des revenus avec<br />votre logement
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Que vous soyez proprietaire ou locataire, mettez votre espace a disposition de milliers de voyageurs sur AfriStay.
          </p>
          <Link
            href="/host/become-host?edit=new"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <i className="fas fa-plus" />
            Commencer maintenant - C'est gratuit
          </Link>
          <p className="text-white/60 text-sm mt-4">Aucune carte bancaire requise pour commencer</p>
        </div>
      </section>

      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Comment ca marche ?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">3 etapes simples pour commencer a gagner de l'argent</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl text-green-600 shadow-sm">
                  <i className={step.icon} />
                </div>
                <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center">{i + 1}</div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{step.desc}</p>
                <span className="inline-block text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{step.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Ils ont saute le pas</h2>
            <p className="text-gray-500">Decouvrez les temoignages de nos hotes a travers l'Afrique de l'Ouest</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <Stars rating={t.rating} />
                <p className="text-sm text-gray-700 mt-3 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-bold text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Questions frequentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50 transition">
                  <span>{faq.q}</span>
                  <i className="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Pret a commencer ?</h2>
          <p className="text-white/80 text-lg mb-8">Rejoignez la communaute d'hotes AfriStay et commencez a gagner de l'argent avec votre logement des aujourd'hui.</p>
          <Link
            href="/host/become-host?edit=new"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <i className="fas fa-plus" />
            Creer ma premiere annonce
          </Link>
        </div>
      </section>

      <div className="bg-gray-900 text-white py-10 px-6 text-center">
        <p className="text-gray-400 text-sm">2026 AfriStay - Logements en Afrique de l'Ouest</p>
      </div>
    </main>
  );
}