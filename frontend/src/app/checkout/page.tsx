import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-layout';
import CheckoutFeature from '@/features/checkout/checkout';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('label_checkout'),
    description: t('metadata_checkout_description'),
  };
}

export default async function CheckoutPage() {
  const { t } = await getServerTranslator();

  return (
    <PageShell
      header={{
        label: t('checkout_page_label'),
        title: t('label_checkout'),
        description: t('checkout_page_description'),
      }}>
      <CheckoutFeature />
    </PageShell>
  );
}
