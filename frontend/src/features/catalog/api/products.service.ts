import { API_ROUTES } from '@/constants/api.constant';
import type { Locale } from '@/locales/translations';
import apiClient from '@/services/api/clients/api-client';
import type { AxiosRequestConfig } from 'axios';
import {
  catalogFiltersSchema,
  catalogItemSchema,
  catalogListSchema,
  catalogSchema,
  type ProductFilters,
  type ProductItem,
  type ProductList,
  type Products,
} from '@/features/catalog/api/products.shemas';
import { parseResponseWithSchema } from '@/services/api/request/safe-fetch';
import type { CatalogQueryParams } from '../list/types';

type ProductsRequestParams = {
  lang?: Locale;
};

type ProductListRequestParams = ProductsRequestParams & CatalogQueryParams;

type ProductsRequestConfig = Omit<AxiosRequestConfig, 'params'>;

const ProductsService = {
  getProducts: async (
    params?: ProductsRequestParams,
    config?: ProductsRequestConfig
  ): Promise<Products> => {
    const response = await apiClient.get<Products>(API_ROUTES.PRODUCTS, {
      ...config,
      params,
    });

    return parseResponseWithSchema(response, catalogSchema);
  },

  getProductList: async (
    params: ProductListRequestParams,
    config?: ProductsRequestConfig
  ): Promise<ProductList> => {
    const response = await apiClient.get<ProductList>(API_ROUTES.PRODUCTS, {
      ...config,
      params: {
        lang: params.lang,
        page: params.page,
        pageSize: params.perPage,
        search: params.search,
        sort: params.sort,
        tag: params.tag,
      },
    });

    return parseResponseWithSchema(response, catalogListSchema);
  },

  getProductFilters: async (
    params?: ProductsRequestParams,
    config?: ProductsRequestConfig
  ): Promise<ProductFilters> => {
    const response = await apiClient.get<ProductFilters>(
      API_ROUTES.PRODUCT_FILTERS,
      { ...config, params }
    );

    return parseResponseWithSchema(response, catalogFiltersSchema);
  },

  getProductById: (
    id: string,
    params?: ProductsRequestParams,
    config?: ProductsRequestConfig
  ): Promise<ProductItem> =>
    apiClient
      .get<ProductItem>(`${API_ROUTES.PRODUCTS}/${id}`, {
        ...config,
        params,
      })
      .then((response) => parseResponseWithSchema(response, catalogItemSchema)),

  createProduct: (payload: ProductItem): Promise<ProductItem> =>
    apiClient
      .post<ProductItem, ProductItem>(API_ROUTES.PRODUCTS, payload)
      .then((response) => parseResponseWithSchema(response, catalogItemSchema)),

  updateProduct: (
    id: string,
    payload: Partial<ProductItem>
  ): Promise<ProductItem> =>
    apiClient
      .put<
        ProductItem,
        Partial<ProductItem>
      >(`${API_ROUTES.PRODUCTS}/${id}`, payload)
      .then((response) => parseResponseWithSchema(response, catalogItemSchema)),

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.deleteVoid(`${API_ROUTES.PRODUCTS}/${id}`);
  },
};

export default ProductsService;
