import { API_ROUTES } from '@/constants/api.constant';
import type { Locale } from '@/locales/translations';
import apiClient from '@/services/api/clients/api-client';
import {
  catalogItemSchema,
  catalogSchema,
  type ProductItem,
  type Products,
} from '@/features/catalog/api/products.shemas';
import { parseResponseWithSchema } from '@/services/api/request/safe-fetch';

type ProductsRequestParams = {
  lang?: Locale;
};

const ProductsService = {
  getProducts: async (params?: ProductsRequestParams): Promise<Products> => {
    const response = await apiClient.get<Products>(API_ROUTES.PRODUCTS, {
      params,
    });

    return parseResponseWithSchema(response, catalogSchema);
  },

  getProductById: (
    id: string,
    params?: ProductsRequestParams
  ): Promise<ProductItem> =>
    apiClient
      .get<ProductItem>(`${API_ROUTES.PRODUCTS}/${id}`, { params })
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
