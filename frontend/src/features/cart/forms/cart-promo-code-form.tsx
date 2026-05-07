import { Form, Formik } from 'formik';
import { TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FREE_DELIVERY_THRESHOLD } from '@/constants/delivery.constants';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency, formatTemplate } from '@/utils/i18n';
import { getFormFieldError } from '@/utils/forms/get-form-field-error';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import { cartPromoCodeInitialValues } from './cart-promo-code-form.config';
import {
  cartPromoCodeSchema,
  type CartPromoCodeValues,
} from './cart-promo-code-form.schemas';

export default function CartPromoCodeForm() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const promoCodeInputId = 'cart-promo-code';
  const freeDeliveryMessage = formatTemplate(t('delivery_free_delivery_message'), {
    threshold: formatCurrency(FREE_DELIVERY_THRESHOLD, locale),
  });

  return (
    <Formik<CartPromoCodeValues>
      initialValues={cartPromoCodeInitialValues}
      validate={(values) => validateWithZod(cartPromoCodeSchema, values)}
      onSubmit={(_, actions) => {
        actions.setSubmitting(false);
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
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(promoCodeError)}
                aria-describedby={`${promoCodeInputId}-message`}
                className='bg-background'
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
              className='mt-3 text-xs text-muted-foreground'>
              {promoCodeError ||
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
