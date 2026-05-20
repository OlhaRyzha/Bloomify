import type { Metadata } from 'next';
import { Container, PageSection } from '@/components/layout/page-layout';
import SectionHeader from '@/components/ui/section-header';
import CartFeature from '@/features/cart/cart';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_cart_title'),
    description: t('metadata_cart_description'),
  };
}

export default async function CartPage() {
  const { t } = await getServerTranslator();

  return (
    <PageSection>
      <Container>
        <SectionHeader
          label={t('cart_page_label')}
          title={t('cart_page_title')}
          description={t('cart_page_description')}
        />

        <CartFeature />
      </Container>
    </PageSection>
  );
}
