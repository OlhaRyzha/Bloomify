import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { createProductItem } from './api/products.factory';
import CatalogGrid from './catalog-grid';
import { useCatalogStore } from './store/catalog.store';

const resetCatalogStore = () => {
  useCatalogStore.setState({
    page: 1,
    perPage: 6,
    search: '',
    sort: 'default',
    tag: 'all',
  });
  window.history.pushState({}, '', '/catalog');
};

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
});
