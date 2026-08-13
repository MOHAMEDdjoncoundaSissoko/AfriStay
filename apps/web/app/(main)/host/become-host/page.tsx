'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { ImageUpload } from '@/components/ui/image-upload';
import { Footer } from '@/components/layout/footer';
import { apiRequest } from '@/lib/api/client';
import BecomeHostLanding from '@/components/host/become-host-landing';

const STEPS = ['Informations', 'Localisation', 'Équipements', 'Prix & Capacité'];

interface PropertyForm {
  title: string;
  description: string;
  propertyTypeId: string;
  countryId: string;
  cityId: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  pricePerWeek: string;
  pricePerMonth: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaSqm: number;
  maxGuests: number;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  amenitySlugs: string[];
}

const INITIAL_FORM: PropertyForm = {
  title: '',
  description: '',
  propertyTypeId: '',
  countryId: '',
  cityId: '',
  address: '',
  latitude: 5.36,
  longitude: -3.93,
  pricePerNight: 0,
  pricePerWeek: '',
  pricePerMonth: '',
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  areaSqm: 30,
  maxGuests: 2,
  petsAllowed: false,
  smokingAllowed: false,
  amenitySlugs: [],
};

const AMENITIES = [
  { slug: 'wifi', name: 'Wifi', icon: 'fa-wifi' },
  { slug: 'climatisation', name: 'Climatisation', icon: 'fa-snowflake' },
  { slug: 'television', name: 'Télévision', icon: 'fa-tv' },
  { slug: 'cuisine', name: 'Cuisine', icon: 'fa-utensils' },
  { slug: 'refrigerateur', name: 'Réfrigérateur', icon: 'fa-temperature-low' },
  { slug: 'machine-a-laver', name: 'Machine à laver', icon: 'fa-shirt' },
  { slug: 'piscine', name: 'Piscine', icon: 'fa-person-swimming' },
  { slug: 'parking', name: 'Parking', icon: 'fa-square-parking' },
  { slug: 'balcon', name: 'Balcon', icon: 'fa-door-open' },
  { slug: 'jardin', name: 'Jardin', icon: 'fa-tree' },
  { slug: 'terrasse', name: 'Terrasse', icon: 'fa-umbrella-beach' },
  { slug: 'animaux-autorises', name: 'Animaux autorisés', icon: 'fa-paw' },
  { slug: 'coffre-fort', name: 'Coffre-fort', icon: 'fa-lock' },
  { slug: 'cameras-securite', name: 'Caméras de sécurité', icon: 'fa-video' },
  { slug: 'espace-travail', name: 'Espace de travail', icon: 'fa-laptop' },
  { slug: 'seche-cheveux', name: 'Sèche-cheveux', icon: 'fa-wind' },
];

