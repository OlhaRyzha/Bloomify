import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-layout';
import { getServerTranslator } from '@/i18n/server';
import OrdersFeature from '@/features/orders/orders';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_orders_title'),
    description: t('metadata_orders_description'),
  };
}

export default async function OrdersPage() {
  const { t } = await getServerTranslator();

  return (
    <PageShell
      header={{
        label: t('orders_page_label'),
        title: t('orders_page_title'),
        description: t('orders_page_description'),
      }}>
      <OrdersFeature />
    </PageShell>
  );
}
