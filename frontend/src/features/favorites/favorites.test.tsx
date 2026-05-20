import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { createProductItem } from '@/features/catalog/api/products.factory';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import FavoritesFeature from './favorites';
import { useFavoritesStore } from './store/favorites.store';

const apiUrl = (path: string) => `http://localhost:8000/${path}`;

const products = [
  createProductItem({
    id: 'rose-bouquet',
    name: 'Rose bouquet',
  }),
  createProductItem({
    id: 'white-harmony',
    name: 'White harmony',
  }),
];

const resetFavoritesStore = () => {
  localStorage.clear();
  useFavoritesStore.setState({ ids: [] });
  window.history.pushState({}, '', '/favorites');
};

const mockProducts = () => {
  server.use(http.get(apiUrl('products'), () => HttpResponse.json(products)));
};

describe('FavoritesFeature', () => {
  beforeEach(() => {
    resetFavoritesStore();
  });

  test('shows the empty favorites state when no bouquets are saved', async () => {
    mockProducts();

    renderWithProviders(<FavoritesFeature />, { locale: 'en' });

    expect(
      await screen.findByRole('heading', {
        name: /no favorite bouquets yet/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to catalog/i })).toHaveAttribute(
      'href',
      '/en/catalog'
    );
  });

  test('renders only saved favorite bouquets', async () => {
    mockProducts();
    useFavoritesStore.setState({ ids: ['white-harmony'] });

    renderWithProviders(<FavoritesFeature />, { locale: 'en' });

    expect(await screen.findByText('White harmony')).toBeInTheDocument();
    expect(screen.queryByText('Rose bouquet')).not.toBeInTheDocument();
  });
});
