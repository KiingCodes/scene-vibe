import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type CountryCode = 'ZA' | 'ZW';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  cities: string[];
}

export const COUNTRIES: Country[] = [
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'] },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', cities: ['Harare', 'Bulawayo', 'Victoria Falls'] },
];

const STORAGE_KEY = 'scene:selected-country';

interface Ctx {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  meta: Country;
}

const CountryContext = createContext<Ctx | null>(null);

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountryState] = useState<CountryCode>(() => {
    if (typeof window === 'undefined') return 'ZA';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return (stored === 'ZW' || stored === 'ZA') ? stored : 'ZA';
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, country); } catch {}
  }, [country]);

  const setCountry = (c: CountryCode) => setCountryState(c);
  const meta = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  return (
    <CountryContext.Provider value={{ country, setCountry, meta }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used inside CountryProvider');
  return ctx;
};
