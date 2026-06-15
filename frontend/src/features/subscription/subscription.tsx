'use client';

import { useTranslation } from '@/hooks/use-translation';
import { useAuthSessionMarker } from '@/features/auth/hooks/use-auth-session-marker';
import { useSubscriptionPlans } from './api/use-subscription-plans';
import { useMySubscription } from './api/use-my-subscription';
import { useSubscribe } from './api/use-subscribe';
import { useUnsubscribe } from './api/use-unsubscribe';
import { useUpgradeSubscription } from './api/use-upgrade-subscription';
import PlanCard from './components/plan-card';
import PlanCardSkeleton from './components/plan-card-skeleton';
import SubscriptionStatusCard from './components/subscription-status-card';

const SKELETON_COUNT = 3;

export default function SubscriptionFeature() {
  const { t } = useTranslation();
  const hasAuthSession = useAuthSessionMarker();

  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const {
    data: mySubscription,
    isLoading: subscriptionLoading,
  } = useMySubscription(hasAuthSession);

  const {
    mutate: subscribe,
    isPending: isSubscribing,
    variables: subscribingPlanId,
  } = useSubscribe();
  const { mutate: unsubscribe, isPending: isUnsubscribing } = useUnsubscribe();
  const {
    mutate: upgrade,
    isPending: isUpgrading,
    variables: upgradingPlanId,
  } = useUpgradeSubscription();

  const isActiveSubscription =
    mySubscription?.status === 'active' || mySubscription?.status === 'pending';

  const showPlanSkeletons = plansLoading || (hasAuthSession && subscriptionLoading);

  return (
    <div className='space-y-10'>
      {mySubscription && !showPlanSkeletons && (
        <section>
          <h2 className='font-display text-2xl font-bold text-foreground mb-4'>
            {t('subscription_my_plan_title')}
          </h2>
          <SubscriptionStatusCard
            subscription={mySubscription}
            onUnsubscribe={() => unsubscribe()}
            isUnsubscribing={isUnsubscribing}
          />
        </section>
      )}

      <section>
        <h2 className='font-display text-2xl font-bold text-foreground mb-2'>
          {t('subscription_plans_title')}
        </h2>
        <p className='text-muted-foreground mb-6'>
          {t('subscription_plans_description')}
        </p>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {showPlanSkeletons
            ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <PlanCardSkeleton key={i} />
              ))
            : (plans ?? []).map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={
                    mySubscription?.plan.id === plan.id && isActiveSubscription
                  }
                  currentPlanPrice={
                    isActiveSubscription ? mySubscription?.plan.price : undefined
                  }
                  isLoading={isSubscribing && subscribingPlanId === plan.id}
                  isUpgrading={isUpgrading && upgradingPlanId === plan.id}
                  onSubscribe={subscribe}
                  onUpgrade={upgrade}
                  subscribeLabel={t('sections_subscription_cta')}
                  upgradeLabel={t('action_upgrade_subscription')}
                  currentPlanLabel={t('subscription_current_plan_label')}
                  perPeriodLabel={t('label_month')}
                />
              ))}
        </div>
      </section>
    </div>
  );
}
