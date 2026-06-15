'use client';

import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '../api/subscription.schemas';

type PlanCardProps = {
  plan: SubscriptionPlan;
  popular?: boolean;
  isCurrentPlan?: boolean;
  isSubscribed?: boolean;
  isLoading?: boolean;
  onSubscribe: (planId: number) => void;
  subscribeLabel: string;
  currentPlanLabel: string;
  perPeriodLabel: string;
};

const INTERVAL_LABEL: Record<string, string> = {
  monthly: 'мiс',
  weekly: 'тиж',
  quarterly: 'квартал',
};

export default function PlanCard({
  plan,
  popular = false,
  isCurrentPlan = false,
  isSubscribed = false,
  isLoading = false,
  onSubscribe,
  subscribeLabel,
  currentPlanLabel,
  perPeriodLabel,
}: PlanCardProps) {
  const periodLabel = INTERVAL_LABEL[plan.interval] ?? plan.interval;

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
          Популярний
        </div>
      )}

      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-4'>
          <div>
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

          <div className='text-right shrink-0'>
            <span
              className={cn(
                'font-display text-3xl font-bold',
                popular ? 'text-primary-foreground' : 'text-primary'
              )}>
              {plan.price}₴
            </span>
            <span
              className={cn(
                'block text-sm',
                popular ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
              /{perPeriodLabel || periodLabel}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <Button
          className={cn(
            'w-full',
            popular && !isCurrentPlan && 'bg-gold text-forest font-semibold hover:bg-gold/90 active:bg-gold/80'
          )}
          variant={isCurrentPlan ? 'secondary' : 'default'}
          disabled={isCurrentPlan || isSubscribed || isLoading}
          onClick={() => onSubscribe(plan.id)}>
          {isLoading ? (
            <Loader2
              className='h-4 w-4 animate-spin'
              aria-hidden
            />
          ) : isCurrentPlan ? (
            <span className='flex items-center gap-2'>
              <Check className='h-4 w-4' aria-hidden />
              {currentPlanLabel}
            </span>
          ) : (
            subscribeLabel
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
