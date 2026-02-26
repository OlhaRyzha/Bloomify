import { fetchVoidResponse, safeFetch } from '@/utils/api/safe-fetch';
import apiClient from '../clients/BaseService';
import {
  catalogItemSchema,
  catalogSchema,
  type ProductItem,
  type Products,
} from '@/schemas/products.shemas';
import { API_ROUTES } from '@/constants/api.constant';

const ProductsService = {
  getProducts: (): Promise<Products> =>
    safeFetch(apiClient.get<Products>(API_ROUTES.PRODUCTS), catalogSchema),

  getProductById: (id: string): Promise<ProductItem> =>
    safeFetch(
      apiClient.get<ProductItem>(`${API_ROUTES.PRODUCTS}/${id}`),
      catalogItemSchema
    ),

  createProduct: (payload: ProductItem): Promise<ProductItem> =>
    safeFetch(
      apiClient.post<ProductItem, ProductItem>(API_ROUTES.PRODUCTS, payload),
      catalogItemSchema
    ),

  updateProduct: (
    id: string,
    payload: Partial<ProductItem>
  ): Promise<ProductItem> =>
    safeFetch(
      apiClient.put<ProductItem, Partial<ProductItem>>(
        `${API_ROUTES.PRODUCTS}/${id}`,
        payload
      ),
      catalogItemSchema
    ),

  deleteProduct: async (id: string): Promise<void> => {
    await fetchVoidResponse(apiClient.delete(`${API_ROUTES.PRODUCTS}/${id}`));
  },
};

export default ProductsService;
