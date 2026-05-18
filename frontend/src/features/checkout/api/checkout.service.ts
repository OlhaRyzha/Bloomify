import { API_ROUTES } from '@/constants/api.constant';
import apiClient from '@/services/api/clients/api-client';

export type CheckoutPaymentMethod =
  | 'apple_pay'
  | 'google_pay'
  | 'card'
  | 'cash_on_delivery';

export type CheckoutRequestItem = {
  id: string;
  quantity: number;
};

export type CheckoutRequest = {
  customerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryNote?: string;
  paymentMethod: CheckoutPaymentMethod;
  items: CheckoutRequestItem[];
};

export type LiqPayCheckoutPayload = {
  checkoutUrl: string;
  data: string;
  signature: string;
};

export type CheckoutResponse = {
  orderId: number;
  status: string;
  paymentStatus: string;
  paymentProvider: string;
  paymentMethod: CheckoutPaymentMethod;
  liqpay?: LiqPayCheckoutPayload | null;
};

const CheckoutService = {
  createCheckout: (payload: CheckoutRequest): Promise<CheckoutResponse> =>
    apiClient.post<CheckoutResponse, CheckoutRequest>(
      API_ROUTES.CHECKOUT,
      payload
    ),
};

export default CheckoutService;
