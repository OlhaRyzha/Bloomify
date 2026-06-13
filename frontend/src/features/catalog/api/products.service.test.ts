import { http, HttpResponse } from 'msw';
import { describe, expect, test, vi } from 'vitest';

import { ApiError, ApiErrorType } from '@/services/api/errors/api-error';
import { server } from '@/test/msw/server';
import { apiUrl } from '@/test/api-url';

import ProductsService from './products.service';
import {
  createProductFiltersResponse,
  createProductItem,
  createProductListResponse,
} from './products.factory';
import { testCatalogParams4 } from '../list/tests/catalog.fixture';

describe('ProductsService', () => {
  test('loads products through the API boundary with locale params', async () => {
    const products = [
      createProductItem({ id: 'rose-bouquet' }),
      createProductItem({ id: 'white-harmony', name: 'White harmony' }),
    ];

    server.use(
      http.get(apiUrl('products'), ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('lang')).toBe('en');

        return HttpResponse.json(products);
      })
    );

    await expect(ProductsService.getProducts({ lang: 'en' })).resolves.toEqual(
      products
    );
  });

  test('adds the current route locale when locale params are omitted', async () => {
    window.history.pushState({}, '', '/uk/catalog');

    const products = [createProductItem({ id: 'locale-aware-bouquet' })];

    server.use(
      http.get(apiUrl('products'), ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('lang')).toBe('uk');

        return HttpResponse.json(products);
      })
    );

    await expect(ProductsService.getProducts()).resolves.toEqual(products);
  });

  test('loads paginated product list with server-side params', async () => {
    const productList = createProductListResponse({
      items: [createProductItem({ id: 'white-harmony' })],
      total: 1,
    });

    server.use(
      http.get(apiUrl('products'), ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('lang')).toBe('en');
        expect(url.searchParams.get('page')).toBe('2');
        expect(url.searchParams.get('pageSize')).toBe('9');
        expect(url.searchParams.get('search')).toBe('white');
        expect(url.searchParams.get('sort')).toBe('price-asc');
        expect(url.searchParams.get('tag')).toBe('classic');

        return HttpResponse.json(productList);
      })
    );

    await expect(
      ProductsService.getProductList(testCatalogParams4)
    ).resolves.toEqual(productList);
  });

  test('loads product filters with locale params', async () => {
    const filters = createProductFiltersResponse(['classic']);

    server.use(
      http.get(apiUrl('products/filters'), ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('lang')).toBe('uk');

        return HttpResponse.json(filters);
      })
    );

    await expect(
      ProductsService.getProductFilters({ lang: 'uk' })
    ).resolves.toEqual(filters);
  });

  test('loads a product by id', async () => {
    const product = createProductItem({ id: 'white-harmony' });

    server.use(
      http.get(apiUrl('products/:id'), ({ params, request }) => {
        const url = new URL(request.url);

        expect(params.id).toBe('white-harmony');
        expect(url.searchParams.get('lang')).toBe('pl');

        return HttpResponse.json(product);
      })
    );

    await expect(
      ProductsService.getProductById('white-harmony', { lang: 'pl' })
    ).resolves.toEqual(product);
  });

  test('normalizes invalid API data into ApiError', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    server.use(
      http.get(apiUrl('products'), () =>
        HttpResponse.json([{ id: 'broken-product', name: 'Broken product' }])
      )
    );

    await expect(ProductsService.getProducts({ lang: 'uk' })).rejects.toEqual(
      expect.objectContaining({
        type: ApiErrorType.Validation,
      }) satisfies Partial<ApiError>
    );

    consoleErrorSpy.mockRestore();
  });
});
