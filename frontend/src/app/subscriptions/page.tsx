import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-layout';
import { getServerTranslator } from '@/i18n/server';
import SubscriptionFeature from '@/features/subscription/subscription';
import UserGreeting from '@/features/auth/components/user-greeting';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('label_subscription'),
    description: t('metadata_subscription_description'),
  };
}

export default async function SubscriptionsPage() {
  const { t } = await getServerTranslator();

  return (
    <PageShell
      header={{
        label: t('label_subscription'),
        title: t('subscriptions_page_title'),
        description: t('subscriptions_page_description'),
      }}>
      <UserGreeting />
      <SubscriptionFeature />
    </PageShell>
  );
}
