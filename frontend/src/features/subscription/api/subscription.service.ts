import type { AxiosRequestConfig } from 'axios';
import { API_ROUTES } from '@/constants/api.constant';
import { ApiError, ApiErrorType } from '@/services/api/errors/api-error';
import apiClient from '@/services/api/clients/api-client';
import { parseResponseWithSchema } from '@/services/api/request/safe-fetch';
import {
  mySubscriptionSchema,
  subscribeResponseSchema,
  subscriptionPaymentStatusSchema,
  subscriptionPlansSchema,
  type MySubscription,
  type SubscribeResponse,
  type SubscriptionPlan,
  type SubscriptionPaymentStatus,
} from './subscription.schemas';

type SubscribeBody = { plan_id: number; locale?: string };

const SubscriptionService = {
  getPlans: async (lang?: string): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get<SubscriptionPlan[]>(
      API_ROUTES.SUBSCRIPTION_PLANS,
      { params: { lang } }
    );
    return parseResponseWithSchema(response, subscriptionPlansSchema);
  },

  getMySubscription: async (lang?: string): Promise<MySubscription | null> => {
    try {
      const response = await apiClient.get<MySubscription>(
        API_ROUTES.MY_SUBSCRIPTION,
        { params: { lang }, _skipErrorLog: true } as AxiosRequestConfig
      );
      return parseResponseWithSchema(response, mySubscriptionSchema);
    } catch (error) {
      if (error instanceof ApiError && error.type === ApiErrorType.NotFound) {
        return null;
      }
      throw error;
    }
  },

  subscribe: async (planId: number, locale?: string): Promise<SubscribeResponse> => {
    const response = await apiClient.post<SubscribeResponse, SubscribeBody>(
      API_ROUTES.SUBSCRIBE,
      { plan_id: planId, locale }
    );
    return parseResponseWithSchema(response, subscribeResponseSchema);
  },

  unsubscribe: (): Promise<void> =>
    apiClient.post<void>(API_ROUTES.UNSUBSCRIBE),

  upgrade: async (planId: number, locale?: string): Promise<SubscribeResponse> => {
    const response = await apiClient.post<SubscribeResponse, SubscribeBody>(
      API_ROUTES.SUBSCRIPTION_UPGRADE,
      { plan_id: planId, locale }
    );
    return parseResponseWithSchema(response, subscribeResponseSchema);
  },

  getPaymentStatus: async (
    paymentId: number,
    paymentToken: string
  ): Promise<SubscriptionPaymentStatus> => {
    const response = await apiClient.get<SubscriptionPaymentStatus>(
      API_ROUTES.SUBSCRIPTION_PAYMENT_STATUS(paymentId),
      { params: { paymentToken } }
    );
    return parseResponseWithSchema(response, subscriptionPaymentStatusSchema);
  },
};

export default SubscriptionService;
