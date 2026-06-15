import { z } from 'zod';

export const subscriptionPlanSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.coerce.number(),
  interval: z.enum(['weekly', 'monthly', 'quarterly']),
  badge: z.string(),
  is_active: z.boolean(),
});

export const mySubscriptionSchema = z.object({
  id: z.number(),
  plan: subscriptionPlanSchema,
  status: z.enum(['active', 'pending', 'paused', 'canceled']),
  start_date: z.string(),
  end_date: z.string().nullable(),
  created_at: z.string(),
});

export const liqpayCheckoutPayloadSchema = z.object({
  checkoutUrl: z.string().url(),
  data: z.string(),
  signature: z.string(),
});

export const subscribeResponseSchema = z.object({
  subscriptionId: z.number(),
  paymentId: z.number(),
  status: z.string(),
  liqpay: liqpayCheckoutPayloadSchema,
});

export const subscriptionPaymentStatusSchema = z.object({
  paymentId: z.number(),
  paymentStatus: z.enum(['pending', 'paid', 'failed']),
  subscriptionId: z.number(),
  subscriptionStatus: z.enum(['active', 'pending', 'paused', 'canceled']),
  plan: subscriptionPlanSchema,
});

export const subscriptionPlansSchema = z.array(subscriptionPlanSchema);

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type MySubscription = z.infer<typeof mySubscriptionSchema>;
export type SubscribeResponse = z.infer<typeof subscribeResponseSchema>;
export type SubscriptionPaymentStatus = z.infer<typeof subscriptionPaymentStatusSchema>;
export type LiqpayCheckoutPayload = z.infer<typeof liqpayCheckoutPayloadSchema>;
