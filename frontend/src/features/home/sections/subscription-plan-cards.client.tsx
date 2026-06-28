'use client';

import Link from 'next/link';
import { Check, Gift, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthSessionMarker } from '@/features/auth/hooks/use-auth-session-marker';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { getSignInPathWithNext } from '@/features/auth/lib/shared/auth-redirect';
import { getLocalizedPath } from '@/i18n/routing';
import { formatTemplate } from '@/utils/i18n';
import type { SubscriptionPlan } from '@/features/subscription/api/subscription.schemas';

export type PlanIconKey = 'gift' | 'sparkles' | 'crown';

const ICON_MAP = {
  gift: Gift,
  sparkles: Sparkles,
  crown: Crown,
} as const satisfies Record<PlanIconKey, React.FC<React.SVGProps<SVGSVGElement>>>;

type PlanCardEntry = {
  plan: SubscriptionPlan;
  icon: PlanIconKey;
  popular: boolean;
  features: string[];
};

type Props = {
  planEntries: PlanCardEntry[];
};

export default function SubscriptionPlanCards({ planEntries }: Props) {
  const { t } = useTranslation();
  const hasAuthSession = useAuthSessionMarker();
  const { locale } = useLocale();

  const subscriptionsPath = getLocalizedPath('/subscriptions', locale);
  const signInPath = getSignInPathWithNext('/subscriptions', locale);

  const buttonHref = hasAuthSession ? subscriptionsPath : signInPath;

  return (
    <>
      {planEntries.map(({ plan, icon, popular, features }) => {
        const Icon = ICON_MAP[icon];
        return (
          <Card
            key={plan.id}
            className={cn(
              'relative overflow-hidden transition-all duration-300 hover:shadow-elevated',
              popular
                ? 'bg-primary text-primary-foreground ring-2 ring-gold'
                : 'bg-card hover:bg-card/80'
            )}>
            {popular && (
              <div className='absolute right-0 top-0 rounded-bl-xl bg-gold px-4 py-1 text-xs font-semibold text-forest'>
                {t('sections_subscription_popular_badge')}
              </div>
            )}

            <CardHeader className='pb-2'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex min-w-0 items-center gap-3'>
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                      popular ? 'bg-primary-foreground/20' : 'bg-primary/10'
                    )}>
                    <Icon
                      className={cn(
                        'h-6 w-6',
                        popular ? 'text-primary-foreground' : 'text-primary'
                      )}
                      aria-hidden
                    />
                  </div>

                  <div className='min-w-0'>
                    <h3
                      className={cn(
                        'font-display text-xl font-bold',
                        popular ? 'text-primary-foreground' : 'text-foreground'
                      )}>
                      {plan.name}
                    </h3>
                    <p
                      className={cn(
                        'text-sm',
                        popular
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground'
                      )}>
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className='shrink-0 text-left sm:text-right'>
                  <span
                    className={cn(
                      'font-display text-2xl font-bold sm:text-3xl',
                      popular ? 'text-primary-foreground' : 'text-primary'
                    )}>
                    {plan.price}₴
                  </span>
                  <span
                    className={cn(
                      'block text-sm',
                      popular
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    )}>
                    /{t('label_month')}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className='mb-4 flex flex-wrap gap-2'>
                {features.slice(0, 3).map((feature) => (
                  <span
                    key={feature}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs',
                      popular
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}>
                    <Check
                      className='h-3 w-3'
                      aria-hidden
                    />
                    {feature}
                  </span>
                ))}

                {features.length > 3 && (
                  <span
                    className={cn(
                      'px-2 py-1 text-xs',
                      popular
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    )}>
                    {formatTemplate(t('sections_subscription_more_label'), {
                      count: features.length - 3,
                    })}
                  </span>
                )}
              </div>

              <Button
                asChild
                className={cn(
                  'w-full',
                  popular &&
                    'bg-gold text-forest font-semibold hover:bg-gold/90 active:bg-gold/80'
                )}
                variant='default'>
                <Link href={buttonHref}>{t('sections_subscription_cta')}</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
