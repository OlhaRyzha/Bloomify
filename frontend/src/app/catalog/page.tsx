import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-layout';
import CatalogGrid from '@/features/catalog/list/catalog-grid';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('label_bouquet_catalog'),
    description: t('metadata_catalog_description'),
  };
}

export default async function CatalogPage() {
  const { t } = await getServerTranslator();

  return (
    <PageShell
      header={{
        label: t('sections_catalog_label'),
        title: t('label_bouquet_catalog'),
        description: t('sections_catalog_description'),
      }}>
      <CatalogGrid />
    </PageShell>
  );
}
