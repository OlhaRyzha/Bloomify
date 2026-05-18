import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { createProductItem } from '@/features/catalog/api/products.factory';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import CartFeature from './cart';
import { useCartStore } from './store/cart.store';

const apiUrl = (path: string) => `http://localhost:8000/${path}`;

const resetCartStore = () => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
};

const mockProducts = () => {
  server.use(
    http.get(apiUrl('products'), () =>
      HttpResponse.json([
        createProductItem({
          id: 'rose-bouquet',
          name: 'Rose bouquet',
          price: 1750,
        }),
      ])
    )
  );
};

describe('CartFeature', () => {
  beforeEach(() => {
    resetCartStore();
  });

  test('shows the empty cart state when no items are selected', async () => {
    mockProducts();

    renderWithProviders(<CartFeature />, { locale: 'en' });

    expect(
      await screen.findByRole('heading', { name: /your cart is still empty/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /visit the catalog/i })
    ).toHaveAttribute('href', '/en/catalog');
  });

  test('updates item quantity and clears the cart', async () => {
    mockProducts();
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 1 }] });

    const { user } = renderWithProviders(<CartFeature />, { locale: 'en' });

    expect(await screen.findByText('Rose bouquet')).toBeInTheDocument();
    expect(screen.getByText('In cart 1 bouquets')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /increase rose bouquet quantity/i })
    );

    await waitFor(() => {
      expect(screen.getByText('In cart 2 bouquets')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /clear cart/i }));

    expect(
      await screen.findByRole('heading', { name: /your cart is still empty/i })
    ).toBeInTheDocument();
  });
});
