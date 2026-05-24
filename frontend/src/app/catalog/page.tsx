import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-layout';
import CatalogGrid from '@/features/catalog/catalog-grid';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_catalog_title'),
    description: t('metadata_catalog_description'),
  };
}

export default async function CatalogPage() {
  const { t } = await getServerTranslator();

  return (
    <PageShell
      header={{
        label: t('sections_catalog_label'),
        title: t('sections_catalog_title'),
        description: t('sections_catalog_description'),
      }}>
      <CatalogGrid />
    </PageShell>
  );
}
