// Liste des devises proposées sur AfriStay.
// rateToXof = valeur de 1 unité de la devise en francs CFA (XOF).
// Ces taux sont des valeurs de secours (oct. 2026) : ils sont remplacés
// automatiquement par les taux en temps réel (voir CurrenciesService.fetchRates).
// Les devises arrimées à l'euro ont un taux fixe exact (XOF, XAF, KMF, CVE, STN, EUR).

export type CurrencyRegion =
  | 'AFRIQUE_OUEST'
  | 'AFRIQUE_CENTRALE'
  | 'AFRIQUE_NORD'
  | 'AFRIQUE_EST'
  | 'AFRIQUE_AUSTRALE'
  | 'OCEAN_INDIEN'
  | 'INTERNATIONAL';

export interface CurrencySeed {
  code: string;
  name: string;
  symbol: string;
  flagEmoji: string;
  region: CurrencyRegion;
  rateToXof: number;
}

export const CURRENCIES: CurrencySeed[] = [
  // Afrique de l'Ouest
  { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'FCFA', flagEmoji: '🇨🇮', region: 'AFRIQUE_OUEST', rateToXof: 1 },
  { code: 'NGN', name: 'Naira nigérian', symbol: '₦', flagEmoji: '🇳🇬', region: 'AFRIQUE_OUEST', rateToXof: 0.436 },
  { code: 'GHS', name: 'Cedi ghanéen', symbol: 'GH₵', flagEmoji: '🇬🇭', region: 'AFRIQUE_OUEST', rateToXof: 50.29 },
  { code: 'GNF', name: 'Franc guinéen', symbol: 'FG', flagEmoji: '🇬🇳', region: 'AFRIQUE_OUEST', rateToXof: 0.068 },
  { code: 'SLE', name: 'Leone sierra-léonais', symbol: 'Le', flagEmoji: '🇸🇱', region: 'AFRIQUE_OUEST', rateToXof: 26 },
  { code: 'LRD', name: 'Dollar libérien', symbol: 'L$', flagEmoji: '🇱🇷', region: 'AFRIQUE_OUEST', rateToXof: 3.2 },
  { code: 'GMD', name: 'Dalasi gambien', symbol: 'D', flagEmoji: '🇬🇲', region: 'AFRIQUE_OUEST', rateToXof: 7.94 },
  { code: 'CVE', name: 'Escudo cap-verdien', symbol: 'Esc', flagEmoji: '🇨🇻', region: 'AFRIQUE_OUEST', rateToXof: 5.949 },
  { code: 'MRU', name: 'Ouguiya mauritanien', symbol: 'UM', flagEmoji: '🇲🇷', region: 'AFRIQUE_OUEST', rateToXof: 14.7 },

  // Afrique centrale
  { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA', flagEmoji: '🇨🇲', region: 'AFRIQUE_CENTRALE', rateToXof: 1 },
  { code: 'CDF', name: 'Franc congolais', symbol: 'FC', flagEmoji: '🇨🇩', region: 'AFRIQUE_CENTRALE', rateToXof: 0.206 },
  { code: 'AOA', name: 'Kwanza angolais', symbol: 'Kz', flagEmoji: '🇦🇴', region: 'AFRIQUE_CENTRALE', rateToXof: 0.64 },
  { code: 'STN', name: 'Dobra santoméen', symbol: 'Db', flagEmoji: '🇸🇹', region: 'AFRIQUE_CENTRALE', rateToXof: 26.774 },

  // Afrique du Nord
  { code: 'MAD', name: 'Dirham marocain', symbol: 'DH', flagEmoji: '🇲🇦', region: 'AFRIQUE_NORD', rateToXof: 59.74 },
  { code: 'DZD', name: 'Dinar algérien', symbol: 'DA', flagEmoji: '🇩🇿', region: 'AFRIQUE_NORD', rateToXof: 4.5 },
  { code: 'TND', name: 'Dinar tunisien', symbol: 'DT', flagEmoji: '🇹🇳', region: 'AFRIQUE_NORD', rateToXof: 195.9 },
  { code: 'LYD', name: 'Dinar libyen', symbol: 'LD', flagEmoji: '🇱🇾', region: 'AFRIQUE_NORD', rateToXof: 108 },
  { code: 'EGP', name: 'Livre égyptienne', symbol: 'E£', flagEmoji: '🇪🇬', region: 'AFRIQUE_NORD', rateToXof: 10.49 },
  { code: 'SDG', name: 'Livre soudanaise', symbol: 'LS', flagEmoji: '🇸🇩', region: 'AFRIQUE_NORD', rateToXof: 0.98 },

  // Afrique de l'Est
  { code: 'KES', name: 'Shilling kényan', symbol: 'KSh', flagEmoji: '🇰🇪', region: 'AFRIQUE_EST', rateToXof: 4.509 },
  { code: 'UGX', name: 'Shilling ougandais', symbol: 'USh', flagEmoji: '🇺🇬', region: 'AFRIQUE_EST', rateToXof: 0.1379 },
  { code: 'TZS', name: 'Shilling tanzanien', symbol: 'TSh', flagEmoji: '🇹🇿', region: 'AFRIQUE_EST', rateToXof: 0.235 },
  { code: 'RWF', name: 'Franc rwandais', symbol: 'FRw', flagEmoji: '🇷🇼', region: 'AFRIQUE_EST', rateToXof: 0.41 },
  { code: 'BIF', name: 'Franc burundais', symbol: 'FBu', flagEmoji: '🇧🇮', region: 'AFRIQUE_EST', rateToXof: 0.199 },
  { code: 'ETB', name: 'Birr éthiopien', symbol: 'Br', flagEmoji: '🇪🇹', region: 'AFRIQUE_EST', rateToXof: 3.9 },
  { code: 'DJF', name: 'Franc djiboutien', symbol: 'Fdj', flagEmoji: '🇩🇯', region: 'AFRIQUE_EST', rateToXof: 3.3 },
  { code: 'SOS', name: 'Shilling somalien', symbol: 'Sh.So.', flagEmoji: '🇸🇴', region: 'AFRIQUE_EST', rateToXof: 1.03 },
  { code: 'ERN', name: 'Nakfa érythréen', symbol: 'Nfk', flagEmoji: '🇪🇷', region: 'AFRIQUE_EST', rateToXof: 39.2 },
  { code: 'SSP', name: 'Livre sud-soudanaise', symbol: 'SSP', flagEmoji: '🇸🇸', region: 'AFRIQUE_EST', rateToXof: 0.13 },

  // Afrique australe
  { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R', flagEmoji: '🇿🇦', region: 'AFRIQUE_AUSTRALE', rateToXof: 35.15 },
  { code: 'BWP', name: 'Pula botswanais', symbol: 'P', flagEmoji: '🇧🇼', region: 'AFRIQUE_AUSTRALE', rateToXof: 42.41 },
  { code: 'NAD', name: 'Dollar namibien', symbol: 'N$', flagEmoji: '🇳🇦', region: 'AFRIQUE_AUSTRALE', rateToXof: 35.16 },
  { code: 'LSL', name: 'Loti lesothan', symbol: 'L', flagEmoji: '🇱🇸', region: 'AFRIQUE_AUSTRALE', rateToXof: 35.15 },
  { code: 'SZL', name: 'Lilangeni eswatinien', symbol: 'E', flagEmoji: '🇸🇿', region: 'AFRIQUE_AUSTRALE', rateToXof: 35.15 },
  { code: 'ZMW', name: 'Kwacha zambien', symbol: 'ZK', flagEmoji: '🇿🇲', region: 'AFRIQUE_AUSTRALE', rateToXof: 24.5 },
  { code: 'MWK', name: 'Kwacha malawien', symbol: 'MK', flagEmoji: '🇲🇼', region: 'AFRIQUE_AUSTRALE', rateToXof: 0.335 },
  { code: 'MZN', name: 'Metical mozambicain', symbol: 'MT', flagEmoji: '🇲🇿', region: 'AFRIQUE_AUSTRALE', rateToXof: 9.19 },
  { code: 'ZWG', name: 'Zimbabwe Gold', symbol: 'ZiG', flagEmoji: '🇿🇼', region: 'AFRIQUE_AUSTRALE', rateToXof: 21.7 },

  // Océan Indien
  { code: 'MGA', name: 'Ariary malgache', symbol: 'Ar', flagEmoji: '🇲🇬', region: 'OCEAN_INDIEN', rateToXof: 0.1299 },
  { code: 'MUR', name: 'Roupie mauricienne', symbol: 'Rs', flagEmoji: '🇲🇺', region: 'OCEAN_INDIEN', rateToXof: 12.43 },
  { code: 'SCR', name: 'Roupie seychelloise', symbol: 'SR', flagEmoji: '🇸🇨', region: 'OCEAN_INDIEN', rateToXof: 42.52 },
  { code: 'KMF', name: 'Franc comorien', symbol: 'CF', flagEmoji: '🇰🇲', region: 'OCEAN_INDIEN', rateToXof: 1.3333 },

  // International
  { code: 'EUR', name: 'Euro', symbol: '€', flagEmoji: '🇪🇺', region: 'INTERNATIONAL', rateToXof: 655.957 },
  { code: 'USD', name: 'Dollar américain', symbol: '$', flagEmoji: '🇺🇸', region: 'INTERNATIONAL', rateToXof: 587.4 },
];