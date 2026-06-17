import FeedbackState from '@/components/ui/feedback-state';
import { TELEGRAM_BOT_URL } from '@/components/config/env';
import { getLocalizedPath } from '@/i18n/routing';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { formatTemplate } from '@/utils/i18n';

import { buildTelegramOrderTrackingUrl } from './checkout.helpers';

type CheckoutSuccessStateProps = {
  completedOrderId: number | null;
  completedOrderMessage: string;
  completedPaymentStatusLabel: string | null;
  locale: string;
  t: (key: string) => string;
};

export default function CheckoutSuccessState({
  completedOrderId,
  completedOrderMessage,
  completedPaymentStatusLabel,
  locale,
  t,
}: CheckoutSuccessStateProps) {
  const { data: user } = useCurrentUser();
  const userName = user?.name?.trim();

  const telegramOrderTrackingUrl =
    TELEGRAM_BOT_URL && completedOrderId
      ? buildTelegramOrderTrackingUrl(TELEGRAM_BOT_URL, completedOrderId)
      : null;

  const successTitle = userName
    ? formatTemplate(t('checkout_order_success_greeting'), { name: userName })
    : t('checkout_order_success_title');

  return (
    <FeedbackState
      title={successTitle}
      description={completedOrderMessage}
      actionLabel={
        telegramOrderTrackingUrl
          ? t('checkout_success_telegram_cta')
          : t('action_continue_shopping')
      }
      actionHref={
        telegramOrderTrackingUrl || getLocalizedPath('/catalog', locale)
      }
      actionRel={telegramOrderTrackingUrl ? 'noopener noreferrer' : undefined}
      actionTarget={telegramOrderTrackingUrl ? '_blank' : undefined}
      secondaryActionLabel={
        telegramOrderTrackingUrl ? t('action_continue_shopping') : undefined
      }
      secondaryActionHref={
        telegramOrderTrackingUrl
          ? getLocalizedPath('/catalog', locale)
          : undefined
      }
      className='bg-gradient-card shadow-card'>
      {completedOrderId ? (
        <dl className='mx-auto grid max-w-sm gap-3 rounded-xl border border-border bg-background/70 p-4 text-left text-sm sm:grid-cols-2'>
          <div>
            <dt className='text-muted-foreground'>
              {t('label_order')}
            </dt>
            <dd className='mt-1 font-semibold text-foreground'>
              #{completedOrderId}
            </dd>
          </div>

          <div>
            <dt className='text-muted-foreground'>
              {t('checkout_success_payment_status_label')}
            </dt>
            <dd className='mt-1 font-semibold text-primary'>
              {completedPaymentStatusLabel}
            </dd>
          </div>
        </dl>
      ) : null}
    </FeedbackState>
  );
}
