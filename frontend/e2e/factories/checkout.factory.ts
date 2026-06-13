type CheckoutResponse = {
  orderId: number;
  status: string;
  paymentStatus: string;
  paymentStatusToken: string;
  paymentProvider: string;
  paymentMethod: 'cash_on_delivery';
  liqpay: null;
};

export const createCashOnDeliveryCheckoutResponse = (
  overrides: Partial<CheckoutResponse> = {}
): CheckoutResponse => ({
  orderId: 42,
  status: 'pending',
  paymentStatus: 'pending',
  paymentStatusToken: 'e2e-payment-status-token',
  paymentProvider: 'cash_on_delivery',
  paymentMethod: 'cash_on_delivery',
  liqpay: null,
  ...overrides,
});
