import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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

const mockCheckout = () => {
  server.use(
    http.post(apiUrl('orders/checkout'), () =>
      HttpResponse.json(
        {
          orderId: 1,
          status: 'pending',
          paymentStatus: 'pending',
          paymentProvider: 'liqpay',
          paymentMethod: 'card',
          liqpay: {
            checkoutUrl: 'https://www.liqpay.ua/api/3/checkout',
            data: 'encoded-data',
            signature: 'encoded-signature',
          },
        },
        { status: 201 }
      )
    )
  );
};

describe('CheckoutFeature', () => {
  beforeEach(() => {
    resetCartStore();
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
  });

  test('shows empty checkout state when the cart has no items', async () => {
    mockProducts();

    renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    expect(
      await screen.findByRole('heading', { name: /your checkout is empty/i })
    ).toBeInTheDocument();
  });

  test('renders order summary and hosted payment method choices', async () => {
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

    expect(screen.getByRole('radio', { name: /^card/i })).toBeChecked();
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cvc/i)).not.toBeInTheDocument();
  });

  test('redirects card payments to hosted LiqPay checkout', async () => {
    mockProducts();
    mockCheckout();
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 1 }] });

    const { user } = renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    await screen.findByText('Rose bouquet');
    await user.type(screen.getByLabelText(/full name/i), 'Tom Smith');
    await user.type(screen.getByLabelText(/phone/i), '+380671234567');
    await user.type(screen.getByLabelText(/email/i), 'tom@example.com');
    await user.clear(screen.getByLabelText(/city/i));
    await user.type(screen.getByLabelText(/city/i), 'Kyiv');
    await user.type(
      screen.getByLabelText(/delivery address/i),
      'Khreshchatyk 1'
    );
    await user.click(screen.getByRole('radio', { name: /^card/i }));
    await user.click(screen.getByRole('button', { name: /pay for order/i }));

    expect(
      await screen.findByText('Redirecting to LiqPay test payment.')
    ).toBeInTheDocument();
  });
});
