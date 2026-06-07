import {
  type Locale,
  supportedLocales,
  defaultLocale,
} from '@/locales/translations';

const numberLocales: Record<Locale, string> = {
  uk: 'uk-UA',
  en: 'en-US',
  pl: 'pl-PL',
};

const bouquetCountLabels: Record<
  Locale,
  Partial<Record<Intl.LDMLPluralRule, string>>
> = {
  uk: {
    one: 'букет',
    few: 'букети',
    many: 'букетів',
    other: 'букетів',
  },
  en: {
    one: 'bouquet',
    other: 'bouquets',
  },
  pl: {
    one: 'bukiet',
    few: 'bukiety',
    many: 'bukietów',
    other: 'bukietów',
  },
};

export function formatCurrency(
  value: string | number,
  locale: Locale = defaultLocale
) {
  const formatter = new Intl.NumberFormat(
    numberLocales[locale] ?? numberLocales[defaultLocale],
    {
      maximumFractionDigits: 0,
    }
  );

  return `${formatter.format(Number(value))} ₴`;
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

export function getBouquetCountLabel(
  count: number,
  locale: Locale = defaultLocale
) {
  const pluralCategory = new Intl.PluralRules(numberLocales[locale]).select(
    count
  );
  const labels =
    bouquetCountLabels[locale] ?? bouquetCountLabels[defaultLocale];

  return labels[pluralCategory] ?? labels.other ?? labels.many ?? 'bouquets';
}

export function ensureLocale(value?: string): Locale {
  if (value && supportedLocales.includes(value as Locale)) {
    return value as Locale;
  }
  return defaultLocale;
}
