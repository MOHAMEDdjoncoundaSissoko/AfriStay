'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flagEmoji?: string;
  region?: string | null;
  rateToXof: number;
}

// Ordre et libellés des régions affichées dans les sélecteurs de devise
export const CURRENCY_REGIONS: { key: string; label: string }[] = [
  { key: 'AFRIQUE_OUEST', label: "Afrique de l'Ouest" },
  { key: 'AFRIQUE_CENTRALE', label: 'Afrique centrale' },
  { key: 'AFRIQUE_NORD', label: 'Afrique du Nord' },
  { key: 'AFRIQUE_EST', label: "Afrique de l'Est" },
  { key: 'AFRIQUE_AUSTRALE', label: 'Afrique australe' },
  { key: 'OCEAN_INDIEN', label: 'Océan Indien' },
  { key: 'INTERNATIONAL', label: 'International' },
];

// Regroupe les devises par région (les devises sans région vont dans « Autres »)
export function groupCurrenciesByRegion<T extends { region?: string | null }>(list: T[]) {
  const groups = CURRENCY_REGIONS.map((r) => ({
    ...r,
    currencies: list.filter((c) => c.region === r.key),
  }));
  const others = list.filter((c) => !CURRENCY_REGIONS.some((r) => r.key === c.region));
  if (others.length > 0) groups.push({ key: 'AUTRES', label: 'Autres', currencies: others });
  return groups.filter((g) => g.currencies.length > 0);
}

interface CurrencyContextType {
  currencies: Currency[];
  selectedCurrency: string;
  setSelectedCurrency: (code: string) => void;
  convert: (amount: number, fromCurrency: string) => { amount: number; symbol: string };
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrencyState] = useState('XOF');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('afristay_currency');
    if (saved) setSelectedCurrencyState(saved);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/currencies`)
      .then(res => res.json())
      .then(data => setCurrencies(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setSelectedCurrency = (code: string) => {
    setSelectedCurrencyState(code);
    localStorage.setItem('afristay_currency', code);
  };

  const convert = (amount: number, fromCurrency: string) => {
    if (loading || currencies.length === 0) return { amount, symbol: '' };

    const from = currencies.find(c => c.code === fromCurrency);
    const to = currencies.find(c => c.code === selectedCurrency);

    if (!from || !to || fromCurrency === selectedCurrency) {
      const currency = currencies.find(c => c.code === fromCurrency);
      return { amount, symbol: currency?.symbol || '' };
    }

    const amountInXof = amount * from.rateToXof;
    const converted = amountInXof / to.rateToXof;

    return { amount: Math.round(converted), symbol: to.symbol };
  };

  return (
    <CurrencyContext.Provider value={{ currencies, selectedCurrency, setSelectedCurrency, convert, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
}