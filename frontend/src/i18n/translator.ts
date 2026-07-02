import { defaultLocale, translations, type Locale } from '@/locales/translations';
import { ensureLocale } from '@/utils/i18n';
import { isObject } from '@/utils/guards/is-object';
import { isString } from '@/utils/guards/is-string';

type Primitive = string | number | boolean | null | undefined;
type Vars = Record<string, Primitive> & { returnObjects?: boolean };

function getByPath(source: unknown, path: string): unknown {
  if (!isObject(source)) return undefined;
  if (path in source) return source[path];

  return path.split('_').reduce<unknown>((acc, key) => {
    if (isObject(acc) && key in acc) {
      return acc[key];
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

    if (isString(value)) {
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
