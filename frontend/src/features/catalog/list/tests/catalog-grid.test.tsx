import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/test/api-url';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/msw/server';

import {
  createProductFiltersResponse,
  createProductItem,
  createProductListResponse,
} from '../../api/products.factory';
import CatalogGrid from '../catalog-grid';
import { resetCatalogStore } from './catalog.test-utils';
import { testProductItem1, testProductItem2 } from './catalog.fixture';
import { DEFAULT_SORT } from '../catalog.config';

const createCatalogProducts = () => [
  createProductItem(testProductItem1),
  createProductItem(testProductItem2),
];

const mockCatalogApi = (items = createCatalogProducts()) => {
  server.use(
    http.get(apiUrl('products/filters'), () =>
      HttpResponse.json(createProductFiltersResponse(['roses', 'white']))
    ),
    http.get(apiUrl('products'), ({ request }) => {
      const params = new URL(request.url).searchParams;
      const search = params.get('search')?.toLowerCase() ?? '';
      const sort = params.get('sort') ?? DEFAULT_SORT;

      const serverFilteredItems = search
        ? items.filter((item) =>
            `${item.name} ${item.description ?? ''}`
              .toLowerCase()
              .includes(search)
          )
        : items;

      const serverSortedItems =
        sort === 'price-asc'
          ? [...serverFilteredItems].sort(
              (a, b) => Number(a.price) - Number(b.price)
            )
          : serverFilteredItems;

      return HttpResponse.json(
        createProductListResponse({ items: serverSortedItems })
      );
    })
  );
};

describe('CatalogGrid', () => {
  beforeEach(() => {
    resetCatalogStore();
  });

  test('filters visible bouquets by search text', async () => {
    mockCatalogApi();

    const { user } = renderWithProviders(<CatalogGrid />, {
      locale: 'en',
    });

    expect(await screen.findByText('Rose bouquet')).toBeInTheDocument();
    expect(await screen.findByText('White harmony')).toBeInTheDocument();

    await user.type(
      screen.getByRole('searchbox', { name: /search catalog/i }),
      'white'
    );

    await waitFor(() => {
      expect(screen.queryByText('Rose bouquet')).not.toBeInTheDocument();
    });

    expect(screen.getByText('White harmony')).toBeInTheDocument();
  });

  test('shows empty state when filters match no bouquets', async () => {
    mockCatalogApi();

    const { user } = renderWithProviders(<CatalogGrid />, {
      locale: 'en',
    });

    await user.type(
      screen.getByRole('searchbox', { name: /search catalog/i }),
      'orchid'
    );

    expect(
      await screen.findByRole('heading', { name: /no bouquets found/i })
    ).toBeInTheDocument();

    expect(screen.queryByText('Rose bouquet')).not.toBeInTheDocument();
  });

  test('opens sort menu and applies selected order', async () => {
    mockCatalogApi();

    const { user } = renderWithProviders(<CatalogGrid />, {
      locale: 'en',
    });

    await user.click(screen.getByRole('combobox', { name: /sort/i }));

    expect(
      await screen.findByRole('option', { name: /price: low to high/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('option', { name: /price: low to high/i })
    );

    await waitFor(() => {
      const productHeadings = screen.getAllByRole('heading', { level: 3 });

      expect(productHeadings[0]).toHaveTextContent('White harmony');
      expect(productHeadings[1]).toHaveTextContent('Rose bouquet');
    });
  });

  test('shows error state when catalog query fails', async () => {
    server.use(
      http.get(apiUrl('products'), () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 })
      )
    );

    renderWithProviders(<CatalogGrid />, {
      locale: 'en',
    });

    expect(
      await screen.findByRole('heading', { name: /could not load bouquets/i })
    ).toBeInTheDocument();
  });
});
