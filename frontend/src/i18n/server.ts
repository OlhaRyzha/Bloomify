import { headers } from 'next/headers';
import { LOCALE_HEADER } from '@/i18n/routing';
import { createTranslator } from '@/i18n/translator';
import { defaultLocale } from '@/locales/translations';

export async function getServerTranslator() {
  const headerStore = await headers();
  const locale = headerStore.get(LOCALE_HEADER) ?? defaultLocale;
  return createTranslator(locale);
}
