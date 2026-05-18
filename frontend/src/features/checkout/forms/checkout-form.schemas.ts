import { z } from 'zod';

export const CHECKOUT_PAYMENT_METHODS = {
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CARD: 'card',
  CASH_ON_DELIVERY: 'cash_on_delivery',
} as const;

export type CheckoutPaymentMethod =
  (typeof CHECKOUT_PAYMENT_METHODS)[keyof typeof CHECKOUT_PAYMENT_METHODS];

type CheckoutValidationMessages = {
  cardCvc: string;
  cardExpiry: string;
  cardNumber: string;
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
      customerName: z
        .string()
        .trim()
        .min(1, messages.name)
        .min(2, messages.minName),
      email: z
        .string()
        .trim()
        .min(1, messages.email)
        .email(messages.invalidEmail),
      phone: z.string().trim().min(7, messages.phone),
      city: z.string().trim().min(2, messages.city),
      address: z.string().trim().min(5, messages.address),
      deliveryNote: z.string().trim().optional(),
      paymentMethod: z.enum([
        CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
        CHECKOUT_PAYMENT_METHODS.GOOGLE_PAY,
        CHECKOUT_PAYMENT_METHODS.CARD,
        CHECKOUT_PAYMENT_METHODS.CASH_ON_DELIVERY,
      ]),
      cardNumber: z.string().trim().optional(),
      cardExpiry: z.string().trim().optional(),
      cardCvc: z.string().trim().optional(),
    })
    .superRefine((values, ctx) => {
      if (values.paymentMethod !== CHECKOUT_PAYMENT_METHODS.CARD) {
        return;
      }

      if (
        !values.cardNumber ||
        values.cardNumber.replace(/\s/g, '').length < 16
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.cardNumber,
          path: ['cardNumber'],
        });
      }

      if (!values.cardExpiry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.cardExpiry,
          path: ['cardExpiry'],
        });
      }

      if (!values.cardCvc || values.cardCvc.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.cardCvc,
          path: ['cardCvc'],
        });
      }
    });

export type CheckoutFormValues = z.infer<
  ReturnType<typeof createCheckoutSchema>
>;
