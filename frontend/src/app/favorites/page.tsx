import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-layout';
import FavoritesFeature from '@/features/favorites/favorites';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_favorites_title'),
    description: t('metadata_favorites_description'),
  };
}

export default async function FavoritesPage() {
  const { t } = await getServerTranslator();

  return (
    <PageShell
      header={{
        label: t('favorites_page_label'),
        title: t('favorites_page_title'),
        description: t('favorites_page_description'),
      }}>
      <FavoritesFeature />
    </PageShell>
  );
}
