'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest<{ accessToken: string; user: { id: string; firstName: string; roles: string[] } }>(
        '/api/auth/register',
        { method: 'POST', body: form }
      );

      localStorage.setItem('afristay_token', data.accessToken);
      localStorage.setItem('afristay_user', JSON.stringify(data.user));

      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur d\'inscription';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg viewBox="0 0 28 28" className="w-8 h-8" fill="none">
              <path d="M14 2L2 24h24L14 2z" fill="#D4522A" opacity="0.15" />
              <path d="M14 6L5 22h18L14 6z" stroke="#D4522A" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="14" cy="16" r="3" fill="#D4522A" />
            </svg>
            <span className="font-display font-bold text-2xl text-primary">AfriStay</span>
          </Link>
          <h1 className="text-2xl font-bold">Inscription</h1>
          <p className="text-sm text-[var(--text-sec)] mt-1">Créez votre compte AfriStay</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Prénom</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                placeholder="Aminata"
                required
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[15px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                placeholder="Koné"
                required
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[15px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[15px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Téléphone <span className="text-[var(--text-sec)] font-normal">(optionnel)</span></label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+225 07 07 07 07 07"
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[15px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Mot de passe <span className="text-[var(--text-sec)] font-normal">(8 caractères min.)</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Votre mot de passe"
              required
              minLength={8}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[15px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-[15px]"
          >
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-sec)] mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}