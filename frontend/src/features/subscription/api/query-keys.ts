export const subscriptionQueryKeys = {
  all: ['subscriptions'] as const,
  plans: (locale: string) => [...subscriptionQueryKeys.all, 'plans', locale] as const,
  mine: (locale: string) => [...subscriptionQueryKeys.all, 'mine', locale] as const,
  paymentStatus: (paymentId: number) =>
    [...subscriptionQueryKeys.all, 'payment-status', paymentId] as const,
};
