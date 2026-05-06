import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/section-header';
import CatalogGrid from '@/features/catalog/catalog-grid';
import { getServerTranslator } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Каталог букетів',
  description:
    'Ознайомтесь з каталогом букетів Bloomify — витончені флористичні композиції для будь-якої нагоди. Авторські букети з доставкою по всій Україні.',
};

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
