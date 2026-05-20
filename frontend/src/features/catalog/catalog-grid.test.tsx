import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { renderWithProviders } from '@/test/render';
import { server } from '@/test/msw/server';
import { apiUrl } from '@/test/api-url';
import { http, HttpResponse } from 'msw';

import { createProductItem } from './api/products.factory';
import CatalogGrid from './catalog-grid';
import { resetCatalogStore } from './catalog.test-utils';

describe('CatalogGrid', () => {
  beforeEach(() => {
    resetCatalogStore();
  });

  test('filters visible bouquets by search text', async () => {
    const items = [
      createProductItem({
        id: 'rose-bouquet',
        name: 'Rose bouquet',
        description: 'Fresh roses and seasonal greenery.',
      }),
      createProductItem({
        id: 'white-harmony',
        name: 'White harmony',
        description: 'White lilies and eucalyptus.',
      }),
    ];

    const { user } = renderWithProviders(<CatalogGrid items={items} />, {
      locale: 'en',
    });

    expect(screen.getByText('Rose bouquet')).toBeInTheDocument();
    expect(screen.getByText('White harmony')).toBeInTheDocument();

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
    const items = [
      createProductItem({
        id: 'rose-bouquet',
        name: 'Rose bouquet',
        description: 'Fresh roses and seasonal greenery.',
      }),
    ];

    const { user } = renderWithProviders(<CatalogGrid items={items} />, {
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
