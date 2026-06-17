import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-layout';
import { getServerTranslator } from '@/i18n/server';
import OrdersFeature from '@/features/orders/orders';
import UserGreeting from '@/features/auth/components/user-greeting';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('label_orders'),
    description: t('metadata_orders_description'),
  };
}

export default async function OrdersPage() {
  const { t } = await getServerTranslator();

  return (
    <PageShell
      header={{
        label: t('label_orders'),
        title: t('label_orders'),
        description: t('orders_page_description'),
      }}>
      <UserGreeting />
      <OrdersFeature />
    </PageShell>
  );
}
