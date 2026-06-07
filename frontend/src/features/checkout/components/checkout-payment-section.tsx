import { ShieldCheck } from 'lucide-react';

import SurfacePanel from '@/components/ui/surface-panel';
import { cn } from '@/lib/utils';

import { paymentOptions } from './checkout.constants';
import type {
  CheckoutFormValues,
  CheckoutPaymentMethod,
} from '../forms/checkout-form.schemas';

type CheckoutPaymentSectionProps = {
  paymentMethod: CheckoutPaymentMethod;
  t: (key: string) => string;
  onPaymentMethodChange: (paymentMethod: CheckoutPaymentMethod) => void;
};

export default function CheckoutPaymentSection({
  onPaymentMethodChange,
  paymentMethod,
  t,
}: CheckoutPaymentSectionProps) {
  return (
    <SurfacePanel
      className='space-y-5'
      aria-labelledby='checkout-payment-title'>
      <div className='flex items-center gap-3'>
        <ShieldCheck
          className='h-5 w-5 text-primary'
          aria-hidden
        />
        <h2
          id='checkout-payment-title'
          className='font-display text-2xl font-semibold'>
          {t('checkout_payment_title')}
        </h2>
      </div>

      <fieldset className='grid gap-3'>
        <legend className='sr-only'>{t('checkout_payment_title')}</legend>

        {paymentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = paymentMethod === option.id;

          return (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-start gap-4 rounded-2xl border bg-background/70 p-4 transition',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              )}>
              <input
                type='radio'
                name={'paymentMethod' satisfies keyof CheckoutFormValues}
                value={option.id}
                checked={isSelected}
                onChange={() => onPaymentMethodChange(option.id)}
                className='mt-1 h-4 w-4 accent-primary'
              />

              <Icon
                className='mt-0.5 h-5 w-5 text-primary'
                aria-hidden
              />

              <span className='flex-1'>
                <span className='flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground'>
                  {t(option.titleKey)}
                </span>
                <span className='mt-1 block text-sm text-muted-foreground'>
                  {t(option.descriptionKey)}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
    </SurfacePanel>
  );
}
