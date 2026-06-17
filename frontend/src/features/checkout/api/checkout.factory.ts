import type {
  CheckoutPaymentStatusResponse,
  CheckoutRequest,
  CheckoutResponse,
  LiqPayCheckoutPayload,
} from './checkout.service';

export const createCheckoutPayload = (
  overrides: Partial<CheckoutRequest> = {}
): CheckoutRequest => ({
  customerName: 'Olena Kolomiec',
  email: 'olha@example.com',
  phone: '+380671234567',
  city: 'Kyiv',
  address: 'Khreshchatyk 1',
  deliveryNote: 'Call before delivery',
  locale: 'en',
  paymentMethod: 'card',
  items: [{ id: 'rose-bouquet', quantity: 1 }],
  ...overrides,
});

export const createLiqPayCheckoutPayload = (
  overrides: Partial<LiqPayCheckoutPayload> = {}
): LiqPayCheckoutPayload => ({
  checkoutUrl: 'https://www.liqpay.ua/api/3/checkout',
  data: 'encoded-data',
  signature: 'encoded-signature',
  ...overrides,
});

export const createCheckoutResponse = (
  overrides: Partial<CheckoutResponse> = {}
): CheckoutResponse => ({
  orderId: 10,
  status: 'pending',
  paymentStatus: 'pending',
  paymentProvider: 'liqpay',
  paymentMethod: 'card',
  paymentStatusToken: 'payment-status-token',
  liqpay: createLiqPayCheckoutPayload(),
  ...overrides,
});

export const createCheckoutPaymentStatusResponse = (
  overrides: Partial<CheckoutPaymentStatusResponse> = {}
): CheckoutPaymentStatusResponse => ({
  orderId: 10,
  status: 'paid',
  paymentStatus: 'paid',
  paymentProvider: 'liqpay',
  paymentMethod: 'card',
  paymentStatusToken: 'payment-status-token',
  ...overrides,
});
