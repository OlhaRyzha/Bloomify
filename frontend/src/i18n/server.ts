import { cookies } from 'next/headers';
import { createTranslator } from '@/i18n/translator';
import { defaultLocale } from '@/locales/translations';

const LOCALE_COOKIE = 'bloomify_locale';

export async function getServerTranslator() {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value ?? defaultLocale;
  return createTranslator(locale);
}
