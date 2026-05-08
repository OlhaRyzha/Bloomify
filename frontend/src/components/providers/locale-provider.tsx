'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  defaultLocale,
  translations,
  type Locale,
} from '@/locales/translations';
import { ensureLocale } from '@/utils/i18n';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dictionary: (typeof translations)[Locale];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  children: ReactNode;
  initialLocale?: string;
};

export function LocaleProvider({
  children,
  initialLocale,
}: LocaleProviderProps) {
  const resolvedInitialLocale = ensureLocale(initialLocale);
  const [locale, setLocaleState] = useState<Locale>(resolvedInitialLocale);

  useEffect(() => {
    document.documentElement.lang = resolvedInitialLocale;
  }, [resolvedInitialLocale]);

  const setLocale = (nextLocale: Locale) => {
    const resolvedLocale = ensureLocale(nextLocale);
    document.documentElement.lang = resolvedLocale;
    setLocaleState(resolvedLocale);
  };

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      dictionary: translations[locale] ?? translations[defaultLocale],
    }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
