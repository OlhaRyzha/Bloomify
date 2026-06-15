import type {
  MySubscription,
  SubscribeResponse,
  SubscriptionPaymentStatus,
  SubscriptionPlan,
} from './subscription.schemas';

export const createSubscriptionPlan = (
  overrides: Partial<SubscriptionPlan> = {}
): SubscriptionPlan => ({
  id: 1,
  name: 'Base',
  description: 'Perfect for beginners',
  price: 999,
  interval: 'monthly',
  is_active: true,
  ...overrides,
});

export const createMySubscription = (
  overrides: Partial<MySubscription> = {}
): MySubscription => ({
  id: 1,
  plan: createSubscriptionPlan(),
  status: 'active',
  start_date: '2024-01-01T00:00:00Z',
  end_date: null,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createSubscribeResponse = (
  overrides: Partial<SubscribeResponse> = {}
): SubscribeResponse => ({
  subscriptionId: 1,
  paymentId: 10,
  status: 'pending',
  liqpay: {
    checkoutUrl: 'https://www.liqpay.ua/api/3/checkout',
    data: 'encoded-data',
    signature: 'encoded-signature',
  },
  ...overrides,
});

export const createSubscriptionPaymentStatus = (
  overrides: Partial<SubscriptionPaymentStatus> = {}
): SubscriptionPaymentStatus => ({
  paymentId: 10,
  paymentStatus: 'paid',
  subscriptionId: 1,
  subscriptionStatus: 'active',
  plan: createSubscriptionPlan(),
  ...overrides,
});
