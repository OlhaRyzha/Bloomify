import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { LocaleProvider } from '@/components/providers/locale-provider';
import { createTestQueryClient } from '@/test/render';

import {
  createProductFiltersResponse,
  createProductItem,
  createProductListResponse,
} from './products.factory';
import ProductsService from './products.service';
import { productsQueryKeys } from './query-keys';
import {
  useGetProductById,
  useGetProductFilters,
  useGetProductList,
  useGetProducts,
} from './use-products';
import { testCatalogParams4 } from '../list/tests/catalog.fixture';

vi.mock('./products.service', () => ({
  default: {
    createProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getProductById: vi.fn(),
    getProductFilters: vi.fn(),
    getProductList: vi.fn(),
    getProducts: vi.fn(),
    updateProduct: vi.fn(),
  },
}));

const createWrapper = (locale: 'en' | 'uk' | 'pl' = 'en') => {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
    </QueryClientProvider>
  );

  return { queryClient, Wrapper };
};

describe('use-products hooks', () => {
  beforeEach(() => {
    vi.mocked(ProductsService.getProducts).mockReset();
    vi.mocked(ProductsService.getProductList).mockReset();
    vi.mocked(ProductsService.getProductFilters).mockReset();
    vi.mocked(ProductsService.getProductById).mockReset();
  });

  test('loads products with locale-aware query key and request params', async () => {
    const products = [createProductItem({ id: 'rose-bouquet' })];
    vi.mocked(ProductsService.getProducts).mockResolvedValue(products);
    const { queryClient, Wrapper } = createWrapper('pl');

    const { result } = renderHook(() => useGetProducts(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ProductsService.getProducts).toHaveBeenCalledWith({ lang: 'pl' });
    expect(queryClient.getQueryData(productsQueryKeys.list('pl'))).toEqual(
      products
    );
  });

  test('loads paginated products with params in query key', async () => {
    const productList = createProductListResponse({
      items: [createProductItem({ id: 'white-harmony' })],
    });
    vi.mocked(ProductsService.getProductList).mockResolvedValue(productList);
    const { queryClient, Wrapper } = createWrapper('en');

    const { result } = renderHook(() => useGetProductList(testCatalogParams4), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ProductsService.getProductList).toHaveBeenCalledWith({
      ...testCatalogParams4,
      lang: 'en',
    });
    expect(
      queryClient.getQueryData(
        productsQueryKeys.paginatedList('en', testCatalogParams4)
      )
    ).toEqual(productList);
  });

  test('loads product filters with locale-aware query key', async () => {
    const filters = createProductFiltersResponse(['classic']);
    vi.mocked(ProductsService.getProductFilters).mockResolvedValue(filters);
    const { queryClient, Wrapper } = createWrapper('uk');

    const { result } = renderHook(() => useGetProductFilters(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ProductsService.getProductFilters).toHaveBeenCalledWith({
      lang: 'uk',
    });
    expect(queryClient.getQueryData(productsQueryKeys.filters('uk'))).toEqual(
      filters
    );
  });

  test('loads product details with id and locale request params', async () => {
    const product = createProductItem({ id: 'white-harmony' });
    vi.mocked(ProductsService.getProductById).mockResolvedValue(product);
    const { Wrapper } = createWrapper('uk');

    const { result } = renderHook(() => useGetProductById('white-harmony'), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ProductsService.getProductById).toHaveBeenCalledWith(
      'white-harmony',
      { lang: 'uk' }
    );
  });

  test('does not load product details when id is empty', async () => {
    const { result } = renderHook(() => useGetProductById(''), {
      wrapper: createWrapper('en').Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(ProductsService.getProductById).not.toHaveBeenCalled();
  });
});
