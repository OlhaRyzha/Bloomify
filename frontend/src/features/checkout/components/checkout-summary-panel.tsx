import { BadgeCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import SurfacePanel from '@/components/ui/surface-panel';
import { formatCurrency } from '@/utils/i18n';
import type { CartItemWithDetails } from '@/features/cart/cart.types';

import {
  CHECKOUT_PAYMENT_METHODS,
  type CheckoutPaymentMethod,
} from '../forms/checkout-form.schemas';
import { Locale } from '@/locales/translations';

type CheckoutSummaryPanelProps = {
  cartItems: CartItemWithDetails[];
  deliveryCost: number;
  isLoading: boolean;
  isSubmitting: boolean;
  locale: Locale;
  paymentMethod: CheckoutPaymentMethod;
  status?: string;
  subtotal: number;
  total: number;
  t: (key: string) => string;
};

export default function CheckoutSummaryPanel({
  cartItems,
  deliveryCost,
  isLoading,
  isSubmitting,
  locale,
  paymentMethod,
  status,
  subtotal,
  t,
  total,
}: CheckoutSummaryPanelProps) {
  return (
    <SurfacePanel aria-labelledby='checkout-summary-title'>
      <h2
        id='checkout-summary-title'
        className='font-display text-2xl font-semibold'>
        {t('checkout_summary_title')}
      </h2>

      <ul className='mt-5 space-y-4'>
        {cartItems.map((item) => (
          <li
            key={item.id}
            className='flex items-start justify-between gap-4 text-sm'>
            <div>
              <p className='font-semibold text-foreground'>{item.name}</p>
              <p className='text-muted-foreground'>
                {item.quantity} x {formatCurrency(item.discountedPrice ?? item.price, locale)}
              </p>
            </div>

            <p className='font-semibold text-foreground'>
              {formatCurrency(Number(item.discountedPrice ?? item.price) * item.quantity, locale)}
            </p>
          </li>
        ))}
      </ul>

      <div className='mt-6 space-y-3 border-t border-border pt-5 text-sm'>
        <div className='flex items-center justify-between text-muted-foreground'>
          <span>{t('cart_bouquet_cost')}</span>
          <span>{formatCurrency(subtotal, locale)}</span>
        </div>

        <div className='flex items-center justify-between text-muted-foreground'>
          <span>{t('label_delivery')}</span>
          <span>
            {deliveryCost === 0
              ? t('common_free')
              : formatCurrency(deliveryCost, locale)}
          </span>
        </div>

        <div className='flex items-center justify-between pt-2 text-base font-semibold text-foreground'>
          <span>{t('cart_total')}</span>
          <span className='font-display text-2xl text-primary'>
            {formatCurrency(total, locale)}
          </span>
        </div>
      </div>

      {status && (
        <p
          role='status'
          className='mt-4 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground'>
          {status}
        </p>
      )}

      <Button
        type='submit'
        size='lg'
        className='mt-6 w-full'
        disabled={isSubmitting || isLoading}>
        {paymentMethod === CHECKOUT_PAYMENT_METHODS.CASH_ON_DELIVERY
          ? t('checkout_place_order_button')
          : t('checkout_pay_button')}
      </Button>

      <p className='mt-4 flex items-start gap-2 text-xs text-muted-foreground'>
        <BadgeCheck
          className='mt-0.5 h-4 w-4 flex-shrink-0 text-primary'
          aria-hidden
        />
        {t('checkout_security_note')}
      </p>
    </SurfacePanel>
  );
}
