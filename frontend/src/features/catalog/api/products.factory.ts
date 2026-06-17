import type {
  ProductFilters,
  ProductItem,
  ProductList,
} from '@/features/catalog/api/products.shemas';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '../list/catalog.config';

export const createProductItem = (
  overrides: Partial<ProductItem> = {}
): ProductItem => ({
  id: 'rose-bouquet',
  name: 'Rose bouquet',
  description: 'Fresh roses and seasonal greenery.',
  price: '1750',
  discountedPrice: null,
  isSale: false,
  imageUrl: '/images/rose-bouquet.jpg',
  tag: 'roses',
  ...overrides,
});

export const createProductListResponse = (
  overrides: Partial<ProductList> = {}
): ProductList => {
  const items = overrides.items ?? [createProductItem()];
  const pageSize = overrides.pageSize ?? DEFAULT_PER_PAGE;
  const total = overrides.total ?? items.length;

  return {
    items,
    page: overrides.page ?? DEFAULT_PAGE,
    pageSize,
    total,
    totalPages:
      overrides.totalPages ??
      Math.max(DEFAULT_PAGE, Math.ceil(total / pageSize)),
    hasNextPage: overrides.hasNextPage ?? total > pageSize,
    nextPage: overrides.nextPage ?? (total > pageSize ? 2 : null),
  };
};

export const createProductFiltersResponse = (
  tags: string[] = ['roses']
): ProductFilters => ({
  tags,
});
