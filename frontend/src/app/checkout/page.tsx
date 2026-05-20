import type { Metadata } from 'next';
import { Container, PageSection } from '@/components/layout/page-layout';
import SectionHeader from '@/components/ui/section-header';
import CheckoutFeature from '@/features/checkout/checkout';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_checkout_title'),
    description: t('metadata_checkout_description'),
  };
}

export default async function CheckoutPage() {
  const { t } = await getServerTranslator();

  return (
    <PageSection>
      <Container>
        <SectionHeader
          label={t('checkout_page_label')}
          title={t('checkout_page_title')}
          description={t('checkout_page_description')}
        />

        <CheckoutFeature />
      </Container>
    </PageSection>
  );
}
