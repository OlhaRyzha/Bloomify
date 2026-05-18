import { z } from 'zod';
import { validationMessages } from '@/constants/message.constants';

export const CHECKOUT_PAYMENT_METHODS = {
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CARD: 'card',
  LOCAL: 'local',
} as const;

export type CheckoutPaymentMethod =
  (typeof CHECKOUT_PAYMENT_METHODS)[keyof typeof CHECKOUT_PAYMENT_METHODS];

export const checkoutSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(1, validationMessages.requiredField())
      .min(2, validationMessages.nameMin(2)),
    email: z
      .string()
      .trim()
      .min(1, validationMessages.requiredField())
      .email(validationMessages.invalidEmail),
    phone: z.string().trim().min(7, validationMessages.requiredField()),
    city: z.string().trim().min(2, validationMessages.requiredField()),
    address: z.string().trim().min(5, validationMessages.requiredField()),
    deliveryNote: z.string().trim().optional(),
    paymentMethod: z.enum([
      CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
      CHECKOUT_PAYMENT_METHODS.GOOGLE_PAY,
      CHECKOUT_PAYMENT_METHODS.CARD,
      CHECKOUT_PAYMENT_METHODS.LOCAL,
    ]),
    cardNumber: z.string().trim().optional(),
    cardExpiry: z.string().trim().optional(),
    cardCvc: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.paymentMethod !== CHECKOUT_PAYMENT_METHODS.CARD) {
      return;
    }

    if (!values.cardNumber || values.cardNumber.replace(/\s/g, '').length < 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validationMessages.requiredField(),
        path: ['cardNumber'],
      });
    }

    if (!values.cardExpiry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validationMessages.requiredField(),
        path: ['cardExpiry'],
      });
    }

    if (!values.cardCvc || values.cardCvc.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validationMessages.requiredField(),
        path: ['cardCvc'],
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
