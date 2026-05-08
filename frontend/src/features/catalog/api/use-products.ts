import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useLocale } from '@/components/providers/locale-provider';
import {
  OPTIMISTIC_LIST_MUTATION_ACTIONS,
  useOptimisticListMutation,
} from '@/shared/query/use-optimistic-list-mutation';
import { useTranslation } from '@/hooks/use-translation';
import type { ProductItem, Products } from '@/schemas/products.shemas';
import type { ApiError } from '@/utils/api/api-error';
import ProductsService from './products.service';
import { productsQueryKeys } from './query-keys';

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
    queryFn: () => ProductsService.getProducts({ lang: locale }),
    ...options,
  });
};

export const useGetProductById = (id: string, options?: GetProductOptions) => {
  const { locale } = useLocale();

  return useQuery<ProductItem, ApiError>({
    queryKey: productsQueryKeys.detail(id, locale),
    queryFn: () => ProductsService.getProductById(id, { lang: locale }),
    enabled: Boolean(id),
    ...options,
  });
};

export const useCreateProduct = () => {
  const { locale } = useLocale();
  const { t } = useTranslation();

  return useOptimisticListMutation<
    ProductItem,
    { item: ProductItem },
    ProductItem
  >({
    queryKey: productsQueryKeys.list(locale),
    action: OPTIMISTIC_LIST_MUTATION_ACTIONS.CREATE,
    mutationFn: ({ item }) => ProductsService.createProduct(item),
    options: {
      toast: {
        showSuccessToast: true,
        successMessage: t('product_mutation_created_success'),
      },
    },
  });
};

export const useUpdateProduct = () => {
  const { locale } = useLocale();
  const { t } = useTranslation();

  return useOptimisticListMutation<
    ProductItem,
    { id: string; payload: Partial<ProductItem> },
    ProductItem
  >({
    queryKey: productsQueryKeys.list(locale),
    action: OPTIMISTIC_LIST_MUTATION_ACTIONS.UPDATE,
    mutationFn: ({ id, payload }) => ProductsService.updateProduct(id, payload),
    options: {
      toast: {
        showSuccessToast: true,
        successMessage: t('product_mutation_updated_success'),
      },
    },
  });
};

export const useDeleteProduct = () => {
  const { locale } = useLocale();
  const { t } = useTranslation();

  return useOptimisticListMutation<ProductItem, { id: string }, void>({
    queryKey: productsQueryKeys.list(locale),
    action: OPTIMISTIC_LIST_MUTATION_ACTIONS.DELETE,
    mutationFn: ({ id }) => ProductsService.deleteProduct(id),
    options: {
      updateFromResponse: false,
      toast: {
        showSuccessToast: true,
        successMessage: t('product_mutation_deleted_success'),
      },
    },
  });
};
