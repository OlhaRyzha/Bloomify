import { API_ROUTES } from '@/constants/api.constant';
import apiClient from '@/services/api/clients/api-client';
import { parseResponseWithSchema } from '@/services/api/request/safe-fetch';
import {
  ordersPaginatedSchema,
  type OrdersPaginatedResponse,
} from './orders.shemas';
import type { Locale } from '@/locales/translations';

type OrdersRequestParams = {
  lang?: Locale;
  page?: number;
  pageSize?: number;
};

const OrderService = {
  getOrders: async (
    params?: OrdersRequestParams
  ): Promise<OrdersPaginatedResponse> => {
    const response = await apiClient.get<unknown>(API_ROUTES.ORDERS, {
      params,
    });

    return parseResponseWithSchema(
      response,
      ordersPaginatedSchema
    ) as OrdersPaginatedResponse;
  },
};

export default OrderService;
