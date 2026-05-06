import { type Locale, supportedLocales, defaultLocale } from '@/locales/translations';

const numberLocales: Record<Locale, string> = {
  uk: 'uk-UA',
  en: 'en-US',
  pl: 'pl-PL',
};

export function formatCurrency(value: number, locale: Locale = defaultLocale) {
  const formatter = new Intl.NumberFormat(numberLocales[locale] ?? numberLocales[defaultLocale], {
    maximumFractionDigits: 0,
  });

  return `${formatter.format(value)} ₴`;
}

export function formatTemplate(
  template: string,
  values?: Record<string, number | string>
) {
  if (!values) return template;

  return Object.entries(values).reduce((result, [key, value]) => {
    const token = new RegExp(`{{${key}}}`, 'g');
    return result.replace(token, String(value));
  }, template);
}

export function ensureLocale(value?: string): Locale {
  if (value && supportedLocales.includes(value as Locale)) {
    return value as Locale;
  }
  return defaultLocale;
}
