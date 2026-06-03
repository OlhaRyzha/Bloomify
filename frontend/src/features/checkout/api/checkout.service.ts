import { API_ROUTES } from '@/constants/api.constant';
import apiClient from '@/services/api/clients/api-client';
import { parseResponseWithSchema } from '@/utils/api/safe-fetch';
import { z } from 'zod';

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

export type CheckoutPaymentStatusResponse = Omit<CheckoutResponse, 'liqpay'>;

const liqPayCheckoutPayloadSchema = z.object({
  checkoutUrl: z.string().url(),
  data: z.string(),
  signature: z.string(),
});

const checkoutResponseSchema = z.object({
  orderId: z.number(),
  status: z.string(),
  paymentStatus: z.string(),
  paymentProvider: z.string(),
  paymentMethod: z.enum([
    'apple_pay',
    'google_pay',
    'card',
    'cash_on_delivery',
  ]),
  liqpay: liqPayCheckoutPayloadSchema.nullish(),
});

const checkoutPaymentStatusResponseSchema = checkoutResponseSchema.omit({
  liqpay: true,
});

const CheckoutService = {
  createCheckout: async (
    payload: CheckoutRequest
  ): Promise<CheckoutResponse> => {
    const response = await apiClient.post<unknown, CheckoutRequest>(
      API_ROUTES.CHECKOUT,
      payload
    );

    return parseResponseWithSchema(
      response,
      checkoutResponseSchema
    ) as CheckoutResponse;
  },
  syncPaymentStatus: async (
    orderId: number
  ): Promise<CheckoutPaymentStatusResponse> => {
    const response = await apiClient.post<unknown, undefined>(
      API_ROUTES.CHECKOUT_PAYMENT_STATUS(orderId),
      undefined
    );

    return parseResponseWithSchema(
      response,
      checkoutPaymentStatusResponseSchema
    ) as CheckoutPaymentStatusResponse;
  },
};

export default CheckoutService;
