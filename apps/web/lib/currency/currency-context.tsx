'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flagEmoji?: string;
  rateToXof: number;
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