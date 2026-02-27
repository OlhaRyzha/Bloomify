import { defaultLocale, translations, type Locale } from '@/locales/translations';
import { ensureLocale } from '@/utils/i18n';

type Primitive = string | number | boolean | null | undefined;
type Vars = Record<string, Primitive> & { returnObjects?: boolean };

function getByPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return Object.entries(vars).reduce((acc, [k, v]) => {
    return acc.replaceAll(`{{${k}}}`, String(v ?? ''));
  }, template);
}

export function createTranslator(localeInput?: string) {
  const locale = ensureLocale(localeInput) as Locale;
  const dictionary = translations[locale] ?? translations[defaultLocale];

  const t = (key: string, vars?: Vars): string => {
    const value = getByPath(dictionary, key) ?? getByPath(translations[defaultLocale], key);

    if (typeof value === 'string') {
      return interpolate(value, vars);
    }

    if (value == null) {
      return key;
    }

    if (vars?.returnObjects) {
      return value as unknown as string;
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  };

  return { t, locale, dictionary };
}
