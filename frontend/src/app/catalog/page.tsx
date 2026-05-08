import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/section-header';
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
    <section className='bg-background pb-16 pt-28'>
      <div className='mx-auto max-w-6xl px-4'>
        <SectionHeader
          label={t('sections_catalog_label')}
          title={t('sections_catalog_title')}
          description={t('sections_catalog_description')}
        />

        <CatalogGrid />
      </div>
    </section>
  );
}