export default function BecomeHostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') || null;
  const isEditMode = !!editId && editId !== 'new';
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PropertyForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [countries, setCountries] = useState<{ id: string; name: string; code: string; flagEmoji: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string; slug: string; countryId: string }[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // ✅ TOUS les hooks avant le return conditionnel
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiRequest<any>('/api/references');
        setCountries(data.countries);
        setCities(data.cities);
        setPropertyTypes(data.propertyTypes);

        if (editId && editId !== 'new') {
          const prop = await apiRequest<any>(`/api/properties/${editId}`);
          setForm({
            title: prop.title,
            description: prop.description,
            propertyTypeId: prop.propertyTypeId,
            countryId: prop.countryId,
            cityId: prop.cityId,
            address: prop.address,
            latitude: prop.latitude,
            longitude: prop.longitude,
            pricePerNight: prop.pricePerNight,
            pricePerWeek: prop.pricePerWeek ? String(prop.pricePerWeek) : '',
            pricePerMonth: prop.pricePerMonth ? String(prop.pricePerMonth) : '',
            bedrooms: prop.bedrooms,
            beds: prop.beds,
            bathrooms: prop.bathrooms,
            areaSqm: prop.areaSqm,
            maxGuests: prop.maxGuests,
            petsAllowed: prop.petsAllowed,
            smokingAllowed: prop.smokingAllowed,
            amenitySlugs: prop.amenities?.map((a: any) => a.amenity.slug) || [],
          });

          if (prop.images) {
            setImageUrls(prop.images.map((img: any) => img.url));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [editId]);

  // ✅ Le return conditionnel APRÈS tous les hooks
  if (!editId) {
    return <BecomeHostLanding />;
  }

  const filteredCities = cities.filter((c) => c.countryId === form.countryId);

  function update(field: keyof PropertyForm, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'countryId') {
      setForm((prev) => ({ ...prev, cityId: '' }));
    }
  }

  function toggleAmenity(slug: string) {
    setForm((prev) => ({
      ...prev,
      amenitySlugs: prev.amenitySlugs.includes(slug)
        ? prev.amenitySlugs.filter((s) => s !== slug)
        : [...prev.amenitySlugs, slug],
    }));
  }

  function nextStep() {
    if (step === 0 && (!form.title || !form.description || !form.propertyTypeId)) {
      setError('Remplissez tous les champs obligatoires');
      return;
    }
    if (step === 1 && (!form.countryId || !form.cityId || !form.address)) {
      setError('Remplissez tous les champs obligatoires');
      return;
    }
    setError('');
    setStep(step + 1);
  }

  function prevStep() {
    setError('');
    setStep(step - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('afristay_token');
    if (!token) {
      setError('Vous devez être connecté pour publier un logement');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        imageUrls: imageUrls,
        pricePerWeek: form.pricePerWeek ? parseInt(form.pricePerWeek) : null,
        pricePerMonth: form.pricePerMonth ? parseInt(form.pricePerMonth) : null,
      };

      const endpoint = isEditMode ? `/api/properties/${editId}` : '/api/properties';
      const method = isEditMode ? 'PATCH' : 'POST';
      await apiRequest(endpoint, {
        method,
        body: payload,
        token,
      });

      router.push('/host/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la publication";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[15px] bg-white';
  const labelClass = 'block text-sm font-medium mb-1.5';
  const selectClass = 'w-full px-4 py-3 border border-[var(--border)] rounded-xl outline-none focus:border-primary text-[15px] bg-white appearance-none';

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">{isEditMode ? 'Modifier votre logement' : 'Publiez votre logement'}</h1>
            <p className="text-[var(--text-sec)]">
              {isEditMode
                ? 'Modifiez les informations de votre annonce.'
                : 'Remplissez les informations ci-dessous. Vous pourrez modifier votre annonce à tout moment.'}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-[var(--border)]'}`} />
                <p className={`text-xs mt-2 ${i === step ? 'text-primary font-semibold' : 'text-[var(--text-ter)]'}`}>{s}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 0 && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                <div>
                  <label className={labelClass}>Titre de l&apos;annonce *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="Ex: Villa de luxe avec piscine à Cocody"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Décrivez votre logement en détail..."
                    rows={5}
                    className={inputClass + ' resize-none'}
                  />
                </div>

                <div>
                  <label className={labelClass}>Type de logement *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {propertyTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => update('propertyTypeId', type.id)}
                        className={`p-4 border-2 rounded-xl text-center transition-all ${
                          form.propertyTypeId === type.id
                            ? 'border-primary bg-primary-light'
                            : 'border-[var(--border)] hover:border-[var(--text-sec)]'
                        }`}
                      >
                        <i className={`fa-solid ${type.icon} text-lg mb-2 ${form.propertyTypeId === type.id ? 'text-primary' : 'text-[var(--text-sec)]'}`} />
                        <div className="text-sm font-medium">{type.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Photos de votre logement</label>
                  <p className="text-xs text-[var(--text-ter)] mb-3">La première photo sera utilisée comme image principale. Max 5 photos.</p>
                  <ImageUpload onUpload={(urls) => setImageUrls(urls)} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                <div>
                  <label className={labelClass}>Pays *</label>
                  <select
                    value={form.countryId}
                    onChange={(e) => update('countryId', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Sélectionnez un pays</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flagEmoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Ville *</label>
                  <select
                    value={form.cityId}
                    onChange={(e) => update('cityId', e.target.value)}
                    className={selectClass}
                    disabled={!form.countryId}
                  >
                    <option value="">Sélectionnez une ville</option>
                    {filteredCities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!form.countryId && (
                    <p className="text-xs text-[var(--text-ter)] mt-1">Sélectionnez d&apos;abord un pays</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Adresse complète *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="Ex: Boulevard de France, Cocody"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={form.latitude}
                      onChange={(e) => update('latitude', parseFloat(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={form.longitude}
                      onChange={(e) => update('longitude', parseFloat(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>
                <p className="text-xs text-[var(--text-ter)]">
                  <i className="fa-solid fa-circle-info mr-1" />
                  Les coordonnées seront automatiquement calculées à partir de l&apos;adresse dans une future version.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="animate-[fadeIn_0.3s_ease]">
                <p className="text-sm text-[var(--text-sec)] mb-5">Sélectionnez les équipements disponibles dans votre logement.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AMENITIES.map((a) => (
                    <button
                      key={a.slug}
                      type="button"
                      onClick={() => toggleAmenity(a.slug)}
                      className={`flex items-center gap-3 p-3.5 border-2 rounded-xl text-left transition-all ${
                        form.amenitySlugs.includes(a.slug)
                          ? 'border-primary bg-primary-light'
                          : 'border-[var(--border)] hover:border-[var(--text-sec)]'
                      }`}
                    >
                      <i className={`fa-solid ${a.icon} w-5 text-center ${form.amenitySlugs.includes(a.slug) ? 'text-primary' : 'text-[var(--text-sec)]'}`} />
                      <span className="text-sm font-medium">{a.name}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.petsAllowed}
                      onChange={(e) => update('petsAllowed', e.target.checked)}
                      className="w-5 h-5 rounded accent-[#D4522A]"
                    />
                    <span className="text-sm">Animaux autorisés</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.smokingAllowed}
                      onChange={(e) => update('smokingAllowed', e.target.checked)}
                      className="w-5 h-5 rounded accent-[#D4522A]"
                    />
                    <span className="text-sm">Fumeurs autorisés</span>
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                <div>
                  <label className={labelClass}>Prix par nuit (FCFA) *</label>
                  <input
                    type="number"
                    value={form.pricePerNight || ''}
                    onChange={(e) => update('pricePerNight', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 85000"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Prix par semaine (FCFA)</label>
                    <input
                      type="number"
                      value={form.pricePerWeek}
                      onChange={(e) => update('pricePerWeek', e.target.value)}
                      placeholder="Optionnel"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Prix par mois (FCFA)</label>
                    <input
                      type="number"
                      value={form.pricePerMonth}
                      onChange={(e) => update('pricePerMonth', e.target.value)}
                      placeholder="Optionnel"
                      className={inputClass}
                    />
                  </div>
                </div>

                <hr className="border-[var(--border)]" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Chambres *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.bedrooms}
                      onChange={(e) => update('bedrooms', parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Lits *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.beds}
                      onChange={(e) => update('beds', parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Salles de bain *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.bathrooms}
                      onChange={(e) => update('bathrooms', parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Superficie (m²) *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.areaSqm}
                      onChange={(e) => update('areaSqm', parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Nombre maximum de voyageurs *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxGuests}
                    onChange={(e) => update('maxGuests', parseInt(e.target.value))}
                    className={inputClass}
                    style={{ maxWidth: '200px' }}
                  />
                </div>

                <div className="bg-primary-light border border-primary/20 rounded-xl p-5 mt-6">
                  <h3 className="font-bold mb-3">Récapitulatif</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sec)]">Titre</span>
                      <span className="font-medium text-right max-w-[60%] truncate">{form.title || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sec)]">Type</span>
                      <span className="font-medium">{propertyTypes.find((t) => t.id === form.propertyTypeId)?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sec)]">Ville</span>
                      <span className="font-medium">{cities.find((c) => c.id === form.cityId)?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sec)]">Prix / nuit</span>
                      <span className="font-bold text-primary">{form.pricePerNight ? new Intl.NumberFormat('fr-FR').format(form.pricePerNight) + ' FCFA' : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sec)]">Équipements</span>
                      <span className="font-medium">{form.amenitySlugs.length} sélectionné{form.amenitySlugs.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-10 pt-6 border-t border-[var(--border)]">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-[var(--border)] rounded-xl font-medium hover:bg-[var(--bg-alt)] transition-colors"
                >
                  <i className="fa-solid fa-arrow-left mr-2 text-sm" />
                  Retour
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
                >
                  Suivant
                  <i className="fa-solid fa-arrow-right ml-2 text-sm" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  {loading ? 'Enregistrement...' : isEditMode ? 'Enregistrer les modifications' : 'Publier mon logement'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}