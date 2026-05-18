import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { createProductItem } from '@/features/catalog/api/products.factory';
import { useCartStore } from '@/features/cart/store/cart.store';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import CheckoutFeature from './checkout';

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

describe('CheckoutFeature', () => {
  beforeEach(() => {
    resetCartStore();
  });

  test('shows empty checkout state when the cart has no items', async () => {
    mockProducts();

    renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    expect(
      await screen.findByRole('heading', { name: /your checkout is empty/i })
    ).toBeInTheDocument();
  });

  test('renders order summary and card fields when card payment is selected', async () => {
    mockProducts();
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 2 }] });

    const { user } = renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    expect(await screen.findByText('Rose bouquet')).toBeInTheDocument();
    expect(screen.getByText(/2 x 1,750/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /apple pay/i })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /payment on delivery/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/payments are processed securely by liqpay/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /^card/i }));

    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cvc/i)).toBeInTheDocument();
  });

  test('shows localized card validation messages', async () => {
    mockProducts();
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 1 }] });

    const { user } = renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    await screen.findByText('Rose bouquet');
    await user.click(screen.getByRole('radio', { name: /^card/i }));
    await user.click(screen.getByRole('button', { name: /pay for order/i }));

    expect(await screen.findByText('Enter the card number.')).toBeInTheDocument();
    expect(screen.getByText('Enter the card expiry date.')).toBeInTheDocument();
    expect(screen.getByText('Enter the CVC.')).toBeInTheDocument();
  });
});
