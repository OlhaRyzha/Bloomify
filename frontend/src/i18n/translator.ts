import {
  defaultLocale,
  translations,
  type Locale,
} from '@/locales/translations';
import { isObject } from '@/utils/guards/is-object';
import { ensureLocale } from '@/utils/i18n';

type Primitive = string | number | boolean | null | undefined;
type Vars = Record<string, Primitive> & {
  returnObjects?: boolean;
  count?: number;
};

function getByPath(source: unknown, path: string): unknown {
  if (!source || typeof source !== 'object') return undefined;
  const record = source as Record<string, unknown>;
  if (path in record) return record[path];

  return path.split('_').reduce<unknown>((acc, key) => {
    if (acc && isObject(acc) && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function getUkrainianPluralForm(count: number): string {
  const num = Math.abs(count);
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'one';
  }
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return 'few';
  }
  return 'many';
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
    let finalKey = key;

    // Handle pluralization for Ukrainian locale
    if (locale === 'uk' && vars?.count !== undefined) {
      const pluralForm = getUkrainianPluralForm(vars.count);
      const pluralKey = `${key}_${pluralForm}`;
      if (getByPath(dictionary, pluralKey) !== undefined) {
        finalKey = pluralKey;
      }
    }

    const value =
      getByPath(dictionary, finalKey) ??
      getByPath(translations[defaultLocale], finalKey);

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
