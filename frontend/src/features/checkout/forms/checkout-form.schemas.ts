import { z } from 'zod';
import {
  optionalTrimmedString,
  trimmedString,
} from '@/utils/forms/zod-string';

export const CHECKOUT_PAYMENT_METHODS = {
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CARD: 'card',
  CASH_ON_DELIVERY: 'cash_on_delivery',
} as const;

export type CheckoutPaymentMethod =
  (typeof CHECKOUT_PAYMENT_METHODS)[keyof typeof CHECKOUT_PAYMENT_METHODS];

type CheckoutValidationMessages = {
  city: string;
  email: string;
  invalidEmail: string;
  minName: string;
  name: string;
  phone: string;
  address: string;
};

export const createCheckoutSchema = (messages: CheckoutValidationMessages) =>
  z
    .object({
      customerName: trimmedString()
        .min(1, messages.name)
        .min(2, messages.minName),
      email: trimmedString()
        .min(1, messages.email)
        .email(messages.invalidEmail),
      phone: trimmedString().min(7, messages.phone),
      city: trimmedString().min(2, messages.city),
      address: trimmedString().min(5, messages.address),
      deliveryNote: optionalTrimmedString(),
      paymentMethod: z.enum([
        CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
        CHECKOUT_PAYMENT_METHODS.GOOGLE_PAY,
        CHECKOUT_PAYMENT_METHODS.CARD,
        CHECKOUT_PAYMENT_METHODS.CASH_ON_DELIVERY,
      ]),
    });

export type CheckoutFormValues = z.infer<
  ReturnType<typeof createCheckoutSchema>
>;
