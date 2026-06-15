import Image from 'next/image';
import subscriptionImage from '@/assets/subscription-box.jpg';
import { Container } from '@/components/layout/page-layout';
import { getServerTranslator } from '@/i18n/server';
import HomeSectionHeader from './home-section-header';
import SubscriptionService from '@/features/subscription/api/subscription.service';
import SubscriptionPlanCards, { type PlanIconKey } from './subscription-plan-cards.client';
import type { SubscriptionPlan } from '@/features/subscription/api/subscription.schemas';

const PLAN_ICON_KEYS: PlanIconKey[] = ['gift', 'sparkles', 'crown'];
const POPULAR_INDEX = 1;

type PlanCardEntry = {
  plan: SubscriptionPlan;
  icon: PlanIconKey;
  popular: boolean;
  features: string[];
};

export default async function SubscriptionSection() {
  const { t, locale } = await getServerTranslator();
  const plans = await SubscriptionService.getPlans(locale).catch(() => [] as SubscriptionPlan[]);

  const planEntries: PlanCardEntry[] = plans.map((plan, i) => ({
    plan,
    icon: PLAN_ICON_KEYS[i] ?? 'gift',
    popular: i === POPULAR_INDEX,
    features: plan.description ? [plan.description] : [],
  }));

  return (
    <section
      id='subscription'
      className='scroll-mt-24 bg-gradient-hero py-24'>
      <Container>
        <HomeSectionHeader
          label={t('label_subscription')}
          title={t('sections_subscription_title')}
          description={t('sections_subscription_description')}
        />

        <div className='grid items-center gap-12 lg:grid-cols-2'>
          <div className='relative order-2 lg:order-1'>
            <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-sage/30 to-blush/30 blur-2xl' />
            <Image
              src={subscriptionImage}
              alt={t('sections_subscription_image_alt')}
              sizes='(max-width: 1024px) 100vw, 40vw'
              className='relative mx-auto w-full max-w-md rounded-3xl shadow-elevated'
              priority={false}
            />
          </div>

          <div className='order-1 space-y-4 lg:order-2'>
            <SubscriptionPlanCards planEntries={planEntries} />
          </div>
        </div>
      </Container>
    </section>
  );
}
