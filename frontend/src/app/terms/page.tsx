import type { Metadata } from 'next';

import LegalPage, { getLegalPageContent } from '@/app/legal-page';
import { getAbsoluteLocalizedUrl, getLanguageAlternates } from '@/config/site';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslator();
  const content = getLegalPageContent('terms', locale);

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: getAbsoluteLocalizedUrl('/terms', locale),
      languages: getLanguageAlternates('/terms'),
    },
  };
}

export default async function TermsPage() {
  const { locale } = await getServerTranslator();

  return (
    <LegalPage
      kind='terms'
      locale={locale}
    />
  );
}
