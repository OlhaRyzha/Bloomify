'use client';

import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '../api/subscription.schemas';

type PlanCardProps = {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  currentPlanPrice?: number;
  isLoading?: boolean;
  isUpgrading?: boolean;
  onSubscribe: (planId: number) => void;
  onUpgrade: (planId: number) => void;
  subscribeLabel: string;
  upgradeLabel: string;
  switchPlanLabel: string;
  currentPlanLabel: string;
  perPeriodLabel: string;
};

export default function PlanCard({
  plan,
  isCurrentPlan = false,
  currentPlanPrice,
  isLoading = false,
  isUpgrading = false,
  onSubscribe,
  onUpgrade,
  subscribeLabel,
  upgradeLabel,
  switchPlanLabel,
  currentPlanLabel,
  perPeriodLabel,
}: PlanCardProps) {
  const popular = plan.badge !== '';
  const isSubscribed = currentPlanPrice !== undefined;
  const canUpgrade = isSubscribed && !isCurrentPlan && plan.price > currentPlanPrice;
  const canDowngrade = isSubscribed && !isCurrentPlan && plan.price < currentPlanPrice;

  const renderButton = () => {
    if (isCurrentPlan) {
      return (
        <Button
          className='w-full'
          variant='secondary'
          disabled>
          <Check className='h-4 w-4' aria-hidden />
          {currentPlanLabel}
        </Button>
      );
    }

    if (canUpgrade) {
      const diff = plan.price - currentPlanPrice;
      return (
        <Button
          className='w-full'
          variant='outline'
          disabled={isUpgrading}
          onClick={() => onUpgrade(plan.id)}>
          {isUpgrading ? (
            <Loader2 className='h-4 w-4 animate-spin' aria-hidden />
          ) : (
            `${upgradeLabel} +${diff}₴`
          )}
        </Button>
      );
    }

    if (canDowngrade) {
      return (
        <Button
          className='w-full'
          variant='ghost'
          disabled
          aria-label={switchPlanLabel}>
          {switchPlanLabel}
        </Button>
      );
    }

    return (
      <Button
        className={cn(
          'w-full',
          popular && 'bg-gold text-forest font-semibold hover:bg-gold/90 active:bg-gold/80'
        )}
        variant='default'
        disabled={isLoading}
        onClick={() => onSubscribe(plan.id)}>
        {isLoading ? (
          <Loader2 className='h-4 w-4 animate-spin' aria-hidden />
        ) : (
          subscribeLabel
        )}
      </Button>
    );
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        popular
          ? 'bg-primary text-primary-foreground ring-2 ring-gold shadow-elevated'
          : 'bg-card hover:shadow-elevated',
        isCurrentPlan && 'ring-2 ring-sage'
      )}>
      {popular && (
        <div className='absolute right-0 top-0 rounded-bl-xl bg-gold px-4 py-1 text-xs font-semibold text-forest'>
          {plan.badge}
        </div>
      )}

      <CardHeader className='pb-2'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
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
                popular ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
              {plan.description}
            </p>
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
                popular ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
              /{perPeriodLabel}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {renderButton()}
      </CardContent>
    </Card>
  );
}
