import Link from 'next/link';
import { Container } from '@/components/layout/page-layout';
import { getServerTranslator } from '@/i18n/server';
import { Button } from '../../../components/ui/button';
import CatalogSectionPreview from './catalog-section-preview.client';
import { getLocalizedPath } from '@/i18n/routing';
import HomeSectionHeader from './home-section-header';

export default async function CatalogSection() {
  const { locale, t } = await getServerTranslator();

  return (
    <section
      id='catalog'
      className='scroll-mt-24 bg-background py-16 md:py-24'>
      <Container>
        <HomeSectionHeader
          label={t('sections_catalog_label')}
          title={t('sections_catalog_title')}
          description={t('sections_catalog_description')}
        />

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
      </Container>
    </section>
  );
}
