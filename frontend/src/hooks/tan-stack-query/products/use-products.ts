import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import ProductsService from '@/services/api/products/products';
import type { ProductItem, Products } from '@/schemas/products.shemas';
import {
  PRODUCT_QUERY_KEY,
  PRODUCTS_QUERY_KEY,
} from '@/constants/query-keys.constants';
import type { ApiError } from '@/utils/api/api-error';
import {
  MUTATION_ACTIONS,
  useMutateItemWithOptimisticUpdate,
} from '../use-mutate-item-with-optimistic-update';

type GetProductsOptions = Omit<
  UseQueryOptions<Products, ApiError>,
  'queryKey' | 'queryFn'
>;

export const useGetProducts = (options?: GetProductsOptions) =>
  useQuery<Products, ApiError>({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: () => ProductsService.getProducts(),
    ...options,
  });

export const useGetProductById = (id: string) =>
  useQuery<ProductItem>({
    queryKey: [...PRODUCT_QUERY_KEY, id],
    queryFn: () => ProductsService.getProductById(id),
    enabled: Boolean(id),
  });

export const useCreateProduct = () =>
  useMutateItemWithOptimisticUpdate<ProductItem, { item: ProductItem }>({
    queryKey: PRODUCTS_QUERY_KEY,
    action: MUTATION_ACTIONS.CREATE,
    mutateFn: ({ item }) => ProductsService.createProduct(item),
  });

export const useUpdateProduct = () =>
  useMutateItemWithOptimisticUpdate<
    ProductItem,
    { id: string; payload: Partial<ProductItem> }
  >({
    queryKey: PRODUCTS_QUERY_KEY,
    action: MUTATION_ACTIONS.UPDATE,
    mutateFn: ({ id, payload }) => ProductsService.updateProduct(id, payload),
  });

export const useDeleteProduct = () =>
  useMutateItemWithOptimisticUpdate<ProductItem, { id: string }>({
    queryKey: PRODUCTS_QUERY_KEY,
    action: MUTATION_ACTIONS.DELETE,
    mutateFn: ({ id }) => ProductsService.deleteProduct(id),
  });
