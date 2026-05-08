import Link from 'next/link';
import { getServerTranslator } from '@/i18n/server';
import { Button } from '../ui/button';
import CatalogSectionPreview from './catalog-section-preview.client';
import { getLocalizedPath } from '@/i18n/routing';

export default async function CatalogSection() {
  const { locale, t } = await getServerTranslator();

  return (
    <section
      id='catalog'
      className='bg-background py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        <header className='mb-16 text-center'>
          <span className='mb-4 block text-sm font-medium uppercase tracking-widest text-primary'>
            {t('sections_catalog_label')}
          </span>
          <h2 className='font-display mb-4 text-4xl font-bold md:text-5xl'>
            {t('sections_catalog_title')}
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
            {t('sections_catalog_description')}
          </p>
        </header>

        <CatalogSectionPreview />

        <div className='mt-12 text-center'>
          <Button
            asChild
            size='lg'
            variant='secondary'>
            <Link href={getLocalizedPath('/catalog', locale)}>
              {t('sections_catalog_button')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
