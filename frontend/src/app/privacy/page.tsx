import type { Metadata } from 'next';

import LegalPage, { getLegalPageContent } from '@/app/legal-page';
import { getAbsoluteLocalizedUrl, getLanguageAlternates } from '@/config/site';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslator();
  const content = getLegalPageContent('privacy', locale);

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: getAbsoluteLocalizedUrl('/privacy', locale),
      languages: getLanguageAlternates('/privacy'),
    },
  };
}

export default async function PrivacyPage() {
  const { locale } = await getServerTranslator();

  return (
    <LegalPage
      kind='privacy'
      locale={locale}
    />
  );
}
