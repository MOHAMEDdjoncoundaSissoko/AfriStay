import { Metadata } from 'next';
import PropertyDetails from './property-details';

type Props = {
  params: Promise<{ id: string }>;
};

async function getProperty(id: string) {
  try {
    const res = await fetch(`http://localhost:4000/api/properties/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return { title: 'Logement introuvable | AfriStay' };
  }

  const imageUrl = property.images?.[0]?.url || '';
  const price = property.pricePerNight 
    ? `${new Intl.NumberFormat('fr-FR').format(property.pricePerNight)} FCFA / nuit` 
    : '';

  return {
    title: `${property.title} | AfriStay`,
    description: property.description?.substring(0, 160) || `Réservez ${property.title} sur AfriStay. ${price}`,
    openGraph: {
      title: property.title,
      description: property.description?.substring(0, 160) || `Découvrez ce logement en Afrique de l'Ouest.`,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
      type: 'website',
      locale: 'fr_FR',
      siteName: 'AfriStay',
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);

  return <PropertyDetails property={property} error={!property ? 'Logement non trouvé' : undefined} />;
}