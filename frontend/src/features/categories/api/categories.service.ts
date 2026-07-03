import type { AxiosRequestConfig } from 'axios';

import { API_ROUTES } from '@/constants/api.constant';
import {
  categoryDetailSchema,
  categoryListSchema,
  type CategoryDetail,
  type CategoryList,
} from '@/features/categories/api/categories.schemas';
import type { Locale } from '@/locales/translations';
import apiClient from '@/services/api/clients/api-client';
import { parseResponseWithSchema } from '@/services/api/request/safe-fetch';

type CategoriesRequestParams = {
  lang?: Locale;
};

type CategoriesRequestConfig = Omit<AxiosRequestConfig, 'params'>;

const CategoriesService = {
  getCategories: async (
    params?: CategoriesRequestParams,
    config?: CategoriesRequestConfig
  ): Promise<CategoryList> => {
    const response = await apiClient.get<CategoryList>(API_ROUTES.CATEGORIES, {
      ...config,
      params,
    });

    return parseResponseWithSchema(response, categoryListSchema);
  },

  getCategoryBySlug: async (
    slug: string,
    params?: CategoriesRequestParams,
    config?: CategoriesRequestConfig
  ): Promise<CategoryDetail> => {
    const response = await apiClient.get<CategoryDetail>(
      API_ROUTES.CATEGORY_DETAIL(slug),
      { ...config, params }
    );

    return parseResponseWithSchema(response, categoryDetailSchema);
  },
};

export default CategoriesService;
