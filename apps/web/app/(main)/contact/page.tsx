'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('afristay_user') : null;
    let parsedUser = null;
    if (userStr) {
      try { parsedUser = JSON.parse(userStr); } catch {}
    }

    const payload = {
      firstName: parsedUser?.firstName || form.get('firstName') || '',
      lastName: parsedUser?.lastName || form.get('lastName') || '',
      email: parsedUser?.email || form.get('email') || '',
      subject: form.get('subject') || '',
      message: form.get('message') || '',
      userId: parsedUser?.id || null,
    };

    try {
      await apiRequest('/api/contact', {
        method: 'POST',
        body: payload,
      });
      setSent(true);
    } catch (err: any) {
      console.error(err);
      alert("Erreur : " + (err?.message || "Inconnue"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[15px] bg-[var(--card)]';

  return (
    <>
      <Navbar />
      <main className="pt-[100px] min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="font-display text-4xl font-bold mb-2 text-center">Contactez-nous</h1>
          <p className="text-center text-[var(--text-sec)] mb-12">Une question ? Notre équipe est là pour vous aider.</p>

          <div className="grid md:grid-cols-5 gap-10">
            {/* Formulaire */}
            <div className="md:col-span-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
              {sent ? (
                <div className="text-center py-10">
                  <i className="fa-solid fa-circle-check text-green-500 text-5xl mb-4" />
                  <h3 className="text-xl font-bold mb-2">Message envoyé !</h3>
                  <p className="text-[var(--text-sec)]">Nous vous répondrons dans les plus brefs délais.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Prénom</label>
                      <input type="text" name="firstName" required placeholder="Mohamed" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Nom</label>
                      <input type="text" name="lastName" required placeholder="Sissoko" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <input type="email" name="email" required placeholder="mohamed@email.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Sujet</label>
                    <select name="subject" required className={inputClass}>
                      <option value="">Sélectionnez un sujet</option>
                      <option>Problème de réservation</option>
                      <option>Question sur un paiement</option>
                      <option>Devenir partenaire</option>
                      <option>Signaler un bug</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Message</label>
                    <textarea name="message" required rows={5} placeholder="Décrivez votre demande..." className={inputClass + ' resize-none'} />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                  </button>
                </form>
              )}
            </div>

            {/* Infos */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-bold mb-4">Nos coordonnées</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-envelope text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-[var(--text-sec)]">support@afristay.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-phone text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-[var(--text-sec)]">+225 00 00 00 00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-location-dot text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-[var(--text-sec)]">Cocody, Abidjan, Côte d&apos;Ivoire</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <h3 className="font-bold mb-2 text-primary">Besoin d'aide rapide ?</h3>
                <p className="text-sm text-[var(--text-sec)] mb-4">Consultez notre centre d'aide pour des réponses instantanées.</p>
                <a href="/help" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  Voir le Centre d'aide <i className="fa-solid fa-arrow-right text-xs" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}