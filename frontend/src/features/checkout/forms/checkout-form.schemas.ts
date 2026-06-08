import { z } from 'zod';

import {
  getValidationMessages,
  type TranslationFn,
} from '@/constants/message.constants';
import { optionalTrimmedString, trimmedString } from '@/utils/forms/zod-string';
import { phoneString } from '@/utils/forms/zod-phone';

export const CHECKOUT_PAYMENT_METHODS = {
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CARD: 'card',
  CASH_ON_DELIVERY: 'cash_on_delivery',
} as const;

export type CheckoutPaymentMethod =
  (typeof CHECKOUT_PAYMENT_METHODS)[keyof typeof CHECKOUT_PAYMENT_METHODS];

export const createCheckoutSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return z.object({
    customerName: trimmedString()
      .min(1, t('checkout_validation_name_required'))
      .min(2, t('checkout_validation_name_min')),

    email: trimmedString()
      .min(1, t('checkout_validation_email_required'))
      .email(t('checkout_validation_email_invalid')),

    phone: phoneString({
      required: t('checkout_validation_phone_required'),
      invalid: validationMessages.invalidPhone,
    }),

    city: trimmedString().min(2, t('checkout_validation_city_required')),

    address: trimmedString().min(5, t('checkout_validation_address_required')),

    deliveryNote: optionalTrimmedString(),

    paymentMethod: z.enum([
      CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
      CHECKOUT_PAYMENT_METHODS.GOOGLE_PAY,
      CHECKOUT_PAYMENT_METHODS.CARD,
      CHECKOUT_PAYMENT_METHODS.CASH_ON_DELIVERY,
    ]),
  });
};

export type CheckoutFormValues = z.infer<
  ReturnType<typeof createCheckoutSchema>
>;
