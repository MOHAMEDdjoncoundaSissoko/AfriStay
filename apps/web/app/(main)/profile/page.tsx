'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';
import { ImageUpload } from '@/components/ui/image-upload';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  roles: string[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Champs du formulaire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('afristay_user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
      setFirstName(parsed.firstName);
      setLastName(parsed.lastName);
      setPhone(parsed.phone || '');
      setBio(parsed.bio || '');
      setAvatarUrl(parsed.avatarUrl);
    }
    setLoading(false);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('afristay_token');
    if (!token) return;

    try {
      const updated = await apiRequest<any>('/api/auth/profile', {
        method: 'PATCH',
        token,
        body: { firstName, lastName, phone, bio, avatarUrl },
      });

      // Mettre à jour le state et le localStorage
      setUser(updated);
      localStorage.setItem('afristay_user', JSON.stringify(updated));
      setSuccess('Profil mis à jour avec succès !');
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-[68px] min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary" />
        </main>
      </>
    );
  }

  const inputClass = 'w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[15px] bg-white';

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold mb-8">Mon profil</h1>

          {/* Avatar */}
          <div className="flex items-center gap-6 mb-10 p-6 bg-white rounded-2xl border border-[var(--border)]">
            <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.firstName?.[0] || '?'
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg mb-1">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-[var(--text-sec)] mb-3">{user?.email}</p>
              <ImageUpload 
                onUpload={(urls) => {
                  if (urls.length > 0) setAvatarUrl(urls[0]);
                }} 
                maxImages={1} 
              />
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[var(--border)] p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Prénom</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nom</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Téléphone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 00 00 00 00" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">À propos de moi</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Parlez un peu de vous, de ce que vous aimez, pourquoi vous êtes sur AfriStay..." 
                rows={4} 
                className={inputClass + ' resize-none'} 
              />
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <button type="submit" disabled={saving} className="px-8 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}