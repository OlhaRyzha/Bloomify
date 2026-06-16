'use client';

import { useState } from 'react';
import { CalendarDays, CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { getConfirmationCopy } from '@/components/ui/confirmation-copy';
import { useTranslation } from '@/hooks/use-translation';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';
import type { MySubscription } from '../api/subscription.schemas';

type SubscriptionStatusCardProps = {
  subscription: MySubscription;
  onUnsubscribe: () => void | Promise<void>;
  isUnsubscribing?: boolean;
};

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle2,
    className: 'text-sage',
    labelKey: 'subscription_status_active',
  },
  pending: {
    icon: PauseCircle,
    className: 'text-amber-500',
    labelKey: 'subscription_status_pending',
  },
  paused: {
    icon: PauseCircle,
    className: 'text-muted-foreground',
    labelKey: 'subscription_status_paused',
  },
  canceled: {
    icon: XCircle,
    className: 'text-destructive',
    labelKey: 'subscription_status_canceled',
  },
} as const;

export default function SubscriptionStatusCard({
  subscription,
  onUnsubscribe,
  isUnsubscribing = false,
}: SubscriptionStatusCardProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const intervalLabel =
    subscription.plan.interval === 'monthly'
      ? t('label_month')
      : subscription.plan.interval === 'weekly'
        ? t('label_week')
        : t('label_quarter');

  const formattedStartDate = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(subscription.start_date));

  const config = STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.active;
  const StatusIcon = config.icon;

  const copy = getConfirmationCopy(t, {
    action: 'unsubscribe',
    entity: 'subscription',
    entityName: subscription.plan.name,
  });

  return (
    <>
      <Card className='bg-card'>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h3 className='font-display text-xl font-bold text-foreground'>
                {subscription.plan.name}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {subscription.plan.description}
              </p>
            </div>
            <div className='text-right shrink-0'>
              <span className='font-display text-2xl font-bold text-primary'>
                {subscription.plan.price}₴
              </span>
              <span className='block text-sm text-muted-foreground'>
                /{intervalLabel}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='flex items-center gap-2'>
            <StatusIcon
              className={cn('h-5 w-5', config.className)}
              aria-hidden
            />
            <span className={cn('text-sm font-medium', config.className)}>
              {t(config.labelKey)}
            </span>
          </div>

          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <CalendarDays
              className='h-4 w-4'
              aria-hidden
            />
            <span>
              {t('subscription_start_date_label')}: {formattedStartDate}
            </span>
          </div>

          {subscription.status === 'active' && (
            <div className='flex justify-end'>
              <Button
                variant='ghost'
                size='sm'
                className='text-destructive hover:text-destructive hover:bg-destructive/10'
                disabled={isUnsubscribing}
                onClick={() => setConfirmOpen(true)}>
                {t('action_cancel_subscription')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        tone='danger'
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.confirmLabel}
        cancelLabel={copy.cancelLabel}
        closeLabel={copy.closeLabel}
        onOpenChange={setConfirmOpen}
        onConfirm={async () => {
          await onUnsubscribe();
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
