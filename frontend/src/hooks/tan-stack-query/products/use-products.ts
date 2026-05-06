import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import ProductsService from '@/services/api/products/products';
import type { ProductItem, Products } from '@/schemas/products.shemas';
import {
  productsMutationKeys,
  productsQueryKeys,
} from '@/constants/query-keys.constants';
import type { ApiError } from '@/utils/api/api-error';
import { useOptimisticListMutation } from '../use-optimistic-list-mutation';
import { useLocale } from '@/components/providers/locale-provider';

type GetProductsOptions = Omit<
  UseQueryOptions<Products, ApiError>,
  'queryKey' | 'queryFn'
>;

type GetProductOptions = Omit<
  UseQueryOptions<ProductItem, ApiError>,
  'queryKey' | 'queryFn'
>;

const upsertProduct = (items: ProductItem[], product: ProductItem) => {
  const existingIndex = items.findIndex((item) => item.id === product.id);

  if (existingIndex === -1) {
    return [product, ...items];
  }

  return items.map((item) => (item.id === product.id ? product : item));
};

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

  return useOptimisticListMutation<
    ProductItem,
    { item: ProductItem },
    ProductItem
  >({
    queryKey: productsQueryKeys.list(locale),
    mutationKey: productsMutationKeys.create,
    mutationFn: ({ item }) => ProductsService.createProduct(item),
    cache: {
      updateFromResponse: (items, product) => upsertProduct(items, product),
    },
    toast: {
      successMessage: 'Product created',
    },
  });
};

export const useUpdateProduct = () => {
  const { locale } = useLocale();

  return useOptimisticListMutation<
    ProductItem,
    { id: string; payload: Partial<ProductItem> },
    ProductItem
  >({
    queryKey: productsQueryKeys.list(locale),
    mutationKey: productsMutationKeys.update,
    mutationFn: ({ id, payload }) => ProductsService.updateProduct(id, payload),
    cache: {
      optimisticUpdate: (items, { id, payload }) =>
        items.map((item) => (item.id === id ? { ...item, ...payload } : item)),
      updateFromResponse: (items, product) => upsertProduct(items, product),
    },
    toast: {
      successMessage: 'Product updated',
    },
  });
};

export const useDeleteProduct = () => {
  const { locale } = useLocale();

  return useOptimisticListMutation<ProductItem, { id: string }, void>({
    queryKey: productsQueryKeys.list(locale),
    mutationKey: productsMutationKeys.delete,
    mutationFn: ({ id }) => ProductsService.deleteProduct(id),
    cache: {
      optimisticUpdate: (items, { id }) =>
        items.filter((item) => item.id !== id),
    },
    toast: {
      successMessage: 'Product deleted',
    },
  });
};
