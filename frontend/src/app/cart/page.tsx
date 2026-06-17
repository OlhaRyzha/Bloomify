import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-layout';
import CartFeature from '@/features/cart/cart';
import UserGreeting from '@/features/auth/components/user-greeting';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('label_cart'),
    description: t('metadata_cart_description'),
  };
}

export default async function CartPage() {
  const { t } = await getServerTranslator();

  return (
    <PageShell
      header={{
        label: t('cart_page_label'),
        title: t('label_cart'),
        description: t('cart_page_description'),
      }}>
      <UserGreeting />
      <CartFeature />
    </PageShell>
  );
}
