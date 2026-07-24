import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seed...');

  // ===== PAYS =====
  const countries = await Promise.all([
    prisma.country.upsert({
      where: { code: 'CI' },
      update: {},
      create: { name: "Côte d'Ivoire", code: 'CI', flagEmoji: '🇨🇮', phonePrefix: '+225', currency: 'XOF' },
    }),
    prisma.country.upsert({
      where: { code: 'SN' },
      update: {},
      create: { name: 'Sénégal', code: 'SN', flagEmoji: '🇸🇳', phonePrefix: '+221', currency: 'XOF' },
    }),
    prisma.country.upsert({
      where: { code: 'NG' },
      update: {},
      create: { name: 'Nigeria', code: 'NG', flagEmoji: '🇳🇬', phonePrefix: '+234', currency: 'NGN' },
    }),
    prisma.country.upsert({
      where: { code: 'GH' },
      update: {},
      create: { name: 'Ghana', code: 'GH', flagEmoji: '🇬🇭', phonePrefix: '+233', currency: 'GHS' },
    }),
    prisma.country.upsert({
      where: { code: 'ML' },
      update: {},
      create: { name: 'Mali', code: 'ML', flagEmoji: '🇲🇱', phonePrefix: '+223', currency: 'XOF' },
    }),
    prisma.country.upsert({
      where: { code: 'BJ' },
      update: {},
      create: { name: 'Bénin', code: 'BJ', flagEmoji: '🇧🇯', phonePrefix: '+229', currency: 'XOF' },
    }),
    prisma.country.upsert({
      where: { code: 'BF' },
      update: {},
      create: { name: 'Burkina Faso', code: 'BF', flagEmoji: '🇧🇫', phonePrefix: '+226', currency: 'XOF' },
    }),
    prisma.country.upsert({
      where: { code: 'GN' },
      update: {},
      create: { name: 'Guinée', code: 'GN', flagEmoji: '🇬🇳', phonePrefix: '+224', currency: 'GNF' },
    }),
    prisma.country.upsert({
      where: { code: 'TG' },
      update: {},
      create: { name: 'Togo', code: 'TG', flagEmoji: '🇹🇬', phonePrefix: '+228', currency: 'XOF' },
    }),
    prisma.country.upsert({
      where: { code: 'NE' },
      update: {},
      create: { name: 'Niger', code: 'NE', flagEmoji: '🇳🇪', phonePrefix: '+227', currency: 'XOF' },
    }),
    prisma.country.upsert({
      where: { code: 'CM' },
      update: {},
      create: { name: 'Cameroun', code: 'CM', flagEmoji: '🇨🇲', phonePrefix: '+237', currency: 'XAF' },
    }),
  ]);

  const countryMap: Record<string, string> = {};
  countries.forEach((c) => {
    countryMap[c.code] = c.id;
  });

  console.log(`✅ ${countries.length} pays créés`);

  // ===== VILLES =====
  const citiesData = [
    { name: 'Abidjan', slug: 'abidjan', code: 'CI', lat: 5.3600, lng: -3.9333 },
    { name: 'Yamoussoukro', slug: 'yamoussoukro', code: 'CI', lat: 6.8276, lng: -5.2893 },
    { name: 'Bouaké', slug: 'bouake', code: 'CI', lat: 7.6939, lng: -5.0303 },
    { name: 'San-Pédro', slug: 'san-pedro', code: 'CI', lat: 4.7485, lng: -6.6363 },
    { name: 'Dakar', slug: 'dakar', code: 'SN', lat: 14.7167, lng: -17.4677 },
    { name: 'Saly', slug: 'saly', code: 'SN', lat: 14.1150, lng: -16.9450 },
    { name: 'Saint-Louis', slug: 'saint-louis', code: 'SN', lat: 16.0177, lng: -16.4897 },
    { name: 'Lagos', slug: 'lagos', code: 'NG', lat: 6.5244, lng: 3.3792 },
    { name: 'Abuja', slug: 'abuja', code: 'NG', lat: 9.0579, lng: 7.4951 },
    { name: 'Accra', slug: 'accra', code: 'GH', lat: 5.6037, lng: -0.1870 },
    { name: 'Kumasi', slug: 'kumasi', code: 'GH', lat: 6.6884, lng: -1.6244 },
    { name: 'Bamako', slug: 'bamako', code: 'ML', lat: 12.6392, lng: -8.0029 },
    { name: 'Cotonou', slug: 'cotonou', code: 'BJ', lat: 6.3654, lng: 2.4273 },
    { name: 'Ouagadougou', slug: 'ouagadougou', code: 'BF', lat: 12.3714, lng: -1.5197 },
    { name: 'Conakry', slug: 'conakry', code: 'GN', lat: 9.6412, lng: -13.5784 },
    { name: 'Lomé', slug: 'lome', code: 'TG', lat: 6.1319, lng: 1.2228 },
    { name: 'Niamey', slug: 'niamey', code: 'NE', lat: 13.5137, lng: 2.1098 },
    { name: 'Douala', slug: 'douala', code: 'CM', lat: 4.0511, lng: 9.7679 },
    { name: 'Yaoundé', slug: 'yaounde', code: 'CM', lat: 3.8480, lng: 11.5021 },
  ];

  const cities = await Promise.all(
    citiesData.map((c) =>
      prisma.city.upsert({
        where: { slug: c.slug },
        update: {},
        create: {
          name: c.name,
          slug: c.slug,
          countryId: countryMap[c.code],
          latitude: c.lat,
          longitude: c.lng,
        },
      })
    )
  );

  console.log(`✅ ${cities.length} villes créées`);

  // ===== TYPES DE LOGEMENT =====
  const propertyTypes = await Promise.all([
    prisma.propertyType.upsert({ where: { slug: 'villa' }, update: {}, create: { name: 'Villa', slug: 'villa', icon: 'fa-house-chimney', description: 'Maison indépendante avec jardin' } }),
    prisma.propertyType.upsert({ where: { slug: 'appartement' }, update: {}, create: { name: 'Appartement', slug: 'appartement', icon: 'fa-building', description: 'Logement dans un immeuble' } }),
    prisma.propertyType.upsert({ where: { slug: 'studio' }, update: {}, create: { name: 'Studio', slug: 'studio', icon: 'fa-door-open', description: 'Pièce unique avec coin cuisine' } }),
    prisma.propertyType.upsert({ where: { slug: 'maison' }, update: {}, create: { name: 'Maison', slug: 'maison', icon: 'fa-house', description: 'Maison de ville ou de campagne' } }),
    prisma.propertyType.upsert({ where: { slug: 'residence' }, update: {}, create: { name: 'Résidence', slug: 'residence', icon: 'fa-city', description: 'Logement dans une résidence sécurisée' } }),
    prisma.propertyType.upsert({ where: { slug: 'hotel' }, update: {}, create: { name: 'Hôtel', slug: 'hotel', icon: 'fa-hotel', description: 'Chambre ou suite d\'hôtel' } }),
  ]);

  console.log(`✅ ${propertyTypes.length} types de logement créés`);

  // ===== ÉQUIPEMENTS =====
  const amenitiesData = [
    { name: 'Wifi', slug: 'wifi', icon: 'fa-wifi', category: 'comfort' },
    { name: 'Climatisation', slug: 'climatisation', icon: 'fa-snowflake', category: 'comfort' },
    { name: 'Télévision', slug: 'television', icon: 'fa-tv', category: 'comfort' },
    { name: 'Cuisine', slug: 'cuisine', icon: 'fa-utensils', category: 'kitchen' },
    { name: 'Réfrigérateur', slug: 'refrigerateur', icon: 'fa-temperature-low', category: 'kitchen' },
    { name: 'Four micro-ondes', slug: 'four-micro-ondes', icon: 'fa-clock', category: 'kitchen' },
    { name: 'Machine à laver', slug: 'machine-a-laver', icon: 'fa-shirt', category: 'kitchen' },
    { name: 'Piscine', slug: 'piscine', icon: 'fa-person-swimming', category: 'outdoor' },
    { name: 'Parking', slug: 'parking', icon: 'fa-square-parking', category: 'outdoor' },
    { name: 'Balcon', slug: 'balcon', icon: 'fa-door-open', category: 'outdoor' },
    { name: 'Jardin', slug: 'jardin', icon: 'fa-tree', category: 'outdoor' },
    { name: 'Terrasse', slug: 'terrasse', icon: 'fa-umbrella-beach', category: 'outdoor' },
    { name: 'Animaux autorisés', slug: 'animaux-autorises', icon: 'fa-paw', category: 'rules' },
    { name: 'Coffre-fort', slug: 'coffre-fort', icon: 'fa-lock', category: 'security' },
    { name: 'Caméras de sécurité', slug: 'cameras-securite', icon: 'fa-video', category: 'security' },
    { name: 'Détecteur de fumée', slug: 'detecteur-fumee', icon: 'fa-fire', category: 'security' },
    { name: 'Lave-vaisselle', slug: 'lave-vaisselle', icon: 'fa-faucet-drip', category: 'kitchen' },
    { name: 'Espace de travail', slug: 'espace-travail', icon: 'fa-laptop', category: 'comfort' },
    { name: 'Fer à repasser', slug: 'fer-a-repasser', icon: 'fa-shirt', category: 'comfort' },
    { name: 'Sèche-cheveux', slug: 'seche-cheveux', icon: 'fa-wind', category: 'comfort' },
  ];

  const amenities = await Promise.all(
    amenitiesData.map((a) =>
      prisma.amenity.upsert({
        where: { slug: a.slug },
        update: {},
        create: a,
      })
    )
  );

  console.log(`✅ ${amenities.length} équipements créés`);

  // ===== COMMISSION PAR DÉFAUT =====
  await prisma.commission.upsert({
    where: { id: 'default-commission' },
    update: {},
    create: {
      id: 'default-commission',
      percentage: 10.0,
      isActive: true,
    },
  });

  console.log('✅ Commission par défaut créée (10%)');

  console.log('\n🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });