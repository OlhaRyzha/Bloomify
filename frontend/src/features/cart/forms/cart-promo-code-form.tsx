'use client';

import { useState } from 'react';
import { Form, Formik } from 'formik';
import { CheckCircle2, TicketPercent, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FREE_DELIVERY_THRESHOLD } from '@/constants/delivery.constants';
import { useTranslation } from '@/hooks/use-translation';
import { getFormFieldError } from '@/utils/forms/get-form-field-error';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import { formatCurrency, formatTemplate } from '@/utils/i18n';
import { ApiError } from '@/services/api/errors/api-error';
import {
  selectAppliedPromoCode,
  selectClearPromoCode,
  selectSetPromoCode,
} from '../store/cart.selectors';
import { useCartStore } from '../store/cart.store';
import PromoService from '../api/promo.service';

import { cartPromoCodeInitialValues } from './cart-promo-code-form.config';
import {
  createCartPromoCodeSchema,
  type CartPromoCodeValues,
} from './cart-promo-code-form.schemas';

type CartPromoCodeFormProps = {
  subtotal: number;
};

export default function CartPromoCodeForm({ subtotal }: CartPromoCodeFormProps) {
  const { locale, t } = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);

  const appliedPromoCode = useCartStore(selectAppliedPromoCode);
  const setPromoCode = useCartStore(selectSetPromoCode);
  const clearPromoCode = useCartStore(selectClearPromoCode);

  const cartPromoCodeSchema = createCartPromoCodeSchema(t);

  const promoCodeInputId = 'cart-promo-code';
  const freeDeliveryMessage = formatTemplate(
    t('delivery_free_delivery_message'),
    {
      threshold: formatCurrency(FREE_DELIVERY_THRESHOLD, locale),
    }
  );

  if (appliedPromoCode) {
    return (
      <div className='rounded-3xl bg-green-50 p-5 dark:bg-green-950/30'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <CheckCircle2
              className='h-4 w-4 text-green-600'
              aria-hidden
            />
            <span className='text-sm font-semibold text-green-700 dark:text-green-400'>
              {t('cart_promo_applied')}: {appliedPromoCode.code}
            </span>
          </div>
          <button
            type='button'
            onClick={clearPromoCode}
            className='ml-2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground'
            aria-label={t('cart_promo_remove')}>
            <X className='h-4 w-4' />
          </button>
        </div>
        <p className='mt-1 text-xs text-green-600 dark:text-green-400'>
          -{formatCurrency(appliedPromoCode.discount, locale)}
        </p>
      </div>
    );
  }

  return (
    <Formik<CartPromoCodeValues>
      initialValues={cartPromoCodeInitialValues}
      validate={(values) => validateWithZod(cartPromoCodeSchema, values)}
      onSubmit={async (values, actions) => {
        setApiError(null);
        try {
          const result = await PromoService.validate(
            values.promoCode,
            subtotal
          );
          setPromoCode({
            code: result.code,
            discount: Number(result.discount),
          });
        } catch (error) {
          const apiErr = ApiError.fromUnknown(error);
          setApiError(apiErr.userMessage);
        } finally {
          actions.setSubmitting(false);
        }
      }}>
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        isSubmitting,
      }) => {
        const promoCodeError = getFormFieldError({
          errors,
          name: 'promoCode',
          touched,
        });

        const message = apiError || promoCodeError;

        return (
          <Form className='rounded-3xl bg-muted/60 p-5'>
            <label
              htmlFor={promoCodeInputId}
              className='flex items-center gap-2 text-sm font-semibold text-primary'>
              <TicketPercent
                className='h-4 w-4'
                aria-hidden
              />
              {t('cart_promo_title')}
            </label>

            <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
              <Input
                id={promoCodeInputId}
                name='promoCode'
                placeholder={t('cart_promo_placeholder')}
                autoComplete='off'
                value={values.promoCode}
                onChange={(e) => {
                  setApiError(null);
                  handleChange(e);
                }}
                onBlur={handleBlur}
                aria-invalid={Boolean(message)}
                aria-describedby={`${promoCodeInputId}-message`}
                className='bg-background uppercase'
              />

              <Button
                type='submit'
                variant='secondary'
                disabled={isSubmitting}>
                {t('cart_promo_button')}
              </Button>
            </div>

            <p
              id={`${promoCodeInputId}-message`}
              className={`mt-3 text-xs ${message ? 'text-destructive' : 'text-muted-foreground'}`}>
              {message ||
                formatTemplate(t('cart_promo_message'), {
                  freeDelivery: freeDeliveryMessage,
                })}
            </p>
          </Form>
        );
      }}
    </Formik>
  );
}
