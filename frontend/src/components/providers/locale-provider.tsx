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

const LOCALE_STORAGE_KEY = 'bloomify_locale';
const LOCALE_COOKIE_KEY = 'bloomify_locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dictionary: (typeof translations)[Locale];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const persistLocale = (locale: Locale) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
};

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
    persistLocale(locale);
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    const resolvedLocale = ensureLocale(nextLocale);
    persistLocale(resolvedLocale);
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
