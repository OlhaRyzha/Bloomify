import { fetchVoidResponse, safeFetch } from '@/utils/api/safe-fetch';
import apiClient from '../clients/BaseService';
import {
  catalogItemSchema,
  catalogSchema,
  type ProductItem,
  type Products,
} from '@/schemas/products.shemas';
import { API_ROUTES } from '@/constants/api.constant';
import { catalogItems } from '@/features/catalog/catalog-items';
import type { CatalogItem } from '@/types/catalog';
import { isString } from '@/utils/guards/is-string';

const mapCatalogItemToProduct = (item: CatalogItem): ProductItem => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  imageUrl: isString(item.image) ? item.image : item.image.src,
  tag: item.tag,
});

const mockProducts = catalogItems.map(mapCatalogItemToProduct);

const ProductsService = {
  getProducts: (): Promise<Products> =>
    safeFetch(Promise.resolve(mockProducts), catalogSchema),

  getProductById: (id: string): Promise<ProductItem> =>
    safeFetch(
      Promise.resolve(mockProducts.find((item) => item.id === id)),
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
