import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import ProductsService from '@/services/api/products/products';
import type { ProductItem, Products } from '@/schemas/products.shemas';
import { productsQueryKeys } from '@/constants/query-keys.constants';
import type { ApiError } from '@/utils/api/api-error';
import {
  MUTATION_ACTIONS,
  useMutateItemWithOptimisticUpdate,
} from '../use-mutate-item-with-optimistic-update';
import { useLocale } from '@/components/providers/locale-provider';

type GetProductsOptions = Omit<
  UseQueryOptions<Products, ApiError>,
  'queryKey' | 'queryFn'
>;

type GetProductOptions = Omit<
  UseQueryOptions<ProductItem, ApiError>,
  'queryKey' | 'queryFn'
>;

export const useGetProducts = (options?: GetProductsOptions) => {
  const { locale } = useLocale();

  return useQuery<Products, ApiError>({
    queryKey: productsQueryKeys.list(locale),
    queryFn: () => ProductsService.getProducts(),
    ...options,
  });
};

export const useGetProductById = (id: string, options?: GetProductOptions) => {
  const { locale } = useLocale();

  return useQuery<ProductItem, ApiError>({
    queryKey: productsQueryKeys.detail(id, locale),
    queryFn: () => ProductsService.getProductById(id),
    enabled: Boolean(id),
    ...options,
  });
};

export const useCreateProduct = () => {
  const { locale } = useLocale();

  return useMutateItemWithOptimisticUpdate<ProductItem, { item: ProductItem }>({
    queryKey: productsQueryKeys.list(locale),
    action: MUTATION_ACTIONS.CREATE,
    mutateFn: ({ item }) => ProductsService.createProduct(item),
  });
};

export const useUpdateProduct = () => {
  const { locale } = useLocale();

  return useMutateItemWithOptimisticUpdate<
    ProductItem,
    { id: string; payload: Partial<ProductItem> }
  >({
    queryKey: productsQueryKeys.list(locale),
    action: MUTATION_ACTIONS.UPDATE,
    mutateFn: ({ id, payload }) => ProductsService.updateProduct(id, payload),
  });
};

export const useDeleteProduct = () => {
  const { locale } = useLocale();

  return useMutateItemWithOptimisticUpdate<ProductItem, { id: string }>({
    queryKey: productsQueryKeys.list(locale),
    action: MUTATION_ACTIONS.DELETE,
    mutateFn: ({ id }) => ProductsService.deleteProduct(id),
  });
};
