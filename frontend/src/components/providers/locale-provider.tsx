'use client';

import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { defaultLocale, supportedLocales, translations, type Locale } from '@/locales/translations';

const LOCALE_STORAGE_KEY = 'bloomify_locale';
const LOCALE_COOKIE_KEY = 'bloomify_locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dictionary: (typeof translations)[Locale];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  children: ReactNode;
};

function resolveInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  if (savedLocale && supportedLocales.includes(savedLocale)) {
    return savedLocale;
  }

  const navigatorLocale = window.navigator.language?.split('-')[0];
  if (navigatorLocale && supportedLocales.includes(navigatorLocale as Locale)) {
    return navigatorLocale as Locale;
  }

  return defaultLocale;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);

    if (typeof window === 'undefined') return;

    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
    document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      dictionary: translations[locale],
    }),
    [locale]
  );

  return <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
